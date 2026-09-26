---
title: 2.12 贝叶斯统计推断与计算
sidebar:
  order: 12
---
# 2.12 贝叶斯统计推断与计算

2.9 节到 2.11 节的推断路线把参数看作固定的未知常数，用样本的抽样分布刻画估计的精度，结论以覆盖率与错误率为语言。贝叶斯推断走另一条路：把参数看作随机变量，用先验分布表达未知之前的信息，用后验分布表达观测之后的信息，结论以参数的概率分布为语言。

两条路线共用 2.1 节建立的概率论基础，分歧出现在如何为参数赋值以及如何解释结论上。路线的选择影响的不只是表述：后验分布是一个完整的分布而非一个数值，它给出参数的取值范围、各取值之间的相对可能性，以及在此基础上计算任意函数期望的能力。这一灵活性使贝叶斯方法适合处理层次结构、缺失数据与复杂生成模型，代价是需要先验、需要计算方法。

本节先建立推断框架与共轭先验，再讨论先验的选取与模型检验；随后进入计算方法，拉普拉斯近似、变分推断与马尔可夫链蒙特卡洛三条路线各自适用于不同规模的模型；最后讨论收敛诊断与几类扩展模型。计算方法在本节占较大篇幅，原因是贝叶斯推断的实际困难几乎都在计算上：除共轭情形外，后验分布没有解析形式，只能近似。

## 2.12.1 贝叶斯推断的框架

### 三个组成部分

贝叶斯推断把参数 $\theta$ 视为随机变量，推断过程由三部分构成：

| 组成部分 | 记号 | 含义 |
|----------|------|------|
| 先验分布 | $\pi(\theta)$ | 观测数据前对参数的认识 |
| 似然函数 | $L(\theta) = f(\mathbf{x} \mid \theta)$ | 参数取某值时数据出现的可能性 |
| 后验分布 | $\pi(\theta \mid \mathbf{x})$ | 结合数据后对参数的认识 |

三者的联系由 2.6 节给出的连续形式贝叶斯公式确定：

$$
\pi(\theta \mid \mathbf{x}) = \frac{f(\mathbf{x} \mid \theta) \pi(\theta)}{\int f(\mathbf{x} \mid \theta) \pi(\theta) \, d\theta} \propto f(\mathbf{x} \mid \theta) \pi(\theta)
$$

分母与 $\theta$ 无关，起归一化作用，因此在推导中通常省略，只在需要计算具体的概率时补回。**后验正比于先验乘似然**这一关系是全部贝叶斯推断的起点。

### 与频率派推断的对比

| 对比项 | 频率派 | 贝叶斯 |
|--------|--------|--------|
| 参数 | 固定未知常数 | 随机变量 |
| 推断对象 | 抽样分布 | 后验分布 |
| 区间 | 置信区间（覆盖频率） | 可信区间（后验概率） |
| 假设比较 | p 值与拒绝域 | 贝叶斯因子与后验几率 |
| 主要困难 | 分布推导 | 先验选择与后验计算 |

两类结论在小样本、弱先验下可能差别明显，在大样本下趋于一致。一致性来自后验分布的渐近正态性：样本量增大时似然函数在真值附近越来越集中，先验的影响被稀释，后验近似为以极大似然估计为中心、以 Fisher 信息为精度的正态分布（**Bernstein-von Mises 定理**）。

### 一个可以手算的例子

取先验 $\theta \sim \mathrm{Beta}(\alpha, \beta)$，似然为 $X \sim \mathrm{Binomial}(n, \theta)$，即观测到 $n$ 次试验中 $x$ 次成功。后验为

$$
\pi(\theta \mid x) \propto \theta^{x}(1 - \theta)^{n - x} \cdot \theta^{\alpha - 1}(1 - \theta)^{\beta - 1} = \theta^{\alpha + x - 1}(1 - \theta)^{\beta + n - x - 1}
$$

这正是 $\mathrm{Beta}(\alpha + x, \beta + n - x)$ 的核，因此后验分布为

$$
\theta \mid x \sim \mathrm{Beta}(\alpha + x, \ \beta + n - x)
$$

先验的两个参数与观测计数直接相加，这一简洁的更新规则是共轭性的体现。后验均值可以写成先验均值与样本比例的加权平均：

$$
E[\theta \mid x] = \frac{\alpha + x}{\alpha + \beta + n} = \frac{\alpha + \beta}{\alpha + \beta + n} \cdot \frac{\alpha}{\alpha + \beta} + \frac{n}{\alpha + \beta + n} \cdot \frac{x}{n}
$$

权重由先验等价样本量 $\alpha + \beta$ 与实际样本量 $n$ 的相对大小决定。先验越强，后验越靠近先验；数据越多，后验越靠近样本。这一加权形式在收缩估计（2.10 节）中已经出现过，两者是同一现象的不同表述。

```python
import numpy as np
from scipy import stats

# 点击率估计：先验 Beta(2, 38) 表示历史点击率约 0.05，等价先验样本量 40
alpha, beta = 2, 38
x, n = 7, 100

post = stats.beta(alpha + x, beta + n - x)
prior = stats.beta(alpha, beta)
print(f"先验均值   = {prior.mean():.4f}")
print(f"样本比例   = {x / n:.4f}")
print(f"后验均值   = {post.mean():.4f}")
print(f"后验 95% 可信区间 = {np.round(post.ppf([0.025, 0.975]), 4)}")
print(f"后验概率 P(theta > 0.05) = {post.sf(0.05):.4f}")
# 后验分布可以直接给出参数超过某个阈值的概率，这一结论在频率派框架下没有直接对应
```

## 2.12.2 共轭先验

### 定义与常见配对

若先验与后验属于同一个分布族，则称该先验为该似然的**共轭先验**（conjugate prior）。共轭使后验有闭式解，更新规则退化为参数的简单运算。四组常用的配对如下。

| 似然 | 共轭先验 | 后验 | 更新规则 |
|------|----------|------|----------|
| $\mathrm{Bernoulli}(\theta)$、$\mathrm{Binomial}(n, \theta)$ | $\mathrm{Beta}(\alpha, \beta)$ | $\mathrm{Beta}(\alpha + x, \beta + n - x)$ | 先验计数加观测计数 |
| $\mathrm{Poisson}(\lambda)$ | $\mathrm{Gamma}(\alpha, \beta)$ | $\mathrm{Gamma}(\alpha + \sum x_i, \beta + n)$ | 形状加事件数，速率加样本量 |
| $N(\mu, \sigma^2)$，$\sigma^2$ 已知 | $N(\mu_0, \sigma_0^2)$ | $N(\mu_n, \sigma_n^2)$ | 精度相加，精度加权平均 |
| $\mathrm{Multinomial}(n, \boldsymbol{\theta})$ | $\mathrm{Dirichlet}(\boldsymbol{\alpha})$ | $\mathrm{Dirichlet}(\boldsymbol{\alpha} + \mathbf{n})$ | 分量计数相加 |

正态-正态配对的更新公式值得单独写出，它用了 2.6 节的乘积公式。记精度为 $\tau = 1/\sigma^2$，则

$$
\tau_n = \tau_0 + n\tau, \qquad \mu_n = \frac{\tau_0 \mu_0 + n\tau \bar{x}}{\tau_n}, \qquad \tau = \frac{1}{\sigma^2}
$$

后验精度等于先验精度与数据精度之和，后验均值是先验均值与样本均值按精度加权的平均。这一形式说明精度是正态推断中自然的度量单位，方差在此处不便相加。

### 共轭的便利与局限

共轭的价值在于计算。后验的解析形式使可信区间、后验概率、后验预测分布都可以直接算出，不必借助数值方法。层次模型中共轭结构还能支持吉布斯采样：条件分布已知时逐分量抽样，见第 2.12.7 节。

局限同样明显。共轭配对要求似然属于指数族且先验与该族匹配，模型稍作改动就无法保持共轭；先验的形状受族结构限制，可能无法表达实际的先验判断；多参数模型中通常只有部分参数存在共轭配对。实际工作中共轭用于建模的起点与计算的加速，复杂模型还要依赖近似方法。

## 2.12.3 先验的选取

### 无信息先验与 Jeffreys 先验

没有可靠的先验信息时，希望先验对后验的影响尽可能小。**均匀先验**是最直接的做法：$\pi(\theta) \propto 1$。问题在于均匀性依赖参数化：$\theta$ 上均匀等价于 $\theta^2$ 上的分布密度为 $\theta^{-1/2}$，参数变换后均匀性不保持。

**Jeffreys 先验**（Jeffreys prior）用 Fisher 信息解决这一矛盾：

$$
\pi(\theta) \propto \sqrt{\det I(\theta)}
$$

它的构造依赖 Fisher 信息在参数变换下的变换规律，可以验证变换后的先验与新参数下的 Jeffreys 先验一致，因此具有**不变性**。伯努利比例的 Jeffreys 先验为 $\mathrm{Beta}(1/2, 1/2)$，正态均值的 Jeffreys 先验为常数，正态标准差的 Jeffreys 先验为 $\pi(\sigma) \propto 1/\sigma$。

**参考先验**（reference prior）是 Jeffreys 思想在多参数情形下的推广，通过最大化先验与后验之间的某种距离来定义，使先验对后验的影响最小。多参数下 Jeffreys 先验可能给出不合适的后验，参考先验按参数的重要性顺序逐步构造，避免这一问题。

### 最大熵先验

有部分信息时（例如已知参数的均值或支撑范围），**最大熵先验**（maximum entropy prior）给出在满足这些约束的分布中熵最大的那一个，理由与 2.5 节的最大熵分布相同：引入的额外假设最少。给定支撑有限时得到均匀先验，给定均值时得到指数型先验。

### 经验贝叶斯与层次贝叶斯

先验的参数（称为**超参数**）也需要确定。**经验贝叶斯**（empirical Bayes）用数据估计超参数：先写出数据的边缘分布 $f(\mathbf{x} \mid \boldsymbol{\eta}) = \int f(\mathbf{x} \mid \theta) \pi(\theta \mid \boldsymbol{\eta}) \, d\theta$，用极大似然估计 $\boldsymbol{\eta}$，再代入得到后验。做法简单，代价是忽略超参数估计的不确定性，且同一份数据被用于估计先验与计算后验，推断的确定性被高估。

**层次贝叶斯**（hierarchical Bayes）给超参数也指定先验，形成三层结构：

$$
\boldsymbol{\eta} \sim \pi(\boldsymbol{\eta}), \qquad \theta_i \mid \boldsymbol{\eta} \sim \pi(\theta_i \mid \boldsymbol{\eta}), \qquad x_i \mid \theta_i \sim f(x_i \mid \theta_i)
$$

各组的参数 $\theta_i$ 通过共享的超参数互相影响，形成**部分汇聚**（partial pooling）：数据多的组估计靠近自身样本，数据少的组被拉向总体均值。这一结构在 A/B 测试的多个实验组、多个店铺的销售额、多个用户的点击率等场景中是自然的建模方式，也在统计上优于对每组单独估计（无汇聚）与合并全部数据（完全汇聚）两个极端。

```python
import numpy as np
from scipy import stats

# 层次贝叶斯的部分汇聚效果：10 个组的点击率估计
rng = np.random.default_rng(10)
n_i = np.array([20, 25, 30, 40, 50, 80, 100, 150, 200, 300])   # 各组的观测次数
true_p = rng.beta(3, 20, size=len(n_i))                         # 各组的真实点击率
x_i = rng.binomial(n_i, true_p)

# 完全汇聚：用总体比例
p_pooled = x_i.sum() / n_i.sum()
# 无汇聚：各组单独估计
p_separate = x_i / n_i
# 部分汇聚：共用先验 Beta(a, b)，用矩估计确定超参数
mean_p, var_p = p_separate.mean(), p_separate.var()
a_hat = mean_p * (mean_p * (1 - mean_p) / var_p - 1)
b_hat = (1 - mean_p) * (mean_p * (1 - mean_p) / var_p - 1)
p_partial = (a_hat + x_i) / (a_hat + b_hat + n_i)

for i in range(len(n_i)):
    print(f"组 {i + 1:2d}（n = {n_i[i]:3d}）：真实 {true_p[i]:.3f}，"
          f"单独 {p_separate[i]:.3f}，部分汇聚 {p_partial[i]:.3f}")
# 样本量小的组被明显拉向总体均值，样本量大的组变化很小
```

## 2.12.4 后验预测分布与模型检验

### 后验预测分布

**后验预测分布**（posterior predictive distribution）给出新观测的预测分布，把参数的不确定性一并积分掉：

$$
f(\tilde{x} \mid \mathbf{x}) = \int f(\tilde{x} \mid \theta) \pi(\theta \mid \mathbf{x}) \, d\theta
$$

与把参数的点估计代入得到的预测相比，后验预测分布的宽度包含了参数估计的不确定性，这一点与 2.10 节预测区间宽于置信区间的道理相同。伯努利-贝塔配对下的后验预测分布是**贝塔-二项分布**（2.4 节）：

$$
\tilde{X} \mid x \sim \mathrm{BetaBinomial}\left(m, \alpha + x, \beta + n - x\right)
$$

它的方差大于固定 $\theta$ 的二项分布，超出部分正来自参数的不确定性。

**先验预测分布**（prior predictive distribution）在观测数据之前给出，形式为 $f(\tilde{x}) = \int f(\tilde{x} \mid \theta) \pi(\theta) \, d\theta$。它的主要用途是先验检验：生成的数据是否落在合理范围，可以暴露先验设定过宽或过窄的问题。

### 后验预测检验

**后验预测检验**（posterior predictive check）用拟合好的模型生成模拟数据，与观测数据在若干统计量上比较，检验模型是否复现了数据的关键特征。常用的检验统计量包括均值、方差、极值、零值比例、偏度等。

**后验预测 p 值**定义为

$$
p_B = P\left(T(\tilde{\mathbf{x}}) \geq T(\mathbf{x}_{\text{obs}}) \mid \mathbf{x}_{\text{obs}}\right)
$$

取值接近 $0$ 或 $1$ 都说明模型无法复现该统计量，取 $0.5$ 附近说明模型在该维度上描述良好。与频率派 p 值不同，它的分布不一定是均匀的，因此通常作为诊断指标而非严格的检验。

## 2.12.5 模型选择

### 贝叶斯因子与 Savage-Dickey 密度比

2.11 节已给出**贝叶斯因子**（Bayes factor）的定义与优势形式的更新规则。计算上的难点是边缘似然 $P(\mathbf{x} \mid H)$ 需要积分，高维模型中难以直接求出。对点零假设（$H_0: \theta = \theta_0$），可以用 **Savage-Dickey 密度比**（Savage-Dickey density ratio）绕过积分：

$$
\text{BF}_{10} = \frac{\pi(\theta_0 \mid \mathbf{x}, H_1)}{\pi(\theta_0 \mid H_1)}
$$

比值是后验密度与先验密度在零点的比值，只需要一次后验采样即可计算。先验在零点较大时该比值偏小，说明先验本身已经把质量放在零附近，数据提供的额外支持有限。

### 贝叶斯模型平均

模型不确定时，把预测结果按后验模型概率加权平均，称为**贝叶斯模型平均**（Bayesian model averaging，BMA）：

$$
f(\tilde{x} \mid \mathbf{x}) = \sum_{k} P(M_k \mid \mathbf{x}) f(\tilde{x} \mid \mathbf{x}, M_k), \qquad P(M_k \mid \mathbf{x}) \propto P(\mathbf{x} \mid M_k) P(M_k)
$$

它避免选出单一模型后忽略模型选择本身的不确定性，预测的方差通常比单一模型更合理。代价是需要枚举或采样模型空间，模型数很大时依赖搜索策略（如 MCMC 模型搜索、随机搜索）。

### 信息准则

模型数很大或边缘似然难算时，用信息准则近似。**WAIC**（widely applicable information criterion）由对数后验预测密度的估计与有效参数数构成，**DIC**（deviance information criterion）由后验偏差均值与有效参数数构成，两者都可以在 MCMC 输出上直接计算。**LOO-CV**（leave-one-out cross-validation）用重要性采样从后验样本估计，是当前推荐的做法，它对异常值稳健，且提供逐点诊断以识别拟合不佳的观测。

三类准则的共同思想是拟合优度减去复杂度惩罚：复杂模型拟合更好，但需要被惩罚。贝叶斯信息准则（BIC）可以看作边缘似然的近似，推导见 2.13 节。

## 2.12.6 近似推断：拉普拉斯近似与变分推断

### 拉普拉斯近似

**拉普拉斯近似**（Laplace approximation）用后验的众数附近的高斯分布替代真实后验。把 $\log \pi(\theta \mid \mathbf{x})$ 在众数 $\hat{\theta}$ 处做二阶泰勒展开：

$$
\log \pi(\theta \mid \mathbf{x}) \approx \log \pi(\hat{\theta} \mid \mathbf{x}) - \frac{1}{2}(\theta - \hat{\theta})^T \mathbf{H} (\theta - \hat{\theta})
$$

其中 $\mathbf{H}$ 是负对数后验在众数处的海森矩阵。指数化后得到

$$
\pi(\theta \mid \mathbf{x}) \approx N\left(\hat{\theta}, \ \mathbf{H}^{-1}\right)
$$

近似精度取决于后验的对称性与单峰性。后验偏斜或存在多个峰时，高斯近似会给出错误的不确定性甚至错误的中心。拉普拉斯近似在嵌套抽样与积分近似中有用，也常用作复杂算法的初始化。

### 变分推断

**变分推断**（variational inference，VI）把后验近似问题转化为优化问题：在一个便于处理分布族 $\mathcal{Q}$ 中寻找与真实后验最接近的成员。

$$
q^*(\theta) = \arg\min_{q \in \mathcal{Q}} \mathrm{KL}\left(q(\theta) \,\|\, \pi(\theta \mid \mathbf{x})\right)
$$

直接最小化 KL 需要后验本身，因此改用等价的优化目标。把 KL 展开并用 $\log \pi(\mathbf{x}) = \log \frac{\pi(\theta \mid \mathbf{x}) \pi(\mathbf{x})}{\pi(\theta)}$ 整理，得到

$$
\log \pi(\mathbf{x}) = \underbrace{E_q\left[\log \frac{\pi(\theta, \mathbf{x})}{q(\theta)}\right]}_{\text{ELBO}} + \mathrm{KL}\left(q(\theta) \,\|\, \pi(\theta \mid \mathbf{x})\right)
$$

左边是与 $q$ 无关的常数，KL 非负，因此最大化**证据下界**（evidence lower bound，ELBO）等价于最小化 KL：

$$
\text{ELBO}(q) = E_q\left[\log \pi(\mathbf{x}, \theta)\right] - E_q\left[\log q(\theta)\right] = E_q\left[\log \pi(\mathbf{x} \mid \theta)\right] - \mathrm{KL}\left(q(\theta) \,\|\, \pi(\theta)\right)
$$

后一种写法更有解释力：ELBO 等于期望对数似然减去 $q$ 与先验的 KL 距离，第一项鼓励拟合数据，第二项约束 $q$ 不要偏离先验太远。两项的权衡决定了近似的形状。ELBO 同时给出边缘似然的下界，可以用于模型比较。

**平均场近似**（mean-field approximation）取 $q$ 为各参数独立分布的乘积 $q(\theta) = \prod_j q_j(\theta_j)$。在此约束下对每个 $q_j$ 求最优解，得到

$$
q_j^*(\theta_j) \propto \exp\left(E_{-j}\left[\log \pi(\mathbf{x}, \theta)\right]\right)
$$

其中 $E_{-j}$ 表示对其他参数按当前 $q$ 取期望。坐标上升地迭代更新各分量，称为**坐标上升变分推断**（coordinate ascent variational inference，CAVI），每一步都提升 ELBO，算法收敛到局部最优。

平均场假设的代价是低估后验的相关结构，进而低估不确定性。参数高度相关时这一偏差明显，改进方法是**结构化变分推断**：保留部分依赖结构（例如用多元高斯近似整个参数向量，或用自回归结构刻画时间依赖）。

### 随机变分推断与重参数化

大数据下每次计算 ELBO 需要遍历全部数据，代价过高。**随机变分推断**（stochastic variational inference，SVI）用小批量的无偏估计代替全量期望，配合随机优化更新参数，使变分推断可以扩展到海量数据。梯度估计的方差决定收敛速度，两种常用估计方法如下。

**得分函数估计**（score function estimator，也称 REINFORCE）利用恒等式 $\nabla_q \log q$，对任意分布都适用，但方差较大。

**重参数化技巧**（reparameterization trick）在分布本身可以写成确定性变换时得到低方差估计。把 $\theta \sim q_\phi$ 写成

$$
\theta = g(\phi, \epsilon), \qquad \epsilon \sim p(\epsilon)
$$

其中 $\epsilon$ 的分布与参数无关。此时期望的梯度可以直接对 $\phi$ 求导：

$$
\nabla_\phi E_{q_\phi}\left[h(\theta)\right] = E_{p(\epsilon)}\left[\nabla_\phi h\left(g(\phi, \epsilon)\right)\right]
$$

高斯分布的重参数化形式是 $\theta = \mu + \sigma \epsilon$，$\epsilon \sim N(0, 1)$。**黑箱变分推断**（black-box variational inference）把这一技巧推广到需要自动微分的任意模型，是变分自编码器与贝叶斯神经网络中的标准做法。

**期望传播**（expectation propagation，EP）是另一类确定性近似：用一系列指数族因子近似真实因子，逐个更新并保证矩匹配。它在高斯过程分类与部分图模型中精度较高，代价是实现复杂、数值稳定性较差。

```python
import numpy as np
from scipy import stats, optimize

# 用平均场变分推断近似一个双峰后验与一个偏斜后验
# 目标后验：0.3 N(-2, 0.7^2) + 0.7 N(3, 1.0^2) 的（未归一化）对数密度
def log_target(theta):
    w1, w2 = 0.3, 0.7
    m1, s1 = -2.0, 0.7
    m2, s2 = 3.0, 1.0
    comp = np.stack([
        np.log(w1) + stats.norm.logpdf(theta, m1, s1),
        np.log(w2) + stats.norm.logpdf(theta, m2, s2),
    ])
    return np.logaddexp.reduce(comp, axis=0)

def neg_elbo(params):
    mu, log_sigma = params
    sigma = np.exp(log_sigma)
    eps = np.linspace(-6, 6, 200)          # 用数值积分近似期望
    theta = mu + sigma * eps
    weights = stats.norm.pdf(eps)
    weights = weights / weights.sum()
    # 蒙特卡洛估计：E_q[log p(theta) - log q(theta)]
    e_log_p = np.sum(weights * log_target(theta))
    e_log_q = np.sum(weights * stats.norm.logpdf(theta, mu, sigma))
    return -(e_log_p - e_log_q)

res = optimize.minimize(neg_elbo, x0=[0.0, 0.0], method="Nelder-Mead")
print(f"变分近似：均值 = {res.x[0]:.3f}，标准差 = {np.exp(res.x[1]):.3f}")
# 双峰后验下平均场只能给出单峰近似，位置落在两峰之间，方差偏大
```

## 2.12.7 马尔可夫链蒙特卡洛

### 基本思路

数值积分的另一条路线是采样：如果能从后验中抽取大量样本，任何后验量都可以用样本平均估计。**马尔可夫链蒙特卡洛**（Markov chain Monte Carlo，MCMC）构造一条马尔可夫链（2.8 节），使其平稳分布等于目标后验 $\pi(\theta \mid \mathbf{x})$，再从链的轨道上取样本。

$$
\hat{E}[\theta] = \frac{1}{T - t_0} \sum_{t = t_0 + 1}^{T} \theta^{(t)}
$$

前 $t_0$ 步用于**预热**（burn-in），让链从初始点走到高概率区域。构建链的关键是转移核：只要转移核满足**细致平衡**（detailed balance）

$$
\pi(\theta) T(\theta \to \theta') = \pi(\theta') T(\theta' \to \theta)
$$

则目标分布就是平稳分布。三条常用构造如下。

### Metropolis-Hastings 算法

**Metropolis-Hastings 算法**（MH）用提议分布 $q(\theta' \mid \theta)$ 生成候选点，再按接受概率决定是否移动：

$$
\alpha(\theta \to \theta') = \min\left(1, \ \frac{\pi(\theta') q(\theta \mid \theta')}{\pi(\theta) q(\theta' \mid \theta)}\right)
$$

接受概率的构造来自细致平衡条件：若 $\pi(\theta') q(\theta \mid \theta') < \pi(\theta) q(\theta' \mid \theta)$，直接把转移概率取为提议概率会破坏细致平衡，按比值削减即可恢复。目标分布只需知道到常数倍，因为比值中归一化常数被约去，这是 MCMC 的重要优点：不必计算边缘似然。

提议分布为对称时（如随机游走提议 $\theta' = \theta + \epsilon$，$\epsilon \sim N(0, s^2)$），接受概率简化为 $\min(1, \pi(\theta')/\pi(\theta))$。提议的步长 $s$ 决定接受率：步长过小则链移动缓慢、样本自相关高，步长过大则接受率过低、链长时间停留在原地。高维高斯目标下最优接受率约为 $0.234$，这一数值可以作为调参的参考。

### Gibbs 采样

**Gibbs 采样**（Gibbs sampling）逐分量更新，每次从该分量的条件后验中抽取：

$$
\theta_j^{(t+1)} \sim \pi\left(\theta_j \mid \theta_1^{(t+1)}, \ldots, \theta_{j-1}^{(t+1)}, \theta_{j+1}^{(t)}, \ldots, \theta_p^{(t)}\right)
$$

它不需要接受步骤，接受率恒为 $1$，是高维问题中效率较高的方法。前提是各条件后验可以采样，共轭结构恰好提供了这一条件，因此共轭模型与 Gibbs 采样常常配对使用。条件分布难以采样时，可以用 MH 步替换该分量的更新，得到**Metropolis-within-Gibbs**算法。Gibbs 在参数高度相关时混合速度很慢，这是它主要的局限。

### 哈密顿蒙特卡洛

**哈密顿蒙特卡洛**（Hamiltonian Monte Carlo，HMC）借助梯度信息提高效率。它把参数 $\theta$ 视为位置，引入辅助动量 $\mathbf{r} \sim N(\mathbf{0}, \mathbf{M})$，在由势能 $U(\theta) = -\log \pi(\theta)$ 与动能 $K(\mathbf{r}) = \frac{1}{2}\mathbf{r}^T\mathbf{M}^{-1}\mathbf{r}$ 构成的哈密顿系统上模拟轨迹：

$$
\frac{d\theta}{dt} = \mathbf{M}^{-1}\mathbf{r}, \qquad \frac{d\mathbf{r}}{dt} = \nabla \log \pi(\theta)
$$

数值积分用跳蛙法，步长 $\epsilon$ 与步数 $L$ 是主要参数，轨迹终点作为候选点并用 MH 接受步骤修正离散化误差。梯度指向高概率区域，使链沿等高线快速移动，在高维问题中比随机游走 MH 快若干数量级。**无回旋采样**（no-U-turn sampler，NUTS）自动确定轨迹长度：当轨迹开始折返时停止，避免手工设置 $L$，是当前概率编程工具（Stan、PyMC、NumPyro）的默认采样器。

其他方法包括**切片采样**（slice sampling，在密度水平集上均匀采样，无需调参）与**自适应 MCMC**（根据历史轨迹调整步长或提议分布，如自适应 Metropolis 与自适应 HMC）。**并行回火**（parallel tempering）同时运行多个不同温度的链并允许交换，用于处理多峰后验；**模拟退火**（simulated annealing）逐步降低温度以寻找全局最优，用途偏向最优化而非采样。

```python
import numpy as np

def metropolis_hastings(log_target, init, n_samples=20_000, step=0.8, seed=0):
    """一维 Metropolis-Hastings，返回样本与接受率"""
    rng = np.random.default_rng(seed)
    theta = init
    samples = np.empty(n_samples)
    accepted = 0
    for t in range(n_samples):
        proposal = theta + rng.normal(scale=step)
        log_ratio = log_target(proposal) - log_target(theta)
        if np.log(rng.uniform()) < log_ratio:
            theta = proposal
            accepted += 1
        samples[t] = theta
    return samples, accepted / n_samples

# 目标：Beta(3, 9) 的对数密度（未归一化）
log_target = lambda x: 0 if (x <= 0 or x >= 1) else 2 * np.log(x) + 8 * np.log(1 - x)
samples, acc = metropolis_hastings(log_target, 0.5)
from scipy import stats
print(f"接受率 = {acc:.3f}")
print(f"后验均值：采样 {samples[2000:].mean():.4f}，理论 {stats.beta(3, 9).mean():.4f}")
print(f"后验标准差：采样 {samples[2000:].std():.4f}，理论 {stats.beta(3, 9).std():.4f}")
```

## 2.12.8 收敛诊断

MCMC 的输出只有在链已经收敛时才可用。判断收敛没有绝对可靠的单一指标，需要多种诊断配合。

**轨迹图**（trace plot）把样本按迭代次序画出，收敛的链应在一个稳定区间内快速上下波动，没有趋势与长平台。**自相关图**（autocorrelation plot）显示相隔若干步的样本之间的相关性，衰减越快说明混合越好。

**有效样本量**（effective sample size，ESS）把自相关折算为独立样本的等价数量：

$$
\text{ESS} = \frac{T}{1 + 2\sum_{k=1}^{\infty} \rho_k}
$$

其中 $\rho_k$ 是滞后 $k$ 的自相关。ESS 远小于实际迭代数时，说明链的自相关高，需要增加迭代或改进算法。

**潜在尺度缩减因子**（potential scale reduction factor，$\hat{R}$）比较多条从不同初值出发的链之间的方差与链内方差：

$$
\hat{R} = \sqrt{\frac{\text{链间方差} + \text{链内方差}}{\text{链内方差}}}
$$

$\hat{R}$ 接近 $1$ 说明各链已经混合到同一分布。经验规则是 $\hat{R} < 1.01$ 才可接受，早期标准 $1.1$ 已不再推荐。

**Geweke 诊断**比较链的前段与后段的均值，用谱密度估计标准误后做 z 检验。**Heidelberger-Welch 诊断**检验链是否已经平稳并估计所需的预热长度。多个诊断同时通过时，收敛的判断才比较可靠。

## 2.12.9 贝叶斯变量选择与几类扩展

### 变量选择

贝叶斯框架下的变量选择通过给系数指定能使部分系数接近零的先验来实现。**Spike-and-slab 先验**由两部分混合而成：一个在零处的尖峰（spike）与一个宽的先验（slab），后验中落在 spike 部分的概率直接给出变量被选中的后验概率。**马蹄先验**（horseshoe prior）用一个全局尺度参数与逐系数的局部尺度参数构成，局部尺度可以极小，使无关系数被强烈压缩，相关系数基本不受影响，同时保持连续的形式便于采样。两者与 2.10 节的 Lasso 相比，优点是提供系数的完整后验分布与选择的不确定性，代价是计算量更大。

### 模型扩展

把贝叶斯框架与具体模型结合，得到一系列扩展：**贝叶斯线性回归**在系数上放先验，后验的均值形式与岭回归一致（高斯先验对应 $L_2$ 惩罚），后验的宽度额外给出估计的不确定性；**贝叶斯广义线性模型**把先验放在指数族的自然参数上，用拉普拉斯近似或 MCMC 计算后验；**贝叶斯混合模型**用狄利克雷先验给混合权重，后验同时给出分量数与分量参数的分布。

**贝叶斯非参数**（Bayesian nonparametrics）用无限维的先验处理模型复杂度不确定的问题。**狄利克雷过程**（Dirichlet process）是其中的核心构造，它给出对离散分布的分布，其**中国餐馆过程**（Chinese restaurant process）表示描述了样本的聚类结构：新样本以一定概率加入已有类别，或以一定概率开辟新类别。类别数不需要预先设定，由数据决定，这一性质使它在聚类与密度估计中受到关注。

### 与深度学习结合

深度学习中的贝叶斯方法把网络权重视为随机变量。**贝叶斯神经网络**（Bayesian neural network）在权重上放先验并用变分推断或 MCMC 求近似后验，预测时对权重采样平均，不确定性估计比确定性网络的输出更有依据。计算上的方法是**随机梯度朗之万动力学**（stochastic gradient Langevin dynamics，SGLD）：在梯度更新的基础上加入与温度成比例的高斯噪声，使迭代轨迹的平稳分布趋近后验。**归一化流**（normalizing flow）用可逆变换构造表达力强的变分分布，克服平均场假设的局限。**概率编程语言**（如 Stan、PyMC、NumPyro）把这些方法封装为声明式接口，用户只需描述模型与先验，推断与诊断由系统完成。

## 2.12.10 本节小结

::: success 从后验分布到可计算的方法
本节把贝叶斯推断组织为一条从框架到计算的链路。后验正比于先验乘似然是全部内容的基础，共轭配对给出可以手算的情形，四组常见配对（贝塔-二项、伽马-泊松、正态-正态、狄利克雷-多项）的更新规则都是参数与计数或精度的直接相加。先验的选取在无信息先验（Jeffreys、参考先验、最大熵）与信息先验（经验贝叶斯、层次贝叶斯）之间权衡，层次结构带来部分汇聚，在小样本组上明显优于单独估计。后验预测分布把参数不确定性纳入预测，后验预测检验用模拟数据与观测数据的比较诊断模型。模型选择通过贝叶斯因子、Savage-Dickey 密度比、BMA 与信息准则完成，各自的适用规模不同。计算方法沿三条路线展开：拉普拉斯近似用高斯替代后验，变分推断把近似转化为 ELBO 的优化并用重参数化降低梯度方差，MCMC 构造以目标为平稳分布的链，其中 HMC 与 NUTS 借助梯度在高维下效率最高。收敛诊断需要轨迹图、ESS 与 $\hat R$ 等多种指标配合，任何单项指标都不足以判断收敛。
:::

推断与建模的接口落在回归上。回归把参数估计、区间估计与假设检验组合成一套完整流程，处理的是响应变量与解释变量之间的函数关系，是实际数据分析中使用频率最高的工具。下一节从最小二乘出发，讨论回归的诊断、正则化、广义线性模型与层次结构，把前十二节的工具组织成一个可直接使用的建模框架。

## 练习题

### 第 1 题 概念推导

设 $X_1, \ldots, X_n$ 独立同分布于 $\mathrm{Poisson}(\lambda)$，先验为 $\mathrm{Gamma}(\alpha, \beta)$。推导后验分布，说明它的两个参数如何由先验参数与数据得到；再写出后验均值的加权形式，并解释先验等价样本量的含义。

::: details 参考答案
**后验推导**：似然为

$$
L(\lambda) = \prod_{i=1}^{n} \frac{\lambda^{x_i} e^{-\lambda}}{x_i!} \propto \lambda^{\sum x_i} e^{-n\lambda}
$$

先验密度 $\pi(\lambda) \propto \lambda^{\alpha - 1} e^{-\beta\lambda}$，两者相乘得

$$
\pi(\lambda \mid \mathbf{x}) \propto \lambda^{\alpha + \sum x_i - 1} e^{-(\beta + n)\lambda}
$$

这正是 $\mathrm{Gamma}\left(\alpha + \sum_{i=1}^{n} x_i, \ \beta + n\right)$ 的核。形状参数加上观测到的总事件数，速率参数加上观测次数。

**后验均值的加权形式**：

$$
E[\lambda \mid \mathbf{x}] = \frac{\alpha + \sum x_i}{\beta + n} = \frac{\beta}{\beta + n} \cdot \frac{\alpha}{\beta} + \frac{n}{\beta + n} \cdot \frac{\sum x_i}{n}
$$

先验均值为 $\alpha / \beta$，样本均值即事件率 $\sum x_i / n$，两者的权重由 $\beta$ 与 $n$ 的相对大小决定。

**先验等价样本量**：$\beta$ 起的作用与样本量 $n$ 相同，可以理解为先验中包含的等价观测次数。$\beta$ 越大，先验越强，后验越靠近先验均值；$n$ 越大，数据的影响占主导。需要注意的是，$\beta$ 同时也影响先验均值 $\alpha / \beta$，两个参数不能独立地控制强度与位置。
:::

### 第 2 题 计算推理

某商品的历史转化率为 $\alpha = 3$、$\beta = 27$ 的贝塔先验（均值 $0.1$）。新页面上线后获得 $n = 200$ 次展示，其中 $x = 16$ 次转化。求后验分布与后验均值的 $95\%$ 等尾可信区间；计算后验概率 $P(\theta > 0.1)$，并说明它与新页面转化率不高于旧页面这一判断的关系。

::: details 参考答案
**后验分布**：

$$
\theta \mid x \sim \mathrm{Beta}(3 + 16, \ 27 + 184) = \mathrm{Beta}(19, \ 211)
$$

**后验均值**：

$$
E[\theta \mid x] = \frac{19}{230} \approx 0.0826
$$

样本比例为 $16 / 200 = 0.08$，与后验均值接近，说明先验（均值 $0.1$）把估计略微拉高。

**可信区间**：$\mathrm{Beta}(19, 211)$ 的 $2.5\%$ 与 $97.5\%$ 分位数约为

$$
[0.0497, \ 0.1234]
$$

区间包含先验均值 $0.1$ 与样本比例 $0.08$，说明数据没有把后验推到远离先验的位置。

**后验概率与结论**：$P(\theta > 0.1) = 1 - F(0.1)$，对 $\mathrm{Beta}(19, 211)$ 计算约为 $0.19$。这一数值的意思是：在当前先验与数据的组合下，新页面转化率高于旧基准的概率约为 $19\%$，低于基准的概率约为 $81\%$。与频率派检验的差别在于它直接给出参数大于阈值的概率，而 p 值回答的是在参数等于阈值时观测到当前数据的概率。判断时仍需结合代价：若上线成本低、收益不确定，$19\%$ 的后验概率可能不足以支持替换决策；若新旧方案的成本差异很小，则可以继续观察累积数据。
:::

### 第 3 题 代码验证

用 Metropolis-Hastings 算法从一维偏斜后验中采样，比较不同提议步长下的接受率与有效样本量。目标后验取 $\mathrm{Beta}(2, 8)$，跳过预热样本后计算后验均值与标准差的估计值，并与解析结果对照。

::: details 参考答案

```python
import numpy as np
from scipy import stats

def run_mh(step, n=50_000, burn=5_000, seed=1):
    rng = np.random.default_rng(seed)
    log_target = lambda x: 0 if (x <= 0 or x >= 1) else np.log(x) + 7 * np.log(1 - x)
    theta, samples, acc = 0.5, [], 0
    for _ in range(n):
        prop = theta + rng.normal(scale=step)
        if np.log(rng.uniform()) < log_target(prop) - log_target(theta):
            theta = prop
            acc += 1
        samples.append(theta)
    s = np.array(samples[burn:])
    # 用滞后 1 的自相关粗略折算有效样本量
    rho1 = np.corrcoef(s[:-1], s[1:])[0, 1]
    ess = len(s) * (1 - rho1) / (1 + rho1)
    return acc / n, s.mean(), s.std(), ess

for step in [0.02, 0.2, 2.0, 20.0]:
    acc, mean, sd, ess = run_mh(step)
    print(f"步长 {step:5.2f}：接受率 {acc:.3f}，均值 {mean:.4f}，标准差 {sd:.4f}，ESS ≈ {ess:,.0f}")

d = stats.beta(2, 8)
print(f"解析解：均值 {d.mean():.4f}，标准差 {d.std():.4f}")
```

步长过小（$0.02$）时接受率高但链移动缓慢，自相关大、ESS 小；步长过大（$20$）时多数提议落在支撑之外被拒绝，接受率极低，ESS 同样小；中间的两个步长给出较高 ESS，均值与标准差接近解析解。这一对比说明 MH 的效率由接受率与移动距离共同决定，调参的目标是让 ESS 最大化，而不是让接受率最大化。多链诊断（$\hat R$）与轨迹图应配合使用，单次运行的输出不足以判断收敛。
:::

### 第 4 题 综合应用

某推荐系统需要对 $100$ 个新上架商品估计点击率。多数商品只有几十次曝光，少数热门商品有上千次曝光。请说明为什么对每个商品单独估计点击率效果不好；给出用层次贝叶斯建模的基本结构；说明部分汇聚在估计上的表现；并比较它与简单缩短极端估计的做法（例如把所有点击率截断在 $[0.01, 0.5]$）的差别。

::: details 参考答案
**单独估计的问题**：曝光几十次的商品，观测到的点击率波动极大。$20$ 次曝光中 $3$ 次点击给出 $0.15$，$20$ 次曝光中 $0$ 次点击给出 $0$。前者与后者的差别很可能来自随机波动而非真实的商品差异，直接使用这些估计会导致排序不稳定，推荐结果随之抖动。

**层次结构**：

$$
\alpha, \beta \sim \pi(\alpha, \beta), \qquad p_i \mid \alpha, \beta \sim \mathrm{Beta}(\alpha, \beta), \qquad x_i \mid p_i \sim \mathrm{Binomial}(n_i, p_i)
$$

先验的两个超参数由全体商品的数据共同决定，每个商品的点击率从共享的先验中抽取，观测影响各自的后验。若超参数只用一次点估计确定，则退化为经验贝叶斯；给超参数也放先验则是完整的层次贝叶斯。

**部分汇聚的表现**：样本量小的商品后验被强烈拉向总体均值，估计的方差大幅下降；样本量大的商品后验基本由自身数据决定，估计几乎不变。这一自适应行为使小样本商品不会因为偶然的极端比例而排到榜首或末尾，同时保留了大样本商品的真实差异。后验均值可以写成先验均值的权重与样本比例的权重之和，权重由该商品的曝光数与先验等价样本量的相对大小决定。

**与截断做法的差别**：截断把估计限制在固定区间内，边界值处会堆积大量商品（例如所有 $0$ 点击商品都被记为 $0.01$），并且截断阈值与区间不随数据量调整：曝光 $1000$ 次的商品与曝光 $20$ 次的商品被同等对待。层次模型不引入硬边界，收缩强度由各商品自身的样本量决定，且后验分布同时给出每个估计的不确定性，可以据此决定是否继续收集数据。截断是启发式修正，层次模型是有明确生成假设的推断。
:::

## 常见错误

**错误 1 · 把可信区间当作置信区间解释**

原因：两类区间的数值相近，在弱先验与大样本下几乎相同，容易混用。解释上差别是实质性的：可信区间允许说参数落在其中的概率为 $95\%$，置信区间的 $95\%$ 描述的是区间构造方法的长期覆盖频率，对已经算出的区间没有概率含义。

解决：报告时写明所用的框架与区间的类型。用频率派方法时给出覆盖率的说明，用贝叶斯方法时给出先验与后验的定义，避免读者按错误的对象理解数值。

**错误 2 · 用平坦先验当作完全无信息**

原因：均匀先验在参数变换后不再均匀，所谓无信息依赖参数化。对比例参数取均匀先验与对其对数几率取均匀先验会得到不同的后验，参数化选择实质性地影响结论。

解决：需要无信息先验时使用 Jeffreys 先验或参考先验，它们具有变换不变性。报告结果时说明先验的形式，并做敏感性分析：换用不同的弱先验，观察结论是否稳定。

**错误 3 · 忽略 MCMC 的收敛诊断**

原因：MCMC 的输出总能画出轨迹图与直方图，无论链是否收敛。从糟糕初值出发、未充分预热的链会给出看似合理但完全错误的后验，多峰后验下一条链可能只探索了一个峰。

解决：至少运行四条从不同初值出发的链，检查 $\hat R$ 是否小于 $1.01$，查看轨迹图是否稳定，报告 ESS 是否足够大。多峰问题用并行回火或更长的链，必要时改用能刻画多峰的近似方法。

**错误 4 · 用平均场变分近似汇报高精度区间**

原因：平均场假设后验参数相互独立，会低估参数之间的相关性，进而低估不确定性。参数在真实后验中高度相关时（例如回归的斜率与截距），平均场给出的区间可能明显偏窄，用于决策会产生过度自信。

解决：检查参数之间的后验相关结构，相关性明显时改用结构化变分、多元高斯近似或 MCMC。用变分推断快速探索模型结构，最终结论用更精确的方法验证，是常见的组合方式。