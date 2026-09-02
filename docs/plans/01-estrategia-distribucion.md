# 01 — Estrategia de distribución y versionado

**Prioridad: bloqueante.** Nada de lo demás importa si las apps no pueden instalar la librería.

## Contexto

Los dos consumidores (`donde-esta-tu-local`, `y-tu-que-compras`) son **repos independientes**,
no workspaces de este monorepo. Pero todos los paquetes de aquí están preparados solo para
consumo interno:

- `packages/library/package.json` → `"name": "@repo/library"`, `"version": "0.0.0"`
- `packages/sveltekit-ui/package.json` → `"name": "@repo/sveltekit-ui"`, `"version": "0.0.0"`
- `sveltekit-ui` depende de `"@repo/library": "workspace:*"` — un protocolo que **solo existe
  dentro del workspace**. Publicado tal cual, `npm install` falla.
- No hay `publishConfig`, ni registro configurado (`.npmrc` está vacío), ni tags de versión, ni
  CHANGELOG, ni CI de publicación.

Consecuencia comprobada: `y-tu-que-compras/package.json` tiene
`"storybook-svelte": "link:storybook-svelte"` — un `bun link` a un nombre de paquete que **ya no
existe en este repo** (se renombró en el commit `c91a06c`/`66fa22a`). Su
`src/hooks.server.ts` importa `betterAuth` de `storybook-svelte`, símbolo que hoy se llama
`betterAuthHandle` y vive en otro subpath. Ese consumidor **no compila**.

## Decisiones a tomar

### D1 — Nombre y scope público

`@repo/*` es el scope de plantilla de `create-turbo`. Hay que elegir uno real. Propuesta:

| Paquete actual | Nombre propuesto |
|---|---|
| `@repo/library` (parte routes/tipos) | `@callepuzzle/core` |
| `@repo/library` (parte better-auth) | `@callepuzzle/auth` |
| `@repo/sveltekit-ui` | `@callepuzzle/svelte-ui` |
| `@repo/typescript-config` | `@callepuzzle/typescript-config` (privado) |

Ver [03 — Arquitectura de paquetes](03-arquitectura-paquetes.md) para el porqué del corte
`library` → `core` + `auth`.

### D2 — Dónde se publica

Opciones, de menos a más esfuerzo:

1. **Dependencias git** (`"@callepuzzle/svelte-ui": "github:org/repo#semver:^0.3.0"` o
   `git+ssh://…#v0.3.0`). Cero infraestructura. Contra: hay que commitear `dist/` o usar
   `prepare` en el consumidor, y no hay resolución transitiva de los subpaquetes del monorepo.
   Válido solo si se colapsa todo en **un** paquete.
2. **GitHub Packages / npm privado (recomendado).** `publishConfig.registry`, `.npmrc` con
   `//npm.pkg.github.com/:_authToken=${NPM_TOKEN}`. Es lo que hace `bitban/monorepo` (su
   `turbo.json` declara `"globalEnv": ["NPM_TOKEN"]`). Soporta varios paquetes y semver de
   verdad.
3. **npm público.** Solo si el código no tiene nada específico de cliente. Hoy no lo tiene, pero
   ata a mantener una API pública.

**Recomendación: opción 2.** Es la que escala a los 3 paquetes propuestos.

### D3 — Versionado

Adoptar **Changesets** (`@changesets/cli`):

- `bun changeset` en cada PR que toque un paquete publicable.
- `changeset version` sube versiones y genera CHANGELOG por paquete.
- `changeset publish` publica en CI al mergear a `main`.
- Convierte automáticamente `workspace:*` en el rango de versión real al publicar — resuelve el
  problema de `@repo/library: workspace:*` sin tocar nada a mano.

Alternativa si se prefiere menos ceremonia: versión única para todos los paquetes,
`changeset` con `fixed`/`linked` o directamente `npm version` + script. Pero Changesets es
mucho menos trabajo que el script casero.

### D4 — Contrato de compatibilidad

Mientras la API se estabiliza, publicar en `0.x` y aceptar breaking changes en minors, pero
**documentarlos en el CHANGELOG**. Al llegar a paridad con `donde-esta-tu-local`, cortar `1.0.0`.

## Tareas

- [x] **T1.1** Decidir scope público (D1) y registro (D2). Anotar la decisión como ADR en
  `docs/adr/0001-distribucion.md`.
- [x] **T1.2** Renombrar los paquetes publicables. Actualizar todos los imports internos
  (`packages/sveltekit-ui/src/components/*.svelte` importan `@repo/library` y
  `@repo/library/better-auth`; `demos/sveltekit/src/**` también).
- [x] **T1.3** Añadir a cada paquete publicable: `version`, `license`, `repository`,
  `publishConfig` (registry + `"access"`), `files`, `sideEffects`.
  - `packages/library` hoy **no tiene `files`** → publicaría `src/`, `project.inlang/`,
    `messages/` y `tsup.config.ts`.
  - `packages/sveltekit-ui` sí tiene `files: ["dist", …]` — mantener.
- [x] **T1.4** Quitar `"private": true` de los paquetes que deben publicarse y **dejarlo** en los
  internos (`typescript-config`).
- [x] **T1.5** Instalar y configurar Changesets: `.changeset/config.json` con `"access"`,
  `"baseBranch": "main"`, y `"ignore"` para demos y paquetes internos.
- [x] **T1.6** `.npmrc` del repo con el registry del scope; token por variable de entorno, nunca
  commiteado. Documentar en el README cómo autenticarse.
- [x] **T1.7** Añadir `publint` y `@arethetypeswrong/cli` como check de `prepack`/CI en cada
  paquete publicable. `sveltekit-ui` ya invoca `publint` en `prepack` — extenderlo al resto y
  hacerlo fallar el build (hoy no está en ninguna task de `turbo.json`).
- [x] **T1.8** Workflow de CI de publicación (GitHub Actions / GitLab CI): en `main`,
  `changeset version` → commit → `changeset publish`.
- [~] **T1.9** Validado **desde fuera** con tarballs (`npm pack` de los tres paquetes →
  proyecto SvelteKit vacío): `vite build` y `svelte-check` en verde importando `Header`,
  `FormLogin`, `Modal`, `routes`/`Routes` y `@callepuzzle/auth/hooks` + `/server`.
  Ese test descubrió y arregló dos roturas reales del paquete publicado: `zod-to-json-schema`
  y `@sveltejs/package` sin declarar, y `dist/paraglide/**` excluido del tarball por el
  `.gitignore` que Paraglide deja en `src/paraglide/` y que `svelte-package` copia a `dist/`.
  **Pendiente:** la `0.1.0` real la corta CI al mergear a `main` (ver más abajo).

## Criterios de aceptación

- Un `bun add` desde un repo limpio instala la librería y sus dependencias transitivas del
  monorepo sin `workspace:*` sin resolver.
- `publint` y `attw` pasan en verde para todos los paquetes publicables.
- Un cambio mergeado a `main` produce una versión nueva publicada sin intervención manual.

## Relación con otras tareas

- Depende de [02](02-alcance-monorepo.md) (qué paquetes hay que publicar).
- Habilita [12](12-convergencia-consumidores.md) (migrar los consumidores).

## Estado (2026-09-02)

Implementado en la rama `monorepo`. El changeset inicial
(`.changeset/quick-otters-publish.md`) deja las tres versiones en `0.1.0` cuando CI lo aplique.

**Bloqueante para T1.9:** `monorepo` y `main` tienen historias git **no relacionadas**
(raíces `be39580` vs `b38679a`). Hasta que `monorepo` se promocione a `main`:

- `changeset status` no puede calcular el diff contra `baseBranch`.
- `.github/workflows/release.yml` (que escucha `push` a `main`) no se dispara, así que no hay
  publicación.

**Decisiones tomadas al implementar, no previstas en el plan:**

- `@callepuzzle/auth` sin entrypoint raíz: solo `./client`, `./server`, `./hooks` y `./sender`
  (adelanta T3.2 de [03](03-arquitectura-paquetes.md); la API interna —singleton de
  `useSession()`, `as any`— sigue intacta para [05](05-auth.md)).
- Las dependencias internas usan rangos semver (`^0.0.0`), **no** `workspace:*`: `changeset
  publish` invoca `npm publish`, que publicaría `workspace:*` literal y rompería la instalación.
- attw corre con `--profile esm-only`; en `svelte-ui` además ignora `internal-resolution-error`
  (los `.d.ts` de `svelte-package` importan `./X.svelte`, que TS solo resuelve con su plugin).
