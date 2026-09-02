# ADR 0001 — Distribución y versionado de la librería

- **Fecha:** 2026-09-02
- **Estado:** aceptado
- **Contexto del plan:** [01 — Estrategia de distribución y versionado](../plans/01-estrategia-distribucion.md)

## Contexto

Los consumidores reales (`donde-esta-tu-local`, `y-tu-que-compras`) son repos independientes,
no workspaces de este monorepo. Hasta ahora los paquetes se llamaban `@repo/*`, estaban en
`version: 0.0.0` y se resolvían con `workspace:*`: no había forma de instalarlos desde fuera.
`y-tu-que-compras` seguía apuntando con `link:` a un nombre de paquete (`storybook-svelte`) que
ya no existe.

## Decisión

### D1 — Scope público y mapa de paquetes

Scope **`@callepuzzle`**. `packages/library` se parte en dos según su frontera real
(dato puro vs. autenticación) y `sveltekit-ui` pasa a `ui`:

| Antes | Ahora | Publicable |
|---|---|---|
| `@repo/library` (`src/routes.ts`) | `@callepuzzle/core` (`packages/core`) | sí |
| `@repo/library` (`src/better-auth/*`) | `@callepuzzle/auth` (`packages/auth`) | sí |
| `@repo/sveltekit-ui` | `@callepuzzle/svelte-ui` (`packages/ui`) | sí |
| `@repo/typescript-config` | `@callepuzzle/typescript-config` | no (`private`) |

`@callepuzzle/auth` no tiene entrypoint raíz: expone `./client`, `./server`, `./hooks` y
`./sender` para no arrastrar código de servidor al bundle de cliente (era el hallazgo H3.2 del
plan 03). Lo que **no** cambia aquí es la API interna: el singleton de `useSession()` y el
`as any` del cliente siguen igual y se atacan en [05](../plans/05-auth.md).

`@repo/database`, `@repo/eslint-config`, `@repo/tailwind-config` y `@repo/react-ui` se quedan
con su nombre viejo y marcados `private`: el plan [02](../plans/02-alcance-monorepo.md) los
elimina, así que renombrarlos sería trabajo tirado.

### D2 — Registro: GitHub Packages

Se publica en **GitHub Packages** (`https://npm.pkg.github.com`), opción 2 del plan 01.

- Cada paquete publicable lleva `publishConfig.registry` + `publishConfig.access: "public"`.
- El `.npmrc` del repo mapea el scope al registro y lee el token de `NPM_TOKEN`. **El token no
  se commitea nunca.**
- En CI basta el `GITHUB_TOKEN` del propio workflow (permiso `packages: write`); funciona porque
  el campo `repository` de cada paquete apunta a este repo.

**Consecuencia a tener en cuenta:** `npm.pkg.github.com` exige autenticación **incluso para
paquetes públicos**. Cada consumidor (y su CI) necesita un `.npmrc` con un token con
`read:packages`. Si algún día eso molesta más de lo que aporta, la salida es npm público
(opción 3 del plan 01), que no obliga a autenticarse para instalar.

### D3 — Versionado: Changesets

- Un changeset por PR que toque un paquete publicable (`bun run changeset`).
- `changeset version` sube versiones y genera el CHANGELOG por paquete.
- `changeset publish` publica desde CI.
- Changesets reescribe `workspace:*` al rango de versión real al publicar, así que
  `@callepuzzle/svelte-ui` puede seguir dependiendo de `core` y `auth` con `workspace:*` en el
  repo.
- Changelog con `@changesets/cli/changelog` (el simple) y no `@changesets/changelog-github`,
  para no exigir un `GITHUB_TOKEN` al correr `changeset version` en local.
- Los paquetes internos y los demos están `private`, así que Changesets los ignora sin
  necesidad de lista `ignore`.

### D4 — Contrato de compatibilidad

`0.x` mientras la API se estabiliza: los breaking changes van como **minor** y se documentan en
el CHANGELOG. Se corta `1.0.0` al alcanzar paridad con `donde-esta-tu-local`
(ver [12](../plans/12-convergencia-consumidores.md)).

### D5 — Verificación de empaquetado

`publint` + `@arethetypeswrong/cli` en el script `check-publish` de cada paquete publicable,
como task de turbo (`turbo run check-publish`, que depende de `build`) y como paso del CI.

Los tres paquetes son ESM-only, así que attw corre con `--profile esm-only` (omite `node10` y
`node16-cjs`). En `@callepuzzle/svelte-ui` se ignora además `internal-resolution-error`: los
`.d.ts` que emite `svelte-package` importan `./X.svelte`, y TypeScript solo resuelve esa
extensión con el plugin de Svelte (busca `X.d.svelte.ts`). Es inherente a `svelte-package`, no
un defecto del empaquetado.

## Alternativas descartadas

- **Dependencias git** (`github:org/repo#semver:^0.3.0`): cero infraestructura, pero obliga a
  commitear `dist/` y no resuelve las dependencias transitivas entre los paquetes del monorepo.
  Solo valdría colapsando todo en un paquete, y aquí hay tres.
- **npm público**: instalación sin autenticar, pero ata a mantener una API pública. Se reserva
  como salida si la autenticación de GitHub Packages resulta un estorbo.

## Pendiente

`monorepo` y `main` tienen **historias git no relacionadas** (raíces distintas: `be39580` vs
`b38679a`). Hasta que `monorepo` se promocione a `main`, ni `changeset status` puede calcular el
diff contra la base ni el workflow de release se dispara.
