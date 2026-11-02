<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { afterNavigate } from '$app/navigation';
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
		/**
		 * Estado del panel. Enlázalo con `bind:open` para abrirlo o cerrarlo desde la app
		 * —p. ej. antes de arrancar un tour guiado— sin tocar el checkbox del DOM: al pasar
		 * el cierre por el estado, el checkbox y su `aria-label` quedan en sync.
		 */
		open?: boolean;
		/**
		 * Cierra el panel al completarse cualquier navegación client-side. `true` por
		 * defecto: el `Drawer` vive en el layout, que no se remonta al navegar, y sin esto
		 * el checkbox sobrevive marcado y el panel llega abierto a la página destino.
		 */
		closeOnNavigate?: boolean;
		class?: string;
		contentClass?: string;
		sideClass?: string;
		strings?: Partial<DrawerStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'>;

	let {
		children,
		side,
		open = $bindable(false),
		closeOnNavigate = true,
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

	// Cierre por navegación. Todo cierre pasa por el estado (`open`), nunca por el DOM: es
	// lo que deja en sync el checkbox y su `aria-label` («cerrar» con el cajón abierto).
	// Incluye re-pulsar la entrada de la página actual: el router la trata como una
	// navegación `link` completa (lo único que se salta con la misma URL es el preload).
	afterNavigate((navigation) => {
		// La navegación de entrada (`enter`: la hidratación) no cierra: no hay panel abierto
		// que arrastre de una página anterior, y un `open` inicial de la app no debe
		// perderse al montar. `afterNavigate` se engancha vía `onMount`: en SSR no registra
		// nada y en el navegador dispara la callback en cada navegación completada.
		if (!closeOnNavigate || navigation.type === 'enter') return;
		open = false;
	});
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
