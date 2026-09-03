import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormNumber`. */
export type FormNumberStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormNumberStrings: FormNumberStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
