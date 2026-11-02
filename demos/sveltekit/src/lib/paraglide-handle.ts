import type { Handle } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

/**
 * Handle de paraglide: determina el locale del request (cookie o `baseLocale`) y lo deja en el
 * contexto de servidor (AsyncLocalStorage), de donde lo lee `getLocale()` durante el SSR.
 *
 * En SvelteKit 3 `event.request` es de solo lectura, así que ya no se puede sustituir la
 * request del evento, como hacía el ejemplo antiguo de paraglide. Este demo usa la estrategia
 * `cookie` —no de URL—, así que la request no cambia: basta con resolver el evento dentro del
 * middleware, que ya ha fijado el locale en su contexto. La reescritura de URLs si se usara la
 * estrategia de URL es cosa del hook `reroute` (ver `src/hooks.ts`).
 */
export const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale }) =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', locale)
		})
	);
