<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Routes } from "@callepuzzle/core";

  import Menu from "@lucide/svelte/icons/menu";
  import NavBarList from "./NavBarList.svelte";

  import NavBarEnd from "./NavBarEnd.svelte";
  import { type Props as NavBarEndProps } from "./NavBarEnd.svelte";

  export type Props = {
    title: string;
    routes: Routes;
    children: Snippet;
  } & NavBarEndProps;

  let {
    title,
    routes,
    children,
    // NavBarEndProps
    session,
    authClient,
    userHasNotification = false,
    notification = false,
    searcher = false,
    locales = [],
    setLocale,
  }: Props = $props();
</script>

<div class="drawer">
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="navbar bg-base-300 w-full">
      <div class="flex-none lg:hidden">
        <label
          for="my-drawer-3"
          aria-label="open sidebar"
          class="btn btn-square btn-ghost"
        >
          <Menu />
        </label>
      </div>
      <div class="navbar-start mx-2 px-2">{title}</div>
      <nav class="navbar-center hidden lg:block">
        <NavBarList type="horizontal" {routes} />
      </nav>
      <NavBarEnd
        {session}
        {authClient}
        {userHasNotification}
        {notification}
        {searcher}
        {routes}
        {locales}
        {setLocale}
      />
    </div>
    <!-- Page content here -->
    {@render children()}
  </div>
  <nav class="drawer-side">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <NavBarList type="drawer" {routes} />
  </nav>
</div>
