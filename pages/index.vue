<script setup lang="ts">
useSeoMeta({
  title: "Кадр — найдите свою историю",
  description:
    "Фильмы, к которым хочется возвращаться. Откройте каталог, выберите жанр и найдите кино на вечер.",
});
</script>
<template>
  <div class="container home">
    <div class="intro">
      <div>
        <p class="eyebrow muted-eyebrow">ДЛЯ ТЕХ, КТО ЛЮБИТ КИНО</p>
        <h1>Каждый кадр — новая история<span class="heading-dot">.</span></h1>
      </div>
      <p>Открывайте. Вдохновляйтесь.<br />Находите своё кино.</p>
    </div>
    <FeaturedMovie /><CatalogFeed />
    <section class="editorial">
      <div class="editorial-icon"><AppIcon name="spark" :size="34" /></div>
      <div>
        <span class="eyebrow">ПО ТУ СТОРОНУ ЭКРАНА</span>
        <h2>За каждым фильмом — люди.</h2>
        <p>Познакомьтесь с теми, кто превращает истории в кино.</p>
      </div>
      <NuxtLink to="/people" class="button button-secondary"
        >Все персоны<AppIcon name="arrow" :size="18"
      /></NuxtLink>
    </section>
  </div>
</template>
