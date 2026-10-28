---
'@callepuzzle/svelte-ui': minor
---

Los desplegables de `NavBarEnd` (selector de idioma y menú de usuario) dejan de abrir por
`:focus-within` y usan el patrón «menu button» de WAI-ARIA: WebKit (Safari/iOS) no da foco a un
`<button>` al pulsarlo, así que en un iPhone el menú podía no abrir o cerrarse en cuanto
aparecía. Ahora la apertura es estado explícito (daisyUI lo pinta con `dropdown-open`), la lista
sólo se renderiza abierta, `aria-expanded` refleja el estado real y los roles son de menú
(`menu`/`none`/`menuitem`, y `menuitemradio` + `aria-checked` en el selector de idioma, que
recibe la prop nueva `activeLocale` para marcar el idioma en curso). Hay navegación por teclado
(Enter/Espacio/↓/↑ abren, ↑/↓/Inicio/Fin mueven, Escape cierra devolviendo el foco) y cierre al
pulsar fuera, al salir con Tab y al elegir una entrada. Las entradas del snippet `menuExtra`
deben seguir ese marcado (`<li role="none">` con `role="menuitem"`); el snippet sigue siendo un
`Snippet` sin argumentos y elegir cualquiera cierra el menú.

Se publica también el componente genérico `DropdownMenu`, para que las apps no dupliquen el
patrón: apertura por estado, roles, teclado y cierre por click fuera/Tab/Escapes, con los
snippets `trigger` e `items` (éste recibe `close`) y la opción `closeOnSelect` para cerrar al
activar cualquier item.
