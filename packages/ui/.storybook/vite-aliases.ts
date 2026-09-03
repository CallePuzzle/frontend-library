/**
 * Alias de vite que sustituyen los módulos virtuales de SvelteKit por los mocks de
 * `.storybook/mocks/`.
 *
 * Viven aquí, y no repetidos en cada configuración, porque los necesitan **dos** consumidores:
 *
 * - `.storybook/main.ts`, para que las stories rendericen con `@storybook/svelte-vite`
 *   (framework de librería: no monta el plugin de SvelteKit y por tanto `$app/*` no existe).
 * - `vite.config.ts`, para que los tests de componente (proyecto `component`) resuelvan lo
 *   mismo que las stories.
 */
import { fileURLToPath } from 'node:url';

const mock = (file: string) => fileURLToPath(new URL(`./mocks/${file}`, import.meta.url));

export const appAliases: Record<string, string> = {
	'$app/paths': mock('app-paths.ts'),
	'$app/navigation': mock('app-navigation.ts'),
	'$app/state': mock('app-state.ts'),
	'$app/environment': mock('app-environment.ts'),
	// `sveltekit-superforms` importa estos dos (no los componentes de la librería).
	'$app/stores': mock('app-stores.ts'),
	'$app/forms': mock('app-forms.ts')
};
