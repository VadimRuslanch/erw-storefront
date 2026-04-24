import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentLocale, setCurrentLocale } from '@api/locales'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(getCurrentLocale())

  function setLocale(nextLocale: string) {
    locale.value = setCurrentLocale(nextLocale)
  }

  return {
    locale,
    setLocale,
  }
})
