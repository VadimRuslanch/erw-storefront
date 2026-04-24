import Medusa, { type FetchArgs, type FetchInput } from '@medusajs/js-sdk'
import { getAuthToken, getLocale } from '@lib/storage'

const MEDUSA_BACKEND_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000'

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env.DEV,
  publishableKey: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(input: FetchInput, init?: FetchArgs): Promise<T> => {
  const headers = {
    ...((init?.headers ?? {}) as Record<string, string>),
  }

  const locale = getLocale()

  if (locale && !headers['x-medusa-locale']) {
    headers['x-medusa-locale'] = locale
  }

  return originalFetch<T>(input, {
    ...init,
    headers,
  })
}

export const getAuthHeaders = (): { authorization: string } | Record<string, never> => {
  const token = getAuthToken()

  if (!token) {
    return {}
  }

  return { authorization: `Bearer ${token}` }
}
