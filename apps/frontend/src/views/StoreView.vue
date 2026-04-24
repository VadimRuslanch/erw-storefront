<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCatalogStore } from '@stores/catalog'
import { useRegionStore } from '@stores/region'

const catalogStore = useCatalogStore()
const regionStore = useRegionStore()
const { countryCode } = storeToRefs(regionStore)

onMounted(() => {
  if (countryCode.value) {
    void catalogStore.loadProducts({ countryCode: countryCode.value })
  }
})
</script>

<template>
  <section class="content-container py-12">
    <h1 class="text-3xl-semi">Store</h1>
    <p class="mt-3 text-base-regular text-grey-60">
      Product listing API and store state are wired for the Vue migration.
    </p>
  </section>
</template>
