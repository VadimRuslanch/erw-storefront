import { getLocale, setLocale } from '@lib/storage'

export const getCurrentLocale = () => getLocale()

export const setCurrentLocale = (locale: string) => {
  setLocale(locale)
  return locale
}
