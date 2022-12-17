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

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock

const envUrls = ref<string[]>(
  [
    '/textures/park/posx.jpg',
    '/textures/park/negx.jpg',
    '/textures/park/posy.jpg',
    '/textures/park/negy.jpg',
    '/textures/park/posz.jpg',
    '/textures/park/negz.jpg'
  ]
)
let textureCube: THREE.CubeTexture
let meshes: THREE.InstancedMesh
const count: number = 300
const matrix = new THREE.Matrix4()



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
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 1000)
  camera.position.set(8, 0, 8) // 相机位置
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xbfe3dd)

  // 1. 在 load 方法中的 onload 函数中赋值
  // new THREE.CubeTextureLoader().load(envUrls.value, (texture: THREE.CubeTexture) => {
  //   textureCube = texture
  //   if (scene) {
  //     scene.background = textureCube
  //   }
  // })

  // 2. 通过返回值赋值
  textureCube = new THREE.CubeTextureLoader().load(envUrls.value)
  scene.background = textureCube

  initMesh()
}

const initMesh = (): void => {
  const geometry = new THREE.SphereGeometry(0.2, 50, 50)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    envMap: textureCube,
    side: THREE.DoubleSide
  })
  meshes = new THREE.InstancedMesh(geometry, material, count)
  const matrix = new THREE.Matrix4()
  for (let index = 0; index < count; index++) {
    const random = (): number => {
      return Math.random() * 10 - 5 // -5 ~ 5
    }
    const position: THREE.Matrix4 = matrix.setPosition(new THREE.Vector3(random(), random(), random()))
    meshes.setMatrixAt(index, position) // 随机位置
  }
  if (scene) {
    scene.add(meshes)
  }
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(1)
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
    // 时间帧动画，螺旋漏斗状星系
    // const elapsedTime: number = clock.getElapsedTime() // 获取流失的时间
    // for (let index = 0; index < count; index++) {
    //   const position = matrix.setPosition(
    //     new THREE.Vector3(
    //       Math.cos(elapsedTime + index * 0.5) * index * 0.1, // x 轴做往复运动， index 越大，值域越大， 偏移值越大
    //       Math.sin(elapsedTime) * index * 0.05, // y 轴做往复运动， index 越大，值域越大
    //       -Math.sin(elapsedTime + index * 0.5) * index * 0.1
    //     )
    //   )
    //   meshes.setMatrixAt(index, position)
    // }
    // const obj: any = meshes.instanceMatrix
    // obj.needsUpdate = true // 通知实例网格需要更新颜色
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