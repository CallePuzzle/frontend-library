<script lang="ts" generics="Id extends string">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getMenuRoutes, type RouteMap } from '@callepuzzle/core';
	import Link from './Link.svelte';
	import { cn } from '../utils.js';

	type Props = {
		/** Mapa de rutas de la app. La clave es la ruta; el valor, su configuración de menú. */
		routes: RouteMap<Id>;
		/** `horizontal` para la navbar de escritorio; `drawer` para el panel lateral. */
		type?: 'horizontal' | 'drawer';
		/**
		 * Atributo `id` del `<a>` de cada entrada, por clave del mapa. Es el punto de anclaje de
		 * los tours guiados (y de cualquier CSS o test que necesite señalar un enlace concreto).
		 */
		ids?: Partial<Record<Id, string>>;
		class?: string;
	} & Omit<HTMLAttributes<HTMLUListElement>, 'class'>;

	let { routes, type = 'horizontal', ids, class: className, ...rest }: Props = $props();

	// `$derived`, no un `const` de módulo: el menú tiene que reaccionar si `routes` cambia
	// (p. ej. al cambiar de idioma, que reescribe todas las `label`).
	const menuRoutes = $derived(getMenuRoutes(routes));

	const typeClass = $derived(
		type === 'drawer' ? 'menu min-h-full w-80 bg-base-200 p-4 py-10' : 'menu menu-horizontal'
	);
</script>

<ul class={cn(typeClass, className)} {...rest}>
	{#each menuRoutes as route (route.id)}
		<li>
			<Link {route} href={route.id} id={ids?.[route.id]} />
		</li>
	{/each}
</ul>
