<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button :class="{ active: preset === 'diag' }" @click="setPreset('diag')">方阵可对角化</button>
      <button :class="{ active: preset === 'rect' }" @click="setPreset('rect')">非方阵 3×2（默认）</button>
      <button :class="{ active: preset === 'shear' }" @click="setPreset('shear')">剪切矩阵</button>
      <button :class="{ active: preset === 'rank' }" @click="setPreset('rank')">秩亏矩阵（σ₃=0）</button>
    </div>

    <div class="dual-pane">

      <div class="left-pane">
        <div ref="canvasContainer" class="demo-canvas"></div>
        <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

        <div class="phase-label" :class="phaseColorClass">
          <span class="phase-name">Phase {{ currentPhase }}</span>
          <span class="phase-desc">{{ phaseDescription }}</span>
        </div>

        <div class="timeline">
          <div class="timeline-track">
            <div class="timeline-progress" :class="phaseColorClass" :style="{ width: timelinePercent + '%' }"></div>
            <div class="timeline-markers">
              <span class="marker" :class="{ active: currentPhase === 0 }">0%</span>
              <span class="marker" :class="{ active: currentPhase === 1 }">33%</span>
              <span class="marker" :class="{ active: currentPhase === 2 }">66%</span>
              <span class="marker" :class="{ active: currentPhase === 3 }">100%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            :value="timelinePercent"
            @input="onTimelineInput(parseFloat(($event.target as HTMLInputElement).value))"
            class="timeline-slider"
          />
          <div class="phase-labels">
            <span :class="{ active: currentPhase === 0 }">Phase 0</span>
            <span :class="{ active: currentPhase === 1 }">Phase 1</span>
            <span :class="{ active: currentPhase === 2 }">Phase 2</span>
            <span :class="{ active: currentPhase === 3 }">Phase 3</span>
          </div>
        </div>

        <div class="anim-buttons">
          <button class="play-btn" @click="autoPlay" :disabled="isPlaying">自动演示</button>
          <button @click="pause" :disabled="!isPlaying">暂停</button>
          <button @click="reset" :disabled="timelinePercent === 0 && !isPlaying">重置</button>
        </div>

        <div class="color-legend">
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ffffff;opacity:0.4"></span>
            <span>单位球面</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ef4444"></span>
            <span>X 基（红）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#10b981"></span>
            <span>Y 基（绿）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#3b82f6"></span>
            <span>Z 基（蓝）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#fbbf24"></span>
            <span>当前主轴（金）</span>
          </span>
        </div>
      </div>

      <div class="right-pane">

        <div class="matrix-editor">
          <p class="block-title">矩阵 A 编辑器（3×2）</p>
          <div class="editor-body">
            <table class="matrix-table">
              <tr><td>{{ a.toFixed(2) }}</td><td>{{ b.toFixed(2) }}</td></tr>
              <tr><td>{{ c.toFixed(2) }}</td><td>{{ d.toFixed(2) }}</td></tr>
              <tr><td>{{ e.toFixed(2) }}</td><td>{{ f.toFixed(2) }}</td></tr>
            </table>
            <div class="sliders-block">
              <label v-for="item in sliderItems" :key="item.key">
                <span class="slider-label">{{ item.label }}</span>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  :value="item.value"
                  @input="updateMatrix(item.key, parseFloat(($event.target as HTMLInputElement).value))"
                />
                <span class="slider-val">{{ item.value.toFixed(1) }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="phase-info" :class="phaseColorClass">
          <p class="block-title">当前阶段</p>
          <div class="phase-row">
            <span class="phase-label-text">Phase</span>
            <span class="phase-value">{{ currentPhase }}</span>
          </div>
          <div class="phase-row">
            <span class="phase-label-text">公式</span>
            <span class="phase-formula" v-html="phaseFormula"></span>
          </div>
        </div>

        <div class="matrix-display" :class="{ 'highlight-v': currentPhase === 1 }">
          <p class="block-title">Vᵀ 矩阵（2×2）— Phase 1</p>
          <table class="matrix-table small">
            <tr v-for="(row, i) in vtMatrix" :key="i">
              <td v-for="(val, j) in row" :key="j">{{ val.toFixed(3) }}</td>
            </tr>
          </table>
        </div>

        <div class="matrix-display" :class="{ 'highlight-s': currentPhase === 2 }">
          <p class="block-title">Σ 矩阵（3×2）— Phase 2</p>
          <table class="matrix-table small">
            <tr v-for="(row, i) in sigmaMatrix" :key="i">
              <td v-for="(val, j) in row" :key="j">{{ val.toFixed(3) }}</td>
            </tr>
          </table>
        </div>

        <div class="matrix-display" :class="{ 'highlight-u': currentPhase === 3 }">
          <p class="block-title">U 矩阵（3×3）— Phase 3</p>
          <table class="matrix-table small">
            <tr v-for="(row, i) in uMatrix" :key="i">
              <td v-for="(val, j) in row" :key="j">{{ val.toFixed(3) }}</td>
            </tr>
          </table>
        </div>

        <div class="singular-values">
          <p class="block-title">奇异值 & 秩</p>
          <div class="sv-row" v-for="(s, i) in singularValues" :key="i">
            <span class="sv-label">σ{{ i + 1 }}</span>
            <span class="sv-value" :class="{ zero: Math.abs(s) < 1e-6 }">
              {{ s.toFixed(4) }}
            </span>
          </div>
          <div class="sv-row">
            <span class="sv-label">秩 r</span>
            <span class="sv-value">{{ rank }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="numeric-panel">
      <p class="block-title">数值验证面板</p>
      <div class="numeric-grid">
        <div class="output-row">
          <span class="label">矩阵 A（3×2）</span>
          <span class="value">{{ aMatrixDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">U（3×3）</span>
          <span class="value">{{ uMatrixDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">Σ（3×2）</span>
          <span class="value">{{ sigmaMatrixDisplay }}</span>
        </div>
        <div class="output-row">
          <span class="label">Vᵀ（2×2）</span>
          <span class="value">{{ vtMatrixDisplay }}</span>
        </div>
        <div class="output-row" :class="{ ok: usvOk === true, fail: usvOk === false }">
          <span class="label">验证 U·Σ·Vᵀ = A</span>
          <span class="value">{{ usvOk === null ? '—' : (usvOk ? '成立' : '不成立') }}</span>
        </div>
        <div class="output-row" :class="{ ok: orthUOk === true, fail: orthUOk === false }">
          <span class="label">Uᵀ·U = I（正交）</span>
          <span class="value">{{ orthUOk ? '对' : '错' }}</span>
        </div>
        <div class="output-row" :class="{ ok: orthVOk === true, fail: orthVOk === false }">
          <span class="label">Vᵀ·V = I（正交）</span>
          <span class="value">{{ orthVOk ? '对' : '错' }}</span>
        </div>
        <div class="output-row">
          <span class="label">σ₁ ≥ σ₂ ≥ σ₃</span>
          <span class="value">{{ sigmaOrderOk ? '降序' : '错' }}</span>
        </div>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">SVD 三部曲</p>
      <p class="formula-line">SVD 分解：<span class="math">A = U Σ Vᵀ</span></p>
      <p class="formula-line">三部曲：<span class="math">A·x = U(Σ(Vᵀ·x))</span></p>
      <p class="formula-line">几何效果：单位球 → 超椭球（沿主轴各向异性缩放）</p>
      <p class="formula-line">奇异值：σᵢ = √λᵢ(AᵀA)，σ₁ ≥ σ₂ ≥ ... ≥ σᵣ &gt; 0，秩 r = 非零奇异值个数</p>
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
    title: 'SVD 三部曲几何可视化 · 单位球 → 椭球'
  }
)

const COLOR_SPHERE = 0xffffff
const COLOR_SPHERE_WIRE = 0x94a3b8
const COLOR_AXIS_X = 0xef4444
const COLOR_AXIS_Y = 0x10b981
const COLOR_AXIS_Z = 0x3b82f6
const COLOR_PRINCIPAL = 0xfbbf24
const COLOR_ELLIPSOID = 0xfbbf24
const COLOR_ELLIPSOID_WIRE = 0xf59e0b
const COLOR_ORIGIN = 0x1f2937
const COLOR_GRID_BG = 0xe5e7eb

const a = ref(1)
const b = ref(0.5)
const c = ref(0)
const d = ref(1.2)
const e = ref(0.3)
const f = ref(0)

type MatrixKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f'

const sliderItems = computed(() => [
  { key: 'a' as MatrixKey, label: 'a', value: a.value },
  { key: 'b' as MatrixKey, label: 'b', value: b.value },
  { key: 'c' as MatrixKey, label: 'c', value: c.value },
  { key: 'd' as MatrixKey, label: 'd', value: d.value },
  { key: 'e' as MatrixKey, label: 'e', value: e.value },
  { key: 'f' as MatrixKey, label: 'f', value: f.value }
])

type PresetKey = 'diag' | 'rect' | 'shear' | 'rank' | 'custom'
const preset = ref<PresetKey>('rect')

function updateMatrix(key: MatrixKey, value: number) {
  const v = Math.max(-2, Math.min(2, value))
  if (key === 'a') a.value = v
  else if (key === 'b') b.value = v
  else if (key === 'c') c.value = v
  else if (key === 'd') d.value = v
  else if (key === 'e') e.value = v
  else if (key === 'f') f.value = v
}

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'diag':

      a.value = 2; b.value = 0; c.value = 0; d.value = 1; e.value = 0; f.value = 0
      break
    case 'rect':

      a.value = 1; b.value = 0.5; c.value = 0; d.value = 1.2; e.value = 0.3; f.value = 0
      break
    case 'shear':

      a.value = 1; b.value = 1; c.value = 0; d.value = 1; e.value = 0; f.value = 0
      break
    case 'rank':

      a.value = 1; b.value = 2; c.value = 2; d.value = 4; e.value = 3; f.value = 6
      break
  }
  reset()
}

const timelinePercent = ref(0)
const isPlaying = ref(false)
let playStartTime = 0
let playPauseOffset = 0
const playDuration = 4500
let rafId = 0

const currentPhase = computed(() => {
  const t = timelinePercent.value
  if (t < 16.5) return 0
  if (t < 49.5) return 1
  if (t < 82.5) return 2
  return 3
})

const phaseDescription = computed(() => {
  switch (currentPhase.value) {
    case 0: return '原始状态：单位球面 + 标准 XYZ 基'
    case 1: return 'Step 1: Vᵀ — 对齐到右奇异向量方向'
    case 2: return 'Step 2: Σ — 沿主轴各向异性缩放'
    case 3: return 'Step 3: U — 对齐到左奇异向量方向（最终结果）'
    default: return ''
  }
})

const phaseFormula = computed(() => {
  switch (currentPhase.value) {
    case 0: return 'x'
    case 1: return 'V<sup>T</sup>·x'
    case 2: return 'Σ·V<sup>T</sup>·x'
    case 3: return 'U·Σ·V<sup>T</sup>·x = A·x'
    default: return ''
  }
})

const phaseColorClass = computed(() => `phase-${currentPhase.value}`)

type Matrix = number[][]

function transpose(M: Matrix): Matrix {
  const m = M.length
  const n = M[0].length
  const T: Matrix = Array.from({ length: n }, () => new Array(m).fill(0))
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      T[j][i] = M[i][j]
  return T
}

function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length
  const n = B[0].length
  const k = B.length
  const C: Matrix = Array.from({ length: m }, () => new Array(n).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let l = 0; l < k; l++) s += A[i][l] * B[l][j]
      C[i][j] = s
    }
  }
  return C
}

function jacobiEigen(A: Matrix, maxIter = 200, tol = 1e-12): { values: number[], vectors: Matrix } {
  const n = A.length
  const M: Matrix = A.map(row => [...row])

  const V: Matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  )

  for (let iter = 0; iter < maxIter; iter++) {

    let p = 0, q = 1, maxVal = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(M[i][j]) > maxVal) {
          maxVal = Math.abs(M[i][j])
          p = i
          q = j
        }
      }
    }
    if (maxVal < tol) break

    const app = M[p][p]
    const aqq = M[q][q]
    const apq = M[p][q]
    if (Math.abs(apq) < 1e-15) break
    const phi = (aqq - app) / (2 * apq)
    let t: number
    if (phi >= 0) {
      t = 1 / (phi + Math.sqrt(phi * phi + 1))
    } else {
      t = -1 / (-phi + Math.sqrt(phi * phi + 1))
    }
    const c = 1 / Math.sqrt(t * t + 1)
    const s = t * c

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const mip = M[i][p]
        const miq = M[i][q]
        M[i][p] = c * mip - s * miq
        M[i][q] = s * mip + c * miq
        M[p][i] = M[i][p]
        M[q][i] = M[i][q]
      }
    }
    M[p][p] = app - t * apq
    M[q][q] = aqq + t * apq
    M[p][q] = 0
    M[q][p] = 0

    for (let i = 0; i < n; i++) {
      const vip = V[i][p]
      const viq = V[i][q]
      V[i][p] = c * vip - s * viq
      V[i][q] = s * vip + c * viq
    }
  }

  const values = M.map((row, i) => row[i])

  const indices = values.map((_, i) => i).sort((x, y) => values[y] - values[x])
  const sortedValues = indices.map(i => values[i])
  const sortedVectors: Matrix = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      sortedVectors[i][j] = V[i][indices[j]]
    }
  }
  return { values: sortedValues, vectors: sortedVectors }
}

function computeSVD(A: Matrix): { U: Matrix, S: number[], V: Matrix, rank: number } {
  const m = A.length
  const n = A[0].length
  const At = transpose(A)
  const AtA = matMul(At, A)

  const { values: eigenvalues, vectors: V } = jacobiEigen(AtA)

  const sigmas = eigenvalues.map(l => Math.sqrt(Math.max(0, l)))

  const U: Matrix = Array.from({ length: m }, () => new Array(m).fill(0))

  const isNonzero = sigmas.map(s => s > 1e-9)
  const nonzeroCount = isNonzero.filter(Boolean).length

  for (let i = 0; i < n; i++) {
    if (!isNonzero[i]) continue

    for (let r = 0; r < m; r++) {
      let sum = 0
      for (let col = 0; col < n; col++) sum += A[r][col] * V[col][i]
      U[r][i] = sum / sigmas[i]
    }
  }

  const filledCols: number[] = []
  for (let i = 0; i < n; i++) {
    if (isNonzero[i]) filledCols.push(i)
  }

  for (let b = 0; b < m; b++) {
    if (filledCols.length >= m) break
    const candidate = Array.from({ length: m }, (_, k) => (k === b ? 1 : 0))

    for (const j of filledCols) {
      let dot = 0
      for (let r = 0; r < m; r++) dot += U[r][j] * candidate[r]
      for (let r = 0; r < m; r++) candidate[r] -= dot * U[r][j]
    }

    let norm = 0
    for (let r = 0; r < m; r++) norm += candidate[r] * candidate[r]
    norm = Math.sqrt(norm)
    if (norm > 1e-6) {
      const newCol = filledCols.length
      for (let r = 0; r < m; r++) U[r][newCol] = candidate[r] / norm
      filledCols.push(newCol)
    }
  }

  return { U, S: sigmas, V, rank: nonzeroCount }
}

const Amatrix = computed<Matrix>(() => [
  [a.value, b.value],
  [c.value, d.value],
  [e.value, f.value]
])

const svdResult = computed(() => computeSVD(Amatrix.value))

const uMatrix = computed<Matrix>(() => svdResult.value.U)

const vtMatrix = computed<Matrix>(() => {
  const V = svdResult.value.V
  return transpose(V)
})

const sigmaMatrix = computed<Matrix>(() => {
  const S = svdResult.value.S
  const sigma: Matrix = [
    [S[0] || 0, 0],
    [0, S[1] || 0],
    [0, 0]
  ]
  return sigma
})

const singularValues = computed<number[]>(() => {
  const S = [...svdResult.value.S]

  while (S.length < 3) S.push(0)
  return S
})

const rank = computed(() => svdResult.value.rank)

function buildExtendedVt(Vt: Matrix): Matrix {
  const ext: Matrix = Array.from({ length: 3 }, () => new Array(3).fill(0))
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      ext[i][j] = Vt[i][j]
  ext[2][2] = 1
  return ext
}

function buildExtendedSigma(S: number[]): Matrix {
  const ext: Matrix = Array.from({ length: 3 }, () => new Array(3).fill(0))
  ext[0][0] = S[0] || 0
  ext[1][1] = S[1] || 0
  ext[2][2] = 0
  return ext
}

function buildExtendedU(U: Matrix): Matrix {
  return U
}

function mat3ToMatrix4(M: Matrix): THREE.Matrix4 {
  const m = new THREE.Matrix4()
  m.set(
    M[0][0], M[0][1], M[0][2], 0,
    M[1][0], M[1][1], M[1][2], 0,
    M[2][0], M[2][1], M[2][2], 0,
    0, 0, 0, 1
  )
  return m
}

function formatMatrix(M: Matrix, decimals = 3): string {
  return '[' + M.map(row => '[' + row.map(v => v.toFixed(decimals)).join(', ') + ']').join(', ') + ']'
}

const aMatrixDisplay = computed(() => formatMatrix(Amatrix.value))
const uMatrixDisplay = computed(() => formatMatrix(uMatrix.value))
const sigmaMatrixDisplay = computed(() => formatMatrix(sigmaMatrix.value))
const vtMatrixDisplay = computed(() => formatMatrix(vtMatrix.value))

const usvOk = computed<boolean | null>(() => {
  try {
    const U = uMatrix.value
    const Sigma = sigmaMatrix.value
    const Vt = vtMatrix.value
    const A = Amatrix.value

    const US: Matrix = Array.from({ length: 3 }, () => new Array(2).fill(0))
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        let s = 0
        for (let k = 0; k < 3; k++) s += U[i][k] * Sigma[k][j]
        US[i][j] = s
      }

    const USV: Matrix = Array.from({ length: 3 }, () => new Array(2).fill(0))
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        let s = 0
        for (let k = 0; k < 2; k++) s += US[i][k] * Vt[k][j]
        USV[i][j] = s
      }
    let maxErr = 0
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++)
        maxErr = Math.max(maxErr, Math.abs(USV[i][j] - A[i][j]))
    return maxErr < 1e-4
  } catch {
    return null
  }
})

const orthUOk = computed(() => {
  const U = uMatrix.value
  let maxErr = 0
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0
      for (let k = 0; k < 3; k++) s += U[k][i] * U[k][j]
      const expected = i === j ? 1 : 0
      maxErr = Math.max(maxErr, Math.abs(s - expected))
    }
  return maxErr < 1e-4
})

const orthVOk = computed(() => {
  const Vt = vtMatrix.value
  let maxErr = 0
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      let s = 0
      for (let k = 0; k < 2; k++) s += Vt[i][k] * Vt[k][j]
      const expected = i === j ? 1 : 0
      maxErr = Math.max(maxErr, Math.abs(s - expected))
    }
  return maxErr < 1e-4
})

const sigmaOrderOk = computed(() => {
  const s = singularValues.value
  return s[0] >= s[1] - 1e-9 && s[1] >= s[2] - 1e-9
})

function onTimelineInput(value: number) {
  timelinePercent.value = Math.max(0, Math.min(100, value))
}

function autoPlay() {
  if (isPlaying.value) return
  if (timelinePercent.value >= 100) {
    timelinePercent.value = 0
    playPauseOffset = 0
  } else {
    playPauseOffset = timelinePercent.value
  }
  isPlaying.value = true
  playStartTime = performance.now()
  tickAutoPlay()
}

function tickAutoPlay() {
  if (!isPlaying.value) return
  const now = performance.now()
  const elapsed = now - playStartTime

  const remaining = 100 - playPauseOffset
  const remainingDuration = playDuration * remaining / 100
  const progress = playPauseOffset + (elapsed / remainingDuration) * remaining
  if (progress >= 100) {
    timelinePercent.value = 100
    isPlaying.value = false
    return
  }
  timelinePercent.value = progress
  rafId = requestAnimationFrame(tickAutoPlay)
}

function pause() {
  if (!isPlaying.value) return
  isPlaying.value = false
  if (rafId) cancelAnimationFrame(rafId)

  playPauseOffset = timelinePercent.value
}

function reset() {
  isPlaying.value = false
  if (rafId) cancelAnimationFrame(rafId)
  timelinePercent.value = 0
  playPauseOffset = 0
}

const canvasContainer = ref<HTMLElement | null>(null)
const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let unitSphere!: THREE.Mesh
let unitSphereWire!: THREE.LineSegments
let axesGroup!: THREE.Group
let outerGroup!: THREE.Group
let innerGroup!: THREE.Group
let ellipsoidMesh!: THREE.Mesh
let ellipsoidWire!: THREE.LineSegments
let principalAxesGroup!: THREE.Group
let originSphere!: THREE.Mesh

let vtTargetQuat: THREE.Quaternion
let uTargetQuat: THREE.Quaternion
let vtCurrentQuat: THREE.Quaternion
let uCurrentQuat: THREE.Quaternion

let sigmaTargetScale: THREE.Vector3
let sigmaCurrentScale: THREE.Vector3

let principalLengths: number[]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function getPhaseProgress(t: number): { vt: number, sigma: number, u: number } {

  let vtProg = 0
  let sigmaProg = 0
  let uProg = 0

  if (t <= 16.5) {
    vtProg = 0
    sigmaProg = 0
    uProg = 0
  } else if (t <= 49.5) {
    vtProg = (t - 16.5) / (49.5 - 16.5)
  } else if (t <= 82.5) {
    vtProg = 1
    sigmaProg = (t - 49.5) / (82.5 - 49.5)
  } else {
    vtProg = 1
    sigmaProg = 1
    uProg = (t - 82.5) / (100 - 82.5)
  }
  return {
    vt: easeInOutCubic(Math.max(0, Math.min(1, vtProg))),
    sigma: easeInOutCubic(Math.max(0, Math.min(1, sigmaProg))),
    u: easeInOutCubic(Math.max(0, Math.min(1, uProg)))
  }
}

function initScene() {
  const container = canvasContainer.value!
  const width = container.clientWidth || 600
  const height = container.clientHeight || 500

  try {
    const testCanvas = document.createElement('canvas')
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
    if (!gl) {
      initStatus.value = '当前浏览器不支持 WebGL，无法渲染 3D 场景'
      initStatusType.value = 'error'
      return
    }
  } catch (err) {
    initStatus.value = 'WebGL 初始化失败：' + (err as Error).message
    initStatusType.value = 'error'
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(4, 3, 5)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 8, 6)
  scene.add(dirLight)
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
  dirLight2.position.set(-5, -3, -6)
  scene.add(dirLight2)

  const gridHelper = new THREE.GridHelper(10, 20, COLOR_GRID_BG, 0xf1f5f9)
  ;(gridHelper.material as THREE.Material).transparent = true
  ;(gridHelper.material as THREE.Material).opacity = 0.5
  gridHelper.position.y = -2.5
  scene.add(gridHelper)

  const sphereGeo = new THREE.SphereGeometry(1, 32, 24)
  const sphereMat = new THREE.MeshBasicMaterial({
    color: COLOR_SPHERE,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  })
  unitSphere = new THREE.Mesh(sphereGeo, sphereMat)
  scene.add(unitSphere)

  const sphereWireGeo = new THREE.WireframeGeometry(sphereGeo)
  const sphereWireMat = new THREE.LineBasicMaterial({
    color: COLOR_SPHERE_WIRE,
    transparent: true,
    opacity: 0.3
  })
  unitSphereWire = new THREE.LineSegments(sphereWireGeo, sphereWireMat)
  scene.add(unitSphereWire)

  axesGroup = new THREE.Group()
  const axisLen = 1.5
  const axisX = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLen, COLOR_AXIS_X, 0.15, 0.08
  )
  const axisY = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLen, COLOR_AXIS_Y, 0.15, 0.08
  )
  const axisZ = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLen, COLOR_AXIS_Z, 0.15, 0.08
  )
  axesGroup.add(axisX, axisY, axisZ)
  scene.add(axesGroup)

  outerGroup = new THREE.Group()
  scene.add(outerGroup)
  innerGroup = new THREE.Group()
  outerGroup.add(innerGroup)

  const ellipsoidGeo = new THREE.SphereGeometry(1, 32, 24)
  const ellipsoidMat = new THREE.MeshPhongMaterial({
    color: COLOR_ELLIPSOID,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    shininess: 80
  })
  ellipsoidMesh = new THREE.Mesh(ellipsoidGeo, ellipsoidMat)
  innerGroup.add(ellipsoidMesh)

  const ellipsoidWireGeo = new THREE.WireframeGeometry(ellipsoidGeo)
  const ellipsoidWireMat = new THREE.LineBasicMaterial({
    color: COLOR_ELLIPSOID_WIRE,
    transparent: true,
    opacity: 0.5
  })
  ellipsoidWire = new THREE.LineSegments(ellipsoidWireGeo, ellipsoidWireMat)
  innerGroup.add(ellipsoidWire)

  principalAxesGroup = new THREE.Group()
  outerGroup.add(principalAxesGroup)

  for (let i = 0; i < 3; i++) {
    const dir = new THREE.Vector3(0, 0, 0)

    dir.setComponent(i, 1)
    const arrow = new THREE.ArrowHelper(
      dir, new THREE.Vector3(0, 0, 0), 1, COLOR_PRINCIPAL, 0.2, 0.1
    )
    arrow.name = `principal-${i}`
    principalAxesGroup.add(arrow)
  }

  const originGeo = new THREE.SphereGeometry(0.06, 16, 12)
  const originMat = new THREE.MeshBasicMaterial({ color: COLOR_ORIGIN })
  originSphere = new THREE.Mesh(originGeo, originMat)
  scene.add(originSphere)

  vtTargetQuat = new THREE.Quaternion()
  uTargetQuat = new THREE.Quaternion()
  vtCurrentQuat = new THREE.Quaternion()
  uCurrentQuat = new THREE.Quaternion()
  sigmaTargetScale = new THREE.Vector3(1, 1, 1)
  sigmaCurrentScale = new THREE.Vector3(1, 1, 1)
  principalLengths = [1, 1, 1]

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, 0, 0)
  controls.minDistance = 3
  controls.maxDistance = 15

  resizeObserver = new ResizeObserver(() => handleResize())
  resizeObserver.observe(container)

  initStatus.value = '3D 场景已就绪 · 可拖拽旋转视角'
  initStatusType.value = 'success'

  update3DScene()

  animate()
}

function setArrowLength(arrow: THREE.ArrowHelper, length: number) {
  const safeLen = Math.max(0.001, length)
  const headLen = Math.min(0.25, safeLen * 0.2)
  const headWidth = Math.min(0.15, safeLen * 0.12)
  arrow.setLength(safeLen, headLen, headWidth)
}

function update3DScene() {

  const U = uMatrix.value
  const Vt = vtMatrix.value
  const S = singularValues.value

  const extVt = buildExtendedVt(Vt)
  const extSigma = buildExtendedSigma(S)
  const extU = buildExtendedU(U)

  const vtMat4 = mat3ToMatrix4(extVt)
  const uMat4 = mat3ToMatrix4(extU)

  vtTargetQuat.setFromRotationMatrix(vtMat4)
  uTargetQuat.setFromRotationMatrix(uMat4)

  sigmaTargetScale.set(
    extSigma[0][0],
    extSigma[1][1],
    extSigma[2][2]
  )

  principalLengths = [
    Math.abs(S[0]) || 0.001,
    Math.abs(S[1]) || 0.001,
    Math.abs(S[2]) || 0.001
  ]
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const t = timelinePercent.value
  const phaseProg = getPhaseProgress(t)

  vtCurrentQuat.identity().slerp(vtTargetQuat, phaseProg.vt)

  uCurrentQuat.identity().slerp(uTargetQuat, phaseProg.u)

  const sigmaProgress = phaseProg.sigma
  sigmaCurrentScale.x = lerp(1, sigmaTargetScale.x, sigmaProgress)
  sigmaCurrentScale.y = lerp(1, sigmaTargetScale.y, sigmaProgress)
  sigmaCurrentScale.z = lerp(1, sigmaTargetScale.z, sigmaProgress)

  innerGroup.quaternion.copy(vtCurrentQuat)
  innerGroup.scale.copy(sigmaCurrentScale)
  outerGroup.quaternion.copy(uCurrentQuat)

  for (let i = 0; i < 3; i++) {
    const arrow = principalAxesGroup.children[i] as THREE.ArrowHelper
    if (!arrow || !arrow.setLength) continue
    const targetLen = lerp(1, principalLengths[i], sigmaProgress)
    setArrowLength(arrow, targetLen)
  }

  const sphereOpacity = 0.15 * (1 - phaseProg.vt * 0.5)
  ;(unitSphere.material as THREE.MeshBasicMaterial).opacity = sphereOpacity
  ;(unitSphereWire.material as THREE.LineBasicMaterial).opacity = 0.3 * (1 - phaseProg.vt * 0.5)

  const ellipsoidOpacity = 0.4 * Math.max(0, phaseProg.vt)
  ;(ellipsoidMesh.material as THREE.MeshPhongMaterial).opacity = ellipsoidOpacity
  ;(ellipsoidWire.material as THREE.LineBasicMaterial).opacity = 0.5 * Math.max(0, phaseProg.vt)

  const principalOpacity = Math.max(0, Math.min(1, (t - 16.5) / 10))
  principalAxesGroup.children.forEach(child => {
    const arrow = child as THREE.ArrowHelper
    if (arrow && arrow.line && arrow.line.material) {
      ;(arrow.line.material as THREE.LineBasicMaterial).opacity = principalOpacity
      ;(arrow.line.material as THREE.LineBasicMaterial).transparent = true
    }
    if (arrow && arrow.cone && arrow.cone.material) {
      ;(arrow.cone.material as THREE.MeshBasicMaterial).opacity = principalOpacity
      ;(arrow.cone.material as THREE.MeshBasicMaterial).transparent = true
    }
  })

  controls.update()

  renderer.render(scene, camera)
}

watch(
  [a, b, c, d, e, f],
  () => {
    if (scene) update3DScene()
  },
  { flush: 'post' }
)

const tipText = computed(() => {
  switch (currentPhase.value) {
    case 0:
      return '原始状态：白色球面是单位球面 ‖x‖=1，红绿蓝分别是标准 XYZ 基。点击"自动演示"开始 SVD 三部曲，或拖动时间轴逐帧浏览。'
    case 1:
      return 'Step 1 · Vᵀ 旋转：将单位球面的右奇异向量 v₁、v₂ 对齐到坐标轴方向。此阶段只是旋转，球面形状未变（V 是正交矩阵，保持长度）。'
    case 2:
      return 'Step 2 · Σ 缩放：沿主轴方向各向异性缩放——σ₁、σ₂、σ₃ 分别决定三个轴向的拉伸。球面变形为椭球，金色箭头长度即奇异值大小。'
    case 3:
      return 'Step 3 · U 旋转：将椭球旋转到左奇异向量方向。最终椭球的三个主轴方向就是 u₁、u₂、u₃，主轴半长就是 σ₁、σ₂、σ₃。验证面板应显示 U·Σ·Vᵀ = A。'
    default:
      return ''
  }
})

function handleResize() {
  if (!renderer || !camera || !canvasContainer.value) return
  const width = canvasContainer.value.clientWidth || 600
  const height = canvasContainer.value.clientHeight || 500
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {

  requestAnimationFrame(() => {
    initScene()
  })
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (rafId) cancelAnimationFrame(rafId)
  if (resizeObserver) resizeObserver.disconnect()
  if (controls) controls.dispose()
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  scene?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    }
  })
})
</script>

<style scoped>
.demo-container {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  color: #1f2937;
}

.demo-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #0f172a;
  text-align: center;
  letter-spacing: 0.5px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.preset-buttons button {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preset-buttons button:hover {
  background: #f1f5f9;
  border-color: #64748b;
}

.preset-buttons button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.dual-pane {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.left-pane {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.right-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-canvas {
  width: 100%;
  height: 480px;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e2e8f0;
}

.demo-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.demo-status {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  z-index: 10;
  pointer-events: none;
}

.demo-status.info { background: #3b82f6; }
.demo-status.success { background: #10b981; }
.demo-status.warning { background: #f59e0b; }
.demo-status.error { background: #ef4444; }

.phase-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 6px;
  background: #f1f5f9;
  border-left: 4px solid #94a3b8;
  transition: all 0.3s;
}

.phase-label .phase-name {
  font-weight: 700;
  font-size: 14px;
  min-width: 60px;
}

.phase-label .phase-desc {
  font-size: 13px;
  color: #475569;
}

.phase-label.phase-0 {
  border-left-color: #94a3b8;
  background: #f1f5f9;
}
.phase-label.phase-1 {
  border-left-color: #3b82f6;
  background: #eff6ff;
}
.phase-label.phase-2 {
  border-left-color: #f59e0b;
  background: #fffbeb;
}
.phase-label.phase-3 {
  border-left-color: #fbbf24;
  background: #fef3c7;
}

.timeline {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
}

.timeline-track {
  position: relative;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: visible;
}

.timeline-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.1s linear, background-color 0.3s;
}

.timeline-progress.phase-0 { background: #94a3b8; }
.timeline-progress.phase-1 { background: #3b82f6; }
.timeline-progress.phase-2 { background: #f59e0b; }
.timeline-progress.phase-3 { background: #fbbf24; }

.timeline-markers {
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.timeline-markers .marker {
  font-size: 10px;
  color: #64748b;
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  transform: translateY(-50%);
}

.timeline-markers .marker.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.timeline-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  margin: 4px 0;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.timeline-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

.phase-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #64748b;
}

.phase-labels span {
  flex: 1;
  text-align: center;
  padding: 2px 0;
  border-radius: 3px;
}

.phase-labels span.active {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

.anim-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.anim-buttons button {
  padding: 6px 16px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.anim-buttons button:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}

.anim-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.anim-buttons .play-btn {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.anim-buttons .play-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  color: #fff;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #475569;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}

.legend-swatch.solid {
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.right-pane .block-title {
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.matrix-editor,
.phase-info,
.matrix-display,
.singular-values {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
}

.matrix-editor .editor-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.matrix-table {
  border-collapse: collapse;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 4px;
  overflow: hidden;
}

.matrix-table td {
  padding: 4px 8px;
  text-align: center;
  border: 1px solid #e2e8f0;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #0f172a;
  min-width: 36px;
}

.matrix-table.small td {
  padding: 3px 6px;
  font-size: 11px;
  min-width: 50px;
}

.sliders-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sliders-block label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.slider-label {
  width: 14px;
  font-weight: 600;
  color: #475569;
}

.slider-val {
  width: 30px;
  text-align: right;
  color: #3b82f6;
  font-family: 'Consolas', monospace;
}

.sliders-block input[type='range'] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 2px;
}

.sliders-block input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.phase-info {
  border-left: 4px solid #94a3b8;
  transition: all 0.3s;
}

.phase-info.phase-0 { border-left-color: #94a3b8; }
.phase-info.phase-1 { border-left-color: #3b82f6; }
.phase-info.phase-2 { border-left-color: #f59e0b; }
.phase-info.phase-3 { border-left-color: #fbbf24; }

.phase-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.phase-label-text {
  color: #64748b;
  min-width: 40px;
}

.phase-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.phase-formula {
  color: #1e40af;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  font-style: italic;
}

.matrix-display {
  transition: all 0.3s;
}

.matrix-display.highlight-v {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
}

.matrix-display.highlight-s {
  border-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

.matrix-display.highlight-u {
  border-color: #fbbf24;
  background: #fef3c7;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.2);
}

.singular-values {
  background: #fff;
}

.sv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
}

.sv-label {
  min-width: 36px;
  color: #64748b;
  font-weight: 600;
}

.sv-value {
  font-family: 'Consolas', monospace;
  color: #0f172a;
  font-weight: 600;
}

.sv-value.zero {
  color: #ef4444;
  background: #fef2f2;
  padding: 1px 6px;
  border-radius: 3px;
}

.numeric-panel {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.numeric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 12px;
}

.output-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
  border-left: 3px solid transparent;
}

.output-row .label {
  font-size: 11px;
  color: #64748b;
}

.output-row .value {
  font-size: 12px;
  color: #0f172a;
  font-family: 'Consolas', monospace;
  word-break: break-all;
}

.output-row.ok {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.output-row.ok .value {
  color: #059669;
  font-weight: 600;
}

.output-row.fail {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.output-row.fail .value {
  color: #dc2626;
  font-weight: 600;
}

.formula-block {
  background: #eff6ff;
  color: #1e293b;
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 12px;
}

.formula-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.formula-line {
  margin: 4px 0;
  font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  line-height: 1.6;
}

.formula-line .math {
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 3px;
  color: #1e40af;
  font-style: italic;
}

.demo-tip {
  margin: 12px 0 0 0;
  padding: 10px 12px;
  background: #dbeafe;
  border-radius: 6px;
  font-size: 12px;
  color: #1e3a8a;
  line-height: 1.6;
  border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .dual-pane {
    flex-direction: column;
  }
  .left-pane {
    flex: 1 1 100%;
  }
  .right-pane {
    flex: 1 1 100%;
  }
  .demo-canvas {
    height: 380px;
  }
  .numeric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
