---
'@callepuzzle/svelte-ui': minor
---

NavBarList (horizontal): show icons only below the `2xl` breakpoint (#37). Large desktop menus no longer fit laptop widths (1280–1535px): daisyUI's `.navbar-center` never shrinks (`flex-shrink: 0`), so with 9 sections (the trigger: `y-tu-que-compras` adding «Recetas») the last entries ended up under `navbar-end` and could not be clicked. Below `2xl`, each horizontal entry now hides its label visually (`sr-only`, so the accessible name of every link is still the label) and shows the icon alone; from `2xl` up it renders icon + label as before. Entries without an icon keep their label — hiding it would leave an empty anchor. The class travels from `NavBarList` to `Link` as a `max-2xl:` arbitrary variant over the label `span`, so the shared `Link` component is untouched, and the drawer menu keeps icon + label at every width.
