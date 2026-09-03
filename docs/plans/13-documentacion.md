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

- [x] **T13.1** Reescribir `README.md` del root según la estructura de arriba. Corregir
      `stoybook`.
- [x] **T13.2** Reescribir `packages/ui/README.md`: solo qué exporta y cómo se usa. Borrar todo
      lo de Prisma/Turso/bun link.
- [x] **T13.3** Escribir `AGENTS.md` (y symlink/copia `CLAUDE.md` si se usa Claude Code).
- [x] **T13.4** Escribir los cuatro ADRs referenciados en estos planes:
      `0001-distribucion`, `0002-solo-svelte`, `0003-i18n-por-inyeccion`,
      `0004-daisyui-como-contrato`.
- [x] **T13.5** `docs/instalacion.md` con el flujo completo verificado desde un proyecto vacío.
- [x] **T13.6** `docs/migracion.md` con el mapeo de símbolos para los dos consumidores (ver
      [12](12-convergencia-consumidores.md), T12.13).
- [x] **T13.7** Un `.mdx` de bienvenida en Storybook (instalación, theming, convenciones de
      props) y publicar el Storybook (Chromatic ya está como dependencia sin configurar, o páginas
      estáticas en CI).
- [x] **T13.8** Limpiar el demo para que sea documentación ejecutable: home con ejemplos reales
      de cada componente, sin código comentado, sin `"NavNar Title"`, con el truco de los enlaces
      de idioma explicado en un comentario.
- [x] **T13.9** `LICENSE` y campo `license` en los `package.json` publicables.
- [~] **T13.10** `CHANGELOG.md` por paquete (lo genera Changesets automáticamente, ver
  [01](01-estrategia-distribucion.md)).

## Criterios de aceptación

- Alguien ajeno al equipo puede instalar y usar la librería siguiendo solo el README.
- Cada decisión estructural del repo tiene un ADR que explica el porqué y las alternativas
  descartadas.
- El Storybook publicado es la referencia de componentes, y está enlazado desde el README.

## Estado (2026-09-02)

Implementado. La estructura de documentación que propone el documento existe:

```
README.md                      qué es, requisitos, matriz de compatibilidad, instalación, ejemplo
AGENTS.md                      convenciones, trampas conocidas y decisiones conscientes
CLAUDE.md                      apunta a AGENTS.md
LICENSE                        MIT (CallePuzzle)
docs/instalacion.md            paso a paso desde un proyecto vacío, verificado con tarballs
docs/i18n.md                   inyección de textos, con el ejemplo de Paraglide del demo
docs/auth.md                   better-auth de principio a fin
docs/migracion.md              mapeo símbolo a símbolo para los dos consumidores
docs/adr/0001-distribucion.md
docs/adr/0002-solo-svelte.md
docs/adr/0003-i18n-por-inyeccion.md
docs/adr/0004-daisyui-como-contrato.md
docs/adr/0005-auth-por-factoria.md
packages/{core,auth,ui}/README.md
packages/typescript-config/README.md
packages/ui/src/stories/Welcome.mdx     página de bienvenida del Storybook
```

El README de la raíz se reescribió entero: ya no documenta `react-ui` ni el demo de Astro, ni
manda compilar Paraglide a mano, ni habla de `turso dev`; sí dice —por primera vez— **cómo
consumir la librería desde una app externa**, con el bloque exacto de `app.css` y la
autenticación contra GitHub Packages. Corregido `bun run stoybook` (C12).

**Un ADR más de los cuatro previstos:** `0005-auth-por-factoria.md`, porque la decisión de matar
el singleton y exigir la función de envío en los presets es tan estructural como las otras y no
tenía dónde vivir.

**Decisión no prevista:** la página de bienvenida de Storybook (T13.7) es un `.mdx`, y el parser
de markdown de prettier escapa los asteriscos de sus comentarios `{/* */}` y rompe el fichero.
Los `.mdx` están en `.prettierignore` por eso, con el motivo escrito.

**T13.10 queda parcial**: los `CHANGELOG.md` por paquete los genera Changesets, y el changeset de
la `0.1.0` está escrito y describe la superficie real del paquete; los ficheros aparecerán cuando
CI ejecute `changeset version` al mergear a `main`.
