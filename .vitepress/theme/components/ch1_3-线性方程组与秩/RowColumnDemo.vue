<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <!-- 双栏模式：两个 canvas 并排 -->
    <div v-if="viewMode === 'dual'" class="dual-canvas">
      <div class="canvas-pane">
        <p class="pane-label">行图像：两条直线相交</p>
        <div ref="canvas1" class="demo-canvas" role="img" aria-label="行图像画面，展示两条直线相交的解"></div>
      </div>
      <div class="canvas-pane">
        <p class="pane-label">列图像：列向量线性组合</p>
        <div ref="canvas2" class="demo-canvas" role="img" aria-label="列图像画面，展示列向量的线性组合"></div>
      </div>
    </div>
    <!-- 单画布模式 -->
    <div v-else ref="canvas1" class="demo-canvas" role="img" aria-label="方程组行图像或列图像演示画面"></div>

    <div v-if="initStatus" class="demo-status" :class="initStatusType" role="status" aria-live="polite">{{ initStatus }}</div>

    <!-- 视图模式 -->
    <div class="demo-mode-selector" role="group" aria-label="视图模式选择">
      <button :class="['mode-btn', { active: viewMode === 'row' }]" :aria-pressed="viewMode === 'row'" @click="viewMode = 'row'">行图像</button>
      <button :class="['mode-btn', { active: viewMode === 'column' }]" :aria-pressed="viewMode === 'column'" @click="viewMode = 'column'">列图像</button>
      <button :class="['mode-btn', { active: viewMode === 'dual' }]" :aria-pressed="viewMode === 'dual'" @click="viewMode = 'dual'">双栏对比</button>
    </div>

    <!-- 系数滑块 -->
    <div class="demo-controls">
      <fieldset>
        <legend>方程 1: a₁·x + b₁·y = c₁</legend>
        <label>a₁ <input type="range" min="-3" max="3" step="0.1" v-model.number="a1" /><span>{{ a1.toFixed(2) }}</span></label>
        <label>b₁ <input type="range" min="-3" max="3" step="0.1" v-model.number="b1" /><span>{{ b1.toFixed(2) }}</span></label>
        <label>c₁ <input type="range" min="-3" max="3" step="0.1" v-model.number="c1" /><span>{{ c1.toFixed(2) }}</span></label>
      </fieldset>
      <fieldset>
        <legend>方程 2: a₂·x + b₂·y = c₂</legend>
        <label>a₂ <input type="range" min="-3" max="3" step="0.1" v-model.number="a2" /><span>{{ a2.toFixed(2) }}</span></label>
        <label>b₂ <input type="range" min="-3" max="3" step="0.1" v-model.number="b2" /><span>{{ b2.toFixed(2) }}</span></label>
        <label>c₂ <input type="range" min="-3" max="3" step="0.1" v-model.number="c2" /><span>{{ c2.toFixed(2) }}</span></label>
      </fieldset>
      <fieldset v-if="viewMode === 'column' || viewMode === 'dual'">
        <legend>线性组合系数</legend>
        <label>x <input type="range" min="-3" max="3" step="0.1" v-model.number="comboX" /><span>{{ comboX.toFixed(2) }}</span></label>
        <label>y <input type="range" min="-3" max="3" step="0.1" v-model.number="comboY" /><span>{{ comboY.toFixed(2) }}</span></label>
      </fieldset>
    </div>

    <!-- 输出 -->
    <div class="demo-output">
      <div class="output-row">
        <span class="label">det(A) = a₁b₂ − a₂b₁</span>
        <span class="value" :class="{ danger: Math.abs(det) < 1e-6 }">{{ det.toFixed(3) }}</span>
      </div>
      <div class="output-row" :class="{ highlight: solvable }">
        <span class="label">交点（解）</span>
        <span class="value">{{ solvable ? `(${x.toFixed(3)}, ${y.toFixed(3)})` : '无唯一解（直线平行或重合）' }}</span>
      </div>
      <div class="output-row" v-if="viewMode === 'column' || viewMode === 'dual'">
        <span class="label">线性组合 x·列1 + y·列2</span>
        <span class="value">({{ (comboX * a1 + comboY * b1).toFixed(3) }}, {{ (comboX * a2 + comboY * b2).toFixed(3) }})</span>
      </div>
      <div class="output-row" v-if="viewMode === 'column' || viewMode === 'dual'">
        <span class="label">目标 b = (c₁, c₂)</span>
        <span class="value">({{ c1.toFixed(2) }}, {{ c2.toFixed(2) }})</span>
      </div>
      <div class="output-row" v-if="viewMode === 'column' || viewMode === 'dual'" :class="{ highlight: matchesB }">
        <span class="label">匹配状态</span>
        <span class="value">{{ matchesB ? '线性组合 = b（解正确）' : '不匹配（请调节 x, y）' }}</span>
      </div>
    </div>

    <p class="demo-tip">行图像：每条直线是一个方程的解集，交点就是方程组的解。列图像：列向量 (a₁,a₂) 和 (b₁,b₂) 的线性组合 x·列1 + y·列2 等于 (c₁,c₂) 时，(x,y) 就是解。两种视角等价。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '2×2 线性方程组 · 行图像与列图像对比'
  }
)

// ---------- 视图模式 ----------
type ViewMode = 'row' | 'column' | 'dual'
const viewMode = ref<ViewMode>('row')

// ---------- 系数参数 ----------
const a1 = ref(2)
const b1 = ref(1)
const c1 = ref(3)
const a2 = ref(1)
const b2 = ref(2)
const c2 = ref(4)

// 列图像的线性组合系数
const comboX = ref(0)
const comboY = ref(0)

// ---------- 关键计算 ----------
function solve2x2(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) {
  const det = a1 * b2 - a2 * b1
  if (Math.abs(det) < 1e-9) {
    return { x: NaN, y: NaN, det, solvable: false }
  }
  const x = (c1 * b2 - c2 * b1) / det
  const y = (a1 * c2 - a2 * c1) / det
  return { x, y, det, solvable: true }
}

const solution = computed(() => solve2x2(a1.value, b1.value, c1.value, a2.value, b2.value, c2.value))
const det = computed(() => solution.value.det)
const x = computed(() => solution.value.x)
const y = computed(() => solution.value.y)
const solvable = computed(() => solution.value.solvable)

const matchesB = computed(() => {
  const rx = comboX.value * a1.value + comboY.value * b1.value
  const ry = comboX.value * a2.value + comboY.value * b2.value
  return Math.abs(rx - c1.value) < 0.05 && Math.abs(ry - c2.value) < 0.05
})

// 当系数变化导致解变化时，自动同步 comboX/comboY 为方程组的解
watch(
  [a1, b1, c1, a2, b2, c2],
  () => {
    if (solvable.value) {
      comboX.value = +x.value.toFixed(2)
      comboY.value = +y.value.toFixed(2)
    }
  }
)

// 绘制直线 a·x + b·y = c 的两个端点
function lineEndpoints(a: number, b: number, c: number): [THREE.Vector3, THREE.Vector3] {
  if (Math.abs(b) > 1e-9) {
    return [
      new THREE.Vector3(-5, (c - a * -5) / b, 0.01),
      new THREE.Vector3(5, (c - a * 5) / b, 0.01)
    ]
  } else if (Math.abs(a) > 1e-9) {
    const xv = c / a
    return [
      new THREE.Vector3(xv, -5, 0.01),
      new THREE.Vector3(xv, 5, 0.01)
    ]
  }
  return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]
}

// ---------- 配色 ----------
const COLOR_LINE1 = 0xef4444   // 红
const COLOR_LINE2 = 0x3b82f6   // 蓝
const COLOR_INTERSECTION = 0x10b981  // 绿
const COLOR_COL1 = 0xef4444    // 红
const COLOR_COL2 = 0x3b82f6    // 蓝
const COLOR_TARGET = 0xa855f7  // 紫（加粗）
const COLOR_COMBO = 0x10b981   // 绿
const COLOR_GRID = 0xe5e7eb
const COLOR_AXIS = 0x6b7280

// ---------- Three.js 资源 ----------
const canvas1 = ref<HTMLElement | null>(null)
const canvas2 = ref<HTMLElement | null>(null)

interface SceneCtx {
  type: 'row' | 'column'
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  // row 场景对象
  line1?: THREE.Line
  line2?: THREE.Line
  intersection?: THREE.Mesh
  // column 场景对象
  arrowCol1?: THREE.ArrowHelper
  arrowCol2?: THREE.ArrowHelper
  arrowTarget?: THREE.ArrowHelper
  arrowCombo?: THREE.ArrowHelper
  arrowScaledCol1?: THREE.ArrowHelper  // x·col1 从原点出发（淡红）
  arrowScaledCol2?: THREE.ArrowHelper  // y·col2 从 x·col1 末端出发（淡蓝）
}

let ctx1: SceneCtx | null = null
let ctx2: SceneCtx | null = null
let resizeObserver: ResizeObserver
let animationId = 0

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- 创建场景 ----------
function createSceneCtx(container: HTMLElement, type: 'row' | 'column'): SceneCtx | null {
  const width = container.clientWidth || 600
  const height = container.clientHeight || 360

  // WebGL 检测
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return null
  }
  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()

  const scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  const viewSize = 8
  const camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2, viewSize * aspect / 2,
    viewSize / 2, -viewSize / 2,
    -100, 100
  )
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (e) {
    initStatus.value = 'WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableRotate = false  // 2D 俯视，禁用旋转
  controls.minZoom = 0.3
  controls.maxZoom = 5

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))

  // 网格 + 坐标轴
  for (let i = -5; i <= 5; i++) {
    const isAxis = i === 0
    const op = isAxis ? 0.9 : 0.35
    const color = isAxis ? COLOR_AXIS : COLOR_GRID
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, i, -0.01), new THREE.Vector3(5, i, -0.01)
    ])
    scene.add(new THREE.Line(hGeom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: op
    })))
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -5, -0.01), new THREE.Vector3(i, 5, -0.01)
    ])
    scene.add(new THREE.Line(vGeom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: op
    })))
  }

  // 原点小球
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  ))

  const ctx: SceneCtx = { type, scene, camera, renderer, controls }

  if (type === 'row') {
    // 行图像：两条直线 + 交点
    const l1Geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
    ctx.line1 = new THREE.Line(l1Geom, new THREE.LineBasicMaterial({ color: COLOR_LINE1 }))
    scene.add(ctx.line1)

    const l2Geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
    ctx.line2 = new THREE.Line(l2Geom, new THREE.LineBasicMaterial({ color: COLOR_LINE2 }))
    scene.add(ctx.line2)

    const ptGeom = new THREE.SphereGeometry(0.16, 24, 24)
    ctx.intersection = new THREE.Mesh(ptGeom, new THREE.MeshBasicMaterial({ color: COLOR_INTERSECTION }))
    ctx.intersection.visible = false
    scene.add(ctx.intersection)
  } else {
    // 列图像：列1、列2、目标 b、线性组合结果
    ctx.arrowCol1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_COL1, 0.18, 0.12
    )
    scene.add(ctx.arrowCol1)
    ctx.arrowCol2 = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_COL2, 0.18, 0.12
    )
    scene.add(ctx.arrowCol2)
    // 目标 b（紫色，加粗）
    ctx.arrowTarget = new THREE.ArrowHelper(
      new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_TARGET, 0.22, 0.14
    )
    scene.add(ctx.arrowTarget)
    // x·col1（淡红色，从原点出发）
    ctx.arrowScaledCol1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_COL1, 0.14, 0.09
    )
    ;(ctx.arrowScaledCol1.line.material as THREE.LineBasicMaterial).transparent = true
    ;(ctx.arrowScaledCol1.line.material as THREE.LineBasicMaterial).opacity = 0.45
    ;(ctx.arrowScaledCol1.cone.material as THREE.MeshBasicMaterial).transparent = true
    ;(ctx.arrowScaledCol1.cone.material as THREE.MeshBasicMaterial).opacity = 0.45
    scene.add(ctx.arrowScaledCol1)
    // y·col2（淡蓝色，从 x·col1 末端出发）
    ctx.arrowScaledCol2 = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_COL2, 0.14, 0.09
    )
    ;(ctx.arrowScaledCol2.line.material as THREE.LineBasicMaterial).transparent = true
    ;(ctx.arrowScaledCol2.line.material as THREE.LineBasicMaterial).opacity = 0.45
    ;(ctx.arrowScaledCol2.cone.material as THREE.MeshBasicMaterial).transparent = true
    ;(ctx.arrowScaledCol2.cone.material as THREE.MeshBasicMaterial).opacity = 0.45
    scene.add(ctx.arrowScaledCol2)
    // 线性组合结果（绿色，加粗）
    ctx.arrowCombo = new THREE.ArrowHelper(
      new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 0, 0),
      1, COLOR_COMBO, 0.22, 0.14
    )
    scene.add(ctx.arrowCombo)
  }

  return ctx
}

// ---------- 更新行图像场景 ----------
function updateRowScene(ctx: SceneCtx) {
  if (!ctx.line1 || !ctx.line2 || !ctx.intersection) return

  const [p1a, p1b] = lineEndpoints(a1.value, b1.value, c1.value)
  const pos1 = ctx.line1.geometry.attributes.position as THREE.BufferAttribute
  pos1.setXYZ(0, p1a.x, p1a.y, p1a.z)
  pos1.setXYZ(1, p1b.x, p1b.y, p1b.z)
  pos1.needsUpdate = true

  const [p2a, p2b] = lineEndpoints(a2.value, b2.value, c2.value)
  const pos2 = ctx.line2.geometry.attributes.position as THREE.BufferAttribute
  pos2.setXYZ(0, p2a.x, p2a.y, p2a.z)
  pos2.setXYZ(1, p2b.x, p2b.y, p2b.z)
  pos2.needsUpdate = true

  if (solvable.value) {
    ctx.intersection.position.set(x.value, y.value, 0.1)
    ctx.intersection.visible = true
  } else {
    ctx.intersection.visible = false
  }
}

// ---------- 设置箭头辅助函数 ----------
function setArrow(arrow: THREE.ArrowHelper, dir: THREE.Vector3, origin: THREE.Vector3, length: number) {
  if (length > 1e-4) {
    arrow.setDirection(dir.clone().normalize())
    arrow.setLength(Math.min(length, 8), 0.18, 0.12)
    arrow.position.copy(origin)
    arrow.visible = true
  } else {
    arrow.visible = false
  }
}

// ---------- 更新列图像场景 ----------
function updateColumnScene(ctx: SceneCtx) {
  if (!ctx.arrowCol1 || !ctx.arrowCol2 || !ctx.arrowTarget || !ctx.arrowCombo ||
      !ctx.arrowScaledCol1 || !ctx.arrowScaledCol2) return

  // 列 1 = (a1, a2)
  const col1 = new THREE.Vector3(a1.value, a2.value, 0)
  // 列 2 = (b1, b2)
  const col2 = new THREE.Vector3(b1.value, b2.value, 0)
  // 目标 b = (c1, c2)
  const target = new THREE.Vector3(c1.value, c2.value, 0)
  // 线性组合结果 = x·col1 + y·col2
  const combo = new THREE.Vector3(
    comboX.value * a1.value + comboY.value * b1.value,
    comboX.value * a2.value + comboY.value * b2.value,
    0
  )

  // 主箭头
  setArrow(ctx.arrowCol1, col1, new THREE.Vector3(0, 0, 0.05), col1.length())
  setArrow(ctx.arrowCol2, col2, new THREE.Vector3(0, 0, 0.05), col2.length())
  setArrow(ctx.arrowTarget, target, new THREE.Vector3(0, 0, 0.08), target.length())
  setArrow(ctx.arrowCombo, combo, new THREE.Vector3(0, 0, 0.12), combo.length())

  // 首尾相连：x·col1 从原点出发
  const scaledCol1 = col1.clone().multiplyScalar(comboX.value)
  setArrow(ctx.arrowScaledCol1, scaledCol1, new THREE.Vector3(0, 0, 0.06), scaledCol1.length())

  // y·col2 从 x·col1 末端出发
  const scaledCol2 = col2.clone().multiplyScalar(comboY.value)
  setArrow(ctx.arrowScaledCol2, scaledCol2, new THREE.Vector3(scaledCol1.x, scaledCol1.y, 0.07), scaledCol2.length())
}

function updateScene() {
  if (ctx1) {
    if (ctx1.type === 'row') updateRowScene(ctx1)
    else updateColumnScene(ctx1)
  }
  if (ctx2) {
    if (ctx2.type === 'row') updateRowScene(ctx2)
    else updateColumnScene(ctx2)
  }
}

function animateLoop() {
  animationId = requestAnimationFrame(animateLoop)
  if (ctx1) {
    ctx1.controls.update()
    ctx1.renderer.render(ctx1.scene, ctx1.camera)
  }
  if (ctx2) {
    ctx2.controls.update()
    ctx2.renderer.render(ctx2.scene, ctx2.camera)
  }
}

// ---------- 销毁所有场景 ----------
function disposeAll() {
  for (const ctx of [ctx1, ctx2]) {
    if (!ctx) continue
    ctx.controls.dispose()
    ctx.scene.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(mt => mt.dispose())
        else (mesh.material as THREE.Material).dispose()
      }
    })
    ctx.renderer.dispose()
    ctx.renderer.forceContextLoss()
    if (ctx.renderer.domElement.parentNode) {
      ctx.renderer.domElement.parentNode.removeChild(ctx.renderer.domElement)
    }
  }
  ctx1 = null
  ctx2 = null
}

// ---------- 根据当前 viewMode 初始化场景 ----------
function initScenes() {
  if (!canvas1.value) return
  if (viewMode.value === 'row') {
    ctx1 = createSceneCtx(canvas1.value, 'row')
  } else if (viewMode.value === 'column') {
    ctx1 = createSceneCtx(canvas1.value, 'column')
  } else {
    // dual
    if (canvas1.value) ctx1 = createSceneCtx(canvas1.value, 'row')
    if (canvas2.value) ctx2 = createSceneCtx(canvas2.value, 'column')
  }
  updateScene()
}

// ---------- 重新观察 resize ----------
function observeResize() {
  resizeObserver = new ResizeObserver(handleResize)
  if (canvas1.value) resizeObserver.observe(canvas1.value)
  if (canvas2.value) resizeObserver.observe(canvas2.value)
}

function handleResize() {
  const items: Array<{ c: HTMLElement | null, ctx: SceneCtx | null }> = [
    { c: canvas1.value, ctx: ctx1 },
    { c: canvas2.value, ctx: ctx2 }
  ]
  for (const item of items) {
    if (!item.c || !item.ctx) continue
    const width = item.c.clientWidth
    const height = item.c.clientHeight
    if (width === 0 || height === 0) continue
    const aspect = width / height
    const viewSize = 8
    item.ctx.camera.left = -viewSize * aspect / 2
    item.ctx.camera.right = viewSize * aspect / 2
    item.ctx.camera.top = viewSize / 2
    item.ctx.camera.bottom = -viewSize / 2
    item.ctx.camera.updateProjectionMatrix()
    item.ctx.renderer.setSize(width, height)
  }
}

// ---------- 监听 viewMode 变化 ----------
watch(viewMode, async () => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  disposeAll()
  await nextTick()
  try {
    initScenes()
    observeResize()
    animateLoop()
  } catch (e) {
    initStatus.value = '切换模式失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('RowColumnDemo viewMode switch error:', e)
  }
})

// ---------- 生命周期 ----------
onMounted(() => {
  try {
    initScenes()
    observeResize()
    if (ctx1 || ctx2) animateLoop()
    // 初始化时把 comboX/comboY 同步为方程组的解
    if (solvable.value) {
      comboX.value = +x.value.toFixed(2)
      comboY.value = +y.value.toFixed(2)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('RowColumnDemo init error:', e)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  disposeAll()
})

// 监听参数变化
watch([a1, b1, c1, a2, b2, c2, comboX, comboY], updateScene)
</script>

<style scoped>
/* 视图模式选择器 */
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

/* 双画布并排 */
.dual-canvas {
  display: flex;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  flex-wrap: wrap;
}

.canvas-pane {
  flex: 1 1 280px;
  min-width: 0;
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

.canvas-pane .demo-canvas {
  height: 320px;
}

/* fieldset 参数面板 */
.demo-controls fieldset {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin: 0;
  flex: 1 1 220px;
  min-width: 220px;
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
  min-width: 80px;
  width: auto;
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

.output-row .value.danger,
.output-row.danger .value {
  color: var(--color-danger);
}

.output-row.highlight {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-success);
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

@media (max-width: 640px) {
  .dual-canvas {
    flex-direction: column;
  }
}
</style>
