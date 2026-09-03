<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Footer from '../components/Footer.svelte';

	/**
	 * Los enlaces concretos son decisión de producto: entran por el snippet `children`. El
	 * componente sólo decide en qué breakpoint se ve.
	 */
	const { Story } = defineMeta({
		title: 'Layout/Footer',
		component: Footer,
		tags: ['autodocs'],
		argTypes: {
			children: { control: false },
			visibleOnlyOnMobile: { control: 'boolean' }
		}
	});
</script>

{#snippet links()}
	<nav aria-label="Enlaces del pie" class="flex gap-4 p-4">
		<a class="link" href="#repo">Repositorio</a>
		<a class="link" href="#contact">Contacto</a>
	</nav>
{/snippet}

<!-- Por defecto sólo se ve a partir de `lg` (`hidden lg:flex`). -->
<Story name="Escritorio">
	{#snippet template({ children, ...args })}
		<Footer {...args}>{@render links()}</Footer>
	{/snippet}
</Story>

<!-- Con `visibleOnlyOnMobile` se invierte: `flex lg:hidden`. -->
<Story name="Sólo en móvil" args={{ visibleOnlyOnMobile: true }}>
	{#snippet template({ children, ...args })}
		<Footer {...args}>{@render links()}</Footer>
	{/snippet}
</Story>
