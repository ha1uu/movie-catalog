<script setup lang="ts">
const { isSaved, toggle } = useSaved();
useHead({
  link: [
    {
      rel: "preload",
      as: "image",
      href: "/images/hero.webp",
      fetchpriority: "high",
    },
  ],
});
</script>
<template>
  <section class="featured" aria-labelledby="featured-title">
    <img
      class="featured-image"
      src="/images/hero.webp"
      width="1600"
      height="667"
      alt="Герои фильма «Главный герой» на улицах виртуального города"
      fetchpriority="high"
    />
    <div class="featured-gradient" />
    <div class="featured-content">
      <div class="eyebrow"><span class="live-dot" />ФИЛЬМ НЕДЕЛИ</div>
      <div class="featured-meta">
        <span class="hero-rating"><AppIcon name="star" :size="14" />7.4</span
        ><span>2021</span><span>Фантастика, комедия</span
        ><span class="age">12+</span>
      </div>
      <h2 id="featured-title">Главный герой</h2>
      <p class="original-title">FREE GUY</p>
      <p class="featured-description">
        А что, если весь твой мир — видеоигра?<br class="desktop-only" />
        История о том, как перестать быть фоном<br class="desktop-only" />
        и стать главным героем своей жизни.
      </p>
      <div class="featured-actions">
        <NuxtLink to="/movies/free-guy" class="button button-primary"
          >О фильме<AppIcon name="arrow" :size="18" /></NuxtLink
        ><button
          class="button button-glass"
          :aria-pressed="isSaved('free-guy')"
          @click="toggle('free-guy')"
        >
          <AppIcon
            :name="isSaved('free-guy') ? 'check' : 'plus'"
            :size="18"
          />{{ isSaved("free-guy") ? "В избранном" : "Буду смотреть" }}
        </button>
      </div>
    </div>
    <div class="featured-caption">
      <span>ВЫБОР РЕДАКЦИИ</span>
      <p>Иногда, чтобы изменить мир,<br />достаточно быть собой.</p>
    </div>
    <div class="hero-index">
      <span>01</span><span class="hero-index-line" /><span
        >КИНО СО СМЫСЛОМ</span
      >
    </div>
  </section>
</template>
