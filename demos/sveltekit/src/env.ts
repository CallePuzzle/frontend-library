import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Variables de entorno del demo. SvelteKit 3 deprecó `$env/dynamic/*`: se declaran aquí, con
 * tipos, y se leen desde `$app/env/private`. Son **dinámicas** (no `static`): se resuelven en
 * el servidor en tiempo de ejecución y nunca se incrustan en el build.
 *
 * En desarrollo caen a valores locales (ver `src/lib/server/auth.ts` y `src/lib/server/db.ts`);
 * fuera de él, `betterAuthHandle` rechaza la configuración en la primera petición si falta
 * alguna.
 */
export const variables = defineEnvVars({
	BETTER_AUTH_URL: { schema: (value) => value },
	BETTER_AUTH_SECRET: { schema: (value) => value },
	LIBSQL_URL: { schema: (value) => value }
});
