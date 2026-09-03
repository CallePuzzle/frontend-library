<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormString from '../components/FormString.svelte';
	import FormHarness from './FormHarness.svelte';

	const schema = z.object({
		nickname: z.string().min(2),
		website: z.string().optional(),
		token: z.string().optional()
	});

	const { Story } = defineMeta({
		title: 'Form/FormString',
		component: FormString,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			field: { control: false },
			label: { control: 'text' },
			description: { control: 'text' },
			placeholder: { control: 'text' },
			required: { control: 'boolean' },
			type: { control: 'text' }
		}
	});
</script>

<!-- Obligatorio: el aviso bajo el campo dice "Required" y lo enlaza `aria-describedby`. -->
<Story name="Obligatorio">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormString
					{form}
					{formData}
					field="nickname"
					label="Nickname"
					description="Between 2 and 20 characters"
					placeholder="ada"
					required
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<Story name="Opcional">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormString {form} {formData} field="website" label="Website" type="url" />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<!-- Sin `label` la `description` hace de etiqueta: nunca hay un input sin nombre accesible. -->
<Story name="Sin etiqueta explícita">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormString {form} {formData} field="website" description="Your website" />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<!-- `type="hidden"` oculta el bloque entero sin sacar el campo del formulario. -->
<Story name="Oculto">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormString {form} {formData} field="nickname" label="Visible" required />
				<FormString {form} {formData} field="token" label="Token" type="hidden" />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<Story name="En castellano">
	{#snippet template()}
		<FormHarness {schema} submitLabel="Guardar">
			{#snippet children({ form, formData })}
				<FormString
					{form}
					{formData}
					field="nickname"
					label="Apodo"
					description="Entre 2 y 20 caracteres"
					placeholder="ada"
					required
					strings={{ required: 'Obligatorio', optional: 'Opcional' }}
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
