<script setup lang="ts">
const route = useRoute();
const { data, error } = await useFetch(`/api/people/${route.params.id}`);
if (error.value || !data.value)
  throw createError({ statusCode: 404, statusMessage: "Персона не найдена" });
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
        <span>{{ person.initials }}</span
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
        <p class="detail-description">{{ person.bio }}</p>
      </div>
    </section>
    <section class="detail-section">
      <div class="section-heading">
        <h2>Фильмы в нашей коллекции</h2>
        <span class="catalog-count">{{ movieCount(data.movies.length) }}</span>
      </div>
      <div class="movie-grid">
        <MovieCard
          v-for="movie in data.movies"
          :key="movie.id"
          :movie="movie"
        />
      </div>
    </section>
  </div>
</template>
