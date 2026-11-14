/**
 * Datos de mentira compartidos por las stories.
 *
 * Todo lo que las stories necesitan entra por props: rutas, usuario y textos. No hay ningún
 * `routes` importado de `@callepuzzle/core` (ya no existe) ni ninguna sesión leída de un
 * store; el mapa de rutas lo declara quien lo usa, y la **clave es la ruta**.
 */
import type { Route, RouteMap } from '@callepuzzle/core';
import Archive from '@lucide/svelte/icons/archive';
import Bell from '@lucide/svelte/icons/bell';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import ChefHat from '@lucide/svelte/icons/chef-hat';
import History from '@lucide/svelte/icons/history';
import House from '@lucide/svelte/icons/house';
import List from '@lucide/svelte/icons/list';
import Settings from '@lucide/svelte/icons/settings';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Users from '@lucide/svelte/icons/users';
import type { SessionUser } from '../types.js';

/** Mapa de rutas típico: menú de escritorio y dock móvil declaran sus flags por separado. */
export const routes: RouteMap = {
	'/': { label: 'Home', short: 'Home', icon: House, showInMenu: true, showInMobile: true },
	'/shop': {
		label: 'Shop',
		short: 'Shop',
		icon: ShoppingCart,
		showInMenu: true,
		showInMobile: true
	},
	'/notifications': { label: 'Notifications', icon: Bell, showInMobile: true },
	'/settings': { label: 'Settings', icon: Settings, showInMenu: true },
	// Ni en el menú ni en el dock: está en el mapa sólo para que `Link` pueda resolverla.
	'/legal/privacy': { label: 'Privacy policy' }
};

/**
 * El mismo mapa con las etiquetas en castellano.
 *
 * Es el patrón que tiene que aprender el consumidor: la librería no traduce nada, las
 * `label` llegan ya resueltas por su runtime de i18n **en render**.
 */
export const routesEs: RouteMap = {
	'/': { label: 'Inicio', short: 'Inicio', icon: House, showInMenu: true, showInMobile: true },
	'/shop': {
		label: 'Tienda',
		short: 'Tienda',
		icon: ShoppingCart,
		showInMenu: true,
		showInMobile: true
	},
	'/settings': { label: 'Ajustes', icon: Settings, showInMenu: true }
};

/**
 * Menú de escritorio grande: el caso del consumidor `y-tu-que-compras` (#37), que llega a
 * 9 secciones al añadir «Recetas». En portátil (1280–1535px) las etiquetas ya no caben
 * (`.navbar-center` de daisyUI no encoge y navbar-end tapa las últimas entradas): es el
 * escenario del disclosure progresivo, icono sólo por debajo de `2xl` e icono+etiqueta a
 * partir de `2xl`.
 */
export const routesLong: RouteMap = {
	'/': { label: 'Home', icon: House, showInMenu: true },
	'/shop': { label: 'Shop', icon: ShoppingCart, showInMenu: true },
	'/recipes': { label: 'Recipes', icon: ChefHat, showInMenu: true },
	'/lists': { label: 'Lists', icon: List, showInMenu: true },
	'/pantry': { label: 'Pantry', icon: Archive, showInMenu: true },
	'/history': { label: 'History', icon: History, showInMenu: true },
	'/families': { label: 'Families', icon: Users, showInMenu: true },
	'/reports': { label: 'Reports', icon: ChartColumn, showInMenu: true },
	'/settings': { label: 'Settings', icon: Settings, showInMenu: true }
};

/** Una entrada suelta, ya con su `id` reinyectado: es lo que recibe `Link`/`DockLink`. */
export const shopRoute: Route = {
	id: '/shop',
	label: 'Shop',
	short: 'Shop',
	icon: ShoppingCart,
	showInMenu: true,
	showInMobile: true
};

export const userWithImage: SessionUser = {
	id: 'usr_1',
	name: 'Ada Lovelace',
	email: 'ada@example.com',
	// SVG en línea (data URI): una story no debe depender de una imagen remota.
	image:
		'data:image/svg+xml;utf8,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
				'<rect width="40" height="40" fill="#4f46e5"/>' +
				'<circle cx="20" cy="15" r="7" fill="#e0e7ff"/>' +
				'<path d="M6 40c0-8 6-13 14-13s14 5 14 13z" fill="#e0e7ff"/>' +
				'</svg>'
		)
};

export const userWithoutImage: SessionUser = {
	id: 'usr_2',
	name: 'Grace Hopper',
	email: 'grace@example.com'
};
