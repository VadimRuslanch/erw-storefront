import type { HttpTypes } from '@medusajs/types'
import { getAuthHeaders, sdk } from './client'

export const listCartPaymentMethods = async (regionId: string) => {
  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>('/store/payment-providers', {
      method: 'GET',
      query: {
        region_id: regionId,
      },
      headers: getAuthHeaders(),
    })
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1
      }),
    )
    .catch(() => null)
}
