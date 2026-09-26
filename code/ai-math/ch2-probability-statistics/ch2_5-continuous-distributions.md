---
title: 2.5 常见连续分布
sidebar:
  order: 5
---
# 2.5 常见连续分布

2.4 节按生成机制把离散分布串成一条线索：独立重复试验给出二项分布，稀有事件流给出泊松分布，停止规则的变化给出几何与负二项分布。连续分布的组织方式相同，区别在于取值充满区间，概率由密度函数在区间上的积分给出。生成机制的差别体现在密度的形状上：等可能的取值给出均匀分布，多个微小误差的叠加给出正态分布，等待若干次事件的时间给出伽马分布，乘性误差的累积给出对数正态分布。

本节沿用 2.4 节的叙述顺序，从最简单的生成机制出发逐步加入结构。每个分布给出生成机制、密度函数、期望与方差、典型场景与参数含义，并说明它与家族中其他分布的关系。末尾两节讨论指数族与最大熵分布，它们是把一大批分布统一起来的两种视角：指数族给出的是数学形式上的统一，最大熵给出的是信息论意义上的选择依据。这一条线索在 2.13 节的广义线性模型与后续的信息论章节中会再次出现。

## 2.5.1 连续分布的描述方式

### 密度、累积分布与分位数

连续型随机变量由**概率密度函数**（probability density function，PDF）$f(x)$ 描述，区间概率为积分 $P(a < X \leq b) = \int_a^b f(x) \, dx$，密度本身不是概率。累积分布函数 $F(x) = \int_{-\infty}^{x} f(t) \, dt$ 给出左侧累积概率，分位数函数 $F^{-1}$ 把概率映射回取值。三者的分工在 2.2 节已经说明：密度适合描述局部形状，累积分布适合计算区间概率，分位数适合确定阈值。

连续分布的密度函数必须满足 $f(x) \geq 0$ 且 $\int_{-\infty}^{\infty} f(x) \, dx = 1$。不同分布的密度形状差异很大，但全部信息都压缩在这一条曲线上。

### 参数化约定

同一个分布可以用不同的参数组合表示，约定不一致是使用中的常见问题。**指数分布**既可以写成速率参数 $\lambda$ 的形式 $f(x) = \lambda e^{-\lambda x}$，也可以写成尺度参数 $\theta = 1/\lambda$ 的形式 $f(x) = \frac{1}{\theta} e^{-x/\theta}$。**伽马分布**同样有形状-速率与形状-尺度两种写法。两种参数化描述同一个分布，均值分别为 $1/\lambda$ 与 $\theta$，数值上互为倒数。

不同软件包的默认约定不同。`numpy.random.exponential` 的参数是尺度 $\theta$，`scipy.stats.expon` 用 `scale` 表示尺度，而 `scipy.stats.gamma` 同时接受 `a`（形状）与 `scale`。读文档时先确认参数是速率还是尺度，再代入公式，可以避免大部分数值错误。

## 2.5.2 连续均匀分布

**连续均匀分布**（continuous uniform distribution）是最简单的连续分布：取值区间内任意等长的小区间概率相同。记作 $X \sim U(a, b)$，密度为

$$
f(x) = \begin{cases} \dfrac{1}{b - a}, & a \leq x \leq b \\[4pt] 0, & \text{其他} \end{cases}
$$

期望与方差为

$$
E[X] = \frac{a + b}{2}, \qquad \mathrm{Var}(X) = \frac{(b - a)^2}{12}
$$

均匀分布的用途有两层。作为一种模型，它描述完全无信息的情形，参数的取值范围在没有额外知识时常用均匀分布作为先验（2.12 节）。作为计算工具，它是随机数生成的基础：2.2 节证明的概率积分变换 $F(X) \sim U(0, 1)$ 说明，只要能从均匀分布采样，就能通过逆变换得到任意连续分布的样本。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(2)

# 均匀分布的基本量
a, b = 2.0, 8.0
print(f"均值 = {stats.uniform(a, b - a).mean():.3f}")        # 5.000
print(f"方差 = {stats.uniform(a, b - a).var():.3f}")         # 3.000

# 用逆变换把均匀样本变成指数样本
u = rng.uniform(size=5)
print(f"均匀样本   = {np.round(u, 4)}")
print(f"指数样本   = {np.round(-np.log(1 - u) / 2.0, 4)}")    # 速率 2 的指数分布
```

## 2.5.3 正态分布

### 定义与标准化

**正态分布**（normal distribution）由两个参数确定，记作 $X \sim N(\mu, \sigma^2)$，密度为

$$
f(x) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left[-\frac{(x - \mu)^2}{2\sigma^2}\right], \qquad x \in \R
$$

密度曲线以 $\mu$ 为对称轴，$\sigma$ 控制宽度。$N(0, 1)$ 称为**标准正态分布**（standard normal distribution），其累积分布函数记作 $\Phi$，分位数记作 $z_p$。

标准化把任意正态变量化为标准正态：

$$
Z = \frac{X - \mu}{\sigma} \sim N(0, 1)
$$

这一变换使所有正态分布的概率计算归结为一个函数。$\Phi$ 没有初等闭式表达，它与**误差函数**（error function）的关系为

$$
\Phi(x) = \frac{1}{2}\left[1 + \operatorname{erf}\left(\frac{x}{\sqrt{2}}\right)\right]
$$

数值计算中直接调用 `scipy.stats.norm.cdf` 即可。三条常用的经验值构成正态分布的**经验法则**：$P(|Z| \leq 1) \approx 0.6827$，$P(|Z| \leq 2) \approx 0.9545$，$P(|Z| \leq 3) \approx 0.9973$。

### 线性组合的封闭性

正态分布对线性运算封闭。若 $X_i \sim N(\mu_i, \sigma_i^2)$ 相互独立，则

$$
\sum_{i=1}^{n} a_i X_i \sim N\left(\sum_{i=1}^{n} a_i \mu_i, \ \sum_{i=1}^{n} a_i^2 \sigma_i^2\right)
$$

这条性质称为**加法定理**，它是正态分布在统计推断中地位突出的技术原因：均值是样本的线性组合，因此样本均值在正态总体下仍服从正态分布，区间估计与检验的分布可以精确写出。多维情形下正态分布对线性变换同样封闭，这一点在 2.6 节展开。

### 为什么正态分布普遍出现

正态分布出现在大量互不相关的场景中，原因有三条。中心极限定理（2.7 节）说明独立同分布随机变量之和的标准化形式依分布收敛到正态分布，只要单个变量的方差有限且对总和的贡献均匀，极限分布就是正态的。最大熵性质说明在给定均值与方差的前提下，正态分布是熵最大的分布，也就是说在所有满足这两个矩约束的分布中，它引入的额外假设最少。误差叠加的视角说明测量误差、制造偏差这类量由许多微小独立因素叠加而成，其和近似正态。

三条理由针对不同的问题，结论指向同一个分布。使用正态假设时需要注意它的前提：方差有限、尾部轻、单变量贡献不占主导。重尾数据的和收敛到稳定分布而非正态分布，这一点在 2.5.10 节的柯西分布处给出反例。

```python
import numpy as np
from scipy import stats

# 正态分布的分位数与尾部概率
z = stats.norm.ppf(0.975)
print(f"z_0.975 = {z:.4f}")                     # 1.9600
print(f"P(|Z| > 2) = {2 * stats.norm.sf(2):.4f}")   # 0.0455

# 加法定理验证：两个正态变量之和
rng = np.random.default_rng(4)
x = rng.normal(3, 2, size=200_000)
y = rng.normal(-1, 1, size=200_000)
s = 2 * x + 3 * y
print(f"和的样本均值 = {s.mean():.3f}，理论值 = {2 * 3 + 3 * (-1):.3f}")
print(f"和的样本方差 = {s.var():.3f}，理论值 = {2**2 * 2**2 + 3**2 * 1**2:.3f}")
```

## 2.5.4 对数正态分布

若 $\log X \sim N(\mu, \sigma^2)$，则 $X$ 服从**对数正态分布**（log-normal distribution），密度为

$$
f(x) = \frac{1}{\sqrt{2\pi}\,\sigma x} \exp\left[-\frac{(\log x - \mu)^2}{2\sigma^2}\right], \qquad x > 0
$$

期望与方差为

$$
E[X] = e^{\mu + \sigma^2/2}, \qquad \mathrm{Var}(X) = \left(e^{\sigma^2} - 1\right) e^{2\mu + \sigma^2}
$$

注意参数 $\mu$ 与 $\sigma^2$ 是取对数之后的均值与方差，不是 $X$ 本身的均值与方差。对数正态的生成机制是乘性误差：若 $X = \prod_{i=1}^n Y_i$，各 $Y_i$ 为正的独立随机变量，取对数后 $\log X = \sum \log Y_i$ 是多个独立项之和，由中心极限定理近似正态，于是 $X$ 近似对数正态。

适合对数正态的场景有一个共同特征：影响因素以比例方式起作用。收入受涨薪比例影响、股价受收益率影响、颗粒直径受增长速率影响，这些量的分布都是右偏且取正值，取对数后接近对称。判断数据是否适合对数正态的简单办法是对取值取对数后检查直方图与正态分位数图。

```python
import numpy as np
from scipy import stats

# 对数正态的均值不等于 e^mu
mu, sigma = 0.0, 1.0
d = stats.lognorm(s=sigma, scale=np.exp(mu))
print(f"中位数 = {d.median():.4f}，均值 = {d.mean():.4f}")   # 1.0000，1.6487
print(f"P(X > 均值) = {d.sf(d.mean()):.4f}")                  # 0.3069，均值右侧的概率小于一半
```

均值大于中位数是右偏分布的一般特征，对数正态中两者的差距随 $\sigma$ 迅速扩大。用均值描述这类数据的中心位置会系统性偏高，报告时同时给出中位数更稳妥。

## 2.5.5 指数分布与无记忆性

**指数分布**（exponential distribution）描述等待下一次事件的时间。记作 $X \sim \mathrm{Exp}(\lambda)$，密度与生存函数为

$$
f(x) = \lambda e^{-\lambda x}, \qquad S(x) = P(X > x) = e^{-\lambda x}, \qquad x \geq 0
$$

期望与方差为 $E[X] = 1/\lambda$，$\mathrm{Var}(X) = 1/\lambda^2$。风险函数恒为常数 $\lambda$，说明事件在任何时刻发生的瞬时强度都不随时间改变。

指数分布最显著的性质是**无记忆性**（memorylessness）：

$$
P(X > s + t \mid X > s) = \frac{P(X > s + t)}{P(X > s)} = \frac{e^{-\lambda(s+t)}}{e^{-\lambda s}} = e^{-\lambda t} = P(X > t)
$$

已经等待了 $s$ 时间这一信息不改变对未来等待时间的判断。无记忆性是离散情形几何分布的连续对应，也是指数分布在排队论与可靠性分析中地位突出的原因。2.8 节的泊松过程以独立同分布的指数间隔为定义的一部分，两条描述等价。

指数分布还有一条便于计算的性质：多个独立指数变量的最小值仍服从指数分布，速率为各速率之和。

$$
X_i \sim \mathrm{Exp}(\lambda_i) \text{ 相互独立} \implies \min_i X_i \sim \mathrm{Exp}\left(\sum_i \lambda_i\right)
$$

```python
import numpy as np
from scipy import stats

lam = 0.5                      # 速率参数，平均等待 2 个单位时间
print(f"均值 = {1 / lam:.3f}，风险函数 = {stats.expon(scale=1/lam).pdf(0)/stats.expon(scale=1/lam).sf(0):.3f}")

# 无记忆性的模拟验证
rng = np.random.default_rng(9)
x = rng.exponential(scale=1 / lam, size=500_000)
cond = x[x > 3]                      # 已经等待超过 3 的样本
print(f"P(X > 3)          = {(x > 3).mean():.4f}")
print(f"P(X > 5 | X > 3)  = {np.mean(cond > 5):.4f}，理论值 = {np.exp(-lam * 2):.4f}")
```

## 2.5.6 伽马分布、厄兰分布与卡方分布

### 伽马分布

**伽马分布**（gamma distribution）是指数分布的推广，描述等待第 $k$ 次事件发生所需的时间。密度为

$$
f(x) = \frac{\lambda^{\alpha}}{\Gamma(\alpha)} x^{\alpha - 1} e^{-\lambda x}, \qquad x > 0
$$

其中 $\alpha > 0$ 是**形状参数**（shape），$\lambda > 0$ 是**速率参数**（rate），$\Gamma(\alpha) = \int_0^{\infty} t^{\alpha - 1} e^{-t} \, dt$ 是**伽马函数**，它把阶乘推广到实数：$\Gamma(n) = (n-1)!$，$\Gamma(1/2) = \sqrt{\pi}$。

期望与方差为 $E[X] = \alpha / \lambda$，$\mathrm{Var}(X) = \alpha / \lambda^2$。形状参数决定密度的形态：$\alpha = 1$ 退化为指数分布，$\alpha < 1$ 时密度在原点附近发散，$\alpha > 1$ 时密度在正半轴上有单峰，$\alpha$ 增大时分布趋于对称。形状参数为整数的情形称为**厄兰分布**（Erlang distribution），其中 $\alpha = k$ 对应 $k$ 个独立指数变量的和，这一结论由 2.2 节的卷积公式得到。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(13)

# k 个独立指数变量之和服从 Gamma(k, lambda)
k, lam = 3, 0.8
x = rng.exponential(scale=1 / lam, size=(200_000, k)).sum(axis=1)
print(f"样本均值 = {x.mean():.4f}，Gamma 理论值 = {k / lam:.4f}")
print(f"样本方差 = {x.var():.4f}，Gamma 理论值 = {k / lam**2:.4f}")
print(f"与 Gamma(k=3) 的分位数对照：{np.round(np.percentile(x, [25, 50, 75]), 3)}")
print(f"                              {np.round(stats.gamma(k, scale=1/lam).ppf([0.25, 0.5, 0.75]), 3)}")
```

### 卡方分布

**卡方分布**（chi-squared distribution）是伽马分布的特例：$\chi^2(k) = \mathrm{Gamma}(\alpha = k/2, \lambda = 1/2)$。它的另一个定义更直观：$k$ 个独立标准正态变量的平方和服从自由度为 $k$ 的卡方分布。

$$
Z_1, \ldots, Z_k \sim N(0, 1) \text{ 独立} \implies \sum_{i=1}^{k} Z_i^2 \sim \chi^2(k)
$$

期望与方差为 $E[X] = k$，$\mathrm{Var}(X) = 2k$，自由度同时决定了均值与离散程度。卡方分布只取正值且右偏，自由度增大时形状趋于对称。它在统计推断中的位置来自正态总体：样本方差满足 $(n-1)S^2 / \sigma^2 \sim \chi^2(n-1)$，这一结论是方差置信区间与方差齐性检验的基础（2.9 节与 2.11 节）。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(17)
k = 5
z = rng.normal(size=(100_000, k))
s = (z ** 2).sum(axis=1)
print(f"样本均值 = {s.mean():.4f}，理论值 = {k}")
print(f"样本方差 = {s.var():.4f}，理论值 = {2 * k}")
print(f"95% 分位数 = {np.percentile(s, 95):.4f}，理论值 = {stats.chi2(k).ppf(0.95):.4f}")
```

## 2.5.7 贝塔分布与狄利克雷分布

### 贝塔分布

**贝塔分布**（beta distribution）是定义在 $(0, 1)$ 上的分布，用来描述概率、比例、比率这类取值受限于区间的量。密度为

$$
f(x) = \frac{x^{\alpha - 1}(1 - x)^{\beta - 1}}{B(\alpha, \beta)}, \qquad 0 < x < 1
$$

其中 $B(\alpha, \beta) = \Gamma(\alpha)\Gamma(\beta) / \Gamma(\alpha + \beta)$ 是**贝塔函数**。期望与方差为

$$
E[X] = \frac{\alpha}{\alpha + \beta}, \qquad \mathrm{Var}(X) = \frac{\alpha \beta}{(\alpha + \beta)^2 (\alpha + \beta + 1)}
$$

参数的直觉来自计数的类比。若某个成功概率的先验取 $\mathrm{Beta}(\alpha, \beta)$，观测到 $s$ 次成功与 $f$ 次失败后，后验为 $\mathrm{Beta}(\alpha + s, \beta + f)$。两个参数可以直接读作先验中的成功次数与失败次数，这种共轭关系（2.12 节）使贝塔分布成为贝叶斯建模中最常用的先验之一。

参数决定密度的形状：$\alpha = \beta = 1$ 得到均匀分布；$\alpha = \beta$ 且大于 $1$ 时密度关于 $0.5$ 对称且单峰；$\alpha, \beta$ 都小于 $1$ 时密度呈 U 形，集中在两端；$\alpha \neq \beta$ 时密度偏向一侧。U 形分布能表达两种极端倾向都存在的情形，用其他分布难以做到。

```python
import numpy as np
from scipy import stats

# 三种参数组合的贝塔分布
for a, b in [(1, 1), (2, 8), (0.5, 0.5)]:
    d = stats.beta(a, b)
    print(f"Beta({a}, {b})：均值 = {d.mean():.3f}，方差 = {d.var():.4f}，众数 = {d.mode() if a > 1 else float('nan'):.3f}")

# 二项观测后的后验更新
a_prior, b_prior = 2, 8
s, f = 7, 3
post = stats.beta(a_prior + s, b_prior + f)
print(f"后验均值 = {post.mean():.4f}，先验均值 = {a_prior / (a_prior + b_prior):.3f}")
```

### 狄利克雷分布

**狄利克雷分布**（Dirichlet distribution）是贝塔分布在多类别情形的推广，定义在概率单纯形上：$\mathbf{x} = (x_1, \ldots, x_K)$ 满足 $x_k \geq 0$ 且 $\sum_k x_k = 1$。密度为

$$
f(\mathbf{x}) = \frac{1}{B(\boldsymbol{\alpha})} \prod_{k=1}^{K} x_k^{\alpha_k - 1}
$$

参数向量 $\boldsymbol{\alpha}$ 的作用与贝塔分布的两个参数一致：把它读作各类别的先验计数，观测到各类别的计数 $(n_1, \ldots, n_K)$ 后，后验为 $\mathrm{Dirichlet}(\alpha_1 + n_1, \ldots, \alpha_K + n_K)$。均值与方差为

$$
E[X_k] = \frac{\alpha_k}{\alpha_0}, \qquad \mathrm{Var}(X_k) = \frac{\alpha_k(\alpha_0 - \alpha_k)}{\alpha_0^2(\alpha_0 + 1)}, \qquad \alpha_0 = \sum_{k=1}^{K} \alpha_k
$$

狄利克雷分布是主题模型与多项分布贝叶斯建模的基础，也是贝叶斯非参数方法（狄利克雷过程）的出发点。

## 2.5.8 学生 t 分布与 F 分布

### 学生 t 分布

**学生 t 分布**（Student's t-distribution）由两个独立随机变量构造：

$$
T = \frac{Z}{\sqrt{V / \nu}}, \qquad Z \sim N(0, 1), \quad V \sim \chi^2(\nu), \quad Z \perp V
$$

自由度 $\nu > 0$ 控制尾部厚度。密度关于零对称，形状与正态相近但尾部更厚：$\nu = 1$ 时退化为柯西分布，$\nu \to \infty$ 时收敛到标准正态。方差在 $\nu > 2$ 时存在，等于 $\nu / (\nu - 2)$；$\nu \leq 2$ 时方差不存在。

t 分布在统计推断中的位置来自参数未知这一现实。正态总体均值标准化时若 $\sigma$ 已知，统计量服从标准正态；若 $\sigma$ 未知并以样本标准差 $S$ 代替，统计量 $( \bar{X} - \mu ) / (S / \sqrt{n})$ 服从自由度为 $n - 1$ 的 t 分布。分子是标准正态，分母中的 $S$ 引入了卡方部分的随机性，两部分相除正好是 t 分布的构造。自由度越小尾部越厚，区间越宽，这一补偿在小样本下不可忽略。

### F 分布

**F 分布**（F-distribution）由两个独立的卡方变量之比构造：

$$
F = \frac{V_1 / \nu_1}{V_2 / \nu_2}, \qquad V_1 \sim \chi^2(\nu_1), \quad V_2 \sim \chi^2(\nu_2), \quad V_1 \perp V_2
$$

它只取正值且右偏，期望在 $\nu_2 > 2$ 时为 $\nu_2 / (\nu_2 - 2)$。F 分布的用途是比较两个方差：两个正态总体下 $\frac{S_1^2 / \sigma_1^2}{S_2^2 / \sigma_2^2} \sim F(n_1 - 1, n_2 - 1)$，在方差相等的零假设下方差比服从 F 分布。方差分析中的 F 统计量（组间均方与组内均方之比）也服从 F 分布，这一结论是 2.13 节回归整体检验的基础。

| 分布 | 构造 | 主要用途 |
|------|------|----------|
| 卡方 $\chi^2(\nu)$ | 正态平方和 | 方差的推断、拟合优度检验 |
| t 分布 $t(\nu)$ | 正态除以卡方平方根 | 均值在方差未知时的推断 |
| F 分布 $F(\nu_1, \nu_2)$ | 两个卡方之比 | 方差比检验、方差分析 |

```python
import numpy as np
from scipy import stats

# t 分布尾部的对比
for nu in [1, 5, 30, 200]:
    d = stats.t(nu)
    print(f"自由度 {nu:3d}：P(|T| > 3) = {2 * d.sf(3):.5f}")
print(f"标准正态：P(|Z| > 3) = {2 * stats.norm.sf(3):.5f}")
# 自由度小时尾部概率显著大于正态，自由度增大后靠近正态
```

## 2.5.9 寿命分布：威布尔分布与瑞利分布

### 威布尔分布

**威布尔分布**（Weibull distribution）由形状参数 $k$ 与尺度参数 $\lambda$ 确定，密度与生存函数为

$$
f(x) = \frac{k}{\lambda}\left(\frac{x}{\lambda}\right)^{k-1} e^{-(x/\lambda)^k}, \qquad S(x) = e^{-(x/\lambda)^k}, \qquad x \geq 0
$$

风险函数为 $h(x) = \frac{k}{\lambda}\left(\frac{x}{\lambda}\right)^{k-1}$，形状参数直接决定风险的走势。$k < 1$ 时风险递减，对应早期失效占主导的情形；$k = 1$ 时风险恒定，退化为指数分布；$k > 1$ 时风险递增，对应磨损与老化。这一灵活性使威布尔分布成为可靠性工程的标准工具，产品寿命、材料强度、极端风速都用它建模。

期望与方差可以写成伽马函数的形式

$$
E[X] = \lambda \Gamma\left(1 + \frac{1}{k}\right), \qquad \mathrm{Var}(X) = \lambda^2\left[\Gamma\left(1 + \frac{2}{k}\right) - \Gamma^2\left(1 + \frac{1}{k}\right)\right]
$$

### 瑞利分布

**瑞利分布**（Rayleigh distribution）是威布尔分布在 $k = 2$ 时的特例，密度的形式为

$$
f(x) = \frac{x}{\sigma^2} e^{-x^2/(2\sigma^2)}, \qquad x \geq 0
$$

它出现在两个独立同方差正态变量构成的向量模长上：若 $X, Y \sim N(0, \sigma^2)$ 独立，则 $\sqrt{X^2 + Y^2}$ 服从瑞利分布。无线信号的包络、二维定位误差的径向距离都属于这一类。

```python
import numpy as np
from scipy import stats

# 威布尔分布在不同形状参数下的风险走势
for k in [0.7, 1.0, 1.8]:
    d = stats.weibull_min(k, scale=10)
    h_at = lambda x: d.pdf(x) / d.sf(x)
    print(f"k = {k:.1f}：风险函数 h(5) = {h_at(5):.4f}，h(15) = {h_at(15):.4f}")
# k = 0.7 时风险随寿命下降，k = 1.8 时风险随寿命上升
```

## 2.5.10 重尾分布：拉普拉斯、逻辑斯谛、柯西与帕累托

### 拉普拉斯分布

**拉普拉斯分布**（Laplace distribution）又称双指数分布，密度为

$$
f(x) = \frac{1}{2b} \exp\left(-\frac{|x - \mu|}{b}\right)
$$

它关于 $\mu$ 对称，在 $\mu$ 处有一个尖峰，尾部按指数速度衰减。期望与方差为 $E[X] = \mu$，$\mathrm{Var}(X) = 2b^2$。拉普拉斯分布与绝对值损失对应：最小化 $\sum |x_i - \theta|$ 的估计是中位数，而拉普拉斯分布的对数似然正是绝对值损失之和。这一对应解释了为什么拉普拉斯先验会导出 $L_1$ 正则化（2.10 节）。

### 逻辑斯谛分布

**逻辑斯谛分布**（logistic distribution）的累积分布函数是**逻辑斯谛函数**（sigmoid），

$$
F(x) = \frac{1}{1 + e^{-(x - \mu)/s}}, \qquad f(x) = \frac{e^{-(x-\mu)/s}}{s\left(1 + e^{-(x-\mu)/s}\right)^2}
$$

逻辑斯谛函数把实数映射到 $(0, 1)$，形状与正态的累积分布接近但尾部更厚。它的地位主要来自模型而非数据：逻辑回归用逻辑斯谛函数把线性预测子转换为概率（2.13 节），神经网络中的激活函数也采用同一形式。逻辑斯谛分布的方差为 $\pi^2 s^2 / 3$。

### 柯西分布

**柯西分布**（Cauchy distribution）的密度为

$$
f(x) = \frac{1}{\pi \gamma \left[1 + \left(\frac{x - x_0}{\gamma}\right)^2\right]}
$$

它是两个独立标准正态变量之比的分布，也是 t 分布在自由度为 $1$ 时的特例。柯西分布的性质与前面所有分布都不同：积分 $\int |x| f(x) \, dx$ 发散，**均值不存在**，方差也不存在。由此带来两个后果：大数定律不适用，样本均值不依概率收敛到任何常数，无论样本量多大，样本均值的波动都不会减小；中心极限定理同样失效，样本均值的分布仍是柯西分布本身。

柯西分布是检验统计方法假设的常用反例。看到重尾数据时先检查一阶矩是否合理存在，再决定能否使用基于均值的推断。比值的分布在尾部通常较重，用正态近似处理比值型统计量需要谨慎。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(29)
print("柯西分布的样本均值（样本量递增）")
for n in [10, 1000, 100_000, 1_000_000]:
    s = rng.standard_cauchy(size=n).mean()
    print(f"  n = {n:>9,}：样本均值 = {s:8.3f}")
# 样本均值不随样本量增大而稳定，取值仍在正负几十之间跳动
```

### 帕累托分布

**帕累托分布**（Pareto distribution）描述幂律衰减，密度为

$$
f(x) = \frac{\alpha x_m^{\alpha}}{x^{\alpha + 1}}, \qquad x \geq x_m > 0
$$

$\alpha$ 是**尾部指数**。$\alpha \leq 1$ 时均值不存在，$\alpha \leq 2$ 时方差不存在。生存函数 $S(x) = (x_m / x)^{\alpha}$ 在双对数坐标下是一条直线，这一特征是识别幂律的经验方法。帕累托分布出现在财富分布、城市规模、文件大小、网站访问量这类量上，与离散情形的齐夫分布对应（2.4 节）。重尾意味着极端值出现的概率远高于正态假设下的预期，用正态模型评估这类数据的风险会系统性低估。

## 2.5.11 极值分布

最大值的分布与单个观测的分布不同。设 $M_n = \max(X_1, \ldots, X_n)$，其中 $X_i$ 独立同分布，则 $M_n$ 的分布函数为 $F^n(x)$。适当标准化后，$M_n$ 的极限分布只可能是三种类型之一：

$$
\text{冈贝尔（Gumbel）}, \qquad \text{弗雷歇（Fréchet）}, \qquad \text{韦布尔（Weibull）}
$$

三者的生存函数形式为

$$
S_{\text{Gumbel}}(x) = \exp\left(-e^{-x}\right), \qquad S_{\text{Fréchet}}(x) = 1 - \exp\left(-x^{-\alpha}\right), \qquad S_{\text{Weibull}}(x) = \exp\left(-(-x)^{\alpha}\right)
$$

选择哪一型由原始分布的尾部决定：指数型尾部（正态、指数、伽马）对应冈贝尔型，幂律型尾部（帕累托、t 分布）对应弗雷歇型，有上界的分布对应韦布尔型。三型可以统一写成**广义极值分布**（generalized extreme value distribution，GEV）的形式，形状参数 $\xi$ 的正负号区分三种情形。

极值分布的应用集中在极端事件的风险评估：一年中的最大降雨量、一批产品中的最大缺陷尺寸、金融市场中的最大单日损失。这些量的分布与平均水平的分布形态不同，用平均值的模型推断极端值会低估风险。**极值定理**的地位与中心极限定理相当：CLT 说明和的极限分布，极值定理说明最大值的极限分布。

## 2.5.12 矩阵分布与方向分布

### Wishart 分布与逆 Wishart 分布

把卡方分布从一维推广到多维，得到协方差矩阵的分布。若 $\mathbf{x}_1, \ldots, \mathbf{x}_n$ 独立同分布于 $N_p(\mathbf{0}, \Sigma)$，则

$$
\mathbf{W} = \sum_{i=1}^{n} \mathbf{x}_i \mathbf{x}_i^T \sim W_p(n, \Sigma)
$$

服从自由度为 $n$ 的**Wishart 分布**（Wishart distribution）。它是多元统计中样本协方差矩阵的分布，在多元方差分析与协方差矩阵的贝叶斯推断中出现：多元正态的协方差矩阵的共轭先验是**逆 Wishart 分布**（inverse Wishart distribution），它是 Wishart 分布的逆矩阵所服从的分布。这两个分布在 2.6 节与 2.12 节的多元贝叶斯模型中作为工具使用。

### 冯·米塞斯分布与冯·米塞斯-费舍尔分布

角度、方向、周期数据不能直接用定义在实数轴上的分布建模。**冯·米塞斯分布**（von Mises distribution）把正态分布搬到圆周上，密度为

$$
f(\theta) = \frac{1}{2\pi I_0(\kappa)} \exp\left[\kappa \cos(\theta - \mu)\right], \qquad \theta \in [0, 2\pi)
$$

其中 $I_0$ 是零阶修正贝塞尔函数，$\mu$ 是平均方向，$\kappa$ 度量集中程度：$\kappa = 0$ 时退化为圆周上的均匀分布，$\kappa$ 增大时集中在 $\mu$ 附近。它在方向统计中扮演正态分布的角色。**冯·米塞斯-费舍尔分布**（von Mises-Fisher distribution）把这一构造推广到高维单位球面，用于建模文本嵌入、方向向量这类归一化后的数据。

## 2.5.13 指数族与自然参数

### 统一定义

前面介绍的分布在形式上差异很大，其中一大批可以写成统一的形式。若密度或概率质量函数可以表示为

$$
f(x; \boldsymbol{\theta}) = h(x) \exp\left[\boldsymbol{\eta}(\boldsymbol{\theta})^T \mathbf{T}(x) - A(\boldsymbol{\theta})\right]
$$

则称该分布属于**指数族**（exponential family）。各个部件的含义如下：

| 记号 | 名称 | 作用 |
|------|------|------|
| $\mathbf{T}(x)$ | 充分统计量 | 数据中承载参数信息的全部内容（2.9 节） |
| $\boldsymbol{\eta}(\boldsymbol{\theta})$ | 自然参数 | 参数的重参数化，使密度对参数呈线性指数形式 |
| $A(\boldsymbol{\theta})$ | 对数配分函数 | 归一化常数，保证积分为 $1$ |
| $h(x)$ | 基准测度 | 与参数无关的部分 |

正态、指数、伽马、贝塔、狄利克雷、泊松、二项、多项、几何、负二项分布都属于指数族。均匀分布（支撑依赖参数）与 t 分布（不属于正则指数族）是例外。用**自然参数** $\boldsymbol{\eta}$ 表示的版本称为**自然指数族**（natural exponential family），此时 $A$ 只依赖 $\boldsymbol{\eta}$。

### 对数配分函数与矩

$A$ 不只是归一化常数，它的导数直接给出各阶矩：

$$
\frac{\partial A}{\partial \eta_i} = E[T_i(X)], \qquad \frac{\partial^2 A}{\partial \eta_i \partial \eta_j} = \mathrm{Cov}\left(T_i(X), T_j(X)\right)
$$

第一式说明一阶导给出充分统计量的期望，第二式说明二阶导给出协方差矩阵，后者也是 Fisher 信息矩阵的来源（2.9 节）。这条性质把求期望与求导数联系起来，在需要重复计算矩的场合可以省去积分。

```python
import numpy as np
from scipy import stats

# 正态分布的自然参数：eta1 = mu / sigma^2，eta2 = -1 / (2 sigma^2)
# 对数配分函数 A(eta) = -eta1^2 / (4 eta2) - 0.5 * log(-2 eta2)
def A(eta1, eta2):
    return -eta1 ** 2 / (4 * eta2) - 0.5 * np.log(-2 * eta2)

mu, sigma = 2.0, 1.5
eta1, eta2 = mu / sigma ** 2, -1 / (2 * sigma ** 2)

# 数值求导与理论矩对照
h = 1e-6
dA_deta1 = (A(eta1 + h, eta2) - A(eta1 - h, eta2)) / (2 * h)
print(f"对 eta1 求导 = {dA_deta1:.4f}，E[X] = {mu:.4f}")
print(f"二阶导近似 = {(A(eta1 + h, eta2) - 2 * A(eta1, eta2) + A(eta1 - h, eta2)) / h**2:.4f}，Var(X) = {sigma**2:.4f}")
```

### 为什么广义线性模型以指数族为基础

指数族的统一形式带来三项便利。充分统计量的维数固定，参数估计不需要存储全部数据；对数配分函数的导数给出矩，使期望与方差的关系可以写成简洁的形式；自然参数与线性预测子之间存在自然对应，广义线性模型把 $\boldsymbol{\eta} = \mathbf{X}\boldsymbol{\beta}$ 作为建模起点，正是利用了指数族这一结构（2.13 节）。

## 2.5.14 最大熵分布

### 最大熵原理

同一个均值与方差可以对应无穷多个分布，选择哪一个需要一条准则。**最大熵原理**（maximum entropy principle）的准则是在满足已知约束的分布中选择熵最大的那一个。熵度量分布的不确定性（信息论章节将给出严格定义），熵最大的分布是在满足约束的前提下引入最少额外假设的分布。

三条典型结论：

| 约束条件 | 最大熵分布 |
|----------|------------|
| 支撑有限，无其他约束 | 均匀分布 |
| 支撑为 $[0, \infty)$，均值固定 | 指数分布 |
| 支撑为 $\R$，均值与方差固定 | 正态分布 |

前两条可以直接由变分法推出，第三条说明正态分布在给定前两阶矩的所有分布中引入的额外假设最少。这一结论为正态假设提供了信息论上的依据：使用正态分布的理由在于只知道均值与方差时它最保守，数据是否真的服从正态无须断言，只需要接受这两条矩约束。

### 与指数族的联系

最大熵分布在约束为矩约束时恰好属于指数族。约束 $E[T_i(X)] = t_i$ 下的最大熵解具有形式

$$
f(x) \propto h(x) \exp\left(\sum_i \eta_i T_i(x)\right)
$$

指数上的系数 $\eta_i$ 是拉格朗日乘子，与指数族中的自然参数对应。这一联系说明指数族不只是形式上的统一，它也是矩约束下的最优选择，两条线索在同一个公式上汇合。

## 2.5.15 本节小结

::: success 按生成机制组织的连续分布地图
本节按生成机制把连续分布组织成一条线索。均匀分布描述完全无信息的情形并充当随机数生成的基础；正态分布由微小误差的叠加产生，对线性组合封闭，是均值推断的默认模型；对数正态分布对应乘性误差的累积；指数分布描述首次事件等待时间，无记忆性使风险函数保持恒定；伽马分布是多个指数等待时间之和，卡方、指数都是它的特例；贝塔与狄利克雷分布描述比例与概率向量，参数的计数解释使它们成为共轭先验；t 与 F 分布分别由正态与卡方的组合构造，承担方差未知与方差比较的推断任务；威布尔与瑞利分布用形状参数刻画风险的走势；拉普拉斯、逻辑斯谛、柯西、帕累托构成重尾家族，其中柯西分布是均值不存在、大数定律失效的反例；极值分布刻画最大值的极限行为，与中心极限定理形成对照。指数族把大批分布写成统一形式，对数配分函数的导数给出矩；最大熵原理在矩约束下给出同一形式，为分布的选择提供依据。
:::

连续分布是一维对象。实际的建模对象往往是多个变量的联合行为：图像是像素的联合分布，文本是词序列的联合分布，一次实验会同时记录多个指标。下一节把视角从单个随机变量扩展到随机向量，讨论联合分布、条件分布、协方差结构与多元正态分布的性质，为多元统计与降维方法提供语言。

## 练习题

### 第 1 题 概念推导

设 $X \sim \mathrm{Exp}(\lambda)$。证明无记忆性 $P(X > s + t \mid X > s) = P(X > t)$；再证明若 $X_1, \ldots, X_n$ 是速率分别为 $\lambda_1, \ldots, \lambda_n$ 的独立指数变量，则 $\min_i X_i \sim \mathrm{Exp}(\sum_i \lambda_i)$。

::: details 参考答案
**无记忆性**：由条件概率的定义与生存函数 $S(x) = e^{-\lambda x}$，

$$
P(X > s + t \mid X > s) = \frac{P(X > s + t)}{P(X > s)} = \frac{e^{-\lambda(s+t)}}{e^{-\lambda s}} = e^{-\lambda t} = P(X > t)
$$

**最小值**：对 $x \geq 0$，

$$
P\left(\min_i X_i > x\right) = P(X_1 > x, \ldots, X_n > x) = \prod_{i=1}^{n} e^{-\lambda_i x} = \exp\left(-\sum_{i=1}^{n} \lambda_i x\right)
$$

这正是速率 $\sum_i \lambda_i$ 的指数分布的生存函数，故结论成立。两条性质合用可以得到一条常用结论：多个独立指数型过程的首次事件时间服从指数分布，速率等于各速率之和，这在竞争风险与排队模型中反复出现。
:::

### 第 2 题 计算推理

某设备的使用寿命（单位：千小时）服从形状参数 $k = 2$、尺度参数 $\lambda = 8$ 的威布尔分布。求该设备工作超过 $10$ 千小时的概率；求其在已经工作 $5$ 千小时的条件下，还能再工作 $5$ 千小时以上的概率；并说明为什么这两个概率不相等，与指数分布的情形对比。

::: details 参考答案
**超过 10 千小时的概率**：

$$
S(10) = \exp\left[-\left(\frac{10}{8}\right)^2\right] = e^{-1.5625} \approx 0.2096
$$

**条件概率**：

$$
P(X > 10 \mid X > 5) = \frac{S(10)}{S(5)} = \frac{e^{-1.5625}}{e^{-0.390625}} = e^{-1.171875} \approx 0.3098
$$

而 $S(5) = e^{-0.390625} \approx 0.6766$，与 $0.3098$ 不相等。

两个概率不相等的原因是威布尔分布在 $k = 2 > 1$ 时风险函数递增：设备运行到 $5$ 千小时之后，失效的瞬时强度高于初始时刻，因此它的剩余寿命短于新设备的寿命，条件生存概率大于无条件生存概率。指数分布的风险函数恒定，剩余寿命与已工作时间无关，无记忆性成立。指数分布是唯一具有无记忆性的连续分布，它的风险函数必须处处相等，这一条件把形状参数限制在 $k = 1$。
:::

### 第 3 题 代码验证

用模拟验证两条分布关系。第一条：伽马分布是多个独立指数变量之和，取形状参数 $k = 4$、速率 $\lambda = 0.5$，比较模拟得到的分位数与理论值。第二条：对数配分函数对自然参数的导数等于充分统计量的期望，以正态分布为例，用数值求导与理论矩对照。

::: details 参考答案

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(41)

# 第一条：指数之和的分布
k, lam = 4, 0.5
sim = rng.exponential(scale=1 / lam, size=(200_000, k)).sum(axis=1)
theory = stats.gamma(k, scale=1 / lam)
qs = [0.1, 0.5, 0.9]
print("模拟分位数：", np.round(np.percentile(sim, [q * 100 for q in qs]), 3))
print("理论分位数：", np.round(theory.ppf(qs), 3))

# 第二条：对数配分函数的导数给出矩
def A(eta1, eta2):
    return -eta1 ** 2 / (4 * eta2) - 0.5 * np.log(-2 * eta2)

mu, sigma = 1.0, 2.0
e1, e2 = mu / sigma ** 2, -1 / (2 * sigma ** 2)
h = 1e-5
d1 = (A(e1 + h, e2) - A(e1 - h, e2)) / (2 * h)
d2 = (A(e1, e2 + h) - 2 * A(e1, e2) + A(e1, e2 - h)) / h ** 2
print(f"∂A/∂η₁ = {d1:.4f}，E[X] = {mu:.4f}")
print(f"二阶导 = {d2:.4f}，Var(X)·2 = {2 * sigma ** 2:.4f}")   # 与 η₂ 对应的二阶导
```

第一条验证中模拟分位数与伽马分布的理论分位数在三位小数上一致，说明独立指数和的分布就是伽马分布。第二条中 $\partial A / \partial \eta_1$ 与均值吻合，对 $\eta_2$ 的二阶导数与方差的对应关系需要按自然参数的定义换算，验证时注意 $\eta_2 = -1/(2\sigma^2)$ 的系数。
:::

### 第 4 题 综合应用

某内容平台想估计某篇文章的点击率 $p$。历史数据显示同类文章的点击率大致在 $0.05$ 附近，波动不大，因此取先验 $\mathrm{Beta}(2, 38)$。新文章观测到 $100$ 次展示中有 $7$ 次点击。求后验分布、后验均值，并与不加先验时的频率派估计对比，说明贝塔分布作为先验的两个参数在这里的含义。

::: details 参考答案
先验 $\mathrm{Beta}(2, 38)$ 的均值为 $2 / 40 = 0.05$，与历史经验一致，说明这两个参数可以读作先验中的 $2$ 次点击与 $38$ 次未点击，等价的先验样本量为 $40$。

共轭更新后，后验为

$$
\mathrm{Beta}(2 + 7, \ 38 + 93) = \mathrm{Beta}(9, 131)
$$

后验均值为

$$
\frac{9}{9 + 131} = \frac{9}{140} \approx 0.0643
$$

不加先验的极大似然估计为 $7 / 100 = 0.07$。两者差别来自先验的收缩作用：先验均值 $0.05$ 低于观测值，加权后把估计拉低。若把后验均值写成加权平均的形式，

$$
\frac{2 + 7}{40 + 100} = \frac{40}{140} \times 0.05 + \frac{100}{140} \times 0.07
$$

可以看到先验的权重等于先验样本量占总样本量的比例，$\alpha = 2$ 与 $\beta = 38$ 分别表示先验信念中点击与未点击的次数，比值决定先验均值，总和决定先验的强度。先验越强（总计数越大），后验均值越靠近先验均值；观测越多，数据的影响越大。
:::

## 常见错误

**错误 1 · 混淆速率参数与尺度参数**

原因：指数分布与伽马分布都有两套参数化，速率 $\lambda$ 与尺度 $\theta = 1/\lambda$ 描述同一个分布，但数值互为倒数。调用库函数时把速率当作尺度传入，均值会相差数倍。例如 `scipy.stats.expon(scale=2)` 的均值是 $2$，而 `numpy.random.exponential(scale=2)` 的均值同样为 $2$，若按速率 $2$ 理解则会误以为均值是 $0.5$。

解决：读文档确认参数含义，在代码中用变量名标明单位与角色，例如把参数命名为 `rate` 或 `scale`。手算与代码结果对照一次均值，可以及早发现参数方向的错误。

**错误 2 · 把密度值当作概率**

原因：连续分布的密度可以大于 $1$，例如 $U(0, 0.5)$ 的密度处处等于 $2$。把密度值直接读成概率，会得到超过 $1$ 的荒谬结论，也会在比较不同尺度的变量时得出错误判断。

解决：需要概率时对密度积分，或用累积分布函数求差。比较不同尺度变量的概率只需在同一尺度下比较累积分布函数，不必比较密度的高度。

**错误 3 · 对重尾数据使用正态假设**

原因：正态分布要求方差有限且尾部按指数速度衰减。柯西分布的均值为不存在，帕累托分布在尾部指数较小时方差不存在，这些数据上用样本均值与样本标准差做推断，结论没有意义：样本均值的波动不随样本量减小，置信区间与检验的近似全部失效。

解决：先检查数据的尾部。取对数后看直方图、计算超出若干倍标准差的观测比例、与正态分位数图对照，都是识别重尾的手段。确认重尾后改用基于分位数与秩的方法，或选择能容纳重尾的分布族。

**错误 4 · 把小样本下的 t 分布与正态分布等同看待**

原因：自由度较大时 t 分布与标准正态几乎没有差别，这一印象被带到小样本场景中。自由度取 $1$ 时 t 分布就是柯西分布，尾部概率远大于正态；自由度取 $5$ 时 $P(|T| > 3)$ 约为正态情形的三倍以上，忽略这一差别会使区间过窄、检验过于激进。

解决：方差未知的均值推断统一使用 t 分布，让自由度自动处理尾部的补偿。判断差别是否可忽略时比较尾部分位数而不是中心的形状，$\nu < 30$ 时差别在 $3$ 倍标准差以外的区域明显。