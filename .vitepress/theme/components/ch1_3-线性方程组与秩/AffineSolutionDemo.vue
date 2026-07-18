<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'unique' }" @click="setPreset('unique')">唯一解</button>
      <button :class="{ active: preset === 'infinite' }" @click="setPreset('infinite')">无穷多解</button>
      <button :class="{ active: preset === 'none' }" @click="setPreset('none')">无解</button>
    </div>

    <div class="dual-matrix-editor">
      <div class="matrix-block">
        <p class="block-title">矩阵 A</p>
        <div class="sliders-block">
          <label v-for="(name, idx) in ['a','b','c','d','e','f','g','h','i']" :key="idx">
            {{ name }}
            <input type="range" min="-2" max="2" step="0.1"
                   :value="matrixA[Math.floor(idx/3)][idx%3]"
                   @input="updateA(Math.floor(idx/3), idx%3, parseFloat(($event.target as HTMLInputElement).value))" />
            <span>{{ matrixA[Math.floor(idx/3)][idx%3].toFixed(2) }}</span>
          </label>
        </div>
      </div>
      <div class="matrix-block">
        <p class="block-title">向量 b</p>
        <div class="sliders-block">
          <label v-for="(name, idx) in ['b₁','b₂','b₃']" :key="idx">
            {{ name }}
            <input type="range" min="-3" max="3" step="0.1" v-model.number="vectorB[idx]" />
            <span>{{ vectorB[idx].toFixed(2) }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="demo-controls" v-if="consistent && nullity > 0">
      <fieldset>
        <legend>自由变量系数（控制零空间偏移 x_h）</legend>
        <label v-if="nullity >= 1">c₁ <input type="range" min="-3" max="3" step="0.1" v-model.number="c1" /><span>{{ c1.toFixed(2) }}</span></label>
        <label v-if="nullity >= 2">c₂ <input type="range" min="-3" max="3" step="0.1" v-model.number="c2" /><span>{{ c2.toFixed(2) }}</span></label>
      </fieldset>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">rank(A)</span>
        <span class="value">{{ rankA }}</span>
      </div>
      <div class="output-row">
        <span class="label">rank([A|b])</span>
        <span class="value">{{ rankAug }}</span>
      </div>
      <div class="output-row" :class="{ highlight: consistent, danger: !consistent }">
        <span class="label">相容性</span>
        <span class="value">{{ consistent ? '✓ 相容（有解）' : '✗ 不相容（无解）' }}</span>
      </div>
      <div class="output-row" v-if="consistent">
        <span class="label">特解 x_p</span>
        <span class="value">({{ particular.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row" v-if="consistent && nullity > 0">
        <span class="label">零空间基础解系</span>
        <span class="value matrix-display">{{ basisDisplay }}</span>
      </div>
      <div class="output-row" v-if="consistent && nullity > 0">
        <span class="label">通解 x = x_p + x_h</span>
        <span class="value">({{ generalSolution.map(v => v.toFixed(2)).join(', ') }})</span>
      </div>
      <div class="output-row" v-if="consistent && nullity > 0" :class="{ highlight: true }">
        <span class="label">验证 A·x = b</span>
        <span class="value">({{ axCheck.map(v => v.toFixed(2)).join(', ') }}) = ({{ vectorB.map(v => v.toFixed(2)).join(', ') }}) ✓</span>
      </div>
      <div class="output-row" v-if="consistent && nullity === 0">
        <span class="label">解</span>
        <span class="value">唯一解 x = x_p（零空间仅原点）</span>
      </div>
      <div class="output-row" v-if="!consistent">
        <span class="label">无解原因</span>
        <span class="value">b 不在 A 的列空间中（rank(A) &lt; rank([A|b])）</span>
      </div>
    </div>

    <p class="demo-tip">非齐次方程组通解 = 特解 + 零空间向量。金色箭头是特解 x_p（一个满足 Ax=b 的解），蓝色是零空间 x_h（满足 Ax=0），绿色是通解 x = x_p + x_h。紫色半透明是解集——零空间沿 x_p 平移得到的仿射子空间，不过原点。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '非齐次方程组通解 = 特解 + 零空间（仿射子空间）'
  }
)

// ---------- 响应式状态 ----------
const matrixA = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
])
const vectorB = ref<number[]>([1, 2, 0])
const preset = ref<'unique' | 'infinite' | 'none' | ''>('infinite')
const c1 = ref(1)
const c2 = ref(0)

// ---------- 线性代数计算 ----------
const EPS = 1e-9

// 高斯消元计算 3×3 矩阵的秩
function rank3x3(m: number[][]): number {
  const a = m.map(r => [...r])
  let rank = 0
  let row = 0
  for (let col = 0; col < 3 && row < 3; col++) {
    let pivot = -1
    for (let i = row; i < 3; i++) {
      if (Math.abs(a[i][col]) > EPS) {
        pivot = i
        break
      }
    }
    if (pivot === -1) continue
    if (pivot !== row) [a[row], a[pivot]] = [a[pivot], a[row]]
    for (let i = row + 1; i < 3; i++) {
      const f = a[i][col] / a[row][col]
      for (let j = col; j < 3; j++) {
        a[i][j] -= f * a[row][j]
      }
    }
    rank++
    row++
  }
  return rank
}

// 计算 3×4 增广矩阵 [A|b] 的秩
function rankAugmented(A: number[][], b: number[]): number {
  const aug = A.map((row, i) => [...row, b[i]])
  let rank = 0
  let row = 0
  for (let col = 0; col < 4 && row < 3; col++) {
    let pivot = -1
    for (let i = row; i < 3; i++) {
      if (Math.abs(aug[i][col]) > EPS) {
        pivot = i
        break
      }
    }
    if (pivot === -1) continue
    if (pivot !== row) [aug[row], aug[pivot]] = [aug[pivot], aug[row]]
    for (let i = row + 1; i < 3; i++) {
      const f = aug[i][col] / aug[row][col]
      for (let j = col; j < 4; j++) {
        aug[i][j] -= f * aug[row][j]
      }
    }
    rank++
    row++
  }
  return rank
}

// 化简为行最简形 RREF
function rref(m: number[][]): number[][] {
  const a = m.map(r => [...r])
  const rows = a.length
  const cols = a[0].length
  let row = 0
  for (let col = 0; col < cols && row < rows; col++) {
    let pivot = -1
    for (let i = row; i < rows; i++) {
      if (Math.abs(a[i][col]) > EPS) {
        pivot = i
        break
      }
    }
    if (pivot === -1) continue
    if (pivot !== row) [a[row], a[pivot]] = [a[pivot], a[row]]
    const d = a[row][col]
    for (let j = col; j < cols; j++) a[row][j] /= d
    for (let i = 0; i < rows; i++) {
      if (i === row) continue
      const f = a[i][col]
      for (let j = col; j < cols; j++) {
        a[i][j] -= f * a[row][j]
      }
    }
    row++
  }
  return a
}

// 求特解：将所有自由变量设为 0，解主变量
function particularSolution(A: number[][], b: number[]): number[] | null {
  const aug = A.map((row, i) => [...row, b[i]])
  const r = rref(aug)
  // 检查相容性：是否有全零行但最后一列非零
  for (let i = 0; i < r.length; i++) {
    const allZeroA = r[i].slice(0, 3).every(v => Math.abs(v) < EPS)
    if (allZeroA && Math.abs(r[i][3]) > EPS) return null
  }
  const sol = [0, 0, 0]
  let row = 0
  for (let col = 0; col < 3; col++) {
    if (row < r.length && Math.abs(r[row][col] - 1) < EPS) {
      sol[col] = r[row][3]
      row++
    }
  }
  return sol
}

// 求零空间基础解系
function nullSpace(A: number[][]): { rank: number, basis: number[][] } {
  const r = rref(A.map(row => [...row]))
  const pivotCols: number[] = []
  let row = 0
  for (let col = 0; col < 3; col++) {
    if (row < r.length && Math.abs(r[row][col] - 1) < EPS) {
      pivotCols.push(col)
      row++
    }
  }
  const rank = pivotCols.length
  const freeCols = [0, 1, 2].filter(c => !pivotCols.includes(c))
  const basis: number[][] = []
  for (const freeCol of freeCols) {
    const vec = [0, 0, 0]
    vec[freeCol] = 1
    for (let i = 0; i < pivotCols.length; i++) {
      vec[pivotCols[i]] = -r[i][freeCol]
    }
    basis.push(vec)
  }
  return { rank, basis }
}

// ---------- 计算属性 ----------
const rankA = computed(() => rank3x3(matrixA.value))
const rankAug = computed(() => rankAugmented(matrixA.value, vectorB.value))
const consistent = computed(() => rankA.value === rankAug.value)
const nullity = computed(() => 3 - rankA.value)
const particular = computed(() => {
  if (!consistent.value) return [0, 0, 0]
  return particularSolution(matrixA.value, vectorB.value) ?? [0, 0, 0]
})
const nullSpaceBasis = computed(() => nullSpace(matrixA.value).basis)

const generalSolution = computed(() => {
  if (!consistent.value) return [0, 0, 0]
  const p = particular.value
  const basis = nullSpaceBasis.value
  const xh = [0, 0, 0]
  if (basis.length >= 1) {
    for (let i = 0; i < 3; i++) xh[i] += c1.value * basis[0][i]
  }
  if (basis.length >= 2) {
    for (let i = 0; i < 3; i++) xh[i] += c2.value * basis[1][i]
  }
  return [p[0] + xh[0], p[1] + xh[1], p[2] + xh[2]]
})

const axCheck = computed(() => {
  if (!consistent.value) return [0, 0, 0]
  const x = generalSolution.value
  const A = matrixA.value
  return [
    A[0][0] * x[0] + A[0][1] * x[1] + A[0][2] * x[2],
    A[1][0] * x[0] + A[1][1] * x[1] + A[1][2] * x[2],
    A[2][0] * x[0] + A[2][1] * x[1] + A[2][2] * x[2]
  ]
})

const basisDisplay = computed(() => {
  if (nullSpaceBasis.value.length === 0) return '∅（零空间仅原点）'
  return '[' + nullSpaceBasis.value.map(v => `(${v.map(x => x.toFixed(2)).join(', ')})`).join(', ') + ']'
})

// ---------- 预设 ----------
function setPreset(p: 'unique' | 'infinite' | 'none') {
  preset.value = p
  switch (p) {
    case 'unique':
      matrixA.value = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      vectorB.value = [1, 1, 1]
      break
    case 'infinite':
      matrixA.value = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      vectorB.value = [1, 2, 0]
      break
    case 'none':
      matrixA.value = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      vectorB.value = [1, 2, 3]
      break
  }
  c1.value = 1
  c2.value = 0
}

function updateA(i: number, j: number, v: number) {
  const newA = matrixA.value.map((row, ri) =>
    ri === i ? row.map((x, ci) => (ci === j ? v : x)) : [...row]
  )
  matrixA.value = newA
  preset.value = ''
}

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

// 场景对象
let arrowXp: THREE.ArrowHelper          // 金色：特解 x_p
let arrowXh: THREE.ArrowHelper          // 蓝色：零空间向量 x_h
let arrowX: THREE.ArrowHelper           // 绿色：通解 x = x_p + x_h
let arrowXhFromXp: THREE.ArrowHelper    // 绿色半透明：从 x_p 到 x_p + x_h
let nullSpaceLine: THREE.Line           // 蓝色半透明：零空间直线（过原点）
let nullSpacePlane: THREE.Mesh         // 蓝色半透明：零空间平面（过原点）
let solutionLine: THREE.Line            // 紫色半透明：解集直线（过 x_p）
let solutionPlane: THREE.Mesh           // 紫色半透明：解集平面（过 x_p）
let discretePoints: THREE.Mesh[] = []  // 紫色小球：解集上的离散点阵
let movingTip: THREE.Mesh              // 绿色追踪小球：动画演示首尾相连
let gridHelper: THREE.GridHelper
let axesHelper: THREE.AxesHelper
let originSphere: THREE.Mesh

let animTime = 0 // 动画时间 [0, 2)

// 配色（浅色主题）
const COLOR_XP = 0xf59e0b          // 金/橙：特解
const COLOR_XH = 0x3b82f6          // 蓝：零空间向量
const COLOR_X = 0x10b981           // 绿：通解
const COLOR_NULL_SPACE = 0x3b82f6  // 蓝：零空间（半透明）
const COLOR_SOLUTION = 0xa855f7   // 紫：解集（半透明）
const COLOR_DISCRETE = 0xa855f7    // 紫：离散点
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS = 0x9ca3af

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 创建箭头辅助工具
function makeArrow(color: number, length = 1): THREE.ArrowHelper {
  return new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    length,
    color,
    0.25,
    0.15
  )
}

// 设置箭头从 origin 指向 target
function setArrow(arrow: THREE.ArrowHelper, origin: THREE.Vector3, target: THREE.Vector3) {
  const dir = target.clone().sub(origin)
  const len = dir.length()
  if (len < 1e-4) {
    arrow.visible = false
    return
  }
  arrow.position.copy(origin)
  arrow.setDirection(dir.normalize())
  arrow.setLength(Math.min(len, 20), 0.25, 0.15)
  arrow.visible = true
}

// 设置直线段（用于零空间直线/解集直线）
function setLineSegment(line: THREE.Line, start: THREE.Vector3, end: THREE.Vector3) {
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, start.x, start.y, start.z)
  pos.setXYZ(1, end.x, end.y, end.z)
  pos.needsUpdate = true
  line.visible = true
}

// 设置半透明平面（以 origin 为中心，由 v1、v2 张成，scale 控制大小）
function setPlaneMesh(
  plane: THREE.Mesh,
  origin: THREE.Vector3,
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  scale = 3
) {
  if (v1.lengthSq() < 1e-12 || v2.lengthSq() < 1e-12) {
    plane.visible = false
    return
  }
  const p0 = origin.clone().addScaledVector(v1, -scale).addScaledVector(v2, -scale)
  const p1 = origin.clone().addScaledVector(v1, scale).addScaledVector(v2, -scale)
  const p2 = origin.clone().addScaledVector(v1, scale).addScaledVector(v2, scale)
  const p3 = origin.clone().addScaledVector(v1, -scale).addScaledVector(v2, scale)
  const pos = plane.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, p0.x, p0.y, p0.z)
  pos.setXYZ(1, p1.x, p1.y, p1.z)
  pos.setXYZ(2, p2.x, p2.y, p2.z)
  pos.setXYZ(3, p3.x, p3.y, p3.z)
  pos.needsUpdate = true
  plane.geometry.computeVertexNormals()
  plane.visible = true
}

// ---------- 初始化场景 ----------
function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 420

  // WebGL 检测
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '⚠ 当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">⚠ 当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }

  scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(4, 4, 6)
  camera.lookAt(0, 0, 0)

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = '⚠ WebGL 初始化失败：' + (e as Error).message
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

  // 网格（XY 平面）
  gridHelper = new THREE.GridHelper(10, 10, COLOR_AXIS, COLOR_GRID)
  gridHelper.rotation.x = Math.PI / 2 // 从 XZ 旋转到 XY 平面
  scene.add(gridHelper)

  // 坐标轴
  axesHelper = new THREE.AxesHelper(5)
  const axesMat = axesHelper.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  scene.add(axesHelper)

  // 原点小球
  originSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  )
  scene.add(originSphere)

  // 特解箭头（金色）
  arrowXp = makeArrow(COLOR_XP, 1)
  scene.add(arrowXp)

  // 零空间向量箭头（蓝色）
  arrowXh = makeArrow(COLOR_XH, 1)
  scene.add(arrowXh)

  // 通解箭头（绿色）
  arrowX = makeArrow(COLOR_X, 1)
  scene.add(arrowX)

  // 从 x_p 出发的 x_h 偏移箭头（绿色半透明）
  arrowXhFromXp = makeArrow(COLOR_X, 1)
  const xhFromXpLineMat = arrowXhFromXp.line.material as THREE.LineBasicMaterial
  xhFromXpLineMat.transparent = true
  xhFromXpLineMat.opacity = 0.5
  const xhFromXpConeMat = arrowXhFromXp.cone.material as THREE.MeshBasicMaterial
  xhFromXpConeMat.transparent = true
  xhFromXpConeMat.opacity = 0.5
  scene.add(arrowXhFromXp)

  // 零空间直线（蓝色半透明，过原点）
  const nullLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3()
  ])
  nullSpaceLine = new THREE.Line(nullLineGeom, new THREE.LineBasicMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.4
  }))
  nullSpaceLine.visible = false
  scene.add(nullSpaceLine)

  // 零空间平面（蓝色半透明，过原点）
  const nullPlaneGeom = new THREE.BufferGeometry()
  nullPlaneGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  nullPlaneGeom.setIndex([0, 1, 2, 0, 2, 3])
  nullSpacePlane = new THREE.Mesh(nullPlaneGeom, new THREE.MeshBasicMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  }))
  nullSpacePlane.visible = false
  scene.add(nullSpacePlane)

  // 解集直线（紫色半透明，过 x_p）
  const solLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3()
  ])
  solutionLine = new THREE.Line(solLineGeom, new THREE.LineBasicMaterial({
    color: COLOR_SOLUTION,
    transparent: true,
    opacity: 0.6
  }))
  solutionLine.visible = false
  scene.add(solutionLine)

  // 解集平面（紫色半透明，过 x_p）
  const solPlaneGeom = new THREE.BufferGeometry()
  solPlaneGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  solPlaneGeom.setIndex([0, 1, 2, 0, 2, 3])
  solutionPlane = new THREE.Mesh(solPlaneGeom, new THREE.MeshBasicMaterial({
    color: COLOR_SOLUTION,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  }))
  solutionPlane.visible = false
  scene.add(solutionPlane)

  // 离散点阵（25 个紫色小球，最多 5×5 网格）
  const ptGeom = new THREE.SphereGeometry(0.08, 12, 12)
  const ptMat = new THREE.MeshBasicMaterial({ color: COLOR_DISCRETE })
  for (let i = 0; i < 25; i++) {
    const pt = new THREE.Mesh(ptGeom, ptMat)
    pt.visible = false
    discretePoints.push(pt)
    scene.add(pt)
  }

  // 动画追踪小球（绿色，沿路径 0 → x_p → x_p + x_h → 0 移动）
  movingTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: COLOR_X })
  )
  movingTip.visible = false
  scene.add(movingTip)

  updateScene()
}

// ---------- 更新场景 ----------
function updateScene() {
  if (!scene) return

  // 隐藏所有离散点
  for (const pt of discretePoints) pt.visible = false

  const p = particular.value
  const basis = nullSpaceBasis.value
  const isConsistent = consistent.value
  const nt = nullity.value

  const origin = new THREE.Vector3(0, 0, 0)
  const xp = new THREE.Vector3(p[0], p[1], p[2])

  // 计算 x_h = c1*v1 + c2*v2
  const xh = [0, 0, 0]
  if (basis.length >= 1) {
    for (let i = 0; i < 3; i++) xh[i] += c1.value * basis[0][i]
  }
  if (basis.length >= 2) {
    for (let i = 0; i < 3; i++) xh[i] += c2.value * basis[1][i]
  }
  const xhVec = new THREE.Vector3(xh[0], xh[1], xh[2])
  const xTip = xp.clone().add(xhVec) // 通解 x = x_p + x_h

  if (!isConsistent) {
    // 不相容：仅显示零空间，无解集，无特解箭头
    arrowXp.visible = false
    arrowXh.visible = false
    arrowX.visible = false
    arrowXhFromXp.visible = false
    solutionLine.visible = false
    solutionPlane.visible = false
    movingTip.visible = false

    if (nt === 1 && basis.length >= 1) {
      const v = new THREE.Vector3(basis[0][0], basis[0][1], basis[0][2])
      setLineSegment(nullSpaceLine, v.clone().multiplyScalar(-5), v.clone().multiplyScalar(5))
      nullSpacePlane.visible = false
    } else if (nt === 2 && basis.length >= 2) {
      const v1 = new THREE.Vector3(basis[0][0], basis[0][1], basis[0][2])
      const v2 = new THREE.Vector3(basis[1][0], basis[1][1], basis[1][2])
      nullSpaceLine.visible = false
      setPlaneMesh(nullSpacePlane, origin, v1, v2, 4)
    } else {
      nullSpaceLine.visible = false
      nullSpacePlane.visible = false
    }
    return
  }

  // 相容：显示特解箭头
  setArrow(arrowXp, origin, xp)

  if (nt === 0) {
    // 唯一解：零空间仅原点
    arrowXh.visible = false
    arrowXhFromXp.visible = false
    arrowX.visible = false // 与 x_p 重合
    nullSpaceLine.visible = false
    nullSpacePlane.visible = false
    solutionLine.visible = false
    solutionPlane.visible = false
    movingTip.visible = false
    // 唯一解：在 x_p 处放一个紫色小球
    discretePoints[0].position.copy(xp)
    discretePoints[0].visible = true
    return
  }

  // nt >= 1：显示零空间向量与通解
  setArrow(arrowXh, origin, xhVec)
  setArrow(arrowX, origin, xTip)
  setArrow(arrowXhFromXp, xp, xTip)

  // 零空间与解集可视化
  if (nt === 1) {
    const v = new THREE.Vector3(basis[0][0], basis[0][1], basis[0][2])
    // 零空间：过原点的蓝色直线
    setLineSegment(nullSpaceLine, v.clone().multiplyScalar(-5), v.clone().multiplyScalar(5))
    nullSpacePlane.visible = false
    // 解集：过 x_p 的紫色直线
    setLineSegment(solutionLine, xp.clone().add(v.clone().multiplyScalar(-5)), xp.clone().add(v.clone().multiplyScalar(5)))
    solutionPlane.visible = false
    // 离散点阵：t = -2, -1.5, ..., 2 共 9 个点
    const ts = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]
    for (let i = 0; i < ts.length && i < discretePoints.length; i++) {
      const pt = xp.clone().add(v.clone().multiplyScalar(ts[i]))
      discretePoints[i].position.copy(pt)
      discretePoints[i].visible = true
    }
  } else if (nt === 2) {
    const v1 = new THREE.Vector3(basis[0][0], basis[0][1], basis[0][2])
    const v2 = new THREE.Vector3(basis[1][0], basis[1][1], basis[1][2])
    nullSpaceLine.visible = false
    setPlaneMesh(nullSpacePlane, origin, v1, v2, 4)
    setPlaneMesh(solutionPlane, xp, v1, v2, 4)
    solutionLine.visible = false
    // 5×5 网格离散点
    const ts = [-1.5, -0.75, 0, 0.75, 1.5]
    let idx = 0
    for (const t1 of ts) {
      for (const t2 of ts) {
        if (idx >= discretePoints.length) break
        const pt = xp.clone().add(v1.clone().multiplyScalar(t1)).add(v2.clone().multiplyScalar(t2))
        discretePoints[idx].position.copy(pt)
        discretePoints[idx].visible = true
        idx++
      }
    }
  } else {
    // nt === 3：整个空间都是解集，跳过可视化
    nullSpaceLine.visible = false
    nullSpacePlane.visible = false
    solutionLine.visible = false
    solutionPlane.visible = false
  }
}

// ---------- 动画循环 ----------
function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return
  controls.update()

  // 动画：移动追踪小球 0 → x_p → x_p + x_h → 0 ...
  if (consistent.value && nullity.value > 0) {
    animTime = (animTime + 0.008) % 2
    const p = particular.value
    const basis = nullSpaceBasis.value
    const xh = [0, 0, 0]
    if (basis.length >= 1) {
      for (let i = 0; i < 3; i++) xh[i] += c1.value * basis[0][i]
    }
    if (basis.length >= 2) {
      for (let i = 0; i < 3; i++) xh[i] += c2.value * basis[1][i]
    }
    const xp = new THREE.Vector3(p[0], p[1], p[2])
    const xhVec = new THREE.Vector3(xh[0], xh[1], xh[2])
    const tip = new THREE.Vector3()
    if (animTime < 1) {
      // 阶段 1：从原点生长到 x_p
      tip.copy(xp).multiplyScalar(animTime)
    } else {
      // 阶段 2：从 x_p 平移到 x_p + x_h
      tip.copy(xp).add(xhVec.clone().multiplyScalar(animTime - 1))
    }
    movingTip.position.copy(tip)
    movingTip.visible = true
  } else {
    movingTip.visible = false
  }

  renderer.render(scene, camera)
}

// ---------- resize ----------
function handleResize() {
  if (!canvasContainer.value || !renderer || !camera) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// ---------- 生命周期 ----------
onMounted(() => {
  try {
    initScene()
    if (renderer) animate()
  } catch (e) {
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('AffineSolutionDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()
  // 清理所有几何体与材质
  scene?.traverse(obj => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry?.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) {
        mat.forEach(m => m.dispose())
      } else if (mat) {
        mat.dispose()
      }
    }
  })
  gridHelper?.geometry?.dispose()
  ;(gridHelper?.material as THREE.Material)?.dispose()
  axesHelper?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})

// 监听参数变化
watch([matrixA, vectorB, c1, c2], updateScene, { deep: true })
</script>

<style scoped>
/* 预设按钮组 */
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

/* 双矩阵编辑器 */
.dual-matrix-editor {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  align-items: flex-start;
}

.matrix-block {
  flex: 1 1 280px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.block-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.sliders-block {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  min-width: 60px;
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

/* 自由变量参数面板 */
.demo-controls fieldset {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin: var(--space-3) 0;
}

.demo-controls legend {
  font-weight: 600;
  font-size: var(--fs-sm);
  color: var(--color-accent-strong);
  padding: 0 var(--space-2);
}

.demo-controls fieldset label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0;
  font-weight: 500;
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
  flex: 1;
  min-width: 80px;
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

/* 输出面板 */
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
  padding: 0.2em 0.6em;
  background: var(--bg-content);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  gap: var(--space-2);
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
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-accent-text);
}

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
}

.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

/* 状态指示 */
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

/* 提示文字 */
.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}
</style>
