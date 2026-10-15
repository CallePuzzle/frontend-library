import { building, dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import {
	emailOtpPreset,
	emailOtpRateLimitRules,
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

// Valores de desarrollo: solo se usan con `dev`, nunca en un build. El puerto es el de `vite dev`.
const DEV_URL = 'http://localhost:5173';
const DEV_SECRET = 'demo-dev-secret-not-for-production-use';

/**
 * Lee una variable obligatoria. En desarrollo cae a un valor local; fuera de él, sin la variable
 * no hay valor y `betterAuthHandle` rechaza la configuración en la primera petición.
 *
 * Durante el build no se lee el entorno (SvelteKit no lo permite en el prerender) y tampoco hace
 * falta: no hay peticiones.
 */
function requiredEnv(name: 'BETTER_AUTH_URL' | 'BETTER_AUTH_SECRET', devValue: string) {
	if (building) return undefined;
	return env[name] || (dev ? devValue : undefined);
}

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
	// Sin estos dos, `betterAuthHandle` no atiende ninguna petición: sin `baseURL`, better-auth
	// deduce la URL de los magic links de las cabeceras X-Forwarded-* de la petición.
	secret: requiredEnv('BETTER_AUTH_SECRET', DEV_SECRET),
	baseURL: requiredEnv('BETTER_AUTH_URL', DEV_URL),
	database: prismaAdapter(db, { provider: 'sqlite' }),
	// Reglas para los endpoints que mandan credenciales por correo. Ojo: better-auth solo aplica
	// el rate limit en producción, y estas reglas no lo encienden en desarrollo. En un despliegue
	// real, además, hay que fijar `advanced.ipAddress.ipAddressHeaders` a la cabecera del proxy
	// y un `storage` compartido (ver `emailOtpRateLimitRules` en `@callepuzzle/auth/server`).
	rateLimit: {
		customRules: {
			'/sign-in/magic-link': { window: 60, max: 3 },
			...emailOtpRateLimitRules()
		}
	},
	plugins: [magicLinkPreset(devSendMagicLink), emailOtpPreset(devSendVerificationOtp)]
});
