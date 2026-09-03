<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormFields from '../components/FormFields.svelte';
	import FormHarness from './FormHarness.svelte';

	/**
	 * `FormFields` no conoce ningún schema concreto: recibe la salida de
	 * `zodToFieldsJsonSchema()` y elige el componente por `kind` (y por el `format` del JSON
	 * Schema). Estas stories son la prueba de que un formulario entero sale del schema.
	 */
	const schema = z.object({
		name: z.string().meta({ description: 'Full name', placeholder: 'Ada Lovelace' }),
		email: z.email().meta({ description: 'Email', placeholder: 'ada@example.com' }),
		website: z.url().optional().meta({ description: 'Website' }),
		bio: z.string().optional().meta({ format: 'textarea', description: 'Short bio' }),
		age: z.number().min(18).max(120).optional().meta({ description: 'Age' }),
		plan: z.enum(['free', 'pro']).meta({ description: 'Plan', placeholder: 'Choose one' }),
		newsletter: z.boolean().optional().meta({ description: 'Subscribe to the newsletter' })
	});

	const schemaEs = z.object({
		nombre: z.string().meta({ description: 'Nombre completo', placeholder: 'Ada Lovelace' }),
		correo: z.email().meta({ description: 'Correo electrónico', placeholder: 'ada@example.com' }),
		plan: z.enum(['gratis', 'pro']).meta({ description: 'Plan', placeholder: 'Elige uno' })
	});

	const { Story } = defineMeta({
		title: 'Form/FormFields',
		component: FormFields,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			fields: { control: false }
		}
	});
</script>

<Story name="Formulario derivado del schema">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData, fields })}
				<FormFields {form} {formData} {fields} />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<!-- Los textos del schema y los avisos de obligatoriedad, ambos en castellano. -->
<Story name="En castellano">
	{#snippet template()}
		<FormHarness schema={schemaEs} submitLabel="Guardar">
			{#snippet children({ form, formData, fields })}
				<FormFields
					{form}
					{formData}
					{fields}
					strings={{ required: 'Obligatorio', optional: 'Opcional' }}
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
