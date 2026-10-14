---
'@callepuzzle/auth': minor
---

- `betterAuthHandle` acepta opciones (`BetterAuthHandleOptions`): con `{ skipAssets: true }` el
  handle no resuelve sesión ni pasa por better-auth en peticiones de assets estáticos
  (`/_app/**`, service worker y extensiones estáticas). Un asset nunca resuelve sesión ni atiende
  `/api/auth/*`, así que el salto es seguro y se ahorra una llamada a `getSession` por fichero
  servido.
- Nuevo `emailOtpRateLimitRules({ window, max })`: las reglas de `rateLimit.customRules` para los
  dos endpoints del flujo OTP por email (pedir y canjear el código), con 3 por minuto por IP por
  defecto. Era el mismo bloque que cada consumidor copiaba a mano.
