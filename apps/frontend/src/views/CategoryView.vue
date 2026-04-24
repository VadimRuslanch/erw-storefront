<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section class="content-container py-12">
    <h1 class="text-3xl-semi">Category</h1>
    <p class="mt-3 text-base-regular text-grey-60">{{ route.params.category }}</p>
  </section>
</template>
