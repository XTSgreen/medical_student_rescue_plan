<template>
  <div class="demo-container">
    <p class="demo-title">{{ title }}</p>

    <div class="preset-buttons">
      <button
        v-for="p in presetList"
        :key="p.key"
        :class="{ active: preset === p.key }"
        @click="setPreset(p.key)"
      >{{ p.label }}</button>
    </div>

    <div class="dual-pane">

      <div class="left-pane">
        <div ref="canvasContainer" class="demo-canvas"></div>
        <div v-if="initStatus" class="demo-status" :class="initStatusType">{{ initStatus }}</div>

        <div class="phase-label" :class="phaseColorClass">
          <span class="phase-name">{{ phaseName }}</span>
          <span class="phase-desc">{{ phaseDescription }}</span>
        </div>

        <div class="timeline">
          <div class="timeline-track">
            <div class="timeline-progress" :class="phaseColorClass" :style="{ width: timelinePercent + '%' }"></div>
          </div>
          <div class="phase-labels">
            <span :class="{ active: mode === 'idle' }">待机</span>
            <span :class="{ active: mode === 'forward' }">前向 ▶</span>
            <span :class="{ active: mode === 'backward' }">◀ 反向</span>
            <span :class="{ active: mode === 'done' }">完成</span>
          </div>
        </div>

        <div class="anim-buttons">
          <button class="play-btn" @click="runForward" :disabled="mode === 'forward' || mode === 'backward'">
            ▶ 开始前向
          </button>
          <button class="backward-btn" @click="runBackward" :disabled="mode === 'idle' || mode === 'forward' || mode === 'backward'">
            ◀ 计算梯度
          </button>
          <button @click="stepForward" :disabled="mode === 'forward' || mode === 'backward'">
            ⏭ 单步执行
          </button>
          <button @click="reset" :disabled="mode === 'idle' && phase === 0">
            ↺ 重置
          </button>
        </div>

        <div class="color-legend">
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#06b6d4"></span>
            <span>输入节点</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#10b981"></span>
            <span>隐藏节点（按激活值亮度）</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#a855f7"></span>
            <span>输出节点</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ef4444"></span>
            <span>损失节点</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#3b82f6"></span>
            <span>正权重连线</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ef4444;opacity:0.6"></span>
            <span>负权重连线</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#10b981;border-radius:50%"></span>
            <span>前向光球</span>
          </span>
          <span class="legend-item">
            <span class="legend-swatch solid" style="background:#ef4444;border-radius:50%"></span>
            <span>反向梯度光球</span>
          </span>
        </div>
      </div>

      <div class="right-pane">

        <div class="input-controls">
          <p class="block-title">输入数据 & 目标</p>
          <label class="slider-row">
            <span class="slider-label">x₁</span>
            <input type="range" min="-2" max="2" step="0.1" :value="x1"
              @input="onInput('x1', parseFloat(($event.target as HTMLInputElement).value))" />
            <span class="slider-val">{{ x1.toFixed(2) }}</span>
          </label>
          <label class="slider-row">
            <span class="slider-label">x₂</span>
            <input type="range" min="-2" max="2" step="0.1" :value="x2"
              @input="onInput('x2', parseFloat(($event.target as HTMLInputElement).value))" />
            <span class="slider-val">{{ x2.toFixed(2) }}</span>
          </label>
          <label class="slider-row">
            <span class="slider-label">t</span>
            <input type="range" min="0" max="1" step="0.05" :value="target"
              @input="onInput('target', parseFloat(($event.target as HTMLInputElement).value))" />
            <span class="slider-val">{{ target.toFixed(2) }}</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" :checked="clipGradient" @change="onClipToggle(($event.target as HTMLInputElement).checked)" />
            <span>梯度裁剪（‖∇L‖ &gt; 1 时缩放至 1）</span>
          </label>
        </div>

        <div class="forward-panel">
          <p class="block-title">前向传播输出</p>
          <div class="data-row">
            <span class="data-label">输入 x</span>
            <span class="data-val">({{ x1.toFixed(3) }}, {{ x2.toFixed(3) }})</span>
          </div>
          <div class="data-row" v-for="(zv, i) in z1Vals" :key="'z'+i">
            <span class="data-label">z{{ sub(i + 1) }} = w·x + b</span>
            <span class="data-val" :class="{ zero: Math.abs(zv) < 1e-6 }">{{ zv.toFixed(4) }}</span>
          </div>
          <div class="data-row" v-for="(hv, i) in hVals" :key="'h'+i">
            <span class="data-label">h{{ sub(i + 1) }} = ReLU(z{{ sub(i + 1) }})</span>
            <span class="data-val" :class="{ zero: Math.abs(hv) < 1e-6 }">{{ hv.toFixed(4) }}</span>
          </div>
          <div class="data-row">
            <span class="data-label">s = Σw·h + b₂</span>
            <span class="data-val">{{ sVal.toFixed(4) }}</span>
          </div>
          <div class="data-row highlight">
            <span class="data-label">y = σ(s)</span>
            <span class="data-val">{{ yVal.toFixed(4) }}</span>
          </div>
          <div class="data-row" :class="{ danger: lossVal > 0.25 }">
            <span class="data-label">L = (y - t)²</span>
            <span class="data-val">{{ lossVal.toFixed(4) }}</span>
          </div>
        </div>

        <div class="backward-panel">
          <p class="block-title">反向传播梯度</p>
          <div class="data-row">
            <span class="data-label">∂L/∂y = 2(y-t)</span>
            <span class="data-val">{{ dLdy.toFixed(4) }}</span>
          </div>
          <div class="data-row">
            <span class="data-label">σ'(s) = y(1-y)</span>
            <span class="data-val" :class="{ zero: Math.abs(dyds) < 1e-4 }">{{ dyds.toFixed(4) }}</span>
          </div>
          <div class="data-row highlight">
            <span class="data-label">∂L/∂s</span>
            <span class="data-val" :class="{ danger: Math.abs(dLds) > 5 }">{{ dLds.toFixed(4) }}</span>
          </div>
          <div class="data-row" v-for="(gv, i) in dLdw2" :key="'gw2'+i">
            <span class="data-label">∂L/∂w{{ sub(i + 1) }} (h→y)</span>
            <span class="data-val" :class="{ danger: Math.abs(gv) > 5, zero: Math.abs(gv) < 1e-6 }">
              {{ gv.toFixed(4) }}
            </span>
          </div>
          <div class="data-row" v-for="(gv, i) in dLdw1Flat" :key="'gw1'+i">
            <span class="data-label">∂L/∂w{{ subScript2D(i) }} (x→h)</span>
            <span class="data-val" :class="{ danger: Math.abs(gv) > 5, zero: Math.abs(gv) < 1e-6 }">
              {{ gv.toFixed(4) }}
            </span>
          </div>
          <div class="data-row" :class="{ danger: isExploding, ok: isVanishing === false && !isExploding }">
            <span class="data-label">‖∇L‖</span>
            <span class="data-val">{{ gradNorm.toFixed(4) }}</span>
          </div>
          <div v-if="clipGradient" class="data-row ok">
            <span class="data-label">裁剪后 ‖∇L‖</span>
            <span class="data-val">{{ clippedNorm.toFixed(4) }}</span>
          </div>
          <div v-if="isExploding" class="warn-banner">⚠ 梯度爆炸：‖∇L‖ &gt; 10，连线闪烁红色</div>
          <div v-if="isVanishing" class="warn-banner vanish">⚠ 梯度消失：‖∇L‖ &lt; 1e-3，连线变细</div>
        </div>

        <div class="chain-rule">
          <p class="block-title">链式法则分解（选中权重）</p>
          <div class="weight-selector">
            <button
              v-for="w in selectableWeights"
              :key="w.key"
              :class="{ active: selectedWeight === w.key }"
              @click="selectedWeight = w.key"
            >{{ w.label }}</button>
          </div>
          <div class="chain-breakdown" v-html="chainBreakdown"></div>
        </div>
      </div>
    </div>

    <div class="formula-block">
      <p class="formula-title">📐 神经网络计算图与链式法则</p>
      <p class="formula-line">前向：<span class="math">h = ReLU(W₁x + b₁)</span>，<span class="math">y = σ(W₂h + b₂)</span></p>
      <p class="formula-line">损失：<span class="math">L = (y - t)²</span></p>
      <p class="formula-line">链式法则：<span class="math">∂L/∂W₁ = ∂L/∂y · ∂y/∂h · ∂h/∂W₁</span></p>
      <p class="formula-line">ReLU 雅可比：<span class="math">∂ReLU(z)/∂z = 1 (z&gt;0) / 0 (z≤0)</span></p>
      <p class="formula-line">Sigmoid 梯度：<span class="math">σ'(z) = σ(z)·(1 - σ(z))</span>（z 极大/小时趋于 0，梯度消失）</p>
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
    title: '反向传播计算图 · 2-3-1 全连接神经网络'
  }
)

const COLOR_INPUT = 0x06b6d4
const COLOR_HIDDEN_LOW = 0x1f2937
const COLOR_HIDDEN_HIGH = 0x10b981
const COLOR_OUTPUT = 0xa855f7
const COLOR_LOSS = 0xef4444
const COLOR_FORWARD_BALL = 0x10b981
const COLOR_BACKWARD_BALL = 0xef4444
const COLOR_POS_WEIGHT = 0x3b82f6
const COLOR_NEG_WEIGHT = 0xef4444
const COLOR_EXPLODE = 0xdc2626
const COLOR_BG = 0xf8fafc
const COLOR_GRID = 0xe5e7eb

interface NodeSpec {
  key: string
  label: string
  pos: THREE.Vector3
  kind: 'input' | 'hidden' | 'output' | 'loss'
}

const nodeSpecs: NodeSpec[] = [
  { key: 'x1', label: 'x₁', pos: new THREE.Vector3(-3, 0.7, 0), kind: 'input' },
  { key: 'x2', label: 'x₂', pos: new THREE.Vector3(-3, -0.7, 0), kind: 'input' },
  { key: 'h1', label: 'h₁', pos: new THREE.Vector3(0, 1.2, 0), kind: 'hidden' },
  { key: 'h2', label: 'h₂', pos: new THREE.Vector3(0, 0, 0), kind: 'hidden' },
  { key: 'h3', label: 'h₃', pos: new THREE.Vector3(0, -1.2, 0), kind: 'hidden' },
  { key: 'y', label: 'y', pos: new THREE.Vector3(3, 0, 0), kind: 'output' },
  { key: 'L', label: 'L', pos: new THREE.Vector3(5, 0, 0), kind: 'loss' }
]

const w1 = ref<number[][]>([
  [0.5, -0.3],
  [0.8, 0.6],
  [-0.4, 0.7]
])
const w2 = ref<number[]>([0.9, -0.5, 0.3])
const b1 = ref<number[]>([0.1, -0.2, 0.0])
const b2 = ref<number>(0.0)

const x1 = ref(0.6)
const x2 = ref(-0.4)
const target = ref(0.8)
const clipGradient = ref(false)

const z1Vals = computed<number[]>(() =>
  w1.value.map((row, i) => row[0] * x1.value + row[1] * x2.value + b1.value[i])
)

const hVals = computed<number[]>(() => z1Vals.value.map(z => Math.max(0, z)))

const sVal = computed<number>(() =>
  w2.value[0] * hVals.value[0] + w2.value[1] * hVals.value[1] + w2.value[2] * hVals.value[2] + b2.value
)

const yVal = computed<number>(() => {
  const s = sVal.value
  if (s >= 0) return 1 / (1 + Math.exp(-s))
  const e = Math.exp(s)
  return e / (1 + e)
})

const lossVal = computed<number>(() => {
  const diff = yVal.value - target.value
  return diff * diff
})

const dLdy = computed<number>(() => 2 * (yVal.value - target.value))
const dyds = computed<number>(() => yVal.value * (1 - yVal.value))
const dLds = computed<number>(() => dLdy.value * dyds.value)

const dLdw2Raw = computed<number[]>(() => hVals.value.map(hi => dLds.value * hi))
const dLdh = computed<number[]>(() => w2.value.map(w2i => dLds.value * w2i))

const dLdz = computed<number[]>(() =>
  z1Vals.value.map((z, i) => (z > 0 ? dLdh.value[i] : 0))
)

const dLdw1Raw = computed<number[][]>(() =>
  dLdz.value.map(dzi => [dzi * x1.value, dzi * x2.value])
)

const gradNorm = computed<number>(() => {
  let sum = 0
  dLdw2Raw.value.forEach(g => (sum += g * g))
  dLdw1Raw.value.forEach(row => row.forEach(g => (sum += g * g)))
  return Math.sqrt(sum)
})
const isExploding = computed(() => gradNorm.value > 10)
const isVanishing = computed(() => gradNorm.value > 0 && gradNorm.value < 1e-3)

const clippedNorm = computed(() =>
  !clipGradient.value ? gradNorm.value : (gradNorm.value > 1 ? 1 : gradNorm.value)
)
const clipScale = computed(() =>
  (!clipGradient.value || gradNorm.value <= 1) ? 1 : 1 / gradNorm.value
)

const dLdw2 = computed<number[]>(() =>
  dLdw2Raw.value.map(g => g * clipScale.value)
)
const dLdw1 = computed<number[][]>(() =>
  dLdw1Raw.value.map(row => row.map(g => g * clipScale.value))
)

const dLdw1Flat = computed<number[]>(() => {
  const flat: number[] = []
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      flat.push(dLdw1.value[i][j])
    }
  }
  return flat
})

type PresetKey = 'xavier' | 'large' | 'small' | 'zero'
const preset = ref<PresetKey>('xavier')

const presetList: { key: PresetKey; label: string }[] = [
  { key: 'xavier', label: '正常初始化（Xavier）' },
  { key: 'large', label: '大权重（梯度爆炸）' },
  { key: 'small', label: '小权重（梯度消失）' },
  { key: 'zero', label: '零权重（无信号）' }
]

function randn(std: number): number {
  const u1 = Math.max(1e-10, Math.random())
  const u2 = Math.random()
  return std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function setPreset(p: PresetKey) {
  preset.value = p
  switch (p) {
    case 'xavier': {

      const std1 = 1 / Math.sqrt(2)
      const std2 = 1 / Math.sqrt(3)
      w1.value = [
        [randn(std1), randn(std1)],
        [randn(std1), randn(std1)],
        [randn(std1), randn(std1)]
      ]
      w2.value = [randn(std2), randn(std2), randn(std2)]
      b1.value = [0, 0, 0]
      b2.value = 0
      break
    }
    case 'large': {

      w1.value = [
        [randn(3), randn(3)],
        [randn(3), randn(3)],
        [randn(3), randn(3)]
      ]
      w2.value = [randn(3), randn(3), randn(3)]
      b1.value = [0, 0, 0]
      b2.value = 0
      break
    }
    case 'small': {

      w1.value = [
        [randn(0.01), randn(0.01)],
        [randn(0.01), randn(0.01)],
        [randn(0.01), randn(0.01)]
      ]
      w2.value = [randn(0.01), randn(0.01), randn(0.01)]
      b1.value = [0, 0, 0]
      b2.value = 0
      break
    }
    case 'zero': {

      w1.value = [[0, 0], [0, 0], [0, 0]]
      w2.value = [0, 0, 0]
      b1.value = [0, 0, 0]
      b2.value = 0
      break
    }
  }
  reset()
}

function onInput(field: 'x1' | 'x2' | 'target', value: number) {
  if (field === 'x1') x1.value = value
  else if (field === 'x2') x2.value = value
  else if (field === 'target') target.value = value
}

function onClipToggle(checked: boolean) {
  clipGradient.value = checked
}

function sub(n: number): string {
  const subs = ['₁', '₂', '₃', '₄', '₅', '₆']
  return subs[n - 1] || String(n)
}

function subScript2D(flatIdx: number): string {

  const i = Math.floor(flatIdx / 2) + 1
  const j = (flatIdx % 2) + 1
  return sub(i) + sub(j)
}

type WeightKey =
  | 'w11' | 'w12' | 'w21' | 'w22' | 'w31' | 'w32'
  | 'W1' | 'W2' | 'W3'

const selectedWeight = ref<WeightKey>('W1')

const selectableWeights: { key: WeightKey; label: string }[] = [
  { key: 'W1', label: 'w₁ (h₁→y)' },
  { key: 'W2', label: 'w₂ (h₂→y)' },
  { key: 'W3', label: 'w₃ (h₃→y)' },
  { key: 'w11', label: 'w₁₁ (x₁→h₁)' },
  { key: 'w12', label: 'w₁₂ (x₂→h₁)' },
  { key: 'w21', label: 'w₂₁ (x₁→h₂)' },
  { key: 'w22', label: 'w₂₂ (x₂→h₂)' },
  { key: 'w31', label: 'w₃₁ (x₁→h₃)' },
  { key: 'w32', label: 'w₃₂ (x₂→h₃)' }
]

const chainBreakdown = computed<string>(() => {
  const fmt = (n: number) => n.toFixed(4)
  const dLdyv = dLdy.value
  const dydsv = dyds.value

  if (selectedWeight.value.startsWith('W')) {

    const idx = parseInt(selectedWeight.value.substring(1)) - 1
    const hv = hVals.value[idx]
    const grad = dLdw2.value[idx]
    return `
      <div class="chain-step"><span class="chain-eq">∂L/∂w${sub(idx + 1)} = ∂L/∂y · ∂y/∂s · ∂s/∂w${sub(idx + 1)}</span></div>
      <div class="chain-step"><span class="chain-eq">= ${fmt(dLdyv)} · ${fmt(dydsv)} · h${sub(idx + 1)}</span></div>
      <div class="chain-step"><span class="chain-eq">= ${fmt(dLdyv)} · ${fmt(dydsv)} · ${fmt(hv)}</span></div>
      <div class="chain-step result"><span class="chain-eq">= <strong>${fmt(grad)}</strong></span></div>
      <div class="chain-note">∂s/∂w${sub(idx + 1)} = h${sub(idx + 1)}（线性求和项对权重的偏导）</div>
    `
  } else {

    const flatIdx = selectableWeights.findIndex(w => w.key === selectedWeight.value) - 3
    const i = Math.floor(flatIdx / 2)
    const j = flatIdx % 2
    const xv = j === 0 ? x1.value : x2.value
    const zv = z1Vals.value[i]
    const reluGrad = zv > 0 ? 1 : 0
    const grad = dLdw1.value[i][j]
    return `
      <div class="chain-step"><span class="chain-eq">∂L/∂w${sub(i + 1) + sub(j + 1)} = ∂L/∂y · ∂y/∂s · ∂s/∂h${sub(i + 1)} · ∂h${sub(i + 1)}/∂z${sub(i + 1)} · ∂z${sub(i + 1)}/∂w${sub(i + 1) + sub(j + 1)}</span></div>
      <div class="chain-step"><span class="chain-eq">= ${fmt(dLdyv)} · ${fmt(dydsv)} · w${sub(i + 1)} · ReLU'(${fmt(zv)}) · x${sub(j + 1)}</span></div>
      <div class="chain-step"><span class="chain-eq">= ${fmt(dLdyv)} · ${fmt(dydsv)} · ${fmt(w2.value[i])} · ${reluGrad} · ${fmt(xv)}</span></div>
      <div class="chain-step result"><span class="chain-eq">= <strong>${fmt(grad)}</strong></span></div>
      <div class="chain-note">
        ∂s/∂h${sub(i + 1)} = w${sub(i + 1)}（输出层线性项）<br/>
        ∂h${sub(i + 1)}/∂z${sub(i + 1)} = ReLU'(z${sub(i + 1)}) = ${reluGrad}（z=${fmt(zv)} ${zv > 0 ? '&gt; 0' : '≤ 0'}）<br/>
        ∂z${sub(i + 1)}/∂w${sub(i + 1) + sub(j + 1)} = x${sub(j + 1)}（输入项）
      </div>
    `
  }
})

type Mode = 'idle' | 'forward' | 'backward' | 'done'
const mode = ref<Mode>('idle')
const phase = ref(0)
const timelinePercent = ref(0)
let phaseStartTime = 0
let lastFrameTime = 0

const phaseName = computed(() => {
  if (mode.value === 'idle') return '待机'
  if (mode.value === 'done') return '完成'
  if (mode.value === 'forward') {
    return `前向 Phase ${phase.value}/5`
  }
  if (mode.value === 'backward') {
    return `反向 Phase ${phase.value}/6`
  }
  return ''
})

const phaseDescription = computed(() => {
  if (mode.value === 'idle') return '点击"开始前向"启动数据流；或调整输入/权重观察网络行为'
  if (mode.value === 'done') return '一次完整前向+反向已完成，可重置后再次运行'
  if (mode.value === 'forward') {
    switch (phase.value) {
      case 1: return '数据光球从输入层流向隐藏层（速度 = |w|）'
      case 2: return '隐藏层计算 ReLU(z)，激活值显示'
      case 3: return '光球从隐藏层流向输出层'
      case 4: return '输出层计算 σ(s)，得到 y'
      case 5: return '计算损失 L = (y - t)²'
      default: return ''
    }
  }
  if (mode.value === 'backward') {
    switch (phase.value) {
      case 1: return '梯度信号从损失节点反向出发'
      case 2: return '反向到达输出层，计算 ∂L/∂s'
      case 3: return '计算 ∂L/∂w（h→y），连线粗细更新为 |梯度|'
      case 4: return '梯度反向到隐藏层，乘以 ReLU 雅可比'
      case 5: return '梯度反向到输入层'
      case 6: return '计算 ∂L/∂w（x→h），连线粗细更新'
      default: return ''
    }
  }
  return ''
})

const phaseColorClass = computed(() => {
  if (mode.value === 'idle') return 'phase-idle'
  if (mode.value === 'done') return 'phase-done'
  if (mode.value === 'forward') return 'phase-forward'
  if (mode.value === 'backward') return 'phase-backward'
  return ''
})

const tipText = computed(() => {
  if (mode.value === 'idle') {
    return '点击"开始前向"观察数据（绿球）如何沿权重连线流向输出层；点击"计算梯度"观察梯度信号（红球）如何反向传播，连线粗细实时反映 |∂L/∂w|。'
  }
  if (mode.value === 'forward') {
    return '前向传播：绿色光球沿连线流动，速度正比于 |权重|。隐藏层应用 ReLU（负值截断为 0），输出层应用 Sigmoid（值压缩到 (0,1)）。'
  }
  if (mode.value === 'backward') {
    return '反向传播：红色光球从损失节点反向出发。每经过一层，链式法则将上游梯度 × 局部雅可比。ReLU 的雅可比在 z≤0 时为 0，导致梯度被阻断。'
  }
  return '完成。尝试切换"大权重"预设观察梯度爆炸（连线闪烁红色），或"小权重"预设观察梯度消失（连线变细不可见）。'
})

const canvasContainer = ref<HTMLElement | null>(null)
const initStatus = ref('')
const initStatusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let resizeObserver: ResizeObserver
let animationId = 0

let nodeMeshes: Map<string, THREE.Mesh> = new Map()
let nodeLabels: Map<string, THREE.Sprite> = new Map()
let nodeValueLabels: Map<string, THREE.Sprite> = new Map()
let connMeshes: Map<string, THREE.Mesh> = new Map()
let connLabels: Map<string, THREE.Sprite> = new Map()
let lossLinkMesh: THREE.Mesh
let bgGrid: THREE.GridHelper

interface Ball {
  mesh: THREE.Mesh
  fromPos: THREE.Vector3
  toPos: THREE.Vector3
  progress: number
  speed: number
  onArrive?: () => void
}
let activeBalls: Ball[] = []

let explodeFlashPhase = 0

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function makeTextSprite(text: string, color: string = '#0f172a', bg: string = 'rgba(255,255,255,0.92)'): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  drawTextToCanvas(ctx, canvas, text, color, bg)
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.0, 0.25, 1)
  return sprite
}

function drawTextToCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, color: string, bg: string) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = bg
  roundRect(ctx, 4, 8, canvas.width - 8, canvas.height - 16, 8)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  roundRect(ctx, 4, 8, canvas.width - 8, canvas.height - 16, 8)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = 'bold 26px "Consolas", "Monaco", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function updateTextSprite(sprite: THREE.Sprite, text: string, color: string = '#0f172a', bg: string = 'rgba(255,255,255,0.92)') {
  const mat = sprite.material as THREE.SpriteMaterial
  if (!mat.map) return
  const canvas = (mat.map as THREE.CanvasTexture).image as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  drawTextToCanvas(ctx, canvas, text, color, bg)
  ;(mat.map as THREE.CanvasTexture).needsUpdate = true
}

function hiddenColor(activation: number): number {

  const t = Math.min(1, Math.max(0, activation / 2))
  const r = lerp(0x1f, 0x10, t)
  const g = lerp(0x29, 0xb9, t)
  const b = lerp(0x37, 0x81, t)
  return (r << 16) | (g << 8) | b
}

function lossScale(loss: number): number {

  return 0.4 + Math.min(0.6, Math.sqrt(loss) * 0.5)
}

function weightRadius(w: number): number {

  return Math.max(0.003, Math.min(0.12, Math.abs(w) * 0.04))
}

function gradRadius(g: number): number {
  return Math.max(0.003, Math.min(0.15, Math.abs(g) * 0.06))
}

function nodePos(key: string): THREE.Vector3 {
  const spec = nodeSpecs.find(n => n.key === key)!
  return spec.pos.clone()
}

function buildConnectionMesh(fromKey: string, toKey: string): THREE.Mesh {

  const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false)
  const mat = new THREE.MeshBasicMaterial({
    color: COLOR_POS_WEIGHT,
    transparent: true,
    opacity: 0.75
  })
  const mesh = new THREE.Mesh(geo, mat)
  positionConnection(mesh, fromKey, toKey, 0.05)
  return mesh
}

function positionConnection(mesh: THREE.Mesh, fromKey: string, toKey: string, radius: number) {
  const from = nodePos(fromKey)
  const to = nodePos(toKey)
  const dir = new THREE.Vector3().subVectors(to, from)
  const len = dir.length()

  mesh.position.copy(from).add(to).multiplyScalar(0.5)

  const axis = new THREE.Vector3(0, 1, 0)
  const dirN = dir.clone().normalize()
  mesh.quaternion.setFromUnitVectors(axis, dirN)

  mesh.scale.set(radius, len, radius)
}

function updateConnectionVisual(
  mesh: THREE.Mesh,
  weight: number,
  grad: number,
  options: { showGrad: boolean; clipped?: boolean }
) {

  let radius: number
  let colorHex: number
  let opacity = 0.75

  if (options.showGrad) {
    radius = gradRadius(grad)

    colorHex = grad >= 0 ? COLOR_POS_WEIGHT : COLOR_NEG_WEIGHT

    if (Math.abs(grad) < 1e-6) {
      opacity = 0.1
    }

    if (isExploding.value && !options.clipped) {
      const flash = Math.sin(explodeFlashPhase * 8) * 0.5 + 0.5
      colorHex = flash > 0.5 ? COLOR_EXPLODE : COLOR_NEG_WEIGHT
      opacity = 0.95
    }
  } else {
    radius = weightRadius(weight)
    colorHex = weight >= 0 ? COLOR_POS_WEIGHT : COLOR_NEG_WEIGHT
    if (Math.abs(weight) < 1e-6) {
      opacity = 0.1
    }
  }

  const scale = mesh.scale
  scale.x = radius
  scale.z = radius
  const mat = mesh.material as THREE.MeshBasicMaterial
  mat.color.setHex(colorHex)
  mat.opacity = opacity
  mesh.visible = !(Math.abs(weight) < 1e-6 && !options.showGrad)
}

function spawnBall(
  fromKey: string,
  toKey: string,
  color: number,
  speed: number,
  onArrive?: () => void
): Ball {
  const from = nodePos(fromKey)
  const to = nodePos(toKey)
  const geo = new THREE.SphereGeometry(0.12, 16, 12)
  const mat = new THREE.MeshBasicMaterial({ color })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(from)
  scene.add(mesh)

  const safeSpeed = Math.max(0.4, speed)
  return {
    mesh,
    fromPos: from,
    toPos: to,
    progress: 0,
    speed: safeSpeed,
    onArrive
  }
}

function clearAllBalls() {
  for (const ball of activeBalls) {
    scene.remove(ball.mesh)
    ball.mesh.geometry.dispose()
    ;(ball.mesh.material as THREE.Material).dispose()
  }
  activeBalls = []
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
  scene.background = new THREE.Color(COLOR_BG)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)

  camera.position.set(0, 7, 7)
  camera.lookAt(1, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
  dirLight.position.set(5, 8, 6)
  scene.add(dirLight)

  bgGrid = new THREE.GridHelper(12, 24, COLOR_GRID, 0xf1f5f9)
  ;(bgGrid.material as THREE.Material).transparent = true
  ;(bgGrid.material as THREE.Material).opacity = 0.5
  bgGrid.position.y = -2.2
  scene.add(bgGrid)

  for (const spec of nodeSpecs) {
    let baseColor: number
    let baseRadius: number
    switch (spec.kind) {
      case 'input':
        baseColor = COLOR_INPUT
        baseRadius = 0.4
        break
      case 'hidden':
        baseColor = COLOR_HIDDEN_LOW
        baseRadius = 0.4
        break
      case 'output':
        baseColor = COLOR_OUTPUT
        baseRadius = 0.45
        break
      case 'loss':
        baseColor = COLOR_LOSS
        baseRadius = 0.5
        break
    }
    const geo = new THREE.SphereGeometry(baseRadius, 24, 18)
    const mat = new THREE.MeshPhongMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.92,
      shininess: 80
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(spec.pos)
    scene.add(mesh)
    nodeMeshes.set(spec.key, mesh)

    const nameSprite = makeTextSprite(spec.label, '#1e293b', 'rgba(255,255,255,0.85)')
    nameSprite.position.copy(spec.pos)
    nameSprite.position.y += baseRadius + 0.35
    nameSprite.scale.set(0.7, 0.18, 1)
    scene.add(nameSprite)
    nodeLabels.set(spec.key, nameSprite)

    const valSprite = makeTextSprite('—', '#0f172a', 'rgba(255,255,255,0.92)')
    valSprite.position.copy(spec.pos)
    valSprite.position.y -= baseRadius + 0.35
    valSprite.scale.set(1.1, 0.27, 1)
    scene.add(valSprite)
    nodeValueLabels.set(spec.key, valSprite)
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const key = `w1-${i}-${j}`
      const fromKey = j === 0 ? 'x1' : 'x2'
      const toKey = `h${i + 1}`
      const mesh = buildConnectionMesh(fromKey, toKey)
      scene.add(mesh)
      connMeshes.set(key, mesh)

      const label = makeTextSprite('0.00', '#1e40af')
      const mid = nodePos(fromKey).add(nodePos(toKey)).multiplyScalar(0.5)
      label.position.copy(mid)
      label.position.y += 0.25
      label.scale.set(0.7, 0.18, 1)
      scene.add(label)
      connLabels.set(key, label)
    }
  }

  for (let i = 0; i < 3; i++) {
    const key = `w2-${i}`
    const fromKey = `h${i + 1}`
    const toKey = 'y'
    const mesh = buildConnectionMesh(fromKey, toKey)
    scene.add(mesh)
    connMeshes.set(key, mesh)

    const label = makeTextSprite('0.00', '#1e40af')
    const mid = nodePos(fromKey).add(nodePos(toKey)).multiplyScalar(0.5)
    label.position.copy(mid)
    label.position.y += 0.25
    label.scale.set(0.7, 0.18, 1)
    scene.add(label)
    connLabels.set(key, label)
  }

  const lossLinkGeo = new THREE.CylinderGeometry(0.015, 0.015, 1, 8)
  const lossLinkMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.5
  })
  lossLinkMesh = new THREE.Mesh(lossLinkGeo, lossLinkMat)
  positionConnection(lossLinkMesh, 'y', 'L', 0.015)
  scene.add(lossLinkMesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(1, 0, 0)
  controls.minDistance = 4
  controls.maxDistance = 18

  controls.maxPolarAngle = Math.PI * 0.48

  resizeObserver = new ResizeObserver(() => handleResize())
  resizeObserver.observe(container)

  initStatus.value = '3D 场景已就绪 · 可拖拽旋转视角'
  initStatusType.value = 'success'

  refreshNodeVisuals()
  refreshConnectionVisuals(false)
  refreshLabels()

  lastFrameTime = performance.now()
  animate()
}

function refreshNodeVisuals() {

  const inputVals: Record<string, number> = { x1: x1.value, x2: x2.value }
  for (const key of ['x1', 'x2']) {
    const valSprite = nodeValueLabels.get(key)!
    updateTextSprite(valSprite, inputVals[key].toFixed(3), '#0e7490')
  }

  for (let i = 0; i < 3; i++) {
    const key = `h${i + 1}`
    const mesh = nodeMeshes.get(key)!
    const valSprite = nodeValueLabels.get(key)!
    const hv = hVals.value[i]
    const color = hiddenColor(hv)
    ;(mesh.material as THREE.MeshPhongMaterial).color.setHex(color)

    const labelColor = hv > 1e-6 ? '#047857' : '#64748b'
    updateTextSprite(valSprite, `h=${hv.toFixed(3)}`, labelColor)
  }

  const ySprite = nodeValueLabels.get('y')!
  updateTextSprite(ySprite, `y=${yVal.value.toFixed(3)}`, '#6b21a8')

  const lossMesh = nodeMeshes.get('L')!
  const lossSprite = nodeValueLabels.get('L')!
  const lossScaleFactor = lossScale(lossVal.value)
  lossMesh.scale.setScalar(lossScaleFactor)
  updateTextSprite(lossSprite, `L=${lossVal.value.toFixed(3)}`,
    lossVal.value > 0.25 ? '#dc2626' : '#7f1d1d',
    lossVal.value > 0.25 ? 'rgba(254,226,226,0.95)' : 'rgba(255,255,255,0.92)')
}

function refreshConnectionVisuals(showGrad: boolean) {

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const key = `w1-${i}-${j}`
      const mesh = connMeshes.get(key)!
      const w = w1.value[i][j]
      const g = dLdw1.value[i][j]
      updateConnectionVisual(mesh, w, g, { showGrad, clipped: clipGradient.value })

      const label = connLabels.get(key)!
      const displayVal = showGrad ? g : w
      const labelText = (showGrad ? '∂L/∂w=' : 'w=') + displayVal.toFixed(3)
      const labelColor = showGrad
        ? (Math.abs(g) > 5 ? '#dc2626' : '#7f1d1d')
        : (w >= 0 ? '#1e40af' : '#7f1d1d')
      updateTextSprite(label, labelText, labelColor)
      label.visible = Math.abs(w) > 1e-6 || showGrad
    }
  }

  for (let i = 0; i < 3; i++) {
    const key = `w2-${i}`
    const mesh = connMeshes.get(key)!
    const w = w2.value[i]
    const g = dLdw2.value[i]
    updateConnectionVisual(mesh, w, g, { showGrad, clipped: clipGradient.value })

    const label = connLabels.get(key)!
    const displayVal = showGrad ? g : w
    const labelText = (showGrad ? '∂L/∂w=' : 'w=') + displayVal.toFixed(3)
    const labelColor = showGrad
      ? (Math.abs(g) > 5 ? '#dc2626' : '#7f1d1d')
      : (w >= 0 ? '#1e40af' : '#7f1d1d')
    updateTextSprite(label, labelText, labelColor)
    label.visible = Math.abs(w) > 1e-6 || showGrad
  }
}

function refreshLabels() {
  refreshNodeVisuals()
  refreshConnectionVisuals(mode.value === 'backward' || mode.value === 'done')
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000)
  lastFrameTime = now

  explodeFlashPhase += dt

  for (let i = activeBalls.length - 1; i >= 0; i--) {
    const ball = activeBalls[i]
    ball.progress += ball.speed * dt
    if (ball.progress >= 1) {
      ball.progress = 1
      ball.mesh.position.copy(ball.toPos)

      const cb = ball.onArrive

      scene.remove(ball.mesh)
      ball.mesh.geometry.dispose()
      ;(ball.mesh.material as THREE.Material).dispose()
      activeBalls.splice(i, 1)
      cb?.()
    } else {
      const t = easeInOutCubic(ball.progress)
      ball.mesh.position.lerpVectors(ball.fromPos, ball.toPos, t)
    }
  }

  tickPhaseAnimation(now)

  controls.update()
  renderer.render(scene, camera)
}

function tickPhaseAnimation(now: number) {
  if (mode.value === 'idle' || mode.value === 'done') return

  const elapsed = now - phaseStartTime
  const phaseDuration = 1000
  const phaseProg = Math.min(1, elapsed / phaseDuration)

  let totalPhases = mode.value === 'forward' ? 5 : 6
  let totalProgress = (phase.value - 1 + phaseProg) / totalPhases
  timelinePercent.value = Math.max(0, Math.min(100, totalProgress * 100))

}

function spawnBallsWave(
  items: { fromKey: string; toKey: string; speed: number; signal: number }[],
  color: number,
  onComplete: () => void
) {
  let arrived = 0
  const total = items.length
  const onArrive = () => {
    arrived++
    if (arrived >= total) onComplete()
  }
  for (const it of items) {
    if (Math.abs(it.signal) < 1e-6 || Math.abs(it.speed) < 1e-6) {
      onArrive()
      continue
    }
    const safeSpeed = Math.max(0.5, Math.min(3.0, it.speed))
    const ball = spawnBall(it.fromKey, it.toKey, color, safeSpeed, onArrive)
    activeBalls.push(ball)
  }

  if (arrived >= total) onComplete()
}

function runForward() {
  if (mode.value === 'forward' || mode.value === 'backward') return
  resetAnimation(true)
  mode.value = 'forward'
  phase.value = 1
  phaseStartTime = performance.now()
  startForwardPhase(1)
}

function startForwardPhase(p: number) {
  phase.value = p
  phaseStartTime = performance.now()
  switch (p) {
    case 1: {

      const items: { fromKey: string; toKey: string; speed: number; signal: number }[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          const w = w1.value[i][j]
          items.push({
            fromKey: j === 0 ? 'x1' : 'x2',
            toKey: `h${i + 1}`,
            speed: Math.abs(w) * 1.5 + 0.4,
            signal: w
          })
        }
      }
      spawnBallsWave(items, COLOR_FORWARD_BALL, () => setTimeout(() => startForwardPhase(2), 200))
      break
    }
    case 2:

      refreshNodeVisuals()
      setTimeout(() => startForwardPhase(3), 600)
      break
    case 3: {

      const items: { fromKey: string; toKey: string; speed: number; signal: number }[] = []
      for (let i = 0; i < 3; i++) {
        const w = w2.value[i]
        items.push({
          fromKey: `h${i + 1}`,
          toKey: 'y',
          speed: Math.abs(w) * 1.5 + 0.4,
          signal: hVals.value[i] < 1e-6 ? 0 : w
        })
      }
      spawnBallsWave(items, COLOR_FORWARD_BALL, () => setTimeout(() => startForwardPhase(4), 200))
      break
    }
    case 4:

      refreshNodeVisuals()
      setTimeout(() => startForwardPhase(5), 600)
      break
    case 5: {

      const onArrive = () => {
        refreshNodeVisuals()
        mode.value = 'idle'
        phase.value = 0
        timelinePercent.value = 100
      }
      activeBalls.push(spawnBall('y', 'L', COLOR_FORWARD_BALL, 1.2, onArrive))
      break
    }
  }
}

function runBackward() {
  if (mode.value === 'forward' || mode.value === 'backward') return
  if (mode.value === 'idle' && phase.value === 0) {
    initStatus.value = '请先点击"开始前向"完成前向传播'
    initStatusType.value = 'warning'
    setTimeout(() => {
      initStatus.value = '3D 场景已就绪 · 可拖拽旋转视角'
      initStatusType.value = 'success'
    }, 2000)
    return
  }
  mode.value = 'backward'
  phase.value = 1
  phaseStartTime = performance.now()
  startBackwardPhase(1)
}

function startBackwardPhase(p: number) {
  phase.value = p
  phaseStartTime = performance.now()
  switch (p) {
    case 1:

      activeBalls.push(spawnBall('L', 'y', COLOR_BACKWARD_BALL, 1.2,
        () => setTimeout(() => startBackwardPhase(2), 200)))
      break
    case 2: {

      updateTextSprite(nodeValueLabels.get('y')!, `∂L/∂s=${dLds.value.toFixed(3)}`,
        '#dc2626', 'rgba(254,226,226,0.95)')
      setTimeout(() => startBackwardPhase(3), 700)
      break
    }
    case 3: {

      refreshConnectionVisuals(true)
      for (let i = 0; i < 3; i++) {
        updateTextSprite(nodeValueLabels.get(`h${i + 1}`)!,
          `∂L/∂h=${dLdh.value[i].toFixed(3)}`, '#7f1d1d')
      }
      setTimeout(() => startBackwardPhase(4), 800)
      break
    }
    case 4: {

      for (let i = 0; i < 3; i++) {
        const zv = z1Vals.value[i]
        const reluGrad = zv > 0 ? 1 : 0
        updateTextSprite(nodeValueLabels.get(`h${i + 1}`)!,
          `∂L/∂z=${dLdz.value[i].toFixed(3)} (ReLU'=${reluGrad})`,
          reluGrad > 0 ? '#7f1d1d' : '#94a3b8')
      }

      const items: { fromKey: string; toKey: string; speed: number; signal: number }[] = []
      for (let i = 0; i < 3; i++) {
        items.push({
          fromKey: 'y',
          toKey: `h${i + 1}`,
          speed: Math.abs(dLdh.value[i]) * 1.5 + 0.4,
          signal: w2.value[i] * dLdh.value[i]
        })
      }
      spawnBallsWave(items, COLOR_BACKWARD_BALL, () => setTimeout(() => startBackwardPhase(5), 300))
      break
    }
    case 5: {

      const items: { fromKey: string; toKey: string; speed: number; signal: number }[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          items.push({
            fromKey: `h${i + 1}`,
            toKey: j === 0 ? 'x1' : 'x2',
            speed: Math.abs(dLdz.value[i]) * 1.5 + 0.4,
            signal: w1.value[i][j] * dLdz.value[i]
          })
        }
      }
      spawnBallsWave(items, COLOR_BACKWARD_BALL, () => setTimeout(() => startBackwardPhase(6), 300))
      break
    }
    case 6: {

      refreshConnectionVisuals(true)
      for (const key of ['x1', 'x2']) {
        updateTextSprite(nodeValueLabels.get(key)!,
          key === 'x1' ? `x₁=${x1.value.toFixed(3)}` : `x₂=${x2.value.toFixed(3)}`, '#0e7490')
      }
      mode.value = 'done'
      phase.value = 0
      timelinePercent.value = 100
      break
    }
  }
}

function stepForward() {
  if (mode.value === 'forward' || mode.value === 'backward') return

  if (mode.value === 'idle') {
    if (phase.value === 0) {

      mode.value = 'forward'

      clearAllBalls()
      timelinePercent.value = 0
      startForwardPhase(1)
    } else {

    }
  } else {

    mode.value = 'backward'
    clearAllBalls()
    startBackwardPhase(1)
  }
}

function reset() {
  resetAnimation(false)
}

function resetAnimation(keepMode: boolean) {
  clearAllBalls()
  if (!keepMode) {
    mode.value = 'idle'
    phase.value = 0
    timelinePercent.value = 0
  }

  refreshLabels()
}

watch(
  [w1, w2, b1, b2, x1, x2, target, clipGradient],
  () => {
    if (!scene) return
    refreshLabels()
  },
  { deep: true, flush: 'post' }
)

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
  if (resizeObserver) resizeObserver.disconnect()
  if (controls) controls.dispose()
  clearAllBalls()
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

  nodeValueLabels.forEach(sprite => {
    const mat = sprite.material as THREE.SpriteMaterial
    if (mat.map) mat.map.dispose()
  })
  connLabels.forEach(sprite => {
    const mat = sprite.material as THREE.SpriteMaterial
    if (mat.map) mat.map.dispose()
  })
  nodeLabels.forEach(sprite => {
    const mat = sprite.material as THREE.SpriteMaterial
    if (mat.map) mat.map.dispose()
  })
})
</script>

<style scoped>
.demo-container {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  border-radius: 12px; padding: 20px; margin: 16px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); color: #1f2937;
}
.demo-title {
  font-size: 20px; font-weight: 700; margin: 0 0 16px 0;
  color: #0f172a; text-align: center; letter-spacing: 0.5px;
}

.preset-buttons, .anim-buttons {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
  margin-bottom: 16px;
}
.anim-buttons { margin-bottom: 0; }
.preset-buttons button, .anim-buttons button {
  padding: 6px 14px; border: 1px solid #cbd5e1; background: #fff;
  color: #475569; border-radius: 6px; cursor: pointer; font-size: 13px;
  transition: all 0.2s;
}
.preset-buttons button:hover, .anim-buttons button:hover:not(:disabled) {
  background: #f1f5f9; border-color: #3b82f6; color: #3b82f6;
}
.preset-buttons button.active {
  background: #3b82f6; color: #fff; border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}
.anim-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }
.anim-buttons .play-btn {
  background: #10b981; color: #fff; border-color: #10b981;
}
.anim-buttons .play-btn:hover:not(:disabled) {
  background: #059669; border-color: #059669; color: #fff;
}
.anim-buttons .backward-btn {
  background: #ef4444; color: #fff; border-color: #ef4444;
}
.anim-buttons .backward-btn:hover:not(:disabled) {
  background: #dc2626; border-color: #dc2626; color: #fff;
}

.dual-pane { display: flex; gap: 16px; margin-bottom: 16px; }
.left-pane { flex: 0 0 60%; display: flex; flex-direction: column; gap: 10px; }
.right-pane {
  flex: 1; display: flex; flex-direction: column; gap: 10px;
  max-height: 720px; overflow-y: auto; padding-right: 4px;
}

.demo-canvas {
  width: 100%; height: 480px; background: #f8fafc; border-radius: 8px;
  overflow: hidden; position: relative; border: 1px solid #e2e8f0;
}
.demo-canvas :deep(canvas) {
  display: block; width: 100% !important; height: 100% !important;
}
.demo-status {
  position: absolute; top: 8px; left: 8px; padding: 4px 10px;
  border-radius: 4px; font-size: 12px; color: #fff; z-index: 10;
  pointer-events: none;
}
.demo-status.info { background: #3b82f6; }
.demo-status.success { background: #10b981; }
.demo-status.warning { background: #f59e0b; }
.demo-status.error { background: #ef4444; }

.phase-label {
  display: flex; align-items: center; gap: 12px; padding: 8px 14px;
  border-radius: 6px; background: #f1f5f9; border-left: 4px solid #94a3b8;
  transition: all 0.3s;
}
.phase-label .phase-name { font-weight: 700; font-size: 14px; min-width: 90px; }
.phase-label .phase-desc { font-size: 13px; color: #475569; }
.phase-label.phase-idle { border-left-color: #94a3b8; background: #f1f5f9; }
.phase-label.phase-forward { border-left-color: #10b981; background: #f0fdf4; }
.phase-label.phase-backward { border-left-color: #ef4444; background: #fef2f2; }
.phase-label.phase-done { border-left-color: #a855f7; background: #faf5ff; }

.timeline {
  background: #fff; border-radius: 6px; padding: 10px 12px;
  border: 1px solid #e2e8f0;
}
.timeline-track {
  position: relative; height: 8px; background: #e5e7eb;
  border-radius: 4px; margin-bottom: 8px; overflow: hidden;
}
.timeline-progress {
  position: absolute; top: 0; left: 0; height: 100%; border-radius: 4px;
  transition: width 0.2s linear, background-color 0.3s;
}
.timeline-progress.phase-idle { background: #94a3b8; }
.timeline-progress.phase-forward { background: #10b981; }
.timeline-progress.phase-backward { background: #ef4444; }
.timeline-progress.phase-done { background: #a855f7; }
.phase-labels {
  display: flex; justify-content: space-between; font-size: 11px; color: #64748b;
}
.phase-labels span { flex: 1; text-align: center; padding: 2px 0; border-radius: 3px; }
.phase-labels span.active { background: #dbeafe; color: #1e40af; font-weight: 600; }

.color-legend {
  display: flex; flex-wrap: wrap; gap: 10px; padding: 8px 12px;
  background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;
  font-size: 11px; color: #475569;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; }
.legend-swatch.solid { border: 1px solid rgba(0, 0, 0, 0.15); }

.right-pane .block-title {
  margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #1e293b;
}
.input-controls, .forward-panel, .backward-panel, .chain-rule {
  background: #fff; border-radius: 6px; padding: 10px 12px;
  border: 1px solid #e2e8f0;
}

.slider-row {
  display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 12px;
}
.slider-row .slider-label { width: 24px; font-weight: 600; color: #475569; }
.slider-row .slider-val {
  width: 44px; text-align: right; color: #3b82f6; font-family: 'Consolas', monospace;
}
.slider-row input[type='range'] {
  flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
  background: #e5e7eb; border-radius: 2px;
}
.slider-row input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 14px; height: 14px;
  background: #3b82f6; border-radius: 50%; cursor: pointer; border: 2px solid #fff;
}
.slider-row input[type='range']::-moz-range-thumb {
  width: 14px; height: 14px; background: #3b82f6; border-radius: 50%;
  cursor: pointer; border: 2px solid #fff;
}
.checkbox-row {
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  font-size: 12px; color: #475569; cursor: pointer;
}
.checkbox-row input { cursor: pointer; }

.data-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 3px 6px; font-size: 11px;
  border-left: 3px solid transparent; margin: 2px 0;
  background: #f8fafc; border-radius: 3px;
}
.data-row .data-label {
  color: #64748b; font-family: 'Cambria Math', 'Times New Roman', serif; font-style: italic;
}
.data-row .data-val {
  font-family: 'Consolas', monospace; color: #0f172a; font-weight: 600;
}
.data-row.highlight { border-left-color: #3b82f6; background: #eff6ff; }
.data-row.ok { border-left-color: #10b981; background: #f0fdf4; }
.data-row.danger { border-left-color: #dc2626; background: #fef2f2; }
.data-row .data-val.danger { color: #dc2626; }
.data-row .data-val.zero { color: #94a3b8; font-weight: 400; }
.warn-banner {
  margin-top: 6px; padding: 5px 8px; background: #fef2f2;
  border-left: 3px solid #dc2626; color: #991b1b;
  font-size: 11px; border-radius: 3px;
}
.warn-banner.vanish {
  background: #fffbeb; border-left-color: #f59e0b; color: #92400e;
}

.weight-selector { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.weight-selector button {
  padding: 3px 8px; border: 1px solid #cbd5e1; background: #fff;
  color: #475569; border-radius: 4px; cursor: pointer; font-size: 11px;
  transition: all 0.2s;
}
.weight-selector button:hover { background: #f1f5f9; }
.weight-selector button.active {
  background: #3b82f6; color: #fff; border-color: #3b82f6;
}
.chain-breakdown {
  font-size: 12px; font-family: 'Cambria Math', 'Times New Roman', serif;
  font-style: italic; color: #1e293b; background: #f8fafc;
  padding: 8px 10px; border-radius: 4px; border-left: 3px solid #a855f7;
  line-height: 1.8;
}
.chain-breakdown :deep(.chain-step) { margin: 2px 0; }
.chain-breakdown :deep(.chain-step.result) {
  margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;
  color: #a855f7; font-size: 13px;
}
.chain-breakdown :deep(.chain-step.result strong) { color: #7e22ce; font-size: 14px; }
.chain-breakdown :deep(.chain-note) {
  margin-top: 6px; font-size: 11px; color: #64748b; font-style: normal;
  font-family: 'Inter', sans-serif; line-height: 1.6;
}

.formula-block {
  background: #1e293b; color: #f1f5f9; border-radius: 8px;
  padding: 14px 16px; margin-top: 12px;
}
.formula-title { margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #fbbf24; }
.formula-line {
  margin: 4px 0; font-size: 13px;
  font-family: 'Cambria Math', 'Times New Roman', serif; line-height: 1.6;
}
.formula-line .math {
  background: #334155; padding: 2px 8px; border-radius: 3px;
  color: #fbbf24; font-style: italic;
}
.demo-tip {
  margin: 12px 0 0 0; padding: 10px 12px; background: #dbeafe;
  border-radius: 6px; font-size: 12px; color: #1e3a8a;
  line-height: 1.6; border-left: 4px solid #3b82f6;
}

@media (max-width: 900px) {
  .dual-pane { flex-direction: column; }
  .left-pane { flex: 1 1 100%; }
  .right-pane { flex: 1 1 100%; max-height: none; }
  .demo-canvas { height: 380px; }
}
</style>
