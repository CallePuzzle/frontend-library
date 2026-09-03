/**
 * Mock de `$app/navigation` para Storybook y para los tests de componente.
 *
 * Mismo motivo que `app-paths.ts`: es un módulo virtual de SvelteKit que aquí no existe.
 * `ButtonSignOut` llama a `goto()` tras cerrar sesión; en Storybook eso no debe navegar
 * (rompería el iframe), así que se registra la navegación y se devuelve una promesa
 * resuelta. Los tests pueden leer `navigations` para comprobar el destino.
 */

/** Destinos a los que se ha "navegado", en orden. Útil para asertar en los tests. */
export const navigations: string[] = [];

export function goto(url: string | URL): Promise<void> {
	navigations.push(url.toString());
	return Promise.resolve();
}

export function invalidate(): Promise<void> {
	return Promise.resolve();
}

export function invalidateAll(): Promise<void> {
	return Promise.resolve();
}

export function refreshAll(): Promise<void> {
	return Promise.resolve();
}

export function preloadData(): Promise<{ type: 'loaded'; status: number; data: unknown }> {
	return Promise.resolve({ type: 'loaded', status: 200, data: {} });
}

export function preloadCode(): Promise<void> {
	return Promise.resolve();
}

export function pushState(): void {}
export function replaceState(): void {}
export function disableScrollHandling(): void {}

export function beforeNavigate(): void {}
export function afterNavigate(): void {}
export function onNavigate(): void {}
