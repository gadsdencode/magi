// Tumultuous Ocean Emergence - Fragment Shader
// Implements realistic water surface rendering with foam, refraction,
// caustics, and proper emergence effects

uniform float uTime;
uniform float uEmergeProgress;
uniform sampler2D uTextTexture;
uniform vec3 uTextColor;
// cameraPosition is provided by Three.js automatically, no need to declare

varying vec2 vUv;
varying float vWave;
varying float vTurbulence;
varying float vFoamIntensity;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vDepth;

// Constants
const float PI = 3.14159265359;
const vec3 WATER_COLOR = vec3(0.0, 0.15, 0.25);
const vec3 FOAM_COLOR = vec3(0.95, 0.98, 1.0);
const vec3 DEEP_WATER = vec3(0.01, 0.08, 0.15);

// Noise function for detail
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

// Fractal Brownian Motion for complex patterns
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Calculate Fresnel effect for water surface
float fresnel(vec3 viewDir, vec3 normal, float ior) {
  float cosTheta = abs(dot(viewDir, normal));
  float r0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
  return r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5.0);
}

// Simulate caustics (light patterns through water)
float caustics(vec2 coord, float time) {
  vec2 uv1 = coord * 3.0 + vec2(time * 0.1, time * 0.08);
  vec2 uv2 = coord * 2.5 - vec2(time * 0.07, -time * 0.1);
  
  float c1 = smoothstep(0.0, 0.1, noise(uv1));
  float c2 = smoothstep(0.0, 0.1, noise(uv2));
  
  return c1 * c2 * 2.0;
}

// Generate dynamic foam patterns
vec3 generateFoam(vec2 coord, float intensity, float time) {
  // Multi-scale foam bubbles
  float foam1 = smoothstep(0.0, 0.3, noise(coord * 20.0 + time * 0.5));
  float foam2 = smoothstep(0.0, 0.4, noise(coord * 35.0 - time * 0.3));
  float foam3 = smoothstep(0.0, 0.2, noise(coord * 50.0 + time * 0.7));
  
  float foamPattern = foam1 * 0.5 + foam2 * 0.3 + foam3 * 0.2;
  foamPattern *= intensity;
  
  // Add sparkle to foam
  float sparkle = smoothstep(0.9, 1.0, noise(coord * 100.0 + time * 2.0));
  foamPattern += sparkle * intensity * 0.3;
  
  return FOAM_COLOR * foamPattern;
}

// Water droplets and spray effect
float waterSpray(vec2 coord, float emergence, float time) {
  float spray = 0.0;
  
  // Only show spray during active emergence
  if (emergence > 0.1 && emergence < 0.9) {
    // Random droplet positions
    float droplets = smoothstep(0.95, 1.0, noise(coord * 30.0 + vec2(time * 5.0, 0.0)));
    
    // Vertical motion for droplets
    float yMotion = fract(time * 2.0 + hash(coord * 10.0));
    droplets *= smoothstep(1.0, 0.0, yMotion);
    
    spray = droplets * (1.0 - abs(emergence - 0.5) * 2.0);
  }
  
  return spray;
}

// Calculate water surface color with all effects
vec3 waterSurfaceColor(vec2 coord, vec3 viewDir, vec3 normal, float depth) {
  // Base water color with depth attenuation
  vec3 waterColor = mix(WATER_COLOR, DEEP_WATER, smoothstep(0.0, 0.3, depth));
  
  // Fresnel reflection
  float fresnelFactor = fresnel(viewDir, normal, 1.333); // Water IOR
  waterColor = mix(waterColor, vec3(0.8, 0.9, 1.0), fresnelFactor * 0.5);
  
  // Caustics
  float causticsPattern = caustics(coord, uTime);
  waterColor += vec3(0.1, 0.2, 0.3) * causticsPattern * smoothstep(0.0, 0.2, depth);
  
  // Sub-surface scattering simulation
  float scattering = smoothstep(0.0, 0.5, vWave) * 0.2;
  waterColor += vec3(0.0, 0.1, 0.15) * scattering;
  
  return waterColor;
}

void main() {
  // Calculate distance from center for circular masking
  vec2 center = vec2(0.5, 0.5);
  float distFromCenter = length(vUv - center);
  
  // Discard pixels outside the circle
  if (distFromCenter > 0.5) {
    discard;
  }
  
  // Sample text texture - the alpha channel contains the text shape
  vec4 textSample = texture2D(uTextTexture, vUv);
  
  // CRITICAL FIX: The text is in the alpha channel
  // Canvas draws white text, so alpha = 1 where text exists, 0 elsewhere
  float textMask = textSample.a;
  
  // Fade effects at circle edges
  float edgeFade = smoothstep(0.5, 0.35, distFromCenter);
  textMask *= edgeFade;
  
  // For debugging - if there's ANY alpha, make it visible
  if (textMask < 0.001) {
    // No text here, but might have water effects
    if (vFoamIntensity < 0.01 * edgeFade) {
      discard; // Nothing to render at all
    }
  }
  
  // Calculate view direction
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  
  // Get water surface color
  vec3 waterColor = waterSurfaceColor(vUv, viewDir, vNormal, vDepth);
  
  // Generate intense foam for tumultuous ocean
  float foamIntensity = vFoamIntensity * 1.5 * edgeFade; // Boost base foam, fade at edges
  
  // Massive foam at breakthrough boundary
  float breakthroughBoundary = smoothstep(0.1, 0.9, uEmergeProgress) * 
                                smoothstep(0.9, 0.1, uEmergeProgress);
  foamIntensity += breakthroughBoundary * 0.8 * edgeFade; // Intense breakthrough foam
  
  // Turbulent foam in rough areas
  foamIntensity += vTurbulence * 0.5 * smoothstep(0.2, 0.8, vWave) * edgeFade;
  
  // Add extra foam at wave peaks
  foamIntensity += smoothstep(0.6, 0.9, vWave) * 0.4 * edgeFade;
  
  // Add circular foam ring at water edge
  float ringFoam = smoothstep(0.45, 0.48, distFromCenter) * 
                    smoothstep(0.5, 0.47, distFromCenter);
  foamIntensity += ringFoam * 0.6;
  
  foamIntensity = clamp(foamIntensity, 0.0, 1.0);
  
  vec3 foam = generateFoam(vUv, foamIntensity, uTime);
  
  // Water spray particles
  float spray = waterSpray(vUv, uEmergeProgress, uTime);
  vec3 sprayColor = FOAM_COLOR * spray;
  
  // Combine water and foam
  vec3 surfaceColor = mix(waterColor, foam, foamIntensity);
  surfaceColor += sprayColor;
  
  // Text emergence masking - Dramatic ocean breakthrough
  float emergenceMask = smoothstep(0.0, 1.0, uEmergeProgress);
  
  // Create organic, turbulent emergence boundary
  float boundaryNoise = fbm(vUv * 15.0 + uTime * 0.2, 3) * 0.15;
  float waveInfluence = vWave * 0.4; // Waves affect emergence
  float turbulentBoundary = vTurbulence * 0.2 * sin(uTime * 3.0);
  
  float organicMask = smoothstep(-0.2, 1.0, 
    emergenceMask + boundaryNoise + waveInfluence + turbulentBoundary);
  
  // Ensure minimum visibility underwater but allow full ocean effects
  organicMask = max(organicMask, emergenceMask * 0.3); // 30% minimum when emerging
  
  // Underwater distortion for submerged parts
  vec2 distortedUv = vUv;
  if (organicMask < 0.7) {
    // Refraction effect for underwater text
    vec2 refraction = vec2(
      noise(vUv * 10.0 + uTime * 0.5),
      noise(vUv * 10.0 + uTime * 0.3 + 100.0)
    ) * 0.02;
    distortedUv += refraction * (1.0 - organicMask);
  }
  
  // Sample text with distortion - use alpha channel as mask
  vec4 distortedTextSample = texture2D(uTextTexture, distortedUv);
  float distortedTextMask = distortedTextSample.a;
  
  // Apply text color with depth-based tinting
  vec3 textColor = uTextColor;
  if (organicMask < 0.7) {
    // Underwater tinting
    textColor = mix(textColor * 0.7, waterColor, 0.3 * (1.0 - organicMask));
  }
  
  // Water film on emerging text (meniscus effect)
  float waterFilm = smoothstep(0.2, 0.8, organicMask) * 
                    smoothstep(1.0, 0.5, organicMask);
  vec3 filmColor = mix(textColor, waterColor, 0.7);
  textColor = mix(textColor, filmColor, waterFilm * 0.6);
  
  // Add dripping water effect
  float drips = smoothstep(0.4, 0.6, organicMask) * noise(vUv * 30.0 + uTime * 3.0);
  textColor = mix(textColor, WATER_COLOR, drips * 0.2);
  
  // Combine everything - CRITICAL: Prioritize text color when text exists
  vec3 finalColor;
  if (distortedTextMask > 0.1) {
    // Text exists - make it the primary color with water effects as overlay
    finalColor = textColor;
    // Add subtle water effects on top
    finalColor = mix(finalColor, surfaceColor, (1.0 - organicMask) * 0.3);
  } else {
    // No text - just show water effects
    finalColor = surfaceColor;
  }
  
  // Add surface wetness shine
  float fresnelFactor = fresnel(viewDir, vNormal, 1.333);
  float wetness = smoothstep(0.5, 1.0, organicMask) * 0.3;
  finalColor += vec3(0.1, 0.15, 0.2) * wetness * fresnelFactor;
  
  // Proper ocean emergence with visible text
  float waterEffectsAlpha = (foamIntensity * 0.7 + spray) * edgeFade;
  float alpha;
  
  if (textMask > 0.001) {
    // Text exists - blend it properly with ocean effects
    
    // Calculate how much text is visible based on emergence
    float textVisibility = mix(0.3, 1.0, organicMask); // Text starts 30% visible underwater
    
    // Mix text color with water based on submersion
    vec3 textWithOcean;
    if (organicMask < 0.9) {
      // Underwater or emerging - apply full ocean effects
      textWithOcean = mix(surfaceColor, textColor, textVisibility);
      
      // Add refraction distortion color shift
      vec3 refractedColor = textColor;
      refractedColor.b += (1.0 - organicMask) * 0.2; // Blue shift underwater
      refractedColor.g += (1.0 - organicMask) * 0.1; // Slight green tint
      textWithOcean = mix(textWithOcean, refractedColor, 0.3);
      
      // Add caustics on text
      float causticsOnText = caustics(vUv, uTime) * (1.0 - organicMask);
      textWithOcean += vec3(0.1, 0.2, 0.3) * causticsOnText;
    } else {
      // Fully emerged - text with water film and foam
      textWithOcean = textColor;
      
      // Add foam that clings to text
      if (foamIntensity > 0.1) {
        textWithOcean = mix(textWithOcean, FOAM_COLOR, foamIntensity * 0.4);
      }
    }
    
    finalColor = textWithOcean;
    
    // Add dynamic water spray
    if (spray > 0.01) {
      finalColor = mix(finalColor, FOAM_COLOR, spray * 0.5);
    }
    
    // Alpha based on text mask and emergence
    alpha = textMask * mix(0.6, 1.0, organicMask);
    alpha = max(alpha, waterEffectsAlpha);
    
  } else {
    // No text - full water effects
    alpha = waterEffectsAlpha;
  }
  
  gl_FragColor = vec4(finalColor, alpha);
  
  if (gl_FragColor.a < 0.01) discard;
}