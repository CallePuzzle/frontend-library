<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormSelect from '../components/FormSelect.svelte';
	import FormHarness from './FormHarness.svelte';

	const plans = ['free', 'pro', 'enterprise'] as const;
	const schema = z.object({ plan: z.enum(plans) });

	const { Story } = defineMeta({
		title: 'Form/FormSelect',
		component: FormSelect,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			field: { control: false },
			options: { control: 'object' }
		}
	});
</script>

<Story name="Con placeholder">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormSelect
					{form}
					{formData}
					field="plan"
					label="Plan"
					options={plans}
					placeholder="Choose a plan"
					required
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<Story name="En castellano">
	{#snippet template()}
		<FormHarness {schema} submitLabel="Guardar">
			{#snippet children({ form, formData })}
				<FormSelect
					{form}
					{formData}
					field="plan"
					label="Plan"
					options={plans}
					placeholder="Elige un plan"
					required
					strings={{ required: 'Obligatorio', optional: 'Opcional' }}
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
