<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRegionStore } from '@stores/region'

const regionStore = useRegionStore()
const { countryCode } = storeToRefs(regionStore)
</script>

<template>
  <div class="min-h-screen bg-white text-grey-90">
    <header class="sticky top-0 z-20 border-b border-grey-20 bg-white">
      <nav class="content-container flex h-16 items-center justify-between gap-6">
        <RouterLink :to="`/${countryCode || ''}`" class="text-large-semi">Storefront</RouterLink>
        <div class="flex items-center gap-4 text-small-regular">
          <RouterLink :to="`/${countryCode || ''}/store`">Store</RouterLink>
          <RouterLink :to="`/${countryCode || ''}/cart`">Cart</RouterLink>
          <RouterLink :to="`/${countryCode || ''}/account`">Account</RouterLink>
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="border-t border-grey-20">
      <div class="content-container py-8 text-small-regular text-grey-50">ERW Storefront</div>
    </footer>
  </div>
</template>
