<script lang="ts">
	import {
		createLoginSchema,
		zodToFieldsJsonSchema,
		type LoginSchema
	} from '@callepuzzle/core/schema';
	import Inbox from '@lucide/svelte/icons/inbox';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import type { MagicLinkClient } from '../types.js';
	import { cn } from '../utils.js';
	import FormFields from './FormFields.svelte';
	import {
		defaultFormLoginMagicLinkStrings,
		type FormLoginMagicLinkStrings
	} from './FormLoginMagicLink.strings.js';

	type Props = {
		/**
		 * Cliente de better-auth con el plugin `magicLink`. Se recibe por prop: la librería no
		 * importa `@callepuzzle/auth`, solo exige esta forma (ver `MagicLinkClient`).
		 */
		authClient: MagicLinkClient;
		/**
		 * Schema del formulario. Por defecto, `createLoginSchema()` con los textos en inglés.
		 * Pásalo para traducirlo o para extenderlo (`schema.extend({ … })`): los campos extra
		 * se renderizan solos, porque `FormFields` los deriva del schema en tiempo de ejecución.
		 */
		schema?: LoginSchema;
		/** A dónde vuelve el usuario tras pinchar el enlace del correo. */
		callbackURL?: string;
		/** Pinta `SuperDebug` bajo el formulario. Solo para desarrollo. */
		debug?: boolean;
		/**
		 * Se llama tras enviar el enlace con éxito. Es el sitio del consumidor para cerrar un
		 * modal, navegar o invalidar datos: la librería no toca la navegación de la app.
		 */
		onSuccess?: () => void | Promise<void>;
		class?: string;
		strings?: Partial<FormLoginMagicLinkStrings>;
	} & Omit<HTMLFormAttributes, 'class' | 'method'>;

	let {
		authClient,
		schema,
		callbackURL,
		debug = false,
		onSuccess,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const t = $derived({ ...defaultFormLoginMagicLinkStrings, ...strings });

	// El schema por defecto se construye **por instancia**, nunca en scope de módulo: así los
	// textos (que el consumidor puede haber traducido) se resuelven en render.
	const activeSchema = schema ?? createLoginSchema();

	const uid = $props.id();

	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	const form = superForm(defaults(zod4(activeSchema)), {
		id: uid,
		// No hay action en el servidor: el login lo hace el cliente de better-auth. `SPA: true`
		// deja que superforms valide en cliente y nos entregue el resultado en `onUpdate`.
		SPA: true,
		validators: zod4Client(activeSchema),
		async onUpdate({ form: validated }) {
			if (!validated.valid) return;

			message = null;
			try {
				const { error } = await authClient.signIn.magicLink({
					email: validated.data.email,
					callbackURL
				});

				if (error) {
					// Nunca se enseña el status ni el statusText: al usuario le sirve saber si
					// tiene que esperar (429) o reintentar, no el código HTTP.
					message = { type: 'error', text: error.status === 429 ? t.rateLimited : t.error };
					return;
				}

				message = { type: 'success', text: t.magicLinkSent };
				await onSuccess?.();
			} catch {
				message = { type: 'error', text: t.error };
			}
		}
	});

	const { form: formData, enhance, delayed } = form;

	const fields = $derived(zodToFieldsJsonSchema(activeSchema));
</script>

<form {...rest} method="POST" class={cn('mx-auto flex max-w-xs flex-col', className)} use:enhance>
	<FormFields {form} {formData} {fields} strings={t} />
	<div class="my-2 flex justify-center">
		{#if $delayed}
			<span class="loading loading-lg loading-dots"></span>
		{:else if message}
			<div
				class="alert {message.type === 'success' ? 'alert-success' : 'alert-error'} text-sm"
				role={message.type === 'error' ? 'alert' : 'status'}
			>
				{message.text}
			</div>
		{:else}
			<button class="btn btn-accent" type="submit"><Inbox />{t.signIn}</button>
		{/if}
	</div>
</form>
{#if debug}
	<!-- Import dinámico: `SuperDebug` no debe viajar al bundle de producción del consumidor. -->
	{#await import('sveltekit-superforms') then { default: SuperDebug }}
		<SuperDebug data={$formData} />
	{/await}
{/if}
