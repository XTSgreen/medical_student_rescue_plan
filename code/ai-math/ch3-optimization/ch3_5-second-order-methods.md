---
title: 3.5 二阶方法与拟牛顿法
sidebar:
  order: 5
---
# 3.5 二阶方法与拟牛顿法

3.3 与 3.4 节的方法只使用梯度：方向的选取由一阶信息决定，步长由线搜索或调度确定。本节引入曲率信息。有了曲率，迭代可以沿二次模型的实际最优点前进，条件数的影响被大幅削弱，收敛从线性升级为二次。

三种使用曲率的方式按代价递增排列。**牛顿法**使用精确的 Hessian，单步代价最高，收敛最快，适合中小规模问题与需要高精度的场景。**拟牛顿法**用梯度差分近似曲率（割线条件），保持每步 $O(n^2)$ 以下的代价，在中等规模问题上接近牛顿法的效率，L-BFGS 是工程中的默认选择。**高斯-牛顿法与 Levenberg-Marquardt** 针对残差平方和结构，用雅可比矩阵的乘积近似 Hessian，是非线性最小二乘的标准工具。**信赖域**与**共轭梯度**是配套的求解框架：前者同时确定方向与步长并对不定 Hessian 稳健，后者是求解大规模线性子问题的首选迭代方法。

## 3.5.1 牛顿法

### 二阶模型与牛顿方向

在点 $\mathbf{x}_k$ 处把 $f$ 展开到二阶：

$$
f(\mathbf{x}_k + \mathbf{p}) \approx f(\mathbf{x}_k) + \nabla f(\mathbf{x}_k)^T\mathbf{p} + \frac{1}{2}\mathbf{p}^T\nabla^2 f(\mathbf{x}_k)\mathbf{p}
$$

右侧是 $\mathbf{p}$ 的二次函数。若 Hessian 正定，它的唯一极小点为

$$
\mathbf{p}^{\text{NT}} = -\nabla^2 f(\mathbf{x}_k)^{-1}\nabla f(\mathbf{x}_k)
$$

这一方向称为**牛顿方向**（Newton direction），迭代 $\mathbf{x}_{k+1} = \mathbf{x}_k + \mathbf{p}^{\text{NT}}$ 称为牛顿法。二次函数上模型精确，牛顿法一步到最优，这是它强大之处的直接来源。

从预条件的角度读同一件事：牛顿方向满足 $\nabla^2 f(\mathbf{x}_k)\mathbf{p} = -\nabla f(\mathbf{x}_k)$，与梯度下降相比，方向被 Hessian 的逆修正。在 3.3 节的二次函数上，这一修正恰好把每个特征方向的更新因子变成零（$\mathbf{x} \leftarrow (\mathbf{I} - \mathbf{H}^{-1}\mathbf{Q})\mathbf{x} = \mathbf{0}$），条件数从更新公式中消失。牛顿法等价于自动完成了 3.3 节练习中的变量缩放，并且对一般非线性函数每一轮更新一次缩放。

### 局部二次收敛

牛顿法的收敛速率由以下结论刻画：$f$ 二阶连续可微、Hessian 在最优解邻域内 Lipschitz 连续、$\nabla^2 f(\mathbf{x}^*)$ 正定时，存在邻域使从该邻域内出发的牛顿迭代满足

$$
\|\mathbf{x}_{k+1} - \mathbf{x}^*\| \leq C\|\mathbf{x}_k - \mathbf{x}^*\|^2
$$

误差的平方级别收缩，称为**二次收敛**（quadratic convergence）。直观说法是有效数字的位数每步翻倍：误差 $10^{-3}$ 经两步到 $10^{-12}$。对比之下，梯度下降的误差按固定倍数收缩（线性收敛），加速方法在最优情形下也只有线性速率。3.5.5 节的共轭梯度与 3.4 节的拟牛顿法都介于两者之间：它们的收敛是超线性的，即每步的收缩因子趋于零，但没有二次收敛的保证。

二次收敛的前提是初值足够接近最优解。远离最优解时，牛顿方向可能指向糟糕的位置（Hessian 在大步长处与二次模型差距很大），甚至因为 Hessian 不定而不是下降方向。

### 全局化与修正

两种修正使牛顿法在全局范围内可用。

**阻尼牛顿法**（damped Newton）在方向后加线搜索：沿 $\mathbf{p}^{\text{NT}}$ 做回溯，只接受满足 Armijo 条件的步长。方向不是下降方向时（Hessian 不定的情形），改为沿负梯度方向或对 Hessian 做特征值修正：

$$
\mathbf{B} = \nabla^2 f(\mathbf{x}_k) + \tau\mathbf{I}, \qquad \tau \geq \max\left(0, -\lambda_{\min}(\nabla^2 f(\mathbf{x}_k))\right) + \epsilon
$$

加上 $\tau\mathbf{I}$ 后矩阵正定，方向重新成为下降方向。这一修正与 Levenberg-Marquardt 的阻尼是同一种思路。

**自协调性**给出全局收敛的定量分析。$f$ 自协调时（3.2 节），阻尼牛顿法分为两个阶段：远离最优解的阶段每步至少下降固定量，迭代次数有上界；进入邻域后切换到二次收敛阶段，步长约为 $1$。内点法（3.6 节）的复杂度分析就建立在自协调障碍函数的这一性质上。

### 代价

牛顿法每步需要组装 Hessian（$n^2$ 个元素，可能由 $O(n)$ 次梯度计算性质的运算得到）并求解线性系统（$O(n^3)$ 一般情形）。$n = 10^5$ 时 $n^3 = 10^{15}$ 次运算，不可行。大模型上使用牛顿法需要用矩阵的结构（稀疏、块状）或改用拟牛顿与截断牛顿（在 Krylov 子空间内近似求解牛顿方程，即 3.5.5 节的共轭梯度）。

## 3.5.2 拟牛顿法

### 割线方程

拟牛顿法用梯度差分构造曲率信息。定义

$$
\mathbf{s}_k = \mathbf{x}_{k+1} - \mathbf{x}_k, \qquad \mathbf{y}_k = \nabla f(\mathbf{x}_{k+1}) - \nabla f(\mathbf{x}_k)
$$

梯度变化与位移之间的关系由**割线方程**（secant equation）给出：

$$
\mathbf{B}_{k+1}\mathbf{s}_k = \mathbf{y}_k
$$

$\mathbf{B}_{k+1}$ 是对 Hessian 的近似。割线方程只约束 $\mathbf{B}_{k+1}$ 在一个方向上的作用，不唯一确定矩阵，因此不同选择导出不同算法。常用的构造方式是要求 $\mathbf{B}_{k+1}$ 离 $\mathbf{B}_k$ 最近（在加权 Frobenius 范数下）并满足割线方程，由此得到两个经典更新。

**DFP 更新**（对逆矩阵）：

$$
\mathbf{H}_{k+1} = \mathbf{H}_k - \frac{\mathbf{H}_k\mathbf{y}\mathbf{y}^T\mathbf{H}_k}{\mathbf{y}^T\mathbf{H}_k\mathbf{y}} + \frac{\mathbf{s}\mathbf{s}^T}{\mathbf{y}^T\mathbf{s}}
$$

**BFGS 更新**（对 $\mathbf{B}$ 矩阵，或对逆矩阵对称地写）：

$$
\mathbf{B}_{k+1} = \mathbf{B}_k - \frac{\mathbf{B}_k\mathbf{s}\mathbf{s}^T\mathbf{B}_k}{\mathbf{s}^T\mathbf{B}_k\mathbf{s}} + \frac{\mathbf{y}\mathbf{y}^T}{\mathbf{y}^T\mathbf{s}}
$$

BFGS 是四个提出者姓氏的首字母缩写，在实践中几乎完全取代了 DFP：两者互为对偶（交换 $\mathbf{s}$ 与 $\mathbf{y}$ 的角色），BFGS 对线搜索误差更宽容。**SR1 更新**（对称秩一）不加正定性约束：

$$
\mathbf{B}_{k+1} = \mathbf{B}_k + \frac{(\mathbf{y} - \mathbf{B}_k\mathbf{s})(\mathbf{y} - \mathbf{B}_k\mathbf{s})^T}{(\mathbf{y} - \mathbf{B}_k\mathbf{s})^T\mathbf{s}}
$$

它可以直接逼近不定的 Hessian（信赖域方法常用它），但需要谨慎处理分母接近零的情形。**Broyden 族**把上述更新写成凸组合参数化的连续族，DFP 与 BFGS 是其中两个端点。

### 性质

三条性质决定了 BFGS 的地位。

**保持正定**：只要 $\mathbf{y}_k^T\mathbf{s}_k > 0$，BFGS 更新后的矩阵保持正定。凸函数上这一条件由 Wolfe 线搜索保证（曲率条件正是 $\mathbf{y}^T\mathbf{s} > 0$ 的等价形式），这解释了 3.3 节为什么拟牛顿法要求 Wolfe 条件：Armijo 条件单独不能保证割线方程产生正定更新。

**超线性收敛**：在适当假设下 $\|\mathbf{x}_{k+1} - \mathbf{x}^*\| / \|\mathbf{x}_k - \mathbf{x}^*\| \to 0$，比线性收敛快、比二次收敛慢。用 $n$ 步割线信息可以重建完整 Hessian，这是超线性速率的来源。

**每步代价**：存储与更新 $n \times n$ 矩阵需要 $O(n^2)$ 内存与运算，求解方向需要 $O(n^3)$（或维护逆矩阵的 $O(n^2)$ 更新）。

### 有限内存：L-BFGS

$O(n^2)$ 的内存对 $n = 10^8$ 的参数不可接受，L-BFGS 只保留最近 $m$ 对 $(\mathbf{s}_i, \mathbf{y}_i)$（典型 $m = 5$ 到 $20$），用**两循环递归**（two-loop recursion）计算乘积 $\mathbf{B}_k^{-1}\mathbf{g}$：先按逆序对梯度做 $m$ 次修正得到中间量，再用初始尺度 $\gamma = \mathbf{s}^T\mathbf{y}/\mathbf{y}^T\mathbf{y}$ 缩放，最后按正序修正回来。整个过程的代价为 $O(mn)$ 内存与 $O(mn)$ 运算，与全矩阵版本相比把 $n$ 的二次依赖降为线性。

下列代码在同一逻辑回归问题上对比四种方法：牛顿法（精确 Hessian）、BFGS、L-BFGS 与梯度下降。判断标准是梯度范数降到 $10^{-8}$。

```python
import numpy as np

rng = np.random.default_rng(0)
n, d = 2000, 50
X = rng.normal(size=(n, d))
w_true = rng.normal(size=d)
p = 1 / (1 + np.exp(-X @ w_true))
y = (rng.random(n) < p).astype(float)
lam = 1e-3

def f(w):
    z = X @ w
    return float(np.mean(np.logaddexp(0, z) - y * z) + 0.5 * lam * w @ w)

def g(w):
    z = X @ w
    s = 1 / (1 + np.exp(-z))
    return X.T @ (s - y) / n + lam * w

def H(w):
    z = X @ w
    s = 1 / (1 + np.exp(-z))
    return (X * (s * (1 - s))[:, None]).T @ X / n + lam * np.eye(d)

L = np.linalg.eigvalsh(X.T @ X / (4 * n)).max() + lam
tol = 1e-8
print(f"L = {L:.4f}，m = {lam:.4f}，kappa = {L / lam:.0f}")

# 牛顿法（阻尼）
w = np.zeros(d); hist_n = []
for k in range(60):
    gg = g(w); hist_n.append(np.linalg.norm(gg))
    if hist_n[-1] < 1e-11:
        break
    p_dir = -np.linalg.solve(H(w), gg)
    t = 1.0
    while f(w + t * p_dir) > f(w) + 1e-4 * t * gg @ p_dir:
        t *= 0.5
    w = w + t * p_dir
print(f"牛顿法：{k} 步达到 1e-11")
print("  ||g|| 序列：" + "  ".join(f"{v:.2e}" for v in hist_n))

# BFGS
w = np.zeros(d); B = np.eye(d)
for k in range(500):
    gg = g(w)
    if np.linalg.norm(gg) < tol:
        break
    p_dir = -np.linalg.solve(B, gg)
    t = 1.0
    while f(w + t * p_dir) > f(w) + 1e-4 * t * gg @ p_dir:
        t *= 0.5
    w_new = w + t * p_dir
    s = w_new - w; yv = g(w_new) - gg
    if yv @ s > 1e-12:
        B = B - np.outer(B @ s, B @ s) / (s @ B @ s) + np.outer(yv, yv) / (yv @ s)
    w = w_new
print(f"BFGS：{k} 步达到 1e-8")

# L-BFGS（m = 5，两循环递归）
w = np.zeros(d); S_list, Y_list = [], []
for k in range(500):
    gg = g(w)
    if np.linalg.norm(gg) < tol:
        break
    q = gg.copy(); alphas = []
    for s, yv in zip(reversed(S_list), reversed(Y_list)):
        a = s @ q / (yv @ s); alphas.append(a); q = q - a * yv
    gamma = 1.0 if not S_list else (S_list[-1] @ Y_list[-1]) / (Y_list[-1] @ Y_list[-1])
    r_vec = gamma * q
    for (s, yv), a in zip(zip(S_list, Y_list), reversed(alphas)):
        b = yv @ r_vec / (yv @ s); r_vec = r_vec + s * (a - b)
    p_dir = -r_vec
    t = 1.0
    while f(w + t * p_dir) > f(w) + 1e-4 * t * gg @ p_dir:
        t *= 0.5
    w_new = w + t * p_dir
    s = w_new - w; yv = g(w_new) - gg
    if yv @ s > 1e-12:
        S_list.append(s); Y_list.append(yv)
        if len(S_list) > 5:
            S_list.pop(0); Y_list.pop(0)
    w = w_new
print(f"L-BFGS（m = 5）：{k} 步达到 1e-8")

# 梯度下降
w = np.zeros(d)
for k in range(200000):
    gg = g(w)
    if np.linalg.norm(gg) < tol:
        break
    w = w - (1 / L) * gg
print(f"梯度下降（步长 1/L）：{k} 步达到 1e-8")
```

输出：

```text
L = 0.3355，m = 0.0010，kappa = 335
牛顿法：9 步达到 1e-11
  ||g|| 序列：3.83e-01  1.12e-01  4.19e-02  1.36e-02  2.85e-03  1.93e-04  1.01e-06  2.68e-11  1.34e-11  4.40e-17
BFGS：95 步达到 1e-8
L-BFGS（m = 5）：20 步达到 1e-8
梯度下降（步长 1/L）：584 步达到 1e-8
```

牛顿法的梯度序列展示了两个阶段：前四步按约 $0.3$ 的因子收缩（阻尼阶段，步长受线搜索限制），之后收缩急剧加速：$1.93 \times 10^{-4} \to 1.01 \times 10^{-6} \to 2.68 \times 10^{-11}$，相邻两段的比值 $2.68 \times 10^{-11} / (1.01 \times 10^{-6})^2 \approx 26$ 是一个与迭代步数无关的常数，这正是二次收敛的特征（$\|\mathbf{g}_{k+1}\| \leq C\|\mathbf{g}_k\|^2$）。L-BFGS 用 $5$ 对向量的内存达到 $20$ 步，与牛顿法的差距在迭代数上是两倍多，在单步代价上是数量级。BFGS 在本例中用了 $95$ 步，慢于 L-BFGS，原因是这里的线搜索只检查 Armijo 条件：曲率信息质量下降导致更新矩阵变差。标准实现使用满足 Wolfe 条件的线搜索，两者的迭代数会接近。

## 3.5.3 高斯-牛顿与 Levenberg-Marquardt

### 非线性最小二乘的结构

很多问题的目标函数是残差平方和：

$$
f(\mathbf{x}) = \frac{1}{2}\|\mathbf{r}(\mathbf{x})\|^2 = \frac{1}{2}\sum_{i=1}^{m} r_i(\mathbf{x})^2
$$

其中 $\mathbf{r}: \R^n \to \R^m$ 是残差向量（拟合问题中 $m$ 是数据点数）。梯度与 Hessian 有显式结构：

$$
\nabla f = \mathbf{J}^T\mathbf{r}, \qquad \nabla^2 f = \mathbf{J}^T\mathbf{J} + \sum_{i=1}^{m} r_i\nabla^2 r_i
$$

$\mathbf{J}$ 是残差的雅可比矩阵，第 $i$ 行是 $\nabla r_i(\mathbf{x})^T$。**高斯-牛顿法**（Gauss-Newton）丢弃第二项，用 $\mathbf{J}^T\mathbf{J}$ 近似 Hessian：

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \left(\mathbf{J}^T\mathbf{J}\right)^{-1}\mathbf{J}^T\mathbf{r}
$$

丢弃项的合理性有两种情形：残差本身接近零（拟合良好，$r_i$ 小）或残差接近线性（$\nabla^2 r_i$ 小）。前者是收敛后期的主要情形，因此高斯-牛顿在接近最优解时近似牛顿法，收敛快；远离最优解时近似的误差大，步长可能极端。

### 阻尼与自适应

**Levenberg-Marquardt 方法**（LM）在法方程中加入阻尼：

$$
\left(\mathbf{J}^T\mathbf{J} + \lambda\mathbf{I}\right)\mathbf{p} = -\mathbf{J}^T\mathbf{r}, \qquad \mathbf{x}_{k+1} = \mathbf{x}_k + \mathbf{p}
$$

$\lambda$ 很大时方向趋向负梯度方向（步长小，稳健），$\lambda$ 很小时接近高斯-牛顿（非线性区域外收敛快）。$\lambda$ 的调整由增益比驱动：

$$
\rho = \frac{f(\mathbf{x}_k) - f(\mathbf{x}_k + \mathbf{p})}{m_k(\mathbf{0}) - m_k(\mathbf{p})}
$$

分母是二次模型预测的下降量。$\rho$ 接近 $1$ 说明模型与函数一致，减小 $\lambda$（加速）；$\rho$ 小或为负说明模型不可靠，增大 $\lambda$（保守）。这一机制与 3.5.4 节信赖域半径的更新规则完全同构：$\lambda$ 与信赖域半径 $\Delta$ 成反比，LM 是信赖域思想在最小二乘上的特例。

下列代码用同一个指数衰减曲线的拟合任务对比两种方法：高斯-牛顿从好初值出发收敛很快，从坏初值出发失败；LM 从同样的坏初值出发收敛。

```python
import numpy as np

rng = np.random.default_rng(1)
xs = np.linspace(0, 1, 200)
y_obs = 2.0 * np.exp(-3.0 * xs) + 0.05 * rng.normal(size=xs.size)

def resid(t):                     # 残差 r = a exp(b x) - y
    return t[0] * np.exp(t[1] * xs) - y_obs

def jac(t):                       # 雅可比：对 a 与 b 的偏导
    e = np.exp(t[1] * xs)
    return np.stack([e, t[0] * xs * e], axis=1)

def loss(t):
    r = resid(t)
    return 0.5 * float(r @ r)

# 高斯-牛顿：好初值
t = np.array([1.8, -2.5])
for k in range(60):
    r = resid(t); J = jac(t)
    step = np.linalg.solve(J.T @ J, -J.T @ r)
    t = t + step
    if np.linalg.norm(step) < 1e-12:
        break
print(f"高斯-牛顿（初值 a=1.8, b=-2.5）：{k} 步收敛到 a = {t[0]:.4f}, b = {t[1]:.4f}，损失 = {loss(t):.4e}")

# 高斯-牛顿：坏初值
t = np.array([0.1, -5.0])
traj = []
for k in range(60):
    traj.append(loss(t))
    r = resid(t); J = jac(t)
    step = np.linalg.solve(J.T @ J, -J.T @ r)
    t = t + step
    if not np.all(np.isfinite(t)):
        break
print(f"高斯-牛顿（初值 a=0.1, b=-5）：{k} 步后损失轨迹前 3 项 = {['%.2e' % v for v in traj[:3]]}")
print(f"  最终参数 a = {t[0]:.4f}, b = {t[1]:.4f}，损失 = {loss(t):.2e}（陷入退化解）")

# Levenberg-Marquardt：同样的坏初值
t = np.array([0.1, -5.0]); lam = 1e-3
for k in range(200):
    r = resid(t); J = jac(t)
    step = np.linalg.solve(J.T @ J + lam * np.eye(2), -J.T @ r)
    if loss(t + step) < loss(t):
        t = t + step
        lam = max(lam * 0.3, 1e-12)
        if np.linalg.norm(step) < 1e-12:
            break
    else:
        lam *= 5.0
print(f"LM（同样的坏初值）：{k} 步收敛到 a = {t[0]:.4f}, b = {t[1]:.4f}，损失 = {loss(t):.4e}")
# 真值 a = 2, b = -3；噪声标准差 0.05 时最优损失期望约 0.25
```

输出：

```text
高斯-牛顿（初值 a=1.8, b=-2.5）：5 步收敛到 a = 2.0049, b = -3.0299，损失 = 2.1313e-01
高斯-牛顿（初值 a=0.1, b=-5）：2 步后损失轨迹前 3 项 = ['6.21e+01', '5.55e+48', '6.71e+01']
  最终参数 a = 0.0000, b = 55.4007，损失 = 6.71e+01（陷入退化解）
LM（同样的坏初值）：12 步收敛到 a = 2.0049, b = -3.0299，损失 = 2.1313e-01
```

好初值下高斯-牛顿 $5$ 步收敛到正确的参数，损失 $0.213$ 与噪声水平相符（$200$ 个点、噪声标准差 $0.05$ 时残差平方和的期望约为 $0.25$）。坏初值下高斯-牛顿的第二步把损失推到 $10^{48}$ 量级，之后退化到 $a = 0$、$b = 55.4$ 的平凡解（$a \to 0$ 时曲线趋于零，损失只由数据项贡献）。LM 在同样起点上用阻尼限制了步长，$12$ 步收敛到与好初值相同的解。最小二乘拟合、Bundle Adjustment 与 SLAM 中的优化都使用 LM 或它的变体，原因正是这种稳健性。

## 3.5.4 信赖域方法

### 子问题

线搜索先定方向再找步长；**信赖域方法**（trust region）同时确定两者。它维护一个半径 $\Delta_k$，在当前点的二次模型可信的范围内求极小：

$$
\min_{\mathbf{p}} \ m_k(\mathbf{p}) = f(\mathbf{x}_k) + \nabla f(\mathbf{x}_k)^T\mathbf{p} + \frac{1}{2}\mathbf{p}^T\mathbf{B}_k\mathbf{p}, \qquad \text{s.t.} \ \|\mathbf{p}\| \leq \Delta_k
$$

$\mathbf{B}_k$ 可以是精确 Hessian、拟牛顿近似（SR1、BFGS）或 $\mathbf{J}^T\mathbf{J}$。子问题的解有清晰的结构：存在 $\lambda \geq 0$ 使

$$
(\mathbf{B}_k + \lambda\mathbf{I})\mathbf{p} = -\nabla f(\mathbf{x}_k), \qquad \lambda(\Delta_k - \|\mathbf{p}\|) = 0, \qquad \mathbf{B}_k + \lambda\mathbf{I} \succeq 0
$$

$\lambda = 0$ 对应内部解（无约束牛顿步落在半径内），$\lambda > 0$ 对应边界解。这一形式与 LM 的阻尼方程一致，两者是同一问题的不同参数化。

### 柯西点、狗腿法与 Steihaug-CG

子问题很少精确求解，常用的近似解有三个层次。

**柯西点**（Cauchy point）沿负梯度方向做截断的一维最小化：

$$
\mathbf{p}^C = -t^*\nabla f(\mathbf{x}_k), \qquad t^* = \min\left(\frac{\|\nabla f\|^2}{\nabla f^T\mathbf{B}_k\nabla f}, \ \frac{\Delta_k}{\|\nabla f\|}\right)
$$

它是子问题的最简单可行近似，代价只有两次矩阵乘法，并且给出模型下降量的保证：$m_k(\mathbf{0}) - m_k(\mathbf{p}^C) \geq \frac{1}{2}\|\nabla f\|\min\left(\Delta_k, \frac{\|\nabla f\|}{\|\mathbf{B}_k\|}\right)$。全局收敛性的证明正是建立在这一下降量上：只要每步的下降量与梯度范数成正比，迭代就能到达驻点。

**狗腿法**（dogleg）在柯西点与高斯-牛顿步之间连一条折线，取折线与信赖域边界的交点。它在两个端点都不精确时给出折衷，适合 $\mathbf{B}_k$ 正定的情形。

**Steihaug-CG** 用共轭梯度在 Krylov 子空间内近似求解子问题，遇到负曲率方向（$\mathbf{p}^T\mathbf{B}\mathbf{p} \leq 0$）或超出半径时沿该方向走到边界。它适合大规模问题，代价与 CG 相当。

### 半径更新

每步计算增益比 $\rho_k = \frac{f(\mathbf{x}_k) - f(\mathbf{x}_k + \mathbf{p}_k)}{m_k(\mathbf{0}) - m_k(\mathbf{p}_k)}$，再按它调整半径。$\rho_k$ 接近 $1$（模型准确）：接受步长并扩大半径（如 $\Delta \leftarrow 2\Delta$）；$\rho_k$ 为正但偏小：接受步长，半径不变或略减；$\rho_k$ 很小或为负：拒绝步长并缩小半径（如 $\Delta \leftarrow \Delta/2$）。拒绝步长只浪费一次子问题的求解，迭代点不动，这一保守机制使信赖域方法对不定的 Hessian 与糟糕的模型天然稳健，不需要线搜索中的下降方向前提。

下列代码在同一个问题里对比柯西点与信赖域子问题的精确解，说明近似解的位置与质量。

```python
import numpy as np

rng = np.random.default_rng(3)
B = rng.normal(size=(5, 5))
B = B @ B.T + 0.5 * np.eye(5)          # 正定矩阵
gv = rng.normal(size=5)
Delta = 1.0
m = lambda p: gv @ p + 0.5 * p @ B @ p

# 柯西点：沿 -g 的截断一维最小化
t_c = (gv @ gv) / (gv @ B @ gv)
if t_c * np.linalg.norm(gv) > Delta:
    t_c = Delta / np.linalg.norm(gv)
p_C = -t_c * gv
print(f"柯西点：t* = {t_c:.6f}，||p_C|| = {np.linalg.norm(p_C):.6f}，模型值 m(p_C) = {m(p_C):.6f}")

# 精确解：对 (B + lambda I) p = -g 扫描 lambda
eigvals = np.linalg.eigvalsh(B)
best = None
for lam in np.linspace(0, 20, 200001):
    p = -np.linalg.solve(B + lam * np.eye(5), gv)
    if np.linalg.norm(p) <= Delta:
        best = p
        break
print(f"信赖域精确解：||p*|| = {np.linalg.norm(best):.6f}，模型值 m(p*) = {m(best):.6f}")
print(f"柯西点完成的模型下降占比 = {m(p_C) / m(best) * 100:.1f}%")
# 柯西点位于信赖域边界上（本例中 t* 被半径截断），模型下降约为精确解的 27%
```

输出：柯西点位于信赖域边界（$\|\mathbf{p}^C\| = 1$），模型值 $-0.208748$；精确解在边界内，模型值 $-0.770440$；柯西点完成了精确解下降量的 $27.1\%$。这一对比说明柯西点代价低但质量有限，而它的价值在于下降量的保证：$27\%$ 的比例在最坏情形下有下界，足以支撑全局收敛性证明。实际实现通常取柯西点作为起点或下界，再用狗腿法或 Steihaug-CG 改进。

## 3.5.5 共轭梯度法

### 线性共轭梯度

求解线性系统 $\mathbf{A}\mathbf{x} = \mathbf{b}$（$\mathbf{A}$ 对称正定）等价于最小化二次函数 $\frac{1}{2}\mathbf{x}^T\mathbf{A}\mathbf{x} - \mathbf{b}^T\mathbf{x}$。共轭梯度法（conjugate gradient，CG）沿一组 $\mathbf{A}$-共轭方向（$\mathbf{p}_i^T\mathbf{A}\mathbf{p}_j = 0$，$i \neq j$）生成迭代：

$$
\alpha_k = \frac{\mathbf{r}_k^T\mathbf{r}_k}{\mathbf{p}_k^T\mathbf{A}\mathbf{p}_k}, \qquad
\mathbf{x}_{k+1} = \mathbf{x}_k + \alpha_k\mathbf{p}_k, \qquad
\mathbf{p}_{k+1} = \mathbf{r}_{k+1} + \frac{\mathbf{r}_{k+1}^T\mathbf{r}_{k+1}}{\mathbf{r}_k^T\mathbf{r}_k}\mathbf{p}_k
$$

其中 $\mathbf{r}_k = \mathbf{b} - \mathbf{A}\mathbf{x}_k$ 是残差。由于共轭方向在 $n$ 维空间中最多 $n$ 个线性无关，精确算术下 CG 在 $n$ 步内给出精确解；浮点运算下这一性质不严格成立，但收敛仍然很快。

收敛速率的界为

$$
\|\mathbf{x}_k - \mathbf{x}^*\|_{\mathbf{A}} \leq 2\left(\frac{\sqrt{\kappa} - 1}{\sqrt{\kappa} + 1}\right)^k \|\mathbf{x}_0 - \mathbf{x}^*\|_{\mathbf{A}}
$$

迭代次数为 $O(\sqrt{\kappa}\log(1/\epsilon))$，与梯度下降的 $O(\kappa\log(1/\epsilon))$ 相比，条件数的依赖从 $\kappa$ 降到 $\sqrt{\kappa}$。这一速率与 3.4.2 节加速方法的速率形式相同，两者在思想上也有联系：它们都通过利用历史信息突破单步梯度法的限制，区别是 CG 面向二次函数（线性系统），加速方法面向一般凸函数。

### 非线性共轭梯度与信赖域中的应用

非线性问题上的共轭梯度用线搜索确定步长，方向由以下递推给出：

$$
\mathbf{p}_{k+1} = -\nabla f(\mathbf{x}_{k+1}) + \beta_k\mathbf{p}_k
$$

$\beta_k$ 的取法有 Fletcher-Reeves（$\frac{\|\nabla f_{k+1}\|^2}{\|\nabla f_k\|^2}$）与 Polak-Ribiere（$\frac{\nabla f_{k+1}^T(\nabla f_{k+1} - \nabla f_k)}{\|\nabla f_k\|^2}$）等版本，后者在实践中对非二次函数更稳健（在近似的共轭性失效时自动重启）。非线性 CG 的存储为 $O(n)$，每步只需一次梯度计算，适合大规模问题；代价是需要较精确的线搜索，收敛速率一般在 $O(n)$ 步内呈超线性行为，没有二次收敛。

CG 的另一个角色是作为信赖域子问题（3.5.4 节）与截断牛顿法的内层求解器：牛顿方程 $\mathbf{H}\mathbf{p} = -\mathbf{g}$ 用几十步 CG 近似求解，配合早停（截断）得到近似牛顿方向，代价从 $O(n^3)$ 降到 $O(mn)$。这一组合（Newton-CG）是大规模二阶方法的基本形态。

下列代码在条件数 $10^3$ 的对称正定系统上对比 CG 与梯度下降的迭代次数。

```python
import numpy as np

rng = np.random.default_rng(2)
n_cg = 100
U, _ = np.linalg.qr(rng.normal(size=(n_cg, n_cg)))
eigs = np.logspace(0, 3, n_cg)                 # 特征值从 1 到 1000
Q = U @ np.diag(eigs) @ U.T
Q = 0.5 * (Q + Q.T)
b = rng.normal(size=n_cg)

# 共轭梯度
x = np.zeros(n_cg)
r = b - Q @ x
pv = r.copy()
rs = r @ r
res = [np.sqrt(rs) / np.linalg.norm(b)]
for k in range(1, 1000):
    Ap = Q @ pv
    alpha = rs / (pv @ Ap)
    x = x + alpha * pv
    r = r - alpha * Ap
    rs_new = r @ r
    res.append(np.sqrt(rs_new) / np.linalg.norm(b))
    if res[-1] < 1e-8:
        break
    pv = r + (rs_new / rs) * pv
    rs = rs_new
print(f"kappa = {eigs.max() / eigs.min():.0f}，维度 {n_cg}")
print(f"CG：{k} 步使相对残差降到 1e-8（理论量级 0.5 sqrt(kappa) log(2/tol) = {0.5 * np.sqrt(1000) * np.log(2 / 1e-8):.0f}）")

# 梯度下降
x = np.zeros(n_cg)
for k in range(1000000):
    r = Q @ x - b
    if np.linalg.norm(r) / np.linalg.norm(b) < 1e-8:
        break
    x = x - (1.0 / eigs.max()) * r
print(f"梯度下降（步长 1/L）：{k} 步")
```

输出：

```text
kappa = 1000，维度 100
CG：169 步使相对残差降到 1e-8（理论量级 0.5 sqrt(kappa) log(2/tol) = 302）
梯度下降（步长 1/L）：16077 步
```

CG 用 $169$ 步达到梯度下降需要 $16077$ 步的精度，约为后者的百分之一。CG 的实际步数低于理论界 $302$，因为特征值在对数尺度上均匀分布，中间谱段被 CG 的 Krylov 子空间快速覆盖；界针对最坏情形（谱集中在两端）。两个方法都不需要知道 $\kappa$，CG 也不用矩阵的元素，只通过矩阵-向量乘积访问 $\mathbf{Q}$，这是它能用于大规模问题的原因。

## 3.5.6 本节小结

::: success 曲率的三种用法
本节按使用曲率的方式组织了二阶方法。牛顿法用精确 Hessian，方向是二次模型的最优解，局部二次收敛（误差每步平方收缩），代价是 $O(n^3)$ 的线性求解；阻尼与 Hessian 修正使它全局可用，自协调性给出两阶段复杂度分析。拟牛顿法用割线方程近似曲率，BFGS 更新在 $\mathbf{y}^T\mathbf{s} > 0$ 时保持正定并实现超线性收敛，L-BFGS 用 $m$ 对向量把内存与单步代价降到 $O(mn)$，是工程默认选择；数值实验显示牛顿法 $9$ 步、L-BFGS $20$ 步、梯度下降 $584$ 步，二次收敛的证据是梯度范数的平方级收缩。高斯-牛顿法利用残差平方和的结构，用 $\mathbf{J}^T\mathbf{J}$ 近似 Hessian，$(\mathbf{J}^T\mathbf{J} + \lambda\mathbf{I})\mathbf{p} = -\mathbf{J}^T\mathbf{r}$ 的阻尼形式即 Levenberg-Marquardt，$\lambda$ 由增益比自适应调整，数值实验展示了它在坏初值下避免高斯-牛顿的失效。信赖域方法同时确定方向与步长，子问题解满足 $(\mathbf{B} + \lambda\mathbf{I})\mathbf{p} = -\mathbf{g}$ 与互补条件，柯西点以两次矩阵乘法的代价提供模型下降量的下界（本例中为精确解的 $27\%$），狗腿法与 Steihaug-CG 在此基础上改进。共轭梯度用 Krylov 子空间把条件数依赖从 $\kappa$ 降到 $\sqrt{\kappa}$，既用于线性系统（本例 $169$ 步对梯度下降的 $16077$ 步），也作为截断牛顿与信赖域的内层求解器。
:::

二阶方法到此完成。它们与一阶方法共享同一个光滑性框架，区别只在曲率信息的来源与代价。下一节换上另一类工具：约束优化与对偶理论，那里需要 3.2 节的分离定理与共轭函数，最优性条件从梯度为零升级为 KKT 系统，而对偶问题把约束处理转化为无约束问题，在内点法与分解算法中反复使用。

## 练习题

### 第 1 题 概念推导

$f$ 二阶连续可微，$\mathbf{x}^*$ 满足 $\nabla f(\mathbf{x}^*) = \mathbf{0}$ 且 $\nabla^2 f(\mathbf{x}^*)$ 正定。推导牛顿迭代的误差递推，证明二次收敛，并说明为什么收敛常数与 Hessian 的 Lipschitz 常数成正比；再说明初值离最优解较远时这一推导为什么失效。

::: details 参考答案
**误差递推**：记 $\mathbf{g}_k = \nabla f(\mathbf{x}_k)$、$\mathbf{H}_k = \nabla^2 f(\mathbf{x}_k)$，牛顿迭代为 $\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}_k^{-1}\mathbf{g}_k$。对 $\mathbf{g}_k$ 在 $\mathbf{x}^*$ 处展开（$\mathbf{g}(\mathbf{x}^*) = \mathbf{0}$）：

$$
\mathbf{g}_k = \mathbf{g}_k - \mathbf{g}(\mathbf{x}^*) = \mathbf{H}(\boldsymbol{\xi})\,(\mathbf{x}_k - \mathbf{x}^*)
$$

其中 $\boldsymbol{\xi}$ 位于 $\mathbf{x}_k$ 与 $\mathbf{x}^*$ 之间（积分形式的均值定理）。代入迭代：

$$
\mathbf{x}_{k+1} - \mathbf{x}^* = \mathbf{x}_k - \mathbf{x}^* - \mathbf{H}_k^{-1}\mathbf{g}_k = \left(\mathbf{I} - \mathbf{H}_k^{-1}\mathbf{H}(\boldsymbol{\xi})\right)(\mathbf{x}_k - \mathbf{x}^*)
$$

用 $\mathbf{H}_k^{-1}$ 提出 $\mathbf{H}_k$：$\mathbf{I} - \mathbf{H}_k^{-1}\mathbf{H}(\boldsymbol{\xi}) = \mathbf{H}_k^{-1}\left(\mathbf{H}_k - \mathbf{H}(\boldsymbol{\xi})\right)$，于是

$$
\|\mathbf{x}_{k+1} - \mathbf{x}^*\| \leq \|\mathbf{H}_k^{-1}\|\,\|\mathbf{H}_k - \mathbf{H}(\boldsymbol{\xi})\|\,\|\mathbf{x}_k - \mathbf{x}^*\|
$$

**二次收敛**：Hessian 以常数 $M$ Lipschitz 连续时 $\|\mathbf{H}_k - \mathbf{H}(\boldsymbol{\xi})\| \leq M\|\mathbf{x}_k - \boldsymbol{\xi}\| \leq M\|\mathbf{x}_k - \mathbf{x}^*\|$，而 $\|\mathbf{H}_k^{-1}\|$ 在最优解邻域内被 $1/m$ 界住（$m$ 为最小特征值的下界），因此

$$
\|\mathbf{x}_{k+1} - \mathbf{x}^*\| \leq \frac{M}{m}\|\mathbf{x}_k - \mathbf{x}^*\|^2
$$

收敛常数与 $M/m$ 成正比：Hessian 变化越快（非线性越强），邻域越小、常数越大。

**远处的失效**：推导用了三个局部性质：Hessian 的可逆性与 $1/m$ 的界（远处 Hessian 可能奇异或不定）、Hessian 的 Lipschitz 界（步长较大时失效）、以及展开点的接近性。任何一条不成立，二次收敛的结论都不适用；严重时牛顿方向本身不再保证下降。这正是需要阻尼与信赖域的原因。
:::

### 第 2 题 计算推理

$f(x_1, x_2) = e^{x_1 + 3x_2 - 0.1} + e^{x_1 - 3x_2 - 0.1} + e^{-x_1 - 0.1}$。求最优解与最优值；写出该函数的梯度与 Hessian 的结构（说明为什么它是 log-sum-exp 型函数），计算最优解处的 Hessian 与条件数；判断牛顿法从 $(0, 0)$ 出发需要几步（给出理由），并说明这个问题上梯度下降为什么慢。

::: details 参考答案
**最优解**：这是三个指数的加权和（对数配分函数的形式，权重为常数的相反数向量）：
$f(\mathbf{x}) = \sum_{i} e^{\mathbf{a}_i^T\mathbf{x} + b_i}$，其中 $\mathbf{a}_1 = (1, 3)$、$\mathbf{a}_2 = (1, -3)$、$\mathbf{a}_3 = (-1, 0)$，$b_i = -0.1$。极小值在梯度为零处，权重 $p_i = e^{\mathbf{a}_i^T\mathbf{x} + b_i}$ 归一化后满足 $\sum_i p_i\mathbf{a}_i = \mathbf{0}$（期望为零）。由对称性 $x_2 = 0$；由前两个向量与第三个向量的平衡：$2p_1 = p_3$ 与 $p_1 = p_2$。设 $p_1 = p_2 = s$、$p_3 = 2s$，共 $4s = 1$，得 $s = 1/4$。由 $e^{x_1 + 3x_2 - 0.1} = 1/4$ 与 $x_2 = 0$ 得 $x_1 = 0.1 + \log(1/4) = 0.1 - 2\log 2 \approx -1.2863$。最优值 $f^* = \sum_i p_i = 1$（按归一化条件，$\log\sum e^{\cdot}$ 的最小值为 $\sum p_i = 1$）。

**梯度与 Hessian**：与 log-sum-exp 相同结构，梯度为 $\sum_i p_i\mathbf{a}_i$，Hessian 为 $\sum_i p_i\mathbf{a}_i\mathbf{a}_i^T - (\sum_i p_i\mathbf{a}_i)(\sum_i p_i\mathbf{a}_i)^T$，即加权协方差矩阵。最优解处期望为零，Hessian 简化为 $\sum_i p_i\mathbf{a}_i\mathbf{a}_i^T = \frac{1}{4}(\mathbf{a}_1\mathbf{a}_1^T + \mathbf{a}_2\mathbf{a}_2^T + 2\mathbf{a}_3\mathbf{a}_3^T)$，代入得 $H = \frac{1}{4}\begin{pmatrix} 1+1+2 & 3-3 \\ 3-3 & 9+9 \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 4.5 \end{pmatrix}$。

**条件数**：$\kappa = 4.5$。

**牛顿法步数**：函数是指数的和，非二次，但 $\kappa$ 小且在最优解附近近似良好，从 $(0,0)$ 出发牛顿法约 $5$ 至 $8$ 步到高精度（阻尼可保证每步下降）。梯度下降的速率因子为 $1 - m/L = 1 - 1/4.5 \approx 0.78$，达到 $10^{-8}$ 需要约 $\log(10^{-8})/\log(0.78) \approx 75$ 步，慢在条件数与曲率上：函数在 $x_2$ 方向曲率是 $x_1$ 方向的 $4.5$ 倍，梯度下降无法同时适应两个方向。
:::

### 第 3 题 代码验证

用 3.5.2 与 3.5.3 节的代码框架完成两个实验并解释：其一，把 L-BFGS 的内存 $m$ 分别取 $1$、$5$、$20$，观察在 3.5.2 节的逻辑回归问题上达到 $10^{-8}$ 的迭代次数与 $m$ 的关系；其二，在 3.5.3 节的指数拟合中，把 LM 的初始 $\lambda$ 分别取 $10^{-6}$、$10^{-3}$、$1$，观察收敛步数与最终结果，说明 $\lambda$ 初值的作用。给出代码、输出与结论。

::: details 参考答案
```python
import numpy as np

# 实验一：L-BFGS 的 m 与迭代次数
rng = np.random.default_rng(0)
n, d = 2000, 50
X = rng.normal(size=(n, d))
w_true = rng.normal(size=d)
p_true = 1 / (1 + np.exp(-X @ w_true))
y = (rng.random(n) < p_true).astype(float)
lam = 1e-3

def f(w):
    z = X @ w
    return float(np.mean(np.logaddexp(0, z) - y * z) + 0.5 * lam * w @ w)

def g(w):
    z = X @ w
    s = 1 / (1 + np.exp(-z))
    return X.T @ (s - y) / n + lam * w

def lbgfs(m_mem):
    w = np.zeros(d); S_list, Y_list = [], []
    for k in range(2000):
        gg = g(w)
        if np.linalg.norm(gg) < 1e-8:
            return k
        q = gg.copy(); alphas = []
        for s, yv in zip(reversed(S_list), reversed(Y_list)):
            a = s @ q / (yv @ s); alphas.append(a); q = q - a * yv
        gamma = 1.0 if not S_list else (S_list[-1] @ Y_list[-1]) / (Y_list[-1] @ Y_list[-1])
        r_vec = gamma * q
        for (s, yv), a in zip(zip(S_list, Y_list), reversed(alphas)):
            b = yv @ r_vec / (yv @ s); r_vec = r_vec + s * (a - b)
        p_dir = -r_vec
        t = 1.0
        while f(w + t * p_dir) > f(w) + 1e-4 * t * gg @ p_dir:
            t *= 0.5
        w_new = w + t * p_dir
        s = w_new - w; yv = g(w_new) - gg
        if yv @ s > 1e-12:
            S_list.append(s); Y_list.append(yv)
            if len(S_list) > m_mem:
                S_list.pop(0); Y_list.pop(0)
        w = w_new
    return None

for m_mem in [1, 5, 20]:
    print(f"L-BFGS（m = {m_mem}）：{lbgfs(m_mem)} 步达到 1e-8")

# 实验二：LM 的初始 lambda
rng = np.random.default_rng(1)
xs = np.linspace(0, 1, 200)
y_obs = 2.0 * np.exp(-3.0 * xs) + 0.05 * rng.normal(size=xs.size)

resid = lambda t: t[0] * np.exp(t[1] * xs) - y_obs
def jac(t):
    e = np.exp(t[1] * xs)
    return np.stack([e, t[0] * xs * e], axis=1)
loss = lambda t: 0.5 * float(resid(t) @ resid(t))

for lam0 in [1e-6, 1e-3, 1.0]:
    t = np.array([0.1, -5.0]); lam = lam0; prev = loss(t)
    for k in range(300):
        r = resid(t); J = jac(t)
        step = np.linalg.solve(J.T @ J + lam * np.eye(2), -J.T @ r)
        new_loss = loss(t + step)
        if new_loss < prev:
            t = t + step; lam = max(lam * 0.3, 1e-12)
            if prev - new_loss < 1e-13 * max(1.0, prev):
                break
            prev = new_loss
        else:
            lam *= 5.0
    print(f"LM（lambda0 = {lam0:.0e}）：{k} 步，a = {t[0]:.4f}，b = {t[1]:.4f}，损失 = {loss(t):.4e}")
```

输出：

```text
L-BFGS（m = 1）：42 步达到 1e-8
L-BFGS（m = 5）：20 步达到 1e-8
L-BFGS（m = 20）：18 步达到 1e-8
LM（lambda0 = 1e-06）：13 步，a = 2.0049，b = -3.0299，损失 = 2.1313e-01
LM（lambda0 = 1e-03）：7 步，a = 2.0049，b = -3.0299，损失 = 2.1313e-01
LM（lambda0 = 1e+00）：5 步，a = 2.0049，b = -3.0299，损失 = 2.1313e-01
```

**结论**：内存 $m$ 决定 L-BFGS 携带的曲率信息量。$m = 1$ 时只有最近一对向量，接近带缩放的梯度法，步数从 $20$ 增到 $42$；$m$ 从 $5$ 增到 $20$ 只把步数从 $20$ 降到 $18$，收益递减而内存与单步代价线性增长。工程中 $m = 10$ 附近是常见折衷。

LM 的初始 $\lambda$ 影响起步路径，不影响结果：三种初值都收敛到相同的参数与损失（自适应更新最终把 $\lambda$ 调整到相同的区间），步数分别为 $13$、$7$、$5$。步数随 $\lambda_0$ 增大而略减，原因是本例的坏初值下高斯-牛顿步本身过激：$\lambda_0$ 很小（$10^{-6}$）时前几步接近高斯-牛顿，走了弯路；$\lambda_0 = 1$ 时前几步接近小步长梯度下降，路径更稳。这一对比说明阻尼参数的作用是控制起步的保守程度，收敛后的行为由自适应机制决定。
:::

### 第 4 题 综合应用

某团队要为一个三维重建系统实现 Bundle Adjustment：优化变量是若干相机位姿与三维点坐标（合计 $10^6$ 量级），目标函数是重投影误差的平方和（残差个数 $10^7$ 量级），雅可比矩阵稀疏（每个残差只涉及一个相机与一个点）。请给出一个可行的优化方案：选择方法（LM、信赖域、牛顿、L-BFGS 中的哪一个）、子问题的求解方式、稀疏结构的利用方式与收敛判据；说明每步的复杂度量级；并指出方案中需要监控的两个数值风险。

::: details 参考答案
**方法选择**：目标函数是残差平方和，结构上适合 Levenberg-Marquardt。理由：残差来自几何投影，非线性中等，初值通常由其他流程（特征匹配、三角化）给出，离最优解不远；LM 的阻尼在残差大的区域提供稳健性，在收敛后期退化为高斯-牛顿，享受二次收敛。牛顿法需要完整的 Hessian 且对不定矩阵敏感，$10^6$ 变量下 $O(n^3)$ 求解不可行；L-BFGS 只用梯度，收敛往往需要更多迭代，对高精度要求的 BA 不经济。

**子问题求解**：LM 每步解 $(\mathbf{J}^T\mathbf{J} + \lambda\mathbf{I})\mathbf{p} = -\mathbf{J}^T\mathbf{r}$。直接求逆不可行，用稀疏 Cholesky 分解或预条件共轭梯度（PCG）迭代求解。前者的复杂度约为 $O(n^{1.5})$ 量级（对稀疏矩阵），后者每步代价为若干次矩阵-向量乘积，外层再用 CG 的截断（几十步）控制精度。

**稀疏结构的利用**：BA 的雅可比按相机块与点块分块，$\mathbf{J}^T\mathbf{J}$ 具有箭形（arrowhead）结构：相机块两两之间通过共享点产生耦合，点块之间无耦合。利用 Schur 补把点块消去，得到只含相机块的约化系统（大小降低到相机数 $10^3$ 到 $10^4$ 量级），求解后再回代解出众点。这一消元把最贵的求解步骤从点变量规模降到相机变量规模，是 BA 标准实现（如 Ceres、g2o）的核心。

**复杂度量级**：每步组装 $\mathbf{J}^T\mathbf{J}$ 与 $\mathbf{J}^T\mathbf{r}$ 的代价与残差数成正比（$10^7$ 量级；利用稀疏性可降到 $O(10^6)$ 的存储）；Schur 补后的相机系统规模 $10^3$ 到 $10^4$，稠密 Cholesky 可行；每步总代价在 $10^7$ 到 $10^8$ 次运算量级，一个中等规模问题需要几十到几百步。

**两个数值风险**：其一是规范（gauge）自由度：整体平移与旋转不改变重投影误差，Hessian 奇异（零特征值对应这些方向）。处理方式是固定一个相机（或加入先验），或让阻尼项 $\lambda\mathbf{I}$ 负责正则化。监控手段是检查 $\mathbf{J}^T\mathbf{J}$ 的最小特征值或条件数，异常小时增大 $\lambda$。其二是数值精度与尺度：三维点距离与像素坐标的量级差异大（病态条件数），需要在组装前归一化坐标（如把像素坐标中心化并缩放到 $-1$ 到 $1$）。监控手段是跟踪每步的增益比 $\rho$：$\rho$ 长期远小于 $1$ 说明模型不可靠，应缩小步长并检查残差是否存在外点；$\rho$ 在 $1$ 附近但收敛停滞，通常是规范自由度或数值精度问题。
:::

## 常见错误

**错误 1 · 在 Hessian 不定时直接使用牛顿方向**

原因：牛顿方向由解 $\mathbf{H}\mathbf{p} = -\mathbf{g}$ 得到，Hessian 不定时这个解可能指向极大或鞍点方向（$\mathbf{g}^T\mathbf{p} > 0$），迭代会上升而不是下降。在非凸问题（深度网络、生成模型）的早期阶段，Hessian 不定的情形很常见。

解决：使用阻尼牛顿或信赖域：前者对 Hessian 加 $\tau\mathbf{I}$ 使矩阵正定，后者通过半径限制步长并对负曲率方向自然处理。实现上检查方向是否为下降方向（$\mathbf{g}^T\mathbf{p} < 0$），不满足时改用负梯度方向或增大阻尼；报告中记录触发的次数，作为问题非线性程度的指标。

**错误 2 · 把 L-BFGS 用于随机梯度的场景**

原因：L-BFGS 的割线方程建立在梯度是确定性函数的前提上。随机梯度带噪时，$\mathbf{y} = \mathbf{g}_{k+1} - \mathbf{g}_k$ 中的噪声使割线信息严重失真，更新矩阵可能失去正定性、方向变差。在批量很小或数据增强较强的深度学习中，L-BFGS 通常无法直接使用（全批量训练时可以）。

解决：随机场景用随机拟牛顿的修正版本（要求大批量、对 $\mathbf{y}$ 做方差缩减、限制更新频率），或改用自适应一阶方法（3.4 节）。确定性优化（超参数调优、小规模凸问题、全批量训练）中 L-BFGS 仍是首选；判断标准是梯度的噪声水平：噪声标准差相对梯度范数超过百分之几之后，L-BFGS 的收益迅速消失。

**错误 3 · 在高斯-牛顿失败时只调步长，不引入阻尼**

原因：高斯-牛顿的失败模式是步长本身太大（$\mathbf{J}^T\mathbf{J}$ 在残差大时低估曲率），缩小步长到很小的固定值会让收敛极慢。近似的误差来自丢掉 $\sum r_i\nabla^2 r_i$ 项，单纯调整尺度不能修复模型误差。

解决：引入阻尼项（LM）并让 $\lambda$ 自适应，这是对模型误差的直接修复。判断方法是检查增益比与残差分布：$\rho$ 远小于 $1$ 且残差在外点附近最大时，先做稳健损失（Huber、Cauchy）或外点剔除，再回到 LM；报告的收敛结果要给出最终残差的统计（均值、最大值），确认没有退化解（练习题中 $a \to 0$、$b \to \infty$ 的情形）。

**错误 4 · 把共轭梯度的 n 步精确终止当作浮点情形的保证**

原因：CG 在精确算术下 $n$ 步给出精确解，这一结论依赖共轭方向在浮点运算中保持精确正交。实际计算中舍入误差使共轭性逐渐丧失，CG 可能在超过 $n$ 步后继续改进，也可能停滞。把它当作确定的终止条件（设定步数为 $n$）会在需要高精度时提前停止。

解决：用残差范数作为终止判据（相对残差或绝对残差），设置迭代上限作为保险。需要更高精度或更稳健行为时使用重启动（每 $n$ 步重置方向）或预条件（用近似逆矩阵改善谱分布，迭代次数随之下降）。监控 CG 的残差曲线：正常的 CG 残差单调下降，出现平台说明舍入误差主导，继续迭代无益。