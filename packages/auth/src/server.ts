import { betterAuth } from 'better-auth';
import { emailOTP, magicLink } from 'better-auth/plugins';
import type { BetterAuthOptions } from 'better-auth';

/** Opciones del plugin `magicLink` de better-auth. */
type MagicLinkPluginOptions = Parameters<typeof magicLink>[0];

/** Opciones del plugin `emailOTP` de better-auth. */
type EmailOtpPluginOptions = Parameters<typeof emailOTP>[0];

/** Función de envío del magic link. Es el `sendMagicLink` real del plugin de better-auth. */
export type SendMagicLink = MagicLinkPluginOptions['sendMagicLink'];

/** Resto de opciones del magic link (`expiresIn`, `rateLimit`, `storeToken`, …). */
export type MagicLinkPresetOptions = Omit<MagicLinkPluginOptions, 'sendMagicLink'>;

/** Función de envío del OTP. Es el `sendVerificationOTP` real del plugin de better-auth. */
export type SendVerificationOtp = EmailOtpPluginOptions['sendVerificationOTP'];

/** Resto de opciones del OTP por email (`otpLength`, `expiresIn`, `allowedAttempts`, …). */
export type EmailOtpPresetOptions = Omit<EmailOtpPluginOptions, 'sendVerificationOTP'>;

/** Una regla de rate limit de better-auth: ventana en segundos y máximo de peticiones. */
export type RateLimitRule = {
	window: number;
	max: number;
};

/** Las `customRules` del `rateLimit` de better-auth, tal y como las tipa better-auth. */
export type RateLimitCustomRules = NonNullable<
	NonNullable<BetterAuthOptions['rateLimit']>['customRules']
>;

/**
 * Reglas de rate limit para los dos endpoints que el flujo de OTP por email deja expuestos:
 * pedir el código (`/email-otp/send-verification-otp`) y canjearlo (`/sign-in/email-otp`).
 *
 * Son las rutas por donde alguien puede inundar un buzón o intentar adivinar el código, y estas
 * son las reglas que traen puestas el demo y el consumidor principal (3 peticiones por minuto
 * por IP). Pásalas siempre, o fija las tuyas:
 *
 * ```ts
 * export const auth = getBetterAuth({
 * 	// …
 * 	rateLimit: { customRules: emailOtpRateLimitRules(), storage: 'database' },
 * 	advanced: { ipAddress: { ipAddressHeaders: ['x-real-ip'] } }
 * });
 * ```
 *
 * Las reglas solas no bastan. Revisa estas tres cosas:
 *
 * - **Solo se aplican en producción.** better-auth activa el rate limit con
 *   `NODE_ENV=production`; las `customRules` no lo encienden en desarrollo
 *   (para eso, `rateLimit.enabled: true`).
 * - **La IP sale de una cabecera.** Por defecto better-auth lee `x-forwarded-for`, que el cliente
 *   puede inventarse si ningún proxy la reescribe: cambiándola en cada petición, el límite no
 *   frena nada. Fija `advanced.ipAddress.ipAddressHeaders` a la cabecera que pone **tu** proxy
 *   (`x-real-ip`, `cf-connecting-ip`, `fly-client-ip`…).
 * - **El almacén por defecto es la memoria del proceso.** Con varias instancias o en serverless
 *   cada una cuenta por su lado. Usa `rateLimit.storage: 'database'` (necesita la tabla
 *   `rateLimit` en el esquema) o `secondaryStorage`.
 *
 * Adivinar el código además está acotado por el `allowedAttempts` del plugin (3 por defecto):
 * tras ese número de fallos el OTP se invalida.
 */
export function emailOtpRateLimitRules({
	window = 60,
	max = 3
}: Partial<RateLimitRule> = {}): RateLimitCustomRules {
	return {
		'/email-otp/send-verification-otp': { window, max },
		'/sign-in/email-otp': { window, max }
	};
}

/**
 * Crea la instancia de better-auth del servidor.
 *
 * La librería **no impone ningún plugin**: el merge es explícito y solo propaga los que pasa el
 * consumidor. Sin plugins por defecto no hay forma de heredar un envío de credenciales falso ni
 * tablas de esquema (organización, invitaciones…) que nadie ha pedido.
 *
 * ```ts
 * // src/lib/server/auth.ts
 * import { getBetterAuth, emailOtpPreset } from '@callepuzzle/auth/server';
 * import { prismaAdapter } from 'better-auth/adapters/prisma';
 * import { sveltekitCookies } from 'better-auth/svelte-kit';
 * import { getRequestEvent } from '$app/server';
 * import { env } from '$env/dynamic/private';
 *
 * export const auth = getBetterAuth({
 * 	secret: env.BETTER_AUTH_SECRET,
 * 	baseURL: env.BETTER_AUTH_URL,
 * 	database: prismaAdapter(prisma, { provider: 'postgresql' }),
 * 	plugins: [sveltekitCookies(getRequestEvent), emailOtpPreset(sendOtpEmail)]
 * });
 * ```
 *
 * `secret` y `baseURL` (o sus variables `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`) son
 * obligatorios: `betterAuthHandle` se niega a atender peticiones sin ellos. Sin `baseURL`,
 * better-auth deduce la URL pública de las cabeceras `X-Forwarded-*` de la petición, y quien las
 * controle decide a qué dominio apuntan los magic links.
 */
export function getBetterAuth<T extends BetterAuthOptions>(
	options: T
): ReturnType<typeof betterAuth<T>> {
	// Genérica y pasando `options` tal cual: `T` llega a `betterAuth` con los plugins
	// literales del consumidor, así que los endpoints que añaden existen en el TIPO
	// de `auth.api` y no solo en runtime. La anotación anterior
	// (`ReturnType<typeof betterAuth>`) borraba esa inferencia (issue #19). El
	// consumidor decide los plugins; la librería no añade ni quita ninguno.
	//
	// La anotación de retorno es necesaria: sin ella, tsc no puede nombrar el tipo
	// inferido para el `.d.ts` (TS2742/TS7056: referencias a internos de
	// better-auth). `ReturnType<typeof betterAuth<T>>` sí es portable y conserva la
	// genericidad, de modo que cada app la instancia con sus plugins concretos.
	return betterAuth(options);
}

/**
 * Preset del plugin `magicLink` con la función de envío como **argumento obligatorio**.
 *
 * Hacer `send` obligatorio es intencionado: es imposible desplegar un magic link que solo haga
 * `console.log` del token. Si no hay forma de enviar el email, no hay plugin.
 */
export function magicLinkPreset(
	send: SendMagicLink,
	options?: MagicLinkPresetOptions
): ReturnType<typeof magicLink> {
	return magicLink({ ...options, sendMagicLink: send });
}

/**
 * Preset del plugin `emailOTP` con la función de envío como **argumento obligatorio**.
 *
 * Es el flujo que usa el consumidor principal (`donde-esta-tu-local`). Igual que el magic link:
 * sin función de envío no compila, así que no hay manera de filtrar el OTP por los logs.
 */
export function emailOtpPreset(
	send: SendVerificationOtp,
	options?: EmailOtpPresetOptions
): ReturnType<typeof emailOTP> {
	return emailOTP({ ...options, sendVerificationOTP: send });
}
