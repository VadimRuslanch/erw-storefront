<script setup lang="ts">
import type { HttpTypes } from '@medusajs/types'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  item: HttpTypes.StoreCartLineItem
  to: string
  imageSrc: string
  title: string
  variantLabel?: string | null
  unitPrice: string
  lineTotal: string
  discount?: string | null
  isUpdating?: boolean
}>()

const emit = defineEmits<{
  decrement: [item: HttpTypes.StoreCartLineItem]
  increment: [item: HttpTypes.StoreCartLineItem]
  updateQuantity: [item: HttpTypes.StoreCartLineItem, quantity: number]
  remove: [item: HttpTypes.StoreCartLineItem]
}>()

const sku = computed(() => props.item.variant_sku || props.item.variant?.sku || null)
const removeLabel = computed(() => `Удалить ${props.title} из корзины`)

function onQuantityChange(event: Event) {
  const target = event.target as HTMLInputElement

  emit('updateQuantity', props.item, Number(target.value))
}
</script>

<template>
  <article class="cart-item">
    <RouterLink :to="to" class="cart-item__media" :aria-label="`Открыть ${title}`">
      <img :src="imageSrc" :alt="title" class="cart-item__image" loading="lazy" />
    </RouterLink>

    <div class="cart-item__body">
      <div class="cart-item__copy">
        <p class="cart-item__kicker">Товар</p>
        <RouterLink :to="to" class="cart-item__title">
          {{ title }}
        </RouterLink>
        <p v-if="variantLabel" class="cart-item__meta">
          {{ variantLabel }}
        </p>
        <p v-if="sku" class="cart-item__meta">SKU: {{ sku }}</p>
        <p class="cart-item__unit-price">{{ unitPrice }} за штуку</p>
      </div>

      <div class="cart-item__controls">
        <div class="cart-item__totals">
          <p class="cart-item__total">{{ lineTotal }}</p>
          <p v-if="discount" class="cart-item__discount">Скидка {{ discount }}</p>
        </div>

        <div class="cart-quantity" aria-label="Количество товара">
          <button
            type="button"
            class="cart-quantity__button"
            :disabled="isUpdating"
            :aria-label="`Уменьшить количество ${title}`"
            @click="emit('decrement', item)"
          >
            -
          </button>
          <input
            :value="item.quantity"
            type="number"
            min="1"
            class="cart-quantity__input"
            :disabled="isUpdating"
            :aria-label="`Количество ${title}`"
            @change="onQuantityChange"
          />
          <button
            type="button"
            class="cart-quantity__button"
            :disabled="isUpdating"
            :aria-label="`Увеличить количество ${title}`"
            @click="emit('increment', item)"
          >
            +
          </button>
        </div>

        <button
          type="button"
          class="cart-item__remove"
          :disabled="isUpdating"
          :aria-label="removeLabel"
          @click="emit('remove', item)"
        >
          Удалить
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.cart-item {
  display: grid;
  grid-template-columns: minmax(96px, 118px) minmax(0, 1fr);
  align-items: start;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--white) 0%, rgb(var(--cream-rgb) / 0.35) 100%);
  box-shadow: 0 16px 36px rgb(var(--brand-dark-rgb) / 0.06);
}

.cart-item__media {
  display: block;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.82), rgb(var(--white-rgb) / 0.94)),
    radial-gradient(circle at top, rgb(var(--brand-lime-light-rgb) / 0.18), transparent 58%);
}

.cart-item__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(132px, 150px);
  align-items: start;
  gap: 18px;
  min-width: 0;
}

.cart-item__copy {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
}

.cart-item__kicker,
.cart-item__remove {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.cart-item__kicker {
  color: var(--brand-olive);
}

.cart-item__title {
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: clamp(1.55rem, 2.6vw, 2rem);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: 0.02em;
  text-wrap: balance;
}

.cart-item__title:hover,
.cart-item__title:focus-visible {
  color: var(--brand-olive);
}

.cart-item__meta,
.cart-item__unit-price {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.cart-item__unit-price {
  margin-top: 3px;
}

.cart-item__controls {
  display: grid;
  justify-items: end;
  gap: 10px;
  min-width: 0;
}

.cart-item__totals {
  text-align: right;
}

.cart-item__total {
  margin: 0;
  color: var(--brand-dark);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.cart-item__discount {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.cart-quantity {
  display: grid;
  grid-template-columns: 34px 42px 34px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: rgb(var(--white-rgb) / 0.92);
}

.cart-quantity__button,
.cart-quantity__input {
  height: 36px;
  border: 0;
  color: var(--brand-dark);
  background: transparent;
}

.cart-quantity__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  transition: background-color 180ms ease;
}

.cart-quantity__button:hover:not(:disabled) {
  background: rgb(var(--brand-lime-light-rgb) / 0.12);
}

.cart-quantity__input {
  border-right: 1px solid var(--border-soft);
  border-left: 1px solid var(--border-soft);
  text-align: center;
  font-size: 14px;
  outline: none;
}

.cart-quantity__input::-webkit-outer-spin-button,
.cart-quantity__input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.cart-item__remove {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-olive);
  background: rgb(var(--white-rgb) / 0.72);
  transition:
    border-color 180ms ease,
    color 180ms ease,
    background-color 180ms ease;
}

.cart-item__remove:hover:not(:disabled),
.cart-item__remove:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  color: var(--brand-dark);
  background: rgb(var(--brand-lime-light-rgb) / 0.1);
}

.cart-quantity__button:disabled,
.cart-quantity__input:disabled,
.cart-item__remove:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (max-width: 767px) {
  .cart-item {
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 14px;
    padding: 16px;
  }

  .cart-item__body {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .cart-item__controls {
    justify-items: start;
    padding-top: 12px;
    border-top: 1px solid var(--border-soft);
  }

  .cart-item__totals {
    text-align: left;
  }

  .cart-item__title {
    font-size: 25px;
  }
}

@media (max-width: 479px) {
  .cart-item {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .cart-item__title {
    font-size: 22px;
  }

  .cart-item__meta,
  .cart-item__unit-price {
    font-size: 12px;
  }
}
</style>
