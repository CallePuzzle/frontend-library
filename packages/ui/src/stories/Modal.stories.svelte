<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Modal from '../components/Modal.svelte';

	const { Story } = defineMeta({
		title: 'Common/Modal',
		component: Modal,
		tags: ['autodocs'],
		argTypes: {
			type: { control: 'inline-radio', options: ['outside', 'button', 'X'] },
			title: { control: 'text' },
			showButton: { control: 'boolean' },
			children: { control: false },
			trigger: { control: false }
		}
	});
</script>

<!-- `outside` (por defecto): se cierra pulsando fuera de la caja. -->
<Story name="Cierre por fuera" args={{ title: 'Abrir (cierre por fuera)' }}>
	{#snippet template({ children, ...args })}
		<Modal {...args}>
			<p>Contenido del diálogo.</p>
		</Modal>
	{/snippet}
</Story>

<Story name="Cierre con botón" args={{ title: 'Abrir (botón de cierre)', type: 'button' }}>
	{#snippet template({ children, ...args })}
		<Modal {...args}>
			<p>Contenido del diálogo.</p>
		</Modal>
	{/snippet}
</Story>

<Story name="Cierre con X" args={{ title: 'Abrir (cierre con X)', type: 'X' }}>
	{#snippet template({ children, ...args })}
		<Modal {...args}>
			<p>Contenido del diálogo.</p>
		</Modal>
	{/snippet}
</Story>

<!-- `trigger` recibe `showModal`: control total del marcado del disparador. -->
<Story name="Disparador propio" args={{ type: 'X' }}>
	{#snippet template({ children, ...args })}
		<Modal {...args}>
			{#snippet trigger({ showModal })}
				<button type="button" class="btn btn-lg btn-accent" onclick={showModal}>
					Disparador propio
				</button>
			{/snippet}
			<p>Contenido del diálogo.</p>
		</Modal>
	{/snippet}
</Story>

<!-- Inyección de textos: el único texto visible del componente es el de cerrar. -->
<Story name="En castellano" args={{ title: 'Abrir', type: 'button', strings: { close: 'Cerrar' } }}>
	{#snippet template({ children, ...args })}
		<Modal {...args}>
			<h2 class="text-lg font-bold">Diálogo en castellano</h2>
			<p>El texto del botón de cierre llega por la prop `strings`.</p>
		</Modal>
	{/snippet}
</Story>
