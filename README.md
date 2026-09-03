# CallePuzzle Frontend Library

Monorepo de la librería de front de CallePuzzle: componentes **Svelte 5**, rutas tipadas y un
wrapper de **better-auth** para las apps SvelteKit del equipo (`donde-esta-tu-local`,
`y-tu-que-compras`).

| Paquete                                 | Ruta                         | Qué expone                                                                                                                     |
| --------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`@callepuzzle/core`](packages/core)    | `packages/core`              | Modelo de rutas (`RouteMap`, `getMenuRoutes`) y derivación de formularios desde zod (`./schema`). Sin dependencias de runtime. |
| [`@callepuzzle/auth`](packages/auth)    | `packages/auth`              | better-auth: `./client` (factoría), `./server` (instancia + presets), `./hooks` (`Handle`).                                    |
| [`@callepuzzle/svelte-ui`](packages/ui) | `packages/ui`                | Los componentes, más `./otp` y `./styles.css`.                                                                                 |
| `@callepuzzle/typescript-config`        | `packages/typescript-config` | Interno (`private`), no se publica.                                                                                            |

`demos/sveltekit` es la app de referencia y el banco de pruebas.

## Qué es

- Una librería de **componentes de aplicación**: la navbar, el cajón lateral, el dock móvil, el
  modal, el pie, los campos de formulario y los dos flujos de login (magic link y OTP) que
  comparten las apps de CallePuzzle.
- Un modelo de navegación: declaras un `RouteMap` y los componentes de menú lo pintan.
- Un wrapper fino de better-auth que resuelve la sesión una vez por request y no impone ni
  plugins ni forma de enviar correo.

## Qué no es

- **No es un design system.** No hay tokens, ni variantes, ni primitivas (`Button`, `Card`,
  `Input` sueltos). El estilo es daisyUI 5 sobre Tailwind 4, y ese es el contrato:
  [ADR 0004](docs/adr/0004-daisyui-como-contrato.md).
- **No trae i18n.** Los textos entran por props con defaults en inglés; la app resuelve su
  idioma: [ADR 0003](docs/adr/0003-i18n-por-inyeccion.md).
- **No gestiona tu sesión.** No hay store global: la sesión viaja por el `load` y llega a los
  componentes como dato plano: [ADR 0005](docs/adr/0005-auth-por-factoria.md).
- **No es para React.** Se eliminó el paquete de React del monorepo:
  [ADR 0002](docs/adr/0002-solo-svelte.md).
- **No incluye base de datos.** El esquema de better-auth vive en el demo
  (`demos/sveltekit/prisma/schema.prisma`) como referencia; cada app tiene el suyo.

## Requisitos

- **Node 22** o superior (el monorepo declara `node >=22` y `bun >=1.3.0`).
- Una app **SvelteKit 2** con **Svelte 5** (runes).
- **Tailwind 4** + **daisyUI 5** en la app.

### Matriz de compatibilidad

Rangos declarados como `peerDependencies`. Se dejan permisivos por abajo para cubrir a
`y-tu-que-compras` sin bloquear a `donde-esta-tu-local`, que va por delante.

| Peer                   | `core`                           | `auth`    | `svelte-ui`              |
| ---------------------- | -------------------------------- | --------- | ------------------------ |
| `svelte`               | `^5.36.0` (opcional)             | —         | `^5.36.12`               |
| `@sveltejs/kit`        | —                                | `^2.27.0` | `^2.27.0`                |
| `better-auth`          | —                                | `^1.3.4`  | —                        |
| `zod`                  | `^3.25.0 \|\| ^4.0.0` (opcional) | —         | `^3.25.0 \|\| ^4.0.0`    |
| `sveltekit-superforms` | —                                | —         | `^2.27.1`                |
| `formsnap`             | —                                | —         | `^2.0.1`                 |
| `tailwindcss`          | —                                | —         | `^4.1.11`                |
| `daisyui`              | —                                | —         | `^5.0.50`                |
| `@lucide/svelte`       | —                                | —         | `^0.488.0 \|\| ^1.0.0`   |
| `bits-ui`              | —                                | —         | `^2.19.0` (**opcional**) |

Notas:

- Los peers de `core` son **opcionales** porque cada uno cubre una parte: `svelte` solo aporta
  el tipo `Component` de los iconos, y `zod` solo lo necesita el subpath `./schema`.
- `bits-ui` es **opcional** y solo hace falta para `@callepuzzle/svelte-ui/otp` (el `PinInput`
  del login por OTP). Si importas ese subpath sin instalarlo, el build falla con
  `[MISSING_EXPORT] "PinInput" is not exported by "__vite-optional-peer-dep:bits-ui:…"`.
- `zod` se importa siempre desde `zod/v4`, así que un proyecto en `zod@3.25.x` funciona igual
  que uno en `zod@4`.
- Los paquetes no declaran `engines`: el mínimo real lo marca SvelteKit 2.

## Instalación

### 1. Autenticarse contra GitHub Packages

Se publica en **GitHub Packages** (`https://npm.pkg.github.com`), que exige autenticación
**incluso para paquetes públicos**. En el repo consumidor, un `.npmrc`:

```
@callepuzzle:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

Y `NPM_TOKEN` en el entorno, **nunca commiteado**: un PAT classic con scope `read:packages`.
En GitHub Actions basta `NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.

### 2. Instalar

```bash
bun add @callepuzzle/core @callepuzzle/auth @callepuzzle/svelte-ui
bun add -D tailwindcss @tailwindcss/vite daisyui
bun add @lucide/svelte better-auth sveltekit-superforms formsnap zod
bun add bits-ui   # solo si vas a usar el login por OTP
```

### 3. Instalación de estilos

Todo el estilo entra por una hoja: **importa `@callepuzzle/svelte-ui/styles.css` y ya**. La
propia hoja trae Tailwind, el plugin de daisyUI y —lo importante— el `@source` que hace que
Tailwind escanee el paquete instalado, porque Tailwind 4 no mira dentro de `node_modules`:

```css
/* src/app.css */
@import '@callepuzzle/svelte-ui/styles.css';

/* Los ficheros propios de la app. Redundante si usas `@tailwindcss/vite` (Tailwind ya
   detecta la raíz del proyecto), necesario si tu CSS vive fuera de ella. */
@source "./";
```

No añadas por tu cuenta `@import "tailwindcss"` ni `@plugin "daisyui"`: ya están dentro. Y no
escribas un `@source` a `node_modules/@callepuzzle/svelte-ui`: la hoja publicada lo trae, así
que un renombrado del paquete no rompe tu CSS.

Si te olvidas de importar la hoja, **no hay ningún error**: los componentes salen sin estilo.
Es el fallo de integración más probable.

Con `@tailwindcss/vite`, en `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({ plugins: [tailwindcss(), sveltekit()] });
```

### 4. `hooks.server.ts`

```ts
// src/hooks.server.ts
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { betterAuthHandle } from '@callepuzzle/auth/hooks';
import { auth } from '$lib/server/auth';

export const handle = sequence(betterAuthHandle(auth, building));
```

El `Handle` resuelve la sesión una vez por request y la deja en `event.locals`. Requiere que
declares esos campos en tu `src/app.d.ts` (la librería **no** augmenta `App.Locals`):

```ts
// src/app.d.ts
import type { auth } from '$lib/server/auth';

type AuthSession = typeof auth.$Infer.Session;

declare global {
	namespace App {
		interface Locals {
			session?: AuthSession['session'];
			user?: AuthSession['user'];
		}
	}
}

export {};
```

El paso a paso completo, con `auth.ts`, el cliente y el login, está en
[`docs/instalacion.md`](docs/instalacion.md) y [`docs/auth.md`](docs/auth.md).

## Ejemplo mínimo

Un `RouteMap` (la **clave es la ruta**) y una navbar con sesión y textos en castellano:

```ts
// src/lib/routes.ts
import type { RouteId } from '$app/types';
import type { RouteMap } from '@callepuzzle/core';
import House from '@lucide/svelte/icons/house';
import { m } from '$lib/paraglide/messages';

// Una función, no un `const`: las etiquetas se resuelven en render, nunca en scope de módulo.
export function getRoutes(): RouteMap<RouteId> {
	return {
		'/': { label: m.routes_home(), icon: House, showInMenu: true, showInMobile: true },
		'/admin': { label: m.routes_admin(), showInMenu: true }
	};
}
```

```ts
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({ user: locals.user ?? null });
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { Header, NavBarEnd } from '@callepuzzle/svelte-ui';
	import { getRoutes } from '$lib/routes';
	import { authClient } from '$lib/auth-client';
	import { m } from '$lib/paraglide/messages';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const routes = $derived(getRoutes());
</script>

<Header {routes} homeHref="/" strings={{ navLabel: m.nav_menu() }}>
	{#snippet title()}CallePuzzle{/snippet}
	{#snippet navEnd()}
		<NavBarEnd
			user={data.user}
			{authClient}
			profileHref="/profile"
			strings={{ signOut: m.nav_sign_out(), profile: m.nav_profile() }}
		>
			{#snippet login()}
				<a class="btn btn-sm" href="/login">{m.nav_sign_in()}</a>
			{/snippet}
		</NavBarEnd>
	{/snippet}
</Header>

{@render children()}
```

`Header` **es solo la navbar**: no envuelve la app y no trae cajón lateral. Si quieres cajón,
compón un `Drawer` alrededor y pásale su `drawerId` al `Header` con `menuToggleFor`. Todos los
componentes con texto visible aceptan `strings` (`Partial<XStrings>`): sobreescribes solo las
claves que te interesan y el resto se queda en inglés.

## Referencia de componentes

El **Storybook** es la referencia: cada componente tiene sus stories con `autodocs`, y los
`*.strings.ts` documentan cada clave de copy.

```bash
bun run storybook   # http://localhost:6006
```

> Todavía **no está publicado** en una URL estable. El CI (`.github/workflows/ci.yml`) construye
> `packages/ui/storybook-static` y lo sube como artefacto `storybook-static` en cada PR;
> publicarlo (Chromatic o GitHub Pages) es la tarea T13.7 del
> [plan 13](docs/plans/13-documentacion.md). Mientras tanto, `bun run storybook` en local o el
> artefacto del CI.

Documentación de integración:

- [`docs/instalacion.md`](docs/instalacion.md) — desde un proyecto SvelteKit vacío, paso a paso.
- [`docs/i18n.md`](docs/i18n.md) — cómo inyectar los textos (con ejemplo de Paraglide).
- [`docs/auth.md`](docs/auth.md) — cómo montar better-auth con la librería.
- [`docs/migracion.md`](docs/migracion.md) — mapeo símbolo a símbolo desde las versiones viejas.
- [`packages/ui/README.md`](packages/ui/README.md) — qué exporta el paquete de componentes.

## Desarrollo en el monorepo

Gestor de paquetes: **bun**. Orquestador: **turbo**. Todos los scripts se lanzan desde la raíz.

```bash
bun install
```

| Script                         | Qué hace                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `bun run build`                | `turbo run build`: `tsup` en `core`/`auth`, `svelte-package` en `ui`, `vite build` en el demo. |
| `bun run dev`                  | `turbo run dev` en todo lo que tenga `dev`.                                                    |
| `bun run dev:sveltekit`        | Solo el demo y sus dependencias (`--filter=sveltekit...`).                                     |
| `bun run storybook`            | Storybook de `packages/ui` en `:6006`.                                                         |
| `bun run build-storybook`      | Storybook estático en `packages/ui/storybook-static`.                                          |
| `bun run check`                | `svelte-check` en `ui` y en el demo.                                                           |
| `bun run check-types`          | `tsc --noEmit` en `core` y `auth`; `svelte-check` en `ui`.                                     |
| `bun run test`                 | `vitest run` (unit + componente en navegador + stories).                                       |
| `bun run lint`                 | `oxlint` en los tres paquetes, más `eslint` en `ui`.                                           |
| `bun run format` / `format:ci` | Prettier (`--write` / `--check`).                                                              |
| `bun run check-publish`        | `publint` + `@arethetypeswrong/cli` en los tres publicables.                                   |
| `bun run prepush`              | Lo que corre el hook de pre-push: `format:ci` + lint + check-types + test + build.             |

Los tests de componente y las stories corren en **Chromium real** (vitest browser mode): la
primera vez, `bunx playwright install chromium`.

Para el demo, desde `demos/sveltekit`:

```bash
cp .env.example .env      # define LIBSQL_URL
bun run db:migrate:dev    # aplica las migraciones
```

y desde la raíz, `bun run dev:sveltekit`. Los scripts de base de datos (`db:generate`,
`db:migrate:*`, `db:push`, `studio`, `better-auth:generate`) viven en el demo, no en la raíz:
son del demo, no de la librería.

## Publicar

Ver [ADR 0001](docs/adr/0001-distribucion.md). Resumen:

1. En cada PR que toque un paquete publicable: `bun run changeset` y commitea el `.md`.
2. Al mergear a `main`, `.github/workflows/release.yml` abre el PR _"chore: version packages"_.
3. Al mergear ese PR, el mismo workflow publica en GitHub Packages con el `GITHUB_TOKEN`.

A mano hace falta un PAT con `write:packages` en `NPM_TOKEN` y `bun run release`.

> `monorepo-v2` y `main` tienen historias git no relacionadas, así que hasta que la rama se
> promocione a `main` ni `changeset status` ni el workflow de release funcionan. Ver la sección
> "Pendiente" del [ADR 0001](docs/adr/0001-distribucion.md).

## Documentación interna

- [`AGENTS.md`](AGENTS.md) — guía para agentes de IA y para quien llegue nuevo: stack, comandos,
  convenciones y **decisiones conscientes con su razón**.
- [`docs/adr/`](docs/adr) — decisiones de arquitectura:
  [0001 distribución](docs/adr/0001-distribucion.md),
  [0002 solo Svelte](docs/adr/0002-solo-svelte.md),
  [0003 i18n por inyección](docs/adr/0003-i18n-por-inyeccion.md),
  [0004 daisyUI como contrato](docs/adr/0004-daisyui-como-contrato.md),
  [0005 auth por factoría](docs/adr/0005-auth-por-factoria.md).
- [`docs/plans/`](docs/plans) — el plan de trabajo del refactor, con el catálogo de defectos.
