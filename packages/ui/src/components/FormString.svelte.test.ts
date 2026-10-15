import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from '../tests/FormStringHarness.svelte';

function inputOf(container: HTMLElement): HTMLInputElement {
	const input = container.querySelector('input');
	if (!input) throw new Error('FormString no ha renderizado ningún <input>');
	return input;
}

/** Los ids del `aria-describedby`, resueltos a los textos a los que apuntan. */
function describedByTexts(container: HTMLElement, input: HTMLInputElement): string[] {
	const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
	return ids.map((id) => container.querySelector(`#${id}`)?.textContent?.trim() ?? '');
}

describe('FormString', () => {
	it('marca el campo como obligatorio y lo dice en el aviso', async () => {
		const { container } = await render(Harness, { label: 'Apodo', required: true });
		const input = inputOf(container);

		expect(input.required).toBe(true);
		expect(describedByTexts(container, input)).toContain('Required');
	});

	it('avisa de que el campo es opcional cuando no es obligatorio', async () => {
		const { container } = await render(Harness, { label: 'Apodo' });
		const input = inputOf(container);

		expect(input.required).toBe(false);
		expect(describedByTexts(container, input)).toContain('Optional');
	});

	it('enlaza el aviso con aria-describedby sin perder el de formsnap', async () => {
		// El componente **añade** su id al que ya pone formsnap para la ayuda y los errores:
		// si lo sobreescribiera, el usuario de lector de pantalla perdería la descripción.
		const { container } = await render(Harness, {
			label: 'Apodo',
			description: 'Entre 2 y 20 caracteres',
			required: true
		});
		const input = inputOf(container);
		const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

		expect(ids.length).toBeGreaterThan(1);
		expect(describedByTexts(container, input)).toContain('Entre 2 y 20 caracteres');
	});

	it('type="hidden" oculta el bloque sin sacar el campo del formulario', async () => {
		const { container } = await render(Harness, { field: 'token', label: 'Token', type: 'hidden' });
		const input = inputOf(container);
		const fieldset = container.querySelector('fieldset');

		expect(input.type).toBe('hidden');
		expect(fieldset?.className).toContain('hidden');
		// Sigue existiendo (y con nombre): un campo oculto tiene que viajar en el envío.
		expect(input.getAttribute('name')).toBe('token');
	});

	it('sin label usa la description como etiqueta, y si no, el nombre del campo', async () => {
		const { container: conDescripcion } = await render(Harness, { description: 'Tu apodo' });
		expect(conDescripcion.querySelector('label')?.textContent?.trim()).toBe('Tu apodo');

		const { container: pelado } = await render(Harness, {});
		expect(pelado.querySelector('label')?.textContent?.trim()).toBe('nickname');
	});

	it('usa los textos inyectados por strings', async () => {
		const { container } = await render(Harness, {
			label: 'Apodo',
			required: true,
			strings: { required: 'Obligatorio', optional: 'Opcional' }
		});

		expect(describedByTexts(container, inputOf(container))).toContain('Obligatorio');
	});

	it('la etiqueta apunta al input (nombre accesible)', async () => {
		const { container } = await render(Harness, { label: 'Apodo' });
		const label = container.querySelector('label');

		expect(label?.getAttribute('for')).toBe(inputOf(container).id);
	});
});
