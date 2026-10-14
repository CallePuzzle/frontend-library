<script lang="ts" generics="T extends Record<string, unknown>">
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import type { FormPath, SuperForm } from 'sveltekit-superforms';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import { cn } from '../utils.js';
	import { defaultFormTextareaStrings, type FormTextareaStrings } from './FormTextarea.strings.js';
	import { getUiStrings } from '../strings/context.js';

	type Props = {
		/** El objeto que devuelve `superForm()`. */
		form: SuperForm<T, unknown>;
		/** El store `form` de ese mismo objeto (`const { form: formData } = form`). */
		formData: SuperFormData<T>;
		/** Nombre del campo dentro del schema. */
		field: string;
		/** Texto del `<label>`. Si no se pasa, se usa la `description` y, en su defecto, el nombre. */
		label?: string;
		placeholder?: string;
		/** Ayuda del campo. Solo se pinta aparte si `label` viene dada (si no, *es* la etiqueta). */
		description?: string;
		required?: boolean;
		rows?: number;
		/** Clases del `<fieldset>` que envuelve el campo. */
		class?: string;
		/** Clases del `<textarea>`. */
		inputClass?: string;
		strings?: Partial<FormTextareaStrings>;
	} & Omit<HTMLTextareaAttributes, 'class' | 'form' | 'id' | 'name' | 'placeholder' | 'rows'>;

	let {
		form,
		formData,
		field,
		label,
		placeholder,
		description,
		required = false,
		rows = 4,
		class: className,
		inputClass,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultFormTextareaStrings, ...contextStrings.formTextarea, ...strings });

	// Mismo motivo que en `FormString`: el nombre del campo llega como string en tiempo de
	// ejecución y el cast a `FormPath<T>` se concentra en este punto.
	const fieldPath = $derived(field as FormPath<T>);

	const labelText = $derived(label ?? description ?? field);
	const hint = $derived(label ? description : undefined);

	const uid = $props.id();
	const noteId = `${uid}-note`;

	function describedBy(fromFormsnap: string | undefined): string {
		return fromFormsnap ? `${fromFormsnap} ${noteId}` : noteId;
	}
</script>

<Field {form} name={fieldPath}>
	<Control>
		{#snippet children({ props })}
			<fieldset class={cn('fieldset', className)}>
				<Label class="fieldset-legend">{labelText}</Label>
				<textarea
					{...rest}
					{...props}
					{placeholder}
					{required}
					{rows}
					class={cn('textarea w-full', inputClass)}
					aria-describedby={describedBy(props['aria-describedby'])}
					bind:value={$formData[field]}
				></textarea>
				{#if hint}
					<Description class="fieldset-label">{hint}</Description>
				{/if}
				<p id={noteId} class="fieldset-label">{required ? t.required : t.optional}</p>
				<FieldErrors class="fieldset-label text-error" />
			</fieldset>
		{/snippet}
	</Control>
</Field>
