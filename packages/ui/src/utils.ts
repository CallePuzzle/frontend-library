import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compone clases de Tailwind resolviendo los conflictos: la última gana.
 *
 * Es lo que permite que la prop `class` de un componente sobreescriba de forma predecible las
 * clases por defecto (`cn('btn btn-accent', props.class)` con `class="btn-primary"` deja
 * `btn btn-primary`, no las dos).
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
