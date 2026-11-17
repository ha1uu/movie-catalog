<script setup lang="ts">
import type { Person } from "~/shared/types/catalog";
defineProps<{ person: Person }>();
</script>
<template>
  <NuxtLink :to="`/people/${person.id}`" class="person-card"
    ><div class="person-avatar" :style="{ '--person-color': person.color }">
      <span>{{ person.initials }}</span
      ><AppIcon name="arrow" />
    </div>
    <h3>{{ person.name }}</h3>
    <p>{{ person.role }}</p></NuxtLink
  >
</template>
