import { createRouter, createWebHistory } from 'vue-router'
import { useRegionStore } from '@stores/region'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@/views/RouteRedirectView.vue'),
    },
    {
      path: '/:countryCode',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: 'Storefront' },
        },
        {
          path: 'store',
          name: 'store',
          component: () => import('@/views/StoreView.vue'),
          meta: { title: 'Store' },
        },
        {
          path: 'categories',
          name: 'catalog',
          component: () => import('@/views/CatalogView.vue'),
          meta: { title: 'Catalog' },
        },
        {
          path: 'products/:handle',
          name: 'product',
          component: () => import('@/views/ProductView.vue'),
          meta: { title: 'Product' },
        },
        {
          path: 'categories/:category+',
          name: 'category',
          component: () => import('@/views/CategoryView.vue'),
          meta: { title: 'Category' },
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/LoginView.vue'),
          meta: { title: 'Sign in' },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/RegisterView.vue'),
          meta: { title: 'Register' },
        },
        {
          path: 'collections/:handle',
          name: 'collection',
          component: () => import('@/views/CollectionView.vue'),
          meta: { title: 'Collection' },
        },
        {
          path: 'cart',
          name: 'cart',
          component: () => import('@/views/CartView.vue'),
          meta: { title: 'Cart' },
        },
        {
          path: 'privacy-policy',
          name: 'privacy-policy',
          component: () => import('@/views/PrivacyPolicyView.vue'),
          meta: { title: 'Политика конфиденциальности' },
        },
        {
          path: 'contacts',
          name: 'contacts',
          component: () => import('@/views/ContactsView.vue'),
          meta: { title: 'Контакты' },
        },
        {
          path: 'order/:id/confirmed',
          name: 'order-confirmed',
          component: () => import('@/views/OrderConfirmedView.vue'),
          meta: { title: 'Order Confirmed' },
        },
        {
          path: 'order/:id/transfer/:token',
          name: 'order-transfer',
          component: () => import('@/views/OrderTransferView.vue'),
          meta: { title: 'Order Transfer' },
        },
        {
          path: 'order/:id/transfer/:token/accept',
          name: 'order-transfer-accept',
          component: () => import('@/views/OrderTransferAcceptView.vue'),
          meta: { title: 'Accept Transfer' },
        },
        {
          path: 'order/:id/transfer/:token/decline',
          name: 'order-transfer-decline',
          component: () => import('@/views/OrderTransferDeclineView.vue'),
          meta: { title: 'Decline Transfer' },
        },
      ],
    },
    {
      path: '/:countryCode/checkout',
      component: () => import('@/layouts/CheckoutLayout.vue'),
      children: [
        {
          path: '',
          name: 'checkout',
          component: () => import('@/views/CheckoutView.vue'),
          meta: { title: 'Checkout' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Not Found', skipCountryGuard: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const regionStore = useRegionStore()
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Storefront'

  document.title = title

  if (to.path === '/') {
    const countryCode = await regionStore.resolveCountryCode()
    return { path: `/${countryCode}`, replace: true }
  }

  if (to.meta.skipCountryGuard) {
    return true
  }

  const routeCountryCode = Array.isArray(to.params.countryCode)
    ? to.params.countryCode[0]
    : to.params.countryCode
  const resolvedCountryCode = await regionStore.setCountryCode(routeCountryCode)

  if (routeCountryCode !== resolvedCountryCode) {
    return {
      path: to.fullPath.replace(/^\/[^/?#]+/, `/${resolvedCountryCode}`),
      replace: true,
    }
  }

  return true
})

export default router
