## resetStoreVM
- 参数介绍，store是store实例, state是根模块的state对象，也是state树结构入口， hot暂不介绍
- 定义getters对象，噔噔蹬蹬，这就是传说中的getters对象。
- 定于computed变量

- 遍历store中的getter容器_wrappedGetters，将容器中收集到的每一个getter函数，通过Object.defineProperty方法，赋值到刚刚定义的store.getters对象中
  - 在forEachValue的回调函数中，fn为具体getter函数，key为getter函数的名字
  - 当访问store.getters的getter函数时，通过设置get拦截，实际返回的是store._vm的同名函数，store._vm在后面定义
  - 往computed变量中，加入getter函数，当访问computed\[key]时，将调用getter函数本身，并将store实例传递进去
    ![图片](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/resetStoreVM-001.png)


- 记录slient，并在新建Vue实例时设置为true，避免过多的日志信息。在Vue实例创建完成后，设置回原本的值

- 定义store._vm变量，定义为新建的Vue实例。
  - 并在vue实例的data中，通过$$state保存store实例本身
  - 并将刚刚定义的computed变量传递进入，当做vue的computed属性。从而实现了getter函数的computed功能。getter 的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。对应[官网的介绍](https://store.vuejs.org/zh/guide/getters.html#getter)

    ![图片](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/resetStoreVM-002.png)





- 设置严格模式，enableStrictMode，该函数内部
  - store.strict，在store的构造函数中定义，```this.strict = options.strict```，即配置项中设置[严格模式配置参数](https://vuex.vuejs.org/zh/guide/strict.html#%E4%B8%A5%E6%A0%BC%E6%A8%A1%E5%BC%8F)
  - 通过Vue的watch功能，监听this._data.$$state（与store根实例的state变量同一个地址，所以就是监听store.state的变化）
  - 当state发生变化，但_committing为false，即当前非commit操作时。将报错
  - 非commit操作，即直接修改state的值，在严格模式下禁止运行，对应[官网介绍](https://store.vuejs.org/zh/guide/strict.html)

   ![图片](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/resetStoreVM-003.png)
   ![图片](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/resetStoreVM-005.png)


- 后续hot是设置热重载功能，用于实现在Vue调试时的回退功能
  - 清除旧数据的绑定的Vue实例，并将其销毁掉
