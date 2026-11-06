<template>
  <div class="demo-container">
    <p class="demo-title">{{ props.title }}</p>
    <div class="demo-canvas" role="img" aria-label="平面分类演示：四个样本点、决策直线与正类区域">
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="plane" aria-hidden="true">
        <polygon v-if="halfPlane.length" :points="svgPoints(halfPlane)" class="half-plane" />
        <line v-for="g in gridLines" :key="`gx${g}`" :x1="sx(g)" :y1="sy(MIN)" :x2="sx(g)" :y2="sy(MAX)" class="grid" />
        <line v-for="g in gridLines" :key="`gy${g}`" :x1="sx(MIN)" :y1="sy(g)" :x2="sx(MAX)" :y2="sy(g)" class="grid" />
        <line :x1="sx(MIN)" :y1="sy(0)" :x2="sx(MAX)" :y2="sy(0)" class="axis" />
        <line :x1="sx(0)" :y1="sy(MIN)" :x2="sx(0)" :y2="sy(MAX)" class="axis" />
        <g v-if="mode === 'xor' && showMidpoint">
          <line :x1="sx(0)" :y1="sy(1)" :x2="sx(1)" :y2="sy(0)" class="diagonal" />
          <line :x1="sx(0)" :y1="sy(0)" :x2="sx(1)" :y2="sy(1)" class="diagonal" />
          <circle :cx="sx(0.5)" :cy="sy(0.5)" r="5" class="midpoint" />
          <text :x="sx(0.5) + 9" :y="sy(0.5) - 9" class="midpoint-label">M</text>
        </g>
        <line v-if="linePoints.length === 2" :x1="sx(linePoints[0][0])" :y1="sy(linePoints[0][1])" :x2="sx(linePoints[1][0])" :y2="sy(linePoints[1][1])" class="boundary" />
        <g v-for="r in rows" :key="`${r.x1}-${r.x2}`">
          <circle :cx="sx(r.x1)" :cy="sy(r.x2)" r="7" :class="r.y === 1 ? 'point-positive' : 'point-negative'" />
          <text :x="sx(r.x1) + 11" :y="sy(r.x2) - 11" class="point-label">
            ({{ r.x1 }},{{ r.x2 }}) y={{ r.y }}
          </text>
        </g>
      </svg>
    </div>
    <div class="demo-controls">
      <div class="mode-group" role="group" aria-label="选择分类规则">
        <button type="button" :class="{ active: mode === 'and' }" :aria-pressed="mode === 'and'" @click="mode = 'and'">与运算</button>
        <button type="button" :class="{ active: mode === 'xor' }" :aria-pressed="mode === 'xor'" @click="mode = 'xor'">异或运算</button>
      </div>
      <label>
        权重 w₁
        <input v-model.number="w1" type="range" min="-2" max="2" step="0.1" aria-label="权重 w1" />
        <span class="demo-readout">{{ w1.toFixed(1) }}</span>
      </label>
      <label>
        权重 w₂
        <input v-model.number="w2" type="range" min="-2" max="2" step="0.1" aria-label="权重 w2" />
        <span class="demo-readout">{{ w2.toFixed(1) }}</span>
      </label>
      <label>
        偏置 b
        <input v-model.number="b" type="range" min="-3" max="1" step="0.1" aria-label="偏置 b" />
        <span class="demo-readout">{{ b.toFixed(1) }}</span>
      </label>
      <label v-if="mode === 'xor'" class="checkbox">
        <input v-model="showMidpoint" type="checkbox" />
        显示两条对角线及其共同中点
      </label>
    </div>
    <div class="demo-output">
      <div class="output-row highlight">
        <span class="label">z</span>
        <span class="value">{{ w1.toFixed(1) }}·x₁ {{ w2 >= 0 ? '+' : '−' }} {{ Math.abs(w2).toFixed(1) }}·x₂ {{ b >= 0 ? '+' : '−' }} {{ Math.abs(b).toFixed(1) }}</span>
      </div>
      <div class="output-row">
        <span class="label">正确分类</span>
        <span class="value">{{ accuracy }} / 4</span>
      </div>
    </div>
    <div class="score-table">
      <div class="score-head">
        <span>输入</span><span>分数 z</span><span>预测</span><span>标签</span>
      </div>
      <div v-for="r in rows" :key="`row-${r.x1}-${r.x2}`" class="score-row" :class="{ wrong: !r.ok }">
        <span>({{ r.x1 }}, {{ r.x2 }})</span>
        <span>{{ r.z.toFixed(2) }}</span>
        <span>{{ r.pred }}</span>
        <span>{{ r.y }}</span>
      </div>
    </div>
    <p class="demo-tip">
      改变偏置时直线平行移动，改变权重时直线绕某点旋转。异或运算下无论怎样调整，正确分类数都无法达到 4。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type Dataset = 'and' | 'xor'

const props = withDefaults(
  defineProps<{
    title?: string
    dataset?: Dataset
  }>(),
  {
    title: '决策边界的几何演示',
    dataset: 'and'
  }
)

const SIZE = 420
const PAD = 44
const MIN = -0.3
const MAX = 1.3
const INNER = SIZE - 2 * PAD
const EPS = 1e-9

const mode = ref<Dataset>(props.dataset)
const w1 = ref(1)
const w2 = ref(1)
const b = ref(-1.5)
const showMidpoint = ref(false)

interface Sample {
  x1: number
  x2: number
  y: number
}

interface Row extends Sample {
  z: number
  pred: number
  ok: boolean
}

const rows = computed<Row[]>(() => {
  const labels = mode.value === 'and' ? [0, 0, 0, 1] : [0, 1, 1, 0]
  const inputs: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ]
  return inputs.map(([x1, x2], i) => {
    const y = labels[i]
    const z = w1.value * x1 + w2.value * x2 + b.value
    const pred = z >= 0 ? 1 : 0
    return { x1, x2, y, z, pred, ok: pred === y }
  })
})

const accuracy = computed(() => rows.value.filter((r) => r.ok).length)

function sx(x: number): number {
  return PAD + ((x - MIN) / (MAX - MIN)) * INNER
}

function sy(y: number): number {
  return PAD + ((MAX - y) / (MAX - MIN)) * INNER
}

function svgPoints(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')
}

const gridLines = [0, 0.5, 1]

const linePoints = computed<Array<[number, number]>>(() => {
  const pts: Array<[number, number]> = []
  if (Math.abs(w2.value) > EPS) {
    for (const x of [MIN, MAX]) {
      const y = (-b.value - w1.value * x) / w2.value
      if (y >= MIN && y <= MAX) pts.push([x, y])
    }
  }
  if (Math.abs(w1.value) > EPS) {
    for (const y of [MIN, MAX]) {
      const x = (-b.value - w2.value * y) / w1.value
      if (x >= MIN && x <= MAX) pts.push([x, y])
    }
  }
  const unique: Array<[number, number]> = []
  for (const p of pts) {
    if (!unique.some((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6)) {
      unique.push(p)
    }
  }
  return unique.slice(0, 2)
})

const halfPlane = computed<Array<[number, number]>>(() => {
  const norm = Math.hypot(w1.value, w2.value)
  if (norm < EPS) return []
  const nx = w1.value / norm
  const ny = w2.value / norm
  const dx = -ny
  const dy = nx
  const px = Math.abs(w2.value) > EPS ? 0 : -b.value / w1.value
  const py = Math.abs(w2.value) > EPS ? -b.value / w2.value : 0
  const L = 4
  return [
    [px - L * dx, py - L * dy],
    [px + L * dx, py + L * dy],
    [px + L * dx + L * nx, py + L * dy + L * ny],
    [px - L * dx + L * nx, py - L * dy + L * ny]
  ]
})

watch(mode, (value) => {
  if (value === 'and') {
    w1.value = 1
    w2.value = 1
    b.value = -1.5
    showMidpoint.value = false
  } else {
    w1.value = 1
    w2.value = 1
    b.value = -0.5
  }
})
</script>

<style scoped>
.plane {
  width: 100%;
  height: 100%;
  display: block;
}

.grid {
  stroke: var(--border-color);
  stroke-width: 1;
}

.axis {
  stroke: var(--text-muted);
  stroke-width: 1.2;
  opacity: 0.6;
}

.half-plane {
  fill: var(--color-accent);
  opacity: 0.12;
}

.boundary {
  stroke: var(--color-accent-strong);
  stroke-width: 2.5;
}

.point-positive {
  fill: var(--color-accent);
  stroke: var(--text-primary);
  stroke-width: 1;
}

.point-negative {
  fill: var(--color-danger);
  stroke: var(--text-primary);
  stroke-width: 1;
}

.point-label {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--text-secondary);
}

.diagonal {
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 6 4;
  opacity: 0.7;
}

.midpoint {
  fill: var(--color-warning);
  stroke: var(--text-primary);
  stroke-width: 1;
}

.midpoint-label {
  font-family: var(--font-mono);
  font-size: 12px;
  fill: var(--color-warning);
  font-weight: 600;
}

.demo-controls {
  align-items: center;
}

.mode-group {
  display: flex;
  gap: var(--space-2);
  flex-basis: 100%;
}

.mode-group button {
  padding: 0.35em 1em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-group button:hover {
  border-color: var(--color-accent);
}

.mode-group button.active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
  font-weight: 600;
}

.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

.score-table {
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}

.score-head,
.score-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 0.3em 0.6em;
}

.score-head {
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.score-row {
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.score-row.wrong {
  background: var(--bg-danger-soft);
  color: var(--color-danger);
  font-weight: 600;
}

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}
</style>
