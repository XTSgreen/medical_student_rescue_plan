---
title: 1.5 正交性与投影
sidebar:
  order: 5
---

# 1.5 正交性与投影

上一节我们建立了**四大子空间**的结构图景：行空间与零空间在 $\mathbb{R}^n$ 中互补，列空间与左零空间在 $\mathbb{R}^m$ 中互补。但**互补**只是维度上的加法关系——两个子空间的维数之和等于全空间维数。本节将进一步引入**正交**这一几何关系：互补的子空间**填满**整个空间，且**相互垂直**。这一性质让我们能把任意向量**唯一分解**为两个正交分量之和，从而引出**投影**这一核心算法。

投影是线性代数中最具工程价值的工具：当方程 $A\mathbf{x} = \mathbf{b}$ 无解时，我们寻找**最接近** $\mathbf{b}$ 的 $A\mathbf{x}$——这等价于把 $\mathbf{b}$ 投影到 $A$ 的列空间。**最小二乘法**正是这一思想的直接应用。而要让投影算法**数值稳定**，我们需要**标准正交基**与 **Gram-Schmidt 正交化**，最终凝聚为矩阵形式的 **QR 分解**。本节将沿着**正交 → 投影 → 最小二乘 → 标准正交基 → Gram-Schmidt → QR** 这条主线，把正交性的几何直觉转化为可计算的代数工具。

## 1.5.1 正交性的判定与正交补的重温

### 正交向量的严格定义

两个向量 $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ 称为**正交**（Orthogonal），当且仅当它们的内积为零：

$$
\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T \mathbf{v} = 0
$$

由内积公式 $\mathbf{u} \cdot \mathbf{v} = \|\mathbf{u}\| \|\mathbf{v}\| \cos\theta$，当 $\mathbf{u}, \mathbf{v}$ 均非零时，$\mathbf{u} \cdot \mathbf{v} = 0$ 等价于 $\cos\theta = 0$，即 $\theta = 90°$。这是**垂直**在高维空间中的自然推广——**夹角为直角**。

零向量 $\mathbf{0}$ 与任何向量都正交（因为 $\mathbf{0} \cdot \mathbf{v} = 0$ 恒成立），这一约定让正交关系在子空间层面保持良好性质。

### 正交向量组的线性无关性定理

**定理**：若非零向量组 $\{\mathbf{v}_1, \mathbf{v}_2, \ldots, \mathbf{v}_k\}$ 两两正交（即 $\mathbf{v}_i \cdot \mathbf{v}_j = 0$ 对所有 $i \neq j$ 成立），则该向量组**线性无关**。

**证明**：设 $\sum_{i=1}^k c_i \mathbf{v}_i = \mathbf{0}$，对等式两边与 $\mathbf{v}_j$ 做内积：

$$
\mathbf{v}_j \cdot \left(\sum_{i=1}^k c_i \mathbf{v}_i\right) = \sum_{i=1}^k c_i (\mathbf{v}_j \cdot \mathbf{v}_i) = c_j \|\mathbf{v}_j\|^2 = 0
$$

由于 $\mathbf{v}_j \neq \mathbf{0}$，故 $\|\mathbf{v}_j\|^2 > 0$，从而 $c_j = 0$。对 $j = 1, 2, \ldots, k$ 逐一论证得所有系数为零，线性无关性得证。$\blacksquare$

这一定理的工程意义重大：**正交向量组天然线性无关**，无需再做无关性检验。这是标准正交基具有**绝佳数值性质**的根源。

### 正交补的严格定义

设 $S$ 是 $\mathbb{R}^n$ 的子空间，$S$ 的**正交补**（Orthogonal Complement）$S^\perp$ 定义为：

$$
S^\perp = \{\mathbf{x} \in \mathbb{R}^n : \mathbf{x} \cdot \mathbf{s} = 0 \text{ 对所有 } \mathbf{s} \in S \text{ 成立}\}
$$

直观理解：$S^\perp$ 是**垂直于 $S$ 中所有向量**的向量集合。可以证明 $S^\perp$ 也是子空间，且满足：

$$
\dim(S) + \dim(S^\perp) = n
$$

### 四大子空间的正交补关系

回到 1.4 节的四大子空间，它们之间存在以下**正交配对**（此处仅列举，不证明）：

$$
C(A^T)^\perp = N(A) \quad \text{（行空间的正交补是零空间）}
$$

$$
C(A)^\perp = N(A^T) \quad \text{（列空间的正交补是左零空间）}
$$

这意味着在 $\mathbb{R}^n$ 中，行空间与零空间互补（维数和为 $n$）且**正交**（任一向量与其正交补中的向量都垂直）。同理，列空间与左零空间在 $\mathbb{R}^m$ 中正交互补。

### 正交分解唯一性定理

**定理**：任意向量 $\mathbf{x} \in \mathbb{R}^n$ 可**唯一分解**为：

$$
\mathbf{x} = \mathbf{x}_{\text{row}} + \mathbf{x}_{\text{null}}
$$

其中 $\mathbf{x}_{\text{row}} \in C(A^T)$（行空间分量），$\mathbf{x}_{\text{null}} \in N(A)$（零空间分量），且两者**正交**：$\mathbf{x}_{\text{row}} \cdot \mathbf{x}_{\text{null}} = 0$。

这一分解的几何图像：把 $\mathbb{R}^n$ 想象成一张纸，行空间和零空间是纸上两条互相垂直的轴；任意向量都可以沿这两条轴分解为两个正交分量。这一图像将在 1.5.2 节的投影算法中变得可计算。

### 直和（Direct Sum）关系

正交分解可用**直和**记号表达：

$$
\mathbb{R}^n = C(A^T) \oplus N(A)
$$

直和 $\oplus$ 比 $+$ 更强：它要求两个子空间**只有零向量公共**（即交集为 $\{\mathbf{0}\}$）。正交关系自动满足这一条件——若 $\mathbf{v}$ 同时在 $C(A^T)$ 和 $N(A)$ 中，则 $\mathbf{v}$ 与自己正交，故 $\|\mathbf{v}\|^2 = 0$，即 $\mathbf{v} = \mathbf{0}$。

同理：

$$
\mathbb{R}^m = C(A) \oplus N(A^T)
$$

::: note 正交补的几何图像
四大子空间的正交关系刻画了线性变换 $A$ 的**几何骨架**：输入空间 $\mathbb{R}^n$ 被正交分解为**会被变换看到**的行空间和**会被变换压成零**的零空间；输出空间 $\mathbb{R}^m$ 被正交分解为**变换能到达**的列空间和**变换永远到不了**的左零空间。这种正交配对让投影、最小二乘等算法有了清晰的几何解释。
:::

```python
import numpy as np

A = np.array([[1, 2, 3],
              [2, 4, 6],   # 第二行 = 2 × 第一行
              [1, 1, 1]])

# 验证 C(A^T) ⊥ N(A)
# 行空间基：RREF 非零行
# 零空间基：A x = 0 的解
from sympy import Matrix
M = Matrix(A)
rref, pivots = M.rref()
print(f"RREF:\n{rref}")
print(f"主元列: {pivots}")  # (0, 2)，rank = 2

# 零空间基（基础解系）
null_basis = M.nullspace()
print(f"\n零空间基: {null_basis}")  # 通常给出 [-2, 1, 0] 之类的向量

# 取行空间基（RREF 的非零行）和零空间基，验证正交
row_basis = np.array([list(rref.row(i)) for i in range(len(pivots))], dtype=float)
print(f"\n行空间基:\n{row_basis}")

for nb in null_basis:
    nb_vec = np.array(nb.tolist(), dtype=float).flatten()
    for rb in row_basis:
        dot = np.dot(rb, nb_vec)
        print(f"  <行基 {rb}, 零基 {nb_vec}> = {dot:.6f}  (应≈0)")
```

> **交互演示**：正交判定与正交补关系的动态可视化见 1.5.2 节末尾 `VectorProjectionDemo` 组件，可拖拽向量末端实时观察投影与正交关系。

## 1.5.2 向量到子空间的投影 —— 核心算法

### 投影的几何直觉

**投影**（Projection）是把高维空间中的向量**垂直落影**到低维子空间的过程。给定子空间 $S$ 和向量 $\mathbf{b}$，$\mathbf{b}$ 在 $S$ 上的投影 $\mathbf{p}$ 是 $S$ 中**离 $\mathbf{b}$ 最近**的点——即垂足。

这一几何图像有两个核心要素：

1. **$\mathbf{p}$ 落在 $S$ 中**：$\mathbf{p} \in S$
2. **误差向量正交于 $S$**：$\mathbf{b} - \mathbf{p} \perp S$

第 2 条是投影的核心条件：投影点使得误差向量 $\mathbf{b} - \mathbf{p}$ 垂直于整个子空间 $S$。

### 投影的最优性

投影点 $\mathbf{p}$ 是 $S$ 中距离 $\mathbf{b}$ 最近的点：

$$
\|\mathbf{b} - \mathbf{p}\| = \min_{\mathbf{s} \in S} \|\mathbf{b} - \mathbf{s}\|
$$

**证明思路**：对任意 $\mathbf{s} \in S$，记 $\mathbf{e} = \mathbf{b} - \mathbf{p}$（投影误差），$\mathbf{r} = \mathbf{p} - \mathbf{s}$（投影点与 $\mathbf{s}$ 之差，落在 $S$ 中）。由于 $\mathbf{e} \perp S$ 而 $\mathbf{r} \in S$，故 $\mathbf{e} \perp \mathbf{r}$。由勾股定理：

$$
\|\mathbf{b} - \mathbf{s}\|^2 = \|\mathbf{e} + \mathbf{r}\|^2 = \|\mathbf{e}\|^2 + \|\mathbf{r}\|^2 \geq \|\mathbf{e}\|^2 = \|\mathbf{b} - \mathbf{p}\|^2
$$

等号当且仅当 $\mathbf{s} = \mathbf{p}$ 时成立。$\blacksquare$

这一**最小距离性质**是投影在数据拟合、最小二乘等场景中扮演核心角色的根源。

### 一维投影：投影到直线

设直线方向为单位向量 $\hat{\mathbf{a}}$（为简化推导，先假设 $\mathbf{a}$ 已归一化）。要投影的向量为 $\mathbf{b}$。

**投影系数**（标量）：

$$
\hat{x} = \hat{\mathbf{a}} \cdot \mathbf{b}
$$

**投影向量**：

$$
\mathbf{p} = \hat{x} \hat{\mathbf{a}} = (\hat{\mathbf{a}} \cdot \mathbf{b}) \hat{\mathbf{a}}
$$

对非单位向量 $\mathbf{a}$，可先归一化 $\hat{\mathbf{a}} = \mathbf{a} / \|\mathbf{a}\|$，代入得：

$$
\hat{x} = \frac{\mathbf{a} \cdot \mathbf{b}}{\mathbf{a} \cdot \mathbf{a}}, \quad \mathbf{p} = \frac{\mathbf{a} \cdot \mathbf{b}}{\mathbf{a} \cdot \mathbf{a}} \mathbf{a}
$$

**误差向量**（残差）：

$$
\mathbf{e} = \mathbf{b} - \mathbf{p} = \mathbf{b} - \frac{\mathbf{a} \cdot \mathbf{b}}{\mathbf{a} \cdot \mathbf{a}} \mathbf{a}
$$

**正交性验证**：

$$
\mathbf{a} \cdot \mathbf{e} = \mathbf{a} \cdot \mathbf{b} - \frac{\mathbf{a} \cdot \mathbf{b}}{\mathbf{a} \cdot \mathbf{a}} (\mathbf{a} \cdot \mathbf{a}) = \mathbf{a} \cdot \mathbf{b} - \mathbf{a} \cdot \mathbf{b} = 0 \checkmark
$$

误差向量确实与投影直线正交，这是投影算法的**自动保证**。

### 高维投影：投影到子空间

设子空间 $S$ 的一组基向量为 $\mathbf{a}_1, \mathbf{a}_2, \ldots, \mathbf{a}_n$，将它们作为列构成矩阵 $A \in \mathbb{R}^{m \times n}$（$m \geq n$，列满秩）。子空间 $S = C(A)$。

要投影的向量 $\mathbf{b} \in \mathbb{R}^m$，投影向量 $\mathbf{p} \in C(A)$，故可写为：

$$
\mathbf{p} = A \hat{\mathbf{x}}
$$

其中 $\hat{\mathbf{x}} \in \mathbb{R}^n$ 是 $\mathbf{p}$ 在基 $\{\mathbf{a}_1, \ldots, \mathbf{a}_n\}$ 下的坐标。

**正交条件**：误差向量 $\mathbf{b} - A\hat{\mathbf{x}}$ 必须正交于 $C(A)$，等价于正交于 $A$ 的每一列：

$$
A^T (\mathbf{b} - A\hat{\mathbf{x}}) = \mathbf{0}
$$

展开得：

$$
A^T A \hat{\mathbf{x}} = A^T \mathbf{b}
$$

这就是著名的**法方程**（Normal Equations）。当 $A$ 列满秩时，$A^T A$ 可逆，解为：

$$
\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}
$$

### 投影矩阵 P

将投影向量 $\mathbf{p} = A\hat{\mathbf{x}} = A(A^T A)^{-1} A^T \mathbf{b}$ 改写为 $\mathbf{p} = P \mathbf{b}$，其中：

$$
P = A(A^T A)^{-1} A^T
$$

$P$ 称为**投影矩阵**（Projection Matrix），它把任意向量 $\mathbf{b} \in \mathbb{R}^m$ 映射到 $C(A)$ 中的投影 $\mathbf{p}$。

### 投影矩阵的两大核心性质

**性质 1：对称性** $P^T = P$

$$
P^T = \left(A(A^T A)^{-1} A^T\right)^T = (A^T)^T \left((A^T A)^{-1}\right)^T A^T = A (A^T A)^{-1} A^T = P
$$

其中用到 $(A^T A)^T = A^T A$（对称）故其逆也对称。

**性质 2：幂等性** $P^2 = P$

$$
P^2 = \left(A(A^T A)^{-1} A^T\right)\left(A(A^T A)^{-1} A^T\right) = A (A^T A)^{-1} (A^T A) (A^T A)^{-1} A^T = A (A^T A)^{-1} A^T = P
$$

幂等性的几何含义：**投影的投影还是投影本身**。一旦向量已经落在 $C(A)$ 中，再次投影到 $C(A)$ 不变。

### 投影矩阵的几何分解

任意向量 $\mathbf{b}$ 可分解为：

$$
\mathbf{b} = P\mathbf{b} + (I - P)\mathbf{b}
$$

- $P\mathbf{b}$：投影到 $C(A)$ 的分量（**可解释部分**）
- $(I - P)\mathbf{b}$：投影到 $C(A)^\perp = N(A^T)$ 的分量（**残差部分**）

**$(I - P)$ 也是投影矩阵**，它把向量投影到 $C(A)$ 的正交补（即左零空间）。验证：

- 对称性：$(I - P)^T = I - P^T = I - P$
- 幂等性：$(I - P)^2 = I - 2P + P^2 = I - 2P + P = I - P$

::: tip 投影矩阵的**对偶性**
$P$ 和 $I - P$ 成对出现：$P$ 把向量映射到列空间，$I - P$ 把向量映射到左零空间。两者共同作用将 $\mathbb{R}^m$ 完整分解为 $C(A) \oplus N(A^T)$。这种**对偶投影**在信号处理（信号 + 噪声分解）、统计学（解释 + 残差分解）中广泛应用。
:::

```python
import numpy as np

# 投影到由 a1, a2 张成的平面
A = np.array([[1, 0],
              [0, 1],
              [1, 1]], dtype=float)  # 3x2，列满秩

b = np.array([1, 1, 2], dtype=float)

# 法方程：A^T A x = A^T b
ATA = A.T @ A
ATb = A.T @ b
x_hat = np.linalg.solve(ATA, ATb)
print(f"最佳坐标 x_hat = {x_hat}")  # 例如 [0.5, 0.5]

p = A @ x_hat  # 投影向量
e = b - p      # 残差
print(f"投影 p = {p}")
print(f"残差 e = {e}")
print(f"<p, e> = {np.dot(p, e):.6f}")  # 应为 0（正交）

# 投影矩阵
P = A @ np.linalg.inv(ATA) @ A.T
print(f"\n投影矩阵 P =\n{P}")
print(f"P 对称? {np.allclose(P, P.T)}")  # True
print(f"P 幂等? {np.allclose(P @ P, P)}")  # True

# 用 P 重新计算投影
p2 = P @ b
print(f"P @ b = {p2}")  # 应等于 p
```

<ClientOnly>
<VectorProjectionDemo title="向量投影 · 直线/平面双模式 · 拖拽交互" />
</ClientOnly>

## 1.5.3 最小二乘法 —— 投影的直接工程应用

### 最小二乘问题的代数描述

当方程 $A\mathbf{x} = \mathbf{b}$ 无解（即 $\mathbf{b} \notin C(A)$）时，我们退而求其次：寻找 $\hat{\mathbf{x}}$ 使**残差范数**最小：

$$
\hat{\mathbf{x}} = \arg\min_{\mathbf{x}} \|A\mathbf{x} - \mathbf{b}\|_2
$$

这就是**最小二乘问题**（Least Squares Problem）。它出现于过拟合数据、超定方程组、测量误差等几乎所有的实际工程场景。

### 最小二乘的几何本质

无解意味着 $\mathbf{b} \notin C(A)$。但 $C(A)$ 中**总有**一个离 $\mathbf{b}$ 最近的点——那就是 $\mathbf{b}$ 在 $C(A)$ 上的投影 $\mathbf{p} = P\mathbf{b}$。

最小二乘的几何本质就是：**用列空间中的投影向量 $\mathbf{p}$ 最近地逼近 $\mathbf{b}$**。

$$
A\hat{\mathbf{x}} = \mathbf{p} \quad \text{（有解，因为 } \mathbf{p} \in C(A)\text{）}
$$

### 残差向量的几何位置

残差 $\mathbf{e} = \mathbf{b} - A\hat{\mathbf{x}} = \mathbf{b} - \mathbf{p}$ 由投影的性质自动正交于 $C(A)$，因此：

$$
\mathbf{e} \in C(A)^\perp = N(A^T)
$$

**残差位于左零空间**。这一观察很重要：它告诉我们最小二乘的**误差方向**是 $A$ 行向量的**约束方向**——即 $A^T \mathbf{e} = \mathbf{0}$，这正是法方程的来源。

### 法方程在最小二乘中的核心地位

由 $A^T \mathbf{e} = \mathbf{0}$ 即 $A^T(\mathbf{b} - A\hat{\mathbf{x}}) = \mathbf{0}$，整理得：

$$
A^T A \hat{\mathbf{x}} = A^T \mathbf{b}
$$

法方程是**最小二乘问题的等价代数形式**：原问题**最小化 $\|A\mathbf{x} - \mathbf{b}\|$** 转化为**求解线性方程组 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$**。

### 正规矩阵 $A^T A$ 的可逆性

$A^T A$ 称为**正规矩阵**（Gram Matrix）。它的可逆性有简洁判据：

**定理**：$A^T A$ 可逆 $\iff$ $A$ 列满秩（即 $A$ 的列线性无关）。

**必要性**：若 $A^T A$ 可逆而 $A\mathbf{x} = \mathbf{0}$，则 $\mathbf{x} = (A^T A)^{-1} A^T \mathbf{0} = \mathbf{0}$，故 $A$ 列线性无关。

**充分性**：若 $A$ 列满秩，$A^T A$ 是 $n \times n$ 矩阵且 $\text{rank}(A^T A) = \text{rank}(A) = n$，故可逆。

### 最小二乘解的显式表达式

当 $A$ 列满秩时：

$$
\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}
$$

对应的投影矩阵（即把 $\mathbf{b}$ 映射到 $C(A)$）为：

$$
P = A(A^T A)^{-1} A^T
$$

这与 1.5.2 节导出的投影矩阵完全一致——**最小二乘与投影是同一硬币的两面**：代数上是最小化残差，几何上是投影到列空间。

### 拟合误差与勾股定理

由 $\mathbf{p} \perp \mathbf{e}$，勾股定理给出：

$$
\|\mathbf{b}\|^2 = \|\mathbf{p}\|^2 + \|\mathbf{e}\|^2
$$

故拟合误差的平方：

$$
\|\mathbf{e}\|^2 = \|\mathbf{b}\|^2 - \|\mathbf{p}\|^2
$$

这一公式把**误差大小**转化为**原向量与投影向量的范数平方差**，计算极为简便。

### 统计视角的最小二乘

在统计学中，线性回归 $y = \beta_0 + \beta_1 x_1 + \ldots + \beta_n x_n$ 的最小二乘估计正是法方程的解。设计矩阵 $X$ 的每一行是一个样本的特征向量，$\mathbf{y}$ 是观测值向量。

- **回归系数** $\hat{\boldsymbol{\beta}} = (X^T X)^{-1} X^T \mathbf{y}$
- **预测值** $\hat{\mathbf{y}} = X \hat{\boldsymbol{\beta}} = P \mathbf{y}$（投影到 $X$ 的列空间）
- **残差** $\mathbf{e} = \mathbf{y} - \hat{\mathbf{y}} = (I - P)\mathbf{y}$（投影到左零空间）
- **残差平方和**（RSS）$= \|\mathbf{e}\|^2 = \|\mathbf{y}\|^2 - \|\hat{\mathbf{y}}\|^2$

**回归的几何解释**：最小二乘回归就是**把观测向量 $\mathbf{y}$ 投影到由特征张成的子空间**，回归系数是投影在特征基下的坐标。这一视角让很多统计概念（自由度、决定系数 $R^2$、方差分解）都有了清晰的几何意义。

::: note 最小二乘的**四大身份**
同一个最小二乘问题，从不同视角有四种等价描述：(1) <strong>代数视角</strong>——最小化 $\|A\mathbf{x} - \mathbf{b}\|^2$；(2) <strong>几何视角</strong>——把 $\mathbf{b}$ 投影到 $C(A)$；(3) <strong>方程视角</strong>——求解法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$；(4) <strong>统计视角</strong>——线性回归的最大似然估计（高斯噪声假设下）。掌握这四种视角的等价转换，是理解后续岭回归、Lasso、PCA 等高级方法的钥匙。
:::

```python
import numpy as np

# 直线拟合 y = β0 + β1 x（最小二乘）
x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2.1, 3.9, 6.2, 8.1, 10.0], dtype=float)

# 构造设计矩阵 A = [[1, x1], [1, x2], ...]
A = np.vstack([np.ones_like(x), x]).T
print(f"A:\n{A}")

# 最小二乘解：x_hat = (A^T A)^-1 A^T y
ATA = A.T @ A
ATy = A.T @ y
beta = np.linalg.solve(ATA, ATy)
print(f"\n回归系数 β = {beta}")  # [截距, 斜率]

# 预测与残差
y_hat = A @ beta  # = P y
e = y - y_hat
print(f"预测值 ŷ = {y_hat}")
print(f"残差 e = {e}")

# 勾股定理验证
print(f"\n||y||^2 = {np.dot(y, y):.4f}")
print(f"||ŷ||^2 = {np.dot(y_hat, y_hat):.4f}")
print(f"||e||^2  = {np.dot(e, e):.4f}")
print(f"||ŷ||^2 + ||e||^2 = {np.dot(y_hat, y_hat) + np.dot(e, e):.4f}  (应等于 ||y||^2)")

# 投影矩阵
P = A @ np.linalg.inv(ATA) @ A.T
print(f"\n投影矩阵 P 形状: {P.shape}")
print(f"P 幂等? {np.allclose(P @ P, P)}")  # True

# 残差位于左零空间：A^T e ≈ 0
print(f"\nA^T e = {A.T @ e}  (应≈0)")
```

<ClientOnly>
<LeastSquaresDemo title="最小二乘平面拟合 · 三维散点 + 残差正交分解" />
</ClientOnly>

## 1.5.4 标准正交基 —— 数值稳定的**黄金坐标系**

### 标准正交的双重条件

一组向量 $\{\mathbf{q}_1, \mathbf{q}_2, \ldots, \mathbf{q}_n\}$ 称为**标准正交**（Orthonormal），需同时满足两个条件：

1. **两两正交**：$\mathbf{q}_i \cdot \mathbf{q}_j = 0$ 对所有 $i \neq j$
2. **单位长度**：$\|\mathbf{q}_i\| = 1$ 对所有 $i$

合并为一个简洁的内积条件：

$$
\mathbf{q}_i \cdot \mathbf{q}_j = \delta_{ij} = \begin{cases} 1, & i = j \\ 0, & i \neq j \end{cases}
$$

其中 $\delta_{ij}$ 是 Kronecker delta。

### 标准正交基的矩阵记号

将标准正交向量作为列构成矩阵 $Q = [\mathbf{q}_1, \mathbf{q}_2, \ldots, \mathbf{q}_n]$，则：

$$
Q^T Q = I
$$

$(Q^T Q)_{ij} = \mathbf{q}_i \cdot \mathbf{q}_j = \delta_{ij}$，故 $Q^T Q$ 是单位阵。

注意：$Q^T Q = I$ 不一定意味着 $Q Q^T = I$。前者是列正交（$Q$ 是**瘦**矩阵 $m \times n$，$m > n$），后者是行也正交（$Q$ 是方阵，即正交矩阵）。

### 优势 1：坐标提取极其简单

任意向量 $\mathbf{b}$ 在标准正交基 $\{\mathbf{q}_1, \ldots, \mathbf{q}_n\}$ 下的坐标系数为：

$$
c_i = \mathbf{q}_i^T \mathbf{b}
$$

**证明**：设 $\mathbf{b} = \sum_j c_j \mathbf{q}_j$，两边与 $\mathbf{q}_i$ 内积：$\mathbf{q}_i^T \mathbf{b} = \sum_j c_j \mathbf{q}_i^T \mathbf{q}_j = c_i$。

对比一般基（需解 $A\mathbf{c} = \mathbf{b}$，复杂度 $O(n^3)$），标准正交基只需 $n$ 次点积（$O(n^2)$），**无需解方程**。

### 优势 2：投影公式退化

当子空间的基 $Q$ 是标准正交时，投影矩阵简化为：

$$
P = Q (Q^T Q)^{-1} Q^T = Q I Q^T = Q Q^T
$$

**无需计算矩阵逆**！最小二乘解也简化为：

$$
\hat{\mathbf{x}} = (Q^T Q)^{-1} Q^T \mathbf{b} = Q^T \mathbf{b}
$$

只是简单点积。

### 优势 3：保持向量长度不变

对任意 $\mathbf{x}$：

$$
\|Q\mathbf{x}\|^2 = (Q\mathbf{x})^T (Q\mathbf{x}) = \mathbf{x}^T Q^T Q \mathbf{x} = \mathbf{x}^T \mathbf{x} = \|\mathbf{x}\|^2
$$

故 $\|Q\mathbf{x}\| = \|\mathbf{x}\|$。这一性质称为**等距同构**（Isometry）：用 $Q$ 变换向量不改变其长度。几何上，$Q$ 是纯旋转或反射，不伸缩。

### 优势 4：数值稳定性极高

法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$ 的数值问题在于：$A^T A$ 的**条件数是 $A$ 的平方**：

$$
\kappa(A^T A) = \kappa(A)^2
$$

若 $A$ 的条件数为 $10^4$（中等病态），$A^T A$ 的条件数高达 $10^8$（严重病态），数值误差被放大。

使用标准正交基 $Q$ 时，$Q^T Q = I$（条件数为 1），完全避免了这一放大效应。这是 QR 分解比法方程更稳定的核心原因（见 1.5.6 节）。

### 正交矩阵的定义

当 $Q$ 是方阵且 $Q^T Q = I$ 时，由方阵性质自动有 $Q Q^T = I$，即 $Q^T = Q^{-1}$。这样的 $Q$ 称为**正交矩阵**（Orthogonal Matrix）。

正交矩阵的几何意义：它代表纯旋转或反射变换，不改变向量长度和夹角。

### 正交矩阵的行列式性质

由 $\det(Q^T Q) = \det(I) = 1$ 且 $\det(Q^T Q) = \det(Q)^2$，得：

$$
\det(Q) = \pm 1
$$

- $\det(Q) = +1$：纯旋转（保持定向）
- $\det(Q) = -1$：旋转 + 反射（反转定向）

正交变换**保持面积/体积不变**，这是它在几何中的**刚性**特征。

::: tip 标准正交基 = 数值**黄金坐标系**
把数据变换到标准正交基下，等价于把一个歪斜的坐标系**校正**为笛卡尔坐标系。在新的坐标系下，所有计算（投影、最小二乘、条件数）都变得简单且数值稳定。这正是 PCA、SVD、QR 等方法在数据科学中**必经标准正交化**的根本原因。
:::

```python
import numpy as np

# 构造一组标准正交基（二维旋转矩阵）
theta = np.pi / 4  # 45°
Q = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])
print(f"Q =\n{Q}")
print(f"Q^T Q =\n{Q.T @ Q}")  # 应为单位阵
print(f"det(Q) = {np.linalg.det(Q):.6f}")  # 1.0（纯旋转）

# 验证等距性
x = np.array([3, 4])
print(f"\n||x|| = {np.linalg.norm(x):.4f}")
print(f"||Qx|| = {np.linalg.norm(Q @ x):.4f}")  # 应相等

# 用标准正交基做投影：P = Q Q^T
# 此处 Q 是方阵，P = I（整个空间都被覆盖）
# 改用一个"瘦"标准正交矩阵（3x2）
Q_slim = np.array([[1, 0],
                   [0, 1],
                   [0, 0]], dtype=float)
print(f"\nQ_slim^T Q_slim =\n{Q_slim.T @ Q_slim}")  # I_2
P = Q_slim @ Q_slim.T
print(f"P =\n{P}")  # 投影到 xy 平面

b = np.array([1, 2, 5], dtype=float)
p = P @ b
print(f"\nb = {b}, 投影 p = {p}")  # [1, 2, 0]
print(f"无需计算逆，直接 Q Q^T b = {(Q_slim @ (Q_slim.T @ b))}")
```

> **交互演示**：标准正交基的逐步构建过程见 1.5.5 节末尾 `GramSchmidtDemo` 组件，可分步观察从任意基到标准正交基的转化动画。

## 1.5.5 Gram-Schmidt 正交化过程 —— 从**任意基**到**标准正交基**的流水线

### 几何目标

给定一组线性无关的向量 $\{\mathbf{a}_1, \mathbf{a}_2, \ldots, \mathbf{a}_n\}$，**Gram-Schmidt 过程**（Gram-Schmidt Process）将其转化为张成相同子空间的标准正交组 $\{\mathbf{q}_1, \mathbf{q}_2, \ldots, \mathbf{q}_n\}$。

**关键不变量**：对每一步 $k$，前 $k$ 个新向量张成的子空间等于前 $k$ 个原向量张成的子空间：

$$
\text{span}\{\mathbf{q}_1, \ldots, \mathbf{q}_k\} = \text{span}\{\mathbf{a}_1, \ldots, \mathbf{a}_k\} \quad \text{对所有 } k = 1, \ldots, n
$$

### 核心思想：逐次剥离已确定方向上的投影

Gram-Schmidt 的几何直觉清晰：**从新向量中减去它在已有正交方向上的投影分量**，剩下的部分就是与已有方向都垂直的新方向。

### Step 1：归一化第一个向量

$$
\mathbf{v}_1 = \mathbf{a}_1, \quad \mathbf{q}_1 = \frac{\mathbf{v}_1}{\|\mathbf{v}_1\|}
$$

第一个向量无需正交化，只需归一化为单位长度。

### Step 2：正交化第二个向量

从 $\mathbf{a}_2$ 中减去它在 $\mathbf{q}_1$ 方向上的投影分量：

$$
\mathbf{v}_2 = \mathbf{a}_2 - (\mathbf{a}_2 \cdot \mathbf{q}_1) \mathbf{q}_1
$$

此时 $\mathbf{v}_2 \perp \mathbf{q}_1$（验证：$\mathbf{q}_1 \cdot \mathbf{v}_2 = \mathbf{q}_1 \cdot \mathbf{a}_2 - (\mathbf{a}_2 \cdot \mathbf{q}_1)(\mathbf{q}_1 \cdot \mathbf{q}_1) = \mathbf{q}_1 \cdot \mathbf{a}_2 - \mathbf{a}_2 \cdot \mathbf{q}_1 = 0$）。

归一化：

$$
\mathbf{q}_2 = \frac{\mathbf{v}_2}{\|\mathbf{v}_2\|}
$$

### Step k：通用公式

对第 $k$ 个向量 $\mathbf{a}_k$，从其中减去它在所有已确定正交方向 $\mathbf{q}_1, \ldots, \mathbf{q}_{k-1}$ 上的投影分量：

$$
\mathbf{v}_k = \mathbf{a}_k - \sum_{i=1}^{k-1} (\mathbf{a}_k \cdot \mathbf{q}_i) \mathbf{q}_i
$$

归一化：

$$
\mathbf{q}_k = \frac{\mathbf{v}_k}{\|\mathbf{v}_k\|}
$$

### 几何可视化

每一步生成的 $\mathbf{v}_k$ 都垂直于由 $\{\mathbf{q}_1, \ldots, \mathbf{q}_{k-1}\}$ 张成的子空间——这是**剥离投影**的自动结果。可以把 Gram-Schmidt 想象为在 $n$ 维空间中逐次**竖立**互相垂直的坐标轴。

### 经典 Gram-Schmidt 与改进 Gram-Schmidt

**经典 Gram-Schmidt**（CGS）：直接按上述公式计算。但 CGS 在数值上**不稳定**——当 $\mathbf{a}_k$ 几乎在已有子空间中时，$\mathbf{v}_k$ 会非常小，舍入误差被严重放大。

**改进 Gram-Schmidt**（MGS）：调整计算顺序，每计算一个投影分量就立即从 $\mathbf{a}_k$ 中减去，避免累积误差。MGS 数值稳定性显著优于 CGS，与 Householder 变换相当。

实际计算中应**优先使用 MGS 或 Householder QR**，CGS 主要用于教学演示。

### 中间产物：三角系数 $r_{ij}$

Gram-Schmidt 过程中产生的内积系数有重要意义：

$$
r_{ij} = \mathbf{a}_j \cdot \mathbf{q}_i \quad (i \leq j)
$$

特别地：

- $r_{kk} = \|\mathbf{v}_k\|$（第 $k$ 步正交化向量的长度）
- $r_{ij} = \mathbf{a}_j \cdot \mathbf{q}_i$（$\mathbf{a}_j$ 在 $\mathbf{q}_i$ 上的投影系数）

整理公式 $\mathbf{a}_k = \sum_{i=1}^{k} r_{ik} \mathbf{q}_i$，这些系数构成了**上三角矩阵 $R$**——这正是下一节 QR 分解的来源。

::: note Gram-Schmidt 的**流水线**视角
Gram-Schmidt 像一条加工流水线：原料是任意线性无关的向量组 $\{\mathbf{a}_k\}$，产物是标准正交组 $\{\mathbf{q}_k\}$，副产物是三角系数 $\{r_{ij}\}$。整条流水线的**操作**是简单的**减去投影 + 归一化**，无需解方程、无需矩阵求逆。这种简洁性使 Gram-Schmidt 成为简洁有效的算法之一。
:::

```python
import numpy as np

def gram_schmidt(A):
    """经典 Gram-Schmidt 正交化
    输入: A (m x n) 列满秩矩阵
    输出: Q (m x n) 标准正交, R (n x n) 上三角
    """
    m, n = A.shape
    Q = np.zeros((m, n))
    R = np.zeros((n, n))
    for k in range(n):
        v = A[:, k].copy()
        for i in range(k):
            R[i, k] = Q[:, i] @ A[:, k]   # r_ik = a_k · q_i
            v -= R[i, k] * Q[:, i]         # 减去已有方向的投影
        R[k, k] = np.linalg.norm(v)        # r_kk = ||v_k||
        if R[k, k] < 1e-12:
            raise ValueError("列向量线性相关，无法正交化")
        Q[:, k] = v / R[k, k]
    return Q, R

# 测试
A = np.array([[1, 1, 1],
              [0, 1, 1],
              [0, 0, 1]], dtype=float)
Q, R = gram_schmidt(A)
print(f"Q =\n{Q}")
print(f"R =\n{R}")
print(f"Q^T Q =\n{Q.T @ Q}")  # 应为单位阵
print(f"Q R =\n{Q @ R}")       # 应等于 A
print(f"QR == A? {np.allclose(Q @ R, A)}")

# 与 numpy 内置 QR 对比（使用 Householder，更稳定）
Q_np, R_np = np.linalg.qr(A)
print(f"\nnumpy QR:")
print(f"Q =\n{Q_np}")
print(f"R =\n{R_np}")
```

<ClientOnly>
<GramSchmidtDemo title="Gram-Schmidt 正交化 · 分步动画 · 核心招牌组件" />
</ClientOnly>

## 1.5.6 QR 分解 —— Gram-Schmidt 的矩阵形式

### QR 分解的定义

任意列满秩矩阵 $A \in \mathbb{R}^{m \times n}$（$m \geq n$）可分解为：

$$
A = QR
$$

其中：

- $Q \in \mathbb{R}^{m \times n}$：列向量标准正交，即 $Q^T Q = I_n$
- $R \in \mathbb{R}^{n \times n}$：上三角矩阵（Upper Triangular），对角线元素为正

### R 矩阵的几何意义

由 Gram-Schmidt 的中间产物可知：

- **对角线元素** $r_{kk} = \|\mathbf{v}_k\|$：第 $k$ 步正交化向量的长度
- **非对角线元素** $r_{ij} = \mathbf{a}_j \cdot \mathbf{q}_i$（$i < j$）：$\mathbf{a}_j$ 在 $\mathbf{q}_i$ 上的投影系数

由于 $\mathbf{v}_k \neq \mathbf{0}$（前提是 $A$ 列满秩），$r_{kk} > 0$，故 $R$ 是**对角线为正的上三角矩阵**，可逆。

### QR 分解的几何解读

任意线性变换 $A$ 可分解为：

- $Q$：正交变换（旋转或反射），保持长度和角度
- $R$：上三角变换，包含伸缩和剪切

$$
A\mathbf{x} = Q(R\mathbf{x})
$$

即**先用 $R$ 把 $\mathbf{x}$ 拉伸剪切，再用 $Q$ 旋转到目标方向**。这种分解把**复杂的线性变换**拆解为**几何意义清晰的两个简单变换**。

### 嵌套子空间性质

由 Gram-Schmidt 的不变量：

$$
\text{span}\{\mathbf{q}_1, \ldots, \mathbf{q}_k\} = \text{span}\{\mathbf{a}_1, \ldots, \mathbf{a}_k\} \quad \text{对所有 } k
$$

即 $A$ 的前 $k$ 列张成的子空间 = $Q$ 的前 $k$ 列张成的子空间。这一**嵌套子空间性质**是 QR 分解在迭代算法（如 Arnoldi、Lanczos）中扮演核心角色的根源。

### 用 QR 分解求解最小二乘

当 $A$ 列满秩时，最小二乘问题 $\min \|A\mathbf{x} - \mathbf{b}\|$ 可通过 QR 高效求解：

代入 $A = QR$，法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$ 化为：

$$
(QR)^T (QR) \hat{\mathbf{x}} = (QR)^T \mathbf{b}
$$

$$
R^T Q^T Q R \hat{\mathbf{x}} = R^T Q^T \mathbf{b}
$$

由 $Q^T Q = I$：

$$
R^T R \hat{\mathbf{x}} = R^T Q^T \mathbf{b}
$$

$R$ 可逆，左乘 $(R^T)^{-1}$：

$$
R \hat{\mathbf{x}} = Q^T \mathbf{b}
$$

由于 $R$ 是上三角，**采用回代**（Back Substitution）即可在 $O(n^2)$ 时间内求解，**无需矩阵求逆**。

### QR 分解的数值优势

法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$ 的问题：$\kappa(A^T A) = \kappa(A)^2$，条件数平方放大。

QR 分解方法：直接处理 $R \hat{\mathbf{x}} = Q^T \mathbf{b}$，条件数仍是 $\kappa(A)$（因为 $Q$ 是正交的，不放大误差）。

**结论**：QR 分解比法方程**数值稳定性高一个数量级**，是工程实现最小二乘的首选方法（如 NumPy 的 `np.linalg.lstsq` 内部就用 QR 或 SVD）。

### 经济型 QR 与完整 QR

当 $m > n$（矩阵**瘦高**）时：

- **经济型 QR**（瘦 QR）：$Q$ 是 $m \times n$，$R$ 是 $n \times n$。仅包含张成 $C(A)$ 所需的 $n$ 个正交向量。
- **完整 QR**（胖 QR）：$Q$ 是 $m \times m$ 正交矩阵，$R$ 是 $m \times n$（下部全零）。补充 $m - n$ 个正交向量把 $Q$ **补全**为方阵。

最小二乘求解只需经济型 QR。

### QR 分解与行列式

由 $A = QR$：

$$
|\det(A)| = |\det(Q)| \cdot |\det(R)| = 1 \cdot \prod_{i=1}^n |r_{ii}| = \prod_{i=1}^n |r_{ii}|
$$

（$|\det(Q)| = 1$ 因 $Q$ 列正交；$\det(R) = \prod r_{ii}$ 因 $R$ 上三角）

**几何含义**：正交变换不改变体积，故 $A$ 的**体积放大率**完全由 $R$ 的对角线元素乘积决定。这一公式是计算行列式的高效方法之一。

::: tip QR 分解 = **正交化 + 上三角化**
QR 分解把任意矩阵 $A$ 拆成**正交部分 $Q$**和**上三角部分 $R$**。这一拆解在数值线性代数中广泛应用：解最小二乘、计算特征值（QR 算法）、正交化基、估计条件数等都依赖 QR。掌握 QR 分解的几何与代数双重意义，是进入高级数值方法（如 SVD、Schur 分解）的门槛。
:::

```python
import numpy as np

# 用 QR 分解求解最小二乘
# 问题：拟合 y = β0 + β1 x + β2 x^2（二次多项式）
x = np.array([0, 1, 2, 3, 4, 5], dtype=float)
y = np.array([1.1, 2.9, 6.2, 11.0, 17.9, 26.1], dtype=float)

# 设计矩阵
A = np.vstack([np.ones_like(x), x, x**2]).T  # 6x3
print(f"A shape: {A.shape}")

# 法方程方法（条件数平方）
beta_normal = np.linalg.solve(A.T @ A, A.T @ y)
print(f"\n[法方程] β = {beta_normal}")

# QR 方法（条件数不变）
Q, R = np.linalg.qr(A)  # 经济型 QR
print(f"\nQ shape: {Q.shape}, R shape: {R.shape}")
print(f"Q^T Q =\n{Q.T @ Q}")  # 应为 I_3

# 解 R x = Q^T b（上三角回代）
QTb = Q.T @ y
beta_qr = np.linalg.solve(R, QTb)  # 上三角求解
print(f"[QR] β = {beta_qr}")

# 两种方法结果应一致
print(f"\n两者一致? {np.allclose(beta_normal, beta_qr)}")

# 用行列式公式估计 |det(A^T A)|
# 注意 A 是 6x3 不可逆，但 A^T A 可逆
det_ATA_normal = np.linalg.det(A.T @ A)
det_R_squared = np.prod(np.diag(R))**2  # |det(A^T A)| = |det(R)|^2
print(f"\n|det(A^T A)| (直接) = {det_ATA_normal:.6f}")
print(f"|det(R)|^2         = {det_R_squared:.6f}")

# 预测
y_hat = A @ beta_qr
print(f"\n预测 ŷ = {y_hat}")
print(f"残差 e = {y - y_hat}")
print(f"R^2 = {1 - np.sum((y - y_hat)**2) / np.sum((y - y.mean())**2):.4f}")
```

<ClientOnly>
<QRDecompositionDemo title="QR 分解 · 双场景对比 · R 矩阵点击联动" />
</ClientOnly>

## 1.5.7 综合几何图景 —— 正交性在整个线性代数中的枢纽地位

### 四大经典正交关系总结

回顾本节与上一节的所有正交关系，可用**投影视角**统一解读：

**1. 行空间 $\perp$ 零空间**：$C(A^T) \perp N(A)$

任意 $\mathbf{x} \in \mathbb{R}^n$ 可分解为 $\mathbf{x} = \mathbf{x}_r + \mathbf{x}_n$，其中 $\mathbf{x}_r \in C(A^T)$ 是**被 $A$ 看见**的分量，$\mathbf{x}_n \in N(A)$ 是**被 $A$ 压成零**的分量。投影到行空间保留了**可解部分**。

**2. 列空间 $\perp$ 左零空间**：$C(A) \perp N(A^T)$

任意 $\mathbf{b} \in \mathbb{R}^m$ 可分解为 $\mathbf{b} = \mathbf{p} + \mathbf{e}$，其中 $\mathbf{p} \in C(A)$ 是**可达输出**，$\mathbf{e} \in N(A^T)$ 是**残差方向**。**最小二乘的残差向量 $\mathbf{e}$ 属于左零空间**。

### 投影矩阵 $P$ 与 $I - P$ 的联合作用

把 $\mathbb{R}^m$ 完整分解为：

$$
\mathbb{R}^m = C(A) \oplus N(A^T) = \text{range}(P) \oplus \text{range}(I - P)
$$

- $P\mathbf{b}$：投影到 $C(A)$，提取**模型能解释的信号**
- $(I - P)\mathbf{b}$：投影到 $N(A^T)$，提取**模型无法解释的噪声**

这对投影矩阵共同作用，把空间**完全分解**为两个正交部分。这一分解是信号处理、统计回归、机器学习的共同数学基础。

### 从**求解方程**到**最佳逼近**的思维转换

| 场景 | 数学问题 | 几何图像 |
|------|---------|---------|
| $\mathbf{b} \in C(A)$ | $A\mathbf{x} = \mathbf{b}$ 有解 | 直接命中 |
| $\mathbf{b} \notin C(A)$ | $\min \|A\mathbf{x} - \mathbf{b}\|$ | 投影最近似 |

当 $A\mathbf{x} = \mathbf{b}$ 无解时，求 $\mathbf{p} \in C(A)$ 最近似 $\mathbf{b}$——这是从**精确求解**到**最佳逼近**的思维转变。这一转变是数据科学的起点：真实数据总有噪声，**完美拟合**既不可能也不必要，**最佳逼近**才是工程现实。

### 勾股定理在子空间中的推广

由 $\mathbf{b} = \mathbf{p} + \mathbf{e}$ 且 $\mathbf{p} \perp \mathbf{e}$：

$$
\|\mathbf{b}\|^2 = \|\mathbf{p}\|^2 + \|\mathbf{e}\|^2
$$

这一公式将平面几何中的勾股定理推广到任意维度的子空间。它把**原信号的能量**分解为**模型解释的能量**和**残差能量**两部分——这是统计中方差分解的几何根源。

在回归分析中：

- $\|\mathbf{b}\|^2$：总平方和（TSS）
- $\|\mathbf{p}\|^2$：回归平方和（ESS）
- $\|\mathbf{e}\|^2$：残差平方和（RSS）
- 决定系数 $R^2 = \text{ESS} / \text{TSS} = 1 - \text{RSS} / \text{TSS}$

### 正交性在人工智能中的核心体现

正交性是现代 AI 算法的**隐形骨架**：

1. **PCA（主成分分析）**：寻找数据协方差矩阵的特征向量，这些特征向量**两两正交**。正交性保证了主成分之间不冗余，每个主成分携带独立信息。

2. **神经网络中的正交正则化**：通过约束权重矩阵接近正交矩阵，避免梯度消失或爆炸，提升训练稳定性。正交初始化（如 SVD 初始化）是深度网络训练的关键技巧。

3. **Transformer 中的自注意力正交性**：多头注意力的不同**头**通过正交化减少冗余，让每个头关注不同子空间的信息。位置编码的正交性保证不同位置的编码可区分。

4. **正交 Procrustes 问题**：在词向量对齐、神经网络权重匹配等场景，求解 $A \to Q^* A$（$Q$ 正交）使目标最优，本质是 SVD 在正交约束下的应用。

5. **数值算法的稳定基石**：从共轭梯度法到 Krylov 子空间方法，正交性是迭代算法收敛与稳定的核心保障。

::: note 正交性 = 线性代数的**枢纽**
本节的主线**正交 → 投影 → 最小二乘 → 标准正交基 → Gram-Schmidt → QR**展示了正交性如何从抽象的几何概念逐步转化为可计算的代数工具。每一站都对应一种工程应用：投影对应数据拟合，最小二乘对应回归分析，QR 对应数值稳定算法。下一节将进入特征值与特征向量——把**正交**扩展到**特征向量正交**（对称矩阵的可对角化性），最终通向 SVD 这一**线性代数的顶峰**。
:::

```python
import numpy as np

# 综合演示：用 QR 分解做 PCA（简化版）
# 数据：100 个样本，每个 3 维
np.random.seed(42)
mean = [0, 0, 0]
cov = [[2, 1, 0.5],
       [1, 2, 0.3],
       [0.5, 0.3, 1]]
X = np.random.multivariate_normal(mean, cov, 100)
print(f"数据形状: {X.shape}")

# 中心化
X_centered = X - X.mean(axis=0)

# 协方差矩阵
C = (X_centered.T @ X_centered) / (X.shape[0] - 1)
print(f"\n协方差矩阵:\n{C}")

# 用 QR 分解计算正交基（注意：PCA 通常用 SVD，这里仅演示）
Q, R = np.linalg.qr(X_centered)
print(f"\nQR 分解后 Q 的列（正交方向）:")
print(Q[:5, :])  # 前 5 行预览

# 验证 Q 的列正交
print(f"\nQ^T Q =\n{Q.T @ Q}")  # 应为 I

# 对比：SVD 的正交基
U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
print(f"\nSVD 的奇异值: {S}")
print(f"主成分方向（V 的列）:\n{Vt.T}")

# 计算各主成分解释的方差比例
variance_ratio = S**2 / np.sum(S**2)
print(f"\n各主成分方差占比: {variance_ratio}")
print(f"累计方差: {np.cumsum(variance_ratio)}")

# 验证：正交变换保持总能量
total_energy = np.sum(X_centered**2)
projected_energy = np.sum(S**2)
print(f"\n原数据总能量: {total_energy:.4f}")
print(f"主成分总能量: {projected_energy:.4f}")  # 应相等
```

> **交互演示回顾**：本节为综合总结章节，可回顾本章 4 个交互组件——`VectorProjectionDemo`（1.5.2，投影与正交性）、`LeastSquaresDemo`（1.5.3，最小二乘平面拟合）、`GramSchmidtDemo`（1.5.5，Gram-Schmidt 分步动画）、`QRDecompositionDemo`（1.5.6，QR 分解双场景对比），从不同视角理解正交性在线性代数中的枢纽地位。

---

## 本章小结

本节完成了从**四大子空间结构**到**投影与最小二乘算法**的完整闭环，并铺设了通往 SVD 的最后一块基石：

1. **正交性是几何核心**：四大子空间的正交配对（行⊥零、列⊥左零）让任意向量可唯一正交分解，这是投影算法的几何基础。

2. **投影是核心算法**：一维投影、高维投影、法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$、投影矩阵 $P = A(A^T A)^{-1} A^T$ 的对称性与幂等性，构成了数据拟合的数学骨架。

3. **最小二乘是直接应用**：当 $A\mathbf{x} = \mathbf{b}$ 无解时，投影给出最佳逼近 $\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}$，残差位于左零空间。统计视角下即线性回归。

4. **标准正交基是黄金坐标系**：$Q^T Q = I$ 让坐标提取、投影、最小二乘都退化为简单点积，且保持长度、数值稳定。

5. **Gram-Schmidt 是构造流水线**：从任意基到标准正交基的逐步正交化，副产物为上三角系数 $R$。

6. **QR 分解是矩阵形式**：$A = QR$ 让最小二乘变为回代求解 $R\hat{\mathbf{x}} = Q^T\mathbf{b}$，避免 $A^T A$ 的条件数平方放大，是工程首选。

7. **正交性是 AI 的隐形骨架**：PCA、神经网络正则化、Transformer 注意力等核心算法都根植于正交性。

下一节将进入**特征值与特征向量**：把**正交**从基的层面扩展到变换的层面，研究哪些方向在变换下**不变方向只伸缩**。最终，对称矩阵的**特征向量正交**将把本节的标准正交基与变换的特征结构统一起来，通向 **SVD（奇异值分解）**——线性代数的顶峰。

## 练习题

### 第 1 题 概念推导

设 $A \in \mathbb{R}^{m \times n}$ 列满秩，投影矩阵 $P = A(A^T A)^{-1} A^T$。证明 $P$ 满足**对称性** $P^T = P$ 与**幂等性** $P^2 = P$，并从几何角度解释这两条性质对应投影的什么行为。

::: details 参考答案
**对称性**：$P^T = \big(A(A^T A)^{-1} A^T\big)^T = (A^T)^T \big((A^T A)^{-1}\big)^T A^T = A (A^T A)^{-1} A^T = P$。其中用到 $(XY)^T = Y^T X^T$、$(A^T A)^T = A^T A$（对称）、$(A^T A)^{-1}$ 仍对称。几何含义：$\mathbf{u}$ 在 $V$ 上的投影与 $\mathbf{v}$ 在 $V$ 上的投影的内积，等于 $\mathbf{v}$ 在 $V$ 上的投影与 $\mathbf{u}$ 在 $V$ 上的投影的内积，即投影算子自伴。

**幂等性**：$P^2 = A(A^T A)^{-1} A^T \cdot A(A^T A)^{-1} A^T = A(A^T A)^{-1} (A^T A) (A^T A)^{-1} A^T = A(A^T A)^{-1} A^T = P$。中间步骤用到 $A^T A$ 与其逆相消。几何含义：把向量投影到 $V$ 一次后，结果已落在 $V$ 中；再投影一次，结果不变——**投影的投影仍是自身**。这两条性质合起来是投影矩阵的充要条件：对称且幂等的矩阵必定是到其列空间的正交投影。
:::

### 第 2 题 代码验证

利用本节的 `<GramSchmidtDemo>` 交互组件，输入向量组 $\mathbf{a}_1 = (1, 1, 0)^T$，$\mathbf{a}_2 = (1, 0, 1)^T$，$\mathbf{a}_3 = (0, 1, 1)^T$。观察分步正交化过程，记录每一步得到的 $\mathbf{v}_k$ 与 $\mathbf{q}_k$，并验证最终 $\{\mathbf{q}_1, \mathbf{q}_2, \mathbf{q}_3\}$ 满足 $Q^T Q = I$。

::: details 参考答案
**第 1 步**：$\mathbf{v}_1 = \mathbf{a}_1 = (1, 1, 0)^T$，$\|\mathbf{v}_1\| = \sqrt{2}$，$\mathbf{q}_1 = \frac{1}{\sqrt{2}}(1, 1, 0)^T$。

**第 2 步**：$\mathbf{v}_2 = \mathbf{a}_2 - (\mathbf{a}_2 \cdot \mathbf{q}_1)\mathbf{q}_1$。$\mathbf{a}_2 \cdot \mathbf{q}_1 = \frac{1}{\sqrt{2}}$，故 $\mathbf{v}_2 = (1, 0, 1)^T - \frac{1}{2}(1, 1, 0)^T = (\frac{1}{2}, -\frac{1}{2}, 1)^T$。$\|\mathbf{v}_2\| = \sqrt{\frac{1}{4} + \frac{1}{4} + 1} = \sqrt{\frac{3}{2}}$，$\mathbf{q}_2 = \frac{1}{\sqrt{6}}(1, -1, 2)^T$。

**第 3 步**：$\mathbf{v}_3 = \mathbf{a}_3 - (\mathbf{a}_3 \cdot \mathbf{q}_1)\mathbf{q}_1 - (\mathbf{a}_3 \cdot \mathbf{q}_2)\mathbf{q}_2$。$\mathbf{a}_3 \cdot \mathbf{q}_1 = \frac{1}{\sqrt{2}}$，$\mathbf{a}_3 \cdot \mathbf{q}_2 = \frac{1}{\sqrt{6}}$。代入计算得 $\mathbf{v}_3 = (-\frac{2}{3}, \frac{2}{3}, \frac{2}{3})^T$，归一化得 $\mathbf{q}_3 = \frac{1}{\sqrt{3}}(-1, 1, 1)^T$。

验证正交性：$\mathbf{q}_i \cdot \mathbf{q}_j = 0$（$i \neq j$），$\|\mathbf{q}_i\| = 1$，故 $Q^T Q = I$。整个过程体现了 Gram-Schmidt 的**逐列减去已有正交方向的投影**这一核心思想。
:::

### 第 3 题 概念推导

设 $A = \begin{bmatrix} 1 & 1 \\ 0 & 1 \\ 1 & 0 \end{bmatrix}$，$\mathbf{b} = \begin{bmatrix} 1 \\ 1 \\ 1 \end{bmatrix}$。用最小二乘法求 $\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}$，并验证残差 $\mathbf{e} = \mathbf{b} - A\hat{\mathbf{x}}$ 与 $A$ 的列空间正交（即 $A^T \mathbf{e} = \mathbf{0}$）。

::: details 参考答案
计算 $A^T A = \begin{bmatrix} 1 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix} \begin{bmatrix} 1 & 1 \\ 0 & 1 \\ 1 & 0 \end{bmatrix} = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$，$\det(A^T A) = 3$，$(A^T A)^{-1} = \frac{1}{3}\begin{bmatrix} 2 & -1 \\ -1 & 2 \end{bmatrix}$。

$A^T \mathbf{b} = \begin{bmatrix} 1 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix} \begin{bmatrix} 1 \\ 1 \\ 1 \end{bmatrix} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}$。

$\hat{\mathbf{x}} = \frac{1}{3}\begin{bmatrix} 2 & -1 \\ -1 & 2 \end{bmatrix} \begin{bmatrix} 2 \\ 2 \end{bmatrix} = \frac{1}{3}\begin{bmatrix} 2 \\ 2 \end{bmatrix} = \begin{bmatrix} 2/3 \\ 2/3 \end{bmatrix}$。

投影向量 $\mathbf{p} = A\hat{\mathbf{x}} = \begin{bmatrix} 1 & 1 \\ 0 & 1 \\ 1 & 0 \end{bmatrix} \begin{bmatrix} 2/3 \\ 2/3 \end{bmatrix} = \begin{bmatrix} 4/3 \\ 2/3 \\ 2/3 \end{bmatrix}$。

残差 $\mathbf{e} = \mathbf{b} - \mathbf{p} = \begin{bmatrix} 1 \\ 1 \\ 1 \end{bmatrix} - \begin{bmatrix} 4/3 \\ 2/3 \\ 2/3 \end{bmatrix} = \begin{bmatrix} -1/3 \\ 1/3 \\ 1/3 \end{bmatrix}$。

验证正交性：$A^T \mathbf{e} = \begin{bmatrix} 1 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix} \begin{bmatrix} -1/3 \\ 1/3 \\ 1/3 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}$。残差确实与 $A$ 的列空间正交，落在左零空间 $N(A^T)$ 中，印证最小二乘解的几何性质。
:::

## 常见错误

**错误 1 · 把正交矩阵与可逆矩阵混为一谈**

原因：正交矩阵 $Q$ 满足 $Q^T Q = I$，必然可逆且 $Q^{-1} = Q^T$。初学时容易反向推断**可逆矩阵都正交**，或在使用时忽视 $Q^{-1} = Q^T$ 这一额外性质，对正交矩阵仍显式求逆。实际上一般可逆矩阵的逆不等于其转置，正交性是远强于可逆性的条件。

解决：明确**正交矩阵 = 可逆 + 逆等于转置**这一双重条件。判定时检查 $Q^T Q = I$ 是否成立；使用时优先用 $Q^T$ 代替 $Q^{-1}$，既节省计算又保证数值稳定。

**错误 2 · 投影矩阵误用为非对称或非幂等**

原因：投影矩阵 $P = A(A^T A)^{-1} A^T$ 满足对称性与幂等性，是投影算子的充要条件。初学时容易把任意形如 $A A^T$ 或 $A(A^T A)^{-1}$ 的矩阵当作投影矩阵，忽视完整形式。$A A^T$ 一般不是投影矩阵（除非 $A$ 行正交），$A(A^T A)^{-1}$ 形状不符且不幂等。

解决：牢记投影矩阵的完整形式 $P = A(A^T A)^{-1} A^T$，并验证对称性与幂等性两条性质。若某矩阵 $M$ 不满足 $M^T = M$ 或 $M^2 = M$，则不是正交投影矩阵，不能套用投影的几何结论。

**错误 3 · Gram-Schmidt 正交化时减去投影的顺序错误**

原因：第 $k$ 步正交化应减去 $\mathbf{a}_k$ 在**所有已正交化方向** $\mathbf{q}_1, \ldots, \mathbf{q}_{k-1}$ 上的投影之和。初学时容易只减去最后一个方向，或减去原始向量 $\mathbf{a}_i$ 而非正交化后的 $\mathbf{q}_i$，导致结果不正交。

解决：严格按公式 $\mathbf{v}_k = \mathbf{a}_k - \sum_{i=1}^{k-1} (\mathbf{a}_k \cdot \mathbf{q}_i) \mathbf{q}_i$ 执行，每一步都减去在**所有已有 $\mathbf{q}_i$** 上的投影，且使用的是已正交归一化的 $\mathbf{q}_i$ 而非原始 $\mathbf{a}_i$。计算后验证 $\mathbf{v}_k$ 与所有 $\mathbf{q}_i$（$i < k$）的点积为零。

**错误 4 · 最小二乘法方程忽视条件数平方放大**

原因：法方程 $A^T A \hat{\mathbf{x}} = A^T \mathbf{b}$ 中 $A^T A$ 的条件数 $\kappa(A^T A) = \kappa(A)^2$。当 $A$ 本身条件数较大（如 $10^4$）时，$A^T A$ 的条件数高达 $10^8$，数值误差被严重放大，解的精度急剧下降。直接调用 `np.linalg.solve(A.T @ A, A.T @ b)` 在病态情形下可能给出错误结果。

解决：工程实现最小二乘时优先使用 QR 分解（解 $R\hat{\mathbf{x}} = Q^T \mathbf{b}$，条件数保持 $\kappa(A)$）或 SVD，避免显式构造 $A^T A$。NumPy 的 `np.linalg.lstsq` 内部默认使用 SVD 或 QR，比手动实现法方程稳定得多。仅在 $A$ 条件数较小且教学演示时使用法方程。
