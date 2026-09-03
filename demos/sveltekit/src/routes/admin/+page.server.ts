import type { PageServerLoad } from './$types';

/**
 * Patrón de contenido protegido.
 *
 * El modelo de rutas ya no tiene `isProtected`: una etiqueta en un mapa de menú no protege
 * nada, porque el menú se pinta en el cliente. La protección de verdad está aquí, en el
 * servidor: sin `locals.user` no se calcula ni se devuelve el dato protegido, así que no viaja
 * al navegador de nadie.
 *
 * Este demo prefiere degradar (la página enseña un `UserNotLogged` con el login a mano) en vez
 * de cortar. Para un corte duro, lo que va aquí es `error(403)` o `redirect(303, '/')`.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { secret: null };

	return {
		secret: {
			name: user.name,
			// La sesión también sale de `locals`, no de un store compartido por el proceso.
			expiresAt: locals.session?.expiresAt ?? null
		}
	};
};
