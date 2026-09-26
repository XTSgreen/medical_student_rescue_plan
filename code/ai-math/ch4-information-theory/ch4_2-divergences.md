---
title: 4.2 散度、距离与信息不等式
sidebar:
  order: 2
---
# 4.2 散度、距离与信息不等式

熵度量单个分布的不确定性，互信息度量两个变量的共享信息。还有一类需求没有被覆盖：给定两个分布，它们差多少。用近似分布替代真实分布损失了多少信息、生成样本的分布与真实分布偏离多远、模型的预测分布在训练过程中如何变化，这些问题都需要一个分布之间的差异的度量。

李雅普诺夫式的答案为这类需求提供了多个候选：KL 散度、交叉熵、JS 散度、f 散度、Rényi 散度、Tsallis 散度、Bregman 散度、总变差距离、Hellinger 距离、Wasserstein 距离、最大均值差异。它们之间的联系与区别是本节的中心内容。这些量并非可以任意互换：有的不对称，有的不满足三角不等式，有的在有重叠时才有界，有的即使分布完全不重叠也能给出有意义的梯度。选错度量会使估计与优化出现结构性错误，例如用 KL 训练生成模型时训练信号消失，用总变差做高维检验时功效极低。

本节按从 KL 散度出发逐步扩展的顺序组织。先给出 KL 散度的定义与四条关键性质，再讨论交叉熵与 JS 散度这两个直接派生量；随后引入 f 散度这一生成框架，把 KL、总变差、Hellinger、卡方统一进来；接着讨论 Rényi 与 Tsallis 两族参数化散度，以及来自凸分析的 Bregman 散度；最后处理三个基于几何或核的度量：Wasserstein 距离、最大均值差异，以及它们的适用场景。本节结尾说明各度量在不同任务中的选择依据，并与 4.3 节的信息几何建立接口。

## 4.2.1 KL 散度

### 定义

**KL 散度**（Kullback-Leibler divergence）度量用一个分布近似另一个分布的代价，定义为

$$
D_{\mathrm{KL}}(p \| q) = \sum_{x} p(x) \log \frac{p(x)}{q(x)}
$$

连续情形写成积分 $\int p(x) \log \frac{p(x)}{q(x)} \, dx$。两个要点需要先明确：求和中只对 $p(x) > 0$ 的项计算（$p$ 与 $q$ 的支撑需要相容，否则散度为无穷）；顺序不能交换，$D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 一般不等。

KL 散度在信息论中的解释是**近似带来的额外编码长度**。若真实分布为 $p$，却按 $q$ 设计编码方案，平均码长比最优方案多出的部分正好是 $D_{\mathrm{KL}}(p \| q)$（单位与所用对数底数一致）。这一解释（4.4 节给出严格版本）说明 KL 散度不是任意的数学构造，它有明确的操作含义。

### 非负性

$$
D_{\mathrm{KL}}(p \| q) \geq 0, \qquad \text{等号当且仅当 } p = q
$$

证明用 Jensen 不等式。对数函数是凹函数，因此 $E[\log Z] \leq \log E[Z]$（注意此处的负号处理）：

$$
-D_{\mathrm{KL}}(p \| q) = \sum_x p(x) \log \frac{q(x)}{p(x)} \leq \log \sum_x p(x) \cdot \frac{q(x)}{p(x)} = \log \sum_x q(x) = 0
$$

移项即得 $D_{\mathrm{KL}}(p \| q) \geq 0$。等号成立当且仅当 Jensen 不等式中等号成立，即 $q(x)/p(x)$ 对所有 $x$ 为常数，结合两者都是概率分布可知 $p = q$。

非负性有大量直接应用。上一节用它证明了 $H(X) \leq \log |\mathcal{X}|$ 与互信息非负，本节将用它证明 KL 散度是凸函数、最大似然估计与最小 KL 等价等结论。

### 不对称性与三角不等式

$D_{\mathrm{KL}}(p \| q) \neq D_{\mathrm{KL}}(q \| p)$ 一般成立，用一个二元分布的例子说明。取 $p = (0.9, 0.1)$、$q = (0.5, 0.5)$，以比特为单位：

$$
D_{\mathrm{KL}}(p \| q) = 0.9 \log 1.8 + 0.1 \log 0.2 \approx 0.531 \text{ 比特}
$$

$$
D_{\mathrm{KL}}(q \| p) = 0.5 \log \frac{0.5}{0.9} + 0.5 \log \frac{0.5}{0.1} \approx 0.738 \text{ 比特}
$$

不对称的根源是求和时按 $p$ 加权：$p$ 中出现而 $q$ 中几乎不出现的取值会被赋予很小的权重，反之则会被赋予很大的权重。当 $q(x)$ 很小而 $p(x)$ 不小（覆盖不足）时，代价急剧上升；当 $q$ 过度铺开时，代价相对温和。

KL 散度也不满足三角不等式：$D_{\mathrm{KL}}(p \| r) \leq D_{\mathrm{KL}}(p \| q) + D_{\mathrm{KL}}(q \| r)$ 不成立。因此 KL 在数学上属于**散度**（divergence）而非**距离**（distance）。使用中若需要对称性，用 JS 散度或将两个方向相加（$D_{\mathrm{KL}}(p \| q) + D_{\mathrm{KL}}(q \| p)$，这一组合称为对称 KL）。

### 是非负但不一定有界的量

两个分布支撑完全错开时 KL 散度为无穷。取 $p = (1, 0)$、$q = (0, 1)$，计算中出现 $\log(1/0)$，散度发散。更一般地，只要存在 $x$ 使 $p(x) > 0$ 而 $q(x) = 0$，散度就是无穷。这一性质在生成模型中带来实际困难：当生成分布完全没有覆盖某些真实样本时，损失函数变为无穷，梯度失去意义。改进方式包括对分布做平滑（加微小常数）、改用 JS 散度或 Wasserstein 距离。

在有限支撑且两个分布都取正值的条件下，散度有界。以比特为单位，$D_{\mathrm{KL}}(p \| q) \leq \log \frac{1}{\min_x q(x)}$，这一界在比较不同模型时有用。

### 两个常见分布的 KL 散度

**两个正态分布**。设 $p = N(\mu_1, \sigma_1^2)$、$q = N(\mu_2, \sigma_2^2)$，则

$$
D_{\mathrm{KL}}(p \| q) = \log \frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1 - \mu_2)^2}{2\sigma_2^2} - \frac{1}{2}
$$

这一公式在变分推断中经常出现：用高斯近似后验时，KL 项可以直接写出显式表达（2.12 节的 ELBO 中包含这一项）。

**两个伯努利分布**。设 $p = \mathrm{Bernoulli}(a)$、$q = \mathrm{Bernoulli}(b)$，则

$$
D_{\mathrm{KL}}(p \| q) = a \log \frac{a}{b} + (1 - a) \log \frac{1 - a}{1 - b}
$$

这是逻辑回归损失函数的基本单元（见交叉熵部分）。

```python
import numpy as np

def kl(p, q, eps=1e-12):
    """KL 散度（比特）"""
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float) + eps
    mask = p > 0
    return float(np.sum(p[mask] * np.log2(p[mask] / q[mask])))

p = np.array([0.9, 0.1])
q = np.array([0.5, 0.5])
print(f"D(p||q) = {kl(p, q):.4f} 比特")
print(f"D(q||p) = {kl(q, p):.4f} 比特   两者不相等，说明 KL 不对称")

# 两个正态分布的 KL（自然对数单位）
def kl_normal(mu1, s1, mu2, s2):
    return np.log(s2 / s1) + (s1 ** 2 + (mu1 - mu2) ** 2) / (2 * s2 ** 2) - 0.5

print(f"\n正态 KL（同方差，均值差 1）：{kl_normal(0, 1, 1, 1):.4f} 奈特")
print(f"正态 KL（同均值，方差 4 倍）：{kl_normal(0, 1, 0, 2):.4f} 奈特")
print(f"正态 KL（自身）：{kl_normal(0, 1, 0, 1):.4f} 奈特")
```

## 4.2.2 交叉熵

**交叉熵**（cross entropy）定义为

$$
H(p, q) = -\sum_x p(x) \log q(x)
$$

它与 KL 散度、熵的关系为

$$
H(p, q) = H(p) + D_{\mathrm{KL}}(p \| q)
$$

当 $p$ 是固定的真实分布时，$H(p)$ 与待优化的 $q$ 无关，因此**最小化交叉熵等价于最小化 KL 散度**。这一等价性是分类模型的损失函数设计依据。

以 $K$ 类分类为例，样本的真实标签 $y$ 对应一个独热分布 $p = \mathbf{e}_y$，模型的预测分布为 $q = \hat{\mathbf{p}}$。此时 $H(p) = 0$（独热分布的熵为零），交叉熵化简为

$$
H(p, q) = -\log \hat{p}_y
$$

即真实类别的预测概率的负对数。这一形式解释了交叉熵损失的直观：正确类别的预测概率越接近 $1$，损失越小；预测概率为 $0.5$ 时损失约为 $0.693$ 奈特，预测概率为 $0.1$ 时损失约为 $2.303$ 奈特。损失随概率误差按对数增长，梯度大小与预测偏差成正比，这些性质使它成为分类任务的标准选择。

交叉熵也是语言模型的训练目标。给定前缀 $\mathbf{x}_{<t}$，模型输出下一个词的条件分布 $\hat{p}(\cdot \mid \mathbf{x}_{<t})$，真实词为 $w$，损失为 $-\log \hat{p}(w \mid \mathbf{x}_{<t})$。由链式法则（4.1 节），序列的交叉熵之和对应负对数似然：

$$
-\log P(w_1, \ldots, w_T) = \sum_{t=1}^{T} -\log P(w_t \mid w_{<t})
$$

**困惑度**（perplexity）是这一损失的指数形式 $\exp\left(\frac{1}{T} \sum_t -\log P(w_t \mid w_{<t})\right)$，可以理解为模型在每个位置上平均犹豫的候选词数。困惑度等于 $k$ 意味着模型的预测不确定性与在 $k$ 个等可能选项之间选择相当。

```python
import numpy as np

def cross_entropy(p, q, eps=1e-12):
    """交叉熵（比特）"""
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float) + eps
    mask = p > 0
    return float(-np.sum(p[mask] * np.log2(q[mask])))

def entropy(p):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]
    return float(-np.sum(p * np.log2(p)))

p = np.array([0.0, 1.0, 0.0])                 # 独热标签
for pred in [[0.1, 0.7, 0.2], [0.2, 0.5, 0.3], [0.3, 0.4, 0.3]]:
    q = np.array(pred)
    print(f"预测分布 {pred}：交叉熵 = {cross_entropy(p, q):.4f} 比特")
# 正确类别概率越低，交叉熵越大

# 非独热情形：H(p, q) = H(p) + KL(p||q)
p_soft = np.array([0.1, 0.7, 0.2])
q_soft = np.array([0.2, 0.6, 0.2])
print(f"\nH(p) = {entropy(p_soft):.4f}，H(p,q) = {cross_entropy(p_soft, q_soft):.4f}")
print(f"验证 H(p,q) - H(p) = {cross_entropy(p_soft, q_soft) - entropy(p_soft):.4f}")
```

## 4.2.3 JS 散度

**JS 散度**（Jensen-Shannon divergence）把 KL 散度对称化并限制取值：

$$
D_{\mathrm{JS}}(p \| q) = \frac{1}{2} D_{\mathrm{KL}}\left(p \,\middle\|\, m\right) + \frac{1}{2} D_{\mathrm{KL}}\left(q \,\middle\|\, m\right), \qquad m = \frac{p + q}{2}
$$

其中 $m$ 是两个分布的平均分布。JS 散度有三条优于 KL 的性质。

**对称性**：$D_{\mathrm{JS}}(p \| q) = D_{\mathrm{JS}}(q \| p)$，从定义的对称形式直接得到。

**有界性**：以比特为单位，$0 \leq D_{\mathrm{JS}}(p \| q) \leq 1$。上界由 $m$ 的性质得到：$D_{\mathrm{KL}}(p \| m) \leq \log 2$（当 $p$ 与 $m$ 的比值为 $2$ 时取等）。有界性使 JS 散度不会因支撑错开而发散，这一点在比较差异悬殊的分布时重要。

**有定义的平方根**：$\sqrt{D_{\mathrm{JS}}(p \| q)}$ 满足三角不等式，因此它是真正的距离函数（度量）。这一性质使 JS 散度可以用于聚类与近邻搜索这类需要度量结构的任务。

JS 散度与 JS 距离（$D_{\mathrm{JS}}$ 本身，不满足三角不等式）容易混淆，报告时说明用的是哪一个。在生成模型的评价中，两个分布完全不重叠时 $D_{\mathrm{JS}}(p \| q) = 1$，梯度为零，这使基于 JS 的对抗训练在某些阶段停滞。Wasserstein 距离（4.2.7 节）正是为解决这一困难而引入。

```python
import numpy as np

def kl(p, q, eps=1e-12):
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float) + eps
    mask = p > 0
    return float(np.sum(p[mask] * np.log2(p[mask] / q[mask])))

def js(p, q):
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    m = 0.5 * (p + q)
    return 0.5 * kl(p, m) + 0.5 * kl(q, m)

p = np.array([0.9, 0.1])
q = np.array([0.5, 0.5])
print(f"D_JS(p||q) = {js(p, q):.4f}，D_JS(q||p) = {js(q, p):.4f}   对称")
print(f"支撑完全不重叠时：D_JS = {js([1.0, 0.0], [0.0, 1.0]):.4f} 比特（上界 1）")
print(f"KL 在同样情形下为无穷：D_KL = {kl([1.0, 0.0], [0.0, 1.0], eps=0.0):.2e}（数值溢出前的替代值）")
# 说明 JS 有界，KL 发散
```

## 4.2.4 f 散度

### 定义

**f 散度**（f-divergence）用凸函数统一了一大批散度。设 $f: (0, \infty) \to \R$ 是凸函数且 $f(1) = 0$，定义

$$
D_f(p \| q) = \sum_x q(x) f\left(\frac{p(x)}{q(x)}\right)
$$

由 $f$ 的凸性与 $f(1) = 0$，可以用 Jensen 不等式证明 $D_f(p \| q) \geq 0$，等号当且仅当 $p = q$。f 散度的一般形式带来了统一的性质清单：非负、由凸函数生成、在共同的充分统计量变换下不增（数据处理不等式对 f 散度普遍成立）。

### 常见散度在 f 散度框架中的位置

不同的 $f$ 给出不同的散度：

| 名称 | 生成函数 $f(u)$ | 备注 |
|------|------------------|------|
| KL 散度 $D_{\mathrm{KL}}(p \| q)$ | $u \log u$ | 不对称 |
| 反向 KL $D_{\mathrm{KL}}(q \| p)$ | $-\log u$ | 与上者互为反向 |
| 总变差 | $\frac{1}{2}\|u - 1\|$ | 对称、有界 |
| 卡方散度 | $(u - 1)^2$ | 对上尾敏感 |
| Hellinger 距离平方 | $(\sqrt{u} - 1)^2$ | 有界、对称 |
| $\alpha$ 散度 | 见 4.2.5 节 | 包含 KL 的两个方向为极限 |

表格的意义在于把散度设计转化为 Selecting $f$ 的问题。需要对称且有界时选总变差或 Hellinger；需要对 $p$ 大于 $q$ 的区域特别敏感时选卡方；需要保持 KL 的编码解释时选 $u \log u$。

### 变分表示

f 散度有一个由凸共轭给出的变分表示，它是互信息估计与对抗式训练的理论依据。由 Fenchel 对偶（3.2 节的共轭函数），

$$
D_f(p \| q) = \sup_{T} \ E_{p}\left[T(x)\right] - E_{q}\left[f^*(T(x))\right]
$$

其中 $f^*$ 是 $f$ 的凸共轭，上确界在某个函数类上取。这一形式把散度的计算转化为一个优化问题：寻找使右边最大的判别函数 $T$。生成对抗网络的判别器目标、互信息的 MINE 估计、f-GAN 的训练目标都取自这一表示（4.7 节）。变分表示的实践价值在于：散度本身可能难以估计（尤其是高维与连续情形），但变分形式只需要期望，可以用样本平均近似。

```python
import numpy as np

def f_divergence(p, q, f):
    """按定义计算 f 散度"""
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    mask = (q > 0)
    u = np.where(mask, p / np.where(mask, q, 1.0), 0.0)
    return float(np.sum(q[mask] * f(u[mask])))

f_kl = lambda u: np.where(u > 0, u * np.log(u), 0.0)
f_tv = lambda u: 0.5 * np.abs(u - 1)
f_chi2 = lambda u: (u - 1) ** 2
f_hell = lambda u: (np.sqrt(u) - 1) ** 2

p = np.array([0.7, 0.2, 0.1])
q = np.array([0.5, 0.3, 0.2])
print(f"KL(p||q)      = {f_divergence(p, q, f_kl):.4f}")
print(f"总变差        = {f_divergence(p, q, f_tv):.4f}")
print(f"卡方散度      = {f_divergence(p, q, f_chi2):.4f}")
print(f"Hellinger 平方 = {f_divergence(p, q, f_hell):.4f}")
# 各散度数值不同但符号一致，且都在 p = q 时为零
```

## 4.2.5 Rényi 散度与 Tsallis 散度

### Rényi 散度

**Rényi 散度**（Rényi divergence）用一个阶参数 $\alpha$ 串联起 KL 散度的两个方向：

$$
D_\alpha(p \| q) = \frac{1}{\alpha - 1} \log \sum_x p(x)^\alpha q(x)^{1 - \alpha}, \qquad \alpha > 0, \ \alpha \neq 1
$$

阶参数的作用决定了对分布哪一部分更敏感。$\alpha$ 较大时，求和中的大项（$p$ 大而 $q$ 小的区域）主导，散度对$q$ 未覆盖 $p$ 的高概率区敏感；$\alpha$ 较小时，$q$ 比 $p$ 大的区域影响被放大。两条极限关系把它与 KL 散度连接：

$$
\lim_{\alpha \to 1} D_\alpha(p \| q) = D_{\mathrm{KL}}(p \| q), \qquad
\lim_{\alpha \to \infty} D_\alpha(p \| q) = \log \max_x \frac{p(x)}{q(x)}
$$

第二条极限称为**最大散度**（max-divergence），在差分隐私的定义中直接使用（4.8 节）。当 $\alpha \to 0$ 时散度趋于反向 KL。Rényi 熵（把散度中的 $q$ 取均匀分布得到）族同样以 $\alpha$ 为参数，$\alpha = 1$ 给出香农熵，$\alpha = 0$ 给出支撑集大小的对数，$\alpha \to \infty$ 给出最大概率的负对数（最小熵）。

### Tsallis 散度

**Tsallis 散度**（Tsallis divergence）用 $q$ 参数家族替代对数：

$$
D_q^{\mathrm{T}}(p \| q) = \frac{1}{q - 1}\left(1 - \sum_x p(x)^q q(x)^{1 - q}\right)
$$

它与 Rényi 散度的关系是单调变换：$D_q^{\mathrm{T}} = \frac{1}{q-1}\left(1 - e^{(q-1)D_q^{\mathrm{R}}}\right)$，因此两者的序相同，但数值尺度不同。Tsallis 形式在期望上是线性的（不含对数内的求和），在某些估计场景下更便于处理，非扩展统计力学与部分机器学习方法使用它。

```python
import numpy as np

def renyi(p, q, alpha, base=np.e):
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    if abs(alpha - 1) < 1e-12:
        mask = p > 0
        return float(np.sum(p[mask] * np.log(p[mask] / q[mask])) / np.log(base))
    s = np.sum(np.where(p > 0, p ** alpha * q ** (1 - alpha), 0.0))
    return float(np.log(s) / ((alpha - 1) * np.log(base)))

p = np.array([0.8, 0.15, 0.05])
q = np.array([0.6, 0.3, 0.1])
for a in [0.5, 1.0, 2.0, 5.0, 20.0]:
    print(f"alpha = {a:5.1f}：Rényi 散度 = {renyi(p, q, a, base=2):.4f} 比特")
print(f"最大散度 log2 max(p/q) = {np.log2(np.max(p / q)):.4f} 比特")
# alpha 增大时散度单调上升，趋近最大散度
```

## 4.2.6 Bregman 散度

### 定义

**Bregman 散度**（Bregman divergence）由可微凸函数 $\phi$ 生成：

$$
D_\phi(\mathbf{x}, \mathbf{y}) = \phi(\mathbf{x}) - \phi(\mathbf{y}) - \nabla \phi(\mathbf{y})^T (\mathbf{x} - \mathbf{y})
$$

几何含义是 $\phi$ 在 $\mathbf{y}$ 处的一阶泰勒展开与 $\phi(\mathbf{x})$ 之间的差，即用切线近似函数值所留下的余量。由 $\phi$ 的凸性可知 $D_\phi \geq 0$，等号当且仅当 $\mathbf{x} = \mathbf{y}$。

Bregman 散度在参数空间而非分布空间上定义，因此它同时适用于参数估计与矩阵分解。常见的实例：

| 生成函数 $\phi$ | 散度 | 用途 |
|-----------------|------|------|
| $\frac{1}{2}\|\mathbf{x}\|^2$ | 欧氏距离平方 | 最小二乘 |
| $\sum_i x_i \log x_i$ | 广义 KL 散度 | 非负矩阵分解、计数数据的拟合 |
| $-\sum_i \log x_i$ | Itakura-Saito 散度 | 谱分解、音频处理 |
| $\sum_i (x_i \log x_i - x_i)$ | 指数族的 KL 形式 | 广义线性模型 |

### 与凸共轭、镜像下降的关系

Bregman 散度与凸共轭函数通过**对偶配对**联系：$D_\phi(\mathbf{x}, \mathbf{y}) = D_{\phi^*}(\nabla\phi(\mathbf{y}), \nabla\phi(\mathbf{x}))$。这一关系使散度可以在原空间与对偶空间之间转换，是镜像下降算法（mirror descent）的基础：镜像下降在每一步用 Bregman 散度衡量移动的代价，再投影回可行域。选不同的 $\phi$ 得到不同的算法，取欧氏距离平方得到投影梯度，取熵得到指数加权更新（在在线学习与专家建议问题中广泛使用）。

```python
import numpy as np

def bregman(x, y, phi, grad_phi):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    return float(phi(x) - phi(y) - grad_phi(y) @ (x - y))

phi_euclid = lambda x: 0.5 * np.sum(x ** 2)
grad_euclid = lambda x: x
phi_ent = lambda x: np.sum(np.where(x > 0, x * np.log(np.where(x > 0, x, 1.0)), 0.0))
grad_ent = lambda x: np.log(np.where(x > 0, x, 1.0))

x = np.array([0.6, 0.4])
y = np.array([0.5, 0.5])
print(f"欧氏生成函数的 Bregman 散度 = {bregman(x, y, phi_euclid, grad_euclid):.4f}")
print(f"负熵生成函数的 Bregman 散度 = {bregman(x, y, phi_ent, grad_ent):.4f}")
# 后者与 KL 散度同源，数值上等于 KL(x||y)（以奈特为单位）
```

## 4.2.7 总变差距离与 Hellinger 距离

### 总变差距离

**总变差距离**（total variation distance）定义为两个分布在任意事件上概率差的上确界：

$$
\delta(p, q) = \sup_{A} |p(A) - q(A)| = \frac{1}{2} \sum_x |p(x) - q(x)|
$$

右端的等式对离散分布成立。总变差是对称的、取值在 $[0, 1]$ 内、满足三角不等式，是严格意义下的距离。它的解释是：两个分布在同一事件上的概率最多相差多少。在假设检验中，总变差给出了最优检验的**误差和**：

$$
1 - \delta(p, q) = \min_{\text{检验}} \left(P(\text{判为 } q \mid p) + P(\text{判为 } p \mid q)\right)
$$

这一结论说明总变差与可区分性完全对应：$\delta$ 接近 $1$ 时两个分布几乎不重叠，任何检验都能分开；$\delta$ 接近 $0$ 时最优检验的错误率之和接近 $1$，两个分布无法可靠区分。

总变差与 KL 散度之间由 **Pinsker 不等式**联系：

$$
\delta(p, q) \leq \sqrt{\frac{1}{2} D_{\mathrm{KL}}(p \| q)}
$$

以奈特为单位。这条不等式说明了为什么用 KL 衡量差异时会出现看似矛盾的结论：KL 可以很大（甚至无穷）而总变差仍然有界。反过来，总变差小意味着 KL 小（在一定条件下），这使它成为更强的分布接近判据。

### Hellinger 距离

**Hellinger 距离**（Hellinger distance）定义为

$$
H(p, q) = \frac{1}{\sqrt{2}} \sqrt{\sum_x \left(\sqrt{p(x)} - \sqrt{q(x)}\right)^2} = \sqrt{1 - \sum_x \sqrt{p(x)q(x)}}
$$

其中 $\sum_x \sqrt{p(x)q(x)}$ 称为**巴氏系数**（Bhattacharyya coefficient），度量两个分布的相似程度。Hellinger 距离对称、取值在 $[0, 1]$ 内、满足三角不等式，与总变差之间由不等式 $\frac{1}{2}H^2 \leq \delta \leq H\sqrt{1 - H^2/4}$ 联系，两者给出相近的结论。取平方根变换的作用是把分布拉向平整的形式，使对接近零的取值不那么敏感。

在统计中，Hellinger 距离的平方是**局部渐近正态**理论中的标准工具：两个接近的分布之间的 KL 散度与 Hellinger 距离平方在局部有相同的二阶主项，而 Hellinger 距离的估计更稳定（对稀疏计数不敏感）。

## 4.2.8 Wasserstein 距离与最大均值差异

### Wasserstein 距离

前面所有散度都建立在逐点比较概率值的基础上，这使它们对支撑的几何位置不敏感。举一个极端例子：取 $p$ 为 $\{0\}$ 上的点质量、$q_1$ 为 $\{0.01\}$ 上的点质量、$q_2$ 为 $\{100\}$ 上的点质量，则 $D_{\mathrm{KL}}(p \| q_1) = D_{\mathrm{KL}}(p \| q_2) = \infty$、$D_{\mathrm{JS}}(p \| q_1) = D_{\mathrm{JS}}(p \| q_2) = 1$、$\delta(p, q_1) = \delta(p, q_2) = 1$。所有度量都认为 $q_1$ 与 $q_2$ 一样远，忽略了 0.01 与 100 之间的区别。

**Wasserstein 距离**（Wasserstein distance）利用取值空间上的度量解决这一问题。一阶情形（也称推土机距离）定义为

$$
W_1(p, q) = \inf_{\gamma \in \Gamma(p, q)} \int \|\mathbf{x} - \mathbf{y}\| \, d\gamma(\mathbf{x}, \mathbf{y})
$$

其中 $\Gamma(p, q)$ 是边缘分别为 $p$ 与 $q$ 的联合分布（称为**耦合**或传输方案）的集合。距离的含义是把分布 $p$ 的质量搬到 $q$ 所需的最小平均搬运成本。对一维分布有闭式表达：

$$
W_1(p, q) = \int_0^1 \left|F_p^{-1}(t) - F_q^{-1}(t)\right| \, dt
$$

即两个分位数函数之差的积分。上例中 $W_1(p, q_1) = 0.01$、$W_1(p, q_2) = 100$，区分了两种情形。

Wasserstein 距离的关键性质有三条。第一，它利用空间度量，因此能反映分布位置与形状的差异，而不仅是有无重叠。第二，它**弱化了对支撑的要求**：支撑错开时 Wasserstein 距离仍然有界，且当两个分布都连续时它是可微的（在一定条件下），这使梯度流有意义。第三，**Kantorovich 对偶**给出另一个表达：

$$
W_1(p, q) = \sup_{\|f\|_{\mathrm{Lip}} \leq 1} \ E_p[f(X)] - E_q[f(X)]
$$

上确界在 1-Lipschitz 函数上取。这一形式只需要期望，与 f 散度的变分表示结构相同，是 Wasserstein GAN 用判别器（限制为 Lipschitz 函数）估计距离的依据。代价是计算量：一般情形下的精确计算是线性规划问题，高维时依赖熵正则化的近似算法（Sinkhorn 算法）。

### 最大均值差异

**最大均值差异**（maximum mean discrepancy，MMD）用核函数把分布映射到再生核希尔伯特空间（RKHS），再比较两者的均值：

$$
\mathrm{MMD}^2(p, q) = \left\|E_p[\phi(X)] - E_q[\phi(Y)]\right\|_{\mathcal{H}}^2
$$

其中 $\phi$ 是由核 $k$ 诱导的特征映射。展开后可以只用核函数计算：

$$
\mathrm{MMD}^2(p, q) = E_{p, p'}[k(X, X')] + E_{q, q'}[k(Y, Y')] - 2 E_{p, q}[k(X, Y)]
$$

三项都是核函数的期望，可以由样本平均直接估计，不需要估计密度。当核是**特征核**（characteristic kernel，如高斯核）时，$\mathrm{MMD}(p, q) = 0$ 当且仅当 $p = q$，因此 MMD 是严格的距离度量。

MMD 的用途集中在两类任务。作为**两样本检验**统计量：给定两组样本，判断它们是否来自同一分布，MMD 的样本估计有已知的零分布，检验功效通常优于基于总变差的方法。作为**训练目标**：在生成模型中用 MMD 衡量生成分布与真实分布的差异，训练过程不需要对抗博弈，稳定性好。它的性质介于逐点散度与 Wasserstein 距离之间：利用了核引入的几何结构，计算量与样本量成平方关系（可用无偏估计与随机特征近似降低）。

```python
import numpy as np

# 一维 Wasserstein 距离的闭式计算：分位数函数之差的积分
def wasserstein1_1d(x, y, n_grid=2000):
    grid = np.linspace(0, 1, n_grid)
    qx = np.quantile(x, grid)
    qy = np.quantile(y, grid)
    return float(np.trapezoid(np.abs(qx - qy), grid))

rng = np.random.default_rng(5)
a = rng.normal(0, 1, size=20_000)
b_close = rng.normal(0.01, 1, size=20_000)
b_far = rng.normal(100, 1, size=20_000)

print(f"W1(p, q_接近) = {wasserstein1_1d(a, b_close):.4f}")
print(f"W1(p, q_远离) = {wasserstein1_1d(a, b_far):.4f}")
# KL 与总变差对两者给出相同结论，Wasserstein 能区分远近

# MMD 的样本估计（高斯核）
def mmd2(x, y, sigma=1.0):
    def k(u, v):
        return np.exp(-((u[:, None] - v[None, :]) ** 2) / (2 * sigma ** 2))
    return float(k(x, x).mean() + k(y, y).mean() - 2 * k(x, y).mean())

xs = rng.normal(0, 1, size=400)
ys = rng.normal(0.3, 1, size=400)
zs = rng.normal(0, 1, size=400)
print(f"\nMMD²（同分布）  = {mmd2(xs, zs):.6f}")
print(f"MMD²（均值差 0.3）= {mmd2(xs, ys):.6f}")
```

## 4.2.9 如何选择度量

选择度量需要先明确任务要求，再对照度量的性质。下表给出常见的对照维度。

| 性质 | KL | JS | 总变差 | Hellinger | Wasserstein | MMD |
|------|----|----|--------|-----------|-------------|-----|
| 对称 | 否 | 是 | 是 | 是 | 是 | 是 |
| 有界 | 否 | 是 | 是 | 是 | 否 | 否 |
| 满足三角不等式 | 否 | 平方根满足 | 是 | 是 | 是 | 是 |
| 支撑错开时有限 | 否 | 是 | 是 | 是 | 是 | 是 |
| 利用取值几何结构 | 否 | 否 | 否 | 否 | 是 | 是（核） |
| 无需密度估计即可从样本估计 | 否 | 否 | 是 | 部分 | 是（有近似） | 是 |

三条实践建议。第一，训练生成模型时优先考虑能提供有效梯度的度量：支撑不重叠时 KL 与 JS 的梯度消失，Wasserstein 与 MMD 仍有信号。第二，做分布检验时优先考虑能从样本直接估计的度量：总变差、MMD 有成熟的检验统计量与零分布，KL 需要先做密度估计，在高维下不可靠。第三，需要解释性时回到 KL：它有明确的编码代价解释，而 Wasserstein 与 MMD 的数值尺度依赖空间度量与核的选择。

KL 散度还有一个特殊的地位：它是唯一使最大似然估计与最小散度等价的选择，因为在 $p$ 固定时 $D_{\mathrm{KL}}(p \| q)$ 与交叉熵只差一个常数。这解释了为什么统计推断中默认使用最大似然与交叉熵，而需要几何敏感或梯度稳定时才换用其他度量。

## 4.2.10 本节小结

::: success 从 KL 出发的度量家族
本节以 KL 散度为中心展开了一族分布差异度量。KL 散度由近似带来的额外编码长度定义，非负性来自 Jensen 不等式，不对称与不满足三角不等式使它属于散度而非距离，支撑错开时发散是它在生成模型中的主要弱点。交叉熵与 KL 散度只差一个与待优化分布无关的常数项，因此在固定真实分布时两者等价，这是分类损失与语言模型训练目标的设计依据。JS 散度通过对平均分布取双向 KL 得到对称且有界的版本，其平方根满足三角不等式。f 散度用凸生成函数统一了 KL、总变差、卡方与 Hellinger，并由凸共轭给出变分表示，这一表示是互信息估计与对抗式训练的起点。Rényi 与 Tsallis 散度以阶参数串联 KL 的两个方向与最大散度，Bregman 散度把散度定义在参数空间上并与镜像下降算法对应。总变差距离与假设检验的错误率直接对应，Hellinger 距离在局部渐近分析中更稳定；Wasserstein 距离与最大均值差异利用取值空间上的度量与核结构，在支撑错开时仍提供有效梯度，代价是计算量与超参数选择。
:::

散度给出了分布之间距离的概念，但它还没有回答一个自然的问题：在由参数化的分布构成的集合上，这些散度如何随参数变化。把参数空间与散度结合，就得到信息几何的框架：KL 散度的局部二阶展开给出一个度量张量，这个张量正是第 2.9 节出现过的 Fisher 信息矩阵。下一节讨论最大熵原理、指数族与信息几何，把统计模型组织成一个带度量的空间，并给出自然梯度与变分推断的几何解释。

## 练习题

### 第 1 题 概念推导

证明 KL 散度的非负性，并说明等号成立的条件；再用该结论证明互信息的非负性。

::: details 参考答案
**非负性**：由 Jensen 不等式，对凹函数 $\log$ 有 $E[\log Z] \leq \log E[Z]$。取 $Z = q(X)/p(X)$（$X \sim p$），则

$$
-D_{\mathrm{KL}}(p \| q) = \sum_x p(x) \log \frac{q(x)}{p(x)} = E\left[\log Z\right] \leq \log E[Z] = \log \sum_x p(x) \frac{q(x)}{p(x)} = \log \sum_x q(x) = 0
$$

因此 $D_{\mathrm{KL}}(p \| q) \geq 0$。

**等号条件**：Jensen 不等式中等号成立当且仅当 $Z$ 几乎必然为常数，即 $q(x)/p(x) = c$ 对所有 $p(x) > 0$ 的 $x$ 成立。两边对 $x$ 按 $p$ 求和：$\sum_x p(x) \cdot c = \sum_x q(x) = 1$，故 $c = 1$，于是 $p(x) = q(x)$。反过来 $p = q$ 时每一项 $\log 1 = 0$，散度为零。

**互信息非负**：由定义

$$
I(X; Y) = \sum_{x, y} p(x, y) \log \frac{p(x, y)}{p(x)p(y)} = D_{\mathrm{KL}}\left(p(x, y) \,\|\, p(x)p(y)\right)
$$

把它写成 KL 散度的形式后，直接应用上面的结论：非负性成立，等号当且仅当 $p(x, y) = p(x)p(y)$ 对所有取值成立，即 $X$ 与 $Y$ 独立。这两个结论是同一个不等式在不同对象上的应用，KL 散度的非负性因此成为整章中使用频率最高的工具。
:::

### 第 2 题 计算推理

某生成模型用高斯分布 $q = N(\mu, \sigma^2)$ 近似真实分布 $p = N(0, 1)$。请写出 $D_{\mathrm{KL}}(p \| q)$ 的表达式；分别计算 $(\mu, \sigma) = (0, 1)$、$(0.5, 1)$、$(0, 1.5)$ 三种情形下的数值；说明为什么最小化这一散度时，对均值误差与方差误差的惩罚形式不同。

::: details 参考答案
**表达式**：把 $\mu_1 = 0$、$\sigma_1 = 1$ 代入正态 KL 公式，

$$
D_{\mathrm{KL}}(p \| q) = \log \sigma + \frac{1 + \mu^2}{2\sigma^2} - \frac{1}{2}
$$

**数值**（以奈特为单位）：

| $(\mu, \sigma)$ | $D_{\mathrm{KL}}$ |
|---|---|
| $(0, 1)$ | $0 + 0.5 - 0.5 = 0$ |
| $(0.5, 1)$ | $0 + \frac{1.25}{2} - 0.5 = 0.125$ |
| $(0, 1.5)$ | $\log 1.5 + \frac{1}{4.5} - 0.5 \approx 0.4055 - 0.2778 \approx 0.128$ |

**惩罚形式不同的原因**：均值误差以 $\mu^2 / (2\sigma^2)$ 的形式进入，是关于 $\mu$ 的二次函数，梯度为 $\mu/\sigma^2$，在 $\mu = 0$ 处为零，因此均值偏差在接近正确值时惩罚迅速减轻。方差误差以 $\log \sigma + \frac{1 + \mu^2}{2\sigma^2}$ 的形式进入，关于 $\sigma$ 不是二次函数：$\sigma$ 偏离 1 时，$\log \sigma$ 项与 $1/\sigma^2$ 项的方向相反，最优点被这两项的平衡确定。

更重要的是方向的不对称：$\sigma < 1$ 时（近似分布过于集中），$1/\sigma^2$ 增长很快，惩罚急剧上升；$\sigma > 1$ 时惩罚上升相对缓慢。原因是 $D_{\mathrm{KL}}(p \| q)$ 按 $p$ 加权，$p$ 的尾部区域在 $q$ 下概率很小，惩罚是$q$ 在 $p$ 认为可能的地方给了小概率，这对应近似分布过度集中。反向的 $D_{\mathrm{KL}}(q \| p)$ 则惩罚相反的方向，导致近似分布宁可铺开也不愿漏掉尾部。这一差别是变分推断中近似后验倾向于低估方差（用正向 KL）的根源。
:::

### 第 3 题 代码验证

比较五种散度在两个分布逐渐分开时的变化：用一维高斯混合构造 $p$，用另一个高斯构造 $q$，逐步平移 $q$ 的均值，记录 KL、JS、总变差、Hellinger 与 Wasserstein 距离的变化曲线，并指出哪一种度量在重叠消失后仍然提供有意义的数值。

::: details 参考答案

```python
import numpy as np
from scipy import stats

def kl_gauss(mu1, s1, mu2, s2):
    return np.log(s2 / s1) + (s1 ** 2 + (mu1 - mu2) ** 2) / (2 * s2 ** 2) - 0.5

def js_gauss(mu1, s1, mu2, s2, n=200_001, lim=30):
    x = np.linspace(-lim, lim, n)
    p = stats.norm.pdf(x, mu1, s1)
    q = stats.norm.pdf(x, mu2, s2)
    m = 0.5 * (p + q)
    dx = x[1] - x[0]
    kl_pm = np.sum(np.where(p > 0, p * np.log(p / np.maximum(m, 1e-300)), 0)) * dx
    kl_qm = np.sum(np.where(q > 0, q * np.log(q / np.maximum(m, 1e-300)), 0)) * dx
    return 0.5 * (kl_pm + kl_qm)

def tv_gauss(mu1, s1, mu2, s2, n=200_001, lim=30):
    x = np.linspace(-lim, lim, n)
    p = stats.norm.pdf(x, mu1, s1)
    q = stats.norm.pdf(x, mu2, s2)
    return 0.5 * np.sum(np.abs(p - q)) * (x[1] - x[0])

def hellinger_gauss(mu1, s1, mu2, s2, n=200_001, lim=30):
    x = np.linspace(-lim, lim, n)
    p = stats.norm.pdf(x, mu1, s1)
    q = stats.norm.pdf(x, mu2, s2)
    dx = x[1] - x[0]
    return np.sqrt(max(0.0, 1 - np.sum(np.sqrt(p * q)) * dx))

print(f"{'Δμ':>5} {'KL':>8} {'JS':>8} {'TV':>8} {'Hell':>8} {'W2(近似)':>10}")
for d in [0.0, 0.5, 1.0, 2.0, 5.0, 10.0]:
    kl = kl_gauss(0, 1, d, 1)
    js = js_gauss(0, 1, d, 1)
    tv = tv_gauss(0, 1, d, 1)
    he = hellinger_gauss(0, 1, d, 1)
    print(f"{d:5.1f} {kl:8.3f} {js:8.4f} {tv:8.4f} {he:8.4f} {np.abs(d):10.3f}")
# W2 一维闭式解为 |Δμ|（同方差情形）
```

输出的典型规律是：随着均值差距增大，KL 按 $d^2/2$ 增长（无上界），JS 迅速趋于上界 $\log 2 \approx 0.693$，总变差趋于 $1$，Hellinger 趋于 $1$，而 Wasserstein 按 $|d|$ 线性增长且无上界。前四种度量在分布几乎不重叠之后都失去分辨率（数值接近上限，继续增大差距不再改变结果），只有 Wasserstein 仍然能区分差距的大小。这一对比是生成模型中偏好 Wasserstein 距离的原因：当生成分布尚未覆盖真实分布时，其他度量给出的梯度接近零，训练停滞。
:::

### 第 4 题 综合应用

某团队要评估两个文本生成模型的输出分布与真实文本分布的差异。他们考虑三种做法：用困惑度（交叉熵）、用 JS 散度、用 MMD。请说明三种做法的对象与假设，指出各自在什么条件下会给出误导性结论，并给出一个组合使用它们的评估方案。

::: details 参考答案
**三种做法的对象与假设**。困惑度计算模型在真实文本上的平均负对数似然，度量的是模型对真实数据的预测能力，只需要模型能给出似然，不需要估计分布本身。JS 散度要求把两个分布都显式表示出来，在词表大小为 $V$、序列长度为 $T$ 的文本空间上无法直接计算，通常退化为在固定长度窗口或词袋表示上比较某些统计量的分布。MMD 在句向量或 n-gram 特征空间上计算，需要选择一个核函数与一个表示空间，度量的是在这个空间里两组样本的均值差异。

**各自的误导条件**。困惑度会奖励那些覆盖全部真实样本但分配不匀的模型：把所有概率都分给高频模式时，总体困惑度可能不错，但生成样本缺乏多样性，这一现象称为**模型崩溃**，困惑度对这种失败不敏感。JS 散度在词分布层面比较时，若两个分布的支撑几乎不重叠（生僻词一律不生成），数值会直接饱和到上界，无法反映改进的幅度。MMD 的结果强烈依赖核带宽与表示空间：带宽选得过大时所有样本都像来自同一分布，选得过小时任何差异都被放大，表示空间若无法捕捉语义，MMD 的结论与人类判断不符。

**组合方案**。分三层评估。第一层用困惑度判断模型是否学到了真实数据的统计规律，同时报告生成样本的 n-gram 多样性指标（如去重后的 n-gram 比例）以检查是否发生模型崩溃。第二层用分布层面的度量，在句向量空间上同时计算 MMD 与 Wasserstein 距离，以多个核带宽与多个随机投影重复计算，报告数值的分布而非单点值。第三层用人或独立模型的判断，对生成样本与真实样本做区分实验（请标注者判断哪些是生成的），得到人类可分辨的比例作为最终指标。三层结合的原因是它们各自有盲区：困惑度看不出多样性缺失，分布度量受表示与核的选择影响，人类判断代价高且噪声大，交叉验证可以覆盖单一指标的盲区。
:::

## 常见错误

**错误 1 · 在需要对称性的场合使用 KL 散度**

原因：KL 散度不对称，$D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 在数值与含义上不同。把两个方向混用或在聚类、近邻搜索这类需要度量结构的任务中使用 KL，会得到与距离概念不一致的结果。

解决：需要对称时改用 JS 散度、总变差或 Hellinger 距离，三者都满足三角不等式。必须使用 KL 时明确写出方向并说明选择该方向的原因，例如变分推断用 $D_{\mathrm{KL}}(q \| p)$ 是因为要对近似分布求期望。

**错误 2 · 在支撑可能不重叠的场景直接用 KL 作为训练损失**

原因：支撑错开时 KL 散度发散，梯度失去意义。生成模型早期阶段生成分布与真实分布几乎不重叠，此时 KL 与 JS 给不出有效梯度，训练停滞而损失曲线看起来只是平缓。

解决：改用 Wasserstein 距离或 MMD，它们在支撑错开时仍提供有意义的梯度；或对分布做平滑处理并在训练早期使用，随着分布接近再切换回 KL 与交叉熵。监控手段是同时记录总变差或 MMD 作为辅助指标，判断重叠程度。

**错误 3 · 把总变差与 KL 的数值大小直接比较**

原因：两个度量的尺度不同。KL 无上界，可以取到几十甚至无穷；总变差始终在 $[0, 1]$ 内。看到 KL 值远大于总变差就断定分布差异很大，忽略了尺度差异。Pinsker 不等式给出的关系是 $\delta \leq \sqrt{D_{\mathrm{KL}}/2}$，是平方根关系而非线性关系。

解决：比较不同度量的数值时先换算到同一尺度，或直接使用不等式给出的界。报告结果时说明所用度量与单位（比特或奈特），避免读者按其他度量的尺度理解数值。

**错误 4 · 用固定核带宽的 MMD 比较差异悬殊的分布**

原因：MMD 的核带宽决定了它能分辨的尺度。带宽固定时，样本之间距离远大于带宽的情形下核值全部接近零，MMD 无法区分不同的差异；距离远小于带宽时核值全部接近 1，差异被抹平。用单一带宽得到两个分布没有差异的结论可能是带宽选择的结果。

解决：在多个带宽下计算 MMD，取其中最大的（或报告各带宽的完整曲线）。使用**多核 MMD**（把多个带宽的高斯核求和作为核函数）可以避免手动选择，代价是计算量增加。同时报告所选的表示空间，说明语义相似度是否被核捕捉。