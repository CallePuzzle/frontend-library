# 05 — Auth: matar el singleton, recuperar los tipos

**Prioridad: bloqueante.** Hay un bug de aislamiento entre requests y la API pública es `any`.

## Contexto

`packages/library/src/better-auth/` tiene cuatro ficheros: `client.ts`, `server.ts`, `handle.ts`,
`sender.ts`, reexportados en bloque por `index.ts`.

## Hallazgos

### H5.1 — Estado de sesión compartido entre requests (crítico)

`packages/library/src/better-auth/client.ts`:

```ts
export const authClient = createAuthClient({ … }) as any;
export const { signIn, signUp, useSession } = authClient;
export const session = useSession();   // ← línea 14
```

`useSession()` se ejecuta **en scope de módulo**. En SSR, el módulo se evalúa una vez por proceso
Node, no por request: ese store de sesión es **global y compartido por todos los usuarios que
atienda el servidor**. Es el mismo problema que el ADR de bitban resuelve con `AsyncLocalStorage`
para el locale (`docs/adr/0001-i18n-custom-package.md`, punto 4), y aquí el dato es una sesión
de usuario.

El demo lo consume así (`demos/sveltekit/src/routes/+layout.svelte`):
```ts
import { session, authClient } from "@repo/library/better-auth";
```
y lo pasa a `<Header {session} {authClient}>`.

Cómo lo resolvió el consumidor maduro: `donde-esta-tu-local/src/lib/components/NavBarEnd.svelte`
**no usa un store de sesión**; recibe `user: App.Locals['user']`, que viene del `load` del
servidor por request. Es la solución correcta.

### H5.2 — Todo el tipado se tira a la basura

`client.ts:10`: `createAuthClient({ … }) as any`.

Consecuencia en cascada:
```ts
export type AuthClient = typeof authClient;              // = any
export type Session = typeof authClient.$Infer.Session;  // = any
```

Y esos dos tipos son la superficie pública que consumen los componentes:
`NavBarEnd.svelte` importa `type { AuthClient, Session }` y tipa sus props con ellos. Resultado:
`session`, `authClient` y todo lo derivado son `any`. `$session?.data` no está comprobado por
nadie; un typo silencioso pasa el `check`.

El `as any` está ahí, presumiblemente, para esquivar un error de inferencia de los plugins. La
salida correcta es tipar explícitamente el retorno o ajustar la config, no borrar los tipos.

### H5.3 — La librería decide los plugins de auth por ti, y el merge los pisa

`packages/library/src/better-auth/server.ts`:

```ts
const defaultOptions: BetterAuthOptions = {
  plugins: [magicLink({ … }), organization(), admin()],
};
const options = { ...defaultOptions, ...additionalOptions };   // ← línea 32
return betterAuth(options);
```

Dos problemas:

1. **Merge superficial.** Si el consumidor pasa `plugins: [emailOTP()]` en `additionalOptions`,
   **borra los tres plugins por defecto** sin aviso. No hay forma de *añadir* un plugin.
2. **Los defaults son opinables y equivocados para los consumidores reales.**
   `donde-esta-tu-local` usa **OTP por email**, no magic link, y no usa `organization()`.
   `y-tu-que-compras` sí usa magic link. Imponer `organization()` a todos mete tablas de
   organización/invitación en el esquema Prisma de quien no las quiere (es exactamente lo que
   hay en `packages/database/prisma/schema.prisma`).

### H5.4 — El magic link no envía nada, solo hace `console.log` del token

`server.ts:11-22`:
```ts
sendMagicLink: async ({ email, token, url }, request) => {
  console.log(request);
  // await sender(email, 'sign in', 'token: ' + token + ' -- url: ' + url);
  console.log(email, "sign in", "token: " + token + " -- url: " + url);
}
```

Esto es un placeholder de desarrollo **en el default de una librería publicable**. Si un
consumidor no sobreescribe `plugins` (y el diseño actual le anima a no hacerlo), su producción
imprime tokens de login en los logs y **no envía ningún email**: nadie puede entrar.
Además `console.log(request)` vuelca el `Request` entero (cabeceras incluidas) en cada intento.

### H5.5 — `sender.ts` es código muerto que arrastra `nodemailer`

`packages/library/src/better-auth/sender.ts` define y exporta por defecto un `sender`, pero
`index.ts` **no lo reexporta** y `server.ts` lo tiene comentado. `nodemailer` es `dependency` de
`packages/library` **y** de `packages/sveltekit-ui` (donde no se usa en absoluto).

### H5.6 — `handle.ts`: el `Handle` funciona, pero asume la forma de `App.Locals`

```ts
event.locals.session = session?.session;
event.locals.user = session?.user;
```
Depende de la augmentación global de `App.Locals` que la propia librería declara en su
`app.d.ts` con tipos sin resolver (ver [03](03-arquitectura-paquetes.md), H3.6). Debería exigir
al consumidor que declare esos campos y documentarlo, no declararlo por él.

### H5.7 — Cliente y servidor en el mismo entrypoint

Ya recogido en [03](03-arquitectura-paquetes.md) (H3.2): `@repo/library/better-auth` reexporta
`client.ts` (browser) y `server.ts` (Node, importa `better-auth` server) desde el mismo módulo.

### H5.8 — El consumidor `y-tu-que-compras` importa un símbolo inexistente

`y-tu-que-compras/src/hooks.server.ts`:
```ts
import { betterAuth } from 'storybook-svelte';
export const handle: Handle = sequence(betterAuth(auth));
```
Hoy se llama `betterAuthHandle`, vive en el subpath `/better-auth`, y acepta un segundo
argumento obligatorio `building: boolean`. Roto en tres frentes. Ver
[12](12-convergencia-consumidores.md).

## Propuesta

### P5.1 — Factoría, no singleton

```ts
// @callepuzzle/auth/client
import { createAuthClient } from 'better-auth/svelte';

export function createCallepuzzleAuthClient<P extends BetterAuthClientPlugin[]>(
  options: { baseURL?: string; plugins?: P } = {}
) {
  return createAuthClient({ ...options });
}
export type CallepuzzleAuthClient = ReturnType<typeof createCallepuzzleAuthClient>;
```

El consumidor instancia **una vez, en su propio `$lib/auth-client.ts`** (que es justo lo que ya
hacen los dos consumidores) y se lo pasa a los componentes como prop. La librería no exporta
`session` ni ningún store de módulo.

### P5.2 — La sesión viaja por el `load`, no por un store global

Los componentes reciben `user` (o `session`) como prop, poblado desde `+layout.server.ts` →
`+layout.svelte`. Es lo que hace `donde-esta-tu-local` y es correcto por request en SSR.
`NavBarEnd` pasa de `session: Session` (any, store) a `user: SessionUser | null` (dato plano).

### P5.3 — Merge de opciones explícito

```ts
export function getBetterAuth(options: BetterAuthOptions & { plugins?: … }) {
  return betterAuth({
    ...options,
    plugins: [...(options.plugins ?? [])],   // el consumidor decide, la librería no impone
  });
}
```

Y ofrecer los plugins como **presets exportados y opcionales**, no como default oculto:
```ts
export const magicLinkPreset = (send: SendMagicLink) => magicLink({ sendMagicLink: send });
export const emailOtpPreset  = (send: SendOtp) => emailOTP({ sendVerificationOTP: send });
```
Sin envío por defecto: `sendMagicLink`/`sendVerificationOTP` son **argumentos obligatorios**. Así
es imposible desplegar la versión que hace `console.log` del token.

### P5.4 — Sobre `sender.ts`

Dos caminos válidos:
- **Borrarlo** y que cada app use su nodemailer (lo que ya hace `donde-esta-tu-local` en
  `src/lib/server/sender.ts`, con el transporter cacheado). Menos superficie.
- **Exportarlo** desde `@callepuzzle/auth/server` como utilidad opcional, con `nodemailer` en
  `peerDependenciesMeta.optional`.

Recomendación: **borrarlo**. El transporter de `donde-esta-tu-local` ya es mejor que este.

## Tareas

- [ ] **T5.1** Eliminar `export const session = useSession()` de `client.ts`. **Bug crítico.**
- [ ] **T5.2** Eliminar el `as any` de `createAuthClient` y tipar el retorno. Si la inferencia de
  plugins da problemas, acotarlo con genéricos, no con `any`.
- [ ] **T5.3** Convertir el cliente en factoría (`createCallepuzzleAuthClient`) y quitar los
  exports de módulo `authClient`, `signIn`, `signUp`, `useSession`.
- [ ] **T5.4** Cambiar la prop `session` por `user` en `NavBarEnd` y `Header`, con el tipo real
  de la sesión de better-auth. Ver [07](07-componentes-api.md).
- [ ] **T5.5** Arreglar el merge de `getBetterAuth` y quitar los plugins por defecto.
- [ ] **T5.6** Eliminar el `sendMagicLink` que hace `console.log` y hacer obligatorio el envío.
  Quitar `console.log(request)`.
- [ ] **T5.7** Añadir preset de **OTP por email** (`emailOTP`), que es lo que usa el consumidor
  principal. Ver [12](12-convergencia-consumidores.md).
- [ ] **T5.8** Separar entrypoints `/client`, `/server`, `/hooks` (ver
  [03](03-arquitectura-paquetes.md)).
- [ ] **T5.9** Borrar `sender.ts` y quitar `nodemailer` de las dependencias de ambos paquetes.
- [ ] **T5.10** Documentar la augmentación de `App.Locals` que el consumidor debe escribir, y
  quitar el `app.d.ts` de la librería.
- [ ] **T5.11** Tests: un test que compruebe que dos "requests" simuladas no comparten sesión, y
  otro que `getBetterAuth({ plugins: [x] })` conserva `x`.

## Criterios de aceptación

- `grep -rn "as any" packages/auth/src` está vacío.
- No hay ningún `export const` que ejecute lógica de sesión en scope de módulo.
- `getBetterAuth` no compila sin una función de envío de credenciales.
- Los tipos `Session`/`AuthClient` que ve el consumidor son los reales de better-auth.
