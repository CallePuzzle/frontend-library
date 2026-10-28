<script lang="ts">
	/**
	 * Andamio de test para `DropdownMenu`.
	 *
	 * Los snippets `trigger` e `items` no se pueden pasar desde un fichero de test con el
	 * comportamiento que hace falta (elegir un item, llamar al `close` del snippet), así que
	 * este componente los monta como los monta un consumidor real.
	 */
	import DropdownMenu from '../components/DropdownMenu.svelte';

	type Props = {
		/** Nombre accesible del disparador. */
		label?: string;
		/** Entradas del menú, en orden. */
		entries?: string[];
		/** Prop `closeOnSelect` del `DropdownMenu`. */
		closeOnSelect?: boolean;
		/**
		 * Con `true`, los items cierran con el `close` del snippet al activarse: cubre el
		 * camino en que el consumidor decide él cuándo cerrar.
		 */
		itemsUseClose?: boolean;
		/** Se llama al activar un item. */
		onSelect?: (item: string) => void;
	};

	let {
		label = 'Options',
		entries = ['One', 'Two', 'Three'],
		closeOnSelect = false,
		itemsUseClose = false,
		onSelect
	}: Props = $props();
</script>

<DropdownMenu {label} {closeOnSelect} triggerClass="btn btn-ghost">
	{#snippet trigger()}
		<span>{label}</span>
	{/snippet}
	{#snippet items({ close })}
		{#each entries as entry (entry)}
			<li role="none">
				<button
					type="button"
					role="menuitem"
					onclick={() => {
						// Elegir ejecuta la acción; cerrar lo decide el consumidor (aquí, el
						// flag `itemsUseClose` simula al que llama al `close` recibido).
						onSelect?.(entry);
						if (itemsUseClose) close();
					}}
				>
					{entry}
				</button>
			</li>
		{/each}
	{/snippet}
</DropdownMenu>
