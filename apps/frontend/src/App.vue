<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { getStorageItem, setStorageItem, storageKeys } from '@lib/storage'

const serviceCookiesAcceptedValue = 'accepted'
const showCookieNotice = ref(false)
const route = useRoute()

const routeCountryCode = computed(() => {
  const countryCode = route.params.countryCode

  return Array.isArray(countryCode) ? countryCode[0] : countryCode
})

const privacyPolicyPath = computed(() => {
  return routeCountryCode.value ? `/${routeCountryCode.value}/privacy-policy` : '/'
})

function acceptServiceCookies() {
  setStorageItem(storageKeys.serviceCookiesAccepted, serviceCookiesAcceptedValue)
  showCookieNotice.value = false
}

onMounted(() => {
  showCookieNotice.value =
    getStorageItem(storageKeys.serviceCookiesAccepted) !== serviceCookiesAcceptedValue
})
</script>

<template>
  <RouterView />

  <aside v-if="showCookieNotice" class="cookie-notice" aria-label="Уведомление о cookies">
    <div class="cookie-notice__content">
      <p class="cookie-notice__title">Служебные cookies</p>
      <p class="cookie-notice__text">
        Мы используем служебные cookies, чтобы сайт работал корректно: сохранял корзину, регион и
        базовые настройки интерфейса.
      </p>
    </div>

    <div class="cookie-notice__actions">
      <RouterLink :to="privacyPolicyPath" class="cookie-notice__link">
        Политика конфиденциальности
      </RouterLink>
      <button type="button" class="cookie-notice__button" @click="acceptServiceCookies">
        Понятно
      </button>
    </div>
  </aside>
</template>

<style scoped>
.cookie-notice {
  position: fixed;
  right: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vw, 32px);
  z-index: 100;
  display: grid;
  width: min(520px, calc(100vw - 32px));
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--text-dark);
  background:
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.96), rgb(var(--white-rgb) / 0.98)),
    var(--white);
  box-shadow: 0 22px 52px rgb(var(--brand-dark-rgb) / 0.18);
}

.cookie-notice__title {
  margin: 0;
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.4;
  text-transform: uppercase;
}

.cookie-notice__text {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.65;
}

.cookie-notice__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.cookie-notice__link,
.cookie-notice__button {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.4;
  text-transform: uppercase;
}

.cookie-notice__link {
  color: var(--brand-olive);
}

.cookie-notice__button {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--white);
  background: linear-gradient(135deg, var(--brand-dark), var(--brand-olive));
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.cookie-notice__button:hover,
.cookie-notice__button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgb(var(--brand-dark-rgb) / 0.16);
}

.cookie-notice__link:focus-visible,
.cookie-notice__button:focus-visible {
  outline: 3px solid rgb(var(--brand-lime-light-rgb) / 0.5);
  outline-offset: 4px;
}

@media (max-width: 640px) {
  .cookie-notice {
    right: 16px;
    bottom: 16px;
  }

  .cookie-notice__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .cookie-notice__button {
    width: 100%;
  }
}
</style>
