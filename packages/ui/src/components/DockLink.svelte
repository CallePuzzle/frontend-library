<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Route } from '@callepuzzle/core';
	import Link from './Link.svelte';
	import { cn } from '../utils.js';

	export type Props = {
		/** Entrada de navegación a renderizar. */
		route: Route;
		/** Ruta activa, tal y como la nombra el `RouteMap` (`page.route.id` o `page.url.pathname`). */
		currentPath: string;
		/** `id` del `<a>`. Lo necesitan los tours guiados para anclar los pasos. */
		id?: string;
		class?: string;
	} & Omit<HTMLAnchorAttributes, 'href' | 'id' | 'class' | 'children'>;

	let { route, currentPath, id, class: className, ...rest }: Props = $props();

	const isActive = $derived(currentPath === route.id);
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
