<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons" role="group" aria-label="预设方案选择">
      <button
        v-for="opt in imageOptions"
        :key="opt.key"
        :class="{ active: imageType === opt.key }"
        :aria-pressed="imageType === opt.key"
        @click="setImageType(opt.key)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="dual-canvas">
      <div class="canvas-wrap left-wrap">
        <p class="canvas-label">
          低秩重建图像 · A<sub>k</sub> = Σ<sub>i=1</sub><sup>k</sup> σ<sub>i</sub>·u<sub>i</sub>·v<sub>i</sub><sup>T</sup>（k = {{ k }}）
        </p>
        <canvas ref="leftCanvas" class="demo-canvas dual left-canvas" role="img" aria-label="低秩重建图像画面，展示保留前 k 个奇异值后的图像"></canvas>
      </div>
      <div class="canvas-wrap right-wrap">
        <p class="canvas-label">奇异值分析 · 条形图 + 累计能量曲线</p>
        <canvas ref="rightCanvas" class="demo-canvas dual right-canvas" role="img" aria-label="奇异值分析画面，展示奇异值条形图和累计能量曲线"></canvas>
      </div>
    </div>

    <div v-if="statusMsg" class="demo-status" :class="statusType" role="status" aria-live="polite">{{ statusMsg }}</div>

    <div class="color-legend">
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>保留的奇异值（前 k 个）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#6b7280"></span>
        <span>丢弃的奇异值（后 r−k 个）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch solid" style="background:#fbbf24"></span>
        <span>累计能量曲线</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dashed"></span>
        <span>能量阈值线（90% / 95% / 99%）</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch dot"></span>
        <span>当前 k 标记</span>
      </span>
    </div>

    <div class="rank-control">
      <div class="slider-row">
        <label class="slider-label">秩 k</label>
        <input
          type="range"
          :min="0"
          :max="rank"
          step="1"
          v-model.number="k"
          class="k-slider"
        />
        <span class="slider-value">{{ k }} / {{ rank }}</span>
      </div>
      <div class="quick-buttons">
        <button @click="setK(0)">k = 0（全黑）</button>
        <button @click="setK(1)">k = 1（最模糊）</button>
        <button @click="setK(Math.floor(rank / 4))">k = ⌊r/4⌋ = {{ Math.floor(rank / 4) }}</button>
        <button @click="setK(Math.floor(rank / 2))">k = ⌊r/2⌋ = {{ Math.floor(rank / 2) }}</button>
        <button @click="setK(rank)">k = r（完整）</button>
        <button @click="setKToEnergy(0.9)">90% 能量</button>
        <button @click="setKToEnergy(0.95)">95% 能量</button>
        <button @click="setKToEnergy(0.99)">99% 能量</button>
      </div>
    </div>

    <div class="demo-output">
      <div class="output-row">
        <span class="label">图像尺寸 m × n</span>
        <span class="value">{{ IMAGE_SIZE }} × {{ IMAGE_SIZE }}</span>
      </div>
      <div class="output-row">
        <span class="label">秩 r（非零奇异值数）</span>
        <span class="value">{{ rank }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">当前秩 k</span>
        <span class="value">{{ k }}</span>
      </div>
      <div class="output-row">
        <span class="label">原始存储 m·n</span>
        <span class="value">{{ IMAGE_SIZE * IMAGE_SIZE }} 个数</span>
      </div>
      <div class="output-row">
        <span class="label">压缩存储 k·(m+n+1)</span>
        <span class="value">{{ k * (2 * IMAGE_SIZE + 1) }} 个数</span>
      </div>
      <div class="output-row" :class="compressionClass">
        <span class="label">压缩率</span>
        <span class="value">{{ compressionRatio.toFixed(2) }}%</span>
      </div>
      <div class="output-row" :class="energyClass">
        <span class="label">保留能量 E(k)</span>
        <span class="value">{{ energyPercent.toFixed(2) }}%</span>
      </div>
      <div class="output-row">
        <span class="label">Frobenius 误差 ‖A−A<sub>k</sub>‖<sub>F</sub></span>
        <span class="value">{{ frobError.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">谱范数误差 ‖A−A<sub>k</sub>‖<sub>2</sub></span>
        <span class="value">{{ spectralError.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">σ<sub>1</sub>（最大奇异值）</span>
        <span class="value">{{ sigma1.toFixed(4) }}</span>
      </div>
      <div class="output-row">
        <span class="label">σ<sub>r</sub>（最小非零奇异值）</span>
        <span class="value">{{ sigmaR.toFixed(4) }}</span>
      </div>
      <div class="output-row info">
        <span class="label">Eckart-Young 定理</span>
        <span class="value">{{ eckartYoungText }}</span>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">低秩逼近与 Eckart-Young 定理</p>
      <p class="formula-line">
        低秩逼近：<span class="math">A<sub>k</sub> = Σ<sub>i=1</sub><sup>k</sup> σ<sub>i</sub>·u<sub>i</sub>·v<sub>i</sub><sup>T</sup> = U<sub>k</sub>·Σ<sub>k</sub>·V<sub>k</sub><sup>T</sup></span>
      </p>
      <p class="formula-line">
        Frobenius 误差：<span class="math">‖A − A<sub>k</sub>‖<sub>F</sub> = √(σ<sub>k+1</sub><sup>2</sup> + ⋯ + σ<sub>r</sub><sup>2</sup>)</span>
      </p>
      <p class="formula-line">
        谱范数误差：<span class="math">‖A − A<sub>k</sub>‖<sub>2</sub> = σ<sub>k+1</sub></span>
      </p>
      <p class="formula-line">
        累计能量：<span class="math">E(k) = Σ<sub>i=1</sub><sup>k</sup>σ<sub>i</sub><sup>2</sup> / Σ<sub>i=1</sub><sup>r</sup>σ<sub>i</sub><sup>2</sup></span>
      </p>
      <p class="formula-line">
        Eckart-Young 定理：A<sub>k</sub> 是所有秩 ≤ k 的矩阵中，与 A 的 Frobenius 距离和谱距离最小的最优解
      </p>
    </div>

    <p class="demo-tip">{{ tipText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'SVD 图像压缩 · 低秩逼近的工程实践'
  }
)

const COLOR_RETAINED = '#fbbf24'
const COLOR_DISCARDED = '#6b7280'
const COLOR_ENERGY_CURVE = '#fbbf24'
const COLOR_THRESHOLD = '#94a3b8'
const COLOR_CURRENT_MARK = '#ffffff'
const COLOR_BORDER = '#e5e7eb'
const COLOR_GRID = '#f1f5f9'
const COLOR_TEXT = '#475569'
const COLOR_TEXT_DIM = '#6b7280'
const COLOR_TEXT_LABEL = '#1f2937'

const IMAGE_SIZE = 32

type ImageType = 'geometric' | 'checkerboard' | 'noise'

interface ImageOption {
  key: ImageType
  label: string
}

const imageOptions: ImageOption[] = [
  { key: 'geometric', label: '几何图案（渐变 + 圆 + 方块）' },
  { key: 'checkerboard', label: '棋盘格（8×8）' },
  { key: 'noise', label: '随机噪声（低频）' }
]

type Matrix = number[][]

const imageType = ref<ImageType>('geometric')
const k = ref(8)
const leftCanvas = ref<HTMLCanvasElement | null>(null)
const rightCanvas = ref<HTMLCanvasElement | null>(null)
let leftCtx: CanvasRenderingContext2D | null = null
let rightCtx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
const dpr = Math.min(window.devicePixelRatio || 1, 2)

interface SVDResult {
  U: Matrix
  S: number[]
  V: Matrix
  rank: number
}

const imageMatrix = ref<Matrix>(createZeroMatrix(IMAGE_SIZE, IMAGE_SIZE))
const svdCache = ref<SVDResult>({ U: [], S: [], V: [], rank: 0 })

const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

function createZeroMatrix(m: number, n: number): Matrix {
  return Array.from({ length: m }, () => new Array(n).fill(0))
}

function transpose(M: Matrix): Matrix {
  const m = M.length
  const n = M[0].length
  const T = createZeroMatrix(n, m)
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      T[j][i] = M[i][j]
    }
  }
  return T
}

function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length
  const n = B[0].length
  const p = B.length
  const C = createZeroMatrix(m, n)
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let l = 0; l < p; l++) {
        s += A[i][l] * B[l][j]
      }
      C[i][j] = s
    }
  }
  return C
}

function jacobiEigen(
  A: Matrix,
  maxIter = 200,
  tol = 1e-10
): { values: number[]; vectors: Matrix } {
  const n = A.length

  const M: Matrix = A.map(row => [...row])

  const V: Matrix = createZeroMatrix(n, n)
  for (let i = 0; i < n; i++) V[i][i] = 1

  for (let iter = 0; iter < maxIter; iter++) {

    let p = 0
    let q = 1
    let maxVal = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(M[i][j])
        if (absVal > maxVal) {
          maxVal = absVal
          p = i
          q = j
        }
      }
    }

    if (maxVal < tol) break
    const apq = M[p][q]
    if (Math.abs(apq) < 1e-15) break

    const app = M[p][p]
    const aqq = M[q][q]
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
  const sortedVectors: Matrix = createZeroMatrix(n, n)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      sortedVectors[i][j] = V[i][indices[j]]
    }
  }
  return { values: sortedValues, vectors: sortedVectors }
}

function computeSVD(A: Matrix): SVDResult {
  const m = A.length
  const n = A[0].length

  const At = transpose(A)
  const AtA = matMul(At, A)

  const { values: eigenvalues, vectors: V } = jacobiEigen(AtA)

  const sigmas = eigenvalues.map(l => Math.sqrt(Math.max(0, l)))

  const U = createZeroMatrix(m, n)
  const isNonzero = sigmas.map(s => s > 1e-9)
  let nonzeroCount = 0
  for (let j = 0; j < n; j++) {
    if (!isNonzero[j]) continue
    for (let i = 0; i < m; i++) {
      let sum = 0
      for (let l = 0; l < n; l++) {
        sum += A[i][l] * V[l][j]
      }
      U[i][j] = sum / sigmas[j]
    }
    nonzeroCount++
  }

  return { U, S: sigmas, V, rank: nonzeroCount }
}

function reconstructRankK(
  U: Matrix,
  S: number[],
  V: Matrix,
  k: number,
  m: number,
  n: number
): Matrix {
  const Ak = createZeroMatrix(m, n)
  if (k <= 0) return Ak
  const kk = Math.min(k, S.length)
  for (let idx = 0; idx < kk; idx++) {
    const sigma = S[idx]
    if (Math.abs(sigma) < 1e-12) continue

    for (let i = 0; i < m; i++) {
      const u_i_scaled = U[i][idx] * sigma
      for (let j = 0; j < n; j++) {
        Ak[i][j] += u_i_scaled * V[j][idx]
      }
    }
  }
  return Ak
}

function generateGeometric(size: number): Matrix {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#1e3a5f')
  grad.addColorStop(0.5, '#6b8cae')
  grad.addColorStop(1, '#f0e68c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#059669'
  ctx.fillRect(size * 0.65, size * 0.1, size * 0.25, size * 0.25)

  ctx.fillStyle = '#7c3aed'
  ctx.fillRect(size * 0.1, size * 0.65, size * 0.2, size * 0.2)

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(size, size)
  ctx.moveTo(size, 0)
  ctx.lineTo(0, size)
  ctx.stroke()
  return canvasToMatrix(ctx, size)
}

function generateCheckerboard(size: number): Matrix {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cells = 8
  const cellSize = size / cells
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#f5f5f5' : '#1a1a1a'
      ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
    }
  }

  ctx.strokeStyle = '#dc2626'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1)
  return canvasToMatrix(ctx, size)
}

function generateNoise(size: number): Matrix {

  const seed = 12345
  let s = seed
  const rand = (): number => {
    s = (s + 0x6D2B79F5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const coarseN = 4
  const coarse: number[][] = []
  for (let i = 0; i < coarseN; i++) {
    const row: number[] = []
    for (let j = 0; j < coarseN; j++) {
      row.push(rand())
    }
    coarse.push(row)
  }

  const matrix = createZeroMatrix(size, size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const fi = (i / (size - 1)) * (coarseN - 1)
      const fj = (j / (size - 1)) * (coarseN - 1)
      const i0 = Math.floor(fi)
      const j0 = Math.floor(fj)
      const i1 = Math.min(i0 + 1, coarseN - 1)
      const j1 = Math.min(j0 + 1, coarseN - 1)
      const di = fi - i0
      const dj = fj - j0
      const v =
        coarse[i0][j0] * (1 - di) * (1 - dj) +
        coarse[i0][j1] * (1 - di) * dj +
        coarse[i1][j0] * di * (1 - dj) +
        coarse[i1][j1] * di * dj
      matrix[i][j] = v * 255
    }
  }
  return matrix
}

function canvasToMatrix(ctx: CanvasRenderingContext2D, size: number): Matrix {
  const imgData = ctx.getImageData(0, 0, size, size)
  const matrix = createZeroMatrix(size, size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4
      const r = imgData.data[idx]
      const g = imgData.data[idx + 1]
      const b = imgData.data[idx + 2]

      matrix[i][j] = 0.299 * r + 0.587 * g + 0.114 * b
    }
  }
  return matrix
}

function generateImage(type: ImageType): Matrix {
  switch (type) {
    case 'geometric':
      return generateGeometric(IMAGE_SIZE)
    case 'checkerboard':
      return generateCheckerboard(IMAGE_SIZE)
    case 'noise':
      return generateNoise(IMAGE_SIZE)
  }
}

const rank = computed(() => svdCache.value.rank)

const singularValues = computed(() => svdCache.value.S)

const sigma1 = computed(() => singularValues.value[0] ?? 0)

const sigmaR = computed(() => {
  const S = singularValues.value
  if (rank.value === 0 || S.length === 0) return 0
  return S[Math.max(0, rank.value - 1)] ?? 0
})

const totalEnergy = computed(() => {
  return singularValues.value.reduce((sum, s) => sum + s * s, 0)
})

const energyPercent = computed(() => {
  if (totalEnergy.value < 1e-12) return 0
  const S = singularValues.value
  let sumK = 0
  const kk = Math.min(k.value, S.length)
  for (let i = 0; i < kk; i++) sumK += S[i] * S[i]
  return (sumK / totalEnergy.value) * 100
})

const compressionRatio = computed(() => {
  const m = IMAGE_SIZE
  const n = IMAGE_SIZE
  const originalSize = m * n
  const compressedSize = k.value * (m + n + 1)
  return (1 - compressedSize / originalSize) * 100
})

const compressionClass = computed(() => {
  if (compressionRatio.value > 50) return 'highlight'
  if (compressionRatio.value < 0) return 'danger'
  return ''
})

const energyClass = computed(() => {
  const e = energyPercent.value
  if (e >= 99) return 'highlight'
  if (e < 80) return 'warning'
  return ''
})

const frobError = computed(() => {
  const S = singularValues.value
  let sum = 0
  for (let i = k.value; i < S.length; i++) sum += S[i] * S[i]
  return Math.sqrt(sum)
})

const spectralError = computed(() => {
  const S = singularValues.value
  if (k.value >= S.length) return 0
  return S[k.value]
})

const eckartYoungText = computed(() => {
  if (k.value === 0) return 'k = 0：A_k = 0（零矩阵）'
  if (k.value >= rank.value) return 'k = r：A_k = A（完美重建）'
  return `A_k 是秩 ≤ ${k.value} 的最优逼近`
})

const tipText = computed(() => {
  if (k.value === 0) {
    return 'k = 0：零矩阵，所有信息丢失。增加 k 可逐步恢复图像细节——观察左画布从全黑到清晰的过程。'
  }
  if (k.value === 1) {
    return 'k = 1：仅保留最大奇异值 σ₁，图像退化为 σ₁·u₁·v₁ᵀ 的外积——一个"光照图"，捕获了图像的主要明暗分布。'
  }
  if (k.value >= rank.value) {
    return 'k = r：完整重建 A_k = A，误差为 0。但 SVD 存储成本（k·(m+n+1)）此时高于原图（m·n），不压缩——这揭示了 SVD 压缩的本质：仅在 k ≪ r 时有效。'
  }
  const e = energyPercent.value
  if (e < 80) {
    return `当前保留 ${e.toFixed(1)}% 能量，图像较模糊。前几个奇异值携带主要结构信息，继续增加 k 可快速提升质量。`
  }
  if (e < 95) {
    return `当前保留 ${e.toFixed(1)}% 能量，图像已基本清晰。Eckart-Young 定理保证 A_k 是所有秩 ≤ ${k.value} 矩阵中与 A 最接近的最优解。`
  }
  return `当前保留 ${e.toFixed(1)}% 能量，图像非常接近原图。可见 SVD 用少量分量即可逼近原图——这正是 SVD 在图像压缩、推荐系统、PCA 中的核心价值。`
})

function setImageType(type: ImageType) {
  if (imageType.value === type) return
  imageType.value = type
}

function setK(value: number) {
  k.value = Math.max(0, Math.min(rank.value, Math.round(value)))
}

function setKToEnergy(threshold: number) {
  const S = singularValues.value
  if (totalEnergy.value < 1e-12) return
  let sum = 0
  let targetK = S.length
  for (let i = 0; i < S.length; i++) {
    sum += S[i] * S[i]
    if (sum / totalEnergy.value >= threshold) {
      targetK = i + 1
      break
    }
  }
  setK(targetK)
}

function recomputeSVD() {
  const t0 = performance.now()
  imageMatrix.value = generateImage(imageType.value)
  svdCache.value = computeSVD(imageMatrix.value)
  const t1 = performance.now()

  if (k.value > svdCache.value.rank) {
    k.value = svdCache.value.rank
  }
  if (k.value < 0) k.value = 0
  statusMsg.value = `SVD 完成 · r = ${svdCache.value.rank} · 耗时 ${(t1 - t0).toFixed(1)} ms · σ₁ = ${svdCache.value.S[0]?.toFixed(2) ?? 0}`
  statusType.value = 'success'
}

function drawLeftCanvas() {
  const canvas = leftCanvas.value
  if (!canvas || !leftCtx) return
  const rect = canvas.getBoundingClientRect()
  const cssW = rect.width
  const cssH = rect.height
  if (cssW === 0 || cssH === 0) return

  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
  }
  leftCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const ctx = leftCtx

  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-content').trim()
  ctx.fillStyle = bg || '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  const Ak = reconstructRankK(
    svdCache.value.U,
    svdCache.value.S,
    svdCache.value.V,
    k.value,
    IMAGE_SIZE,
    IMAGE_SIZE
  )

  const off = document.createElement('canvas')
  off.width = IMAGE_SIZE
  off.height = IMAGE_SIZE
  const offCtx = off.getContext('2d')!
  const imgData = offCtx.createImageData(IMAGE_SIZE, IMAGE_SIZE)
  for (let i = 0; i < IMAGE_SIZE; i++) {
    for (let j = 0; j < IMAGE_SIZE; j++) {

      const val = Math.max(0, Math.min(255, Ak[i][j]))
      const idx = (i * IMAGE_SIZE + j) * 4
      imgData.data[idx] = val
      imgData.data[idx + 1] = val
      imgData.data[idx + 2] = val
      imgData.data[idx + 3] = 255
    }
  }
  offCtx.putImageData(imgData, 0, 0)

  const padding = 24
  const drawSize = Math.min(cssW, cssH) - padding * 2
  const offsetX = (cssW - drawSize) / 2
  const offsetY = (cssH - drawSize) / 2

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, offsetX, offsetY, drawSize, drawSize)

  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1
  ctx.strokeRect(offsetX - 0.5, offsetY - 0.5, drawSize + 1, drawSize + 1)

  ctx.fillStyle = COLOR_TEXT
  ctx.font = 'bold 12px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`k = ${k.value} / r = ${rank.value}`, 10, 10)

  ctx.textAlign = 'right'
  ctx.fillStyle = COLOR_RETAINED
  ctx.fillText(`${energyPercent.value.toFixed(1)}% energy`, cssW - 10, 10)

  ctx.fillStyle = COLOR_TEXT_DIM
  ctx.font = '11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${IMAGE_SIZE}×${IMAGE_SIZE} grayscale`, 10, cssH - 10)

  ctx.textAlign = 'right'
  const compColor = compressionRatio.value >= 0 ? COLOR_TEXT : '#dc2626'
  ctx.fillStyle = compColor
  ctx.fillText(`compression: ${compressionRatio.value.toFixed(1)}%`, cssW - 10, cssH - 10)
}

function drawRightCanvas() {
  const canvas = rightCanvas.value
  if (!canvas || !rightCtx) return
  const rect = canvas.getBoundingClientRect()
  const cssW = rect.width
  const cssH = rect.height
  if (cssW === 0 || cssH === 0) return

  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
  }
  rightCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const ctx = rightCtx

  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-content').trim()
  ctx.fillStyle = bg || '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  const padding = { top: 32, right: 16, bottom: 36, left: 52, mid: 28 }
  const subH = (cssH - padding.top - padding.bottom - padding.mid) / 2
  const plotW = cssW - padding.left - padding.right
  const topY = padding.top
  const botY = padding.top + subH + padding.mid

  drawSingularValueBars(ctx, padding.left, topY, plotW, subH)

  drawCumulativeEnergy(ctx, padding.left, botY, plotW, subH)
}

function drawSingularValueBars(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {

  ctx.fillStyle = COLOR_TEXT_LABEL
  ctx.font = 'bold 12px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('奇异值条形图 σᵢ（i = 1..r）', x, y - 22)

  ctx.strokeStyle = COLOR_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  const S = singularValues.value
  const r = rank.value
  if (r === 0 || S.length === 0) {
    ctx.fillStyle = COLOR_TEXT_DIM
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('无数据', x + w / 2, y + h / 2)
    return
  }

  const maxSigma = S[0]
  if (maxSigma < 1e-12) return

  ctx.fillStyle = COLOR_TEXT_DIM
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = COLOR_GRID
  ctx.lineWidth = 1
  const yTickCount = 4
  for (let i = 0; i <= yTickCount; i++) {
    const v = (i / yTickCount) * maxSigma
    const py = y + h - (i / yTickCount) * h
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    ctx.fillText(v.toFixed(0), x - 6, py)
  }

  ctx.fillStyle = COLOR_TEXT_DIM
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xTickCount = Math.min(8, r)
  for (let i = 0; i <= xTickCount; i++) {
    const idx = Math.round((i / xTickCount) * r)
    const px = x + (idx / r) * w
    if (idx > 0) ctx.fillText(idx.toString(), px, y + h + 6)
  }

  ctx.fillStyle = COLOR_TEXT
  ctx.font = 'italic 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('i (奇异值索引)', x + w, y + h + 24)

  const barWidth = w / r
  for (let i = 0; i < r; i++) {
    const sigma = S[i]
    if (sigma < 1e-12) continue
    const barH = (sigma / maxSigma) * h
    const bx = x + i * barWidth
    const by = y + h - barH

    ctx.fillStyle = i < k.value ? COLOR_RETAINED : COLOR_DISCARDED
    ctx.fillRect(bx, by, Math.max(0.5, barWidth - 0.5), barH)
  }

  if (k.value > 0 && k.value < r) {
    const px = x + (k.value / r) * w
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(px, y)
    ctx.lineTo(px, y + h)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 10px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`k=${k.value}`, px + 2, y + 2)
  }

  ctx.fillStyle = COLOR_RETAINED
  ctx.font = 'bold 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  const sigma1Y = y + h - (S[0] / maxSigma) * h
  ctx.fillText(`σ₁ = ${S[0].toFixed(2)}`, x + 4, sigma1Y - 2)
}

function drawCumulativeEnergy(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {

  ctx.fillStyle = COLOR_TEXT_LABEL
  ctx.font = 'bold 12px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('累计能量 E(k) = Σᵢ₌₁ᵏσᵢ² / Σᵢ₌₁ʳσᵢ²', x, y - 22)

  ctx.strokeStyle = COLOR_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  const S = singularValues.value
  const r = rank.value
  if (r === 0 || S.length === 0) return
  const totalE = totalEnergy.value
  if (totalE < 1e-12) return

  ctx.fillStyle = COLOR_TEXT_DIM
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = COLOR_GRID
  ctx.lineWidth = 1
  const yTickCount = 5
  for (let i = 0; i <= yTickCount; i++) {
    const v = (i / yTickCount) * 100
    const py = y + h - (i / yTickCount) * h
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
    ctx.fillText(v.toFixed(0) + '%', x - 6, py)
  }

  const thresholds = [0.9, 0.95, 0.99]
  ctx.strokeStyle = COLOR_THRESHOLD
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (const t of thresholds) {
    const py = y + h - t * h
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.lineTo(x + w, py)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.fillStyle = COLOR_THRESHOLD
  ctx.font = '9px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  for (const t of thresholds) {
    const py = y + h - t * h
    ctx.fillText((t * 100).toFixed(0) + '%', x + 4, py - 1)
  }

  ctx.fillStyle = COLOR_TEXT_DIM
  ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xTickCount = Math.min(8, r)
  for (let i = 0; i <= xTickCount; i++) {
    const idx = Math.round((i / xTickCount) * r)
    const px = x + (idx / r) * w
    if (idx > 0) ctx.fillText(idx.toString(), px, y + h + 6)
  }

  ctx.fillStyle = COLOR_TEXT
  ctx.font = 'italic 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('k (秩)', x + w, y + h + 24)

  ctx.strokeStyle = COLOR_ENERGY_CURVE
  ctx.lineWidth = 2
  ctx.beginPath()
  let cumul = 0
  for (let i = 0; i < r; i++) {
    cumul += S[i] * S[i]
    const e = cumul / totalE
    const px = x + ((i + 1) / r) * w
    const py = y + h - e * h
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  if (k.value > 0 && k.value <= r) {
    let cumul2 = 0
    for (let i = 0; i < k.value; i++) cumul2 += S[i] * S[i]
    const e = cumul2 / totalE
    const px = x + (k.value / r) * w
    const py = y + h - e * h

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = COLOR_CURRENT_MARK
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = COLOR_TEXT_LABEL
    ctx.font = 'bold 10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`(${k.value}, ${(e * 100).toFixed(1)}%)`, px + 8, py - 4)
  }
}

function redrawAll() {
  drawLeftCanvas()
  drawRightCanvas()
}

function handleResize() {
  redrawAll()
}

watch(imageType, () => {
  recomputeSVD()
  redrawAll()
})

watch(k, () => {
  redrawAll()
})

onMounted(() => {

  if (leftCanvas.value) {
    leftCtx = leftCanvas.value.getContext('2d')
  }
  if (rightCanvas.value) {
    rightCtx = rightCanvas.value.getContext('2d')
  }

  recomputeSVD()
  redrawAll()

  resizeObserver = new ResizeObserver(handleResize)
  if (leftCanvas.value) resizeObserver.observe(leftCanvas.value)
  if (rightCanvas.value) resizeObserver.observe(rightCanvas.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>

.demo-container {
  font-family: var(--font-mono, 'JetBrains Mono', Menlo, Consolas, monospace);
  margin: var(--space-3, 1rem) 0;
  padding: var(--space-3, 1rem);
  background: var(--bg-code, #f8fafc);
  border-radius: var(--radius-md, 8px);
  color: var(--text-primary, #1f2937);
}

.demo-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--space-3, 1rem) 0;
  color: var(--text-primary, #0f172a);
  text-align: center;
  letter-spacing: 0.5px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2, 0.5rem);
  justify-content: center;
  margin-bottom: var(--space-3, 1rem);
}

.preset-buttons button {
  padding: 0.4em 1.2em;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-content, #fff);
  color: var(--text-secondary, #475569);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  font-size: var(--fs-sm, 0.875rem);
  font-family: var(--font-mono, monospace);
  font-weight: 500;
  transition: all 0.15s ease;
}

.preset-buttons button:hover {
  border-color: var(--color-accent, #3b82f6);
  color: var(--color-accent, #3b82f6);
}

.preset-buttons button.active {
  background: var(--color-accent, #3b82f6);
  color: white;
  border-color: var(--color-accent, #3b82f6);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.dual-canvas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3, 1rem);
  margin: var(--space-2, 0.5rem) 0;
}

.canvas-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 0.25rem);
  min-width: 0;
}

.left-wrap {
  flex: 0 0 60%;
}

.right-wrap {
  flex: 1 1 40%;
}

.canvas-label {
  margin: 0;
  text-align: center;
  font-size: var(--fs-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-accent-strong, #1e40af);
  font-family: var(--font-mono, monospace);
}

.demo-canvas.dual {
  width: 100%;
  height: 460px;
  background: var(--bg-content, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm, 4px);
  display: block;
}

.demo-status {
  margin-top: var(--space-2, 0.5rem);
  padding: 0.4em 0.9em;
  font-family: var(--font-mono, monospace);
  font-size: var(--fs-xs, 0.75rem);
  border-radius: var(--radius-sm, 4px);
  display: inline-block;
}

.demo-status.info {
  background: var(--bg-info-soft, #eff6ff);
  color: var(--color-info, #3b82f6);
}
.demo-status.success {
  background: var(--bg-success-soft, #f0fdf4);
  color: var(--color-success, #10b981);
}
.demo-status.warning {
  background: var(--bg-warning-soft, #fffbeb);
  color: var(--color-warning, #f59e0b);
}
.demo-status.error {
  background: var(--bg-danger-soft, #fef2f2);
  color: var(--color-danger, #ef4444);
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3, 1rem);
  margin-top: var(--space-2, 0.5rem);
  padding: 0.5em 1em;
  font-family: var(--font-mono, monospace);
  font-size: var(--fs-xs, 0.75rem);
  color: var(--text-secondary, #475569);
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
}

.legend-swatch.solid {
  height: 4px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-swatch.dashed {
  background: repeating-linear-gradient(
    to right,
    #94a3b8 0,
    #94a3b8 4px,
    transparent 4px,
    transparent 7px
  );
  height: 4px;
  border: none;
  border-radius: 2px;
  width: 22px;
}

.legend-swatch.dot {
  background: #ffffff;
  border: 1.5px solid #1f2937;
  border-radius: 50%;
  width: 12px;
  height: 12px;
}

.rank-control {
  margin: var(--space-3, 1rem) 0;
  padding: var(--space-3, 1rem);
  background: var(--bg-content, #ffffff);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  margin-bottom: var(--space-3, 1rem);
}

.slider-row .slider-label {
  font-size: var(--fs-sm, 0.875rem);
  font-weight: 700;
  color: var(--text-secondary, #475569);
  min-width: 3em;
  font-family: var(--font-mono, monospace);
}

.k-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color-strong, #cbd5e1);
  border-radius: var(--radius-full, 3px);
  outline: none;
  cursor: pointer;
}

.k-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-accent, #3b82f6);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-content, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.k-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.k-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-accent, #3b82f6);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-content, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  padding: 0.25em 0.8em;
  background: var(--color-accent-soft, #dbeafe);
  color: var(--color-accent-strong, #1e40af);
  border-radius: var(--radius-sm, 4px);
  font-family: var(--font-mono, monospace);
  font-size: var(--fs-sm, 0.875rem);
  font-weight: 600;
  min-width: 5em;
  text-align: center;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2, 0.5rem);
  justify-content: center;
}

.quick-buttons button {
  padding: 0.35em 1em;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-content, #fff);
  color: var(--text-secondary, #475569);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  font-size: var(--fs-xs, 0.75rem);
  font-family: var(--font-mono, monospace);
  transition: all 0.15s ease;
}

.quick-buttons button:hover {
  border-color: var(--color-accent, #3b82f6);
  color: var(--color-accent, #3b82f6);
  background: var(--color-accent-soft, #dbeafe);
}

.demo-output {
  margin-top: var(--space-3, 1rem);
  padding: var(--space-3, 1rem);
  background: var(--bg-code, #f8fafc);
  border-radius: var(--radius-md, 8px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-2, 0.5rem);
  font-family: var(--font-mono, monospace);
  font-size: var(--fs-sm, 0.875rem);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  padding: 0.35em 0.7em;
  background: var(--bg-content, #fff);
  border-radius: var(--radius-sm, 4px);
  border: 1px solid var(--border-color, #e2e8f0);
}

.output-row .label {
  color: var(--text-secondary, #475569);
  font-weight: 500;
  flex: 0 0 auto;
}

.output-row .value {
  color: var(--text-primary, #1f2937);
  font-weight: 600;
  text-align: right;
  flex: 1 1 auto;
  word-break: break-all;
}

.output-row.highlight {
  background: var(--bg-success-soft, #f0fdf4);
  border-color: var(--color-success, #10b981);
}

.output-row.highlight .label,
.output-row.highlight .value {
  color: var(--color-success, #059669);
}

.output-row.danger {
  background: var(--bg-danger-soft, #fef2f2);
  border-color: var(--color-danger, #ef4444);
}

.output-row.danger .label,
.output-row.danger .value {
  color: var(--color-danger, #dc2626);
}

.output-row.warning {
  background: var(--bg-warning-soft, #fffbeb);
  border-color: var(--color-warning, #f59e0b);
}

.output-row.warning .label,
.output-row.warning .value {
  color: var(--color-warning, #b45309);
}

.output-row.info {
  background: var(--bg-info-soft, #eff6ff);
  border-color: var(--color-info, #3b82f6);
}

.output-row.info .label,
.output-row.info .value {
  color: var(--color-info, #1e40af);
}

.formula-block {
  margin-top: var(--space-3, 1rem);
  padding: var(--space-3, 1rem) var(--space-4, 1.5rem);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(16, 185, 129, 0.06));
  border: 1px solid var(--border-color, #e2e8f0);
  border-left: 3px solid var(--color-accent, #3b82f6);
  border-radius: var(--radius-md, 8px);
  font-family: var(--font-mono, monospace);
}

.formula-title {
  margin: 0 0 var(--space-2, 0.5rem) 0;
  font-size: var(--fs-sm, 0.875rem);
  font-weight: 700;
  color: var(--color-accent-strong, #1e40af);
  text-align: center;
}

.formula-line {
  margin: 0.3em 0;
  font-size: var(--fs-sm, 0.875rem);
  color: var(--text-secondary, #475569);
  text-align: center;
  line-height: 1.7;
}

.formula-line .math {
  display: inline-block;
  padding: 0.1em 0.5em;
  background: var(--bg-code, #f1f5f9);
  border-radius: var(--radius-sm, 3px);
  color: var(--text-primary, #1f2937);
  font-weight: 500;
  margin-left: 0.3em;
}

.demo-tip {
  margin-top: var(--space-3, 1rem);
  font-size: var(--fs-sm, 0.875rem);
  color: var(--text-tertiary, #64748b);
  text-align: center;
  font-style: italic;
  line-height: 1.7;
  padding: 0 var(--space-2, 0.5rem);
}

.preset-buttons button:focus-visible,
.quick-buttons button:focus-visible,
.k-slider:focus-visible {
  outline: 2px solid var(--color-accent, #3b82f6);
  outline-offset: 3px;
  border-radius: var(--radius-sm, 4px);
}

@media (max-width: 760px) {
  .left-wrap,
  .right-wrap {
    flex: 1 1 100%;
  }
  .demo-canvas.dual {
    height: 380px;
  }
  .demo-output {
    grid-template-columns: 1fr;
  }
}
</style>
