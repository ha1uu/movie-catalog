<script setup lang="ts">
const { data, error, refresh } = await useFetch("/api/people");
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
      актёрами и режиссёрами нашей коллекции.
    </p>
    <div v-if="error" class="empty-state">
      <h2>Не удалось загрузить персон</h2>
      <button class="button button-primary" @click="refresh()">
        Повторить
      </button>
    </div>
    <div v-else class="people-grid people-directory">
      <PersonCard v-for="person in data" :key="person.id" :person="person" />
    </div>
  </div>
</template>
