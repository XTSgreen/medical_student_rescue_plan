<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'diagonal' }" @click="setPreset('diagonal')">对角矩阵</button>
      <button :class="{ active: preset === 'upper' }" @click="setPreset('upper')">上三角矩阵</button>
      <button :class="{ active: preset === 'general' }" @click="setPreset('general')">一般矩阵（默认）</button>
    </div>

    <div class="dual-canvas">
      <div class="canvas-wrap">
        <p class="canvas-label">矩阵 A 的列向量（原始基）</p>
        <div ref="leftCanvasContainer" class="demo-canvas dual"></div>
      </div>
      <div class="equals-badge">
        <div class="equals-matrix">A</div>
        <div class="equals-symbol">=</div>
        <div class="equals-matrix">QR</div>
      </div>
      <div class="canvas-wrap">
        <p class="canvas-label">矩阵 Q 的标准正交基</p>
        <div ref="rightCanvasContainer" class="demo-canvas dual"></div>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

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
        <label v-for="(name, idx) in sliderLabels" :key="idx">
          {{ name }}
          <input type="range" min="-2" max="2" step="0.1"
                 :value="matrix[Math.floor(idx/3)][idx%3]"
                 @input="updateMatrix(Math.floor(idx/3), idx%3, parseFloat(($event.target as HTMLInputElement).value))" />
          <span>{{ matrix[Math.floor(idx/3)][idx%3].toFixed(2) }}</span>
        </label>
      </div>
    </div>

    <div class="r-matrix-section">
      <p class="block-title">R 矩阵（点击非零元素查看 a<sub>j</sub> 在 q<sub>i</sub> 上的投影分解）</p>
      <table class="r-matrix-table">
        <tr v-for="(row, i) in R" :key="i">
          <td v-for="(val, j) in row" :key="j"
              :class="{
                'r-diagonal': i === j,
                'r-upper': i < j,
                'r-lower': i > j,
                'r-selected': selectedR && selectedR.i === i && selectedR.j === j
              }"
              @click="selectR(i, j)">
            <span class="r-value">{{ i > j ? '0' : val.toFixed(3) }}</span>
            <span class="r-hint" v-if="i === j">‖v<sub>{{ j + 1 }}</sub>‖</span>
            <span class="r-hint" v-else-if="i < j">a<sub>{{ j + 1 }}</sub>·q<sub>{{ i + 1 }}</sub></span>
          </td>
        </tr>
      </table>
      <p class="r-selection-info" v-if="selectedR">
        选中 r<sub>{{ selectedR.i + 1 }}{{ selectedR.j + 1 }}</sub> =
        <span v-if="selectedR.i === selectedR.j">‖v<sub>{{ selectedR.j + 1 }}</sub>‖</span>
        <span v-else>a<sub>{{ selectedR.j + 1 }}</sub> · q<sub>{{ selectedR.i + 1 }}</sub></span>
        = <strong>{{ R[selectedR.i][selectedR.j].toFixed(4) }}</strong>
        <button class="clear-selection" @click="clearSelection">清除选择</button>
      </p>
      <p class="r-selection-info placeholder" v-else>
        提示：点击 R 矩阵中的金色对角元或上三角元素，左场景会高亮对应的 a<sub>j</sub> 并显示其在 q<sub>i</sub> 方向的投影分量（青绿色箭头）与直角标记。
      </p>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">矩阵 A</span>
        <span class="value matrix-display">{{ formatMatrix(animatedMatrix) }}</span>
      </div>
      <div class="output-row">
        <span class="label">矩阵 Q</span>
        <span class="value matrix-display">{{ formatMatrix(Q) }}</span>
      </div>
      <div class="output-row">
        <span class="label">矩阵 R</span>
        <span class="value matrix-display">{{ formatMatrix(R) }}</span>
      </div>
      <div class="output-row" :class="{ highlight: qtqIsIdentity, danger: !qtqIsIdentity }">
        <span class="label">QᵀQ = I ?</span>
        <span class="value">{{ qtqIsIdentity ? '单位阵' : '不成立（降秩）' }}</span>
      </div>
      <div class="output-row" :class="{ highlight: qrEqualsA, danger: !qrEqualsA }">
        <span class="label">QR = A ?</span>
        <span class="value">{{ qrEqualsA ? '验证成立' : '不成立' }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(Q)</span>
        <span class="value">{{ detQ.toFixed(4) }}（应 ≈ ±1）</span>
      </div>
      <div class="output-row" :class="{ highlight: detIdentity }">
        <span class="label">|det(A)| = ∏|rᵢᵢ|</span>
        <span class="value">{{ absDetA.toFixed(4) }} = {{ prodRii.toFixed(4) }}</span>
      </div>
      <div class="output-row" :class="rankClass">
        <span class="label">rank(A)（由 rᵢᵢ ≠ 0 计）</span>
        <span class="value">{{ rankA }}</span>
      </div>
    </div>

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
    title: 'QR 分解 · 列向量的正交化可视化'
  }
)

const COLOR_A = 0x9ca3af
const COLOR_Q1 = 0xfbbf24
const COLOR_Q2 = 0xef4444
const COLOR_Q3 = 0x3b82f6
const COLOR_HIGHLIGHT = 0xf97316
const COLOR_PROJECTION = 0x06b6d4
const COLOR_DASHED = 0x06b6d4
const COLOR_SQUARE = 0xffffff
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const Q_COLORS = [COLOR_Q1, COLOR_Q2, COLOR_Q3]

const sliderLabels = ['a₁₁', 'a₁₂', 'a₁₃', 'a₂₁', 'a₂₂', 'a₂₃', 'a₃₁', 'a₃₂', 'a₃₃']

const matrix = ref<number[][]>([
  [1, 1, 1],
  [0, 1, 1],
  [0, 0, 1]
])
const animatedMatrix = ref<number[][]>([
  [1, 1, 1],
  [0, 1, 1],
  [0, 0, 1]
])

type PresetKey = 'diagonal' | 'upper' | 'general' | 'custom'
const preset = ref<PresetKey>('general')

const PRESETS: Record<Exclude<PresetKey, 'custom'>, number[][]> = {
  diagonal: [[2, 0, 0], [0, 1.5, 0], [0, 0, 1]],
  upper: [[2, 1, 0.5], [0, 1.5, 0.3], [0, 0, 1]],
  general: [[1, 1, 1], [0, 1, 1], [0, 0, 1]]
}

function setPreset(p: PresetKey) {
  if (p === 'custom') return
  preset.value = p
  const target = PRESETS[p].map(r => [...r])
  matrix.value = target
  selectedR.value = null
  animateToMatrix(target)
}

function updateMatrix(row: number, col: number, value: number) {
  const newM = matrix.value.map(r => [...r])
  newM[row][col] = value
  matrix.value = newM
  preset.value = 'custom'
  animateToMatrix(newM)
}

let animFrame = 0
let animStart = 0
let startMatrix: number[][] = []
let endMatrix: number[][] = []

function animateToMatrix(target: number[][]) {
  startMatrix = animatedMatrix.value.map(r => [...r])
  endMatrix = target.map(r => [...r])
  animStart = performance.now()
  cancelAnimationFrame(animFrame)

  function step(now: number) {
    const t = Math.min(1, (now - animStart) / 800)
    const eased = t * (2 - t)
    const newM = startMatrix.map((row, ri) =>
      row.map((v, ci) => v + (endMatrix[ri][ci] - v) * eased)
    )
    animatedMatrix.value = newM
    updateScene()
    if (t < 1) {
      animFrame = requestAnimationFrame(step)
    }
  }
  animFrame = requestAnimationFrame(step)
}

function dot(u: number[], v: number[]): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
}

function norm(v: number[]): number {
  return Math.sqrt(dot(v, v))
}

function transpose(M: number[][]): number[][] {
  const rows = M.length
  const cols = M[0].length
  const T: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0))
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = M[i][j]
    }
  }
  return T
}

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length
  const n = B[0].length
  const k = B.length
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let p = 0; p < k; p++) s += A[i][p] * B[p][j]
      C[i][j] = s
    }
  }
  return C
}

function det(M: number[][]): number {

  return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
       - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
       + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
}

function gramSchmidt(A: number[][]): { Q: number[][], R: number[][] } {
  const n = A.length
  const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const R: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const V: number[][] = []

  for (let j = 0; j < n; j++) {

    const a_j = [A[0][j], A[1][j], A[2][j]]

    const v = [...a_j]
    for (let i = 0; i < j; i++) {

      const v_i_norm = norm(V[i])
      const q_i = v_i_norm > 1e-10
        ? V[i].map(x => x / v_i_norm)
        : [0, 0, 0]

      R[i][j] = dot(v, q_i)

      for (let k = 0; k < n; k++) v[k] -= R[i][j] * q_i[k]
    }

    R[j][j] = norm(v)
    V.push([...v])

    if (R[j][j] > 1e-10) {
      for (let k = 0; k < n; k++) Q[k][j] = v[k] / R[j][j]
    } else {

      for (let k = 0; k < n; k++) Q[k][j] = 0
    }
  }
  return { Q, R }
}

const qr = computed(() => gramSchmidt(animatedMatrix.value))
const Q = computed(() => qr.value.Q)
const R = computed(() => qr.value.R)
const QtQ = computed(() => matMul(transpose(Q.value), Q.value))
const QR = computed(() => matMul(Q.value, R.value))

const qtqIsIdentity = computed(() => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const expected = i === j ? 1 : 0
      if (Math.abs(QtQ.value[i][j] - expected) > 1e-6) return false
    }
  }
  return true
})

const qrEqualsA = computed(() => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (Math.abs(QR.value[i][j] - animatedMatrix.value[i][j]) > 1e-6) return false
    }
  }
  return true
})

const detQ = computed(() => det(Q.value))
const absDetA = computed(() => Math.abs(det(animatedMatrix.value)))
const prodRii = computed(() =>
  Math.abs(R.value[0][0] * R.value[1][1] * R.value[2][2])
)
const detIdentity = computed(() => Math.abs(absDetA.value - prodRii.value) < 1e-6)

const rankA = computed(() => {
  let r = 0
  for (let i = 0; i < 3; i++) {
    if (Math.abs(R.value[i][i]) > 1e-9) r++
  }
  return r
})

const rankClass = computed(() => ({
  rank3: rankA.value === 3,
  rank2: rankA.value === 2,
  rank1: rankA.value === 1,
  rank0: rankA.value === 0
}))

function formatMatrix(M: number[][]): string {
  return M.map(row => '[' + row.map(v => v.toFixed(2)).join(', ') + ']').join(' ')
}

const selectedR = ref<{ i: number, j: number } | null>(null)

function selectR(i: number, j: number) {
  if (i > j) return
  if (selectedR.value && selectedR.value.i === i && selectedR.value.j === j) {
    selectedR.value = null
  } else {
    selectedR.value = { i, j }
  }
  updateScene()
}

function clearSelection() {
  selectedR.value = null
  updateScene()
}

const tipText = computed(() => {
  if (selectedR.value) {
    const { i, j } = selectedR.value
    const rij = R.value[i][j]
    if (i === j) {
      return `r${i + 1}${j + 1} = ‖v${j + 1}‖ = ${rij.toFixed(4)}：左场景中青绿色投影箭头即正交化后的 v${j + 1}，其长度恰为该对角元；橙色 a${j + 1} 与 v${j + 1} 末端之间的虚线代表之前各次投影的累加。`
    }
    return `r${i + 1}${j + 1} = a${j + 1} · q${i + 1} = ${rij.toFixed(4)}：左场景中青绿色箭头是 a${j + 1} 在 q${i + 1} 方向的投影分量 (长度 ${rij.toFixed(4)})，虚线与白色直角标记显示 a${j + 1} = 投影 + 垂直分量。`
  }
  return '点击 R 矩阵的非零元素，观察 aⱼ 在 qᵢ 方向的投影分解。Gram-Schmidt 过程把 A 的列正交化为 Q，上三角 R 记录每一步的投影系数：rᵢⱼ = aⱼ · qᵢ（i < j），rⱼⱼ = ‖vⱼ‖。'
})

const leftCanvasContainer = ref<HTMLElement | null>(null)
const rightCanvasContainer = ref<HTMLElement | null>(null)

let leftScene: THREE.Scene, rightScene: THREE.Scene
let leftCamera: THREE.PerspectiveCamera, rightCamera: THREE.PerspectiveCamera
let leftRenderer: THREE.WebGLRenderer, rightRenderer: THREE.WebGLRenderer
let leftControls: OrbitControls, rightControls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let aArrows: THREE.ArrowHelper[] = []
let leftOriginSphere: THREE.Mesh
let projectionArrow: THREE.ArrowHelper
let projectionDashedLine: THREE.Line
let rightAngleSquare: THREE.LineLoop

let qArrows: THREE.ArrowHelper[] = []
let rightOriginSphere: THREE.Mesh

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function checkWebGL(): boolean {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  return !!gl
}

function createCommonSceneElements(scene: THREE.Scene): THREE.Mesh {
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(5, 10, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  const axes = new THREE.AxesHelper(2.5)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.5
  scene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.07, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  const originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)
  return originSphere
}

function initLeftScene() {
  const container = leftCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  leftScene = new THREE.Scene()
  leftScene.background = null

  leftCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  leftCamera.position.set(4, 3, 6)
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

  leftOriginSphere = createCommonSceneElements(leftScene)

  for (let i = 0; i < 3; i++) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1, COLOR_A, 0.2, 0.12
    )
    leftScene.add(arrow)
    aArrows.push(arrow)
  }

  projectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_PROJECTION, 0.22, 0.14
  )
  const projLineMat = projectionArrow.line.material as THREE.LineBasicMaterial
  projLineMat.transparent = true
  projLineMat.opacity = 0.65
  const projConeMat = projectionArrow.cone.material as THREE.MeshBasicMaterial
  projConeMat.transparent = true
  projConeMat.opacity = 0.65
  projectionArrow.visible = false
  leftScene.add(projectionArrow)

  const dashGeom = new THREE.BufferGeometry()
  dashGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const dashMat = new THREE.LineDashedMaterial({
    color: COLOR_DASHED,
    dashSize: 0.15,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.9
  })
  projectionDashedLine = new THREE.Line(dashGeom, dashMat)
  projectionDashedLine.visible = false
  leftScene.add(projectionDashedLine)

  const sqGeom = new THREE.BufferGeometry()
  sqGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3))
  const sqMat = new THREE.LineBasicMaterial({
    color: COLOR_SQUARE,
    transparent: true,
    opacity: 0.75
  })
  rightAngleSquare = new THREE.LineLoop(sqGeom, sqMat)
  rightAngleSquare.visible = false
  leftScene.add(rightAngleSquare)
}

function initRightScene() {
  const container = rightCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  rightScene = new THREE.Scene()
  rightScene.background = null

  rightCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  rightCamera.position.set(4, 3, 6)
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

  rightOriginSphere = createCommonSceneElements(rightScene)

  for (let i = 0; i < 3; i++) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1, Q_COLORS[i], 0.22, 0.14
    )
    rightScene.add(arrow)
    qArrows.push(arrow)
  }
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

function setArrowOpacity(arrow: THREE.ArrowHelper, opacity: number) {
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  lineMat.transparent = true
  coneMat.transparent = true
  lineMat.opacity = opacity
  coneMat.opacity = opacity
}

function setArrowHeadSize(arrow: THREE.ArrowHelper, vec: THREE.Vector3, scale: number) {
  const len = vec.length()
  if (len > 1e-4) {
    const headLen = Math.min(0.25 * scale, Math.max(0.05, len * 0.3 * scale))
    const headWid = Math.min(0.12 * scale, Math.max(0.03, len * 0.2 * scale))
    arrow.setLength(len, headLen, headWid)
  }
}

function updateScene() {
  if (!leftScene || !rightScene) return
  const A = animatedMatrix.value
  const Qm = Q.value
  const Rm = R.value
  const sel = selectedR.value

  const aCols = [
    new THREE.Vector3(A[0][0], A[1][0], A[2][0]),
    new THREE.Vector3(A[0][1], A[1][1], A[2][1]),
    new THREE.Vector3(A[0][2], A[1][2], A[2][2])
  ]
  for (let i = 0; i < 3; i++) {
    setArrow(aArrows[i], aCols[i])
    if (sel && sel.j === i) {
      setArrowColor(aArrows[i], COLOR_HIGHLIGHT)
      setArrowOpacity(aArrows[i], 1.0)
      setArrowHeadSize(aArrows[i], aCols[i], 1.3)
    } else {
      setArrowColor(aArrows[i], COLOR_A)
      setArrowOpacity(aArrows[i], sel ? 0.45 : 1.0)
      setArrowHeadSize(aArrows[i], aCols[i], 1.0)
    }
  }

  const qCols = [
    new THREE.Vector3(Qm[0][0], Qm[1][0], Qm[2][0]),
    new THREE.Vector3(Qm[0][1], Qm[1][1], Qm[2][1]),
    new THREE.Vector3(Qm[0][2], Qm[1][2], Qm[2][2])
  ]
  for (let i = 0; i < 3; i++) {
    setArrow(qArrows[i], qCols[i])
    setArrowColor(qArrows[i], Q_COLORS[i])
    if (sel && sel.i === i) {
      setArrowOpacity(qArrows[i], 1.0)
      setArrowHeadSize(qArrows[i], qCols[i], 1.4)
    } else {
      setArrowOpacity(qArrows[i], sel ? 0.4 : 1.0)
      setArrowHeadSize(qArrows[i], qCols[i], 1.0)
    }
  }

  if (sel) {
    const i = sel.i, j = sel.j
    const a_j = aCols[j]
    const q_i = qCols[i]
    const rij = Rm[i][j]

    const proj = q_i.clone().multiplyScalar(rij)

    setArrow(projectionArrow, proj)
    setArrowColor(projectionArrow, COLOR_PROJECTION)
    const projLineMat = projectionArrow.line.material as THREE.LineBasicMaterial
    projLineMat.transparent = true
    projLineMat.opacity = 0.65
    const projConeMat = projectionArrow.cone.material as THREE.MeshBasicMaterial
    projConeMat.transparent = true
    projConeMat.opacity = 0.65
    projectionArrow.visible = proj.lengthSq() > 1e-8

    const perp = a_j.clone().sub(proj)
    const dashPos = projectionDashedLine.geometry.attributes.position as THREE.BufferAttribute
    dashPos.setXYZ(0, a_j.x, a_j.y, a_j.z)
    dashPos.setXYZ(1, proj.x, proj.y, proj.z)
    dashPos.needsUpdate = true
    projectionDashedLine.computeLineDistances()
    projectionDashedLine.visible = perp.lengthSq() > 1e-8

    const sqSize = 0.25
    let dirQi: THREE.Vector3
    if (proj.lengthSq() > 1e-10) {

      dirQi = proj.clone().multiplyScalar(-1).normalize()
    } else {

      dirQi = q_i.lengthSq() > 1e-10
        ? q_i.clone().normalize()
        : new THREE.Vector3(1, 0, 0)
    }
    let dirPerp: THREE.Vector3
    if (perp.lengthSq() > 1e-10) {
      dirPerp = perp.clone().normalize()
    } else {

      dirPerp = Math.abs(dirQi.y) < 0.9
        ? new THREE.Vector3(-dirQi.z, 0, dirQi.x).normalize()
        : new THREE.Vector3(1, 0, 0)
    }
    const p0 = proj.clone()
    const p1 = proj.clone().add(dirQi.clone().multiplyScalar(sqSize))
    const p2 = p1.clone().add(dirPerp.clone().multiplyScalar(sqSize))
    const p3 = proj.clone().add(dirPerp.clone().multiplyScalar(sqSize))
    const sqPos = rightAngleSquare.geometry.attributes.position as THREE.BufferAttribute
    sqPos.setXYZ(0, p0.x, p0.y, p0.z)
    sqPos.setXYZ(1, p1.x, p1.y, p1.z)
    sqPos.setXYZ(2, p2.x, p2.y, p2.z)
    sqPos.setXYZ(3, p3.x, p3.y, p3.z)
    sqPos.needsUpdate = true
    rightAngleSquare.visible = perp.lengthSq() > 1e-8 && proj.lengthSq() > 1e-8
  } else {
    projectionArrow.visible = false
    projectionDashedLine.visible = false
    rightAngleSquare.visible = false
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
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
      updateScene()
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('QRDecompositionDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (leftCanvasContainer.value) resizeObserver.observe(leftCanvasContainer.value)
  if (rightCanvasContainer.value) resizeObserver.observe(rightCanvasContainer.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  cancelAnimationFrame(animFrame)
  resizeObserver?.disconnect()
  leftControls?.dispose()
  rightControls?.dispose()
  leftRenderer?.dispose()
  rightRenderer?.dispose()
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
  gap: var(--space-3);
  margin: var(--space-2) 0;
  align-items: stretch;
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
  height: 380px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.equals-badge {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-2);
  gap: var(--space-1);
  min-width: 56px;
}

.equals-matrix {
  font-family: var(--font-mono);
  font-size: 1.5em;
  font-weight: 700;
  color: var(--color-accent-strong);
  letter-spacing: 0.02em;
}

.equals-symbol {
  font-family: var(--font-mono);
  font-size: 1.8em;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
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

.r-matrix-section {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.r-matrix-section .block-title {
  color: var(--color-accent-strong);
  font-family: var(--font-mono);
}

.r-matrix-table {
  border-collapse: separate;
  border-spacing: 4px;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  margin: var(--space-1) 0;
}

.r-matrix-table td {
  width: 6.5em;
  height: 4em;
  padding: 0.4em 0.5em;
  text-align: center;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  cursor: default;
  transition: all 0.15s ease;
  position: relative;
  vertical-align: middle;
}

.r-matrix-table td.r-upper,
.r-matrix-table td.r-diagonal {
  cursor: pointer;
}

.r-matrix-table td.r-upper:hover,
.r-matrix-table td.r-diagonal:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  transform: translateY(-1px);
}

.r-matrix-table td.r-diagonal {
  background: rgba(251, 191, 36, 0.18);
  border-color: rgba(251, 191, 36, 0.55);
  color: #b45309;
}

.r-matrix-table td.r-diagonal:hover {
  background: rgba(251, 191, 36, 0.32);
  border-color: #fbbf24;
}

.r-matrix-table td.r-upper {
  background: var(--bg-content);
  color: var(--text-primary);
}

.r-matrix-table td.r-lower {
  background: rgba(156, 163, 175, 0.12);
  border-color: rgba(156, 163, 175, 0.3);
  color: var(--text-tertiary);
  cursor: default;
}

.r-matrix-table td.r-selected {
  border: 2.5px solid #fbbf24 !important;
  background: rgba(251, 191, 36, 0.32) !important;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.18);
  color: #92400e;
}

.r-matrix-table td.r-selected.r-upper {
  background: rgba(251, 191, 36, 0.25) !important;
  color: #92400e;
}

.r-value {
  display: block;
  font-size: 1em;
  font-weight: 700;
  font-family: var(--font-mono);
}

.r-hint {
  display: block;
  font-size: 0.7em;
  color: var(--text-tertiary);
  font-weight: 500;
  margin-top: 2px;
  font-family: var(--font-mono);
}

.r-matrix-table td.r-selected .r-hint {
  color: #b45309;
}

.r-selection-info {
  margin: 0;
  padding: 0.5em 0.9em;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
}

.r-selection-info strong {
  color: var(--color-accent-strong);
  font-weight: 700;
  font-size: 1.05em;
}

.r-selection-info.placeholder {
  color: var(--text-tertiary);
  font-style: italic;
  background: transparent;
  border: 1px dashed var(--border-color);
}

.clear-selection {
  margin-left: auto;
  padding: 0.25em 0.9em;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  transition: all 0.15s ease;
}

.clear-selection:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
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
  padding: 0.3em 0.7em;
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

.output-row .value.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  line-height: 1.4;
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

.preset-buttons button:focus-visible,
.clear-selection:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.r-matrix-table td.r-upper:focus-visible,
.r-matrix-table td.r-diagonal:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.sliders-block label input[type="range"]:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
  border-radius: var(--radius-full);
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
  padding: 0 var(--space-2);
}

@media (max-width: 720px) {
  .dual-canvas {
    flex-direction: column;
  }

  .equals-badge {
    flex-direction: row;
    padding: var(--space-1) 0;
  }

  .demo-canvas.dual {
    height: 320px;
  }

  .r-matrix-table td {
    width: 5em;
    height: 3.5em;
    padding: 0.3em;
  }

  .r-value {
    font-size: 0.9em;
  }

  .r-hint {
    font-size: 0.65em;
  }

  .demo-output {
    grid-template-columns: 1fr;
  }
}
</style>
