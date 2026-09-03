/**
 * Tipos que los componentes usan para hablar con el cliente de auth y con la sesión.
 *
 * Están tipados de forma **estructural** a propósito: `@callepuzzle/svelte-ui` no importa
 * `@callepuzzle/auth` (ni para tipos), así que un consumidor puede usar los componentes con su
 * propio cliente de better-auth —con los plugins que sea— sin que la librería le imponga nada.
 */

/** Usuario de la sesión, como dato plano. Llega por el `load` del servidor, no por un store. */
export type SessionUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

/** Error tal y como lo devuelven las llamadas del cliente de better-auth. */
export type AuthCallError = {
	status?: number;
	statusText?: string;
	message?: string;
	code?: string;
};

/** Resultado de una llamada del cliente de better-auth. */
export type AuthCallResult<T = unknown> = {
	data?: T | null;
	error?: AuthCallError | null;
};

/** Lo mínimo que necesita `ButtonSignOut` / `NavBarEnd` para cerrar sesión. */
export type SignOutClient = {
	signOut: (...args: never[]) => Promise<unknown>;
};

/** Lo mínimo que necesita `FormLoginMagicLink`. */
export type MagicLinkClient = {
	signIn: {
		magicLink: (body: {
			email: string;
			callbackURL?: string;
		}) => Promise<AuthCallResult<{ status?: boolean }>>;
	};
};

/** Lo mínimo que necesita `FormLoginOtp` (`@callepuzzle/svelte-ui/otp`). */
export type EmailOtpClient = {
	emailOtp: {
		sendVerificationOtp: (body: {
			email: string;
			type: 'sign-in';
		}) => Promise<AuthCallResult<{ success?: boolean }>>;
	};
	signIn: {
		emailOtp: (body: { email: string; otp: string }) => Promise<AuthCallResult<unknown>>;
	};
};
