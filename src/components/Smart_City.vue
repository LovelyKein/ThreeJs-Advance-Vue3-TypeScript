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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock

let clearColor: number = 0x001122 // 雾化和背景渲染的颜色

/** city **/
let floor: THREE.Group



const canvas = ref() // 画布

// 组件导出的属性数据
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
  initAxesHelper()
  initLights()
  initControls()
  initClock()
  initAll() // 初始化城市
  render()
  resize()
})

onUnmounted(() => {
  renderer?.dispose()
})

/** 方法 **/
const initRenderer = (): void => {
  canvas.value.style['cursor'] = 'pointer'
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true // 抗锯齿
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(canvas.value.offsetWidth, canvas.value.offsetHeight) // 设置尺寸
  // renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  // renderer.toneMapping = THREE.ACESFilmicToneMapping // 优化 sky 的渲染
  // renderer.shadowMap.enabled = true // 开启阴影的渲染

  renderer.setClearColor(clearColor, 1.0) // 渲染背景色
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(70, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 20000)
  // window.camera = camera
  camera.position.set(-800, 600, 129)
}

const initScene = (): void => {
  scene = new THREE.Scene()
  // 设置雾化效果
  scene.fog = new THREE.Fog(clearColor, 50, 2200)
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(500)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.maxPolarAngle = Math.PI * 0.45 // 最大极角（与 xy 平面的夹角）值
    controls.minPolarAngle = Math.PI * 0.05 // 最小极角值
    controls.target.set(0, 0, 0) // 轨道旋转中心点
    controls.maxDistance = 2400 // 最远距离
    controls.minDistance = 100 // 最近距离
    controls.zoomSpeed = 0.5
    controls.rotateSpeed = 0.5
  }
}

const initLights = (): void => {
  // 加载灯光
  const ambient = new THREE.AmbientLight(0xffffee, 0.5)
  scene?.add(ambient)

  // 方向光，平行光，模拟太阳光
  const directionLight = new THREE.DirectionalLight(0xffffdf)
  directionLight.position.set(-400, 1000, 1000)
  directionLight.intensity = 0.6
  scene?.add(directionLight)
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

// 初始化场景
const initAll = (): void => {
  const fileLoader = new GLTFLoader() // 文件加载器
  // 创建地面网格
  create_grid(4000, 100, 0x002230, 1, 0x007777)

  // 加载城市模型
  create_city(fileLoader, '/models/city/shanghai.glb')
}

// 初始化网格地面
const create_grid = (gridSize: number, cell: number, color: THREE.ColorRepresentation, pointSize: number, pointColor: THREE.ColorRepresentation): void => {
  floor = new THREE.Group()
  floor.name = 'floor'

  // 网格
  const gridHelper = new THREE.GridHelper(gridSize, cell, color, color)
  gridHelper.position.set(0, -1, 0)
  gridHelper.name = 'grid'
  gridHelper.renderOrder = -1
  floor.add(gridHelper)

  // 点阵
  const gap = gridSize / cell // 每个点之间的间距
  const half = gridSize / 2
  const matrix = new THREE.Matrix4()
  const geometry = new THREE.PlaneGeometry(pointSize, pointSize) // 此时在 XOY 平面上
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({
    color: pointColor,
    depthWrite: false,
    side: THREE.FrontSide
  })
  const points = new THREE.InstancedMesh(geometry, material, Math.pow(cell, 2))
  points.name = 'points'
  let index: number = 0
  for (let x = 0; x < cell; x++) {
    for (let y = 0; y < cell; y++) {
      matrix.setPosition(-half + x * gap, -0.4, -half + y * gap)
      points.setMatrixAt(index, matrix)
      index++
    }
  }
  floor.add(points)

  scene?.add(floor)
}

// 加载城市
const create_city = (fileLoader: GLTFLoader, url: string): void => {
  fileLoader.load(url, (glb) => {
    // console.log(glb)
    scene?.add(glb.scene)
  })
}

const resize = (): void => {
  if (camera && renderer) {
    window.onresize = (): void => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }
  }
}

const render = (): void => {
  if (scene && camera && renderer) {
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
    }
  }
}
</style>