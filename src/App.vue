<script setup lang="ts">
import { RouterView } from "vue-router";
import TheHeader from "@/components/TheHeader.vue";
</script>

<template>
  <TheHeader />
  <main class="container__main--out">
    <RouterView />
  </main>
</template>
