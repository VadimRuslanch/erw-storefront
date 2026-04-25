<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRegionStore } from '@stores/region'

const regionStore = useRegionStore()
const { countryCode } = storeToRefs(regionStore)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-grey-90">
    <header class="border-b border-grey-20">
      <nav class="content-container flex h-16 items-center justify-between">
        <RouterLink :to="`/${countryCode || ''}/cart`" class="text-small-regular"
          >Back to cart</RouterLink
        >
        <RouterLink :to="`/${countryCode || ''}`" class="text-large-semi">Storefront</RouterLink>
      </nav>
    </header>

    <main class="content-container flex-1 py-12">
      <RouterView />
    </main>
  </div>
</template>
