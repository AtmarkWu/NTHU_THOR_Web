import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Stage1View from '../views/Stage1View.vue'
import Stage2View from '../views/Stage2View.vue'
import Stage3View from '../views/Stage3View.vue'
import Stage4View from '../views/Stage4View.vue'
import BingoView from '../views/BingoView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
{
      path: '/stage1',
      name: 'stage1',
      component: Stage1View,
    },
    {
      path: '/stage2',
      name: 'stage2',
      component: Stage2View,
    },
    {
      path: '/stage3',
      name: 'stage3',
      component: Stage3View,
    },
    {
      path: '/stage4',
      name: 'stage4',
      component: Stage4View,
    },
    {
      path: '/bingo',
      name: 'bingo',
      component: BingoView,
    },
  ],
})

export default router
