import type { RouteMap } from '@callepuzzle/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NavBarList from './NavBarList.svelte';

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
});
