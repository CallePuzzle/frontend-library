<script lang="ts">
	/**
	 * Andamio de test para `Drawer`.
	 *
	 * Hace de app consumidora: mantiene el estado del cajón y lo enlaza con `bind:open`,
	 * con un botón que lo cierra escribiendo ese estado. Así el test cubre el flujo
	 * completo (abrir con el toggle, cerrar desde la app) sin tocar el checkbox del DOM,
	 * que es justo lo que antes obligaba a simular clicks nativos.
	 */
	import Drawer from '../components/Drawer.svelte';

	let open = $state(false);
</script>

<button type="button" data-testid="app-close" onclick={() => (open = false)}>
	Cerrar desde la app
</button>

<Drawer bind:open>
	{#snippet children({ drawerId })}
		<div data-drawer-id={drawerId}>Contenido</div>
	{/snippet}
	{#snippet side()}
		<nav>Menú lateral</nav>
	{/snippet}
</Drawer>
