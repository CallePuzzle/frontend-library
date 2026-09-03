# Revisión del repo `storybook-svelte` — resumen y hoja de ruta

Fecha de la revisión: 2026-08-31 · Rama: `monorepo` · Commit: `bc4ed2e`

## Qué es esto

Monorepo turborepo (bun) que pretende ser la **librería de front de CallePuzzle**, consumida
por apps SvelteKit externas. Estado actual:

| Paquete                      | Qué es                                                         | Veredicto                                |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `packages/sveltekit-ui`      | 8 componentes Svelte 5 + schemas + stories                     | **Núcleo real** de la librería           |
| `packages/library`           | `routes`, wrapper de better-auth, sender de email              | Núcleo real, mal nombrado y mal separado |
| `packages/react-ui`          | Plantilla de `create-turbo` + stories por defecto de Storybook | **Vacío**, cero código propio            |
| `packages/database`          | Prisma + libsql/Turso, esquema de better-auth                  | Fuera de sitio en una librería de front  |
| `packages/tailwind-config`   | 3 líneas de CSS                                                | Trivial, absorbible                      |
| `packages/typescript-config` | 3 tsconfig base                                                | OK                                       |
| `packages/eslint-config`     | Configs de **Next.js/React**                                   | Muerto para Svelte                       |
| `demos/sveltekit`            | App de demo                                                    | Útil, pero medio rota                    |
| `demos/astro`                | Plantilla `create astro` intacta                               | **No importa nada de la librería**       |

## Diagnóstico en una frase

La librería **no es consumible**: los paquetes se llaman `@repo/*`, son `version: 0.0.0`, se
resuelven con `workspace:*`, no hay registro, ni versionado, ni CI, ni publicación — y los dos
consumidores reales viven en repos separados. `y-tu-que-compras` ya está **roto** contra el
estado actual, y `donde-esta-tu-local` ha evolucionado por su cuenta hasta quedar 1-2 majors
por delante de la librería en casi todo.

## Los cinco bloqueantes

1. **Distribución** (→ [01](01-estrategia-distribucion.md)). Sin nombre público, versión ni
   publicación, ningún repo externo puede instalar esto. `y-tu-que-compras` aún importa de
   `storybook-svelte` (nombre que ya no existe) vía `link:`, con símbolos que ya no se exportan
   (`betterAuth` → `betterAuthHandle`).
2. **i18n roto por diseño** (→ [04](04-i18n.md)). Tres proyectos Paraglide independientes
   (`library`, `sveltekit-ui`, `demos/sveltekit`), cada uno con su runtime y su estado de
   locale. El idioma que fija la app **no llega** a los textos de la librería. Además
   `packages/library/src/routes.ts` llama a `m.routes_home()` en scope de módulo: el locale se
   congela en el import.
3. **Auth con fugas de estado entre requests** (→ [05](05-auth.md)).
   `packages/library/src/better-auth/client.ts:14` crea `useSession()` a nivel de módulo: un
   store compartido por todas las peticiones SSR. Y el cliente está casteado `as any`
   (`client.ts:10`), así que `AuthClient` y `Session` son `any` en toda la superficie pública.
4. **Deriva brutal con los consumidores** (→ [12](12-convergencia-consumidores.md)).
   `donde-esta-tu-local` tiene ya su propia copia mejorada de los 8 componentes, con zod v4,
   `resolve()`/`RouteId`, OTP en vez de magic link, genéricos en los formularios y correcciones
   de a11y. La librería es una foto vieja de ese código.
5. **Alcance inflado** (→ [02](02-alcance-monorepo.md)). react-ui, astro, database y
   eslint-config son ~40% de los paquetes y aportan 0. Mantenerlos cuesta CI, deps y ruido.

## Arquitectura objetivo propuesta

```
packages/
  core/          @callepuzzle/core        — tipos, routes, utilidades sin UI (framework-agnóstico)
  auth/          @callepuzzle/auth        — wrapper better-auth (subpaths /client, /server, /hooks)
  ui/            @callepuzzle/svelte-ui   — componentes Svelte 5 + estilos + Storybook
  typescript-config/                       — interno
demos/
  sveltekit/                               — app de referencia y banco de pruebas
```

- **Svelte primero.** React se descarta explícitamente (ver [02](02-alcance-monorepo.md)); si
  algún día vuelve, el paquete `core` ya es el trozo reutilizable.
- **Distribución por registro** (GitHub Packages o npm privado) con Changesets.
- **i18n por inyección**: la librería no compila Paraglide; recibe los textos de la app.
- **Auth por factoría**, no por singleton de módulo.

## Orden de ataque recomendado

Cada documento lleva sus tareas con checkboxes. Sugerencia de secuencia:

**Fase 0 — desbloquear (1-2 días)**

1. [02 — Recortar el alcance del monorepo](02-alcance-monorepo.md)
2. [01 — Estrategia de distribución y versionado](01-estrategia-distribucion.md)

**Fase 1 — arreglar los cimientos (3-5 días)** 3. [03 — Arquitectura y fronteras de paquetes](03-arquitectura-paquetes.md) 4. [04 — i18n: sacar Paraglide de la librería](04-i18n.md) 5. [05 — Auth: matar el singleton y recuperar los tipos](05-auth.md) 6. [06 — Rutas y navegación tipadas](06-routing-navegacion.md)

**Fase 2 — la librería en sí (5-8 días)** 7. [09 — Formularios y schemas (zod v4)](09-forms-schemas.md) 8. [07 — API de componentes y accesibilidad](07-componentes-api.md) 9. [08 — Estilos, Tailwind 4 y theming](08-estilos-theming.md)

**Fase 3 — que no se rompa (3-4 días)** 10. [10 — Storybook y tests](10-storybook-testing.md) 11. [11 — Tooling, calidad y CI](11-tooling-ci-calidad.md)

**Fase 4 — cobrar el beneficio** 12. [12 — Convergencia con los consumidores](12-convergencia-consumidores.md) 13. [13 — Documentación](13-documentacion.md)

## Apéndice

- [A1 — Catálogo completo de defectos encontrados](A1-catalogo-defectos.md) — la lista cruda,
  con fichero y línea, por si prefieres atacarla como backlog plano.

---

## Estado de la hoja de ruta (2026-09-02)

Las cuatro fases están implementadas en la rama `monorepo-v2`. Cada documento lleva al final su
propia sección **Estado** con lo que se hizo, las decisiones que se tomaron sobre la marcha y lo
que quedó fuera.

| Fase                    | Documentos                                                                                            | Estado                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 0 — desbloquear         | [02](02-alcance-monorepo.md), [01](01-estrategia-distribucion.md)                                     | ✅                                                    |
| 1 — cimientos           | [03](03-arquitectura-paquetes.md), [04](04-i18n.md), [05](05-auth.md), [06](06-routing-navegacion.md) | ✅                                                    |
| 2 — la librería         | [09](09-forms-schemas.md), [07](07-componentes-api.md), [08](08-estilos-theming.md)                   | ✅                                                    |
| 3 — que no se rompa     | [10](10-storybook-testing.md), [11](11-tooling-ci-calidad.md)                                         | ✅                                                    |
| 4 — cobrar el beneficio | [12](12-convergencia-consumidores.md), [13](13-documentacion.md)                                      | ✅ en este repo; la migración de los consumidores, no |

Los cinco bloqueantes del diagnóstico, uno a uno:

1. **Distribución** — tres paquetes con scope `@callepuzzle`, `publishConfig`, `files`,
   Changesets y CI de publicación. `publint` limpio y `attw` todo 🟢, verificado además desde un
   proyecto externo instalado por tarball.
2. **i18n** — Paraglide sale de la librería: los textos entran por props con defaults en inglés.
   `grep -r "paraglide" packages/` no devuelve nada, y un E2E del demo asegura que el idioma que
   fija la app llega a los textos de la librería.
3. **Auth** — muerto el singleton de `useSession()`; cliente por factoría, tipos reales de
   better-auth, presets con envío obligatorio y sesión por request. Con test de aislamiento.
4. **Deriva con los consumidores** — el código bueno de `donde-esta-tu-local` está promovido y
   generalizado (19 componentes, cinco de ellos nuevos), con la guía de migración escrita. Migrar
   los dos repos consumidores queda pendiente y es trabajo en esos repos.
5. **Alcance** — de 7 paquetes + 2 demos a 3 paquetes publicables + 1 interno + 1 demo.

Lo que queda, y por qué:

- **Migrar `y-tu-que-compras` y `donde-esta-tu-local`** ([12](12-convergencia-consumidores.md),
  T12.9-T12.12): son otros repos git.
- **Subir el toolchain a vite 8 / vitest 4 / prisma 7**: se deja como tanda aparte a propósito,
  para no mezclarlo con este refactor. Los peers ya cubren ambos extremos.
- **Publicar el Storybook en una URL** ([10](10-storybook-testing.md), T10.10): falta decidir
  entre Chromatic y GitHub Pages.
- **Cortar la `0.1.0` de verdad** ([01](01-estrategia-distribucion.md)): el changeset está
  escrito, pero `main` y esta rama tienen historias git no relacionadas, así que hasta que la
  rama se promocione a `main` ni `changeset status` calcula el diff ni se dispara el workflow de
  release.
- **El commit de reformateo** ([11](11-tooling-ci-calidad.md), T11.2), que debe ir solo.
