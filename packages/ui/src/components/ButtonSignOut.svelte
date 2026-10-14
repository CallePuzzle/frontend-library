<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		defaultButtonSignOutStrings,
		type ButtonSignOutStrings
	} from './ButtonSignOut.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import type { SignOutClient } from '../types.js';
	import { cn } from '../utils.js';

	export type Props = {
		/** Cliente de auth. Se tipa estructuralmente: la librería no importa `@callepuzzle/auth`. */
		authClient: SignOutClient;
		/** Ruta a la que ir tras cerrar sesión. `'/'` por defecto; `null` para no navegar. */
		redirectTo?: string | null;
		/**
		 * Se llama tras cerrar sesión y antes de navegar: es el sitio del consumidor para
		 * invalidar datos o limpiar estado. La librería no toca los datos de la app.
		 */
		onSignOut?: () => void | Promise<void>;
		/** Contenido del botón. Por defecto, el texto de `strings.signOut`. */
		children?: Snippet;
		class?: string;
		strings?: Partial<ButtonSignOutStrings>;
		// `type` fuera del rest: siempre es `button`, para no enviar el `<form>` que lo contenga.
	} & Omit<HTMLButtonAttributes, 'class' | 'children' | 'onclick' | 'type'>;

	let {
		authClient,
		redirectTo = '/',
		onSignOut,
		children,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({
		...defaultButtonSignOutStrings,
		...contextStrings.buttonSignOut,
		...strings
	});

	async function signOut() {
		await authClient.signOut();
		await onSignOut?.();
		if (redirectTo !== null) {
			// Mismo motivo que en `Link`: la librería no conoce el `RouteId` del consumidor.
			await goto(resolve(redirectTo as Parameters<typeof resolve>[0]));
		}
	}
</script>

<button type="button" class={cn(className)} onclick={signOut} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		{t.signOut}
	{/if}
</button>
