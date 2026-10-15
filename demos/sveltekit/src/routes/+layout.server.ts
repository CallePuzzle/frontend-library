import type { LayoutServerLoad } from './$types';

/**
 * Patrón de sesión SSR: `betterAuthHandle` resuelve la sesión **una vez por request** y la deja
 * en `event.locals`; el layout la baja al cliente como dato plano.
 *
 * Así ningún componente necesita un store de sesión en scope de módulo (que en SSR compartirían
 * todos los usuarios que atendiese el proceso).
 *
 * Solo viajan los campos que pinta la UI (`SessionUser`), no el usuario entero: lo que devuelve
 * un `load` acaba serializado en el HTML, y con plugins como `admin` el usuario de better-auth
 * trae `role`, `banned`, `banReason`… que el navegador no necesita.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	return {
		user: user ? { id: user.id, name: user.name, email: user.email, image: user.image } : null
	};
};
