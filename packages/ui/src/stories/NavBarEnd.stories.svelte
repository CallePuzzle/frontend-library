<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { createFakeSignOutClient } from '../../.storybook/mocks/auth-client.js';
	import Modal from '../components/Modal.svelte';
	import NavBarEnd from '../components/NavBarEnd.svelte';
	import { userWithImage, userWithoutImage } from './fixtures.js';

	/**
	 * Una story por **estado significativo**, no la matriz de booleanos que había antes
	 * (B16/H10.1): `searcher`, `userHasNotification` y compañía se exploran con los controles.
	 *
	 * Ya no existen `userIsLogged`, `session` ni un `authClient` como store: el usuario entra
	 * como dato plano y el cliente de auth sólo se usa para el "cerrar sesión".
	 */
	const { Story } = defineMeta({
		title: 'Navigation/NavBarEnd',
		component: NavBarEnd,
		tags: ['autodocs'],
		args: {
			authClient: createFakeSignOutClient(),
			profileHref: '/settings',
			notificationsHref: '/notifications'
		},
		argTypes: {
			user: { control: 'object' },
			authClient: { control: false },
			searcher: { control: 'boolean' },
			userHasNotification: { control: 'boolean' },
			profileHref: { control: 'text' },
			notificationsHref: { control: 'text' },
			locales: { control: 'object' },
			setLocale: { control: false },
			login: { control: false },
			avatar: { control: false },
			menuExtra: { control: false }
		}
	});
</script>

<!--
	Sin usuario se renderiza el snippet `login`: el componente ya no embute ningún formulario,
	el flujo de auth (magic link, OTP, lo que sea) lo decide el consumidor.
-->
<Story name="Sin usuario" args={{ user: null }}>
	{#snippet template(args)}
		<NavBarEnd {...args}>
			{#snippet login()}
				<Modal title="Sign in" type="X" buttonClass="btn btn-accent">
					<p>Aquí va el formulario de login del consumidor.</p>
				</Modal>
			{/snippet}
		</NavBarEnd>
	{/snippet}
</Story>

<Story name="Con usuario e imagen" args={{ user: userWithImage }} />

<!-- Sin `image` se pinta la inicial del nombre visible; no se inventa ningún avatar. -->
<Story name="Con usuario sin imagen" args={{ user: userWithoutImage }} />

<Story
	name="Con notificación"
	args={{ user: userWithImage, userHasNotification: true, searcher: true }}
/>

<!-- El selector sólo aparece con dos o más idiomas **y** con `setLocale`. -->
<Story
	name="Con selector de idioma"
	args={{
		user: userWithoutImage,
		locales: ['es', 'en'],
		setLocale: (locale: string) => console.info('setLocale', locale),
		strings: {
			language: 'Idioma',
			userMenu: 'Menú de usuario',
			profile: 'Perfil',
			signOut: 'Cerrar sesión',
			notifications: 'Notificaciones',
			search: 'Buscar',
			avatarAlt: (name: string) => `Avatar de ${name}`
		}
	}}
/>

<!-- `avatar` y `menuExtra`: los dos puntos de extensión del menú de usuario. -->
<Story name="Con avatar y menú propios" args={{ user: userWithoutImage }}>
	{#snippet template(args)}
		<NavBarEnd {...args}>
			{#snippet avatar(user)}
				<div class="flex h-full w-full items-center justify-center bg-primary text-primary-content">
					{user.name?.slice(0, 2)}
				</div>
			{/snippet}
			{#snippet menuExtra()}
				<li><a href="#billing">Facturación</a></li>
			{/snippet}
		</NavBarEnd>
	{/snippet}
</Story>
