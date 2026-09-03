<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { createLoginSchema } from '@callepuzzle/core/schema';
	import { FormLoginMagicLink, Modal } from '@callepuzzle/svelte-ui';
	import { FormLoginOtp } from '@callepuzzle/svelte-ui/otp';
	import { authClient } from '$lib/auth-client';
	import { m } from '$lib/paraglide/messages.js';
	import { getUiStrings } from '$lib/ui-strings';

	let { buttonClass = 'btn btn-sm btn-primary' }: { buttonClass?: string } = $props();

	const t = $derived(getUiStrings());

	// El schema se construye aquí, en render: sus mensajes de validación y su placeholder son
	// texto visible, y también tienen que salir del idioma activo. `createLoginSchema` es una
	// factoría justamente para eso.
	const schema = $derived(createLoginSchema(t.loginSchema));

	// `bind:this` sobre el `Modal`: la librería ya no cierra el diálogo por su cuenta (antes lo
	// hacía con un `setTimeout`). Quien abre el modal es quien lo cierra.
	let modal: Modal | undefined = $state();

	let flow = $state<'magic-link' | 'otp'>('magic-link');

	/**
	 * La librería no navega ni invalida datos: solo avisa de que el paso ha ido bien. Recargar
	 * la sesión (`invalidateAll`) y cerrar el diálogo son decisiones de la app.
	 */
	async function onSuccess() {
		await invalidateAll();
		modal?.close();
	}
</script>

<Modal
	bind:this={modal}
	title={m.ui_sign_in()}
	type="X"
	{buttonClass}
	strings={t.modal}
	aria-label={m.ui_sign_in()}
>
	<h3 class="text-lg font-bold">{m.ui_sign_in()}</h3>

	<!-- Los dos flujos que expone la librería, para poder comparar el mismo login en ambos. -->
	<div role="tablist" class="my-4 tabs tabs-box">
		<button
			type="button"
			role="tab"
			class="tab"
			class:tab-active={flow === 'magic-link'}
			aria-selected={flow === 'magic-link'}
			onclick={() => (flow = 'magic-link')}
		>
			{m.app_login_flow_magic_link()}
		</button>
		<button
			type="button"
			role="tab"
			class="tab"
			class:tab-active={flow === 'otp'}
			aria-selected={flow === 'otp'}
			onclick={() => (flow = 'otp')}
		>
			{m.app_login_flow_otp()}
		</button>
	</div>

	{#if flow === 'magic-link'}
		<FormLoginMagicLink
			{authClient}
			{schema}
			callbackURL="/"
			strings={t.formLoginMagicLink}
			{onSuccess}
		/>
	{:else}
		<!-- `FormLoginOtp` vive en el subpath `/otp` porque necesita `bits-ui` (peer opcional). -->
		<FormLoginOtp {authClient} {schema} strings={t.formLoginOtp} {onSuccess} />
	{/if}

	<p class="mt-4 text-xs opacity-70">{m.app_login_dev_notice()}</p>
</Modal>
