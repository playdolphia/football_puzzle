import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home/page.vue'),
      meta: {
        title: 'Club Management - Dolphia'
      }
    },
    {
      path: '/club',
      name: 'club',
      component: () => import('@/views/club/page.vue'),
      meta: {
        title: 'My Club - Dolphia'
      }
    },
    {
      path: '/game',
      name: 'club-game',
      component: () => import('@/views/game/page.vue'),
      meta: {
        title: 'Club Field View'
      }
    },
    {
      path: '/help',
      name: 'club-help',
      component: () => import('@/views/help/page.vue'),
      meta: {
        title: 'Club Management Guide'
      }
    },
    // 404 page
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

// Dynamic title updates
router.beforeEach((to) => {
  document.title = to.meta.title as string || 'Dolphia'
})

export default router