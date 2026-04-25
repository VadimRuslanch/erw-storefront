<script setup lang="ts">
import { computed, ref } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { useCustomerStore } from '@stores/customer'
import { useRegionStore } from '@stores/region'

const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()
const regionStore = useRegionStore()

const { isLoading } = storeToRefs(customerStore)
const { countryCode } = storeToRefs(regionStore)

const registerSchema = toTypedSchema(
  z
    .object({
      firstName: z.string().trim().min(1, 'Введите имя.'),
      lastName: z.string().trim().min(1, 'Введите фамилию.'),
      email: z
        .string()
        .trim()
        .min(1, 'Введите email.')
        .email('Введите корректный email.'),
      phone: z.string().trim(),
      password: z.string().min(8, 'Пароль должен содержать минимум 8 символов.'),
      confirmPassword: z.string().min(1, 'Подтвердите пароль.'),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: 'Пароли не совпадают.',
      path: ['confirmPassword'],
    }),
)

const errorMessage = ref<string | null>(null)

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  },
})

const [firstName, firstNameAttrs] = defineField('firstName')
const [lastName, lastNameAttrs] = defineField('lastName')
const [email, emailAttrs] = defineField('email')
const [phone, phoneAttrs] = defineField('phone')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

const loginLink = computed(() => {
  return {
    path: `/${countryCode.value}/login`,
    query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
  }
})

function getRedirectPath() {
  const rawRedirect = route.query.redirect
  const redirect = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect

  if (redirect && redirect.startsWith(`/${countryCode.value}/`)) {
    return redirect
  }

  return `/${countryCode.value}/categories`
}

const submitRegister = handleSubmit(async (values) => {
  errorMessage.value = null

  try {
    await customerStore.signup({
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
    })
    await router.push(getRedirectPath())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
})
</script>

<template>
  <section class="auth-page">
    <div class="content-container auth-page__inner">
      <div class="auth-hero">
        <p class="auth-hero__eyebrow">Аккаунт</p>
        <h1 class="auth-hero__title">Создать аккаунт</h1>
        <p class="auth-hero__description">
          Создайте профиль, чтобы сохранять контактные данные и отслеживать заказы ERAWADEE.
        </p>
      </div>

      <form class="auth-card" novalidate @submit.prevent="submitRegister">
        <div class="auth-card__header">
          <p class="auth-card__eyebrow">ERAWADEE</p>
          <h2 class="auth-card__title">Регистрация</h2>
        </div>

        <div class="auth-fields">
          <label class="auth-field">
            <span class="auth-field__label">Имя</span>
            <input
              v-model="firstName"
              v-bind="firstNameAttrs"
              type="text"
              autocomplete="given-name"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.firstName }"
            />
            <span v-if="errors.firstName" class="auth-field__error">{{ errors.firstName }}</span>
          </label>

          <label class="auth-field">
            <span class="auth-field__label">Фамилия</span>
            <input
              v-model="lastName"
              v-bind="lastNameAttrs"
              type="text"
              autocomplete="family-name"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.lastName }"
            />
            <span v-if="errors.lastName" class="auth-field__error">{{ errors.lastName }}</span>
          </label>

          <label class="auth-field auth-field--wide">
            <span class="auth-field__label">Email</span>
            <input
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.email }"
            />
            <span v-if="errors.email" class="auth-field__error">{{ errors.email }}</span>
          </label>

          <label class="auth-field auth-field--wide">
            <span class="auth-field__label">Телефон</span>
            <input
              v-model="phone"
              v-bind="phoneAttrs"
              type="tel"
              autocomplete="tel"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.phone }"
            />
            <span v-if="errors.phone" class="auth-field__error">{{ errors.phone }}</span>
          </label>

          <label class="auth-field">
            <span class="auth-field__label">Пароль</span>
            <input
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              autocomplete="new-password"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.password }"
            />
            <span v-if="errors.password" class="auth-field__error">{{ errors.password }}</span>
          </label>

          <label class="auth-field">
            <span class="auth-field__label">Подтверждение</span>
            <input
              v-model="confirmPassword"
              v-bind="confirmPasswordAttrs"
              type="password"
              autocomplete="new-password"
              class="auth-field__input"
              :class="{ 'auth-field__input--invalid': errors.confirmPassword }"
            />
            <span v-if="errors.confirmPassword" class="auth-field__error">
              {{ errors.confirmPassword }}
            </span>
          </label>
        </div>

        <p v-if="errorMessage" class="auth-notice auth-notice--error">
          {{ errorMessage }}
        </p>

        <button type="submit" class="auth-button" :disabled="isLoading">
          {{ isLoading ? 'Создаём...' : 'Создать аккаунт' }}
        </button>

        <p class="auth-card__footer">
          Уже зарегистрированы?
          <RouterLink :to="loginLink">Войти</RouterLink>
        </p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  padding: 42px 0 64px;
  background:
    radial-gradient(circle at top right, rgb(var(--brand-lime-light-rgb) / 0.14), transparent 32%),
    linear-gradient(180deg, rgb(var(--cream-rgb) / 0.76), rgb(var(--white-rgb) / 0.98));
}

.auth-page__inner {
  display: grid;
  min-height: calc(100vh - 168px);
  align-items: center;
  gap: 36px;
}

.auth-hero {
  max-width: 680px;
}

.auth-hero__eyebrow,
.auth-card__eyebrow,
.auth-field__label,
.auth-button {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.4;
  text-transform: uppercase;
}

.auth-hero__eyebrow,
.auth-card__eyebrow,
.auth-field__label {
  color: var(--brand-olive);
}

.auth-hero__title {
  margin: 14px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: clamp(3rem, 6vw, 5.25rem);
  font-weight: 500;
  line-height: 0.92;
  letter-spacing: 0.03em;
}

.auth-hero__description {
  max-width: 560px;
  margin: 20px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.75;
}

.auth-card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 22px;
  padding: clamp(22px, 4vw, 32px);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(var(--white-rgb) / 0.96), rgb(var(--cream-rgb) / 0.42)),
    var(--white);
  box-shadow: 0 20px 48px rgb(var(--brand-dark-rgb) / 0.1);
}

.auth-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  content: '';
  background: linear-gradient(
    90deg,
    rgb(var(--brand-lime-rgb) / 0.94),
    rgb(var(--brand-lime-light-rgb) / 0.94)
  );
}

.auth-card__title {
  margin: 10px 0 0;
  color: var(--brand-dark);
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.auth-fields {
  display: grid;
  gap: 18px;
}

.auth-field {
  display: grid;
  gap: 9px;
}

.auth-field__input {
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  color: var(--brand-dark);
  background: rgb(var(--white-rgb) / 0.92);
  font-size: 14px;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.auth-field__input:focus {
  border-color: rgb(var(--brand-lime-rgb) / 0.48);
  background: var(--white);
  box-shadow: 0 0 0 3px rgb(var(--brand-lime-light-rgb) / 0.18);
}

.auth-field__input--invalid {
  border-color: rgb(244 114 114 / 0.42);
  background: rgb(254 242 242 / 0.6);
}

.auth-field__error {
  color: #b42318;
  font-size: 12px;
  line-height: 1.5;
}

.auth-notice {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.auth-notice--error {
  color: #b42318;
  border-color: rgb(244 114 114 / 0.28);
  background: rgb(254 242 242 / 0.9);
}

.auth-button {
  min-height: 50px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--white);
  background: linear-gradient(
    135deg,
    var(--brand-dark) 0%,
    var(--brand-olive) 72%,
    var(--brand-lime) 100%
  );
  box-shadow: 0 16px 28px rgb(var(--brand-dark-rgb) / 0.14);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.auth-button:hover:not(:disabled),
.auth-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 20px 34px rgb(var(--brand-dark-rgb) / 0.18);
}

.auth-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.auth-card__footer {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.auth-card__footer a {
  color: var(--brand-dark);
  font-weight: 700;
}

.auth-card__footer a:hover,
.auth-card__footer a:focus-visible {
  color: var(--brand-olive);
}

@media (min-width: 640px) {
  .auth-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .auth-field--wide {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .auth-page__inner {
    grid-template-columns: minmax(0, 1fr) minmax(440px, 480px);
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding-top: 30px;
  }

  .auth-page__inner {
    min-height: auto;
  }
}
</style>
