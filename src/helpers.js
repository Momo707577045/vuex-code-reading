// 便捷辅助函数
// state的辅助函数
export const mapState = normalizeNamespace((namespace, states) => {
  // state是映射关系，namespace是命名空间，但该命名空间不一定有
  const res = {} // 返回的是一个对象
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState() { // 因为该mapState只设计放在computed中使用，所以返回的是一个function。即让vue依赖本函数的内容，进行数值动态变化
      let state = this.$store.state
      let getters = this.$store.getters // 这里获取getters，是应该后续，在传入的是函数时，将getters作为参数，传递过去，方便合成数据
      if (namespace) { // 直接获取带命名空间的模块
        const module = getModuleByNamespace(this.$store, 'mapState', namespace)
        if (!module) {
          return
        }
        state = module.context.state // 调用具体模块的state，模块具体的state，设置了get，将根据前缀层级，从state树中获取具体的state
        getters = module.context.getters
      }
      return typeof val === 'function' // 兼容函数操作和普通对象或数组的引用
        ? val.call(this, state, getters) // 传入是函数，则将state与getters作为参数传入，自由组合，相当于getter的用法，特立的getter
        : state[val] // 直接返回
    }
    res[key].vuex = true  // 数据标示符，在插件中使用
  })
  return res
})

/**
 * Reduce the code which written in Vue.js for getting the getters
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} getters
 * @return {Object}
 */
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {}
  normalizeMap(getters).forEach(({ key, val }) => {
    val = namespace + val // 直接添加命名空间前缀
    res[key] = function mappedGetter() { //  getter和state一样，都放在computed，所以返回的是函数。getter相当于vuex内部的统一处理函数
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
        return
      }
      if (process.env.NODE_ENV !== 'production' && !(val in this.$store.getters)) {
        console.error(`[vuex] unknown getter: ${val}`)
        return
      }
      // getters与mutation类似，都没有层级关系，通过一个对象保存全部的getter，通过「/」建立层级关系
      // 应该getter与dispatch不同，getter对前缀的处理，在其get中设置，相当于融合到自己本身了
      return this.$store.getters[val]
    }
    res[key].vuex = true // 数据标示符，在插件中使用
  })
  return res
})

// 导出action的辅助函数
export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {}
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function mappedAction(...args) {
      // 使用根store的dispatch，没有做命名空间前缀的处理
      let dispatch = this.$store.dispatch
      // 如果有namespace，则证明是createNamespacedHelpers函数的，这时返回的是module.content中的内容，
      // 而module.content.dispatch是被重载的函数，会对传入的key值进行处理，添加该module的命名空间前缀
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapActions', namespace)
        if (!module) {
          return
        }
        dispatch = module.context.dispatch
      }
      return typeof val === 'function'
        // 可以将val传入一个函数，函数的第一个参数将被填充为绑定了this.$store的dispatch方法，方便在函数中调用
        ? val.apply(this, [dispatch].concat(args))
        // apply(this.$store是绑定vuex去调用，[val].concat(args)是将type作为第一个参数，其余作为后续参数，传递到commit函数使用
        : dispatch.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

// mutation是函数形式，所以返回的也是函数，即返回独立的函数，而不需要vuex去引用。
export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {}
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function mappedMutation(...args) {
      let commit = this.$store.commit // 因为Mutation实际上是需用通过commit去触发的，所以返回的是commit
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapMutations', namespace)
        if (!module) {
          return
        }
        // 获取具体module的commit，对传入的Key进行前缀处理
        commit = module.context.commit
      }
      // 可以将val传入一个函数，函数的第一个参数将被填充为绑定了this.$store的commit方法，方便在函数中调用
      return typeof val === 'function'
        ? val.apply(this, [commit].concat(args))
        // apply(this.$store是绑定vuex去调用，[val].concat(args)是将type作为第一个参数，其余作为后续参数，传递到commit函数使用
        : commit.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

// 根据命名空间，返回特定的辅助函数。其本质是往各个辅助函数中添加了命名空间前缀
export const createNamespacedHelpers = (namespace) => ({
  // 生成函数，且函数的第一个参数已经被设置好，设置namespace，后续使用时，从参数的第二个开始填充
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace)
})

/**
 * 解析map内容，兼容数组写法和对象写法。带命名空间的模块不能直接使用辅助函数的原因，因为key和value值是相同的。所以只能分开写key和value
 * normalizeMap([a, b, c]) => [ { key: a, val: a }, { key: b, val: b }, { key: c, val: c } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 */
function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }))
}

/**
 * 用于适配单纯的map写法和带上命名空间的写法
 * 带上命名空间的写法在createNamespacedHelpers中使用，
 */
function normalizeNamespace(fn) {
  return (namespace, map) => {
    if (typeof namespace !== 'string') {
      map = namespace
      namespace = ''
    } else if (namespace.charAt(namespace.length - 1) !== '/') { // 补「/」
      namespace += '/'
    }
    return fn(namespace, map)
  }
}

// 通过命名空间带上前缀的完整路径获取具体的模块
function getModuleByNamespace(store, helper, namespace) {
  const module = store._modulesNamespaceMap[namespace] // _modulesNamespaceMap是store中的对象，保存设置有命名空间前缀的module，方便即时获取
  if (process.env.NODE_ENV !== 'production' && !module) {
    console.error(`[vuex] module namespace not found in ${helper}(): ${namespace}`)
  }
  return module
}
