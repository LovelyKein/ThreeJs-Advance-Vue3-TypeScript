<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
    <div class="info">
      <p>计数：<span>{{ number }}</span></p>
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, reactive, onUnmounted } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let light: THREE.HemisphereLight
let meshes: THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material>
let rayCaster: THREE.Raycaster

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;

let row: number = 5
let count: number = Math.pow(row, 3)
let white: THREE.Color = new THREE.Color().setHex(0xffffff)
let color: THREE.Color = new THREE.Color()
const mouse: THREE.Vector2 = reactive(new THREE.Vector2(1, 1))
let number = ref<number>(0)

const canvas = ref()

defineExpose({
  renderer,
  camera,
  scene
})

/** 生命周期 **/
onMounted((): void => {
  initRenderer()
  initCamera()
  initScene()
  initLight()
  initAxesHelper()
  initRayCaster()
  initControls()
  initMesh()
  render()
  resize()
  mouseMove()
})

onUnmounted(() => {
  renderer?.dispose()
})

/** 方法 **/
const initRenderer = (): void => {
  canvas.value.style['cursor'] = 'pointer'
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    // alpha: true,
    antialias: true // 抗锯齿
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(canvas.value.offsetWidth, canvas.value.offsetHeight) // 设置尺寸
  renderer.shadowMap.enabled = true // 开启阴影渲染
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 1000)
  camera.position.set(10, 10, 10) // 相机位置
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initLight = (): void => {
  light = new THREE.HemisphereLight(0xffffff, 0x888888)
  light.position.set(0, 1, 0)
  if (scene) {
    scene.add(light)
  }
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(8)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
  }
}

const initRayCaster = (): void => {
  rayCaster = new THREE.Raycaster()
}

const initMesh = (): void => {
  const geometry = new THREE.IcosahedronGeometry(0.5, 3) // 正 20 面体
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff
  })
  // InstancedMesh 实例网格，可以使 count 数量中的网格，共享一个 几何体 和 材质，减少占用内容资源，提高渲染性能
  meshes = new THREE.InstancedMesh(geometry, material, count)
  // console.log(meshes)

  let index: number = 0
  let offset: number = (row - 1) / 2 // 2
  let matrix: THREE.Matrix4 = new THREE.Matrix4() // 矩阵
  for (let x = 0; x < row; x++) {
    for (let y = 0; y < row; y++) {
      for (let z = 0; z < row; z++) {
        matrix.setPosition(offset - x, offset - y, offset - z) // -2 ~ 2
        meshes.setMatrixAt(index, matrix) // 给对应索引的几何体设置矩阵
        meshes.setColorAt(index, white) // 给对应索引的几何体设置颜色
        index++
      }
    }
  }

  if (scene) {
    scene.add(meshes)
  }
}

const resize = (): void => {
  if (camera && renderer) {
    window.onresize = (): void => {
      if (camera && renderer) {
        camera.aspect = canvas.value!.offsetWidth / canvas.value!.offsetHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.value!.offsetWidth, canvas.value!.offsetHeight)
      }
    }
  }
}

const mouseMove = (): void => {
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  })
}

const render = (): void => {
  if (scene && camera && renderer) {
    renderer.render(scene, camera)
    rayCaster.setFromCamera(mouse, camera)
    const intersection = rayCaster.intersectObject(meshes)
    // console.log(intersection) 数组
    if (intersection.length) {
      const instanceId = intersection[0].instanceId || 0
      meshes.getColorAt(instanceId, color)
      if (color.equals(white)) {
        meshes.setColorAt(instanceId, color.setHex(0xffffff * Math.random()))
        const obj: any = meshes.instanceColor
        obj.needsUpdate = true // 通知实例网格需要更新颜色
        number.value++
      }
    }
  }
  window.requestAnimationFrame(render)
}

</script>

<style lang='scss' scoped>
.content_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .canvas_box {
    width: 100%;
    height: 100%;

    #canvsa {
      width: 100%;
      height: 100%;
    }
  }
  .info {
    position: absolute;
    top: 2rem;
    left: 2rem;
    width: max-content;
    user-select: none;
    p {
      text-align: left;
      font-size: 0.9rem;
      line-height: 1rem;
      color: #ffffff;
      span {
        display: inline-block;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1rem;
        height: 1rem;
      }
    }
  }
}
</style>