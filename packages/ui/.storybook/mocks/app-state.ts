/**
 * Mock de `$app/state` para Storybook y para los tests de componente.
 *
 * Ningún componente de la librería lo usa hoy (los datos entran por props), pero el alias
 * está montado a propósito: en cuanto uno vuelva a leer `page`, la story seguirá
 * renderizando en vez de fallar al resolver el módulo virtual.
 */

export const page = {
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	route: { id: '/' as string | null },
	status: 200,
	error: null as Error | null,
	data: {} as Record<string, unknown>,
	state: {} as Record<string, unknown>,
	form: null as unknown
};

export const navigating = {
	from: null,
	to: null,
	type: null,
	willUnload: false,
	delta: null,
	complete: null
};

export const updated = { current: false, check: () => Promise.resolve(false) };
