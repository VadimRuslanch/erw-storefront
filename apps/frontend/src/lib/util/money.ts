import { isEmpty } from './isEmpty'

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = 'en-US',
}: ConvertToLocaleParams) => {
  const normalizedCurrencyCode = currency_code?.toUpperCase()

  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrencyCode,
    ...(normalizedCurrencyCode === 'RUB' ? { currencyDisplay: 'narrowSymbol' } : {}),
    minimumFractionDigits,
    maximumFractionDigits,
  })

  const parts = formatter.formatToParts(amount)
  const currencyPart = parts.find((part) => part.type === 'currency')?.value

  if (!currencyPart) {
    return formatter.format(amount)
  }

  const formattedAmount = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .trim()

  return `${formattedAmount} ${currencyPart}`
}
