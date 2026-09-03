import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormLoginMagicLink`. */
export type FormLoginMagicLinkStrings = {
	/** Aviso bajo un campo obligatorio (se reenvía a `FormFields`). */
	required: string;
	/** Aviso bajo un campo opcional (se reenvía a `FormFields`). */
	optional: string;
	/** Botón de envío. */
	signIn: string;
	/** Confirmación: el enlace ya está en el correo. */
	magicLinkSent: string;
	/** Demasiadas peticiones (HTTP 429). */
	rateLimited: string;
	/** Cualquier otro fallo. Nunca se muestra el código HTTP crudo al usuario. */
	error: string;
};

export const defaultFormLoginMagicLinkStrings: FormLoginMagicLinkStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional,
	signIn: commonStrings.signIn,
	magicLinkSent: 'Check your inbox: we just sent you a link to sign in.',
	rateLimited: 'Too many attempts. Please try again in a few minutes.',
	error: 'Something went wrong. Please try again.'
};
