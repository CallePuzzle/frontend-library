export type DockStrings = {
	/**
	 * Etiqueta accesible del `<nav>` inferior. No reutiliza `commonStrings.menu` a propósito:
	 * si el `Header` y el `Dock` conviven en la misma página, dos landmarks `navigation` con el
	 * mismo nombre incumplen `landmark-unique`.
	 */
	navLabel: string;
};

export const defaultDockStrings: DockStrings = {
	navLabel: 'Bottom navigation'
};
