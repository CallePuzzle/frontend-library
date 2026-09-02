<script lang="ts">
  import type { Route } from "@callepuzzle/core";
  export type Props = {
    route: Route;
  };

  let { route }: Props = $props();
</script>

<a href={route.url as string}>{route.name}</a>
