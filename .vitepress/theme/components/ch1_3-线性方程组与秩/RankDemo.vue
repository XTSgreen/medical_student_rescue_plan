<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'full' }" @click="setPreset('full')">满秩 rank=3</button>
      <button :class="{ active: preset === 'rank2' }" @click="setPreset('rank2')">秩 2</button>
      <button :class="{ active: preset === 'rank1' }" @click="setPreset('rank1')">秩 1</button>
      <button :class="{ active: preset === 'rank0' }" @click="setPreset('rank0')">秩 0</button>
    </div>

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

    <div class="demo-output">
      <div class="output-row" :class="rankClass">
        <span class="label">rank(A)</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">主元数量</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row">
        <span class="label">像空间维度</span>
        <span class="value">{{ imageSpaceText }}</span>
      </div>
      <div class="output-row">
        <span class="label">核空间维度（零度）</span>
        <span class="value">{{ 3 - rank }}</span>
      </div>
      <div class="output-row" :class="{ danger: Math.abs(det) < 1e-6, highlight: Math.abs(det) > 1e-6 }">
        <span class="label">det(A)</span>
        <span class="value">{{ det.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">几何意义</span>
        <span class="value">{{ geometryMeaning }}</span>
      </div>
    </div>

    <p class="demo-tip">3D 场景中的立方体被矩阵 A 变换。秩 = 像空间维度 = 变换后"图形"的真实维度。满秩时是立体（可逆），秩 2 时被压成平面，秩 1 时被压成直线，秩 0 时塌缩为原点。维度损失 = 3 - rank。</p>
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
    title: '矩阵的秩 · 维度塌缩交互演示'
  }
)

// ---------- 矩阵状态 ----------
// matrix：用户通过滑块/预设设定的目标矩阵
const matrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
])

// animatedMatrix：当前显示中的矩阵（动画过渡值），3D 场景基于它渲染
const animatedMatrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
])

type PresetKey = 'full' | 'rank2' | 'rank1' | 'rank0' | 'custom'
const preset = ref<PresetKey>('full')

// ---------- 预设 ----------
function setPreset(p: PresetKey) {
  preset.value = p
  let target: number[][]
  switch (p) {
    case 'full':
      target = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      break
    case 'rank2':
      target = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      break
    case 'rank1':
      target = [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
      break
    case 'rank0':
      target = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      break
    default:
      return
  }
  matrix.value = target.map(r => [...r])
  animateToMatrix(target)
}

function updateMatrix(row: number, col: number, value: number) {
  const newM = matrix.value.map(r => [...r])
  newM[row][col] = value
  matrix.value = newM
  preset.value = 'custom'
  animateToMatrix(newM)
}

// ---------- lerp 动画 ----------
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
    const eased = t * (2 - t) // ease-out
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

// ---------- 线性代数计算 ----------
function rank3x3(m: number[][]): number {
  const a = m.map(r => [...r])
  const rows = 3, cols = 3
  let rank = 0
  for (let c = 0; c < cols && rank < rows; c++) {
    let pivot = -1
    for (let r = rank; r < rows; r++) {
      if (Math.abs(a[r][c]) > 1e-9) { pivot = r; break }
    }
    if (pivot === -1) continue
    [a[rank], a[pivot]] = [a[pivot], a[rank]]
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

function det3x3(m: number[][]): number {
  return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
       - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
       + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
}

const rank = computed(() => rank3x3(animatedMatrix.value))
const det = computed(() => det3x3(animatedMatrix.value))

const rankClass = computed(() => ({
  rank3: rank.value === 3,
  rank2: rank.value === 2,
  rank1: rank.value === 1,
  rank0: rank.value === 0
}))

const imageSpaceText = computed(() => {
  switch (rank.value) {
    case 0: return '{0}（仅原点）'
    case 1: return 'ℝ¹（直线）'
    case 2: return 'ℝ²（平面）'
    case 3: return 'ℝ³（立体）'
    default: return ''
  }
})

const geometryMeaning = computed(() => {
  switch (rank.value) {
    case 0: return '塌缩为原点（零维）'
    case 1: return '压缩到直线（一维）'
    case 2: return '压缩到平面（二维）'
    case 3: return '保持立体（可逆）'
    default: return ''
  }
})

// ---------- 立方体几何 ----------
const CORNERS: number[][] = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
]

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], // bottom
  [4, 5], [5, 6], [6, 7], [7, 4], // top
  [0, 4], [1, 5], [2, 6], [3, 7]  // vertical
]

// 6 个面，每个面 4 个顶点（按右手系外法方向排列）
const CUBE_FACES: [number, number, number, number][] = [
  [0, 3, 2, 1], // bottom (z=0)，法向 -z
  [4, 5, 6, 7], // top    (z=1)，法向 +z
  [0, 1, 5, 4], // front  (y=0)，法向 -y
  [2, 3, 7, 6], // back   (y=1)，法向 +y
  [1, 2, 6, 5], // right  (x=1)，法向 +x
  [3, 0, 4, 7]  // left   (x=0)，法向 -x
]

function transformCube(m: number[][]): THREE.Vector3[] {
  return CORNERS.map(([x, y, z]) => new THREE.Vector3(
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z
  ))
}

// ---------- Three.js ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

// 场景对象
let originalCube: THREE.LineSegments      // 灰色虚线原始立方体
let transformedEdges: THREE.LineSegments  // 变换后的 12 条边
let transformedFill: THREE.Mesh           // 变换后的 6 面填充（rank=3 时显示）
let imagePlane: THREE.Mesh                // rank=2 时像空间平面
let imageLine: THREE.Line                 // rank=1 时像空间直线
let imagePoint: THREE.Mesh                // rank=0 时像空间点
let cornerMarkers: THREE.Mesh[]          // 8 个顶点小球
let arrowI: THREE.ArrowHelper             // i 的像（红）
let arrowJ: THREE.ArrowHelper             // j 的像（蓝）
let arrowK: THREE.ArrowHelper             // k 的像（绿）

// 配色
const COLOR_ORIG_CUBE = 0x9ca3af
const COLOR_RANK3 = 0x10b981
const COLOR_RANK2 = 0xf59e0b
const COLOR_RANK1 = 0xf97316
const COLOR_RANK0 = 0xef4444
const COLOR_I = 0xef4444
const COLOR_J = 0x3b82f6
const COLOR_K = 0x10b981
const COLOR_GRID = 0xe5e7eb

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

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
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
  camera.position.set(3.5, 3.5, 5.5)
  camera.lookAt(0.5, 0.5, 0.5)

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
  controls.maxDistance = 25
  controls.target.set(0.5, 0.5, 0.5)

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 网格（XY 平面）
  const grid = new THREE.GridHelper(10, 10, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  // 坐标轴
  const axes = new THREE.AxesHelper(3)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  scene.add(axes)

  // 原点
  const originGeom = new THREE.SphereGeometry(0.05, 16, 16)
  const originMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  scene.add(new THREE.Mesh(originGeom, originMat))

  // ---------- 原始单位立方体（灰色虚线） ----------
  const origCorners = CORNERS.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  const origEdgePoints: THREE.Vector3[] = []
  for (const [a, b] of EDGES) {
    origEdgePoints.push(origCorners[a], origCorners[b])
  }
  const origGeom = new THREE.BufferGeometry().setFromPoints(origEdgePoints)
  const origMat = new THREE.LineDashedMaterial({
    color: COLOR_ORIG_CUBE,
    dashSize: 0.1,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.55
  })
  originalCube = new THREE.LineSegments(origGeom, origMat)
  originalCube.computeLineDistances()
  scene.add(originalCube)

  // ---------- 变换后的 12 条边 ----------
  const edgeGeom = new THREE.BufferGeometry()
  edgeGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(EDGES.length * 2 * 3), 3)
  )
  const edgeMat = new THREE.LineBasicMaterial({ color: COLOR_RANK3, linewidth: 2 })
  transformedEdges = new THREE.LineSegments(edgeGeom, edgeMat)
  scene.add(transformedEdges)

  // ---------- 变换后的填充（rank=3 时显示完整六面体） ----------
  // 6 面 × 2 三角形 × 3 顶点 = 36 顶点
  const fillGeom = new THREE.BufferGeometry()
  fillGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(36 * 3), 3)
  )
  const fillIndex: number[] = []
  for (let i = 0; i < 12; i++) {
    fillIndex.push(i * 3, i * 3 + 1, i * 3 + 2)
  }
  fillGeom.setIndex(fillIndex)
  const fillMat = new THREE.MeshBasicMaterial({
    color: COLOR_RANK3,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide
  })
  transformedFill = new THREE.Mesh(fillGeom, fillMat)
  transformedFill.visible = false
  scene.add(transformedFill)

  // ---------- 像空间平面（rank=2） ----------
  const planeGeom = new THREE.PlaneGeometry(8, 8)
  const planeMat = new THREE.MeshBasicMaterial({
    color: COLOR_RANK2,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide
  })
  imagePlane = new THREE.Mesh(planeGeom, planeMat)
  imagePlane.visible = false
  scene.add(imagePlane)

  // ---------- 像空间直线（rank=1） ----------
  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(6), 3)
  )
  const lineMat = new THREE.LineBasicMaterial({ color: COLOR_RANK1, linewidth: 4 })
  imageLine = new THREE.Line(lineGeom, lineMat)
  imageLine.visible = false
  scene.add(imageLine)

  // ---------- 像空间点（rank=0） ----------
  const ptGeom = new THREE.SphereGeometry(0.16, 24, 24)
  const ptMat = new THREE.MeshBasicMaterial({ color: COLOR_RANK0 })
  imagePoint = new THREE.Mesh(ptGeom, ptMat)
  imagePoint.visible = false
  scene.add(imagePoint)

  // ---------- 8 个顶点小球 ----------
  cornerMarkers = []
  for (let i = 0; i < 8; i++) {
    const geom = new THREE.SphereGeometry(0.07, 12, 12)
    const mat = new THREE.MeshBasicMaterial({ color: COLOR_RANK3 })
    const marker = new THREE.Mesh(geom, mat)
    scene.add(marker)
    cornerMarkers.push(marker)
  }

  // ---------- 基向量 i, j, k 的像 ----------
  arrowI = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_I, 0.2, 0.12
  )
  scene.add(arrowI)

  arrowJ = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_J, 0.2, 0.12
  )
  scene.add(arrowJ)

  arrowK = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_K, 0.2, 0.12
  )
  scene.add(arrowK)

  updateScene()
}

// 设置箭头方向与长度（按向量）
function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.2, Math.max(0.05, len * 0.25))
    const headWid = Math.min(0.12, Math.max(0.03, len * 0.18))
    arrow.setLength(len, headLen, headWid)
    arrow.visible = true
  } else {
    arrow.visible = false
  }
}

// 在矩阵的 3 个列向量中找出两个线性无关的列
function pickIndependentColumns(
  ai: THREE.Vector3, aj: THREE.Vector3, ak: THREE.Vector3
): [THREE.Vector3, THREE.Vector3] {
  const cols = [ai, aj, ak]
  let v1: THREE.Vector3 | null = null
  for (const c of cols) {
    if (c.lengthSq() > 1e-9) { v1 = c; break }
  }
  if (!v1) v1 = new THREE.Vector3(1, 0, 0)
  let v2: THREE.Vector3 | null = null
  for (const c of cols) {
    if (c === v1) continue
    if (c.lengthSq() < 1e-9) continue
    const cross = new THREE.Vector3().crossVectors(v1, c)
    if (cross.lengthSq() > 1e-9) { v2 = c; break }
  }
  if (!v2) {
    // 找不到与 v1 不平行的列，退化到任意正交向量
    v2 = new THREE.Vector3(0, 1, 0)
    if (Math.abs(v1.dot(v2)) > 1 - 1e-6) v2 = new THREE.Vector3(0, 0, 1)
  }
  return [v1, v2]
}

function updateScene() {
  if (!scene) return
  const m = animatedMatrix.value
  const r = rank3x3(m)
  const corners = transformCube(m)

  // 颜色按 rank 分配
  let color: number
  switch (r) {
    case 3: color = COLOR_RANK3; break
    case 2: color = COLOR_RANK2; break
    case 1: color = COLOR_RANK1; break
    case 0: color = COLOR_RANK0; break
    default: color = COLOR_RANK3
  }

  // 更新变换后的边
  const edgePos = transformedEdges.geometry.attributes.position as THREE.BufferAttribute
  let idx = 0
  for (const [a, b] of EDGES) {
    edgePos.setXYZ(idx++, corners[a].x, corners[a].y, corners[a].z)
    edgePos.setXYZ(idx++, corners[b].x, corners[b].y, corners[b].z)
  }
  edgePos.needsUpdate = true
  ;(transformedEdges.material as THREE.LineBasicMaterial).color.setHex(color)

  // 更新顶点小球位置与颜色
  for (let i = 0; i < 8; i++) {
    cornerMarkers[i].position.copy(corners[i])
    ;(cornerMarkers[i].material as THREE.MeshBasicMaterial).color.setHex(color)
  }

  // 更新基向量箭头：i 的像 = A·e1 = (m00, m10, m20)，依此类推
  const aiVec = new THREE.Vector3(m[0][0], m[1][0], m[2][0])
  const ajVec = new THREE.Vector3(m[0][1], m[1][1], m[2][1])
  const akVec = new THREE.Vector3(m[0][2], m[1][2], m[2][2])
  setArrow(arrowI, aiVec)
  setArrow(arrowJ, ajVec)
  setArrow(arrowK, akVec)

  // 隐藏所有像空间可视化
  transformedFill.visible = false
  imagePlane.visible = false
  imageLine.visible = false
  imagePoint.visible = false

  if (r === 3) {
    // 显示完整六面体填充
    const fillPos = transformedFill.geometry.attributes.position as THREE.BufferAttribute
    let fidx = 0
    for (const [a, b, c, d] of CUBE_FACES) {
      // 三角形 1: a, b, c
      fillPos.setXYZ(fidx++, corners[a].x, corners[a].y, corners[a].z)
      fillPos.setXYZ(fidx++, corners[b].x, corners[b].y, corners[b].z)
      fillPos.setXYZ(fidx++, corners[c].x, corners[c].y, corners[c].z)
      // 三角形 2: a, c, d
      fillPos.setXYZ(fidx++, corners[a].x, corners[a].y, corners[a].z)
      fillPos.setXYZ(fidx++, corners[c].x, corners[c].y, corners[c].z)
      fillPos.setXYZ(fidx++, corners[d].x, corners[d].y, corners[d].z)
    }
    fillPos.needsUpdate = true
    ;(transformedFill.material as THREE.MeshBasicMaterial).color.setHex(COLOR_RANK3)
    transformedFill.visible = true
  } else if (r === 2) {
    // 显示像空间平面：法向 = v1 × v2
    const [v1, v2] = pickIndependentColumns(aiVec, ajVec, akVec)
    const normal = new THREE.Vector3().crossVectors(v1, v2)
    if (normal.lengthSq() > 1e-12) {
      normal.normalize()
      imagePlane.position.set(0, 0, 0)
      imagePlane.lookAt(normal)
    }
    ;(imagePlane.material as THREE.MeshBasicMaterial).color.setHex(COLOR_RANK2)
    imagePlane.visible = true
  } else if (r === 1) {
    // 显示像空间直线：方向 = 唯一非零列
    const dir =
      aiVec.lengthSq() > 1e-9 ? aiVec :
      (ajVec.lengthSq() > 1e-9 ? ajVec : akVec)
    if (dir.lengthSq() > 1e-12) {
      const dirN = dir.clone().normalize()
      const p1 = dirN.clone().multiplyScalar(-4)
      const p2 = dirN.clone().multiplyScalar(4)
      const linePos = imageLine.geometry.attributes.position as THREE.BufferAttribute
      linePos.setXYZ(0, p1.x, p1.y, p1.z)
      linePos.setXYZ(1, p2.x, p2.y, p2.z)
      linePos.needsUpdate = true
    }
    ;(imageLine.material as THREE.LineBasicMaterial).color.setHex(COLOR_RANK1)
    imageLine.visible = true
  } else {
    // rank = 0：像空间仅为原点
    ;(imagePoint.material as THREE.MeshBasicMaterial).color.setHex(COLOR_RANK0)
    imagePoint.visible = true
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return
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
    if (renderer) animate()
  } catch (e) {
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('RankDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  cancelAnimationFrame(animFrame)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
/* ---------- 预设按钮 ---------- */
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

/* ---------- 矩阵编辑器（3×3） ---------- */
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

/* ---------- 输出面板 ---------- */
.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-accent-strong);
}

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
}

/* rank 颜色提示 */
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

/* ---------- 状态与提示 ---------- */
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
