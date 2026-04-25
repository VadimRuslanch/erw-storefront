/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDUSA_BACKEND_URL?: string
  readonly VITE_MEDUSA_PUBLISHABLE_KEY?: string
  readonly VITE_DEFAULT_REGION?: string
  readonly VITE_REQUIRE_AUTH_FOR_CART?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
