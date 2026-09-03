import { commonStrings } from '../strings/common.js';

/** Textos visibles de `FormTextarea`. */
export type FormTextareaStrings = {
	/** Aviso bajo un campo obligatorio. */
	required: string;
	/** Aviso bajo un campo opcional. */
	optional: string;
};

export const defaultFormTextareaStrings: FormTextareaStrings = {
	required: commonStrings.required,
	optional: commonStrings.optional
};
