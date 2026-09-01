---
title: 1.5 内核岭回归与高斯过程
sidebar:
  order: 5
---
# 1.5 内核岭回归与高斯过程

前面几节反复提到核技巧把线性模型推广到非线性。内核岭回归就是这一思路的直接应用，而高斯过程更进一步，不但给出预测值，还给出预测的不确定性。当任务需要判断模型对某个预测有多自信时，高斯过程比普通模型更有优势。本节先讲内核岭回归的对偶解，再系统介绍高斯过程的先验、后验、回归、分类与核函数组合。

## 1.5.1 KernelRidge 与对偶解

`KernelRidge` 在特征空间中求解岭回归：用特征映射 $\Phi$ 把样本送入高维空间，目标是

$$
\min_w \|y - \Phi w\|_2^2 + \lambda \|w\|_2^2
$$

其中 $\Phi$ 的每一行是样本的高维特征，$\lambda$ 是正则强度（对应参数 `alpha`）。由表示定理，最优 $w$ 可以写成训练样本的线性组合 $w = \Phi^T\alpha$，把 $\alpha$ 作为新的未知量，得到对偶解：

$$
\alpha = (K + \lambda I)^{-1} y
$$

其中 $K = \Phi\Phi^T$ 是 **Gram 矩阵**，第 $i,j$ 项正是核函数 $K(x_i, x_j)$，因此整个求解只需要核函数值，不需要显式写出高维特征。新样本 $x_*$ 的预测为 $f(x_*) = \sum_i \alpha_i K(x_*, x_i)$。

```python
from sklearn.kernel_ridge import KernelRidge
import numpy as np

x = np.linspace(0, 6, 60).reshape(-1, 1)
y = np.sin(x).ravel() + 0.05 * np.random.randn(60)

kr = KernelRidge(kernel='rbf', alpha=1.0, gamma=0.5).fit(x, y)
print(kr.predict([[1.5]]))
```

`alpha` 是正则强度，越大预测越平滑；`gamma` 是 RBF 核的宽度参数。对偶求解要算 $n \times n$ 矩阵的逆，复杂度 $O(n^3)$，所以 KernelRidge 只适合中小规模数据（几万样本以内）。

## 1.5.2 高斯过程的先验与后验

**高斯过程(GP)** 把函数本身当成随机变量：在任何有限个点上的取值联合服从高斯分布。一个高斯过程由均值函数 $m(x)$ 与协方差函数（即核）$k(x, x')$ 完全刻画，记作

$$
f \sim \mathcal{GP}(m(x),\, k(x, x'))
$$

核函数 $k(x, x')$ 描述两个点处函数值的相关程度：两点越近，核值越大，函数值越相关，曲线越平滑。**先验**是还没看到数据时对函数的信念，**后验**是看到训练数据后按贝叶斯公式更新的函数分布。后验的中心（均值）就是预测值，后验的方差就是不确定性。

## 1.5.3 GaussianProcessRegressor

`GaussianProcessRegressor` 基于后验给出两个结果：每个预测点的**均值**与**方差**。在带噪声的观测下，新点 $x_*$ 的后验均值为

$$
\bar{f}_* = K_*^T (K + \sigma^2 I)^{-1} y
$$

后验方差为

$$
\text{Var}(f_*) = k(x_*, x_*) - K_*^T (K + \sigma^2 I)^{-1} K_*
$$

其中 $K_*$ 是新点与训练点的核向量，$\sigma^2$ 是噪声方差。第一式说明预测是训练标签的加权组合；第二式说明远离训练数据时方差大、靠近训练数据时方差小，这正是高斯过程给出置信区间的来源。

```python
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel

kernel = 1.0 * RBF(length_scale=1.0) + WhiteKernel(noise_level=0.05)
gpr = GaussianProcessRegressor(kernel=kernel).fit(x, y)

mean, std = gpr.predict(x, return_std=True)
print(mean[:5])
print(std[:5])   # 每个点的预测标准差

x_far = np.array([[10.0], [11.0]])   # 远离训练范围
m_far, s_far = gpr.predict(x_far, return_std=True)
print(m_far, s_far)   # 方差明显更大
```

`predict(..., return_std=True)` 返回预测均值与标准差。核函数的超参数（如 `length_scale`、`noise_level`）在 `fit` 时通过最大化边际似然自动优化，无需手动调节。高斯过程适合样本量中等、需要不确定性估计的回归问题，复杂度同样为 $O(n^3)$。

## 1.5.4 GaussianProcessClassifier

`GaussianProcessClassifier` 把高斯过程用于分类：先在隐函数上做高斯过程回归，再用 sigmoid 等链接函数把隐函数取值映射成类别概率。sklearn 用拉普拉斯近似处理非高斯似然。

```python
from sklearn.gaussian_process import GaussianProcessClassifier
from sklearn.gaussian_process.kernels import RBF
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
mask = y < 2   # 二分类
gpc = GaussianProcessClassifier(kernel=1.0 * RBF(length_scale=1.0))
gpc.fit(X[mask], y[mask])
print(gpc.predict(X[mask][:5]))
print(gpc.predict_proba(X[mask][:5]))
```

`predict_proba` 给出每个类别的概率，方便评估置信度。GP 分类同样受益于自动超参数优化，但多分类与大数据时计算较重。

## 1.5.5 高斯过程核函数

核函数是高斯过程的核心，`sklearn.gaussian_process.kernels` 提供常用核，如下表。

| 核函数 | 公式 | 特点 |
|------|------|------|
| RBF | $k(x,x') = \exp(-\frac{\|x-x'\|^2}{2l^2})$ | 最常用，平滑无限可微 |
| Matern | RBF 的推广 | 参数 $\nu$ 控制平滑度，更贴近实际数据 |
| RationalQuadratic | 尺度混合的 RBF | 长程与短程变化并存 |
| ExpSineSquared | $\exp(-2\frac{\sin^2(\pi\|x-x'\|/p)}{l^2})$ | 周期核，刻画周期模式 |
| DotProduct | $x \cdot x'$ | 线性核，等价于线性模型 |
| WhiteKernel | 噪声核 | 叠加到其他核上建模观测噪声 |

```python
from sklearn.gaussian_process.kernels import Matern, RationalQuadratic, ExpSineSquared, DotProduct

k_mat = Matern(length_scale=1.0, nu=1.5)
k_rq = RationalQuadratic(length_scale=1.0, alpha=1.0)
k_period = ExpSineSquared(length_scale=1.0, periodicity=6.0)
k_dot = DotProduct(sigma_0=1.0)
```

RBF 核的 `length_scale` 越大曲线越平缓，越小越崎岖。Matern 核的 `nu` 取值 0.5、1.5、2.5 分别对应不同平滑程度，`nu=0.5` 与绝对指数核一致，数据不光滑时更稳健。周期核 `periodicity` 指定周期长度，适合温度、销量这类有周期性的数据。

## 1.5.6 核函数的组合运算

核函数可以像代数表达式一样**相加、相乘、取幂**，组合出新核。加法表示两种效应的叠加（趋势加噪声、周期加噪声），乘法表示两种效应的交互，取幂表示核的缩放。

```python
from sklearn.gaussian_process.kernels import RBF, ExpSineSquared, WhiteKernel, ConstantKernel

# 趋势核 + 周期核 + 噪声核
kernel = 1.0 * RBF(length_scale=1.0) \
    + ExpSineSquared(length_scale=1.0, periodicity=6.0) \
    + WhiteKernel(noise_level=0.1)

# 用乘号组合趋势与周期效应
kernel2 = RBF(length_scale=1.0) * ExpSineSquared(length_scale=1.0, periodicity=6.0)

# 幂运算缩放核的幅值
kernel3 = ConstantKernel(constant_value=2.0, constant_value_bounds=(0.1, 10.0)) ** 2

gpr = GaussianProcessRegressor(kernel=kernel)
gpr.fit(x, y)
print(gpr.kernel_)   # 打印优化后的超参数
```

优化时各超参数在给定边界内自动搜索，`gpr.kernel_` 显示最终取值。组合核让研究者把领域知识（如趋势、周期、噪声）编码进模型，是高斯过程建模的重要技巧。

## 练习题

### 第1题 概念理解

写出 KernelRidge 的对偶解并说明 $K$ 的含义；说明高斯过程后验均值与方差的物理含义；说明核函数加法与乘法分别表示什么效应。

::: details 参考答案

对偶解 $\alpha = (K + \lambda I)^{-1}y$，$K$ 是 Gram 矩阵，第 $i,j$ 项为核函数值 $K(x_i,x_j)$，因此求解只需要核函数值。后验均值是预测值，后验方差是不确定性，远离训练数据时方差大。核加法表示效应叠加（如趋势加噪声），核乘法表示效应交互。
:::

### 第2题 代码编写

用 `GaussianProcessRegressor` 拟合正弦数据，用 `return_std=True` 检查训练点与远点的方差差异；用 `GaussianProcessClassifier` 做二分类并输出 `predict_proba`。

::: details 参考答案

```python
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor, GaussianProcessClassifier
from sklearn.gaussian_process.kernels import RBF, WhiteKernel

x = np.linspace(0, 6, 40).reshape(-1, 1)
y = np.sin(x).ravel() + 0.05 * np.random.randn(40)

kernel = 1.0 * RBF(length_scale=1.0) + WhiteKernel(noise_level=0.05)
gpr = GaussianProcessRegressor(kernel=kernel).fit(x, y)

mean_train, std_train = gpr.predict(x, return_std=True)
mean_far, std_far = gpr.predict([[10.0], [12.0]], return_std=True)
print(std_train.mean(), std_far.mean())

rng = np.random.RandomState(0)
Xc = np.vstack([rng.normal(0, 1, (30, 2)), rng.normal(3, 1, (30, 2))])
yc = np.hstack([np.zeros(30), np.ones(30)])
gpc = GaussianProcessClassifier(kernel=1.0 * RBF(length_scale=1.0)).fit(Xc, yc)
print(gpc.predict_proba(Xc[:3]))
```

:::

### 第3题 进阶练习

用组合核（趋势加周期加噪声）拟合带周期性的数据，对比单一 RBF 核与组合核的预测误差；打印 `gpr.kernel_` 观察自动优化的超参数。

::: details 参考答案

```python
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ExpSineSquared, WhiteKernel

x = np.linspace(0, 20, 120).reshape(-1, 1)
y = np.sin(x).ravel() + 0.05 * x.ravel() + 0.1 * np.random.randn(120)

k1 = 1.0 * RBF(length_scale=1.0)
k2 = 1.0 * RBF(length_scale=1.0) + ExpSineSquared(length_scale=1.0, periodicity=6.0) + WhiteKernel(noise_level=0.1)

for name, k in [('RBF', k1), ('组合核', k2)]:
    gpr = GaussianProcessRegressor(kernel=k, normalize_y=True).fit(x, y)
    mean, std = gpr.predict(x, return_std=True)
    err = np.mean((mean - y) ** 2)
    print(name, err, gpr.kernel_)
```

:::

## 常见错误

**错误 1 · KernelRidge 或 GaussianProcessRegressor 在大量样本上极慢或内存溢出**

原因:两者都要构造并分解 $n \times n$ 核矩阵，复杂度 $O(n^3)$。

解决:限制样本规模（几万以内），或改用 SGD、随机特征近似等方法。

**错误 2 · `predict` 未设 `return_std=True`，拿不到方差**

原因:GPR 默认只返回均值，方差需要显式请求。

解决:调用 `predict(X, return_std=True)`，同时接收均值与标准差。

**错误 3 · 优化核超参数时报 `ConvergenceWarning` 或结果很差**

原因:超参数初始值或边界不合理，或数据没有标准化。

解决:给定合适的 `bounds` 与初始值，先标准化数据，必要时调高优化迭代次数。

**错误 4 · 组合核写法错误，如把核当成普通函数调用**

原因:核对象之间的 `+`、`*`、`**` 是运算符重载，直接对核矩阵逐元素运算会得到错误结果或报错。

解决:用 `kernel1 + kernel2`、`kernel1 * kernel2` 组合，不要对核矩阵逐元素相乘。

**错误 5 · WhiteKernel 缺失导致预测结果异常平滑**

原因:没在核中显式建模噪声时，模型会把观测噪声当成信号，`length_scale` 等参数失真。

解决:观测有噪声时，把 `WhiteKernel` 加入核表达式。
