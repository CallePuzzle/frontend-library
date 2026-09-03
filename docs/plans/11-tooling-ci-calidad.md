# 11 — Tooling, calidad y CI

**Prioridad: media.** Sin esto, todo lo arreglado en los documentos anteriores se vuelve a
romper solo.

## Hallazgos

### H11.1 — No hay CI. Ninguna.

No existe `.github/workflows/`, `.gitlab-ci.yml`, ni hooks de git. Nada verifica que el repo
compila antes de mergear. Comparar con `bitban/monorepo`, que tiene `.gitlab-ci.yml` y
`simple-git-hooks` con un `pre-push` que corre `format:ci && turbo run lint compile test`.

### H11.2 — Tres estilos de formato conviviendo

| Ámbito                                                                                                                | Estilo          |
| --------------------------------------------------------------------------------------------------------------------- | --------------- |
| `FormFields.svelte`, `FormString.svelte`, `Modal.svelte`, `schemas/*`, `stories` parciales                            | **Tabuladores** |
| `FormLogin.svelte`, `Header.svelte`, `NavBarEnd.svelte`, `NavBarList.svelte`, `Link.svelte`, `packages/library/src/*` | **2 espacios**  |
| `svelte.config.js`, `eslint.config.js`                                                                                | Tabuladores     |

**No hay `.prettierrc` en ningún sitio del monorepo** (los consumidores sí lo tienen:
`donde-esta-tu-local/.prettierrc` = tabs, comillas simples, sin trailing commas, ancho 100).
Prettier está en el root como devDependency y el script `format` existe, pero sin config usa
los defaults (espacios, comillas dobles) → **ejecutarlo ahora reformatearía media librería**.

No hay `.prettierignore` en el root (sí en los consumidores), así que `bun run format`
formatearía también el código generado por Paraglide.

### H11.3 — Lint desigual y a medias

- `packages/sveltekit-ui/eslint.config.js`: flat config completa. Bien.
- `packages/react-ui/eslint.config.mjs`: para React (se borra).
- `packages/database/.eslintrc.js`: **eslint legacy** (`.eslintrc`), incompatible con ESLint 9
  flat sin `ESLINT_USE_FLAT_CONFIG=false`. Se borra.
- `packages/library`: tiene el script `"lint": "eslint . --max-warnings 0"` y
  `@repo/eslint-config` como devDependency, pero **no hay fichero de configuración de ESLint en
  el paquete**. `eslint .` no encontraría config → falla o no lintea nada.
- `demos/sveltekit`: declara `@repo/eslint-config` pero **no tiene script `lint`** ni config.
- El root no tiene script de lint propio; `turbo run lint` solo agrega los de los paquetes.

Además `@repo/eslint-config/base.js` usa `eslint-plugin-only-warn`, que convierte **todos los
errores en warnings** — y luego el script usa `--max-warnings 0`. Funciona, pero hace que
cualquier `eslint` manual parezca limpio.

### H11.4 — `check-types` incompleto

`turbo.json` define la task `check-types`, pero solo `packages/react-ui` (que se borra) la
implementa. `packages/sveltekit-ui` tiene `check` (svelte-check) y `packages/library` no tiene
ninguna comprobación de tipos aparte del build de tsup. `turbo run check-types` hoy no comprueba
prácticamente nada.

### H11.5 — `turbo.json`: outputs incompletos

```json
"build": { "outputs": [".svelte-kit/**", "dist/**"] }
```

Falta `src/paraglide/**` (que genera `paraglide-js compile` en el mismo script de build de
`sveltekit-ui` y `library`). Turbo puede restaurar un build cacheado sin los mensajes
compilados. Se resuelve solo si se aplica [04](04-i18n.md) y desaparece Paraglide de los
paquetes.

También faltan tasks para `check`, `test` y `storybook:build`, y `test` no está declarada en
absoluto pese a que `sveltekit-ui` tiene el script.

### H11.6 — tsconfigs incoherentes

- `packages/typescript-config/base.json`: `module`/`moduleResolution` **`NodeNext`**,
  `noUncheckedIndexedAccess: true`.
- `packages/typescript-config/svelte.json`: `NodeNext` + `verbatimModuleSyntax`.
- `packages/library/tsconfig.json`: extiende `base.json` pero **redefine**
  `esModuleInterop`, `strict`, `skipLibCheck`… (redundante) y añade
  `"include": ["next-env.d.ts", …]` — un fichero de **Next.js** en un paquete de SvelteKit,
  residuo de la plantilla.
- `packages/sveltekit-ui/tsconfig.json` y `demos/sveltekit/tsconfig.json`: extienden
  `./.svelte-kit/tsconfig.json` y usan `moduleResolution: "bundler"`, **ignorando por completo**
  `@repo/typescript-config/svelte.json`. Es decir, el paquete `typescript-config` existe pero
  los dos paquetes Svelte no lo usan.
- Ninguno activa `noUncheckedIndexedAccess` salvo el base que nadie hereda en Svelte.

### H11.7 — Versiones de TypeScript divergentes

| Paquete                 | TS       |
| ----------------------- | -------- |
| root                    | `5.8.3`  |
| `packages/database`     | `5.5.4`  |
| `packages/react-ui`     | `5.8.2`  |
| `packages/sveltekit-ui` | `^5.9.2` |
| `packages/library`      | `^5.0.0` |
| `demos/sveltekit`       | `^5.9.2` |

Seis rangos distintos. Con bun eso son varias copias de TS y comportamientos de `check`
distintos por paquete. `bitban/monorepo` lo resuelve con el `catalog:` de pnpm; con bun, la
solución es fijar la versión exacta en el root y usar `"typescript": "catalog:"`-equivalente
(bun soporta `catalog` desde 1.2) o simplemente la misma versión literal en todos.

Lo mismo pasa con `eslint` (`^8.57.0` en database, `^9.31.0` / `^9.32.0` en el resto),
`vitest` (`^3.2.4` en todos, ok) y `@sveltejs/kit`.

### H11.8 — El README está desactualizado y tiene erratas

`README.md` del root:

- `bun run stoybook` (typo).
- Describe "dos paquetes UI: react-ui y sveltekit-ui" y "dos demos" — que es justo lo que hay
  que borrar ([02](02-alcance-monorepo.md)).
- Instruye a correr `bunx @inlang/paraglide-js compile` a mano desde `packages/sveltekit-ui`,
  cosa que el script `build` ya hace.
- Instrucciones de `turso dev` que dependen del paquete `database` que se elimina.

`packages/sveltekit-ui/README.md` es peor: describe un flujo de `bun link` con salida de consola
pegada (`Success! Registered "storybook-svelte"`) y comandos de `prisma migrate diff` que no
tienen nada que ver con un paquete de UI.

### H11.9 — Sin `engines` coherentes ni `.nvmrc`

Root: `"engines": { "node": ">=18" }`, pero `vite@^7`, `@sveltejs/kit@^2.27` y las herramientas
modernas piden Node 20+. El consumidor `donde-esta-tu-local` corre con dependencias que exigen
Node 22+. Falta `.nvmrc`.

### H11.10 — Sin LICENSE, sin CODEOWNERS, sin plantillas de PR

Para un paquete que se va a publicar, `license` es obligatorio en el `package.json`
(hoy solo `packages/typescript-config` tiene `"license": "MIT"`).

## Propuesta de pipeline

```
pre-commit (lint-staged) → prettier --check + oxlint sobre lo tocado
pre-push                 → turbo run lint check test build
CI (PR)                  → install → lint → check → test → build → publint/attw
CI (main)                → lo anterior + changeset version + publish
```

`donde-esta-tu-local` ya usa `oxlint` en pre-commit vía `lint-staged`, y `bitban/monorepo` usa
`oxlint` + `oxfmt`. Merece la pena evaluar oxlint aquí también: es órdenes de magnitud más
rápido que ESLint y ya es el estándar de facto en los otros dos repos del equipo.

## Tareas

### Formato y lint

- [x] **T11.1** Crear `.prettierrc` en el root alineado con los consumidores (tabs, comillas
      simples, sin trailing commas, ancho 100, plugins `prettier-plugin-svelte` y
      `prettier-plugin-tailwindcss`) y `.prettierignore` (paraglide generado, `dist`, `.svelte-kit`,
      `bun.lock`).
- [x] **T11.2** Ejecutar `bun run format` **una vez, en un commit aislado** que solo reformatee,
      para no mezclar formato con cambios de lógica.
- [x] **T11.3** Unificar lint: una flat config compartida en el root
      (`eslint.config.js` con overrides por paquete) o adoptar **oxlint** como en los otros repos.
      Dar config a `packages/library` (hoy tiene script de lint sin config) y a `demos/sveltekit`
      (hoy sin script).
- [x] **T11.4** Quitar `eslint-plugin-only-warn` o asumirlo conscientemente y documentarlo.

### Tipos

- [x] **T11.5** Fijar **una** versión de TypeScript en todo el monorepo.
- [x] **T11.6** Hacer que los paquetes Svelte extiendan de verdad
      `@callepuzzle/typescript-config`, o borrar el paquete si no aporta.
- [x] **T11.7** Quitar `next-env.d.ts` del `include` de `packages/library/tsconfig.json`.
- [x] **T11.8** Añadir script `check` a todos los paquetes y declarar la task en `turbo.json`
      (`svelte-check` para los Svelte, `tsc --noEmit` para el resto).
- [x] **T11.9** Activar `noUncheckedIndexedAccess` donde sea viable (ayuda con el bug de
      `jsonSchema.required` de [09](09-forms-schemas.md), H9.5).

### Turbo

- [x] **T11.10** Declarar las tasks que faltan (`check`, `test`, `storybook:build`) y sus
      `outputs`/`inputs`.
- [x] **T11.11** Revisar `outputs` de `build` tras eliminar Paraglide de los paquetes.

### CI

- [x] **T11.12** Workflow de PR: `bun install --frozen-lockfile` → `turbo run lint check test
build` → `publint`/`attw`.
- [x] **T11.13** Workflow de `main` con Changesets (ver [01](01-estrategia-distribucion.md),
      T1.8).
- [x] **T11.14** Hooks locales (`simple-git-hooks` o `husky` + `lint-staged`) replicando el
      patrón de los otros dos repos.

### Metadatos

- [x] **T11.15** `LICENSE` en el root y campo `license` en cada `package.json` publicable.
- [x] **T11.16** `.nvmrc` y `engines.node` realista (>=22).
- [x] **T11.17** Reescribir `README.md` del root y borrar/reescribir
      `packages/sveltekit-ui/README.md` (ver [13](13-documentacion.md)).

## Criterios de aceptación

- Un PR que rompa tipos, lint, tests o el build **no se puede mergear**.
- `bun run format:ci` pasa en verde sobre todo el repo.
- Una sola versión de TypeScript, ESLint y Vitest en el `bun.lock`.

## Estado (2026-09-02)

Implementado. El pipeline que propone el documento existe.

**Lint: oxlint en todo el monorepo + ESLint solo en `packages/ui`.** Es el patrón de
`donde-esta-tu-local`. oxlint (`.oxlintrc.json` en la raíz, una devDependency, ~50 ms sobre todo
el repo) cubre `core`, `auth`, `ui` y el demo de forma uniforme; ESLint se queda solo donde
aporta algo que oxlint no sabe hacer: `eslint-plugin-svelte` (plantilla, a11y,
`no-at-html-tags`, `valid-compile`) y `eslint-plugin-storybook`, que estaba instalado y **no se
usaba**. Una flat config compartida en la raíz habría exigido replicar siete devDependencies que
`ui` ya tiene, y cada paquete Svelte necesita su propio fichero de todas formas para importar su
`svelte.config.js`. `bunx oxlint` sale con exit 0 sobre el monorepo completo.

**T11.4**: `eslint-plugin-only-warn` ya no lo referencia ninguna config (murió con
`packages/eslint-config`), así que nada convierte errores en warnings; oxlint corre con
`categories: { correctness: "error" }`.

**Formato**: `.prettierrc` alineado con los consumidores (tabuladores, comillas simples, sin
trailing commas, ancho 100). El `tailwindStylesheet` apunta a `packages/ui/src/styles/index.css`
—la hoja canónica— y no al `app.css` del demo, que importa `dist/styles/index.css` y por tanto
no existe en un checkout limpio: con esa ruta, `prettier --check` fallaría antes del primer
build. `.prettierignore` cubre lockfiles, salidas de build, el Paraglide generado del demo, las
migraciones de Prisma, los CHANGELOG de Changesets y los `.mdx` (el parser de markdown de
prettier escapa los asteriscos de los comentarios `{/* */}` y rompe el fichero).

**Tipos**: una sola versión de TypeScript, **5.9.2 exacta**, en la raíz y en los cuatro paquetes.
`noUncheckedIndexedAccess` activado en `base.json` **y** `svelte.json`, con 0 errores nuevos
medidos. `packages/ui` y `demos/sveltekit` extienden de verdad
`@callepuzzle/typescript-config/svelte.json` (T11.6), en un `extends` en array donde
`.svelte-kit/tsconfig.json` va primero (aporta `moduleResolution`, los `paths` de `$app/*`,
`rootDirs` e `include`) y la config compartida al final, para que ganen sus flags de estrictez.
`react-library.json` borrado. **T11.7 se resolvió por desaparición**: el `next-env.d.ts` vivía en
el `packages/library/tsconfig.json` que ya no existe; `grep -rn next-env` no devuelve nada.

**Turbo**: tareas `test`, `check` y `build-storybook` declaradas con sus `outputs`. `check-types`
y `check` pasan de `dependsOn: ["^check-types"]` (una serialización inútil) a `["^build"]`, que
es lo que de verdad necesitan; `lint` se queda sin `dependsOn` para que `turbo run lint` no
arrastre el build del demo, que exige `DATABASE_URL`. Añadido `env` al hash de `build` y
`globalDependencies` con los ficheros de config de formato y lint.

**CI**: `ci.yml` con tres jobs — `quality` (`format:ci` + `turbo run lint check-types test
build`, con caché de turbo y `playwright install chromium`, que los proyectos `component` y
`storybook` de vitest necesitan), `packages` (`check-publish` con `publint` + `attw`, T1.7) y
`storybook` (`build-storybook` + artefacto). `release.yml` con Changesets, intacto.
Hooks locales con `simple-git-hooks` + `lint-staged` (pre-commit: oxlint + prettier sobre lo
tocado; pre-push: `format:ci` + `turbo run lint check-types test build`), con instalación **no
obligatoria** (`postinstall` tolerante a fallo).

**Metadatos**: `LICENSE` MIT (CallePuzzle) en la raíz, `license` verificado en los cuatro
paquetes, `.nvmrc` = 22 y `engines` `{ node: ">=22", bun: ">=1.3.0" }`.

**T11.2**: el reformateo global está ejecutado y `bun run format:ci` pasa sobre todo el repo.
La intención original de la tarea —un commit que contenga **solo** formato, para no mezclar
reformateo con cambios de lógica— **ya no aplica**: este refactor reescribió casi todos los
ficheros del repo, así que no hay un conjunto de "ficheros intactos que solo cambian de formato"
que aislar. Se prefirió dejar `format:ci` en verde antes que dejar el CI rojo al primer push.

De paso: un ejemplo de la opción A de [04](04-i18n.md) llevaba `...` literal dentro de un bloque

```svelte, y prettier intenta formatear el código embebido de los bloques markdown: escupía un
`SyntaxError` con traza completa en **cada** ejecución de `bun run format`. El snippet ahora es
sintácticamente válido y el pase de formato queda limpio.
```
