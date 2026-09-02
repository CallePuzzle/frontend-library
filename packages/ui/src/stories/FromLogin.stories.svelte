<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import FormLogin from "../components/FormLogin.svelte";
  import { loginSchema } from "../schemas/login.js";
  import { defaults } from "sveltekit-superforms/client";
  import { zod } from "sveltekit-superforms/adapters";

  const { Story } = defineMeta({
    title: "Form/Login",
    component: FormLogin,
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

  const formValidated = defaults({ email: "pepe@pepe.es" }, zod(loginSchema));
</script>

<Story
  name="Generic"
  args={{
    formValidated,
  }}
/>
