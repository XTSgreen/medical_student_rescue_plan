---
title: 1.6 特征值与特征向量
sidebar:
  order: 6
---

# 1.6 特征值与特征向量

<span class="chapter-tag">第一章 · 线性代数</span>

上一节我们建立了"正交性—投影—最小二乘—QR 分解"的完整工具链，把"哪些方向相互垂直"这一几何问题锻造为可计算的代数算法。但线性代数中还有另一类深刻的几何问题：**当矩阵 $A$ 作用于空间时，是否存在某些特殊方向，在变换前后方向保持不变？** 这一问题引出**特征值与特征向量**——线性代数中最具几何美感、也最具工程威力的概念。

如果说正交投影回答了"如何把向量最近地表示为已知子空间的元素"，那么特征分解回答了"如何找到矩阵自身的'固有坐标系'——在这个坐标系下，变换退化为最简的纯缩放"。当 $A$ 作用于其特征向量 $\mathbf{v}$ 时，结果是 $A\mathbf{v} = \lambda \mathbf{v}$：方向不变，只被缩放 $\lambda$ 倍。**这一缩放因子 $\lambda$ 就是特征值**，它揭示了矩阵在该方向上的"内在强度"。

本节将沿"几何直觉 → 特征方程 → 迹与行列式的不变量 → 特征空间与重数 → 对角化 → 实对称矩阵的正交对角化 → 综合谱图景"这条主线，把特征分解从抽象定义锻造为可计算的代数工具，并铺设通往 PCA、PageRank、SVD 等高级应用的桥梁。

## 1.6.1 几何直觉：变换中的"不变方向"

### 从正交投影到"变换的不变方向"

在 1.5 节中，我们关心的是"向量与子空间"的几何关系——投影、正交、最小二乘。这些讨论中，矩阵 $A$ 扮演的是"映射工具"的角色：把 $\mathbf{x}$ 映射为 $A\mathbf{x}$。但我们尚未追问一个更深刻的问题：**矩阵 $A$ 作为变换，是否有自己的"固有几何结构"？**

考虑一个线性变换 $A: \mathbb{R}^n \to \mathbb{R}^n$。一般情况下，$A$ 会把向量"扭曲"——既旋转又伸缩，方向也会改变。但某些特殊方向上，$A$ 的作用会异常简单：**只缩放，不旋转**。这些方向就是 $A$ 的特征向量，对应的缩放因子就是特征值。

### 特征值与特征向量的严格定义

设 $A \in \mathbb{R}^{n \times n}$ 是方阵。若存在标量 $\lambda \in \mathbb{C}$ 和非零向量 $\mathbf{v} \in \mathbb{C}^n$（$\mathbf{v} \neq \mathbf{0}$），使得：

$$
A\mathbf{v} = \lambda \mathbf{v}
$$

则称 $\mathbf{v}$ 为 $A$ 的**特征向量**（Eigenvector），$\lambda$ 为对应的**特征值**（Eigenvalue）。

注意三个要点：

1. **$\mathbf{v} \neq \mathbf{0}$**：零向量被任何矩阵都映射为零，即 $A\mathbf{0} = \lambda \mathbf{0}$ 对任意 $\lambda$ 都成立，没有信息量，故必须排除。
2. **$\lambda$ 可为复数**：即使 $A$ 是实矩阵，特征值也可能是复数（如旋转矩阵），故定义在 $\mathbb{C}$ 上更通用。
3. **$\mathbf{v}$ 的方向不变**：$A\mathbf{v}$ 与 $\mathbf{v}$ 共线（在同一条直线上），仅长度和指向可能变化。

### 几何解读：缩放的四种情形

把 $\lambda$ 写成 $\lambda = \text{sign}(\lambda) \cdot |\lambda|$，可以得到四种典型几何情形：

| 特征值范围 | 几何效果 | 说明 |
|-----------|---------|------|
| $\lambda > 0$ 且 $|\lambda| > 1$ | 同向放大 | $\mathbf{v}$ 被拉长，方向不变 |
| $\lambda > 0$ 且 $|\lambda| < 1$ | 同向缩小 | $\mathbf{v}$ 被压缩，方向不变 |
| $\lambda < 0$ | 反向缩放 | $\mathbf{v}$ 翻转 $180°$，长度变 $|\lambda|$ 倍 |
| $\lambda = 0$ | 压扁为零 | $\mathbf{v}$ 落入零空间，$A\mathbf{v} = \mathbf{0}$ |

更一般地，当 $\lambda$ 为复数 $\lambda = re^{i\theta}$ 时（$r = |\lambda|, \theta = \arg\lambda$），变换在复平面内表现为"旋转 $\theta$ 角 + 缩放 $r$ 倍"。实矩阵的复特征值总是成共轭对出现（$\lambda, \bar{\lambda}$），对应的复特征向量也共轭。

### 特征向量的"方向不变"而非"向量不变"

需要强调：**特征向量的方向不变，并不意味着向量本身不变**。$A\mathbf{v} = \lambda \mathbf{v}$ 中 $\lambda$ 可以不等于 1，所以 $\mathbf{v}$ 的长度和指向（当 $\lambda < 0$）都会变化。所谓"方向不变"指的是 $\mathbf{v}$ 所在的直线（一维子空间 $\text{span}\{\mathbf{v}\}$）在 $A$ 作用下保持稳定——$A$ 把这条直线映射到自身。

更精确地说：特征向量 $\mathbf{v}$ 张成的一维子空间 $\text{span}\{\mathbf{v}\}$ 是 $A$ 的**不变子空间**（Invariant Subspace）：

$$
A(\text{span}\{\mathbf{v}\}) \subseteq \text{span}\{\mathbf{v}\}
$$

### 反例：旋转矩阵没有实特征向量

考虑二维旋转矩阵（旋转角 $\theta$，且 $\theta \neq 0, \pi$）：

$$
R_\theta = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$

它的特征多项式为：

$$
\det(R_\theta - \lambda I) = (\cos\theta - \lambda)^2 + \sin^2\theta = \lambda^2 - 2\cos\theta \cdot \lambda + 1
$$

判别式 $\Delta = 4\cos^2\theta - 4 = -4\sin^2\theta < 0$（当 $\sin\theta \neq 0$ 时），故特征值为复数：

$$
\lambda = \cos\theta \pm i\sin\theta = e^{\pm i\theta}
$$

**几何含义**：旋转矩阵把每个实向量都旋转了 $\theta$ 角，没有任何实方向能保持不变（除 $\theta = 0$ 恒等变换、$\theta = \pi$ 翻转变换外）。但若允许复特征值，则 $|e^{i\theta}| = 1$ 表明旋转矩阵"只旋转、不缩放"——这与几何直觉完美吻合。

这一反例说明：**实矩阵不一定有实特征值**。若坚持只在 $\mathbb{R}$ 中讨论，会失去旋转这类重要变换的特征结构。这就是为什么特征值的定义要在 $\mathbb{C}$ 上给出。

### 几何直觉的代数化：从图像到方程

特征向量的几何图像可以用一句话概括：**"沿这条直线方向，$A$ 退化为标量乘法"**。把这一图像代数化，就得到方程 $A\mathbf{v} = \lambda \mathbf{v}$。后续 1.6.2 节将看到，这一简洁方程通过 $(A - \lambda I)\mathbf{v} = \mathbf{0}$ 化为齐次线性方程组，并最终通过行列式 $\det(A - \lambda I) = 0$ 化为多项式求根问题——这就是**特征方程**的诞生。

::: key-idea 特征向量的几何本质
特征向量 $\mathbf{v}$ 不是"任意被 $A$ 变换的向量"，而是"沿它方向 $A$ 退化为纯缩放"的特殊向量。其几何判据是 $A\mathbf{v}$ 与 $\mathbf{v}$ 共线，代数表达是 $A\mathbf{v} = \lambda \mathbf{v}$。这一"方向不变 + 长度缩放"的几何性质，让特征向量成为矩阵"固有坐标系"的最佳候选——后续 1.6.5 节的对角化就是把变换换到这个坐标系下，让矩阵变得最简。
:::

```python
import numpy as np

# 对角矩阵：最简单的特征结构
A = np.array([[2, 0],
              [0, 3]], dtype=float)

# 求特征值与特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"特征值: {eigenvalues}")        # [2., 3.]
print(f"特征向量矩阵（每列一个）:\n{eigenvectors}")

# 验证 A v = λ v
for i in range(len(eigenvalues)):
    v = eigenvectors[:, i]
    lam = eigenvalues[i]
    Av = A @ v
    print(f"\n--- 第 {i+1} 个特征对 ---")
    print(f"  λ_{i+1} = {lam:.4f}")
    print(f"  v_{i+1} = {v}")
    print(f"  A v_{i+1} = {Av}")
    print(f"  λ v_{i+1} = {lam * v}")
    print(f"  A v == λ v? {np.allclose(Av, lam * v)}")

# 几何解读：A=[[2,0],[0,3]] 把 e1 拉长 2 倍、e2 拉长 3 倍
# 故 e1, e2 都是特征向量，特征值分别是 2 和 3
# 任意对角矩阵的特征向量就是标准基 e_i，特征值就是对角元
```

```python
import numpy as np

# 反例：旋转矩阵（45°）没有实特征向量
theta = np.pi / 4  # 45°
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])
print(f"旋转矩阵 R (45°) =\n{R}")

eigvals, eigvecs = np.linalg.eig(R)
print(f"\n特征值: {eigvals}")  # 应为 e^{±iπ/4} = (√2/2)(1±i)
print(f"模长 |λ|: {np.abs(eigvals)}")  # 应为 1, 1（纯旋转不缩放）

# 验证：任意实向量被 R 旋转后方向都变了
v = np.array([1, 0], dtype=float)
Rv = R @ v
print(f"\n向量 v = {v}")
print(f"R v = {Rv}")
print(f"v 与 Rv 共线? {np.allclose(np.cross(v, Rv), 0)}")  # False（45° 不共线）

# 唯一例外：θ=π（180°旋转），等价于 -I，所有向量都是特征向量（λ=-1）
R_pi = np.array([[np.cos(np.pi), -np.sin(np.pi)],
                 [np.sin(np.pi),  np.cos(np.pi)]])
print(f"\n180° 旋转矩阵 =\n{R_pi}")  # ≈ -I
eigvals_pi, _ = np.linalg.eig(R_pi)
print(f"特征值: {eigvals_pi}")  # 全为 -1（每个方向都是特征方向，反向缩放）
```

## 1.6.2 特征方程与特征多项式

### 从 $A\mathbf{v} = \lambda \mathbf{v}$ 到齐次方程

在 1.6.1 中我们建立了特征向量的几何直觉，现在把它转化为可计算的代数方程。从定义出发：

$$
A\mathbf{v} = \lambda \mathbf{v}
$$

把右边移到左边，并利用 $\lambda \mathbf{v} = (\lambda I)\mathbf{v}$（$I$ 是单位阵）：

$$
(A - \lambda I)\mathbf{v} = \mathbf{0}
$$

这是关于 $\mathbf{v}$ 的**齐次线性方程组**。我们要求 $\mathbf{v} \neq \mathbf{0}$，即需要这个齐次方程有**非零解**。

### 非零解条件：行列式为零

齐次方程 $(A - \lambda I)\mathbf{v} = \mathbf{0}$ 有非零解的充要条件是系数矩阵 $A - \lambda I$ 不可逆，等价于其行列式为零：

$$
\det(A - \lambda I) = 0
$$

这就是**特征方程**（Characteristic Equation）。它把"寻找 $\lambda$"的问题转化为"求解多项式方程"。

### 特征多项式的定义

记：

$$
p_A(\lambda) = \det(\lambda I - A)
$$

为 $A$ 的**特征多项式**（Characteristic Polynomial）。它是关于 $\lambda$ 的 $n$ 次多项式（$A$ 是 $n \times n$ 矩阵）。

注意 $\det(A - \lambda I) = (-1)^n \det(\lambda I - A) = (-1)^n p_A(\lambda)$，两者只差一个符号因子，故零点完全相同。习惯上用 $p_A(\lambda) = \det(\lambda I - A)$ 让首项系数为 $+1$，便于讨论。

**特征值就是特征多项式的根**：

$$
p_A(\lambda) = 0 \quad \Longleftrightarrow \quad \lambda \text{ 是 } A \text{ 的特征值}
$$

由代数基本定理，$n$ 次多项式在 $\mathbb{C}$ 上恰有 $n$ 个根（计入重数），故 $n \times n$ 矩阵恰有 $n$ 个特征值（计入代数重数，可能为复数）。

### 2×2 矩阵的显式公式

对 $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$，特征多项式为：

$$
p_A(\lambda) = \det\begin{pmatrix} \lambda - a & -b \\ -c & \lambda - d \end{pmatrix} = (\lambda - a)(\lambda - d) - bc = \lambda^2 - (a+d)\lambda + (ad - bc)
$$

注意到 $a + d = \text{tr}(A)$（迹），$ad - bc = \det(A)$，故：

$$
p_A(\lambda) = \lambda^2 - \text{tr}(A)\lambda + \det(A)
$$

这是 2×2 矩阵特征多项式的简洁公式——**只依赖迹和行列式**！这一观察将在 1.6.3 节升华为"迹与行列式是特征值的不变量"。

### 判别式与实/复特征值

对 2×2 矩阵，特征方程 $\lambda^2 - \text{tr}(A)\lambda + \det(A) = 0$ 的判别式为：

$$
\Delta = \text{tr}(A)^2 - 4\det(A)
$$

判别式决定特征值的实复性：

- $\Delta > 0$：两个不同实特征值
- $\Delta = 0$：一个实特征值（二重根）
- $\Delta < 0$：两个共轭复特征值

回到 1.6.1 的旋转矩阵 $R_\theta$：$\text{tr}(R_\theta) = 2\cos\theta$，$\det(R_\theta) = 1$，故 $\Delta = 4\cos^2\theta - 4 = -4\sin^2\theta \leq 0$。当 $\theta \neq 0, \pi$ 时 $\Delta < 0$，得到复特征值——这与 1.6.1 的几何分析完全吻合。

### 求特征值的两条路径

给定矩阵 $A$，求特征值有两条代数路径：

1. **直接求多项式根**：先计算 $p_A(\lambda) = \det(\lambda I - A)$ 的系数，再用求根公式（低次）或数值方法（高次）求根。
2. **数值迭代法**：QR 算法、幂法等直接对 $A$ 操作，无需显式构造多项式。这是工程实现（如 `numpy.linalg.eig`）的主流方法，因为高次多项式求根在数值上**极不稳定**（Wilkinson 多项式是经典反例）。

::: note 特征多项式的不变性
特征多项式 $p_A(\lambda) = \det(\lambda I - A)$ 只依赖矩阵 $A$ 本身，与基的选择无关——这是相似不变量的体现（详见 1.6.3 节）。换言之，同一个线性变换在不同基下表示为不同矩阵 $A$、$B$，但它们的特征多项式相同。这一不变性让"特征值"成为线性变换的**内在属性**，而非矩阵表示的偶然产物。
:::

### 几何重数与代数重数（先点出）

对每个特征值 $\lambda_i$，可以定义两种"重数"：

- **代数重数**（Algebraic Multiplicity, AM）：$\lambda_i$ 作为特征多项式根的重数。
- **几何重数**（Geometric Multiplicity, GM）：特征空间 $E_{\lambda_i} = \text{Null}(A - \lambda_i I)$ 的维数，即线性无关特征向量的个数。

一般有 $1 \leq \text{GM} \leq \text{AM}$。当 GM < AM 时，矩阵"不够特征向量"，无法对角化——这种"缺陷矩阵"是 1.6.4 节的主题。本节先点出概念，深入讨论留给 1.6.4。

```python
import numpy as np

# 2x2 矩阵的特征多项式与特征值
A = np.array([[4, 2],
              [1, 3]], dtype=float)

# 方法 1：直接用 numpy.linalg.eig
eigvals, eigvecs = np.linalg.eig(A)
print(f"特征值 (eig): {eigvals}")

# 方法 2：用特征多项式 p(λ) = λ^2 - tr(A) λ + det(A)
tr_A = np.trace(A)
det_A = np.linalg.det(A)
print(f"\ntr(A) = {tr_A}, det(A) = {det_A}")
print(f"特征多项式: p(λ) = λ^2 - {tr_A}λ + {det_A}")

# 用 numpy.roots 求根
coeffs = [1, -tr_A, -det_A]  # 注意符号：p(λ) = λ^2 - tr·λ + det
# numpy.poly 给出特征多项式系数（按降幂）
# 由公式 p(λ) = λ^2 - tr(A)λ + det(A)
coeffs_correct = [1, -tr_A, det_A]
roots = np.roots(coeffs_correct)
print(f"特征多项式的根 (roots): {roots}")

# 两种方法结果应一致
print(f"\n两者一致? {np.allclose(np.sort(eigvals), np.sort(roots))}")

# 验证判别式
delta = tr_A**2 - 4 * det_A
print(f"\n判别式 Δ = {delta}")
if delta > 0:
    print("→ 两个不同实特征值")
elif delta == 0:
    print("→ 一个实特征值（二重根）")
else:
    print("→ 两个共轭复特征值")
```

```python
import numpy as np

# 高阶例子：3x3 矩阵
A = np.array([[2, 1, 0],
              [0, 3, 1],
              [0, 0, 4]], dtype=float)  # 上三角矩阵

# 上三角矩阵的特征值 = 对角元
eigvals, eigvecs = np.linalg.eig(A)
print(f"特征值: {eigvals}")  # 应为 [2, 3, 4]
print(f"(上三角矩阵特征值 = 对角元)")

# 用 numpy.poly 计算特征多项式系数
# numpy.poly(A) 返回 det(λI - A) 的系数（降幂）
poly_coeffs = np.poly(A)
print(f"\n特征多项式系数 (降幂): {poly_coeffs}")
# 对应 p(λ) = c0 λ^3 + c1 λ^2 + c2 λ + c3

# 验证：用 numpy.roots 求根
roots = np.roots(poly_coeffs)
print(f"特征多项式根: {roots}")

# 三次多项式根的和 = -c1/c0 = trace(A)
# 三次多项式根的积 = -c3/c0 = -det(A)（符号取决于次数）
print(f"\n根之和 = {np.sum(roots):.4f}, tr(A) = {np.trace(A):.4f}")
print(f"根之积 = {np.prod(roots):.4f}, det(A) = {np.linalg.det(A):.4f}")

# 几何重数验证：λ=2 的特征空间维数
lam = 2.0
A_minus_lambda_I = A - lam * np.eye(3)
rank = np.linalg.matrix_rank(A_minus_lambda_I)
gm = 3 - rank  # GM = n - rank(A - λI)
print(f"\nλ=2 的几何重数 GM = {gm}")  # 应为 1（上三角，对角元各异）
```

<ClientOnly>
<EigenDirectionFinder title="特征方向探索器 · 拖拽单位圆上的向量寻找固有方向 · 共线时金色高亮" />
</ClientOnly>

## 1.6.3 迹与行列式：特征值的两个不变量

### 两个核心恒等式

在 1.6.2 中我们看到，2×2 矩阵的特征多项式 $p_A(\lambda) = \lambda^2 - \text{tr}(A)\lambda + \det(A)$ 完全由迹和行列式决定。这绝非偶然，而是更一般规律的特例。对 $n \times n$ 矩阵 $A$，特征多项式可展开为：

$$
p_A(\lambda) = \lambda^n - (\text{tr} A)\lambda^{n-1} + \cdots + (-1)^n \det(A)
$$

其中：

- **首项** $\lambda^n$：系数为 1
- **第二项** $-(\text{tr} A)\lambda^{n-1}$：系数为 $-\text{tr}(A)$
- **常数项** $(-1)^n \det(A)$：系数为 $(-1)^n \det(A)$

由 Vieta 定理（多项式根与系数的关系），特征值 $\lambda_1, \lambda_2, \ldots, \lambda_n$（计入代数重数）满足：

$$
\text{tr}(A) = \sum_{i=1}^n \lambda_i
$$

$$
\det(A) = \prod_{i=1}^n \lambda_i
$$

**这两条恒等式是线性代数最优美的结论之一**：迹是特征值之和，行列式是特征值之积。

### 证明：2×2 情形的直接验证

对 $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$，特征方程 $\lambda^2 - (a+d)\lambda + (ad-bc) = 0$。设两根为 $\lambda_1, \lambda_2$，由 Vieta 定理：

$$
\lambda_1 + \lambda_2 = a + d = \text{tr}(A) \quad \checkmark
$$

$$
\lambda_1 \cdot \lambda_2 = ad - bc = \det(A) \quad \checkmark
$$

### 证明：一般情形（用相似三角化）

对一般 $n \times n$ 矩阵 $A$，证明思路是把 $A$ 化为上三角矩阵 $T$（Schur 定理保证任意方阵在 $\mathbb{C}$ 上相似于上三角矩阵，对角元为特征值）。由于相似变换不改变特征多项式（下文证明），$A$ 与 $T$ 有相同的特征值。对上三角矩阵 $T$：

- $\text{tr}(T) = \sum T_{ii} = \sum \lambda_i$（对角元就是特征值）
- $\det(T) = \prod T_{ii} = \prod \lambda_i$（上三角矩阵的行列式 = 对角元乘积）

故 $\text{tr}(A) = \text{tr}(T) = \sum \lambda_i$，$\det(A) = \det(T) = \prod \lambda_i$。$\blacksquare$

### 相似矩阵具有相同的特征多项式

**定理**：若 $B = P^{-1}AP$（$A$ 与 $B$ 相似），则 $A$ 与 $B$ 有相同的特征多项式。

**证明**：

$$
p_B(\lambda) = \det(\lambda I - B) = \det(\lambda I - P^{-1}AP) = \det(P^{-1}(\lambda I - A)P)
$$

利用 $\det(XYX^{-1}) = \det(Y)$：

$$
p_B(\lambda) = \det(P^{-1}) \det(\lambda I - A) \det(P) = \det(\lambda I - A) = p_A(\lambda)
$$

$\blacksquare$

**推论**：相似矩阵具有相同的特征值、迹、行列式、特征多项式。换言之，这些量都是**相似不变量**（Similarity Invariants）。

### 相似变换的几何含义

相似变换 $B = P^{-1}AP$ 表示"换基"：$P$ 是从旧基到新基的过渡矩阵，$B$ 是同一线性变换在新基下的矩阵表示。**相似不变量就是"线性变换本身的属性"，与基的选择无关**。

这给出了特征值的几何地位：**特征值是线性变换的内在属性，而非矩阵表示的偶然产物**。一个线性变换在不同基下表现为不同矩阵，但特征值不变——它刻画了变换的"本质强度"。

### 迹与行列式的几何含义

- **迹 = "平均缩放因子之和"**：$\text{tr}(A)/n = \frac{1}{n}\sum \lambda_i$ 是特征值的算术平均，可理解为变换在所有特征方向上的"平均缩放率"。
- **行列式 = "体积缩放因子"**：$\det(A) = \prod \lambda_i$ 是变换对 $n$ 维体积的放大率。若 $\det = 0$ 则变换把空间"压扁"到低维（不可逆）；若 $|\det| > 1$ 则体积膨胀，$|\det| < 1$ 则体积收缩。

### 迹的另一种解读：散度

在向量场 $\mathbf{F}: \mathbb{R}^n \to \mathbb{R}^n$ 的雅可比矩阵 $J$ 中，$\text{tr}(J)$ 就是向量场的**散度**（Divergence）：

$$
\nabla \cdot \mathbf{F} = \text{tr}(J)
$$

散度衡量"流出的通量"——若 $\text{tr}(J) > 0$ 则向量场在该点"发散"（源），$\text{tr}(J) < 0$ 则"汇聚"（汇）。这与"迹 = 特征值之和 = 各方向平均缩放率"的解读一致：正迹表示整体扩张，负迹表示整体收缩。

::: tip 相似不变量的工程意义
迹与行列式作为相似不变量，是工程中"基无关量"的核心。在控制论中，系统的特征值决定稳定性，无论状态变量如何选取（即无论用什么基表示），特征值不变——这保证了"稳定性"是系统的内在属性。在机器学习中，PCA 的主成分是协方差矩阵的特征向量；即使对数据做正交变换（换基），协方差矩阵的特征值（即各主成分的方差）不变——这保证了"信息含量"是数据的内在属性。掌握相似不变量，就是掌握"哪些量是表示的偶然、哪些量是本质的必然"。
:::

```python
import numpy as np

# 验证 tr(A) = Σλ, det(A) = Πλ
np.random.seed(42)
A = np.random.randn(3, 3) * 2  # 随机 3x3 矩阵
print(f"A =\n{A}")

eigvals = np.linalg.eigvals(A)
print(f"\n特征值: {eigvals}")
print(f"特征值之和 Σλ = {np.sum(eigvals).real:.6f}")
print(f"tr(A)         = {np.trace(A):.6f}")
print(f"\n特征值之积 Πλ = {np.prod(eigvals).real:.6f}")
print(f"det(A)        = {np.linalg.det(A):.6f}")

# 验证：两者应严格相等（实部，因为可能有复特征值）
print(f"\ntr == Σλ? {np.isclose(np.trace(A), np.sum(eigvals).real)}")
print(f"det == Πλ? {np.isclose(np.linalg.det(A), np.prod(eigvals).real)}")
```

```python
import numpy as np

# 相似矩阵 B = P⁻¹AP 具有相同特征值
np.random.seed(7)
A = np.array([[2, 1],
              [1, 3]], dtype=float)

# 随机可逆矩阵 P
P = np.random.randn(2, 2)
while abs(np.linalg.det(P)) < 0.1:  # 确保 P 可逆
    P = np.random.randn(2, 2)

B = np.linalg.inv(P) @ A @ P
print(f"A =\n{A}")
print(f"\nP =\n{P}")
print(f"\nB = P⁻¹AP =\n{B}")

# 对比 A 和 B 的特征值、迹、行列式
eigvals_A = np.linalg.eigvals(A)
eigvals_B = np.linalg.eigvals(B)
print(f"\nA 的特征值: {np.sort(eigvals_A)}")
print(f"B 的特征值: {np.sort(eigvals_B)}")
print(f"特征值相同（排序后）? {np.allclose(np.sort(eigvals_A), np.sort(eigvals_B))}")

print(f"\ntr(A) = {np.trace(A):.6f}, tr(B) = {np.trace(B):.6f}, 相等? {np.isclose(np.trace(A), np.trace(B))}")
print(f"det(A) = {np.linalg.det(A):.6f}, det(B) = {np.linalg.det(B):.6f}, 相等? {np.isclose(np.linalg.det(A), np.linalg.det(B))}")

# 几何解读：A 和 B 是同一变换在不同基下的表示
# 特征值是变换的内在属性，与基无关
```

```python
import numpy as np

# 几何含义：行列式 = 体积缩放因子
# 单位正方体 [0,1]^2 经 A 变换后，面积变为 |det(A)| 倍
A = np.array([[2, 1],
              [1, 3]], dtype=float)
print(f"A =\n{A}")
print(f"det(A) = {np.linalg.det(A):.4f}")
print(f"→ 单位正方形面积 1 经 A 变换后变为 {abs(np.linalg.det(A)):.4f}")

# 迹 = 特征值之和 = 平均缩放率 × n
eigvals = np.linalg.eigvals(A)
print(f"\n特征值: {eigvals}")
print(f"tr(A)/n = {np.trace(A)/2:.4f} (平均缩放率)")
print(f"几何含义: 变换在两个特征方向上的平均缩放率")

# 特殊情形：奇异矩阵 det=0，至少一个特征值为 0
A_singular = np.array([[1, 2],
                       [2, 4]], dtype=float)  # 第二行 = 2×第一行
print(f"\n奇异矩阵 A =\n{A_singular}")
print(f"det(A) = {np.linalg.det(A_singular):.6f} (为零)")
print(f"特征值: {np.linalg.eigvals(A_singular)}")
print(f"→ 至少一个特征值为 0，对应特征向量被压扁为零（落入零空间）")
```

> 💡 **交互演示回顾**：本节无独立组件，但 `EigenDirectionFinder`（1.6.2 节末）的滑块可调节矩阵元素，回看观察 $B = P^{-1}AP$ 与 $A$ 特征值一致的现象——相似变换下特征方向可能旋转，但特征值不变。

## 1.6.4 特征空间与几何重数

### 特征空间的定义

设 $\lambda$ 是 $A$ 的特征值，**特征空间**（Eigenspace）$E_\lambda$ 定义为：

$$
E_\lambda = \text{Null}(A - \lambda I) = \{\mathbf{v} \in \mathbb{R}^n : (A - \lambda I)\mathbf{v} = \mathbf{0}\}
$$

即满足 $A\mathbf{v} = \lambda \mathbf{v}$ 的所有向量（含零向量）的集合。

### 特征空间是子空间

**$E_\lambda$ 是 $\mathbb{R}^n$ 的子空间**。验证子空间三要素：

1. **非空**：$\mathbf{0} \in E_\lambda$（因为 $(A - \lambda I)\mathbf{0} = \mathbf{0}$）。
2. **加法封闭**：若 $\mathbf{u}, \mathbf{v} \in E_\lambda$，则 $(A - \lambda I)(\mathbf{u} + \mathbf{v}) = (A - \lambda I)\mathbf{u} + (A - \lambda I)\mathbf{v} = \mathbf{0} + \mathbf{0} = \mathbf{0}$，故 $\mathbf{u} + \mathbf{v} \in E_\lambda$。
3. **数乘封闭**：若 $\mathbf{v} \in E_\lambda$，$c \in \mathbb{R}$，则 $(A - \lambda I)(c\mathbf{v}) = c(A - \lambda I)\mathbf{v} = c \mathbf{0} = \mathbf{0}$，故 $c\mathbf{v} \in E_\lambda$。

故 $E_\lambda$ 是子空间。事实上，$E_\lambda$ 就是 $A - \lambda I$ 的零空间，这一定义让我们能直接调用 1.4 节的零空间工具分析特征结构。

### 特征空间的维数 = 几何重数

特征空间 $E_\lambda$ 的维数称为 $\lambda$ 的**几何重数**（Geometric Multiplicity, GM）：

$$
\text{GM}(\lambda) = \dim E_\lambda = \dim \text{Null}(A - \lambda I) = n - \text{rank}(A - \lambda I)
$$

几何重数 = 线性无关的特征向量个数。它回答了"对同一特征值 $\lambda$，有多少个独立方向被 $A$ 同等地缩放"。

### 代数重数的定义

$\lambda$ 作为特征多项式 $p_A(\lambda) = 0$ 的根的重数，称为**代数重数**（Algebraic Multiplicity, AM）。

例如，若 $p_A(\lambda) = (\lambda - 2)^3 (\lambda - 5)$，则 $\lambda = 2$ 的代数重数为 3，$\lambda = 5$ 的代数重数为 1。

### 关键不等式：$1 \leq \text{GM} \leq \text{AM}$

**定理**：对任意特征值 $\lambda$，有：

$$
1 \leq \text{GM}(\lambda) \leq \text{AM}(\lambda)
$$

**$\text{GM} \geq 1$**：因为 $\lambda$ 是特征值，至少存在一个非零特征向量，故特征空间维数 $\geq 1$。

**$\text{GM} \leq \text{AM}$**：证明思路是把 $A$ 限制在 $E_\lambda$ 上，特征多项式必然包含 $(\lambda - \lambda_0)^{\text{GM}}$ 这个因子，故根的重数至少为 GM。完整证明需要用到不变子空间和 Schur 补，此处略。

### 缺陷矩阵：GM < AM

当 $\text{GM}(\lambda) < \text{AM}(\lambda)$ 时，称 $A$ 在 $\lambda$ 处**缺陷**（Defective）。**缺陷矩阵**（Defective Matrix）就是存在某个特征值使其 GM < AM 的矩阵，等价于**不可对角化**。

缺陷矩阵的代数重数"承诺"了 $k$ 个特征值（重根），但几何上只能找到 $< k$ 个线性无关的特征向量——特征向量"不够用"，无法拼成完整的特征基。

### 经典反例：Jordan 块

考虑 2×2 Jordan 块：

$$
J = \begin{pmatrix} 2 & 1 \\ 0 & 2 \end{pmatrix}
$$

**特征多项式**：$p_J(\lambda) = (\lambda - 2)^2$，故 $\lambda = 2$ 是二重根，$\text{AM} = 2$。

**特征空间**：

$$
J - 2I = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}, \quad \text{rank}(J - 2I) = 1
$$

故 $\text{GM} = 2 - 1 = 1$。

**$\text{GM} = 1 < \text{AM} = 2$**：$J$ 是缺陷矩阵！它只有一个线性无关的特征向量 $\mathbf{e}_1 = (1, 0)^T$，无法对角化。

### 几何图像：剪切变换的"挤压"

Jordan 块 $J = \begin{pmatrix} 2 & 1 \\ 0 & 2 \end{pmatrix}$ 可分解为 $J = 2I + N$，其中 $N = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ 是幂零矩阵（$N^2 = 0$）。几何上，$J$ 是"放大 2 倍 + $x$ 方向剪切"——剪切让 $\mathbf{e}_2$ 方向"倾斜"地被拉到 $\mathbf{e}_1$ 方向，破坏了 $\mathbf{e}_2$ 作为特征向量的资格。只剩 $\mathbf{e}_1$ 这一方向"逃过剪切"，成为唯一的特征方向。

### 缺陷矩阵的"补救"：Jordan 标准形

缺陷矩阵虽然不能对角化为 $D = \text{diag}(\lambda_1, \ldots, \lambda_n)$，但可以化为**Jordan 标准形** $J = \text{diag}(J_1, \ldots, J_k)$，其中每个 $J_i$ 是 Jordan 块：

$$
J_i = \begin{pmatrix} \lambda_i & 1 & & \\ & \lambda_i & \ddots & \\ & & \ddots & 1 \\ & & & \lambda_i \end{pmatrix}
$$

Jordan 形是"最接近对角化"的简化形式，每个 Jordan 块的大小恰好等于该特征值的 AM - GM + 1。这是不可对角化矩阵的"最佳替代"。

::: warning 缺陷矩阵在工程中的麻烦
缺陷矩阵在实际工程中带来三大麻烦：(1) **不能对角化**，无法用 $A^k = PD^kP^{-1}$ 简化幂次计算，必须用 Jordan 形或递推，计算复杂度显著上升；(2) **矩阵指数 $e^A$ 求解复杂**，对角化情形下 $e^A = Pe^D P^{-1}$ 极简，但 Jordan 形下每个 Jordan 块要单独处理，会出现 $t e^{\lambda t}$ 等高阶项，对应微分方程组的"共振解"——这在控制系统中表现为临界阻尼或共振现象；(3) **数值不稳定**，缺陷矩阵在数据扰动下容易"分裂"为可对角化矩阵（重特征值分裂为相近特征值），导致特征值数值计算对误差极度敏感。在机器学习中，缺陷矩阵罕见但理论上重要——理解它有助于正确处理协方差矩阵奇异、Hessian 矩阵退化等情形。
:::

```python
import numpy as np

# Jordan 块：缺陷矩阵的经典反例
J = np.array([[2, 1],
              [0, 2]], dtype=float)
print(f"Jordan 块 J =\n{J}")

# 特征值
eigvals, eigvecs = np.linalg.eig(J)
print(f"\n特征值: {eigvals}")  # [2, 2]（二重根）

# AM = 2（特征多项式 (λ-2)^2 的根重数）
# GM = n - rank(J - 2I) = 2 - 1 = 1
J_minus_2I = J - 2 * np.eye(2)
print(f"\nJ - 2I =\n{J_minus_2I}")
print(f"rank(J - 2I) = {np.linalg.matrix_rank(J_minus_2I)}")
print(f"GM = 2 - rank = {2 - np.linalg.matrix_rank(J_minus_2I)}")
print(f"AM = 2 (因为 (λ-2)^2)")
print(f"→ GM=1 < AM=2，J 是缺陷矩阵！")

# numpy 给出的"特征向量"
print(f"\nnumpy 给出的特征向量矩阵:\n{eigvecs}")
print(f"det(特征向量矩阵) = {np.linalg.det(eigvecs):.6f}")
# 注意：特征向量矩阵接近奇异（虽然 numpy 仍给出两个向量，但它们几乎共线）

# 真正的特征向量只有 e1 = (1, 0)^T
v = np.array([1, 0])
print(f"\n验证 e1 是特征向量: J @ e1 = {J @ v}, 2 * e1 = {2 * v}, 相等? {np.allclose(J @ v, 2 * v)}")
# 尝试 e2 = (0, 1)^T
v2 = np.array([0, 1])
print(f"e2 是特征向量? J @ e2 = {J @ v2}, 2 * e2 = {2 * v2}, 相等? {np.allclose(J @ v2, 2 * v2)}")
# False！e2 不是特征向量（被剪切拉到了 (1, 2)）
```

```python
import numpy as np

# 对比：非缺陷矩阵（可对角化）
# 同样 λ=2 二重根，但 GM=2
A = np.array([[2, 0],
              [0, 2]], dtype=float)  # = 2I，所有向量都是特征向量
print(f"A = 2I =\n{A}")
eigvals, eigvecs = np.linalg.eig(A)
print(f"特征值: {eigvals}")
print(f"rank(A - 2I) = {np.linalg.matrix_rank(A - 2 * np.eye(2))}")  # 0
print(f"GM = 2 - 0 = 2 = AM")  # GM = AM = 2
print(f"→ A 不是缺陷矩阵，可对角化（事实上 A 已经是对角矩阵）")

# 另一个对比：对角矩阵 diag(2, 2) 就是 Jordan 块 [[2,1],[0,2]] 的"极限"
# 当剪切量 1 → 0 时，缺陷矩阵退化为可对角化矩阵
# 这说明缺陷性是"非-generic"的——随机矩阵几乎都是可对角化的
np.random.seed(0)
for trial in range(3):
    M = np.random.randn(3, 3)
    eigs = np.linalg.eigvals(M)
    print(f"\n随机矩阵 {trial+1} 的特征值: {eigs}")
    print(f"  特征值两两不同? {len(set(np.round(eigs, 6))) == 3}")
    # 随机矩阵几乎必然有相异特征值 → GM=AM=1 → 可对角化
```

## 1.6.5 对角化 $A = PDP^{-1}$

### 可对角化的充要条件

矩阵 $A \in \mathbb{R}^{n \times n}$ 称为**可对角化**（Diagonalizable），若存在可逆矩阵 $P$ 和对角矩阵 $D$ 使得：

$$
A = PDP^{-1} \quad \text{等价地} \quad P^{-1}AP = D
$$

**充要条件**：$A$ 有 $n$ 个线性无关的特征向量。等价表述：

$$
\sum_{i=1}^{k} \text{GM}(\lambda_i) = n
$$

即所有特征值的几何重数之和等于 $n$（每个特征值贡献 $\text{GM}$ 个独立特征向量）。

**充分条件**（不必要）：$A$ 有 $n$ 个**互异**特征值。互异特征值对应的特征向量自动线性无关，故 $A$ 可对角化。

### 对角化的构造

若 $A$ 可对角化，设其特征向量为 $\mathbf{v}_1, \mathbf{v}_2, \ldots, \mathbf{v}_n$（线性无关），对应特征值为 $\lambda_1, \lambda_2, \ldots, \lambda_n$。构造：

- $P = [\mathbf{v}_1, \mathbf{v}_2, \ldots, \mathbf{v}_n]$：以特征向量为列的矩阵（可逆）
- $D = \text{diag}(\lambda_1, \lambda_2, \ldots, \lambda_n)$：以特征值为对角元的对角矩阵

则：

$$
AP = A[\mathbf{v}_1, \ldots, \mathbf{v}_n] = [A\mathbf{v}_1, \ldots, A\mathbf{v}_n] = [\lambda_1 \mathbf{v}_1, \ldots, \lambda_n \mathbf{v}_n] = PD
$$

故 $A = PDP^{-1}$。

### 对角化的几何含义

相似变换 $P^{-1}AP = D$ 表示**换到特征基坐标系下**，变换变成纯缩放：

1. $P^{-1}\mathbf{x}$：把 $\mathbf{x}$ 从标准基变换到特征基 $\{\mathbf{v}_1, \ldots, \mathbf{v}_n\}$ 下，得到特征基坐标。
2. $D(P^{-1}\mathbf{x})$：在特征基下，变换退化为对各分量独立缩放（第 $i$ 分量乘 $\lambda_i$）。
3. $P(DP^{-1}\mathbf{x})$：把缩放后的特征基坐标变换回标准基。

即 $A\mathbf{x} = PDP^{-1}\mathbf{x}$ 的几何含义是：**"换到特征基 → 各方向独立缩放 → 换回标准基"**。在特征基下，$A$ 的"旋转 + 剪切 + 缩放"复合操作退化为最简的"各方向独立缩放"。

### 工程价值 1：矩阵幂次的简化

对角化让矩阵幂次计算极大地简化：

$$
A^k = (PDP^{-1})^k = \underbrace{(PDP^{-1})(PDP^{-1})\cdots(PDP^{-1})}_{k \text{ 个}} = P D^k P^{-1}
$$

中间的 $P^{-1}P = I$ 两两消去。而对角矩阵的幂次就是各对角元的幂次：

$$
D^k = \text{diag}(\lambda_1^k, \lambda_2^k, \ldots, \lambda_n^k)
$$

故：

$$
A^k = P \text{diag}(\lambda_1^k, \ldots, \lambda_n^k) P^{-1}
$$

计算复杂度从 $O(n^3 k)$（$k$ 次矩阵乘法）降为 $O(n^3)$（一次矩阵乘法 + 对角元幂次）。

### 工程价值 2：矩阵指数 $e^A$

矩阵指数定义为 $e^A = \sum_{k=0}^\infty \frac{A^k}{k!}$。若 $A$ 可对角化：

$$
e^A = P \left(\sum_{k=0}^\infty \frac{D^k}{k!}\right) P^{-1} = P \text{diag}(e^{\lambda_1}, \ldots, e^{\lambda_n}) P^{-1} = P e^D P^{-1}
$$

其中 $e^D = \text{diag}(e^{\lambda_1}, \ldots, e^{\lambda_n})$ 极易计算。

矩阵指数是**线性常微分方程组** $\dot{\mathbf{x}} = A\mathbf{x}$ 的解的核心：解为 $\mathbf{x}(t) = e^{At}\mathbf{x}(0)$。对角化把"求解 ODE"转化为"求特征值 + 算指数"，这是动力系统分析的代数基础。$\lambda_i$ 的实部决定解的稳定性（负实部 → 衰减，正实部 → 发散），虚部决定振荡频率。

### 工程价值 3：谱分解

可对角化矩阵可写为：

$$
A = PDP^{-1} = \sum_{i=1}^n \lambda_i \mathbf{v}_i \mathbf{w}_i^T
$$

其中 $\mathbf{w}_i^T$ 是 $P^{-1}$ 的第 $i$ 行（左特征向量）。每个 $\lambda_i \mathbf{v}_i \mathbf{w}_i^T$ 是秩 1 矩阵，称为**谱投影**。这一分解揭示了 $A$ 是"特征方向上的纯缩放"之加权和。

### 不可对角化的处理：Jordan 标准形

若 $A$ 不可对角化（缺陷），最接近对角化的形式是 **Jordan 标准形** $J$：

$$
A = PJP^{-1}
$$

其中 $J$ 是块对角矩阵，每个 Jordan 块形如 $\begin{pmatrix} \lambda & 1 & & \\ & \lambda & \ddots & \\ & & \ddots & 1 \\ & & & \lambda \end{pmatrix}$。

Jordan 形下幂次和指数计算复杂但仍有公式（涉及 $t^k e^{\lambda t}$ 项），是处理不可对角化情形的标准工具。本节简略，详见常微分方程教材。

::: key-idea 对角化的本质
对角化不是"把矩阵变成对角矩阵"的技术操作，而是"找到变换的固有坐标系，让变换在最简表示下显形"的深刻思想。在标准基下，$A$ 可能表现为复杂的"旋转 + 剪切 + 缩放"复合；但在特征基下，同一变换退化为"各方向独立缩放"——这种"复杂 → 简单"的"翻译"能力，是对角化的真正价值。它把"难以理解的整体行为"分解为"若干个一维独立行为的叠加"，这正是线性代数中"分解思想"的最高典范。后续 1.6.6 节将看到，当 $A$ 是实对称矩阵时，特征基甚至可以选为标准正交的——这是"完美对角化"的顶峰。
:::

```python
import numpy as np

# 可对角化矩阵：A 有 2 个互异特征值
A = np.array([[4, 2],
              [1, 3]], dtype=float)
print(f"A =\n{A}")

# 求特征值与特征向量
eigvals, P = np.linalg.eig(A)
print(f"\n特征值: {eigvals}")
print(f"特征向量矩阵 P =\n{P}")

# 构造 D
D = np.diag(eigvals)
print(f"\n对角矩阵 D =\n{D}")

# 验证 A = P D P⁻¹
P_inv = np.linalg.inv(P)
A_reconstructed = P @ D @ P_inv
print(f"\nP D P⁻¹ =\n{A_reconstructed}")
print(f"A == P D P⁻¹? {np.allclose(A, A_reconstructed)}")

# 也验证 P⁻¹ A P = D
print(f"\nP⁻¹ A P =\n{P_inv @ A @ P}")
print(f"等于 D? {np.allclose(P_inv @ A @ P, D)}")
```

```python
import numpy as np

# 工程价值 1：A^k = P D^k P⁻¹
A = np.array([[4, 2],
              [1, 3]], dtype=float)
eigvals, P = np.linalg.eig(A)
P_inv = np.linalg.inv(P)

k = 5
# 方法 1：直接连乘
A_power_direct = np.linalg.matrix_power(A, k)
print(f"A^{k} (直接计算) =\n{A_power_direct}")

# 方法 2：用对角化 A^k = P D^k P⁻¹
D_k = np.diag(eigvals**k)
A_power_diag = P @ D_k @ P_inv
print(f"\nA^{k} (对角化) =\n{A_power_diag.real}")  # 实部（消除数值误差）

print(f"\n两者一致? {np.allclose(A_power_direct, A_power_diag)}")

# 复杂度对比
# 直接：k 次矩阵乘法，每次 O(n^3)，总计 O(k n^3)
# 对角化：1 次矩阵乘法（P @ D^k @ P⁻¹），O(n^3)
# 当 k 很大时，对角化优势明显
```

```python
import numpy as np
from scipy.linalg import expm

# 工程价值 2：矩阵指数 e^A = P e^D P⁻¹
A = np.array([[0, 1],
              [-2, -3]], dtype=float)  # 经典阻尼振荡系统
print(f"A =\n{A}")

# 方法 1：scipy 直接计算
e_A_direct = expm(A)
print(f"\ne^A (scipy) =\n{e_A_direct}")

# 方法 2：用对角化 e^A = P e^D P⁻¹
eigvals, P = np.linalg.eig(A)
print(f"\n特征值: {eigvals}")  # 复特征值，对应振荡
e_D = np.diag(np.exp(eigvals))
e_A_diag = P @ e_D @ np.linalg.inv(P)
print(f"\ne^A (对角化) =\n{e_A_diag.real}")

print(f"\n两者一致? {np.allclose(e_A_direct, e_A_diag.real)}")

# 解 ODE: dx/dt = A x, x(0) = [1, 0]
# 解为 x(t) = e^(At) x(0)
t = 1.0
x0 = np.array([1, 0])
e_At = expm(A * t)
x_t = e_At @ x0
print(f"\nt={t} 时的状态 x(t) = {x_t}")
print(f"几何含义: 系统从 [1,0] 出发，t=1 时到达 {x_t}")
```

<ClientOnly>
<DiagonalizationDemo title="对角化判定状态机 · 变形网格 + 特征向量金色叠加 · 3 步解耦动画" />
</ClientOnly>

## 1.6.6 实对称矩阵的正交对角化 $A = Q\Lambda Q^T$

### 实对称矩阵的"完美性"

实对称矩阵 $A$（满足 $A^T = A$）是线性代数中最"完美"的矩阵类型。它具有三大绝佳性质，使其在工程中扮演核心角色：

1. **所有特征值为实数**
2. **不同特征值对应的特征向量正交**
3. **必可正交对角化**（每个特征值的 GM = AM 恒成立）

这三条性质让实对称矩阵永远可以化为 $A = Q\Lambda Q^T$，其中 $Q$ 是正交矩阵、$\Lambda$ 是实对角矩阵。这就是**谱定理**（Spectral Theorem），是线性代数的顶峰之一。

### 性质 1：实对称矩阵的特征值为实数

**证明**：设 $A\mathbf{v} = \lambda \mathbf{v}$（$\mathbf{v} \neq \mathbf{0}$，$\mathbf{v}$ 可能为复向量）。取共轭转置：

$$
\bar{\mathbf{v}}^T A = \bar{\lambda} \bar{\mathbf{v}}^T
$$

（利用 $A$ 实对称：$\bar{A} = A$, $A^T = A$）。

右乘 $\mathbf{v}$：$\bar{\mathbf{v}}^T A \mathbf{v} = \bar{\lambda} \bar{\mathbf{v}}^T \mathbf{v}$。

左乘 $\bar{\mathbf{v}}^T$ 在原方程 $A\mathbf{v} = \lambda \mathbf{v}$ 上：$\bar{\mathbf{v}}^T A \mathbf{v} = \lambda \bar{\mathbf{v}}^T \mathbf{v}$。

两式相减：$(\lambda - \bar{\lambda}) \bar{\mathbf{v}}^T \mathbf{v} = 0$。由 $\bar{\mathbf{v}}^T \mathbf{v} = \sum |v_i|^2 > 0$，故 $\lambda = \bar{\lambda}$，即 $\lambda$ 为实数。$\blacksquare$

### 性质 2：不同特征值对应的特征向量正交

**证明**：设 $A\mathbf{v}_1 = \lambda_1 \mathbf{v}_1$，$A\mathbf{v}_2 = \lambda_2 \mathbf{v}_2$，$\lambda_1 \neq \lambda_2$。由 $A$ 对称：

$$
\lambda_1 (\mathbf{v}_1^T \mathbf{v}_2) = (\lambda_1 \mathbf{v}_1)^T \mathbf{v}_2 = (A\mathbf{v}_1)^T \mathbf{v}_2 = \mathbf{v}_1^T A^T \mathbf{v}_2 = \mathbf{v}_1^T A \mathbf{v}_2 = \mathbf{v}_1^T (\lambda_2 \mathbf{v}_2) = \lambda_2 (\mathbf{v}_1^T \mathbf{v}_2)
$$

故 $(\lambda_1 - \lambda_2) \mathbf{v}_1^T \mathbf{v}_2 = 0$，由 $\lambda_1 \neq \lambda_2$ 得 $\mathbf{v}_1^T \mathbf{v}_2 = 0$，即 $\mathbf{v}_1 \perp \mathbf{v}_2$。$\blacksquare$

### 性质 3：必可正交对角化

**实对称矩阵的每个特征值都满足 GM = AM**——不会出现 1.6.4 节那种缺陷情形。这一性质的证明需要更深的工具（如 Schur 分解），此处略。其后果是：实对称矩阵永远可对角化，且特征基可选为标准正交基。

### 谱定理（Spectral Theorem）

**定理**（实对称矩阵的谱定理）：设 $A \in \mathbb{R}^{n \times n}$ 是实对称矩阵。则存在正交矩阵 $Q$（$Q^T Q = I$）和实对角矩阵 $\Lambda$，使得：

$$
A = Q\Lambda Q^T
$$

其中：

- $Q$ 的列 $\mathbf{q}_1, \ldots, \mathbf{q}_n$ 是 $A$ 的**标准正交特征向量**
- $\Lambda = \text{diag}(\lambda_1, \ldots, \lambda_n)$，对角元是 $A$ 的实特征值

### 证明思路

谱定理的证明思路分三步：

1. **存在性**（实特征值）：由性质 1，所有特征值为实数。
2. **正交性**：由性质 2，不同特征值的特征向量正交。同一特征空间内（GM > 1 时），用 Gram-Schmidt 正交化（1.5.5 节）可得该特征空间的标准正交基。
3. **完备性**：所有特征空间的标准正交基合并起来共 $n$ 个向量（因为 GM = AM，特征空间维数之和 = $n$），构成 $\mathbb{R}^n$ 的一组标准正交基。把这 $n$ 个向量作为列排成 $Q$，对应特征值为对角元排成 $\Lambda$，即得 $A = Q\Lambda Q^T$。

### 谱分解形式

由 $A = Q\Lambda Q^T = \sum_{i=1}^n \lambda_i \mathbf{q}_i \mathbf{q}_i^T$，每个 $\mathbf{q}_i \mathbf{q}_i^T$ 是秩 1 的正交投影矩阵（投影到 $\mathbf{q}_i$ 方向）。故实对称矩阵可分解为：

$$
A = \sum_{i=1}^n \lambda_i P_i, \quad P_i = \mathbf{q}_i \mathbf{q}_i^T
$$

这一形式称为**谱分解**（Spectral Decomposition）：$A$ 是若干"特征方向投影 × 特征值"的叠加。$P_i$ 满足 $P_i^2 = P_i$（幂等）、$P_i P_j = 0$（$i \neq j$）、$\sum P_i = I$——这构成一组"正交投影的完备分解"。

### 二次型与主轴定理

实对称矩阵与**二次型**（Quadratic Form）紧密相关。二次型是形如：

$$
Q(\mathbf{x}) = \mathbf{x}^T A \mathbf{x} = \sum_{i,j} A_{ij} x_i x_j
$$

的标量函数（$A$ 实对称）。代入谱分解 $A = Q\Lambda Q^T$，令 $\mathbf{y} = Q^T \mathbf{x}$：

$$
Q(\mathbf{x}) = \mathbf{x}^T Q \Lambda Q^T \mathbf{x} = \mathbf{y}^T \Lambda \mathbf{y} = \sum_{i=1}^n \lambda_i y_i^2
$$

**主轴定理**（Principal Axis Theorem）：实对称矩阵的二次型可通过正交变换 $\mathbf{y} = Q^T \mathbf{x}$ 化为纯平方和 $\sum \lambda_i y_i^2$，每个 $\lambda_i$ 是一个"主轴方向"的"曲率"。

**几何含义**：二次曲面 $Q(\mathbf{x}) = c$（如椭圆、双曲面）的"主轴"就是 $A$ 的特征向量方向，"半轴长度"由 $\lambda_i$ 决定（$\propto 1/\sqrt{|\lambda_i|}$）。这一结果是解析几何中"二次曲线化标准型"的线性代数本质。

### 正定性与特征值

实对称矩阵 $A$ 的正定性可由特征值完全判定：

- **正定**（$A \succ 0$）：所有 $\lambda_i > 0$
- **半正定**（$A \succeq 0$）：所有 $\lambda_i \geq 0$
- **负定**（$A \prec 0$）：所有 $\lambda_i < 0$
- **不定**：既有正特征值也有负特征值

这一判定在机器学习中至关重要：Hessian 矩阵正定 ⟺ 极小值点；协方差矩阵半正定（特征值 = 方差 ≥ 0）；核矩阵必须半正定才能定义有效核函数。

### 应用预告

实对称矩阵的正交对角化是诸多高级方法的代数核心：

1. **PCA（主成分分析）**：数据协方差矩阵是实对称矩阵，其特征向量是主成分方向，特征值是各方向方差。正交性保证主成分不冗余。
2. **惯性张量**：刚体的惯性张量是实对称矩阵，其特征向量是"惯量主轴"，特征值是主转动惯量。绕主轴旋转最稳定。
3. **图谱论**：图的邻接矩阵、拉普拉斯矩阵都是实对称矩阵，其特征值（"图谱"）刻画图的结构性质（连通性、聚类结构）。
4. **量子力学**：可观测量对应实对称（更准确说是厄米）算子，其特征值是物理量的可能测量值（实数性保证物理可观测）。

::: tip 实对称矩阵的"完美性"
实对称矩阵集齐了对角化的"三大完美条件"：实数特征值（无复数困扰）、正交特征向量（无冗余方向）、可对角化（无缺陷麻烦）。这让它成为工程中最受欢迎的矩阵类型——只要遇到实对称矩阵，几乎必然可以用谱定理 $A = Q\Lambda Q^T$ 简化分析。PCA、SVD、谱聚类、量子力学等领域的优雅，根源都在于实对称矩阵的这种"完美性"。1.7 节的 SVD 将把这一理论推广到任意矩阵——通过 $A^T A$ 和 $A A^T$ 这两个实对称矩阵"间接"获得正交对角化的优势。
:::

```python
import numpy as np

# 实对称矩阵的正交对角化
A = np.array([[2, 1],
              [1, 2]], dtype=float)
print(f"对称矩阵 A =\n{A}")
print(f"A 对称? {np.allclose(A, A.T)}")

# 求特征值与特征向量
eigvals, Q = np.linalg.eigh(A)  # eigh 专为对称矩阵设计，保证实数和正交
print(f"\n特征值 Λ = {eigvals}")
print(f"特征向量矩阵 Q =\n{Q}")

# 验证 1: A = Q Λ Q^T
Lambda = np.diag(eigvals)
A_reconstructed = Q @ Lambda @ Q.T
print(f"\nQ Λ Q^T =\n{A_reconstructed}")
print(f"A == Q Λ Q^T? {np.allclose(A, A_reconstructed)}")

# 验证 2: Q^T Q = I（Q 是正交矩阵）
print(f"\nQ^T Q =\n{Q.T @ Q}")
print(f"Q^T Q == I? {np.allclose(Q.T @ Q, np.eye(2))}")

# 验证 3: 特征向量正交（不同特征值对应）
print(f"\n特征向量 q1 = {Q[:, 0]}")
print(f"特征向量 q2 = {Q[:, 1]}")
print(f"q1 · q2 = {np.dot(Q[:, 0], Q[:, 1]):.6f}  (应≈0)")

# 验证 4: 特征值为实数
print(f"\n特征值是否实数? {np.all(np.isreal(eigvals))}")
print(f"特征值: λ1={eigvals[0]:.4f}, λ2={eigvals[1]:.4f}")
print(f"几何含义: 沿 q1 方向缩放 {eigvals[0]:.2f} 倍, 沿 q2 方向缩放 {eigvals[1]:.2f} 倍")
```

```python
import numpy as np

# 二次型与主轴定理
# 二次型 Q(x) = x^T A x
A = np.array([[2, 1],
              [1, 2]], dtype=float)
print(f"A =\n{A}")

# 谱分解：A = Q Λ Q^T
eigvals, Q = np.linalg.eigh(A)
print(f"特征值: {eigvals}")  # [1, 3]
print(f"特征向量矩阵 Q =\n{Q}")

# 二次型 Q(x) = x^T A x
# 在原坐标下：2x1² + 2x1x2 + 2x2²
# 在主轴坐标 y = Q^T x 下：λ1 y1² + λ2 y2² = y1² + 3 y2²

# 验证：取 x = [1, 1]
x = np.array([1, 1])
Q_form = x @ A @ x
y = Q.T @ x  # 主轴坐标
Q_form_transformed = eigvals[0] * y[0]**2 + eigvals[1] * y[1]**2
print(f"\nx = {x}")
print(f"x^T A x = {Q_form}")
print(f"主轴坐标 y = Q^T x = {y}")
print(f"λ1 y1² + λ2 y2² = {Q_form_transformed}")
print(f"两者一致? {np.isclose(Q_form, Q_form_transformed)}")

# 等高线可视化（描述性）
# Q(x) = c 的等高线是椭圆
# 椭圆的长短轴方向 = 特征向量方向
# 椭圆的长短轴长度 ∝ 1/√|λi|
print(f"\n椭圆等高线 x^T A x = 1 的主轴:")
print(f"  长轴方向: q1 = {Q[:, 0]} (对应小特征值 {eigvals[0]:.2f})")
print(f"  长轴长度: 1/√λ1 = {1/np.sqrt(eigvals[0]):.4f}")
print(f"  短轴方向: q2 = {Q[:, 1]} (对应大特征值 {eigvals[1]:.2f})")
print(f"  短轴长度: 1/√λ2 = {1/np.sqrt(eigvals[1]):.4f}")
```

```python
import numpy as np

# 正定性判定：用特征值
np.random.seed(42)

# 正定矩阵：所有特征值 > 0
A_pd = np.array([[2, 1],
                 [1, 2]], dtype=float)
eigvals_pd = np.linalg.eigvalsh(A_pd)
print(f"正定矩阵 A =\n{A_pd}")
print(f"  特征值: {eigvals_pd} (全正)")
print(f"  正定? {np.all(eigvals_pd > 0)}")

# 半正定矩阵：所有特征值 ≥ 0
A_psd = np.array([[1, 1],
                  [1, 1]], dtype=float)  # 秩 1，行列式 0
eigvals_psd = np.linalg.eigvalsh(A_psd)
print(f"\n半正定矩阵 A =\n{A_psd}")
print(f"  特征值: {eigvals_psd} (有零)")
print(f"  半正定? {np.all(eigvals_psd >= 0)}")

# 不定矩阵：有正有负
A_ind = np.array([[1, 2],
                  [2, 1]], dtype=float)
eigvals_ind = np.linalg.eigvalsh(A_ind)
print(f"\n不定矩阵 A =\n{A_ind}")
print(f"  特征值: {eigvals_ind} (一正一负)")
print(f"  不定? {np.any(eigvals_ind > 0) and np.any(eigvals_ind < 0)}")

# 协方差矩阵总是半正定
np.random.seed(0)
X = np.random.randn(100, 3)
C = np.cov(X, rowvar=False)  # 3x3 协方差矩阵
eigvals_cov = np.linalg.eigvalsh(C)
print(f"\n协方差矩阵特征值: {eigvals_cov}")
print(f"  半正定? {np.all(eigvals_cov >= 0)}  (方差非负)")
print(f"  → PCA 中这些特征值就是各主成分的方差")
```

<ClientOnly>
<SymmetricEigenDemo title="实对称矩阵正交对角化 · 3D 椭球主轴 · 谱定理可视化" />
</ClientOnly>

## 1.6.7 综合几何图景：特征分解的全景

### 谱半径的定义

矩阵 $A$ 的**谱半径**（Spectral Radius）定义为其特征值模长的最大值：

$$
\rho(A) = \max_{i=1, \ldots, n} |\lambda_i|
$$

谱半径是矩阵"最大缩放强度"的度量——它告诉我们 $A$ 在某个方向上能放大多少倍。

### 矩阵幂次 $A^k$ 的渐近行为

由对角化 $A^k = P D^k P^{-1} = P \text{diag}(\lambda_1^k, \ldots, \lambda_n^k) P^{-1}$，$A^k$ 的行为由特征值的模长决定：

**情形 1：$\rho(A) < 1$（所有 $|\lambda_i| < 1$）**

$$
A^k \to 0 \quad (k \to \infty)
$$

矩阵幂次渐近稳定（衰减为零）。对应动力系统 $\mathbf{x}_{k+1} = A \mathbf{x}_k$ 的解 $\mathbf{x}_k = A^k \mathbf{x}_0 \to \mathbf{0}$，系统渐近稳定。

**情形 2：$\rho(A) > 1$（存在 $|\lambda_i| > 1$）**

$$
\|A^k\| \to \infty \quad (k \to \infty)
$$

矩阵幂次发散。对应动力系统不稳定，状态量无限增长。

**情形 3：$\rho(A) = 1$（最大模长为 1，且无 $|\lambda| > 1$）**

这是临界情形：

- 若 $\lambda = 1$ 是主特征值（且无其他模长 1 的特征值）：$A^k$ 收敛到秩 1 极限（马尔可夫链的平稳分布）。
- 若存在 $|\lambda| = 1$ 但 $\lambda \neq 1$（如复特征值 $e^{i\theta}$）：$A^k$ 不收敛但保持有界（振荡、旋转）。
- 若存在 Jordan 块且 $|\lambda| = 1$：可能多项式增长（共振）。

### 复特征值：旋转 + 缩放

实矩阵的复特征值必成共轭对 $\lambda, \bar{\lambda}$ 出现。把 $\lambda$ 写成极坐标：

$$
\lambda = re^{i\theta}, \quad r = |\lambda|, \quad \theta = \arg \lambda
$$

则 $\lambda$ 对应的二维不变子空间上，$A$ 的作用等价于"旋转 $\theta$ 角 + 缩放 $r$ 倍"。这与 1.6.1 中旋转矩阵的特征值 $e^{\pm i\theta}$（$r = 1$，纯旋转）的几何图像一致。

**复特征值的几何意义**：当 $A$ 有复特征值时，$A$ 在某个二维平面内"旋转 + 缩放"——这一平面是 $A$ 的二维不变子空间，但不属于任何单个实特征方向。这是矩阵"扭曲"行为的最简表示。

### 收敛速率：第二大特征值

在迭代算法中，$A^k$ 的收敛速率由**第二大特征值**（次主特征值）决定。

考虑马尔可夫链 $\mathbf{x}_{k+1} = A \mathbf{x}_k$，转移矩阵 $A$ 的最大特征值为 1（对应平稳分布）。设第二特征值为 $\lambda_2$，则：

$$
\|\mathbf{x}_k - \mathbf{x}_\infty\| \sim |\lambda_2|^k
$$

收敛速率为 $|\lambda_2|$：$|\lambda_2|$ 越小，收敛越快；$|\lambda_2|$ 越接近 1，收敛越慢。

**PageRank** 的"阻尼因子" $0.85$ 就是这种 $\lambda_2$，决定了 PageRank 迭代的收敛速度。

### 工程应用：PageRank 简化版

PageRank 的核心思想：网页 $i$ 的排名 $\propto$ 转移矩阵 $M$ 的最大特征值 1 对应的特征向量。简化模型：

1. 构造转移矩阵 $M$：$M_{ij}$ = 从网页 $j$ 跳到网页 $i$ 的概率（按出链均匀分配）。
2. 加入"随机跳转"避免死胡同：$G = (1-d) \frac{1}{n} \mathbf{1}\mathbf{1}^T + d M$，$d \approx 0.85$。
3. $G$ 是列随机矩阵（每列和为 1），最大特征值为 1。
4. 求对应特征向量（PageRank 向量），各分量为网页排名。

### 特征分解的四大视角

回顾 1.6 章全章，特征分解可从四个互补视角理解：

**1. 代数视角**：$A\mathbf{v} = \lambda \mathbf{v}$，特征值是 $\det(A - \lambda I) = 0$ 的根。

**2. 几何视角**：特征向量是变换中"方向不变只缩放"的特殊方向，特征值是缩放因子。

**3. 谱视角**：$A = \sum \lambda_i \mathbf{v}_i \mathbf{w}_i^T$，把矩阵拆成"特征基投影 + 缩放 + 反投影"的叠加。

**4. 动力视角**：$A^k$ 的长期行为由特征值模长决定——$\rho < 1$ 稳定、$\rho > 1$ 发散、$\rho = 1$ 临界；收敛速率由次主特征值决定。

这四个视角共同构成特征分解的"全景图"：从纯代数（求根）到几何（不变方向）到谱（投影分解）到动力（长期行为），每个视角揭示特征值的一个侧面。

### 与 1.5 节的呼应

1.5 节用正交性回答"如何最近地表示向量"（投影、最小二乘），1.6 节用特征结构回答"变换的固有方向是什么"。两者的交汇点是**实对称矩阵**：它的特征向量不仅正交（1.5 节主题），还构成变换的"特征基"（1.6 节主题）。这种"正交性 + 特征结构"的双重完美，让 PCA、SVD 等方法成为可能——它们将在 1.7 节正式登场。

::: key-idea 特征分解：连接线性代数与动力系统、机器学习的桥梁
特征分解不仅是"求特征值与特征向量"的技术操作，更是连接线性代数与众多应用领域的桥梁。**对动力系统**，特征值的实部符号决定稳定性，模长决定收敛/发散速率；**对机器学习**，Hessian 矩阵的特征值决定优化曲率，协方差矩阵的特征值决定数据方差分布；**对图论**，拉普拉斯矩阵的特征值揭示图聚类结构；**对量子力学**，可观测量算子的特征值是物理量的可能测量值。掌握特征分解，就是掌握了"用矩阵理解变换本质"的核心工具——这一工具将在 1.7 节的 SVD 中达到线性代数的顶峰。
:::

```python
import numpy as np

# A^k 的渐近行为：三种典型情形
def matrix_power_behavior(A, k_max=20):
    """观察 A^k 的范数随 k 的变化"""
    norms = []
    A_k = np.eye(A.shape[0])
    for k in range(k_max + 1):
        norms.append(np.linalg.norm(A_k))
        A_k = A_k @ A
    return norms

# 情形 1: ρ < 1（渐近稳定）
A_stable = np.array([[0.5, 0.1],
                     [0.0, 0.3]])
rho_stable = max(abs(np.linalg.eigvals(A_stable)))
print(f"情形 1（稳定）: A =\n{A_stable}")
print(f"  特征值: {np.linalg.eigvals(A_stable)}")
print(f"  谱半径 ρ = {rho_stable:.4f}")
print(f"  ||A^k|| 演化: {matrix_power_behavior(A_stable, 5)}")

# 情形 2: ρ > 1（发散）
A_unstable = np.array([[1.2, 0.1],
                       [0.0, 1.1]])
rho_unstable = max(abs(np.linalg.eigvals(A_unstable)))
print(f"\n情形 2（发散）: A =\n{A_unstable}")
print(f"  特征值: {np.linalg.eigvals(A_unstable)}")
print(f"  谱半径 ρ = {rho_unstable:.4f}")
print(f"  ||A^k|| 演化: {matrix_power_behavior(A_unstable, 5)}")

# 情形 3: ρ = 1（临界）
# 旋转矩阵：模长 1 但不收敛（持续旋转）
theta = np.pi / 6  # 30°
A_critical = np.array([[np.cos(theta), -np.sin(theta)],
                       [np.sin(theta),  np.cos(theta)]])
rho_critical = max(abs(np.linalg.eigvals(A_critical)))
print(f"\n情形 3（临界 - 旋转）: A =\n{A_critical}")
print(f"  特征值: {np.linalg.eigvals(A_critical)}  (复特征值)")
print(f"  谱半径 ρ = {rho_critical:.4f}")
print(f"  ||A^k|| 演化: {matrix_power_behavior(A_critical, 5)}")
print(f"  → 范数恒为 1（不收敛也不发散，持续旋转）")
```

```python
import numpy as np

# PageRank 简化版
# 5 个网页的链接图（A → B 表示 A 链向 B）
# 链接关系（列 j 表示从网页 j 出链到哪些网页）：
# 网页 1 → 2, 3
# 网页 2 → 3, 4
# 网页 3 → 4
# 网页 4 → 5
# 网页 5 → 1, 2

n = 5
# 构造转移矩阵 M（M_ij = 从 j 跳到 i 的概率）
# 每列和为 1（按出链均匀分配）
M = np.array([
    [0,   0,   0,   0,   0.5],  # 到网页 1
    [0.5, 0,   0,   0,   0.5],  # 到网页 2
    [0.5, 0.5, 0,   0,   0  ],  # 到网页 3
    [0,   0.5, 1.0, 0,   0  ],  # 到网页 4
    [0,   0,   0,   1.0, 0  ],  # 到网页 5
])
print(f"转移矩阵 M =\n{M}")
print(f"每列和: {M.sum(axis=0)}  (应全为 1)")

# 加入阻尼因子 d=0.85
d = 0.85
G = (1 - d) / n * np.ones((n, n)) + d * M
print(f"\nGoogle 矩阵 G =\n{G}")
print(f"G 的列和: {G.sum(axis=0)}  (应全为 1)")

# 验证最大特征值为 1
eigvals, eigvecs = np.linalg.eig(G)
print(f"\n特征值: {eigvals}")
print(f"最大模长特征值: {max(abs(eigvals)):.6f}  (应为 1)")

# 找 λ=1 对应的特征向量（PageRank 向量）
idx = np.argmin(abs(eigvals - 1.0))
pagerank = eigvecs[:, idx].real
pagerank = pagerank / pagerank.sum()  # 归一化为概率分布
print(f"\nPageRank 向量: {pagerank}")
print(f"排名（从高到低）:")
order = np.argsort(-pagerank)
for rank, i in enumerate(order, 1):
    print(f"  第 {rank} 名: 网页 {i+1}, PageRank = {pagerank[i]:.4f}")

# 第二大特征值（决定收敛速率）
sorted_eigvals = sorted(eigvals, key=lambda x: -abs(x))
lambda2 = sorted_eigvals[1]
print(f"\n第二大特征值 λ2 = {lambda2.real:.4f}")
print(f"|λ2| = {abs(lambda2):.4f}  → 决定迭代收敛速度")
print(f"几何含义: |λ2| 越小，PageRank 迭代收敛越快")
```

```python
import numpy as np

# 谱半径与矩阵范数的关系
# 谱半径 ρ(A) ≤ 任何矩阵范数 ||A||
# 特别地: ρ(A) ≤ ||A||_2 = 最大奇异值

np.random.seed(42)
A = np.random.randn(4, 4)
eigvals = np.linalg.eigvals(A)
rho = max(abs(eigvals))
norm_2 = np.linalg.norm(A, ord=2)  # 谱范数 = 最大奇异值
norm_F = np.linalg.norm(A, 'fro')

print(f"A =\n{A}")
print(f"\n特征值: {eigvals}")
print(f"谱半径 ρ(A) = {rho:.6f}")
print(f"2-范数 ||A||_2 = {norm_2:.6f} (最大奇异值)")
print(f"F-范数 ||A||_F = {norm_F:.6f}")
print(f"\nρ(A) ≤ ||A||_2? {rho <= norm_2 + 1e-10}")
print(f"ρ(A) ≤ ||A||_F? {rho <= norm_F + 1e-10}")

# 迭代法收敛的充要条件: ρ(A) < 1
# 这是线性迭代系统 x_{k+1} = A x_k 渐近稳定的充要条件
print(f"\n谱半径 < 1? {rho < 1}")
print(f"→ 线性迭代 x_{{k+1}} = A x_k 是否渐近稳定? {'是' if rho < 1 else '否'}")

# 数值实验：观察 ||A^k|| 与 ρ^k 的渐近关系
print(f"\n||A^k|| / ρ^k 的渐近行为:")
A_k = np.eye(4)
for k in range(1, 11):
    A_k = A_k @ A
    ratio = np.linalg.norm(A_k, ord=2) / (rho ** k)
    print(f"  k={k}: ||A^k||={np.linalg.norm(A_k, ord=2):.4f}, ρ^k={rho**k:.4f}, 比值={ratio:.4f}")
# 比值应渐近趋于常数（Gelfand 公式: lim ||A^k||^(1/k) = ρ）
```

<ClientOnly>
<PowerMethodDemo title="幂法迭代动力系统 · A^k·v 收敛轨迹 · 谱半径与稳定性" />
</ClientOnly>

---

## 本章小结

本节完成了从"特征向量的几何直觉"到"特征分解的全景图景"的完整旅程，把"变换中的不变方向"锻造为可计算的代数工具，并铺设了通往 SVD 的最后一块基石：

1. **几何直觉是起点**：$A\mathbf{v} = \lambda \mathbf{v}$ 揭示了变换中"方向不变只缩放"的特殊方向。$\lambda > 0$ 同向缩放，$\lambda < 0$ 反向，$|\lambda| > 1$ 放大，$|\lambda| < 1$ 缩小；复特征值 $\lambda = re^{i\theta}$ 对应"旋转 $\theta$ + 缩放 $r$"。

2. **特征方程是工具**：$\det(A - \lambda I) = 0$ 把"找 $\lambda$"转化为多项式求根。2×2 矩阵有显式公式 $\lambda^2 - \text{tr}(A)\lambda + \det(A) = 0$，判别式决定实复性。

3. **迹与行列式是不变量**：$\text{tr}(A) = \sum \lambda_i$、$\det(A) = \prod \lambda_i$，相似矩阵共享特征值——特征值是线性变换的内在属性，与基的选择无关。

4. **特征空间刻画重数**：$E_\lambda = \text{Null}(A - \lambda I)$ 是子空间，$\text{GM} \leq \text{AM}$。$\text{GM} < \text{AM}$ 时矩阵缺陷、不可对角化，需用 Jordan 标准形。

5. **对角化是核心操作**：$A = PDP^{-1}$ 把变换换到特征基下退化为纯缩放。$A^k = PD^kP^{-1}$ 简化幂次，$e^A = Pe^DP^{-1}$ 简化矩阵指数，是动力系统求解的核心。

6. **实对称矩阵是顶峰**：谱定理 $A = Q\Lambda Q^T$ 保证实对称矩阵永远有实特征值、正交特征向量、可对角化。二次型主轴定理、正定性判定、PCA、惯性张量、图谱论皆根植于此。

7. **谱图景连接动力系统**：谱半径 $\rho(A)$ 决定 $A^k$ 的渐近行为（$\rho < 1$ 稳定、$\rho > 1$ 发散、$\rho = 1$ 临界），次主特征值决定收敛速率。PageRank、马尔可夫链、动力系统稳定性皆由特征值刻画。

下一节将进入 **SVD（奇异值分解）**——把特征分解从方阵推广到任意矩阵，从对称矩阵推广到一般矩阵。SVD 将综合 1.5 节的正交性与 1.6 节的特征结构，给出 $A = U\Sigma V^T$ 这一"线性代数的顶峰"——任意矩阵都能分解为"正交旋转 + 对角缩放 + 正交旋转"三步组合，成为数据科学（PCA、推荐系统、图像压缩）最强大的工具。
