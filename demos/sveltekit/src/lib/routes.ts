import { m } from "./paraglide/messages.js";
import { routes as coreRoutes, type Routes } from "@callepuzzle/core";

const myRoutes: Routes = {
  admin_index: {
    name: m.routes_admin_index(),
    url: "/admin/",
    isProtected: true,
    showInMenu: true,
  },
};

export const routes = { ...coreRoutes, ...myRoutes };
