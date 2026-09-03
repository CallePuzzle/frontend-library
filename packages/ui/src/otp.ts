/**
 * Entrypoint aparte (`@callepuzzle/svelte-ui/otp`) para el login por OTP.
 *
 * Vive fuera del barrel principal porque necesita `bits-ui` (el `PinInput`), que es un peer
 * **opcional**: así un consumidor que use magic link no tiene que instalarlo.
 */
export { default as FormLoginOtp } from './components/FormLoginOtp.svelte';
export {
	defaultFormLoginOtpStrings,
	type FormLoginOtpStrings
} from './components/FormLoginOtp.strings.js';
