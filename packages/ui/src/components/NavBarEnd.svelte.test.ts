import { userEvent } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NavBarEnd from './NavBarEnd.svelte';
import type { SessionUser } from '../types.js';

const login = createRawSnippet(() => ({
	render: () => '<button type="button">Entrar</button>'
}));

const withImage: SessionUser = {
	id: 'usr_1',
	name: 'Ada Lovelace',
	email: 'ada@example.com',
	image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
};

const withoutImage: SessionUser = { id: 'usr_2', name: 'Grace Hopper' };

/** Primer elemento que resuelve el locator, sin lanzar si no hay ninguno. */
function firstOf(locator: { elements(): Element[] }): HTMLElement | null {
	return (locator.elements()[0] as HTMLElement | undefined) ?? null;
}

describe('NavBarEnd', () => {
	it('sin usuario renderiza el snippet login y ningún menú de usuario', async () => {
		const { container } = await render(NavBarEnd, { user: null, login });

		// El snippet login es el único botón: sin usuario no hay avatar ni menú.
		const buttons = [...container.querySelectorAll('button')];
		expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Entrar']);
	});

	it('sin usuario y sin snippet login no renderiza nada dentro', async () => {
		const { container } = await render(NavBarEnd, { user: null });

		expect(container.querySelector('.navbar-end')?.children.length).toBe(0);
	});

	it('con usuario sin imagen pinta la inicial del nombre', async () => {
		const { getByRole } = await render(NavBarEnd, { user: withoutImage });

		// El nombre accesible lo pone el `aria-label`; el texto visible es la inicial.
		expect(firstOf(getByRole('button', { name: 'User menu' }))?.textContent?.trim()).toBe('G');
	});

	it('cae al email cuando no hay nombre', async () => {
		const { getByRole } = await render(NavBarEnd, { user: { id: 'x', email: 'zoe@example.com' } });

		expect(firstOf(getByRole('button', { name: 'User menu' }))?.textContent?.trim()).toBe('Z');
	});

	it('con usuario e imagen pinta el <img> con su texto alternativo', async () => {
		const { getByRole } = await render(NavBarEnd, { user: withImage });

		const img = firstOf(getByRole('img', { name: "Ada Lovelace's avatar" }));
		expect(img?.getAttribute('src')).toBe(withImage.image);
		// La URL del avatar puede ser de un tercero: no se le filtra la página en la que está.
		expect(img?.getAttribute('referrerpolicy')).toBe('no-referrer');
	});

	it('el selector de idioma necesita dos idiomas y setLocale', async () => {
		const sinSetLocale = await render(NavBarEnd, { user: withoutImage, locales: ['es', 'en'] });
		expect(sinSetLocale.getByRole('button', { name: 'Language' }).elements()).toHaveLength(0);

		const chosen: string[] = [];
		const { getByRole } = await render(NavBarEnd, {
			user: withoutImage,
			locales: ['es', 'en'],
			setLocale: (locale: string) => chosen.push(locale)
		});

		// La apertura es estado explícito (click del disparador), no foco: WebKit no da foco
		// a un `<button>` al pulsarlo, y por foco en un iPhone el menú no abría nunca.
		const toggle = getByRole('button', { name: 'Language' });
		await toggle.click();
		expect(firstOf(toggle)?.getAttribute('aria-expanded')).toBe('true');

		// El idioma activo es una entrada de tipo radio del menú.
		await getByRole('menuitemradio', { name: 'en', exact: true }).click();
		expect(chosen).toEqual(['en']);

		// Elegir cierra el menú y `aria-expanded` lo refleja.
		expect(getByRole('menu').elements()).toHaveLength(0);
		expect(firstOf(toggle)?.getAttribute('aria-expanded')).toBe('false');
	});

	it('el selector de idioma marca el idioma activo con aria-checked', async () => {
		const { getByRole } = await render(NavBarEnd, {
			user: withoutImage,
			locales: ['es', 'en'],
			activeLocale: 'es',
			setLocale: () => {}
		});

		await getByRole('button', { name: 'Language' }).click();

		expect(
			firstOf(getByRole('menuitemradio', { name: 'es', exact: true }))?.getAttribute('aria-checked')
		).toBe('true');
		expect(
			firstOf(getByRole('menuitemradio', { name: 'en', exact: true }))?.getAttribute('aria-checked')
		).toBe('false');
	});

	it('el menú de usuario abre por teclado, con roles de menú, y Escape lo cierra', async () => {
		const { getByRole } = await render(NavBarEnd, {
			user: withoutImage,
			authClient: { signOut: async () => {} },
			profileHref: '/settings'
		});

		const toggle = getByRole('button', { name: 'User menu' });
		firstOf(toggle)?.focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(firstOf(toggle)?.getAttribute('aria-expanded')).toBe('true');

		const items = getByRole('menuitem').elements();
		expect(items.map((item) => item.textContent?.trim())).toEqual(['Profile', 'Sign out']);
		// El foco queda en el primer item, no en el disparador.
		expect(document.activeElement).toBe(items[0]);
		// Los `<li role="none">` cuelgan del `menu` sin ruido de accesibilidad.
		const listItems = firstOf(getByRole('menu'))?.querySelectorAll('li');
		expect(listItems?.length).toBe(2);
		expect([...(listItems ?? [])].every((li) => li.getAttribute('role') === 'none')).toBe(true);

		await userEvent.keyboard('{Escape}');
		expect(getByRole('menu').elements()).toHaveLength(0);
		expect(document.activeElement).toBe(firstOf(toggle));
	});

	it('la notificación sólo se pinta con usuario y userHasNotification', async () => {
		const { container } = await render(NavBarEnd, {
			user: withoutImage,
			notificationsHref: '/notifications',
			userHasNotification: true
		});

		// El badge es decorativo, sin rol accesible: única comprobación por clase de daisyUI.
		expect(container.querySelector('.indicator-item')).not.toBeNull();
	});

	it('Sign out cierra sesión con el authClient recibido', async () => {
		const signOuts: number[] = [];
		const { getByRole } = await render(NavBarEnd, {
			user: withoutImage,
			authClient: {
				signOut: async () => {
					signOuts.push(1);
				}
			}
		});

		// El menú de usuario hay que abrirlo: sin él sus entradas ni están en el DOM.
		await getByRole('button', { name: 'User menu' }).click();
		await getByRole('menuitem', { name: 'Sign out' }).click();
		await expect.poll(() => signOuts.length).toBe(1);
	});
});
