# @callepuzzle/auth

## 1.0.0

### Major Changes

- ce85e3d: Primera versión estable, y lo es con una **incompatibilidad dentro**: `betterAuthHandle` exige
  `baseURL` y un secreto propio de al menos 32 caracteres, y no atiende ninguna petición sin ellos
  (detalle en el changeset de seguridad de esta misma release). La factoría `getBetterAuth`, los
  presets `magicLinkPreset`/`emailOtpPreset` y el `Handle` se consideran estables tras la revisión
  del código y la auditoría de seguridad; los próximos cambios incompatibles saldrán como major.

### Minor Changes

- d43b65f: Seguridad: `betterAuthHandle` comprueba en la primera petición (fuera del build) que la instancia
  tiene `baseURL` y un secreto propio de al menos 32 caracteres, y si no, no atiende ninguna
  petición. Sin `baseURL`, better-auth deduce la URL de los magic links de las cabeceras
  `X-Forwarded-*` de la primera petición y la conserva para todo el proceso, así que quien la envíe
  decide a qué dominio llegan los tokens de login. **Cambio incompatible**: fija `baseURL` /
  `BETTER_AUTH_URL` y `secret` / `BETTER_AUTH_SECRET` antes de actualizar.
  
  `skipAssets` ya no se salta `.json`, `.txt` ni `.xml`: saltarse `__data.json` dejaba `locals.user`
  vacío en cada navegación en cliente. Ahora solo cuenta como asset `/_app/**`, el service worker e
  imágenes y fuentes.
  
  El JSDoc de `emailOtpRateLimitRules` explica qué más hace falta para que el rate limit sirva:
  `ipAddressHeaders` según el proxy y un `storage` compartido.

## 0.2.0

### Minor Changes

- 24f5d9c: - `betterAuthHandle` acepta opciones (`BetterAuthHandleOptions`): con `{ skipAssets: true }` el
    handle no resuelve sesión ni pasa por better-auth en peticiones de assets estáticos
    (`/_app/**`, service worker y extensiones estáticas). Un asset nunca resuelve sesión ni atiende
    `/api/auth/*`, así que el salto es seguro y se ahorra una llamada a `getSession` por fichero
    servido.
  - Nuevo `emailOtpRateLimitRules({ window, max })`: las reglas de `rateLimit.customRules` para los
    dos endpoints del flujo OTP por email (pedir y canjear el código), con 3 por minuto por IP por
    defecto. Era el mismo bloque que cada consumidor copiaba a mano.

## 0.1.0

### Minor Changes

- 7176a13: Primera versión distribuible de la librería.
  
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
