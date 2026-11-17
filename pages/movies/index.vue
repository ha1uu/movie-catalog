<script setup lang="ts">
useSeoMeta({
  title: "Каталог фильмов — Кадр",
  description:
    "Выберите фильм по жанру, году и рейтингу. Соберите свою коллекцию кино.",
});
</script>
<template>
  <div class="container inner-page">
    <p class="eyebrow muted-eyebrow">ОТКРЫВАЙТЕ НОВОЕ</p>
    <h1>Хорошее кино ближе, чем кажется<span class="heading-dot">.</span></h1>
    <CatalogFeed />
  </div>
</template>
