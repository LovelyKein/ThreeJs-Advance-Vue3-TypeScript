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
import { BufferAttribute, Float32BufferAttribute } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

import pointInPolygon from 'point-in-polygon'
// import Delaunator from 'delaunator' // 计算三角剖面
import { tin, FeatureCollection, Point } from '@turf/turf'
// import { ConicPolygonGeometry } from 'three-conic-polygon-geometry'
import { lngLatToXYZ } from '@/utils/coordinate'
import { getTriangleInnerCircle } from '@/utils/math'

/** API **/

/** types **/
interface geoJson {
  geometry: {
    coordinates: number[][][] | number[][][][]
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

interface newsJson {
  name: string
  N: number
  E: number
  title: string
  herf: string
}

interface airportJson {
  longitude_deg: string
  latitude_deg: string
}

interface population {
  population: number[][]
}

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
const size_dynamicCircle = RADIUS * 0.04
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
  // initLight()
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
  // renderer.outputEncoding = THREE.sRGBEncoding // 开启 RGB 色值输出解码，会使物体颜色更明亮
  renderer.toneMappingExposure = 1.5
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
  axesHelper = new THREE.AxesHelper(RADIUS * 1.2)
  if (scene) {
    scene.add(axesHelper)
  }
}

const initLight = (): void => {
  light = new THREE.HemisphereLight() // 不传参数，就是白色光
  light.intensity = 0.6 // 强度
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

  initEarth()
  scene?.add(earth)
}

// 初始化地球
const initEarth = (): void => {
  // 创建地球球体
  const segments = 50
  const geometry = new THREE.SphereGeometry(RADIUS - 1, segments, segments) // RADIUS - 1，解决半径长度一样情况下，图形可能会耦合出现问题
  const material = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 0.9,
    color: new THREE.Color().setHex(0x000202)
  })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.name = 'earth_sphere'
  earth.add(sphere)

  const fileLoader = new THREE.FileLoader() // 文件加载器
  fileLoader.setResponseType('json') // 设置响应的数据类型是 json 类型

  // 国家边界线和区域面
  initCountry(fileLoader, '/json/world.json').then((group) => {
    group.name = 'country_boundary'
    earth.add(group)
  })

  // 海量点
  // initPoints(fileLoader, '/json/airports.json').then((point) => {
  //   point.name = 'airport_point'
  //   earth.add(point)
  // })

  // 球面标注，光柱
  // initMark(fileLoader, '/json/HotNewsData.json').then((news) => {
  //   news.name = 'news'
  //   earth.add(news)
  // }, (reason) => {
  //   dynamicMeshList.value = []
  //   console.error(reason)
  // })

  // 人口密度 柱状体 可视化
  initPopulation(fileLoader, '/json/population.json').then((pillar) => {
    pillar.name = 'population_density'
    earth.add(pillar)
  })

  // 精灵图
  initSprite('/sprite/halo.png').then((sprite) => {
    sprite.name = 'earth_halo_sprite'
    earth.add(sprite)
  }) // 精灵图
}

const initCountry = (load: THREE.FileLoader, url: string): Promise<THREE.Group> => {
  return new Promise((resolve) => {
    load.load(url, (res: unknown) => {
      const geo = res as worldData<geoJson>
      // 国家边界线和区域面
      const boundaryGroup = new THREE.Group()

      geo.features.forEach((country: geoJson) => {
        const countryGroup = new THREE.Group()
        countryGroup.name = country.properties.name

        // 统一数据格式
        let polygons: number[][][][] = []
        if (country.geometry.type === "Polygon") {
          polygons = [country.geometry.coordinates as number[][][]]
        } else {
          polygons = country.geometry.coordinates as number[][][][]
        }
        // 突出显示 China
        if (country.properties.name === 'China') {
          // CHINA = 5
          CHINA = 1
        } else {
          CHINA = 0
        }

        // 国家边界线模型
        const lineMesh = drawCountryLine(polygons, country.properties.name)
        countryGroup.add(lineMesh)

        // 国家区域面模型
        // const areaMesh = drawCountryFace(polygons, country.properties.name)
        // countryGroup.add(areaMesh)

        boundaryGroup.add(countryGroup)

        resolve(boundaryGroup)
      })
    })
  })
}

// 绘制国家边界线
const drawCountryLine = (boundaryList: number[][][][], key: string): THREE.LineSegments => {
  // 绘制国家边界线，将每个国家的边界线合并成一个模型
  const boundaryPoints: number[] = [] // 一个国家所有边界的缓冲数据点集合
  boundaryList.forEach((path) => {
    const pointsArr: number[] = [] // 将经纬度转换成 xyz 坐标
    path[0].forEach((item) => {
      const pointByXYZ = lngLatToXYZ(item, RADIUS + CHINA)
      pointsArr.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
    })
    boundaryPoints.push(pointsArr[0], pointsArr[1], pointsArr[2]) // 先存入 第一个点的位置
    // 将从第二个点开始，复制出一个点的位置，存入
    for (let index = 3; index < pointsArr.length; index += 3) {
      boundaryPoints.push(
        pointsArr[index],
        pointsArr[index + 1],
        pointsArr[index + 2],
        pointsArr[index],
        pointsArr[index + 1],
        pointsArr[index + 2]
      )
    }
    boundaryPoints.push(pointsArr[0], pointsArr[1], pointsArr[2]) // 最后再存入第一个点的位置，使边界闭合
  })
  const buffer = new THREE.BufferGeometry()
  buffer.setAttribute('position', new Float32BufferAttribute(boundaryPoints, 3))
  let color: number = 0x00aaaa
  if (key === 'China') {
    color = 0xf1ca17
  }
  const material = new THREE.LineBasicMaterial({
    color, // 线条颜色
  })
  const line = new THREE.LineSegments(buffer, material)
  line.name = key + '_Line'
  return line
}

// 绘制国家区域面
const drawCountryFace = (boundaryList: number[][][][], key: string): THREE.Mesh => {
  const geometryArr: THREE.BufferGeometry[] = []
  boundaryList.forEach((boundary) => {
    const path: number[][] = boundary[0]

    const rectangleAreaLngLat: THREE.Vector2[] = [] // 计算的矩形范围的经纬度集合
    const inBoundaryLngLat: number[][] = [] // 计算的在边界线范围内的经纬度集合
    const vectorspoint: number[][] = [] // 有效的三角剖面的经纬度点集合
    const pathByVectoe2 = path.map((point) => {
      return new THREE.Vector2(point[0], point[1])
    })
    const box2 = new THREE.Box2().setFromPoints(pathByVectoe2) // 计算边界点的盒模型
    const max = box2.max // 最大值
    const min = box2.min // 最小值

    // 根据盒模型的尺寸，确定点阵的间隔
    let lngLatGap: number // 经纬度单位的间隔 lnagLat
    if (Math.abs(max.x - min.x) <= 1) {
      lngLatGap = Math.abs(max.x - min.x) / 5
    } else {
      lngLatGap = 2.5
    }

    const lngCount = Math.ceil(Math.abs(max.x - min.x) / lngLatGap) // 经度上的分割点数
    const latCount = Math.ceil(Math.abs(max.y - min.y) / lngLatGap) // 纬度上的分割点数
    for (let lng = 0; lng <= lngCount; lng++) {
      for (let lat = 0; lat <= latCount; lat++) {
        rectangleAreaLngLat.push(new THREE.Vector2(min.x + lng * lngLatGap, min.y + lat * lngLatGap))
      }
    }
    rectangleAreaLngLat.forEach((point) => {
      const result = pointInPolygon([point.x, point.y], path)
      if (result) {
        inBoundaryLngLat.push([point.x, point.y]) // 计算在边界范围内的点阵集合
      }
    })
    // if (!inBoundaryLngLat.length) {
    //   inBoundaryLngLat.push()
    // }

    // 利用在区域边界线之内的经纬度点集合计算出绘制 mesh 所需要的三角剖面的点位
    const allLngLat = [...path, ...inBoundaryLngLat] // 包括边界范围的经纬度集合 和 在边界范围内的点阵经纬度集合
    const collection: FeatureCollection<Point, any> = {
      type: "FeatureCollection",
      features: allLngLat.map((item) => {
        return {
          geometry: {
            type: "Point",
            coordinates: item
          },
          properties: {},
          type: "Feature"
        }
      })
    }
    const tinPolygon = tin(collection) // 使用点阵集合，分割成三角形
    tinPolygon.features.forEach((item) => {
      const points = item.geometry.coordinates[0]
      // 三角形内心计算，如果内心坐标在 path 边界内，则说明这个三角形剖面是有效的
      const triangleInnerCircle = getTriangleInnerCircle(points[0], points[1], points[2])
      const result = pointInPolygon(triangleInnerCircle.point, path)
      if (result) {
        vectorspoint.push(points[0], points[1], points[2])
      }
    })

    // const indexArr = Delaunator.from(allLngLat).triangles // 组成三角剖面所需点的索引
    // // 三角剖分获得的三角形索引indexArr需要进行二次处理，删除多边形polygon轮廓外面的三角形对应索引
    // for (let index = 0; index < indexArr.length; index += 3) {
    //   const point_1 = allLngLat[indexArr[index]]
    //   const point_2 = allLngLat[indexArr[index + 1]]
    //   const point_3 = allLngLat[indexArr[index + 2]]

    //   // 三角形内心计算，如果内心坐标在 path 边界内，则说明这个三角形剖面是有效的
    //   const triangleInnerCircle = getTriangleInnerCircle(point_1, point_2, point_3)
    //   const result = pointInPolygon(triangleInnerCircle.point, path)
    //   if (result) {
    //     vectorspoint.push(point_1, point_2, point_3)
    //   }
    // }
    const pointsArr: number[] = [] // 将经纬度转换成 xyz 坐标
    vectorspoint.forEach((item) => {
      const pointByXYZ = lngLatToXYZ(item, RADIUS + CHINA)
      pointsArr.push(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
    })
    const geometry = new THREE.BufferGeometry()
    const vectors = new Float32Array(pointsArr)
    geometry.setAttribute('position', new THREE.BufferAttribute(vectors, 3))

    geometryArr.push(geometry)
  })
  const countryGeometry = mergeBufferGeometries(geometryArr)
  // countryGeometry.computeVertexNormals() //如果使用受光照影响材质，需要计算生成法线
  let color: number = 0x001010
  if (key === 'China') {
    // color = 0xffe056
    color = 0xaa2020
  }
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    // wireframe: true
  })
  const mesh = new THREE.Mesh(countryGeometry, material)
  mesh.name = key + '_Area'
  return mesh
}

// 加载 机场位置 海量点
const initPoints = (load: THREE.FileLoader, url: string): Promise<THREE.Points> => {
  return new Promise((resolve) => {
    load.load(url, (res: unknown) => {
      const json = res as airportJson[]
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
          const percent = Number((index / json.length).toFixed(1))
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

// 球面标注绘制（光柱效果）
const initMark = (load: THREE.FileLoader, url: string): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    load.load(url, (buffer: unknown) => {
      const json = buffer as newsJson[]
      const news = new THREE.Group()
      news.name = 'news'

      // 纹理贴图
      const textureLoad = new THREE.TextureLoader()
      const circleMap = textureLoad.load('/textures/circle.png')
      const lightMap = textureLoad.load('/textures/light_cross.png')
      const dynamicCircle = textureLoad.load('/textures/dynamic_circle.png')

      // 标注网格
      const size = RADIUS * 0.02
      const circleGeometry = new THREE.PlaneGeometry(size, size) // 此时平面处于 XOY 平面
      // 动态光圈 网格
      const circleGeometry_dynamicCircle = new THREE.PlaneGeometry(size_dynamicCircle, size_dynamicCircle) // 此时平面处于 XOY 平面
      // 光柱
      const height = RADIUS * 0.15
      const width = RADIUS * 0.02
      const lightGeometry = new THREE.PlaneGeometry(width, height); // 此时平面处于 XOY 平面
      lightGeometry.rotateX(Math.PI / 2) // 沿 X 轴旋转，使其垂直 XOY 平面，与 Z 轴 平行
      lightGeometry.translate(0, 0, height / 2) // 平移使光柱底部起点在 XOY 平面上

      // 生成一个 mark 的方法
      const generateMark = (info: newsJson, color: number | string | THREE.Color): THREE.Group => {
        const newItem = new THREE.Group()
        newItem.name = 'newItem_' + info.name

        const pointByXYZ = lngLatToXYZ([info.E, info.N], RADIUS + 5) // 经纬度 ==> xyz 坐标
        const coordinateVectorNormal = new THREE.Vector3(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z).normalize() // 标记点的单位向量

        // circle 网格
        const circleMaterial = new THREE.MeshBasicMaterial({
          map: circleMap,
          color,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
        const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial)
        circleMesh.name = 'circle'
        circleMesh.position.set(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
        const meshPlaneNormal = new THREE.Vector3(0, 0, 1) // circle 网格的法向量
        circleMesh.quaternion.setFromUnitVectors(meshPlaneNormal, coordinateVectorNormal) // 根据两组向量计算四元数

        // dynamicCircle 动态网格
        const circleMaterial_dynamicCircle = new THREE.MeshBasicMaterial({
          map: dynamicCircle,
          color,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
          alphaTest: 0.1
        })
        const dynamicCircleMesh: THREE.Mesh | any = new THREE.Mesh(circleGeometry_dynamicCircle, circleMaterial_dynamicCircle)
        dynamicCircleMesh.name = 'dynamic_circle'
        dynamicCircleMesh.position.set(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)
        dynamicCircleMesh.multiple = Math.random() + 1 // 设置动态光圈尺寸的倍数，用于动态光圈动画 1~2
        dynamicCircleMesh.quaternion.setFromUnitVectors(meshPlaneNormal, coordinateVectorNormal) // 根据两组向量计算四元数
        dynamicMeshList.value.push(dynamicCircleMesh)

        // light 光柱 网格
        const lightMaterial = new THREE.MeshBasicMaterial({
          map: lightMap,
          color, // 光柱颜色，光柱map贴图是白色，可以通过color调节颜色   
          transparent: true,
          side: THREE.DoubleSide, //双面可见
          depthWrite: false, // 是否对深度缓冲区有任何的影响
        })
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

        return newItem
      }

      // console.log(json)
      json.forEach((item) => {
        let color: number
        if (item.name === '中国') {
          color = 0xf1ca17
        } else {
          color = 0x33cc66
        }
        const markItem = generateMark(item, color)
        news.add(markItem)
      })
      resolve(news)
    }, () => { }, (error) => {
      reject(error)
    })
  })
}

// 球面标注柱状体人口密度可视化
const initPopulation = (load: THREE.FileLoader, url: string): Promise<THREE.Mesh> => {
  return new Promise((resolve) => {
    load.load(url, (res: unknown) => {
      const data: population = res as population

      const pillarArr: THREE.BoxGeometry[] = []

      const color_1 = new THREE.Color(0x0099ff)
      const color_2 = new THREE.Color(0x00ff99) // 最大数值对应柱子颜色

      const densityArr = data.population.map((item) => {
        return item[2]
      })
      const maxDensity = minMax(densityArr)[1] * 0.5 // 计算对比系数，可以调整，以可视化效果最佳为准

      data.population.forEach((item) => {
        const density = item[2]
        const height = density / 10 // z 向长度
        if (height > 1) {
          const colorArr: number[] = []
          const geometry = new THREE.BoxGeometry(4, 4, height)
          const lerpColor = color_1.clone().lerp(color_2.clone(), density / maxDensity) // 根据 人口密度值 混合颜色

          // 顶点颜色
          const position = geometry.getAttribute('position')
          for (let index = 0; index < position.count; index++) {
            // z 轴分段数为 1， 所以只有顶部、底部两圈点
            const axisZ = position.getZ(index)
            // const ratio = (axisZ - RADIUS) / height // 此为转换 z 轴之后的算法
            // colorArr.push(lerpColor.r, lerpColor.g * ratio, lerpColor.b * ratio)
            if (axisZ < 0) {
              colorArr.push(lerpColor.r, lerpColor.g * 0, lerpColor.b * 0)
            } else {
              colorArr.push(lerpColor.r, lerpColor.g * 1, lerpColor.b * 1)
            }
          }

          geometry.translate(0, 0, RADIUS + height / 2 + 1) // 延 z 轴移动，此时 z 最小为 1
          geometry.setAttribute('color', new BufferAttribute(new Float32Array(colorArr), 3))

          const pointByXYZ = lngLatToXYZ([item[0], item[1]], RADIUS)
          geometry.lookAt(new THREE.Vector3(pointByXYZ.x, pointByXYZ.y, pointByXYZ.z)) // 将模型的轴向看向 目标点
          pillarArr.push(geometry)
        }
      })
      const mergePillarGeometry = mergeBufferGeometries(pillarArr)
      const material = new THREE.MeshBasicMaterial({
        // color: 0x00ffff,
        vertexColors: true // 开启顶点颜色
      })
      const pillarMesh = new THREE.Mesh(mergePillarGeometry, material)

      resolve(pillarMesh)
    })
  })
}

// 加载 精灵图 Sprite
const initSprite = (url: string): Promise<THREE.Sprite> => {
  return new Promise((resolve) => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(url, (texture) => {
      // 创建 精灵图 材质
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true, // 开启透明
        opacity: 0.8
      })
      // 创建 精灵图 模型
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(RADIUS * 3, RADIUS * 3, 1) // 缩放 精灵图 以匹配地球模型
      resolve(sprite)
    })
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
    const delta = clock.getDelta()
    if (earth) {
      earth.rotation.y += delta * 0.02 // 地球自旋转
    }
    if (dynamicMeshList.value.length) {
      dynamicMeshList.value.forEach((mesh: THREE.Mesh | any) => {
        // console.log(mesh)
        mesh.multiple += 0.01 // 尺寸系数 1 ～ 2之间
        if (mesh.multiple >= 2) {
          mesh.multiple = 1
        }
        mesh.scale.set(mesh.multiple, mesh.multiple, 1)
        if (mesh.multiple <= 1.5) {
          mesh.material.opacity = (mesh.multiple - 1) * 2 // (1.5-1.0) * 2，保证透明度在0~1之间变化
        } else if (mesh.multiple > 1.5 && mesh.multiple <= 2) {
          mesh.material.opacity = 1 - (mesh.multiple - 1.5) * 2 // 1 - (2.0-1.5) * 2 mesh缩放2倍对应0 缩放1.5被对应1
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

// 大小排序
function minMax(arr: number[]) {
  // 数组元素排序
  arr.sort((pre, next) => {
    return pre - next
  });
  // 通过向两侧取整，把经纬度的方位稍微扩大
  return [arr[0], arr[arr.length - 1]]
}

// // 传递一组经纬度，绘制线
// const drawLine = (path: number[][], color: number | string | THREE.Color) => {
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
//     color, // 线条颜色
//   })
//   const line = new THREE.LineLoop(buffer, material)
//   return line
// }

</script>

<style lang='scss' scoped>
.content_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  color: #ffe056;

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