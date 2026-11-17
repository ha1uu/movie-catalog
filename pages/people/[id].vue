<script setup lang="ts">
import type { Movie } from "~/shared/types/catalog";
const route = useRoute();
const { data, error } = await useFetch(() => `/api/people/${route.params.id}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 502,
    message:
      error.value.statusCode === 404
        ? "Персона не найдена"
        : "Каталог временно недоступен",
  });
if (!data.value)
  throw createError({
    statusCode: 502,
    message: "Каталог временно недоступен",
  });
const photoFailed = ref(false);
const extra = ref<Movie[]>([]),
  filmPage = ref(1),
  finished = ref(false),
  loadingMore = ref(false),
  moreError = ref(false);
const visibleMovies = computed(() => [...data.value!.movies, ...extra.value]);
async function loadMore() {
  loadingMore.value = true;
  moreError.value = false;
  try {
    const result = await $fetch(`/api/people/${route.params.id}`, {
      query: { page: filmPage.value + 1 },
    });
    const seen = new Set(visibleMovies.value.map((movie) => movie.id));
    extra.value.push(...result.movies.filter((movie) => !seen.has(movie.id)));
    filmPage.value = result.page;
    finished.value = !result.hasMore;
  } catch {
    moreError.value = true;
  } finally {
    loadingMore.value = false;
  }
}
const person = computed(() => data.value!.person);
useSeoMeta({
  title: () => `${person.value.name} — биография и фильмы — Кадр`,
  description: () => person.value.bio,
});
</script>
<template>
  <div v-if="data" class="container inner-page">
    <NuxtLink to="/people" class="back-link"
      ><AppIcon name="back" :size="17" />Все персоны</NuxtLink
    >
    <section class="person-detail">
      <div class="person-portrait" :style="{ '--person-color': person.color }">
        <img
          v-if="person.photo && !photoFailed"
          :src="person.photo"
          :alt="person.name"
          width="342"
          height="513"
          fetchpriority="high"
          @error="photoFailed = true"
        /><span v-else>{{ person.initials }}</span
        ><span class="portrait-label">ЛИЦА КИНО / КАДР</span>
      </div>
      <div>
        <p class="eyebrow muted-eyebrow">{{ person.role }}</p>
        <h1>{{ person.name }}</h1>
        <p class="detail-original">{{ person.originalName }}</p>
        <dl class="person-facts">
          <div>
            <dt>Дата рождения</dt>
            <dd>{{ person.birth }}</dd>
          </div>
          <div>
            <dt>Место рождения</dt>
            <dd>{{ person.birthplace }}</dd>
          </div>
        </dl>
        <p class="detail-description person-bio">{{ person.bio }}</p>
      </div>
    </section>
    <section class="detail-section">
      <div class="section-heading">
        <h2>Фильмография</h2>
        <span class="catalog-count">{{ movieCount(data.totalMovies) }}</span>
      </div>
      <div class="movie-grid">
        <MovieCard
          v-for="movie in visibleMovies"
          :key="movie.id"
          :movie="movie"
        />
      </div>
      <button
        v-if="data.hasMore && !finished"
        class="button button-secondary filmography-more"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{
          loadingMore
            ? "Загрузка…"
            : moreError
              ? "Повторить загрузку"
              : "Ещё фильмы"
        }}
      </button>
    </section>
  </div>
</template>
