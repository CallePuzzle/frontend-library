<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { getLocale, isLocale, locales, setLocale } from '$lib/paraglide/runtime';
	import { Dock, Drawer, Footer, Header, NavBarEnd, NavBarList } from '@callepuzzle/svelte-ui';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { getRoutes } from '$lib/routes';
	import { authClient } from '$lib/auth-client';
	import { m } from '$lib/paraglide/messages.js';
	import { getUiStrings } from '$lib/ui-strings';
	import type { LayoutData } from './$types';

	// `children` se renombra: dentro del `{#snippet children()}` que recibe el `Drawer` el
	// nombre quedaría sombreado por el propio snippet.
	let { children: content, data }: { children: Snippet; data: LayoutData } = $props();

	// Todo lo que depende del idioma se resuelve en render, nunca al importar el módulo: es lo
	// que hace que cambiar de idioma cambie *también* los textos de la librería.
	const routes = $derived(getRoutes());
	const t = $derived(getUiStrings());
	// El idioma activo lo marca `NavBarEnd` en el selector (con `aria-checked`); también en
	// render, igual que las `routes` de arriba.
	const activeLocale = $derived(getLocale());

	// El usuario llega del `load` del servidor, uno por petición. `NavBarEnd` lo recibe como
	// dato plano; no hay ningún store de sesión.
	const user = $derived(data.user);

	/**
	 * `NavBarEnd` pide `(locale: string) => void` porque una librería no puede conocer los
	 * idiomas de la app. Aquí se estrecha al tipo `Locale` de Paraglide con su propia guarda.
	 */
	function changeLocale(locale: string) {
		if (isLocale(locale)) setLocale(locale);
	}
</script>

<!--
	El `Header` ya no envuelve la app: es solo la navbar. El layout de la página lo compone la
	app. `Drawer` da el cajón lateral de móvil y le pasa su `drawerId` al contenido, que es lo
	que necesita el botón hamburguesa del `Header` (`menuToggleFor`).
-->
<Drawer sideClass="z-20" strings={t.drawer}>
	{#snippet children({ drawerId })}
		<div class="flex min-h-screen flex-col">
			<Header {routes} homeHref="/" menuToggleFor={drawerId} strings={t.header}>
				{#snippet title()}
					<span class="text-lg font-bold">{m.app_brand()}</span>
				{/snippet}
				{#snippet navEnd()}
					<NavBarEnd
						{user}
						{authClient}
						{locales}
						{activeLocale}
						setLocale={changeLocale}
						strings={t.navBarEnd}
					>
						{#snippet login()}
							<!-- Sin usuario, `NavBarEnd` renderiza este snippet: el flujo de login
							     es una decisión de la app, no de la librería. -->
							<LoginModal />
						{/snippet}
					</NavBarEnd>
				{/snippet}
			</Header>

			<main class="container mx-auto grow p-4 pb-24 lg:pb-4">
				{@render content()}
			</main>

			<Footer>
				<p class="p-4 text-sm opacity-70">{m.app_footer()}</p>
			</Footer>

			<!-- El dock solo pinta las rutas con `showInMobile` (el filtro `mobile` es estricto). -->
			<Dock {routes} currentPath={page.url.pathname} strings={t.dock} />
		</div>
	{/snippet}

	{#snippet side()}
		<nav aria-label={m.ui_side_nav()}>
			<NavBarList type="drawer" {routes} />
		</nav>
	{/snippet}
</Drawer>

<!--
	Antes había aquí un bloque de `<a href={localizeHref(...)}>` con `style="display:none"`: un
	truco para que Paraglide viese las URLs localizadas y SvelteKit las prerenderizase. Ya no
	hace falta: la estrategia de idioma de este demo es `["cookie", "baseLocale"]` (ver
	`vite.config.ts`), así que las URLs no llevan prefijo de idioma y no hay nada que descubrir.
	Si se añadiese la estrategia `url` habría que volver a poner enlaces localizados reales —
	visibles, no ocultos con `display:none`— o generarlos con `generateStaticLocalizedUrls`.
-->
