// 关于经纬度、坐标系转换的工具库

// 经纬度 --> 球面坐标(x, y, z)
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
  if (!lngLat[0] || !lngLat[1]) {
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
    x: x,
    y: y,
    z: z,
  };
}

// point-in-polygon库(判断点是否在多边形内)
// github地址：https://github.com/substack/point-in-polygon
export function pointInPolygon(point: number[], vs: number[][]) {
  var x = point[0],
    y = point[1];
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];
    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};