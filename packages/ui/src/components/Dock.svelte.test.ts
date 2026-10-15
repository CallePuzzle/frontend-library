import type { RouteMap } from '@callepuzzle/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Dock from './Dock.svelte';

function links(container: HTMLElement): HTMLAnchorElement[] {
	return [...container.querySelectorAll('a')];
}

describe('Dock', () => {
	it('sólo pinta las rutas con showInMobile (filtro estricto)', async () => {
		const routes: RouteMap = {
			'/': { label: 'Inicio', showInMobile: true },
			'/oculta': { label: 'Oculta', showInMenu: true },
			'/solo-menu': { label: 'Sólo escritorio', showInMenu: true }
		};

		const { container } = await render(Dock, { routes, currentPath: '/' });

		expect(links(container).map((a) => a.getAttribute('href'))).toEqual(['/']);
	});

	it('marca la ruta activa con dock-active y aria-current', async () => {
		const routes: RouteMap = { '/tienda': { label: 'Tienda', showInMobile: true } };

		const { container } = await render(Dock, { routes, currentPath: '/tienda' });

		const active = container.querySelector('a');
		expect(active?.className).toContain('dock-active');
		expect(active?.getAttribute('aria-current')).toBe('page');
	});

	it('reparte la prop ids a los enlaces internos, por clave del mapa', async () => {
		// Es el anclaje de los tours guiados (T14.1): sin esta prop, un consumidor con tour
		// tenía que reimplantar el `<nav>` entero para poner `id` a cada `<a>`.
		const routes = {
			'/': { label: 'Inicio', showInMobile: true },
			'/perfil': { label: 'Perfil', showInMobile: true }
		} satisfies RouteMap;

		const { container } = await render(Dock, {
			routes,
			currentPath: '/',
			ids: { '/perfil': 'tour-perfil' }
		});

		expect(container.querySelector('a[href="/"]')?.getAttribute('id')).toBeNull();
		expect(container.querySelector('a[href="/perfil"]')?.getAttribute('id')).toBe('tour-perfil');
	});
});
