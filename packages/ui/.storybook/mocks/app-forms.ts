/**
 * Mock de `$app/forms`, otro módulo virtual que necesita `sveltekit-superforms`
 * (`applyAction`, `deserialize` y, sobre todo, `enhance`).
 *
 * `enhance` se reimplementa en lo esencial —interceptar el `submit`, construir el `FormData`
 * y entregar el `submitParams` que espera quien lo envuelve— porque es lo que hace funcionar
 * el `use:enhance` de superforms. Los formularios de la librería van en modo `SPA: true`, y
 * ahí superforms **siempre** llama a `cancel()` antes de tocar la red: la validación es de
 * cliente y no hay petición que hacer. Si alguna vez llega un envío sin cancelar, se avisa en
 * consola en vez de intentar hablar con un servidor que en Storybook no existe.
 */

/** Lo que `enhance` pasa al callback de envío. */
export type SubmitFunctionArgs = {
	action: URL;
	cancel: () => void;
	controller: AbortController;
	data: FormData;
	formData: FormData;
	formElement: HTMLFormElement;
	submitter: HTMLElement | null;
};

export type SubmitFunction = (args: SubmitFunctionArgs) => unknown;

export function enhance(
	formElement: HTMLFormElement,
	submit: SubmitFunction = () => {}
): { destroy: () => void } {
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const submitter = event.submitter as HTMLElement | null;
		const formAction = submitter?.getAttribute('formaction') ?? formElement.action;
		const action = new URL(formAction || window.location.href, window.location.href);
		const data = new FormData(formElement);
		const controller = new AbortController();

		let cancelled = false;
		const cancel = () => {
			cancelled = true;
		};

		await submit({
			action,
			cancel,
			controller,
			data,
			formData: data,
			formElement,
			submitter
		});

		if (cancelled) return;

		console.warn(
			'[mock $app/forms] envío no cancelado: en Storybook no hay servidor al que enviar el ' +
				'formulario. Los componentes de la librería usan `SPA: true`, que siempre cancela.'
		);
	}

	formElement.addEventListener('submit', handleSubmit);

	return {
		destroy() {
			formElement.removeEventListener('submit', handleSubmit);
		}
	};
}

export function applyAction(): Promise<void> {
	return Promise.resolve();
}

export function deserialize(result: string): unknown {
	return JSON.parse(result);
}
