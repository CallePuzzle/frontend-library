<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import {
		defaultUserNotLoggedStrings,
		type UserNotLoggedStrings
	} from './UserNotLogged.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import { cn } from '../utils.js';

	export type Props = {
		/** Mensaje del aviso. Por defecto, `strings.text`. */
		text?: string;
		/** Contenido del aviso, si hace falta más que un texto. Tiene prioridad sobre `text`. */
		children?: Snippet;
		/**
		 * Acción bajo el aviso (p. ej. un botón que abre el modal de login). El componente **no**
		 * abre nada por su cuenta: quien decide qué pasa es el consumidor.
		 */
		action?: Snippet;
		class?: string;
		strings?: Partial<UserNotLoggedStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'>;

	let { text, children, action, class: className, strings, ...rest }: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({
		...defaultUserNotLoggedStrings,
		...contextStrings.userNotLogged,
		...strings
	});
	const message = $derived(text ?? t.text);
</script>

<div class={cn('hero min-h-screen bg-base-200', className)} {...rest}>
	<div class="hero-content">
		<div class="flex max-w-md flex-col items-center gap-4">
			<div role="alert" class="alert alert-error">
				<CircleX aria-hidden="true" />
				<span>
					{#if children}
						{@render children()}
					{:else}
						{message}
					{/if}
				</span>
			</div>
			{#if action}
				{@render action()}
			{/if}
		</div>
	</div>
</div>
