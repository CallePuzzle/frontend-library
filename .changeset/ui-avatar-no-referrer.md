---
'@callepuzzle/svelte-ui': patch
---

`NavBarEnd` carga `user.image` con `referrerpolicy="no-referrer"`: si la URL del avatar es de un
tercero, no recibe la página desde la que se mira.
