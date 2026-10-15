---
'@callepuzzle/auth': minor
---

Seguridad: `betterAuthHandle` comprueba en la primera petición (fuera del build) que la instancia
tiene `baseURL` y un secreto propio de al menos 32 caracteres, y si no, no atiende ninguna
petición. Sin `baseURL`, better-auth deduce la URL de los magic links de las cabeceras
`X-Forwarded-*` de la primera petición y la conserva para todo el proceso, así que quien la envíe
decide a qué dominio llegan los tokens de login. **Cambio incompatible**: fija `baseURL` /
`BETTER_AUTH_URL` y `secret` / `BETTER_AUTH_SECRET` antes de actualizar.

`skipAssets` ya no se salta `.json`, `.txt` ni `.xml`: saltarse `__data.json` dejaba `locals.user`
vacío en cada navegación en cliente. Ahora solo cuenta como asset `/_app/**`, el service worker e
imágenes y fuentes.

El JSDoc de `emailOtpRateLimitRules` explica qué más hace falta para que el rate limit sirva:
`ipAddressHeaders` según el proxy y un `storage` compartido.
