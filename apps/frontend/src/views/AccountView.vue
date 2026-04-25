<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useCustomerStore } from '@stores/customer'
import { useRegionStore } from '@stores/region'

const customerStore = useCustomerStore()
const regionStore = useRegionStore()
const router = useRouter()

const { customer, isLoading } = storeToRefs(customerStore)
const { countryCode } = storeToRefs(regionStore)

const displayName = computed(() => {
  const firstName = customer.value?.first_name
  const lastName = customer.value?.last_name
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return fullName || customer.value?.email || 'Клиент'
})

async function signout() {
  await customerStore.signout()
  await router.push(`/${countryCode.value}/login`)
}

onMounted(() => {
  void customerStore.loadCustomer()
})
</script>

<template>
  <section class="content-container py-12">
    <div v-if="isLoading && !customer" class="max-w-2xl space-y-4">
      <div class="h-5 w-24 animate-pulse rounded bg-grey-10" />
      <div class="h-12 w-3/4 animate-pulse rounded bg-grey-10" />
      <div class="h-20 animate-pulse rounded bg-grey-10" />
    </div>

    <div v-else-if="customer" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Аккаунт</p>
        <h1 class="mt-4 text-3xl-semi text-grey-90">{{ displayName }}</h1>
        <p class="mt-3 text-base-regular text-grey-60">{{ customer.email }}</p>
      </div>

      <div class="rounded-rounded border border-grey-20 bg-white p-5">
        <nav class="grid gap-2 text-base-regular">
          <RouterLink :to="`/${countryCode}/account/profile`">Профиль</RouterLink>
          <RouterLink :to="`/${countryCode}/account/addresses`">Адреса</RouterLink>
          <RouterLink :to="`/${countryCode}/account/orders`">Заказы</RouterLink>
        </nav>

        <button
          type="button"
          class="mt-6 h-11 w-full rounded-base border border-grey-20 px-4 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="isLoading"
          @click="signout"
        >
          Выйти
        </button>
      </div>
    </div>

    <div v-else class="max-w-2xl">
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Аккаунт</p>
      <h1 class="mt-4 text-3xl-semi text-grey-90">Войдите в аккаунт</h1>
      <p class="mt-3 text-base-regular text-grey-60">
        Войдите или создайте аккаунт, чтобы сохранить корзину и данные покупателя.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink
          :to="`/${countryCode}/login?redirect=/${countryCode}/account`"
          class="inline-flex h-11 items-center rounded-base bg-black px-5 text-small-semi text-white hover:bg-grey-80 hover:text-white"
        >
          Войти
        </RouterLink>
        <RouterLink
          :to="`/${countryCode}/register?redirect=/${countryCode}/account`"
          class="inline-flex h-11 items-center rounded-base border border-grey-20 px-5 text-small-semi text-grey-90 hover:border-grey-40"
        >
          Создать аккаунт
        </RouterLink>
      </div>
    </div>
  </section>
</template>
