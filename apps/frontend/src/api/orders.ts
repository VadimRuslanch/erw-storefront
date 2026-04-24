import type { HttpTypes } from '@medusajs/types'
import medusaError from '@lib/util/medusa-error'
import { getAuthHeaders, sdk } from './client'

export const retrieveOrder = async (id: string) => {
  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: 'GET',
      query: {
        fields:
          '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product',
      },
      headers: getAuthHeaders(),
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>,
) => {
  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>('/store/orders', {
      method: 'GET',
      query: {
        limit,
        offset,
        order: '-created_at',
        fields: '*items,+items.metadata,*items.variant,*items.product',
        ...filters,
      },
      headers: getAuthHeaders(),
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  id: string,
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  if (!id) {
    return { success: false, error: 'Order ID is required', order: null }
  }

  return sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: 'id, email',
      },
      getAuthHeaders(),
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  return sdk.store.order
    .acceptTransfer(id, { token }, {}, getAuthHeaders())
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  return sdk.store.order
    .declineTransfer(id, { token }, {}, getAuthHeaders())
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({ success: false, error: err.message, order: null }))
}
