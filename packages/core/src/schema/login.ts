import { z, type ZodEmail, type ZodObject } from 'zod/v4';

/** Textos inyectables del schema de login. Los defaults de la librería están en inglés. */
export type LoginSchemaStrings = {
	emailError?: string;
	emailPlaceholder?: string;
	emailDescription?: string;
};

/**
 * Factoría del schema de login: nunca un schema con textos ya compilados en scope de
 * módulo, para que el consumidor resuelva su i18n cuando toque.
 *
 * El campo se tipa como `ZodEmail` (lo que devuelve `z.email()`) y no como `ZodString`:
 * en `zod@3.25/v4` `ZodEmail` no es asignable a `ZodString`, y `z.string().email()` está
 * deprecado en la API v4.
 */
export function createLoginSchema(strings: LoginSchemaStrings = {}): ZodObject<{
	email: ZodEmail;
}> {
	const {
		emailError = 'Enter a valid email address',
		emailPlaceholder = 'you@example.com',
		emailDescription = 'We will email you a link to sign in'
	} = strings;

	return z.object({
		email: z.email(emailError).meta({
			placeholder: emailPlaceholder,
			description: emailDescription
		})
	});
}

/** El schema (lo que esperan los adaptadores de superforms). */
export type LoginSchema = ReturnType<typeof createLoginSchema>;

/** Los datos validados por el schema. */
export type LoginData = z.infer<LoginSchema>;
