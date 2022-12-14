<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, reactive } from 'vue'

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

let points: THREE.Points
let material: THREE.PointsMaterial
const count: number = 10000 // 点数量
const mouse = reactive<{
  x: number;
  y: number
}>({
  x: 0,
  y: 0
})


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
  // initControls()
  initMesh()
  mouseMove()
  enableShadow()
  render()
  resize()
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
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  renderer.shadowMap.enabled = true // 开启阴影渲染
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(55, canvas.value.offsetWidth / canvas.value.offsetHeight, 2, 2000)
  camera.position.z = 500
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, 0.001)
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
    controls.enableDamping = true
  }
}

const initMesh = (): void => {
  // geometry
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const getRandom = (radius: number): number => {
    return Math.random() * radius * 2 - radius
  }
  for (let index = 0; index < count; index++) {
    // 每 3 个数字为一组三维向量点
    vertices.push(getRandom(1000), getRandom(1000), getRandom(1000))
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  // material
  const sprite = new THREE.TextureLoader().load('/textures/sprites/disc.png')
  material = new THREE.PointsMaterial({
    size: 30,
    sizeAttenuation: true, // 开启尺寸远小近大的衰减
    map: sprite, // 贴图纹理
    alphaTest: 0.5,
    transparent: true // // 透明
  })
  material.color.setHSL(1.0, 0.3, 0.7)

  // mesh
  points = new THREE.Points(geometry, material)
  scene?.add(points)
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

const mouseMove = (): void => {
  canvas.value.addEventListener('mousemove', (e: any) => {
    mouse.x = (e.clientX / canvas.value.offsetWidth) * 2 - 1
    mouse.y = -(e.clientY / canvas.value.offsetHeight) * 2 + 1
    console.log(mouse)
  })
}

const render = (): void => {
  if (scene && camera && renderer) {

    const time = Date.now() * 0.00005
    camera.position.x += mouse.x * 5
    camera.position.y += mouse.y * 5
    const h = (360 * (1.0 + time) % 360) / 360
    material.color.setHSL(h, 0.5, 0.5)
    camera.lookAt(new THREE.Vector3(0, 0, 0))

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