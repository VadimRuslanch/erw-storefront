import type { HttpTypes } from '@medusajs/types'
import type { SortOptions } from '@/types/sort'
import { sortProducts } from '@lib/util/sort-products'
import { getAuthHeaders, sdk } from './client'
import { getRegion, retrieveRegion } from './regions'

type ProductListQuery = HttpTypes.FindParams & HttpTypes.StoreProductListParams

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQuery
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQuery
}> => {
  if (!countryCode && !regionId) {
    throw new Error('Country code or region ID is required')
  }

  const limit = queryParams?.limit || 12
  const page = Math.max(pageParam, 1)
  const offset = page === 1 ? 0 : (page - 1) * limit
  const region = countryCode ? await getRegion(countryCode) : await retrieveRegion(regionId!)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>('/store/products', {
      method: 'GET',
      query: {
        limit,
        offset,
        region_id: region.id,
        fields:
          '*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,',
        ...queryParams,
      },
      headers: getAuthHeaders(),
    })
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage,
        queryParams,
      }
    })
}

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
}: {
  page?: number
  queryParams?: ProductListQuery
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQuery
}> => {
  const limit = queryParams?.limit || 12
  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })
  const sortedProducts = sortProducts(products, sortBy)
  const pageOffset = (page - 1) * limit
  const nextPage = count > pageOffset + limit ? page + 1 : null

  return {
    response: {
      products: sortedProducts.slice(pageOffset, pageOffset + limit),
      count,
    },
    nextPage,
    queryParams,
  }
}
