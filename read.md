### 收获
- 利用get，Object.defineProperty 定义数据拦截，数据映射
- path.reduce解析层级
- 根据「/」字符串的解析，设置层级结构
- 返回的函数绑定this，防止被修改
- createNamespacedHelpers语法糖
- unifyObjectStyle，参数适配
- assert断言函数
- normalizeMap


### 总结
- module 树
- state 树
- _actions，一个数组对象，通过key标识aciton名，数组保存各个实际操作函数。通过'/'层级结构区分命名空间
- _mutations，一个数组对象，通过key标识aciton名，数组保存各个实际操作函数。通过'/'层级结构区分命名空间
- _subscribers，mutation订阅器，执具体mutation后调用，将具体mutation信息传递到订阅器中
- _actionSubscribers，action订阅器，执具体action前调用，将具体action信息传递到订阅器中
- commit函数，根据传入的参数，判断是否添加命名空间前缀，顺序调用具体的_mutations中的回调数组
- dispatch函数，根据传入的参数，判断是否添加命名空间前缀，顺序调用具体的_actions中的回调数组
  - store中的dispatch都是直接调用store中的_actions，直接根据给出的key，从_actions[key]获取值
  - helper中的，如果通过createNamespacedHelpers，则返回的是具体的module中的dispatch，该函数会在key中添加对应的命名空间前缀，在从_actions[prefix+key]获取值
  - 所以createNamespacedHelpers的作用相当于获取module.content
- _wrappedGetters， 收集所有getter，最终导出store.getter
- _modules， 模块树
- _modulesNamespaceMap，收集所有带有命名空间前缀的module




### getter
- installModule
  - makeLocalContext（作用是，设置getter的拦截，实际数据从store的getters中拿）
    - store.getters
    - makeLocalGetters -> 添加命名空间前缀 -> store.getters
  - registerGetter
    - _wrappedGetters 收录所有getter

- resetStoreVM（使用computed的作用是，是的getter的值，能根据其依赖项的变化而变化，借助了vue的特性）
  - 定义store.getters
  - 定义_vm
  - 遍历_wrappedGetters，将回调函数key(以下所有的key都是带有命名空间前缀的)，作为computed，放置到_vm中
  - 遍历_wrappedGetters，将内容填充到store.getters中
  - 设置store.getters的get拦截器，当调用时，获取_vm中对应key的computed


### state
- installModule
  - Vue.set，生成一颗state树，挂载在rootState.state
  - makeLocalContext，（添加了命名空间前缀的解析）
    - 定义local.state
    - 设置local.state 的 get，当获取内容时，从store.state（后面会被赋值为rootState.state）中，解析层级获取最终内容
- resetStoreVM
  - 定义_vm
  - 将 rootState.state（state树） 挂载到_vm._data.$$state （挂载到_vm._data，是为了watch监听$$state的变化，若在$$state变化时，_committing不为true，则报错，即约定只通过commit修改state）
- 定义get，返回_vm._data.$$state，即本质上没有显式设置store.state对象，只是
# store.store -> _vm.data.$$state ->  rootState.state
# location.state -> store.store -> _vm.data.$$state ->  rootState.state -> 层级解析获取具体state
# createNamespacedHelpers 返回的 state 是computed，其值将依赖state的变化





### 根据配置项生成模块状态树
- 通过module.children.moduleA对象保存
### 注册模块状态树
### 生成对应模块树的state树，该树只包含各层级的state内容
- state树的入口，保存在rootModule的state中，
- 通过了module.state.moduleA的方式保存
- 由于是往父State中添加key为模块名的模块，所以模块名与父本身的state中属性同名时，原state中的同名属性将被覆盖!!!

### 解析每个模块中的commit，dispatch，getters，state等
- dispatch与commit，更具配置项，设置是否向全局发送，是则重置type名
  - 否则都使用全局的dispatch等函数，不修改type名
  - 属于函数重载
- getters和state则是定义其get方法，本质上属于添加获取该数据时的拦截器
  - 因为他们本质上是数据，不是函数，只能在数据的get方法中进行拦截
  - 当调用具体模块的getter时，实际上是从vuex.state中赛选获取。（实际保存的getter名是带上命名空间前缀的「如果有设置命名空间的话」）
  - 实现了具体模块的state与vuex.state的映射


### 注册Mutation，Action，getter
- 所谓的注册，都只是用特别的对象将其保存起来
- 所有的mutation都保存在store._mutations中
  - 通过key:[回调函数，回调函数]来响应多个回调函数
- 所有的action都保存在store._action中
  - 通过key:[回调函数，回调函数]来响应多个回调函数
- 所有的action都保存在store._wrappedGetters中
  - 做了重复定义的断言，因为getter是数据数据类的，不是函数，所有不能重复定义


### 所有的getter方法都放置在vuex示例的getters对象中
- 所以可能会冲突
- 当调用具体模块的getter时，实际上是从vuex.state中赛选获取。实现了具体模块的state与vuex.state的映射



### vuex数据保存结构
- modules，state 树状结构
- commit，dispatch，getters，mutation 都只通过 对象保存，通过key及其前缀区分不同的函数和操作

