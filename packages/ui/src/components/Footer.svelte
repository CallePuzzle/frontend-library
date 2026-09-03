<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Contenido del pie. Los enlaces concretos (repositorio, contacto, reiniciar el tour…)
		 * son decisiones de producto: van aquí, no dentro de la librería.
		 */
		children: Snippet;
		/**
		 * Con `true` el pie sólo se ve en móvil; con `false` (por defecto), sólo en escritorio.
		 * Permite el patrón de dos pies con contenido distinto por breakpoint.
		 */
		visibleOnlyOnMobile?: boolean;
		class?: string;
	} & Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'>;

	let { children, visibleOnlyOnMobile = false, class: className, ...rest }: Props = $props();

	const visibilityClass = $derived(visibleOnlyOnMobile ? 'flex lg:hidden' : 'hidden lg:flex');
</script>

<footer
	class={cn('bottom-0 container mx-auto justify-center', visibilityClass, className)}
	{...rest}
>
	{@render children()}
</footer>
