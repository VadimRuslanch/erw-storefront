<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import iconCart from '@/assets/icons/icon-cart.svg'
import { useCustomerStore } from '@stores/customer'
import { useCartStore } from '@stores/cart'
import { useRegionStore } from '@stores/region'
import { catalogContacts } from '@/content/erawadeeCatalogCover'

const regionStore = useRegionStore()
const customerStore = useCustomerStore()
const cartStore = useCartStore()
const route = useRoute()
const { countryCode } = storeToRefs(regionStore)
const { customer } = storeToRefs(customerStore)
const { cart } = storeToRefs(cartStore)
const showLayoutFooter = computed(() => route.name !== 'home')
const cartItemCount = computed(() => {
  return (cart.value?.items ?? []).reduce((total, item) => total + item.quantity, 0)
})

onMounted(() => {
  void customerStore.loadCustomer()
  void cartStore.loadCart()
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <nav class="content-container site-nav" aria-label="Основная навигация">
        <RouterLink :to="`/${countryCode || ''}`" class="site-brand">ERAWADEE</RouterLink>
        <div class="site-links">
          <RouterLink :to="`/${countryCode || ''}/store`">Товары</RouterLink>
          <RouterLink :to="`/${countryCode || ''}/categories`">Категории</RouterLink>
          <RouterLink :to="`/${countryCode || ''}/cart`" class="cart-link" aria-label="Корзина">
            <img :src="iconCart" alt="" class="cart-icon" />
            <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
          </RouterLink>
<!--          <RouterLink v-if="customer" :to="`/${countryCode || ''}/account`"> Аккаунт </RouterLink>-->
<!--          <RouterLink v-else :to="`/${countryCode || ''}/login`"> Войти </RouterLink>-->
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer v-if="showLayoutFooter" class="site-footer">
      <div class="content-container site-footer-inner">
        <strong>{{ catalogContacts.brand }}</strong>
        <span>{{ catalogContacts.details }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  color: var(--text-dark);
  background: var(--white);
}

.app-shell > main {
  flex: 1 0 auto;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--border-soft);
  background: rgb(var(--cream-rgb) / 0.94);
  backdrop-filter: blur(14px);
}

.site-nav {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.site-brand {
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.site-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.site-links a {
  color: var(--text-muted);
}

.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.cart-icon {
  display: block;
  width: 22px;
  height: 22px;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  color: var(--white);
  background: var(--brand-lime);
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.site-brand:hover,
.site-links a:hover,
.site-links a.router-link-active {
  color: var(--brand-olive);
}

.site-brand:focus-visible,
.site-links a:focus-visible {
  outline: 3px solid rgb(var(--brand-lime-light-rgb) / 0.5);
  outline-offset: 4px;
}

.site-footer {
  color: var(--cream);
  background: var(--brand-dark);
}

.site-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 28px;
}

.site-footer strong {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.site-footer span {
  color: rgb(var(--cream-rgb) / 0.84);
  font-size: 12px;
  letter-spacing: 0.05em;
  line-height: 1.6;
  text-align: right;
}

@media (max-width: 640px) {
  .site-nav {
    min-height: auto;
    flex-direction: column;
    align-items: flex-start;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .site-links {
    justify-content: flex-start;
    gap: 12px 16px;
  }

  .site-footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-footer span {
    text-align: left;
  }
}
</style>
