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
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader'

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
let loader: PDBLoader



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
  initLoader()
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
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 1000)
  camera.position.set(0, 0, 8) // 相机位置
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
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
    controls.target.set(0, 0, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
  }
}

const initLoader = (): void => {
  loader = new PDBLoader()
  initMesh('/pdb/caffeine.pdb')
}

const initMesh = (url: string): void => {
  loader.load(url, (pdb) => {
    console.log(pdb)
    const { geometryAtoms: { attributes: { color, position } }, geometryBonds, json: { atoms } } = pdb
    // geometryAtoms.attributes.color 原子模型的原子颜色
    // geometryAtoms.attributes.position 原子模型的原子位置
    // geometryBonds.attributes.position 原子模型的化学键
    // json.atoms 元素是数组，数组中的元素 [0 - 2]: 位置信息；[3]:颜色；[4]: lebel文字描述标签

    // const positions = pdb.geometryAtoms.getAttribute('position') // 获取 position 属性
    // const colors = pdb.geometryAtoms.getAttribute('color') // 获取 color 属性
    // console.log(positions === position) // true
    // console.log(colors === color) // true

    // 原子
    const positionAttribute = new THREE.Vector3()
    const colorAttribute = new THREE.Color()
    const atomGroup = new THREE.Group
    atoms.forEach((item) => {
      positionAttribute.set(item[0], item[1], item[2])
      const rgb: number[] = item[3]
      colorAttribute.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
      const geometry = new THREE.IcosahedronGeometry(0.3, 5)
      const material = new THREE.MeshPhongMaterial({
        color: colorAttribute,
        shininess: 90,
        side: THREE.DoubleSide
      })
      const atom = new THREE.Mesh(geometry, material)
      atom.position.copy(positionAttribute)
      atomGroup.add(atom)
    })
    scene?.add(atomGroup)

    // 化学键
    const keysPosition = geometryBonds.getAttribute('position')
    let start = new THREE.Vector3()
    let end = new THREE.Vector3()
    const keyGroup = new THREE.Group
    for (let index = 0; index < keysPosition.count; index += 2) {
      start.x = keysPosition.getX(index)
      start.y = keysPosition.getY(index)
      start.z = keysPosition.getZ(index)

      end.x = keysPosition.getX(index + 1)
      end.y = keysPosition.getY(index + 1)
      end.z = keysPosition.getZ(index + 1)

      const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05)
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 40,
        side: THREE.DoubleSide
      })
      const key = new THREE.Mesh(geometry, material)
      key.position.copy(start)
      key.position.lerp(end, 0.5)
      key.scale.z = start.distanceTo(end) * 10
      key.lookAt(end)
      keyGroup.add(key)
    }
    scene?.add(keyGroup)
  }, () => { }, (error) => {
    console.error(error)
  })
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