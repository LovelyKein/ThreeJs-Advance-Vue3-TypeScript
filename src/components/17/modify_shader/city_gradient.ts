export default /* glsl */ `
  #ifdef OPAQUE
  diffuseColor.a = 1.0;
  #endif

  // https://github.com/mrdoob/three.js/pull/22425
  #ifdef USE_TRANSMISSION
  diffuseColor.a *= material.transmissionAlpha + 0.1;
  #endif

  // gl_FragColor = vec4( outgoingLight, diffuseColor.a );

  float gradMix = (vPosition.y + uHeight / 2.0) / uHeight;
  // vec3 gradMixColor = mix(outgoingLight, uTopColor, gradMix);
  // gl_FragColor = vec4(gradMixColor, diffuseColor.a);

  // 线性渐变
  // vec3 gradient = mix(outgoingLight, uTopColor, vPosition.y / uHeight);

  // 非线性渐变  小部分楼层太高，不同高度矮楼层颜色对比不明显,可以采用非线性渐变方式调节
  vec3 gradient = mix(outgoingLight, uTopColor, pow(gradMix, 1.0));

  // 在光照影响明暗的基础上，设置渐变   (避免模型材质color属性影响渐变色，设置为默认的纯白色即可)
  outgoingLight = outgoingLight * gradient;
  gl_FragColor = vec4(outgoingLight, diffuseColor.a );

  // 不考虑漫反射材质光照计算的影响 不同面没有明暗变化  没有棱角感
  // gl_FragColor = vec4(gradient, diffuseColor.a);
`