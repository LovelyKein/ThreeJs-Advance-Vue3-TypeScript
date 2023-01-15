/** 数学计算库 **/
import { Vector3 } from 'three'

interface circleInfo {
  point: number[];
  radius: number;
}
// 计算三角形的内心坐标和内心圆半径
export function getTriangleInnerCircle(
  a: number[],
  b: number[],
  c: number[]
): circleInfo {
  const bc_length = Math.sqrt(
    Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2)
  );
  const ac_length = Math.sqrt(
    Math.pow(c[0] - a[0], 2) + Math.pow(c[1] - a[1], 2)
  );
  const ab_length = Math.sqrt(
    Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)
  );
  const point: number[] = [];
  point[0] =
    (bc_length * a[0] + ac_length * b[0] + ab_length * c[0]) /
    (bc_length + ac_length + ab_length);
  point[1] =
    (bc_length * a[1] + ac_length * b[1] + ab_length * c[1]) /
    (bc_length + ac_length + ab_length);
  const p = (bc_length + ac_length + ab_length) / 2;
  const triangleArea = Math.sqrt(
    p * (p - bc_length) * (p - ac_length) * (p - ab_length)
  );
  const radius = (2 * triangleArea) / (bc_length + ac_length + ab_length);
  return {
    point,
    radius,
  };
}

// 计算三角形的外心坐标和外心圆半径
export function getTriangleOuterCircle(
  a: number[],
  b: number[],
  c: number[]
): circleInfo {
  const A_1 = 2 * (b[0] - a[0]);
  const B_1 = 2 * (b[1] - a[1]);
  const C_1 =
    Math.pow(b[0], 2) +
    Math.pow(b[1], 2) -
    Math.pow(a[0], 2) -
    Math.pow(a[1], 2);
  const A_2 = 2 * (c[0] - b[0]);
  const B_2 = 2 * (c[1] - b[1]);
  const C_2 =
    Math.pow(c[0], 2) +
    Math.pow(c[1], 2) -
    Math.pow(b[0], 2) -
    Math.pow(b[1], 2);
  // 即 A_1 * x + B_1 * y = C_1      A_2 * x + B_2 * y = C_2   克拉默法则
  const x = (C_1 * B_2 - C_2 * B_1) / (A_1 * B_2 - A_2 * B_1);
  const y = (A_2 * C_1 - A_1 * C_2) / (A_2 * B_1 - A_1 * B_2);
  const radius = Math.sqrt(Math.pow(a[0] - x, 2) + Math.pow(a[1] - y, 2));
  return {
    point: [x, y],
    radius,
  };
}

// 计算两个向量之间的夹角
interface vector3 {
  x: number;
  y: number;
  z: number;
}
type vector_3 = Vector3 | vector3
export function vectorsAngle(A: vector_3, B: vector_3, O: vector_3): number {
  const OA = {
    x: A.x - O.x,
    y: A.y - O.y,
    z: A.z - O.z,
  };
  const OB = {
    x: B.x - O.x,
    y: B.y - O.y,
    z: B.z - O.z,
  };
  const OA_length = Math.sqrt(
    Math.pow(OA.x, 2) + Math.pow(OA.y, 2) + Math.pow(OA.z, 2)
  );
  const OB_length = Math.sqrt(
    Math.pow(OB.x, 2) + Math.pow(OB.y, 2) + Math.pow(OB.z, 2)
  );
  const OA_dot_OB = OA.x * OB.x + OA.y * OB.y + OA.z * OB.z;
  const angle = Math.acos(OA_dot_OB / (OA_length * OB_length));
  return angle;
}

// 数组内 number 元素大小排序
export function minMax(arr: number[]) {
  // 数组元素排序
  arr.sort((pre, next) => {
    return pre - next
  });
  return [arr[0], arr[arr.length - 1]]
}
