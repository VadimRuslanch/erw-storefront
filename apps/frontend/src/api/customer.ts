import type { HttpTypes } from '@medusajs/types'
import medusaError from '@lib/util/medusa-error'
import {
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from '@lib/storage'
import { getAuthHeaders, sdk } from './client'

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = LoginInput & {
  first_name: string
  last_name: string
  phone?: string
}

export const retrieveCustomer = async (): Promise<HttpTypes.StoreCustomer | null> => {
  const authHeaders = getAuthHeaders()

  if (!('authorization' in authHeaders)) {
    return null
  }

  return sdk.client
    .fetch<{ customer: HttpTypes.StoreCustomer }>('/store/customers/me', {
      method: 'GET',
      query: {
        fields: '*orders',
      },
      headers: authHeaders,
    })
    .then(({ customer }) => customer)
    .catch(() => null)
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  return sdk.store.customer
    .update(body, {}, getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)
}

export async function signup(input: SignupInput) {
  const token = await sdk.auth.register('customer', 'emailpass', {
    email: input.email,
    password: input.password,
  })

  setAuthToken(token as string)

  const { customer } = await sdk.store.customer.create(
    {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
    },
    {},
    getAuthHeaders(),
  )

  const loginToken = await sdk.auth.login('customer', 'emailpass', {
    email: input.email,
    password: input.password,
  })

  setAuthToken(loginToken as string)
  await transferCart()

  return customer
}

export async function login(input: LoginInput) {
  const token = await sdk.auth.login('customer', 'emailpass', input)

  setAuthToken(token as string)
  await transferCart()

  return retrieveCustomer()
}

export async function signout() {
  await sdk.auth.logout()
  removeAuthToken()
  removeCartId()
}

export async function transferCart() {
  const cartId = getCartId()

  if (!cartId) {
    return
  }

  await sdk.store.cart.transferCart(cartId, {}, getAuthHeaders())
}

export const addCustomerAddress = async (
  address: HttpTypes.StoreCreateCustomerAddress,
): Promise<{ success: boolean; error: string | null }> => {
  return sdk.store.customer
    .createAddress(address, {}, getAuthHeaders())
    .then(() => ({ success: true, error: null }))
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}

export const deleteCustomerAddress = async (
  addressId: string,
): Promise<{ success: boolean; error: string | null }> => {
  return sdk.store.customer
    .deleteAddress(addressId, getAuthHeaders())
    .then(() => ({ success: true, error: null }))
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}

export const updateCustomerAddress = async (
  addressId: string,
  address: HttpTypes.StoreUpdateCustomerAddress,
): Promise<{ success: boolean; error: string | null }> => {
  return sdk.store.customer
    .updateAddress(addressId, address, {}, getAuthHeaders())
    .then(() => ({ success: true, error: null }))
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}
