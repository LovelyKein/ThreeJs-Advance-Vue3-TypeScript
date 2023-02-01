// 关于经纬度、坐标系转换的工具库

// 经纬度 --> 球面坐标(x, y, z)
/**
 * @param {经纬度} lngLat
 * @param {球半径} radius
 **/
export function lngLatToXYZ(
  lngLat: number[],
  radius: number
): {
  x: number;
  y: number;
  z: number;
} {
  if (!radius) {
    console.error("转换错误，未传递地球半径");
    return { x: 0, y: 0, z: 0 };
  }
  if (lngLat.length !== 2) {
    console.error("转换错误，经纬度错误");
    return { x: 0, y: 0, z: 0 };
  }
  const lng = (lngLat[0] * Math.PI) / 180; // 转弧度值
  const lat = (lngLat[1] * Math.PI) / 180; // 转弧度值

  const threeLng = -lng; // three.js坐标系z坐标轴对应经度-90度，而不是90度

  // 经纬度坐标转球面坐标计算公式
  const x = radius * Math.cos(lat) * Math.cos(threeLng);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(threeLng);
  // 返回球面坐标
  return {
    x,
    y,
    z,
  };
  // const phi = ((90 - lngLat[1]) * Math.PI) / 180
  // const theta = ((90 - lngLat[0]) * Math.PI) / 180
  // return {
  //   x: radius * Math.sin(phi) * Math.cos(theta), // x
  //   y: radius * Math.cos(phi), // y
  //   z: radius * Math.sin(phi) * Math.sin(theta), // z
  // }
}

// 经纬度 --> 墨卡托坐标
/**
 * @param {经纬度} lngLat
 **/
const earthRadius = 6371393 // 地球半径 m
const halfPerimeter = Math.PI * earthRadius // 2 * r * PI
export function lngLatToMercator(lngLat: number[]): {
  x: number;
  y: number;
} {
  const E = lngLat[0]
  const N = lngLat[1]
  const x = (E * halfPerimeter) / 180
  const yLog = Math.log(Math.tan(((90 + N) * Math.PI) / 360)) / (Math.PI / 180)
  const y = (yLog * halfPerimeter) / 180
  return {
    x, // 墨卡托x坐标——对应经度
    y, // 墨卡托y坐标——对应纬度
  };
}

// point-in-polygon库(判断点是否在多边形内)
// github地址：https://github.com/substack/point-in-polygon
/**
 * @param {二维坐标} point
 * @param {多边形二维坐标集合} polygon
 **/
export function pointInPolygon(point: number[], polygon: number[][]) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside
}
