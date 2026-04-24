<script setup lang="ts">
import { onMounted } from 'vue'
import { useCustomerStore } from '@stores/customer'

const customerStore = useCustomerStore()

onMounted(() => {
  void customerStore.loadCustomer()
})
</script>

<template>
  <section class="content-container py-12">
    <h1 class="text-3xl-semi">Account</h1>
    <p class="mt-3 text-base-regular text-grey-60">
      Customer auth and profile state are ready for account module migration.
    </p>
  </section>
</template>
