# @callepuzzle/typescript-config

Paquete interno (`private: true`): no se publica. Solo contiene los `tsconfig` base del monorepo.

## `base.json`

Para los paquetes que compilan con **tsup** (`@callepuzzle/core`, `@callepuzzle/auth`).
Resolución `NodeNext`, `strict`, `noUncheckedIndexedAccess` y `verbatimModuleSyntax`. El paquete
que lo extiende solo tiene que añadir `outDir`, `include` y `exclude`:

```json
{
	"extends": "@callepuzzle/typescript-config/base.json",
	"include": ["**/*.ts", "tsup.config.ts"],
	"exclude": ["node_modules", "dist"],
	"compilerOptions": { "outDir": "./dist" }
}
```

## `svelte.json`

Para los paquetes y apps **SvelteKit** (`@callepuzzle/svelte-ui`, `demos/sveltekit`).

A propósito **no** declara `module`, `moduleResolution`, `target`, `lib`, `include` ni `exclude`:
esos los genera `svelte-kit sync` en `./.svelte-kit/tsconfig.json` (con `moduleResolution:
"bundler"`, los `paths` de `$app/*` y los `rootDirs`). El consumidor los compone con un `extends`
en array —TypeScript ≥5.0—, dejando este fichero **el último** para que sus flags de estrictez
ganen sin pisar la resolución de módulos:

```json
{
	"extends": ["./.svelte-kit/tsconfig.json", "@callepuzzle/typescript-config/svelte.json"]
}
```
