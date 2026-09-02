# A1 — Catálogo de defectos encontrados

Lista plana de todo lo detectado, con fichero y línea, por severidad. Cada entrada enlaza al
plan que la aborda.

## Bloqueantes / bugs reales

| # | Fichero | Problema | Plan |
|---|---|---|---|
| B1 | `packages/library/src/better-auth/client.ts:14` | `export const session = useSession()` en scope de módulo → **store de sesión compartido entre requests SSR** | [05](05-auth.md) |
| B2 | `packages/sveltekit-ui/src/schemas/utils.ts:2` | Importa `zod-to-json-schema`, **no declarado** en `package.json` → el paquete publicado no importa | [09](09-forms-schemas.md) |
| B3 | `packages/library/src/better-auth/server.ts:32` | `{...defaultOptions, ...additionalOptions}` → pasar `plugins` **borra silenciosamente** magicLink/organization/admin | [05](05-auth.md) |
| B4 | `packages/library/src/better-auth/server.ts:11-22` | `sendMagicLink` solo hace `console.log` del token: en producción **nadie puede entrar** y los tokens acaban en los logs | [05](05-auth.md) |
| B5 | `packages/sveltekit-ui/src/components/Modal.svelte:21-23` | `modal` se asigna en `onMount` vía `getElementById` y no es `$state` → `showModal()` antes del mount lanza `TypeError` | [07](07-componentes-api.md) |
| B6 | `packages/sveltekit-ui/src/schemas/utils.ts:22` | `jsonSchema.required.includes(key)` sin guarda; `required` es `undefined` en schemas sin campos obligatorios (lo documenta su propio test) | [09](09-forms-schemas.md) |
| B7 | `packages/library/project.inlang/settings.json` | `locales: ["en","de"]` pero los mensajes son `en`+`es` → **el español no se compila** y `de` no existe | [04](04-i18n.md) |
| B8 | `packages/sveltekit-ui/src/components/*` | El locale de la app **no llega** a los textos de la librería: runtimes de Paraglide independientes | [04](04-i18n.md) |
| B9 | `packages/library/src/routes.ts:26,32,38` | `m.routes_home()` en scope de módulo → locale congelado en el primer import, para todo el proceso | [04](04-i18n.md) |
| B10 | `packages/sveltekit-ui/src/components/Link.svelte`, `NavBarEnd.svelte` | `route.url as string` con `url` que puede ser función → renderiza el **código de la función** como `href` (y `y-tu-que-compras` usa URLs-función) | [06](06-routing-navegacion.md) |
| B11 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte` | Asume `routes.notifications` y `routes.profile`; si el consumidor no las define → crash en runtime | [06](06-routing-navegacion.md) |
| B12 | `y-tu-que-compras/src/hooks.server.ts` | Importa `betterAuth` de `storybook-svelte`: nombre de paquete y símbolo **inexistentes** hoy | [12](12-convergencia-consumidores.md) |
| B13 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte:65-83` | `<button>` conteniendo `role="button"` y `<button>` → HTML inválido y teclado roto | [07](07-componentes-api.md) |
| B14 | `packages/sveltekit-ui/src/components/Header.svelte:33,39,65` | `id="my-drawer-3"` hardcodeado → dos `Header` en la página se pisan | [07](07-componentes-api.md) |
| B15 | `packages/sveltekit-ui/src/components/NavBarList.svelte` | El filtro de rutas es un `const` de módulo, **no `$derived`** → el menú no reacciona | [06](06-routing-navegacion.md) |
| B16 | `packages/sveltekit-ui/src/stories/NavBarEnd.stories.svelte` | Las 8 stories pasan `userIsLogged` (que es `$derived`, no prop) y omiten las props obligatorias | [10](10-storybook-testing.md) |
| B17 | `demos/sveltekit/src/routes/+layout.ts` | `prerender = true` en un layout con sesión y `+layout.server.ts` | [10](10-storybook-testing.md) |
| B18 | `packages/library/package.json` | No declara `files` → publicaría `src/`, `messages/`, `project.inlang/`, `tsup.config.ts` | [01](01-estrategia-distribucion.md) |
| B19 | `packages/*/package.json` | `"@repo/library": "workspace:*"` publicado tal cual es irresoluble fuera del monorepo | [01](01-estrategia-distribucion.md) |
| B20 | `packages/sveltekit-ui/.gitignore` | Ignora `src/lib/paraglide` pero el build genera en `src/paraglide` → el código generado entraría en el repo | [04](04-i18n.md) |

## Tipado y API

| # | Fichero | Problema | Plan |
|---|---|---|---|
| T1 | `packages/library/src/better-auth/client.ts:10` | `createAuthClient(…) as any` → `AuthClient` y `Session` son `any` en toda la API pública | [05](05-auth.md) |
| T2 | `packages/sveltekit-ui/src/components/FormFields.svelte`, `FormString.svelte` | `SuperForm<any, any>`, `SuperFormData<any>` | [07](07-componentes-api.md) |
| T3 | `packages/{library,sveltekit-ui,…}/src/app.d.ts` | `Session` y `User` **sin importar** → tipos sin resolver; y una librería no debe augmentar `App.Locals` | [03](03-arquitectura-paquetes.md) |
| T4 | `packages/sveltekit-ui/src/utils.ts` | `Locale = "en" \| "es"` hardcodeado en la librería | [04](04-i18n.md) |
| T5 | `packages/sveltekit-ui/package.json` | `exports` solo con condición `"svelte"`, sin `"import"`/`"default"` | [03](03-arquitectura-paquetes.md) |
| T6 | `packages/library/src/better-auth/index.ts` | Reexporta cliente **y** servidor desde el mismo entrypoint | [03](03-arquitectura-paquetes.md) |
| T7 | `packages/library/src/routes.ts:45` | `GetMenuRoutes` no exportada, PascalCase, parámetro `authClient` sin usar | [06](06-routing-navegacion.md) |
| T8 | `packages/library/src/routes.ts` | `isProtected` (obligatorio) y `permissions` no se leen en ningún sitio | [06](06-routing-navegacion.md) |
| T9 | `packages/sveltekit-ui/src/components/FormFields.svelte` | `(field.format as string)`, `(field.description as string)` — casts redundantes sobre tipos ya correctos | [07](07-componentes-api.md) |
| T10 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte:5,8` | `Modal` importado dos veces del mismo fichero (una como "tipo") | [07](07-componentes-api.md) |
| T11 | Todos los componentes | Ninguno acepta `class` ni reenvía atributos HTML | [07](07-componentes-api.md) |
| T12 | `packages/sveltekit-ui/src/schemas/login.ts` | `LoginSchema = typeof loginSchema` (schema) vs `z.infer<>` (datos) en el consumidor | [09](09-forms-schemas.md) |

## Dependencias

| # | Paquete | Problema | Plan |
|---|---|---|---|
| D1 | `sveltekit-ui` | `zod-to-json-schema` usado y no declarado (= B2) | [09](09-forms-schemas.md) |
| D2 | `library` | `@inlang/paraglide-js` **duplicado** en `dependencies` y `devDependencies` | [03](03-arquitectura-paquetes.md) |
| D3 | `sveltekit-ui` | `nodemailer` declarado y **nunca usado** | [03](03-arquitectura-paquetes.md) |
| D4 | `library` | `nodemailer` solo para `sender.ts`, que **nadie exporta** (código muerto) | [05](05-auth.md) |
| D5 | `sveltekit-ui` | `zod`, `sveltekit-superforms`, `formsnap` como `dependencies` en vez de peer → dobles instancias | [09](09-forms-schemas.md) |
| D6 | `sveltekit-ui` | `tailwindcss` y `daisyui` solo en dev, pero son **requisitos de runtime** de los componentes | [08](08-estilos-theming.md) |
| D7 | `sveltekit-ui` | `@sveltejs/adapter-auto` en un paquete de librería (no hace falta para `svelte-package`) | [03](03-arquitectura-paquetes.md) |
| D8 | monorepo | 6 versiones distintas de TypeScript (5.5.4, 5.8.2, 5.8.3, ^5.0.0, ^5.9.2) | [11](11-tooling-ci-calidad.md) |
| D9 | `database` | `eslint@^8` conviviendo con `eslint@^9` del resto | [11](11-tooling-ci-calidad.md) |

## Calidad de código

| # | Fichero | Problema | Plan |
|---|---|---|---|
| C1 | `packages/sveltekit-ui/src/components/FormLogin.svelte:41` | `console.log(result)` en el flujo de login | [07](07-componentes-api.md) |
| C2 | `packages/library/src/better-auth/server.ts:12` | `console.log(request)` vuelca el `Request` completo | [05](05-auth.md) |
| C3 | `packages/sveltekit-ui/src/components/FormLogin.svelte:54` | `"An unexpected error occurred…"` hardcodeado en inglés entre `m.*()` | [07](07-componentes-api.md) |
| C4 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte:109` | `Sign Out` hardcodeado en inglés | [07](07-componentes-api.md) |
| C5 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte:93` | Avatar hardcodeado a una foto de stock de `img.daisyui.com`, con `alt` de la documentación | [07](07-componentes-api.md) |
| C6 | `packages/sveltekit-ui/src/components/NavBarEnd.svelte:39` | `setTimeout(…, 2000)` mágico sin cancelar en `onDestroy` | [07](07-componentes-api.md) |
| C7 | `packages/sveltekit-ui/src/components/FormLogin.svelte` | `SuperDebug` importado estáticamente aunque solo se use con `debug` → viaja al bundle de producción | [07](07-componentes-api.md) |
| C8 | `packages/sveltekit-ui/src/schemas/utils.ts:29` | `placeholder: name` — el nombre del campo como placeholder | [09](09-forms-schemas.md) |
| C9 | `packages/sveltekit-ui/messages/es.json` | `"Iniciar sessión"` (doble s) | [04](04-i18n.md) |
| C10 | `demos/sveltekit`, `y-tu-que-compras` | `"NavNar Title"` (typo, propagado por copia) | [13](13-documentacion.md) |
| C11 | `packages/sveltekit-ui/src/stories/FromLogin.stories.svelte` | Fichero mal nombrado (`From` en vez de `Form`) | [10](10-storybook-testing.md) |
| C12 | `README.md` | `bun run stoybook` (typo) | [13](13-documentacion.md) |
| C13 | `packages/sveltekit-ui/src/components/*` | Mezcla de tabuladores y 2 espacios; **no hay `.prettierrc`** en el repo | [11](11-tooling-ci-calidad.md) |
| C14 | `packages/database/src/client.ts` | `url: "http://127.0.0.1:8080"` hardcodeado, sin variable de entorno | [02](02-alcance-monorepo.md) |
| C15 | `packages/database/prisma/schema.prisma` | `url = "file:../../../dev.db"` hardcodeado | [02](02-alcance-monorepo.md) |
| C16 | `demos/sveltekit/src/routes/+layout.server.ts` | Solo hace `console.log(event.locals)` y devuelve `{}` | [10](10-storybook-testing.md) |
| C17 | `demos/sveltekit/src/routes/admin/+page.svelte` | Fichero **vacío**, pero la ruta está en el menú | [10](10-storybook-testing.md) |

## Tests y CI

| # | Qué | Plan |
|---|---|---|
| X1 | `src/tests/demo.spec.ts` prueba `1+2===3` | [10](10-storybook-testing.md) |
| X2 | `src/tests/zodToJsonSchema.test.ts` prueba **la librería de terceros**, no el código propio | [10](10-storybook-testing.md) |
| X3 | Cero tests de componente (`*.svelte.test.ts` no existe, aunque `vite.config.ts` los incluye) | [10](10-storybook-testing.md) |
| X4 | `vitest.workspace.ts` (deprecado) coexiste con `test.projects` en `vite.config.ts` | [10](10-storybook-testing.md) |
| X5 | `"test": "vitest"` sin `--run` → cuelga en CI | [10](10-storybook-testing.md) |
| X6 | `a11y: { test: "todo" }` → las violaciones no fallan nunca | [10](10-storybook-testing.md) |
| X7 | **No hay CI de ningún tipo** | [11](11-tooling-ci-calidad.md) |
| X8 | `packages/library` tiene script `lint` pero **ningún fichero de config de ESLint** | [11](11-tooling-ci-calidad.md) |
| X9 | `demos/sveltekit` declara `@repo/eslint-config` pero no tiene script `lint` ni config | [11](11-tooling-ci-calidad.md) |
| X10 | `turbo run check-types` solo lo implementa `react-ui` (que se borra) | [11](11-tooling-ci-calidad.md) |
| X11 | `turbo.json` no declara `src/paraglide/**` como output de `build` → caché puede servir builds sin mensajes | [11](11-tooling-ci-calidad.md) |
| X12 | `publint` solo en el `prepack` de un paquete, no en ninguna task de turbo | [01](01-estrategia-distribucion.md) |

## Código y paquetes muertos

| # | Qué | Plan |
|---|---|---|
| M1 | `packages/react-ui/` — plantilla `create-turbo` + stories por defecto, cero código propio, cero consumidores | [02](02-alcance-monorepo.md) |
| M2 | `demos/astro/` — plantilla `create astro` intacta, no importa nada de la librería | [02](02-alcance-monorepo.md) |
| M3 | `packages/database/` — Prisma/Turso en una librería de front; además depende del demo (`better-auth:generate --config ../../demos/…`) | [02](02-alcance-monorepo.md) |
| M4 | `packages/eslint-config/next.js` + `react-internal.js` — configs de Next/React | [02](02-alcance-monorepo.md) |
| M5 | `packages/tailwind-config/postcss.config.js` — export **nombrado** que PostCSS no entiende, y que nadie importa | [08](08-estilos-theming.md) |
| M6 | `packages/library/src/better-auth/sender.ts` — no reexportado, uso comentado | [05](05-auth.md) |
| M7 | `packages/library/src/routes.ts:45` — `GetMenuRoutes` no exportada | [06](06-routing-navegacion.md) |
| M8 | `packages/library/tsconfig.json` — `include: ["next-env.d.ts", …]` en un paquete SvelteKit | [11](11-tooling-ci-calidad.md) |
| M9 | `packages/sveltekit-ui` script `preview: vite preview` — sin sentido en una librería | [03](03-arquitectura-paquetes.md) |
| M10 | `packages/react-ui/src/stories/assets/` — ~15 imágenes de la plantilla de Storybook | [02](02-alcance-monorepo.md) |
