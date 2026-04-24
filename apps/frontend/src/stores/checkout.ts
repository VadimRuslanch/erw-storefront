import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { HttpTypes } from '@medusajs/types'
import { initiatePaymentSession, placeOrder, setAddresses } from '@api/cart'

export const useCheckoutStore = defineStore('checkout', () => {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function updateAddresses(data: HttpTypes.StoreUpdateCart) {
    return setAddresses(data)
  }

  async function initializePayment(
    cart: HttpTypes.StoreCart,
    data: HttpTypes.StoreInitializePaymentSession,
  ) {
    return initiatePaymentSession(cart, data)
  }

  async function submitOrder(cartId?: string) {
    isSubmitting.value = true
    error.value = null

    try {
      return await placeOrder(cartId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    updateAddresses,
    initializePayment,
    submitOrder,
  }
})
