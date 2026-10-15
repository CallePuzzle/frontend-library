import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Modal from './Modal.svelte';

/** `mount()` devuelve los `export function` del componente; el tipo de `render` no los expone. */
type ModalExports = { showModal: () => void; close: () => void };

function body(text = 'Contenido del diálogo') {
	return createRawSnippet(() => ({ render: () => `<p>${text}</p>` }));
}

function dialogOf(container: HTMLElement): HTMLDialogElement {
	const dialog = container.querySelector('dialog');
	if (!dialog) throw new Error('el Modal no ha renderizado ningún <dialog>');
	return dialog;
}

describe('Modal', () => {
	it('abre con showModal() y cierra con close()', async () => {
		const { container, component } = await render(Modal, { title: 'Abrir', children: body() });
		const modal = component as unknown as ModalExports;
		const dialog = dialogOf(container);

		expect(dialog.open).toBe(false);

		modal.showModal();
		expect(dialog.open).toBe(true);

		modal.close();
		expect(dialog.open).toBe(false);
	});

	it('abre con el botón por defecto', async () => {
		const { container, getByRole } = await render(Modal, { title: 'Abrir', children: body() });

		await getByRole('button', { name: 'Abrir' }).click();

		expect(dialogOf(container).open).toBe(true);
	});

	it('no pinta el botón por defecto con showButton={false}', async () => {
		const { container } = await render(Modal, {
			title: 'Abrir',
			showButton: false,
			children: body()
		});

		// El disparador es el único hermano del `<dialog>`: sin él, no hay ningún botón fuera.
		expect(container.querySelector(':scope > button')).toBeNull();
	});

	it('type="outside" cierra pulsando el backdrop', async () => {
		const { container, component } = await render(Modal, {
			title: 'Abrir',
			type: 'outside',
			children: body()
		});
		(component as unknown as ModalExports).showModal();

		const backdrop = container.querySelector<HTMLFormElement>('form.modal-backdrop');
		expect(backdrop).not.toBeNull();

		backdrop?.querySelector('button')?.click();
		// El cierre de un `<form method="dialog">` no es sincrónico en todos los navegadores.
		await new Promise((done) => requestAnimationFrame(done));
		expect(dialogOf(container).open).toBe(false);
	});

	it('type="button" cierra con el botón del pie', async () => {
		const { container, component } = await render(Modal, {
			title: 'Abrir',
			type: 'button',
			children: body()
		});
		(component as unknown as ModalExports).showModal();

		const closeButton = container.querySelector<HTMLButtonElement>('.modal-action button');
		expect(closeButton?.textContent?.trim()).toBe('Close');

		closeButton?.click();
		await new Promise((done) => requestAnimationFrame(done));
		expect(dialogOf(container).open).toBe(false);
	});

	it('type="X" pinta la cruz con un nombre accesible y sin backdrop', async () => {
		const { container } = await render(Modal, { title: 'Abrir', type: 'X', children: body() });

		expect(container.querySelector('form.modal-backdrop')).toBeNull();
		expect(container.querySelector('.modal-box .sr-only')?.textContent).toBe('Close');
	});

	it('no explota si se llama a showModal() antes del mount (B5)', async () => {
		// El `trigger` se renderiza **antes** del `<dialog>`: llamar a `showModal()` desde su
		// cuerpo reproduce el bug B5, cuando la referencia se buscaba por id en `onMount`.
		const trigger = createRawSnippet<[{ showModal: () => void }]>((args) => ({
			render: () => {
				args().showModal();
				return '<button type="button">abrir</button>';
			}
		}));

		const { container } = await render(Modal, { children: body(), trigger });

		// Lo importante es que no ha lanzado; y el diálogo sigue cerrado, no a medias.
		expect(dialogOf(container).open).toBe(false);
	});

	it('usa los textos inyectados por strings', async () => {
		const { container } = await render(Modal, {
			title: 'Abrir',
			type: 'button',
			strings: { close: 'Cerrar' },
			children: body()
		});

		expect(container.querySelector('.modal-action button')?.textContent?.trim()).toBe('Cerrar');
	});
});
