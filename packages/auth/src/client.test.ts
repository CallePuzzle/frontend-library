import { describe, expect, it } from 'vitest';
import * as clientModule from './client.js';
import { createCallepuzzleAuthClient } from './client.js';

/** `fetch` de mentira: cada "request" simulada devuelve su propio usuario. */
function fakeFetch(name: string) {
	return async () =>
		new Response(JSON.stringify({ session: { id: `s-${name}` }, user: { id: name } }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
}

function createClientFor(name: string) {
	return createCallepuzzleAuthClient({
		baseURL: 'http://localhost/api/auth',
		fetchOptions: { customFetchImpl: fakeFetch(name) }
	});
}

/** Atom de sesión de un cliente concreto (los stores de better-auth se crean por cliente). */
function sessionAtomOf(client: ReturnType<typeof createCallepuzzleAuthClient>) {
	const atom = client.$store.atoms.session;
	if (!atom) throw new Error('el cliente no tiene atom de sesión');
	return atom;
}

describe('createCallepuzzleAuthClient', () => {
	it('no expone ningún estado de sesión en scope de módulo', () => {
		// Regresión de H5.1: `export const session = useSession()` se evaluaba una vez por proceso
		// Node, así que en SSR el store era compartido por todos los usuarios del servidor.
		expect(Object.keys(clientModule)).toEqual(['createCallepuzzleAuthClient']);
	});

	it('devuelve un cliente distinto en cada llamada', () => {
		const a = createCallepuzzleAuthClient();
		const b = createCallepuzzleAuthClient();

		expect(a).not.toBe(b);
		expect(a.$store).not.toBe(b.$store);
		expect(a.useSession()).not.toBe(b.useSession());
	});

	it('dos requests simuladas no comparten el estado de sesión', () => {
		const alice = createCallepuzzleAuthClient({ baseURL: 'http://localhost/api/auth' });
		const bob = createCallepuzzleAuthClient({ baseURL: 'http://localhost/api/auth' });

		const aliceAtom = sessionAtomOf(alice);
		const bobAtom = sessionAtomOf(bob);

		aliceAtom.set({
			data: { session: { id: 's-alice' }, user: { id: 'alice' } },
			error: null,
			isPending: false,
			isRefetching: false
		});

		expect(aliceAtom.get().data).toMatchObject({ user: { id: 'alice' } });
		expect(bobAtom.get().data).toBeNull();
	});

	it('dos requests simuladas resuelven cada una su propia sesión', async () => {
		const alice = createClientFor('alice');
		const bob = createClientFor('bob');

		const [sessionAlice, sessionBob] = await Promise.all([alice.getSession(), bob.getSession()]);

		expect(sessionAlice.data?.user.id).toBe('alice');
		expect(sessionBob.data?.user.id).toBe('bob');
	});

	it('conserva los tipos reales de better-auth (sin `any`)', async () => {
		const client = createClientFor('alice');
		const { data } = await client.getSession();

		// Si el cliente fuese `any` esto compilaría con cualquier nombre de campo; al ser el tipo
		// real de better-auth, `tsc --noEmit` protege este acceso.
		expect(typeof data?.session.id).toBe('string');

		// @ts-expect-error `noSuchField` no existe en la sesión de better-auth.
		expect(data?.session.noSuchField).toBeUndefined();
	});
});
