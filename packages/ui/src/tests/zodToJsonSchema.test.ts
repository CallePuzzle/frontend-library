import { describe, expect, test } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

describe('simple zod schema', () => {
	test('string', () => {
		const schema = z.string();
		const jsonSchema = zodToJsonSchema(schema);
		expect(jsonSchema).toEqual({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'string'
		});
	});
	test('object', () => {
		const schema = z.object({
			id: z.string().uuid(),
			name: z.string().min(2).max(100),
			age: z.number().min(0).max(120)
		});
		const jsonSchema = zodToJsonSchema(schema);
		expect(jsonSchema).toEqual({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				id: { type: 'string', format: 'uuid' },
				name: { type: 'string', minLength: 2, maxLength: 100 },
				age: { type: 'number', minimum: 0, maximum: 120 }
			},
			additionalProperties: false,
			required: ['id', 'name', 'age']
		});
	});
	test('empty object', () => {
		const schema = z.object({});
		const jsonSchema = zodToJsonSchema(schema);
		expect(jsonSchema).toEqual({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {},
			additionalProperties: false
			// required: [] if it's empty don't have required field
		});
	});
});
