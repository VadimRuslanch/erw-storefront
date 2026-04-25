<script setup lang="ts">
import { onMounted } from 'vue'
import { useCatalogStore } from '@stores/catalog'
import CatalogCover from '@/components/CatalogCover.vue'

const catalogStore = useCatalogStore()

onMounted(() => {
  void catalogStore.loadCollections()
})
</script>

<template>
  <section class="catalog-page" aria-label="Обложка каталога ERAWADEE 2026">
    <CatalogCover />
  </section>
</template>

<style scoped>
.catalog-page {
  min-height: calc(100vh - 64px);
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.86), rgb(var(--white-rgb) / 0.96)),
    var(--cream);
}

@media (max-width: 640px) {
  .catalog-page {
    padding: 0;
  }
}
</style>
