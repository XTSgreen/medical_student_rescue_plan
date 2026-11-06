<template>
  <div class="demo-container">
    <p class="demo-title">{{ props.title }}</p>
    <div class="demo-canvas" role="img" aria-label="隐藏层映射演示：四个输入点在中间状态空间中合并为三种状态">
      <svg viewBox="0 0 440 300" class="plane" aria-hidden="true">
        <text x="40" y="26" class="panel-title">输入平面 (x₁, x₂)</text>
        <text x="270" y="26" class="panel-title">中间状态 (h₁, h₂)</text>

        <polygon :points="bandPoints" class="band" />
        <line :x1="lx(0)" :y1="ly(0)" :x2="lx(1)" :y2="ly(1)" class="band-edge" />
        <line :x1="lx(0)" :y1="ly(0.5)" :x2="lx(0.5)" :y2="ly(0)" class="band-edge" />
        <line :x1="lx(1)" :y1="ly(0.5)" :x2="lx(0.5)" :y2="ly(1)" class="band-edge" />

        <line :x1="lx(0)" :y1="ly(0)" :x2="lx(1)" :y2="ly(0)" class="axis" />
        <line :x1="lx(0)" :y1="ly(0)" :x2="lx(0)" :y2="ly(1)" class="axis" />

        <g v-for="(p, i) in points" :key="`map-${i}`">
          <path :d="curve(i)" class="mapping" :class="{ active: selected === i }" />
        </g>

        <g v-for="(p, i) in points" :key="`pt-${i}`">
          <circle :cx="lx(p.x1)" :cy="ly(p.x2)" r="6" :class="p.y === 1 ? 'point-positive' : 'point-negative'" />
          <circle v-if="selected === i" :cx="lx(p.x1)" :cy="ly(p.x2)" r="11" class="ring" />
          <text :x="lx(p.x1) + 10" :y="ly(p.x2) - 10" class="point-label">
            ({{ p.x1 }},{{ p.x2 }})
          </text>
        </g>

        <line :x1="rx(0)" :y1="ry(0)" :x2="rx(1)" :y2="ry(0)" class="axis" />
        <line :x1="rx(0)" :y1="ry(0)" :x2="rx(0)" :y2="ry(1)" class="axis" />
        <text :x="rx(0) - 18" :y="ry(0) + 4" class="axis-label">0</text>
        <text :x="rx(1) - 4" :y="ry(0) + 18" class="axis-label">h₁</text>
        <text :x="rx(0) - 18" :y="ry(1) - 4" class="axis-label">1</text>
        <text :x="rx(0) - 22" :y="ry(1) - 14" class="axis-label">h₂</text>

        <g v-for="(s, i) in states" :key="`st-${i}`">
          <circle :cx="rx(s.h1)" :cy="ry(s.h2)" r="7" class="state" :class="{ active: isActiveState(s) }" />
          <text :x="rx(s.h1) + 11" :y="ry(s.h2) - 11" class="point-label">({{ s.h1 }},{{ s.h2 }})</text>
        </g>
      </svg>
    </div>
    <div class="demo-controls">
      <span class="prompt">选择输入：</span>
      <button
        v-for="(p, i) in points"
        :key="`btn-${i}`"
        type="button"
        class="control"
        :class="{ active: selected === i }"
        :aria-pressed="selected === i"
        @click="selected = i"
      >
        ({{ p.x1 }}, {{ p.x2 }})
      </button>
    </div>
    <div class="demo-output">
      <div class="output-row">
        <span class="label">中间状态</span>
        <span class="value">({{ current.h1 }}, {{ current.h2 }})</span>
      </div>
      <div class="output-row">
        <span class="label">输出分数</span>
        <span class="value">{{ current.score.toFixed(2) }}</span>
      </div>
      <div class="output-row highlight">
        <span class="label">输出 ŷ</span>
        <span class="value">{{ current.output }}</span>
      </div>
      <div class="output-row">
        <span class="label">异或标签 y</span>
        <span class="value">{{ current.y }}</span>
      </div>
    </div>
    <p class="demo-tip">
      两个隐藏单元使用同一个和 x₁+x₂ 与两个不同的门槛。两个正类样本在中间状态中合并为同一点 (1,0)，输出单元只需一条直线即可分开三种状态。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '隐藏层与中间状态演示'
  }
)

interface Point {
  x1: number
  x2: number
  y: number
}

const points: Point[] = [
  { x1: 0, x2: 0, y: 0 },
  { x1: 0, x2: 1, y: 1 },
  { x1: 1, x2: 0, y: 1 },
  { x1: 1, x2: 1, y: 0 }
]

const selected = ref(1)

interface State {
  h1: number
  h2: number
}

const states: State[] = [
  { h1: 0, h2: 0 },
  { h1: 1, h2: 0 },
  { h1: 1, h2: 1 }
]

function hidden(p: Point): State {
  const s = p.x1 + p.x2
  return { h1: s >= 0.5 ? 1 : 0, h2: s >= 1.5 ? 1 : 0 }
}

function score(h: State): number {
  return h.h1 - 2 * h.h2 - 0.5
}

const current = computed(() => {
  const p = points[selected.value]
  const h = hidden(p)
  const z = score(h)
  return { ...h, score: z, output: z >= 0 ? 1 : 0, y: p.y }
})

function isActiveState(s: State): boolean {
  return s.h1 === current.value.h1 && s.h2 === current.value.h2
}

const LEFT_X0 = 40
const LEFT_Y0 = 230
const LEFT_SPAN = 160
const RIGHT_X0 = 310
const RIGHT_Y0 = 220
const RIGHT_SPAN = 90

function lx(x: number): number {
  return LEFT_X0 + x * LEFT_SPAN
}

function ly(y: number): number {
  return LEFT_Y0 - y * LEFT_SPAN
}

function rx(h1: number): number {
  return RIGHT_X0 + h1 * RIGHT_SPAN
}

function ry(h2: number): number {
  return RIGHT_Y0 - h2 * RIGHT_SPAN
}

const bandPoints = computed(() =>
  [
    [0, 0.5],
    [0.5, 0],
    [1, 0.5],
    [0.5, 1]
  ]
    .map(([x, y]) => `${lx(x)},${ly(y)}`)
    .join(' ')
)

function curve(i: number): string {
  const p = points[i]
  const h = hidden(p)
  const x1 = lx(p.x1)
  const y1 = ly(p.x2)
  const x2 = rx(h.h1)
  const y2 = ry(h.h2)
  const cx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
}
</script>

<style scoped>
.plane {
  width: 100%;
  height: 100%;
  display: block;
}

.panel-title {
  font-family: var(--font-sans);
  font-size: 12px;
  fill: var(--text-tertiary);
}

.band {
  fill: var(--color-accent);
  opacity: 0.14;
}

.band-edge {
  stroke: var(--color-accent-strong);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  opacity: 0.7;
}

.axis {
  stroke: var(--text-muted);
  stroke-width: 1.2;
  opacity: 0.6;
}

.axis-label {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--text-tertiary);
}

.mapping {
  fill: none;
  stroke: var(--border-color-strong);
  stroke-width: 1.4;
  stroke-dasharray: 5 4;
  opacity: 0.55;
}

.mapping.active {
  stroke: var(--color-warning);
  stroke-width: 2.2;
  opacity: 1;
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

.state {
  fill: var(--text-muted);
  opacity: 0.55;
}

.state.active {
  fill: var(--color-warning);
  opacity: 1;
}

.ring {
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
  gap: var(--space-2);
}

.prompt {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.control {
  padding: 0.3em 0.9em;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-content);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.control:hover {
  border-color: var(--color-accent);
}

.control.active {
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
