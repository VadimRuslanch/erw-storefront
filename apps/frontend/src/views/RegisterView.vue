<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '@stores/customer'
import { useRegionStore } from '@stores/region'

const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()
const regionStore = useRegionStore()

const { isLoading } = storeToRefs(customerStore)
const { countryCode } = storeToRefs(regionStore)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const errorMessage = ref<string | null>(null)

const loginLink = computed(() => {
  return {
    path: `/${countryCode.value}/login`,
    query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
  }
})

function getRedirectPath() {
  const rawRedirect = route.query.redirect
  const redirect = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect

  if (redirect && redirect.startsWith(`/${countryCode.value}/`)) {
    return redirect
  }

  return `/${countryCode.value}/account`
}

async function submitRegister() {
  errorMessage.value = null

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают.'
    return
  }

  try {
    await customerStore.signup({
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    })
    await router.push(getRedirectPath())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <section
    class="content-container grid min-h-[calc(100vh-8rem)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center"
  >
    <div class="max-w-2xl">
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Аккаунт</p>
      <h1 class="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none text-grey-90">
        Создать аккаунт
      </h1>
      <p class="mt-5 text-base-regular text-grey-60">
        Зарегистрируйте профиль покупателя, чтобы сохранить свои данные и привязать корзину к
        аккаунту.
      </p>
    </div>

    <form
      class="rounded-rounded border border-grey-20 bg-white p-6"
      @submit.prevent="submitRegister"
    >
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Имя</span>
          <input
            v-model.trim="form.firstName"
            type="text"
            autocomplete="given-name"
            required
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>

        <label class="block">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Фамилия</span>
          <input
            v-model.trim="form.lastName"
            type="text"
            autocomplete="family-name"
            required
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>

        <label class="block sm:col-span-2">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Email</span>
          <input
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            required
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>

        <label class="block sm:col-span-2">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Телефон</span>
          <input
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>

        <label class="block">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Пароль</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>

        <label class="block">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50"
            >Подтверждение</span
          >
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
          />
        </label>
      </div>

      <p
        v-if="errorMessage"
        class="mt-4 rounded-base border border-red-200 bg-red-50 px-4 py-3 text-small-regular text-red-700"
      >
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="mt-6 h-12 w-full rounded-base bg-black px-5 text-small-semi text-white transition hover:bg-grey-80 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Создаём...' : 'Создать аккаунт' }}
      </button>

      <p class="mt-5 text-center text-small-regular text-grey-60">
        Уже зарегистрированы?
        <RouterLink :to="loginLink" class="font-semibold text-grey-90"> Войти </RouterLink>
      </p>
    </form>
  </section>
</template>
