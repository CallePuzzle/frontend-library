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

	/**
	 * Disclosure progresivo del menú horizontal (#37): con menús de escritorio grandes (el
	 * caso real, 9 secciones) ya no caben en portátil (1280–1535px) — `.navbar-center` de
	 * daisyUI no encoge (`flex-shrink: 0`) y navbar-end tapa las últimas entradas. Por
	 * debajo de `2xl` la etiqueta se esconde en visual (`sr-only`: sale del flujo, pero
	 * sigue en el DOM y el nombre accesible del enlace sigue siendo la etiqueta); a partir
	 * de `2xl` el propio media query deja de aplicar y se ve icono+etiqueta como siempre.
	 * La clase va sobre el `<a>` con una variante arbitraria sobre el `span` de `Link`, para
	 * no tocar el `Link` compartido con el drawer, que conserva icono+etiqueta. Sólo
	 * entradas con icono: sin icono la etiqueta es lo único visible y esconderla dejaría el
	 * enlace vacío. Va como literal en el fuente a propósito: el `@source` del consumidor
	 * escanea cadenas, no resultados de ejecución.
	 */
	const iconOnlyLabel = 'max-2xl:[&>span]:sr-only';
</script>

<ul class={cn(typeClass, className)} {...rest}>
	{#each menuRoutes as route (route.id)}
		<li>
			<Link
				{route}
				href={route.id}
				id={ids?.[route.id]}
				class={type === 'horizontal' && route.icon ? iconOnlyLabel : undefined}
			/>
		</li>
	{/each}
</ul>
