<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRegionStore } from '@stores/region'
import logoImage from '@/assets/icons/logo-new.png'

const regionStore = useRegionStore()
const { countryCode } = storeToRefs(regionStore)
</script>

<template>
  <div class="checkout-shell">
    <header class="checkout-header">
      <nav class="content-container checkout-nav" aria-label="Навигация оформления">
        <RouterLink :to="`/${countryCode || ''}/cart`" class="checkout-nav__back">
          Вернуться в корзину
        </RouterLink>
        <RouterLink :to="`/${countryCode || ''}`" class="checkout-nav__brand" aria-label="ERAWADEE">
<!--          <img :src="logoImage" alt="" class="checkout-nav__logo" />-->
          <span class="checkout-nav__brand-text">ERAWADEE</span>
        </RouterLink>
        <p class="checkout-nav__meta">Безопасное оформление</p>
      </nav>
    </header>

    <main class="checkout-main">
      <div class="content-container checkout-main__inner">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.checkout-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  color: var(--text-dark);
  background: var(--white);
}

.checkout-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--border-soft);
  background: rgb(var(--cream-rgb) / 0.94);
  backdrop-filter: blur(14px);
}

.checkout-nav {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  min-height: 72px;
}

.checkout-nav__logo {
  width: 50px;
  height: auto;
}

.checkout-nav__back,
.checkout-nav__meta {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.checkout-nav__back {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-dark);
  background: rgb(var(--white-rgb) / 0.78);
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    color 180ms ease;
}

.checkout-nav__back:hover,
.checkout-nav__back:focus-visible {
  color: var(--brand-olive);
  border-color: rgb(var(--brand-lime-rgb) / 0.34);
  transform: translateY(-1px);
}

.checkout-nav__brand {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--brand-dark);
}

.checkout-nav__brand-text {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.checkout-nav__brand:hover,
.checkout-nav__brand:focus-visible {
  color: var(--brand-olive);
}

.checkout-nav__meta {
  justify-self: end;
  color: var(--brand-olive);
}

.checkout-main {
  flex: 1 0 auto;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.08), transparent 24%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.54) 0%, rgb(var(--white-rgb) / 0.98) 220px);
}

.checkout-main__inner {
  padding-top: 32px;
  padding-bottom: 48px;
}

@media (max-width: 768px) {
  .checkout-nav {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 12px;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .checkout-nav__brand,
  .checkout-nav__meta {
    justify-self: start;
  }

  .checkout-main__inner {
    padding-top: 24px;
  }
}
</style>
