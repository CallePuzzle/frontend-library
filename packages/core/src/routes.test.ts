import { describe, expect, it } from 'vitest';
import { getMenuRoutes, type RouteMap } from './routes.js';

const routes: RouteMap<'/' | '/activities' | '/profile' | '/admin'> = {
	'/': { label: 'Home', showInMenu: false, showInMobile: true },
	'/activities': { label: 'Activities', short: 'Acts', showInMenu: true },
	'/profile': { label: 'Profile', showInMobile: true },
	'/admin': { label: 'Admin' }
};

describe('getMenuRoutes', () => {
	it('devuelve solo las rutas con showInMenu en escritorio', () => {
		expect(getMenuRoutes(routes)).toEqual([
			{ id: '/activities', label: 'Activities', short: 'Acts', showInMenu: true }
		]);
	});

	it('devuelve solo las rutas con showInMobile con { mobile: true }', () => {
		expect(getMenuRoutes(routes, { mobile: true })).toEqual([
			{ id: '/', label: 'Home', showInMenu: false, showInMobile: true },
			{ id: '/profile', label: 'Profile', showInMobile: true }
		]);
	});

	it('trata { mobile: false } como el filtro de escritorio', () => {
		expect(getMenuRoutes(routes, { mobile: false })).toEqual(getMenuRoutes(routes));
	});

	it('preserva la clave del mapa como id y el orden de declaración', () => {
		const menu: RouteMap = {
			'/b': { label: 'B', showInMenu: true },
			'/a': { label: 'A', showInMenu: true }
		};

		expect(getMenuRoutes(menu).map((route) => route.id)).toEqual(['/b', '/a']);
	});

	it('devuelve un array vacío con un mapa vacío', () => {
		expect(getMenuRoutes({})).toEqual([]);
		expect(getMenuRoutes({}, { mobile: true })).toEqual([]);
	});

	it('excluye las entradas sin flags de visibilidad', () => {
		expect(getMenuRoutes({ '/admin': { label: 'Admin' } })).toEqual([]);
		expect(getMenuRoutes({ '/admin': { label: 'Admin' } }, { mobile: true })).toEqual([]);
	});

	it('ignora las claves con valor undefined', () => {
		const menu: RouteMap = { '/a': undefined, '/b': { label: 'B', showInMenu: true } };

		expect(getMenuRoutes(menu)).toEqual([{ id: '/b', label: 'B', showInMenu: true }]);
	});
});
