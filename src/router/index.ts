import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: {
      path: "/04",
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
      keys: ["CatmullRomCurve3", "Shape", "ExtrudeGeometry"],
    },
  },
  {
    path: "/09",
    name: "geometry_dynamic",
    component: () => import("@/components/Geometry_Dynamic.vue"),
    meta: {
      label: "动态几何",
      lesson: "09",
      keys: ["TextureLoader", "needsUpdate"],
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
      keys: ["BufferGeometry", "Float32BufferAttribute", "Points"],
    },
  },
  {
    path: "/12",
    name: "Shader_Water_Sky",
    component: () => import("@/components/Shader_Water_SkyBox.vue"),
    meta: {
      label: "Shader Water/Sky",
      lesson: "12",
      keys: ["Water", "Sky", "Points"],
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
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router