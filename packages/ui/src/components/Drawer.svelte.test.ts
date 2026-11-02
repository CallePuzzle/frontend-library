import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
// Mismo módulo que resuelve el alias `$app/navigation` dentro del componente: lo que
// dispara aquí es la callback que el `Drawer` registró al renderizar.
import { triggerAfterNavigate } from '../../.storybook/mocks/app-navigation.js';
import DrawerHarness from '../tests/DrawerHarness.svelte';
import Drawer from './Drawer.svelte';

function side() {
	return createRawSnippet(() => ({ render: () => '<nav>Menú lateral</nav>' }));
}

function children() {
	return createRawSnippet<[{ drawerId: string }]>((getArgs) => ({
		render: () => `<div data-drawer-id="${getArgs().drawerId}">Contenido</div>`
	}));
}

/** La actualización del estado pasa por el scheduler de Svelte: no es sincrónica. */
function nextFrame() {
	return new Promise((done) => requestAnimationFrame(done));
}

function toggleOf(container: HTMLElement) {
	return container.querySelector<HTMLInputElement>('input.drawer-toggle');
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

		const toggle = toggleOf(container);
		expect(toggle?.getAttribute('aria-label')).toBe('Open sidebar');

		toggle?.click();
		await nextFrame();
		expect(toggle?.getAttribute('aria-label')).toBe('Close sidebar');
	});

	it('cierra el panel al navegar (closeOnNavigate activo por defecto)', async () => {
		const { container } = await render(Drawer, { children: children(), side: side() });
		const toggle = toggleOf(container);

		toggle?.click();
		await nextFrame();
		expect(toggle?.checked).toBe(true);

		// El layout no se remonta al navegar: sin este cierre, el checkbox llegaría marcado
		// a la página destino y el panel aparecería abierto.
		triggerAfterNavigate('/otra-pagina');
		await nextFrame();
		expect(toggle?.checked).toBe(false);
		// El nombre accesible vuelve a anunciar "abrir": el cierre pasó por el estado.
		expect(toggle?.getAttribute('aria-label')).toBe('Open sidebar');
	});

	it('la navegación de entrada (la hidratación) no cierra el panel', async () => {
		// Un `open` inicial de la app no debe perderse al montar: `enter` es la navegación
		// de la hidratación, no la llegada desde otra página.
		const { container } = await render(Drawer, {
			children: children(),
			side: side(),
			open: true
		});
		const toggle = toggleOf(container);
		expect(toggle?.checked).toBe(true);

		triggerAfterNavigate('/otra-pagina', 'enter');
		await nextFrame();
		expect(toggle?.checked).toBe(true);
	});

	it('closeOnNavigate={false} deja el cierre en manos de la app', async () => {
		const { container } = await render(Drawer, {
			children: children(),
			side: side(),
			closeOnNavigate: false
		});
		const toggle = toggleOf(container);

		toggle?.click();
		await nextFrame();

		triggerAfterNavigate('/otra-pagina');
		await nextFrame();
		expect(toggle?.checked).toBe(true);
	});

	it('la app cierra el panel por estado con bind:open, sin tocar el checkbox', async () => {
		// Lo que antes obligaba a simular un click nativo sobre el checkbox (para que
		// disparara `change`) ahora es escribir el estado enlazado.
		const { container } = await render(DrawerHarness);
		const toggle = toggleOf(container);

		toggle?.click();
		await nextFrame();
		expect(toggle?.checked).toBe(true);

		const appClose = container.querySelector<HTMLButtonElement>('button[data-testid="app-close"]');
		appClose?.click();
		await nextFrame();
		expect(toggle?.checked).toBe(false);
		expect(toggle?.getAttribute('aria-label')).toBe('Open sidebar');
	});
});
