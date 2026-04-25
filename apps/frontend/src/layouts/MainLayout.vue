<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import IconCart from '@/components/icons/IconCart.vue'
import IconCatalog from '@/components/icons/IconCatalog.vue'
import IconLogin from '@/components/icons/IconLogin.vue'
import IconLogout from '@/components/icons/IconLogout.vue'
import IconStore from '@/components/icons/IconStore.vue'
import { useCustomerStore } from '@stores/customer'
import { useCartStore } from '@stores/cart'
import { useRegionStore } from '@stores/region'
import { catalogContacts } from '@/content/erawadeeCatalogCover'

const regionStore = useRegionStore()
const customerStore = useCustomerStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()
const { countryCode } = storeToRefs(regionStore)
const { customer } = storeToRefs(customerStore)
const { cart } = storeToRefs(cartStore)
const showLayoutFooter = computed(() => route.name !== 'home')
const cartItemCount = computed(() => {
  return (cart.value?.items ?? []).reduce((total, item) => total + item.quantity, 0)
})

async function handleSignout() {
  await customerStore.signout()
  await cartStore.loadCart()
  await router.push(`/${countryCode.value || ''}`)
}

onMounted(() => {
  void customerStore.loadCustomer()
  void cartStore.loadCart()
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <nav class="content-container site-nav" aria-label="Основная навигация">
        <RouterLink :to="`/${countryCode || ''}`" class="site-brand" aria-label="ERAWADEE">
          <!--          <img :src="logoImage" alt="" class="site-brand__logo" />-->
          <span class="site-brand__text">ErawadeE</span>
        </RouterLink>
        <div class="site-links">
          <RouterLink :to="`/${countryCode || ''}/store`" class="site-link">
            <IconStore class="site-link__icon" />
            <span>Товары</span>
          </RouterLink>
          <RouterLink :to="`/${countryCode || ''}/categories`" class="site-link">
            <IconCatalog class="site-link__icon" />
            <span>Категории</span>
          </RouterLink>
          <RouterLink :to="`/${countryCode || ''}/cart`" class="site-link cart-link">
            <span class="cart-link__icon-wrap">
              <IconCart class="site-link__icon cart-icon" />
              <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
            </span>
            <span>Корзина</span>
          </RouterLink>
          <button
            v-if="customer"
            type="button"
            class="site-link site-links__button"
            @click="handleSignout"
          >
            <IconLogout class="site-link__icon" />
            <span>Выйти</span>
          </button>
          <RouterLink v-else :to="`/${countryCode || ''}/login`" class="site-link">
            <IconLogin class="site-link__icon" />
            <span>Войти</span>
          </RouterLink>
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer v-if="showLayoutFooter" class="site-footer">
      <div class="content-container site-footer-inner">
        <div class="site-footer__brand">
          <strong>{{ catalogContacts.brand }}</strong>
          <span>{{ catalogContacts.details }}</span>
        </div>

        <nav class="site-footer__links" aria-label="Юридическая информация">
          <RouterLink :to="`/${countryCode || ''}/contacts`">Контакты</RouterLink>
          <RouterLink :to="`/${countryCode || ''}/privacy-policy`">
            Политика конфиденциальности
          </RouterLink>
        </nav>
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
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--brand-dark);
}

.site-brand__text {
  font-family: var(--font-brand);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.site-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.site-links :is(a, button) {
  color: var(--text-muted);
}

.site-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  line-height: 1;
  transition:
    color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.site-link__icon {
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  opacity: 0.84;
}

.site-links__button {
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}

.cart-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cart-link__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.cart-icon {
  display: block;
  width: 20px;
  height: 20px;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -10px;
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
.site-links :is(a, button):hover,
.site-links a.router-link-active {
  color: var(--brand-olive);
}

.site-links a.site-link.router-link-exact-active {
  color: var(--brand-dark);
  background: rgb(var(--brand-lime-light-rgb) / 0.14);
  box-shadow: inset 0 0 0 1px rgb(var(--brand-dark-rgb) / 0.08);
}

.site-links :is(a, button):hover .site-link__icon,
.site-links a.router-link-active .site-link__icon,
.site-links a.site-link.router-link-exact-active .site-link__icon {
  opacity: 1;
}

.site-brand:focus-visible,
.site-links :is(a, button):focus-visible {
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

.site-footer__brand {
  display: grid;
  gap: 8px;
}

.site-footer__brand strong {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.site-footer__brand span {
  color: rgb(var(--cream-rgb) / 0.84);
  font-size: 12px;
  letter-spacing: 0.05em;
  line-height: 1.6;
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px 18px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.5;
  text-align: right;
  text-transform: uppercase;
}

.site-footer__links a {
  color: rgb(var(--cream-rgb) / 0.78);
}

.site-footer__links a:hover,
.site-footer__links a:focus-visible {
  color: var(--brand-lime-light);
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
    font-size: 13px;
  }

  .site-footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-footer__brand span,
  .site-footer__links {
    text-align: left;
  }

  .site-footer__links {
    justify-content: flex-start;
  }
}
</style>
