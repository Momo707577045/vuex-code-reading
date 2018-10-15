export default function (Vue) {
  const version = Number(Vue.version.split('.')[0]) // 获取Vue版本
  if (version >= 2) { // 当Vue使用大于等于2.0版本时，Vuex的初始化函数放在beforeCreate钩子中执行
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    // Vue1.x的版本，还没有生命周期钩子，通过重写其_init函数，注入额外代码来实现
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) { // options保存原本传递给vue的_init函数的参数
      options.init = options.init // Vue1.x的特性，有个init初始化函数数组，往该数组中添加Vuex初始化函数
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options) // 往参数中添加一个init函数，恢复原本流程
    }
  }

  function vuexInit() {
    const options = this.$options // 这里的this指向Vue对象实例
    if (options.store) { // 如果是Vue根实例
      this.$store = typeof options.store === 'function'
        ? options.store() // 传入函数，与Vue的data属性相同的原理，为了复用某个配置，生成不同地址的对象，避免相关污染
        : options.store // 在new vue是传入的Vuex实例，在外部通过new产生的vuex实例对象
    } else if (options.parent && options.parent.$store) { // 子组件，寻找上一级的$store属性，递归找到根实例的$store
      this.$store = options.parent.$store // 往子组件中挂载$store变量
    }
  }
}
