import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Este paquete es una **librería**, no una app: no lleva adapter. `svelte-package` solo
 * necesita el preprocesador. (Desde SvelteKit 3 el tipo `Config` ya no vive en
 * `@sveltejs/kit` —la config de una app va en el plugin de vite—, y aquí no hace falta:
 * es la config que leen `svelte-package` y ESLint.)
 *
 * @type {{ preprocess: import('@sveltejs/vite-plugin-svelte').Options['preprocess'] }}
 */
const config = {
	preprocess: vitePreprocess()
};

export default config;
