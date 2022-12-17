<template>
  <div class="menu_box">
    <div class="head_title">
      <p>The Example of ThreeJs</p>
    </div>
    <div class="menu_content">
      <ul class="menu_list">
        <li v-for="(item, index) in list" :key="index" @click="goPage(item.path, index)" class="menu_item"
          :class="{ active: index === chooseIndex }">
          <p class="menu_label">{{ item.meta?.label }}</p>
          <div class="menu_keys">
            <span v-for="key in item.meta?.keys" :key="key">{{ key }}</span>
          </div>
          <span class="menu_lesson"><i>{{ item.meta?.lesson }}</i></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang='ts'>
/** type **/
import { menuItem } from '@/types/menu'

/** Composition API **/
import { ref, onMounted } from 'vue'

/** Components **/

/** 外部依赖 **/
import { useRouter } from 'vue-router'

/** API **/

/** 属性 **/
const props = defineProps<{
  list: menuItem[]
}>()

/** data **/
const router = useRouter()
let chooseIndex = ref(0)

/** 生命周期 **/
onMounted(() => {
  if (localStorage.getItem('chooseIndex')) {
    chooseIndex.value = Number(localStorage.getItem('chooseIndex'))
  }
})

/** 方法 **/
const goPage = (path: string, index: number): void => {
  chooseIndex.value = index
  localStorage.setItem('chooseIndex', index + '')
  router.push({
    path
  })
}

</script>

<style lang='scss' scoped>
.menu_box {
  width: 100%;
  height: 100%;
  padding: 1.2rem 0;
  box-sizing: border-box;
  user-select: none;
  background-color: #f3f3f3;
  overflow: hidden;

  .head_title {
    width: 100%;
    padding: 0 1.2rem 1.2rem;
    box-sizing: border-box;
    border-bottom: 1px dashed #8d958e;

    p {
      font-size: 1.4rem;
      text-align: left;
      line-height: 1em;
      color: #4d6d50;
      font-weight: 500;
    }
  }

  .menu_content {
    width: 100%;
    height: calc(100% - 1.4rem - 1.2rem - 1px);
    padding: 1.2rem 1.2rem 0;
    box-sizing: border-box;

    .menu_list {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;

      &::-webkit-scrollbar {
        /*滚动条整体样式*/
        width: 3px;
        display: none;
      }

      &::-webkit-scrollbar-thumb {
        /*滚动条里面小方块*/
        // border-radius: 1px;
        background-color: rgba($color: #cfe3d6, $alpha: 0.4);
      }

      &::-webkit-scrollbar-track {
        /*滚动条里面轨道*/
        // border-radius: 1px;
        background: transparent;
      }

      .menu_item {
        width: 100%;
        height: max-content;
        margin-top: 1.2rem;
        background-color: #f3f3f3;
        border-radius: 4px;
        box-sizing: border-box;
        cursor: pointer;
        padding: 1rem;
        position: relative;

        &:hover {
          background-color: #f6f6f6;
        }

        &:first-child {
          margin-top: 0;
        }

        .menu_label {
          width: 100%;
          font-size: 1rem;
          line-height: 1em;
          color: #4d6d50;
        }

        .menu_keys {
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: flex-start;
          flex-wrap: nowrap;
          margin-top: 0.7rem;

          span {
            padding: 0.2rem 0.3rem;
            box-sizing: border-box;
            background-color: #ebefeb;
            font-size: 12px;
            text-align: center;
            line-height: 1em;
            color: #787f79;
            margin-left: 0.3rem;
            border-radius: 2px;

            &:first-child {
              margin-left: 0;
            }
          }
        }

        .menu_lesson {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          font-size: 2rem;
          color: #0000ff;
          font-weight: bold;
          opacity: 0;
        }
      }

      .active {
        background-color: #f9f9f9 !important;
        box-shadow: 0 0 20px rgba($color: #a2aea3, $alpha: 0.2);

        .menu_lesson {
          opacity: 0.1;
        }
      }
    }
  }
}
</style>