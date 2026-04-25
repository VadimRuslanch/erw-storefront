<script setup lang="ts">
type CatalogFilterCategory = {
  id: string
  name: string
  depth: number
}

defineProps<{
  categories: CatalogFilterCategory[]
  selectedIds: string[]
  selectedCount: number
  isLoading: boolean
  titleId?: string
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
  apply: []
  reset: []
}>()

function updateSelectedIds(value: string[]) {
  emit('update:selectedIds', value)
}
</script>

<template>
  <div class="catalog-filter">
    <div class="catalog-filter__header">
      <div>
        <h2 :id="titleId" class="catalog-filter__title">Фильтр</h2>
        <p class="catalog-filter__meta">Выбрано: {{ selectedCount }}</p>
      </div>
      <button
        type="button"
        class="catalog-filter__reset"
        :disabled="selectedCount === 0"
        @click="emit('reset')"
      >
        Сбросить
      </button>
    </div>

    <div v-if="isLoading && categories.length === 0" class="catalog-filter__skeleton">
      <div v-for="index in 6" :key="index" class="catalog-filter__skeleton-row" />
    </div>

    <fieldset v-else class="catalog-filter__options">
      <legend class="sr-only">Фильтр категорий</legend>
      <label
        v-for="category in categories"
        :key="category.id"
        class="catalog-filter__option"
        :style="{ '--category-depth': `${category.depth}` }"
      >
        <input
          :checked="selectedIds.includes(category.id)"
          type="checkbox"
          class="catalog-filter__checkbox"
          :value="category.id"
          @change="
            updateSelectedIds(
              ($event.currentTarget as HTMLInputElement).checked
                ? [...selectedIds, category.id]
                : selectedIds.filter((categoryId) => categoryId !== category.id),
            )
          "
        />
        <span class="catalog-filter__option-label">{{ category.name }}</span>
      </label>
    </fieldset>

    <button
      type="button"
      class="catalog-filter__submit"
      :disabled="isLoading || categories.length === 0"
      @click="emit('apply')"
    >
      Применить
    </button>
  </div>
</template>

<style scoped>
.catalog-filter {
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.72), rgb(var(--white-rgb) / 0.98)),
    linear-gradient(180deg, rgb(var(--brand-lime-light-rgb) / 0.06), transparent);
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.catalog-filter__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--border-soft);
}

.catalog-filter__title {
  margin: 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: 0.02em;
}

.catalog-filter__meta {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.catalog-filter__reset,
.catalog-filter__submit {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.catalog-filter__reset {
  padding: 0;
  border: 0;
  color: var(--brand-olive);
  background: transparent;
  transition: color 180ms ease;
}

.catalog-filter__reset:hover:not(:disabled),
.catalog-filter__reset:focus-visible {
  color: var(--brand-dark);
}

.catalog-filter__reset:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.catalog-filter__skeleton {
  display: grid;
  gap: 12px;
  padding: 20px 14px;
}

.catalog-filter__skeleton-row {
  height: 20px;
  border-radius: 999px;
  background: rgb(var(--brand-dark-rgb) / 0.08);
}

.catalog-filter__options {
  max-height: 52vh;
  margin: 0;
  padding: 14px 14px 10px;
  overflow-y: auto;
}

.catalog-filter__option {
  --indent: calc(12px + (var(--category-depth, 0) * 18px));
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 10px 12px 10px var(--indent);
  border-radius: 8px;
  color: var(--text-dark);
  font-size: 14px;
  line-height: 1.45;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.catalog-filter__option:hover {
  background: rgb(var(--brand-lime-light-rgb) / 0.1);
  color: var(--brand-dark);
}

.catalog-filter__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--brand-olive);
}

.catalog-filter__option-label {
  flex: 1;
}

.catalog-filter__submit {
  width: calc(100% - 28px);
  margin: 8px 14px 14px;
  padding: 13px 18px;
  border: 0;
  border-radius: 999px;
  color: var(--white);
  background: linear-gradient(
    135deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 72%,
    var(--brand-lime) 100%
  );
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.catalog-filter__submit:hover:not(:disabled),
.catalog-filter__submit:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.16);
}

.catalog-filter__submit:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (max-width: 639px) {
  .catalog-filter {
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .catalog-filter__header {
    padding: 18px 62px 16px 18px;
  }

  .catalog-filter__submit {
    padding-right: 18px;
    padding-left: 18px;
  }
}
</style>
