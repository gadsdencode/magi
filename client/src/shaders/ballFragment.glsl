// Uniforms
uniform float uTime;
uniform float uEmergeProgress;
uniform sampler2D uTextTexture;
uniform vec3 uTextColor;

// Varyings
varying vec2 vUv;
varying float vNoise;
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {
  // Base color of the 8-ball (deep, dark blue/black)
  vec3 baseColor = vec3(0.01, 0.02, 0.05);

  // --- IMPROVEMENT: Use mix() for a safer and more subtle ink swirl ---
  // Instead of subtracting, we blend between the base color and a darker version.
  float inkSwirl = smoothstep(0.4, 0.8, vNoise);
  vec3 inkColor = baseColor * 0.5; // A darker ink color
  vec3 finalColor = mix(baseColor, inkColor, inkSwirl);

  // Add a subtle fresnel effect for a glassy edge
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = 1.0 - dot(normalize(vNormal), -viewDirection);
  fresnel = pow(fresnel, 2.0);
  finalColor += fresnel * 0.2;

  // Removed specular highlight to avoid large white glare on text

  gl_FragColor = vec4(finalColor, 1.0);
}