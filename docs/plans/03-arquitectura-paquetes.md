# 03 — Arquitectura y fronteras de paquetes

**Prioridad: alta.** Define el contrato que verán los consumidores.

## Contexto

Hoy hay dos paquetes con código real y la frontera entre ellos es arbitraria:

- `@repo/library` (`packages/library`): `routes` + wrapper de better-auth + `sender` de email.
  Se construye con **tsup** a ESM + `.d.ts`.
- `@repo/sveltekit-ui` (`packages/sveltekit-ui`): componentes `.svelte` + schemas zod.
  Se construye con **svelte-package**.

`sveltekit-ui` depende de `library` (`workspace:*`) y los componentes importan de ambos subpaths
(`@repo/library` y `@repo/library/better-auth`).

## Hallazgos

### H3.1 — El nombre `library` no dice nada y mezcla capas

`packages/library` junta tres cosas sin relación:

- **Rutas y tipos de navegación** (`src/routes.ts`) — puro dato, sin dependencias.
- **Autenticación** (`src/better-auth/*`) — depende de `better-auth` y `@sveltejs/kit`.
- **Envío de email** (`src/better-auth/sender.ts`) — depende de `nodemailer`, es **código de
  servidor**, y ni siquiera se exporta desde `src/better-auth/index.ts`. Es código muerto que
  arrastra `nodemailer` a las dependencias del paquete.

Cualquier consumidor que solo quiera los tipos de `Routes` se traga `better-auth` y `nodemailer`
en su árbol de dependencias.

### H3.2 — No hay separación cliente/servidor

`packages/library/src/better-auth/index.ts` reexporta `./client.js` **y** `./server.js` desde el
mismo entrypoint. `server.ts` importa `betterAuth` de `better-auth` (servidor) y `client.ts`
importa `better-auth/svelte` (cliente). Un import de `@repo/library/better-auth` desde un
componente `.svelte` arrastra el código de servidor al bundle de cliente. `handle.ts` (que
importa `@sveltejs/kit`) va en el mismo saco.

SvelteKit ni siquiera puede protegerlo: la convención `$lib/server` solo aplica dentro de la app,
no a un paquete de `node_modules`.

### H3.3 — `exports` incompletos en `sveltekit-ui`

```json
"exports": {
  ".": { "types": "./dist/index.d.ts", "svelte": "./dist/index.js" },
  "./package.json": "./package.json"
}
```

Solo hay condición `"svelte"`. No hay `"import"` ni `"default"`. Cualquier herramienta que no
conozca la condición `svelte` (Vitest en entorno node, un script de build, `tsx`, un bundler mal
configurado) **no resuelve el paquete**. La convención de `svelte-package` es exportar ambas:
`"svelte"` para el fuente `.svelte` y `"default"`/`"import"` para el JS compilado.

### H3.4 — `packages/library` no declara `files` ni `sideEffects`

Publicaría `src/`, `messages/`, `project.inlang/`, `tsconfig.json`, `tsup.config.ts`.
Sin `sideEffects: false` (o la lista de CSS), los bundlers no pueden tree-shakear.

### H3.5 — Dependencias mal clasificadas

`packages/sveltekit-ui/package.json`:

- **`zod-to-json-schema` NO está declarado** pero `src/schemas/utils.ts` lo importa (y también
  `src/tests/zodToJsonSchema.test.ts`). Funciona solo por hoisting de bun en el monorepo;
  instalado desde npm, **rompe**. Ver [09](09-forms-schemas.md).
- `better-auth` y `nodemailer` están en `dependencies` de `sveltekit-ui` pero el paquete solo usa
  _tipos_ de better-auth (vía `@repo/library/better-auth`) y **no usa nodemailer en absoluto**.
- `svelte` está bien como `peerDependency` — pero `sveltekit-superforms`, `formsnap`, `zod` y
  `@lucide/svelte` están como `dependencies`. Al menos `zod` y `sveltekit-superforms` deberían
  ser **peer** (el consumidor tiene su propia instancia; dos copias de zod = validadores que no
  se reconocen entre sí, y superforms mantiene estado propio).
- `@sveltejs/kit` es `devDependency` pero los tipos públicos lo necesitan → peer.

`packages/library/package.json`:

- `@inlang/paraglide-js` aparece **duplicado**, en `dependencies` (`^2.2.0`) y en
  `devDependencies` (`2.2.0`).
- `nodemailer` en `dependencies` para código muerto (H3.1).

### H3.6 — `app.d.ts` triplicado y roto

Existe el mismo fichero en `packages/library/src/app.d.ts`,
`packages/sveltekit-ui/src/app.d.ts` y `demos/sveltekit/src/app.d.ts`, los tres declarando:

```ts
declare global {
	namespace App {
		interface Locals {
			session?: Session;
			user?: User;
		}
	}
}
```

`Session` y `User` **no están importados en ninguno de los tres** → son tipos sin resolver.
Peor: una **librería** no debe augmentar `App.Locals` globalmente; eso lo decide la app. Hoy se
salva porque `tsup.config.ts` lo excluye del `.d.ts`, pero `svelte-package` sí lo copia a `dist`
en `sveltekit-ui`.

### H3.7 — `sveltekit-ui` es una app SvelteKit disfrazada de librería

Tiene `svelte.config.js` con `adapter-auto`, un script `preview: vite preview` que no sirve para
nada, y `@sveltejs/adapter-auto` como devDependency. `svelte-package` no necesita adapter.

## Propuesta

### Mapa objetivo

```
packages/
  core/                       @callepuzzle/core
    src/index.ts              → tipos Route/Routes, getMenuRoutes, defineRoutes()
    src/schema/index.ts       → zod → Fields (sin dependencia de UI)
    (sin dependencias de runtime salvo zod como peer)

  auth/                       @callepuzzle/auth
    src/client.ts             → export "./client"  (browser + SSR-safe, factoría)
    src/server.ts             → export "./server"  (solo Node, betterAuth + plugins)
    src/hooks.ts              → export "./hooks"   (Handle de SvelteKit)
    peer: better-auth, @sveltejs/kit

  ui/                         @callepuzzle/svelte-ui
    src/components/*          → export "."
    src/styles/index.css      → export "./styles.css"
    peer: svelte, @sveltejs/kit, sveltekit-superforms, formsnap, zod, tailwindcss
    deps: @callepuzzle/core (versión real, no workspace)

  typescript-config/          interno, private
```

### Reglas de frontera

1. **`core` no importa nada de UI ni de auth.** Es el trozo que sobreviviría a un port a React.
2. **`auth` no importa nada de UI.** Sus subpaths están separados por entorno de ejecución, con
   `"browser"`/`"node"` en las condiciones de `exports` si hace falta reforzarlo.
3. **`ui` puede importar `core`, nunca `auth/server`.** Los componentes reciben el cliente de
   auth como **prop**, no lo importan (ver [05](05-auth.md)).
4. Todo lo que el consumidor ya tiene instalado (svelte, kit, zod, superforms, tailwind) es
   **peerDependency**, no dependency.

### Plantilla de `exports` para `ui`

```json
{
	"sideEffects": ["**/*.css"],
	"files": ["dist", "!dist/**/*.test.*", "!dist/**/*.spec.*"],
	"svelte": "./dist/index.js",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"svelte": "./dist/index.js",
			"default": "./dist/index.js"
		},
		"./styles.css": "./dist/styles/index.css",
		"./package.json": "./package.json"
	}
}
```

## Tareas

- [x] **T3.1** Crear `packages/core` con `routes.ts` (sin i18n, ver [04](04-i18n.md)) y
      `schema/` (el `zodToFieldsJsonSchema`, ver [09](09-forms-schemas.md)). Sin dependencias de
      runtime.
- [x] **T3.2** Crear `packages/auth` a partir de `packages/library/src/better-auth/`, con tres
      entrypoints (`/client`, `/server`, `/hooks`) y sin barrel que los mezcle.
- [x] **T3.3** Borrar `packages/library` una vez vaciado. Borrar `sender.ts` (código muerto) o
      moverlo a `auth/server` **y exportarlo**, si se decide que la librería debe ofrecer envío de
      email — decisión a tomar en [05](05-auth.md).
- [x] **T3.4** Renombrar `packages/sveltekit-ui` → `packages/ui` y ajustar `exports` según la
      plantilla de arriba.
- [x] **T3.5** Reclasificar dependencias en los tres paquetes: mover a `peerDependencies` svelte,
      `@sveltejs/kit`, `zod`, `sveltekit-superforms`, `formsnap`, `better-auth`; añadir los mismos a
      `devDependencies` para poder compilar/testear; declarar `peerDependenciesMeta.optional` donde
      aplique.
- [x] **T3.6** Declarar `zod-to-json-schema` o eliminarlo migrando a `z.toJSONSchema` de zod v4
      (ver [09](09-forms-schemas.md)). **Bug real hoy.**
- [x] **T3.7** Eliminar la duplicación de `@inlang/paraglide-js` en `packages/library`.
- [x] **T3.8** Borrar `app.d.ts` de los dos paquetes de librería. Dejarlo **solo** en
      `demos/sveltekit`, con los tipos importados de verdad
      (`type Session = typeof auth.$Infer.Session`, como hace `donde-esta-tu-local`).
- [x] **T3.9** Simplificar `svelte.config.js` de `ui`: quitar `adapter-auto` y la dependencia;
      dejar solo `preprocess: vitePreprocess()`. Quitar el script `preview`.
- [x] **T3.10** Añadir `sideEffects` y `files` a todos los paquetes publicables.
- [x] **T3.11** Validar con `publint` + `attw` y con un consumo real desde el demo instalado por
      tarball (`npm pack` → `bun add ./paquete.tgz`), no por `workspace:*`.

## Criterios de aceptación

- `import { Header } from '@callepuzzle/svelte-ui'` funciona en Vite, en Vitest node y en un
  `tsx` suelto.
- Importar solo `@callepuzzle/core` no arrastra `better-auth` ni `nodemailer` al `node_modules`
  del consumidor.
- `attw` no reporta condiciones de `exports` faltantes.

## Estado (2026-09-02)

Implementado. El mapa objetivo del documento es el que hay en disco:

```
packages/core/   @callepuzzle/core       "." (rutas, cero deps de runtime) + "./schema" (zod)
packages/auth/   @callepuzzle/auth       "./client" + "./server" + "./hooks"
packages/ui/     @callepuzzle/svelte-ui  "." + "./otp" + "./styles.css"
```

`publint` da _All good_ y `attw --profile esm-only` sale todo 🟢 en los tres paquetes.
`svelte-check` da 0 errores en `packages/ui` y en el demo.

**Decisiones tomadas al implementar, no previstas en el plan:**

- **`core` se parte en dos entrypoints, no en uno.** El plan proponía un `core` único, pero
  `zodToFieldsJsonSchema` necesita zod en runtime y `getMenuRoutes` no necesita nada. Con `.` y
  `./schema` separados, `zod` es peer **opcional** y quien solo quiere el modelo de rutas no
  arrastra zod. `svelte` también es peer opcional de `core`: solo se usa el tipo `Component`
  para `RouteConfig.icon`.
- **`ui` no importa `@callepuzzle/auth` ni para tipos.** El plan decía «`ui` puede importar
  `core`, nunca `auth/server`»; se ha ido más lejos: los componentes tipan el cliente de auth de
  forma **estructural** (`SignOutClient`, `MagicLinkClient`, `EmailOtpClient` en
  `packages/ui/src/types.ts`), así que un consumidor puede usarlos con su propio cliente de
  better-auth y los plugins que quiera, y `@callepuzzle/auth` desaparece de las dependencias de
  `ui`.
- **`FormLoginOtp` va en el subpath `./otp`.** Necesita `bits-ui` (el `PinInput`), que queda como
  peer **opcional**: si estuviera en el barrel principal, un consumidor de magic link no podría
  importar nada del paquete sin instalar `bits-ui`.
- **`esm-env` como dependencia de `ui`.** El aviso de tipo no soportado de `FormFields` usaba las
  variables de entorno de Vite, y `svelte-package` lo rechaza en código publicado (solo funcionan
  en apps bundleadas con Vite). Se usa el flag `DEV` de `esm-env`, que es lo que hace SvelteKit
  por el mismo motivo.
- **`clsx` + `tailwind-merge` como dependencias de `ui`**, para el `cn()` que hace falta en cuanto
  los componentes aceptan `class` (ver [08](08-estilos-theming.md), T8.7).

**T3.11** verificado desde fuera: proyecto SvelteKit limpio, `node_modules` propio y los tres
paquetes instalados por tarball, con `svelte-check` y `vite build` en verde e importando toda la
superficie pública. El detalle está en la reverificación de
[01](01-estrategia-distribucion.md). Lo único que queda para la `0.1.0` real es que CI corte la
release al mergear a `main`.
