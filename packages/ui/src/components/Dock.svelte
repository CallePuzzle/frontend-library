<script lang="ts" generics="Id extends string">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { getMenuRoutes, type RouteMap } from '@callepuzzle/core';
	import DockLink from './DockLink.svelte';
	import { defaultDockStrings, type DockStrings } from './Dock.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import { cn } from '../utils.js';

	type Props = {
		/** Mapa de rutas de la app. Sólo entran en el dock las que declaran `showInMobile`. */
		routes: RouteMap<Id>;
		/** Ruta activa, tal y como la nombra el `RouteMap`. */
		currentPath: string;
		/**
		 * Atributo `id` del `<a>` de cada entrada, por clave del mapa. Es el punto de anclaje de
		 * los tours guiados (y de cualquier CSS o test que necesite señalar un enlace concreto).
		 */
		ids?: Partial<Record<Id, string>>;
		/**
		 * Entradas extra, después de las del mapa. Es el punto de extensión para lo que no es
		 * una página de navegación normal (p. ej. un "instalar la PWA" condicional).
		 */
		children?: Snippet;
		class?: string;
		strings?: Partial<DockStrings>;
	} & Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'>;

	let { routes, currentPath, ids, children, class: className, strings, ...rest }: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultDockStrings, ...contextStrings.dock, ...strings });
	// `$derived`: el dock reacciona a un cambio de `routes` (idioma, permisos…).
	const dockRoutes = $derived(getMenuRoutes(routes, { mobile: true }));
</script>

<nav aria-label={t.navLabel} class={cn('dock flex lg:hidden', className)} {...rest}>
	{#each dockRoutes as route (route.id)}
		<DockLink {route} {currentPath} id={ids?.[route.id]} />
	{/each}
	{#if children}
		{@render children()}
	{/if}
</nav>
