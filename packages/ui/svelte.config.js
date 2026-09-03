import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Este paquete es una **librería**, no una app: no lleva adapter. `svelte-package` solo
 * necesita el preprocesador.
 */
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess()
};

export default config;
