/**
 * Mock de `$app/stores` (la API de stores, anterior a `$app/state`).
 *
 * Ningún componente de la librería lo usa, pero **`sveltekit-superforms` sí**: su
 * `superForm.js` importa `page` y `navigating` de aquí, así que sin este mock cualquier
 * story con formulario falla al empaquetar ("Rollup failed to resolve import $app/stores").
 */
import { readable, type Readable } from 'svelte/store';
import { navigating as navigatingState, page as pageState } from './app-state.js';

export const page: Readable<typeof pageState> = readable(pageState);
export const navigating: Readable<typeof navigatingState | null> = readable(null);
export const updated: Readable<boolean> & { check: () => Promise<boolean> } = Object.assign(
	readable(false),
	{ check: () => Promise.resolve(false) }
);
