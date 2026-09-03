import { dev } from '$app/environment';
import {
	emailOtpPreset,
	getBetterAuth,
	magicLinkPreset,
	type SendMagicLink,
	type SendVerificationOtp
} from '@callepuzzle/auth/server';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import db from './db';

/**
 * Envío del magic link **solo para desarrollo**: escribe el enlace por la consola del servidor.
 *
 * No es un mailer y no pretende parecerlo. `@callepuzzle/auth` exige la función de envío como
 * argumento obligatorio precisamente para que nadie herede un envío falso sin darse cuenta, así
 * que este demo declara el suyo, lo llama `dev*` y **lanza fuera de desarrollo**: es imposible
 * desplegar esta app creyendo que manda correos.
 *
 * Un consumidor sustituye el cuerpo de esta función por su mailer (nodemailer, Resend, SES…).
 * La librería no trae ninguno: el transporte de correo es una decisión de la app.
 */
const devSendMagicLink: SendMagicLink = async ({ email, url }) => {
	if (!dev) {
		throw new Error(
			'El demo no tiene mailer: configura un envío real antes de usar el magic link fuera ' +
				'de desarrollo (ver src/lib/server/auth.ts).'
		);
	}

	console.info('[demo · SOLO DESARROLLO] magic link para %s -> %s', email, url);
};

/** Igual que `devSendMagicLink`, para el flujo de OTP por correo. Solo para desarrollo. */
const devSendVerificationOtp: SendVerificationOtp = async ({ email, otp, type }) => {
	if (!dev) {
		throw new Error(
			'El demo no tiene mailer: configura un envío real antes de usar el OTP fuera de ' +
				'desarrollo (ver src/lib/server/auth.ts).'
		);
	}

	console.info('[demo · SOLO DESARROLLO] OTP (%s) para %s -> %s', type, email, otp);
};

/**
 * Instancia de better-auth del servidor.
 *
 * `getBetterAuth` ya no impone plugins: los declara la app. Aquí se montan los dos flujos que
 * demuestra el demo (magic link y OTP por correo) con sus presets.
 *
 * No se monta `sveltekitCookies(getRequestEvent)`: este demo hace todo el login desde el
 * cliente, y ahí las cookies las escribe la propia respuesta de `/api/auth/*` que devuelve
 * `betterAuthHandle`. Ese plugin solo hace falta si se llama a `auth.api.*` desde el servidor
 * (una `action`, por ejemplo). Ojo si se añade: hoy `sveltekitCookies` no acepta el
 * `getRequestEvent` de `$app/server` sin un cast (su `RequestEvent<Partial<Record<string,
 * string>>, string | null>` no encaja con el `RequestEvent<LayoutParams<'/'>, any>` que
 * devuelve SvelteKit).
 */
export const auth = getBetterAuth({
	database: prismaAdapter(db, { provider: 'sqlite' }),
	// El rate limit de better-auth solo se activa en producción por defecto; los endpoints que
	// mandan credenciales por correo conviene limitarlos siempre.
	rateLimit: {
		customRules: {
			'/sign-in/magic-link': { window: 60, max: 3 },
			'/email-otp/send-verification-otp': { window: 60, max: 3 },
			'/sign-in/email-otp': { window: 60, max: 3 }
		}
	},
	plugins: [magicLinkPreset(devSendMagicLink), emailOtpPreset(devSendVerificationOtp)]
});
