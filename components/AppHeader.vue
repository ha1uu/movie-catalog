<script setup lang="ts">
const route = useRoute();
const menuOpen = ref(false);
const { saved } = useSaved();
const search = ref(String(route.query.q || ""));
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
    search.value = String(route.query.q || "");
  },
);
function submitSearch() {
  navigateTo({
    path: "/movies",
    query: search.value.trim() ? { q: search.value.trim() } : {},
  });
}
</script>
<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink to="/" class="brand" aria-label="Кадр — главная"
        ><span class="brand-icon"><i /><i /><i /><i /></span>кадр<span
          class="brand-dot"
          >.</span
        ></NuxtLink
      >
      <nav class="desktop-nav" aria-label="Основная навигация">
        <NuxtLink to="/" :class="{ active: route.path === '/' }"
          >Главная</NuxtLink
        >
        <NuxtLink
          to="/movies"
          :class="{ active: route.path.startsWith('/movies') }"
          >Фильмы</NuxtLink
        >
        <NuxtLink
          to="/people"
          :class="{ active: route.path.startsWith('/people') }"
          >Персоны</NuxtLink
        >
      </nav>
      <form
        class="header-search"
        role="search"
        action="/movies"
        method="get"
        @submit.prevent="submitSearch"
      >
        <AppIcon name="search" :size="18" /><input
          name="q"
          v-model="search"
          aria-label="Найти фильм"
          placeholder="Название фильма…"
          type="search"
        /><button type="submit" aria-label="Искать"><span>↵</span></button>
      </form>
      <NuxtLink to="/saved" class="saved-link" aria-label="Избранное"
        ><AppIcon name="bookmark" /><span>Избранное</span
        ><span class="saved-count"
          ><ClientOnly
            ><b v-if="saved.length">{{ saved.length }}</b></ClientOnly
          ></span
        ></NuxtLink
      >
      <button
        class="mobile-menu icon-button"
        :aria-expanded="menuOpen"
        aria-label="Открыть меню"
        @click="menuOpen = !menuOpen"
      >
        <AppIcon :name="menuOpen ? 'close' : 'menu'" />
      </button>
    </div>
    <nav v-if="menuOpen" class="mobile-nav" aria-label="Мобильная навигация">
      <NuxtLink to="/">Главная</NuxtLink><NuxtLink to="/movies">Фильмы</NuxtLink
      ><NuxtLink to="/people">Персоны</NuxtLink
      ><NuxtLink to="/saved">Избранное</NuxtLink>
    </nav>
  </header>
</template>
