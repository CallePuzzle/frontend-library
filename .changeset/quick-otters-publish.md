---
'@callepuzzle/core': minor
'@callepuzzle/auth': minor
'@callepuzzle/svelte-ui': minor
---

Primera versión distribuible de la librería.

**Distribución.** Scope público `@callepuzzle` y publicación en GitHub Packages
(`npm.pkg.github.com`) con Changesets. `@repo/library` se parte según su frontera real en
`@callepuzzle/core` (rutas, tipos y schemas, sin dependencias de runtime) y `@callepuzzle/auth`
(wrapper de better-auth, con `./client`, `./server` y `./hooks` separados por entorno de
ejecución en vez de un barrel que mezclaba cliente y servidor). `@repo/sveltekit-ui` pasa a
`@callepuzzle/svelte-ui`, con `files`, `sideEffects`, `publishConfig` y las tres condiciones de
`exports`.

**Auth.** Se elimina el `useSession()` en scope de módulo, que en SSR compartía un único store
de sesión entre todas las peticiones del proceso. El cliente pasa a ser una factoría
(`createCallepuzzleAuthClient`) y recupera los tipos reales de better-auth, que antes eran `any`
por un `as any`. `getBetterAuth` deja de imponer plugins y de pisarlos con un merge superficial;
`magicLinkPreset` y `emailOtpPreset` exigen la función de envío como argumento obligatorio, de
modo que ya no es posible desplegar el `sendMagicLink` que solo trazaba el token por consola.
La sesión viaja por el `load` del servidor y llega a los componentes como dato plano.

**i18n.** La librería ya no compila Paraglide: recibe los textos por props (`strings`) con
defaults en inglés. Antes convivían tres runtimes de Paraglide con estados de locale distintos y
el idioma que fijaba la app no llegaba a los textos de la librería; además `routes` resolvía sus
mensajes en scope de módulo, congelando el locale para todo el proceso.

**Rutas.** El modelo pasa a `RouteMap` con **la clave como ruta**, `label` y `getMenuRoutes()`.
Fuera `url` (que podía ser una función y se renderizaba como código fuente en el `href`),
`isProtected` y `permissions` (que nadie leía) y el mapa de URLs de producto que ningún consumidor
respetaba.

**Componentes.** Todos aceptan `class` y reenvían atributos, y ninguno importa rutas, sesión,
cliente de auth ni mensajes. `Header` es solo la navbar y el cajón lateral sale a un `Drawer`
opcional con id derivado de `$props.id()`. `Modal` usa `bind:this` y exporta `showModal()`.
`NavBarEnd` recibe el usuario por prop, arregla el HTML inválido del selector de idioma y pierde
la foto de stock de daisyUI. Los campos de formulario pasan a genéricos y se despachan por tipo
(`FormString`, `FormNumber`, `FormCheckbox`, `FormSelect`, `FormTextarea`). `FormLogin` se parte en
`FormLoginMagicLink` y `FormLoginOtp` (este último en el subpath `./otp`, con `bits-ui` como peer
opcional). Nuevos: `Dock`, `DockLink`, `Footer`, `ButtonSignOut`, `UserNotLogged`.

**Schemas.** Migración a zod v4 con `z.toJSONSchema` nativo: desaparece `zod-to-json-schema`, que
se importaba sin estar declarado y habría roto la instalación desde el registro. El parseo ya no
lanza con un schema sin campos obligatorios, lee `placeholder`/`description` de `.meta()` y
devuelve campos discriminados por tipo.

**Estilos.** daisyUI 5 sobre Tailwind 4 como contrato declarado: `tailwindcss` y `daisyui` son
peers y la hoja publicada (`@callepuzzle/svelte-ui/styles.css`) declara su propio `@source`, así
que el consumidor no necesita saber dónde está instalada la librería.
