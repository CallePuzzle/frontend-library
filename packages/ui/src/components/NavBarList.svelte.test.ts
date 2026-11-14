import House from '@lucide/svelte/icons/house';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import type { RouteMap } from '@callepuzzle/core';
// El `page` del contexto del navegador: es quien cambia el viewport del iframe de test
// (`page.viewport(ancho, alto)`), no el que devuelve `render()`.
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NavBarList from './NavBarList.svelte';
// Los asertos de estilo de aquí abajo necesitan la hoja real del paquete: el proyecto
// `component` no carga CSS de ningún sitio, y sin ella las utilidades (`sr-only`, la
// variante `max-2xl:`) no existen en el DOM del test. Es la misma hoja que ve el
// consumidor (`src/styles/index.css`, la que publica `./styles.css`).
import '../styles/index.css';

function labels(container: HTMLElement): string[] {
	return [...container.querySelectorAll('li a')].map((a) => a.textContent?.trim() ?? '');
}

describe('NavBarList', () => {
	it('sólo pinta las rutas con showInMenu', async () => {
		const routes: RouteMap = {
			'/': { label: 'Inicio', showInMenu: true },
			'/oculta': { label: 'Oculta' },
			'/solo-movil': { label: 'Sólo dock', showInMobile: true },
			'/ajustes': { label: 'Ajustes', showInMenu: true }
		};

		const { container } = await render(NavBarList, { routes });

		expect(labels(container)).toEqual(['Inicio', 'Ajustes']);
	});

	it('usa la clave del mapa como href, resuelta con resolve()', async () => {
		const routes: RouteMap = { '/tienda': { label: 'Tienda', showInMenu: true } };

		const { container } = await render(NavBarList, { routes });

		expect(container.querySelector('li a')?.getAttribute('href')).toBe('/tienda');
	});

	it('reacciona a un cambio de routes en runtime (B15)', async () => {
		// Es la regresión que hay que blindar: con `getMenuRoutes` en un `const` de módulo, el
		// menú se quedaba con las etiquetas del primer render (p. ej. al cambiar de idioma).
		const { container, rerender } = await render(NavBarList, {
			routes: { '/': { label: 'Home', showInMenu: true } } satisfies RouteMap
		});

		expect(labels(container)).toEqual(['Home']);

		await rerender({
			routes: {
				'/': { label: 'Inicio', showInMenu: true },
				'/tienda': { label: 'Tienda', showInMenu: true }
			} satisfies RouteMap
		});

		expect(labels(container)).toEqual(['Inicio', 'Tienda']);

		// Y también al quitar entradas, no sólo al añadirlas.
		await rerender({ routes: { '/tienda': { label: 'Tienda', showInMenu: true } } });

		expect(labels(container)).toEqual(['Tienda']);
	});

	it('compone las clases según el type y respeta la prop class', async () => {
		const routes: RouteMap = { '/': { label: 'Inicio', showInMenu: true } };

		const { container } = await render(NavBarList, { routes, type: 'drawer', class: 'p-0' });
		const list = container.querySelector('ul');

		expect(list?.className).toContain('menu');
		// `cn()` resuelve el conflicto: `p-0` del consumidor gana al `p-4` del componente.
		expect(list?.className).toContain('p-0');
		expect(list?.className).not.toContain('p-4');
	});

	it('reparte la prop ids a los enlaces internos, por clave del mapa', async () => {
		// Es el anclaje de los tours guiados (T14.1): sin esta prop, un consumidor con tour
		// tenía que reimplantar la lista entera para poner `id` a cada `<a>`.
		const routes = {
			'/': { label: 'Inicio', showInMenu: true },
			'/tienda': { label: 'Tienda', showInMenu: true }
		} satisfies RouteMap;

		const { container } = await render(NavBarList, {
			routes,
			ids: { '/tienda': 'tour-tienda' }
		});

		expect(container.querySelector('a[href="/"]')?.getAttribute('id')).toBeNull();
		expect(container.querySelector('a[href="/tienda"]')?.getAttribute('id')).toBe('tour-tienda');
	});

	it('en horizontal, bajo 2xl, esconde la etiqueta (icono sólo) conservando el nombre accesible (#37)', async () => {
		// El disclosure progresivo: con menús grandes (el caso real, 9 secciones), las
		// etiquetas no caben en portátil y navbar-end tapa las últimas entradas. `sr-only`
		// saca el texto del flujo visual, no del árbol de accesibilidad.
		const routes: RouteMap = {
			'/': { label: 'Home', icon: House, showInMenu: true },
			'/tienda': { label: 'Tienda', icon: ShoppingCart, showInMenu: true }
		};

		const { container, getByRole } = await render(NavBarList, { routes });
		await page.viewport(1280, 720);

		// El nombre accesible de cada enlace sigue siendo la etiqueta.
		expect(getByRole('link', { name: 'Home' }).elements()).toHaveLength(1);
		expect(getByRole('link', { name: 'Tienda' }).elements()).toHaveLength(1);

		// Y el media query aplica de verdad (con reintentos: el resize del iframe resuelve su
		// promesa antes de que el recálculo asiente en el layout): no basta con que la clase
		// esté en el fuente.
		const spans = container.querySelectorAll('li a > span');
		expect(spans).toHaveLength(2);
		await vi.waitFor(() => {
			for (const span of spans) {
				expect(getComputedStyle(span).position).toBe('absolute');
			}
		});
	});

	it('en drawer la etiqueta sigue visible bajo 2xl: el disclosure es sólo del horizontal (#37)', async () => {
		const routes: RouteMap = { '/': { label: 'Home', icon: House, showInMenu: true } };

		const { container } = await render(NavBarList, { routes, type: 'drawer' });
		await page.viewport(1280, 720);

		const span = container.querySelector('li a > span');
		expect(span?.textContent).toBe('Home');
		expect(getComputedStyle(span as Element).position).toBe('static');
	});

	it('una entrada sin icono conserva la etiqueta bajo 2xl: esconderla dejaría el enlace vacío (#37)', async () => {
		const routes: RouteMap = {
			'/': { label: 'Home', icon: House, showInMenu: true },
			'/ajustes': { label: 'Settings', showInMenu: true }
		};

		const { container } = await render(NavBarList, { routes });
		await page.viewport(1280, 720);

		expect(getComputedStyle(container.querySelector('a[href="/"] span') as Element).position).toBe(
			'absolute'
		);
		expect(
			getComputedStyle(container.querySelector('a[href="/ajustes"] span') as Element).position
		).toBe('static');
	});

	it('a partir de 2xl se ve icono+etiqueta como siempre (#37)', async () => {
		const routes: RouteMap = { '/': { label: 'Home', icon: House, showInMenu: true } };

		const { container } = await render(NavBarList, { routes });
		await page.viewport(1536, 720);

		const span = container.querySelector('li a > span');
		expect(span).not.toBeNull();
		// Con reintentos: el resize del iframe resuelve su promesa antes de que el recálculo
		// de media queries asiente en el layout.
		await vi.waitFor(() => {
			expect(getComputedStyle(span as Element).position).toBe('static');
		});

		// Restaura el viewport: la página del navegador se comparte entre tests del fichero.
		await page.viewport(1280, 720);
		await vi.waitFor(() => {
			expect(getComputedStyle(span as Element).position).toBe('absolute');
		});
	});
});
