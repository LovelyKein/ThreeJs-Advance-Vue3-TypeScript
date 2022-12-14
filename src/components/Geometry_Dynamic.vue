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
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let light: THREE.HemisphereLight
let directionLight: THREE.DirectionalLight
let axesHelper: THREE.AxesHelper;
let controls: FirstPersonControls;
let clock: THREE.Clock

let geometry: THREE.PlaneGeometry


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
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  renderer.shadowMap.enabled = true // 开启阴影渲染
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 2000)
  camera.position.y = 200;
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xaaccff);
  scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);
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
    controls = new FirstPersonControls(camera, canvas.value)
    controls.movementSpeed = 500
    controls.lookSpeed = 0.1
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {
  geometry = new THREE.PlaneGeometry(20000, 20000,  200, 200);
  geometry.rotateX(- Math.PI / 2);
  // const position: any = geometry.attributes.position
  // position.usage = THREE.DynamicDrawUsage;
  // for (let i = 0; i < position.count; i++) {
  //   const y = 35 * Math.sin(i / 2);
  //   position.setY(i, y);
  // }
  const texture = new THREE.TextureLoader().load('/textures/water.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0x0044ff, map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  scene?.add(mesh);
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
    const elapsedTime = clock?.getElapsedTime()
    const delta = clock?.getDelta()
    const position = geometry.attributes.position
    for (let index = 0; index < position.count; index++) {
      const y = 10 * Math.sin(index / 5 + (elapsedTime - index * index / 5))
      position.setY(index, y);
    }
    position.needsUpdate = true;
    renderer.render(scene, camera)
    if (controls) {
      controls.update(delta)
    }
  }
  window.requestAnimationFrame(render)
}

</script>

<style lang='scss' scoped>
.content_box {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: hidden;

  .canvas_box {
    width: 100%;
    height: 100%;

    #canvsa {
      width: 100%;
      height: 100%;
    }
  }

  .clipList {
    position: absolute;
    top: 2rem;
    left: 2rem;
    width: max-content;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    cursor: pointer;
    user-select: none;

    .clipItem {
      padding: 0 0.5rem;
      box-sizing: border-box;
      background-color: #fafafa;
      height: 1.5rem;

      &:hover {
        background-color: #eeeeee;
      }

      p {
        font-size: 0.6rem;
        text-align: center;
        color: #202020;
        line-height: 1.5rem;
      }

      &:first-child {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }

      &:last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }

    .active {
      background-color: #0e8bf8 !important;

      p {
        color: #ffffff !important;
      }
    }
  }
}
</style>