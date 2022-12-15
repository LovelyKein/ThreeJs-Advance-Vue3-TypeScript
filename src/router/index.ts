import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: {
      path: "/04",
    },
  },
  {
    path: "/04",
    name: "instancedMesh",
    component: () => import("@/components/InstancedMesh.vue"),
    meta: {
      label: "实例网格",
      lesson: "04",
      keys: ["InstancedMesh", "RayCaster"],
    },
  },
  {
    path: "/05",
    name: "oimoPhysics",
    component: () => import("@/components/OimoPhysics.vue"),
    meta: {
      label: "Aimo 物理",
      lesson: "05",
      keys: ["OimoPhysics"],
    },
  },
  {
    path: "/07",
    name: "animation",
    component: () => import("@/components/Animation.vue"),
    meta: {
      label: "几何动画",
      lesson: "07",
      keys: ["AnimationClip", "AnimationMixer", "KeyframeTrack"],
    },
  },
  {
    path: "/08",
    name: "model_animation",
    component: () => import("@/components/Model_Animation.vue"),
    meta: {
      label: "模型动画",
      lesson: "08",
      keys: ["AnimationClip", "AnimationMixer", "Switch"],
    },
  },
  {
    path: "/10",
    name: "clipping",
    component: () => import("@/components/clipping.vue"),
    meta: {
      label: "几何裁剪",
      lesson: "10",
      keys: ["Clipping", "clippingPlanes"],
    },
  },
  {
    path: "/12",
    name: "skyBox",
    component: () => import("@/components/skyBox.vue"),
    meta: {
      label: "环境贴图",
      lesson: "12",
      keys: ["CubeTextureLoader", "InstancedMesh", "Clock"],
    },
  },
  {
    path: "/15",
    name: "pdb",
    component: () => import("@/components/pdb.vue"),
    meta: {
      label: "PDB 分子",
      lesson: "15",
      keys: ["PDBLoader", "Group"],
    },
  },
  {
    path: "/16",
    name: "extrude",
    component: () => import("@/components/Extrude.vue"),
    meta: {
      label: "几何挤压",
      lesson: "16",
      keys: ["CatmullRomCurve3", "Shape", "ExtrudeGeometry"],
    },
  },
  {
    path: "/19",
    name: "geometry_dynamic",
    component: () => import("@/components/Geometry_Dynamic.vue"),
    meta: {
      label: "动态几何",
      lesson: "19",
      keys: ["TextureLoader", "needsUpdate"],
    },
  },
  {
    path: "/21",
    name: "panorama",
    component: () => import("@/components/Panorama.vue"),
    meta: {
      label: "全景贴图",
      lesson: "21",
      keys: ["ImageLoader", "canvas"],
    },
  },
  {
    path: "/22",
    name: "points",
    component: () => import("@/components/Points.vue"),
    meta: {
      label: "多点网格",
      lesson: "22",
      keys: ["BufferGeometry", "Float32BufferAttribute", "Points"],
    },
  },
  {
    path: "/23",
    name: "Shader_Water_Sky",
    component: () => import("@/components/Shader_Water_SkyBox.vue"),
    meta: {
      label: "Shader 水面/天空",
      lesson: "22",
      keys: ["Water", "Sky", "Points"],
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router