import type {
	DockStrings,
	DrawerStrings,
	FormFieldsStrings,
	FormLoginMagicLinkStrings,
	HeaderStrings,
	ModalStrings,
	NavBarEndStrings,
	UserNotLoggedStrings
} from '@callepuzzle/svelte-ui';
import type { FormLoginOtpStrings } from '@callepuzzle/svelte-ui/otp';
import type { LoginSchemaStrings } from '@callepuzzle/core/schema';
import { m } from './paraglide/messages.js';

/**
 * Todos los textos visibles de la librería, agrupados por componente.
 *
 * Los tipos `*Strings` de `@callepuzzle/svelte-ui` hacen de checklist: si la librería añade una
 * cadena nueva, este objeto deja de compilar y hay que decidir su traducción, en vez de que
 * aparezca un texto en inglés en medio de la app.
 */
export type UiStrings = {
	header: HeaderStrings;
	drawer: DrawerStrings;
	dock: DockStrings;
	navBarEnd: NavBarEndStrings;
	modal: ModalStrings;
	formFields: FormFieldsStrings;
	formLoginMagicLink: FormLoginMagicLinkStrings;
	formLoginOtp: FormLoginOtpStrings;
	userNotLogged: UserNotLoggedStrings;
	loginSchema: LoginSchemaStrings;
};

/**
 * Resuelve los textos de la librería con el Paraglide de la app.
 *
 * Es una **función**, no una constante de módulo: los `m.*()` leen el idioma del request en
 * curso. Resolverlos al importar el módulo congelaría en el servidor el idioma de la primera
 * petición. Los consumidores la llaman dentro de un `$derived` (ver `+layout.svelte`).
 */
export function getUiStrings(): UiStrings {
	return {
		header: {
			back: m.ui_back(),
			openSidebar: m.ui_open_sidebar(),
			navLabel: m.ui_main_nav()
		},
		drawer: {
			closeSidebar: m.ui_close_sidebar(),
			openSidebar: m.ui_open_sidebar()
		},
		dock: {
			navLabel: m.ui_bottom_nav()
		},
		navBarEnd: {
			search: m.ui_search(),
			notifications: m.ui_notifications(),
			language: m.ui_language(),
			userMenu: m.ui_user_menu(),
			profile: m.ui_profile(),
			signOut: m.ui_sign_out(),
			avatarAlt: (name: string) => m.ui_avatar_alt({ name })
		},
		modal: {
			close: m.ui_close()
		},
		formFields: {
			required: m.ui_field_required(),
			optional: m.ui_field_optional()
		},
		formLoginMagicLink: {
			required: m.ui_field_required(),
			optional: m.ui_field_optional(),
			signIn: m.ui_sign_in(),
			magicLinkSent: m.ui_magic_link_sent(),
			rateLimited: m.ui_rate_limited(),
			error: m.ui_auth_error()
		},
		formLoginOtp: {
			required: m.ui_field_required(),
			optional: m.ui_field_optional(),
			signIn: m.ui_otp_request(),
			stepEmail: m.ui_otp_step_email(),
			stepOtp: m.ui_otp_step_code(),
			otpLabel: m.ui_otp_label(),
			otpDescription: m.ui_otp_description(),
			success: m.ui_otp_success(),
			rateLimited: m.ui_rate_limited(),
			invalidCode: m.ui_otp_invalid_code(),
			error: m.ui_auth_error(),
			startOver: m.ui_otp_start_over()
		},
		userNotLogged: {
			text: m.ui_user_not_logged()
		},
		loginSchema: {
			emailError: m.ui_login_email_error(),
			emailPlaceholder: m.ui_login_email_placeholder(),
			emailDescription: m.ui_login_email_description()
		}
	};
}
