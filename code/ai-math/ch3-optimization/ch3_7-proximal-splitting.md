---
title: 3.7 近端方法与稀疏优化
sidebar:
  order: 7
---
# 3.7 近端方法与稀疏优化

3.6 节末尾留下的问题是 $L_1$ 精确罚与 $L_1$ 正则化的非光滑性：绝对值函数在零点没有导数，3.3 到 3.5 节的梯度法与牛顿法在零点整片区域上无法给出方向。稀疏优化中这一项又不可回避：正是 $L_1$ 正则化产生的精确零使解具有稀疏结构，把非光滑性丢掉，稀疏性也会消失。

处理非光滑问题的方法是把目标拆成两部分：一部分光滑（数据拟合项），一部分非光滑但结构简单（正则项或约束）。对后者用一个能被精确求解的局部算子代替梯度，这个算子就是**近端算子**（proximal operator）。它是投影的推广：投影处理示性函数（硬约束），近端算子处理任何凸罚函数。有了它，非光滑问题被改造成与梯度法同样简单的迭代格式，收敛速度仍然是 $O(1/k)$，加速后为 $O(1/k^2)$。

本节按工具层次推进。3.7.1 定义近端算子与 Moreau 包络，给出几个可手算的例子；3.7.2 用近端梯度法求解 Lasso，并给出 ISTA 与 FISTA 的对比；3.7.3 引入算子分裂与 ADMM，处理两个非光滑项或两个块的复合问题；3.7.4 讨论投影不可用时的替代方案 Frank-Wolfe；3.7.5 汇总稀疏优化中的结构化正则、非凸正则与工程实践。

## 3.7.1 近端算子与 Moreau 包络

### 定义

对凸函数 $f$（可以非光滑）与参数 $t > 0$，近端算子定义为

$$
\text{prox}_{tf}(\mathbf{v}) = \arg\min_{\mathbf{u}} \left\{ f(\mathbf{u}) + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2 \right\}
$$

结构上是两项的折中：二次项要求结果靠近 $\mathbf{v}$，$f$ 项要求结果有小的函数值。$t$ 控制两者的比例。$t$ 很小时结果接近 $\mathbf{v}$（趋向恒等映射），$t$ 很大时结果接近 $f$ 的极小点。由于二次项严格凸，只要 $f$ 是凸的，极小点唯一，近端算子总是单值、非扩张的（在 3.2 节的意义上）。

$f$ 取闭凸集 $C$ 的示性函数 $\delta_C$（$C$ 内取 $0$，$C$ 外取 $+\infty$）时，近端算子退化为投影：

$$
\text{prox}_{t\delta_C}(\mathbf{v}) = \arg\min_{\mathbf{u} \in C} \|\mathbf{u} - \mathbf{v}\|^2 = \Pi_C(\mathbf{v})
$$

投影是近端算子的特例，这一关系使 3.6 节的投影梯度与本节的方法成为同一个框架的两个端点。

### 最优性条件与不动点

近端算子的定义是无约束问题，写出一阶条件（次微分形式，3.2 节）：

$$
\mathbf{0} \in \partial f(\mathbf{u}) + \frac{\mathbf{u} - \mathbf{v}}{t}
\quad \Longleftrightarrow \quad
\mathbf{v} - \mathbf{u} \in t\,\partial f(\mathbf{u})
$$

读法：$\mathbf{u}$ 是近端算子输出的充要条件是**$\mathbf{v}$ 与 $\mathbf{u}$ 的差正好是 $f$ 在 $\mathbf{u}$ 处的一个次梯度**。这条条件把所有非光滑性压缩进一次包含关系，它与下面两个等价说法同源。

其一是不动点刻画：$\mathbf{x}^*$ 最小化 $f$ 当且仅当对任意 $t > 0$，$\mathbf{x}^* = \text{prox}_{tf}(\mathbf{x}^*)$。证明只需在两个方向使用上式（取 $\mathbf{v} = \mathbf{u} = \mathbf{x}^*$，得 $\mathbf{0} \in \partial f(\mathbf{x}^*)$）。于是**解非光滑问题**转化为**找近端算子的不动点**，投影与反射类算法都建立在这一刻画上。

其二是与 3.6 节 KKT 条件的联系：$\mathbf{u} = \text{prox}_{tf}(\mathbf{v})$ 等价于 $\mathbf{u}$ 是问题 $\min_{\mathbf{u}} f(\mathbf{u}) + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2$ 的最优解，这一子问题的 KKT 条件就是上式。近端算子因此是**求解一个携带约束信息的子问题**的原子操作。

### 可解析计算的例子

四个常用的近端算子都有闭式解，这些公式是后面所有算法的构件。

**$L_1$ 范数：软阈值。** 对 $f(\mathbf{u}) = \|\mathbf{u}\|_1$，问题按分量解耦，一维子问题 $\min_u t|u| + \frac{1}{2}(u - v)^2$ 的解为

$$
\text{soft}(v, t) = \text{sign}(v)\max(|v| - t, 0)
$$

超过阈值的分量被**平移** $t$ 单位，低于阈值的分量被置零。这一**小值归零**的行为是稀疏性的直接来源。

**箱约束：截断。** $f = \delta_{[l, u]^n}$ 时，近端算子是逐分量截断 $\text{clip}(v, l, u)$。

**$L_2$ 球：缩放。** $f = \delta_{\{\|\mathbf{u}\| \leq r\}}$ 时，$\text{prox}(\mathbf{v}) = \mathbf{v}\cdot\min(1, r/\|\mathbf{v}\|)$。

**二次函数：线性收缩。** $f(\mathbf{u}) = \frac{\mu}{2}\|\mathbf{u}\|^2$ 时，$u$ 的一阶条件给出 $u = v/(1 + t\mu)$。

$L_1$ 与二次函数的对比说明了稀疏性的来源：二次近端把每个分量按同一因子缩小（$L_2$ 正则化的收缩偏差），$L_1$ 近端把小的分量直接归零。前者的解几乎处处非零，后者产生精确的零。近端算子的形状决定了正则化的解结构。

### Moreau 包络与 Moreau 分解

近端算子导出一个光滑函数。定义 **Moreau 包络**（Moreau envelope）

$$
M_{tf}(\mathbf{v}) = \min_{\mathbf{u}} \left\{ f(\mathbf{u}) + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2 \right\}
$$

它是近端问题的最优值。包络有两个有用的性质：

$$
\nabla M_{tf}(\mathbf{v}) = \frac{\mathbf{v} - \text{prox}_{tf}(\mathbf{v})}{t}, \qquad M_{tf} \text{ 的梯度以 } 1/t \text{ 为 Lipschitz 常数}
$$

也就是说，即便 $f$ 非光滑（例如 $L_1$ 范数），Moreau 包络也是连续可微的，且梯度可以只通过一次近端算子求值得到。这一操作把非光滑函数光滑化，代价是引入参数 $t$：$t$ 减小则包络逼近 $f$ 本身，梯度 Lipschitz 常数增大。3.6.4 节的增广拉格朗日与内点法都用光滑化处理原本不可微的目标，Moreau 包络给出这一思路的最小形式。

**Moreau 分解**把近端算子与共轭函数连接起来：

$$
\mathbf{v} = \text{prox}_{tf}(\mathbf{v}) + t\,\text{prox}_{f^*/t}(\mathbf{v}/t)
$$

其中 $f^*$ 是共轭函数（3.2 节）。右端第一项是 $f$ 方向的分解，第二项是 $f^*$ 方向的分解，两者之和恒等于 $\mathbf{v}$。$f = \|\cdot\|_1$ 时 $f^* = \delta_{\{\|\cdot\|_\infty \leq 1\}}$，$f^*$ 的近端算子是向 $L_\infty$ 球的投影（逐分量截断到 $[-1, 1]$），分解式变为**软阈值 + 截断 = 恒等**。这一恒等式不只用于理论推导：它把处理 $f$ 的对偶算法翻译成处理 $f^*$ 的算法，是原对偶方法的代数基础。

### 数值验证

下面的代码实现四个近端算子，并用数值手段核对软阈值与 Moreau 包络的结论。

```python
import numpy as np

def soft(v, t):
    return np.sign(v) * np.maximum(np.abs(v) - t, 0.0)

def prox_l2ball(v, r):
    nv = np.linalg.norm(v)
    return v if nv <= r else v * (r / nv)

def prox_box(v, lo, hi):
    return np.clip(v, lo, hi)

def prox_quad(v, t, mu):
    return v / (1 + t * mu)

# 软阈值：与逐分量的网格最小化对照
v = np.array([-2.3, -0.4, 0.7, 3.1])
t = 1.0
grid = np.linspace(-6, 6, 240001)
num = np.array([grid[np.argmin(t * np.abs(grid) + 0.5 * (grid - vi) ** 2)] for vi in v])
print("软阈值解析解:", ", ".join(f"{u:.4f}" for u in soft(v, t)))
print("网格数值解:  ", ", ".join(f"{u:.4f}" for u in num))

w = np.array([3.0, 4.0])
print("L2 球投影 (r=2):", ", ".join(f"{u:.4f}" for u in prox_l2ball(w, 2.0)))
print("箱投影 ([-1,1]):", ", ".join(f"{u:.4f}" for u in prox_box(w, -1.0, 1.0)))
print("二次近端 (mu=3):", ", ".join(f"{u:.4f}" for u in prox_quad(w, 1.0, 3.0)))

# Moreau 分解：prox_tf(v) + t * prox_{f*/t}(v/t) = v，f = ||.||_1
p1 = soft(v, t)
p2 = t * prox_box(v / t, -1.0, 1.0)
print("Moreau 分解残差:", np.linalg.norm(p1 + p2 - v))

# Moreau 包络的梯度：解析式与中心差分对照
def moreau(vv, tt):
    p = soft(vv, tt)
    return float(np.sum(np.abs(p)) + np.sum((p - vv) ** 2) / (2 * tt))

v0 = np.array([0.3, -1.7, 2.4])
h = 1e-6
g_num = np.array([(moreau(v0 + h * e, t) - moreau(v0 - h * e, t)) / (2 * h)
                  for e in np.eye(3)])
g_ana = (v0 - soft(v0, t)) / t
print("Moreau 包络梯度（数值）:", ", ".join(f"{u:.6f}" for u in g_num))
print("Moreau 包络梯度（解析）:", ", ".join(f"{u:.6f}" for u in g_ana))
```

输出：

```text
软阈值解析解: -1.3000, -0.0000, 0.0000, 2.1000
网格数值解:   -1.3000, 0.0000, 0.0000, 2.1000
L2 球投影 (r=2): 1.2000, 1.6000
箱投影 ([-1,1]): 1.0000, 1.0000
二次近端 (mu=3): 0.7500, 1.0000
Moreau 分解残差: 0.0
Moreau 包络梯度（数值）: 0.300000, -1.000000, 1.000000
Moreau 包络梯度（解析）: 0.300000, -1.000000, 1.000000
```

四项核对全部通过。软阈值与网格最小化逐位一致（网格步长 $5 \times 10^{-5}$，输出精度 $10^{-4}$）；Moreau 分解的残差为零（浮点意义下），说明 $L_1$ 范数的近端与 $L_\infty$ 球投影这对分解在数值上精确成立；Moreau 包络的解析梯度与中心差分一致到 $6$ 位小数。后一项还揭示了一个细节：$v_1 = 0.3$ 处包络梯度的解析值为 $0.3$，与 $v_1$ 本身相等，因为该点已被软阈值置零（$\text{prox} = 0$），包络在该点退化为二次项 $\frac{1}{2t}v^2$，梯度为 $v/t$。

## 3.7.2 近端梯度法与 ISTA/FISTA

### 复合问题的结构

本节处理的问题形如

$$
\min_{\mathbf{x}} \ f(\mathbf{x}) + g(\mathbf{x})
$$

$f$ 凸、可微、梯度以 $L$ 为 Lipschitz 常数，$g$ 凸、可能非光滑、近端算子可解析计算。Lasso、组 Lasso、稀疏逻辑回归、矩阵补全都属于这一形式：$f$ 是数据拟合项，$g$ 是正则项。

构造迭代的方法沿用 3.3 节的下降引理。由 $f$ 的 $L$-光滑性，对任意 $\mathbf{x}$ 与 $\mathbf{y}$，

$$
f(\mathbf{y}) \leq f(\mathbf{x}) + \nabla f(\mathbf{x})^T(\mathbf{y} - \mathbf{x}) + \frac{L}{2}\|\mathbf{y} - \mathbf{x}\|^2
$$

把右端加上 $g(\mathbf{y})$ 并求极小，得到的点就是

$$
\mathbf{x}_{k+1} = \text{prox}_{g/L}\Big(\mathbf{x}_k - \frac{1}{L}\nabla f(\mathbf{x}_k)\Big)
$$

这正是**近端梯度法**（proximal gradient）：先沿光滑部分做一步梯度下降，再用近端算子修正非光滑部分。$g = \delta_C$ 时它退化为投影梯度（3.6 节），$g = 0$ 时退化为梯度下降（3.3 节）。这一格式也称为前向-后向分裂：梯度步是**前向**（显式使用 $f$ 的信息），近端步是**后向**（隐式处理 $g$）。

::: tip 为什么近端算子能替代线搜索
下降引理中的二次项已经给出 $f$ 在步长 $1/L$ 下的上界，所以梯度步不需要线搜索；近端步在 $g$ 上是最优的（它精确求解 $g$ 出现在目标中的子问题）。两步合起来的迭代保证目标函数单调下降，下降量有下界 $\frac{L}{2}\|\mathbf{x}_{k+1} - \mathbf{x}_k\|^2$。若 $L$ 未知，用回溯线搜索估计它（每次把 $L$ 乘 $2$ 直到下降引理成立）。
:::

### 收敛速度与加速

向 Lasso 那样的复合凸问题上，近端梯度法的收敛速率为 $O(1/k)$（目标值误差），与梯度下降在光滑情形下的速率一致。$g$ 恰好是示性函数（投影梯度）时同样成立。

加速版本称为 **FISTA**（fast iterative shrinkage-thresholding algorithm），在近端梯度步之外增加动量外推：

$$
\mathbf{x}_{k+1} = \text{prox}_{g/L}\Big(\mathbf{y}_k - \frac{1}{L}\nabla f(\mathbf{y}_k)\Big), \qquad
\mathbf{y}_{k+1} = \mathbf{x}_{k+1} + \frac{\theta_k - 1}{\theta_{k+1}}(\mathbf{x}_{k+1} - \mathbf{x}_k)
$$

其中 $\theta_{k+1} = \frac{1}{2}\left(1 + \sqrt{1 + 4\theta_k^2}\right)$，$\theta_0 = 1$。目标值误差的速率提升到 $O(1/k^2)$，与 Nesterov 加速梯度（3.4 节）同源。代价是三点：函数值不再单调（外推越过最优解时目标会上升）；动量项引入的误差累积会让数值精度在后期停滞；步长大于 $1/L$ 时可能发散。**自适应重启动**解决第二个问题：当检测到外推方向与梯度方向不再同向（$\nabla f(\mathbf{x}_{k+1})^T(\mathbf{x}_{k+1} - \mathbf{x}_k) > 0$）时把动量重置为 $\theta = 1$。

### Lasso 作为标准例子

Lasso 问题是近端梯度法的标准测试场：

$$
\min_{\mathbf{w}} \ \frac{1}{2}\|\mathbf{X}\mathbf{w} - \mathbf{y}\|^2 + \lambda\|\mathbf{w}\|_1
$$

光滑部分 $f(\mathbf{w}) = \frac{1}{2}\|\mathbf{X}\mathbf{w} - \mathbf{y}\|^2$ 的梯度为 $\mathbf{X}^T(\mathbf{X}\mathbf{w} - \mathbf{y})$，Lipschitz 常数为 $\mathbf{X}^T\mathbf{X}$ 的最大特征值 $L$。非光滑部分是 $L_1$ 范数，近端算子为软阈值，阈值为 $\lambda/L$：

$$
\mathbf{w}_{k+1} = \text{soft}\Big(\mathbf{w}_k - \frac{1}{L}\mathbf{X}^T(\mathbf{X}\mathbf{w}_k - \mathbf{y}),\ \frac{\lambda}{L}\Big)
$$

正则参数有一个自然的起点：当 $\lambda \geq \lambda_{\max} = \|\mathbf{X}^T\mathbf{y}\|_\infty$ 时，全零向量满足最优性条件，问题的最优解就是 $\mathbf{0}$。实践中的做法是从 $\lambda_{\max}$ 的某个比例（例如 $5\%$ 到 $20\%$）出发，沿参数路径逐点求解并热启动。

Lasso 的最优性条件（3.6 节 KKT 条件在非光滑情形的形式）为

$$
\mathbf{X}_j^T(\mathbf{X}\mathbf{w} - \mathbf{y}) = \lambda\,\text{sign}(w_j)\ (w_j \neq 0), \qquad
|\mathbf{X}_j^T(\mathbf{X}\mathbf{w} - \mathbf{y})| \leq \lambda\ (w_j = 0)
$$

非零分量处的相关系数恰好被钉在 $\pm\lambda$ 上，零分量处的相关系数被压在 $[-\lambda, \lambda]$ 之内。这一**钉住**结构使 $L_1$ 正则化的估计有偏（大系数的幅度被系统性压低），也是后处理 debiasing 的动机：先用 Lasso 选支撑集，再在支撑集上做无正则最小二乘。

### 数值实验

设计矩阵取 AR(1) 结构（列之间相关性为 $0.9^{|i-j|}$），$n = 200$、$d = 150$，真实系数有 $30$ 个非零。这个设计矩阵的条件数接近 $10^4$，是 ISTA 与 FISTA 差距明显的场景。参考解用坐标下降求得（每轮依次对单个坐标解一维软阈值问题，收敛快且给出高精度解）。

```python
import numpy as np

def soft(v, t):
    return np.sign(v) * np.maximum(np.abs(v) - t, 0.0)

rng = np.random.default_rng(0)
n, d, s = 200, 150, 30
Z = rng.normal(size=(n, d))
X = Z.copy()
for j in range(1, d):                      # AR(1) 相关设计矩阵
    X[:, j] = 0.9 * X[:, j - 1] + np.sqrt(1 - 0.81) * Z[:, j]
X /= np.sqrt(n)
w_true = np.zeros(d)
idx = rng.choice(d, s, replace=False)
w_true[idx] = rng.normal(size=s) * 2
y = X @ w_true + 0.1 * rng.normal(size=n)

G = X.T @ X
ev = np.linalg.eigvalsh(G)
L = float(ev.max())
print(f"L = {L:.4f}, 最小特征值 = {ev.min():.6f}, 条件数 = {L / ev.min():.1f}")
lam = 0.05 * float(np.abs(X.T @ y).max())
print(f"lambda = {lam:.6f}（lambda_max = {np.abs(X.T @ y).max():.6f} 的 5%）")

def obj(w):
    return 0.5 * float(np.sum((X @ w - y) ** 2)) + lam * float(np.sum(np.abs(w)))

def grad(w):
    return X.T @ (X @ w - y)

# 坐标下降参考解
w_cd = np.zeros(d)
cols = np.sum(X ** 2, axis=0)
for sweep in range(5000):
    w_old = w_cd.copy()
    for j in range(d):
        r = y - X @ w_cd + X[:, j] * w_cd[j]
        rho = X[:, j] @ r
        w_cd[j] = np.sign(rho) * max(abs(rho) - lam, 0.0) / cols[j]
    if np.max(np.abs(w_cd - w_old)) < 1e-13:
        break
f_ref = obj(w_cd)
nz = np.abs(w_cd) > 1e-10
overlap = len(set(np.nonzero(nz)[0]) & set(idx))
print(f"坐标下降: {sweep} 轮, 目标 = {f_ref:.10f}, 非零个数 = {int(nz.sum())}, "
      f"真实支撑重合 = {overlap}/{s}")

# ISTA
def ista_run(maxit, checkpoints):
    w = np.zeros(d)
    hist = []
    for k in range(maxit + 1):
        if k in checkpoints:
            hist.append((k, obj(w), (obj(w) - f_ref) / f_ref))
        if k < maxit:
            w = soft(w - grad(w) / L, lam / L)
    return hist

# FISTA（自适应重启动）
def fista_run(maxit, checkpoints):
    w = np.zeros(d); w_prev = w.copy(); theta = 1.0
    hist = []
    for k in range(maxit + 1):
        if k in checkpoints:
            hist.append((k, obj(w), (obj(w) - f_ref) / f_ref))
        if k < maxit:
            w_new = soft(w - grad(w) / L, lam / L)
            if np.sum((w - w_new) * (w_new - w_prev)) > 0:
                theta = 1.0
                w = w_new
            else:
                theta_new = 0.5 * (1 + np.sqrt(1 + 4 * theta ** 2))
                w = w_new + ((theta - 1) / theta_new) * (w_new - w_prev)
                theta = theta_new
            w_prev = w_new
    return hist

print("ISTA:")
for k, val, gap in ista_run(4000, {100, 500, 1000, 4000}):
    print(f"  k = {k:>4}: 目标 = {val:.10f}, 相对次优 = {gap:.3e}")
print("FISTA（自适应重启动）:")
for k, val, gap in fista_run(400, {100, 200, 400}):
    print(f"  k = {k:>4}: 目标 = {val:.10f}, 相对次优 = {gap:.3e}")

# 达到相对次优 1e-6 的步数
def steps_to(tol, use_fista, maxit):
    w = np.zeros(d); w_prev = w.copy(); theta = 1.0
    for k in range(maxit):
        if (obj(w) - f_ref) / f_ref < tol:
            return k
        w_new = soft(w - grad(w) / L, lam / L)
        if not use_fista:
            w = w_new
        else:
            if np.sum((w - w_new) * (w_new - w_prev)) > 0:
                theta = 1.0
                w = w_new
            else:
                theta_new = 0.5 * (1 + np.sqrt(1 + 4 * theta ** 2))
                w = w_new + ((theta - 1) / theta_new) * (w_new - w_prev)
                theta = theta_new
            w_prev = w_new
    return None

print(f"ISTA 达到相对次优 1e-6：{steps_to(1e-6, False, 40000)} 步")
print(f"FISTA 达到相对次优 1e-6：{steps_to(1e-6, True, 40000)} 步")
```

输出：

```text
L = 20.5805, 最小特征值 = 0.002155, 条件数 = 9549.5
lambda = 0.247763（lambda_max = 4.955250 的 5%）
坐标下降: 259 轮, 目标 = 10.1670594089, 非零个数 = 34, 真实支撑重合 = 18/30
ISTA:
  k =  100: 目标 = 11.0924727466, 相对次优 = 9.102e-02
  k =  500: 目标 = 10.1890235637, 相对次优 = 2.160e-03
  k = 1000: 目标 = 10.1681372745, 相对次优 = 1.060e-04
  k = 4000: 目标 = 10.1670594095, 相对次优 = 6.039e-11
FISTA（自适应重启动）:
  k =  100: 目标 = 10.1679104407, 相对次优 = 8.370e-05
  k =  200: 目标 = 10.1670610703, 相对次优 = 1.634e-07
  k =  400: 目标 = 10.1670594089, 相对次优 = 2.207e-13
ISTA 达到相对次优 1e-6：1929 步
FISTA 达到相对次优 1e-6：174 步
```

三组数据的解读如下。

**条件数与收敛速度**。设计矩阵的条件数为 $9549$，属于病态。ISTA 的收敛速率由条件数控制（与 3.3 节的梯度法相同，误差按 $1 - 1/\kappa$ 的因子收缩），到相对次优 $10^{-6}$ 需要 $1929$ 步；FISTA 只需 $174$ 步，倍数约为 $11$。速率层面的差别是 $O(1/k)$ 与 $O(1/k^2)$ 的差别：ISTA 的误差从 $k = 500$ 处的 $2.2 \times 10^{-3}$ 降到 $k = 4000$ 处的 $6.0 \times 10^{-11}$，步数增加 $8$ 倍对应误差下降 $7.6$ 个数量级；FISTA 从 $k = 100$ 处的 $8.4 \times 10^{-5}$ 降到 $k = 400$ 处的 $2.2 \times 10^{-13}$，步数增加 $4$ 倍对应误差下降 $8.6$ 个数量级。加速的机制与 3.4 节的 Nesterov 动量相同：外推项把历史的更新方向累积起来，抵消病态方向上的缓慢爬行。

**稀疏性与支撑恢复**。参考解有 $34$ 个非零分量，其中 $18$ 个落在真实支撑上，其余 $16$ 个是假阳性，同时有 $12$ 个真实系数被压缩到零。$\lambda$ 取 $\lambda_{\max}$ 的 $5\%$ 是偏小的取值，宁可多留变量也不漏掉信号；把 $\lambda$ 增大到 $20\%$ 与 $50\%$ 时，非零个数降到 $22$ 与 $9$，真实支撑重合降到 $14$ 与 $4$（练习题 3 给出数据）。这一段权衡是 Lasso 的常规操作：$\lambda$ 沿路径扫描，用交叉验证或信息准则选点。

**坐标下降的地位**。$259$ 轮坐标下降（每轮 $150$ 次一维更新）给出的解与 FISTA 收敛到相同目标值，代价与 ISTA 的 $1929$ 次迭代同量级（上面的实现每个坐标重算一次残差，每次 $O(nd)$；改为增量维护残差后每轮代价可以再降一个 $d$ 因子）。在 $d$ 中等、需要高精度时坐标下降常常是最省事的选择；$d$ 很大或需要 GPU 并行时近端梯度法更合适。

## 3.7.3 算子分裂与 ADMM

### 两个非光滑项的处理

上一节要求目标中只有一项非光滑。出现两项时（例如 Lasso 加全变差正则、或者带约束的稀疏问题）近端算子本身可能没有闭式解，软化近端算子会引入内层迭代。**算子分裂**（operator splitting）的思路是不构造复合的近端算子，而是让两个算子交替作用。

两种基本分裂的格式如下（$f$、$g$ 为凸函数，$\text{prox}_{tf}$、$\text{prox}_{tg}$ 可算）：

**前向-后向分裂**即近端梯度法：$\mathbf{x}_{k+1} = \text{prox}_{tg}\big(\mathbf{x}_k - t\nabla f(\mathbf{x}_k)\big)$，要求 $f$ 可微。

**Douglas-Rachford 分裂**处理两个都不可微的项，通过反射算子交替：

$$
\mathbf{z}_{k+1} = \mathbf{z}_k + \text{prox}_{tg}\big(2\,\text{prox}_{tf}(\mathbf{z}_k) - \mathbf{z}_k\big) - \text{prox}_{tf}(\mathbf{z}_k)
$$

**Peaceman-Rachford** 是它的对称版本，收敛条件更严格（要求更强的单侧条件），但通常更快。这一族算法的优点是每步只使用两个简单算子，收敛到 $f + g$ 的极小点（需要 $f + g$ 存在极小点，或两个算子的定义域相交）。

### ADMM 的推导

**ADMM**（alternating direction method of multipliers）是把分裂结构加进增广拉格朗日（3.6.4 节）得到的。考虑两块问题

$$
\min_{\mathbf{x}, \mathbf{z}} \ f(\mathbf{x}) + g(\mathbf{z}) \qquad \text{s.t.} \quad A\mathbf{x} + B\mathbf{z} = \mathbf{c}
$$

增广拉格朗日（缩放形式，$\mathbf{u}$ 是缩放后的乘子）为

$$
L_\rho(\mathbf{x}, \mathbf{z}, \mathbf{u}) = f(\mathbf{x}) + g(\mathbf{z}) + \frac{\rho}{2}\|A\mathbf{x} + B\mathbf{z} - \mathbf{c} + \mathbf{u}\|^2
$$

对 $(\mathbf{x}, \mathbf{z})$ 联合求极小需要同时解两个变量，通常不可行。ADMM 把它拆成两次交替的极小化，再加一次乘子更新：

$$
\begin{aligned}
\mathbf{x}_{k+1} &= \arg\min_{\mathbf{x}} \ f(\mathbf{x}) + \frac{\rho}{2}\|A\mathbf{x} + B\mathbf{z}_k - \mathbf{c} + \mathbf{u}_k\|^2 \\
\mathbf{z}_{k+1} &= \arg\min_{\mathbf{z}} \ g(\mathbf{z}) + \frac{\rho}{2}\|A\mathbf{x}_{k+1} + B\mathbf{z} - \mathbf{c} + \mathbf{u}_k\|^2 \\
\mathbf{u}_{k+1} &= \mathbf{u}_k + A\mathbf{x}_{k+1} + B\mathbf{z}_{k+1} - \mathbf{c}
\end{aligned}
$$

**交替方向**指的就是前两步在两个方向上依次进行。与 3.6.4 节的增广拉格朗日方法相比，$\mathbf{x}$ 更新与 $\mathbf{z}$ 更新各自是**近端形式的子问题**：$A = I$、$B = -I$ 时，$\mathbf{x}$ 更新是 $f$ 的近端子问题（加上线性项），$\mathbf{z}$ 更新是 $g$ 的近端算子。许多应用中其中一个子问题恰好是软阈值或线性方程组求解，代价很低。

### 收敛性与停止判据

$f$、$g$ 闭凸真、增广拉格朗日存在鞍点时，ADMM 保证：目标值收敛到最优值，原始残差 $\mathbf{r}_k = A\mathbf{x}_k + B\mathbf{z}_k - \mathbf{c}$ 与对偶残差 $\mathbf{s}_k = \rho A^T B(\mathbf{z}_k - \mathbf{z}_{k-1})$ 都趋于零。收敛速率的一般理论比近端梯度弱（凸情形没有已知的次线性速率保证），但实践中通常线性；当 $f$ 或 $g$ 强凸时，有线性收敛的理论结果。

停止判据同时检查两类残差（相对形式）：

$$
\|\mathbf{r}_k\| \leq \epsilon^{\text{abs}} + \epsilon^{\text{rel}}\max\big(\|A\mathbf{x}_k\|, \|B\mathbf{z}_k\|, \|\mathbf{c}\|\big), \qquad
\|\mathbf{s}_k\| \leq \epsilon^{\text{abs}} + \epsilon^{\text{rel}}\|A^T\mathbf{u}_k\|
$$

只看一个残差会过早停止：原始残差小而对偶残差大时，解虽然在约束面上，乘子却没有收敛，用它对偶信息（灵敏度、下界）会出错。惩罚参数 $\rho$ 控制两类残差的收敛速度：$\rho$ 小则 $\mathbf{x}$ 更新对应的罚权小、原始残差收敛慢；$\rho$ 大则对偶残差收敛慢。自适应策略（残差平衡）在两类残差相差一个数量级时把 $\rho$ 乘或除以 $2$，同时按 $1/\rho$ 缩放 $\mathbf{u}$。

### 数值实验

用一维全变差去噪（一维 fused Lasso）演示 ADMM。问题为

$$
\min_{\mathbf{x}} \ \frac{1}{2}\|\mathbf{x} - \mathbf{y}\|^2 + \lambda\sum_{i=1}^{n-1}|x_{i+1} - x_i|
$$

引入差分矩阵 $D$（$D\mathbf{x}$ 的第 $i$ 个分量为 $x_{i+1} - x_i$）与变量 $\mathbf{z}$，把问题写成 $\min \frac{1}{2}\|\mathbf{x} - \mathbf{y}\|^2 + \lambda\|\mathbf{z}\|_1$ subject to $D\mathbf{x} = \mathbf{z}$。两个子问题分别是一维线性方程组（$(\mathbf{I} + \rho D^TD)\mathbf{x} = \mathbf{y} + \rho D^T(\mathbf{z} - \mathbf{u})$，左侧是三对角加角的带状矩阵）与软阈值，都是低代价操作。信号取分段常数并叠加噪声，这样全变差正则的去噪效果明显。

```python
import numpy as np

def soft(v, t):
    return np.sign(v) * np.maximum(np.abs(v) - t, 0.0)

rng = np.random.default_rng(1)
n = 200
x_true = np.concatenate([np.zeros(60), 3 * np.ones(40), np.zeros(30),
                         -2 * np.ones(30), np.zeros(40)])
y = x_true + 0.5 * rng.normal(size=n)
lam = 0.8
D = np.diff(np.eye(n), axis=0)

def admm_tv(rho, maxit=2000, tol=1e-10):
    z = D @ y
    u = np.zeros(n - 1)
    Amat = np.linalg.solve(np.eye(n) + rho * D.T @ D, np.eye(n))  # 预分解，迭代中复用
    hist = []
    for k in range(maxit):
        x = Amat @ (y + rho * D.T @ (z - u))
        Dx = D @ x
        z_new = soft(Dx + u, lam / rho)
        u = u + Dx - z_new
        r_pr = float(np.linalg.norm(Dx - z_new))
        r_du = float(rho * np.linalg.norm(D.T @ (z_new - z)))
        obj = 0.5 * float(np.sum((x - y) ** 2)) + lam * float(np.sum(np.abs(z_new)))
        z = z_new
        hist.append((k, r_pr, r_du, obj))
        if r_pr < tol and r_du < tol:
            break
    return x, z, u, hist

x, z, u, hist = admm_tv(1.0)
print("ADMM（rho = 1）：")
for k, r_pr, r_du, obj in hist:
    if k in (0, 5, 20, 50, 100, 200, 400) or k == len(hist) - 1:
        print(f"  k = {k:>3}: 原始残差 = {r_pr:.3e}, 对偶残差 = {r_du:.3e}, 目标 = {obj:.8f}")
print(f"  迭代总数 = {len(hist)}, 跳变点数 = {int(np.sum(np.abs(z) > 1e-6))}")

# 次微分条件：p = rho * u 应满足 |p_i| <= lambda，且在 z_i != 0 处 p_i = lambda * sign(z_i)
p = 1.0 * u
print(f"  次微分条件: max(|p|) - lambda = {np.max(np.abs(p)) - lam:+.3e}")
act = np.abs(z) > 1e-6
print(f"  活跃跳变处 max|p_i - lambda*sign(z_i)| = "
      f"{np.max(np.abs(p[act] - lam * np.sign(z[act]))):.3e}")

# 对偶参考解：max_{|p| <= lambda} p^T D y - 0.5||D^T p||^2，用加速投影梯度
def dual_ref(steps=40000):
    p = np.zeros(n - 1); p_old = p.copy(); t = 1.0
    for k in range(steps):
        gp = -(D @ y) + D @ (D.T @ p)
        p_new = np.clip(p - gp / 4.0, -lam, lam)
        t_new = 0.5 * (1 + np.sqrt(1 + 4 * t ** 2))
        p = p_new + ((t - 1) / t_new) * (p_new - p_old)
        p_old = p_new
        t = t_new
    p = np.clip(p, -lam, lam)
    xd = y - D.T @ p
    return 0.5 * float(np.sum((xd - y) ** 2)) + lam * float(np.sum(np.abs(D @ xd)))

print(f"对偶参考解（加速投影梯度 40000 步）目标 = {dual_ref():.10f}")

x_sg = y.copy()
for k in range(20001):
    step = 0.5 / np.sqrt(k + 1)
    x_sg = x_sg - step * ((x_sg - y) + lam * D.T @ np.sign(D @ x_sg))
obj_sg = 0.5 * float(np.sum((x_sg - y) ** 2)) + lam * float(np.sum(np.abs(D @ x_sg)))
print(f"次梯度法（20000 步）目标 = {obj_sg:.8f}（未收敛）")

print("rho 的影响（固定 300 步）：")
for rho in [0.05, 0.2, 1.0, 5.0, 50.0]:
    z = D @ y
    u = np.zeros(n - 1)
    Amat = np.linalg.solve(np.eye(n) + rho * D.T @ D, np.eye(n))
    for k in range(300):
        x = Amat @ (y + rho * D.T @ (z - u))
        Dx = D @ x
        z_new = soft(Dx + u, lam / rho)
        u = u + Dx - z_new
        r_pr = float(np.linalg.norm(Dx - z_new))
        r_du = float(rho * np.linalg.norm(D.T @ (z_new - z)))
        z = z_new
    print(f"  rho = {rho:>5}: 原始残差 = {r_pr:.3e}, 对偶残差 = {r_du:.3e}")
```

输出：

```text
ADMM（rho = 1）：
  k =   0: 原始残差 = 7.612e+00, 对偶残差 = 1.288e+01, 目标 = 18.94257790
  k =   5: 原始残差 = 4.592e-01, 对偶残差 = 3.106e-01, 目标 = 26.64771574
  k =  20: 原始残差 = 6.342e-02, 对偶残差 = 1.308e-02, 目标 = 27.96297719
  k =  50: 原始残差 = 1.536e-02, 对偶残差 = 5.831e-03, 目标 = 28.11484130
  k = 100: 原始残差 = 1.770e-03, 对偶残差 = 2.320e-04, 目标 = 28.13864793
  k = 200: 原始残差 = 8.253e-05, 对偶残差 = 9.880e-06, 目标 = 28.14138526
  k = 400: 原始残差 = 1.987e-07, 对偶残差 = 2.375e-08, 目标 = 28.14149412
  k = 653: 原始残差 = 9.706e-11, 对偶残差 = 1.160e-11, 目标 = 28.14149437
  迭代总数 = 654, 跳变点数 = 32
  次微分条件: max(|p|) - lambda = +0.000e+00
  活跃跳变处 max|p_i - lambda*sign(z_i)| = 2.220e-16
对偶参考解（加速投影梯度 40000 步）目标 = 28.1414943737
次梯度法（20000 步）目标 = 28.49294137（未收敛）
rho 的影响（固定 300 步）：
  rho =  0.05: 原始残差 = 9.155e-02, 对偶残差 = 7.448e-05
  rho =   0.2: 原始残差 = 9.126e-03, 对偶残差 = 6.873e-05
  rho =   1.0: 原始残差 = 4.170e-06, 对偶残差 = 4.985e-07
  rho =   5.0: 原始残差 = 6.923e-14, 对偶残差 = 4.700e-12
  rho =  50.0: 原始残差 = 1.101e-05, 对偶残差 = 6.887e-02
```

四组数据的解读如下。

**收敛过程**。两类残差以接近线性的速率下降到 $10^{-10}$ 量级，共 $654$ 步；目标值从 $18.94$ 收敛到 $28.14149437$。逐项对比 $k = 400$ 与 $k = 653$ 的目标值（$28.14149412$ 与 $28.14149437$）可以看出残差判据与目标精度之间的关系：残差降到 $10^{-7}$ 时目标已经稳定到 $10^{-7}$ 以内。

**最优性验证**。`次微分条件` 两行给出独立的验证：乘子 $\mathbf{p} = \rho\mathbf{u}$ 满足 $|\mathbf{p}| \leq \lambda$（对偶可行性，$\max|\mathbf{p}| - \lambda = 0$），且在跳变处 $\mathbf{p}$ 与 $\lambda\,\text{sign}(\mathbf{z})$ 一致到 $2.2 \times 10^{-16}$。再与对偶参考解对比：独立的对偶方法（在 $|p_i| \leq \lambda$ 的箱约束上最大化 $\mathbf{p}^T D\mathbf{y} - \frac{1}{2}\|D^T\mathbf{p}\|^2$，加速投影梯度 $40000$ 步）给出最优值 $28.1414943737$，与 ADMM 的 $28.14149437$ 一致到 $8$ 位小数。两个算法从不同路径到达同一个最优值，这是本节最可靠的正确性证据。

**与次梯度法的对比**。次梯度法用 $20000$ 步仍停在 $28.4929$，出错 $0.35$（相对 $1.2\%$）。原因是次梯度法的速率是 $O(1/\sqrt{k})$ 且步长必须衰减，而 ADMM 在 $654$ 步内到 $10^{-10}$ 精度。全变差去噪在 $n = 200$ 的规模上并不需要次梯度法，这个对照说明的是方法层面的差别：把非光滑项交给近端与分裂算子，收敛速度的收益是数量级的。

**惩罚参数**。固定 $300$ 步时，$\rho = 0.05$ 的原始残差为 $9.2 \times 10^{-2}$（$\mathbf{x}$ 更新欠约束，原始残差收敛慢），$\rho = 50$ 的对偶残差为 $6.9 \times 10^{-2}$（罚权过重，乘子更新振荡）。两端的残差都比中间值（$\rho = 1$ 到 $5$）差出四到八个数量级。这解释了 ADMM 实现中标准配置的两条：$\rho$ 初始取问题尺度的估值（例如 $1$ 或者由数据自动估计），迭代中按两类残差的比值自适应调整。

::: warning 预分解与稀疏结构
上面的代码用 `np.linalg.solve` 显式计算 $(\mathbf{I} + \rho D^TD)^{-1}$，这在 $n = 200$ 时可行，$n = 10^6$ 时不行。实际实现按 $\rho$ 变化分两种处理：$\rho$ 固定时只做一次 Cholesky 或带状 LU 分解，迭代中反复使用；$\rho$ 自适应变化时需要在变化后重新分解，或者改用可以增量更新的求解器。一维全变差的结构是三对角加一个角（或带状），分解代价是 $O(n)$ 到 $O(nb^2)$；二维全变差的差分算子在行与列方向上耦合，直接分解代价高，常用 DCT 对角化、Dykstra 投影或把二维问题写成一行一列的分裂形式。
:::

## 3.7.4 Frank-Wolfe 与投影的替代

### 条件梯度

投影梯度与近端梯度都假定投影或近端算子可算。当可行集是核范数球、原子范数球或更复杂的凸集时，投影本身需要一次完整 SVD 或一个内层优化，代价可能超过外层的收益。**Frank-Wolfe 方法**（条件梯度法）用另一种原语替换投影：线性最小化 oracle（LMO）

$$
\mathbf{s}_k = \arg\min_{\mathbf{s} \in C} \ \nabla f(\mathbf{x}_k)^T\mathbf{s}
$$

然后沿 $\mathbf{s}_k - \mathbf{x}_k$ 方向做线搜索：

$$
\mathbf{x}_{k+1} = \mathbf{x}_k + \gamma_k(\mathbf{s}_k - \mathbf{x}_k), \qquad \gamma_k \in [0, 1]
$$

$\gamma_k$ 用精确线搜索或固定规则 $\gamma_k = 2/(k + 2)$ 确定。线性最小化在凸集上的代价通常远低于投影：单纯形上是选梯度最小的分量（$O(n)$，无需排序）；核范数球上是求梯度的最大奇异三元组（一次截断 SVD）；$L_1$ 球上是取梯度绝对值最大的分量。

::: tip FW 间隙作为停止判据
对凸目标，定义 **FW 间隙** $g_k = \nabla f(\mathbf{x}_k)^T(\mathbf{x}_k - \mathbf{s}_k)$。它满足 $f(\mathbf{x}_k) - f^* \leq g_k$（凸性给出的一阶界），因此每步都免费得到一个可计算的目标值上界。这与 3.6 节的对偶间隙作用相同：不需要知道最优值就能判断当前解的精度。
:::

### 收敛性与迭代点的结构

$f$ 凸、梯度 Lipschitz、可行集 $C$ 的直径有界（记 $R$）时，FW 间隙满足

$$
\min_{k \leq K} \ g_k \leq \frac{2LR^2}{K + 2}
$$

即 $O(1/k)$ 速率。此外算法有两个结构性质。其一是**仿射不变性**：算法只通过梯度与可行集的内积作用，对变量做可逆仿射变换不改变迭代序列，也不需要估计 $L$（用精确线搜索时）。其二是**稀疏性与低秩性**：迭代点是原子的凸组合，每步只引入一个原子的方向，支撑集或秩的增长每次至多增加 $1$。对核范数球上的矩阵问题，迭代矩阵的秩在早期远低于最优解的秩，这一性质在需要低秩近似输出时很有价值（例如求解松弛问题时希望得到低秩解以做舍入）。加速版本（对偶间隙的 $O(1/k^2)$ 界、完全修正步、在线 FW）有各自的适用条件。

### 与近端梯度的取舍

两种方法的对比可以用一句话概括：FW 每步便宜但收敛慢，近端梯度与投影梯度每步贵（需要投影或近端）但收敛快（凸光滑情形下线性或近线性）。选择依据是投影与原语的代价比例以及是否要求高精度。

### 数值实验

在单纯形约束的二次问题上对比 FW 与投影梯度：

$$
\min_{\mathbf{x}} \ \frac{1}{2}\mathbf{x}^T Q\mathbf{x} - \boldsymbol{\mu}^T\mathbf{x} \quad \text{s.t.} \quad \mathbf{x} \in \Delta = \Big\{\mathbf{x} : \mathbf{x} \geq \mathbf{0},\ \sum_i x_i = 1\Big\}
$$

$Q$ 取 AR(1) 结构的正定矩阵（$Q_{ij} = 0.7^{|i-j|}$），$\boldsymbol{\mu} = Q\mathbf{x}_{\text{target}}$，这样无约束最优解精确等于给定的 $\mathbf{x}_{\text{target}}$（有 $40$ 个非零分量，且落在单纯形内部），因此约束最优解也是它。两个算法从同一个顶点出发，这个起点离最优解较远。

```python
import numpy as np

rng = np.random.default_rng(5)
n = 300
rho_c = 0.7
i_idx, j_idx = np.meshgrid(np.arange(n), np.arange(n), indexing="ij")
Q = rho_c ** np.abs(i_idx - j_idx)
x_target = np.zeros(n)
supp = rng.choice(n, 40, replace=False)
x_target[supp] = rng.random(40) + 0.2
x_target /= x_target.sum()
mu = Q @ x_target

def f(x):
    return 0.5 * float(x @ (Q @ x)) - float(mu @ x)

def grad(x):
    return Q @ x - mu

L = float(np.linalg.eigvalsh(Q).max())
print(f"L = {L:.4f}, 条件数 = {L / np.linalg.eigvalsh(Q).min():.2f}")

def proj_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u)
    r = np.nonzero(u * np.arange(1, len(v) + 1) > (css - 1))[0][-1]
    theta = (css[r] - 1) / (r + 1)
    return np.maximum(v - theta, 0.0)

# 起始顶点取目标函数最小的顶点
i0 = int(np.argmin(0.5 * np.diag(Q) - mu))
x0 = np.zeros(n); x0[i0] = 1.0
print(f"起始顶点 e_{i0 + 1}, 目标 = {f(x0):.6f}")

# 投影梯度：一遍跑完，取出各检查点
x_pg = x0.copy()
pg_hist = {}
for k in range(20001):
    if k in (10, 100, 1000, 5000):
        pg_hist[k] = f(x_pg)
    x_pg = proj_simplex(x_pg - grad(x_pg) / L)
f_ref = f(x_pg)
print(f"投影梯度参考解：目标 = {f_ref:.10f}, 非零个数 = {int(np.sum(x_pg > 1e-10))}")

# Frank-Wolfe
x_fw = x0.copy()
print("Frank-Wolfe（精确线搜索）：")
for k in range(20001):
    g = grad(x_fw)
    i = int(np.argmin(g))
    d = np.zeros(n); d[i] = 1.0; d -= x_fw
    Qd = Q @ d
    fw_gap = float(-g @ d)
    if k in (10, 100, 1000, 5000, 20000):
        print(f"  k = {k:>5}: FW 间隙 = {fw_gap:.3e}, 次优值 = {f(x_fw) - f_ref:.3e}, "
              f"非零个数 = {int(np.sum(x_fw > 1e-10))}")
    gamma = -float(Qd @ x_fw - d @ mu) / float(d @ Qd)
    gamma = min(max(gamma, 0.0), 1.0)
    x_fw = x_fw + gamma * d

print("投影梯度：")
for k in sorted(pg_hist):
    print(f"  k = {k:>5}: 次优值 = {pg_hist[k] - f_ref:.3e}")
```

输出：

```text
L = 5.6620, 条件数 = 32.08
起始顶点 e_14, 目标 = 0.439570
投影梯度参考解：目标 = -0.0202129037, 非零个数 = 40
Frank-Wolfe（精确线搜索）：
  k =    10: FW 间隙 = 7.952e-02, 次优值 = 1.863e-02, 非零个数 = 11
  k =   100: FW 间隙 = 1.060e-03, 次优值 = 5.734e-05, 非零个数 = 40
  k =  1000: FW 间隙 = 1.207e-04, 次优值 = 7.445e-06, 非零个数 = 40
  k =  5000: FW 间隙 = 1.855e-05, 次优值 = 2.309e-07, 非零个数 = 40
  k = 20000: FW 间隙 = 1.042e-07, 次优值 = 8.166e-12, 非零个数 = 40
投影梯度：
  k =    10: 次优值 = 9.977e-03
  k =   100: 次优值 = 1.727e-06
  k =  1000: 次优值 = 1.041e-17
  k =  5000: 次优值 = 0.000e+00
```

四行对比说明了两种方法的特征。

**收敛速度**。投影梯度（条件数 $32$，线性收敛）在 $1000$ 步内到机器精度；FW 用到 $20000$ 步，次优值为 $8.2 \times 10^{-12}$。FW 间隙在各检查点上稳步下降到 $1.0 \times 10^{-7}$，同时给出可计算的上界：在第 $5000$ 步，间隙 $1.9 \times 10^{-5}$ 与真实次优值 $2.3 \times 10^{-7}$ 之间差两个数量级，说明上界虽然保守但数量级可信。

**支撑增长**。FW 从单个顶点出发，第 $10$ 步的非零个数为 $11$（每步至多引入一个新原子），到第 $100$ 步覆盖了最优解的 $40$ 个非零坐标。投影梯度的迭代点在中间阶段是稠密的（第 $10$ 步有 $125$ 个非零分量），只有收敛后才回到稀疏结构。需要输出稀疏或低秩近似时，FW 的中间迭代点比投影梯度的中间迭代点更有用。

**代价结构**。FW 每步一次梯度求值与一次线搜索（各一次矩阵-向量运算），不需要投影；投影梯度每步除梯度外还要一次排序（$O(n\log n)$）。在本例中两者代价相当，投影是可算的；在核范数球上，投影需要完整 SVD（$O(\min(m,n)^2\max(m,n))$），FW 只需要一次截断 SVD 求最大奇异三元组，代价比是一到两个数量级，此时 FW 每一步都便宜得多，$O(1/k)$ 的速率劣势可以被每步的代价优势补偿。

## 3.7.5 稀疏结构、非凸正则与工程实践

### 结构化正则与它们的近端算子

$L_1$ 范数产生逐元素的稀疏。许多应用中稀疏有分组或顺序结构，对应的正则项把近端算子换掉，算法框架不变。

**组 Lasso** 按预先给定的分组 $\mathcal{G}$ 惩罚组内系数的 $L_2$ 范数：$g(\mathbf{w}) = \sum_{G} \lambda_G\|\mathbf{w}_G\|_2$。近端算子是**块软阈值**：

$$
\text{prox}_{tg}(\mathbf{v})_G = \Big(1 - \frac{t\lambda_G}{\|\mathbf{v}_G\|}\Big)_+ \mathbf{v}_G
$$

整组的系数同时归零或被同比例缩放。分组结构对应**某个特征组整体不相关**的先验（多个传感器、多个实验批次）。

**fused Lasso 与全变差** 惩罚相邻系数之差：$g(\mathbf{w}) = \lambda\sum_i |w_{i+1} - w_i|$。它产生分段常数的解（跳变点稀疏），近端算子没有闭式解——这正是 3.7.3 节用 ADMM 处理它的原因（把差分项拆出来交给软阈值）。一维情形有精确的 $O(n)$ 算法（taut string 与 Condat 的方法），高维情形通常回到分裂框架。

**原子范数** 把**稀疏**写成对原子集合的凸包上的范数：$L_1$ 范数是顶点原子 $\{\pm e_i\}$ 的原子范数，核范数是秩一原子 $\{\mathbf{u}\mathbf{v}^T : \|\mathbf{u}\| = \|\mathbf{v}\| = 1\}$ 的原子范数。原子范数为正则或约束的问题适合用 Frank-Wolfe（3.7.4 节的 LMO 就是找出最相关的原子），这条线索把稀疏、低秩与矩阵补全放在同一个框架下。

### 非凸正则与硬阈值

$L_1$ 正则化的收缩偏差（大系数被系统性压低）来自软阈值对超过阈值的分量也做平移。非凸正则通过改变惩罚的形状减小偏差，代价是失去整体的凸性。

$L_0$ 范数（非零元素个数）的近端算子是**硬阈值**：保留绝对值最大的分量，其余归零，$\text{prox}_{t\|\cdot\|_0}(v) = v\cdot\mathbb{1}\{|v| \geq \sqrt{2t}\}$。迭代硬阈值（IHT）把近端梯度框架中的软阈值换成硬阈值，在稀疏恢复的压缩感知设定下有恢复保证，但目标值不保证单调。

MCP 与 SCAD 在超过某个阈值之后把惩罚变为常数（不再继续加压），因此对大系数无偏。两者的近端算子都可用分段公式计算，仍然可以嵌入近端梯度框架，代价是非凸目标只保证收敛到局部最优或稳定点。

### 次模与贪心

离散的稀疏子集选择有一类可证的近似算法。若目标函数 $F(S)$ 是单调次模的（增加元素收益递减，边际收益随集合增大而减小），且需要选 $k$ 个元素，**贪心算法**（每次加入边际收益最大的元素）保证

$$
F(S_{\text{greedy}}) \geq \Big(1 - \frac{1}{e}\Big)\max_{|S| \leq k} F(S)
$$

$1 - 1/e \approx 0.632$ 的近似比是最优的（除非 P = NP）。这一结论在特征选择、实验设计、传感器布点中直接使用；连续化的对应物（把离散选择松弛为 $[0, 1]$ 上的优化，再舍入）与 $L_1$ 正则化共享同一套凸松弛的思路。

### 工程实践

把本节方法用于实际问题时，四条经验覆盖大部分情况。

**尺度与标准化**。$L_1$ 正则化对特征的尺度敏感：某个特征的量纲大一个数量级，它的系数就更容易被判为非零。求解前把各特征标准化（减均值、除以标准差），系数再按原尺度还原。

**正则参数的选择**。$\lambda$ 从 $\lambda_{\max}$ 开始沿路径下降（每次取上一解的 $\lambda$ 作为热启动），在若干折的交叉验证上选点。$\lambda$ 路径的另一个用途是稳定性选择：在重采样数据上统计每个特征被选中的频率，取高频特征。

**方法的匹配**。$d$ 中等、需要高精度时坐标下降；$d$ 很大、需要 GPU 或分布式时近端梯度（ISTA/FISTA 的每步只有矩阵-向量运算）；两个非光滑项或需要分布式拆分时 ADMM；可行集上投影昂贵但线性最小化简单时 Frank-Wolfe。

**精度的合理目标**。$L_1$ 正则化的解本身有偏，把内层求解精度推到 $10^{-12}$ 的意义有限，通常相对精度 $10^{-6}$ 到 $10^{-8}$ 足够（交叉验证的选点误差远大于此）。这一判断与 3.3 节的终止判据一致：算法精度的设定应当匹配问题的统计不确定性，而不是盲目追求浮点极限。

## 3.7.6 本节小结

::: success 非光滑问题的四个工具
本节把非光滑优化组织为**光滑部分 + 简单非光滑部分**的框架。近端算子 $\text{prox}_{tf}(\mathbf{v}) = \arg\min\{f(\mathbf{u}) + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2\}$ 是这个框架的原子：投影是它的特例，最优性条件 $\mathbf{v} - \mathbf{u} \in t\partial f(\mathbf{u})$ 把次微分包含压缩成一次函数求值，Moreau 包络把非光滑函数光滑化（梯度为 $(\mathbf{v} - \text{prox})/t$），Moreau 分解 $\mathbf{v} = \text{prox}_{tf}(\mathbf{v}) + t\,\text{prox}_{f^*/t}(\mathbf{v}/t)$ 连接 $f$ 与其共轭的近端。近端梯度法（ISTA）在下降引理的基础上得到单调下降的迭代，加速版本 FISTA 把速率从 $O(1/k)$ 提到 $O(1/k^2)$，数值实验中病态 Lasso 上从 $1929$ 步降到 $174$ 步，代价是目标非单调（需要重启动）与后期精度停滞。ADMM 把增广拉格朗日的联合极小化拆成交替方向的两步，全变差去噪实验中 $654$ 步把两类残差降到 $10^{-10}$，目标值与独立的对偶参考解一致到 $8$ 位小数，惩罚参数 $\rho$ 由两类残差的平衡决定。Frank-Wolfe 用线性最小化替代投影，单纯形约束实验显示它每步便宜、迭代点稀疏（支撑每次至多增加一个原子）但收敛慢（$20000$ 步的次优值 $8 \times 10^{-12}$ 对投影梯度的 $1000$ 步机器精度），适用场景是投影昂贵或需要稀疏输出。最后，结构化正则（组 Lasso、全变差、原子范数）、非凸正则（$L_0$、MCP、SCAD）与次模贪心（$1 - 1/e$ 近似比）各自把稀疏性的含义从一个方向扩展到多个方向。
:::

非光滑优化的工具线到此完成。下一节换一个问题域：前面所有收敛性结论都以凸性为条件，机器学习的目标函数几乎全部非凸，3.8 节讨论非凸情形下哪些结论仍然成立、哪些现象需要新的解释框架。

## 练习题

### 第 1 题 概念推导

证明近端算子的最优性条件：$\mathbf{u} = \text{prox}_{tf}(\mathbf{v})$ 当且仅当 $\mathbf{v} - \mathbf{u} \in t\,\partial f(\mathbf{u})$。由此推出不动点刻画（$\mathbf{x}^*$ 最小化 $f$ 当且仅当 $\mathbf{x}^* = \text{prox}_{tf}(\mathbf{x}^*)$），并给出 $f(\mathbf{u}) = \|\mathbf{u}\|_1$ 时的软阈值公式。最后说明为什么 $L_1$ 的近端算子产生精确零而 $L_2$ 的近端算子不产生零。

::: details 参考答案
**最优性条件**：$\text{prox}_{tf}(\mathbf{v})$ 是无约束凸问题 $\min_{\mathbf{u}} f(\mathbf{u}) + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2$ 的极小点。由 3.2 节的最优性条件（$0 \in \partial(\text{目标})$），

$$
\mathbf{0} \in \partial f(\mathbf{u}) + \frac{\mathbf{u} - \mathbf{v}}{t}
\quad \Longleftrightarrow \quad
\mathbf{v} - \mathbf{u} \in t\,\partial f(\mathbf{u})
$$

**不动点刻画**：若 $\mathbf{x}^*$ 最小化 $f$，则 $\mathbf{0} \in \partial f(\mathbf{x}^*)$，代入上式（取 $\mathbf{v} = \mathbf{x}^*$、$\mathbf{u} = \mathbf{x}^*$）得 $\mathbf{0} \in t\partial f(\mathbf{x}^*)$，即 $\mathbf{x}^* = \text{prox}_{tf}(\mathbf{x}^*)$。反向：若 $\mathbf{x}^* = \text{prox}_{tf}(\mathbf{x}^*)$，则 $\mathbf{v} - \mathbf{u} = \mathbf{0} \in t\partial f(\mathbf{x}^*)$，得 $\mathbf{0} \in \partial f(\mathbf{x}^*)$，$\mathbf{x}^*$ 是极小点（凸性保证最优性条件充分）。

**软阈值**：$f(u) = |u|$ 时 $\partial f(u)$ 为：$u > 0$ 时 $\{1\}$，$u < 0$ 时 $\{-1\}$，$u = 0$ 时 $[-1, 1]$。条件 $v - u \in t\partial f(u)$ 分三种情形：$u > 0$ 时 $v = u + t$，要求 $u = v - t > 0$ 即 $v > t$；$u < 0$ 时 $u = v + t$，要求 $v < -t$；$u = 0$ 时要求 $v \in [-t, t]$。三段合并为 $\text{soft}(v, t) = \text{sign}(v)\max(|v| - t, 0)$。

**零的产生**：$u = 0$ 对应条件里的**区间** $v \in [-t, t]$，一个正测度集合被映射到零，因此 $L_1$ 的解有非零概率取精确零。$L_2$ 情形比 $t(u - v) + \mu u = 0$ 给出 $u = v/(1 + t\mu)$，只有 $v = 0$ 这一点映射到零，输出几乎处处非零。
:::

### 第 2 题 计算推理

计算下列近端算子的取值：(a) $f(u) = \|\mathbf{u}\|_1$，$\mathbf{v} = (1.8, -0.3, 0.5)$，$t = 0.6$；(b) 分组 $L_2$ 范数 $g(\mathbf{w}) = \sum_G\lambda_G\|\mathbf{w}_G\|_2$，分组 $\mathbf{v}_G = (0.3, 0.4)$，$t\lambda_G = 0.3$；(c) $L_0$ 范数，$v = (0.4, -1.3)$，$t = 0.5$；(d) Moreau 包络 $M_{t\|\cdot\|_1}$ 在 $\mathbf{v} = (1.8, -0.3, 0.5)$、$t = 0.6$ 处的值。

::: details 参考答案
**(a)** 软阈值逐分量：$1.8 - 0.6 = 1.2$，$|-0.3| < 0.6$ 归零，$0.5 < 0.6$ 归零，结果为 $(1.2, 0, 0)$。

**(b)** 块软阈值：组范数 $\|\mathbf{v}_G\| = \sqrt{0.3^2 + 0.4^2} = 0.5$。收缩因子 $1 - 0.3/0.5 = 0.4$，结果为 $(0.12, 0.16)$。组内所有分量按同一因子缩放，整体保留或整体归零。

**(c)** 硬阈值：阈值 $\sqrt{2t} = \sqrt{1} = 1$。$|0.4| < 1$ 归零，$|-1.3| \geq 1$ 保留原值，结果为 $(0, -1.3)$。

**(d)** Moreau 包络是近端问题的最优值：先算 $\mathbf{u} = \text{soft}(\mathbf{v}, 0.6) = (1.2, 0, 0)$，然后

$$
M(\mathbf{v}) = \|\mathbf{u}\|_1 + \frac{1}{2t}\|\mathbf{u} - \mathbf{v}\|^2 = 1.2 + \frac{1}{1.2}\big(0.6^2 + 0.3^2 + 0.5^2\big) = 1.2 + \frac{0.7}{1.2} \approx 1.7833
$$

也可以用解析梯度核对：$\nabla M(\mathbf{v}) = (\mathbf{v} - \mathbf{u})/t = (0.6, -0.3, 0.5)/0.6 = (1.0, -0.5, 0.8333)$，非零分量与 $\text{sign}(v)$ 一致，说明包络在 $v_1$ 方向仍有斜率（该分量未被截断），在其余两个方向梯度由二次项主导。
:::

### 第 3 题 代码验证

用 3.7.2 节的代码做三组实验并解释：(a) 把近端梯度步长从 $1/L$ 改为 $2/L$ 与 $2.5/L$，观察目标值；(b) 关闭 FISTA 的重启动，观察目标值的非单调性与收敛速度；(c) 把 $\lambda$ 取 $\lambda_{\max}$ 的 $5\%$、$20\%$、$50\%$，观察非零个数与真实支撑重合。给出代码、输出与结论。

::: details 参考答案
```python
import numpy as np

def soft(v, t):
    return np.sign(v) * np.maximum(np.abs(v) - t, 0.0)

rng = np.random.default_rng(0)
n, d, s = 200, 150, 30
Z = rng.normal(size=(n, d))
X = Z.copy()
for j in range(1, d):
    X[:, j] = 0.9 * X[:, j - 1] + np.sqrt(1 - 0.81) * Z[:, j]
X /= np.sqrt(n)
w_true = np.zeros(d)
idx = rng.choice(d, s, replace=False)
w_true[idx] = rng.normal(size=s) * 2
y = X @ w_true + 0.1 * rng.normal(size=n)
L = float(np.linalg.eigvalsh(X.T @ X).max())
grad = lambda w: X.T @ (X @ w - y)

# (a) 步长扫描
lam = 0.05 * float(np.abs(X.T @ y).max())
def obj(w):
    return 0.5 * float(np.sum((X @ w - y) ** 2)) + lam * float(np.sum(np.abs(w)))
for factor in [1.0, 2.0, 2.5]:
    w = np.zeros(d)
    hist = []
    for k in range(201):
        if k in (0, 10, 50, 200):
            hist.append((k, obj(w)))
        w = soft(w - factor * grad(w) / L, factor * lam / L)
    print(f"步长 {factor}/L: " + "  ".join(f"k={k}: {v:.4e}" for k, v in hist))

# (b) FISTA 不重启动
w = np.zeros(d); w_prev = w.copy(); theta = 1.0
vals = []
for k in range(601):
    w_new = soft(w - grad(w) / L, lam / L)
    theta_new = 0.5 * (1 + np.sqrt(1 + 4 * theta ** 2))
    w = w_new + ((theta - 1) / theta_new) * (w_new - w_prev)
    theta = theta_new
    w_prev = w_new
    vals.append(obj(w))
print(f"FISTA（不重启动）: k=100: {vals[100]:.10f}, k=200: {vals[200]:.10f}, "
      f"k=400: {vals[400]:.10f}, k=600: {vals[600]:.10f}")
print(f"  上升次数 = {int(np.sum(np.diff(vals) > 0))}, "
      f"最大上升量 = {np.max(np.maximum(np.diff(vals), 0)):.3e}")

# (c) lambda 扫描
for ratio in [0.05, 0.2, 0.5]:
    lam = ratio * float(np.abs(X.T @ y).max())
    w_cd = np.zeros(d); cols = np.sum(X ** 2, axis=0)
    for sweep in range(3000):
        w_old = w_cd.copy()
        for j in range(d):
            r = y - X @ w_cd + X[:, j] * w_cd[j]
            rho = X[:, j] @ r
            w_cd[j] = np.sign(rho) * max(abs(rho) - lam, 0.0) / cols[j]
        if np.max(np.abs(w_cd - w_old)) < 1e-13:
            break
    nz = np.abs(w_cd) > 1e-10
    overlap = len(set(np.nonzero(nz)[0]) & set(idx))
    print(f"lambda = {ratio:.2f} * lambda_max = {lam:.6f}: 目标 = {obj(w_cd):.6f}, "
          f"非零个数 = {int(nz.sum())}, 真实支撑重合 = {overlap}/{s}, 轮数 = {sweep}")
```

输出：

```text
步长 1.0/L: k=0: 5.1418e+01  k=10: 1.6209e+01  k=50: 1.2085e+01  k=200: 1.0495e+01
步长 2.0/L: k=0: 5.1418e+01  k=10: 1.4009e+01  k=50: 1.1089e+01  k=200: 1.0219e+01
步长 2.5/L: k=0: 5.1418e+01  k=10: 3.0796e+02  k=50: 3.2209e+13  k=200: 2.1631e+66
FISTA（不重启动）: k=100: 10.1691783668, k=200: 10.1672728877, k=400: 10.1670643186, k=600: 10.1670608225
  上升次数 = 193, 最大上升量 = 6.512e-03
lambda = 0.05 * lambda_max = 0.247763: 目标 = 10.167059, 非零个数 = 34, 真实支撑重合 = 18/30, 轮数 = 259
lambda = 0.20 * lambda_max = 0.991050: 目标 = 28.652776, 非零个数 = 22, 真实支撑重合 = 14/30, 轮数 = 187
lambda = 0.50 * lambda_max = 2.477625: 目标 = 44.784009, 非零个数 = 9, 真实支撑重合 = 4/30, 轮数 = 138
```

**结论**：(a) 近端梯度法对步长的容忍度是 $t < 2/L$（$L$ 为光滑部分的梯度 Lipschitz 常数），$2/L$ 时仍收敛且在测试的 $200$ 步内比 $1/L$ 更快（$1.0219 \times 10^1$ 对 $1.0495 \times 10^1$），$2.5/L$ 时目标值在第 $50$ 步就涨到 $3.2 \times 10^{13}$ 并发散。实现中取 $1/L$（保证下降引理的保守选择）或用回溯线搜索，不要凭经验放大步长。

(b) 不重启动的 FISTA 目标值有 $193$ 次上升（相邻两步之间），最大上升量 $6.5 \times 10^{-3}$，在 $k = 600$ 时目标约为 $10.1670608$，比带重启动的版本（$k = 400$ 时相对次优 $2.2 \times 10^{-13}$）差多个数量级。非单调性本身不破坏收敛性（$O(1/k^2)$ 的界针对目标值的下包络），但会让**以函数值不再下降为判据**的终止条件失效，动量误差的累积也会拖慢后期的精度。重启动把这两个问题一起解决。

(c) $\lambda$ 从 $5\%$ 增到 $50\%$ 时，非零个数从 $34$ 降到 $9$，真实支撑重合从 $18$ 降到 $4$、目标值从 $10.17$ 升到 $44.78$。$\lambda$ 越大解越稀疏，同时漏掉的真实系数越多：正则化在**少留变量**与**不漏信号**之间的权衡由 $\lambda$ 控制，这就是需要交叉验证或信息准则来选点的原因。回看第一组数字，$\lambda$ 取 $5\%$ 时已有 $12$ 个真实系数被压缩到零（$30 - 18$）与 $16$ 个假阳性，说明即使偏小的取值也会带来两类误差，样本量或设计矩阵改善才会真正提高支撑恢复的准确性。
:::

### 第 4 题 综合应用

一个推荐系统要对 $10^6 \times 10^5$ 的评分矩阵做低秩矩阵补全，模型为 $\min_{Z} \frac{1}{2}\|\mathcal{P}_\Omega(Z - Y)\|^2 + \lambda\|Z\|_*$，其中 $\mathcal{P}_\Omega$ 是观测位置的选择算子，$\|\cdot\|_*$ 是核范数。请给出求解方案：选择算法（近端梯度、ADMM、Frank-Wolfe 中的哪一个）、每步的核心运算、停止判据与三个工程要点；并说明核范数的近端算子为什么可行，以及它与 $L_1$ 近端算子的关系。

::: details 参考答案
**算法选择**：核范数的近端算子（奇异值软阈值，也称为 SVT）有闭式解，问题结构正好是**光滑项 + 近端可算的非光滑项**，因此近端梯度法与 ADMM 都适用。推荐用近端梯度或它的加速版本：每步只需要一次部分观测上的梯度计算与一次（截断）SVD；ADMM 的另一个子问题是投影到观测约束，收敛快但需要调 $\rho$ 且每步要解一次最小二乘。数据规模到 $10^5$ 列、需要分布式或流式处理时，Frank-Wolfe 也是候选（每步只求最大奇异三元组，内存与代价更低，输出天然低秩）。

**每步的核心运算**：梯度项 $\mathcal{P}_\Omega(Z - Y)$ 的代价与观测量成正比；SVD 的代价为 $O(\min(m,n)^2\max(m,n))$。低秩解意味着在收敛区域只有少数奇异值需要计算，用截断的 Lanczos 或随机 SVD（randomized SVD）把代价再降一到两个数量级，这也是大规模实现的关键。

**停止判据**：用相对目标值变化与近端梯度映射的范数 $\|Z - \text{prox}(Z - \nabla f(Z))\|/\|Z\|$（映射为零即最优性条件成立）；ADMM 用原始与对偶两类残差。观测比例很低时目标值下降会很慢，此时同时监控验证集上的召回指标。

**核范数的近端算子**：$\text{prox}_{t\|\cdot\|_*}(V) = U\,\text{diag}(\text{soft}(\sigma_i, t))\,V^T$（对奇异值做软阈值）。可行性的来源是核范数的定义：它是奇异值向量的 $L_1$ 范数，而 $L_1$ 的近端算子是软阈值，正交不变性把矩阵情形化归为奇异值上的逐分量问题。这一关系与 $L_1$ 情形完全平行：$L_1$ 惩罚分量的绝对值，近端算子把小的分量归零；核范数惩罚奇异值，近端算子把小的奇异值归零（矩阵的秩因此降低）。两者的共同根源是原子范数的对偶范数约束（$L_1$ 对应 $L_\infty$ 球，核范数对应谱范数球），Moreau 分解把它们各自的投影联系起来。

**三个工程要点**：对观测位置做归一化与偏差处理（用户与物品的固定效应先移除，剩下的部分才适合低秩假设）；$\lambda$ 沿路径从 $\lambda_{\max} = \|\mathcal{P}_\Omega(Y)\|_2$ 附近开始下降并热启动；评价不能只看训练目标，要用留出的观测做验证，因为低秩补全的过拟合（把噪声也拟合进低秩部分）在训练目标上不可见。
:::

## 常见错误

**错误 1 · 用次梯度法求解有近端算子的问题**

原因：次梯度法对非光滑问题的形式统一，但速率是 $O(1/\sqrt{k})$ 且步长必须衰减，与近端梯度法的 $O(1/k)$（加速后 $O(1/k^2)$）差距很大。本节的全变差例子中，次梯度法 $20000$ 步的目标值仍比 ADMM $654$ 步的解高出 $0.35$（相对 $1.2\%$）。另一个隐患是步长序列调不好时完全不收敛。

解决：只要 $g$ 的近端算子可算（$L_1$、$L_2$ 范数、示性函数、组范数、核范数都有闭式），就用近端梯度法。只有在近端算子与投影都不可算的场合（部分复合约束、一般非线性约束）才退回到次梯度或光滑化方法，且要用步长衰减与函数值下包络等技巧控制收敛。

**错误 2 · 把 FISTA 的目标值当作单调下降**

原因：动量外推使 FISTA 的目标值在接近最优解时会上升（练习题中 $193$ 次上升，最大 $6.5 \times 10^{-3}$）。若终止判据写成**连续若干步目标不再下降**，会在早期就误判为收敛；若用**最后一步的函数值**报告结果，报告值可能高于历史最小值。

解决：启用自适应重启动（外推方向与梯度方向不再同向时重置动量），或者维护目标值的历史最小值作为输出与判据。报告结果时同时给出重启动触发的次数，它是问题条件数的一个间接指标。

**错误 3 · ADMM 只看原始残差或把 $\rho$ 固定在极端值**

原因：原始残差度量约束违反，对偶残差度量最优性（乘子收敛）。只检查前者会把**解在约束面上但乘子未收敛**的状态当成收敛，此时输出的对偶信息（下界、灵敏度）不可用。$\rho$ 取极端值时两类残差的收敛速度严重失衡（本节实验中 $\rho = 0.05$ 的原始残差与 $\rho = 50$ 的对偶残差都高出中间取值四到八个数量级）。

解决：两类残差一起检查，并用相对判据（按数据尺度缩放）。$\rho$ 初值取问题尺度估计，迭代中按两类残差的比值自适应调整（相差一个数量级时把 $\rho$ 加倍或减半），$\rho$ 变化后同步缩放对偶变量。调整 $\rho$ 会改变线性系统的分解，需要重新分解或使用增量更新。

**错误 4 · 忽略 $L_1$ 正则化的收缩偏差**

原因：软阈值对超过阈值的分量也做平移（$|v| - t$），大系数被系统性压低，直接输出 Lasso 的解会低估真实效应的大小。这在稀疏恢复的支撑集正确、但系数幅度偏差较大的情形中尤为明显。

解决：使用 debiasing 两步法：先用 Lasso（或非凸正则）选支撑集，再在选出的支撑集上做无正则的最小二乘重新估计系数；或者用 MCP、SCAD 这类对大幅值无偏的非凸惩罚。报告结果时区分**选出的支撑集**与**系数估计**两个层面的精度，两者的误差来源与量级不同。