<script setup lang="ts">
const { notice } = useSaved();
</script>
<template>
  <a class="skip-link" href="#main">К содержимому</a>
  <AppHeader />
  <main id="main"><NuxtPage /></main>
  <footer class="site-footer container">
    <NuxtLink to="/" class="brand footer-brand"
      ><span class="brand-icon"><i /><i /><i /><i /></span>кадр<span
        class="brand-dot"
        >.</span
      ></NuxtLink
    >
    <p>Место, где начинаются хорошие истории.</p>
    <span>О кино. С любовью. <span class="footer-year">© 2026</span></span>
    <div class="tmdb-attribution">
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        >Данные и изображения: TMDB</a
      >
      <p lang="en">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  </footer>
  <Transition name="toast"
    ><div v-if="notice" class="toast" role="status">
      <AppIcon name="check" />{{ notice }}
    </div></Transition
  >
</template>
