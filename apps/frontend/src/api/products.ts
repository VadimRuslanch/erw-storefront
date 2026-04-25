import type { HttpTypes } from '@medusajs/types'
import type { SortOptions } from '@/types/sort'
import { sortProducts } from '@lib/util/sort-products'
import { getAuthHeaders, sdk } from './client'
import { getRegion, retrieveRegion } from './regions'

type ProductListQuery = HttpTypes.FindParams & HttpTypes.StoreProductListParams

const serverSortMap: Partial<Record<SortOptions, string>> = {
  created_at: '-created_at',
}

function cleanProductListQuery(query?: ProductListQuery): ProductListQuery | undefined {
  if (!query) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false
      }

      if (Array.isArray(value) && value.length === 0) {
        return false
      }

      return true
    }),
  ) as ProductListQuery
}

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
  const cleanQueryParams = cleanProductListQuery(queryParams)

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
        ...cleanQueryParams,
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
  const { order: _order, ...baseQueryParams } = queryParams ?? {}
  const requestQueryParams: ProductListQuery = {
    ...baseQueryParams,
    limit,
  }
  const serverOrder = serverSortMap[sortBy]

  if (serverOrder) {
    requestQueryParams.order = serverOrder
  }

  const productPage = await listProducts({
    pageParam: page,
    queryParams: requestQueryParams,
    countryCode,
  })

  if (sortBy === 'price_asc' || sortBy === 'price_desc') {
    return {
      ...productPage,
      response: {
        ...productPage.response,
        products: sortProducts(productPage.response.products, sortBy),
      },
    }
  }

  return productPage
}

export const getProductByHandle = async ({
  handle,
  countryCode,
}: {
  handle: string
  countryCode: string
}) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      handle,
      limit: 1,
      fields:
        '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*variants.images,*images,*options,*options.values,*categories,*collection,*type,+metadata,+tags',
    },
  })

  return products[0] ?? null
}
