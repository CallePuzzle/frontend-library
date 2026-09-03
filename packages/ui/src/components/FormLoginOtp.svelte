<script lang="ts">
	import {
		createLoginSchema,
		zodToFieldsJsonSchema,
		type LoginSchema
	} from '@callepuzzle/core/schema';
	import Inbox from '@lucide/svelte/icons/inbox';
	import { PinInput, REGEXP_ONLY_DIGITS, type PinInputRootSnippetProps } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import type { EmailOtpClient } from '../types.js';
	import { cn } from '../utils.js';
	import FormFields from './FormFields.svelte';
	import { defaultFormLoginOtpStrings, type FormLoginOtpStrings } from './FormLoginOtp.strings.js';

	type Props = {
		/**
		 * Cliente de better-auth con el plugin `emailOtp`. Se recibe por prop: la librería no
		 * importa `@callepuzzle/auth`, solo exige esta forma (ver `EmailOtpClient`).
		 */
		authClient: EmailOtpClient;
		/**
		 * Schema del primer paso. Por defecto, `createLoginSchema()` con los textos en inglés.
		 * Pásalo para traducirlo o para extenderlo (`schema.extend({ … })`).
		 */
		schema?: LoginSchema;
		/** Pinta `SuperDebug` bajo el formulario. Solo para desarrollo. */
		debug?: boolean;
		/**
		 * Se llama cuando la sesión ya está creada. **Aquí es donde el consumidor debe
		 * invalidar los datos** (`invalidateAll()` en SvelteKit) o navegar: la librería no
		 * toca la navegación ni el estado de la app.
		 */
		onSuccess?: () => void | Promise<void>;
		/**
		 * Destino del enlace «empezar de nuevo». Si no se pasa, el enlace no se pinta: la
		 * librería no decide las rutas del consumidor.
		 */
		startOverHref?: string;
		class?: string;
		strings?: Partial<FormLoginOtpStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class'>;

	let {
		authClient,
		schema,
		debug = false,
		onSuccess,
		startOverHref,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const t = $derived({ ...defaultFormLoginOtpStrings, ...strings });

	// El schema por defecto se construye **por instancia**, nunca en scope de módulo: así los
	// textos (que el consumidor puede haber traducido) se resuelven en render.
	const activeSchema = schema ?? createLoginSchema();

	const uid = $props.id();

	let step = $state<1 | 2>(1);
	let email = $state('');
	let otp = $state('');
	let verifying = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	/** El 429 tiene mensaje propio; el resto de fallos, uno genérico. */
	function errorText(status: number | undefined, fallback: string): string {
		return status === 429 ? t.rateLimited : fallback;
	}

	const form = superForm(defaults(zod4(activeSchema)), {
		id: uid,
		// No hay action en el servidor: el OTP lo pide el cliente de better-auth. `SPA: true`
		// deja que superforms valide en cliente y nos entregue el resultado en `onUpdate`.
		SPA: true,
		validators: zod4Client(activeSchema),
		async onUpdate({ form: validated }) {
			if (!validated.valid) return;

			message = null;
			try {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email: validated.data.email,
					type: 'sign-in'
				});

				if (error) {
					message = { type: 'error', text: errorText(error.status, t.error) };
					return;
				}

				email = validated.data.email;
				otp = '';
				step = 2;
			} catch {
				message = { type: 'error', text: t.error };
			}
		}
	});

	const { form: formData, enhance, delayed } = form;

	const fields = $derived(zodToFieldsJsonSchema(activeSchema));

	type CellProps = PinInputRootSnippetProps['cells'][number];

	async function verify() {
		verifying = true;
		message = null;
		try {
			const { error } = await authClient.signIn.emailOtp({ email, otp });

			if (error) {
				otp = '';
				message = { type: 'error', text: errorText(error.status, t.invalidCode) };
				return;
			}

			message = { type: 'success', text: t.success };
			await onSuccess?.();
		} catch {
			otp = '';
			message = { type: 'error', text: t.error };
		} finally {
			verifying = false;
		}
	}
</script>

{#snippet notice(kind: 'success' | 'error', text: string)}
	<div
		class="alert {kind === 'success' ? 'alert-success' : 'alert-error'} text-sm"
		role={kind === 'error' ? 'alert' : 'status'}
	>
		{text}
	</div>
{/snippet}

<div {...rest} class={cn('mx-auto flex max-w-xs flex-col justify-center', className)}>
	<ul class="steps">
		<li class="step step-primary">{t.stepEmail}</li>
		<li class="step {step === 2 ? 'step-primary' : ''}">{t.stepOtp}</li>
	</ul>
	<div class="divider"></div>

	{#if step === 1}
		<form method="POST" class="flex flex-col" use:enhance>
			<FormFields {form} {formData} {fields} strings={t} />
			<div class="my-2 flex justify-center">
				{#if $delayed}
					<span class="loading loading-lg loading-dots"></span>
				{:else if message}
					{@render notice(message.type, message.text)}
				{:else}
					<button class="btn btn-accent" type="submit"><Inbox />{t.signIn}</button>
				{/if}
			</div>
		</form>
		{#if debug}
			<!-- Import dinámico: `SuperDebug` no debe viajar al bundle de producción. -->
			{#await import('sveltekit-superforms') then { default: SuperDebug }}
				<SuperDebug data={$formData} />
			{/await}
		{/if}
	{:else}
		<div class="flex flex-col items-center gap-2">
			{#if verifying}
				<span class="loading loading-lg loading-dots"></span>
			{:else if message?.type === 'success'}
				{@render notice('success', message.text)}
			{:else}
				<PinInput.Root
					bind:value={otp}
					class="group/pininput flex items-center gap-1 has-disabled:opacity-30"
					maxlength={6}
					pattern={REGEXP_ONLY_DIGITS}
					aria-label={t.otpLabel}
					onComplete={verify}
				>
					{#snippet children({ cells })}
						{#each cells as cell, index (index)}
							{@render pinCell(cell)}
						{/each}
					{/snippet}
				</PinInput.Root>
				{#if message}
					{@render notice(message.type, message.text)}
				{/if}
				<p class="fieldset-label py-2">{t.otpDescription}</p>
			{/if}
		</div>
	{/if}

	{#if startOverHref}
		<div class="flex justify-center">
			<a class="btn btn-error" href={startOverHref} data-sveltekit-reload>{t.startOver}</a>
		</div>
	{/if}
</div>

{#snippet pinCell(cell: CellProps)}
	<PinInput.Cell
		{cell}
		class="input relative flex h-14 w-10 items-center justify-center px-0 text-center text-2xl
		data-active:outline data-active:outline-primary"
	>
		{#if cell.char}
			{cell.char}
		{:else if cell.hasFakeCaret}
			<div class="h-8 w-px animate-pulse bg-base-content"></div>
		{/if}
	</PinInput.Cell>
{/snippet}
