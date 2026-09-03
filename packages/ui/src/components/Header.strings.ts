import { commonStrings } from '../strings/common.js';

export type HeaderStrings = {
	/** Etiqueta accesible del botón "atrás" de móvil. */
	back: string;
	/** Etiqueta accesible del botón hamburguesa. */
	openSidebar: string;
	/** Etiqueta accesible del `<nav>` central. */
	navLabel: string;
};

export const defaultHeaderStrings: HeaderStrings = {
	back: commonStrings.back,
	openSidebar: commonStrings.openSidebar,
	navLabel: commonStrings.menu
};
