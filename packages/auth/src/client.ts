import { createAuthClient } from 'better-auth/svelte';
import type { ClientOptions } from 'better-auth/client';

/**
 * Tipo real que devuelve `createAuthClient` de better-auth para unas opciones dadas.
 * Se mantiene como alias interno para no repetir la expresión de instanciación.
 */
type AuthClientOf<O extends ClientOptions> = ReturnType<typeof createAuthClient<O>>;

/**
 * Crea un cliente de better-auth para el navegador.
 *
 * Es una **factoría**: no hay estado de sesión en scope de módulo. Cada llamada devuelve un
 * cliente independiente, con sus propios stores. La librería no impone ningún plugin: los pasa
 * el consumidor, y así el tipado del cliente (endpoints, acciones, `$Infer.Session`) refleja
 * exactamente los plugins que ha instalado.
 *
 * El consumidor debe instanciarlo **una sola vez** en su propio módulo (por ejemplo
 * `src/lib/auth-client.ts`) y pasarlo a los componentes por props:
 *
 * ```ts
 * // src/lib/auth-client.ts
 * import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
 * import { emailOTPClient, adminClient } from 'better-auth/client/plugins';
 *
 * export const authClient = createCallepuzzleAuthClient({
 * 	plugins: [emailOTPClient(), adminClient()]
 * });
 *
 * export type AuthClient = typeof authClient;
 * ```
 *
 * Nunca ejecutes `useSession()` en scope de módulo: en SSR el módulo se evalúa una vez por
 * proceso y el store sería compartido por todos los usuarios que atienda el servidor. La sesión
 * viaja por el `load` del servidor (una por request) y llega a los componentes como dato plano.
 */
export function createCallepuzzleAuthClient<O extends ClientOptions>(options?: O): AuthClientOf<O> {
	return createAuthClient(options);
}

/**
 * Cliente de auth de CallePuzzle. Sin parámetro devuelve el cliente base (sin plugins); con el
 * parámetro `O` devuelve el cliente tipado para esas opciones.
 *
 * Para el tipo del cliente que has creado tú, usa `typeof authClient` en tu propio módulo: es
 * más preciso que este alias porque conserva la inferencia de tus plugins.
 */
export type CallepuzzleAuthClient<O extends ClientOptions = ClientOptions> = AuthClientOf<O>;

/**
 * Alias histórico de `CallepuzzleAuthClient`, mantenido por compatibilidad con los consumidores
 * que ya importaban `AuthClient` de la librería. Ahora es el tipo real de better-auth, no `any`.
 */
export type AuthClient<O extends ClientOptions = ClientOptions> = AuthClientOf<O>;

/**
 * Sesión inferida por better-auth: `{ session, user }`. Sin parámetro es la del cliente base;
 * con el parámetro `O` incluye los campos que añadan tus plugins.
 */
export type Session<O extends ClientOptions = ClientOptions> = AuthClientOf<O>['$Infer']['Session'];

/** Sesión inferida a partir de un cliente concreto: `SessionOf<typeof authClient>`. */
export type SessionOf<C extends { $Infer: { Session: unknown } }> = C['$Infer']['Session'];
