import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';
import type { ViteUserConfig } from 'vitest/config';
import { appAliases } from './.storybook/vite-aliases';

const storybookDir = fileURLToPath(new URL('./.storybook', import.meta.url));

/**
 * Configuración de vite y de vitest del paquete.
 *
 * - Plugin `svelte()`, **no** `sveltekit()`: esto es una librería (la publica
 *   `svelte-package`, que ni mira este fichero) y, además, `@storybook/builder-vite` carga
 *   este `vite.config.ts` tal cual. Con los plugins de SvelteKit dentro,
 *   `@storybook/svelte-vite` lanza `SvelteViteWithSvelteKitError` y Storybook no arranca.
 * - Los alias de `$app/*` sustituyen los módulos virtuales que ya no genera nadie.
 * - Tres proyectos de test en un único fichero (`vitest.workspace.ts` está borrado: estaba
 *   deprecado desde Vitest 3 y se pisaba con este `test.projects`).
 */
/**
 * Cada proyecto necesita su **propio** objeto de configuración de navegador: vitest anota la
 * instancia con el nombre del proyecto, así que reutilizar el mismo literal por referencia hace
 * que el segundo proyecto herede el nombre del primero
 * (`Cannot define a nested project for a chromium browser`).
 */
const browserConfig = () => ({
	enabled: true,
	headless: true,
	provider: 'playwright' as const,
	instances: [{ browser: 'chromium' }]
});

const config: UserConfig & { test: ViteUserConfig['test'] } = {
	plugins: [tailwindcss(), svelte()],
	resolve: { alias: appAliases },
	/**
	 * `sveltekit-superforms` importa `$app/*` desde su `dist`. Esos módulos se resuelven con los
	 * alias de arriba, pero el **prebundle** de esbuild no aplica `resolve.alias`, así que en modo
	 * navegador reventaba con `Could not resolve "$app/environment"`. Excluyéndolo del prebundle,
	 * vite lo resuelve por la ruta normal, donde los alias sí valen.
	 */
	optimizeDeps: {
		exclude: ['sveltekit-superforms', 'formsnap'],
		// `style-to-object` es CJS y llega como dependencia transitiva de los dos de arriba. Al
		// sacarlos del prebundle deja de convertirse a ESM y el navegador se queja de que no
		// exporta `default`, así que se pide explícitamente.
		include: ['style-to-object']
	},
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{ts,svelte}'],
			// Las stories y los propios tests no son código de la librería.
			exclude: [
				'src/stories/**',
				'src/tests/**',
				'src/**/*.{test,spec}.{js,ts}',
				'src/index.ts',
				'src/otp.ts',
				'src/components/index.ts',
				'src/**/*.strings.ts',
				'src/strings/**'
			],
			// Umbral inicial deliberadamente bajo: la idea es subirlo, no que nadie lo baje.
			thresholds: { lines: 50, statements: 50, functions: 50, branches: 50 }
		},
		projects: [
			{
				// Lógica pura, sin navegador.
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					expect: { requireAssertions: true }
				}
			},
			{
				// Componentes en un navegador real, con `vitest-browser-svelte`.
				extends: './vite.config.ts',
				test: {
					name: 'component',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					browser: browserConfig(),
					setupFiles: ['./vitest-setup-client.ts'],
					expect: { requireAssertions: true }
				}
			},
			{
				// Cada story se renderiza y se le pasa axe (`a11y: { test: 'error' }`).
				extends: './vite.config.ts',
				plugins: [storybookTest({ configDir: storybookDir })],
				test: {
					name: 'storybook',
					browser: browserConfig(),
					setupFiles: ['./.storybook/vitest.setup.ts']
				}
			}
		]
	}
};

export default config;
