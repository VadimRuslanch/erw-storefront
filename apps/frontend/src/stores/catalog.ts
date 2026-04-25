import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { HttpTypes } from '@medusajs/types'
import type { SortOptions } from '@/types/sort'
import { listCategories } from '@api/categories'
import { listCollections } from '@api/collections'
import { listProductsWithSort } from '@api/products'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<HttpTypes.StoreProduct[]>([])
  const productCount = ref(0)
  const categories = ref<HttpTypes.StoreProductCategory[]>([])
  const collections = ref<HttpTypes.StoreCollection[]>([])
  const isLoading = ref(false)
  const isCategoriesLoading = ref(false)

  async function loadProducts(options: {
    countryCode: string
    page?: number
    sortBy?: SortOptions
    queryParams?: Parameters<typeof listProductsWithSort>[0]['queryParams']
  }) {
    isLoading.value = true

    try {
      const response = await listProductsWithSort(options)
      products.value = response.response.products
      productCount.value = response.response.count

      return response
    } finally {
      isLoading.value = false
    }
  }

  async function loadCategories(query?: Parameters<typeof listCategories>[0]) {
    isCategoriesLoading.value = true

    try {
      categories.value = await listCategories(query)
      return categories.value
    } finally {
      isCategoriesLoading.value = false
    }
  }

  async function loadCollections() {
    const response = await listCollections()
    collections.value = response.collections

    return collections.value
  }

  return {
    products,
    productCount,
    categories,
    collections,
    isLoading,
    isCategoriesLoading,
    loadProducts,
    loadCategories,
    loadCollections,
  }
})
