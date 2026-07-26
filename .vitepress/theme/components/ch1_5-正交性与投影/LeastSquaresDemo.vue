<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'good' }" @click="setPreset('good')">良好拟合</button>
      <button :class="{ active: preset === 'noisy' }" @click="setPreset('noisy')">噪声较大</button>
      <button :class="{ active: preset === 'horizontal' }" @click="setPreset('horizontal')">水平面</button>
    </div>

    <div class="data-editor">
      <p class="block-title">数据点编辑器（5 个三维样本，拖拽滑块实时拟合）</p>
      <div class="points-grid">
        <div v-for="(pt, i) in dataPoints" :key="i" class="point-card">
          <div class="point-header">
            <span class="point-name">P{{ i + 1 }}</span>
            <span class="point-coord">({{ pt.x.toFixed(1) }}, {{ pt.y.toFixed(1) }}, {{ pt.z.toFixed(1) }})</span>
          </div>
          <div class="point-sliders">
            <label>x
              <input type="range" min="-3" max="3" step="0.1"
                     v-model.number="pt.x"
                     @input="markCustom" />
              <span>{{ pt.x.toFixed(1) }}</span>
            </label>
            <label>y
              <input type="range" min="-3" max="3" step="0.1"
                     v-model.number="pt.y"
                     @input="markCustom" />
              <span>{{ pt.y.toFixed(1) }}</span>
            </label>
            <label>z
              <input type="range" min="-3" max="3" step="0.1"
                     v-model.number="pt.z"
                     @input="markCustom" />
              <span>{{ pt.z.toFixed(1) }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch" style="background:#3b82f6;border-radius:50%"></span>
        <span>数据点 P_i</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:rgba(16,185,129,0.4)"></span>
        <span>拟合平面 z = ax + by + c</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed"></span>
        <span>误差向量 e_i（垂线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch" style="background:rgba(255,255,255,0.7);border:1px solid #888"></span>
        <span>直角标记</span>
      </span>
    </div>

    <div class="demo-output">
      <div class="output-row highlight">
        <span class="label">拟合系数 a</span>
        <span class="value">{{ beta.a.toFixed(4) }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">拟合系数 b</span>
        <span class="value">{{ beta.b.toFixed(4) }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">拟合系数 c</span>
        <span class="value">{{ beta.c.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">平面方程</span>
        <span class="value">z = {{ beta.a.toFixed(2) }}x + {{ beta.b.toFixed(2) }}y + {{ beta.c.toFixed(2) }}</span>
      </div>
      <div class="output-row">
        <span class="label">RSS = Σ‖e_i‖²</span>
        <span class="value">{{ rss.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">TSS = Σ(z_i − z̄)²</span>
        <span class="value">{{ tss.toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="r2Class">
        <span class="label">决定系数 R²</span>
        <span class="value">{{ r2Display }}</span>
      </div>
      <div class="output-row">
        <span class="label">投影矩阵迹 tr(P)</span>
        <span class="value">3 = rank(A) = p（模型参数数）</span>
      </div>
    </div>

    <div class="residual-table-block">
      <p class="block-title">每点残差明细（垂足 F_i 与误差向量 e_i）</p>
      <table class="residual-table">
        <thead>
          <tr>
            <th>#</th>
            <th>数据点 P_i</th>
            <th>预测 ẑ_i = a·x + b·y + c</th>
            <th>垂足 F_i</th>
            <th>‖e_i‖</th>
            <th>‖e_i‖²</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pt, i) in dataPoints" :key="i">
            <td class="idx">P{{ i + 1 }}</td>
            <td>({{ pt.x.toFixed(2) }}, {{ pt.y.toFixed(2) }}, {{ pt.z.toFixed(2) }})</td>
            <td>{{ predictedZ[i].toFixed(4) }}</td>
            <td>({{ feet[i].x.toFixed(2) }}, {{ feet[i].y.toFixed(2) }}, {{ feet[i].z.toFixed(2) }})</td>
            <td>{{ Math.abs(signedDistances[i]).toFixed(4) }}</td>
            <td>{{ (signedDistances[i] * signedDistances[i]).toFixed(4) }}</td>
          </tr>
          <tr class="sum-row">
            <td colspan="4">Σ（残差平方和）</td>
            <td colspan="2">RSS = {{ rss.toFixed(4) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="formula-block">
      <p class="formula-title">最小二乘法 · 列空间投影视角</p>
      <p class="formula-line">设计矩阵 A ∈ ℝⁿˣ³（列：x_i, y_i, 1），观测向量 z ∈ ℝⁿ</p>
      <p class="formula-line">法方程：Aᵀ A β = Aᵀ z &nbsp; ⇒ &nbsp; β̂ = (AᵀA)⁻¹Aᵀz</p>
      <p class="formula-line">投影矩阵 P = A(AᵀA)⁻¹Aᵀ &nbsp; ⇒ &nbsp; ẑ = Pz 是 z 在 C(A) 上的投影</p>
      <p class="formula-line">残差 e = z − ẑ = (I − P)z ⊥ C(A) &nbsp; ⇒ &nbsp; tr(P) = rank(A) = 3</p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, reactive } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '最小二乘法与列空间投影 · 交互演示'
  }
)

const COLOR_POINT = 0x3b82f6
const COLOR_POINT_HOVER = 0x60a5fa
const COLOR_PLANE = 0x10b981
const COLOR_PLANE_EDGE = 0x059669
const COLOR_ERROR = 0xf97316
const COLOR_SQUARE = 0xffffff
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6

interface DataPoint {
  x: number
  y: number
  z: number
}

interface Beta {
  a: number
  b: number
  c: number
}

const DEFAULT_GOOD: DataPoint[] = [
  { x: 1.5, y: 0.5, z: 1.4 },
  { x: -1.0, y: 1.0, z: -0.1 },
  { x: 0.5, y: -1.5, z: 0.6 },
  { x: -1.5, y: -0.5, z: -0.7 },
  { x: 1.0, y: 1.5, z: 1.3 }
]

const DEFAULT_NOISY: DataPoint[] = [
  { x: 1.5, y: 0.5, z: 2.0 },
  { x: -1.0, y: 1.0, z: -1.5 },
  { x: 0.5, y: -1.5, z: 1.8 },
  { x: -1.5, y: -0.5, z: -1.0 },
  { x: 1.0, y: 1.5, z: -0.5 }
]

const DEFAULT_HORIZONTAL: DataPoint[] = [
  { x: 1.5, y: 0.5, z: 0.6 },
  { x: -1.0, y: 1.0, z: 0.4 },
  { x: 0.5, y: -1.5, z: 0.5 },
  { x: -1.5, y: -0.5, z: 0.5 },
  { x: 1.0, y: 1.5, z: 0.4 }
]

const dataPoints = reactive<DataPoint[]>(DEFAULT_GOOD.map(p => ({ ...p })))

type PresetKey = 'good' | 'noisy' | 'horizontal' | 'custom'
const preset = ref<PresetKey>('good')

function setPreset(p: PresetKey) {
  preset.value = p
  let src: DataPoint[] = DEFAULT_GOOD
  if (p === 'noisy') src = DEFAULT_NOISY
  else if (p === 'horizontal') src = DEFAULT_HORIZONTAL
  for (let i = 0; i < dataPoints.length; i++) {
    dataPoints[i].x = src[i].x
    dataPoints[i].y = src[i].y
    dataPoints[i].z = src[i].z
  }
}

function markCustom() {
  preset.value = 'custom'
}

function solve3x3(A: number[][], b: number[]): Beta | null {
  const M: number[][] = [
    [A[0][0], A[0][1], A[0][2], b[0]],
    [A[1][0], A[1][1], A[1][2], b[1]],
    [A[2][0], A[2][1], A[2][2], b[2]]
  ]
  for (let i = 0; i < 3; i++) {
    let maxRow = i
    for (let k = i + 1; k < 3; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k
    }
    const tmp = M[i]; M[i] = M[maxRow]; M[maxRow] = tmp
    if (Math.abs(M[i][i]) < 1e-12) return null
    for (let k = i + 1; k < 3; k++) {
      const factor = M[k][i] / M[i][i]
      for (let j = i; j < 4; j++) {
        M[k][j] -= factor * M[i][j]
      }
    }
  }
  const x = [0, 0, 0]
  for (let i = 2; i >= 0; i--) {
    let sum = M[i][3]
    for (let j = i + 1; j < 3; j++) sum -= M[i][j] * x[j]
    x[i] = sum / M[i][i]
  }
  return { a: x[0], b: x[1], c: x[2] }
}

const beta = computed<Beta>(() => {
  const ATA = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const ATz = [0, 0, 0]
  for (const p of dataPoints) {
    const row = [p.x, p.y, 1]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) ATA[i][j] += row[i] * row[j]
      ATz[i] += row[i] * p.z
    }
  }
  return solve3x3(ATA, ATz) ?? { a: 0, b: 0, c: 0 }
})

const predictedZ = computed(() =>
  dataPoints.map(p => beta.value.a * p.x + beta.value.b * p.y + beta.value.c)
)

const normalLength = computed(() =>
  Math.sqrt(beta.value.a ** 2 + beta.value.b ** 2 + 1)
)

const nHat = computed(() => {
  const len = normalLength.value
  if (len < 1e-12) return { x: 0, y: 0, z: -1 }
  return { x: beta.value.a / len, y: beta.value.b / len, z: -1 / len }
})

const signedDistances = computed(() =>
  dataPoints.map(p => {
    const a = beta.value.a, b = beta.value.b, c = beta.value.c
    return (a * p.x + b * p.y - p.z + c) / normalLength.value
  })
)

const feet = computed(() =>
  dataPoints.map((p, i) => {
    const d = signedDistances.value[i]
    const n = nHat.value
    return { x: p.x - d * n.x, y: p.y - d * n.y, z: p.z - d * n.z }
  })
)

const rss = computed(() =>
  signedDistances.value.reduce((s, d) => s + d * d, 0)
)

const zMean = computed(() =>
  dataPoints.reduce((s, p) => s + p.z, 0) / dataPoints.length
)

const tss = computed(() =>
  dataPoints.reduce((s, p) => s + (p.z - zMean.value) ** 2, 0)
)

const r2 = computed(() => {
  if (tss.value < 1e-12) return 0
  return 1 - rss.value / tss.value
})

const r2Display = computed(() => {
  if (tss.value < 1e-9) return '—（z 恒定）'
  return r2.value.toFixed(4)
})

const r2Class = computed(() => {
  if (tss.value < 1e-9) return {}
  return {
    highlight: r2.value > 0.7,
    danger: r2.value < 0.3
  }
})

const tipText = computed(() => {
  if (tss.value < 1e-9) {
    return '所有数据点的 z 值相同，TSS = 0，R² 无定义。最小二乘解会给出水平平面 z = z̄。'
  }
  const r = r2.value
  if (r > 0.85) {
    return '数据点几乎共面，R² 接近 1。拟合平面贴近数据，误差向量 e_i 的长度都很小——这正是"投影到列空间"的最优性体现。'
  }
  if (r > 0.5) {
    return 'R² 中等：拟合平面捕捉了 z 的主要趋势，但仍有不可忽略的垂直残差。这些残差对应 b 在 N(A^T) 中的分量。'
  }
  return 'R² 偏低：数据偏离平面较大。注意橙色虚线（误差 e_i）较长——它们是与拟合平面正交的残差，最小二乘使 ‖e‖² 之和最小。'
})

const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

const POINT_COUNT = 5
let originSphere: THREE.Mesh
let planeMesh: THREE.Mesh
let planeEdges: THREE.LineSegments
const pointSpheres: THREE.Mesh[] = []
const errorLines: THREE.Line[] = []
const squares: THREE.LineLoop[] = []

let flickerPhase = 0

let planeOpacityTarget = 0.4

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }

  scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(5, 5, 7)
  camera.lookAt(0, 0, 0)

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = 'WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 2
  controls.maxDistance = 30

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(6, 12, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 3)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 3)
  createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 3)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  const planeGeom = new THREE.PlaneGeometry(8, 8, 1, 1)
  const planeMat = new THREE.MeshBasicMaterial({
    color: COLOR_PLANE,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  planeMesh = new THREE.Mesh(planeGeom, planeMat)
  scene.add(planeMesh)

  const planeEdgeGeom = new THREE.EdgesGeometry(planeGeom)
  const planeEdgeMat = new THREE.LineBasicMaterial({
    color: COLOR_PLANE_EDGE,
    transparent: true,
    opacity: 0
  })
  planeEdges = new THREE.LineSegments(planeEdgeGeom, planeEdgeMat)
  planeMesh.add(planeEdges)

  for (let i = 0; i < POINT_COUNT; i++) {

    const sphereGeom = new THREE.SphereGeometry(0.14, 20, 20)
    const sphereMat = new THREE.MeshBasicMaterial({ color: COLOR_POINT })
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    scene.add(sphere)
    pointSpheres.push(sphere)

    const eGeom = new THREE.BufferGeometry()
    eGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(6), 3)
    )
    const eMat = new THREE.LineDashedMaterial({
      color: COLOR_ERROR,
      dashSize: 0.15,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    })
    const eLine = new THREE.Line(eGeom, eMat)
    eLine.computeLineDistances()
    scene.add(eLine)
    errorLines.push(eLine)

    const sqGeom = new THREE.BufferGeometry()
    sqGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(12), 3)
    )
    const sqMat = new THREE.LineBasicMaterial({
      color: COLOR_SQUARE,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    })
    const sq = new THREE.LineLoop(sqGeom, sqMat)
    scene.add(sq)
    squares.push(sq)
  }
}

function createAxis(dir: THREE.Vector3, color: number, length: number) {
  const arrow = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    0.22,
    0.1
  )
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  lineMat.color.setHex(color)
  coneMat.color.setHex(color)
  lineMat.transparent = true
  coneMat.transparent = true
  lineMat.opacity = 0.55
  coneMat.opacity = 0.55
  scene.add(arrow)
}

function getInPlaneDir(n_hat: THREE.Vector3): THREE.Vector3 {
  const helper = Math.abs(n_hat.x) < 0.9
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 1, 0)
  return new THREE.Vector3().crossVectors(n_hat, helper).normalize()
}

function updateErrorLine(line: THREE.Line, p: THREE.Vector3, f: THREE.Vector3) {
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p.x, p.y, p.z)
  pos.setXYZ(1, f.x, f.y, f.z)
  pos.needsUpdate = true
  line.computeLineDistances()
}

function updateSquare(sq: THREE.LineLoop, foot: THREE.Vector3, n_hat: THREE.Vector3, inPlaneDir: THREE.Vector3, dist: number) {
  const s = 0.3
  if (Math.abs(dist) < 1e-3) {
    sq.visible = false
    return
  }
  sq.visible = true

  const v0 = foot.clone()
  const v1 = foot.clone().addScaledVector(n_hat, s)
  const v2 = foot.clone().addScaledVector(n_hat, s).addScaledVector(inPlaneDir, s)
  const v3 = foot.clone().addScaledVector(inPlaneDir, s)
  const pos = sq.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true
}

function updateScene() {
  if (!scene) return

  const a = beta.value.a
  const b = beta.value.b
  const c = beta.value.c
  const nHatVec = new THREE.Vector3(nHat.value.x, nHat.value.y, nHat.value.z)
  const inPlaneDir = getInPlaneDir(nHatVec)

  const pointOnPlane = new THREE.Vector3(0, 0, c)
  planeMesh.position.copy(pointOnPlane)
  const defaultNormal = new THREE.Vector3(0, 0, 1)
  const targetNormal = nHatVec.clone()

  if (targetNormal.lengthSq() > 1e-12) {
    const q = new THREE.Quaternion().setFromUnitVectors(defaultNormal, targetNormal)
    planeMesh.quaternion.copy(q)
  }

  for (let i = 0; i < POINT_COUNT; i++) {
    const p = dataPoints[i]
    pointSpheres[i].position.set(p.x, p.y, p.z)

    const f = feet.value[i]
    const fVec = new THREE.Vector3(f.x, f.y, f.z)
    const pVec = new THREE.Vector3(p.x, p.y, p.z)
    updateErrorLine(errorLines[i], pVec, fVec)

    const d = signedDistances.value[i]
    updateSquare(squares[i], fVec, nHatVec, inPlaneDir, d)
  }
}

let lastTime = -1

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const now = time
  const dt = lastTime < 0 ? 0 : (now - lastTime) / 1000
  lastTime = now

  updateScene()

  const lerpFactor = Math.min(1, dt * 6)
  const planeMat = planeMesh.material as THREE.MeshBasicMaterial
  planeMat.opacity += (planeOpacityTarget - planeMat.opacity) * lerpFactor

  const planeEdgeMat = planeEdges.material as THREE.LineBasicMaterial
  const edgeTarget = Math.min(1, planeOpacityTarget * 2.5)
  planeEdgeMat.opacity += (edgeTarget - planeEdgeMat.opacity) * lerpFactor

  planeMesh.visible = planeMat.opacity > 0.005
  planeEdges.visible = planeEdgeMat.opacity > 0.005

  flickerPhase += dt * 3.0
  const flickerOpacity = 0.7 + 0.3 * Math.sin(flickerPhase)
  for (let i = 0; i < POINT_COUNT; i++) {
    const eMat = errorLines[i].material as THREE.LineDashedMaterial
    const d = Math.abs(signedDistances.value[i])
    if (d > 1e-3) {
      eMat.opacity = flickerOpacity
      errorLines[i].visible = true
    } else {
      errorLines[i].visible = false
    }

    const sqMat = squares[i].material as THREE.LineBasicMaterial
    if (d > 1e-3) {
      sqMat.opacity = 0.7 + 0.2 * Math.sin(flickerPhase + i * 0.4)
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

function handleResize() {
  if (!canvasContainer.value || !renderer || !camera) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  try {
    initScene()
    if (renderer) {
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('LeastSquaresDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

.data-editor {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.block-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  text-align: center;
  font-weight: 600;
}

.points-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-3);
}

.point-card {
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
}

.point-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.point-name {
  font-weight: 700;
  font-size: var(--fs-base);
  color: #3b82f6;
  min-width: 2em;
}

.point-coord {
  color: var(--text-secondary);
  flex: 1;
}

.point-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.point-sliders label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-weight: 500;
}

.point-sliders label input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 80px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.point-sliders label input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid var(--bg-content);
  box-shadow: var(--shadow-sm);
}

.point-sliders label input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.point-sliders label span {
  display: inline-flex;
  align-items: center;
  padding: 0.1em 0.4em;
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
  font-weight: 600;
  min-width: 2.5em;
  justify-content: center;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  justify-content: center;
}

.preset-buttons button {
  padding: 0.4em 1.2em;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  transition: all 0.15s ease;
}

.preset-buttons button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.preset-buttons button.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: 0.2em 0.6em;
  background: var(--bg-content);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.output-row .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.output-row .value {
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
}

.output-row.highlight {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-success);
}

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
}

.demo-status {
  margin-top: var(--space-2);
  padding: 0.3em 0.8em;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.demo-status.info { background: var(--bg-info-soft); color: var(--color-info); }
.demo-status.success { background: var(--bg-success-soft); color: var(--color-success); }
.demo-status.warning { background: var(--bg-warning-soft); color: var(--color-warning); }
.demo-status.error { background: var(--bg-danger-soft); color: var(--color-danger); }

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin: var(--space-2) 0;
  padding: 0.5em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-secondary);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}

.legend-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.legend-swatch.solid {
  height: 4px;
  border-radius: 2px;
}

.legend-swatch.dashed {
  background: repeating-linear-gradient(
    to right,
    #f97316 0,
    #f97316 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 20px;
}

.residual-table-block {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.residual-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  min-width: 580px;
}

.residual-table thead th {
  background: var(--bg-content);
  color: var(--text-secondary);
  font-weight: 600;
  padding: 0.4em 0.6em;
  text-align: left;
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.residual-table tbody td {
  padding: 0.3em 0.6em;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  background: var(--bg-content);
}

.residual-table tbody td.idx {
  font-weight: 700;
  color: #3b82f6;
  text-align: center;
}

.residual-table tbody tr:nth-child(even) td {
  background: rgba(0, 0, 0, 0.02);
}

.residual-table tbody tr.sum-row td {
  background: var(--bg-success-soft);
  color: var(--color-success);
  font-weight: 700;
  text-align: right;
}

.formula-block {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(16, 185, 129, 0.06));
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
}

.formula-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-accent-strong);
  text-align: center;
}

.formula-line {
  margin: 0.25em 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}
</style>
