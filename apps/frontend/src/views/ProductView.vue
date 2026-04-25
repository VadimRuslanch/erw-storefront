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
    { label: 'Collection', value: product.value.collection?.title },
    { label: 'Type', value: product.value.type?.value },
    { label: 'SKU', value: selectedVariant.value?.sku },
    { label: 'Material', value: selectedVariant.value?.material },
    { label: 'Weight', value: selectedVariant.value?.weight ? `${selectedVariant.value.weight} g` : null },
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
    return 'Select a product variant.'
  }

  if (!activePrice.value?.calculated_price) {
    return 'This variant has no price for the active region.'
  }

  if (!isSelectedVariantAvailable.value) {
    return 'This variant is out of stock.'
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

  return variant.title || 'Default variant'
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
      errorMessage.value = 'Product was not found.'
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
    addMessage.value = 'Added to cart.'
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
  <section
    v-if="isLoading"
    class="content-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"
  >
    <div class="aspect-[4/5] animate-pulse rounded-rounded bg-grey-10" />
    <div class="space-y-5">
      <div class="h-5 w-24 animate-pulse rounded bg-grey-10" />
      <div class="h-12 w-3/4 animate-pulse rounded bg-grey-10" />
      <div class="h-7 w-32 animate-pulse rounded bg-grey-10" />
      <div class="h-28 animate-pulse rounded bg-grey-10" />
      <div class="h-12 animate-pulse rounded bg-grey-10" />
    </div>
  </section>

  <section
    v-else-if="errorMessage"
    class="content-container py-12"
  >
    <div class="rounded-rounded border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center">
      <h1 class="text-xl-semi text-grey-90">Product unavailable</h1>
      <p class="mt-3 text-base-regular text-grey-60">{{ errorMessage }}</p>
      <RouterLink
        :to="`/${countryCode}/store`"
        class="mt-6 inline-flex h-11 items-center rounded-base bg-black px-5 text-small-semi text-white hover:bg-grey-80 hover:text-white"
      >
        Back to store
      </RouterLink>
    </div>
  </section>

  <section
    v-else-if="product"
    class="content-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"
  >
    <div class="space-y-4">
      <div class="overflow-hidden rounded-rounded border border-grey-20 bg-grey-5">
        <img
          :src="activeImageUrl"
          :alt="product.title"
          class="aspect-[4/5] w-full object-cover"
        />
      </div>

      <div
        v-if="productImages.length > 1"
        class="grid grid-cols-4 gap-3 sm:grid-cols-5"
      >
        <button
          v-for="image in productImages"
          :key="image.id"
          type="button"
          class="overflow-hidden rounded-base border bg-grey-5 transition"
          :class="image.url === activeImageUrl ? 'border-black' : 'border-grey-20 hover:border-grey-40'"
          @click="selectedImageUrl = image.url"
        >
          <img
            :src="image.url"
            :alt="product.title"
            class="aspect-square w-full object-cover"
          />
        </button>
      </div>
    </div>

    <article>
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Product</p>
      <h1 class="mt-4 text-[clamp(2.25rem,4vw,4rem)] font-semibold leading-none text-grey-90">
        {{ product.title }}
      </h1>
      <p
        v-if="product.subtitle"
        class="mt-4 text-large-regular text-grey-60"
      >
        {{ product.subtitle }}
      </p>

      <div class="mt-6 flex flex-wrap items-end gap-3">
        <span class="text-2xl-semi text-grey-90">
          {{ activePrice?.calculated_price || 'Price unavailable' }}
        </span>
        <span
          v-if="activePrice?.original_price && activePrice.original_price !== activePrice.calculated_price"
          class="text-base-regular text-grey-40 line-through"
        >
          {{ activePrice.original_price }}
        </span>
      </div>

      <p
        v-if="product.description"
        class="mt-6 whitespace-pre-line text-base-regular text-grey-60"
      >
        {{ product.description }}
      </p>

      <div
        v-if="variants.length"
        class="mt-8 space-y-3"
      >
        <h2 class="text-large-semi text-grey-90">Variant</h2>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="variant in variants"
            :key="variant.id"
            class="cursor-pointer rounded-rounded border p-4 transition"
            :class="
              variant.id === selectedVariantId
                ? 'border-black bg-grey-5'
                : 'border-grey-20 hover:border-grey-40'
            "
          >
            <input
              v-model="selectedVariantId"
              type="radio"
              class="sr-only"
              :value="variant.id"
            />
            <span class="block text-base-semi text-grey-90">{{ getVariantLabel(variant) }}</span>
            <span class="mt-1 block text-small-regular text-grey-50">
              {{ getVariantPrice(variant) || 'Price unavailable' }}
            </span>
          </label>
        </div>
      </div>

      <div class="mt-8 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <label class="flex flex-col gap-2">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Qty</span>
          <input
            :value="quantity"
            type="number"
            min="1"
            class="h-12 rounded-base border border-grey-20 px-4 text-base-regular outline-none transition focus:border-grey-50"
            @input="updateQuantity(Number(($event.target as HTMLInputElement).value))"
          />
        </label>

        <button
          type="button"
          class="mt-auto h-12 rounded-base bg-black px-5 text-small-semi text-white transition hover:bg-grey-80 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canAddToCart || isAdding"
          @click="addToCart"
        >
          {{ isAdding ? 'Adding...' : 'Add to cart' }}
        </button>
      </div>

      <p
        v-if="unavailableReason"
        class="mt-3 text-small-regular text-grey-60"
      >
        {{ unavailableReason }}
      </p>

      <p
        v-if="addMessage"
        class="mt-3 text-small-regular text-grey-60"
      >
        {{ addMessage }}
      </p>

      <dl
        v-if="detailRows.length"
        class="mt-8 divide-y divide-grey-20 border-y border-grey-20"
      >
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3"
        >
          <dt class="text-small-semi uppercase tracking-[0.12em] text-grey-50">{{ row.label }}</dt>
          <dd class="text-base-regular text-grey-80">{{ row.value }}</dd>
        </div>
      </dl>

      <div
        v-if="categoryLinks.length || tags.length"
        class="mt-8 space-y-4"
      >
        <div
          v-if="categoryLinks.length"
          class="flex flex-wrap gap-2"
        >
          <RouterLink
            v-for="category in categoryLinks"
            :key="category.id"
            :to="category.to"
            class="rounded-circle border border-grey-20 px-3 py-1 text-small-regular text-grey-70 hover:border-grey-40"
          >
            {{ category.name }}
          </RouterLink>
        </div>

        <div
          v-if="tags.length"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="tag in tags"
            :key="tag"
            class="rounded-circle bg-grey-5 px-3 py-1 text-small-regular text-grey-60"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </article>
  </section>
</template>
