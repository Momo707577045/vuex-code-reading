## Vuex 的安装流程，Vue.use(Vuex)
# index.js
![Momo图]()
- Vue安装插件，通过[Vue.use函数](https://cn.Vuejs.org/v2/api/#Vue-use)执行，该函数会调用插件暴露出来的「install」方法，并将 Vue类 传递进来。
- 首先，我们找到 Vuex 的源码文件 ```index.js```
- 可以看见，Vuex确实导出了install函数
- 「install」方法引用于store.js文件


# store.js
![Momo图]()
- 在文件最底部，我们找到 install 函数，里面做了如下操作
- 获取Vue实例，判断Vuex是否已经加载过，并通过变量Vue，保存Vue调用install方法时，传入的Vue类。
- 最后调用函数 applyMixin，applyMixin 引用于 mixin.js 文件


# mixin.js
![Momo图]()
- 来到这里，才是具体安装 Vuex 的函数
- 获取Vue版本，根据不同的Vue版本，进行不同的注入操作
  - Vue2.0以上的，在Vue的beforeCreate生命钩子中，执行安装函数
  - Vue.mixin({ beforeCreate: VuexInit })
  - 这里是通过mixin混合的方式，而调用者是install中传递进来的根Vue实例，所以这里使用的是全局混合
  - 而根据[Vue全局混合](https://cn.Vuejs.org/v2/guide/mixins.html#%E5%85%A8%E5%B1%80%E6%B7%B7%E5%85%A5)的定义，后续所有子组件都将进行同样的混合
  - 所以所有子组件，在beforeCreate阶段都将调用VuexInit方法
  - 低于2.0版本做的也是类似的事情，只是当前还没有生命周期钩子，只能将安装代码插入到Vue的init方法里面被调用


# VuexInit方法
  - 获取配置文件，const options = this.$options。
  - 这里的this，是Vue实例，因为这个函数是在Vue的beforeCreate钩子函数中被调用的。调用者是Vue实例。
  - this.$options中的参数，可以在new Vue根实例时，传递进去（当然就也可以是vue自己的内部参数），[官方介绍](https://cn.Vuejs.org/v2/api/#vm-options)
  - 如果有 this.$options.store，则表示是Vue根实例，因为store是在new Vue时传进去的变量。例如，在Vuex的示例代码中（/examples/counter/app.js），new Vue时，其中一项构造参数就是store
    ![Momo图]()

  - 获取this.$options.store，如果是传递的是函数，则调用该函数，原理与Vue的data一样，通过工厂模式，当多实例复用同一个配置对象时，防止数据相互污染。示例代码如（/examples/counter/store.js）[官方介绍](https://Vuex.Vuejs.org/zh/api/#Vuex-store-%E6%9E%84%E9%80%A0%E5%99%A8%E9%80%89%E9%A1%B9)
    ![Momo图]()

  - 但平时我们单页面应用只保存一个Vuex实例，所以一般直接传入Vuex对象，函数模式用的比较少

  - 如果没有options.store，证明调用本函数的是Vue的子组件，不是根Vue实例。这时通过options.parent（options.parent是Vue的内置变量）找到父组件的索引。
    - 对应官网的[parent变量](https://cn.vuejs.org/v2/api/#parent)，在options中定义vue的内置变量，可通过this.$访问到，所以this.options.parent相当于this.$parent
  - 找到父组件的$store变量，父组件的$store又源于其父组件的$store，通过层层递归，最终找到根Vue的$store变量
  - 并赋值到子组件的this.$store，从而让所有Vue组件都能通过this.$store找到Vuex对象实例。对应[Vuex官网的这一段介绍](https://Vuex.Vuejs.org/zh/guide/state.html#%E5%9C%A8-Vue-%E7%BB%84%E4%BB%B6%E4%B8%AD%E8%8E%B7%E5%BE%97-Vuex-%E7%8A%B6%E6%80%81)
  - ![Momo图]()


# 小结
  - 以上实现了Vuex的安装
  - 所有Vue组件对Vuex对象的引用
  - 在「store.js」这个模块中，获取并保存了Vue根实例的引用
  - 到此为止，Vuex暂时还未和Vue有什么深层次的耦合，只是在Vue中添加了一个Vuex的变量引用而已

# 下一章节，将介绍Vuex.store的创建过程，真正接触Vuex的功能代码
