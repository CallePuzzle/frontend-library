# @callepuzzle/core

Tipos y utilidades sin UI de la librería de front de CallePuzzle: el modelo de navegación y la
derivación de campos de formulario desde un schema de zod.

**Cero dependencias de runtime.** Sus dos peers son opcionales: `svelte` solo aporta el tipo
`Component` (para los iconos de una ruta) y `zod` solo lo necesita el subpath `./schema`.

```sh
bun add @callepuzzle/core
```

Requiere un `.npmrc` con el registro de GitHub Packages: ver
[`docs/instalacion.md`](../../docs/instalacion.md#1-acceso-a-github-packages).

## `@callepuzzle/core`

```ts
export type RouteConfig = {
	label: string;
	short?: string;
	icon?: Component;
	showInMenu?: boolean;
	showInMobile?: boolean;
};

export type RouteMap<Id extends string = string> = Partial<Record<Id, RouteConfig>>;
export type Route<Id extends string = string> = RouteConfig & { id: Id };

export function getMenuRoutes<Id extends string>(
	routes: RouteMap<Id>,
	opts?: { mobile?: boolean }
): Route<Id>[];
```

La **clave del mapa es la ruta**. Tipa el mapa con tu `RouteId` de `$app/types` y el compilador te
valida cada entrada:

```ts
import type { RouteId } from '$app/types';
import type { RouteMap } from '@callepuzzle/core';
import House from '@lucide/svelte/icons/house';

// Una función, no un `const`: si las etiquetas vienen de i18n, resolverlas en scope de módulo
// congela el idioma para todo el proceso. Ver docs/i18n.md.
export function getRoutes(): RouteMap<RouteId> {
	return {
		'/': { label: 'Inicio', icon: House, showInMenu: true, showInMobile: true },
		'/admin': { label: 'Administración', showInMenu: true }
	};
}
```

`getMenuRoutes` reinyecta la clave como `id` y filtra:

- sin opciones, por `showInMenu` (menú de escritorio);
- con `{ mobile: true }`, **estrictamente** por `showInMobile` (dock móvil).

Los dos flags son independientes: una ruta que deba salir en los dos sitios declara los dos.

No hay `url` (la clave _es_ la ruta), ni `isProtected` ni `permissions` (la protección real vive
en los `+layout.server.ts` de la app), ni un `routes` por defecto.

## `@callepuzzle/core/schema`

```ts
export type Field =
	| { kind: 'string'; name; required; format?; placeholder?; description? }
	| { kind: 'number'; name; required; placeholder?; description?; min?; max? }
	| { kind: 'boolean'; name; required; description? }
	| { kind: 'enum'; name; required; options: string[]; placeholder?; description? }
	| { kind: 'unsupported'; name; required; jsonSchemaType?; description? };

export type Fields = Field[];
export function zodToFieldsJsonSchema(schema: ZodObject): Fields;

export type LoginSchemaStrings = { emailError?; emailPlaceholder?; emailDescription? };
export function createLoginSchema(strings?: LoginSchemaStrings): ZodObject<{ email: ZodEmail }>;
export type LoginSchema = ReturnType<typeof createLoginSchema>;
export type LoginData = z.infer<LoginSchema>;
```

`zodToFieldsJsonSchema` convierte un `z.object({ … })` en la lista de campos que renderiza
`FormFields` de `@callepuzzle/svelte-ui`:

```ts
import { z } from 'zod/v4';
import { zodToFieldsJsonSchema } from '@callepuzzle/core/schema';

const schema = z.object({
	name: z.string().meta({ placeholder: 'Los Fatigas', description: 'Nombre de la peña' }),
	members: z.number().min(1).max(100).meta({ description: 'Número de miembros' }),
	kind: z.enum(['peña', 'asociación']),
	notes: z.string().optional().meta({ format: 'textarea' })
});

zodToFieldsJsonSchema(schema);
// [{ kind: 'string', name: 'name', required: true, placeholder: 'Los Fatigas', … }, …]
```

Notas:

- Se importa de `zod/v4`, así que funciona igual con `zod@3.25.x` y con `zod@4`.
- `placeholder` y `description` salen de `.meta({ … })`, no de `.describe()`.
- El JSON Schema se genera con `io: 'input'` (un campo con `.default()` no es obligatorio) y
  `unrepresentable: 'any'`.
- Lo que no se sabe representar llega como `kind: 'unsupported'` en vez de disfrazarse de campo
  de texto. `FormFields` no lo renderiza y avisa por `console.warn` solo en desarrollo.
- Un schema sin campos obligatorios devuelve `[]` sin lanzar.

`createLoginSchema` es una **factoría** y no un `const`, para que los mensajes se resuelvan en
render y no en scope de módulo:

```ts
const schema = createLoginSchema({
	emailError: m.login_email_error(),
	emailPlaceholder: m.login_email_placeholder(),
	emailDescription: m.login_email_description()
});
```

Es el schema por defecto de `FormLoginMagicLink` y `FormLoginOtp`, y se puede extender
(`schema.extend({ … })`): los campos extra se renderizan solos.

## Documentación

- [`README` del monorepo](../../README.md)
- [`docs/instalacion.md`](../../docs/instalacion.md)
- [`docs/i18n.md`](../../docs/i18n.md) — la regla de no resolver mensajes en scope de módulo.
- [`docs/migracion.md`](../../docs/migracion.md) — mapeo desde `@repo/library`.
