<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Modal from '../components/Modal.svelte';
	import UserNotLogged from '../components/UserNotLogged.svelte';

	/**
	 * El componente sólo avisa; no abre nada por su cuenta. La acción entra por el snippet
	 * `action`, que es donde el consumidor pone su propio flujo de login.
	 */
	const { Story } = defineMeta({
		title: 'Auth/UserNotLogged',
		component: UserNotLogged,
		tags: ['autodocs'],
		argTypes: {
			text: { control: 'text' },
			children: { control: false },
			action: { control: false }
		}
	});
</script>

<Story name="Por defecto" />

<Story name="Con texto propio" args={{ text: 'Esta página es sólo para clientes.' }} />

<Story name="Con acción">
	{#snippet template(args)}
		<UserNotLogged {...args}>
			{#snippet action()}
				<Modal title="Iniciar sesión" type="X" buttonClass="btn btn-primary">
					<p>Aquí va el formulario de login del consumidor.</p>
				</Modal>
			{/snippet}
		</UserNotLogged>
	{/snippet}
</Story>

<Story name="En castellano" args={{ strings: { text: 'Tienes que iniciar sesión.' } }} />
