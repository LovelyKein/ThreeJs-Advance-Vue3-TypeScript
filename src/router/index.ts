import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: {
      path: "/01",
    },
  },
  {
    path: "/01",
    name: "instancedMesh",
    component: () => import("@/components/InstancedMesh.vue"),
    meta: {
      label: "实例网格",
      lesson: "01",
      keys: ["InstancedMesh", "RayCaster"],
    },
  },
  {
    path: "/02",
    name: "oimoPhysics",
    component: () => import("@/components/OimoPhysics.vue"),
    meta: {
      label: "Aimo 物理",
      lesson: "02",
      keys: ["OimoPhysics"],
    },
  },
  {
    path: "/03",
    name: "animation",
    component: () => import("@/components/Animation.vue"),
    meta: {
      label: "几何动画",
      lesson: "03",
      keys: ["AnimationClip", "AnimationMixer", "KeyframeTrack"],
    },
  },
  {
    path: "/04",
    name: "model_animation",
    component: () => import("@/components/Model_Animation.vue"),
    meta: {
      label: "模型动画",
      lesson: "04",
      keys: ["AnimationClip", "AnimationMixer", "Switch"],
    },
  },
  {
    path: "/05",
    name: "clipping",
    component: () => import("@/components/clipping.vue"),
    meta: {
      label: "几何裁剪",
      lesson: "05",
      keys: ["Clipping", "clippingPlanes"],
    },
  },
  {
    path: "/06",
    name: "skyBox",
    component: () => import("@/components/skyBox.vue"),
    meta: {
      label: "环境贴图",
      lesson: "06",
      keys: ["CubeTextureLoader", "InstancedMesh", "Clock"],
    },
  },
  {
    path: "/07",
    name: "pdb",
    component: () => import("@/components/pdb.vue"),
    meta: {
      label: "PDB 分子",
      lesson: "07",
      keys: ["PDBLoader", "Group"],
    },
  },
  {
    path: "/08",
    name: "extrude",
    component: () => import("@/components/Extrude.vue"),
    meta: {
      label: "几何挤压",
      lesson: "08",
      keys: ["Shape", "ExtrudeGeometry"],
    },
  },
  {
    path: "/09",
    name: "geometry_dynamic",
    component: () => import("@/components/Geometry_Dynamic.vue"),
    meta: {
      label: "动态几何",
      lesson: "09",
      keys: ["TextureLoader", "attributes"],
    },
  },
  {
    path: "/10",
    name: "panorama",
    component: () => import("@/components/Panorama.vue"),
    meta: {
      label: "全景贴图",
      lesson: "10",
      keys: ["ImageLoader", "canvas"],
    },
  },
  {
    path: "/11",
    name: "points",
    component: () => import("@/components/Points.vue"),
    meta: {
      label: "多点网格",
      lesson: "11",
      keys: ["BufferGeometry", "Points"],
    },
  },
  {
    path: "/12",
    name: "Water_Sky",
    component: () => import("@/components/Water_SkyBox.vue"),
    meta: {
      label: "Water / Sky",
      lesson: "12",
      keys: ["Water", "Sky", "Mesh"],
    },
  },
  {
    path: "/13",
    name: "customShader",
    component: () => import("@/components/CustomShader.vue"),
    meta: {
      label: "CustomShader",
      lesson: "13",
      keys: ["VertexShader", "FragmentShader"],
    },
  },
  {
    path: "/14",
    name: "GeometryVertex_Points",
    component: () => import("@/components/GeometryVertex_Points.vue"),
    meta: {
      label: "GeometryVertex_Points",
      lesson: "14",
      keys: ["BufferGeometryUtils", "BoxGeometry"],
    },
  },
  {
    path: "/15",
    name: "EffectComposer",
    component: () => import("@/components/EffectComposer.vue"),
    meta: {
      label: "EffectComposer",
      lesson: "15",
      keys: ["EffectComposer", "GLTFLoader"],
    },
  },
  {
    path: "/16",
    name: "Earth_WorldJson",
    component: () => import("@/components/Earth_WorldJson.vue"),
    meta: {
      label: "Earth_WorldJson",
      lesson: "16",
      keys: ["Earth", "GeoJson"],
    },
  },
  {
    path: "/17",
    name: "Smart_City",
    component: () => import("@/components/Smart_City.vue"),
    meta: {
      label: "Smart_City",
      lesson: "17",
      keys: ["City", "GeoJson"],
    },
  },
  {
    path: "/18",
    name: "Shader_Wave",
    component: () => import("@/components/18/Shader_Wave.vue"),
    meta: {
      label: "Shader_Wave",
      lesson: "18",
      keys: ["Webgl", "Shader", 'Noise'],
    },
  },
  {
    path: "/19",
    name: "Points_Galaxy",
    component: () => import("@/components/19/Points_Galaxy.vue"),
    meta: {
      label: "Points_Galaxy",
      lesson: "19",
      keys: ["Webgl", "Shader", 'Point'],
    },
  },
  {
    path: "/20",
    name: "Buffer_drawRange",
    component: () => import("@/components/20/Buffer_drawRange.vue"),
    meta: {
      label: "BufferGeometry_drawRange",
      lesson: "20",
      keys: ["BufferGeometry", "Point", 'Line'],
    },
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router