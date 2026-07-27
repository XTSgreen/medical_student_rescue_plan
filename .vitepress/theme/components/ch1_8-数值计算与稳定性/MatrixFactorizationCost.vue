<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button :class="{ active: preset === 'small' }" :aria-pressed="preset === 'small'" @click="setPreset('small')">
        n=10（小型）
      </button>
      <button :class="{ active: preset === 'medium' }" :aria-pressed="preset === 'medium'" @click="setPreset('medium')">
        n=100（中型）
      </button>
      <button :class="{ active: preset === 'large' }" :aria-pressed="preset === 'large'" @click="setPreset('large')">
        n=500（大型）
      </button>
      <button :class="{ active: preset === 'industrial' }" :aria-pressed="preset === 'industrial'" @click="setPreset('industrial')">
        n=1000（工业级）
      </button>
    </div>

    <div class="dual-pane">

      <div class="left-pane">
        <div ref="canvasContainer" class="demo-canvas" role="img" aria-label="矩阵分解计算成本演示画面，展示不同分解算法的耗时对比，可用鼠标拖拽旋转视角"></div>
        <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

        <div class="n-slider-block">
          <div class="n-slider-header">
            <span class="n-label">矩阵维度 n</span>
            <span class="n-value">{{ n.toFixed(0) }}</span>
            <span class="n-cubed">n³ = {{ nCubedDisplay }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="1"
            :value="nSliderValue"
            @input="onNSliderInput(parseInt(($event.target as HTMLInputElement).value))"
            class="n-slider"
          />
          <div class="n-slider-markers">
            <span @click="setPreset('small')">10</span>
            <span @click="setPreset('medium')">100</span>
            <span @click="setPreset('large')">500</span>
            <span @click="setPreset('industrial')">1000</span>
          </div>
        </div>

        <div class="color-legend">
          <span class="legend-item">
            <span class="legend-swatch" style="background:#3b82f6"></span>
            <span>LU 分解</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch" style="background:#10b981"></span>
            <span>Cholesky</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch" style="background:#fbbf24"></span>
            <span>QR 分解</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch" style="background:#ef4444"></span>
            <span>SVD</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch dashed" style="background:#94a3b8"></span>
            <span>硬件能力参考线</span>
          </span>
        </div>
      </div>

      <div class="right-pane">

        <div class="info-card current-n">
          <p class="block-title">当前矩阵维度</p>
          <div class="big-n-display">
            n = <span class="n-num">{{ n.toFixed(0) }}</span>
          </div>
          <div class="sub-info">
            <span class="sub-label">n³ =</span>
            <span class="sub-val">{{ nCubedDisplay }}</span>
          </div>
          <div class="sub-info">
            <span class="sub-label">硬件基准 =</span>
            <span class="sub-val">1 GFLOPs</span>
          </div>
        </div>

        <div class="info-card">
          <p class="block-title">预估运算时间（1 GFLOPs 硬件）</p>
          <div class="time-row" v-for="algo in algoTimes" :key="algo.key">
            <span class="time-dot" :style="{ background: algo.color }"></span>
            <span class="time-label" :style="{ color: algo.color }">{{ algo.name }}</span>
            <span class="time-val">{{ algo.timeText }}</span>
          </div>
        </div>

        <div class="info-card speedup">
          <p class="block-title">SVD 相对其他算法的加速比</p>
          <div class="speedup-row" v-for="ratio in speedupRatios" :key="ratio.name">
            <span class="sp-label">SVD / {{ ratio.name }}</span>
            <span class="sp-val">{{ ratio.value }}x</span>
            <div class="sp-bar-wrap">
              <div class="sp-bar" :style="{ width: ratio.barWidth + '%' }"></div>
            </div>
          </div>
          <p class="speedup-note">SVD/LU = 21 / (2/3) = <strong>31.5x</strong>（恒定）</p>
        </div>

        <div class="info-card stability-card">
          <p class="block-title">稳定性等级（Z 轴）</p>
          <div class="stab-row" v-for="s in stabilityRows" :key="s.level">
            <span class="stab-level" :class="'lvl-' + s.level">{{ s.level }}</span>
            <span class="stab-text">{{ s.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="comparison-table">
      <p class="block-title">算法对比表</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>算法</th>
              <th>Flops 公式</th>
              <th>当前 Flops</th>
              <th>预估时间</th>
              <th>稳定性</th>
              <th>适用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="algo in algoTableRows"
              :key="algo.key"
              :style="{ borderLeftColor: algo.color }"
              class="algo-row"
            >
              <td>
                <span class="algo-name" :style="{ color: algo.color }">{{ algo.name }}</span>
              </td>
              <td class="formula-cell">{{ algo.formula }}</td>
              <td class="num-cell">{{ algo.flopsText }}</td>
              <td class="num-cell">{{ algo.timeText }}</td>
              <td>{{ algo.stability }}</td>
              <td>{{ algo.useCase }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="hardware-ref">
      <p class="block-title">硬件能力参考线（1 秒能算多少 Flops）</p>
      <div class="hw-row" v-for="hw in hardwareRows" :key="hw.label">
        <span class="hw-dot" :style="{ background: hw.color }"></span>
        <span class="hw-label" :style="{ color: hw.color }">{{ hw.label }}</span>
        <span class="hw-val">{{ hw.flops }}</span>
        <span class="hw-hint">→ log₁₀ = {{ hw.log }}</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">矩阵分解复杂度公式</p>
      <p class="formula-line">LU 分解：<span class="math">Flops<sub>LU</sub> = (2/3)·n³</span>（含列主元）</p>
      <p class="formula-line">Cholesky 分解：<span class="math">Flops<sub>Chol</sub> = (1/3)·n³</span>（仅正定对称）</p>
      <p class="formula-line">QR 分解（m=n）：<span class="math">Flops<sub>QR</sub> = (4/3)·n³</span></p>
      <p class="formula-line">SVD（m=n）：<span class="math">Flops<sub>SVD</sub> = 21·n³</span></p>
      <p class="formula-line note">注：以 log₁₀ 对数刻度显示柱高，否则 SVD 柱会冲出屏幕</p>
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
    title: '矩阵分解复杂度对比 · LU vs Cholesky vs QR vs SVD'
  }
)

type AlgoKey = 'lu' | 'chol' | 'qr' | 'svd'

interface AlgoConfig {
  key: AlgoKey
  name: string
  color: number
  colorHex: string
  formula: string
  flopsFn: (n: number) => number
  stability: number
  stabilityText: string
  useCase: string
}

const ALGOS: AlgoConfig[] = [
  {
    key: 'lu',
    name: 'LU',
    color: 0x3b82f6,
    colorHex: '#3b82f6',
    formula: '(2/3)·n³',
    flopsFn: (n) => (2 / 3) * n * n * n,
    stability: 2,
    stabilityText: '中（需主元）',
    useCase: 'Ax=b 方程组'
  },
  {
    key: 'chol',
    name: 'Cholesky',
    color: 0x10b981,
    colorHex: '#10b981',
    formula: '(1/3)·n³',
    flopsFn: (n) => (1 / 3) * n * n * n,
    stability: 3,
    stabilityText: '高（正定限定）',
    useCase: '正定对称方程组'
  },
  {
    key: 'qr',
    name: 'QR',
    color: 0xfbbf24,
    colorHex: '#fbbf24',
    formula: '(4/3)·n³',
    flopsFn: (n) => (4 / 3) * n * n * n,
    stability: 3,
    stabilityText: '高',
    useCase: '最小二乘'
  },
  {
    key: 'svd',
    name: 'SVD',
    color: 0xef4444,
    colorHex: '#ef4444',
    formula: '21·n³',
    flopsFn: (n) => 21 * n * n * n,
    stability: 4,
    stabilityText: '最高',
    useCase: '任意矩阵/秩判定'
  }
]

type PresetKey = 'small' | 'medium' | 'large' | 'industrial' | 'custom'
const preset = ref<PresetKey>('medium')
const nSliderValue = ref(500)

const n = computed(() => {
  const t = nSliderValue.value / 1000
  return Math.max(1, Math.pow(10, 1 + t * 2))
})

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'small':      nSliderValue.value = 0;    break
    case 'medium':     nSliderValue.value = 500;  break
    case 'large':      nSliderValue.value = 849;  break
    case 'industrial': nSliderValue.value = 1000; break
    case 'custom':     break
  }
}

function onNSliderInput(v: number) {
  nSliderValue.value = Math.max(0, Math.min(1000, v))
  preset.value = 'custom'
}

const GFLOPS = 1e9

interface AlgoComputed {
  config: AlgoConfig
  flops: number
  logFlops: number
  time: number
  timeText: string
  flopsText: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 1e-9) return (seconds * 1e12).toFixed(2) + ' ps'
  if (seconds < 1e-6) return (seconds * 1e9).toFixed(2) + ' ns'
  if (seconds < 1e-3) return (seconds * 1e6).toFixed(2) + ' μs'
  if (seconds < 1)    return (seconds * 1e3).toFixed(2) + ' ms'
  if (seconds < 60)   return seconds.toFixed(2) + ' s'
  if (seconds < 3600) return (seconds / 60).toFixed(2) + ' min'
  return (seconds / 3600).toFixed(2) + ' h'
}

function formatFlops(f: number): string {
  if (!isFinite(f) || f <= 0) return '0'
  if (f < 1e3) return f.toFixed(0)
  if (f < 1e6) return (f / 1e3).toFixed(2) + 'K'
  if (f < 1e9) return (f / 1e6).toFixed(2) + 'M'
  if (f < 1e12) return (f / 1e9).toFixed(2) + 'G'
  if (f < 1e15) return (f / 1e12).toFixed(2) + 'T'
  return (f / 1e15).toFixed(2) + 'P'
}

const algoComputed = computed<AlgoComputed[]>(() => {
  const nv = n.value
  return ALGOS.map(cfg => {
    const f = cfg.flopsFn(nv)
    const t = f / GFLOPS

    const log = f > 1 ? Math.min(15, Math.max(0, Math.log10(f))) : 0
    return {
      config: cfg,
      flops: f,
      logFlops: log,
      time: t,
      timeText: formatTime(t),
      flopsText: formatFlops(f)
    }
  })
})

const nCubedDisplay = computed(() => {
  const nc = n.value * n.value * n.value
  return formatFlops(nc)
})

const algoTimes = computed(() => algoComputed.value.map(a => ({
  key: a.config.key,
  name: a.config.name,
  color: a.config.colorHex,
  timeText: a.timeText
})))

const algoTableRows = computed(() => algoComputed.value.map(a => ({
  key: a.config.key,
  name: a.config.name,
  color: a.config.colorHex,
  formula: a.config.formula,
  flopsText: a.flopsText,
  timeText: a.timeText,
  stability: a.config.stabilityText,
  useCase: a.config.useCase
})))

const speedupRatios = computed(() => {
  const svd = algoComputed.value.find(a => a.config.key === 'svd')!
  const lu = algoComputed.value.find(a => a.config.key === 'lu')!
  const chol = algoComputed.value.find(a => a.config.key === 'chol')!
  const qr = algoComputed.value.find(a => a.config.key === 'qr')!
  const ratios = [
    { name: 'LU',       value: svd.flops / lu.flops },
    { name: 'Cholesky', value: svd.flops / chol.flops },
    { name: 'QR',       value: svd.flops / qr.flops }
  ]
  const maxV = Math.max(...ratios.map(r => r.value))
  return ratios.map(r => ({
    name: r.name,
    value: r.value.toFixed(1),
    barWidth: Math.min(100, (r.value / maxV) * 100)
  }))
})

const stabilityRows = [
  { level: 1, text: '低（无主元，可能数值不稳定）' },
  { level: 2, text: '中（需主元，如 LU）' },
  { level: 3, text: '高（如 Cholesky、QR）' },
  { level: 4, text: '最高（SVD，最鲁棒）' }
]

const hardwareRows = [
  { label: '1 MFLOPs（旧手机）',  flops: '10⁶ Flops/s', log: 6,  color: '#94a3b8' },
  { label: '1 GFLOPs（普通 CPU）', flops: '10⁹ Flops/s', log: 9,  color: '#64748b' },
  { label: '1 TFLOPs（GPU）',     flops: '10¹² Flops/s', log: 12, color: '#475569' }
]

const tipText = computed(() => {
  const nv = n.value
  if (nv < 50)  return '小型矩阵：所有算法都很快（μs ~ ms 级）。但已能看出 SVD 比 LU 慢约 31.5 倍——这是渐近复杂度的固有差距。'
  if (nv < 200) return '中型矩阵：SVD 开始显现开销。Cholesky 最便宜，但仅适用于正定矩阵；QR 比 LU 慢 2 倍但更稳定。'
  if (nv < 800) return '大型矩阵：SVD 比 LU 慢 30+ 倍。生产环境常用 LU/QR 求解线性方程组，SVD 仅用于秩判定或病态分析。'
  return '工业级矩阵：SVD 需要数秒甚至数十秒。这正是为什么大规模数值计算优先选 LU/Cholesky，仅在必须时用 SVD。'
})

const canvasContainer = ref<HTMLElement | null>(null)
const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

let scene!: THREE.Scene
let camera!: THREE.PerspectiveCamera
let renderer!: THREE.WebGLRenderer
let controls!: OrbitControls
let resizeObserver!: ResizeObserver
let animationId = 0

let bars: THREE.Mesh[] = []
let barEdges: THREE.LineSegments[] = []
let barSprites: THREE.Sprite[] = []
let barNameLabels: THREE.Sprite[] = []
let stabilityLabels: THREE.Sprite[] = []
let hwRefLines: THREE.Line[] = []
let hwRefLabels: THREE.Sprite[] = []
let axisLabels: THREE.Sprite[] = []

let currentHeights: number[] = []
let currentFlopsText: string[] = []

const LOG_SCALE = 0.45
const BAR_WIDTH = 1.2
const BAR_DEPTH = 1.2
const BAR_MIN_HEIGHT = 0.01
const BAR_X_OFFSET = -4.5
const BAR_X_SPACING = 3

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function makeTextSprite(
  text: string,
  options: {
    color?: string
    fontSize?: number
    background?: string
    padding?: number
    scale?: [number, number]
  } = {}
): THREE.Sprite {
  const {
    color = '#ffffff',
    fontSize = 36,
    background = 'rgba(15,23,42,0.85)',
    padding = 12,
    scale = [2.4, 0.6]
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  ctx.font = `bold ${fontSize}px 'Consolas', 'Monaco', monospace`
  const metrics = ctx.measureText(text)
  const w = Math.max(64, Math.ceil(metrics.width) + padding * 2)
  const h = fontSize + padding * 2
  canvas.width = w
  canvas.height = h

  ctx.fillStyle = background
  ctx.fillRect(0, 0, w, h)
  ctx.font = `bold ${fontSize}px 'Consolas', 'Monaco', monospace`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(scale[0], scale[1], 1)
  return sprite
}

function updateSpriteText(
  sprite: THREE.Sprite,
  text: string,
  options: {
    color?: string
    fontSize?: number
    background?: string
    padding?: number
    scale?: [number, number]
  } = {}
) {
  const {
    color = '#ffffff',
    fontSize = 36,
    background = 'rgba(15,23,42,0.85)',
    padding = 12,
    scale = [2.4, 0.6]
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `bold ${fontSize}px 'Consolas', 'Monaco', monospace`
  const metrics = ctx.measureText(text)
  const w = Math.max(64, Math.ceil(metrics.width) + padding * 2)
  const h = fontSize + padding * 2
  canvas.width = w
  canvas.height = h

  ctx.fillStyle = background
  ctx.fillRect(0, 0, w, h)
  ctx.font = `bold ${fontSize}px 'Consolas', 'Monaco', monospace`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)

  const mat = sprite.material as THREE.SpriteMaterial
  if (mat.map) mat.map.dispose()
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  mat.map = texture
  mat.needsUpdate = true
  sprite.scale.set(scale[0], scale[1], 1)
}

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 500

  try {
    const testCanvas = document.createElement('canvas')
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
    if (!gl) {
      initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 场景'
      initStatusType.value = 'error'
      container.innerHTML =
        '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono,monospace);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
      return
    }
    const loseExt = gl.getExtension('WEBGL_lose_context')
    loseExt?.loseContext()
  } catch (err) {
    initStatus.value = 'WebGL 初始化失败：' + (err as Error).message
    initStatusType.value = 'error'
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(9, 8, 11)
  camera.lookAt(0, 2, 0)

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

  scene.add(new THREE.AmbientLight(0xffffff, 0.65))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.75)
  dirLight.position.set(8, 12, 8)
  scene.add(dirLight)
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.28)
  dirLight2.position.set(-6, 4, -8)
  scene.add(dirLight2)

  const grid = new THREE.GridHelper(16, 16, 0xcbd5e1, 0xe2e8f0)
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.5
  scene.add(grid)

  const yPoints = [
    new THREE.Vector3(-6.8, 0, -2.8),
    new THREE.Vector3(-6.8, 7, -2.8)
  ]
  const yGeom = new THREE.BufferGeometry().setFromPoints(yPoints)
  const yMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 })
  scene.add(new THREE.Line(yGeom, yMat))

  const yTicks = [3, 6, 9, 12, 15]
  yTicks.forEach(t => {
    const tickPoints = [
      new THREE.Vector3(-7.0, t * LOG_SCALE, -2.8),
      new THREE.Vector3(-6.6, t * LOG_SCALE, -2.8)
    ]
    const tickGeom = new THREE.BufferGeometry().setFromPoints(tickPoints)
    scene.add(new THREE.Line(tickGeom, new THREE.LineBasicMaterial({ color: 0x64748b })))

    const label = makeTextSprite(`10^${t}`, {
      color: '#475569',
      background: 'rgba(255,255,255,0)',
      fontSize: 28,
      scale: [1.1, 0.4]
    })
    label.position.set(-7.8, t * LOG_SCALE, -2.8)
    scene.add(label)
  })

  const yTitle = makeTextSprite('log₁₀(Flops)', {
    color: '#1e293b',
    background: 'rgba(255,255,255,0)',
    fontSize: 30,
    scale: [1.8, 0.45]
  })
  yTitle.position.set(-7.8, 7.4, -2.8)
  scene.add(yTitle)
  axisLabels.push(yTitle)

  const xTitle = makeTextSprite('算法 →', {
    color: '#1e293b',
    background: 'rgba(255,255,255,0)',
    fontSize: 28,
    scale: [1.4, 0.4]
  })
  xTitle.position.set(0, -0.5, 2.8)
  scene.add(xTitle)
  axisLabels.push(xTitle)

  const zTitle = makeTextSprite('稳定性 →', {
    color: '#1e293b',
    background: 'rgba(255,255,255,0)',
    fontSize: 28,
    scale: [1.4, 0.4]
  })
  zTitle.position.set(5.5, -0.5, 0)
  scene.add(zTitle)
  axisLabels.push(zTitle)

  ALGOS.forEach((cfg, i) => {
    const xPos = BAR_X_OFFSET + i * BAR_X_SPACING
    const zPos = (cfg.stability - 3) * 1.5

    const geom = new THREE.BoxGeometry(BAR_WIDTH, BAR_MIN_HEIGHT, BAR_DEPTH)
    const mat = new THREE.MeshPhongMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.78,
      shininess: 100,
      emissive: cfg.color,
      emissiveIntensity: 0.22
    })
    const bar = new THREE.Mesh(geom, mat)
    bar.position.set(xPos, BAR_MIN_HEIGHT / 2, zPos)
    scene.add(bar)
    bars.push(bar)

    const edges = new THREE.EdgesGeometry(geom)
    const edgeMat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.95
    })
    const edgeLine = new THREE.LineSegments(edges, edgeMat)
    bar.add(edgeLine)
    barEdges.push(edgeLine)

    const sprite = makeTextSprite('—', {
      color: cfg.colorHex,
      background: 'rgba(15,23,42,0.9)',
      fontSize: 32,
      scale: [2.2, 0.55]
    })
    sprite.position.set(xPos, 0.5, zPos)
    scene.add(sprite)
    barSprites.push(sprite)

    const nameLabel = makeTextSprite(cfg.name, {
      color: cfg.colorHex,
      background: 'rgba(255,255,255,0.95)',
      fontSize: 40,
      scale: [1.5, 0.5]
    })
    nameLabel.position.set(xPos, -0.15, zPos + 1.3)
    scene.add(nameLabel)
    barNameLabels.push(nameLabel)

    const stabLabel = makeTextSprite(`稳定 ${cfg.stability}`, {
      color: '#475569',
      background: 'rgba(255,255,255,0.85)',
      fontSize: 26,
      scale: [1.5, 0.45]
    })
    stabLabel.position.set(xPos, -0.15, zPos - 1.2)
    scene.add(stabLabel)
    stabilityLabels.push(stabLabel)

    currentHeights.push(BAR_MIN_HEIGHT)
    currentFlopsText.push('—')
  })

  const hwSpecs = [
    { yLog: 6,  color: 0x94a3b8, label: '1 MFLOPs (旧手机)' },
    { yLog: 9,  color: 0x64748b, label: '1 GFLOPs (CPU)' },
    { yLog: 12, color: 0x475569, label: '1 TFLOPs (GPU)' }
  ]
  hwSpecs.forEach(spec => {
    const y = spec.yLog * LOG_SCALE
    const pts = [
      new THREE.Vector3(-6.5, y, -2.5),
      new THREE.Vector3(6.5, y, 2.5)
    ]
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineDashedMaterial({
      color: spec.color,
      dashSize: 0.28,
      gapSize: 0.16,
      transparent: true,
      opacity: 0.75
    })
    const line = new THREE.Line(geom, mat)
    line.computeLineDistances()
    scene.add(line)
    hwRefLines.push(line)

    const label = makeTextSprite(spec.label, {
      color: '#334155',
      background: 'rgba(255,255,255,0.92)',
      fontSize: 26,
      scale: [2.8, 0.5]
    })
    label.position.set(5.5, y + 0.18, 2.3)
    scene.add(label)
    hwRefLabels.push(label)
  })

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, 2, 0)
  controls.enablePan = false
  controls.minDistance = 6
  controls.maxDistance = 22
  controls.minPolarAngle = Math.PI * 0.12
  controls.maxPolarAngle = Math.PI * 0.49
  controls.minAzimuthAngle = -Math.PI * 0.6
  controls.maxAzimuthAngle = Math.PI * 0.6

  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(container)

  initStatus.value = '3D 场景已就绪 · 拖拽旋转 · 滚轮缩放'
  initStatusType.value = 'success'

  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const targets = algoComputed.value

  for (let i = 0; i < bars.length; i++) {

    const targetLog = Math.max(0, Math.min(15, targets[i].logFlops))
    const targetH = Math.max(BAR_MIN_HEIGHT, targetLog * LOG_SCALE)

    const newH = lerp(currentHeights[i], targetH, 0.18)
    currentHeights[i] = newH

    const bar = bars[i]
    bar.scale.y = newH / BAR_MIN_HEIGHT
    bar.position.y = newH / 2

    barSprites[i].position.y = newH + 0.35

    const newText = targets[i].flopsText
    if (newText !== currentFlopsText[i]) {
      currentFlopsText[i] = newText
      updateSpriteText(barSprites[i], newText, {
        color: targets[i].config.colorHex,
        background: 'rgba(15,23,42,0.9)',
        fontSize: 32,
        scale: [2.2, 0.55]
      })
    }
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
  requestAnimationFrame(() => {
    try {
      initScene()
    } catch (e) {
      initStatus.value = '初始化失败：' + (e as Error).message
      initStatusType.value = 'error'
      console.error('MatrixFactorizationCost init error:', e)
    }
  })
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
  if (controls) controls.dispose()
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
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
    const sprite = obj as THREE.Sprite
    const spriteMat = sprite.material as THREE.SpriteMaterial | undefined
    if (spriteMat && spriteMat.map) {
      spriteMat.map.dispose()
    }
  })

  bars = []
  barEdges = []
  barSprites = []
  barNameLabels = []
  stabilityLabels = []
  hwRefLines = []
  hwRefLabels = []
  axisLabels = []
  currentHeights = []
  currentFlopsText = []
})
</script>

<style scoped>
.demo-container {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
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

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.preset-buttons button {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preset-buttons button:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}

.preset-buttons button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.dual-pane {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.left-pane {
  flex: 0 0 62%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.right-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-canvas {
  width: 100%;
  height: 480px;
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
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  z-index: 10;
  pointer-events: none;
}

.demo-status.info    { background: #3b82f6; }
.demo-status.success { background: #10b981; }
.demo-status.warning { background: #f59e0b; }
.demo-status.error   { background: #ef4444; }

.n-slider-block {
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
}

.n-slider-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.n-slider-header .n-label {
  font-weight: 600;
  color: #475569;
}

.n-slider-header .n-value {
  font-family: 'Consolas', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 50px;
}

.n-slider-header .n-cubed {
  margin-left: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
}

.n-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, #dbeafe, #3b82f6);
  border-radius: 4px;
  outline: none;
  margin: 4px 0;
}

.n-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

.n-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #fff;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

.n-slider-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  font-family: 'Consolas', monospace;
  color: #64748b;
}

.n-slider-markers span {
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 3px;
  transition: all 0.15s;
}

.n-slider-markers span:hover {
  background: #dbeafe;
  color: #1e40af;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #475569;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.legend-swatch.dashed {
  background: repeating-linear-gradient(
    90deg,
    #94a3b8 0 4px,
    transparent 4px 8px
  ) !important;
  border: 1px solid #94a3b8;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
}

.info-card .block-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.current-n {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #bfdbfe;
}

.big-n-display {
  font-family: 'Consolas', monospace;
  font-size: 28px;
  font-weight: 700;
  color: #1e40af;
  margin: 4px 0;
}

.big-n-display .n-num {
  color: #3b82f6;
  font-size: 32px;
}

.sub-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: 'Consolas', monospace;
  color: #475569;
  margin-top: 4px;
}

.sub-label {
  color: #64748b;
}

.sub-val {
  color: #1e293b;
  font-weight: 600;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
  border-bottom: 1px dashed #e5e7eb;
}

.time-row:last-child {
  border-bottom: none;
}

.time-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.time-label {
  font-weight: 600;
  min-width: 70px;
}

.time-val {
  margin-left: auto;
  font-family: 'Consolas', monospace;
  font-weight: 700;
  color: #0f172a;
}

.speedup {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fecaca;
}

.speedup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.sp-label {
  min-width: 110px;
  color: #475569;
  font-family: 'Consolas', monospace;
}

.sp-val {
  font-family: 'Consolas', monospace;
  font-weight: 700;
  color: #dc2626;
  min-width: 50px;
  text-align: right;
}

.sp-bar-wrap {
  flex: 1;
  height: 6px;
  background: #fee2e2;
  border-radius: 3px;
  overflow: hidden;
}

.sp-bar {
  height: 100%;
  background: linear-gradient(90deg, #f87171, #dc2626);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.speedup-note {
  margin: 8px 0 0 0;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  font-size: 12px;
  color: #7f1d1d;
  text-align: center;
}

.speedup-note strong {
  color: #dc2626;
  font-family: 'Consolas', monospace;
  font-size: 14px;
}

.stability-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #bbf7d0;
}

.stab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #475569;
}

.stab-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  flex-shrink: 0;
}

.stab-level.lvl-1 { background: #ef4444; }
.stab-level.lvl-2 { background: #f59e0b; }
.stab-level.lvl-3 { background: #3b82f6; }
.stab-level.lvl-4 { background: #10b981; }

.comparison-table {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.comparison-table .block-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.table-wrap {
  overflow-x: auto;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparison-table th {
  background: #f1f5f9;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #cbd5e1;
  font-size: 12px;
}

.comparison-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.comparison-table .algo-row {
  border-left: 4px solid transparent;
  transition: background 0.2s;
}

.comparison-table .algo-row:hover {
  background: #f8fafc;
}

.algo-name {
  font-weight: 700;
  font-family: 'Consolas', monospace;
  font-size: 14px;
}

.formula-cell {
  font-family: 'Cambria Math', 'Times New Roman', serif;
  font-style: italic;
  color: #475569;
}

.num-cell {
  font-family: 'Consolas', monospace;
  font-weight: 600;
  color: #0f172a;
}

.hardware-ref {
  background: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.hardware-ref .block-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.hw-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed #e5e7eb;
}

.hw-row:last-child {
  border-bottom: none;
}

.hw-dot {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}

.hw-label {
  font-weight: 600;
  min-width: 180px;
}

.hw-val {
  font-family: 'Consolas', monospace;
  font-weight: 600;
  color: #1e293b;
  min-width: 110px;
}

.hw-hint {
  margin-left: auto;
  font-family: 'Consolas', monospace;
  color: #64748b;
  font-size: 12px;
}

.formula-block {
  background: #eff6ff;
  color: #1e293b;
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 12px;
}

.formula-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.formula-line {
  margin: 4px 0;
  font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  line-height: 1.6;
}

.formula-line .math {
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 3px;
  color: #1e40af;
  font-style: italic;
}

.formula-line.note {
  color: #94a3b8;
  font-style: italic;
  font-size: 12px;
  margin-top: 8px;
}

.demo-tip {
  margin: 12px 0 0 0;
  padding: 10px 12px;
  background: #dbeafe;
  border-radius: 6px;
  font-size: 12px;
  color: #1e3a8a;
  line-height: 1.6;
  border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .dual-pane {
    flex-direction: column;
  }
  .left-pane {
    flex: 1 1 100%;
  }
  .right-pane {
    flex: 1 1 100%;
  }
  .demo-canvas {
    height: 380px;
  }
  .hw-label {
    min-width: 140px;
  }
}

@media (max-width: 640px) {
  .demo-container {
    padding: 14px;
  }
  .demo-canvas {
    height: 320px;
  }
  .preset-buttons button {
    padding: 5px 10px;
    font-size: 12px;
  }
  .comparison-table {
    font-size: 12px;
  }
  .comparison-table th,
  .comparison-table td {
    padding: 6px 6px;
  }
  .hw-label {
    min-width: auto;
    flex: 1;
  }
  .hw-val {
    min-width: auto;
  }
}
</style>
