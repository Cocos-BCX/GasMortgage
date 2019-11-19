import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import LookForwardTo from '@/components/LookForwardTo'
import RentalList from '@/components/RentalList'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    // {
    //   path: '/',
    //   name: 'LookForwardTo',
    //   component: LookForwardTo
    // },
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/rentallist',
      name: 'RentalList',
      component: RentalList
    }
  ]
})
