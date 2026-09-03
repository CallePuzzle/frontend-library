# 12 — Convergencia con los consumidores

**Prioridad: alta.** Es donde se cobra el beneficio de todo lo anterior. También es donde está
la mayor sorpresa del análisis.

## El hallazgo central

**`donde-esta-tu-local` ya tiene una versión mejor de la librería que la librería.**

Sus `src/lib/components/` contiene los **ocho** componentes, con los mismos nombres, evolucionados:

| Fichero             | Librería                                                  | `donde-esta-tu-local`                                              |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `Header.svelte`     | Drawer monolítico, `title: string`, id hardcodeado        | Navbar limpia, `title: Snippet`, `resolve()`, botón atrás móvil    |
| `NavBarEnd.svelte`  | `session` store global, avatar de stock, botones anidados | `user` por prop, `user.image` + inicial, a11y correcta             |
| `NavBarList.svelte` | Filtro no reactivo, key inestable                         | `getMenuRoutes()`, key por `route.id`                              |
| `Link.svelte`       | `href={route.url as string}`                              | `href={resolve(href)}`, tipado con `RouteId`                       |
| `Modal.svelte`      | `getElementById` en `onMount`                             | `bind:this` + `$state`, `showModal()` exportado, 4 props de estilo |
| `FormFields.svelte` | `SuperForm<any, any>`                                     | Genérico `<T extends Record<string, unknown>>`                     |
| `FormString.svelte` | `any`, sin `hidden`                                       | Genérico + `FormPath<T>`, soporta `hidden`                         |
| `FormLogin.svelte`  | Magic link, 1 paso                                        | OTP 6 dígitos, 2 pasos, rate limit, `invalidateAll()`              |
| `schemas/utils.ts`  | zod v3 + `zod-to-json-schema`                             | zod v4 + `z.toJSONSchema()` nativo                                 |
| `schemas/login.ts`  | `.describe()`                                             | `.meta({ placeholder, description })`                              |
| `routes.ts`         | `url` string-o-función, `isProtected` muerto              | Clave = `RouteId`, `icon`, `short`, `showInMobile`                 |

Y tiene componentes que la librería no: `Dock`, `DockLink`, `Footer`, `ButtonSignOut`,
`UserNotLogged`, `NotificationToggle`, `ButtonRequest`.

**Implicación estratégica:** la migración correcta no es "adaptar los consumidores a la
librería", sino **promover el código de `donde-esta-tu-local` a la librería** y luego hacer que
el consumidor lo reimporte. La librería es la foto vieja; el consumidor es la rama viva.

## Estado de cada consumidor

### `donde-esta-tu-local` — desacoplado, adelantado

- **No depende del repo.** `package.json` no menciona `@repo/*` ni `storybook-svelte`. Copió el
  código y siguió su camino.
- Stack: SvelteKit 2.70, Svelte 5.57, **Vite 8**, **zod 4**, **Prisma 7 + PostgreSQL**,
  better-auth 1.7 con **emailOTP**, `@lucide/svelte` **1.x**, bits-ui, flowbite-svelte,
  daisyUI 5.7, Vitest 4, Node 26 types.
- Tiene tests unitarios, E2E de Playwright, oxlint, pino, OTel, y un `AGENTS.md` excelente.
- Único locale: `es`.

### `y-tu-que-compras` — roto

- `"storybook-svelte": "link:storybook-svelte"` — nombre de paquete que ya no existe y un
  `bun link` que solo funciona en la máquina que lo registró.
- `src/hooks.server.ts`: `import { betterAuth } from 'storybook-svelte'` → hoy es
  `betterAuthHandle`, en el subpath `/better-auth`, con firma `(auth, building)`.
- `src/lib/routes.ts`: `import { routes as coreRoutes, type Routes } from 'storybook-svelte'` →
  hoy vive en `@repo/library`. Y usa `url: (id) => \`/home/${id}\``— el caso exacto que el`Link` de la librería rompe (ver [06](06-routing-navegacion.md), H6.1).
- `src/routes/+layout.svelte`: `<Header title="NavNar Title" {routes} {session} {authClient}>` —
  con "NavNar" también en el demo, es decir, se copió el typo.
- `src/app.css`: `@source "../node_modules/storybook-svelte"` → nombre viejo, y apunta a la raíz
  del paquete, no a `dist`.
- Stack un major por detrás: Vite 6, `@sveltejs/vite-plugin-svelte` 5, Prisma 6, zod ausente.
- Tiene su propio `src/lib/auth-client.ts` **idéntico** al `client.ts` de la librería, incluido
  el `export const session = useSession()` en scope de módulo (mismo bug, ver
  [05](05-auth.md)).

## Deltas de versión a resolver

| Dependencia                    | Librería | donde-esta-tu-local | y-tu-que-compras |
| ------------------------------ | -------- | ------------------- | ---------------- |
| `svelte`                       | ^5.37    | ^5.57               | ^5.35            |
| `@sveltejs/kit`                | ^2.27    | ^2.70               | ^2.22            |
| `vite`                         | ^7.0     | **^8.2**            | ^6.3             |
| `@sveltejs/vite-plugin-svelte` | ^6.1     | **^7.3**            | ^5.1             |
| `zod`                          | ^3.25    | **v4** (`zod/v4`)   | —                |
| `sveltekit-superforms`         | ^2.27    | ^2.30               | —                |
| `better-auth`                  | ^1.3     | **^1.7**            | ^1.2             |
| `@lucide/svelte`               | ^0.488   | **^1.37**           | —                |
| `daisyui`                      | ^5.0     | ^5.7                | ^5.0             |
| `vitest`                       | ^3.2     | **^4.1**            | ^3.2             |
| `typescript`                   | 5.8/5.9  | ^5.9                | ^5.8             |

El rango de peers de la librería debe cubrir al menos de `y-tu-que-compras` a
`donde-esta-tu-local`, o hay que subir primero al rezagado. Recomendación: **fijar el objetivo
en el stack de `donde-esta-tu-local`** (es producción real y el más moderno) y subir
`y-tu-que-compras` como parte de su migración.

## Plan de convergencia

### Fase A — promover el código bueno (antes de publicar nada)

Para cada componente, tomar la versión de `donde-esta-tu-local` como base y **generalizarla**
quitando lo específico del producto:

| Específico a quitar                            | Sustituir por                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `$lib/stores/loginModal.svelte`                | `bind:this` en el consumidor, o un `onMount` callback                                                    |
| `$lib/utils/tour.ts` (`tourDesktopElementIds`) | prop `id` en `Link` (ya propuesta en T6.5)                                                               |
| `$lib/utils/member-display`                    | prop `displayName`/`initial`, o snippet `avatar`                                                         |
| `$lib/paraglide/messages`                      | `strings` por props (ver [04](04-i18n.md))                                                               |
| `$lib/auth-client`                             | `authClient` por prop (ver [05](05-auth.md))                                                             |
| `$lib/routes`                                  | `RouteMap` genérico (ver [06](06-routing-navegacion.md))                                                 |
| `bits-ui` (PinInput del OTP)                   | mantener como **peer opcional**, o extraer el `FormLogin` OTP a un subpath `@callepuzzle/svelte-ui/auth` |

### Fase B — publicar `0.1.0` y validar contra `donde-esta-tu-local` sin migrarlo

Instalar la librería en `donde-esta-tu-local` **en paralelo** a sus componentes locales, y
comparar render a render en una rama. Es la prueba de fuego: si la librería no puede sustituir
sus componentes sin regresión, no está lista.

### Fase C — migrar `y-tu-que-compras` (el más fácil, es el que menos código propio tiene)

Es prácticamente un demo. Migrarlo primero valida la instalación desde registro.

### Fase D — migrar `donde-esta-tu-local` por partes

Componente a componente, empezando por los más aislados (`Modal`, `Link`, `FormString`) y
dejando `FormLogin`/`Header` para el final.

## Tareas

### Diagnóstico y diff

- [x] **T12.1** Diff formal componente a componente entre la librería y
      `donde-esta-tu-local/src/lib/components/`, anotando para cada diferencia: ¿mejora genérica
      (promover) o especificidad de producto (parametrizar)?
- [x] **T12.2** Inventariar los componentes que solo tiene el consumidor (`Dock`, `Footer`,
      `ButtonSignOut`, `UserNotLogged`, `NotificationToggle`, `ButtonRequest`) y decidir cuáles son
      genéricos.

### Promoción

- [x] **T12.3** Portar `Modal`, `Link`, `NavBarList`, `FormFields`, `FormString` desde el
      consumidor (son los más limpios y menos acoplados).
- [x] **T12.4** Portar `schemas/utils.ts` (zod 4) y el patrón `.meta()` — cubre
      [09](09-forms-schemas.md).
- [x] **T12.5** Portar el modelo de `routes.ts` — cubre [06](06-routing-navegacion.md).
- [x] **T12.6** Rediseñar `FormLogin` para soportar **ambos** flujos (magic link y OTP) por
      configuración, o partirlo en `FormLoginMagicLink` / `FormLoginOtp`. Los dos consumidores usan
      flujos distintos y ambos son legítimos.
- [x] **T12.7** Rediseñar `Header` sin drawer obligatorio (ver
      [07](07-componentes-api.md), T7.13).

### Alineación de versiones

- [x] **T12.8** Definir los rangos de `peerDependencies` de la librería para cubrir el stack
      objetivo. Documentar la matriz de compatibilidad soportada.
- [ ] **T12.9** Subir `y-tu-que-compras` a Vite 8 / kit 2.70 / svelte 5.57 / better-auth 1.7.

### Migración

- [ ] **T12.10** Migrar `y-tu-que-compras`:
  - sustituir `link:storybook-svelte` por la dependencia publicada;
  - `betterAuth` → `betterAuthHandle` (o la API nueva de [05](05-auth.md));
  - `routes` con URLs-función → claves de ruta;
  - `@source` de `app.css` al path correcto;
  - crear su `auth-client` con la factoría, sin `session` de módulo;
  - corregir "NavNar Title".
- [ ] **T12.11** Rama de validación en `donde-esta-tu-local` que importe la librería en paralelo
      y compare (Fase B).
- [ ] **T12.12** Migración incremental de `donde-esta-tu-local`, un componente por PR, con sus
      tests existentes como red de seguridad.
- [x] **T12.13** Guía de migración en `docs/migracion.md` con el mapeo símbolo a símbolo
      (viejo → nuevo) para ambos consumidores.

## Criterios de aceptación

- `y-tu-que-compras` compila, arranca y hace login usando la librería publicada.
- `donde-esta-tu-local` tiene al menos 5 de sus 8 componentes sustituidos por los de la
  librería, con sus tests y E2E en verde.
- Ninguno de los dos consumidores mantiene una copia local de un componente que la librería ya
  ofrece.

## Estado (2026-09-02)

Hecha la **fase A** (promover el código bueno) y la guía de migración. Las fases B, C y D
**no** se hacen aquí: tocan otros dos repos git, y esta tanda se limitó deliberadamente a
`storybook-svelte`.

**Promovido y generalizado** (T12.1-T12.7): los ocho componentes se rehicieron tomando como base
la versión de `donde-esta-tu-local`, más cinco que la librería no tenía (`Dock`, `DockLink`,
`Footer`, `ButtonSignOut`, `UserNotLogged`). El detalle de qué se promovió y qué se dejó en el
producto está en el estado de [07](07-componentes-api.md); el modelo de rutas, en
[06](06-routing-navegacion.md); los schemas zod v4 con `.meta()`, en [09](09-forms-schemas.md).

**T12.6 resuelto partiendo `FormLogin` en dos**, no por configuración: `FormLoginMagicLink` (en
el barrel) y `FormLoginOtp` (en el subpath `./otp`, porque necesita `bits-ui`). Los dos flujos
son legítimos y ninguno paga el peso del otro.

**Un bug del código de referencia, encontrado al promocionarlo:** su `FormLogin` llama a la API
de auth desde `onSubmit`, que en superforms 2.27 corre **antes** de la validación de cliente, así
que envía el email sin validar. La versión de la librería usa `SPA: true` + `onUpdate`. Conviene
arreglarlo también en `donde-esta-tu-local` cuando se migre.

**T12.8 — matriz de compatibilidad.** El plan recomendaba fijar el objetivo en el stack de
`donde-esta-tu-local` y subir al rezagado. Se ha hecho a medias, a propósito: los rangos de
`peerDependencies` se dejan **permisivos por abajo** para cubrir también a `y-tu-que-compras`
(svelte `^5.36`, kit `^2.27`, better-auth `^1.3.4`, superforms `^2.27.1`, zod
`^3.25 || ^4` importando siempre de `zod/v4`, tailwind `^4.1`, daisyui `^5`, `@lucide/svelte`
`^0.488 || ^1`, `bits-ui` `^2.19` opcional), mientras las `devDependencies` del monorepo se
quedan en vite 7 / vitest 3 / storybook 9.1. **Subir el toolchain a vite 8 / vitest 4 es una
tanda aparte**: mezclarlo con este refactor habría hecho imposible saber qué rompió qué. La
matriz está documentada en el README.

**Pendiente, en otros repos:**

- **T12.9 / T12.10** — migrar `y-tu-que-compras`. Es el más fácil (apenas tiene código propio) y
  el que valida la instalación desde registro. Hoy está **roto** contra este repo: importa
  `betterAuth` de un paquete llamado `storybook-svelte` que ya no existe.
- **T12.11 / T12.12** — rama de validación y migración incremental de `donde-esta-tu-local`.
- El mapeo símbolo a símbolo para ambos ya está escrito en `docs/migracion.md` (T12.13).
