---
'@callepuzzle/auth': patch
---

`betterAuthHandle` pide a la instancia un tipo estructural mínimo (`handler`, `options`, `$context` y `api.getSession`) en vez del constraint `A extends ReturnType<typeof betterAuth>`: `Auth<T>` es invariante en `T`, así que desde que `getBetterAuth` conserva la inferencia de plugins (1.0.1, issue #19) y devuelve instancias específicas, el constraint antiguo las rechazaba y ningún consumidor podía compilar su `hooks.server.ts`. Es la pauta del propio better-auth: su `svelteKitHandler` pide exactamente `{ handler, options }`. Cambio solo de tipos; el comportamiento del handle no se toca.
