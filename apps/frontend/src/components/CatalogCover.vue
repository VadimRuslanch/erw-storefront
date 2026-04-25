<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  aboutCompany,
  catalogContacts,
  catalogHero,
  catalogPillars,
  catalogValues,
  filmCta,
} from '@/content/erawadeeCatalogCover'

const isFilmPlayerOpen = ref(false)

function extractYoutubeVideoId(url: string) {
  if (!url || url.includes('PLACEHOLDER')) {
    return null
  }

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{6,})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)

    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

const filmVideoId = computed(() => extractYoutubeVideoId(filmCta.url))
const filmEmbedUrl = computed(() => {
  if (!filmVideoId.value) {
    return null
  }

  return `https://www.youtube.com/embed/${filmVideoId.value}?autoplay=1&rel=0`
})

function openFilmPlayer() {
  if (!filmEmbedUrl.value) {
    return
  }

  isFilmPlayerOpen.value = true
}
</script>

<template>
  <article class="catalog-cover" aria-labelledby="catalog-title">
    <header class="catalog-hero">
      <div class="thai-border" aria-hidden="true" />
      <p class="catalog-badge">{{ catalogHero.badge }}</p>

      <!--      <div class="brand-mark" aria-label="Логотип ERAWADEE" role="img">-->
      <!--        <img :src="logoImage" alt="" class="brand-mark__image" />-->
      <!--      </div>-->

      <p class="brand-title">{{ catalogHero.brand }}</p>
      <p class="brand-subtitle">{{ catalogHero.subtitle }}</p>
      <h1 id="catalog-title" class="catalog-heading">{{ catalogHero.description }}</h1>
    </header>

    <div class="accent-line" aria-hidden="true" />

    <section class="about-section" aria-labelledby="about-title">
      <div class="about-copy">
        <h2 id="about-title" class="section-kicker">О КОМПАНИИ</h2>
        <p>{{ aboutCompany }}</p>
      </div>
    </section>

    <section class="pillars-section" aria-labelledby="pillars-title">
      <h2 id="pillars-title" class="sr-only">Три столпа ERAWADEE</h2>
      <div class="pillars-grid">
        <article v-for="pillar in catalogPillars" :key="pillar.title" class="pillar-card">
          <div class="pillar-icon" aria-hidden="true">
            <svg
              v-if="pillar.icon === 'bowl'"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 25h24c0 8-5.5 13-12 13s-12-5-12-13Z" stroke="currentColor" />
              <path d="M16 38h16" stroke="currentColor" stroke-linecap="round" />
              <path d="M18 21c-2-4 1-6 0-10" stroke="currentColor" stroke-linecap="round" />
              <path d="M25 20c4-4 8-4 12-1-4 5-8 6-12 1Z" stroke="currentColor" />
              <path d="M24 21c0-5 3-8 7-10 .5 5-1.5 8-7 10Z" stroke="currentColor" />
            </svg>
            <svg
              v-else-if="pillar.icon === 'leaf'"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M37 11C24 11 13 18 12 32c14 2 23-6 25-21Z"
                stroke="currentColor"
                stroke-linejoin="round"
              />
              <path d="M13 33c7-8 13-12 24-22" stroke="currentColor" stroke-linecap="round" />
              <path d="M22 24c0-3-.5-6-2-8" stroke="currentColor" stroke-linecap="round" />
              <path d="M27 20c3 0 5 .5 8 2" stroke="currentColor" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 10h8" stroke="currentColor" stroke-linecap="round" />
              <path
                d="M22 10v11L14 35c-1.5 2.7.4 6 3.5 6h13c3.1 0 5-3.3 3.5-6l-8-14V10"
                stroke="currentColor"
              />
              <path d="M18 32h12" stroke="currentColor" stroke-linecap="round" />
              <path d="M20 36h8" stroke="currentColor" stroke-linecap="round" />
            </svg>
          </div>
          <h3>{{ pillar.title }}</h3>
          <p>{{ pillar.text }}</p>
        </article>
      </div>
    </section>

    <section class="values-strip" aria-label="Ценности ERAWADEE">
      <span v-for="value in catalogValues" :key="value">{{ value }}</span>
    </section>

    <section class="film-cta" aria-labelledby="film-title">
      <div class="film-cta__header">
        <button
          type="button"
          class="play-button"
          :disabled="!filmEmbedUrl"
          :aria-label="
            filmEmbedUrl
              ? 'Открыть документальный фильм во встроенном плеере'
              : 'Видеоплеер будет доступен после обновления ссылки'
          "
          @click="openFilmPlayer"
        >
          <span aria-hidden="true" />
        </button>
        <div class="film-copy">
          <h2 id="film-title" class="section-kicker">{{ filmCta.eyebrow }}</h2>
          <p class="film-title">{{ filmCta.title }}</p>
          <p class="film-description">{{ filmCta.description }}</p>
          <a class="film-link" :href="filmCta.url" target="_blank" rel="noopener noreferrer">
            {{ filmCta.displayUrl }}
          </a>
        </div>
      </div>

      <div class="film-player">
        <button
          v-if="filmEmbedUrl && !isFilmPlayerOpen"
          type="button"
          class="film-player__preview"
          @click="openFilmPlayer"
        >
          <span class="film-player__preview-badge">Смотреть</span>
          <span class="film-player__preview-title">{{ filmCta.title }}</span>
          <span class="film-player__preview-meta">YouTube</span>
        </button>

        <iframe
          v-else-if="filmEmbedUrl"
          class="film-player__frame"
          :src="filmEmbedUrl"
          :title="filmCta.title"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        />

        <div v-else class="film-player__placeholder">
          <p>Плеер появится здесь после добавления реальной ссылки на фильм.</p>
        </div>
      </div>
    </section>

    <footer class="catalog-footer">
      <strong>{{ catalogContacts.brand }}</strong>
      <span>{{ catalogContacts.details }}</span>
    </footer>
  </article>
</template>

<style scoped>
.catalog-cover {
  margin: 0 auto;
  overflow: hidden;
  background: var(--white);
  box-shadow: var(--shadow-soft);
}

.catalog-hero {
  position: relative;
  display: flex;
  min-height: 510px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 76px 48px 72px;
  text-align: center;
  color: var(--white);
  background:
    radial-gradient(circle at 78% 16%, rgb(var(--brand-lime-light-rgb) / 0.16), transparent 30%),
    linear-gradient(145deg, var(--brand-dark) 0%, var(--brand-olive) 58%, var(--brand-dark) 100%);
}

.catalog-hero::after {
  position: absolute;
  inset: 28px;
  pointer-events: none;
  content: '';
  border: 1px solid rgb(var(--cream-rgb) / 0.18);
}

.thai-border {
  position: absolute;
  top: 46px;
  bottom: 46px;
  left: 42px;
  width: 18px;
  opacity: 0.45;
  background:
    linear-gradient(var(--brand-lime-light), var(--brand-lime-light)) center / 1px 100% no-repeat,
    repeating-linear-gradient(
      180deg,
      transparent 0 12px,
      rgb(var(--brand-lime-light-rgb) / 0.7) 12px 14px,
      transparent 14px 26px
    );
}

.catalog-badge,
.section-kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.catalog-badge {
  position: relative;
  z-index: 1;
  color: var(--brand-lime-light);
}

.brand-title {
  position: relative;
  z-index: 1;
  margin: 24px 0 0;
  font-family: var(--font-brand);
  font-size: 52px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.12em;
}

.brand-subtitle {
  position: relative;
  z-index: 1;
  max-width: 620px;
  margin: 18px 0 0;
  color: rgb(var(--cream-rgb) / 0.86);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  line-height: 1.65;
}

.catalog-heading {
  position: relative;
  z-index: 1;
  max-width: 660px;
  margin: 34px 0 0;
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0.03em;
}

.accent-line {
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--brand-lime) 0%,
    var(--brand-lime-light) 50%,
    var(--brand-lime) 100%
  );
}

.about-section {
  padding: 66px 70px;
  background: var(--cream);
}

.about-copy {
  position: relative;
  max-width: 760px;
  padding-left: 28px;
}

.about-copy::before {
  position: absolute;
  top: 4px;
  bottom: 6px;
  left: 0;
  width: 4px;
  content: '';
  background: linear-gradient(180deg, var(--brand-lime-light), var(--brand-lime));
}

.section-kicker {
  color: var(--brand-olive);
}

.about-copy p {
  margin: 18px 0 0;
  color: var(--text-dark);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.72;
}

.pillars-section {
  padding: 58px 52px 62px;
  background: var(--white);
}

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pillar-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  padding: 8px 28px 0;
  text-align: center;
}

.pillar-card + .pillar-card {
  border-left: 1px solid var(--border-soft);
}

.pillar-icon {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 50%;
  color: var(--white);
  background: var(--brand-lime);
  box-shadow: 0 14px 30px rgb(var(--brand-lime-rgb) / 0.2);
}

.pillar-icon svg {
  width: 42px;
  height: 42px;
  stroke-width: 1.8;
}

.pillar-card h3 {
  margin: 24px 0 0;
  color: var(--brand-dark);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.45;
}

.pillar-card p {
  margin: 14px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.58;
}

.values-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 18px;
  padding: 28px 42px;
  color: var(--cream);
  background: var(--brand-dark);
}

.values-strip span {
  color: var(--brand-lime-light);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.19em;
  line-height: 1.5;
}

.values-strip span:not(:last-child)::after {
  content: '·';
  margin-left: 18px;
  color: rgb(var(--cream-rgb) / 0.58);
}

.film-cta {
  display: grid;
  gap: 28px;
  padding: 52px 70px 58px;
  background: var(--cream);
}

.film-cta__header {
  display: flex;
  align-items: center;
  gap: 28px;
}

.play-button {
  display: grid;
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid rgb(var(--brand-dark-rgb) / 0.12);
  border-radius: 50%;
  color: var(--white);
  background: var(--brand-lime);
  box-shadow: 0 14px 32px rgb(var(--brand-lime-rgb) / 0.24);
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.play-button:hover:not(:disabled) {
  color: var(--white);
  background: var(--brand-olive);
  transform: translateY(-1px);
  box-shadow: 0 18px 36px rgb(var(--brand-olive-rgb) / 0.24);
}

.play-button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
  box-shadow: none;
}

.play-button:focus-visible,
.film-link:focus-visible {
  outline: 3px solid rgb(var(--brand-lime-light-rgb) / 0.55);
  outline-offset: 4px;
}

.play-button span {
  width: 0;
  height: 0;
  margin-left: 4px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 15px solid currentColor;
}

.film-copy {
  min-width: 0;
}

.film-title {
  margin: 10px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

.film-description {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.58;
}

.film-link {
  display: inline-flex;
  margin-top: 14px;
  color: var(--brand-olive);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.film-player {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid rgb(var(--brand-dark-rgb) / 0.12);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--white-rgb) / 0.92), rgb(var(--cream-rgb) / 0.88)),
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.14), transparent 34%);
  box-shadow: 0 20px 48px rgb(var(--brand-dark-rgb) / 0.1);
}

.film-player__preview,
.film-player__placeholder,
.film-player__frame {
  width: 100%;
  height: 100%;
}

.film-player__preview {
  display: grid;
  align-content: end;
  justify-items: start;
  gap: 10px;
  padding: 28px;
  border: 0;
  color: var(--white);
  background:
    linear-gradient(180deg, rgb(var(--brand-dark-rgb) / 0.04), rgb(var(--brand-dark-rgb) / 0.74)),
    linear-gradient(135deg, var(--brand-dark), var(--brand-olive));
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.film-player__preview:hover,
.film-player__preview:focus-visible {
  transform: translateY(-1px);
  box-shadow: inset 0 0 0 1px rgb(var(--cream-rgb) / 0.18);
  outline: none;
}

.film-player__preview-badge {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--brand-dark);
  background: linear-gradient(
    135deg,
    var(--brand-lime) 0%,
    rgb(var(--brand-lime-light-rgb) / 0.95) 100%
  );
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.film-player__preview-title {
  max-width: 360px;
  font-family: var(--font-serif);
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: 0.03em;
}

.film-player__preview-meta {
  color: rgb(var(--cream-rgb) / 0.82);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.film-player__frame {
  display: block;
  border: 0;
}

.film-player__placeholder {
  display: grid;
  place-items: center;
  padding: 28px;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
}

.film-player__placeholder p {
  max-width: 380px;
  margin: 0;
}

.catalog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 44px;
  color: var(--cream);
  background: var(--brand-dark);
}

.catalog-footer strong {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.catalog-footer span {
  color: rgb(var(--cream-rgb) / 0.84);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.05em;
  line-height: 1.6;
  text-align: right;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .catalog-cover {
    width: 100%;
    box-shadow: none;
  }

  .catalog-hero {
    min-height: 480px;
    padding: 58px 24px 56px;
  }

  .catalog-hero::after {
    inset: 18px;
  }

  .thai-border {
    left: 22px;
    top: 34px;
    bottom: 34px;
    opacity: 0.26;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-subtitle {
    font-size: 11px;
    letter-spacing: 0.16em;
  }

  .catalog-heading {
    max-width: 320px;
    font-size: 25px;
  }

  .about-section,
  .pillars-section,
  .film-cta {
    padding-right: 24px;
    padding-left: 24px;
  }

  .about-section {
    padding-top: 46px;
    padding-bottom: 48px;
  }

  .about-copy {
    padding-left: 22px;
  }

  .pillars-section {
    padding-top: 46px;
    padding-bottom: 48px;
  }

  .pillars-grid {
    grid-template-columns: 1fr;
    gap: 34px;
  }

  .pillar-card {
    padding: 0 12px;
  }

  .pillar-card + .pillar-card {
    padding-top: 34px;
    border-top: 1px solid var(--border-soft);
    border-left: 0;
  }

  .values-strip {
    padding: 25px 22px;
    gap: 8px 12px;
  }

  .values-strip span {
    font-size: 11px;
    letter-spacing: 0.15em;
  }

  .values-strip span:not(:last-child)::after {
    margin-left: 12px;
  }

  .film-cta {
    padding-top: 42px;
    padding-bottom: 46px;
  }

  .film-cta__header {
    align-items: flex-start;
  }

  .film-title {
    font-size: 24px;
  }

  .catalog-footer {
    flex-direction: column;
    align-items: flex-start;
    padding: 26px 24px;
  }

  .catalog-footer span {
    text-align: left;
  }
}

@media (max-width: 420px) {
  .film-cta,
  .film-cta__header {
    flex-direction: column;
    gap: 22px;
  }

  .film-player__preview {
    padding: 22px;
  }

  .film-player__preview-title {
    font-size: 22px;
  }

  .catalog-badge,
  .section-kicker {
    font-size: 11px;
    letter-spacing: 0.18em;
  }
}
</style>
