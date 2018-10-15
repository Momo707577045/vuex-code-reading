<template>
  <div id="app">
    Clicked: {{ $store.state.count }} times, count is {{ evenOrOdd }}.
    <button @click="test">test</button>
    <button @click="doneCount">=</button>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="incrementIfOdd">Increment if odd</button>
    <button @click="incrementAsync">Increment async</button>
  </div>
</template>

<script>
// mapGetters, mapActions是VUEX模块的函数，与其业务类store没有直接的引用
// 只是其内部会通过调用vue的，this.$store去寻找到vuex实例，进行其辅助操作
// 而this.$store中$store的定义，是在vuex的install函数中往vux类注入到所有vuex实例的，包括所有子组件
// 所以一切都是vue自己做好的操作
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: mapGetters([
    'evenOrOdd'
  ]),
  methods: {
    ...mapActions([
      'increment',
      'decrement',
      'incrementIfOdd',
      'incrementAsync',
    ]),
    ...mapActions({
      // 隐藏用法，可以传入一个函数，该函数的第一个参数将被填充为绑定了this.$store的dispatch方法（如导入了命名空间，则返回其模块的dispatch方法）
      // 这是观看源码，从helper函数的从观察出来的
      doneCount: function (dispatch, ...arg) {
        dispatch('increment')
        console.log(arg)
      }
    }),
    test() {
      // console.log(this.$store.state.age)
      console.log(this.$store.state.age.value)
    }
  },
}
</script>
