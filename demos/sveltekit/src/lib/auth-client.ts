import { createCallepuzzleAuthClient } from '@callepuzzle/auth/client';
import { emailOTPClient, magicLinkClient } from 'better-auth/client/plugins';

/**
 * Cliente de auth del navegador. Se instancia **una sola vez** aquí y se pasa por props a los
 * componentes que lo necesiten (`NavBarEnd`, `FormLoginMagicLink`, `FormLoginOtp`).
 *
 * La librería expone una factoría, no un cliente ya construido, y no impone plugins: los
 * declara la app, y así el tipado del cliente refleja exactamente los endpoints disponibles.
 *
 * Aquí **no** se llama a `authClient.useSession()`: en SSR el módulo se evalúa una vez por
 * proceso y ese store lo compartirían todos los usuarios que atendiera el servidor. La sesión
 * viaja por el `load` del servidor (`+layout.server.ts`) y llega a los componentes como dato
 * plano, una por request.
 */
export const authClient = createCallepuzzleAuthClient({
	plugins: [magicLinkClient(), emailOTPClient()]
});

export type AuthClient = typeof authClient;
