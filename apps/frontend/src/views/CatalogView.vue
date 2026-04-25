<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/BaseModal.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
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
const isFilterModalOpen = ref(false)

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
      description: category.description || 'Товары, объединённые в этой категории.',
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
  closeFilterModal()
}

function resetCategories() {
  selectedCategoryIds.value = []
  void router.replace({ query: {} })
}

function openFilterModal() {
  isFilterModalOpen.value = true
}

function closeFilterModal() {
  isFilterModalOpen.value = false
}

function categoryLink(category: CategoryCard) {
  return {
    path: `/${countryCode.value}/store`,
    query: {
      category_id: category.id,
    },
  }
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
  <section class="catalog-hero">
    <div class="content-container">
      <div class="catalog-hero__panel">
        <!--        <div class="catalog-hero__eyebrow">-->
        <!--          <span class="catalog-hero__eyebrow-line" aria-hidden="true" />-->
        <!--          <p class="catalog-hero__kicker">Навигатор по коллекциям</p>-->
        <!--        </div>-->

        <div class="catalog-hero__content">
          <div>
            <p class="catalog-hero__label">Категории</p>
            <h1 class="catalog-hero__title">Категории</h1>
            <!--            <p class="catalog-hero__description">-->
            <!--              Выберите одно или несколько направлений и перейдите к ассортименту.-->
            <!--            </p>-->
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="catalog-layout content-container">
    <aside class="catalog-sidebar lg:sticky lg:top-24 lg:self-start">
      <CatalogFilter
        v-model:selected-ids="selectedCategoryIds"
        :categories="categoryCards"
        :selected-count="selectedCount"
        :is-loading="isCategoriesLoading"
        @apply="applyCategories"
        @reset="resetCategories"
      />
    </aside>

    <div class="catalog-results">
      <div class="catalog-results__header">
        <div>
          <p class="catalog-results__label">Коллекции магазина</p>
        </div>
        <p v-if="selectedCategoryNames.length" class="catalog-results__selected">
          Выбрано: {{ selectedCategoryNames.join(', ') }}
        </p>
      </div>

      <button type="button" class="catalog-filter-toggle" @click="openFilterModal">
        <span>Фильтр</span>
        <strong>{{ selectedCount }}</strong>
      </button>

      <div v-if="isCategoriesLoading && categoryCards.length === 0" class="catalog-grid">
        <article v-for="index in 6" :key="index" class="catalog-card catalog-card--skeleton">
          <div class="catalog-card__ornament" aria-hidden="true" />
          <div class="h-4 w-24 animate-pulse rounded-full bg-[rgb(var(--brand-dark-rgb)/0.08)]" />
          <div
            class="mt-5 h-8 w-3/4 animate-pulse rounded-full bg-[rgb(var(--brand-dark-rgb)/0.08)]"
          />
          <div class="mt-4 h-16 animate-pulse rounded-2xl bg-[rgb(var(--brand-dark-rgb)/0.08)]" />
        </article>
      </div>

      <div v-else-if="categoryCards.length" class="catalog-grid">
        <article v-for="category in categoryCards" :key="category.id" class="catalog-card">
          <RouterLink :to="categoryLink(category)" class="catalog-card__link">
            <div class="catalog-card__ornament" aria-hidden="true" />
            <div class="catalog-card__meta">
              <p class="catalog-card__kicker">
                {{ category.depth === 0 ? 'Основная категория' : 'Вложенная категория' }}
              </p>
              <p class="catalog-card__count">{{ category.productCount }} товаров</p>
            </div>
            <h2 class="catalog-card__title">{{ category.name }}</h2>
            <p class="catalog-card__description">
              {{ category.description }}
            </p>
          </RouterLink>
        </article>
      </div>

      <div v-else class="catalog-empty">
        <h2 class="catalog-empty__title">Категории не найдены</h2>
        <p class="catalog-empty__description">
          Категории появятся здесь, как только станут доступны в магазине.
        </p>
      </div>
    </div>
  </section>

  <BaseModal
    :is-open="isFilterModalOpen"
    title-id="catalog-filter-modal-title"
    @close="closeFilterModal"
  >
    <CatalogFilter
      v-model:selected-ids="selectedCategoryIds"
      :categories="categoryCards"
      :selected-count="selectedCount"
      :is-loading="isCategoriesLoading"
      title-id="catalog-filter-modal-title"
      @apply="applyCategories"
      @reset="resetCategories"
    />
  </BaseModal>
</template>

<style scoped>
.catalog-hero {
  padding: 28px 0 18px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.16), transparent 30%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74) 0%, rgb(var(--white-rgb) / 0.98) 62%);
}

.catalog-hero__panel {
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

.catalog-hero__panel::after {
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

.catalog-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.catalog-hero__eyebrow-line {
  width: 48px;
  height: 1px;
  background: rgb(var(--brand-lime-light-rgb) / 0.8);
}

.catalog-hero__kicker,
.catalog-hero__label,
.catalog-results__label,
.catalog-card__kicker,
.catalog-card__cta,
.catalog-filter-toggle {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.catalog-hero__kicker {
  color: rgb(var(--cream-rgb) / 0.86);
}

.catalog-hero__content {
  display: grid;
  gap: 18px;
}

.catalog-hero__label {
  color: var(--brand-lime-light);
}

.catalog-hero__title {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.6rem, 5vw, 4.45rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.03em;
}

.catalog-hero__description {
  max-width: 650px;
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.9);
  font-size: 15px;
  line-height: 1.75;
}

.catalog-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.catalog-hero__stat {
  min-width: 140px;
  padding: 14px 16px;
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.08);
}

.catalog-hero__stat dt {
  color: rgb(var(--cream-rgb) / 0.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.catalog-hero__stat dd {
  margin: 10px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: 32px;
  line-height: 1;
}

.catalog-layout {
  display: grid;
  gap: 32px;
  padding-top: 32px;
  padding-bottom: 48px;
}

.catalog-sidebar {
  display: none;
  align-self: start;
}

.catalog-results {
  min-width: 0;
}

.catalog-filter-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 44px;
  margin-bottom: 18px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-dark);
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.72), rgb(var(--white-rgb) / 0.98));
  box-shadow: 0 12px 24px rgb(var(--brand-dark-rgb) / 0.06);
}

.catalog-filter-toggle strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  color: var(--white);
  background: var(--brand-olive);
  font-size: 12px;
  line-height: 1;
}

.catalog-filter-toggle:hover,
.catalog-filter-toggle:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
}

.catalog-results__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-soft);
}

.catalog-results__label {
  color: var(--brand-olive);
}

.catalog-results__selected {
  max-width: 540px;
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.catalog-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.catalog-card {
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--white) 0%, rgb(var(--cream-rgb) / 0.35) 100%);
  box-shadow: 0 16px 36px rgb(var(--brand-dark-rgb) / 0.06);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.catalog-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  box-shadow: 0 24px 54px rgb(var(--brand-dark-rgb) / 0.12);
}

.catalog-card__link {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 24px 22px 22px;
}

.catalog-card__link:hover {
  color: inherit;
}

.catalog-card__ornament {
  width: 68px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgb(var(--brand-lime-rgb) / 0.94),
    rgb(var(--brand-lime-light-rgb) / 0.94)
  );
}

.catalog-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
}

.catalog-card__kicker {
  color: var(--brand-olive);
}

.catalog-card__count {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.catalog-card__title {
  margin: 16px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 0.98;
  letter-spacing: 0.02em;
  text-wrap: balance;
}

.catalog-card__description {
  display: -webkit-box;
  margin: 16px 0 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.68;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.catalog-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-top: auto;
  padding-top: 22px;
}

.catalog-card__path {
  color: rgb(var(--brand-dark-rgb) / 0.58);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.catalog-card__cta {
  color: var(--brand-olive);
}

.catalog-card--skeleton {
  padding: 24px 22px 22px;
}

.catalog-empty {
  padding: 42px 28px;
  border: 1px dashed rgb(var(--brand-dark-rgb) / 0.22);
  border-radius: 8px;
  background: rgb(var(--cream-rgb) / 0.48);
  text-align: center;
}

.catalog-empty__title {
  margin: 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 32px;
  line-height: 1;
}

.catalog-empty__description {
  max-width: 460px;
  margin: 14px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

@media (min-width: 640px) {
  .catalog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .catalog-layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .catalog-sidebar {
    display: block;
  }

  .catalog-filter-toggle {
    display: none;
  }
}

@media (min-width: 1280px) {
  .catalog-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .catalog-hero {
    padding-top: 18px;
  }

  .catalog-hero__panel {
    padding: 28px 20px;
  }

  .catalog-hero__eyebrow {
    gap: 10px;
  }

  .catalog-hero__eyebrow-line {
    width: 32px;
  }

  .catalog-hero__title {
    font-size: 36px;
  }

  .catalog-hero__stat {
    min-width: calc(50% - 7px);
  }

  .catalog-card__link,
  .catalog-card--skeleton {
    padding-left: 18px;
    padding-right: 18px;
  }

  .catalog-card__title,
  .catalog-empty__title {
    font-size: 28px;
  }

  .catalog-results__header {
    align-items: flex-start;
  }
}
</style>
