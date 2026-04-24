<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '@stores/cart'

const cartStore = useCartStore()

onMounted(() => {
  void cartStore.loadCart()
})
</script>

<template>
  <section class="content-container py-12">
    <h1 class="text-3xl-semi">Cart</h1>
    <p class="mt-3 text-base-regular text-grey-60">
      Cart client state is ready for component migration.
    </p>
  </section>
</template>
