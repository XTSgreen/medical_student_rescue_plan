<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button :class="{ active: preset === 'rect_full' }" :aria-pressed="preset === 'rect_full'" @click="setPreset('rect_full')">满秩 3×2（默认）</button>
      <button :class="{ active: preset === 'rect_rank' }" :aria-pressed="preset === 'rect_rank'" @click="setPreset('rect_rank')">秩亏 3×2</button>
      <button :class="{ active: preset === 'square' }" :aria-pressed="preset === 'square'" @click="setPreset('square')">方阵 2×2</button>
      <button :class="{ active: preset === 'cube_rank' }" :aria-pressed="preset === 'cube_rank'" @click="setPreset('cube_rank')">3×3 秩亏</button>
    </div>

    <div class="dual-canvas" ref="dualCanvasRoot">

      <div class="canvas-wrap">
        <p class="canvas-label">
          输入空间 R<sup>{{ n }}</sup> = C(A<sup>T</sup>) ⊕ N(A)
        </p>
        <div ref="leftCanvasContainer" class="demo-canvas dual" role="img" aria-label="输入空间画面，展示行空间与零空间的直和分解，可用鼠标拖拽旋转视角"></div>
        <div class="canvas-hint">
          <span class="hint-row green">● 绿色：行空间 C(A<sup>T</sup>) 基（V 前 r 列）</span>
          <span class="hint-row gray">● 灰色：零空间 N(A) 基（V 后 n−r 列）</span>
        </div>
      </div>

      <div class="mapping-bar">
        <div class="matrix-badge">A</div>
        <div class="arrow-line">↦</div>
        <div class="mapping-tip">v<sub>i</sub> ↦ A·v<sub>i</sub></div>
      </div>

      <div class="canvas-wrap">
        <p class="canvas-label">
          输出空间 R<sup>{{ m }}</sup> = C(A) ⊕ N(A<sup>T</sup>)
        </p>
        <div ref="rightCanvasContainer" class="demo-canvas dual" role="img" aria-label="输出空间画面，展示列空间与左零空间的直和分解，可用鼠标拖拽旋转视角"></div>
        <div class="canvas-hint">
          <span class="hint-row red">● 红色：列空间 C(A) 基（U 前 r 列）</span>
          <span class="hint-row purple">● 紫色：左零空间 N(A<sup>T</sup>) 基（U 后 m−r 列）</span>
        </div>
      </div>

      <svg class="mapping-overlay" v-if="mappingLine.visible">
        <line
          :x1="mappingLine.x1" :y1="mappingLine.y1"
          :x2="mappingLine.x2" :y2="mappingLine.y2"
          stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="6 4"
          opacity="0.9"
        />
        <circle :cx="mappingLine.x1" :cy="mappingLine.y1" r="4" fill="#fbbf24" />
        <circle :cx="mappingLine.x2" :cy="mappingLine.y2" r="4" fill="#fbbf24" />
      </svg>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

    <div class="matrix-editor">
      <p class="block-title">矩阵 A 编辑器（{{ m }}×{{ n }}）</p>
      <div class="editor-body">
        <table class="matrix-table">
          <tr v-for="(row, ri) in matrix" :key="ri">
            <td v-for="(val, ci) in row" :key="ci">{{ val.toFixed(2) }}</td>
          </tr>
        </table>
        <div class="sliders-block">
          <label v-for="item in sliderItems" :key="item.key">
            <span class="slider-label">{{ item.label }}</span>
            <input
              type="range" min="-2" max="2" step="0.1"
              :value="item.value"
              @input="updateMatrix(item.row, item.col, parseFloat(($event.target as HTMLInputElement).value))"
            />
            <span class="slider-val">{{ item.value.toFixed(1) }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="mapping-info" v-if="selectedVector.idx >= 0" :class="mappingInfoClass">
      <p class="block-title">{{ mappingInfoTitle }}</p>
      <div class="mapping-formula" v-html="mappingInfoFormula"></div>
      <div class="mapping-numeric">
        <span class="num-row">v<sub>{{ selectedVector.idx + 1 }}</sub> = ({{ selectedVector.v.map(v => v.toFixed(3)).join(', ') }})</span>
        <span class="num-row" v-if="selectedVector.isRowSpace">
          σ<sub>{{ selectedVector.idx + 1 }}</sub> = {{ selectedVector.sigma.toFixed(4) }}
        </span>
        <span class="num-row" v-if="selectedVector.isRowSpace">
          u<sub>{{ selectedVector.idx + 1 }}</sub> = ({{ selectedVector.u.map(v => v.toFixed(3)).join(', ') }})
        </span>
        <span class="num-row" v-if="selectedVector.isRowSpace">
          A·v = ({{ selectedVector.av.map(v => v.toFixed(3)).join(', ') }})
        </span>
        <span class="num-row" v-if="selectedVector.isRowSpace">
          σ·u = ({{ selectedVector.sigmaU.map(v => v.toFixed(3)).join(', ') }})
        </span>
        <span class="num-row" v-else>
          A·v = ({{ selectedVector.av.map(v => v.toFixed(3)).join(', ') }}) ≈ <b>0</b>
        </span>
      </div>
      <button class="clear-btn" @click="clearSelection">清除选择</button>
    </div>

    <table class="subspace-table">
      <thead>
        <tr>
          <th>子空间</th>
          <th>基</th>
          <th>维度</th>
          <th>所在空间</th>
        </tr>
      </thead>
      <tbody>
        <tr class="row-space">
          <td>行空间 C(A<sup>T</sup>)</td>
          <td>V 的前 r 列</td>
          <td>{{ rank }}</td>
          <td>R<sup>{{ n }}</sup></td>
        </tr>
        <tr class="null-space">
          <td>零空间 N(A)</td>
          <td>V 的后 {{ n - rank }} 列</td>
          <td>{{ n - rank }}</td>
          <td>R<sup>{{ n }}</sup></td>
        </tr>
        <tr class="col-space">
          <td>列空间 C(A)</td>
          <td>U 的前 r 列</td>
          <td>{{ rank }}</td>
          <td>R<sup>{{ m }}</sup></td>
        </tr>
        <tr class="left-null">
          <td>左零空间 N(A<sup>T</sup>)</td>
          <td>U 的后 {{ m - rank }} 列</td>
          <td>{{ m - rank }}</td>
          <td>R<sup>{{ m }}</sup></td>
        </tr>
      </tbody>
    </table>

    <div class="dim-relations">
      <p class="block-title">维度关系 & 秩</p>
      <div class="dim-row">
        <span>n = {{ n }} = r + (n−r) = {{ rank }} + {{ n - rank }}</span>
      </div>
      <div class="dim-row">
        <span>m = {{ m }} = r + (m−r) = {{ rank }} + {{ m - rank }}</span>
      </div>
      <div class="dim-row">
        <span>秩 r = {{ rank }}（非零奇异值个数）</span>
      </div>
    </div>

    <div class="mapping-relations">
      <p class="block-title">映射关系</p>
      <div class="rel-row row-space">
        <span class="rel-arrow">A · (V 前 r 列) = (U 前 r 列) · Σ<sub>r</sub></span>
        <span class="rel-desc">行空间 → 列空间（等距同构）</span>
      </div>
      <div class="rel-row null-space">
        <span class="rel-arrow">A · (V 后 {{ n - rank }} 列) = 0</span>
        <span class="rel-desc">零空间 → 原点（压缩）</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">四大基本子空间的彻底统一</p>
      <p class="formula-line">SVD 分解：<span class="math">A = U Σ V<sup>T</sup></span></p>
      <p class="formula-line">行空间映射：<span class="math">A v<sub>i</sub> = σ<sub>i</sub> u<sub>i</sub></span>（i ≤ r）</p>
      <p class="formula-line">零空间压缩：<span class="math">A v<sub>j</sub> = 0</span>（j &gt; r）</p>
      <p class="formula-line">维度定理：<span class="math">dim C(A<sup>T</sup>) + dim N(A) = n</span>，<span class="math">dim C(A) + dim N(A<sup>T</sup>) = m</span></p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '四大基本子空间的彻底统一 · SVD 视角'
  }
)

const COLOR_ROW_SPACE = 0x10b981
const COLOR_NULL_SPACE = 0x6b7280
const COLOR_COL_SPACE = 0xef4444
const COLOR_LEFT_NULL = 0x7c3aed
const COLOR_RIGHT_ANGLE = 0xffffff
const COLOR_MAPPING = 0xfbbf24
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb

type MatrixShape = '2x2' | '3x2' | '3x3'
const matrixShape = ref<MatrixShape>('3x2')

const n = computed(() => matrixShape.value === '3x3' ? 3 : 2)
const m = computed(() => matrixShape.value === '2x2' ? 2 : 3)

const matrixElems = ref<number[]>([1, 0.5, 0, 1.2, 0.3, 0, 0, 0, 0])

const matrix = computed<number[][]>(() => {
  const rows = m.value
  const cols = n.value
  const M: number[][] = []
  for (let i = 0; i < rows; i++) {
    const row: number[] = []
    for (let j = 0; j < cols; j++) {
      row.push(matrixElems.value[i * cols + j] ?? 0)
    }
    M.push(row)
  }
  return M
})

interface SliderItem {
  key: string
  label: string
  value: number
  row: number
  col: number
}

const sliderItems = computed<SliderItem[]>(() => {
  const items: SliderItem[] = []
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
  let idx = 0
  for (let i = 0; i < m.value; i++) {
    for (let j = 0; j < n.value; j++) {
      items.push({
        key: labels[idx],
        label: labels[idx],
        value: matrixElems.value[idx],
        row: i,
        col: j
      })
      idx++
    }
  }
  return items
})

function updateMatrix(row: number, col: number, value: number) {
  const v = Math.max(-2, Math.min(2, value))
  const idx = row * n.value + col
  const newArr = [...matrixElems.value]
  newArr[idx] = v
  matrixElems.value = newArr
  preset.value = 'custom'
}

type PresetKey = 'rect_full' | 'rect_rank' | 'square' | 'cube_rank' | 'custom'
const preset = ref<PresetKey>('rect_full')

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'rect_full':

      matrixShape.value = '3x2'
      matrixElems.value = [1, 0.5, 0, 1.2, 0.3, 0, 0, 0, 0]
      break
    case 'rect_rank':

      matrixShape.value = '3x2'
      matrixElems.value = [1, 2, 2, 4, 3, 6, 0, 0, 0]
      break
    case 'square':

      matrixShape.value = '2x2'
      matrixElems.value = [2, 0, 0, 1, 0, 0, 0, 0, 0]
      break
    case 'cube_rank':

      matrixShape.value = '3x3'
      matrixElems.value = [1, 0, 0, 0, 1, 0, 0, 0, 0]
      break
  }
  clearSelection()
}

type Matrix = number[]

function transpose(M: Matrix[]): Matrix[] {
  const r = M.length, c = M[0].length
  const T: Matrix[] = Array.from({ length: c }, () => new Array(r).fill(0))
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++)
      T[j][i] = M[i][j]
  return T
}

function matMul(A: Matrix[], B: Matrix[]): Matrix[] {
  const r = A.length, c = B[0].length, k = B.length
  const C: Matrix[] = Array.from({ length: r }, () => new Array(c).fill(0))
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      let s = 0
      for (let l = 0; l < k; l++) s += A[i][l] * B[l][j]
      C[i][j] = s
    }
  return C
}

function matVec(A: Matrix[], v: number[]): number[] {
  const r = A.length, c = A[0].length
  const out = new Array(r).fill(0)
  for (let i = 0; i < r; i++) {
    let s = 0
    for (let j = 0; j < c; j++) s += A[i][j] * v[j]
    out[i] = s
  }
  return out
}

function jacobiEigen(A: Matrix[], maxIter = 200, tol = 1e-12): { values: number[], vectors: Matrix[] } {
  const sz = A.length
  const M: Matrix[] = A.map(row => [...row])
  const V: Matrix[] = Array.from({ length: sz }, (_, i) =>
    Array.from({ length: sz }, (_, j) => (i === j ? 1 : 0))
  )

  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0, q = 1, maxVal = 0
    for (let i = 0; i < sz; i++) {
      for (let j = i + 1; j < sz; j++) {
        if (Math.abs(M[i][j]) > maxVal) {
          maxVal = Math.abs(M[i][j])
          p = i; q = j
        }
      }
    }
    if (maxVal < tol) break

    const app = M[p][p], aqq = M[q][q], apq = M[p][q]
    if (Math.abs(apq) < 1e-15) break
    const phi = (aqq - app) / (2 * apq)
    let t: number
    if (phi >= 0) t = 1 / (phi + Math.sqrt(phi * phi + 1))
    else t = -1 / (-phi + Math.sqrt(phi * phi + 1))
    const c = 1 / Math.sqrt(t * t + 1)
    const s = t * c

    for (let i = 0; i < sz; i++) {
      if (i !== p && i !== q) {
        const mip = M[i][p], miq = M[i][q]
        M[i][p] = c * mip - s * miq
        M[i][q] = s * mip + c * miq
        M[p][i] = M[i][p]
        M[q][i] = M[i][q]
      }
    }
    M[p][p] = app - t * apq
    M[q][q] = aqq + t * apq
    M[p][q] = 0
    M[q][p] = 0

    for (let i = 0; i < sz; i++) {
      const vip = V[i][p], viq = V[i][q]
      V[i][p] = c * vip - s * viq
      V[i][q] = s * vip + c * viq
    }
  }

  const values = M.map((row, i) => row[i])
  const indices = values.map((_, i) => i).sort((x, y) => values[y] - values[x])
  const sortedValues = indices.map(i => values[i])
  const sortedVectors: Matrix[] = Array.from({ length: sz }, () => new Array(sz).fill(0))
  for (let j = 0; j < sz; j++)
    for (let i = 0; i < sz; i++)
      sortedVectors[i][j] = V[i][indices[j]]
  return { values: sortedValues, vectors: sortedVectors }
}

function computeSVD(A: Matrix[]): { U: Matrix[], S: number[], V: Matrix[], rank: number } {
  const mm = A.length
  const nn = A[0].length
  const At = transpose(A)
  const AtA = matMul(At, A)

  const { values: eigenvalues, vectors: V } = jacobiEigen(AtA)
  const sigmas = eigenvalues.map(l => Math.sqrt(Math.max(0, l)))

  const U: Matrix[] = Array.from({ length: mm }, () => new Array(mm).fill(0))
  const isNonzero = sigmas.map(s => s > 1e-9)
  const nonzeroCount = isNonzero.filter(Boolean).length

  for (let i = 0; i < nn; i++) {
    if (!isNonzero[i]) continue
    for (let r = 0; r < mm; r++) {
      let sum = 0
      for (let col = 0; col < nn; col++) sum += A[r][col] * V[col][i]
      U[r][i] = sum / sigmas[i]
    }
  }

  const filledCols: number[] = []
  for (let i = 0; i < nn; i++) if (isNonzero[i]) filledCols.push(i)

  for (let b = 0; b < mm; b++) {
    if (filledCols.length >= mm) break
    const candidate = Array.from({ length: mm }, (_, k) => (k === b ? 1 : 0))
    for (const j of filledCols) {
      let dot = 0
      for (let r = 0; r < mm; r++) dot += U[r][j] * candidate[r]
      for (let r = 0; r < mm; r++) candidate[r] -= dot * U[r][j]
    }
    let norm = 0
    for (let r = 0; r < mm; r++) norm += candidate[r] * candidate[r]
    norm = Math.sqrt(norm)
    if (norm > 1e-6) {
      const newCol = filledCols.length
      for (let r = 0; r < mm; r++) U[r][newCol] = candidate[r] / norm
      filledCols.push(newCol)
    }
  }

  return { U, S: sigmas, V, rank: nonzeroCount }
}

const svdResult = computed(() => computeSVD(matrix.value))
const U = computed(() => svdResult.value.U)
const V = computed(() => svdResult.value.V)
const S = computed(() => svdResult.value.S)
const rank = computed(() => svdResult.value.rank)

function vCol(i: number): number[] {
  const sz = V.value.length
  const col: number[] = []
  for (let r = 0; r < sz; r++) col.push(V.value[r][i])
  return col
}

function uCol(i: number): number[] {
  const sz = U.value.length
  const col: number[] = []
  for (let r = 0; r < sz; r++) col.push(U.value[r][i])
  return col
}

interface SelectionState {
  idx: number
  isRowSpace: boolean
  v: number[]
  u: number[]
  sigma: number
  av: number[]
  sigmaU: number[]
}

const selectedVector = reactive<SelectionState>({
  idx: -1,
  isRowSpace: false,
  v: [],
  u: [],
  sigma: 0,
  av: [],
  sigmaU: []
})

function selectVector(idx: number) {
  selectedVector.idx = idx
  selectedVector.isRowSpace = idx < rank.value
  selectedVector.v = vCol(idx)
  selectedVector.sigma = S.value[idx] || 0
  selectedVector.av = matVec(matrix.value, selectedVector.v)
  if (selectedVector.isRowSpace) {
    selectedVector.u = uCol(idx)
    selectedVector.sigmaU = selectedVector.u.map(ui => ui * selectedVector.sigma)
    triggerFlash(idx)
  } else {
    selectedVector.u = []
    selectedVector.sigmaU = []
  }
  updateMappingLine()
}

function clearSelection() {
  selectedVector.idx = -1
  selectedVector.isRowSpace = false
  selectedVector.v = []
  selectedVector.u = []
  selectedVector.sigma = 0
  selectedVector.av = []
  selectedVector.sigmaU = []
  mappingLine.visible = false
}

const mappingInfoTitle = computed(() => {
  if (selectedVector.idx < 0) return ''
  const i = selectedVector.idx + 1
  if (selectedVector.isRowSpace) {
    return `行空间 → 列空间：v${i} ↦ u${i}`
  }
  return `零空间 → 原点：v${i} ↦ 0`
})

const mappingInfoFormula = computed(() => {
  if (selectedVector.idx < 0) return ''
  const i = selectedVector.idx + 1
  if (selectedVector.isRowSpace) {
    return `A · <b>v</b><sub>${i}</sub> = σ<sub>${i}</sub> · <b>u</b><sub>${i}</sub> = ${selectedVector.sigma.toFixed(4)} · <b>u</b><sub>${i}</sub>`
  }
  return `A · <b>v</b><sub>${i}</sub> = <b>0</b>（被压缩到原点）`
})

const mappingInfoClass = computed(() => selectedVector.isRowSpace ? 'row-to-col' : 'null-to-zero')

const mappingLine = reactive({
  visible: false,
  x1: 0, y1: 0, x2: 0, y2: 0
})

function projectToScreen(
  camera: THREE.Camera,
  container: HTMLElement,
  vec: number[]
): { x: number, y: number } | null {
  if (!container) return null
  const v = vecTo3D(vec)
  v.project(camera)
  const w = container.clientWidth
  const h = container.clientHeight
  const x = (v.x * 0.5 + 0.5) * w
  const y = (-v.y * 0.5 + 0.5) * h
  return { x, y }
}

function updateMappingLine() {
  if (selectedVector.idx < 0 || !selectedVector.isRowSpace) {
    mappingLine.visible = false
    return
  }
  if (!leftScene || !rightScene || !leftCanvasContainer.value || !rightCanvasContainer.value) {
    mappingLine.visible = false
    return
  }
  const leftTip = projectToScreen(leftCamera, leftCanvasContainer.value, selectedVector.v)
  const rightTip = projectToScreen(rightCamera, rightCanvasContainer.value, selectedVector.u)
  if (leftTip && rightTip) {
    mappingLine.x1 = leftTip.x
    mappingLine.y1 = leftTip.y

    const rightRect = rightCanvasContainer.value.getBoundingClientRect()
    const leftRect = leftCanvasContainer.value.getBoundingClientRect()
    mappingLine.x2 = rightTip.x + (rightRect.left - leftRect.left)
    mappingLine.y2 = rightTip.y + (rightRect.top - leftRect.top)
    mappingLine.visible = true
  } else {
    mappingLine.visible = false
  }
}

const leftCanvasContainer = ref<HTMLElement | null>(null)
const rightCanvasContainer = ref<HTMLElement | null>(null)
const dualCanvasRoot = ref<HTMLElement | null>(null)

let leftScene: THREE.Scene, rightScene: THREE.Scene
let leftCamera: THREE.PerspectiveCamera, rightCamera: THREE.PerspectiveCamera
let leftRenderer: THREE.WebGLRenderer, rightRenderer: THREE.WebGLRenderer
let leftControls: OrbitControls, rightControls: OrbitControls
let leftRaycaster: THREE.Raycaster, rightRaycaster: THREE.Raycaster
let resizeObserver: ResizeObserver
let renderId = 0

let leftArrows: THREE.ArrowHelper[] = []
let leftArrowTips: THREE.Mesh[] = []
let leftArrowLabels: THREE.Sprite[] = []
let leftSubspacePlanes: THREE.Object3D[] = []
let leftRightAngle: THREE.LineSegments | null = null
let leftOriginSphere!: THREE.Mesh
let leftGrid: THREE.GridHelper
let leftAxes: THREE.AxesHelper

let rightArrows: THREE.ArrowHelper[] = []
let rightArrowTips: THREE.Mesh[] = []
let rightArrowLabels: THREE.Sprite[] = []
let rightHighlightSpheres: THREE.Mesh[] = []
let rightSubspacePlanes: THREE.Object3D[] = []
let rightRightAngle: THREE.LineSegments | null = null
let rightOriginSphere!: THREE.Mesh
let rightGrid: THREE.GridHelper
let rightAxes: THREE.AxesHelper

let flashIdx = -1
let flashStartTime = 0
const flashDuration = 1800

function triggerFlash(idx: number) {
  flashIdx = idx
  flashStartTime = performance.now()
}

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function checkWebGL(): boolean {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) return false
  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()
  return true
}

function vecTo3D(v: number[]): THREE.Vector3 {
  if (v.length === 2) return new THREE.Vector3(v[0], v[1], 0)
  return new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0)
}

function makeTextSprite(text: string, color: string, scale = 1.2): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(scale * 1.5, scale * 0.4, 1)
  return sprite
}

function createSubspacePlane(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  color: number,
  opacity: number,
  size = 2.4
): THREE.Mesh {
  const half = size / 2
  const p1 = v1.clone().multiplyScalar(half).add(v2.clone().multiplyScalar(half))
  const p2 = v1.clone().multiplyScalar(-half).add(v2.clone().multiplyScalar(half))
  const p3 = v1.clone().multiplyScalar(-half).add(v2.clone().multiplyScalar(-half))
  const p4 = v1.clone().multiplyScalar(half).add(v2.clone().multiplyScalar(-half))
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    p1.x, p1.y, p1.z,
    p2.x, p2.y, p2.z,
    p3.x, p3.y, p3.z,
    p4.x, p4.y, p4.z
  ]), 3))
  geo.setIndex([0, 1, 2, 0, 2, 3])
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  return new THREE.Mesh(geo, mat)
}

function makeRightAngleMarker(v1: THREE.Vector3, v2: THREE.Vector3, size = 0.22): THREE.LineSegments {
  const s1 = v1.clone().multiplyScalar(size)
  const s2 = v2.clone().multiplyScalar(size)
  const corner = s1.clone().add(s2)
  const points = new Float32Array([
    s1.x, s1.y, s1.z,
    corner.x, corner.y, corner.z,
    corner.x, corner.y, corner.z,
    s2.x, s2.y, s2.z
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(points, 3))
  const mat = new THREE.LineBasicMaterial({ color: COLOR_RIGHT_ANGLE, linewidth: 2 })
  return new THREE.LineSegments(geo, mat)
}

function setArrowLength(arrow: THREE.ArrowHelper, length: number) {
  const safeLen = Math.max(0.05, length)
  const headLen = Math.min(0.22, safeLen * 0.22)
  const headWidth = Math.min(0.14, safeLen * 0.14)
  arrow.setLength(safeLen, headLen, headWidth)
}

function setLeftCameraPosition() {
  if (n.value === 2) {

    leftCamera.position.set(0, 0, 6)
    leftCamera.up.set(0, 1, 0)
  } else {

    leftCamera.position.set(4, 3, 5)
    leftCamera.up.set(0, 1, 0)
  }
  leftCamera.lookAt(0, 0, 0)
}

function initLeftScene() {
  const container = leftCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 400

  leftScene = new THREE.Scene()
  leftScene.background = new THREE.Color(0xf8fafc)

  leftCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  setLeftCameraPosition()

  try {
    leftRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '左侧 WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return
  }
  leftRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  leftRenderer.setSize(width, height)
  leftRenderer.domElement.style.width = '100%'
  leftRenderer.domElement.style.height = '100%'
  leftRenderer.domElement.style.display = 'block'
  container.appendChild(leftRenderer.domElement)

  leftControls = new OrbitControls(leftCamera, leftRenderer.domElement)
  leftControls.enableDamping = true
  leftControls.dampingFactor = 0.08
  leftControls.minDistance = 2
  leftControls.maxDistance = 20

  leftScene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  leftScene.add(dir)

  leftGrid = new THREE.GridHelper(6, 6, 0x9ca3af, COLOR_GRID)
  if (n.value === 2) {

    leftGrid.rotation.x = Math.PI / 2
  }
  ;(leftGrid.material as THREE.Material).transparent = true
  ;(leftGrid.material as THREE.Material).opacity = 0.6
  leftScene.add(leftGrid)

  leftAxes = new THREE.AxesHelper(2.5)
  ;(leftAxes.material as THREE.Material).transparent = true
  ;(leftAxes.material as THREE.Material).opacity = 0.5
  leftScene.add(leftAxes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  leftOriginSphere = new THREE.Mesh(origGeom, origMat)
  leftScene.add(leftOriginSphere)

  leftRaycaster = new THREE.Raycaster()

  leftRenderer.domElement.addEventListener('click', onLeftClick)
  leftRenderer.domElement.addEventListener('mousemove', onLeftHover)
}

function setRightCameraPosition() {
  if (m.value === 2) {
    rightCamera.position.set(0, 0, 6)
    rightCamera.up.set(0, 1, 0)
  } else {
    rightCamera.position.set(4, 3, 5)
    rightCamera.up.set(0, 1, 0)
  }
  rightCamera.lookAt(0, 0, 0)
}

function initRightScene() {
  const container = rightCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 400

  rightScene = new THREE.Scene()
  rightScene.background = new THREE.Color(0xf8fafc)

  rightCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  setRightCameraPosition()

  try {
    rightRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '右侧 WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return
  }
  rightRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  rightRenderer.setSize(width, height)
  rightRenderer.domElement.style.width = '100%'
  rightRenderer.domElement.style.height = '100%'
  rightRenderer.domElement.style.display = 'block'
  container.appendChild(rightRenderer.domElement)

  rightControls = new OrbitControls(rightCamera, rightRenderer.domElement)
  rightControls.enableDamping = true
  rightControls.dampingFactor = 0.08
  rightControls.minDistance = 2
  rightControls.maxDistance = 20

  rightScene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  rightScene.add(dir)

  rightGrid = new THREE.GridHelper(6, 6, 0x9ca3af, COLOR_GRID)
  if (m.value === 2) {
    rightGrid.rotation.x = Math.PI / 2
  }
  ;(rightGrid.material as THREE.Material).transparent = true
  ;(rightGrid.material as THREE.Material).opacity = 0.6
  rightScene.add(rightGrid)

  rightAxes = new THREE.AxesHelper(2.5)
  ;(rightAxes.material as THREE.Material).transparent = true
  ;(rightAxes.material as THREE.Material).opacity = 0.5
  rightScene.add(rightAxes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  rightOriginSphere = new THREE.Mesh(origGeom, origMat)
  rightScene.add(rightOriginSphere)

  rightRaycaster = new THREE.Raycaster()
}

function disposeObj(scene: THREE.Scene, obj: THREE.Object3D) {
  scene.remove(obj)
  if (obj instanceof THREE.ArrowHelper) {
    obj.dispose()
  } else if (obj instanceof THREE.Mesh) {
    obj.geometry.dispose()
    ;(obj.material as THREE.Material).dispose()
  } else if (obj instanceof THREE.Sprite) {
    ;(obj.material as THREE.SpriteMaterial).map?.dispose()
    ;(obj.material as THREE.Material).dispose()
  } else if (obj instanceof THREE.LineSegments) {
    obj.geometry.dispose()
    ;(obj.material as THREE.Material).dispose()
  }
}

function clearLeftObjects() {
  leftArrows.forEach(a => disposeObj(leftScene, a))
  leftArrowTips.forEach(t => disposeObj(leftScene, t))
  leftArrowLabels.forEach(l => disposeObj(leftScene, l))
  leftSubspacePlanes.forEach(p => disposeObj(leftScene, p))
  if (leftRightAngle) { disposeObj(leftScene, leftRightAngle); leftRightAngle = null }
  leftArrows = []
  leftArrowTips = []
  leftArrowLabels = []
  leftSubspacePlanes = []
}

function updateLeftScene() {
  if (!leftScene) return
  clearLeftObjects()

  const nv = n.value
  const r = rank.value
  const arrowLen = 1.5

  for (let i = 0; i < nv; i++) {
    const col = vCol(i)
    const dir = vecTo3D(col)
    if (dir.length() < 1e-6) continue
    dir.normalize()
    const isRowSpace = i < r
    const color = isRowSpace ? COLOR_ROW_SPACE : COLOR_NULL_SPACE

    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), arrowLen, color, 0.22, 0.12)
    leftArrows.push(arrow)
    leftScene.add(arrow)

    const tipGeo = new THREE.SphereGeometry(0.12, 18, 14)
    const tipMat = new THREE.MeshBasicMaterial({ color })
    const tip = new THREE.Mesh(tipGeo, tipMat)
    tip.position.copy(dir.clone().multiplyScalar(arrowLen))
    tip.userData = { idx: i, isRowSpace, side: 'left' }
    leftArrowTips.push(tip)
    leftScene.add(tip)

    const labelText = isRowSpace ? `v${i + 1}` : `v${i + 1} (N)`
    const label = makeTextSprite(labelText, isRowSpace ? '#059669' : '#4b5563')
    label.position.copy(dir.clone().multiplyScalar(arrowLen + 0.35))
    leftArrowLabels.push(label)
    leftScene.add(label)
  }

  if (r === 2 && nv === 3) {
    const v1 = vecTo3D(vCol(0)).normalize()
    const v2 = vecTo3D(vCol(1)).normalize()
    const plane = createSubspacePlane(v1, v2, COLOR_ROW_SPACE, 0.18)
    leftSubspacePlanes.push(plane)
    leftScene.add(plane)
  }

  if (nv - r === 2) {
    const v1 = vecTo3D(vCol(r)).normalize()
    const v2 = vecTo3D(vCol(r + 1)).normalize()
    const plane = createSubspacePlane(v1, v2, COLOR_NULL_SPACE, 0.18)
    leftSubspacePlanes.push(plane)
    leftScene.add(plane)
  }

  if (r >= 1 && nv - r >= 1) {
    const v1 = vecTo3D(vCol(0)).normalize()
    const v2 = vecTo3D(vCol(r)).normalize()
    leftRightAngle = makeRightAngleMarker(v1, v2, 0.25)
    leftScene.add(leftRightAngle)
  }
}

function clearRightObjects() {
  rightArrows.forEach(a => disposeObj(rightScene, a))
  rightArrowTips.forEach(t => disposeObj(rightScene, t))
  rightArrowLabels.forEach(l => disposeObj(rightScene, l))
  rightHighlightSpheres.forEach(s => disposeObj(rightScene, s))
  rightSubspacePlanes.forEach(p => disposeObj(rightScene, p))
  if (rightRightAngle) { disposeObj(rightScene, rightRightAngle); rightRightAngle = null }
  rightArrows = []
  rightArrowTips = []
  rightArrowLabels = []
  rightHighlightSpheres = []
  rightSubspacePlanes = []
}

function updateRightScene() {
  if (!rightScene) return
  clearRightObjects()

  const mm = m.value
  const r = rank.value
  const arrowLen = 1.5

  for (let i = 0; i < mm; i++) {
    const col = uCol(i)
    const dir = vecTo3D(col)
    if (dir.length() < 1e-6) continue
    dir.normalize()
    const isColSpace = i < r
    const color = isColSpace ? COLOR_COL_SPACE : COLOR_LEFT_NULL

    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), arrowLen, color, 0.22, 0.12)
    rightArrows.push(arrow)
    rightScene.add(arrow)

    const tipGeo = new THREE.SphereGeometry(0.12, 18, 14)
    const tipMat = new THREE.MeshBasicMaterial({ color })
    const tip = new THREE.Mesh(tipGeo, tipMat)
    tip.position.copy(dir.clone().multiplyScalar(arrowLen))
    tip.userData = { idx: i, isColSpace, side: 'right' }
    rightArrowTips.push(tip)
    rightScene.add(tip)

    const hlGeo = new THREE.SphereGeometry(0.25, 18, 14)
    const hlMat = new THREE.MeshBasicMaterial({
      color: COLOR_MAPPING,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
    const hl = new THREE.Mesh(hlGeo, hlMat)
    hl.position.copy(dir.clone().multiplyScalar(arrowLen))
    rightHighlightSpheres.push(hl)
    rightScene.add(hl)

    const labelText = isColSpace ? `u${i + 1}` : `u${i + 1} (Nᵀ)`
    const label = makeTextSprite(labelText, isColSpace ? '#dc2626' : '#6d28d9')
    label.position.copy(dir.clone().multiplyScalar(arrowLen + 0.35))
    rightArrowLabels.push(label)
    rightScene.add(label)
  }

  if (r === 2 && mm === 3) {
    const u1 = vecTo3D(uCol(0)).normalize()
    const u2 = vecTo3D(uCol(1)).normalize()
    const plane = createSubspacePlane(u1, u2, COLOR_COL_SPACE, 0.18)
    rightSubspacePlanes.push(plane)
    rightScene.add(plane)
  }
  if (mm - r === 2) {
    const u1 = vecTo3D(uCol(r)).normalize()
    const u2 = vecTo3D(uCol(r + 1)).normalize()
    const plane = createSubspacePlane(u1, u2, COLOR_LEFT_NULL, 0.18)
    rightSubspacePlanes.push(plane)
    rightScene.add(plane)
  }

  if (r >= 1 && mm - r >= 1) {
    const u1 = vecTo3D(uCol(0)).normalize()
    const u2 = vecTo3D(uCol(r)).normalize()
    rightRightAngle = makeRightAngleMarker(u1, u2, 0.25)
    rightScene.add(rightRightAngle)
  }
}

function onLeftClick(event: MouseEvent) {
  if (!leftCanvasContainer.value || !leftRaycaster || !leftCamera) return
  const rect = leftRenderer.domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  leftRaycaster.setFromCamera(new THREE.Vector2(x, y), leftCamera)
  const intersects = leftRaycaster.intersectObjects(leftArrowTips)
  if (intersects.length > 0) {
    const idx = intersects[0].object.userData.idx as number
    selectVector(idx)
  }
}

function onLeftHover(event: MouseEvent) {
  if (!leftCanvasContainer.value || !leftRaycaster || !leftCamera) return
  const rect = leftRenderer.domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  leftRaycaster.setFromCamera(new THREE.Vector2(x, y), leftCamera)
  const intersects = leftRaycaster.intersectObjects(leftArrowTips)
  leftRenderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
}

function animate() {
  renderId = requestAnimationFrame(animate)

  if (flashIdx >= 0 && rightHighlightSpheres[flashIdx]) {
    const elapsed = performance.now() - flashStartTime
    if (elapsed < flashDuration) {
      const t = elapsed / flashDuration
      const pulse = 1 + 0.6 * Math.abs(Math.sin(t * Math.PI * 8))
      rightHighlightSpheres[flashIdx].scale.set(pulse, pulse, pulse)
      ;(rightHighlightSpheres[flashIdx].material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t)
    } else {
      ;(rightHighlightSpheres[flashIdx].material as THREE.MeshBasicMaterial).opacity = 0
      flashIdx = -1
    }
  }

  if (mappingLine.visible) updateMappingLine()

  leftControls.update()
  rightControls.update()

  leftRenderer.render(leftScene, leftCamera)
  rightRenderer.render(rightScene, rightCamera)
}

function handleResize() {
  if (leftRenderer && leftCamera && leftCanvasContainer.value) {
    const w = leftCanvasContainer.value.clientWidth || 400
    const h = leftCanvasContainer.value.clientHeight || 400
    leftCamera.aspect = w / h
    leftCamera.updateProjectionMatrix()
    leftRenderer.setSize(w, h)
  }
  if (rightRenderer && rightCamera && rightCanvasContainer.value) {
    const w = rightCanvasContainer.value.clientWidth || 400
    const h = rightCanvasContainer.value.clientHeight || 400
    rightCamera.aspect = w / h
    rightCamera.updateProjectionMatrix()
    rightRenderer.setSize(w, h)
  }
}

function updateGridOrientation() {
  if (leftGrid) {
    leftGrid.rotation.x = n.value === 2 ? Math.PI / 2 : 0
  }
  if (rightGrid) {
    rightGrid.rotation.x = m.value === 2 ? Math.PI / 2 : 0
  }
}

watch(matrix, () => {
  if (leftScene) updateLeftScene()
  if (rightScene) {
    updateRightScene()

    if (selectedVector.idx >= 0 && selectedVector.isRowSpace) {
      triggerFlash(selectedVector.idx)
    }
  }

  if (selectedVector.idx >= 0) {
    selectVector(selectedVector.idx)
  }
}, { flush: 'post' })

watch([n, m], () => {
  if (leftScene) {
    setLeftCameraPosition()
    leftControls.target.set(0, 0, 0)
    leftControls.update()
    updateGridOrientation()
    updateLeftScene()
  }
  if (rightScene) {
    setRightCameraPosition()
    rightControls.target.set(0, 0, 0)
    rightControls.update()
    updateGridOrientation()
    updateRightScene()
  }
  clearSelection()
})

const tipText = computed(() => {
  const r = rank.value
  const nv = n.value
  const mm = m.value
  if (r === 0) {
    return '零矩阵 r=0：所有 V 列都属于零空间（灰），所有 U 列都属于左零空间（紫）。任何输入都被 A 压缩为 0。'
  }
  let tip = `当前 A 是 ${mm}×${nv}，秩 r=${r}。左屏 R${nv} 中绿色箭头是行空间基（V 前 ${r} 列），`
  if (nv - r > 0) {
    tip += `灰色箭头是零空间基（V 后 ${nv - r} 列，被 A 压缩到原点）。`
  } else {
    tip += `零空间退化为 {0}（无灰色箭头）。`
  }
  tip += ` 右屏 R${mm} 中红色是列空间基，`
  if (mm - r > 0) {
    tip += `紫色是左零空间基。`
  } else {
    tip += `左零空间退化为 {0}。`
  }
  tip += ' 点击左屏任意 V 列末端的球体，观察 A·vᵢ 的映射效果：行空间基 → 对应 U 列（金色连线 + 闪烁），零空间基 → 原点。'
  return tip
})

onMounted(() => {
  if (!checkWebGL()) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 场景'
    initStatusType.value = 'error'
    return
  }
  requestAnimationFrame(() => {
    initLeftScene()
    initRightScene()
    if (leftScene && rightScene) {
      updateLeftScene()
      updateRightScene()
      animate()
      initStatus.value = '3D 场景已就绪 · 点击左屏 V 列末端球体观察映射'
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
  leftRenderer?.domElement.removeEventListener('click', onLeftClick)
  leftRenderer?.domElement.removeEventListener('mousemove', onLeftHover)
  if (leftControls) leftControls.dispose()
  if (rightControls) rightControls.dispose()
  ;[leftRenderer, rightRenderer].forEach(r => {
    if (r) {
      r.dispose()
      r.forceContextLoss()
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
  font-size: 20px; font-weight: 700; margin: 0 0 16px 0;
  color: #0f172a; text-align: center; letter-spacing: 0.5px;
}
.block-title {
  margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1e293b;
}

.preset-buttons {
  display: flex; flex-wrap: wrap; gap: 8px;
  justify-content: center; margin-bottom: 16px;
}
.preset-buttons button {
  padding: 6px 14px; border: 1px solid #cbd5e1; background: #fff;
  color: #475569; border-radius: 6px; cursor: pointer;
  font-size: 13px; transition: all 0.2s;
}
.preset-buttons button:hover { background: #f1f5f9; border-color: #64748b; }
.preset-buttons button.active {
  background: #3b82f6; color: #fff; border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.dual-canvas {
  display: flex; gap: 8px; margin-bottom: 16px;
  position: relative; align-items: stretch;
}
.canvas-wrap {
  flex: 1; display: flex; flex-direction: column;
  gap: 6px; min-width: 0;
}
.canvas-label {
  margin: 0; padding: 6px 10px; background: #fff;
  border-radius: 6px 6px 0 0; font-size: 13px; font-weight: 600;
  color: #1e293b; border: 1px solid #e2e8f0; border-bottom: none;
  text-align: center;
}
.demo-canvas.dual {
  width: 100%; height: 380px; background: #f8fafc;
  border-radius: 0 0 6px 6px; overflow: hidden; position: relative;
  border: 1px solid #e2e8f0; border-top: none;
}
.demo-canvas.dual :deep(canvas) {
  display: block; width: 100% !important; height: 100% !important;
}
.canvas-hint {
  display: flex; flex-direction: column; gap: 2px;
  padding: 4px 8px; font-size: 11px;
}
.hint-row { display: flex; align-items: center; gap: 4px; }
.hint-row.green { color: #059669; }
.hint-row.gray { color: #4b5563; }
.hint-row.red { color: #dc2626; }
.hint-row.purple { color: #6d28d9; }

.mapping-bar {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 0 6px; min-width: 60px;
}
.matrix-badge {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff; font-weight: 700; font-size: 18px; font-style: italic;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}
.arrow-line { font-size: 28px; color: #3b82f6; font-weight: 700; line-height: 1; }
.mapping-tip {
  font-size: 11px; color: #64748b; text-align: center;
  font-family: 'Cambria Math', serif; font-style: italic;
}

.mapping-overlay {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; pointer-events: none; z-index: 20;
}

.demo-status {
  padding: 6px 12px; border-radius: 4px; font-size: 12px;
  color: #fff; margin-bottom: 12px; text-align: center;
}
.demo-status.info { background: #3b82f6; }
.demo-status.success { background: #10b981; }
.demo-status.warning { background: #f59e0b; }
.demo-status.error { background: #ef4444; }

.matrix-editor,
.dim-relations,
.mapping-relations {
  background: #fff; border-radius: 6px; padding: 10px 12px;
  border: 1px solid #e2e8f0; margin-bottom: 12px;
}
.editor-body { display: flex; gap: 14px; align-items: flex-start; }
.matrix-table {
  border-collapse: collapse; font-size: 12px; background: #f8fafc;
  border-radius: 4px; overflow: hidden;
}
.matrix-table td {
  padding: 4px 10px; text-align: center; border: 1px solid #e2e8f0;
  font-family: 'Consolas', 'Monaco', monospace; color: #0f172a; min-width: 40px;
}
.sliders-block {
  flex: 1; display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 4px 12px;
}
.sliders-block label {
  display: flex; align-items: center; gap: 6px; font-size: 11px;
}
.slider-label {
  width: 14px; font-weight: 600; color: #475569;
  font-family: 'Cambria Math', serif; font-style: italic;
}
.slider-val {
  width: 30px; text-align: right; color: #3b82f6;
  font-family: 'Consolas', monospace;
}
.sliders-block input[type='range'] {
  flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
  background: #e5e7eb; border-radius: 2px;
}
.sliders-block input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 12px; height: 12px;
  background: #3b82f6; border-radius: 50%; cursor: pointer;
}
.sliders-block input[type='range']::-moz-range-thumb {
  width: 12px; height: 12px; background: #3b82f6;
  border-radius: 50%; cursor: pointer; border: none;
}

.mapping-info {
  background: #fff; border-radius: 6px; padding: 12px;
  border: 1px solid #e2e8f0; margin-bottom: 12px;
  border-left: 4px solid #fbbf24;
}
.mapping-info.row-to-col {
  border-left-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
}
.mapping-info.null-to-zero {
  border-left-color: #6b7280;
  background: linear-gradient(135deg, #f9fafb 0%, #fff 100%);
}
.mapping-formula {
  font-size: 14px; font-family: 'Cambria Math', 'Times New Roman', serif;
  color: #1e40af; margin: 6px 0; padding: 6px 10px;
  background: #eff6ff; border-radius: 4px;
}
.mapping-info.null-to-zero .mapping-formula { color: #4b5563; background: #f3f4f6; }
.mapping-numeric {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12px; font-family: 'Consolas', monospace;
  color: #374151; margin: 6px 0;
}
.num-row { padding: 2px 6px; background: #f8fafc; border-radius: 3px; }
.num-row b { color: #ef4444; }
.clear-btn {
  margin-top: 8px; padding: 4px 12px; border: 1px solid #cbd5e1;
  background: #fff; color: #475569; border-radius: 4px;
  cursor: pointer; font-size: 12px; transition: all 0.2s;
}
.clear-btn:hover { background: #f1f5f9; border-color: #ef4444; color: #ef4444; }

.subspace-table {
  width: 100%; border-collapse: collapse; margin-bottom: 12px;
  background: #fff; border-radius: 6px; overflow: hidden;
  border: 1px solid #e2e8f0; font-size: 13px;
}
.subspace-table th {
  background: #eff6ff; color: #1e293b; padding: 8px 10px;
  text-align: left; font-weight: 600; font-size: 12px;
}
.subspace-table td { padding: 8px 10px; border-top: 1px solid #e2e8f0; color: #1f2937; }
.subspace-table tr.row-space td:first-child { border-left: 4px solid #10b981; color: #059669; font-weight: 600; }
.subspace-table tr.null-space td:first-child { border-left: 4px solid #6b7280; color: #4b5563; font-weight: 600; }
.subspace-table tr.col-space td:first-child { border-left: 4px solid #ef4444; color: #dc2626; font-weight: 600; }
.subspace-table tr.left-null td:first-child { border-left: 4px solid #7c3aed; color: #6d28d9; font-weight: 600; }

.dim-row {
  font-size: 13px; font-family: 'Cambria Math', 'Times New Roman', serif;
  color: #1e293b; padding: 4px 0;
}
.dim-row span {
  display: inline-block; padding: 2px 8px;
  background: #eff6ff; border-radius: 3px; color: #1e40af;
}

.rel-row {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 10px; margin: 4px 0; border-radius: 4px; font-size: 13px;
}
.rel-row.row-space { background: #ecfdf5; border-left: 3px solid #10b981; }
.rel-row.null-space { background: #f9fafb; border-left: 3px solid #6b7280; }
.rel-arrow {
  font-family: 'Cambria Math', 'Times New Roman', serif;
  color: #1e293b; font-weight: 600; flex: 1;
}
.rel-desc { font-size: 12px; color: #64748b; font-style: italic; }

.formula-block {
  background: #eff6ff; color: #1e293b;
  border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;
}
.formula-title { margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1e40af; }
.formula-line {
  margin: 4px 0; font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif; line-height: 1.6;
}
.formula-line .math {
  background: #dbeafe; padding: 2px 8px;
  border-radius: 3px; color: #1e40af; font-style: italic;
}

.demo-tip {
  margin: 0; padding: 10px 12px; background: #dbeafe;
  border-radius: 6px; font-size: 12px; color: #1e3a8a;
  line-height: 1.6; border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .dual-canvas { flex-direction: column; }
  .mapping-bar { flex-direction: row; padding: 8px 0; }
  .demo-canvas.dual { height: 320px; }
  .sliders-block { grid-template-columns: 1fr; }
}
</style>
