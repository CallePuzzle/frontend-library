import type { Preview } from '@storybook/svelte-vite';

/**
 * El CSS que se carga es el del **propio paquete** (`src/styles/index.css`, la hoja que se
 * publica como `@callepuzzle/svelte-ui/styles.css`), no una copia ni una ruta que salga del
 * paquete: así lo que se ve en Storybook es exactamente lo que ve el consumidor (T8.6).
 *
 * Esa hoja ya declara `@source "../"`, que desde `src/styles/` apunta a `src/`: Tailwind
 * escanea los componentes **y** las stories, así que las clases que sólo se usan en una story
 * también se generan.
 */
import '../src/styles/index.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},

		a11y: {
			// 'error': una violación de axe hace fallar el test de la story. Es el modo que
			// pide T10.6; con 'todo' las violaciones sólo se ven en la UI y nadie las mira.
			test: 'error'
		}
	}
};

export default preview;
