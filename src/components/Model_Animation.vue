<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
    <ul class="clipList">
      <li class="clipItem" @click="change(item.index)" :class="{active: clipIndex === item.index}" v-for="item in clipList" :key="item.index">
        <p>{{ item.label }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, reactive } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let light: THREE.HemisphereLight
let directionLight: THREE.DirectionalLight
let floor: THREE.Mesh
let gltf_scene: THREE.Group

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock;

let loader: GLTFLoader
let animationClip: THREE.AnimationClip[]
let mixer: THREE.AnimationMixer
let action: THREE.AnimationAction


const canvas = ref()
let clipIndex = ref<number>(0)
let clipList = reactive<{ label: string; index: number }[]>([
  {
    label: '防守',
    index: 0
  },
  {
    label: '跑步',
    index: 1
  },
  {
    label: '展开',
    index: 2
  },
  {
    label: '步行',
    index: 3
  }
])

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
  enableShadow()
  initLoader()
  initClock()
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
  camera.position.set(-3, 3, 5) // 相机位置
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
    controls.target.set(0, 0.5, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
  }
}

const initMesh = (): void => {
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0xbfe3dd })
  )
  floor.rotation.x = -(Math.PI / 2)
  if (scene) {
    scene.add(floor)
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initLoader = (): void => {
  loader = new GLTFLoader()
  loadModel(loader, '/models/Soldier.glb')
}

const loadModel = (loader: GLTFLoader, url: string): void => {
  loader.load('/models/Soldier.glb', (gltf) => {
    gltf_scene = gltf.scene // 模型场景
    gltf_scene.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI) // 利用 四元数 更改模型的方向
    // 开启模型的阴影投射
    gltf_scene.traverse((object: any): void => {
      if (object.isMesh) {
        object.castShadow = true
      }
    })
    animationClip = gltf.animations // 模型的 动画片段 列表
    if (scene && camera) {
      scene.add(gltf_scene)
      camera.lookAt(new THREE.Vector3(0, 0.5, 0))
    }
    initAnimation(gltf_scene) // 初始化动画混合器，初始化动作
  }, (progress) => {
    console.log(progress)
  }, (error) => {
    console.log(error)
  })
}

const initAnimation = (mesh: THREE.Group | THREE.Mesh): void => {
  mixer = new THREE.AnimationMixer(mesh)
  action = mixer.clipAction(animationClip[clipIndex.value])
  action.play()
}

// 点击切换的回调函数
const change = (index: number): void => {
  clipIndex.value = index
  chooseClipAction(clipIndex.value)
}

const chooseClipAction = (index: number): void => {
  if (mixer) {
    mixer.stopAllAction() // 停止所有正在活动的动作
    // action.stop() // 停止
    // action.clampWhenFinished = true // 完成动画时中断
    // action.loop = THREE.LoopOnce // 循环模式： THREE.LoopOnce( 一次 )
    action = mixer.clipAction(animationClip[index])
    action.play() // 播放
  }
}

const enableShadow = (): void => {
  if (renderer) {
    renderer.shadowMap.enabled = true
    floor.receiveShadow = true
    directionLight.castShadow = true
    // directionLight.shadow.mapSize.set(1024, 1024) // 阴影质量
  }
}

const resize = (): void => {
  if (camera && renderer) {
    window.onresize = (): void => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth,  window.innerHeight)
      }
    }
  }
}

const render = (): void => {
  if (scene && camera && renderer) {
    const delta = clock.getDelta()
    renderer.render(scene, camera)
    if (mixer) {
      mixer.update(delta) // 更新动画
    }
    if(controls) {
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