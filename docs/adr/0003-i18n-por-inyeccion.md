# ADR 0003 — La librería no compila i18n: los textos entran por props

- **Fecha:** 2026-09-02
- **Estado:** aceptado
- **Contexto del plan:** [04 — i18n: sacar Paraglide de dentro de la librería](../plans/04-i18n.md)

## Contexto

Antes de este refactor había **tres proyectos Paraglide independientes** en el repo, cada uno
con su `project.inlang/`, sus `messages/*.json` y su runtime compilado:

| Proyecto                | `locales` declarados                                                  | Salida              |
| ----------------------- | --------------------------------------------------------------------- | ------------------- |
| `packages/library`      | `["en", "de"]` (sin `messages/de.json`, y con `es.json` sin compilar) | `src/paraglide`     |
| `packages/sveltekit-ui` | `["en", "es"]`                                                        | `src/paraglide`     |
| `demos/sveltekit`       | `["en", "es"]`                                                        | `src/lib/paraglide` |

Cada runtime tiene su propio `getLocale`/`setLocale` y **su propio estado de locale**. De ahí
salieron cuatro defectos reales, no hipotéticos:

- **El idioma de la app no llegaba a los textos de la librería** (B8/H4.1). El demo importaba
  `setLocale` de `$lib/paraglide/runtime` —su runtime— y lo pasaba como prop a `<Header>`. Pero
  `Header` → `NavBarEnd` → `FormLogin` pintaban sus textos con `m.form_login_sign_in()` del
  runtime de `packages/sveltekit-ui`. Llamar a `setLocale('es')` traducía la app y **dejaba la
  librería en inglés**. El `paraglideMiddleware` de `hooks.server.ts` tampoco ayudaba: solo
  conoce el runtime del demo.
- **Locale congelado para todo el proceso** (B9/H4.3). `packages/library/src/routes.ts` hacía
  `name: m.routes_home()` en el objeto `routes` de **scope de módulo**. En SSR un módulo se
  evalúa una vez por proceso, no por request: el primer locale que se resolviera ganaba para
  siempre y para todos los usuarios que atendiera ese servidor. En `donde-esta-tu-local` el
  mismo patrón es inocuo porque solo tiene un locale (`es`); en una librería multi-locale no lo
  es.
- **Copy de producto imposible de sobreescribir** (H4.4). `messages/en.json` de la librería
  contenía `form_login_magic_link_sent`, `schema_login_email_describe`, `form_login_sign_in`…
  Eso es copy de producto: cada consumidor quiere su tono, su marca y su idioma, y no había
  forma de cambiarlo sin forkear. El `es.json` de la librería llevaba además una errata
  (`"Iniciar sessión"`, doble s) que nadie podía corregir desde fuera.
- **`Locale` hardcodeado** (H4.5). `export type Locale = 'en' | 'es'` en `utils.ts`, y
  `NavBarEnd` tipaba `locales?: Locale[]`. Un consumidor con `['es']` o con `['es', 'gl']` no
  encajaba, y el `Locale` del runtime del consumidor es nominalmente incompatible con el de la
  librería aunque las cadenas coincidan.

## Decisión

**La librería no compila i18n.** No hay `project.inlang/`, ni `messages/`, ni
`paraglide-js compile` en ningún `packages/*`. Los textos visibles entran por props, con
**defaults en inglés**, y el consumidor los resuelve **en render** con el runtime de i18n que
prefiera (Paraglide, `@bitban/i18n`, un objeto a mano).

Es la opción A del plan 04.

### Patrón `*.strings.ts`

Cada componente con texto visible tiene un fichero hermano con el tipo del diccionario y su
valor por defecto:

```ts
// packages/ui/src/components/Modal.strings.ts
import { commonStrings } from '../strings/common.js';

export type ModalStrings = {
	/** Etiqueta del botón que cierra el diálogo (tipos `button` y `outside`). */
	close: string;
};

export const defaultModalStrings: ModalStrings = {
	close: commonStrings.close
};
```

Y el componente combina defaults con lo que reciba, **con `$derived`**:

```svelte
<script lang="ts">
	import { defaultModalStrings, type ModalStrings } from './Modal.strings.js';

	type Props = { strings?: Partial<ModalStrings> /* … */ };

	let { strings, ...rest }: Props = $props();

	const t = $derived({ ...defaultModalStrings, ...strings });
</script>
```

`$derived` y no `const`: si el consumidor cambia de idioma en caliente, `strings` cambia y el
texto tiene que repintarse. La misma razón por la que `NavBarList` hace
`$derived(getMenuRoutes(routes))` en vez de calcular el menú una vez.

Detalles del contrato:

- La prop es `strings?: Partial<XStrings>`: se sobreescribe **solo lo que interese**
  (`strings={{ close: m.common_close() }}`), no el diccionario entero.
- Los tipos `*Strings` y los `default*Strings` se **exportan** desde el barrel. El tipo hace de
  checklist: cuando la librería añade una clave, el `tsc` del consumidor le enseña que hay copy
  nuevo que decidir.
- Los textos repetidos viven en `packages/ui/src/strings/common.ts` (`close`, `back`, `menu`,
  `required`, `optional`, `signIn`, `signOut`, `openSidebar`, `closeSidebar`, `search`,
  `notifications`, `language`, `profile`, `avatarAlt`) y los `*.strings.ts` de cada componente
  los reutilizan como default. Un consumidor puede traducir `commonStrings` una vez y repartirlo.
- Lo que necesita interpolación es una **función**, no una plantilla:
  `avatarAlt: (name: string) => string`. Así el consumidor decide el orden de las palabras, que
  es justo lo que cambia entre idiomas.
- No hay `type Locale`. Donde hace falta hablar de idiomas se usa `locales?: readonly string[]`
  y `setLocale?: (locale: string) => void` (`NavBarEnd`). El componente no valida la lista: la
  fuente de verdad es el runtime del consumidor.
- Lo mismo se aplica a los **schemas**: `@callepuzzle/core/schema` no exporta un `loginSchema`
  con textos compilados, sino `createLoginSchema(strings?)`. Un schema en scope de módulo con
  mensajes ya resueltos es el mismo bug de H4.3 con otro disfraz.

### Regla dura

**Nunca resuelvas un mensaje en scope de módulo.** Ni en la librería ni en el consumidor. Es
la regla 5 del ADR de i18n de `bitban/monorepo`
(`docs/adr/0001-i18n-custom-package.md`), que llega a la misma conclusión desde un problema
distinto (multitenancy: varios tenants con locales distintos servidos por un solo proceso Node,
resuelto con `AsyncLocalStorage`). El corolario práctico para un consumidor de esta librería es
que su `RouteMap` tiene que ser una **función** o un `$derived`, no un `const` de módulo:

```ts
// mal: `label` se congela con el primer locale del proceso
export const routes: RouteMap<RouteId> = { '/': { label: m.routes_home() } };

// bien: se resuelve en cada render
export function getRoutes(): RouteMap<RouteId> {
	return { '/': { label: m.routes_home() } };
}
```

## Alternativas descartadas

- **Un `Context` único con proveedor** (`setStringsContext()` en el layout, `getStringsContext()`
  en cada componente). Menos ruido en las llamadas: se declara el diccionario una vez arriba.
  Descartada porque el contexto de Svelte solo existe durante la inicialización del componente,
  así que hay que envolver la app en un proveedor —justo el acoplamiento que se le acaba de
  quitar al `Header` (ver [ADR 0004](0004-daisyui-como-contrato.md) y el plan 07)—, y porque un
  componente usado fuera del proveedor falla en tiempo de ejecución en vez de en el `tsc`. Las
  props hacen visible en el punto de uso qué textos gobierna quién, y se prestan mejor a
  Storybook y a los tests. Nada impide que un consumidor se monte su propio contexto y lo
  reparta a las props: es una capa suya, no de la librería.
- **Mantener Paraglide en la librería y reexportar el runtime de la app.** Es decir, que la
  librería importe `m` de un módulo virtual que el consumidor rellena (alias de Vite, o un
  `paraglide` como peer). Descartada porque obliga al consumidor a usar Paraglide y a tener
  exactamente las claves que la librería espera (`form_login_sign_in`, …), sigue sin resolver
  H4.4 —el copy es de producto— y ata la librería a un bundler concreto. Además
  `@inlang/paraglide-js` era `dependency` de `packages/library` y se bundleaba con tsup sin
  estar en `external`: sacarlo ahorra peso y una dependencia de tooling en cada consumidor.
- **Traducir la librería a los idiomas de los consumidores actuales** (`es` + `en`). Es la
  opción que parece más cómoda hoy —los dos consumidores hablan español— y la que hace que el
  problema vuelva con el tercero. Y no arregla ni H4.1 ni H4.3.

## Consecuencias

- Un consumidor que no pase `strings` ve la interfaz **en inglés**, con textos correctos y
  accesibles. No hay pantallas a medio traducir ni cadenas vacías.
- Traducir la librería es trabajo del consumidor y se hace una vez, en el punto donde monta el
  componente. Es más verboso que `m.clave()` dentro de la librería, y es el precio de que el
  locale sea uno solo.
- `@inlang/paraglide-js` desaparece de las dependencias de los tres paquetes publicables.
- Los tests y las stories no necesitan runtime de i18n: pasan `strings` a mano o se quedan con
  los defaults.
- Cómo se inyectan los textos con Paraglide, con el ejemplo completo, está en
  [`docs/i18n.md`](../i18n.md).
