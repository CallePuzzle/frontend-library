import { describe, expect, it } from 'vitest';
import { createLoginSchema } from './login.js';
import { zodToFieldsJsonSchema } from './index.js';

describe('createLoginSchema', () => {
	it('valida el email', () => {
		const schema = createLoginSchema();

		expect(schema.safeParse({ email: 'jesus-asereje@kyp.es' }).success).toBe(true);
		expect(schema.safeParse({ email: 'nope' }).success).toBe(false);
		expect(schema.safeParse({}).success).toBe(false);
	});

	it('usa los textos inyectados en el error y en el campo', () => {
		const schema = createLoginSchema({
			emailError: 'Correo no válido',
			emailPlaceholder: 'tu@correo.es',
			emailDescription: 'Te enviaremos un enlace'
		});
		const result = schema.safeParse({ email: 'nope' });

		expect(result.error?.issues[0]?.message).toBe('Correo no válido');
		expect(zodToFieldsJsonSchema(schema)).toEqual([
			{
				kind: 'string',
				name: 'email',
				required: true,
				format: 'email',
				placeholder: 'tu@correo.es',
				description: 'Te enviaremos un enlace'
			}
		]);
	});

	it('trae defaults en inglés cuando no se inyecta nada', () => {
		const [field] = zodToFieldsJsonSchema(createLoginSchema());

		expect(field).toEqual({
			kind: 'string',
			name: 'email',
			required: true,
			format: 'email',
			placeholder: 'you@example.com',
			description: 'We will email you a link to sign in'
		});
		expect(createLoginSchema().safeParse({ email: 'nope' }).error?.issues[0]?.message).toBe(
			'Enter a valid email address'
		);
	});
});
