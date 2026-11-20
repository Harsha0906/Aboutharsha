import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { pointer } from '../state'

// Harsha's real 3D avatar (generated with Tripo from the clay portrait, optimised to ~134k triangles).
// The painted eyes are cut out of the head with a shader mask and replaced by real eyeballs
// sitting in the sockets, which rotate to follow the cursor and blink.

const URL = './avatar/me.glb'
useGLTF.preload(URL)

/** model space: the head faces +X, Y is up, Z runs to the avatar's right(-) / left(+) */
const EYES = [
  { z: 0.0688, y: 0.1636 },
  { z: -0.0688, y: 0.1595 },
]
const EYE_HALF_W = 0.031
const EYE_HALF_H = 0.0098
const EYEBALL_R = 0.036
export const AVATAR_SCALE = 4.6

// a soft sunlit glow that sits behind the head
function makeHaloTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  gr.addColorStop(0, 'rgba(255,248,232,0.85)')
  gr.addColorStop(0.35, 'rgba(255,244,222,0.38)')
  gr.addColorStop(1, 'rgba(255,244,222,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function makeEyeTexture() {
  const W = 1024, H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  // sclera, slightly warm and darker toward the back
  const sg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2)
  sg.addColorStop(0, '#f4ede4')
  sg.addColorStop(0.5, '#e6dacb')
  sg.addColorStop(1, '#b9a796')
  g.fillStyle = sg
  g.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2, r = 70
  // iris with radial streaks
  const ig = g.createRadialGradient(cx, cy, r * 0.35, cx, cy, r)
  ig.addColorStop(0, '#5a3b26')
  ig.addColorStop(0.7, '#3e271a')
  ig.addColorStop(1, '#1d120c')
  g.fillStyle = ig
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(140,96,60,0.35)'
  g.lineWidth = 1.5
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42)
    g.lineTo(cx + Math.cos(a) * r * (0.75 + Math.random() * 0.2), cy + Math.sin(a) * r * (0.75 + Math.random() * 0.2))
    g.stroke()
  }
  g.fillStyle = '#0b0807'
  g.beginPath()
  g.arc(cx, cy, r * 0.38, 0, Math.PI * 2)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export default function Avatar3D() {
  const { scene } = useGLTF(URL)
  const outer = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const pivots = useRef<(THREE.Group | null)[]>([])
  const lids = useRef<(THREE.Mesh | null)[]>([])
  const { camera } = useThree()

  const invRoot = useMemo(() => ({ value: new THREE.Matrix4() }), [])
  const rim = useMemo(() => ({ value: 0.55 }), [])
  const eyeSurfaceX = useMemo(() => ({ value: new THREE.Vector2(0.2, 0.2) }), [])

  // find how far forward the face surface is at each eye, then cut the eye openings
  const surface = useMemo(() => {
    scene.updateMatrixWorld(true)
    const rc = new THREE.Raycaster()
    const xs = EYES.map((e) => {
      // aim slightly above the eye centre so we hit the upper lid, not the painted iris
      rc.set(new THREE.Vector3(2, e.y, e.z), new THREE.Vector3(-1, 0, 0))
      const hits = rc.intersectObject(scene, true)
      // skip the glasses frame: take the hit closest to where the face should be
      const face = hits.find((h) => h.point.x < 0.3) ?? hits[0]
      return face ? face.point.x : 0.2
    })
    return xs
  }, [scene])

  useEffect(() => {
    eyeSurfaceX.value.set(surface[0], surface[1])
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = false
      const mat = m.material as THREE.MeshStandardMaterial
      // soft clay finish: matte with a gentle sheen from the environment
      mat.roughness = 0.58
      mat.metalness = 0
      mat.envMapIntensity = 1.1
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uInvRoot = invRoot
        sh.uniforms.uRim = rim
        sh.uniforms.uEyeX = eyeSurfaceX
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
uniform float uRim;
bool inEye(vec2 c, float sx) {
  vec2 d = vec2(vRootPos.z - c.x, vRootPos.y - c.y);
  float u = d.x / ${EYE_HALF_W.toFixed(4)};
  if (abs(u) >= 1.0) return false;
  float h = ${EYE_HALF_H.toFixed(4)} * (1.0 - u * u) * (1.0 + 0.25 * sign(d.y));
  return abs(d.y) < h && vRootPos.x > sx - 0.02 && vRootPos.x < sx + 0.012;
}`,
          )
          .replace(
            '#include <opaque_fragment>',
            `// fresnel rim: a warm glow along the silhouette, like studio back light on clay
  vec3 vd = normalize(vViewPosition);
  float fr = pow(1.0 - clamp(dot(normal, vd), 0.0, 1.0), 2.6);
  outgoingLight += mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.86, 0.66), clamp(normal.x * 0.5 + 0.5, 0.0, 1.0)) * fr * uRim;
  outgoingLight = mix(vec3(dot(outgoingLight, vec3(0.299, 0.587, 0.114))), outgoingLight, 1.08);
#include <opaque_fragment>`,
          )
          .replace(
            'void main() {',
            `void main() {
  if (inEye(vec2(${EYES[0].z}, ${EYES[0].y}), uEyeX.x) || inEye(vec2(${EYES[1].z}, ${EYES[1].y}), uEyeX.y)) discard;`,
          )
      }
      mat.needsUpdate = true
    })
  }, [scene, surface, invRoot, eyeSurfaceX, rim])

  const eyeTex = useMemo(() => makeEyeTexture(), [])
  const haloTex = useMemo(() => makeHaloTexture(), [])
  const halo = useRef<THREE.Mesh>(null)
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ map: eyeTex, roughness: 0.18, metalness: 0 }), [eyeTex])
  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b97a5a', roughness: 0.7 }), [])
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(EYEBALL_R, 48, 32), [])

  const target = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const blink = useRef({ next: 2.5, start: -1 })

  useFrame((s, dt) => {
    const o = outer.current
    const r = root.current
    if (!o || !r) return
    const t = s.clock.elapsedTime
    const tx = pointer.active ? pointer.x : Math.sin(t * 0.4) * 0.3
    const ty = pointer.active ? pointer.y : Math.sin(t * 0.3) * 0.15

    // rises up from below the frame as the visitor starts scrolling
    const rk = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
    const rise = 1 - Math.pow(1 - rk, 3)
    o.position.y = -8 * (1 - rise) + Math.sin(t * 1.1) * 0.03
    o.visible = rise > 0.001
    // the glow blooms in as the avatar arrives
    if (halo.current) {
      const hm = halo.current.material as THREE.MeshBasicMaterial
      hm.opacity = 0.75 * rise * (0.92 + 0.08 * Math.sin(t * 0.8))
      halo.current.scale.setScalar(0.85 + 0.15 * rise)
    }

    // the head turns gently toward the cursor
    o.rotation.y = THREE.MathUtils.damp(o.rotation.y, tx * 0.28 + (1 - rise) * 0.9, 3, dt)
    o.scale.setScalar(0.88 + 0.12 * rise)
    o.rotation.x = THREE.MathUtils.damp(o.rotation.x, -ty * 0.12, 3, dt)

    o.updateMatrixWorld(true)
    invRoot.value.copy(r.matrixWorld).invert()

    // eyes look at a point under the cursor, a little in front of the face
    target.set(tx, ty, 0.5).unproject(camera)
    tmp.copy(target).sub(camera.position).normalize()
    target.copy(camera.position).addScaledVector(tmp, camera.position.distanceTo(o.position) * 0.8)
    for (const p of pivots.current) {
      if (!p) continue
      const q0 = p.quaternion.clone()
      p.lookAt(target)
      // limit how far the eyes can roll
      const e = new THREE.Euler().setFromQuaternion(p.quaternion, 'YXZ')
      e.x = THREE.MathUtils.clamp(e.x, -0.35, 0.35)
      e.y = THREE.MathUtils.clamp(e.y, -0.6, 0.6)
      p.quaternion.setFromEuler(e)
      p.quaternion.slerpQuaternions(q0, p.quaternion, 1 - Math.exp(-dt * 14))
    }

    // blink: a skin-coloured lid sweeps over each eyeball
    const b = blink.current
    if (t > b.next && b.start < 0) b.start = t
    let k = 0
    if (b.start >= 0) {
      const u = (t - b.start) / 0.16
      k = u < 1 ? Math.sin(u * Math.PI) : 0
      if (u >= 1) { b.start = -1; b.next = t + 2.5 + Math.random() * 3.5; if (Math.random() < 0.2) b.next = t + 0.25 }
    }
    for (const l of lids.current) {
      if (!l) continue
      l.visible = k > 0.01
      l.rotation.z = THREE.MathUtils.lerp(0.9, -Math.PI / 2, k)
    }
  })

  return (
    <group ref={outer} position={[0, -8, 0]}>
      <mesh ref={halo} position={[0, 0.25, -1.4]} renderOrder={-1}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial map={haloTex} transparent depthWrite={false} toneMapped={false} opacity={0} />
      </mesh>
      {/* model faces +X; turn it to face the camera (+Z) and centre the face */}
      <group ref={root} rotation={[0, -Math.PI / 2, 0]} scale={AVATAR_SCALE} position={[0, -0.55, 0]}>
        <primitive object={scene} />
        {EYES.map((e, i) => (
          <group key={i} position={[surface[i] - EYEBALL_R + 0.003, e.y, e.z]}>
            {/* undo the model's turn so a resting pivot looks straight ahead (+Z) */}
            <group rotation={[0, Math.PI / 2, 0]}>
              <group ref={(el) => (pivots.current[i] = el)}>
                {/* iris is drawn at u=0.5, which faces +X; rotate it to the pivot's +Z */}
                <mesh geometry={eyeGeo} material={eyeMat} rotation={[0, -Math.PI / 2, 0]} />
              </group>
            </group>
            <mesh ref={(el) => (lids.current[i] = el)} material={lidMat} visible={false}>
              <sphereGeometry args={[EYEBALL_R * 1.04, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
