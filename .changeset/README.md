# Changesets

Este directorio guarda los [changesets](https://github.com/changesets/changesets) pendientes:
un fichero markdown por cambio, con el paquete afectado, el tipo de bump (`patch`/`minor`/
`major`) y la descripción que acabará en el CHANGELOG.

## Flujo

1. En cada PR que toque `@callepuzzle/core`, `@callepuzzle/auth` o `@callepuzzle/svelte-ui`:

   ```bash
   bun run changeset
   ```

   Elige los paquetes, el tipo de bump y escribe el resumen. Commitea el `.md` que se genera.

2. Al mergear a `main`, el workflow `.github/workflows/release.yml` abre (o actualiza) un PR
   _"Version Packages"_ con las versiones y los CHANGELOG ya calculados.

3. Al mergear ese PR, el mismo workflow ejecuta `changeset publish` y sube los paquetes a
   GitHub Packages.

Los paquetes internos (`@callepuzzle/typescript-config`) y el demo están marcados
`"private": true`, así que Changesets los ignora automáticamente.

Mientras la API se estabiliza vivimos en `0.x`: los breaking changes van como **minor** y se
documentan en el CHANGELOG. Ver `docs/adr/0001-distribucion.md`.
