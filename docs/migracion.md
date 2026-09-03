# Guía de migración

Mapeo símbolo a símbolo de las versiones antiguas de la librería a `@callepuzzle/*`. Está
escrita para los dos consumidores reales:

- **`y-tu-que-compras`** — dependía de `"storybook-svelte": "link:storybook-svelte"`, un nombre de
  paquete que ya no existe y un `bun link` que solo funciona en la máquina que lo registró. Es el
  más fácil: tiene poco código propio.
- **`donde-esta-tu-local`** — **no** dependía del repo: copió el código y siguió evolucionándolo,
  así que su versión de los componentes está por delante de la librería vieja. Su migración es
  sustituir sus componentes locales por los de la librería, uno a uno.

## 0. Paquetes y dependencias

| Antes                                          | Ahora                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `storybook-svelte` (nombre plano, por `link:`) | `@callepuzzle/core`, `@callepuzzle/auth`, `@callepuzzle/svelte-ui` |
| `@repo/library` (`.`)                          | `@callepuzzle/core`                                                |
| `@repo/library/better-auth`                    | `@callepuzzle/auth/client`, `/server`, `/hooks` (tres subpaths)    |
| `@repo/library/better-auth` → `sender`         | **eliminado**. Usa tu propio transporter                           |
| `@repo/sveltekit-ui`                           | `@callepuzzle/svelte-ui` (+ subpath `./otp`)                       |
| `@repo/tailwind-config`                        | **eliminado**. Absorbido en `@callepuzzle/svelte-ui/styles.css`    |
| `@repo/database`                               | **eliminado**. Cada app tiene su esquema                           |

```diff
-    "storybook-svelte": "link:storybook-svelte"
+    "@callepuzzle/core": "^0.1.0",
+    "@callepuzzle/auth": "^0.1.0",
+    "@callepuzzle/svelte-ui": "^0.1.0"
```

Hace falta un `.npmrc` con el registro y un `NPM_TOKEN`: ver
[`instalacion.md`](instalacion.md#1-acceso-a-github-packages).

Peers nuevos que hay que tener instalados: `tailwindcss`, `daisyui`, `@lucide/svelte`,
`better-auth`, `sveltekit-superforms`, `formsnap`, `zod` (y `bits-ui` **solo** si usas el OTP).
`y-tu-que-compras` no tiene hoy `zod`, `sveltekit-superforms` ni `formsnap`: los necesita.

## 1. Auth

### El `Handle`

```diff
 // src/hooks.server.ts
-import { betterAuth } from 'storybook-svelte';
+import { building } from '$app/environment';
+import { betterAuthHandle } from '@callepuzzle/auth/hooks';
 import { auth } from './lib/server/auth.js';

-export const handle: Handle = sequence(betterAuth(auth));
+export const handle: Handle = sequence(betterAuthHandle(auth, building));
```

Tres cambios en una línea: **el nombre** (`betterAuth` → `betterAuthHandle`; `betterAuth` era el
de la librería de better-auth, no el nuestro), **el subpath** (`@callepuzzle/auth/hooks`) y **el
segundo argumento** `building`, que sale de `$app/environment` y no es opcional.

### El cliente

```diff
 // src/lib/auth-client.ts
-import { createAuthClient } from 'better-auth/svelte';
-
-export const authClient = createAuthClient({ … }) as any;
-export const { signIn, signUp, useSession } = authClient;
-export const session = useSession();
+import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
+import { magicLinkClient } from 'better-auth/client/plugins';
+
+export const authClient = createCallepuzzleAuthClient({ plugins: [magicLinkClient()] });
+export type AuthClient = typeof authClient;
```

`export const session = useSession()` era el bug crítico: en SSR el módulo se evalúa una vez por
proceso, así que ese store de sesión era **compartido por todos los usuarios que atendiera el
servidor**. `y-tu-que-compras` tiene una copia idéntica del fichero, con el mismo bug.

| Antes                                    | Ahora                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `createAuthClient({ … }) as any`         | `createCallepuzzleAuthClient(options)` (tipado real, genérico sobre tus plugins) |
| `export const session = useSession()`    | **nada**. La sesión viene por el `load`                                          |
| `type AuthClient` (= `any`)              | `AuthClient` / `CallepuzzleAuthClient` (tipo real) o, mejor, `typeof authClient` |
| `type Session` (= `any`)                 | `Session<O>` o `SessionOf<typeof authClient>`                                    |
| `signIn`, `signUp`, `useSession` sueltos | métodos del cliente que tú instancias                                            |

### El servidor

```diff
-import { getBetterAuth } from '@repo/library/better-auth';
+import { getBetterAuth, magicLinkPreset } from '@callepuzzle/auth/server';

 export const auth = getBetterAuth({
   database: prismaAdapter(db, { provider: 'postgresql' }),
+  plugins: [sveltekitCookies(getRequestEvent), magicLinkPreset(sendMagicLinkEmail)]
 });
```

`getBetterAuth` **ya no trae plugins por defecto**. Antes imponía `magicLink() + organization() +
admin()` y el merge era superficial (pasar tus `plugins` borraba los tres). Si tu app dependía de
esos defaults, ahora los declaras tú:

| Antes (implícito)                           | Ahora (explícito)                                        |
| ------------------------------------------- | -------------------------------------------------------- |
| `magicLink({ sendMagicLink: console.log })` | `magicLinkPreset(send)` — `send` **obligatorio**         |
| `emailOTP({ … })`                           | `emailOtpPreset(send)` — `send` **obligatorio**          |
| `organization()`                            | `organization()` de `better-auth/plugins`, si lo quieres |
| `admin()`                                   | `admin()` de `better-auth/plugins`, si lo quieres        |

Y si ya no quieres `organization()`, revisa tu esquema: sus tablas de organización e invitaciones
estaban en el `schema.prisma` de `@repo/database` sin que nadie las hubiera pedido.

### `App.Locals`

La librería vieja declaraba `App.Locals` por ti en su `app.d.ts` (con tipos sin resolver).
Ahora no. Añade en tu `src/app.d.ts`:

```ts
import type { auth } from '$lib/server/auth';

type AuthSession = typeof auth.$Infer.Session;

declare global {
	namespace App {
		interface Locals {
			session?: AuthSession['session'];
			user?: AuthSession['user'];
		}
	}
}

export {};
```

`donde-esta-tu-local` ya lo tiene así. Alternativa:
`interface Locals extends BetterAuthLocals<typeof auth> {}`, con `BetterAuthLocals` de
`@callepuzzle/auth/hooks`.

Detalle completo en [`auth.md`](auth.md).

## 2. Rutas

### El tipo

```diff
-import { routes as coreRoutes, type Routes } from 'storybook-svelte';
+import type { RouteId } from '$app/types';
+import type { RouteMap } from '@callepuzzle/core';
```

| Antes                                      | Ahora                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `Routes` (`{ [id: string]: Route }`)       | `RouteMap<Id extends string = string>` = `Partial<Record<Id, RouteConfig>>` |
| `Route` (la entrada sin `id`)              | `RouteConfig` (la entrada) / `Route` (`RouteConfig & { id }`)               |
| `routes` (mapa por defecto de la librería) | **no existe**. Cada app declara el suyo entero                              |
| `GetMenuRoutes(routes, authClient)`        | `getMenuRoutes(routes, { mobile? })` — minúscula inicial, sin `authClient`  |
| `name`                                     | `label`                                                                     |
| `url: string \| ((id, …) => string)`       | **no existe**: la **clave del mapa es la ruta**                             |
| `isProtected: boolean`                     | **no existe**: la protección va en `+layout.server.ts`                      |
| `permissions?: Permissions`                | **no existe**: nunca se leyó                                                |
| `showInMenu: boolean` (obligatorio)        | `showInMenu?: boolean` (opcional)                                           |
| —                                          | `short?: string`, `icon?: Component`, `showInMobile?: boolean` (nuevos)     |

### `y-tu-que-compras`: las URLs-función

Este es el cambio con más trabajo. Antes:

```ts
const myRoutes: Routes = {
	home_list: { name: m.routes_home_list(), url: '/home/', isProtected: true, showInMenu: true },
	home_index: {
		name: m.routes_home_index(),
		url: (id: string) => `/home/${id}`,
		isProtected: true,
		showInMenu: false
	},
	grocery_index: {
		name: m.routes_grocery_index(),
		url: (id: string) => `/home/${id}/grocery`,
		isProtected: true,
		showInMenu: false
	}
};

export const routes = { ...coreRoutes, ...myRoutes };
```

Ahora:

```ts
import type { RouteId } from '$app/types';
import type { RouteMap } from '@callepuzzle/core';
import { m } from '$lib/paraglide/messages';

// Función, no `const`: las etiquetas se resuelven en render (ver docs/i18n.md).
export function getRoutes(): RouteMap<RouteId> {
	return {
		'/home': { label: m.routes_home_list(), showInMenu: true }
	};
}
```

Y las dos rutas paramétricas **desaparecen del mapa**: en el modelo nuevo el `RouteMap` es el
**menú de navegación**, y una ruta con parámetro no puede estar en un menú porque no hay nada
que poner en el `href` (es exactamente por eso que la `url` admitía una función y el `Link` de la
librería vieja la rompía). Para enlazar a un detalle concreto, construye el enlace donde tienes
el dato:

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
	let { home }: { home: { id: string; name: string } } = $props();
</script>

<a class="link" href={resolve('/home/[id]', { id: home.id })}>{home.name}</a>
```

Y no hay `{ ...coreRoutes, ...myRoutes }`: la librería ya no trae un mapa por defecto con
`home`/`profile`/`notifications`. Si querías esas entradas, decláralas con su ruta real.

### `donde-esta-tu-local`: el filtro del dock

Su `getMenuRoutes` local hace la **unión**:

```ts
// donde-esta-tu-local/src/lib/routes.ts
.filter(([, route]) => (isMobile && route?.showInMobile) || route?.showInMenu)
```

El de la librería filtra **estricto**:

```ts
// @callepuzzle/core
const visible = opts.mobile === true ? 'showInMobile' : 'showInMenu';
if (config?.[visible] === true) { … }
```

Consecuencia práctica: **cada ruta que deba salir en el menú de escritorio y en el dock móvil
tiene que declarar los dos flags**. Al migrar, repasa el mapa y añade `showInMobile: true` a las
que hoy aparecen en el dock solo porque tienen `showInMenu`. También cambia la firma:
`getMenuRoutes(routes, true)` → `getMenuRoutes(routes, { mobile: true })`.

Y renombra `name` → `label` en las 8 entradas del mapa.

## 3. Estilos

```diff
 /* src/app.css */
-@import 'tailwindcss';
-@source "../node_modules/storybook-svelte";
-@plugin "daisyui";
+@import "@callepuzzle/svelte-ui/styles.css";
+@source "./";
```

La hoja publicada trae `@import "tailwindcss"`, `@plugin "daisyui"` y el `@source` que apunta al
propio paquete, así que **no** tienes que escribir una ruta a `node_modules`: la que tenías
apuntaba además al nombre viejo del paquete y a su raíz en vez de a `dist`.

Si tenías `@import '@repo/tailwind-config'`, bórralo: ese paquete ya no existe y hacía un segundo
`@import "tailwindcss"` y un segundo `@plugin "daisyui"`.

Comprueba tras el build que las clases de la librería se generan:

```bash
grep -c '\.navbar[,{ :]' .svelte-kit/output/client/_app/immutable/assets/*.css   # → 1
```

Detalle en [ADR 0004](adr/0004-daisyui-como-contrato.md).

## 4. Componentes

| Antes                                          | Ahora                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `FormLogin`                                    | `FormLoginMagicLink` (barrel) o `FormLoginOtp` (`@callepuzzle/svelte-ui/otp`)                                                       |
| `Header` (drawer + navbar + app dentro)        | `Header` (solo navbar) + `Drawer` (opcional)                                                                                        |
| `NavBarEnd` con `session` y `FormLogin` dentro | `NavBarEnd` con `user` y snippet `login`                                                                                            |
| `FormFields`, `FormString` con `any`           | genéricos `<T extends Record<string, unknown>>`                                                                                     |
| —                                              | `Dock`, `DockLink`, `Footer`, `ButtonSignOut`, `UserNotLogged`, `FormNumber`, `FormCheckbox`, `FormSelect`, `FormTextarea` (nuevos) |
| `type Locale = 'en' \| 'es'`                   | **eliminado**. `locales?: readonly string[]`, `setLocale?: (locale: string) => void`                                                |
| `m.*()` dentro de la librería                  | prop `strings?: Partial<XStrings>`                                                                                                  |

### `Header`

Antes envolvía la app y recibía las props de `NavBarEnd` por intersección de tipos:

```svelte
<Header title="NavNar Title" {routes} {session} {authClient} {locales} {setLocale}>
	{@render children()}
</Header>
```

Ahora es **solo la navbar**: `title` es un `Snippet` (para poder poner un `<img>`), la zona
derecha entra por el snippet `navEnd`, y la página va fuera:

```svelte
<Header {routes} homeHref="/" strings={headerStrings}>
	{#snippet title()}Mi app{/snippet}
	{#snippet navEnd()}
		<NavBarEnd user={data.user} {authClient} {locales} {setLocale} strings={navBarEndStrings}>
			{#snippet login()}
				<a class="btn btn-sm" href="/login">Entrar</a>
			{/snippet}
		</NavBarEnd>
	{/snippet}
</Header>

{@render children()}
```

De paso: el título era `"NavNar Title"` (typo) tanto en el demo como en `y-tu-que-compras`.

| Prop de `Header`                                                                                   | Antes                    | Ahora                                                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `title`                                                                                            | `string`                 | `Snippet` (obligatorio)                                                                   |
| `routes`                                                                                           | `Routes` (obligatorio)   | `RouteMap` (opcional)                                                                     |
| `children`                                                                                         | la app entera            | **no existe**: la app va fuera                                                            |
| `session`, `authClient`, `userHasNotification`, `notification`, `searcher`, `locales`, `setLocale` | heredadas de `NavBarEnd` | **no existen**: pásalas al `NavBarEnd` que pongas en `navEnd`                             |
| —                                                                                                  | —                        | `homeHref?`, `showBack?`, `menuToggleFor?`, `navEnd?`, `navCenter?`, `class?`, `strings?` |

### Cajón lateral: `Drawer`

El drawer estaba dentro del `Header` con un id fijo. Ahora es un componente aparte que genera su
id con `$props.id()` y lo entrega a su snippet `children`:

```svelte
<Drawer>
	{#snippet children({ drawerId })}
		<Header {routes} menuToggleFor={drawerId}>
			{#snippet title()}Mi app{/snippet}
		</Header>
		{@render pageContent()}
	{/snippet}
	{#snippet side()}
		<NavBarList type="drawer" {routes} />
	{/snippet}
</Drawer>
```

### `NavBarEnd`

| Antes                                                          | Ahora                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `session: Session` (store global, `any`)                       | `user?: SessionUser \| null` (dato plano del `load`)                    |
| `$session?.data ? … : …`                                       | `user ? … : …`                                                          |
| `authClient: AuthClient` (`any`)                               | `authClient?: SignOutClient` (tipado estructural, opcional)             |
| `routes: Routes`                                               | **no existe**: el menú es del `Header`/`NavBarList`                     |
| `FormLogin` embutido + `setTimeout(2000)` para cerrar el modal | snippet `login`: el flujo lo decide el consumidor                       |
| `notification?: boolean`                                       | `notificationsHref?: string` (sin ruta, no se renderiza)                |
| `setLocale: (locale: Locale) => void` (obligatorio)            | `setLocale?: (locale: string) => void`                                  |
| `locales?: Locale[]`                                           | `locales?: readonly string[]`                                           |
| —                                                              | `profileHref?`, `avatar?` (snippet), `menuExtra?` (snippet), `strings?` |

El selector de idioma solo se pinta si `locales.length > 1` **y** `setLocale` está definido.

### `FormLogin` → `FormLoginMagicLink` / `FormLoginOtp`

Se partió en dos porque los dos consumidores usan flujos distintos y ambos son legítimos.

```diff
-import { FormLogin } from '@repo/sveltekit-ui';
+import { FormLoginMagicLink } from '@callepuzzle/svelte-ui';
+// o, para OTP de 6 dígitos:
+import { FormLoginOtp } from '@callepuzzle/svelte-ui/otp';
```

- `FormLoginMagicLink`: `{ authClient: MagicLinkClient; schema?; callbackURL?; debug?; onSuccess? }`.
- `FormLoginOtp`: `{ authClient: EmailOtpClient; schema?; debug?; onSuccess?; startOverHref? }`.
  **Necesita `bits-ui` instalado** (peer opcional).
- Ninguno llama a `invalidateAll()`: hazlo tú en `onSuccess`. Si venías del `FormLogin` de
  `donde-esta-tu-local`, que lo llamaba dentro, ese `invalidateAll()` se mueve al callback.
- Ninguno cierra ningún modal por su cuenta (adiós al `setTimeout(2000)`): usa `onSuccess` y la
  referencia del `Modal` (`bind:this` → `close()`).

### `Link`

| Antes                        | Ahora                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| `href={route.url as string}` | `href` es la **clave** del `RouteMap`; `Link` le aplica `resolve()`       |
| —                            | `route?: Route` (de ahí saca icono y etiqueta), `label?`, `id?`, `class?` |

El `id` existe para que los tours guiados puedan anclar pasos a un enlace concreto: sustituye al
`tourDesktopElementIds` que `donde-esta-tu-local` tenía en `$lib/utils/tour.ts`.

### `Modal`

Ya no busca el `<dialog>` con `getElementById` en `onMount`: usa `bind:this` + `$state` y
**exporta** `showModal()` y `close()`. Props nuevas de estilo: `buttonClass`, `buttonCloseClass`,
`boxClass`, más el snippet `trigger` (recibe `{ showModal }`) para poner tu propio disparador.

### `class` en todos los componentes

Todo componente con raíz DOM acepta `class?: string` y reenvía `...rest`. La clase se compone con
`cn()` (`clsx` + `tailwind-merge`), exportado también desde el barrel, así que la sobreescritura
es predecible: `class="btn-primary"` gana a un `btn-accent` por defecto.

## 5. Formularios y schemas

| Antes                                                            | Ahora                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `zod` v3 + `zod-to-json-schema`                                  | `zod/v4` + `z.toJSONSchema()` nativo                                                          |
| `.describe(texto)`                                               | `.meta({ placeholder, description })`                                                         |
| `z.string().email(msg)`                                          | `z.email(msg)` (`z.string().email()` está deprecado en la API v4)                             |
| `loginSchema` (const con textos compilados)                      | `createLoginSchema(strings?)` (factoría)                                                      |
| `zodToFieldsJsonSchema(schema: ZodSchema<any>)`                  | `zodToFieldsJsonSchema(schema: ZodObject)` en `@callepuzzle/core/schema`                      |
| `Field = { name, placeholder, format?, description?, required }` | unión discriminada por `kind`: `'string' \| 'number' \| 'boolean' \| 'enum' \| 'unsupported'` |

```diff
-import { z } from 'zod';
-import { zodToJsonSchema } from 'zod-to-json-schema';
+import { z } from 'zod/v4';
+import { zodToFieldsJsonSchema } from '@callepuzzle/core/schema';

-export const loginSchema = z.object({
-	email: z.string().email(m.schema_login_email_error()).describe(m.schema_login_email_describe())
-});
+// En render, no en scope de módulo:
+const schema = $derived(
+	createLoginSchema({
+		emailError: m.schema_login_email_error(),
+		emailPlaceholder: m.schema_login_email_placeholder(),
+		emailDescription: m.schema_login_email_describe()
+	})
+);
```

`.describe()` iba al `description` del JSON Schema y se usaba como etiqueta _y_ como
placeholder. Con `.meta({ placeholder, description })` son dos cosas distintas: `description` es
la etiqueta o la ayuda, `placeholder` es el texto del input.

Sobre el nuevo `Field`: `zodToFieldsJsonSchema` ya no hace casts sobre el JSON Schema (valida la
forma con guardas) y genera el schema con `io: 'input'` y `unrepresentable: 'any'`. Un schema sin
campos obligatorios ya no lanza (antes `jsonSchema.required.includes` explotaba con `required`
ausente), y un tipo que no se sabe representar llega como `kind: 'unsupported'` en vez de
pintarse como input de texto. `FormFields` no renderiza los `unsupported` y avisa por
`console.warn` solo en desarrollo.

Si tenías campos `hidden` o `textarea`, la convención es `.meta({ format: 'hidden' })` y
`.meta({ format: 'textarea' })`.

## 6. i18n

Todos los textos de la librería salían de sus propios catálogos de Paraglide. Ahora entran por
props, con defaults en inglés:

```diff
-<FormLogin {authClient} />   <!-- textos del catálogo de la librería, en su propio locale -->
+<FormLoginMagicLink
+	{authClient}
+	strings={{ signIn: m.form_login_sign_in(), magicLinkSent: m.form_login_magic_link_sent() }}
+/>
```

Las claves que tenías en `packages/sveltekit-ui/messages/*.json` (`form_login_sign_in`,
`form_login_magic_link_sent`, `schema_login_email_error`, `schema_login_email_describe`…) se
mueven a **tus** `messages/*.json` y se inyectan. Y de paso puedes corregir la errata que había
en el `es.json` de la librería: `"Iniciar sessión"`, con doble s.

Catálogo completo de diccionarios, el ejemplo con Paraglide y la **regla dura** (nunca resolver
un mensaje en scope de módulo) en [`i18n.md`](i18n.md).

## Orden recomendado

Para `y-tu-que-compras` (es prácticamente un demo, y valida la instalación desde el registro):

1. `.npmrc` + las tres dependencias, y fuera `link:storybook-svelte`.
2. Peers que le faltan: `zod`, `sveltekit-superforms`, `formsnap`, `@lucide/svelte`.
3. `app.css` (una línea).
4. `hooks.server.ts` (`betterAuthHandle(auth, building)`).
5. `app.d.ts` (augmentación de `App.Locals`).
6. `auth-client.ts` por la factoría, sin `session`.
7. `routes.ts` → `getRoutes(): RouteMap<RouteId>`, quitando las URLs-función.
8. `+layout.server.ts` que exponga `locals.user`, y `+layout.svelte` con `Header` + `NavBarEnd`
   (y `"NavNar Title"` corregido).
9. `bun run check` y `bun run build`.

Para `donde-esta-tu-local`, componente a componente y por PRs, con sus tests y E2E como red de
seguridad: primero los aislados (`Modal`, `Link`, `FormString`, `NavBarList`), después
`FormFields` y `schemas/utils.ts`, y al final `FormLogin` (→ `FormLoginOtp`) y `Header`. El plan
está en [`plans/12-convergencia-consumidores.md`](plans/12-convergencia-consumidores.md).

Lo que **no** sube a la librería y se queda en la app: `FormUser` (edición de perfil),
`NotificationToggle`, `ButtonRequest`, `ActivityCard` y todo `components/gangs/`: son de
producto.
