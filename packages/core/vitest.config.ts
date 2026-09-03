import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.ts'],
			// Los barrels y los propios tests no son lógica que cubrir.
			exclude: ['src/index.ts', 'src/**/*.{test,spec}.ts'],
			// Umbral inicial deliberadamente bajo: la idea es subirlo, no que nadie lo baje.
			thresholds: { lines: 50, statements: 50, functions: 50, branches: 50 }
		}
	}
});
