<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <!-- 预设按钮 -->
    <div class="preset-buttons">
      <button @click="setPreset('identity')">单位矩阵</button>
      <button @click="setPreset('rotate30')">旋转 30°</button>
      <button @click="setPreset('scale2')">缩放 2 倍</button>
      <button @click="setPreset('reflect')">反射</button>
      <button @click="setPreset('singular')">不可逆</button>
    </div>

    <!-- 矩阵编辑器 -->
    <div class="matrix-editor">
      <div class="matrix-display-block">
        <p class="block-title">矩阵 A</p>
        <table class="matrix-table">
          <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
          <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
        </table>
      </div>
      <div class="sliders-block">
        <label>a <input type="range" min="-3" max="3" step="0.1" v-model.number="a" /><span>{{ a.toFixed(2) }}</span></label>
        <label>b <input type="range" min="-3" max="3" step="0.1" v-model.number="b" /><span>{{ b.toFixed(2) }}</span></label>
        <label>c <input type="range" min="-3" max="3" step="0.1" v-model.number="c" /><span>{{ c.toFixed(2) }}</span></label>
        <label>d <input type="range" min="-3" max="3" step="0.1" v-model.number="d" /><span>{{ d.toFixed(2) }}</span></label>
      </div>
    </div>

    <!-- 行列式信息 -->
    <div class="demo-output">
      <div class="output-row" :class="detClass">
        <span class="label">det(A) = ad − bc</span>
        <span class="value">{{ det.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">缩放因子 |det|</span>
        <span class="value">{{ Math.abs(det).toFixed(3) }}×</span>
      </div>
      <div class="output-row">
        <span class="label">面积效果</span>
        <span class="value" :class="areaEffectClass">{{ areaEffectText }}</span>
      </div>
      <div class="output-row">
        <span class="label">定向</span>
        <span class="value">
          <span class="orientation-badge" :class="[orientationClass, { flip: flipping }]" :key="orientationKey">{{ orientationText }}</span>
        </span>
      </div>
      <div class="output-row">
        <span class="label">可逆性</span>
        <span class="value" :class="{ 'text-danger': !invertible }">{{ invertible ? '可逆' : '不可逆（塌缩）' }}</span>
      </div>
    </div>

    <p class="demo-tip">拖动滑块改变矩阵元素。绿色 = 放大面积，红色 = 缩小面积，灰色 = 塌缩。蓝色徽章 = 定向保持（det>0），橙色徽章 = 定向翻转（det<0）。3×3 矩阵的行列式表示 3D 平行六面体的有向体积，原理类似。</p>
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
    title: '行列式 · 面积与定向'
  }
)

// ---------- 矩阵元素 ----------
const a = ref(1.5)
const b = ref(0.5)
const c = ref(-0.3)
const d = ref(1.2)

const det = computed(() => a.value * d.value - b.value * c.value)
const invertible = computed(() => Math.abs(det.value) > 1e-4)

const detClass = computed(() => {
  if (Math.abs(det.value) < 1e-4) return 'danger'
  return det.value > 0 ? 'highlight' : 'warning'
})

const areaEffectText = computed(() => {
  const abs = Math.abs(det.value)
  if (abs < 1e-4) return '塌缩（面积 = 0）'
  if (abs > 1.05) return `放大 ${abs.toFixed(2)} 倍`
  if (abs < 0.95) return `缩小到 ${abs.toFixed(2)} 倍`
  return '面积基本保持'
})

const areaEffectClass = computed(() => {
  const abs = Math.abs(det.value)
  if (abs < 1e-4) return 'text-danger'
  if (abs > 1.05) return 'text-success'
  if (abs < 0.95) return 'text-warning'
  return ''
})

const orientationText = computed(() => {
  if (Math.abs(det.value) < 1e-4) return '塌缩'
  return det.value > 0 ? '定向保持 ⟳' : '定向翻转 ↺'
})

const orientationClass = computed(() => {
  if (Math.abs(det.value) < 1e-4) return 'badge-zero'
  return det.value > 0 ? 'badge-positive' : 'badge-negative'
})

// 翻面动画：当 det 符号反转时触发
const flipping = ref(false)
const orientationKey = ref(0)
let lastSign = 0  // 0 = 未设置 / 塌缩, 1 = 正, -1 = 负
let flipTimer: number | null = null

// 初始化 lastSign（在 setup 中执行，确保 watch 不会在初始 mount 时误触发）
{
  const initialDet = det.value
  if (initialDet > 1e-4) lastSign = 1
  else if (initialDet < -1e-4) lastSign = -1
}

watch(det, (newDet) => {
  const abs = Math.abs(newDet)
  let newSign = 0
  if (abs >= 1e-4) newSign = newDet > 0 ? 1 : -1
  // 仅当从非零符号切换到另一个非零符号时触发翻转
  if (lastSign !== 0 && newSign !== 0 && newSign !== lastSign) {
    flipping.value = true
    orientationKey.value++
    if (flipTimer !== null) clearTimeout(flipTimer)
    flipTimer = window.setTimeout(() => {
      flipping.value = false
      flipTimer = null
    }, 500)
  }
  if (newSign !== 0) lastSign = newSign
})

// ---------- 预设 ----------
function setPreset(name: string) {
  switch (name) {
    case 'identity':
      a.value = 1; b.value = 0; c.value = 0; d.value = 1
      break
    case 'rotate30': {
      const t = Math.PI / 6
      a.value = Math.cos(t)
      b.value = -Math.sin(t)
      c.value = Math.sin(t)
      d.value = Math.cos(t)
      break
    }
    case 'scale2':
      a.value = 2; b.value = 0; c.value = 0; d.value = 2
      break
    case 'reflect':
      a.value = 1; b.value = 0; c.value = 0; d.value = -1
      break
    case 'singular':
      // 列共线：第二列 = 2 × 第一列 → det = 0
      a.value = 1; b.value = 2; c.value = 2; d.value = 4
      break
  }
}

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let originalSquare: THREE.LineLoop
let transformedSquare: THREE.Mesh
let transformedSquareEdges: THREE.LineLoop
let arrowI2: THREE.ArrowHelper
let arrowJ2: THREE.ArrowHelper

const COLOR_ORIG = 0x9ca3af
const COLOR_SCALE_UP = 0x10b981   // 绿，放大
const COLOR_SCALE_DOWN = 0xef4444 // 红，缩小
const COLOR_ZERO = 0x6b7280       // 灰，塌缩
const COLOR_KEEP = 0xf59e0b       // 黄，基本保持
const COLOR_EDGE_UP = 0x059669
const COLOR_EDGE_DOWN = 0xb91c1c
const COLOR_EDGE_ZERO = 0x4b5563
const COLOR_EDGE_KEEP = 0xb45309
const COLOR_I = 0xb91c1c
const COLOR_J = 0x1d4ed8
const COLOR_GRID = 0xe5e7eb

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function fillColorFor(absDet: number): number {
  if (absDet < 0.05) return COLOR_ZERO
  if (absDet > 1.05) return COLOR_SCALE_UP
  if (absDet < 0.95) return COLOR_SCALE_DOWN
  return COLOR_KEEP
}

function edgeColorFor(absDet: number): number {
  if (absDet < 0.05) return COLOR_EDGE_ZERO
  if (absDet > 1.05) return COLOR_EDGE_UP
  if (absDet < 0.95) return COLOR_EDGE_DOWN
  return COLOR_EDGE_KEEP
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
  const viewSize = 6
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2,
    viewSize * aspect / 2,
    viewSize / 2,
    -viewSize / 2,
    -100, 100
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
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enableRotate = false
  controls.minZoom = 0.3
  controls.maxZoom = 5

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))

  // 网格
  for (let i = -5; i <= 5; i++) {
    const op = i === 0 ? 0.8 : 0.4
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, i, -0.01), new THREE.Vector3(5, i, -0.01)
    ])
    scene.add(new THREE.Line(hGeom, new THREE.LineBasicMaterial({ color: COLOR_GRID, transparent: true, opacity: op })))
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -5, -0.01), new THREE.Vector3(i, 5, -0.01)
    ])
    scene.add(new THREE.Line(vGeom, new THREE.LineBasicMaterial({ color: COLOR_GRID, transparent: true, opacity: op })))
  }

  // 原始单位正方形（虚线灰）
  const origGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0.02),
    new THREE.Vector3(1, 0, 0.02),
    new THREE.Vector3(1, 1, 0.02),
    new THREE.Vector3(0, 1, 0.02)
  ])
  originalSquare = new THREE.LineLoop(origGeom, new THREE.LineDashedMaterial({
    color: COLOR_ORIG, dashSize: 0.1, gapSize: 0.08,
    transparent: true, opacity: 0.7
  }))
  originalSquare.computeLineDistances()
  scene.add(originalSquare)

  // 变换后平行四边形（填充）
  const transGeom = new THREE.BufferGeometry()
  transGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  transGeom.setIndex([0, 1, 2, 0, 2, 3])
  const transMat = new THREE.MeshBasicMaterial({
    color: COLOR_KEEP, transparent: true, opacity: 0.4, side: THREE.DoubleSide
  })
  transformedSquare = new THREE.Mesh(transGeom, transMat)
  scene.add(transformedSquare)

  // 变换后边框
  const edgeGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ])
  const edgeMat = new THREE.LineBasicMaterial({ color: COLOR_EDGE_KEEP })
  transformedSquareEdges = new THREE.LineLoop(edgeGeom, edgeMat)
  scene.add(transformedSquareEdges)

  // 基向量箭头（i' 与 j'）
  arrowI2 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_I, 0.2, 0.12
  )
  scene.add(arrowI2)
  arrowJ2 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_J, 0.2, 0.12
  )
  scene.add(arrowJ2)

  // 原点小球
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  ))

  updateScene()
}

function updateScene() {
  if (!scene) return

  // 平行四边形顶点：(0,0)、(a,c)、(a+b,c+d)、(b,d)
  const v0 = new THREE.Vector3(0, 0, 0.05)
  const v1 = new THREE.Vector3(a.value, c.value, 0.05)
  const v2 = new THREE.Vector3(a.value + b.value, c.value + d.value, 0.05)
  const v3 = new THREE.Vector3(b.value, d.value, 0.05)

  const pos = transformedSquare.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true

  const epos = transformedSquareEdges.geometry.attributes.position as THREE.BufferAttribute
  epos.setXYZ(0, v0.x, v0.y, v0.z)
  epos.setXYZ(1, v1.x, v1.y, v1.z)
  epos.setXYZ(2, v2.x, v2.y, v2.z)
  epos.setXYZ(3, v3.x, v3.y, v3.z)
  epos.needsUpdate = true

  // 颜色按 |det| 编码
  const absDet = Math.abs(det.value)
  const fillMat = transformedSquare.material as THREE.MeshBasicMaterial
  const edgeMat = transformedSquareEdges.material as THREE.LineBasicMaterial
  fillMat.color.setHex(fillColorFor(absDet))
  edgeMat.color.setHex(edgeColorFor(absDet))

  // 基向量箭头
  const iLen = Math.sqrt(a.value * a.value + c.value * c.value)
  if (iLen > 1e-4) {
    arrowI2.setDirection(new THREE.Vector3(a.value, c.value, 0).normalize())
    arrowI2.setLength(iLen, 0.2, 0.12)
    arrowI2.visible = true
  } else arrowI2.visible = false

  const jLen = Math.sqrt(b.value * b.value + d.value * d.value)
  if (jLen > 1e-4) {
    arrowJ2.setDirection(new THREE.Vector3(b.value, d.value, 0).normalize())
    arrowJ2.setLength(jLen, 0.2, 0.12)
    arrowJ2.visible = true
  } else arrowJ2.visible = false
}

function animateLoop() {
  animationId = requestAnimationFrame(animateLoop)
  if (!renderer || !scene || !camera || !controls) return
  controls.update()
  renderer.render(scene, camera)
}

function handleResize() {
  if (!canvasContainer.value || !renderer || !camera) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  if (width === 0 || height === 0) return
  const aspect = width / height
  const viewSize = 6
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
    if (renderer) animateLoop()
  } catch (e) {
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('DeterminantDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (flipTimer !== null) clearTimeout(flipTimer)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})

watch([a, b, c, d], updateScene)
</script>

<style scoped>
/* 预设按钮 */
.preset-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin: var(--space-3) 0;
  justify-content: center;
}

.preset-buttons button {
  padding: 0.3em 0.9em;
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
  background: var(--color-accent-soft);
}

/* 矩阵编辑器 */
.matrix-editor {
  display: flex;
  gap: var(--space-4);
  margin: var(--space-3) 0;
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  align-items: flex-start;
}

.matrix-display-block {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.matrix-display-block .block-title {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: 600;
  margin: 0;
}

.matrix-table {
  border-collapse: collapse;
  margin: var(--space-1) 0;
  background: var(--bg-content);
  border: 1px solid var(--border-color-strong);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.matrix-table td {
  padding: 0.4em 0.8em;
  font-family: var(--font-mono);
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  min-width: 3.5em;
  text-align: center;
}

.matrix-table tr:first-child td { border-top: none; }
.matrix-table tr:last-child td { border-bottom: none; }
.matrix-table td:first-child { border-left: none; }
.matrix-table td:last-child { border-right: none; }

.sliders-block {
  flex: 1 1 240px;
  display: flex;
  flex-direction: column;
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
  min-width: 2.5em;
  justify-content: center;
}

.sliders-block input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 80px;
  width: auto;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.sliders-block input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
  box-shadow: var(--shadow-sm);
}

.sliders-block input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

/* 输出区 */
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

.output-row.warning {
  background: var(--bg-warning-soft);
  border-color: var(--color-warning);
}

.output-row.warning .label,
.output-row.warning .value {
  color: var(--color-warning);
}

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
}

.text-success { color: var(--color-success) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-danger { color: var(--color-danger) !important; }

/* 定向徽章 */
.orientation-badge {
  display: inline-block;
  padding: 0.2em 0.7em;
  border-radius: var(--radius-full);
  font-size: var(--fs-xs);
  font-weight: 600;
  font-family: var(--font-sans);
  letter-spacing: 0.02em;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.orientation-badge.badge-positive {
  background: #dbeafe;
  color: #1e40af;
}

.orientation-badge.badge-negative {
  background: #fed7aa;
  color: #9a3412;
}

.orientation-badge.badge-zero {
  background: #e5e7eb;
  color: #4b5563;
}

/* 翻面动画：det 符号反转时触发 */
@keyframes flipAnim {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); }
  100% { transform: rotateY(180deg); }
}

.orientation-badge.flip {
  animation: flipAnim 0.5s ease;
  backface-visibility: visible;
}

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
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

@media (max-width: 540px) {
  .matrix-editor {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
