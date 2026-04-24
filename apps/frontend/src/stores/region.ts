import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { HttpTypes } from '@medusajs/types'
import {
  getDefaultCountryCode,
  getRegion,
  isSupportedCountryCode,
  listRegions,
} from '@api/regions'

export const useRegionStore = defineStore('region', () => {
  const regions = ref<HttpTypes.StoreRegion[]>([])
  const currentRegion = ref<HttpTypes.StoreRegion | null>(null)
  const countryCode = ref<string | null>(null)
  const isLoading = ref(false)

  const regionId = computed(() => currentRegion.value?.id ?? null)

  async function loadRegions() {
    regions.value = await listRegions()
    return regions.value
  }

  async function resolveCountryCode(nextCountryCode?: string | null) {
    const requestedCountryCode = nextCountryCode?.toLowerCase()

    if (requestedCountryCode && (await isSupportedCountryCode(requestedCountryCode))) {
      return requestedCountryCode
    }

    return getDefaultCountryCode()
  }

  async function setCountryCode(nextCountryCode?: string | null) {
    isLoading.value = true

    try {
      const resolvedCountryCode = await resolveCountryCode(nextCountryCode)
      const region = await getRegion(resolvedCountryCode)

      countryCode.value = resolvedCountryCode
      currentRegion.value = region ?? null

      return resolvedCountryCode
    } finally {
      isLoading.value = false
    }
  }

  return {
    regions,
    currentRegion,
    countryCode,
    regionId,
    isLoading,
    loadRegions,
    resolveCountryCode,
    setCountryCode,
  }
})
