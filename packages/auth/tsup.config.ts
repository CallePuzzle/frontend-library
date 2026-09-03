import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	const isWatch = options.watch;

	return {
		entry: ['src/client.ts', 'src/server.ts', 'src/hooks.ts'],
		format: ['esm'],
		dts: isWatch
			? false
			: {
					compilerOptions: {
						skipLibCheck: true,
						declaration: true,
						emitDeclarationOnly: false
					},
					exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
				},
		clean: true,
		outDir: 'dist',
		splitting: false,
		sourcemap: true,
		external: ['@sveltejs/kit', 'better-auth'],
		ignoreWatch: ['dist/**']
	};
});
