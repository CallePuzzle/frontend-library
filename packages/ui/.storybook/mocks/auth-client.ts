/**
 * Clientes de auth **falsos** para las stories y los tests de componente.
 *
 * La regla del plan 10 es que ningún componente necesite backend para renderizar. Los
 * componentes de login reciben el cliente por prop y lo tipan estructuralmente
 * (`MagicLinkClient`, `EmailOtpClient`, `SignOutClient` en `src/types.ts`), así que basta
 * con implementar esa forma para poder demostrar los tres desenlaces interesantes: éxito,
 * error genérico y 429 (demasiados intentos).
 */
import type {
	AuthCallResult,
	EmailOtpClient,
	MagicLinkClient,
	SignOutClient
} from '../../src/types.js';

/** Desenlace que simula el cliente falso. */
export type FakeAuthOutcome = 'success' | 'error' | 'rateLimited';

/** Opciones comunes a los clientes falsos. */
export type FakeAuthOptions = {
	outcome?: FakeAuthOutcome;
	/** Retardo en ms, para poder ver el estado de carga. `0` en los tests. */
	delay?: number;
};

function wait(ms: number): Promise<void> {
	return ms > 0 ? new Promise((done) => setTimeout(done, ms)) : Promise.resolve();
}

async function respond<T>(
	outcome: FakeAuthOutcome,
	delay: number,
	data: T
): Promise<AuthCallResult<T>> {
	await wait(delay);

	if (outcome === 'rateLimited') {
		return { error: { status: 429, statusText: 'Too Many Requests' } };
	}
	if (outcome === 'error') {
		return { error: { status: 500, statusText: 'Internal Server Error' } };
	}
	return { data };
}

/** Cliente falso para `FormLoginMagicLink`. */
export function createFakeMagicLinkClient({
	outcome = 'success',
	delay = 0
}: FakeAuthOptions = {}): MagicLinkClient {
	return {
		signIn: {
			magicLink: () => respond(outcome, delay, { status: true })
		}
	};
}

/** Opciones del cliente falso de OTP. */
export type FakeEmailOtpOptions = FakeAuthOptions & {
	/** Desenlace del segundo paso (verificar el código). Por defecto, el mismo que el primero. */
	verifyOutcome?: FakeAuthOutcome;
	/** Código que se considera válido. Cualquier otro devuelve error. */
	validOtp?: string;
};

/** Cliente falso para `FormLoginOtp` (`@callepuzzle/svelte-ui/otp`). */
export function createFakeEmailOtpClient({
	outcome = 'success',
	verifyOutcome,
	validOtp = '123456',
	delay = 0
}: FakeEmailOtpOptions = {}): EmailOtpClient {
	const secondStep = verifyOutcome ?? outcome;

	return {
		emailOtp: {
			sendVerificationOtp: () => respond(outcome, delay, { success: true })
		},
		signIn: {
			emailOtp: ({ otp }) =>
				respond(otp === validOtp ? secondStep : 'error', delay, { session: 'fake' })
		}
	};
}

/** Cliente falso para `ButtonSignOut` y para el menú de usuario de `NavBarEnd`. */
export function createFakeSignOutClient({ delay = 0 }: FakeAuthOptions = {}): SignOutClient {
	return {
		signOut: async () => {
			await wait(delay);
			return { data: { success: true } };
		}
	};
}
