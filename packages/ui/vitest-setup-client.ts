import '@testing-library/jest-dom/vitest';

/**
 * Setup del proyecto `component`.
 *
 * Los tests corren en un **navegador real** (vitest browser mode + playwright), no en jsdom:
 * aquí no hace falta ningún mock de `matchMedia` ni de APIs del DOM. Lo único que se añade son
 * los matchers de `jest-dom`, para los asertos que no van por `expect.element()`.
 */
