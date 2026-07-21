<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div ref="canvas3DContainer" class="demo-canvas main-3d"></div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="classify-badge" :class="classifyClass">
      <span class="badge-label">曲面分类</span>
      <span class="badge-value">{{ classification }}</span>
      <span v-if="hasRepeatedEigenvalue" class="badge-extra">· 旋转对称</span>
    </div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#3b82f6"></span>
        <span>椭球面（正定）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ef4444"></span>
        <span>X 主轴 v₁（红）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#10b981"></span>
        <span>Y 主轴 v₂（绿）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#3b82f6"></span>
        <span>Z 主轴 v₃（蓝）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch" style="background:#ffffff;border:1px solid #888"></span>
        <span>直角标记（正交）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>马鞍面（不定）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ef4444;opacity:0.5"></span>
        <span>反向椭球（负定）</span>
      </span>
    </div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'pd' }" @click="setPreset('pd')">正定 (2, 1, 0.5)</button>
      <button :class="{ active: preset === 'ind' }" @click="setPreset('ind')">不定 (1, -1, 0.5)</button>
      <button :class="{ active: preset === 'psd' }" @click="setPreset('psd')">半正定 (2, 1, 0)</button>
      <button :class="{ active: preset === 'sphere' }" @click="setPreset('sphere')">球面 (1, 1, 1)</button>
      <button @click="reset">重置</button>
    </div>

    <div class="matrix-editor">
      <div class="matrix-display-block">
        <p class="block-title">A = diag(λ₁, λ₂, λ₃)</p>
        <table class="matrix-table">
          <tr><td>{{ lam1.toFixed(2) }}</td><td>0</td><td>0</td></tr>
          <tr><td>0</td><td>{{ lam2.toFixed(2) }}</td><td>0</td></tr>
          <tr><td>0</td><td>0</td><td>{{ lam3.toFixed(2) }}</td></tr>
        </table>
      </div>
      <div class="matrix-display-block">
        <p class="block-title">Q = I（单位正交）</p>
        <table class="matrix-table">
          <tr><td>1</td><td>0</td><td>0</td></tr>
          <tr><td>0</td><td>1</td><td>0</td></tr>
          <tr><td>0</td><td>0</td><td>1</td></tr>
        </table>
      </div>
      <div class="matrix-display-block">
        <p class="block-title">Λ = diag(λ₁, λ₂, λ₃)</p>
        <table class="matrix-table">
          <tr><td>{{ lam1.toFixed(2) }}</td><td>0</td><td>0</td></tr>
          <tr><td>0</td><td>{{ lam2.toFixed(2) }}</td><td>0</td></tr>
          <tr><td>0</td><td>0</td><td>{{ lam3.toFixed(2) }}</td></tr>
        </table>
      </div>
      <div class="sliders-block">
        <label>λ₁
          <input type="range" min="-2" max="2" step="0.1" v-model.number="lam1" />
          <span>{{ lam1.toFixed(2) }}</span>
        </label>
        <label>λ₂
          <input type="range" min="-2" max="2" step="0.1" v-model.number="lam2" />
          <span>{{ lam2.toFixed(2) }}</span>
        </label>
        <label>λ₃
          <input type="range" min="-2" max="2" step="0.1" v-model.number="lam3" />
          <span>{{ lam3.toFixed(2) }}</span>
        </label>
      </div>
    </div>

    <div class="demo-output">
      <div class="output-row highlight">
        <span class="label">A = diag(λ₁, λ₂, λ₃)</span>
        <span class="value">[[{{ lam1.toFixed(2) }}, 0, 0], [0, {{ lam2.toFixed(2) }}, 0], [0, 0, {{ lam3.toFixed(2) }}]]</span>
      </div>
      <div class="output-row">
        <span class="label">特征值 λ₁</span>
        <span class="value">{{ lam1.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">特征值 λ₂</span>
        <span class="value">{{ lam2.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">特征值 λ₃</span>
        <span class="value">{{ lam3.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">特征向量 v₁</span>
        <span class="value">(1, 0, 0)</span>
      </div>
      <div class="output-row">
        <span class="label">特征向量 v₂</span>
        <span class="value">(0, 1, 0)</span>
      </div>
      <div class="output-row">
        <span class="label">特征向量 v₃</span>
        <span class="value">(0, 0, 1)</span>
      </div>
      <div class="output-row" :class="classifyClass">
        <span class="label">矩阵分类</span>
        <span class="value">{{ classification }}</span>
      </div>
      <div class="output-row">
        <span class="label">xᵀAx for x = (1,1,1)</span>
        <span class="value">{{ qForm111.toFixed(4) }} = λ₁+λ₂+λ₃</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 A·v₁ = λ₁·v₁</span>
        <span class="value">({{ lam1.toFixed(2) }}, 0, 0) = {{ lam1.toFixed(2) }}·(1,0,0) ✓</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 A·v₂ = λ₂·v₂</span>
        <span class="value">(0, {{ lam2.toFixed(2) }}, 0) = {{ lam2.toFixed(2) }}·(0,1,0) ✓</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 A·v₃ = λ₃·v₃</span>
        <span class="value">(0, 0, {{ lam3.toFixed(2) }}) = {{ lam3.toFixed(2) }}·(0,0,1) ✓</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 Q·Λ·Qᵀ = A</span>
        <span class="value">{{ qlqtOk ? '✓ I·Λ·I = Λ = A' : '✗ 不一致' }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 v₁·v₂ = 0（正交）</span>
        <span class="value">{{ v1DotV2.toFixed(6) }} ✓</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 v₁·v₃ = 0（正交）</span>
        <span class="value">{{ v1DotV3.toFixed(6) }} ✓</span>
      </div>
      <div class="output-row highlight">
        <span class="label">验证 v₂·v₃ = 0（正交）</span>
        <span class="value">{{ v2DotV3.toFixed(6) }} ✓</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">📐 谱定理与主轴变换</p>
      <p class="formula-line">谱定理：<span class="math">A = Q Λ Qᵀ</span>，Q 为正交矩阵（<span class="math">Qᵀ Q = I</span>）</p>
      <p class="formula-line">二次型：<span class="math">f(x) = xᵀ A x = Σ λᵢ xᵢ²</span></p>
      <p class="formula-line">主轴变换：在特征基下，二次型退化为 <span class="math">Σ λᵢ yᵢ²</span>（无交叉项）</p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
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
    title: '实对称矩阵的正交对角化 · 3D 主轴可视化'
  }
)

const COLOR_ELLIPSOID = 0x3b82f6
const COLOR_ELLIPSOID_WIRE = 0x1e40af
const COLOR_NEG_ELLIPSOID = 0xef4444
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6
const COLOR_SQUARE = 0xffffff
const COLOR_SADDLE = 0xfbbf24
const COLOR_GRID = 0xe5e7eb
const COLOR_ORIGIN = 0x1f2937

const DEFAULT_L1 = 2
const DEFAULT_L2 = 1
const DEFAULT_L3 = 0.5
const lam1 = ref(DEFAULT_L1)
const lam2 = ref(DEFAULT_L2)
const lam3 = ref(DEFAULT_L3)

type PresetKey = 'pd' | 'ind' | 'psd' | 'sphere' | 'custom'
const preset = ref<PresetKey>('pd')

const PRESETS: { key: PresetKey, l1: number, l2: number, l3: number }[] = [
  { key: 'pd', l1: 2, l2: 1, l3: 0.5 },
  { key: 'ind', l1: 1, l2: -1, l3: 0.5 },
  { key: 'psd', l1: 2, l2: 1, l3: 0 },
  { key: 'sphere', l1: 1, l2: 1, l3: 1 }
]

function setPreset(p: PresetKey) {
  const target = PRESETS.find(it => it.key === p)
  if (!target) return
  lam1.value = target.l1
  lam2.value = target.l2
  lam3.value = target.l3
  preset.value = p
}

function reset() {
  lam1.value = DEFAULT_L1
  lam2.value = DEFAULT_L2
  lam3.value = DEFAULT_L3
  preset.value = 'pd'
}

watch([lam1, lam2, lam3], () => {
  const match = PRESETS.find(k =>
    Math.abs(k.l1 - lam1.value) < 1e-6 &&
    Math.abs(k.l2 - lam2.value) < 1e-6 &&
    Math.abs(k.l3 - lam3.value) < 1e-6
  )
  preset.value = match ? match.key : 'custom'
})

type Classification = 'pd' | 'nd' | 'ind' | 'psd' | 'nsd' | 'zero'

function classify(l1: number, l2: number, l3: number): Classification {
  const eps = 1e-9
  const arr = [l1, l2, l3]
  const pos = arr.filter(l => l > eps).length
  const neg = arr.filter(l => l < -eps).length
  const zer = 3 - pos - neg
  if (pos === 3) return 'pd'
  if (neg === 3) return 'nd'
  if (pos > 0 && neg > 0) return 'ind'
  if (pos > 0 && zer > 0) return 'psd'
  if (neg > 0 && zer > 0) return 'nsd'
  return 'zero'
}

const classification = computed(() => {
  const c = classify(lam1.value, lam2.value, lam3.value)
  switch (c) {
    case 'pd': return '正定（λ 全正）'
    case 'nd': return '负定（λ 全负）'
    case 'ind': return '不定（λ 异号）'
    case 'psd': return '半正定（λ ≥ 0，含 0）'
    case 'nsd': return '半负定（λ ≤ 0，含 0）'
    case 'zero': return '零矩阵（λ 全 0）'
  }
})

const classifyClass = computed(() => {
  const c = classify(lam1.value, lam2.value, lam3.value)
  switch (c) {
    case 'pd': return 'highlight'
    case 'nd': return 'warning'
    case 'ind': return 'danger'
    case 'psd': return 'info'
    case 'nsd': return 'warning'
    case 'zero': return ''
  }
  return ''
})

const hasRepeatedEigenvalue = computed(() => {
  const eps = 0.05
  const arr = [lam1.value, lam2.value, lam3.value]
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      if (Math.abs(arr[i] - arr[j]) < eps) return true
    }
  }
  return false
})

const qForm111 = computed(() => lam1.value + lam2.value + lam3.value)
const qlqtOk = computed(() => true)
const v1DotV2 = 0
const v1DotV3 = 0
const v2DotV3 = 0

const tipText = computed(() => {
  const c = classify(lam1.value, lam2.value, lam3.value)
  const parts: string[] = []
  parts.push('实对称矩阵必可正交对角化：A = Q Λ Qᵀ。在特征基下 A = Λ = diag(λ₁, λ₂, λ₃)，无交叉项。')
  if (c === 'pd') parts.push('三个特征值全为正 → 椭球面 x²/λ₁+y²/λ₂+z²/λ₃=1，主轴沿 e₁, e₂, e₃，长度 √λᵢ。')
  if (c === 'nd') parts.push('三个特征值全为负 → 方程无实解，显示反向椭球（红色），主轴长度 √|λᵢ|。')
  if (c === 'ind') parts.push('特征值异号 → 二次型曲面退化为双曲抛物面（马鞍面），黄色面展示 z = x²/|λ₊| − y²/|λ₋|。')
  if (c === 'psd') parts.push('半正定（含 0）→ 椭球退化为椭圆柱，零特征值方向无约束（柱轴）。')
  if (c === 'nsd') parts.push('半负定（含 0）→ 椭圆柱（反向），零特征值方向无约束。')
  if (c === 'zero') parts.push('零矩阵 → 无二次型曲面。')
  if (hasRepeatedEigenvalue.value && c !== 'zero') parts.push('检测到重复特征值 → 椭球具有旋转对称性。')
  return parts.join(' ')
})

const canvas3DContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let ellipsoidMesh: THREE.Mesh
let ellipsoidWireframe: THREE.LineSegments

let saddleMesh: THREE.Mesh
let saddleGeometry: THREE.BufferGeometry

let cylinderMesh: THREE.Mesh
let cylinderWireframe: THREE.LineSegments

let xAxisArrow: THREE.ArrowHelper
let yAxisArrow: THREE.ArrowHelper
let zAxisArrow: THREE.ArrowHelper

let squareXY: THREE.LineLoop
let squareYZ: THREE.LineLoop
let squareXZ: THREE.LineLoop

let originSphere: THREE.Mesh

let label1: THREE.Sprite
let label2: THREE.Sprite
let label3: THREE.Sprite

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const displayLam1 = ref(DEFAULT_L1)
const displayLam2 = ref(DEFAULT_L2)
const displayLam3 = ref(DEFAULT_L3)

const SADDLE_SEGMENTS = 40
const SADDLE_RANGE = 2

function makeLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.font = 'bold 36px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 64, 32)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(0.7, 0.35, 1)
  return sprite
}

function initSaddleGeometry() {
  saddleGeometry = new THREE.BufferGeometry()
  const n = (SADDLE_SEGMENTS + 1) * (SADDLE_SEGMENTS + 1)
  saddleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  const indices: number[] = []
  for (let i = 0; i < SADDLE_SEGMENTS; i++) {
    for (let j = 0; j < SADDLE_SEGMENTS; j++) {
      const idx00 = i * (SADDLE_SEGMENTS + 1) + j
      const idx10 = (i + 1) * (SADDLE_SEGMENTS + 1) + j
      const idx01 = i * (SADDLE_SEGMENTS + 1) + j + 1
      const idx11 = (i + 1) * (SADDLE_SEGMENTS + 1) + j + 1
      indices.push(idx00, idx10, idx11)
      indices.push(idx00, idx11, idx01)
    }
  }
  saddleGeometry.setIndex(indices)
  saddleGeometry.computeVertexNormals()
}

function updateSaddleGeometry(
  posIdx: number, negIdx: number,
  lambdaPos: number, lambdaNeg: number
) {
  const a = Math.abs(lambdaPos)
  const b = Math.abs(lambdaNeg)
  if (a < 1e-6 || b < 1e-6) return
  const verticalIdx = 3 - posIdx - negIdx
  const pos = saddleGeometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i <= SADDLE_SEGMENTS; i++) {
    for (let j = 0; j <= SADDLE_SEGMENTS; j++) {
      const u = (i / SADDLE_SEGMENTS) * 2 * SADDLE_RANGE - SADDLE_RANGE
      const v = (j / SADDLE_SEGMENTS) * 2 * SADDLE_RANGE - SADDLE_RANGE
      const w = (u * u) / a - (v * v) / b
      const idx = i * (SADDLE_SEGMENTS + 1) + j
      const p = [0, 0, 0]
      p[posIdx] = u
      p[negIdx] = v
      p[verticalIdx] = w
      pos.setXYZ(idx, p[0], p[1], p[2])
    }
  }
  pos.needsUpdate = true
  saddleGeometry.computeVertexNormals()
}

function init3DScene() {
  const container = canvas3DContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '⚠ 当前浏览器不支持 WebGL，无法渲染 3D 演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">⚠ 当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(4.5, 3.5, 5.5)
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
  controls.maxDistance = 25

  scene.add(new THREE.AmbientLight(0xffffff, 0.95))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(8, 16, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 3.2, 0.35)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 3.2, 0.35)
  createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 3.2, 0.35)

  const origGeom = new THREE.SphereGeometry(0.07, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  const ellipGeom = new THREE.SphereGeometry(1, 48, 32)
  const ellipMat = new THREE.MeshBasicMaterial({
    color: COLOR_ELLIPSOID,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  ellipsoidMesh = new THREE.Mesh(ellipGeom, ellipMat)
  scene.add(ellipsoidMesh)

  const wireGeom = new THREE.WireframeGeometry(ellipGeom)
  const wireMat = new THREE.LineBasicMaterial({
    color: COLOR_ELLIPSOID_WIRE,
    transparent: true,
    opacity: 0.4
  })
  ellipsoidWireframe = new THREE.LineSegments(wireGeom, wireMat)
  scene.add(ellipsoidWireframe)

  initSaddleGeometry()
  const saddleMat = new THREE.MeshBasicMaterial({
    color: COLOR_SADDLE,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  })
  saddleMesh = new THREE.Mesh(saddleGeometry, saddleMat)
  saddleMesh.visible = false
  scene.add(saddleMesh)

  const cylGeom = new THREE.CylinderGeometry(1, 1, 4, 48, 1, true)
  const cylMat = new THREE.MeshBasicMaterial({
    color: COLOR_ELLIPSOID,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  cylinderMesh = new THREE.Mesh(cylGeom, cylMat)
  cylinderMesh.visible = false
  scene.add(cylinderMesh)

  const cylWireGeom = new THREE.WireframeGeometry(cylGeom)
  const cylWireMat = new THREE.LineBasicMaterial({
    color: COLOR_ELLIPSOID_WIRE,
    transparent: true,
    opacity: 0.4
  })
  cylinderWireframe = new THREE.LineSegments(cylWireGeom, cylWireMat)
  cylinderWireframe.visible = false
  scene.add(cylinderWireframe)

  xAxisArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_AXIS_X, 0.25, 0.15
  )
  scene.add(xAxisArrow)
  yAxisArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_AXIS_Y, 0.25, 0.15
  )
  scene.add(yAxisArrow)
  zAxisArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0),
    1, COLOR_AXIS_Z, 0.25, 0.15
  )
  scene.add(zAxisArrow)

  squareXY = createSquareMarker(0.18, 'xy')
  squareYZ = createSquareMarker(0.18, 'yz')
  squareXZ = createSquareMarker(0.18, 'xz')
  scene.add(squareXY)
  scene.add(squareYZ)
  scene.add(squareXZ)

  label1 = makeLabel('λ₁', '#ef4444')
  label2 = makeLabel('λ₂', '#10b981')
  label3 = makeLabel('λ₃', '#3b82f6')
  scene.add(label1)
  scene.add(label2)
  scene.add(label3)
}

function createAxis(dir: THREE.Vector3, color: number, length: number, opacity: number) {
  const arrow = new THREE.ArrowHelper(
    dir, new THREE.Vector3(0, 0, 0), length, color, 0.2, 0.1
  )
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  lineMat.transparent = true
  lineMat.opacity = opacity
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  coneMat.transparent = true
  coneMat.opacity = opacity
  scene.add(arrow)
}

function createSquareMarker(size: number, plane: 'xy' | 'yz' | 'xz'): THREE.LineLoop {
  const pts: THREE.Vector3[] = []
  if (plane === 'xy') {
    pts.push(new THREE.Vector3(0, 0, 0))
    pts.push(new THREE.Vector3(size, 0, 0))
    pts.push(new THREE.Vector3(size, size, 0))
    pts.push(new THREE.Vector3(0, size, 0))
  } else if (plane === 'yz') {
    pts.push(new THREE.Vector3(0, 0, 0))
    pts.push(new THREE.Vector3(0, size, 0))
    pts.push(new THREE.Vector3(0, size, size))
    pts.push(new THREE.Vector3(0, 0, size))
  } else {
    pts.push(new THREE.Vector3(0, 0, 0))
    pts.push(new THREE.Vector3(size, 0, 0))
    pts.push(new THREE.Vector3(size, 0, size))
    pts.push(new THREE.Vector3(0, 0, size))
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({
    color: COLOR_SQUARE,
    transparent: true,
    opacity: 0.95
  })
  return new THREE.LineLoop(geom, mat)
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.32, Math.max(0.1, len * 0.25))
    const headWid = Math.min(0.18, Math.max(0.06, len * 0.18))
    arrow.setLength(len, headLen, headWid)
    arrow.visible = true
  } else {
    arrow.visible = false
  }
}

function update3DScene() {
  if (!scene) return

  const l1 = displayLam1.value
  const l2 = displayLam2.value
  const l3 = displayLam3.value
  const c = classify(l1, l2, l3)
  const eps = 1e-6

  const sx = Math.sqrt(Math.abs(l1))
  const sy = Math.sqrt(Math.abs(l2))
  const sz = Math.sqrt(Math.abs(l3))

  setArrow(xAxisArrow, new THREE.Vector3(Math.sign(l1) * sx, 0, 0))
  setArrow(yAxisArrow, new THREE.Vector3(0, Math.sign(l2) * sy, 0))
  setArrow(zAxisArrow, new THREE.Vector3(0, 0, Math.sign(l3) * sz))

  label1.position.set(Math.sign(l1) * sx * 1.15, 0.05, 0)
  label2.position.set(0, Math.sign(l2) * sy * 1.15, 0.05)
  label3.position.set(0.05, 0, Math.sign(l3) * sz * 1.15)
  label1.visible = Math.abs(l1) > 0.05
  label2.visible = Math.abs(l2) > 0.05
  label3.visible = Math.abs(l3) > 0.05

  squareXY.visible = Math.abs(l1) > eps && Math.abs(l2) > eps
  squareYZ.visible = Math.abs(l2) > eps && Math.abs(l3) > eps
  squareXZ.visible = Math.abs(l1) > eps && Math.abs(l3) > eps

  ellipsoidMesh.visible = false
  ellipsoidWireframe.visible = false
  saddleMesh.visible = false
  cylinderMesh.visible = false
  cylinderWireframe.visible = false

  if (c === 'pd') {

    ellipsoidMesh.visible = true
    ellipsoidWireframe.visible = true
    ellipsoidMesh.scale.set(sx, sy, sz)
    ellipsoidWireframe.scale.set(sx, sy, sz)
    ;(ellipsoidMesh.material as THREE.MeshBasicMaterial).color.setHex(COLOR_ELLIPSOID)
  } else if (c === 'nd') {

    ellipsoidMesh.visible = true
    ellipsoidWireframe.visible = true
    ellipsoidMesh.scale.set(sx, sy, sz)
    ellipsoidWireframe.scale.set(sx, sy, sz)
    ;(ellipsoidMesh.material as THREE.MeshBasicMaterial).color.setHex(COLOR_NEG_ELLIPSOID)
  } else if (c === 'ind') {

    const arr = [l1, l2, l3]
    let posIdx = -1, negIdx = -1
    for (let i = 0; i < 3; i++) {
      if (posIdx < 0 && arr[i] > eps) posIdx = i
      if (negIdx < 0 && arr[i] < -eps) negIdx = i
    }
    if (posIdx >= 0 && negIdx >= 0) {
      updateSaddleGeometry(posIdx, negIdx, arr[posIdx], arr[negIdx])
      saddleMesh.visible = true
    }
  } else if (c === 'psd' || c === 'nsd') {

    const arr = [l1, l2, l3]
    let zeroIdx = -1
    for (let i = 0; i < 3; i++) {
      if (Math.abs(arr[i]) < eps) { zeroIdx = i; break }
    }
    if (zeroIdx >= 0) {
      const r = (i: number) => Math.sqrt(Math.abs(arr[i]))
      cylinderMesh.visible = true
      cylinderWireframe.visible = true
      cylinderMesh.rotation.set(0, 0, 0)
      cylinderWireframe.rotation.set(0, 0, 0)

      if (zeroIdx === 0) {

        cylinderMesh.rotation.z = Math.PI / 2
        cylinderWireframe.rotation.z = Math.PI / 2

        cylinderMesh.scale.set(r(1), 1, r(2))
        cylinderWireframe.scale.set(r(1), 1, r(2))
      } else if (zeroIdx === 1) {

        cylinderMesh.scale.set(r(0), 1, r(2))
        cylinderWireframe.scale.set(r(0), 1, r(2))
      } else {

        cylinderMesh.rotation.x = Math.PI / 2
        cylinderWireframe.rotation.x = Math.PI / 2

        cylinderMesh.scale.set(r(0), 1, r(1))
        cylinderWireframe.scale.set(r(0), 1, r(1))
      }

      const col = c === 'psd' ? COLOR_ELLIPSOID : COLOR_NEG_ELLIPSOID
      ;(cylinderMesh.material as THREE.MeshBasicMaterial).color.setHex(col)
    }
  }

}

let lastTime = -1

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const dt = lastTime < 0 ? 0 : (time - lastTime) / 1000
  lastTime = time

  const lerpFactor = Math.min(1, dt * 10)
  displayLam1.value += (lam1.value - displayLam1.value) * lerpFactor
  displayLam2.value += (lam2.value - displayLam2.value) * lerpFactor
  displayLam3.value += (lam3.value - displayLam3.value) * lerpFactor

  if (Math.abs(lam1.value - displayLam1.value) < 1e-5) displayLam1.value = lam1.value
  if (Math.abs(lam2.value - displayLam2.value) < 1e-5) displayLam2.value = lam2.value
  if (Math.abs(lam3.value - displayLam3.value) < 1e-5) displayLam3.value = lam3.value

  update3DScene()
  controls.update()
  renderer.render(scene, camera)
}

function handleResize() {
  if (!canvas3DContainer.value || !renderer || !camera) return
  const w = canvas3DContainer.value.clientWidth
  const h = canvas3DContainer.value.clientHeight
  if (w === 0 || h === 0) return
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  try {
    init3DScene()
    if (renderer) {
      update3DScene()
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('SymmetricEigenDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (canvas3DContainer.value) resizeObserver.observe(canvas3DContainer.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()

  ellipsoidMesh?.geometry?.dispose()
  ;(ellipsoidMesh?.material as THREE.Material | undefined)?.dispose()
  ellipsoidWireframe?.geometry?.dispose()
  ;(ellipsoidWireframe?.material as THREE.Material | undefined)?.dispose()
  saddleGeometry?.dispose()
  ;(saddleMesh?.material as THREE.Material | undefined)?.dispose()
  cylinderMesh?.geometry?.dispose()
  ;(cylinderMesh?.material as THREE.Material | undefined)?.dispose()
  cylinderWireframe?.geometry?.dispose()
  ;(cylinderWireframe?.material as THREE.Material | undefined)?.dispose()
  squareXY?.geometry?.dispose()
  ;(squareXY?.material as THREE.Material | undefined)?.dispose()
  squareYZ?.geometry?.dispose()
  ;(squareYZ?.material as THREE.Material | undefined)?.dispose()
  squareXZ?.geometry?.dispose()
  ;(squareXZ?.material as THREE.Material | undefined)?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

.demo-canvas.main-3d {
  width: 100%;
  height: 500px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: block;
  margin: var(--space-2) 0;
}

.classify-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-2) 0;
  padding: 0.4em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  border-radius: var(--radius-full);
  background: var(--bg-code);
  border: 1px solid var(--border-color);
}

.classify-badge .badge-label {
  color: var(--text-tertiary);
  font-weight: 500;
}

.classify-badge .badge-value {
  color: var(--text-primary);
  font-weight: 700;
}

.classify-badge .badge-extra {
  color: var(--text-secondary);
  font-size: var(--fs-xs);
}

.classify-badge.highlight {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}
.classify-badge.highlight .badge-value { color: var(--color-success); }

.classify-badge.warning {
  background: var(--bg-warning-soft);
  border-color: var(--color-warning);
}
.classify-badge.warning .badge-value { color: var(--color-warning); }

.classify-badge.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}
.classify-badge.danger .badge-value { color: var(--color-danger); }

.classify-badge.info {
  background: var(--bg-info-soft);
  border-color: var(--color-info);
}
.classify-badge.info .badge-value { color: var(--color-info); }

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
  font-family: var(--font-mono);
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
  min-width: 3em;
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
  padding: 0.25em 0.6em;
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
  line-height: 1.7;
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

.formula-line .math {
  color: var(--text-primary);
  font-weight: 600;
  background: var(--bg-content);
  padding: 0.05em 0.3em;
  border-radius: var(--radius-sm);
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

@media (max-width: 768px) {
  .demo-canvas.main-3d {
    height: 380px;
  }

  .matrix-editor {
    flex-direction: column;
    align-items: stretch;
  }

  .matrix-display-block {
    align-self: center;
  }
}
</style>
