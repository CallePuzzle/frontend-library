import { expect, test } from '@playwright/test';

test('la portada carga sin sesión y con los textos de la librería en inglés', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Components of @callepuzzle/svelte-ui'
	);
	await expect(page.getByTestId('session-state')).toContainText('No session');
});

test('el modal de login monta el formulario de la librería', async ({ page }) => {
	await page.goto('/');

	// El primero es el del `NavBarEnd` (snippet `login`); el segundo, el de `UserNotLogged`.
	await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	// El placeholder sale del schema que inyecta la app (`createLoginSchema`).
	await expect(dialog.getByPlaceholder('you@example.com')).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('cambiar de idioma cambia también los textos de la librería', async ({ page }) => {
	await page.goto('/');

	// Tres textos que pinta @callepuzzle/svelte-ui, no la app: la etiqueta accesible del
	// selector de idioma (`NavBarEnd`), el aviso de campo obligatorio (`FormFields`) y la
	// etiqueta de una entrada del mapa de rutas (`NavBarList` / `Dock`).
	await expect(page.getByRole('button', { name: 'Language' })).toBeVisible();
	// Acotado a `main`: el modal de login, que está cerrado, renderiza los mismos textos.
	await expect(page.locator('main').getByText('Required').first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Language' }).click();
	await page.getByRole('button', { name: 'es', exact: true }).click();

	// Ésta es la regresión del bug de i18n: antes la librería compilaba sus propios mensajes y
	// el idioma que fijaba la app no llegaba a sus textos.
	await expect(page.getByRole('button', { name: 'Idioma' })).toBeVisible();
	await expect(page.locator('main').getByText('Obligatorio').first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Inicio' }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Language' })).toHaveCount(0);
});

test('la ruta protegida no filtra datos sin sesión', async ({ page }) => {
	await page.goto('/admin');

	// `+page.server.ts` no devuelve el dato protegido si no hay `locals.user`.
	await expect(page.getByTestId('admin-secret')).toHaveCount(0);
	await expect(page.getByText('You need to sign in to see this content.')).toBeVisible();
});

test('completar el login de extremo a extremo', async () => {
	test.skip(
		true,
		'Necesita una base de datos en marcha (`turso dev --db-file dev.db`) y el servidor en ' +
			'modo desarrollo, porque el envío del magic link del demo es una traza por consola ' +
			'que lanza fuera de desarrollo a propósito. Ver src/lib/server/auth.ts.'
	);
});
