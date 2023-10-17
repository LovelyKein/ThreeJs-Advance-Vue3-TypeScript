<template>
  <div class='content_box'>
    <div class='canvas_box'>
      <canvas ref='canvas' id='canvsa' />
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer' // 加载效果处理模块
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass' // 加载 RenderPass 渲染许可模块
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass' // 光辉效果
// import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass' // 点效果
// import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass' // 抗锯齿
// import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass' // 故障效果
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let control: OrbitControls
let clock: THREE.Clock

let effectComposer: EffectComposer
let model: THREE.Object3D

let techPass: ShaderPass

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
  initMesh()
  initEffect()
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
  // renderer.toneMapping = THREE.ReinhardToneMapping // 莱因哈德 曝光模式
  // renderer.toneMapping = THREE.ACESFilmicToneMapping // 胶片电影 模式
  // renderer.toneMappingExposure = Math.pow(1.4, 4) // 曝光度
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(75, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 100)
  camera.position.set(0, 0, 3)
  camera.updateProjectionMatrix()
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initLights = (): void => {
  const directionLight = new THREE.DirectionalLight('#ffffff' ,1)
  directionLight.castShadow = true // 开启灯光的阴影投射
  directionLight.position.set(0, 0, 200) // 灯光位置
  scene?.add(directionLight)
}

const initControl = (): void => {
  if (camera) {
    control = new OrbitControls(camera, canvas.value)
    control.enableDamping = true
    // control.autoRotate = true // 开启自动旋转
    control.minDistance = 2.5 // 最小距离
    control.maxDistance = 8 // 最远距离
  }
}

const initMesh = (): void => {
  if (!scene) return

  // 加载环境纹理
  const cubeTextureLoader = new THREE.CubeTextureLoader()
  const envMapTexture = cubeTextureLoader.load([
    '/textures/park/posx.jpg',
    '/textures/park/negx.jpg',
    '/textures/park/posy.jpg',
    '/textures/park/negy.jpg',
    '/textures/park/posz.jpg',
    '/textures/park/negz.jpg'
  ])
  scene.background  = envMapTexture // 背景
  scene.environment = envMapTexture // 环境

  // 加载模型
  new GLTFLoader().load('/models/helmet/DamagedHelmet.gltf', (gltf) => {
    model = gltf.scene.children[0]!
    scene?.add(model)
    render() // 在模型加载完成后开始循环渲染
  })
}

const initEffect = (): void => {
  if (!scene || !camera || !renderer) return

  // 创建 效果合成器
  effectComposer = new EffectComposer(renderer)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  effectComposer.setSize(canvas.value.offsetWidth, canvas.value.offsetHeight) // 设置尺寸

  // 添加渲染通道
  const renderPass = new RenderPass(scene, camera)
  effectComposer.addPass(renderPass)

  // 1. 辉光不真实效果
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.value.offsetWidth, canvas.value.offsetHeight), 1.5, 0.4, 0.85)
  bloomPass.threshold = 0.2 // 阈值
  bloomPass.strength = 1 // 强度
  bloomPass.radius = 0.5 // 半径
  bloomPass.enabled = true
  effectComposer.addPass(bloomPass)

  // 2. 点效果
  // const dotScreenPass = new DotScreenPass()
  // dotScreenPass.enabled = false
  // effectComposer.addPass(dotScreenPass)

  // 3. 抗锯齿效果
  // const smaaPass = new SMAAPass(1, 1)
  // effectComposer.addPass(smaaPass)

  // 4. 自定义着色器效果
  const colorParams = { r: 0.2, g: 0.1, b: 0 }
  const shaderPass = new ShaderPass({
    uniforms: {
      // tDiffuse 为叠加效果之前的canvas画布的纹理贴图
      // 需要在 uniforms 中书写并传递 null 值
      tDiffuse: {
        value: null
      },
      uColor: {
        value:new THREE.Color(colorParams.r, colorParams.g, colorParams.b)
      }
    },
    // 顶点着色器
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
    `,
    // 片元着色器
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform vec3 uColor;
      void main() {

        // tDiffuse 为叠加效果之前的canvas画布的纹理贴图
        vec4 color = texture2D(tDiffuse, vUv); // 读取纹理颜色

        // gl_FragColor = vec4(vUv, 0.0, 1.0);
        color.xyz += uColor;
        gl_FragColor = color;
      }
    `
  })
  shaderPass.enabled = false
  effectComposer.addPass(shaderPass)

  // 5. 自定义科技水波纹效果
  const textureLoader = new THREE.TextureLoader()
  const normalTexture = textureLoader.load('/textures/interfaceNormalMap.png')
  techPass = new ShaderPass({
    uniforms: {
      tDiffuse: {
        value: null
      },
      uNormalMap: {
        value: normalTexture
      },
      uTime: {
        value: 0
      }
    },
    vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
    `,
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform sampler2D uNormalMap;
      uniform float uTime;
      void main(){

        vec2 newUv = vUv;
        newUv += sin(newUv.x * 5.0 + uTime * 0.5) * 0.02;

        vec4 color = texture2D(tDiffuse, newUv); // canvas 画布纹理
        vec4 normalColor = texture2D(uNormalMap, vUv); // 传递的法线贴图纹理

        vec3 lightDirection = normalize(vec3(-5, 5, 2)); // 设置光线的角度
        // clamp() 在两个数中计算插值, 小于0取0, 大于1取1
        float lightness = clamp(dot(normalColor.xyz, lightDirection), 0.0, 1.0);
        color.xyz += lightness;
        gl_FragColor = color;
      }
    `
  })
  effectComposer.addPass(techPass)
}

const initClock = () => {
  clock = new THREE.Clock()
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
    const elapsedtime = clock.getElapsedTime()
    // renderer.render(scene, camera)
    effectComposer.render() // 用 effectComposer 代替 renderer 渲染

    // 更新 uniforms 中的 uTime 值, 使着色器中的值动态变化
    techPass.material.uniforms.uTime.value = elapsedtime * 2
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