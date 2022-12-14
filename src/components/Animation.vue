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

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let light: THREE.HemisphereLight
let directionLight: THREE.DirectionalLight
let cube: THREE.Mesh<THREE.BufferGeometry, THREE.Material>

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;

let clock: THREE.Clock;
let animationClip: THREE.AnimationClip
let mixer: THREE.AnimationMixer


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
  initControls()
  initMesh()
  initClock()
  initAnimation()
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
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 1000)
  camera.position.set(10, 10, 10) // 相机位置
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x888888)
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.4 // 强度
  light.position.set(0, 1, 0)

  // 方向光，平行光，模拟太阳光
  directionLight = new THREE.DirectionalLight()
  directionLight.position.set(5, 5, -5)

  if (scene) {
    scene.add(light)
    scene.add(directionLight)
  }
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(2)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.target.set(0, 0, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshLambertMaterial({ // 镜面反射不强的材质
    color: 0xff1111,
  })
  cube = new THREE.Mesh(geometry, material)

  if (scene) {
    scene.add(cube)
  }
}

const initAnimation = (): void => {
  // 定义 向量帧动画规则
  const frameList = [0, 1, 2, 3] // 帧 0-1, 1-2 , 2-3

  // 位置 position
  const positionKeyFrame: THREE.VectorKeyframeTrack = new THREE.VectorKeyframeTrack(
    '.position',
    frameList, // 帧
    [
      0, 0, 0, // 0 的位置
      5, 5, 0, // 1 的位置
      5, 0, 0, // 2 的位置
      0, 0, 0 // 3 的位置
    ]
  )
  // 缩放 scale
  const scaleKeyFrame: THREE.VectorKeyframeTrack = new THREE.VectorKeyframeTrack(
    '.scale',
    frameList, // 帧
    [
      1, 1, 1, // 0 三个轴向缩放比
      2, 4, 2,
      3, 2, 1,
      1, 1, 1
    ]
  )

  // 旋转 quaternion
  const xAxis = new THREE.Vector3(1, 0, 0)
  const quaternion_start = new THREE.Quaternion().setFromAxisAngle(xAxis, 0) // 通过绕着一个轴向旋转一个角度，获得四元数值，此时是 x 轴 转 0 deg
  const quaternion_middle = new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI) // 此时是 x 轴 转 180 deg
  const quaternion_end = new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI * 2) // 此时是 x 轴 转 360 deg
  const rotationKeyFrame: THREE.QuaternionKeyframeTrack = new THREE.QuaternionKeyframeTrack(
    '.quaternion',
    frameList, // 帧
    [
      quaternion_start.x, quaternion_start.y, quaternion_start.z, quaternion_start.w,
      quaternion_middle.x, quaternion_middle.y, quaternion_middle.z, quaternion_middle.w,
      quaternion_end.x, quaternion_end.y, quaternion_end.z, quaternion_end.w,
      quaternion_start.x, quaternion_start.y, quaternion_start.z, quaternion_start.w
    ]
  )

  // 颜色 color
  const colorKeyFrame: THREE.ColorKeyframeTrack = new THREE.ColorKeyframeTrack(
    '.material.color',
    frameList,
    [
      1, 0, 0, // r, g, b
      0, 1, 0,
      0, 0, 1,
      1, 0, 0
    ]
  )

  // 线框 wireframe
  const wireframeKeyFrame: THREE.BooleanKeyframeTrack = new THREE.BooleanKeyframeTrack(
    '.material.wireframe',
    frameList,
    [
      false, // 线框模式
      true,
      true,
      false
    ]
  )

  // 不透明度 opacity
  const opacityKeyFrame: THREE.NumberKeyframeTrack = new THREE.NumberKeyframeTrack(
    '.material.opacity',
    frameList,
    [
      1, // 不透明度
      0,
      0,
      1
    ]
  )

  animationClip = new THREE.AnimationClip(
    'Action', // name
    frameList.length - 1, // 持续时间，duration
    [positionKeyFrame, scaleKeyFrame, rotationKeyFrame, colorKeyFrame, wireframeKeyFrame, opacityKeyFrame]
  )
  enableAnimation()
}

const enableAnimation = (): void => {
  mixer = new THREE.AnimationMixer(cube) // 动画混合器
  const clipAction = mixer.clipAction(animationClip)
  clipAction.play()
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
    const delta = clock.getDelta()
    renderer.render(scene, camera)
    mixer.update(delta) // 更新动画
  }
  window.requestAnimationFrame(render)
}

</script>

<style lang='scss' scoped>
.content_box {
  width: 100%;
  height: 100%;
  position: absolute;

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