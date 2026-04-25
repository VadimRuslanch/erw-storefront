<script setup lang="ts">
import { catalogContacts } from '@/content/erawadeeCatalogCover'

const contactItems = [
  {
    label: 'Телефон',
    value: catalogContacts.phone,
    href: `tel:${catalogContacts.phone.replace(/[^\d+]/g, '')}`,
  },
  {
    label: 'Email',
    value: catalogContacts.email,
    href: `mailto:${catalogContacts.email}`,
  },
  {
    label: 'ИНН',
    value: catalogContacts.inn,
  },
  {
    label: 'Адрес',
    value: catalogContacts.address,
  },
]
</script>

<template>
  <section class="contacts-page">
    <div class="content-container">
      <article class="contacts-card">
        <p class="contacts-card__eyebrow">Связаться с нами</p>
        <h1 class="contacts-card__title">Контакты</h1>

        <dl class="contacts-list">
          <div v-for="item in contactItems" :key="item.label" class="contacts-list__item">
            <dt>{{ item.label }}</dt>
            <dd>
              <a v-if="item.href" :href="item.href">{{ item.value }}</a>
              <span v-else>{{ item.value }}</span>
            </dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<style scoped>
.contacts-page {
  padding: 42px 0 64px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.12), transparent 32%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74), rgb(var(--white-rgb) / 0.98));
}

.contacts-card {
  max-width: 860px;
  padding: clamp(28px, 5vw, 52px);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.94);
  box-shadow: 0 20px 48px rgb(var(--brand-dark-rgb) / 0.08);
}

.contacts-card__eyebrow {
  margin: 0;
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.contacts-card__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
}

.contacts-list {
  display: grid;
  gap: 0;
  margin: 32px 0 0;
  border-top: 1px solid var(--border-soft);
}

.contacts-list__item {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-soft);
}

.contacts-list__item dt {
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.5;
  text-transform: uppercase;
}

.contacts-list__item dd {
  margin: 0;
  color: var(--brand-dark);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.55;
}

.contacts-list__item a {
  color: inherit;
}

.contacts-list__item a:hover,
.contacts-list__item a:focus-visible {
  color: var(--brand-olive);
}

@media (max-width: 640px) {
  .contacts-list__item {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
