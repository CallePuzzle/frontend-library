---
'@callepuzzle/svelte-ui': patch
---

Fix Lighthouse `aria-prohibited-attr` on the drawer toggles (#29): `aria-label` is prohibited on `<label>` per ARIA in HTML — a label's accessible name must come from its text content. The `Header` hamburger now gets its name from visually hidden text (`sr-only`) instead of `aria-label`, and the `Drawer` close overlay — a pointer-only, non-focusable surface — leaves the accessibility tree with `aria-hidden="true"`. The hidden `drawer-toggle` checkbox keeps its dynamic `aria-label`: it is valid on `<input>`, and daisyUI hides it with `opacity: 0` (not `display: none`), so it stays in the accessibility tree and keyboard-focusable.
