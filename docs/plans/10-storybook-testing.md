# 10 — Storybook y tests

**Prioridad: media.** Storybook es la razón de ser del repo (está en el nombre) y ahora mismo
las stories no prueban nada.

## Contexto

`packages/sveltekit-ui/.storybook/` con `@storybook/sveltekit` 9.1, addons de docs, a11y,
svelte-csf y vitest. 5 ficheros de stories en `src/stories/`.

## Hallazgos

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
a11y: { test: "todo" }   // 'todo' = mostrar violaciones solo en la UI de test
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
- [ ] **T10.1** Reescribir `NavBarEnd.stories.svelte`: props reales, 3-4 estados, controles para
  el resto.
- [ ] **T10.2** Renombrar `FromLogin.stories.svelte` → `FormLogin.stories.svelte` y darle un
  `authClient` mock.
- [ ] **T10.3** `Header.stories.svelte`: quitar `authClient={{}}`; usar el mock.
- [ ] **T10.4** Unificar la config de test: borrar `vitest.workspace.ts` y consolidar los tres
  proyectos (`unit`, `component`, `storybook`) en `test.projects` de `vite.config.ts`.
- [ ] **T10.5** `"test": "vitest run"` (y `test:watch` aparte) para que CI no cuelgue.

### Subir el listón
- [ ] **T10.6** `a11y: { test: "error" }` en `preview.ts` y arreglar lo que salte.
- [ ] **T10.7** Añadir `@vitest/coverage-v8` a `ui` y `core`, con umbral (empezar en 50%,
  subir).
- [ ] **T10.8** Escribir tests de componente para `Modal` (abrir/cerrar por los 3 tipos, foco),
  `NavBarList` (filtrado, reactividad ante cambio de `routes`) y `FormString` (required,
  hidden, errores de validación).
- [ ] **T10.9** Story por componente para los que no tienen: `Link`, `FormFields`, `FormString`.
- [ ] **T10.10** Publicar el Storybook como documentación (Chromatic ya está instalado
  —`@chromatic-com/storybook`— pero sin configurar; o `storybook build` + páginas estáticas).

### Demo
- [ ] **T10.11** Quitar `prerender = true` del `+layout.ts` del demo.
- [ ] **T10.12** `+layout.server.ts`: devolver `{ user: locals.user }` en vez de hacer
  `console.log`, y consumirlo en el layout — el demo debe enseñar el patrón correcto.
- [ ] **T10.13** Rellenar `admin/+page.svelte` o quitar la ruta del menú.
- [ ] **T10.14** Añadir un E2E de Playwright mínimo en el demo (cargar la home, abrir el modal
  de login, cambiar de idioma) que corra en CI.

## Criterios de aceptación

- `bun run test` pasa en verde y termina, en local y en CI.
- Todas las stories renderizan sin errores de consola.
- El addon de a11y en modo `error` no reporta violaciones.
- Cambiar `routes` en una story actualiza el menú (regresión de [06](06-routing-navegacion.md),
  H6.3).
