---
title: 3.9 无梯度优化与贝叶斯优化
sidebar:
  order: 9
---
# 3.9 无梯度优化与贝叶斯优化

前面八节的方法都要求能计算梯度或曲率：梯度下降、动量法、牛顿法与拟牛顿法、近端梯度、ADMM，全都建立在 $\nabla f$ 的可用性上。有一类问题不满足这个前提：目标函数是黑箱，只能求值，不能求导；或者梯度虽然存在但无法可靠计算（仿真程序的内部逻辑、含随机性的大规模评估）；或者单次求值的代价极高（训练一个模型、跑一次实验），梯度法动辄数千步的迭代预算根本不够。

这一类问题的求解方法统称**无梯度优化**（derivative-free optimization）或黑箱优化。目标函数只提供输入到输出的映射，算法只能利用函数值序列推测下一步的试探点。取舍与前面各节不同：梯度信息的丢失使收敛速度大幅下降（维度越高越严重），换来的是对问题的假设最少。

本节按方法的取样机制组织。3.9.1 给出问题设定与两个基线（网格搜索与随机搜索），它们的表现决定了其他方法值不值得用；3.9.2 讨论直接搜索（Nelder-Mead、模式搜索、Powell 方法）；3.9.3 讨论群体方法与进化策略，重点是 CMA-ES；3.9.4 讨论贝叶斯优化，用代理模型与采集函数把每次求值的信息利用到极致；3.9.5 把这些方法落到超参数调优这一主要应用场景。

## 3.9.1 黑箱问题与两个基线

### 问题设定

无梯度优化处理的问题形如

$$
\min_{\mathbf{x} \in \mathcal{X}} f(\mathbf{x})
$$

$f$ 的解析形式未知或不可用。可用的操作只有一次**求值**（query）：给定 $\mathbf{x}$，得到 $f(\mathbf{x})$（可能带噪声）。三个约束条件决定方法的选择：

**维度**。无梯度方法的代价随维度上升极快。这是没有梯度信息时必须付出的代价：梯度给出 $n$ 个方向上的局部信息，一次求值在无梯度设定下只给出一个标量。维度超过几十之后，大部分无梯度方法都退化到接近随机搜索的表现。

**预算**。求值次数有硬上限（实验次数、仿真时长、标注成本）。贝叶斯优化正是为**预算极小而单次求值极贵**的场景设计的；进化策略适合预算中等（数千到数百万次）的场景。

**噪声**。求值含随机性时（随机种子、测量误差），直接搜索与模式搜索的步长逻辑会失效（比较两个点的函数值时无法区分真实差异与噪声），需要重复求值与统计检验，或改用天然抗噪的 CMA-ES 与贝叶斯优化。

### 网格搜索与随机搜索

**网格搜索**在每一维上取固定数量的水平，枚举所有组合。它的代价是水平的维度次方：$d$ 维、每维 $m$ 个水平需要 $m^d$ 次求值。$m = 2$、$d = 6$ 时是 $64$ 次，$m = 3$、$d = 10$ 时已经接近 $6$ 万次。

**随机搜索**在搜索空间内独立均匀采样，预算用尽即停。它看起来更粗糙，但在高维问题上的表现通常严格优于网格搜索，原因是**有效维度往往远低于名义维度**：许多超参数对目标的实际影响很小，网格搜索把预算均匀铺在名义维度上，只有少数坐标轴的取值被真正区分开；随机搜索的每个样本都是新的坐标组合，在少数重要的维度上得到更多不同的取值。下面的实验直接量化这一差别。

```python
import numpy as np

def f_hp(x):
    # 6 维搜索空间，只有前两维影响目标
    return (x[0] - 0.3) ** 2 + (x[1] - 0.7) ** 2

d = 6
budget = 64
reps = 200
grid_best, rand_best = [], []
for r in range(reps):
    rng = np.random.default_rng(r)
    vals = np.linspace(0, 1, 2)
    best = np.inf
    for code in range(budget):
        idx = [(code >> j) & 1 for j in range(d)]
        x = np.array([vals[i] for i in idx])
        best = min(best, f_hp(x))
    grid_best.append(best)
    X = rng.random((budget, d))
    rand_best.append(min(f_hp(x) for x in X))
grid_best = np.array(grid_best); rand_best = np.array(rand_best)
print(f"预算 {budget} 次求值，{reps} 次重复：")
print(f"  网格搜索: 最好值均值 = {grid_best.mean():.4f}, 中位数 = {np.median(grid_best):.4f}")
print(f"  随机搜索: 最好值均值 = {rand_best.mean():.4f}, 中位数 = {np.median(rand_best):.4f}")
print(f"  随机搜索优于网格搜索的比例 = {np.mean(rand_best < grid_best):.2%}")
```

输出：

```text
预算 64 次求值，200 次重复：
  网格搜索: 最好值均值 = 0.1800, 中位数 = 0.1800
  随机搜索: 最好值均值 = 0.0050, 中位数 = 0.0037
  随机搜索优于网格搜索的比例 = 100.00%
```

网格搜索的结果可以精确算出：$2$ 个水平下每一维只能取 $0$ 或 $1$，前两维的最好组合是 $(x_1, x_2) = (0, 1)$，损失 $(0 - 0.3)^2 + (1 - 0.7)^2 = 0.18$。随机搜索的 $64$ 个样本在前两维上传遍连续区间，最好值的中位数为 $0.0037$，均值 $0.0050$；$200$ 次重复中随机搜索**每一次**都优于网格搜索。

这个实验的结论有明确的适用边界：当所有维度都同等重要且维度不高（不超过 $3$ 到 $4$）时，网格搜索的分层覆盖仍然有价值；维度上升或有效维度不确定时，随机搜索是更好的基线。任何更复杂的方法都应当先与随机搜索比较：如果它在给定预算内不能明显胜出，复杂方法的价值就不成立。这一比较在超参数调优的文献中反复出现，也适用于本节后面所有方法。

## 3.9.2 直接搜索方法

### Nelder-Mead 单纯形法

**Nelder-Mead 方法**（简称 NM，与线性规划的单纯形法同名但无关）维护 $d + 1$ 个点的**单纯形**，每步用更好的点替换最差的点。二维时单纯形是三角形，三维是四面体。单步由四种操作组成，参数取标准值（反射系数 $1$、扩张系数 $2$、收缩系数 $0.5$、整体收缩系数 $0.5$）：

设 $f_1 \leq f_2 \leq \cdots \leq f_{d+1}$，$\bar{\mathbf{x}}$ 是除最差点之外的质心。

**反射**：$\mathbf{x}_r = \bar{\mathbf{x}} + (\bar{\mathbf{x}} - \mathbf{x}_{d+1})$。若 $f_r$ 介于最好与次差之间，接受反射点。

**扩张**：反射点比当前最优点还好时，尝试更远的一点 $\mathbf{x}_e = \bar{\mathbf{x}} + 2(\bar{\mathbf{x}} - \mathbf{x}_{d+1})$，取 $f_r$ 与 $f_e$ 中更小者。

**收缩**：反射点比次差点还差时，在质心与最差点之间尝试 $\mathbf{x}_c = \bar{\mathbf{x}} + 0.5(\mathbf{x}_{d+1} - \bar{\mathbf{x}})$。

**整体收缩**：收缩也失败时，把所有点向最优点方向收缩一半：$\mathbf{x}_i \leftarrow \mathbf{x}_1 + 0.5(\mathbf{x}_i - \mathbf{x}_1)$。

NM 在低维光滑问题上表现很好（本例二维 Rosenbrock 中 $305$ 次求值达到 $10^{-25}$ 量级），但它没有收敛性保证：存在反例（McKinnon 构造的二维函数）使它收敛到非稳定点。这一缺点的实际含义是在高维或病态问题上要谨慎对待它的输出，配合多次重启。

### 模式搜索与收敛性

**模式搜索**（pattern search，也称坐标搜索、compass search）的每一步固定：在当前点附近沿各坐标方向以步长 $s$ 试探，$\mathbf{x} \pm s\mathbf{e}_i$ 中有更好的点就移动过去；所有方向都没有改进时把步长减半。它的结构极其简单，但具备 NM 缺少的收敛性：目标连续可微时，步长趋于零的极限点满足一阶最优性条件（$\nabla f = \mathbf{0}$）；目标仅 Lipschitz 连续时，极限点是方向导数为零的意义下的稳定点。这使模式搜索成为可靠的兜底方法。

模式搜索的代价是收敛慢。在强耦合或各维尺度悬殊的问题上，坐标方向的试探效率低：步长主要由最优方向上的进展决定，其他方向只能等待步长慢慢衰减。下面的对照实验把三种方法放在两个问题上比较。

```python
import numpy as np

def nelder_mead(fun, x0, budget=2000, tol=1e-12):
    n = len(x0)
    sim = [np.array(x0, dtype=float)]
    for i in range(n):
        p = np.array(x0, dtype=float); p[i] += 0.05
        sim.append(p)
    sim = np.array(sim)
    vals = np.array([fun(p) for p in sim])
    neval = n + 1
    while neval < budget:
        order = np.argsort(vals)
        sim, vals = sim[order], vals[order]
        if abs(vals[-1] - vals[0]) < tol * (abs(vals[0]) + tol):
            break
        centroid = sim[:-1].mean(axis=0)
        xr = centroid + (centroid - sim[-1]); fr = fun(xr); neval += 1
        if fr < vals[0]:
            xe = centroid + 2 * (centroid - sim[-1]); fe = fun(xe); neval += 1
            sim[-1], vals[-1] = (xe, fe) if fe < fr else (xr, fr)
        elif fr < vals[-2]:
            sim[-1], vals[-1] = xr, fr
        else:
            xc = centroid + 0.5 * (sim[-1] - centroid); fc = fun(xc); neval += 1
            if fc < vals[-1]:
                sim[-1], vals[-1] = xc, fc
            else:
                for i in range(1, n + 1):
                    sim[i] = sim[0] + 0.5 * (sim[i] - sim[0])
                    vals[i] = fun(sim[i]); neval += 2
    best = int(np.argmin(vals))
    return sim[best], vals[best], neval

def compass_search(fun, x0, budget=2000, step0=1.0):
    x = np.array(x0, dtype=float)
    fx = fun(x); neval = 1
    step = step0
    while neval < budget:
        improved = False
        for i in range(len(x)):
            for sgn in (1, -1):
                cand = x.copy(); cand[i] += sgn * step
                fc = fun(cand); neval += 1
                if fc < fx:
                    x, fx = cand, fc
                    improved = True
                    break
        if not improved:
            step *= 0.5
            if step < 1e-12:
                break
    return x, fx, neval

def random_search(fun, d, budget=2000, lo=-2.0, hi=2.0, seed=0):
    rng = np.random.default_rng(seed)
    best = np.inf
    for _ in range(budget):
        x = lo + (hi - lo) * rng.random(d)
        best = min(best, fun(x))
    return best, budget

rosen = lambda x: (1 - x[0]) ** 2 + 100 * (x[1] - x[0] ** 2) ** 2
print("Rosenbrock，起点 (-1.2, 1.0)，预算 2000：")
x, f, n = nelder_mead(rosen, np.array([-1.2, 1.0]), budget=2000)
print(f"  Nelder-Mead: {n} 次求值, f = {f:.3e}, 解 = ({x[0]:.6f}, {x[1]:.6f})")
x, f, n = compass_search(rosen, np.array([-1.2, 1.0]), budget=2000)
print(f"  模式搜索: {n} 次求值, f = {f:.3e}, 解 = ({x[0]:.6f}, {x[1]:.6f})")
f, n = random_search(rosen, 2, budget=2000)
print(f"  随机搜索: {n} 次求值, f = {f:.3e}")

rng = np.random.default_rng(7)
d10 = 10
Aq = rng.normal(size=(d10, d10)); Q, _ = np.linalg.qr(Aq)
M100 = Q @ np.diag(np.logspace(0, 2, d10)) @ Q.T      # 条件数 100 的旋转椭球
f100 = lambda x: float(x @ (M100 @ x))
print("10 维病态椭球（条件数 100），起点全 1，预算 2000：")
x, f, n = compass_search(f100, np.ones(d10), budget=2000)
print(f"  模式搜索: {n} 次求值, f = {f:.3e}")
f, n = random_search(f100, d10, budget=2000)
print(f"  随机搜索: {n} 次求值, f = {f:.3e}")
x, f, n = nelder_mead(f100, np.ones(d10), budget=2000)
print(f"  Nelder-Mead: {n} 次求值, f = {f:.3e}")
```

输出：

```text
Rosenbrock，起点 (-1.2, 1.0)，预算 2000：
  Nelder-Mead: 305 次求值, f = 8.600e-25, 解 = (1.000000, 1.000000)
  模式搜索: 2000 次求值, f = 8.634e-02, 解 = (0.706250, 0.498047)
  随机搜索: 2000 次求值, f = 1.191e-02
10 维病态椭球（条件数 100），起点全 1，预算 2000：
  模式搜索: 2002 次求值, f = 8.763e-12
  随机搜索: 2000 次求值, f = 1.997e+01
  Nelder-Mead: 2000 次求值, f = 1.267e-01
```

三组结果各说明一件事。

**NM 在低维光滑问题上效率最高**。Rosenbrock 的弯曲窄谷使坐标方向几乎无效，NM 靠单纯形的几何变形（沿谷底方向拉长）在 $305$ 次求值内达到 $10^{-25}$，解精确落在 $(1, 1)$。这是它成为 SciPy 等库默认无梯度方法的原因。

**模式搜索的优势在可分离或近可分离的问题上**。10 维椭球虽然病态（条件数 $100$），但坐标方向与特征方向重合，模式搜索用 $2002$ 次求值达到 $8.8 \times 10^{-12}$，远好于 NM 在同一预算下的 $1.3 \times 10^{-1}$。NM 在 $10$ 维空间中的单纯形变形能力不足（$11$ 个点要同时适应 $10$ 个方向的尺度差异），这是维度上升后 NM 失效的典型表现。

**随机搜索在两个问题上都不具竞争力**：Rosenbrock（$2$ 维）$2000$ 次求值得到 $1.2 \times 10^{-2}$，10 维椭球得到 $2.0 \times 10^{1}$（起点本身的值是 $10$ 量级，随机搜索几乎找不到更小的点）。这两个数字是本节其他方法的对照基准：低维时随机搜索能获得粗略进展，维度升高后完全失效。

## 3.9.3 进化策略与 CMA-ES

### 进化策略的基本形式

**进化策略**（evolution strategy）维护一个参数化的搜索分布（通常取多元正态分布 $\mathcal{N}(\mathbf{m}, \sigma^2\mathbf{C})$），每代采样若干个候选点，按函数值排序，用更好的点更新分布的参数。与直接搜索相比，它同时调整**在哪里搜索**（均值 $\mathbf{m}$）与**搜索的形状**（协方差 $\mathbf{C}$、步长 $\sigma$）。

两种选择策略：(μ, λ)-ES 只用当前代的 λ 个子代中最好的 μ 个更新分布（父代不进入选择），(μ + λ)-ES 把父代与子代放在一起选。前者抗噪、避免停滞，后者收敛更快。

**1/5 成功规则**是最早的步长自适应方法：统计最近若干代的改进比例，超过 $1/5$ 时增大步长，低于时减小步长。它的动机是理论结论：在近似线性或球形的问题上，最优的改进比例约为 $1/5$。这一规则引出后来的协方差自适应方法。

### CMA-ES

**CMA-ES**（covariance matrix adaptation evolution strategy）把**如何调整分布的形状**做成完整的算法，是中等维度（$10$ 到几百维）无梯度优化的标准方法。一次迭代（一代）的流程：

**采样**。$\mathbf{x}_i = \mathbf{m} + \sigma\mathbf{y}_i$，其中 $\mathbf{y}_i \sim \mathcal{N}(\mathbf{0}, \mathbf{C})$，$\mathbf{C} = \mathbf{B}\mathbf{D}^2\mathbf{B}^T$ 是协方差的特征分解（用 $\mathbf{y} = \mathbf{B}\mathbf{D}\mathbf{z}$、$\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 实现）。

**选择与重组**。按函数值排序，取最好的 $\mu = \lambda/2$ 个，用权重 $w_i$（对数递减，和为 $1$）更新均值：$\mathbf{m}_{\text{new}} = \sum_{i=1}^{\mu} w_i\mathbf{x}_{i;\lambda}$。

**步长自适应**。维护演化路径 $\mathbf{p}_\sigma$（累积的均值移动方向，白化后），比较它与标准正态的期望长度 $\mathrm{E}\|\mathcal{N}(\mathbf{0}, \mathbf{I})\|$：路径比期望长说明步长偏小，缩短则说明步长偏大。更新为 $\sigma \leftarrow \sigma\exp\left(\frac{c_\sigma}{d_\sigma}\left(\frac{\|\mathbf{p}_\sigma\|}{\mathrm{E}\|\mathcal{N}\|} - 1\right)\right)$。

**协方差自适应**。两个更新叠加。秩一更新用演化路径 $\mathbf{p}_c$ 沿历史移动方向拉长分布（累积了多代的信息，等价于在目标函数的**好方向**上加速）；秩 $\mu$ 更新用当前代最好若干个样本的实际散布形状修正分布。更新式为

$$
\mathbf{C} \leftarrow (1 - c_1 - c_\mu)\mathbf{C} + c_1\left(\mathbf{p}_c\mathbf{p}_c^T + \delta(h_\sigma)\mathbf{C}\right) + c_\mu\sum_{i=1}^{\mu} w_i\mathbf{y}_{i;\lambda}\mathbf{y}_{i;\lambda}^T
$$

所有学习率（$c_1$、$c_\mu$、$c_\sigma$、$c_c$、$d_\sigma$）都由维度 $d$ 与有效选择质量 $\mu_{\text{eff}} = 1/\sum w_i^2$ 计算，不需要手工调参。

CMA-ES 的两个性质使它难以被替代：**不变性**（对搜索空间的正交变换与平移不变，即问题被旋转不改变算法行为；对单调尺度变换的处理由步长自适应负责）与**对病态问题的稳健性**（协方差矩阵自动学习问题的尺度方向）。默认群体大小为 $\lambda = 4 + \lfloor 3\ln d \rfloor$，$d = 10$ 时为 $10$，$d = 100$ 时为 $17$。

### 数值实验：病态椭球上的对比

取 $10$ 维旋转椭球 $f(\mathbf{x}) = \mathbf{x}^T M\mathbf{x}$，$M$ 的特征值在 $1$ 到 $10^4$ 之间对数分布、特征方向随机。条件数 $10^4$ 意味着最陡方向的曲率是最平方向的 $10^4$ 倍，坐标方向与特征方向不重合。起点取全 $1$ 向量，三种方法各给 $4000$ 次求值预算。

```python
import numpy as np

def cma_es(fun, x0, sigma0, budget=4000, seed=0):
    n = len(x0)
    lam = 4 + int(3 * np.log(n))
    mu = lam // 2
    w = np.log(mu + 0.5) - np.log(np.arange(1, mu + 1))
    w = w / w.sum()
    mueff = 1.0 / np.sum(w ** 2)
    cc = (4 + mueff / n) / (n + 4 + 2 * mueff / n)
    cs = (mueff + 2) / (n + mueff + 5)
    ds = 1 + 2 * max(0, np.sqrt((mueff - 1) / (n + 1)) - 1) + cs
    c1 = 2 / ((n + 1.3) ** 2 + mueff)
    cmu = min(1 - c1, 2 * (mueff - 2 + 1 / mueff) / ((n + 2) ** 2 + mueff))
    chiN = np.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n ** 2))
    rng = np.random.default_rng(seed)
    xmean = np.array(x0, dtype=float)
    C = np.eye(n); sigma = sigma0
    pc = np.zeros(n); ps = np.zeros(n)
    best_x, best_f = xmean.copy(), fun(xmean)
    neval = 1
    gen = 0
    while neval < budget:
        gen += 1
        D, B = np.linalg.eigh(C)
        D = np.sqrt(np.maximum(D, 1e-30))
        X = xmean + sigma * (rng.normal(size=(lam, n)) @ np.diag(D) @ B.T)
        fvals = np.array([fun(x) for x in X]); neval += lam
        idx = np.argsort(fvals)
        if fvals[idx[0]] < best_f:
            best_f = fvals[idx[0]]; best_x = X[idx[0]].copy()
        xold = xmean.copy()
        xmean = np.sum(w[:, None] * X[idx[:mu]], axis=0)
        ymean = (xmean - xold) / sigma
        ps = (1 - cs) * ps + np.sqrt(cs * (2 - cs) * mueff) * (B @ ((D ** -1) * (B.T @ ymean)))
        hsig = (np.linalg.norm(ps) / np.sqrt(1 - (1 - cs) ** (2 * gen)) / chiN
                < 1.4 + 2 / (n + 1))
        pc = (1 - cc) * pc + hsig * np.sqrt(cc * (2 - cc) * mueff) * ymean
        artmp = (X[idx[:mu]] - xold) / sigma
        C = ((1 - c1 - cmu) * C
             + c1 * (np.outer(pc, pc) + (1 - hsig) * cc * (2 - cc) * C)
             + cmu * (artmp.T @ (w[:, None] * artmp)))
        sigma = sigma * np.exp((cs / ds) * (np.linalg.norm(ps) / chiN - 1))
    return best_x, best_f, neval

f_sphere = lambda x: float(x @ x)
x, f, n = cma_es(f_sphere, np.ones(10), 1.0, budget=2000)
print(f"10 维球函数：CMA-ES {n} 次求值, f = {f:.3e}")

rng = np.random.default_rng(7)
d10 = 10
Aq = rng.normal(size=(d10, d10)); Q, _ = np.linalg.qr(Aq)
M1e4 = Q @ np.diag(np.logspace(0, 4, d10)) @ Q.T
f1e4 = lambda x: float(x @ (M1e4 @ x))
print("10 维旋转椭球（条件数 1e4），起点全 1，预算 4000：")
x, f, n = cma_es(f1e4, np.ones(d10), 1.0, budget=4000)
print(f"  CMA-ES: {n} 次求值, f = {f:.3e}")
x, f, n = compass_search(f1e4, np.ones(d10), budget=4000)      # 取 3.9.2 节的实现
print(f"  模式搜索: {n} 次求值, f = {f:.3e}")
x, f, n = nelder_mead(f1e4, np.ones(d10), budget=4000)         # 取 3.9.2 节的实现
print(f"  Nelder-Mead: {n} 次求值, f = {f:.3e}")
```

输出：

```text
10 维球函数：CMA-ES 2001 次求值, f = 1.128e-12
10 维旋转椭球（条件数 1e4），起点全 1，预算 4000：
  CMA-ES: 4001 次求值, f = 6.010e-12
  模式搜索: 4004 次求值, f = 6.450e-01
  Nelder-Mead: 4000 次求值, f = 2.350e+00
```

球函数上的对照说明算法本身正常工作：$2001$ 次求值把 $10$ 维问题的目标值降到 $10^{-12}$，步长与协方差的初始设定不需要人工调整。病态椭球上的差距是本节最清楚的一组数据：条件数从 $100$ 提高到 $10^4$ 并引入旋转之后，模式搜索从 $8.8 \times 10^{-12}$ 退到 $6.5 \times 10^{-1}$（步长只能沿着坐标轴收缩，需要极小步长才能接近最优点），NM 停在 $2.35$（单纯形的方向调整跟不上旋转的尺度结构），CMA-ES 仍达到 $6.0 \times 10^{-12}$。协方差矩阵在这里的作用就是 3.3 节讨论过的**变量缩放**：它把病态的方向结构自动估计出来并消除，这类自适应在没有梯度的情形下尤为重要。

::: warning CMA-ES 的代价与适用边界
CMA-ES 每代需要一次 $d \times d$ 矩阵的特征分解（$O(d^3)$），内存为 $O(d^2)$，这些开销在 $d$ 超过几千时不可接受（需要对角线版本或分块版本）。求值次数也不小：本例的 $4000$ 次求值对十维问题算多，对每秒能跑数千次的仿真可以接受，对每次求值耗时数小时的实验则完全不可行。后者正是贝叶斯优化的场景。
:::

## 3.9.4 贝叶斯优化

### 代理模型

**贝叶斯优化**（Bayesian optimization）针对的是求值次数只有几十次的情形。它的做法是用一个**代理模型**（surrogate model）拟合已知的求值结果，用模型的不确定性指导下一步在哪里取样，使每次求值的信息利用率最大化。

最常用的代理模型是**高斯过程回归**（Gaussian process regression）。给定已有的观测 $\{(\mathbf{x}_i, y_i)\}_{i=1}^{n}$，高斯过程假定任意有限个点的函数值服从联合正态分布，由均值函数（通常取零）与核函数 $k(\cdot, \cdot)$ 完全确定。常用的核是平方指数（RBF）核

$$
k(\mathbf{x}, \mathbf{x}') = \exp\left(-\frac{\|\mathbf{x} - \mathbf{x}'\|^2}{2\ell^2}\right)
$$

$\ell$ 是**长度尺度**，控制函数被认为是多平滑：$\ell$ 小则模型认为函数变化快，$\ell$ 大则认为是缓慢变化的趋势。给定观测，后验分布仍是正态的，均值与方差有闭式：

$$
\mu(\mathbf{x}) = \mathbf{k}(\mathbf{x})^T(\mathbf{K} + \sigma_n^2\mathbf{I})^{-1}\mathbf{y}, \qquad
s^2(\mathbf{x}) = k(\mathbf{x}, \mathbf{x}) - \mathbf{k}(\mathbf{x})^T(\mathbf{K} + \sigma_n^2\mathbf{I})^{-1}\mathbf{k}(\mathbf{x})
$$

其中 $\mathbf{K}_{ij} = k(\mathbf{x}_i, \mathbf{x}_j)$，$\sigma_n^2$ 是观测噪声方差，$\mathbf{k}(\mathbf{x})$ 是新点与观测点的核值向量。均值给出对函数值的预测，方差给出不确定性的度量：远离所有观测点的位置方差接近先验方差（$1$），观测点附近方差接近噪声水平。拟合的代价是 $O(n^3)$（矩阵求逆或 Cholesky 分解，$n$ 为已有观测数）。

长度尺度不是预先知道的，标准做法是最大化**对数边际似然**（log marginal likelihood）：

$$
\log p(\mathbf{y}) = -\frac{1}{2}\mathbf{y}^T(\mathbf{K} + \sigma_n^2\mathbf{I})^{-1}\mathbf{y} - \frac{1}{2}\log|\mathbf{K} + \sigma_n^2\mathbf{I}| - \frac{n}{2}\log 2\pi
$$

三项分别对应拟合优度、模型的复杂度惩罚与常数。在若干候选长度尺度上比较这一值（或做梯度优化），选出的 $\ell$ 反映数据中实际的相关尺度。这一机制使高斯过程同时完成拟合与模型选择，是它相对其他代理模型的主要优势。

### 采集函数

有了后验均值与方差，下一步取样点的选择由**采集函数**（acquisition function）决定。它把**预测值好**与**不确定性大**两个诉求编码成一个标量，最大化它得到下一个求值点。

**期望改进**（Expected Improvement，EI）。设当前最小观测值为 $f_{\text{best}}$，新点的函数值服从 $\mathcal{N}(\mu, s^2)$。定义改进量 $I = \max(f_{\text{best}} - f, 0)$（这里以最小化为例，$f_{\text{best}} - f$ 为正才构成改进），则

$$
\text{EI}(\mathbf{x}) = \mathbb{E}[I] = (f_{\text{best}} - \mu)\Phi(z) + s\,\phi(z), \qquad z = \frac{f_{\text{best}} - \mu}{s}
$$

其中 $\Phi$ 与 $\phi$ 是标准正态的分布函数与密度函数。第一项奖励预测值好的点（利用），第二项奖励方差大的点（探索），两者的平衡由 $z$ 自动调节：$\mu$ 远小于 $f_{\text{best}}$ 时第一项主导，$\mu$ 接近或超过 $f_{\text{best}}$ 时第二项主导。

**置信界**（UCB 与 LCB）。取 $\mu(\mathbf{x}) + \kappa s(\mathbf{x})$（最大化问题）或 $\mu(\mathbf{x}) - \kappa s(\mathbf{x})$（最小化问题），$\kappa$ 显式控制探索强度。$\kappa = 0$ 退化为纯利用（跟随后验均值），$\kappa$ 大则倾向于高方差的未探索区域。这一族函数计算最简单，适合作为快速实现与对照。

**熵搜索与知识梯度**。它们把**减少最优解位置的不确定性**直接作为目标（信息增益的期望），性能通常更好但计算代价高（需要估计后验分布中最小点位置的信息熵）。**汤普森采样**是另一种简单有效的替代：从后验分布中采样一个函数实现，最大化它。它的实现代价低，天然支持批量与并行（每次采样一个函数实现）。

### 数值实验：与随机搜索的对比

在一维函数上做对照。目标函数有两个高斯型凹陷：宽而浅的局部极小在 $x = 0.2$ 附近（值约 $-1.0$），窄而深的全局极小在 $x = 0.8$ 附近（值约 $-1.2$）。全局极小的宽度只有 $0.05$，随机采样命中它附近的概率低，正好用来区分**利用模型信息**与**盲采样**。

```python
import numpy as np
import math

def f_bo(x):
    x = float(np.asarray(x).ravel()[0])
    return -(np.exp(-((x - 0.2) / 0.1) ** 2) + 1.2 * np.exp(-((x - 0.8) / 0.05) ** 2))

def kern(A, B, Ls):
    d2 = (A[:, None, :] - B[None, :, :]) ** 2
    return np.exp(-0.5 * np.sum(d2, axis=-1) / Ls ** 2)

def gp_posterior(X, y, Xs, Ls, noise=1e-8):
    K = kern(X, X, Ls) + noise * np.eye(len(X))
    L = np.linalg.cholesky(K)
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    Ks = kern(X, Xs, Ls)
    mu = Ks.T @ alpha
    v = np.linalg.solve(L, Ks)
    return mu, np.sqrt(np.maximum(1 - np.sum(v ** 2, axis=0), 1e-12))

def margin_ll(X, y, Ls):
    K = kern(X, X, Ls) + 1e-8 * np.eye(len(X))
    L = np.linalg.cholesky(K)
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    return float(-0.5 * y @ alpha - np.sum(np.log(np.diag(L))))

def ei(mu, sd, fbest, xi=0.01):
    z = (fbest - mu - xi) / sd
    Phi = 0.5 * (1 + np.vectorize(math.erf)(z / np.sqrt(2)))
    phi = np.exp(-0.5 * z ** 2) / np.sqrt(2 * np.pi)
    return (fbest - mu - xi) * Phi + sd * phi

def run_bo(seed, n_total=33, n_init=3, grid=2001):
    rng = np.random.default_rng(seed)
    xs = np.linspace(0, 1, grid).reshape(-1, 1)
    X = rng.random((n_init, 1))
    y = np.array([f_bo(x) for x in X])
    hist = {}
    pts = [float(v) for v in X.ravel()]
    for k in range(n_total - n_init):
        best_ls, best_ll = None, -np.inf
        for Ls in [0.02, 0.03, 0.05, 0.1, 0.2, 0.4]:
            ll = margin_ll(X, y, Ls)
            if ll > best_ll:
                best_ll, best_ls = ll, Ls
        mu, sd = gp_posterior(X, y, xs, best_ls)
        vals = ei(mu, sd, y.min()) + 1e-6 * rng.random(len(xs))   # 抖动打破平局
        x_new = xs[int(np.argmax(vals))]
        y = np.append(y, f_bo(x_new))
        X = np.vstack([X, x_new])
        pts.append(float(x_new.ravel()[0]))
        hist[n_init + k + 1] = y.min()
    return hist, pts

def run_random(seed, n_total=33):
    rng = np.random.default_rng(seed)
    y = np.inf
    hist = {}
    for k in range(1, n_total + 1):
        y = min(y, f_bo(rng.random()))
        hist[k] = y
    return hist

bo_res = [run_bo(s) for s in range(10)]
rnd_res = [run_random(s) for s in range(10)]
print("一维函数（全局最小值约 -1.2 在 x = 0.8），10 次重复，每次 33 次求值：")
for k in (5, 10, 20, 33):
    print(f"  求值 {k:>2} 次: 贝叶斯优化 = {np.mean([h[k] for h, _ in bo_res]):.4f}, "
          f"随机搜索 = {np.mean([h[k] for h in rnd_res]):.4f}")
target = -1.19
bh = [next((k for k in sorted(h) if h[k] <= target), None) for h, _ in bo_res]
rh = [next((k for k in sorted(h) if h[k] <= target), None) for h in rnd_res]
print(f"  达到 {target} 以内：贝叶斯优化 {np.mean([x is not None for x in bh]):.0%}"
      f"（成功时平均 {np.mean([x for x in bh if x]):.1f} 次）, "
      f"随机搜索 {np.mean([x is not None for x in rh]):.0%}"
      f"（成功时平均 {np.mean([x for x in rh if x]):.1f} 次）")
print("一次运行的采样点序列（前 3 个为初始点）：")
print("  " + "  ".join(f"{p:.3f}" for p in bo_res[0][1]))
```

输出：

```text
一维函数（全局最小值约 -1.2 在 x = 0.8），10 次重复，每次 33 次求值：
  求值  5 次: 贝叶斯优化 = -0.8869, 随机搜索 = -0.8781
  求值 10 次: 贝叶斯优化 = -1.0985, 随机搜索 = -1.0561
  求值 20 次: 贝叶斯优化 = -1.1980, 随机搜索 = -1.1474
  求值 33 次: 贝叶斯优化 = -1.1990, 随机搜索 = -1.1474
  达到 -1.19 以内：贝叶斯优化 100%（成功时平均 13.8 次）, 随机搜索 30%（成功时平均 6.3 次）
一次运行的采样点序列（前 3 个为初始点）：
  0.637  0.270  0.041  1.000  0.400  0.206  0.819  0.871  0.777  0.152  0.800  0.520  0.331  0.101  0.942  0.579  0.460  0.000  0.696  0.233  0.704  0.183  0.921  0.942  0.580  0.826  0.951  0.146  0.854  0.146  0.391  0.334  0.322
```

三点观察。

**样本效率的差别**。$10$ 次求值内贝叶斯优化已经到达 $-1.10$，随机搜索停在 $-1.06$；$20$ 次求值内贝叶斯优化到 $-1.198$（距全局最优 $0.002$），随机搜索在 $-1.147$ 附近；$33$ 次求值后两者的最好值分别是 $-1.199$ 与 $-1.147$。以**达到 $-1.19$ 以内**为标准，贝叶斯优化 $10$ 次重复全部成功（平均 $13.8$ 次求值），随机搜索只有 $30\%$ 成功。样本效率的差距是贝叶斯优化的全部意义所在：在单次求值昂贵的场景下，$30\%$ 与 $100\%$ 的成功率差别对应十几小时的计算或实验。

**采样序列的结构**。一次运行的采样点序列呈现三段模式：前三个随机初始点（$0.637$、$0.270$、$0.041$），中间阶段在 $[0, 1]$ 上较均匀地铺开（探索，把 GP 的方差压下去），后期集中在 $0.8$ 附近（$0.819$、$0.871$、$0.777$、$0.800$，利用）。这一**先探索后收敛**的形态与 3.8 节鞍点实验中的逃逸过程形成对照：两者都是**先收集信息再集中**的迭代，但贝叶斯优化把探索的分配显式写进了采集函数。

**随机搜索的成功率并不为零**。$30\%$ 的重复在 $33$ 次求值内偶然命中窄峰（平均只用 $6.3$ 次就命中），说明在低维、目标结构简单时盲采样的运气成分仍然可观。这也提示评估贝叶斯优化时必须给出重复次数与成功率，单次实验的结论不可靠。

::: warning 采集函数的两个实现细节
其一是**平局与数值塌缩**：当所有候选点的 EI 都接近零（模型认为没有改进可能）时，$\arg\max$ 会被浮点噪声决定，同一候选点可能被反复选中。上面的代码用 $10^{-6}$ 的随机抖动打破平局，实践中更稳妥的做法是对 EI 取对数（log-EI）或用带探索项的采样规则。其二是**重复点的处理**：严格来说采集函数在最优点附近会持续推荐同一个点，实现时要么把已求值点的方差真的压到零（噪声项 $\sigma_n^2$ 不能取 $0$，否则 Cholesky 分解失败），要么显式屏蔽已求值点。
:::

## 3.9.5 超参数调优实践

### 搜索空间的设计

超参数调优是黑箱优化的主要应用。搜索空间的设计对结果的影响往往大于算法的选择。

**尺度**。学习率、正则系数、噪声强度这类参数应当在对数尺度上搜索：$10^{-4}$ 到 $10^{-1}$ 的区间里，线性网格会把 $90\%$ 的预算放在 $10^{-2}$ 以上，而最优点常常在对数中点附近。具体做法是采样 $\log_{10}\eta \sim U(-4, -1)$ 再取幂，等价于对数均匀分布。

**类型**。连续参数（学习率、权重衰减、动量）、整数参数（层数、注意力头数）、类别参数（优化器、激活函数、初始化方式）混合存在。类别参数用均匀采样，整数参数在合理的范围内采样后取整，且注意尺度（层数用线性尺度，批量大小用对数尺度或按 $2$ 的幂采样）。

**条件参数**。某些参数只在另一些参数取特定值时有意义（用了某个优化器才有对应的参数），处理方式是条件搜索空间：先采样上层参数，再按条件采样下层参数。忽略条件会让大量试点的下层参数落在无效组合上。

### 预算分配：连续减半与 Hyperband

给定固定的总预算（GPU 小时数），两种使用方式：一是给每个配置完整的训练预算（$n$ 个配置各训练到底），二是先用小预算筛掉大部分配置、只给少量配置完整预算。后者称为多保真优化，代表性方法有**连续减半**（successive halving）与 **Hyperband**。

连续减半的流程：先均匀采样 $n$ 个配置，各用最小预算 $r$ 训练；保留表现最好的一半，把预算加倍；重复直到只剩一个配置。总代价约为 $2n\cdot r$（几何级数求和）。**中位数停止规则**是它的在线版本：训练中如果某个配置的验证指标低于已完成配置在同一时刻的中位数，立即终止。

Hyperband 修正了连续减半的一个缺陷（当最小预算 $r$ 相对总预算太小、或好配置在早期表现差时，会被过早淘汰）：它在**多配置少预算**与**少配置多预算**两种极端之间设置若干档，把总预算分配给这些档并行运行。实践中 Hyperband 的表现稳定优于固定预算的随机搜索，是超参数调优的常用基线。

### 代理模型的选择

**TPE**（tree-structured Parzen estimator）与 **SMAC** 使用非高斯过程代理：TPE 用两个核密度估计分别建模**表现好**与**表现差**的配置分布，用它们的比值作为采集函数；SMAC 用随机森林回归，适合含大量类别与条件参数的空间。选择依据是空间的类型组成：连续、低维、求值预算几十次时高斯过程加 EI 最合适；含大量离散与条件参数、观测数上百时树模型更稳健；维度继续升高（几十维以上）时，全局代理模型都会失效，需要回到随机搜索、CMA-ES 或局部贝叶斯优化（在信任域内维护局部 GP）。

### 与内层训练的分工

超参数调优的调用结构是两级嵌套：内层用 3.4 到 3.8 节的方法训练模型参数，外层用本节的算法搜索超参数。两层的时间尺度相差几个数量级（内层数千到数百万步梯度更新，外层几十到几百次试验），因此优化方法的取舍完全不同：内层依赖梯度的效率，外层依赖样本效率与并行性。

外层实验还需要注意**验证集过拟合**：反复用同一验证集选择配置，最终的报告指标会系统性偏高。做法是保留一个从未参与选择的测试集用于最终报告，或者用嵌套交叉验证估计选择过程本身的方差。另外，超参数搜索的结果常常是**一片平坦区域**而非单点最优：报告最优配置附近的若干近优配置比报告单点更稳健，也更有参考价值。

::: tip 什么时候不必用贝叶斯优化
贝叶斯优化的价值来自**每次求值昂贵 + 预算极小**。三种情形下它并不划算：预算充足（数百次以上）时随机搜索或 CMA-ES 的期望表现相当且无需维护代理模型；维度很高时全局 GP 失效，需要局部方法或直接换用进化策略；需要大规模并行时异步贝叶斯优化实现复杂，而随机搜索与 CMA-ES 天然并行。判断标准是单位求值成本乘以预算：总成本低时用简单方法，把复杂度留给真正昂贵的场景。
:::

## 3.9.6 本节小结

::: success 无梯度优化的方法地图
本节按取样机制组织了四类方法。基线与判决标准：随机搜索在低维问题上有可观的运气成分，在 $10$ 维椭球上完全失效（$2000$ 次求值后目标值 $2.0 \times 10^1$），任何更复杂的方法都应当先与它比较；网格搜索在有效维度低时被随机搜索全面压过（预算 $64$ 次、$200$ 次重复中随机搜索 $100\%$ 胜出，最好值均值 $0.005$ 对 $0.180$）。直接搜索中，Nelder-Mead 在低维光滑问题上效率最高（Rosenbrock 上 $305$ 次求值到 $10^{-25}$）但缺少收敛保证，且在 $10$ 维上失效（$1.3 \times 10^{-1}$）；模式搜索有收敛理论，在近可分离的病态问题上表现好（$10$ 维椭球、条件数 $100$ 时 $8.8 \times 10^{-12}$），在旋转的强耦合问题上退化（条件数 $10^4$ 时只有 $6.5 \times 10^{-1}$）。进化策略中 CMA-ES 通过协方差矩阵自动学习尺度方向：同一条件下它达到 $6.0 \times 10^{-12}$，代价是每代 $O(d^3)$ 的矩阵分解与较大的求值预算。贝叶斯优化把每次求值的信息用高斯过程与采集函数榨干：$33$ 次求值的预算下，EI 的平均最好值 $-1.199$ 对随机搜索的 $-1.147$，达到精度阈值的成功率 $100\%$ 对 $30\%$，适合**预算几十次、单次求值昂贵**的场景；实现上要处理平局抖动与重复点。工程落地的主要形态是两级嵌套（内层梯度训练、外层黑箱搜索）加多保真调度（连续减半与 Hyperband），并在空间设计（对数尺度、条件参数）与结论报告（保留测试集、报告近优区域）两处保持纪律。
:::

第三章到此结束。九节内容从问题的语言与分类开始，经过凸性工具、无约束算法、约束与对偶、非光滑方法，到非凸优化与无梯度方法，覆盖了优化的主要分支与它们在机器学习中的对应物。下一章进入信息论：那里讨论的是另一类目标函数（交叉熵、互信息、散度），它们的凸性与光滑性、以及作为优化目标时的性质，都与本章的工具直接相关；信息论中的最大熵原理、KL 散度与信息几何，也可以看作在概率单纯形这一特殊可行域上的优化问题。

## 练习题

### 第 1 题 概念推导

在最小化问题中，设新点的函数值服从后验分布 $\mathcal{N}(\mu, s^2)$，当前最好值为 $f_{\text{best}}$。定义改进量 $I = \max(f_{\text{best}} - \xi - f, 0)$（$\xi \geq 0$ 是提升阈值），推导期望改进的闭式表达式。说明第一项与第二项分别对应什么行为，以及 $s \to 0$ 与 $\mu \gg f_{\text{best}}$ 两个极限下表达式的退化形式。

::: details 参考答案
**推导**：设 $f \sim \mathcal{N}(\mu, s^2)$，做标准化 $z' = (f - \mu)/s$，则 $z' \sim \mathcal{N}(0, 1)$。改进量非零的条件是 $f < f_{\text{best}} - \xi$，即 $z' < z$，其中 $z = (f_{\text{best}} - \xi - \mu)/s$。

$$
\text{EI} = \int_{-\infty}^{f_{\text{best}} - \xi} (f_{\text{best}} - \xi - f)\,\frac{1}{s}\phi\left(\frac{f - \mu}{s}\right)df
$$

代入 $f = \mu + sz'$、$df = s\,dz'$，并把常数项拆开：

$$
\text{EI} = (f_{\text{best}} - \xi - \mu)\int_{-\infty}^{z}\phi(z')\,dz' - s\int_{-\infty}^{z}z'\phi(z')\,dz'
$$

第一个积分为 $\Phi(z)$（标准正态分布函数）。第二个积分用 $\int z'\phi(z')dz' = -\phi(z')$：

$$
\int_{-\infty}^{z}z'\phi(z')\,dz' = -\phi(z)
$$

于是

$$
\text{EI}(\mathbf{x}) = (f_{\text{best}} - \xi - \mu)\,\Phi(z) + s\,\phi(z), \qquad z = \frac{f_{\text{best}} - \xi - \mu}{s}
$$

**两项的含义**：第一项 $(f_{\text{best}} - \xi - \mu)\Phi(z)$ 在预测值优于当前最好值时为正且随优势增大，对应**利用**；第二项 $s\phi(z)$ 与方差成正比，对应**探索**（在预测值差但方差大的区域也能取得正的 EI 值）。$z$ 自动调节两者比例：$\mu$ 远低于 $f_{\text{best}}$ 时 $z$ 很大、$\Phi(z) \approx 1$，第一项主导；$\mu$ 高于 $f_{\text{best}}$ 时 $z$ 为负、$\Phi(z)$ 小，第二项相对重要。

**两个极限**：$s \to 0$ 时第二项趋于零，$z \to \pm\infty$，EI 退化为 $\max(f_{\text{best}} - \xi - \mu, 0)$（确定性情形）；$\mu \gg f_{\text{best}} + \xi$ 时 $z$ 为大的负数，$\Phi(z) \approx 0$ 且 $\phi(z) \approx 0$，EI 趋于 $0$，模型认为该点没有改进可能，采集函数在这里失去分辨力（这就是实现中需要抖动打破平局的原因）。
:::

### 第 2 题 计算推理

(a) 在 3.9.1 节的 $6$ 维搜索空间（只有前两维影响目标）中，网格搜索每维取 $2$ 个水平时的最好损失是多少？若每维取 $3$ 个水平、预算 $3^6 = 729$，最好损失是多少？(b) 随机搜索用 $64$ 个样本时，前两维上**离目标点距离的平方**的量级估计是多少（用覆盖面积的倒数做估计），与实验值 $0.005$ 比较。(c) 计算 CMA-ES 在 $d = 10$ 与 $d = 100$ 时的默认群体大小 $\lambda$ 与有效选择质量 $\mu_{\text{eff}}$。

::: details 参考答案
**(a)** 网格搜索结果可以精确计算。每维 $2$ 个水平（$0$ 与 $1$）时，前两维的最好组合是 $(0, 1)$（或 $(1, 0)$ 等，取决于目标）：

$$
(0 - 0.3)^2 + (1 - 0.7)^2 = 0.09 + 0.09 = 0.18
$$

与实验输出 $0.1800$ 一致。每维 $3$ 个水平（$0$、$0.5$、$1$）时，前两维的最好在 $(0.5, 0.5)$ 附近取值：$(0.5 - 0.3)^2 + (0.5 - 0.7)^2 = 0.04 + 0.04 = 0.08$；看 $x_2 = 1$ 的组合 $(0.5, 1)$：$0.04 + 0.09 = 0.13$；$(0, 1)$ 仍是 $0.18$。所以最好损失为 $0.08$。代价从 $64$ 次求值增加到 $729$ 次（$11$ 倍多），而最好损失只从 $0.18$ 降到 $0.08$，随机搜索用 $64$ 次就达到 $0.005$ 左右。

**(b)** $64$ 个独立均匀样本落在 $[0,1]^2$ 中，以目标点 $(\mu_1, \mu_2) = (0.3, 0.7)$ 为中心、半径 $r$ 的圆内平均有 $64\pi r^2$ 个点。最近样本的期望平方距离可以用**覆盖一个面积**的估计：$64 r^2 \approx 1$，即 $r^2 \approx 1/64 = 0.0156$，所以最好损失的量级为 $0.01$ 到 $0.02$。再加上高维上无关维度的浪费（这里无关维度不进入损失，所以不影响），实验给出的均值 $0.0050$ 落在同一量级内（因为损失是距离平方，最小值比平均覆盖半径更小，常数因子约为 $1/3$）。

**(c)** 默认群体大小 $\lambda = 4 + \lfloor 3\ln d \rfloor$：$d = 10$ 时 $\lambda = 4 + \lfloor 6.91 \rfloor = 10$，$\mu = \lambda/2 = 5$；$d = 100$ 时 $\lambda = 4 + \lfloor 13.8 \rfloor = 17$，$\mu = 8$。

权重 $w_i \propto \ln(\mu + 0.5) - \ln i$（$i = 1, \dots, \mu$），$d = 10$ 时未归一化的权重为 $\ln(5.5/1), \ln(5.5/2), \dots, \ln(5.5/5) = 1.7047, 1.0116, 0.6061, 0.3185, 0.0953$，和为 $3.7362$，归一化后为 $0.4563, 0.2708, 0.1622, 0.0852, 0.0255$。有效选择质量

$$
\mu_{\text{eff}} = \frac{1}{\sum w_i^2} = \frac{1}{0.4563^2 + 0.2708^2 + 0.1622^2 + 0.0852^2 + 0.0255^2} \approx \frac{1}{0.3158} \approx 3.17
$$

与程序输出 $3.167$ 一致。$d = 100$ 时 $\mu_{\text{eff}} = 4.841$。$\mu_{\text{eff}}$ 出现在所有学习率的公式里（$c_\sigma$、$c_c$、$c_1$、$c_\mu$ 都依赖它），含义是**有效参与重组的样本数**：权重集中在前几个样本上，因此 $\mu_{\text{eff}}$ 明显小于 $\mu$。
:::

### 第 3 题 代码验证

用本节代码做三组实验并解释：(a) 把 3.9.2 节模式搜索的初始步长从 $1.0$ 改为 $0.1$ 与 $3.0$，观察 Rosenbrock 上的最终精度；(b) 把 3.9.4 节采集函数从 EI 换成下置信界 $\mu - \kappa s$，取 $\kappa = 0$（纯利用）、$2$、$4$，比较 $33$ 次求值后的最好值；(c) 说明为什么 (b) 中 $\kappa = 0$ 的表现与其他取值不同。给出代码、输出与结论。

::: details 参考答案
```python
import numpy as np

def rosen(x):
    return (1 - x[0]) ** 2 + 100 * (x[1] - x[0] ** 2) ** 2

def compass_search(fun, x0, budget=2000, step0=1.0):
    x = np.array(x0, dtype=float)
    fx = fun(x); neval = 1
    step = step0
    while neval < budget:
        improved = False
        for i in range(len(x)):
            for sgn in (1, -1):
                cand = x.copy(); cand[i] += sgn * step
                fc = fun(cand); neval += 1
                if fc < fx:
                    x, fx = cand, fc
                    improved = True
                    break
        if not improved:
            step *= 0.5
            if step < 1e-12:
                break
    return fx, neval

print("模式搜索的初始步长（Rosenbrock，预算 2000）：")
for s0 in [0.1, 1.0, 3.0]:
    fv, ne = compass_search(rosen, np.array([-1.2, 1.0]), step0=s0)
    print(f"  初始步长 {s0}: f = {fv:.3e}, 求值 {ne} 次")

# (b) 下置信界的探索强度
def f_bo(x):
    x = float(np.asarray(x).ravel()[0])
    return -(np.exp(-((x - 0.2) / 0.1) ** 2) + 1.2 * np.exp(-((x - 0.8) / 0.05) ** 2))

def kern(A, B, Ls):
    d2 = (A[:, None, :] - B[None, :, :]) ** 2
    return np.exp(-0.5 * np.sum(d2, axis=-1) / Ls ** 2)

def gp_posterior(X, y, Xs, Ls, noise=1e-8):
    K = kern(X, X, Ls) + noise * np.eye(len(X))
    L = np.linalg.cholesky(K)
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    Ks = kern(X, Xs, Ls)
    mu = Ks.T @ alpha
    v = np.linalg.solve(L, Ks)
    return mu, np.sqrt(np.maximum(1 - np.sum(v ** 2, axis=0), 1e-12))

def margin_ll(X, y, Ls):
    K = kern(X, X, Ls) + 1e-8 * np.eye(len(X))
    L = np.linalg.cholesky(K)
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    return float(-0.5 * y @ alpha - np.sum(np.log(np.diag(L))))

def run_lcb(seed, kappa, n_total=33, n_init=3, grid=2001):
    rng = np.random.default_rng(seed)
    xs = np.linspace(0, 1, grid).reshape(-1, 1)
    X = rng.random((n_init, 1))
    y = np.array([f_bo(x) for x in X])
    for _ in range(n_total - n_init):
        best_ls, best_ll = None, -np.inf
        for Ls in [0.02, 0.03, 0.05, 0.1, 0.2, 0.4]:
            ll = margin_ll(X, y, Ls)
            if ll > best_ll:
                best_ll, best_ls = ll, Ls
        mu, sd = gp_posterior(X, y, xs, best_ls)
        x_new = xs[int(np.argmin(mu - kappa * sd))]
        y = np.append(y, f_bo(x_new))
        X = np.vstack([X, x_new])
    return y.min()

print("下置信界 kappa 的影响（10 次重复，33 次求值）：")
for kappa in [0.0, 0.5, 2.0, 4.0]:
    vals = [run_lcb(s, kappa) for s in range(10)]
    print(f"  kappa = {kappa}: 最优值均值 = {np.mean(vals):.4f}")
```

输出：

```text
模式搜索的初始步长（Rosenbrock，预算 2000）：
  初始步长 0.1: f = 1.536e-02, 求值 2001 次
  初始步长 1.0: f = 8.634e-02, 求值 2000 次
  初始步长 3.0: f = 8.299e-01, 求值 2000 次
下置信界 kappa 的影响（10 次重复，33 次求值）：
  kappa = 0.0: 最优值均值 = -1.1000
  kappa = 0.5: 最优值均值 = -1.1000
  kappa = 2.0: 最优值均值 = -1.1200
  kappa = 4.0: 最优值均值 = -1.1400
```

**结论**：(a) 初始步长决定模式搜索的起跑效率：$0.1$ 时最好（$1.5 \times 10^{-2}$），$1.0$ 时 $8.6 \times 10^{-2}$，$3.0$ 时 $8.3 \times 10^{-1}$。步长过大时迭代会在 Rosenbrock 的弯曲谷上反复跨过谷底（坐标方向的移动放大到上千倍），大量求值被浪费在无效的长步试探上；步长过小则收敛慢（本例 $0.1$ 已足够，因为起点到最优点的距离只有 $2$ 左右）。实践中的做法是用与搜索空间尺度成正比的初始步长（例如区间的 $10\%$），并配合多次重启。

(b) 探索强度越大，$33$ 次求值后的最好值越好：$\kappa = 0$ 与 $0.5$ 停在 $-1.100$，$\kappa = 2$ 到 $-1.120$，$\kappa = 4$ 到 $-1.140$。同时注意这四个值都差于 EI 的 $-1.199$：在同样的预算与代理模型下，EI 的自适应平衡（由 $z$ 自动调节）比固定 $\kappa$ 的置信界更有效。

(c) $\kappa = 0$ 退化为纯利用（只跟随后验均值），会锁定在第一个找到的凹陷上——本例中宽而浅的局部极小（$x \approx 0.2$，值 $-1.0$ 附近，但窄峰的存在使后验均值在 $0.2$ 处最低）上，不再探索窄而深的全局极小。$\kappa$ 增大后，未探索区域的方差惩罚推动采样点铺开，最终有更多次运行命中 $x = 0.8$ 的窄峰。这一对比说明采集函数中的探索项承担结构性作用：它避免迭代过早收敛到第一个找到的凹陷。
:::

### 第 4 题 综合应用

某团队要调优一个深度模型的训练配置，可调的项包括学习率、批大小、权重衰减、网络深度、注意力头数、优化器类型与三种数据增强的强度。单次完整训练需要 12 小时，团队有 8 张加速卡与两周时间。请给出完整的调优方案：搜索空间的设计（各参数的尺度与类型）、预算分配方式、代理模型的选择、并行策略、以及报告结论时的注意事项。并说明什么情况下应当放弃贝叶斯优化改用更简单的方法。

::: details 参考答案
**搜索空间**：学习率、权重衰减、数据增强强度用对数尺度（例如 $\eta \in 10^{[-5, -2]}$）；批大小按 $2$ 的幂在 $[16, 512]$ 内采样；网络深度与注意力头数取有限集合（离散，但顺序有意义，可用线性尺度）；优化器类型是类别参数，且与部分参数有条件关系（不同优化器的 $\epsilon$、动量参数只在其被选中时起作用，用条件搜索空间处理）。维度总计约 $8$ 到 $10$，属于贝叶斯优化的可行区间（低于 $20$ 维）。

**预算分配**：总预算 $8$ 卡 $\times$ $14$ 天 $\times$ $24$ 小时 $= 2688$ 卡时，单次完整训练 $12$ 小时。若全部用于完整训练，能跑 $224$ 次（单卡计）；用**多保真**策略把大部分试验压到小预算：（i）先用约 $10\%$ 的数据与 $20\%$ 的步数（约 $0.25$ 卡时）筛选 $200$ 个左右的配置；（ii）用**连续减半**或 Hyperband 保留表现好的 $20$ 到 $30$ 个配置，把预算提高到 $1$ 到 $2$ 卡时；（iii）最后给 $5$ 到 $8$ 个配置完整预算，确认结果并做学习率调度的细调。多保真的前提是**短训练的排序与长训练的排序相关性高**，实现时要先用少量配置验证这一假设（比较同一批配置在短预算与长预算下的排序相关系数）。

**代理模型**：空间以连续参数为主，观测数在几十到几百之间，用高斯过程加 EI（或 TPE）都合适。若类别参数占比大、条件关系复杂，改用 TPE 或随机森林代理更稳。长度尺度或核参数通过最大化对数边际似然拟合，过程中记录拟合的 $\ell$：$\ell$ 变小说明模型认为函数变化剧烈，通常意味着观测之间一致性差（噪声大）。

**并行策略**：12 小时的训练时长使串行贝叶斯优化的吞吐过低。用**异步并行**：维护 $8$ 个并发试验，候选点由已完成试验的数据拟合的代理模型给出（constEI 或 q-EI 之类的批量采集函数更优，实现复杂时用汤普森采样，天然支持批量）。并行带来的一个后果是样本效率下降（并发点的信息不能立即共享），评估时要与**同样预算下并行随机搜索**比较，确认收益仍然存在。

**报告注意事项**：保留最终测试集（从不参与选择），避免验证集过拟合；报告最优配置附近的若干近优配置而不是单点（超参数的重要性排序往往比最优值更稳定）；报告学习率与批大小的联合选择（两者的耦合关系比各自的绝对值更重要）；说明多保真带来的偏差（短预算选出的配置在长预算下可能不再最优）。

**放弃贝叶斯优化的情形**：预算充足（数百次完整训练）时随机搜索或 CMA-ES 的期望表现相当，而维护 GP 与采集函数的工程成本不低；维度超过约 $20$ 到 $30$ 时全局 GP 失效，要么用信任域局部贝叶斯优化，要么改用 CMA-ES；需要极致吞吐（例如上百并发）时，异步采集函数实现复杂、协调开销大，随机搜索的性价比更高。判断标准是**总成本 = 单次求值成本 $\times$ 预算**与实现复杂度的乘积：总成本在几十次求值以内、且每次求值都很贵时，贝叶斯优化的收益最大。
:::

## 常见错误

**错误 1 · 在高维空间直接使用全局贝叶斯优化**

原因：高斯过程的样本效率优势建立在低维与平滑假设上。维度升高后，为覆盖搜索空间所需的观测数指数增长，后验方差在绝大多数区域保持接近先验水平，采集函数退化为近似随机采样；GP 拟合的 $O(n^3)$ 代价也限制了观测数。经验上超过约 $20$ 到 $30$ 维之后，全局贝叶斯优化的优势迅速消失。

解决：高维时改用信任域局部贝叶斯优化（在局部区域内拟合 GP，随进展移动区域）、随机嵌入（先降到低维子空间再优化）、或换成 CMA-ES 与随机搜索。另一个方向是降低维度本身：固定或分阶段优化参数（先调学习率与批大小，再调结构参数），或按参数重要性排序只优化前几个。

**错误 2 · 把 Nelder-Mead 当作有收敛保证的方法**

原因：NM 的更新规则是启发式的，没有单调下降的保证；存在二维反例（McKinnon 函数）使它收敛到非稳定点，高维与噪声环境下失败模式更多（单纯形退化到低维子空间、步长无法适应各维尺度差异，本节实验中 $10$ 维椭球上只到 $1.3 \times 10^{-1}$）。

解决：把 NM 用于低维（不超过 $5$ 到 $10$ 维）光滑问题，并配合多次随机重启（取多个解中最好的）与收敛检查（输出点的梯度若可估计则检查梯度范数，不可估计时检查单纯形尺寸与函数值的分散度）。需要可靠性时改用有收敛理论的模式搜索，或需要处理病态与旋转问题时改用 CMA-ES。

**错误 3 · 采集函数实现中不处理平局与重复点**

原因：EI 在**所有候选点都没有改进可能**时会整体塌缩到接近零，$\arg\max$ 由浮点噪声决定，同一候选点被反复推荐（数值实验中若不加抖动，采样点序列会出现连续几十次相同取值）；噪声项 $\sigma_n^2$ 取 $0$ 时协方差矩阵奇异，Cholesky 分解直接失败；重复求值同一个点会浪费本就稀缺的预算。

解决：对采集函数值加微小随机抖动或改用 log-EI；噪声项取一个与观测精度匹配的正数（$10^{-8}$ 到 $10^{-6}$，有真实观测噪声时按估计值设置）；维护已求值点的集合并屏蔽重复候选；对高维或连续空间用连续优化（多起点梯度上升）替代网格搜索候选点。

**错误 4 · 超参数搜索的尺度与验证设计错误**

原因：两类高频错误。其一是搜索空间的尺度：学习率、正则系数这类跨数量级的参数若用线性采样，绝大部分预算落在区间的大值侧，最优点附近的采样密度过低。其二是验证集过拟合：反复用同一验证集筛选配置（几十次到上百次选择），最终报告的最优指标会系统性偏高几倍于单次评估的标准误。

解决：跨数量级参数一律在对数尺度采样（log-uniform）；离散结构参数按语义选择尺度（层数线性、批量按 $2$ 的幂）；条件参数用条件搜索空间。验证方面保留一个从未参与选择的测试集作为最终报告，或者用嵌套交叉验证估计选择偏差；报告时给出最优值附近的近优配置区间与参数重要性排序，而不是单点最优。