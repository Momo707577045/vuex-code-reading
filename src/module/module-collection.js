// 模块集合，生成vuex的模块状态树

import Module from './module'
import { assert, forEachValue } from '../util'

// 该模块集合类或者对象，只有一个属性this.root，其他都是函数
// 该类只实现了模块状态树的管理功能，不涉及具体业务，只管理数据结构
export default class ModuleCollection {
  constructor(rawRootModule) { // rawRootModule是创建vuex时，new vuex传入的参数，即整个vuex配置。所以说是根模块
    this.register([], rawRootModule, false) // 注册根模块
  }

  // 获取具体模块，通过reduce函数，实现对象的逐层调用。通过层级数组，解析状态树，获取具体层级的模块。但缺点是每次都需逐层获取，相当于a.b.c.d。没有做缓存
  get(path) {
    // reduce回调函数中，参数一为上一次函数执行的返回值，key为当前数组元素的值
    return path.reduce((module, key) => {
      // module则为this.root或上一次函数的返回值，key为path数组的当前值
      return module.getChild(key) // 在每一个层module中调用getChild函数，根据path数组获取特定层级的子模块
    }, this.root)
  }

  // 注册函数，根据配置文件生成「模块」实例，递归挂载「模块树」。新产生的属性就只有「this.root」一个，即一颗状态树
  register(path, rawModule, runtime = true) {
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule) // 操作前先断言模块，配置配置信息的数据类型是否正确
    }

    const newModule = new Module(rawModule, runtime) // 注册模块，仅仅是将配置信息rawModule用外壳包装起来，没有进行解析
    if (path.length === 0) { // 根据路径长度，判断该模块是否为根模块
      this.root = newModule // 添加这一个属性
    } else { // 不是根模块，则获取上一级的模块，将本模块接入该模块的child属性中
      const parent = this.get(path.slice(0, -1)) // 获取父模块，其中path是对象层级名字，.slice(0, -1)是去除本级，从而获取到上一级
      // 调用具体模块的addChild函数，往具体模块的children对象中加入本模块
      // path[path.length - 1]是本模块的名，即在父模块的children对象中的key名
      parent.addChild(path[path.length - 1], newModule)
    }

    // 注册递归本模块中的子模块，注册，断言，挂载到父模块中
    // 因为配置信息实际上只有一个，根模块，子模块都在同一个配置信息中，所以调用模块集合的注册函数就一次性递归解析生成所有的模块
    if (rawModule.modules) { // 这对应到vuex实际使用时，子模块的载入写法，写在模块的modules变量中，即配置信息是通过modules变量形成层级关系
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        // 其层级的path数组，就是在这个递归循环中解析生成的，而不是配置信息写的，这个数组只起到索引作用，实际获取还是需要通过模块数，逐层解析得到
        this.register(path.concat(key), rawChildModule, runtime) // 模块路径层级名称数组，组件内容，
      })
    }
  }

  // 获取模块的命名空间层级名，本质上是根据path及其是否设置namespaced配置项，拼接模块空间名
  getNamespace(path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  update(rawRootModule) {
    update([], this.root, rawRootModule)
  }

  // 卸载某模块，从父模块的children对象中，剔除子模块对象
  unregister(path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    if (!parent.getChild(key).runtime) {
      return
    }

    parent.removeChild(key)
  }
}

// 更新模块，重置设置模块
function update(path, targetModule, newModule) {
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

// 断言相关，不涉及逻辑
// 判断是否是函数类型
const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

// 判断是否是函数，或者含有handler函数的对象类型，
const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

// 断言的内容种类，及其对应断言函数
const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}

// 断言模块，判断getters，mutations，actions等是否符合数据类型
function assertRawModule(path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) { // 如果没有该配置，则略过
      return
    }

    const assertOptions = assertTypes[key] // 具体内容对应的断言函数

    // 针对具体类型下的内容进行逐一断言，这意味着配置文件内，不能添加额外的属性，因为每一个属性将被vuex进行处理，若传入额外的值，将处理出错。所以在真正执行前就要进行断言
    forEachValue(rawModule[key], (value, type) => { // 具体项的值，对应类型的具体项
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

// 输出断言的错误信息
function makeAssertionMessage(path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
