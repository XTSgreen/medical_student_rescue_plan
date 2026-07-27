<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button :class="{ active: preset === 'rank2' }" :aria-pressed="preset === 'rank2'" @click="setPreset('rank2')">秩 r=2 投影演示</button>
      <button :class="{ active: preset === 'rank1' }" :aria-pressed="preset === 'rank1'" @click="setPreset('rank1')">秩 r=1 投影演示</button>
      <button :class="{ active: preset === 'full' }" :aria-pressed="preset === 'full'" @click="setPreset('full')">满秩 r=3</button>
    </div>

    <div class="dual-canvas">
      <div class="canvas-wrap">
        <p class="canvas-label">定义域 ℝ³ = C(A<sup>T</sup>) ⊕ N(A)</p>
        <div ref="leftCanvasContainer" class="demo-canvas dual" role="img" aria-label="定义域画面，展示行空间与零空间的直和分解，可用鼠标拖拽旋转视角"></div>
      </div>
      <div class="mapping-arrow">
        <div class="matrix-badge">A</div>
        <div class="arrow-line">→</div>
        <div class="mapping-tip">x ↦ Ax</div>
      </div>
      <div class="canvas-wrap">
        <p class="canvas-label">值域 ℝ³ = C(A) ⊕ N(A<sup>T</sup>)</p>
        <div ref="rightCanvasContainer" class="demo-canvas dual" role="img" aria-label="值域画面，展示列空间与左零空间的直和分解，可用鼠标拖拽旋转视角"></div>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

    <div class="matrix-editor-3x3">
      <div class="matrix-display-block">
        <p class="block-title">矩阵 A</p>
        <table class="matrix-table">
          <tr v-for="(row, ri) in matrix" :key="ri">
            <td v-for="(val, ci) in row" :key="ci">{{ val.toFixed(2) }}</td>
          </tr>
        </table>
      </div>
      <div class="sliders-block">
        <label v-for="(name, idx) in ['a','b','c','d','e','f','g','h','i']" :key="idx">
          {{ name }}
          <input type="range" min="-2" max="2" step="0.1"
                 :value="matrix[Math.floor(idx/3)][idx%3]"
                 @input="updateMatrix(Math.floor(idx/3), idx%3, parseFloat(($event.target as HTMLInputElement).value))" />
          <span>{{ matrix[Math.floor(idx/3)][idx%3].toFixed(2) }}</span>
        </label>
      </div>
    </div>

    <div class="demo-controls">
      <fieldset>
        <legend>输入向量 x ∈ ℝ³（自动分解为 x = x<sub>r</sub> + x<sub>n</sub>）</legend>
        <label v-for="(name, idx) in ['1','2','3']" :key="idx">
          x<sub>{{ name }}</sub>
          <input type="range" min="-2" max="2" step="0.1"
                 :value="x[idx]"
                 @input="updateX(idx, parseFloat(($event.target as HTMLInputElement).value))" />
          <span>{{ x[idx].toFixed(2) }}</span>
        </label>
      </fieldset>
    </div>

    <div class="demo-output">
      <div class="output-row" :class="rankClass">
        <span class="label">rank(A) = r</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">dim C(A<sup>T</sup>) = r</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">dim N(A) = n − r</span>
        <span class="value">{{ nullity }}</span>
      </div>
      <div class="output-row">
        <span class="label">dim C(A) = r</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">dim N(A<sup>T</sup>) = m − r</span>
        <span class="value">{{ leftNullity }}</span>
      </div>
      <div class="output-row">
        <span class="label">x =</span>
        <span class="value">({{ x.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row highlight">
        <span class="label">x<sub>r</sub>（行空间分量）</span>
        <span class="value">({{ xr.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row highlight">
        <span class="label">x<sub>n</sub>（零空间分量）</span>
        <span class="value">({{ xn.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row" :class="{ highlight: decompositionValid }">
        <span class="label">x = x<sub>r</sub> + x<sub>n</sub> ?</span>
        <span class="value">{{ decompositionValid ? '验证成立' : '不成立' }}</span>
      </div>
      <div class="output-row" :class="{ highlight: axnZero }">
        <span class="label">A x<sub>n</sub> = 0 ?</span>
        <span class="value">{{ axnZero ? 'x_n ∈ N(A)' : '不在零空间' }}</span>
      </div>
      <div class="output-row">
        <span class="label">Ax =</span>
        <span class="value">({{ ax.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row" :class="{ highlight: axInColSpace }">
        <span class="label">Ax ∈ C(A) ?</span>
        <span class="value">{{ axInColSpace ? '是（始终成立）' : '否' }}</span>
      </div>
      <div class="output-row">
        <span class="label">‖Ax‖ vs ‖x<sub>r</sub>‖</span>
        <span class="value">{{ axNorm.toFixed(3) }} / {{ xrNorm.toFixed(3) }}</span>
      </div>
    </div>

    <table class="dim-table">
      <thead>
        <tr>
          <th>所在空间</th>
          <th>子空间</th>
          <th>维数</th>
          <th>几何形态</th>
          <th>正交补</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ℝ³ 定义域</td>
          <td>行空间 C(A<sup>T</sup>)</td>
          <td>{{ rank }}</td>
          <td>{{ rowSpaceGeometry }}</td>
          <td>N(A)</td>
        </tr>
        <tr>
          <td>ℝ³ 定义域</td>
          <td>零空间 N(A)</td>
          <td>{{ nullity }}</td>
          <td>{{ nullSpaceGeometry }}</td>
          <td>C(A<sup>T</sup>)</td>
        </tr>
        <tr>
          <td>ℝ³ 值域</td>
          <td>列空间 C(A)</td>
          <td>{{ rank }}</td>
          <td>{{ colSpaceGeometry }}</td>
          <td>N(A<sup>T</sup>)</td>
        </tr>
        <tr>
          <td>ℝ³ 值域</td>
          <td>左零空间 N(A<sup>T</sup>)</td>
          <td>{{ leftNullity }}</td>
          <td>{{ leftNullSpaceGeometry }}</td>
          <td>C(A)</td>
        </tr>
      </tbody>
    </table>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '四大子空间定理 · 终极交互演示'
  }
)

const COLOR_ROW_SPACE = 0x10b981
const COLOR_NULL_SPACE = 0x3b82f6
const COLOR_COL_SPACE = 0xef4444
const COLOR_LEFT_NULL = 0xa855f7
const COLOR_X = 0x111827
const COLOR_AX = 0xef4444
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_CUBE = 0x9ca3af

const matrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
])
const x = ref<number[]>([1, 1, 1])

type PresetKey = 'full' | 'rank2' | 'rank1' | 'custom'
const preset = ref<PresetKey>('rank2')

function setPreset(p: PresetKey) {
  preset.value = p
  let target: number[][] | null = null
  let targetX: number[] = [1, 1, 1]
  switch (p) {
    case 'rank2':

      target = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      targetX = [1, 1, 1]
      break
    case 'rank1':

      target = [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
      targetX = [1, 1, 1]
      break
    case 'full':

      target = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      targetX = [1, 1, 1]
      break
    default:
      return
  }
  if (target) {
    matrix.value = target.map(r => [...r])
    x.value = [...targetX]
    triggerDecompAnimation()
  }
}

function updateMatrix(row: number, col: number, value: number) {
  const newM = matrix.value.map(r => [...r])
  newM[row][col] = value
  matrix.value = newM
  preset.value = 'custom'
  triggerDecompAnimation()
}

function updateX(idx: number, value: number) {
  const newX = [...x.value]
  newX[idx] = value
  x.value = newX
  preset.value = 'custom'
  triggerDecompAnimation()
}

type Matrix = number[][]
type Vector = number[]

function transpose(M: Matrix): Matrix {
  const rows = M.length
  const cols = M[0].length
  const T: Matrix = []
  for (let j = 0; j < cols; j++) {
    const row: number[] = []
    for (let i = 0; i < rows; i++) row.push(M[i][j])
    T.push(row)
  }
  return T
}

function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length
  const n = A[0].length
  const p = B[0].length
  const C: Matrix = []
  for (let i = 0; i < m; i++) {
    const row: number[] = new Array(p).fill(0)
    for (let j = 0; j < p; j++) {
      let s = 0
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j]
      row[j] = s
    }
    C.push(row)
  }
  return C
}

function matVec(A: Matrix, v: Vector): Vector {
  const m = A.length
  const n = A[0].length
  const out: Vector = new Array(m).fill(0)
  for (let i = 0; i < m; i++) {
    let s = 0
    for (let j = 0; j < n; j++) s += A[i][j] * v[j]
    out[i] = s
  }
  return out
}

function rankOf(M: Matrix): number {
  const a = M.map(r => [...r])
  const rows = a.length
  const cols = a[0].length
  let rank = 0
  for (let c = 0; c < cols && rank < rows; c++) {
    let pivot = -1
    for (let r = rank; r < rows; r++) {
      if (Math.abs(a[r][c]) > 1e-9) { pivot = r; break }
    }
    if (pivot === -1) continue
    ;[a[rank], a[pivot]] = [a[pivot], a[rank]]
    for (let r = rank + 1; r < rows; r++) {
      if (Math.abs(a[r][c]) > 1e-9) {
        const f = a[r][c] / a[rank][c]
        for (let k = c; k < cols; k++) a[r][k] -= f * a[rank][k]
      }
    }
    rank++
  }
  return rank
}

function rrefOf(M: Matrix): Matrix {
  const a = M.map(r => [...r])
  const rows = a.length
  const cols = a[0].length
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1
    for (let i = r; i < rows; i++) {
      if (Math.abs(a[i][c]) > 1e-9) { p = i; break }
    }
    if (p === -1) continue
    ;[a[r], a[p]] = [a[p], a[r]]
    const pv = a[r][c]
    for (let k = 0; k < cols; k++) a[r][k] /= pv
    for (let i = 0; i < rows; i++) {
      if (i !== r && Math.abs(a[i][c]) > 1e-9) {
        const f = a[i][c]
        for (let k = 0; k < cols; k++) a[i][k] -= f * a[r][k]
      }
    }
    r++
  }
  return a
}

function nullSpaceOf(M: Matrix): { rank: number, basis: Vector[] } {
  const a = M.map(r => [...r])
  const rows = a.length
  const cols = a[0].length
  const pivots: { row: number, col: number }[] = []
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1
    for (let i = r; i < rows; i++) {
      if (Math.abs(a[i][c]) > 1e-9) { p = i; break }
    }
    if (p === -1) continue
    ;[a[r], a[p]] = [a[p], a[r]]
    const pv = a[r][c]
    for (let i = 0; i < rows; i++) {
      if (i !== r && Math.abs(a[i][c]) > 1e-9) {
        const f = a[i][c] / pv
        for (let k = 0; k < cols; k++) a[i][k] -= f * a[r][k]
      }
    }
    pivots.push({ row: r, col: c })
    r++
  }
  const rank = pivots.length

  for (const p of pivots) {
    const pv = a[p.row][p.col]
    if (Math.abs(pv) > 1e-9) {
      for (let k = 0; k < cols; k++) a[p.row][k] /= pv
    }
  }
  const pivotCols = new Set(pivots.map(p => p.col))
  const freeCols: number[] = []
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.has(c)) freeCols.push(c)
  }
  const basis: Vector[] = []
  for (const fc of freeCols) {
    const v: number[] = new Array(cols).fill(0)
    v[fc] = 1
    for (const p of pivots) {
      v[p.col] = -a[p.row][fc]
    }
    basis.push(v)
  }
  return { rank, basis }
}

function rowSpaceBasis(M: Matrix): Vector[] {

  const rref = rrefOf(M)
  const basis: Vector[] = []
  for (const row of rref) {
    if (row.some(v => Math.abs(v) > 1e-9)) {
      basis.push([...row])
    }
  }
  return basis
}

function columnSpaceBasis(M: Matrix): Vector[] {

  const a = M.map(r => [...r])
  const rows = a.length
  const cols = a[0].length
  const pivotCols: number[] = []
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1
    for (let i = r; i < rows; i++) {
      if (Math.abs(a[i][c]) > 1e-9) { p = i; break }
    }
    if (p === -1) continue
    ;[a[r], a[p]] = [a[p], a[r]]
    for (let i = r + 1; i < rows; i++) {
      if (Math.abs(a[i][c]) > 1e-9) {
        const f = a[i][c] / a[r][c]
        for (let k = c; k < cols; k++) a[i][k] -= f * a[r][k]
      }
    }
    pivotCols.push(c)
    r++
  }
  return pivotCols.map(c => M.map(row => row[c]))
}

function leftNullSpaceBasis(M: Matrix): Vector[] {

  const T = transpose(M)
  return nullSpaceOf(T).basis
}

function projectOntoRowSpace(M: Matrix, xVec: Vector): Vector {
  const basis = rowSpaceBasis(M)
  const n = xVec.length
  if (basis.length === 0) return new Array(n).fill(0)

  const ortho: Vector[] = []
  for (const b of basis) {
    const v: number[] = [...b]
    for (const e of ortho) {
      let dot = 0
      for (let i = 0; i < n; i++) dot += v[i] * e[i]
      for (let i = 0; i < n; i++) v[i] -= dot * e[i]
    }
    let norm = 0
    for (let i = 0; i < n; i++) norm += v[i] * v[i]
    norm = Math.sqrt(norm)
    if (norm > 1e-9) {
      ortho.push(v.map(vi => vi / norm))
    }
  }

  const result: number[] = new Array(n).fill(0)
  for (const e of ortho) {
    let dot = 0
    for (let i = 0; i < n; i++) dot += xVec[i] * e[i]
    for (let i = 0; i < n; i++) result[i] += dot * e[i]
  }
  return result
}

const rank = computed(() => rankOf(matrix.value))
const nullity = computed(() => 3 - rank.value)
const leftNullity = computed(() => 3 - rank.value)

const rowBasis = computed(() => rowSpaceBasis(matrix.value))
const nullBasis = computed(() => nullSpaceOf(matrix.value).basis)
const colBasis = computed(() => columnSpaceBasis(matrix.value))
const leftNullBasis = computed(() => leftNullSpaceBasis(matrix.value))

const xr = computed(() => projectOntoRowSpace(matrix.value, x.value))
const xn = computed(() => x.value.map((xi, i) => xi - xr.value[i]))
const ax = computed(() => matVec(matrix.value, x.value))

const decompositionValid = computed(() => {
  const sum = xr.value.map((xrI, i) => xrI + xn.value[i])
  return sum.every((s, i) => Math.abs(s - x.value[i]) < 1e-6)
})

const axnZero = computed(() => {
  const axn = matVec(matrix.value, xn.value)
  return axn.every(v => Math.abs(v) < 1e-6)
})

const axInColSpace = computed(() => {

  const aug = matrix.value.map((row, i) => [...row, ax.value[i]])
  return rankOf(aug) === rank.value
})

const axNorm = computed(() => Math.sqrt(ax.value.reduce((s, v) => s + v * v, 0)))
const xrNorm = computed(() => Math.sqrt(xr.value.reduce((s, v) => s + v * v, 0)))

const rankClass = computed(() => ({
  rank3: rank.value === 3,
  rank2: rank.value === 2,
  rank1: rank.value === 1,
  rank0: rank.value === 0
}))

function geometryText(dim: number): string {
  switch (dim) {
    case 0: return '仅原点 {0}'
    case 1: return '过原点直线'
    case 2: return '过原点平面'
    case 3: return '整个 ℝ³'
    default: return ''
  }
}

const rowSpaceGeometry = computed(() => geometryText(rank.value))
const nullSpaceGeometry = computed(() => geometryText(nullity.value))
const colSpaceGeometry = computed(() => geometryText(rank.value))
const leftNullSpaceGeometry = computed(() => geometryText(leftNullity.value))

const tipText = computed(() => {
  const r = rank.value
  if (r === 3) {
    return '满秩 r=3：A 是同构。N(A) 与 N(Aᵀ) 均退化为 {0}。x = x_r（无零空间分量），Ax = x。'
  }
  if (r === 0) {
    return '零矩阵 r=0：C(Aᵀ) 与 C(A) 均退化为 {0}。x = x_n（无行空间分量），Ax = 0（所有向量被压缩到原点）。'
  }
  if (r === 2) {
    return '秩 r=2：行空间是 2D 平面，零空间是 1D 直线（与之正交）。列空间是 2D 平面，左零空间是 1D 直线。绿色虚线 = x 到 x_r 的正交投影；蓝色虚线 = x 到 x_n 的正交分量。Ax 始终落在列空间平面内。'
  }
  return '秩 r=1：行空间是 1D 直线，零空间是 2D 平面（与之正交）。列空间是 1D 直线，左零空间是 2D 平面。x 的行空间分量 x_r 沿行空间直线方向；x_n 落在零空间平面内。Ax 沿列空间直线方向。'
})

const animatedXr = ref<number[]>([0, 0, 0])
const animatedXn = ref<number[]>([0, 0, 0])
let decompAnimFrame = 0
let decompAnimStart = 0
let startXR: number[] = [0, 0, 0]
let startXN: number[] = [0, 0, 0]
let endXR: number[] = [0, 0, 0]
let endXN: number[] = [0, 0, 0]

function triggerDecompAnimation() {
  startXR = [...animatedXr.value]
  startXN = [...animatedXn.value]
  endXR = [...xr.value]
  endXN = [...xn.value]
  decompAnimStart = performance.now()
  cancelAnimationFrame(decompAnimFrame)

  function step(now: number) {
    const t = Math.min(1, (now - decompAnimStart) / 500)
    const eased = t * (2 - t)
    animatedXr.value = startXR.map((v, i) => v + (endXR[i] - v) * eased)
    animatedXn.value = startXN.map((v, i) => v + (endXN[i] - v) * eased)
    updateScene()
    if (t < 1) {
      decompAnimFrame = requestAnimationFrame(step)
    }
  }
  decompAnimFrame = requestAnimationFrame(step)
}

const leftCanvasContainer = ref<HTMLElement | null>(null)
const rightCanvasContainer = ref<HTMLElement | null>(null)

let leftScene: THREE.Scene, rightScene: THREE.Scene
let leftCamera: THREE.PerspectiveCamera, rightCamera: THREE.PerspectiveCamera
let leftRenderer: THREE.WebGLRenderer, rightRenderer: THREE.WebGLRenderer
let leftControls: OrbitControls, rightControls: OrbitControls
let resizeObserver: ResizeObserver
let renderId = 0

let rowSpacePlane: THREE.Mesh
let rowSpaceLine: THREE.Line
let rowSpaceBox: THREE.LineSegments
let nullSpacePlane: THREE.Mesh
let nullSpaceLine: THREE.Line
let nullSpaceBox: THREE.LineSegments
let leftOriginSphere: THREE.Mesh
let xArrow: THREE.ArrowHelper
let xrArrow: THREE.ArrowHelper
let xnArrow: THREE.ArrowHelper
let xToXrLine: THREE.Line
let xToXnLine: THREE.Line

let colSpacePlane: THREE.Mesh
let colSpaceLine: THREE.Line
let colSpaceBox: THREE.LineSegments
let leftNullPlane: THREE.Mesh
let leftNullLine: THREE.Line
let leftNullBox: THREE.LineSegments
let rightOriginSphere: THREE.Mesh
let axArrow: THREE.ArrowHelper

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

function initLeftScene() {
  const container = leftCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  leftScene = new THREE.Scene()
  leftScene.background = null

  leftCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  leftCamera.position.set(3, 3, 5)
  leftCamera.lookAt(0, 0, 0)

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
  leftControls.maxDistance = 25

  leftScene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  leftScene.add(dir)

  const grid = new THREE.GridHelper(6, 6, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  leftScene.add(grid)

  const axes = new THREE.AxesHelper(2.5)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.5
  leftScene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  leftOriginSphere = new THREE.Mesh(origGeom, origMat)
  leftScene.add(leftOriginSphere)

  const rsPlaneGeom = new THREE.PlaneGeometry(6, 6)
  const rsPlaneMat = new THREE.MeshPhongMaterial({
    color: COLOR_ROW_SPACE,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    shininess: 30
  })
  rowSpacePlane = new THREE.Mesh(rsPlaneGeom, rsPlaneMat)
  rowSpacePlane.visible = false
  leftScene.add(rowSpacePlane)

  const rsLineGeom = new THREE.BufferGeometry()
  rsLineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const rsLineMat = new THREE.LineBasicMaterial({ color: COLOR_ROW_SPACE, linewidth: 4 })
  rowSpaceLine = new THREE.Line(rsLineGeom, rsLineMat)
  rowSpaceLine.visible = false
  leftScene.add(rowSpaceLine)

  const rsBoxGeom = new THREE.BoxGeometry(4, 4, 4)
  const rsBoxEdges = new THREE.EdgesGeometry(rsBoxGeom)
  const rsBoxMat = new THREE.LineBasicMaterial({
    color: COLOR_ROW_SPACE,
    transparent: true,
    opacity: 0.6
  })
  rowSpaceBox = new THREE.LineSegments(rsBoxEdges, rsBoxMat)
  rowSpaceBox.visible = false
  leftScene.add(rowSpaceBox)

  const nsPlaneGeom = new THREE.PlaneGeometry(6, 6)
  const nsPlaneMat = new THREE.MeshPhongMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    shininess: 30
  })
  nullSpacePlane = new THREE.Mesh(nsPlaneGeom, nsPlaneMat)
  nullSpacePlane.visible = false
  leftScene.add(nullSpacePlane)

  const nsLineGeom = new THREE.BufferGeometry()
  nsLineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const nsLineMat = new THREE.LineBasicMaterial({ color: COLOR_NULL_SPACE, linewidth: 4 })
  nullSpaceLine = new THREE.Line(nsLineGeom, nsLineMat)
  nullSpaceLine.visible = false
  leftScene.add(nullSpaceLine)

  const nsBoxGeom = new THREE.BoxGeometry(4, 4, 4)
  const nsBoxEdges = new THREE.EdgesGeometry(nsBoxGeom)
  const nsBoxMat = new THREE.LineBasicMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.5
  })
  nullSpaceBox = new THREE.LineSegments(nsBoxEdges, nsBoxMat)
  nullSpaceBox.visible = false
  leftScene.add(nullSpaceBox)

  xArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_X, 0.25, 0.15
  )
  leftScene.add(xArrow)

  xrArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_ROW_SPACE, 0.25, 0.15
  )
  leftScene.add(xrArrow)

  xnArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_NULL_SPACE, 0.25, 0.15
  )
  leftScene.add(xnArrow)

  const xToXrGeom = new THREE.BufferGeometry()
  xToXrGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const xToXrMat = new THREE.LineDashedMaterial({
    color: COLOR_ROW_SPACE,
    dashSize: 0.15,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.85
  })
  xToXrLine = new THREE.Line(xToXrGeom, xToXrMat)
  xToXrLine.computeLineDistances()
  xToXrLine.visible = false
  leftScene.add(xToXrLine)

  const xToXnGeom = new THREE.BufferGeometry()
  xToXnGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const xToXnMat = new THREE.LineDashedMaterial({
    color: COLOR_NULL_SPACE,
    dashSize: 0.15,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.85
  })
  xToXnLine = new THREE.Line(xToXnGeom, xToXnMat)
  xToXnLine.computeLineDistances()
  xToXnLine.visible = false
  leftScene.add(xToXnLine)
}

function initRightScene() {
  const container = rightCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  rightScene = new THREE.Scene()
  rightScene.background = null

  rightCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  rightCamera.position.set(3, 3, 5)
  rightCamera.lookAt(0, 0, 0)

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
  rightControls.maxDistance = 25

  rightScene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  rightScene.add(dir)

  const grid = new THREE.GridHelper(6, 6, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  rightScene.add(grid)

  const axes = new THREE.AxesHelper(2.5)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.5
  rightScene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  rightOriginSphere = new THREE.Mesh(origGeom, origMat)
  rightScene.add(rightOriginSphere)

  const csPlaneGeom = new THREE.PlaneGeometry(6, 6)
  const csPlaneMat = new THREE.MeshPhongMaterial({
    color: COLOR_COL_SPACE,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    shininess: 30
  })
  colSpacePlane = new THREE.Mesh(csPlaneGeom, csPlaneMat)
  colSpacePlane.visible = false
  rightScene.add(colSpacePlane)

  const csLineGeom = new THREE.BufferGeometry()
  csLineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const csLineMat = new THREE.LineBasicMaterial({ color: COLOR_COL_SPACE, linewidth: 4 })
  colSpaceLine = new THREE.Line(csLineGeom, csLineMat)
  colSpaceLine.visible = false
  rightScene.add(colSpaceLine)

  const csBoxGeom = new THREE.BoxGeometry(4, 4, 4)
  const csBoxEdges = new THREE.EdgesGeometry(csBoxGeom)
  const csBoxMat = new THREE.LineBasicMaterial({
    color: COLOR_COL_SPACE,
    transparent: true,
    opacity: 0.6
  })
  colSpaceBox = new THREE.LineSegments(csBoxEdges, csBoxMat)
  colSpaceBox.visible = false
  rightScene.add(colSpaceBox)

  const lnPlaneGeom = new THREE.PlaneGeometry(6, 6)
  const lnPlaneMat = new THREE.MeshPhongMaterial({
    color: COLOR_LEFT_NULL,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    shininess: 30
  })
  leftNullPlane = new THREE.Mesh(lnPlaneGeom, lnPlaneMat)
  leftNullPlane.visible = false
  rightScene.add(leftNullPlane)

  const lnLineGeom = new THREE.BufferGeometry()
  lnLineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const lnLineMat = new THREE.LineBasicMaterial({ color: COLOR_LEFT_NULL, linewidth: 4 })
  leftNullLine = new THREE.Line(lnLineGeom, lnLineMat)
  leftNullLine.visible = false
  rightScene.add(leftNullLine)

  const lnBoxGeom = new THREE.BoxGeometry(4, 4, 4)
  const lnBoxEdges = new THREE.EdgesGeometry(lnBoxGeom)
  const lnBoxMat = new THREE.LineBasicMaterial({
    color: COLOR_LEFT_NULL,
    transparent: true,
    opacity: 0.5
  })
  leftNullBox = new THREE.LineSegments(lnBoxEdges, lnBoxMat)
  leftNullBox.visible = false
  rightScene.add(leftNullBox)

  axArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_AX, 0.25, 0.15
  )
  rightScene.add(axArrow)
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.25, Math.max(0.05, len * 0.3))
    const headWid = Math.min(0.12, Math.max(0.03, len * 0.2))
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

function updateDashedLine(line: THREE.Line, p1: THREE.Vector3, p2: THREE.Vector3) {
  const dist = p1.distanceTo(p2)
  if (dist < 1e-4) {
    line.visible = false
    return
  }
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p1.x, p1.y, p1.z)
  pos.setXYZ(1, p2.x, p2.y, p2.z)
  pos.needsUpdate = true
  line.computeLineDistances()
  line.visible = true
}

function normalFromBasis(basis: Vector[]): THREE.Vector3 | null {
  if (basis.length < 2) return null
  const v1 = new THREE.Vector3(basis[0][0], basis[0][1], basis[0][2])

  for (let i = 1; i < basis.length; i++) {
    const v2 = new THREE.Vector3(basis[i][0], basis[i][1], basis[i][2])
    const n = new THREE.Vector3().crossVectors(v1, v2)
    if (n.lengthSq() > 1e-9) return n.normalize()
  }
  return null
}

function dirFromBasis(basis: Vector[]): THREE.Vector3 | null {
  for (const b of basis) {
    const v = new THREE.Vector3(b[0], b[1], b[2])
    if (v.lengthSq() > 1e-9) return v.normalize()
  }
  return null
}

function setLineEndpoints(line: THREE.Line, dirN: THREE.Vector3, halfLen: number) {
  const p1 = dirN.clone().multiplyScalar(-halfLen)
  const p2 = dirN.clone().multiplyScalar(halfLen)
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p1.x, p1.y, p1.z)
  pos.setXYZ(1, p2.x, p2.y, p2.z)
  pos.needsUpdate = true
  line.visible = true
}

function updateScene() {
  if (!leftScene || !rightScene) return
  const r = rank.value
  const m = matrix.value

  rowSpacePlane.visible = false
  rowSpaceLine.visible = false
  rowSpaceBox.visible = false
  if (r === 3) {
    rowSpaceBox.visible = true
  } else if (r === 2) {
    const n = normalFromBasis(rowBasis.value)
    if (n) {
      rowSpacePlane.position.set(0, 0, 0)
      rowSpacePlane.lookAt(n)
      rowSpacePlane.visible = true
    }
  } else if (r === 1) {
    const d = dirFromBasis(rowBasis.value)
    if (d) setLineEndpoints(rowSpaceLine, d, 3)
  }

  nullSpacePlane.visible = false
  nullSpaceLine.visible = false
  nullSpaceBox.visible = false
  const nDim = nullity.value
  if (nDim === 3) {
    nullSpaceBox.visible = true
  } else if (nDim === 2) {
    const n = normalFromBasis(nullBasis.value)
    if (n) {
      nullSpacePlane.position.set(0, 0, 0)
      nullSpacePlane.lookAt(n)
      nullSpacePlane.visible = true
    }
  } else if (nDim === 1) {
    const d = dirFromBasis(nullBasis.value)
    if (d) setLineEndpoints(nullSpaceLine, d, 3)
  }

  const xVec = new THREE.Vector3(x.value[0], x.value[1], x.value[2])
  setArrow(xArrow, xVec)
  setArrowColor(xArrow, COLOR_X)

  const xrVec = new THREE.Vector3(
    animatedXr.value[0], animatedXr.value[1], animatedXr.value[2]
  )
  const xnVec = new THREE.Vector3(
    animatedXn.value[0], animatedXn.value[1], animatedXn.value[2]
  )
  setArrow(xrArrow, xrVec)
  setArrowColor(xrArrow, COLOR_ROW_SPACE)
  setArrow(xnArrow, xnVec)
  setArrowColor(xnArrow, COLOR_NULL_SPACE)

  const xTip = xVec.clone()
  const xrTip = xrVec.clone()
  const xnTip = xnVec.clone()
  updateDashedLine(xToXrLine, xrTip, xTip)
  updateDashedLine(xToXnLine, xnTip, xTip)

  colSpacePlane.visible = false
  colSpaceLine.visible = false
  colSpaceBox.visible = false
  if (r === 3) {
    colSpaceBox.visible = true
  } else if (r === 2) {
    const n = normalFromBasis(colBasis.value)
    if (n) {
      colSpacePlane.position.set(0, 0, 0)
      colSpacePlane.lookAt(n)
      colSpacePlane.visible = true
    }
  } else if (r === 1) {
    const d = dirFromBasis(colBasis.value)
    if (d) setLineEndpoints(colSpaceLine, d, 3)
  }

  leftNullPlane.visible = false
  leftNullLine.visible = false
  leftNullBox.visible = false
  const lnDim = leftNullity.value
  if (lnDim === 3) {
    leftNullBox.visible = true
  } else if (lnDim === 2) {
    const n = normalFromBasis(leftNullBasis.value)
    if (n) {
      leftNullPlane.position.set(0, 0, 0)
      leftNullPlane.lookAt(n)
      leftNullPlane.visible = true
    }
  } else if (lnDim === 1) {
    const d = dirFromBasis(leftNullBasis.value)
    if (d) setLineEndpoints(leftNullLine, d, 3)
  }

  const axAnimated = matVec(m, animatedXr.value)
  const axVec = new THREE.Vector3(axAnimated[0], axAnimated[1], axAnimated[2])
  setArrow(axArrow, axVec)
  setArrowColor(axArrow, COLOR_AX)
}

function animate() {
  renderId = requestAnimationFrame(animate)
  if (!leftRenderer || !rightRenderer) return
  leftControls.update()
  rightControls.update()
  leftRenderer.render(leftScene, leftCamera)
  rightRenderer.render(rightScene, rightCamera)
}

function handleResize() {
  if (leftCanvasContainer.value && leftRenderer && leftCamera) {
    const w = leftCanvasContainer.value.clientWidth
    const h = leftCanvasContainer.value.clientHeight
    if (w > 0 && h > 0) {
      leftCamera.aspect = w / h
      leftCamera.updateProjectionMatrix()
      leftRenderer.setSize(w, h)
    }
  }
  if (rightCanvasContainer.value && rightRenderer && rightCamera) {
    const w = rightCanvasContainer.value.clientWidth
    const h = rightCanvasContainer.value.clientHeight
    if (w > 0 && h > 0) {
      rightCamera.aspect = w / h
      rightCamera.updateProjectionMatrix()
      rightRenderer.setSize(w, h)
    }
  }
}

onMounted(() => {
  try {
    if (!checkWebGL()) {
      initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
      initStatusType.value = 'warning'
      const msg = '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
      if (leftCanvasContainer.value) leftCanvasContainer.value.innerHTML = msg
      if (rightCanvasContainer.value) rightCanvasContainer.value.innerHTML = msg
      return
    }
    initLeftScene()
    initRightScene()
    if (leftRenderer && rightRenderer) {

      animatedXr.value = [...xr.value]
      animatedXn.value = [...xn.value]
      updateScene()
      renderId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('FourSubspacesTheoremDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (leftCanvasContainer.value) resizeObserver.observe(leftCanvasContainer.value)
  if (rightCanvasContainer.value) resizeObserver.observe(rightCanvasContainer.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(renderId)
  cancelAnimationFrame(decompAnimFrame)
  resizeObserver?.disconnect()
  leftControls?.dispose()
  rightControls?.dispose()
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
  leftRenderer?.dispose()
  rightRenderer?.dispose()
  leftRenderer?.forceContextLoss()
  rightRenderer?.forceContextLoss()
  if (leftRenderer?.domElement?.parentNode) {
    leftRenderer.domElement.parentNode.removeChild(leftRenderer.domElement)
  }
  if (rightRenderer?.domElement?.parentNode) {
    rightRenderer.domElement.parentNode.removeChild(rightRenderer.domElement)
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

.dual-canvas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-2) 0;
  align-items: center;
  justify-content: center;
}

.canvas-wrap {
  flex: 1 1 300px;
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
  height: 360px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mapping-arrow {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3em;
  padding: 0 0.4em;
  color: var(--text-tertiary);
}

.matrix-badge {
  width: 2em;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: white;
  font-family: var(--font-mono);
  font-weight: 700;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
}

.arrow-line {
  font-size: 1.4rem;
  color: var(--color-accent);
  font-weight: 700;
  line-height: 1;
}

.mapping-tip {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.matrix-editor-3x3 {
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
}

.matrix-table {
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  position: relative;
  padding: 0 0.6em;
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

.sliders-block {
  flex: 1 1 280px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-2);
}

.sliders-block label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: 500;
  font-family: var(--font-mono);
}

.sliders-block label input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 80px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.sliders-block label input[type="range"]::-webkit-slider-thumb {
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

.sliders-block label input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.sliders-block label input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.sliders-block label span {
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

.demo-controls fieldset {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin: var(--space-3) 0 0 0;
}

.demo-controls legend {
  font-weight: 600;
  font-size: var(--fs-sm);
  color: var(--color-accent-strong);
  padding: 0 var(--space-2);
}

.demo-controls fieldset label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0.8em var(--space-1) 0;
  font-weight: 500;
  font-family: var(--font-mono);
}

.demo-controls fieldset label span {
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

.demo-controls fieldset input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.demo-controls fieldset input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
  box-shadow: var(--shadow-sm);
}

.demo-controls fieldset input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
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

.output-row.rank3 {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.10);
}
.output-row.rank3 .value { color: #047857; }

.output-row.rank2 {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.10);
}
.output-row.rank2 .value { color: #b45309; }

.output-row.rank1 {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.10);
}
.output-row.rank1 .value { color: #c2410c; }

.output-row.rank0 {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.10);
}
.output-row.rank0 .value { color: #b91c1c; }

.dim-table {
  width: 100%;
  margin-top: var(--space-3);
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.dim-table th,
.dim-table td {
  padding: 0.5em 0.8em;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
}

.dim-table th {
  background: var(--bg-code);
  color: var(--text-secondary);
  font-weight: 600;
}

.dim-table tr:last-child td {
  border-bottom: none;
}

.dim-table td:first-child {
  color: var(--color-accent-strong);
  font-weight: 600;
}

.dim-table td:nth-child(2) {
  color: var(--text-primary);
  font-weight: 600;
}

.dim-table td:nth-child(3) {
  color: var(--color-accent-strong);
  font-weight: 700;
}

.dim-table td:nth-child(5) {
  color: var(--text-tertiary);
  font-size: var(--fs-xs);
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
  .demo-canvas.dual {
    height: 280px;
  }
  .mapping-arrow {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    padding: var(--space-1) 0;
  }
}
</style>
