<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'diag_distinct' }" @click="setPreset('diag_distinct')">
        可对角化（不同特征值）
      </button>
      <button :class="{ active: preset === 'diag_repeat' }" @click="setPreset('diag_repeat')">
        可对角化（重根 A=2I）
      </button>
      <button :class="{ active: preset === 'defective' }" @click="setPreset('defective')">
        不可对角化（缺陷矩阵）
      </button>
    </div>

    <div class="dual-pane">

      <div class="left-pane">
        <div ref="canvasContainer" class="demo-canvas"></div>
        <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

        <div v-if="!isDiagonalizable" class="warning-banner" :class="warningClass">
          <span v-if="hasComplexEigenvalues">复特征值（Δ&lt;0）：实数范围内不可对角化，A 含旋转分量</span>
          <span v-else-if="isDefective">缺陷矩阵：几何重数 &lt; 代数重数，缺少一个固有轴</span>
          <span v-else>当前矩阵不可对角化</span>
        </div>

        <div class="step-info">
          <div class="step-progress">
            <div class="step-progress-bar" :style="{ width: progressBarWidth }"></div>
            <div class="step-progress-markers">
              <span
                v-for="s in 4"
                :key="s - 1"
                class="step-marker"
                :class="{ done: s - 1 <= currentStep, current: s - 1 === currentStep }"
              >{{ s - 1 }}</span>
            </div>
          </div>
          <p class="step-text">
            <span class="step-badge">Step {{ currentStep }} / 3</span>
            <span class="step-desc">{{ stepDescription }}</span>
          </p>
        </div>

        <div class="anim-buttons">
          <button class="play-btn" @click="play" :disabled="isPlaying || currentStep >= 3 || !canAnimate">播放解耦动画</button>
          <button @click="pause" :disabled="!isPlaying && !morphAnim.active">暂停</button>
          <button @click="stepBackward" :disabled="isPlaying || currentStep <= 0 || !canAnimate">单步后退</button>
          <button @click="stepForward" :disabled="isPlaying || currentStep >= 3 || !canAnimate">单步前进</button>
          <button @click="resetAnimation" :disabled="currentStep === 0 && !isPlaying">重置</button>
        </div>

        <div class="color-legend">
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#3b82f6;opacity:0.4"></span>
            <span>原始网格（蓝）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ef4444"></span>
            <span>变形网格（红）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#fbbf24"></span>
            <span>特征向量方向（金）</span>
          </span>
        </div>
      </div>

      <div class="right-pane">

        <div class="matrix-editor">
          <p class="block-title">矩阵 A 编辑器</p>
          <div class="editor-body">
            <table class="matrix-table">
              <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
              <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
            </table>
            <div class="sliders-block">
              <label>
                <span class="slider-label">a</span>
                <input type="range" min="-3" max="3" step="0.1" :value="a"
                  @input="updateMatrix('a', parseFloat(($event.target as HTMLInputElement).value))" />
                <span class="slider-val">{{ a.toFixed(1) }}</span>
              </label>
              <label>
                <span class="slider-label">b</span>
                <input type="range" min="-3" max="3" step="0.1" :value="b"
                  @input="updateMatrix('b', parseFloat(($event.target as HTMLInputElement).value))" />
                <span class="slider-val">{{ b.toFixed(1) }}</span>
              </label>
              <label>
                <span class="slider-label">c</span>
                <input type="range" min="-3" max="3" step="0.1" :value="c"
                  @input="updateMatrix('c', parseFloat(($event.target as HTMLInputElement).value))" />
                <span class="slider-val">{{ c.toFixed(1) }}</span>
              </label>
              <label>
                <span class="slider-label">d</span>
                <input type="range" min="-3" max="3" step="0.1" :value="d"
                  @input="updateMatrix('d', parseFloat(($event.target as HTMLInputElement).value))" />
                <span class="slider-val">{{ d.toFixed(1) }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="invariants">
          <p class="block-title">不变量 & 特征多项式</p>
          <div class="invariant-row">
            <span class="inv-label">tr(A)</span>
            <span class="inv-val">{{ tr.toFixed(3) }}</span>
          </div>
          <div class="invariant-row">
            <span class="inv-label">det(A)</span>
            <span class="inv-val">{{ det.toFixed(3) }}</span>
          </div>
          <div class="invariant-row" :class="{ highlight: delta >= 0, danger: delta < 0 }">
            <span class="inv-label">判别式 Δ = tr²−4det</span>
            <span class="inv-val">{{ delta.toFixed(3) }} {{ delta >= 0 ? '实根' : '复根' }}</span>
          </div>
          <div class="invariant-row">
            <span class="inv-label">p(λ) = λ² − tr·λ + det</span>
            <span class="inv-val">λ² − {{ tr.toFixed(2) }}λ + {{ det.toFixed(2) }}</span>
          </div>
        </div>

        <div class="eigen-list">
          <p class="block-title">特征值 & 特征空间维度</p>
          <div
            v-for="(info, idx) in eigenInfos"
            :key="idx"
            class="eigen-item"
            :class="eigenItemClass(info)"
          >
            <div class="eigen-line">
              <span class="eigen-label">λ{{ idx + 1 }}</span>
              <span class="eigen-val">{{ formatEigen(info) }}</span>
              <span class="eigen-am">AM = {{ info.algMult }}</span>
              <span class="eigen-gm">GM = {{ info.geoMult }}</span>
            </div>
            <div class="eigen-vec">
              <span v-if="info.isComplex">复特征值，实数域无特征向量</span>
              <span v-else-if="info.eigenvector">
                v = ({{ info.eigenvector[0].toFixed(3) }}, {{ info.eigenvector[1].toFixed(3) }})
                <span v-if="info.algMult === 2 && info.geoMult === 2">（任意方向都是特征方向）</span>
                <span v-else-if="info.algMult === 2 && info.geoMult === 1">（缺陷：缺少一个独立特征向量）</span>
              </span>
              <span v-else>—</span>
            </div>
          </div>
        </div>

        <div class="state-machine">
          <p class="block-title">对角化判定状态机</p>
          <div class="flow-steps">
            <div class="flow-step" :class="sm.step1.status">
              <div class="flow-head">
                <span class="flow-icon">{{ stateIcon(sm.step1) }}</span>
                <span class="flow-title">① 计算 AM（代数重数）</span>
              </div>
              <div class="flow-content">{{ sm.step1.text }}</div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="flow-step" :class="sm.step2.status">
              <div class="flow-head">
                <span class="flow-icon">{{ stateIcon(sm.step2) }}</span>
                <span class="flow-title">② 计算 GM（几何重数）</span>
              </div>
              <div class="flow-content">{{ sm.step2.text }}</div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="flow-step" :class="sm.step3.status">
              <div class="flow-head">
                <span class="flow-icon">{{ stateIcon(sm.step3) }}</span>
                <span class="flow-title">③ 检查 AM = GM？</span>
              </div>
              <div class="flow-content">{{ sm.step3.text }}</div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="flow-step" :class="sm.step4.status">
              <div class="flow-head">
                <span class="flow-icon">{{ stateIcon(sm.step4) }}</span>
                <span class="flow-title">④ n 个线性无关特征向量？</span>
              </div>
              <div class="flow-content">{{ sm.step4.text }}</div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="flow-step conclusion" :class="sm.conclusion.status">
              <div class="flow-head">
                <span class="flow-icon">{{ stateIcon(sm.conclusion) }}</span>
                <span class="flow-title">⑤ 结论</span>
              </div>
              <div class="flow-content"><strong>{{ sm.conclusion.text }}</strong></div>
            </div>
          </div>
        </div>

        <div class="conclusion-box" :class="conclusionClass">
          <template v-if="isDiagonalizable">
            <p class="conclusion-title">可对角化 A = P D P⁻¹</p>
            <div class="conclusion-matrices">
              <div class="cm-item">
                <span class="cm-label">P (列为特征向量)</span>
                <span class="cm-val">{{ pMatrixDisplay }}</span>
              </div>
              <div class="cm-item">
                <span class="cm-label">D (对角元为特征值)</span>
                <span class="cm-val">{{ dMatrixDisplay }}</span>
              </div>
              <div class="cm-item" v-if="pInvMatrix.inv">
                <span class="cm-label">P⁻¹</span>
                <span class="cm-val">{{ pInvDisplay }}</span>
              </div>
              <div class="cm-item" v-else>
                <span class="cm-label">P⁻¹</span>
                <span class="cm-val">P 不可逆（特征向量线性相关）</span>
              </div>
              <div class="cm-item" :class="{ ok: pdpInvOk === true, fail: pdpInvOk === false }">
                <span class="cm-label">验证 A = P·D·P⁻¹</span>
                <span class="cm-val">{{ pdpInvOk === null ? '—' : (pdpInvOk ? '成立' : '不成立') }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <p class="conclusion-title">不可对角化</p>
            <div class="conclusion-warning">
              <p v-if="hasComplexEigenvalues">
                复特征值：A 含旋转分量，实数范围内无法对角化。<br/>
                需在复数域上做共轭对角化 A = P C P⁻¹（C 为 2×2 旋转-缩放块）。
              </p>
              <p v-else-if="isDefective">
                缺陷矩阵：AM = 2 但 GM = {{ totalGeoMult }}，缺少 {{ 2 - totalGeoMult }} 个独立特征向量。<br/>
                高亮的维度无法对角化，需使用 Jordan 标准型 A = P J P⁻¹（J 对角上方含 1）。
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="numeric-panel">
      <p class="block-title">数值验证面板</p>
      <div class="numeric-grid">
        <div class="output-row">
          <span class="label">矩阵 A</span>
          <span class="value">[[{{ a.toFixed(3) }}, {{ b.toFixed(3) }}], [{{ c.toFixed(3) }}, {{ d.toFixed(3) }}]]</span>
        </div>
        <div class="output-row">
          <span class="label">P 矩阵 (列 v₁, v₂ 归一化)</span>
          <span class="value">{{ pMatrixDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">D 矩阵 (对角 λ₁, λ₂)</span>
          <span class="value">{{ dMatrixDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">P⁻¹ 矩阵</span>
          <span class="value">{{ pInvDisplay }}</span>
        </div>
        <div class="output-row" :class="{ ok: av1Ok === true, fail: av1Ok === false }">
          <span class="label">验证 A·v₁ = λ₁·v₁</span>
          <span class="value">{{ av1Display }} {{ av1Ok === null ? '—' : (av1Ok ? '对' : '错') }}</span>
        </div>
        <div class="output-row" :class="{ ok: av2Ok === true, fail: av2Ok === false }">
          <span class="label">验证 A·v₂ = λ₂·v₂</span>
          <span class="value">{{ av2Display }} {{ av2Ok === null ? '—' : (av2Ok ? '对' : '错') }}</span>
        </div>
        <div class="output-row" :class="{ ok: pdpInvOk === true, fail: pdpInvOk === false }">
          <span class="label">验证 P·D·P⁻¹ = A</span>
          <span class="value">{{ pdpInvDisplay }} {{ pdpInvOk === null ? '—' : (pdpInvOk ? '对' : '错') }}</span>
        </div>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">对角化公式</p>
      <p class="formula-line">特征方程：det(A − λI) = 0 ⇒ λ² − tr(A)·λ + det(A) = 0</p>
      <p class="formula-line">对角化：A = P·D·P⁻¹，P = [v₁ | v₂]，D = diag(λ₁, λ₂)</p>
      <p class="formula-line">幂次简化：A<sup>k</sup> = P·D<sup>k</sup>·P⁻¹</p>
      <p class="formula-line">判定：n 个线性无关特征向量 ⇔ Σ GM = n ⇔ 每个 λ 满足 GM = AM</p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
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
    title: '对角化解耦可视化 · AM vs GM 判定状态机'
  }
)

const COLOR_GRID_BLUE = 0x3b82f6
const COLOR_GRID_RED = 0xef4444
const COLOR_EIGEN = 0xfbbf24
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID_BG = 0xe5e7eb
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981

const a = ref(2)
const b = ref(0)
const c = ref(0)
const d = ref(3)

type PresetKey = 'diag_distinct' | 'diag_repeat' | 'defective' | 'custom'
const preset = ref<PresetKey>('diag_distinct')

const currentStep = ref(0)
const isPlaying = ref(false)
const morphProgress = ref(0)
let pausedAtProgress = 0
let playTimer: number | null = null

interface MorphAnimState {
  active: boolean
  startTime: number
  duration: number
  fromStep: number
  toStep: number
  ease: (t: number) => number
}
const morphAnim: MorphAnimState = {
  active: false,
  startTime: 0,
  duration: 800,
  fromStep: 0,
  toStep: 1,
  ease: (t) => t * (2 - t)
}

function det2(M: number[][]): number {
  return M[0][0] * M[1][1] - M[0][1] * M[1][0]
}

function mat2Vec(M: number[][], v: number[]): number[] {
  return [
    M[0][0] * v[0] + M[0][1] * v[1],
    M[1][0] * v[0] + M[1][1] * v[1]
  ]
}

function mat2Mat(A: number[][], B: number[][]): number[][] {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]
  ]
}

function inv2(M: number[][]): { inv: number[][] | null; det: number } {
  const det = det2(M)
  if (Math.abs(det) < 1e-12) return { inv: null, det }
  return {
    inv: [
      [M[1][1] / det, -M[0][1] / det],
      [-M[1][0] / det, M[0][0] / det]
    ],
    det
  }
}

function rank2(M: number[][]): number {
  const a_ = M[0][0], b_ = M[0][1], c_ = M[1][0], d_ = M[1][1]
  if (Math.abs(a_) < 1e-12 && Math.abs(b_) < 1e-12 &&
      Math.abs(c_) < 1e-12 && Math.abs(d_) < 1e-12) return 0
  if (Math.abs(a_ * d_ - b_ * c_) > 1e-12) return 2
  return 1
}

function computeEigenvector(AmL: number[][]): number[] {
  const a_ = AmL[0][0]
  const b_ = AmL[0][1]
  const c_ = AmL[1][0]
  const d_ = AmL[1][1]

  if (Math.abs(b_) > 1e-9) return [-b_, a_]
  if (Math.abs(c_) > 1e-9) return [-d_, c_]
  if (Math.abs(a_) < 1e-9) return [1, 0]
  if (Math.abs(d_) < 1e-9) return [0, 1]
  return [1, 0]
}

function normalize2(v: number[]): number[] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1])
  if (len < 1e-12) return [1, 0]
  return [v[0] / len, v[1] / len]
}

interface EigenvalueInfo {
  value: number
  isComplex: boolean
  imagPart: number
  algMult: number
  geoMult: number
  eigenvector: number[] | null
}

const tr = computed(() => a.value + d.value)
const det = computed(() => a.value * d.value - b.value * c.value)
const delta = computed(() => tr.value * tr.value - 4 * det.value)
const hasComplexEigenvalues = computed(() => delta.value < -1e-12)

const eigenInfos = computed<EigenvalueInfo[]>(() => {
  const t = tr.value
  const dt = delta.value
  const result: EigenvalueInfo[] = []

  if (dt >= -1e-12) {

    const sqrtDelta = Math.sqrt(Math.max(0, dt))
    const lambda1 = (t + sqrtDelta) / 2
    const lambda2 = (t - sqrtDelta) / 2

    if (Math.abs(lambda1 - lambda2) < 1e-9) {

      result.push({
        value: lambda1, isComplex: false, imagPart: 0,
        algMult: 2, geoMult: 0, eigenvector: null
      })
    } else {
      result.push({
        value: lambda1, isComplex: false, imagPart: 0,
        algMult: 1, geoMult: 0, eigenvector: null
      })
      result.push({
        value: lambda2, isComplex: false, imagPart: 0,
        algMult: 1, geoMult: 0, eigenvector: null
      })
    }
  } else {

    const realPart = t / 2
    const imagPart = Math.sqrt(-dt) / 2
    result.push({
      value: realPart, isComplex: true, imagPart: imagPart,
      algMult: 1, geoMult: 0, eigenvector: null
    })
    result.push({
      value: realPart, isComplex: true, imagPart: -imagPart,
      algMult: 1, geoMult: 0, eigenvector: null
    })
  }

  for (const info of result) {
    if (info.isComplex) {
      info.geoMult = 0
      continue
    }
    const lambda = info.value
    const AmL = [[a.value - lambda, b.value], [c.value, d.value - lambda]]
    const r = rank2(AmL)
    info.geoMult = 2 - r
    if (info.geoMult >= 1) {
      info.eigenvector = computeEigenvector(AmL)
    }
  }

  return result
})

const isDefective = computed(() => {
  if (hasComplexEigenvalues.value) return false
  for (const info of eigenInfos.value) {
    if (info.geoMult < info.algMult) return true
  }
  return false
})

const isDiagonalizable = computed(() => {
  if (hasComplexEigenvalues.value) return false
  return !isDefective.value
})

const canAnimate = computed(() => isDiagonalizable.value)

const totalGeoMult = computed(() => {
  let sum = 0
  for (const info of eigenInfos.value) {
    if (!info.isComplex) sum += info.geoMult
  }
  return sum
})

function formatEigen(info: EigenvalueInfo): string {
  if (info.isComplex) {
    if (Math.abs(info.value) < 1e-9) return `${info.imagPart.toFixed(3)}i`
    const sign = info.imagPart >= 0 ? '+' : '−'
    return `${info.value.toFixed(3)} ${sign} ${Math.abs(info.imagPart).toFixed(3)}i`
  }
  return info.value.toFixed(3)
}

function eigenItemClass(info: EigenvalueInfo): string {
  if (info.isComplex) return 'complex'
  if (info.geoMult < info.algMult) return 'defective'
  if (info.algMult === 2 && info.geoMult === 2) return 'repeat-ok'
  return 'ok'
}

const pMatrix = computed<number[][] | null>(() => {
  if (!isDiagonalizable.value) return null
  const infos = eigenInfos.value

  if (infos.length === 1) {

    const info = infos[0]
    if (info.geoMult < 2) return null
    const lambda = info.value
    const AmL = [[a.value - lambda, b.value], [c.value, d.value - lambda]]
    const v1Raw = computeEigenvector(AmL)
    const v1 = normalize2(v1Raw)

    const v2: number[] = Math.abs(v1[0]) > 1e-6 ? [0, 1] : [1, 0]
    return [[v1[0], v2[0]], [v1[1], v2[1]]]
  }

  const v1Raw = infos[0].eigenvector
  const v2Raw = infos[1].eigenvector
  if (!v1Raw || !v2Raw) return null
  const v1 = normalize2(v1Raw)
  const v2 = normalize2(v2Raw)
  return [[v1[0], v2[0]], [v1[1], v2[1]]]
})

const dMatrix = computed<number[][] | null>(() => {
  if (!isDiagonalizable.value) return null
  const infos = eigenInfos.value
  if (infos.length === 1) {
    return [[infos[0].value, 0], [0, infos[0].value]]
  }
  return [
    [infos[0].value, 0],
    [0, infos[1].value]
  ]
})

const pInvMatrix = computed<{ inv: number[][] | null; det: number }>(() => {
  if (!pMatrix.value) return { inv: null, det: 0 }
  return inv2(pMatrix.value)
})

const pdpInv = computed<number[][] | null>(() => {
  if (!pMatrix.value || !dMatrix.value || !pInvMatrix.value.inv) return null
  const PD = mat2Mat(pMatrix.value, dMatrix.value)
  return mat2Mat(PD, pInvMatrix.value.inv)
})

const pdpInvOk = computed<boolean | null>(() => {
  if (!pdpInv.value) return null
  const M = pdpInv.value
  return Math.abs(M[0][0] - a.value) < 1e-6 &&
         Math.abs(M[0][1] - b.value) < 1e-6 &&
         Math.abs(M[1][0] - c.value) < 1e-6 &&
         Math.abs(M[1][1] - d.value) < 1e-6
})

const pdpInvDisplay = computed(() => {
  if (!pdpInv.value) return '—'
  const M = pdpInv.value
  return `[[${M[0][0].toFixed(3)}, ${M[0][1].toFixed(3)}], [${M[1][0].toFixed(3)}, ${M[1][1].toFixed(3)}]]`
})

const av1 = computed<{ vec: number[]; ok: boolean } | null>(() => {
  const infos = eigenInfos.value
  if (infos.length === 0) return null
  const info = infos[0]
  if (info.isComplex || !info.eigenvector) return null
  const Amat = [[a.value, b.value], [c.value, d.value]]
  const Av = mat2Vec(Amat, info.eigenvector)
  const lv = [info.value * info.eigenvector[0], info.value * info.eigenvector[1]]
  const ok = Math.abs(Av[0] - lv[0]) < 1e-6 && Math.abs(Av[1] - lv[1]) < 1e-6
  return { vec: Av, ok }
})

const av1Display = computed(() => {
  if (!av1.value) return '—'
  const v = av1.value.vec
  return `A·v₁=(${v[0].toFixed(3)}, ${v[1].toFixed(3)})`
})

const av1Ok = computed(() => av1.value ? av1.value.ok : null)

const av2 = computed<{ vec: number[]; ok: boolean } | null>(() => {
  const infos = eigenInfos.value
  if (infos.length < 2) {

    if (infos.length === 1 && infos[0].geoMult >= 2 && !infos[0].isComplex) {
      const info = infos[0]
      const v2: number[] = Math.abs(info.eigenvector?.[0] ?? 0) > 1e-6 ? [0, 1] : [1, 0]
      const Amat = [[a.value, b.value], [c.value, d.value]]
      const Av = mat2Vec(Amat, v2)
      const lv = [info.value * v2[0], info.value * v2[1]]
      const ok = Math.abs(Av[0] - lv[0]) < 1e-6 && Math.abs(Av[1] - lv[1]) < 1e-6
      return { vec: Av, ok }
    }
    return null
  }
  const info = infos[1]
  if (info.isComplex || !info.eigenvector) return null
  const Amat = [[a.value, b.value], [c.value, d.value]]
  const Av = mat2Vec(Amat, info.eigenvector)
  const lv = [info.value * info.eigenvector[0], info.value * info.eigenvector[1]]
  const ok = Math.abs(Av[0] - lv[0]) < 1e-6 && Math.abs(Av[1] - lv[1]) < 1e-6
  return { vec: Av, ok }
})

const av2Display = computed(() => {
  if (!av2.value) return '—'
  const v = av2.value.vec
  return `A·v₂=(${v[0].toFixed(3)}, ${v[1].toFixed(3)})`
})

const av2Ok = computed(() => av2.value ? av2.value.ok : null)

const pMatrixDisplay = computed(() => {
  if (!pMatrix.value) return '—（不可对角化）'
  const M = pMatrix.value
  return `[[${M[0][0].toFixed(3)}, ${M[0][1].toFixed(3)}], [${M[1][0].toFixed(3)}, ${M[1][1].toFixed(3)}]]`
})

const dMatrixDisplay = computed(() => {
  if (!dMatrix.value) return '—（不可对角化）'
  const M = dMatrix.value
  return `[[${M[0][0].toFixed(3)}, ${M[0][1].toFixed(3)}], [${M[1][0].toFixed(3)}, ${M[1][1].toFixed(3)}]]`
})

const pInvDisplay = computed(() => {
  if (!pInvMatrix.value.inv) return '—（P 不可逆）'
  const M = pInvMatrix.value.inv
  return `[[${M[0][0].toFixed(3)}, ${M[0][1].toFixed(3)}], [${M[1][0].toFixed(3)}, ${M[1][1].toFixed(3)}]]`
})

type StateStatus = 'pass' | 'fail' | 'pending'
interface StateNode {
  status: StateStatus
  text: string
}

const sm = computed<{
  step1: StateNode
  step2: StateNode
  step3: StateNode
  step4: StateNode
  conclusion: StateNode
}>(() => {
  if (hasComplexEigenvalues.value) {
    return {
      step1: { status: 'fail', text: 'Δ<0，无实特征值，AM(实)=0' },
      step2: { status: 'fail', text: '无实特征向量，GM=0' },
      step3: { status: 'fail', text: 'AM ≠ GM（无实根）' },
      step4: { status: 'fail', text: `0 < 2 个线性无关特征向量` },
      conclusion: { status: 'fail', text: '不可对角化（复特征值）' }
    }
  }
  const infos = eigenInfos.value
  if (infos.length === 1) {

    const info = infos[0]
    const amOk = info.algMult === 2
    const gmOk = info.geoMult >= 1
    const amEqGm = info.geoMult === info.algMult
    const nIndependent = info.geoMult === 2
    const conclusion: StateNode = nIndependent
      ? { status: 'pass', text: '可对角化（A=λI，任意方向都是特征方向）' }
      : { status: 'fail', text: '不可对角化（缺陷矩阵，GM=1<AM=2）' }
    return {
      step1: { status: amOk ? 'pass' : 'fail', text: `λ=${info.value.toFixed(3)} (重根)，AM=2` },
      step2: { status: gmOk ? 'pass' : 'fail', text: `dim N(A−λI)=${info.geoMult}，GM=${info.geoMult}` },
      step3: {
        status: amEqGm ? 'pass' : 'fail',
        text: `GM=${info.geoMult} ${amEqGm ? '=' : '<'} AM=2 ${amEqGm ? '对' : '错'}`
      },
      step4: {
        status: nIndependent ? 'pass' : 'fail',
        text: `${info.geoMult} ${nIndependent ? '=' : '<'} 2 个线性无关特征向量 ${nIndependent ? '对' : '错'}`
      },
      conclusion
    }
  }

  const info1 = infos[0]
  const info2 = infos[1]
  const amOk = info1.algMult === 1 && info2.algMult === 1
  const gmOk = info1.geoMult >= 1 && info2.geoMult >= 1
  const amEqGm = info1.geoMult === info1.algMult && info2.geoMult === info2.algMult
  const nIndependent = (info1.geoMult + info2.geoMult) === 2
  const conclusion: StateNode = nIndependent
    ? { status: 'pass', text: '可对角化（n=2 个线性无关特征向量）' }
    : { status: 'fail', text: '不可对角化' }
  return {
    step1: {
      status: amOk ? 'pass' : 'fail',
      text: `λ₁=${info1.value.toFixed(3)} AM=1, λ₂=${info2.value.toFixed(3)} AM=1`
    },
    step2: {
      status: gmOk ? 'pass' : 'fail',
      text: `GM₁=${info1.geoMult}, GM₂=${info2.geoMult}`
    },
    step3: {
      status: amEqGm ? 'pass' : 'fail',
      text: `GM=AM ${amEqGm ? '对' : '错'}`
    },
    step4: {
      status: nIndependent ? 'pass' : 'fail',
      text: `${info1.geoMult + info2.geoMult} 个线性无关特征向量 ${nIndependent ? '对' : '错'}`
    },
    conclusion
  }
})

function stateIcon(node: StateNode): string {
  if (node.status === 'pass') return '对'
  if (node.status === 'fail') return '错'
  return '○'
}

const conclusionClass = computed(() => isDiagonalizable.value ? 'ok' : 'fail')
const warningClass = computed(() => hasComplexEigenvalues.value ? 'warning' : 'danger')

const stepDescription = computed(() => {
  if (!isDiagonalizable.value) {
    return '当前矩阵不可对角化，无法演示解耦动画。仅显示原始网格（蓝）与 A 作用后网格（红）。'
  }
  switch (currentStep.value) {
    case 0: return '初始：原始 8×8 网格（蓝）。点击播放开始沿特征向量方向解耦。'
    case 1: return 'Step 1：沿 v₁ 方向拉伸 |λ₁| 倍。观察红色网格仅沿金色 v₁ 方向变化。'
    case 2: return 'Step 2：再沿 v₂ 方向拉伸 |λ₂| 倍。两个方向独立作用（解耦）。'
    case 3: return 'Step 3：合成显示 A·网格。等价于 P·D·P⁻¹ 三步级联的最终结果。'
    default: return ''
  }
})

const tipText = computed(() => {
  if (!isDiagonalizable.value) {
    if (hasComplexEigenvalues.value) {
      return '复特征值（Δ<0）：A 含旋转分量，实数范围内不可对角化。可在复数域上做共轭对角化。'
    }
    return '缺陷矩阵：AM=2 但 GM=1，缺少一个固有轴。需要 Jordan 标准型 A=PJP⁻¹ 表示（J 对角上方含 1）。'
  }
  return '观察「解耦」本质：A 沿特征向量方向独立拉伸/压缩。当 AM=GM 时，特征向量构成完整基，A 可对角化为 A=PDP⁻¹。'
})

const canvasContainer = ref<HTMLElement | null>(null)
let scene!: THREE.Scene
let camera!: THREE.OrthographicCamera
let renderer!: THREE.WebGLRenderer
let controls!: OrbitControls
let resizeObserver!: ResizeObserver
let animationId = 0

let gridOriginal!: THREE.LineSegments
let gridOriginalFill!: THREE.Mesh
let gridDeformed!: THREE.LineSegments

let eigenLine1!: THREE.Mesh
let eigenLine2!: THREE.Mesh

let axisX!: THREE.ArrowHelper
let axisY!: THREE.ArrowHelper

const GRID_SIZE = 4
const GRID_CELLS = 8
const GRID_HALF = GRID_SIZE / 2
const CELL_SIZE = GRID_SIZE / GRID_CELLS

function buildGridPoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []

  for (let i = 0; i <= GRID_CELLS; i++) {
    const y = -GRID_HALF + i * CELL_SIZE
    pts.push(new THREE.Vector3(-GRID_HALF, y, 0))
    pts.push(new THREE.Vector3(GRID_HALF, y, 0))
  }

  for (let i = 0; i <= GRID_CELLS; i++) {
    const x = -GRID_HALF + i * CELL_SIZE
    pts.push(new THREE.Vector3(x, -GRID_HALF, 0))
    pts.push(new THREE.Vector3(x, GRID_HALF, 0))
  }
  return pts
}

function applyMatToPoints(pts: THREE.Vector3[], M: number[][]): THREE.Vector3[] {
  return pts.map(p => new THREE.Vector3(
    M[0][0] * p.x + M[0][1] * p.y,
    M[1][0] * p.x + M[1][1] * p.y,
    0
  ))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpPts(from: THREE.Vector3[], to: THREE.Vector3[], t: number): THREE.Vector3[] {
  return from.map((p, i) => new THREE.Vector3(
    lerp(p.x, to[i].x, t),
    lerp(p.y, to[i].y, t),
    0
  ))
}

function updateLineSegments(line: THREE.LineSegments, pts: THREE.Vector3[]) {
  const pos = line.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pts.length; i++) {
    pos.setXYZ(i, pts[i].x, pts[i].y, pts[i].z)
  }
  pos.needsUpdate = true
}

function setLineOpacity(line: THREE.LineSegments, opacity: number) {
  const mat = line.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = opacity
}

function setMeshOpacity(mesh: THREE.Mesh, opacity: number) {
  const mat = mesh.material as THREE.MeshBasicMaterial
  mat.transparent = true
  mat.opacity = opacity
}

function getStepMatrix(step: number): number[][] {
  const infos = eigenInfos.value
  if (!isDiagonalizable.value || infos.length === 0) {
    return step === 0 ? [[1, 0], [0, 1]] : [[a.value, b.value], [c.value, d.value]]
  }
  if (step === 0) return [[1, 0], [0, 1]]
  if (step === 3) return [[a.value, b.value], [c.value, d.value]]

  let v1: number[], v2: number[]
  let lambda1: number, lambda2: number

  if (infos.length === 1) {

    const info = infos[0]
    const AmL = [[a.value - info.value, b.value], [c.value, d.value - info.value]]
    v1 = normalize2(computeEigenvector(AmL))
    v2 = [-v1[1], v1[0]]
    lambda1 = info.value
    lambda2 = info.value
  } else {
    v1 = normalize2(infos[0].eigenvector ?? [1, 0])
    v2 = normalize2(infos[1].eigenvector ?? [0, 1])
    lambda1 = infos[0].value
    lambda2 = infos[1].value
  }

  const s1 = Math.abs(lambda1)
  const s2 = step >= 2 ? Math.abs(lambda2) : 1

  return [
    [s1 * v1[0] * v1[0] + s2 * v2[0] * v2[0], s1 * v1[0] * v1[1] + s2 * v2[0] * v2[1]],
    [s1 * v1[1] * v1[0] + s2 * v2[1] * v2[0], s1 * v1[1] * v1[1] + s2 * v2[1] * v2[1]]
  ]
}

let ptsStep0: THREE.Vector3[] = []
let ptsStep1: THREE.Vector3[] = []
let ptsStep2: THREE.Vector3[] = []
let ptsStep3: THREE.Vector3[] = []
let baseGridPts: THREE.Vector3[] = []

function recomputeStepPoints() {
  baseGridPts = buildGridPoints()
  ptsStep0 = baseGridPts
  ptsStep1 = applyMatToPoints(baseGridPts, getStepMatrix(1))
  ptsStep2 = applyMatToPoints(baseGridPts, getStepMatrix(2))
  ptsStep3 = applyMatToPoints(baseGridPts, getStepMatrix(3))
}

function createEigenLine(): THREE.Mesh {
  const radius = 0.04
  const length = 20
  const geom = new THREE.CylinderGeometry(radius, radius, length, 8)
  const mat = new THREE.MeshBasicMaterial({
    color: COLOR_EIGEN,
    transparent: true,
    opacity: 0.85
  })
  return new THREE.Mesh(geom, mat)
}

function updateEigenLine(mesh: THREE.Mesh, direction: number[] | null) {
  if (!direction) {
    mesh.visible = false
    return
  }
  const len = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1])
  if (len < 1e-9) {
    mesh.visible = false
    return
  }
  const dir3 = new THREE.Vector3(direction[0] / len, direction[1] / len, 0)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir3)
  mesh.quaternion.copy(quaternion)
  mesh.visible = true
}

const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 480

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
  const viewSize = 6
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2,
    viewSize * aspect / 2,
    viewSize / 2,
    -viewSize / 2,
    0.1, 100
  )
  camera.position.set(2, 2, 10)
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
  controls.maxDistance = 30

  scene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
  dirLight.position.set(5, 5, 10)
  scene.add(dirLight)

  const bgGrid = new THREE.GridHelper(10, 20, 0x9ca3af, COLOR_GRID_BG)
  bgGrid.rotation.x = Math.PI / 2
  scene.add(bgGrid)

  axisX = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    3, COLOR_AXIS_X, 0.2, 0.1
  )
  scene.add(axisX)
  axisY = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    3, COLOR_AXIS_Y, 0.2, 0.1
  )
  scene.add(axisY)

  const origGeom = new THREE.SphereGeometry(0.07, 16, 16)
  const origMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  scene.add(new THREE.Mesh(origGeom, origMat))

  const numPts = (GRID_CELLS + 1) * 2 * 2
  const gridGeom = new THREE.BufferGeometry()
  gridGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numPts * 3), 3))
  const gridMat = new THREE.LineBasicMaterial({
    color: COLOR_GRID_BLUE,
    transparent: true,
    opacity: 0.7
  })
  gridOriginal = new THREE.LineSegments(gridGeom, gridMat)
  scene.add(gridOriginal)

  const fillGeom = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
  const fillMat = new THREE.MeshBasicMaterial({
    color: COLOR_GRID_BLUE,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  gridOriginalFill = new THREE.Mesh(fillGeom, fillMat)
  gridOriginalFill.position.z = -0.001
  scene.add(gridOriginalFill)

  const defGeom = new THREE.BufferGeometry()
  defGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numPts * 3), 3))
  const defMat = new THREE.LineBasicMaterial({
    color: COLOR_GRID_RED,
    transparent: true,
    opacity: 1
  })
  gridDeformed = new THREE.LineSegments(defGeom, defMat)
  scene.add(gridDeformed)

  eigenLine1 = createEigenLine()
  scene.add(eigenLine1)
  eigenLine2 = createEigenLine()
  scene.add(eigenLine2)

  recomputeStepPoints()
  updateScene()
}

function updateScene() {
  if (!scene) return

  recomputeStepPoints()

  updateLineSegments(gridOriginal, ptsStep0)

  const allSteps = [ptsStep0, ptsStep1, ptsStep2, ptsStep3]
  if (!isDiagonalizable.value) {

    updateLineSegments(gridDeformed, ptsStep3)
    setLineOpacity(gridDeformed, 1.0)
    setMeshOpacity(gridOriginalFill, 0.2)
  } else {

    updateLineSegments(gridDeformed, allSteps[currentStep.value])
    setLineOpacity(gridDeformed, currentStep.value === 0 ? 0 : 1.0)
    setMeshOpacity(gridOriginalFill, currentStep.value === 0 ? 0.2 : 0.08)
  }

  const infos = eigenInfos.value
  if (hasComplexEigenvalues.value) {

    updateEigenLine(eigenLine1, null)
    updateEigenLine(eigenLine2, null)
  } else if (isDiagonalizable.value) {

    if (infos.length === 1) {

      updateEigenLine(eigenLine1, [1, 0])
      updateEigenLine(eigenLine2, [0, 1])
    } else {
      updateEigenLine(eigenLine1, infos[0].eigenvector)
      updateEigenLine(eigenLine2, infos[1].eigenvector)
    }
  } else {

    if (infos.length === 1 && infos[0].geoMult === 1 && infos[0].eigenvector) {
      updateEigenLine(eigenLine1, infos[0].eigenvector)
      updateEigenLine(eigenLine2, null)
    } else if (infos.length >= 2) {

      updateEigenLine(eigenLine1, infos[0].eigenvector)
      updateEigenLine(eigenLine2, infos[1].eigenvector)
    } else {
      updateEigenLine(eigenLine1, null)
      updateEigenLine(eigenLine2, null)
    }
  }
}

function startMorph(fromStep: number, toStep: number) {
  morphAnim.active = true
  morphAnim.startTime = performance.now()
  morphAnim.duration = 800
  morphAnim.fromStep = fromStep
  morphAnim.toStep = toStep
  morphProgress.value = 0
  pausedAtProgress = 0
}

function applyMorph(t: number) {
  const from = morphAnim.fromStep
  const to = morphAnim.toStep
  const allSteps = [ptsStep0, ptsStep1, ptsStep2, ptsStep3]
  const fromPts = allSteps[from]
  const toPts = allSteps[to]

  const morphedPts = lerpPts(fromPts, toPts, t)
  updateLineSegments(gridDeformed, morphedPts)
  setLineOpacity(gridDeformed, 1.0)

  setMeshOpacity(gridOriginalFill, lerp(0.2, 0.05, t * 0.5))
}

function play() {
  if (morphAnim.active || currentStep.value >= 3 || !canAnimate.value) return
  isPlaying.value = true
  if (pausedAtProgress > 0 && pausedAtProgress < 1) {
    morphAnim.active = true
    morphAnim.startTime = performance.now() - pausedAtProgress * morphAnim.duration
    pausedAtProgress = 0
  } else {
    startMorph(currentStep.value, currentStep.value + 1)
  }
}

function pause() {
  if (!morphAnim.active) {
    isPlaying.value = false
    return
  }
  const elapsed = performance.now() - morphAnim.startTime
  pausedAtProgress = Math.min(1, elapsed / morphAnim.duration)
  morphAnim.active = false
  isPlaying.value = false
}

function stepForward() {
  if (morphAnim.active || currentStep.value >= 3 || !canAnimate.value) return
  startMorph(currentStep.value, currentStep.value + 1)
}

function stepBackward() {
  if (morphAnim.active || currentStep.value <= 0 || !canAnimate.value) return
  startMorph(currentStep.value, currentStep.value - 1)
}

function resetAnimation() {
  morphAnim.active = false
  isPlaying.value = false
  currentStep.value = 0
  morphProgress.value = 0
  pausedAtProgress = 0
  if (playTimer) {
    clearTimeout(playTimer)
    playTimer = null
  }
  if (scene) updateScene()
}

function doNextStep() {
  if (currentStep.value >= 3) {
    isPlaying.value = false
    return
  }
  startMorph(currentStep.value, currentStep.value + 1)
}

function updateMatrix(name: 'a' | 'b' | 'c' | 'd', value: number) {
  const v = Math.max(-3, Math.min(3, value))
  if (name === 'a') a.value = v
  else if (name === 'b') b.value = v
  else if (name === 'c') c.value = v
  else if (name === 'd') d.value = v
}

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'diag_distinct':

      a.value = 2; b.value = 0; c.value = 0; d.value = 3
      break
    case 'diag_repeat':

      a.value = 2; b.value = 0; c.value = 0; d.value = 2
      break
    case 'defective':

      a.value = 2; b.value = 1; c.value = 0; d.value = 2
      break
  }
  resetAnimation()
  if (scene) updateScene()
}

watch([a, b, c, d], () => {
  if (!scene) return
  preset.value = 'custom'

  if (!canAnimate.value) {
    morphAnim.active = false
    isPlaying.value = false
    currentStep.value = 0
    morphProgress.value = 0
    pausedAtProgress = 0
    if (playTimer) {
      clearTimeout(playTimer)
      playTimer = null
    }
  } else if (morphAnim.active) {

    morphAnim.active = false
    morphProgress.value = 0
    pausedAtProgress = 0
  }
  updateScene()
})

const progressBarWidth = computed(() => {
  let progress = currentStep.value
  if (morphAnim.active && morphProgress.value > 0 && morphProgress.value < 1) {
    progress = morphAnim.fromStep + morphProgress.value
  }
  return (progress / 3) * 100 + '%'
})

function animate(time: number) {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera || !controls) return

  if (morphAnim.active) {
    const elapsed = time - morphAnim.startTime
    const rawT = Math.min(1, elapsed / morphAnim.duration)
    morphProgress.value = rawT
    const easedT = morphAnim.ease(rawT)
    applyMorph(easedT)
    if (rawT >= 1) {
      morphAnim.active = false
      morphProgress.value = 0
      currentStep.value = morphAnim.toStep
      updateScene()

      if (isPlaying.value) {
        if (currentStep.value < 3) {
          playTimer = window.setTimeout(() => {
            doNextStep()
          }, 200)
        } else {
          isPlaying.value = false
        }
      }
    }
  }

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
    if (renderer) {
      animationId = requestAnimationFrame(animate)
    }
  } catch (e) {
    initStatus.value = '初始化失败：' + (e as Error).message
    initStatusType.value = 'error'
    console.error('DiagonalizationDemo init error:', e)
  }
  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvasContainer.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  morphAnim.active = false
  if (playTimer) clearTimeout(playTimer)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>

.dual-pane {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: var(--space-3);
  margin: var(--space-3) 0;
}

@media (max-width: 960px) {
  .dual-pane {
    grid-template-columns: 1fr;
  }
}

.left-pane,
.right-pane {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

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

.demo-canvas {
  width: 100%;
  height: 480px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  overflow: hidden;
  position: relative;
}

.warning-banner {
  margin-top: var(--space-2);
  padding: 0.6em 1em;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  text-align: center;
  font-weight: 600;
}

.warning-banner.warning {
  background: var(--bg-warning-soft);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.warning-banner.danger {
  background: var(--bg-danger-soft);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.step-info {
  margin: var(--space-2) 0;
}

.step-progress {
  position: relative;
  height: 28px;
  background: var(--bg-code);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.step-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  transition: width 0.05s linear;
  border-radius: var(--radius-full);
}

.step-progress-markers {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  pointer-events: none;
}

.step-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-content);
  border: 2px solid var(--border-color-strong);
  color: var(--text-tertiary);
  font-size: var(--fs-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.step-marker.done {
  background: #fbbf24;
  border-color: #f59e0b;
  color: white;
}

.step-marker.current {
  background: #fbbf24;
  border-color: #d97706;
  color: white;
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
}

.step-text {
  margin: var(--space-2) 0 0 0;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  line-height: 1.5;
}

.step-badge {
  display: inline-block;
  padding: 0.15em 0.6em;
  background: rgba(251, 191, 36, 0.15);
  color: #b45309;
  border-radius: var(--radius-sm);
  font-weight: 700;
  margin-right: var(--space-2);
}

.step-desc {
  color: var(--text-primary);
}

.anim-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-2) 0;
  justify-content: center;
}

.anim-buttons button {
  padding: 0.5em 1.2em;
  border: 1px solid var(--border-color-strong);
  background: var(--bg-content);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-family: var(--font-mono);
  font-weight: 600;
  transition: all 0.15s ease;
}

.anim-buttons button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.anim-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-code);
}

.anim-buttons button.play-btn {
  background: #fbbf24;
  color: white;
  border-color: #f59e0b;
}

.anim-buttons button.play-btn:hover:not(:disabled) {
  background: #f59e0b;
  color: white;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding: 0.5em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-secondary);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}

.legend-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.legend-swatch.solid {
  height: 4px;
  border-radius: 2px;
}

.right-pane .block-title,
.numeric-panel .block-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-accent-strong);
  font-family: var(--font-mono);
  text-align: center;
}

.matrix-editor {
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.editor-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.matrix-table {
  display: inline-table;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  position: relative;
  padding: 0 0.4em;
  vertical-align: middle;
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
  padding: 0.3em 0.7em;
  text-align: center;
  color: var(--text-primary);
  font-weight: 600;
  min-width: 3.5em;
}

.sliders-block {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2) var(--space-4);
  width: 100%;
}

.sliders-block label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.slider-label {
  display: inline-block;
  width: 1.2em;
  font-weight: 700;
  color: var(--color-accent-strong);
  text-align: right;
}

.slider-val {
  display: inline-block;
  min-width: 2.5em;
  text-align: right;
  color: var(--text-primary);
  font-weight: 600;
}

.sliders-block input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  background: var(--border-color-strong);
  border-radius: 2px;
  outline: none;
  min-width: 80px;
  max-width: 140px;
}

.sliders-block input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.sliders-block input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.invariants {
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.invariant-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25em 0.6em;
  background: var(--bg-content);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.inv-label {
  color: var(--text-secondary);
}

.inv-val {
  color: var(--text-primary);
  font-weight: 600;
}

.invariant-row.highlight {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}

.invariant-row.highlight .inv-label,
.invariant-row.highlight .inv-val {
  color: var(--color-success);
}

.invariant-row.danger {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.invariant-row.danger .inv-label,
.invariant-row.danger .inv-val {
  color: var(--color-danger);
}

.eigen-list {
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.eigen-item {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-content);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.eigen-item.ok {
  border-left: 3px solid var(--color-success);
}

.eigen-item.repeat-ok {
  border-left: 3px solid var(--color-accent);
}

.eigen-item.defective {
  border-left: 3px solid var(--color-danger);
  background: var(--bg-danger-soft);
}

.eigen-item.complex {
  border-left: 3px solid var(--color-warning);
  background: var(--bg-warning-soft);
}

.eigen-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 0.25em;
  flex-wrap: wrap;
}

.eigen-label {
  font-weight: 700;
  color: var(--color-accent-strong);
}

.eigen-val {
  color: var(--text-primary);
  font-weight: 600;
}

.eigen-am,
.eigen-gm {
  font-size: var(--fs-xs);
  padding: 0.1em 0.4em;
  border-radius: var(--radius-sm);
  background: var(--bg-code);
  color: var(--text-secondary);
}

.eigen-vec {
  font-size: var(--fs-xs);
  color: var(--text-tertiary);
  padding-left: var(--space-3);
}

.state-machine {
  padding: var(--space-3);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.flow-steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.flow-step {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  transition: all 0.2s ease;
}

.flow-step.pass {
  border-left: 3px solid var(--color-success);
  background: var(--bg-success-soft);
}

.flow-step.fail {
  border-left: 3px solid var(--color-danger);
  background: var(--bg-danger-soft);
}

.flow-step.pending {
  border-left: 3px solid var(--text-tertiary);
}

.flow-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 0.25em;
}

.flow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--fs-sm);
  flex-shrink: 0;
}

.flow-step.pass .flow-icon {
  background: var(--color-success);
  color: white;
}

.flow-step.fail .flow-icon {
  background: var(--color-danger);
  color: white;
}

.flow-step.pending .flow-icon {
  background: var(--text-tertiary);
  color: white;
}

.flow-title {
  font-weight: 600;
  color: var(--text-primary);
}

.flow-content {
  color: var(--text-secondary);
  padding-left: 28px;
  font-size: var(--fs-xs);
  line-height: 1.5;
}

.flow-step.conclusion {
  font-weight: 700;
  text-align: center;
}

.flow-step.conclusion .flow-head {
  justify-content: center;
  margin-bottom: 0.25em;
}

.flow-step.conclusion .flow-content {
  padding-left: 0;
}

.flow-arrow {
  color: var(--text-tertiary);
  font-size: var(--fs-md);
  font-weight: 700;
  font-family: var(--font-mono);
}

.conclusion-box {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 2px solid;
}

.conclusion-box.ok {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}

.conclusion-box.fail {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.conclusion-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-md);
  font-weight: 700;
  text-align: center;
  font-family: var(--font-mono);
}

.conclusion-box.ok .conclusion-title {
  color: var(--color-success);
}

.conclusion-box.fail .conclusion-title {
  color: var(--color-danger);
}

.conclusion-matrices {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.cm-item {
  display: flex;
  flex-direction: column;
  padding: 0.4em 0.6em;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.cm-label {
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  margin-bottom: 0.2em;
}

.cm-val {
  color: var(--text-primary);
  font-weight: 600;
  word-break: break-all;
}

.cm-item.ok {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--color-success);
}

.cm-item.ok .cm-val {
  color: var(--color-success);
}

.cm-item.fail {
  background: rgba(239, 68, 68, 0.15);
  border-color: var(--color-danger);
}

.cm-item.fail .cm-val {
  color: var(--color-danger);
}

.conclusion-warning {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--color-danger);
  line-height: 1.6;
}

.conclusion-warning p {
  margin: 0.3em 0;
}

.numeric-panel {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
}

.numeric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: 0.25em 0.6em;
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
  word-break: break-all;
}

.output-row.ok {
  background: var(--bg-success-soft);
  border-color: var(--color-success);
}

.output-row.ok .label,
.output-row.ok .value {
  color: var(--color-success);
}

.output-row.fail {
  background: var(--bg-danger-soft);
  border-color: var(--color-danger);
}

.output-row.fail .label,
.output-row.fail .value {
  color: var(--color-danger);
}

.formula-block {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06), rgba(168, 85, 247, 0.06));
  border: 1px solid var(--border-color);
  border-left: 3px solid #fbbf24;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
}

.formula-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-accent-strong);
  text-align: center;
}

.formula-line {
  margin: 0.25em 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
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

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
  line-height: 1.6;
}

@media (max-width: 720px) {
  .sliders-block {
    grid-template-columns: 1fr;
  }

  .matrix-table td {
    min-width: 3em;
    padding: 0.2em 0.5em;
  }

  .demo-canvas {
    height: 360px;
  }

  .flow-content {
    font-size: var(--fs-xs);
  }
}
</style>
