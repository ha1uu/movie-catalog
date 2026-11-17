<script setup lang="ts">
const props = defineProps<{ error: unknown }>();
const isDevelopment = import.meta.dev;
const code = computed(() => {
  let current: unknown = props.error;
  for (let level = 0; level < 4; level++) {
    if (!current || typeof current !== "object") return "";
    const value = current as Record<string, unknown>;
    if (typeof value.code === "string") return value.code;
    current = value.data;
  }
  return "";
});
const hints: Record<string, string> = {
  CATALOG_NOT_CONFIGURED:
    "Создайте .env рядом с package.json и заполните NUXT_TMDB_READ_TOKEN своим API Read Access Token TMDB. Сохраните файл и перезапустите сервер.",
  CATALOG_AUTH_FAILED:
    "TMDB отклонил аутентификацию или доступ. Проверьте API Read Access Token: без префикса Bearer; API Key (v3) сюда не подходит.",
  CATALOG_UNAVAILABLE:
    "Сервер приложения не может соединиться с TMDB. Проверьте сеть, доступ к api.themoviedb.org и настройки HTTPS-прокси, если используете его.",
  CATALOG_RATE_LIMITED:
    "Достигнут лимит запросов TMDB. Подождите и повторите запрос.",
  CATALOG_UPSTREAM_ERROR:
    "TMDB вернул ошибку. Проверьте доступность сервиса и повторите запрос позже.",
};
</script>
<template>
  <aside
    v-if="isDevelopment && hints[code]"
    class="catalog-setup-hint"
    aria-label="Диагностика для локального запуска"
  >
    <strong>Локальный запуск: {{ code }}</strong>
    <p>{{ hints[code] }}</p>
    <p>Проверка в терминале: <code>npm run doctor</code></p>
    <a
      v-if="code === 'CATALOG_NOT_CONFIGURED' || code === 'CATALOG_AUTH_FAILED'"
      href="https://www.themoviedb.org/settings/api"
      target="_blank"
      rel="noopener noreferrer"
      >Настройки TMDB API ↗</a
    >
  </aside>
</template>
