<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { locales, localizeHref, setLocale } from "$lib/paraglide/runtime";
  import { Header } from "@callepuzzle/svelte-ui";
  import { routes } from "$lib/routes.js";
  import { session, authClient } from "@callepuzzle/auth/client";

  import type { PageData } from "./$types";
  import type { Snippet } from "svelte";

  let { children, data }: { children: Snippet; data: PageData } = $props();

  // setLocale("es");
</script>

<Header
  title="NavNar Title"
  {routes}
  {session}
  {authClient}
  {locales}
  {setLocale}
>
  {@render children()}
</Header>

<div style="display:none">
  {#each locales as locale}
    <a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
  {/each}
</div>
