<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRegionStore } from '@stores/region'

const regionStore = useRegionStore()
const { countryCode } = storeToRefs(regionStore)
const catalogLink = ref('/')

onMounted(async () => {
  const resolvedCountryCode = await regionStore.resolveCountryCode(countryCode.value)
  catalogLink.value = `/${resolvedCountryCode}/categories`
})
</script>

<template>
  <section class="not-found-page">
    <div class="content-container not-found-layout">
      <article class="not-found-hero">
        <div class="not-found-hero__panel">
          <p class="not-found-hero__eyebrow">Ошибка навигации</p>
          <div class="not-found-hero__accent" aria-hidden="true" />
          <p class="not-found-hero__code">404</p>
          <h1 class="not-found-hero__title">Страница не найдена</h1>
          <p class="not-found-hero__description">
            Похоже, ссылка устарела или адрес был введён с ошибкой. Самый быстрый путь обратно —
            открыть каталог и продолжить просмотр товаров ERAWADEE.
          </p>

          <div class="not-found-hero__actions">
            <RouterLink :to="catalogLink" class="not-found-hero__action">
              Перейти в каталог
            </RouterLink>
          </div>
        </div>

        <aside class="not-found-note">
          <p class="not-found-note__label">Что можно сделать</p>
          <p class="not-found-note__text">
            Вернитесь в каталог, чтобы открыть категории и заново пройти к нужному продукту.
          </p>
        </aside>
      </article>
    </div>
  </section>
</template>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 64px);
  padding: 42px 0 72px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.14), transparent 32%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.78) 0%, rgb(var(--white-rgb) / 0.98) 62%);
}

.not-found-layout {
  display: grid;
}

.not-found-hero {
  display: grid;
  gap: 22px;
  align-items: start;
}

.not-found-hero__panel {
  position: relative;
  overflow: hidden;
  padding: clamp(30px, 6vw, 58px);
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
  border-radius: 8px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.12), transparent 28%),
    linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-olive) 100%);
  box-shadow: 0 28px 60px rgb(var(--brand-dark-rgb) / 0.16);
}

.not-found-hero__eyebrow {
  margin: 0;
  color: rgb(var(--cream-rgb) / 0.76);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  line-height: 1.4;
  text-transform: uppercase;
}

.not-found-hero__accent {
  width: 120px;
  height: 4px;
  margin-top: 16px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--brand-lime) 0%,
    rgb(var(--brand-lime-light-rgb) / 0.95) 100%
  );
}

.not-found-hero__code {
  margin: 26px 0 0;
  color: rgb(var(--cream-rgb) / 0.28);
  font-family: var(--font-serif);
  font-size: clamp(4.8rem, 18vw, 8.6rem);
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: 0.04em;
}

.not-found-hero__title {
  max-width: 680px;
  margin: 16px 0 0;
  color: var(--white);
  font-family: var(--font-serif);
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.02em;
}

.not-found-hero__description {
  max-width: 620px;
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.88);
  font-size: 15px;
  line-height: 1.8;
}

.not-found-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.not-found-hero__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  color: var(--brand-dark);
  background: linear-gradient(
    135deg,
    var(--brand-lime) 0%,
    rgb(var(--brand-lime-light-rgb) / 0.94) 100%
  );
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-align: center;
  text-transform: uppercase;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.16);
}

.not-found-hero__action:hover,
.not-found-hero__action:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgb(var(--brand-dark-rgb) / 0.2);
}

.not-found-hero__action:focus-visible {
  outline: 3px solid rgb(var(--cream-rgb) / 0.44);
  outline-offset: 4px;
}

.not-found-note {
  max-width: 420px;
  padding: 22px 24px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: linear-gradient(180deg, rgb(var(--cream-rgb) / 0.76), rgb(var(--white-rgb) / 0.98));
  box-shadow: 0 18px 38px rgb(var(--brand-dark-rgb) / 0.08);
}

.not-found-note__label {
  margin: 0;
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.not-found-note__text {
  margin: 12px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .not-found-page {
    min-height: auto;
    padding: 28px 0 52px;
  }

  .not-found-hero__panel {
    padding: 28px 22px 30px;
  }

  .not-found-hero__code {
    font-size: clamp(4.4rem, 28vw, 6.6rem);
  }

  .not-found-hero__title {
    font-size: clamp(2rem, 11vw, 3.2rem);
  }

  .not-found-hero__action {
    width: 100%;
  }
}
</style>
