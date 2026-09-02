<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import NavBarEnd from "../components/NavBarEnd.svelte";

  const { Story } = defineMeta({
    title: "Component/NavBarEnd",
    component: NavBarEnd,
    tags: ["autodocs"],
  });
</script>

<Story
  name="User logged with notification and searcher"
  args={{
    userIsLogged: true,
    userHasNotification: true,
    notification: true,
    searcher: true,
  }}
/>
<Story
  name="User logged with notification without searcher"
  args={{
    userIsLogged: true,
    userHasNotification: true,
    notification: true,
    searcher: false,
  }}
/>
<Story
  name="User logged without notification with searcher"
  args={{
    userIsLogged: true,
    userHasNotification: false,
    notification: false,
    searcher: true,
  }}
/>
<Story
  name="User logged without notification without searcher"
  args={{
    userIsLogged: true,
    userHasNotification: false,
    notification: false,
    searcher: false,
  }}
/>
<Story
  name="User not logged with notification with searcher"
  args={{
    userIsLogged: false,
    userHasNotification: true,
    notification: true,
    searcher: true,
  }}
/>
<Story
  name="User not logged with notification without searcher"
  args={{
    userIsLogged: false,
    userHasNotification: true,
    notification: true,
    searcher: false,
  }}
/>
<Story
  name="User not logged without notification with searcher"
  args={{
    userIsLogged: false,
    userHasNotification: false,
    notification: false,
    searcher: true,
  }}
/>
<Story
  name="User not logged without notification without searcher"
  args={{
    userIsLogged: false,
    userHasNotification: false,
    notification: false,
    searcher: false,
  }}
/>
