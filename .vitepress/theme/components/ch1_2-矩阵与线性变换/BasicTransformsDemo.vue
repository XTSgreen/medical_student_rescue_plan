<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <!-- 变换类型选择 -->
    <div class="demo-mode-selector">
      <button
        v-for="m in modes"
        :key="m.key"
        :class="['mode-btn', { active: mode === m.key }]"
        @click="mode = m.key"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- 参数滑块（动态） -->
    <div class="demo-controls">
      <template v-if="mode === 'scale'">
        <label>
          sx（x 方向缩放）
          <input type="range" min="0.1" max="3" step="0.05" v-model.number="sx" />
          <span class="demo-readout">{{ sx.toFixed(2) }}</span>
        </label>
        <label>
          sy（y 方向缩放）
          <input type="range" min="0.1" max="3" step="0.05" v-model.number="sy" />
          <span class="demo-readout">{{ sy.toFixed(2) }}</span>
        </label>
      </template>

      <template v-else-if="mode === 'rotate'">
        <label>
          θ（旋转角度）
          <input type="range" min="0" max="360" step="1" v-model.number="thetaDeg" />
          <span class="demo-readout">{{ thetaDeg.toFixed(0) }}°</span>
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="showTrail" />
          显示旋转轨迹（单位圆）
        </label>
      </template>

      <template v-else-if="mode === 'shear'">
        <label>
          k（剪切系数）
          <input type="range" min="-2" max="2" step="0.05" v-model.number="shearK" />
          <span class="demo-readout">{{ shearK.toFixed(2) }}</span>
        </label>
        <div class="radio-group">
          <label>
            <input type="radio" value="horizontal" v-model="shearDir" />
            水平剪切（x 受 y 影响）
          </label>
          <label>
            <input type="radio" value="vertical" v-model="shearDir" />
            垂直剪切（y 受 x 影响）
          </label>
        </div>
      </template>

      <template v-else-if="mode === 'reflect'">
        <div class="radio-group">
          <label>
            <input type="radio" value="x" v-model="reflectAxis" />
            关于 X 轴
          </label>
          <label>
            <input type="radio" value="y" v-model="reflectAxis" />
            关于 Y 轴
          </label>
          <label>
            <input type="radio" value="diag" v-model="reflectAxis" />
            关于 y = x
          </label>
          <label>
            <input type="radio" value="origin" v-model="reflectAxis" />
            关于原点
          </label>
        </div>
      </template>
    </div>

    <!-- 矩阵与输出 -->
    <div class="demo-output">
      <div class="output-row">
        <span class="label">变换矩阵 A</span>
        <span class="value matrix-display">{{ matrixDisplay }}</span>
      </div>
      <div class="output-row" :class="detClass">
        <span class="label">det(A)</span>
        <span class="value">{{ det.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">面积</span>
        <span class="value">{{ Math.abs(det).toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">定向</span>
        <span class="value" :class="{ 'text-danger': det < -1e-6 }">{{ orientationText }}</span>
      </div>
      <div class="output-row" v-if="mode === 'shear'">
        <span class="label">面积守恒</span>
        <span class="value" :class="{ highlight: Math.abs(det - 1) < 1e-3 }">
          {{ Math.abs(det - 1) < 1e-3 ? '保持不变（|det|=1）' : '改变' }}
        </span>
      </div>
    </div>

    <p class="demo-tip">
      灰色虚线 = 原始单位正方形；绿色填充 = 变换后形状。切换不同变换类型，观察每种变换如何"扭曲"空间。
      注意：旋转和剪切的面积始终为 1；反射的面积为 1 但定向翻转（绿色变红色）。
    </p>
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
    title: '四种基本线性变换交互演示'
  }
)

// ---------- 变换模式（不包含投影） ----------
type Mode = 'scale' | 'rotate' | 'shear' | 'reflect'
const modes: { key: Mode; label: string }[] = [
  { key: 'scale', label: '缩放' },
  { key: 'rotate', label: '旋转' },
  { key: 'shear', label: '剪切' },
  { key: 'reflect', label: '反射' }
]
const mode = ref<Mode>('scale')

// ---------- 参数 ----------
const sx = ref(1.5)
const sy = ref(0.8)
const thetaDeg = ref(45)
const showTrail = ref(false)
const shearK = ref(1)
const shearDir = ref<'horizontal' | 'vertical'>('horizontal')
const reflectAxis = ref<'x' | 'y' | 'diag' | 'origin'>('x')

// ---------- 计算变换矩阵 ----------
// 返回 [a, b, c, d] 表示 [[a, b], [c, d]]
const matrix = computed<[number, number, number, number]>(() => {
  switch (mode.value) {
    case 'scale':
      return [sx.value, 0, 0, sy.value]
    case 'rotate': {
      const t = (thetaDeg.value * Math.PI) / 180
      return [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)]
    }
    case 'shear':
      return shearDir.value === 'horizontal'
        ? [1, shearK.value, 0, 1]
        : [1, 0, shearK.value, 1]
    case 'reflect':
      switch (reflectAxis.value) {
        case 'x': return [1, 0, 0, -1]
        case 'y': return [-1, 0, 0, 1]
        case 'diag': return [0, 1, 1, 0]
        case 'origin': return [-1, 0, 0, -1]
      }
      return [1, 0, 0, 1]
  }
})

const det = computed(
  () => matrix.value[0] * matrix.value[3] - matrix.value[1] * matrix.value[2]
)

const matrixDisplay = computed(() => {
  const [a, b, c, d] = matrix.value
  return `[[${a.toFixed(2)}, ${b.toFixed(2)}], [${c.toFixed(2)}, ${d.toFixed(2)}]]`
})

const detClass = computed(() => ({
  positive: det.value > 1e-6,
  negative: det.value < -1e-6,
  zero: Math.abs(det.value) <= 1e-6
}))

const orientationText = computed(() => {
  if (Math.abs(det.value) < 1e-6) return '塌缩'
  return det.value > 0 ? '保持（右手系）' : '翻转（左手系）'
})

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

// 场景对象引用
let originalSquare: THREE.LineLoop
let transformedSquare: THREE.Mesh
let transformedSquareEdges: THREE.LineLoop
let arrowI: THREE.ArrowHelper  // 原始 i 基向量
let arrowJ: THREE.ArrowHelper  // 原始 j 基向量
let arrowI2: THREE.ArrowHelper  // 变换后 i'
let arrowJ2: THREE.ArrowHelper  // 变换后 j'
let trail: THREE.Line           // 旋转轨迹（单位圆）
let gridLines: THREE.Line[]

// 配色（浅色主题）
const COLOR_ORIG_SQUARE = 0x9ca3af      // 灰
const COLOR_TRANSFORM_FILL = 0x10b981  // 绿（半透明填充）
const COLOR_TRANSFORM_EDGE = 0x059669  // 深绿
const COLOR_TRANSFORM_FILL_NEG = 0xef4444 // 红（det < 0）
const COLOR_TRANSFORM_EDGE_NEG = 0xb91c1c // 深红
const COLOR_COLLAPSE = 0x6b7280        // 灰（塌缩）
const COLOR_I = 0xef4444               // 红
const COLOR_J = 0x3b82f6               // 蓝
const COLOR_I2 = 0xb91c1c             // 深红
const COLOR_J2 = 0x1d4ed8              // 深蓝
const COLOR_GRID_ORIG = 0xe5e7eb       // 浅灰
const COLOR_TRAIL = 0x9ca3af           // 灰（轨迹虚线）

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- 根据行列式获取填充/边框颜色 ----------
function getFillColor(d: number): number {
  if (Math.abs(d) < 1e-6) return COLOR_COLLAPSE
  return d > 0 ? COLOR_TRANSFORM_FILL : COLOR_TRANSFORM_FILL_NEG
}
function getEdgeColor(d: number): number {
  if (Math.abs(d) < 1e-6) return COLOR_COLLAPSE
  return d > 0 ? COLOR_TRANSFORM_EDGE : COLOR_TRANSFORM_EDGE_NEG
}

// ---------- 初始化 ----------
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
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return
  }

  scene = new THREE.Scene()
  scene.background = null

  // 正交相机：俯视 XY 平面，便于看清 2D 变换
  const aspect = width / height
  const viewSize = 6
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
  controls.minZoom = 0.3
  controls.maxZoom = 5
  // 限制只能俯视（2D 视角）
  controls.enableRotate = false

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 原始网格（细线，浅灰）
  gridLines = []
  for (let i = -5; i <= 5; i++) {
    const v = i
    // 水平线
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, v, -0.01),
      new THREE.Vector3(5, v, -0.01)
    ])
    const hMat = new THREE.LineBasicMaterial({
      color: COLOR_GRID_ORIG,
      transparent: true,
      opacity: i === 0 ? 0.8 : 0.4
    })
    const hLine = new THREE.Line(hGeom, hMat)
    gridLines.push(hLine)
    scene.add(hLine)
    // 垂直线
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(v, -5, -0.01),
      new THREE.Vector3(v, 5, -0.01)
    ])
    const vMat = new THREE.LineBasicMaterial({
      color: COLOR_GRID_ORIG,
      transparent: true,
      opacity: i === 0 ? 0.8 : 0.4
    })
    const vLine = new THREE.Line(vGeom, vMat)
    gridLines.push(vLine)
    scene.add(vLine)
  }

  // 原始单位正方形（灰色虚线）
  const origGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0.02),
    new THREE.Vector3(1, 0, 0.02),
    new THREE.Vector3(1, 1, 0.02),
    new THREE.Vector3(0, 1, 0.02)
  ])
  const origMat = new THREE.LineDashedMaterial({
    color: COLOR_ORIG_SQUARE,
    dashSize: 0.1,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.7
  })
  originalSquare = new THREE.LineLoop(origGeom, origMat)
  originalSquare.computeLineDistances()
  scene.add(originalSquare)

  // 旋转轨迹：单位圆（默认隐藏，watch 中根据 showTrail 切换）
  const trailPoints: THREE.Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2
    trailPoints.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.001))
  }
  const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPoints)
  const trailMat = new THREE.LineDashedMaterial({
    color: COLOR_TRAIL,
    dashSize: 0.1,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.5
  })
  trail = new THREE.Line(trailGeom, trailMat)
  trail.computeLineDistances()
  trail.visible = false
  scene.add(trail)

  // 变换后单位正方形（绿色填充 + 边框）
  const transGeom = new THREE.BufferGeometry()
  transGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(4 * 3), 3)
  )
  transGeom.setIndex([0, 1, 2, 0, 2, 3])
  const transMat = new THREE.MeshBasicMaterial({
    color: COLOR_TRANSFORM_FILL,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  })
  transformedSquare = new THREE.Mesh(transGeom, transMat)
  scene.add(transformedSquare)

  const transEdgeGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ])
  const transEdgeMat = new THREE.LineBasicMaterial({
    color: COLOR_TRANSFORM_EDGE,
    linewidth: 2
  })
  transformedSquareEdges = new THREE.LineLoop(transEdgeGeom, transEdgeMat)
  scene.add(transformedSquareEdges)

  // 原始基向量箭头（半透明）
  arrowI = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    COLOR_I,
    0.15,
    0.1
  )
  arrowI.line.material.transparent = true
  arrowI.line.material.opacity = 0.4
  arrowI.cone.material.transparent = true
  arrowI.cone.material.opacity = 0.4
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
  arrowJ.line.material.opacity = 0.4
  arrowJ.cone.material.transparent = true
  arrowJ.cone.material.opacity = 0.4
  scene.add(arrowJ)

  // 变换后基向量箭头
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

  // 原点小球
  const originGeom = new THREE.SphereGeometry(0.06, 16, 16)
  const originMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  scene.add(new THREE.Mesh(originGeom, originMat))

  updateScene()
}

// ---------- 更新场景 ----------
function updateScene() {
  if (!scene) return
  const [a, b, c, d] = matrix.value

  // 变换后单位正方形的 4 个顶点：(0,0), (a,c), (a+b, c+d), (b,d)
  const v0 = new THREE.Vector3(0, 0, 0.05)
  const v1 = new THREE.Vector3(a, c, 0.05)
  const v2 = new THREE.Vector3(a + b, c + d, 0.05)
  const v3 = new THREE.Vector3(b, d, 0.05)

  // 更新填充几何
  const pos = transformedSquare.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true
  transformedSquare.geometry.computeVertexNormals()

  // 更新边框
  const epos = transformedSquareEdges.geometry.attributes.position as THREE.BufferAttribute
  epos.setXYZ(0, v0.x, v0.y, v0.z)
  epos.setXYZ(1, v1.x, v1.y, v1.z)
  epos.setXYZ(2, v2.x, v2.y, v2.z)
  epos.setXYZ(3, v3.x, v3.y, v3.z)
  epos.needsUpdate = true

  // 根据行列式符号动态着色
  const fillColor = getFillColor(det.value)
  const edgeColor = getEdgeColor(det.value)
  ;(transformedSquare.material as THREE.MeshBasicMaterial).color.setHex(fillColor)
  ;(transformedSquareEdges.material as THREE.LineBasicMaterial).color.setHex(edgeColor)

  // 更新变换后基向量 i' = (a, c)
  const iLen = Math.sqrt(a * a + c * c)
  if (iLen > 1e-4) {
    arrowI2.setDirection(new THREE.Vector3(a, c, 0).normalize())
    arrowI2.setLength(iLen, 0.2, 0.12)
    arrowI2.visible = true
  } else {
    arrowI2.visible = false
  }

  // 更新变换后基向量 j' = (b, d)
  const jLen = Math.sqrt(b * b + d * d)
  if (jLen > 1e-4) {
    arrowJ2.setDirection(new THREE.Vector3(b, d, 0).normalize())
    arrowJ2.setLength(jLen, 0.2, 0.12)
    arrowJ2.visible = true
  } else {
    arrowJ2.visible = false
  }

  // 旋转轨迹：仅在 rotate 模式且 showTrail = true 时显示
  trail.visible = mode.value === 'rotate' && showTrail.value
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
  const aspect = width / height
  const viewSize = 6
  camera.left = -viewSize * aspect / 2
  camera.right = viewSize * aspect / 2
  camera.top = viewSize / 2
  camera.bottom = -viewSize / 2
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
    console.error('BasicTransformsDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})

// 监听所有参数和模式变化
watch(
  [mode, sx, sy, thetaDeg, showTrail, shearK, shearDir, reflectAxis],
  updateScene
)
</script>

<style scoped>
.demo-mode-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  justify-content: center;
}

.mode-btn {
  padding: 0.4em 1.2em;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  transition: all 0.15s ease;
}

.mode-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.mode-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

/* ---------- 单选按钮组 ---------- */
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  flex-basis: 100%;
  padding: 0.2em 0;
}

.radio-group label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.radio-group input[type='radio'] {
  accent-color: var(--color-accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}

/* ---------- 输出面板 ---------- */
.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
}

.output-row .value.highlight {
  color: var(--color-success);
  background: var(--bg-success-soft);
  padding: 0.1em 0.4em;
  border-radius: var(--radius-sm);
}

/* det(A) 行的颜色提示 */
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
  border-color: var(--border-color-strong);
  background: var(--bg-hover);
}
.output-row.zero .label,
.output-row.zero .value {
  color: var(--text-tertiary);
}

/* ---------- 矩阵等宽显示 ---------- */
.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

/* ---------- 文本红色提示 ---------- */
.text-danger {
  color: var(--color-danger) !important;
  font-weight: 600;
}

/* ---------- 复选框 ---------- */
.demo-controls .checkbox {
  flex-basis: 100%;
  cursor: pointer;
  user-select: none;
}

.demo-controls .checkbox input[type='checkbox'] {
  accent-color: var(--color-accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ---------- 提示文字 ---------- */
.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}

/* 初始化状态指示 */
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
</style>
