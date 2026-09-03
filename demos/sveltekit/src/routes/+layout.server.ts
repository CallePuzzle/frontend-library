import type { LayoutServerLoad } from './$types';

/**
 * Patrón de sesión SSR: `betterAuthHandle` resuelve la sesión **una vez por request** y la deja
 * en `event.locals`; el layout la baja al cliente como dato plano.
 *
 * Así ningún componente necesita un store de sesión en scope de módulo (que en SSR compartirían
 * todos los usuarios que atendiese el proceso).
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user };
};
