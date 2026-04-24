import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { HttpTypes } from '@medusajs/types'
import * as customerApi from '@api/customer'

export const useCustomerStore = defineStore('customer', () => {
  const customer = ref<HttpTypes.StoreCustomer | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadCustomer() {
    isLoading.value = true
    error.value = null

    try {
      customer.value = await customerApi.retrieveCustomer()
      return customer.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(input: customerApi.LoginInput) {
    customer.value = await customerApi.login(input)
    return customer.value
  }

  async function signup(input: customerApi.SignupInput) {
    customer.value = await customerApi.signup(input)
    return customer.value
  }

  async function signout() {
    await customerApi.signout()
    customer.value = null
  }

  return {
    customer,
    isLoading,
    error,
    loadCustomer,
    login,
    signup,
    signout,
  }
})
