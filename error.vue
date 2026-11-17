<script setup lang="ts">
defineProps<{ error: { statusCode?: number } }>();
</script>
<template>
  <div class="error-page">
    <NuxtLink to="/" class="brand"
      >кадр<span class="brand-dot">.</span></NuxtLink
    ><span class="error-code">{{ error.statusCode || 500 }}</span>
    <h1>
      {{ error.statusCode === 404 ? "Этот кадр потерялся" : "Небольшая пауза" }}
    </h1>
    <p>
      {{
        error.statusCode === 404
          ? "Такой страницы нет. Но впереди ещё много хорошего кино."
          : "Не удалось загрузить страницу. Попробуйте вернуться в каталог."
      }}
    </p>
    <button
      class="button button-primary"
      @click="clearError({ redirect: '/' })"
    >
      На главную<AppIcon name="arrow" />
    </button>
  </div>
</template>
