# 11 — Tooling, calidad y CI

**Prioridad: media.** Sin esto, todo lo arreglado en los documentos anteriores se vuelve a
romper solo.

## Hallazgos

### H11.1 — No hay CI. Ninguna.

No existe `.github/workflows/`, `.gitlab-ci.yml`, ni hooks de git. Nada verifica que el repo
compila antes de mergear. Comparar con `bitban/monorepo`, que tiene `.gitlab-ci.yml` y
`simple-git-hooks` con un `pre-push` que corre `format:ci && turbo run lint compile test`.

### H11.2 — Tres estilos de formato conviviendo

| Ámbito | Estilo |
|---|---|
| `FormFields.svelte`, `FormString.svelte`, `Modal.svelte`, `schemas/*`, `stories` parciales | **Tabuladores** |
| `FormLogin.svelte`, `Header.svelte`, `NavBarEnd.svelte`, `NavBarList.svelte`, `Link.svelte`, `packages/library/src/*` | **2 espacios** |
| `svelte.config.js`, `eslint.config.js` | Tabuladores |

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

| Paquete | TS |
|---|---|
| root | `5.8.3` |
| `packages/database` | `5.5.4` |
| `packages/react-ui` | `5.8.2` |
| `packages/sveltekit-ui` | `^5.9.2` |
| `packages/library` | `^5.0.0` |
| `demos/sveltekit` | `^5.9.2` |

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
- [ ] **T11.1** Crear `.prettierrc` en el root alineado con los consumidores (tabs, comillas
  simples, sin trailing commas, ancho 100, plugins `prettier-plugin-svelte` y
  `prettier-plugin-tailwindcss`) y `.prettierignore` (paraglide generado, `dist`, `.svelte-kit`,
  `bun.lock`).
- [ ] **T11.2** Ejecutar `bun run format` **una vez, en un commit aislado** que solo reformatee,
  para no mezclar formato con cambios de lógica.
- [ ] **T11.3** Unificar lint: una flat config compartida en el root
  (`eslint.config.js` con overrides por paquete) o adoptar **oxlint** como en los otros repos.
  Dar config a `packages/library` (hoy tiene script de lint sin config) y a `demos/sveltekit`
  (hoy sin script).
- [ ] **T11.4** Quitar `eslint-plugin-only-warn` o asumirlo conscientemente y documentarlo.

### Tipos
- [ ] **T11.5** Fijar **una** versión de TypeScript en todo el monorepo.
- [ ] **T11.6** Hacer que los paquetes Svelte extiendan de verdad
  `@callepuzzle/typescript-config`, o borrar el paquete si no aporta.
- [ ] **T11.7** Quitar `next-env.d.ts` del `include` de `packages/library/tsconfig.json`.
- [ ] **T11.8** Añadir script `check` a todos los paquetes y declarar la task en `turbo.json`
  (`svelte-check` para los Svelte, `tsc --noEmit` para el resto).
- [ ] **T11.9** Activar `noUncheckedIndexedAccess` donde sea viable (ayuda con el bug de
  `jsonSchema.required` de [09](09-forms-schemas.md), H9.5).

### Turbo
- [ ] **T11.10** Declarar las tasks que faltan (`check`, `test`, `storybook:build`) y sus
  `outputs`/`inputs`.
- [ ] **T11.11** Revisar `outputs` de `build` tras eliminar Paraglide de los paquetes.

### CI
- [ ] **T11.12** Workflow de PR: `bun install --frozen-lockfile` → `turbo run lint check test
  build` → `publint`/`attw`.
- [ ] **T11.13** Workflow de `main` con Changesets (ver [01](01-estrategia-distribucion.md),
  T1.8).
- [ ] **T11.14** Hooks locales (`simple-git-hooks` o `husky` + `lint-staged`) replicando el
  patrón de los otros dos repos.

### Metadatos
- [ ] **T11.15** `LICENSE` en el root y campo `license` en cada `package.json` publicable.
- [ ] **T11.16** `.nvmrc` y `engines.node` realista (>=22).
- [ ] **T11.17** Reescribir `README.md` del root y borrar/reescribir
  `packages/sveltekit-ui/README.md` (ver [13](13-documentacion.md)).

## Criterios de aceptación

- Un PR que rompa tipos, lint, tests o el build **no se puede mergear**.
- `bun run format:ci` pasa en verde sobre todo el repo.
- Una sola versión de TypeScript, ESLint y Vitest en el `bun.lock`.
