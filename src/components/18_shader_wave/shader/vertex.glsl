precision lowp float;

uniform float uFrequency;
uniform float uScale;
uniform float uNoiseFrequency;
uniform float uNoiseScale;
uniform float uTime; // uTime 变化的时间

varying float v_elevation;

// 2D Random
float random(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

    // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}


void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  float elevation = sin(modelPosition.x * uFrequency + uTime) * sin(modelPosition.z * uFrequency); // 值在 [-1.0, 1.0]
  // 添加随机的噪波
  elevation += abs(noise(vec2(modelPosition.xz) * uNoiseFrequency + uTime) * uNoiseScale);

  // varying 变量赋值（在与海拔缩放比例相乘之与之后的赋值，结果不一样，程序有处理顺序）
  v_elevation = elevation;

  elevation *= uScale; // 海拔起伏缩放比例

  

  modelPosition.y += elevation;

  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}