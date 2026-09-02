# 02 — Recortar el alcance del monorepo

**Prioridad: bloqueante** (barata y desbloquea todo lo demás).

## Contexto

El repo salió de `create-turbo` (commits `45effd3`, `8f7f351`) y arrastra la plantilla entera.
Hoy 4 de los 7 paquetes y 1 de los 2 demos no aportan nada, pero sí cuestan: dependencias,
tiempo de CI, superficie de lint, y ruido al leer el repo.

## Hallazgos

### `packages/react-ui` — vacío

- `src/button.tsx`, `src/card.tsx`, `src/code.tsx` son **literalmente** los ficheros de la
  plantilla de `create-turbo` (el `Button` hace `alert("Hello from your ${appName} app!")`, la
  `Card` enlaza con `?utm_source=create-turbo`).
- `src/stories/` son las stories de ejemplo que genera `storybook init` (Button, Header, Page,
  Configure.mdx, y ~15 PNG/SVG de assets de la plantilla).
- Está marcado `"private": true` y exporta `"./*": "./src/*.tsx"` (TSX crudo, sin build).
- **Ningún** demo ni consumidor lo importa. `demos/astro` (que existe explícitamente "para probar
  la librería de react", según el README) tiene un `astro.config.mjs` vacío, sin la integración
  `@astrojs/react`, y su `src/pages/index.astro` es la página de bienvenida de Astro intacta.

El propio encargo dice: *"la idea era que funcionase para react pero con que funcione para svelte
me vale"*. Con cero código React escrito y cero consumidores React, mantenerlo es coste puro.

### `packages/database` — no es de front

- Prisma + `@prisma/adapter-libsql` apuntando a Turso.
- `src/client.ts` **hardcodea** `url: "http://127.0.0.1:8080"` — sin variable de entorno.
- `prisma/schema.prisma` hardcodea `url = "file:../../../dev.db"`.
- El esquema es el que genera `better-auth` (User/Session/Account/Verification/Organization…).
- **Dependencia invertida**: su script `better-auth:generate` apunta a
  `--config ../../demos/sveltekit/src/lib/server/auth.ts` — un paquete compartido leyendo del
  demo.
- Los consumidores reales usan **PostgreSQL + Prisma 7** (`donde-esta-tu-local`) y su propio
  esquema. Nunca van a instalar este paquete.

### `packages/eslint-config` — para Next.js

Exporta `./base`, `./next-js` y `./react-internal`, con `@next/eslint-plugin-next`,
`eslint-plugin-react` y `eslint-plugin-react-hooks`. Ningún paquete Svelte lo usa:
`packages/sveltekit-ui/eslint.config.js` es una flat config propia y completa con
`eslint-plugin-svelte`. Los únicos consumidores declarados son `packages/database`
(que además usa `.eslintrc.js` **legacy**, no flat) y `packages/library`.

### `demos/astro` — plantilla intacta

Ver arriba. No demuestra nada.

### `packages/tailwind-config` — 3 líneas

`shared-styles.css` entero:
```css
@import "tailwindcss";
@plugin "daisyui";
```
Más un `postcss.config.js` que exporta un objeto nombrado (`export const postcssConfig`) que
**nadie importa** — y que además no es el formato que PostCSS espera (`export default`).
Un paquete de workspace completo para dos líneas de CSS.

## Propuesta

| Paquete | Acción |
|---|---|
| `packages/react-ui` | **Eliminar.** Documentar la decisión en el ADR. |
| `demos/astro` | **Eliminar.** |
| `packages/database` | **Eliminar** del monorepo. Si hace falta un esquema better-auth de referencia, va como fichero `.prisma` de ejemplo en `docs/` o dentro del demo. |
| `packages/eslint-config` | **Eliminar** (Next/React) y sustituir por una config flat compartida para Svelte/TS, o simplemente dejar la de `sveltekit-ui` y replicarla. |
| `packages/tailwind-config` | **Absorber** en `packages/ui` como `src/styles/index.css` (ver [08](08-estilos-theming.md)). |
| `demos/sveltekit` | **Conservar.** Es el banco de pruebas y la documentación ejecutable. |

Resultado: de 7 paquetes + 2 demos a 4 paquetes + 1 demo.

### Sobre React, por si vuelve

Si en el futuro hace falta React, el camino correcto **no** es un `react-ui` paralelo que
duplica los componentes, sino:
- `@callepuzzle/core` (tipos, `routes`, utilidades de schema→campos) — ya framework-agnóstico.
- `@callepuzzle/auth` — better-auth es agnóstico salvo el subpath `/svelte` del cliente.
- y solo entonces un `@callepuzzle/react-ui` que consume ambos.

Es exactamente el corte que propone [03](03-arquitectura-paquetes.md), así que hacerlo ahora
deja la puerta abierta sin coste.

## Tareas

- [ ] **T2.1** Confirmar con el equipo el descarte de React/Astro. Escribir
  `docs/adr/0002-solo-svelte.md` con el razonamiento (cero código, cero consumidores, coste de
  mantenimiento) y la vía de vuelta (core/auth agnósticos).
- [ ] **T2.2** `git rm -r packages/react-ui demos/astro`.
- [ ] **T2.3** `git rm -r packages/database`. Mover `prisma/schema.prisma` a
  `docs/referencia/better-auth.prisma` si se quiere conservar como ejemplo. Quitar del root
  `package.json` los scripts `db:generate`, `db:migrate:deploy`, `db:migrate:dev`, `db:push`,
  `better-auth:generate`, y de `turbo.json` sus tasks.
- [ ] **T2.4** Actualizar `demos/sveltekit/src/lib/server/db.ts` y su `package.json` para no
  depender de `@repo/database`: cliente Prisma propio dentro del demo, con `DATABASE_URL` por
  entorno (nunca hardcodeada).
- [ ] **T2.5** `git rm -r packages/eslint-config` y unificar lint (ver
  [11](11-tooling-ci-calidad.md)).
- [ ] **T2.6** Absorber `packages/tailwind-config` en el paquete `ui` y arreglar los imports:
  `packages/sveltekit-ui/.storybook/preview.ts` lo importa por ruta relativa
  (`"../../tailwind-config/shared-styles.css"`), lo que sale del paquete y se romperá al mover.
- [ ] **T2.7** Actualizar `README.md` y `turbo.json` para reflejar el nuevo mapa.
- [ ] **T2.8** Reinstalar (`bun install`) y verificar que `turbo run build lint check-types` pasa.

## Criterios de aceptación

- `ls packages` devuelve solo los paquetes con código vivo.
- Ninguna referencia colgante a `@repo/react-ui`, `@repo/database`, `@repo/eslint-config` ni
  `@repo/tailwind-config` en el repo (`grep -r` limpio).
- El grafo de turbo no tiene tasks huérfanas.
