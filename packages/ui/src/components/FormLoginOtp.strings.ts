import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormLoginOtp` (`@callepuzzle/svelte-ui/otp`). */
export type FormLoginOtpStrings = {
	/** Aviso bajo un campo obligatorio (se reenvía a `FormFields`). */
	required: string;
	/** Aviso bajo un campo opcional (se reenvía a `FormFields`). */
	optional: string;
	/** Botón que pide el código. */
	signIn: string;
	/** Primer paso: pedir el correo. */
	stepEmail: string;
	/** Segundo paso: teclear el código. */
	stepOtp: string;
	/** Etiqueta accesible del grupo de casillas. */
	otpLabel: string;
	/**
	 * Explicación bajo las casillas. Recibe el número de dígitos (la prop `length`), para que
	 * el copy no diga «6 dígitos» con un servidor configurado a otro largo.
	 */
	otpDescription: (digits: number) => string;
	/** Sesión iniciada. */
	success: string;
	/** Demasiadas peticiones (HTTP 429). */
	rateLimited: string;
	/** Código incorrecto o caducado. */
	invalidCode: string;
	/** Cualquier otro fallo. Nunca se muestra el código HTTP crudo al usuario. */
	error: string;
	/** Enlace para volver a empezar (solo si se pasa `startOverHref`). */
	startOver: string;
};

export const defaultFormLoginOtpStrings: FormLoginOtpStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional,
	signIn: commonStrings.signIn,
	stepEmail: 'Email',
	stepOtp: 'Code',
	otpLabel: 'One-time code',
	otpDescription: (digits) => `Enter the ${digits}-digit code we sent to your email.`,
	success: 'You are signed in.',
	rateLimited: 'Too many attempts. Please try again in a few minutes.',
	invalidCode: 'That code is not valid. Please check it and try again.',
	error: 'Something went wrong. Please try again.',
	startOver: 'Start over'
};
