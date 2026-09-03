<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { createFakeSignOutClient } from '../../.storybook/mocks/auth-client.js';
	import Header from '../components/Header.svelte';
	import NavBarEnd from '../components/NavBarEnd.svelte';
	import NavBarList from '../components/NavBarList.svelte';
	import { routes, routesEs, userWithImage } from './fixtures.js';

	/**
	 * `title` es un **`Snippet`**, no un `string` (H10.3/T7.13): así el consumidor puede poner
	 * un `<img>` con su logotipo. Y `navEnd`/`navCenter` también son snippets, en vez de la
	 * intersección de props que había antes; ya no se pasa ningún `authClient={{}}`.
	 */
	const { Story } = defineMeta({
		title: 'Layout/Header',
		component: Header,
		tags: ['autodocs'],
		args: { routes },
		argTypes: {
			title: { control: false },
			navEnd: { control: false },
			navCenter: { control: false },
			routes: { control: 'object' },
			homeHref: { control: 'text' },
			showBack: { control: 'boolean' },
			menuToggleFor: { control: 'text' }
		}
	});
</script>

{#snippet brand()}
	<span class="text-xl font-bold">CallePuzzle</span>
{/snippet}

<Story name="Sólo marca y menú">
	{#snippet template(args)}
		<Header {...args} title={brand} />
	{/snippet}
</Story>

<Story name="Con enlace a inicio" args={{ homeHref: '/' }}>
	{#snippet template(args)}
		<Header {...args} title={brand} />
	{/snippet}
</Story>

<!-- La zona derecha es un snippet: aquí, el `NavBarEnd` con su usuario y su cliente falso. -->
<Story name="Con NavBarEnd">
	{#snippet template(args)}
		<Header {...args} title={brand}>
			{#snippet navEnd()}
				<NavBarEnd
					user={userWithImage}
					authClient={createFakeSignOutClient()}
					profileHref="/settings"
					notificationsHref="/notifications"
					userHasNotification
					searcher
				/>
			{/snippet}
		</Header>
	{/snippet}
</Story>

<!-- `navCenter` sustituye al menú derivado de `routes`. -->
<Story name="Con menú central propio">
	{#snippet template(args)}
		<Header {...args} title={brand}>
			{#snippet navCenter()}
				<NavBarList {routes} type="horizontal" class="menu-sm" />
			{/snippet}
		</Header>
	{/snippet}
</Story>

<!-- Botón "atrás": sólo se ve por debajo de `lg`. -->
<Story name="Con botón atrás" args={{ showBack: true }}>
	{#snippet template(args)}
		<Header {...args} title={brand} />
	{/snippet}
</Story>

<!-- Todos los textos accesibles inyectados en castellano. -->
<Story
	name="En castellano"
	args={{
		routes: routesEs,
		homeHref: '/',
		showBack: true,
		strings: { back: 'Atrás', openSidebar: 'Abrir el menú', navLabel: 'Menú principal' }
	}}
>
	{#snippet template(args)}
		<Header {...args} title={brandEs} />
	{/snippet}
</Story>

{#snippet brandEs()}
	<span class="text-xl font-bold">Mi tienda</span>
{/snippet}
