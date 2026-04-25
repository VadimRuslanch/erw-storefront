<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { listCartPaymentMethods } from '@api/payment'
import { convertToLocale } from '@lib/util/money'
import { useCartStore } from '@stores/cart'
import { useCheckoutStore } from '@stores/checkout'
import { useRegionStore } from '@stores/region'

type CheckoutAddress = {
  first_name: string
  last_name: string
  phone: string
  company: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()
const regionStore = useRegionStore()
const router = useRouter()

const { cart, shippingOptions, isLoading } = storeToRefs(cartStore)
const { isSubmitting } = storeToRefs(checkoutStore)
const { countryCode } = storeToRefs(regionStore)

const contact = reactive({
  email: '',
})

const shippingAddress = reactive<CheckoutAddress>({
  first_name: '',
  last_name: '',
  phone: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  province: '',
  postal_code: '',
  country_code: '',
})

const billingAddress = reactive<CheckoutAddress>({
  first_name: '',
  last_name: '',
  phone: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  province: '',
  postal_code: '',
  country_code: '',
})

const useShippingAsBilling = ref(true)
const selectedShippingOptionId = ref<string | null>(null)
const selectedPaymentProviderId = ref<string | null>(null)
const paymentProviders = ref<HttpTypes.StorePaymentProvider[]>([])
const stepMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const isSavingAddress = ref(false)
const isLoadingShipping = ref(false)
const isLoadingPayments = ref(false)

const cartItems = computed(() => cart.value?.items ?? [])
const hasItems = computed(() => cartItems.value.length > 0)

const currencyCode = computed(() => {
  return cart.value?.currency_code || cart.value?.region?.currency_code || 'usd'
})

const cartLink = computed(() => `/${countryCode.value}/cart`)
const storeLink = computed(() => `/${countryCode.value}/store`)

const selectedPaymentSession = computed(() => {
  return cart.value?.payment_collection?.payment_sessions?.find((session) => {
    return session.provider_id === selectedPaymentProviderId.value
  })
})

const canPlaceOrder = computed(() => {
  if (!cart.value || !hasItems.value || isSubmitting.value) {
    return false
  }

  if (!cart.value.shipping_methods?.length) {
    return false
  }

  if (cart.value.total > 0 && !selectedPaymentProviderId.value) {
    return false
  }

  return true
})

function formatAmount(amount?: number | null) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode.value,
  })
}

function getShippingOptionAmount(option: HttpTypes.StoreCartShippingOption) {
  return option.calculated_price?.calculated_amount ?? option.amount ?? 0
}

function copyAddress(target: CheckoutAddress, source?: Partial<CheckoutAddress> | null) {
  target.first_name = source?.first_name ?? ''
  target.last_name = source?.last_name ?? ''
  target.phone = source?.phone ?? ''
  target.company = source?.company ?? ''
  target.address_1 = source?.address_1 ?? ''
  target.address_2 = source?.address_2 ?? ''
  target.city = source?.city ?? ''
  target.province = source?.province ?? ''
  target.postal_code = source?.postal_code ?? ''
  target.country_code = source?.country_code ?? countryCode.value ?? ''
}

function toStoreAddress(address: CheckoutAddress): HttpTypes.StoreAddAddress {
  return {
    first_name: address.first_name,
    last_name: address.last_name,
    phone: address.phone || null,
    company: address.company || null,
    address_1: address.address_1,
    address_2: address.address_2 || null,
    city: address.city,
    province: address.province || null,
    postal_code: address.postal_code,
    country_code: address.country_code || countryCode.value,
  }
}

function hydrateFromCart() {
  if (!cart.value) {
    return
  }

  contact.email = cart.value.email ?? ''
  copyAddress(shippingAddress, cart.value.shipping_address)
  copyAddress(billingAddress, cart.value.billing_address ?? cart.value.shipping_address)
  selectedShippingOptionId.value = cart.value.shipping_methods?.[0]?.shipping_option_id ?? null
}

async function loadPaymentProviders() {
  if (!cart.value?.region_id) {
    paymentProviders.value = []
    return
  }

  isLoadingPayments.value = true

  try {
    paymentProviders.value = (await listCartPaymentMethods(cart.value.region_id)) ?? []

    if (!selectedPaymentProviderId.value) {
      selectedPaymentProviderId.value =
        cart.value.payment_collection?.payment_sessions?.[0]?.provider_id ??
        paymentProviders.value[0]?.id ??
        null
    }
  } finally {
    isLoadingPayments.value = false
  }
}

async function loadShippingOptions() {
  if (!cart.value?.id) {
    return
  }

  isLoadingShipping.value = true

  try {
    await cartStore.loadShippingOptions()

    if (!selectedShippingOptionId.value) {
      selectedShippingOptionId.value =
        cart.value.shipping_methods?.[0]?.shipping_option_id ?? shippingOptions.value[0]?.id ?? null
    }
  } finally {
    isLoadingShipping.value = false
  }
}

async function saveAddresses() {
  if (!cart.value) {
    return
  }

  isSavingAddress.value = true
  errorMessage.value = null
  stepMessage.value = null

  try {
    await checkoutStore.updateAddresses({
      email: contact.email,
      shipping_address: toStoreAddress(shippingAddress),
      billing_address: useShippingAsBilling.value
        ? toStoreAddress(shippingAddress)
        : toStoreAddress(billingAddress),
    })
    await cartStore.loadCart(cart.value.id)
    hydrateFromCart()
    await loadShippingOptions()
    await loadPaymentProviders()
    stepMessage.value = 'Данные оформления сохранены.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  } finally {
    isSavingAddress.value = false
  }
}

async function chooseShippingMethod() {
  if (!selectedShippingOptionId.value) {
    return
  }

  errorMessage.value = null
  stepMessage.value = null

  try {
    await cartStore.setShippingMethod(selectedShippingOptionId.value)
    hydrateFromCart()
    stepMessage.value = 'Способ доставки выбран.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  }
}

async function initializePayment() {
  if (!cart.value || cart.value.total <= 0 || !selectedPaymentProviderId.value) {
    return
  }

  errorMessage.value = null
  stepMessage.value = null

  try {
    await checkoutStore.initializePayment(cart.value, {
      provider_id: selectedPaymentProviderId.value,
    })
    await cartStore.loadCart(cart.value.id)
    stepMessage.value = 'Оплата инициализирована.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  }
}

async function placeOrder() {
  if (!cart.value) {
    return
  }

  errorMessage.value = null
  stepMessage.value = null

  try {
    if (!cart.value.shipping_methods?.length) {
      await chooseShippingMethod()
    }

    if (cart.value.total > 0 && !selectedPaymentSession.value) {
      await initializePayment()
    }

    const result = await checkoutStore.submitOrder(cart.value.id)

    if (result?.type === 'order') {
      await router.push(`/${countryCode.value}/order/${result.order.id}/confirmed`)
      return
    }

    errorMessage.value = result?.error?.message ?? 'Не удалось оформить заказ.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  }
}

onMounted(async () => {
  await cartStore.loadCart()
  hydrateFromCart()
  await loadShippingOptions()
  await loadPaymentProviders()
})
</script>

<template>
  <section>
    <div class="mb-8">
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Оформление</p>
      <h1 class="mt-4 text-3xl-semi text-grey-90">Оформление заказа</h1>
    </div>

    <div v-if="isLoading && !cart" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-5">
        <div class="h-52 animate-pulse rounded-rounded bg-grey-10" />
        <div class="h-64 animate-pulse rounded-rounded bg-grey-10" />
      </div>
      <div class="h-72 animate-pulse rounded-rounded bg-grey-10" />
    </div>

    <div
      v-else-if="!hasItems"
      class="rounded-rounded border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
    >
      <h2 class="text-xl-semi text-grey-90">Ваша корзина пуста</h2>
      <p class="mt-3 text-base-regular text-grey-60">Добавьте товары перед оформлением заказа.</p>
      <RouterLink
        :to="storeLink"
        class="mt-6 inline-flex h-11 items-center rounded-base bg-black px-5 text-small-semi text-white hover:bg-grey-80 hover:text-white"
      >
        Перейти к покупкам
      </RouterLink>
    </div>

    <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form class="space-y-6" @submit.prevent="placeOrder">
        <section class="rounded-rounded border border-grey-20 bg-white p-5">
          <div class="flex items-start justify-between gap-4 border-b border-grey-20 pb-4">
            <div>
              <h2 class="text-large-semi text-grey-90">Контакты</h2>
              <p class="text-small-regular text-grey-50">Email для обновлений по заказу</p>
            </div>
          </div>

          <label class="mt-5 block">
            <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Email</span>
            <input
              v-model.trim="contact.email"
              type="email"
              autocomplete="email"
              required
              class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
            />
          </label>
        </section>

        <section class="rounded-rounded border border-grey-20 bg-white p-5">
          <div class="border-b border-grey-20 pb-4">
            <h2 class="text-large-semi text-grey-90">Адрес доставки</h2>
            <p class="text-small-regular text-grey-50">Куда доставить заказ</p>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Имя</span>
              <input
                v-model.trim="shippingAddress.first_name"
                type="text"
                autocomplete="given-name"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Фамилия</span>
              <input
                v-model.trim="shippingAddress.last_name"
                type="text"
                autocomplete="family-name"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block sm:col-span-2">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Адрес</span>
              <input
                v-model.trim="shippingAddress.address_1"
                type="text"
                autocomplete="shipping address-line1"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block sm:col-span-2">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50"
                >Квартира / офис</span
              >
              <input
                v-model.trim="shippingAddress.address_2"
                type="text"
                autocomplete="shipping address-line2"
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Город</span>
              <input
                v-model.trim="shippingAddress.city"
                type="text"
                autocomplete="shipping address-level2"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Регион</span>
              <input
                v-model.trim="shippingAddress.province"
                type="text"
                autocomplete="shipping address-level1"
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Индекс</span>
              <input
                v-model.trim="shippingAddress.postal_code"
                type="text"
                autocomplete="shipping postal-code"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Страна</span>
              <input
                v-model.trim="shippingAddress.country_code"
                type="text"
                autocomplete="shipping country"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular uppercase text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>

            <label class="block sm:col-span-2">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Телефон</span>
              <input
                v-model.trim="shippingAddress.phone"
                type="tel"
                autocomplete="tel"
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
          </div>

          <label class="mt-5 flex items-center gap-3 text-base-regular text-grey-70">
            <input
              v-model="useShippingAsBilling"
              type="checkbox"
              class="h-4 w-4 rounded-base border-grey-30 text-grey-90 focus:ring-grey-40"
            />
            Платёжный адрес совпадает с адресом доставки
          </label>
        </section>

        <section
          v-if="!useShippingAsBilling"
          class="rounded-rounded border border-grey-20 bg-white p-5"
        >
          <div class="border-b border-grey-20 pb-4">
            <h2 class="text-large-semi text-grey-90">Платёжный адрес</h2>
            <p class="text-small-regular text-grey-50">Данные для оплаты</p>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Имя</span>
              <input
                v-model.trim="billingAddress.first_name"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Фамилия</span>
              <input
                v-model.trim="billingAddress.last_name"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Адрес</span>
              <input
                v-model.trim="billingAddress.address_1"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Город</span>
              <input
                v-model.trim="billingAddress.city"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Индекс</span>
              <input
                v-model.trim="billingAddress.postal_code"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Страна</span>
              <input
                v-model.trim="billingAddress.country_code"
                type="text"
                required
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular uppercase text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
            <label class="block">
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Телефон</span>
              <input
                v-model.trim="billingAddress.phone"
                type="tel"
                class="mt-2 h-12 w-full rounded-base border border-grey-20 px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
            </label>
          </div>
        </section>

        <section class="rounded-rounded border border-grey-20 bg-white p-5">
          <div
            class="flex flex-wrap items-center justify-between gap-4 border-b border-grey-20 pb-4"
          >
            <div>
              <h2 class="text-large-semi text-grey-90">Доставка</h2>
              <p class="text-small-regular text-grey-50">Доступные способы доставки</p>
            </div>
            <button
              type="button"
              class="h-10 rounded-base border border-grey-20 px-4 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="isSavingAddress"
              @click="saveAddresses"
            >
              {{ isSavingAddress ? 'Сохраняем...' : 'Сохранить данные' }}
            </button>
          </div>

          <div v-if="isLoadingShipping" class="mt-5 space-y-3">
            <div
              v-for="index in 2"
              :key="index"
              class="h-16 animate-pulse rounded-rounded bg-grey-10"
            />
          </div>

          <div v-else-if="shippingOptions.length" class="mt-5 grid gap-3">
            <label
              v-for="option in shippingOptions"
              :key="option.id"
              class="flex cursor-pointer items-center justify-between gap-4 rounded-rounded border p-4 transition"
              :class="
                option.id === selectedShippingOptionId
                  ? 'border-black bg-grey-5'
                  : 'border-grey-20 hover:border-grey-40'
              "
            >
              <span class="flex items-center gap-3">
                <input
                  v-model="selectedShippingOptionId"
                  type="radio"
                  class="h-4 w-4 border-grey-30 text-grey-90 focus:ring-grey-40"
                  :value="option.id"
                  :disabled="option.insufficient_inventory"
                />
                <span>
                  <span class="block text-base-semi text-grey-90">{{ option.name }}</span>
                  <span
                    v-if="option.insufficient_inventory"
                    class="block text-small-regular text-grey-50"
                  >
                    Недостаточно товара
                  </span>
                </span>
              </span>
              <span class="text-base-semi text-grey-90">
                {{ formatAmount(getShippingOptionAmount(option)) }}
              </span>
            </label>

            <button
              type="button"
              class="h-11 w-full rounded-base border border-grey-20 px-4 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!selectedShippingOptionId"
              @click="chooseShippingMethod"
            >
              Выбрать доставку
            </button>
          </div>

          <p v-else class="mt-5 text-base-regular text-grey-60">
            Сохраните данные оформления, чтобы загрузить способы доставки.
          </p>
        </section>

        <section class="rounded-rounded border border-grey-20 bg-white p-5">
          <div class="border-b border-grey-20 pb-4">
            <h2 class="text-large-semi text-grey-90">Оплата</h2>
            <p class="text-small-regular text-grey-50">Платёжный провайдер</p>
          </div>

          <div
            v-if="cart?.total === 0"
            class="mt-5 rounded-base bg-grey-5 px-4 py-3 text-base-regular text-grey-70"
          >
            Оплата не требуется.
          </div>

          <div
            v-else-if="isLoadingPayments"
            class="mt-5 h-16 animate-pulse rounded-rounded bg-grey-10"
          />

          <div v-else-if="paymentProviders.length" class="mt-5 grid gap-3">
            <label
              v-for="provider in paymentProviders"
              :key="provider.id"
              class="flex cursor-pointer items-center gap-3 rounded-rounded border p-4 transition"
              :class="
                provider.id === selectedPaymentProviderId
                  ? 'border-black bg-grey-5'
                  : 'border-grey-20 hover:border-grey-40'
              "
            >
              <input
                v-model="selectedPaymentProviderId"
                type="radio"
                class="h-4 w-4 border-grey-30 text-grey-90 focus:ring-grey-40"
                :value="provider.id"
              />
              <span class="text-base-semi text-grey-90">{{ provider.id }}</span>
            </label>

            <button
              type="button"
              class="h-11 w-full rounded-base border border-grey-20 px-4 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!selectedPaymentProviderId"
              @click="initializePayment"
            >
              Инициализировать оплату
            </button>
          </div>

          <p v-else class="mt-5 text-base-regular text-grey-60">
            Для этого региона нет доступных платёжных провайдеров.
          </p>
        </section>

        <p
          v-if="errorMessage"
          class="rounded-base border border-red-200 bg-red-50 px-4 py-3 text-small-regular text-red-700"
        >
          {{ errorMessage }}
        </p>
        <p
          v-else-if="stepMessage"
          class="rounded-base border border-grey-20 bg-grey-5 px-4 py-3 text-small-regular text-grey-70"
        >
          {{ stepMessage }}
        </p>

        <button
          type="submit"
          class="h-12 w-full rounded-base bg-black px-5 text-small-semi text-white transition hover:bg-grey-80 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canPlaceOrder"
        >
          {{ isSubmitting ? 'Оформляем заказ...' : 'Оформить заказ' }}
        </button>
      </form>

      <aside class="rounded-rounded border border-grey-20 bg-white p-5 lg:sticky lg:top-8">
        <h2 class="text-large-semi text-grey-90">Состав заказа</h2>

        <div class="mt-5 divide-y divide-grey-20 border-y border-grey-20">
          <article v-for="item in cartItems" :key="item.id" class="flex gap-3 py-4">
            <div
              class="h-16 w-16 shrink-0 overflow-hidden rounded-base border border-grey-20 bg-grey-5"
            >
              <img
                :src="item.thumbnail || item.product?.thumbnail || ''"
                :alt="item.product_title || item.title"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-base-semi text-grey-90">
                {{ item.product_title || item.title }}
              </p>
              <p class="text-small-regular text-grey-50">Кол-во: {{ item.quantity }}</p>
            </div>
            <p class="text-base-semi text-grey-90">
              {{ formatAmount(item.total ?? item.unit_price * item.quantity) }}
            </p>
          </article>
        </div>

        <dl class="mt-5 space-y-3 border-b border-grey-20 pb-5">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-base-regular text-grey-60">Подытог</dt>
            <dd class="text-base-semi text-grey-90">{{ formatAmount(cart?.subtotal) }}</dd>
          </div>
          <div v-if="cart?.discount_total" class="flex items-center justify-between gap-4">
            <dt class="text-base-regular text-grey-60">Скидка</dt>
            <dd class="text-base-semi text-grey-90">-{{ formatAmount(cart.discount_total) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-base-regular text-grey-60">Доставка</dt>
            <dd class="text-base-semi text-grey-90">{{ formatAmount(cart?.shipping_total) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-base-regular text-grey-60">Налоги</dt>
            <dd class="text-base-semi text-grey-90">{{ formatAmount(cart?.tax_total) }}</dd>
          </div>
        </dl>

        <div class="mt-5 flex items-center justify-between gap-4">
          <span class="text-large-semi text-grey-90">Итого</span>
          <span class="text-xl-semi text-grey-90">{{ formatAmount(cart?.total) }}</span>
        </div>

        <RouterLink
          :to="cartLink"
          class="mt-6 flex h-11 w-full items-center justify-center rounded-base border border-grey-20 px-4 text-small-semi text-grey-90 transition hover:border-grey-40"
        >
          Вернуться в корзину
        </RouterLink>
      </aside>
    </div>
  </section>
</template>
