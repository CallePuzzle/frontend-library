<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Link from '../components/Link.svelte';
	import { shopRoute } from './fixtures.js';

	const { Story } = defineMeta({
		title: 'Navigation/Link',
		component: Link,
		tags: ['autodocs'],
		args: { class: 'link' },
		argTypes: {
			href: { control: 'text', description: 'Clave del RouteMap, no una URL ya resuelta' },
			label: { control: 'text' },
			route: { control: false },
			children: { control: false }
		}
	});
</script>

<!-- Con `label`: el caso de un enlace suelto, que no sale de ningún `RouteMap`. -->
<Story name="Con etiqueta" args={{ href: '/legal/privacy', label: 'Privacy policy' }} />

<!-- Con `route`: icono y etiqueta salen de la entrada del mapa. -->
<Story name="Con ruta" args={{ href: shopRoute.id, route: shopRoute }} />

<!-- Con `children`: el contenido manda sobre `route` y `label`. -->
<Story name="Con contenido propio" args={{ href: '/' }}>
	{#snippet template(args)}
		<Link {...args}>
			<strong>Contenido propio</strong>
		</Link>
	{/snippet}
</Story>
