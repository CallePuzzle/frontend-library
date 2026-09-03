import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormFields`. */
export type FormFieldsStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormFieldsStrings: FormFieldsStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
