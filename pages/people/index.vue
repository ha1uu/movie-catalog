<script setup lang="ts">
import type { Person } from "~/shared/types/catalog";
const { data, error, refresh } = await useFetch("/api/people");
const extra = ref<Person[]>([]),
  page = ref(1),
  hasMore = ref(true),
  loading = ref(false),
  moreError = ref(false);
const people = computed(() => [...(data.value?.items || []), ...extra.value]);
async function loadMore() {
  loading.value = true;
  moreError.value = false;
  try {
    const result = await $fetch("/api/people", {
      query: { page: page.value + 1 },
    });
    const seen = new Set(people.value.map((person) => person.id));
    extra.value.push(...result.items.filter((person) => !seen.has(person.id)));
    page.value = result.page;
    hasMore.value = result.hasMore;
  } catch {
    moreError.value = true;
  } finally {
    loading.value = false;
  }
}
useSeoMeta({
  title: "Персоны — Кадр",
  description:
    "Актёры и режиссёры: биографии, фильмографии и истории создателей кино.",
});
</script>
<template>
  <div class="container inner-page">
    <p class="eyebrow muted-eyebrow">ПО ТУ СТОРОНУ ЭКРАНА</p>
    <h1>Люди, которые создают кино<span class="heading-dot">.</span></h1>
    <p class="page-description">
      Большие истории начинаются с талантливых людей.<br />Знакомьтесь с
      актёрами и режиссёрами со всего мира.
    </p>
    <div v-if="error" class="empty-state">
      <h2>Не удалось загрузить персон</h2>
      <button class="button button-primary" @click="refresh()">
        Повторить
      </button>
    </div>
    <template v-else
      ><div class="people-grid people-directory">
        <PersonCard
          v-for="person in people"
          :key="person.id"
          :person="person"
        />
      </div>
      <div v-if="hasMore && data?.hasMore" class="load-control">
        <button class="load-button" :disabled="loading" @click="loadMore">
          {{
            loading
              ? "Загрузка…"
              : moreError
                ? "Повторить загрузку"
                : "Ещё персоны"
          }}
        </button>
      </div></template
    >
  </div>
</template>
