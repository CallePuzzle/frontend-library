import type { StorybookConfig } from '@storybook/svelte-vite';
import { mergeConfig } from 'vite';
import { appAliases } from './vite-aliases';

/**
 * Framework `@storybook/svelte-vite`, **no** `@storybook/sveltekit`.
 *
 * `@storybook/sveltekit` monta el plugin de vite de SvelteKit, cuyo hook `config` llama a
 * `sync.all()` y exige un `src/app.html`. Este paquete es una librería y nunca ha tenido ese
 * fichero: por eso Storybook no había arrancado nunca en este monorepo (H10.0). El precio de
 * cambiar de framework es que los módulos virtuales `$app/*` desaparecen, así que se montan
 * como alias a los mocks de `.storybook/mocks/` (ver `vite-aliases.ts`).
 *
 * Nota: `@storybook/builder-vite` carga el `vite.config.ts` del paquete, que ya declara esos
 * mismos alias (los necesita el proyecto `component` de vitest) y los plugins `tailwindcss()`
 * y `svelte()`. Los alias se repiten aquí a propósito, para que la configuración de Storybook
 * sea autosuficiente y no dependa del orden de merge del builder.
 */
const config: StorybookConfig = {
	// El glob de MDX va primero para que la página de bienvenida quede arriba en la barra lateral.
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest'
	],
	framework: {
		name: '@storybook/svelte-vite',
		options: {}
	},
	viteFinal: (viteConfig) => mergeConfig(viteConfig, { resolve: { alias: appAliases } })
};

export default config;
