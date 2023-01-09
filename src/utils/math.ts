/** 数学计算库 **/

interface innerCircle {
  point: number[];
  radius: number;
}
// 计算三角形的内心坐标和内心圆半径
export function getTriangleInnerCircle(
  a: number[],
  b: number[],
  c: number[]
): innerCircle {
  const bc_length = Math.sqrt(
    Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2)
  )
  const ac_length = Math.sqrt(
    Math.pow(c[0] - a[0], 2) + Math.pow(c[1] - a[1], 2)
  )
  const ab_length = Math.sqrt(
    Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)
  )
  const point: number[] = []
  point[0] =
    (bc_length * a[0] + ac_length * b[0] + ab_length * c[0]) /
    (bc_length + ac_length + ab_length)
  point[1] =
    (bc_length * a[1] + ac_length * b[1] + ab_length * c[1]) /
    (bc_length + ac_length + ab_length)
  const p = (bc_length + ac_length + ab_length) / 2
  const triangleArea = Math.sqrt(p * (p - bc_length) * (p - ac_length) * (p - ab_length))
  const radius = (2 * triangleArea) / (bc_length + ac_length + ab_length)
  return {
    point,
    radius
  }
}
