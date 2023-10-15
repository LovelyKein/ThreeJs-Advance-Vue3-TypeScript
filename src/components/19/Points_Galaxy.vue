<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, onUnmounted } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock;

const canvas = ref<HTMLCanvasElement>() // 画布

const params = {
  count: 10000,
  size: 0.02,
  radius: 5,
  branches: 4, // 分支数
  spin: 0.3,
  color: '#ff6030',
  outColor: '#1b3984',
}

let geometry: THREE.BufferGeometry
let material: THREE.PointsMaterial
let points: THREE.Points

// 组件导出的属性数据
defineExpose<{
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null
}>({
  renderer,
  camera,
  scene
})

/** 生命周期 **/
onMounted((): void => {
  initRenderer()
  initCamera()
  initScene()
  initAxesHelper()
  initControls()
  initClock()
  initMesh()
  render()
  resize()
})

onUnmounted(() => {
  renderer?.dispose()
})

/** 方法 **/
const initRenderer = (): void => {
  const drawCanvas = canvas.value!
  drawCanvas.style['cursor'] = 'pointer'
  renderer = new THREE.WebGLRenderer({
    canvas: drawCanvas,
    alpha: true,
    antialias: true, // 抗锯齿
    precision: 'mediump',
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(canvas.value!.offsetWidth, canvas.value!.offsetHeight) // 设置尺寸
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value!.offsetWidth / canvas.value!.offsetHeight, 0.1, 2000)
  camera.position.set(params.radius * 0.2, params.radius * 0.4, params.radius * 2)
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101010)
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(params.radius * 0.4)
  scene?.add(axesHelper)
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.target.set(0, 0, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
    controls.enablePan = false // 禁止拖动
    controls.minDistance = params.radius * 0.4
    controls.maxDistance = params.radius * 3
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

// 初始化场景
const initMesh = (): void => {
  const gui = new dat.GUI()

  const random = (r: number = 1): number => {
    return Math.random() * r
  }

  // 创建 星系
  geometry = new THREE.BufferGeometry()

  const positions = new Float32Array(params.count * 3)
  // const colors = new Float32Array(params.count * 3)
  // const scales = new Float32Array(params.count)

  const branch_angle = (Math.PI * 2) / params.branches // 一个分支的角度

  const multiple = 1.8

  for (let i = 0; i < params.count; i++) {
    const index = i * 3 // 当前点的下标
    // // 1. 随机的半径
    // const distance = random(params.radius)

    // 2. 随机的半径，且这个距离值往中心收拢
    const distance = random(params.radius) * Math.pow(random(), 3) // 随机的半径

    const currentBranch = i % params.branches // 当前是第几分支数

    const angle = currentBranch * branch_angle // 当前分支的角度
    const offset = distance * params.spin // 根据粒子到中心的距离进行偏移

    // // // 1. 规律性随机值
    // const random_x = random() - 0.5
    // const random_y = random() - 0.5
    // const random_z = random() - 0.5

    // // 2. 随机值，且每个分支的点都往 分支线 上收拢
    // const random_x = Math.pow(random(multiple) - 0.5 * multiple, 3)
    // const random_y = Math.pow(random(multiple) - 0.5 * multiple, 3)
    // const random_z = Math.pow(random(multiple) - 0.5 * multiple, 3)

    // 3. 随机值，每个分支的点都往 分支线 上收拢， 且该值越往中心，值越大
    const distance_ratio_multiple = 1
    const distance_ratio = ((distance - params.radius) / (params.radius)) // 距离比值，离中心越近，值越大
    const random_x = Math.pow(random(multiple) - 0.5 * multiple, 3) * distance_ratio
    const random_y = Math.pow(random(multiple) - 0.5 * multiple, 3) * distance_ratio
    const random_z = Math.pow(random(multiple) - 0.5 * multiple, 3) * distance_ratio

    // 原理：x * x + y * y = r * r
    const x = distance * Math.cos(angle + offset) + random_x
    const y = random_y
    const z = distance * Math.sin(angle + offset) + random_z

    // 设置点的位置
    positions[index] = x
    positions[index + 1] = y
    positions[index + 2] = z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))


  // 材质
  material = new THREE.PointsMaterial({
    transparent: true,
    // vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    size: params.size
  })

  points = new THREE.Points(geometry, material)

  scene?.add(points)
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

const render = (): void => {
  if (scene && camera && renderer && clock) {
    const elapseTime = clock.getElapsedTime()
    if (points) points.rotation.y += 0.002
    renderer.render(scene, camera)
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
      cursor: pointer;
    }
  }
}
</style>