import type { HttpTypes } from '@medusajs/types'
import medusaError from '@lib/util/medusa-error'
import { getCartId, getLocale, removeCartId, setCartId } from '@lib/storage'
import { getAuthHeaders, sdk } from './client'
import { getRegion } from './regions'

export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || getCartId()
  const queryFields =
    fields ??
    '*items, *region, *shipping_address, *billing_address, *items.product, *items.variant, *items.variant.options, *items.thumbnail, *items.metadata, +items.unit_price, +items.total, +items.subtotal, +items.tax_total, +items.discount_total, *promotions, *shipping_methods, +shipping_methods.name, +shipping_methods.total, *payment_collection, *payment_collection.payment_sessions'

  if (!id) {
    return null
  }

  return sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: 'GET',
      query: {
        fields: queryFields,
      },
      headers: getAuthHeaders(),
    })
    .then(({ cart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, 'id,region_id')
  const headers = getAuthHeaders()

  if (!cart) {
    const locale = getLocale()
    const cartResponse = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers,
    )
    cart = cartResponse.cart

    setCartId(cart.id)
  }

  if (cart && cart.region_id !== region.id) {
    const cartResponse = await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    cart = cartResponse.cart
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = getCartId()

  if (!cartId) {
    throw new Error('No existing cart found, please create one before updating')
  }

  return sdk.store.cart
    .update(cartId, data, {}, getAuthHeaders())
    .then(({ cart }) => cart)
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error('Missing variant ID when adding to cart')
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error('Error retrieving or creating cart')
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      getAuthHeaders(),
    )
    .catch(medusaError)

  return retrieveCart(cart.id)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error('Missing lineItem ID when updating line item')
  }

  const cartId = getCartId()

  if (!cartId) {
    throw new Error('Missing cart ID when updating line item')
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, getAuthHeaders())
    .catch(medusaError)

  return retrieveCart(cartId)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error('Missing lineItem ID when deleting line item')
  }

  const cartId = getCartId()

  if (!cartId) {
    throw new Error('Missing cart ID when deleting line item')
  }

  await sdk.store.cart.deleteLineItem(cartId, lineId, {}, getAuthHeaders()).catch(medusaError)

  return retrieveCart(cartId)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, getAuthHeaders())
    .then(() => retrieveCart(cartId))
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession,
) {
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, getAuthHeaders())
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId()

  if (!cartId) {
    throw new Error('No existing cart found')
  }

  await sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, getAuthHeaders())
    .catch(medusaError)

  return retrieveCart(cartId)
}

export async function setAddresses(data: HttpTypes.StoreUpdateCart) {
  return updateCart(data)
}

export async function placeOrder(cartId?: string) {
  const id = cartId || getCartId()

  if (!id) {
    throw new Error('No existing cart found when placing an order')
  }

  const cartResponse = await sdk.store.cart.complete(id, {}, getAuthHeaders()).catch(medusaError)

  if (cartResponse?.type === 'order') {
    removeCartId()
  }

  return cartResponse
}

export async function updateRegion(countryCode: string) {
  const cartId = getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cartId) {
    return null
  }

  return updateCart({ region_id: region.id })
}

export async function listCartOptions() {
  const cartId = getCartId()

  return sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>('/store/shipping-options', {
    query: { cart_id: cartId },
    headers: getAuthHeaders(),
  })
}
