<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormNumber from '../components/FormNumber.svelte';
	import FormHarness from './FormHarness.svelte';

	const schema = z.object({
		age: z.number().min(18).max(120),
		price: z.number().optional()
	});

	const { Story } = defineMeta({
		title: 'Form/FormNumber',
		component: FormNumber,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			field: { control: false }
		}
	});
</script>

<Story name="Con mínimo y máximo">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormNumber
					{form}
					{formData}
					field="age"
					label="Age"
					description="18 or older"
					min={18}
					max={120}
					step={1}
					required
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<!-- `step` es `any` por defecto para no impedir decimales. -->
<Story name="Con decimales">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormNumber {form} {formData} field="price" label="Price" placeholder="9.99" />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
