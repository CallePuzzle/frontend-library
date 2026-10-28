<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Globe from '@lucide/svelte/icons/globe';
	import Search from '@lucide/svelte/icons/search';
	import ButtonSignOut from './ButtonSignOut.svelte';
	import DropdownMenu from './DropdownMenu.svelte';
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
		 * Idioma activo: marca su entrada del selector con `aria-checked`. Sin él el selector
		 * se pinta igual, pero ninguna entrada aparece marcada.
		 */
		activeLocale?: string;
		/**
		 * Qué renderizar cuando no hay usuario (un botón de login, un `Modal`…). El componente
		 * ya no embute ningún formulario de login: el flujo de auth es del consumidor.
		 */
		login?: Snippet;
		/**
		 * Avatar propio. Recibe el usuario. Sin él se usa `user.image` o su inicial.
		 *
		 * `user.image` se carga tal cual, sin enviar `Referer`. Si la URL la elige el usuario, su
		 * servidor ve la IP de quien mire el avatar: en ese caso sírvela desde tu dominio (proxy o
		 * subida propia) o pasa este snippet.
		 */
		avatar?: Snippet<[SessionUser]>;
		/**
		 * Entradas extra (`<li role="none">`) al final del menú de usuario. Para que los roles
		 * del menú sigan siendo correctos, el elemento interactivo de cada `<li>` debe llevar
		 * `role="menuitem"` (o `role="menuitemradio"` + `aria-checked` en un selector); elegir
		 * cierra el menú igualmente (`closeOnSelect` del `DropdownMenu` interno).
		 */
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
		activeLocale,
		login,
		avatar,
		menuExtra,
		class: className,
		strings,
		...rest
	}: Props = $props();

	const contextStrings = getUiStrings();
	const t = $derived({ ...defaultNavBarEndStrings, ...contextStrings.navBarEnd, ...strings });

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
			La apertura es estado explícito (`DropdownMenu`), no foco: WebKit no da foco a un
			`<button>` al pulsarlo y en un iPhone el menú no abría.
		-->
		<DropdownMenu
			label={t.language}
			triggerClass="btn btn-circle btn-ghost"
			menuClass="w-32 menu-sm"
			closeOnSelect
		>
			{#snippet trigger()}
				<Globe />
			{/snippet}
			{#snippet items()}
				{#each locales as locale (locale)}
					<li role="none">
						<button
							type="button"
							role="menuitemradio"
							aria-checked={locale === activeLocale}
							class="text-sm"
							onclick={() => setLocale?.(locale)}
						>
							{locale}
						</button>
					</li>
				{/each}
			{/snippet}
		</DropdownMenu>
	{/if}

	{#if user}
		<DropdownMenu
			label={t.userMenu}
			triggerClass="btn avatar btn-circle btn-ghost"
			menuClass="w-52 menu-sm"
			closeOnSelect
		>
			{#snippet trigger()}
				<!-- `<span>` y no `<div>`: el content model de `<button>` sólo admite phrasing. -->
				<span class="block w-10 overflow-hidden rounded-full">
					{#if avatar}
						{@render avatar(user)}
					{:else if user.image}
						<img alt={t.avatarAlt(displayName)} src={user.image} referrerpolicy="no-referrer" />
					{:else}
						<span
							class="flex h-full w-full items-center justify-center bg-neutral text-neutral-content"
						>
							{initial}
						</span>
					{/if}
				</span>
			{/snippet}
			{#snippet items()}
				{#if profileHref}
					<li role="none"><Link href={profileHref} label={t.profile} role="menuitem" /></li>
				{/if}
				{#if menuExtra}
					{@render menuExtra()}
				{/if}
				{#if authClient}
					<li role="none">
						<ButtonSignOut {authClient} strings={{ signOut: t.signOut }} role="menuitem" />
					</li>
				{/if}
			{/snippet}
		</DropdownMenu>
	{:else if login}
		{@render login()}
	{/if}
</div>
