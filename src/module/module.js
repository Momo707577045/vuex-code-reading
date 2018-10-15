// vuex中模块的定义，类似于vue，每一个数据层级都是一个模块，根数据结构也是模块的一个实例

import { forEachValue } from '../util'

// 封装模块，本质上只是根据配置文件生成实例。
// 用模块对象中，只有几个参数，
// _rawModule保存真实的配置信息，如state,getter,mutation函数等，
// rawState 是从配置信息特意解析出来的state对象
// 其他的函数都被集合类去调用

// 外部会创建一个context属性

// 只提供了具体模块的_children操作功能，获取，更新，添加，删除_children。不涉及业务
export default class Module {
  constructor(rawModule, runtime) {
    const rawState = rawModule.state
    this.runtime = runtime
    this._children = Object.create(null) // 子模块占位符，还不一定有
    this._rawModule = rawModule // 本模块的配置信息
    // 与传入函数，与vue的data属性相同的原理，为了复用某个配置，生成不同地址的对象，避免相关污染
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {} // 本模块中的state属性
  }

  // 根据配置信息中，是否设置namespaced参数，判断该模块是都启用独立的命名空间
  // 注意，命名空间和模块树层级关系是两回事，树层级是一定存在的，命名空间则不一定配置
  get namespaced() {
    return !!this._rawModule.namespaced
  }

  // 添加子模块，即往_children数组中添加子模块对象
  addChild(key, module) {
    this._children[key] = module
  }

  // 删除子模块
  removeChild(key) {
    delete this._children[key]
  }

  // 获取子模块
  getChild(key) {
    return this._children[key]
  }

  // 更新，即重新赋值namespaced，actions，mutations，getters
  update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }

  // 为每个子模块进行操作
  forEachChild(fn) {
    forEachValue(this._children, fn)
  }

  // 为每个getters进行操作
  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  // 为每个Action进行操作
  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  // 为每个Mutation进行操作
  forEachMutation(fn) {
    if (this._rawModule.mutations) { // 配置项目中的mutations
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
