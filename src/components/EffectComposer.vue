<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer' // 加载效果处理模块
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass' // 加载 RenderPass 渲染许可模块
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass' // 光辉效果

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let control: OrbitControls
let clock: THREE.Clock

let effectComposer: EffectComposer
let mixer: THREE.AnimationMixer
let model: THREE.Group | THREE.Scene

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
  initLights()
  initControl()
  initEffect()
  initMesh()
  initClock()
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
  // renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ReinhardToneMapping // 莱因哈德 曝光模式
  renderer.toneMappingExposure = Math.pow(1.4, 4) // 曝光度
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(40, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 100)
  camera.position.set(- 5, 2.5, - 3.5)
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initEffect = (): void => {
  if (!scene || !camera || !renderer) {
    return
  }
  const renderPass = new RenderPass(scene, camera)

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.value.offsetWidth, canvas.value.offsetHeight), 1.5, 0.4, 0.85)
  bloomPass.threshold = 0.2 // 阈值
  bloomPass.strength = 2 // 强度
  bloomPass.radius = 0.5 // 半径

  effectComposer = new EffectComposer(renderer)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  effectComposer.setSize(canvas.value.offsetWidth, canvas.value.offsetHeight) // 设置尺寸

  effectComposer.addPass(renderPass);
  effectComposer.addPass(bloomPass)
}

const initLights = (): void => {
  const ambient = new THREE.AmbientLight(0x404040) // 环境光
  const point = new THREE.PointLight(0xffffff, 1) // 点光
  scene?.add(ambient)
  scene?.add(point)
}

const initControl = (): void => {
  if (camera) {
    control = new OrbitControls(camera, canvas.value)
    control.maxPolarAngle = Math.PI * 0.5 // 极角
    control.minDistance = 3 // 最小距离
    control.maxDistance = 10 // 最远距离
  }
}

const initClock = () => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {
  new GLTFLoader().load('/models/PrimaryIonDrive.glb', (gltf) => {
    model = gltf.scene

    mixer = new THREE.AnimationMixer(model)
    const action = mixer.clipAction(gltf.animations[0].optimize())
    action.play()

    scene?.add(model)

    render() // 在模型加载完成后开始渲染
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
  if (effectComposer) {
    const delta = clock.getDelta()
    mixer.update(delta)
    // renderer.render(scene, camera)
    effectComposer.render() // 用 effectComposer 代替渲染
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