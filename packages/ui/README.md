# @callepuzzle/svelte-ui

Componentes Svelte 5 de la librería de front de CallePuzzle.

## Instalación

Se publica en GitHub Packages, que exige autenticación incluso para paquetes públicos. En el
repo consumidor, `.npmrc`:

```
@callepuzzle:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

con `NPM_TOKEN` = PAT con scope `read:packages`. Después:

```sh
bun add @callepuzzle/svelte-ui
```

`svelte` es **peerDependency**: la aporta la app.

## Uso

```svelte
<script lang="ts">
  import { Header, FormLogin, Modal } from "@callepuzzle/svelte-ui";
  import { routes } from "@callepuzzle/core";
  import { authClient, session } from "@callepuzzle/auth/client";
</script>

<Header title="Mi app" {routes} {session} {authClient} locales={["en", "es"]} setLocale={setLocale}>
  <slot />
</Header>
```

## Desarrollo

Desde la raíz del monorepo:

```sh
bun install
bun run build            # compila los tres paquetes publicables
bun run storybook        # Storybook en :6006
bun run check-publish    # publint + attw
```

Ver el [plan de trabajo](../../docs/plans/00-resumen.md) y el
[ADR de distribución](../../docs/adr/0001-distribucion.md).
