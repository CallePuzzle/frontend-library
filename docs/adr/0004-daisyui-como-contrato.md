# ADR 0004 — daisyUI 5 sobre Tailwind 4 es el contrato de estilo

- **Fecha:** 2026-09-02
- **Estado:** aceptado
- **Contexto del plan:** [08 — Estilos, Tailwind 4 y theming](../plans/08-estilos-theming.md)

## Contexto

No hay ni un bloque `<style>` en ningún componente de `@callepuzzle/svelte-ui`: el estilo es
100% clases de utilidad de **Tailwind 4** y clases semánticas de **daisyUI 5** (`navbar`,
`drawer`, `modal`, `dock`, `menu`, `dropdown`, `btn`, `fieldset`, `input`, `alert`, `badge`,
`avatar`, `base-100`, `base-300`, `primary`, `accent`…).

Eso significa que **el CSS lo genera el consumidor**, no la librería: Tailwind 4 emite solo las
clases que encuentra escaneando ficheros. La decisión estaba tomada de facto pero no escrita ni
protegida, y eso producía fallos concretos:

- `daisyui` y `tailwindcss` estaban en `devDependencies` de `packages/sveltekit-ui`, aunque
  **todos** los componentes publicados dependen de sus clases en tiempo de ejecución (H8.4). Un
  consumidor sin daisyUI obtenía HTML sin estilo, sin ningún aviso.
- Tailwind 4 **no escanea `node_modules`**. Sin un `@source` que apunte al paquete, la librería
  se instala, compila, renderiza… y sale sin estilos (H8.1). Es el fallo de integración más
  probable, y ni estaba documentado ni había forma de que el consumidor lo adivinara:
  `y-tu-que-compras` lo intuyó (`@source "../node_modules/storybook-svelte"`) con el nombre de
  paquete viejo.
- El demo usaba `@source "../../../packages/sveltekit-ui"`, una ruta relativa **dentro del
  monorepo**: no demostraba la integración real de nadie.
- No había ningún export de CSS en el paquete (H8.3), así que no había sitio para una regla que
  no fuera una utilidad (una animación, un `@keyframes`, un `:global`).

## Decisión

**daisyUI 5 sobre Tailwind 4 es el contrato de estilo de la librería.** Opción A del plan 08.

### D1 — `tailwindcss` y `daisyui` son peerDependencies

`peerDependencies` de `@callepuzzle/svelte-ui`: `tailwindcss@^4.1.11` y `daisyui@^5.0.50` (más
`@lucide/svelte` para los iconos). Se mantienen también en `devDependencies` para Storybook y
los tests. No son `dependencies`: dos copias de Tailwind en un proyecto no tienen sentido, y la
configuración del tema es de la app.

### D2 — Los componentes usan solo clases semánticas

Nada de colores literales (`bg-slate-800`, `text-[#123456]`): solo los nombres de tema de
daisyUI (`base-100`, `base-200`, `base-300`, `primary`, `secondary`, `accent`, `neutral`,
`info`, `success`, `warning`, `error`) y sus componentes. Así un cambio de tema en la app
arrastra a la librería sin tocarla.

### D3 — El paquete publica su hoja de estilos, con el `@source` dentro

`packages/ui/src/styles/index.css` se publica como `@callepuzzle/svelte-ui/styles.css` y es
**todo lo que el consumidor tiene que importar**:

```css
@import 'tailwindcss';
@source "../";
@plugin "daisyui";
```

El `@source "../"` es relativo al fichero CSS, que en el paquete instalado vive en
`node_modules/@callepuzzle/svelte-ui/dist/styles/index.css`: apunta por tanto a `dist/`, el
directorio con los componentes compilados. Es la línea que hace que las clases de la librería
se generen, y **está dentro del paquete a propósito**: es la única forma de que el consumidor no
tenga que escribir una ruta a `node_modules` que se rompe con cada renombrado.

Con esto, el `app.css` de una app es una línea:

```css
@import '@callepuzzle/svelte-ui/styles.css';
```

Medido en un proyecto SvelteKit limpio con `@tailwindcss/vite`: con el `@source` de la librería
el CSS de producción sale con 99 kB y contiene `.navbar`, `.drawer`, `.dock`…; quitándolo baja a
29 kB y esas clases **desaparecen** (las utilidades propias de la app siguen saliendo, porque
esas sí las detecta Tailwind por su cuenta). Es exactamente el modo de fallo de H8.1, y es
silencioso: no hay error, solo HTML sin estilo.

`"sideEffects": ["**/*.css"]` en el `package.json`, para que ningún bundler se lleve la hoja por
delante al hacer tree shaking.

### D4 — El theming se hace con los temas de daisyUI

La app declara sus temas donde ya los declara, en su propio CSS:

```css
@import '@callepuzzle/svelte-ui/styles.css';
@plugin "daisyui/theme" {
	name: 'mimarca';
	default: true;
	--color-primary: oklch(55% 0.2 250);
}
```

Es lo que ya hacen los dos consumidores reales (`donde-esta-tu-local` usa el tema `dark`), y no
hace falta nada de la librería para que funcione.

### D5 — `class` + `cn()` como vía de escape por componente

Todo componente con raíz DOM acepta `class?: string` y compone su clase con `cn()`
(`clsx` + `tailwind-merge`, en `packages/ui/src/utils.ts`, exportado desde el barrel):

```ts
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
```

`tailwind-merge` es lo que hace la sobreescritura **predecible**: `cn('btn btn-accent', 'btn-primary')`
da `btn btn-primary`, no las dos clases peleándose por especificidad. Sin él, `class="btn-primary"`
en un componente que ya trae `btn-accent` depende del orden en la hoja generada.

## Alternativas descartadas

- **Tokens propios, como `@bitban/ui`**: design tokens con style-dictionary,
  `tailwind-variants` + `cn()`, y un registro `setComponentTheme()` para que la app sobreescriba
  las variantes de cada componente. Es más potente —desacopla la librería de daisyUI y permite
  varias identidades visuales sobre los mismos componentes— y **mucho más caro**: una pipeline
  de tokens, un catálogo de variantes que mantener por componente, y un mapa central de tipos
  para el registro (coste que el propio ADR de i18n de bitban cita como motivo para descartar un
  registro por nombre en su caso). Aquí hay **un** producto visual y dos apps que ya usan
  daisyUI: no habría nada que abstraer. Se revisará si aparece un segundo cliente con identidad
  propia; el corte no es traumático, porque las clases están concentradas en los componentes y
  `cn()` ya está en su sitio.
- **CSS precompilado**: generar en el build un `dist/styles.css` con solo las clases que usan
  los componentes, con un Tailwind propio de la librería, y que el consumidor lo importe sin
  `@source` ni plugin. Elimina de golpe el fallo de H8.1 y es la salida si el `@source` resulta
  ser una fuente constante de problemas de integración. No se elige de entrada porque:
  duplicaría utilidades con las del consumidor (dos definiciones de `.flex`, `.p-4`… con las
  suyas ganando o perdiendo según el orden de los `@import`); rompería el theming, ya que los
  colores quedarían resueltos contra el tema con el que se compiló la librería y no contra el de
  la app; y ataría cada release de la librería a una versión de daisyUI en vez de a un rango de
  peer. Queda anotada como plan B, y con el `@source` dentro del paquete el modo de fallo se ha
  reducido a "el consumidor no importa la hoja", que es evidente en cuanto se abre la página.
- **Dejar `daisyui` como `dependency`**: instalarla la librería. Descartada: el plugin se activa
  desde el CSS de la app y su configuración de temas es de la app, así que una copia propia solo
  serviría para tener dos versiones del plugin en el árbol.

## Consecuencias

- El consumidor **debe** instalar `tailwindcss` y `daisyui` e importar
  `@callepuzzle/svelte-ui/styles.css`. Es el único paso de integración que, si se olvida,
  produce una página fea en vez de un error: está en la primera sección de
  [`docs/instalacion.md`](../instalacion.md) por eso.
- La librería queda atada al rango de peer de daisyUI 5. Un daisyUI 6 con renombrado de clases
  es un breaking change de la librería, y se tratará como tal.
- Un consumidor que no quiera daisyUI no puede usar estos componentes. Es una decisión
  consciente: es lo que compra la brevedad de los componentes (cero CSS propio) y lo que hace
  que el theming sea gratis.
