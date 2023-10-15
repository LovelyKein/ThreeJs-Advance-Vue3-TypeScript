uniform float uElevation;
uniform vec3 uTopColor;
uniform vec3 uLowColor;

varying float v_elevation;

void main() {
  float strength = (v_elevation + 1.0) / 3.0;
  vec3 mixColor = mix(uLowColor, uTopColor, strength);
  gl_FragColor = vec4(mixColor.xyz, 1.0);
}