# 08 — Estilos, Tailwind 4 y theming

**Prioridad: media-alta.** Hoy funciona por accidente en el demo y no funcionaría fuera de él.

## Contexto

Todos los componentes usan clases de **daisyUI 5** (`btn`, `navbar`, `drawer`, `modal`,
`fieldset`, `input`, `alert`, `menu`, `dropdown`…) sobre **Tailwind CSS 4**. No hay ni un
`<style>` en ningún `.svelte`: el estilo es 100% clases de utilidad.

Eso implica que **el CSS lo genera el consumidor**, no la librería. Tailwind 4 solo emite las
clases que encuentra escaneando ficheros, y por defecto **no escanea `node_modules`**.

## Hallazgos

### H8.1 — El `@source` del demo no es replicable fuera del monorepo

`demos/sveltekit/src/app.css`:

```css
@import 'tailwindcss';
@source "../../../packages/sveltekit-ui";
@import '@repo/tailwind-config';
@plugin "daisyui";
```

`../../../packages/sveltekit-ui` es una ruta relativa **dentro del monorepo**. Un consumidor
externo necesita `@source "../node_modules/@callepuzzle/svelte-ui/dist";` — que es lo que
`y-tu-que-compras` intuyó (`@source "../node_modules/storybook-svelte";`), pero con el nombre
viejo del paquete y apuntando a la raíz del paquete en vez de a `dist`.

Nada de esto está documentado. Sin ese `@source`, la librería se instala, compila, renderiza…
**y sale sin estilos**. Es el fallo de integración más probable.

### H8.2 — Orden de `@import` incorrecto

En el demo, `@source` va **antes** de `@import "@repo/tailwind-config"`, que a su vez hace otro
`@import "tailwindcss"`. Doble import de Tailwind y un `@plugin "daisyui"` duplicado (uno en
`tailwind-config/shared-styles.css`, otro en el `app.css` del demo). Funciona por tolerancia,
pero es frágil.

### H8.3 — La librería no distribuye CSS propio

No hay ningún export de estilos en `packages/sveltekit-ui/package.json`. Si algún día un
componente necesita una regla que no sea una utilidad de Tailwind (una animación, un
`@keyframes`, un `:global`), no hay dónde ponerla.

Comparar con `@bitban/ui`, que exporta `"./index.css": "./src/styles/index.css"` y declara
`"sideEffects": ["**/*.css"]`.

### H8.4 — daisyUI como dependencia implícita y no declarada

`daisyui` está en `devDependencies` de `packages/sveltekit-ui`, pero **todos los componentes
publicados dependen de sus clases en runtime**. Un consumidor sin daisyUI instalado y sin
`@plugin "daisyui"` obtiene HTML sin estilo. Debe ser **peerDependency** y estar documentado.

Lo mismo con `tailwindcss` (hoy solo devDependency).

### H8.5 — Sin sistema de tema ni tokens

No hay tema, ni variables, ni forma de que un consumidor cambie colores más allá de configurar
daisyUI por su cuenta. Los componentes hardcodean nombres de tema de daisyUI:
`bg-base-300`, `bg-base-100`, `btn-accent`, `alert-success`, `alert-error`, `badge-primary`,
`bg-neutral`.

Eso es razonable **si** se asume daisyUI como contrato. Hay que decidirlo explícitamente:

- **Opción A (recomendada, barata): daisyUI es el contrato.** La librería declara
  `daisyui` + `tailwindcss` como peers, documenta que el consumidor debe activar el plugin, y
  usa solo clases semánticas de daisyUI (`base-*`, `primary`, `accent`…). El theming se hace con
  los temas de daisyUI, que ya es lo que hacen ambos consumidores (`donde-esta-tu-local` usa el
  tema `dark`).
- **Opción B: tokens propios.** Como `@bitban/ui`: design tokens con style-dictionary,
  `tailwind-variants` + `cn()`, y `setComponentTheme()` para que la app sobreescriba variantes.
  Mucho más potente y mucho más caro. Solo tiene sentido si aparecen varios productos con
  identidades visuales distintas.

Sea cual sea, hay que escribirlo. Hoy la decisión está tomada de facto (daisyUI) pero sin
declararla ni protegerla.

### H8.6 — Sin `cn()` ni gestión de conflictos de clase

En cuanto se añada `class` como prop (ver [07](07-componentes-api.md), T7.9), hará falta resolver
conflictos: `cn('btn btn-accent', props.class)` con `clsx` + `tailwind-merge`. Sin ello,
`class="btn-primary"` no gana a `btn-accent` de forma predecible.

### H8.7 — Storybook importa el CSS por ruta relativa fuera del paquete

`packages/sveltekit-ui/.storybook/preview.ts`:

```ts
import '../../tailwind-config/shared-styles.css';
```

Sale del paquete por `..`. Se rompe al absorber `tailwind-config` (ver
[02](02-alcance-monorepo.md), T2.6). Debe importar el CSS propio del paquete.

Además, `packages/sveltekit-ui/vite.config.ts` sí carga `@tailwindcss/vite`, pero **no hay
ningún `@source`** que le diga a Tailwind que escanee `src/components`. En Storybook las clases
salen porque el fichero importado hace `@import "tailwindcss"` y Tailwind 4 escanea por defecto
el directorio del proyecto — otro comportamiento accidental.

### H8.8 — `postcss.config.js` de `tailwind-config` es inservible

```js
export const postcssConfig = { plugins: { '@tailwindcss/postcss': {} } };
```

Export **nombrado**; PostCSS espera `export default`. Y el paquete lo expone como
`"./postcss": "./postcss.config.js"`. Nadie lo importa. Con Tailwind 4 + `@tailwindcss/vite`
no hace falta PostCSS en absoluto.

## Propuesta

1. Absorber `tailwind-config` dentro de `packages/ui` como `src/styles/index.css`.
2. Exportar `"./styles.css"` desde el paquete, aunque de momento contenga poco.
3. Declarar `tailwindcss` y `daisyui` como **peerDependencies**.
4. Documentar el bloque de integración exacto que el consumidor debe pegar en su `app.css`:

```css
@import 'tailwindcss';
@plugin 'daisyui';
@source '../node_modules/@callepuzzle/svelte-ui/dist';
@import '@callepuzzle/svelte-ui/styles.css';
```

5. Añadir `cn()` (clsx + tailwind-merge) en `packages/core` o en `ui/src/lib/utils.ts`.
6. Escribir un ADR con la decisión "daisyUI es el contrato de estilo" (opción A) y la vía de
   escape si algún día hace falta la opción B.

### Alternativa a considerar: CSS precompilado

Si el `@source` demuestra ser una fuente constante de problemas de integración, la salida es
**precompilar** el CSS de la librería (un `dist/styles.css` con solo las clases que usan sus
componentes, generado en el build con un Tailwind propio) y que el consumidor solo lo importe.
Coste: duplica utilidades con las del consumidor y complica el theming. No recomendado de
entrada, pero anotarlo.

## Tareas

- [x] **T8.1** ADR `docs/adr/0004-daisyui-como-contrato.md`.
- [x] **T8.2** Mover `shared-styles.css` a `packages/ui/src/styles/index.css`; borrar
      `packages/tailwind-config` y su `postcss.config.js` inservible.
- [x] **T8.3** Añadir `"./styles.css"` a `exports` y `"sideEffects": ["**/*.css"]`.
- [x] **T8.4** Mover `tailwindcss` y `daisyui` a `peerDependencies` (manteniéndolas en dev).
- [x] **T8.5** Arreglar `demos/sveltekit/src/app.css`: un solo `@import "tailwindcss"`, un solo
      `@plugin "daisyui"`, y el `@source` apuntando a `node_modules` para que el demo **demuestre
      la integración real** de un consumidor externo.
- [x] **T8.6** Arreglar `.storybook/preview.ts` para importar el CSS del propio paquete, con un
      `@source './../src'` explícito.
- [x] **T8.7** Añadir `cn()` y usarlo en todos los componentes junto con la prop `class`
      (depende de [07](07-componentes-api.md), T7.9).
- [x] **T8.8** Documentar en el README la sección "Instalación de estilos" con el bloque exacto.
- [x] **T8.9** Test de integración: un proyecto SvelteKit mínimo fuera del monorepo que instale
      el tarball y verifique que el `Header` sale con estilos (puede ser un snapshot de Playwright).

## Criterios de aceptación

- Un consumidor nuevo, siguiendo solo el README, obtiene los componentes con estilo a la primera.
- El demo usa la misma configuración que un consumidor externo (nada de rutas `../../../packages`).
- `class="..."` en cualquier componente sobreescribe de forma predecible.

## Estado (2026-09-02)

Implementado con la **opción A**: daisyUI 5 sobre Tailwind 4 es el contrato, declarado en
`docs/adr/0004-daisyui-como-contrato.md`.

- `tailwind-config` ya se absorbió en `packages/ui/src/styles/index.css` (fase 0, ver
  [02](02-alcance-monorepo.md)), con su `postcss.config.js` inservible borrado.
- La hoja se publica como `@callepuzzle/svelte-ui/styles.css`, con `sideEffects: ["**/*.css"]`.
- `tailwindcss` y `daisyui` son `peerDependencies`.
- `cn()` (clsx + tailwind-merge) vive en `packages/ui/src/utils.ts`, se exporta desde el barrel y
  lo usan los 19 componentes junto con la prop `class`.
- El `app.css` del demo es ya **exactamente** lo que pegaría un consumidor externo: sin rutas
  `../../../packages/…`.
- El README lleva la sección de instalación de estilos.

**Decisión clave, tomada en la fase 0 y confirmada aquí:** el `@source` vive **en la hoja de la
librería** (`@source "../"`, relativo a `dist/styles/`), no en el `app.css` del consumidor. Eso
elimina el fallo de integración más probable que describe H8.1: el consumidor no necesita saber
dónde está instalada la librería ni acertar con la ruta a `dist`.

`.storybook/preview.ts` importa la hoja del propio paquete (T8.6), así que lo que se ve en
Storybook es lo que ve el consumidor.

**T8.9 verificado, y con control negativo.** En un proyecto externo instalado por tarball, el CSS
del build pesa 100 448 bytes y contiene las clases de daisyUI de la librería (`navbar`, `btn`
×33, `modal` ×16, `fieldset`, `drawer`, `dock`…). Borrando el `@source "../"` de la hoja
instalada, el CSS baja a 46 481 bytes y `navbar` desaparece: queda demostrado que es **el
`@source` del paquete** lo que las genera, y no un efecto colateral del escaneo del proyecto
consumidor. Se hizo por `grep` en vez de con un snapshot de Playwright (el plan lo dejaba
abierto): es la misma garantía con mucha menos maquinaria.
