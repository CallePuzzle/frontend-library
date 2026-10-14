export * from './components/index.js';

export { cn } from './utils.js';
export { commonStrings, type CommonStrings } from './strings/common.js';

/**
 * Defaults de textos por app (contexto de Svelte): la alternativa a repetir la prop `strings`
 * en cada punto de uso. Prop `strings` > contexto > default en inglés.
 */
export {
	getUiStrings,
	setUiStrings,
	type UiStrings,
	type UiStringsMap
} from './strings/context.js';

export type {
	AuthCallError,
	AuthCallResult,
	EmailOtpClient,
	MagicLinkClient,
	SessionUser,
	SignOutClient
} from './types.js';

/**
 * Diccionarios de textos de cada componente, con sus defaults en inglés.
 *
 * Los tipos hacen de checklist: al añadir una clave, el consumidor ve en su `tsc` que hay copy
 * nuevo que decidir. Los `default*` sirven para partir de la librería y sobreescribir solo lo
 * que interese (`strings={{ ...defaultModalStrings, close: m.common_close() }}`).
 */
export {
	defaultButtonSignOutStrings,
	type ButtonSignOutStrings
} from './components/ButtonSignOut.strings.js';
export { defaultDockStrings, type DockStrings } from './components/Dock.strings.js';
export { defaultDrawerStrings, type DrawerStrings } from './components/Drawer.strings.js';
export {
	defaultFormCheckboxStrings,
	type FormCheckboxStrings
} from './components/FormCheckbox.strings.js';
export {
	defaultFormFieldsStrings,
	type FormFieldsStrings
} from './components/FormFields.strings.js';
export {
	defaultFormLoginMagicLinkStrings,
	type FormLoginMagicLinkStrings
} from './components/FormLoginMagicLink.strings.js';
export {
	defaultFormNumberStrings,
	type FormNumberStrings
} from './components/FormNumber.strings.js';
export {
	defaultFormSelectStrings,
	type FormSelectStrings
} from './components/FormSelect.strings.js';
export {
	defaultFormStringStrings,
	type FormStringStrings
} from './components/FormString.strings.js';
export {
	defaultFormTextareaStrings,
	type FormTextareaStrings
} from './components/FormTextarea.strings.js';
export { defaultHeaderStrings, type HeaderStrings } from './components/Header.strings.js';
export { defaultModalStrings, type ModalStrings } from './components/Modal.strings.js';
export { defaultNavBarEndStrings, type NavBarEndStrings } from './components/NavBarEnd.strings.js';
export {
	defaultUserNotLoggedStrings,
	type UserNotLoggedStrings
} from './components/UserNotLogged.strings.js';
