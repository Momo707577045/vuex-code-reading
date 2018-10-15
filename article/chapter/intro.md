## 本系列文章目的
- 真正的代码解析
  - 网上有很多关于「vuex源码解析」的文章。但由于笔者水平有限，总觉得这些文章不太直观。
  - 大部分文章只是在按顺序逐个js文件进行介绍，并没有根据程序的运行逻辑介绍，也没有与官方文档进行对应。
  - 只有当真正理解了源码以后才恍然大悟，哦！原来文章是这个意思。
  - 但这时文章已经失去了帮助理解源码，帮助解析的意义。

    ![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/002.jpeg)

- 本文通过以下方式帮助阅读，理解源码
  - 给出数据结构，并介绍各数据的意义。
  - 抛出结论，即给出源码的整体运行原理。
  - 按照程序运行逻辑进行介绍，摒弃常规逐个文件进行介绍的方法。按照逻辑顺序进行介绍。
  - 对应官网的介绍文章进行介绍。
  - 尽量图文丰富，穿插表情包，让学习过程更愉悦些。
  - 通过以上的方式，带着整体印象去看源码，逐步进行验证，加深理解。不用一头雾水地猜源码。

    ![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/014.jpeg)
- 希望能通过系列文章
  - 能将vuex源码逻辑讲清楚，帮助大家理解源码。
  - 让大家了解vuex的实现机制，使用起来更踏实，打破顾虑。
  - 也希望借此消除大家对源码的恐惧，养成阅读源码的习惯。

    ![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/004.jpg)

## 文章阅读方式，及流程
- 正如前面所说，需要事先了解下文给出的「变量介绍」，「运行原理」。起码要有个印象，后续讲解中，能带着结论，不断去印证。
- 按顺序阅读，由于代码解析是根据程序运行逻辑进行介绍的，前后相互关联，所以需要按照顺序阅读
- 但当内容较为复杂，嵌套太深时，会拆分出来讲。可以先点击链接，跳转到细则中看完，再回到主逻辑继续阅读
- 本文讲得比较细，可能略显繁琐，大神请多包涵。理解能力强的同学，可以选择性跳过。

  ![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/001.png)

## 源码调试方法

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/008.jpg)
- 虽然本文用不到，但可能有些同学想要自己打断点，打日志查看实际运行过程，所以在此进行介绍
- 办法很简单，修改 vuex 库的索引源即可。例如修改示例中的 example->counter->app.js 文件

  ```
  import Vue from 'vue'
  // import Vuex from 'vuex'
  import Vuex from '../../src/index'
  ```

- 原理是，将原本对库的文件（build之后，被压缩过的）索引，改成对vuex源文件的索引
- ```'../../src/index'``` 是```/src/index.js```文件，即vuex源码的入口文件
- 修改后，参考 package.json 的说明，在目录下运行命令行```npm run dev```，即可执行示例程序
- 在源码后打的日志或者断点，就能在示例中执行


## 运行原理(重点)

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/016.jpeg)
- 通过变量 _modules 变量保存配置项模块树（其数据结构与配置项的数据结构相同，相当于配置文件的拷贝，只是对数据进行了些处理）
- 通过 state 变量保存与 _modules 模块树相同结构的 state 结构树，只是内容比较纯粹，全是state变量。
  - 对应下图，获取c变量，则为state(顶层module的state，即moduleA).moduleB.moduleC.c，
  - 子模块被当做 state 的一部分，以模块名为 key ，模块的 state 为 value 进行关联
  ```
  moduleA:{
    ...,
    state:{a:'a'},
    modules:{
      moduleB:{
          ...,
          state:{b:'b'},
          modules:{
            moduleC:{
              state:{c:'c'},
            }
          }
        }
    }
  }
  ```


- 通过 _actions，_mutations，getters 数组保存所有模块配置中的 action, mutation，getter函数
  - 如模块A，和模块B均有一个action函数actionFun，记做actionFun1和actionFun2。
  - 则 _actions.actionFun = \[actionFun1，actionFun2]
  - 如果模块设置了命名空间，则在保存函数时，往函数名中添加命名空间层级前缀。
  - 如模块C也有一个 action 函数actionFun，记做actionFun3，但由于设置了命名空间前缀，在_actions中保存时，将这样保存_actions\['C/action'] = actionFun3
- 调用 commit，dispatch，getter 时，从上面定义的容器中，找到同名的数组，顺序调用里面的函数
- 数据绑定的效果，通过 Vue 的 watch，computed 特性完成
- 总的来说，除了module和state使用了树结构，其他的都通过数组变量容器保存，需要用到的时候，再从里面拿。和我们简单地通过全局变量保存没太大的区别。只是做出了规范。



## 变量介绍(重点)

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/017.jpeg)

*用得比较多的，出现比较频繁的变量，预先介绍一下*

- 【_committing】提交状态
  - 在[严格模式](https://vuex.vuejs.org/zh/guide/strict.html)时，只要当_committing给false才可以修改state内容，用于防止非commit方式修改state（例如直接对state的变量进行赋值）。
- 【_actions】action 函数数组对象容器
  - 保存所有action函数数组，如 _actions.actionFun = \[actionFun1，actionFun2]
  - 调用 dispatch 函数时，将获取 _actions 的同名数组，递归调用数组里面的函数
- 【_mutations】 mutation 函数数组对象容器
  - 数据结构与_actions相同
  - 调用 commit 函数时，将获取 _mutations 的同名数组，顺序执行数组中保存的函数
- 【_wrappedGetters】
  - 保存 getter 函数的函数数组对象容器。
  - 通过this.$store.getters 获取的就是 _wrappedGetters 对象，只是中间进行了一些处理
- 【_modules】模块树，通过树结构，保存配置文件内容
- 【store】存储对象
  - 即this.$store，即整个vuex功能的实现函数，可以理解为vuex的对象实例
  - 【store._vm】vuex内部保存的vue对象实例，用于借助 vue 的 watch 函数和 computed 函数实现数据响应
  - 【store.getters】即 this.$store.getter，最终将调用 _wrappedGetters
- 【path】模块层级数组
  - 保存各个祖先模块的名字的数组，例如

  ```
  moduleA:{ // 对应path为[]
    ...,
    modules:{
      moduleB:{ // 对应path为['A']
          ...,
          modules:{
            moduleC:{}  // 对应path为['A','B']
          }
        }
    }
  }
  ```



## 源代码文件介绍

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/install-src.png)
- 【module】 模块相关处理的文件夹
  - 【module.js】 生成模块对象
  - 【module-collection.js】 递归解析模块配置，生成由「module.js 」的模块对象组成的模块树
- 【plugins】 插件相关，与主体功能无关
  - 【devtool.js】 chrome 的 vue 调试插件中使用到的代码，主要实现数据回滚功能
  - 【logger.js】 日志打印相关
- 【helpers.js】 辅助函数，mapGetters，mapActions，mapMutations等函数的实现
- 【index.esm.js】 ES6 打包规范的入口文件
- 【index.js】commonJS 打包规范的入口文件
- 【mixin.js】vue 混合函数，实现 vuex 的安装功能
- 【store.js】vuex 存储类，实现 vuex 的主体功能。
- 【util.js】工具函数库，复用一些常用函数

## 文章原稿，带注释源码，[戳这里](https://github.com/Momo707577045/Vuex-code-reading)
*文章持续输出中，源码注释还未完全整理，纯当阅读笔记，大神请勿较真*


![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/009.jpg)

## 下一篇文章将正式讲解源码，从vuex的安装过程开始讲起

![Momo图](http://momo-project.b0.upaiyun.com/Assets/VUEX/chapter/imgs/011.gif)

不给钱，点个赞也成啊~

