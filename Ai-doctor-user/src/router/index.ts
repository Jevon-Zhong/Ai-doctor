import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', name: 'appshell', component: () => import('@/components/AppShell.vue') },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router