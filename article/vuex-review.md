

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
















# dispatch函数介绍
- 参数介绍
  - _type 是调用的mutation函数名，payload是负载参数
- unifyObjectStyle函数
  - 是为了统一对象风格，兼容dispatch和commit的两种传参风格
  - 对应[官方教材](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%AF%B9%E8%B1%A1%E9%A3%8E%E6%A0%BC%E7%9A%84%E6%8F%90%E4%BA%A4%E6%96%B9%E5%BC%8F)





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
        - 将不带命名空间前缀的getter名作为key，当访问它时，返回是，从store.getters(即)总容器中提取的带上命名空间前缀的getter函数
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


















































































