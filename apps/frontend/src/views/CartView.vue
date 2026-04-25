<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import CartItem from '@/components/CartItem.vue'
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
  <section class="cart-hero">
    <div class="content-container">
      <div class="cart-hero__panel">
        <div class="cart-hero__eyebrow">
          <span class="cart-hero__eyebrow-line" aria-hidden="true" />
          <p class="cart-hero__kicker">Ваш заказ</p>
        </div>

        <div class="cart-hero__content">
          <div>
            <p class="cart-hero__label">Корзина</p>
            <h1 class="cart-hero__title">Корзина покупок</h1>
            <p class="cart-hero__description">
              Проверьте товары, отрегулируйте количество и переходите к оформлению, когда состав
              заказа будет полностью готов.
            </p>
          </div>

          <dl class="cart-hero__stats" aria-label="Сводка по корзине">
            <div class="cart-hero__stat">
              <dt>Позиции</dt>
              <dd>{{ itemCount }}</dd>
            </div>
            <div class="cart-hero__stat">
              <dt>Итого</dt>
              <dd>{{ formatAmount(cart?.total) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </section>

  <section class="cart-layout content-container">
    <div v-if="isLoading && !cart" class="cart-loading">
      <div class="cart-loading__list">
        <div v-for="index in 3" :key="index" class="cart-loading__card" />
      </div>
      <div class="cart-loading__summary" />
    </div>

    <div v-else-if="error" class="cart-state">
      <p class="cart-state__eyebrow">Корзина</p>
      <h2 class="cart-state__title">Корзина недоступна</h2>
      <p class="cart-state__description">{{ error }}</p>
    </div>

    <div v-else-if="!hasItems" class="cart-state">
      <p class="cart-state__eyebrow">Корзина</p>
      <h2 class="cart-state__title">Ваша корзина пуста</h2>
      <p class="cart-state__description">
        Добавьте товар в корзину, и он сразу появится здесь вместе с итоговой стоимостью заказа.
      </p>
      <RouterLink :to="storeLink" class="cart-button cart-button--primary">
        Перейти к покупкам
      </RouterLink>
    </div>

    <div v-else class="cart-shell">
      <div class="cart-main">
        <div class="cart-main__header">
          <div>
            <p class="cart-main__label">Состав заказа</p>
            <p class="cart-main__count">
              <span>{{ itemCount }}</span> товаров
            </p>
          </div>
          <RouterLink :to="storeLink" class="cart-button cart-button--ghost">
            Продолжить покупки
          </RouterLink>
        </div>

        <div class="cart-list">
          <CartItem
            v-for="item in cartItems"
            :key="item.id"
            :item="item"
            :to="productLink(item)"
            :image-src="itemImage(item)"
            :title="itemTitle(item)"
            :variant-label="itemVariantLabel(item)"
            :unit-price="formatAmount(item.unit_price)"
            :line-total="
              formatAmount(item.total ?? item.subtotal ?? item.unit_price * item.quantity)
            "
            :discount="item.discount_total ? formatAmount(item.discount_total) : null"
            :is-updating="isLineUpdating(item.id)"
            @decrement="decrementQuantity"
            @increment="incrementQuantity"
            @update-quantity="updateQuantity"
            @remove="removeItem"
          />
        </div>
      </div>

      <aside class="cart-summary">
        <p class="cart-summary__label">Сводка заказа</p>
        <h2 class="cart-summary__title">Итого</h2>

        <dl class="cart-summary__totals">
          <div class="cart-summary__row">
            <dt>Подытог</dt>
            <dd>{{ formatAmount(cart?.subtotal) }}</dd>
          </div>
          <div v-if="cart?.discount_total" class="cart-summary__row">
            <dt>Скидка</dt>
            <dd>-{{ formatAmount(cart.discount_total) }}</dd>
          </div>
          <div class="cart-summary__row">
            <dt>Доставка</dt>
            <dd>{{ formatAmount(cart?.shipping_total) }}</dd>
          </div>
          <div class="cart-summary__row">
            <dt>Налоги</dt>
            <dd>{{ formatAmount(cart?.tax_total) }}</dd>
          </div>
        </dl>

        <div class="cart-summary__footer">
          <span>Итого</span>
          <strong>{{ formatAmount(cart?.total) }}</strong>
        </div>

        <form class="cart-summary__promo" @submit.prevent="applyPromotion">
          <!--          <label class="cart-field">-->
          <!--            <span class="cart-field__label">Промокод</span>-->
          <!--            <div class="cart-field__row">-->
          <!--              <input v-model.trim="promoCode" type="text" class="cart-field__input" />-->
          <!--              <button-->
          <!--                type="submit"-->
          <!--                class="cart-button cart-button&#45;&#45;ghost"-->
          <!--                :disabled="isApplyingPromotion || !promoCode.trim()"-->
          <!--              >-->
          <!--                Применить-->
          <!--              </button>-->
          <!--            </div>-->
          <!--          </label>-->
        </form>

        <div v-if="cart?.promotions?.length" class="cart-summary__chips">
          <button
            v-for="promotion in cart.promotions"
            :key="promotion.id"
            type="button"
            class="cart-chip"
            :disabled="isApplyingPromotion"
            @click="removePromotion(promotion.code)"
          >
            {{ promotion.code || 'Промокод' }} x
          </button>
        </div>

        <p v-if="actionError" class="cart-notice cart-notice--error">
          {{ actionError }}
        </p>
        <p v-else-if="actionMessage" class="cart-notice">
          {{ actionMessage }}
        </p>

        <RouterLink :to="checkoutLink" class="cart-button cart-button--primary cart-button--full">
          Оформить заказ
        </RouterLink>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cart-hero {
  padding: 28px 0 18px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.16), transparent 30%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74) 0%, rgb(var(--white-rgb) / 0.98) 62%);
}

.cart-hero__panel {
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

.cart-hero__panel::after {
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

.cart-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.cart-hero__eyebrow-line {
  width: 48px;
  height: 1px;
  background: rgb(var(--brand-lime-light-rgb) / 0.8);
}

.cart-hero__kicker,
.cart-hero__label,
.cart-main__label,
.cart-summary__label,
.cart-field__label,
.cart-state__eyebrow,
.cart-button,
.cart-chip {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.cart-hero__kicker {
  color: rgb(var(--cream-rgb) / 0.86);
}

.cart-hero__content {
  display: grid;
  gap: 18px;
}

.cart-hero__label {
  color: var(--brand-lime-light);
}

.cart-hero__title {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.6rem, 5vw, 4.45rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.03em;
}

.cart-hero__description {
  max-width: 640px;
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.9);
  font-size: 15px;
  line-height: 1.75;
}

.cart-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.cart-hero__stat {
  min-width: 160px;
  padding: 14px 16px;
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.08);
}

.cart-hero__stat dt {
  color: rgb(var(--cream-rgb) / 0.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.cart-hero__stat dd {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: 32px;
  line-height: 1;
}

.cart-layout {
  padding-top: 32px;
  padding-bottom: 48px;
}

.cart-loading,
.cart-shell {
  display: grid;
  gap: 28px;
}

.cart-loading__list {
  display: grid;
  gap: 16px;
}

.cart-loading__card,
.cart-loading__summary {
  border-radius: 8px;
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.7), rgb(var(--white-rgb) / 0.98));
  border: 1px solid var(--border-soft);
  box-shadow: 0 18px 36px rgb(var(--brand-dark-rgb) / 0.08);
}

.cart-loading__card {
  height: 188px;
}

.cart-loading__summary {
  height: 420px;
}

.cart-state {
  padding: 52px 32px;
  border: 1px dashed rgb(var(--brand-dark-rgb) / 0.22);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.48);
  text-align: center;
}

.cart-state__eyebrow,
.cart-main__label,
.cart-summary__label,
.cart-field__label {
  color: var(--brand-olive);
}

.cart-state__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 500;
  line-height: 1;
}

.cart-state__description {
  max-width: 520px;
  margin: 14px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.75;
}

.cart-main {
  min-width: 0;
}

.cart-main__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.cart-main__count {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 15px;
}

.cart-main__count span {
  color: var(--brand-dark);
  font-weight: 700;
}

.cart-list {
  display: grid;
  gap: 18px;
}

.cart-summary__row dt,
.cart-chip,
.cart-notice {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.cart-button:disabled,
.cart-chip:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.cart-summary {
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

.cart-summary::after {
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

.cart-summary__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.cart-summary__totals {
  margin: 22px 0 0;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cart-summary__row + .cart-summary__row {
  margin-top: 12px;
}

.cart-summary__row dd {
  margin: 0;
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
}

.cart-summary__footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.cart-summary__footer span {
  color: var(--brand-dark);
  font-size: 16px;
  font-weight: 700;
}

.cart-summary__footer strong {
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.cart-summary__promo {
  margin-top: 22px;
}

.cart-field {
  display: grid;
  gap: 10px;
}

.cart-field__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.cart-field__input {
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-dark);
  background: rgb(var(--white-rgb) / 0.92);
  font-size: 14px;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.cart-field__input:focus {
  border-color: rgb(var(--brand-lime-rgb) / 0.5);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
}

.cart-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.cart-chip {
  padding: 8px 12px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-olive);
  background: rgb(var(--white-rgb) / 0.84);
  transition: border-color 180ms ease;
}

.cart-chip:hover:not(:disabled) {
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
}

.cart-notice {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.8);
}

.cart-notice--error {
  color: #b42318;
  border-color: rgb(244 114 114 / 0.28);
  background: rgb(254 242 242 / 0.9);
}

.cart-button {
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

.cart-button:hover:not(:disabled),
.cart-button:focus-visible {
  transform: translateY(-1px);
}

.cart-button--primary {
  color: var(--white);
  background: linear-gradient(
    135deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 72%,
    var(--brand-lime) 100%
  );
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.14);
}

.cart-button--ghost {
  color: var(--brand-dark);
  border-color: var(--border-soft);
  background: rgb(var(--white-rgb) / 0.84);
}

.cart-button--ghost:hover:not(:disabled),
.cart-button--ghost:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  color: var(--brand-olive);
}

.cart-button--full {
  width: 100%;
  margin-top: 18px;
}

@media (min-width: 1024px) {
  .cart-loading,
  .cart-shell {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }

  .cart-summary {
    position: sticky;
    top: 24px;
  }
}

@media (max-width: 767px) {
  .cart-field__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .cart-hero {
    padding-top: 18px;
  }

  .cart-hero__panel {
    padding: 28px 20px;
  }

  .cart-hero__eyebrow {
    gap: 10px;
  }

  .cart-hero__eyebrow-line {
    width: 32px;
  }

  .cart-hero__title,
  .cart-state__title {
    font-size: 36px;
  }

  .cart-hero__stat {
    min-width: calc(50% - 7px);
  }

  .cart-summary {
    padding-right: 18px;
    padding-left: 18px;
  }

  .cart-summary__title {
    font-size: 30px;
  }
}
</style>
