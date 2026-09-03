import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { zodToFieldsJsonSchema } from './index.js';

describe('zodToFieldsJsonSchema', () => {
	it('lee placeholder y description de .meta() y marca lo obligatorio', () => {
		const schema = z.object({
			name: z.string().meta({ placeholder: 'John Doe', description: 'Your name' }),
			nickname: z.string().optional().meta({ placeholder: 'Johnny' })
		});

		expect(zodToFieldsJsonSchema(schema)).toEqual([
			{
				kind: 'string',
				name: 'name',
				required: true,
				placeholder: 'John Doe',
				description: 'Your name'
			},
			{ kind: 'string', name: 'nickname', required: false, placeholder: 'Johnny' }
		]);
	});

	it('no lanza con un schema sin propiedades ni required', () => {
		expect(zodToFieldsJsonSchema(z.object({}))).toEqual([]);
	});

	it('no lanza cuando required está ausente porque todo es opcional', () => {
		expect(zodToFieldsJsonSchema(z.object({ a: z.string().optional() }))).toEqual([
			{ kind: 'string', name: 'a', required: false }
		]);
	});

	it('propaga los formatos email, url y date', () => {
		const schema = z.object({ email: z.email(), site: z.url(), day: z.iso.date() });
		const fields = zodToFieldsJsonSchema(schema);

		expect(fields.map((field) => [field.kind, field.name])).toEqual([
			['string', 'email'],
			['string', 'site'],
			['string', 'day']
		]);
		expect(fields.map((field) => (field.kind === 'string' ? field.format : null))).toEqual([
			'email',
			'uri',
			'date'
		]);
	});

	it('mapea un enum a kind enum con sus opciones', () => {
		const schema = z.object({
			color: z.enum(['red', 'blue']).meta({ placeholder: 'Pick one' })
		});

		expect(zodToFieldsJsonSchema(schema)).toEqual([
			{
				kind: 'enum',
				name: 'color',
				required: true,
				options: ['red', 'blue'],
				placeholder: 'Pick one'
			}
		]);
	});

	it('mapea números y enteros a kind number con min y max', () => {
		const schema = z.object({
			age: z.number().min(18).max(120).meta({ description: 'Your age' }),
			floor: z.int().optional()
		});
		const fields = zodToFieldsJsonSchema(schema);

		expect(fields[0]).toEqual({
			kind: 'number',
			name: 'age',
			required: true,
			description: 'Your age',
			min: 18,
			max: 120
		});
		expect(fields[1]?.kind).toBe('number');
		expect(fields[1]?.required).toBe(false);
	});

	it('mapea un booleano a kind boolean', () => {
		const schema = z.object({ terms: z.boolean().meta({ description: 'Accept the terms' }) });

		expect(zodToFieldsJsonSchema(schema)).toEqual([
			{ kind: 'boolean', name: 'terms', required: true, description: 'Accept the terms' }
		]);
	});

	it('marca como unsupported lo que no sabe renderizar, sin disfrazarlo de texto', () => {
		const schema = z.object({
			tags: z.array(z.string()),
			nested: z.object({ a: z.string() }),
			when: z.date().meta({ description: 'A date object' })
		});

		expect(zodToFieldsJsonSchema(schema)).toEqual([
			{ kind: 'unsupported', name: 'tags', required: true, jsonSchemaType: 'array' },
			{ kind: 'unsupported', name: 'nested', required: true, jsonSchemaType: 'object' },
			{
				kind: 'unsupported',
				name: 'when',
				required: true,
				description: 'A date object'
			}
		]);
	});

	it('un campo con .default() no es obligatorio para el formulario', () => {
		expect(zodToFieldsJsonSchema(z.object({ role: z.string().default('user') }))).toEqual([
			{ kind: 'string', name: 'role', required: false }
		]);
	});
});
