<script lang="ts" generics="T extends Record<string, unknown>">
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { FormPath, SuperForm } from 'sveltekit-superforms';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import { cn } from '../utils.js';
	import { defaultFormStringStrings, type FormStringStrings } from './FormString.strings.js';

	type Props = {
		/** El objeto que devuelve `superForm()`. */
		form: SuperForm<T, unknown>;
		/** El store `form` de ese mismo objeto (`const { form: formData } = form`). */
		formData: SuperFormData<T>;
		/** Nombre del campo dentro del schema. */
		field: string;
		/**
		 * Texto del `<label>`. Si no se pasa, se usa la `description` del campo y, en su
		 * defecto, el propio nombre: así un formulario generado desde un schema siempre
		 * tiene una etiqueta asociada al input.
		 */
		label?: string;
		/** Tipo del input. `hidden` oculta el bloque entero sin sacarlo del formulario. */
		type?: HTMLInputAttributes['type'];
		placeholder?: string;
		/** Ayuda del campo. Solo se pinta aparte si `label` viene dada (si no, *es* la etiqueta). */
		description?: string;
		required?: boolean;
		/** Clases del `<fieldset>` que envuelve el campo. */
		class?: string;
		/** Clases del `<input>`. */
		inputClass?: string;
		strings?: Partial<FormStringStrings>;
	} & Omit<HTMLInputAttributes, 'class' | 'form' | 'id' | 'name' | 'placeholder' | 'type'>;

	let {
		form,
		formData,
		field,
		label,
		type = 'text',
		placeholder,
		description,
		required = false,
		class: className,
		inputClass,
		strings,
		...rest
	}: Props = $props();

	const t = $derived({ ...defaultFormStringStrings, ...strings });

	// `field` llega como string: los campos se generan en tiempo de ejecución a partir del
	// schema (`zodToFieldsJsonSchema`), así que no hay forma de que TypeScript verifique
	// estáticamente que corresponde a una clave real de `T`. El cast se hace aquí, en el
	// único punto donde entra el dato, y no se repite en el resto del componente.
	const fieldPath = $derived(field as FormPath<T>);

	const labelText = $derived(label ?? description ?? field);
	/** La ayuda solo se pinta si no se ha reciclado como etiqueta. */
	const hint = $derived(label ? description : undefined);

	const uid = $props.id();
	const noteId = `${uid}-note`;

	/** Añade el aviso de obligatoriedad a lo que ya describe formsnap (ayuda y errores). */
	function describedBy(fromFormsnap: string | undefined): string {
		return fromFormsnap ? `${fromFormsnap} ${noteId}` : noteId;
	}
</script>

<Field {form} name={fieldPath}>
	<Control>
		{#snippet children({ props })}
			<fieldset class={cn('fieldset', type === 'hidden' && 'hidden', className)}>
				<Label class="fieldset-legend">{labelText}</Label>
				<input
					{...rest}
					{...props}
					{type}
					{placeholder}
					{required}
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
