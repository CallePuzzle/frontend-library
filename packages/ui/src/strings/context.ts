import { getContext, setContext } from 'svelte';
import type { ButtonSignOutStrings } from '../components/ButtonSignOut.strings.js';
import type { DockStrings } from '../components/Dock.strings.js';
import type { DrawerStrings } from '../components/Drawer.strings.js';
import type { FormCheckboxStrings } from '../components/FormCheckbox.strings.js';
import type { FormFieldsStrings } from '../components/FormFields.strings.js';
import type { FormLoginMagicLinkStrings } from '../components/FormLoginMagicLink.strings.js';
import type { FormLoginOtpStrings } from '../components/FormLoginOtp.strings.js';
import type { FormNumberStrings } from '../components/FormNumber.strings.js';
import type { FormSelectStrings } from '../components/FormSelect.strings.js';
import type { FormStringStrings } from '../components/FormString.strings.js';
import type { FormTextareaStrings } from '../components/FormTextarea.strings.js';
import type { HeaderStrings } from '../components/Header.strings.js';
import type { ModalStrings } from '../components/Modal.strings.js';
import type { NavBarEndStrings } from '../components/NavBarEnd.strings.js';
import type { UserNotLoggedStrings } from '../components/UserNotLogged.strings.js';

/**
 * Defaults de textos por componente, inyectables **una vez por app**.
 *
 * Es la variante en bloque del patrón de la prop `strings` (ver
 * `docs/adr/0003-i18n-por-inyeccion.md`): la librería sigue sin compilar i18n y los textos
 * siguen entrando desde la app, pero quien traduce todos los componentes no tiene que repetir
 * el diccionario en cada punto de uso. Cada slice es un `Partial` del diccionario del
 * componente, con las mismas claves que su prop `strings`.
 */
export type UiStringsMap = {
	buttonSignOut: Partial<ButtonSignOutStrings>;
	dock: Partial<DockStrings>;
	drawer: Partial<DrawerStrings>;
	formCheckbox: Partial<FormCheckboxStrings>;
	formFields: Partial<FormFieldsStrings>;
	formLoginMagicLink: Partial<FormLoginMagicLinkStrings>;
	formLoginOtp: Partial<FormLoginOtpStrings>;
	formNumber: Partial<FormNumberStrings>;
	formSelect: Partial<FormSelectStrings>;
	formString: Partial<FormStringStrings>;
	formTextarea: Partial<FormTextareaStrings>;
	header: Partial<HeaderStrings>;
	modal: Partial<ModalStrings>;
	navBarEnd: Partial<NavBarEndStrings>;
	userNotLogged: Partial<UserNotLoggedStrings>;
};

/** Lo que pasa la app a {@link setUiStrings}: cada componente es opcional. */
export type UiStrings = Partial<UiStringsMap>;

/**
 * `Symbol.for`, no `Symbol`: el registro global hace que el contexto atraviese copias
 * duplicadas del paquete en el árbol (dos copias de un módulo dan dos `Symbol` distintos, y el
 * proveedor no llegaría a los componentes). El prefijo evita colisiones con contextos de la app.
 */
const KEY = Symbol.for('callepuzzle:ui-strings');

/**
 * Fija los textos por defecto de **todos** los componentes para el árbol actual.
 *
 * Llámalo una vez, en el script del layout raíz (es `setContext`: sólo vale durante la
 * inicialización de un componente). Cada componente resuelve sus textos con la precedencia
 * **prop `strings` > contexto > default en inglés**, así que la prop sigue ganando para
 * puntuales.
 *
 * El objeto se lee al inicializar cada componente: para cambiarlo (p. ej. cambio de idioma),
 * re-instancia el árbol o recarga, no muta el objeto en caliente.
 *
 * ```svelte
 * <!-- src/routes/+layout.svelte -->
 * <script lang="ts">
 * 	import { setUiStrings } from '@callepuzzle/svelte-ui';
 * 	import { m } from '$lib/paraglide/messages.js';
 *
 * 	// En render, nunca en scope de módulo (regla dura de i18n).
 * 	setUiStrings({
 * 		formFields: { required: m.form_required(), optional: m.form_optional() },
 * 		modal: { close: m.common_close() }
 * 	});
 * </script>
 * ```
 */
export function setUiStrings(strings: UiStrings): void {
	setContext(KEY, strings);
}

/** Lee el mapa de textos del {@link setUiStrings} más cercano. Vacío si nadie lo ha fijado. */
export function getUiStrings(): UiStrings {
	return getContext<UiStrings | undefined>(KEY) ?? {};
}
