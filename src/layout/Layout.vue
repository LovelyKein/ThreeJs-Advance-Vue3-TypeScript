<template>
  <div class="layout">
    <div class="left_part">
      <Menu :list="listData" />
    </div>
    <div class="right_part">
      <Content/>
    </div>
  </div>
</template>

<script setup lang='ts'>
/** type **/
import { menuItem } from '@/types/menu'

/** Composition API **/
import { ref, onMounted } from 'vue'

/** Components **/
import Menu from './components/Menu.vue'
import Content from './components/Content.vue'

/** 外部依赖 **/
import { routes } from '@/router'

/** API **/

/** 属性 **/

/** data **/
let listData = ref<menuItem[]>([])

/** 生命周期 **/
onMounted((): void => {
  listData.value = []
  routes.forEach((route) => {
    if (route.path !== '/') {
      listData.value.push({
        path: route.path,
        meta: route.meta
      })
    }
  })
})

/** 方法 **/

</script>

<style lang='scss' scoped>
.layout {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  .left_part {
    width: 18%;
    height: 100%;
  }
  .right_part {
    width: 82%;
    height: 100%;
    overflow: hidden;
  }
}
</style>