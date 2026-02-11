import { createRouter, createWebHistory } from 'vue-router'
import { useGlobalStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home/page.vue'),
      meta: {
        title: 'Puzzle - Dolphia'
      }
    },
    {
      path: '/puzzle',
      name: 'puzzle',
      component: () => import('@/views/puzzle/page.vue'),
      meta: {
        title: 'Daily Challenge - Dolphia Puzzle',
        requiresAuth: true,
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/404/page.vue'),
      meta: {
        title: 'Page Not Found'
      }
    }
  ]
})

router.beforeEach((to) => {
  document.title = to.meta.title as string || 'Dolphia Puzzle'

  // Initialize auth on every navigation (idempotent - only runs once)
  const globalStore = useGlobalStore()
  globalStore.initAuth()

  // Redirect to home if auth is required but not authenticated
  if (to.meta.requiresAuth && !globalStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
