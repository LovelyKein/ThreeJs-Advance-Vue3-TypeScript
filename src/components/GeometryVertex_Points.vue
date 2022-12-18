<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvsa" />
    </div>
  </div>
</template>

<script setup lang='ts'>

/** Composition API **/
import { onMounted, ref, reactive, onUnmounted } from 'vue'

/** Components **/

/** 外部依赖 **/
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let particle: THREE.Points
const mouse: THREE.Vector2 = reactive(new THREE.Vector2(0, 0))

const PARTICLE_SIZE = 20

let rayCaster: THREE.Raycaster
let intersects = ref<any[]>([])
let INTERSECTED: number | null

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
  initRayCaster()
  initMesh()
  render()
  mouseMove()
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
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(45, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 10000)
  camera.position.z = 250
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initRayCaster = () => {
  rayCaster = new THREE.Raycaster()
}

const initMesh = (): void => {

  // 顶点着色器
  const vertexShader = `
    attribute float size;
		attribute vec3 customColor;
		varying vec3 vColor;

		void main() {
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_PointSize = size * ( 300.0 / -mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // 片元着色器
  const fragmentShader = `
    uniform vec3 color;
    uniform sampler2D pointTexture;
    uniform float alphaTest;
		varying vec3 vColor;

		void main() {
      gl_FragColor = vec4( color * vColor, 1.0 );
      gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
      if ( gl_FragColor.a < alphaTest ) discard;
    }
  `

  let boxGeometry: THREE.BufferGeometry = new THREE.BoxGeometry(200, 200, 200, 16, 16, 16)
  // console.log(boxGeometry.attributes)
  // if normal and uv attributes are not removed, mergeVertices() can't consolidate indentical vertices with different normal/uv data
  boxGeometry.deleteAttribute('normal') // 删除属性
  boxGeometry.deleteAttribute('uv')
  boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry) // 利用 BufferGeometryUtils 工具合并掉重合的多余的顶点

  const colors: number[] = [];
  const sizes = [];
  const color = new THREE.Color();
  // console.log(boxGeometry.attributes.position === boxGeometry.getAttribute('position'))
  const count = boxGeometry.attributes.position.count // 点数量
  for (let index = 0; index < count; index++) {
    color.setHSL(0.01 + 0.1 * (index / count), 1.0, 0.5);
    color.toArray(colors, index * 3);
    sizes[index] = PARTICLE_SIZE * 0.5;
  }
  
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', boxGeometry.getAttribute('position'))
  particleGeometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3)) // 在 render() 中使用
  particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: {
        value: new THREE.Color(0xffffff) // uniforms 中的属性必须是 attribute: { value: 值 } 的格式
      },
      pointTexture: {
        value: new THREE.TextureLoader().load('/textures/sprites/ball.png')
      },
      alphaTest: {
        value: 0.9
      }
    },
    vertexShader,
    fragmentShader
  })

  particle = new THREE.Points(particleGeometry, material)
  scene?.add(particle)
}

const mouseMove = (): void => {
  window.addEventListener('mousemove', (e: any) => {
    mouse.x = (e.clientX / canvas.value.offsetWidth) * 2 - 1
    mouse.y = -(e.clientY / canvas.value.offsetHeight) * 2 + 1
  })
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
    particle.rotation.x += 0.002
    particle.rotation.y += 0.002
    if (rayCaster) {
      rayCaster.setFromCamera(mouse, camera)
      intersects.value = rayCaster.intersectObject(particle)
      const attributes = particle.geometry.attributes
      if (intersects.value.length) {
        if (INTERSECTED != intersects.value[0].index) {
          attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
          INTERSECTED = intersects.value[0].index
          attributes.size.array[INTERSECTED] = PARTICLE_SIZE * 1.25
        }
      } else if (INTERSECTED !== null) {
        attributes.size.array[INTERSECTED] = PARTICLE_SIZE
        attributes.size.needsUpdate = true
        INTERSECTED = null
      }
      attributes.size.needsUpdate = true
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
    }
  }
}
</style>