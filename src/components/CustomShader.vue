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

let clock: THREE.Clock

let geometry: THREE.BoxGeometry

interface uniformInterface {
  time: {
    value: number
  };
  colorTexture?: {
    value: THREE.Texture
  };
}
let uniforms_1: uniformInterface
let uniforms_2: uniformInterface


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
  initClock()
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
    alpha: true,
    antialias: true // 抗锯齿
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(canvas.value.offsetWidth, canvas.value.offsetHeight) // 设置尺寸
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(40, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 3000)
  camera.position.z = 4
}

const initScene = (): void => {
  scene = new THREE.Scene()
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {
  geometry = new THREE.BoxGeometry(0.75, 0.75, 0.75)

  // 顶点着色器
  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // 片元着色器
  const fragmentShader_1 = `
    uniform float time;
		varying vec2 vUv;

		void main(void) {
      vec2 p = - 1.0 + 2.0 * vUv;
      float a = time * 40.0;
      float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;

      e = 400.0 * ( p.x * 0.5 + 0.5 );
      f = 400.0 * ( p.y * 0.5 + 0.5 );
      i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
      d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
      r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
      q = f / r;
      e = ( r * cos( q ) ) - a / 2.0;
      f = ( r * sin( q ) ) - a / 2.0;
      d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
      h = ( ( f + d ) + a / 2.0 ) * g;
      i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
      h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
      h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
      i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
      i = mod( i / 5.6, 256.0 ) / 64.0;
      if ( i < 0.0 ) i += 4.0;
      if ( i >= 2.0 ) i = 4.0 - i;
      d = r / 350.0;
      d += sin( d * d * 8.0 ) * 0.52;
      f = ( sin( a * g ) + 1.0 ) / 2.0;
      gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
    }
  `

  const fragmentShader_2 = `
    uniform float time;
    uniform sampler2D colorTexture;
    varying vec2 vUv;

    void main( void ) {
      vec2 position = - 1.0 + 2.0 * vUv;

      float a = atan( position.y, position.x );
      float r = sqrt( dot( position, position ) );

      vec2 uv;
      uv.x = cos( a ) / r;
      uv.y = sin( a ) / r;
      uv /= 10.0;
      uv += time * 0.05;

      vec3 color = texture2D( colorTexture, uv ).rgb;

      gl_FragColor = vec4( color * r * 1.5, 1.0 );
    }
  `

  const fragmentShader_3 = `
    uniform float time;
    varying vec2 vUv;

    void main( void ) {
      vec2 position = vUv;

      float color = 0.0;
      color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );
      color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );
      color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );
      color *= sin( time / 10.0 ) * 0.5;

      gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );
    }
  `

  const fragmentShader_4 = `
    uniform float time;
    varying vec2 vUv;
    
    void main( void ) {
      vec2 position = - 1.0 + 2.0 * vUv;

      float red = abs( sin( position.x * position.y + time / 5.0 ) );
      float green = abs( sin( position.x * position.y + time / 4.0 ) );
      float blue = abs( sin( position.x * position.y + time / 3.0 ) );
      gl_FragColor = vec4( red, green, blue, 1.0 );
    }
  `

  uniforms_1 = {
    'time': { value: 1.0 }
  };
  uniforms_2 = {
    'time': { value: 1.0 },
    'colorTexture': { value: new THREE.TextureLoader().load('/textures/disturb.jpg') }
  }
  if (uniforms_2.colorTexture) {
    uniforms_2['colorTexture'].value.wrapS = uniforms_2['colorTexture'].value.wrapT = THREE.RepeatWrapping
  }

  const params = [
    [vertexShader, fragmentShader_1, uniforms_1], // 左下
    [vertexShader, fragmentShader_2, uniforms_2], // 左上
    [vertexShader, fragmentShader_3, uniforms_1], // 右下
    [vertexShader, fragmentShader_4, uniforms_1] // 右上
  ]

  for (let index = 0; index < params.length; index++) {
    const material = new THREE.ShaderMaterial({
      uniforms: params[index][2] as any,
      vertexShader: params[index][0] as string,
      fragmentShader: params[index][1] as string
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.x = index - (params.length - 1) / 2
    cube.position.y = index % 2 - 0.5
    scene?.add(cube)
  }
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
  if (scene && camera && renderer && clock) {
    const delta = clock.getDelta()

    uniforms_1['time'].value += delta * 5
    uniforms_2['time'].value = clock.elapsedTime

    for (let i = 0; i < scene.children.length; i++) {
      const cube = scene.children[i]
      cube.rotation.y += delta * 0.5 * (i % 2 ? 1 : - 1)
      cube.rotation.x += delta * 0.5 * (i % 2 ? - 1 : 1)
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