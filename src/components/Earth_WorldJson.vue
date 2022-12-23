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

import { lngLatToXYZ } from '@/utils/coordinate'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let light: THREE.HemisphereLight
let directionLight: THREE.DirectionalLight
let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;

const RADIUS: number = 1000 // 地球半径
let earth: THREE.Mesh

const lngLat = [121.5, 30.5] // 上海的经纬度（测试经纬度转球面坐标）

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
  initAxesHelper()
  initLight()
  initControls()
  initMesh()
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
  renderer.toneMappingExposure = 1.2
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, RADIUS * 5)
  camera.position.z = RADIUS * -2.2
  camera.position.y = RADIUS * 1
  camera.position.x = RADIUS * -1
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(RADIUS * 1.5)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.4 // 强度
  light.position.set(0, 0, 0)

  // 方向光，平行光，模拟太阳光
  directionLight = new THREE.DirectionalLight()
  directionLight.position.set(RADIUS * -5, RADIUS * 5, RADIUS * -5)
  directionLight.intensity = 0.8

  if (scene) {
    scene.add(light)
    scene.add(directionLight)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.target.set(0, 0, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
    controls.maxPolarAngle = Math.PI
    controls.minDistance = RADIUS * 1.05
    controls.maxDistance = RADIUS * 3
    controls.rotateSpeed = 0.5
    controls.zoomSpeed = 1.0
    // 监听 controls 状态发生改变的事件
    controls.addEventListener('change', (e) => {
      const distance: number = controls.getDistance()
      controls.rotateSpeed = 0.5 * (distance / (controls.maxDistance * 2))
      controls.zoomSpeed = 0.5 * (distance / (controls.maxDistance * 2))
    })
  }
}

const initMesh = (): void => {
  const textureLoad = new THREE.TextureLoader()

  const mapTexturen = textureLoad.load('/textures/planet/earth_atmos_2048.jpg')
  // const normalTexture = textureLoad.load('/textures/planet/earth_normal_2048.jpg')

  const geometry = new THREE.SphereGeometry(RADIUS, 36, 36)
  const material = new THREE.MeshLambertMaterial({
    // side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    // color: new THREE.Color().setHex(0x1111ff),
    map: mapTexturen,
    // normalMap: normalTexture,
  })
  earth = new THREE.Mesh(geometry, material)
  scene?.add(earth)

  // 位置测试（经纬度 --> 球面坐标）
  const point = new THREE.Mesh(
    new THREE.IcosahedronGeometry(6, 0),
    new THREE.MeshLambertMaterial({
      color: 0xff1155
    })
  )
  const position = lngLatToXYZ(lngLat, RADIUS)
  point.position.set(position.x, position.y, position.z)
  scene?.add(point)

  initWorld()
}

const initWorld = (): void => {
  const fileLoader = new THREE.FileLoader() // 文件加载器
  fileLoader.setResponseType('json') // 设置响应的数据类型是 json 类型
  fileLoader.load('/json/world.json', (geo) => {
    console.log(geo)
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
  if (controls) {
    controls.update()
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