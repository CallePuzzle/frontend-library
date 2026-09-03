# Auth: montar better-auth con la librería

`@callepuzzle/auth` es un wrapper **fino** de better-auth. No impone plugins, no envía correo, no
guarda sesión en ningún store y no declara tus tipos globales. Lo que aporta:

| Subpath                    | Exporta                                                                                                                                         | Para qué                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `@callepuzzle/auth/client` | `createCallepuzzleAuthClient`, `CallepuzzleAuthClient`, `AuthClient`, `Session`, `SessionOf`                                                    | El cliente del navegador, como **factoría**      |
| `@callepuzzle/auth/server` | `getBetterAuth`, `magicLinkPreset`, `emailOtpPreset`, `SendMagicLink`, `SendVerificationOtp`, `MagicLinkPresetOptions`, `EmailOtpPresetOptions` | La instancia del servidor y los presets de login |
| `@callepuzzle/auth/hooks`  | `betterAuthHandle`, `BetterAuthLocals`                                                                                                          | El `Handle` de SvelteKit                         |

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

- `BETTER_AUTH_SECRET` — obligatoria.
- `BETTER_AUTH_URL` — la URL pública de la app.
- Las de tu base de datos y las de tu SMTP.

Léelas de `$env/dynamic/private` y no de `process.env`, para que el build no exija tenerlas
definidas.
