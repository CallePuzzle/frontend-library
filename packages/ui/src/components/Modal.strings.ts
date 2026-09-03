import { commonStrings } from '../strings/common.js';

export type ModalStrings = {
	/** Etiqueta del botón que cierra el diálogo (tipos `button` y `outside`). */
	close: string;
};

export const defaultModalStrings: ModalStrings = {
	close: commonStrings.close
};
