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
function firstOf(locator: { elements(): Element[] }): Element | null {
	return locator.elements()[0] ?? null;
}

describe('NavBarEnd', () => {
	it('sin usuario renderiza el snippet login y ningún menú de usuario', () => {
		const { container } = render(NavBarEnd, { user: null, login });

		// El snippet login es el único botón: sin usuario no hay avatar ni menú.
		const buttons = [...container.querySelectorAll('button')];
		expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Entrar']);
	});

	it('sin usuario y sin snippet login no renderiza nada dentro', () => {
		const { container } = render(NavBarEnd, { user: null });

		expect(container.querySelector('.navbar-end')?.children.length).toBe(0);
	});

	it('con usuario sin imagen pinta la inicial del nombre', () => {
		const { getByRole } = render(NavBarEnd, { user: withoutImage });

		// El nombre accesible lo pone el `aria-label`; el texto visible es la inicial.
		expect(firstOf(getByRole('button', { name: 'User menu' }))?.textContent?.trim()).toBe('G');
	});

	it('cae al email cuando no hay nombre', () => {
		const { getByRole } = render(NavBarEnd, { user: { id: 'x', email: 'zoe@example.com' } });

		expect(firstOf(getByRole('button', { name: 'User menu' }))?.textContent?.trim()).toBe('Z');
	});

	it('con usuario e imagen pinta el <img> con su texto alternativo', () => {
		const { getByRole } = render(NavBarEnd, { user: withImage });

		const img = firstOf(getByRole('img', { name: "Ada Lovelace's avatar" }));
		expect(img?.getAttribute('src')).toBe(withImage.image);
		// La URL del avatar puede ser de un tercero: no se le filtra la página en la que está.
		expect(img?.getAttribute('referrerpolicy')).toBe('no-referrer');
	});

	it('el selector de idioma necesita dos idiomas y setLocale', async () => {
		const sinSetLocale = render(NavBarEnd, { user: withoutImage, locales: ['es', 'en'] });
		expect(sinSetLocale.getByRole('button', { name: 'Language' }).elements()).toHaveLength(0);

		const chosen: string[] = [];
		const { getByRole } = render(NavBarEnd, {
			user: withoutImage,
			locales: ['es', 'en'],
			setLocale: (locale: string) => chosen.push(locale)
		});

		// El dropdown abre por foco (daisyUI usa `:focus-within`): click en el toggle, y el
		// `aria-expanded` del botón tiene que reflejarlo.
		const toggle = getByRole('button', { name: 'Language' });
		await toggle.click();
		expect(firstOf(toggle)?.getAttribute('aria-expanded')).toBe('true');

		await getByRole('button', { name: 'en', exact: true }).click();
		expect(chosen).toEqual(['en']);
	});

	it('la notificación sólo se pinta con usuario y userHasNotification', () => {
		const { container } = render(NavBarEnd, {
			user: withoutImage,
			notificationsHref: '/notifications',
			userHasNotification: true
		});

		// El badge es decorativo, sin rol accesible: única comprobación por clase de daisyUI.
		expect(container.querySelector('.indicator-item')).not.toBeNull();
	});

	it('Sign out cierra sesión con el authClient recibido', async () => {
		const signOuts: number[] = [];
		const { getByRole } = render(NavBarEnd, {
			user: withoutImage,
			authClient: {
				signOut: async () => {
					signOuts.push(1);
				}
			}
		});

		await getByRole('button', { name: 'Sign out' }).click();
		await expect.poll(() => signOuts.length).toBe(1);
	});
});
