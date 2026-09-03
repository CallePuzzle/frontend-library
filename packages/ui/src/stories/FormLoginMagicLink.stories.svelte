<script module lang="ts">
	import { createLoginSchema } from '@callepuzzle/core/schema';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { createFakeMagicLinkClient } from '../../.storybook/mocks/auth-client.js';
	import FormLoginMagicLink from '../components/FormLoginMagicLink.svelte';

	/**
	 * Sustituye a la antigua `FromLogin.stories.svelte` (con el typo y con `formValidated`,
	 * un arg que no existía). Ahora el cliente de auth entra por prop, así que la story
	 * **no necesita backend**: el mock de `.storybook/mocks/auth-client.ts` simula los tres
	 * desenlaces que el componente distingue.
	 */
	const { Story } = defineMeta({
		title: 'Auth/FormLoginMagicLink',
		component: FormLoginMagicLink,
		tags: ['autodocs'],
		args: { authClient: createFakeMagicLinkClient({ delay: 400 }) },
		argTypes: {
			authClient: { control: false },
			schema: { control: false },
			onSuccess: { control: false },
			callbackURL: { control: 'text' },
			debug: { control: 'boolean' }
		}
	});
</script>

<!-- Escribe un correo válido y envía: sale el aviso de "mira tu bandeja". -->
<Story name="Éxito" args={{ callbackURL: '/' }} />

<Story
	name="Error del servidor"
	args={{ authClient: createFakeMagicLinkClient({ outcome: 'error', delay: 400 }) }}
/>

<!-- El 429 tiene mensaje propio: al usuario le sirve saber que tiene que esperar. -->
<Story
	name="Demasiados intentos (429)"
	args={{ authClient: createFakeMagicLinkClient({ outcome: 'rateLimited', delay: 400 }) }}
/>

<!--
	Inyección de textos completa: `strings` para el componente y `createLoginSchema({...})`
	para los mensajes de validación y el copy del campo. Es el patrón que tiene que aprender
	el consumidor; la librería no compila i18n.
-->
<Story
	name="En castellano"
	args={{
		schema: createLoginSchema({
			emailError: 'Escribe un correo electrónico válido',
			emailPlaceholder: 'tu@ejemplo.com',
			emailDescription: 'Te enviaremos un enlace para entrar'
		}),
		strings: {
			required: 'Obligatorio',
			optional: 'Opcional',
			signIn: 'Entrar',
			magicLinkSent: 'Mira tu correo: acabamos de enviarte un enlace para entrar.',
			rateLimited: 'Demasiados intentos. Vuelve a probar en unos minutos.',
			error: 'Algo ha ido mal. Inténtalo otra vez.'
		}
	}}
/>
