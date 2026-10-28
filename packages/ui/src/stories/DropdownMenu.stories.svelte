<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DropdownMenu from '../components/DropdownMenu.svelte';

	/**
	 * Desplegable con el patrón «menu button» de WAI-ARIA: la apertura es estado explícito
	 * (no `:focus-within`, que en WebKit no salta al pulsar un `<button>`), roles de menú
	 * correctos y navegación por teclado. Es el componente que usan `NavBarEnd` y los
	 * desplegables propios de cada consumidor.
	 *
	 * El snippet `items` provee el marcado de las entradas: `<li role="none">` envolviendo
	 * un elemento con `role="menuitem"` (o `menuitemradio` + `aria-checked` en un selector).
	 */
	const { Story } = defineMeta({
		title: 'Navigation/DropdownMenu',
		component: DropdownMenu,
		tags: ['autodocs'],
		argTypes: {
			label: { control: 'text' },
			closeOnSelect: { control: 'boolean' },
			triggerClass: { control: 'text' },
			menuClass: { control: 'text' },
			trigger: { control: false },
			items: { control: false }
		}
	});
</script>

<Story name="Por defecto">
	{#snippet template(args)}
		<DropdownMenu {...args} label="Options" triggerClass="btn btn-outline" menuClass="w-48">
			{#snippet trigger()}
				Options
			{/snippet}
			{#snippet items({ close })}
				<li role="none">
					<button type="button" role="menuitem" onclick={close}>Profile</button>
				</li>
				<li role="none">
					<button type="button" role="menuitem" onclick={close}>Billing</button>
				</li>
			{/snippet}
		</DropdownMenu>
	{/snippet}
</Story>

<!--
	Con `closeOnSelect` el menú cierra al activar cualquier item, sin que el snippet
	tenga que llamar a `close`. Un selector de idioma es el caso de uso típico.
-->
<Story name="Selector con menuitemradio">
	{#snippet template(args)}
		<DropdownMenu
			{...args}
			label="Language"
			triggerClass="btn btn-outline"
			menuClass="w-40"
			closeOnSelect
		>
			{#snippet trigger()}
				Language
			{/snippet}
			{#snippet items()}
				{#each ['en', 'es'] as locale (locale)}
					<li role="none">
						<button
							type="button"
							role="menuitemradio"
							aria-checked={locale === 'en'}
							onclick={() => console.info('setLocale', locale)}
						>
							{locale}
						</button>
					</li>
				{/each}
			{/snippet}
		</DropdownMenu>
	{/snippet}
</Story>
