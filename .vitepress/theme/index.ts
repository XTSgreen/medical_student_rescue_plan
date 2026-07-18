
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

// 全局样式（按顺序加载，后者可覆盖前者）
import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/content.css'
import './styles/components.css'
import './styles/animations.css'
import './styles/katex.css'


// 交互组件

// 第 1.1 章 · 向量与基本运算
import VectorDemo from './components/ch1_1-向量与基本运算/VectorDemo.vue'

// 第 1.2 章 · 矩阵与线性变换
import BasisVectorsDemo from './components/ch1_2-矩阵与线性变换/BasisVectorsDemo.vue'
import MatrixAlgebraDemo from './components/ch1_2-矩阵与线性变换/MatrixAlgebraDemo.vue'
import BasicTransformsDemo from './components/ch1_2-矩阵与线性变换/BasicTransformsDemo.vue'
import CompositeTransformDemo from './components/ch1_2-矩阵与线性变换/CompositeTransformDemo.vue'
import DeterminantDemo from './components/ch1_2-矩阵与线性变换/DeterminantDemo.vue'

// 第 1.3 章 · 线性方程组与秩
import RowColumnDemo from './components/ch1_3-线性方程组与秩/RowColumnDemo.vue'
import GaussianEliminationDemo from './components/ch1_3-线性方程组与秩/GaussianEliminationDemo.vue'
import RankDemo from './components/ch1_3-线性方程组与秩/RankDemo.vue'
import NullSpaceDemo from './components/ch1_3-线性方程组与秩/NullSpaceDemo.vue'
import AffineSolutionDemo from './components/ch1_3-线性方程组与秩/AffineSolutionDemo.vue'
import RankSummaryDemo from './components/ch1_3-线性方程组与秩/RankSummaryDemo.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 预留插槽，未来可加 hero 区域、自定义页脚等
    })
  },
  enhanceApp({ app }) {
    // 第 1.1 章
    app.component('VectorDemo', VectorDemo)

    // 第 1.2 章
    app.component('BasisVectorsDemo', BasisVectorsDemo)
    app.component('MatrixAlgebraDemo', MatrixAlgebraDemo)
    app.component('BasicTransformsDemo', BasicTransformsDemo)
    app.component('CompositeTransformDemo', CompositeTransformDemo)
    app.component('DeterminantDemo', DeterminantDemo)

    // 第 1.3 章
    app.component('RowColumnDemo', RowColumnDemo)
    app.component('GaussianEliminationDemo', GaussianEliminationDemo)
    app.component('RankDemo', RankDemo)
    app.component('NullSpaceDemo', NullSpaceDemo)
    app.component('AffineSolutionDemo', AffineSolutionDemo)
    app.component('RankSummaryDemo', RankSummaryDemo)
  }
} satisfies Theme
