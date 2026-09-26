---
title: 4.6 信息论与假设检验、大偏差
sidebar:
  order: 6
---
# 4.6 信息论与假设检验、大偏差

4.4 与 4.5 两节讨论的是工程极限：压缩率与传输速率的上界。本节把视角转回统计推断，回答另一类问题：如果要用数据在两件事之间做判断，或者要从数据中估计一个参数，信息量能给出什么保证。第二章已经建立了假设检验框架与 Cramér-Rao 下界，本节补上信息论视角下的推导与量化结果。

两个方向会反复出现。其一是**误差指数**：样本量增大时，检验的错误概率以指数速度下降，下降速度由 KL 散度或它的变体决定。这一结果把定性的极限定理变成可以估算样本量的公式。其二是**大偏差**：大数定律只说样本均值收敛到期望，大偏差理论给出偏离以多快的指数速度被抑制，抑制速度由 KL 散度给出的速率函数控制。两者是同一个机制在两个问题上的表现。

本节按四条线索展开。4.6.1 节从信息不等式与 Cramér-Rao 下界开始，把 Fisher 信息与估计精度连接起来；4.6.2 节建立大偏差原理与 Cramér 定理，给出速率函数；4.6.3 节介绍 Sanov 定理，把速率函数解释为到约束集合的最小 KL 散度，并推广到过程的相对熵率；4.6.4 节回到假设检验，得到 Chernoff-Stein 引理与 Chernoff 信息；4.6.5 节整理集中不等式，说明在分布细节未知时如何得到可用的界；4.6.6 节小结。

## 4.6.1 信息不等式与 Cramér-Rao 下界

### 得分函数与 Fisher 信息

设数据 $X$ 取自参数化的分布族 $\{p(x;\theta) : \theta \in \Theta\}$，对数似然为 $\ell(x;\theta) = \log p(x;\theta)$。**得分函数**（score function）定义为对数似然对参数的导数：

$$
s(x;\theta) = \frac{\partial}{\partial\theta}\,\ell(x;\theta)
$$

在正则条件下（可在积分号下求导），得分函数的期望为零。把 $\int p(x;\theta)\,dx = 1$ 对 $\theta$ 求导：

$$
\int \frac{\partial p(x;\theta)}{\partial\theta}\,dx = \int p(x;\theta)\,\frac{\partial \log p(x;\theta)}{\partial\theta}\,dx = E_\theta[s(X;\theta)] = 0
$$

得分函数的方差称为 **Fisher 信息**：

$$
I(\theta) = \mathrm{Var}\big(s(X;\theta)\big) = E_\theta\big[s(X;\theta)^2\big]
$$

再把期望为零这一等式对 $\theta$ 求一次导，可得等价的二阶形式 $I(\theta) = -E_\theta[\partial^2_\theta \ell(X;\theta)]$，它在解析计算中更常用。对 $n$ 个独立同分布样本，得分函数相加、方差相加，因此 Fisher 信息可加：

$$
I_n(\theta) = n\,I_1(\theta)
$$

样本量每翻一倍，Fisher 信息翻一倍。信息以线性速度积累，这一线性性会在下面的下界中表现为方差按 $1/n$ 下降。4.3 节已经把这个量解释为统计流形的度量张量：它度量参数空间中两个邻近分布的可区分程度。

### 信息不等式

**信息不等式**（information inequality，通常称为 Cramér-Rao 下界）说明 Fisher 信息限制了任何无偏估计的精度。

设 $\hat\theta = \hat\theta(X_1, \ldots, X_n)$ 是 $\theta$ 的无偏估计，即 $E_\theta[\hat\theta] = \theta$。在正则条件下

$$
\mathrm{Var}(\hat\theta) \ge \frac{1}{I_n(\theta)} = \frac{1}{n\,I_1(\theta)}
$$

**证明**。由无偏性，$\int \hat\theta(x)\,p(x;\theta)\,dx = \theta$。两侧对 $\theta$ 求导：

$$
\int \hat\theta(x)\,\frac{\partial p(x;\theta)}{\partial\theta}\,dx = \int \hat\theta(x)\,s(x;\theta)\,p(x;\theta)\,dx = E_\theta[\hat\theta\, s] = 1
$$

由于 $E_\theta[s] = 0$ 且 $E_\theta[\hat\theta] = \theta$，协方差展开后 $E_\theta[\hat\theta s] - E_\theta[\hat\theta]E_\theta[s] = 1$，即 $\mathrm{Cov}(\hat\theta, s) = 1$。由 Cauchy-Schwarz 不等式，

$$
1 = \mathrm{Cov}(\hat\theta, s)^2 \le \mathrm{Var}(\hat\theta)\,\mathrm{Var}(s) = \mathrm{Var}(\hat\theta)\,I_n(\theta)
$$

整理即得结论。等号成立要求得分函数与估计误差之间存在精确的线性关系 $s(x;\theta) = c(\theta)\big(\hat\theta(x) - \theta\big)$，这一条件恰好是单参数指数族的形式（4.3 节）。因此达到下界的无偏估计量只在指数族中普遍存在，正态分布的均值、伯努利与泊松的参数都有这样的估计量。对一般分布，极大似然估计在样本量大时渐近达到下界（2.10 节），这使它在大样本下没有改进空间。

多参数情形把不等式升级为矩阵形式。参数为 $\boldsymbol\theta \in \R^k$ 时，Fisher 信息矩阵为

$$
I(\boldsymbol\theta)_{ij} = E_{\boldsymbol\theta}\big[\partial_i \ell \cdot \partial_j \ell\big]
$$

对无偏估计，协方差矩阵满足 $\mathrm{Cov}(\hat{\boldsymbol\theta}) \succeq I(\boldsymbol\theta)^{-1}$（Loewner 序，差为半正定）。需要注意单个分量的下界由逆矩阵的对角元 $[I^{-1}]_{ii}$ 给出，它大于或等于 $1/I_{ii}$。多出来的部分来自其余参数的未知性，这正是 2.9 节讨论的干扰参数带来的额外不确定。

::: note 信息不等式的读法
下界说明参数的估计精度由分布族本身的局部结构决定，与使用哪种估计方法无关。分布越能分辨邻近的参数取值（Fisher 信息越大），可达到的方差越小。换成几何语言：参数方向上走一段距离 $d\theta$ 对应两个分布的 KL 散度为 $\frac{1}{2}d\theta^2 I(\theta)$（4.2 节的局部展开），下界是这个可区分性的倒数。
:::

### 数据处理与有效性

Fisher 信息满足与 KL 散度同构的单调性。对样本做任何统计变换 $T = T(X_1, \ldots, X_n)$，只保留 $T$ 后参数的信息不增加：

$$
I_T(\theta) \le I_{X}(\theta)
$$

等号成立当且仅当 $T$ 是充分统计量。这与 4.1 节的数据处理不等式是同一现象：变换只会丢失与参数有关的信息，不会创造信息。它在实践中的含义是，压缩数据之前要确认保留了充分统计量，否则后续估计的精度下界会变差。

把这段结论与渐近理论合起来，得到一个完整的图景。样本量小时精度受限，下界由 Fisher 信息给出；样本量大时极大似然估计渐近达到下界，因此中心极限定理给出的方差 $\big(n I_1(\theta)\big)^{-1}$ 就是实际可以达到的精度。下列代码验证两件事：经验方差与下界相符，以及 KL 散度的二阶展开在小步长下收敛到 Fisher 信息给出的二次型。

```python
import numpy as np

def fisher_bernoulli(p):
    """伯努利模型单样本的 Fisher 信息：I(p) = 1 / (p(1-p))"""
    return 1.0 / (p * (1.0 - p))

def kl_bernoulli(p, q):
    """伯努利分布之间的 KL 散度（自然对数）"""
    return p * np.log(p / q) + (1 - p) * np.log((1 - p) / (1 - q))

# 用重复抽样验证 n 个样本下无偏估计的方差与 Cramér-Rao 下界
rng = np.random.default_rng(0)
n, trials = 200, 20000
print("样本量 n =", n)
for p in [0.1, 0.3, 0.5, 0.8]:
    samples = rng.binomial(1, p, size=(trials, n))
    var_emp = samples.mean(axis=1).var()
    bound = 1.0 / (n * fisher_bernoulli(p))
    print(f"  p = {p:.1f}: 经验方差 = {var_emp:.6f}，CR 下界 = {bound:.6f}")

# KL 的二阶展开：D(Bern(p) || Bern(p+d)) ≈ 0.5 * I(p) * d^2
p = 0.3
print("\n步长 d    精确 KL      0.5 * I(p) * d^2")
for d in [0.1, 0.05, 0.01, 0.001]:
    print(f"  {d:.3f}   {kl_bernoulli(p, p + d):.4e}   {0.5 * fisher_bernoulli(p) * d ** 2:.4e}")
# 经验方差与下界数值接近，相对偏差在百分之一以内，说明样本均值达到下界
# 步长减小时精确 KL 与二次近似之比趋于 1
```

输出显示经验方差与下界的相对偏差在百分之一以内；右半部分的比值随 $d$ 减小稳定趋向 $1$（$d = 0.001$ 时两者相差不到千分之二），确认 KL 的局部曲率就是 Fisher 信息。

## 4.6.2 大偏差原理与 Cramér 定理

### 大数定律之外的精细信息

设 $X_1, X_2, \ldots$ 独立同分布，均值为 $\mu$。弱大数定律断言样本均值依概率收敛：$P(|\bar X_n - \mu| > \epsilon) \to 0$。这条结论没有给出速度，把 $\epsilon$ 固定时它只说概率趋于零，不说多快。中心极限定理补上了中心区域的结构：$\sqrt n(\bar X_n - \mu)$ 依分布收敛到正态，描述的是偏离量在 $1/\sqrt n$ 尺度上的涨落。

两个结论都没有覆盖第三种情形：偏离量 $a - \mu$ 固定且不为零，样本量增大时这个偏离反而越来越大（以标准差计）。此时尾概率以指数速度衰减：

$$
P(\bar X_n \ge a) \approx e^{-n I(a)}
$$

指数中的 $I(a)$ 称为**速率函数**（rate function）。它给出的信息比大数定律精确，比中心极限定理适用的范围更广；中心极限定理在固定偏离处没有误差控制，用它估计尾概率没有方向保证。

### Chernoff 上界

上界来自马尔可夫不等式与矩生成函数。设 $X$ 的矩生成函数 $M(\theta) = E[e^{\theta X}]$ 在 $\theta = 0$ 的邻域内有限，累积量函数记为 $\Lambda(\theta) = \log M(\theta)$。对 $a > \mu$ 与任意 $\theta > 0$：

$$
P(\bar X_n \ge a) = P\left(e^{\theta \sum_i X_i} \ge e^{n\theta a}\right) \le e^{-n\theta a}\,E\big[e^{\theta \sum_i X_i}\big] = e^{-n\theta a}\,M(\theta)^n
$$

第二步用了马尔可夫不等式，第三步用独立性把期望写成 $M(\theta)^n$。取对数并除以 $n$：

$$
\frac{1}{n}\log P(\bar X_n \ge a) \le -\big(\theta a - \Lambda(\theta)\big)
$$

上界随 $\theta a - \Lambda(\theta)$ 增大而变小，对 $\theta$ 取上确界得到最紧的界：

$$
P(\bar X_n \ge a) \le \exp\left(-n \sup_{\theta > 0}\big\{\theta a - \Lambda(\theta)\big\}\right) = e^{-n I(a)}
$$

这一构造称为 **Chernoff 上界**（Chernoff bound）。速率函数 $I(a) = \sup_\theta\{\theta a - \Lambda(\theta)\}$ 是 $\Lambda$ 的 **Legendre 变换**，它的三条性质都可直接验证。

非负性：$I(a) \ge 0$，因为 $\theta = 0$ 时括号内取零。

在均值处为零：$\Lambda(0) = 0$，$\Lambda'(0) = \mu$，因此 $I(\mu) = 0$。对一般的 $a$，最优 $\theta^*$ 满足 $a = \Lambda'(\theta^*)$，即 $\theta^*$ 使指数倾斜分布的均值恰好为 $a$。

凸性与局部形状：Legendre 变换是凸函数的共轭，$I$ 为凸函数，且在均值附近与中心极限定理衔接。把 $\Lambda$ 在零附近展开，$I(\mu + t) \approx t^2/(2\sigma^2)$。中心极限定理给出的正态密度在远离中心处按 $\exp(-t^2 n/(2\sigma^2))$ 衰减，与上式一致；两个结论在 $t$ 较小时重合，$t$ 变大后大偏差给出的指数偏离二次型，$t^2/(2\sigma^2)$ 不再准确。

### Cramér 定理

上界是否精确，由下面的定理回答。

**Cramér 定理**：设 $X_i$ 独立同分布，矩生成函数在原点邻域有限，$\mu = E[X]$。则对任意 $a > \mu$，

$$
\lim_{n \to \infty} \frac{1}{n}\log P(\bar X_n \ge a) = -I(a)
$$

对左尾 $a < \mu$ 有同样的结论，只需把上确界限制在 $\theta < 0$。上界就是 Chernoff 上界；下界的方向由**指数倾斜**（exponential tilting）给出：取使 $\Lambda'(\theta^*) = a$ 的参数，构造倾斜分布

$$
dP_{\theta^*}(x) = e^{\theta^* x - \Lambda(\theta^*)}\,dP(x)
$$

它的均值恰好为 $a$。在倾斜测度下，$\bar X_n$ 依概率收敛到 $a$，且中心极限定理给出 $a$ 附近的涨落尺度 $1/\sqrt n$。把从 $P$ 到 $P_{\theta^*}$ 的测度变换因子 $e^{-n\theta^* \bar X_n + n\Lambda(\theta^*)}$ 代回，并利用 $\bar X_n$ 集中在 $a$ 附近，得到

$$
P(\bar X_n \ge a) \ge \frac{c}{\sqrt n}\,e^{-n I(a)}
$$

对某个常数 $c > 0$。上下界合并，指数速率被确定。有限样本下的精确概率与 $e^{-nI(a)}$ 之间相差一个多项式因子（通常按 $n^{-1/2}$ 量级），因此指数结论描述的是对数尺度上的行为。

### 速率函数与 KL 散度

速率函数可以写成 KL 散度的形式，这是信息论视角的关键一步：

$$
I(a) = \min\big\{D(Q \| P) : E_Q[X] = a\big\}
$$

最小值在指数倾斜分布处取到。证明用到 4.2 节的对数矩生成的变分表示（Gibbs 变分）：对任意分布 $Q \ll P$ 与任意 $\theta$，

$$
\Lambda(\theta) = \log E_P[e^{\theta X}] \ge \theta\,E_Q[X] - D(Q\|P)
$$

代入 $E_Q[X] = a$ 得 $\theta a - \Lambda(\theta) \le D(Q\|P)$。左侧对 $\theta$ 取上确界仍不超过右侧，于是 $I(a) \le \min_Q D(Q\|P)$；取 $Q$ 为倾斜分布时两侧相等，等号成立。这一形式说明速率函数度量的是约束集合 $\{Q : E_Q[X] = a\}$ 中离真实分布最近的成员有多远。

伯努利分布给出一个闭式的例子。对 $X \sim \mathrm{Bern}(p)$，倾斜分布仍是伯努利分布，速率函数为

$$
I(a) = a \log\frac{a}{p} + (1-a)\log\frac{1-a}{1-p} = D\big(\mathrm{Bern}(a)\,\|\,\mathrm{Bern}(p)\big)
$$

取 $p = 0.5$，$a = 0.6$：$I(a) = 0.020136$ 自然对数单位，换成比特为 $0.029049$。样本量为 $n$ 时观测到正面比例不低于 $0.6$ 的概率约等于 $2^{-0.029n}$：$n = 1000$ 时约 $10^{-9}$，$n = 5000$ 时约 $10^{-44}$。这种量级的差异说明为什么把中心极限定理外推到尾部需要谨慎：正态近似给的是中心区域的分辨率，在大偏离处它既没有误差界，也不能保证给出上界。

下列代码验证三件事：速率函数与 KL 表达式一致、Legendre 变换的数值结果与闭式公式吻合、尾概率的对数除以 $n$ 收敛到速率函数。

```python
import numpy as np
from scipy import optimize, stats

def rate_bernoulli(p, a):
    """伯努利分布的速率函数 I(a) = D(Bern(a) || Bern(p))（自然对数）"""
    if a in (0.0, 1.0):
        return np.inf
    return a * np.log(a / p) + (1 - a) * np.log((1 - a) / (1 - p))

def rate_legendre(p, a):
    """用 Legendre 变换数值求解：sup_theta {theta * a - log M(theta)}"""
    def negative(theta):
        lam = np.log(p * np.exp(theta) + (1 - p))   # Lambda(theta) = log(p e^theta + 1 - p)
        return -(theta * a - lam)
    res = optimize.minimize_scalar(negative, bounds=(-30, 30), method='bounded')
    return -res.fun

p = 0.5
print("a      KL 表达式       Legendre 变换")
for a in [0.55, 0.6, 0.7, 0.8]:
    print(f"  {a:.2f}   {rate_bernoulli(p, a):.6f}      {rate_legendre(p, a):.6f}")

# 尾概率的对数除以 n 收敛到 -I(a)
a = 0.6
I = rate_bernoulli(p, a)
print(f"\nI(0.6) = {I:.6f} 自然对数单位 = {I / np.log(2):.6f} 比特")
print("n      精确尾概率       (1/n) ln P      -I(a)")
for n in [10, 50, 100, 1000, 5000, 20000]:
    tail = stats.binom.sf(int(np.ceil(a * n)) - 1, n, p)   # P(X >= a * n)
    print(f"  {n:5d}   {tail:.3e}    {np.log(tail) / n:+.6f}    {-I:+.6f}")
# 两列数值完全一致，说明 Legendre 变换给出的就是 KL 表达式
# (1/n) ln P 从 -0.0976 缓慢逼近 -0.0201，修正项量级为 log(n)/n，收敛速度慢
```

输出中 Legendre 变换与闭式公式逐位相同，确认速率函数就是 KL 散度。第三部分的收敛过程展示了这一领域的常态：修正项是 $O(\log n / n)$，因此有限样本下用指数公式估算概率或样本量时，常数因子上会有几倍的偏差，精确数值需要查表或仿真。

## 4.6.3 Sanov 定理与相对熵率

### 类型与类型类

Cramér 定理处理的是一个具体的统计量（样本均值），Sanov 定理把它推广到整个经验分布。设字母表 $\mathcal{X}$ 有 $k$ 个符号，长度为 $n$ 的序列 $\mathbf{x} = (x_1, \ldots, x_n)$ 的**类型**（type）是它的经验分布：

$$
\hat P_{\mathbf{x}}(x) = \frac{\#\{i : x_i = x\}}{n}
$$

所有频率向量相同的序列构成一个**类型类** $T(Q)$，其中 $Q$ 是某个概率分布。类型类的大小有精确的对数尺度估计：

$$
\frac{1}{(n+1)^{k}}\,2^{nH(Q)} \le |T(Q)| \le 2^{nH(Q)}
$$

指数上的 $H(Q)$ 是类型本身的熵。类型类内部每条序列的概率完全相同，把 $P^n(\mathbf{x})$ 的对数写成频率的加权和：

$$
P^n(\mathbf{x}) = \prod_{i} P(x_i) = 2^{-n\left(H(Q) + D(Q\|P)\right)}
$$

本小节的公式以 2 为底展开，熵与 KL 散度都按比特计；若改用自然对数，把指数中的量除以 $\log 2$ 即可，数值不变。

乘上类型类的大小，用上面对 $|T(Q)|$ 的两个界限包夹：

$$
\frac{1}{(n+1)^{k}}\,2^{-nD(Q\|P)} \le P^n\big(T(Q)\big) \le 2^{-nD(Q\|P)}
$$

熵在乘法中恰好抵消，剩下的只有 KL 散度。这就是类型方法的核心结论：在熵的尺度上，偏离真实分布 $P$ 的代价由 $D(Q\|P)$ 支付，与前缀的排列方式无关。

### Sanov 定理

类型方法直接给出集合的概率估计。

**Sanov 定理**：设 $P$ 为真实分布，$E$ 为概率单纯形上的集合，$Q^*$ 是 $E$ 中使 $D(Q\|P)$ 最小的分布。则

$$
-\frac{1}{n}\log_2 P^n\big(\{\mathbf{x} : \hat P_{\mathbf{x}} \in E\}\big) \longrightarrow D(Q^*\|P)
$$

这里两侧都按比特计算（对数以 2 为底，KL 散度也以 2 为底）。含义是：经验分布落到一个集合外这件事的概率，由集合内离真实分布最近的分布决定。集合越容易与真实分布混淆（最小 KL 越小），越难通过样本量把它排除。

Cramér 定理是 Sanov 定理的一个投影。取 $E_a = \{Q : E_Q[X] = a\}$，最小值 $\min_{Q \in E_a} D(Q\|P)$ 就是上一节的速率函数 $I(a)$。Sanov 定理的范围更大：任何经验分布的函数（不只是均值）都能处理，只要把对应的集合 $E$ 写出来。约束通常是矩条件或事件约束，此时求最小 KL 是第三章框架下的凸优化问题，最优解具有指数倾斜的形式。

### 相对熵率

对过程数据，单符号的 KL 散度需要换成按符号平均的版本。设两个平稳过程的 $n$ 元分布分别为 $p_{X^n}$ 与 $q_{X^n}$，若

$$
\bar D(Q\|P) = \lim_{n \to \infty} \frac{1}{n} D\big(q_{X^n}\,\|\,p_{X^n}\big)
$$

存在，则称它为**相对熵率**（relative entropy rate）。它是 4.1 节熵率的对应物：熵率度量过程每符号的平均不确定性，相对熵率度量两个过程每符号的平均差异。

马尔可夫链有闭式表达。设真实链的转移矩阵为 $P$，假设链的转移矩阵为 $Q$，$\mu_Q$ 是 $Q$ 的平稳分布，则

$$
\bar D(Q\|P) = \sum_{i, j} \mu_Q(i)\, q(j \mid i) \log \frac{q(j \mid i)}{p(j \mid i)}
$$

即按 $Q$ 的平稳分布对逐状态的条件 KL 散度加权（对数以自然对数计）。大偏差原理在这一设定下同样成立：观测到经验转移矩阵为 $Q$ 的概率约等于 $e^{-n\bar D(Q\|P)}$。前两节的结论因此在过程数据上保持形式不变，只需把单符号 KL 换成相对熵率；假设检验的误差指数在马尔可夫数据上也是这样替换的。

下列代码用三符号字母表验证类型类的概率估计：给定真实分布 $P$ 与目标类型 $Q$，计算类型类概率、上界 $2^{-nD(Q\|P)}$ 以及两者的比值。

```python
import numpy as np
from scipy import stats

p = np.array([0.5, 0.3, 0.2])   # 真实分布
q = np.array([0.4, 0.4, 0.2])   # 目标类型的频率
D = float(np.sum(q * np.log(q / p)))
print(f"D(Q||P) = {D:.6f} 自然对数单位 = {D / np.log(2):.6f} 比特")

print("n        P^n(T(Q))      2^(-nD)      比值      比值 * n    (1/n) log2 P")
for n in [10, 20, 100, 1000, 10000]:
    counts = (q * n).astype(int)
    prob = stats.multinomial.pmf(counts, n, p)     # 类型类的精确概率
    bound = 2 ** (-n * D / np.log(2))
    print(f"  {n:6d}  {prob:.4e}  {bound:.4e}  {prob / bound:.4f}  {prob / bound * n:.4f}  {np.log2(prob) / n:+.6f}")
# 比值随 n 以 1/n 的量级下降（比值 * n 稳定在 0.89 附近），即概率等于 2^(-nD) 乘一个多项式因子
# 最后一列从 -0.397 降到 -0.039，单调逼近 -D/log2 = -0.0372
```

输出验证了三个要点。类型类概率确实位于下界 $(n+1)^{-3} \times 2^{-nD}$ 与上界 $2^{-nD}$ 之间；比值乘以 $n$ 后稳定在 $0.89$ 附近，说明两个量之间只差多项式因子；按符号平均的对数概率单调逼近 $-D/\log 2$，与 Sanov 定理的极限一致。

## 4.6.4 假设检验的误差指数

### 框架回顾

回到 2.11 节的设定。两个假设 $H_0: P$ 与 $H_1: Q$，用 $n$ 个样本判定哪一个成立。检验的两类错误分别是第一类错误 $\alpha = P(\text{拒绝} H_0)$（$H_0$ 为真时）与第二类错误 $\beta = Q(\text{接受} H_0)$（$H_1$ 为真时）。Neyman-Pearson 引理说明似然比检验在固定 $\alpha$ 下使 $\beta$ 最小：拒绝 $H_0$ 当且仅当似然比 $Q^n(\mathbf{x}) / P^n(\mathbf{x})$ 超过某个阈值。

样本量趋于无穷时，两个错误概率不可能同时保持正的下界（否则两个假设永远无法可靠区分）。可争取的目标有两种：让其中一个错误以指数速度衰减，或让等先验下两者之和以指数速度衰减，问题在于衰减速度是多少。信息论给出的答案由两条结论组成，分别对应这两种设定。

### Chernoff-Stein 引理

**固定第一类错误**。设 $\alpha \in (0, 1)$ 不随 $n$ 变化，$\beta_n^*$ 为最优检验的第二类错误，则

$$
\lim_{n \to \infty} -\frac{1}{n}\log \beta_n^* = D(P\|Q)
$$

这一结论称为 **Chernoff-Stein 引理**（或 Stein 引理），右端的 $D(P\|Q)$ 称为 **Stein 指数**。对数与 KL 散度都以自然对数计算；若对数以 2 为底，右端换成 $D(P\|Q)/\log 2$，单位是比特。

可达性方向由 4.1 节的典型性直接给出。固定 $\alpha$ 意味着接受域必须容纳 $H_0$ 下的大部分概率，取接受域为 $P$ 的典型集即可。$H_1$ 为真时，序列落在 $P$ 的典型集中的概率为 $Q^n(T_P)$，而 4.1 节的典型性结论给出 $Q^n(T_P) \approx e^{-nD(P\|Q)}$（也可由上一节的 Sanov 定理得到）。

反向方向说明 $\beta$ 不可能衰减得更快。设接受域为 $A_n$，它在 $H_0$ 下的概率至少为 $1 - \alpha$。考察对数似然比按样本平均后的统计量

$$
L_n(\mathbf{x}) = \frac{1}{n}\sum_{i=1}^n \log\frac{P(x_i)}{Q(x_i)}
$$

由大数定律，它在 $H_0$ 下依概率收敛到 $E_P[\log(P/Q)] = D(P\|Q)$，因此对任意 $\delta > 0$，集合 $B_n = \{\mathbf{x} : L_n(\mathbf{x}) \le D(P\|Q) + \delta\}$ 在 $H_0$ 下的概率趋于 $1$，于是 $A_n \cap B_n$ 在 $H_0$ 下的概率至少为 $1 - \alpha - o(1)$。对 $\mathbf{x} \in B_n$，

$$
Q^n(\mathbf{x}) = P^n(\mathbf{x})\,e^{-n L_n(\mathbf{x})} \ge P^n(\mathbf{x})\,e^{-n\left(D(P\|Q) + \delta\right)}
$$

代回第二类错误：

$$
\beta_n = Q^n(A_n) \ge Q^n(A_n \cap B_n) \ge e^{-n\left(D(P\|Q) + \delta\right)}\,P^n(A_n \cap B_n) \ge \big(1 - \alpha - o(1)\big)\,e^{-n\left(D(P\|Q) + \delta\right)}
$$

$\delta$ 可以任意小，因此 $\beta_n$ 的衰减不可能快于 $e^{-nD(P\|Q)}$。两个方向合并，指数被确定。

指数中的 KL 散度从零假设的分布指向备择的分布。交换两个假设，指数变为 $D(Q\|P)$。两个数一般不相等，这与 Neyman-Pearson 框架的不对称一致：第一类错误被冻结在常数，第二类错误承担全部衰减任务，两者的地位不同。

### 贝叶斯情形与 Chernoff 信息

**等先验、最小化总错误**。当两个假设的先验相等时，自然的准则是最小化 $P_e = \frac{1}{2}(\alpha + \beta)$。此时两侧错误同时衰减，指数由两个分布的对称组合决定：

$$
\lim_{n \to \infty} -\frac{1}{n}\log P_e^{(n)} = C(P, Q)
$$

$$
C(P, Q) = \max_{0 \le \lambda \le 1}\left(-\log \sum_x P(x)^{\lambda}\,Q(x)^{1 - \lambda}\right)
$$

极限与 $C$ 都以自然对数计算（单位是自然对数单位，换成比特除以 $\log 2$）。这个量称为 **Chernoff 信息**（Chernoff information）。用 4.2 节 Rényi 散度的记号，括号内的量与 Rényi 散度只差一个因子：

$$
-\log \sum_x P(x)^{\lambda}Q(x)^{1-\lambda} = (1-\lambda)\,D_\lambda(P\|Q)
$$

因此 $C(P, Q) = \max_{\lambda \in [0,1]} (1-\lambda)\,D_\lambda(P\|Q)$。由于 Rényi 散度关于阶参数单调不减（4.2 节），$D_\lambda(P\|Q) \le D(P\|Q)$，于是

$$
C(P, Q) = (1-\lambda^*)\,D_{\lambda^*}(P\|Q) \le D(P\|Q)
$$

对称地也有 $C(P, Q) \le D(Q\|P)$，即 Chernoff 信息不超过两个方向 KL 散度的较小者。取等号要求最优参数落在区间端点 $\lambda^* = 0$，这需要两个分布的支持集明显不同；两个分布有相同的支撑时 $\lambda^*$ 落在区间内部，$C$ 严格小于较小者。

最优 $\lambda^*$ 处的倾斜分布有清晰的几何意义。定义

$$
r_{\lambda}(x) = \frac{P(x)^{\lambda}\,Q(x)^{1 - \lambda}}{\sum_y P(y)^{\lambda}\,Q(y)^{1 - \lambda}}
$$

在 $\lambda = \lambda^*$ 处它到两个分布的 KL 散度相等，且都等于 $C(P, Q)$：

$$
D(r_{\lambda^*}\|P) = D(r_{\lambda^*}\|Q) = C(P, Q)
$$

这个分布在 KL 意义下与两个假设等距，检验阈值落在它附近；序列落在这条分界线上时两个假设最难区分。这一构造与 4.3 节的信息投影相同：在连接两个分布的指数族中寻找等距点。

数值对比说明两个指数的关系。取 $P = \mathrm{Bern}(0.4)$，$Q = \mathrm{Bern}(0.6)$：由对称性 $\lambda^* = 0.5$，倾斜分布为 $\mathrm{Bern}(0.5)$，

$$
D(P\|Q) = 0.081093 \text{ 自然对数单位} = 0.116993 \text{ 比特}, \qquad C(P,Q) = 0.020411 \text{ 自然对数单位} = 0.029447 \text{ 比特}
$$

两者相差约 $4$ 倍。原因在于检验目标不同：固定 $\alpha$ 的检验只需要把一侧的错误压下去，另一侧允许保持常数；等先验贝叶斯检验要求两侧同时指数衰减，难度更高，指数更小。

三个指数可以放在一起对照。

| 检验设定 | 错误与指数 |
|------|------|
| 固定第一类错误（$H_0: P$，$H_1: Q$） | 第二类错误 $\beta_n \approx e^{-nD(P\|Q)}$ |
| 固定第一类错误（假设交换） | 第二类错误 $\beta_n \approx e^{-nD(Q\|P)}$ |
| 等先验，最小化总错误 | 总错误 $P_e \approx e^{-nC(P,Q)}$，且 $C \le \min\{D(P\|Q), D(Q\|P)\}$ |

表中的指数与 KL 都按自然对数计。

### 收敛速度

指数结论描述 $n \to \infty$ 的极限，有限样本下的有效指数与极限值有系统偏差，偏差的量级由检验阈值的位置决定。固定第一类错误时，阈值取在零假设均值之外约 $O(1/\sqrt n)$ 的位置，速率函数在这一偏移处的取值低于极限值，有效指数以同阶速度缓慢逼近；贝叶斯情形的阈值取在等距点 $r_{\lambda^*}$ 附近，两个方向的速率函数在该点相等，没有这一阶的偏差，收敛更快。下列代码用精确的二项分布概率观察这一差别。

```python
import numpy as np
from scipy import stats

p0, p1 = 0.4, 0.6

def kl(a, b):
    return a * np.log(a / b) + (1 - a) * np.log((1 - a) / (1 - b))

def chernoff(p0, p1, grid=200001):
    """在网格上最大化 (1 - lambda) D_lambda，得到 Chernoff 信息"""
    s = np.linspace(0, 1, grid)
    f = p0 ** s * p1 ** (1 - s) + (1 - p0) ** s * (1 - p1) ** (1 - s)
    i = np.argmax(-np.log(f))
    return -np.log(f[i]), s[i]

D = kl(p0, p1)
C, s_star = chernoff(p0, p1)
print(f"Stein 指数 D(P||Q) = {D:.6f} 自然对数单位 = {D / np.log(2):.6f} 比特")
print(f"Chernoff 信息 C = {C:.6f} 自然对数单位 = {C / np.log(2):.6f} 比特，最优 lambda = {s_star:.3f}")

# 固定 alpha = 0.05 的似然比检验：接受 H0 当频数不超过 H0 的 95% 分位数
print("\n固定第一类错误（alpha <= 0.05）:")
for n in [1280, 2560, 5120]:
    thr = stats.binom.ppf(0.95, n, p0)
    log_beta = stats.binom.logcdf(thr, n, p1)
    print(f"  n = {n:5d}: (1/n) log2 beta = {log_beta / n / np.log(2):+.5f}")
print(f"  目标斜率 -D / log2 = {-D / np.log(2):+.5f}")

# 等先验贝叶斯检验：阈值取在 n/2（两个参数的中点）
print("\n等先验贝叶斯检验:")
for n in [2560, 5120, 10240, 20480]:
    log_pe = np.log(0.5) + np.logaddexp(stats.binom.logsf(n // 2, n, p0),
                                        stats.binom.logsf(n // 2 - 1, n, p0))
    print(f"  n = {n:5d}: (1/n) log2 Pe = {log_pe / n / np.log(2):+.5f}")
print(f"  目标斜率 -C / log2 = {-C / np.log(2):+.5f}")
# beta 的斜率从 -0.101 到 -0.105，向 -0.117 缓慢逼近；阈值与均值的偏移为 O(1/sqrt(n))，收敛慢
# Pe 的斜率从 -0.031 到 -0.030，向 -0.029 逼近，收敛明显更快
```

输出确认两个指数都成立，且收敛速度的差别与阈值理论一致：$\beta$ 的斜率在 $n = 5120$ 时离目标还差约 $10\%$，$P_e$ 的斜率在同一量级的样本量下已经接近到 $3\%$ 以内。实践中常见的做法是用指数公式估算样本量的量级，再用仿真或精确计算校准常数因子。

## 4.6.5 Hoeffding 界与集中不等式

### 从速率函数到普适上界

Chernoff 上界需要矩生成函数，前提是分布族已知。若只知道变量有界，可用的工具是 Hoeffding 不等式。

**Hoeffding 引理**：设 $X \in [a, b]$，则对任意 $\theta \in \R$，

$$
E\big[e^{\theta (X - E X)}\big] \le \exp\left(\frac{\theta^2 (b - a)^2}{8}\right)
$$

引理的证明用到有界性与 $e^{\theta x}$ 的凸性：在区间端点上线性插值，再对线性函数的指数取期望，得到上界。把引理代入 Chernoff 方法（对每个变量分别应用，再合并期望），得到**Hoeffding 不等式**：对独立的 $X_i \in [a_i, b_i]$，

$$
P\big(\bar X_n - \mu \ge t\big) \le \exp\left(-\frac{2n^2 t^2}{\sum_{i=1}^n (b_i - a_i)^2}\right)
$$

所有变量都落在 $[0,1]$ 时简化为 $\exp(-2nt^2)$；左尾有对称的界。

Hoeffding 界与速率函数的关系可以直接比较。在均值附近 $I(\mu + t) \approx t^2/(2\sigma^2)$，Hoeffding 使用的指数相当于把方差固定为 $(b-a)^2/4$。对 $[0,1]$ 上的变量，这个有效方差为 $1/4$：伯努利 $(0.5)$ 的真实方差恰为 $1/4$，两者在这个特殊情形下数值接近（$t = 0.1$ 时真速率为 $0.0201$，Hoeffding 指数为 $2t^2 = 0.02$）；方差更小的分布上，真实速率 $t^2/(2\sigma^2)$ 远大于 $2t^2$，Hoeffding 界会保守很多。使用它的理由是普适性：只需要有界性，不需要知道分布。

### 使用方差信息的界

引入方差信息可以显著收紧指数。设 $X_i$ 独立、有界 $|X_i| \le c$、方差为 $\sigma^2$，**Bernstein 不等式**给出

$$
P\big(\bar X_n - \mu \ge t\big) \le \exp\left(-\frac{n t^2}{2\sigma^2 + \frac{2}{3}ct}\right)
$$

小偏离区指数为 $nt^2/(2\sigma^2)$，与速率函数的二次近似一致；大偏离区自适应为线性指数 $-\frac{3nt}{2c}$，这一行为来自有界性对矩生成函数的限制。**Bennett 不等式**是它的前身，用函数 $h(u) = (1+u)\log(1+u) - u$ 表达同样的折衷。维数或样本量较大时，Bernstein 形式的界常被用来构造依赖方差而非最坏情况的泛化界。

### 依赖结构与泛化界

独立同分布是上述结论的共同前提，去掉它需要新的工具。

**Azuma 不等式**处理鞅差分序列：若 $|D_i| \le c_i$ 且 $E[D_i \mid \mathcal{F}_{i-1}] = 0$，则 $P(\sum_i D_i \ge t) \le \exp(-t^2/(2\sum_i c_i^2))$。

**McDiarmid 不等式**（有界差分不等式）处理有界敏感性：若改变 $X_i$ 最多使函数值变化 $c_i$，则

$$
P\big(f(X) - E[f(X)] \ge t\big) \le \exp\left(-\frac{2t^2}{\sum_i c_i^2}\right)
$$

它覆盖了许多实际场景：交叉验证误差、排序统计量、图算法输出都能写成满足有界差分的函数。在统计学习理论中，训练误差与测试误差之差用有界差分控制，泛化界形如 $O\!\left(\sqrt{\log(1/\delta)/n}\right)$ 加上模型复杂度项，是 2.14 节与 4.7 节讨论的问题。

::: tip 界的选择
分布已知（参数模型）：用速率函数 $I(a)$ 或 Chernoff 信息 $C$，这是最紧的指数，代价是需要解析或数值求解 Legendre 变换。
只知道有界：用 Hoeffding 界，普适但保守。
知道方差：用 Bernstein 或 Bennett，指数在小偏离区达到 $t^2/(2\sigma^2)$ 的最优形式。
数据有依赖：用 Azuma 或 McDiarmid，把独立性换成鞅差分或有界差分。
:::

下列代码把同一个尾概率的精确值、Chernoff 上界、Hoeffding 界与正态近似放在一起比较，观察各条结论的松紧程度与指数斜率。

```python
import numpy as np
from scipy import stats

def rate_bernoulli(p, a):
    return a * np.log(a / p) + (1 - a) * np.log((1 - a) / (1 - p))

p, a = 0.5, 0.6
I = rate_bernoulli(p, a)
print("n      精确尾概率    Chernoff 界     Hoeffding 界    正态近似")
for n in [50, 100, 500, 1000, 5000]:
    tail = stats.binom.sf(int(np.ceil(a * n)) - 1, n, p)
    cram = np.exp(-n * I)
    hoeff = np.exp(-2 * n * (a - p) ** 2)
    norm = stats.norm.sf((a - p) / np.sqrt(p * (1 - p) / n))
    print(f"  {n:5d}  {tail:.3e}   {cram:.3e}    {hoeff:.3e}     {norm:.3e}")
# 两个界都始终大于精确值；此处伯努利(0.5)的方差恰为 1/4，Hoeffding 的指数 0.02 只略低于真速率 0.0201
# 正态近似没有上界性质，数值上接近但不构成保证
```

输出显示两个界都保持有效（大于精确值），在这个特殊情形下数值接近（伯努利的方差恰好使两者差别很小）。正态近似在中心区域准确，但缺少误差界，不能替代大偏差结论。样本量增大时，各列按各自的指数速率下降，指数之间的差别在概率量级上被放大。

## 4.6.6 本节小结

::: success 从信息量到误差极限
本节把信息量变成了误差极限。估计问题中，Fisher 信息给出精度下界：无偏估计的方差不小于 $1/(nI(\theta))$，达到下界的分布族是单参数指数族，数据处理不等式保证这一信息在变换下不增加。尾概率问题中，Cramér 定理给出指数速率 $P(\bar X_n \ge a) \approx e^{-nI(a)}$，速率函数是矩生成函数的 Legendre 变换，也等于到约束集合的最小 KL 散度。Sanov 定理把这一结果推广到整个经验分布：类型类概率等于 $2^{-nD(Q\|P)}$ 乘多项式因子，集合的概率由集合内最小 KL 决定；过程数据把单符号 KL 换成相对熵率。假设检验问题中，固定第一类错误时第二类错误的指数为 $D(P\|Q)$，等先验时总错误的指数为 Chernoff 信息 $C = \max_\lambda (1-\lambda)D_\lambda$，它不超过两个方向 KL 的较小者，最优阶参数处的倾斜分布是与两个假设等距的分布。分布细节未知时，Hoeffding 界、Bernstein 界与 Azuma 界提供可用上界，代价是保守或需要额外条件。

贯穿全节的量是 KL 散度：它以局部曲率的形式出现在估计精度中，以速率函数的形式出现在尾概率中，以指数或最小化目标的形式出现在检验与 Sanov 定理中。4.1 节的数据处理不等式保证这些量在信息变换下只减不增，因此上述极限无法通过处理数据来突破。
:::

本节的结果与机器学习有直接对应。交叉熵与 KL 正则出现在训练目标中，互信息估计与信息瓶颈出现在表示学习中，PAC-Bayes 与依赖数据的界出现在泛化分析中，这些联系都建立在同样的指数与散度机制上。下一节回到机器学习，讨论信息瓶颈、互信息估计、对比学习与泛化界；4.8 节继续处理算法信息论与前沿方向。

## 练习题

### 第 1 题 概念推导

设 $X_1, \ldots, X_n$ 独立同分布，$X_i \sim \mathrm{Bern}(p)$。推导 $a > p$ 时的 Chernoff 上界 $P(\bar X_n \ge a) \le e^{-nI(a)}$，求出 $I(a)$ 的闭式表达，并验证最优参数 $\theta^*$ 对应的指数倾斜分布的均值等于 $a$。

::: details 参考答案
**累积量函数**：伯努利的矩生成函数为 $M(\theta) = p e^{\theta} + (1-p)$，因此

$$
\Lambda(\theta) = \log\left(p e^{\theta} + 1 - p\right)
$$

**Chernoff 上界**：对 $\theta > 0$，由马尔可夫不等式与独立性，

$$
P(\bar X_n \ge a) \le e^{-n\theta a} M(\theta)^n = \exp\left(-n\left[\theta a - \Lambda(\theta)\right]\right)
$$

**求最优参数**：对 $\theta$ 求导并令其为零：

$$
\frac{d}{d\theta}\left[\theta a - \Lambda(\theta)\right] = a - \frac{p e^{\theta}}{p e^{\theta} + 1 - p} = 0
$$

解得 $e^{\theta^*} = \frac{a(1-p)}{p(1-a)}$，即 $\theta^* = \log\frac{a(1-p)}{p(1-a)}$。由于 $a > p$，$\theta^* > 0$，与上界要求的 $\theta > 0$ 一致。

**倾斜分布的均值**：以 $e^{\theta^* x - \Lambda(\theta^*)}$ 加权后，新的成功概率为

$$
\frac{p e^{\theta^*}}{p e^{\theta^*} + 1 - p}
$$

代入 $e^{\theta^*}$ 的表达式，分母与分子同时化简，结果等于 $a$。这就是速率函数与约束集合的最小 KL 对应的分布。

**速率函数**：把 $\theta^*$ 代回 $\theta a - \Lambda(\theta)$：

$$
I(a) = a \log\frac{a}{p} + (1-a)\log\frac{1-a}{1-p} = D\big(\mathrm{Bern}(a)\|\mathrm{Bern}(p)\big)
$$

**数值验证**：$p = 0.5$，$a = 0.6$ 时 $\theta^* = \log 1.5 \approx 0.4055$，$I(a) \approx 0.020136$ 自然对数单位，约 $0.029049$ 比特。即尾概率约等于 $2^{-0.029n}$。
:::

### 第 2 题 计算推理

设 $H_0: \mathrm{Bern}(0.2)$，$H_1: \mathrm{Bern}(0.5)$。计算两个方向的 KL 散度 $D(P\|Q)$ 与 $D(Q\|P)$、Chernoff 信息 $C(P,Q)$ 与对应的倾斜分布；验证 $C < \min\{D(P\|Q), D(Q\|P)\}$；分别估算固定第一类错误与等先验两种设定下、让目标错误降到 $1\%$ 所需的样本量。

::: details 参考答案
**KL 散度**：

$$
D(P\|Q) = 0.2\log\frac{0.2}{0.5} + 0.8\log\frac{0.8}{0.5} = 0.192745 \text{ 自然对数单位} = 0.278072 \text{ 比特}
$$

$$
D(Q\|P) = 0.5\log\frac{0.5}{0.2} + 0.5\log\frac{0.5}{0.8} = 0.223144 \text{ 自然对数单位} = 0.321928 \text{ 比特}
$$

两个方向不相等，差值约 $0.03$ 自然对数单位。

**Chernoff 信息**：对 $\lambda$ 做一维优化，目标函数为

$$
-\log\left(0.2^{\lambda} 0.5^{1-\lambda} + 0.8^{\lambda} 0.5^{1-\lambda}\right)
$$

数值结果为 $C = 0.052753$ 自然对数单位 $= 0.076107$ 比特，最优 $\lambda^* \approx 0.482$。倾斜分布为

$$
r(x) \propto P(x)^{\lambda^*} Q(x)^{1-\lambda^*}
$$

计算得 $r = \mathrm{Bern}(0.339)$，并且 $D(r\|P) = D(r\|Q) = 0.052753$，与 $C$ 相等，验证了等距点的性质。

**大小关系**：$C = 0.0528 < D(P\|Q) = 0.1927$，同时 $C < D(Q\|P) = 0.2231$，符合 $C \le \min$ 的结论。

**样本量估算**。固定第一类错误（$H_0$ 为 $\mathrm{Bern}(0.2)$）时，第二类错误的指数为 $D(P\|Q)$：

$$
n \approx \frac{\log(1/0.01)}{0.192745} = \frac{4.605}{0.192745} \approx 24
$$

等先验贝叶斯检验的指数为 $C$：

$$
n \approx \frac{4.605}{0.052753} \approx 87
$$

差异来自检验目标：把一侧错误冻结为常数的代价只是一侧不衰减，而两侧都要降到 $1\%$ 需要更多样本。

两个数都是忽略修正项的量级估算，修正方向相反。固定第一类错误的情形实际需要的样本量略多于估算值，因为阈值的偏移使有效指数略低于极限；贝叶斯情形实际需要的略少于估算值，因为亚指数因子带来指数公式之外的额外衰减。两类修正都在常数倍范围内，量级估算足以判断方案是否可行。
:::

### 第 3 题 代码验证

用精确的二项分布概率验证 4.6.4 节的两个误差指数：对 $P = \mathrm{Bern}(0.4)$、$Q = \mathrm{Bern}(0.6)$，在若干样本量下计算固定第一类错误的第二类错误 $\beta_n$（取 $\alpha \le 0.05$）与等先验贝叶斯错误 $P_e$，分别对 $\log$ 错误与 $n$ 的比值观察它们如何逼近 $-D(P\|Q)$ 与 $-C(P,Q)$；解释两者收敛速度的差别。

::: details 参考答案
```python
import numpy as np
from scipy import stats

p0, p1 = 0.4, 0.6

def kl(a, b):
    return a * np.log(a / b) + (1 - a) * np.log((1 - a) / (1 - b))

def chernoff(p0, p1, grid=200001):
    s = np.linspace(0, 1, grid)
    f = p0 ** s * p1 ** (1 - s) + (1 - p0) ** s * (1 - p1) ** (1 - s)
    i = np.argmax(-np.log(f))
    return -np.log(f[i]), s[i]

D = kl(p0, p1)
C, s_star = chernoff(p0, p1)
print(f"D = {D:.6f} nats, C = {C:.6f} nats, lambda* = {s_star:.3f}")
print(f"目标斜率（比特）: 固定 alpha = {-D / np.log(2):+.5f}, 贝叶斯 = {-C / np.log(2):+.5f}")

# 固定第一类错误：接受 H0 当频数不超过 H0 的 95% 分位数
print("\n固定第一类错误:")
for n in [1280, 2560, 5120]:
    thr = stats.binom.ppf(0.95, n, p0)
    log_beta = stats.binom.logcdf(thr, n, p1)
    print(f"  n = {n:5d}: (1/n) log2 beta = {log_beta / n / np.log(2):+.5f}")

# 等先验贝叶斯：阈值在中点 n/2
print("\n等先验贝叶斯:")
for n in [2560, 5120, 10240, 20480]:
    log_pe = np.log(0.5) + np.logaddexp(stats.binom.logsf(n // 2, n, p0),
                                        stats.binom.logsf(n // 2 - 1, n, p0))
    print(f"  n = {n:5d}: (1/n) log2 Pe = {log_pe / n / np.log(2):+.5f}")
```

输出（节选）：

```text
D = 0.081093 nats, C = 0.020411 nats, lambda* = 0.500
目标斜率（比特）: 固定 alpha = -0.11699, 贝叶斯 = -0.02945

固定第一类错误:
  n =  1280: (1/n) log2 beta = -0.09551
  n =  2560: (1/n) log2 beta = -0.10099
  n =  5120: (1/n) log2 beta = -0.10521

等先验贝叶斯:
  n =  2560: (1/n) log2 Pe = -0.03127
  n =  5120: (1/n) log2 Pe = -0.03046
  n = 10240: (1/n) log2 Pe = -0.03000
  n = 20480: (1/n) log2 Pe = -0.02975
```

**结果解读**：$\beta$ 的量级从 $n = 1280$ 时的 $-0.0955$ 缓慢逼近 $-0.1170$，到 $n = 5120$ 仍有约 $10\%$ 的差距；$P_e$ 的量级在同一量级的样本量下已经逼近到 $-0.02945$ 的 $3\%$ 以内。

**收敛速度差别的原因**：固定第一类错误时，检验阈值位于零假设均值之外约 $O(1/\sqrt n)$ 的位置，速率函数在这个偏移处的取值低于极限值，有效指数带有同阶偏差；贝叶斯情形的阈值取在等距点附近，两个方向的速率函数在该点相等，因此没有这一阶的偏差，收敛更快。两者的差距说明指数结论用于样本量估算时应当留出修正空间。
:::

### 第 4 题 综合应用

某产品的两个版本进行线上实验：版本 A 的点击率为 $10\%$，版本 B 为 $12\%$。数据按伯努利模型处理，逐次访问独立。请计算 Stein 指数与 Chernoff 信息；给出把第二类错误降到 $1\%$（固定第一类错误）与把等先验总错误降到 $1\%$ 的样本量估算；用精确计算检验估算的保守程度；并说明如果只知道点击率有界、不知道具体取值，用 Hoeffding 界得到的样本量是多少，以及它与前者的差距来源。

::: details 参考答案
**两个指数**（以 $P = \mathrm{Bern}(0.10)$ 为零假设）：

$$
D(P\|Q) = 0.10\log\frac{0.10}{0.12} + 0.90\log\frac{0.90}{0.88} = 0.001993 \text{ 自然对数单位} = 0.002876 \text{ 比特}
$$

$$
C(P,Q) = 0.000512 \text{ 自然对数单位} = 0.000739 \text{ 比特}
$$

Chernoff 信息约为 Stein 指数的四分之一，两个分布的差异很小，对称检验的难度显著更高。

**样本量估算**：

固定第一类错误（$\beta = 1\%$）：$n \approx \log(1/0.01) / 0.001993 \approx 2310$。

等先验（$P_e = 1\%$）：$n \approx \log(1/0.01) / 0.000512 \approx 9000$。

**精确计算**：用二项分布直接计算两种检验的错误概率（贝叶斯检验的阈值比例为 $0.1097$，由似然比等于 $1$ 的条件解出）。结果是：$\beta$ 在 $n \approx 3800$ 时降到 $1\%$，$P_e$ 在 $n \approx 5300$ 时降到 $1\%$。

与估算对照：固定第一类错误的精确需求（约 $3800$）大于估算（$2310$），因为阈值的偏移使有效指数略低于 $D(P\|Q)$；贝叶斯情形的精确需求（约 $5300$）小于估算（$9000$），因为亚指数因子带来指数公式之外的额外衰减。两处偏差都在 $1.6$ 倍上下，来源是估算忽略了修正项；指数估算适合判断量级，最终样本量以精确计算为准。

**Hoeffding 界**：若只知道点击率落于 $[0,1]$，要用 Hoeffding 界控制偏离 $t = 0.02$ 的单侧概率至 $1\%$：

$$
\exp(-2nt^2) \le 0.01 \implies n \approx \frac{4.605}{2 \times 0.02^2} \approx 5756
$$

这个数目大于前面两个精确需求（约 $3800$ 与 $5300$），说明分布无关的界付出了保守代价。差距来源有两处：其一，Hoeffding 不使用具体的点击率取值与方差信息，只把方差的上界 $1/4$ 代入，而真实方差约为 $0.1$，因此指数偏小、界偏松；其二，它控制的是单个假设下的大偏离尾概率，不区分检验方向与阈值位置。

**结论**：指数公式适合快速估算量级，判断实验是否可行；确定最终样本量时，用精确计算或仿真在校准常数因子之后再定。两个版本的差异越小时，两个指数都按差异的平方缩小（局部近似下 $D$ 与 $C$ 分别正比于差异的平方），所需样本量按平方的倒数增长，这是小提升实验需要海量样本的原因。
:::

## 常见错误

**错误 1 · 把 Chernoff 界与 Chernoff 信息混为一谈**

原因：两个概念的名字相似，出现的位置也邻近，容易被当作同一个量。Chernoff 界是推导尾概率上界的技术（马尔可夫不等式加矩生成函数优化），得到的指数是速率函数 $I(a)$；Chernoff 信息是等先验假设检验总错误的指数 $C(P,Q)$，由两个分布之间的 $\lambda$ 参数优化给出。两者数值上一般不同：在伯努利 $(0.4)$ 与 $(0.6)$ 的例子中，速率函数在 $a = 0.6$ 处为 $0.0201$，Chernoff 信息为 $0.0204$，纯属巧合接近；换一组分布就会明显分开。

解决：按用途区分命名。讨论单个分布尾概率时写速率函数或 Chernoff 上界；讨论两个分布之间的检验难度时写 Chernoff 信息，并说明它与 Rényi 散度的关系 $C = \max_\lambda (1-\lambda)D_\lambda$。

**错误 2 · 把 KL 散度当作对称量，或在 Stein 引理中弄反方向**

原因：KL 散度不满足对称性，Stein 指数是 $D(P\|Q)$，其中 $P$ 是零假设的分布，$Q$ 是备择的分布。两个方向的数值一般不同，例如 $\mathrm{Bern}(0.2)$ 与 $\mathrm{Bern}(0.5)$ 的两个方向的 KL 分别为 $0.1927$ 与 $0.2231$。把方向写反会低估或高估需要的样本量。

解决：书写结论时把零假设与备择假设的分布明确代入公式，先写出 $-\frac{1}{n}\log \beta_n \to D(H_0 \| H_1)$ 再代入数值。需要方向对称的结论时改用 Chernoff 信息，它关于两个分布对称。

**错误 3 · 把指数速率当作有限样本的精确样本量**

原因：$e^{-nD}$ 或 $e^{-nC}$ 是渐近指数，实际概率等于指数式乘一个多项式因子；固定第一类错误的情形下阈值的 $O(1/\sqrt n)$ 偏移还会带来同阶的有效指数偏差。在 4.6.4 节与练习题的例子中，指数估算与精确计算的样本量相差约 $1.6$ 倍。

解决：指数公式用于量级估算与方案比较，最终样本量用精确计算（离散分布可直接查二项分布）、仿真或已知的修正公式校准。报告结论时说明估算的保守方向，避免把估算值当作精确需求。

**错误 4 · 在重尾分布或强依赖数据上直接套用上述结论**

原因：Cramér 定理与 Stein 引理要求矩生成函数在原点邻域有限，Hoeffding 界要求有界性，Azuma 与 McDiarmid 要求鞅差分或有界差分。重尾分布（如帕累托分布 $\alpha \le 2$ 的情形）的矩生成函数在正半轴无界，尾概率的衰减可能慢于任何指数速率；强依赖数据的有效样本量远小于名义样本量，按独立样本计算的指数会严重乐观。

解决：使用前检查前提。重尾数据改用次指数或次高斯假设之外的工具，或对数据做变换后重新验证；时间序列数据用混合条件或对子采样后的近似独立样本计算指数，并用块自助法（2.12 节与非参数方法）估计错误率的衰减曲线，与理论指数对照。