// 核心代码库

import applyMixin from './mixin' // vuex各层级注入
import devtoolPlugin from './plugins/devtool' // 调试工具，和devtools配合的插件，提供像时空旅行这样的调试功能。
import ModuleCollection from './module/module-collection' // 提供对module的处理，主要是对state的处理，最后构建成一棵module tree
import { forEachValue, isObject, isPromise, assert } from './util'

let Vue // 单例模式，保存注入到vue时接受到的vue对象

// vuex类
export class Store {
  constructor(options = {}) {
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      assert(this instanceof Store, `store must be called with the new operator.`)
    }

    // 外部传入的参数，在严格模式下，任何 mutation 处理函数以外修改 Vuex state 都会抛出错误。
    const { plugins = [], strict = false } = options

    this._committing = false // 提交状态，防止在commit期间，state被修改
    // 从null中创建对象，Object.create(null)没有继承任何原型方法，也就是说它的原型链没有上一层。
    this._actions = Object.create(null) // 保存所有的action回调函数
    this._mutations = Object.create(null) // 保存所有的mutations回调函数
    this._subscribers = [] // 订阅 store 的 mutation。handler 会在每个 mutation 完成后调用，该功能常用于插件
    this._actionSubscribers = [] // 订阅 store 的 action。handler 会在每个 action 分发的时候调用，该功能常用于插件
    this._wrappedGetters = Object.create(null) // 保存所有的getter，但实际导出时使用的不是这个，而且getter
    this._modules = new ModuleCollection(options) // 解析并生成模块树，还未实现业务功能
    this._modulesNamespaceMap = Object.create(null) // 保存命名空间的模块对象，以便在辅助函数createNamespacedHelpers中快速定位到带命名空间的模块
    this._watcherVM = new Vue()  // 用于响应式地监测一个 getter 方法的返回值

    const store = this
    const { dispatch, commit } = this
    // 这映射了vuex的使用，dispatch('操作名'，携带的参数)
    // 将this指向store，防止被修改
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // 严格模式
    this.strict = strict

    const state = this._modules.root.state // 获取根模块的state状态

    // 安装模块，设置提交函数的重载，根据是否设置命名空间，设置参数前缀。将module的配置项注入到store对应对象中收集保存起来。
    installModule(this, state, [], this._modules.root)

    // 使用store作为一个配置项，生成一个vue组件，Vuex其实构建的就是一个名为store的vm组件，所有配置的state、actions、mutations以及getters都是其组件的属性，所有的操作都是对这个vm组件进行的。
    resetStoreVM(this, state)

    // apply plugins
    plugins.forEach(plugin => plugin(this))

    if (Vue.config.devtools) {
      devtoolPlugin(this)
    }
  }

  // 拦截器，获取store的state时，实际上需要通过store内部的_vm对象，获取_vm中对应的state内容，以计算其依赖
  // 本质上没有显式设置store.state对象，只是定义了其state的get，进行了一个数据内容管道映射
  get state() {
    return this._vm._data.$$state
  }

  // 替换整个state, 严格模式时报错
  set state(v) {
    if (process.env.NODE_ENV !== 'production') {
      assert(false, `use store.replaceState() to explicit replace store state.`)
    }
  }

  // 真正执行的commit函数，仅仅用于执行mutation，没有涉及其他业务操作
  commit(_type, _payload, _options) {
    const { type, payload, options } = unifyObjectStyle(_type, _payload, _options)

    const mutation = { type, payload }
    const entry = this._mutations[type] // 同样是获取对应的mutation数组
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    // _withCommit是为了在执行commit时，将状态设置为committing。通过committing标示符，使得其他修改state的都是非法操作
    this._withCommit(() => {
      entry.forEach(function commitIterator(handler) { // 直接顺序调用对应的commit函数
        handler(payload)
      })
    })
    // 订阅 store 的 mutation。handler 会在每个 mutation 完成后调用，该功能常用于插件
    this._subscribers.forEach(sub => sub(mutation, this.state))

    if (
      process.env.NODE_ENV !== 'production' &&
      options && options.silent
    ) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
        'Use the filter functionality in the vue-devtools'
      )
    }
  }

  // dispatch函数，仅仅用于触发action操作，没有额外的事务操作
  // dispatch返回的是一个promise对象，可以链式调用then方法
  dispatch(_type, _payload) {
    const { type, payload } = unifyObjectStyle(_type, _payload)

    // type为action的名字，payload为负载参数
    const action = { type, payload }
    const entry = this._actions[type] // vuex实例中否存在该action名的数组
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    // 执行action的事件订阅，在执行派发action操作前，执行订阅事件的回调，即外部钩子，通常在插件中使用，如调试功能
    this._actionSubscribers.forEach(sub => sub(action, this.state))

    // 使用promise以此执行,promise.all，执行多个异步操作，直到所有都完成，同时异步执行，并将每个运行结果以数组的形式，顺序罗列传入到.then函数中
    return entry.length > 1 ? Promise.all(entry.map(handler => handler(payload))) : entry[0](payload)
  }

  // mutation订阅事件的控制，添加及去除
  subscribe(fn) {
    return genericSubscribe(fn, this._subscribers)
  }

  // action订阅事件的控制，添加及去除
  subscribeAction(fn) {
    return genericSubscribe(fn, this._actionSubscribers)
  }

  watch(getter, cb, options) {
    if (process.env.NODE_ENV !== 'production') {
      assert(typeof getter === 'function', `store.watch only accepts a function.`)
    }
    return this._watcherVM.$watch(() => getter(this.state, this.getters), cb, options)
  }

  // 替换整个state,  替换 store 的根状态，仅用状态合并或时光旅行调试。
  replaceState(state) {
    this._withCommit(() => {
      this._vm._data.$$state = state
    })
  }

  // 注册一个动态模块，通常用于服务端渲染，可以看做某局域块功能的临时数据存储
  registerModule(path, rawModule, options = {}) {
    if (typeof path === 'string') {
      path = [path]
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }

    this._modules.register(path, rawModule) // 调用模块集合，添加模块
    // 注册该模块，即重新设置store中的属性，修改各个参数
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // 重新注册到_vm中
    resetStoreVM(this, this.state)
  }

  // 卸载一个动态模块
  unregisterModule(path) {
    if (typeof path === 'string') {
      path = [path]
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      Vue.delete(parentState, path[path.length - 1])
    })
    resetStore(this)
  }

  // 热更新，即重新根据配置文件，重新走一次流程
  hotUpdate(newOptions) {
    this._modules.update(newOptions)
    resetStore(this, true)
  }

  // 执行某代码，并在期间设置committing状态
  _withCommit(fn) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

// 订阅器（订阅mutation或action）函数的控制器，添加与删除
function genericSubscribe(fn, subs) {
  if (subs.indexOf(fn) < 0) {
    subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

// 重置store
function resetStore(store, hot) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset vm
  resetStoreVM(store, state, hot)
}

// 使用store生成一个vue组件，借用vue的data数据绑定和computed功能
function resetStoreVM(store, state, hot) {
  const oldVm = store._vm

  // 定义全局的getters在这里
  // getters与_wrappedGetters没有重用，_wrappedGetters只用于收集每个模块的getter，store.getters才是真正导出的内容
  store.getters = {} // 为全局的store创建一个getters属性
  const wrappedGetters = store._wrappedGetters
  const computed = {}

  // 使用收集到的所有wrappedGetters，定义出store的getters属性
  // 从wrappedGetters拿数据，放置到getters中
  forEachValue(wrappedGetters, (fn, key) => {
    // 当调用getter时，从store中的_vm（vue实例）中，当做不同data获取，相当于_vm.xxx
    Object.defineProperty(store.getters, key, { // 当调用vuex的getter时，转而调用vue的具体属性，借用vue的computed特性
      get: () => store._vm[key], // 动态设置getter的值，当获取getter时，获取computed的值。从这里映射到_vm中
      // 最终使得getter能动态变化，自动获取依赖项变化后值
      enumerable: true // for local getters
    })
    computed[key] = () => fn(store) // 收集每一个getter，当做vue的computed属性，配置到_vm中，承接上一条语句的操作，传入store作为第一个参数
  })

  // 使用vue实例去保存状态树，
  const silent = Vue.config.silent
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      // 这里将收集到的state，各模块的state对象，注入到_vm中，借助其watch功能，前面提到过
      $$state: state
    },
    // 利用computed，使得getter的内容会更具其依赖动态变化，是getter像变量用于，而不是函数，执行一次才获取一次值
    computed // 将起那敏的getter放置在vue的computed配置上，调用时动态运算获取值
  })
  Vue.config.silent = silent

  // 严格模式，则添加state的修改校验，当修改时，store的committing状态必须为false，保证只能通过commit修改state，不能使用其他方式修改
  if (store.strict) {
    enableStrictMode(store)
  }

  // 热操作，时间穿梭功能，实现store的回退功能
  if (oldVm) {
    if (hot) {
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}

// 安装模块，设置提交函数的重载，根据是否设置命名空间，设置参数前缀。将module的配置项注入到store对应对象中收集保存起来。
function installModule(store, rootState, path, module, hot) {
  const isRoot = !path.length // 根据路径数组，判断是否是根模块
  const namespace = store._modules.getNamespace(path) // 带上了层级路径的模块名，形如「a/b/c/d」

  // 将带有命名空间的模块，通过modulesNamespaceMap变量保存，以便在辅助函数createNamespacedHelpers中快速定位到带命名空间的模块
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module
  }

  // 递归循环将各层级的state对象设置到vue的数据响应机制中 // 生成state状态树
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1)) // 获取父级的state
    const moduleName = path[path.length - 1] // 获取当前模块名
    // _withCommit是起到锁的作用，在执行这段操作时，将Committing状态设置为true，在此期间内任何修改state的操作都是非法的
    store._withCommit(() => { // 将子模块的state挂载在父模块的state属性中，所以多层级的嵌套state应该为this.$state.moduleA.state.moduleB
      // 由于是往父State中添加key为模块名的模块，所以模块名与父本身的state中属性同名时，原state中的同名属性将被覆盖!!!
      Vue.set(parentState, moduleName, module.state) // 向响应式对象中添加一个属性，
    })
  }

  // 为模块创建一个context对象，相当于开始解析配置文件中的commit，dispatch，getters，state等
  // 其实如果有设置命名空间，则往commit的名字前面添加前缀
  // 由于commit，dispatch是入口函数，所以在入口时，对type进行命名空间前缀的判断及添加
  // 这个localContent中的commit，dispatch只是为了helper中便捷使用，当然，也可以通过module.children取得具体的module，在调用它的dispatch
  const local = module.context = makeLocalContext(store, namespace, path)
  // local.dispatch是经过命名空间前缀处理后的函数

  // 注册实际的回调函数， 注册模块中的每一个Mutation，mutation具体的函数，key是对应的函数名
  // 往刚生成的module.context中注册Mutation
  module.forEachMutation((mutation, key) => { // 为每一个mutation都执行一遍这个方法
    const namespacedType = namespace + key // 添加了文件名前缀的mutation函数名，当没有设置namespaced时，空间名为空字符串。即统一了流程
    registerMutation(store, namespacedType, mutation, local)
  })

  // 注册模块中的每一个Action
  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  // 注册模块中的每一个Getter
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  // 递归安装子模块
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

// 相当于开始解析配置文件中的commit，dispatch，getters，state等
// 其实就是根据是否有namespace命名空间，决定是否对传入的参数进行调整，有命名空间，则设置调用的action名需要加上路径前缀
function makeLocalContext(store, namespace, path) {
  const noNamespace = namespace === ''

  // 其实就是根据是否有namespace命名空间，决定是否对传入的参数进行调整，有命名空间，则设置调用的action名需要加上路径前缀
  const local = {
    // 如果有命名空间，则可以多传一个_options参数，该对象只要一个内容root，设置是否向全局发送信息
    dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options) // dispatch函数的参数
      const { payload, options } = args
      let { type } = args

      // 如果不是向全局发送的dispatch
      if (!options || !options.root) {
        // 向全局发送，则重置类型名为 /a/b/c/d/type
        type = namespace + type // 调用本命名空间内的dispatch函数，为了防止命名冲突
        if (process.env.NODE_ENV !== 'production' && !store._actions[type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
          return
        }
      }
      // 根据命名空间是否存在，整理并返回属于本模块的dispatch函数。使用根函数或者使用命名空间中的。如果使用命名空间中的，则无所谓root配置。
      return store.dispatch(type, payload)
    },

    // 同样，指定本模块的commit函数
    commit: noNamespace ? store.commit : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (process.env.NODE_ENV !== 'production' && !store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }

      store.commit(type, payload, options)
    }
  }

  // 定义对应的get方法，在调用该属性时，动态执行钩子函数
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        // 每次调用getter都将变量vuex.getter
        // 当调用具体模块的getter时，实际上是从vuex.state中赛选获取。实现了具体模块的state与vuex.state的映射
        // local.getter=>store.getter(带上命名空间前缀的)
        : () => makeLocalGetters(store, namespace)
    },
    // state则比较简单，只是单纯地递归遍历
    // 因为使用state时，是通过点操作符「.」的层级变量，即其本身就维护有层级数据结构，不像getter等，没有层级，只能通过路径符「/」解析获取，形如 getters['account/isAdmin']
    // 所以不需要特殊处理
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

// 获取本模块的getter，其实所做的操作就是往getter函数前面添加前缀，当调用某特定模块的getter时，实际调用的是根模块的getter，但getter名是带上前缀的
function makeLocalGetters(store, namespace) {
  const gettersProxy = {}

  // 判断getters的属性是否正确携带namespace前缀
  const splitPos = namespace.length
  // 遍历this的所有getters，找到符合命名空间前缀的名字的所有getter
  Object.keys(store.getters).forEach(type => {
    if (type.slice(0, splitPos) !== namespace) { // 如果命名空间名本身有错
      return
    }

    // 获取每一个具体的getter名
    const localType = type.slice(splitPos)

    // 生成一个getter代理，当获取具体的getter项时，动态返回对应的getter函数
    // 这里不仅仅起到映射的作用，还起到延迟执行的作用，只有在实际获取值是，才调用store.getters[type]的方法，而不是在定义映射时就已经计算好结果
    Object.defineProperty(gettersProxy, localType, {
      get: () => store.getters[type], // 动态获取值，不能写死。因为getter的内容是响应的
      enumerable: true
    })
  })

  // 返回一个对象，这个对象的每个属性都进行了get拦截，// 当调用具体的getter时，实际上还是调用store的getter，只是加上了命名空间前缀
  return gettersProxy
}

// 注册Mutation函数，type是加上了命名空间前缀的回调函数名，handler具体的操作函数
// 全部的Mutation函数都放在了实例的_mutations属性中
function registerMutation(store, type, handler, local) {
  // 创建_mutation属性，并往_mutations属性中添加具体的mutation回调函数
  const entry = store._mutations[type] || (store._mutations[type] = []) // 将某mutation类型设置为一个数组，实现多同名mutation回调问题
  // 向vuex实例的_mutations数组中，插入回调函数，即接受订阅者函数
  entry.push(function wrappedMutationHandler(payload) { // 因为mutation只进行state的修改操作，所以这里只需传入本模块的state内容
    // payload只有一个占位符，传入多参数，需要使用对象的数据结构
    handler.call(store, local.state, payload) // 调用回调函数，且将this指针指向vuex实例，载入mutation的参数
  })
}

// 全部的Action函数都放在了实例的_action属性中
function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []) // 同样解决多个action同名问题
  entry.push(function wrappedActionHandler(payload, cb) { // action是主要的数据逻辑操作部分
    let res = handler.call(store, { // 因为在action中，还可能进行下一次的action或者mutation操作，所以传入dispatch和commit
      dispatch: local.dispatch, // local.dispatch是经过命名空间前缀处理后的函数
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      rootGetters: store.getters, // 传入根模块的内容
      rootState: store.state
    }, payload, cb)
    if (!isPromise(res)) { // 将action的回调强制转化为promise对象
      res = Promise.resolve(res)
    }
    if (store._devtoolHook) { // 调试工具的适配
      return res.catch(err => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      return res
    }
  })
}

// 注册Getter，因为getter是数据数据类的，不是函数，所有不能重复定义
// 之前已经做了命名空间前缀的判断添加操作，前面的操作属于入口的处理，这里是真正定义，并通过变量全局保存
// 这里只是将getter都放置在_wrappedGetters中保存，
function registerGetter(store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) { // getters与state类似，属于独一份的数据，这里判断是否进行了重复定义
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }

  // 向全局getter数组中放入特定的getter函数，并将本地与根的state，getter传入该回调中
  store._wrappedGetters[type] = function wrappedGetter(store) {
    return rawGetter( // rawGetter是getter的回调函数，下面的为该函数输入特定的参数
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  }
}

// 严格模式，则添加state的修改校验，当修改时，store的committing状态必须为false，保证只能通过commit修改state，不能使用其他方式修改
function enableStrictMode(store) {

  // 利用vue的watch属性，监听state的变化
  store._vm.$watch(function () { return this._data.$$state }, () => {
    if (process.env.NODE_ENV !== 'production') {
      assert(store._committing, `do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, sync: true })
}

// 与模块树类型，获取根模块中获取某模块的state属性
function getNestedState(state, path) {
  return path.length
    ? path.reduce((state, key) => state[key], state)
    : state
}

// 统一对象风格，兼容使用dispatch的两种传参方式
function unifyObjectStyle(type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload // options，分发时的配置文件，options 里可以有 root: true，它允许在命名空间模块里分发根的 action
    payload = type // payload，分发该action时携带的参数
    type = type.type // 分发的action的名字
  }

  // 断言action名，是否为字符串
  if (process.env.NODE_ENV !== 'production') {
    assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
  }

  return { type, payload, options }
}







// vue插件安装函数，在Vue.use时，将调用该方法
export function install(_Vue) {
  if (Vue && _Vue === Vue) {
    // 当执行环境不是production时(非生产环境)，在控制台中重复安装的报错。
    if (process.env.NODE_ENV !== 'production') { // process.env.NODE_ENV变量，在Vue执行build命令时，往全局导入
      console.error('[vuex] already installed. Vue.use(Vuex) should be called only once.')
    }
    return
  }
  Vue = _Vue // 用本地的变量保存外部传入的Vue类
  applyMixin(Vue) // 向vue的各个组件中注入Vuex实例，共享一个$store变量
}

























































