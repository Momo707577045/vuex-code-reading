# Vuex 的使用解析
## 回顾前面几章我们介绍的内容
- 第零章对Vuex的整体运行思路，重点变量进行了介绍。
- 第一章介绍了Vuex的安装过程。
- 上一章介绍了Vuex的初始化过程，在正式使用Vuex前做了哪些准备工作。
- 这一章，将对照Vuex的官方说明文档，逐一介绍示例代码背后的运行逻辑。



## 首先介绍的是[state](https://vuex.vuejs.org/zh/guide/state.html)
- [唯一状态树](https://vuex.vuejs.org/zh/guide/state.html#%E5%8D%95%E4%B8%80%E7%8A%B6%E6%80%81%E6%A0%91)
  - 唯一：是指整个Vuex数据存储是由Store这一个对象实例完成的。
  - 状态：是指各个数据。
  - 树：指 module 和 state 的树结构。
  - 通过 Store 变量可以查看当前项目的数据存储情况（作者的用意，可能是将Vuex作为Vue项目的整个数据存储库，将所有数据内容都交由Vuex进行管理），可以通过Store观察整个项目的数据情况。
  - 通过热重载功能，进行数据的回退，实现时间穿梭的调整功能（本系列文章没有介绍到，有兴趣的同学可以看看源码。hot关键字相关内容）。

- [在计算属性中使用state](https://vuex.vuejs.org/zh/guide/state.html#%E5%9C%A8-vue-%E7%BB%84%E4%BB%B6%E4%B8%AD%E8%8E%B7%E5%BE%97-vuex-%E7%8A%B6%E6%80%81)
  *不知你是否会疑惑，在Store的构造函数中并没有定义类的state属性，为什么可以通过store.state获取到state数据呢？*
  - state的定义是通过class的[取值函数getter及存值函数setter](http://es6.ruanyifeng.com/#docs/class#Class-%E7%9A%84%E5%8F%96%E5%80%BC%E5%87%BD%E6%95%B0%EF%BC%88getter%EF%BC%89%E5%92%8C%E5%AD%98%E5%80%BC%E5%87%BD%E6%95%B0%EF%BC%88setter%EF%BC%89)来完成的。取值设值函数的功能，和Object.defineProperties函数类似，相当于设置拦截器，当获取值或设置值时，调用对应函数。

    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-001.png)

  - 在vue组件中，调用this.$store.state.count的运行逻辑是:
    - this.$store在「mixin.js」的函数「vuexInit」中定义，在[Vuex注册部分](https://segmentfault.com/a/1190000016692486#articleHeader4)介绍过，指向Store对象。
     ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-002.png)

    - this.\\$store.state即调用Store对象的state属性。这时将触发并调用get取值函数，返回this._vm._data.\$$state (这时this指向store对象，因为这是在[类中的this指针](http://es6.ruanyifeng.com/#docs/class#this-%E7%9A%84%E6%8C%87%E5%90%91))

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-001.png)

    - 相当于调用this.\\$store._vm._data.\\$\\$state，其中_vm在resetStoreVM函数中定义，是一个Vue实例。_vm._data.\\$\\$state，即这个Vue实例中，通过data定义的一个$$state变量。

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-003.png)

    - 而这个$$state变量指向的是Store对象的state变量（this._modules.root.state，在构造函数中有介绍），为什么要这样放在Vue中，后续会介绍到。
    - 而根模块的state变量，在模块安装函数（installModule）中，通过递归定义，将各个层级的state变量，都通过树结构组织起来，树的根，或者说树状态的索引入口就是这个根模块的state变量。

     ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-004.png)

    - 也就是this.\\$store._vm._data.$$state。也就是this.$store.state。
  - 所以Vuex 使用单一状态树，通过State树结构保存了Vuex中的所有数据

  - 为什么state需要通过Vue的data进行保存？
    - 因为我们看到在使用state时，是放在computed中使用, return this.$store.state.count

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-005.png)

    - 因为要实现数据响应，当state的值发生变化时，需要通知对应的computed函数。
    - 这个功能就要借助vue的数据绑定功能，所以要在data中定义。至于底层原理是什么，请关注后续文章，vue源码解读
  - Vue子组件的注册，是通过minix混合功能来实现，具体原理在[「第一章」](https://segmentfault.com/a/1190000016692486#articleHeader4)中介绍过

- [mapState辅助函数](https://vuex.vuejs.org/zh/guide/state.html#mapstate-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)
  - 先来看看源码，辅助函数的定义在helpers.js文件中。
  - normalizeNamespace函数，所有辅助函数公用，用于适配「单纯的map写法」以及「带上命名空间的写法」。
    - 「单纯的map写法」是指没有设置命名空间前缀，直接索取需要的变量，如

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-007.png)

    - 「带上命名空间的写法」即调用 createNamespacedHelpers 返回带上命名空间前缀的辅助函数。即[官网介绍的这个](https://vuex.vuejs.org/zh/guide/modules.html#%E5%B8%A6%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4%E7%9A%84%E7%BB%91%E5%AE%9A%E5%87%BD%E6%95%B0)

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-008.png)

    - createNamespacedHelpers的内部，是将复制函数的第一个参数填写为null，第二个为命名空间前缀

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-011.png)

    - 而我们看回各辅助函数的定义，是通过normalizeNamespace函数生成的，即相当于往normalizeNamespace函数中，第一个参数填写为null，第二个为命名空间前缀

    - normalizeNamespace函数，是对命名空间前缀的识别和兼容，bind(null)是为了不改变this的指向，让this仍然指向vue组件，参数二是命名空间前缀。这是辅助函数的第一个参数namespace就有了值。
    - 通过bind函数，使得后续传递参数时，后续使用时，从参数的第二个开始填充，此项技术为[偏函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#%E5%81%8F%E5%87%BD%E6%95%B0)
      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-015.png)

    - 通过偏函数，使得在实际使用时，直接传递所需的属性，与「单纯的map写法」统一用法

    - 下面介绍的是没有「单纯的map写法」的流程，「带上命名空间的写法」如此类推
  - 回调函数参数介绍，namespace是命名空间前缀，states是在调用mapState时，用户传递的内容，可以一个是包含函数，或者键值对的对象，或者一个单纯的key数组。

    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-009.png)

  - 定义一个对象res
  - normalizeMap函数，同样所有辅助函数公用，用于兼容数组写法和对象写法。
    - 将内容均解析为key，val对象，例如
    - normalizeMap(\[a, b, c]) => \[ { key: a, val: a }, { key: b, val: b }, { key: c, val: c } ]
    - normalizeMap({a: 1, b: 2, c: 3}) => \[ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
    - 这也为什么能兼容多种传值方式

      ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-007.png)


  - 对返回的每个key,val对象，调用回调函数。往res对象中，添加名为上面生成的key的函数
    - 找到state和getters，并判断是否设置命名空间，返回不同的值。有命名空间则通过  getModuleByNamespace 函数返回，
      - 拿到具体模块内部的context变量中的state和getters（实际上也是this.$store.state中的内容，只是添加了命名空间前缀）
    - 兼容函数写法和对象或数组写法，数组或对象，则直接返回值。函数则返回一个绑定了this的函数，并出入state和getters，对应[官网](https://vuex.vuejs.org/zh/guide/state.html#mapstate-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)，官网的介绍，缺了对参数二getters的介绍，其实如果传入函数时，函数可以接受第二个参数，getter。
  - res\[key].vuex = true  // 函数标识符，开发中没什么用，在调试工具中使用。
- [对象展开符](https://vuex.vuejs.org/zh/guide/state.html#%E5%AF%B9%E8%B1%A1%E5%B1%95%E5%BC%80%E8%BF%90%E7%AE%97%E7%AC%A6)
  - 由于返回的是一个res对象，所以可以通过[对象展开运算符](http://es6.ruanyifeng.com/#docs/object#%E6%89%A9%E5%B1%95%E8%BF%90%E7%AE%97%E7%AC%A6)，展开每一个对象属性。
  - 由于res对象的属性都是一个个函数，所以用在computed中定义计算属性，而不是放在data中定义。

## 接着介绍的是[getter](https://vuex.vuejs.org/zh/guide/getters.html#getter)
- 通过[store 的计算属性](https://vuex.vuejs.org/zh/guide/getters.html#getter)，例如，this.$store.getters.doneTodosCount
  - this.$store.getters，即store对象的getters属性，坑爹的是，getters也不是在构造函数中定义的。getters在resetStoreVM中定义的。

    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-010.png)

  - 通过Object.defineProperty函数，为getters的属性定义拦截器，返回store._vm\[key]
  - 而store._vm\[key]，即调用store内部的vue组件的属性，对应的属性，通过了computed 计算属性去定义，计算属性的函数即为getter函数本身
  - 所以官网介绍「Vuex 允许我们在 store 中定义“getter”（可以认为是 store 的计算属性）」，其实本身就是计算属性，所以才能将计算结果缓存起来。
- 通过[属性访问](https://vuex.vuejs.org/zh/guide/getters.html#%E9%80%9A%E8%BF%87%E5%B1%9E%E6%80%A7%E8%AE%BF%E9%97%AE)，例如，this.$store.getters.doneTodosCount
  - 正如刚刚说的，是在computed定义，当然可以通过对象的方式访问。就好比我们在vue中在computed定义属性，在函数中引用。
- 通过[方法访问](https://vuex.vuejs.org/zh/guide/getters.html#%E9%80%9A%E8%BF%87%E6%96%B9%E6%B3%95%E8%AE%BF%E9%97%AE)，例如，this.$store.getters.getTodoById(2)
  - 即在函数中，返回函数，没有好讲的。
- [mapGetters 辅助函数](https://vuex.vuejs.org/zh/guide/getters.html#mapgetters-%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0)
  - 大体方法和mapsState类似，同样是同命名空间进行了一些兼容，再同全局getter容器中返回this.$store.getters。

## [Mutation](https://vuex.vuejs.org/zh/guide/mutations.html)
- 示例，store.commit('increment')运行流程
  - 官网中的store，是直接使用Store对象，放在vue组件中，则通过this.$store访问。
  - commit的定义在store的构造函数中，commit函数是绑定了this为store的函数，绑定this是为了在辅助函数使用时，this指针不被改变，前介绍过，bind(null)。

    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-011.png)

  - 调用commit函数时，
    - 从_mutations容器中，获取与commit提交的mutation函数同名的数组，即保存同名函数的数组。
    - 调用_withCommit，执行commit时，将状态设置为committing。通过committing标示符，使得其他修改state的都是非法操作。
    - 对数组中的每一个函数进行调用，并传入负载参数，对应官网[提交载荷（Payload）](https://vuex.vuejs.org/zh/guide/mutations.html#%E6%8F%90%E4%BA%A4%E8%BD%BD%E8%8D%B7%EF%BC%88payload%EF%BC%89)。
      - 为什么在定义mutation中，还有一个state变量呢?
      - 这因为在注册Mutation函数函数时（registerMutation函数），已经通过call函数，local.state放入了函数的第一个参数中。
    - this._subscribers是在插件中使用的，对每个commit函数的进行监听，订阅 store 的 mutation。handler 会在每个 mutation 完成后调用，该功能常用于插件。
- [对象风格的提交方式](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%AF%B9%E8%B1%A1%E9%A3%8E%E6%A0%BC%E7%9A%84%E6%8F%90%E4%BA%A4%E6%96%B9%E5%BC%8F)
  - 这个特性是在commit函数第一句被设置的，通过unifyObjectStyle函数兼容对象写法和负载参数写法。
  - unifyObjectStyle函数的原理就是，判断参数是否为对象，是对象则进行解析，并调整参数位置。

    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-012.png)

- [Mutation 需遵守 Vue 的响应规则](https://vuex.vuejs.org/zh/guide/mutations.html#mutation-%E9%9C%80%E9%81%B5%E5%AE%88-vue-%E7%9A%84%E5%93%8D%E5%BA%94%E8%A7%84%E5%88%99)
  - 其实这个跟mutation没什么直接关系，只是说当mutation中使用到state的某属性时，需要提前在state中定义，而不是中往state插入元素，即使插入，也需要通过vue.set插入。
  - 因为store内部，也是通过Vue的date来保存state的。既然想要响应式。自然是需要遵循Vue的规则。
- 使用常量替代 Mutation 事件类型，这是代码风格问题，与逻辑无关。
- [Mutation 必须是同步函数](https://vuex.vuejs.org/zh/guide/mutations.html#mutation-%E5%BF%85%E9%A1%BB%E6%98%AF%E5%90%8C%E6%AD%A5%E5%87%BD%E6%95%B0)
  - 这里说必须是同步函数，只是在于devtools不能捕获而已，实际上代码是可以运行的。但最好还是不要这么做，遵循规范，异步函数通过action执行。
- [在组件中提交 Mutation](https://vuex.vuejs.org/zh/guide/mutations.html#%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E6%8F%90%E4%BA%A4-mutation)
  - 大体方法和mapsState类似，同样是同命名空间进行了一些兼容，再同全局_mutation容器中返回，没什么好讲的。


## action
- [函数参数](https://vuex.vuejs.org/zh/guide/actions.html#action)
  - 定义action时，可以传入[很多参数](https://vuex.vuejs.org/zh/api/#actions)。这些参数是从哪里来的呢？
  - 找到registerAction函数，可以看到是在注册Action的时候传递进入的
    ![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/map-013.png)



## module
- module部分均在介绍模块的配置，属于配置过程，在Vuex的初始化中生效，没有太多的运行逻辑。



### 总结
- 其实本身Vuex很简单的，就是加上了模块化，加上了命名空间，加上了一堆适配的代码。严重增加了代码复杂度。

![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/013.jpg)


### 工作繁忙，断断续续，历时一个月，终于写完。
- 累
- 希望能大家理解Vuex源码
- 文章繁琐，不用打我
- 文章有一定纰漏，欢迎指正
![图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/020.jpg)




## 总目录
- [0-全局介绍](https://segmentfault.com/a/1190000016692344)
- [1-Vuex的安装](https://segmentfault.com/a/1190000016692486)
- [2-Store的创建及模块树介绍](https://segmentfault.com/a/1190000016740739)
 - [2.1-installModule模块安装及内容创建](https://segmentfault.com/a/1190000016878784)
 - [2.2-resetStoreVM数据响应式的实现](https://segmentfault.com/a/1190000016879353)
- [3-Vuex官方文档对照说明](https://segmentfault.com/a/1190000016911375)
















