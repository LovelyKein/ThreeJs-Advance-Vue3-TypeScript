<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, onUnmounted, reactive } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui'

import vertex_shader from './shader/vertex.glsl?raw'
import fragment_shader from './shader/fragment.glsl?raw'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;
let clock: THREE.Clock;

const canvas = ref<HTMLCanvasElement>() // 画布

let plane: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
// 参数
const params = reactive({
  u_scale: 0.05,
  u_frequency: 14.0,
  u_noiseFrequency: 12.0,
  u_noiseScale: 1.6,
  u_topColor: '#ff0000',
  u_lowColor: '#0000ff'
})

// 组件导出的属性数据
defineExpose<{
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null
}>({
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
  initAll()
  render()
  resize()
})

onUnmounted(() => {
  renderer?.dispose()
})

/** 方法 **/
const initRenderer = (): void => {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true // 抗锯齿
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(canvas.value!.offsetWidth, canvas.value!.offsetHeight) // 设置尺寸
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 优化 sky 的渲染
  // renderer.shadowMap.enabled = true // 开启阴影的渲染

  renderer.setClearColor(0x001122, 1.0) // 渲染背景色
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value!.offsetWidth / canvas.value!.offsetHeight, 0.1, 100)
  camera.position.set(1, 1, 1)
}

const initScene = (): void => {
  scene = new THREE.Scene()
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
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

// 初始化场景
const initAll = (): void => {
  if (!scene) return

  const gui = new dat.GUI()

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 500, 500),
    new THREE.ShaderMaterial({
      vertexColors: true,
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uScale: {
          value: params.u_scale
        },
        uFrequency: {
          value: params.u_frequency
        },
        uNoiseFrequency: {
          value: params.u_noiseFrequency
        },
        uNoiseScale: {
          value: params.u_noiseScale
        },
        uTime: {
          value: 0
        },
        uTopColor: {
          value: new THREE.Color(params.u_topColor)
        },
        uLowColor: {
          value: new THREE.Color(params.u_lowColor)
        }
      }
    })
    // new THREE.MeshBasicMaterial()
  )
  plane.rotateX(- Math.PI / 2)
  scene.add(plane)

  gui.add(params, 'u_scale').name('缩放比例').step(0.01).min(0).max(1.0).onChange(() => {
    plane.material.uniforms.uScale.value = params.u_scale
  })
  gui.add(params, 'u_frequency').name('起伏频率').step(0.5).min(1).max(100).onChange(() => {
    plane.material.uniforms.uFrequency.value = params.u_frequency
  })
  gui.add(params, 'u_noiseFrequency').name('噪波频率').step(0.5).min(0).max(100).onChange(() => {
    plane.material.uniforms.uNoiseFrequency.value = params.u_noiseFrequency
  })
  gui.add(params, 'u_noiseScale').name('噪波缩放').step(0.05).min(0.0).max(10).onChange(() => {
    plane.material.uniforms.uNoiseScale.value = params.u_noiseScale
  })
  gui.addColor(params, 'u_topColor').name('颜色-上').onFinishChange((value: string) => {
    plane.material.uniforms.uTopColor.value = new THREE.Color(value)
  })
  gui.addColor(params, 'u_lowColor').name('颜色-下').onFinishChange((value: string) => {
    plane.material.uniforms.uLowColor.value = new THREE.Color(value)
  })
}


const resize = (): void => {
  if (camera && renderer) {
    window.onresize = (): void => {
      if (camera && renderer) {
        camera.aspect = canvas.value!.offsetWidth / canvas.value!.offsetHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.value!.offsetWidth, canvas.value!.offsetHeight)
      }
    }
  }
}

const render = (): void => {
  if (scene && camera && renderer) {
    if (clock && plane) {
      const elapseTime = clock.getElapsedTime()
      plane.material.uniforms.uTime.value = elapseTime
    }
    renderer.render(scene, camera)
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
      cursor: pointer;
    }
  }
}
</style>