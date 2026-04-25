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

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="%23f3f4f6"/><path d="M188 520l96-120 76 96 44-52 112 140H188z" fill="%23d1d5db"/><circle cx="254" cy="262" r="44" fill="%23d1d5db"/></svg>'

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
const isPreparingCheckout = ref(false)

const cartItems = computed(() => cart.value?.items ?? [])
const hasItems = computed(() => cartItems.value.length > 0)
const itemCount = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

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
  if (!cart.value || !hasItems.value || isPreparingCheckout.value || isSubmitting.value) {
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

function itemImage(item: HttpTypes.StoreCartLineItem) {
  return item.thumbnail || item.product?.thumbnail || placeholderImage
}

function itemTitle(item: HttpTypes.StoreCartLineItem) {
  return item.product_title || item.product?.title || item.title
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

function selectDefaultShippingOption() {
  const cartShippingOptionId = cart.value?.shipping_methods?.[0]?.shipping_option_id ?? null
  const selectableOptions = shippingOptions.value.filter((option) => !option.insufficient_inventory)
  const selectedIsAvailable = selectableOptions.some((option) => {
    return option.id === selectedShippingOptionId.value
  })

  selectedShippingOptionId.value =
    cartShippingOptionId ??
    (selectedIsAvailable ? selectedShippingOptionId.value : null) ??
    selectableOptions[0]?.id ??
    shippingOptions.value[0]?.id ??
    null
}

function selectDefaultPaymentProvider() {
  const existingSessionProviderId =
    cart.value?.payment_collection?.payment_sessions?.[0]?.provider_id ?? null
  const selectedIsAvailable = paymentProviders.value.some((provider) => {
    return provider.id === selectedPaymentProviderId.value
  })

  selectedPaymentProviderId.value =
    existingSessionProviderId ??
    (selectedIsAvailable ? selectedPaymentProviderId.value : null) ??
    paymentProviders.value[0]?.id ??
    null
}

async function loadPaymentProviders() {
  if (!cart.value?.region_id) {
    paymentProviders.value = []
    return
  }

  isLoadingPayments.value = true

  try {
    paymentProviders.value = (await listCartPaymentMethods(cart.value.region_id)) ?? []
    selectDefaultPaymentProvider()
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
    selectDefaultShippingOption()
  } finally {
    isLoadingShipping.value = false
  }
}

async function saveAddresses({ silent = false }: { silent?: boolean } = {}) {
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
    if (!silent) {
      stepMessage.value = 'Данные оформления сохранены.'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
    throw err
  } finally {
    isSavingAddress.value = false
  }
}

async function chooseShippingMethod({ silent = false }: { silent?: boolean } = {}) {
  if (!selectedShippingOptionId.value) {
    await loadShippingOptions()
    selectDefaultShippingOption()
  }

  if (!selectedShippingOptionId.value) {
    throw new Error('Не найден временный способ доставки для этого заказа.')
  }

  errorMessage.value = null
  stepMessage.value = null

  try {
    await cartStore.setShippingMethod(selectedShippingOptionId.value)
    hydrateFromCart()
    if (!silent) {
      stepMessage.value = 'Способ доставки выбран.'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
    throw err
  }
}

async function initializePayment({ silent = false }: { silent?: boolean } = {}) {
  if (!cart.value || cart.value.total <= 0) {
    return
  }

  if (!selectedPaymentProviderId.value) {
    await loadPaymentProviders()
    selectDefaultPaymentProvider()
  }

  if (!selectedPaymentProviderId.value) {
    throw new Error('Не найден временный платёжный провайдер для этого заказа.')
  }

  errorMessage.value = null
  stepMessage.value = null

  try {
    await checkoutStore.initializePayment(cart.value, {
      provider_id: selectedPaymentProviderId.value,
    })
    await cartStore.loadCart(cart.value.id)
    if (!silent) {
      stepMessage.value = 'Оплата инициализирована.'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
    throw err
  }
}

async function prepareHiddenCheckoutFields() {
  await saveAddresses({ silent: true })

  if (!cart.value?.shipping_methods?.length) {
    await chooseShippingMethod({ silent: true })
  }

  if (cart.value && cart.value.total > 0 && !selectedPaymentSession.value) {
    await initializePayment({ silent: true })
  }
}

async function placeOrder() {
  if (!cart.value) {
    return
  }

  errorMessage.value = null
  stepMessage.value = null
  isPreparingCheckout.value = true

  try {
    await prepareHiddenCheckoutFields()

    const result = await checkoutStore.submitOrder(cart.value.id)

    if (result?.type === 'order') {
      await router.push(`/${countryCode.value}/order/${result.order.id}/confirmed`)
      return
    }

    errorMessage.value = result?.error?.message ?? 'Не удалось оформить заказ.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  } finally {
    isPreparingCheckout.value = false
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
  <section class="checkout-hero">
    <div class="checkout-hero__panel">
      <div class="checkout-hero__eyebrow">
        <span class="checkout-hero__eyebrow-line" aria-hidden="true" />
        <p class="checkout-hero__kicker">Финальный шаг</p>
      </div>

      <div class="checkout-hero__content">
        <div>
          <p class="checkout-hero__label">Оформление</p>
          <h1 class="checkout-hero__title">Оформление заказа</h1>
          <p class="checkout-hero__description">
            Заполните контактные данные и адрес, а временные параметры доставки и оплаты будут
            подготовлены автоматически.
          </p>
        </div>

        <dl class="checkout-hero__stats" aria-label="Сводка по оформлению">
          <div class="checkout-hero__stat">
            <dt>Позиции</dt>
            <dd>{{ itemCount }}</dd>
          </div>
          <div class="checkout-hero__stat">
            <dt>Итого</dt>
            <dd>{{ formatAmount(cart?.total) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <div v-if="isLoading && !cart" class="checkout-loading">
    <div class="checkout-loading__form">
      <div class="checkout-loading__panel" />
      <div class="checkout-loading__panel checkout-loading__panel--tall" />
    </div>
    <div class="checkout-loading__summary" />
  </div>

  <div v-else-if="!hasItems" class="checkout-state">
    <p class="checkout-state__eyebrow">Оформление</p>
    <h2 class="checkout-state__title">Ваша корзина пуста</h2>
    <p class="checkout-state__description">
      Добавьте товары перед оформлением заказа, и здесь появится сводка по доставке и оплате.
    </p>
    <RouterLink :to="storeLink" class="checkout-button checkout-button--primary">
      Перейти к покупкам
    </RouterLink>
  </div>

  <div v-else class="checkout-shell">
    <form class="checkout-form" @submit.prevent="placeOrder">
      <section class="checkout-panel">
        <div class="checkout-panel__header">
          <div>
            <p class="checkout-panel__eyebrow">Шаг 1</p>
            <h2 class="checkout-panel__title">Контакты</h2>
            <p class="checkout-panel__meta">Email для обновлений по заказу</p>
          </div>
        </div>

        <label class="checkout-field checkout-field--wide">
          <span class="checkout-field__label">Email</span>
          <input
            v-model.trim="contact.email"
            type="email"
            autocomplete="email"
            required
            class="checkout-input"
          />
        </label>
      </section>

      <section class="checkout-panel">
        <div class="checkout-panel__header">
          <div>
            <p class="checkout-panel__eyebrow">Шаг 2</p>
            <h2 class="checkout-panel__title">Адрес доставки</h2>
            <p class="checkout-panel__meta">Куда доставить заказ</p>
          </div>
        </div>

        <div class="checkout-fields">
          <label class="checkout-field">
            <span class="checkout-field__label">Имя</span>
            <input
              v-model.trim="shippingAddress.first_name"
              type="text"
              autocomplete="given-name"
              required
              class="checkout-input"
            />
          </label>

          <label class="checkout-field">
            <span class="checkout-field__label">Фамилия</span>
            <input
              v-model.trim="shippingAddress.last_name"
              type="text"
              autocomplete="family-name"
              required
              class="checkout-input"
            />
          </label>

          <label class="checkout-field checkout-field--wide">
            <span class="checkout-field__label">Адрес</span>
            <input
              v-model.trim="shippingAddress.address_1"
              type="text"
              autocomplete="shipping address-line1"
              required
              class="checkout-input"
            />
          </label>

          <label class="checkout-field checkout-field--wide">
            <span class="checkout-field__label">Квартира / офис</span>
            <input
              v-model.trim="shippingAddress.address_2"
              type="text"
              autocomplete="shipping address-line2"
              class="checkout-input"
            />
          </label>

          <label class="checkout-field">
            <span class="checkout-field__label">Город</span>
            <input
              v-model.trim="shippingAddress.city"
              type="text"
              autocomplete="shipping address-level2"
              required
              class="checkout-input"
            />
          </label>

          <label class="checkout-field">
            <span class="checkout-field__label">Регион</span>
            <input
              v-model.trim="shippingAddress.province"
              type="text"
              autocomplete="shipping address-level1"
              class="checkout-input"
            />
          </label>

          <label class="checkout-field">
            <span class="checkout-field__label">Индекс</span>
            <input
              v-model.trim="shippingAddress.postal_code"
              type="text"
              autocomplete="shipping postal-code"
              required
              class="checkout-input"
            />
          </label>

          <label class="checkout-field">
            <span class="checkout-field__label">Страна</span>
            <input
              v-model.trim="shippingAddress.country_code"
              type="text"
              autocomplete="shipping country"
              required
              class="checkout-input checkout-input--uppercase"
            />
          </label>

          <label class="checkout-field checkout-field--wide">
            <span class="checkout-field__label">Телефон</span>
            <input
              v-model.trim="shippingAddress.phone"
              type="tel"
              autocomplete="tel"
              class="checkout-input"
            />
          </label>
        </div>

        <label class="checkout-checkbox">
          <input v-model="useShippingAsBilling" type="checkbox" class="checkout-checkbox__input" />
          <span>Платёжный адрес совпадает с адресом доставки</span>
        </label>
      </section>

      <section v-if="!useShippingAsBilling" class="checkout-panel">
        <div class="checkout-panel__header">
          <div>
            <p class="checkout-panel__eyebrow">Шаг 3</p>
            <h2 class="checkout-panel__title">Платёжный адрес</h2>
            <p class="checkout-panel__meta">Данные для оплаты</p>
          </div>
        </div>

        <div class="checkout-fields">
          <label class="checkout-field">
            <span class="checkout-field__label">Имя</span>
            <input
              v-model.trim="billingAddress.first_name"
              type="text"
              required
              class="checkout-input"
            />
          </label>
          <label class="checkout-field">
            <span class="checkout-field__label">Фамилия</span>
            <input
              v-model.trim="billingAddress.last_name"
              type="text"
              required
              class="checkout-input"
            />
          </label>
          <label class="checkout-field checkout-field--wide">
            <span class="checkout-field__label">Адрес</span>
            <input
              v-model.trim="billingAddress.address_1"
              type="text"
              required
              class="checkout-input"
            />
          </label>
          <label class="checkout-field">
            <span class="checkout-field__label">Город</span>
            <input v-model.trim="billingAddress.city" type="text" required class="checkout-input" />
          </label>
          <label class="checkout-field">
            <span class="checkout-field__label">Индекс</span>
            <input
              v-model.trim="billingAddress.postal_code"
              type="text"
              required
              class="checkout-input"
            />
          </label>
          <label class="checkout-field">
            <span class="checkout-field__label">Страна</span>
            <input
              v-model.trim="billingAddress.country_code"
              type="text"
              required
              class="checkout-input checkout-input--uppercase"
            />
          </label>
          <label class="checkout-field">
            <span class="checkout-field__label">Телефон</span>
            <input v-model.trim="billingAddress.phone" type="tel" class="checkout-input" />
          </label>
        </div>
      </section>

      <p v-if="errorMessage" class="checkout-notice checkout-notice--error">
        {{ errorMessage }}
      </p>
      <p v-else-if="stepMessage" class="checkout-notice">
        {{ stepMessage }}
      </p>

      <button
        type="submit"
        class="checkout-button checkout-button--primary checkout-button--full"
        :disabled="!canPlaceOrder"
      >
        {{ isPreparingCheckout || isSubmitting ? 'Оформляем заказ...' : 'Оформить заказ' }}
      </button>
    </form>

    <aside class="checkout-summary">
      <p class="checkout-summary__label">Состав заказа</p>
      <h2 class="checkout-summary__title">Ваш заказ</h2>

      <div class="checkout-summary__items">
        <article v-for="item in cartItems" :key="item.id" class="checkout-summary__item">
          <div class="checkout-summary__media">
            <img :src="itemImage(item)" :alt="itemTitle(item)" class="checkout-summary__image" />
          </div>
          <div class="checkout-summary__copy">
            <p class="checkout-summary__item-title">{{ itemTitle(item) }}</p>
            <p class="checkout-summary__item-meta">Кол-во: {{ item.quantity }}</p>
          </div>
          <p class="checkout-summary__item-price">
            {{ formatAmount(item.total ?? item.unit_price * item.quantity) }}
          </p>
        </article>
      </div>

      <dl class="checkout-summary__totals">
        <div class="checkout-summary__row">
          <dt>Подытог</dt>
          <dd>{{ formatAmount(cart?.subtotal) }}</dd>
        </div>
        <div v-if="cart?.discount_total" class="checkout-summary__row">
          <dt>Скидка</dt>
          <dd>-{{ formatAmount(cart.discount_total) }}</dd>
        </div>
        <div class="checkout-summary__row">
          <dt>Доставка</dt>
          <dd>{{ formatAmount(cart?.shipping_total) }}</dd>
        </div>
        <div class="checkout-summary__row">
          <dt>Налоги</dt>
          <dd>{{ formatAmount(cart?.tax_total) }}</dd>
        </div>
      </dl>

      <div class="checkout-summary__footer">
        <span>Итого</span>
        <strong>{{ formatAmount(cart?.total) }}</strong>
      </div>

      <RouterLink
        :to="cartLink"
        class="checkout-button checkout-button--ghost checkout-button--full"
      >
        Вернуться в корзину
      </RouterLink>
    </aside>
  </div>
</template>

<style scoped>
.checkout-hero {
  margin-bottom: 28px;
}

.checkout-hero__panel {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 28px;
  padding: 36px clamp(24px, 4vw, 44px);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(
    145deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 58%,
    var(--brand-dark) 100%
  );
  box-shadow: var(--shadow-soft);
}

.checkout-hero__panel::after {
  position: absolute;
  inset: auto 0 0;
  height: 4px;
  content: '';
  background: linear-gradient(
    90deg,
    rgb(var(--brand-lime-rgb) / 0.95),
    rgb(var(--brand-lime-light-rgb) / 0.95),
    rgb(var(--brand-lime-rgb) / 0.95)
  );
}

.checkout-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.checkout-hero__eyebrow-line {
  width: 48px;
  height: 1px;
  background: rgb(var(--brand-lime-light-rgb) / 0.8);
}

.checkout-hero__kicker,
.checkout-hero__label,
.checkout-panel__eyebrow,
.checkout-summary__label,
.checkout-state__eyebrow,
.checkout-field__label,
.checkout-button {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.checkout-hero__kicker {
  color: rgb(var(--cream-rgb) / 0.86);
}

.checkout-hero__content {
  display: grid;
  gap: 18px;
}

.checkout-hero__label {
  color: var(--brand-lime-light);
}

.checkout-hero__title {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.6rem, 5vw, 4.45rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.03em;
}

.checkout-hero__description {
  max-width: 640px;
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.9);
  font-size: 15px;
  line-height: 1.75;
}

.checkout-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.checkout-hero__stat {
  min-width: 160px;
  padding: 14px 16px;
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.08);
}

.checkout-hero__stat dt {
  color: rgb(var(--cream-rgb) / 0.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.checkout-hero__stat dd {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: 32px;
  line-height: 1;
}

.checkout-loading,
.checkout-shell {
  display: grid;
  gap: 28px;
}

.checkout-loading__form {
  display: grid;
  gap: 18px;
}

.checkout-loading__panel,
.checkout-loading__summary {
  border-radius: 8px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.72), rgb(var(--white-rgb) / 0.98));
  box-shadow: 0 18px 36px rgb(var(--brand-dark-rgb) / 0.08);
}

.checkout-loading__panel {
  height: 220px;
}

.checkout-loading__panel--tall {
  height: 420px;
}

.checkout-loading__summary {
  height: 480px;
}

.checkout-state {
  padding: 52px 32px;
  border: 1px dashed rgb(var(--brand-dark-rgb) / 0.22);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.48);
  text-align: center;
}

.checkout-state__eyebrow,
.checkout-panel__eyebrow,
.checkout-summary__label,
.checkout-field__label {
  color: var(--brand-olive);
}

.checkout-state__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 500;
  line-height: 1;
}

.checkout-state__description {
  max-width: 520px;
  margin: 14px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.75;
}

.checkout-form {
  display: grid;
  gap: 20px;
}

.checkout-panel {
  overflow: hidden;
  padding: 24px 22px 22px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.6), rgb(var(--white-rgb) / 0.98)),
    linear-gradient(180deg, rgb(var(--brand-lime-light-rgb) / 0.05), transparent);
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.checkout-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.checkout-panel__header--action {
  flex-wrap: wrap;
}

.checkout-panel__title {
  margin: 10px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 500;
  line-height: 1;
}

.checkout-panel__meta {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.checkout-fields {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.checkout-field {
  display: grid;
  gap: 8px;
}

.checkout-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--brand-dark);
  background: rgb(var(--white-rgb) / 0.88);
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.checkout-input:focus {
  border-color: rgb(var(--brand-lime-rgb) / 0.5);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
  background: var(--white);
}

.checkout-input--uppercase {
  text-transform: uppercase;
}

.checkout-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  color: var(--text-dark);
  font-size: 14px;
  line-height: 1.6;
}

.checkout-checkbox__input,
.checkout-choice__input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--brand-olive);
}

.checkout-panel__skeleton {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.checkout-panel__skeleton-row {
  height: 72px;
  border-radius: 8px;
  background: rgb(var(--brand-dark-rgb) / 0.08);
}

.checkout-choices {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.checkout-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.82);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.checkout-choice--active {
  border-color: rgb(var(--brand-lime-rgb) / 0.42);
  background: rgb(var(--brand-lime-light-rgb) / 0.1);
  box-shadow: 0 12px 24px rgb(var(--brand-dark-rgb) / 0.06);
}

.checkout-choice--disabled {
  opacity: 0.54;
}

.checkout-choice__content {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.checkout-choice__copy {
  display: grid;
  gap: 4px;
}

.checkout-choice__title {
  color: var(--brand-dark);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.checkout-choice__hint {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.checkout-choice__price {
  color: var(--brand-dark);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}

.checkout-note,
.checkout-notice,
.checkout-summary__row dt,
.checkout-summary__item-meta {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.checkout-note,
.checkout-notice {
  margin-top: 20px;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.8);
}

.checkout-notice--error {
  color: #b42318;
  border-color: rgb(244 114 114 / 0.28);
  background: rgb(254 242 242 / 0.9);
}

.checkout-summary {
  position: relative;
  overflow: hidden;
  padding: 24px 22px 22px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74), rgb(var(--white-rgb) / 0.98)),
    linear-gradient(180deg, rgb(var(--brand-lime-light-rgb) / 0.06), transparent);
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.checkout-summary::after {
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  content: '';
  background: linear-gradient(
    90deg,
    rgb(var(--brand-lime-rgb) / 0.92),
    rgb(var(--brand-lime-light-rgb) / 0.92)
  );
}

.checkout-summary__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.checkout-summary__items {
  display: grid;
  gap: 14px;
  margin-top: 22px;
  padding-top: 18px;
  padding-bottom: 18px;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

.checkout-summary__item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.checkout-summary__media {
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.8);
}

.checkout-summary__image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.checkout-summary__item-title {
  margin: 0;
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.checkout-summary__item-price {
  margin: 0;
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  text-align: right;
}

.checkout-summary__totals {
  margin-top: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.checkout-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.checkout-summary__row + .checkout-summary__row {
  margin-top: 12px;
}

.checkout-summary__row dd {
  margin: 0;
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
}

.checkout-summary__footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.checkout-summary__footer span {
  color: var(--brand-dark);
  font-size: 16px;
  font-weight: 700;
}

.checkout-summary__footer strong {
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.checkout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    background-color 180ms ease,
    opacity 180ms ease;
}

.checkout-button:hover:not(:disabled),
.checkout-button:focus-visible {
  transform: translateY(-1px);
}

.checkout-button--primary {
  color: var(--white);
  background: linear-gradient(
    135deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 72%,
    var(--brand-lime) 100%
  );
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.14);
}

.checkout-button--ghost {
  color: var(--brand-dark);
  border-color: var(--border-soft);
  background: rgb(var(--white-rgb) / 0.84);
}

.checkout-button--ghost:hover:not(:disabled),
.checkout-button--ghost:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  color: var(--brand-olive);
}

.checkout-button--full {
  width: 100%;
  margin-top: 18px;
}

.checkout-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (min-width: 1024px) {
  .checkout-loading,
  .checkout-shell {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }

  .checkout-summary {
    position: sticky;
    top: 24px;
  }
}

@media (min-width: 640px) {
  .checkout-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .checkout-field--wide {
    grid-column: span 2;
  }
}

@media (max-width: 639px) {
  .checkout-hero__panel {
    padding: 28px 20px;
  }

  .checkout-hero__eyebrow {
    gap: 10px;
  }

  .checkout-hero__eyebrow-line {
    width: 32px;
  }

  .checkout-hero__title,
  .checkout-state__title {
    font-size: 36px;
  }

  .checkout-hero__stat {
    min-width: calc(50% - 7px);
  }

  .checkout-panel,
  .checkout-summary {
    padding-right: 18px;
    padding-left: 18px;
  }

  .checkout-panel__title,
  .checkout-summary__title {
    font-size: 30px;
  }

  .checkout-choice {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
