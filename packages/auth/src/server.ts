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
 *
 * export const auth = getBetterAuth({
 * 	database: prismaAdapter(prisma, { provider: 'postgresql' }),
 * 	plugins: [sveltekitCookies(getRequestEvent), emailOtpPreset(sendOtpEmail)]
 * });
 * ```
 */
export function getBetterAuth(options: BetterAuthOptions): ReturnType<typeof betterAuth> {
	return betterAuth({
		...options,
		// El consumidor decide los plugins; la librería no añade ni quita ninguno.
		plugins: [...(options.plugins ?? [])]
	});
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
