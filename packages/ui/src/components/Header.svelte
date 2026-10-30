<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { RouteMap } from '@callepuzzle/core';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Menu from '@lucide/svelte/icons/menu';
	import Link from './Link.svelte';
	import NavBarList from './NavBarList.svelte';
	import { defaultHeaderStrings, type HeaderStrings } from './Header.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import { cn } from '../utils.js';

	export type Props = {
		/** Marca o logotipo. Es un `Snippet`, no un `string`, para poder pasar un `<img>`. */
		title: Snippet;
		/** Mapa de rutas del menú central. Si se pasa `navCenter`, se ignora. */
		routes?: RouteMap;
		/** Ruta de inicio. Si se pasa, el título es un enlace a ella. */
		homeHref?: string;
		/**
		 * Mostrar el botón "atrás" en móvil. Es navegación iniciada por la librería
		 * (`history.back()`), así que es opt-in; la regla general es que la navegación la
		 * decide la app (la única otra excepción es `ButtonSignOut`, con `redirectTo`).
		 */
		showBack?: boolean;
		/**
		 * `id` del `<input class="drawer-toggle">` que abre el panel lateral (el que da
		 * `Drawer` a su snippet `children`). Sin él no se renderiza el botón hamburguesa.
		 */
		menuToggleFor?: string;
		/** Zona derecha de la navbar. Aquí va el `NavBarEnd`, si se quiere. */
		navEnd?: Snippet;
		/** Menú central propio. Alternativa a `routes`. */
		navCenter?: Snippet;
		class?: string;
		strings?: Partial<HeaderStrings>;
		// `title` se omite del rest a propósito: el atributo HTML `title` es un `string` y aquí
		// es un `Snippet`; sin el `Omit` el tipo resultante (`Snippet & string`) es insatisfacible.
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'title'>;

	let {
		title,
		routes,
		homeHref,
		showBack = false,
		menuToggleFor,
		navEnd,
		navCenter,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultHeaderStrings, ...contextStrings.header, ...strings });
</script>

{#snippet brand()}
	{#if homeHref}
		<Link href={homeHref}>{@render title()}</Link>
	{:else}
		{@render title()}
	{/if}
{/snippet}

<!--
	Sólo la navbar: el `Header` ya no impone el layout de la página. El panel lateral es un
	`Drawer` aparte, opcional, que el consumidor compone como quiera.
-->
<div class={cn('navbar flex min-h-px justify-between bg-base-300 shadow-sm', className)} {...rest}>
	<div class="hidden w-full lg:flex">
		<div class="mx-2 navbar-start px-2">{@render brand()}</div>
		{#if navCenter}
			<div class="my-2 navbar-center hidden lg:block">{@render navCenter()}</div>
		{:else if routes}
			<nav aria-label={t.navLabel} class="my-2 navbar-center hidden lg:block">
				<NavBarList type="horizontal" {routes} />
			</nav>
		{/if}
	</div>
	<div class="flex items-center lg:hidden">
		{#if menuToggleFor}
			<!-- daisyUI abre el drawer con un `<label for>` sobre su checkbox. -->
			<label for={menuToggleFor} class="btn btn-square btn-ghost">
				<!-- `aria-label` está prohibido sobre `<label>` (ARIA in HTML): el nombre accesible
				     de un label viene de su contenido, así que texto visualmente oculto. -->
				<span class="sr-only">{t.openSidebar}</span>
				<Menu />
			</label>
		{/if}
		{#if showBack}
			<!-- Excepción opt-in a "la librería no navega": ver la prop `showBack`. -->
			<button type="button" aria-label={t.back} onclick={() => history.back()}>
				<ChevronLeft size={30} />
			</button>
		{/if}
		<div class="mx-2 px-2">{@render brand()}</div>
	</div>
	{#if navEnd}
		{@render navEnd()}
	{/if}
</div>
