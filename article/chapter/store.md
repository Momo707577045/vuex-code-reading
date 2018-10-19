# Store对象的创建
*上一章，我们介绍了Vuex组件的安装过程，安装的最后，进行了对Store对象的引用（或对Store的创建）。本章将介绍Store（Vuex存贮类）的创建。*

## 创建语句索引
- 创建Vuex的语句为```new Vuex.Store({...})```。
- Vuex的入口文件为index.js，Store是index.js导出的Store类。
- Store类是store.js中定义的，所以打开store.js文件，并找到Store的构造函数constructor。

## Store的构造函数constructor
- 【判断vuex是否已经被注入】兼容Vue组件的[另一种注入方法](https://cn.vuejs.org/v2/guide/plugins.html#%E4%BD%BF%E7%94%A8%E6%8F%92%E4%BB%B6)，即将vue挂载在window对象上。自动检测window.Vue，如果有挂载，而且没有被注册过。则调用注册方法。

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-001.png)

- 【一些断言】断言是否被注册，断言是否支持promise，断言类有没有被正确的实例化。这些断言语句，在vue build出来以后。报错信息会被忽略掉。

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-002.png)

  - 在webpack配置中，npm build时，会将 process.env.NODE_ENV 设置为true
  - 例如，我们找到使用Vue-cli 产生的 webpack配置的 Vue 项目，找到 /build/webpack.prod.conf.js 文件

   ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-006.png)

  - 我们可以看到 const env = require('../config/prod.env')，即 env = { NODE_ENV: '"production"' }
  - 然后再通过 webpack.DefinePlugin({ 'process.env': env }), 将 env 变量注入到前端环境的变量中去
  - 从而将node中的变量（后端变量），注入到前端环境中。webpack.DefinePlugin的详细介绍[参考这里](https://segmentfault.com/a/1190000011530718)



- 各项数据容器的定义，部分重要容器，我们在[第0章](https://segmentfault.com/a/1190000016692344)中详细介绍过，（不理解的同学，可回头细读）

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-003.png)

  - ```this._committing = false``` // 提交状态标识，在严格模式时，防止非commit操作下，state被修改
  - ```this._actions = Object.create(null)``` // action 函数的数组的对象，保存所有action回调函数，
    - // 从null中创建对象，Object.create(null)没有继承任何原型方法，也就是说它的原型链没有上一层。从而定义纯粹的对象
  - ```this._mutations = Object.create(null)``` // mutation 函数的数组的对象，保存所有的mutations回调函数，
  - ```this._subscribers = []``` // 订阅  mutation 操作的函数数组。里面的每个函数，将在 commit 执行完成后被调用，该功能常用于插件，与主功能无关
  - ```this._actionSubscribers = []``` // 订阅 action 操作的函数数组。里面的每个函数，将在 action函数被调用前被调用，该功能常用于插件，与主功能无关
  - ```this._wrappedGetters = Object.create(null)``` // 保存 getter 函数的函数数组对象容器。
  - ```this._modules = new ModuleCollection(options)``` // 解析并生成模块树，通过树结构，保存配置文件内容
  - ```this._modulesNamespaceMap = Object.create(null)``` // 保存命名空间的模块对象，以便在辅助函数createNamespacedHelpers中快速定位到带命名空间的模块
  - ```this._watcherVM = new Vue()```  // 定义一个Vue对象，Vue类在调用Vuex安装函数，[install](https://segmentfault.com/a/1190000016692486#articleHeader1)时，被传递进来


- ModuleCollection方法内部较为复杂，我们在[这里介绍]()（为了更好地理解程序逻辑，请按顺序观看，看完具体内容再往下看呦~）
- 获取 dispatch函数 与 commit函数，并复写该函数

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-004.png)

  - 复写的作用，是将两个函数的 this 绑定到 Vuex 实例本身。防止 this 的指向被修改。
  - 因为这两个函数，可以通过 mapMutations 和 mapActions 辅助函数转化为 Vue 中的普通函数，这时 this 将指向 Vue 组件，而不是 Vuex 实例。所以在这里先将this锁定好。map辅助函数具体逻辑将在后续介绍，[Map的使用例子](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E6%8F%90%E4%BA%A4-mutation)
  - 两个函数暂时还没使用到，暂不进行介绍


- 获取根模块的 state 变量索引， const state = this._modules.root.state
- installModule，安装根模块（设置 commit , dispatch 函数的重载 : 根据是否设置命名空间，设置参数前缀。将 getter，commit，action 放到对应容器中保存起来。详情[看这里]()
- resetStoreVM，借助 Vue 的 watch 功能和 computed 功能，实现数据的响应式。详情[看这里]()
- Vuex 插件注册，有插件，则调用插件的函数，与主功能无关
- 最后是Vue调试工具的相关处理，与主功能无关

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/store-005.png)

- 至此为止，Store对象的创建过程，也是Vuex的创建过程，已经全部介绍完了，对整体数据结构有了大概了解。

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/017.jpeg)

- 紧接着将[根据 Vuex 官方文档，针对 Vuex 在使用做的逻辑进行一一介绍]()。

## 带注释源码，[戳这里](https://github.com/Momo707577045/Vuex-code-reading)

*文章持续输出中，源码注释还未完全整理，纯当阅读笔记，大神请勿较真*

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/019.jpg)


## 我又不要脸地来骗赞了
![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/010.jpeg)


## 创建模块树 new ModuleCollection(options)
### 构造函数

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-001.png)

- 形参rawRootModule，在Store中new ModuleCollection(options)传入，而options是Store的构造函数参数，即我们在生成Store实例，调用```new Vuex.Store({...})```时传入的参数，如

  ```
  {
    state,
    getters,
    actions,
    mutations,
  }
  ```
- 形参名为rawRootModule，顾名思义，是将配置文件作为「原始根模块」
- 构造函数调用的是register函数，即构造函数的作用是注册根模块

### 注册函数，register



- 参数解析，path, rawModule, runtime = true
  - path是被注册模块的层级关系数组，保存当前模块及各个祖先模块名字，如\[a,b,c,当前模块]，则对应配置为{modules:a{modules:{b:modules:{c:modules:{当前模块}}}}}}
  - rawModule是模块的配置参数，即在定义模块时，开发者定义的模块配置内容，如模块的state，getters，actions等等
  - runtime表示是否是运行状态，在运行状态下，不能进行某些特定操作
- 【assertRawModule】

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-002.png)

  - 对模块的配置信息进行断言
  - 判断了getters，mutations，actions等配置项的数据类型是否正确。不正确则抛出异常

- 创建模块对象 const newModule = new Module(rawModule, runtime)，找到module.js文件找到其构造函数。

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-007.png)

  - 构造函数参数
    - rawModule 是模块的配置信息对象，即在定义模块时，开发者定义的模块配置内容，如模块的state，getters，actions等等
    - runtime表示是否是运行状态，在运行状态下，不能进行某些特定操作
  - 具体操作，
    - const rawState = rawModule.state 从配置参数中，获取了state数据
    - this._children = Object.create(null) 定义了子模块对象容器。Object.create(null)是为定义一个纯粹的对象
    - this._rawModule = rawModule 保存配置参数本身
    - this.state = (typeof rawState === 'function' ? rawState() : rawState) || {} 解析state，可以是函数，运用工厂模式产生配置对象
- 通过 path 数组判断当前模块是否为根模块

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-003.png)


  - 如果是根模块，则通过变量 this.root 保存
  - 不是根模块，则通过 get方法 获取父模块对象
    - get方法传入的是路径数组，slice(0, -1) 是为了去除本模块名，保留所有祖先模块的路径，从而获取父模块
    - get函数内部，使用了数组的[reduce方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/reduce)，

     ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-004.png)


      - reduce函数有两个参数，第一个是回调函数，第二个是初始值
      - 回调参数，参数一是该函数上一次的执行结果（即return值）或者reduce函数的第二参数设置的初始值。参数二，是被顺序调用的数组中的元素
      - 该函数循环地对数组中的每个元素进行函数处理，并将运行结果当做参数给下一次执行做参数
      - reduce函数的第二个参数，初始值是this.root，是前面保存起来的，根模块配置
      - reduce内部执行的操作是module.getChild(key)
      - getChild调用的是模块对象（Module）中的 getChill 函数，返回模块的 _children 子模块容器的特定子模块

     ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-005.png)


      - 整合而言，get的作用，是从根模块出发，根据给出的path数组，循环寻找子模块对象，
      - 由于调用时，去除了本层次，所以获取得的是本模块的父模块
    - 调用父模块的addChild方法，path\[path.length - 1]获得的是本模块的名，newModule 是由本模块配置文件生成的模块对象
      - addChild 与 getChild 相对应，是往模块对象的 _children 子模块容器里面，以子模块名（path的元素）为key值，添加子模块
      - 对应了上一步，获取parent的方法

- if (rawModule.modules)，判断模块配置信息中，有没有子模块的配置

  ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/module-006.png)


  - 如果有，则递归调用注册函数register本身
  - 传入的参数一，加上了子模块名的 patn 模块层级数组，rawChildModule是子模块配置文件，runtime是继承而来的运行时标识，暂时还没用上

- 小结
  - 根据上面的步骤，完成了模块的递归注册，通过模块的_children容器保存子模块的链接（以子模块名为key，对应模块对象为value），形成了模块树结构
  - 每个模块对象，包含state，和_rawModule，原配置信息
  - 看完这里记得回到「Store的构造函数」观看后续操作哦

