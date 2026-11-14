import Archive from '@lucide/svelte/icons/archive';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import ChefHat from '@lucide/svelte/icons/chef-hat';
import History from '@lucide/svelte/icons/history';
import House from '@lucide/svelte/icons/house';
import ListIcon from '@lucide/svelte/icons/list';
import Settings from '@lucide/svelte/icons/settings';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Users from '@lucide/svelte/icons/users';
import type { RouteMap } from '@callepuzzle/core';
// El `page` del contexto del navegador: es quien cambia el viewport del iframe de test
// (`page.viewport(ancho, alto)`), no el que devuelve `render()`.
import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Header from './Header.svelte';
// El aserto de clicabilidad necesita el CSS real (el layout `navbar`/`navbar-end` de
// daisyUI es el que tapa los enlaces): el proyecto `component` no carga hoja alguna, así
// que se importa la misma que ve el consumidor (`src/styles/index.css`).
import '../styles/index.css';

function title() {
	return createRawSnippet(() => ({ render: () => '<span>CallePuzzle</span>' }));
}

/**
 * Ocupa la zona derecha como el `NavBarEnd` de un consumidor real (búsqueda, selector de
 * familia, idioma y usuario): es el bloque que, cuando el menú no cabe, tapa las últimas
 * entradas del centro.
 */
function navEnd() {
	return createRawSnippet(() => ({
		render: () =>
			'<div class="navbar-end gap-1">' +
			'<button type="button" class="btn btn-circle btn-ghost">S</button>' +
			'<button type="button" class="btn btn-ghost">Familia López García</button>' +
			'<button type="button" class="btn btn-ghost">ES</button>' +
			'<button type="button" class="btn btn-circle btn-ghost">A</button>' +
			'</div>'
	}));
}

/** Las 9 secciones de escritorio del consumidor afectado (el disparador del #37). */
const nineRoutes: RouteMap = {
	'/': { label: 'Home', icon: House, showInMenu: true },
	'/shop': { label: 'Shop', icon: ShoppingCart, showInMenu: true },
	'/recipes': { label: 'Recipes', icon: ChefHat, showInMenu: true },
	'/lists': { label: 'Lists', icon: ListIcon, showInMenu: true },
	'/pantry': { label: 'Pantry', icon: Archive, showInMenu: true },
	'/history': { label: 'History', icon: History, showInMenu: true },
	'/families': { label: 'Families', icon: Users, showInMenu: true },
	'/reports': { label: 'Reports', icon: ChartColumn, showInMenu: true },
	'/settings': { label: 'Settings', icon: Settings, showInMenu: true }
};

/** Cada enlace cabe entero en el viewport y es el punto de impacto de su propio centro. */
function expectAllOnScreen(links: HTMLAnchorElement[]) {
	for (const link of links) {
		const rect = link.getBoundingClientRect();
		expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
		const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
		expect(hit).not.toBeNull();
		expect(link.contains(hit)).toBe(true);
	}
}

/**
 * La aserción que destapa el #37: además de lo anterior, **ninguna entrada invade la zona
 * de navbar-end** (el solape geométrico es el bug: `.navbar-center` de daisyUI no encoge y
 * las últimas entradas quedaban bajo los controles de la derecha). `end` es el bloque de
 * navbar-end; su posición se mide dentro de la función porque, al reflow del cambio de
 * viewport, se mueve.
 */
function expectAllReachable(links: HTMLAnchorElement[], end: Element) {
	const endLeft = end.getBoundingClientRect().left;
	for (const link of links) {
		const rect = link.getBoundingClientRect();
		expect(rect.right).toBeLessThanOrEqual(endLeft);
	}
	expectAllOnScreen(links);
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

	it('a 1280px las 9 entradas del menú caben y son clicables; a 2xl vuelve icono+etiqueta (#37)', async () => {
		const { container } = await render(Header, {
			title: title(),
			routes: nineRoutes,
			navEnd: navEnd()
		});

		/**
		 * El resize del iframe resuelve su promesa antes de que el recálculo de las media
		 * queries asiente en el layout: se espera, con reintentos, a que la etiqueta esté en
		 * el estado que toca antes de medir nada (`sr-only` = `absolute` bajo 2xl).
		 */
		const labelPosition = () => {
			const span = container.querySelector('nav li a > span');
			expect(span).not.toBeNull();
			// `as` concentrado: el `expect` de arriba ya garantizó que no es null.
			return getComputedStyle(span as Element).position;
		};

		// El criterio de aceptación del #37, literal: es el ancho de portátil donde el
		// consumidor perdía «Historial»/«Familias» bajo navbar-end y su e2e se colgaba
		// porque el click nunca llegaba al enlace.
		const end = container.querySelector('.navbar-end');
		expect(end).not.toBeNull();
		// `as` concentrado: el `expect` de arriba ya garantizó que no es null.
		const endBlock = end as Element;

		await page.viewport(1280, 720);
		await vi.waitFor(() => expect(labelPosition()).toBe('absolute'));
		let links = [...container.querySelectorAll<HTMLAnchorElement>('nav li a')];
		expect(links).toHaveLength(9);
		expectAllReachable(links, endBlock);

		// Y a partir de `2xl` se ve icono+etiqueta «como hoy»: visibles y clicable su centro.
		// (Con 9 etiquetas y una navbar-end ocupada, el solape de 1536 en adelante es el que
		// ya había antes del #37: el acuerdo sólo cambia el rango de portátil, <2xl.)
		await page.viewport(1536, 720);
		await vi.waitFor(() => expect(labelPosition()).toBe('static'));
		links = [...container.querySelectorAll<HTMLAnchorElement>('nav li a')];
		expect(links).toHaveLength(9);
		expectAllOnScreen(links);

		// La página del navegador se comparte entre tests del fichero: se restaura el
		// viewport por debajo de 2xl, que es lo que asumen los otros tests.
		await page.viewport(1280, 720);
		await vi.waitFor(() => expect(labelPosition()).toBe('absolute'));
	});
});
