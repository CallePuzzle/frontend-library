# ADR 0002 — La librería es solo Svelte; recorte del alcance del monorepo

- **Fecha:** 2026-09-02
- **Estado:** aceptado
- **Contexto del plan:** [02 — Recortar el alcance del monorepo](../plans/02-alcance-monorepo.md)

## Contexto

El repo salió de `create-turbo` y arrastraba la plantilla entera. De 7 paquetes y 2 demos, 4
paquetes y 1 demo no tenían código propio ni consumidores, pero sí coste: dependencias, tiempo
de CI, superficie de lint y ruido al leer el repo.

## Decisión

Se elimina todo lo que no es Svelte y no tiene consumidor:

| Eliminado                  | Motivo                                                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/react-ui`        | Los `button.tsx`/`card.tsx`/`code.tsx` eran literalmente la plantilla de `create-turbo`, y `src/stories/` las stories de ejemplo de `storybook init`. Cero código propio, cero consumidores.                                             |
| `demos/astro`              | Plantilla de `create astro` intacta: `astro.config.mjs` vacío, sin `@astrojs/react`, y no importaba nada de la librería.                                                                                                                 |
| `packages/database`        | Prisma + Turso no es código de front. Los consumidores reales usan PostgreSQL con su propio esquema y nunca iban a instalarlo. Además tenía la dependencia invertida (`better-auth:generate` apuntaba al demo).                          |
| `packages/eslint-config`   | Configs de Next.js/React (`@next/eslint-plugin-next`, `eslint-plugin-react`). Ningún paquete Svelte la usaba, y sus dos consumidores declarados (`database` y `library`) extendían `@repo/eslint-config/library.js`, que **no existía**. |
| `packages/tailwind-config` | Dos líneas de CSS y un `postcss.config.js` que nadie importaba, en el formato equivocado (`export const` en vez de `export default`). Absorbido en `@callepuzzle/svelte-ui`.                                                             |

Resultado: **3 paquetes publicables + 1 interno + 1 demo**.

### Dónde acabó cada cosa

- **Estilos.** `shared-styles.css` es ahora `packages/ui/src/styles/index.css`, publicado como
  `@callepuzzle/svelte-ui/styles.css`. Declara el `@source` que apunta al propio paquete, porque
  Tailwind 4 no escanea `node_modules`: sin él las clases de los componentes de la librería no se
  generan en la app. `tailwindcss` y `daisyui` pasan a `peerDependencies` de `ui`, ya que la hoja
  hace `@import "tailwindcss"` y `@plugin "daisyui"`.
- **Base de datos.** `prisma/` (esquema + migraciones) se mueve a `demos/sveltekit/prisma/`, que
  es quien necesita un cliente. `demos/sveltekit/src/lib/server/db.ts` crea su propio
  `PrismaClient` con la URL **por entorno** (`LIBSQL_URL`), no hardcodeada; ver `.env.example`.
  El esquema del demo es la referencia del esquema de better-auth: no se guarda una copia
  aparte en `docs/` para que no se quede desfasada.
- **`better-auth:generate`.** Vivía en `packages/database` apuntando con `--config
../../demos/sveltekit/...`. Ahora es un script del propio demo.
- **Scripts de base de datos.** Fuera del `package.json` del root y de `turbo.json`: son del
  demo, no del monorepo. Se lanzan desde `demos/sveltekit` o con `--filter=sveltekit`.
- **Lint.** Al no existir ya `@repo/eslint-config`, se quita el script `lint` de `core` y `auth`:
  **nunca funcionó**, porque esos paquetes no tenían fichero de configuración de ESLint
  (hallazgo H11.3). El lint del repo se unifica en [11](../plans/11-tooling-ci-calidad.md), donde
  además hay que decidir entre ESLint y oxlint (lo que ya usan los otros dos repos del equipo).
  Dejarlo declarado y roto era peor que no tenerlo.
- **`check-types`.** La task estaba en `turbo.json` pero solo la implementaba `react-ui`
  (hallazgo H11.4). `core` y `auth` ganan `tsc --noEmit`, así que ahora comprueba algo.

## Si React vuelve

El camino no es un `react-ui` paralelo que duplica los componentes, sino apoyarse en el corte
que ya existe:

- `@callepuzzle/core` — tipos y rutas, ya framework-agnóstico y sin dependencias de runtime.
- `@callepuzzle/auth` — better-auth es agnóstico salvo el subpath `/svelte` del cliente.
- y solo entonces un `@callepuzzle/react-ui` que consuma ambos.

Es el corte que hicimos en [ADR 0001](0001-distribucion.md), así que la puerta queda abierta sin
coste de mantenimiento.

## Consecuencias

- El demo necesita `prisma generate` antes de compilar; va incluido en sus scripts `dev` y
  `build`, así que `turbo run build` funciona en un clon limpio.
- Un consumidor de `@callepuzzle/svelte-ui` tiene que instalar `tailwindcss` y `daisyui`
  (peers) e importar `@callepuzzle/svelte-ui/styles.css`.
