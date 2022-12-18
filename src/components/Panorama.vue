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

let skyBox: THREE.Mesh


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
  // initLight()
  initControls()
  initMesh()
  enableShadow()
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
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  renderer.shadowMap.enabled = true // 开启阴影渲染
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(90, canvas.value.offsetWidth / canvas.value.offsetHeight, 0.1, 100)
  // camera.position.z = 0.01
  camera.position.set(0, 0, 0.5)
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(1)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.4 // 强度
  light.position.set(0, 1, 0)

  // 方向光，平行光，模拟太阳光
  directionLight = new THREE.DirectionalLight()
  directionLight.position.set(5, 5, 5)
  directionLight.intensity = 0.8

  if (scene) {
    scene.add(light)
    scene.add(directionLight)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.enableZoom = false // 关闭缩放
    controls.enablePan = false // 关闭移动
    controls.enableDamping = true // 开启惯性
    controls.rotateSpeed = -0.25 // 旋转速度
  }
}

const initMesh = (): void => {
  const textures = getTexturesFromAtlasFile('/textures/sun_temple_stripe.jpg', 6)
  const materials: THREE.MeshBasicMaterial[] = []
  for (let index = 0; index < 6; index++) {
    materials.push(new THREE.MeshBasicMaterial({ map: textures[index] }))
  }
  skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials)
  skyBox.geometry.scale(1, 1, - 1)
  scene?.add(skyBox)
}

const getTexturesFromAtlasFile = (imgUrl: string, tilesCount: number): THREE.Texture[] => {
  const textures: THREE.Texture[] = []
  for (let i: number = 0; i < tilesCount; i++) {
    textures[i] = new THREE.Texture()
  }
  new THREE.ImageLoader().load(imgUrl, (image) => {
    let canvas: HTMLCanvasElement
    let context: CanvasRenderingContext2D | null
    const tileWidth = image.height
    for (let index = 0; index < textures.length; index++) {
      canvas = document.createElement('canvas')
      context = canvas.getContext('2d')
      canvas.height = tileWidth
      canvas.width = tileWidth
      context?.drawImage(image, tileWidth * index, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth)
      textures[index].image = canvas
      textures[index].needsUpdate = true
    }
  })
  return textures
}

const enableShadow = (): void => {
  if (renderer) {
    renderer.shadowMap.enabled = true
  }
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
    if (controls) {
      controls.update()
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
}
</style>