<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Water } from 'three/examples/jsm/objects/Water'
import { Sky } from 'three/examples/jsm/objects/Sky'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock

let cube: THREE.Mesh
let water: Water // 水面
let sky: Sky // 天空
const sunPosition: THREE.Vector3 = new THREE.Vector3(100, 5, 0) // 太阳的位置， 会根据 y 的值 改变太阳的高度（海拔），sky 中的颜色也会随之变化

let pmremGenerator: THREE.PMREMGenerator
let renderTarget: THREE.WebGLRenderTarget


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
  initControls()
  initClock()
  initMesh()
  enableShadow()
  render()
  resize()
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 优化 sky 的渲染

  pmremGenerator = new THREE.PMREMGenerator(renderer)
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 20000)
  camera.position.set(10, 10, 50)
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(10)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.maxPolarAngle = Math.PI * 0.5 // 最大极角（与 xy 平面的夹角）值
    controls.minPolarAngle = Math.PI * 0.1 // 最小极角值
    controls.target.set(0, 10, 0)
    controls.maxDistance = 2000 // 最远距离
    controls.minDistance = 40 // 最近距离
    controls.update()
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {

  // cube
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshStandardMaterial({
      roughness: 0
    })
  )
  scene?.add(cube)

  // Water 类: new Water(geometry: THREE.BufferGeometry, options: WaterOptions): Water
  water = new Water(
    new THREE.PlaneGeometry(20000, 20000), // 平面几何体
    {
      textureWidth: 512, // 纹理宽度
      textureHeight: 512, // 纹理高度
      waterNormals: new THREE.TextureLoader().load('/textures/water/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      }), // 水面的法向纹理贴图
      waterColor: 0x001a1f, // 水的颜色
      sunDirection: sunPosition, // 太阳的位置
      sunColor: 0xffffff, // 太阳的颜色
      distortionScale: 3.7,
      fog: scene?.fog !== undefined
    }
  )
  water.rotation.x = -(Math.PI / 2)
  // console.log(water)
  water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize()
  water.material.uniforms['size'].value = 5 // 水面纹理的尺寸
  scene?.add(water)

  // Sky
  sky = new Sky()
  sky.scale.setScalar(20000) // 天空盒子的比例尺，。默认尺寸是 1 ，此处时放大 20000，与 Water 水面尺寸相符
  // console.log(sky)
  const skyUniforms = sky.material.uniforms
  skyUniforms['sunPosition'].value.copy(sunPosition) // 给天空绑定 太阳 的位置
  skyUniforms['turbidity'].value = 10 // 浑浊度
  skyUniforms['rayleigh'].value = 5 // 发光强度
  skyUniforms['mieCoefficient'].value = 0.005 // 最小系数
  skyUniforms['mieDirectionalG'].value = 0.8
  scene?.add(sky)

  if (renderTarget !== undefined) renderTarget.dispose()

  if (scene) {
    renderTarget = pmremGenerator.fromScene(scene)
    scene.environment = renderTarget.texture // 将 sky 的光照当作 scene 的环境
  }
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
  if (scene && camera && renderer && clock) {
    renderer.render(scene, camera)

    if (water) {
      water.material.uniforms['time'].value += 1 / 60 // 每一帧都更新 time 的值，让 water 有动态的流动和起伏效果
    }

    if (cube) {
      const elapsedTime = clock.getElapsedTime()
      cube.rotation.x = elapsedTime * 0.5
      cube.position.y = Math.sin(elapsedTime) * 5
      cube.rotation.z = -elapsedTime * 0.5
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