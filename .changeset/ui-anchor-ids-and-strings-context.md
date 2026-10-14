---
'@callepuzzle/svelte-ui': minor
---

Reparto de props de anclaje y contexto de textos, a partir de la migración de
`donde-esta-tu-local` (ver `docs/plans/14-revision-migracion-donde-esta-tu-local.md`):

- `NavBarList` y `Dock` son genéricos en el tipo de clave del `RouteMap` y aceptan
  `ids?: Partial<Record<Id, string>>`: atributo `id` del `<a>` de cada entrada, por clave del
  mapa. Es el anclaje que necesitan los tours guiados; hasta ahora un consumidor con tour tenía
  que reimplantar la lista (o el `<nav>` del dock) entera.
- Nuevo `setUiStrings` / `getUiStrings` (contexto de Svelte): los textos de todos los
  componentes pueden fijarse una vez en el layout raíz. Cada componente resuelve con la
  precedencia prop `strings` > contexto > default en inglés; la prop sigue ganando para
  puntuales.
- `FormLoginOtp`: `startOverHref` pasa por `resolve()` como el resto de enlaces de la librería
  (antes era una URL cruda), para respetar `paths.base`.
- `FormLoginMagicLink`: documentado que `callbackURL` es una URL cruda para better-auth (no
  pasa por `resolve()`).
