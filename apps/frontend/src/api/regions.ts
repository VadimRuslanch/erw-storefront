import type { HttpTypes } from '@medusajs/types'
import { sdk } from './client'

const defaultRegion = import.meta.env.VITE_DEFAULT_REGION || 'dk'
const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const listRegions = async () => {
  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>('/store/regions', {
      method: 'GET',
    })
    .then(({ regions }) => regions)
}

export const retrieveRegion = async (id: string) => {
  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: 'GET',
    })
    .then(({ region }) => region)
}

export const buildRegionMap = async () => {
  if (regionMap.size > 0) {
    return regionMap
  }

  const regions = await listRegions()

  regions.forEach((region) => {
    region.countries?.forEach((country) => {
      const countryCode = country?.iso_2?.toLowerCase()

      if (countryCode) {
        regionMap.set(countryCode, region)
      }
    })
  })

  return regionMap
}

export const getRegion = async (countryCode?: string | null) => {
  const regionsByCountry = await buildRegionMap()
  const normalizedCountryCode = countryCode?.toLowerCase()

  if (normalizedCountryCode && regionsByCountry.has(normalizedCountryCode)) {
    return regionsByCountry.get(normalizedCountryCode)
  }

  return regionsByCountry.get(defaultRegion) ?? regionsByCountry.values().next().value ?? null
}

export const isSupportedCountryCode = async (countryCode?: string | null) => {
  if (!countryCode) {
    return false
  }

  const regionsByCountry = await buildRegionMap()

  return regionsByCountry.has(countryCode.toLowerCase())
}

export const getDefaultCountryCode = async () => {
  const regionsByCountry = await buildRegionMap()

  if (regionsByCountry.has(defaultRegion)) {
    return defaultRegion
  }

  return regionsByCountry.keys().next().value ?? defaultRegion
}
