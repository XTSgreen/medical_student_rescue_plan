<template>
  <div class="demo-container eigen-direction-finder">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>

    <div v-if="isLocked" class="gold-pulse-overlay"></div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="angle-display">
      <span>当前角度 θ = <strong>{{ thetaDeg.toFixed(1) }}°</strong></span>
      <span class="angle-rad">（{{ normTheta.toFixed(3) }} rad）</span>
    </div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'anisotropic' }" @click="setPreset('anisotropic')">
        各向异性缩放
      </button>
      <button :class="{ active: preset === 'shear' }" @click="setPreset('shear')">
        剪切
      </button>
      <button :class="{ active: preset === 'reflection' }" @click="setPreset('reflection')">
        反射
      </button>
      <button :class="{ active: preset === 'rotation' }" @click="setPreset('rotation')">
        旋转 30°
      </button>
      <button @click="resetMatrix">重置</button>
    </div>

    <div class="demo-controls">
      <label>
        a
        <input type="range" min="-2" max="2" step="0.1" v-model.number="mA" />
        <span class="demo-readout">{{ mA.toFixed(1) }}</span>
      </label>
      <label>
        b
        <input type="range" min="-2" max="2" step="0.1" v-model.number="mB" />
        <span class="demo-readout">{{ mB.toFixed(1) }}</span>
      </label>
      <label>
        c
        <input type="range" min="-2" max="2" step="0.1" v-model.number="mC" />
        <span class="demo-readout">{{ mC.toFixed(1) }}</span>
      </label>
      <label>
        d
        <input type="range" min="-2" max="2" step="0.1" v-model.number="mD" />
        <span class="demo-readout">{{ mD.toFixed(1) }}</span>
      </label>
      <div class="matrix-display-inline">
        A = {{ matrixDisplay }}
      </div>
    </div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#38bdf8"></span>
        <span>当前向量 v（实线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed" style="background:#fb923c"></span>
        <span>变换像 A·v（虚线）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#94a3b8"></span>
        <span>单位圆</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed" style="background:#ef4444"></span>
        <span>变换椭圆</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>特征方向锁定（金色发光）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ef4444"></span>
        <span>X 轴</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#10b981"></span>
        <span>Y 轴</span>
      </span>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">矩阵 A</span>
        <span class="value matrix-display">{{ matrixDisplay }}</span>
      </div>
      <div class="output-row">
        <span class="label">tr(A)</span>
        <span class="value">{{ trace.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(A)</span>
        <span class="value">{{ det.toFixed(3) }}</span>
      </div>
      <div class="output-row" :class="discClass">
        <span class="label">判别式 Δ = tr² − 4·det</span>
        <span class="value">{{ discriminant.toFixed(3) }}</span>
      </div>
      <div class="output-row" :class="{ highlight: hasRealEigenvalues, danger: !hasRealEigenvalues }">
        <span class="label">特征值 λ₁</span>
        <span class="value">{{ lambda1Display }}</span>
      </div>
      <div class="output-row" :class="{ highlight: hasRealEigenvalues && !isRepeated, danger: !hasRealEigenvalues }">
        <span class="label">特征值 λ₂</span>
        <span class="value">{{ lambda2Display }}</span>
      </div>
      <div class="output-row">
        <span class="label">v = (cos θ, sin θ)</span>
        <span class="value">({{ vx.toFixed(3) }}, {{ vy.toFixed(3) }})</span>
      </div>
      <div class="output-row">
        <span class="label">A·v</span>
        <span class="value">({{ avx.toFixed(3) }}, {{ avy.toFixed(3) }})</span>
      </div>
      <div class="output-row">
        <span class="label">方向差异角 φ</span>
        <span class="value">{{ phiDisplay }}</span>
      </div>
      <div class="output-row" :class="{ locked: isLocked, exploring: !isLocked }">
        <span class="label">状态</span>
        <span class="value">{{ statusText }}</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">📐 特征方向探索</p>
      <p class="formula-line">特征方程：<span class="math">A&#119972; = λ&#119972;</span></p>
      <p class="formula-line">共线性条件（2D 叉积为零）：<span class="math">v × (A·v) = v<sub>x</sub>·(A·v)<sub>y</sub> − v<sub>y</sub>·(A·v)<sub>x</sub> = 0</span></p>
      <p class="formula-line">特征值估计（Rayleigh 商）：<span class="math">λ = (v · A·v) / (v · v) = v · A·v</span>（因为 |v| = 1）</p>
      <p class="formula-line hint-line" v-if="!hasRealEigenvalues">
        ⚠ 此矩阵判别式 Δ &lt; 0，无实特征方向，无论如何拖拽都无法锁定
      </p>
      <p class="formula-line hint-line" v-else-if="isRepeated">
        ⚠ 此矩阵为缺陷矩阵（重根但仅 1 个独立特征向量），仅能锁定 1 个方向
      </p>
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
    title: '特征方向探测 · 交互探索'
  }
)

const COLOR_V = 0x38bdf8
const COLOR_V_HOVER = 0x7dd3fc
const COLOR_AV = 0xfb923c
const COLOR_CIRCLE = 0x94a3b8
const COLOR_ELLIPSE = 0xef4444
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_GOLD = 0xfbbf24
const COLOR_GOLD_BRIGHT = 0xfde047
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb

const DEFAULT_MATRIX = { a: 1.5, b: 0, c: 0, d: 0.5 }
const mA = ref(DEFAULT_MATRIX.a)
const mB = ref(DEFAULT_MATRIX.b)
const mC = ref(DEFAULT_MATRIX.c)
const mD = ref(DEFAULT_MATRIX.d)

type Preset = 'anisotropic' | 'shear' | 'reflection' | 'rotation' | 'custom'
const preset = ref<Preset>('anisotropic')

const ROT30 = {
  a: Math.cos(Math.PI / 6),
  b: -Math.sin(Math.PI / 6),
  c: Math.sin(Math.PI / 6),
  d: Math.cos(Math.PI / 6)
}

function setPreset(p: Exclude<Preset, 'custom'>) {
  preset.value = p
  switch (p) {
    case 'anisotropic':
      mA.value = 1.5; mB.value = 0; mC.value = 0; mD.value = 0.5
      break
    case 'shear':
      mA.value = 1; mB.value = 1; mC.value = 0; mD.value = 1
      break
    case 'reflection':
      mA.value = 1; mB.value = 0; mC.value = 0; mD.value = -1
      break
    case 'rotation':
      mA.value = ROT30.a
      mB.value = ROT30.b
      mC.value = ROT30.c
      mD.value = ROT30.d
      break
  }
}

function resetMatrix() {
  preset.value = 'anisotropic'
  mA.value = DEFAULT_MATRIX.a
  mB.value = DEFAULT_MATRIX.b
  mC.value = DEFAULT_MATRIX.c
  mD.value = DEFAULT_MATRIX.d
}

watch([mA, mB, mC, mD], () => {
  const a = mA.value, b = mB.value, c = mC.value, d = mD.value
  const eps = 1e-6
  const matches = (xa: number, xb: number, xc: number, xd: number) =>
    Math.abs(a - xa) < eps && Math.abs(b - xb) < eps &&
    Math.abs(c - xc) < eps && Math.abs(d - xd) < eps
  if (matches(1.5, 0, 0, 0.5)) preset.value = 'anisotropic'
  else if (matches(1, 1, 0, 1)) preset.value = 'shear'
  else if (matches(1, 0, 0, -1)) preset.value = 'reflection'
  else if (matches(ROT30.a, ROT30.b, ROT30.c, ROT30.d)) preset.value = 'rotation'
  else preset.value = 'custom'
})

const trace = computed(() => mA.value + mD.value)
const det = computed(() => mA.value * mD.value - mB.value * mC.value)
const discriminant = computed(() => trace.value * trace.value - 4 * det.value)
const hasRealEigenvalues = computed(() => discriminant.value >= -1e-9)
const isRepeated = computed(() => Math.abs(discriminant.value) < 1e-6)

type Complex = { re: number; im: number }

const eigenvalues = computed<{ c1: Complex; c2: Complex }>(() => {
  const tr = trace.value
  const disc = discriminant.value
  if (disc >= 0) {
    const sq = Math.sqrt(disc)
    return { c1: { re: (tr + sq) / 2, im: 0 }, c2: { re: (tr - sq) / 2, im: 0 } }
  } else {
    const sq = Math.sqrt(-disc)
    return { c1: { re: tr / 2, im: sq / 2 }, c2: { re: tr / 2, im: -sq / 2 } }
  }
})

function formatComplex(c: Complex): string {
  const re = c.re
  const im = c.im
  if (Math.abs(im) < 1e-9) return re.toFixed(3)
  if (Math.abs(re) < 1e-9) return `${im.toFixed(3)}i`
  const sign = im >= 0 ? '+' : '−'
  return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`
}

const lambda1Display = computed(() => formatComplex(eigenvalues.value.c1))
const lambda2Display = computed(() => formatComplex(eigenvalues.value.c2))

const matrixDisplay = computed(() => {
  return `[[${mA.value.toFixed(2)}, ${mB.value.toFixed(2)}], [${mC.value.toFixed(2)}, ${mD.value.toFixed(2)}]]`
})

const discClass = computed(() => ({
  positive: discriminant.value > 1e-6,
  zero: Math.abs(discriminant.value) <= 1e-6,
  negative: discriminant.value < -1e-6
}))

const theta = ref(Math.PI / 4)
const vx = computed(() => Math.cos(theta.value))
const vy = computed(() => Math.sin(theta.value))
const avx = computed(() => mA.value * vx.value + mB.value * vy.value)
const avy = computed(() => mC.value * vx.value + mD.value * vy.value)

const normTheta = computed(() => {
  let t = theta.value % (2 * Math.PI)
  if (t > Math.PI) t -= 2 * Math.PI
  if (t <= -Math.PI) t += 2 * Math.PI
  return t
})

const thetaDeg = computed(() => normTheta.value * 180 / Math.PI)

const phiDeg = computed(() => {
  const cross = vx.value * avy.value - vy.value * avx.value
  const dot = vx.value * avx.value + vy.value * avy.value
  return Math.atan2(cross, dot) * 180 / Math.PI
})

const LOCK_THRESHOLD_DEG = 5
const LOCK_THRESHOLD_DEG_NEG = 175

const isLocked = computed(() => {
  if (!hasRealEigenvalues.value) return false

  const avMag = Math.hypot(avx.value, avy.value)
  if (avMag < 1e-6) return false
  const a = Math.abs(phiDeg.value)
  return a < LOCK_THRESHOLD_DEG || a > LOCK_THRESHOLD_DEG_NEG
})

const lockedLambda = computed(() => {
  if (!isLocked.value) return 0
  return vx.value * avx.value + vy.value * avy.value
})

const phiDisplay = computed(() => {
  if (Math.hypot(avx.value, avy.value) < 1e-6) return '—（A·v = 0）'
  return `${phiDeg.value.toFixed(1)}°`
})

const statusText = computed(() => {
  if (!hasRealEigenvalues.value) return '✗ 此矩阵无实特征方向'
  if (isLocked.value) return `✓ 找到特征方向（λ = ${lockedLambda.value.toFixed(3)}）`
  return '✗ 探索中'
})

const tipText = computed(() => {
  if (!hasRealEigenvalues.value) {
    return '当前矩阵判别式 Δ < 0，特征值为复数，对应纯旋转分量——不存在实特征方向。观察红色虚线椭圆：单位圆被旋转，没有任何方向能保持共线。尝试"旋转 30°"预设感受这种"永远找不到"的状态。'
  }
  if (isRepeated.value) {
    return '当前矩阵是缺陷矩阵（重根但仅 1 个独立特征向量）。拖拽 v 在单位圆上滑动，只能在 1 个特定方向触发"金色锁定"——这就是几何重数 < 代数重数的体现。'
  }
  return '拖拽天蓝色球体让 v 在单位圆上滑动，观察粉橙色虚线 A·v。当 v 与 A·v 共线（差异角 |φ| < 5°）时，v 会变金色发光并显示 λ 数值——你"挖到了"矩阵的固有方向！尝试不同预设矩阵，看看哪些容易锁定、哪些永远找不到。'
})

const canvasContainer = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let unitCircle: THREE.LineLoop
let ellipse: THREE.Line
let vArrow: THREE.ArrowHelper
let avArrow: THREE.ArrowHelper
let vSphere: THREE.Mesh
let vGlow: THREE.Mesh
let vTipGlow: THREE.Mesh
let originSphere: THREE.Mesh
let lambdaSprite: THREE.Sprite

const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2()
let isDragging = false
let isHovered = false

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

let glowPulse = 0
let glowOpacity = 0
let glowOpacityTarget = 0

let lambdaCanvas: HTMLCanvasElement
let lambdaCtx: CanvasRenderingContext2D
let lambdaTexture: THREE.CanvasTexture

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const N_CIRCLE = 96

function createLambdaSprite(): THREE.Sprite {
  lambdaCanvas = document.createElement('canvas')
  lambdaCanvas.width = 320
  lambdaCanvas.height = 128
  lambdaCtx = lambdaCanvas.getContext('2d')!
  lambdaTexture = new THREE.CanvasTexture(lambdaCanvas)
  lambdaTexture.needsUpdate = true
  const mat = new THREE.SpriteMaterial({
    map: lambdaTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.6, 0.64, 1)
  sprite.visible = false
  return sprite
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function updateLambdaSprite(lambda: number) {
  if (!lambdaCtx) return
  const text = `λ = ${lambda.toFixed(3)}`
  lambdaCtx.clearRect(0, 0, lambdaCanvas.width, lambdaCanvas.height)

  const pad = 8
  const w = lambdaCanvas.width - pad * 2
  const h = lambdaCanvas.height - pad * 2
  lambdaCtx.fillStyle = 'rgba(251, 191, 36, 0.95)'
  roundRect(lambdaCtx, pad, pad, w, h, 20)
  lambdaCtx.fill()

  lambdaCtx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  lambdaCtx.lineWidth = 3
  roundRect(lambdaCtx, pad, pad, w, h, 20)
  lambdaCtx.stroke()

  lambdaCtx.font = 'bold 56px monospace'
  lambdaCtx.textAlign = 'center'
  lambdaCtx.textBaseline = 'middle'
  lambdaCtx.fillStyle = '#1f2937'
  lambdaCtx.fillText(text, lambdaCanvas.width / 2, lambdaCanvas.height / 2)
  lambdaTexture.needsUpdate = true
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3, headLenScale = 0.25) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.35, Math.max(0.08, len * headLenScale))
    const headWid = Math.min(0.16, Math.max(0.04, len * 0.18))
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

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

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
  const viewSize = 5
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2,
    viewSize * aspect / 2,
    viewSize / 2,
    -viewSize / 2,
    -100,
    100
  )
  camera.position.set(0, 0, 10)
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
  controls.minZoom = 0.3
  controls.maxZoom = 5

  controls.enableRotate = false

  scene.add(new THREE.AmbientLight(0xffffff, 0.95))
  const dir = new THREE.DirectionalLight(0xffffff, 0.4)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(8, 16, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.4
  scene.add(grid)

  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 2.5)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 2.5)

  const origGeom = new THREE.SphereGeometry(0.06, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  const circleGeom = new THREE.BufferGeometry()
  const circlePts: number[] = []
  for (let i = 0; i < N_CIRCLE; i++) {
    const ang = (i / N_CIRCLE) * Math.PI * 2
    circlePts.push(Math.cos(ang), Math.sin(ang), 0)
  }
  circleGeom.setAttribute('position', new THREE.Float32BufferAttribute(circlePts, 3))
  const circleMat = new THREE.LineBasicMaterial({
    color: COLOR_CIRCLE,
    transparent: true,
    opacity: 0.6
  })
  unitCircle = new THREE.LineLoop(circleGeom, circleMat)
  scene.add(unitCircle)

  const ellipseGeom = new THREE.BufferGeometry()
  ellipseGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array((N_CIRCLE + 1) * 3), 3)
  )
  const ellipseMat = new THREE.LineDashedMaterial({
    color: COLOR_ELLIPSE,
    dashSize: 0.15,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.75
  })
  ellipse = new THREE.Line(ellipseGeom, ellipseMat)
  scene.add(ellipse)

  vArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_V, 0.25, 0.14
  )
  setArrowColor(vArrow, COLOR_V)
  scene.add(vArrow)

  avArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_AV, 0.25, 0.14
  )
  const avDashedMat = new THREE.LineDashedMaterial({
    color: COLOR_AV,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.95
  })
  avArrow.line.material = avDashedMat
  setArrowColor(avArrow, COLOR_AV)
  scene.add(avArrow)

  const sphereGeom = new THREE.SphereGeometry(0.13, 24, 24)
  const sphereMat = new THREE.MeshBasicMaterial({ color: COLOR_V })
  vSphere = new THREE.Mesh(sphereGeom, sphereMat)
  vSphere.position.set(vx.value, vy.value, 0.02)
  scene.add(vSphere)

  const glowGeom = new THREE.SphereGeometry(0.3, 24, 24)
  const glowMat = new THREE.MeshBasicMaterial({
    color: COLOR_GOLD,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  vGlow = new THREE.Mesh(glowGeom, glowMat)
  vGlow.position.set(vx.value, vy.value, 0.005)
  scene.add(vGlow)

  const tipGlowGeom = new THREE.SphereGeometry(0.55, 24, 24)
  const tipGlowMat = new THREE.MeshBasicMaterial({
    color: COLOR_GOLD_BRIGHT,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  vTipGlow = new THREE.Mesh(tipGlowGeom, tipGlowMat)
  vTipGlow.position.set(vx.value, vy.value, 0.003)
  scene.add(vTipGlow)

  lambdaSprite = createLambdaSprite()
  scene.add(lambdaSprite)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerUp)
  renderer.domElement.style.touchAction = 'none'

  updateScene()
}

function getMouseNDC(event: PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onPointerDown(event: PointerEvent) {
  if (!renderer || !camera || !vSphere) return
  getMouseNDC(event)
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(vSphere)
  if (intersects.length > 0) {
    isDragging = true
    controls.enabled = false
  }
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera || !vSphere) return
  getMouseNDC(event)
  if (isDragging) {
    raycaster.setFromCamera(mouseNDC, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {

      const ang = Math.atan2(intersection.y, intersection.x)
      theta.value = ang
    }
  } else {

    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObject(vSphere)
    isHovered = intersects.length > 0
    renderer.domElement.style.cursor = isHovered ? 'grab' : 'default'
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
  const a = mA.value, b = mB.value, c = mC.value, d = mD.value

  const ePos = ellipse.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i <= N_CIRCLE; i++) {
    const ang = (i / N_CIRCLE) * Math.PI * 2
    const x = Math.cos(ang)
    const y = Math.sin(ang)
    ePos.setXYZ(i, a * x + b * y, c * x + d * y, 0.001)
  }
  ePos.needsUpdate = true
  ellipse.computeLineDistances()

  const vVec = new THREE.Vector3(vx.value, vy.value, 0.01)
  const avVec = new THREE.Vector3(avx.value, avy.value, 0.008)
  setArrow(vArrow, vVec, 0.22)
  setArrow(avArrow, avVec, 0.22)

  avArrow.line.computeLineDistances()

  vSphere.position.set(vx.value, vy.value, 0.02)
  vGlow.position.set(vx.value, vy.value, 0.005)
  vTipGlow.position.set(vx.value, vy.value, 0.003)

  const sphereMat = vSphere.material as THREE.MeshBasicMaterial
  if (isLocked.value) {
    sphereMat.color.setHex(COLOR_GOLD)
    vSphere.scale.setScalar(1.25)
  } else if (isDragging) {
    sphereMat.color.setHex(COLOR_V_HOVER)
    vSphere.scale.setScalar(1.3)
  } else if (isHovered) {
    sphereMat.color.setHex(COLOR_V_HOVER)
    vSphere.scale.setScalar(1.15)
  } else {
    sphereMat.color.setHex(COLOR_V)
    vSphere.scale.setScalar(1.0)
  }

  if (isLocked.value) {
    setArrowColor(vArrow, COLOR_GOLD)
  } else {
    setArrowColor(vArrow, COLOR_V)
  }

  if (isLocked.value) {
    updateLambdaSprite(lockedLambda.value)
    lambdaSprite.visible = true

    const labelDist = 1.45
    lambdaSprite.position.set(
      vx.value * labelDist,
      vy.value * labelDist,
      0.03
    )
  } else {
    lambdaSprite.visible = false
  }

  glowOpacityTarget = isLocked.value ? 0.9 : 0
}

let lastTime = -1

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const now = time
  const dt = lastTime < 0 ? 0.016 : (now - lastTime) / 1000
  lastTime = now

  updateScene()

  const lerpFactor = Math.min(1, dt * 8)
  glowOpacity += (glowOpacityTarget - glowOpacity) * lerpFactor

  if (isLocked.value) {
    glowPulse += dt * 3.5
  }
  const pulseFactor = 0.6 + 0.4 * Math.sin(glowPulse)

  const glowMat = vGlow.material as THREE.MeshBasicMaterial
  glowMat.opacity = glowOpacity * pulseFactor
  vGlow.scale.setScalar(1.0 + 0.18 * Math.sin(glowPulse))

  const tipGlowMat = vTipGlow.material as THREE.MeshBasicMaterial
  tipGlowMat.opacity = glowOpacity * 0.55 * pulseFactor
  vTipGlow.scale.setScalar(1.0 + 0.25 * Math.sin(glowPulse + 0.5))

  controls.update()
  renderer.render(scene, camera)
}

function handleResize() {
  if (!canvasContainer.value || !renderer || !camera) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  if (width === 0 || height === 0) return
  const aspect = width / height
  const viewSize = 5
  camera.left = -viewSize * aspect / 2
  camera.right = viewSize * aspect / 2
  camera.top = viewSize / 2
  camera.bottom = -viewSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  try {
    initScene()
    if (renderer) animationId = requestAnimationFrame(animate)
  } catch (e) {
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('EigenDirectionFinder init error:', e)
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

watch([mA, mB, mC, mD], updateScene)
</script>

<style scoped>

.eigen-direction-finder {
  position: relative;
}

.gold-pulse-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: var(--radius-md);
  animation: gold-pulse 1.4s ease-in-out infinite;
  z-index: 5;
}

@keyframes gold-pulse {
  0%, 100% {
    box-shadow: inset 0 0 40px rgba(251, 191, 36, 0.35),
                inset 0 0 80px rgba(251, 191, 36, 0.15);
  }
  50% {
    box-shadow: inset 0 0 80px rgba(251, 191, 36, 0.75),
                inset 0 0 160px rgba(251, 191, 36, 0.35);
  }
}

.angle-display {
  margin: var(--space-2) 0;
  padding: 0.5em 1em;
  background: var(--bg-code);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.angle-display strong {
  color: var(--color-accent-strong);
  font-weight: 700;
}

.angle-display .angle-rad {
  color: var(--text-tertiary);
  font-size: var(--fs-xs);
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

.demo-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
  margin: var(--space-2) 0;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.demo-controls label {
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.demo-controls input[type='range'] {
  flex: 1;
  accent-color: var(--color-accent);
  cursor: pointer;
  min-width: 60px;
}

.demo-readout {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--color-accent-strong);
  font-weight: 600;
  min-width: 2.2em;
  text-align: right;
}

.matrix-display-inline {
  grid-column: 1 / -1;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  padding: 0.4em 0.6em;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-weight: 600;
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

.output-row.positive {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.output-row.positive .label,
.output-row.positive .value {
  color: var(--color-accent-strong);
}

.output-row.negative {
  border-color: var(--color-danger);
  background: var(--bg-danger-soft);
}

.output-row.negative .label,
.output-row.negative .value {
  color: var(--color-danger);
}

.output-row.zero {
  border-color: var(--color-warning);
  background: var(--bg-warning-soft);
}

.output-row.zero .label,
.output-row.zero .value {
  color: var(--color-warning);
}

.output-row.locked {
  background: rgba(251, 191, 36, 0.22);
  border-color: #fbbf24;
  animation: row-pulse 1.4s ease-in-out infinite;
}

.output-row.locked .label,
.output-row.locked .value {
  color: #b45309;
  font-weight: 700;
}

.output-row.exploring {
  background: var(--bg-content);
  border-color: var(--border-color);
}

@keyframes row-pulse {
  0%, 100% {
    background: rgba(251, 191, 36, 0.18);
  }
  50% {
    background: rgba(251, 191, 36, 0.35);
  }
}

.matrix-display {
  font-family: var(--font-mono);
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
    currentColor 0,
    currentColor 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 20px;
  color: inherit;
}

.formula-block {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(56, 189, 248, 0.06));
  border: 1px solid var(--border-color);
  border-left: 3px solid #fbbf24;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
}

.formula-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #b45309;
  text-align: center;
}

.formula-line {
  margin: 0.25em 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.7;
}

.formula-line .math {
  font-style: italic;
  color: var(--color-accent-strong);
  font-weight: 600;
}

.formula-line.hint-line {
  color: var(--color-warning);
  font-weight: 600;
  margin-top: var(--space-2);
}

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
  line-height: 1.6;
}
</style>
