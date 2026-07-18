<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="gaussian-layout">
      <!-- 左侧：3D 几何场景 -->
      <div class="geometry-pane">
        <p class="pane-label">几何场景：三个平面相交</p>
        <div ref="canvasContainer" class="demo-canvas"></div>
      </div>

      <!-- 右侧：矩阵步骤显示 -->
      <div class="matrix-pane">
        <p class="pane-label">增广矩阵 [A|b]</p>
        <div class="matrix-step-display">
          <table class="aug-matrix">
            <tr v-for="(row, ri) in currentMatrix" :key="ri">
              <td v-for="(val, ci) in row" :key="ci"
                  :class="{ pivot: isPivot(ri, ci), aug: ci === 3 }">
                {{ val.toFixed(2) }}
              </td>
            </tr>
          </table>
          <p class="step-description">{{ currentStep.description }}</p>
          <p class="geometry-hint">{{ currentStep.geometryHint }}</p>
        </div>
      </div>
    </div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <!-- 预设 -->
    <div class="preset-buttons">
      <button :class="['preset-btn', { active: preset === 'unique' }]" @click="setPreset('unique')">唯一解</button>
      <button :class="['preset-btn', { active: preset === 'infinite' }]" @click="setPreset('infinite')">无穷解</button>
      <button :class="['preset-btn', { active: preset === 'none' }]" @click="setPreset('none')">无解</button>
    </div>

    <!-- 步骤控制 -->
    <div class="step-controls">
      <button @click="reset" class="ctrl-btn">重置</button>
      <button @click="stepBack" class="ctrl-btn" :disabled="stepIdx === 0">◀ 上一步</button>
      <button @click="togglePlay" class="ctrl-btn primary">{{ playing ? '⏸ 暂停' : '▶ 自动播放' }}</button>
      <button @click="stepForward" class="ctrl-btn" :disabled="stepIdx >= steps.length - 1">下一步 ▶</button>
    </div>

    <div class="step-indicator">
      <div v-for="(s, idx) in steps" :key="idx"
           :class="['step-dot', { done: idx < stepIdx, active: idx === stepIdx }]">
        <span class="dot-num">{{ idx }}</span>
        <span class="dot-name">步骤 {{ idx }}</span>
      </div>
    </div>

    <!-- 输出 -->
    <div class="demo-output">
      <div class="output-row">
        <span class="label">当前步骤</span>
        <span class="value">{{ stepIdx }} / {{ steps.length - 1 }}</span>
      </div>
      <div class="output-row">
        <span class="label">主元</span>
        <span class="value">{{ currentStep.pivots.length ? currentStep.pivots.map(p => `p=${p + 1}列`).join(', ') : '—' }}</span>
      </div>
      <div class="output-row">
        <span class="label">秩 rank(A)</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row" :class="{ danger: !consistent, highlight: consistent }">
        <span class="label">相容性</span>
        <span class="value">{{ consistent ? '相容（有解）' : '不相容（无解）' }}</span>
      </div>
      <div class="output-row" v-if="solution" :class="{ highlight: true }">
        <span class="label">解</span>
        <span class="value">x = {{ solution[0].toFixed(3) }}, y = {{ solution[1].toFixed(3) }}, z = {{ solution[2].toFixed(3) }}</span>
      </div>
      <div class="output-row" v-else>
        <span class="label">解</span>
        <span class="value">{{ consistent ? '无穷多解（自由变量存在）' : '无解' }}</span>
      </div>
    </div>

    <p class="demo-tip">左侧 3D 场景显示三个平面相交；右侧表格显示增广矩阵的当前状态（主元高亮为绿色，增广列为黄色）。点击"下一步"逐步执行高斯消元，观察矩阵变化与几何场景的对应。</p>
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
    title: '高斯消元 · 矩阵变换与几何意义'
  }
)

// ---------- 类型 ----------
type Matrix = number[][]  // 3x4 增广矩阵
type Step = {
  matrix: Matrix
  description: string
  geometryHint: string
  pivots: number[]
  highlightRows: number[]  // 当前步骤中被操作的行（0-indexed）
}

// ---------- 预设 ----------
type PresetKey = 'unique' | 'infinite' | 'none'
const preset = ref<PresetKey>('unique')

const presets: Record<PresetKey, { A: number[][]; b: number[] }> = {
  unique: {
    A: [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]],
    b: [8, -11, -3]
  },
  infinite: {
    A: [[1, 2, 3], [2, 4, 6], [1, 1, 1]],
    b: [6, 12, 3]
  },
  none: {
    A: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    b: [3, 3, 4]
  }
}

const A = ref<number[][]>(presets.unique.A.map(r => [...r]))
const b = ref<number[]>([...presets.unique.b])

function setPreset(p: PresetKey) {
  preset.value = p
  A.value = presets[p].A.map(r => [...r])
  b.value = [...presets[p].b]
  stepIdx.value = 0
  playing.value = false
  if (playTimer !== null) {
    clearInterval(playTimer)
    playTimer = null
  }
}

// ---------- 高斯消元算法 ----------
function gaussianElimination(Ain: number[][], bin: number[]): {
  steps: Step[]
  solution: number[] | null
  rank: number
  consistent: boolean
} {
  const steps: Step[] = []
  const aug: Matrix = Ain.map((row, i) => [...row, bin[i]])
  steps.push({
    matrix: aug.map(r => [...r]),
    description: '初始增广矩阵 [A|b]',
    geometryHint: '三个平面在 3D 空间中的位置由原始方程决定。',
    pivots: [],
    highlightRows: []
  })

  const pivots: number[] = []
  const m = 3, n = 3

  // 前向消元
  let row = 0
  for (let col = 0; col < n && row < m; col++) {
    let pivotRow = -1
    for (let r = row; r < m; r++) {
      if (Math.abs(aug[r][col]) > 1e-9) {
        pivotRow = r
        break
      }
    }
    if (pivotRow === -1) continue

    if (pivotRow !== row) {
      const r1 = row, r2 = pivotRow
      ;[aug[row], aug[pivotRow]] = [aug[pivotRow], aug[row]]
      steps.push({
        matrix: aug.map(r => [...r]),
        description: `交换行 ${row + 1} 与行 ${pivotRow + 1}（寻找非零主元）`,
        geometryHint: `平面 ${row + 1} 与平面 ${pivotRow + 1} 在场景中对应交换显示位置（方程本身不变）。`,
        pivots: [...pivots],
        highlightRows: [r1, r2]
      })
    }

    pivots.push(col)
    const pivotVal = aug[row][col]

    for (let r = row + 1; r < m; r++) {
      if (Math.abs(aug[r][col]) > 1e-9) {
        const factor = aug[r][col] / pivotVal
        for (let c = col; c <= n; c++) {
          aug[r][c] -= factor * aug[row][c]
          if (Math.abs(aug[r][c]) < 1e-10) aug[r][c] = 0
        }
        steps.push({
          matrix: aug.map(r => [...r]),
          description: `行 ${r + 1} ← 行 ${r + 1} - (${factor.toFixed(3)}) × 行 ${row + 1}`,
          geometryHint: `消元相当于把平面 ${r + 1} 调整为与平面 ${row + 1} 在第 ${col + 1} 个坐标方向上"垂直对齐"，使交线更易暴露。`,
          pivots: [...pivots],
          highlightRows: [r]
        })
      }
    }
    row++
  }

  // 判断相容性与求解
  const rank = pivots.length
  let consistent = true
  for (let r = rank; r < m; r++) {
    if (Math.abs(aug[r][n]) > 1e-9) {
      consistent = false
      break
    }
  }

  let solution: number[] | null = null
  if (consistent && rank === n) {
    solution = new Array(n).fill(0)
    for (let r = n - 1; r >= 0; r--) {
      let sum = aug[r][n]
      for (let c = r + 1; c < n; c++) {
        sum -= aug[r][c] * solution[c]
      }
      solution[r] = sum / aug[r][r]
    }
    steps.push({
      matrix: aug.map(r => [...r]),
      description: `回代求解：x=${solution[0].toFixed(3)}, y=${solution[1].toFixed(3)}, z=${solution[2].toFixed(3)}`,
      geometryHint: '回代从最后一个方程逐层求解，三个平面在空间中交于唯一一点。',
      pivots: [...pivots],
      highlightRows: []
    })
  } else if (!consistent) {
    steps.push({
      matrix: aug.map(r => [...r]),
      description: '出现 0 = 非零 → 不相容，方程组无解',
      geometryHint: '至少一个平面被消元为矛盾方程（如 0=1），表示原平面虽平行但不重合。',
      pivots: [...pivots],
      highlightRows: []
    })
  } else {
    steps.push({
      matrix: aug.map(r => [...r]),
      description: `rank(A) = ${rank} < ${n}，存在自由变量 → 无穷多解`,
      geometryHint: '至少一个平面可由其他平面线性表示，三个平面交于一条直线或重合。',
      pivots: [...pivots],
      highlightRows: []
    })
  }

  return { steps, solution, rank, consistent }
}

// ---------- 步骤状态 ----------
const stepIdx = ref(0)
const playing = ref(false)
let playTimer: number | null = null

const eliminationResult = computed(() => gaussianElimination(A.value, b.value))
const steps = computed(() => eliminationResult.value.steps)
const currentStep = computed(() => steps.value[stepIdx.value])
const currentMatrix = computed(() => currentStep.value.matrix)
const rank = computed(() => eliminationResult.value.rank)
const consistent = computed(() => eliminationResult.value.consistent)
const solution = computed(() => eliminationResult.value.solution)

function isPivot(ri: number, ci: number): boolean {
  const pivs = currentStep.value.pivots
  return ri < pivs.length && pivs[ri] === ci
}

// ---------- 步骤控制 ----------
function stepForward() {
  if (stepIdx.value < steps.value.length - 1) stepIdx.value++
}
function stepBack() {
  if (stepIdx.value > 0) stepIdx.value--
}
function reset() {
  stepIdx.value = 0
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
    if (stepIdx.value >= steps.value.length - 1) stepIdx.value = 0
    playing.value = true
    playTimer = window.setInterval(() => {
      if (stepIdx.value < steps.value.length - 1) {
        stepIdx.value++
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

// ---------- 配色 ----------
const COLOR_PLANE1 = 0xef4444   // 红
const COLOR_PLANE2 = 0x3b82f6   // 蓝
const COLOR_PLANE3 = 0x10b981   // 绿
const COLOR_INTERSECTION = 0xa855f7  // 紫
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS = 0x6b7280
const PLANE_COLORS = [COLOR_PLANE1, COLOR_PLANE2, COLOR_PLANE3]

// ---------- Three.js ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let planes: THREE.Mesh[] = []
let planeEdges: THREE.Line[] = []
let intersectionPoint: THREE.Mesh

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 创建平面 a·x + b·y + c·z = d
function createPlaneMesh(a: number, b: number, c: number, d: number, color: number): THREE.Mesh | null {
  const norm2 = a * a + b * b + c * c
  if (norm2 < 1e-12) return null  // 退化情形

  const normal = new THREE.Vector3(a, b, c).normalize()
  const point = new THREE.Vector3(a, b, c).multiplyScalar(d / norm2)

  const geom = new THREE.PlaneGeometry(8, 8)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geom, mat)
  mesh.position.copy(point)
  mesh.lookAt(point.clone().add(normal))
  return mesh
}

// 创建平面边框
function createPlaneEdge(mesh: THREE.Mesh, color: number): THREE.Line {
  const geom = new THREE.EdgesGeometry(mesh.geometry)
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
  const line = new THREE.LineSegments(geom, mat)
  line.position.copy(mesh.position)
  line.quaternion.copy(mesh.quaternion)
  return line
}

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
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
  camera.position.set(6, 5, 8)
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
  controls.minDistance = 3
  controls.maxDistance = 30

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 网格（XZ 平面）— 与 Three.js GridHelper 默认一致
  const grid = new THREE.GridHelper(10, 10, COLOR_AXIS, COLOR_GRID)
  scene.add(grid)

  // 坐标轴
  const axes = new THREE.AxesHelper(5)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.5
  scene.add(axes)

  // 三个原始平面
  planes = []
  planeEdges = []
  for (let i = 0; i < 3; i++) {
    const a = A.value[i][0], bCoef = A.value[i][1], c = A.value[i][2], d = b.value[i]
    const mesh = createPlaneMesh(a, bCoef, c, d, PLANE_COLORS[i])
    if (mesh) {
      scene.add(mesh)
      planes.push(mesh)
      const edge = createPlaneEdge(mesh, PLANE_COLORS[i])
      scene.add(edge)
      planeEdges.push(edge)
    } else {
      // 退化平面：占位
      const geom = new THREE.PlaneGeometry(0.001, 0.001)
      const mat = new THREE.MeshBasicMaterial({ color: PLANE_COLORS[i], transparent: true, opacity: 0 })
      const dummy = new THREE.Mesh(geom, mat)
      dummy.visible = false
      scene.add(dummy)
      planes.push(dummy)
      const edgeGeom = new THREE.BufferGeometry()
      const dummyEdge = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({ color: PLANE_COLORS[i] }))
      dummyEdge.visible = false
      scene.add(dummyEdge)
      planeEdges.push(dummyEdge)
    }
  }

  // 交点球
  const ptGeom = new THREE.SphereGeometry(0.18, 24, 24)
  const ptMat = new THREE.MeshBasicMaterial({ color: COLOR_INTERSECTION })
  intersectionPoint = new THREE.Mesh(ptGeom, ptMat)
  intersectionPoint.visible = false
  scene.add(intersectionPoint)

  updateScene()
}

// ---------- 更新场景 ----------
function updateScene() {
  if (!scene || planes.length < 3) return

  // 更新三个原始平面的几何
  for (let i = 0; i < 3; i++) {
    const a = A.value[i][0], bCoef = A.value[i][1], c = A.value[i][2], d = b.value[i]
    const oldMesh = planes[i]
    const oldEdge = planeEdges[i]

    // 移除旧的
    if (oldMesh) {
      scene.remove(oldMesh)
      oldMesh.geometry.dispose()
      ;(oldMesh.material as THREE.Material).dispose()
    }
    if (oldEdge) {
      scene.remove(oldEdge)
      oldEdge.geometry.dispose()
      ;(oldEdge.material as THREE.Material).dispose()
    }

    const newMesh = createPlaneMesh(a, bCoef, c, d, PLANE_COLORS[i])
    if (newMesh) {
      scene.add(newMesh)
      planes[i] = newMesh
      const newEdge = createPlaneEdge(newMesh, PLANE_COLORS[i])
      scene.add(newEdge)
      planeEdges[i] = newEdge
    } else {
      // 退化平面：占位隐藏
      const geom = new THREE.PlaneGeometry(0.001, 0.001)
      const mat = new THREE.MeshBasicMaterial({ color: PLANE_COLORS[i], transparent: true, opacity: 0 })
      const dummy = new THREE.Mesh(geom, mat)
      dummy.visible = false
      scene.add(dummy)
      planes[i] = dummy
      const edgeGeom = new THREE.BufferGeometry()
      const dummyEdge = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({ color: PLANE_COLORS[i] }))
      dummyEdge.visible = false
      scene.add(dummyEdge)
      planeEdges[i] = dummyEdge
    }
  }

  // 根据当前步骤高亮被操作的平面
  const highlightRows = currentStep.value.highlightRows
  for (let i = 0; i < 3; i++) {
    const mesh = planes[i]
    const edge = planeEdges[i]
    if (!mesh || !mesh.visible) continue
    const mat = mesh.material as THREE.MeshBasicMaterial
    const edgeMat = edge.material as THREE.LineBasicMaterial
    if (highlightRows.includes(i)) {
      mat.opacity = 0.55
      edgeMat.opacity = 1.0
    } else {
      mat.opacity = 0.22
      edgeMat.opacity = 0.5
    }
  }

  // 显示交点（仅当有唯一解时）
  if (solution.value) {
    intersectionPoint.position.set(solution.value[0], solution.value[1], solution.value[2])
    intersectionPoint.visible = true
  } else {
    intersectionPoint.visible = false
  }
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
  camera.aspect = width / height
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
    console.error('GaussianEliminationDemo init error:', e)
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

// 监听步骤变化 → 更新 3D 场景
watch([stepIdx, A, b], updateScene, { deep: true })

// 当预设/参数变化导致 steps 数量变化时，限制 stepIdx 不越界
watch(steps, (newSteps) => {
  if (stepIdx.value > newSteps.length - 1) {
    stepIdx.value = newSteps.length - 1
  }
})
</script>

<style scoped>
/* 左右分栏 */
.gaussian-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: var(--space-3);
  margin: var(--space-3) 0;
}

.geometry-pane,
.matrix-pane {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.pane-label {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.geometry-pane .demo-canvas {
  height: 400px;
}

/* 矩阵显示 */
.matrix-step-display {
  flex: 1;
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 400px;
}

.aug-matrix {
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-md);
  margin: 0 auto;
}

.aug-matrix td {
  padding: 0.4em 0.8em;
  text-align: center;
  color: var(--text-primary);
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  min-width: 2.5em;
}

.aug-matrix td.pivot {
  background: var(--bg-success-soft);
  color: var(--color-success);
  font-weight: 700;
  border-color: var(--color-success);
}

.aug-matrix td.aug {
  background: var(--bg-warning-soft);
  color: var(--color-warning);
  font-weight: 700;
  border-color: var(--color-warning);
  border-left-width: 3px;
}

.aug-matrix td.pivot.aug {
  background: linear-gradient(135deg, var(--bg-success-soft) 0%, var(--bg-warning-soft) 100%);
  color: var(--color-success);
  border-color: var(--color-success);
}

.step-description {
  font-size: var(--fs-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  margin: 0;
  padding: var(--space-2);
  background: var(--color-accent-soft);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-accent);
  text-align: center;
}

.geometry-hint {
  font-size: var(--fs-xs);
  color: var(--text-tertiary);
  margin: 0;
  padding: var(--space-1) var(--space-2);
  font-style: italic;
  text-align: center;
  line-height: 1.5;
}

/* 预设按钮 */
.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  justify-content: center;
}

.preset-btn {
  padding: 0.4em 1.2em;
  border: 1px solid var(--border-color);
  background: var(--bg-content);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  transition: all 0.15s ease;
}

.preset-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.preset-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

/* 步骤控制 */
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

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  flex-wrap: wrap;
}

.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3em 0.6em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  min-width: 60px;
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
  font-size: var(--fs-md);
  color: var(--text-primary);
}

.dot-name {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  margin-top: 0.2em;
}

/* 输出面板 */
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
  align-items: center;
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

/* 状态指示 */
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

/* 提示文字 */
.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}

@media (max-width: 760px) {
  .gaussian-layout {
    grid-template-columns: 1fr;
  }
  .matrix-step-display {
    min-height: 200px;
  }
}
</style>
