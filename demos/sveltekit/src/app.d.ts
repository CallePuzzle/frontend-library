// Augmentación de los tipos de la app. Ver https://svelte.dev/docs/kit/types#app.d.ts
//
// `@callepuzzle/auth` **no** declara `App.Locals` por ti (una librería no debe tocar el
// espacio global del consumidor): lo hace la app, con los tipos reales de su propia
// instancia de better-auth. Ver el JSDoc de `BetterAuthLocals` en `@callepuzzle/auth/hooks`.
import type { auth } from '$lib/server/auth';

/** `{ session, user }` inferido por better-auth con los plugins que monta este demo. */
type Session = typeof auth.$Infer.Session;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** La escribe `betterAuthHandle`, una vez por request. */
			session?: Session['session'];
			/** La escribe `betterAuthHandle`, una vez por request. */
			user?: Session['user'];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
