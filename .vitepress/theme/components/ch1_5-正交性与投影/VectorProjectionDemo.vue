<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: mode === 'line' }" @click="setPreset('line')">直线模式</button>
      <button :class="{ active: mode === 'plane' }" @click="setPreset('plane')">平面模式</button>
      <button @click="resetB">重置 b</button>
      <button @click="orthogonalTest">正交测试</button>
    </div>

    <div class="mode-hint">
      当前模式：<strong>{{ mode === 'line' ? '投影到直线（1D 子空间）' : '投影到平面（2D 子空间）' }}</strong>
      <span v-if="mode === 'line'"> · 拖拽黄色球体改变向量 b，观察它在固定向量 a 上的投影</span>
      <span v-else> · 拖拽黄色球体改变向量 b，观察它在 xy 平面上的投影</span>
    </div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ffd700"></span>
        <span>向量 b（实线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ef4444"></span>
        <span>投影 p（实线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed"></span>
        <span>误差 e（虚线，闪烁）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#10b981"></span>
        <span v-if="mode === 'line'">固定向量 a</span>
        <span v-else>固定平面</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch" style="background:rgba(255,255,255,0.7);border:1px solid #888"></span>
        <span>直角标记</span>
      </span>
    </div>

    <div class="demo-output">
      <template v-if="mode === 'line'">
        <div class="output-row">
          <span class="label">固定向量 a</span>
          <span class="value">({{ aVec.x.toFixed(2) }}, {{ aVec.y.toFixed(2) }}, {{ aVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">向量 b</span>
          <span class="value">({{ bVec.x.toFixed(2) }}, {{ bVec.y.toFixed(2) }}, {{ bVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">‖a‖</span>
          <span class="value">{{ aLen.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">‖b‖</span>
          <span class="value">{{ bLen.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">a·b</span>
          <span class="value">{{ aDotB.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">a·a</span>
          <span class="value">{{ aDotA.toFixed(4) }}</span>
        </div>
        <div class="output-row highlight">
          <span class="label">投影系数 x̂ = (a·b)/(a·a)</span>
          <span class="value">{{ xHat.toFixed(4) }}</span>
        </div>
        <div class="output-row highlight">
          <span class="label">投影向量 p = x̂·a</span>
          <span class="value">({{ pVec.x.toFixed(2) }}, {{ pVec.y.toFixed(2) }}, {{ pVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">误差向量 e = b − p</span>
          <span class="value">({{ eVec.x.toFixed(2) }}, {{ eVec.y.toFixed(2) }}, {{ eVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">误差长度 ‖e‖</span>
          <span class="value">{{ eLen.toFixed(4) }}</span>
        </div>
        <div class="output-row" :class="orthogonalClass">
          <span class="label">验证 a·e ≈ 0</span>
          <span class="value">{{ aDotE.toFixed(6) }} {{ orthogonalOk ? '对' : '错' }}</span>
        </div>
        <div class="output-row" :class="decompositionClass">
          <span class="label">分解验证 b = p + e</span>
          <span class="value">{{ decompositionOk ? '一致' : '不一致' }}</span>
        </div>
        <div class="output-row" :class="pythagoreanClass">
          <span class="label">勾股验证 ‖b‖² ≈ ‖p‖² + ‖e‖²</span>
          <span class="value">{{ pythagoreanError.toFixed(6) }} {{ pythagoreanOk ? '对' : '错' }}</span>
        </div>
      </template>
      <template v-else>
        <div class="output-row">
          <span class="label">平面法向量 n</span>
          <span class="value">({{ nVec.x.toFixed(2) }}, {{ nVec.y.toFixed(2) }}, {{ nVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">向量 b</span>
          <span class="value">({{ bVec.x.toFixed(2) }}, {{ bVec.y.toFixed(2) }}, {{ bVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">‖b‖</span>
          <span class="value">{{ bLen.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">b·n</span>
          <span class="value">{{ bnDot.toFixed(4) }}</span>
        </div>
        <div class="output-row highlight">
          <span class="label">投影向量 p = b − (b·n)n</span>
          <span class="value">({{ pVec.x.toFixed(2) }}, {{ pVec.y.toFixed(2) }}, {{ pVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row highlight">
          <span class="label">‖p‖（平面内分量）</span>
          <span class="value">{{ pLen.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">误差向量 e = (b·n)n</span>
          <span class="value">({{ eVec.x.toFixed(2) }}, {{ eVec.y.toFixed(2) }}, {{ eVec.z.toFixed(2) }})</span>
        </div>
        <div class="output-row">
          <span class="label">误差长度 ‖e‖</span>
          <span class="value">{{ eLen.toFixed(4) }}</span>
        </div>
        <div class="output-row" :class="orthogonalClass">
          <span class="label">验证 n·p ≈ 0</span>
          <span class="value">{{ nDotP.toFixed(6) }} {{ orthogonalOk ? '对' : '错' }}</span>
        </div>
        <div class="output-row" :class="decompositionClass">
          <span class="label">分解验证 b = p + e</span>
          <span class="value">{{ decompositionOk ? '一致' : '不一致' }}</span>
        </div>
        <div class="output-row" :class="pythagoreanClass">
          <span class="label">勾股验证 ‖b‖² ≈ ‖p‖² + ‖e‖²</span>
          <span class="value">{{ pythagoreanError.toFixed(6) }} {{ pythagoreanOk ? '对' : '错' }}</span>
        </div>
      </template>
    </div>

    <div class="formula-block">
      <p class="formula-title">投影公式</p>
      <template v-if="mode === 'line'">
        <p class="formula-line">p = (a·b / a·a) · a &nbsp; ⇒ &nbsp; e = b − p &nbsp; ⊥ &nbsp; a</p>
        <p class="formula-line">P = a aᵀ / (aᵀa) 是秩 1 投影矩阵，满足 P² = P 且 Pᵀ = P</p>
      </template>
      <template v-else>
        <p class="formula-line">p = b − (b·n) n &nbsp; ⇒ &nbsp; e = (b·n) n &nbsp; ⊥ &nbsp; 平面</p>
        <p class="formula-line">P = I − n nᵀ 是秩 2 投影矩阵（n 已单位化），满足 P² = P 且 Pᵀ = P</p>
      </template>
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
    title: '向量投影与正交分解 · 交互演示'
  }
)

const COLOR_B = 0xffd700
const COLOR_B_HOVER = 0xffeb3b
const COLOR_P = 0xef4444
const COLOR_E = 0xf97316
const COLOR_A = 0x10b981
const COLOR_PLANE = 0x3b82f6
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_SQUARE = 0xffffff
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6

type Mode = 'line' | 'plane'
const mode = ref<Mode>('line')

const aVec = reactive({ x: 2, y: 1, z: 0.5 })
const nVec = reactive({ x: 0, y: 0, z: 1 })
const bVec = reactive({ x: 1, y: 1.5, z: 1 })

const DEFAULT_B_LINE = { x: 1, y: 1.5, z: 1 }
const DEFAULT_B_PLANE = { x: 1, y: 1, z: 1.5 }

const aDotA = computed(() => aVec.x * aVec.x + aVec.y * aVec.y + aVec.z * aVec.z)
const aDotB = computed(() => aVec.x * bVec.x + aVec.y * bVec.y + aVec.z * bVec.z)
const aLen = computed(() => Math.sqrt(aDotA.value))
const bLen = computed(() =>
  Math.sqrt(bVec.x * bVec.x + bVec.y * bVec.y + bVec.z * bVec.z)
)

const xHat = computed(() => {
  if (mode.value !== 'line') return 0
  const aa = aDotA.value
  if (aa < 1e-12) return 0
  return aDotB.value / aa
})

const bnDot = computed(
  () => bVec.x * nVec.x + bVec.y * nVec.y + bVec.z * nVec.z
)

const pVec = computed(() => {
  if (mode.value === 'line') {
    const x = xHat.value
    return { x: x * aVec.x, y: x * aVec.y, z: x * aVec.z }
  }
  const bn = bnDot.value
  return {
    x: bVec.x - bn * nVec.x,
    y: bVec.y - bn * nVec.y,
    z: bVec.z - bn * nVec.z
  }
})

const pLen = computed(() =>
  Math.sqrt(pVec.value.x * pVec.value.x + pVec.value.y * pVec.value.y + pVec.value.z * pVec.value.z)
)

const eVec = computed(() => ({
  x: bVec.x - pVec.value.x,
  y: bVec.y - pVec.value.y,
  z: bVec.z - pVec.value.z
}))

const eLen = computed(() =>
  Math.sqrt(eVec.value.x * eVec.value.x + eVec.value.y * eVec.value.y + eVec.value.z * eVec.value.z)
)

const aDotE = computed(() =>
  aVec.x * eVec.value.x + aVec.y * eVec.value.y + aVec.z * eVec.value.z
)

const nDotP = computed(() =>
  nVec.x * pVec.value.x + nVec.y * pVec.value.y + nVec.z * pVec.value.z
)

const orthogonalOk = computed(() => {
  if (mode.value === 'line') return Math.abs(aDotE.value) < 1e-6
  return Math.abs(nDotP.value) < 1e-6
})

const orthogonalClass = computed(() => ({
  highlight: orthogonalOk.value,
  danger: !orthogonalOk.value
}))

const decompositionError = computed(() => {
  const dx = bVec.x - (pVec.value.x + eVec.value.x)
  const dy = bVec.y - (pVec.value.y + eVec.value.y)
  const dz = bVec.z - (pVec.value.z + eVec.value.z)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
})

const decompositionOk = computed(() => decompositionError.value < 1e-9)

const decompositionClass = computed(() => ({
  highlight: decompositionOk.value,
  danger: !decompositionOk.value
}))

const pythagoreanError = computed(() =>
  bLen.value * bLen.value - (pLen.value * pLen.value + eLen.value * eLen.value)
)

const pythagoreanOk = computed(() => Math.abs(pythagoreanError.value) < 1e-6)

const pythagoreanClass = computed(() => ({
  highlight: pythagoreanOk.value,
  danger: !pythagoreanOk.value
}))

const tipText = computed(() => {
  if (mode.value === 'line') {
    return '拖拽黄色球体改变向量 b。红色箭头是 b 在 a 上的投影 p，橙色虚线是误差 e = b − p。白色小方块标记直角顶点——a 与 e 始终正交，这是投影的几何本质。可观察"分解验证 b = p + e"始终成立，且勾股关系 ‖b‖² ≈ ‖p‖² + ‖e‖² 成立。'
  }
  return '拖拽黄色球体改变向量 b。红色箭头是 b 在平面上的投影 p，橙色虚线是误差 e = (b·n)n（沿法向量）。注意白色直角标记：p 与 e 始终正交。可观察"分解验证 b = p + e"始终成立。'
})

function setPreset(p: Mode) {
  mode.value = p
  if (p === 'line') {
    bVec.x = DEFAULT_B_LINE.x
    bVec.y = DEFAULT_B_LINE.y
    bVec.z = DEFAULT_B_LINE.z
  } else {
    bVec.x = DEFAULT_B_PLANE.x
    bVec.y = DEFAULT_B_PLANE.y
    bVec.z = DEFAULT_B_PLANE.z
  }
}

function resetB() {
  if (mode.value === 'line') {
    bVec.x = DEFAULT_B_LINE.x
    bVec.y = DEFAULT_B_LINE.y
    bVec.z = DEFAULT_B_LINE.z
  } else {
    bVec.x = DEFAULT_B_PLANE.x
    bVec.y = DEFAULT_B_PLANE.y
    bVec.z = DEFAULT_B_PLANE.z
  }
}

function orthogonalTest() {
  if (mode.value === 'line') {

    bVec.x = 1
    bVec.y = -2
    bVec.z = 0
  } else {

    bVec.x = 1.5
    bVec.y = 1
    bVec.z = 0
  }
}

const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let originSphere: THREE.Mesh
let bArrow: THREE.ArrowHelper
let pArrow: THREE.ArrowHelper
let aArrow: THREE.ArrowHelper
let bSphere: THREE.Mesh
let eLine: THREE.Line
let square: THREE.LineLoop
let planeMesh: THREE.Mesh
let planeEdges: THREE.LineSegments

let flickerPhase = 0

const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2()
let isDragging = false
let isHovered = false
const dragPlane = new THREE.Plane()

let aArrowOpacityTarget = 1
let planeOpacityTarget = 0
let squareOpacityTarget = 1

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

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

  scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(4, 4, 6)
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
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(6, 12, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 3)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 3)
  createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 3)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  aArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_A, 0.25, 0.12
  )
  setArrowColor(aArrow, COLOR_A)
  scene.add(aArrow)

  const planeGeom = new THREE.PlaneGeometry(6, 6, 1, 1)
  const planeMat = new THREE.MeshBasicMaterial({
    color: COLOR_PLANE,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  planeMesh = new THREE.Mesh(planeGeom, planeMat)
  planeMesh.rotation.x = Math.PI / 2
  scene.add(planeMesh)

  const planeEdgeGeom = new THREE.EdgesGeometry(planeGeom)
  const planeEdgeMat = new THREE.LineBasicMaterial({
    color: COLOR_PLANE,
    transparent: true,
    opacity: 0
  })
  planeEdges = new THREE.LineSegments(planeEdgeGeom, planeEdgeMat)
  planeEdges.rotation.x = Math.PI / 2
  scene.add(planeEdges)

  bArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_B, 0.25, 0.12
  )
  setArrowColor(bArrow, COLOR_B)
  scene.add(bArrow)

  pArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_P, 0.25, 0.12
  )
  setArrowColor(pArrow, COLOR_P)
  scene.add(pArrow)

  const eLineGeom = new THREE.BufferGeometry()
  eLineGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(6), 3)
  )
  const eLineMat = new THREE.LineDashedMaterial({
    color: COLOR_E,
    dashSize: 0.18,
    gapSize: 0.12,
    transparent: true,
    opacity: 0.8,
    linewidth: 2
  })
  eLine = new THREE.Line(eLineGeom, eLineMat)
  eLine.computeLineDistances()
  scene.add(eLine)

  const sphereGeom = new THREE.SphereGeometry(0.15, 24, 24)
  const sphereMat = new THREE.MeshBasicMaterial({ color: COLOR_B })
  bSphere = new THREE.Mesh(sphereGeom, sphereMat)
  bSphere.position.set(bVec.x, bVec.y, bVec.z)
  scene.add(bSphere)

  const sqGeom = new THREE.BufferGeometry()
  sqGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(12), 3)
  )
  const sqMat = new THREE.LineBasicMaterial({
    color: COLOR_SQUARE,
    transparent: true,
    opacity: 0.85,
    linewidth: 2
  })
  square = new THREE.LineLoop(sqGeom, sqMat)
  scene.add(square)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerUp)
  renderer.domElement.style.touchAction = 'none'
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
  const mat = arrow.line.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = 0.55
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  coneMat.transparent = true
  coneMat.opacity = 0.55
  scene.add(arrow)
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

function updateELine(pEnd: THREE.Vector3, bEnd: THREE.Vector3) {
  const pos = eLine.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, pEnd.x, pEnd.y, pEnd.z)
  pos.setXYZ(1, bEnd.x, bEnd.y, bEnd.z)
  pos.needsUpdate = true
  eLine.computeLineDistances()
}

function updateSquare(pEnd: THREE.Vector3, pVec: THREE.Vector3, eVec: THREE.Vector3) {
  const s = 0.3
  const pLen = pVec.length()
  const eLenVal = eVec.length()
  if (pLen < 1e-4 || eLenVal < 1e-4) {
    square.visible = false
    return
  }
  square.visible = true
  const pHat = pVec.clone().multiplyScalar(1 / pLen)
  const eHat = eVec.clone().multiplyScalar(1 / eLenVal)

  const v0 = pEnd.clone()
  const v1 = pEnd.clone().addScaledVector(pHat, -s)
  const v2 = pEnd.clone().addScaledVector(pHat, -s).addScaledVector(eHat, s)
  const v3 = pEnd.clone().addScaledVector(eHat, s)
  const pos = square.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true
}

function getMouseNDC(event: PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onPointerDown(event: PointerEvent) {
  if (!renderer || !camera || !bSphere) return
  getMouseNDC(event)
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(bSphere)
  if (intersects.length > 0) {
    isDragging = true
    controls.enabled = false

    const camDir = new THREE.Vector3()
    camera.getWorldDirection(camDir)
    dragPlane.setFromNormalAndCoplanarPoint(camDir, bSphere.position.clone())
  }
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera || !bSphere) return
  getMouseNDC(event)
  if (isDragging) {
    raycaster.setFromCamera(mouseNDC, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {

      intersection.x = Math.max(-3, Math.min(3, intersection.x))
      intersection.y = Math.max(-3, Math.min(3, intersection.y))
      intersection.z = Math.max(-3, Math.min(3, intersection.z))
      bVec.x = intersection.x
      bVec.y = intersection.y
      bVec.z = intersection.z
    }
  } else {

    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObject(bSphere)
    isHovered = intersects.length > 0
    renderer.domElement.style.cursor = isHovered ? 'grab' : 'default'
    if (isHovered) renderer.domElement.style.cursor = 'grab'
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

function updateScene() {
  if (!scene) return

  const bVec3 = new THREE.Vector3(bVec.x, bVec.y, bVec.z)
  const pVec3 = new THREE.Vector3(pVec.value.x, pVec.value.y, pVec.value.z)
  const eVec3 = new THREE.Vector3(eVec.value.x, eVec.value.y, eVec.value.z)

  if (mode.value === 'line') {
    aArrowOpacityTarget = 1
    planeOpacityTarget = 0
  } else {
    aArrowOpacityTarget = 0
    planeOpacityTarget = 0.32
  }

  bSphere.position.copy(bVec3)
  const bSphereMat = bSphere.material as THREE.MeshBasicMaterial
  if (isDragging) {
    bSphereMat.color.setHex(COLOR_B_HOVER)
    bSphere.scale.setScalar(1.25)
  } else if (isHovered) {
    bSphereMat.color.setHex(COLOR_B_HOVER)
    bSphere.scale.setScalar(1.15)
  } else {
    bSphereMat.color.setHex(COLOR_B)
    bSphere.scale.setScalar(1.0)
  }

  setArrow(bArrow, bVec3)
  setArrow(pArrow, pVec3)
  setArrowColor(bArrow, COLOR_B)
  setArrowColor(pArrow, COLOR_P)

  if (mode.value === 'line') {
    const aVec3 = new THREE.Vector3(aVec.x, aVec.y, aVec.z)
    setArrow(aArrow, aVec3)
    setArrowColor(aArrow, COLOR_A)
  } else {
    aArrow.visible = false
  }

  updateELine(pVec3, bVec3)

  if (eLen.value > 1e-3) {
    updateSquare(pVec3, pVec3, eVec3)
    squareOpacityTarget = 0.85
  } else {
    square.visible = false
    squareOpacityTarget = 0
  }
}

let lastTime = -1

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const now = time
  const dt = lastTime < 0 ? 0 : (now - lastTime) / 1000
  lastTime = now

  updateScene()

  const lerpFactor = Math.min(1, dt * 8)

  const aLineMat = aArrow.line.material as THREE.LineBasicMaterial
  const aConeMat = aArrow.cone.material as THREE.MeshBasicMaterial
  const aCur = aLineMat.opacity
  const aNew = aCur + (aArrowOpacityTarget - aCur) * lerpFactor
  setArrowOpacity(aArrow, aNew)
  if (aNew < 0.005) aArrow.visible = false

  const planeMat = planeMesh.material as THREE.MeshBasicMaterial
  const planeEdgeMat = planeEdges.material as THREE.LineBasicMaterial
  planeMat.opacity += (planeOpacityTarget - planeMat.opacity) * lerpFactor
  planeEdgeMat.opacity += (Math.min(1, planeOpacityTarget * 2.5) - planeEdgeMat.opacity) * lerpFactor
  planeMesh.visible = planeMat.opacity > 0.005
  planeEdges.visible = planeEdgeMat.opacity > 0.005

  const sqMat = square.material as THREE.LineBasicMaterial
  sqMat.opacity += (squareOpacityTarget - sqMat.opacity) * lerpFactor

  flickerPhase += dt * 3.5
  const flickerOpacity = 0.7 + 0.3 * Math.sin(flickerPhase)
  const eMat = eLine.material as THREE.LineDashedMaterial

  if (eLen.value > 1e-3) {
    eMat.opacity = flickerOpacity
    eLine.visible = true
  } else {
    eLine.visible = false
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
    console.error('VectorProjectionDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerUp)
  }
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

.mode-hint {
  margin: var(--space-2) 0;
  padding: 0.5em 1em;
  background: var(--bg-code);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  text-align: center;
}

.mode-hint strong {
  color: var(--color-accent-strong);
  font-weight: 600;
}

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

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
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
    #f97316 0,
    #f97316 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 20px;
}
</style>
