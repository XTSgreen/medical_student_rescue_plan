<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>
    <div ref="canvasContainer" class="demo-canvas"></div>
    <div v-if="initStatus" class="demo-status" :class="initStatusType">
      {{ initStatus }}
    </div>
    <div class="demo-controls">
      <label>
        向量 a · x
        <input type="range" min="-4" max="4" step="0.1" v-model.number="ax" />
        <span class="demo-readout">{{ ax.toFixed(1) }}</span>
      </label>
      <label>
        向量 a · y
        <input type="range" min="-4" max="4" step="0.1" v-model.number="ay" />
        <span class="demo-readout">{{ ay.toFixed(1) }}</span>
      </label>
      <label>
        向量 a · z
        <input type="range" min="-4" max="4" step="0.1" v-model.number="az" />
        <span class="demo-readout">{{ az.toFixed(1) }}</span>
      </label>
      <label>
        向量 b · x
        <input type="range" min="-4" max="4" step="0.1" v-model.number="bx" />
        <span class="demo-readout">{{ bx.toFixed(1) }}</span>
      </label>
      <label>
        向量 b · y
        <input type="range" min="-4" max="4" step="0.1" v-model.number="by" />
        <span class="demo-readout">{{ by.toFixed(1) }}</span>
      </label>
      <label>
        向量 b · z
        <input type="range" min="-4" max="4" step="0.1" v-model.number="bz" />
        <span class="demo-readout">{{ bz.toFixed(1) }}</span>
      </label>
      <label class="checkbox">
        <input type="checkbox" v-model="showProjection" />
        显示 a 在 b 上的投影
      </label>
      <label class="checkbox">
        <input type="checkbox" v-model="showAngle" />
        显示夹角
      </label>
    </div>
    <div class="demo-output">
      <div class="output-row">
        <span class="label">|a|</span>
        <span class="value">{{ normA.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">|b|</span>
        <span class="value">{{ normB.toFixed(3) }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">a · b</span>
        <span class="value">{{ dot.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">cos θ</span>
        <span class="value">{{ cosAngle.toFixed(3) }}</span>
      </div>
      <div class="output-row">
        <span class="label">θ</span>
        <span class="value">{{ angleDeg.toFixed(2) }}°</span>
      </div>
    </div>
    <p class="demo-tip">
      鼠标拖拽可旋转视角，滚轮缩放。当 a 与 b 同向时 a · b 最大，垂直时为 0，反向时为负。
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
    title: '向量与点积的几何演示'
  }
)

// ---------- 响应式状态 ----------
const ax = ref(2.5)
const ay = ref(1.0)
const az = ref(0.5)
const bx = ref(1.0)
const by = ref(2.5)
const bz = ref(1.0)
const showProjection = ref(true)
const showAngle = ref(true)

// 初始化状态指示，仅在出错时显示
const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// ---------- 计算属性 ----------
const normA = computed(() =>
  Math.sqrt(ax.value ** 2 + ay.value ** 2 + az.value ** 2)
)
const normB = computed(() =>
  Math.sqrt(bx.value ** 2 + by.value ** 2 + bz.value ** 2)
)
const dot = computed(
  () => ax.value * bx.value + ay.value * by.value + az.value * bz.value
)
const cosAngle = computed(() => {
  const denom = normA.value * normB.value
  return denom < 1e-9 ? 0 : dot.value / denom
})
const angleDeg = computed(() => (Math.acos(Math.max(-1, Math.min(1, cosAngle.value))) * 180) / Math.PI)

// ---------- Three.js 资源 ----------
const canvasContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId: number

// 向量箭头引用
let arrowA: THREE.ArrowHelper
let arrowB: THREE.ArrowHelper
let arrowProj: THREE.ArrowHelper
let angleArc: THREE.Line
let projLine: THREE.Line

// 暗金主题色
const COLOR_A = 0xb8860b // 暗金
const COLOR_B = 0x3b82f6 // 蓝
const COLOR_PROJ = 0x10b981 // 绿
const COLOR_ANGLE = 0x8b5cf6 // 紫

// ---------- 初始化 ----------
function initScene() {
  const container = canvasContainer.value!
  // 防御性：若布局尚未完成，使用合理的默认尺寸
  const width = container.clientWidth || 600
  const height = container.clientHeight || 360

  // 检测 WebGL 是否可用
  const testCanvas = document.createElement('canvas')
  const gl2 = testCanvas.getContext('webgl2')
  const gl1 = gl2 || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
  if (!gl1) {
    initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 演示。请使用 Chrome/Edge/Firefox/Safari。'
    initStatusType.value = 'warning'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#b8860b;font-family:var(--font-mono);font-size:0.9rem;">当前浏览器不支持 WebGL，无法渲染 3D 演示。<br>请使用支持 WebGL 的现代浏览器（Chrome、Edge、Firefox、Safari）查看。</div>'
    return
  }

  scene = new THREE.Scene()
  // 背景渐变效果用 fog + 透明清色，让 CSS 背景透出
  scene.background = null

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(6, 5, 8)
  camera.lookAt(0, 0, 0)

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // 在某些环境下需要强制开启软件渲染
      powerPreference: 'default'
    })
  } catch (e) {
    initStatus.value = 'WebGL 初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    container.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#ef4444;font-family:var(--font-mono);font-size:0.9rem;">WebGL 初始化失败：' +
      (e as Error).message +
      '</div>'
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
  controls.maxDistance = 20

  // ---------- 光照 ----------
  const ambient = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
  dirLight.position.set(5, 10, 7)
  scene.add(dirLight)

  // ---------- 网格 ----------
  const gridHelper = new THREE.GridHelper(8, 16, 0xcbd0d8, 0xe2e5ea)
  ;(gridHelper.material as THREE.Material).transparent = true
  ;(gridHelper.material as THREE.Material).opacity = 0.5
  scene.add(gridHelper)

  // ---------- 坐标轴 ----------
  addAxis(new THREE.Vector3(4, 0, 0), 0xef4444, 'x') // x 红
  addAxis(new THREE.Vector3(0, 4, 0), 0x10b981, 'y') // y 绿
  addAxis(new THREE.Vector3(0, 0, 4), 0x3b82f6, 'z') // z 蓝

  // ---------- 原点小球 ----------
  const originGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const originMat = new THREE.MeshBasicMaterial({ color: 0x1a202c })
  const origin = new THREE.Mesh(originGeom, originMat)
  scene.add(origin)

  // ---------- 向量箭头 ----------
  arrowA = new THREE.ArrowHelper(
    new THREE.Vector3(ax.value, ay.value, az.value).normalize(),
    new THREE.Vector3(0, 0, 0),
    normA.value,
    COLOR_A,
    0.25,
    0.15
  )
  scene.add(arrowA)

  arrowB = new THREE.ArrowHelper(
    new THREE.Vector3(bx.value, by.value, bz.value).normalize(),
    new THREE.Vector3(0, 0, 0),
    normB.value,
    COLOR_B,
    0.25,
    0.15
  )
  scene.add(arrowB)

  arrowProj = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    0.001,
    COLOR_PROJ,
    0.2,
    0.12
  )
  scene.add(arrowProj)

  // 投影虚线（从 a 末端垂到 b 上的投影点）
  const projLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3()
  ])
  const projLineMat = new THREE.LineDashedMaterial({
    color: COLOR_PROJ,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.7
  })
  projLine = new THREE.Line(projLineGeom, projLineMat)
  projLine.computeLineDistances()
  scene.add(projLine)

  // 夹角弧线
  const arcGeom = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 33 }, () => new THREE.Vector3())
  )
  const arcMat = new THREE.LineBasicMaterial({
    color: COLOR_ANGLE,
    transparent: true,
    opacity: 0.7
  })
  angleArc = new THREE.Line(arcGeom, arcMat)
  scene.add(angleArc)

  updateArrows()
}

function addAxis(end: THREE.Vector3, color: number, _label: string) {
  const dir = end.clone().normalize()
  const len = end.length()
  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, color, 0.2, 0.1)
  // ArrowHelper 的真实材质在 .line.material 和 .cone.material 上
  // （arrow.material 本身继承自 Object3D，默认是空数组）
  const lineMat = arrow.line.material as THREE.Material
  const coneMat = arrow.cone.material as THREE.Material
  lineMat.transparent = true
  lineMat.opacity = 0.6
  coneMat.transparent = true
  coneMat.opacity = 0.6
  scene.add(arrow)
}

// ---------- 更新箭头 ----------
function updateArrows() {
  if (!scene) return
  const va = new THREE.Vector3(ax.value, ay.value, az.value)
  const vb = new THREE.Vector3(bx.value, by.value, bz.value)

  // a 向量
  if (normA.value > 1e-6) {
    arrowA.setDirection(va.clone().normalize())
    arrowA.setLength(normA.value, 0.25, 0.15)
  } else {
    arrowA.setLength(1e-4, 1e-4, 1e-4)
  }

  // b 向量
  if (normB.value > 1e-6) {
    arrowB.setDirection(vb.clone().normalize())
    arrowB.setLength(normB.value, 0.25, 0.15)
  } else {
    arrowB.setLength(1e-4, 1e-4, 1e-4)
  }

  // 投影: proj_b(a) = (a·b / |b|^2) * b
  const bNormSq = vb.lengthSq()
  if (bNormSq > 1e-6 && showProjection.value) {
    const scalar = va.dot(vb) / bNormSq
    const proj = vb.clone().multiplyScalar(scalar)
    arrowProj.visible = true
    arrowProj.setDirection(proj.clone().normalize())
    arrowProj.setLength(Math.max(proj.length(), 1e-4), 0.2, 0.12)

    // 投影虚线
    const positions = projLine.geometry.attributes.position as THREE.BufferAttribute
    positions.setXYZ(0, va.x, va.y, va.z)
    positions.setXYZ(1, proj.x, proj.y, proj.z)
    positions.needsUpdate = true
    projLine.computeLineDistances()
    projLine.visible = true
  } else {
    arrowProj.visible = false
    projLine.visible = false
  }

  // 夹角弧线
  if (showAngle.value && normA.value > 0.1 && normB.value > 0.1) {
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle.value)))
    const arcRadius = Math.min(normA.value, normB.value) * 0.4
    const aDir = va.clone().normalize()
    const bDir = vb.clone().normalize()
    // 用 slerp 插值生成弧线
    const positions = angleArc.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < 33; i++) {
      const t = i / 32
      // 球面线性插值
      const sinAngle = Math.sin(angle)
      let p: THREE.Vector3
      if (sinAngle < 1e-6) {
        p = aDir.clone().multiplyScalar(arcRadius)
      } else {
        const w1 = Math.sin((1 - t) * angle) / sinAngle
        const w2 = Math.sin(t * angle) / sinAngle
        p = aDir.clone().multiplyScalar(w1 * arcRadius).add(bDir.clone().multiplyScalar(w2 * arcRadius))
      }
      positions.setXYZ(i, p.x, p.y, p.z)
    }
    positions.needsUpdate = true
    angleArc.visible = true
  } else {
    angleArc.visible = false
  }
}

// ---------- 动画循环 ----------
function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return
  controls.update()
  renderer.render(scene, camera)
}

// ---------- 响应式 resize ----------
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
    // 只有 WebGL 可用时才启动动画循环
    if (renderer) {
      animate()
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('VectorDemo init error:', e)
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

// 监听滑块变化
watch([ax, ay, az, bx, by, bz, showProjection, showAngle], updateArrows)
</script>

<style scoped>
.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
