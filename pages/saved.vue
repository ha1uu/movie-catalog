<script setup lang="ts">
const { saved, ready } = useSaved();
const { data, status, error, refresh } = await useFetch("/api/saved", {
  query: computed(() => ({ ids: saved.value.join(",") })),
  server: false,
});
useSeoMeta({
  title: "Избранное — Кадр",
  description: "Ваша коллекция фильмов для следующего киновечера.",
});
</script>
<template>
  <div class="container inner-page saved-page">
    <p class="eyebrow muted-eyebrow">ВАШ ЛИЧНЫЙ КИНОЗАЛ</p>
    <h1>Буду смотреть<span class="heading-dot">.</span></h1>
    <p class="page-description">Хорошие истории заслуживают своего вечера.</p>
    <div v-if="!ready || status === 'pending'" class="movie-grid">
      <MovieSkeleton v-for="n in Math.max(saved.length, 1)" :key="n" />
    </div>
    <div v-else-if="error" class="empty-state">
      <h2>Не удалось загрузить избранное</h2>
      <button class="button button-primary" @click="refresh()">
        Повторить
      </button>
    </div>
    <div v-else-if="data?.length" class="movie-grid">
      <MovieCard v-for="movie in data" :key="movie.id" :movie="movie" eager />
    </div>
    <div v-else class="empty-state saved-empty">
      <AppIcon name="bookmark" :size="40" />
      <h2>Здесь начнётся ваша коллекция</h2>
      <p>
        Нажмите «+» на постере, чтобы сохранить фильм.<br />Избранное останется
        в этом браузере.
      </p>
      <NuxtLink to="/movies" class="button button-primary"
        >Найти своё кино<AppIcon name="arrow" :size="18"
      /></NuxtLink>
    </div>
  </div>
</template>
