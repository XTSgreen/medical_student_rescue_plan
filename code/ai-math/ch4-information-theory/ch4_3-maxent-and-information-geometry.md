---
title: 4.3 最大熵、指数族与信息几何
sidebar:
  order: 3
---
# 4.3 最大熵、指数族与信息几何

前两节把熵与散度作为计算工具引入。它们还有一层结构性作用：把选择分布这件事转化为优化问题，再把所有由优化得到的分布整理成一个带几何结构的空间。

**最大熵原理**（maximum entropy principle）给出选择分布的一般准则：在满足已知约束的分布中，选择熵最大的那一个。它的含义是，给定已知信息之后不再引入任何额外假设。这一准则把建模问题变成一个约束优化问题，而它的解有统一的形式，即**指数族**（exponential family）。第二章 2.5 节已经给出指数族的定义与若干实例，本节从最大熵的推导重新得到它，并说明对偶配分函数为什么天然给出矩。

把指数族中的参数视为坐标，分布族就构成一个**统计流形**（statistical manifold）。在这个流形上，可以把 KL 散度的局部二阶展开作为度量，得到的度量张量正是第二章出现过的 Fisher 信息矩阵。这一观点（**信息几何**，information geometry）为几个原本分散的结论提供了统一的解释：Cramér-Rao 下界是度量下的一个不等式，最大似然估计是流形上的投影，EM 算法在两个坐标系统之间的交替投影中收敛，自然梯度是梯度在非欧度量下的版本。本节按选择分布 → 组织分布族 → 在分布族上做优化的顺序展开，末尾的接口指向 4.7 节的变分推断与生成模型。

## 4.3.1 最大熵原理

### 原理的陈述

给定一组关于分布 $p$ 的约束（通常是对某些函数 $T_k$ 的期望值），在这组约束下选择使熵最大的分布：

$$
\begin{aligned}
\max_{p} \quad & H(p) = -\sum_x p(x) \log p(x) \\
\text{s.t.} \quad & \sum_x p(x) T_k(x) = t_k, \quad k = 1, \ldots, K \\
& \sum_x p(x) = 1, \quad p(x) \geq 0
\end{aligned}
$$

原理的合理性来自三条论证。一是信息论论证：熵最大的分布在满足约束的前提下对未知部分做出最少的结构假设。二是组合论证：若把 $n$ 个独立的样本按经验分布分类，熵最大的分布对应的经验分布种类最多，最容易被观测到。三是决策论证：以熵最大的分布为先验，在贝叶斯更新后得到的结论受先验影响最小。

约束的形式决定了结果。三条常见情形如下表。

| 约束 | 最大熵分布 |
|------|------------|
| 仅 $\sum p = 1$，支撑有限 | 均匀分布 |
| 支撑为 $\{0, 1, 2, \ldots\}$，固定均值 | 几何分布（离散指数型） |
| 支撑为 $[0, \infty)$，固定均值 | 指数分布 |
| 支撑为 $\R$，固定均值与方差 | 正态分布 |
| 支撑为有限集合，固定某组特征的期望 | 指数族（见下） |

### 拉格朗日推导

用拉格朗日乘子法求最大熵解。引入乘子 $\lambda_0$（对应归一化约束）与 $\lambda_k$（对应矩约束），拉格朗日函数为

$$
\mathcal{L}(p, \lambda) = -\sum_x p(x) \log p(x) + \lambda_0\left(\sum_x p(x) - 1\right) + \sum_{k=1}^{K} \lambda_k \left(\sum_x p(x) T_k(x) - t_k\right)
$$

对每个 $p(x)$ 求偏导并令其为零：

$$
\frac{\partial \mathcal{L}}{\partial p(x)} = -\log p(x) - 1 + \lambda_0 + \sum_{k=1}^{K} \lambda_k T_k(x) = 0
$$

解出

$$
p(x) = \exp\left(\lambda_0 - 1\right) \exp\left(\sum_{k=1}^{K} \lambda_k T_k(x)\right)
$$

把前一个因子并入归一化常数，得到最大熵分布的一般形式：

$$
p(x) = \frac{1}{Z(\boldsymbol{\lambda})} \exp\left(\sum_{k=1}^{K} \lambda_k T_k(x)\right), \qquad Z(\boldsymbol{\lambda}) = \sum_x \exp\left(\sum_{k=1}^{K} \lambda_k T_k(x)\right)
$$

这正是**指数族**的形式：约束函数 $T_k$ 成为充分统计量，乘子 $\lambda_k$ 成为自然参数，$Z$ 是配分函数。上一节的信息论工具与第二章的指数族在这里合成同一个对象。

目标函数 $H(p)$ 是凹函数，约束是线性的，因此这是凸优化问题（第三章 3.1 节），最优解唯一，拉格朗日条件是充要条件。乘子的取值由矩约束确定，一般需要数值求解（$Z$ 的导数与约束的匹配），这就是指数族拟合中的配分函数计算。

```python
import numpy as np
from scipy import optimize

# 数值求解最大熵分布：支撑为 {0, 1, 2, 3, 4}，约束均值为 2
support = np.arange(5)
target_mean = 2.0

def neg_entropy(p):
    p = np.clip(p, 1e-12, 1)
    return np.sum(p * np.log(p))

def solve_maxent(support, target_mean):
    n = len(support)
    # 用指数族参数化：p ∝ exp(theta * x)，只需一个参数
    def objective(theta):
        logits = theta * support
        logits = logits - logits.max()
        p = np.exp(logits)
        p = p / p.sum()
        return np.sum(p * support) - target_mean      # 约束违反量
    theta = optimize.brentq(objective, -10, 10)
    logits = theta * support
    p = np.exp(logits - logits.max())
    return p / p.sum(), theta

p_maxent, theta = solve_maxent(support, target_mean)
p_uniform = np.ones(5) / 5

print(f"自然参数 theta = {theta:.4f}")
print(f"最大熵分布 = {np.round(p_maxent, 4)}，均值 = {np.dot(p_maxent, support):.4f}")
print(f"均匀分布   = {np.round(p_uniform, 4)}，均值 = {np.dot(p_uniform, support):.4f}")
print(f"最大熵分布的熵 = {-neg_entropy(p_maxent):.4f}，均匀分布的熵 = {-neg_entropy(p_uniform):.4f}")
# 最大熵分布在满足均值约束的分布中熵最大；均匀分布不满足均值约束
```

## 4.3.2 最大熵模型与逻辑回归

### 从特征约束到分类模型

把最大熵原理用于分类任务，约束来自特征。设输入为 $\mathbf{x}$，标签为 $y$，定义特征函数 $f_j(\mathbf{x}, y)$（例如$\mathbf{x}$ 含某个词且 $y$ 为某类别的指示函数）。约束是模型的经验期望等于训练数据的经验期望：

$$
E_p\left[f_j\right] = E_{\hat{p}}\left[f_j\right], \qquad j = 1, \ldots, J
$$

在这组约束下最大化条件熵 $H(Y \mid X)$，得到的模型形式为

$$
p(y \mid \mathbf{x}) = \frac{1}{Z(\mathbf{x}, \boldsymbol{\lambda})} \exp\left(\sum_{j=1}^{J} \lambda_j f_j(\mathbf{x}, y)\right), \qquad Z(\mathbf{x}, \boldsymbol{\lambda}) = \sum_{y'} \exp\left(\sum_{j=1}^{J} \lambda_j f_j(\mathbf{x}, y')\right)
$$

这称为**最大熵模型**（maximum entropy model）。它在自然语言处理中被广泛使用，原因是可以灵活地引入任意形式的特征（词的组合、前缀后缀、上下文窗口）而不需要独立性假设。

### 与逻辑回归、softmax 的关系

取二分类 $y \in \{0, 1\}$，特征只依赖于 $\mathbf{x}$（即 $f_j(\mathbf{x}, y) = x_j \cdot \mathbb{1}\{y = 1\}$），则

$$
p(y = 1 \mid \mathbf{x}) = \frac{\exp(\boldsymbol{\lambda}^T \mathbf{x})}{1 + \exp(\boldsymbol{\lambda}^T \mathbf{x})} = \sigma\left(\boldsymbol{\lambda}^T \mathbf{x}\right)
$$

这正是**逻辑回归**。多分类情形得到 **softmax 模型**。因此逻辑回归与 softmax 不只是常用的分类器，它们是特征约束下的最大熵解，这一身份解释了它们为什么在缺乏先验知识时是合理的选择：在满足特征匹配的前提下，模型对标签的分布假设最少。

### 参数估计：与最大似然一致

最大熵模型的对数似然为

$$
\sum_{i} \log p(y_i \mid \mathbf{x}_i) = \sum_{i} \sum_j \lambda_j f_j(\mathbf{x}_i, y_i) - \sum_i \log Z(\mathbf{x}_i, \boldsymbol{\lambda})
$$

对 $\lambda_j$ 求导得到

$$
\frac{\partial}{\partial \lambda_j} = \sum_i f_j(\mathbf{x}_i, y_i) - \sum_i E_{p(y \mid \mathbf{x}_i)}\left[f_j\right]
$$

令其为零，恰好给出模型期望等于经验期望这一约束。因此最大熵模型的最大似然解就是约束满足点，两者一致。由于目标函数是凹的（对数配分函数是凸函数），解唯一，可以用梯度法或拟牛顿法求解（第三章）。

```python
import numpy as np
from scipy import optimize

# 用最大熵形式实现二分类：手写梯度上升求解
rng = np.random.default_rng(21)
n, d = 800, 3
X = rng.normal(size=(n, d))
true_w = np.array([1.5, -1.0, 0.5])
y = (rng.uniform(size=n) < 1 / (1 + np.exp(-X @ true_w))).astype(float)
Xc = np.column_stack([np.ones(n), X])

def neg_loglik(w):
    z = Xc @ w
    return float(np.sum(np.logaddexp(0, z) - y * z))

res = optimize.minimize(neg_loglik, np.zeros(d + 1), method="BFGS")
print(f"估计系数 = {np.round(res.x, 4)}")
print(f"真值     = {np.concatenate([[0.0], true_w])}")

# 验证最大熵模型与最大似然的一致性：模型期望与经验期望之差
p_hat = 1 / (1 + np.exp(-Xc @ res.x))
print(f"模型期望 {np.round((p_hat[:, None] * Xc).mean(axis=0), 4)}")
print(f"经验期望 {np.round((y[:, None] * Xc).mean(axis=0), 4)}")
# 两者在最优解处相等（截距项对应全 1 特征，恒等）
```

## 4.3.3 最小交叉熵原理

**最小交叉熵原理**（minimum cross-entropy principle）处理带先验的情形：已知一个先验分布 $q$ 与若干约束，选择与 $q$ 的 KL 散度最小且满足约束的分布。

$$
\min_p \ D_{\mathrm{KL}}(p \| q) \quad \text{s.t.} \quad \sum_x p(x) T_k(x) = t_k, \ \sum_x p(x) = 1
$$

推导与最大熵平行，结果的形式为指数族乘上先验：

$$
p(x) = \frac{q(x)}{Z(\boldsymbol{\lambda})} \exp\left(\sum_k \lambda_k T_k(x)\right)
$$

两个原理的关系可以总结为一句话：**最大熵是均匀先验下的最小交叉熵**。因为均匀先验下 $D_{\mathrm{KL}}(p \| u) = \log |\mathcal{X}| - H(p)$，最小化散度等价于最大化熵。

最小交叉熵原理还有一条通往统计推断的直接推论：若把 $q$ 取为模型分布 $p_\theta$，把目标分布取为经验分布 $\hat{p}$，则最小化 $D_{\mathrm{KL}}(\hat{p} \| p_\theta)$ 与最大化对数似然等价（第二题的结论）。这解释了为什么统计推断中的估计方法总与交叉熵挂钩：**最小化交叉熵、最小化 KL、最大化似然，三者是同一件事的三种表述**。

## 4.3.4 指数族的结构

### 自然参数与对数配分函数

把最大熵的解写成标准形式，得到**自然指数族**（natural exponential family）：

$$
p(x \mid \boldsymbol{\eta}) = h(x) \exp\left(\boldsymbol{\eta}^T \mathbf{T}(x) - A(\boldsymbol{\eta})\right), \qquad A(\boldsymbol{\eta}) = \log \int h(x) \exp\left(\boldsymbol{\eta}^T \mathbf{T}(x)\right) dx
$$

对数配分函数 $A$ 有三条关键性质，都来自它与矩的关系。它是凸函数；它的梯度给出充分统计量的期望，海森矩阵给出协方差矩阵：

$$
\nabla A(\boldsymbol{\eta}) = E\left[\mathbf{T}(X)\right], \qquad \nabla^2 A(\boldsymbol{\eta}) = \mathrm{Cov}\left(\mathbf{T}(X)\right)
$$

因此 $A$ 的凸性等价于协方差矩阵的半正定性，海森矩阵正是这个分布的 Fisher 信息矩阵（下面给出验证）。这三条性质在第二章 2.5 节以公式形式出现，在此获得了来源：它们是指数族由最大熵推导而来的副产品。

### 指数族中的 KL 散度

两个同族分布的 KL 散度有简洁形式。设 $p_1 = p(\cdot \mid \boldsymbol{\eta}_1)$、$p_2 = p(\cdot \mid \boldsymbol{\eta}_2)$，则

$$
D_{\mathrm{KL}}(p_1 \| p_2) = A(\boldsymbol{\eta}_2) - A(\boldsymbol{\eta}_1) - (\boldsymbol{\eta}_2 - \boldsymbol{\eta}_1)^T \nabla A(\boldsymbol{\eta}_1)
$$

右边正是 $A$ 在 $\boldsymbol{\eta}_1$ 处的 **Bregman 散度**（4.2.6 节）：KL 散度在指数族上的限制等于对数配分函数的 Bregman 散度。这一恒等式把两个看似无关的构造连接起来，也是信息几何中坐标变换公式的来源。

```python
import numpy as np
from scipy import stats

# 伯努利族的自然参数化：eta = logit(p)，A(eta) = log(1 + e^eta)
def A(eta):
    return np.logaddexp(0, eta)

def kl_bernoulli(p1, p2):
    return p1 * np.log(p1 / p2) + (1 - p1) * np.log((1 - p1) / (1 - p2))

eta1, eta2 = -0.5, 0.8
p1, p2 = 1 / (1 + np.exp(-eta1)), 1 / (1 + np.exp(-eta2))

# 用 Bregman 散度公式计算
h = 1e-5
grad_A = (A(eta1 + h) - A(eta1 - h)) / (2 * h)
bregman = A(eta2) - A(eta1) - (eta2 - eta1) * grad_A
print(f"直接计算 KL   = {kl_bernoulli(p1, p2):.6f}")
print(f"Bregman 公式  = {bregman:.6f}")

# 验证对数配分函数的导数给出期望
print(f"\nA'(eta) = {grad_A:.6f}，E[T(X)] = p = {p1:.6f}")
```

## 4.3.5 统计流形与 Fisher 度量

### 局部 KL 展开给出度量

考虑一个由参数 $\boldsymbol{\theta}$ 标记的分布族 $\{p_{\boldsymbol{\theta}}\}$，两条邻近的分布之间的 KL 散度做二阶展开。先展开到一阶：

$$
D_{\mathrm{KL}}(p_{\boldsymbol{\theta}} \| p_{\boldsymbol{\theta} + d\boldsymbol{\theta}}) = \int p_{\boldsymbol{\theta}} \log \frac{p_{\boldsymbol{\theta}}}{p_{\boldsymbol{\theta} + d\boldsymbol{\theta}}} \approx -\int p_{\boldsymbol{\theta}} \, d\boldsymbol{\theta}^T \nabla \log p_{\boldsymbol{\theta}} = -d\boldsymbol{\theta}^T E\left[\nabla \log p_{\boldsymbol{\theta}}\right] = 0
$$

一阶项为零，原因是得分函数的期望为零（第二章 2.9 节给出过这一恒等式）。继续展开到二阶，得到

$$
D_{\mathrm{KL}}(p_{\boldsymbol{\theta}} \| p_{\boldsymbol{\theta} + d\boldsymbol{\theta}}) \approx \frac{1}{2} d\boldsymbol{\theta}^T \mathbf{I}(\boldsymbol{\theta}) \, d\boldsymbol{\theta}, \qquad \mathbf{I}(\boldsymbol{\theta}) = E\left[\nabla \log p_{\boldsymbol{\theta}} \, \nabla \log p_{\boldsymbol{\theta}}^T\right]
$$

这里的 $\mathbf{I}(\boldsymbol{\theta})$ 是 **Fisher 信息矩阵**。三条结论随之得到。第一，KL 散度在局部是对称的（二阶项关于 $d\boldsymbol{\theta}$ 对称），不对称性只体现在高阶项上。第二，Fisher 信息矩阵提供了一个度量张量，把参数空间变成黎曼流形，这个流形称为**统计流形**。第三，参数化改变时 Fisher 矩阵按张量规律变换，因此由它定义的几何结构不依赖参数化的选择，这一点与欧氏度量不同。

### 与 Cramér-Rao 下界的联系

第二章 2.9 节的 Cramér-Rao 下界可以在这个框架下重新表述：

$$
\mathrm{Var}(\hat{\theta}_i) \geq \left[\mathbf{I}(\boldsymbol{\theta})^{-1}\right]_{ii}
$$

几何解释是：估计的方差下界由度量张量在参数方向上的长度决定。参数方向上的距离越长（Fisher 信息越大），区分邻近参数越容易，估计的方差下界越小。因此 Fisher 信息同时是几何量（度量）与统计量（估计精度），这一双重身份是信息几何的核心。

```python
import numpy as np

# 正态族的 Fisher 信息矩阵：参数为 (mu, sigma)
def fisher_normal(mu, sigma, n_grid=400, lim=8):
    """数值计算 Fisher 信息矩阵 I_{ij} = E[∂_i log p · ∂_j log p]"""
    x = np.linspace(mu - lim * sigma, mu + lim * sigma, n_grid)
    p = np.exp(-((x - mu) ** 2) / (2 * sigma ** 2)) / (sigma * np.sqrt(2 * np.pi))
    p = p / (p.sum() * (x[1] - x[0]))
    # 得分函数的两个分量
    s_mu = (x - mu) / sigma ** 2
    s_sigma = ((x - mu) ** 2 - sigma ** 2) / sigma ** 3
    dx = x[1] - x[0]
    I = np.array([[np.sum(p * s_mu ** 2) * dx, np.sum(p * s_mu * s_sigma) * dx],
                  [np.sum(p * s_mu * s_sigma) * dx, np.sum(p * s_sigma ** 2) * dx]])
    return I

mu, sigma = 1.0, 2.0
I = fisher_normal(mu, sigma)
print("数值 Fisher 信息矩阵：\n", np.round(I, 6))
print("理论值：\n[[1/sigma^2, 0], [0, 2/sigma^2]] =", np.round(np.array([[1 / sigma ** 2, 0], [0, 2 / sigma ** 2]]), 6))

# 验证局部 KL 的二阶展开
def kl_normal(mu1, s1, mu2, s2):
    return np.log(s2 / s1) + (s1 ** 2 + (mu1 - mu2) ** 2) / (2 * s2 ** 2) - 0.5

eps = 1e-4
d = np.array([eps, 0.0])
kl_val = kl_normal(mu, sigma, mu + d[0], sigma + d[1])
print(f"\nKL(p_theta || p_{{theta+d}}) = {kl_val:.3e}")
print(f"二阶近似 (1/2) d^T I d      = {0.5 * d @ I @ d:.3e}")
```

## 4.3.6 信息投影与 EM 算法

### 两类投影

在统计流形上，投影有两种含义，对应 KL 散度的两个方向。

**m-投影**（mixture projection，矩投影）把一族分布外的一个分布投影到该族上，最小化正向 KL：

$$
q^* = \arg\min_{q \in \mathcal{M}} D_{\mathrm{KL}}(p \| q)
$$

最优解有一个干净的性质：**矩匹配**。若 $\mathcal{M}$ 是由约束 $\{T_k\}$ 定义的指数族，则最优解与 $p$ 在这些统计量上的期望相等：$E_{q^*}[T_k] = E_p[T_k]$。这一性质给出了最大似然估计的几何解释：把经验分布投影到模型族上，得到的参数就是最大似然估计。

**e-投影**（exponential projection）最小化反向 KL：

$$
q^* = \arg\min_{q \in \mathcal{M}} D_{\mathrm{KL}}(q \| p)
$$

反向 KL 的投影不满足矩匹配，但有一个便于计算的性质：若 $\mathcal{M}$ 自身是指数族，最优解的形式仍在族内，可以通过求解配分函数得到。变分推断中使用的正是这种投影（2.12 节的近似后验），这也是近似后验倾向于低估方差的原因（4.2 节练习题已讨论）。

### 投影定理与 EM 的几何解释

两类投影之间存在**广义勾股定理**：若 $p$ 到 $\mathcal{M}$ 的投影是 $q^*$，$r$ 是 $\mathcal{M}$ 中的另一点，则

$$
D_{\mathrm{KL}}(p \| r) = D_{\mathrm{KL}}(p \| q^*) + D_{\mathrm{KL}}(q^* \| r)
$$

它说明投影是最近点的严格版本，与欧氏空间中的勾股关系形式一致。这一定理需要 m-投影与 e-投影的坐标系统相互正交，是信息几何中最常用的结构性结论。

**EM 算法**（2.12 节的期望最大化）在几何上表现为两个投影的交替：期望步把当前模型投影到与观测数据边缘一致的分布集合上（e-投影），最大化步再投影回参数族（m-投影）。每次交替都单调降低 KL 散度，因此似然单调不减。这一解释给出了 EM 收敛性的几何证明，也说明了它为什么只能收敛到局部最优：投影的目标函数非凸，交替下降只能保证驻点。

```python
import numpy as np

# 用 m-投影的矩匹配性质验证最大似然：把经验分布投影到正态族
rng = np.random.default_rng(33)
data = rng.gamma(shape=2.5, scale=1.2, size=20_000)   # 真实分布不是正态

# 最小化 KL(经验分布 || 正态族) 等价于矩匹配，即用样本均值与样本方差
mu_hat = data.mean()
sigma_hat = data.std(ddof=0)
print(f"矩匹配结果：mu = {mu_hat:.4f}，sigma = {sigma_hat:.4f}")

# 直接数值最小化与经验分布的 KL（用直方图近似）做对照
bins = 120
hist, edges = np.histogram(data, bins=bins, density=True)
centers = 0.5 * (edges[:-1] + edges[1:])

def kl_to_empirical(mu, sigma):
    q = np.exp(-((centers - mu) ** 2) / (2 * sigma ** 2)) / (sigma * np.sqrt(2 * np.pi))
    q = np.clip(q, 1e-12, None)
    p = np.clip(hist, 1e-12, None)
    return np.sum(p * np.log(p / q)) * (centers[1] - centers[0])

print(f"KL(经验 || 正态(mu_hat, sigma_hat)) = {kl_to_empirical(mu_hat, sigma_hat):.6f}")
for delta in [0.05, 0.15]:
    print(f"  均值偏移 {delta}：KL = {kl_to_empirical(mu_hat + delta, sigma_hat):.6f}")
    print(f"  方差缩小 5%：KL = {kl_to_empirical(mu_hat, sigma_hat * 0.95):.6f}")
# 矩匹配点附近的 KL 最小，与理论一致
```

## 4.3.7 自然梯度

### 欧氏梯度的参数化依赖

最优化通常在参数空间上沿欧氏梯度方向下降。这一做法存在一个结构性问题：梯度方向依赖参数化的选择。举一个具体例子，若把伯努利分布的参数从 $p$ 换成对数几率 $\eta = \log \frac{p}{1-p}$，同一条更新规则在两个坐标下的实际分布变化完全不同：在 $p$ 坐标下步长与 $p$ 无关，在 $\eta$ 坐标下步长在 $p$ 接近 $0$ 或 $1$ 时会被放大。参数化是人为选择，模型的行为不应依赖这一选择。

### 自然梯度的定义

**自然梯度**（natural gradient）用 Fisher 信息矩阵作为度量，把梯度方向按度量修正：

$$
\tilde{\nabla} f(\boldsymbol{\theta}) = \mathbf{I}(\boldsymbol{\theta})^{-1} \nabla f(\boldsymbol{\theta}), \qquad \boldsymbol{\theta}_{t+1} = \boldsymbol{\theta}_t - \eta \, \mathbf{I}(\boldsymbol{\theta}_t)^{-1} \nabla f(\boldsymbol{\theta}_t)
$$

修正后的方向是参数化不变的：换用另一套坐标，更新后的分布变化相同。因此自然梯度下降可以理解为在统计流形上沿最速下降方向移动，而不是在人为坐标上。

三条性质需要说明。第一，自然梯度下降等价于在 KL 散度意义下做**镜像下降**（mirror descent）：每步在保持分布变化不超过给定 KL 距离的约束下最小化目标函数的线性化。第二，它与牛顿法不同：牛顿法用目标函数的二阶导（海森矩阵）修正方向，自然梯度用分布族的 Fisher 矩阵，两者只有在目标函数恰好是负对数似然（此时海森矩阵与 Fisher 矩阵在期望意义上一致）时才重合。第三，计算代价在于求逆：参数维度高时需要用近似（对角近似、Kronecker 因子近似，如 K-FAC）。

### 应用

自然梯度在几处场景中带来明显改进。**强化学习**中策略参数的更新用自然梯度（如 TRPO 算法），原因是策略的输出来自 softmax 分布，参数化变化会使概率分布改变剧烈，用 Fisher 矩阵修正后更新步长与分布变化挂钩，避免策略崩溃。**变分推断**（4.7 节）中优化 ELBO 时用自然梯度可以提高收敛速度，尤其在高斯近似的参数上。**语言模型与大规模预训练的优化器**中也有基于 Fisher 信息的近似方法，用于处理不同参数方向尺度差异极大的问题。

```python
import numpy as np

# 自然梯度与欧氏梯度在伯努利参数化下的对比
# 目标：最小化 f(p) = KL(Bernoulli(p*) || Bernoulli(p))，最优解 p = p*
p_star = 0.02          # 真实参数接近 0

def f_p(p):
    return p_star * np.log(p_star / p) + (1 - p_star) * np.log((1 - p_star) / (1 - p))

def grad_p(p):
    return -p_star / p + (1 - p_star) / (1 - p)

# Fisher 信息（标量）：I(p) = 1 / (p (1 - p))
def fisher_p(p):
    return 1.0 / (p * (1 - p))

p = 0.5
lr = 0.05
print("欧氏梯度下降（p 坐标）：")
for _ in range(200):
    p = p - lr * grad_p(p)
    p = min(max(p, 1e-6), 1 - 1e-6)
print(f"  收敛到 p = {p:.6f}，目标值 = {f_p(p):.6f}")

p = 0.5
print("自然梯度下降（p 坐标）：")
for _ in range(200):
    p = p - lr * grad_p(p) / fisher_p(p)
    p = min(max(p, 1e-6), 1 - 1e-6)
print(f"  收敛到 p = {p:.6f}，目标值 = {f_p(p):.6f}")
print(f"\n注意：在 p 接近 0 时，欧氏梯度步长需要极小才稳定，自然梯度的步长自动适应了这一区域")
```

## 4.3.8 本节小结

::: success 选择分布的准则与分布族的几何
本节把两件事连接起来。第一件是分布的选择：最大熵原理给出在约束下不引入额外假设的准则，用拉格朗日法求解得到指数族形式，约束函数成为充分统计量，乘子成为自然参数。最小交叉熵原理是带先验的版本，均匀先验下它与最大熵重合；把先验取为模型、目标取为经验分布时，它与最大似然重合，最小化交叉熵、最小化 KL 与最大化似然三个表述由此统一。逻辑回归与 softmax 是特征约束下的最大熵解，这解释了它们在缺乏先验时的合理性。第二件是分布族的结构：把参数视为坐标，KL 散度的局部二阶展开给出 Fisher 信息矩阵作为度量张量，参数空间成为统计流形，Cramér-Rao 下界成为度量下的不等式。指数族上的 KL 散度等于对数配分函数的 Bregman 散度，两个构造在此汇合。投影有两种：m-投影最小化正向 KL 并满足矩匹配，与最大似然对应；e-投影最小化反向 KL，与变分推断对应。EM 算法在两个投影之间交替，收敛性由此得到几何解释。自然梯度用 Fisher 矩阵修正梯度方向，使更新与参数化无关，它在强化学习与变分推断中带来实际改进。
:::

到这里，信息论的基础语言已经建立：熵与互信息描述不确定性，散度描述分布差异，最大熵与信息几何描述分布族的结构。剩下的问题是这些量在具体任务中的极限：一个序列最少需要多少比特才能被无损压缩，一条有噪声的信道最多能传输多少信息。4.4 节与 4.5 节分别回答这两个问题，它们的答案都建立在 4.1 节的典型性理论上。

## 练习题

### 第 1 题 概念推导

在支撑为 $\{0, 1, 2, \ldots\}$ 且均值为 $\mu$ 的约束下，用拉格朗日乘子法推导最大熵分布，说明它是指数分布族的离散对应形式；再说明若约束改为均值与方差都固定，分布形式会如何变化。

::: details 参考答案
**推导**：拉格朗日函数为

$$
\mathcal{L} = -\sum_{x=0}^{\infty} p(x) \log p(x) + \lambda_0\left(\sum_x p(x) - 1\right) + \lambda_1\left(\sum_x x \, p(x) - \mu\right)
$$

对 $p(x)$ 求偏导并令其为零：

$$
-\log p(x) - 1 + \lambda_0 + \lambda_1 x = 0 \implies p(x) = \exp(\lambda_0 - 1) \exp(\lambda_1 x)
$$

归一化后得到

$$
p(x) = (1 - e^{\lambda_1}) e^{\lambda_1 x}, \qquad x = 0, 1, 2, \ldots
$$

设 $q = e^{\lambda_1} \in (0, 1)$（由归一化要求 $q < 1$），则 $p(x) = (1 - q) q^x$，这是**几何分布**。均值约束给出 $q = \mu / (1 + \mu)$，因此 $\mu$ 决定了唯一的最大熵分布。几何分布是连续情形指数分布的离散对应：两者都是给定均值下熵最大的解，都具备无记忆性（2.5 节）。

**增加方差约束**：加入第二个乘子 $\lambda_2$ 与约束 $\sum_x x^2 p(x) = \sigma^2 + \mu^2$，此时偏导条件变为

$$
p(x) \propto \exp\left(\lambda_1 x + \lambda_2 x^2\right)
$$

当 $\lambda_2 < 0$ 时得到离散高斯型分布（概率按二次指数衰减），这就是给定前两阶矩的离散最大熵分布。连续情形下同样的推导给出正态分布。若不限制 $\lambda_2$ 的符号，目标函数在无界支撑上可能无最优解（熵可以无限增大），因此约束的相容性需要单独检查。
:::

### 第 2 题 计算推理

设参数化的分布族为伯努利族 $p_\theta$（$\theta \in (0, 1)$ 为成功概率），Fisher 信息为 $I(\theta) = \frac{1}{\theta(1-\theta)}$。请计算 $\theta = 0.5$ 与 $\theta = 0.05$ 时的 Fisher 信息；用局部 KL 展开式估算从 $\theta$ 移动到 $\theta + 0.01$ 的 KL 散度，与精确值比较；并说明这一结果对参数估计精度的含义。

::: details 参考答案
**Fisher 信息**：

$$
I(0.5) = \frac{1}{0.5 \times 0.5} = 4, \qquad I(0.05) = \frac{1}{0.05 \times 0.95} \approx 21.05
$$

**局部 KL 展开**（近似式 $D_{\mathrm{KL}} \approx \frac{1}{2} I(\theta) (\Delta\theta)^2$）：

在 $\theta = 0.5$、$\Delta\theta = 0.01$ 处：$\frac{1}{2} \times 4 \times 10^{-4} = 2 \times 10^{-4}$。
在 $\theta = 0.05$、$\Delta\theta = 0.01$ 处：$\frac{1}{2} \times 21.05 \times 10^{-4} \approx 1.05 \times 10^{-3}$。

**精确值**：$D_{\mathrm{KL}}(p_\theta \| p_{\theta + \Delta}) = \theta \log \frac{\theta}{\theta + \Delta} + (1 - \theta)\log \frac{1 - \theta}{1 - \theta - \Delta}$。

在 $\theta = 0.5$ 处精确值约为 $2.0 \times 10^{-4}$，与近似一致；在 $\theta = 0.05$ 处精确值约为 $1.1 \times 10^{-3}$，与近似也接近。两者的相对误差随 $\Delta\theta$ 增大而上升。

**对估计精度的含义**：Fisher 信息越大，两个邻近参数对应的分布越容易被区分，由 Cramér-Rao 下界 $\mathrm{Var}(\hat\theta) \geq 1/(nI(\theta))$，在 $\theta = 0.05$ 处的方差下界约为 $\theta = 0.5$ 处的 $1/5.26$。也就是说同样样本量下，估计小概率事件的参数反而更精确。这一结论初看与直觉相反（小概率事件信息更少），原因在于参数是概率本身而非计数：当 $\theta$ 接近 0 时，$p_\theta$ 与 $p_{\theta + \Delta}$ 的差异在相对意义上更大，分布形状的区分度更高。若换用对数几率参数 $\eta = \log\frac{\theta}{1-\theta}$，几何结构会改变，但 Fisher 信息的变换规则（张量变换）保证了下界的不变性。
:::

### 第 3 题 代码验证

用数值方法求解一个带两个矩约束的最大熵分布，比较它与均匀分布、与未约束的指数族的熵值；并验证指数族上的 KL 散度等于对数配分函数的 Bregman 散度。

::: details 参考答案

```python
import numpy as np
from scipy import optimize

support = np.arange(0, 8)

def maxent_two_moments(support, m1, m2):
    """约束一阶矩与二阶矩的最大熵分布：p ∝ exp(a x + b x^2)"""
    def residual(params):
        a, b = params
        logits = a * support + b * support ** 2
        w = np.exp(logits - logits.max())
        p = w / w.sum()
        return np.array([p @ support - m1, p @ (support ** 2) - m2])
    sol = optimize.root(residual, x0=[-0.5, -0.05])
    a, b = sol.x
    logits = a * support + b * support ** 2
    w = np.exp(logits - logits.max())
    return w / w.sum(), (a, b)

def entropy(p):
    p = p[p > 0]
    return float(-np.sum(p * np.log(p)))

p_maxent, params = maxent_two_moments(support, m1=3.0, m2=12.0)
p_uniform = np.ones(len(support)) / len(support)
print(f"参数 (a, b) = {np.round(params, 4)}")
print(f"最大熵分布 = {np.round(p_maxent, 4)}")
print(f"一阶矩 = {p_maxent @ support:.4f}，二阶矩 = {p_maxent @ support**2:.4f}")
print(f"最大熵分布的熵 = {entropy(p_maxent):.4f}")
print(f"均匀分布的熵   = {entropy(p_uniform):.4f}（不满足矩约束，熵更大）")

# 验证 Bregman 恒等式（用一维指数族：p ∝ exp(theta * x)）
def log_partition(theta, support):
    return np.log(np.sum(np.exp(theta * support)))

def kl_discrete(p, q):
    mask = p > 0
    return float(np.sum(p[mask] * np.log(p[mask] / q[mask])))

t1, t2 = 0.2, 0.6
p1 = np.exp(t1 * support - log_partition(t1, support))
p2 = np.exp(t2 * support - log_partition(t2, support))
h = 1e-6
grad = (log_partition(t1 + h, support) - log_partition(t1 - h, support)) / (2 * h)
bregman = log_partition(t2, support) - log_partition(t1, support) - (t2 - t1) * grad
print(f"\nKL(p1||p2) = {kl_discrete(p1, p2):.8f}")
print(f"Bregman(A) = {bregman:.8f}")
```

输出显示：两个矩约束下的最大熵分布是离散高斯型，满足两个矩约束；均匀分布熵更大但不满足约束，说明约束的作用是把熵最大的无约束解排除在外。Bregman 恒等式在数值上吻合到 $10^{-8}$ 量级，验证了指数族 KL 与对数配分函数 Bregman 散度的等价性。
:::

### 第 4 题 综合应用

某团队训练一个多分类模型，发现更换优化器后收敛速度差别很大：用普通梯度下降需要大量迭代，用自然梯度（Fisher 矩阵修正）收敛快得多。请解释这一现象；推导 softmax 参数下 Fisher 信息矩阵的形式；说明自然梯度在高维参数下的计算困难与常用近似；并给出一种判断是否值得改用自然梯度的诊断方法。

::: details 参考答案
**现象解释**：softmax 的参数是 logits（对数几率），模型输出的概率分布对参数的变化非常敏感：参数方向上的尺度差异极大，某些方向的扰动几乎不改变分布，另一些方向则使分布剧烈变化。欧氏梯度下降在同一尺度下更新所有方向，慢方向进展缓慢，快方向需要很小的步长才稳定，因此收敛慢。自然梯度用 Fisher 矩阵（即分布变化的度量）修正方向，把更新步长与分布改变了多少挂钩，消除了尺度差异，因此收敛快。

**Fisher 矩阵的形式**：设 logits 为 $z = W\mathbf{x}$，输出概率为 $p_k = \mathrm{softmax}(z)_k$。对参数 $w_{kj}$ 求导，得分函数为

$$
\frac{\partial \log p_y}{\partial w_{kj}} = \left(\mathbb{1}\{k = y\} - p_k\right) x_j
$$

Fisher 矩阵为得分函数外积的期望。在单样本上（把模型自身的预测分布作为期望分布），Fisher 矩阵具有块结构：

$$
\mathbf{I} = \mathrm{diag}(\mathbf{p}) - \mathbf{p}\mathbf{p}^T \otimes \mathbf{x}\mathbf{x}^T
$$

即概率部分的协方差与特征部分的外积的 Kronecker 积。这一结构使 Fisher 矩阵尽管维度为参数总数（可能上亿），却可以分块存储与求逆。

**计算困难与近似**：参数总数为 $P$ 时 Fisher 矩阵是 $P \times P$，存储与求逆都不可行。常用近似有三类：对角近似（只保留对角线，代价低但忽略了参数之间的相关）；Kronecker 因子近似（K-FAC，把 Fisher 近似为两个小矩阵的 Kronecker 积，利用上面的块结构）；低秩与分块近似（按层分块，每块单独求逆）。选择取决于参数规模与可接受的计算开销。

**诊断方法**：比较梯度范数与参数变化引起的分布变化。具体做法是记录若干次迭代中参数更新前后模型输出分布的 KL 散度，看它是否与步长成正比关系稳定。若不同方向的同一梯度范数带来的分布变化相差几个数量级（可以用随机方向的探针实验估计），说明尺度差异严重，改用自然梯度或自适应方法（Adam 一类）会有明显收益。也可以直接比较损失下降速度与条件数的估计：条件数大且普通方法收敛慢时，自然梯度类方法的收益最大。
:::

## 常见错误

**错误 1 · 把最大熵原理当作假设最少的分布的绝对准则**

原因：最大熵是对给定约束而言的。约束选少了，最大熵解可能与事实严重不符（例如只约束支撑，得到均匀分布，无法描述任何实际规律）；约束信息有错时，最大熵解会把错误信息固化为结构。把它当作无需论证的普适准则，会掩盖约束选择本身需要论证这一事实。

解决：明确写下所使用的约束，说明约束来自数据的哪一部分信息（样本矩、领域知识、物理限制）。对约束做敏感性分析：去掉或放宽某个约束后结论是否改变。报告时把约束与结论一起给出，而不是只给出分布形式。

**错误 2 · 混淆 Fisher 信息矩阵与海森矩阵**

原因：两者在最大似然的目标函数上数值接近（Fisher 矩阵是海森矩阵的期望），因此容易被当作同一个矩阵。区别在于海森矩阵依赖具体数据与当前参数点，可以为负定或不稳定；Fisher 矩阵是分布的期望，总是半正定，且定义了不依赖参数化的度量。

解决：使用牛顿法时用海森矩阵，需要参数化不变的更新方向或计算估计方差下界时用 Fisher 矩阵。在报告中说明所用矩阵的类型与计算方式（样本平均、期望近似或解析形式），因为三者在数值上可能差别明显。

**错误 3 · 在变分推断中使用正向 KL 却期待覆盖全体后验支撑**

原因：正向与反向 KL 的偏好方向相反。正向 KL（$D_{\mathrm{KL}}(p \| q)$）惩罚$q$ 在 $p$ 认为可能的地方给了极小概率，导致近似分布倾向于覆盖全部支撑但方差偏大；反向 KL（变分推断中常用的 $D_{\mathrm{KL}}(q \| p)$）惩罚$q$ 在 $p$ 认为不可能的地方给了概率，导致近似分布倾向收缩到单个峰、低估方差。方向选择与期望的近似行为需要匹配。

解决：明确近似目标。需要覆盖多峰时用正向 KL 或混合类近似；需要局部精确（关注某个峰附近）时用反向 KL。报告近似后验时说明所用的散度方向，并给出后验预测检验作为诊断（2.12 节）。

**错误 4 · 在参数维度很高时直接构造 Fisher 矩阵求逆**

原因：Fisher 矩阵的维度等于参数总数，语言模型或深度网络的参数量在百万到十亿量级，存储与求逆都不可行。直接实现自然梯度会很快遇到内存或时间上的瓶颈。

解决：使用结构化的近似：对角近似、Kronecker 因子近似（K-FAC）、分块近似或低秩近似，并检查近似后更新方向的稳定性。工程上也可退而使用自适应一阶方法（按梯度平方的滑动平均调整每维步长），它不显式计算 Fisher 矩阵但在许多场景下达到相近的效果。判断是否值得引入自然梯度时，先用小规模子问题验证收益，再决定是否推广。