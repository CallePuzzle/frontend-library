<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Modal from "../components/Modal.svelte";

  const { Story } = defineMeta({
    title: "Common/Modal",
    component: Modal,
    tags: ["autodocs"],
  });
</script>

<Story name="Outside">
  <Modal title="Close outside">
    <p>Content</p>
  </Modal>
</Story>
<Story name="Button">
  <Modal title="Close Button" type="button">
    <p>Content</p>
  </Modal>
</Story>
<Story name="X">
  <Modal title="Close X" type="X">
    <p>Content</p>
  </Modal>
</Story>
