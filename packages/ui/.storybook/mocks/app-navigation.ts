/**
 * Mock de `$app/navigation` para Storybook y para los tests de componente.
 *
 * Mismo motivo que `app-paths.ts`: es un módulo virtual de SvelteKit que aquí no existe.
 * `ButtonSignOut` llama a `goto()` tras cerrar sesión y el `Drawer` se registra en
 * `afterNavigate()`; en Storybook eso no debe navegar (rompería el iframe), así que solo
 * se registra. Los tests pueden leer `navigations` y disparar la última navegación
 * registrada con `triggerAfterNavigate()`.
 */

import type { AfterNavigate } from '@sveltejs/kit';

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
export function onNavigate(): void {}

/**
 * Callbacks registrados con `afterNavigate`, en orden. El último es el del componente
 * renderizado más recientemente, que es el que dispara `triggerAfterNavigate()`.
 */
export const afterNavigateCallbacks: ((navigation: AfterNavigate) => void)[] = [];

export function afterNavigate(callback: (navigation: AfterNavigate) => void): void {
	afterNavigateCallbacks.push(callback);
}

/**
 * Dispara el último `afterNavigate` registrado, igual que hace el router de SvelteKit al
 * completar una navegación client-side —también al re-pulsar la entrada de la página
 * actual, que es una navegación `link` completa. El `type` permite simular el caso
 * especial de entrada (`'enter'`, la hidratación), que no debería cerrar nada.
 */
export function triggerAfterNavigate(url = '/', type: AfterNavigate['type'] = 'link'): void {
	const callback = afterNavigateCallbacks.at(-1);
	if (!callback) throw new Error('Nadie se ha registrado todavía en `afterNavigate`.');

	callback({
		from: null,
		to: { params: {}, route: { id: null }, url: new URL(url, 'https://storybook.test') },
		type,
		willUnload: false,
		complete: Promise.resolve()
	});
}
