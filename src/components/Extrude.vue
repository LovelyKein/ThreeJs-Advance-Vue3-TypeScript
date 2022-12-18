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
let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;



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
  renderer.shadowMap.enabled = true // 开启阴影渲染
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, 1000)
  camera.position.set(100, 100, 300) // 相机位置
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

const initMesh = (): void => {

  // 1. 封闭的 3D 平滑曲线作为挤压模型的扫描路径 new THREE.CatmullRomCurve3(path, closed: boolean, curveType: string)
  const closedSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(- 60, - 100, 60),
    new THREE.Vector3(- 60, 20, 60),
    new THREE.Vector3(- 60, 120, 60),
    new THREE.Vector3(60, 120, -60),
    new THREE.Vector3(60, 20, - 60),
    new THREE.Vector3(60, - 100, - 60)
  ], true, 'catmullrom');
  // 横截面形状： 等边三角形
  const pts_1: THREE.Vector2[] = [], count = 3, radius = 20
  for (let index = 0; index <= count; index++) {
    const angle = (index / count) * Math.PI * 2
    pts_1.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  const shape_1 = new THREE.Shape(pts_1);
  // 挤压模型配置
  const extrudeSettings_1 = {
    steps: 200, // 挤压步数，类似于分段数，值越大，越平滑
    bevelEnabled: false, // 关闭倒角
    extrudePath: closedSpline // 挤压路径
  };
  const geometry_1 = new THREE.ExtrudeGeometry(shape_1, extrudeSettings_1);
  const material_1 = new THREE.MeshLambertMaterial({ color: 0xb00000, wireframe: false });
  const mesh_1 = new THREE.Mesh(geometry_1, material_1);
  scene?.add(mesh_1);

  // 2. 不封闭的曲线
  const randomPoints: THREE.Vector3[] = [];
  for (let index = 0; index < 10; index++) {
    randomPoints.push(new THREE.Vector3((index - 4.5) * 50, THREE.MathUtils.randFloat(- 50, 50), THREE.MathUtils.randFloat(- 50, 50)));
  }
  const randomSpline = new THREE.CatmullRomCurve3(randomPoints);
  const extrudeSettings_2 = {
    steps: 200,
    bevelEnabled: false,
    extrudePath: randomSpline
  };
  const pts_2: THREE.Vector2[] = [], vertex = 5; // vertex 顶点数量
  for (let index = 0; index < vertex * 2; index++) {
    const radius = index % 2 == 1 ? 10 : 20;
    const angle = index / vertex * Math.PI; // (index / (vertex * 2)) / (Math.PI * 2)
    pts_2.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));

  }
  const shape_2 = new THREE.Shape(pts_2);
  const geometry_2 = new THREE.ExtrudeGeometry(shape_2, extrudeSettings_2);
  const material_2 = new THREE.MeshLambertMaterial({ color: 0xff8000, wireframe: false })
  const mesh_2 = new THREE.Mesh(geometry_2, material_2);
  scene?.add(mesh_2);

  // 3. 不同材质同时挤压
  const materials = [material_1, material_2];
  const extrudeSettings_3 = {
    depth: 20, // 挤压长度
    steps: 1, // 步数
    bevelEnabled: true, // 开启倒角
    bevelThickness: 2, // 倒角厚度
    bevelSize: 4, // 倒角大小
    bevelSegments: 1 // 倒角的片段数
  };

  const geometry_3 = new THREE.ExtrudeGeometry(shape_2, extrudeSettings_3);
  const mesh3 = new THREE.Mesh(geometry_3, materials);
  mesh3.position.set(50, 100, 50);
  scene?.add(mesh3)
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