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
	 * bajo `/_app/`, el service worker y ficheros de imagen o de fuente (`ico`, `png`, `svg`,
	 * `woff2`…). Un asset nunca resuelve sesión ni atiende `/api/auth/*`, así que saltárselo se
	 * ahorra una llamada a `auth.api.getSession` por fichero servido. Es opt-in para que el
	 * comportamiento por defecto no cambie bajo nadie.
	 */
	skipAssets?: boolean;
};

/**
 * Extensiones que se tratan como asset. Solo imágenes y fuentes, a propósito: **nada de
 * `json`, `txt` ni `xml`**. SvelteKit pide el `load` de servidor de cada navegación en cliente
 * a `/<ruta>/__data.json`, y un `+server.ts` del consumidor puede llamarse `datos.json` o
 * `sitemap.xml`; saltarse esas peticiones dejaba `locals.user` vacío y el usuario aparecía
 * desconectado en cuanto navegaba.
 */
const ASSET_PATHNAME_PATTERN = /\.(?:ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf)$/;

/** El secreto por defecto de better-auth (`DEFAULT_SECRET`): público, firma cookies falsificables. */
const BETTER_AUTH_DEFAULT_SECRET = 'better-auth-secret-123456789';

/** Longitud mínima del secreto: la que recomienda better-auth (`openssl rand -base64 32`). */
const MIN_SECRET_LENGTH = 32;

/**
 * Comprueba que la instancia no depende de valores inseguros. Lee el contexto ya resuelto de
 * better-auth, así que cuentan igual las opciones explícitas (`secret`, `baseURL`) que las
 * variables de entorno que lee better-auth (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
 *
 * - **Sin `baseURL`**, better-auth la deduce de las cabeceras `X-Forwarded-Host` /
 *   `X-Forwarded-Proto` de la primera petición a `/api/auth/*` y la conserva para todo el
 *   proceso: quien envíe esa primera petición decide a qué dominio apuntan los magic links (con
 *   el token dentro) de todos los usuarios, y ese dominio pasa a ser un origen de confianza.
 * - **Sin secreto**, better-auth firma con uno público y en producción solo lo avisa por log.
 */
async function assertSecureAuthConfig(auth: BetterAuthInstance): Promise<void> {
	const context = await auth.$context;
	const problems: string[] = [];

	const baseURL = context.options.baseURL;
	let protocol: string | undefined;
	try {
		protocol = baseURL ? new URL(baseURL).protocol : undefined;
	} catch {
		protocol = undefined;
	}
	if (protocol !== 'https:' && protocol !== 'http:') {
		problems.push(
			'falta `baseURL` (o `BETTER_AUTH_URL`): sin ella better-auth deduce la URL pública de ' +
				'las cabeceras X-Forwarded-* de la petición, y los magic links pueden apuntar a otro dominio'
		);
	}

	if (context.secret === BETTER_AUTH_DEFAULT_SECRET) {
		problems.push('falta `secret` (o `BETTER_AUTH_SECRET`): better-auth usaría su secreto público');
	} else if (context.secret.length < MIN_SECRET_LENGTH) {
		problems.push(
			`el secreto tiene menos de ${MIN_SECRET_LENGTH} caracteres: genera uno con ` +
				'`openssl rand -base64 32`'
		);
	}

	if (problems.length > 0) {
		throw new Error(`[@callepuzzle/auth] configuración insegura: ${problems.join('; ')}.`);
	}
}

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
 *
 * Fuera del build, antes de atender la primera petición comprueba que la instancia tiene
 * `baseURL` y un secreto propio de al menos 32 caracteres. Si no, **todas las peticiones fallan**
 * con un error que explica qué falta: es preferible a servir magic links que apuntan a donde
 * diga una cabecera o cookies firmadas con un secreto público.
 */
export const betterAuthHandle = <A extends BetterAuthInstance>(
	auth: A,
	building: boolean,
	options: BetterAuthHandleOptions = {}
): Handle => {
	// Una sola comprobación por proceso. Se lanza en la primera petición, no al crear el handle:
	// el contexto de better-auth es asíncrono. En el build no hay requests ni variables de entorno.
	let configChecked: Promise<void> | undefined;

	return async ({ event, resolve }) => {
		// Seguro: ningún asset pathname es una ruta de la API de better-auth, así que el salto
		// no puede desactivar el login.
		if (options.skipAssets && isAssetPathname(event.url.pathname)) {
			return resolve(event);
		}

		if (!building) {
			configChecked ??= assertSecureAuthConfig(auth);
			await configChecked;
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
};
