# Auth: montar better-auth con la librería

`@callepuzzle/auth` es un wrapper **fino** de better-auth. No impone plugins, no envía correo, no
guarda sesión en ningún store y no declara tus tipos globales. Lo que aporta:

| Subpath                    | Exporta                                                                                                                                                                   | Para qué                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `@callepuzzle/auth/client` | `createCallepuzzleAuthClient`, `CallepuzzleAuthClient`, `AuthClient`, `Session`, `SessionOf`                                                                              | El cliente del navegador, como **factoría**      |
| `@callepuzzle/auth/server` | `getBetterAuth`, `magicLinkPreset`, `emailOtpPreset`, `SendMagicLink`, `SendVerificationOtp`, `MagicLinkPresetOptions`, `EmailOtpPresetOptions`, `emailOtpRateLimitRules` | La instancia del servidor y los presets de login |
| `@callepuzzle/auth/hooks`  | `betterAuthHandle`, `BetterAuthLocals`                                                                                                                                    | El `Handle` de SvelteKit                         |

Cliente y servidor están en subpaths separados a propósito: reexportarlos desde el mismo módulo
arrastraba código de servidor al bundle del navegador.

El razonamiento completo está en [ADR 0005](adr/0005-auth-por-factoria.md).

## El modelo de datos

better-auth necesita sus tablas (`user`, `session`, `account`, `verification`, más las que añada
cada plugin). El esquema lo genera su propio CLI contra tu configuración:

```bash
bunx @better-auth/cli@latest generate -y --config ./src/lib/server/auth.ts
```

`demos/sveltekit/prisma/schema.prisma` es la referencia del esquema en el repo: no se guarda una
copia en `docs/` para que no se quede desfasada.

## 1. La instancia del servidor

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

`secret` y `baseURL` son obligatorios (o sus variables `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`,
que better-auth lee por su cuenta). `betterAuthHandle` lo comprueba en la primera petición y, si
falta alguno, no atiende ninguna: ver [«La comprobación de configuración»](#la-comprobación-de-configuración).

`getBetterAuth` hace exactamente esto:

```ts
betterAuth({ ...options, plugins: [...(options.plugins ?? [])] });
```

Es decir: **cero plugins por defecto** y un merge explícito. La versión vieja traía
`magicLink() + organization() + admin()` como default y hacía un spread superficial, así que
pasar tus plugins **borraba** los tres sin aviso, y `organization()` metía tablas de
organización e invitaciones en el esquema de quien no las había pedido.

### Los presets

```ts
magicLinkPreset(send: SendMagicLink, options?: MagicLinkPresetOptions);
emailOtpPreset(send: SendVerificationOtp, options?: EmailOtpPresetOptions);
```

La función de envío es el **primer argumento y es obligatoria**. No hay forma de compilar un
magic link sin decir cómo se envía: el default viejo hacía `console.log` del token y no mandaba
ningún correo, así que cualquiera que no sobreescribiera `plugins` desplegaba una app donde
nadie podía entrar y los tokens de login aparecían en los logs.

`send` es el `sendMagicLink` / `sendVerificationOTP` **real** de better-auth: la firma no es una
copia paralela que se pueda desfasar. Y `options` es el resto de opciones del plugin
(`expiresIn`, `otpLength`, `allowedAttempts`, `rateLimit`, `storeToken`…).

```ts
// src/lib/server/sender.ts
import { createTransport } from 'nodemailer';
import { env } from '$env/dynamic/private';
import type { SendVerificationOtp } from '@callepuzzle/auth/server';

// Transporter cacheado a nivel de módulo: es infraestructura, no estado de usuario.
const transporter = createTransport({
	host: env.SMTP_HOST,
	auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

export const sendOtpEmail: SendVerificationOtp = async ({ email, otp }) => {
	await transporter.sendMail({
		from: env.SMTP_SENDER,
		to: email,
		subject: 'Tu código de acceso',
		text: `Tu código es ${otp}`
	});
};
```

En desarrollo puedes registrar el código en vez de enviarlo, pero hazlo explícito y **solo**
fuera de producción:

```ts
export const sendOtpEmail: SendVerificationOtp = async ({ email, otp }) => {
	if (dev) {
		logger.debug({ email }, `OTP: ${otp}`);
		return;
	}
	// …envío real
};
```

La librería no lo hace por ti a propósito: un envío falso escondido en un default es cómo se
llega a producción sin correo.

### Rate limit del OTP

Los dos endpoints del flujo OTP son justo los que alguien puede abusar (inundar un buzón,
adivinar el código). `emailOtpRateLimitRules()` devuelve las reglas que traen puestas el demo y
los consumidores reales —3 peticiones por minuto por IP— para pedir y para canjear el código:

```ts
import { emailOtpRateLimitRules, getBetterAuth, emailOtpPreset } from '@callepuzzle/auth/server';

export const auth = getBetterAuth({
	// …
	rateLimit: { customRules: emailOtpRateLimitRules(), storage: 'database' },
	// ajusta con `emailOtpRateLimitRules({ window: 120, max: 5 })` si quieres otros números
	advanced: { ipAddress: { ipAddressHeaders: ['x-real-ip'] } }
});
```

Las reglas solas no bastan. Revisa estas tres cosas:

- **Solo se aplican en producción.** better-auth activa el rate limit con `NODE_ENV=production`, y
  las `customRules` no lo encienden en desarrollo (para eso, `rateLimit.enabled: true`).
- **La IP sale de una cabecera.** Por defecto better-auth lee `x-forwarded-for`, que el cliente
  puede inventarse si ningún proxy la reescribe: cambiándola en cada petición, el límite no frena
  nada. Fija `advanced.ipAddress.ipAddressHeaders` a la cabecera que pone **tu** proxy
  (`x-real-ip`, `cf-connecting-ip`, `fly-client-ip`…).
- **El almacén por defecto es la memoria del proceso.** Con varias instancias o en serverless,
  cada una cuenta por su lado. Usa `rateLimit.storage: 'database'` (necesita la tabla `rateLimit`
  en el esquema) o un `secondaryStorage`.

Adivinar el código además está acotado por el `allowedAttempts` del plugin (3 por defecto): tras
ese número de fallos el OTP se invalida.

Con magic link es igual:

```ts
import { getBetterAuth, magicLinkPreset } from '@callepuzzle/auth/server';

export const auth = getBetterAuth({
	// …
	plugins: [
		sveltekitCookies(getRequestEvent),
		magicLinkPreset(async ({ email, url }) => {
			await transporter.sendMail({ to: email, subject: 'Entra en Mi app', text: url });
		})
	]
});
```

## 2. El `Handle`

```ts
// src/hooks.server.ts
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { betterAuthHandle } from '@callepuzzle/auth/hooks';
import { auth } from '$lib/server/auth';

export const handle = sequence(betterAuthHandle(auth, building));
```

`betterAuthHandle(auth, building)`:

1. Llama a `auth.api.getSession({ headers: event.request.headers })` **una vez por request**.
2. Si hay sesión, escribe `event.locals.session` y `event.locals.user`.
3. Delega en `svelteKitHandler({ event, resolve, auth, building })`, que es quien atiende las
   rutas `/api/auth/*`.

El segundo argumento sale de `$app/environment` y **no es opcional**: durante el prerender no hay
request real y better-auth necesita saberlo.

El tercero es opcional. Con `{ skipAssets: true }`, el handle no resuelve sesión ni pasa por
better-auth en peticiones de assets estáticos (`/_app/**`, el service worker e imágenes o fuentes:
`ico`, `png`, `jpg`, `gif`, `svg`, `webp`, `avif`, `woff`, `woff2`, `ttf`, `otf`). Un asset nunca
resuelve sesión ni atiende `/api/auth/*`, así que el salto es seguro y se ahorra una llamada a
`auth.api.getSession` por fichero servido. Recomendado en cualquier app que sirva assets por el
mismo origin.

`json`, `txt` y `xml` **no** cuentan como asset, a propósito. SvelteKit pide el `load` de servidor
de cada navegación en cliente a `/<ruta>/__data.json`, y un `+server.ts` puede llamarse
`datos.json` o `sitemap.xml`. Hasta `@callepuzzle/auth@0.2.0` esas peticiones se saltaban, y el
usuario aparecía desconectado en cuanto navegaba sin recargar.

```ts
export const handle = sequence(betterAuthHandle(auth, building, { skipAssets: true }));
```

### La comprobación de configuración

Fuera del build (`building === false`), antes de atender la primera petición el handle comprueba
el contexto ya resuelto de better-auth, así que valen tanto las opciones como las variables de
entorno:

- **`baseURL` es una URL `http(s)`.** Sin ella, better-auth deduce la URL pública de las cabeceras
  `X-Forwarded-Host` / `X-Forwarded-Proto` de la primera petición a `/api/auth/*`, y la conserva
  para todo el proceso. Quien envíe esa primera petición decide a qué dominio apuntan los magic
  links (con el token dentro) de todos los usuarios, y ese dominio pasa a ser un origen de
  confianza para `callbackURL`.
- **El secreto no es el de por defecto de better-auth y tiene al menos 32 caracteres.** Con el de
  por defecto, better-auth firma las cookies con un valor público y en producción solo lo avisa
  por log. Genera uno con `openssl rand -base64 32`.

Si algo falla, **todas las peticiones** devuelven error con un mensaje que dice qué falta. Es a
propósito: es preferible a servir una app que parece funcionar.

Si encadenas varios handles, este va antes de los que necesiten leer la sesión (logging con
usuario, autorización) y después de los de seguridad puros (cabeceras, CSP).

## 3. `App.Locals`

La librería **no** hace `declare global` (una librería que impone su forma de `Locals` choca con
la de la app). Declara tú los dos campos que el handle escribe:

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

Se derivan de `auth.$Infer.Session`, no de los modelos de tu ORM: así los tipos llevan
exactamente lo que better-auth pone en la sesión, incluidos los campos que añaden tus plugins
(el `role` del plugin `admin`, por ejemplo), y no lo que tu ORM expondría por su cuenta.

Si prefieres no repetirlo, `BetterAuthLocals<typeof auth>` de `@callepuzzle/auth/hooks` es
exactamente esa forma:

```ts
import type { BetterAuthLocals } from '@callepuzzle/auth/hooks';
import type { auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals extends BetterAuthLocals<typeof auth> {}
	}
}
```

## 4. El cliente

Una instancia, en tu propio módulo, con **tus** plugins:

```ts
// src/lib/auth-client.ts
import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
import { emailOTPClient, adminClient } from 'better-auth/client/plugins';

export const authClient = createCallepuzzleAuthClient({
	plugins: [emailOTPClient(), adminClient()]
});

export type AuthClient = typeof authClient;
```

`createCallepuzzleAuthClient` es genérico sobre las opciones, así que el cliente que devuelve
conserva **el tipado de tus plugins**: los endpoints, las acciones y `$Infer.Session`. El código
viejo hacía `createAuthClient({ … }) as any`, y con ese `as any` se iban `AuthClient` y `Session`
—que eran la superficie pública que consumían los componentes— dejando todo en `any`.

Para el tipo de tu cliente, usa `typeof authClient`: es más preciso que
`CallepuzzleAuthClient` porque conserva la inferencia. `SessionOf<typeof authClient>` te da el
`{ session, user }` correspondiente.

### Lo que no debes hacer

```ts
// ✗ En SSR el módulo se evalúa una vez por proceso: este store de sesión sería
//   compartido por TODOS los usuarios que atienda el servidor.
export const session = authClient.useSession();
```

Crear el cliente en scope de módulo **sí** es correcto (no lee ni escribe sesión). Lo que no
puede vivir ahí es el **estado**.

## 5. La sesión llega por el `load`

El camino completo es:

```
betterAuthHandle → event.locals.user → +layout.server.ts → data.user → <NavBarEnd {user} />
```

```ts
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({ user: locals.user ?? null });
```

```svelte
<!-- src/routes/+layout.svelte -->
<NavBarEnd user={data.user} {authClient} profileHref="/profile" />
```

`NavBarEnd` recibe `user?: SessionUser | null` —`{ id, name?, email?, image? }`, dato plano— y
`authClient` solo para el "cerrar sesión". Nada de stores: la sesión ya viene resuelta por
request desde el servidor, así que la navbar sale correcta en el primer render del SSR y no
parpadea.

Los componentes de UI tipan el cliente **estructuralmente** y no importan `@callepuzzle/auth`
ni para tipos:

```ts
type SignOutClient = { signOut: (...args: never[]) => Promise<unknown> };
type MagicLinkClient = { signIn: { magicLink: (body: { email: string; callbackURL?: string }) => … } };
type EmailOtpClient = { emailOtp: { sendVerificationOtp: … }; signIn: { emailOtp: … } };
```

Consecuencia práctica: valen con cualquier cliente de better-auth, con los plugins que sea, y
también con un doble en un test.

## 6. Los formularios de login

### Magic link

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { FormLoginMagicLink } from '@callepuzzle/svelte-ui';
	import { authClient } from '$lib/auth-client';
</script>

<FormLoginMagicLink
	{authClient}
	callbackURL="/"
	strings={{ signIn: 'Entrar', magicLinkSent: 'Mira tu correo.' }}
	onSuccess={() => invalidateAll()}
/>
```

Requiere el plugin `magicLinkClient()` en tu cliente y `magicLinkPreset(send)` en el servidor.

### OTP por email

Vive en el subpath `@callepuzzle/svelte-ui/otp` porque necesita `bits-ui` (el `PinInput`), que es
un peer **opcional**: quien use magic link no tiene que instalarlo.

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { FormLoginOtp } from '@callepuzzle/svelte-ui/otp';
	import { authClient } from '$lib/auth-client';
</script>

<FormLoginOtp {authClient} startOverHref="/login" onSuccess={() => invalidateAll()} />
```

Dos pasos: pide el correo (`emailOtp.sendVerificationOtp` con `type: 'sign-in'`), luego el código
de 6 dígitos (`signIn.emailOtp`). Requiere `emailOTPClient()` en tu cliente y
`emailOtpPreset(send)` en el servidor.

### Cosas que los dos hacen igual

- **Validan en cliente** con `sveltekit-superforms` en modo `SPA: true`, y actúan en `onUpdate`
  (no en `onSubmit`: en superforms 2.27 `onSubmit` corre **antes** de la validación de cliente,
  así que se llamaba a better-auth con emails inválidos).
- **No enseñan el error crudo.** Un 429 da el mensaje `rateLimited`; cualquier otro fallo, el
  genérico `error`. Al usuario le sirve saber si tiene que esperar o reintentar, no el código
  HTTP.
- **No navegan ni invalidan nada.** Eso es `onSuccess`, y es tuyo. La librería no toca
  `invalidateAll()` ni `goto()`.
- Aceptan `schema?: LoginSchema` para traducir o extender el formulario. Los campos extra se
  renderizan solos, porque `FormFields` los deriva del schema en tiempo de ejecución:

```ts
const schema = createLoginSchema({ emailPlaceholder: 'tu@correo.es' }).extend({
	accept: z.boolean().meta({ description: 'Acepto las condiciones' })
});
```

### Qué props de navegación son «ruta» y cuáles «URL cruda»

La convención de la casa es que los `href` son la **clave del `RouteMap`** y la librería los
resuelve con `resolve()` de `$app/paths` (respeta `paths.base`). Las excepciones, para que no te
sorprendan:

| Prop                                         | Tratamiento              | Nota                                                                                   |
| -------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `Link.href`                                  | `resolve()`              | id de ruta                                                                             |
| `DockLink` (el `route.id` del mapa)          | `resolve()`              | id de ruta                                                                             |
| `NavBarEnd.profileHref`                      | `resolve()` (vía `Link`) | id de ruta                                                                             |
| `NavBarEnd.notificationsHref`                | `resolve()` (vía `Link`) | id de ruta                                                                             |
| `ButtonSignOut.redirectTo`                   | `resolve()`              | id de ruta (`null` para no navegar)                                                    |
| `FormLoginOtp.startOverHref`                 | `resolve()`              | id de ruta                                                                             |
| `FormLoginMagicLink.callbackURL`             | **URL cruda**            | se la pasa tal cual a better-auth, que no conoce tu `paths.base`: inclúyelo si lo usas |
| `FormLoginOtp.onSuccess` / navegación propia | —                        | tus rutas, tus reglas: la librería no navega por su cuenta                             |

### Login en un modal

`NavBarEnd` **no** embute el formulario: renderiza el snippet `login` cuando no hay usuario, y
tú decides el flujo. `Modal` exporta `showModal()` y `close()`, así que puedes cerrarlo tras el
login con una referencia:

```svelte
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Modal, NavBarEnd, FormLoginMagicLink } from '@callepuzzle/svelte-ui';
	import { authClient } from '$lib/auth-client';

	let loginModal: Modal | undefined = $state();
</script>

<NavBarEnd user={data.user} {authClient}>
	{#snippet login()}
		<Modal bind:this={loginModal} title="Entrar" showButton>
			<FormLoginMagicLink
				{authClient}
				onSuccess={async () => {
					await invalidateAll();
					loginModal?.close();
				}}
			/>
		</Modal>
	{/snippet}
</NavBarEnd>
```

La versión vieja cerraba el modal ella misma con un `setTimeout(2000)` dentro de la librería.
Eso era una decisión de producto con un número mágico: ahora la tomas tú.

### Cerrar sesión

`NavBarEnd` ya pone la entrada "cerrar sesión" en el menú de usuario si le pasas `authClient`.
Suelto:

```svelte
<ButtonSignOut {authClient} redirectTo="/" strings={{ signOut: 'Salir' }} />
```

`redirectTo` por defecto es `'/'`; con `null` cierra sesión y no navega.

## 7. Proteger rutas

La librería no protege nada, y el `RouteMap` **no tiene `isProtected`** a propósito: un flag en
un objeto de menú solo sirve para creer que algo está protegido cuando no lo está. La protección
va donde puede fallar de verdad, en el servidor:

```ts
// src/routes/admin/+layout.server.ts
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) error(401, 'Necesitas iniciar sesión');
	if (locals.user.role !== 'admin') error(403, 'No tienes permiso');
	return { user: locals.user };
};
```

Un `+layout.server.ts` protege la navegación de sus páginas hijas, pero **las `actions` no pasan
por el `load` del layout**: repite la comprobación en cada action (o extráela a un helper del
tipo `requireAdmin(locals)`).

Para la parte visual de "aquí no puedes estar", `UserNotLogged`:

```svelte
<UserNotLogged text="Entra para ver tus listas">
	{#snippet action()}
		<a class="btn btn-primary" href="/login">Entrar</a>
	{/snippet}
</UserNotLogged>
```

## Variables de entorno

Las de better-auth, en la app (la librería no lee ninguna):

- `BETTER_AUTH_SECRET` — obligatoria, mínimo 32 caracteres (`openssl rand -base64 32`).
- `BETTER_AUTH_URL` — obligatoria: la URL pública de la app. Ver
  [«La comprobación de configuración»](#la-comprobación-de-configuración).
- Las de tu base de datos y las de tu SMTP.

Léelas de `$env/dynamic/private` y no de `process.env`, para que el build no exija tenerlas
definidas.
