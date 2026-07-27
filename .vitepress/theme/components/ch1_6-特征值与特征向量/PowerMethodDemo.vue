<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="dual-canvas">
      <div class="canvas-wrap">
        <p class="canvas-label">3D 视图 · 单位球面 + A<sup>k</sup>·v 迭代轨迹</p>
        <div ref="threeContainer" class="demo-canvas dual three-canvas" role="img" aria-label="幂法迭代三维演示画面，展示单位球面与迭代轨迹，可用鼠标拖拽旋转视角"></div>
      </div>
      <div class="canvas-wrap">
        <p class="canvas-label">
          范数曲线 · k vs ‖A<sup>k</sup>·v‖（对数）& log(‖A<sup>k</sup>·v‖)（k = 0 → {{ N }}，当前 k = {{ currentK }}）
        </p>
        <canvas ref="normCanvas" class="demo-canvas dual" role="img" aria-label="范数曲线画面，展示迭代次数与向量范数的变化"></canvas>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>
    <div v-if="warningMsg" class="demo-status" :class="warningType" role="status" aria-live="polite">{{ warningMsg }}</div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch sphere-swatch"></span>
        <span>单位球面 |x|=1（参考）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed-gold"></span>
        <span>特征向量方向（金色虚线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#10b981"></span>
        <span>起点向量 v₀（可拖拽）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ffffff;border:1px solid #888"></span>
        <span>当前迭代点 A<sup>k</sup>·v</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch gradient-yellow-red"></span>
        <span>历史轨迹（黄→红，k 递增）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>log(‖A<sup>k</sup>·v‖) 曲线</span>
      </span>
    </div>

    <div class="control-buttons">
      <button class="play-btn" :disabled="playing || !rendererOk" @click="play">播放迭代</button>
      <button class="pause-btn" :disabled="!playing" @click="pause">暂停</button>
      <button class="reset-btn" @click="reset">重置</button>
      <button class="step-btn" :disabled="playing || currentK >= N" @click="stepForward">单步前进</button>
      <button class="step-btn" :disabled="playing || currentK <= 0" @click="stepBackward">单步后退</button>
      <span class="iter-info">k = {{ currentK }} / {{ N }}</span>
    </div>

    <div class="preset-section">
      <p class="block-title">预设场景</p>
      <div class="preset-buttons" role="group" aria-label="预设方案选择">
        <button :class="{ active: preset === 'stable' }" :aria-pressed="preset === 'stable'" @click="setPreset('stable')">
          稳定压缩（ρ=0.8）
        </button>
        <button :class="{ active: preset === 'unstable' }" :aria-pressed="preset === 'unstable'" @click="setPreset('unstable')">
          不稳定发散（ρ=1.5）
        </button>
        <button :class="{ active: preset === 'rotation' }" :aria-pressed="preset === 'rotation'" @click="setPreset('rotation')">
          纯旋转（ρ=1，复特征值）
        </button>
        <button :class="{ active: preset === 'power' }" :aria-pressed="preset === 'power'" @click="setPreset('power')">
          幂法收敛（ρ=1，实特征值）
        </button>
      </div>
    </div>

    <div class="matrix-editor">
      <div class="matrix-display-block">
        <p class="block-title">矩阵 A</p>
        <table class="matrix-table">
          <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
          <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
        </table>
      </div>
      <div class="sliders-block">
        <p class="block-title">矩阵元素（−3 ~ 3，步长 0.1）</p>
        <label>a
          <input type="range" min="-3" max="3" step="0.1" v-model.number="a" />
          <span>{{ a.toFixed(2) }}</span>
        </label>
        <label>b
          <input type="range" min="-3" max="3" step="0.1" v-model.number="b" />
          <span>{{ b.toFixed(2) }}</span>
        </label>
        <label>c
          <input type="range" min="-3" max="3" step="0.1" v-model.number="c" />
          <span>{{ c.toFixed(2) }}</span>
        </label>
        <label>d
          <input type="range" min="-3" max="3" step="0.1" v-model.number="d" />
          <span>{{ d.toFixed(2) }}</span>
        </label>
      </div>
      <div class="param-block">
        <p class="block-title">迭代参数</p>
        <label>N（迭代次数）
          <input type="range" min="10" max="100" step="1" v-model.number="N" />
          <span>{{ N }}</span>
        </label>
        <label>v₀.x
          <input type="range" min="-2" max="2" step="0.05" v-model.number="v0x" />
          <span>{{ v0x.toFixed(2) }}</span>
        </label>
        <label>v₀.y
          <input type="range" min="-2" max="2" step="0.05" v-model.number="v0y" />
          <span>{{ v0y.toFixed(2) }}</span>
        </label>
      </div>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">A</span>
        <span class="value">[[{{ a.toFixed(2) }}, {{ b.toFixed(2) }}], [{{ c.toFixed(2) }}, {{ d.toFixed(2) }}]]</span>
      </div>
      <div class="output-row">
        <span class="label">tr(A) = a + d</span>
        <span class="value">{{ trace.toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="{ warning: isSingular }">
        <span class="label">det(A) = ad − bc</span>
        <span class="value">{{ determinant.toFixed(4) }}{{ isSingular ? '（奇异）' : '' }}</span>
      </div>
      <div class="output-row" :class="discriminantClass">
        <span class="label">判别式 Δ = tr²−4·det</span>
        <span class="value">{{ discriminant.toFixed(4) }}（{{ discriminantLabel }}）</span>
      </div>
      <div class="output-row">
        <span class="label">λ₁</span>
        <span class="value">{{ formatEigenvalue(lambda1) }}，|λ₁| = {{ absLambda1.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">λ₂</span>
        <span class="value">{{ formatEigenvalue(lambda2) }}，|λ₂| = {{ absLambda2.toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="stabilityClass">
        <span class="label">谱半径 ρ(A)</span>
        <span class="value">{{ spectralRadius.toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="stabilityClass">
        <span class="label">收敛判定</span>
        <span class="value">{{ convergenceLabel }}</span>
      </div>
      <div class="output-row">
        <span class="label">当前迭代 k</span>
        <span class="value">{{ currentK }}</span>
      </div>
      <div class="output-row" v-if="currentPoint">
        <span class="label">A<sup>k</sup>·v</span>
        <span class="value">({{ formatSci(currentPoint.x) }}, {{ formatSci(currentPoint.y) }})</span>
      </div>
      <div class="output-row" v-if="currentPoint">
        <span class="label">‖A<sup>k</sup>·v‖</span>
        <span class="value">{{ formatSci(currentNorm) }}</span>
      </div>
      <div class="output-row" v-if="dominantLambdaValue !== null">
        <span class="label">主特征值 |λ<sub>max</sub>|</span>
        <span class="value">{{ dominantLambdaValue.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">收敛速率（每步）</span>
        <span class="value">× {{ spectralRadius.toFixed(4) }}</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">幂法迭代公式</p>
      <p class="formula-line">x<sub>k+1</sub> = A·x<sub>k</sub> / ‖A·x<sub>k</sub>‖</p>
      <p class="formula-line">收敛：x<sub>k</sub> → v<sub>max</sub>（主特征向量方向）</p>
      <p class="formula-line">收敛速率：‖x<sub>k</sub> − v<sub>max</sub>‖ = O(|λ₂/λ₁|<sup>k</sup>)</p>
      <p class="formula-line">范数增长：‖A<sup>k</sup>·v‖ ≈ ρ(A)<sup>k</sup> · |v·v<sub>max</sub>|</p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '幂法迭代 · 最大特征值如何主导长期行为'
  }
)

const COLOR_SPHERE = 0x94a3b8
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6
const COLOR_EIGEN = 0xfbbf24
const COLOR_EIGEN_2ND = 0xf59e0b
const COLOR_V0 = 0x10b981
const COLOR_V0_HOVER = 0x34d399
const COLOR_CURRENT = 0xffffff
const COLOR_ORIGIN = 0x1f2937
const COLOR_TRAJ_START = '#fbbf24'
const COLOR_TRAJ_END = '#ef4444'
const COLOR_NORM_CURVE = '#fbbf24'
const COLOR_FIT_LINE = '#ef4444'

const a = ref(0.9)
const b = ref(0.2)
const c = ref(0.1)
const d = ref(0.8)

const N = ref(30)
const DEFAULT_V0 = { x: 1 / Math.SQRT2, y: 1 / Math.SQRT2 }
const v0x = ref(DEFAULT_V0.x)
const v0y = ref(DEFAULT_V0.y)

type PresetKey = 'stable' | 'unstable' | 'rotation' | 'power' | 'custom'
const preset = ref<PresetKey>('power')

interface PresetData {
  a: number
  b: number
  c: number
  d: number
}

const PRESETS: Record<Exclude<PresetKey, 'custom'>, PresetData> = {

  stable: { a: 0.5, b: 0, c: 0, d: 0.8 },

  unstable: { a: 1.2, b: 0, c: 0, d: 1.5 },

  rotation: {
    a: Math.cos(Math.PI / 3),
    b: -Math.sin(Math.PI / 3),
    c: Math.sin(Math.PI / 3),
    d: Math.cos(Math.PI / 3)
  },

  power: { a: 0.9, b: 0.2, c: 0.1, d: 0.8 }
}

function setPreset(p: PresetKey) {
  if (p === 'custom') return
  preset.value = p
  const t = PRESETS[p]
  a.value = t.a
  b.value = t.b
  c.value = t.c
  d.value = t.d

  reset()
}

watch([a, b, c, d], () => {
  const matched = (Object.keys(PRESETS) as Array<Exclude<PresetKey, 'custom'>>).find(k => {
    const p = PRESETS[k]
    return Math.abs(p.a - a.value) < 1e-6 && Math.abs(p.b - b.value) < 1e-6 &&
           Math.abs(p.c - c.value) < 1e-6 && Math.abs(p.d - d.value) < 1e-6
  })
  preset.value = matched || 'custom'
  recomputeTrajectory()
  updateSceneObjects()
  drawNormChart()
})

watch(N, () => {
  if (currentK.value > N.value) {
    currentK.value = N.value
  }
  recomputeTrajectory()
  updateSceneObjects()
  drawNormChart()
})

watch([v0x, v0y], () => {
  currentK.value = 0
  recomputeTrajectory()
  updateSceneObjects()
  drawNormChart()
})

const trace = computed(() => a.value + d.value)
const determinant = computed(() => a.value * d.value - b.value * c.value)
const discriminant = computed(() => {
  const t = trace.value
  const dt = determinant.value
  return t * t - 4 * dt
})

const isRealRoots = computed(() => discriminant.value >= 0)
const isRepeated = computed(() => Math.abs(discriminant.value) < 1e-6)
const isSingular = computed(() => Math.abs(determinant.value) < 1e-9)

const discriminantLabel = computed(() => {
  if (isRepeated.value) return 'Δ ≈ 0 · 重根'
  if (isRealRoots.value) return 'Δ > 0 · 实根'
  return 'Δ < 0 · 共轭复根'
})

const discriminantClass = computed(() => {
  if (isRepeated.value) return 'warning'
  if (isRealRoots.value) return 'highlight'
  return 'info'
})

const lambda1 = computed(() => {
  const t = trace.value
  const disc = discriminant.value
  if (disc >= 0) {
    return { re: (t + Math.sqrt(disc)) / 2, im: 0 }
  }
  return { re: t / 2, im: Math.sqrt(-disc) / 2 }
})

const lambda2 = computed(() => {
  const t = trace.value
  const disc = discriminant.value
  if (disc >= 0) {
    return { re: (t - Math.sqrt(disc)) / 2, im: 0 }
  }
  return { re: t / 2, im: -Math.sqrt(-disc) / 2 }
})

const absLambda1 = computed(() => Math.hypot(lambda1.value.re, lambda1.value.im))
const absLambda2 = computed(() => Math.hypot(lambda2.value.re, lambda2.value.im))

const spectralRadius = computed(() => Math.max(absLambda1.value, absLambda2.value))

const hasDominantDirection = computed(() => {
  if (!isRealRoots.value) return false
  return Math.abs(absLambda1.value - absLambda2.value) > 1e-4
})

const dominantLambdaValue = computed<number | null>(() => {
  if (!isRealRoots.value) return null
  return Math.max(absLambda1.value, absLambda2.value)
})

function computeEigenvector(lam: number): { x: number, y: number } | null {

  const v1x = b.value
  const v1y = lam - a.value
  const v2x = lam - d.value
  const v2y = c.value
  const n1 = Math.hypot(v1x, v1y)
  const n2 = Math.hypot(v2x, v2y)
  if (n1 > 1e-9 && n1 >= n2) {
    return { x: v1x / n1, y: v1y / n1 }
  }
  if (n2 > 1e-9) {
    return { x: v2x / n2, y: v2y / n2 }
  }

  return { x: 1, y: 0 }
}

const dominantEigenvector = computed<{ x: number, y: number } | null>(() => {
  if (!isRealRoots.value) return null
  const lam = absLambda1.value >= absLambda2.value ? lambda1.value.re : lambda2.value.re
  return computeEigenvector(lam)
})

const secondaryEigenvector = computed<{ x: number, y: number } | null>(() => {
  if (!isRealRoots.value || isRepeated.value) return null
  const lam = absLambda1.value >= absLambda2.value ? lambda2.value.re : lambda1.value.re
  return computeEigenvector(lam)
})

const convergenceLabel = computed(() => {
  const rho = spectralRadius.value
  if (rho < 0.99) return '渐近稳定（A^k·v → 0）'
  if (rho > 1.01) return '发散（A^k·v → ∞）'

  if (!isRealRoots.value) return '旋转（复特征值 e^(±iθ)）'
  if (isRepeated.value) return '重根（无主导方向）'
  if (hasDominantDirection.value) return '幂法收敛（→ 主特征向量方向）'
  return '无主导方向（|λ₁|=|λ₂|）'
})

const stabilityClass = computed(() => {
  const rho = spectralRadius.value
  if (rho < 0.99) return 'highlight'
  if (rho > 1.01) return 'danger'
  return 'warning'
})

function formatEigenvalue(ev: { re: number, im: number }): string {
  if (Math.abs(ev.im) < 1e-9) {
    return ev.re.toFixed(4)
  }
  const reAbs = Math.abs(ev.re)
  const imAbs = Math.abs(ev.im)
  const imStr = imAbs.toFixed(4) + 'i'
  if (reAbs < 1e-9) {
    return ev.im > 0 ? imStr : '−' + imStr
  }
  const sign = ev.im > 0 ? '+' : '−'
  return `${ev.re.toFixed(4)} ${sign} ${imStr}`
}

function formatSci(x: number): string {
  const absX = Math.abs(x)
  if (absX < 1e-4 && absX > 0) return x.toExponential(2)
  if (absX >= 1e6) return x.toExponential(2)
  if (Number.isFinite(x)) return x.toFixed(4)
  return '∞'
}

interface Point { x: number; y: number }

const trajectory = ref<Point[]>([])
const currentK = ref(0)
const playing = ref(false)
let stepTimer = 0
const STEP_INTERVAL_MS = 150

const warningMsg = ref('')
const warningType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const currentPoint = computed<Point | null>(() => {
  if (trajectory.value.length === 0) return null
  return trajectory.value[Math.min(currentK.value, trajectory.value.length - 1)]
})

const currentNorm = computed(() => {
  const p = currentPoint.value
  if (!p) return 0
  return Math.hypot(p.x, p.y)
})

function recomputeTrajectory() {
  const traj: Point[] = [{ x: v0x.value, y: v0y.value }]
  let cur: Point = { x: v0x.value, y: v0y.value }
  let diverged = false
  const maxK = Math.min(currentK.value, N.value)
  for (let k = 0; k < maxK; k++) {
    const next: Point = {
      x: a.value * cur.x + b.value * cur.y,
      y: c.value * cur.x + d.value * cur.y
    }
    const mag = Math.hypot(next.x, next.y)
    if (mag > 1e6) {
      diverged = true
      traj.push(next)
      break
    }
    traj.push(next)
    cur = next
  }
  trajectory.value = traj

  if (diverged) {
    warningMsg.value = '轨迹发散过快（‖A^k·v‖ > 1e6），已停止迭代'
    warningType.value = 'warning'
  } else if (isSingular.value) {
    warningMsg.value = 'det(A) = 0，矩阵奇异，至少一个特征值为 0'
    warningType.value = 'warning'
  } else if (spectralRadius.value >= 0.99 && spectralRadius.value <= 1.01 && !isRealRoots.value) {
    warningMsg.value = 'ℹ 旋转：复特征值位于单位圆上，A^k·v 在原点附近旋转'
    warningType.value = 'info'
  } else if (hasDominantDirection.value && Math.abs(spectralRadius.value - 1) < 0.01) {
    warningMsg.value = 'ℹ 幂法收敛：A^k·v/‖A^k·v‖ 收敛到主特征向量方向'
    warningType.value = 'info'
  } else {
    warningMsg.value = ''
  }
}

function play() {
  if (playing.value) return

  if (currentK.value >= N.value || trajectory.value.length <= currentK.value + 1) {
    currentK.value = 0
    recomputeTrajectory()
  }
  playing.value = true
  stepNext()
}

function stepNext() {
  if (!playing.value) return
  if (currentK.value >= N.value) {
    playing.value = false
    return
  }
  const last = trajectory.value[trajectory.value.length - 1]
  const next: Point = {
    x: a.value * last.x + b.value * last.y,
    y: c.value * last.x + d.value * last.y
  }
  const mag = Math.hypot(next.x, next.y)
  trajectory.value.push(next)
  currentK.value++
  if (mag > 1e6) {
    playing.value = false
    warningMsg.value = '轨迹发散过快（‖A^k·v‖ > 1e6），已停止迭代'
    warningType.value = 'warning'
    updateSceneObjects()
    drawNormChart()
    return
  }
  updateSceneObjects()
  drawNormChart()
  stepTimer = window.setTimeout(stepNext, STEP_INTERVAL_MS)
}

function pause() {
  playing.value = false
  if (stepTimer) {
    clearTimeout(stepTimer)
    stepTimer = 0
  }
}

function stepForward() {
  if (playing.value) return
  if (currentK.value >= N.value) return
  const last = trajectory.value[trajectory.value.length - 1]
  const next: Point = {
    x: a.value * last.x + b.value * last.y,
    y: c.value * last.x + d.value * last.y
  }
  trajectory.value.push(next)
  currentK.value++
  updateSceneObjects()
  drawNormChart()
}

function stepBackward() {
  if (playing.value) return
  if (currentK.value <= 0) return
  trajectory.value.pop()
  currentK.value--
  updateSceneObjects()
  drawNormChart()
}

function reset() {
  pause()
  v0x.value = DEFAULT_V0.x
  v0y.value = DEFAULT_V0.y
  currentK.value = 0
  recomputeTrajectory()
  updateSceneObjects()
  drawNormChart()
}

const threeContainer = ref<HTMLElement | null>(null)
const normCanvas = ref<HTMLCanvasElement | null>(null)
let normCtx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let animationId = 0
const dpr = Math.min(window.devicePixelRatio || 1, 2)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
const rendererOk = ref(false)

let unitSphere: THREE.Mesh
let sphereWire: THREE.Mesh
let equatorLine: THREE.Line
let axisX: THREE.ArrowHelper
let axisY: THREE.ArrowHelper
let axisZ: THREE.ArrowHelper
let eigenLine1: THREE.Line
let eigenLine2: THREE.Line
let trajLine: THREE.Line
let v0Sphere: THREE.Mesh
let currentSphere: THREE.Mesh
let currentArrow: THREE.ArrowHelper
let originSphere: THREE.Mesh

const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2()
let isDragging = false
let isHovered = false
const dragPlane = new THREE.Plane()

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const MAX_VIZ = 5

function initScene() {
  const container = threeContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }

  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()

  scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(3, 3, 4)
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
  controls.minDistance = 1.5
  controls.maxDistance = 25

  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const dir = new THREE.DirectionalLight(0xffffff, 0.45)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const sphereGeom = new THREE.SphereGeometry(1, 32, 24)
  const sphereMat = new THREE.MeshBasicMaterial({
    color: COLOR_SPHERE,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  })
  unitSphere = new THREE.Mesh(sphereGeom, sphereMat)
  scene.add(unitSphere)

  const wireGeom = new THREE.SphereGeometry(1, 16, 12)
  const wireMat = new THREE.MeshBasicMaterial({
    color: COLOR_SPHERE,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  })
  sphereWire = new THREE.Mesh(wireGeom, wireMat)
  scene.add(sphereWire)

  const equatorGeom = new THREE.BufferGeometry()
  const equatorPts: number[] = []
  const segs = 64
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * Math.PI * 2
    equatorPts.push(Math.cos(ang), Math.sin(ang), 0)
  }
  equatorGeom.setAttribute('position', new THREE.Float32BufferAttribute(equatorPts, 3))
  const equatorMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
  })
  equatorLine = new THREE.Line(equatorGeom, equatorMat)
  scene.add(equatorLine)

  axisX = createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 1.5)
  axisY = createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 1.5)
  axisZ = createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 1.5)

  const origGeom = new THREE.SphereGeometry(0.05, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  eigenLine1 = createDashedLine(COLOR_EIGEN, 0.85)
  scene.add(eigenLine1)
  eigenLine2 = createDashedLine(COLOR_EIGEN_2ND, 0.5)
  scene.add(eigenLine2)

  const trajGeom = new THREE.BufferGeometry()
  const MAX_POINTS = 110
  trajGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3))
  trajGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3))
  trajGeom.setDrawRange(0, 0)
  const trajMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    linewidth: 2,
    transparent: true,
    opacity: 0.95
  })
  trajLine = new THREE.Line(trajGeom, trajMat)
  scene.add(trajLine)

  const v0Geom = new THREE.SphereGeometry(0.09, 24, 24)
  const v0Mat = new THREE.MeshBasicMaterial({ color: COLOR_V0 })
  v0Sphere = new THREE.Mesh(v0Geom, v0Mat)
  v0Sphere.position.set(v0x.value, v0y.value, 0)
  scene.add(v0Sphere)

  const curGeom = new THREE.SphereGeometry(0.1, 24, 24)
  const curMat = new THREE.MeshBasicMaterial({ color: COLOR_CURRENT })
  currentSphere = new THREE.Mesh(curGeom, curMat)
  currentSphere.position.set(v0x.value, v0y.value, 0)
  scene.add(currentSphere)

  currentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_CURRENT, 0.2, 0.1
  )
  scene.add(currentArrow)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerUp)
  renderer.domElement.style.touchAction = 'none'

  rendererOk.value = true
}

function createAxis(dir: THREE.Vector3, color: number, length: number): THREE.ArrowHelper {
  const arrow = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    0.2,
    0.1
  )
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  lineMat.transparent = true
  lineMat.opacity = 0.65
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  coneMat.transparent = true
  coneMat.opacity = 0.65
  scene.add(arrow)
  return arrow
}

function createDashedLine(color: number, opacity: number): THREE.Line {
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity
  })
  const line = new THREE.Line(geom, mat)
  line.computeLineDistances()
  return line
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]
}

function lerpColorRGB(c1: string, c2: string, t: number): [number, number, number] {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  return [
    (r1 + (r2 - r1) * t) / 255,
    (g1 + (g2 - g1) * t) / 255,
    (b1 + (b2 - b1) * t) / 255
  ]
}

function clampForViz(x: number, y: number): [number, number] {
  const mag = Math.hypot(x, y)
  if (mag > MAX_VIZ) {
    const s = MAX_VIZ / mag
    return [x * s, y * s]
  }
  return [x, y]
}

function updateEigenLines() {

  const ev1 = dominantEigenvector.value
  if (ev1) {
    const pos = eigenLine1.geometry.attributes.position as THREE.BufferAttribute

    pos.setXYZ(0, -ev1.x, -ev1.y, 0)
    pos.setXYZ(1, ev1.x, ev1.y, 0)
    pos.needsUpdate = true
    eigenLine1.computeLineDistances()
    eigenLine1.visible = true
  } else {
    eigenLine1.visible = false
  }

  const ev2 = secondaryEigenvector.value
  if (ev2) {
    const pos = eigenLine2.geometry.attributes.position as THREE.BufferAttribute
    pos.setXYZ(0, -ev2.x, -ev2.y, 0)
    pos.setXYZ(1, ev2.x, ev2.y, 0)
    pos.needsUpdate = true
    eigenLine2.computeLineDistances()
    eigenLine2.visible = true
  } else {
    eigenLine2.visible = false
  }
}

function updateTrajLine() {
  const total = trajectory.value.length
  if (total < 1) {
    trajLine.geometry.setDrawRange(0, 0)
    return
  }
  const showCount = Math.min(currentK.value + 1, total)
  const posAttr = trajLine.geometry.attributes.position as THREE.BufferAttribute
  const colAttr = trajLine.geometry.attributes.color as THREE.BufferAttribute

  for (let i = 0; i < showCount; i++) {
    const p = trajectory.value[i]
    const [vx, vy] = clampForViz(p.x, p.y)
    posAttr.setXYZ(i, vx, vy, 0)

    const t = showCount > 1 ? i / (showCount - 1) : 0
    const [r, g, b] = lerpColorRGB(COLOR_TRAJ_START, COLOR_TRAJ_END, t)
    colAttr.setXYZ(i, r, g, b)
  }
  posAttr.needsUpdate = true
  colAttr.needsUpdate = true
  trajLine.geometry.setDrawRange(0, showCount)
}

function updateCurrentObjects() {
  const p = currentPoint.value
  if (!p) {
    currentSphere.visible = false
    currentArrow.visible = false
    return
  }
  currentSphere.visible = true
  const [vx, vy] = clampForViz(p.x, p.y)
  currentSphere.position.set(vx, vy, 0)

  const v = new THREE.Vector3(vx, vy, 0)
  const len = v.length()
  if (len > 1e-3) {
    currentArrow.setDirection(v.clone().normalize())
    const headLen = Math.min(0.3, Math.max(0.08, len * 0.25))
    const headWid = Math.min(0.14, Math.max(0.04, len * 0.18))
    currentArrow.setLength(len, headLen, headWid)
    currentArrow.visible = true
  } else {
    currentArrow.visible = false
  }
}

function updateV0Object() {
  if (!v0Sphere) return
  v0Sphere.position.set(v0x.value, v0y.value, 0)
  const mat = v0Sphere.material as THREE.MeshBasicMaterial
  if (isDragging) {
    mat.color.setHex(COLOR_V0_HOVER)
    v0Sphere.scale.setScalar(1.25)
  } else if (isHovered) {
    mat.color.setHex(COLOR_V0_HOVER)
    v0Sphere.scale.setScalar(1.15)
  } else {
    mat.color.setHex(COLOR_V0)
    v0Sphere.scale.setScalar(1.0)
  }
}

function updateSceneObjects() {
  if (!scene) return
  updateEigenLines()
  updateTrajLine()
  updateCurrentObjects()
  updateV0Object()
}

function getMouseNDC(event: PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onPointerDown(event: PointerEvent) {
  if (!renderer || !camera || !v0Sphere) return
  getMouseNDC(event)
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(v0Sphere)
  if (intersects.length > 0) {
    isDragging = true
    controls.enabled = false

    dragPlane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1),
      v0Sphere.position.clone()
    )
  }
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera || !v0Sphere) return
  getMouseNDC(event)
  if (isDragging) {
    raycaster.setFromCamera(mouseNDC, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {

      intersection.x = Math.max(-2, Math.min(2, intersection.x))
      intersection.y = Math.max(-2, Math.min(2, intersection.y))
      intersection.z = 0
      v0x.value = intersection.x
      v0y.value = intersection.y
    }
  } else {
    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObject(v0Sphere)
    const wasHovered = isHovered
    isHovered = intersects.length > 0
    renderer.domElement.style.cursor = isHovered ? 'grab' : 'default'
    if (wasHovered !== isHovered) {
      updateV0Object()
    }
  }
}

function onPointerUp() {
  if (isDragging) {
    isDragging = false
    controls.enabled = true
  }
  isHovered = false
  if (renderer) renderer.domElement.style.cursor = 'default'
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return
  controls.update()
  renderer.render(scene, camera)
}

function handleResize() {
  if (!threeContainer.value || !renderer || !camera) return
  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  drawNormChart()
}

function drawNormChart() {
  const canvas = normCanvas.value
  if (!canvas || !normCtx) return
  const rect = canvas.getBoundingClientRect()
  const cssW = rect.width
  const cssH = rect.height
  if (cssW === 0 || cssH === 0) return
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
  }
  normCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const ctx = normCtx

  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-content').trim()
  ctx.fillStyle = bg || '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  const padding = { top: 24, right: 24, bottom: 32, left: 56, mid: 18 }
  const subH = (cssH - padding.top - padding.bottom - padding.mid) / 2
  const plotW = cssW - padding.left - padding.right
  const topY = padding.top
  const botY = padding.top + subH + padding.mid

  const norms: number[] = []
  const logNorms: number[] = []
  for (let i = 0; i < trajectory.value.length; i++) {
    const p = trajectory.value[i]
    const n = Math.hypot(p.x, p.y)
    norms.push(n)
    logNorms.push(n > 1e-12 ? Math.log(n) : -30)
  }

  drawNormSubplot(ctx, padding.left, topY, plotW, subH, norms)

  drawLogNormSubplot(ctx, padding.left, botY, plotW, subH, logNorms)
}

function drawNormSubplot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  norms: number[]
) {

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 12px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('k vs ‖A^k·v‖（对数尺度）', x, y - 16)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  const maxK = N.value

  let maxN = 1
  let minN = 1
  for (const n of norms) {
    if (n > maxN) maxN = n
    if (n < minN && n > 1e-12) minN = n
  }
  let logMax = Math.log10(Math.max(maxN, 1))
  let logMin = Math.log10(Math.min(minN, 1))
  if (logMax === logMin) {
    logMax += 1
    logMin -= 1
  } else {
    const pad = (logMax - logMin) * 0.1
    logMax += pad
    logMin -= pad
  }

  logMax = Math.min(logMax, 8)
  logMin = Math.max(logMin, -8)

  ctx.fillStyle = '#6b7280'
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = '#f1f5f9'
  const startExp = Math.floor(logMin)
  const endExp = Math.ceil(logMax)
  for (let e = startExp; e <= endExp; e++) {
    const py = y + h - ((e - logMin) / (logMax - logMin)) * h
    if (py < y || py > y + h) continue
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    const label = e === 0 ? '1' : '10^' + e
    ctx.fillText(label, x - 4, py)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xTickCount = Math.min(8, maxK)
  for (let i = 0; i <= xTickCount; i++) {
    const k = Math.round((i / xTickCount) * maxK)
    const px = x + (k / maxK) * w
    ctx.fillText(k.toString(), px, y + h + 4)
  }
  ctx.fillStyle = '#475569'
  ctx.font = 'italic 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('k', x + w, y + h + 22)

  if (logMin <= 0 && logMax >= 0) {
    const py = y + h - ((0 - logMin) / (logMax - logMin)) * h
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText('‖v‖=1', x + 4, py - 2)
  }

  if (norms.length >= 2) {
    ctx.strokeStyle = COLOR_NORM_CURVE
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < norms.length; i++) {
      const px = x + (i / maxK) * w
      const n = Math.max(norms[i], 1e-12)
      const logN = Math.log10(n)
      let py = y + h - ((logN - logMin) / (logMax - logMin)) * h
      py = Math.max(y, Math.min(y + h, py))
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  if (currentK.value < norms.length) {
    const k = currentK.value
    const px = x + (k / maxK) * w
    const n = Math.max(norms[k], 1e-12)
    const logN = Math.log10(n)
    let py = y + h - ((logN - logMin) / (logMax - logMin)) * h
    py = Math.max(y, Math.min(y + h, py))
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(px, py, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(px, py, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function drawLogNormSubplot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  logNorms: number[]
) {

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 12px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('k vs log(‖A^k·v‖)（线性，斜率 = log ρ）', x, y - 16)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  const maxK = N.value

  let maxL = -Infinity
  let minL = Infinity
  for (const l of logNorms) {
    if (l > maxL) maxL = l
    if (l < minL) minL = l
  }
  if (!Number.isFinite(maxL)) { maxL = 1; minL = -1 }
  if (maxL === minL) { maxL += 1; minL -= 1 }
  const pad = (maxL - minL) * 0.15
  maxL += pad
  minL -= pad

  maxL = Math.min(maxL, 20)
  minL = Math.max(minL, -30)

  ctx.fillStyle = '#6b7280'
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = '#f1f5f9'
  const yTickCount = 5
  for (let i = 0; i <= yTickCount; i++) {
    const v = minL + (i / yTickCount) * (maxL - minL)
    const py = y + h - (i / yTickCount) * h
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    ctx.fillText(v.toFixed(2), x - 4, py)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xTickCount = Math.min(8, maxK)
  for (let i = 0; i <= xTickCount; i++) {
    const k = Math.round((i / xTickCount) * maxK)
    const px = x + (k / maxK) * w
    ctx.fillText(k.toString(), px, y + h + 4)
  }
  ctx.fillStyle = '#475569'
  ctx.font = 'italic 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('k', x + w, y + h + 22)

  if (minL <= 0 && maxL >= 0) {
    const py = y + h - ((0 - minL) / (maxL - minL)) * h
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const rho = spectralRadius.value
  const logRho = rho > 1e-12 ? Math.log(rho) : -30
  const logV0 = logNorms.length > 0 ? logNorms[0] : 0

  ctx.strokeStyle = COLOR_FIT_LINE + 'b3'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  const px0 = x
  const pxN = x + w
  const py0 = y + h - ((logV0 - minL) / (maxL - minL)) * h
  const pyN = y + h - ((logV0 + maxK * logRho - minL) / (maxL - minL)) * h
  ctx.moveTo(px0, Math.max(y, Math.min(y + h, py0)))
  ctx.lineTo(pxN, Math.max(y, Math.min(y + h, pyN)))
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = COLOR_FIT_LINE
  ctx.font = 'bold 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  const slopeLabel = `斜率 = log(ρ) = ${logRho.toFixed(4)}`
  ctx.fillText(slopeLabel, x + w - 4, y + 4)

  if (logNorms.length >= 2) {
    ctx.strokeStyle = COLOR_NORM_CURVE
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < logNorms.length; i++) {
      const px = x + (i / maxK) * w
      let py = y + h - ((logNorms[i] - minL) / (maxL - minL)) * h
      py = Math.max(y, Math.min(y + h, py))
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  if (currentK.value < logNorms.length) {
    const k = currentK.value
    const px = x + (k / maxK) * w
    let py = y + h - ((logNorms[k] - minL) / (maxL - minL)) * h
    py = Math.max(y, Math.min(y + h, py))
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(px, py, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(px, py, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

const tipText = computed(() => {
  const rho = spectralRadius.value
  let base = ''
  if (rho < 0.99) {
    base = '当前 ρ(A) < 1，迭代 A^k·v 渐近收敛到 0。每步乘以 ρ 倍——观察右侧 log(‖A^k·v‖) 直线斜率 = log(ρ) < 0。'
  } else if (rho > 1.01) {
    base = '当前 ρ(A) > 1，迭代 A^k·v 发散到 ∞。每步乘以 ρ 倍——观察右侧 log(‖A^k·v‖) 直线斜率 = log(ρ) > 0。'
  } else if (!isRealRoots.value) {
    base = '当前 ρ(A) ≈ 1，特征值为共轭复数 e^(±iθ)，迭代 A^k·v 在原点附近做旋转，模长周期性振荡。'
  } else if (hasDominantDirection.value) {
    base = '幂法收敛：ρ ≈ 1 且存在主特征值 |λ_max| > |λ_min|，A^k·v/‖A^k·v‖ 收敛到主特征向量方向（金色虚线）。'
  } else {
    base = '当前 |λ₁| = |λ₂|，无单一主导方向，A^k·v 不会收敛到特定方向。'
  }
  base += ' 拖拽 3D 视图中的绿色球体可改变初始向量 v₀ 的方向，观察收敛方向是否随之改变。'
  return base
})

onMounted(() => {
  if (normCanvas.value) {
    normCtx = normCanvas.value.getContext('2d')
  }
  try {
    initScene()
    if (rendererOk.value) {

      trajectory.value = [{ x: v0x.value, y: v0y.value }]
      currentK.value = 0
      recomputeTrajectory()
      updateSceneObjects()
      drawNormChart()
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('PowerMethodDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (threeContainer.value) resizeObserver.observe(threeContainer.value)
  if (normCanvas.value) resizeObserver.observe(normCanvas.value)
})

onBeforeUnmount(() => {
  pause()
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerUp)
  }
  scene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
      else (mesh.material as THREE.Material).dispose()
    }
  })
  controls?.dispose()
  renderer?.dispose()
  renderer?.forceContextLoss()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

.dual-canvas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: var(--space-2) 0;
}

.canvas-wrap {
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.canvas-label {
  margin: 0;
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-accent-strong);
  font-family: var(--font-mono);
}

.demo-canvas.dual {
  width: 100%;
  height: 420px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: block;
}

.demo-canvas.dual.three-canvas {
  position: relative;
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
}

.demo-status {
  margin-top: var(--space-2);
  padding: 0.4em 0.9em;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.demo-status.info { background: var(--bg-info-soft); color: var(--color-info); }
.demo-status.success { background: var(--bg-success-soft); color: var(--color-success); }
.demo-status.warning { background: var(--bg-warning-soft); color: var(--color-warning); }
.demo-status.error { background: var(--bg-danger-soft); color: var(--color-danger); }

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

.legend-swatch.sphere-swatch {
  background: rgba(148, 163, 184, 0.35);
  border: 1px solid #94a3b8;
  height: 12px;
  width: 12px;
  border-radius: 50%;
}

.legend-swatch.dashed-gold {
  background: repeating-linear-gradient(
    to right,
    #fbbf24 0,
    #fbbf24 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 22px;
}

.legend-swatch.gradient-yellow-red {
  background: linear-gradient(to right, #fbbf24, #ef4444);
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 22px;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  align-items: center;
  justify-content: center;
}

.control-buttons button {
  padding: 0.45em 1.2em;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-family: var(--font-mono);
  font-weight: 600;
  transition: all 0.15s ease;
}

.control-buttons button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.control-buttons button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.control-buttons .play-btn:hover:not(:disabled) {
  border-color: var(--color-success);
  color: var(--color-success);
}

.control-buttons .pause-btn:hover:not(:disabled) {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.control-buttons .reset-btn:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.control-buttons .step-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.iter-info {
  margin-left: var(--space-2);
  padding: 0.25em 0.8em;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 600;
}

.preset-section {
  margin: var(--space-3) 0;
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
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
  font-family: var(--font-mono);
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

.matrix-editor {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  align-items: flex-start;
}

.matrix-display-block {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.block-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--border-color);
}

.matrix-table {
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  position: relative;
  padding: 0 0.6em;
  margin-top: var(--space-1);
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
  min-width: 3.5em;
}

.sliders-block,
.param-block {
  flex: 1 1 260px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sliders-block {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-2);
  align-content: start;
}

.param-block {
  flex: 0 0 220px;
}

.sliders-block label,
.param-block label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: 500;
  font-family: var(--font-mono);
}

.sliders-block label input[type="range"],
.param-block label input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 80px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.sliders-block label input[type="range"]::-webkit-slider-thumb,
.param-block label input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.sliders-block label input[type="range"]::-webkit-slider-thumb:hover,
.param-block label input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.sliders-block label input[type="range"]::-moz-range-thumb,
.param-block label input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.sliders-block label span,
.param-block label span {
  display: inline-flex;
  align-items: center;
  padding: 0.15em 0.5em;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 600;
  min-width: 3em;
  justify-content: center;
}

.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: 0.3em 0.6em;
  background: var(--bg-content);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.output-row .label {
  color: var(--text-secondary);
  font-weight: 500;
  flex: 0 0 auto;
}

.output-row .value {
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
  flex: 1 1 auto;
  word-break: break-all;
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

.output-row.warning {
  background: var(--bg-warning-soft);
  border-color: var(--color-warning);
}

.output-row.warning .label,
.output-row.warning .value {
  color: var(--color-warning);
}

.output-row.info {
  background: var(--bg-info-soft);
  border-color: var(--color-info);
}

.output-row.info .label,
.output-row.info .value {
  color: var(--color-info);
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

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
  line-height: 1.7;
  padding: 0 var(--space-2);
}

.control-buttons button:focus-visible,
.preset-buttons button:focus-visible,
.sliders-block input[type="range"]:focus-visible,
.param-block input[type="range"]:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

@media (max-width: 760px) {
  .demo-canvas.dual {
    height: 340px;
  }
  .matrix-editor {
    flex-direction: column;
  }
  .param-block {
    flex: 1 1 auto;
  }
}
</style>
