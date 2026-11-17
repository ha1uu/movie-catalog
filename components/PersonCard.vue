<script setup lang="ts">
import type { Person } from "~/shared/types/catalog";
defineProps<{ person: Person }>();
const failed = ref(false);
</script>
<template>
  <NuxtLink :to="`/people/${person.id}`" class="person-card"
    ><div class="person-avatar" :style="{ '--person-color': person.color }">
      <img
        v-if="person.photo && !failed"
        :src="person.photo"
        :alt="person.name"
        width="342"
        height="513"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      /><span v-else>{{ person.initials }}</span
      ><AppIcon name="arrow" />
    </div>
    <h3>{{ person.name }}</h3>
    <p>{{ person.role }}</p></NuxtLink
  >
</template>
