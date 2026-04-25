<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const isMobileNavOpen = ref(false)
const showLayoutFooter = computed(() => route.name !== 'home')
const cartItemCount = computed(() => {
  return (cart.value?.items ?? []).reduce((total, item) => total + item.quantity, 0)
})

function closeMobileNav() {
  isMobileNavOpen.value = false
}

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMobileNav()
  }
}

async function handleSignout() {
  await customerStore.signout()
  await cartStore.loadCart()
  closeMobileNav()
  await router.push(`/${countryCode.value || ''}`)
}

onMounted(() => {
  void customerStore.loadCustomer()
  void cartStore.loadCart()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('mobile-nav-open')
})

watch(
  () => route.fullPath,
  () => {
    closeMobileNav()
  },
)

watch(isMobileNavOpen, (isOpen) => {
  document.body.classList.toggle('mobile-nav-open', isOpen)
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

        <button
          type="button"
          class="site-burger"
          aria-controls="mobile-navigation"
          :aria-expanded="isMobileNavOpen ? 'true' : 'false'"
          :aria-label="isMobileNavOpen ? 'Закрыть меню' : 'Открыть меню'"
          @click="toggleMobileNav"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <Transition name="mobile-nav">
        <div
          v-if="isMobileNavOpen"
          id="mobile-navigation"
          class="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Меню навигации"
        >
          <button
            type="button"
            class="mobile-nav__backdrop"
            aria-label="Закрыть меню"
            @click="closeMobileNav"
          />

          <aside class="mobile-nav__panel">
            <div class="mobile-nav__header">
              <RouterLink
                :to="`/${countryCode || ''}`"
                class="mobile-nav__brand"
                @click="closeMobileNav"
              >
                ErawadeE
              </RouterLink>
              <button
                type="button"
                class="mobile-nav__close"
                aria-label="Закрыть меню"
                @click="closeMobileNav"
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
            </div>

            <nav class="mobile-nav__links" aria-label="Мобильная навигация">
              <RouterLink
                :to="`/${countryCode || ''}/store`"
                class="mobile-nav__link"
                @click="closeMobileNav"
              >
                <IconStore class="mobile-nav__icon" />
                <span>Товары</span>
              </RouterLink>
              <RouterLink
                :to="`/${countryCode || ''}/categories`"
                class="mobile-nav__link"
                @click="closeMobileNav"
              >
                <IconCatalog class="mobile-nav__icon" />
                <span>Категории</span>
              </RouterLink>
              <RouterLink
                :to="`/${countryCode || ''}/cart`"
                class="mobile-nav__link"
                @click="closeMobileNav"
              >
                <span class="mobile-nav__icon-wrap">
                  <IconCart class="mobile-nav__icon" />
                  <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
                </span>
                <span>Корзина</span>
              </RouterLink>
              <button
                v-if="customer"
                type="button"
                class="mobile-nav__link mobile-nav__button"
                @click="handleSignout"
              >
                <IconLogout class="mobile-nav__icon" />
                <span>Выйти</span>
              </button>
              <RouterLink
                v-else
                :to="`/${countryCode || ''}/login`"
                class="mobile-nav__link"
                @click="closeMobileNav"
              >
                <IconLogin class="mobile-nav__icon" />
                <span>Войти</span>
              </RouterLink>
            </nav>
          </aside>
        </div>
      </Transition>
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
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 16px;
  padding-bottom: 16px;
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

.site-burger {
  display: none;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: rgb(var(--white-rgb) / 0.72);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.site-burger span {
  grid-area: 1 / 1;
  display: block;
  width: 18px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--brand-dark);
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

.site-burger span:first-child {
  transform: translateY(-6px);
}

.site-burger span:last-child {
  transform: translateY(6px);
}

.site-burger[aria-expanded='true'] span:first-child {
  transform: rotate(45deg);
}

.site-burger[aria-expanded='true'] span:nth-child(2) {
  opacity: 0;
}

.site-burger[aria-expanded='true'] span:last-child {
  transform: rotate(-45deg);
}

.site-burger:hover,
.site-burger:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  background: var(--white);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
}

.mobile-nav {
  position: fixed;
  inset: 0;
  z-index: 80;
}

.mobile-nav__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(var(--brand-dark-rgb) / 0.42);
}

.mobile-nav__panel {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: min(420px, 86vw);
  height: 100dvh;
  flex-direction: column;
  padding: 0 24px;
  border-left: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.98), rgb(var(--white-rgb) / 0.99)),
    var(--white);
  box-shadow: -24px 0 60px rgb(var(--brand-dark-rgb) / 0.2);
  clip-path: inset(0 0 0 0);
}

.mobile-nav__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid var(--border-soft);
  padding: 16px 0;
}

.mobile-nav__brand {
  color: var(--brand-dark);
  font-family: var(--font-brand);
  font-size: 27px;
  line-height: 1;
  letter-spacing: 0.14em;
}

.mobile-nav__close {
  display: inline-grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: rgb(var(--white-rgb) / 0.78);
}

.mobile-nav__close span {
  grid-area: 1 / 1;
  width: 15px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--brand-dark);
}

.mobile-nav__close span:first-child {
  transform: rotate(45deg);
}

.mobile-nav__close span:last-child {
  transform: rotate(-45deg);
}

.mobile-nav__links {
  display: grid;
  gap: 12px;
  padding-top: 24px;
}

.mobile-nav__link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  min-height: 56px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--brand-dark);
  background: rgb(var(--white-rgb) / 0.64);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.mobile-nav__button {
  width: 100%;
  appearance: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.mobile-nav__icon,
.mobile-nav__icon-wrap {
  order: -1;
}

.mobile-nav__icon {
  display: block;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
}

.mobile-nav__icon-wrap {
  position: relative;
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
}

.mobile-nav__link:hover,
.mobile-nav__link:focus-visible,
.mobile-nav__link.router-link-exact-active {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  background: rgb(var(--brand-lime-light-rgb) / 0.12);
  transform: translateY(-1px);
}

.mobile-nav__close:hover,
.mobile-nav__close:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  background: var(--white);
}

.mobile-nav__brand:focus-visible,
.mobile-nav__close:focus-visible,
.mobile-nav__link:focus-visible {
  outline: 3px solid rgb(var(--brand-lime-light-rgb) / 0.44);
  outline-offset: 3px;
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 220ms ease;
}

.mobile-nav-enter-active .mobile-nav__panel,
.mobile-nav-leave-active .mobile-nav__panel {
  transition: clip-path 260ms ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
}

.mobile-nav-enter-from .mobile-nav__panel,
.mobile-nav-leave-to .mobile-nav__panel {
  clip-path: inset(0 0 0 100%);
}

:global(body.mobile-nav-open) {
  overflow: hidden;
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

@media (max-width: 1023px) {
  .site-links {
    display: none;
  }

  .site-burger {
    display: grid;
  }
}

@media (max-width: 640px) {
  .site-nav {
    min-height: auto;
    align-items: center;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .site-brand__text {
    font-size: 24px;
  }

  .mobile-nav__backdrop {
    display: none;
  }

  .mobile-nav__panel {
    width: 100vw;
    padding: 0 24px 16px;
    border-left: 0;
    clip-path: circle(140% at calc(100% - 40px) 40px);
  }

  .mobile-nav__brand {
    font-size: 24px;
  }

  .mobile-nav__link {
    min-height: 54px;
    padding: 0 14px;
    font-size: 14px;
  }

  .mobile-nav-enter-from .mobile-nav__panel,
  .mobile-nav-leave-to .mobile-nav__panel {
    clip-path: circle(0 at calc(100% - 40px) 40px);
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
