# 06 — Rutas y navegación tipadas

**Prioridad: alta.** El modelo actual obliga a castear en cada uso y ya está superado por
`donde-esta-tu-local`.

## Contexto

`packages/library/src/routes.ts` define el modelo de rutas que consumen `Header`, `NavBarList`,
`NavBarEnd` y `Link`, y que los dos consumidores extienden con spread.

## Hallazgos

### H6.1 — `url` puede ser una función, y nadie lo maneja

```ts
type URL<T extends string = string> = T | ((id: string, ...params: string[]) => T);
type Route = { name: string; url: URL; isProtected: boolean; showInMenu: boolean; permissions?: Permissions };
```

Como `url` puede ser función, todos los consumos castean:
- `packages/sveltekit-ui/src/components/Link.svelte`: `href={route.url as string}`
- `packages/sveltekit-ui/src/components/NavBarEnd.svelte`: `href={routes.notifications.url as string}`

Si alguien registra una ruta con `url: (id) => \`/home/${id}\`` — y `y-tu-que-compras` lo hace,
tres veces, en `src/lib/routes.ts` — y esa ruta acaba en un menú, el `href` renderizado es el
**código fuente de la función**. El cast oculta el fallo en vez de prevenirlo.

### H6.2 — `isProtected` y `permissions` no se leen en ningún sitio

`grep -rn "isProtected"` en `packages/`: solo la definición del tipo y los literales. Ningún
componente ni handle lo usa. `permissions?: Permissions` tampoco. Son campos que obligan al
consumidor a rellenarlos (`isProtected` es **obligatorio**) sin dar nada a cambio, y sugieren
una protección que no existe.

`donde-esta-tu-local` ya llegó a esta conclusión y lo eliminó — su `src/lib/routes.ts` lleva el
comentario: *"La protección real vive en los +layout.server.ts (ver B20); `isProtected` no se
llegó a leer en ningún sitio y se quita."*

### H6.3 — `GetMenuRoutes` está muerto, mal nombrado y con un parámetro sin usar

```ts
function GetMenuRoutes(routes: Routes, authClient: AuthClient): Route[] {
  return Object.values(routes).filter((route) => route.showInMenu);
}
```
- No se exporta (`export { routes, type Routes, type Route }` no lo incluye).
- `authClient` no se usa.
- PascalCase para una función.
- Y `NavBarList.svelte` **reimplementa el mismo filtro a mano**:
  ```ts
  const routesArray: Route[] = Object.values(routes).filter((route) => route.showInMenu === true);
  ```
  …además en scope de módulo del componente, es decir **no reactivo**: si `routes` cambia, el
  menú no se actualiza. Debería ser `$derived`.

### H6.4 — Las claves del objeto se pierden

`Routes` es `{ [id: string]: Route }` y `Route` no tiene `id`. `NavBarList` itera con
`Object.values()`, así que la clave (`home`, `profile`, `admin_index`…) se descarta y el
`{#each}` se keyea por `route.url` — que puede ser una función (H6.1) y por tanto no es una key
estable.

`donde-esta-tu-local` lo resolvió elegantemente: la **clave es el `RouteId` de SvelteKit** y
`getMenuRoutes` la reinyecta con `Object.entries()`:
```ts
type Routes = Partial<Record<RouteId, RouteConfig>>;
function getMenuRoutes(routes, isMobile = false): Route[] {
  return Object.entries(routes)
    .filter(([, r]) => (isMobile && r?.showInMobile) || r?.showInMenu)
    .map(([id, r]) => ({ id: id as RouteIdWithoutParams, ...r! }));
}
```

### H6.5 — No se usa `resolve()` de SvelteKit

`Link.svelte` de la librería: `<a href={route.url as string}>`.
`Link.svelte` de `donde-esta-tu-local`: `<a href={resolve(href)}>` con
`href: Route['id']` tipado contra `$app/types`.

`resolve()` valida la ruta en tiempo de compilación y aplica `base`. Sin él, un despliegue bajo
subpath rompe todos los enlaces del menú, y un typo en una URL no se detecta.

### H6.6 — `routes` con i18n en scope de módulo

Ya recogido en [04](04-i18n.md), H4.3: `name: m.routes_home()` congela el locale al importar.
Este documento y el 04 se resuelven con el **mismo** cambio: quitar `name` del dato y dejar que
el consumidor lo resuelva en render.

### H6.7 — Rutas de producto en una librería

`routes` exporta `home: '/'`, `profile: '/user/profile'`, `notifications: '/user/notifications'`.
Ninguno de los dos consumidores usa esas URLs: `donde-esta-tu-local` tiene `/profile` (no
`/user/profile`) y no tiene `/user/notifications`; `y-tu-que-compras` tampoco. La librería está
imponiendo un mapa de URLs que nadie respeta, y `NavBarEnd` lo asume duro:
`routes.notifications.url` y `routes.profile` — si el consumidor no define esas claves exactas,
**crash en runtime** (`Cannot read properties of undefined`).

## Propuesta

Mover el modelo a `@callepuzzle/core` y rediseñarlo:

```ts
// @callepuzzle/core
import type { Component } from 'svelte';

export type RouteConfig = {
  /** Etiqueta ya resuelta por el consumidor (i18n en render, no en módulo). */
  label: string;
  short?: string;
  icon?: Component;
  showInMenu?: boolean;
  showInMobile?: boolean;
};

/** La clave es el id de ruta de la app; el consumidor la tipa con su RouteId. */
export type RouteMap<Id extends string = string> = Partial<Record<Id, RouteConfig>>;

export type Route<Id extends string = string> = RouteConfig & { id: Id };

export function getMenuRoutes<Id extends string>(
  routes: RouteMap<Id>,
  opts: { mobile?: boolean } = {}
): Route<Id>[] { … }
```

Puntos clave:
1. **No hay `url`**: la clave *es* la ruta. Adiós al cast y a las funciones-URL.
   Las rutas con parámetros no van al menú; se enlazan a mano con `resolve('/gang/[slug]', {…})`.
2. **No hay `routes` por defecto** exportado por la librería. Se exporta el *tipo* y el
   *helper*; el mapa concreto es de la app. Elimina H6.7.
3. **`label` en vez de `name`**, y es responsabilidad del consumidor pasarlo ya traducido.
4. `isProtected` y `permissions` **fuera**.
5. Los componentes que necesiten una ruta concreta (perfil, notificaciones) la reciben como
   prop opcional (`profileHref`, `notificationsHref`), no la buscan en el mapa.

### Genéricos y `RouteId`

La librería no puede importar `$app/types` (es del proyecto del consumidor). Con `RouteMap<Id>`
genérico, la app hace:
```ts
import type { RouteId } from '$app/types';
import type { RouteMap } from '@callepuzzle/core';
export const routes: RouteMap<RouteId> = { '/': { label: m.routes_home(), … } };
```
y obtiene el tipado fuerte de `donde-esta-tu-local` sin que la librería sepa nada de sus rutas.

## Tareas

- [ ] **T6.1** Crear el modelo nuevo en `packages/core/src/routes.ts` según la propuesta.
- [ ] **T6.2** Eliminar `url`, `isProtected`, `permissions` y el `routes` por defecto.
- [ ] **T6.3** Exportar `getMenuRoutes` (camelCase, sin el parámetro `authClient` muerto).
- [ ] **T6.4** `NavBarList.svelte`: usar `getMenuRoutes` en un `$derived` (hoy es un `const` no
  reactivo) y keyear el `{#each}` por `route.id`.
- [ ] **T6.5** `Link.svelte`: aceptar `href` tipado y usar `resolve()` de `$app/paths`. Añadir
  soporte de `id` (lo necesita `donde-esta-tu-local` para su tour guiado).
- [ ] **T6.6** `NavBarEnd.svelte`: sustituir `routes.notifications.url` y `routes.profile` por
  props `notificationsHref` / `profileHref` opcionales; ocultar el bloque si no se pasan.
- [ ] **T6.7** Añadir `icon?: Component` y `short?: string` al modelo (ambos ya usados por
  `donde-esta-tu-local`, ninguno soportado por la librería) y renderizar el icono en
  `NavBarList`.
- [ ] **T6.8** Añadir `showInMobile` y el modo `mobile` de `getMenuRoutes` (para un futuro
  componente `Dock`, que `donde-esta-tu-local` ya tiene).
- [ ] **T6.9** Tests unitarios de `getMenuRoutes` (filtrado desktop/mobile, preservación de la
  clave como `id`, mapa vacío).
- [ ] **T6.10** Actualizar el demo y documentar la migración para los consumidores.

## Criterios de aceptación

- Cero `as string` en los componentes de navegación.
- `NavBarList` reacciona a un cambio de `routes` en runtime.
- La librería no exporta ninguna URL concreta de producto.
- Un consumidor puede tipar su `RouteMap` con su propio `RouteId` y obtener autocompletado.
