# @callepuzzle/svelte-ui

## 1.1.1

### Patch Changes

- 273b086: Bump `zod` devDependency to `^4.6.7` (GHSA-mrhx-c7xc-m3w5): unbounded memory accumulation when validating large arrays. No runtime change — the published peer range already allows zod 4.
- Updated dependencies [273b086]
  - @callepuzzle/core@1.0.1

## 1.1.0

### Minor Changes

- b060f4f: Los desplegables de `NavBarEnd` (selector de idioma y menú de usuario) dejan de abrir por
  `:focus-within` y usan el patrón «menu button» de WAI-ARIA: WebKit (Safari/iOS) no da foco a un
  `<button>` al pulsarlo, así que en un iPhone el menú podía no abrir o cerrarse en cuanto
  aparecía. Ahora la apertura es estado explícito (daisyUI lo pinta con `dropdown-open`), la lista
  sólo se renderiza abierta, `aria-expanded` refleja el estado real y los roles son de menú
  (`menu`/`none`/`menuitem`, y `menuitemradio` + `aria-checked` en el selector de idioma, que
  recibe la prop nueva `activeLocale` para marcar el idioma en curso). Hay navegación por teclado
  (Enter/Espacio/↓/↑ abren, ↑/↓/Inicio/Fin mueven, Escape cierra devolviendo el foco) y cierre al
  pulsar fuera, al salir con Tab y al elegir una entrada. Las entradas del snippet `menuExtra`
  deben seguir ese marcado (`<li role="none">` con `role="menuitem"`); el snippet sigue siendo un
  `Snippet` sin argumentos y elegir cualquiera cierra el menú.
  
  Se publica también el componente genérico `DropdownMenu`, para que las apps no dupliquen el
  patrón: apertura por estado, roles, teclado y cierre por click fuera/Tab/Escapes, con los
  snippets `trigger` e `items` (éste recibe `close`) y la opción `closeOnSelect` para cerrar al
  activar cualquier item.

## 1.0.0

### Major Changes

- ce85e3d: Primera versión estable: los componentes con el patrón de textos por prop/contexto y snippets se
  consideran estables tras la revisión completa del código y la auditoría de seguridad. Dos cambios
  de API en esta release: `FormLoginOtp` añade la prop `length` (dígitos del código, 6 por defecto,
  para cuadrar con el `otpLength` de `emailOtpPreset`) y su texto `otpDescription` pasa a ser una
  función `(digits: number) => string`. Los próximos cambios incompatibles saldrán como major.

### Patch Changes

- d43b65f: `NavBarEnd` carga `user.image` con `referrerpolicy="no-referrer"`: si la URL del avatar es de un
  tercero, no recibe la página desde la que se mira.
- Updated dependencies [ce85e3d]
  - @callepuzzle/core@1.0.0

## 0.2.0

### Minor Changes

- 24f5d9c: Reparto de props de anclaje y contexto de textos, a partir de la migración de
  `donde-esta-tu-local` (ver `docs/plans/14-revision-migracion-donde-esta-tu-local.md`):
  
  - `NavBarList` y `Dock` son genéricos en el tipo de clave del `RouteMap` y aceptan
    `ids?: Partial<Record<Id, string>>`: atributo `id` del `<a>` de cada entrada, por clave del
    mapa. Es el anclaje que necesitan los tours guiados; hasta ahora un consumidor con tour tenía
    que reimplantar la lista (o el `<nav>` del dock) entera.
  - Nuevo `setUiStrings` / `getUiStrings` (contexto de Svelte): los textos de todos los
    componentes pueden fijarse una vez en el layout raíz. Cada componente resuelve con la
    precedencia prop `strings` > contexto > default en inglés; la prop sigue ganando para
    puntuales.
  - `FormLoginOtp`: `startOverHref` pasa por `resolve()` como el resto de enlaces de la librería
    (antes era una URL cruda), para respetar `paths.base`.
  - `FormLoginMagicLink`: documentado que `callbackURL` es una URL cruda para better-auth (no
    pasa por `resolve()`).

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

### Patch Changes

- Updated dependencies [7176a13]
  - @callepuzzle/core@0.1.0
