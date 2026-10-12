<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Route } from '@callepuzzle/core';
	import { resolve } from '$app/paths';
	import Link from './Link.svelte';
	import { cn } from '../utils.js';

	export type Props = {
		/** Entrada de navegación a renderizar. */
		route: Route;
		/**
		 * Ruta activa. Acepta cualquiera de las dos formas que da SvelteKit: el id del
		 * `RouteMap` (`page.route.id`, invariante ante `paths.base`) o `page.url.pathname`
		 * (que *incluye* el base path si lo hay).
		 */
		currentPath: string;
		/** `id` del `<a>`. Lo necesitan los tours guiados para anclar los pasos. */
		id?: string;
		class?: string;
	} & Omit<HTMLAnchorAttributes, 'href' | 'id' | 'class' | 'children'>;

	let { route, currentPath, id, class: className, ...rest }: Props = $props();

	// Mismo estrechado que en `Link`: `resolve()` sólo acepta los ids del proyecto que compila,
	// que aquí es la librería. El tipado fuerte lo pone el consumidor con `RouteMap<RouteId>`.
	const href = $derived(resolve(route.id as Parameters<typeof resolve>[0]));

	// Dos formas de decir "activa": por id (`page.route.id`, que no lleva el base path) o por
	// pathname (que lo lleva: por eso se compara también contra `resolve(route.id)`).
	const isActive = $derived(currentPath === route.id || currentPath === href);
	const Icon = $derived(route.icon);
</script>

<Link
	{id}
	href={route.id}
	class={cn(isActive && 'dock-active', className)}
	aria-current={isActive ? 'page' : undefined}
	{...rest}
>
	{#if Icon}
		<Icon size={20} />
	{/if}
	<span class="dock-label">{route.short ?? route.label}</span>
</Link>
