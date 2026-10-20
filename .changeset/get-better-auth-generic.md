---
'@callepuzzle/auth': patch
---

`getBetterAuth` pasa a ser genérica (`<T extends BetterAuthOptions>`, retorno `ReturnType<typeof betterAuth<T>>`) y propaga `options` tal cual a `betterAuth`: la anotación de retorno anterior borraba la inferencia de plugins, así que los endpoints que estos añaden no existían en el tipo de `auth.api` (en runtime sí) y los consumidores tenían que llamar al handler con `Request` construidos o hacer casts (issue #19). Cambio solo de tipos: en runtime la factoría sigue sin añadir ni quitar plugins, y los tests de comportamiento (H5.3) no cambian de garantía.
