### Store对象的创建
*上一章，我们介绍了Vuex组件的安装过程，安装的最后，进行了对Store对象的引用（或对Store的创建）。本章将介绍Store（Vuex的功能类，存贮类）对象的创建*

# 创建语句索引
- 创建Vuex的语句为```new Vuex.Store({...})```,
- Vuex的入口文件为index.js，Store是index.js导出的Store类
- Store类是store.js中定义的，所以打开store.js文件，并找到Store的构造函数constructor

# Store的构造函数constructor
- 【判断vuex是否已经被注入】兼容Vue组件的[另一种注入方法](https://cn.vuejs.org/v2/guide/plugins.html#%E4%BD%BF%E7%94%A8%E6%8F%92%E4%BB%B6)，即将vue挂载在window对象上。自动检测window.Vue，如果有挂载，而且没有被注册过。则调用注册方法。
- 【一些断言】断言是否被注册，断言是否支持promise，断言类有没有被正确的实例化。这些断言语句，在vue build出来以后。报错信息会被忽略掉。
  - 在webpack配置中，npm build时，会将 process.env.NODE_ENV 设置为true
  - 例如，我们找到使用Vue-cli 产生的 webpack配置的 Vue 项目，找到 /build/webpack.prod.conf.js 文件
  - 我们可以看到 const env = require('../config/prod.env')，即 env = { NODE_ENV: '"production"' }
  - 然后再通过 webpack.DefinePlugin({ 'process.env': env }), 将 env 变量注入到前端环境的变量中去
  - 从而将node中的变量（后端变量），注入到前端环境中。webpack.DefinePlugin的详细介绍[参考这里](https://segmentfault.com/a/1190000011530718)
- 各项数据容器的定义，部分重要容器，我们在[第0篇](https://segmentfault.com/a/1190000016692344)中详细介绍过，（不理解的同学，可回头细读）
  - this._committing = false // 提交状态标识，在严格模式时，防止非commit操作下，state被修改
  - this._actions = Object.create(null) // action 函数的数组的对象，保存所有action回调函数，
    - // 从null中创建对象，Object.create(null)没有继承任何原型方法，也就是说它的原型链没有上一层。从而定义纯粹的对象
  - this._mutations = Object.create(null) // mutation 函数的数组的对象，保存所有的mutations回调函数，
  - this._subscribers = \[] // 订阅  mutation 操作的函数数组。里面的每个函数，将在 commit 执行完成后被调用，该功能常用于插件，与主功能无关
  - this._actionSubscribers = [] // 订阅 action 操作的函数数组。里面的每个函数，将在 action函数被调用前被调用，该功能常用于插件，与主功能无关
  - this._wrappedGetters = Object.create(null) // 保存 getter 函数的函数数组对象容器。
  - this._modules = new ModuleCollection(options) // 解析并生成模块树，通过树结构，保存配置文件内容
  - this._modulesNamespaceMap = Object.create(null) // 保存命名空间的模块对象，以便在辅助函数createNamespacedHelpers中快速定位到带命名空间的模块
  - this._watcherVM = new Vue()  // 定义一个Vue对象，Vue类在调用Vuex安装函数，[install](https://segmentfault.com/a/1190000016692486#articleHeader1)时，被传递进来
- ModuleCollection方法内部较为复杂，我们在[这里介绍]()
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

