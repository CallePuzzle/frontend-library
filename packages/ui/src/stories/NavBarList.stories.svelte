<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import NavBarList from "../components/NavBarList.svelte";
  import { routes } from "@callepuzzle/core";

  const { Story } = defineMeta({
    title: "Component/NavBarList",
    component: NavBarList,
    tags: ["autodocs"],
  });

  const testRoutes = {
    site1: {
      name: "site1",
      url: "/site1",
      isProtected: false,
      showInMenu: true,
    },
    site2: {
      name: "site2",
      url: "/site2",
      isProtected: false,
      showInMenu: true,
    },
  };

  const routesToShow = { ...routes, ...testRoutes };
</script>

<Story name="Horizontal" args={{ type: "horizontal", routes: routesToShow }} />
<Story name="Drawer" args={{ type: "drawer", routes: routesToShow }} />
