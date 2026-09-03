<script module lang="ts">
	import { createLoginSchema } from '@callepuzzle/core/schema';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { createFakeEmailOtpClient } from '../../.storybook/mocks/auth-client.js';
	import FormLoginOtp from '../components/FormLoginOtp.svelte';

	/**
	 * `FormLoginOtp` se publica por el subpath `@callepuzzle/svelte-ui/otp` porque necesita
	 * `bits-ui` (peer opcional). El cliente falso acepta `123456` como código válido.
	 */
	const { Story } = defineMeta({
		title: 'Auth/FormLoginOtp',
		component: FormLoginOtp,
		tags: ['autodocs'],
		args: { authClient: createFakeEmailOtpClient({ delay: 400 }) },
		argTypes: {
			authClient: { control: false },
			schema: { control: false },
			onSuccess: { control: false },
			startOverHref: { control: 'text' },
			debug: { control: 'boolean' }
		}
	});
</script>

<!-- Paso 1: el correo. Paso 2: teclear `123456`. -->
<Story name="Éxito" />

<Story name="Con enlace para empezar de nuevo" args={{ startOverHref: '/' }} />

<Story
	name="Error al pedir el código"
	args={{ authClient: createFakeEmailOtpClient({ outcome: 'error', delay: 400 }) }}
/>

<Story
	name="Demasiados intentos (429)"
	args={{ authClient: createFakeEmailOtpClient({ outcome: 'rateLimited', delay: 400 }) }}
/>

<!-- El código sólo falla en el segundo paso: útil para ver el mensaje de código inválido. -->
<Story
	name="Código inválido"
	args={{ authClient: createFakeEmailOtpClient({ verifyOutcome: 'error', delay: 400 }) }}
/>

<Story
	name="En castellano"
	args={{
		schema: createLoginSchema({
			emailError: 'Escribe un correo electrónico válido',
			emailPlaceholder: 'tu@ejemplo.com',
			emailDescription: 'Te enviaremos un código de un solo uso'
		}),
		strings: {
			required: 'Obligatorio',
			optional: 'Opcional',
			signIn: 'Enviar el código',
			stepEmail: 'Correo',
			stepOtp: 'Código',
			otpLabel: 'Código de un solo uso',
			otpDescription: 'Teclea el código de 6 dígitos que te hemos enviado.',
			success: 'Sesión iniciada.',
			rateLimited: 'Demasiados intentos. Vuelve a probar en unos minutos.',
			invalidCode: 'Ese código no es válido. Compruébalo e inténtalo otra vez.',
			error: 'Algo ha ido mal. Inténtalo otra vez.',
			startOver: 'Empezar de nuevo'
		}
	}}
/>
