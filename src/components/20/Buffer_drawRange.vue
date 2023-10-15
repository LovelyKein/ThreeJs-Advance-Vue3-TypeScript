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

/** types **/
interface PointData {
  velocity: THREE.Vector3; // 速度向量
  connectionNum: number; // 连接的点的数量
}

/** API **/

/** 属性 **/

/** data **/
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null

let axesHelper: THREE.AxesHelper;
let controls: OrbitControls;

const canvas = ref<HTMLCanvasElement>()

const diameter = 400
const radius = diameter / 2
const count = 500 // 粒子数量
const maxDistance = 50 // 距离内地两个点允许连线
const maxConnection = 20 // 最大允许连接的点数量

const pointData: PointData[] = []
let box: THREE.Group

let points: THREE.Points
let point_position: Float32Array

let line: THREE.LineSegments
let line_position: Float32Array
let line_color: Float32Array

const color_A = new THREE.Color(0x001a3b)
const color_B = new THREE.Color(0x005142)
const color_white = new THREE.Color(0xffffff)
const color_black = new THREE.Color(0x101010)


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
  initMesh()
  render()
  resize()
})

onUnmounted(() => {
  renderer?.dispose()
})

/** 方法 **/
const initRenderer = (): void => {
  const drawCanvas = canvas.value!
  drawCanvas.style['cursor'] = 'pointer'
  renderer = new THREE.WebGLRenderer({
    canvas: drawCanvas,
    alpha: true,
    antialias: true, // 抗锯齿
    precision: 'mediump',
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 设置像素比，提高图形精度
  renderer.setSize(drawCanvas.offsetWidth, drawCanvas.offsetHeight) // 设置尺寸
  renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
}

const initCamera = (): void => {
  const drawCanvas = canvas.value!
  camera = new THREE.PerspectiveCamera(60, drawCanvas.offsetWidth / drawCanvas.offsetHeight, 1, 2000)
  camera.position.set(0, 0, diameter * 2)
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101010)
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(diameter / 20)
  scene?.add(axesHelper)
}

const initControls = (): void => {
  if (camera) {
    controls = new OrbitControls(camera, canvas.value)
    controls.target.set(0, 0, 0) // 设置轨道控制中心
    controls.enableDamping = true // 开启鼠标的动量惯性
    controls.enablePan = false // 禁止拖动
    controls.minDistance = diameter
    controls.maxDistance = diameter * 3
  }
}

const initMesh = (): void => {
  box = new THREE.Group()
  box.name = 'BOX'
  box.visible = true // 可见性
  scene?.add(box)

  const random = (r: number) => {
    return (Math.random() - 0.5) * r * 2
  }

  // helper
  {
    const helper = new THREE.BoxHelper(
      new THREE.Mesh(new THREE.BoxGeometry(diameter, diameter, diameter)),
      0xffffff
    )
    helper.name = 'helper'
    const material = helper.material as THREE.Material
    material.blending = THREE.AdditiveBlending
    material.transparent = true
    material.opacity = 0.1
    material.side = THREE.DoubleSide
    box.add(helper)
    // helper.visible = false

    setTimeout(() => {
      const helper = box.getObjectByName('helper')!
      box.remove(helper) // 只能通过直接父级去删除
    }, 3000)
  }

  // particle
  {
    const point_geometry = new THREE.BufferGeometry()
    point_position = new Float32Array(count * 3) // 3个浮点为一个坐标， x， y， z
    // 循环设置浮点坐标
    for (let i = 0; i < count; i++) {
      const x = random(diameter / 2)
      const y = random(diameter / 2)
      const z = random(diameter / 2)
      point_position[i * 3] = x
      point_position[i * 3 + 1] = y
      point_position[i * 3 + 2] = z

      // 将数据与每一个点关联起来
      pointData.push({
        velocity: new THREE.Vector3(random(1), random(1), random(1)), // 速度向量
        connectionNum: 0 // 已连接点数
      })
    }
    point_geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(point_position, 3).setUsage(THREE.DynamicDrawUsage)
    )
    point_geometry.setDrawRange(0, count) // 设置绘制点数量的范围
    const point_material = new THREE.PointsMaterial({
      size: 3,
      color: 0x98b4d9,
      blending: THREE.AdditiveBlending,
      transparent: true,
      map: new THREE.TextureLoader().load('/textures/sprites/circle.png'),
      depthWrite: false,
      sizeAttenuation: false // 关闭远小近大衰减
    })
    points = new THREE.Points(point_geometry, point_material)
    points.name = 'points'
    box.add(points)
    // points.visible = false
  }

  // line
  {
    // 递归求 n 个点有几种连接方法
    const recursiveAdd = (count: number): number => {
      if (count === 2) {
        return 1
      }
      // res = n-1 + n-2 + ... + 1
      return (count - 1) + recursiveAdd(count - 1)
    }
    // const line_count = (count * (count - 1)) / 2
    const line_count = recursiveAdd(count) // 线段数量
    const point_count = line_count * 2 // 线段需要的点数量
    line_position = new Float32Array(point_count * 3)
    line_color = new Float32Array(point_count * 3)

    const line_geometry = new THREE.BufferGeometry()
    line_geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(line_position, 3).setUsage(THREE.DynamicDrawUsage)
    )
    line_geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(line_color, 3).setUsage(THREE.DynamicDrawUsage)
    )
    line_geometry.setDrawRange(0, 0) // 绘制点数范围
    const line_material = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5
    })
    line = new THREE.LineSegments(line_geometry, line_material)
    line.name = 'line'
    box.add(line)
  }
}

const resize = (): void => {
  if (camera && renderer) {
    window.onresize = (): void => {
      if (camera && renderer) {
        const drawCanvas = canvas.value!
        camera.aspect = drawCanvas.offsetWidth / drawCanvas.offsetHeight
        camera.updateProjectionMatrix()
        renderer.setSize(drawCanvas.offsetWidth, drawCanvas.offsetHeight)
      }
    }
  }
}

const render = (): void => {
  if (!scene || !camera || !renderer) return
  renderer.render(scene, camera)

  box.rotation.y += 0.002


  // 动画
  if (pointData.length) {
    let drawline_point_count = 0 // 绘制线段需要的点数量
    let line_vertex_index = 0 // 线段 position 属性的浮点下标
    let line_color_index = 0 // 线段 color 属性的浮点下标

    pointData.forEach((point) => point.connectionNum = 0) // 每一帧重置连接数

    for (let i = 0; i < count; i++) {
      const oneData_A = pointData[i]
      // 粒子运动
      {
        const { velocity } = oneData_A
        // 给粒子增加运动速度
        point_position[i * 3] += velocity.x
        point_position[i * 3 + 1] += velocity.y
        point_position[i * 3 + 2] += velocity.z

        // 碰撞检测（各个轴向的速度取反）
        if (point_position[i * 3] > radius || point_position[i * 3] < -radius) {
          velocity.x = -velocity.x
        }
        if (point_position[i * 3 + 1] > radius || point_position[i * 3 + 1] < -radius) {
          velocity.y = -velocity.y
        }
        if (point_position[i * 3 + 2] > radius || point_position[i * 3 + 2] < -radius) {
          velocity.z = -velocity.z
        }
      }

      if (oneData_A.connectionNum > maxConnection) continue // A 点的允许连接数 > 最大值

      // line 线
      {
        const nextIndex = i + 1
        for (let n = nextIndex; n < count; n++) {
          const oneData_B = pointData[n]
          if (oneData_B.connectionNum > maxConnection) continue // B 点的允许连接数 > 最大值
          // 计算 A 与 B 之间的距离
          const delta_x = point_position[n * 3] - point_position[i * 3]
          const delta_y = point_position[n * 3 + 1] - point_position[i * 3 + 1]
          const delta_z = point_position[n * 3 + 2] - point_position[i * 3 + 2]
          const distance_A_to_B = Math.sqrt(Math.pow(delta_x, 2) + Math.pow(delta_y, 2) + Math.pow(delta_z, 2))

          // 判断距离是否小于最大阈值
          if (distance_A_to_B < maxDistance) {
            // 增加点的连接数
            oneData_A.connectionNum++
            oneData_B.connectionNum++

            // 透明度根据距离比值计算，两点距离越大，越不可见
            const alpha = 1.0 - (distance_A_to_B / maxDistance)
            // const color = color_A.lerp(color_B, alpha)

            // 设置线段的位置浮点值，每一帧都重新绘制线段
            line_position[line_vertex_index++] = point_position[i * 3] // A_x
            line_position[line_vertex_index++] = point_position[i * 3 + 1] // A_y
            line_position[line_vertex_index++] = point_position[i * 3 + 2] // A_z

            line_position[line_vertex_index++] = point_position[n * 3] // B_x
            line_position[line_vertex_index++] = point_position[n * 3 + 1] // B_y
            line_position[line_vertex_index++] = point_position[n * 3 + 2] // B_z

            line_color[line_color_index++] = alpha // A_r
            line_color[line_color_index++] = alpha // A_g
            line_color[line_color_index++] = alpha // A_b

            line_color[line_color_index++] = alpha // B_r
            line_color[line_color_index++] = alpha // B_g
            line_color[line_color_index++] = alpha // B_b

            // 增加绘制线段数
            drawline_point_count++
          }
        }
      }
    }

    points.geometry.getAttribute('position').needsUpdate = true // 更新点数据渲染

    line.geometry.getAttribute('position').needsUpdate = true
    line.geometry.getAttribute('color').needsUpdate = true
    line.geometry.setDrawRange(0, drawline_point_count * 2)
  }

  renderer.setAnimationLoop(render)
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