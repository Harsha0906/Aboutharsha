import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { pointer } from '../state'
import HoloGlow from './HoloGlow'
import { smoothDamp } from '../motion'

// meshopt-compressed + WebP textures (full-quality original: PORTFOLIO/assets-src/myavatar-v1-original.glb)
const URL = './avatar/myavatar.glb'
useGLTF.preload(URL)

/** Model space: head faces +X, Y is up, Z runs left(+) / right(-) */
const EYES = [
  { z: 0.0688, y: 0.1636 },
  { z: -0.0688, y: 0.1595 },
]

// Natural almond eye proportions matching Harsha's facial geometry
const EYE_WIDTH = 0.0260
const EYE_TOP_H = 0.0088
const EYE_BOT_H = 0.0070
const EYEBALL_R = 0.034

// ---------- shirt colour ----------
// The model is one mesh with one baked (Tripo) texture, so the shirt is recoloured in the shader:
// pixels in the shirt's light-blue range (measured in the texture: hue ~204–219°, saturation
// ~0.10–0.25) below the chin get the target colour, keeping their own light/dark shading.
// Preview any option with ?shirt=black | navy | original (and ?shirt=debug to see the mask).
type ShirtOption = 'original' | 'black' | 'navy' | 'debug'
const SHIRT_DEFAULT: ShirtOption = 'navy'
const SHIRTS: Record<Exclude<ShirtOption, 'original'>, { color: string; lift: number }> = {
  black: { color: '#161616', lift: 0.16 }, // soft charcoal cloth, folds still catch light
  navy: { color: '#1b1f3a', lift: 0.12 }, // deep ink navy
  debug: { color: '#ff00ff', lift: 0 },
}
function shirtOption(): ShirtOption {
  const q = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('shirt')
  return q === 'black' || q === 'navy' || q === 'original' || q === 'debug' ? q : SHIRT_DEFAULT
}
const SHIRT = shirtOption()
// average brightness (sRGB luma) of the shirt in the texture; shading is taken relative to it
const SHIRT_MEAN_LUMA = 0.52
// shirt only below this height in model space (the chin is above it); faded over a short band
const SHIRT_MAX_Y = 0.03

export const AVATAR_SCALE_DESKTOP = 4.4
export const AVATAR_SCALE_MOBILE = 3.6

/**
 * Natural, balanced eye texture.
 * Features a well-proportioned iris (not oversized) leaving clear, bright white sclera
 * on both sides, with a rich warm caramel tone and clean specular highlights.
 */
function makeEyeTexture() {
  const W = 1024
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!

  // Clean, bright warm white sclera
  const sg = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W / 2)
  sg.addColorStop(0, '#ffffff')
  sg.addColorStop(0.65, '#fbf8f3')
  sg.addColorStop(1, '#dfd5c8')
  g.fillStyle = sg
  g.fillRect(0, 0, W, H)

  const cx = W / 2
  const cy = H / 2

  // Compact, natural iris size (leaves generous white sclera visible on the sides)
  const irisR = 95

  // Outer dark limbal ring
  g.fillStyle = '#1c1008'
  g.beginPath()
  g.arc(cx, cy, irisR, 0, Math.PI * 2)
  g.fill()

  // Warm caramel / chocolate brown iris gradient
  const ig = g.createRadialGradient(cx, cy, irisR * 0.25, cx, cy, irisR * 0.95)
  ig.addColorStop(0, '#663f23')
  ig.addColorStop(0.5, '#482a15')
  ig.addColorStop(0.85, '#2b1609')
  ig.addColorStop(1, '#180c05')
  g.fillStyle = ig
  g.beginPath()
  g.arc(cx, cy, irisR * 0.95, 0, Math.PI * 2)
  g.fill()

  // Fine radial iris fiber striations
  g.strokeStyle = 'rgba(180, 125, 75, 0.35)'
  g.lineWidth = 1.5
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * irisR * 0.45, cy + Math.sin(a) * irisR * 0.45)
    g.lineTo(cx + Math.cos(a) * irisR * (0.8 + Math.random() * 0.15), cy + Math.sin(a) * irisR * (0.8 + Math.random() * 0.15))
    g.stroke()
  }

  // Centered pupil
  const pupilR = 42
  g.fillStyle = '#080503'
  g.beginPath()
  g.arc(cx, cy, pupilR, 0, Math.PI * 2)
  g.fill()

  // Crisp catchlight reflections
  g.fillStyle = 'rgba(255, 255, 255, 0.95)'
  g.beginPath()
  g.arc(cx + 24, cy - 24, 12, 0, Math.PI * 2)
  g.fill()

  g.fillStyle = 'rgba(255, 255, 255, 0.4)'
  g.beginPath()
  g.arc(cx - 20, cy + 20, 6, 0, Math.PI * 2)
  g.fill()

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export default function Avatar3D() {
  const { scene } = useGLTF(URL)
  const root = useRef<THREE.Group>(null)
  const outer = useRef<THREE.Group>(null)
  const pivots = useRef<(THREE.Group | null)[]>([])
  const lids = useRef<(THREE.Mesh | null)[]>([])
  const { camera, size } = useThree()

  const isMobile = size.width < 768
  const scale = isMobile ? AVATAR_SCALE_MOBILE : AVATAR_SCALE_DESKTOP

  const invRoot = useMemo(() => ({ value: new THREE.Matrix4() }), [])
  const eyeSurfaceX = useMemo(() => ({ value: new THREE.Vector2(0.2, 0.2) }), [])

  // Raycast to find the exact face surface depth at each eye socket
  const surface = useMemo(() => {
    scene.updateMatrixWorld(true)
    const rc = new THREE.Raycaster()
    const xs = EYES.map((e) => {
      rc.set(new THREE.Vector3(2, e.y, e.z), new THREE.Vector3(-1, 0, 0))
      const hits = rc.intersectObject(scene, true)
      // Skip the glasses frame: take the hit closest to where the face surface sits
      const face = hits.find((h) => h.point.x < 0.3) ?? hits[0]
      return face ? face.point.x : 0.2
    })
    return xs
  }, [scene])

  // Custom shader mask: cleanly cuts out ONLY the eye opening to let the 3D eyeballs track through.
  // Preserves 100% of the avatar's authentic materials, textures, and normal maps.
  useEffect(() => {
    eyeSurfaceX.value.set(surface[0], surface[1])
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const mat = m.material as THREE.MeshStandardMaterial
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uInvRoot = invRoot
        sh.uniforms.uEyeX = eyeSurfaceX
        const shirt = SHIRT === 'original' ? null : SHIRTS[SHIRT]
        // uShirt is in sRGB (the shader converts back to linear after applying the shading)
        sh.uniforms.uShirt = { value: new THREE.Color(shirt?.color ?? '#000000').convertLinearToSRGB() }
        sh.uniforms.uShirtOn = { value: shirt ? 1 : 0 }
        sh.uniforms.uShirtLift = { value: shirt?.lift ?? 0 }
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nuniform mat4 uInvRoot;\nvarying vec3 vRootPos;')
          .replace(
            '#include <project_vertex>',
            '#include <project_vertex>\nvRootPos = (uInvRoot * modelMatrix * vec4(transformed, 1.0)).xyz;',
          )
        sh.fragmentShader = sh.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec3 vRootPos;
uniform vec2 uEyeX;
bool inEye(vec2 c, float sx) {
  vec2 d = vec2(vRootPos.z - c.x, vRootPos.y - c.y);
  float u = d.x / ${EYE_WIDTH.toFixed(4)};
  if (abs(u) >= 1.0) return false;
  float curve = sqrt(max(0.0, 1.0 - u * u));
  float topH = ${EYE_TOP_H.toFixed(4)} * curve;
  float botH = ${EYE_BOT_H.toFixed(4)} * curve;
  bool insideY = (d.y >= 0.0) ? (d.y < topH) : (-d.y < botH);
  return insideY && vRootPos.x > sx - 0.015 && vRootPos.x < sx + 0.008;
}
uniform vec3 uShirt;
uniform float uShirtOn;
uniform float uShirtLift;
float gShirtMask = 0.0;
vec3 hsvOf(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float d = mx - mn;
  float h = 0.0;
  if (d > 1e-5) {
    if (mx == c.r) h = mod((c.g - c.b) / d, 6.0);
    else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
  }
  return vec3(h * 60.0, mx > 0.0 ? d / mx : 0.0, mx);
}
vec3 recolorShirt(vec3 lin) {
  vec3 srgb = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
  vec3 hsv = hsvOf(srgb);
  float m = smoothstep(193.0, 201.0, hsv.x) * (1.0 - smoothstep(224.0, 234.0, hsv.x));
  // low floor so the paler inner placket (greyer blue) is caught too; skin/buttons are orange-beige, far off in hue
  m *= smoothstep(0.015, 0.05, hsv.y) * (1.0 - smoothstep(0.34, 0.46, hsv.y));
  m *= smoothstep(0.18, 0.28, hsv.z);
  // pale specks and the inner collar band are near-grey, so their hue is unreliable. They are all
  // cool (blue >= red), while skin, hair and the beige buttons are warm (red > blue): use that.
  float cool = smoothstep(-0.012, 0.004, srgb.b - srgb.r) * smoothstep(0.08, 0.16, hsv.z);
  m = max(m, cool);
  m *= 1.0 - smoothstep(${(SHIRT_MAX_Y - 0.03).toFixed(3)}, ${(SHIRT_MAX_Y + 0.02).toFixed(3)}, vRootPos.y);
  float rel = dot(srgb, vec3(0.2126, 0.7152, 0.0722)) / ${SHIRT_MEAN_LUMA.toFixed(3)};
  vec3 tinted = uShirt * rel + vec3(max(rel - 0.85, 0.0)) * uShirtLift;
  vec3 outLin = pow(clamp(tinted, 0.0, 1.0), vec3(2.2));
  gShirtMask = m * uShirtOn;
  return mix(lin, outLin, gShirtMask);
}`,
          )
          .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = recolorShirt(diffuseColor.rgb);')
          // the baked roughness has a few glossy specks on the shirt that glint on dark cloth: keep it matte
          .replace(
            '#include <roughnessmap_fragment>',
            '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, max(roughnessFactor, 0.8), gShirtMask);',
          )
          .replace(
            'void main() {',
            `void main() {
  if (inEye(vec2(${EYES[0].z}, ${EYES[0].y}), uEyeX.x) || inEye(vec2(${EYES[1].z}, ${EYES[1].y}), uEyeX.y)) discard;`,
          )
      }
      mat.needsUpdate = true
    })
  }, [scene, surface, invRoot, eyeSurfaceX])

  const eyeTex = useMemo(() => makeEyeTexture(), [])
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: eyeTex, roughness: 0.12, metalness: 0 }),
    [eyeTex],
  )
  const lidMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#be7e5e', roughness: 0.72 }),
    [],
  )
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(EYEBALL_R, 48, 32), [])

  const tmpEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const desiredQuat = useRef(new THREE.Quaternion())
  // critically damped yaw/pitch per eye (faster than the camera's ~0.3 s lag, so the gaze leads)
  const eyeAim = useRef([0, 1].map(() => ({ yaw: { x: 0, v: 0 }, pitch: { x: 0, v: 0 } })))
  const blink = useRef({ next: 3.0, start: -1 })
  const ndcBottomVec = useRef(new THREE.Vector3())
  const eyeScreenVec = useRef(new THREE.Vector3())

  useFrame((s, dt) => {
    const o = outer.current
    const r = root.current
    if (!o || !r) return

    // Exact bottom edge of the viewport in world coordinates at Z = 0
    // Perfectly accounts for any camera position, height, pitch tilt, or distance:
    const pCam = camera as THREE.PerspectiveCamera
    const bottomNDC = ndcBottomVec.current.set(0, -1, 0.5)
    bottomNDC.unproject(pCam)
    const rayDir = bottomNDC.sub(pCam.position).normalize()
    const tRay = -pCam.position.z / (rayDir.z || -0.0001)
    const exactScreenBottomY = pCam.position.y + tRay * rayDir.y

    // In myavatar.glb (compressed from myavatar-v1), minY is -0.474121
    const bustBottomOffset = -0.474121 * scale

    // Target Y anchors the avatar flush to the bottom edge: zero gap under all camera moves
    const targetY = exactScreenBottomY - bustBottomOffset - 0.08

    // FIXED BODY: ZERO ROTATION, ZERO SWAY. Body stays rock-solid in place at x=0
    o.position.set(0, targetY, 0)
    o.rotation.set(0, 0, 0)
    o.visible = true

    o.updateMatrixWorld(true)
    invRoot.value.copy(r.matrixWorld).invert()

    // SEN-STYLE RELATIVE SCREEN-PROJECTED EYE TRACKING:
    // Calculates where the avatar's eyes are in screen NDC (-1..1)
    let ax = 0
    let ay = 0
    let count = 0
    pivots.current.forEach((p) => {
      if (!p) return
      p.getWorldPosition(eyeScreenVec.current).project(pCam)
      ax += eyeScreenVec.current.x
      ay += eyeScreenVec.current.y
      count++
    })
    if (count > 0) {
      ax /= count
      ay /= count
    }

    // Relative vector from projected eye center to cursor:
    // When avatar is panned left and user reads text on the right, eyes look right!
    const targetScreenX = pointer.active ? pointer.x : ax
    const targetScreenY = pointer.active ? pointer.y : ay
    const dx = targetScreenX - ax
    const dy = targetScreenY - ay

    const relX = Math.tanh(dx * 1.2)
    const relY = Math.tanh(dy * 1.2)

    // Sen's angular ranges: +/- 16 deg yaw, +/- 11 deg pitch
    const maxYaw = 16 * (Math.PI / 180)
    const maxPitch = 11 * (Math.PI / 180)

    const baseYaw = relX * maxYaw
    const basePitch = -relY * maxPitch

    // Subtle convergence (cross-eye when cursor is near the avatar's face)
    const distFromEyes = Math.hypot(dx, dy)
    const convWeight = Math.max(0, 1 - distFromEyes / 0.6)
    const convergence = (1.8 * (Math.PI / 180)) * convWeight

    pivots.current.forEach((p, idx) => {
      if (!p) return
      // idx 0 is left eye (sx = -1 inward), idx 1 is right eye (sx = +1 inward)
      const convSign = idx === 0 ? -1 : 1
      const aim = eyeAim.current[idx]
      const cdt = Math.min(dt, 0.1)
      const yaw = smoothDamp(aim.yaw, baseYaw + convSign * convergence, 0.09, cdt)
      const pitch = smoothDamp(aim.pitch, basePitch, 0.09, cdt)

      tmpEuler.current.set(pitch, yaw, 0)
      p.quaternion.setFromEuler(tmpEuler.current)
    })

    // Occasional natural blink
    const t = s.clock.elapsedTime
    const b = blink.current
    if (t > b.next && b.start < 0) b.start = t
    let k = 0
    if (b.start >= 0) {
      const u = (t - b.start) / 0.16
      k = u < 1 ? Math.sin(u * Math.PI) : 0
      if (u >= 1) {
        b.start = -1
        b.next = t + 2.8 + Math.random() * 3.5
        if (Math.random() < 0.2) b.next = t + 0.25
      }
    }
    for (const l of lids.current) {
      if (!l) continue
      l.visible = k > 0.01
      l.rotation.z = THREE.MathUtils.lerp(0.95, -Math.PI / 2, k)
    }
  })

  return (
    <group ref={outer}>
      {/* iridescent glow behind the head (eye height is ~0.16 model units above the root) */}
      <HoloGlow headY={0.16 * scale} size={6.4 * (scale / AVATAR_SCALE_DESKTOP)} />
      {/* Model faces +X; turn it to face the camera (+Z) */}
      <group ref={root} rotation={[0, -Math.PI / 2, 0]} scale={scale}>
        <primitive object={scene} />
        {EYES.map((e, i) => (
          // Place eyeball slightly recessed inside socket so eyelids wrap naturally
          <group key={i} position={[surface[i] - EYEBALL_R - 0.002, e.y, e.z]}>
            {/* Undo the model's turn so a resting pivot looks straight ahead (+Z) */}
            <group rotation={[0, Math.PI / 2, 0]}>
              <group ref={(el) => (pivots.current[i] = el)}>
                {/* Iris is drawn at u=0.5 (+X); rotate it to face the pivot's forward (+Z) */}
                <mesh geometry={eyeGeo} material={eyeMat} rotation={[0, -Math.PI / 2, 0]} />
              </group>
            </group>
            <mesh ref={(el) => (lids.current[i] = el)} material={lidMat} visible={false}>
              <sphereGeometry args={[EYEBALL_R * 1.03, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
