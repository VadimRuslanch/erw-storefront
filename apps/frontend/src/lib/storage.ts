export const storageKeys = {
  authToken: '_medusa_jwt',
  cartId: '_medusa_cart_id',
  locale: '_medusa_locale',
  cacheId: '_medusa_cache_id',
} as const

const isBrowser = () => typeof window !== 'undefined'

export function getStorageItem(key: string) {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(key)
}

export function setStorageItem(key: string, value: string | null) {
  if (!isBrowser()) {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, value)
}

export function getAuthToken() {
  return getStorageItem(storageKeys.authToken)
}

export function setAuthToken(token: string) {
  setStorageItem(storageKeys.authToken, token)
}

export function removeAuthToken() {
  setStorageItem(storageKeys.authToken, null)
}

export function getCartId() {
  return getStorageItem(storageKeys.cartId)
}

export function setCartId(cartId: string) {
  setStorageItem(storageKeys.cartId, cartId)
}

export function removeCartId() {
  setStorageItem(storageKeys.cartId, null)
}

export function getLocale() {
  return getStorageItem(storageKeys.locale)
}

export function setLocale(locale: string) {
  setStorageItem(storageKeys.locale, locale)
}

export function getOrCreateCacheId() {
  const existing = getStorageItem(storageKeys.cacheId)

  if (existing) {
    return existing
  }

  const cacheId =
    globalThis.crypto?.randomUUID?.() ?? `cache-${Date.now()}-${Math.random().toString(36).slice(2)}`

  setStorageItem(storageKeys.cacheId, cacheId)

  return cacheId
}
