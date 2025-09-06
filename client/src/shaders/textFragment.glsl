// Billboard text fragment shader
uniform float uTime;
uniform float uEmergeProgress;
uniform sampler2D uTextTexture;
uniform vec3 uTextColor;

varying vec2 vUv;
varying float vWave;

// Remap utility
float remap(float v, float a, float b, float c, float d) {
  return c + (v - a) * (d - c) / (b - a);
}

void main() {
  // Distort UVs like being refracted through water
  float t = uTime * 0.7;
  vec2 flow1 = vec2(sin(t * 0.7), cos(t * 0.5)) * 0.03;
  vec2 flow2 = vec2(cos(t * 0.9), sin(t * 0.6)) * 0.02;
  vec2 uv = vUv + flow1 * (vWave) + flow2 * (vWave * 0.6);

  vec4 tex = texture2D(uTextTexture, uv);
  // Use uniform color for maximum readability
  tex.rgb = uTextColor;

  // Emergence mask: start from center, pushed by wave activity
  float radial = smoothstep(0.9, 0.2, length(vUv - 0.5));
  float surge = smoothstep(0.2, 0.8, vWave);
  float emerge = smoothstep(0.0, 1.0, uEmergeProgress);
  float oceanReveal = smoothstep(0.05, 0.95, radial * (0.4 + surge * 0.8) * emerge);

  float alpha = tex.a * oceanReveal;

  // Soft edge foam-like shimmer along reveal boundary
  float foam = smoothstep(0.0, 0.15, abs(oceanReveal - 0.5));
  vec3 color = mix(vec3(0.0), tex.rgb, min(1.0, tex.a * 1.15));
  color += foam * 0.1;

  gl_FragColor = vec4(color, alpha);
  if (gl_FragColor.a < 0.01) discard;
}


