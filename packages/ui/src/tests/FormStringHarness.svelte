<script lang="ts">
	/**
	 * Andamio de test para `FormString`.
	 *
	 * `FormString` recibe el formulario ya creado (`superForm()` y su store `form`), y
	 * `superForm()` usa el ciclo de vida de Svelte: no se puede llamar desde un fichero de
	 * test. Este componente lo crea y reenvía el resto de props tal cual.
	 */
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { SuperForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { z } from 'zod/v4';
	import FormString from '../components/FormString.svelte';
	import type { FormStringStrings } from '../components/FormString.strings.js';

	type Data = Record<string, unknown>;

	type Props = {
		field?: string;
		label?: string;
		description?: string;
		placeholder?: string;
		type?: HTMLInputAttributes['type'];
		required?: boolean;
		inputClass?: string;
		strings?: Partial<FormStringStrings>;
	};

	let { field = 'nickname', ...rest }: Props = $props();

	const schema = z.object({ nickname: z.string().min(2), token: z.string().optional() });

	const uid = $props.id();

	const form = superForm(defaults(zod4(schema)), {
		id: uid,
		SPA: true,
		validators: zod4Client(schema)
	}) as unknown as SuperForm<Data, unknown>;

	const { form: formData } = form;
</script>

<form method="POST">
	<FormString {form} {formData} {field} {...rest} />
</form>
