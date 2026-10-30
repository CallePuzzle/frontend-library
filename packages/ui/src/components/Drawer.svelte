<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { defaultDrawerStrings, type DrawerStrings } from './Drawer.strings.js';
	import { getUiStrings } from '../strings/context.js';
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

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultDrawerStrings, ...contextStrings.drawer, ...strings });

	// Derivado de `$props.id()`, nunca un id fijo: dos drawers en la misma página no se pisan.
	const uid = $props.id();
	const drawerId = `drawer-${uid}`;

	// El estado del checkbox sirve para que el nombre accesible refleje la acción real:
	// con el cajón abierto, el toggle anuncia "cerrar", no "abrir".
	let open = $state(false);
</script>

<div class={cn('drawer', className)} {...rest}>
	<input
		id={drawerId}
		type="checkbox"
		class="drawer-toggle"
		bind:checked={open}
		aria-label={open ? t.closeSidebar : t.openSidebar}
	/>
	<div class={cn('drawer-content flex flex-col', contentClass)}>
		{@render children({ drawerId })}
	</div>
	<div class={cn('drawer-side', sideClass)}>
		<!-- `aria-label` está prohibido sobre `<label>` (ARIA in HTML). El overlay es una
		     superficie de cierre solo para puntero y un `label` nunca es enfocable, así que
		     sale del árbol de accesibilidad; el cierre por teclado lo da el checkbox, que
		     anuncia "cerrar" con el cajón abierto. -->
		<label for={drawerId} aria-hidden="true" class="drawer-overlay"></label>
		{@render side()}
	</div>
</div>
