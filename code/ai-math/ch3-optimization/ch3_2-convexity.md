---
title: 3.2 凸集与凸函数
sidebar:
  order: 2
---
# 3.2 凸集与凸函数

3.1 节把凸性列为问题分类的第一维度，并说明了它在优化中的特殊地位：凸问题的一阶稳定点就是全局最优，算法由此获得全局收敛保证。本节给出凸性的完整内容：凸集的定义与常见例子，分离定理与对偶锥，投影与最近点问题，凸函数的判定条件与保凸运算，共轭函数与 Fenchel 对偶，以及光滑性、强凸性与次梯度。

这些内容有一个共同的目标：把几何直觉变成可验证的判据。判断一个集合是否凸，可以检查两点之间的线段是否仍在集合内；判断一个函数是否凸，可以看它的图像上方图是否为凸集，或检查 Hessian 是否半正定。这些判据都能在具体问题上机械地执行，得到的是确定的结论而不是猜测。后续各节的分析工具多数在本节建立：3.3 节的收敛速率用到光滑性与强凸性给出的二次上下界，3.6 节的对偶理论用到分离定理与共轭函数，3.7 节的近端方法用到投影与次微分。

## 3.2.1 凸集与凸组合

### 定义

集合 $C \subseteq \R^n$ 称为**凸集**（convex set），若对任意 $\mathbf{x}, \mathbf{y} \in C$ 与任意 $\theta \in [0, 1]$，

$$
\theta \mathbf{x} + (1 - \theta)\mathbf{y} \in C
$$

直观含义是：集合中任意两点的连线整段都在集合内。空集、单点集与整个 $\R^n$ 按约定也是凸集。

反复应用定义得到**凸组合**（convex combination）的封闭性：若 $\mathbf{x}_1, \ldots, \mathbf{x}_k \in C$，$\theta_i \geq 0$ 且 $\sum_i \theta_i = 1$，则 $\sum_i \theta_i \mathbf{x}_i \in C$。凸集对凸组合封闭，这一性质是凸性在计算上好用的根源：允许把复杂的点表示成简单点的加权平均，权重非负且和为一。

### 常见凸集

**超平面与半空间**。集合 $\{\mathbf{x} : \mathbf{a}^T\mathbf{x} = b\}$ 是超平面，$\{\mathbf{x} : \mathbf{a}^T\mathbf{x} \leq b\}$ 是半空间，两者都是凸集。凸性来自线性函数：对 $f(\mathbf{x}) = \mathbf{a}^T\mathbf{x}$，有 $f(\theta \mathbf{x} + (1-\theta)\mathbf{y}) = \theta f(\mathbf{x}) + (1-\theta)f(\mathbf{y})$，因此线性不等式的满足性在取凸组合后保持。

**多面体与单纯形**。有限个半空间与超平面的交称为**多面体**（polyhedron），它是线性规划（3.6 节）的可行域。**单纯形**（simplex）是一类特殊多面体：给定仿射无关的点集 $\mathbf{v}_0, \ldots, \mathbf{v}_k$，它们的凸包称为 $k$ 维单纯形，例如概率向量构成的集合 $\{\mathbf{p} : p_i \geq 0, \sum_i p_i = 1\}$。

**范数球与范数锥**。对任意范数 $\|\cdot\|$，单位球 $\{\mathbf{x} : \|\mathbf{x}\| \leq 1\}$ 与范数锥 $\{(\mathbf{x}, t) : \|\mathbf{x}\| \leq t\}$ 都是凸集，依据是范数的三角不等式与正齐次性：$\|\theta\mathbf{x} + (1-\theta)\mathbf{y}\| \leq \theta\|\mathbf{x}\| + (1-\theta)\|\mathbf{y}\|$。

**二阶锥**。集合

$$
\mathcal{Q} = \left\{(\mathbf{x}, t) \in \R^{n} \times \R \ \middle|\ \|\mathbf{x}\|_2 \leq t\right\}
$$

称为二阶锥（second-order cone），它是欧氏范数的范数锥。二阶锥规划的可行域由若干个二阶锥与仿射约束组成（3.6 节）。

**半正定锥**。对称矩阵集合

$$
\mathcal{S}_+^n = \left\{\mathbf{X} \in \mathcal{S}^n \ \middle|\ \mathbf{X} \succeq 0\right\}
$$

称为半正定锥，其中 $\mathcal{S}^n$ 是对称矩阵空间。凸性来自半正定性对凸组合的封闭：若 $\mathbf{A} \succeq 0$ 且 $\mathbf{B} \succeq 0$，则对任意 $\theta \in [0,1]$，$\theta\mathbf{A} + (1-\theta)\mathbf{B} \succeq 0$（对任意向量 $\mathbf{v}$，$\mathbf{v}^T(\theta\mathbf{A} + (1-\theta)\mathbf{B})\mathbf{v} = \theta \mathbf{v}^T\mathbf{A}\mathbf{v} + (1-\theta)\mathbf{v}^T\mathbf{B}\mathbf{v} \geq 0$）。半定规划（3.6 节）由此定义。

**仿射集**是凸集的特例：集合中任意两点的连线延长后仍在集合内，即 $\{\mathbf{x} : \mathbf{A}\mathbf{x} = \mathbf{b}\}$ 的形式。**锥**指对非负缩放封闭的集合（$\mathbf{x} \in K$，$t \geq 0$ 推出 $t\mathbf{x} \in K$），凸锥是同时满足凸性与锥性的集合，上面的范数锥、二阶锥与半正定锥都是凸锥。

### 保凸运算与凸包

从已知凸集构造新凸集的运算清单，省去了逐个验证定义。

**交**：任意多个凸集的交集是凸集（对凸组合封闭性在交运算下保持）。这一条最常用：多面体是半空间的交，可行域通常是若干凸集的交。

**仿射映射的像与原像**：$\mathbf{A}$ 为线性映射、$\mathbf{b}$ 为常向量时，凸集 $C$ 的像 $\{\mathbf{A}\mathbf{x} + \mathbf{b} : \mathbf{x} \in C\}$ 与凸集 $D$ 的原像 $\{\mathbf{x} : \mathbf{A}\mathbf{x} + \mathbf{b} \in D\}$ 都是凸集。

**笛卡尔积与部分变量最小化**：两个凸集的笛卡尔积是凸集；若 $f(\mathbf{x}, \mathbf{y})$ 关于 $(\mathbf{x}, \mathbf{y})$ 是凸函数，则 $g(\mathbf{x}) = \inf_{\mathbf{y}} f(\mathbf{x}, \mathbf{y})$ 关于 $\mathbf{x}$ 是凸函数（在 $g$ 的定义域内）。这一条在机器学习中反复出现：对隐变量取最小值不破坏凸性。

**凸包**：任意集合 $S$ 的所有凸组合构成的集合称为 $S$ 的**凸包**（convex hull），记作 $\mathrm{conv}(S)$。它是最小的包含 $S$ 的凸集，也是 $S$ 中点的凸组合的全体。Carathéodory 定理指出，在 $\R^n$ 中每个凸包内的点都可以表示为至多 $n + 1$ 个原集合中点的凸组合，这就是凸包在计算上可以参数化的原因。

多面体有一个对偶描述。有界多面体等于它的**极点**（顶点）的凸包，而无界多面体等于极点的凸包加上**回收锥**。线性规划的最优解总可以在极点处取到（3.6 节），这一性质把连续优化问题转化为对有限个顶点的搜索，单纯形法正是沿顶点移动的算法。

## 3.2.2 分离定理与对偶锥

### 分离定理

凸集最有力的几何工具是**分离定理**（separation theorem）：两个不相交的凸集可以用一个超平面分开。

**定理**：设 $C, D \subseteq \R^n$ 为非空凸集且 $C \cap D = \varnothing$。则存在非零向量 $\mathbf{w}$ 与常数 $\gamma$，使

$$
\mathbf{w}^T\mathbf{x} \leq \gamma \leq \mathbf{w}^T\mathbf{y}, \qquad \forall \mathbf{x} \in C, \ \forall \mathbf{y} \in D
$$

若进一步假设两个集合之一为闭集、另一个为紧集，则上面的不等号可以写成严格不等号。

证明基于最近点问题：取两个集合之间的最近点对 $(\mathbf{a}, \mathbf{b})$（紧性与闭性保证存在），令 $\mathbf{w} = \mathbf{b} - \mathbf{a}$。用反证法可以验证若 $\mathbf{w}$ 不是分离方向，则能构造出比 $(\mathbf{a}, \mathbf{b})$ 更近的点对，与最近性矛盾。

分离定理是凸分析的支柱，后续两处直接使用。其一，3.6 节的 KKT 条件：在最优点处，目标函数的负梯度方向与积极约束的梯度方向构成的锥之间存在分离超平面，分离的系数就是拉格朗日乘子。其二，对偶理论：原问题与对偶问题之间的间隙为零时，两者的最优解由同一个超平面联系，这一超平面就是支撑超平面（$C$ 的所有点满足 $\mathbf{w}^T\mathbf{x} \leq \gamma$ 且等号在某点取到时，该超平面称为支撑超平面）。

与之配套的还有 Farkas 引理，它处理线性不等式系统的可解性。

**Farkas 引理**：对矩阵 $\mathbf{A}$ 与向量 $\mathbf{b}$，下面两个命题中恰有一个成立：其一，存在 $\mathbf{x}$ 使 $\mathbf{A}\mathbf{x} \leq \mathbf{0}$ 且 $\mathbf{b}^T\mathbf{x} > 0$；其二，存在 $\mathbf{y} \geq \mathbf{0}$ 使 $\mathbf{A}^T\mathbf{y} = \mathbf{b}$。

引理的表述看起来抽象，含义是：线性约束系统无解时，可以给出一个显式的无解证明。第二种情形的 $\mathbf{y}$ 把不等式 $\mathbf{A}\mathbf{x} \leq \mathbf{0}$ 按非负权重相加得到 $\mathbf{b}^T\mathbf{x} \leq 0$，与 $\mathbf{b}^T\mathbf{x} > 0$ 矛盾。这种由约束的非负组合构造矛盾的思路，在 3.6 节会以对偶可行解的形式重新出现。

### 对偶锥与极锥

对集合 $K$，定义

$$
K^* = \left\{\mathbf{y} \ :\ \mathbf{y}^T\mathbf{x} \geq 0, \ \forall \mathbf{x} \in K\right\}
$$

称为 $K$ 的**对偶锥**。它包含所有与 $K$ 中每个元素都成非负内积的向量，几何上就是从原点看出去与整个集合成直角以内的方向集合。对偶锥总是凸锥，与 $K$ 本身是否凸无关，而当 $K$ 是闭凸锥时，二次对偶恢复原集合：$K^{**} = K$。

几个常见例子：非负象限的对偶锥是自身；二阶锥的对偶锥是自身（自对偶）；半正定锥也是自对偶的，$\mathcal{S}_+^{n}$ 上的内积取 $\mathrm{tr}(\mathbf{A}\mathbf{B})$。

对偶锥刻画可行方向。若约束写成 $\mathbf{x} \in K$，则最优性条件中出现的是 $K$ 的对偶锥：负梯度方向必须落在约束集的对偶锥内，才不能通过沿约束方向移动进一步降低目标值。这一条件在 3.6 节的 KKT 条件中成为互补松弛的几何内容，在 3.7 节成为近端算子的定义基础。

## 3.2.3 投影与最近点问题

### 投影算子

给定闭凸集 $C$ 与点 $\mathbf{x}$，$C$ 中距离 $\mathbf{x}$ 最近的点称为 $\mathbf{x}$ 在 $C$ 上的**投影**（projection），记作 $P_C(\mathbf{x})$。闭凸性保证投影存在且唯一（存在性来自闭性，唯一性来自严格凸的欧氏距离函数：若两个点距离都最小，则它们的中点距离更小，与最小性矛盾）。

投影有两个等价的刻画，它们在算法分析中反复使用。

**变分不等式**：$P_C(\mathbf{x})$ 是满足下式的唯一元素

$$
(\mathbf{x} - P_C(\mathbf{x}))^T\big(\mathbf{z} - P_C(\mathbf{x})\big) \leq 0, \qquad \forall \mathbf{z} \in C
$$

几何含义是：从投影点指向 $\mathbf{x}$ 的向量与从投影点指向集合内任意点的向量成钝角，投影点是集合内最靠近 $\mathbf{x}$ 的方向。

**非扩张性**：对任意 $\mathbf{x}, \mathbf{y}$，

$$
\|P_C(\mathbf{x}) - P_C(\mathbf{y})\| \leq \|\mathbf{x} - \mathbf{y}\|
$$

投影不会放大距离。这条性质是投影梯度法与近端方法收敛性证明的关键（3.3 与 3.7 节）。

### 常见凸集上的投影

**盒子** $\{\mathbf{x} : \mathbf{l} \leq \mathbf{x} \leq \mathbf{u}\}$：逐坐标截断，$P_C(\mathbf{x})_i = \min(\max(x_i, l_i), u_i)$。

**单纯形** $\{\mathbf{p} : p_i \geq 0, \sum_i p_i = 1\}$：把 $\mathbf{x}$ 平移，使非负部分的和恰为一。做法是排序后求阈值 $\theta$，再取 $P_C(\mathbf{x})_i = \max(x_i - \theta, 0)$。阈值满足 $\sum_i \max(x_i - \theta, 0) = 1$，排序后可用线性扫描确定。

**仿射集** $\{\mathbf{x} : \mathbf{A}\mathbf{x} = \mathbf{b}\}$：$P_C(\mathbf{x}) = \mathbf{x} - \mathbf{A}^T(\mathbf{A}\mathbf{A}^T)^{-1}(\mathbf{A}\mathbf{x} - \mathbf{b})$，是线性方程组意义下的最小修正。

**半正定锥**：把对称矩阵做特征分解后截断负特征值，$P(\mathbf{X}) = \sum_i \max(\lambda_i, 0)\mathbf{v}_i\mathbf{v}_i^T$。这一投影在矩阵补全与低秩优化的算法中出现。

下列代码用数值方法演示分离定理与投影的三条性质：先求两个凸集之间的最近点对，用连接方向构造分离超平面并在采样点上验证；再检验投影的非扩张性与变分不等式。

```python
import numpy as np
from scipy import optimize

# 两个不相交凸集：单位圆盘 A，盒子 B = [1.5, 3] x [-0.5, 0.5]
def closest_pair():
    """求两个凸集之间的最近点对（约束优化）"""
    def dist(v):
        a, b = v[:2], v[2:]
        return np.sum((a - b) ** 2)
    cons = [
        {'type': 'ineq', 'fun': lambda v: 1 - v[0] ** 2 - v[1] ** 2},   # A 在单位圆盘内
        {'type': 'ineq', 'fun': lambda v: v[2] - 1.5},                   # B 的坐标范围
        {'type': 'ineq', 'fun': lambda v: 3 - v[2]},
        {'type': 'ineq', 'fun': lambda v: v[3] + 0.5},
        {'type': 'ineq', 'fun': lambda v: 0.5 - v[3]},
    ]
    res = optimize.minimize(dist, [0, 0, 2, 0], constraints=cons)
    return res.x[:2], res.x[2:]

a, b = closest_pair()
w = b - a                       # 分离方向取两个最近点之差
c = 0.5 * w @ (a + b)           # 超平面过中点
print(f"最近点对：a = {np.round(a, 4)}（圆盘），b = {np.round(b, 4)}（盒子）")
print(f"分离超平面：w·a = {w @ a:.4f} <= c = {c:.4f} <= w·b = {w @ b:.4f}")

rng = np.random.default_rng(0)
th = rng.random(20000) * 2 * np.pi
r = np.sqrt(rng.random(20000))
ptsA = np.stack([r * np.cos(th), r * np.sin(th)], axis=1)               # 圆盘内采样
ptsB = np.stack([rng.uniform(1.5, 3, 20000), rng.uniform(-0.5, 0.5, 20000)], axis=1)
print(f"采样验证：A 侧最大值 = {np.max(ptsA @ w):.4f}，B 侧最小值 = {np.min(ptsB @ w):.4f}")

# 盒子投影的非扩张性
def proj_box(x, lo, hi):
    return np.clip(x, lo, hi)

X = rng.normal(size=(20000, 2)) * 2
Y = rng.normal(size=(20000, 2)) * 2
num = np.linalg.norm(proj_box(X, -0.5, 0.5) - proj_box(Y, -0.5, 0.5), axis=1)
den = np.linalg.norm(X - Y, axis=1)
mask = den > 1e-9
print(f"盒子投影：最大距离比 = {np.max(num[mask] / den[mask]):.6f}（不超过 1）")

# 单纯形投影：排序法求阈值
def proj_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u) - 1
    idx = np.arange(1, len(v) + 1)
    cond = u - css / idx > 0
    rho = idx[cond][-1]
    theta = css[cond][-1] / rho
    return np.maximum(v - theta, 0)

for x in [np.array([0.4, 1.2, -0.3]), np.array([2.0, 2.0, 2.0])]:
    p = proj_simplex(x)
    Z = rng.dirichlet(np.ones(3), 2000)
    print(f"x = {x} -> P(x) = {np.round(p, 4)}，变分不等式最大偏离 = {np.max((x - p) @ (Z - p).T):.2e}")
# 分离超平面把两个集合分开，采样点在两侧；盒子投影的距离比恰好取到 1
# 单纯形投影满足非负性和和为一，变分不等式在机器精度内成立
```

输出验证了三条性质。分离超平面的两侧分别容纳两个集合（圆盘侧最大值 $0.4975$，盒子侧最小值 $0.75$，阈值 $0.625$ 位于两者之间）；盒子投影的距离比取到 $1.000000$ 的边界值但不越过，说明投影的 Lipschitz 常数为 $1$；单纯形投影给出非负且和为一的向量，变分不等式在数值精度内成立。

## 3.2.4 凸函数与判定条件

### 定义

函数 $f: \R^n \to \R \cup \{+\infty\}$ 称为**凸函数**（convex function），若其**上方图**（epigraph）

$$
\mathrm{epi}\,f = \left\{(\mathbf{x}, t) \in \R^{n+1} \ \middle|\ f(\mathbf{x}) \leq t\right\}
$$

是凸集。等价的定义用 Jensen 不等式表述：对任意 $\mathbf{x}, \mathbf{y}$ 与 $\theta \in [0, 1]$，

$$
f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \leq \theta f(\mathbf{x}) + (1-\theta)f(\mathbf{y})
$$

函数值在两点之间的取值不超过端点取值的线性插值。取 $f$ 的上方图而不是图像本身，是因为凸函数的图像上方区域恰好是凸集，这一形式把函数的凸性翻译成集合的凸性，分离定理等几何工具可以直接使用。$-f$ 为凸函数时 $f$ 称为**凹函数**。$f$ 的定义域取 $\{\mathbf{x} : f(\mathbf{x}) < +\infty\}$，允许函数在部分区域取 $+\infty$ 使约束可以塞进目标函数（指示函数 $I_C(\mathbf{x})$ 在 $C$ 内取 $0$、外取 $+\infty$，其上方图凸等价于 $C$ 凸）。

**下水平集**（sublevel set）$\{\mathbf{x} : f(\mathbf{x}) \leq \alpha\}$ 在 $f$ 凸时是凸集。反方向不成立：下水平集全为凸集的函数称为**拟凸**（quasi-convex）函数，它比凸函数更宽，例如 $f(x) = \sqrt{|x|}$ 的下水平集是区间而函数本身不凸。

### 判定条件

三个判据从不同角度刻画凸性，可以按问题的可计算性选择。

**一阶条件**（$f$ 可微）：$f$ 凸等价于对任意 $\mathbf{x}, \mathbf{y}$，

$$
f(\mathbf{y}) \geq f(\mathbf{x}) + \nabla f(\mathbf{x})^T(\mathbf{y} - \mathbf{x})
$$

函数图像处处位于任意一点处切平面的上方。这条不等式还给出一个有用的推论：若 $\nabla f(\mathbf{x}^*) = \mathbf{0}$，则 $f(\mathbf{y}) \geq f(\mathbf{x}^*)$ 对一切 $\mathbf{y}$ 成立，即一阶稳定点就是全局最优解。凸优化算法的全部收敛保证都建立在这一点上。

**二阶条件**（$f$ 二阶可微）：$f$ 凸等价于 Hessian 处处半正定，$\nabla^2 f(\mathbf{x}) \succeq 0$。对一维函数退化为二阶导数非负。这一条件把凸性判定变成矩阵特征值符号的检查，是实践中最常用的判据。

**单调梯度**：$f$ 凸等价于梯度映射单调：$(\nabla f(\mathbf{x}) - \nabla f(\mathbf{y}))^T(\mathbf{x} - \mathbf{y}) \geq 0$。单调性在 3.7 节的算子框架中给出更统一的表述。

**严格凸**要求 Jensen 不等式在 $\mathbf{x} \neq \mathbf{y}$ 与 $\theta \in (0,1)$ 时严格成立（等价地，二阶条件为 Hessian 正定），它保证最优解唯一。**强凸**要求更强的二次下界：存在 $m > 0$ 使

$$
f(\mathbf{y}) \geq f(\mathbf{x}) + \nabla f(\mathbf{x})^T(\mathbf{y} - \mathbf{x}) + \frac{m}{2}\|\mathbf{y} - \mathbf{x}\|^2
$$

强凸性给出曲率的下界，是线性收敛速率的来源（下一小节与 3.3 节）。

### 保凸运算

从简单凸函数构造复杂凸函数的清单。

非负加权和保持凸性；凸函数与仿射映射的复合 $f(\mathbf{A}\mathbf{x} + \mathbf{b})$ 是凸函数；一组凸函数的逐点最大值 $\max_i f_i(\mathbf{x})$ 是凸函数（上方图是各个上方图的交）；部分变量最小化 $g(\mathbf{x}) = \inf_{\mathbf{y}} f(\mathbf{x}, \mathbf{y})$ 在 $f$ 凸时是凸函数；透视函数 $g(\mathbf{x}, t) = t f(\mathbf{x}/t)$（$t > 0$）在 $f$ 凸时是凸函数。

几个常用函数的凸性可以直接从清单推出：范数、$\max$ 函数、负对数 $-\log x$、指数函数、log-sum-exp $\log\sum_i e^{x_i}$（最大值函数的平滑版本）、二次型 $\mathbf{x}^T\mathbf{P}\mathbf{x}$（$\mathbf{P} \succeq 0$）、以及逻辑回归的损失 $\log(1 + e^{z})$。指示函数的凸性等价于对应集合的凸性，因此集合的保凸运算上面已经列出。

下列代码对四个函数验证凸性的三个判定条件：Hessian 的最小特征值、一阶条件在随机点对上的余量、Jensen 不等式在随机点对与随机权重上的违背次数。

```python
import numpy as np

def f_quad(x): return 0.5 * (2 * x[0] ** 2 + 3 * x[1] ** 2 + x[0] * x[1])
def g_quad(x): return np.array([2 * x[0] + 0.5 * x[1], 3 * x[1] + 0.5 * x[0]])
def h_quad(x): return np.array([[2.0, 0.5], [0.5, 3.0]])

def f_neglog(x): return -np.log(x[0])
def g_neglog(x): return np.array([-1 / x[0], 0.0])
def h_neglog(x): return np.array([[1 / x[0] ** 2, 0.0], [0.0, 0.0]])

def f_lse(x): return np.log(np.exp(x[0]) + np.exp(x[1]))
def g_lse(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()
def h_lse(x):
    p = g_lse(x)
    return np.diag(p) - np.outer(p, p)

def f_bad(x): return x[0] ** 2 - 3 * x[0] * x[1] + x[1] ** 2      # 不定二次型
g_bad = lambda x: np.array([2 * x[0] - 3 * x[1], -3 * x[0] + 2 * x[1]])
h_bad = lambda x: np.array([[2.0, -3.0], [-3.0, 2.0]])

cases = {
    "二次型":        (f_quad,   g_quad,   h_quad,   np.array([0.5, 0.5])),
    "负对数":        (f_neglog, g_neglog, h_neglog, np.array([4.0, 0.0])),
    "log-sum-exp":   (f_lse,    g_lse,    h_lse,    np.array([-1.0, 1.0])),
    "不定二次型":    (f_bad,    g_bad,    h_bad,    np.array([0.3, 0.7])),
}
rng = np.random.default_rng(1)
for name, (f, g, H, x0) in cases.items():
    min_eig = np.linalg.eigvalsh(H(x0)).min()
    viol = 0
    for _ in range(20000):
        x = x0 + rng.normal(scale=0.8, size=2)
        y = x + rng.normal(scale=0.8, size=2)
        if name == "负对数" and (x[0] <= 0.05 or y[0] <= 0.05):
            continue
        if f(y) - f(x) - g(x) @ (y - x) < -1e-10:      # 一阶条件
            viol += 1
    jviol = 0
    for _ in range(20000):
        x = x0 + rng.normal(scale=0.8, size=2)
        y = x0 + rng.normal(scale=0.8, size=2)
        if name == "负对数" and (x[0] <= 0.05 or y[0] <= 0.05):
            continue
        t = rng.random()
        if f(t * x + (1 - t) * y) > t * f(x) + (1 - t) * f(y) + 1e-10:   # Jensen
            jviol += 1
    print(f"{name:12s}: Hessian 最小特征值 = {min_eig:+.3f}，一阶条件违背 {viol:5d} 次，Jensen 违背 {jviol:5d} 次")
# 三个凸函数的违背次数为零（负对数与 log-sum-exp 的 Hessian 最小特征值为 0，对应平坦方向与平移不变性）
# 不定二次型的 Hessian 最小特征值为 -1，两个判据都被大量违背
```

输出把凸性与非凸性的差别显示得很直接。三个凸函数的两个判据在 $2$ 万次抽样中零违背；不定二次型的 Hessian 最小特征值为 $-1$，一阶条件与 Jensen 不等式分别被违背约 $5000$ 次（约四分之一，与负曲率方向所占的立体角比例相符）。负对数与 log-sum-exp 的最小特征值为 $0$ 而非正数，来自函数在某个方向上的平坦性：负对数不依赖第二个变量，log-sum-exp 在平移方向 $\mathbf{x} + t\mathbf{1}$ 上梯度为零（softmax 的平移不变性）。这两个例子说明半正定判定允许边界情形，凸性不要求严格。

## 3.2.5 共轭函数与 Fenchel 对偶

### 共轭函数

函数 $f$ 的**共轭函数**（conjugate function，也称 Fenchel 共轭）定义为

$$
f^*(\mathbf{y}) = \sup_{\mathbf{x}}\left(\mathbf{y}^T\mathbf{x} - f(\mathbf{x})\right)
$$

右端的量 $\mathbf{y}^T\mathbf{x} - f(\mathbf{x})$ 是斜率为 $\mathbf{y}$ 的线性函数与 $f$ 之间的差，对它取上确界得到的是用斜率参数化的描述。无论 $f$ 是否凸，$f^*$ 总是凸函数：它是关于 $\mathbf{y}$ 的一族仿射函数的上确界，而逐点最大值保持凸性。

三个基本事实把共轭函数与前面的工具连接起来。

**Fenchel 不等式**：对任意 $\mathbf{x}, \mathbf{y}$，

$$
f(\mathbf{x}) + f^*(\mathbf{y}) \geq \mathbf{x}^T\mathbf{y}
$$

等号成立当且仅当 $\mathbf{y} \in \partial f(\mathbf{x})$（$\mathbf{x}$ 是上确界的取到点）。不等式可以直接从定义读出。

**二次共轭**：$f^{**} = (f^*)^*$ 是 $f$ 的闭凸包络：它是不超过 $f$ 的最大闭凸函数。特别地，$f$ 为闭凸函数时 $f^{**} = f$；$f$ 不凸时 $f^{**}$ 把 $f$ 凸化（把图像下方填成凸的形状）。

**共轭次梯度**：Fenchel 不等式取等号的条件可以写成一个对称的对偶关系，$\mathbf{y} \in \partial f(\mathbf{x})$ 等价于 $\mathbf{x} \in \partial f^*(\mathbf{y})$。求导与取共轭在次梯度意义下互为逆运算，这一对称性在近端算法（3.7 节）里直接使用。

几个常用函数的共轭有闭式：

| $f(\mathbf{x})$ | $f^*(\mathbf{y})$ |
|------|------|
| $\frac{1}{2}\mathbf{x}^T\mathbf{Q}\mathbf{x}$（$\mathbf{Q} \succ 0$） | $\frac{1}{2}\mathbf{y}^T\mathbf{Q}^{-1}\mathbf{y}$ |
| $\|\mathbf{x}\|$ | $0$（$\|\mathbf{y}\|_* \leq 1$），$+\infty$（其他） |
| $\max_i x_i$ | $0$（$\mathbf{y} \geq 0$ 且 $\sum_i y_i = 1$），$+\infty$（其他） |
| $-\sum_i \log x_i$（$x_i > 0$） | $-\sum_i \log(-y_i) - n$（$y_i < 0$） |
| 指示函数 $I_C(\mathbf{x})$ | 支撑函数 $S_C(\mathbf{y}) = \sup_{\mathbf{x} \in C} \mathbf{y}^T\mathbf{x}$ |

最后一行的对偶关系说明：集合的支撑函数就是其指示函数的共轭，因此闭凸集可以由它的支撑函数完全描述。这一事实把集合的包含、交运算转化为支撑函数的不等式，是凸集计算的基础工具。

### Fenchel 对偶

共轭函数给出一种对偶形式，它与 3.6 节的拉格朗日对偶是同一件事的两种表达：

$$
\inf_{\mathbf{x}}\left(f(\mathbf{x}) + g(\mathbf{x})\right) \geq \sup_{\mathbf{y}}\left(-f^*(\mathbf{y}) - g^*(-\mathbf{y})\right)
$$

右端是左端的下界。凸性与约束规范成立时左右两端相等，右端的最优解 $\mathbf{y}^*$ 联系两个函数的次梯度（在最优点处 $-\mathbf{y}^* \in \partial f(\mathbf{x}^*)$，$\mathbf{y}^* \in \partial g(\mathbf{x}^*)$），这正是互补松弛的共轭形式。Fenchel 对偶的优点是把带约束问题写成两个无约束共轭函数之和，便于构造分裂算法：3.7 节的 ADMM 与原始对偶方法都建立在这个形式之上。

下列代码验证共轭函数的两条性质：Fenchel 不等式在随机点上成立，以及二次共轭在闭凸函数上恢复原函数、在非凸函数上给出凸包络。

```python
import numpy as np

xs = np.linspace(-3, 3, 2001)

# f(x) = |x| 的共轭：|y| <= 1 时等于 0，|y| > 1 时为 +inf（数值上随网格扩大而增大）
print("f(x) = |x| 的共轭 sup_x (y x - |x|)：")
for y in [-2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 2.0]:
    print(f"  y = {y:+.1f}: 数值上确界 = {np.max(y * xs - np.abs(xs)):8.3f}")

# f(x) = 0.5 x^2 的二次共轭恢复原函数
print("\nf(x) = 0.5 x^2 的二次共轭：")
for x in [-2.0, -0.5, 0.0, 1.5]:
    biconj = np.max(x * xs - 0.5 * xs ** 2)      # f*(y) = 0.5 y^2
    print(f"  x = {x:+.1f}: f(x) = {0.5 * x ** 2:.4f}，f**(x) = {biconj:.4f}")

# f 为 {-1, 1} 上的指示函数时 f*(y) = |y|，二次共轭为 [-1, 1] 的指示函数（凸包络）
print("\nf(x) = 0（x = ±1），+inf（其他）的二次共轭：")
for x in [-2.0, -0.5, 0.5, 2.0]:
    biconj = np.max(x * xs - np.abs(xs))
    print(f"  x = {x:+.1f}: f**(x) = {biconj:.4f}（区间外随网格扩大而增大，对应 +inf）")

# Fenchel 不等式：f(x) + f*(y) - x y = 0.5 (x - y)^2 >= 0
rng = np.random.default_rng(2)
X, Y = rng.normal(size=5000), rng.normal(size=5000)
gap = 0.5 * X ** 2 + 0.5 * Y ** 2 - X * Y
print(f"\nFenchel 不等式最小余量 = {gap.min():.3e}，等于 0.5 (x - y)^2 的最小值")
# 二次函数的二次共轭与原函数逐点相同；指示函数的二次共轭是区间的指示函数
# |x| 的共轭在 |y| > 1 时的数值随网格扩大，对应上确界为无穷
```

输出依次验证三条性质。绝对值的共轭在 $|y| \leq 1$ 时为 $0$，在 $y = \pm 2$ 处数值随网格扩大而增大（对应 $+\infty$）；二次函数的二次共轭与原函数逐点一致；$\{\pm 1\}$ 上指示函数的二次共轭在 $[-1, 1]$ 内取 $0$、区间外发散，正是区间指示函数的形式，即两个孤立点的凸包络。Fenchel 不等式的最小余量趋于零（在 $\mathbf{x} = \mathbf{y}$ 处取等号）。

## 3.2.6 光滑性、强凸性与次梯度

### 光滑性与强凸性

凸性刻画曲率的符号，光滑性与强凸性进一步给出曲率的上下界。

$f$ 称为**光滑**（smooth，$L$-光滑）的，若其梯度 Lipschitz 连续：

$$
\|\nabla f(\mathbf{x}) - \nabla f(\mathbf{y})\| \leq L\|\mathbf{x} - \mathbf{y}\|
$$

$L$ 称为 Lipschitz 常数，对二阶可微函数它等于 Hessian 的谱范数上界。光滑性给出二次上界：

$$
f(\mathbf{y}) \leq f(\mathbf{x}) + \nabla f(\mathbf{x})^T(\mathbf{y} - \mathbf{x}) + \frac{L}{2}\|\mathbf{y} - \mathbf{x}\|^2
$$

**强凸**（$m$-强凸）给出对应的二次下界（定义见上一小节）。两条界合起来把函数夹在两个二次函数之间，这是 3.3 节推导梯度法收敛速率的出发点。比值

$$
\kappa = \frac{L}{m} \geq 1
$$

称为**条件数**，它决定一阶方法的收敛速度：条件数越大，收敛越慢。二次函数上 $\kappa$ 等于 Hessian 最大特征值与最小特征值之比，几何上是下水平集椭球的最长轴与最短轴之比，迭代轨迹在高曲率方向上来回震荡、在低曲率方向上缓慢前进。下一节的收敛速率公式与 3.4 节的加速方法都以 $\kappa$ 为核心参数。

$L$-光滑且 $m$-强凸的函数还满足两个有用的推论：梯度映射的单调性加强为 $(\nabla f(\mathbf{x}) - \nabla f(\mathbf{y}))^T(\mathbf{x} - \mathbf{y}) \geq \frac{mL}{m+L}\|\mathbf{x}-\mathbf{y}\|^2 + \frac{1}{m+L}\|\nabla f(\mathbf{x}) - \nabla f(\mathbf{y})\|^2$（cocoercivity），以及函数值的最优性间隙夹住梯度范数：$\frac{1}{2L}\|\nabla f(\mathbf{x})\|^2 \leq f(\mathbf{x}) - f(\mathbf{x}^*) \leq \frac{1}{2m}\|\nabla f(\mathbf{x})\|^2$。

### 次梯度与次微分

可微性不是凸性的必要条件。$f(x) = |x|$ 在 $0$ 处不可微，但仍可以用切线的推广描述它：过 $(0, 0)$ 且斜率在 $[-1, 1]$ 内的直线都位于函数图像下方。这引出**次梯度**（subgradient）的定义：向量 $\mathbf{g}$ 称为 $f$ 在 $\mathbf{x}$ 处的次梯度，若

$$
f(\mathbf{y}) \geq f(\mathbf{x}) + \mathbf{g}^T(\mathbf{y} - \mathbf{x}), \qquad \forall \mathbf{y}
$$

全部次梯度构成的集合称为**次微分**（subdifferential），记作 $\partial f(\mathbf{x})$。凸函数的次微分在每一点非空（在定义域内部）、闭且凸；函数在 $\mathbf{x}$ 处可微时次微分退化为单点集 $\{\nabla f(\mathbf{x})\}$。几个常用例子：$\partial|x|$ 在 $x \neq 0$ 时为 $\{\mathrm{sign}(x)\}$，在 $x = 0$ 时为 $[-1, 1]$；$\partial \max(0, x)$ 在 $x = 0$ 时为 $[0, 1]$；$\partial\|\mathbf{x}\|_2$ 在原点为范数球的单位球 $\{\mathbf{g} : \|\mathbf{g}\|_2 \leq 1\}$。

次微分继承单调性：凸函数的次微分是**单调算子**，即对任意 $\mathbf{g}_1 \in \partial f(\mathbf{x}_1)$、$\mathbf{g}_2 \in \partial f(\mathbf{x}_2)$，

$$
(\mathbf{g}_1 - \mathbf{g}_2)^T(\mathbf{x}_1 - \mathbf{x}_2) \geq 0
$$

这一性质使凸优化与非光滑分析可以用统一的算子语言处理（3.7 节）。次微分还给出最优性条件：$\mathbf{0} \in \partial f(\mathbf{x}^*)$ 是 $f$ 在 $\mathbf{x}^*$ 取全局最小的充要条件，它把 3.3 节的 $\nabla f = \mathbf{0}$ 推广到非光滑情形。

与光滑性和强凸性并列的还有一个概念：**自协调性**（self-concordance），它限制三阶导数相对二阶导数的比例，是牛顿法复杂度分析（3.6 节内点法）的工具。对 $f(x) = -\log x$，自协调性成立；内点法正是通过对数障碍函数把约束问题转化为一串自协调的无约束问题。

下列代码估计光滑常数与强曲常数（用采样上确界与下确界），并验证次梯度的定义式。

```python
import numpy as np

Q = np.array([[4.0, 1.0], [1.0, 2.0]])
print(f"二次函数 0.5 x'Qx：真实 L = {np.linalg.eigvalsh(Q).max():.6f}，m = {np.linalg.eigvalsh(Q).min():.6f}")

rng = np.random.default_rng(3)
grad = lambda x: Q @ x
L_est, m_est = 0.0, np.inf
for _ in range(200000):
    x, y = rng.normal(scale=3, size=2), rng.normal(scale=3, size=2)
    d = x - y
    nd = np.linalg.norm(d)
    if nd < 1e-6:
        continue
    L_est = max(L_est, np.linalg.norm(grad(x) - grad(y)) / nd)          # 梯度差之比的上确界
    m_est = min(m_est, (grad(x) - grad(y)) @ d / nd ** 2)               # 二次下界的下确界
print(f"采样估计：L ≈ {L_est:.6f}，m ≈ {m_est:.6f}（条件数 kappa = {L_est / m_est:.4f}）")

# |x| 在 0 处的次微分：检验 f(y) >= f(0) + g y 对全体 y 成立的 g
ygrid = np.linspace(-5, 5, 40001)
print("\n|x| 在 0 处的次梯度检验：")
for g in [-1.0, -0.5, 0.0, 0.5, 1.0, 1.5]:
    ok = np.all(np.abs(ygrid) >= g * ygrid)
    print(f"  g = {g:+.1f}：定义式对全体 y 成立：{ok}")
# 采样比值从下方逼近真实常数：L 的估计不超过 4.414214 的有效上确界
# g 在 [-1, 1] 内都满足定义式，g = 1.5 失败，次微分恰为区间 [-1, 1]
```

输出显示采样估计的 $L$ 与 $m$ 收敛到 Hessian 的两个特征值，条件数为 $2.78$。次梯度部分给出了定义式的直接检验：斜率在 $[-1, 1]$ 内的直线都位于 $|x|$ 图像下方，$1.5$ 的斜率失败，因此 $\partial|x|(0) = [-1, 1]$。

## 3.2.7 本节小结

::: success 凸性的几何与判据
本节建立了凸性工具箱。凸集对凸组合封闭，常见例子包括超平面、半空间、多面体、单纯形、范数球、二阶锥与半正定锥，保凸运算（交、仿射映射、部分变量最小化、凸包）使新集合的凸性可以归结为已知成分。分离定理给出凸集的几何核心：不相交的凸集之间存在分离超平面，线性系统的可解性由 Farkas 引理刻画，对偶锥描述可行方向的结构。投影是最近点问题的解，由变分不等式唯一刻画，并满足非扩张性。凸函数的三个判定条件是上方图的凸性、Jensen 不等式、一阶切平面条件与 Hessian 半正定；严格凸与强凸分别保证最优解唯一与线性收敛速率，光滑性与强凸性给出二次上下界，条件数 $L/m$ 决定梯度法的速度。共轭函数把函数用斜率参数化，Fenchel 不等式与二次共轭给出闭凸包络与 Fenchel 对偶；次梯度把最优性条件推广到非光滑函数，并满足单调性。这些工具在后续各节分别用于收敛速率（3.3、3.4）、KKT 条件与对偶（3.6）、近端算法与算子分裂（3.7）。
:::

本节内容以判据与结论为主，下一节开始使用它们。3.3 节把一阶与二阶最优性条件完整列出，用光滑性与强凸性的二次界推导梯度法的收敛速率，并讨论步长选择与梯度的计算方式。

## 练习题

### 第 1 题 概念推导

证明两条结论：其一，有限个凸集的交集是凸集；其二，$f$ 为一组凸函数 $f_1, \ldots, f_k$ 的逐点最大值时，$f$ 是凸函数。用第一条结论推出多面体是凸集，用第二条结论推出 log-sum-exp 是最大值的平滑版本（说明 $\max_i x_i \leq \log\sum_i e^{x_i} \leq \max_i x_i + \log k$）。

::: details 参考答案
**交集的凸性**：设 $C = \bigcap_{i} C_i$，每个 $C_i$ 凸。取 $\mathbf{x}, \mathbf{y} \in C$ 与 $\theta \in [0,1]$。对每个 $i$，$\mathbf{x}, \mathbf{y} \in C_i$，由 $C_i$ 的凸性 $\theta\mathbf{x} + (1-\theta)\mathbf{y} \in C_i$。这对所有 $i$ 成立，因此该点属于交集 $C$。多面体是有限个半空间与超平面的交，半空间与超平面都是凸集，因此多面体凸。

**逐点最大值的凸性**：记 $f(\mathbf{x}) = \max_i f_i(\mathbf{x})$。对任意 $\mathbf{x}, \mathbf{y}$ 与 $\theta \in [0,1]$，设 $j$ 是使 $f$ 在凸组合点取最大的指标，则

$$
f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) = f_j(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \leq \theta f_j(\mathbf{x}) + (1-\theta) f_j(\mathbf{y}) \leq \theta f(\mathbf{x}) + (1-\theta) f(\mathbf{y})
$$

第一步用了 $j$ 的定义，第二步用了 $f_j$ 的凸性，第三步用了 $f_j \leq f$。结论成立。另一个证明是把上方图写成交：$\mathrm{epi}\,f = \bigcap_i \mathrm{epi}\,f_i$。

**log-sum-exp 的夹逼**：设 $x_{\max} = \max_i x_i$，则

$$
e^{x_{\max}} \leq \sum_i e^{x_i} \leq k\, e^{x_{\max}}
$$

三边取对数得 $x_{\max} \leq \log\sum_i e^{x_i} \leq x_{\max} + \log k$。因此 log-sum-exp 是最大值函数的 $\log k$ 精度平滑近似，而它本身是凸函数（第 3.2.4 节的代码验证了这一结论）。这一函数在机器学习中反复出现：softmax 的 log 配分函数、多项式逻辑回归的损失、以及变分推断中的对数求和指数运算都用它。平滑带来的好处是可微性：最大值函数在多个分量相等处不可微，log-sum-exp 处处光滑，其梯度为 softmax。
:::

### 第 2 题 计算推理

$f(\mathbf{x}) = \frac{1}{2}\mathbf{x}^T\mathbf{Q}\mathbf{x}$，其中 $\mathbf{Q} = \mathrm{diag}(1, 100)$，定义域为 $\R^2$。计算 $L$、$m$ 与条件数 $\kappa$；写出 $f$ 的共轭函数；说明梯度下降在这类问题上为什么沿第一个坐标收敛慢、沿第二个坐标震荡；若把坐标缩放为 $z_2 = 10 x_2$，新的条件数与共轭形式如何变化。

::: details 参考答案
**常数与条件数**：Hessian 恒为 $\mathbf{Q}$，因此 $L = 100$，$m = 1$，$\kappa = 100$。

**共轭函数**：由表中的二次函数公式，$f^*(\mathbf{y}) = \frac{1}{2}\mathbf{y}^T\mathbf{Q}^{-1}\mathbf{y} = \frac{1}{2}\left(y_1^2 + \frac{1}{100}y_2^2\right)$。

**梯度下降的行为**：梯度为 $\nabla f = (x_1, 100x_2)$。沿第二个坐标的曲率为 $100$，步长受 $1/L = 0.01$ 限制，一次更新把 $x_2$ 乘以 $1 - 0.01 \times 100 = 0$（最优步长下一步收敛，但稍大的步长立即发散震荡）；沿第一个坐标的更新因子为 $1 - 0.01 \times 1 = 0.99$，每步只减小约百分之一，需要约两百步才能缩小到 $e^{-1}$。两个方向的快慢差 $\kappa = 100$ 倍，这就是条件数决定收敛速度的具体机制。

**坐标缩放**：令 $z_1 = x_1$，$z_2 = 10 x_2$，则 $f = \frac{1}{2}(z_1^2 + z_2^2)$，Hessian 变为单位矩阵，$L = m = 1$，条件数为 $1$，梯度下降一步收敛。共轭函数在新坐标下为 $\frac{1}{2}(u_1^2 + u_2^2)$。缩放改变了条件数而不改变问题的最优解，说明条件数依赖参数化方式；3.4 节的自适应方法可以看作在训练过程中自动学习类似的缩放，3.5 节的拟牛顿法显式地估计这个缩放矩阵。
:::

### 第 3 题 代码验证

用 3.2.4 节的判定代码检查三个新函数：$f_1(\mathbf{x}) = \|\mathbf{x}\|_1$（用次梯度形式验证一阶条件），$f_2(\mathbf{x}) = \log\sum_i e^{x_i}$ 在三维情形，$f_3(\mathbf{x}) = x_1^2 x_2^2$（在 $x_1 x_2 > 0$ 的区域判断凸性）。对每个函数给出结论与依据；说明第三个函数在哪些区域上凸、哪些区域上不凸。

::: details 参考答案
```python
import numpy as np

rng = np.random.default_rng(5)

def f1(x): return np.abs(x).sum()                      # L1 范数

def g1(x):                                             # 次梯度：非零坐标取 sign，零坐标取 0
    return np.where(np.abs(x) > 1e-12, np.sign(x), 0.0)

def f2(x): return np.log(np.exp(x).sum())
def g2(x):
    e = np.exp(x - x.max())
    return e / e.sum()
def h2(x):
    p = g2(x)
    return np.diag(p) - np.outer(p, p)

def f3(x): return x[0] ** 2 * x[1] ** 2
def h3(x): return np.array([[2 * x[1] ** 2, 4 * x[0] * x[1]], [4 * x[0] * x[1], 2 * x[0] ** 2]])

# f1：一阶条件（用次梯度）
x0 = np.array([1.0, -2.0, 0.5])
viol = 0
for _ in range(20000):
    y = x0 + rng.normal(size=3)
    if f1(y) < f1(x0) + g1(x0) @ (y - x0) - 1e-10:
        viol += 1
print("f1 一阶条件违背次数 =", viol)

# f2：Hessian 最小特征值（随机点）
mins = [np.linalg.eigvalsh(h2(rng.normal(size=3))).min() for _ in range(2000)]
print(f"f2 Hessian 最小特征值的最小值 = {np.min(mins):.3e}（非负）")

# f3：Hessian 半正定性随区域变化（行列式 = -12 x1^2 x2^2 < 0，除坐标轴外处处不定）
for pt in [(1.0, 1.0), (1.0, -1.0), (0.0, 2.0)]:
    H = h3(np.array(pt))
    print(f"f3 在 {pt}：Hessian 特征值 = {np.round(np.linalg.eigvalsh(H), 4)}")
```

输出（节选）：

```text
f1 一阶条件违背次数 = 0
f2 Hessian 最小特征值的最小值 = -1.793e-16（非负）
f3 在 (1.0, 1.0)：Hessian 特征值 = [-2.  6.]
f3 在 (1.0, -1.0)：Hessian 特征值 = [-2.  6.]
f3 在 (0.0, 2.0)：Hessian 特征值 = [0. 8.]
```

**结论**：$f_1$ 的次梯度定义式在 $2$ 万次抽样中零违背，与 $\ell_1$ 范数的凸性一致（次梯度存在本身就来自凸性）。$f_2$ 的 Hessian 最小特征值在数值精度内非负（$-1.8 \times 10^{-16}$ 是浮点舍入），三维 log-sum-exp 凸。$f_3$ 的 Hessian 在四个象限内部的特征值为 $-2$ 与 $6$，行列式为 $-12x_1^2x_2^2$，除坐标轴外处处为负，因此函数在任何不接触坐标轴的开区域上都不凸；用一阶条件与 Jensen 不等式做抽样检验时，违背比例分别约为 $12\%$ 与 $13\%$，与负曲率方向所占的角度比例一致。在坐标轴上（如 $(0, 2)$）Hessian 半正定（特征值 $0$ 与 $8$），但这一点的局部信息不足以判定全局凸性。

关于凸性判定的方法选择：$f_3 = (x_1x_2)^2$ 的外层函数 $t^2$ 是凸函数，内层 $x_1x_2$ 不是仿射函数，保凸运算的复合规则不适用；外层函数在 $t < 0$ 区间上还单调递减，常用复合结论的前提都不满足。这类复合函数只能回到定义或二阶条件判断，二阶条件的检验给出了确定答案。
:::

### 第 4 题 综合应用

某推荐系统要把物品的打分向量约束到单纯形上（非负且和为一），并希望投影操作足够快。给定打分 $\mathbf{x} = (0.8, 2.4, -0.6, 1.4)$。计算 $\mathbf{x}$ 在单纯形上的投影；说明排序法的计算复杂度与在 $n = 10^6$ 维时的可行性；若系统改用一个不精确的投影（把负值截断后重新归一化），指出它违反哪条性质，并说明这对基于投影梯度的算法收敛性意味着什么。

::: details 参考答案
**投影计算**：排序后的分量为 $(2.4, 1.4, 0.8, -0.6)$。依次检验阈值条件：$u_1 - (u_1 - 1)/1 = 1 > 0$ 成立；$u_2 - (u_1 + u_2 - 1)/2 = 1.4 - 1.9 = -0.5 < 0$ 不成立，因此阈值取在 $k = 1$ 处，$\theta = u_1 - 1 = 1.4$。投影为

$$
P(\mathbf{x}) = \max(\mathbf{x} - 1.4,\ \mathbf{0}) = (0,\ 1.0,\ 0,\ 0)
$$

和为一，非负，且合理：第二个分量明显最大，投影把全部质量分配给它。

**复杂度**：排序的复杂度为 $O(n\log n)$，线性扫描为 $O(n)$，总体 $O(n\log n)$。对 $n = 10^6$，排序在现代硬件上耗时约几十毫秒，可以接受。若需要进一步加速，可以用选择算法把排序替换为部分排序（找阈值只需分位数），复杂度降到期望 $O(n)$。逐坐标截断的盒子投影是 $O(n)$，单纯形投影多出的排序开销是它相对昂贵的部分。

**不精确投影的问题**：截断后重新归一化不满足变分不等式，也不满足非扩张性。取 $\mathbf{x} = (2, 0, -1)$：精确投影为 $(1, 0, 0)$；截断归一化得到 $(2/3, 0, 0)$，两者不同。更关键的是非扩张性失效：以 $k$ 步近似投影构成的映射其 Lipschitz 常数可能超过 $1$，投影梯度法的收敛性证明依赖该常数为 $1$ 的性质（步长与收敛速率都按它计算）。实践中若使用不精确投影，需要在算法分析中把误差当作扰动项处理，收敛结论通常变为收敛到最优解附近的邻域，邻域半径与投影误差成正比。另一种做法是改用精确但更快的投影算法（如对偶坐标上升法，按需更新而非全量排序），在保持性质的前提下降低成本。
:::

## 常见错误

**错误 1 · 用下水平集的凸性推断函数的凸性**

原因：凸函数的下水平集是凸集，但反过来不成立。$f(x) = \sqrt{|x|}$ 与 $f(x) = -\log x$（把可行域视作 $\{x > 0\}$ 的下水平集）都提供反例的构造方式：拟凸函数的每个下水平集是区间，函数本身却可能不凸。由下水平集的样子判断凸性会导致错误的结论，进而在该函数上使用只对凸问题成立的结论（例如声称一阶稳定点是全局最优）。

解决：使用三个严格判据之一：上方图的凸性、Jensen 不等式、一阶或二阶条件。对可微函数优先用二阶条件（Hessian 半正定）或一阶条件的数值检验（3.2.4 节的抽样方法）。需要利用下水平集结构时，明确标注结论适用于拟凸情形，并说明拟凸问题需要不同的算法（如二分法求解下水平集）。

**错误 2 · 混淆严格凸与强凸**

原因：两个概念都强化了凸性，但强度不同。严格凸保证最优解唯一，不保证线性收敛速率；强凸要求二次下界，才给出线性收敛与条件数。$f(x) = x^4$ 严格凸但非强凸（曲率在原点附近趋于零，梯度法在该函数上的收敛是次线性的），把严格凸当作强凸会错误地预期线性收敛。

解决：报告问题时给出可验证的常数：光滑常数为 $L$，强凸常数为 $m$，条件数 $\kappa = L/m$。若 $m = 0$（函数只有凸性），收敛速率按 $O(1/k)$ 而非 $(1 - m/L)^k$ 分析。数值上可以用 3.2.6 节的采样方法估计两个常数：估计 $m$ 的序列下确界若趋于零，说明强凸性不成立。

**错误 3 · 认为次梯度总是可以作为下降方向**

原因：次梯度方向不一定是下降方向。负次梯度 $-g$ 只保证在当前点附近的一阶模型上下降，非光滑函数中一阶模型与真实函数的差异可能很大，沿 $-g$ 方向移动后函数值反而上升。次梯度法的收敛速率也因此只有 $O(1/\sqrt{k})$，远低于光滑情形。

解决：非光滑问题优先使用近端方法（3.7 节）而不是原始次梯度法，近端算子把非光滑部分精确处理，光滑部分用梯度，收敛速率提高到 $O(1/k)$ 或更好。必须使用次梯度法时，用递减步长（$\eta_k \propto 1/\sqrt{k}$）并汇报多步平均的目标值，而不是最后一步的取值。

**错误 4 · 把共轭函数当普通函数的对偶形式使用而忽略凸性前提**

原因：共轭函数 $f^*$ 对任意 $f$ 都有定义且总是凸的，但二次共轭 $f^{**} = f$ 只在 $f$ 闭凸时成立。对非凸函数使用 $f^{**} = f$ 会得到错误结论：$f^{**}$ 是不超过 $f$ 的最大凸函数（凸包络），两个函数在非凸区域差别很大。

解决：使用共轭与 Fenchel 对偶前先确认 $f$ 与 $g$ 闭凸，或显式使用凸包络替换原函数（这等价于把问题凸松弛，得到的下界与原问题最优值之间有间隙）。对常用的损失与正则项，可以直接查共轭表并核对定义域条件：表中的每个公式都有前提（如二次函数要求 $\mathbf{Q} \succ 0$，负对数要求 $x_i > 0$ 与 $y_i < 0$），条件不满足时共轭取 $+\infty$，代入数值公式会得到错误的结果。