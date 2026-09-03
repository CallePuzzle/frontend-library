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

El propio encargo dice: _"la idea era que funcionase para react pero con que funcione para svelte
me vale"_. Con cero código React escrito y cero consumidores React, mantenerlo es coste puro.

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
@import 'tailwindcss';
@plugin "daisyui";
```

Más un `postcss.config.js` que exporta un objeto nombrado (`export const postcssConfig`) que
**nadie importa** — y que además no es el formato que PostCSS espera (`export default`).
Un paquete de workspace completo para dos líneas de CSS.

## Propuesta

| Paquete                    | Acción                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/react-ui`        | **Eliminar.** Documentar la decisión en el ADR.                                                                                                   |
| `demos/astro`              | **Eliminar.**                                                                                                                                     |
| `packages/database`        | **Eliminar** del monorepo. Si hace falta un esquema better-auth de referencia, va como fichero `.prisma` de ejemplo en `docs/` o dentro del demo. |
| `packages/eslint-config`   | **Eliminar** (Next/React) y sustituir por una config flat compartida para Svelte/TS, o simplemente dejar la de `sveltekit-ui` y replicarla.       |
| `packages/tailwind-config` | **Absorber** en `packages/ui` como `src/styles/index.css` (ver [08](08-estilos-theming.md)).                                                      |
| `demos/sveltekit`          | **Conservar.** Es el banco de pruebas y la documentación ejecutable.                                                                              |

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

- [x] **T2.1** Confirmar con el equipo el descarte de React/Astro. Escribir
      `docs/adr/0002-solo-svelte.md` con el razonamiento (cero código, cero consumidores, coste de
      mantenimiento) y la vía de vuelta (core/auth agnósticos).
- [x] **T2.2** `git rm -r packages/react-ui demos/astro`.
- [x] **T2.3** `git rm -r packages/database`. Mover `prisma/schema.prisma` a
      `docs/referencia/better-auth.prisma` si se quiere conservar como ejemplo. Quitar del root
      `package.json` los scripts `db:generate`, `db:migrate:deploy`, `db:migrate:dev`, `db:push`,
      `better-auth:generate`, y de `turbo.json` sus tasks.
- [x] **T2.4** Actualizar `demos/sveltekit/src/lib/server/db.ts` y su `package.json` para no
      depender de `@repo/database`: cliente Prisma propio dentro del demo, con `DATABASE_URL` por
      entorno (nunca hardcodeada).
- [x] **T2.5** `git rm -r packages/eslint-config` y unificar lint (ver
      [11](11-tooling-ci-calidad.md)).
- [x] **T2.6** Absorber `packages/tailwind-config` en el paquete `ui` y arreglar los imports:
      `packages/sveltekit-ui/.storybook/preview.ts` lo importa por ruta relativa
      (`"../../tailwind-config/shared-styles.css"`), lo que sale del paquete y se romperá al mover.
- [x] **T2.7** Actualizar `README.md` y `turbo.json` para reflejar el nuevo mapa.
- [x] **T2.8** `bun install` + `turbo run build check-types check-publish` en verde (9/9 tasks).
      `turbo run lint` **no** pasa, y no es por este recorte: `prettier --check` marca 24 ficheros
      por los tres estilos de indentación que conviven sin `.prettierrc` (hallazgo H11.2). Se
      arregla en [11](11-tooling-ci-calidad.md) T11.1/T11.2, con el commit de reformateo aislado que
      el propio plan pide.

## Criterios de aceptación

- `ls packages` devuelve solo los paquetes con código vivo.
- Ninguna referencia colgante a `@repo/react-ui`, `@repo/database`, `@repo/eslint-config` ni
  `@repo/tailwind-config` en el repo (`grep -r` limpio).
- El grafo de turbo no tiene tasks huérfanas.

## Estado (2026-09-02)

Implementado. `docs/adr/0002-solo-svelte.md` recoge el razonamiento y dónde acabó cada cosa.
De 7 paquetes + 2 demos a **3 paquetes publicables + 1 interno + 1 demo**.

**Decisiones tomadas al implementar, no previstas en el plan:**

- **El esquema de Prisma no se duplica en `docs/referencia/`.** `prisma/` (esquema +
  migraciones) se mueve entero a `demos/sveltekit/`, que es quien necesita generar un cliente.
  Una copia en `docs/` se quedaría desfasada; el esquema del demo es la referencia.
- **`better-auth:generate` se queda, pero en el demo.** Estaba en `packages/database` apuntando
  con `--config ../../demos/sveltekit/...` (la dependencia invertida que señala el plan). Ahora
  es un script del demo con una ruta local.
- **`core` y `auth` pierden el script `lint`** en vez de ganar una config nueva: nunca tuvieron
  fichero de configuración de ESLint, así que `eslint .` no linteaba nada (H11.3). Unificar el
  lint —y decidir entre ESLint y oxlint— es T11.3.
- **`core` y `auth` ganan `check-types: tsc --noEmit`.** La task estaba declarada en
  `turbo.json` pero solo la implementaba `react-ui`, que se borra (H11.4): sin esto,
  `turbo run check-types` se quedaba sin comprobar nada.
- **`tailwindcss` y `daisyui` pasan a `peerDependencies` de `ui`**, consecuencia directa de
  absorber `tailwind-config`: la hoja publicada hace `@import "tailwindcss"` y
  `@plugin "daisyui"`, así que la app tiene que tenerlos.
- **El `@source` de la librería vive en su propia hoja de estilos.** Tailwind 4 no escanea
  `node_modules`, así que `src/styles/index.css` declara `@source "../"` (relativo a
  `dist/styles/`) y la app ya no necesita saber dónde está instalada la librería. Antes el demo
  lo apuntaba a mano con `@source "../../../packages/sveltekit-ui"`, que se habría roto con el
  renombrado.
- **La URL de la base de datos usa dos variables**, porque los dos consumidores de la URL
  quieren formatos distintos: `LIBSQL_URL` (`http://…`) para el adaptador en runtime y
  `DATABASE_URL` (`file:…`) para la CLI de Prisma. Documentadas en
  `demos/sveltekit/.env.example`.

**Encontrado de paso, no arreglado aquí:** Storybook no arranca por falta de `src/app.html`
(nunca ha funcionado en el monorepo). Anotado como
[10 — H10.0](10-storybook-testing.md).

### Cierre de T2.8 (2026-09-02)

`turbo run lint` ya pasa **en los cuatro paquetes**. El fallo que quedaba anotado no era del
recorte: era el `prettier --check .` que vivía dentro del script `lint` de `packages/ui` y que,
al ejecutarse desde ese directorio, no veía el `.prettierignore` de la raíz y chequeaba
`storybook-static/**`. La comprobación de formato pasa a `bun run format:ci` en la raíz y el
`lint` de cada paquete lintea, que es lo suyo (ver [11](11-tooling-ci-calidad.md), T11.3).
