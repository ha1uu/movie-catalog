<script setup lang="ts">
import type { Movie } from "~/shared/types/catalog";
defineProps<{ movie: Movie; eager?: boolean }>();
const { isSaved, toggle } = useSaved();
const failed = ref(false);
</script>
<template>
  <article class="movie-card">
    <div class="poster-wrap">
      <NuxtLink
        :to="`/movies/${movie.id}`"
        class="poster-link"
        :aria-label="movie.title"
      >
        <img
          v-if="!failed"
          :src="movie.poster"
          :alt="`Постер фильма «${movie.title}»`"
          width="360"
          height="540"
          :loading="eager ? 'eager' : 'lazy'"
          decoding="async"
          @error="failed = true"
        />
        <span v-else class="poster-fallback"
          ><AppIcon name="film" :size="40" />{{ movie.title }}</span
        >
        <span class="poster-shade" /><span class="poster-open"
          >О фильме <AppIcon name="arrow" :size="18"
        /></span>
      </NuxtLink>
      <span class="rating" :class="{ 'rating-muted': movie.rating < 7 }"
        ><AppIcon name="star" :size="12" />{{ movie.rating.toFixed(1) }}</span
      >
      <button
        class="card-save"
        :class="{ selected: isSaved(movie.id) }"
        :aria-label="`${isSaved(movie.id) ? 'Убрать из избранного' : 'В избранное'}: ${movie.title}`"
        :aria-pressed="isSaved(movie.id)"
        @click="toggle(movie.id)"
      >
        <AppIcon :name="isSaved(movie.id) ? 'check' : 'plus'" :size="18" />
      </button>
    </div>
    <NuxtLink :to="`/movies/${movie.id}`" class="movie-title">{{
      movie.title
    }}</NuxtLink>
    <p class="movie-meta">
      {{ movie.year }}<span>·</span>{{ movie.genres[0] }}
    </p>
  </article>
</template>
