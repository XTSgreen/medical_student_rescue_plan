<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <!-- 三重视角并排 -->
    <div class="triple-view">
      <div class="view-pane">
        <p class="pane-label">视角 1：行图像（有效方程数）</p>
        <div ref="canvas1" class="demo-canvas small"></div>
      </div>
      <div class="view-pane">
        <p class="pane-label">视角 2：列图像（列张成空间）</p>
        <div ref="canvas2" class="demo-canvas small"></div>
      </div>
      <div class="view-pane">
        <p class="pane-label">视角 3：变换（像空间维度）</p>
        <div ref="canvas3" class="demo-canvas small"></div>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <!-- 判定流程图 -->
    <div class="flowchart">
      <div class="flow-node root" :class="{ current: true }">
        rank(A) = rank([A|b]) ?
      </div>
      <div class="flow-branches">
        <div class="flow-branch no" :class="{ active: !consistent }">
          <span class="branch-label">否</span>
          <div class="flow-node result" :class="{ current: !consistent }">无解</div>
        </div>
        <div class="flow-branch yes" :class="{ active: consistent }">
          <span class="branch-label">是</span>
          <div class="flow-node" :class="{ current: consistent }">rank(A) = n ?</div>
          <div class="flow-subbranches">
            <div class="flow-branch yes" :class="{ active: consistent && uniqueSolution }">
              <span class="branch-label">是</span>
              <div class="flow-node result" :class="{ current: consistent && uniqueSolution }">唯一解</div>
            </div>
            <div class="flow-branch no" :class="{ active: consistent && !uniqueSolution }">
              <span class="branch-label">否</span>
              <div class="flow-node result" :class="{ current: consistent && !uniqueSolution }">无穷多解</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预设 -->
    <div class="preset-buttons">
      <button :class="{ active: preset === 'unique' }" @click="setPreset('unique')">唯一解</button>
      <button :class="{ active: preset === 'infinite' }" @click="setPreset('infinite')">无穷多解</button>
      <button :class="{ active: preset === 'none' }" @click="setPreset('none')">无解</button>
    </div>

    <!-- 矩阵编辑器（2x2 + b 向量） -->
    <div class="dual-matrix-editor">
      <div class="matrix-block">
        <p class="block-title">矩阵 A (2×2)</p>
        <div class="sliders-block">
          <label>a <input type="range" min="-3" max="3" step="0.1" v-model.number="a" /><span>{{ a.toFixed(2) }}</span></label>
          <label>b <input type="range" min="-3" max="3" step="0.1" v-model.number="b" /><span>{{ b.toFixed(2) }}</span></label>
          <label>c <input type="range" min="-3" max="3" step="0.1" v-model.number="c" /><span>{{ c.toFixed(2) }}</span></label>
          <label>d <input type="range" min="-3" max="3" step="0.1" v-model.number="d" /><span>{{ d.toFixed(2) }}</span></label>
        </div>
      </div>
      <div class="matrix-block">
        <p class="block-title">向量 b</p>
        <div class="sliders-block">
          <label>b₁ <input type="range" min="-3" max="3" step="0.1" v-model.number="b1" /><span>{{ b1.toFixed(2) }}</span></label>
          <label>b₂ <input type="range" min="-3" max="3" step="0.1" v-model.number="b2" /><span>{{ b2.toFixed(2) }}</span></label>
        </div>
      </div>
    </div>

    <!-- 输出 -->
    <div class="demo-output">
      <div class="output-row">
        <span class="label">矩阵 A</span>
        <span class="value matrix-display">{{ matrixDisplay }}</span>
      </div>
      <div class="output-row">
        <span class="label">向量 b</span>
        <span class="value matrix-display">[{{ b1.toFixed(2) }}, {{ b2.toFixed(2) }}]</span>
      </div>
      <div class="output-row">
        <span class="label">rank(A)</span>
        <span class="value">{{ rankA }}</span>
      </div>
      <div class="output-row">
        <span class="label">rank([A|b])</span>
        <span class="value">{{ rankAug }}</span>
      </div>
      <div class="output-row">
        <span class="label">n（未知数个数）</span>
        <span class="value">{{ n }}</span>
      </div>
      <div class="output-row" :class="{ highlight: consistent, danger: !consistent }">
        <span class="label">判定结果</span>
        <span class="value">{{ resultText }}</span>
      </div>
      <div class="output-row" v-if="consistent">
        <span class="label">解的个数</span>
        <span class="value">{{ uniqueSolution ? '1（唯一）' : '∞（无穷多）' }}</span>
      </div>
      <div class="output-row" v-if="consistent && uniqueSolution">
        <span class="label">唯一解 (x, y)</span>
        <span class="value matrix-display">({{ solutionX.toFixed(2) }}, {{ solutionY.toFixed(2) }})</span>
      </div>
    </div>

    <p class="demo-tip">三重视角联动展示同一个方程组：行图像看直线相交，列图像看列向量张成，变换视角看像空间维度。流程图根据 rank(A) 与 rank([A|b]) 的关系自动判定解的情况。</p>
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
    title: '秩的判定流程 · 三重视角联动'
  }
)

// ---------- 响应式状态 ----------
const a = ref(2)
const b = ref(1)
const c = ref(1)
const d = ref(-1)
const b1 = ref(3)
const b2 = ref(0)
const preset = ref<'unique' | 'infinite' | 'none' | ''>('unique')

const n = 2 // 未知数个数（2x2 系统）

// ---------- 线性代数计算 ----------
const EPS = 1e-9

// 2×2 矩阵的秩
function rank2x2(m: number[][]): number {
  const am = m.map(r => [...r])
  let rank = 0
  let row = 0
  for (let col = 0; col < 2 && row < 2; col++) {
    let pivot = -1
    for (let i = row; i < 2; i++) {
      if (Math.abs(am[i][col]) > EPS) {
        pivot = i
        break
      }
    }
    if (pivot === -1) continue
    if (pivot !== row) [am[row], am[pivot]] = [am[pivot], am[row]]
    for (let i = row + 1; i < 2; i++) {
      const f = am[i][col] / am[row][col]
      for (let j = col; j < 2; j++) {
        am[i][j] -= f * am[row][j]
      }
    }
    rank++
    row++
  }
  return rank
}

// 2×3 增广矩阵 [A|b] 的秩
function rankAugmented2x2(A: number[][], b: number[]): number {
  const aug = A.map((row, i) => [...row, b[i]])
  let rank = 0
  let row = 0
  for (let col = 0; col < 3 && row < 2; col++) {
    let pivot = -1
    for (let i = row; i < 2; i++) {
      if (Math.abs(aug[i][col]) > EPS) {
        pivot = i
        break
      }
    }
    if (pivot === -1) continue
    if (pivot !== row) [aug[row], aug[pivot]] = [aug[pivot], aug[row]]
    for (let i = row + 1; i < 2; i++) {
      const f = aug[i][col] / aug[row][col]
      for (let j = col; j < 3; j++) {
        aug[i][j] -= f * aug[row][j]
      }
    }
    rank++
    row++
  }
  return rank
}

// ---------- 计算属性 ----------
const matrixArr = computed<number[][]>(() => [
  [a.value, b.value],
  [c.value, d.value]
])
const bVec = computed<number[]>(() => [b1.value, b2.value])

const rankA = computed(() => rank2x2(matrixArr.value))
const rankAug = computed(() => rankAugmented2x2(matrixArr.value, bVec.value))
const consistent = computed(() => rankA.value === rankAug.value)
const uniqueSolution = computed(() => consistent.value && rankA.value === n)

const det = computed(() => a.value * d.value - b.value * c.value)

const resultText = computed(() => {
  if (!consistent.value) return '无解'
  if (uniqueSolution.value) return '唯一解'
  return '∞ 无穷多解'
})

const solutionX = computed(() => {
  if (!uniqueSolution.value) return 0
  // 克莱姆法则：x = (b1*d - b*b2) / det
  return (b1.value * d.value - b.value * b2.value) / det.value
})

const solutionY = computed(() => {
  if (!uniqueSolution.value) return 0
  // y = (a*b2 - b1*c) / det
  return (a.value * b2.value - b1.value * c.value) / det.value
})

const matrixDisplay = computed(() => {
  return `[[${a.value.toFixed(2)}, ${b.value.toFixed(2)}], [${c.value.toFixed(2)}, ${d.value.toFixed(2)}]]`
})

// ---------- 预设 ----------
function setPreset(p: 'unique' | 'infinite' | 'none') {
  preset.value = p
  switch (p) {
    case 'unique':
      // det = -3，唯一解
      a.value = 2; b.value = 1; c.value = 1; d.value = -1
      b1.value = 3; b2.value = 0
      break
    case 'infinite':
      // 两行成比例，b 也成比例 → 重合 → 无穷多解
      a.value = 1; b.value = 2; c.value = 2; d.value = 4
      b1.value = 3; b2.value = 6
      break
    case 'none':
      // 两行成比例，但 b 不成比例 → 平行但不重合 → 无解
      a.value = 1; b.value = 2; c.value = 2; d.value = 4
      b1.value = 3; b2.value = 7
      break
  }
}

function clearPreset() {
  preset.value = ''
}

// ---------- Three.js 资源 ----------
const canvas1 = ref<HTMLElement | null>(null)
const canvas2 = ref<HTMLElement | null>(null)
const canvas3 = ref<HTMLElement | null>(null)

// 配色
const COLOR_LINE1 = 0xef4444        // 红：方程 1
const COLOR_LINE2 = 0x3b82f6        // 蓝：方程 2
const COLOR_INTERSECTION = 0x10b981 // 绿：交点
const COLOR_COL1 = 0xef4444          // 红：列 1
const COLOR_COL2 = 0x3b82f6         // 蓝：列 2
const COLOR_TARGET = 0xa855f7       // 紫：目标向量 b
const COLOR_SPAN = 0xa855f7         // 紫：列张成空间
const COLOR_ORIG_SQUARE = 0x9ca3af  // 灰：原始单位正方形
const COLOR_RANK2 = 0x10b981        // 绿：rank=2
const COLOR_RANK2_EDGE = 0x059669
const COLOR_RANK1 = 0xef4444        // 红：rank=1
const COLOR_RANK1_EDGE = 0xb91c1c
const COLOR_RANK0 = 0x6b7280        // 灰：rank=0
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS = 0x6b7280

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- 视角 1：行图像 ----------
interface RowViewCtx {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  line1: THREE.Line
  line2: THREE.Line
  intersection: THREE.Mesh
  origin: THREE.Mesh
}

// ---------- 视角 2：列图像 ----------
interface ColViewCtx {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  arrow1: THREE.ArrowHelper
  arrow2: THREE.ArrowHelper
  arrowB: THREE.ArrowHelper
  spanLine: THREE.Line
  spanPlane: THREE.Mesh
  origin: THREE.Mesh
}

// ---------- 视角 3：变换 ----------
interface TransViewCtx {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  origSquare: THREE.LineLoop
  shape: THREE.Mesh
  shapeEdges: THREE.LineLoop
  origin: THREE.Mesh
}

let ctx1: RowViewCtx | null = null
let ctx2: ColViewCtx | null = null
let ctx3: TransViewCtx | null = null
let resizeObserver: ResizeObserver
let animationId = 0

// 通用：创建场景的公共部分
function createBaseScene(container: HTMLElement, viewSize = 8) {
  const width = container.clientWidth || 240
  const height = container.clientHeight || 240

  // WebGL 检测
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:1rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.8rem;">不支持 WebGL</div>'
    return null
  }

  const scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  const camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2, viewSize * aspect / 2,
    viewSize / 2, -viewSize / 2,
    -100, 100
  )
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = 'WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableRotate = false // 2D 视角
  controls.minZoom = 0.3
  controls.maxZoom = 5

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))

  // 网格
  const half = Math.floor(viewSize / 2)
  for (let i = -half; i <= half; i++) {
    const isAxis = i === 0
    const op = isAxis ? 0.8 : 0.35
    const color = isAxis ? COLOR_AXIS : COLOR_GRID
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, i, -0.01), new THREE.Vector3(half, i, -0.01)
    ])
    scene.add(new THREE.Line(hGeom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: op
    })))
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -half, -0.01), new THREE.Vector3(i, half, -0.01)
    ])
    scene.add(new THREE.Line(vGeom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: op
    })))
  }

  // 原点小球
  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  )
  scene.add(origin)

  return { scene, camera, renderer, controls, width, height, origin }
}

// ---------- 创建视角 1：行图像 ----------
function createRowView(container: HTMLElement): RowViewCtx | null {
  const base = createBaseScene(container, 8)
  if (!base) return null
  const { scene, camera, renderer, controls, origin } = base

  // 方程 1 直线（红）
  const l1Geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3()
  ])
  const line1 = new THREE.Line(l1Geom, new THREE.LineBasicMaterial({
    color: COLOR_LINE1, linewidth: 3
  }))
  scene.add(line1)

  // 方程 2 直线（蓝）
  const l2Geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3()
  ])
  const line2 = new THREE.Line(l2Geom, new THREE.LineBasicMaterial({
    color: COLOR_LINE2, linewidth: 3
  }))
  scene.add(line2)

  // 交点（绿球）
  const ptGeom = new THREE.SphereGeometry(0.16, 20, 20)
  const intersection = new THREE.Mesh(ptGeom, new THREE.MeshBasicMaterial({
    color: COLOR_INTERSECTION
  }))
  intersection.visible = false
  scene.add(intersection)

  return { scene, camera, renderer, controls, line1, line2, intersection, origin }
}

// ---------- 创建视角 2：列图像 ----------
function createColumnView(container: HTMLElement): ColViewCtx | null {
  const base = createBaseScene(container, 8)
  if (!base) return null
  const { scene, camera, renderer, controls, origin } = base

  // 列 1 箭头（红）
  const arrow1 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_COL1, 0.25, 0.15
  )
  scene.add(arrow1)

  // 列 2 箭头（蓝）
  const arrow2 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_COL2, 0.25, 0.15
  )
  scene.add(arrow2)

  // 目标 b 箭头（紫）
  const arrowB = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_TARGET, 0.3, 0.18
  )
  scene.add(arrowB)

  // 张成空间直线（rank=1 时显示）
  const spanLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3()
  ])
  const spanLine = new THREE.Line(spanLineGeom, new THREE.LineBasicMaterial({
    color: COLOR_SPAN,
    transparent: true,
    opacity: 0.6
  }))
  spanLine.visible = false
  scene.add(spanLine)

  // 张成空间平面（rank=2 时显示）
  const spanPlaneGeom = new THREE.BufferGeometry()
  spanPlaneGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  spanPlaneGeom.setIndex([0, 1, 2, 0, 2, 3])
  const spanPlane = new THREE.Mesh(spanPlaneGeom, new THREE.MeshBasicMaterial({
    color: COLOR_SPAN,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  }))
  spanPlane.visible = false
  scene.add(spanPlane)

  return { scene, camera, renderer, controls, arrow1, arrow2, arrowB, spanLine, spanPlane, origin }
}

// ---------- 创建视角 3：变换 ----------
function createTransformView(container: HTMLElement): TransViewCtx | null {
  const base = createBaseScene(container, 8)
  if (!base) return null
  const { scene, camera, renderer, controls, origin } = base

  // 原始单位正方形（灰色虚线）
  const origGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0.02),
    new THREE.Vector3(1, 0, 0.02),
    new THREE.Vector3(1, 1, 0.02),
    new THREE.Vector3(0, 1, 0.02)
  ])
  const origSquare = new THREE.LineLoop(origGeom, new THREE.LineDashedMaterial({
    color: COLOR_ORIG_SQUARE,
    dashSize: 0.1, gapSize: 0.08,
    transparent: true, opacity: 0.7
  }))
  origSquare.computeLineDistances()
  scene.add(origSquare)

  // 变换后形状（填充）
  const shapeGeom = new THREE.BufferGeometry()
  shapeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  shapeGeom.setIndex([0, 1, 2, 0, 2, 3])
  const shape = new THREE.Mesh(shapeGeom, new THREE.MeshBasicMaterial({
    color: COLOR_RANK2,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  }))
  scene.add(shape)

  // 变换后形状（边框）
  const edgeGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ])
  const shapeEdges = new THREE.LineLoop(edgeGeom, new THREE.LineBasicMaterial({
    color: COLOR_RANK2_EDGE
  }))
  scene.add(shapeEdges)

  return { scene, camera, renderer, controls, origSquare, shape, shapeEdges, origin }
}

// ---------- 给定方程 ax + by = c，计算直线上两个端点 ----------
function lineEndpoints(a: number, b: number, c: number): [THREE.Vector3, THREE.Vector3] {
  const range = 4
  if (Math.abs(b) < EPS) {
    if (Math.abs(a) < EPS) {
      return [new THREE.Vector3(0, 0, 0.05), new THREE.Vector3(0, 0, 0.05)]
    }
    const x = c / a
    return [
      new THREE.Vector3(x, -range, 0.05),
      new THREE.Vector3(x, range, 0.05)
    ]
  }
  return [
    new THREE.Vector3(-range, (c - a * (-range)) / b, 0.05),
    new THREE.Vector3(range, (c - a * range) / b, 0.05)
  ]
}

// ---------- 设置箭头 ----------
function setArrow(arrow: THREE.ArrowHelper, target: THREE.Vector3) {
  const len = target.length()
  if (len < 1e-4) {
    arrow.visible = false
    return
  }
  arrow.position.set(0, 0, 0)
  arrow.setDirection(target.clone().normalize())
  arrow.setLength(Math.min(len, 6), 0.25, 0.15)
  arrow.visible = true
}

// ---------- 更新视角 1 ----------
function updateRowView() {
  if (!ctx1) return
  // 直线 1：a*x + b*y = b1
  const [p1a, p1b] = lineEndpoints(a.value, b.value, b1.value)
  const pos1 = ctx1.line1.geometry.attributes.position as THREE.BufferAttribute
  pos1.setXYZ(0, p1a.x, p1a.y, p1a.z)
  pos1.setXYZ(1, p1b.x, p1b.y, p1b.z)
  pos1.needsUpdate = true

  // 直线 2：c*x + d*y = b2
  const [p2a, p2b] = lineEndpoints(c.value, d.value, b2.value)
  const pos2 = ctx1.line2.geometry.attributes.position as THREE.BufferAttribute
  pos2.setXYZ(0, p2a.x, p2a.y, p2a.z)
  pos2.setXYZ(1, p2b.x, p2b.y, p2b.z)
  pos2.needsUpdate = true

  // 交点（唯一解时显示）
  if (uniqueSolution.value) {
    ctx1.intersection.position.set(solutionX.value, solutionY.value, 0.1)
    ctx1.intersection.visible = true
  } else {
    ctx1.intersection.visible = false
  }
}

// ---------- 更新视角 2 ----------
function updateColumnView() {
  if (!ctx2) return
  // 列 1 = (a, c)
  setArrow(ctx2.arrow1, new THREE.Vector3(a.value, c.value, 0))
  // 列 2 = (b, d)
  setArrow(ctx2.arrow2, new THREE.Vector3(b.value, d.value, 0))
  // 目标 b 向量
  setArrow(ctx2.arrowB, new THREE.Vector3(b1.value, b2.value, 0))

  // 张成空间可视化
  const r = rankA.value
  if (r === 2) {
    // 整个平面：用一个大半透明矩形表示
    ctx2.spanPlane.visible = true
    ctx2.spanLine.visible = false
    const s = 4
    const pos = ctx2.spanPlane.geometry.attributes.position as THREE.BufferAttribute
    pos.setXYZ(0, -s, -s, 0)
    pos.setXYZ(1, s, -s, 0)
    pos.setXYZ(2, s, s, 0)
    pos.setXYZ(3, -s, s, 0)
    pos.needsUpdate = true
    ctx2.spanPlane.geometry.computeVertexNormals()
  } else if (r === 1) {
    // 一条直线：沿非零列向量方向
    ctx2.spanPlane.visible = false
    ctx2.spanLine.visible = true
    // 取较长的列向量作为方向
    const v1Len = Math.sqrt(a.value * a.value + c.value * c.value)
    const v2Len = Math.sqrt(b.value * b.value + d.value * d.value)
    let dir: THREE.Vector3
    if (v1Len > EPS) {
      dir = new THREE.Vector3(a.value, c.value, 0).normalize()
    } else if (v2Len > EPS) {
      dir = new THREE.Vector3(b.value, d.value, 0).normalize()
    } else {
      dir = new THREE.Vector3(1, 0, 0)
    }
    const range = 4
    const pos = ctx2.spanLine.geometry.attributes.position as THREE.BufferAttribute
    pos.setXYZ(0, -dir.x * range, -dir.y * range, 0)
    pos.setXYZ(1, dir.x * range, dir.y * range, 0)
    pos.needsUpdate = true
  } else {
    // rank = 0：仅原点
    ctx2.spanPlane.visible = false
    ctx2.spanLine.visible = false
  }
}

// ---------- 更新视角 3 ----------
function updateTransformView() {
  if (!ctx3) return
  // 单位正方形 4 顶点：(0,0), (1,0), (1,1), (0,1)
  // 变换后：(0,0), (a,c), (a+b, c+d), (b, d)
  const v0 = new THREE.Vector3(0, 0, 0.05)
  const v1 = new THREE.Vector3(a.value, c.value, 0.05)
  const v2 = new THREE.Vector3(a.value + b.value, c.value + d.value, 0.05)
  const v3 = new THREE.Vector3(b.value, d.value, 0.05)

  const pos = ctx3.shape.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true
  ctx3.shape.geometry.computeVertexNormals()

  const epos = ctx3.shapeEdges.geometry.attributes.position as THREE.BufferAttribute
  epos.setXYZ(0, v0.x, v0.y, v0.z)
  epos.setXYZ(1, v1.x, v1.y, v1.z)
  epos.setXYZ(2, v2.x, v2.y, v2.z)
  epos.setXYZ(3, v3.x, v3.y, v3.z)
  epos.needsUpdate = true

  // 根据 rank 选择颜色
  const r = rankA.value
  let fillColor: number, edgeColor: number
  if (r === 2) {
    fillColor = COLOR_RANK2
    edgeColor = COLOR_RANK2_EDGE
  } else if (r === 1) {
    fillColor = COLOR_RANK1
    edgeColor = COLOR_RANK1_EDGE
  } else {
    fillColor = COLOR_RANK0
    edgeColor = COLOR_RANK0
  }
  ;(ctx3.shape.material as THREE.MeshBasicMaterial).color.setHex(fillColor)
  ;(ctx3.shapeEdges.material as THREE.LineBasicMaterial).color.setHex(edgeColor)
}

// ---------- 统一更新 ----------
function updateAll() {
  updateRowView()
  updateColumnView()
  updateTransformView()
}

// ---------- 动画循环 ----------
function animateLoop() {
  animationId = requestAnimationFrame(animateLoop)
  if (ctx1) {
    ctx1.controls.update()
    ctx1.renderer.render(ctx1.scene, ctx1.camera)
  }
  if (ctx2) {
    ctx2.controls.update()
    ctx2.renderer.render(ctx2.scene, ctx2.camera)
  }
  if (ctx3) {
    ctx3.controls.update()
    ctx3.renderer.render(ctx3.scene, ctx3.camera)
  }
}

// ---------- resize ----------
function handleResize() {
  const items: Array<{ c: HTMLElement | null, ctx: { camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer } | null }> = [
    { c: canvas1.value, ctx: ctx1 },
    { c: canvas2.value, ctx: ctx2 },
    { c: canvas3.value, ctx: ctx3 }
  ]
  const viewSize = 8
  for (const item of items) {
    if (!item.c || !item.ctx) continue
    const width = item.c.clientWidth
    const height = item.c.clientHeight
    if (width === 0 || height === 0) continue
    const aspect = width / height
    item.ctx.camera.left = -viewSize * aspect / 2
    item.ctx.camera.right = viewSize * aspect / 2
    item.ctx.camera.top = viewSize / 2
    item.ctx.camera.bottom = -viewSize / 2
    item.ctx.camera.updateProjectionMatrix()
    item.ctx.renderer.setSize(width, height)
  }
}

// ---------- 生命周期 ----------
onMounted(() => {
  try {
    if (canvas1.value) ctx1 = createRowView(canvas1.value)
    if (canvas2.value) ctx2 = createColumnView(canvas2.value)
    if (canvas3.value) ctx3 = createTransformView(canvas3.value)
    if (ctx1 && ctx2 && ctx3) {
      updateAll()
      animateLoop()
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('RankSummaryDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (canvas1.value) resizeObserver.observe(canvas1.value)
  if (canvas2.value) resizeObserver.observe(canvas2.value)
  if (canvas3.value) resizeObserver.observe(canvas3.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  for (const ctx of [ctx1, ctx2, ctx3]) {
    if (!ctx) continue
    ctx.controls.dispose()
    // 清理所有几何体与材质
    ctx.scene.traverse(obj => {
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
    ctx.renderer.dispose()
    if (ctx.renderer.domElement.parentNode) {
      ctx.renderer.domElement.parentNode.removeChild(ctx.renderer.domElement)
    }
  }
  ctx1 = null
  ctx2 = null
  ctx3 = null
})

// 监听所有参数变化
watch([a, b, c, d, b1, b2], () => {
  clearPreset()
  updateAll()
})
</script>

<style scoped>
/* 三重视角并排 */
.triple-view {
  display: flex;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  flex-wrap: wrap;
}

.view-pane {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.pane-label {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

/* 小 canvas 高度 */
.demo-canvas.small {
  height: 240px;
  min-height: 240px;
}

/* 判定流程图 */
.flowchart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  margin: var(--space-3) 0;
}

.flow-node {
  padding: 0.4em 1em;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  margin: var(--space-1);
  font-size: var(--fs-sm);
  color: var(--text-primary);
}

.flow-node.current {
  border-color: var(--color-success);
  background: var(--bg-success-soft);
  color: var(--color-success);
  font-weight: 600;
}

.flow-node.result {
  font-weight: 600;
}

.flow-branches {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-1);
}

.flow-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.flow-branch.active {
  opacity: 1;
}

.flow-branch .branch-label {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  margin: var(--space-1) 0;
}

.flow-subbranches {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

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
  flex: 1 1 240px;
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

/* 输出面板 */
.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

@media (max-width: 720px) {
  .triple-view {
    flex-direction: column;
  }
  .flow-branches {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
