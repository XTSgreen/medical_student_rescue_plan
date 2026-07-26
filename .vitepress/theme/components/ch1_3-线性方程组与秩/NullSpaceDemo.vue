<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'full' }" @click="setPreset('full')">满秩 rank=3</button>
      <button :class="{ active: preset === 'rank2' }" @click="setPreset('rank2')">秩 2（零度=1）</button>
      <button :class="{ active: preset === 'rank1' }" @click="setPreset('rank1')">秩 1（零度=2）</button>
      <button :class="{ active: preset === 'rank0' }" @click="setPreset('rank0')">秩 0（零度=3）</button>
    </div>

    <div class="matrix-editor-3x3">
      <div class="matrix-display-block">
        <p class="block-title">矩阵 A</p>
        <table class="matrix-table">
          <tr v-for="(row, ri) in matrix" :key="ri">
            <td v-for="(val, ci) in row" :key="ci">{{ val.toFixed(2) }}</td>
          </tr>
        </table>
      </div>
      <div class="sliders-block">
        <label v-for="(name, idx) in ['a','b','c','d','e','f','g','h','i']" :key="idx">
          {{ name }}
          <input type="range" min="-2" max="2" step="0.1"
                 :value="matrix[Math.floor(idx/3)][idx%3]"
                 @input="updateMatrix(Math.floor(idx/3), idx%3, parseFloat(($event.target as HTMLInputElement).value))" />
          <span>{{ matrix[Math.floor(idx/3)][idx%3].toFixed(2) }}</span>
        </label>
      </div>
    </div>

    <!-- 自由变量滑块 -->
    <div class="demo-controls" v-if="nullity > 0">
      <fieldset>
        <legend>自由变量系数（基础解系的线性组合）</legend>
        <label v-if="nullity >= 1">
          c₁
          <input type="range" min="-3" max="3" step="0.1" v-model.number="c1" />
          <span>{{ c1.toFixed(2) }}</span>
        </label>
        <label v-if="nullity >= 2">
          c₂
          <input type="range" min="-3" max="3" step="0.1" v-model.number="c2" />
          <span>{{ c2.toFixed(2) }}</span>
        </label>
      </fieldset>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">rank(A)</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row" :class="rankClass">
        <span class="label">零度 nullity</span>
        <span class="value">{{ nullity }}</span>
      </div>
      <div class="output-row">
        <span class="label">验证 rank + nullity = n</span>
        <span class="value">{{ rank }} + {{ nullity }} = {{ rank + nullity }}</span>
      </div>
      <div class="output-row" v-if="basis.length > 0">
        <span class="label">基础解系</span>
        <span class="value matrix-display">{{ basisDisplay }}</span>
      </div>
      <div class="output-row" v-if="nullity > 0">
        <span class="label">解 x = Σ cᵢ·vᵢ</span>
        <span class="value">({{ solutionDisplay }})</span>
      </div>
      <div class="output-row highlight" v-if="nullity > 0">
        <span class="label">验证 A·x =</span>
        <span class="value">({{ axCheckDisplay }}) 在零空间内</span>
      </div>
      <div class="output-row" v-else>
        <span class="label">零空间</span>
        <span class="value">仅原点（平凡解）</span>
      </div>
    </div>

    <p class="demo-tip">绿色显示的子空间就是零空间 N(A) = {x : Ax = 0}。当 rank &lt; n 时存在自由变量，零空间是过原点的子空间：rank=2 时是直线（零度=1），rank=1 时是平面（零度=2）。基础解系张成零空间。</p>
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
    title: '零空间与基础解系交互演示'
  }
)

// ---------- 矩阵状态 ----------
const matrix = ref<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
])

type PresetKey = 'full' | 'rank2' | 'rank1' | 'rank0' | 'custom'
const preset = ref<PresetKey>('full')

const c1 = ref(1)
const c2 = ref(1)

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'full':
      matrix.value = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      break
    case 'rank2':
      matrix.value = [[1, 0, 0], [0, 1, 0], [0, 0, 0]]
      break
    case 'rank1':
      matrix.value = [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
      break
    case 'rank0':
      matrix.value = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      break
    default:
      return
  }
  c1.value = 1
  c2.value = 1
}

function updateMatrix(row: number, col: number, value: number) {
  const newM = matrix.value.map(r => [...r])
  newM[row][col] = value
  matrix.value = newM
  preset.value = 'custom'
}

// ---------- 零空间基础解系 ----------
function nullSpace(m: number[][]): { rank: number, basis: number[][] } {
  const a = m.map(r => [...r])
  const rows = 3, cols = 3
  const pivots: { row: number, col: number }[] = []
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1
    for (let i = r; i < rows; i++) {
      if (Math.abs(a[i][c]) > 1e-9) { p = i; break }
    }
    if (p === -1) continue
    [a[r], a[p]] = [a[p], a[r]]
    const pv = a[r][c]
    for (let i = 0; i < rows; i++) {
      if (i !== r && Math.abs(a[i][c]) > 1e-9) {
        const f = a[i][c] / pv
        for (let k = 0; k < cols; k++) a[i][k] -= f * a[r][k]
      }
    }
    pivots.push({ row: r, col: c })
    r++
  }

  const rank = pivots.length
  const pivotCols = new Set(pivots.map(p => p.col))
  const freeCols: number[] = []
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.has(c)) freeCols.push(c)
  }

  // 将主元行归一化（使主元位置 = 1）
  for (const p of pivots) {
    const pv = a[p.row][p.col]
    if (Math.abs(pv) > 1e-9) {
      for (let k = 0; k < cols; k++) a[p.row][k] /= pv
    }
  }

  // 对每个自由变量构造基础解向量
  const basis: number[][] = []
  for (const fc of freeCols) {
    const v = new Array(cols).fill(0)
    v[fc] = 1
    for (const p of pivots) {
      v[p.col] = -a[p.row][fc]
    }
    basis.push(v)
  }

  return { rank, basis }
}

const nullSpaceResult = computed(() => nullSpace(matrix.value))
const rank = computed(() => nullSpaceResult.value.rank)
const basis = computed(() => nullSpaceResult.value.basis)
const nullity = computed(() => 3 - rank.value)

const rankClass = computed(() => ({
  rank3: rank.value === 3,
  rank2: rank.value === 2,
  rank1: rank.value === 1,
  rank0: rank.value === 0
}))

const basisDisplay = computed(() => {
  if (basis.value.length === 0) return '∅'
  return basis.value
    .map(v => `(${v.map(x => x.toFixed(2)).join(', ')})`)
    .join(', ')
})

const solution = computed(() => {
  const v = [0, 0, 0]
  if (basis.value.length >= 1) {
    for (let i = 0; i < 3; i++) v[i] += c1.value * basis.value[0][i]
  }
  if (basis.value.length >= 2) {
    for (let i = 0; i < 3; i++) v[i] += c2.value * basis.value[1][i]
  }
  return v
})

const solutionDisplay = computed(() =>
  solution.value.map(x => x.toFixed(2)).join(', ')
)

const axCheck = computed(() => {
  const m = matrix.value
  const x = solution.value
  const r = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i] += m[i][j] * x[j]
    }
  }
  return r
})

const axCheckDisplay = computed(() =>
  axCheck.value
    .map(x => (Math.abs(x) < 1e-6 ? '0.00' : x.toFixed(2)))
    .join(', ')
)

// ---------- Three.js ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

let nullSpaceLine: THREE.Line             // rank=2：过原点的直线
let nullSpacePlane: THREE.Mesh            // rank=1：过原点的平面
let nullSpaceBox: THREE.LineSegments      // rank=0：整个 ℝ³ 的线框
let originSphere: THREE.Mesh              // rank=3：仅原点
let basisArrow1: THREE.ArrowHelper        // v1（红）
let basisArrow2: THREE.ArrowHelper        // v2（蓝）
let basisArrow3: THREE.ArrowHelper        // v3（紫，仅 nullity=3）
let solutionSphere: THREE.Mesh            // 当前解 x 的末端小球

const COLOR_NULL_SPACE = 0x10b981
const COLOR_BASIS1 = 0xef4444
const COLOR_BASIS2 = 0x3b82f6
const COLOR_BASIS3 = 0x8b5cf6
const COLOR_SOLUTION = 0xf59e0b
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

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

  const aspect = width / height
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
  camera.position.set(4, 4, 5)
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

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  // 网格（XY 平面）
  const grid = new THREE.GridHelper(8, 8, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  // 坐标轴
  const axes = new THREE.AxesHelper(3)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  scene.add(axes)

  // 原点小球
  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  // ---------- 零空间直线（rank=2） ----------
  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(6), 3)
  )
  const lineMat = new THREE.LineBasicMaterial({ color: COLOR_NULL_SPACE, linewidth: 4 })
  nullSpaceLine = new THREE.Line(lineGeom, lineMat)
  nullSpaceLine.visible = false
  scene.add(nullSpaceLine)

  // ---------- 零空间平面（rank=1） ----------
  const planeGeom = new THREE.PlaneGeometry(8, 8)
  const planeMat = new THREE.MeshBasicMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide
  })
  nullSpacePlane = new THREE.Mesh(planeGeom, planeMat)
  nullSpacePlane.visible = false
  scene.add(nullSpacePlane)

  // ---------- 零空间线框（rank=0） ----------
  const boxGeom = new THREE.BoxGeometry(4, 4, 4)
  const boxEdges = new THREE.EdgesGeometry(boxGeom)
  const boxMat = new THREE.LineBasicMaterial({
    color: COLOR_NULL_SPACE,
    transparent: true,
    opacity: 0.6
  })
  nullSpaceBox = new THREE.LineSegments(boxEdges, boxMat)
  nullSpaceBox.visible = false
  scene.add(nullSpaceBox)

  // ---------- 基础解系箭头 ----------
  basisArrow1 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_BASIS1, 0.2, 0.12
  )
  basisArrow1.visible = false
  scene.add(basisArrow1)

  basisArrow2 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_BASIS2, 0.2, 0.12
  )
  basisArrow2.visible = false
  scene.add(basisArrow2)

  basisArrow3 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    1, COLOR_BASIS3, 0.2, 0.12
  )
  basisArrow3.visible = false
  scene.add(basisArrow3)

  // ---------- 解向量末端小球（黄） ----------
  const solGeom = new THREE.SphereGeometry(0.13, 24, 24)
  const solMat = new THREE.MeshBasicMaterial({ color: COLOR_SOLUTION })
  solutionSphere = new THREE.Mesh(solGeom, solMat)
  solutionSphere.visible = false
  scene.add(solutionSphere)

  updateScene()
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3) {
  const len = vec.length()
  if (len > 1e-4) {
    arrow.setDirection(vec.clone().normalize())
    const headLen = Math.min(0.25, Math.max(0.05, len * 0.3))
    const headWid = Math.min(0.12, Math.max(0.03, len * 0.2))
    arrow.setLength(len, headLen, headWid)
    arrow.visible = true
  } else {
    arrow.visible = false
  }
}

function updateScene() {
  if (!scene) return
  const r = rank.value
  const bs = basis.value

  // 默认全部隐藏
  nullSpaceLine.visible = false
  nullSpacePlane.visible = false
  nullSpaceBox.visible = false
  basisArrow1.visible = false
  basisArrow2.visible = false
  basisArrow3.visible = false
  solutionSphere.visible = false
  // 原点小球仅在 rank=3（零空间仅为原点）时高亮显示
  originSphere.visible = true

  if (r === 3) {
    // 零空间 = {0}
    // 仅显示原点小球（上面已经 visible = true）
  } else if (r === 2) {
    // 零空间是一条过原点的直线，方向 = basis[0]
    if (bs.length >= 1) {
      const dir = new THREE.Vector3(bs[0][0], bs[0][1], bs[0][2])
      if (dir.lengthSq() > 1e-12) {
        const dirN = dir.clone().normalize()
        const p1 = dirN.clone().multiplyScalar(-4)
        const p2 = dirN.clone().multiplyScalar(4)
        const pos = nullSpaceLine.geometry.attributes.position as THREE.BufferAttribute
        pos.setXYZ(0, p1.x, p1.y, p1.z)
        pos.setXYZ(1, p2.x, p2.y, p2.z)
        pos.needsUpdate = true
        nullSpaceLine.visible = true

        setArrow(basisArrow1, dir)

        const sol = solution.value
        solutionSphere.position.set(sol[0], sol[1], sol[2])
        solutionSphere.visible = true
      }
    }
  } else if (r === 1) {
    // 零空间是一个过原点的平面，由 basis[0] 与 basis[1] 张成
    if (bs.length >= 2) {
      const v1 = new THREE.Vector3(bs[0][0], bs[0][1], bs[0][2])
      const v2 = new THREE.Vector3(bs[1][0], bs[1][1], bs[1][2])
      if (v1.lengthSq() > 1e-12 && v2.lengthSq() > 1e-12) {
        const normal = new THREE.Vector3().crossVectors(v1, v2)
        if (normal.lengthSq() > 1e-12) {
          normal.normalize()
          nullSpacePlane.position.set(0, 0, 0)
          nullSpacePlane.lookAt(normal)
          nullSpacePlane.visible = true
        }

        setArrow(basisArrow1, v1)
        setArrow(basisArrow2, v2)

        const sol = solution.value
        solutionSphere.position.set(sol[0], sol[1], sol[2])
        solutionSphere.visible = true
      }
    }
  } else if (r === 0) {
    // 零空间 = 整个 ℝ³
    nullSpaceBox.visible = true

    // 显示 3 个标准基向量作为基础解系
    if (bs.length >= 1) {
      const v1 = new THREE.Vector3(bs[0][0], bs[0][1], bs[0][2])
      setArrow(basisArrow1, v1)
    }
    if (bs.length >= 2) {
      const v2 = new THREE.Vector3(bs[1][0], bs[1][1], bs[1][2])
      setArrow(basisArrow2, v2)
    }
    if (bs.length >= 3) {
      const v3 = new THREE.Vector3(bs[2][0], bs[2][1], bs[2][2])
      setArrow(basisArrow3, v3)
    }

    const sol = solution.value
    solutionSphere.position.set(sol[0], sol[1], sol[2])
    solutionSphere.visible = true
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
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
    if (renderer) animate()
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('NullSpaceDemo init error:', e)
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

watch([matrix, c1, c2], updateScene, { deep: true })
</script>

<style scoped>
/* ---------- 预设按钮 ---------- */
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

/* ---------- 矩阵编辑器（3×3） ---------- */
.matrix-editor-3x3 {
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
  min-width: 3.5em;
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

/* ---------- 自由变量滑块面板 ---------- */
.demo-controls fieldset {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin: var(--space-3) 0 0 0;
  flex: 1 1 280px;
}

.demo-controls legend {
  font-weight: 600;
  font-size: var(--fs-sm);
  color: var(--color-accent-strong);
  padding: 0 var(--space-2);
}

.demo-controls fieldset label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0;
  font-weight: 500;
}

.demo-controls fieldset label span {
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

.demo-controls fieldset input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 100px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.demo-controls fieldset input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
  box-shadow: var(--shadow-sm);
}

.demo-controls fieldset input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

/* ---------- 输出面板 ---------- */
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

.output-row .value.matrix-display {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.output-row.highlight {
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-accent-strong);
}

/* rank 颜色提示 */
.output-row.rank3 {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.10);
}
.output-row.rank3 .value { color: #047857; }

.output-row.rank2 {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.10);
}
.output-row.rank2 .value { color: #b45309; }

.output-row.rank1 {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.10);
}
.output-row.rank1 .value { color: #c2410c; }

.output-row.rank0 {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.10);
}
.output-row.rank0 .value { color: #b91c1c; }

/* ---------- 状态与提示 ---------- */
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
</style>
