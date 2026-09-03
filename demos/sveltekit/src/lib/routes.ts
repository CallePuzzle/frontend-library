import House from '@lucide/svelte/icons/house';
import Shield from '@lucide/svelte/icons/shield';
import type { RouteMap } from '@callepuzzle/core';
import type { RouteId } from '$app/types';
import { m } from './paraglide/messages.js';

/**
 * Mapa de navegación del demo.
 *
 * Dos cosas que enseña este fichero:
 *
 * 1. **La clave es la ruta.** No hay `url` ni `name`: la clave del mapa *es* el destino, y se
 *    tipa con el `RouteId` que genera SvelteKit, así que una ruta que no existe no compila.
 *    Tampoco hay `isProtected`: la protección real vive en los `+page.server.ts` /
 *    `+layout.server.ts` (ver `src/routes/admin/+page.server.ts`), no en una etiqueta de menú.
 *
 * 2. **Es una función, no una constante de módulo.** Los `m.*()` de Paraglide leen el idioma
 *    del request en curso; si se resolvieran al importar el módulo, el servidor congelaría el
 *    idioma de la primera petición que atendiera y lo serviría a todo el mundo. El layout la
 *    llama dentro de un `$derived`, así que las etiquetas se resuelven en render.
 *
 * `showInMenu` (menú de escritorio) y `showInMobile` (dock) son **independientes**:
 * `getMenuRoutes(routes, { mobile: true })` filtra en estricto por `showInMobile`, de modo que
 * una entrada que deba salir en los dos sitios declara los dos flags.
 */
export function getRoutes(): RouteMap<RouteId> {
	return {
		'/': {
			label: m.routes_home(),
			short: m.routes_home_short(),
			icon: House,
			showInMenu: true,
			showInMobile: true
		},
		'/admin': {
			label: m.routes_admin(),
			short: m.routes_admin_short(),
			icon: Shield,
			showInMenu: true,
			showInMobile: true
		}
	};
}
