import { describe, expect, it, vi } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import type { betterAuth } from 'better-auth';
import { betterAuthHandle } from './hooks.js';

// `svelteKitHandler` es el final de la cadena: en estos tests sólo interesa que delegue la
// respuesta, así que se sustituye por un passthrough y se espía.
vi.mock('better-auth/svelte-kit', () => ({
	svelteKitHandler: vi.fn(
		async ({ resolve, event }: { resolve: (e: unknown) => Promise<Response>; event: unknown }) =>
			resolve(event)
	)
}));

type BetterAuthInstance = ReturnType<typeof betterAuth>;

type HandlerEvent = Parameters<Handle>[0]['event'];

/**
 * Instancia de auth falsa. Devuelve el espía aparte: una vez proyectado el objeto al tipo de
 * better-auth, `vi.fn` pierde sus métodos de espía (`mockClear`, …).
 */
function fakeAuth(session?: { session: unknown; user: unknown } | null) {
	const getSession = vi.fn(async () => session);
	const auth = {
		api: { getSession }
	} as unknown as BetterAuthInstance;

	return { auth, getSession };
}

function makeEvent(pathname: string): HandlerEvent {
	const url = new URL(`https://app.test${pathname}`);
	return {
		request: new Request(url),
		url,
		locals: {}
	} as unknown as HandlerEvent;
}

function makeResolve() {
	return vi.fn(async () => new Response('ok'));
}

describe('betterAuthHandle', () => {
	it('resuelve la sesión y la deja en locals', async () => {
		const { auth, getSession } = fakeAuth({ session: { userId: 'u1' }, user: { id: 'u1' } });
		const event = makeEvent('/');
		const resolve = makeResolve();

		await betterAuthHandle(auth, false)({ event, resolve });

		expect(getSession).toHaveBeenCalledOnce();
		expect(event.locals).toEqual({ session: { userId: 'u1' }, user: { id: 'u1' } });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('sin sesión deja locals intacto', async () => {
		const { auth, getSession } = fakeAuth(null);
		const event = makeEvent('/');
		const resolve = makeResolve();

		await betterAuthHandle(auth, false)({ event, resolve });

		expect(getSession).toHaveBeenCalledOnce();
		expect(event.locals).toEqual({});
	});

	it('con skipAssets salta el handle entero en rutas de assets', async () => {
		const { auth, getSession } = fakeAuth({ session: {}, user: {} });
		const resolve = makeResolve();
		const handle = betterAuthHandle(auth, false, { skipAssets: true });

		for (const pathname of [
			'/_app/immutable/entry/start.js',
			'/favicon.ico',
			'/robots.txt',
			'/logo.png',
			'/service-worker.js',
			'/manifest.webmanifest'
		]) {
			const event = makeEvent(pathname);
			await handle({ event, resolve });

			// El `resolve` es el que responde: ni getSession ni svelteKitHandler.
			expect(resolve).toHaveBeenCalledOnce();
			expect(getSession).not.toHaveBeenCalled();
			resolve.mockClear();
		}
	});

	it('con skipAssets no salta las rutas normales ni las de la API de auth', async () => {
		const { auth, getSession } = fakeAuth(null);
		const handle = betterAuthHandle(auth, false, { skipAssets: true });

		for (const pathname of ['/', '/gang/12', '/api/auth/ok']) {
			const event = makeEvent(pathname);
			await handle({ event, resolve: makeResolve() });

			expect(getSession).toHaveBeenCalledOnce();
			getSession.mockClear();
		}
	});

	it('sin skipAssets resuelve sesión también en assets (comportamiento por defecto intacto)', async () => {
		const { auth, getSession } = fakeAuth(null);
		const event = makeEvent('/logo.png');
		const resolve = makeResolve();

		await betterAuthHandle(auth, false)({ event, resolve });

		expect(getSession).toHaveBeenCalledOnce();
	});
});
