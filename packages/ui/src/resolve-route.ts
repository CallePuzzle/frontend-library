import { resolve } from '$app/paths';

/**
 * `resolve()` de SvelteKit 3 sólo acepta los ids de ruta del proyecto **donde se compila**, y
 * aquí eso es la librería (sin rutas: su `RouteId` es una unión vacía), así que para TypeScript
 * el propio `resolve` queda inaccesible. Este envoltorio concentra el único `as` del paquete
 * (misma pauta que el `field as FormPath<T>` de `FormString`): en la app consumidora —que sí
 * tiene rutas— los ids que llegan aquí ya los validó el compilador al tipar su
 * `RouteMap<RouteId>`.
 *
 * @param route Id de ruta (`'/admin'`), tal y como se usa como clave del `RouteMap`.
 */
export function resolveRoute(route: string): string {
	return (resolve as (route: string) => string)(route);
}
