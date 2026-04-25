<template>
  <section class="privacy-page">
    <div class="content-container">
      <article class="privacy-card">
        <p class="privacy-card__eyebrow">Документы</p>
        <h1 class="privacy-card__title">Политика конфиденциальности</h1>

        <div class="privacy-card__content">
          <p>
            Это временная заглушка страницы политики конфиденциальности ERAWADEE. Полный текст
            документа будет добавлен позднее.
          </p>
          <p>
            Мы обрабатываем данные, которые пользователь передаёт при оформлении заказа, регистрации
            или обращении в поддержку, а также используем служебные cookies для корректной работы
            сайта.
          </p>
          <p>
            Служебные cookies помогают сохранять корзину, регион, состояние авторизации и базовые
            настройки интерфейса. Эти данные нужны для стабильной работы магазина и не используются
            как финальная публичная редакция политики.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.privacy-page {
  padding: 42px 0 64px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.12), transparent 32%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.74), rgb(var(--white-rgb) / 0.98));
}

.privacy-card {
  max-width: 860px;
  padding: clamp(28px, 5vw, 52px);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: rgb(var(--white-rgb) / 0.94);
  box-shadow: 0 20px 48px rgb(var(--brand-dark-rgb) / 0.08);
}

.privacy-card__eyebrow {
  margin: 0;
  color: var(--brand-olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.privacy-card__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
}

.privacy-card__content {
  display: grid;
  gap: 16px;
  max-width: 720px;
  margin-top: 28px;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.75;
}

.privacy-card__content p {
  margin: 0;
}
</style>
