<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Globe from '@lucide/svelte/icons/globe';
	import Search from '@lucide/svelte/icons/search';
	import ButtonSignOut from './ButtonSignOut.svelte';
	import Link from './Link.svelte';
	import { defaultNavBarEndStrings, type NavBarEndStrings } from './NavBarEnd.strings.js';
	import { getUiStrings } from '../strings/context.js';
	import type { SessionUser, SignOutClient } from '../types.js';
	import { cn } from '../utils.js';

	export type Props = {
		/**
		 * Usuario de la sesión, como dato plano. Llega del `load` del consumidor; el componente
		 * no lee ningún store de sesión.
		 */
		user?: SessionUser | null;
		/** Cliente de auth, sólo para el "cerrar sesión". Sin él no se renderiza esa entrada. */
		authClient?: SignOutClient;
		/** Ruta del perfil. Sin ella no se renderiza la entrada de perfil. */
		profileHref?: string;
		/** Ruta de las notificaciones. Sin ella no se renderiza el bloque de notificaciones. */
		notificationsHref?: string;
		/** Pinta el punto de aviso sobre la campana. */
		userHasNotification?: boolean;
		/** Renderiza el botón de búsqueda. */
		searcher?: boolean;
		/** Idiomas disponibles. Con menos de dos no se renderiza el selector. */
		locales?: readonly string[];
		/** Cambia de idioma. Lo implementa el consumidor con su propio runtime de i18n. */
		setLocale?: (locale: string) => void;
		/**
		 * Qué renderizar cuando no hay usuario (un botón de login, un `Modal`…). El componente
		 * ya no embute ningún formulario de login: el flujo de auth es del consumidor.
		 */
		login?: Snippet;
		/** Avatar propio. Recibe el usuario. Sin él se usa `user.image` o su inicial. */
		avatar?: Snippet<[SessionUser]>;
		/** Entradas extra (`<li>`) al final del menú de usuario. */
		menuExtra?: Snippet;
		class?: string;
		strings?: Partial<NavBarEndStrings>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'class'>;

	let {
		user = null,
		authClient,
		profileHref,
		notificationsHref,
		userHasNotification = false,
		searcher = false,
		locales = [],
		setLocale,
		login,
		avatar,
		menuExtra,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultNavBarEndStrings, ...contextStrings.navBarEnd, ...strings });

	// Estado de los dropdowns, sólo para `aria-expanded`: daisyUI los muestra por CSS cuando el
	// contenedor tiene `:focus-within`, así que "hay foco dentro" es exactamente "está abierto".
	let localesOpen = $state(false);
	let userMenuOpen = $state(false);

	/** Nombre visible: lo que haya, sin inventarse nada. */
	const displayName = $derived(user?.name?.trim() || user?.email?.trim() || '');
	const initial = $derived(displayName.charAt(0).toUpperCase());
	const showLocales = $derived(locales.length > 1 && setLocale !== undefined);
</script>

<div class={cn('navbar-end', className)} {...rest}>
	{#if searcher}
		<button type="button" aria-label={t.search} class="btn btn-circle btn-ghost">
			<Search />
		</button>
	{/if}

	{#if notificationsHref}
		<Link href={notificationsHref} aria-label={t.notifications} class="btn btn-circle btn-ghost">
			<span class="indicator">
				<BellRing />
				{#if user && userHasNotification}
					<span class="indicator-item badge badge-xs badge-primary"></span>
				{/if}
			</span>
		</Link>
	{/if}

	{#if showLocales}
		<!--
			Un único elemento interactivo: el `<button>` exterior que envolvía este dropdown
			generaba HTML inválido (botones anidados) y rompía la navegación por teclado.
		-->
		<div
			class="dropdown dropdown-end"
			onfocusin={() => (localesOpen = true)}
			onfocusout={() => (localesOpen = false)}
		>
			<button
				type="button"
				aria-label={t.language}
				aria-haspopup="menu"
				aria-expanded={localesOpen}
				class="btn btn-circle btn-ghost"
			>
				<Globe />
			</button>
			<ul class="dropdown-content menu z-1 mt-3 w-32 menu-sm rounded-box bg-base-100 p-2 shadow">
				{#each locales as locale (locale)}
					<li>
						<button type="button" class="text-sm" onclick={() => setLocale?.(locale)}>
							{locale}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if user}
		<div
			class="dropdown dropdown-end"
			onfocusin={() => (userMenuOpen = true)}
			onfocusout={() => (userMenuOpen = false)}
		>
			<button
				type="button"
				aria-label={t.userMenu}
				aria-haspopup="menu"
				aria-expanded={userMenuOpen}
				class="btn avatar btn-circle btn-ghost"
			>
				<!-- `<span>` y no `<div>`: el content model de `<button>` sólo admite phrasing. -->
				<span class="block w-10 overflow-hidden rounded-full">
					{#if avatar}
						{@render avatar(user)}
					{:else if user.image}
						<img alt={t.avatarAlt(displayName)} src={user.image} />
					{:else}
						<span
							class="flex h-full w-full items-center justify-center bg-neutral text-neutral-content"
						>
							{initial}
						</span>
					{/if}
				</span>
			</button>
			<ul class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				{#if profileHref}
					<li><Link href={profileHref} label={t.profile} /></li>
				{/if}
				{#if menuExtra}
					{@render menuExtra()}
				{/if}
				{#if authClient}
					<li><ButtonSignOut {authClient} strings={{ signOut: t.signOut }} /></li>
				{/if}
			</ul>
		</div>
	{:else if login}
		{@render login()}
	{/if}
</div>
