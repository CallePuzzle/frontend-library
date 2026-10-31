---
'@callepuzzle/svelte-ui': minor
---

Close the drawer on client-side navigation (#32): the daisyUI checkbox pattern survives SvelteKit client-side navigation — the `Drawer` lives in the app layout, which does not re-mount, so the hidden checkbox arrived still checked and the panel showed up open on the destination page (CallePuzzle/y-tu-que-compras#144 and #145). The `Drawer` now closes itself when a navigation completes, including re-selecting the current entry (the router treats it as a full `link` navigation), with a `closeOnNavigate` prop (`true` by default) to opt out. It also accepts `bind:open`, so apps can open or close the panel through state — e.g. before starting a guided tour — instead of simulating native clicks on the hidden checkbox. Every close goes through component state, which keeps the checkbox and its `aria-label` in sync.
