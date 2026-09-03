<script lang="ts" generics="T extends Record<string, unknown>">
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { FormPath, SuperForm } from 'sveltekit-superforms';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import { cn } from '../utils.js';
	import { defaultFormCheckboxStrings, type FormCheckboxStrings } from './FormCheckbox.strings.js';

	type Props = {
		/** El objeto que devuelve `superForm()`. */
		form: SuperForm<T, unknown>;
		/** El store `form` de ese mismo objeto (`const { form: formData } = form`). */
		formData: SuperFormData<T>;
		/** Nombre del campo dentro del schema. */
		field: string;
		/** Texto del `<label>`. Si no se pasa, se usa la `description` y, en su defecto, el nombre. */
		label?: string;
		/** Ayuda del campo. Solo se pinta aparte si `label` viene dada (si no, *es* la etiqueta). */
		description?: string;
		required?: boolean;
		/** Clases del `<fieldset>` que envuelve el campo. */
		class?: string;
		/** Clases del `<input type="checkbox">`. */
		inputClass?: string;
		strings?: Partial<FormCheckboxStrings>;
	} & Omit<HTMLInputAttributes, 'class' | 'checked' | 'form' | 'id' | 'name' | 'type'>;

	let {
		form,
		formData,
		field,
		label,
		description,
		required = false,
		class: className,
		inputClass,
		strings,
		...rest
	}: Props = $props();

	const t = $derived({ ...defaultFormCheckboxStrings, ...strings });

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

	// El binding va por función porque `T[keyof T]` es `unknown` para el compilador y
	// `bind:checked` exige un booleano: aquí se normaliza en los dos sentidos.
	function setChecked(checked: boolean) {
		formData.update((data) => ({ ...data, [field]: checked }));
	}
</script>

<Field {form} name={fieldPath}>
	<Control>
		{#snippet children({ props })}
			<fieldset class={cn('fieldset', className)}>
				<div class="flex items-center gap-2">
					<input
						{...rest}
						{...props}
						type="checkbox"
						{required}
						class={cn('checkbox', inputClass)}
						aria-describedby={describedBy(props['aria-describedby'])}
						bind:checked={() => Boolean($formData[field]), (checked) => setChecked(checked)}
					/>
					<Label class="label">{labelText}</Label>
				</div>
				{#if hint}
					<Description class="fieldset-label">{hint}</Description>
				{/if}
				<p id={noteId} class="fieldset-label">{required ? t.required : t.optional}</p>
				<FieldErrors class="fieldset-label text-error" />
			</fieldset>
		{/snippet}
	</Control>
</Field>
