# 14 — Revisión de la migración de `donde-esta-tu-local` a la 0.1.0

**Prioridad: alta.** Es el primer consumidor real de producción de la librería publicada, y la
prueba de fuego que el plan [12](12-convergencia-consumidores.md) llamaba «Fase B/D». Esta
revisión coteja el resultado contra el código de la librería y extrae qué mejorar aquí para que
la integración (y la del siguiente consumidor) sea directa.

- Consumidor: `../donde-esta-tu-local`, rama `154-usar-frontend-library` (commit `62a6d13`
  revisado por ellos el 2026-10-14; su plan y su code review están en
  `docs/plans/migracion-callepuzzle-frontend-library.md` de su repo).
- Librería: `main` (`a774096`), que es lo publicado como `@callepuzzle/*@0.1.0`.
- Verificado por ellos: `check` 0 errores, 91/91 unitarios, 24/24 E2E (login por UI contra el
  `FormLoginOtp` real), build de producción con el grep del CSS en verde.

## Veredicto

**La migración se completó sin tocar la librería**: ningún cambio upstream hizo falta para
compilar, pasar los tests ni el build. La API de la 0.1.0 aguanta su primer caso real. Eso
valida las decisiones estructurales (factoría de cliente, tipos estructurales, i18n por
inyección, la clave del `RouteMap` como ruta, `FormLogin` partido en dos).

El coste está en el **detalle**: el consumidor se quedó con **cinco componentes «wrapper fino»**
(`NavBarList`, `Dock`, `Modal`, `NavBarEnd`, `UserNotLogged` de su `src/lib/components/`) que
existen por carencias concretas de la librería, no por capricho de producto. Cada wrapper es una
medida de una mejora pendiente aquí.

| Wrapper del consumidor             | Causa raíz en la librería                                         | Hallazgo                  |
| ---------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| `NavBarList.svelte`, `Dock.svelte` | No reparten props (`id`) a sus enlaces internos                   | [M1](#m1)                 |
| `Modal.svelte`, `NavBarEnd.svelte` | Repetición de `strings` en cada punto de uso para traducir        | [M2](#m2)                 |
| `UserNotLogged.svelte`             | Comportamiento de producto (auto-open); correcto que no esté aquí | — (frontera bien trazada) |

## Lo que la migración valida (no tocar)

- **`createCallepuzzleAuthClient` con tipado real**: el consumidor pasa `emailOTPClient()` +
  `adminClient()` y conserva la inferencia sin un solo `as`. El patrón `export type AuthClient =
typeof authClient` del cliente funciona tal cual está documentado.
- **`getBetterAuth` sin plugins impuestos + `emailOtpPreset(send)`**: la app monta
  `sveltekitCookies`, `admin()` y su `rateLimit.customRules` sin fricción, y el `send`
  obligatorio les sirvió para mantener su envío real (nodemailer) y el log del OTP solo en dev.
- **`betterAuthHandle(auth, building)`** encaja en su `sequence` de handles y el patrón de
  `app.d.ts` con `auth.$Infer.Session` es exactamente el documentado en `BetterAuthLocals`.
- **`RouteMap<RouteId>`** compila con el `RouteId` real de `$app/types` del consumidor (7 rutas,
  incluidas subrutas `/admin/gangs`), sin casts.
- **El filtro estricto de `getMenuRoutes({ mobile: true })`** no causó ningún bug: el consumidor
  leyó la regla, declaró los dos flags donde hacía falta y lo dejó comentado en su `routes.ts`.
  Fricción nula, comportamiento explícito: es lo que se buscaba.
- **`FormFields` genérico + `zodToFieldsJsonSchema`**: los dos formularios propios (`FormUser`,
  `FormAddGang`) filtran campos a mano (`imageFile`, `lat`/`lng`) y pasan el resto; la unión
  discriminada `Field` aguanta el filtrado sin tipos.rotos.
- **`Modal` con `bind:this` + `showModal()`/`close()` exportados**: los 8 puntos de uso locales
  no cambiaron nada. El diseño de exportar métodos del componente parió la migración.
- **«La librería no navega»: el patrón `onSuccess`** (`invalidateAll()` + cerrar el modal) se
  adoptó sin dolor y mató el `setTimeout(2000)` heredado. `ButtonSignOut` en `/profile` con sus
  defaults (`redirectTo: '/'`) sustituyó al botón local sin cambios de comportamiento.
- **zod como peer**: el consumidor entendió que debía declararlo directo y lo hizo (T2 de su
  plan). La estrategia peer/dependency se explica sola.
- **La frontera de producto se respetó sola**: el auto-open del login con retardo de 2 s y el
  store del modal (`loginModalStore`) se quedaron en la app, no dentro de la librería. Es justo
  lo que el rediseño de `UserNotLogged`/`NavBarEnd` pretendía.

## Hallazgos

### <a id="m1"></a>M1 — `NavBarList` y `Dock` no reparten props a sus enlaces — **alta**

`Link` y `DockLink` aceptan `id` (fue la T6.5, para los tours guiados), pero los contenedores
que los renderizan no tienen forma de pasárselo por entrada. Resultado: el consumidor **reimplantó
ambos componentes** (su `NavBarList.svelte` y su `Dock.svelte` son copias finas de los nuestros,
añadiendo `id={tourDesktopElementIds[route.id]}` / `id={tourMobileElementIds[route.id]}`), y su
propia revisión lo deja como «seguimiento: contribuir upstream una prop `ids` y adelgazar aquí».

Es la única duplicación de componentes que quedó de toda la migración y, por tanto, la mejora con
mejor relación esfuerzo/beneficio. Además invalida parcialmente el snippet `children` de `Dock`
(existe justo para entradas extra, pero quien lo usa con enlaces propios se lleva el mismo
problema en el resto del dock).

**Propuesta** (opción recomendada primero):

1. `ids?: Partial<Record<Id, string>>` con los componentes genéricos en `Id` (hoy `routes:
RouteMap`; pasar a `<Id extends string>` + `routes: RouteMap<Id>` es retrocompatible). Mapa
   directo `route.id → atributo id`, que es exactamente el caso de uso del tour.
2. Alternativa más general si aparece otro caso: `linkProps?: (route: Route<Id>) => Record<string,
unknown>` reenviado al `Link`/`DockLink` de cada entrada.

Con 1, el consumidor borra sus dos wrappers y usa `NavBarList`/`Dock` + el snippet `children` del
`Dock` para la entrada «instalar PWA».

### <a id="m2"></a>M2 — i18n: repetir `strings` en cada punto de uso obliga a wrappers — **alta**

Con defaults en inglés (ADR 0003), una app monolingüe repite el objeto `strings` **en cada punto
de uso**: el consumidor pasa `{ required, optional }` a los tres `FormFields`, recompone casi
todas las claves de `FormLoginOtpStrings` (11 claves), traduce `Modal` (envuelto), `NavBarEnd`
(envuelto), `ButtonSignOut`, `Header.back`… Los wrappers de `Modal` y `NavBarEnd` existen
principalmente para esto.

**Propuesta**: un mecanismo de **defaults por app vía contexto de Svelte**, sin tocar la regla de
fondo (los textos siguen entrando por inyección, no se compila ningún runtime de i18n):

- `setUiStrings(partial)` (componente `<UiStrings>` o helper con `setContext`) que la app llama
  una vez en su layout raíz con sus textos.
- Cada componente resuelve: prop `strings` **> contexto** > default inglés. La prop sigue ganando
  para puntuales, así que nada de lo existente se rompe.

Candidato a subpath propio (`@callepuzzle/svelte-ui/strings` o similar) para no engordar el
barrel. De paso arregla el hallazgo nº 3 de la revisión del consumidor: hoy
`search`/`notifications`/`language` de `NavBarEnd` quedan en inglés silenciosamente y filtrarían
si algún día activa esas features; con el contexto, toda la app se traduce de una vez.

Sin este mecanismo, cada componente nuevo con texto multiplica la fricción; con él, los wrappers
de `Modal` y `NavBarEnd` desaparecen.

### <a id="m3"></a>M3 — Estilos: la variante «pipeline propio + `@source`» no está documentada — **media**

La historia oficial de [instalacion.md](../instalacion.md) es «importa
`@callepuzzle/svelte-ui/styles.css` y no escribas tu propio tailwind/daisyUI», con dos variantes
(default y tema custom con `@plugin "daisyui/theme"`). El consumidor eligió una tercera, legítima
y razonada (decisión nº 2 de su plan): conservar **todo** su `app.css` (tema dark único
personalizado, más `@tailwindcss/forms`, `typography` y flowbite) y añadir a mano
`@source '../node_modules/@callepuzzle/svelte-ui/dist'`.

Quien tiene plugins propios de Tailwind acaba ahí sí o sí (su `app.css` ya declara
`@import 'tailwindcss'`, así que importar además nuestra hoja duplicaría configuraciones), y hoy
esa variante está **sin documentar**: ni una mención en `instalacion.md`, ni fila en su tabla de
problemas, ni en el README. Riesgo concreto: un usuario bienintencionado «corrige» ese `@source`
a mano (o lo pierde al copiar config) y reaparece el fallo clásico de componentes sin estilo y
sin error.

**Propuesta**: sección «Si ya tienes tu propio pipeline de Tailwind» en `instalacion.md` con: el
`@source` exacto, el síntoma, y el grep de verificación (el mismo que el consumidor usa en su
T3/T23). Mencionar que apunta a `dist` a propósito (el paquete solo publica `dist`), y que la
alternativa soportada para temas sigue siendo importar la hoja + `@plugin "daisyui/theme"`.

### <a id="m4"></a>M4 — `betterAuthHandle` resuelve sesión en cada request, incluidos assets — **media**

El handle llama a `auth.api.getSession` sin condición; el consumidor lo envolvió en un
`skipAssets` propio (14 líneas genéricas sobre `is-asset-pathname`) para no pagar una resolución
de sesión en cada imagen/fuente. Su code review confirma que el skip es necesario y correcto.

**Propuesta**: absorberlo. O bien `betterAuthHandle(auth, building, { skipAssets: true })` con la
misma heurística (rutas de assets estáticos: `_app`, ficheros con extensión servidos de
`static`…), o exportar un `skipAssets` composable desde `@callepuzzle/auth/hooks` y documentar la
composición con `sequence`. Es código diminuto, sin dependencias nuevas, y todo consumidor con
assets estáticos va a querer lo mismo (el demo todavía no lo hace y paga una `getSession` por
asset).

### <a id="m5"></a>M5 — Semántica inconsistente de los `href` entre props — **media**

La convención de la casa es «el `href` es la clave del `RouteMap`, se resuelve con
`resolve()`» (`Link`, `DockLink`, `ButtonSignOut.redirectTo`, y `NavBarEnd.profileHref`/
`notificationsHref`, que van vía `Link`). Pero no siempre:

| Prop                                        | Tratamiento                                  | Riesgo con `paths.base`                      |
| ------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `Link.href`, `DockLink` (route.id)          | `resolve()`                                  | —                                            |
| `ButtonSignOut.redirectTo`                  | `resolve()`                                  | —                                            |
| `NavBarEnd.profileHref`/`notificationsHref` | `resolve()` (vía `Link`)                     | —                                            |
| `FormLoginOtp.startOverHref`                | **cruda**, en un `<a data-sveltekit-reload>` | el enlace sale fuera del base path           |
| `FormLoginMagicLink.callbackURL`            | **cruda**, se la pasa a better-auth          | better-auth no conoce `paths.base` de la app |

Con `paths.base` vacío (el caso de ambos consumidores hoy) no se nota; con base path,
`startOverHref="/"` navegaría fuera de la app. Es el mismo espejismo que ya sufrió
`y-tu-que-compras` con las URLs-función.

**Propuesta**: resolver `startOverHref` con `resolve()` como el resto (cambio pequeño, changeset
minor) y documentar en `docs/auth.md`/componente que `callbackURL` es una URL para better-auth
(no pasa por `resolve()`), con la receta para apps con base path. Añadir una tablita «qué props
son id de ruta y cuáles URL crudas» en `docs/auth.md` o en el README de `ui`.

### <a id="m6"></a>M6 — El rate limit del OTP se copia en cada consumidor — **baja**

El demo (`demos/sveltekit/src/lib/server/auth.ts`) y el consumidor escriben **los mismos**
`rateLimit.customRules` para `/email-otp/send-verification-otp` y `/sign-in/email-otp` (el demo
añade el de magic link). El rate limit vive en las opciones raíz de better-auth, así que el
preset no puede fijarlo, pero la repetición es señal.

**Propuesta**: exportar de `@callepuzzle/auth/server` un helper que devuelva las reglas
(`emailOtpRateLimitRules({ window, max })` o un objeto preconfigurado), o al menos el snippet en
`docs/auth.md`. Nada urgente.

### <a id="m7"></a>M7 — Pendientes conocidos que este consumidor mantiene vivos — **referencia**

Ya anotados en la revisión del 2026-10-12 ([todo.md](todo.md)); esta migración no los agrava
pero confirma que siguen ahí:

- **PIN de 6 hardcodeado** en `FormLoginOtp` vs `otpLength` del preset: el consumidor usa 6 hoy;
  el día que el servidor emita 8, el input no deja escribirlo.
- **Prop `schema` no reactiva** en los dos formularios de login: el consumidor le pasa un schema
  en `$derived` (textos Paraglide); con un solo locale no hay bug visible, pero es la primera
  app que usaría el camino del cambio de idioma con el modal abierto.
- `onSignOut` de `ButtonSignOut` sin usar en `/profile` (bonus de `invalidateAll` que no han
  cogido todavía; sin repercusión).

### <a id="m8"></a>M8 — El toolchain de la librería va por detrás de su consumidor de producción — **media**

Producción ya corre **vite 8 / `@sveltejs/vite-plugin-svelte` 7 / vitest 4 / svelte 5.57 / kit
2.70 / better-auth 1.7 / zod 4.6 / `@lucide/svelte` 1.37**, y la migración completa (unit + E2E +
build) pasó en verde contra la librería precompilada. Los peers de la 0.1.0 ya cubren ese stack
(verificado), pero las devDependencies y la matriz de tests del monorepo siguen en vite 7 /
vitest 3 / storybook 9.1. La T12.8 dejó la subida «para una tanda aparte»: esa tanda ya tiene
justificación empírica — el stack objetivo es el que corre en producción.

**Propuesta**: tanda de actualización del toolchain del monorepo (devDeps + CI) hacia el stack
del consumidor, con changesets minor y re-medición de la matriz de compatibilidad del README. No
mezclar con cambios de API. Riesgo conocido que no hay que olvidar: `monorepo-v2` ya promocionada
a `main`, así que changesets/release ya funcionan; no reabrir eso.

## Fricción de distribución (constancia, sin acción)

GitHub Packages exige token (`NPM_TOKEN` con `read:packages`) **también para instalar paquetes
públicos**, lo que añade un paso a todo consumidor (y a Vercel: su T26 pendiente es exactamente
ese). Es una consecuencia aceptada de la decisión de distribución ([01](01-estrategia-distribucion.md)),
no un defecto nuevo; queda anotado porque el siguiente consumidor lo volverá a encontrar.

## Tareas

### En la librería

- [x] **T14.1** `NavBarList` y `Dock`: genéricos en `Id` + prop `ids?: Partial<Record<Id, string>>`
      (o `linkProps` si sale otro caso de uso), con test de que el `id` llega al `<a>`.
      Changeset minor en `ui`. _(M1)_
- [x] **T14.2** Mecanismo de defaults de `strings` por app vía contexto (`setUiStrings` +
      resolución prop > contexto > default), valorando subpath propio; documentar en
      `docs/i18n.md` sin debilitar el ADR 0003. Changeset minor en `ui`. _(M2)_
- [x] **T14.3** `instalacion.md`: sección «pipeline propio de Tailwind» con el `@source` exacto,
      síntoma y grep de verificación; fila nueva en la tabla de problemas. _(M3)_
- [x] **T14.4** `betterAuthHandle`: opción `skipAssets` (o exportar `skipAssets` composable) con
      su test, y anotar el porqué (no resolver sesión en assets). Changeset minor en `auth`. _(M4)_
- [x] **T14.5** `FormLoginOtp.startOverHref` vía `resolve()`; documentar la semántica de
      `callbackURL` y la tablita «id de ruta vs URL cruda». Changeset minor en `ui`. _(M5)_
- [x] **T14.6** Helper (o snippet documentado) para las reglas de rate limit del OTP. _(M6)_
- [ ] **T14.7** Subida del toolchain del monorepo al stack del consumidor (vite 8, vitest 4,
      svelte/kit al día), con re-medición de la matriz de compatibilidad. Tanda separada de
      cualquier cambio de API. _(M8)_

### En `donde-esta-tu-local` (fuera de este repo, para cuando aterricen las anteriores)

- [ ] **T14.8** Cerrar sus pendientes T25 (repaso manual) y T26 (`NPM_TOKEN` en Vercel) antes de
      mergear.
- [ ] **T14.9** Con T14.1/T14.2 publicadas: borrar sus wrappers `NavBarList`, `Dock`, `Modal` y
      `NavBarEnd` (usar `NavBarList`/`Dock` de la librería con `ids`, y el contexto de strings),
      completar las claves de `search`/`notifications`/`language`, y valorar `onSignOut` en
      `/profile`.

## Criterios de aceptación

- Un consumidor nuevo con tour guiado, tema propio y app monolingüe puede integrarse **sin
  reimplementar ni un solo componente de la librería** (hoy son cuatro wrappers + repetición de
  `strings`).
- `instalacion.md` cubre las dos variantes de estilos y el fallo típico de cada una.
- La matriz de compatibilidad del README declara el stack que realmente corre producción.

## Estado (2026-10-14)

Revisión hecha contra `main` (`a774096`, equivalente a la 0.1.0 publicada) y la rama del
consumidor (`62a6d13`), leyendo los puntos de uso uno a uno y contrastándolos con el código
fuente de los tres paquetes. No se ha tocado código; este documento es el entregable. Las tareas
T12.11/T12.12 de [12](12-convergencia-consumidores.md) quedan materialmente cubiertas por esta
migración (pendientes solo los T25/T26 del lado del consumidor): que las marque quien coordina.

### Estado (2026-10-14, segunda pasada): implementadas T14.1–T14.6

Implementadas las mejoras de la librería en una sola tanda, con sus changesets minor (`ui` y
`auth`) y su documentación:

- **T14.1** — `NavBarList` y `Dock` genéricos en `Id` con prop `ids`; tests nuevos para ambos
  (`Dock.svelte.test.ts` es nuevo). Los componentes genéricos no exportan `Props` (limitación de
  svelte2tsx con `generics`; es la convención que ya tenían `FormFields`/`FormString`).
- **T14.2** — `packages/ui/src/strings/context.ts`: `setUiStrings`/`getUiStrings` con
  `Symbol.for` (atraviesa copias duplicadas del paquete) y tipos `UiStringsMap`/`UiStrings`
  exportados del barrel. Conectado a los 15 componentes con `strings` (precedencia prop >
  contexto > default). Documentado en `docs/i18n.md`. Descartado el subpath propio: a diferencia
  de `./otp`, no aísla ninguna dependencia opcional.
- **T14.3** — `docs/instalacion.md`: sección «Si ya tienes tu propio pipeline de Tailwind» y fila
  nueva en la tabla de fallos.
- **T14.4** — `BetterAuthHandleOptions.skipAssets` con heurística de assets propia del paquete y
  `hooks.test.ts` nuevo (5 tests: locals, sin sesión, salto de assets, no-salto de rutas normales
  y de `/api/auth/*`, y default intacto).
- **T14.5** — `startOverHref` pasa por `resolve()` (mismo estrechado tipado que `Link`);
  `callbackURL` documentada como URL cruda; tabla «ruta vs URL cruda» en `docs/auth.md`.
- **T14.6** — `emailOtpRateLimitRules({ window, max })` (3/min por defecto) con tests y dogfood
  en el demo, que ya no repite las dos reglas a mano.

Verificación ejecutada tras la tanda: `format`, `lint`, `check-types`, `test` (root: 8/8 tareas;
`ui` 102 tests, `auth` 20, `core` y demo incluidos), `build` y `check-publish` (attw todo 🟢).

**T14.7 se queda abierta a conciencia, con su mapa de dependencias ya levantado**: vite 8 exige
Storybook 10 (`@storybook/svelte-vite` 9.x se queda en `vite: ^5 || ^6 || ^7`; el soporte de
`^8` llega en 10.6), y vitest 4+ exige `@vitest/browser` 4+ y el `addon-vitest` de SB10. Es
decir, no es una subida de versiones sino la migración **SB9 → SB10 + salto mayor de vitest +
vite 8** (con `addon-svelte-csf`, `@chromatic-com/storybook` y `vitest-browser-svelte` en la
cascada). Mezclarla con esta tanda de API habría sido exactamente lo que la T12.8 quiso evitar;
se hace sola, con la suite completa como red.
