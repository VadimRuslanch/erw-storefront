import type { HttpTypes } from '@medusajs/types'
import { sdk } from './client'

export const retrieveCollection = async (id: string) => {
  return sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(`/store/collections/${id}`)
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string | number> = {},
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const query = {
    limit: 100,
    offset: 0,
    ...queryParams,
  }

  return sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>('/store/collections', {
      query,
    })
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string,
): Promise<HttpTypes.StoreCollection | null> => {
  return sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>('/store/collections', {
      query: { handle, fields: '*products' },
    })
    .then(({ collections }) => collections[0] || null)
}
