import { describe, expect, it, vi } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import type { betterAuth } from 'better-auth';
import { betterAuthHandle } from './hooks.js';
import { getBetterAuth } from './server.js';

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
const SECURE_CONFIG = { baseURL: 'https://app.test', secret: 'x'.repeat(32) };

function fakeAuth(
	session?: { session: unknown; user: unknown } | null,
	config: { baseURL?: string; secret: string } = SECURE_CONFIG
) {
	const getSession = vi.fn(async () => session);
	const auth = {
		api: { getSession },
		// Lo único del contexto de better-auth que mira la comprobación de configuración.
		$context: Promise.resolve({ options: { baseURL: config.baseURL ?? '' }, secret: config.secret })
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
			'/logo.png',
			'/fonts/inter.woff2',
			'/service-worker.js'
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

		// `__data.json` es el `load` de servidor de una navegación en cliente: sin sesión ahí, el
		// usuario aparece desconectado al navegar. Los `.json`/`.xml`/`.txt` pueden ser rutas
		// `+server.ts` del consumidor que lean `locals.user`.
		for (const pathname of [
			'/',
			'/gang/12',
			'/api/auth/ok',
			'/admin/__data.json',
			'/__data.json',
			'/api/export.json',
			'/sitemap.xml',
			'/robots.txt'
		]) {
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

	describe('comprobación de configuración', () => {
		it('falla sin baseURL', async () => {
			const { auth, getSession } = fakeAuth(null, { secret: SECURE_CONFIG.secret });
			const handle = betterAuthHandle(auth, false);

			await expect(handle({ event: makeEvent('/'), resolve: makeResolve() })).rejects.toThrow(
				/baseURL/
			);
			expect(getSession).not.toHaveBeenCalled();
		});

		it('falla con una baseURL que no es http(s)', async () => {
			const { auth } = fakeAuth(null, {
				baseURL: 'javascript:alert(1)',
				secret: SECURE_CONFIG.secret
			});

			await expect(
				betterAuthHandle(auth, false)({ event: makeEvent('/'), resolve: makeResolve() })
			).rejects.toThrow(/baseURL/);
		});

		it('falla con el secreto por defecto de better-auth', async () => {
			const { auth } = fakeAuth(null, {
				baseURL: SECURE_CONFIG.baseURL,
				secret: 'better-auth-secret-123456789'
			});

			await expect(
				betterAuthHandle(auth, false)({ event: makeEvent('/'), resolve: makeResolve() })
			).rejects.toThrow(/secreto público/);
		});

		it('falla con un secreto corto', async () => {
			const { auth } = fakeAuth(null, { baseURL: SECURE_CONFIG.baseURL, secret: 'corto' });

			await expect(
				betterAuthHandle(auth, false)({ event: makeEvent('/'), resolve: makeResolve() })
			).rejects.toThrow(/32 caracteres/);
		});

		it('no comprueba nada durante el build', async () => {
			const { auth, getSession } = fakeAuth(null, { secret: 'better-auth-secret-123456789' });

			await betterAuthHandle(auth, true)({ event: makeEvent('/'), resolve: makeResolve() });

			expect(getSession).toHaveBeenCalledOnce();
		});
	});

	describe('contra una instancia real de better-auth', () => {
		// Fija que la comprobación lee bien el `$context` de better-auth: si una versión nueva
		// cambiase su forma, el mock de arriba seguiría pasando y esto no.
		it('acepta baseURL y secreto propios', async () => {
			const auth = getBetterAuth({ baseURL: 'https://app.test', secret: SECURE_CONFIG.secret });

			await expect(
				betterAuthHandle(auth, false)({ event: makeEvent('/'), resolve: makeResolve() })
			).resolves.toBeInstanceOf(Response);
		});

		it('rechaza una instancia sin baseURL', async () => {
			const auth = getBetterAuth({ secret: SECURE_CONFIG.secret });

			await expect(
				betterAuthHandle(auth, false)({ event: makeEvent('/'), resolve: makeResolve() })
			).rejects.toThrow(/baseURL/);
		});
	});
});
