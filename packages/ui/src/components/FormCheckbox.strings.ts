import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormCheckbox`. */
export type FormCheckboxStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormCheckboxStrings: FormCheckboxStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
