<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { createFakeSignOutClient } from '../../.storybook/mocks/auth-client.js';
	import ButtonSignOut from '../components/ButtonSignOut.svelte';

	/**
	 * `authClient` llega por prop y se tipa estructuralmente (`SignOutClient`): aquí es el
	 * cliente falso de `.storybook/mocks/`, así que la story no necesita backend. El `goto()`
	 * posterior lo absorbe el mock de `$app/navigation` (registra el destino y no navega).
	 */
	const { Story } = defineMeta({
		title: 'Auth/ButtonSignOut',
		component: ButtonSignOut,
		tags: ['autodocs'],
		args: { authClient: createFakeSignOutClient({ delay: 300 }), class: 'btn btn-error' },
		argTypes: {
			authClient: { control: false },
			children: { control: false },
			redirectTo: { control: 'text' }
		}
	});
</script>

<Story name="Por defecto" />

<!-- `redirectTo: null` cierra sesión sin navegar. -->
<Story name="Sin redirección" args={{ redirectTo: null }} />

<Story name="Con contenido propio">
	{#snippet template(args)}
		<ButtonSignOut {...args}>
			<LogOut size={16} />
			Salir
		</ButtonSignOut>
	{/snippet}
</Story>

<Story name="En castellano" args={{ strings: { signOut: 'Cerrar sesión' } }} />
