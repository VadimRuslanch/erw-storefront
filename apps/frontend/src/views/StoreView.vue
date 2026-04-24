<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import type { SortOptions } from '@/types/sort'
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getProductPrice } from '@lib/util/get-product-price'
import { useCatalogStore } from '@stores/catalog'
import { useRegionStore } from '@stores/region'

const PAGE_SIZE = 12

const sortOptions: Array<{ value: SortOptions; label: string }> = [
  { value: 'created_at', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="%23f3f4f6"/><path d="M188 520l96-120 76 96 44-52 112 140H188z" fill="%23d1d5db"/><circle cx="254" cy="262" r="44" fill="%23d1d5db"/></svg>'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const regionStore = useRegionStore()

const { products, productCount, isLoading } = storeToRefs(catalogStore)
const { countryCode } = storeToRefs(regionStore)

const currentPage = computed(() => {
  const rawValue = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const parsed = Number(rawValue)

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
})

const currentSort = computed<SortOptions>(() => {
  const rawValue = Array.isArray(route.query.sort) ? route.query.sort[0] : route.query.sort

  return sortOptions.some((option) => option.value === rawValue)
    ? (rawValue as SortOptions)
    : 'created_at'
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(productCount.value / PAGE_SIZE))
})

const pageWindow = computed(() => {
  const start = Math.max(1, currentPage.value - 1)
  const end = Math.min(totalPages.value, start + 2)
  const pages: number[] = []

  for (let page = Math.max(1, end - 2); page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

const hasProducts = computed(() => products.value.length > 0)

const productCards = computed(() => {
  return products.value.map((product) => {
    const prices = getProductPrice({ product })
    const activePrice = prices.cheapestPrice ?? prices.variantPrice

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.subtitle || product.description || 'Product details are available on the product page.',
      thumbnail: product.thumbnail || product.images?.[0]?.url || placeholderImage,
      price: activePrice?.calculated_price || 'Price unavailable',
      originalPrice: activePrice?.original_price || null,
      percentageDiff: activePrice?.percentage_diff || null,
    }
  })
})

async function loadProducts() {
  if (!countryCode.value) {
    return
  }

  await catalogStore.loadProducts({
    countryCode: countryCode.value,
    page: currentPage.value,
    sortBy: currentSort.value,
    queryParams: {
      limit: PAGE_SIZE,
    },
  })
}

function updateQuery(nextQuery: { page?: number; sort?: SortOptions }) {
  const page = nextQuery.page ?? currentPage.value
  const sort = nextQuery.sort ?? currentSort.value

  void router.replace({
    query: {
      ...route.query,
      page: page > 1 ? String(page) : undefined,
      sort: sort === 'created_at' ? undefined : sort,
    },
  })
}

function onSortChange(event: Event) {
  const target = event.target as HTMLSelectElement
  updateQuery({
    page: 1,
    sort: target.value as SortOptions,
  })
}

function productLink(product: Pick<HttpTypes.StoreProduct, 'handle'> | { handle?: string | null }) {
  return `/${countryCode.value}/products/${product.handle}`
}

watch(
  () => [countryCode.value, currentPage.value, currentSort.value],
  () => {
    void loadProducts()
  },
  { immediate: true },
)
</script>

<template>
  <section class="border-b border-grey-20 bg-[linear-gradient(180deg,#f7f4ec_0%,#fffdf7_48%,#ffffff_100%)]">
    <div class="content-container py-12">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
        <div class="max-w-3xl">
          <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Catalog</p>
          <h1 class="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none text-grey-90">
            All products
          </h1>
          <p class="mt-5 max-w-2xl text-base-regular text-grey-60">
            Full client-rendered assortment for the active region. Sorting and pagination run in the
            Vue SPA layer.
          </p>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">Sort</span>
          <select
            :value="currentSort"
            class="h-12 rounded-base border border-grey-20 bg-white px-4 text-base-regular text-grey-90 outline-none transition focus:border-grey-50"
            @change="onSortChange"
          >
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </div>
  </section>

  <section class="content-container py-10">
    <div class="flex items-center justify-between gap-4 border-b border-grey-20 pb-5">
      <p class="text-small-regular text-grey-60">
        <span class="font-semibold text-grey-90">{{ productCount }}</span> products
      </p>
      <p class="text-small-regular text-grey-50">Page {{ currentPage }} of {{ totalPages }}</p>
    </div>

    <div
      v-if="isLoading"
      class="grid gap-5 pt-8 sm:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="index in 6"
        :key="index"
        class="overflow-hidden rounded-large border border-grey-20 bg-white"
      >
        <div class="aspect-[4/5] animate-pulse bg-grey-10" />
        <div class="space-y-3 p-5">
          <div class="h-4 w-28 animate-pulse rounded bg-grey-10" />
          <div class="h-6 w-3/4 animate-pulse rounded bg-grey-10" />
          <div class="h-4 w-full animate-pulse rounded bg-grey-10" />
          <div class="h-4 w-24 animate-pulse rounded bg-grey-10" />
        </div>
      </article>
    </div>

    <div
      v-else-if="hasProducts"
      class="grid gap-5 pt-8 sm:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="product in productCards"
        :key="product.id"
        class="group overflow-hidden rounded-large border border-grey-20 bg-white transition duration-300 hover:-translate-y-1 hover:border-grey-40 hover:shadow-[0_24px_70px_-32px_rgba(17,24,39,0.28)]"
      >
        <RouterLink
          :to="productLink(product)"
          class="block"
        >
          <div class="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_top,#f9fafb_0%,#f3f4f6_60%,#e5e7eb_100%)]">
            <img
              :src="product.thumbnail"
              :alt="product.title"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div
              v-if="product.percentageDiff && Number(product.percentageDiff) > 0"
              class="absolute left-4 top-4 rounded-circle bg-black px-3 py-1 text-xsmall-regular uppercase tracking-[0.12em] text-white"
            >
              -{{ product.percentageDiff }}%
            </div>
          </div>

          <div class="space-y-4 p-5">
            <div class="space-y-2">
              <p class="text-small-semi uppercase tracking-[0.14em] text-grey-50">Product</p>
              <h2 class="text-xl-semi text-grey-90">{{ product.title }}</h2>
              <p class="line-clamp-2 text-base-regular text-grey-60">
                {{ product.description }}
              </p>
            </div>

            <div class="flex items-end justify-between gap-3">
              <div class="flex items-baseline gap-2">
                <span class="text-large-semi text-grey-90">{{ product.price }}</span>
                <span
                  v-if="
                    product.originalPrice &&
                    product.originalPrice !== product.price
                  "
                  class="text-small-regular text-grey-40 line-through"
                >
                  {{ product.originalPrice }}
                </span>
              </div>
              <span class="text-small-semi uppercase tracking-[0.12em] text-grey-50">
                View
              </span>
            </div>
          </div>
        </RouterLink>
      </article>
    </div>

    <div
      v-else
      class="rounded-large border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
    >
      <h2 class="text-xl-semi text-grey-90">No products found</h2>
      <p class="mt-3 text-base-regular text-grey-60">
        The current region returned an empty catalog.
      </p>
    </div>

    <nav
      v-if="totalPages > 1"
      class="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Product pagination"
    >
      <button
        type="button"
        class="rounded-circle border border-grey-20 px-4 py-2 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage <= 1"
        @click="updateQuery({ page: currentPage - 1 })"
      >
        Previous
      </button>

      <button
        v-for="page in pageWindow"
        :key="page"
        type="button"
        class="h-10 min-w-10 rounded-circle border px-4 text-small-semi transition"
        :class="
          page === currentPage
            ? 'border-black bg-black text-white'
            : 'border-grey-20 text-grey-90 hover:border-grey-40'
        "
        @click="updateQuery({ page })"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="rounded-circle border border-grey-20 px-4 py-2 text-small-semi text-grey-90 transition hover:border-grey-40 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage >= totalPages"
        @click="updateQuery({ page: currentPage + 1 })"
      >
        Next
      </button>
    </nav>
  </section>
</template>
