<script lang="ts">
	/**
	 * Andamio para las stories de los componentes de formulario.
	 *
	 * `FormString` y compañía no crean el formulario: reciben el objeto de `superForm()` y su
	 * store `form`. Eso es a propósito (así varios campos comparten un mismo formulario), pero
	 * obliga a que alguien lo construya. `superForm()` usa contexto y ciclo de vida, así que no
	 * puede llamarse en el `<script module>` de una story: de ahí este componente.
	 *
	 * No forma parte de la API pública; vive en `src/stories/` sólo para las stories.
	 */
	import { zodToFieldsJsonSchema, type Fields } from '@callepuzzle/core/schema';
	import type { Snippet } from 'svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { defaults, superForm, type SuperFormData } from 'sveltekit-superforms/client';
	import type { ZodObject } from 'zod/v4';

	type Data = Record<string, unknown>;

	type Props = {
		schema: ZodObject;
		/** Texto del botón de envío. Con `null` no se pinta. */
		submitLabel?: string | null;
		children: Snippet<
			[{ form: SuperForm<Data, unknown>; formData: SuperFormData<Data>; fields: Fields }]
		>;
	};

	let { schema, submitLabel = 'Enviar', children }: Props = $props();

	const uid = $props.id();

	// `ZodObject` sin parámetros de tipo infiere `{ [k: string]: unknown }` de formas que no
	// coinciden exactamente con `SuperForm<Data>`; el cast se concentra aquí, en el andamio,
	// para que las stories queden limpias.
	const form = superForm(defaults(zod4(schema)), {
		id: uid,
		SPA: true,
		validators: zod4Client(schema)
	}) as unknown as SuperForm<Data, unknown>;

	const { form: formData, enhance } = form;

	const fields = $derived(zodToFieldsJsonSchema(schema));
</script>

<form method="POST" class="mx-auto flex w-full max-w-sm flex-col gap-2 p-4" use:enhance>
	{@render children({ form, formData, fields })}
	{#if submitLabel !== null}
		<button class="btn btn-primary" type="submit">{submitLabel}</button>
	{/if}
</form>
