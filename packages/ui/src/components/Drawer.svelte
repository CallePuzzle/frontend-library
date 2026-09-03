<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { defaultDrawerStrings, type DrawerStrings } from './Drawer.strings.js';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Contenido de la página. Recibe el `drawerId` para que el consumidor pueda poner su
		 * propio disparador (`<label for={drawerId}>`, o `menuToggleFor` del `Header`).
		 */
		children: Snippet<[{ drawerId: string }]>;
		/** Contenido del panel lateral (típicamente un `NavBarList type="drawer"`). */
		side: Snippet;
		class?: string;
		contentClass?: string;
		sideClass?: string;
		strings?: Partial<DrawerStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'>;

	let {
		children,
		side,
		class: className,
		contentClass,
		sideClass,
		strings,
		...rest
	}: Props = $props();

	const t = $derived({ ...defaultDrawerStrings, ...strings });

	// Derivado de `$props.id()`, nunca un id fijo: dos drawers en la misma página no se pisan.
	const uid = $props.id();
	const drawerId = `drawer-${uid}`;
</script>

<div class={cn('drawer', className)} {...rest}>
	<input id={drawerId} type="checkbox" class="drawer-toggle" aria-label={t.toggleSidebar} />
	<div class={cn('drawer-content flex flex-col', contentClass)}>
		{@render children({ drawerId })}
	</div>
	<div class={cn('drawer-side', sideClass)}>
		<label for={drawerId} aria-label={t.closeSidebar} class="drawer-overlay"></label>
		{@render side()}
	</div>
</div>
