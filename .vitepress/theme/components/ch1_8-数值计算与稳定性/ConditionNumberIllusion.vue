<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'identity' }" @click="setPreset('identity')">
        完美良态（圆 → 圆）
      </button>
      <button :class="{ active: preset === 'diag' }" @click="setPreset('diag')">
        良态各向异性（圆 → 椭圆）
      </button>
      <button :class="{ active: preset === 'mid' }" @click="setPreset('mid')">
        中等病态（圆 → 略扁椭圆）
      </button>
      <button :class="{ active: preset === 'ill' }" @click="setPreset('ill')">
        病态（圆 → 扁长椭圆）
      </button>
      <button :class="{ active: preset === 'singular' }" @click="setPreset('singular')">
        接近奇异（圆 → 极扁线段）
      </button>
    </div>

    <div class="dual-canvas" ref="dualCanvasRoot">

      <div class="canvas-wrap">
        <p class="canvas-label">输入空间 R² · 单位扰动圆斑</p>
        <div ref="leftCanvasContainer" class="demo-canvas dual"></div>
        <div class="canvas-hint">
          <span class="hint-row white">● 白色：中心向量 x（长度 1）</span>
          <span class="hint-row cyan">● 青色：100 个扰动点 x+ε·v（ε=0.05）</span>
          <span class="hint-row red">● 红色箭头：v₁（最大右奇异方向）</span>
          <span class="hint-row blue">● 蓝色箭头：v₂（最小右奇异方向）</span>
        </div>
      </div>

      <div class="mapping-bar">
        <div class="matrix-badge">A</div>
        <table class="matrix-table small">
          <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
          <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
        </table>
        <div class="kappa-mini" :class="kappaColorClass">
          κ = <span class="kappa-value">{{ kappaText }}</span>
        </div>
        <div class="arrow-line">↦</div>
        <div class="mapping-tip">x ↦ A·x</div>
        <div class="amp-factor">误差放大<br>{{ ampFactorText }}</div>
      </div>

      <div class="canvas-wrap" :class="{ 'pulse-danger': isExtremeIllConditioned }">
        <p class="canvas-label">输出空间 R² · 椭圆畸变</p>
        <div ref="rightCanvasContainer" class="demo-canvas dual"></div>
        <div class="canvas-hint">
          <span class="hint-row red">● 红色长轴：σ₁ = {{ sigma1.toFixed(4) }}</span>
          <span class="hint-row blue">● 蓝色短轴：σ₂ = {{ isSingular ? '≈ 0' : sigma2.toFixed(4) }}</span>
          <span class="hint-row gradient">● 渐变点云：按 ‖A·v‖ 编码（青→黄→红）</span>
          <span v-if="isIllConditioned" class="hint-row warn">⚠ 病态震颤中</span>
        </div>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div v-if="warningMsg" class="warning-banner" :class="warningType">
      ⚠ {{ warningMsg }}
    </div>

    <div class="matrix-editor">
      <p class="block-title">矩阵 A 编辑器（2×2）· 拖动滑块实时计算 SVD 与 κ</p>
      <div class="editor-body">
        <table class="matrix-table">
          <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
          <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
        </table>
        <div class="sliders-block">
          <label v-for="item in sliderItems" :key="item.key">
            <span class="slider-label">{{ item.label }}</span>
            <input
              type="range" min="-2" max="2" step="0.1"
              :value="item.value"
              @input="updateMatrix(item.key, parseFloat(($event.target as HTMLInputElement).value))"
            />
            <span class="slider-val">{{ item.value.toFixed(1) }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="condition-panel">
      <p class="block-title">条件数面板 · κ(A) = σ<sub>max</sub>/σ<sub>min</sub></p>
      <div class="condition-body">
        <div class="kappa-big-display" :class="kappaColorClass">
          <div class="kappa-label">κ(A)</div>
          <div class="kappa-number">{{ kappaText }}</div>
          <div class="kappa-level">{{ conditionLevel }}</div>
        </div>

        <div class="numeric-grid">
          <div class="output-row">
            <span class="label">σ₁（最大奇异值）</span>
            <span class="value">{{ sigma1.toFixed(6) }}</span>
          </div>
          <div class="output-row" :class="{ warn: isSingular }">
            <span class="label">σ₂（最小奇异值）</span>
            <span class="value">{{ isSingular ? '≈ 0（奇异）' : sigma2.toFixed(6) }}</span>
          </div>
          <div class="output-row" :class="{ warn: Math.abs(det) < 1e-3 }">
            <span class="label">det(A)</span>
            <span class="value">{{ det.toFixed(6) }}</span>
          </div>
          <div class="output-row" :class="{ warn: det < 0 }">
            <span class="label">行列式符号</span>
            <span class="value">{{ det > 1e-9 ? '正（保向）' : det < -1e-9 ? '负（含反射）' : '零（退化）' }}</span>
          </div>
          <div class="output-row">
            <span class="label">A⁻¹（逆矩阵）</span>
            <span class="value mono">{{ inverseMatrixText }}</span>
          </div>
          <div class="output-row">
            <span class="label">误差放大倍数</span>
            <span class="value">{{ ampFactorText }}</span>
          </div>
          <div class="output-row">
            <span class="label">‖A‖₂（谱范数）</span>
            <span class="value">{{ sigma1.toFixed(6) }}</span>
          </div>
          <div class="output-row">
            <span class="label">‖A⁻¹‖₂</span>
            <span class="value">{{ isSingular ? '∞' : (1 / sigma2).toFixed(6) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="svd-display">
      <div class="matrix-display-block">
        <p class="block-title">U 矩阵（左奇异向量）</p>
        <table class="matrix-table small">
          <tr v-for="(row, i) in uMatrix" :key="i">
            <td v-for="(val, j) in row" :key="j">{{ val.toFixed(3) }}</td>
          </tr>
        </table>
        <p class="matrix-desc">第 1 列 = 椭圆长轴方向 u₁（红）</p>
        <p class="matrix-desc">第 2 列 = 椭圆短轴方向 u₂（蓝）</p>
      </div>
      <div class="matrix-display-block">
        <p class="block-title">Σ 矩阵（奇异值）</p>
        <table class="matrix-table small">
          <tr><td>{{ sigma1.toFixed(3) }}</td><td>0</td></tr>
          <tr><td>0</td><td>{{ isSingular ? '0.000' : sigma2.toFixed(3) }}</td></tr>
        </table>
        <p class="matrix-desc">σ₁/σ₂ = κ</p>
        <p class="matrix-desc">σᵢ = √λᵢ(AᵀA)</p>
      </div>
      <div class="matrix-display-block">
        <p class="block-title">Vᵀ 矩阵（右奇异向量）</p>
        <table class="matrix-table small">
          <tr v-for="(row, i) in vtMatrix" :key="i">
            <td v-for="(val, j) in row" :key="j">{{ val.toFixed(3) }}</td>
          </tr>
        </table>
        <p class="matrix-desc">V 第 1 列 = 输入对应 v₁（红）</p>
        <p class="matrix-desc">V 第 2 列 = 输入对应 v₂（蓝）</p>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">📐 条件数与数值稳定性</p>
      <p class="formula-line">条件数定义：<span class="math">κ(A) = ‖A‖·‖A⁻¹‖ = σ<sub>max</sub>/σ<sub>min</sub></span></p>
      <p class="formula-line">误差放大：<span class="math">‖Δx‖/‖x‖ ≤ κ(A)·‖ΔA‖/‖A‖</span></p>
      <p class="formula-line">SVD 分解：<span class="math">A = U Σ V<sup>T</sup></span>，<span class="math">κ = σ₁/σ<sub>n</sub></span></p>
      <p class="formula-line">几何意义：单位圆 → 椭圆，长轴 σ₁，短轴 σ₂，比值即 κ</p>
      <p class="formula-line">病态判据：κ&lt;10 良态 / 10-100 中等 / 100-1000 病态 / &gt;1000 极病态</p>
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
    title: '条件数幻象 · 输入圆斑 → 输出畸变椭圆'
  }
)

const COLOR_INPUT_CLOUD = 0x06b6d4
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_S1 = 0xef4444
const COLOR_S2 = 0x3b82f6
const COLOR_CENTER = 0xffffff
const COLOR_V1 = 0xef4444
const COLOR_V2 = 0x3b82f6
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_ELLIPSE_GOOD = 0xffffff
const COLOR_ELLIPSE_ILL = 0xdc2626

const a = ref(1)
const b = ref(0)
const c = ref(0)
const d = ref(1)

type MatrixKey = 'a' | 'b' | 'c' | 'd'
const sliderItems = computed(() => [
  { key: 'a' as MatrixKey, label: 'a', value: a.value },
  { key: 'b' as MatrixKey, label: 'b', value: b.value },
  { key: 'c' as MatrixKey, label: 'c', value: c.value },
  { key: 'd' as MatrixKey, label: 'd', value: d.value }
])

type PresetKey = 'identity' | 'diag' | 'mid' | 'ill' | 'singular' | 'custom'
const preset = ref<PresetKey>('identity')

function updateMatrix(key: MatrixKey, value: number) {
  const v = Math.max(-2, Math.min(2, value))
  if (key === 'a') a.value = v
  else if (key === 'b') b.value = v
  else if (key === 'c') c.value = v
  else if (key === 'd') d.value = v
  preset.value = 'custom'
}

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'identity':

      a.value = 1; b.value = 0; c.value = 0; d.value = 1
      break
    case 'diag':

      a.value = 2; b.value = 0; c.value = 0; d.value = 1
      break
    case 'mid':

      a.value = 1; b.value = 0.5; c.value = 0.5; d.value = 1
      break
    case 'ill':

      a.value = 1; b.value = 1; c.value = 0; d.value = 0.1
      break
    case 'singular':

      a.value = 1; b.value = 1; c.value = 1; d.value = 1.01
      break
  }
}

type Matrix = number[][]

function transpose(M: Matrix): Matrix {
  return [
    [M[0][0], M[1][0]],
    [M[0][1], M[1][1]]
  ]
}

function matMul(A: Matrix, B: Matrix): Matrix {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]
  ]
}

function matVec(A: Matrix, v: number[]): number[] {
  return [
    A[0][0] * v[0] + A[0][1] * v[1],
    A[1][0] * v[0] + A[1][1] * v[1]
  ]
}

function jacobiEigen2x2(S: Matrix): { values: number[], vectors: Matrix } {
  const s11 = S[0][0], s12 = S[0][1], s22 = S[1][1]
  let theta = 0
  if (Math.abs(s12) > 1e-15) {
    const tau = (s22 - s11) / (2 * s12)
    const t = (tau >= 0)
      ? 1 / (tau + Math.sqrt(tau * tau + 1))
      : -1 / (-tau + Math.sqrt(tau * tau + 1))
    theta = Math.atan(t)
  }
  const c = Math.cos(theta)
  const s = Math.sin(theta)

  const l1 = s11 * c * c + s22 * s * s + 2 * s12 * c * s
  const l2 = s11 * s * s + s22 * c * c - 2 * s12 * c * s

  const v1x = c, v1y = s
  const v2x = -s, v2y = c

  if (l1 >= l2) {
    return {
      values: [l1, l2],
      vectors: [[v1x, v2x], [v1y, v2y]]
    }
  } else {
    return {
      values: [l2, l1],
      vectors: [[v2x, v1x], [v2y, v1y]]
    }
  }
}

function computeSVD2x2(A: Matrix): { U: Matrix, S: number[], V: Matrix } {
  const At = transpose(A)
  const AtA = matMul(At, A)
  const { values: eigenvalues, vectors: V } = jacobiEigen2x2(AtA)

  const sigma1 = Math.sqrt(Math.max(0, eigenvalues[0]))
  const sigma2 = Math.sqrt(Math.max(0, eigenvalues[1]))

  let U: Matrix
  if (sigma1 < 1e-10) {

    U = [[1, 0], [0, 1]]
  } else {

    const v1 = [V[0][0], V[1][0]]
    const u1 = matVec(A, v1).map(x => x / sigma1)
    let u2: number[]
    if (sigma2 > 1e-10) {

      const v2 = [V[0][1], V[1][1]]
      u2 = matVec(A, v2).map(x => x / sigma2)
    } else {

      u2 = [-u1[1], u1[0]]
    }
    U = [[u1[0], u2[0]], [u1[1], u2[1]]]
  }

  return { U, S: [sigma1, sigma2], V }
}

const Amatrix = computed<Matrix>(() => [
  [a.value, b.value],
  [c.value, d.value]
])

const svdResult = computed(() => computeSVD2x2(Amatrix.value))
const U = computed(() => svdResult.value.U)
const V = computed(() => svdResult.value.V)
const Vt = computed(() => transpose(V.value))
const S = computed(() => svdResult.value.S)

const sigma1 = computed(() => S.value[0] || 0)
const sigma2 = computed(() => S.value[1] || 0)

const det = computed(() => a.value * d.value - b.value * c.value)

const isSingular = computed(() => sigma2.value < 1e-10)

const kappa = computed(() => {
  if (sigma2.value < 1e-10) return Infinity
  return sigma1.value / sigma2.value
})

const kappaText = computed(() => {
  const k = kappa.value
  if (!isFinite(k)) return '∞'
  if (k > 10000) return k.toExponential(2)
  return k.toFixed(2)
})

const uMatrix = computed<Matrix>(() => U.value)
const vtMatrix = computed<Matrix>(() => Vt.value)

const conditionLevel = computed(() => {
  const k = kappa.value
  if (!isFinite(k)) return '奇异（不可逆）'
  if (k < 10) return '良态'
  if (k < 100) return '中等病态'
  if (k < 1000) return '病态'
  return '极病态'
})

const kappaColorClass = computed(() => {
  const k = kappa.value
  if (!isFinite(k)) return 'kappa-singular'
  if (k < 10) return 'kappa-good'
  if (k < 100) return 'kappa-mid'
  if (k < 1000) return 'kappa-ill'
  return 'kappa-extreme'
})

const isIllConditioned = computed(() => isFinite(kappa.value) && kappa.value > 100)
const isExtremeIllConditioned = computed(() => isFinite(kappa.value) && kappa.value > 1000)

const ampFactorText = computed(() => {
  const k = kappa.value
  if (!isFinite(k)) return '∞（不可逆）'
  if (k > 1000) return `${k.toExponential(1)}·ε`
  return `${k.toFixed(2)}·ε`
})

const inverseMatrixText = computed(() => {
  if (isSingular.value) return '不可逆（det ≈ 0）'
  const detInv = 1 / det.value
  const inv: Matrix = [
    [d.value * detInv, -b.value * detInv],
    [-c.value * detInv, a.value * detInv]
  ]
  return `[[${inv[0][0].toFixed(3)}, ${inv[0][1].toFixed(3)}], [${inv[1][0].toFixed(3)}, ${inv[1][1].toFixed(3)}]]`
})

const warningMsg = computed(() => {
  if (isSingular.value) return '奇异矩阵：σ₂ ≈ 0，矩阵不可逆，κ = ∞'
  if (isExtremeIllConditioned.value) return '极病态矩阵：输入微小扰动 → 输出剧烈震荡（κ > 1000）'
  if (isIllConditioned.value) return '病态矩阵：输入微小扰动 → 输出剧烈震荡（κ > 100）'
  return ''
})

const warningType = computed(() => {
  if (isSingular.value || isExtremeIllConditioned.value) return 'danger'
  if (isIllConditioned.value) return 'warning'
  return 'info'
})

const tipText = computed(() => {
  if (isSingular.value) {
    return '奇异矩阵：σ₂ ≈ 0，矩阵将整个平面压缩到一条直线（或原点），逆不存在。任何沿 v₂ 方向的扰动都会被无限放大，数值计算不可靠。'
  }
  const k = kappa.value
  let tip = `当前 κ(A) = ${kappaText.value}，等级：${conditionLevel.value}。`
  if (k < 10) {
    tip += '良态矩阵：圆形输入扰动 → 椭圆形输出，长短轴接近，数值稳定。'
  } else if (k < 100) {
    tip += '中等病态：椭圆开始变扁，但仍然可分辨主次方向。'
  } else if (k < 1000) {
    tip += '病态：椭圆极扁，开始震颤。σ₂ 接近 0 时，沿 v₂ 方向的扰动被剧烈放大。'
  } else {
    tip += '极病态：椭圆几乎退化为线段，σ₂ 极小，数值计算不可靠。'
  }
  tip += ' SVD 视角：U 的列是输出椭圆主轴方向，V 的列是输入圆的对应方向，σᵢ 决定各方向拉伸倍数。'
  return tip
})

const leftCanvasContainer = ref<HTMLElement | null>(null)
const rightCanvasContainer = ref<HTMLElement | null>(null)
const dualCanvasRoot = ref<HTMLElement | null>(null)

let leftScene: THREE.Scene, rightScene: THREE.Scene
let leftCamera: THREE.OrthographicCamera, rightCamera: THREE.OrthographicCamera
let leftRenderer: THREE.WebGLRenderer, rightRenderer: THREE.WebGLRenderer
let leftControls: OrbitControls, rightControls: OrbitControls
let resizeObserver: ResizeObserver
let renderId = 0

let leftCenterArrow: THREE.ArrowHelper | null = null
let leftV1Arrow: THREE.ArrowHelper | null = null
let leftV2Arrow: THREE.ArrowHelper | null = null
let leftInputPoints: THREE.Points | null = null
let leftCircle: THREE.LineLoop | null = null
let leftGrid: THREE.GridHelper
let leftOriginSphere!: THREE.Mesh
let leftAxisX!: THREE.ArrowHelper
let leftAxisY!: THREE.ArrowHelper

let rightCenterArrow: THREE.ArrowHelper | null = null
let rightU1Arrow: THREE.ArrowHelper | null = null
let rightU2Arrow: THREE.ArrowHelper | null = null
let rightOutputPoints: THREE.Points | null = null
let rightEllipse: THREE.LineLoop | null = null
let rightS1Axis: THREE.Line | null = null
let rightS2Axis: THREE.Line | null = null
let rightGrid: THREE.GridHelper
let rightOriginSphere!: THREE.Mesh
let rightBgMesh!: THREE.Mesh
let rightAxisX!: THREE.ArrowHelper
let rightAxisY!: THREE.ArrowHelper

const PERTURB_COUNT = 100
const perturbAngles = new Float32Array(PERTURB_COUNT)
for (let i = 0; i < PERTURB_COUNT; i++) {
  perturbAngles[i] = Math.random() * Math.PI * 2
}

const CIRCLE_SEGMENTS = 64
const circleAngles = new Float32Array(CIRCLE_SEGMENTS)
for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
  circleAngles[i] = (i / CIRCLE_SEGMENTS) * Math.PI * 2
}

const EPSILON = 0.05

const INPUT_X: [number, number] = [Math.SQRT1_2, Math.SQRT1_2]

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function checkWebGL(): boolean {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  return !!gl
}

function gradientColor(t: number): THREE.Color {
  const tt = Math.max(0, Math.min(1, t))
  const cyan = new THREE.Color(0x06b6d4)
  const yellow = new THREE.Color(0xeab308)
  const red = new THREE.Color(0xef4444)
  if (tt < 0.5) {
    return cyan.lerp(yellow, tt * 2)
  } else {
    return yellow.lerp(red, (tt - 0.5) * 2)
  }
}

function disposeObj(scene: THREE.Scene, obj: THREE.Object3D) {
  scene.remove(obj)
  if (obj instanceof THREE.ArrowHelper) {
    obj.dispose()
  } else if (obj instanceof THREE.Points || obj instanceof THREE.Mesh) {
    obj.geometry.dispose()
    ;(obj.material as THREE.Material).dispose()
  } else if (obj instanceof THREE.LineLoop || obj instanceof THREE.Line) {
    obj.geometry.dispose()
    ;(obj.material as THREE.Material).dispose()
  }
}

function initLeftScene() {
  const container = leftCanvasContainer.value!
  const w = container.clientWidth || 400
  const h = container.clientHeight || 400

  leftScene = new THREE.Scene()
  leftScene.background = new THREE.Color(0xf8fafc)

  const aspect = w / h
  const viewSize = 3.2
  leftCamera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2, viewSize * aspect / 2,
    viewSize / 2, -viewSize / 2,
    0.1, 100
  )
  leftCamera.position.set(0, 0, 10)
  leftCamera.up.set(0, 1, 0)
  leftCamera.lookAt(0, 0, 0)

  try {
    leftRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '⚠ 左侧 WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return
  }
  leftRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  leftRenderer.setSize(w, h)
  leftRenderer.domElement.style.width = '100%'
  leftRenderer.domElement.style.height = '100%'
  leftRenderer.domElement.style.display = 'block'
  container.appendChild(leftRenderer.domElement)

  leftControls = new OrbitControls(leftCamera, leftRenderer.domElement)
  leftControls.enableDamping = true
  leftControls.dampingFactor = 0.08
  leftControls.minZoom = 0.3
  leftControls.maxZoom = 5

  leftControls.enableRotate = false

  leftScene.add(new THREE.AmbientLight(0xffffff, 0.95))

  leftGrid = new THREE.GridHelper(6, 12, 0x9ca3af, COLOR_GRID)
  leftGrid.rotation.x = Math.PI / 2
  ;(leftGrid.material as THREE.Material).transparent = true
  ;(leftGrid.material as THREE.Material).opacity = 0.5
  leftScene.add(leftGrid)

  const origGeom = new THREE.SphereGeometry(0.06, 16, 12)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  leftOriginSphere = new THREE.Mesh(origGeom, origMat)
  leftScene.add(leftOriginSphere)

  leftAxisX = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.5, COLOR_AXIS_X, 0.18, 0.12
  )
  leftAxisY = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.5, COLOR_AXIS_Y, 0.18, 0.12
  )
  ;(leftAxisX.line.material as THREE.LineBasicMaterial).opacity = 0.4
  ;(leftAxisX.line.material as THREE.LineBasicMaterial).transparent = true
  ;(leftAxisY.line.material as THREE.LineBasicMaterial).opacity = 0.4
  ;(leftAxisY.line.material as THREE.LineBasicMaterial).transparent = true
  leftScene.add(leftAxisX, leftAxisY)
}

function initRightScene() {
  const container = rightCanvasContainer.value!
  const w = container.clientWidth || 400
  const h = container.clientHeight || 400

  rightScene = new THREE.Scene()
  rightScene.background = new THREE.Color(0xf8fafc)

  const aspect = w / h
  const viewSize = 3.2
  rightCamera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2, viewSize * aspect / 2,
    viewSize / 2, -viewSize / 2,
    0.1, 100
  )
  rightCamera.position.set(0, 0, 10)
  rightCamera.up.set(0, 1, 0)
  rightCamera.lookAt(0, 0, 0)

  try {
    rightRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '⚠ 右侧 WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return
  }
  rightRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  rightRenderer.setSize(w, h)
  rightRenderer.domElement.style.width = '100%'
  rightRenderer.domElement.style.height = '100%'
  rightRenderer.domElement.style.display = 'block'
  container.appendChild(rightRenderer.domElement)

  rightControls = new OrbitControls(rightCamera, rightRenderer.domElement)
  rightControls.enableDamping = true
  rightControls.dampingFactor = 0.08
  rightControls.minZoom = 0.3
  rightControls.maxZoom = 5
  rightControls.enableRotate = false

  rightScene.add(new THREE.AmbientLight(0xffffff, 0.95))

  const bgGeom = new THREE.PlaneGeometry(50, 50)
  const bgMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  rightBgMesh = new THREE.Mesh(bgGeom, bgMat)
  rightBgMesh.position.z = -2
  rightScene.add(rightBgMesh)

  rightGrid = new THREE.GridHelper(6, 12, 0x9ca3af, COLOR_GRID)
  rightGrid.rotation.x = Math.PI / 2
  ;(rightGrid.material as THREE.Material).transparent = true
  ;(rightGrid.material as THREE.Material).opacity = 0.5
  rightScene.add(rightGrid)

  const origGeom = new THREE.SphereGeometry(0.06, 16, 12)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  rightOriginSphere = new THREE.Mesh(origGeom, origMat)
  rightScene.add(rightOriginSphere)

  rightAxisX = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.5, COLOR_AXIS_X, 0.18, 0.12
  )
  rightAxisY = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.5, COLOR_AXIS_Y, 0.18, 0.12
  )
  ;(rightAxisX.line.material as THREE.LineBasicMaterial).opacity = 0.4
  ;(rightAxisX.line.material as THREE.LineBasicMaterial).transparent = true
  ;(rightAxisY.line.material as THREE.LineBasicMaterial).opacity = 0.4
  ;(rightAxisY.line.material as THREE.LineBasicMaterial).transparent = true
  rightScene.add(rightAxisX, rightAxisY)
}

function clearLeftDynamicObjects() {
  if (leftCenterArrow) { disposeObj(leftScene, leftCenterArrow); leftCenterArrow = null }
  if (leftV1Arrow) { disposeObj(leftScene, leftV1Arrow); leftV1Arrow = null }
  if (leftV2Arrow) { disposeObj(leftScene, leftV2Arrow); leftV2Arrow = null }
  if (leftInputPoints) { disposeObj(leftScene, leftInputPoints); leftInputPoints = null }
  if (leftCircle) { disposeObj(leftScene, leftCircle); leftCircle = null }
}

function updateLeftScene() {
  if (!leftScene) return
  clearLeftDynamicObjects()

  const xDir = new THREE.Vector3(INPUT_X[0], INPUT_X[1], 0)
  const xLen = xDir.length()
  if (xLen > 1e-6) {
    xDir.normalize()
    leftCenterArrow = new THREE.ArrowHelper(xDir, new THREE.Vector3(0, 0, 0), 1.0, COLOR_CENTER, 0.16, 0.1)
    leftScene.add(leftCenterArrow)
  }

  const positions = new Float32Array(PERTURB_COUNT * 3)
  for (let i = 0; i < PERTURB_COUNT; i++) {
    const theta = perturbAngles[i]
    const dx = EPSILON * Math.cos(theta)
    const dy = EPSILON * Math.sin(theta)
    positions[i * 3] = INPUT_X[0] + dx
    positions[i * 3 + 1] = INPUT_X[1] + dy
    positions[i * 3 + 2] = 0
  }
  const pointsGeo = new THREE.BufferGeometry()
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pointsMat = new THREE.PointsMaterial({
    color: COLOR_INPUT_CLOUD,
    size: 0.07,
    sizeAttenuation: true
  })
  leftInputPoints = new THREE.Points(pointsGeo, pointsMat)
  leftScene.add(leftInputPoints)

  const circlePositions = new Float32Array(CIRCLE_SEGMENTS * 3)
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const theta = circleAngles[i]
    circlePositions[i * 3] = INPUT_X[0] + EPSILON * Math.cos(theta)
    circlePositions[i * 3 + 1] = INPUT_X[1] + EPSILON * Math.sin(theta)
    circlePositions[i * 3 + 2] = 0
  }
  const circleGeo = new THREE.BufferGeometry()
  circleGeo.setAttribute('position', new THREE.BufferAttribute(circlePositions, 3))
  const circleMat = new THREE.LineBasicMaterial({
    color: COLOR_INPUT_CLOUD,
    transparent: true,
    opacity: 0.7
  })
  leftCircle = new THREE.LineLoop(circleGeo, circleMat)
  leftScene.add(leftCircle)

  const v1 = [V.value[0][0], V.value[1][0]]
  const v2 = [V.value[0][1], V.value[1][1]]
  const v1Dir = new THREE.Vector3(v1[0], v1[1], 0)
  const v2Dir = new THREE.Vector3(v2[0], v2[1], 0)
  if (v1Dir.length() > 1e-6) {
    v1Dir.normalize()
    leftV1Arrow = new THREE.ArrowHelper(v1Dir, new THREE.Vector3(0, 0, 0), 1.2, COLOR_V1, 0.2, 0.13)
    leftScene.add(leftV1Arrow)
  }
  if (v2Dir.length() > 1e-6) {
    v2Dir.normalize()
    leftV2Arrow = new THREE.ArrowHelper(v2Dir, new THREE.Vector3(0, 0, 0), 1.0, COLOR_V2, 0.2, 0.13)
    leftScene.add(leftV2Arrow)
  }
}

function clearRightDynamicObjects() {
  if (rightCenterArrow) { disposeObj(rightScene, rightCenterArrow); rightCenterArrow = null }
  if (rightU1Arrow) { disposeObj(rightScene, rightU1Arrow); rightU1Arrow = null }
  if (rightU2Arrow) { disposeObj(rightScene, rightU2Arrow); rightU2Arrow = null }
  if (rightOutputPoints) { disposeObj(rightScene, rightOutputPoints); rightOutputPoints = null }
  if (rightEllipse) { disposeObj(rightScene, rightEllipse); rightEllipse = null }
  if (rightS1Axis) { disposeObj(rightScene, rightS1Axis); rightS1Axis = null }
  if (rightS2Axis) { disposeObj(rightScene, rightS2Axis); rightS2Axis = null }
}

function updateRightScene() {
  if (!rightScene) return
  clearRightDynamicObjects()

  const A = Amatrix.value
  const s1 = sigma1.value
  const s2 = sigma2.value
  const Umat = U.value
  const u1 = [Umat[0][0], Umat[1][0]]
  const u2 = [Umat[0][1], Umat[1][1]]

  const Ax = matVec(A, INPUT_X)
  const axLen = Math.hypot(Ax[0], Ax[1])
  if (axLen > 1e-6) {
    const axDir = new THREE.Vector3(Ax[0], Ax[1], 0).normalize()
    rightCenterArrow = new THREE.ArrowHelper(axDir, new THREE.Vector3(0, 0, 0), axLen, COLOR_CENTER, 0.16, 0.1)
    rightScene.add(rightCenterArrow)
  }

  const positions = new Float32Array(PERTURB_COUNT * 3)
  const colors = new Float32Array(PERTURB_COUNT * 3)
  const sMin = s2
  const sMax = s1
  const sRange = sMax - sMin
  for (let i = 0; i < PERTURB_COUNT; i++) {
    const theta = perturbAngles[i]
    const dx = EPSILON * Math.cos(theta)
    const dy = EPSILON * Math.sin(theta)

    const out = matVec(A, [INPUT_X[0] + dx, INPUT_X[1] + dy])
    positions[i * 3] = out[0]
    positions[i * 3 + 1] = out[1]
    positions[i * 3 + 2] = 0

    const av = matVec(A, [Math.cos(theta), Math.sin(theta)])
    const avNorm = Math.hypot(av[0], av[1])
    const t = sRange > 1e-9 ? (avNorm - sMin) / sRange : 0
    const c = gradientColor(t)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  const pointsGeo = new THREE.BufferGeometry()
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const pointsMat = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    vertexColors: true
  })
  rightOutputPoints = new THREE.Points(pointsGeo, pointsMat)
  rightScene.add(rightOutputPoints)

  const ellipsePositions = new Float32Array(CIRCLE_SEGMENTS * 3)
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const theta = circleAngles[i]
    const p = matVec(A, [Math.cos(theta), Math.sin(theta)])
    ellipsePositions[i * 3] = p[0]
    ellipsePositions[i * 3 + 1] = p[1]
    ellipsePositions[i * 3 + 2] = 0
  }
  const ellipseGeo = new THREE.BufferGeometry()
  ellipseGeo.setAttribute('position', new THREE.BufferAttribute(ellipsePositions, 3))
  const ellipseColor = isIllConditioned.value ? COLOR_ELLIPSE_ILL : COLOR_ELLIPSE_GOOD
  const ellipseMat = new THREE.LineBasicMaterial({
    color: ellipseColor,
    transparent: true,
    opacity: 0.7
  })
  rightEllipse = new THREE.LineLoop(ellipseGeo, ellipseMat)
  rightScene.add(rightEllipse)

  const s1End = [u1[0] * s1, u1[1] * s1]
  const s1Geo = new THREE.BufferGeometry()
  s1Geo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([0, 0, 0, s1End[0], s1End[1], 0]), 3
  ))
  const s1Mat = new THREE.LineBasicMaterial({ color: COLOR_S1 })
  rightS1Axis = new THREE.Line(s1Geo, s1Mat)
  rightScene.add(rightS1Axis)

  const s2End = [u2[0] * s2, u2[1] * s2]
  const s2Geo = new THREE.BufferGeometry()
  s2Geo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([0, 0, 0, s2End[0], s2End[1], 0]), 3
  ))
  const s2Mat = new THREE.LineBasicMaterial({ color: COLOR_S2 })
  rightS2Axis = new THREE.Line(s2Geo, s2Mat)
  rightScene.add(rightS2Axis)

  const u1Dir = new THREE.Vector3(u1[0], u1[1], 0)
  if (u1Dir.length() > 1e-6) {
    u1Dir.normalize()
    rightU1Arrow = new THREE.ArrowHelper(u1Dir, new THREE.Vector3(0, 0, 0), 1.5, COLOR_S1, 0.22, 0.15)
    rightScene.add(rightU1Arrow)
  }
  const u2Dir = new THREE.Vector3(u2[0], u2[1], 0)
  if (u2Dir.length() > 1e-6) {
    u2Dir.normalize()
    rightU2Arrow = new THREE.ArrowHelper(u2Dir, new THREE.Vector3(0, 0, 0), 1.0, COLOR_S2, 0.22, 0.15)
    rightScene.add(rightU2Arrow)
  }
}

function updateRightCameraScale() {
  if (!rightCamera || !rightCanvasContainer.value) return
  const w = rightCanvasContainer.value.clientWidth || 400
  const h = rightCanvasContainer.value.clientHeight || 400
  const aspect = w / h

  const s1 = sigma1.value
  const viewSize = Math.max(1.5, s1 * 1.4)
  rightCamera.left = -viewSize * aspect / 2
  rightCamera.right = viewSize * aspect / 2
  rightCamera.top = viewSize / 2
  rightCamera.bottom = -viewSize / 2
  rightCamera.updateProjectionMatrix()
}

function animate() {
  renderId = requestAnimationFrame(animate)

  const now = performance.now()

  if (isIllConditioned.value && rightEllipse) {
    const tremorAmp = isExtremeIllConditioned.value ? 0.05 : 0.015
    const A = Amatrix.value
    const posAttr = rightEllipse.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
      const theta = circleAngles[i]
      const jitterX = (Math.random() - 0.5) * tremorAmp
      const jitterY = (Math.random() - 0.5) * tremorAmp
      const p = matVec(A, [Math.cos(theta), Math.sin(theta)])
      posAttr.setXYZ(i, p[0] + jitterX, p[1] + jitterY, 0)
    }
    posAttr.needsUpdate = true

    if (rightOutputPoints) {
      const ptAttr = rightOutputPoints.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < PERTURB_COUNT; i++) {
        const theta = perturbAngles[i]
        const dx = EPSILON * Math.cos(theta)
        const dy = EPSILON * Math.sin(theta)
        const jitterX = (Math.random() - 0.5) * tremorAmp
        const jitterY = (Math.random() - 0.5) * tremorAmp
        const out = matVec(A, [INPUT_X[0] + dx, INPUT_X[1] + dy])
        ptAttr.setXYZ(i, out[0] + jitterX, out[1] + jitterY, 0)
      }
      ptAttr.needsUpdate = true
    }
  }

  if (rightBgMesh) {
    const targetOpacity = isExtremeIllConditioned.value
      ? 0.20 + 0.18 * Math.sin(now * 0.005)
      : 0
    const curOpacity = (rightBgMesh.material as THREE.MeshBasicMaterial).opacity
    ;(rightBgMesh.material as THREE.MeshBasicMaterial).opacity = curOpacity + (targetOpacity - curOpacity) * 0.1
  }

  if (rightEllipse && isIllConditioned.value) {
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(now * 0.008))
    ;(rightEllipse.material as THREE.LineBasicMaterial).opacity = pulse
  }

  leftControls.update()
  rightControls.update()
  leftRenderer.render(leftScene, leftCamera)
  rightRenderer.render(rightScene, rightCamera)
}

function handleResize() {
  if (leftRenderer && leftCamera && leftCanvasContainer.value) {
    const w = leftCanvasContainer.value.clientWidth || 400
    const h = leftCanvasContainer.value.clientHeight || 400
    const aspect = w / h
    const viewSize = 3.2
    leftCamera.left = -viewSize * aspect / 2
    leftCamera.right = viewSize * aspect / 2
    leftCamera.top = viewSize / 2
    leftCamera.bottom = -viewSize / 2
    leftCamera.updateProjectionMatrix()
    leftRenderer.setSize(w, h)
  }
  if (rightRenderer && rightCamera && rightCanvasContainer.value) {
    updateRightCameraScale()
    const w = rightCanvasContainer.value.clientWidth || 400
    const h = rightCanvasContainer.value.clientHeight || 400
    rightRenderer.setSize(w, h)
  }
}

watch([a, b, c, d], () => {
  if (leftScene) updateLeftScene()
  if (rightScene) {
    updateRightScene()
    updateRightCameraScale()
  }
}, { flush: 'post' })

onMounted(() => {
  if (!checkWebGL()) {
    initStatus.value = '⚠ 当前浏览器不支持 WebGL，无法渲染 3D 场景'
    initStatusType.value = 'error'
    return
  }
  requestAnimationFrame(() => {
    initLeftScene()
    initRightScene()
    if (leftScene && rightScene) {
      updateLeftScene()
      updateRightScene()
      updateRightCameraScale()
      animate()
      initStatus.value = '双场景已就绪 · 拖动滑块或选择预设矩阵观察条件数效应'
      initStatusType.value = 'success'
    }
    resizeObserver = new ResizeObserver(() => handleResize())
    if (leftCanvasContainer.value) resizeObserver.observe(leftCanvasContainer.value)
    if (rightCanvasContainer.value) resizeObserver.observe(rightCanvasContainer.value)
  })
})

onBeforeUnmount(() => {
  if (renderId) cancelAnimationFrame(renderId)
  if (resizeObserver) resizeObserver.disconnect()
  if (leftControls) leftControls.dispose()
  if (rightControls) rightControls.dispose()
  ;[leftRenderer, rightRenderer].forEach(r => {
    if (r) {
      r.dispose()
      if (r.domElement.parentNode) {
        r.domElement.parentNode.removeChild(r.domElement)
      }
    }
  })

  leftScene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
      else (mesh.material as THREE.Material).dispose()
    }
  })
  rightScene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
      else (mesh.material as THREE.Material).dispose()
    }
  })
})
</script>

<style scoped>
.demo-container {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  color: #1f2937;
}

.demo-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #0f172a;
  text-align: center;
  letter-spacing: 0.5px;
}

.block-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.preset-buttons button {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preset-buttons button:hover {
  background: #f1f5f9;
  border-color: #64748b;
}

.preset-buttons button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.dual-canvas {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  align-items: stretch;
}

.canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  transition: box-shadow 0.3s;
}

.canvas-wrap.pulse-danger {
  animation: pulse-red 1.4s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
  }
}

.canvas-label {
  margin: 0;
  padding: 6px 10px;
  background: #fff;
  border-radius: 6px 6px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  text-align: center;
}

.demo-canvas.dual {
  width: 100%;
  height: 380px;
  background: #f8fafc;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e2e8f0;
  border-top: none;
}

.demo-canvas.dual :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.canvas-hint {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px;
  font-size: 11px;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint-row.white { color: #1f2937; }
.hint-row.cyan { color: #0891b2; }
.hint-row.red { color: #dc2626; }
.hint-row.blue { color: #2563eb; }
.hint-row.gradient {
  background: linear-gradient(90deg, #06b6d4, #eab308, #ef4444);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
}
.hint-row.warn {
  color: #dc2626;
  font-weight: 700;
  animation: blink 0.8s linear infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.mapping-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 8px;
  min-width: 84px;
}

.matrix-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  font-style: italic;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.arrow-line {
  font-size: 28px;
  color: #3b82f6;
  font-weight: 700;
  line-height: 1;
}

.mapping-tip {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  font-family: 'Cambria Math', serif;
  font-style: italic;
}

.amp-factor {
  font-size: 10px;
  color: #dc2626;
  text-align: center;
  font-family: 'Consolas', monospace;
  font-weight: 600;
  padding: 4px 6px;
  background: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.kappa-mini {
  font-size: 11px;
  color: #475569;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  font-family: 'Cambria Math', serif;
}

.kappa-mini .kappa-value {
  font-weight: 700;
  font-size: 13px;
}

.kappa-mini.kappa-good { background: #d1fae5; color: #065f46; }
.kappa-mini.kappa-mid { background: #fef3c7; color: #92400e; }
.kappa-mini.kappa-ill { background: #fee2e2; color: #991b1b; }
.kappa-mini.kappa-extreme {
  background: #fecaca;
  color: #7f1d1d;
  animation: pulse-bg 1s ease-in-out infinite;
}
.kappa-mini.kappa-singular {
  background: #1e293b;
  color: #fca5a5;
}

@keyframes pulse-bg {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

.demo-status {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  margin-bottom: 12px;
  text-align: center;
}

.demo-status.info { background: #3b82f6; }
.demo-status.success { background: #10b981; }
.demo-status.warning { background: #f59e0b; }
.demo-status.error { background: #ef4444; }

.warning-banner {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  border-left: 4px solid;
}

.warning-banner.info {
  background: #eff6ff;
  color: #1e40af;
  border-left-color: #3b82f6;
}

.warning-banner.warning {
  background: #fffbeb;
  color: #92400e;
  border-left-color: #f59e0b;
  animation: shake 0.6s ease-in-out infinite;
}

.warning-banner.danger {
  background: #fef2f2;
  color: #991b1b;
  border-left-color: #dc2626;
  animation: shake 0.4s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.matrix-editor {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.editor-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.matrix-table {
  border-collapse: collapse;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 4px;
  overflow: hidden;
}

.matrix-table td {
  padding: 4px 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #0f172a;
  min-width: 40px;
}

.matrix-table.small td {
  padding: 3px 8px;
  font-size: 11px;
  min-width: 48px;
}

.sliders-block {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 4px 12px;
}

.sliders-block label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.slider-label {
  width: 14px;
  font-weight: 600;
  color: #475569;
  font-family: 'Cambria Math', serif;
  font-style: italic;
}

.slider-val {
  width: 30px;
  text-align: right;
  color: #3b82f6;
  font-family: 'Consolas', monospace;
}

.sliders-block input[type='range'] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 2px;
}

.sliders-block input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.sliders-block input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.condition-panel {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.condition-body {
  display: flex;
  gap: 14px;
  align-items: stretch;
}

.kappa-big-display {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  transition: all 0.3s;
}

.kappa-big-display .kappa-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
}

.kappa-big-display .kappa-number {
  font-size: 36px;
  font-weight: 800;
  font-family: 'Consolas', 'Monaco', monospace;
  letter-spacing: -1px;
  margin: 4px 0;
  line-height: 1;
}

.kappa-big-display .kappa-level {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.kappa-big-display.kappa-good {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.kappa-big-display.kappa-mid {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.kappa-big-display.kappa-ill {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  animation: pulse-bg 1.2s ease-in-out infinite;
}

.kappa-big-display.kappa-extreme {
  background: linear-gradient(135deg, #fecaca 0%, #f87171 100%);
  color: #7f1d1d;
  animation: pulse-bg 0.8s ease-in-out infinite;
  box-shadow: 0 0 16px rgba(220, 38, 38, 0.4);
}

.kappa-big-display.kappa-singular {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #fca5a5;
}

.numeric-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
}

.output-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.output-row.warn {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.output-row .label {
  font-size: 11px;
  color: #64748b;
}

.output-row .value {
  font-size: 12px;
  color: #0f172a;
  font-family: 'Consolas', monospace;
  word-break: break-all;
}

.output-row.warn .value {
  color: #dc2626;
  font-weight: 600;
}

.output-row .value.mono {
  font-family: 'Consolas', monospace;
  font-size: 11px;
}

.svd-display {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.matrix-display-block {
  flex: 1;
  min-width: 200px;
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
}

.matrix-display-block .matrix-desc {
  margin: 3px 0;
  font-size: 11px;
  color: #64748b;
  font-family: 'Cambria Math', serif;
}

.formula-block {
  background: #1e293b;
  color: #f1f5f9;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.formula-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.formula-line {
  margin: 4px 0;
  font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  line-height: 1.6;
}

.formula-line .math {
  background: #334155;
  padding: 2px 8px;
  border-radius: 3px;
  color: #fbbf24;
  font-style: italic;
}

.demo-tip {
  margin: 0;
  padding: 10px 12px;
  background: #dbeafe;
  border-radius: 6px;
  font-size: 12px;
  color: #1e3a8a;
  line-height: 1.6;
  border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .dual-canvas {
    flex-direction: column;
  }
  .mapping-bar {
    flex-direction: row;
    padding: 8px 0;
    flex-wrap: wrap;
    justify-content: center;
  }
  .demo-canvas.dual {
    height: 320px;
  }
  .sliders-block {
    grid-template-columns: 1fr;
  }
  .condition-body {
    flex-direction: column;
  }
  .kappa-big-display {
    flex: 1 1 100%;
  }
  .numeric-grid {
    grid-template-columns: 1fr;
  }
  .svd-display {
    flex-direction: column;
  }
}
</style>
