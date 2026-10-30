import { commonStrings } from '../strings/common.js';

export type DrawerStrings = {
	/**
	 * Etiqueta accesible del checkbox que abre el panel (el cajón cerrado).
	 *
	 * daisyUI implementa el cajón con un checkbox oculto cuyo control visible es un `<label>`
	 * de la app. Ese label puede estar oculto según el ancho de pantalla (el del `Header` es
	 * `lg:hidden`), y entonces el checkbox se queda sin nombre accesible: axe lo detecta como
	 * *"Form element has explicit `<label>` that is hidden"*. Con este `aria-label` el control
	 * tiene nombre propio, dependa o no de un label visible.
	 */
	openSidebar: string;
	/** Etiqueta accesible del checkbox con el cajón abierto (acción: cerrar). */
	closeSidebar: string;
};

export const defaultDrawerStrings: DrawerStrings = {
	openSidebar: commonStrings.openSidebar,
	closeSidebar: commonStrings.closeSidebar
};
