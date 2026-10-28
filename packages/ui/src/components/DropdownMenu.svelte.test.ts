import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DropdownMenuHarness from '../tests/DropdownMenuHarness.svelte';

/** El primer elemento que resuelve el locator, sin lanzar si no hay ninguno. */
function firstOf(locator: { elements(): Element[] }): HTMLElement | null {
	return (locator.elements()[0] as HTMLElement | undefined) ?? null;
}

/**
 * Añade un botón al `body`, fuera del componente renderizado: es el objetivo del
 * click fuera y el destino del Tab que sale del menú. Hay que retirarlo al acabar:
 * el cleanup automático sólo alcanza al contenedor del `render`.
 */
function outsideButton(): HTMLButtonElement {
	const outside = document.createElement('button');
	outside.textContent = 'Fuera';
	document.body.appendChild(outside);
	return outside;
}

describe('DropdownMenu', () => {
	it('abre con click del disparador, por estado y no por foco', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const fuera = outsideButton();

		const menu = getByRole('menu');
		expect(menu.elements()).toHaveLength(0);

		const toggle = getByRole('button', { name: 'Options' });
		const trigger = firstOf(toggle);
		expect(trigger?.getAttribute('aria-expanded')).toBe('false');
		expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
		// Cerrado no hay lista a la que apuntar: el atributo no se pone.
		expect(trigger?.getAttribute('aria-controls')).toBe(null);

		await toggle.click();
		expect(trigger?.getAttribute('aria-expanded')).toBe('true');
		expect(trigger?.getAttribute('aria-controls')).toBe(firstOf(menu)?.getAttribute('id'));

		const items = getByRole('menuitem').elements();
		expect(items.map((item) => item.textContent?.trim())).toEqual(['One', 'Two', 'Three']);
		// El `<li role="none">` se aparta del árbol: el `menu` cuelga directo de los items.
		expect(items.every((item) => item.parentElement?.getAttribute('role') === 'none')).toBe(true);

		// El click del disparador alterna.
		await toggle.click();
		expect(menu.elements()).toHaveLength(0);
		expect(trigger?.getAttribute('aria-expanded')).toBe('false');

		fuera.remove();
	});

	it('Enter y Espacio abren el menú desde el disparador enfocado', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const trigger = firstOf(getByRole('button', { name: 'Options' }));
		trigger?.focus();

		await userEvent.keyboard('{Enter}');
		expect(getByRole('menu').elements()).toHaveLength(1);

		await userEvent.keyboard('{Escape}');
		// Espacio (el carácter, no una tecla con nombre) activa el botón igual que Enter.
		await userEvent.keyboard(' ');
		expect(getByRole('menu').elements()).toHaveLength(1);
	});

	it('↓ abre enfocando el primer item y ↑ el último', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const items = getByRole('menuitem');
		const trigger = firstOf(getByRole('button', { name: 'Options' }));
		trigger?.focus();

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(items.elements()[0]);

		await userEvent.keyboard('{Escape}');
		trigger?.focus();
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(items.elements().at(-1));
	});

	it('↑/↓/Inicio/Fin mueven el foco entre los items, con vuelta cíclica', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const items = getByRole('menuitem');
		firstOf(getByRole('button', { name: 'Options' }))?.focus();

		await userEvent.keyboard('{ArrowDown}');
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(items.elements()[1]);
		await userEvent.keyboard('{ArrowDown}');
		await userEvent.keyboard('{ArrowDown}');
		// Del último se vuelve al primero.
		expect(document.activeElement).toBe(items.elements()[0]);
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(items.elements().at(-1));
		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(items.elements()[0]);
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(items.elements().at(-1));
	});

	it('Escape cierra y devuelve el foco al disparador', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const trigger = firstOf(getByRole('button', { name: 'Options' }));
		trigger?.focus();

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).not.toBe(trigger);

		await userEvent.keyboard('{Escape}');
		expect(getByRole('menu').elements()).toHaveLength(0);
		expect(document.activeElement).toBe(trigger);
	});

	it('elegir un item ejecuta la acción y cierra con el `close` del snippet', async () => {
		const chosen: string[] = [];
		const { getByRole } = await render(DropdownMenuHarness, {
			itemsUseClose: true,
			onSelect: (item) => chosen.push(item)
		});

		await getByRole('button', { name: 'Options' }).click();
		await getByRole('menuitem', { name: 'Two' }).click();

		expect(chosen).toEqual(['Two']);
		expect(getByRole('menu').elements()).toHaveLength(0);
		expect(firstOf(getByRole('button', { name: 'Options' }))?.getAttribute('aria-expanded')).toBe(
			'false'
		);
	});

	it('closeOnSelect cierra al activar cualquier item sin que el item llame a close', async () => {
		const chosen: string[] = [];
		const { getByRole } = await render(DropdownMenuHarness, {
			closeOnSelect: true,
			onSelect: (item) => chosen.push(item)
		});

		await getByRole('button', { name: 'Options' }).click();
		await getByRole('menuitem', { name: 'Two' }).click();

		expect(chosen).toEqual(['Two']);
		expect(getByRole('menu').elements()).toHaveLength(0);
	});

	it('pulsar fuera cierra', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const fuera = outsideButton();

		await getByRole('button', { name: 'Options' }).click();
		expect(getByRole('menu').elements()).toHaveLength(1);

		await userEvent.click(fuera);
		expect(getByRole('menu').elements()).toHaveLength(0);

		fuera.remove();
	});

	it('salir con Tab cierra', async () => {
		const { getByRole } = await render(DropdownMenuHarness, {});
		const fuera = outsideButton();

		await getByRole('button', { name: 'Options' }).click();
		expect(getByRole('menu').elements()).toHaveLength(1);

		// Al último item y de ahí fuera: el `focusout` con `relatedTarget` externo cierra.
		await userEvent.keyboard('{End}');
		await userEvent.keyboard('{Tab}');
		expect(getByRole('menu').elements()).toHaveLength(0);
		expect(document.activeElement).toBe(fuera);

		fuera.remove();
	});
});
