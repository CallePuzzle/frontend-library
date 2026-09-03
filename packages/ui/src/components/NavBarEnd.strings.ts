import { commonStrings } from '../strings/common.js';

export type NavBarEndStrings = {
	/** Etiqueta accesible del botón de búsqueda. */
	search: string;
	/** Etiqueta accesible del enlace de notificaciones. */
	notifications: string;
	/** Etiqueta accesible del selector de idioma. */
	language: string;
	/** Etiqueta accesible del botón que abre el menú de usuario. */
	userMenu: string;
	/** Entrada "Perfil" del menú de usuario. */
	profile: string;
	/** Entrada "Cerrar sesión" del menú de usuario. */
	signOut: string;
	/** Texto alternativo de la imagen de avatar. Recibe el nombre visible del usuario. */
	avatarAlt: (name: string) => string;
};

export const defaultNavBarEndStrings: NavBarEndStrings = {
	search: commonStrings.search,
	notifications: commonStrings.notifications,
	language: commonStrings.language,
	userMenu: 'User menu',
	profile: commonStrings.profile,
	signOut: commonStrings.signOut,
	avatarAlt: commonStrings.avatarAlt
};
