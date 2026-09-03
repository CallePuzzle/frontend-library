# 10 — Storybook y tests

**Prioridad: media.** Storybook es la razón de ser del repo (está en el nombre) y ahora mismo
las stories no prueban nada.

## Contexto

`packages/sveltekit-ui/.storybook/` con `@storybook/sveltekit` 9.1, addons de docs, a11y,
svelte-csf y vitest. 5 ficheros de stories en `src/stories/`.

## Hallazgos

### H10.0 — Storybook no arranca: falta `src/app.html` (bloqueante)

Descubierto al implementar [02](02-alcance-monorepo.md). Tanto `storybook dev` como
`build-storybook` fallan antes de compilar nada:

```
=> Failed to build the preview
Error: src/app.html does not exist
    at load_template (@sveltejs/kit/src/core/config/index.js:19:9)
```

`.storybook/main.ts` usa el framework **`@storybook/sveltekit`**, que monta el plugin de vite de
SvelteKit; su hook `config` llama a `sync.all()`, que exige un `src/app.html`. `packages/ui` es
una librería y nunca ha tenido ese fichero (`git show HEAD:packages/sveltekit-ui/src/app.html`
no devuelve nada), así que **Storybook no ha funcionado nunca en el monorepo**.

Dos salidas:

1. **Cambiar a `@storybook/svelte-vite`**, que es el framework para librerías y no necesita
   `app.html`. Contra: las stories que dependan de `$app/*` (`Link.svelte` usa `$app/state`)
   necesitan mocks explícitos.
2. **Añadir `src/app.html`** al paquete. Funciona, pero refuerza justo lo que
   [03](03-arquitectura-paquetes.md) (H3.7, T3.9) quiere deshacer: la librería disfrazada de app
   SvelteKit, con `adapter-auto` y todo.

Recomendación: opción 1, junto con T3.9.

### H10.1 — Stories que pasan props inexistentes

`NavBarEnd.stories.svelte` — las 8 stories pasan:

```js
args={{ userIsLogged: true, userHasNotification: true, notification: true, searcher: true }}
```

Pero `userIsLogged` **no es una prop**: en `NavBarEnd.svelte` es un `$derived` de `session`:

```ts
let userIsLogged = $derived<boolean>($session?.data ? true : false);
```

Y las stories **no pasan `routes`, `session`, `authClient` ni `setLocale`**, que son props
obligatorias. El componente hace `$session?.data` sobre `undefined` (crash) y
`routes.notifications.url` sobre `undefined` (crash). Estas 8 stories no pueden estar
renderizando; o fallan, o el CSF las está tragando en silencio.

Ocho variantes del mismo error, además: son la matriz completa de tres booleanos. Con
`argTypes` y controles serían **una** story.

### H10.2 — `FromLogin.stories.svelte` — typo en el nombre y arg inexistente

- El fichero se llama `FromLogin` (no `FormLogin`).
- Pasa `args={{ formValidated }}`, pero `FormLogin` solo acepta `debug` y
  `afterCancelCallback`; construye su propio `formValidated` internamente. El arg se ignora.
- La story no puede funcionar de todos modos: `FormLogin` importa `signIn` de
  `@repo/library/better-auth`, que en Storybook no tiene backend.

### H10.3 — `Header.stories.svelte` pasa `authClient={{}}`

Un objeto vacío casteado implícitamente a `AuthClient` (que es `any`, ver [05](05-auth.md)).
Al pulsar "Sign Out" → `authClient.signOut is not a function`. La story de "User not logged"
renderiza el `Modal` con `FormLogin`, que a su vez intenta usar `signIn` del singleton real.

### H10.4 — a11y en modo `"todo"`

`.storybook/preview.ts`:

```ts
a11y: {
	test: 'todo';
} // 'todo' = mostrar violaciones solo en la UI de test
```

Con `"error"` habría saltado el botón anidado de `NavBarEnd` (ver [07](07-componentes-api.md),
H7.5), el `alt` de la imagen de stock y probablemente los `tabindex` sobre elementos no
interactivos (que ya llevan `<!-- svelte-ignore a11y_no_noninteractive_tabindex -->` para
silenciar el compilador).

### H10.5 — Dos configuraciones de test que se pisan

- `vite.config.ts` define `test.projects` con dos proyectos (`client` browser + `server` node).
- `vitest.workspace.ts` define **otro** workspace que extiende `vite.config.ts` y añade el
  proyecto `storybook`.

`vitest.workspace.ts` está **deprecado** desde Vitest 3 (sustituido por `test.projects`) y tener
ambos ficheros es ambiguo: Vitest coge el workspace si existe, ignorando parte de la otra
configuración. El script `test` es simplemente `vitest`, sin `--run`, así que en CI se quedaría
colgado en modo watch.

### H10.6 — El proyecto `client` no tiene nada que ejecutar

```ts
include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
```

No existe **ningún** fichero `*.svelte.test.ts` en el repo. Cero tests de componente. Y
`vite.config.ts` exige `expect: { requireAssertions: true }`, lo cual está bien pero no aplica a
tests que no existen.

### H10.7 — Cobertura instalada y sin usar

`@vitest/coverage-v8` está en `packages/react-ui` (que se borra, ver
[02](02-alcance-monorepo.md)) pero **no** en `sveltekit-ui`. No hay script de cobertura ni
umbral.

### H10.8 — Sin tests de accesibilidad automatizados en CI

El addon `@storybook/addon-vitest` está instalado y configurado (`.storybook/vitest.setup.ts`
registra las anotaciones de a11y), pero como las stories están rotas (H10.1-H10.3) y `test` no
corre en CI (ver [11](11-tooling-ci-calidad.md)), no se ejecuta nunca.

### H10.9 — El demo tiene un `+page.svelte` vacío

`demos/sveltekit/src/routes/admin/+page.svelte` está **vacío**, aunque `$lib/routes.ts` registra
`admin_index` con `showInMenu: true`. El menú lleva a una página en blanco.

### H10.10 — `+layout.ts` prerenderiza una app con sesión

`demos/sveltekit/src/routes/+layout.ts`: `export const prerender = true;`
Pero `+layout.server.ts` lee `event.locals` (sesión) y el `Header` renderiza según el estado de
login. Prerenderizar eso genera HTML estático con el estado de un usuario inexistente. Además
`+layout.server.ts` solo hace `console.log(event.locals)` y devuelve `{}` — no pasa el usuario a
la página, así que el demo **no demuestra** el flujo de sesión SSR.

## Propuesta

### Estrategia de tests, en tres niveles

1. **Unitarios (Vitest, node)** — lógica pura: `getMenuRoutes`, `zodToFieldsJsonSchema`,
   schemas. Rápidos, sin navegador. Es donde debería estar el grueso.
2. **De componente (Vitest browser + `vitest-browser-svelte`)** — un test por componente con
   sus casos de interacción: abrir/cerrar `Modal`, submit de `FormLogin` con `authClient`
   mockeado, `NavBarList` con distintos `routes`.
3. **Stories como tests (addon-vitest)** — cada story se ejecuta y se le pasa axe. Es "gratis"
   una vez las stories funcionan, y cubre el a11y.

### Reglas para las stories

- Una story por **estado significativo**, no por combinación de booleanos. Usar `argTypes` +
  controles para explorar el resto.
- **Ningún componente debe necesitar backend para renderizar en Storybook.** Eso sale solo si se
  aplica [05](05-auth.md) (auth por props) y [04](04-i18n.md) (i18n por props): con datos
  inyectados, todas las stories son deterministas.
- Mocks explícitos: un `authClient` falso en `.storybook/mocks/` para las stories de login.

## Tareas

### Arreglar lo roto

- [x] **T10.1** Reescribir `NavBarEnd.stories.svelte`: props reales, 3-4 estados, controles para
      el resto.
- [x] **T10.2** Renombrar `FromLogin.stories.svelte` → `FormLogin.stories.svelte` y darle un
      `authClient` mock.
- [x] **T10.3** `Header.stories.svelte`: quitar `authClient={{}}`; usar el mock.
- [x] **T10.4** Unificar la config de test: borrar `vitest.workspace.ts` y consolidar los tres
      proyectos (`unit`, `component`, `storybook`) en `test.projects` de `vite.config.ts`.
- [x] **T10.5** `"test": "vitest run"` (y `test:watch` aparte) para que CI no cuelgue.

### Subir el listón

- [x] **T10.6** `a11y: { test: "error" }` en `preview.ts` y arreglar lo que salte.
- [x] **T10.7** Añadir `@vitest/coverage-v8` a `ui` y `core`, con umbral (empezar en 50%,
      subir).
- [x] **T10.8** Escribir tests de componente para `Modal` (abrir/cerrar por los 3 tipos, foco),
      `NavBarList` (filtrado, reactividad ante cambio de `routes`) y `FormString` (required,
      hidden, errores de validación).
- [x] **T10.9** Story por componente para los que no tienen: `Link`, `FormFields`, `FormString`.
- [~] **T10.10** Publicar el Storybook como documentación (Chromatic ya está instalado
  —`@chromatic-com/storybook`— pero sin configurar; o `storybook build` + páginas estáticas).

### Demo

- [x] **T10.11** Quitar `prerender = true` del `+layout.ts` del demo.
- [x] **T10.12** `+layout.server.ts`: devolver `{ user: locals.user }` en vez de hacer
      `console.log`, y consumirlo en el layout — el demo debe enseñar el patrón correcto.
- [x] **T10.13** Rellenar `admin/+page.svelte` o quitar la ruta del menú.
- [x] **T10.14** Añadir un E2E de Playwright mínimo en el demo (cargar la home, abrir el modal
      de login, cambiar de idioma) que corra en CI.

## Criterios de aceptación

- `bun run test` pasa en verde y termina, en local y en CI.
- Todas las stories renderizan sin errores de consola.
- El addon de a11y en modo `error` no reporta violaciones.
- Cambiar `routes` en una story actualiza el menú (regresión de [06](06-routing-navegacion.md),
  H6.3).

## Estado (2026-09-02)

**H10.0 resuelto: Storybook arranca.** `bun run build-storybook` termina en verde y genera
**84 entradas**, incluida la página de bienvenida. Era la primera vez que funcionaba en este
monorepo.

Se tomó la **opción 1**: framework `@storybook/svelte-vite` en vez de `@storybook/sveltekit`,
junto con T3.9 (fuera `adapter-auto` y el script `preview`). El precio es que los módulos
virtuales `$app/*` desaparecen, así que se montan como **alias de vite a mocks** en
`.storybook/mocks/` (los necesita `Link`, que usa `resolve()` de `$app/paths`). El mismo alias lo
usa el proyecto `component` de vitest, así que la configuración es una sola.

- Stories reescritas contra la API nueva, **una por estado significativo** en vez de la matriz de
  8 booleanos (B16), con un `authClient` falso para los dos formularios de login: ninguna story
  necesita backend. Hay stories nuevas para los 12 componentes que no tenían, y alguna en
  castellano para documentar la inyección de `strings`.
- `a11y: { test: 'error' }` (T10.6): las violaciones fallan, ya no se quedan en la UI.
- Config de test unificada en `vite.config.ts` con tres proyectos (`unit`, `component`,
  `storybook`); `vitest.workspace.ts` **borrado** (estaba deprecado y se pisaba con
  `test.projects`, X4). `test` es `vitest run`, así que no cuelga en CI (X5).
- Fuera `src/tests/demo.spec.ts` (probaba `1+2===3`, X1) y `zodToJsonSchema.test.ts` (probaba una
  librería de terceros, X2). En su lugar: tests de componente de `Modal`, `NavBarList`,
  `FormString` y `NavBarEnd`, más los 19 unitarios de `core` (cobertura **97%**) y los 12 de
  `auth`.
- Demo: fuera `prerender = true` (B17), `+layout.server.ts` devuelve `{ user: locals.user }` en
  vez de trazar por consola (C16), y `admin/` deja de estar vacío (C17) — ahora demuestra el
  patrón de protección real en `+page.server.ts`, que es lo que sustituye al `isProtected` que se
  eliminó del modelo de rutas.
- E2E de Playwright en el demo (T10.14) que **no necesita base de datos**: sin cookie de sesión,
  `getSession()` devuelve `null` sin tocar la BD. El caso que sí la necesita (completar el login)
  está marcado `skip` **con su motivo**, no dado por bueno. Uno de los tests asegura la regresión
  del bug de i18n: cambia el idioma y comprueba que cambian los textos de la librería.

**Resultado de la suite: 23 ficheros, 97 tests, todos en verde**, con las stories pasando axe en
modo `error`. Más el E2E del demo: 4 pasan y 1 saltado con su motivo.

**Cuatro cosas se rompieron al ejecutar de verdad la suite por primera vez** (ninguna estaba en
el plan; las tres primeras eran de configuración y la cuarta un defecto real de a11y):

1. Los proyectos `component` y `storybook` compartían el mismo objeto de configuración de
   navegador **por referencia**, y vitest anota la instancia con el nombre del proyecto: el
   segundo heredaba el nombre del primero y la suite abortaba con `Cannot define a nested project
for a chromium browser`. Ahora es una factoría que devuelve un objeto nuevo por proyecto.
2. `sveltekit-superforms` importa `$app/*` desde su `dist`, y aunque esos módulos están
   aliasados a los mocks, **el prebundle de esbuild no aplica `resolve.alias`**: en modo navegador
   fallaba con `Could not resolve "$app/environment"`. Se resuelve sacando `sveltekit-superforms`
   y `formsnap` de `optimizeDeps`.
3. Hecho eso, su dependencia transitiva `style-to-object` (CJS) dejó de convertirse a ESM y las
   nueve suites de formularios morían con _"does not provide an export named 'default'"_. Se
   arregla pidiéndola explícitamente en `optimizeDeps.include`.
4. **El addon de a11y en modo `error` encontró una violación real a la primera**, que es
   justamente para lo que se subió el listón: el checkbox del `Drawer` se quedaba sin nombre
   accesible cuando su `<label>` visible estaba oculto por ancho de pantalla (el del `Header` es
   `lg:hidden`) — _"Form element has explicit `<label>` that is hidden"_. Ahora el checkbox lleva
   su propio `aria-label` (`DrawerStrings.toggleSidebar`). Es la prueba de que T10.6 valía la
   pena: con `test: 'todo'` esto habría pasado desapercibido, igual que pasaron los años los
   botones anidados de `NavBarEnd`.

También hubo que **acotar un localizador del E2E**: `getByText('Required').first()` caía en la
instancia que renderiza el modal de login cerrado (oculta) en vez de la del contenido de la
página. Ahora está acotado a `main`.

**Nota de entorno:** `playwright` y `@playwright/test` se alinearon a `^1.62.1` en el paquete y en
el demo. Aparte de dejar una sola versión de la herramienta —como con TypeScript—, es la que
casa con el navegador que vitest necesita.

**Cobertura**: `core` al 97% y umbral del 50% en `core` y en `ui`. El umbral es deliberadamente
bajo: la idea es subirlo, no que nadie lo baje.

**T10.10 queda parcial**: CI compila el Storybook y lo sube como artefacto, y
`@chromatic-com/storybook` sigue instalado como addon, pero **no está publicado en una URL**.
Falta decidir entre Chromatic (necesita token) y GitHub Pages.
