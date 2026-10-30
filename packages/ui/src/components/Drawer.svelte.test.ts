import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Drawer from './Drawer.svelte';

function side() {
	return createRawSnippet(() => ({ render: () => '<nav>Menú lateral</nav>' }));
}

function children() {
	return createRawSnippet<[{ drawerId: string }]>((getArgs) => ({
		render: () => `<div data-drawer-id="${getArgs().drawerId}">Contenido</div>`
	}));
}

describe('Drawer', () => {
	it('el overlay cierra por puntero y no usa aria-label (prohibido sobre <label>)', async () => {
		const { container } = await render(Drawer, { children: children(), side: side() });

		const overlay = container.querySelector<HTMLLabelElement>('label.drawer-overlay');
		expect(overlay).not.toBeNull();
		// Superficie solo de puntero: sale del árbol de accesibilidad con `aria-hidden`.
		expect(overlay?.getAttribute('aria-hidden')).toBe('true');
		expect(overlay?.hasAttribute('aria-label')).toBe(false);
	});

	it('el checkbox oculto anuncia abrir cerrado y cerrar abierto', async () => {
		// El `drawer-toggle` de daisyUI es `opacity: 0` con tamaño 0, no `display: none`:
		// sigue en el árbol de accesibilidad y es enfocable, así que su nombre accesible
		// importa y refleja la acción real según el estado.
		const { container } = await render(Drawer, { children: children(), side: side() });

		const toggle = container.querySelector<HTMLInputElement>('input.drawer-toggle');
		expect(toggle?.getAttribute('aria-label')).toBe('Open sidebar');

		toggle?.click();
		// La actualización del estado pasa por el scheduler de Svelte: no es sincrónica.
		await new Promise((done) => requestAnimationFrame(done));
		expect(toggle?.getAttribute('aria-label')).toBe('Close sidebar');
	});
});
