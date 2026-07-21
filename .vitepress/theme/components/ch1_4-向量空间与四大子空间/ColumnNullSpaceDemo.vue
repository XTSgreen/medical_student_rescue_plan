<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'full' }" @click="setPreset('full')">满秩 r=3</button>
      <button :class="{ active: preset === 'rank2' }" @click="setPreset('rank2')">秩 r=2</button>
      <button :class="{ active: preset === 'rank1' }" @click="setPreset('rank1')">秩 r=1</button>
    </div>

    <div class="dual-canvas">
      <div class="canvas-wrap">
        <p class="canvas-label">列空间视角 C(A) ⊂ ℝ³（"像空间"）</p>
        <div ref="leftCanvasContainer" class="demo-canvas dual"></div>
      </div>
      <div class="canvas-wrap">
        <p class="canvas-label">零空间视角 N(A) ⊂ ℝ³（"压缩内核"）</p>
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
        <legend>目标向量 b（判定 b ∈ C(A)）</legend>
        <label v-for="(name, idx) in ['x','y','z']" :key="idx">
          b<sub>{{ name }}</sub>
          <input type="range" min="-2" max="2" step="0.1"
                 :value="b[idx]"
                 @input="updateB(idx, parseFloat(($event.target as HTMLInputElement).value))" />
          <span>{{ b[idx].toFixed(2) }}</span>
        </label>
      </fieldset>
    </div>

    <div class="demo-output">
      <div class="output-row" :class="rankClass">
        <span class="label">rank(A) = r</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">nullity = 3 − r</span>
        <span class="value">{{ nullity }}</span>
      </div>
      <div class="output-row" :class="{ highlight: bInColSpace, danger: !bInColSpace }">
        <span class="label">b ∈ C(A)</span>
        <span class="value">{{ bInColSpace ? '是 → 有解 ✅' : '否 → 无解 ❌' }}</span>
      </div>
      <div class="output-row">
        <span class="label">rank([A|b])</span>
        <span class="value">{{ rankAb }}</span>
      </div>
      <div class="output-row" v-if="nullity > 0">
        <span class="label">N(A) 基础解系</span>
        <span class="value matrix-display">{{ basisDisplay }}</span>
      </div>
      <div class="output-row" v-else>
        <span class="label">N(A) 基础解系</span>
        <span class="value matrix-display">∅（仅零向量）</span>
      </div>
    </div>

    <table class="dim-table">
      <thead>
        <tr>
          <th>视角</th>
          <th>子空间</th>
          <th>维数</th>
          <th>几何形态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>左（ℝᵐ）</td>
          <td>列空间 C(A)</td>
          <td>{{ rank }}</td>
          <td>{{ colSpaceGeometry }}</td>
        </tr>
        <tr>
          <td>右（ℝⁿ）</td>
          <td>零空间 N(A)</td>
          <td>{{ nullity }}</td>
          <td>{{ nullSpaceGeometry }}</td>
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
    title: '列空间与零空间 · 双视角交互演示'
  }
)

const COLOR_RED = 0xef4444
const COLOR_BLUE = 0x3b82f6
const COLOR_GREEN = 0x10b981
const COLOR_B = 0x8b5cf6
const COLOR_COL_SPACE = 0xef4444
const COLOR_NULL_SPACE = 0x10b981
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_CUBE = 0x9ca3af
const COLOR_POINT_GRAY = 0xd1d5db
const COLOR_POINT_RED = 0xef4444

const matrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
])
const animatedMatrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
])
const b = ref<number[]>([1, 1, 1])

type PresetKey = 'full' | 'rank2' | 'rank1' | 'custom'
const preset = ref<PresetKey>('full')

function setPreset(p: PresetKey) {
  preset.value = p
  let target: number[][]
  let targetB: number[]
  switch (p) {
    case 'full':
      target = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      targetB = [1, 1, 1]
      break
    case 'rank2':

      target = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      targetB = [1, 1, 0]
      break
    case 'rank1':

      target = [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
      targetB = [1, 0, 0]
      break
    default:
      return
  }
  matrix.value = target.map(r => [...r])
  b.value = [...targetB]
  animateToMatrix(target)
}

function updateMatrix(row: number, col: number, value: number) {
  const newM = matrix.value.map(r => [...r])
  newM[row][col] = value
  matrix.value = newM
  preset.value = 'custom'
  animateToMatrix(newM)
}

function updateB(idx: number, value: number) {
  const newB = [...b.value]
  newB[idx] = value
  b.value = newB
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

function rankOfMatrix(m: number[][]): number {
  const a = m.map(r => [...r])
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

function nullSpaceOf(m: number[][]): { rank: number, basis: number[][] } {
  const a = m.map(r => [...r])
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
  const pivotCols = new Set(pivots.map(p => p.col))
  const freeCols: number[] = []
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.has(c)) freeCols.push(c)
  }

  for (const p of pivots) {
    const pv = a[p.row][p.col]
    if (Math.abs(pv) > 1e-9) {
      for (let k = 0; k < cols; k++) a[p.row][k] /= pv
    }
  }

  const basis: number[][] = []
  for (const fc of freeCols) {
    const v = new Array(cols).fill(0)
    v[fc] = 1
    for (const p of pivots) {
      v[p.col] = -a[p.row][fc]
    }
    basis.push(v)
  }

  return { rank, basis }
}

const rank = computed(() => rankOfMatrix(animatedMatrix.value))
const nullity = computed(() => 3 - rank.value)
const nullSpaceResult = computed(() => nullSpaceOf(animatedMatrix.value))
const basis = computed(() => nullSpaceResult.value.basis)

const rankAb = computed(() => {
  const aug = animatedMatrix.value.map((row, i) => [...row, b.value[i]])
  return rankOfMatrix(aug)
})
const bInColSpace = computed(() => rankAb.value === rank.value)

const rankClass = computed(() => ({
  rank3: rank.value === 3,
  rank2: rank.value === 2,
  rank1: rank.value === 1,
  rank0: rank.value === 0
}))

const basisDisplay = computed(() => {
  if (basis.value.length === 0) return '∅（仅零向量）'
  return basis.value
    .map(v => `(${v.map(x => x.toFixed(2)).join(', ')})`)
    .join(', ')
})

const colSpaceGeometry = computed(() => {
  switch (rank.value) {
    case 0: return '仅原点'
    case 1: return '过原点直线'
    case 2: return '过原点平面'
    case 3: return '整个 ℝ³'
    default: return ''
  }
})

const nullSpaceGeometry = computed(() => {
  switch (rank.value) {
    case 3: return '仅原点 {0}'
    case 2: return '过原点直线（1 维）'
    case 1: return '过原点平面（2 维）'
    case 0: return '整个 ℝ³'
    default: return ''
  }
})

const tipText = computed(() => {
  if (bInColSpace.value) {
    return `b ∈ C(A)：方程 Ax = b 有解。rank(A) = rank([A|b]) = ${rank.value}。左视角展示像空间 C(A)，右视角展示被压缩到原点的零空间 N(A)。`
  } else {
    return `b ∉ C(A)：方程 Ax = b 无解。rank(A) = ${rank.value} < rank([A|b]) = ${rankAb.value}。调整 b 使其落入 C(A) 即可求解。`
  }
})

const leftCanvasContainer = ref<HTMLElement | null>(null)
const rightCanvasContainer = ref<HTMLElement | null>(null)

let leftScene: THREE.Scene, rightScene: THREE.Scene
let leftCamera: THREE.PerspectiveCamera, rightCamera: THREE.PerspectiveCamera
let leftRenderer: THREE.WebGLRenderer, rightRenderer: THREE.WebGLRenderer
let leftControls: OrbitControls, rightControls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let colArrows: THREE.ArrowHelper[] = []
let colSpacePlane: THREE.Mesh
let colSpaceLine: THREE.Line
let colSpaceBox: THREE.LineSegments
let colOriginSphere: THREE.Mesh
let bArrow: THREE.ArrowHelper
let bSphere: THREE.Mesh
let imageCube: THREE.LineSegments

let nullOriginSphere: THREE.Mesh
let inputCube: THREE.LineSegments
let nullLine: THREE.Line
let nullPlane: THREE.Mesh
let pointCloud: THREE.Points
let pointPositions: Float32Array
const POINT_COUNT = 125

const CORNERS: number[][] = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
]

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function checkWebGL(): boolean {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  return !!gl
}

function initLeftScene() {
  const container = leftCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  leftScene = new THREE.Scene()
  leftScene.background = null

  leftCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  leftCamera.position.set(3.5, 3.5, 5)
  leftCamera.lookAt(0.5, 0.5, 0.5)

  try {
    leftRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '⚠ 左侧 WebGL 初始化失败：' + (e as Error).message
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
  leftControls.target.set(0.5, 0.5, 0.5)

  leftScene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  leftScene.add(dir)

  const grid = new THREE.GridHelper(8, 8, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  leftScene.add(grid)

  const axes = new THREE.AxesHelper(3)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  leftScene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  colOriginSphere = new THREE.Mesh(origGeom, origMat)
  leftScene.add(colOriginSphere)

  const planeGeom = new THREE.PlaneGeometry(8, 8)
  const planeMat = new THREE.MeshPhongMaterial({
    color: COLOR_COL_SPACE,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    shininess: 30
  })
  colSpacePlane = new THREE.Mesh(planeGeom, planeMat)
  colSpacePlane.visible = false
  leftScene.add(colSpacePlane)

  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const lineMat = new THREE.LineBasicMaterial({ color: COLOR_COL_SPACE, linewidth: 4 })
  colSpaceLine = new THREE.Line(lineGeom, lineMat)
  colSpaceLine.visible = false
  leftScene.add(colSpaceLine)

  const boxGeom = new THREE.BoxGeometry(4, 4, 4)
  const boxEdges = new THREE.EdgesGeometry(boxGeom)
  const boxMat = new THREE.LineBasicMaterial({
    color: COLOR_COL_SPACE,
    transparent: true,
    opacity: 0.6
  })
  colSpaceBox = new THREE.LineSegments(boxEdges, boxMat)
  colSpaceBox.visible = false
  leftScene.add(colSpaceBox)

  const colColors = [COLOR_RED, COLOR_BLUE, COLOR_GREEN]
  for (let i = 0; i < 3; i++) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1, colColors[i], 0.2, 0.12
    )
    leftScene.add(arrow)
    colArrows.push(arrow)
  }

  bArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(0, 0, 0),
    Math.sqrt(3), COLOR_B, 0.25, 0.15
  )
  leftScene.add(bArrow)

  const bSphereGeom = new THREE.SphereGeometry(0.12, 20, 20)
  const bSphereMat = new THREE.MeshBasicMaterial({ color: COLOR_B })
  bSphere = new THREE.Mesh(bSphereGeom, bSphereMat)
  leftScene.add(bSphere)

  const imgGeom = new THREE.BufferGeometry()
  imgGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(EDGES.length * 2 * 3), 3)
  )
  const imgMat = new THREE.LineBasicMaterial({
    color: COLOR_COL_SPACE,
    transparent: true,
    opacity: 0.8
  })
  imageCube = new THREE.LineSegments(imgGeom, imgMat)
  leftScene.add(imageCube)
}

function initRightScene() {
  const container = rightCanvasContainer.value!
  const width = container.clientWidth || 400
  const height = container.clientHeight || 350

  rightScene = new THREE.Scene()
  rightScene.background = null

  rightCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  rightCamera.position.set(3.5, 3.5, 5)
  rightCamera.lookAt(0, 0, 0)

  try {
    rightRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '⚠ 右侧 WebGL 初始化失败：' + (e as Error).message
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

  const grid = new THREE.GridHelper(8, 8, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  rightScene.add(grid)

  const axes = new THREE.AxesHelper(3)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  rightScene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  nullOriginSphere = new THREE.Mesh(origGeom, origMat)
  rightScene.add(nullOriginSphere)

  const cubeCorners = CORNERS.map(([x, y, z]) =>
    new THREE.Vector3(x * 4 - 2, y * 4 - 2, z * 4 - 2)
  )
  const cubeEdgePts: THREE.Vector3[] = []
  for (const [a, b] of EDGES) {
    cubeEdgePts.push(cubeCorners[a], cubeCorners[b])
  }
  const cubeGeom = new THREE.BufferGeometry().setFromPoints(cubeEdgePts)
  const cubeMat = new THREE.LineBasicMaterial({
    color: COLOR_CUBE,
    transparent: true,
    opacity: 0.5
  })
  inputCube = new THREE.LineSegments(cubeGeom, cubeMat)
  rightScene.add(inputCube)

  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const lineMat = new THREE.LineBasicMaterial({ color: COLOR_NULL_SPACE, linewidth: 4 })
  nullLine = new THREE.Line(lineGeom, lineMat)
  nullLine.visible = false
  rightScene.add(nullLine)

  const planeGeom = new THREE.PlaneGeometry(6, 6)
  const planeMat = new THREE.MeshPhongMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    shininess: 30
  })
  nullPlane = new THREE.Mesh(planeGeom, planeMat)
  nullPlane.visible = false
  rightScene.add(nullPlane)

  pointPositions = new Float32Array(POINT_COUNT * 3)
  const pointColors = new Float32Array(POINT_COUNT * 3)
  let idx = 0
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 5; k++) {
        pointPositions[idx * 3] = i - 2
        pointPositions[idx * 3 + 1] = j - 2
        pointPositions[idx * 3 + 2] = k - 2
        pointColors[idx * 3] = 0.82
        pointColors[idx * 3 + 1] = 0.85
        pointColors[idx * 3 + 2] = 0.86
        idx++
      }
    }
  }
  const ptGeom = new THREE.BufferGeometry()
  ptGeom.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
  ptGeom.setAttribute('color', new THREE.BufferAttribute(pointColors, 3))
  const ptMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    sizeAttenuation: true
  })
  pointCloud = new THREE.Points(ptGeom, ptMat)
  rightScene.add(pointCloud)
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

function transformCorner(m: number[][], x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z
  )
}

function updateScene() {
  if (!leftScene || !rightScene) return
  const m = animatedMatrix.value
  const r = rank.value
  const bs = basis.value

  const col1 = new THREE.Vector3(m[0][0], m[1][0], m[2][0])
  const col2 = new THREE.Vector3(m[0][1], m[1][1], m[2][1])
  const col3 = new THREE.Vector3(m[0][2], m[1][2], m[2][2])
  setArrow(colArrows[0], col1)
  setArrow(colArrows[1], col2)
  setArrow(colArrows[2], col3)
  setArrowColor(colArrows[0], COLOR_RED)
  setArrowColor(colArrows[1], COLOR_BLUE)
  setArrowColor(colArrows[2], COLOR_GREEN)

  colSpacePlane.visible = false
  colSpaceLine.visible = false
  colSpaceBox.visible = false
  if (r === 3) {
    colSpaceBox.visible = true
  } else if (r === 2) {

    const cols = [col1, col2, col3]
    let v1: THREE.Vector3 | null = null
    let v2: THREE.Vector3 | null = null
    for (const c of cols) {
      if (c.lengthSq() > 1e-9) {
        if (!v1) v1 = c
        else if (!v2 && new THREE.Vector3().crossVectors(v1, c).lengthSq() > 1e-9) v2 = c
      }
    }
    if (v1 && v2) {
      const normal = new THREE.Vector3().crossVectors(v1, v2).normalize()
      colSpacePlane.position.set(0, 0, 0)
      colSpacePlane.lookAt(normal)
      colSpacePlane.visible = true
    }
  } else if (r === 1) {
    const dir =
      col1.lengthSq() > 1e-9 ? col1 :
      (col2.lengthSq() > 1e-9 ? col2 : col3)
    if (dir.lengthSq() > 1e-9) {
      const dirN = dir.clone().normalize()
      const p1 = dirN.clone().multiplyScalar(-4)
      const p2 = dirN.clone().multiplyScalar(4)
      const pos = colSpaceLine.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, p1.x, p1.y, p1.z)
      pos.setXYZ(1, p2.x, p2.y, p2.z)
      pos.needsUpdate = true
      colSpaceLine.visible = true
    }
  }

  const bVec = new THREE.Vector3(b.value[0], b.value[1], b.value[2])
  setArrow(bArrow, bVec)
  setArrowColor(bArrow, COLOR_B)
  bSphere.position.copy(bVec)
  bSphere.visible = bVec.lengthSq() > 1e-9

  const imgCorners = CORNERS.map(([x, y, z]) => transformCorner(m, x, y, z))
  const imgPos = imageCube.geometry.attributes.position as THREE.BufferAttribute
  let pidx = 0
  for (const [a, b] of EDGES) {
    imgPos.setXYZ(pidx++, imgCorners[a].x, imgCorners[a].y, imgCorners[a].z)
    imgPos.setXYZ(pidx++, imgCorners[b].x, imgCorners[b].y, imgCorners[b].z)
  }
  imgPos.needsUpdate = true

  nullLine.visible = false
  nullPlane.visible = false
  if (r === 2 && bs.length >= 1) {

    const dir = new THREE.Vector3(bs[0][0], bs[0][1], bs[0][2])
    if (dir.lengthSq() > 1e-9) {
      const dirN = dir.clone().normalize()
      const p1 = dirN.clone().multiplyScalar(-3)
      const p2 = dirN.clone().multiplyScalar(3)
      const pos = nullLine.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, p1.x, p1.y, p1.z)
      pos.setXYZ(1, p2.x, p2.y, p2.z)
      pos.needsUpdate = true
      nullLine.visible = true
    }
  } else if (r === 1 && bs.length >= 2) {

    const v1 = new THREE.Vector3(bs[0][0], bs[0][1], bs[0][2])
    const v2 = new THREE.Vector3(bs[1][0], bs[1][1], bs[1][2])
    if (v1.lengthSq() > 1e-9 && v2.lengthSq() > 1e-9) {
      const normal = new THREE.Vector3().crossVectors(v1, v2)
      if (normal.lengthSq() > 1e-9) {
        normal.normalize()
        nullPlane.position.set(0, 0, 0)
        nullPlane.lookAt(normal)
        nullPlane.visible = true
      }
    }
  }

  const colorAttr = pointCloud.geometry.attributes.color as THREE.BufferAttribute
  const grayR = 0.82, grayG = 0.85, grayB = 0.86
  const redR = 0.93, redG = 0.27, redB = 0.27
  for (let i = 0; i < POINT_COUNT; i++) {
    const x = pointPositions[i * 3]
    const y = pointPositions[i * 3 + 1]
    const z = pointPositions[i * 3 + 2]
    const ax = m[0][0] * x + m[0][1] * y + m[0][2] * z
    const ay = m[1][0] * x + m[1][1] * y + m[1][2] * z
    const az = m[2][0] * x + m[2][1] * y + m[2][2] * z
    const norm = Math.sqrt(ax * ax + ay * ay + az * az)
    if (norm < 0.05) {
      colorAttr.setXYZ(i, redR, redG, redB)
    } else {
      colorAttr.setXYZ(i, grayR, grayG, grayB)
    }
  }
  colorAttr.needsUpdate = true
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
      initStatus.value = '⚠ 当前浏览器不支持 WebGL，无法渲染交互演示。'
      initStatusType.value = 'warning'
      const msg = '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">⚠ 当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
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
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('ColumnNullSpaceDemo init error:', e)
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
  height: 350px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.output-row .value.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
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

.dim-table td:nth-child(4) {
  color: var(--text-secondary);
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
</style>
