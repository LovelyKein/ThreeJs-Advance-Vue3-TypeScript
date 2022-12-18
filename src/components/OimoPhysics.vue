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
import { OimoPhysics } from 'three/examples/jsm/physics/OimoPhysics'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let light: THREE.HemisphereLight
let directionLight: THREE.DirectionalLight
let meshes: THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material>
let plane: THREE.Mesh

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let physics: {
  addMesh: (mesh: THREE.Mesh, physical?: number) => unknown,
  setMeshPosition: (mesh: THREE.Mesh, position: THREE.Vector3, index: number) => unknown
}

let row: number = 10
let count: number = Math.pow(row, 2)
let white: THREE.Color = new THREE.Color().setHex(0xffffff)
let color: THREE.Color = new THREE.Color()
let position: THREE.Vector3 = new THREE.Vector3()

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
  initPhysics()
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
  camera.position.set(5, 5, 5) // 相机位置
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

const initPhysics = async (): Promise<void> => {
  physics = await OimoPhysics()
  physics.addMesh(plane)
  physics.addMesh(meshes, 1)
}

const initMesh = (): void => {
  // plane
  plane = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1, 10),
    new THREE.ShadowMaterial({ // 该材质就是阴影材质
      color: 0x111111 // 此处的颜色是阴影的颜色
    })
  )
  plane.position.set(0, -1, 0)

  const geometry = new THREE.IcosahedronGeometry(0.1, 0) // 正 20 面体
  const material = new THREE.MeshLambertMaterial({ // 镜面反射不强的材质
    color: 0xffffff
  })
  meshes = new THREE.InstancedMesh(geometry, material, count)

  meshes.instanceMatrix.setUsage(THREE.DynamicDrawUsage) // update every frame，每一帧都会更新一次，提高画质

  let matrix: THREE.Matrix4 = new THREE.Matrix4() // 矩阵
  for (let x = 0; x < count; x++) {
    matrix.setPosition(
      Math.random() * 5 - 2.5,
      Math.random() * 5 + 2,
      Math.random() * 2 - 1
    )
    meshes.setMatrixAt(x, matrix)
    meshes.setColorAt(x, color.setHex(0xffffff * Math.random()))
  }

  if (scene) {
    scene.add(meshes)
    scene.add(plane)
  }
}

const enableShadow = (): void => {
  if (renderer) {
    renderer.shadowMap.enabled = true
    directionLight.castShadow = true
    plane.receiveShadow = true
    meshes.castShadow = true
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
    let index = Math.floor(Math.random() * count) // 随机索引 index
    position.set(0, Math.random() * 10, 0) // 随机 y 轴位置， 0～10
    if (physics) {
      // 功能：设置实例网格中对应 index 索引的模型的位置
      physics.setMeshPosition(meshes, position, index) // 第一个参数 mesh， 必须是实例网格 InstancedMesh
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