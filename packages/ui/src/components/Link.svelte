<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Route } from '@callepuzzle/core';
	import { resolve } from '$app/paths';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Ruta destino. Es la **clave** del `RouteMap` del consumidor (`route.id`), no una URL
		 * ya resuelta: `Link` le aplica `resolve()` para respetar `paths.base`.
		 */
		href: string;
		/** Entrada de navegación de la que se toman el icono y la etiqueta. */
		route?: Route;
		/** Etiqueta explícita, para enlaces que no vienen de un `RouteMap`. */
		label?: string;
		/** `id` del `<a>`. Lo necesitan los tours guiados para anclar los pasos. */
		id?: string;
		class?: string;
		children?: Snippet;
	} & Omit<HTMLAnchorAttributes, 'href' | 'id' | 'class' | 'children'>;

	let { href, route, label, id, class: className, children, ...rest }: Props = $props();

	/**
	 * `resolve()` sólo acepta los ids de ruta del proyecto **donde se compila**. Aquí eso es
	 * este paquete (una librería sin rutas: su `RouteId` es `'/'`), no la app que lo consume:
	 * la librería no puede conocer el `RouteId` del consumidor. Por eso `href` es un `string`
	 * genérico y se estrecha al tipo que espera `resolve` en el punto de llamada. El tipado
	 * fuerte lo obtiene el consumidor declarando su mapa como `RouteMap<RouteId>`.
	 */
	const resolved = $derived(resolve(href as Parameters<typeof resolve>[0]));

	const Icon = $derived(route?.icon);
	// Precedencia del contenido: `children` > `route` > `label`.
	const text = $derived(route?.label ?? label);
</script>

<a {id} href={resolved} class={cn(className)} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		{#if Icon}
			<Icon />
		{/if}
		{#if text}
			<span>{text}</span>
		{/if}
	{/if}
</a>
