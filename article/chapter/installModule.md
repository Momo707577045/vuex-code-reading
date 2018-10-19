## installModule，模块安装函数
- 参数介绍
  - store：store 对象实例，```new Vuex.Store({...})```生成的对象
  - rootState：根模块的state对象
  - path：[上一章节](https://segmentfault.com/a/1190000016692486)介绍过的，当前模块所处层级数组
  - module：模块对象
  - hot, ？？？
- 判断当前模块是否根模块
- 获取模块的命名空间
  - 调用状态模块树的 getNamespace 方法，传入当前模块的模块层级数组 path
  - getNamespace 和之前提到的 get 方法类似，同样是从根模块出发，根据给出的路径数组，递归每一个层级的模块
  - 在每一个模块中，判断是否设置命名[空间变量namespaced](https://vuex.vuejs.org/zh/guide/modules.html#%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)
  - 有命名空间，则以模块名结合"/"，形成命名空间路径，即本函数是获取模块的命名空间前缀，如对应下图，moduleC的命名空间前缀为'moduleA/moduleC/'，其中moduleB并没有设置命名空间
    ```
    {
      moduleA:{
        namespaced:true,
        modules:{
          moduleB:{
              namespaced:false,
              modules:{
                moduleC:{
                  namespaced:true,
                }
              }
            }
        }
      }
    }
    ```

  - 有些同学可能会疑惑，module对象里面，没有定义namespaced变量啊？其实namespaced是通过 get拦截器 定义的，获取namespaced时，真正是获取this._rawModule.namespaced，即module对象保存的配置信息中namespaced的值

  ![图]()

- 如果当前模块设置了命名空间，则将本模块存入当模块命名容器对象_modulesNamespaceMap中，并以刚刚生成的命名空间前缀名为key。注意，如果当前模块没有设置，即使父模块设置了，也不设置本模块命名空间，例如moduleB不会被加入到_modulesNamespaceMap中
- 对于非根模块，
  - 通过getNestedState，寻找父模块的 state对象。
    - getNestedState参数介绍，rootState是根容器的state，path.slice(0, -1)是除去本模块后的模块层级数组
    - 与get函数、getNamespace函数类似，从state中根据path层级数组，每层递归寻找，找到对应的state
    - 在这里找的是父模块的state对象
    - 从这个操作，我们可以猜测，state也将和module模块树一样，通过state形成一个state树，其树结构和module结构相对应
  - 获取本模块的模块名
  - 调用Vuex的_withCommit函数
    - 该函数的操作很简单，只是将设置_committing标识符为ture，然后执行某函数，函数执行完在将_committing设置为原来的值
    - 即允许在函数函数执行期间，修改state的值
  - 在_withCommit函数中
    - 借用Vue的[set方法](https://cn.vuejs.org/v2/api/#Vue-set)，Vue 在install中被传入并保存
    - 即往父State（这个对象）中添加，key为模块名，value为模块对象的变量，借用Vue.set方法，实现数据绑定
    - 注意，由于是直接往父模块的State中添加变量，当父模块的state中有与插入的模块同名的变量时，state中变量将被覆盖。
  - 结合  Vue.set(parentState, moduleName, module.state) 及 getNestedState函数，我们可以确定state也将和module模块树一样，通过state形成一个state树，其树结构和module结构相同。
  - 这就是为什么获取子模块的state变量时，是通过this.$store.state.moduleName.xxx来获取，[对应官网](https://vuex.vuejs.org/zh/guide/modules.html#module)
- 创建模块内容，makeLocalContext(store, namespace, path)。并将生成的content内容，module.content中。我们跳转这里，看看[makeLocalContext具体操作]()
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














## makeLocalContext，创建模块内容
- 参数介绍
  - store, store 对象实例
  - namespace, 模块的命名空间前缀，不管本模块是否设置命名空间，父模块设置了，也会该值
  - path，模块层级关系数组，注意，namespace与path并不一定相同，因为命名层级，只有当模块设置有命名空间，才存在对应层级命名
- 定义local对象
  - 定义local对象的dispatch函数
    - 根据namespace（本模块及祖先容器是否是设置过命名空间）进行判断
    - 没有设置，则直接使用 Store实例的 dispatch函数
    - 有命名空间，则在使用 Store 实例的dispatch函数前，对参数进行一些处理
      - 统一参数形式 unifyObjectStyle，type是调用dispatch方法的一个参数，即action函数名，payload是负载变量，options是配置项。unifyObjectStyle函数的原理就是，判断参数是否为对象，是对象则进行解析，并调整参数位置
      - 根据options.root判断是否往全局发送的action函数，对应[官网](https://vuex.vuejs.org/zh/guide/modules.html#%E5%9C%A8%E5%B8%A6%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4%E7%9A%84%E6%A8%A1%E5%9D%97%E5%86%85%E8%AE%BF%E9%97%AE%E5%85%A8%E5%B1%80%E5%86%85%E5%AE%B9%EF%BC%88global-assets%EF%BC%89)
    - 如果不是发送全局的action函数，即只发送本模块内的action函数，这是往调用的的 action函数名中，添加命名空间路径前缀。例如对应下图，actionC函数在_actions中，则被保存为'/moduleA/moduleC/actionC'。在调用时，使用方法为this.$store.dispatch('/moduleA/moduleC/actionC')。[对应官网介绍](https://vuex.vuejs.org/zh/guide/modules.html#%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)

    ```
    {
      moduleA:{
        namespaced:true,
        modules:{
          moduleB:{
              namespaced:false,
              modules:{
                moduleC:{
                  namespaced:true,
                   actions: {
                      actionC (context) {...}
                    }
                }
              }
            }
        }
      }
    }

    ```
    - 最后，调用vuex实例的dispatch函数
  - 定义commit函数
    - 与定义dispatch函数类似，有命名空间，则往mutation函数前添加命名空间前缀
    - 最后也而是调用vuex实例的commit函数
- 调用Object.defineProperties函数，往local对象中添加两个变量getters和state，设置local对象的getter和state
  - Object.defineProperties函数用于往某对象中添加属性，并设置该数据的访问拦截器，即访问该数据时，将先调用拦截器函数，[defineProperties函数详细介绍](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)
  - 定义getters变量，并设置其拦截器。同样的，判断是否有命名空间前缀
    - 没有，则直接访问store 对象实例的getters变量
    - 否则调用makeLocalGetters函数，生成自己的getters
      - 参数介绍，store是 store 对象实例，namespace是命名空间前缀
      - 先定义一个对象 gettersProxy，译为 getters代理
      - 遍历store.getters中的所有函数，（store.getters变量暂时还未定义到，其指向 store的_wrappedGetters，getter函数容器）
        - 检测各个函数名，判断该函数名的前缀是否与模块的命名空间前缀相同。找到即符合命名前缀的函数。
        - 去除命名空间前缀，能获取纯粹的getter函数名
        - 同样，通过Object.defineProperty，往刚刚定义的gettersProxy对象中，添加变量，并设置其get拦截器。enumerable是其中一个配置项目，设置当使用for等枚举循环时，是否显示该变量
        - 以带命名空间前缀的getter名为key，添加到gettersProxy对象中，当访问它时，返回是，从Store.getters(即store._wrappedGetters，getter容器)中提取的带上命名空间前缀的getter函数
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


















