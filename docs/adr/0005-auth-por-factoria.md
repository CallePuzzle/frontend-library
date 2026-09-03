# ADR 0005 — Auth por factoría: sin singleton de módulo, sesión por `load`

- **Fecha:** 2026-09-02
- **Estado:** aceptado
- **Contexto del plan:** [05 — Auth: matar el singleton, recuperar los tipos](../plans/05-auth.md)

## Contexto

`packages/library/src/better-auth/client.ts` era, literalmente:

```ts
export const authClient = createAuthClient({ … }) as any;
export const { signIn, signUp, useSession } = authClient;
export const session = useSession(); // ← línea 14
```

Tres defectos en catorce líneas:

- **Estado de sesión compartido entre requests (crítico, H5.1).** `useSession()` se ejecuta en
  **scope de módulo**. En SSR un módulo se evalúa una vez por proceso Node, no por request: ese
  store de sesión es global y **compartido por todos los usuarios que atienda el servidor**. El
  demo lo consumía tal cual (`import { session, authClient } from '@repo/library/better-auth'`)
  y lo pasaba a `<Header {session} {authClient}>`. `y-tu-que-compras` tiene una copia idéntica
  del fichero, con el mismo bug, en su `src/lib/auth-client.ts`.
- **Todo el tipado a la basura (H5.2).** El `as any` propagaba: `type AuthClient = typeof authClient`
  era `any`, y `type Session = typeof authClient.$Infer.Session` también. Esos dos tipos eran la
  superficie pública que consumían los componentes, así que `session`, `authClient` y todo lo
  derivado eran `any`: `$session?.data` no lo comprobaba nadie y un typo pasaba el `check`.
- **La librería decidía tus plugins, y el merge los pisaba (H5.3).** El servidor traía
  `plugins: [magicLink({ … }), organization(), admin()]` como default y hacía
  `{ ...defaultOptions, ...additionalOptions }`: un consumidor que pasara `plugins: [emailOTP()]`
  **borraba los tres** sin aviso, y no había forma de _añadir_ uno. Peor, los defaults eran
  equivocados para los consumidores reales: `donde-esta-tu-local` usa OTP por email y no usa
  `organization()`, cuyas tablas de organización e invitaciones acababan en el esquema Prisma de
  quien no las había pedido.
- **Y el magic link no enviaba nada (H5.4):** el `sendMagicLink` por defecto hacía
  `console.log(request)` y `console.log(email, 'sign in', 'token: ' + token + …)`. Un consumidor
  que no sobreescribiera `plugins` —y el diseño le animaba a no hacerlo— desplegaba a producción
  una app que **imprime tokens de login en los logs y no envía ningún correo**: nadie puede
  entrar.

## Decisión

### D1 — Factoría, no singleton

`@callepuzzle/auth/client` exporta una **función**:

```ts
export function createCallepuzzleAuthClient<O extends ClientOptions>(options?: O): AuthClientOf<O>;
```

No hay ningún `export const` que ejecute lógica de sesión o de cliente al importar el módulo.
En particular **no hay `export const session = useSession()`**, y el `as any` ha desaparecido:
el retorno es el tipo real de `createAuthClient` para las opciones dadas, así que el cliente
conserva la inferencia de los endpoints y del `$Infer.Session` de **los plugins del consumidor**.

El consumidor instancia una sola vez, en su propio módulo —que es justo lo que ya hacen los dos
consumidores reales:

```ts
// src/lib/auth-client.ts
import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createCallepuzzleAuthClient({ plugins: [emailOTPClient()] });
export type AuthClient = typeof authClient;
```

Un `export const authClient = …` en el módulo del consumidor **no** es el bug de H5.1: crear el
cliente no lee ni escribe sesión. Lo que no puede vivir en scope de módulo es el **estado**
(`useSession()`).

Se mantiene `AuthClient` como alias de `CallepuzzleAuthClient` para no romper a los consumidores
que ya lo importaban, pero ahora es el tipo real, no `any`. `Session<O>` y
`SessionOf<typeof authClient>` cubren los dos estilos de uso.

### D2 — La sesión viaja por el `load`, no por un store global

La sesión se resuelve **una vez por request** en el `Handle`, se deja en `event.locals`, y de
ahí sale por el `load` del servidor hasta los componentes como **dato plano**:

```
betterAuthHandle → event.locals.user → +layout.server.ts → data.user → <NavBarEnd {user} />
```

`NavBarEnd` pasa de `session: Session` (un store, y `any`) a `user?: SessionUser | null`, donde
`SessionUser` es `{ id, name?, email?, image? }` definido en `packages/ui/src/types.ts`. Es lo
que hacía ya `donde-esta-tu-local`, y es correcto por request en SSR. De paso, los componentes
de UI no importan `@callepuzzle/auth` ni para tipos: lo que necesitan del cliente se tipa
**estructuralmente** (`SignOutClient`, `MagicLinkClient`, `EmailOtpClient`), así que valen con
cualquier cliente de better-auth, con los plugins que sea.

Que la sesión no sea un store tiene una consecuencia visible: la librería **nunca** llama a
`invalidateAll()`. Tras un login, quien tiene que refrescar los datos es el consumidor, en el
callback `onSuccess` de `FormLoginMagicLink` / `FormLoginOtp`.

### D3 — Presets con función de envío obligatoria

`@callepuzzle/auth/server` no impone plugins. El merge es explícito y solo propaga los del
consumidor:

```ts
export function getBetterAuth(options: BetterAuthOptions) {
	return betterAuth({
		...options,
		plugins: [...(options.plugins ?? [])]
	});
}
```

Los plugins habituales se ofrecen como **presets opcionales** con el envío como argumento
**obligatorio**:

```ts
export function magicLinkPreset(send: SendMagicLink, options?: MagicLinkPresetOptions);
export function emailOtpPreset(send: SendVerificationOtp, options?: EmailOtpPresetOptions);
```

Que `send` sea obligatorio es la parte importante: **no compila** un magic link sin forma de
enviar el correo, así que es imposible desplegar la versión que hace `console.log` del token.
Cero plugins por defecto, cero `console.log`, cero envío falso de credenciales. `SendMagicLink`
y `SendVerificationOtp` son los tipos reales de better-auth, no firmas paralelas que se puedan
desfasar.

### D4 — El `Handle` no declara `App.Locals`

`@callepuzzle/auth/hooks` mantiene `betterAuthHandle(auth, building)` —el segundo argumento sale
de `$app/environment` y hace falta porque durante el prerender no hay request real. Lo que
**no** hace es augmentar `App.Locals` globalmente: escribe en `event.locals` tipándolo de forma
estructural y local (`BetterAuthLocals`), y documenta en su JSDoc la augmentación que el
consumidor debe escribir en su `src/app.d.ts`. Una librería que declara `declare global` obliga
a todos sus consumidores a su forma de `Locals` y choca con la de la app.

### D5 — Cliente y servidor en subpaths distintos

`./client`, `./server` y `./hooks`, sin entrypoint raíz (H5.7/H3.2): reexportar `client.ts` y
`server.ts` desde el mismo módulo arrastraba código de servidor al bundle del navegador.

### D6 — `sender.ts` se borra

Era código muerto: se exportaba por defecto pero `index.ts` no lo reexportaba y `server.ts` lo
tenía comentado, mientras `nodemailer` figuraba como `dependency` de dos paquetes (en uno de
ellos sin usarse en absoluto). Cada app usa su propio transporter —el de `donde-esta-tu-local`,
cacheado a nivel de módulo, ya es mejor que este—, así que se elimina junto con `nodemailer`,
`@types/nodemailer` y el export `./sender`.

## Alternativas descartadas

- **Mantener el singleton y crear el cliente en `browser` solamente**
  (`export const session = browser ? useSession() : null`). Quita el bug de SSR y deja el
  ergonómico `import { session }`, pero: el store sigue siendo global en cliente (irrelevante
  ahí, pero conceptualmente el mismo diseño), obliga a que todo componente que lea sesión
  soporte el caso `null` durante el SSR —es decir, la navbar parpadea en cada carga—, y no
  arregla ni el tipado ni los plugins impuestos. La sesión ya llega gratis por el `load`: un
  store solo añade una segunda fuente de verdad que puede divergir.
- **Un store de sesión por request con `AsyncLocalStorage`**, como hace `@bitban/i18n` con el
  locale ([ADR de bitban](../plans/04-i18n.md) lo cita). Resolvería H5.1 de verdad, pero es
  maquinaria para un problema que SvelteKit ya tiene resuelto: `event.locals` **es** el
  almacenamiento por request, y el `load` **es** el canal hasta los componentes. En bitban hacía
  falta porque el dato (el locale del tenant) lo consumen funciones puras llamadas desde
  cualquier parte del render, no componentes con props.
- **`getBetterAuth` con `plugins` heredables** (un `mergePlugins` que una defaults y extras por
  nombre). Arreglaría el merge superficial de H5.3 pero no el problema de fondo: los defaults
  siguen imponiendo tablas y flujos a quien no los quiere. Sin defaults no hay nada que mezclar.
- **Que la librería exporte el `sendMagicLink` de nodemailer** con `nodemailer` como peer
  opcional. Es la otra salida que contemplaba el plan (P5.4). Descartada por superficie: el
  envío de correo es infraestructura de la app (SMTP, plantillas, remitente, reintentos), no
  parte de un contrato de UI.

## Consecuencias

- `y-tu-que-compras` tiene que cambiar tres cosas: `betterAuth` → `betterAuthHandle` en el
  subpath `/hooks` y con el segundo argumento `building`, su `auth-client.ts` copiado por la
  factoría sin `session`, y `<Header {session} {authClient}>` por `user` desde el `load`. El
  mapeo completo está en [`docs/migracion.md`](../migracion.md).
- Cada consumidor escribe su augmentación de `App.Locals` (cuatro líneas) y su
  `+layout.server.ts` que expone `locals.user`. Es más código en la app y menos magia en la
  librería.
- Elegir plugins y escribir la función de envío deja de ser opcional. Un proyecto nuevo no
  arranca con un login "que ya funciona" y en realidad no envía nada; arranca con un error de
  compilación que le dice qué falta.
- Cómo se monta todo, de principio a fin, está en [`docs/auth.md`](../auth.md).
