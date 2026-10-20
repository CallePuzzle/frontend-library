import { describe, expect, it, vi } from 'vitest';
import { emailOTP } from 'better-auth/plugins';
import type { BetterAuthPlugin } from 'better-auth';
import {
	emailOtpPreset,
	emailOtpRateLimitRules,
	getBetterAuth,
	magicLinkPreset
} from './server.js';

const marker = { id: 'marker-plugin' } satisfies BetterAuthPlugin;

describe('getBetterAuth', () => {
	it('conserva los plugins que pasa el consumidor', () => {
		const auth = getBetterAuth({ baseURL: 'http://localhost', plugins: [marker] });

		expect(auth.options.plugins).toContain(marker);
	});

	it('no inyecta ningún plugin propio', () => {
		// Desde #19 `options` viaja tal cual a `betterAuth` (para conservar la
		// inferencia), así que la garantía de esta factoría es que no AÑADE ninguno:
		// lo que el consumidor pasa se queda solo.
		const auth = getBetterAuth({ baseURL: 'http://localhost', plugins: [] });

		expect(auth.options.plugins).toEqual([]);
	});

	it('no pisa los plugins del consumidor con defaults de la librería', () => {
		// Regresión de H5.3: el merge superficial anterior borraba silenciosamente lo que pasaba
		// el consumidor (o al revés, según el orden del spread).
		const other = { id: 'other-plugin' } satisfies BetterAuthPlugin;
		const auth = getBetterAuth({ baseURL: 'http://localhost', plugins: [marker, other] });

		expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
			'marker-plugin',
			'other-plugin'
		]);
	});

	it('conserva la inferencia de plugins: sus endpoints existen en el tipo de auth.api (#19)', () => {
		const send = vi.fn(async () => {});
		const auth = getBetterAuth({
			baseURL: 'http://localhost',
			plugins: [emailOTP({ sendVerificationOTP: send })]
		});

		// Aserción de tipos, no de runtime: la asignación de abajo solo compila si el
		// endpoint que añade el plugin (`sendVerificationOTP`) está en el tipo de
		// `auth.api`. Con la anotación `ReturnType<typeof betterAuth>` anterior, la
		// inferencia se borraba y aquí `tsc --noEmit` fallaba aunque en runtime el
		// endpoint existiera.
		const apiSendVerificationOtp = auth.api.sendVerificationOTP;
		expect(apiSendVerificationOtp).toBeTypeOf('function');
	});

	it('propaga el resto de opciones sin tocarlas', () => {
		const auth = getBetterAuth({ baseURL: 'http://localhost', appName: 'demo' });

		expect(auth.options.appName).toBe('demo');
	});
});

describe('presets', () => {
	it('magicLinkPreset devuelve el plugin de magic link', () => {
		const send = vi.fn(async () => {});

		expect(magicLinkPreset(send).id).toBe('magic-link');
		expect(magicLinkPreset(send, { expiresIn: 60 }).id).toBe('magic-link');
	});

	it('emailOtpPreset devuelve el plugin de OTP por email', () => {
		const send = vi.fn(async () => {});

		expect(emailOtpPreset(send).id).toBe('email-otp');
		expect(emailOtpPreset(send, { otpLength: 8 }).id).toBe('email-otp');
	});

	it('exigen la función de envío en tiempo de compilación', () => {
		// La garantía es de tipos, no de runtime: `send` es un argumento obligatorio, así que es
		// imposible instalar un preset sin forma de enviar la credencial (el `console.log` del
		// token de H5.4 ya no se puede desplegar). `tsc --noEmit` (script `check-types`) falla si
		// alguno de estos errores esperados dejase de producirse.

		// @ts-expect-error falta la función de envío del magic link.
		expect(() => magicLinkPreset()).toBeTypeOf('function');

		// @ts-expect-error falta la función de envío del OTP.
		expect(() => emailOtpPreset()).toBeTypeOf('function');
	});
});

describe('emailOtpRateLimitRules', () => {
	it('cubre pedir y canjear el OTP, con 3 por minuto por defecto', () => {
		const rules = emailOtpRateLimitRules();

		expect(rules['/email-otp/send-verification-otp']).toEqual({ window: 60, max: 3 });
		expect(rules['/sign-in/email-otp']).toEqual({ window: 60, max: 3 });
		expect(Object.keys(rules)).toHaveLength(2);
	});

	it('acepta ventana y máximo propios', () => {
		const rules = emailOtpRateLimitRules({ window: 120, max: 5 });

		expect(rules['/email-otp/send-verification-otp']).toEqual({ window: 120, max: 5 });
		expect(rules['/sign-in/email-otp']).toEqual({ window: 120, max: 5 });
	});

	it('encajan en rateLimit.customRules de getBetterAuth', () => {
		const auth = getBetterAuth({
			baseURL: 'http://localhost',
			rateLimit: { customRules: emailOtpRateLimitRules() }
		});

		expect(auth.options.rateLimit?.customRules?.['/sign-in/email-otp']).toEqual({
			window: 60,
			max: 3
		});
	});
});
