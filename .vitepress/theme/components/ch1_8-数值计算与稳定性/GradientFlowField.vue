<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="function-selector">
      <button
        v-for="fn in lossFunctionList"
        :key="fn.key"
        :class="{ active: currentFnKey === fn.key }"
        @click="selectFunction(fn.key)"
      >
        {{ fn.label }}
      </button>
    </div>

    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>
    <div v-if="warningMsg" class="demo-status" :class="warningType">{{ warningMsg }}</div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch gradient-blue-red"></span>
        <span>损失地形（蓝低 → 红高）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>梯度向量场（金）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#ffffff;border:1px solid #888"></span>
        <span>下降小球（可拖拽）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch gradient-red-yellow"></span>
        <span>下降轨迹（红→黄）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed-white"></span>
        <span>等高线投影</span>
      </span>
    </div>

    <div class="control-buttons">
      <button class="play-btn" :disabled="isDescending || (isFinished && trajectory.length > 0)" @click="startDescent">
        开始下降
      </button>
      <button class="pause-btn" :disabled="!isDescending" @click="pauseDescent">暂停</button>
      <button class="reset-btn" @click="resetDescent">重置</button>
      <button class="step-btn" :disabled="isDescending || isFinished" @click="stepDescent">
        单步执行
      </button>
      <span class="iter-info">k = {{ descentStepIndex }} / {{ Math.max(0, trajectory.length - 1) }}</span>
    </div>

    <div class="param-panel">
      <div class="param-row">
        <label>
          <span class="slider-label">学习率 η</span>
          <input
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            :value="learningRate"
            @input="onLearningRateChange(parseFloat(($event.target as HTMLInputElement).value))"
          />
          <span class="slider-val">{{ learningRate.toFixed(3) }}</span>
        </label>
      </div>
      <div class="preset-points">
        <span class="preset-label">预设起点：</span>
        <button
          v-for="p in presetPoints"
          :key="p.label"
          @click="setStartPoint(p.x, p.y)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="numeric-panel">
      <p class="block-title">数值显示面板</p>
      <div class="numeric-grid">
        <div class="output-row">
          <span class="label">当前位置 (x, y, f)</span>
          <span class="value">
            ({{ currentPos.x.toFixed(4) }}, {{ currentPos.y.toFixed(4) }}, {{ currentPos.f.toFixed(4) }})
          </span>
        </div>
        <div class="output-row">
          <span class="label">梯度向量 ∇f</span>
          <span class="value">
            ({{ currentGrad[0].toFixed(4) }}, {{ currentGrad[1].toFixed(4) }})
          </span>
        </div>
        <div class="output-row" :class="{ highlight: isConverged || currentGradNorm < 0.01, danger: isDiverged }">
          <span class="label">梯度范数 ‖∇f‖</span>
          <span class="value">{{ currentGradNorm.toFixed(6) }}</span>
        </div>
        <div class="output-row">
          <span class="label">海森矩阵 H</span>
          <span class="value">{{ hessianDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">当前步数 k</span>
          <span class="value">{{ descentStepIndex }}</span>
        </div>
        <div class="output-row">
          <span class="label">学习率 η</span>
          <span class="value">{{ learningRate.toFixed(4) }}</span>
        </div>
        <div class="output-row">
          <span class="label">轨迹长度（累计）</span>
          <span class="value">{{ trajectoryLength.toFixed(4) }}</span>
        </div>
        <div class="output-row" :class="convergenceClass">
          <span class="label">是否收敛</span>
          <span class="value">{{ convergenceLabel }}</span>
        </div>
        <div class="output-row" :class="{ highlight: gradMatch }">
          <span class="label">数值梯度验证（中心差分 h=1e-5）</span>
          <span class="value">
            ({{ numericalGrad[0].toFixed(4) }}, {{ numericalGrad[1].toFixed(4) }})
            {{ gradMatch ? '对' : '错' }}
          </span>
        </div>
      </div>
    </div>

    <div class="jacobian-panel">
      <p class="block-title">
        雅可比矩阵 J
        <button
          v-if="currentFnKey === 'quadratic'"
          class="toggle-btn"
          @click="toggleJacobianMode"
        >
          切换：{{ jacobianMode === 'gradient' ? '当前=梯度模式' : '当前=向量值函数模式' }}
        </button>
      </p>
      <div class="jacobian-content">
        <table class="matrix-table">
          <tr v-for="(row, i) in jacobianMatrix" :key="i">
            <td v-for="(val, j) in row" :key="j">{{ val.toFixed(4) }}</td>
          </tr>
        </table>
        <p class="jacobian-desc">{{ jacobianDescription }}</p>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">梯度、雅可比与链式法则</p>
      <p class="formula-line">梯度定义：<span class="math">∇f = (∂f/∂x₁, …, ∂f/∂xₙ)</span></p>
      <p class="formula-line">梯度下降：<span class="math">x<sub>k+1</sub> = x<sub>k</sub> − η ∇f(x<sub>k</sub>)</span></p>
      <p class="formula-line">雅可比矩阵：<span class="math">J<sub>ij</sub> = ∂f<sub>i</sub>/∂x<sub>j</sub></span>（标量函数的雅可比即梯度转置）</p>
      <p class="formula-line">链式法则：<span class="math">∂f/∂x = Σ<sub>i</sub> (∂f/∂y<sub>i</sub>)(∂y<sub>i</sub>/∂x)</span></p>
      <p class="formula-line">收敛判定：<span class="math">‖∇f(x<sub>k</sub>)‖ &lt; ε</span>（此处 ε = 0.01）</p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '梯度、雅可比与链式法则 · 损失地形上的最速下降'
  }
)

const COLOR_TERRAIN_LOW = '#3b82f6'
const COLOR_TERRAIN_MID1 = '#06b6d4'
const COLOR_TERRAIN_MID2 = '#fbbf24'
const COLOR_TERRAIN_HIGH = '#ef4444'
const COLOR_GRADIENT_ARROW = 0xfbbf24
const COLOR_BALL = 0xffffff
const COLOR_BALL_HOVER = 0xfde68a
const COLOR_TRAJ_START = '#ef4444'
const COLOR_TRAJ_END = '#fbbf24'
const COLOR_CONTOUR = 0xffffff
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb

type Mat2 = [[number, number], [number, number]]
type FunctionKey = 'rosenbrock' | 'quadratic' | 'nonconvex'

interface LossFunction {
  key: FunctionKey
  label: string
  description: string
  fn: (x: number, y: number) => number
  grad: (x: number, y: number) => [number, number]
  hessian: (x: number, y: number) => Mat2
  domain: { xMin: number; xMax: number; yMin: number; yMax: number }
  displayMax: number
  minPoint: { x: number; y: number }
}

const rosenbrockFn: LossFunction = {
  key: 'rosenbrock',
  label: 'Rosenbrock（香蕉谷）',
  description: 'f(x,y) = (1-x)² + 100(y-x²)²，经典 AI 优化难点',
  fn: (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2,
  grad: (x, y) => {
    const gx = 2 * (x - 1) + 400 * x * (x * x - y)
    const gy = 200 * (y - x * x)
    return [gx, gy]
  },
  hessian: (x, y) => {
    const hxx = 2 + 400 * (3 * x * x - y)
    const hxy = -400 * x
    const hyy = 200
    return [[hxx, hxy], [hxy, hyy]]
  },
  domain: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
  displayMax: 50,
  minPoint: { x: 1, y: 1 }
}

const quadraticFn: LossFunction = {
  key: 'quadratic',
  label: '二次型（凸函数）',
  description: 'f(x,y) = 0.5(x² + xy + y²)，凸函数，等高线为椭圆',
  fn: (x, y) => 0.5 * (x * x + x * y + y * y),
  grad: (x, y) => {
    const gx = x + 0.5 * y
    const gy = 0.5 * x + y
    return [gx, gy]
  },
  hessian: () => [[1, 0.5], [0.5, 1]],
  domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  displayMax: 10,
  minPoint: { x: 0, y: 0 }
}

const nonconvexFn: LossFunction = {
  key: 'nonconvex',
  label: '非凸多峰',
  description: 'f(x,y) = sin(x) + cos(y) + 0.1(x²+y²)，有多个局部极小值',
  fn: (x, y) => Math.sin(x) + Math.cos(y) + 0.1 * (x * x + y * y),
  grad: (x, y) => {
    const gx = Math.cos(x) + 0.2 * x
    const gy = -Math.sin(y) + 0.2 * y
    return [gx, gy]
  },
  hessian: (x, y) => {
    const hxx = -Math.sin(x) + 0.2
    const hyy = -Math.cos(y) + 0.2
    return [[hxx, 0], [0, hyy]]
  },
  domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  displayMax: 5,
  minPoint: { x: -Math.PI / 2, y: 0 }
}

const LOSS_FUNCTIONS: Record<FunctionKey, LossFunction> = {
  rosenbrock: rosenbrockFn,
  quadratic: quadraticFn,
  nonconvex: nonconvexFn
}

const lossFunctionList: LossFunction[] = [rosenbrockFn, quadraticFn, nonconvexFn]

const currentFnKey = ref<FunctionKey>('rosenbrock')
const learningRate = ref(0.01)
const startPoint = ref({ x: -2, y: 2 })

interface TrajectoryPoint {
  x: number
  y: number
  f: number
}

const trajectory = ref<TrajectoryPoint[]>([])
const descentStepIndex = ref(0)
const isDescending = ref(false)
const isConverged = ref(false)
const isDiverged = ref(false)

type JacobianMode = 'gradient' | 'vector'
const jacobianMode = ref<JacobianMode>('gradient')

const presetPoints = [
  { label: '高起点', x: -2, y: 2 },
  { label: '中起点', x: 0, y: 0 },
  { label: '低起点', x: 1.5, y: 1.5 },
  { label: '极值点附近', x: 0.9, y: 0.8 }
]

const warningMsg = ref('')
const warningType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const currentFn = computed(() => LOSS_FUNCTIONS[currentFnKey.value])

const currentPos = computed(() => {
  if (trajectory.value.length === 0) {
    const { x, y } = startPoint.value
    return { x, y, f: currentFn.value.fn(x, y) }
  }
  const idx = Math.min(descentStepIndex.value, trajectory.value.length - 1)
  return trajectory.value[idx]
})

const currentGrad = computed<[number, number]>(() => {
  const { x, y } = currentPos.value
  return currentFn.value.grad(x, y)
})

const currentGradNorm = computed(() => {
  const [gx, gy] = currentGrad.value
  return Math.hypot(gx, gy)
})

const currentHessian = computed<Mat2>(() => {
  const { x, y } = currentPos.value
  return currentFn.value.hessian(x, y)
})

const hessianDisplay = computed(() => {
  const h = currentHessian.value
  return `[[${h[0][0].toFixed(3)}, ${h[0][1].toFixed(3)}], [${h[1][0].toFixed(3)}, ${h[1][1].toFixed(3)}]]`
})

const trajectoryLength = computed(() => {
  if (trajectory.value.length < 2) return 0
  let len = 0
  const visible = Math.min(descentStepIndex.value + 1, trajectory.value.length)
  for (let i = 1; i < visible; i++) {
    const dx = trajectory.value[i].x - trajectory.value[i - 1].x
    const dy = trajectory.value[i].y - trajectory.value[i - 1].y
    len += Math.hypot(dx, dy)
  }
  return len
})

const isFinished = computed(() => {
  if (trajectory.value.length === 0) return false
  return descentStepIndex.value >= trajectory.value.length - 1
})

const convergenceLabel = computed(() => {
  if (isDiverged.value) return '发散'
  if (isConverged.value) return '收敛'
  if (currentGradNorm.value < 0.01) return '收敛（‖∇f‖ < 0.01）'
  if (trajectory.value.length === 0) return '— 未开始'
  return '迭代中…'
})

const convergenceClass = computed(() => ({
  highlight: isConverged.value || currentGradNorm.value < 0.01,
  danger: isDiverged.value
}))

const numericalGrad = computed<[number, number]>(() => {
  const { x, y } = currentPos.value
  const h = 1e-5
  const fn = currentFn.value.fn
  const gx = (fn(x + h, y) - fn(x - h, y)) / (2 * h)
  const gy = (fn(x, y + h) - fn(x, y - h)) / (2 * h)
  return [gx, gy]
})

const gradMatch = computed(() => {
  const [ax, ay] = currentGrad.value
  const [nx, ny] = numericalGrad.value

  const scale = Math.max(1, Math.hypot(ax, ay))
  return Math.abs(ax - nx) / scale < 1e-4 && Math.abs(ay - ny) / scale < 1e-4
})

const jacobianMatrix = computed<number[][]>(() => {
  if (currentFnKey.value === 'quadratic' && jacobianMode.value === 'vector') {

    return [[1, 0.5], [0.5, 1]]
  }

  const [gx, gy] = currentGrad.value
  return [[gx, gy]]
})

const jacobianDescription = computed(() => {
  if (currentFnKey.value === 'quadratic' && jacobianMode.value === 'vector') {
    return '向量值函数 F(x,y) = A·[x,y]ᵀ 的雅可比 J = A（常数矩阵，线性映射的雅可比不依赖位置）'
  }
  return '标量函数 f: ℝ² → ℝ 的雅可比 J = ∇fᵀ（1×2 矩阵，即梯度转置）'
})

const tipText = computed(() => {
  let base = `${currentFn.value.description}。`
  base += '金色箭头表示梯度方向（最速上升方向），下降小球沿 −∇f 方向移动。'
  base += '拖拽白色小球可改变起始点（射线命中曲面）。'
  if (isConverged.value) {
    base += '当前已收敛（‖∇f‖ < 0.01）。'
  } else if (isDiverged.value) {
    base += '当前轨迹发散，请减小学习率 η。'
  }
  return base
})

function selectFunction(key: FunctionKey) {
  if (key === currentFnKey.value) return
  currentFnKey.value = key
  resetDescent()
  rebuildScene()
}

function setStartPoint(x: number, y: number) {
  startPoint.value = { x, y }
  resetDescent()
}

function toggleJacobianMode() {
  jacobianMode.value = jacobianMode.value === 'gradient' ? 'vector' : 'gradient'
}

function onLearningRateChange(value: number) {
  learningRate.value = Math.max(0.001, Math.min(0.1, value))

  if (trajectory.value.length > 0) {
    resetDescent()
  }
}

function computeTrajectory() {
  const traj: TrajectoryPoint[] = []
  const fn = currentFn.value
  let x = startPoint.value.x
  let y = startPoint.value.y
  const eta = learningRate.value
  const maxSteps = 200

  traj.push({ x, y, f: fn.fn(x, y) })

  let converged = false
  let diverged = false

  for (let k = 0; k < maxSteps; k++) {
    const [gx, gy] = fn.grad(x, y)
    const norm = Math.hypot(gx, gy)
    if (norm < 0.01) {
      converged = true
      break
    }
    x -= eta * gx
    y -= eta * gy

    x = Math.max(-3, Math.min(3, x))
    y = Math.max(-3, Math.min(3, y))

    if (Math.hypot(x, y) > 10) {
      diverged = true
      break
    }
    traj.push({ x, y, f: fn.fn(x, y) })
  }

  trajectory.value = traj
  isConverged.value = converged
  isDiverged.value = diverged

  if (diverged) {
    warningMsg.value = '轨迹发散（‖x‖ > 10），请减小学习率 η'
    warningType.value = 'warning'
  } else if (converged) {
    const last = traj[traj.length - 1]
    warningMsg.value = `收敛于 (${last.x.toFixed(4)}, ${last.y.toFixed(4)})，共 ${traj.length - 1} 步`
    warningType.value = 'success'
  } else {
    warningMsg.value = `ℹ 达到最大步数 200 未收敛，当前 ‖∇f‖ = ${currentGradNorm.value.toFixed(4)}`
    warningType.value = 'info'
  }
}

function startDescent() {
  if (isDescending.value) return

  if (trajectory.value.length === 0 || isFinished.value) {
    computeTrajectory()
    descentStepIndex.value = 0
  }
  isDescending.value = true
}

function pauseDescent() {
  isDescending.value = false
}

function resetDescent() {
  isDescending.value = false
  descentStepIndex.value = 0
  trajectory.value = []
  isConverged.value = false
  isDiverged.value = false
  warningMsg.value = ''
}

function stepDescent() {
  if (isDescending.value) return
  if (trajectory.value.length === 0) {
    computeTrajectory()
    descentStepIndex.value = 0
  }
  if (descentStepIndex.value < trajectory.value.length - 1) {
    descentStepIndex.value++
  }
}

const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let surfaceMesh: THREE.Mesh
let surfaceWire: THREE.LineSegments
let contourGroup: THREE.Group
let gradientArrows: THREE.InstancedMesh
let ball: THREE.Mesh
let trajectoryLine: THREE.Line
let originSphere: THREE.Mesh
let axesGroup: THREE.Group

const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2()
let isDragging = false
let isHovered = false

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const DISPLAY_HEIGHT = 4
const SURFACE_RES = 60
const GRADIENT_RES = 15

let displayFMin = 0
let displayFMax = 1

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]
}

function lerpColorRGB(c1: string, c2: string, t: number): [number, number, number] {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  return [
    (r1 + (r2 - r1) * t) / 255,
    (g1 + (g2 - g1) * t) / 255,
    (b1 + (b2 - b1) * t) / 255
  ]
}

function terrainColor(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t))
  if (t < 1 / 3) {
    return lerpColorRGB(COLOR_TERRAIN_LOW, COLOR_TERRAIN_MID1, t * 3)
  } else if (t < 2 / 3) {
    return lerpColorRGB(COLOR_TERRAIN_MID1, COLOR_TERRAIN_MID2, (t - 1 / 3) * 3)
  } else {
    return lerpColorRGB(COLOR_TERRAIN_MID2, COLOR_TERRAIN_HIGH, (t - 2 / 3) * 3)
  }
}

function fToDisplayHeight(f: number, fMin: number, fMax: number): number {
  if (fMax === fMin) return 0
  const t = (f - fMin) / (fMax - fMin)
  return Math.max(0, Math.min(DISPLAY_HEIGHT, t * DISPLAY_HEIGHT))
}

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 500

  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 场景'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看。</div>'
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(5, 4, 6)
  camera.lookAt(0, 1, 0)

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
  controls.target.set(0, 1, 0)
  controls.minDistance = 3
  controls.maxDistance = 20

  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
  dirLight.position.set(5, 8, 6)
  scene.add(dirLight)
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
  dirLight2.position.set(-5, -3, -6)
  scene.add(dirLight2)

  const grid = new THREE.GridHelper(8, 16, COLOR_GRID, 0xf1f5f9)
  const gridMat = grid.material as THREE.Material
  gridMat.transparent = true
  gridMat.opacity = 0.5
  grid.position.y = -0.05
  scene.add(grid)

  axesGroup = new THREE.Group()
  createAxis(new THREE.Vector3(1, 0, 0), COLOR_AXIS_X, 2.5)
  createAxis(new THREE.Vector3(0, 1, 0), COLOR_AXIS_Y, 2.5)
  createAxis(new THREE.Vector3(0, 0, 1), COLOR_AXIS_Z, 2.5)
  scene.add(axesGroup)

  const origGeom = new THREE.SphereGeometry(0.06, 16, 12)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  contourGroup = new THREE.Group()
  scene.add(contourGroup)

  buildSurface()
  buildGradientField()
  buildContourLines()

  const ballGeom = new THREE.SphereGeometry(0.12, 24, 20)
  const ballMat = new THREE.MeshPhongMaterial({
    color: COLOR_BALL,
    emissive: 0x444444,
    shininess: 80
  })
  ball = new THREE.Mesh(ballGeom, ballMat)
  scene.add(ball)

  const trajGeom = new THREE.BufferGeometry()
  const MAX_TRAJ_POINTS = 600
  trajGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_TRAJ_POINTS * 3), 3))
  trajGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_TRAJ_POINTS * 3), 3))
  trajGeom.setDrawRange(0, 0)
  const trajMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    linewidth: 2,
    transparent: true,
    opacity: 0.95
  })
  trajectoryLine = new THREE.Line(trajGeom, trajMat)
  scene.add(trajectoryLine)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerUp)
  renderer.domElement.style.touchAction = 'none'

  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(container)

  initStatus.value = '3D 场景已就绪 · 拖拽白色小球改变起点 · 鼠标拖拽旋转视角'
  initStatusType.value = 'success'

  animate(0)
}

function createAxis(dir: THREE.Vector3, color: number, length: number) {
  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, color, 0.2, 0.1)
  const lineMat = arrow.line.material as THREE.LineBasicMaterial
  lineMat.transparent = true
  lineMat.opacity = 0.7
  const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
  coneMat.transparent = true
  coneMat.opacity = 0.7
  axesGroup.add(arrow)
}

function buildSurface() {

  if (surfaceMesh) {
    scene.remove(surfaceMesh)
    surfaceMesh.geometry.dispose()
    ;(surfaceMesh.material as THREE.Material).dispose()
  }
  if (surfaceWire) {
    scene.remove(surfaceWire)
    surfaceWire.geometry.dispose()
    ;(surfaceWire.material as THREE.Material).dispose()
  }

  const fn = currentFn.value
  const { xMin, xMax, yMin, yMax } = fn.domain
  const res = SURFACE_RES
  const dx = (xMax - xMin) / res
  const dy = (yMax - yMin) / res

  const samples: number[][] = []
  let fMin = Infinity
  let fMax = -Infinity
  for (let i = 0; i <= res; i++) {
    samples[i] = []
    for (let j = 0; j <= res; j++) {
      const x = xMin + i * dx
      const y = yMin + j * dy
      let f = fn.fn(x, y)
      f = Math.max(0, Math.min(fn.displayMax, f))
      samples[i][j] = f
      if (f < fMin) fMin = f
      if (f > fMax) fMax = f
    }
  }
  if (fMax === fMin) fMax = fMin + 1

  displayFMin = fMin
  displayFMax = fMax

  const vertices: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res; j++) {
      const x = xMin + i * dx
      const y = yMin + j * dy
      const f = samples[i][j]
      const h = fToDisplayHeight(f, fMin, fMax)

      vertices.push(x, h, y)
      const t = (f - fMin) / (fMax - fMin)
      const [r, g, b] = terrainColor(t)
      colors.push(r, g, b)
    }
  }

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const a = i * (res + 1) + j
      const b = a + 1
      const c = a + (res + 1)
      const d = c + 1
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    shininess: 60,
    flatShading: false
  })
  surfaceMesh = new THREE.Mesh(geom, mat)
  scene.add(surfaceMesh)

  const wireGeom = new THREE.WireframeGeometry(geom)
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.15
  })
  surfaceWire = new THREE.LineSegments(wireGeom, wireMat)
  scene.add(surfaceWire)
}

function buildGradientField() {
  if (gradientArrows) {
    scene.remove(gradientArrows)
    gradientArrows.geometry.dispose()
    ;(gradientArrows.material as THREE.Material).dispose()
  }

  const fn = currentFn.value
  const { xMin, xMax, yMin, yMax } = fn.domain
  const res = GRADIENT_RES
  const dx = (xMax - xMin) / res
  const dy = (yMax - yMin) / res

  const arrowGeo = createArrowGeometry()
  const arrowMat = new THREE.MeshBasicMaterial({
    color: COLOR_GRADIENT_ARROW,
    transparent: true,
    opacity: 0.85
  })

  const totalArrows = (res + 1) * (res + 1)
  gradientArrows = new THREE.InstancedMesh(arrowGeo, arrowMat, totalArrows)
  scene.add(gradientArrows)

  const matrix = new THREE.Matrix4()
  const quat = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const dir = new THREE.Vector3()
  const scale = new THREE.Vector3()
  const position = new THREE.Vector3()
  let idx = 0
  const maxArrowLen = 0.5

  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res; j++) {
      const x = xMin + i * dx
      const y = yMin + j * dy
      const [gx, gy] = fn.grad(x, y)
      const norm = Math.hypot(gx, gy)
      let f = fn.fn(x, y)
      f = Math.max(0, Math.min(fn.displayMax, f))
      const h = fToDisplayHeight(f, displayFMin, displayFMax)

      position.set(x, h, y)

      if (norm > 1e-6) {
        dir.set(gx, 0, gy).normalize()
      } else {
        dir.set(0, 1, 0)
      }
      quat.setFromUnitVectors(up, dir)

      const len = Math.min(0.3 * norm, maxArrowLen)
      scale.set(1, Math.max(0.001, len), 1)
      matrix.compose(position, quat, scale)
      gradientArrows.setMatrixAt(idx, matrix)
      idx++
    }
  }
  gradientArrows.instanceMatrix.needsUpdate = true
}

function createArrowGeometry(): THREE.BufferGeometry {
  const bodyLength = 0.8
  const headLength = 0.2
  const headWidth = 0.06

  const body = new THREE.CylinderGeometry(headWidth * 0.4, headWidth * 0.4, bodyLength, 8)
  body.translate(0, bodyLength / 2, 0)

  const head = new THREE.ConeGeometry(headWidth, headLength, 12)
  head.translate(0, bodyLength + headLength / 2, 0)

  return mergeGeometries([body, head])!
}

function buildContourLines() {

  while (contourGroup.children.length > 0) {
    const child = contourGroup.children[0]
    contourGroup.remove(child)
    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose()
      ;(child.material as THREE.Material).dispose()
    }
  }

  const fn = currentFn.value
  const { xMin, xMax, yMin, yMax } = fn.domain
  const res = 60
  const dx = (xMax - xMin) / res
  const dy = (yMax - yMin) / res

  const grid: number[][] = []
  let fMin = Infinity
  let fMax = -Infinity
  for (let i = 0; i <= res; i++) {
    grid[i] = []
    for (let j = 0; j <= res; j++) {
      let f = fn.fn(xMin + i * dx, yMin + j * dy)
      f = Math.max(0, Math.min(fn.displayMax, f))
      grid[i][j] = f
      if (f < fMin) fMin = f
      if (f > fMax) fMax = f
    }
  }

  const totalLevels = 25
  const drawEveryNth = 5
  const levels: number[] = []
  for (let i = 1; i < totalLevels; i++) {
    if (i % drawEveryNth !== 0) continue
    const t = i / totalLevels
    levels.push(fMin + t * (fMax - fMin))
  }

  const positions: number[] = []
  for (const level of levels) {
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const x0 = xMin + i * dx
        const x1 = xMin + (i + 1) * dx
        const y0 = yMin + j * dy
        const y1 = yMin + (j + 1) * dy
        const segs = marchingSquares(grid, i, j, x0, x1, y0, y1, level)
        for (const [p1, p2] of segs) {

          positions.push(p1.x, 0.01, p1.z, p2.x, 0.01, p2.z)
        }
      }
    }
  }

  if (positions.length === 0) return

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const mat = new THREE.LineBasicMaterial({
    color: COLOR_CONTOUR,
    transparent: true,
    opacity: 0.4
  })
  const lines = new THREE.LineSegments(geom, mat)
  contourGroup.add(lines)
}

function marchingSquares(
  grid: number[][],
  i: number,
  j: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  level: number
): [THREE.Vector3, THREE.Vector3][] {
  const f00 = grid[i][j]
  const f10 = grid[i + 1][j]
  const f11 = grid[i + 1][j + 1]
  const f01 = grid[i][j + 1]

  const code =
    (f00 > level ? 1 : 0) |
    (f10 > level ? 2 : 0) |
    (f11 > level ? 4 : 0) |
    (f01 > level ? 8 : 0)

  if (code === 0 || code === 15) return []

  const interp = (fa: number, fb: number, a: number, b: number) => {
    const denom = fb - fa
    if (Math.abs(denom) < 1e-12) return (a + b) / 2
    const t = (level - fa) / denom
    return a + (b - a) * t
  }

  const bottom = (code & 1) !== (code & 2)
    ? new THREE.Vector3(interp(f00, f10, x0, x1), 0, y0)
    : null
  const right = (code & 2) !== (code & 4)
    ? new THREE.Vector3(x1, 0, interp(f10, f11, y0, y1))
    : null
  const top = (code & 4) !== (code & 8)
    ? new THREE.Vector3(interp(f01, f11, x0, x1), 0, y1)
    : null
  const left = (code & 8) !== (code & 1)
    ? new THREE.Vector3(x0, 0, interp(f00, f01, y0, y1))
    : null

  const segments: [THREE.Vector3, THREE.Vector3][] = []
  switch (code) {
    case 1: case 14: if (left && bottom) segments.push([left, bottom]); break
    case 2: case 13: if (bottom && right) segments.push([bottom, right]); break
    case 3: case 12: if (left && right) segments.push([left, right]); break
    case 4: case 11: if (top && right) segments.push([top, right]); break
    case 5: if (left && top) segments.push([left, top]); if (bottom && right) segments.push([bottom, right]); break
    case 6: case 9: if (bottom && top) segments.push([bottom, top]); break
    case 7: case 8: if (left && top) segments.push([left, top]); break
    case 10: if (left && bottom) segments.push([left, bottom]); if (top && right) segments.push([top, right]); break
  }
  return segments
}

function updateBallPositionSmooth() {
  if (!ball) return
  const fn = currentFn.value
  const total = trajectory.value.length
  let x: number, y: number, f: number

  if (total === 0 || descentStepIndex.value === 0) {

    x = startPoint.value.x
    y = startPoint.value.y
    f = fn.fn(x, y)
  } else {

    const idx = Math.min(descentStepIndex.value, total - 1)
    const nextIdx = Math.min(idx + 1, total - 1)
    const p0 = trajectory.value[idx]
    const p1 = trajectory.value[nextIdx]
    const t = isDescending.value ? descentLerpProgress : 0
    x = p0.x + (p1.x - p0.x) * t
    y = p0.y + (p1.y - p0.y) * t
    f = fn.fn(x, y)
  }

  f = Math.max(0, Math.min(fn.displayMax, f))
  const h = fToDisplayHeight(f, displayFMin, displayFMax)
  ball.position.set(x, h + 0.15, y)

  const ballMat = ball.material as THREE.MeshPhongMaterial
  if (isDragging) {
    ballMat.color.setHex(COLOR_BALL_HOVER)
    ball.scale.setScalar(1.3)
  } else if (isHovered) {
    ballMat.color.setHex(COLOR_BALL_HOVER)
    ball.scale.setScalar(1.15)
  } else {
    ballMat.color.setHex(COLOR_BALL)
    ball.scale.setScalar(1.0)
  }
}

function updateTrajectoryLine() {
  if (!trajectoryLine) return
  const total = trajectory.value.length
  if (total < 1 || descentStepIndex.value < 0) {
    trajectoryLine.geometry.setDrawRange(0, 0)
    return
  }

  const fn = currentFn.value
  const visibleCount = Math.min(descentStepIndex.value + 1, total)

  const points: THREE.Vector3[] = []
  for (let i = 0; i < visibleCount; i++) {
    const p = trajectory.value[i]
    let f = p.f
    f = Math.max(0, Math.min(fn.displayMax, f))
    const h = fToDisplayHeight(f, displayFMin, displayFMax)
    points.push(new THREE.Vector3(p.x, h + 0.1, p.y))
  }

  if (points.length < 2) {
    trajectoryLine.geometry.setDrawRange(0, 0)
    return
  }

  const curve = new THREE.CatmullRomCurve3(points)
  const sampledPoints = curve.getPoints(Math.min(300, points.length * 10))

  const posAttr = trajectoryLine.geometry.attributes.position as THREE.BufferAttribute
  const colAttr = trajectoryLine.geometry.attributes.color as THREE.BufferAttribute
  const maxPoints = posAttr.count

  const writeCount = Math.min(sampledPoints.length, maxPoints)
  for (let i = 0; i < writeCount; i++) {
    const p = sampledPoints[i]
    posAttr.setXYZ(i, p.x, p.y, p.z)

    const t = i / Math.max(1, writeCount - 1)
    const [r, g, b] = lerpColorRGB(COLOR_TRAJ_START, COLOR_TRAJ_END, t)
    colAttr.setXYZ(i, r, g, b)
  }
  posAttr.needsUpdate = true
  colAttr.needsUpdate = true
  trajectoryLine.geometry.setDrawRange(0, writeCount)
}

function getMouseNDC(event: PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onPointerDown(event: PointerEvent) {
  if (!renderer || !camera || !ball) return
  getMouseNDC(event)
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(ball)
  if (intersects.length > 0) {
    isDragging = true
    controls.enabled = false
  }
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera || !ball || !surfaceMesh) return
  getMouseNDC(event)
  if (isDragging) {

    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObject(surfaceMesh)
    if (intersects.length > 0) {
      const pt = intersects[0].point

      const fn = currentFn.value
      const x = Math.max(fn.domain.xMin, Math.min(fn.domain.xMax, pt.x))
      const y = Math.max(fn.domain.yMin, Math.min(fn.domain.yMax, pt.z))
      startPoint.value = { x, y }
      resetDescent()
    }
  } else {

    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObject(ball)
    const wasHovered = isHovered
    isHovered = intersects.length > 0
    renderer.domElement.style.cursor = isHovered ? 'grab' : 'default'
    if (wasHovered !== isHovered) {
      updateBallPositionSmooth()
    }
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

function rebuildScene() {
  if (!scene) return
  buildSurface()
  buildGradientField()
  buildContourLines()
  updateBallPositionSmooth()
  updateTrajectoryLine()
}

let lastTime = -1
let descentLerpProgress = 0
const DESCENT_SPEED = 4

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const now = time || performance.now()
  const dt = lastTime < 0 ? 0 : (now - lastTime) / 1000
  lastTime = now

  if (isDescending.value && trajectory.value.length > 0) {
    descentLerpProgress += dt * DESCENT_SPEED
    while (descentLerpProgress >= 1 && descentStepIndex.value < trajectory.value.length - 1) {
      descentLerpProgress -= 1
      descentStepIndex.value++
    }
    if (descentStepIndex.value >= trajectory.value.length - 1) {
      descentStepIndex.value = trajectory.value.length - 1
      descentLerpProgress = 0
      isDescending.value = false
    }
  }

  updateBallPositionSmooth()
  updateTrajectoryLine()

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
  requestAnimationFrame(() => {
    try {
      initScene()
    } catch (e) {
      initStatus.value = '初始化失败：' + (e as Error).message
      initStatusType.value = 'error'
      console.error('GradientFlowField init error:', e)
    }
  })
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerUp)
  }
  controls?.dispose()
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  scene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
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
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #0f172a;
  text-align: center;
  letter-spacing: 0.5px;
}

.function-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.function-selector button {
  padding: 8px 18px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.function-selector button:hover {
  background: #f1f5f9;
  border-color: #64748b;
}

.function-selector button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.demo-canvas {
  width: 100%;
  height: 520px;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e2e8f0;
}

.demo-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.demo-status {
  margin-top: 10px;
  padding: 6px 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  border-radius: 4px;
  display: inline-block;
}

.demo-status.info { background: #dbeafe; color: #1e3a8a; }
.demo-status.success { background: #d1fae5; color: #065f46; }
.demo-status.warning { background: #fef3c7; color: #92400e; }
.demo-status.error { background: #fee2e2; color: #991b1b; }

.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #475569;
  margin-top: 12px;
  justify-content: center;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  display: inline-block;
  width: 22px;
  height: 6px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-swatch.solid {
  height: 14px;
  width: 14px;
  border-radius: 3px;
}

.legend-swatch.gradient-blue-red {
  background: linear-gradient(to right, #3b82f6, #06b6d4, #fbbf24, #ef4444);
  height: 8px;
  border: none;
  border-radius: 4px;
}

.legend-swatch.gradient-red-yellow {
  background: linear-gradient(to right, #ef4444, #fbbf24);
  border: none;
  border-radius: 4px;
}

.legend-swatch.dashed-white {
  background: repeating-linear-gradient(
    to right,
    rgba(255, 255, 255, 0.8) 0,
    rgba(255, 255, 255, 0.8) 4px,
    transparent 4px,
    transparent 7px
  );
  border: 1px solid #cbd5e1;
  background-color: #e5e7eb;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  align-items: center;
  justify-content: center;
}

.control-buttons button {
  padding: 8px 18px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.control-buttons button:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.control-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-buttons .play-btn {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.control-buttons .play-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  color: #fff;
}

.control-buttons .pause-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  color: #f59e0b;
}

.control-buttons .reset-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.control-buttons .step-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.iter-info {
  margin-left: 8px;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  font-weight: 600;
}

.param-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
}

.param-row {
  flex: 1 1 320px;
}

.param-row label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.slider-label {
  min-width: 80px;
  font-weight: 600;
  color: #1e293b;
}

.slider-val {
  min-width: 50px;
  text-align: center;
  padding: 2px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
}

.param-row input[type='range'] {
  flex: 1;
  min-width: 120px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
}

.param-row input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.param-row input[type='range']::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

.preset-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.preset-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.preset-points button {
  padding: 5px 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.preset-points button:hover {
  background: #f1f5f9;
  border-color: #fbbf24;
  color: #b45309;
}

.numeric-panel {
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.block-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.numeric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px 12px;
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 5px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.output-row .label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  flex: 0 0 auto;
}

.output-row .value {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
  text-align: right;
  flex: 1 1 auto;
  word-break: break-all;
}

.output-row.highlight {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: #059669;
}

.output-row.danger {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.output-row.danger .label,
.output-row.danger .value {
  color: #dc2626;
}

.jacobian-panel {
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.toggle-btn {
  padding: 4px 12px;
  border: 1px solid #fbbf24;
  background: #fffbeb;
  color: #92400e;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.toggle-btn:hover {
  background: #fef3c7;
  border-color: #f59e0b;
}

.jacobian-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.matrix-table {
  border-collapse: collapse;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  padding: 0 8px;
}

.matrix-table::before,
.matrix-table::after {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background: #eff6ff;
  color: #1e293b;
  border-radius: 1px;
}

.matrix-table::before { left: 0; }
.matrix-table::after { right: 0; }

.matrix-table td {
  padding: 6px 12px;
  text-align: center;
  color: #0f172a;
  font-weight: 600;
  min-width: 70px;
}

.jacobian-desc {
  flex: 1 1 200px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  padding: 6px 0;
}

.formula-block {
  background: #eff6ff;
  color: #1e293b;
  border-radius: 8px;
  padding: 16px 18px;
  margin-top: 12px;
}

.formula-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.formula-line {
  margin: 6px 0;
  font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  line-height: 1.7;
}

.formula-line .math {
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 3px;
  color: #1e40af;
  font-style: italic;
}

.demo-tip {
  margin: 14px 0 0 0;
  padding: 10px 14px;
  background: #dbeafe;
  border-radius: 6px;
  font-size: 12px;
  color: #1e3a8a;
  line-height: 1.6;
  border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .demo-canvas {
    height: 400px;
  }
  .param-panel {
    flex-direction: column;
    align-items: stretch;
  }
  .numeric-grid {
    grid-template-columns: 1fr;
  }
  .jacobian-content {
    flex-direction: column;
  }
}
</style>
