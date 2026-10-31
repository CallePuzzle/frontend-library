<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Drawer from '../components/Drawer.svelte';
	import Header from '../components/Header.svelte';
	import NavBarList from '../components/NavBarList.svelte';
	import { routes } from './fixtures.js';

	/**
	 * El `Header` ya no envuelve la app: el layout lo compone el consumidor. Este es el patrón
	 * recomendado — `Drawer` como raíz, y el `drawerId` que entrega a su snippet `children`
	 * pasado al `Header` como `menuToggleFor` para que el botón hamburguesa abra el cajón.
	 */
	const { Story } = defineMeta({
		title: 'Layout/Drawer',
		component: Drawer,
		tags: ['autodocs'],
		argTypes: {
			children: { control: false },
			side: { control: false },
			open: { control: 'boolean' },
			closeOnNavigate: { control: 'boolean' },
			contentClass: { control: 'text' },
			sideClass: { control: 'text' }
		}
	});
</script>

{#snippet brand()}
	<span class="text-xl font-bold">CallePuzzle</span>
{/snippet}

<Story name="Con Header y menú lateral">
	{#snippet template(args)}
		<Drawer {...args}>
			{#snippet children({ drawerId })}
				<Header title={brand} {routes} menuToggleFor={drawerId} />
				<main class="p-4">
					<h1 class="text-lg">Contenido de la página</h1>
					<p>En móvil, el botón hamburguesa del Header abre este cajón.</p>
				</main>
			{/snippet}
			{#snippet side()}
				<NavBarList {routes} type="drawer" />
			{/snippet}
		</Drawer>
	{/snippet}
</Story>

<!-- Sin `Header`: el disparador lo pone el consumidor con un `<label for>`. -->
<Story name="Con disparador propio">
	{#snippet template(args)}
		<Drawer {...args}>
			{#snippet children({ drawerId })}
				<div class="p-4">
					<label for={drawerId} class="btn btn-primary">Abrir el cajón</label>
				</div>
			{/snippet}
			{#snippet side()}
				<NavBarList {routes} type="drawer" />
			{/snippet}
		</Drawer>
	{/snippet}
</Story>
