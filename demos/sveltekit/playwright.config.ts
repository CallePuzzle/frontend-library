import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E del demo. Arranca el build de producción con `vite preview`.
 *
 * **No necesita base de datos**: sin cookie de sesión, `auth.api.getSession()` devuelve `null`
 * sin tocar la BD, así que la portada, el modal de login y el cambio de idioma se pueden
 * comprobar en seco. Lo que sí necesita BD (completar un login) está marcado como `skip` con
 * su motivo en `e2e/demo.spec.ts`, no dado por bueno.
 */
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// `--host 127.0.0.1`: por defecto `vite preview` escucha en `localhost`, que en esta
		// máquina resuelve a ::1, y Playwright sondea la `url` en IPv4.
		command: `bun run build && bunx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
		env: {
			// `prisma generate` exige la variable aunque el build no toque la BD.
			DATABASE_URL: process.env.DATABASE_URL ?? 'file:../../../dev.db',
			// Sin esto el cliente de libSQL se niega a construirse en modo producción.
			LIBSQL_URL: process.env.LIBSQL_URL ?? 'http://127.0.0.1:8080',
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'e2e-secret-not-for-production'
		}
	}
});
