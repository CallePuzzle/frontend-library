import { z, type ZodObject } from 'zod/v4';

export {
	createLoginSchema,
	type LoginData,
	type LoginSchema,
	type LoginSchemaStrings
} from './login.js';

/**
 * Descripción de un campo de formulario derivada de un schema de zod, discriminada por `kind`.
 *
 * Lo que no se sabe representar llega como `kind: 'unsupported'` en vez de disfrazarse de
 * campo de texto: el consumidor decide si lo omite o avisa en desarrollo.
 */
export type Field =
	| {
			kind: 'string';
			name: string;
			required: boolean;
			format?: string;
			placeholder?: string;
			description?: string;
	  }
	| {
			kind: 'number';
			name: string;
			required: boolean;
			placeholder?: string;
			description?: string;
			min?: number;
			max?: number;
	  }
	| { kind: 'boolean'; name: string; required: boolean; description?: string }
	| {
			kind: 'enum';
			name: string;
			required: boolean;
			options: string[];
			placeholder?: string;
			description?: string;
	  }
	| {
			kind: 'unsupported';
			name: string;
			required: boolean;
			jsonSchemaType?: string;
			description?: string;
	  };

export type Fields = Field[];

/** ¿Es un objeto plano indexable por clave? (los arrays y `null` no cuentan). */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}

function readNumber(source: Record<string, unknown>, key: string): number | undefined {
	const value = source[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Devuelve el array solo si es un array de strings; si no, `undefined`. */
function readStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;

	const items: string[] = [];
	for (const item of value) {
		if (typeof item !== 'string') return undefined;
		items.push(item);
	}

	return items;
}

/** `required` puede faltar por completo (schema sin campos obligatorios): no puede lanzar. */
function readRequiredNames(value: unknown): Set<string> {
	const names = new Set<string>();
	if (!Array.isArray(value)) return names;

	for (const item of value) {
		if (typeof item === 'string') names.add(item);
	}

	return names;
}

function toField(name: string, required: boolean, property: unknown): Field {
	if (!isRecord(property)) {
		return { kind: 'unsupported', name, required };
	}

	const placeholder = readString(property, 'placeholder');
	const description = readString(property, 'description');
	const type = readString(property, 'type');

	// El enum manda sobre el `type`: un `z.enum([...])` emite `type: 'string'` + `enum`.
	if ('enum' in property) {
		const options = readStringArray(property.enum);
		return options
			? { kind: 'enum', name, required, options, placeholder, description }
			: { kind: 'unsupported', name, required, jsonSchemaType: type, description };
	}

	switch (type) {
		case 'string':
			return {
				kind: 'string',
				name,
				required,
				format: readString(property, 'format'),
				placeholder,
				description
			};
		case 'number':
		case 'integer':
			return {
				kind: 'number',
				name,
				required,
				placeholder,
				description,
				min: readNumber(property, 'minimum'),
				max: readNumber(property, 'maximum')
			};
		case 'boolean':
			return { kind: 'boolean', name, required, description };
		default:
			return { kind: 'unsupported', name, required, jsonSchemaType: type, description };
	}
}

/**
 * Convierte un `z.object({ ... })` en la lista de campos que renderiza un formulario.
 *
 * `placeholder` y `description` se leen de `.meta({ placeholder, description })`.
 *
 * Se genera el JSON Schema con `io: 'input'` (lo que el usuario teclea: un campo con
 * `.default()` no es obligatorio) y `unrepresentable: 'any'` (un tipo que zod no sabe
 * volcar a JSON Schema acaba como `unsupported` en vez de lanzar).
 */
export function zodToFieldsJsonSchema(schema: ZodObject): Fields {
	const jsonSchema: unknown = z.toJSONSchema(schema, {
		io: 'input',
		unrepresentable: 'any'
	});

	if (!isRecord(jsonSchema)) return [];

	const properties = jsonSchema.properties;
	if (!isRecord(properties)) return [];

	const required = readRequiredNames(jsonSchema.required);

	return Object.entries(properties).map(([name, property]) =>
		toField(name, required.has(name), property)
	);
}
