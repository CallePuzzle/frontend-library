import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	const isWatch = options.watch;

	return {
		// Dos entrypoints: `.` (rutas, sin deps de runtime) y `./schema` (necesita zod).
		entry: ['src/index.ts', 'src/schema/index.ts'],
		format: ['esm'],
		dts: isWatch
			? false
			: {
					resolve: true,
					compilerOptions: {
						skipLibCheck: true,
						declaration: true,
						emitDeclarationOnly: false
					}
				},
		clean: true,
		outDir: 'dist',
		splitting: false,
		sourcemap: true,
		ignoreWatch: ['dist/**']
	};
});
