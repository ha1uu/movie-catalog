<script setup lang="ts">
import type { Movie, MoviePage } from "~/shared/types/catalog";
const route = useRoute();
const hydrated = ref(false);
const navigating = ref(false);
const filters = computed(() => ({
  genre: String(route.query.genre || ""),
  year: String(route.query.year || ""),
  sort: String(route.query.sort || "popular"),
  q: String(route.query.q || ""),
}));
const { data, status, error, refresh } = await useFetch("/api/movies", {
  query: filters,
});
const extra = ref<Movie[]>([]);
const page = ref(1);
const loadingMore = ref(false);
const moreError = ref(false);
const finished = ref(false);
const sentinel = ref<HTMLElement>();
let generation = 0;
let controller: AbortController | undefined;
const items = computed(() => [...(data.value?.items || []), ...extra.value]);
const hasMore = computed(() => !!data.value?.hasMore && !finished.value);
const isFiltered = computed(
  () =>
    filters.value.genre ||
    filters.value.year ||
    filters.value.q ||
    filters.value.sort !== "popular",
);
watch(filters, () => {
  generation++;
  controller?.abort();
  extra.value = [];
  page.value = 1;
  finished.value = false;
  moreError.value = false;
  loadingMore.value = false;
});
async function setFilter(key: string, value: string) {
  navigating.value = true;
  try {
    await navigateTo(
      {
        path: route.path,
        query: { ...route.query, [key]: value || undefined },
      },
      { replace: true },
    );
  } finally {
    navigating.value = false;
  }
}
async function resetFilters() {
  navigating.value = true;
  try {
    await navigateTo({ path: route.path, query: {} }, { replace: true });
  } finally {
    navigating.value = false;
  }
}
async function loadMore() {
  if (
    loadingMore.value ||
    status.value === "pending" ||
    !hasMore.value ||
    moreError.value
  )
    return;
  const current = generation;
  loadingMore.value = true;
  controller = new AbortController();
  try {
    const result = await $fetch<MoviePage>("/api/movies", {
      query: { ...filters.value, page: page.value + 1 },
      signal: controller.signal,
    });
    if (current !== generation) return;
    extra.value.push(...result.items);
    page.value = result.page;
    finished.value = !result.hasMore;
  } catch (err) {
    if (
      current === generation &&
      !(err instanceof Error && err.name === "AbortError")
    )
      moreError.value = true;
  } finally {
    if (current === generation) loadingMore.value = false;
  }
}
let observer: IntersectionObserver | undefined;
onMounted(() => {
  hydrated.value = true;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    },
    { rootMargin: "180px" },
  );
  if (sentinel.value) observer.observe(sentinel.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  controller?.abort();
});
watch([status, hasMore], () => {
  if (
    status.value === "success" &&
    sentinel.value &&
    sentinel.value.getBoundingClientRect().top < window.innerHeight + 180
  )
    loadMore();
});
</script>
<template>
  <section id="catalog" class="catalog-section" aria-labelledby="catalog-title">
    <div class="section-heading">
      <div>
        <div class="eyebrow muted-eyebrow">ВАША СЛЕДУЮЩАЯ ИСТОРИЯ</div>
        <h2 id="catalog-title">
          Что посмотрим сегодня<span class="heading-dot">?</span>
        </h2>
      </div>
      <span class="catalog-count"
        >{{ data ? movieCount(data.total) : "—" }} в каталоге</span
      >
    </div>
    <div class="filter-bar">
      <div class="genre-tabs" aria-label="Жанры">
        <button
          :disabled="!hydrated || navigating"
          :aria-pressed="!filters.genre"
          :class="{ active: !filters.genre }"
          @click="setFilter('genre', '')"
        >
          <AppIcon name="grid" :size="15" />Все фильмы</button
        ><button
          :disabled="!hydrated || navigating"
          v-for="genre in data?.genres"
          :key="genre"
          :aria-pressed="filters.genre === genre"
          :class="{ active: filters.genre === genre }"
          @click="setFilter('genre', genre)"
        >
          {{ genre }}
        </button>
      </div>
      <div class="select-filters">
        <label class="select-wrap"
          ><AppIcon name="clock" :size="16" /><select
            :disabled="!hydrated || navigating"
            :value="filters.year"
            aria-label="Год выпуска"
            @change="
              setFilter('year', ($event.target as HTMLSelectElement).value)
            "
          >
            <option value="">Все годы</option>
            <option v-for="year in data?.years" :key="year" :value="year">
              {{ year }}
            </option></select
          ><AppIcon name="chevron" :size="14" /></label
        ><label class="select-wrap sort-select"
          ><AppIcon name="filter" :size="17" /><select
            :disabled="!hydrated || navigating"
            :value="filters.sort"
            aria-label="Сортировка"
            @change="
              setFilter('sort', ($event.target as HTMLSelectElement).value)
            "
          >
            <option value="popular">Выбор редакции</option>
            <option value="rating">По рейтингу</option>
            <option value="newest">Сначала новые</option></select
          ><AppIcon name="chevron" :size="14"
        /></label>
      </div>
    </div>
    <div v-if="filters.q || isFiltered" class="active-filters">
      <span>{{
        filters.q ? `Поиск: «${filters.q}»` : "Фильтры применены"
      }}</span
      ><button :disabled="!hydrated || navigating" @click="resetFilters()">
        Сбросить<AppIcon name="close" :size="13" />
      </button>
    </div>
    <div class="catalog-body" :aria-busy="status === 'pending' || loadingMore">
      <div v-if="error" class="empty-state">
        <AppIcon name="film" :size="32" />
        <h3>Не удалось загрузить фильмы</h3>
        <p>Проверьте соединение и попробуйте ещё раз.</p>
        <button class="button button-primary" @click="refresh()">
          Попробовать снова
        </button>
      </div>
      <div v-else-if="status === 'pending'" class="movie-grid">
        <MovieSkeleton v-for="n in 6" :key="n" />
      </div>
      <div v-else-if="!items.length" class="empty-state">
        <AppIcon name="search" :size="32" />
        <h3>Пока ни одного совпадения</h3>
        <p>Попробуйте другой жанр, год или название фильма.</p>
        <button
          class="button button-primary"
          @click="navigateTo({ path: route.path, query: {} })"
        >
          Показать все фильмы
        </button>
      </div>
      <template v-else
        ><div class="movie-grid">
          <MovieCard
            v-for="(movie, index) in items"
            :key="movie.id"
            :movie="movie"
            :eager="index < 6"
          /></div
      ></template>
      <div ref="sentinel" class="load-area">
        <template v-if="hasMore && !error && status !== 'pending'"
          ><div class="movie-grid more-skeletons">
            <MovieSkeleton v-for="n in 6" :key="n" />
          </div>
          <div class="load-control">
            <button
              v-if="moreError"
              class="button button-secondary"
              @click="
                moreError = false;
                loadMore();
              "
            >
              Повторить загрузку</button
            ><button
              v-else
              class="load-button"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <span v-if="loadingMore" class="spinner" /><AppIcon
                v-else
                name="plus"
                :size="18"
              />{{ loadingMore ? "Ещё немного кино…" : "Показать ещё" }}
            </button>
            <p>Листайте вниз — новые истории появятся сами</p>
          </div></template
        >
        <p
          v-else-if="items.length && !error && status !== 'pending'"
          class="end-message"
        >
          <span />Вы посмотрели всю подборку. Самое время выбрать фильм.<span />
        </p>
      </div>
    </div>
  </section>
</template>
