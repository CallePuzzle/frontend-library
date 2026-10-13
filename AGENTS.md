# AGENTS.md

Guía para agentes de IA y para quien llegue nuevo a este repositorio. Asume que el lector no
conoce el proyecto.

## Descripción del proyecto

**callepuzzle-frontend-library** (el repo se llama `storybook-svelte` por razones históricas) es
el monorepo de la librería de front de CallePuzzle. Publica tres paquetes en GitHub Packages:

- **`@callepuzzle/core`** (`packages/core`) — el modelo de navegación (`RouteMap`,
  `getMenuRoutes`) y la derivación de campos de formulario desde un schema de zod
  (`@callepuzzle/core/schema`). Cero dependencias de runtime.
- **`@callepuzzle/auth`** (`packages/auth`) — wrapper de better-auth en tres subpaths:
  `./client` (factoría del cliente), `./server` (instancia + presets de magic link y OTP),
  `./hooks` (el `Handle` de SvelteKit).
- **`@callepuzzle/svelte-ui`** (`packages/ui`) — los componentes Svelte 5, más el subpath
  `./otp` y la hoja `./styles.css`.

Más `@callepuzzle/typescript-config` (interno, `private`) y `demos/sveltekit`, la app de
referencia.

Los consumidores reales son **otros repos**, no workspaces de este: `donde-esta-tu-local`
(producción, va por delante de la librería) y `y-tu-que-compras`. El objetivo del refactor en
curso es que ambos consuman la librería publicada en vez de tener copias del código; el plan
completo está en [`docs/plans/`](docs/plans) y el estado de cada consumidor en
[`docs/plans/12-convergencia-consumidores.md`](docs/plans/12-convergencia-consumidores.md).

## Stack tecnológico

- **Componentes**: Svelte 5 (runes) empaquetado con `@sveltejs/package` (`svelte-package`).
  `packages/ui` **no es una app SvelteKit**: no tiene `src/app.html` ni rutas.
- **`core` y `auth`**: TypeScript compilado con **tsup** a ESM (`target: es2022`), con `.d.ts`.
  Los tres paquetes son **ESM-only**.
- **Estilos**: Tailwind CSS 4 + daisyUI 5, ambos como `peerDependencies` de `ui`. Cero
  `<style>` en los componentes: todo son clases de utilidad y clases semánticas de daisyUI.
- **Iconos**: `@lucide/svelte` (peer), importados de uno en uno
  (`import Menu from '@lucide/svelte/icons/menu'`).
- **Formularios**: `sveltekit-superforms` + `formsnap`, con schemas **zod v4** (`import … from 'zod/v4'`,
  así funciona igual con `zod@3.25.x` y con `zod@4`).
- **Auth**: better-auth (peer), con `sveltekit-superforms` para los formularios de login.
- **OTP**: `bits-ui` (`PinInput`) como peer **opcional**, solo para `@callepuzzle/svelte-ui/otp`.
- **Storybook 9** con **`@storybook/svelte-vite`** (no `@storybook/sveltekit`), addons `docs`,
  `a11y` (`test: 'error'`), `vitest` y `svelte-csf`.
- **Tests**: Vitest 3, tres proyectos en `packages/ui/vite.config.ts` (`unit` en node,
  `component` y `storybook` en Chromium real vía `vitest-browser-svelte` + Playwright).
- **Monorepo**: bun workspaces (`packages/*`, `demos/*`) + **turbo**. Versionado y publicación
  con **Changesets** contra GitHub Packages.
- **Lint**: **oxlint** (`.oxlintrc.json`, `correctness: error`, `typescript/no-explicit-any: error`)
  en todos los paquetes, más **ESLint** solo en `packages/ui` (para `eslint-plugin-svelte` y
  `eslint-plugin-storybook`).
- **Hooks de git**: `simple-git-hooks` + `lint-staged` (pre-commit: oxlint + prettier;
  pre-push: `bun run prepush`).

## Comandos

Usa **bun**. Todo se lanza desde la raíz salvo que se diga lo contrario.

- `bun install` — instala y ejecuta `simple-git-hooks` (solo fuera de CI: el `postinstall` lo
  salta si `CI` está definido, para que los `git push`/`git commit` de los workflows, como el del
  `changesets/action`, no disparen el hook de pre-push).
- `bun run build` — `turbo run build`. `tsup` en `core`/`auth`, `svelte-package --input=src` en
  `ui`, `vite build` en el demo (que hace `prisma generate` antes).
- `bun run dev` — `turbo run dev` (watch de `tsup`/`svelte-package` + el demo).
- `bun run dev:sveltekit` — solo el demo y sus dependencias.
- `bun run storybook` — Storybook de `packages/ui` en `:6006`. **Es la referencia de
  componentes**: úsalo para ver qué hace algo antes de tocarlo.
- `bun run build-storybook` — estático en `packages/ui/storybook-static`.
- `bun run check` — `svelte-check` (en `ui` y en el demo).
- `bun run check-types` — `tsc --noEmit` en `core` y `auth`, `svelte-check` en `ui`.
- `bun run test` — `vitest run`: los tres proyectos. La primera vez hace falta
  `bunx playwright install chromium`, porque `component` y `storybook` corren en navegador real.
- `bun run lint` / `bun run lint:fix` — oxlint (+ ESLint en `ui`).
- `bun run format` / `bun run format:ci` — Prettier `--write` / `--check`.
- `bun run check-publish` — `publint` + `@arethetypeswrong/cli --profile esm-only` en los tres
  paquetes publicables. **Pásalo antes de tocar `exports` o `files`.**
- `bun run prepush` — lo que corre el hook de pre-push: `format:ci` + `lint` + `check-types` +
  `test` + `build`. Es la verificación completa.
- `bun run changeset` — crea el changeset de un PR que toque un paquete publicable.
- `bun run release` — build + `changeset publish` (necesita `NPM_TOKEN` con `write:packages`).

Scripts del demo (desde `demos/sveltekit`): `db:generate`, `db:migrate:dev`,
`db:migrate:deploy`, `db:push`, `studio`, `better-auth:generate`. **No están en la raíz** a
propósito: son del demo, no de la librería.

## Estructura del código

```
packages/core/src/
  routes.ts            RouteConfig, RouteMap, Route, getMenuRoutes
  index.ts             barrel del export "."
  schema/index.ts      Field, Fields, zodToFieldsJsonSchema (+ reexporta login.ts)
  schema/login.ts      createLoginSchema, LoginSchema, LoginData, LoginSchemaStrings

packages/auth/src/
  client.ts            createCallepuzzleAuthClient, CallepuzzleAuthClient, AuthClient,
                       Session, SessionOf                                        → "./client"
  server.ts            getBetterAuth, magicLinkPreset, emailOtpPreset,
                       SendMagicLink, SendVerificationOtp                        → "./server"
  hooks.ts             betterAuthHandle(auth, building), BetterAuthLocals        → "./hooks"

packages/ui/src/
  components/*.svelte          los componentes
  components/*.strings.ts      su diccionario de textos + defaults en inglés
  components/index.ts          barrel de componentes (lo consume src/index.ts)
  strings/common.ts            commonStrings: los textos repetidos
  styles/index.css             la hoja publicada como "./styles.css"
  types.ts                     SessionUser, SignOutClient, MagicLinkClient, EmailOtpClient,
                               AuthCallResult, AuthCallError
  utils.ts                     cn()
  index.ts                     barrel del export "."
  otp.ts                       export "./otp": FormLoginOtp (+ sus strings)
  stories/                     stories de Storybook
  tests/                       tests que no cuelgan de un componente
  .storybook/                  main.ts, preview.ts, vite-aliases.ts, mocks/
```

Componentes exportados desde `.`: `Header`, `Drawer`, `NavBarList`, `NavBarEnd`, `Link`,
`Modal`, `Dock`, `DockLink`, `Footer`, `ButtonSignOut`, `UserNotLogged`, `FormFields`,
`FormString`, `FormNumber`, `FormCheckbox`, `FormSelect`, `FormTextarea`,
`FormLoginMagicLink`. Desde `./otp`: `FormLoginOtp`.

### Fronteras entre paquetes (no las cruces)

- `core` **no importa nada** de `ui` ni de `auth`. Es el único paquete sin dependencias de
  runtime; su peer `svelte` es opcional y solo aporta el tipo `Component`.
- `auth` **no importa nada** de `ui`.
- `ui` puede importar `core` (lo hace: `RouteMap`, `getMenuRoutes`, `Fields`,
  `zodToFieldsJsonSchema`, `createLoginSchema`). **No importa `auth`, ni siquiera para tipos**:
  lo que necesita del cliente de auth lo tipa estructuralmente en `src/types.ts`.
- **Ningún paquete de librería declara `App.Locals`** (`declare global`). Eso es de la app.

## Convenciones de código

- **Idioma**: comentarios y documentación en **castellano**; identificadores en inglés. Los
  textos de UI de la librería, en **inglés** (son los defaults; ver más abajo).
- **Formato** (`.prettierrc`): tabuladores, comillas simples, sin trailing commas, ancho 100.
  Plugins de Prettier para Svelte y Tailwind (las clases se ordenan solas, con
  `tailwindStylesheet: ./packages/ui/src/styles/index.css`). Ejecuta `bun run format`.
- **Svelte 5 runes** siempre: `$props`, `$state`, `$derived`, `$effect`, `$props.id()`. Nada de
  la API legacy (`export let`, `$:`, slots). Referencias al DOM con `bind:this` + `$state`,
  **nunca** `document.getElementById` en `onMount`.
- **`any` es error de lint** (`typescript/no-explicit-any`). Cuando de verdad no hay tipo, usa
  `unknown` + guarda, o concentra el `as` en un solo punto de entrada del dato y explica por qué
  en un comentario (como el `field as FormPath<T>` de `FormString`).
- **Props**: `type Props = { … } & Omit<HTMLAttributes<HTMLXElement>, 'class' | …>`, con
  `class?: string` propio, `...rest` reenviado al elemento raíz, y la clase compuesta con
  `cn('clases-por-defecto', className)`. Se `Omit`ea lo que el componente gobierna
  (`class`, `children`, y los atributos que colisionan: `title` en `Header` es un `Snippet`,
  `type` en `ButtonSignOut` es siempre `button`).
- **Contenido por `Snippet`, comportamiento por props.** Nada de `<slot>`.
- **Componentes genéricos**: `<script lang="ts" generics="T extends Record<string, unknown>">`
  (los `Form*` sobre el tipo de datos del `SuperForm`).
- **i18n por inyección**: prop `strings?: Partial<XStrings>` y
  `const t = $derived({ ...defaultXStrings, ...strings })`. Si añades un componente con texto
  visible, añade su `X.strings.ts`, reutiliza `commonStrings` para lo repetido, y **exporta el
  tipo y el default desde `src/index.ts`**.
- **peer vs dependency** en `ui`: es `peerDependency` todo lo que el consumidor ya tiene una vez
  y no puede duplicarse (`svelte`, `@sveltejs/kit`, `tailwindcss`, `daisyui`,
  `sveltekit-superforms`, `formsnap`, `zod`, `@lucide/svelte`, `bits-ui` opcional). Es
  `dependency` lo pequeño e invisible (`clsx`, `tailwind-merge`, `@callepuzzle/core`). Si dudas:
  ¿rompería algo que hubiese dos copias en el árbol? Entonces es peer.
- **zod**: siempre `from 'zod/v4'`. `.meta({ placeholder, description })`, no `.describe()`.
  `z.toJSONSchema()` nativo, no `zod-to-json-schema`.
- **Avisos de desarrollo**: `console.warn` tras una guarda con el flag `DEV` de `esm-env`
  (`if (!DEV) return;`), para que no viajen al bundle de producción del consumidor. No hay logger
  en la librería.
- **Commits**: en inglés, [Conventional Commits](https://www.conventionalcommits.org/).
  Un `bun run changeset` por PR que toque un paquete publicable.

## Decisiones conscientes (y por qué)

Cada una tiene su ADR en [`docs/adr/`](docs/adr); aquí va el resumen ejecutable.

- **La librería no compila i18n; los textos entran por props.** Antes había _tres_ runtimes de
  Paraglide con estados de locale independientes: llamar a `setLocale('es')` en la app traducía
  la app y dejaba la librería en inglés. Y el copy de la librería era copy de producto, que cada
  consumidor quiere distinto. Defaults en inglés + `strings` por prop.
  → [ADR 0003](docs/adr/0003-i18n-por-inyeccion.md), [`docs/i18n.md`](docs/i18n.md).
- **La sesión viaja por props, no por un store.** El código viejo hacía
  `export const session = useSession()` en scope de módulo: en SSR eso es **un store de sesión
  compartido por todos los usuarios que atienda el proceso**. Ahora el `Handle` resuelve la
  sesión una vez por request, la deja en `event.locals`, el `load` la baja al layout y
  `NavBarEnd` recibe `user?: SessionUser | null` como dato plano.
  → [ADR 0005](docs/adr/0005-auth-por-factoria.md).
- **El cliente de auth es una factoría, y se recibe por prop.** `createCallepuzzleAuthClient()`
  para que el consumidor lo instancie una vez, con **sus** plugins, y conserve el tipado (el
  código viejo hacía `as any` y con él se iban `AuthClient` y `Session`). Los componentes lo
  tipan estructuralmente (`SignOutClient`, `MagicLinkClient`, `EmailOtpClient`) para no importar
  `@callepuzzle/auth` desde `ui`.
- **`Header` no envuelve la app.** Antes era un drawer monolítico con la página dentro. Ahora es
  **solo la navbar**; el cajón lateral es un `Drawer` aparte, opcional, y el layout lo compone la
  app. Motivo: un consumidor que no quiere cajón no debería heredar el markup del cajón, y un
  componente que envuelve la app obliga a que todo lo demás (contexto, layout, scroll) pase por
  él. `Header` recibe `navEnd`/`navCenter` como **snippets**, no por intersección de props.
- **`NavBarEnd` no embute el formulario de login.** Renderiza el snippet `login` cuando no hay
  usuario, y el consumidor decide el flujo (magic link u OTP) y cierra su propio `Modal` con la
  referencia que `Modal` exporta (`showModal()`/`close()`). Antes había un `setTimeout(2000)`
  dentro de la librería para cerrar el modal tras el login: eso es una decisión de producto con
  un número mágico.
- **`FormLoginOtp` vive en el subpath `@callepuzzle/svelte-ui/otp`.** Necesita `bits-ui` para el
  `PinInput`, y `bits-ui` es un peer **opcional**: quien usa magic link no tiene que instalarlo.
  Si estuviera en el barrel principal, importar cualquier componente arrastraría `bits-ui`.
- **La clave del `RouteMap` _es_ la ruta.** No hay `url`. El modelo viejo tenía
  `url: string | ((id) => string)`, y una URL-función no puede ir en un menú (no hay nada que
  poner en el `href`): `y-tu-que-compras` tiene tres rutas así. Con la clave como ruta, el
  consumidor tipa el mapa con su `RouteId` de `$app/types` y el compilador le valida cada
  entrada. Tampoco hay `isProtected` ni `permissions`: la protección real vive en los
  `+layout.server.ts` del consumidor, y un flag en un objeto de menú solo sirve para creer que
  algo está protegido cuando no lo está. Y `name` pasó a `label`, que es lo que es.
- **`getMenuRoutes({ mobile: true })` filtra estricto por `showInMobile`.** No hace la unión con
  `showInMenu`. Una ruta que deba salir en el menú de escritorio **y** en el dock declara los dos
  flags. Es más verboso y es explícito: con la unión, añadir `showInMenu` a una ruta la metía
  también en el dock móvil por sorpresa.
- **daisyUI 5 es el contrato de estilo, y el `@source` va dentro del paquete.** Tailwind 4 no
  escanea `node_modules`, así que la hoja publicada
  (`packages/ui/src/styles/index.css` → `@callepuzzle/svelte-ui/styles.css`) trae
  `@import "tailwindcss"`, `@source "../"` y `@plugin "daisyui"`. Medido: con el `@source`, el
  CSS de una app sale con 99 kB y las clases `.navbar`/`.drawer`/`.dock`; sin él, 29 kB y esas
  clases no existen. El consumidor solo importa la hoja.
  → [ADR 0004](docs/adr/0004-daisyui-como-contrato.md).
- **`FormLoginMagicLink` usa `SPA: true` + `onUpdate`, no `onSubmit`.** En
  `sveltekit-superforms@2.27` `onSubmit` corre **antes** de la validación de cliente, así que
  con `onSubmit` se llamaba a better-auth con emails inválidos.
- **La librería nunca llama a `invalidateAll()` ni a `goto()` por su cuenta** (salvo
  `ButtonSignOut`, y solo con `redirectTo`, que se puede poner a `null`, y el `history.back()`
  del botón «atrás» de `Header`, que es opt-in con `showBack`). Tras un login, el consumidor
  invalida y navega en el callback `onSuccess` (o en el nuevo `onSignOut` de `ButtonSignOut`).
  La navegación de la app es de la app.
- **Storybook usa `@storybook/svelte-vite`, no `@storybook/sveltekit`.** El paquete es una
  librería y no tiene `src/app.html`; con el framework de SvelteKit, Storybook no arranca. Los
  módulos `$app/*` que usan los componentes (`$app/paths`, `$app/state`, `$app/navigation`,
  `$app/environment`) se **mockean con alias de vite** (`.storybook/vite-aliases.ts` +
  `.storybook/mocks/`), y `packages/ui/vite.config.ts` usa `svelte()` y no `sveltekit()` porque
  `@storybook/builder-vite` carga ese fichero tal cual.
- **`kind: 'unsupported'` en vez de disfrazar el campo.** `zodToFieldsJsonSchema` devuelve un
  `Field` discriminado, y lo que no sabe representar llega como `unsupported`: `FormFields` no
  renderiza nada y avisa por `console.warn` solo en DEV. Antes un tipo desconocido se pintaba
  como input de texto y el dato se corrompía en silencio.
- **`getBetterAuth` no impone plugins, y los presets exigen la función de envío.** El default
  viejo traía `magicLink` + `organization` + `admin`, con un merge superficial que los borraba
  si pasabas los tuyos, y su `sendMagicLink` hacía `console.log` del token en vez de enviar
  correo. `magicLinkPreset(send)` / `emailOtpPreset(send)` tienen `send` **obligatorio**: no
  compila un login que no pueda enviar nada.
- **El repo es solo Svelte.** Se eliminaron `react-ui`, `demos/astro`, `database`,
  `eslint-config` y `tailwind-config`: eran plantilla de `create-turbo`/`create astro` sin
  consumidores. → [ADR 0002](docs/adr/0002-solo-svelte.md).

## Trampas conocidas

- **Nunca resuelvas i18n en scope de módulo.** `const routes = { '/': { label: m.home() } }` a
  nivel de módulo congela el idioma para todo el proceso Node: el primer locale que se resuelva
  gana para todos los usuarios. Usa una función o un `$derived`. Lo mismo con los schemas:
  `createLoginSchema(strings)` se llama en render, no arriba del fichero.
- **Nunca resuelvas la sesión en scope de módulo.** Ni `useSession()`, ni un `$state` de módulo
  con el usuario. Crear el cliente (`createCallepuzzleAuthClient`) sí puede vivir en un módulo:
  lo que no puede es el **estado**.
- **El `@source` de Tailwind es obligatorio en el consumidor… y ya viene puesto.** El consumidor
  solo tiene que `@import "@callepuzzle/svelte-ui/styles.css"`. Si en vez de eso escribe su
  propio `@import "tailwindcss"` + `@plugin "daisyui"` sin el `@source`, todo compila y los
  componentes salen **sin estilo, sin ningún error**. Es el fallo de integración más frecuente.
- **`Link` hace `resolve(href)`, y `href` es la clave del `RouteMap`, no una URL resuelta.** El
  `resolve()` de `$app/paths` solo acepta los ids de ruta del proyecto **donde se compila**, que
  aquí es la librería (sin rutas). Por eso `href` se tipa como `string` y se estrecha en el punto
  de llamada. El tipado fuerte lo consigue el consumidor declarando `RouteMap<RouteId>`.
- **`Drawer` genera su `drawerId` con `$props.id()`.** No lo hardcodees: dos drawers en la misma
  página se pisarían. Se lo pasas al `Header` por `menuToggleFor`, tomándolo del snippet
  `children` del `Drawer`.
- **`Dock` y `Header` conviviendo en la misma página**: son dos landmarks `navigation`, y si
  comparten nombre accesible incumplen `landmark-unique` (y el test de a11y de Storybook está en
  `error`). Por eso `defaultDockStrings.navLabel` es `'Bottom navigation'` y no reutiliza
  `commonStrings.menu`.
- **`bun run test` necesita Chromium.** Dos de los tres proyectos de vitest corren en navegador
  real: `bunx playwright install chromium` la primera vez.
- **`import.meta.env` en la librería**: `svelte-package` avisa de que solo funciona en apps
  bundleadas con Vite, así que no puede usarse en código publicado. Por eso `FormFields` usa el
  flag `DEV` de `esm-env` para que el aviso de campo no soportado no llegue a producción. No lo
  extiendas sin motivo.
- **`monorepo-v2` y `main` tienen historias git no relacionadas.** Hasta que la rama se promueva,
  `changeset status` no puede calcular el diff contra la base y el workflow de release no se
  dispara.
- **No edites `docs/plans/**` para marcar tareas\*\* si estás trabajando dentro de un refactor
  orquestado: los checkboxes los cierra quien coordina.

## Verificación antes de terminar

Como mínimo, en lo que hayas tocado:

```bash
bun run format
bun run lint
bun run check-types
bun run test
bun run build
```

O directamente `bun run prepush`, que es lo que va a correr el hook. Si has tocado `exports`,
`files` o la estructura de `dist`, además `bun run check-publish`.

<!-- CODEGRAPH_START -->

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.

<!-- CODEGRAPH_END -->
