<script setup lang="ts">
const { data: movie, error, refresh } = await useFetch("/api/featured");
const { isSaved, toggle } = useSaved();
useHead(() => ({
  link: movie.value?.backdrop
    ? [
        {
          rel: "preload",
          as: "image",
          href: movie.value.backdrop,
          fetchpriority: "high",
        },
      ]
    : [],
}));
</script>
<template>
  <section class="featured" aria-labelledby="featured-title">
    <template v-if="movie && !error">
      <img
        v-if="movie.backdrop"
        class="featured-image"
        :src="movie.backdrop"
        width="1600"
        height="667"
        :alt="`Кадр из фильма «${movie.title}»`"
        fetchpriority="high"
      />
      <div class="featured-gradient" />
      <div class="featured-content">
        <div class="eyebrow"><span class="live-dot" />СЕЙЧАС ПОПУЛЯРНО</div>
        <div class="featured-meta">
          <span class="hero-rating"
            ><AppIcon name="star" :size="14" />{{
              movie.rating.toFixed(1)
            }}</span
          ><span v-if="movie.year">{{ movie.year }}</span
          ><span>{{ movie.genres.slice(0, 2).join(", ") }}</span>
        </div>
        <h2 id="featured-title">{{ movie.title }}</h2>
        <p class="original-title">{{ movie.originalTitle }}</p>
        <p class="featured-description">{{ movie.description }}</p>
        <div class="featured-actions">
          <NuxtLink :to="`/movies/${movie.id}`" class="button button-primary"
            >О фильме<AppIcon name="arrow" :size="18" /></NuxtLink
          ><button
            class="button button-glass"
            :aria-pressed="isSaved(movie.id)"
            @click="toggle(movie.id)"
          >
            <AppIcon
              :name="isSaved(movie.id) ? 'check' : 'plus'"
              :size="18"
            />{{ isSaved(movie.id) ? "В избранном" : "Буду смотреть" }}
          </button>
        </div>
      </div>
      <div class="hero-index">
        <span>01</span><span class="hero-index-line" /><span
          >ОТКРЫВАЙТЕ НОВЫЕ ИСТОРИИ</span
        >
      </div>
    </template>
    <div v-else class="empty-state featured-unavailable">
      <AppIcon name="film" :size="32" />
      <h2 id="featured-title">Кино на небольшой паузе</h2>
      <p>Сейчас не удалось загрузить фильм. Попробуйте ещё раз.</p>
      <button class="button button-secondary" @click="refresh()">
        Обновить
      </button>
    </div>
  </section>
</template>
