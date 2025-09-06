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

// Simple noise for organic edges
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

void main() {
  // Distort UVs like being refracted through water
  float t = uTime * 0.7;
  vec2 flow1 = vec2(sin(t * 0.7), cos(t * 0.5)) * 0.03;
  vec2 flow2 = vec2(cos(t * 0.9), sin(t * 0.6)) * 0.02;
  vec2 uv = vUv + flow1 * (vWave) + flow2 * (vWave * 0.6);

  vec4 tex = texture2D(uTextTexture, uv);
  // Force pure uniform color for maximum readability
  vec3 glyphColor = uTextColor;

  // Emergence mask: start from center, pushed by wave activity
  float radial = smoothstep(0.9, 0.2, length(vUv - 0.5));
  float surge = smoothstep(0.2, 0.8, vWave);
  float emerge = smoothstep(0.0, 1.0, uEmergeProgress);

  // --- ENHANCEMENT: Organic, inky reveal edge ---
  // Modulate the reveal boundary with noise for a less uniform, more natural edge.
  float inkNoise = hash(vUv * 20.0 + uTime * 0.3) * 0.1;
  float oceanReveal = smoothstep(0.05, 0.95, radial * (0.4 + surge * 0.8) * emerge + inkNoise);

  // Boost glyph coverage for crisper readability (gamma lift)
  float glyph = pow(tex.a, 0.6);
  float alpha = glyph * oceanReveal;

  // --- ENHANCEMENT: Shimmering, glowing foam effect ---
  // The foam now animates with time and has a brighter, more emissive quality.
  float foamBoundary = smoothstep(0.0, 0.15, abs(oceanReveal - (0.5 + sin(uTime * 2.0) * 0.05)));
  vec3 color = glyphColor;
  color += foamBoundary * 0.1; // subtle glow only

  gl_FragColor = vec4(color, alpha);
  if (gl_FragColor.a < 0.01) discard;
}