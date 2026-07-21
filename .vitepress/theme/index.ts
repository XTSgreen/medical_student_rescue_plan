
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/content.css'
import './styles/components.css'
import './styles/animations.css'
import './styles/katex.css'


import VectorDemo from './components/ch1_1-向量与基本运算/VectorDemo.vue'

import BasisVectorsDemo from './components/ch1_2-矩阵与线性变换/BasisVectorsDemo.vue'
import MatrixAlgebraDemo from './components/ch1_2-矩阵与线性变换/MatrixAlgebraDemo.vue'
import BasicTransformsDemo from './components/ch1_2-矩阵与线性变换/BasicTransformsDemo.vue'
import CompositeTransformDemo from './components/ch1_2-矩阵与线性变换/CompositeTransformDemo.vue'
import DeterminantDemo from './components/ch1_2-矩阵与线性变换/DeterminantDemo.vue'

import RowColumnDemo from './components/ch1_3-线性方程组与秩/RowColumnDemo.vue'
import GaussianEliminationDemo from './components/ch1_3-线性方程组与秩/GaussianEliminationDemo.vue'
import RankDemo from './components/ch1_3-线性方程组与秩/RankDemo.vue'
import NullSpaceDemo from './components/ch1_3-线性方程组与秩/NullSpaceDemo.vue'
import AffineSolutionDemo from './components/ch1_3-线性方程组与秩/AffineSolutionDemo.vue'
import RankSummaryDemo from './components/ch1_3-线性方程组与秩/RankSummaryDemo.vue'

import SpanBasisDemo from './components/ch1_4-向量空间与四大子空间/SpanBasisDemo.vue'
import ColumnNullSpaceDemo from './components/ch1_4-向量空间与四大子空间/ColumnNullSpaceDemo.vue'
import RowLeftNullDemo from './components/ch1_4-向量空间与四大子空间/RowLeftNullDemo.vue'
import FourSubspacesTheoremDemo from './components/ch1_4-向量空间与四大子空间/FourSubspacesTheoremDemo.vue'

import VectorProjectionDemo from './components/ch1_5-正交性与投影/VectorProjectionDemo.vue'
import LeastSquaresDemo from './components/ch1_5-正交性与投影/LeastSquaresDemo.vue'
import GramSchmidtDemo from './components/ch1_5-正交性与投影/GramSchmidtDemo.vue'
import QRDecompositionDemo from './components/ch1_5-正交性与投影/QRDecompositionDemo.vue'

import EigenDirectionFinder from './components/ch1_6-特征值与特征向量/EigenDirectionFinder.vue'
import DiagonalizationDemo from './components/ch1_6-特征值与特征向量/DiagonalizationDemo.vue'
import SymmetricEigenDemo from './components/ch1_6-特征值与特征向量/SymmetricEigenDemo.vue'
import PowerMethodDemo from './components/ch1_6-特征值与特征向量/PowerMethodDemo.vue'

import SVDGeometryMaster from './components/ch1_7-奇异值分解/SVDGeometryMaster.vue'
import SVDSubspaceUnifier from './components/ch1_7-奇异值分解/SVDSubspaceUnifier.vue'
import SVDCompressionStudio from './components/ch1_7-奇异值分解/SVDCompressionStudio.vue'

import GradientFlowField from './components/ch1_8-数值计算与稳定性/GradientFlowField.vue'
import ConditionNumberIllusion from './components/ch1_8-数值计算与稳定性/ConditionNumberIllusion.vue'
import MatrixFactorizationCost from './components/ch1_8-数值计算与稳定性/MatrixFactorizationCost.vue'
import BackpropComputingGraph from './components/ch1_8-数值计算与稳定性/BackpropComputingGraph.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
    })
  },
  enhanceApp({ app }) {
    app.component('VectorDemo', VectorDemo)

    app.component('BasisVectorsDemo', BasisVectorsDemo)
    app.component('MatrixAlgebraDemo', MatrixAlgebraDemo)
    app.component('BasicTransformsDemo', BasicTransformsDemo)
    app.component('CompositeTransformDemo', CompositeTransformDemo)
    app.component('DeterminantDemo', DeterminantDemo)

    app.component('RowColumnDemo', RowColumnDemo)
    app.component('GaussianEliminationDemo', GaussianEliminationDemo)
    app.component('RankDemo', RankDemo)
    app.component('NullSpaceDemo', NullSpaceDemo)
    app.component('AffineSolutionDemo', AffineSolutionDemo)
    app.component('RankSummaryDemo', RankSummaryDemo)

    app.component('SpanBasisDemo', SpanBasisDemo)
    app.component('ColumnNullSpaceDemo', ColumnNullSpaceDemo)
    app.component('RowLeftNullDemo', RowLeftNullDemo)
    app.component('FourSubspacesTheoremDemo', FourSubspacesTheoremDemo)

    app.component('VectorProjectionDemo', VectorProjectionDemo)
    app.component('LeastSquaresDemo', LeastSquaresDemo)
    app.component('GramSchmidtDemo', GramSchmidtDemo)
    app.component('QRDecompositionDemo', QRDecompositionDemo)

    app.component('EigenDirectionFinder', EigenDirectionFinder)
    app.component('DiagonalizationDemo', DiagonalizationDemo)
    app.component('SymmetricEigenDemo', SymmetricEigenDemo)
    app.component('PowerMethodDemo', PowerMethodDemo)

    app.component('SVDGeometryMaster', SVDGeometryMaster)
    app.component('SVDSubspaceUnifier', SVDSubspaceUnifier)
    app.component('SVDCompressionStudio', SVDCompressionStudio)

    app.component('GradientFlowField', GradientFlowField)
    app.component('ConditionNumberIllusion', ConditionNumberIllusion)
    app.component('MatrixFactorizationCost', MatrixFactorizationCost)
    app.component('BackpropComputingGraph', BackpropComputingGraph)
  }
} satisfies Theme
