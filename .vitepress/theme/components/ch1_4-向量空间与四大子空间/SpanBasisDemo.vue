<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'single' }" @click="setPreset('single')">单向量</button>
      <button :class="{ active: preset === 'twoIndep' }" @click="setPreset('twoIndep')">两不共线向量</button>
      <button :class="{ active: preset === 'basis' }" @click="setPreset('basis')">三不共面向量</button>
      <button :class="{ active: preset === 'collinear' }" @click="setPreset('collinear')">共线向量</button>
      <button :class="{ active: preset === 'empty' }" @click="setPreset('empty')">清空</button>
    </div>

    <div class="action-buttons">
      <button class="action-btn add-btn" @click="addVector()" :disabled="vectors.length >= 3 || isAnimating">
        + 添加向量
      </button>
      <button class="action-btn check-btn" @click="checkIndependence" :disabled="vectors.length === 0">
        线性无关检测
      </button>
    </div>

    <div v-if="autoWarning" class="auto-warning">
      {{ autoWarning }}
    </div>

    <div class="vectors-editor" v-if="vectors.length > 0">
      <div v-for="(v, i) in vectors" :key="v.id" class="vec-card" :class="{ removing: v.removing }">
        <div class="vec-header">
          <span class="vec-name" :style="{ color: vecHexColors[i] }">v{{ i + 1 }}</span>
          <span class="vec-coord">({{ v.x.toFixed(1) }}, {{ v.y.toFixed(1) }}, {{ v.z.toFixed(1) }})</span>
          <button class="del-btn" @click="removeVector(i)" :disabled="isAnimating">×</button>
        </div>
        <div class="vec-sliders">
          <label>x
            <input type="range" min="-2" max="2" step="0.1" v-model.number="v.x" />
            <span>{{ v.x.toFixed(1) }}</span>
          </label>
          <label>y
            <input type="range" min="-2" max="2" step="0.1" v-model.number="v.y" />
            <span>{{ v.y.toFixed(1) }}</span>
          </label>
          <label>z
            <input type="range" min="-2" max="2" step="0.1" v-model.number="v.z" />
            <span>{{ v.z.toFixed(1) }}</span>
          </label>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">当前没有向量，点击"+ 添加向量"开始构建张成空间。</div>

    <div v-if="checkResult" class="check-result" :class="checkResultType">
      {{ checkResult }}
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">向量个数</span>
        <span class="value">{{ activeCount }}</span>
      </div>
      <div class="output-row">
        <span class="label">rank（有效方向数）</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row" :class="rankClass">
        <span class="label">张成空间维度</span>
        <span class="value">{{ spanDimText }}</span>
      </div>
      <div class="output-row" :class="{ highlight: linearIndependent, danger: !linearIndependent && activeCount > 0 }">
        <span class="label">是否线性无关</span>
        <span class="value">{{ activeCount === 0 ? '—' : (linearIndependent ? '是' : '否') }}</span>
      </div>
      <div class="output-row" :class="{ highlight: isBasis }">
        <span class="label">是否构成 R³ 的基</span>
        <span class="value">{{ isBasis ? '是' : '否' }}</span>
      </div>
      <div class="output-row">
        <span class="label">维度关系</span>
        <span class="value">个数 {{ activeCount }} {{ activeCount === rank ? '=' : '≠' }} rank {{ rank }}</span>
      </div>
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
    title: '张成空间与基 · 交互演示'
  }
)

const COLOR_RED = 0xef4444
const COLOR_BLUE = 0x3b82f6
const COLOR_GREEN = 0x10b981
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID = 0xe5e7eb
const COLOR_SPAN = 0xf59e0b
const COLOR_HIGHLIGHT = 0xef4444

const vecHexColors = ['#ef4444', '#3b82f6', '#10b981']
const vecColors3 = [COLOR_RED, COLOR_BLUE, COLOR_GREEN]

interface VecItem {
  id: number
  x: number
  y: number
  z: number
  appearProgress: number
  targetProgress: number
  removing?: boolean
}

let nextId = 1
const vectors = ref<VecItem[]>([])
const isAnimating = ref(false)

type PresetKey = 'single' | 'twoIndep' | 'basis' | 'collinear' | 'empty' | 'custom'
const preset = ref<PresetKey>('empty')

function addVector(x = 1, y = 0, z = 0) {
  if (vectors.value.length >= 3) return
  preset.value = 'custom'
  checkResult.value = ''
  vectors.value.push({
    id: nextId++,
    x, y, z,
    appearProgress: 0,
    targetProgress: 1
  })
}

function removeVector(idx: number) {
  preset.value = 'custom'
  checkResult.value = ''
  const v = vectors.value[idx]
  v.removing = true
  v.targetProgress = 0
}

function setPreset(p: PresetKey) {
  preset.value = p
  checkResult.value = ''

  vectors.value = []
  switch (p) {
    case 'single':
      addVector(1, 0, 0)
      break
    case 'twoIndep':
      addVector(1, 0, 0)
      addVector(0, 1, 0)
      break
    case 'basis':
      addVector(1, 0, 0)
      addVector(0, 1, 0)
      addVector(0, 0, 1)
      break
    case 'collinear':
      addVector(1, 0, 0)
      addVector(2, 0, 0)
      break
    case 'empty':
      break
    default:
      return
  }
}

function rankOf(vecs: { x: number; y: number; z: number }[]): number {
  if (vecs.length === 0) return 0
  const m = vecs.map(v => [v.x, v.y, v.z])
  const rows = m.length
  const cols = 3
  const a = m.map(r => [...r])
  let rank = 0
  for (let c = 0; c < cols && rank < rows; c++) {
    let pivot = -1
    for (let r = rank; r < rows; r++) {
      if (Math.abs(a[r][c]) > 1e-9) { pivot = r; break }
    }
    if (pivot === -1) continue
    ;[a[rank], a[pivot]] = [a[pivot], a[rank]]
    for (let r = rank + 1; r < rows; r++) {
      if (Math.abs(a[r][c]) > 1e-9) {
        const f = a[r][c] / a[rank][c]
        for (let k = c; k < cols; k++) a[r][k] -= f * a[rank][k]
      }
    }
    rank++
  }
  return rank
}

const activeVectors = computed(() => vectors.value.filter(v => !v.removing))
const activeCount = computed(() => activeVectors.value.length)
const rank = computed(() => rankOf(activeVectors.value))
const spanDim = computed(() => rank.value)
const linearIndependent = computed(
  () => activeCount.value > 0 && rank.value === activeCount.value
)
const isBasis = computed(
  () => rank.value === 3 && activeCount.value === 3
)

const rankClass = computed(() => ({
  rank3: rank.value === 3,
  rank2: rank.value === 2,
  rank1: rank.value === 1,
  rank0: rank.value === 0
}))

const spanDimText = computed(() => {
  switch (rank.value) {
    case 0: return '0（仅原点）'
    case 1: return '1（直线）'
    case 2: return '2（平面）'
    case 3: return '3（整个 ℝ³）'
    default: return ''
  }
})

const autoWarning = computed(() => {
  const n = activeCount.value
  if (n === 0) return ''
  const r = rank.value
  if (n > r) {
    return `检测到线性相关：有 ${n - r} 个向量不增加维数（rank = ${r} < 向量个数 ${n}）`
  }
  return ''
})

const tipText = computed(() => {
  const n = activeCount.value
  if (n === 0) return '点击"+ 添加向量"开始构建张成空间。每个向量是 ℝ³ 中过原点的有向线段。'
  if (n === 1) return '1 个向量张成 1 维子空间：过原点的直线。'
  if (n === 2) {
    if (rank.value === 1) return '两个向量共线，第二个向量不增加维数（线性相关）。张成空间仍为 1 维直线。'
    return '2 个不共线向量张成 2 维子空间：过原点的平面。'
  }
  if (n === 3) {
    if (rank.value === 3) return '3 个不共面向量张成整个 ℝ³，构成 ℝ³ 的一组基。'
    if (rank.value === 2) return '3 个共面但不共线，第三个向量在前两个张成的平面内（线性相关）。'
    return '三个向量共线，张成仍为 1 维直线（线性相关）。'
  }
  return ''
})

const checkResult = ref('')
const checkResultType = ref<'info' | 'success' | 'danger'>('info')

function checkIndependence() {
  const n = activeCount.value
  if (n === 0) {
    checkResult.value = '当前没有向量，请先添加向量。'
    checkResultType.value = 'info'
    return
  }
  const r = rank.value
  if (r === n) {
    checkResult.value = `${n} 个向量线性无关（rank = ${r} = 向量个数），每个向量都为张成空间贡献新方向。`
    checkResultType.value = 'success'
  } else {
    checkResult.value = `${n} 个向量线性相关（rank = ${r} < ${n}），有 ${n - r} 个向量"不增加维数"，可由其他向量线性表出。`
    checkResultType.value = 'danger'
  }
}

const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let originSphere: THREE.Mesh
let arrows: THREE.ArrowHelper[] = []
let spanLine: THREE.Line
let spanPlane: THREE.Mesh
let spanBox: THREE.LineSegments

let spanLineOpacityTarget = 0
let spanPlaneOpacityTarget = 0
let spanBoxOpacityTarget = 0

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

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

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dir = new THREE.DirectionalLight(0xffffff, 0.5)
  dir.position.set(5, 5, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(8, 8, 0x9ca3af, COLOR_GRID)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)

  const axes = new THREE.AxesHelper(3)
  const axesMat = axes.material as THREE.Material
  axesMat.transparent = true
  axesMat.opacity = 0.4
  scene.add(axes)

  const origGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(origGeom, origMat)
  scene.add(originSphere)

  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(6), 3)
  )
  const lineMat = new THREE.LineBasicMaterial({
    color: COLOR_SPAN,
    transparent: true,
    opacity: 0
  })
  spanLine = new THREE.Line(lineGeom, lineMat)
  spanLine.visible = false
  scene.add(spanLine)

  const planeGeom = new THREE.PlaneGeometry(6, 6)
  const planeMat = new THREE.MeshBasicMaterial({
    color: COLOR_SPAN,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  })
  spanPlane = new THREE.Mesh(planeGeom, planeMat)
  spanPlane.visible = false
  scene.add(spanPlane)

  const boxGeom = new THREE.BoxGeometry(4, 4, 4)
  const boxEdges = new THREE.EdgesGeometry(boxGeom)
  const boxMat = new THREE.LineBasicMaterial({
    color: COLOR_SPAN,
    transparent: true,
    opacity: 0
  })
  spanBox = new THREE.LineSegments(boxEdges, boxMat)
  spanBox.visible = false
  scene.add(spanBox)

  for (let i = 0; i < 3; i++) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1, vecColors3[i], 0.2, 0.12
    )
    arrow.visible = false
    scene.add(arrow)
    arrows.push(arrow)
  }
}

function setArrow(arrow: THREE.ArrowHelper, vec: THREE.Vector3, progress: number) {
  const scaled = vec.clone().multiplyScalar(progress)
  const len = scaled.length()
  if (len > 1e-4) {
    arrow.setDirection(scaled.clone().normalize())
    const headLen = Math.min(0.25, Math.max(0.05, len * 0.3))
    const headWid = Math.min(0.12, Math.max(0.03, len * 0.2))
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

function updateScene() {
  if (!scene) return
  const vecs = vectors.value
  const n = vecs.length

  for (let i = 0; i < 3; i++) arrows[i].visible = false

  for (let i = 0; i < n; i++) {
    const v = vecs[i]
    setArrow(arrows[i], new THREE.Vector3(v.x, v.y, v.z), v.appearProgress)
    setArrowColor(arrows[i], vecColors3[i])
  }

  const activeVecs = vecs.filter(v => !v.removing)
  const r = rankOf(activeVecs)

  spanLineOpacityTarget = 0
  spanPlaneOpacityTarget = 0
  spanBoxOpacityTarget = 0

  if (activeVecs.length === 0 || r === 0) {

  } else if (r === 1) {

    const v0 = activeVecs[0]
    const dir = new THREE.Vector3(v0.x, v0.y, v0.z)
    if (dir.lengthSq() > 1e-12) {
      const dirN = dir.clone().normalize()
      const p1 = dirN.clone().multiplyScalar(-3)
      const p2 = dirN.clone().multiplyScalar(3)
      const pos = spanLine.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, p1.x, p1.y, p1.z)
      pos.setXYZ(1, p2.x, p2.y, p2.z)
      pos.needsUpdate = true
      spanLineOpacityTarget = 0.55
    }
  } else if (r === 2) {

    const v1Vec = new THREE.Vector3(activeVecs[0].x, activeVecs[0].y, activeVecs[0].z)
    let v2Vec: THREE.Vector3 | null = null
    for (let i = 1; i < activeVecs.length; i++) {
      const candidate = new THREE.Vector3(activeVecs[i].x, activeVecs[i].y, activeVecs[i].z)
      const cross = new THREE.Vector3().crossVectors(v1Vec, candidate)
      if (cross.lengthSq() > 1e-9) { v2Vec = candidate; break }
    }
    if (v2Vec) {
      const normal = new THREE.Vector3().crossVectors(v1Vec, v2Vec).normalize()
      spanPlane.position.set(0, 0, 0)
      spanPlane.lookAt(normal)
      spanPlaneOpacityTarget = 0.25
    }
  } else if (r === 3) {

    spanBoxOpacityTarget = 0.55
  }
}

let lastTime = -1
const APPEAR_DURATION = 500

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  const now = time
  const dt = lastTime < 0 ? 0 : (now - lastTime) / 1000
  lastTime = now

  const toRemove: number[] = []
  let anyProgressChanged = false
  for (let i = 0; i < vectors.value.length; i++) {
    const v = vectors.value[i]
    const speed = 1 / (APPEAR_DURATION / 1000)
    if (v.appearProgress < v.targetProgress) {
      v.appearProgress = Math.min(v.targetProgress, v.appearProgress + speed * dt)
      anyProgressChanged = true
    } else if (v.appearProgress > v.targetProgress) {
      v.appearProgress = Math.max(v.targetProgress, v.appearProgress - speed * dt)
      anyProgressChanged = true
      if (v.removing && v.appearProgress <= 0.01) {
        toRemove.push(i)
      }
    }
  }
  if (toRemove.length > 0) {
    for (let i = toRemove.length - 1; i >= 0; i--) {
      vectors.value.splice(toRemove[i], 1)
    }
    anyProgressChanged = true
  }

  const lerpFactor = Math.min(1, dt * 8)
  const lineMat = spanLine.material as THREE.LineBasicMaterial
  const planeMat = spanPlane.material as THREE.MeshBasicMaterial
  const boxMat = spanBox.material as THREE.LineBasicMaterial

  lineMat.opacity += (spanLineOpacityTarget - lineMat.opacity) * lerpFactor
  planeMat.opacity += (spanPlaneOpacityTarget - planeMat.opacity) * lerpFactor
  boxMat.opacity += (spanBoxOpacityTarget - boxMat.opacity) * lerpFactor

  spanLine.visible = lineMat.opacity > 0.005
  spanPlane.visible = planeMat.opacity > 0.005
  spanBox.visible = boxMat.opacity > 0.005

  isAnimating.value =
    anyProgressChanged ||
    Math.abs(lineMat.opacity - spanLineOpacityTarget) > 0.005 ||
    Math.abs(planeMat.opacity - spanPlaneOpacityTarget) > 0.005 ||
    Math.abs(boxMat.opacity - spanBoxOpacityTarget) > 0.005

  updateScene()

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
    if (renderer) {

      setPreset('basis')
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('SpanBasisDemo init error:', e)
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
</script>

<style scoped>

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

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-2) 0;
  justify-content: center;
}

.action-btn {
  padding: 0.5em 1.4em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-weight: 600;
  transition: all 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.add-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.check-btn {
  background: var(--bg-content);
  color: var(--color-accent-strong);
  border-color: var(--color-accent);
}

.check-btn:hover:not(:disabled) {
  background: var(--color-accent-soft);
}

.auto-warning {
  margin: var(--space-2) 0;
  padding: 0.5em 1em;
  background: rgba(239, 68, 68, 0.10);
  color: #b91c1c;
  border: 1px solid #ef4444;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  text-align: center;
}

.vectors-editor {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.empty-hint {
  margin-top: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--fs-sm);
  font-style: italic;
}

.vec-card {
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  transition: opacity 0.2s ease;
}

.vec-card.removing {
  opacity: 0.5;
}

.vec-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.vec-name {
  font-weight: 700;
  font-size: var(--fs-base);
  min-width: 2em;
}

.vec-coord {
  color: var(--text-secondary);
  flex: 1;
}

.del-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--color-danger);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.del-btn:hover:not(:disabled) {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.del-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vec-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.vec-sliders label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-weight: 500;
}

.vec-sliders label input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 80px;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: var(--radius-full);
  outline: none;
}

.vec-sliders label input[type="range"]::-webkit-slider-thumb {
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

.vec-sliders label input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--bg-content);
}

.vec-sliders label span {
  display: inline-flex;
  align-items: center;
  padding: 0.1em 0.4em;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
  font-weight: 600;
  min-width: 2.5em;
  justify-content: center;
}

.check-result {
  margin: var(--space-2) 0;
  padding: 0.6em 1em;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  text-align: center;
}

.check-result.info {
  background: var(--bg-info-soft);
  color: var(--color-info);
  border: 1px solid var(--color-info);
}

.check-result.success {
  background: var(--bg-success-soft);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.check-result.danger {
  background: var(--bg-danger-soft);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

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
