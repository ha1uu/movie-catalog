<script setup lang="ts">
const route = useRoute();
const { data, error } = await useFetch(() => `/api/movies/${route.params.id}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 502,
    message:
      error.value.statusCode === 404
        ? "Фильм не найден"
        : "Каталог временно недоступен",
  });
if (!data.value)
  throw createError({
    statusCode: 502,
    message: "Каталог временно недоступен",
  });
const movie = computed(() => data.value!.movie);
const posterFailed = ref(false);
const { isSaved, toggle } = useSaved();
useSeoMeta({
  title: () => `${movie.value.title} (${movie.value.year}) — Кадр`,
  description: () => movie.value.description,
  ogTitle: () => movie.value.title,
  ogDescription: () => movie.value.description,
  ogImage: () => movie.value.poster,
});
useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Movie",
        name: movie.value.title,
        alternateName: movie.value.originalTitle,
        dateCreated: String(movie.value.year),
        description: movie.value.description,
        duration: `PT${movie.value.duration}M`,
        image: movie.value.poster,
        genre: movie.value.genres,
      }).replace(/</g, "\\u003c"),
    },
  ],
});
</script>
<template>
  <div v-if="data" class="container inner-page movie-detail">
    <NuxtLink to="/movies" class="back-link"
      ><AppIcon name="back" :size="17" />В каталог</NuxtLink
    >
    <section class="detail-main">
      <div class="detail-poster">
        <img
          :src="posterFailed ? '/images/poster-placeholder.svg' : movie.poster"
          :alt="movie.title"
          width="360"
          height="540"
          fetchpriority="high"
          @error="posterFailed = true"
        />
        <div class="detail-poster-caption">
          <AppIcon name="star" :size="16" />{{ movie.rating.toFixed(1)
          }}<span>Рейтинг TMDB</span>
        </div>
      </div>
      <div class="detail-copy">
        <p class="eyebrow muted-eyebrow">ИСТОРИЯ, КОТОРУЮ СТОИТ УВИДЕТЬ</p>
        <h1>{{ movie.title }}</h1>
        <p class="detail-original">
          {{ movie.originalTitle }}<span v-if="movie.age">{{ movie.age }}</span>
        </p>
        <div class="detail-tags">
          <span v-if="movie.year">{{ movie.year }}</span
          ><span v-if="movie.country">{{ movie.country }}</span
          ><span v-if="movie.duration"
            ><AppIcon name="clock" :size="15" />{{
              Math.floor(movie.duration / 60)
            }}
            ч {{ movie.duration % 60 }} мин</span
          >
        </div>
        <div class="detail-genres">
          <NuxtLink
            v-for="genre in movie.genres"
            :key="genre"
            :to="{ path: '/movies', query: { genre } }"
            >{{ genre }}</NuxtLink
          >
        </div>
        <p class="detail-description">{{ movie.description }}</p>
        <div v-if="data.director" class="director-line">
          <span>Режиссёр</span
          ><NuxtLink :to="`/people/${data.director.id}`"
            >{{ data.director.name }}<AppIcon name="arrow" :size="16"
          /></NuxtLink>
        </div>
        <button
          class="button button-primary"
          :aria-pressed="isSaved(movie.id)"
          @click="toggle(movie.id)"
        >
          <AppIcon :name="isSaved(movie.id) ? 'check' : 'plus'" :size="18" />{{
            isSaved(movie.id) ? "В избранном" : "Буду смотреть"
          }}
        </button>
        <p class="detail-note">Сохраните фильм для следующего киновечера</p>
      </div>
    </section>
    <section v-if="data.cast.length" class="detail-section">
      <div class="section-heading">
        <h2>Лица этой истории</h2>
        <NuxtLink to="/people" class="text-link"
          >Все персоны<AppIcon name="arrow" :size="17"
        /></NuxtLink>
      </div>
      <div class="people-grid">
        <PersonCard
          v-for="person in data.cast"
          :key="person.id"
          :person="person"
        />
      </div>
    </section>
    <section class="detail-section">
      <div class="section-heading"><h2>Вам также может понравиться</h2></div>
      <div class="movie-grid">
        <MovieCard
          v-for="related in data.related"
          :key="related.id"
          :movie="related"
        />
      </div>
    </section>
  </div>
</template>
