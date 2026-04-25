<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  to: string
  title: string
  description: string
  thumbnail: string
  price: string
  originalPrice?: string | null
  percentageDiff?: string | number | null
}>()
</script>

<template>
  <article class="product-card">
    <RouterLink :to="to" class="product-link">
      <div class="product-media">
        <img :src="thumbnail" :alt="title" class="product-image" loading="lazy" />
        <div
          v-if="percentageDiff && Number(percentageDiff) > 0"
          class="product-badge"
          aria-label="Размер скидки"
        >
          -{{ percentageDiff }}%
        </div>
      </div>

      <div class="product-body">
        <div class="product-copy">
          <p class="product-kicker">Товар</p>
          <h2 class="product-title">{{ title }}</h2>
          <p class="product-description">
            {{ description }}
          </p>
        </div>

        <div class="product-footer">
          <div class="product-price">
            <span class="product-price-current">{{ price }}</span>
            <span v-if="originalPrice && originalPrice !== price" class="product-price-original">
              {{ originalPrice }}
            </span>
          </div>
          <span class="product-cta">Открыть</span>
        </div>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.product-card {
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--white) 0%, rgb(var(--cream-rgb) / 0.32) 100%);
  box-shadow: 0 16px 36px rgb(var(--brand-dark-rgb) / 0.06);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  box-shadow: 0 24px 54px rgb(var(--brand-dark-rgb) / 0.12);
}

.product-link {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.product-link:hover {
  color: inherit;
}

.product-media {
  position: relative;
  aspect-ratio: 4 / 3.35;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.82), rgb(var(--white-rgb) / 0.94)),
    radial-gradient(circle at top, rgb(var(--brand-lime-light-rgb) / 0.18), transparent 58%);
}

.product-media::after {
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

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 320ms ease;
}

.product-card:hover .product-image {
  transform: scale(1.035);
}

.product-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 7px 10px;
  border-radius: 999px;
  color: var(--white);
  background: var(--brand-dark);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
}

.product-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 20px 24px;
}

.product-copy {
  display: grid;
  gap: 10px;
}

.product-kicker {
  margin: 0;
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.4;
  text-transform: uppercase;
}

.product-title {
  margin: 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 31px;
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: 0.02em;
}

.product-description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.65;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.product-price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}

.product-price-current {
  color: var(--brand-dark);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.product-price-original {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.2;
  text-decoration: line-through;
}

.product-cta {
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .product-media {
    aspect-ratio: 4 / 3.1;
  }

  .product-body {
    padding: 18px 18px 20px;
  }

  .product-title {
    font-size: 28px;
  }
}
</style>
