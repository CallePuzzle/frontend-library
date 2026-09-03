<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { z } from 'zod/v4';
	import FormTextarea from '../components/FormTextarea.svelte';
	import FormHarness from './FormHarness.svelte';

	const schema = z.object({ bio: z.string().optional() });

	const { Story } = defineMeta({
		title: 'Form/FormTextarea',
		component: FormTextarea,
		tags: ['autodocs'],
		argTypes: {
			form: { control: false },
			formData: { control: false },
			field: { control: false },
			rows: { control: 'number' }
		}
	});
</script>

<Story name="Por defecto">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormTextarea
					{form}
					{formData}
					field="bio"
					label="Bio"
					description="A couple of lines about you"
					placeholder="I build things…"
				/>
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>

<Story name="Más alto">
	{#snippet template()}
		<FormHarness {schema}>
			{#snippet children({ form, formData })}
				<FormTextarea {form} {formData} field="bio" label="Bio" rows={10} />
			{/snippet}
		</FormHarness>
	{/snippet}
</Story>
