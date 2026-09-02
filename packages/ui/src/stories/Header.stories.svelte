<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Header from "../components/Header.svelte";
  import { routes } from "@callepuzzle/core";

  // More on how to set up stories at: https://storybook.js.org/docs/writing-stories
  const { Story } = defineMeta({
    title: "Layout/Header",
    component: Header,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"],
    parameters: {
      sveltekit_experimental: {
        forms: {
          enhance: () => {},
          applyAction: () => {},
        },
        stores: {
          page: {},
        },
      },
    },
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

<Story name="Full">
  <Header
    title="NavNar Title"
    routes={routesToShow}
    session={{ data: { user: { id: "1", name: "Test User" } } }}
    authClient={{}}
    userHasNotification={true}
    notification={true}
    searcher={true}
  >
    <ul>
      <li>option 1</li>
    </ul>
  </Header>
</Story>

<Story name="User not logged">
  <Header
    title="NavNar Title"
    routes={routesToShow}
    session={{ data: null }}
    authClient={{}}
    userHasNotification={false}
    notification={true}
    searcher={true}
  >
    <ul>
      <li>option 1</li>
    </ul>
  </Header>
</Story>
