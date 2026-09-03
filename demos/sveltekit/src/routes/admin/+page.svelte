<script lang="ts">
	import { Link, UserNotLogged } from '@callepuzzle/svelte-ui';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getUiStrings } from '$lib/ui-strings';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = $derived(getUiStrings());

	const expires = $derived(
		data.secret?.expiresAt ? new Date(data.secret.expiresAt).toLocaleString() : '—'
	);
</script>

<h1 class="text-2xl font-bold">{m.app_admin_title()}</h1>
<p class="mt-2 max-w-3xl">{m.app_admin_body()}</p>

{#if data.secret}
	<div class="mt-6 alert alert-success" data-testid="admin-secret">
		<span>{m.app_admin_greeting({ name: data.secret.name, expires })}</span>
	</div>
	<Link href="/" label={m.app_admin_go_home()} class="btn mt-4 btn-outline" />
{:else}
	<!--
		El aviso no abre nada por su cuenta: la acción la pone la app en el snippet `action`.
		Aquí es el mismo `LoginModal` que usa el `NavBarEnd` del layout.
	-->
	<UserNotLogged class="mt-6 min-h-fit rounded-box" strings={t.userNotLogged}>
		{#snippet action()}
			<LoginModal buttonClass="btn btn-primary" />
		{/snippet}
	</UserNotLogged>
{/if}
