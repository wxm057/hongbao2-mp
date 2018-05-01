import Vue from 'vue'
import App from './app'

Vue.config.productionTip = false
App.mpType = 'app'

const app = new Vue(App)
app.$mount()

export default {
  config: {
    pages: ['^pages/index/main'],
    window: {
      backgroundTextStyle: 'dark',
      backgroundColor: '#fff',
      navigationBarBackgroundColor: '#d9534f',
      navigationBarTitleText: '一键最佳',
      navigationBarTextStyle: '#333'
    }
  }
}
