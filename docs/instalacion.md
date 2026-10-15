# Instalación en una app SvelteKit

Flujo completo desde un proyecto vacío. Cada paso es independiente: si ya tienes app, salta a la
que te falte.

Al final del documento hay una [lista de verificación](#lista-de-verificación) y el
[detalle de cómo se ha comprobado](#cómo-se-ha-verificado-este-documento) este documento.

## 0. El proyecto

```bash
bunx sv create --template minimal --types ts miapp
cd miapp
bun install
```

> Las versiones recientes de `sv` no generan `svelte.config.js`: la configuración de SvelteKit
> (adapter, `compilerOptions`) vive dentro de `vite.config.ts`, en las opciones del plugin
> `sveltekit()`. Si tu proyecto sí tiene `svelte.config.js`, no cambia nada de lo que sigue.

## 1. Acceso a GitHub Packages

Los paquetes se publican en GitHub Packages, que exige autenticación **incluso para paquetes
públicos**.

1. Crea un PAT classic en GitHub con el scope **`read:packages`**.
2. Expórtalo como `NPM_TOKEN` (en tu shell, o en el `.env` de tu gestor de secretos). **Nunca lo
   commitees.**
3. Añade estas dos líneas al `.npmrc` de la raíz del proyecto (`sv create` ya deja uno con
   `engine-strict=true`: añade, no sobreescribas):

```
@callepuzzle:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

En GitHub Actions no hace falta PAT: `NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}` basta, siempre que
el job tenga `permissions: packages: read`.

## 2. Dependencias

```bash
# la librería
bun add @callepuzzle/core @callepuzzle/auth @callepuzzle/svelte-ui

# estilos (peers de svelte-ui)
bun add -D tailwindcss @tailwindcss/vite daisyui

# runtime (peers de svelte-ui y de auth)
bun add @lucide/svelte better-auth sveltekit-superforms formsnap zod

# solo si vas a usar el login por OTP (@callepuzzle/svelte-ui/otp)
bun add bits-ui
```

Los rangos exactos de cada peer están en la
[matriz de compatibilidad del README](../README.md#matriz-de-compatibilidad).

## 3. Tailwind + daisyUI

Añade el plugin de Tailwind a Vite, **antes** de `sveltekit()`. Lo único que cambia es
insertar `tailwindcss()` al principio del array: **conserva las opciones que ya trae tu
`vite.config.ts`** (`adapter`, `compilerOptions`…). Si las borras, el build sigue pasando pero
avisa `No adapter specified` y no genera nada desplegable.

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Lo que ya venía en la plantilla de `sv create`.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
```

Si tu proyecto tiene `svelte.config.js`, `adapter` y `compilerOptions` viven allí y aquí basta
con `plugins: [tailwindcss(), sveltekit()]`.

Y crea el CSS de la app:

```css
/* src/app.css */
@import '@callepuzzle/svelte-ui/styles.css';

/* Los ficheros propios de la app. Redundante si usas `@tailwindcss/vite` (Tailwind detecta
   la raíz del proyecto por su cuenta); necesario si tu CSS vive fuera de esa raíz o si
   compilas Tailwind por CLI/PostCSS. */
@source "./";
```

Eso es todo. **No** escribas `@import "tailwindcss"` ni `@plugin "daisyui"` por tu cuenta: la
hoja publicada ya los trae, y trae además el `@source` que hace que Tailwind escanee el paquete
instalado. Tailwind 4 **no mira dentro de `node_modules`**, así que sin ese `@source` los
componentes se renderizarían sin una sola clase de estilo, y sin ningún error.

### El `@source` de Tailwind, en detalle

La hoja publicada (`node_modules/@callepuzzle/svelte-ui/dist/styles/index.css`) es:

```css
@import 'tailwindcss';
@source "../";
@plugin "daisyui";
```

`@source "../"` es relativo al fichero CSS que lo contiene, así que apunta a
`node_modules/@callepuzzle/svelte-ui/dist/` — los componentes compilados. Está dentro del
paquete a propósito: así no tienes que escribir una ruta a `node_modules` que se rompa con cada
renombrado (es lo que le pasó a `y-tu-que-compras`, que apuntaba a
`../node_modules/storybook-svelte`).

Comprobación rápida de que funciona, tras un `bun run build`:

```bash
grep -c '\.navbar[,{ :]' .svelte-kit/output/client/_app/immutable/assets/*.css
```

Debe devolver `1`. Si devuelve `0`, la hoja no se está importando.

### Tema

El theming es el de daisyUI, en tu propio CSS:

```css
@import '@callepuzzle/svelte-ui/styles.css';

@plugin "daisyui/theme" {
	name: 'mimarca';
	default: true;
	--color-primary: oklch(55% 0.2 250);
}
```

O, para usar uno de los que trae daisyUI: `@plugin "daisyui" { themes: dark --default; }`.

### Si ya tienes tu propio pipeline de Tailwind

La hoja única es la vía rápida, no la única. Si tu `app.css` ya declara `@import 'tailwindcss'`
—porque usas plugins propios (`@tailwindcss/forms`, `@tailwindcss/typography`, Flowbite…) o
quieres una configuración de daisyUI muy concreta— **no importes `styles.css`**: duplicarías el
`@import` y la configuración del plugin. Declara tu pipeline como siempre y añade el `@source`
que hace que Tailwind escanee el paquete instalado:

```css
/* src/app.css */
@import 'tailwindcss';
@plugin 'daisyui' {
	themes: dark; /* tu configuración */
}
@plugin '@tailwindcss/forms';
/* …los plugins que ya tuvieras */

/* Escanea los componentes de la librería: Tailwind 4 no mira dentro de node_modules. */
@source '../node_modules/@callepuzzle/svelte-ui/dist';
```

La ruta apunta a `dist` a propósito: es lo único que publica el paquete. Ojo con una cosa: si el
`@source` falta, el síntoma es el peor posible — **los componentes se renderizan sin una sola
clase de estilo y sin ningún error**. Verifícalo tras un `build` con el grep de abajo.

Es la variante que trae puesta `donde-esta-tu-local` (tema `dark` propio más plugins de forms y
typography), verificada en producción.

## 4. better-auth en el servidor

La librería no impone plugins ni forma de enviar correo. Instancia better-auth con **tu**
adaptador de base de datos y **tus** plugins:

```ts
// src/lib/server/auth.ts
import { getBetterAuth, emailOtpPreset } from '@callepuzzle/auth/server';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import prisma from './db';
import { sendOtpEmail } from './sender';

export const auth = getBetterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	plugins: [sveltekitCookies(getRequestEvent), emailOtpPreset(sendOtpEmail)]
});
```

`emailOtpPreset` y `magicLinkPreset` exigen la función de envío como **primer argumento
obligatorio**: es imposible desplegar un login que no envíe nada. Los detalles (esquema de base
de datos, magic link, `sendOtpEmail`) están en [`auth.md`](auth.md).

## 5. `hooks.server.ts`

```ts
// src/hooks.server.ts
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { betterAuthHandle } from '@callepuzzle/auth/hooks';
import { auth } from '$lib/server/auth';

export const handle = sequence(betterAuthHandle(auth, building));
```

El `Handle` resuelve la sesión **una vez por request**, la deja en `event.locals.session` /
`event.locals.user`, y delega en el handler de better-auth (que atiende `/api/auth/*`). El
`building` sale de `$app/environment`: durante el prerender no hay request real.

## 6. `src/app.d.ts`

La librería **no** augmenta `App.Locals` (eso es de la app), así que tienes que declarar los dos
campos que el `Handle` escribe. Si no lo haces, tus `load` no ven `locals.user` y el `tsc` falla.

```ts
// src/app.d.ts
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

Se derivan de `auth.$Infer.Session` y no de los modelos de tu ORM: así incluyen exactamente lo
que better-auth pone en la sesión, con los campos que añadan tus plugins (`role` del plugin
`admin`, por ejemplo).

## 7. El cliente de auth

Una sola instancia, en tu propio módulo. **Nunca** un `useSession()` en scope de módulo: en SSR
ese store sería compartido por todos los usuarios que atienda el proceso.

```ts
// src/lib/auth-client.ts
import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createCallepuzzleAuthClient({ plugins: [emailOTPClient()] });
export type AuthClient = typeof authClient;
```

## 8. Las rutas

La **clave del mapa es la ruta**. Tipa el mapa con tu `RouteId` de `$app/types` y el compilador
te valida cada entrada.

```ts
// src/lib/routes.ts
import type { RouteId } from '$app/types';
import type { RouteMap } from '@callepuzzle/core';
import House from '@lucide/svelte/icons/house';
import Shield from '@lucide/svelte/icons/shield';

// Una función, no un `const`: si las etiquetas vienen de i18n, resolverlas en scope de
// módulo congela el idioma para todo el proceso. Ver docs/i18n.md.
export function getRoutes(): RouteMap<RouteId> {
	return {
		'/': { label: 'Inicio', short: 'Home', icon: House, showInMenu: true, showInMobile: true },
		'/admin': { label: 'Administración', icon: Shield, showInMenu: true }
	};
}
```

- `showInMenu` → menú de escritorio (`NavBarList`, `Header`).
- `showInMobile` → dock móvil (`Dock`).
- Los dos flags son **independientes**: una ruta que deba salir en los dos sitios declara los
  dos. `getMenuRoutes(routes, { mobile: true })` filtra **solo** por `showInMobile`.
- No hay `url` ni `isProtected`. La protección va en tus `+layout.server.ts`.

## 9. El layout

La sesión baja por el `load`:

```ts
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({ user: locals.user ?? null });
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { Header, NavBarEnd } from '@callepuzzle/svelte-ui';
	import { getRoutes } from '$lib/routes';
	import { authClient } from '$lib/auth-client';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const routes = $derived(getRoutes());
</script>

<Header {routes} homeHref="/" strings={{ navLabel: 'Menú' }}>
	{#snippet title()}Mi app{/snippet}
	{#snippet navEnd()}
		<NavBarEnd
			user={data.user}
			{authClient}
			profileHref="/profile"
			strings={{ signOut: 'Cerrar sesión', profile: 'Perfil' }}
		>
			{#snippet login()}
				<a class="btn btn-sm" href="/login">Entrar</a>
			{/snippet}
		</NavBarEnd>
	{/snippet}
</Header>

{@render children()}
```

`Header` es **solo la navbar**: no envuelve la página y no trae cajón lateral.

### Con cajón lateral

`Drawer` da el `drawerId` a su snippet `children`; pásalo al `Header` como `menuToggleFor` y
tendrás el botón hamburguesa en móvil:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Drawer, Header, NavBarList } from '@callepuzzle/svelte-ui';
	import { getRoutes } from '$lib/routes';

	// Ojo: renombra el prop `children` del layout. Dentro de `<Drawer>` el snippet
	// `children` es el del propio `Drawer` (recibe `{ drawerId }`), y si el prop se
	// llama igual queda sombreado: `{@render children()}` falla con
	// `Expected 1 arguments, but got 0.`
	let { children: pageContent }: { children: Snippet } = $props();

	const routes = $derived(getRoutes());
</script>

<Drawer strings={{ closeSidebar: 'Cerrar el menú' }}>
	{#snippet children({ drawerId })}
		<Header {routes} homeHref="/" menuToggleFor={drawerId}>
			{#snippet title()}Mi app{/snippet}
		</Header>
		{@render pageContent()}
	{/snippet}
	{#snippet side()}
		<NavBarList type="drawer" {routes} />
	{/snippet}
</Drawer>
```

### Con dock móvil

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { Dock } from '@callepuzzle/svelte-ui';
</script>

<Dock {routes} currentPath={page.route.id ?? page.url.pathname} />
```

`currentPath` se compara con la clave del `RouteMap`, así que `page.route.id` es la fuente
correcta.

## 10. Una página de login

Magic link (barrel principal):

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { FormLoginMagicLink } from '@callepuzzle/svelte-ui';
	import { createLoginSchema } from '@callepuzzle/core/schema';
	import { authClient } from '$lib/auth-client';

	const schema = createLoginSchema({
		emailPlaceholder: 'tu@correo.es',
		emailDescription: 'Te enviaremos un enlace para entrar',
		emailError: 'Escribe un correo válido'
	});
</script>

<FormLoginMagicLink
	{authClient}
	{schema}
	callbackURL="/"
	strings={{ signIn: 'Entrar', magicLinkSent: 'Mira tu correo: te hemos enviado un enlace.' }}
	onSuccess={() => invalidateAll()}
/>
```

OTP (subpath `./otp`, necesita `bits-ui`):

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { FormLoginOtp } from '@callepuzzle/svelte-ui/otp';
	import { authClient } from '$lib/auth-client';
</script>

<FormLoginOtp {authClient} startOverHref="/login" onSuccess={() => invalidateAll()} />
```

La librería **no** llama a `invalidateAll()` ni navega por su cuenta: eso lo decides tú en
`onSuccess`.

## Lista de verificación

```bash
bun run check    # svelte-check: 0 errores
bun run build    # build de producción
grep -c '\.navbar[,{ :]' .svelte-kit/output/client/_app/immutable/assets/*.css   # → 1
bun run dev      # y mira que la navbar salga con estilo
```

Fallos típicos:

| Síntoma                                                                                                          | Causa                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los componentes salen sin estilo, sin errores                                                                    | Falta `@import "@callepuzzle/svelte-ui/styles.css"` en `app.css`, o has puesto `@import "tailwindcss"` a mano sin el `@source` del paquete                                       |
| Los componentes salen sin estilo, sin errores, con pipeline propio                                               | Falta `@source '../node_modules/@callepuzzle/svelte-ui/dist'` en tu `app.css`. Ver [«Si ya tienes tu propio pipeline de Tailwind»](#si-ya-tienes-tu-propio-pipeline-de-tailwind) |
| `[MISSING_EXPORT] "PinInput"` / `"REGEXP_ONLY_DIGITS"` `is not exported by "__vite-optional-peer-dep:bits-ui:…"` | Importas `@callepuzzle/svelte-ui/otp` sin `bits-ui` instalado. Salen **dos** errores, uno por símbolo, y solo en `vite build`: `svelte-check` no lo detecta                      |
| `Property 'user' does not exist on type 'Locals'`                                                                | Falta la augmentación de `App.Locals` del [paso 6](#6-srcappdts)                                                                                                                 |
| Los textos aparecen en inglés                                                                                    | No has pasado `strings` a ese componente. Ver [`i18n.md`](i18n.md)                                                                                                               |
| El menú sale vacío                                                                                               | Las rutas no declaran `showInMenu: true` (o `showInMobile` para el `Dock`)                                                                                                       |
| El dock no muestra una ruta que sí está en el menú                                                               | `{ mobile: true }` filtra **solo** por `showInMobile`: declara los dos flags                                                                                                     |
| El idioma de la app no cambia los textos de la librería                                                          | Estás resolviendo los mensajes en scope de módulo. Ver [`i18n.md`](i18n.md)                                                                                                      |

## Cómo se ha verificado este documento

El 2026-09-02, sobre un proyecto SvelteKit creado desde cero fuera del monorepo, con los tres
paquetes instalados desde tarballs de `npm pack` (no desde el registro):

- `bunx sv create --template minimal --types ts` → SvelteKit 2.63, Svelte 5.56, Vite 8.2,
  TypeScript 6.0.
- Peers instalados: `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `daisyui@5.7.27`,
  `@lucide/svelte@1.39.0`, `better-auth@1.7.2`, `sveltekit-superforms@2.30.2`, `formsnap@2.0.1`,
  `zod@4.5.4`, `bits-ui@2.19.0`.
- Ficheros de los pasos 3 a 10, con `memoryAdapter` de better-auth en lugar de Prisma para no
  necesitar base de datos.
- **`bun run check`: 0 errores, 0 avisos** (1943 ficheros).
- **`bun run build`: correcto.**
- CSS de producción: **99 129 bytes**, con `.navbar`, `.navbar-start`, `.dropdown`, `.btn`,
  `.fieldset`, `.alert`, `.menu`, `.drawer`, `.indicator`, `.avatar` y `.dock` presentes. Al
  quitar el `@source "../"` de la hoja de la librería, el CSS baja a **29 331 bytes** y esas
  clases desaparecen (las utilidades propias de la app siguen saliendo).
- `bun run dev` sirviendo: la navbar se renderiza con
  `class="navbar flex min-h-px justify-between bg-base-300 shadow-sm"`, con el título, el
  snippet `login` y el `input type="email"` del formulario.
- Importar `@callepuzzle/svelte-ui/otp` **sin** `bits-ui`: el build falla con
  `[MISSING_EXPORT] "PinInput" is not exported by "__vite-optional-peer-dep:bits-ui:@callepuzzle/svelte-ui"`.
  Instalando `bits-ui`, `check` y `build` vuelven a pasar.

Reverificado el mismo día sobre un segundo proyecto limpio (`sv create --template minimal
--types ts`, SvelteKit 2.63.0, Svelte 5.56.1, Vite 8.2.2, TypeScript 6.0.3, `node_modules`
propio, sin hoisting del monorepo) ejercitando `RouteMap`, `getMenuRoutes`,
`zodToFieldsJsonSchema`, `createLoginSchema`, `getBetterAuth`, `emailOtpPreset`,
`magicLinkPreset`, `betterAuthHandle`, `createCallepuzzleAuthClient`, `Header`, `Drawer`,
`NavBarEnd`, `NavBarList`, `Dock`, `Link`, `Modal`, `FormFields`, `FormLoginMagicLink`,
`FormLoginOtp`, `ButtonSignOut` y `UserNotLogged`:

- `svelte-check`: **0 errores, 0 avisos** (2019 ficheros). `vite build`: correcto.
- CSS de producción: **100 448 bytes**, con `.navbar`, `.btn`, `.modal`, `.fieldset`, `.alert`,
  `.menu`, `.drawer`, `.dropdown`, `.indicator`, `.avatar` y `.dock`. Quitando el `@source "../"`
  de la hoja instalada, baja a **46 481 bytes** y `.navbar` y `.fieldset` desaparecen.
- En `dev`: `class="navbar flex min-h-px justify-between bg-base-300 shadow-sm"`,
  `GET /api/auth/ok` → `{"ok":true}`, y `zodToFieldsJsonSchema` clasificando
  `string`/`number`/`boolean`/`enum`/`unsupported` con `FormFields` omitiendo el `unsupported`.
- `@callepuzzle/core` instalado a solas: **1 paquete, cero dependencias transitivas**; ni
  `better-auth` ni `nodemailer` aparecen en el árbol.
- De esa reverificación salieron tres correcciones a este documento: el `vite.config.ts` del
  paso 3 (borraba `adapter` y `compilerOptions` de la plantilla), el ejemplo del cajón lateral
  del paso 9 (el prop `children` del layout queda sombreado por el snippet `children` del
  `Drawer`) y el `invalidateAll` que faltaba importar en el ejemplo de OTP del paso 10.

Una nota sobre la instalación desde tarballs: `@callepuzzle/svelte-ui` declara
`"@callepuzzle/core": "^0.0.0"` como dependencia, así que mientras los paquetes estén en la
versión `0.0.0` y sin publicar, `bun add` de los tarballs intenta resolver `core` en el registro
y falla con un 404. En la prueba se resolvió con un `overrides` apuntando al tarball. **No afecta
a la instalación desde el registro** una vez publicadas versiones reales.
