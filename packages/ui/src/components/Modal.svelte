<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import { defaultModalStrings, type ModalStrings } from './Modal.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Etiqueta del botón que abre el diálogo. Sólo se usa con el disparador por defecto:
		 * con `trigger` o con `showButton={false}` no hace falta.
		 */
		title?: string;
		children: Snippet;
		/**
		 * Cómo se cierra: `button` añade un botón al pie, `X` una cruz en la esquina y
		 * `outside` (por defecto) cierra al pulsar fuera de la caja.
		 */
		type?: 'button' | 'X' | 'outside';
		/** Renderizar el botón disparador por defecto. */
		showButton?: boolean;
		buttonClass?: string;
		buttonCloseClass?: string;
		boxClass?: string;
		/**
		 * Disparador propio, con control total del marcado. Recibe `showModal` para abrir el
		 * diálogo. Si se pasa, sustituye al botón por defecto.
		 */
		trigger?: Snippet<[{ showModal: () => void }]>;
		class?: string;
		strings?: Partial<ModalStrings>;
	} & Omit<HTMLDialogAttributes, 'class' | 'children'>;

	let {
		title = '',
		children,
		type = 'outside',
		showButton = true,
		buttonClass = 'btn',
		buttonCloseClass = 'btn',
		boxClass = 'modal-box',
		trigger,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultModalStrings, ...contextStrings.modal, ...strings });

	// `bind:this` + `$state`, no una búsqueda del `<dialog>` por id en `onMount`: así la
	// referencia es reactiva y `showModal()` nunca puede lanzar (el `?.` cubre el SSR y el
	// primer tick, cuando todavía no hay elemento).
	let modal: HTMLDialogElement | undefined = $state();

	const uid = $props.id();

	/** Abre el diálogo. Exportado para poder abrirlo desde fuera del componente. */
	export function showModal() {
		modal?.showModal();
	}

	/** Cierra el diálogo. */
	export function close() {
		modal?.close();
	}
</script>

{#if trigger}
	{@render trigger({ showModal })}
{:else if showButton}
	<!-- `type="button"`: sin él, dentro de un `<form>` esto enviaría el formulario. -->
	<button type="button" class={buttonClass} onclick={showModal}>{title}</button>
{/if}
<dialog bind:this={modal} id="modal-{uid}" class={cn('modal', className)} {...rest}>
	<div class={boxClass}>
		{#if type === 'X'}
			<form method="dialog">
				<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm">
					<span aria-hidden="true">✕</span>
					<span class="sr-only">{t.close}</span>
				</button>
			</form>
		{/if}

		{@render children()}

		{#if type === 'button'}
			<div class="modal-action">
				<form method="dialog">
					<!-- Un botón dentro de un `<form method="dialog">` cierra el diálogo. -->
					<button class={buttonCloseClass}>{t.close}</button>
				</form>
			</div>
		{/if}
	</div>
	{#if type === 'outside'}
		<form method="dialog" class="modal-backdrop">
			<button>{t.close}</button>
		</form>
	{/if}
</dialog>
