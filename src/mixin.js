// 将vuex混合到全局vue中，通过mixin添加vue类的全局生命周期钩子。vue的实例化将位于该函数之后，所以之后生成的vue实例都将共享这个vuex


// 实际上，vuex与vue主业务没有直接个的关系，完全可以不使用vue.use注入vuex，独立使用vuex
// 注入vuex，只是为了能在各个子组件中，能通过$state引用到
// 这意味着，vuex只是单纯的数据保存操作机制
export default function (Vue) {
  const version = Number(Vue.version.split('.')[0]) //vue版本

  if (version >= 2) { // 当使用vue2版本时，vuex的初始化函数放在beforeCreate阶段执行
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    // vue1版本时，还没有生命周期钩子，通过重写其_init函数，注入额外代码
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) { // options拦截本身传递给vue的_init函数的参数
      options.init = options.init // vue1的特定，有个init数组，往该数组中添加vuex初始化函数
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options) // 往参数中添加一个init任务，恢复原本流程
    }
  }

  // vuex真正的初始化函数，在这里才真正进入vuex自身的执行内容。因为这个函数是直接被vue调用的，而不是额外new出来的对象调用的
  function vuexInit() {
    // this.$options是vue实例中，保存自定义属性的对象，在new vue传入的对象
    const options = this.$options // this.$options是当vue执行响应钩子时，从vue中获取的变量
    if (options.store) {
      // store可以是一个new好的实例，也可以是个函数，该函数返回一个new vues.store的实例。vues.store构造函数页有介绍
      this.$store = typeof options.store === 'function' // 这时this指针指向的是vue实例对象，这里是向vue实例对象添加$store属性
        ? options.store() // 传入函数，与vue的data属性相同的原理，为了复用某个配置，生成不同地址的对象，避免相关污染
        : options.store // 在new vue是传入的vuex实例，在外部通过new产生的vuex实例对象
    } else if (options.parent && options.parent.$store) { // 子组件，因为子组件的options中不会有$store属性，所以需要寻找上一级的$store属性
      this.$store = options.parent.$store // 注意，这里的this是vue组件实例的，所以这里同样是往子组件中添加$store变量，全局共享一个vuex实例
    }

  }
}
