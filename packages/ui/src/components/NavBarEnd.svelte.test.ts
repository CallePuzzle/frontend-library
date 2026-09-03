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

describe('NavBarEnd', () => {
	it('sin usuario renderiza el snippet login y ningún menú de usuario', () => {
		const { container } = render(NavBarEnd, { user: null, login });

		expect(container.querySelector('button')?.textContent).toBe('Entrar');
		expect(container.querySelector('[aria-label="User menu"]')).toBeNull();
	});

	it('sin usuario y sin snippet login no renderiza nada dentro', () => {
		const { container } = render(NavBarEnd, { user: null });

		expect(container.querySelector('.navbar-end')?.children.length).toBe(0);
	});

	it('con usuario sin imagen pinta la inicial del nombre', () => {
		const { container } = render(NavBarEnd, { user: withoutImage });

		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('.avatar div div')?.textContent?.trim()).toBe('G');
	});

	it('con usuario e imagen pinta el <img> con su texto alternativo', () => {
		const { container } = render(NavBarEnd, { user: withImage });
		const img = container.querySelector('img');

		expect(img?.getAttribute('src')).toBe(withImage.image);
		expect(img?.getAttribute('alt')).toBe("Ada Lovelace's avatar");
	});

	it('cae al email cuando no hay nombre', () => {
		const { container } = render(NavBarEnd, { user: { id: 'x', email: 'zoe@example.com' } });

		expect(container.querySelector('.avatar div div')?.textContent?.trim()).toBe('Z');
	});

	it('el selector de idioma necesita dos idiomas y setLocale', () => {
		const { container: sinSetLocale } = render(NavBarEnd, {
			user: withoutImage,
			locales: ['es', 'en']
		});
		expect(sinSetLocale.querySelector('[aria-label="Language"]')).toBeNull();

		const chosen: string[] = [];
		const { container } = render(NavBarEnd, {
			user: withoutImage,
			locales: ['es', 'en'],
			setLocale: (locale: string) => chosen.push(locale)
		});

		const toggle = container.querySelector<HTMLButtonElement>('[aria-label="Language"]');
		expect(toggle).not.toBeNull();

		container.querySelectorAll<HTMLButtonElement>('.dropdown-content button')[1]?.click();
		expect(chosen).toEqual(['en']);
	});

	it('la notificación sólo se pinta con usuario y userHasNotification', () => {
		const { container } = render(NavBarEnd, {
			user: withoutImage,
			notificationsHref: '/notifications',
			userHasNotification: true
		});

		expect(container.querySelector('.indicator-item')).not.toBeNull();
	});
});
