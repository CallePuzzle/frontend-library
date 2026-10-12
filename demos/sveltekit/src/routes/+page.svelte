<script lang="ts">
	import { zodToFieldsJsonSchema } from '@callepuzzle/core/schema';
	import { FormFields, Link, Modal, UserNotLogged } from '@callepuzzle/svelte-ui';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { z } from 'zod/v4';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getUiStrings } from '$lib/ui-strings';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = $derived(getUiStrings());

	/**
	 * Un schema de zod cualquiera, con los textos del campo declarados en `.meta()`. Va en
	 * `$derived` (y no en un `const` ni en scope de módulo): sus mensajes son texto visible,
	 * así que tiene que re-derivarse al cambiar de idioma para que etiquetas, placeholders y
	 * descripciones se re-traduzcan.
	 *
	 * `description` es lo que `FormFields` usa como etiqueta del campo cuando no se le pasa
	 * `label`; `placeholder` va al input.
	 */
	const profileSchema = $derived(
		z.object({
			name: z.string().min(2, m.app_profile_name_error()).meta({
				description: m.app_profile_name(),
				placeholder: m.app_profile_name_placeholder()
			}),
			email: z.email(m.ui_login_email_error()).meta({
				description: m.app_profile_email(),
				placeholder: m.ui_login_email_placeholder()
			}),
			age: z
				.number()
				.min(18, m.app_profile_age_error())
				.max(120)
				.meta({ description: m.app_profile_age() }),
			role: z.enum(['admin', 'editor', 'viewer']).meta({ description: m.app_profile_role() }),
			bio: z
				.string()
				.meta({
					description: m.app_profile_bio(),
					placeholder: m.app_profile_bio_placeholder(),
					// Convención de la librería: `format: 'textarea'` pinta un `<textarea>`.
					format: 'textarea'
				})
				.default(''),
			newsletter: z.boolean().meta({ description: m.app_profile_newsletter() }).default(false)
		})
	);

	/** La lista de campos sale del schema en tiempo de ejecución, no se escribe a mano. */
	const fields = $derived(zodToFieldsJsonSchema(profileSchema));

	let validated = $state<string | null>(null);

	// `SPA: true`: este formulario no tiene action en el servidor, es solo una demostración de
	// validación en cliente. `onUpdate` (y no `onSubmit`) porque en superforms 2.27 `onSubmit`
	// corre antes de validar.
	//
	// Matiz: `superForm` captura el schema en la creación, así que los *mensajes de validación*
	// conservan el idioma inicial; etiquetas y placeholders (lo que renderiza `FormFields`) sí
	// re-traducen, porque `fields` es `$derived`.
	const form = superForm(defaults(zod4(profileSchema)), {
		SPA: true,
		validators: zod4Client(profileSchema),
		onUpdate({ form: result }) {
			if (result.valid) validated = JSON.stringify(result.data, null, 2);
		}
	});

	const { form: formData, enhance } = form;
</script>

<h1 class="text-2xl font-bold">{m.app_home_title()}</h1>
<p class="mt-2 max-w-3xl">{m.app_home_intro()}</p>

<section class="mt-8">
	<h2 class="text-xl font-semibold">{m.app_home_session_title()}</h2>
	{#if data.user}
		<p class="mt-2" data-testid="session-state">
			{m.app_home_session_in({ email: data.user.email })}
		</p>
	{:else}
		<p class="mt-2" data-testid="session-state">{m.app_home_session_out()}</p>
	{/if}
</section>

<section class="mt-8">
	<h2 class="text-xl font-semibold">{m.app_home_link_title()}</h2>
	<p class="mt-2 max-w-3xl">{m.app_home_link_body()}</p>
	<!-- `href` es la clave del mapa de rutas; con `route` (como en `NavBarList` o `Dock`) el
	     enlace pintaría además su icono. -->
	<Link href="/admin" label={m.routes_admin()} class="btn mt-2 btn-outline" />
</section>

<section class="mt-8">
	<h2 class="text-xl font-semibold">{m.app_home_modal_title()}</h2>
	<p class="mt-2 max-w-3xl">{m.app_home_modal_body()}</p>
	<Modal
		title={m.app_home_modal_open()}
		type="X"
		buttonClass="btn mt-2 btn-secondary"
		strings={t.modal}
	>
		<h3 class="text-lg font-bold">{m.app_home_modal_title()}</h3>
		<p class="py-4">{m.app_home_modal_content()}</p>
	</Modal>
</section>

<section class="mt-8">
	<h2 class="text-xl font-semibold">{m.app_home_form_title()}</h2>
	<p class="mt-2 max-w-3xl">{m.app_home_form_body()}</p>
	<form method="POST" class="mt-2 max-w-md" use:enhance>
		<FormFields {form} {formData} {fields} strings={t.formFields} />
		<button type="submit" class="btn mt-4 btn-primary">{m.app_home_form_submit()}</button>
	</form>
	{#if validated}
		<div class="mt-4 max-w-md">
			<p class="font-semibold">{m.app_home_form_result()}</p>
			<pre class="mt-2 overflow-x-auto rounded-box bg-base-200 p-4 text-xs">{validated}</pre>
		</div>
	{/if}
</section>

<section class="mt-8">
	<h2 class="text-xl font-semibold">{m.app_home_not_logged_title()}</h2>
	<p class="mt-2 max-w-3xl">{m.app_home_not_logged_body()}</p>
	<!-- `class` gana al default de la librería: `cn()` resuelve `min-h-screen` vs `min-h-fit`. -->
	<UserNotLogged class="mt-2 min-h-fit rounded-box" strings={t.userNotLogged}>
		{#snippet action()}
			<LoginModal buttonClass="btn btn-primary" />
		{/snippet}
	</UserNotLogged>
</section>
