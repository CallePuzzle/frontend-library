# 09 — Formularios y schemas: migrar a zod v4

**Prioridad: alta.** Hay una dependencia no declarada (bug real) y la librería va un major por
detrás del consumidor.

## Contexto

El sistema de formularios es: un schema zod → `zodToFieldsJsonSchema()` produce una lista de
campos → `FormFields` los itera y renderiza un `FormString` por cada uno, atado a
`sveltekit-superforms` + `formsnap`.

La idea es buena: un solo schema define validación, tipos y UI. Pero la implementación está
desactualizada.

## Hallazgos

### H9.1 — `zod-to-json-schema` no está declarado como dependencia (bug)

`packages/sveltekit-ui/src/schemas/utils.ts`:

```ts
import { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
```

`grep zod-to-json-schema packages/sveltekit-ui/package.json` → **0 resultados**. También lo
importa `src/tests/zodToJsonSchema.test.ts`.

Ahora mismo resuelve por hoisting de bun en el workspace. Instalado desde el registro,
`@callepuzzle/svelte-ui` **falla al importar**. Es un fallo de publicación garantizado.

### H9.2 — zod v3 vs zod v4

- Librería: `"zod": "^3.25.76"` + paquete externo `zod-to-json-schema`.
- `donde-esta-tu-local`: `import { z } from 'zod/v4'` y **`z.toJSONSchema()` nativo**, sin
  dependencia externa. Adaptadores `zod4`/`zod4Client` de superforms.

zod 4 trae `z.toJSONSchema` en el core, así que `zod-to-json-schema` desaparece. La librería
usa `zodClient`/`zod` (adaptadores v3) mientras el consumidor usa `zod4Client`/`zod4`: **son
incompatibles**. Un consumidor en zod 4 no puede pasar sus schemas a `FormFields` de la
librería.

Agravante: si el consumidor tiene zod 4 y la librería trae su propia zod 3 como `dependency`
(no peer), acaban **dos zod en el árbol** y las instancias no se reconocen entre sí.

### H9.3 — El `placeholder` sale mal

Librería (`src/schemas/utils.ts:29`):

```ts
placeholder: name,           // ← el nombre del campo como placeholder
```

Consumidor:

```ts
placeholder: properties.placeholder as string,   // ← el declarado en el schema
```

Y el schema del consumidor lo declara con `.meta()`:

```ts
email: z.email(m.schema_login_email_error()).meta({
	placeholder: 'jesus-asereje@kyp.es',
	description: m.schema_login_email_describe()
});
```

La librería usa `.describe()` (v3) y no tiene concepto de `placeholder` en el schema. Resultado:
todos los inputs de la librería muestran `email`, `name`, `age`… como placeholder.

### H9.4 — El tipo de `LoginSchema` es distinto en cada sitio

- Librería: `export type LoginSchema = typeof loginSchema;` (el **schema**)
- Consumidor: `export type LoginSchema = z.infer<typeof loginSchema>;` (los **datos**)

El de la librería es el que usan los adaptadores de superforms, así que no está mal per se, pero
el nombre engaña. Conviene exportar ambos con nombres claros (`LoginSchema` / `LoginData`).

### H9.5 — `zodToFieldsJsonSchema` no maneja nada más que strings planos

```ts
const jsonSchema = zodToJsonSchema(schema) as { properties: …; required: string[] };
for (const key in jsonSchema.properties) { … }
```

- `jsonSchema.required` puede ser `undefined` (el propio test del repo lo documenta:
  _"if it's empty don't have required field"_), pero el código hace
  `jsonSchema.required.includes(key)` sin guarda → **TypeError con un schema sin campos
  obligatorios**. El cast `as` desactiva la comprobación que TypeScript habría hecho.
- No soporta objetos anidados, arrays, enums, booleanos ni números: todo se renderiza como
  `<input>` de texto (o del `format` si zod lo emite).
- El componente se llama `FormString` precisamente porque solo hace strings. No hay
  `FormNumber`, `FormSelect`, `FormCheckbox`, `FormTextarea`.

### H9.6 — Tests que no prueban el código propio

`src/tests/zodToJsonSchema.test.ts` (3 tests) prueba **la librería de terceros**
`zod-to-json-schema`, no `zodToFieldsJsonSchema`. `src/tests/demo.spec.ts` prueba `1 + 2 === 3`.

Es decir: **cero cobertura del código del paquete**. El consumidor sí tiene
`src/lib/schemas/utils.test.ts` (y `login.test.ts`, `gang.test.ts`, `user.test.ts`).

### H9.7 — Dependencias de formularios mal clasificadas

`sveltekit-superforms`, `formsnap` y `zod` están en `dependencies` de `packages/sveltekit-ui`.
Los tres mantienen estado o identidad de tipos que debe ser **única en la app** → peer.

## Propuesta

1. **Migrar a zod v4** y eliminar `zod-to-json-schema`. Resuelve H9.1, H9.2 y parte de H9.3 de
   una vez.
2. **Mover `zodToFieldsJsonSchema` a `@callepuzzle/core`** — es lógica pura, sin UI, y es el
   trozo que serviría también para React.
3. **Adoptar la convención `.meta({ placeholder, description })`** que ya usa
   `donde-esta-tu-local`.
4. **Endurecer el parseo**: sin `as`, con guardas para `required` ausente y un tipo de retorno
   discriminado por tipo de campo:
   ```ts
   type Field =
     | { kind: 'string'; name: string; format?: string; placeholder?: string; description?: string; required: boolean }
     | { kind: 'number'; … } | { kind: 'boolean'; … } | { kind: 'enum'; options: string[]; … };
   ```
5. **`FormFields` despacha por `kind`** a `FormString` / `FormNumber` / `FormCheckbox` /
   `FormSelect`. Con un `fallback` explícito para tipos no soportados (mejor un warning en dev
   que un input de texto silencioso).

## Tareas

- [ ] **T9.1** **Declarar `zod-to-json-schema`** como parche inmediato si la migración a v4 no
      es inmediata. **Bug de publicación.**
- [x] **T9.2** Migrar el paquete a `zod@^4` y `z.toJSONSchema`; eliminar `zod-to-json-schema`.
- [x] **T9.3** Cambiar los adaptadores de superforms a `zod4` / `zod4Client` en `FormLogin`.
- [x] **T9.4** Mover `schemas/utils.ts` a `packages/core/src/schema/`.
- [x] **T9.5** Leer `placeholder` de `.meta()` en vez de usar el nombre del campo.
- [x] **T9.6** Añadir guarda para `required` ausente y eliminar los casts `as`.
- [x] **T9.7** Discriminar `Field` por tipo y añadir `FormNumber`, `FormCheckbox`, `FormSelect`,
      `FormTextarea`.
- [x] **T9.8** Migrar `FormFields`/`FormString` a genéricos (compartido con
      [07](07-componentes-api.md), T7.10).
- [x] **T9.9** Mover `zod`, `sveltekit-superforms`, `formsnap` a `peerDependencies`.
- [x] **T9.10** Borrar `src/tests/demo.spec.ts` y reescribir `zodToJsonSchema.test.ts` para
      probar `zodToFieldsJsonSchema` (casos: campo opcional, schema sin `required`, `.meta()`
      completo y ausente, formatos `email`/`url`/`date`, enum).
- [x] **T9.11** Decidir si `loginSchema` sigue viviendo en la librería. Propuesta: exportarlo
      como schema **por defecto** desde `core`, pero que `FormLogin` acepte el schema como prop
      para que el consumidor pueda extenderlo (ver [07](07-componentes-api.md), T7.14).

## Criterios de aceptación

- `bun add` del tarball en un proyecto limpio y `import { FormFields }` funciona sin
  dependencias no resueltas.
- Un schema zod 4 del consumidor pasa directamente a `FormFields`.
- `zodToFieldsJsonSchema(z.object({}))` no lanza.
- Cobertura de `zodToFieldsJsonSchema` > 80%.

## Estado (2026-09-02)

Implementado. Se fue **directamente a zod v4**, así que **T9.1 queda obsoleta**: no hacía falta
declarar `zod-to-json-schema` como parche porque el paquete desaparece del árbol.

- `zodToFieldsJsonSchema` vive en `@callepuzzle/core/schema` y usa `z.toJSONSchema` nativo.
- `Field` está discriminado por `kind` (`string`, `number`, `boolean`, `enum`, `unsupported`) y
  `FormFields` despacha a `FormString`/`FormNumber`/`FormCheckbox`/`FormSelect`/`FormTextarea`.
- `placeholder` y `description` salen de `.meta()`, no del nombre del campo (C8).
- `zod`, `sveltekit-superforms` y `formsnap` son `peerDependencies` de `ui`.
- `createLoginSchema(strings?)` se exporta desde `core/schema` y `FormLogin*` acepta el schema
  por prop, así que un consumidor puede extenderlo sin forkear.

Criterios de aceptación, comprobados: `zodToFieldsJsonSchema(z.object({}))` no lanza (tiene su
test); la cobertura de `core` está al **97%** con 19 tests; y un proyecto limpio instalado por
tarball importa `FormFields` sin dependencias sin resolver.

**Decisiones tomadas al implementar, no previstas en el plan:**

- **Cero casts `as` sobre el JSON Schema.** El plan pedía «endurecer el parseo»; se ha hecho con
  guardas de forma reales (`isRecord`, `readString`, `readNumber`, `readStringArray`) en vez de
  con un cast a la forma esperada. El bug B6 no era el `.includes` en sí, era el `as` que
  desactivaba la comprobación que TypeScript habría hecho.
- **`z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })`.** `io: 'input'` es la
  semántica correcta de un formulario (un campo con `.default()` no es obligatorio) y
  `unrepresentable: 'any'` evita que un `z.date()` haga **lanzar** a la función: cae en
  `unsupported`.
- **`kind: 'unsupported'` no renderiza nada** y avisa por consola solo en desarrollo. Un input de
  texto silencioso para un tipo que no se sabe representar es peor que no pintar nada.
- **`createLoginSchema` devuelve `ZodObject<{ email: ZodEmail }>`**, no `ZodString`: en zod v4
  `ZodEmail` no es asignable a `ZodString` y `z.string().email()` está deprecado.
- **El rango del peer es `^3.25.0 || ^4.0.0` y se importa siempre de `zod/v4`**, que es lo que
  hace `donde-esta-tu-local`: cubre a los dos consumidores sin forzar a nadie a subir de major.
