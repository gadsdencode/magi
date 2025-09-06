// Billboard text vertex shader
uniform float uTime;

varying vec2 vUv;
varying float vWave;

// Simple 2D noise based on iq
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  // --- ENHANCEMENT: More detailed noise ---
  // Increased loop from 5 to 6 octaves for a higher-fidelity wave motion.
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = m * p + 0.5;
    a *= 0.5;
  }
  return v;
}

void main() {
  vUv = uv;

  // Subtle vertical undulation like being under waves
  float t = uTime * 0.5; // Slightly slowed down time for a more majestic feel
  float n = fbm(uv * 3.0 + vec2(0.0, -t));
  vWave = n;

  vec3 pos = position;
  pos.z += (n - 0.5) * 0.05; // small wobble along view normal

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}