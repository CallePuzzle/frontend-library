/**
 * Textos compartidos por varios componentes.
 *
 * La librería **no compila i18n** (ver `docs/adr/0003-i18n-por-inyeccion.md`): estos son los
 * defaults en inglés, y cada componente acepta una prop `strings` para sobreescribirlos con el
 * copy —y el idioma— de la app, resuelto en render.
 */
export type CommonStrings = {
	close: string;
	back: string;
	menu: string;
	openSidebar: string;
	closeSidebar: string;
	required: string;
	optional: string;
	signIn: string;
	signOut: string;
	search: string;
	notifications: string;
	language: string;
	profile: string;
	/** Texto alternativo del avatar. Recibe el nombre visible del usuario. */
	avatarAlt: (name: string) => string;
};

export const commonStrings: CommonStrings = {
	close: 'Close',
	back: 'Back',
	menu: 'Menu',
	openSidebar: 'Open sidebar',
	closeSidebar: 'Close sidebar',
	required: 'Required',
	optional: 'Optional',
	signIn: 'Sign in',
	signOut: 'Sign out',
	search: 'Search',
	notifications: 'Notifications',
	language: 'Language',
	profile: 'Profile',
	avatarAlt: (name: string) => `${name}'s avatar`
};
