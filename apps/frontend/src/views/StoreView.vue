<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import type { SortOptions } from '@/types/sort'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { getProductPrice } from '@lib/util/get-product-price'
import { useCatalogStore } from '@stores/catalog'
import { useRegionStore } from '@stores/region'

const PAGE_SIZE = 12

const sortOptions: Array<{ value: SortOptions; label: string }> = [
  { value: 'created_at', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
]

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="%23f3f4f6"/><path d="M188 520l96-120 76 96 44-52 112 140H188z" fill="%23d1d5db"/><circle cx="254" cy="262" r="44" fill="%23d1d5db"/></svg>'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const regionStore = useRegionStore()

const { products, productCount, isLoading } = storeToRefs(catalogStore)
const { countryCode } = storeToRefs(regionStore)
const isSortMenuOpen = ref(false)
const sortMenuRef = ref<HTMLElement | null>(null)

function isSortOption(value: unknown): value is SortOptions {
  return sortOptions.some((option) => option.value === value)
}

const currentPage = computed(() => {
  const rawValue = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const parsed = Number(rawValue)

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
})

const currentSort = computed<SortOptions>(() => {
  const rawValue = Array.isArray(route.query.sort) ? route.query.sort[0] : route.query.sort

  return isSortOption(rawValue) ? rawValue : 'created_at'
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
const currentSortLabel = computed(() => {
  return (
    sortOptions.find((option) => option.value === currentSort.value)?.label ??
    sortOptions[0]?.label ??
    'Сортировка'
  )
})

const activeCategoryIds = computed(() => {
  const rawValue = route.query.category_id
  const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []

  return values.filter((value): value is string => typeof value === 'string' && value.length > 0)
})

const productCards = computed(() => {
  return products.value.map((product) => {
    const prices = getProductPrice({ product })
    const activePrice = prices.cheapestPrice ?? prices.variantPrice

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description:
        product.subtitle ||
        product.description ||
        'Подробная информация доступна на странице товара.',
      thumbnail: product.thumbnail || product.images?.[0]?.url || placeholderImage,
      price: activePrice?.calculated_price || 'Цена недоступна',
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
      category_id: activeCategoryIds.value.length ? activeCategoryIds.value : undefined,
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

function productLink(product: Pick<HttpTypes.StoreProduct, 'handle'> | { handle?: string | null }) {
  return `/${countryCode.value}/products/${product.handle}`
}

function clearCategoryFilter() {
  const nextQuery = { ...route.query }
  delete nextQuery.category_id
  delete nextQuery.page

  void router.replace({
    query: nextQuery,
  })
}

function closeSortMenu() {
  isSortMenuOpen.value = false
}

function toggleSortMenu() {
  isSortMenuOpen.value = !isSortMenuOpen.value
}

function selectSort(nextSort: SortOptions) {
  closeSortMenu()

  if (nextSort === currentSort.value) {
    return
  }

  updateQuery({
    sort: nextSort,
    page: 1,
  })
}

function handleSortMenuPointerdown(event: PointerEvent) {
  const target = event.target

  if (!(target instanceof Node) || !sortMenuRef.value?.contains(target)) {
    closeSortMenu()
  }
}

function onSortTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    isSortMenuOpen.value = true
  }

  if (event.key === 'Escape') {
    closeSortMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleSortMenuPointerdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleSortMenuPointerdown)
})

watch(
  () => [
    countryCode.value,
    currentPage.value,
    currentSort.value,
    activeCategoryIds.value.join('|'),
  ],
  () => {
    void loadProducts()
  },
  { immediate: true },
)

watch(
  () => [currentPage.value, totalPages.value, isLoading.value],
  () => {
    if (!isLoading.value && currentPage.value > totalPages.value) {
      updateQuery({ page: totalPages.value })
    }
  },
)

watch(
  () => route.fullPath,
  () => {
    closeSortMenu()
  },
)
</script>

<template>
  <section class="store-hero">
    <div class="content-container">
      <div class="store-hero__panel">
        <div class="store-hero__content">
          <div>
            <p class="store-hero__label">Товары</p>
            <h1 class="store-hero__title">Все товары</h1>
            <!--            <p class="store-hero__description">-->
            <!--              Полный ассортимент для активного региона. Используйте страницу категорий, чтобы выбрать-->
            <!--              один или несколько разделов.-->
            <!--            </p>-->
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="store-layout content-container">
    <div class="flex items-center justify-between gap-4 border-b border-grey-20 pb-5">
      <p class="text-small-regular text-grey-60">
        <span class="font-semibold text-grey-90">{{ productCount }}</span> товаров
      </p>
      <div class="flex flex-wrap items-end justify-end gap-3">
        <button
          v-if="activeCategoryIds.length"
          type="button"
          class="rounded-circle border border-grey-20 px-4 py-2 text-small-semi text-grey-90 transition hover:border-grey-40"
          @click="clearCategoryFilter"
        >
          Сбросить категории
        </button>
        <!--        <p class="text-small-regular text-grey-50">-->
        <!--          Страница {{ currentPage }} из {{ totalPages }}-->
        <!--        </p>-->
        <div ref="sortMenuRef" class="store-sort">
          <button
            type="button"
            class="store-sort__trigger"
            aria-haspopup="listbox"
            :aria-expanded="isSortMenuOpen ? 'true' : 'false'"
            aria-label="Сортировка товаров"
            @click="toggleSortMenu"
            @keydown="onSortTriggerKeydown"
          >
            <span class="store-sort__value">{{ currentSortLabel }}</span>
            <span class="store-sort__icon" :class="{ 'store-sort__icon--open': isSortMenuOpen }" aria-hidden="true">
              <span />
            </span>
          </button>

          <div v-if="isSortMenuOpen" class="store-sort__menu" role="listbox" aria-label="Сортировка товаров">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="store-sort__option"
              :class="{ 'store-sort__option--active': option.value === currentSort }"
              :aria-selected="option.value === currentSort ? 'true' : 'false'"
              role="option"
              @click="selectSort(option.value)"
            >
              <span>{{ option.label }}</span>
              <span v-if="option.value === currentSort" class="store-sort__option-mark" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="grid gap-5 pt-8 sm:grid-cols-2 xl:grid-cols-3">
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

    <div v-else-if="hasProducts" class="grid gap-5 pt-8 sm:grid-cols-2 xl:grid-cols-3">
      <ProductCard
        v-for="product in productCards"
        :key="product.id"
        :to="productLink(product)"
        :title="product.title"
        :description="product.description"
        :thumbnail="product.thumbnail"
        :price="product.price"
        :original-price="product.originalPrice"
        :percentage-diff="product.percentageDiff"
      />
    </div>

    <div
      v-else
      class="rounded-large border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
    >
      <h2 class="text-xl-semi text-grey-90">Товары не найдены</h2>
      <p class="mt-3 text-base-regular text-grey-60">
        Для текущего региона каталог оказался пустым.
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
        Назад
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
        Вперёд
      </button>
    </nav>
  </section>
</template>

<style scoped>
.store-hero {
  padding: 28px 0 18px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.16), transparent 30%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74) 0%, rgb(var(--white-rgb) / 0.98) 62%);
}

.store-hero__panel {
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

.store-hero__panel::after {
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

.store-hero__content {
  display: grid;
  gap: 18px;
}

.store-hero__label {
  margin: 0;
  color: var(--brand-lime-light);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.store-hero__title {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.6rem, 5vw, 4.45rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.03em;
}

.store-hero__description {
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.9);
  font-size: 15px;
  line-height: 1.75;
}

.store-layout {
  padding-top: 32px;
  padding-bottom: 48px;
}

.store-sort {
  position: relative;
  display: inline-flex;
  min-width: 220px;
}

.store-sort__trigger {
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 220px;
  min-height: 38px;
  padding: 0 14px 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-dark);
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.55), rgb(var(--white-rgb) / 0.98));
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.4;
  text-align: left;
  box-shadow: 0 12px 24px rgb(var(--brand-dark-rgb) / 0.06);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.store-sort__trigger:hover {
  border-color: rgb(var(--brand-dark-rgb) / 0.18);
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.08);
}

.store-sort__trigger:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.5);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
  outline: none;
}

.store-sort__value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-sort__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 12px;
  flex: 0 0 auto;
}

.store-sort__icon span,
.store-sort__option-mark {
  display: block;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid rgb(var(--brand-dark-rgb) / 0.72);
  border-bottom: 1.5px solid rgb(var(--brand-dark-rgb) / 0.72);
}

.store-sort__icon span {
  transform: rotate(45deg);
  transition: transform 180ms ease;
}

.store-sort__icon--open span {
  transform: rotate(225deg);
}

.store-sort__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 10;
  display: grid;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.94), rgb(var(--white-rgb) / 0.98)),
    linear-gradient(180deg, rgb(var(--brand-lime-light-rgb) / 0.06), transparent);
  box-shadow: 0 24px 44px rgb(var(--brand-dark-rgb) / 0.14);
}

.store-sort__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  color: var(--text-dark);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.store-sort__option:hover,
.store-sort__option:focus-visible {
  color: var(--brand-dark);
  background: rgb(var(--brand-lime-light-rgb) / 0.12);
  outline: none;
}

.store-sort__option--active {
  color: var(--brand-dark);
  background: rgb(var(--brand-lime-light-rgb) / 0.14);
}

.store-sort__option-mark {
  width: 7px;
  height: 11px;
  border-color: var(--brand-olive);
  transform: rotate(45deg);
}

@media (max-width: 639px) {
  .store-hero {
    padding-top: 18px;
  }

  .store-hero__panel {
    padding: 28px 20px;
  }

  .store-hero__title {
    font-size: 36px;
  }

  .store-sort {
    width: 100%;
    min-width: 0;
  }

  .store-sort__trigger,
  .store-sort__menu {
    min-width: 0;
    width: 100%;
  }
}
</style>
