import type { Handle } from '@sveltejs/kit';
import type { betterAuth } from 'better-auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

/** Instancia de better-auth tal y como la devuelve `betterAuth()` / `getBetterAuth()`. */
type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Campos que este handle escribe en `event.locals`, tipados a partir de la instancia de auth.
 *
 * La librería **no** augmenta `App.Locals` (eso lo decide la app), así que aquí se tipa de forma
 * estructural y local. El consumidor debe declarar estos mismos campos en su `src/app.d.ts`,
 * dentro del bloque global que ya genera SvelteKit, para poder leerlos desde sus `load`:
 *
 * ```ts
 * // src/app.d.ts
 * import type { auth } from '$lib/server/auth';
 *
 * type Session = typeof auth.$Infer.Session;
 *
 * // dentro del `declare` + `global` que trae la plantilla de SvelteKit:
 * namespace App {
 * 	interface Locals {
 * 		session?: Session['session'];
 * 		user?: Session['user'];
 * 	}
 * }
 * ```
 *
 * Donde `auth` es la instancia devuelta por `getBetterAuth()` en `$lib/server/auth`.
 */
export type BetterAuthLocals<A extends BetterAuthInstance = BetterAuthInstance> = {
	session?: A['$Infer']['Session']['session'];
	user?: A['$Infer']['Session']['user'];
};

/**
 * Opciones del {@link betterAuthHandle}.
 */
export type BetterAuthHandleOptions = {
	/**
	 * No resolver sesión (ni pasar por better-auth) en peticiones de assets estáticos: rutas
	 * bajo `/_app/`, el service worker y ficheros con extensión estática (`ico`, `png`, `svg`,
	 * `json`…). Un asset nunca resuelve sesión ni atiende `/api/auth/*`, así que saltárselo se
	 * ahorra una llamada a `auth.api.getSession` por fichero servido. Es opt-in para que el
	 * comportamiento por defecto no cambie bajo nadie.
	 */
	skipAssets?: boolean;
};

const ASSET_PATHNAME_PATTERN = /\.(?:ico|png|jpe?g|svg|webp|json|txt|xml|webmanifest)$/;

function isAssetPathname(pathname: string): boolean {
	return (
		pathname.startsWith('/_app/') ||
		pathname === '/service-worker.js' ||
		ASSET_PATHNAME_PATTERN.test(pathname)
	);
}

/**
 * `Handle` de SvelteKit que resuelve la sesión una vez por request, la deja en `event.locals` y
 * delega en el handler de better-auth (que atiende las rutas `/api/auth/*`).
 *
 * `building` viene de `$app/environment`: durante el prerender no hay request real y better-auth
 * necesita saberlo.
 *
 * ```ts
 * // src/hooks.server.ts
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { betterAuthHandle } from '@callepuzzle/auth/hooks';
 * import { auth } from '$lib/server/auth';
 * import { building } from '$app/environment';
 *
 * export const handle = sequence(betterAuthHandle(auth, building, { skipAssets: true }));
 * ```
 *
 * Requiere la augmentación de `App.Locals` documentada en {@link BetterAuthLocals}.
 */
export const betterAuthHandle =
	<A extends BetterAuthInstance>(
		auth: A,
		building: boolean,
		options: BetterAuthHandleOptions = {}
	): Handle =>
	async ({ event, resolve }) => {
		// Seguro: ningún asset pathname es una ruta de la API de better-auth, así que el salto
		// no puede desactivar el login.
		if (options.skipAssets && isAssetPathname(event.url.pathname)) {
			return resolve(event);
		}

		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			// `event.locals` se trata estructuralmente: la librería no declara `App.Locals`.
			const locals: BetterAuthLocals<A> = event.locals;
			locals.session = session.session;
			locals.user = session.user;
		}

		return svelteKitHandler({ event, resolve, auth, building });
	};
