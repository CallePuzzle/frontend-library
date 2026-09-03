<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NavBarList from '../components/NavBarList.svelte';
	import { routes, routesEs } from './fixtures.js';

	const { Story } = defineMeta({
		title: 'Navigation/NavBarList',
		component: NavBarList,
		tags: ['autodocs'],
		args: { routes },
		argTypes: {
			type: { control: 'inline-radio', options: ['horizontal', 'drawer'] },
			routes: { control: 'object' }
		}
	});
</script>

<Story name="Horizontal" args={{ type: 'horizontal' }} />

<Story name="Cajón" args={{ type: 'drawer' }} />

<!--
	Sólo salen las entradas con `showInMenu: true`: `/notifications` (sólo `showInMobile`) y
	`/legal/privacy` (sin flags) no se pintan. El filtrado es de `getMenuRoutes`.
-->
<Story
	name="Filtrado por showInMenu"
	args={{
		type: 'horizontal',
		routes: {
			'/': { label: 'Visible', showInMenu: true },
			'/hidden': { label: 'Oculta' },
			'/mobile-only': { label: 'Solo dock', showInMobile: true }
		}
	}}
/>

<!-- Las etiquetas llegan traducidas desde el mapa: la librería no traduce nada. -->
<Story name="En castellano" args={{ type: 'horizontal', routes: routesEs }} />
