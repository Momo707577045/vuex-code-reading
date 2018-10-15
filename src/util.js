// 工具函数库


// 返回查询到的第一个符合条件的数组元素
export function find(list, f) {
  return list.filter(f)[0]
}

// 避免圆形死循环的深度复制
export function deepCopy(obj, cache = []) {
  // 不是对象，则直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  const copy = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key], cache)
  })

  return copy
}

// 对对象的每一个属性，执行特定操作
export function forEachValue(obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

// 判断是否是对象
export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

// 判断是否是Promise对象，根据对象是否含有then函数来判断
export function isPromise(val) {
  return val && typeof val.then === 'function'
}

// 断言，当条件为假时，输出某错误信息
export function assert(condition, msg) {
  if (!condition) {
    throw new Error(`[vuex] ${msg}`)
  }
}
