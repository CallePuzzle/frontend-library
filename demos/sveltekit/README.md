# Demo de `@callepuzzle/svelte-ui`

App SvelteKit que consume la librería **como lo haría un proyecto externo**: por sus paquetes
publicados (`@callepuzzle/core`, `@callepuzzle/auth`, `@callepuzzle/svelte-ui`), sin importar
nada por ruta relativa a `packages/`. Es a la vez la documentación ejecutable de la librería y
la prueba de que la integración funciona.

## Qué demuestra, y dónde mirarlo

| Tema                                                                           | Fichero                                |
| ------------------------------------------------------------------------------ | -------------------------------------- |
| Mapa de rutas con la clave como ruta, tipado con `RouteId`, resuelto en render | `src/lib/routes.ts`                    |
| Cliente de auth por factoría, instanciado una sola vez                         | `src/lib/auth-client.ts`               |
| Instancia de servidor con los presets de magic link y OTP                      | `src/lib/server/auth.ts`               |
| Augmentación de `App.Locals` con los tipos reales de better-auth               | `src/app.d.ts`                         |
| Sesión SSR: una por request, de `locals` al layout                             | `src/routes/+layout.server.ts`         |
| Composición del layout (`Drawer` + `Header` + `NavBarEnd` + `Dock` + `Footer`) | `src/routes/+layout.svelte`            |
| Inyección de los `strings` de la librería con el Paraglide de la app           | `src/lib/ui-strings.ts`                |
| Login en un `Modal` propio, cerrado por la app                                 | `src/lib/components/LoginModal.svelte` |
| Ejemplos de componentes (`Link`, `Modal`, `FormFields`, `UserNotLogged`)       | `src/routes/+page.svelte`              |
| Contenido protegido de verdad (en el servidor, no con un flag de menú)         | `src/routes/admin/+page.server.ts`     |
| Estilos tal cual los pegaría un consumidor                                     | `src/app.css`                          |

## Poner en marcha

```bash
cp .env.example .env
turso dev --db-file dev.db   # base de datos local, en otra terminal
bun run db:push
bun run dev
```

El demo **no tiene servidor de correo**. El envío del magic link y del OTP es una traza por la
consola del servidor, con un nombre que lo dice (`devSendMagicLink`) y que **lanza fuera de
desarrollo** a propósito: ver `src/lib/server/auth.ts`. Un consumidor sustituye ese cuerpo por
su mailer.

## Comprobaciones

```bash
bun run check      # svelte-check, con Paraglide compilado antes
bun run build
bun run test:e2e   # Playwright: portada, modal de login y cambio de idioma
```

El E2E arranca el build de producción con `vite preview` y **no necesita base de datos**: sin
cookie de sesión, better-auth resuelve `null` sin tocarla. El caso que sí la necesita (completar
un login) está marcado como `skip` con su motivo, no dado por bueno.
