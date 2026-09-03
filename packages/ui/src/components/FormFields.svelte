<script lang="ts" generics="T extends Record<string, unknown>">
	import { DEV } from 'esm-env';
	import type { Field, Fields } from '@callepuzzle/core/schema';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import { cn } from '../utils.js';
	import { defaultFormFieldsStrings, type FormFieldsStrings } from './FormFields.strings.js';
	import FormCheckbox from './FormCheckbox.svelte';
	import FormNumber from './FormNumber.svelte';
	import FormSelect from './FormSelect.svelte';
	import FormString from './FormString.svelte';
	import FormTextarea from './FormTextarea.svelte';

	type Props = {
		/** El objeto que devuelve `superForm()`. */
		form: SuperForm<T, unknown>;
		/** El store `form` de ese mismo objeto (`const { form: formData } = form`). */
		formData: SuperFormData<T>;
		/** Salida de `zodToFieldsJsonSchema()` (`@callepuzzle/core/schema`). */
		fields: Fields;
		class?: string;
		strings?: Partial<FormFieldsStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class'>;

	let { form, formData, fields, class: className, strings, ...rest }: Props = $props();

	const t = $derived({ ...defaultFormFieldsStrings, ...strings });

	/**
	 * Traduce el `format` del JSON Schema al `type` del input. Lo que no esté en la tabla
	 * cae en `text`: un `format` desconocido no debe generar un input inválido.
	 *
	 * Además de los formatos que emite zod (`email`, `uri`, `date`, …) se admiten dos
	 * convenciones para declararlos desde el schema con `.meta({ format: … })`:
	 * `hidden` (campo presente pero no visible) y `textarea` (ver `isTextarea`).
	 */
	const inputTypes: Record<string, string> = {
		email: 'email',
		uri: 'url',
		url: 'url',
		date: 'date',
		'date-time': 'datetime-local',
		time: 'time',
		password: 'password',
		tel: 'tel',
		hidden: 'hidden'
	};

	function inputType(format: string | undefined): string {
		if (!format) return 'text';
		return inputTypes[format] ?? 'text';
	}

	/** Un `string` se pinta como `<textarea>` si el schema lo pide con `.meta({ format: 'textarea' })`. */
	function isTextarea(field: Field): boolean {
		return field.kind === 'string' && field.format === 'textarea';
	}

	// Los tipos que no se saben representar no se disfrazan de input de texto: se avisa en
	// desarrollo y no se renderiza nada. El flag `DEV` viene de `esm-env`, que funciona con
	// cualquier bundler y sin bundler; las variables de entorno de Vite solo existen en apps
	// bundleadas con Vite, y esto es código publicado (`svelte-package` lo avisa). Es lo que usa
	// SvelteKit por el mismo motivo, y deja el aviso fuera del bundle de producción.
	$effect(() => {
		if (!DEV) return;

		for (const field of fields) {
			if (field.kind !== 'unsupported') continue;
			console.warn(
				`[FormFields] el campo "${field.name}" usa un tipo que no se sabe renderizar` +
					`${field.jsonSchemaType ? ` (JSON Schema: ${field.jsonSchemaType})` : ''}. ` +
					'Pásalo a mano o cambia el schema.'
			);
		}
	});
</script>

<div {...rest} class={cn(className)}>
	{#each fields as field (field.name)}
		{#if field.kind === 'string' && isTextarea(field)}
			<FormTextarea
				{form}
				{formData}
				field={field.name}
				placeholder={field.placeholder}
				description={field.description}
				required={field.required}
				strings={t}
			/>
		{:else if field.kind === 'string'}
			<FormString
				{form}
				{formData}
				field={field.name}
				type={inputType(field.format)}
				placeholder={field.placeholder}
				description={field.description}
				required={field.required}
				strings={t}
			/>
		{:else if field.kind === 'number'}
			<FormNumber
				{form}
				{formData}
				field={field.name}
				placeholder={field.placeholder}
				description={field.description}
				required={field.required}
				min={field.min}
				max={field.max}
				strings={t}
			/>
		{:else if field.kind === 'boolean'}
			<FormCheckbox
				{form}
				{formData}
				field={field.name}
				description={field.description}
				required={field.required}
				strings={t}
			/>
		{:else if field.kind === 'enum'}
			<FormSelect
				{form}
				{formData}
				field={field.name}
				options={field.options}
				placeholder={field.placeholder}
				description={field.description}
				required={field.required}
				strings={t}
			/>
		{/if}
	{/each}
</div>
