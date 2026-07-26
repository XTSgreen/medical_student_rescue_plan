<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div class="dual-canvas">
      <div class="canvas-pane">
        <p class="pane-label">顺序 1：先 A（旋转）后 B（缩放+剪切）</p>
        <p class="pane-matrix">复合矩阵 = B · A</p>
        <div ref="canvas1" class="demo-canvas"></div>
      </div>
      <div class="canvas-pane">
        <p class="pane-label">顺序 2：先 B（缩放+剪切）后 A（旋转）</p>
        <p class="pane-matrix">复合矩阵 = A · B</p>
        <div ref="canvas2" class="demo-canvas"></div>
      </div>
    </div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

    <!-- 参数 -->
    <div class="demo-controls">
      <fieldset>
        <legend>变换 A（旋转）</legend>
        <label>θ（角度）<input type="range" min="0" max="360" step="1" v-model.number="thetaDeg" /><span>{{ thetaDeg.toFixed(0) }}°</span></label>
      </fieldset>
      <fieldset>
        <legend>变换 B（缩放 + 剪切）</legend>
        <label>sx（x 缩放）<input type="range" min="0.1" max="3" step="0.05" v-model.number="sx" /><span>{{ sx.toFixed(2) }}</span></label>
        <label>k（剪切系数）<input type="range" min="-2" max="2" step="0.05" v-model.number="shearK" /><span>{{ shearK.toFixed(2) }}</span></label>
      </fieldset>
    </div>

    <!-- 步骤控制 -->
    <div class="step-controls">
      <button @click="reset" class="ctrl-btn">重置</button>
      <button @click="stepBack" class="ctrl-btn" :disabled="currentStep === 0">上一步</button>
      <button @click="togglePlay" class="ctrl-btn primary">{{ playing ? '暂停' : '自动播放' }}</button>
      <button @click="stepForward" class="ctrl-btn" :disabled="currentStep === 2">下一步</button>
    </div>

    <div class="step-indicator">
      <div v-for="(s, idx) in steps" :key="idx" :class="['step-dot', { done: idx < currentStep, active: idx === currentStep - 1 || (currentStep === 0 && idx === 0) }]">
        <span class="dot-num">{{ idx + 1 }}</span>
        <span class="dot-name">{{ s }}</span>
      </div>
    </div>

    <!-- 矩阵链显示 -->
    <div class="demo-output">
      <div class="output-row">
        <span class="label">矩阵 A（旋转）</span>
        <span class="value matrix-display">{{ matrixADisplay }}</span>
      </div>
      <div class="output-row">
        <span class="label">矩阵 B（缩放+剪切）</span>
        <span class="value matrix-display">{{ matrixBDisplay }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">B · A（先 A 后 B）</span>
        <span class="value matrix-display">{{ matrixBADisplay }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">A · B（先 B 后 A）</span>
        <span class="value matrix-display">{{ matrixABDisplay }}</span>
      </div>
      <div class="output-row" :class="{ danger: !matricesEqual }">
        <span class="label">AB vs BA</span>
        <span class="value">{{ matricesEqual ? '相等（罕见特例）' : '不等（矩阵乘法不可交换）' }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(A)</span><span class="value">{{ detA.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(B)</span><span class="value">{{ detB.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(AB) = det(A)·det(B)</span><span class="value">{{ (detA * detB).toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">det(BA)</span><span class="value">{{ detBA.toFixed(3) }}</span>
      </div>
    </div>

    <p class="demo-tip">两个画布并排对比。左：先旋转再缩放剪切（B·A）；右：先缩放剪切再旋转（A·B）。改变参数观察两种顺序的不同结果。验证：det(AB) = det(A)·det(B) = det(BA)。</p>
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
    title: '变换的复合 · 顺序依赖性 (AB ≠ BA)'
  }
)

// ---------- 参数 ----------
const thetaDeg = ref(45)
const sx = ref(1.5)
const shearK = ref(0.5)

const steps = ['原始', '中间态', '最终态']
const currentStep = ref(0)
const playing = ref(false)
let playTimer: number | null = null

type M2 = [number, number, number, number]  // [[a, b], [c, d]] row-major flat

const matrixA = computed<M2>(() => {
  const t = (thetaDeg.value * Math.PI) / 180
  return [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)]
})

// B = 缩放 sx + 水平剪切 k：[[sx, k], [0, 1]]
const matrixB = computed<M2>(() => {
  return [sx.value, shearK.value, 0, 1]
})

// 矩阵乘法 A · B
function matMul(A: M2, B: M2): M2 {
  const [a1, b1, c1, d1] = A
  const [a2, b2, c2, d2] = B
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2
  ]
}

function det2(m: M2): number {
  return m[0] * m[3] - m[1] * m[2]
}

// 先 A 后 B → 复合矩阵 = B · A
const matrixBA = computed<M2>(() => matMul(matrixB.value, matrixA.value))
// 先 B 后 A → 复合矩阵 = A · B
const matrixAB = computed<M2>(() => matMul(matrixA.value, matrixB.value))

const detA = computed(() => det2(matrixA.value))
const detB = computed(() => det2(matrixB.value))
const detBA = computed(() => det2(matrixBA.value))

const matricesEqual = computed(() => {
  for (let i = 0; i < 4; i++) {
    if (Math.abs(matrixAB.value[i] - matrixBA.value[i]) > 1e-6) return false
  }
  return true
})

function formatM(m: M2): string {
  return `[[${m[0].toFixed(2)}, ${m[1].toFixed(2)}], [${m[2].toFixed(2)}, ${m[3].toFixed(2)}]]`
}

const matrixADisplay = computed(() => formatM(matrixA.value))
const matrixBDisplay = computed(() => formatM(matrixB.value))
const matrixBADisplay = computed(() => formatM(matrixBA.value))
const matrixABDisplay = computed(() => formatM(matrixAB.value))

// ---------- 步骤控制 ----------
function stepForward() {
  if (currentStep.value < 2) currentStep.value++
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
    if (currentStep.value >= 2) currentStep.value = 0
    playing.value = true
    playTimer = window.setInterval(() => {
      if (currentStep.value < 2) {
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

// ---------- Three.js ----------
const canvas1 = ref<HTMLElement | null>(null)
const canvas2 = ref<HTMLElement | null>(null)

interface SceneCtx {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  currentSquare: THREE.Mesh
  currentSquareEdges: THREE.LineLoop
  arrowI: THREE.ArrowHelper
  arrowJ: THREE.ArrowHelper
  ghostSquare: THREE.LineLoop
}

let ctx1: SceneCtx | null = null
let ctx2: SceneCtx | null = null
let resizeObserver: ResizeObserver
let animationId = 0

const COLOR_ORIG = 0x9ca3af
const COLOR_GRID = 0xe5e7eb
const COLOR_LEFT_FILL = 0x10b981   // 绿
const COLOR_LEFT_EDGE = 0x059669
const COLOR_RIGHT_FILL = 0xa78bfa  // 紫
const COLOR_RIGHT_EDGE = 0x7c3aed
const COLOR_GHOST_LEFT = 0x10b981
const COLOR_GHOST_RIGHT = 0xa78bfa
const COLOR_I = 0xb91c1c
const COLOR_J = 0x1d4ed8

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function createSceneCtx(
  container: HTMLElement,
  fillColor: number,
  edgeColor: number,
  ghostColor: number
): SceneCtx | null {
  const width = container.clientWidth || 320
  const height = container.clientHeight || 320

  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染交互演示。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，请使用 Chrome/Edge/Firefox/Safari 查看交互演示。</div>'
    return null
  }

  const scene = new THREE.Scene()
  scene.background = null

  const aspect = width / height
  const viewSize = 6
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
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
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
    scene.add(new THREE.Line(hGeom, new THREE.LineBasicMaterial({
      color: COLOR_GRID, transparent: true, opacity: op
    })))
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -5, -0.01), new THREE.Vector3(i, 5, -0.01)
    ])
    scene.add(new THREE.Line(vGeom, new THREE.LineBasicMaterial({
      color: COLOR_GRID, transparent: true, opacity: op
    })))
  }

  // 原始单位正方形（虚线灰）
  const origGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0.02),
    new THREE.Vector3(1, 0, 0.02),
    new THREE.Vector3(1, 1, 0.02),
    new THREE.Vector3(0, 1, 0.02)
  ])
  const origLoop = new THREE.LineLoop(origGeom, new THREE.LineDashedMaterial({
    color: COLOR_ORIG, dashSize: 0.1, gapSize: 0.08,
    transparent: true, opacity: 0.7
  }))
  origLoop.computeLineDistances()
  scene.add(origLoop)

  // 中间态虚影（仅最终态显示）
  const ghostGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ])
  const ghostSquare = new THREE.LineLoop(ghostGeom, new THREE.LineDashedMaterial({
    color: ghostColor, dashSize: 0.12, gapSize: 0.08,
    transparent: true, opacity: 0.55
  }))
  ghostSquare.computeLineDistances()
  ghostSquare.visible = false
  scene.add(ghostSquare)

  // 当前正方形（填充）
  const curGeom = new THREE.BufferGeometry()
  curGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
  curGeom.setIndex([0, 1, 2, 0, 2, 3])
  const curMat = new THREE.MeshBasicMaterial({
    color: fillColor, transparent: true, opacity: 0.4, side: THREE.DoubleSide
  })
  const currentSquare = new THREE.Mesh(curGeom, curMat)
  scene.add(currentSquare)

  // 当前正方形边框
  const curEdgeGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ])
  const currentSquareEdges = new THREE.LineLoop(curEdgeGeom, new THREE.LineBasicMaterial({
    color: edgeColor
  }))
  scene.add(currentSquareEdges)

  // 基向量
  const arrowI = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_I, 0.2, 0.12
  )
  scene.add(arrowI)
  const arrowJ = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),
    1, COLOR_J, 0.2, 0.12
  )
  scene.add(arrowJ)

  // 原点
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x1f2937 })
  ))

  return {
    scene, camera, renderer, controls,
    currentSquare, currentSquareEdges, arrowI, arrowJ, ghostSquare
  }
}

function applyMatrixToSquare(
  m: M2,
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

function setSquareVertices(
  mesh: THREE.Mesh,
  edges: THREE.LineLoop,
  m: M2,
  z: number
) {
  const [v0, v1, v2, v3] = applyMatrixToSquare(m, z)
  const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
  pos.setXYZ(0, v0.x, v0.y, v0.z)
  pos.setXYZ(1, v1.x, v1.y, v1.z)
  pos.setXYZ(2, v2.x, v2.y, v2.z)
  pos.setXYZ(3, v3.x, v3.y, v3.z)
  pos.needsUpdate = true
  const epos = edges.geometry.attributes.position as THREE.BufferAttribute
  epos.setXYZ(0, v0.x, v0.y, v0.z)
  epos.setXYZ(1, v1.x, v1.y, v1.z)
  epos.setXYZ(2, v2.x, v2.y, v2.z)
  epos.setXYZ(3, v3.x, v3.y, v3.z)
  epos.needsUpdate = true
}

function setArrows(arrowI: THREE.ArrowHelper, arrowJ: THREE.ArrowHelper, m: M2) {
  const [a, b, c, d] = m
  const iLen = Math.sqrt(a * a + c * c)
  if (iLen > 1e-4) {
    arrowI.setDirection(new THREE.Vector3(a, c, 0).normalize())
    arrowI.setLength(Math.min(iLen, 6), 0.2, 0.12)
    arrowI.visible = true
  } else arrowI.visible = false
  const jLen = Math.sqrt(b * b + d * d)
  if (jLen > 1e-4) {
    arrowJ.setDirection(new THREE.Vector3(b, d, 0).normalize())
    arrowJ.setLength(Math.min(jLen, 6), 0.2, 0.12)
    arrowJ.visible = true
  } else arrowJ.visible = false
}

function setGhost(ghost: THREE.LineLoop, m: M2, z: number, visible: boolean) {
  if (!visible) {
    ghost.visible = false
    return
  }
  const [v0, v1, v2, v3] = applyMatrixToSquare(m, z)
  const gpos = ghost.geometry.attributes.position as THREE.BufferAttribute
  gpos.setXYZ(0, v0.x, v0.y, v0.z)
  gpos.setXYZ(1, v1.x, v1.y, v1.z)
  gpos.setXYZ(2, v2.x, v2.y, v2.z)
  gpos.setXYZ(3, v3.x, v3.y, v3.z)
  gpos.needsUpdate = true
  ghost.computeLineDistances()
  ghost.visible = true
}

function updateScene() {
  if (!ctx1 || !ctx2) return

  const identity: M2 = [1, 0, 0, 1]
  const A = matrixA.value
  const B = matrixB.value
  const BA = matrixBA.value
  const AB = matrixAB.value

  // 左场景：先 A 后 B（B·A）
  // 步骤 0: 原始（恒等）
  // 步骤 1: 中间态（A）
  // 步骤 2: 最终态（B·A），ghost 显示 A
  let leftM: M2
  let leftGhostVisible = false
  let leftGhostM: M2 = identity
  if (currentStep.value === 0) {
    leftM = identity
  } else if (currentStep.value === 1) {
    leftM = A
  } else {
    leftM = BA
    leftGhostVisible = true
    leftGhostM = A
  }
  setSquareVertices(ctx1.currentSquare, ctx1.currentSquareEdges, leftM, 0.1)
  setArrows(ctx1.arrowI, ctx1.arrowJ, leftM)
  setGhost(ctx1.ghostSquare, leftGhostM, 0.05, leftGhostVisible)

  // 右场景：先 B 后 A（A·B）
  let rightM: M2
  let rightGhostVisible = false
  let rightGhostM: M2 = identity
  if (currentStep.value === 0) {
    rightM = identity
  } else if (currentStep.value === 1) {
    rightM = B
  } else {
    rightM = AB
    rightGhostVisible = true
    rightGhostM = B
  }
  setSquareVertices(ctx2.currentSquare, ctx2.currentSquareEdges, rightM, 0.1)
  setArrows(ctx2.arrowI, ctx2.arrowJ, rightM)
  setGhost(ctx2.ghostSquare, rightGhostM, 0.05, rightGhostVisible)
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
    const viewSize = 6
    item.ctx.camera.left = -viewSize * aspect / 2
    item.ctx.camera.right = viewSize * aspect / 2
    item.ctx.camera.top = viewSize / 2
    item.ctx.camera.bottom = -viewSize / 2
    item.ctx.camera.updateProjectionMatrix()
    item.ctx.renderer.setSize(width, height)
  }
}

onMounted(() => {
  try {
    if (canvas1.value) {
      ctx1 = createSceneCtx(canvas1.value, COLOR_LEFT_FILL, COLOR_LEFT_EDGE, COLOR_GHOST_LEFT)
    }
    if (canvas2.value) {
      ctx2 = createSceneCtx(canvas2.value, COLOR_RIGHT_FILL, COLOR_RIGHT_EDGE, COLOR_GHOST_RIGHT)
    }
    if (ctx1 && ctx2) {
      updateScene()
      animateLoop()
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('CompositeTransformDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  if (canvas1.value) resizeObserver.observe(canvas1.value)
  if (canvas2.value) resizeObserver.observe(canvas2.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (playTimer !== null) clearInterval(playTimer)
  resizeObserver?.disconnect()
  for (const ctx of [ctx1, ctx2]) {
    if (!ctx) continue
    ctx.controls.dispose()
    ctx.renderer.dispose()
    if (ctx.renderer.domElement.parentNode) {
      ctx.renderer.domElement.parentNode.removeChild(ctx.renderer.domElement)
    }
  }
  ctx1 = null
  ctx2 = null
})

watch([currentStep, thetaDeg, sx, shearK], updateScene)
</script>

<style scoped>
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

.pane-matrix {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin: 0 0 var(--space-1) 0;
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
  min-width: 80px;
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

.output-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger);
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

@media (max-width: 640px) {
  .dual-canvas {
    flex-direction: column;
  }
}
</style>
