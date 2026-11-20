import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import eyesData from '../data/eyes.json'
import { pointer } from '../state'

// The avatar is Harsha's clay portrait turned into a relief: a dense plane pushed
// forward by a depth map (Depth Anything V2), lit from its own normals, with the
// eyes replaced by shader-drawn irises that follow the cursor and blink.

export const AVATAR_W = 6
const SEG = 320
const DEPTH_SCALE = 1.35
const N = eyesData.size

const vert = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDepthScale;
varying vec2 vUv;
varying float vD;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vD = d;
  vec3 p = position;
  p.z += (d - 0.12) * uDepthScale;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uDepth;
uniform float uSize;
uniform vec2 uLook[2];
uniform float uBlink;
uniform vec2 uLight;
uniform float uFade;
uniform vec2 uL[2];
uniform vec2 uR[2];
uniform vec2 uC[2];
uniform float uTop[2];
uniform float uBot[2];
uniform float uIrisR;
varying vec2 vUv;
varying float vD;

vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }

vec2 toUv(vec2 px) { return vec2(px.x / uSize, 1.0 - px.y / uSize); }

// returns rgb in .rgb and coverage in .a
vec4 eye(int i, vec2 px) {
  vec2 l = uL[i]; vec2 r = uR[i];
  if (px.x < l.x || px.x > r.x) return vec4(0.0);
  float t = clamp((px.x - l.x) / (r.x - l.x), 0.0, 1.0);
  float baseY = mix(l.y, r.y, t);
  float bump = 4.0 * t * (1.0 - t);
  float mid = 0.5 * (l.y + r.y);
  float topY = baseY - (mid - uTop[i]) * pow(bump, 0.8);
  float botY = baseY + (uBot[i] - mid) * pow(bump, 0.9);
  if (px.y < topY + 1.6 || px.y > botY) return vec4(0.0);
  float m = smoothstep(topY + 1.6, topY + 2.8, px.y) * smoothstep(botY, botY - 1.2, px.y);

  // closing upper lid (blink): skin sampled just above the lid, dark lash at its edge
  float lidY = mix(topY + 2.0, botY + 1.0, uBlink);
  if (px.y < lidY) {
    vec3 skin = texture2D(uMap, toUv(vec2(px.x, topY - 6.0))).rgb;
    float lash = smoothstep(lidY - 3.0, lidY, px.y);
    return vec4(mix(skin, lin(vec3(0.17, 0.13, 0.11)), lash * step(0.02, uBlink)), m);
  }

  vec3 sclera = texture2D(uMap, vUv).rgb;
  vec2 c = uC[i] + uLook[i] * vec2(11.5, 4.0);
  vec2 d = px - c;
  float rr = length(d) / uIrisR;
  float a = atan(d.y, d.x);
  float streak = 0.5 + 0.5 * sin(a * 23.0 + sin(a * 7.0) * 2.0);
  vec3 iris = mix(vec3(0.15, 0.105, 0.085), vec3(0.37, 0.26, 0.19), smoothstep(0.35, 0.95, rr) * 0.55 + streak * 0.22);
  iris *= mix(1.0, 0.45, smoothstep(0.76, 1.0, rr));
  iris = mix(vec3(0.035, 0.03, 0.03), iris, smoothstep(0.36, 0.43, rr));
  iris = lin(iris);
  float h = length(d / uIrisR - vec2(-0.32, -0.36));
  iris += lin(vec3(0.95)) * (1.0 - smoothstep(0.1, 0.17, h)) * 0.9;
  float h2 = length(d / uIrisR - vec2(0.3, 0.3));
  iris += lin(vec3(0.6)) * (1.0 - smoothstep(0.04, 0.08, h2)) * 0.5;
  float irisMask = 1.0 - smoothstep(0.95, 1.05, rr);
  vec3 col = mix(sclera, iris, irisMask);
  // soft shadow cast by the upper lid
  col *= mix(0.55, 1.0, smoothstep(lidY, lidY + 7.0, px.y));
  return vec4(col, m);
}

void main() {
  vec4 base = texture2D(uMap, vUv);
  float alpha = base.a;
  if (alpha < 0.02) discard;

  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  vec3 col = base.rgb;
  for (int i = 0; i < 2; i++) {
    vec4 e = eye(i, px);
    col = mix(col, e.rgb, e.a);
  }

  // relief lighting from the depth map's own normals
  float k = 1.0 / 512.0;
  float dx = texture2D(uDepth, vUv + vec2(k, 0.0)).r - texture2D(uDepth, vUv - vec2(k, 0.0)).r;
  float dy = texture2D(uDepth, vUv + vec2(0.0, k)).r - texture2D(uDepth, vUv - vec2(0.0, k)).r;
  vec3 n = normalize(vec3(-dx * 22.0, -dy * 22.0, 1.0));
  vec3 L = normalize(vec3(uLight, 1.1));
  float ndl = dot(n, L);
  col *= 0.9 + 0.2 * ndl;
  col += lin(vec3(0.85, 0.9, 1.0)) * pow(max(0.0, 1.0 - n.z), 2.0) * 0.08;

  // hide stretched triangles at the silhouette and fade out the bottom edge
  float grad = length(vec2(dx, dy));
  alpha *= 1.0 - smoothstep(0.05, 0.11, grad) * (1.0 - smoothstep(0.3, 0.5, vD));
  alpha *= smoothstep(0.0, 0.16, vUv.y) * uFade;
  if (alpha < 0.02) discard;

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`

/** world-space position of each eye (plane local, before the group transform) */
export const eyeLocal = eyesData.eyes.map((e) => new THREE.Vector3(
  (e.c[0] / N - 0.5) * AVATAR_W,
  (0.5 - e.c[1] / N) * AVATAR_W,
  0.55,
))

export default function Avatar() {
  const [map, depth] = useTexture(['./avatar/portrait.webp', './avatar/depth.png'])
  const group = useRef<THREE.Group>(null)
  const { camera, size } = useThree()

  const material = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    depth.colorSpace = THREE.NoColorSpace
    const E = eyesData.eyes
    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uMap: { value: map },
        uDepth: { value: depth },
        uDepthScale: { value: DEPTH_SCALE },
        uSize: { value: N },
        uLook: { value: [new THREE.Vector2(), new THREE.Vector2()] },
        uBlink: { value: 0 },
        uLight: { value: new THREE.Vector2(-0.4, 0.5) },
        uFade: { value: 1 },
        uL: { value: E.map((e) => new THREE.Vector2(...(e.l as [number, number]))) },
        uR: { value: E.map((e) => new THREE.Vector2(...(e.rr as [number, number]))) },
        uC: { value: E.map((e) => new THREE.Vector2(...(e.c as [number, number]))) },
        uTop: { value: E.map((e) => e.top) },
        uBot: { value: E.map((e) => e.bot) },
        uIrisR: { value: E[0].r },
      },
    })
  }, [map, depth])

  const geo = useMemo(() => new THREE.PlaneGeometry(AVATAR_W, AVATAR_W, SEG, SEG), [])

  const blink = useRef({ next: 2.5, start: -1 })
  const look = useRef([new THREE.Vector2(), new THREE.Vector2()])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const u = material.uniforms

    // gentle head turn + breathing
    const tx = pointer.active ? pointer.x : Math.sin(t * 0.4) * 0.3
    const ty = pointer.active ? pointer.y : Math.sin(t * 0.3) * 0.15
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, tx * 0.14, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -ty * 0.06, 3, dt)
    // rises up from below the frame as the visitor starts scrolling
    const rk = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
    const rise = 1 - Math.pow(1 - rk, 3)
    g.position.y = -7.5 * (1 - rise) + Math.sin(t * 1.1) * 0.025
    g.visible = rise > 0.001

    // eyes: aim each iris at the cursor, measured from the eye's own spot on screen
    for (let i = 0; i < 2; i++) {
      tmp.copy(eyeLocal[i]).applyMatrix4(g.matrixWorld).project(camera)
      const aspect = size.width / size.height
      let dx = (tx - tmp.x) * aspect
      let dy = ty - tmp.y
      const len = Math.hypot(dx, dy)
      const reach = Math.min(1, len / 0.9)
      if (len > 1e-4) { dx = (dx / len) * reach; dy = (dy / len) * reach }
      // shader works in image pixels where y points down
      look.current[i].x = THREE.MathUtils.damp(look.current[i].x, dx, 12, dt)
      look.current[i].y = THREE.MathUtils.damp(look.current[i].y, -dy, 12, dt)
      ;(u.uLook.value as THREE.Vector2[])[i].copy(look.current[i])
    }

    // blink every few seconds
    const b = blink.current
    if (t > b.next && b.start < 0) b.start = t
    if (b.start >= 0) {
      const k = (t - b.start) / 0.16
      u.uBlink.value = k < 1 ? Math.sin(Math.min(1, k) * Math.PI) : 0
      if (k >= 1) { b.start = -1; b.next = t + 2.5 + Math.random() * 3.5; if (Math.random() < 0.2) b.next = t + 0.25 }
    }

    // light drifts slightly toward the cursor so the relief reads as 3D
    ;(u.uLight.value as THREE.Vector2).set(
      THREE.MathUtils.damp((u.uLight.value as THREE.Vector2).x, -0.35 + tx * 0.5, 2, dt),
      THREE.MathUtils.damp((u.uLight.value as THREE.Vector2).y, 0.5 + ty * 0.3, 2, dt),
    )
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={material} renderOrder={1} />
    </group>
  )
}
