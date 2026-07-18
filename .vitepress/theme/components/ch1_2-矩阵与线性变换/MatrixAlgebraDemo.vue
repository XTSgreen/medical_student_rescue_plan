<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">
      {{ initStatus }}
    </div>

    <!-- 模式切换 -->
    <div class="demo-mode-selector">
      <button
        :class="['mode-btn', { active: mode === 'add' }]"
        @click="switchMode('add')"
      >
        矩阵加法 A + B
      </button>
      <button
        :class="['mode-btn', { active: mode === 'mul' }]"
        @click="switchMode('mul')"
      >
        矩阵乘法 A · B
      </button>
    </div>

    <!-- 模式 1：加法 -->
    <div v-if="mode === 'add'" class="matrix-grid">
      <div class="matrix-card">
        <p class="block-title">矩阵 A</p>
        <div class="matrix-bracket">
          <table class="matrix-table">
            <tr>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aA" /></td>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aB" /></td>
            </tr>
            <tr>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aC" /></td>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aD" /></td>
            </tr>
          </table>
        </div>
        <p class="matrix-values">
          [[{{ aA.toFixed(2) }}, {{ aB.toFixed(2) }}], [{{ aC.toFixed(2) }}, {{ aD.toFixed(2) }}]]
        </p>
      </div>

      <div class="matrix-card">
        <p class="block-title">矩阵 B</p>
        <div class="matrix-bracket">
          <table class="matrix-table">
            <tr>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bA" /></td>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bB" /></td>
            </tr>
            <tr>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bC" /></td>
              <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bD" /></td>
            </tr>
          </table>
        </div>
        <p class="matrix-values">
          [[{{ bA.toFixed(2) }}, {{ bB.toFixed(2) }}], [{{ bC.toFixed(2) }}, {{ bD.toFixed(2) }}]]
        </p>
      </div>

      <div class="matrix-card result">
        <p class="block-title">A + B</p>
        <div class="matrix-bracket">
          <table class="matrix-table readout">
            <tr>
              <td>{{ (aA + bA).toFixed(2) }}</td>
              <td>{{ (aB + bB).toFixed(2) }}</td>
            </tr>
            <tr>
              <td>{{ (aC + bC).toFixed(2) }}</td>
              <td>{{ (aD + bD).toFixed(2) }}</td>
            </tr>
          </table>
        </div>
        <p class="matrix-values">逐元素相加</p>
      </div>
    </div>

    <!-- 模式 2：乘法 -->
    <div v-if="mode === 'mul'" class="mul-controls">
      <div class="matrix-grid">
        <div class="matrix-card">
          <p class="block-title">矩阵 A</p>
          <div class="matrix-bracket">
            <table class="matrix-table">
              <tr>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aA" /></td>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aB" /></td>
              </tr>
              <tr>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aC" /></td>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="aD" /></td>
              </tr>
            </table>
          </div>
          <p class="matrix-values">
            [[{{ aA.toFixed(2) }}, {{ aB.toFixed(2) }}], [{{ aC.toFixed(2) }}, {{ aD.toFixed(2) }}]]
          </p>
        </div>

        <div class="matrix-card">
          <p class="block-title">矩阵 B</p>
          <div class="matrix-bracket">
            <table class="matrix-table">
              <tr>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bA" /></td>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bB" /></td>
              </tr>
              <tr>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bC" /></td>
                <td><input type="range" min="-3" max="3" step="0.1" v-model.number="bD" /></td>
              </tr>
            </table>
          </div>
          <p class="matrix-values">
            [[{{ bA.toFixed(2) }}, {{ bB.toFixed(2) }}], [{{ bC.toFixed(2) }}, {{ bD.toFixed(2) }}]]
          </p>
        </div>

        <div class="matrix-card result">
          <p class="block-title">A · B</p>
          <div class="matrix-bracket">
            <table class="matrix-table readout">
              <tr>
                <td>{{ mulResult[0].toFixed(2) }}</td>
                <td>{{ mulResult[1].toFixed(2) }}</td>
              </tr>
              <tr>
                <td>{{ mulResult[2].toFixed(2) }}</td>
                <td>{{ mulResult[3].toFixed(2) }}</td>
              </tr>
            </table>
          </div>
          <p class="matrix-values">先 B 后 A 的复合</p>
        </div>
      </div>

      <!-- 步骤控制 -->
      <div class="step-controls">
        <button class="ctrl-btn" @click="reset">重置</button>
        <button class="ctrl-btn" @click="stepBack" :disabled="currentStep === 0">◀ 上一步</button>
        <button class="ctrl-btn primary" @click="togglePlay">
          {{ playing ? '⏸ 暂停' : '▶ 自动播放' }}
        </button>
        <button class="ctrl-btn" @click="stepForward" :disabled="currentStep === 3">下一步 ▶</button>
      </div>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div
          v-for="(s, idx) in mulSteps"
          :key="idx"
          :class="['step-dot', {
            done: idx < currentStep,
            active: idx === currentStep - 1 || (currentStep === 0 && idx === 0)
          }]"
        >
          <span class="dot-num">{{ idx + 1 }}</span>
          <span class="dot-name">{{ s }}</span>
        </div>
      </div>
    </div>

    <!-- 信息面板 -->
    <div class="demo-output">
      <div class="output-row highlight">
        <span class="label">当前运算</span>
        <span class="value">{{ operationText }}</span>
      </div>
      <div class="output-row">
        <span class="label">当前步骤</span>
        <span class="value">{{ stepText }}</span>
      </div>
      <div class="output-row">
        <span class="label">几何意义</span>
        <span class="value">{{ geometryText }}</span>
      </div>
      <div class="output-row">
        <span class="label">结果矩阵</span>
        <span class="value matrix-display">{{ resultMatrixDisplay }}</span>
      </div>
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
    title: '矩阵代数运算 · 加法叠加与乘法复合'
  }
)

// ---------- 模式 ----------
type Mode = 'add' | 'mul'
const mode = ref<Mode>('add')

// ---------- 矩阵元素滑块 ----------
// A = [[aA, aB], [aC, aD]]，B = [[bA, bB], [bC, bD]]
const aA = ref(1.5)
const aB = ref(0.3)
const aC = ref(0.2)
const aD = ref(1.0)
const bA = ref(0.5)
const bB = ref(-0.4)
const bC = ref(0.3)
const bD = ref(0.8)

// ---------- 模式默认值 ----------
const DEFAULTS_ADD = {
  aA: 1.5, aB: 0.3, aC: 0.2, aD: 1.0,
  bA: 0.5, bB: -0.4, bC: 0.3, bD: 0.8
}
const DEFAULTS_MUL = {
  aA: 1.0, aB: 0.0, aC: 0.0, aD: 1.0,
  bA: 1.5, bB: 0.5, bC: -0.3, bD: 1.2
}

// ---------- 矩阵乘法步骤 ----------
const mulSteps = ['原始', '应用 B', '应用 A·B']
const currentStep = ref(0)
const playing = ref(false)
let playTimer: number | null = null

// ---------- 矩阵乘法 ----------
function matMul(
  A: [number, number, number, number],
  B: [number, number, number, number]
): [number, number, number, number] {
  const [a1, b1, c1, d1] = A
  const [a2, b2, c2, d2] = B
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2
  ]
}

// ---------- 计算属性 ----------
const matrixA = computed<[number, number, number, number]>(
  () => [aA.value, aB.value, aC.value, aD.value]
)
const matrixB = computed<[number, number, number, number]>(
  () => [bA.value, bB.value, bC.value, bD.value]
)
const matrixAdd = computed<[number, number, number, number]>(
  () => [
    aA.value + bA.value,
    aB.value + bB.value,
    aC.value + bC.value,
    aD.value + bD.value
  ]
)
const mulResult = computed<[number, number, number, number]>(
  () => matMul(matrixA.value, matrixB.value)
)

const resultMatrixDisplay = computed(() => {
  const m = mode.value === 'add' ? matrixAdd.value : mulResult.value
  return `[[${m[0].toFixed(2)}, ${m[1].toFixed(2)}], [${m[2].toFixed(2)}, ${m[3].toFixed(2)}]]`
})

const operationText = computed(() =>
  mode.value === 'add' ? 'A + B（逐元素相加，变换叠加）' : 'A · B（矩阵相乘，变换复合）'
)

const stepText = computed(() => {
  if (mode.value === 'add') return '加法模式（无分步）'
  if (currentStep.value === 0) return '初始状态（仅显示原始单位正方形）'
  if (currentStep.value === 1) return '第 1 步：应用 B（黄色虚线为中间状态）'
  if (currentStep.value === 2) return '第 2 步：应用 A·B（红色为最终状态）'
  return `已完成全部 ${mulSteps.length} 步`
})

const geometryText = computed(() =>
  mode.value === 'add'
    ? '(A+B)x = Ax + Bx，对任意向量 x'
    : 'A·B 表示「先 B 后 A」的复合（矩阵乘法从右向左读）'
)

const tipText = computed(() =>
  mode.value === 'add'
    ? '蓝色 = 单独应用 A 的效果，紫色 = 单独应用 B 的效果，绿色（最显眼）= 应用 A+B 的效果。' +
      'A+B 几何上等价于变换的叠加：对任意向量 x，(A+B)x = Ax + Bx。'
    : '灰色虚线 = 原始单位正方形，黄色虚线 = 应用 B 后的中间状态，红色 = 应用 A·B 后的最终状态。' +
      '矩阵乘法从右向左读：A·B 表示先 B 后 A 的复合变换。点击"自动播放"可观看分步动画。'
)

// ---------- 模式切换 ----------
function switchMode(newMode: Mode) {
  if (newMode === mode.value) return
  mode.value = newMode
  // 重置为对应模式的默认值
  const d = newMode === 'add' ? DEFAULTS_ADD : DEFAULTS_MUL
  aA.value = d.aA; aB.value = d.aB; aC.value = d.aC; aD.value = d.aD
  bA.value = d.bA; bB.value = d.bB; bC.value = d.bC; bD.value = d.bD
  // 重置步骤
  currentStep.value = 0
  playing.value = false
  if (playTimer !== null) {
    clearInterval(playTimer)
    playTimer = null
  }
}

// ---------- 步骤控制 ----------
function stepForward() {
  if (currentStep.value < 3) currentStep.value++
}
function stepBack() {
  if (currentStep.value > 0) currentStep.value--
}
function reset() {
  currentStep.value = 0
  playing.value = false
  if (playTimer !== null) {
    clearInterval(playTimer)
    playTimer = null
  }
}
function togglePlay() {
  if (playing.value) {
    playing.value = false
    if (playTimer !== null) {
      clearInterval(playTimer)
      playTimer = null
    }
  } else {
    if (currentStep.value >= 3) currentStep.value = 0
    playing.value = true
    playTimer = window.setInterval(() => {
      if (currentStep.value < 3) {
        currentStep.value++
      } else {
        playing.value = false
        if (playTimer !== null) {
          clearInterval(playTimer)
          playTimer = null
        }
      }
    }, 1500)
  }
}

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

// 场景对象引用
let originalSquare: THREE.LineLoop          // 原始单位正方形（灰色虚线）
let aSquare: THREE.Mesh                      // A 的效果（蓝色填充）
let aSquareEdges: THREE.LineLoop
let bSquare: THREE.Mesh                      // B 的效果（紫色填充）
let bSquareEdges: THREE.LineLoop
let abSquare: THREE.Mesh                     // A+B 的效果（绿色填充）
let abSquareEdges: THREE.LineLoop
let yellowSquare: THREE.LineLoop             // B 中间状态（黄色虚线）
let redSquare: THREE.Mesh                    // A·B 最终效果（红色填充）
let redSquareEdges: THREE.LineLoop

// 配色（与项目其他组件一致）
const COLOR_ORIG = 0x9ca3af        // 灰（原始）
const COLOR_A_FILL = 0x3b82f6      // 蓝（A 的效果）
const COLOR_A_EDGE = 0x1d4ed8      // 深蓝
const COLOR_B_FILL = 0xa78bfa      // 紫（B 的效果）
const COLOR_B_EDGE = 0x7c3aed      // 深紫
const COLOR_AB_FILL = 0x10b981     // 绿（A+B，最显眼）
const COLOR_AB_EDGE = 0x059669     // 深绿
const COLOR_YELLOW = 0xfbbf24      // 黄（B 中间状态）
const COLOR_RED_FILL = 0xef4444    // 红（A·B 最终）
const COLOR_RED_EDGE = 0xb91c1c    // 深红
const COLOR_GRID = 0xe5e7eb        // 浅灰（网格）

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- 初始化 ----------
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

  // 正交相机：俯视 XY 平面
  const aspect = width / height
  const viewSize = 7
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
  // 限制只能俯视（2D 视角）
  controls.enableRotate = false

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 网格（浅灰）
  for (let i = -6; i <= 6; i++) {
    const op = i === 0 ? 0.8 : 0.4
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-6, i, -0.01),
      new THREE.Vector3(6, i, -0.01)
    ])
    scene.add(new THREE.Line(hGeom, new THREE.LineBasicMaterial({
      color: COLOR_GRID, transparent: true, opacity: op
    })))
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -6, -0.01),
      new THREE.Vector3(i, 6, -0.01)
    ])
    scene.add(new THREE.Line(vGeom, new THREE.LineBasicMaterial({
      color: COLOR_GRID, transparent: true, opacity: op
    })))
  }

  // 原始单位正方形（灰色虚线）
  const origGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0.02),
    new THREE.Vector3(1, 0, 0.02),
    new THREE.Vector3(1, 1, 0.02),
    new THREE.Vector3(0, 1, 0.02)
  ])
  originalSquare = new THREE.LineLoop(origGeom, new THREE.LineDashedMaterial({
    color: COLOR_ORIG,
    dashSize: 0.1,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.7
  }))
  originalSquare.computeLineDistances()
  scene.add(originalSquare)

  // A 的效果正方形（蓝色填充 + 边框）
  aSquare = createFilledSquare(COLOR_A_FILL, 0.3, 0.05)
  aSquareEdges = createEdgeLoop(COLOR_A_EDGE, 0.05)
  scene.add(aSquare)
  scene.add(aSquareEdges)

  // B 的效果正方形（紫色填充 + 边框）
  bSquare = createFilledSquare(COLOR_B_FILL, 0.3, 0.06)
  bSquareEdges = createEdgeLoop(COLOR_B_EDGE, 0.06)
  scene.add(bSquare)
  scene.add(bSquareEdges)

  // A+B 的效果正方形（绿色填充 + 边框，最显眼）
  abSquare = createFilledSquare(COLOR_AB_FILL, 0.42, 0.07)
  abSquareEdges = createEdgeLoop(COLOR_AB_EDGE, 0.07)
  scene.add(abSquare)
  scene.add(abSquareEdges)

  // B 中间状态（黄色虚线，无填充）
  yellowSquare = createDashedLoop(COLOR_YELLOW, 0.05)
  scene.add(yellowSquare)

  // A·B 最终效果（红色填充 + 边框）
  redSquare = createFilledSquare(COLOR_RED_FILL, 0.42, 0.07)
  redSquareEdges = createEdgeLoop(COLOR_RED_EDGE, 0.07)
  scene.add(redSquare)
  scene.add(redSquareEdges)

  // 原点小球
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  ))

  updateScene()
}

// ---------- 工厂函数 ----------
function createFilledSquare(color: number, opacity: number, z: number): THREE.Mesh {
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  geom.setIndex([0, 1, 2, 0, 2, 3])
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geom, mat)
  return mesh
}

function createEdgeLoop(color: number, z: number): THREE.LineLoop {
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z)
  ])
  const mat = new THREE.LineBasicMaterial({ color })
  return new THREE.LineLoop(geom, mat)
}

function createDashedLoop(color: number, z: number): THREE.LineLoop {
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(0, 0, z)
  ])
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.6
  })
  const loop = new THREE.LineLoop(geom, mat)
  loop.computeLineDistances()
  return loop
}

// ---------- 几何辅助 ----------
function applyMatrixToSquare(
  m: [number, number, number, number],
  z: number
): [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const [a, b, c, d] = m
  return [
    new THREE.Vector3(0, 0, z),
    new THREE.Vector3(a, c, z),
    new THREE.Vector3(a + b, c + d, z),
    new THREE.Vector3(b, d, z)
  ]
}

function updateMesh(
  mesh: THREE.Mesh,
  edges: THREE.LineLoop,
  verts: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]
) {
  const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < 4; i++) {
    pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z)
  }
  pos.needsUpdate = true

  const epos = edges.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < 4; i++) {
    epos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z)
  }
  epos.needsUpdate = true
}

function updateLoop(
  loop: THREE.LineLoop,
  verts: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]
) {
  const pos = loop.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < 4; i++) {
    pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z)
  }
  pos.needsUpdate = true
  loop.computeLineDistances()
}

// ---------- 更新场景 ----------
function updateScene() {
  if (!scene) return

  if (mode.value === 'add') {
    // 隐藏乘法模式的正方形
    yellowSquare.visible = false
    redSquare.visible = false
    redSquareEdges.visible = false

    // 显示加法模式的正方形
    aSquare.visible = true
    aSquareEdges.visible = true
    bSquare.visible = true
    bSquareEdges.visible = true
    abSquare.visible = true
    abSquareEdges.visible = true

    // 更新位置
    updateMesh(aSquare, aSquareEdges, applyMatrixToSquare(matrixA.value, 0.05))
    updateMesh(bSquare, bSquareEdges, applyMatrixToSquare(matrixB.value, 0.06))
    updateMesh(abSquare, abSquareEdges, applyMatrixToSquare(matrixAdd.value, 0.07))
  } else {
    // 隐藏加法模式的正方形
    aSquare.visible = false
    aSquareEdges.visible = false
    bSquare.visible = false
    bSquareEdges.visible = false
    abSquare.visible = false
    abSquareEdges.visible = false

    // 根据步骤显示乘法模式的正方形
    // 步骤 0：仅原始
    // 步骤 1：+ B 中间状态
    // 步骤 2、3：+ A·B 最终状态
    if (currentStep.value >= 1) {
      yellowSquare.visible = true
      updateLoop(yellowSquare, applyMatrixToSquare(matrixB.value, 0.05))
    } else {
      yellowSquare.visible = false
    }

    if (currentStep.value >= 2) {
      redSquare.visible = true
      redSquareEdges.visible = true
      updateMesh(redSquare, redSquareEdges, applyMatrixToSquare(mulResult.value, 0.07))
    } else {
      redSquare.visible = false
      redSquareEdges.visible = false
    }
  }
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
  const viewSize = 7
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
    initStatus.value = '✗ 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('MatrixAlgebraDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (playTimer !== null) clearInterval(playTimer)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})

// 监听参数变化
watch(
  [mode, aA, aB, aC, aD, bA, bB, bC, bD, currentStep],
  updateScene
)
</script>

<style scoped>
/* ---------- 模式切换 ---------- */
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

/* ---------- 矩阵网格布局 ---------- */
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin: var(--space-3) 0;
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

@media (max-width: 760px) {
  .matrix-grid {
    grid-template-columns: 1fr;
  }
}

.matrix-card {
  padding: var(--space-3);
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.matrix-card.result {
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}

.block-title {
  font-weight: 600;
  font-size: var(--fs-sm);
  margin: 0 0 var(--space-2);
  color: var(--text-primary);
  text-align: center;
}

.matrix-card.result .block-title {
  color: var(--color-accent-strong);
}

/* ---------- 矩阵括号装饰 ---------- */
.matrix-bracket {
  position: relative;
  display: inline-block;
  padding: var(--space-2) var(--space-3);
}

.matrix-bracket::before,
.matrix-bracket::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  border: 2px solid var(--text-secondary);
}

.matrix-bracket::before {
  left: 0;
  border-right: none;
}

.matrix-bracket::after {
  right: 0;
  border-left: none;
}

.matrix-card.result .matrix-bracket::before,
.matrix-card.result .matrix-bracket::after {
  border-color: var(--color-accent-strong);
}

/* ---------- 矩阵表格 ---------- */
.matrix-table {
  border-collapse: collapse;
  margin: 0;
}

.matrix-table td {
  padding: var(--space-2);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  min-width: 60px;
}

.matrix-table.readout td {
  font-weight: 700;
  color: var(--color-accent-strong);
  font-size: var(--fs-base);
}

.matrix-table input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  min-width: 60px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
  margin: 0 auto;
}

.matrix-table input[type="range"]::-webkit-slider-thumb {
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

.matrix-table input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.matrix-table input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.matrix-values {
  margin-top: var(--space-2);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-tertiary);
}

/* ---------- 步骤控制 ---------- */
.step-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  justify-content: center;
}

.ctrl-btn {
  padding: 0.4em 1em;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  transition: all 0.15s ease;
}

.ctrl-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctrl-btn.primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.ctrl-btn.primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  color: white;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  flex-wrap: wrap;
}

.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4em 0.8em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  min-width: 90px;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.step-dot.done {
  opacity: 1;
  border-color: var(--color-success);
  background: var(--bg-success-soft);
}

.step-dot.active {
  opacity: 1;
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.dot-num {
  font-weight: 700;
  font-size: var(--fs-lg);
  color: var(--text-primary);
}

.dot-name {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  margin-top: 0.2em;
}

/* ---------- 信息面板 ---------- */
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
  padding: 0.3em 0.6em;
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
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-accent-text);
}

.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
  line-height: 1.7;
}

/* ---------- 初始化状态指示 ---------- */
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
