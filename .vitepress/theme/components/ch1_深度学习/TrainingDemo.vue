<template>
  <div class="demo-container">
    <p class="demo-title">{{ props.title }}</p>
    <div class="demo-canvas" role="img" aria-label="感知机训练过程演示：决策直线随参数更新逐步移动">
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="plane" aria-hidden="true">
        <polygon v-if="halfPlane.length" :points="svgPoints(halfPlane)" class="half-plane" />
        <line v-for="g in gridLines" :key="`gx${g}`" :x1="sx(g)" :y1="sy(MIN)" :x2="sx(g)" :y2="sy(MAX)" class="grid" />
        <line v-for="g in gridLines" :key="`gy${g}`" :x1="sx(MIN)" :y1="sy(g)" :x2="sx(MAX)" :y2="sy(g)" class="grid" />
        <line :x1="sx(MIN)" :y1="sy(0)" :x2="sx(MAX)" :y2="sy(0)" class="axis" />
        <line :x1="sx(0)" :y1="sy(MIN)" :x2="sx(0)" :y2="sy(MAX)" class="axis" />
        <line v-if="linePoints.length === 2" :x1="sx(linePoints[0][0])" :y1="sy(linePoints[0][1])" :x2="sx(linePoints[1][0])" :y2="sy(linePoints[1][1])" class="boundary" />
        <g v-for="r in rows" :key="`${r.x1}-${r.x2}`">
          <circle :cx="sx(r.x1)" :cy="sy(r.x2)" r="7" :class="r.y === 1 ? 'point-positive' : 'point-negative'" />
          <circle v-if="r.isCurrent" :cx="sx(r.x1)" :cy="sy(r.x2)" r="12" class="current-ring" />
          <text :x="sx(r.x1) + 12" :y="sy(r.x2) - 12" class="point-label">
            ({{ r.x1 }},{{ r.x2 }}) y={{ r.y }}
          </text>
        </g>
      </svg>
    </div>
    <div class="demo-controls">
      <button type="button" class="control" :aria-label="playing ? '暂停训练演示' : '播放训练演示'" @click="toggle">
        {{ playing ? '暂停' : '播放' }}
      </button>
      <button type="button" class="control" aria-label="前进一步" :disabled="step >= trace.length" @click="next">单步</button>
      <button type="button" class="control" aria-label="重置训练演示" @click="reset">重置</button>
      <span class="demo-readout" role="status" aria-live="polite">第 {{ step }} / {{ trace.length }} 次更新</span>
    </div>
    <div class="demo-output">
      <div class="output-row">
        <span class="label">当前参数</span>
        <span class="value">({{ params.w[0] }}, {{ params.w[1] }}, {{ params.b }})</span>
      </div>
      <div class="output-row">
        <span class="label">正确分类</span>
        <span class="value">{{ accuracy }} / 4</span>
      </div>
      <div v-if="lastStep" class="output-row highlight">
        <span class="label">本次更新</span>
        <span class="value">x=({{ lastStep.x[0] }},{{ lastStep.x[1] }}) e={{ lastStep.error }}</span>
      </div>
    </div>
    <p class="demo-tip">
      每次只处理一个样本。预测正确时参数不变，预测错误时按误差方向修正。第 6 轮四个样本全部正确，训练结束。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

interface Vec2 {
  w: [number, number]
  b: number
}

interface Step {
  epoch: number
  x: [number, number]
  target: number
  before: Vec2
  after: Vec2
}

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '感知机训练过程演示'
  }
)

const trace: Step[] = [
  { epoch: 1, x: [0, 0], target: 0, before: { w: [0, 0], b: 0 }, after: { w: [0, 0], b: -1 } },
  { epoch: 1, x: [1, 1], target: 1, before: { w: [0, 0], b: -1 }, after: { w: [1, 1], b: 0 } },
  { epoch: 2, x: [0, 0], target: 0, before: { w: [1, 1], b: 0 }, after: { w: [1, 1], b: -1 } },
  { epoch: 2, x: [0, 1], target: 0, before: { w: [1, 1], b: -1 }, after: { w: [1, 0], b: -2 } },
  { epoch: 2, x: [1, 1], target: 1, before: { w: [1, 0], b: -2 }, after: { w: [2, 1], b: -1 } },
  { epoch: 3, x: [0, 1], target: 0, before: { w: [2, 1], b: -1 }, after: { w: [2, 0], b: -2 } },
  { epoch: 3, x: [1, 0], target: 0, before: { w: [2, 0], b: -2 }, after: { w: [1, 0], b: -3 } },
  { epoch: 3, x: [1, 1], target: 1, before: { w: [1, 0], b: -3 }, after: { w: [2, 1], b: -2 } },
  { epoch: 4, x: [1, 0], target: 0, before: { w: [2, 1], b: -2 }, after: { w: [1, 1], b: -3 } },
  { epoch: 4, x: [1, 1], target: 1, before: { w: [1, 1], b: -3 }, after: { w: [2, 2], b: -2 } },
  { epoch: 5, x: [0, 1], target: 0, before: { w: [2, 2], b: -2 }, after: { w: [2, 1], b: -3 } }
]

const SIZE = 420
const PAD = 44
const MIN = -0.3
const MAX = 1.3
const INNER = SIZE - 2 * PAD
const EPS = 1e-9

const step = ref(0)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const params = computed<Vec2>(() => {
  if (step.value === 0) return { w: [0, 0], b: 0 }
  return trace[step.value - 1].after
})

const lastStep = computed<Step | null>(() => (step.value === 0 ? null : trace[step.value - 1]))

interface Row {
  x1: number
  x2: number
  y: number
  z: number
  pred: number
  ok: boolean
  isCurrent: boolean
}

const rows = computed<Row[]>(() => {
  const labels = [0, 0, 0, 1]
  const inputs: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ]
  const current = lastStep.value?.x
  return inputs.map(([x1, x2], i) => {
    const y = labels[i]
    const z = params.value.w[0] * x1 + params.value.w[1] * x2 + params.value.b
    const pred = z >= 0 ? 1 : 0
    return {
      x1,
      x2,
      y,
      z,
      pred,
      ok: pred === y,
      isCurrent: current ? current[0] === x1 && current[1] === x2 : false
    }
  })
})

const accuracy = computed(() => rows.value.filter((r) => r.ok).length)

function sx(x: number): number {
  return PAD + ((x - MIN) / (MAX - MIN)) * INNER
}

function sy(y: number): number {
  return PAD + ((MAX - y) / (MAX - MIN)) * INNER
}

function svgPoints(points: Array<[number, number]>
): string {
  return points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')
}

const gridLines = [0, 0.5, 1]

const linePoints = computed<Array<[number, number]>>(() => {
  const w1 = params.value.w[0]
  const w2 = params.value.w[1]
  const b = params.value.b
  const pts: Array<[number, number]> = []
  if (Math.abs(w2) > EPS) {
    for (const x of [MIN, MAX]) {
      const y = (-b - w1 * x) / w2
      if (y >= MIN && y <= MAX) pts.push([x, y])
    }
  }
  if (Math.abs(w1) > EPS) {
    for (const y of [MIN, MAX]) {
      const x = (-b - w2 * y) / w1
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
  const w1 = params.value.w[0]
  const w2 = params.value.w[1]
  const b = params.value.b
  const norm = Math.hypot(w1, w2)
  if (norm < EPS) return []
  const nx = w1 / norm
  const ny = w2 / norm
  const dx = -ny
  const dy = nx
  const px = Math.abs(w2) > EPS ? 0 : -b / w1
  const py = Math.abs(w2) > EPS ? -b / w2 : 0
  const L = 4
  return [
    [px - L * dx, py - L * dy],
    [px + L * dx, py + L * dy],
    [px + L * dx + L * nx, py + L * dy + L * ny],
    [px - L * dx + L * nx, py - L * dy + L * ny]
  ]
})

function stop(): void {
  playing.value = false
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function next(): void {
  if (step.value >= trace.length) {
    stop()
    return
  }
  step.value += 1
  if (step.value >= trace.length + 1) stop()
}

function toggle(): void {
  if (playing.value) {
    stop()
    return
  }
  if (step.value >= trace.length) step.value = 0
  playing.value = true
  timer = setInterval(() => {
    if (step.value >= trace.length) {
      stop()
      return
    }
    step.value += 1
  }, 900)
}

function reset(): void {
  stop()
  step.value = 0
}

watch(step, (value) => {
  if (value >= trace.length) stop()
})

onBeforeUnmount(stop)
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

.current-ring {
  fill: none;
  stroke: var(--color-warning);
  stroke-width: 2;
}

.point-label {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--text-secondary);
}

.demo-controls {
  align-items: center;
  gap: var(--space-3);
}

.control {
  padding: 0.35em 1em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  cursor: pointer;
}

.control:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent-text);
}

.control:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.demo-output {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-code);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.demo-tip {
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
}
</style>
