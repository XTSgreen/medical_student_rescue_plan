---
title: 2.10 点估计与区间估计
sidebar:
  order: 10
---
# 2.10 点估计与区间估计

2.9 节把统计推断的问题设定清楚：总体分布含未知参数 $\theta$，样本 $X_1, \ldots, X_n$ 从总体中抽取，推断的任务是在只看到样本的条件下给出关于 $\theta$ 的判断。判断有两种形式。一种是给出一个数值，称为**点估计**（point estimation）；另一种是给出一个区间并声明该区间覆盖真值的概率，称为**区间估计**（interval estimation）。两种形式回答的问题不同：点估计回答参数大约是多少，区间估计回答参数可能落在哪个范围，以及这个范围的可信程度。

本节先讨论点估计的构造方法，从矩估计与极大似然估计这两条最常用的路径出发，再引入稳健估计、收缩估计与非参数估计；随后转向区间估计，讲清置信区间的定义、枢轴量方法、三大渐近区间与自助法区间；最后说明贝叶斯可信区间、预测区间与容忍区间的区别。估计量的评价标准（无偏性、方差、均方误差、有效性）已在 2.9 节给出，本节直接使用这些标准比较不同方法。

## 2.10.1 矩估计与极大似然估计

### 构造估计量的两条基本路径

参数未知，样本已知，估计的任务是把样本中的信息转化为关于参数的数值。信息转化需要一条原则。**矩估计法**（method of moments）的原则是让样本矩等于总体矩：用样本均值代替总体均值、用样本方差代替总体方差，由此解出参数。**极大似然估计**（maximum likelihood estimation，MLE）的原则是选择使观测数据出现概率最大的参数值。两种原则都能生成估计量，极大似然估计在大样本下具有更好的性质，是实际使用中最主要的方法。

### 矩估计法

设总体分布含 $k$ 个未知参数 $\theta_1, \ldots, \theta_k$，总体的前 $k$ 阶原点矩为 $\mu_j(\theta_1, \ldots, \theta_k) = E[X^j]$，样本的前 $k$ 阶原点矩为

$$
\hat{\mu}_j = \frac{1}{n} \sum_{i=1}^{n} X_i^j
$$

令两者相等得到方程组

$$
\mu_j(\theta_1, \ldots, \theta_k) = \hat{\mu}_j, \qquad j = 1, \ldots, k
$$

解出的 $\hat{\theta}_1, \ldots, \hat{\theta}_k$ 就是矩估计量。由大数定律（2.7 节），样本矩依概率收敛到总体矩，在函数连续的条件下解也依概率收敛到真值，因此矩估计通常具有一致性。

均匀分布 $U(a, b)$ 是矩估计的典型例子。总体的均值与方差为 $E[X] = (a + b)/2$，$\mathrm{Var}(X) = (b - a)^2 / 12$。用样本均值 $\bar{X}$ 与样本方差 $S^2$ 代替，解方程组得

$$
\hat{a} = \bar{X} - \sqrt{3 S^2}, \qquad \hat{b} = \bar{X} + \sqrt{3 S^2}
$$

矩估计的优点是计算简单，不需要优化。缺点是它只用到了矩的信息，可能浪费样本中的其他信息，得到的估计量往往不是有效估计。

### 极大似然估计

设样本的联合密度（或概率质量函数）为 $f(x_1, \ldots, x_n; \theta)$。在独立同分布假设下这个函数等于 $\prod_{i=1}^n f(x_i; \theta)$。把观测值代入后，它是参数 $\theta$ 的函数，称为**似然函数**（likelihood function）：

$$
L(\theta) = \prod_{i=1}^{n} f(x_i; \theta)
$$

似然函数的含义是把数据看作已知、把参数看作变量时，数据在不同参数下的相对可能性。极大似然估计取使 $L(\theta)$ 最大的参数值：

$$
\hat{\theta}_{\text{MLE}} = \arg\max_{\theta \in \Theta} L(\theta)
$$

乘积形式不便于求导，通常改为最大化**对数似然**（log-likelihood）

$$
\ell(\theta) = \log L(\theta) = \sum_{i=1}^{n} \log f(x_i; \theta)
$$

对数是单调递增函数，最大化 $L$ 与最大化 $\ell$ 等价，而求和形式求导更方便。若 $\ell$ 可微且最大值在参数空间内部取得，估计量满足**得分方程**（score equation）

$$
\ell'(\theta) = \sum_{i=1}^{n} \frac{\partial}{\partial \theta} \log f(x_i; \theta) = 0
$$

得分方程的解不一定是最大值点，需要验证二阶条件或检查边界，这一点在数值优化中尤其重要。

**正态分布的极大似然估计**。设 $X_i \sim N(\mu, \sigma^2)$，对数似然为

$$
\ell(\mu, \sigma^2) = -\frac{n}{2} \log(2\pi) - \frac{n}{2} \log \sigma^2 - \frac{1}{2\sigma^2} \sum_{i=1}^{n} (X_i - \mu)^2
$$

对 $\mu$ 求偏导并令其为零，得 $\hat{\mu} = \bar{X}$。对 $\sigma^2$ 求偏导得

$$
\frac{\partial \ell}{\partial \sigma^2} = -\frac{n}{2\sigma^2} + \frac{1}{2\sigma^4} \sum_{i=1}^{n} (X_i - \mu)^2 = 0
$$

代入 $\hat{\mu}$ 得到 $\hat{\sigma}^2 = \frac{1}{n} \sum_{i=1}^{n} (X_i - \bar{X})^2$。注意这里的分母是 $n$，而 2.9 节介绍的无偏样本方差分母是 $n - 1$。极大似然估计的方差估计量是有偏的，偏差为 $-\sigma^2 / n$；当 $n$ 较大时偏差可忽略，样本量小时应以无偏估计为准。

**指数分布的极大似然估计**。设 $X_i \sim \mathrm{Exp}(\lambda)$，密度为 $\lambda e^{-\lambda x}$，对数似然为

$$
\ell(\lambda) = n \log \lambda - \lambda \sum_{i=1}^{n} X_i
$$

令 $\ell'(\lambda) = n / \lambda - \sum X_i = 0$，得 $\hat{\lambda} = 1 / \bar{X}$。这个例子说明极大似然估计不要求估计量是样本的线性函数，参数经过变换后估计量也随之变换，这就是**不变性**（invariance）：若 $\hat{\theta}$ 是 $\theta$ 的极大似然估计，则 $g(\hat{\theta})$ 是 $g(\theta)$ 的极大似然估计。

```python
import numpy as np
from scipy import stats, optimize

rng = np.random.default_rng(7)
x = rng.gamma(shape=2.0, scale=3.0, size=500)   # 真值：形状 2，尺度 3

# 极大似然：数值最大化对数似然
def neg_loglik(params):
    shape, scale = params
    if shape <= 0 or scale <= 0:
        return np.inf
    return -np.sum(stats.gamma.logpdf(x, a=shape, scale=scale))

res = optimize.minimize(neg_loglik, x0=[1.0, 1.0], method="Nelder-Mead")
print(f"形状的 MLE = {res.x[0]:.3f}，尺度的 MLE = {res.x[1]:.3f}")   # 接近 2 与 3

# 矩估计：用样本均值与样本方差解出形状与尺度
mean, var = x.mean(), x.var()
shape_mom = mean ** 2 / var
scale_mom = var / mean
print(f"形状的矩估计 = {shape_mom:.3f}，尺度的矩估计 = {scale_mom:.3f}")
```

### 估计量的渐近分布

极大似然估计在正则条件下具有渐近正态性，且渐近方差由 Fisher 信息决定：

$$
\sqrt{n}\left(\hat{\theta}_{\text{MLE}} - \theta\right) \xrightarrow{d} N\left(0, \frac{1}{I(\theta)}\right)
$$

其中 $I(\theta)$ 是单个观测的 Fisher 信息。这一结论说明极大似然估计达到 Cramér-Rao 下界的渐近版本，是**渐近有效**的。实用价值在于构造标准误与区间：$\hat{\theta}$ 的近似标准误为 $1 / \sqrt{n I(\hat{\theta})}$，区间估计可以直接由此得到。

### 最大后验估计

把参数视为随机变量并给定先验 $\pi(\theta)$，后验分布正比于 $\pi(\theta) L(\theta)$，取后验最大值的估计称为**最大后验估计**（maximum a posteriori，MAP）：

$$
\hat{\theta}_{\text{MAP}} = \arg\max_{\theta} \pi(\theta) L(\theta)
$$

MAP 与 MLE 的差别只在于多了一个先验因子。先验起正则化作用：正态先验对应 $L_2$ 惩罚，拉普拉斯先验对应 $L_1$ 惩罚，这一点在下一小节展开。贝叶斯推断的完整框架在 2.12 节讨论。

## 2.10.2 稳健估计与 M 估计

### M 估计的一般形式

前面几种方法可以统一在一个框架下。**M 估计**（M-estimator）把估计问题写成最小化形式

$$
\hat{\theta} = \arg\min_{\theta} \sum_{i=1}^{n} \rho(x_i; \theta)
$$

取 $\rho(x; \theta) = -\log f(x; \theta)$ 就是极大似然估计；取 $\rho(x; \theta) = (x - \theta)^2$ 就是最小二乘；取 $\rho(x; \theta) = |x - \theta|$ 得到最小绝对偏差估计。不同的 $\rho$ 给出不同的估计量，差别体现在对异常值的敏感程度上。

### 影响函数与崩溃点

衡量稳健性的两个工具是影响函数与崩溃点。**影响函数**（influence function）描述单个观测值对估计量的影响程度，最小二乘的影响函数随观测值线性增长，一个极端值可以产生任意大的影响；中位数的影响函数有界，单个观测值的影响有限。**崩溃点**（breakdown point）是使估计量失效所需的异常值比例，样本均值的崩溃点为 $0$，中位数的崩溃点为 $0.5$。

### 修剪均值与温莎化均值

两种常用的稳健位置估计由排序样本定义。把样本排序后去掉两端各 $\alpha$ 比例的数据，对剩余部分求均值，得到**修剪均值**（trimmed mean）：

$$
\hat{\mu}_{\text{trim}} = \frac{1}{n - 2k} \sum_{i=k+1}^{n-k} X_{(i)}
$$

其中 $k = \lfloor \alpha n \rfloor$，$X_{(i)}$ 是次序统计量。把两端被去掉的数据替换为边界值而非直接丢弃，再求均值，得到**温莎化均值**（Winsorized mean）。两者都比样本均值稳健，比中位数保留了更多信息。取 $\alpha = 0$ 得到样本均值，取 $\alpha$ 接近 $0.5$ 得到中位数。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(11)
x = rng.normal(50, 5, size=200)
x_out = np.append(x, [200.0, -80.0, 180.0])   # 混入三个异常值

print(f"样本均值   = {x_out.mean():.2f}")
print(f"中位数     = {np.median(x_out):.2f}")
print(f"修剪均值   = {stats.trim_mean(x_out, 0.05):.2f}")   # 去掉两端各 5%
print(f"温莎化均值 = {stats.mstats.winsorize(x_out, limits=0.05).mean():.2f}")
```

异常值把样本均值拉偏了接近两个单位，中位数与两种稳健估计几乎不受影响。这一对比说明位置估计的选择要与数据的污染程度一起考虑。

## 2.10.3 收缩估计与正则化

### 偏差-方差权衡

2.9 节给出的均方误差分解 $MSE = Bias^2 + Var$ 说明，一个估计量不必无偏。如果引入少量偏差能换来方差的大幅下降，均方误差反而更小。**收缩估计**（shrinkage estimator）把估计值向某个中心拉近，用偏差换取方差。

最简单的形式是取样本均值与固定值的加权平均 $\hat{\theta} = \lambda \bar{X} + (1 - \lambda) \theta_0$，$\lambda$ 越小收缩越强。当先验信息可靠时这种做法能显著降低均方误差，$\lambda$ 的选择需要在偏差与方差之间权衡。

### James-Stein 估计

**James-Stein 估计**给出了一个反直觉的结论：在维数 $p \geq 3$ 时，把所有坐标同时向原点收缩的估计量

$$
\hat{\boldsymbol{\theta}}_{JS} = \left(1 - \frac{p - 2}{\|\mathbf{X}\|^2}\right) \mathbf{X}
$$

在平方误差损失下一致优于样本均值向量 $\mathbf{X}$，尽管样本均值是每个坐标的无偏估计。这一结果说明无偏性在多元情形下不是必须追求的目标，多参数的同时估计可以借力收缩。维数限制 $p \geq 3$ 不可省略，二维时样本均值反而是可容许的。

### 岭估计与 Lasso

把收缩思想用到回归系数的估计上，得到两种正则化方法。**岭估计**（ridge）在残差平方和上加上系数的 $L_2$ 惩罚：

$$
\hat{\boldsymbol{\beta}}_{\text{ridge}} = \arg\min_{\boldsymbol{\beta}} \left\{\|\mathbf{y} - \mathbf{X}\boldsymbol{\beta}\|^2 + \lambda \|\boldsymbol{\beta}\|_2^2\right\}
$$

岭估计有闭式解 $\hat{\boldsymbol{\beta}} = (\mathbf{X}^T\mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}$，它把系数连续地压缩向零，缓解多重共线性导致的方差膨胀。**Lasso 估计**（least absolute shrinkage and selection operator）改用 $L_1$ 惩罚：

$$
\hat{\boldsymbol{\beta}}_{\text{lasso}} = \arg\min_{\boldsymbol{\beta}} \left\{\|\mathbf{y} - \mathbf{X}\boldsymbol{\beta}\|^2 + \lambda \|\boldsymbol{\beta}\|_1\right\}
$$

$L_1$ 惩罚的几何形状是菱形，最优点容易落在坐标轴上，因此 Lasso 能把部分系数精确压缩为零，同时完成估计与变量选择。结合两者得到**弹性网**（elastic net），惩罚项为 $\lambda_1 \|\boldsymbol{\beta}\|_1 + \lambda_2 \|\boldsymbol{\beta}\|_2^2$。

从贝叶斯视角看，岭估计对应系数的高斯先验，Lasso 对应拉普拉斯先验，正则化参数 $\lambda$ 与先验的尺度有关。这一对应在 2.12 节与 2.13 节还会用到。稀疏估计在高维数据（变量数超过样本数）中的作用在 2.14 节展开。

```python
import numpy as np

rng = np.random.default_rng(3)
n, p = 100, 5
X = rng.normal(size=(n, p))
beta_true = np.array([3.0, -2.0, 0.0, 0.0, 1.5])
y = X @ beta_true + rng.normal(scale=1.0, size=n)

def solve_ridge(X, y, lam):
    """岭回归闭式解：先给设计矩阵补一列常数列"""
    Xc = np.column_stack([np.ones(len(X)), X])
    A = Xc.T @ Xc + lam * np.eye(Xc.shape[1])
    return np.linalg.solve(A, Xc.T @ y)

for lam in [0.0, 1.0, 10.0]:
    print(f"lambda = {lam:5.1f}，系数 = {np.round(solve_ridge(X, y, lam), 3)}")
# lambda 增大时，各系数被连续压缩向零，但不会恰好等于零
```

### 压缩感知与稀疏恢复

当参数本身稀疏、观测数少于参数数时，$L_1$ 最小化仍然可以恢复参数，这一现象称为**压缩感知**（compressed sensing）。两个相关的算法是**基追踪**（basis pursuit，直接最小化 $L_1$ 范数）与**正交匹配追踪**（orthogonal matching pursuit，每次选出与残差最相关的列，逐步逼近）。理论与算法细节属于高维统计的内容，见 2.14 节。

## 2.10.4 非参数估计

### 核密度估计

前面的方法都假设分布属于某个参数族。放弃这一假设，直接从数据估计密度函数，得到**非参数密度估计**（nonparametric density estimation）。直方图是最简单的形式，它把取值轴分箱后统计频数，缺点是结果依赖分箱边界且不光滑。

**核密度估计**（kernel density estimation，KDE）用平滑的核函数代替箱：

$$
\hat{f}_h(x) = \frac{1}{n h} \sum_{i=1}^{n} K\left(\frac{x - X_i}{h}\right)
$$

其中 $K$ 是以零为中心的对称密度函数（常用高斯核），$h > 0$ 是**带宽**（bandwidth）。每个观测点在自身位置放一个高度为 $1/(nh)$ 的小核，所有核叠加后归一化为 $1$。带宽决定平滑程度：$h$ 过小则曲线随数据波动、出现多个尖峰；$h$ 过大则细节被抹平。最优带宽在偏差与方差之间权衡，常用的经验规则是 $h \approx 1.06 \hat{\sigma} n^{-1/5}$（Silverman 规则），它基于正态假设，数据明显偏离正态时应改用交叉验证选择。

核密度估计的收敛速度比参数估计慢。参数估计的标准误量级是 $n^{-1/2}$，核密度估计的均方误差最优量级是 $n^{-4/5}$，这一差距随维数增加而迅速扩大，是高维数据中直接估计密度困难的原因之一。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(5)
x = np.concatenate([rng.normal(-2, 0.8, 300), rng.normal(3, 1.2, 200)])   # 双峰数据

# Silverman 规则选择带宽
h = 1.06 * x.std(ddof=1) * len(x) ** (-1 / 5)
kde = stats.gaussian_kde(x, bw_method=h / x.std(ddof=1))

for xi in [-2.0, 0.5, 3.0]:
    print(f"x = {xi:4.1f}，核密度估计 = {kde(xi)[0]:.4f}")
```

### 核回归与局部多项式回归

同一思想可以用在回归上。给定数据 $(x_i, y_i)$，**Nadaraya-Watson 估计**（核回归）把预测值写为响应值的加权平均：

$$
\hat{m}(x) = \frac{\sum_{i=1}^{n} K\left(\frac{x - x_i}{h}\right) y_i}{\sum_{i=1}^{n} K\left(\frac{x - x_i}{h}\right)}
$$

权重由核函数给出：离 $x$ 近的观测点权重大。核回归在数据边界附近有偏（可用点一侧的样本少），改进方法是**局部线性回归**，在每个 $x$ 处用加权最小二乘拟合一条直线并取截距，边界偏差由直线项吸收。更高阶的形式是局部多项式回归。

### 样条与惩罚方法

另一条非参数路线是用分段的基函数展开函数，再对粗糙度施加惩罚。**样条**（spline）把区间分成若干段，每段用低阶多项式，并在结点处保证连续性。**惩罚样条**（penalized spline）在拟合残差上加上二阶导数的积分惩罚 $\lambda \int (f'')^2$，$\lambda$ 控制平滑度，取 $\lambda \to \infty$ 得到直线，取 $\lambda = 0$ 得到插值曲线。**平滑样条**是这一构造的连续版本，B 样条提供了数值稳定的基表示。这些方法在 2.13 节的广义加法模型中作为组件出现。

## 2.10.5 区间估计的定义与构造

### 置信区间的定义

点估计给出一个数值，但没有说明精度。**置信区间**（confidence interval）用一个随机区间来表达精度。设 $\hat{L}$ 与 $\hat{U}$ 是样本的函数且满足 $\hat{L} \leq \hat{U}$，若对任意 $\theta \in \Theta$ 有

$$
P_\theta\left(\hat{L} \leq \theta \leq \hat{U}\right) \geq 1 - \alpha
$$

则称 $[\hat{L}, \hat{U}]$ 是置信水平为 $1 - \alpha$ 的置信区间，$1 - \alpha$ 称为**置信水平**（confidence level）。

这个定义需要仔细解读。概率是对随机区间而言的：重复抽样会得到不同的区间，其中比例不少于 $1 - \alpha$ 的区间覆盖真值。对一个已经算出的具体区间，真值要么在其中要么不在其中，概率的表述不再适用。常见的说法把 $95\%$ 理解为给定区间覆盖真值的概率，这与定义不符：$95\%$ 是区间构造方法的长期覆盖频率。

### 枢轴量法

构造置信区间最常用的方法是寻找**枢轴量**（pivotal quantity）：一个既含样本又含参数、但分布不依赖参数的函数 $T(\mathbf{X}, \theta)$。若 $T$ 的分布已知，取分位数 $q_{\alpha/2}$ 与 $q_{1 - \alpha/2}$ 使

$$
P\left(q_{\alpha/2} \leq T(\mathbf{X}, \theta) \leq q_{1 - \alpha/2}\right) = 1 - \alpha
$$

再对不等式两边做关于 $\theta$ 的等价变形，就得到置信区间。

正态均值是最标准的例子。设 $X_i \sim N(\mu, \sigma^2)$ 且 $\sigma^2$ 未知，取

$$
T = \frac{\bar{X} - \mu}{S / \sqrt{n}} \sim t(n - 1)
$$

由 $t$ 分布的分位数 $t_{1 - \alpha/2}(n - 1)$ 得到

$$
\left[\bar{X} - t_{1 - \alpha/2}(n-1) \frac{S}{\sqrt{n}}, \ \bar{X} + t_{1 - \alpha/2}(n-1) \frac{S}{\sqrt{n}}\right]
$$

区间的半宽正比于标准误 $S / \sqrt{n}$，随样本量增加按 $n^{-1/2}$ 缩小。把样本量扩大四倍才能把区间缩短一半，这是区间估计中样本量规划的基本关系。

### 反转检验法

置信区间与假设检验存在对偶关系。对每个候选值 $\theta_0$，做水平为 $\alpha$ 的检验判断是否拒绝 $\theta = \theta_0$，把所有未被拒绝的 $\theta_0$ 收集起来，就构成水平 $1 - \alpha$ 的置信区间。这一构造称为**反转检验法**（test inversion）。2.11 节的三种检验对应三种区间：反转 Wald 检验得到 Wald 区间，反转得分检验得到得分区间，反转似然比检验得到似然比区间。

三种区间在小样本下的表现不同。Wald 区间对称且计算简单，但参数被变换后区间不再保持变换关系，且在似然面不对称时覆盖概率偏低。得分区间在零假设处评估方差，对二项比例这类参数通常比 Wald 区间更稳健。似然比区间由似然面的等高线给出，形状最接近真实的不确定性，通常推荐用于小样本。二项比例 $n = 10$、$x = 1$ 时 Wald 区间会给出下界为负的荒谬结果，得分区间与似然比区间则保持在 $[0, 1]$ 内，这一对比是三种方法差别的标准例子。

### 伯努利比例的完整示例

设 $X \sim \mathrm{Binomial}(n, p)$，三种区间的形式如下。Wald 区间为

$$
\hat{p} \pm z_{1 - \alpha/2} \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}}, \qquad \hat{p} = \frac{X}{n}
$$

得分区间解方程

$$
\frac{|\hat{p} - p|}{\sqrt{p(1 - p)/n}} = z_{1 - \alpha/2}
$$

对 $p$ 的二次方程求根，得到不对称的区间端点。似然比区间由条件

$$
2\left[\ell(\hat{p}) - \ell(p)\right] \leq \chi^2_{1, 1-\alpha}
$$

确定，两端点需要用数值方法求解。

```python
import numpy as np
from scipy import stats, optimize

def ci_wald(x, n, alpha=0.05):
    p = x / n
    z = stats.norm.ppf(1 - alpha / 2)
    half = z * np.sqrt(p * (1 - p) / n)
    return p - half, p + half

def ci_score(x, n, alpha=0.05):
    z = stats.norm.ppf(1 - alpha / 2)
    p = x / n
    center = (p + z ** 2 / (2 * n)) / (1 + z ** 2 / n)
    half = z * np.sqrt(p * (1 - p) / n + z ** 2 / (4 * n ** 2)) / (1 + z ** 2 / n)
    return center - half, center + half

def ci_likelihood(x, n, alpha=0.05):
    def loglik(p):
        if p <= 0 or p >= 1:
            return -np.inf
        return x * np.log(p) + (n - x) * np.log(1 - p)
    p_hat = x / n
    crit = loglik(p_hat) - stats.chi2.ppf(1 - alpha, 1) / 2
    lo = optimize.brentq(lambda p: loglik(p) - crit, 1e-9, p_hat)
    hi = optimize.brentq(lambda p: loglik(p) - crit, p_hat, 1 - 1e-9)
    return lo, hi

for x, n in [(1, 10), (5, 10), (2, 100)]:
    print(f"x = {x}, n = {n}")
    print(f"  Wald  = {np.round(ci_wald(x, n), 4)}")
    print(f"  得分  = {np.round(ci_score(x, n), 4)}")
    print(f"  似然比 = {np.round(ci_likelihood(x, n), 4)}")
```

### 预测区间与容忍区间

置信区间针对参数，另两个区间针对观测与总体比例。**预测区间**（prediction interval）覆盖未来单个观测值，它需要同时考虑参数的不确定性与观测本身的随机性，因此比置信区间宽。正态总体下未来观测 $X_{\text{new}}$ 的预测区间为

$$
\bar{X} \pm t_{1 - \alpha/2}(n - 1) S \sqrt{1 + \frac{1}{n}}
$$

根号中的 $1$ 来自新观测自身的方差，$1/n$ 来自均值估计的不确定性。当 $n$ 很大时，根号趋近于 $1$，预测区间的宽度主要由观测的固有波动决定，此时再增加样本量也收窄不了多少。

**容忍区间**（tolerance interval）覆盖总体的给定比例 $\beta$，置信水平为 $1 - \alpha$。它的目标为整个总体的一个分位范围，预测区间针对单个新观测，两者覆盖的对象不同。质量控制中常用 $95\%/99\%$ 容忍区间来设定产品的合格界限。

## 2.10.6 自助法区间

当枢轴量的分布难以推导时，**自助法**（bootstrap）用重抽样近似该分布。基本流程是：从原始样本中有放回地抽取 $B$ 个大小相同的重样本，对每个重样本计算估计量，用这些估计量的经验分布代替抽样分布。2.9 节已用这一思想估计标准误，这里讨论如何构造区间。

**百分位法**（percentile method）直接取自助分布的分位数：

$$
\left[\hat{\theta}^*_{(\alpha/2)}, \ \hat{\theta}^*_{(1 - \alpha/2)}\right]
$$

其中 $\hat{\theta}^*_{(q)}$ 是 $B$ 个自助估计的第 $q$ 分位数。方法简单，但当自助分布相对真值有偏时，区间会偏离。

**基本自助法**（basic bootstrap，也称反向百分位法）从偏差角度修正：

$$
\left[2\hat{\theta} - \hat{\theta}^*_{(1 - \alpha/2)}, \ 2\hat{\theta} - \hat{\theta}^*_{(\alpha/2)}\right]
$$

它把自助分布的偏离方向翻转后加到原估计上。

**学生化自助法**（studentized bootstrap）对每个重样本计算 $t$ 型统计量 $(\hat{\theta}^* - \hat{\theta}) / \widehat{se}^*$，用这些统计量的分位数构造区间。该方法对偏差与方差不齐都有修正作用，覆盖精度通常最好，代价是每个重样本内部还要再估计一次标准误。

**BCa 法**（bias-corrected and accelerated）在百分位法基础上加入偏差修正与加速度修正两个参数，前者由自助分布低于原估计的比例决定，后者由刀切法估计的偏度决定。BCa 在多数场景下兼顾精度与计算量，是实践中的常用默认选择。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(23)
x = rng.exponential(scale=5.0, size=80)   # 右偏数据，均值的抽样分布不对称
B = 5000
boot = np.array([rng.choice(x, size=len(x), replace=True).mean() for _ in range(B)])
theta_hat = x.mean()

lo_p, hi_p = np.percentile(boot, [2.5, 97.5])                    # 百分位法
lo_b, hi_b = 2 * theta_hat - hi_p, 2 * theta_hat - lo_p          # 基本自助法
print(f"估计值        = {theta_hat:.3f}")
print(f"百分位法区间  = [{lo_p:.3f}, {hi_p:.3f}]")
print(f"基本自助区间  = [{lo_b:.3f}, {hi_b:.3f}]")

# 与基于正态近似的区间对比
se = boot.std(ddof=1)
z = stats.norm.ppf(0.975)
print(f"正态近似区间  = [{theta_hat - z * se:.3f}, {theta_hat + z * se:.3f}]")
```

右偏数据下正态近似区间会略微越界或偏移，百分位法与基本自助法给出的端点不对称，更贴近真实的抽样分布。自助法的适用前提是样本能代表总体，样本量过小或样本本身有严重选择偏差时，重抽样只会复制原有的问题。

## 2.10.7 贝叶斯可信区间

贝叶斯推断给出后验分布，区间由后验分位数直接得到。**等尾可信区间**（equal-tailed credible interval）取后验的 $\alpha/2$ 与 $1 - \alpha/2$ 分位数；**最高后验密度区间**（highest posterior density interval，HPD）取后验密度最高的区域，使区间内每一点的密度都不低于区间外的点。后验分布不对称时 HPD 区间最短，等尾区间则保证两侧尾部概率相等。

可信区间与置信区间的解释不同。可信区间的解释可以直接建立在后验概率上：给定数据与先验，参数落在该区间的后验概率为 $1 - \alpha$。置信区间的解释只能针对区间构造方法的长期频率。在均匀先验下，两者的数值往往接近，这解释了为什么实践中常把两类区间混用，但解释上的差别在需要报告结论时是实质性的。

## 2.10.8 本节小结

::: success 从估计原则到区间与精度
本节把点估计与区间估计串联为一条完整的流程。矩估计与极大似然估计提供了两条构造路径，后者的渐近正态性与渐近有效性使它成为默认方法。稳健估计用有界影响函数换取对异常值的抵抗力，收缩估计用偏差换取方差下降，非参数方法放弃参数族假设以换取形状上的灵活性，三种取舍针对不同的数据条件。区间估计的核心是枢轴量与反转检验两条构造思路，Wald、得分与似然比三种区间在覆盖精度上依次改善，自助法在分布难以推导时提供了通用的替代方案。预测区间与容忍区间的目标分别是未来观测与总体比例，与置信区间不可互换使用。
:::

区间给出参数的可能范围，但很多研究问题的答案落在关于参数的判断上：两种方案的效果是否有差异、数据是否支持某个理论取值、观测到的差异能否用随机波动解释。下一节讨论假设检验，把区间估计的对偶工具系统化，并处理同时检验多个假设时的错误率控制问题。

## 练习题

### 第 1 题 概念推导

设 $X_1, \ldots, X_n$ 独立同分布于 $\mathrm{Exp}(\lambda)$。求 $\lambda$ 的极大似然估计与矩估计，说明两者是否相同；再求 $\hat{\lambda}$ 的渐近方差，并据此写出 $\lambda$ 的近似 $95\%$ 置信区间。

::: details 参考答案
**极大似然估计**：对数似然为 $\ell(\lambda) = n \log \lambda - \lambda \sum X_i$，得分方程为 $n / \lambda - \sum X_i = 0$，解得 $\hat{\lambda}_{\text{MLE}} = 1 / \bar{X}$。

**矩估计**：总体均值 $E[X] = 1 / \lambda$，令其等于样本均值，得 $\hat{\lambda}_{\text{MOM}} = 1 / \bar{X}$。指数分布只有一个参数，一阶矩方程已足够，两种方法给出相同的结果。

**渐近方差**：单观测的 Fisher 信息为

$$
I(\lambda) = -E\left[\frac{\partial^2}{\partial \lambda^2} \log f(X; \lambda)\right] = -E\left[-\frac{1}{\lambda^2}\right] = \frac{1}{\lambda^2}
$$

由极大似然估计的渐近正态性，$\mathrm{Var}(\hat{\lambda}) \approx \lambda^2 / n$，标准误约为 $\hat{\lambda} / \sqrt{n}$。

**近似置信区间**：

$$
\hat{\lambda} \pm z_{1 - \alpha/2} \frac{\hat{\lambda}}{\sqrt{n}}
$$

注意该区间在 $n$ 较小时可能包含负值，改进方法是先对 $\log \lambda$ 构造区间再变换回 $\lambda$，得到的形式始终为正。
:::

### 第 2 题 计算推理

某工厂生产的零件长度服从正态分布。随机抽取 $16$ 件，测得样本均值 $\bar{x} = 50.2$ mm，样本标准差 $s = 0.8$ mm。求总体均值的 $95\%$ 置信区间；若要预测下一件零件长度的 $95\%$ 区间，区间会宽多少倍？

::: details 参考答案
**均值的置信区间**：$\sigma$ 未知，用 $t$ 分布。$t_{0.975}(15) = 2.131$，标准误为 $0.8 / \sqrt{16} = 0.2$，区间为

$$
50.2 \pm 2.131 \times 0.2 = [49.774, \ 50.626]
$$

**预测区间**：宽度因子为 $\sqrt{1 + 1/16} = \sqrt{1.0625} \approx 1.0308$，区间为

$$
50.2 \pm 2.131 \times 0.8 \times 1.0308 \approx [48.442, \ 51.958]
$$

预测区间的半宽约 $1.758$ mm，是均值置信区间半宽 $0.426$ mm 的 $4.13$ 倍。差距主要来自新观测自身的方差 $s^2$，与样本量无关，因此增加样本量只能略微收窄预测区间（因子从 $\sqrt{1 + 1/n}$ 趋近 $1$），不能把它缩到接近零。
:::

### 第 3 题 代码验证

生成一组含异常值的样本，比较样本均值、中位数、$10\%$ 修剪均值与温莎化均值对异常值的敏感程度。再对不含异常值的样本用三种自助法（百分位、基本、正态近似）构造均值的 $95\%$ 区间，观察右偏数据下三种区间的差异。

::: details 参考答案

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(31)

# 位置估计的稳健性对比
clean = rng.normal(10, 2, size=100)
contaminated = np.append(clean, rng.normal(40, 1, size=5))   # 5% 污染

for name, data in [("干净样本", clean), ("污染样本", contaminated)]:
    print(name)
    print(f"  均值       = {data.mean():.3f}")
    print(f"  中位数     = {np.median(data):.3f}")
    print(f"  修剪均值   = {stats.trim_mean(data, 0.05):.3f}")
    print(f"  温莎化均值 = {stats.mstats.winsorize(data, limits=0.05).mean():.3f}")
# 污染后均值偏移约 1.4，另三种估计的偏移小于 0.3

# 自助法区间（右偏数据）
x = rng.exponential(scale=3.0, size=60)
B = 4000
boot = np.array([rng.choice(x, size=len(x), replace=True).mean() for _ in range(B)])
theta = x.mean()
lo_p, hi_p = np.percentile(boot, [2.5, 97.5])
lo_b, hi_b = 2 * theta - hi_p, 2 * theta - lo_p
se = boot.std(ddof=1)
z = stats.norm.ppf(0.975)
print(f"百分位法 = [{lo_p:.3f}, {hi_p:.3f}]")
print(f"基本法   = [{lo_b:.3f}, {hi_b:.3f}]")
print(f"正态近似 = [{theta - z * se:.3f}, {theta + z * se:.3f}]")
```

右偏数据下百分位法与基本法给出的区间不对称，上端偏离估计值更远；正态近似区间对称，会低估上侧的不确定性。修剪均值与温莎化均值在污染样本上的偏移远小于样本均值，说明有界影响函数的实际效果。
:::

### 第 4 题 综合应用

某电商平台想估计用户对页面的点击率 $p$。观测到 $n = 200$ 次曝光中有 $x = 12$ 次点击。分别用 Wald 区间、得分区间与似然比区间给出 $95\%$ 置信区间，比较三者的差异；再用 Jeffreys 先验 $\mathrm{Beta}(0.5, 0.5)$ 给出后验均值与等尾可信区间，说明贝叶斯结果与频率派结果的解释差别。

::: details 参考答案
$\hat{p} = 12 / 200 = 0.06$，$z_{0.975} = 1.96$。

**Wald 区间**：

$$
0.06 \pm 1.96 \sqrt{\frac{0.06 \times 0.94}{200}} = 0.06 \pm 0.0329 = [0.0271, \ 0.0929]
$$

**得分区间**：中心 $\tilde{p} = (0.06 + 1.96^2 / 400) / (1 + 1.96^2 / 200) = 0.0642$，半宽

$$
\frac{1.96}{1 + 1.96^2/200}\sqrt{\frac{0.06 \times 0.94}{200} + \frac{1.96^2}{4 \times 200^2}} \approx 0.0321
$$

区间为 $[0.0321, \ 0.0963]$。

**似然比区间**：由 $2[\ell(\hat{p}) - \ell(p)] \leq 3.841$ 数值求解，得到约 $[0.0331, \ 0.0996]$，上端比 Wald 区间更远，因为对数似然在 $p$ 增大方向下降较缓。

**贝叶斯结果**：Jeffreys 先验下后验为 $\mathrm{Beta}(12 + 0.5, 188 + 0.5)$，后验均值为 $12.5 / 201 \approx 0.0622$。等尾可信区间取 $\mathrm{Beta}(12.5, 188.5)$ 的 $2.5\%$ 与 $97.5\%$ 分位数，约为 $[0.0364, \ 0.0978]$。

三者数值接近，解释不同。频率派区间的含义是：若重复抽样并每次构造区间，约 $95\%$ 的区间会覆盖真值。贝叶斯可信区间的含义是：在给定数据与先验的条件下，$p$ 落在该区间的后验概率为 $95\%$。样本量增大时两类区间趋于一致，这来自后验分布的渐近正态性与先验影响的消失。
:::

## 常见错误

**错误 1 · 把置信水平解释为给定区间覆盖真值的概率**

原因：置信区间的定义针对随机区间，$95\%$ 指区间构造方法的长期覆盖频率。区间一旦算出就是一个确定的区间，真值是否在其中没有概率可言。把 $95\%$ 直接读成该区间覆盖真值的概率，是把频率性质安到了单次结果上。

解决：报告时区分两种表述。频率派留给区间本身的说法是构造方法的覆盖率，贝叶斯可信区间才能直接给出参数落入区间的概率，使用前明确所用的推断框架。

**错误 2 · 小样本或极端比例下直接用 Wald 区间**

原因：Wald 区间基于估计量的正态近似，在小样本、比例接近边界或参数强不对称时近似失效。二项比例 $n = 10$、$x = 1$ 时 Wald 区间会给出负的下界，超出参数的合法范围。

解决：比例参数用得分区间或似然比区间，小样本下的均值用 $t$ 分布而非正态分布；或用自助法与贝叶斯方法。检查区间端点是否落在参数空间的合法范围内，是发现近似失效的简单手段。

**错误 3 · 把预测区间与置信区间混用**

原因：两个区间的目标不同，置信区间描述参数，预测区间描述未来观测。正态总体下预测区间的宽度因子是 $\sqrt{1 + 1/n}$，比均值的置信区间宽得多，样本量很大时差距尤其明显。

解决：涉及单个新观测的波动范围时用预测区间，涉及总体均值的精度时用置信区间。报告时写出区间的类型与对应的目标，避免读者按错误的对象理解数值。

**错误 4 · 用均方误差以外的标准比较估计量**

原因：无偏性只是评价标准之一。收缩估计一致优于样本均值的例子说明，接受少量偏差可以换来方差的大幅下降，均方误差反而更小。只按无偏性筛选，会排除一批在预测性能上更好的估计量。

解决：按使用目标选择评价标准。需要重复抽样的平均误差时用均方误差；只关心长期平均命中时用无偏性；关心极端情形下的稳定性时考虑最小最大准则或稳健性指标。比较时明确损失函数，再谈哪个估计量更优。