import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Header from './Header.svelte';

function title() {
	return createRawSnippet(() => ({ render: () => '<span>CallePuzzle</span>' }));
}

describe('Header', () => {
	it('el botón hamburguesa tiene nombre accesible por texto, no por aria-label', async () => {
		// `aria-label` está prohibido sobre `<label>` (ARIA in HTML): falla el audit de
		// Lighthouse `aria-prohibited-attr`. El nombre viene de un `sr-only` dentro.
		const { container } = await render(Header, { title: title(), menuToggleFor: 'drawer-x' });

		const hamburger = container.querySelector<HTMLLabelElement>('label[for="drawer-x"]');
		expect(hamburger).not.toBeNull();
		expect(hamburger?.hasAttribute('aria-label')).toBe(false);
		expect(hamburger?.querySelector('.sr-only')?.textContent).toBe('Open sidebar');
	});

	it('sin menuToggleFor no hay botón hamburguesa', async () => {
		const { container } = await render(Header, { title: title() });

		expect(container.querySelector('label[for]')).toBeNull();
	});
});
