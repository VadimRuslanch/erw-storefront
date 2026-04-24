<script setup lang="ts">
import { onMounted } from 'vue'
import { useCatalogStore } from '@stores/catalog'

const catalogStore = useCatalogStore()

onMounted(() => {
  void catalogStore.loadCollections()
})
</script>

<template>
  <section class="content-container py-12">
    <h1 class="text-3xl-semi">Home</h1>
    <p class="mt-3 text-base-regular text-grey-60">
      Vue SPA shell is ready for the home module migration.
    </p>
  </section>
</template>
