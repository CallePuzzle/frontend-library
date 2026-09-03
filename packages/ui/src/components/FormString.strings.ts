import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormString`. */
export type FormStringStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormStringStrings: FormStringStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
