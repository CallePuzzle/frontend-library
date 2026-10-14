<script lang="ts" generics="T extends Record<string, unknown>">
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { FormPath, SuperForm } from 'sveltekit-superforms';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import { cn } from '../utils.js';
	import { defaultFormNumberStrings, type FormNumberStrings } from './FormNumber.strings.js';
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
		/** Mínimo declarado en el schema (`z.number().min()`). */
		min?: number;
		/** Máximo declarado en el schema (`z.number().max()`). */
		max?: number;
		/** Paso del input. Por defecto `any`, para no impedir decimales. */
		step?: number | 'any';
		/** Clases del `<fieldset>` que envuelve el campo. */
		class?: string;
		/** Clases del `<input>`. */
		inputClass?: string;
		strings?: Partial<FormNumberStrings>;
	} & Omit<
		HTMLInputAttributes,
		'class' | 'form' | 'id' | 'max' | 'min' | 'name' | 'placeholder' | 'step' | 'type'
	>;

	let {
		form,
		formData,
		field,
		label,
		placeholder,
		description,
		required = false,
		min,
		max,
		step = 'any',
		class: className,
		inputClass,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultFormNumberStrings, ...contextStrings.formNumber, ...strings });

	// Mismo motivo que en `FormString`: el nombre del campo se conoce en tiempo de ejecución
	// (sale del schema), así que el cast a `FormPath<T>` se concentra aquí.
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
				<input
					{...rest}
					{...props}
					type="number"
					{placeholder}
					{required}
					{min}
					{max}
					{step}
					class={cn('input w-full', inputClass)}
					aria-describedby={describedBy(props['aria-describedby'])}
					bind:value={$formData[field]}
				/>
				{#if hint}
					<Description class="fieldset-label">{hint}</Description>
				{/if}
				<p id={noteId} class="fieldset-label">{required ? t.required : t.optional}</p>
				<FieldErrors class="fieldset-label text-error" />
			</fieldset>
		{/snippet}
	</Control>
</Field>
