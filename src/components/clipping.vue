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
let floor: THREE.Mesh
let mesh: THREE.Mesh

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;

let clippingPlanes = ref<THREE.Plane[]>([])

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
  initFloor()
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
  camera.position.set(0, 1.5, 5) // 相机位置
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xbfe3dd)
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.4 // 强度
  light.position.set(0, 1, 0)

  // 方向光，平行光，模拟太阳光
  directionLight = new THREE.DirectionalLight()
  directionLight.position.set(5, 5, 5)
  directionLight.intensity = 0.9

  if (scene) {
    scene.add(light)
    scene.add(directionLight)
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
    controls.target.set(0, 1, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
  }
}

const initFloor = (): void => {
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0xbfe3dd, side: THREE.DoubleSide })
  )
  floor.rotation.x = -(Math.PI / 2)
  if (scene) {
    scene.add(floor)
  }
}

const initMesh = (): void => {
  const material: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
    color: 0x80ee10,
    shininess: 100
  })
  mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.5, 0.15, 150, 20),
    material
  )
  mesh.position.set(0, 1.5, 0)
  if (scene) {
    scene.add(mesh)
  }
  // 裁剪 mesh
  const plane = createPlane(new THREE.Vector3(1, 0, 0), 0.2)
  clippingPlanes.value.push(plane)

  // localClipping 只裁剪对应模型
  material.clippingPlanes = clippingPlanes.value // 模型的裁剪平面数组
  material.side = THREE.DoubleSide // 开启材质的双面渲染
  material.clipShadows = true // 开启 阴影的同步 裁剪
  if (renderer) {
    renderer.localClippingEnabled = true
  }

  // globalClipping 对场景中的所有物体裁剪
  // if (renderer) {
  //   renderer.clippingPlanes = clippingPlanes.value
  // }
}

// 创建 裁剪平面
const createPlane = (vector: THREE.Vector3, constant: number): THREE.Plane => {
  const plane = new THREE.Plane(vector, constant)
  return plane
}

const enableShadow = (): void => {
  if (renderer) {
    renderer.shadowMap.enabled = true
    floor.receiveShadow = true
    mesh.castShadow = true
    directionLight.castShadow = true
    directionLight.shadow.mapSize.set(1024, 1024) // 阴影质量
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