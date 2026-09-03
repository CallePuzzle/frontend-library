import { describe, expect, it } from 'vitest';
import { cn } from '../utils.js';

/**
 * `cn()` es la pieza de la que depende que la prop `class` de cualquier componente
 * sobreescriba de forma predecible las clases por defecto: merece un test propio.
 */
describe('cn', () => {
	it('concatena clases sueltas', () => {
		expect(cn('btn', 'btn-circle')).toBe('btn btn-circle');
	});

	it('ignora los valores falsy', () => {
		// El caso real: una clase condicional cuya condición no se cumple.
		const oculto = false as boolean;
		expect(cn('btn', undefined, null, oculto && 'oculto', '')).toBe('btn');
	});

	it('resuelve los conflictos de tailwind: la última gana', () => {
		expect(cn('p-2', 'p-4')).toBe('p-4');
	});

	it('deja que la clase del consumidor gane en los grupos que tailwind-merge conoce', () => {
		// Es el caso real: `cn('flex hidden lg:flex', props.class)`.
		expect(cn('hidden lg:flex', 'flex')).toBe('lg:flex flex');
	});

	it('NO resuelve los conflictos de daisyUI: no están en los grupos de tailwind-merge', () => {
		// Queda documentado a propósito: `cn('btn btn-accent', 'btn-primary')` deja las dos
		// clases y gana la que daisyUI declare después en la hoja, no la del consumidor.
		// Para arreglarlo habría que configurar `extendTailwindMerge` con los grupos de
		// daisyUI (`btn-*`, `badge-*`, `alert-*`, …) en `src/utils.ts`.
		expect(cn('btn btn-accent', 'btn-primary')).toBe('btn btn-accent btn-primary');
	});

	it('acepta objetos y arrays, como clsx', () => {
		expect(cn(['flex', { hidden: false, 'lg:flex': true }])).toBe('flex lg:flex');
	});
});
