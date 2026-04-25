<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import { getProductByHandle } from '@api/products'
import { getProductPrice } from '@lib/util/get-product-price'
import { useCartStore } from '@stores/cart'
import { useRegionStore } from '@stores/region'

type ProductImage = {
  id: string
  url: string
  rank: number
}

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="%23f3f4f6"/><path d="M188 520l96-120 76 96 44-52 112 140H188z" fill="%23d1d5db"/><circle cx="254" cy="262" r="44" fill="%23d1d5db"/></svg>'

const route = useRoute()
const regionStore = useRegionStore()
const cartStore = useCartStore()

const { countryCode } = storeToRefs(regionStore)

const product = ref<HttpTypes.StoreProduct | null>(null)
const selectedImageUrl = ref<string | null>(null)
const selectedVariantId = ref<string | null>(null)
const quantity = ref(1)
const isLoading = ref(false)
const isAdding = ref(false)
const errorMessage = ref<string | null>(null)
const addMessage = ref<string | null>(null)

const handle = computed(() => {
  const rawValue = route.params.handle
  return Array.isArray(rawValue) ? rawValue[0] : rawValue
})

const variants = computed(() => product.value?.variants ?? [])

const selectedVariant = computed(() => {
  return variants.value.find((variant) => variant.id === selectedVariantId.value) ?? variants.value[0] ?? null
})

const productImages = computed<ProductImage[]>(() => {
  const imageMap = new Map<string, ProductImage>()

  product.value?.images?.forEach((image) => {
    imageMap.set(image.url, {
      id: image.id,
      url: image.url,
      rank: image.rank ?? 0,
    })
  })

  variants.value.forEach((variant) => {
    variant.images?.forEach((image) => {
      imageMap.set(image.url, {
        id: image.id,
        url: image.url,
        rank: image.rank ?? 0,
      })
    })
  })

  const images = Array.from(imageMap.values()).sort((first, second) => first.rank - second.rank)

  if (images.length) {
    return images
  }

  return [
    {
      id: 'placeholder',
      url: product.value?.thumbnail || placeholderImage,
      rank: 0,
    },
  ]
})

const activeImageUrl = computed(() => {
  return (
    selectedImageUrl.value ||
    selectedVariant.value?.thumbnail ||
    selectedVariant.value?.images?.[0]?.url ||
    productImages.value[0]?.url ||
    placeholderImage
  )
})

const activePrice = computed(() => {
  if (!product.value) {
    return null
  }

  const prices = getProductPrice({
    product: product.value,
    variantId: selectedVariant.value?.id,
  })

  return prices.variantPrice ?? prices.cheapestPrice
})

const detailRows = computed(() => {
  if (!product.value) {
    return []
  }

  return [
    { label: 'Коллекция', value: product.value.collection?.title },
    { label: 'Тип', value: product.value.type?.value },
    { label: 'SKU', value: selectedVariant.value?.sku },
    { label: 'Материал', value: selectedVariant.value?.material },
    { label: 'Вес', value: selectedVariant.value?.weight ? `${selectedVariant.value.weight} g` : null },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))
})

const categoryLinks = computed(() => {
  return (product.value?.categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    to: `/${countryCode.value}/categories/${category.handle}`,
  }))
})

const tags = computed(() => {
  return (product.value?.tags ?? []).map((tag) => tag.value).filter(Boolean)
})

const isSelectedVariantAvailable = computed(() => {
  const variant = selectedVariant.value

  if (!variant) {
    return false
  }

  if (variant.allow_backorder || variant.manage_inventory === false) {
    return true
  }

  return (variant.inventory_quantity ?? 0) > 0
})

const unavailableReason = computed(() => {
  if (!selectedVariant.value) {
    return 'Выберите вариант товара.'
  }

  if (!activePrice.value?.calculated_price) {
    return 'Для активного региона у этого варианта нет цены.'
  }

  if (!isSelectedVariantAvailable.value) {
    return 'Этот вариант временно недоступен.'
  }

  return null
})

const canAddToCart = computed(() => {
  return Boolean(selectedVariant.value && !unavailableReason.value && countryCode.value)
})

function getVariantLabel(variant: HttpTypes.StoreProductVariant) {
  const optionValues = variant.options?.map((option) => option.value).filter(Boolean) ?? []

  if (optionValues.length) {
    return optionValues.join(' / ')
  }

  return variant.title || 'Базовый вариант'
}

function getVariantPrice(variant: HttpTypes.StoreProductVariant) {
  if (!product.value) {
    return null
  }

  const prices = getProductPrice({
    product: product.value,
    variantId: variant.id,
  })

  return prices.variantPrice?.calculated_price ?? null
}

function updateQuantity(nextQuantity: number) {
  quantity.value = Math.max(1, Math.floor(nextQuantity || 1))
}

async function loadProduct() {
  if (!handle.value || !countryCode.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = null
  addMessage.value = null

  try {
    product.value = await getProductByHandle({
      handle: handle.value,
      countryCode: countryCode.value,
    })

    selectedVariantId.value = product.value?.variants?.[0]?.id ?? null
    selectedImageUrl.value = productImages.value[0]?.url ?? null

    if (!product.value) {
      errorMessage.value = 'Товар не найден.'
    }
  } catch (error) {
    product.value = null
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    isLoading.value = false
  }
}

async function addToCart() {
  if (!selectedVariant.value || !countryCode.value) {
    return
  }

  isAdding.value = true
  addMessage.value = null

  try {
    await cartStore.addItem({
      variantId: selectedVariant.value.id,
      quantity: quantity.value,
      countryCode: countryCode.value,
    })
    addMessage.value = 'Товар добавлен в корзину.'
  } catch (error) {
    addMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    isAdding.value = false
  }
}

watch(
  () => [handle.value, countryCode.value],
  () => {
    void loadProduct()
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="isLoading" class="product-loading">
    <div class="content-container">
      <div class="product-loading__hero" />
      <div class="product-loading__layout">
        <div class="product-loading__gallery" />
        <div class="product-loading__content">
          <div class="product-loading__line product-loading__line--small" />
          <div class="product-loading__line product-loading__line--title" />
          <div class="product-loading__line product-loading__line--price" />
          <div class="product-loading__block" />
          <div class="product-loading__block product-loading__block--short" />
        </div>
      </div>
    </div>
  </section>

  <section v-else-if="errorMessage" class="content-container product-state-shell">
    <div class="product-state">
      <p class="product-state__eyebrow">Товар</p>
      <h1 class="product-state__title">Товар недоступен</h1>
      <p class="product-state__description">{{ errorMessage }}</p>
      <RouterLink :to="`/${countryCode}/store`" class="product-button product-button--primary">
        Вернуться в каталог
      </RouterLink>
    </div>
  </section>

  <section v-else-if="product" class="product-page">
    <section class="product-hero">
      <div class="content-container">
        <div class="product-hero__panel">
          <div class="product-hero__eyebrow">
            <span class="product-hero__eyebrow-line" aria-hidden="true" />
            <p class="product-hero__kicker">Карточка товара</p>
          </div>

          <div class="product-hero__content">
            <div>
              <p class="product-hero__label">Товар</p>
              <h1 class="product-hero__title">{{ product.title }}</h1>
              <p v-if="product.subtitle || product.description" class="product-hero__description">
                {{ product.subtitle || product.description }}
              </p>
            </div>

            <div class="product-hero__purchase">
              <div class="product-hero__price">
                <span class="product-hero__price-current">
                  {{ activePrice?.calculated_price || 'Цена недоступна' }}
                </span>
                <span
                  v-if="
                    activePrice?.original_price &&
                    activePrice.original_price !== activePrice.calculated_price
                  "
                  class="product-hero__price-original"
                >
                  {{ activePrice.original_price }}
                </span>
              </div>

              <dl class="product-hero__stats" aria-label="Сводка по товару">
                <div class="product-hero__stat">
                  <dt>Варианты</dt>
                  <dd>{{ variants.length || 1 }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="product-layout content-container">
      <div class="product-gallery">
        <div class="product-gallery__frame">
          <img :src="activeImageUrl" :alt="product.title" class="product-gallery__image" />
        </div>

        <div v-if="productImages.length > 1" class="product-gallery__thumbs">
          <button
            v-for="image in productImages"
            :key="image.id"
            type="button"
            class="product-gallery__thumb"
            :class="{ 'product-gallery__thumb--active': image.url === activeImageUrl }"
            @click="selectedImageUrl = image.url"
          >
            <img :src="image.url" :alt="product.title" class="product-gallery__thumb-image" />
          </button>
        </div>
      </div>

      <article class="product-side">
        <section class="product-panel product-panel--purchase">
          <div class="product-panel__header">
            <div>
              <p class="product-panel__eyebrow">Выбор варианта</p>
              <h2 class="product-panel__title">
                {{ selectedVariant ? getVariantLabel(selectedVariant) : 'Вариант товара' }}
              </h2>
            </div>
            <p
              class="product-panel__availability"
              :class="
                isSelectedVariantAvailable
                  ? 'product-panel__availability--available'
                  : 'product-panel__availability--unavailable'
              "
            >
              {{ isSelectedVariantAvailable ? 'В наличии' : 'Недоступно' }}
            </p>
          </div>

          <div v-if="variants.length" class="product-variants">
            <label
              v-for="variant in variants"
              :key="variant.id"
              class="product-variant"
              :class="{ 'product-variant--active': variant.id === selectedVariantId }"
            >
              <input v-model="selectedVariantId" type="radio" class="sr-only" :value="variant.id" />
              <span class="product-variant__name">{{ getVariantLabel(variant) }}</span>
              <span class="product-variant__price">
                {{ getVariantPrice(variant) || 'Цена недоступна' }}
              </span>
            </label>
          </div>

          <div class="product-purchase">
            <label class="product-field">
              <span class="product-field__label">Количество</span>
              <div class="product-quantity">
                <button
                  type="button"
                  class="product-quantity__button"
                  @click="updateQuantity(quantity - 1)"
                >
                  -
                </button>
                <input
                  :value="quantity"
                  type="number"
                  min="1"
                  class="product-quantity__input"
                  @input="updateQuantity(Number(($event.target as HTMLInputElement).value))"
                />
                <button
                  type="button"
                  class="product-quantity__button"
                  @click="updateQuantity(quantity + 1)"
                >
                  +
                </button>
              </div>
            </label>

            <button
              type="button"
              class="product-button product-button--primary product-button--full"
              :disabled="!canAddToCart || isAdding"
              @click="addToCart"
            >
              {{ isAdding ? 'Добавляем...' : 'Добавить в корзину' }}
            </button>
          </div>

          <p v-if="unavailableReason" class="product-notice">
            {{ unavailableReason }}
          </p>

          <p v-if="addMessage" class="product-notice">
            {{ addMessage }}
          </p>
        </section>

        <section v-if="product.description" class="product-panel">
          <p class="product-panel__eyebrow">Описание</p>
          <p class="product-panel__copy">{{ product.description }}</p>
        </section>

        <section v-if="detailRows.length" class="product-panel">
          <p class="product-panel__eyebrow">Детали</p>
          <dl class="product-details">
            <div v-for="row in detailRows" :key="row.label" class="product-details__row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="categoryLinks.length || tags.length" class="product-panel">
          <p class="product-panel__eyebrow">Категории и теги</p>

          <div v-if="categoryLinks.length" class="product-chip-list">
            <RouterLink
              v-for="category in categoryLinks"
              :key="category.id"
              :to="category.to"
              class="product-chip product-chip--link"
            >
              {{ category.name }}
            </RouterLink>
          </div>

          <div v-if="tags.length" class="product-chip-list">
            <span v-for="tag in tags" :key="tag" class="product-chip">
              {{ tag }}
            </span>
          </div>
        </section>
      </article>
    </section>
  </section>
</template>

<style scoped>
.product-page,
.product-loading {
  padding-bottom: 48px;
}

.product-hero {
  padding: 28px 0 18px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.16), transparent 30%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74) 0%, rgb(var(--white-rgb) / 0.98) 62%);
}

.product-hero__panel,
.product-loading__hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 28px;
  padding: 36px clamp(24px, 4vw, 44px);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(145deg, var(--brand-dark) 0%, var(--brand-olive) 58%, var(--brand-dark) 100%);
  box-shadow: var(--shadow-soft);
}

.product-hero__panel::after,
.product-loading__hero::after {
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

.product-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.product-hero__eyebrow-line {
  width: 48px;
  height: 1px;
  background: rgb(var(--brand-lime-light-rgb) / 0.8);
}

.product-hero__kicker,
.product-hero__label,
.product-panel__eyebrow,
.product-field__label,
.product-state__eyebrow,
.product-button {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.product-hero__kicker {
  color: rgb(var(--cream-rgb) / 0.86);
}

.product-hero__content {
  display: grid;
  gap: 20px;
}

.product-hero__label {
  color: var(--brand-lime-light);
}

.product-hero__title {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.7rem, 5vw, 4.6rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.03em;
  text-wrap: balance;
}

.product-hero__description {
  display: -webkit-box;
  max-width: 640px;
  margin: 18px 0 0;
  overflow: hidden;
  color: rgb(var(--cream-rgb) / 0.9);
  font-size: 15px;
  line-height: 1.75;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.product-hero__purchase {
  display: grid;
  gap: 18px;
}

.product-hero__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
}

.product-hero__price-current {
  color: var(--white);
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 500;
  line-height: 1;
}

.product-hero__price-original {
  color: rgb(var(--cream-rgb) / 0.64);
  font-size: 14px;
  text-decoration: line-through;
}

.product-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.product-hero__stat {
  min-width: 140px;
  padding: 14px 16px;
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.08);
}

.product-hero__stat dt {
  color: rgb(var(--cream-rgb) / 0.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.product-hero__stat dd {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: 32px;
  line-height: 1;
}

.product-layout,
.product-loading__layout {
  display: grid;
  gap: 28px;
  padding-top: 32px;
}

.product-loading__layout {
  align-items: start;
}

.product-loading__gallery,
.product-loading__content {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.72), rgb(var(--white-rgb) / 0.98));
  box-shadow: 0 18px 36px rgb(var(--brand-dark-rgb) / 0.08);
}

.product-loading__gallery {
  min-height: 640px;
}

.product-loading__content {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.product-loading__line,
.product-loading__block {
  border-radius: 999px;
  background: rgb(var(--brand-dark-rgb) / 0.08);
}

.product-loading__line--small {
  width: 92px;
  height: 14px;
}

.product-loading__line--title {
  width: 72%;
  height: 56px;
}

.product-loading__line--price {
  width: 180px;
  height: 32px;
}

.product-loading__block {
  height: 170px;
  border-radius: 8px;
}

.product-loading__block--short {
  height: 110px;
}

.product-gallery {
  min-width: 0;
}

.product-gallery__frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.82), rgb(var(--white-rgb) / 0.94)),
    radial-gradient(circle at top, rgb(var(--brand-lime-light-rgb) / 0.18), transparent 58%);
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.product-gallery__frame::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 4px;
  content: '';
  background: linear-gradient(
    90deg,
    rgb(var(--brand-lime-rgb) / 0.92),
    rgb(var(--brand-lime-light-rgb) / 0.92)
  );
}

.product-gallery__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.product-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.product-gallery__thumb {
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.82);
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.product-gallery__thumb:hover,
.product-gallery__thumb:focus-visible,
.product-gallery__thumb--active {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgb(var(--brand-dark-rgb) / 0.08);
}

.product-gallery__thumb-image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.product-side {
  display: grid;
  gap: 18px;
  align-content: start;
}

.product-panel {
  overflow: hidden;
  padding: 24px 22px 22px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.6), rgb(var(--white-rgb) / 0.98)),
    linear-gradient(180deg, rgb(var(--brand-lime-light-rgb) / 0.05), transparent);
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.product-panel--purchase {
  position: relative;
}

.product-panel--purchase::after {
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

.product-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.product-panel__eyebrow,
.product-field__label,
.product-state__eyebrow {
  color: var(--brand-olive);
}

.product-panel__title {
  margin: 10px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
  text-wrap: balance;
}

.product-panel__availability {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.product-panel__availability--available {
  color: var(--brand-olive);
  background: rgb(var(--brand-lime-light-rgb) / 0.18);
}

.product-panel__availability--unavailable {
  color: #b42318;
  background: rgb(254 242 242 / 0.9);
}

.product-variants {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.product-variant {
  display: grid;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.82);
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.product-variant:hover,
.product-variant--active {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgb(var(--brand-dark-rgb) / 0.06);
}

.product-variant__name {
  color: var(--brand-dark);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.product-variant__price {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.product-purchase {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.product-field {
  display: grid;
  gap: 10px;
}

.product-quantity {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  overflow: hidden;
  background: rgb(var(--white-rgb) / 0.92);
}

.product-quantity__button,
.product-quantity__input {
  height: 46px;
  border: 0;
  color: var(--brand-dark);
  background: transparent;
}

.product-quantity__button {
  width: 46px;
  font-size: 24px;
  line-height: 1;
  transition: background-color 180ms ease;
}

.product-quantity__button:hover {
  background: rgb(var(--brand-lime-light-rgb) / 0.12);
}

.product-quantity__input {
  width: 60px;
  border-right: 1px solid var(--border-soft);
  border-left: 1px solid var(--border-soft);
  text-align: center;
  font-size: 14px;
  outline: none;
}

.product-quantity__input::-webkit-outer-spin-button,
.product-quantity__input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.product-notice,
.product-panel__copy,
.product-details dd,
.product-chip {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.product-notice {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.82);
}

.product-panel__copy {
  margin: 14px 0 0;
  white-space: pre-line;
}

.product-details {
  margin-top: 18px;
}

.product-details__row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border-soft);
}

.product-details__row:last-child {
  border-bottom: 1px solid var(--border-soft);
}

.product-details dt {
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.5;
  text-transform: uppercase;
}

.product-details dd {
  margin: 0;
  color: var(--brand-dark);
}

.product-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.product-chip {
  padding: 8px 12px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-olive);
  background: rgb(var(--white-rgb) / 0.84);
}

.product-chip--link {
  transition: border-color 180ms ease, transform 180ms ease;
}

.product-chip--link:hover,
.product-chip--link:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  transform: translateY(-1px);
}

.product-state-shell {
  padding-top: 32px;
  padding-bottom: 48px;
}

.product-state {
  padding: 52px 32px;
  border: 1px dashed rgb(var(--brand-dark-rgb) / 0.22);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.48);
  text-align: center;
}

.product-state__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 38px;
  font-weight: 500;
  line-height: 1;
}

.product-state__description {
  max-width: 520px;
  margin: 14px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.75;
}

.product-button {
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
    opacity 180ms ease;
}

.product-button:hover:not(:disabled),
.product-button:focus-visible {
  transform: translateY(-1px);
}

.product-button--primary {
  color: var(--white);
  background: linear-gradient(
    135deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 72%,
    var(--brand-lime) 100%
  );
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.14);
}

.product-button--full {
  width: 100%;
}

.product-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (min-width: 1024px) {
  .product-layout,
  .product-loading__layout {
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
    align-items: start;
  }

  .product-side {
    position: sticky;
    top: 24px;
  }
}

@media (min-width: 768px) {
  .product-hero__content {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .product-variants {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .product-details__row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

@media (max-width: 639px) {
  .product-hero {
    padding-top: 18px;
  }

  .product-hero__panel,
  .product-loading__hero {
    padding: 28px 20px;
  }

  .product-hero__eyebrow {
    gap: 10px;
  }

  .product-hero__eyebrow-line {
    width: 32px;
  }

  .product-hero__title,
  .product-state__title {
    font-size: 36px;
  }

  .product-hero__stat {
    min-width: calc(50% - 7px);
  }

  .product-gallery__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .product-panel {
    padding-right: 18px;
    padding-left: 18px;
  }

  .product-panel__header {
    flex-direction: column;
  }

  .product-panel__title {
    font-size: 30px;
  }
}
</style>
