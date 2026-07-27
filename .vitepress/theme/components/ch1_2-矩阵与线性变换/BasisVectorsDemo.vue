<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas" role="img" aria-label="基向量变换三维演示画面，可用鼠标拖拽旋转视角，滚轮缩放"></div>
    <!-- WebGL 警告 -->
    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

    <!-- 预设按钮 -->
    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button @click="setPreset('identity')">单位矩阵</button>
      <button @click="setPreset('rotate45')">旋转 45°</button>
      <button @click="setPreset('shear')">剪切</button>
      <button @click="reset">重置</button>
    </div>

    <!-- 矩阵表格 + 滑块 -->
    <div class="matrix-editor">
      <!-- 左侧：矩阵表格 -->
      <div class="matrix-display-block">
        <p class="block-title">变换矩阵 A</p>
        <table class="matrix-table">
          <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
          <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
        </table>
      </div>
      <!-- 右侧：滑块 -->
      <div class="sliders-block">
        <label>a（第 1 列 x 分量） <input type="range" min="-3" max="3" step="0.1" v-model.number="a" /><span>{{ a.toFixed(2) }}</span></label>
        <label>b（第 2 列 x 分量） <input type="range" min="-3" max="3" step="0.1" v-model.number="b" /><span>{{ b.toFixed(2) }}</span></label>
        <label>c（第 1 列 y 分量） <input type="range" min="-3" max="3" step="0.1" v-model.number="c" /><span>{{ c.toFixed(2) }}</span></label>
        <label>d（第 2 列 y 分量） <input type="range" min="-3" max="3" step="0.1" v-model.number="d" /><span>{{ d.toFixed(2) }}</span></label>
      </div>
    </div>

    <!-- 信息面板 -->
    <div class="demo-output">
      <div class="output-row"><span class="label">列 1（i 的像）</span><span class="value">({{ a.toFixed(2) }}, {{ c.toFixed(2) }})</span></div>
      <div class="output-row"><span class="label">列 1 长度</span><span class="value">{{ col1Len.toFixed(3) }}</span></div>
      <div class="output-row"><span class="label">列 2（j 的像）</span><span class="value">({{ b.toFixed(2) }}, {{ d.toFixed(2) }})</span></div>
      <div class="output-row"><span class="label">列 2 长度</span><span class="value">{{ col2Len.toFixed(3) }}</span></div>
      <div class="output-row" :class="{ highlight: Math.abs(det) > 1e-6, danger: Math.abs(det) < 1e-6 }">
        <span class="label">det(A) = ad − bc</span>
        <span class="value">{{ det.toFixed(3) }}</span>
      </div>
    </div>

    <p class="demo-tip">提示：拖动滑块改变矩阵元素，观察箭头如何移动。红色/蓝色/绿色半透明箭头是原始基向量 i/j/k；深色箭头是变换后的像。鼠标拖拽旋转视角，滚轮缩放。</p>
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
    title: '基向量变换交互演示'
  }
)

// ---------- 响应式状态 ----------
const a = ref(1.5)
const b = ref(0.5)
const c = ref(-0.3)
const d = ref(1.2)

// ---------- 计算属性 ----------
const col1Len = computed(() => Math.sqrt(a.value ** 2 + c.value ** 2))
const col2Len = computed(() => Math.sqrt(b.value ** 2 + d.value ** 2))
const det = computed(() => a.value * d.value - b.value * c.value)

// ---------- 初始化状态 ----------
const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number = 0

// 箭头引用
let arrowI: THREE.ArrowHelper   // 原始 i
let arrowJ: THREE.ArrowHelper   // 原始 j
let arrowK: THREE.ArrowHelper   // 原始 k
let arrowI2: THREE.ArrowHelper  // 变换后 i'
let arrowJ2: THREE.ArrowHelper  // 变换后 j'
let arrowK2: THREE.ArrowHelper  // 变换后 k'（与 k 重合）

// 配色
const COLOR_I = 0xef4444     // 红（原始 i）
const COLOR_J = 0x3b82f6    // 蓝（原始 j）
const COLOR_K = 0x10b981    // 绿（原始 k）
const COLOR_I2 = 0xb91c1c   // 深红（变换后 i'）
const COLOR_J2 = 0x1d4ed8   // 深蓝（变换后 j'）
const COLOR_K2 = 0x059669   // 深绿（变换后 k'）
const COLOR_GRID = 0xe5e7eb // 浅灰网格
const COLOR_AXIS_GRID = 0x9ca3af // 坐标轴色网格线

// ---------- 预设 ----------
function setPreset(preset: 'identity' | 'rotate45' | 'shear') {
  switch (preset) {
    case 'identity':
      a.value = 1; b.value = 0; c.value = 0; d.value = 1
      break
    case 'rotate45': {
      // 旋转矩阵 [[cos, -sin], [sin, cos]]，θ = 45°
      const cos = Math.cos(Math.PI / 4)
      const sin = Math.sin(Math.PI / 4)
      a.value = +cos.toFixed(2)   // ≈ 0.71
      b.value = +(-sin).toFixed(2) // ≈ -0.71
      c.value = +sin.toFixed(2)   // ≈ 0.71
      d.value = +cos.toFixed(2)   // ≈ 0.71
      break
    }
    case 'shear':
      a.value = 1; b.value = 1; c.value = 0; d.value = 1
      break
  }
}

function reset() {
  a.value = 1.5; b.value = 0.5; c.value = -0.3; d.value = 1.2
}

// ---------- 初始化场景 ----------
function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

  // WebGL 检测
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:var(--color-warning);font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }
  // 释放检测用的 WebGL 上下文
  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()

  scene = new THREE.Scene()
  scene.background = null

  // 透视相机
  const aspect = width / height
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(3, 3, 5)
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
  controls.maxDistance = 20

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 网格（XY 平面）
  const grid = new THREE.GridHelper(10, 10, COLOR_AXIS_GRID, COLOR_GRID)
  grid.rotation.x = Math.PI / 2 // 从 XZ 旋转到 XY 平面
  scene.add(grid)

  // 坐标轴辅助
  const axes = new THREE.AxesHelper(5)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  scene.add(axes)

  // 原点小球
  const originGeom = new THREE.SphereGeometry(0.06, 16, 16)
  const originMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  scene.add(new THREE.Mesh(originGeom, originMat))

  // ---------- 原始基向量箭头（半透明） ----------
  arrowI = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_I,
    0.15,
    0.1
  )
  arrowI.line.material.transparent = true
  arrowI.line.material.opacity = 0.35
  arrowI.cone.material.transparent = true
  arrowI.cone.material.opacity = 0.35
  scene.add(arrowI)

  arrowJ = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_J,
    0.15,
    0.1
  )
  arrowJ.line.material.transparent = true
  arrowJ.line.material.opacity = 0.35
  arrowJ.cone.material.transparent = true
  arrowJ.cone.material.opacity = 0.35
  scene.add(arrowJ)

  arrowK = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_K,
    0.15,
    0.1
  )
  arrowK.line.material.transparent = true
  arrowK.line.material.opacity = 0.35
  arrowK.cone.material.transparent = true
  arrowK.cone.material.opacity = 0.35
  scene.add(arrowK)

  // ---------- 变换后基向量箭头（不透明） ----------
  arrowI2 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_I2,
    0.2,
    0.12
  )
  scene.add(arrowI2)

  arrowJ2 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_J2,
    0.2,
    0.12
  )
  scene.add(arrowJ2)

  arrowK2 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_K2,
    0.2,
    0.12
  )
  scene.add(arrowK2)

  updateScene()
}

// ---------- 更新场景 ----------
function updateScene() {
  if (!scene) return
  const av = a.value
  const bv = b.value
  const cv = c.value
  const dv = d.value

  // 变换后 i' = (a, c, 0)
  const iLen = Math.sqrt(av * av + cv * cv)
  if (iLen > 0.05) {
    arrowI2.setDirection(new THREE.Vector3(av, cv, 0).normalize())
    const iHeadLen = Math.min(0.2, iLen * 0.3)
    arrowI2.setLength(iLen, iHeadLen, iHeadLen * 0.6)
    arrowI2.visible = true
  } else {
    arrowI2.visible = false
  }

  // 变换后 j' = (b, d, 0)
  const jLen = Math.sqrt(bv * bv + dv * dv)
  if (jLen > 0.05) {
    arrowJ2.setDirection(new THREE.Vector3(bv, dv, 0).normalize())
    const jHeadLen = Math.min(0.2, jLen * 0.3)
    arrowJ2.setLength(jLen, jHeadLen, jHeadLen * 0.6)
    arrowJ2.visible = true
  } else {
    arrowJ2.visible = false
  }

  // 变换后 k' = (0, 0, 1)，不变，与 arrowK 重合
  // k' 始终 = k，无需动态更新
}

// ---------- 动画循环 ----------
function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return
  controls.update()
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
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('BasisVectorsDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()
  scene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
      else (mesh.material as THREE.Material).dispose()
    }
  })
  renderer?.dispose()
  renderer?.forceContextLoss()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})

// 监听滑块变化
watch([a, b, c, d], updateScene)
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

.preset-buttons button:active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

/* 矩阵编辑器（左右布局） */
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

/* 左侧：矩阵表格 */
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

/* 矩阵表格（括号装饰） */
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

.matrix-table::before {
  left: 0;
}

.matrix-table::after {
  right: 0;
}

.matrix-table td {
  padding: 0.3em 0.6em;
  text-align: center;
  color: var(--text-primary);
  font-weight: 600;
  min-width: 3.5em;
}

/* 右侧：滑块 */
.sliders-block {
  flex: 1 1 280px;
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

.sliders-block label input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 140px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.sliders-block label input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
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
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.sliders-block label span {
  display: inline-flex;
  align-items: center;
  padding: 0.2em 0.6em;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 600;
  min-width: 3em;
  text-align: center;
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

/* 状态指示 */
.demo-status {
  margin-top: var(--space-2);
  padding: 0.3em 0.8em;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.demo-status.info {
  background: var(--bg-info-soft);
  color: var(--color-info);
}

.demo-status.success {
  background: var(--bg-success-soft);
  color: var(--color-success);
}

.demo-status.warning {
  background: var(--bg-warning-soft);
  color: var(--color-warning);
}

.demo-status.error {
  background: var(--bg-danger-soft);
  color: var(--color-danger);
}

/* 提示文字 */
.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}
</style>
