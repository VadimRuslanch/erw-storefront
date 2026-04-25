<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '@stores/catalog'
import { useRegionStore } from '@stores/region'

type CategoryCard = {
  id: string
  name: string
  description: string
  handle: string
  depth: number
  productCount: number
  path: string
}

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const regionStore = useRegionStore()

const { categories, isCategoriesLoading } = storeToRefs(catalogStore)
const { countryCode } = storeToRefs(regionStore)

const selectedCategoryIds = ref<string[]>([])

const selectedCount = computed(() => selectedCategoryIds.value.length)

const categoryCards = computed<CategoryCard[]>(() => {
  const collected = new Map<string, HttpTypes.StoreProductCategory>()

  function collect(category: HttpTypes.StoreProductCategory) {
    if (!collected.has(category.id)) {
      collected.set(category.id, category)
    }

    category.category_children?.forEach(collect)
  }

  categories.value.forEach(collect)

  const allCategories = Array.from(collected.values())
  const childrenByParent = new Map<string | null, HttpTypes.StoreProductCategory[]>()

  allCategories.forEach((category) => {
    const parentId = category.parent_category_id ?? category.parent_category?.id ?? null
    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(category)
    childrenByParent.set(parentId, siblings)
  })

  childrenByParent.forEach((siblings) => {
    siblings.sort((first, second) => {
      const rankDiff = (first.rank ?? 0) - (second.rank ?? 0)
      return rankDiff || first.name.localeCompare(second.name)
    })
  })

  const cards: CategoryCard[] = []
  const visited = new Set<string>()

  function getCategoryPath(category: HttpTypes.StoreProductCategory): string {
    const parent = category.parent_category_id
      ? collected.get(category.parent_category_id)
      : category.parent_category

    if (!parent) {
      return category.handle
    }

    return `${getCategoryPath(parent)}/${category.handle}`
  }

  function appendCategory(category: HttpTypes.StoreProductCategory, depth: number) {
    if (visited.has(category.id)) {
      return
    }

    visited.add(category.id)
    cards.push({
      id: category.id,
      name: category.name,
      description: category.description || 'Products grouped in this category.',
      handle: category.handle,
      depth,
      productCount: category.products?.length ?? 0,
      path: getCategoryPath(category),
    })

    const children = childrenByParent.get(category.id) ?? []
    children.forEach((childCategory) => appendCategory(childCategory, depth + 1))
  }

  const roots = allCategories.filter((category) => {
    const parentId = category.parent_category_id ?? category.parent_category?.id ?? null
    return !parentId || !collected.has(parentId)
  })

  roots.forEach((category) => appendCategory(category, 0))
  allCategories.forEach((category) => appendCategory(category, 0))

  return cards
})

const selectedCategoryNames = computed(() => {
  const selectedIds = new Set(selectedCategoryIds.value)
  return categoryCards.value
    .filter((category) => selectedIds.has(category.id))
    .map((category) => category.name)
})

function readCategoryIdsFromQuery() {
  const rawValue = route.query.category_id
  const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []

  return values.filter((value): value is string => typeof value === 'string' && value.length > 0)
}

function applyCategories() {
  void router.push({
    path: `/${countryCode.value}/store`,
    query: selectedCategoryIds.value.length
      ? {
          category_id: selectedCategoryIds.value,
        }
      : undefined,
  })
}

function resetCategories() {
  selectedCategoryIds.value = []
  void router.replace({ query: {} })
}

function categoryLink(category: CategoryCard) {
  return `/${countryCode.value}/categories/${category.path}`
}

watch(
  () => route.query.category_id,
  () => {
    selectedCategoryIds.value = readCategoryIdsFromQuery()
  },
  { immediate: true },
)

watch(
  () => countryCode.value,
  () => {
    void catalogStore.loadCategories({
      include_descendants_tree: true,
      limit: 200,
    })
  },
  { immediate: true },
)
</script>

<template>
  <section class="border-b border-grey-20 bg-[linear-gradient(180deg,#f7f4ec_0%,#fffdf7_52%,#ffffff_100%)]">
    <div class="content-container py-12">
      <p class="text-small-semi uppercase tracking-[0.18em] text-grey-50">Catalog</p>
      <h1 class="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none text-grey-90">
        Categories
      </h1>
      <p class="mt-5 max-w-2xl text-base-regular text-grey-60">
        Select one or more categories, apply the filter, and continue to the matching product list.
      </p>
    </div>
  </section>

  <section class="content-container grid gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside class="lg:sticky lg:top-24 lg:self-start">
      <div class="rounded-rounded border border-grey-20 bg-white p-5">
        <div class="flex items-center justify-between gap-4 border-b border-grey-20 pb-4">
          <div>
            <h2 class="text-large-semi text-grey-90">Categories</h2>
            <p class="text-small-regular text-grey-50">{{ selectedCount }} selected</p>
          </div>
          <button
            type="button"
            class="text-small-semi text-grey-50 transition hover:text-grey-90 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="selectedCount === 0"
            @click="resetCategories"
          >
            Reset
          </button>
        </div>

        <div
          v-if="isCategoriesLoading && categoryCards.length === 0"
          class="space-y-3 py-5"
        >
          <div
            v-for="index in 6"
            :key="index"
            class="h-5 animate-pulse rounded bg-grey-10"
          />
        </div>

        <fieldset
          v-else
          class="max-h-[52vh] space-y-1 overflow-y-auto py-5 pr-1"
        >
          <legend class="sr-only">Category filter</legend>
          <label
            v-for="category in categoryCards"
            :key="category.id"
            class="flex cursor-pointer items-center gap-3 rounded-base px-2 py-2 text-base-regular text-grey-70 transition hover:bg-grey-5 hover:text-grey-90"
            :style="{ paddingLeft: `${8 + category.depth * 16}px` }"
          >
            <input
              v-model="selectedCategoryIds"
              type="checkbox"
              class="h-4 w-4 rounded-base border-grey-30 text-grey-90 focus:ring-grey-40"
              :value="category.id"
            />
            <span>{{ category.name }}</span>
          </label>
        </fieldset>

        <button
          type="button"
          class="h-11 w-full rounded-base bg-black px-4 text-small-semi text-white transition hover:bg-grey-80 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="isCategoriesLoading || categoryCards.length === 0"
          @click="applyCategories"
        >
          Apply
        </button>
      </div>
    </aside>

    <div>
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-grey-20 pb-5">
        <p class="text-small-regular text-grey-60">
          <span class="font-semibold text-grey-90">{{ categoryCards.length }}</span> categories
        </p>
        <p
          v-if="selectedCategoryNames.length"
          class="max-w-xl text-small-regular text-grey-50"
        >
          Selected: {{ selectedCategoryNames.join(', ') }}
        </p>
      </div>

      <div
        v-if="isCategoriesLoading && categoryCards.length === 0"
        class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="index in 6"
          :key="index"
          class="rounded-rounded border border-grey-20 bg-white p-5"
        >
          <div class="h-5 w-24 animate-pulse rounded bg-grey-10" />
          <div class="mt-5 h-8 w-3/4 animate-pulse rounded bg-grey-10" />
          <div class="mt-4 h-16 animate-pulse rounded bg-grey-10" />
        </article>
      </div>

      <div
        v-else-if="categoryCards.length"
        class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="category in categoryCards"
          :key="category.id"
          class="rounded-rounded border border-grey-20 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-grey-40 hover:shadow-[0_24px_70px_-32px_rgba(17,24,39,0.28)]"
        >
          <RouterLink
            :to="categoryLink(category)"
            class="block"
          >
            <p class="text-small-semi uppercase tracking-[0.14em] text-grey-50">
              {{ category.productCount }} products
            </p>
            <h2 class="mt-3 text-xl-semi text-grey-90">{{ category.name }}</h2>
            <p class="mt-3 line-clamp-3 text-base-regular text-grey-60">
              {{ category.description }}
            </p>
            <p class="mt-5 text-small-semi uppercase tracking-[0.12em] text-grey-50">
              View category
            </p>
          </RouterLink>
        </article>
      </div>

      <div
        v-else
        class="rounded-rounded border border-dashed border-grey-30 bg-grey-5 px-6 py-14 text-center"
      >
        <h2 class="text-xl-semi text-grey-90">No categories found</h2>
        <p class="mt-3 text-base-regular text-grey-60">
          Categories will appear here once they are available in the store.
        </p>
      </div>
    </div>
  </section>
</template>
