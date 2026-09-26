---
title: 概率论与统计推断
layout: doc
aside: false
---
# 概率论与统计推断

线性代数研究确定性的结构：给定矩阵与向量，运算结果唯一确定。概率论与统计推断处理另一类问题：结果本身带有不确定性，需要用分布来描述，用数据来反推。人工智能的模型训练、评估与决策都建立在这套语言之上，分类器的输出是条件概率，损失函数是负对数似然，泛化误差是期望风险，贝叶斯推断是条件分布的更新。

本章分为两个部分，共 14 节。第一部分是概率论，建立描述不确定性的数学框架；第二部分是统计推断，讨论如何从有限的观测中推断总体的性质。两部分的分界点在于视角的翻转：概率论从已知的分布出发推导数据的性质，统计推断从观测到的数据出发反推分布的参数。

## 结构

### 第一部分 · 概率论

| 节 | 主题 |
|------|------|
| [2.1 概率的公理化与条件概率](/code/ai-math/ch2-probability-statistics/ch2_1-probability-space) | 样本空间、事件域、概率公理、条件概率、全概率与贝叶斯公式、独立性 |
| [2.2 随机变量与分布函数](/code/ai-math/ch2-probability-statistics/ch2_2-random-variables) | 随机变量、CDF/PMF/PDF、分位数与风险函数、变量变换、卷积、顺序统计量、经验分布 |
| [2.3 数字特征与矩](/code/ai-math/ch2-probability-statistics/ch2_3-moments) | 期望、条件期望、方差、协方差与相关系数、矩、矩生成函数与特征函数、协方差矩阵 |
| [2.4 常见离散分布](/code/ai-math/ch2-probability-statistics/ch2_4-discrete-distributions) | 伯努利、二项、多项、几何、负二项、超几何、泊松、幂律、零膨胀计数模型 |
| [2.5 常见连续分布](/code/ai-math/ch2-probability-statistics/ch2_5-continuous-distributions) | 均匀、正态、指数、伽马、贝塔、卡方、t、F、威布尔、极值分布、指数族、最大熵 |
| [2.6 多维随机变量与多元正态分布](/code/ai-math/ch2-probability-statistics/ch2_6-multivariate-normal) | 联合与条件分布、协方差结构、多元正态三大公式、混合模型、隐变量模型、copula |
| [2.7 极限定理与集中不等式](/code/ai-math/ch2-probability-statistics/ch2_7-limit-theorems) | 四种收敛、大数定律、中心极限定理、Delta 方法、概率不等式与集中不等式 |
| [2.8 随机过程与概率图模型](/code/ai-math/ch2-probability-statistics/ch2_8-stochastic-processes) | 马尔可夫链、隐马尔可夫模型、泊松过程、布朗运动、高斯过程、鞅、贝叶斯网络与因子图 |

### 第二部分 · 统计推断

| 节 | 主题 |
|------|------|
| [2.9 统计推断的基本框架](/code/ai-math/ch2-probability-statistics/ch2_9-inference-framework) | 总体与样本、抽样分布、偏差-方差分解、充分性、Fisher 信息、Cramér-Rao 下界 |
| [2.10 点估计与区间估计](/code/ai-math/ch2-probability-statistics/ch2_10-point-and-interval-estimation) | 矩估计、极大似然、收缩估计、核密度估计、置信区间、自助法区间、可信区间 |
| [2.11 假设检验与多重比较](/code/ai-math/ch2-probability-statistics/ch2_11-hypothesis-testing) | 两类错误与功效、p 值、Neyman-Pearson 引理、三大检验、非参数检验、FDR 控制 |
| [2.12 贝叶斯统计推断与计算](/code/ai-math/ch2-probability-statistics/ch2_12-bayesian-inference) | 共轭先验、先验选取、层次贝叶斯、MCMC、变分推断与 ELBO、模型选择 |
| [2.13 回归分析与线性模型](/code/ai-math/ch2-probability-statistics/ch2_13-regression) | 最小二乘与 Gauss-Markov 定理、回归诊断、正则化、广义线性模型、混合效应模型 |
| [2.14 高维统计与因果推断](/code/ai-math/ch2-probability-statistics/ch2_14-high-dimensional-and-causal) | 维数灾难、稀疏性与随机矩阵理论、潜在结果框架、do 算子、倾向得分、准实验设计 |

## 学习路径

本章的内容按依赖关系组织，相邻各节之间都有直接的前后引用。2.1 到 2.3 是语言层：概率空间、随机变量与数字特征，后续所有内容都使用这套记号。2.4 与 2.5 是工具箱：常见分布的名称、参数与适用场景需要熟悉到可以直接调用。2.6 与 2.7 处理多维情形与极限行为，是多元统计与机器学习理论的直接基础。

统计推断部分的入口是 2.9，它把概率论的结论反过来用：已知分布时计算数据的性质，现在已知数据要推断分布的参数。2.10 与 2.11 是推断的两大支柱，点估计与区间估计给出参数的取值与精度，假设检验给出关于参数的判断。2.12 到 2.14 是三条进阶路线：贝叶斯路线用先验与后验重新组织推断流程，回归路线把推断用于建模变量间关系，高维与因果路线处理现代数据中变量数超过样本数与相关关系不等于因果这两个现实问题。

信息论的核心内容（熵、KL 散度、互信息、Fisher 信息几何）不在本章展开，它与本章的关系密切，单独成章更便于阅读。最优化是另一条独立的线索，与本章的接口出现在极大似然估计、变分推断与 MCMC 的数值实现上。