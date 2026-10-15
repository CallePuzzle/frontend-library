# @callepuzzle/auth

Wrapper **fino** de better-auth para las apps SvelteKit de CallePuzzle. No impone plugins, no
envía correo, no guarda sesión en ningún store y no declara tus tipos globales.

```sh
bun add @callepuzzle/auth better-auth
```

`@sveltejs/kit` y `better-auth` son `peerDependencies`: dos copias de better-auth en el árbol
rompen la sesión. Requiere un `.npmrc` con el registro de GitHub Packages: ver
[`docs/instalacion.md`](../../docs/instalacion.md#1-acceso-a-github-packages).

**No tiene entrypoint raíz**: tres subpaths, para que el código de servidor no acabe en el bundle
del navegador.

## `@callepuzzle/auth/client`

```ts
export function createCallepuzzleAuthClient<O extends ClientOptions>(options?: O): AuthClientOf<O>;
export type CallepuzzleAuthClient<O extends ClientOptions = ClientOptions>;
export type AuthClient<O extends ClientOptions = ClientOptions>; // alias histórico
export type Session<O extends ClientOptions = ClientOptions>;
export type SessionOf<C extends { $Infer: { Session: unknown } }>;
```

Es una **factoría**: no hay estado de sesión en scope de módulo. Instáncialo una sola vez, en tu
propio módulo, con **tus** plugins (así el cliente conserva el tipado de sus endpoints y de
`$Infer.Session`):

```ts
// src/lib/auth-client.ts
import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createCallepuzzleAuthClient({ plugins: [emailOTPClient()] });
export type AuthClient = typeof authClient;
```

> **Nunca `useSession()` en scope de módulo.** En SSR el módulo se evalúa una vez por proceso, no
> por request: ese store sería compartido por todos los usuarios que atienda el servidor. La
> sesión viaja por el `load` y llega a los componentes como dato plano. Crear el cliente sí puede
> vivir en un módulo (no lee ni escribe sesión); lo que no puede es el **estado**.

## `@callepuzzle/auth/server`

```ts
export function getBetterAuth(options: BetterAuthOptions): ReturnType<typeof betterAuth>;
export function magicLinkPreset(send: SendMagicLink, options?: MagicLinkPresetOptions);
export function emailOtpPreset(send: SendVerificationOtp, options?: EmailOtpPresetOptions);
export type SendMagicLink, SendVerificationOtp, MagicLinkPresetOptions, EmailOtpPresetOptions;
```

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

- **`secret` y `baseURL` son obligatorios** (o `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`):
  `betterAuthHandle` no atiende peticiones sin ellos. Sin `baseURL`, better-auth deduce la URL de
  los magic links de las cabeceras `X-Forwarded-*`, que controla quien hace la petición.
- **Cero plugins por defecto** y merge explícito (`plugins: [...(options.plugins ?? [])]`): la
  librería no añade ni quita ninguno, así que no heredas tablas de esquema que nadie ha pedido.
- Los presets exigen la función de envío como **primer argumento obligatorio**. No compila un
  login que no pueda enviar nada: es imposible desplegar la versión que hace `console.log` del
  token.
- `SendMagicLink` y `SendVerificationOtp` son los tipos **reales** de los plugins de better-auth.

## `@callepuzzle/auth/hooks`

```ts
export const betterAuthHandle: <A>(auth: A, building: boolean) => Handle;
export type BetterAuthLocals<A> = { session?: …; user?: … };
```

```ts
// src/hooks.server.ts
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { betterAuthHandle } from '@callepuzzle/auth/hooks';
import { auth } from '$lib/server/auth';

export const handle = sequence(betterAuthHandle(auth, building));
```

Resuelve la sesión **una vez por request**, la deja en `event.locals.session` /
`event.locals.user`, y delega en el handler de better-auth (que atiende `/api/auth/*`). El
`building` sale de `$app/environment` y no es opcional: durante el prerender no hay request real.

Fuera del build, en la primera petición comprueba que la instancia tiene `baseURL` y un secreto
propio de al menos 32 caracteres; si no, no atiende ninguna petición. Con
`betterAuthHandle(auth, building, { skipAssets: true })` no resuelve sesión en `/_app/**` ni en
imágenes o fuentes (nunca en `__data.json`, `.json`, `.xml` ni `.txt`).

El paquete **no** augmenta `App.Locals` (eso es de la app). Declara los dos campos en tu
`src/app.d.ts`:

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

O, equivalente: `interface Locals extends BetterAuthLocals<typeof auth> {}`.

## Documentación

- [`docs/auth.md`](../../docs/auth.md) — guía completa: esquema, envío de correo, formularios de
  login, proteger rutas.
- [ADR 0005](../../docs/adr/0005-auth-por-factoria.md) — por qué factoría y no singleton.
- [`docs/migracion.md`](../../docs/migracion.md) — mapeo desde `@repo/library/better-auth`.
