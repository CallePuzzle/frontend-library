/**
 * Mock de `$app/paths` para Storybook y para los tests de componente.
 *
 * `$app/paths` es un módulo **virtual** que genera el plugin de vite de SvelteKit. Este
 * paquete es una librería (framework `@storybook/svelte-vite`, sin `app.html` ni
 * `sveltekit()` en `vite.config.ts`), así que ese módulo no existe aquí: sin este mock,
 * cualquier story que renderice `Link` —es decir, casi todas— explota con
 * "Failed to resolve import $app/paths".
 *
 * Se monta como alias de vite en `.storybook/vite-aliases.ts`.
 */

/** Prefijo de las rutas. Configurable para poder demostrar el efecto de `paths.base`. */
export let base = '';

/** En una app real es el CDN de los assets. Aquí basta con el mismo prefijo. */
export const assets = '';

/** Cambia el `base` que aplica `resolve()`. Sólo para los mocks. */
export function setBase(value: string): void {
	base = value;
}

/**
 * Versión de `resolve()` reducida a lo que necesita la librería: prefijar `base` y
 * sustituir los parámetros de la ruta. El `resolve` real valida el id contra el
 * `RouteId` del proyecto; aquí no hay rutas que validar.
 */
export function resolve(id: string, params?: Record<string, string | string[]>): string {
	let path = id;

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			const replacement = Array.isArray(value) ? value.join('/') : value;
			path = path
				.replace(`[...${key}]`, replacement)
				.replace(`[[${key}]]`, replacement)
				.replace(`[${key}]`, replacement);
		}
	}

	// Los grupos de layout (`(app)`) y los parámetros sin valor no forman parte de la URL.
	path = path.replace(/\/\([^)]+\)/g, '').replace(/\/\[\[[^\]]+\]\]/g, '');

	return `${base}${path}` || '/';
}

/** `asset()` de SvelteKit: resuelve un fichero de `static/`. */
export function asset(file: string): string {
	return `${assets}${file}`;
}
