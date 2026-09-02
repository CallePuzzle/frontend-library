# CallePuzzle Frontend Library

Librería de front de CallePuzzle: componentes Svelte 5, rutas tipadas y wrapper de better-auth,
consumidos por las apps SvelteKit de CallePuzzle (`donde-esta-tu-local`, `y-tu-que-compras`).

## Paquetes

| Paquete | Ruta | Qué expone |
|---|---|---|
| `@callepuzzle/core` | `packages/core` | Rutas y tipos (`routes`, `Routes`, `Route`). Sin dependencias de runtime. |
| `@callepuzzle/auth` | `packages/auth` | Wrapper de better-auth: `./client`, `./server`, `./hooks`, `./sender`. |
| `@callepuzzle/svelte-ui` | `packages/ui` | Componentes Svelte 5 + schemas + Storybook. |
| `@callepuzzle/typescript-config` | `packages/typescript-config` | Interno (`private`), no se publica. |

`demos/sveltekit` es la app de referencia y banco de pruebas.

Los paquetes `@repo/database`, `@repo/eslint-config`, `@repo/tailwind-config` y `@repo/react-ui`
están marcados `private` y los elimina el plan
[02](docs/plans/02-alcance-monorepo.md).

## Consumir la librería

Se publica en **GitHub Packages**. `npm.pkg.github.com` exige autenticación incluso para
paquetes públicos, así que cada consumidor necesita:

1. Un token de GitHub (PAT classic) con scope **`read:packages`**.
2. Un `.npmrc` en el repo consumidor:

   ```
   @callepuzzle:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

3. `NPM_TOKEN` en el entorno (nunca commiteado). En GitHub Actions basta
   `NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.

Después:

```bash
bun add @callepuzzle/svelte-ui @callepuzzle/core @callepuzzle/auth
```

```svelte
<script lang="ts">
  import { Header } from "@callepuzzle/svelte-ui";
  import { routes } from "@callepuzzle/core";
</script>
```

```ts
// src/hooks.server.ts
import { betterAuthHandle } from "@callepuzzle/auth/hooks";
import { getBetterAuth } from "@callepuzzle/auth/server";
```

`@callepuzzle/auth` declara `@sveltejs/kit` y `better-auth` como **peer**: la app aporta su
propia instancia (dos copias de better-auth rompen la sesión).

## Desarrollo

```bash
bun install
bun run build          # turbo run build
bun run check-publish  # publint + attw en los tres paquetes publicables
bun run storybook
```

Para arrancar el demo (mientras `@repo/database` siga en el repo):

```bash
bun run db:generate
bun run db:migrate:dev
turso dev --db-file dev.db
bun run dev:sveltekit
```

### Publicar

Ver [`docs/adr/0001-distribucion.md`](docs/adr/0001-distribucion.md). Resumen:

1. En cada PR que toque un paquete publicable: `bun run changeset` y commitea el `.md`.
2. Al mergear a `main`, `.github/workflows/release.yml` abre el PR *"chore: version packages"*.
3. Al mergear ese PR, el workflow publica en GitHub Packages con el `GITHUB_TOKEN`.

Para publicar a mano hace falta un PAT con **`write:packages`** en `NPM_TOKEN` y
`bun run release`.

## Documentación

- [Plan de trabajo completo](docs/plans/00-resumen.md)
- [ADR 0001 — Distribución y versionado](docs/adr/0001-distribucion.md)
