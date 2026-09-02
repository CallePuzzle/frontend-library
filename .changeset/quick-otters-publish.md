---
"@callepuzzle/core": minor
"@callepuzzle/auth": minor
"@callepuzzle/svelte-ui": minor
---

Primera versión distribuible de la librería.

- Scope público `@callepuzzle` y publicación en GitHub Packages (`npm.pkg.github.com`).
- `@repo/library` se parte en `@callepuzzle/core` (rutas y tipos, sin dependencias de runtime) y
  `@callepuzzle/auth` (wrapper de better-auth), que expone `./client`, `./server`, `./hooks` y
  `./sender` en vez de un único barrel que mezclaba cliente y servidor.
- `@repo/sveltekit-ui` pasa a `@callepuzzle/svelte-ui`, con `sideEffects`, `files`,
  `publishConfig` y la condición `default` en `exports`.
- `zod-to-json-schema` y `@sveltejs/package` pasan a estar declaradas: se usaban sin figurar en
  el `package.json`, así que la instalación desde registro y el propio build estaban roto.
- `@sveltejs/kit` y `better-auth` pasan a `peerDependencies` en `@callepuzzle/auth`: sus tipos
  públicos los necesitan y duplicar la instancia de better-auth rompe la sesión.
