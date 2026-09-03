# 07 — API de componentes y accesibilidad

**Prioridad: alta.** Es el producto en sí.

## Inventario

`packages/sveltekit-ui/src/components/` — 8 componentes, todos exportados por
`src/components/index.ts` → `src/index.ts`:

| Componente   | Estado                                                              |
| ------------ | ------------------------------------------------------------------- |
| `Header`     | Acoplado a un layout concreto; ids duplicables                      |
| `NavBarList` | No reactivo (ver [06](06-routing-navegacion.md))                    |
| `NavBarEnd`  | El peor: a11y rota, avatar hardcodeado, texto sin i18n, asume rutas |
| `Link`       | Trivial, pero castea y no usa `resolve()`                           |
| `Modal`      | Bug de referencia al DOM; API incompleta                            |
| `FormLogin`  | Magic link; ya obsoleto frente al consumidor                        |
| `FormFields` | Sin genéricos, `any` en los tipos                                   |
| `FormString` | Sin genéricos, `any` en los tipos                                   |

## Hallazgos por componente

### `Modal.svelte`

**H7.1 — Referencia al DOM por `getElementById` en `onMount`.**

```ts
let modal: HTMLDialogElement;
onMount(() => {
	modal = document.getElementById('modal-' + uid) as HTMLDialogElement;
});
```

Antipatrón en Svelte 5: hay `bind:this`. Además `modal` no es `$state`, así que la asignación en
`onMount` **no es reactiva**. Y `showModal()` está declarada _antes_ de que `onMount` corra: si
algo la llama en el primer tick (o en SSR), `modal` es `undefined` → `TypeError`.

`donde-esta-tu-local` ya lo arregló: `let modal: HTMLDialogElement | undefined = $state();` +
`<dialog bind:this={modal}>` + optional chaining `modal?.showModal()`.

**H7.2 — `showModal` no se exporta.** Solo `close`. Un consumidor no puede abrir el modal
programáticamente (p. ej. desde un botón "Inicia sesión" en otra parte de la página).
`donde-esta-tu-local` lo necesita y lo exporta, y además guarda la instancia en un store
(`loginModal.svelte.ts`) precisamente porque la librería no se lo permitía.

**H7.3 — El botón disparador es obligatorio y no configurable.**
La librería siempre renderiza `<button class="btn">{title}</button>`. El consumidor añadió
`showButton`, `buttonClass`, `buttonCloseClass`, `boxClass` para poder usarlo sin botón o con
otro estilo.

**H7.4 — Falta `type="button"`.** El `<button>` disparador no lleva `type`, así que dentro de un
`<form>` es `type="submit"` y envía el formulario en vez de abrir el modal.

### `NavBarEnd.svelte`

**H7.5 — Elementos interactivos anidados (a11y, HTML inválido).**
Líneas 65-83:

```svelte
<button class="btn btn-ghost btn-circle">
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-circle"><Globe /></div>
    <ul tabindex="0" class="menu …">
      <li><button onclick={() => setLocale(locale)}>…</button></li>
```

Un `<button>` conteniendo otro `role="button"` y `<button>`s. HTML inválido, navegación por
teclado rota, y lectores de pantalla confundidos. El `<button>` exterior no hace nada — sobra.

**H7.6 — Avatar hardcodeado a una imagen de stock de daisyUI.**

```svelte
<img
	alt="Tailwind CSS Navbar component"
	src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
/>
```

Toda app que use la librería muestra la misma foto de stock, cargada desde un CDN de terceros.
El `alt` es el de la documentación de daisyUI, no describe nada.
`donde-esta-tu-local` lo resolvió con `user.image` + fallback a la inicial del nombre
(`memberInitial`) — que es lo que debería estar aquí.

**H7.7 — Texto sin i18n.** `Sign Out` está hardcodeado en inglés (línea 109), mientras el resto
del componente usa `m.*()`.

**H7.8 — Doble import del mismo módulo.**

```ts
import Modal from './Modal.svelte';
import ModalType from './Modal.svelte'; // ← el mismo fichero, solo para usarlo como tipo
let modal = $state<ModalType | null>(null);
```

Debería ser `import type { Modal as ModalType }`… o simplemente
`$state<ReturnType<typeof Modal> | null>`. Tal como está, es un import de valor duplicado.

**H7.9 — `afterCancelCallback` con un `setTimeout(2000)` mágico.**

```ts
async function afterCancelCallback() {
	await new Promise((resolve) => setTimeout(resolve, 2000));
	modal?.close();
}
```

Dos segundos arbitrarios, no configurables, y sin cancelar el timer si el componente se
desmonta.

**H7.10 — Asume claves de `routes`.** `routes.notifications.url`, `routes.profile`. Ver
[06](06-routing-navegacion.md), H6.7.

### `Header.svelte`

**H7.11 — `id="my-drawer-3"` hardcodeado** (líneas 33, 39, 65). Es el id de ejemplo de la
documentación de daisyUI. Dos `<Header>` en la misma página (o un `Header` más cualquier otro
drawer del consumidor con ese id) rompen el `<label for>`. Debe derivarse de `$props.id()`, como
ya hace `Modal`.

**H7.12 — El drawer no es opcional.** El `Header` impone la estructura completa
`drawer > drawer-content > navbar` y renderiza `{@render children()}` **dentro** del
drawer-content. Eso obliga a que toda la app viva dentro del Header. `donde-esta-tu-local`
descartó ese diseño: su `Header` es solo la navbar, y el layout lo pone la app.

**H7.13 — `title: string` en vez de `Snippet`.** No se puede pasar un logo. El consumidor ya
lo cambió a `title: Snippet`.

**H7.14 — Propaga props de `NavBarEnd` por intersección de tipos**
(`& NavBarEndProps`) y las redeclara todas a mano. Añadir una prop a `NavBarEnd` obliga a tocar
`Header`. Alternativa: una sola prop `navEnd` con el objeto, o un snippet.

### `FormFields.svelte` / `FormString.svelte`

**H7.15 — `any` en la API pública.**

```ts
form: SuperForm<any, any>;
formData: SuperFormData<any>;
```

`donde-esta-tu-local` ya lo migró a genéricos:

```svelte
<script lang="ts" generics="T extends Record<string, unknown>">
  type Props = { form: SuperForm<T, unknown>; formData: SuperFormData<T>; … };
```

y tipa el nombre de campo como `FormPath<T>` con un comentario explicando por qué hace falta el
cast en ese punto concreto. Es estrictamente mejor.

**H7.16 — `type="hidden"` no se contempla.** `FormString` de la librería siempre renderiza el
`<fieldset class="fieldset">` visible. El consumidor añadió
`class={type == 'hidden' ? 'fieldset hidden' : 'fieldset'}`.

**H7.17 — Casts redundantes.** `type={(field.format as string) ?? 'text'}` y
`description={(field.description as string) ?? undefined}` en `FormFields`: `Fields` ya tipa
ambos como `string | undefined`. Los casts sobran (y el `as string` sobre un opcional miente).

**H7.18 — Sin `<label>` real.** El texto del campo va en un `<legend>` con `<Description>`
dentro. `formsnap` provee `<Label>`, que es lo que asocia el texto con el input para lectores
de pantalla. Hoy el input solo tiene `placeholder`. Y `form_required`/`form_optional` se
renderizan como `<p class="fieldset-label">` sin relación programática con el input
(falta `aria-describedby`).

### `FormLogin.svelte`

**H7.19 — `console.log(result)`** (línea 41) en el flujo de login, que vuelca la respuesta de
better-auth a la consola del navegador.

**H7.20 — Mensaje de error hardcodeado en inglés** (línea 54):
`"An unexpected error occurred. Please try again."` — el resto usa `m.*()`.

**H7.21 — Error mal formateado.** `result.error.status + ": " + result.error.statusText` muestra
un código HTTP crudo al usuario. `donde-esta-tu-local` distingue el 429 (rate limit) con un
mensaje propio.

**H7.22 — Solo magic link.** El consumidor principal usa **OTP de 6 dígitos** en dos pasos.
Ver [12](12-convergencia-consumidores.md).

**H7.23 — `SuperDebug` siempre en el bundle.** Se importa incondicionalmente y solo se usa si
`debug`. Al ser un import estático, viaja al bundle de producción de todos los consumidores.
Debería ser `await import()` dentro del bloque `{#if debug}`.

**H7.24 — El formulario no se puede reutilizar.** El schema (`loginSchema`) está _dentro_ del
componente. Un consumidor que quiera añadir un campo (aceptar términos, por ejemplo) tiene que
forkear.

### Transversales

**H7.25 — Ninguna prop `class`.** Ningún componente acepta `class` para que el consumidor ajuste
el estilo. Es la primera cosa que se pide de una librería de UI.
`donde-esta-tu-local` lo parcheó a mano en `Modal` (`buttonClass`, `boxClass`, …).

**H7.26 — Ningún componente reenvía atributos HTML** (`...rest`). No se puede poner un `id`, un
`data-testid` ni un `aria-label`.

**H7.27 — Formato inconsistente.** `FormFields.svelte`, `FormString.svelte`, `Modal.svelte` usan
**tabuladores**; `FormLogin.svelte`, `Header.svelte`, `NavBarEnd.svelte`, `NavBarList.svelte`,
`Link.svelte` usan **2 espacios**. No hay `.prettierrc` en `packages/sveltekit-ui` (sí lo hay en
los consumidores). Ver [11](11-tooling-ci-calidad.md).

## Propuesta de API

Principios para el rediseño:

1. **Datos por props, nunca por import.** Ningún componente importa `routes`, `session`,
   `authClient` ni `m`.
2. **Snippets para el contenido, props para el comportamiento.** `title`, `avatar`, `menuExtra`
   como `Snippet`.
3. **`class` + `...rest` en todo componente con raíz DOM.**
4. **Composición sobre configuración.** En vez de un `Header` monolítico con drawer, exportar
   `Navbar`, `NavbarStart`, `NavbarCenter`, `NavbarEnd`, `Drawer` y dejar que la app los
   componga — con un `Header` de conveniencia encima para el caso común.
5. **Cero decisiones de producto**: ni rutas, ni copy, ni avatar por defecto de un CDN externo.

## Tareas

### Bugs (hacer ya, son baratos)

- [x] **T7.1** `Modal`: `bind:this` + `$state` + `?.` en lugar de `getElementById`/`onMount`.
- [x] **T7.2** `Modal`: exportar `showModal()`; añadir `type="button"` al disparador.
- [x] **T7.3** `NavBarEnd`: quitar el `<button>` exterior que envuelve el dropdown de idioma
      (H7.5).
- [x] **T7.4** `NavBarEnd`: quitar la imagen de stock de daisyUI; `avatar` como snippet opcional
      con fallback a inicial.
- [x] **T7.5** `NavBarEnd`: i18n de "Sign Out"; quitar el doble import de `Modal`.
- [x] **T7.6** `FormLogin`: quitar `console.log(result)`; i18n del mensaje de error genérico.
- [x] **T7.7** `Header`: `id` del drawer derivado de `$props.id()`.
- [x] **T7.8** `FormFields`: quitar los casts redundantes.

### API

- [x] **T7.9** Añadir `class?: string` y `...rest` a todos los componentes.
- [x] **T7.10** Migrar `FormFields`/`FormString` a genéricos (`T extends Record<string, unknown>`,
      `FormPath<T>`), copiando el patrón ya validado en `donde-esta-tu-local`.
- [x] **T7.11** `FormString`: soportar `type="hidden"`; usar `<Label>` de formsnap y
      `aria-describedby` para required/optional.
- [x] **T7.12** `Modal`: props `showButton`, `buttonClass`, `buttonCloseClass`, `boxClass`
      (paridad con el consumidor).
- [x] **T7.13** `Header`: `title` como `Snippet`; extraer el drawer a un componente
      `Drawer` opcional; permitir usar `Header` como navbar suelta.
- [x] **T7.14** `FormLogin`: aceptar el `schema` y el `authClient` como props; `SuperDebug` con
      import dinámico.
- [x] **T7.15** Sustituir `session`/`authClient` por `user` (ver [05](05-auth.md)).
- [ ] **T7.16** `afterCancelCallback`: exponer el retardo como prop y limpiar el timer en
      `onDestroy`.

### Componentes que faltan

Extraídos de lo que `donde-esta-tu-local` ya tiene y es genérico:

- [x] **T7.17** `Dock` / `DockLink` — barra inferior móvil.
- [x] **T7.18** `Footer`.
- [x] **T7.19** `ButtonSignOut`.
- [x] **T7.20** `UserNotLogged` (estado vacío para contenido protegido).
- [ ] **T7.21** `FormUser` (edición de perfil) — evaluar si es genérico o específico.

### Calidad

- [x] **T7.22** Unificar el formato de todos los `.svelte` con un `.prettierrc` del paquete.
- [x] **T7.23** Pasar el addon de a11y de Storybook de `"todo"` a `"error"` (ver
      [10](10-storybook-testing.md)) — H7.5 debería haberlo detectado.

## Criterios de aceptación

- `storybook build` con `a11y.test: "error"` pasa en verde para todas las stories.
- Ningún componente importa `routes`, `m`, `authClient` ni `session`.
- Todos aceptan `class` y reenvían atributos.
- `donde-esta-tu-local` puede sustituir sus copias locales por las de la librería sin perder
  funcionalidad (ver [12](12-convergencia-consumidores.md)).

## Estado (2026-09-02)

Implementado. De 8 componentes se pasa a **19**, todos con `class` + reenvío de atributos, todos
con los textos por props y ninguno importando rutas, sesión, cliente de auth ni mensajes.

|                    | Componentes                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Navegación y shell | `Header`, `Drawer`, `NavBarList`, `NavBarEnd`, `Link`, `Dock`, `DockLink`, `Footer`      |
| Auth               | `ButtonSignOut`, `UserNotLogged`, `FormLoginMagicLink`, `FormLoginOtp` (subpath `./otp`) |
| Formularios        | `FormFields`, `FormString`, `FormNumber`, `FormCheckbox`, `FormSelect`, `FormTextarea`   |
| Otros              | `Modal`                                                                                  |

Criterios de aceptación, comprobados: `storybook build` pasa con `a11y.test: 'error'` (y **es la
primera vez que Storybook arranca en este repo**, ver [10](10-storybook-testing.md) H10.0);
ningún componente importa `routes`, `m`, `authClient` ni `session`; los 19 aceptan `class` y
reenvían atributos; `svelte-check` da 0 errores.

**Rediseños que van más allá de lo que pedía el plan:**

- **`Header` deja de propagar las props de `NavBarEnd` por intersección de tipos** (H7.14):
  recibe `navEnd` y `navCenter` como **snippets**. Añadir una prop a `NavBarEnd` ya no obliga a
  tocar `Header`.
- **`NavBarEnd` deja de embutir el formulario de login**: si no hay `user`, renderiza el snippet
  `login`. Esto es lo que de verdad cierra H7.9/C6 y **anula T7.16**: no hay retardo que
  configurar porque ya no hay nada que cerrar; el consumidor pone su `Modal`, se queda la
  referencia y llama a `close()`/`showModal()` cuando quiera. Es también lo que permite que cada
  app elija flujo de login (magic link u OTP) sin forkear.
- **`Drawer` expone su `drawerId` al contenido** (`children: Snippet<[{ drawerId: string }]>`),
  así el consumidor puede poner su propio disparador y `Header` recibe `menuToggleFor`. Con eso
  el id deja de ser `my-drawer-3` (B14) sin inventar una API de coordinación.
- **`Modal` añade `trigger`** además de `showButton`/`buttonClass`/`boxClass`: un snippet que
  recibe `showModal` para control total del disparador.
- **`FormCheckbox` usa binding por función** (getter/setter) porque `T[keyof T]` es `unknown` y
  `bind:checked` exige booleano. Es el único punto donde el patrón del consumidor no compila en
  estricto.
- **`FormFields` mapea `format` de JSON Schema a `type` de input** y trata
  `.meta({ format: 'textarea' })` como textarea; si no, `FormTextarea` no sería alcanzable desde
  un schema.
- **`FormLoginMagicLink` usa `SPA: true` + `onUpdate` en vez de `onSubmit`**: en superforms 2.27
  `onSubmit` corre **antes** de la validación de cliente, así que el patrón del consumidor llama
  a la API con el email sin validar. Es un bug del código de referencia que no estaba en el
  catálogo.

**Sin hacer, con motivo:**

- **T7.16** — anulada por el rediseño de `NavBarEnd` (ver arriba).
- **T7.21 `FormUser`** — se descarta como específico de producto: la edición de perfil depende del
  modelo de usuario de cada app. El camino genérico ya existe: un schema zod + `FormFields`.
- `NotificationToggle` y `ButtonRequest` de `donde-esta-tu-local` tampoco se promocionan, por lo
  mismo (ver [12](12-convergencia-consumidores.md), T12.2).

**Un defecto de a11y más, encontrado al subir el listón:** con el addon en modo `error`, axe
detectó que el checkbox del `Drawer` se queda sin nombre accesible cuando su `<label>` visible
está oculto por ancho de pantalla. Lleva ya su propio `aria-label`
(`DrawerStrings.toggleSidebar`). No estaba en el catálogo porque el componente es nuevo, pero es
el mismo tipo de fallo que H7.5: marcado de daisyUI copiado sin revisar el árbol de
accesibilidad.

**Promocionado del consumidor, pero generalizado:** los stores globales
(`loginModal`, `pwaInstall`) no suben — un singleton de módulo en una librería es el patrón que
este mismo refactor está eliminando —; el tour (`tourDesktopElementIds`) se reduce a la prop `id`
de `Link`/`DockLink`; `member-display` se reduce a `user.name || user.email` y su inicial; y el
contenido del `Footer` (GitHub, `mailto:`, reiniciar tour) se queda en el producto, con `Footer`
como cáscara con `children`.
