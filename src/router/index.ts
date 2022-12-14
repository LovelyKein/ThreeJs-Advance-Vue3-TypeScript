import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
  },
  {
    path: "/05",
    name: "oimoPhysics",
    component: () => import("@/components/OimoPhysics.vue"),
  },
  {
    path: "/07",
    name: "animation",
    component: () => import("@/components/Animation.vue"),
  },
  {
    path: "/08",
    name: "model_animation",
    component: () => import("@/components/Model_Animation.vue"),
  },
  {
    path: "/10",
    name: "clipping",
    component: () => import("@/components/clipping.vue"),
  },
  {
    path: "/12",
    name: "skyBox",
    component: () => import("@/components/skyBox.vue"),
  },
  {
    path: "/15",
    name: "pdb",
    component: () => import("@/components/pdb.vue"),
  },
  {
    path: "/16",
    name: "extrude",
    component: () => import("@/components/Extrude.vue"),
  },
  {
    path: "/19",
    name: "geometry_dynamic",
    component: () => import("@/components/Geometry_Dynamic.vue"),
  },
  {
    path: "/21",
    name: "panorama",
    component: () => import("@/components/Panorama.vue"),
  },
  {
    path: "/22",
    name: "points",
    component: () => import("@/components/Points.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router