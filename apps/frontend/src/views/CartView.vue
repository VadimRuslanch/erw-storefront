<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { convertToLocale } from '@lib/util/money'
import { useCartStore } from '@stores/cart'
import { useRegionStore } from '@stores/region'

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="%23f3f4f6"/><path d="M188 520l96-120 76 96 44-52 112 140H188z" fill="%23d1d5db"/><circle cx="254" cy="262" r="44" fill="%23d1d5db"/></svg>'

const cartStore = useCartStore()
const regionStore = useRegionStore()

const { cart, isLoading, error } = storeToRefs(cartStore)
const { countryCode } = storeToRefs(regionStore)

const promoCode = ref('')
const actionError = ref<string | null>(null)
const actionMessage = ref<string | null>(null)
const updatingLineIds = ref<string[]>([])
const isApplyingPromotion = ref(false)

const cartItems = computed(() => cart.value?.items ?? [])

const itemCount = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

const currencyCode = computed(() => {
  return cart.value?.currency_code || cart.value?.region?.currency_code || 'usd'
})

const hasItems = computed(() => cartItems.value.length > 0)

const checkoutLink = computed(() => `/${countryCode.value}/checkout`)
const storeLink = computed(() => `/${countryCode.value}/store`)

function formatAmount(amount?: number | null) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode.value,
  })
}

function itemImage(item: HttpTypes.StoreCartLineItem) {
  return item.thumbnail || item.variant?.thumbnail || item.product?.thumbnail || placeholderImage
}

function itemTitle(item: HttpTypes.StoreCartLineItem) {
  return item.product_title || item.product?.title || item.title
}

function itemVariantLabel(item: HttpTypes.StoreCartLineItem) {
  const variantValues = item.variant?.options?.map((option) => option.value).filter(Boolean) ?? []

  if (variantValues.length) {
    return variantValues.join(' / ')
  }

  return item.variant_title || item.variant?.title || null
}

function productLink(item: HttpTypes.StoreCartLineItem) {
  const handle = item.product_handle || item.product?.handle

  return handle ? `/${countryCode.value}/products/${handle}` : storeLink.value
}

function setLineUpdating(lineId: string, isUpdating: boolean) {
  if (isUpdating) {
    updatingLineIds.value = [...new Set([...updatingLineIds.value, lineId])]
    return
  }

  updatingLineIds.value = updatingLineIds.value.filter((id) => id !== lineId)
}

function isLineUpdating(lineId: string) {
  return updatingLineIds.value.includes(lineId)
}

async function updateQuantity(item: HttpTypes.StoreCartLineItem, nextQuantity: number) {
  const quantity = Math.max(1, Math.floor(nextQuantity || 1))

  if (quantity === item.quantity) {
    return
  }

  actionError.value = null
  actionMessage.value = null
  setLineUpdating(item.id, true)

  try {
    await cartStore.updateItem({
      lineId: item.id,
      quantity,
    })
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : String(err)
  } finally {
    setLineUpdating(item.id, false)
  }
}

async function decrementQuantity(item: HttpTypes.StoreCartLineItem) {
  if (item.quantity <= 1) {
    await removeItem(item)
    return
  }

  await updateQuantity(item, item.quantity - 1)
}

async function incrementQuantity(item: HttpTypes.StoreCartLineItem) {
  await updateQuantity(item, item.quantity + 1)
}

async function removeItem(item: HttpTypes.StoreCartLineItem) {
  actionError.value = null
  actionMessage.value = null
  setLineUpdating(item.id, true)

  try {
    await cartStore.removeItem(item.id)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : String(err)
  } finally {
    setLineUpdating(item.id, false)
  }
}

async function applyPromotion() {
  const code = promoCode.value.trim()

  if (!code) {
    return
  }

  const existingCodes =
    cart.value?.promotions
      ?.map((promotion) => promotion.code)
      .filter((promotionCode): promotionCode is string => Boolean(promotionCode)) ?? []
  const nextCodes = [...new Set([...existingCodes, code])]

  actionError.value = null
  actionMessage.value = null
  isApplyingPromotion.value = true

  try {
    await cartStore.applyPromotions(nextCodes)
    promoCode.value = ''
    actionMessage.value = 'Промокод применён.'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : String(err)
  } finally {
    isApplyingPromotion.value = false
  }
}

async function removePromotion(code?: string) {
  if (!code) {
    return
  }

  const nextCodes =
    cart.value?.promotions
      ?.map((promotion) => promotion.code)
      .filter((promotionCode): promotionCode is string =>
        Boolean(promotionCode && promotionCode !== code),
      ) ?? []

  actionError.value = null
  actionMessage.value = null
  isApplyingPromotion.value = true

  try {
    await cartStore.applyPromotions(nextCodes)
    actionMessage.value = 'Промокод удалён.'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : String(err)
  } finally {
    isApplyingPromotion.value = false
  }
}

onMounted(() => {
  void cartStore.loadCart()
})
</script>

<template>
  <section
    class="border-b border-grey-20 bg-[linear-gradient(180deg,#f7f4ec_0%,#fffdf7_52%,#ffffff_100%)]"
  >
    <div class="content-container py-12">
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Корзина</p>
      <h1 class="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none text-grey-90">
        Корзина покупок
      </h1>
      <p class="mt-5 max-w-2xl text-base-regular text-grey-60">
        Проверьте товары, измените количество и переходите к оформлению, когда всё будет готово.
      </p>
    </div>
  </section>

  <section class="content-container py-10">
    <div v-if="isLoading && !cart" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-4">
        <div
          v-for="index in 3"
          :key="index"
          class="h-36 animate-pulse rounded-rounded bg-grey-10"
        />
      </div>
      <div class="h-72 animate-pulse rounded-rounded bg-grey-10" />
    </div>

    <div
      v-else-if="error"
      class="rounded-rounded border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
    >
      <h2 class="text-xl-semi text-grey-90">Корзина недоступна</h2>
      <p class="mt-3 text-base-regular text-grey-60">{{ error }}</p>
    </div>

    <div
      v-else-if="!hasItems"
      class="rounded-rounded border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
    >
      <h2 class="text-xl-semi text-grey-90">Ваша корзина пуста</h2>
      <p class="mt-3 text-base-regular text-grey-60">
        Добавьте товар в корзину, и он появится здесь.
      </p>
      <RouterLink
        :to="storeLink"
        class="mt-6 inline-flex h-11 items-center rounded-base bg-black px-5 text-small-semi text-white hover:bg-grey-80 hover:text-white"
      >
        Перейти к покупкам
      </RouterLink>
    </div>

    <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div>
        <div class="mb-5 flex items-center justify-between gap-4 border-b border-grey-20 pb-5">
          <p class="text-small-regular text-grey-60">
            <span class="font-semibold text-grey-90">{{ itemCount }}</span> товаров
          </p>
          <RouterLink :to="storeLink" class="text-small-semi text-grey-90">
            Продолжить покупки
          </RouterLink>
        </div>

        <div class="divide-y divide-grey-20 border-y border-grey-20">
          <article
            v-for="item in cartItems"
            :key="item.id"
            class="grid gap-4 py-5 sm:grid-cols-[120px_minmax(0,1fr)]"
          >
            <RouterLink
              :to="productLink(item)"
              class="block overflow-hidden rounded-rounded border border-grey-20 bg-grey-5"
            >
              <img
                :src="itemImage(item)"
                :alt="itemTitle(item)"
                class="aspect-square w-full object-cover"
              />
            </RouterLink>

            <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <RouterLink :to="productLink(item)" class="text-large-semi text-grey-90">
                  {{ itemTitle(item) }}
                </RouterLink>
                <p v-if="itemVariantLabel(item)" class="mt-1 text-small-regular text-grey-50">
                  {{ itemVariantLabel(item) }}
                </p>
                <p
                  v-if="item.variant_sku || item.variant?.sku"
                  class="mt-1 text-small-regular text-grey-50"
                >
                  SKU: {{ item.variant_sku || item.variant?.sku }}
                </p>
                <p class="mt-3 text-base-regular text-grey-60">
                  {{ formatAmount(item.unit_price) }} за штуку
                </p>
              </div>

              <div class="flex flex-col items-start gap-4 md:items-end">
                <div class="flex h-10 items-center rounded-base border border-grey-20">
                  <button
                    type="button"
                    class="h-full w-10 text-large-semi text-grey-90 transition hover:bg-grey-5 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="isLineUpdating(item.id)"
                    @click="decrementQuantity(item)"
                  >
                    -
                  </button>
                  <input
                    :value="item.quantity"
                    type="number"
                    min="1"
                    class="h-full w-14 border-x border-grey-20 text-center text-base-regular outline-none"
                    :disabled="isLineUpdating(item.id)"
                    @change="
                      updateQuantity(item, Number(($event.target as HTMLInputElement).value))
                    "
                  />
                  <button
                    type="button"
                    class="h-full w-10 text-large-semi text-grey-90 transition hover:bg-grey-5 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="isLineUpdating(item.id)"
                    @click="incrementQuantity(item)"
                  >
                    +
                  </button>
                </div>

                <div class="text-left md:text-right">
                  <p class="text-large-semi text-grey-90">
                    {{
                      formatAmount(item.total ?? item.subtotal ?? item.unit_price * item.quantity)
                    }}
                  </p>
                  <p v-if="item.discount_total" class="text-small-regular text-grey-50">
                    Скидка {{ formatAmount(item.discount_total) }}
                  </p>
                </div>

                <button
                  type="button"
                  class="text-small-semi text-grey-50 transition hover:text-grey-90 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="isLineUpdating(item.id)"
                  @click="removeItem(item)"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <aside class="rounded-rounded border border-grey-20 bg-white p-5 lg:sticky lg:top-24">
        <h2 class="text-large-semi text-grey-90">Итого</h2>

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

        <form class="mt-6" @submit.prevent="applyPromotion">
          <label class="block">
            <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Промокод</span>
            <div class="mt-2 grid grid-cols-[minmax(0,1fr)_92px] gap-2">
              <input
                v-model.trim="promoCode"
                type="text"
                class="h-11 rounded-base border border-grey-20 px-3 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
              />
              <button
                type="submit"
                class="h-11 rounded-base border border-grey-20 px-3 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="isApplyingPromotion || !promoCode.trim()"
              >
                Применить
              </button>
            </div>
          </label>
        </form>

        <div v-if="cart?.promotions?.length" class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="promotion in cart.promotions"
            :key="promotion.id"
            type="button"
            class="rounded-circle border border-grey-20 px-3 py-1 text-small-regular text-grey-70 transition hover:border-grey-40"
            :disabled="isApplyingPromotion"
            @click="removePromotion(promotion.code)"
          >
            {{ promotion.code || 'Промокод' }} x
          </button>
        </div>

        <p
          v-if="actionError"
          class="mt-4 rounded-base border border-red-200 bg-red-50 px-4 py-3 text-small-regular text-red-700"
        >
          {{ actionError }}
        </p>
        <p
          v-else-if="actionMessage"
          class="mt-4 rounded-base border border-grey-20 bg-grey-5 px-4 py-3 text-small-regular text-grey-70"
        >
          {{ actionMessage }}
        </p>

        <RouterLink
          :to="checkoutLink"
          class="mt-6 flex h-12 w-full items-center justify-center rounded-base bg-black px-5 text-small-semi text-white transition hover:bg-grey-80 hover:text-white"
        >
          Оформить заказ
        </RouterLink>
      </aside>
    </div>
  </section>
</template>
