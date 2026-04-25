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

  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalizedCurrencyCode,
        ...(normalizedCurrencyCode === 'RUB' ? { currencyDisplay: 'narrowSymbol' } : {}),
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}
