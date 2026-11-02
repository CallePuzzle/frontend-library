---
'@callepuzzle/svelte-ui': major
'@callepuzzle/auth': major
---

**SvelteKit 3**: cierra las alertas de seguridad de Dependabot (`GHSA-pfhg-q3qv-9q6r`, redirección a sitio no confiable en el envío de formularios, y `GHSA-27mw-82g8-phjj`, XSS vía cabecera `cache-control` en páginas prerenderizadas), que exigen `@sveltejs/kit >= 3.0.0`.

**Cambio breaking**: los peers `@sveltejs/kit` pasan de `^2.27.0` a `^3.0.0` en `@callepuzzle/svelte-ui` y `@callepuzzle/auth`. Los consumidores deben migrar a SvelteKit 3 (ver la [guía oficial](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)), que a su vez arrastra Vite 8, Svelte 5.57+, TypeScript 6 y `svelte.config.js` → opciones del plugin `sveltekit()` de vite.

Además:

- `@callepuzzle/svelte-ui`: peers `svelte` `^5.57.1`, `sveltekit-superforms` `^3.0.0` y `formsnap` `^2.1.0`. El tipo `Handle` se importa ahora desde `@sveltejs/kit/hooks` (ubicación canónica en kit 3). La resolución de rutas se concentra en el nuevo envoltorio interno `resolveRoute()` porque el `resolve()` de kit 3 no es directamente llamable en una librería sin rutas (su `RouteId` es una unión vacía).
- `@callepuzzle/auth`: tipos actualizados a better-auth 1.7 (`BetterAuthClientOptions`, `BaseURLConfig`). El chequeo de configuración segura acepta ahora el `baseURL` dinámico (`allowedHosts`), que es una lista explícita de hosts y no depende de cabeceras.
- Cadena de desarrollo del monorepo: vite 8, `@sveltejs/vite-plugin-svelte` 7, Storybook 10, superforms 3, tsup 9, TypeScript 6.
