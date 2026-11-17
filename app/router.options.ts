import type { RouterConfig } from "@nuxt/schema";
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 24 };
    if (to.path === from.path) return false;
    return { top: 0 };
  },
};
