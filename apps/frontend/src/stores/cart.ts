import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { HttpTypes } from '@medusajs/types'
import * as cartApi from '@api/cart'
import { getCartId } from '@lib/storage'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<HttpTypes.StoreCart | null>(null)
  const shippingOptions = ref<HttpTypes.StoreCartShippingOption[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadCart(cartId?: string) {
    isLoading.value = true
    error.value = null

    try {
      cart.value = await cartApi.retrieveCart(cartId)
      return cart.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function ensureCart(countryCode: string) {
    isLoading.value = true
    error.value = null

    try {
      cart.value = await cartApi.getOrSetCart(countryCode)
      return cart.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addItem(payload: { variantId: string; quantity: number; countryCode: string }) {
    cart.value = await cartApi.addToCart(payload)
    return cart.value
  }

  async function updateItem(payload: { lineId: string; quantity: number }) {
    cart.value = await cartApi.updateLineItem(payload)
    return cart.value
  }

  async function removeItem(lineId: string) {
    cart.value = await cartApi.deleteLineItem(lineId)
    return cart.value
  }

  async function applyPromotions(codes: string[]) {
    cart.value = await cartApi.applyPromotions(codes)
    return cart.value
  }

  async function loadShippingOptions() {
    if (!getCartId()) {
      shippingOptions.value = []
      return shippingOptions.value
    }

    const response = await cartApi.listCartOptions()
    shippingOptions.value = response.shipping_options

    return shippingOptions.value
  }

  async function setShippingMethod(shippingMethodId: string) {
    if (!cart.value?.id) {
      throw new Error('Missing cart ID when setting shipping method')
    }

    cart.value = await cartApi.setShippingMethod({
      cartId: cart.value.id,
      shippingMethodId,
    })

    return cart.value
  }

  return {
    cart,
    shippingOptions,
    isLoading,
    error,
    loadCart,
    ensureCart,
    addItem,
    updateItem,
    removeItem,
    applyPromotions,
    loadShippingOptions,
    setShippingMethod,
  }
})
