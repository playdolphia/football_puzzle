import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home/page.vue'),
      meta: {
        title: 'Pass Up - Dolphia'
      }
    },
    {
      path: '/leaderboard',
      name: 'passup-leaderboard',
      component: () => import('@/views/leaderboard/page.vue'),
      meta: {
        title: 'Pass Up Leaderboard'
      }
    },
    {
      path: '/ladder',
      name: 'ladder-game',
      component: () => import('@/views/ladder/page.vue'),
      meta: {
        title: 'Pass Up Ladder'
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