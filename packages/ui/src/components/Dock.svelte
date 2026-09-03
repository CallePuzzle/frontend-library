<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { getMenuRoutes, type RouteMap } from '@callepuzzle/core';
	import DockLink from './DockLink.svelte';
	import { defaultDockStrings, type DockStrings } from './Dock.strings.js';
	import { cn } from '../utils.js';

	export type Props = {
		/** Mapa de rutas de la app. Sólo entran en el dock las que declaran `showInMobile`. */
		routes: RouteMap;
		/** Ruta activa, tal y como la nombra el `RouteMap`. */
		currentPath: string;
		/**
		 * Entradas extra, después de las del mapa. Es el punto de extensión para lo que no es
		 * una página de navegación normal (p. ej. un "instalar la PWA" condicional).
		 */
		children?: Snippet;
		class?: string;
		strings?: Partial<DockStrings>;
	} & Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'>;

	let { routes, currentPath, children, class: className, strings, ...rest }: Props = $props();

	const t = $derived({ ...defaultDockStrings, ...strings });
	// `$derived`: el dock reacciona a un cambio de `routes` (idioma, permisos…).
	const dockRoutes = $derived(getMenuRoutes(routes, { mobile: true }));
</script>

<nav aria-label={t.navLabel} class={cn('dock flex lg:hidden', className)} {...rest}>
	{#each dockRoutes as route (route.id)}
		<DockLink {route} {currentPath} />
	{/each}
	{#if children}
		{@render children()}
	{/if}
</nav>
