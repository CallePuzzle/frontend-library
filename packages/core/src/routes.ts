import type { Component } from 'svelte';

/**
 * Configuración de una entrada de navegación.
 *
 * No hay `url`: la **clave** del `RouteMap` es la ruta. Tampoco hay `isProtected` ni
 * `permissions` (la protección real vive en los `+layout.server.ts` del consumidor).
 */
export type RouteConfig = {
	/** Etiqueta ya resuelta por el consumidor (i18n en render, nunca en scope de módulo). */
	label: string;
	/** Variante corta de `label`, para menús estrechos o docks. */
	short?: string;
	/** Icono a renderizar junto a la etiqueta. */
	icon?: Component;
	/** Aparece en el menú principal (escritorio). */
	showInMenu?: boolean;
	/** Aparece en la navegación móvil (dock). */
	showInMobile?: boolean;
};

/**
 * Mapa de rutas de la aplicación. La clave *es* la ruta; el consumidor la tipa con su
 * `RouteId` de `$app/types`:
 *
 * ```ts
 * import type { RouteId } from '$app/types';
 * import type { RouteMap } from '@callepuzzle/core';
 * export const routes: RouteMap<RouteId> = { '/': { label: 'Home', showInMenu: true } };
 * ```
 */
export type RouteMap<Id extends string = string> = Partial<Record<Id, RouteConfig>>;

/** Entrada de navegación con su clave reinyectada como `id`. */
export type Route<Id extends string = string> = RouteConfig & { id: Id };

/**
 * Devuelve las entradas visibles del menú, con la clave del mapa reinyectada como `id`.
 *
 * - Por defecto filtra por `showInMenu` (menú de escritorio).
 * - Con `{ mobile: true }` filtra por `showInMobile` (dock móvil).
 */
export function getMenuRoutes<Id extends string>(
	routes: RouteMap<Id>,
	opts: { mobile?: boolean } = {}
): Route<Id>[] {
	// `Object.entries` pierde el tipo de la clave; es la única forma de recuperarlo.
	const entries = Object.entries(routes) as [Id, RouteConfig | undefined][];
	const visible = opts.mobile === true ? 'showInMobile' : 'showInMenu';

	const result: Route<Id>[] = [];
	for (const [id, config] of entries) {
		if (config?.[visible] === true) {
			result.push({ ...config, id });
		}
	}

	return result;
}
