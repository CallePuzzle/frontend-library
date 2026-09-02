# 13 — Documentación

**Prioridad: media.** Una librería sin documentación de integración no se adopta; se copia y
pega, que es justo lo que ha pasado con `donde-esta-tu-local`.

## Hallazgos

### H13.1 — El README del root está obsoleto y tiene erratas

`README.md`:
- `bun run stoybook` (typo, el script es `storybook`).
- Documenta `react-ui` y el demo de Astro, que se eliminan ([02](02-alcance-monorepo.md)).
- Manda ejecutar `bunx @inlang/paraglide-js compile …` a mano, cosa que ya hace el script
  `build`.
- Documenta `turso dev --db-file dev.db` y `bun run db:migrate:dev`, que dependen del paquete
  `database` que se elimina.
- Mezcla castellano e inglés ("Libraría para crear apps frontend").
- **No dice en ningún sitio cómo consumir la librería desde una app externa** — que es su
  propósito entero.

### H13.2 — El README de `sveltekit-ui` es un cuaderno de notas

`packages/sveltekit-ui/README.md` contiene:
- salida de consola pegada de un `bun link` (`Success! Registered "storybook-svelte"`) con el
  nombre de paquete antiguo;
- comandos de `prisma migrate diff` y `turso db shell`, que no tienen nada que ver con un
  paquete de UI;
- ninguna referencia a los componentes que exporta.

### H13.3 — No hay `AGENTS.md` / `CLAUDE.md`

Los otros dos repos del equipo sí lo tienen, y el de `donde-esta-tu-local` es notablemente bueno
(stack, comandos, estructura, convenciones, decisiones conscientes con su porqué). Este repo no
tiene nada, así que cualquier agente —o persona nueva— empieza a ciegas.

### H13.4 — No hay ADRs

`bitban/monorepo` tiene `docs/adr/` con decisiones argumentadas (i18n propio, safelist de
variantes responsive) y `docs/rfc/`. Aquí las decisiones importantes (por qué Paraglide dentro
de la librería, por qué el singleton de auth, por qué react-ui) no están escritas en ningún
sitio — y por eso ha costado tanto reconstruir la intención al revisar.

### H13.5 — No hay documentación de componentes

`tags: ["autodocs"]` está en las stories, así que Storybook genera fichas automáticas. Pero:
- no hay ningún `.mdx` de introducción, guía de instalación ni de theming;
- el único `.mdx` del repo es `packages/react-ui/src/stories/Configure.mdx`, la plantilla de
  Storybook, en el paquete que se borra;
- el Storybook no está publicado en ningún sitio.

### H13.6 — Los ejemplos del demo no sirven de documentación

`demos/sveltekit/src/routes/+page.svelte` es la página de bienvenida por defecto de SvelteKit.
`admin/+page.svelte` está vacío. El `+layout.svelte` tiene código comentado
(`// setLocale("es");`) y un bloque de enlaces de idioma con `style="display:none"` — un truco
para que Paraglide detecte los `href` localizados, sin explicación de por qué está ahí.
Y el título es `"NavNar Title"` (typo, copiado también a `y-tu-que-compras`).

## Estructura de documentación propuesta

```
README.md                      → qué es, instalación en 10 líneas, enlace al Storybook
AGENTS.md                      → guía para agentes/nuevos (modelo: donde-esta-tu-local)
LICENSE
docs/
  instalacion.md               → paso a paso completo, incluido el @source de Tailwind
  componentes.md               → índice y contrato de cada componente (o solo Storybook)
  i18n.md                      → cómo inyectar los strings
  auth.md                      → cómo montar better-auth con la librería
  migracion.md                 → mapeo viejo→nuevo por versión
  adr/
    0001-distribucion.md
    0002-solo-svelte.md
    0003-i18n-por-inyeccion.md
    0004-daisyui-como-contrato.md
  plans/                       → estos documentos
```

### Contenido mínimo de `README.md`

1. Qué es y qué no es (librería de UI Svelte 5 + auth para apps CallePuzzle).
2. Requisitos (Node, SvelteKit 2, Svelte 5, Tailwind 4, daisyUI 5).
3. Instalación: `bun add`, el bloque de `app.css`, el `hooks.server.ts`.
4. Ejemplo mínimo funcionando (`Header` + `routes`).
5. Enlace al Storybook publicado.
6. Cómo desarrollar en el monorepo (bun, turbo, storybook, changesets).

### Contenido mínimo de `AGENTS.md`

Siguiendo el modelo de `donde-esta-tu-local/AGENTS.md`, que funciona bien:
descripción, stack, comandos, estructura del código, convenciones (idioma de comentarios,
formato, Svelte 5 runes, i18n, dependencias peer vs dep), y **decisiones conscientes con su
razón** — el apartado que más valor tiene y del que este repo no tiene nada.

## Tareas

- [ ] **T13.1** Reescribir `README.md` del root según la estructura de arriba. Corregir
  `stoybook`.
- [ ] **T13.2** Reescribir `packages/ui/README.md`: solo qué exporta y cómo se usa. Borrar todo
  lo de Prisma/Turso/bun link.
- [ ] **T13.3** Escribir `AGENTS.md` (y symlink/copia `CLAUDE.md` si se usa Claude Code).
- [ ] **T13.4** Escribir los cuatro ADRs referenciados en estos planes:
  `0001-distribucion`, `0002-solo-svelte`, `0003-i18n-por-inyeccion`,
  `0004-daisyui-como-contrato`.
- [ ] **T13.5** `docs/instalacion.md` con el flujo completo verificado desde un proyecto vacío.
- [ ] **T13.6** `docs/migracion.md` con el mapeo de símbolos para los dos consumidores (ver
  [12](12-convergencia-consumidores.md), T12.13).
- [ ] **T13.7** Un `.mdx` de bienvenida en Storybook (instalación, theming, convenciones de
  props) y publicar el Storybook (Chromatic ya está como dependencia sin configurar, o páginas
  estáticas en CI).
- [ ] **T13.8** Limpiar el demo para que sea documentación ejecutable: home con ejemplos reales
  de cada componente, sin código comentado, sin `"NavNar Title"`, con el truco de los enlaces
  de idioma explicado en un comentario.
- [ ] **T13.9** `LICENSE` y campo `license` en los `package.json` publicables.
- [ ] **T13.10** `CHANGELOG.md` por paquete (lo genera Changesets automáticamente, ver
  [01](01-estrategia-distribucion.md)).

## Criterios de aceptación

- Alguien ajeno al equipo puede instalar y usar la librería siguiendo solo el README.
- Cada decisión estructural del repo tiene un ADR que explica el porqué y las alternativas
  descartadas.
- El Storybook publicado es la referencia de componentes, y está enlazado desde el README.
