// commonJS打包规范

import { Store, install } from './store'
import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'


// VUEX包导出的内容就只要这几个
export default {
  Store, // VUEX主业务类
  install, // vue组件注入函数
  version: '__VERSION__', // 版本
  mapState, // 导出state辅助函数
  mapMutations, // 导出Mutations辅助函数
  mapGetters, // 导出Getters辅助函数
  mapActions, // 导出Actions辅助函数
  /**
   * 创建携带了命名空间前缀的辅助函数，让其能像普通的辅助函数一样使用
   * mapState
   * mapMutations
   * mapGetters
   * mapActions
   */
  createNamespacedHelpers

}
