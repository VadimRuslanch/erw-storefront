import type { HttpTypes } from '@medusajs/types'
import { getAuthHeaders, sdk } from './client'

export const listCartShippingMethods = async (cartId: string) => {
  return sdk.client
    .fetch<{ shipping_methods: HttpTypes.StoreCartShippingMethod[] }>(
      `/store/carts/${cartId}/shipping-methods`,
      {
        headers: getAuthHeaders(),
      },
    )
    .then(({ shipping_methods }) => shipping_methods)
}
