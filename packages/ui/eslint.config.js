import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

/**
 * ESLint solo se mantiene en este paquete, y solo por lo que `oxlint` no sabe hacer:
 * las reglas de `eslint-plugin-svelte` (plantilla, a11y, `no-at-html-tags`,
 * `valid-compile`) y las de `eslint-plugin-storybook`. Las reglas genéricas de JS/TS las
 * cubre `oxlint` con el `.oxlintrc.json` del root, que corre sobre todo el monorepo.
 */
export default ts.config(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['storybook-static/**', '.svelte-kit/**', 'dist/**'] },
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	...storybook.configs['flat/recommended'],
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint recomienda no usar `no-undef` en proyectos TypeScript:
			// https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule
			'no-undef': 'off',
			// Duplicada por `oxlint` (typescript/no-unused-vars), que ya corre sobre este paquete.
			'@typescript-eslint/no-unused-vars': 'off',
			'no-unused-vars': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
