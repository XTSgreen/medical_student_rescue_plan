---
title: 2.6 多维随机变量与多元正态分布
sidebar:
  order: 6
---
# 2.6 多维随机变量与多元正态分布

前面的章节讨论单个随机变量。实际数据几乎总是多变量的：一次测量会同时记录长度、宽度与重量，一次调查会同时记录年龄、收入与满意度，图像的一个像素与相邻像素相关，一句话中每个词与它前后的词相关。单个变量的分布无法描述这些量之间的关联，需要把随机变量组织成向量，用联合分布刻画它们共同变化的规律。

本节从联合分布出发，依次讨论边缘分布、条件分布与独立性的多维版本；随后引入协方差矩阵与相关结构的度量，说明线性变换如何改变分布；再集中讨论多元正态分布，它是多维情形中性质最完整、应用最广泛的一族，三个高斯公式贯穿贝叶斯线性回归、卡尔曼滤波与高斯过程；最后讨论混合模型、隐变量模型与 copula，它们分别处理总体异质性与依赖结构建模这两个问题。本节使用的记号与 2.3 节一致，协方差与相关系数的定义不再重复。

## 2.6.1 随机向量与联合分布

### 联合分布函数

把 $p$ 个随机变量组织成向量 $\mathbf{X} = (X_1, \ldots, X_p)^T$，称为**随机向量**（random vector）。它的分布由**联合累积分布函数**（joint cumulative distribution function）描述：

$$
F(x_1, \ldots, x_p) = P(X_1 \leq x_1, \ldots, X_p \leq x_p)
$$

联合分布函数给出各分量同时不超过给定阈值的概率。二维情形下，落在矩形区域 $(a_1, b_1] \times (a_2, b_2]$ 的概率由容斥得到：

$$
P(a_1 < X_1 \leq b_1, a_2 < X_2 \leq b_2) = F(b_1, b_2) - F(a_1, b_2) - F(b_1, a_2) + F(a_1, a_2)
$$

这一形式说明联合分布函数不能任意构造，它需要满足与二维容斥一致的一致性条件。

### 联合概率质量函数与联合概率密度函数

离散情形下，**联合概率质量函数**（joint probability mass function）给出每个取值组合的概率：

$$
p(x_1, \ldots, x_p) = P(X_1 = x_1, \ldots, X_p = x_p), \qquad \sum_{x_1} \cdots \sum_{x_p} p(x_1, \ldots, x_p) = 1
$$

连续情形下，**联合概率密度函数**（joint probability density function）通过积分给出区域概率：

$$
P(\mathbf{X} \in A) = \int_A f(x_1, \ldots, x_p) \, dx_1 \cdots dx_p
$$

密度与联合分布函数的关系为 $f = \partial^p F / \partial x_1 \cdots \partial x_p$。混合情形（部分分量离散、部分连续）可以按分量类型组合求和与积分，或者先把条件算清楚再处理。

联合分布函数把各分量的全部联合信息包含在内，是一维分布函数在多维情形的直接推广。实际建模时很少直接指定 $F$，通常通过参数化的密度（如多元正态）或生成机制（如混合模型）间接确定。

## 2.6.2 边缘分布与条件分布

### 边缘分布

从联合分布可以得到每个分量的单独分布。对离散情形，把其他分量全部求和：

$$
p_{X_1}(x_1) = \sum_{x_2} \cdots \sum_{x_p} p(x_1, \ldots, x_p)
$$

对连续情形，把其他分量积分掉：

$$
f_{X_1}(x_1) = \int \cdots \int f(x_1, \ldots, x_p) \, dx_2 \cdots dx_p
$$

这一操作称为**边缘化**（marginalization），得到的分布称为**边缘分布**（marginal distribution）。边缘化丢掉的是分量之间的依赖信息，它回答的是只看其中一个变量时的规律。

边缘分布的另一个含义是：**联合分布决定边缘分布，边缘分布决定不了联合分布**。相同的边缘分布可以对应多种依赖结构，这正是下一小节 copula 讨论的问题。用一个具体例子说明：取 $X \sim N(0, 1)$，令 $Y = X$ 或 $Y = -X$，两种情形下 $X$ 与 $Y$ 的边缘分布都是标准正态，但联合分布完全不同，一个完全正相关，一个完全负相关。

### 条件分布

**条件分布**（conditional distribution）描述在部分分量取定值的条件下其余分量的分布。连续情形下由联合密度与边缘密度之商给出：

$$
f_{Y \mid X}(y \mid x) = \frac{f_{X, Y}(x, y)}{f_X(x)}, \qquad f_X(x) > 0
$$

几何上，条件密度是联合密度沿直线 $X = x$ 的截面，按该截面的面积归一化。这个构造与 2.1 节条件概率的关系一致：条件概率是概率之比，条件密度是密度之比。

条件分布的期望 $E[Y \mid X = x]$ 是 $x$ 的函数，称为**回归函数**（regression function）。它是 $Y$ 关于 $X$ 的最优均方预测：在所有 $X$ 的函数中，$E[Y \mid X]$ 使 $E[(Y - g(X))^2]$ 最小。这一结论把回归分析与条件期望联系起来，2.3 节提到的最小均方投影在这里得到解释。

### 连续形式的贝叶斯公式

把条件密度的定义式移项并交换 $X, Y$ 的位置，得到

$$
f_{Y \mid X}(y \mid x) = \frac{f_{X \mid Y}(x \mid y) f_Y(y)}{f_X(x)} = \frac{f_{X \mid Y}(x \mid y) f_Y(y)}{\int f_{X \mid Y}(x \mid y) f_Y(y) \, dy}
$$

形式与 2.1 节的贝叶斯公式完全一致，分母由全概率公式的连续版本给出。这一写法是贝叶斯推断的基本框架：把感兴趣的参数 $\theta$ 与观测数据 $\mathbf{x}$ 代入 $Y$ 与 $X$ 的位置，$f_\theta(\theta)$ 是先验密度，$f_{X \mid \theta}(\mathbf{x} \mid \theta)$ 是似然函数，$f_{\theta \mid X}(\theta \mid \mathbf{x})$ 是后验密度。2.12 节讨论的全部内容都可以看作这一公式的计算方法与解释。

```python
import numpy as np
from scipy import stats

# 二维正态的条件分布：先构造协方差矩阵，再比较条件分布的解析解与模拟结果
rho = 0.7
Sigma = np.array([[1.0, rho], [rho, 1.0]])
rng = np.random.default_rng(6)
sample = rng.multivariate_normal([0, 0], Sigma, size=400_000)

x0 = 1.0
# 条件均值为 rho * x0，条件方差为 1 - rho^2
cond_mean = rho * x0
cond_var = 1 - rho ** 2

selected = sample[np.abs(sample[:, 0] - x0) < 0.01][:, 1]
print(f"条件均值：模拟 {selected.mean():.4f}，理论 {cond_mean:.4f}")
print(f"条件方差：模拟 {selected.var():.4f}，理论 {cond_var:.4f}")
```

## 2.6.3 独立性与条件独立

### 随机变量独立

随机变量 $X_1, \ldots, X_p$ 相互独立，等价于联合分布函数等于边缘分布函数之积，也等价于联合密度等于边缘密度之积：

$$
f(x_1, \ldots, x_p) = \prod_{i=1}^{p} f_{X_i}(x_i)
$$

连续情形下的独立还要求支撑区域是各分量支撑的乘积。这一条件容易被忽略：若 $X \sim U(0, 1)$，$Y = X$，则 $f_{X, Y}$ 的支撑是直线段而非正方形，尽管 $X$ 与 $Y$ 的边缘分布都正常。判断独立性时同时检查密度是否可以分离与支撑是否为乘积形式。

### 三种依赖结构

条件独立在多维情形中的地位与独立同样重要。用三个变量构成的结构可以把条件独立与边际独立的关系说清楚：

**共因结构**（$X \leftarrow Z \rightarrow Y$）。$Z$ 同时影响 $X$ 与 $Y$，$X$ 与 $Y$ 在边际上相关，在给定 $Z$ 后条件独立。例如降雨 $Z$ 同时导致地面变湿 $X$ 与行人撑伞 $Y$，已知是否降雨后两者不再相关。

**链式结构**（$X \rightarrow Z \rightarrow Y$）。信息沿链条传递，$X$ 通过 $Z$ 影响 $Y$，给定 $Z$ 后 $X$ 与 $Y$ 条件独立。例如降雨 $X$ 使地面湿 $Z$，地面湿使行人放慢速度 $Y$。

**对撞结构**（$X \rightarrow Z \leftarrow Y$）。两个原因共同影响一个结果，$X$ 与 $Y$ 在边际上独立，在给定 $Z$ 后反而产生关联。例如才华 $X$ 与外貌 $Y$ 在人群中大致独立，但在获奖者 $Z$ 这一人群中，两者呈现负相关：获奖者中才华一般的往往外貌出众，反之亦然。这种条件化后产生关联的现象称为**对撞偏倚**（collider bias），在数据分析中选择变量做控制时需要特别留意。

三种结构的差别决定了一条实用规则：控制共因与链式结构的中间变量可以消除关联，控制对撞变量反而引入关联。2.8 节的 d-分离准则与 2.14 节的因果推断都以这条规则为基础。

## 2.6.4 联合矩与相关结构

### 协方差矩阵与相关矩阵

$p$ 维随机向量的**协方差矩阵**（covariance matrix）为

$$
\Sigma = \mathrm{Cov}(\mathbf{X}) = E\left[(\mathbf{X} - E[\mathbf{X}])(\mathbf{X} - E[\mathbf{X}])^T\right]
$$

$\Sigma$ 对称且半正定，对角元是各分量的方差，非对角元是两两协方差。**相关矩阵**（correlation matrix）对协方差做标准化：

$$
R_{ij} = \frac{\Sigma_{ij}}{\sqrt{\Sigma_{ii} \Sigma_{jj}}}
$$

$R$ 的对角元全为 $1$，非对角元是相关系数，取值在 $[-1, 1]$ 内。相关矩阵无量纲，便于比较不同量纲变量之间的关联强度；协方差矩阵保留量纲，在公式推导中更自然。

### 偏相关

两个变量可能与第三个变量同时相关，扣除共同部分后才能看清它们的直接关联。**偏相关**（partial correlation）给出这一度量。对三个变量 $X, Y, Z$，扣除 $Z$ 的影响后的偏相关系数为

$$
\rho_{XY \cdot Z} = \frac{\rho_{XY} - \rho_{XZ} \rho_{YZ}}{\sqrt{(1 - \rho_{XZ}^2)(1 - \rho_{YZ}^2)}}
$$

若某房屋的面积 $X$ 与价格 $Y$ 的相关系数为 $0.8$，房间数 $Z$ 同时与两者相关，偏相关给出的是在房间数固定后面积与价格的相关强度。多维情形的偏相关由协方差矩阵的逆（**精度矩阵**，precision matrix）给出：

$$
\rho_{ij \cdot \text{其余}} = -\frac{(\Sigma^{-1})_{ij}}{\sqrt{(\Sigma^{-1})_{ii}(\Sigma^{-1})_{jj}}}
$$

这一公式说明了精度矩阵的作用：$\Sigma$ 的非对角元度量边际关联，$\Sigma^{-1}$ 的非对角元度量条件关联。当 $\Sigma^{-1}$ 的某个非对角元为零时，对应的两个变量在给定其余变量下条件独立，这一性质是高斯图模型（2.8 节）选择边的主要依据。

```python
import numpy as np

# 一个三变量协方差矩阵，X 与 Y 的关联完全由 Z 传递
Sigma = np.array([
    [1.0, 0.30, 0.60],
    [0.30, 1.0, 0.45],
    [0.60, 0.45, 1.0],
])

def partial_corr(S, i, j):
    P = np.linalg.inv(S)
    return -P[i, j] / np.sqrt(P[i, i] * P[j, j])

r_xy = Sigma[0, 1] / np.sqrt(Sigma[0, 0] * Sigma[1, 1])
print(f"X 与 Y 的边际相关   = {r_xy:.4f}")
print(f"X 与 Y 的偏相关     = {partial_corr(Sigma, 0, 1):.4f}")   # 明显小于边际相关
print(f"逆矩阵非对角元素   = {np.round(np.linalg.inv(Sigma)[0, 1], 4)}")
```

### 复相关、多重相关与典型相关

**多重相关**（multiple correlation）度量一个变量与一组变量的联合关联强度，取值在 $[0, 1]$ 内。**复相关**（multiple correlation coefficient）在回归分析中常指同一量，它等于把该变量对组内其他变量做回归后得到的 $R^2$ 的平方根，是回归拟合优度的来源。**典型相关分析**（canonical correlation analysis，CCA）把这一思想推广到两组变量：寻找两组变量的线性组合，使两个组合之间的相关系数最大。第一对典型相关系数就是最大可达的线性相关强度，后续各对在与前面各对正交的约束下依次求解。

典型相关分析在跨模态数据处理中常用，例如把一组视觉特征与一组文本特征分别投影到低维空间后最大化相关，寻找两种模态之间的公共结构。计算归结为对 $\Sigma_{XX}^{-1} \Sigma_{XY} \Sigma_{YY}^{-1} \Sigma_{YX}$ 的特征分解，与线性代数的广义特征值问题直接相关。

## 2.6.5 线性变换与仿射变换

### 均值与协方差的变换公式

设 $\mathbf{Y} = \mathbf{A}\mathbf{X} + \mathbf{b}$，其中 $\mathbf{A}$ 是 $m \times p$ 的常数矩阵，$\mathbf{b} \in \R^m$。由期望的线性性（2.3 节），

$$
E[\mathbf{Y}] = \mathbf{A}E[\mathbf{X}] + \mathbf{b}
$$

协方差矩阵的变换为

$$
\mathrm{Cov}(\mathbf{Y}) = E\left[\mathbf{A}(\mathbf{X} - E[\mathbf{X}])(\mathbf{X} - E[\mathbf{X}])^T \mathbf{A}^T\right] = \mathbf{A} \Sigma \mathbf{A}^T
$$

两条公式不需要任何分布假设，只用到期望的线性性。$\mathbf{A}\Sigma\mathbf{A}^T$ 的半正定性由 $\Sigma$ 的半正定性得到，说明线性变换保持协方差矩阵的合法结构。

### 线性变换的三种典型作用

同样的公式在不同 $\mathbf{A}$ 下有不同的解释。取 $\mathbf{A}$ 为行向量 $\mathbf{a}^T$ 时，$\mathbf{Y} = \mathbf{a}^T\mathbf{X}$ 是标量，方差为 $\mathbf{a}^T \Sigma \mathbf{a}$，这一形式在投资组合方差、线性判别与投影方向的选择中反复出现。取 $\mathbf{A}$ 为对角矩阵时，变换对每个分量单独做缩放，协方差按 $a_i a_j$ 缩放，相关系数不变。取 $\mathbf{A}$ 为可逆方阵时，变换可视为坐标系的更换，协方差矩阵随之做合同变换。

结合线性代数部分的结果，$\Sigma$ 的特征分解给出坐标变换的最优选择：$\Sigma = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^T$，取 $\mathbf{A} = \boldsymbol{\Lambda}^{-1/2}\mathbf{Q}^T$ 得到 $\mathrm{Cov}(\mathbf{Y}) = \mathbf{I}$。这一变换称为**白化**（whitening），它把相关的分量变成互不相关且方差为 $1$ 的分量，是主成分分析与信号处理中的标准预处理步骤。

### 连续情形的密度变换

若 $\mathbf{Y} = g(\mathbf{X})$ 是一一对应的可微变换，则密度按雅可比行列式变换：

$$
f_{\mathbf{Y}}(\mathbf{y}) = f_{\mathbf{X}}\left(g^{-1}(\mathbf{y})\right) \left|\det \frac{\partial g^{-1}}{\partial \mathbf{y}}\right|
$$

2.2 节已在单个变量的情形给出这一公式，多维版本多出的只是雅可比矩阵的行列式。行列式绝对值度量变换对体积的局部缩放，出现在分母上起补偿作用，使变换后的密度仍积分为 $1$。仿射变换 $g(\mathbf{X}) = \mathbf{A}\mathbf{X} + \mathbf{b}$ 的雅可比矩阵是常数 $\mathbf{A}$，行列式也是常数，因此密度的形状由 $\mathbf{A}$ 的尺度决定。

```python
import numpy as np

rng = np.random.default_rng(12)
Sigma = np.array([[2.0, 0.8], [0.8, 1.0]])
X = rng.multivariate_normal([1.0, -1.0], Sigma, size=200_000)

A = np.array([[1.5, 0.0], [-0.5, 2.0]])
b = np.array([0.5, 1.0])
Y = X @ A.T + b

print(f"变换后均值：模拟 {np.round(Y.mean(axis=0), 4)}，理论 {np.round(A @ np.array([1.0, -1.0]) + b, 4)}")
print(f"变换后协方差：\n{np.round(np.cov(Y.T), 4)}")
print(f"理论值：\n{np.round(A @ Sigma @ A.T, 4)}")
```

## 2.6.6 多元正态分布

### 定义与密度

**多元正态分布**（multivariate normal distribution）由均值向量 $\boldsymbol{\mu} \in \R^p$ 与协方差矩阵 $\boldsymbol{\Sigma}$（对称正定）确定，记作 $\mathbf{X} \sim N_p(\boldsymbol{\mu}, \boldsymbol{\Sigma})$，密度为

$$
f(\mathbf{x}) = \frac{1}{(2\pi)^{p/2} |\boldsymbol{\Sigma}|^{1/2}} \exp\left[-\frac{1}{2}(\mathbf{x} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})\right]
$$

指数中的二次型

$$
d^2(\mathbf{x}) = (\mathbf{x} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})
$$

称为**马哈拉诺比斯距离**（Mahalanobis distance）的平方。它用协方差矩阵的逆做加权，把不同方向的尺度差异消除，于是**等密度面是椭球**：$d^2(\mathbf{x}) = c^2$ 定义的椭球内部概率只依赖 $c$，与 $\boldsymbol{\mu}$、$\boldsymbol{\Sigma}$ 的具体取值无关。椭球的主轴方向是 $\boldsymbol{\Sigma}$ 的特征向量，轴长与特征值的平方根成正比，这一几何图像把 2.6.5 节的白化变换解释清楚：白化后椭球变成单位球。

### 二次型的分布

若 $\mathbf{X} \sim N_p(\boldsymbol{\mu}, \boldsymbol{\Sigma})$，则

$$
(\mathbf{X} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{X} - \boldsymbol{\mu}) \sim \chi^2(p)
$$

这一结论把多元正态与卡方分布联系起来，用于构造椭圆置信域与异常检测的判据：把马氏距离平方与 $\chi^2(p)$ 的 $1 - \alpha$ 分位数比较，超过阈值则判为异常观测。与逐分量比较相比，马氏距离考虑了变量之间的相关，误报率更容易控制。

### 四条核心性质

**性质 1（线性变换封闭）**：$\mathbf{A}\mathbf{X} + \mathbf{b} \sim N_m(\mathbf{A}\boldsymbol{\mu} + \mathbf{b}, \mathbf{A}\boldsymbol{\Sigma}\mathbf{A}^T)$。任何线性组合仍服从正态分布，这是多元正态最重要的性质，也是后面三个公式的推导基础。

**性质 2（边缘分布为正态）**：任取若干分量组成的子向量仍服从多元正态，参数由 $\boldsymbol{\mu}$、$\boldsymbol{\Sigma}$ 的对应子块给出。

**性质 3（条件分布为正态）**：在给定部分分量取值的条件下，其余分量服从正态分布，参数由高斯条件公式给出。

**性质 4（不相关等价于独立）**：多元正态中 $\mathrm{Cov}(X_i, X_j) = 0$ 蕴含 $X_i$ 与 $X_j$ 独立。一般分布中不相关推不出独立（2.3 节的例子里 $Y = X^2$ 就是不相关的非独立变量对），这一等价性是多元正态特有的，它使相关矩阵的零结构可以直接读作独立性。

## 2.6.7 高斯边缘、条件与乘积公式

把随机向量按 $(X_1, X_2)$ 分块，均值与协方差相应分块：

$$
\boldsymbol{\mu} = \begin{bmatrix} \boldsymbol{\mu}_1 \\ \boldsymbol{\mu}_2 \end{bmatrix}, \qquad
\boldsymbol{\Sigma} = \begin{bmatrix} \boldsymbol{\Sigma}_{11} & \boldsymbol{\Sigma}_{12} \\ \boldsymbol{\Sigma}_{21} & \boldsymbol{\Sigma}_{22} \end{bmatrix}
$$

三个公式给出分块情形下的运算结果。

**边缘公式**：直接取子块，

$$
\mathbf{X}_1 \sim N(\boldsymbol{\mu}_1, \boldsymbol{\Sigma}_{11}), \qquad \mathbf{X}_2 \sim N(\boldsymbol{\mu}_2, \boldsymbol{\Sigma}_{22})
$$

**条件公式**：

$$
\mathbf{X}_1 \mid \mathbf{X}_2 = \mathbf{x}_2 \ \sim \ N\left(\boldsymbol{\mu}_1 + \boldsymbol{\Sigma}_{12}\boldsymbol{\Sigma}_{22}^{-1}(\mathbf{x}_2 - \boldsymbol{\mu}_2), \ \boldsymbol{\Sigma}_{11} - \boldsymbol{\Sigma}_{12}\boldsymbol{\Sigma}_{22}^{-1}\boldsymbol{\Sigma}_{21}\right)
$$

条件均值是 $\mathbf{x}_2$ 的仿射函数，斜率由 $\boldsymbol{\Sigma}_{12}\boldsymbol{\Sigma}_{22}^{-1}$ 给出，这就是线性回归系数在联合正态假设下的形式。条件协方差与 $\mathbf{x}_2$ 无关，只由原始协方差决定，且 $(\boldsymbol{\Sigma}_{11} - \boldsymbol{\Sigma}_{12}\boldsymbol{\Sigma}_{22}^{-1}\boldsymbol{\Sigma}_{21})$ 是 $\boldsymbol{\Sigma}_{22}$ 在 $\boldsymbol{\Sigma}_{11}$ 中的**舒尔补**，它总不超过 $\boldsymbol{\Sigma}_{11}$，说明观测到 $\mathbf{X}_2$ 会降低对 $\mathbf{X}_1$ 的不确定性。

**乘积公式**：两个关于同一变量的正态密度相乘，结果仍是正态密度，

$$
N(\mathbf{x}; \boldsymbol{\mu}_1, \boldsymbol{\Sigma}_1) \cdot N(\mathbf{x}; \boldsymbol{\mu}_2, \boldsymbol{\Sigma}_2) \propto N\left(\mathbf{x}; \boldsymbol{\mu}_3, \boldsymbol{\Sigma}_3\right)
$$

其中

$$
\boldsymbol{\Sigma}_3 = \left(\boldsymbol{\Sigma}_1^{-1} + \boldsymbol{\Sigma}_2^{-1}\right)^{-1}, \qquad \boldsymbol{\mu}_3 = \boldsymbol{\Sigma}_3\left(\boldsymbol{\Sigma}_1^{-1}\boldsymbol{\mu}_1 + \boldsymbol{\Sigma}_2^{-1}\boldsymbol{\mu}_2\right)
$$

精度矩阵相加、精度加权的均值取组合，是这条公式的简洁表达。三个公式的联系在贝叶斯推断中体现得最清楚：先验 $N(\boldsymbol{\mu}_0, \boldsymbol{\Sigma}_0)$ 与似然 $N(\mathbf{y}; \mathbf{H}\boldsymbol{\theta}, \mathbf{R})$ 通过乘积公式得到后验，而对联合正态 $(\boldsymbol{\theta}, \mathbf{y})$ 应用条件公式得到的结果完全相同。卡尔曼滤波的更新步、高斯过程回归的预测公式、贝叶斯线性回归的后验都是这三条公式的应用。

```python
import numpy as np

# 条件公式的矩阵实现
mu = np.array([1.0, 2.0, -1.0])
Sigma = np.array([
    [2.0, 0.6, 0.3],
    [0.6, 1.5, 0.4],
    [0.3, 0.4, 1.0],
])

def gaussian_conditional(mu, Sigma, idx_a, idx_b, x_b):
    """给定下标集合 b 的取值，返回下标集合 a 的条件均值与条件协方差"""
    S_aa = Sigma[np.ix_(idx_a, idx_a)]
    S_ab = Sigma[np.ix_(idx_a, idx_b)]
    S_bb = Sigma[np.ix_(idx_b, idx_b)]
    cond_mean = mu[idx_a] + S_ab @ np.linalg.solve(S_bb, x_b - mu[idx_b])
    cond_cov = S_aa - S_ab @ np.linalg.solve(S_bb, Sigma[np.ix_(idx_b, idx_a)])
    return cond_mean, cond_cov

cm, cc = gaussian_conditional(mu, Sigma, [0], [1, 2], np.array([2.5, 0.0]))
print(f"条件均值 = {cm[0]:.4f}")
print(f"条件方差 = {cc[0, 0]:.4f}")

# 模拟验证
rng = np.random.default_rng(18)
s = rng.multivariate_normal(mu, Sigma, size=500_000)
mask = (np.abs(s[:, 1] - 2.5) < 0.02) & (np.abs(s[:, 2]) < 0.02)
print(f"模拟条件均值 = {s[mask][:, 0].mean():.4f}，条件方差 = {s[mask][:, 0].var():.4f}")
```

## 2.6.8 混合模型与隐变量模型

### 混合分布与高斯混合模型

**混合模型**（mixture model）把总体看成若干子总体的加权组合，密度为

$$
f(\mathbf{x}) = \sum_{k=1}^{K} \pi_k f_k(\mathbf{x}), \qquad \pi_k \geq 0, \quad \sum_{k=1}^{K} \pi_k = 1
$$

分量取高斯分布时得到**高斯混合模型**（Gaussian mixture model，GMM）：

$$
f(\mathbf{x}) = \sum_{k=1}^{K} \pi_k N(\mathbf{x}; \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)
$$

参数包括权重 $\pi_k$、各分量的均值 $\boldsymbol{\mu}_k$ 与协方差 $\boldsymbol{\Sigma}_k$。GMM 的密度形状灵活，可以描述多峰分布与弯曲的等密度带，一维情形下已经可以逼近任意连续密度（分量数足够多时）。

### 隐变量视角与 EM 算法

混合模型可以写成两层的生成过程：先按权重抽取分量标签 $Z \in \{1, \ldots, K\}$，再从被选中的分量中抽取观测。标签 $Z$ 不可观测，称为**隐变量**（latent variable）。引入隐变量后，观测的似然需要把 $Z$ 边缘化掉，得到上面那个求和形式。

参数估计遇到困难的原因就在这里：对数似然为 $\sum_i \log \sum_k \pi_k f_k(\mathbf{x}_i)$，对数内有求和，求导后参数耦合在一起，没有闭式解。**期望最大化算法**（expectation-maximization，EM）用交替两步解决：期望步按当前参数计算每个观测属于各分量的后验概率（**软分配**），最大化步用这些后验加权更新参数。可以证明每次迭代不降低观测数据的似然，算法收敛到局部极大值。2.12 节会再次用到 EM，把它作为变分推断与 MCMC 之外的第三条推断路线。

```python
import numpy as np
from scipy import stats

# 一维高斯混合：三个分量的加权密度与采样
weights = np.array([0.5, 0.3, 0.2])
mus = np.array([-2.0, 1.0, 4.0])
sigmas = np.array([0.6, 0.9, 0.5])

rng = np.random.default_rng(21)
n = 20_000
z = rng.choice(len(weights), size=n, p=weights)
x = rng.normal(mus[z], sigmas[z])

def mixture_pdf(x, weights, mus, sigmas):
    return sum(w * stats.norm(mu, s).pdf(x) for w, mu, s in zip(weights, mus, sigmas))

grid = np.array([-2.0, 0.0, 2.0, 4.0])
print("模拟直方图高度与理论密度对照")
hist, edges = np.histogram(x, bins=40, density=True)
centers = 0.5 * (edges[:-1] + edges[1:])
for g in grid:
    j = np.argmin(np.abs(centers - g))
    print(f"  x = {g:5.1f}：直方图 {hist[j]:.4f}，理论 {mixture_pdf(g, weights, mus, sigmas):.4f}")
```

### 因子模型、概率主成分分析与独立成分分析

隐变量的另一种用法是把高维观测表示为少数潜在因子的线性组合：

$$
\mathbf{x} = \mathbf{W}\mathbf{z} + \boldsymbol{\mu} + \boldsymbol{\epsilon}, \qquad \mathbf{z} \sim N(\mathbf{0}, \mathbf{I}), \quad \boldsymbol{\epsilon} \sim N(\mathbf{0}, \boldsymbol{\Psi})
$$

$\mathbf{z}$ 的维数低于 $\mathbf{x}$，$\mathbf{W}$ 是因子载荷矩阵，$\boldsymbol{\Psi}$ 通常取对角矩阵。这一构造称为**因子模型**（factor model），它把协方差结构写成低秩部分加对角部分：

$$
\mathrm{Cov}(\mathbf{x}) = \mathbf{W}\mathbf{W}^T + \boldsymbol{\Psi}
$$

**概率主成分分析**（probabilistic PCA）是 $\boldsymbol{\Psi} = \sigma^2\mathbf{I}$ 的特例，此时最大似然解的主子空间与普通 PCA 一致，多出的是噪声方差的估计与概率解释，使缺失值处理与贝叶斯扩展成为可能。**独立成分分析**（independent component analysis，ICA）把假设反过来：因子 $\mathbf{z}$ 的分量独立但非高斯，通过最大化非高斯性恢复混合矩阵，用于盲源分离。它与 PCA 的区别在于 PCA 用二阶矩寻找不相关方向，ICA 用高阶信息寻找独立方向。

## 2.6.9 copula 与依赖结构

### Sklar 定理

边缘分布与依赖结构是两件可以分开处理的事。**Sklar 定理**把这一直觉形式化：任意联合分布函数 $F$ 都可以写成

$$
F(x_1, \ldots, x_p) = C\left(F_1(x_1), \ldots, F_p(x_p)\right)
$$

其中 $F_i$ 是边缘分布函数，$C: [0, 1]^p \to [0, 1]$ 是一个**copula 函数**。边缘分布为连续时 $C$ 唯一确定。copula 是一个各边缘均为均匀分布的多元分布，它只承载依赖信息，与边缘的形态无关。

连续情形下对两边求导得到密度分解：

$$
f(x_1, \ldots, x_p) = c\left(F_1(x_1), \ldots, F_p(x_p)\right) \prod_{i=1}^{p} f_i(x_i)
$$

其中 $c$ 是 copula 密度。这一形式说明联合密度等于各边缘密度乘以一个只描述依赖的因子。建模时的实际意义是：可以分别对每个变量选择拟合最好的边缘分布，再单独选择 copula 描述它们之间的依赖，不必为整个联合分布寻找一个能同时兼顾两方面的参数族。

### 常用 copula

**高斯 copula** 由多元正态的相关矩阵构造：

$$
C(u_1, \ldots, u_p) = \Phi_p\left(\Phi^{-1}(u_1), \ldots, \Phi^{-1}(u_p); \mathbf{R}\right)
$$

它用相关系数矩阵编码依赖，尾部没有额外的相依结构，适合描述中心区域的关联。**t copula** 在变换中使用 t 分布，能刻画尾部同步出现的倾向，风险建模中常用。**阿基米德 copula** 族（Clayton、Gumbel、Frank 等）由生成函数构造，形式简单、参数少，适合描述单一方向的尾部依赖。**藤 copula**（vine copula）把高维依赖分解为一系列二元 copula 的层次结构，按树的顺序逐层指定条件依赖，参数量随维数线性增长，是当前高维依赖建模的常用框架。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(24)
n = 50_000
R = np.array([[1.0, 0.75], [0.75, 1.0]])

# 高斯 copula 采样：先生成相关正态，再逐分量做概率积分变换
z = rng.multivariate_normal([0, 0], R, size=n)
u = stats.norm.cdf(z)

# 施加任意边缘分布：这里用指数与对数正态
x1 = stats.expon(scale=2.0).ppf(u[:, 0])
x2 = stats.lognorm(s=0.8).ppf(u[:, 1])

print(f"变换后 X1 的均值 = {x1.mean():.4f}，理论值 = {2.0:.4f}")
print(f"变换后 X2 的均值 = {x2.mean():.4f}，理论值 = {np.exp(0.8**2/2):.4f}")
print(f"变换后秩相关 = {stats.spearmanr(x1, x2).statistic:.4f}")   # 接近 0.75 附近的单调关联
```

## 2.6.10 本节小结

::: success 从联合分布到依赖结构
本节把一维的分布语言扩展到随机向量。联合分布包含全部分量之间的依赖信息，边缘化与条件化是两个方向的操作：前者丢掉依赖、得到单个分量的规律，后者固定部分分量、得到其余分量的条件分布，回归函数与贝叶斯推断都建立在这一操作上。独立性与条件独立在多维情形中的差别由共因、链式与对撞三种结构刻画，控制对撞变量会引入关联这一结论在变量选择与因果推断中反复出现。协方差矩阵与相关矩阵度量二阶关联，精度矩阵度量条件关联，偏相关与典型相关把关联分析扩展到控制其他变量与两组变量的情形。多元正态分布性质完整：线性变换封闭、边缘与条件分布仍为正态、不相关等价于独立，高斯边缘、条件与乘积三个公式贯穿贝叶斯线性回归、卡尔曼滤波与高斯过程。混合模型与隐变量模型用低维潜在结构解释高维观测，copula 把边缘分布与依赖结构分离，两者分别处理总体异质性与依赖形态的建模问题。
:::

到这里，概率论的基础工具已经齐备：事件与条件概率、随机变量与分布、数字特征、常见分布族、多维结构与依赖，以及下一节的极限定理。剩下的问题是一个实用问题：这些工具在样本量有限时表现如何，误差以什么速度收敛，能否在不知道具体分布的情况下给出可靠的概率界。下一节讨论收敛模式、大数定律、中心极限定理与集中不等式，把前面各节的结果组织成一套关于大样本行为与误差控制的结论。

## 练习题

### 第 1 题 概念推导

设二元正态 $\mathbf{X} = (X_1, X_2)^T \sim N_2(\boldsymbol{\mu}, \boldsymbol{\Sigma})$，其中

$$
\boldsymbol{\mu} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}, \qquad \boldsymbol{\Sigma} = \begin{bmatrix} \sigma_1^2 & \rho \sigma_1 \sigma_2 \\ \rho \sigma_1 \sigma_2 & \sigma_2^2 \end{bmatrix}
$$

请写出 $X_1 \mid X_2 = x_2$ 的条件分布，说明条件均值关于 $x_2$ 的斜率与相关系数的关系；再说明 $\rho = 0$ 时条件分布如何退化，并解释这一结果与独立性判别的联系。

::: details 参考答案
由条件公式，$\boldsymbol{\Sigma}_{12} = \rho \sigma_1 \sigma_2$，$\boldsymbol{\Sigma}_{22} = \sigma_2^2$，故

$$
X_1 \mid X_2 = x_2 \ \sim \ N\left(\rho \frac{\sigma_1}{\sigma_2} x_2, \ \sigma_1^2(1 - \rho^2)\right)
$$

条件均值的斜率为 $\rho \sigma_1 / \sigma_2$。把它写成相关系数的形式 $\rho \cdot \sigma_1 / \sigma_2$ 可以看出斜率由两部分组成：相关系数决定关联的强度与方向，标准差之比把两个变量的量纲差异折算过来。这正是线性回归系数在联合正态假设下的表达式。

条件方差为 $\sigma_1^2(1 - \rho^2)$，与 $x_2$ 无关，说明条件分布的宽度不随观测值改变，这一点是正态分布特有的。$\rho = 0$ 时条件分布退化为 $N(0, \sigma_1^2)$，与 $X_1$ 的边缘分布完全相同。条件分布不随 $X_2$ 的取值变化，说明 $X_2$ 的信息对 $X_1$ 没有影响，这给出独立性的判别：在联合正态假设下，$\rho = 0$ 意味着独立。若 $X_1$ 与 $X_2$ 联合正态但计算出的相关系数为零，可以直接判定两者独立，不需要再检查其他条件；一般分布没有这一便利。
:::

### 第 2 题 计算推理

某电商平台记录两个指标：页面停留时间 $X$（分钟）与下单金额 $Y$（元）。已知 $\log X$ 与 $\log Y$ 的联合分布近似正态，均值分别为 $\mu_1 = 1.0$、$\mu_2 = 2.5$，标准差分别为 $\sigma_1 = 0.5$、$\sigma_2 = 0.8$，相关系数 $\rho = 0.6$。求给定 $\log X = 1.5$ 时 $\log Y$ 的条件均值与条件标准差；若某用户停留时间的对数为 $1.5$，请给出下单金额中位数的估计。

::: details 参考答案
条件均值：

$$
E[\log Y \mid \log X = 1.5] = 2.5 + 0.6 \times \frac{0.8}{0.5} \times (1.5 - 1.0) = 2.5 + 0.96 \times 0.5 = 2.98
$$

条件方差：

$$
\mathrm{Var}(\log Y \mid \log X = 1.5) = 0.8^2 \times (1 - 0.6^2) = 0.64 \times 0.64 = 0.4096
$$

条件标准差为 $\sqrt{0.4096} = 0.64$。

下单金额 $Y$ 服从对数正态分布（条件于 $\log X = 1.5$），对数正态分布的中位数等于 $e^{\mu}$，其中 $\mu$ 是取对数后的均值。因此中位数的估计为

$$
e^{2.98} \approx 19.69 \text{ 元}
$$

注意这里用中位数而不是均值。对数正态的均值需要 $e^{\mu + \sigma^2/2}$，代入条件参数的均值约为 $e^{2.98 + 0.4096/2} \approx 24.23$ 元，高于中位数。报告中心趋势时说明用的是哪一个量。
:::

### 第 3 题 代码验证

用模拟验证多元正态的两条性质：其一，对 $\mathbf{X} \sim N_2(\boldsymbol{\mu}, \boldsymbol{\Sigma})$ 做线性变换后仍为正态，且均值与协方差符合 $\mathbf{A}\boldsymbol{\mu} + \mathbf{b}$ 与 $\mathbf{A}\boldsymbol{\Sigma}\mathbf{A}^T$；其二，马氏距离的平方服从自由度为 $p$ 的卡方分布。再用高斯 copula 生成一组边缘为指数分布、相关结构接近 $0.7$ 的样本。

::: details 参考答案

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(33)
mu = np.array([1.0, -2.0])
Sigma = np.array([[1.5, 0.5], [0.5, 2.0]])
n = 300_000
X = rng.multivariate_normal(mu, Sigma, size=n)

# 线性变换
A = np.array([[2.0, 1.0], [0.0, -1.5]])
b = np.array([0.5, 0.0])
Y = X @ A.T + b
print("变换后均值（模拟/理论）：",
      np.round(Y.mean(axis=0), 4), np.round(A @ mu + b, 4))
print("变换后协方差（模拟）：\n", np.round(np.cov(Y.T), 4))
print("理论值：\n", np.round(A @ Sigma @ A.T, 4))

# 马氏距离平方的分布
d2 = np.einsum("ij,jk,ik->i", X - mu, np.linalg.inv(Sigma), X - mu)
print(f"马氏距离平方的均值 = {d2.mean():.4f}，χ²(2) 的均值 = 2")
print(f"95% 分位数：模拟 {np.percentile(d2, 95):.4f}，理论 {stats.chi2(2).ppf(0.95):.4f}")

# 高斯 copula
R = np.array([[1.0, 0.7], [0.7, 1.0]])
z = rng.multivariate_normal([0, 0], R, size=n)
u = stats.norm.cdf(z)
x1 = stats.expon(scale=1.0).ppf(u[:, 0])
x2 = stats.lognorm(s=0.5).ppf(u[:, 1])
print(f"X1 均值 = {x1.mean():.4f}（理论 1），X2 均值 = {x2.mean():.4f}（理论 {np.exp(0.125):.4f}）")
print(f"X1 与 X2 的 Kendall 相关系数 = {stats.kendalltau(x1, x2).statistic:.4f}")
```

线性变换的均值与协方差与理论值一致，说明两个公式只依赖二阶矩，不需要正态假设；马氏距离平方的分位数与卡方分布吻合，验证了二次型的分布结论。copula 部分说明依赖结构与边缘分布可以分别设定：两个变量的边缘改为指数与对数正态后，关联强度由正态部分的相关矩阵决定。
:::

### 第 4 题 综合应用

某推荐系统需要衡量用户特征与物品特征之间的关联。已知两组特征向量分别服从 $N_p(\boldsymbol{\mu}_X, \boldsymbol{\Sigma}_{XX})$ 与 $N_q(\boldsymbol{\mu}_Y, \boldsymbol{\Sigma}_{YY})$，联合协方差中两者的交叉块为 $\boldsymbol{\Sigma}_{XY}$。请说明典型相关分析要解决什么问题，给出第一对典型相关系数的求解思路，并解释它比逐对计算相关系数的优势。

::: details 参考答案
**要解决的问题**：两组变量之间的关联无法用单个相关系数概括。逐对计算 $p \times q$ 个相关系数会得到一张表格，缺少一个总括指标，且各对之间可能高度相关，难以判断真正的关联强度。

**求解思路**：寻找线性组合 $\mathbf{a}^T\mathbf{X}$ 与 $\mathbf{b}^T\mathbf{Y}$，使两者的相关系数

$$
\rho(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a}^T \boldsymbol{\Sigma}_{XY} \mathbf{b}}{\sqrt{\mathbf{a}^T \boldsymbol{\Sigma}_{XX} \mathbf{a}} \cdot \sqrt{\mathbf{b}^T \boldsymbol{\Sigma}_{YY} \mathbf{b}}}
$$

最大。对 $\mathbf{a}$、$\mathbf{b}$ 的尺度不敏感，可以固定分母为 $1$ 后求解约束优化。令 $\mathbf{u} = \boldsymbol{\Sigma}_{XX}^{1/2}\mathbf{a}$，$\mathbf{v} = \boldsymbol{\Sigma}_{YY}^{1/2}\mathbf{b}$，问题化为在单位约束下最大化 $\mathbf{u}^T \mathbf{M} \mathbf{v}$，其中

$$
\mathbf{M} = \boldsymbol{\Sigma}_{XX}^{-1/2} \boldsymbol{\Sigma}_{XY} \boldsymbol{\Sigma}_{YY}^{-1/2}
$$

最优值与最优向量由 $\mathbf{M}$ 的奇异值分解给出：最大奇异值是第一典型相关系数，对应的左、右奇异向量给出两个线性组合的系数。后续各对在与前面各对正交的约束下依次求解，可取的典型变量对数不超过 $\min(p, q)$。

**优势**：典型相关把两组的关联压缩为若干个典型相关系数，每一对给出一个独立的关联方向，且第一个系数给出线性关联强度的上界，任何单个变量对的相关系数都不会超过它。这一性质使它在跨模态检索、多视角学习与特征融合中作为关联度量使用。
:::

## 常见错误

**错误 1 · 由边缘分布推测联合分布**

原因：边缘分布不包含依赖信息，相同的边缘可以对应完全不同的依赖结构。两个标准正态变量既可以完全正相关、完全负相关，也可以独立，甚至构造出尾部相依而中心独立的 copula 结构，四种情形下的边缘分布完全相同。

解决：需要依赖信息时必须指定联合分布或 copula。从数据出发时，先估计边缘分布与秩相关，再选择能容纳该依赖形态的 copula 族；检验依赖结构时避免使用只能度量线性关联的统计量。

**错误 2 · 把不相关当作独立**

原因：相关系数度量的是线性关联。$Y = X^2$ 与 $X$ 的相关系数为零，但两者明显不独立。多元正态是例外：在联合正态下不相关确实等价于独立，这一便利条件被错误地推广到所有分布上。

解决：判断独立性时用定义检查联合密度能否分解，或使用能捕捉非线性依赖的度量，如距离相关、互信息、基于秩的独立性检验。只有在确认联合正态之后，才可以把相关系数为零读作独立。

**错误 3 · 控制对撞变量后误读关联**

原因：对撞结构下端点的两个变量边际独立，条件化后反而出现关联。在数据分析中把对撞变量当作混杂变量放进回归，会人为引入关联，甚至反转原有关系。这类偏倚与 2.14 节讨论的因果推断问题同源。

解决：把变量放入模型前先想清楚它在依赖结构中的位置。用因果图或结构假设画出变量之间的方向，判断待控制的变量是否为对撞节点；无法确定方向时，报告控制与不控制两种情形下的结果，说明结论对变量选择方式的敏感性。

**错误 4 · 混淆协方差矩阵与精度矩阵的非对角元**

原因：协方差矩阵的非对角元度量边际关联，精度矩阵的非对角元度量条件关联，两者数值与含义都不同。把 $\Sigma^{-1}$ 的元素直接当成某个相关系数使用，会得到方向或大小错误的结论。

解决：报告边际关联时用 $\Sigma$ 或相关矩阵，报告条件关联时用 $\Sigma^{-1}$ 或偏相关公式。判断条件独立性时检查 $\Sigma^{-1}$ 的对应元素是否为零，判断边际独立性时检查 $\Sigma$ 的对应元素。