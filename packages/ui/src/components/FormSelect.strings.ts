import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormSelect`. */
export type FormSelectStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormSelectStrings: FormSelectStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
