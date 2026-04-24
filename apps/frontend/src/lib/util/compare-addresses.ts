const addressFields = [
  'first_name',
  'last_name',
  'address_1',
  'company',
  'postal_code',
  'city',
  'country_code',
  'province',
  'phone',
] as const

type ComparableAddress = Partial<Record<(typeof addressFields)[number], unknown>>

export default function compareAddresses(address1: ComparableAddress, address2: ComparableAddress) {
  return addressFields.every((field) => address1[field] === address2[field])
}
