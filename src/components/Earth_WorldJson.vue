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
import { Float32BufferAttribute } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { pointInPolygon } from '@/utils/coordinate'
import Delaunator from 'delaunator' // 计算三角剖面

import { lngLatToXYZ } from '@/utils/coordinate'

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
let clock: THREE.Clock

const RADIUS: number = 1000 // 地球半径

let earth: THREE.Group
let dynamicMeshList = ref<THREE.Mesh[]>([]) // 保存动态圈网格，用来在 帧动画 中做动态效果
const size_dynamicCircle = RADIUS * 0.05

const bufferGap = 20 // 用来分布点之间的间隔 m
const lngLatGap = 1 // 经纬度单位的间隔 lnagLat
let CHINA: number = 0

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
  initClock()
  initMesh()
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
  // renderer.toneMappingExposure = 1.2
}

const initCamera = (): void => {
  camera = new THREE.PerspectiveCamera(60, canvas.value.offsetWidth / canvas.value.offsetHeight, 1, RADIUS * 5)
  camera.position.z = RADIUS * -2
  camera.position.y = RADIUS * 1.5
  camera.position.x = RADIUS * -0.5
}

const initScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
}

const initAxesHelper = (): void => {
  axesHelper = new THREE.AxesHelper(RADIUS * 1.5)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.4 // 强度
  light.position.set(0, 0, 0)

  // 方向光，平行光，模拟太阳光
  directionLight = new THREE.DirectionalLight()
  directionLight.position.set(RADIUS * -5, RADIUS * 5, RADIUS * -5)
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
    controls.maxPolarAngle = Math.PI
    controls.minDistance = RADIUS * 1.001
    controls.maxDistance = RADIUS * 3
    controls.rotateSpeed = 0.5
    controls.zoomSpeed = 0.8
    // 监听 controls 状态发生改变的事件
    controls.addEventListener('change', (e) => {
      const distance: number = controls.getDistance()
      controls.rotateSpeed = 0.5 * (distance / (controls.maxDistance * 5))
      controls.zoomSpeed = 0.5 * (distance / (controls.maxDistance * 2))
    })
  }
}

const initClock = (): void => {
  clock = new THREE.Clock()
}

const initMesh = (): void => {
  earth = new THREE.Group()
  earth.name = 'earth'

  // 创建地球球体
  const segments = RADIUS / bufferGap
  const geometry = new THREE.SphereGeometry(RADIUS - 0.5, segments, segments)
  const material = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 0.95,
    color: new THREE.Color().setHex(0x000101)
  })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.name = 'earth_sphere'
  earth.add(sphere)

  initWorld()
}

interface geoJson {
  geometry: {
    coordinates: number[][][][] | number[][][]
    type: string
  }
  properties: {
    childNum: number
    name: string
  }
}

interface worldData<T> {
  features: T[]
  type: string
}

const initWorld = (): void => {
  const lineGroup = new THREE.Group()
  lineGroup.name = 'boundary_country'

  const lineMap = new window.Map<string, number[]>() // 根据国家名称，保存各自国家边界经纬度的的 Map

  const fileLoader = new THREE.FileLoader() // 文件加载器
  fileLoader.setResponseType('json') // 设置响应的数据类型是 json 类型
  fileLoader.load('/json/world.json', (geo: worldData<geoJson> | any) => {
    geo.features.forEach((country: geoJson) => {
      // 统一数据格式
      if (country.geometry.type === 'MultiPolygon') {
        const coordinates: number[][][] = []
        country.geometry.coordinates.forEach((item: any) => {
          coordinates.push(item[0])
        })
        country.geometry.coordinates = coordinates
      }
      lineMap.set(country.properties.name, []) // 将每个国家的 name 设置为 lineMap key 值
      if (country.properties.name === 'China') {
        CHINA = 5 // 突出显示 China
      } else {
        CHINA = 0
      }
      country.geometry.coordinates.forEach((path) => {
        // 绘制线，将每个国家的边界线合并成一个模型
        const countryLine = (): void => {
          const pointsArr: number[] = [] // 将经纬度转换成 xyz 坐标
          path.forEach((item) => {
            const pointByXYZ = lngLatToXYZ(item as number[], RADIUS + CHINA)
            pointsArr.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
          })
          lineMap.get(country.properties.name)!.push(pointsArr[0], pointsArr[1], pointsArr[2]) // 先存入 第一个点的位置
          // 将从第二个点开始，复制出一个点的位置，存入
          for (let index = 3; index < pointsArr.length; index += 3) {
            lineMap.get(country.properties.name)!.push(
              pointsArr[index],
              pointsArr[index + 1],
              pointsArr[index + 2],
              pointsArr[index],
              pointsArr[index + 1],
              pointsArr[index + 2]
            )
          }
          lineMap.get(country.properties.name)!.push(pointsArr[0], pointsArr[1], pointsArr[2]) // 最后再存入第一个点的位置，使边界闭合
        }
        countryLine()

        // 绘制国家区域面
        drawCountryFace(path as number[][])
      })
    })

    lineMap.forEach((value, key) => {
      const countryBorder = drawCountryBoundary(value, key)
      countryBorder.name = key
      lineGroup.add(countryBorder)
    })
    earth.add(lineGroup)

    // 海量点
    // initPoints(fileLoader, '/json/airports.json').then((point) => {
    //   point.name = 'airport_point'
    //   earth.add(point)
    // })

    // 球面标注，光柱
    initLightCross(fileLoader, '/json/HotNewsData.json').then((news) => {
      news.name = 'news'
      earth.add(news)
    })

    const sprite = initSprite('/sprite/halo.png') // 精灵图
    sprite.name = 'earth_halo_sprite'
    earth.add(sprite)

    scene?.add(earth)
    // console.log(scene?.children)
  })
}

// initWorld 的子方法，绘制国家区域面
const drawCountryFace = (path: number[][]) => {
  const rectangleAreaLngLat: THREE.Vector2[] = [] // 计算的矩形范围的经纬度集合
  const inBoundaryLngLat: number[][] = [] // 计算的在边界线范围内的经纬度集合
  const vectorspoint: number[][] = [] // 有效的三角剖面的经纬度点集合
  const pathByVectoe2 = path.map((point) => {
    return new THREE.Vector2(point[0], point[1])
  })
  const box2 = new THREE.Box2().setFromPoints(pathByVectoe2) // 计算边界点的盒模型
  const max = box2.max // 最大值
  const min = box2.min // 最小值
  const lngCount = Math.ceil((max.x - min.x) / lngLatGap) // 经度上的分割点数
  const latCount = Math.ceil((max.y - min.y) / lngLatGap) // 纬度上的分割点数
  for (let lng = 0; lng <= lngCount; lng++) {
    for (let lat = 0; lat <= latCount; lat++) {
      rectangleAreaLngLat.push(new THREE.Vector2(min.x + lng * lngLatGap, min.y + lat * lngLatGap))
    }
  }
  rectangleAreaLngLat.forEach((point) => {
    const result = pointInPolygon([point.x, point.y], path)
    if (result) {
      inBoundaryLngLat.push([point.x, point.y])
    }
  })
  // if (!inBoundaryLngLat.length) {
  //   inBoundaryLngLat.push()
  // }

  // 利用在区域边界线之内的经纬度点集合计算出绘制 mesh 所需要的三角剖面的点位
  const allLngLat = [...inBoundaryLngLat, ...path] // 包括边界范围的经纬度集合 和 在边界范围内的点阵经纬度集合
  const indexArr = Delaunator.from(allLngLat).triangles // 组成三角剖面所需点的索引
  // 三角剖分获得的三角形索引indexArr需要进行二次处理，删除多边形polygon轮廓外面的三角形对应索引
  for (let index = 0; index < indexArr.length; index += 3) {
    const point_1 = allLngLat[indexArr[index]]
    const point_2 = allLngLat[indexArr[index + 1]]
    const point_3 = allLngLat[indexArr[index + 2]]

    // 三角形重心坐标计算，重心在 边界范围内，代表这个三角形是有效的
    const triangleCenter = [(point_1[0] + point_2[0] + point_3[0]) / 3, (point_1[1] + point_2[1] + point_3[1]) / 3]
    const result = pointInPolygon(triangleCenter, path)
    if (result) {
      vectorspoint.push(point_1, point_2, point_3)
    }
  }
  const pointsArr: number[] = [] // 将经纬度转换成 xyz 坐标
  vectorspoint.forEach((item) => {
    const pointByXYZ = lngLatToXYZ(item as number[], RADIUS + CHINA - 0.2)
    pointsArr.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
  })
  const geometry = new THREE.BufferGeometry()
  const vectors = new Float32Array(pointsArr)
  geometry.setAttribute('position', new THREE.BufferAttribute(vectors, 3))
  const material = new THREE.MeshBasicMaterial({
    color: 0x002018,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geometry, material)
  earth?.add(mesh)
}

// 经纬度坐标进行排序
function minMax(arr: number[]) {
  // 数组元素排序
  arr.sort((pre, next) => {
    return pre - next
  });
  // 通过向两侧取整，把经纬度的方位稍微扩大
  return [Math.floor(arr[0]), Math.ceil(arr[arr.length - 1])]
}

const MathCeil = (vector: THREE.Vector2): THREE.Vector2 => {
  let x: number
  let y: number
  x = Math.ceil(Math.abs(vector.x))
  y = Math.ceil(Math.abs(vector.y))
  if (vector.x < 0) {
    x = -x
  }
  if (vector.y < 0) {
    y = -y
  }
  return new THREE.Vector2(x, y)
}

// 改良，将每个国家的边界线合并成一条
const drawCountryBoundary = (points: number[], key: string): THREE.LineSegments => {
  const buffer = new THREE.BufferGeometry()
  buffer.setAttribute('position', new Float32BufferAttribute(points, 3))
  const material = new THREE.LineBasicMaterial({
    color: 0x00aaaa, // 线条颜色
  })
  if (key === 'China') {
    material.color = new THREE.Color().setHex(0xf1ca17)
  }
  const line = new THREE.LineSegments(buffer, material)
  return line
}

// // 传递一组经纬度，绘制线
// const drawLine = (path: number[][], isLoop: boolean = true) => {
//   const pointsByXYZ: number[] = []
//   // 转换成球面坐标
//   path.forEach((item) => {
//     const pointByXYZ = lngLatToXYZ(item, RADIUS)
//     pointsByXYZ.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
//   })
//   const buffer = new THREE.BufferGeometry()
//   buffer.setAttribute('position', new Float32BufferAttribute(pointsByXYZ, 3))
//   // 绘制线的材质 LineBasicMaterial
//   const material = new THREE.LineBasicMaterial({
//     color: 0x00aaaa, // 线条颜色
//   })
//   let line: THREE.LineLoop | THREE.Line
//   if (isLoop) {
//     line = new THREE.LineLoop(buffer, material)
//   } else {
//     line = new THREE.Line(buffer, material)
//   }
//   return line
// }

// 加载 机场位置 海量点
interface airportJson {
  longitude_deg: string
  latitude_deg: string
}
const initPoints = (load: THREE.FileLoader, url: string): Promise<THREE.Points> => {
  return new Promise((resolve) => {
    load.load(url, (json: airportJson[] | any) => {
      const points: number[] = []
      const colors: number[] = []

      const color_1 = new THREE.Color(0x00ffff)
      const color_2 = new THREE.Color(0xffff00)

      // console.log(json)
      json.forEach((item: airportJson, index: number) => {
        if (Number(item.longitude_deg) && Number(item.latitude_deg)) {
          const pointByXYZ = lngLatToXYZ([Number(item.longitude_deg), Number(item.latitude_deg)], RADIUS)
          points.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)

          // color
          const percent = Number((index / json.length).toFixed(2))
          const color = color_1.clone().lerp(color_2, percent)
          colors.push(color.r, color.g, color.b)
        }
      })
      const buffer = new THREE.BufferGeometry()
      buffer.setAttribute('position', new Float32BufferAttribute(points, 3)) // position
      buffer.setAttribute('color', new Float32BufferAttribute(colors, 3)) // color
      const material = new THREE.PointsMaterial({
        size: 2,
        color: 0xffff00,
        sizeAttenuation: true,
        vertexColors: true // 开启顶点颜色
      })
      const point = new THREE.Points(buffer, material)
      resolve(point)
    })
  })
}

interface newsJson {
  name: string
  N: number
  E: number
  title: string
  herf: string
}
// 球面标注绘制（光柱效果）
const initLightCross = (load: THREE.FileLoader, url: string): Promise<THREE.Group> => {
  return new Promise((resolve) => {
    load.load(url, (json: newsJson[] | any) => {
      const news = new THREE.Group()
      news.name = 'news'

      const textureLoad = new THREE.TextureLoader()
      const circleMap = textureLoad.load('/textures/circle.png')
      const lightMap = textureLoad.load('/textures/light_cross.png')
      const dynamicCircle = textureLoad.load('/textures/dynamic_circle.png')

      // 标注网格
      const size = RADIUS * 0.03
      const circleGeometry = new THREE.PlaneGeometry(1, 1) // 此时平面处于 XOY 平面
      const circleMaterial = new THREE.MeshBasicMaterial({
        map: circleMap,
        color: 0x22ffcc,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })

      // 动态光圈 网格
      const circleGeometry_dynamicCircle = new THREE.PlaneGeometry(1, 1) // 此时平面处于 XOY 平面
      const circleMaterial_dynamicCircle = new THREE.MeshBasicMaterial({
        map: dynamicCircle,
        color: 0x22ffcc,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
      })

      // 标注光柱
      const height = RADIUS * 0.15
      const width = RADIUS * 0.03
      const lightGeometry = new THREE.PlaneGeometry(width, height); // 此时平面处于 XOY 平面
      lightGeometry.rotateX(Math.PI / 2) // 沿 X 轴旋转，使其垂直 XOY 平面，与 Z 轴 平行
      lightGeometry.translate(0, 0, height / 2) // 平移使光柱底部起点在 XOY 平面上
      const lightMaterial = new THREE.MeshBasicMaterial({
        map: lightMap,
        color: 0x44ffaa, // 光柱颜色，光柱map贴图是白色，可以通过color调节颜色   
        transparent: true,
        side: THREE.DoubleSide, //双面可见
        depthWrite: false, // 是否对深度缓冲区有任何的影响
      })

      // console.log(json)
      json.forEach((item: newsJson, index: number) => {
        const newItem = new THREE.Group()
        newItem.name = 'newItem'

        const pointByXYZ = lngLatToXYZ([item.E, item.N], RADIUS)
        const coordinateVectorNormal = new THREE.Vector3(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z).normalize()

        // circle 网格
        const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial)
        circleMesh.name = 'circle'
        circleMesh.scale.set(size, size, size)
        circleMesh.position.set(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
        const meshPlaneNormal = new THREE.Vector3(0, 0, 1) // circle 网格的法向量
        circleMesh.quaternion.setFromUnitVectors(meshPlaneNormal, coordinateVectorNormal) // 根据两组向量计算四元数

        // dynamicCircle 动态网格
        const dynamicCircleMesh: THREE.Mesh | any = new THREE.Mesh(circleGeometry_dynamicCircle, circleMaterial_dynamicCircle)
        dynamicCircleMesh.name = 'dynamic_circle'
        dynamicCircleMesh.scale.set(size_dynamicCircle, size_dynamicCircle, 1)
        dynamicCircleMesh.position.set(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
        dynamicCircleMesh.multiple = 2 // 设置动态光圈尺寸的倍数，用于动态光圈动画
        dynamicCircleMesh.quaternion.setFromUnitVectors(meshPlaneNormal, coordinateVectorNormal) // 根据两组向量计算四元数
        dynamicMeshList.value.push(dynamicCircleMesh)

        // light 光柱 网格
        const lightMeshGroup = new THREE.Group() // 光效灯柱网格的组合，每个组合里有 2 个 mesh
        lightMeshGroup.name = 'lightMeshGroup'
        const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial)
        lightMesh.name = 'light'
        lightMeshGroup.add(lightMesh)
        lightMeshGroup.add(lightMesh.clone().rotateZ(Math.PI / 2)) // 复制一个，使两个光柱面交叉垂直
        lightMeshGroup.position.set(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
        const meshLightNormal = new THREE.Vector3(0, 0, 1)
        lightMeshGroup.quaternion.setFromUnitVectors(meshLightNormal, coordinateVectorNormal)

        newItem.add(circleMesh)
        newItem.add(dynamicCircleMesh)
        newItem.add(lightMeshGroup)

        news.add(newItem)
      })
      resolve(news)
    })
  })
}

// 加载 精灵图 Sprite
const initSprite = (url: string): THREE.Sprite => {
  const textureLoader = new THREE.TextureLoader()
  const spriteTexture = textureLoader.load(url) // 加载 精灵图 纹理贴图
  // 创建 精灵图 材质
  const material = new THREE.SpriteMaterial({
    map: spriteTexture,
    transparent: true, // 开启透明
    opacity: 0.8,
  })
  // 创建 精灵图 模型
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(RADIUS * 3, RADIUS * 3, 1) // 缩放 精灵图 以匹配地球模型
  return sprite
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
    const delta = clock.getDelta()
    if (earth) {
      earth.rotation.y += delta * 0.02 // 地球自旋转
    }
    if (dynamicMeshList.value.length) {
      dynamicMeshList.value.forEach((mesh: THREE.Mesh | any, index: number) => {
        // console.log(mesh)
        mesh.multiple += 0.01 // 尺寸系数 1 ～ 2之间
        if (mesh.multiple >= 2) {
          mesh.multiple = 1
        }
        mesh.scale.set(Math.floor(mesh.multiple * size_dynamicCircle), Math.floor(mesh.multiple * size_dynamicCircle), 1)
        if (mesh.multiple <= 1.5) {
          mesh.material.opacity = (mesh.multiple - 1) * 2 // (1.5-1.0) * 2，保证透明度在0~1之间变化
        } else if (mesh.multiple > 1.5 && mesh.multiple <= 2) {
          mesh.material.opacity = 1 - (mesh.multiple - 1.5) * 2 // 1 - (2.0-1.5) * 2 mesh缩放2倍对应0 缩放1.5被对应1
        } else {
          mesh.multiple = 1.0
        }
      })
    }
    renderer.render(scene, camera)
  }
  if (controls) {
    controls.update()
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