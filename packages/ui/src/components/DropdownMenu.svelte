<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Nombre accesible del disparador (y de la lista, vía `aria-label`). Con texto visible
		 * en el disparador, ha de contenerlo: el nombre accesible debe incluirlo.
		 */
		label: string;
		/** Clases del disparador (`btn btn-ghost`…). */
		triggerClass?: string;
		/** Clases de la lista (ancho, `menu-sm`…), sobre las base que ya pone el componente. */
		menuClass?: string;
		/**
		 * Cierra el menú al activar cualquier item (en el patrón de WAI-ARIA, elegir una
		 * opción cierra el menú). Por defecto es `false` para quien necesite decidir él
		 * cuándo cerrar (p. ej. sólo si la acción tuvo éxito): el snippet `items` recibe
		 * `close` para hacerlo.
		 */
		closeOnSelect?: boolean;
		/** Contenido del disparador. */
		trigger: Snippet;
		/**
		 * Los items: `<li role="none">` envolviendo un elemento interactivo con
		 * `role="menuitem"` (o `menuitemradio` + `aria-checked` en un selector).
		 * Recibe `close` para cerrar al elegir.
		 */
		items: Snippet<[{ close: () => void }]>;
		class?: string;
		// `onfocusout` fuera del rest: el componente lo gobierna (cerrar al salir con Tab).
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onfocusout'>;

	let {
		label,
		triggerClass = '',
		menuClass = '',
		closeOnSelect = false,
		trigger,
		items,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const menuId = `${uid}-menu`;

	// daisyUI muestra el `dropdown` por CSS con `:focus-within`, pero WebKit (Safari/iOS)
	// no da foco a un `<button>` al pulsarlo: en un iPhone el menú podía no abrir. La
	// apertura es estado explícito (el click del disparador) y la clase `dropdown-open`
	// de daisyUI lo pinta, sin depender del foco.
	let open = $state(false);

	// `bind:this` + `$state`: la referencia es reactiva y cubre SSR y el primer tick.
	let root: HTMLDivElement | undefined = $state();
	let triggerButton: HTMLButtonElement | undefined = $state();
	let menu: HTMLUListElement | undefined = $state();

	/** Los items enfocables (los deshabilitados se saltan). */
	function menuItems(): HTMLElement[] {
		return Array.from(
			menu?.querySelectorAll<HTMLElement>(
				':is([role="menuitem"], [role="menuitemradio"]):not([disabled])'
			) ?? []
		);
	}

	/** Abre el menú y deja el foco en el primer (o último) item. */
	async function openWithFocus(focus: 'first' | 'last' = 'first') {
		open = true;
		// La lista es condicional (`{#if open}`): sin `tick`, los items aún no existen.
		await tick();
		const list = menuItems();
		(focus === 'first' ? list[0] : list.at(-1))?.focus();
	}

	/** Cierra el menú. Exportado al snippet `items` para cerrar al elegir. */
	function close() {
		open = false;
	}

	/** Cierra devolviendo el foco al disparador (Escape). */
	function closeToTrigger() {
		close();
		triggerButton?.focus();
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		// Enter y Espacio ya abren solos (el click nativo de un botón enfocado).
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			void openWithFocus(event.key === 'ArrowDown' ? 'first' : 'last');
		}
	}

	function onMenuKeydown(event: KeyboardEvent) {
		const list = menuItems();
		const current = list.indexOf(document.activeElement as HTMLElement);
		let next: number;
		switch (event.key) {
			case 'ArrowDown':
				next = (current + 1) % list.length;
				break;
			case 'ArrowUp':
				next = (current - 1 + list.length) % list.length;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = list.length - 1;
				break;
			case 'Escape':
				event.preventDefault();
				closeToTrigger();
				return;
			default:
				return;
		}
		event.preventDefault();
		list[next]?.focus();
	}

	// Pulsar fuera cierra. `pointerdown` y no `click`: llega antes de que el foco cambie
	// y también con toques en iOS.
	$effect(() => {
		if (!open) return;
		function onOutsidePointerDown(event: PointerEvent) {
			if (root && !root.contains(event.target as Node)) close();
		}
		document.addEventListener('pointerdown', onOutsidePointerDown);
		return () => document.removeEventListener('pointerdown', onOutsidePointerDown);
	});
</script>

<div
	bind:this={root}
	class={cn('dropdown dropdown-end', open && 'dropdown-open', className)}
	onfocusout={(event) => {
		// Salir con Tab (el foco se va a un elemento fuera del componente) cierra. Sin
		// `relatedTarget` el foco no se mueve a ningún elemento: lo cubre el click fuera.
		const destino = event.relatedTarget as Node | null;
		if (destino && root && !root.contains(destino)) close();
	}}
	{...rest}
>
	<!-- El `aria-controls` sólo con el menú en el DOM: referenciar un id inexistente no es válido. -->
	<button
		bind:this={triggerButton}
		type="button"
		aria-label={label}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? menuId : undefined}
		class={triggerClass}
		onclick={() => (open ? close() : void openWithFocus())}
		onkeydown={onTriggerKeydown}
	>
		{@render trigger()}
	</button>
	{#if open}
		<!-- `tabindex="-1"`: el foco lo mueve el componente entre items, no el Tab. -->
		<ul
			bind:this={menu}
			id={menuId}
			role="menu"
			aria-label={label}
			tabindex="-1"
			class={cn('dropdown-content menu z-1 mt-3 rounded-box bg-base-100 p-2 shadow', menuClass)}
			onkeydown={onMenuKeydown}
			onclick={closeOnSelect ? close : undefined}
		>
			{@render items({ close })}
		</ul>
	{/if}
</div>
