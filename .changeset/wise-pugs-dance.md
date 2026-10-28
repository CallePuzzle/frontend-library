---
'@callepuzzle/core': patch
'@callepuzzle/svelte-ui': patch
---

Bump `zod` devDependency to `^4.6.7` (GHSA-mrhx-c7xc-m3w5): unbounded memory accumulation when validating large arrays. No runtime change — the published peer range already allows zod 4.
