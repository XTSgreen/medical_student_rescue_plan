<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button :class="{ active: preset === '2d' }" :aria-pressed="preset === '2d'" @click="setPreset('2d')">二维示例</button>
      <button :class="{ active: preset === '3d' }" :aria-pressed="preset === '3d'" @click="setPreset('3d')">三维示例</button>
      <button :class="{ active: preset === 'random' }" :aria-pressed="preset === 'random'" @click="setPreset('random')">随机向量</button>
    </div>

    <div ref="canvasContainer" class="demo-canvas" role="img" aria-label="Gram-Schmidt 正交化三维演示画面，展示向量正交化过程，可用鼠标拖拽旋转视角"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

    <div class="step-info">
      <div class="step-progress">
        <div class="step-progress-bar" :style="{ width: (currentStep / maxAllowedStep) * 100 + '%' }"></div>
        <div class="step-progress-markers">
          <span
            v-for="s in maxAllowedStep + 1"
            :key="s - 1"
            class="step-marker"
            :class="{
              done: s - 1 <= currentStep,
              current: s - 1 === currentStep
            }"
          >{{ s - 1 }}</span>
        </div>
      </div>
      <p class="step-text">
        <span class="step-badge">Step {{ currentStep }} / {{ maxAllowedStep }}</span>
        <span class="step-desc">{{ stepDescription }}</span>
      </p>
    </div>

    <div class="step-buttons">
      <button
        class="step-btn"
        :disabled="currentStep !== 0 || stepAnim.active"
        @click="doStep1"
      >
        <span class="step-num">1</span>
        <span class="step-label">归一化 q1</span>
      </button>
      <button
        class="step-btn"
        :disabled="maxStep < 1 || currentStep !== 1 || stepAnim.active"
        @click="doStep2"
      >
        <span class="step-num">2</span>
        <span class="step-label">正交化 v2</span>
      </button>
      <button
        class="step-btn"
        :disabled="maxStep < 2 || currentStep !== 2 || stepAnim.active"
        @click="doStep3"
      >
        <span class="step-num">3</span>
        <span class="step-label">归一化 q2</span>
      </button>
      <button
        class="step-btn"
        :disabled="maxStep < 3 || currentStep !== 3 || preset === '2d' || stepAnim.active"
        @click="doStep4"
      >
        <span class="step-num">4</span>
        <span class="step-label">正交化 v3 + 归一化 q3</span>
      </button>
      <button
        v-if="currentStep === maxAllowedStep && maxStep >= maxAllowedStep"
        class="step-btn reset-btn"
        @click="reset"
      >
        <span class="step-label">重新开始</span>
      </button>
    </div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#9ca3af;opacity:0.55"></span>
        <span>原始向量 a1, a2, a3</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#f97316"></span>
        <span>当前处理向量（橙）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#06b6d4;opacity:0.7"></span>
        <span>投影分量（青绿）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed"></span>
        <span>投影虚线</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>q1（金）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ef4444"></span>
        <span>q2（红）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#3b82f6"></span>
        <span>q3（蓝）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch" style="background:rgba(255,255,255,0.7);border:1px solid #888"></span>
        <span>直角标记</span>
      </span>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">当前步骤</span>
        <span class="value">Step {{ currentStep }} / {{ maxAllowedStep }}</span>
      </div>
      <div class="output-row">
        <span class="label">a1</span>
        <span class="value">({{ a1.x.toFixed(2) }}, {{ a1.y.toFixed(2) }}, {{ a1.z.toFixed(2) }})</span>
      </div>
      <div class="output-row">
        <span class="label">‖a1‖</span>
        <span class="value">{{ normOf(a1).toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">a2</span>
        <span class="value">({{ a2.x.toFixed(2) }}, {{ a2.y.toFixed(2) }}, {{ a2.z.toFixed(2) }})</span>
      </div>
      <div class="output-row">
        <span class="label">‖a2‖</span>
        <span class="value">{{ normOf(a2).toFixed(4) }}</span>
      </div>
      <div class="output-row" v-if="preset !== '2d'">
        <span class="label">a3</span>
        <span class="value">({{ a3.x.toFixed(2) }}, {{ a3.y.toFixed(2) }}, {{ a3.z.toFixed(2) }})</span>
      </div>
      <div class="output-row" v-if="preset !== '2d'">
        <span class="label">‖a3‖</span>
        <span class="value">{{ normOf(a3).toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="{ highlight: currentStep >= 1 }">
        <span class="label">q1 = a1 / ‖a1‖</span>
        <span class="value">{{ currentStep >= 1 ? `(${q1Display})` : '—' }}</span>
      </div>
      <div class="output-row" :class="{ highlight: currentStep >= 3 }">
        <span class="label">q2 = v2 / ‖v2‖</span>
        <span class="value">{{ currentStep >= 3 ? `(${q2Display})` : '—' }}</span>
      </div>
      <div class="output-row" :class="{ highlight: currentStep >= 4 }">
        <span class="label">q3 = v3 / ‖v3‖</span>
        <span class="value">{{ currentStep >= 4 ? `(${q3Display})` : '—' }}</span>
      </div>
      <div class="output-row" v-if="currentStep >= 2" :class="{ highlight: orthoOk2 }">
        <span class="label">验证 q1 · v2 ≈ 0</span>
        <span class="value">{{ q1DotV2.toFixed(6) }} {{ orthoOk2 ? '对' : '错' }}</span>
      </div>
      <div class="output-row" v-if="currentStep >= 4" :class="{ highlight: orthoOk31 }">
        <span class="label">验证 q1 · q3 ≈ 0</span>
        <span class="value">{{ q1DotQ3.toFixed(6) }} {{ orthoOk31 ? '对' : '错' }}</span>
      </div>
      <div class="output-row" v-if="currentStep >= 4" :class="{ highlight: orthoOk32 }">
        <span class="label">验证 q2 · q3 ≈ 0</span>
        <span class="value">{{ q2DotQ3.toFixed(6) }} {{ orthoOk32 ? '对' : '错' }}</span>
      </div>
    </div>

    <div class="matrix-block" v-if="currentStep >= 1">
      <p class="block-title">Q<sup>T</sup>Q（应为单位阵 I）</p>
      <table class="matrix-table small">
        <tr v-for="(row, i) in QtQ" :key="i">
          <td
            v-for="(val, j) in row"
            :key="j"
            :class="{
              diagonal: i === j,
              'near-one': i === j && Math.abs(val - 1) < 1e-6,
              'near-zero': i !== j && Math.abs(val) < 1e-6
            }"
          >{{ val.toFixed(3) }}</td>
        </tr>
      </table>
    </div>

    <div class="matrix-block" v-if="currentStep >= 1">
      <p class="block-title">R 矩阵（上三角，对角线为 ‖v<sub>k</sub>‖）</p>
      <table class="matrix-table small">
        <tr v-for="(row, i) in R" :key="i">
          <td
            v-for="(val, j) in row"
            :key="j"
            :class="{ diagonal: i === j, upper: i < j, lower: i > j }"
          >
            <span class="r-value">{{ i > j ? '0' : val.toFixed(3) }}</span>
            <span class="r-hint" v-if="i === j">‖v<sub>{{ i + 1 }}</sub>‖</span>
            <span class="r-hint" v-else-if="i < j">a<sub>{{ j + 1 }}</sub>·q<sub>{{ i + 1 }}</sub></span>
          </td>
        </tr>
      </table>
    </div>

    <div class="formula-block">
      <p class="formula-title">Gram-Schmidt 正交化公式</p>
      <p class="formula-line">v<sub>k</sub> = a<sub>k</sub> − Σ<sub>i=1..k−1</sub> (a<sub>k</sub>·q<sub>i</sub>) q<sub>i</sub> &nbsp; ⇒ &nbsp; q<sub>k</sub> = v<sub>k</sub> / ‖v<sub>k</sub>‖</p>
      <p class="formula-line">A = QR &nbsp; 其中 Q 列向量标准正交（Q<sup>T</sup>Q = I），R 上三角且 r<sub>kk</sub> = ‖v<sub>k</sub>‖</p>
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
    title: 'Gram-Schmidt 正交化 · 4 步分步回放'
  }
)

const COLOR_GRAY = 0x9ca3af
const COLOR_ORANGE = 0xf97316
const COLOR_CYAN = 0x06b6d4
const COLOR_Q1 = 0xfbbf24
const COLOR_Q2 = 0xef4444
const COLOR_Q3 = 0x3b82f6
const COLOR_PLANE = 0xfbbf24
const COLOR_SQUARE = 0xffffff
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6

type Preset = '2d' | '3d' | 'random'
const preset = ref<Preset>('3d')
const currentStep = ref(0)
const maxStep = ref(0)

const a1 = reactive({ x: 2, y: 1, z: 0.5 })
const a2 = reactive({ x: 0.5, y: 2, z: 1 })
const a3 = reactive({ x: 1, y: 0.5, z: 2 })

const DEFAULT_A1 = { x: 2, y: 1, z: 0.5 }
const DEFAULT_A2 = { x: 0.5, y: 2, z: 1 }
const DEFAULT_A3 = { x: 1, y: 0.5, z: 2 }
const DEFAULT_A1_2D = { x: 2, y: 1, z: 0 }
const DEFAULT_A2_2D = { x: -1, y: 2, z: 0 }

function dot(u: number[], v: number[]): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
}

function norm(v: number[]): number {
  return Math.sqrt(dot(v, v))
}

function normalize(v: number[]): number[] {
  const n = norm(v)
  if (n < 1e-12) return [0, 0, 0]
  return [v[0] / n, v[1] / n, v[2] / n]
}

function normOf(v: { x: number; y: number; z: number }): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

function gramSchmidtStep(
  ak: number[],
  qList: number[][]
): { v: number[]; projections: number[][] } {
  const v = [...ak]
  const projections: number[][] = []
  for (const q of qList) {
    const coef = dot(ak, q)
    const proj = q.map(qi => qi * coef)
    projections.push(proj)
    for (let i = 0; i < v.length; i++) v[i] -= proj[i]
  }
  return { v, projections }
}

function computeQR(A: number[][]): { Q: number[][]; R: number[][] } {
  const m = A.length
  const n = A[0].length
  const Q: number[][] = []
  const R: number[][] = Array.from({ length: m }, () => new Array(m).fill(0))
  for (let k = 0; k < m; k++) {
    const ak = A[k]
    const { v } = gramSchmidtStep(ak, Q)
    const vkNorm = norm(v)
    R[k][k] = vkNorm
    const qk = vkNorm > 1e-12 ? v.map(vi => vi / vkNorm) : new Array(n).fill(0)
    Q.push(qk)
    for (let i = 0; i < k; i++) {
      R[i][k] = dot(Q[i], ak)
    }
  }
  return { Q, R }
}

function determinant3(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number },
  v3: { x: number; y: number; z: number }
): number {
  return (
    v1.x * (v2.y * v3.z - v2.z * v3.y) -
    v1.y * (v2.x * v3.z - v2.z * v3.x) +
    v1.z * (v2.x * v3.y - v2.y * v3.x)
  )
}

function randInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

const aList = computed(() => {
  if (preset.value === '2d') {
    return [
      [a1.x, a1.y, a1.z],
      [a2.x, a2.y, a2.z]
    ]
  }
  return [
    [a1.x, a1.y, a1.z],
    [a2.x, a2.y, a2.z],
    [a3.x, a3.y, a3.z]
  ]
})

const maxAllowedStep = computed(() => (preset.value === '2d' ? 3 : 4))

const qr = computed(() => computeQR(aList.value))

const q1Arr = computed(() => qr.value.Q[0] || [0, 0, 0])
const q2Arr = computed(() => qr.value.Q[1] || [0, 0, 0])
const q3Arr = computed(() => qr.value.Q[2] || [0, 0, 0])

const q1Display = computed(() => q1Arr.value.map(v => v.toFixed(2)).join(', '))
const q2Display = computed(() => q2Arr.value.map(v => v.toFixed(2)).join(', '))
const q3Display = computed(() => q3Arr.value.map(v => v.toFixed(2)).join(', '))

const v2Arr = computed(() => {
  const a2Vec = [a2.x, a2.y, a2.z]
  const { v } = gramSchmidtStep(a2Vec, [q1Arr.value])
  return v
})
const q1DotV2 = computed(() => dot(q1Arr.value, v2Arr.value))
const orthoOk2 = computed(() => Math.abs(q1DotV2.value) < 1e-6)

const q1DotQ3 = computed(() => dot(q1Arr.value, q3Arr.value))
const q2DotQ3 = computed(() => dot(q2Arr.value, q3Arr.value))
const orthoOk31 = computed(() => Math.abs(q1DotQ3.value) < 1e-6)
const orthoOk32 = computed(() => Math.abs(q2DotQ3.value) < 1e-6)

const QtQ = computed(() => {
  const Q = qr.value.Q
  const m = Q.length
  const M: number[][] = []
  for (let i = 0; i < m; i++) {
    const row: number[] = []
    for (let j = 0; j < m; j++) {
      row.push(dot(Q[i], Q[j]))
    }
    M.push(row)
  }
  return M
})

const R = computed(() => qr.value.R)

const stepDescription = computed(() => {
  switch (currentStep.value) {
    case 0:
      return '初始状态：三个非正交的线性无关向量 a1, a2, a3（灰色半透明）。'
    case 1:
      return '将 a1 归一化为单位向量 q1（金色）。方向不变，长度变为 1。'
    case 2:
      return '从 a2 中剥离 q1 方向的投影分量，剩余部分 v2 ⊥ q1（橙色）。青绿色虚线为投影线。'
    case 3:
      return '将 v2 归一化为单位向量 q2（红色）。此时 {q1, q2} 构成标准正交组。'
    case 4:
      return '从 a3 中剥离 q1、q2 张成平面的全部投影分量，得到 v3，再归一化为 q3（蓝色）。完成！'
    default:
      return ''
  }
})

const tipText = computed(() => {
  if (currentStep.value === 0) {
    return '点击 "Step 1" 按钮开始 Gram-Schmidt 正交化过程。每完成一步，下一步按钮会自动解锁。可拖拽鼠标旋转视角观察 3D 几何关系。'
  }
  if (currentStep.value >= maxAllowedStep.value) {
    return 'Gram-Schmidt 正交化完成！Q 的列向量 q1, q2, q3 构成标准正交基（Q^T Q = I）。点击 "重新开始" 重新演示，或切换预设尝试不同向量。'
  }
  return '观察青绿色虚线标记的投影分解：每一步都从一个向量中"剥离"已有正交基方向的投影分量，剩余部分必然与已有基正交——这是 Gram-Schmidt 的几何本质。'
})

const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let originSphere: THREE.Mesh
let arrowA1: THREE.ArrowHelper
let arrowA2: THREE.ArrowHelper
let arrowA3: THREE.ArrowHelper

let projArrow1: THREE.ArrowHelper
let projArrow2: THREE.ArrowHelper

let projLine1: THREE.Line
let projLine2: THREE.Line

let square1: THREE.LineLoop
let square2: THREE.LineLoop

let planeMesh: THREE.Mesh
let planeEdges: THREE.LineSegments

interface StepAnimState {
  active: boolean
  startTime: number
  duration: number
  ease: (t: number) => number
  update: (easedT: number, rawT: number) => void
  onComplete: () => void
}
const stepAnim: StepAnimState = {
  active: false,
  startTime: 0,
  duration: 800,
  ease: (t) => t * (2 - t),
  update: () => {},
  onComplete: () => {}
}

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

const _cFrom = new THREE.Color()
const _cTo = new THREE.Color()
const _cOut = new THREE.Color()
function lerpColorHex(fromHex: number, toHex: number, t: number): number {
  _cFrom.setHex(fromHex)
  _cTo.setHex(toHex)
  _cOut.copy(_cFrom).lerp(_cTo, t)
  return _cOut.getHex()
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.3, Math.max(0.08, len * 0.25))
    const headWid = Math.min(0.14, Math.max(0.04, len * 0.18))
    arrow.setLength(len, headLen, headWid)
    arrow.visible = true
  } else {
    arrow.visible = false
  }
}

function setArrowColor(arrow: THREE.ArrowHelper, color: number) {
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  lineMat.color.setHex(color)
  coneMat.color.setHex(color)
}

function setArrowOpacity(arrow: THREE.ArrowHelper, opacity: number) {
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  lineMat.transparent = true
  coneMat.transparent = true
  lineMat.opacity = opacity
  coneMat.opacity = opacity
}

function setDashedLine(line: THREE.Line, p1: THREE.Vector3, p2: THREE.Vector3) {
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p1.x, p1.y, p1.z)
  pos.setXYZ(1, p2.x, p2.y, p2.z)
  pos.needsUpdate = true
  line.computeLineDistances()
}

function setLineOpacity(
  line: THREE.Line | THREE.LineLoop | THREE.LineSegments,
  opacity: number
) {
  const mat = line.material as THREE.LineBasicMaterial | THREE.LineDashedMaterial
  mat.transparent = true
  mat.opacity = opacity
}

function setSquare(
  square: THREE.LineLoop,
  corner: THREE.Vector3,
  u: THREE.Vector3,
  v: THREE.Vector3,
  size: number
) {
  const p0 = corner.clone()
  const p1 = corner.clone().addScaledVector(u, size)
  const p2 = corner.clone().addScaledVector(u, size).addScaledVector(v, size)
  const p3 = corner.clone().addScaledVector(v, size)
  const pos = square.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p0.x, p0.y, p0.z)
  pos.setXYZ(1, p1.x, p1.y, p1.z)
  pos.setXYZ(2, p2.x, p2.y, p2.z)
  pos.setXYZ(3, p3.x, p3.y, p3.z)
  pos.needsUpdate = true
}

function createAxis(dir: THREE.Vector3, color: number, length: number) {
  const arrow = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    0.2,
    0.1
  )
  setArrowColor(arrow, color)
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  lineMat.transparent = true
  lineMat.opacity = 0.55
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  coneMat.transparent = true
  coneMat.opacity = 0.55
  scene.add(arrow)
}

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
  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(4, 3, 6)
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
  controls.maxDistance = 25

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
  dirLight.position.set(5, 5, 10)
  scene.add(dirLight)

  const grid = new THREE.GridHelper(5, 10, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 2.5)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 2.5)
  createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 2.5)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  arrowA1 = createArrowObject()
  arrowA2 = createArrowObject()
  arrowA3 = createArrowObject()

  projArrow1 = createArrowObject()
  projArrow2 = createArrowObject()
  setArrowColor(projArrow1, COLOR_CYAN)
  setArrowColor(projArrow2, COLOR_CYAN)
  projArrow1.visible = false
  projArrow2.visible = false

  projLine1 = createDashedLineObject(COLOR_CYAN)
  projLine2 = createDashedLineObject(COLOR_CYAN)
  projLine1.visible = false
  projLine2.visible = false

  square1 = createSquareObject()
  square2 = createSquareObject()
  square1.visible = false
  square2.visible = false

  const planeGeom = new THREE.PlaneGeometry(4, 4, 1, 1)
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
    color: COLOR_PLANE,
    transparent: true,
    opacity: 0
  })
  planeEdges = new THREE.LineSegments(planeEdgeGeom, planeEdgeMat)
  scene.add(planeEdges)

  resetScene()
}

function createArrowObject(): THREE.ArrowHelper {
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_GRAY,
    0.25,
    0.12
  )
  setArrowColor(arrow, COLOR_GRAY)
  setArrowOpacity(arrow, 0.5)
  scene.add(arrow)
  return arrow
}

function createDashedLineObject(color: number): THREE.Line {
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.15,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.8,
    linewidth: 2
  })
  const line = new THREE.Line(geom, mat)
  line.computeLineDistances()
  scene.add(line)
  return line
}

function createSquareObject(): THREE.LineLoop {
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3))
  const mat = new THREE.LineBasicMaterial({
    color: COLOR_SQUARE,
    transparent: true,
    opacity: 0.85,
    linewidth: 2
  })
  const sq = new THREE.LineLoop(geom, mat)
  scene.add(sq)
  return sq
}

function resetScene() {
  const a1Vec = new THREE.Vector3(a1.x, a1.y, a1.z)
  const a2Vec = new THREE.Vector3(a2.x, a2.y, a2.z)
  const a3Vec = new THREE.Vector3(a3.x, a3.y, a3.z)

  setArrow(arrowA1, a1Vec)
  setArrowColor(arrowA1, COLOR_GRAY)
  setArrowOpacity(arrowA1, 0.5)

  setArrow(arrowA2, a2Vec)
  setArrowColor(arrowA2, COLOR_GRAY)
  setArrowOpacity(arrowA2, 0.5)

  if (preset.value === '2d') {
    arrowA3.visible = false
  } else {
    setArrow(arrowA3, a3Vec)
    setArrowColor(arrowA3, COLOR_GRAY)
    setArrowOpacity(arrowA3, 0.5)
  }

  projArrow1.visible = false
  projArrow2.visible = false
  projLine1.visible = false
  projLine2.visible = false
  square1.visible = false
  square2.visible = false

  const planeMat = planeMesh.material as THREE.MeshBasicMaterial
  planeMat.opacity = 0
  const planeEdgeMat = planeEdges.material as THREE.LineBasicMaterial
  planeEdgeMat.opacity = 0
  planeMesh.visible = false
  planeEdges.visible = false
}

function doStep1() {
  if (stepAnim.active || currentStep.value !== 0) return

  const a1Vec = new THREE.Vector3(a1.x, a1.y, a1.z)
  const a1Len = a1Vec.length()
  const q1Vec = new THREE.Vector3(q1Arr.value[0], q1Arr.value[1], q1Arr.value[2])
  const q1Dir = q1Vec.clone().normalize()

  stepAnim.active = true
  stepAnim.startTime = performance.now()
  stepAnim.duration = 800
  stepAnim.update = (t) => {

    let opacity: number
    let color: number
    let length: number
    if (t < 0.25) {
      const lt = t / 0.25
      opacity = lerp(0.5, 1.0, lt)
      color = lerpColorHex(COLOR_GRAY, COLOR_ORANGE, lt)
      length = a1Len
    } else {
      const lt = (t - 0.25) / 0.75
      opacity = 1.0
      color = lerpColorHex(COLOR_ORANGE, COLOR_Q1, lt)
      length = lerp(a1Len, 1, lt)
    }
    setArrowColor(arrowA1, color)
    setArrowOpacity(arrowA1, opacity)
    setArrow(arrowA1, q1Dir.clone().multiplyScalar(length))
  }
  stepAnim.onComplete = () => {
    currentStep.value = 1
    maxStep.value = Math.max(maxStep.value, 1)
  }
}

function doStep2() {
  if (stepAnim.active || currentStep.value !== 1) return

  const a2VecArr = [a2.x, a2.y, a2.z]
  const q1 = q1Arr.value
  const { v, projections } = gramSchmidtStep(a2VecArr, [q1])
  const v2Arr = v
  const proj1Arr = projections[0]

  const a2Vec = new THREE.Vector3(a2VecArr[0], a2VecArr[1], a2VecArr[2])
  const v2Vec = new THREE.Vector3(v2Arr[0], v2Arr[1], v2Arr[2])
  const proj1Vec = new THREE.Vector3(proj1Arr[0], proj1Arr[1], proj1Arr[2])
  const q1Vec = new THREE.Vector3(q1[0], q1[1], q1[2])

  setDashedLine(projLine1, a2Vec, proj1Vec)
  setLineOpacity(projLine1, 0)
  projLine1.visible = true

  setArrow(projArrow1, proj1Vec)
  setArrowColor(projArrow1, COLOR_CYAN)
  setArrowOpacity(projArrow1, 0)
  projArrow1.visible = true

  const v2Len = v2Vec.length()
  const v2Dir =
    v2Len > 1e-9 ? v2Vec.clone().divideScalar(v2Len) : new THREE.Vector3(1, 0, 0)
  setSquare(square1, proj1Vec, q1Vec.clone().negate(), v2Dir, 0.25)
  setLineOpacity(square1, 0)
  square1.visible = true

  stepAnim.active = true
  stepAnim.startTime = performance.now()
  stepAnim.duration = 800
  stepAnim.update = (t) => {

    let a2Color: number
    let a2Opacity: number
    let a2Tip: THREE.Vector3
    let projOpacity: number
    let lineOpacity: number
    let squareOpacity: number

    if (t < 0.2) {
      const lt = t / 0.2
      a2Color = lerpColorHex(COLOR_GRAY, COLOR_ORANGE, lt)
      a2Opacity = lerp(0.5, 1.0, lt)
      a2Tip = a2Vec.clone()
      projOpacity = 0
      lineOpacity = 0
      squareOpacity = 0
    } else if (t < 0.4) {
      const lt = (t - 0.2) / 0.2
      a2Color = COLOR_ORANGE
      a2Opacity = 1.0
      a2Tip = a2Vec.clone()
      projOpacity = lerp(0, 0.7, lt)
      lineOpacity = lerp(0, 0.8, lt)
      squareOpacity = 0
    } else if (t < 0.85) {
      const lt = (t - 0.4) / 0.45
      a2Color = COLOR_ORANGE
      a2Opacity = 1.0
      a2Tip = a2Vec.clone().lerp(v2Vec, lt)
      projOpacity = 0.7
      lineOpacity = 0.8
      squareOpacity = 0
    } else {
      const lt = (t - 0.85) / 0.15
      a2Color = COLOR_ORANGE
      a2Opacity = 1.0
      a2Tip = v2Vec.clone()
      projOpacity = lerp(0.7, 0, lt)
      lineOpacity = lerp(0.8, 0.3, lt)
      squareOpacity = lerp(0, 0.85, lt)
    }

    setArrowColor(arrowA2, a2Color)
    setArrowOpacity(arrowA2, a2Opacity)
    setArrow(arrowA2, a2Tip)

    setArrowOpacity(projArrow1, projOpacity)
    projArrow1.visible = projOpacity > 0.01

    setLineOpacity(projLine1, lineOpacity)
    projLine1.visible = lineOpacity > 0.01

    setLineOpacity(square1, squareOpacity)
    square1.visible = squareOpacity > 0.01
  }
  stepAnim.onComplete = () => {
    currentStep.value = 2
    maxStep.value = Math.max(maxStep.value, 2)

    setLineOpacity(projLine1, 0.3)
    setLineOpacity(square1, 0.85)
    setArrowOpacity(projArrow1, 0)
    projArrow1.visible = false
  }
}

function doStep3() {
  if (stepAnim.active || currentStep.value !== 2) return

  const a2VecArr = [a2.x, a2.y, a2.z]
  const q1 = q1Arr.value
  const { v } = gramSchmidtStep(a2VecArr, [q1])
  const v2Arr = v
  const v2Vec = new THREE.Vector3(v2Arr[0], v2Arr[1], v2Arr[2])
  const v2Len = v2Vec.length()
  const q2Vec = new THREE.Vector3(q2Arr.value[0], q2Arr.value[1], q2Arr.value[2])
  const q2Dir = q2Vec.clone().normalize()

  stepAnim.active = true
  stepAnim.startTime = performance.now()
  stepAnim.duration = 800
  stepAnim.update = (t) => {

    const color = lerpColorHex(COLOR_ORANGE, COLOR_Q2, t)
    const length = lerp(v2Len, 1, t)
    setArrowColor(arrowA2, color)
    setArrowOpacity(arrowA2, 1.0)
    setArrow(arrowA2, q2Dir.clone().multiplyScalar(length))
  }
  stepAnim.onComplete = () => {
    currentStep.value = 3
    maxStep.value = Math.max(maxStep.value, 3)

    setLineOpacity(projLine1, 0)
    projLine1.visible = false
    setLineOpacity(square1, 0)
    square1.visible = false
  }
}

function doStep4() {
  if (stepAnim.active || currentStep.value !== 3 || preset.value === '2d') return

  const a3VecArr = [a3.x, a3.y, a3.z]
  const q1 = q1Arr.value
  const q2 = q2Arr.value
  const { v, projections } = gramSchmidtStep(a3VecArr, [q1, q2])
  const v3Arr = v
  const proj1Arr = projections[0]
  const proj2Arr = projections[1]

  const a3Vec = new THREE.Vector3(a3VecArr[0], a3VecArr[1], a3VecArr[2])
  const v3Vec = new THREE.Vector3(v3Arr[0], v3Arr[1], v3Arr[2])
  const proj1Vec = new THREE.Vector3(proj1Arr[0], proj1Arr[1], proj1Arr[2])
  const proj2Vec = new THREE.Vector3(proj2Arr[0], proj2Arr[1], proj2Arr[2])
  const q1Vec = new THREE.Vector3(q1[0], q1[1], q1[2])
  const q2Vec = new THREE.Vector3(q2[0], q2[1], q2[2])
  const q3Vec = new THREE.Vector3(q3Arr.value[0], q3Arr.value[1], q3Arr.value[2])
  const q3Dir = q3Vec.clone().normalize()
  const v3Len = v3Vec.length()

  setDashedLine(projLine1, a3Vec, proj1Vec)
  setDashedLine(projLine2, a3Vec, proj2Vec)
  setLineOpacity(projLine1, 0)
  setLineOpacity(projLine2, 0)
  projLine1.visible = true
  projLine2.visible = true

  setArrow(projArrow1, proj1Vec)
  setArrowColor(projArrow1, COLOR_CYAN)
  setArrowOpacity(projArrow1, 0)
  projArrow1.visible = true

  setArrow(projArrow2, proj2Vec)
  setArrowColor(projArrow2, COLOR_CYAN)
  setArrowOpacity(projArrow2, 0)
  projArrow2.visible = true

  const a3MinusProj1Dir = a3Vec.clone().sub(proj1Vec)
  const a3MinusProj1Len = a3MinusProj1Dir.length()
  if (a3MinusProj1Len > 1e-9) a3MinusProj1Dir.divideScalar(a3MinusProj1Len)
  setSquare(square1, proj1Vec, q1Vec.clone().negate(), a3MinusProj1Dir, 0.25)
  setLineOpacity(square1, 0)
  square1.visible = true

  const a3MinusProj2Dir = a3Vec.clone().sub(proj2Vec)
  const a3MinusProj2Len = a3MinusProj2Dir.length()
  if (a3MinusProj2Len > 1e-9) a3MinusProj2Dir.divideScalar(a3MinusProj2Len)
  setSquare(square2, proj2Vec, q2Vec.clone().negate(), a3MinusProj2Dir, 0.25)
  setLineOpacity(square2, 0)
  square2.visible = true

  const planeNormal = new THREE.Vector3().crossVectors(q1Vec, q2Vec)
  if (planeNormal.lengthSq() > 1e-9) planeNormal.normalize()
  planeMesh.position.set(0, 0, 0)
  planeEdges.position.set(0, 0, 0)

  planeMesh.lookAt(planeNormal.clone())
  planeEdges.lookAt(planeNormal.clone())

  stepAnim.active = true
  stepAnim.startTime = performance.now()
  stepAnim.duration = 1200
  stepAnim.update = (t) => {

    let a3Color: number
    let a3Opacity: number
    let a3Tip: THREE.Vector3
    let proj1Opacity: number
    let proj2Opacity: number
    let line1Opacity: number
    let line2Opacity: number
    let square1Opacity: number
    let square2Opacity: number
    let planeOpacity: number

    if (t < 0.1) {
      const lt = t / 0.1
      a3Color = lerpColorHex(COLOR_GRAY, COLOR_ORANGE, lt)
      a3Opacity = lerp(0.5, 1.0, lt)
      a3Tip = a3Vec.clone()
      proj1Opacity = 0
      proj2Opacity = 0
      line1Opacity = 0
      line2Opacity = 0
      square1Opacity = 0
      square2Opacity = 0
      planeOpacity = 0
    } else if (t < 0.3) {
      const lt = (t - 0.1) / 0.2
      a3Color = COLOR_ORANGE
      a3Opacity = 1.0
      a3Tip = a3Vec.clone()
      proj1Opacity = lerp(0, 0.7, lt)
      proj2Opacity = lerp(0, 0.7, lt)
      line1Opacity = lerp(0, 0.8, lt)
      line2Opacity = lerp(0, 0.8, lt)
      square1Opacity = 0
      square2Opacity = 0
      planeOpacity = lerp(0, 0.2, lt)
    } else if (t < 0.7) {
      const lt = (t - 0.3) / 0.4
      a3Color = COLOR_ORANGE
      a3Opacity = 1.0
      a3Tip = a3Vec.clone().lerp(v3Vec, lt)
      proj1Opacity = 0.7
      proj2Opacity = 0.7
      line1Opacity = 0.8
      line2Opacity = 0.8
      square1Opacity = 0
      square2Opacity = 0
      planeOpacity = 0.2
    } else if (t < 0.85) {
      const lt = (t - 0.7) / 0.15
      a3Color = COLOR_ORANGE
      a3Opacity = 1.0
      a3Tip = v3Vec.clone()
      proj1Opacity = 0.7
      proj2Opacity = 0.7
      line1Opacity = 0.8
      line2Opacity = 0.8
      square1Opacity = lerp(0, 0.85, lt)
      square2Opacity = lerp(0, 0.85, lt)
      planeOpacity = 0.2
    } else {
      const lt = (t - 0.85) / 0.15

      a3Color = lerpColorHex(COLOR_ORANGE, COLOR_Q3, lt)
      a3Opacity = 1.0
      a3Tip = q3Dir.clone().multiplyScalar(lerp(v3Len, 1, lt))
      proj1Opacity = lerp(0.7, 0, lt)
      proj2Opacity = lerp(0.7, 0, lt)
      line1Opacity = lerp(0.8, 0.3, lt)
      line2Opacity = lerp(0.8, 0.3, lt)
      square1Opacity = 0.85
      square2Opacity = 0.85
      planeOpacity = 0.2
    }

    setArrowColor(arrowA3, a3Color)
    setArrowOpacity(arrowA3, a3Opacity)
    setArrow(arrowA3, a3Tip)

    setArrowOpacity(projArrow1, proj1Opacity)
    projArrow1.visible = proj1Opacity > 0.01
    setArrowOpacity(projArrow2, proj2Opacity)
    projArrow2.visible = proj2Opacity > 0.01

    setLineOpacity(projLine1, line1Opacity)
    projLine1.visible = line1Opacity > 0.01
    setLineOpacity(projLine2, line2Opacity)
    projLine2.visible = line2Opacity > 0.01

    setLineOpacity(square1, square1Opacity)
    square1.visible = square1Opacity > 0.01
    setLineOpacity(square2, square2Opacity)
    square2.visible = square2Opacity > 0.01

    const pMat = planeMesh.material as THREE.MeshBasicMaterial
    pMat.opacity = planeOpacity
    planeMesh.visible = planeOpacity > 0.01
    const peMat = planeEdges.material as THREE.LineBasicMaterial
    peMat.opacity = Math.min(1, planeOpacity * 2.5)
    planeEdges.visible = peMat.opacity > 0.01
  }
  stepAnim.onComplete = () => {
    currentStep.value = 4
    maxStep.value = Math.max(maxStep.value, 4)

    setLineOpacity(projLine1, 0.3)
    setLineOpacity(projLine2, 0.3)
    setArrowOpacity(projArrow1, 0)
    projArrow1.visible = false
    setArrowOpacity(projArrow2, 0)
    projArrow2.visible = false
  }
}

function reset() {
  stepAnim.active = false
  currentStep.value = 0
  maxStep.value = 0
  resetScene()
}

function setPreset(p: Preset) {
  stepAnim.active = false
  preset.value = p
  if (p === '2d') {
    a1.x = DEFAULT_A1_2D.x
    a1.y = DEFAULT_A1_2D.y
    a1.z = DEFAULT_A1_2D.z
    a2.x = DEFAULT_A2_2D.x
    a2.y = DEFAULT_A2_2D.y
    a2.z = DEFAULT_A2_2D.z
    a3.x = DEFAULT_A3.x
    a3.y = DEFAULT_A3.y
    a3.z = DEFAULT_A3.z
  } else if (p === '3d') {
    a1.x = DEFAULT_A1.x
    a1.y = DEFAULT_A1.y
    a1.z = DEFAULT_A1.z
    a2.x = DEFAULT_A2.x
    a2.y = DEFAULT_A2.y
    a2.z = DEFAULT_A2.z
    a3.x = DEFAULT_A3.x
    a3.y = DEFAULT_A3.y
    a3.z = DEFAULT_A3.z
  } else {

    a1.x = randInRange(-2, 2)
    a1.y = randInRange(-2, 2)
    a1.z = randInRange(-2, 2)
    a2.x = randInRange(-2, 2)
    a2.y = randInRange(-2, 2)
    a2.z = randInRange(-2, 2)
    a3.x = randInRange(-2, 2)
    a3.y = randInRange(-2, 2)
    a3.z = randInRange(-2, 2)

    let attempts = 0
    while (Math.abs(determinant3(a1, a2, a3)) < 0.5 && attempts < 50) {
      a3.x = randInRange(-2, 2)
      a3.y = randInRange(-2, 2)
      a3.z = randInRange(-2, 2)
      attempts++
    }
  }
  currentStep.value = 0
  maxStep.value = 0
  resetScene()
}

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  if (stepAnim.active) {
    const elapsed = time - stepAnim.startTime
    const rawT = Math.min(1, elapsed / stepAnim.duration)
    const easedT = stepAnim.ease(rawT)
    stepAnim.update(easedT, rawT)
    if (rawT >= 1) {
      stepAnim.active = false
      stepAnim.onComplete()
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
    console.error('GramSchmidtDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  stepAnim.active = false
  resizeObserver?.disconnect()
  controls?.dispose()
  scene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
      else (mesh.material as THREE.Material).dispose()
    }
  })
  renderer?.dispose()
  renderer?.forceContextLoss()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

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

.step-info {
  margin: var(--space-3) 0 var(--space-2) 0;
}

.step-progress {
  position: relative;
  height: 28px;
  background: var(--bg-code);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.step-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-hover));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-full);
}

.step-progress-markers {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  pointer-events: none;
}

.step-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-content);
  border: 2px solid var(--border-color-strong);
  color: var(--text-tertiary);
  font-size: var(--fs-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.step-marker.done {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.step-marker.current {
  background: var(--color-accent);
  border-color: var(--color-accent-strong);
  color: white;
  transform: scale(1.15);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.step-text {
  margin: var(--space-2) 0 0 0;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  line-height: 1.5;
}

.step-badge {
  display: inline-block;
  padding: 0.15em 0.6em;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-radius: var(--radius-sm);
  font-weight: 700;
  margin-right: var(--space-2);
}

.step-desc {
  color: var(--text-primary);
}

.step-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  justify-content: center;
}

.step-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.4em 1em;
  border: 1px solid var(--border-color-strong);
  background: var(--bg-content);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-family: var(--font-mono);
  font-weight: 600;
  transition: all 0.15s ease;
}

.step-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-code);
}

.step-btn .step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-accent);
  color: white;
  font-size: var(--fs-xs);
  font-weight: 700;
}

.step-btn:disabled .step-num {
  background: var(--border-color-strong);
}

.step-btn.reset-btn {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.step-btn.reset-btn:hover {
  background: var(--color-accent-hover);
  color: white;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
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
    #06b6d4 0,
    #06b6d4 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 20px;
}

.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.matrix-block {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  text-align: center;
}

.matrix-block .block-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-accent-strong);
  font-family: var(--font-mono);
}

.matrix-table {
  display: inline-table;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  position: relative;
  padding: 0 0.4em;
  vertical-align: middle;
}

.matrix-table::before,
.matrix-table::after {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background: var(--text-primary);
  border-radius: 1px;
}

.matrix-table::before { left: 0; }
.matrix-table::after { right: 0; }

.matrix-table td {
  padding: 0.3em 0.6em;
  text-align: center;
  color: var(--text-primary);
  font-weight: 600;
  min-width: 4.5em;
  position: relative;
}

.matrix-table.small td {
  padding: 0.25em 0.5em;
  min-width: 4em;
}

.matrix-table td.diagonal {
  background: rgba(251, 191, 36, 0.18);
  color: #b45309;
}

.matrix-table td.near-one {
  background: var(--bg-success-soft);
  color: var(--color-success);
}

.matrix-table td.near-zero {
  color: var(--color-success);
}

.matrix-table td.upper {
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
}

.matrix-table td.lower {
  color: var(--text-tertiary);
}

.matrix-table td .r-value {
  font-weight: 700;
}

.matrix-table td .r-hint {
  display: block;
  font-size: var(--fs-xs);
  color: var(--text-tertiary);
  font-weight: 400;
  margin-top: 2px;
}

.formula-block {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06), rgba(59, 130, 246, 0.06));
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
  line-height: 1.6;
}

@media (max-width: 720px) {
  .step-btn {
    flex: 1 1 calc(50% - var(--space-2));
    justify-content: center;
  }

  .step-btn .step-label {
    font-size: var(--fs-xs);
  }

  .matrix-table td {
    min-width: 3.5em;
    padding: 0.2em 0.4em;
  }
}
</style>
