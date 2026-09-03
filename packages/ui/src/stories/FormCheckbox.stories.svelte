<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormCheckbox from '../components/FormCheckbox.svelte';
	import FormHarness from './FormHarness.svelte';

	const schema = z.object({
		newsletter: z.boolean().optional(),
		terms: z.boolean()
	});

	const { Story } = defineMeta({
		title: 'Form/FormCheckbox',
		component: FormCheckbox,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			field: { control: false }
		}
	});
</script>

<Story name="Opcional">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormCheckbox {form} {formData} field="newsletter" label="Subscribe to the newsletter" />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<Story name="Obligatorio">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormCheckbox
					{form}
					{formData}
					field="terms"
					label="I accept the terms"
					description="You must accept them to continue"
					required
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
