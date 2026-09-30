---
title: 医学生自救计划
layout: doc
aside: false
---

# 医学生自救计划

面向医学生与计算机初学者的开源入门教程。内容覆盖互联网开发、R 语言与生信分析、Python 编程、人工智能的数学基础四条主线，目的是把零散的入门技能组织成一条可执行的成长路线，而不是停留在会调用几个库。项目同时是作者的学习日志，持续更新。

站点的代码以 MIT 许可、教程正文以 CC BY-SA 4.0 许可开放，允许包括商业用途在内的使用、修改与再分发。

## 先确定你的目标

初次进入不必从第一页顺序读起。下面按你可能的目标列出推荐入口，选定一条路线后再进入对应模块。每条路线的链接按建议阅读顺序排列。

**只想读懂论文、调用现成模型，并能判断 AI 说得对不对**

[第 0 章 够用数学](/code/ai-math/ch0-just-enough-math/)

**完全不会编程，想先学会写代码**

[Python 概述与开发环境准备](/code/python/01-python-core-syntax/01-dev-env-and-intro/001-python-overview-and-env-setup) → [NumPy 数值计算基础](/code/python/02-data-science/01-numpy-foundation/001-numpy-basics-and-array-object) → [Pandas 数据分析](/code/python/02-data-science/02-pandas-data-analysis/001-pandas-overview-and-core-structures)

**需要处理科研数据、做统计分析**

[R 语言基础](/code/r-bioinformatics/r-language/001-r-basics) → [R 数据清洗与预处理](/code/r-bioinformatics/r-language/002-r-data-cleaning) → [R 统计分析](/code/r-bioinformatics/r-language/004-r-statistics) → [R 统计与建模](/code/r-bioinformatics/r-language/005-r-modeling)

**想做生物信息分析**

[R 语言基础](/code/r-bioinformatics/r-language/001-r-basics) → [计算机基础初步](/code/r-bioinformatics/bioinformatics/001-computer-basics) → [生物信息资源](/code/r-bioinformatics/bioinformatics/002-bioinfo-resources) → [序列分析与比对](/code/r-bioinformatics/bioinformatics/003-sequence-alignment) → [转录组学分析](/code/r-bioinformatics/bioinformatics/005-transcriptomics)

**想做医学人工智能**

[Python 概述与开发环境准备](/code/python/01-python-core-syntax/01-dev-env-and-intro/001-python-overview-and-env-setup) → [向量与基本运算](/code/ai-math/ch1-linear-algebra/ch1_1-vectors) → [概率的公理化与条件概率](/code/ai-math/ch2-probability-statistics/ch2_1-probability-space) → [优化问题的语言与分类](/code/ai-math/ch3-optimization/ch3_1-optimization-problems) → [Scikit-learn 基础与估计器](/code/python/02-data-science/04-scikit-learn-ml/001-scikit-learn-basics-and-estimators)

**想理解人工智能的数学原理**

[向量与基本运算](/code/ai-math/ch1-linear-algebra/ch1_1-vectors) → [概率的公理化与条件概率](/code/ai-math/ch2-probability-statistics/ch2_1-probability-space) → [优化问题的语言与分类](/code/ai-math/ch3-optimization/ch3_1-optimization-problems) → [基础熵与互信息](/code/ai-math/ch4-information-theory/ch4_1-entropy-and-mutual-information) → [实数、完备性与极限的语言](/code/ai-math/ch5-analysis/ch5_1-real-numbers-limits)

**想做网站与互联网开发**

[前端开发](/code/web-dev/frontend/) → [后端开发](/code/web-dev/backend/)

::: note 关于尚在建设的部分
Python 模块中的“医学数据处理专向技能”一层仍在建设中，上面涉及专业技能的部分暂时指向通用的数据科学内容，待该层补齐后再回填。
:::

## 教程模块

<a class="module-card" href="/medical_student_rescue_plan/code/web-dev/">
  <h3>互联网开发</h3>
  <p>从 HTML、CSS、JavaScript 三大前端核心出发，延伸至后端开发基础。</p>
</a>

<a class="module-card" href="/medical_student_rescue_plan/code/r-bioinformatics/">
  <h3>R 语言与生信分析</h3>
  <p>R 语言基础与统计建模，以及基因组、转录组、蛋白组等生物信息分析。</p>
</a>

<a class="module-card" href="/medical_student_rescue_plan/code/python/">
  <h3>Python 编程</h3>
  <p>核心语法基础，到 NumPy、Pandas、Matplotlib、Seaborn、scikit-learn 组成的数据科学工具链。</p>
</a>

<a class="module-card" href="/medical_student_rescue_plan/code/ai-math/">
  <h3>人工智能的数学基础</h3>
  <p>线性代数、概率论与统计推断、最优化、信息论、数学分析五个部分，讲清算法背后的数学。</p>
</a>

## 关于本项目

**开源许可**：代码采用 MIT 许可，教程正文采用 CC BY-SA 4.0 许可，允许包括商业用途在内的使用、修改与再分发，署名与相同方式共享的要求见 [LICENSE](https://github.com/XTSgreen/medical_student_rescue_plan/blob/main/LICENSE)。

**源码与反馈**：项目托管于 [GitHub](https://github.com/XTSgreen/medical_student_rescue_plan)，欢迎通过 Issue 指出错误或提出建议。

**交流**：QQ 群 965751576。

**站点技术**：由 VitePress 构建，数学公式经 MathJax 3 渲染，线性代数部分配有 Three.js 交互演示。
