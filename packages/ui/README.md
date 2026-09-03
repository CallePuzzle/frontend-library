# @callepuzzle/svelte-ui

Componentes **Svelte 5** para las apps SvelteKit de CallePuzzle: navbar, cajón lateral, dock
móvil, modal, pie, campos de formulario derivados de un schema de zod, y los dos flujos de login
de better-auth.

- Estilo: **daisyUI 5 sobre Tailwind 4**, sin una línea de CSS propio.
- Textos: **por props**, con defaults en inglés. La librería no compila i18n.
- Sesión: **por props**, como dato plano. La librería no tiene stores.

## Instalación

Se publica en GitHub Packages, que exige autenticación incluso para paquetes públicos. En el repo
consumidor, un `.npmrc`:

```
@callepuzzle:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

con `NPM_TOKEN` = PAT con scope `read:packages`. Después:

```sh
bun add @callepuzzle/svelte-ui
bun add -D tailwindcss @tailwindcss/vite daisyui
bun add @lucide/svelte sveltekit-superforms formsnap zod
bun add bits-ui   # solo para el subpath ./otp
```

Y en tu CSS, **una línea** (trae Tailwind, daisyUI y el `@source` que hace que Tailwind escanee
el paquete instalado; sin ella los componentes salen sin estilo y sin ningún error):

```css
/* src/app.css */
@import '@callepuzzle/svelte-ui/styles.css';
```

Paso a paso completo: [`docs/instalacion.md`](../../docs/instalacion.md).

## Qué exporta

### `@callepuzzle/svelte-ui`

**Componentes**

| Componente           | Props principales                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header`             | `title: Snippet`, `routes?`, `homeHref?`, `showBack?`, `menuToggleFor?`, `navEnd?`, `navCenter?`                                                               |
| `Drawer`             | `children: Snippet<[{ drawerId }]>`, `side: Snippet`, `contentClass?`, `sideClass?`                                                                            |
| `NavBarList`         | `routes: RouteMap`, `type?: 'horizontal' \| 'drawer'`                                                                                                          |
| `NavBarEnd`          | `user?`, `authClient?`, `profileHref?`, `notificationsHref?`, `userHasNotification?`, `searcher?`, `locales?`, `setLocale?`, `login?`, `avatar?`, `menuExtra?` |
| `Link`               | `href: string`, `route?: Route`, `label?`, `id?`                                                                                                               |
| `Modal`              | `children: Snippet`, `title?`, `type?: 'button' \| 'X' \| 'outside'`, `showButton?`, `trigger?`; **exporta `showModal()` y `close()`**                         |
| `Dock`               | `routes: RouteMap`, `currentPath: string`, `children?`                                                                                                         |
| `DockLink`           | `route: Route`, `currentPath: string`, `id?`                                                                                                                   |
| `Footer`             | `children: Snippet`, `visibleOnlyOnMobile?`                                                                                                                    |
| `ButtonSignOut`      | `authClient: SignOutClient`, `redirectTo?: string \| null`, `children?`                                                                                        |
| `UserNotLogged`      | `text?`, `children?`, `action?`                                                                                                                                |
| `FormFields`         | `form`, `formData`, `fields: Fields`                                                                                                                           |
| `FormString`         | `form`, `formData`, `field`, `label?`, `type?`, `placeholder?`, `description?`, `required?`, `inputClass?`                                                     |
| `FormNumber`         | como `FormString` + `min?`, `max?`, `step?`                                                                                                                    |
| `FormTextarea`       | como `FormString` + `rows?`                                                                                                                                    |
| `FormSelect`         | como `FormString` + `options: readonly string[]`                                                                                                               |
| `FormCheckbox`       | como `FormString`                                                                                                                                              |
| `FormLoginMagicLink` | `authClient: MagicLinkClient`, `schema?`, `callbackURL?`, `debug?`, `onSuccess?`                                                                               |

Todos aceptan `class?: string` (compuesta con `cn()`, así que sobreescribe de forma predecible) y
reenvían el resto de atributos al elemento raíz. Los que tienen texto visible aceptan
`strings?: Partial<XStrings>`.

**Utilidades y tipos**

- `cn(...inputs)` — `clsx` + `tailwind-merge`.
- `commonStrings`, `CommonStrings` — los textos compartidos.
- `default*Strings` y `*Strings` de cada componente (ver el catálogo en
  [`docs/i18n.md`](../../docs/i18n.md#catálogo-de-diccionarios)).
- `SessionUser`, `SignOutClient`, `MagicLinkClient`, `EmailOtpClient`, `AuthCallResult`,
  `AuthCallError` — los tipos **estructurales** con los que los componentes hablan con el cliente
  de auth. El paquete no importa `@callepuzzle/auth`, ni para tipos: cualquier cliente de
  better-auth con esa forma vale.

### `@callepuzzle/svelte-ui/otp`

`FormLoginOtp` (`authClient: EmailOtpClient`, `schema?`, `debug?`, `onSuccess?`,
`startOverHref?`) más `defaultFormLoginOtpStrings` / `FormLoginOtpStrings`.

Está en un subpath aparte porque necesita `bits-ui` (el `PinInput`), que es un peer **opcional**:
quien use magic link no tiene que instalarlo.

### `@callepuzzle/svelte-ui/styles.css`

La hoja de estilos del paquete:

```css
@import 'tailwindcss';
@source "../";
@plugin "daisyui";
```

## Ejemplos

Navbar con sesión y login propio:

```svelte
<script lang="ts">
	import { Header, NavBarEnd } from '@callepuzzle/svelte-ui';
	import { getRoutes } from '$lib/routes';
	import { authClient } from '$lib/auth-client';

	let { data } = $props();
	const routes = $derived(getRoutes());
</script>

<Header {routes} homeHref="/" strings={{ navLabel: 'Menú' }}>
	{#snippet title()}Mi app{/snippet}
	{#snippet navEnd()}
		<NavBarEnd user={data.user} {authClient} profileHref="/profile">
			{#snippet login()}<a class="btn btn-sm" href="/login">Entrar</a>{/snippet}
		</NavBarEnd>
	{/snippet}
</Header>
```

Formulario generado desde un schema de zod:

```svelte
<script lang="ts">
	import { FormFields } from '@callepuzzle/svelte-ui';
	import { zodToFieldsJsonSchema } from '@callepuzzle/core/schema';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { gangSchema } from '$lib/schemas/gang';

	let { data } = $props();

	const form = superForm(data.form, { validators: zod4Client(gangSchema) });
	const { form: formData, enhance } = form;
	const fields = zodToFieldsJsonSchema(gangSchema);
</script>

<form method="POST" use:enhance>
	<FormFields {form} {formData} {fields} strings={{ required: 'Obligatorio' }} />
	<button class="btn btn-primary">Guardar</button>
</form>
```

Modal con disparador propio:

```svelte
<Modal title="Editar" strings={{ close: 'Cerrar' }}>
	{#snippet trigger({ showModal })}
		<button class="btn btn-ghost" onclick={showModal}>Abrir</button>
	{/snippet}
	<p>Contenido</p>
</Modal>
```

## Referencia completa

El **Storybook** es la referencia de componentes: cada uno tiene sus stories con `autodocs`, y
los ficheros `*.strings.ts` documentan clave a clave el copy.

```sh
bun run storybook   # desde la raíz del monorepo, en :6006
```

- [`docs/instalacion.md`](../../docs/instalacion.md) — integración paso a paso.
- [`docs/i18n.md`](../../docs/i18n.md) — cómo inyectar los textos.
- [`docs/auth.md`](../../docs/auth.md) — cómo montar better-auth.
- [`docs/migracion.md`](../../docs/migracion.md) — mapeo desde `@repo/sveltekit-ui`.
- [ADR 0003](../../docs/adr/0003-i18n-por-inyeccion.md) — por qué los textos van por props.
- [ADR 0004](../../docs/adr/0004-daisyui-como-contrato.md) — por qué daisyUI es el contrato.

## Desarrollo

Desde la raíz del monorepo:

```sh
bun install
bun run build            # compila los tres paquetes publicables
bun run storybook        # Storybook en :6006
bun run test             # unit + componentes en Chromium + stories con axe
bun run check-publish    # publint + attw
```

La primera vez, `bunx playwright install chromium`: dos de los tres proyectos de vitest corren en
navegador real. Convenciones y trampas conocidas, en [`AGENTS.md`](../../AGENTS.md).
