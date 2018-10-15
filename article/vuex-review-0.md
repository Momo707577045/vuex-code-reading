### 本文目的
- 网上有很多教程，但看过，感觉大多不直观，只是在按顺序地讲述代码。只有当自己真正看完源码，理解源码以后才恍然大悟，哦原来文章是这个意思。
当这时已经失去了文章帮助理解源码，解析的意义
- 本人通过先将数据结构介绍出来，将结论抛出。带着结论看源码的方式，按照程序运行逻辑进行讲解。希望借此方法，能将源码逻辑理清楚。帮助大家理解源码
- 相同通过本文，能让大家对源码有所了解，也希望借此消除大家对源码的恐惧，养成阅读源码的习惯
- 本文讲得比较细，可能略显繁琐，理解能力强的同学，可以选择性跳过
- 带着总体印象去看，逐条进行验证，不用猜猜猜。

### 文件结构介绍


### 文章阅读方式，及流程
- 顺序编写，以程序运行流程讲解
- 内容较为复杂的，则拆分出来讲


### 数据结构总体介绍



# 状态模块树
# state树
# store._actions，保存所有的action函数，有命名空间的，则在函数中添加前缀


### 源码调试方法


### 程序运行流程线路介绍
## 组件安装流程，Vue.use(Vuex)
- 【install(index.js)】
  - 项目的入口文件是「index.js」文件。
  - vue安装插件,通过[Vue.use函数](https://cn.vuejs.org/v2/api/#Vue-use)执行，该函数会调用插件暴露出来的「install」方法，并将vue根组件实例传递进来
  - 「install」方法引用于store.js文件
  - 截图
- 【install(store.js)】
  - 获取vue实例，判断vuex是否已经加载过，并通过变量Vue，保存起来
  - 本函数中，使用函数「applyMixin」,「applyMixin」引用于「store.js」
- 【applyMixin(mixin.js)】
  - 来到这里，才是真正注册组件的函数
  - 获取vue版本，根据不同的vue版本，进行不同的注入操作
    - vue2.0以上的，则在vue的beforeCreate生命钩子中，执行注册函数
    - Vue.mixin({ beforeCreate: vuexInit })
    - 这里是通过mixin混合的方式，而调用者是install中传递进来的根vue实例，所以这里使用的是全局混合
    - 而根据[Vue全局混合](https://cn.vuejs.org/v2/guide/mixins.html#%E5%85%A8%E5%B1%80%E6%B7%B7%E5%85%A5)的定义，后续所有子组件都将同样混合
    - 所有所有子组件，在beforeCreate阶段都将调用vuexInit方法
    - 低于2.0版本做的也是同样的事情，只是当前还没有生命周期钩子，只能将注册代码插入到vue的init方法里面
  - vuexInit方法
    - 获取配置文件，const options = this.$options。
      - 这里的this，是vue实例，因为这个函数是在vue的beforeCreate钩子函数中被调用的。调用者是vue实例，这时this指向的是vue根实例
      - this.$options是在new Vue根实例时，传递进去的参数，[官网详情](https://cn.vuejs.org/v2/api/#vm-options)
      - 获取vuex实例对象，如果是传递的是函数，则调用该函数，原理与vue的data一样，通过工厂模式，当多实例复用时，防止数据相互污染，平时我们单页面应用只保存一个vuex实例，所以一般直接传入vuex对象，函数模式用的比较少[官网详情](https://vuex.vuejs.org/zh/api/#vuex-store-%E6%9E%84%E9%80%A0%E5%99%A8%E9%80%89%E9%A1%B9)
      - 如果没有options.store，证明调用本函数的是vue的组件，不是根vue实例。这时通过options.parent（options.parent是vue的内置变量）找到父组件的索引。通过层级关系找到根vue的$store变量
      并赋值给this.$store，从而让所有vue组件都能通过this.$store找到vuex对象实例。对应[vuex官网的这一段介绍](https://vuex.vuejs.org/zh/guide/state.html#%E5%9C%A8-vue-%E7%BB%84%E4%BB%B6%E4%B8%AD%E8%8E%B7%E5%BE%97-vuex-%E7%8A%B6%E6%80%81)
- 小结
  - 以上实现了vuex的注册，所有vue组件对vuex对象的引用
  - 在「store.js」这个模块中，获取了vue根实例的引用
  - 到此为止，vuex暂时还未和vue有什么深层次的耦合，只是在vue中添加了一个vuex的变量引用而已
- 问题
  - 仅仅是挂载变量，为什么不直接通过vue.prototype.$store = store来挂载变量呢？

## vuex对象的创建 new Vuex.Store({...})
- Store是index.js导出的Store类，Store类是store.js中定义的。找到Store类的构造函数constructor
- 判断vuex是否已经被注入，兼容[另一种注入方法](https://cn.vuejs.org/v2/guide/plugins.html#%E4%BD%BF%E7%94%A8%E6%8F%92%E4%BB%B6)，即将vue挂载在window对象上。自动检测，如果有挂载，而且没有被注册过。则调用注册方法。
- 一些断言，需要依赖promise功能，类有没有被正确的实例化。这些断言语音，在正式环境，vue build出来以后。报错信息会被忽略掉
- 定义各项数据容器，以下变量在后续中将扮演重要的作用
- ModuleCollection方法的调用，这里的方法内部较为复杂，点击这里查看[详情]()
- 获取 dispatch函数 与 commit函数，并复写该函数
  - 复写的作用，是将两个函数的this指针绑定到vuex实例本身。防止this的指向被修改
  - 因为这两个函数，可以通过 mapMutations 和 mapActions 辅助函数转化为 vue 中的普通函数，这时this将指向vue组件，而不是vuex实例。所以在这里先将this锁定好。具体逻辑查看后续辅助函数的介绍
  ，[详情查看例子](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E6%8F%90%E4%BA%A4-mutation)
  - dispatch具体做了什么，里面有些变量，暂时还没介绍到，咱们回头再[查看]()
- 获取获取根模块的state状态 const state = this._modules.root.state
- 安装模块installModule，设置提交函数的重载，根据是否设置命名空间，设置参数前缀。将module的配置项注入到store对应对象中收集保存起来。详情[看这里]()
- 调用resetStoreVM，借助Vue的watch功能和computed功能，实现数据的响应式。详情[看这里]()
- vuex插件注册，有插件，则调用插件的函数
- 最后是Vue调试工具的相关处理，实现时间穿梭的功能
- 至此为止，创建工作全部完成了，也对整体数据结构有了大概了解。紧接着是根据vuex官方文档逐章介绍，一一对应官网的内容


## 首先介绍的是state
- [唯一状态树](https://vuex.vuejs.org/zh/guide/state.html#%E5%8D%95%E4%B8%80%E7%8A%B6%E6%80%81%E6%A0%91)
  - 正如我们前面介绍的，vuex内部通过state变量进行保存的。你可能会疑惑，在构造函数中并没有明确的定义啊。是的，并没有在构造函数中定义。
  - state的定义是通过class的[取值函数getter及存值函数setter](http://es6.ruanyifeng.com/#docs/class#Class-%E7%9A%84%E5%8F%96%E5%80%BC%E5%87%BD%E6%95%B0%EF%BC%88getter%EF%BC%89%E5%92%8C%E5%AD%98%E5%80%BC%E5%87%BD%E6%95%B0%EF%BC%88setter%EF%BC%89)来完成的。
    取值设值函数的功能，和Object.defineProperties函数类似，相当于设置拦截器，当获取值或设置值时，将调用该函数
  - 在vue组件中，调用this.$store.state.count的运行逻辑是
    - this.$store在「mixin.js」的函数「vuexInit」中定义，在组件注册部分介绍过，指向vuex实例，store对象
    - this.$store.state即调用vuex实例，store对象的state属性。这时将触发并调用get取值函数，返回this._vm._data.$$state(这时this指向store对象，因为这是在[类中的this指针](http://es6.ruanyifeng.com/#docs/class#this-%E7%9A%84%E6%8C%87%E5%90%91))
    - 相当于调用this.$store._vm._data.$$state，其中_vm的定义，在resetStoreVM函数中生成，是一个vue实例，_vm._data.$$state，即这个vue实例中，通过data定义的一个$$state变量。
    - 而这个$$state变量指向的是vuex根模块的state变量（this._modules.root.state，在构造函数中有介绍），为什么要这样放在vue中，后续会介绍到
    - 而vuex根模块的state变量，在模块安装函数（installModule）中，通过递归定义，将各个层级的state变量，都通过树结构组织起来，树的根，或者说树状态的索引入口就是这个vuex根模块的state变量。
    - 也就是this.$store._vm._data.$$state。也就是this.$store.state。
  - 所以Vuex 使用单一状态树——是的，用一个对象就包含了全部的应用层级状态
- [在计算属性中使用state](https://vuex.vuejs.org/zh/guide/state.html#%E5%9C%A8-vue-%E7%BB%84%E4%BB%B6%E4%B8%AD%E8%8E%B7%E5%BE%97-vuex-%E7%8A%B6%E6%80%81)
  - 在computed中使用state, return this.$store.state.count
  - 这就是为什么store的state，需要通过vue的data保存$$state。因为要实现数据响应，当state的值发送变化时，需要通知对应的computed函数。
  - 这个功能就要借助vue的数据绑定功能，所以要在data中定义。至于底层原理是什么，请关注后续文章，vue源码解读
- [mapState辅助函数](https://vuex.vuejs.org/zh/guide/state.html#mapstate-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)
  - 先来看看源码，辅助函数的定义在helpers.js文件中。
  - normalizeNamespace函数，所有辅助函数公用，用于适配单纯的map写法和带上命名空间的写法。
    - 当调用createNamespacedHelpers，创建带上命名空间的mapState函数时，将传入null，和用户传入的命名空间前缀，在[module](https://vuex.vuejs.org/zh/guide/modules.html#%E5%B8%A6%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4%E7%9A%84%E7%BB%91%E5%AE%9A%E5%87%BD%E6%95%B0)中有介绍
    - 这时，适配携带命名空间和没有命名空间的情况，我们先介绍没有的情况
  - 回调函数参数介绍，namespace是命名空间前缀，states是在调用mapState时，用户传递的内容，可以一个是包含函数，或者键值对的对象，或者一个单纯的key数组
  - 定义一个对象res
  - normalizeMap函数，同样所有辅助函数公用，用于兼容数组写法和对象写法。
    - 将内容均解析为key，val对象，例如
    - normalizeMap(\[a, b, c]) => \[ { key: a, val: a }, { key: b, val: b }, { key: c, val: c } ]
    - normalizeMap({a: 1, b: 2, c: 3}) => \[ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
  - 对返回的每个key,val对象，调用回调函数。往res对象中，添加名为上面生成的key的函数
    - 找到state和getters，并判断是否设置命名空间，返回不同的值。有命名空间则通过  getModuleByNamespace 函数返回，
      - 拿到具体模块内部的context变量中的state和getters（实际上也是this.$store.state中的内容，只是添加了命名空间前缀）
    - 兼容函数写法和对象或数组写法，数组或对象，则直接返回值。函数则返回一个绑定了this的函数，并出入state和getters，对应[官网](https://vuex.vuejs.org/zh/guide/state.html#mapstate-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)
    其实官网的介绍了，缺了对参数二getters的介绍，其实如果传入函数时，函数可以接受第二个参数，getter，
  - res\[key].vuex = true  // 函数标识符，开发中没什么用，在调试工具中使用的
- [对象展开符](https://vuex.vuejs.org/zh/guide/state.html#%E5%AF%B9%E8%B1%A1%E5%B1%95%E5%BC%80%E8%BF%90%E7%AE%97%E7%AC%A6)
  - 由于返回的是一个res对象，所以可以通过[对象展开运算符](http://es6.ruanyifeng.com/#docs/object#%E6%89%A9%E5%B1%95%E8%BF%90%E7%AE%97%E7%AC%A6)，展开每一个对象属性
  - 由于res对象的属性都是一个个函数，所以用在computed中定义计算属性，而不是放在data中定义

## 接着介绍的是[getter](https://vuex.vuejs.org/zh/guide/getters.html#getter)
- 通过[store 的计算属性](https://vuex.vuejs.org/zh/guide/getters.html#getter)，例如，this.$store.getters.doneTodosCount
  - this.$store.getters，即vuex实例的store对象的getters属性，坑爹的是，getters也不是在构造函数中定义的。getters在resetStoreVM中定于的。
  - 通过Object.defineProperty函数，为getters的属性定义拦截器，返回store._vm\[key]
  - 而store._vm\[key]，即调用store内部的vue组件的属性，对应的属性，通过了computed，计算属性去定义，计算属性的函数即为getter函数本身
  - 所以官网介绍「Vuex 允许我们在 store 中定义“getter”（可以认为是 store 的计算属性）」，其实本身就是计算属性，所以才能将计算结果缓存起来
- 通过[属性访问](https://vuex.vuejs.org/zh/guide/getters.html#%E9%80%9A%E8%BF%87%E5%B1%9E%E6%80%A7%E8%AE%BF%E9%97%AE)，例如，this.$store.getters.doneTodosCount
  - 正如刚刚说的，是在computed定义，当然可以通过对象的方式访问。就好比我们在vue中在computed定义属性，在函数中引用
- 通过[方法访问](https://vuex.vuejs.org/zh/guide/getters.html#%E9%80%9A%E8%BF%87%E6%96%B9%E6%B3%95%E8%AE%BF%E9%97%AE)，例如，this.$store.getters.getTodoById(2)
  - 即在函数中，返回函数，没有好讲的
- [mapGetters 辅助函数](https://vuex.vuejs.org/zh/guide/getters.html#mapgetters-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)
  - 大体方法和mapsState类似，同样是同命名空间进行了一些兼容，再同全局getter容器中返回this.$store.getters

## [Mutation](https://vuex.vuejs.org/zh/guide/mutations.html)
- 示例，store.commit('increment')运行流程
  - 官网中的store，是直接使用vuex示例，放在vue组件中，是通过this.$store访问
  - commit的定义在store的构造函数中，commit函数是绑定了this为store的函数，为什么需要绑定，后续会介绍到
  - 调用commit函数时，
    - 从_mutations容器中，获取与commit提交的mutation函数同名的数组，即保存同名函数的数组
    - 调用_withCommit，执行commit时，将状态设置为committing。通过committing标示符，使得其他修改state的都是非法操作
    - 对数组中的每一个函数进行调用，并传入负载参数，对应官网[提交载荷（Payload）](https://vuex.vuejs.org/zh/guide/mutations.html#%E6%8F%90%E4%BA%A4%E8%BD%BD%E8%8D%B7%EF%BC%88payload%EF%BC%89)
      - 为什么在定义mutation中，还有一个state变量呢?
      - 这因为在注册Mutation函数函数时（registerMutation函数），已经通过call函数，local.state放入了函数的第一个参数中。
    - this._subscribers是在插件中使用的，对每个commit函数的进行监听，订阅 store 的 mutation。handler 会在每个 mutation 完成后调用，该功能常用于插件
- [对象风格的提交方式](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%AF%B9%E8%B1%A1%E9%A3%8E%E6%A0%BC%E7%9A%84%E6%8F%90%E4%BA%A4%E6%96%B9%E5%BC%8F)
  - 这个特性是在commit函数第一句被设置的，通过unifyObjectStyle函数兼容对象写法和负载参数写法
  - unifyObjectStyle函数的原理就是，判断参数是否为对象，是对象则进行解析，并调整参数位置
- [Mutation 需遵守 Vue 的响应规则](https://vuex.vuejs.org/zh/guide/mutations.html#mutation-%E9%9C%80%E9%81%B5%E5%AE%88-vue-%E7%9A%84%E5%93%8D%E5%BA%94%E8%A7%84%E5%88%99)
  - 其实这个跟mutation没什么直接关系，只是说当mutation中使用到state的某属性时，需要提前在state中定义，而不是中往state插入元素，即使插入，也需要通过vue.set插入
  - 因为store内部，也是通过vue的date来保存state的。既然想要响应式。自然是需要遵循vue的规则
- 使用常量替代 Mutation 事件类型，这是代码风格问题，与逻辑无关
- [Mutation 必须是同步函数](https://vuex.vuejs.org/zh/guide/mutations.html#mutation-%E5%BF%85%E9%A1%BB%E6%98%AF%E5%90%8C%E6%AD%A5%E5%87%BD%E6%95%B0)
  - 这里说必须是同步函数，只是在于devtools不能捕获而已，实际上代码是可以运行的。但最好还是不要这么做，遵循规范，异步函数通过action执行
- [在组件中提交 Mutation](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E6%8F%90%E4%BA%A4-mutation)
  - 大体方法和mapsState类似，同样是同命名空间进行了一些兼容，再同全局_mutation容器中返回，没什么好讲的


## action
- [函数参数](https://vuex.vuejs.org/zh/guide/actions.html#action)
  - 定义action时，可以传入[很多参数](https://vuex.vuejs.org/zh/api/#actions)。这些参数是从哪里来的呢？
  - 扎到registerAction函数，是在注册Action的时候传递进入的
- 我们来看看dispatch函数做了什么
  - 和commit一样，兼容参数类似写法
  - 从_actions中获取同名函数数组
  - 与一样，监听action的执行，_actionSubscribers。一般在插件中使用
  - 最后，通过Promise.all调用数组中的所有函数，则也是为什么在注册Vuex时，会对Promise进行有效性校验


## module
- [](https://vuex.vuejs.org/zh/guide/modules.html)
- 经过前面这么多的讲解，应该对module不陌生了吧。本身vuex很简单的，就是加上了模块化，加上了命名空间，加上了一堆适配的代码。严重增加了代码复杂度。


## 其他
- 后面的都没啥了，跟核心代码没太大关系
- 对了严格模式就是通过_withCommitting来判断的，非通过commit的方式修改state将报错
















## 创建模块树 new ModuleCollection(options)
# 构造函数
- 状态模块树在「module-collection.js」中定义
- 状态模块树是指，以各个状态对象为节点，以树结构组合而成的变量
- 构造函数获取的参数是，初始化store对象时，传入的vuex配置对象。例如
```
{
  state,
  getters,
  actions,
  mutations,
  plugins: process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
}
```
- 通过源码可以看到，传递的配置对象，在构造函数中，通过形参rawRootModule来保存，即将导入的整个对象。当做vuex的根模块对象
- 构造函数调用的是register函数，即构造函数的作用是注册根模块

# 注册函数
- 参数解析，path, rawModule, runtime = true
  - path是被注册模块的层级关系数组，即当前模块，有多少个模块，path保存的是祖先模块的名字，通过路径名来体现
  - rawModule是模块的配置文件，即在定义模块时，开发者定义的模块配置内容，如模块的state，getters，actions等等
  - runtime表示是否是运行状态，在运行状态下，不能进行某些特定操作
- assertRawModule
  - 操作前先断言模块，配置配置信息的数据类型是否正确
  - 里面判断了getters，mutations，actions等配置项，数据类型是否正确。不正确则抛出异常
  - 这部分代码比较简单，暂不接受Momo
- const newModule = new Module(rawModule, runtime)
  - 根据配置文件，生成具体模块对象。
  - new Module(rawModule, runtime)方法的调用，这里的方法内部较为复杂，点击这里查看[详情]()
  - 返回一个对象，数据结构如下
- 通过path判断是否为根模块
  - 如果是根模块，则通过变量this.root保存
  - 不是根模块，则通过get方法获取父模块对象
    - get方法传入的是路径数组，slice(0, -1)是去除本级所在路径，从而保留所有祖先模块的路径
    - get函数内部，使用了数组的[reduce函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/reduce)，
      - reduce函数有两个参数，第一个是回调函数，第二个是初始值
      - 回调参数有，参数一是该函数上一次的执行结果或者reduce函数的第二参数设置的初始值，即return值。参数二是，被调用的数组的某个元素
      - 该函即循环对数组中的每个元素进行函数处理，并将运行结果当做参数给下一次执行做参数
      - reduce函数的第二个参数，初始值是this.root，是前面保存起来的，根模块
      - reduce内部执行的操作是module.getChild(key)
      - getChild调用的是模块对象中的getChill函数，返回模块的_children子模块容器的特定子模块
    - 整合而言，get的作用，是从根模块出发，根据给出的path数组，循环寻找子模块对象，
    - 由于调用时，去除了本层次，所以获取得的是本模块的父模块
    - 调用父模块的addChild方法，path[path.length - 1]获得的是本模块的名，newModule是由本模块配置文件生成的模块对象
      - addChild与getChild相对，是往模块对象的_children子模块容器里面，以子模块名（path的元素）为key值，添加子模块
      - 对应了上一步，获取parent的方法
- if (rawModule.modules)，判断路由配置对象中，有没有子模块的配置
  - 如果有，则递归调用注册函数register本身
  - 传入的参数一，是加上了本层模块名的路径层级，rawChildModule是子模块配置文件，runtime是继承而来的运行时标识，暂时还没用上
- 小结
  - 由此，完成了模块的递归注册，通过模块的_children容器保存子模块的链接（以子模块名为key，对应模块对象为value），形成了模块树结构
  - 每个模块对象，包含state，和_rawModule，原配置信息





  - 因为这个注册函数是复用的，所以模块的注册都会调用该函数，所以需要判断是否为根模块

# dispatch函数介绍
- 参数介绍
  - _type 是调用的mutation函数名，payload是负载参数
- unifyObjectStyle函数
  - 是为了统一对象风格，兼容dispatch和commit的两种传参风格
  - 对应[官方教材](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%AF%B9%E8%B1%A1%E9%A3%8E%E6%A0%BC%E7%9A%84%E6%8F%90%E4%BA%A4%E6%96%B9%E5%BC%8F)





## 创建具体模块对象 new Module(rawModule, runtime)
# 构造函数
- 参数解析，
  - rawModule是模块的配置文件，即在定义模块时，开发者定义的模块配置内容，如模块的state，getters，actions等等
  - runtime表示是否是运行状态，在运行状态下，不能进行某些特定操作
- 构造函数，
  - 从配置参数中，获取了state数据
  - 定义了子模块对象容器。Object.create(null)是为定义一个纯粹的对象
  - 保存配置参数本身
  - 解析state，可以是函数，运用工厂模式产生配置对象


## installModule
- 参数介绍
  - store,  vuex实例
  - rootState, 根模块的state对象
  - path,  当前模块的层级关系
  - module, 模块内容
  - hot, ？？？
- 判断当前模块是否根模块
- 获取模块的命名空间
  - 调用状态模块树的 getNamespace 方法，传入当前模块的层级路径
  - getNamespace 和之前提到的 get 方法类似，同样是从根模块出发，更具给出的路径数组，递归每一个层级的模块
  - 在每一个模块中，判断配置对象有没有设置命名[空间变量namespaced](https://vuex.vuejs.org/zh/guide/modules.html#%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)
  - 有命名空间，则以模块名结合"/"，形成命名空间路径，即本函数是获取模块的命名空间
- 如果模块设置了命名空间，则将本模块存入当模块命名容器对象_modulesNamespaceMap中，以命名空间路径名为key
- 对非根容器的处理
  - 通过getNestedState，寻找父模块的state对象，
    - getNestedState参数介绍，rootState是根容器的state，path.slice(0, -1)是除去本模块后的模块层级数组
    - 与get函数 getNamespace函数类型，从state中根据path层级数组，每层递归寻找，找到对应的state
    - 在这里找的是父模块的state对象
    - 从这个操作，我们可以猜到，state也将和module模块树一样，通过state形成一个state树，其树结构和module结构相对应
  - 调用vuex的_withCommit函数
    - 该函数的操作很简单，只是将设置_committing标识符为ture，然后执行某函数，函数执行完在将_committing设置为原来的值
    - 即保证在执行某函数的过程中，_committing设置为ture。类似防止函数执行过程中，某特定操作被执行
  - 在_withCommit函数中，
    - 借用Vue实例（该实例在第一步，Vuex注入的时候被保存）。调用Vue的[set函数](https://cn.vuejs.org/v2/api/#Vue-set)
    - 即往父State（这个对象）中添加，key为模块名，value为具体模块对象的变量
    - 借用Vue.set，实现数据绑定，
    - 注意，由于是直接往父模块的State中添加变量，当父模块的state中有与插入的模块同名的变量时，原变量将被覆盖
  - 结合  Vue.set(parentState, moduleName, module.state) 及 getNestedState函数，我们可以确定state也将和module模块树一样，通过state形成一个state树，其树结构和module结构相对应
- 创建模块内容，makeLocalContext(store, namespace, path)。并将生成的content内容，赋值到之前生成过的模块对象module中，通过变量名context保存。makeLocalContext[详情看这里]()
  - 模块内容，返回命名空间前缀处理后的getters，state，commit，dispatch方法
- 调用module.forEachMutation方法，对模块的mutation进行注册
  - forEachMutation方法，从模块对象的 _rawModule遍历（即开发者定义的模块配置文件）中，获取 mutations 方法，并进行遍历
  - registerMutation注册函数
    - 参数介绍，store是vuex实例, type是mutation函数名, handler是mutation的函数体，即实际执行的函数, local是刚刚生成的模块的local对象
    - store._mutations[type]，以mutation函数名为key，在vuex根实例的_mutations容器对象中，添数组容器。存放所有同名的mutation函数
    - 所以mutation是不怕重名的，重名将逐个执行调用。这个在官网中没有做介绍
    - 往mutation函数数组中加入一个函数，函数的参数就是我们在使用commit时的第二个参数该函数内部
    - 在函数内部，是修改this，并多传递一个参数以后，调用的函数，这也是为什么我们在commit的时候只传递了负载参数，但在实际执行mutation的时候有多个参数
    - 中的来说，是收集配置函数中的mutation函数，统一通过vuex实例的_mutations变量保存
- 调用module.forEachAction方法，对模块的action进行注册
  - 注册action的操作和注册Mutation的操作大体相同，同样是通过一个变量收集所有模块的action函数
  - 只是注册action时，多传递了参数
- 调用registerGetter，注册每一个getter方法，通过_wrappedGetters收集
- 调用registerGetter，注册每一个getter方法，通过_wrappedGetters收集
- 最后是循环注册所有模块
- 小结
  - 总的来说，是手机模块配置文件中的每一个mutation项目，每一个action，每一个getter。往中添加参数

## 创建模块内容，makeLocalContext
- 参数介绍
  - store, vue实例
  - namespace, 模块的命名空间层级路径
  - path，module层级关系
  - 注意，namespace与path并不一样相对，因为命名层级，只有当模块设置有命名空间，才存在对应层级命名
- 定义local对象
  - 定义local对象的dispatch函数
    - 根据本模块及祖先容器是否是设置过命名空间进行判断
    - 没有设置，则直接使用vuex实例的dispatch函数
    - 有命名空间，则在使用vuex实例的dispatch函数前，对参数进行一些处理
    - 统一参数形式，type是action函数名，payload是负载变量，options是配置项
    - 根据options.root判断是否往全局发送的action函数，对应[官网](https://vuex.vuejs.org/zh/guide/modules.html#%E5%9C%A8%E5%B8%A6%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4%E7%9A%84%E6%A8%A1%E5%9D%97%E5%86%85%E8%AE%BF%E9%97%AE%E5%85%A8%E5%B1%80%E5%86%85%E5%AE%B9%EF%BC%88global-assets%EF%BC%89)
    - 如果不是发送全局的action函数，即只发送本模块内的action函数，这是往调用的的action函数名中，添加命名空间路径前缀，对应一开始数据结构定义的那样
    - 最后，调用vuex实例的dispatch函数
  - 定义commit函数
    - 操作步骤和定义local对象的dispatch函数类似
    - 有命名空间，则往mutation函数前添加命名空间前缀
    - 最后也而是调用vuex实例的commit函数
- 调用Object.defineProperties函数，往local对象中添加两个变量getters和state，设置local变量的getter函数和
  - Object.defineProperties函数用于往某对象中添加属性，并设置该数据的访问拦截器，即访问该数据时，将先调用拦截器函数，[详细介绍](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)
  - 定义getters变量，并设置其拦截器。同样的，根据是否设置命名空间
    - 没有，则直接访问vuex实例的getters变量
    - 否则调用makeLocalGetters函数，生成自己的getters
      - 参数介绍，store是vuex实例，namespace是命名空间名
      - 先定义一个对象gettersProxy，
      - 遍历store.getters中的所有函数
        - 检测各个函数名，判断该函数名的前缀是否与本模块的命名空间相同。找到所有相同的getter
        - 去除命名空间前缀，能获取getter函数名
        - 同样，通过Object.defineProperty，往刚刚定义的gettersProxy对象中，添加变量，并设置其get拦截器。enumerable是其中一个配置项目，设置当使用for等枚举循环时，是否显示该变量
        - 将不带命名空间前缀的getter名作为key，当访问它时，返回是，从vuex实例中，getters总容器中提取的带上命名空间前缀的getter函数
        - 所以说，其实所有的getter都存放在了vuex实例的_wrappedGetters变量中，如模块没有命名空间前缀，则直接存入。否则将getter函数名带上命名空间前缀后，再加入进去
      - 小结，
        - makeLocalGetters的作用，是将通过模块拿getter时，如何通过store.getters中取。是否应该添加前缀、
  - 定义state，及其拦截器
    - state的获取，则不需要命名空间前缀的识别，而且直接通过getNestedState，从state树结构中取
    - 这是因为state和getter的存储方式不一样，state是独立的状态树，有明显的层级关系
    - getters则全部都放在vuex实例的getters变量中保存，属于同层级，只是通过函数前缀进行了区分（有设命名空间的话）
    - state是根据层级关系设置，getters则更具命名空间区分，与层级关系不大
- 小结
  - 定义可local变量，有设置命名空间，则往各个函数名中添加命名空间前缀
  - 对应数据结构中，全局容器的介绍就更清晰了，实际操作的函数还是那个函数，这里只是在调用函数前，对参数进行一些调整
  - 设置了getters，state，commit，dispatch方法的中间处理


## resetStoreVM
- 参数介绍，store是vuex实例, state是根模块的state对象，也是state树结构入口, hot是某个标识符
- 定义getters对象，注意，这里个getters变量和手机模块getter的变量_wrappedGetters不同。是定义一个全新变量
- 定于computed变量
- 遍历上一个步骤中找到的所有getter函数，将每一个getter函数中当做store.getters的变量，
  -当访问store.getters的的getter函数时，通过设置get拦截，实际返回的是store._vm的同名函数，store._vm在后续定义
  - 往computed中，加入getter函数，访问getter时，将调用getter函数本身，并将vuex实例传递进去
- 定义store._vm变量，定义为新建的Vue实例。
  - 并在vue实例的data中，通过$$state保存vuex实例本身
  - 并将刚刚定义的computed变量传递进入，当做vue的computed属性。从而实现了getter函数的computed功能。getter 的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。对应[官网的介绍](https://vuex.vuejs.org/zh/guide/getters.html#getter)
- 设置严格模式，enableStrictMode，该函数内部，
  - 通过Vue的watch功能，监听this._data.$$state（与vuex根实例的state变量同一个地址，所以就是监听store.state的变化）
  - 当state发生变化，但_committing为false，即当前非commit操作时。将报错
  - 非commit操作，即直接修改state的值，在严格模式下禁止运行，对应[官网介绍](https://vuex.vuejs.org/zh/guide/strict.html)
- 后续hot是设置热重载功能，本人研究不多，暂不做讲解




### 总结


















































































