<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Plus from '@lucide/svelte/icons/plus';
	import Dock from '../components/Dock.svelte';
	import Link from '../components/Link.svelte';
	import { routes, routesEs } from './fixtures.js';

	const { Story } = defineMeta({
		title: 'Navigation/Dock',
		component: Dock,
		tags: ['autodocs'],
		args: { routes, currentPath: '/' },
		argTypes: {
			currentPath: { control: 'text' },
			routes: { control: 'object' },
			children: { control: false }
		}
	});
</script>

<!--
	`getMenuRoutes(routes, { mobile: true })` filtra **estricto** por `showInMobile`: aquí
	entran `/`, `/shop` y `/notifications`, pero no `/settings` (que sólo tiene `showInMenu`).
	El dock está oculto a partir de `lg`, así que hay que mirarlo en un viewport estrecho.
-->
<Story name="Ruta activa: inicio" />

<Story name="Ruta activa: tienda" args={{ currentPath: '/shop' }} />

<!-- El snippet `children` es el punto de extensión para lo que no es una página. -->
<Story name="Con entrada extra">
	{#snippet template(args)}
		<Dock {...args}>
			<Link href="/shop" class="dock-active">
				<Plus size={20} />
				<span class="dock-label">Nuevo</span>
			</Link>
		</Dock>
	{/snippet}
</Story>

<!-- Textos y etiquetas en castellano: `strings` para el `aria-label` del `<nav>`. -->
<Story
	name="En castellano"
	args={{
		routes: routesEs,
		currentPath: '/',
		strings: { navLabel: 'Navegación inferior' }
	}}
/>
