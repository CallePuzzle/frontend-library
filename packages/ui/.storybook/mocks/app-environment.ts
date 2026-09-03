/**
 * Mock de `$app/environment` para Storybook y para los tests de componente.
 *
 * Mismo motivo que el resto de los mocks de `$app/*`: módulo virtual de SvelteKit que no
 * existe cuando el paquete se compila como librería.
 */

export const browser = true;
export const dev = true;
export const building = false;
export const version = 'storybook';
