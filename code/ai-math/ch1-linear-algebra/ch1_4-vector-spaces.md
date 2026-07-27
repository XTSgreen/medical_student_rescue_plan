---
title: 1.4 向量空间与四大子空间
sidebar:
  order: 4
---

# 1.4 向量空间与四大子空间

<span class="chapter-tag">第一章 · 线性代数</span>

前三节我们用**向量—矩阵—方程组**的语言解决了线性代数的基本计算问题。本节将完成一次重要的视角跃迁——从**具体的数表**上升到**抽象的空间**。我们将看到，矩阵 $A$ 是一个数表，也是连接两个向量空间的桥梁：它把输入空间 $\mathbb{R}^n$ 映射到输出空间 $\mathbb{R}^m$，并在两个空间中各自刻画出两个子空间——**列空间、零空间、行空间、左零空间**。这**四大基本子空间**构成了线性代数重要的结构图景，是理解最小二乘、SVD、PCA 等高级方法的核心。

## 1.4.1 从**几何平面**到**抽象空间**的跃迁

### 向量空间的严格公理化定义

到目前为止，我们把向量理解为**有方向的箭头或一列数**。但这种直觉在遇到多项式、函数、矩阵等对象时会失效：它们不是箭头，也不是一列数，却同样可以进行加法和数乘等运算。为了统一刻画这些对象，线性代数提出了**向量空间**（Vector Space）的公理化定义。

**向量空间** $V$ 是一个非空集合，其上定义了两种运算：加法 $+: V \times V \to V$ 和数乘 $\cdot: \mathbb{R} \times V \to V$，且满足以下**八条公理**（设 $\mathbf{u}, \mathbf{v}, \mathbf{w} \in V$，$c, d \in \mathbb{R}$）：

**加法公理（4 条）：**
1. **交换律**：$\mathbf{u} + \mathbf{v} = \mathbf{v} + \mathbf{u}$
2. **结合律**：$(\mathbf{u} + \mathbf{v}) + \mathbf{w} = \mathbf{u} + (\mathbf{v} + \mathbf{w})$
3. **加法单位元**：存在 $\mathbf{0} \in V$，使 $\mathbf{v} + \mathbf{0} = \mathbf{v}$
4. **加法逆元**：对每个 $\mathbf{v}$，存在 $-\mathbf{v}$，使 $\mathbf{v} + (-\mathbf{v}) = \mathbf{0}$

**数乘公理（4 条）：**

5. **数乘对向量加法的分配律**：$c(\mathbf{u} + \mathbf{v}) = c\mathbf{u} + c\mathbf{v}$
6. **数乘对实数加法的分配律**：$(c + d)\mathbf{v} = c\mathbf{v} + d\mathbf{v}$
7. **数乘结合律**：$c(d\mathbf{v}) = (cd)\mathbf{v}$
8. **数乘单位元**：$1 \cdot \mathbf{v} = \mathbf{v}$

这八条公理是向量空间的**最小完备条件**——任何满足这八条的对象都可以用线性代数的全部工具研究。这种**公理化思维**是现代数学的标志：不关心对象是什么，只关心对象能做什么。

### 常见的向量空间实例

公理化定义的威力在于，它可以涵盖不同的对象：

1. **欧氏空间 $\mathbb{R}^n$**：最常见的向量空间，元素是 $n$ 元实数组，加法和数乘按分量进行。
2. **多项式空间 $\mathcal{P}_n$**：所有次数不超过 $n$ 的实系数多项式构成的空间。$\mathcal{P}_2$ 中的元素形如 $a_0 + a_1 x + a_2 x^2$，加法是多项式相加，数乘是多项式数乘。
3. **矩阵空间 $\mathbb{R}^{m \times n}$**：所有 $m \times n$ 实矩阵构成的空间。加法是矩阵加法，数乘是矩阵数乘。
4. **函数空间**：定义在 $[a, b]$ 上的所有连续函数构成的空间 $C[a, b]$，加法是函数相加，数乘是函数数乘。这是无限维向量空间的典型例子。

这些空间的元素形态各异（数组、多项式、矩阵、函数），但都满足八条公理，因此都可以用线性代数的语言研究。

### 向量空间的十大基本性质

从八条公理可以推导出一系列常用性质，其中最重要的有：

1. **零元唯一**：若 $\mathbf{0}_1, \mathbf{0}_2$ 都是加法单位元，则 $\mathbf{0}_1 = \mathbf{0}_2$。
2. **负元唯一**：每个向量的负元是唯一的。
3. **$0 \cdot \mathbf{v} = \mathbf{0}$**：零数乘任何向量得零向量。
4. **$c \cdot \mathbf{0} = \mathbf{0}$**：任何数乘零向量得零向量。
5. **$(-1) \cdot \mathbf{v} = -\mathbf{v}$**：负一数乘得负元。
6. **若 $c\mathbf{v} = \mathbf{0}$，则 $c = 0$ 或 $\mathbf{v} = \mathbf{0}$**：这是消去律的向量版本。

这些性质的证明都需要从公理出发，是抽象代数训练的基础。

### 什么是子空间？

**子空间**（Subspace）是向量空间 $V$ 的一个**非空子集** $W$，且 $W$ 本身也是向量空间（继承 $V$ 的加法和数乘）。判断子空间不必验证全部八条公理，只需验证**三要素**：

**子空间三要素验证法**：
1. **非空**（通常验证包含零向量）：$\mathbf{0} \in W$
2. **加法封闭**：若 $\mathbf{u}, \mathbf{v} \in W$，则 $\mathbf{u} + \mathbf{v} \in W$
3. **数乘封闭**：若 $\mathbf{u} \in W$，$c \in \mathbb{R}$，则 $c\mathbf{u} \in W$

为什么只需这三条？因为其余公理（交换律、结合律等）在 $V$ 中已经成立，自然在子集 $W$ 中也成立——只要运算结果不**跑出** $W$。这正是**封闭性**的核心意义。

### 平凡子空间与真子空间

任何向量空间 $V$ 都有两个**平凡子空间**：
- **零空间** $\{\mathbf{0}\}$：只含零向量，维数为 0。
- **全空间** $V$ 自身。

既非 $\{\mathbf{0}\}$ 也非 $V$ 的子空间称为**真子空间**（Proper Subspace）。例如在 $\mathbb{R}^3$ 中，过原点的直线和平面都是真子空间。

### 子空间的几何直觉：必须穿过原点

子空间最关键的几何特征是**必须穿过原点**。这是因为子空间必须包含零向量（三要素之一）。因此有：

过原点的平面是 $\mathbb{R}^3$ 的子空间

不过原点的平面属于**仿射集**（将在 1.4.7 节看到它与子空间的关系），不属于子空间

过原点的直线是子空间

不过原点的直线**不是**子空间

这一几何直觉是理解四大子空间的基石：所有四大子空间都是过原点的。

```python
import numpy as np

# 验证子空间三要素：过原点的平面 z = 0 是 R^3 的子空间
# 任取两个向量 u, v 在平面上（即 z 分量为 0）
u = np.array([1, 2, 0])
v = np.array([3, -1, 0])

# 1. 包含零向量：零向量 [0,0,0] 在平面上
print(f"零向量在平面上: {0 == 0}")

# 2. 加法封闭：u + v 仍在平面上
print(f"u + v = {u + v}, z 分量 = {(u+v)[2]}")  # z=0

# 3. 数乘封闭：5u 仍在平面上
print(f"5u = {5*u}, z 分量 = {(5*u)[2]}")  # z=0

# 反例：不过原点的平面 z = 1 不是子空间
# u = [1, 2, 1] 在平面上，但 0*u = [0, 0, 0] 不在平面上（z=0 ≠ 1）
print(f"\n反例：z=1 平面上向量 [1,2,1] 数乘 0 得 {0*np.array([1,2,1])}，z 分量为 0 ≠ 1，不封闭")
```

### 交互演示：子空间三要素验证

下面的演示用 3D 场景直观展示**子空间必须过原点**这一核心特征。4 个预设按钮分别展示：

1. **过原点平面**（绿色，是子空间）：平面 $ax+by+cz=0$，三要素全部通过
2. **过原点直线**（绿色，是子空间）：直线方向向量 $\mathbf{v}$，过原点
3. **偏移平面**（红色，非子空间）：平面 $ax+by+cz=d$（$d \neq 0$），不过原点
4. **偏移直线**（红色，非子空间）：直线 $\mathbf{p} + t\mathbf{v}$（$\mathbf{p} \neq \mathbf{0}$），不过原点

**关键观察**：

- 绿色集合的**包含零向量**项显示通过，红色集合显示不通过
- 两个示例向量 $\mathbf{u}, \mathbf{v}$（黄色箭头）在集合内，其和 $\mathbf{u}+\mathbf{v}$（橙色箭头）——绿色集合中和仍在集合内（加法封闭），红色集合中和通常不在集合内
- 不过原点的集合是**仿射集**，是子空间的**平移**，将在 1.4.7 节与子空间建立联系

> **交互演示**：本节子空间三要素的动态验证已合并至下一节的 `SpanBasisDemo` 组件中，可滑动调节向量并观察张成空间是否过原点。

## 1.4.2 张成、线性无关与基 —— 空间的**骨架**

### 张成的正式定义

给定 $\mathbb{R}^n$ 中的一组向量 $S = \{\mathbf{v}_1, \mathbf{v}_2, \ldots, \mathbf{v}_k\}$，它们的**张成**（Span）定义为所有线性组合构成的集合：

$$
\text{span}(S) = \{c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \cdots + c_k \mathbf{v}_k : c_i \in \mathbb{R}\}
$$

张成是一个子空间——它包含零向量（所有 $c_i = 0$），且对加法和数乘封闭。事实上，$\text{span}(S)$ 是包含 $S$ 的**最小子空间**。

### 张成的几何意义

张成的几何形状取决于向量的个数和是否共线。**单个非零向量** $\mathbf{v}$ 张成一条过原点的直线（沿 $\mathbf{v}$ 方向）；**两个不共线向量** $\mathbf{v}_1, \mathbf{v}_2$ 张成一个过原点的平面；**三个不共面向量** $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$ 张成整个 $\mathbb{R}^3$。若两个向量共线，张成的仍是一条直线，因为第二个向量没**贡献**新方向。

张成的维度等于这组向量的**有效方向数**，即接下来定义的秩。

### 线性相关与线性无关

一组向量 $S = \{\mathbf{v}_1, \ldots, \mathbf{v}_k\}$ 称为**线性相关**（Linearly Dependent），如果存在不全为零的标量 $c_1, \ldots, c_k$，使得：

$$
c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + \cdots + c_k \mathbf{v}_k = \mathbf{0}
$$

否则称为**线性无关**（Linearly Independent）——即上式仅当所有 $c_i = 0$ 时才成立。

**几何直觉**：线性相关意味着至少有一个向量可以由其余向量线性表示——它没有**贡献新方向**。线性无关意味着每个向量都贡献独立的方向。

### 判定线性无关的实用方法

把向量作为列组成矩阵 $A = [\mathbf{v}_1 | \mathbf{v}_2 | \cdots | \mathbf{v}_k]$，则：

- 线性无关 $\Leftrightarrow \text{rank}(A) = k$（满列秩）
- 线性相关 $\Leftrightarrow \text{rank}(A) < k$

这是最实用的判定方法——只需做高斯消元数主元个数。

### 基的双重判定条件

**基**（Basis）是向量空间 $V$ 的一组向量 $\mathcal{B} = \{\mathbf{b}_1, \mathbf{b}_2, \ldots, \mathbf{b}_n\}$，满足两个条件：

1. **线性无关**：$\mathcal{B}$ 中的向量线性无关
2. **张成整个空间**：$\text{span}(\mathcal{B}) = V$

基是空间的**骨架**——既不冗余（线性无关），又足够（张成整个空间）。任何向量都可以**唯一地**表示为基的线性组合。

### 标准基与坐标向量

$\mathbb{R}^n$ 的**标准基**（Standard Basis）是 $\{\mathbf{e}_1, \mathbf{e}_2, \ldots, \mathbf{e}_n\}$，其中 $\mathbf{e}_i$ 是第 $i$ 个分量为 1、其余为 0 的向量。在标准基下，向量 $\mathbf{v} = (v_1, v_2, \ldots, v_n)^T$ 的**坐标**（Coordinates）就是它本身——$[\mathbf{v}]_{\mathcal{B}} = (v_1, v_2, \ldots, v_n)^T$。

但如果换一组基，同一个向量的坐标会改变。坐标的意义在于：它把**几何对象**翻译成**代数数对**，使我们能用数论、组合等工具研究几何问题。

### 维数的定义

向量空间 $V$ 的**维数**（Dimension）$\dim(V)$ 定义为基中向量的个数。如果 $V$ 有有限基，称为**有限维**（Finite-Dimensional）；否则称为**无限维**（Infinite-Dimensional）。

- $\dim(\mathbb{R}^n) = n$
- $\dim(\mathcal{P}_n) = n+1$（基为 $\{1, x, x^2, \ldots, x^n\}$）
- $\dim(\mathbb{R}^{m \times n}) = mn$（基为所有**只有一个元素为 1、其余为 0**的矩阵）
- $\dim(C[a, b]) = \infty$（无限维）

### 基的扩张定理与缩减定理

**扩张定理**（Extension Theorem）：向量空间 $V$ 中任意线性无关组都可以扩张成 $V$ 的一组基。即若 $\{\mathbf{v}_1, \ldots, \mathbf{v}_k\}$ 线性无关，则存在 $\mathbf{v}_{k+1}, \ldots, \mathbf{v}_n$ 使得 $\{\mathbf{v}_1, \ldots, \mathbf{v}_n\}$ 是 $V$ 的基。

**缩减定理**（Reduction Theorem）：向量空间 $V$ 中任意张成组都可以缩减成 $V$ 的一组基。即若 $\text{span}(S) = V$，则存在 $S$ 的子集 $S'$ 使得 $S'$ 是 $V$ 的基。

这两个定理保证了基的**存在性**——无论从哪个方向出发（从线性无关组扩张，或从张成组缩减），都能找到一组基。

### 维数的良定义性

一个自然的问题：同一空间的不同基，向量个数相同吗？答案是**相同**——这就是维数的**良定义性**。证明思路：若 $\mathcal{B}_1$ 有 $n$ 个向量，$\mathcal{B}_2$ 有 $m$ 个向量且 $m > n$，则 $\mathcal{B}_2$ 必线性相关（因为 $\mathcal{B}_1$ 张成整个空间，$\mathcal{B}_2$ 中向量都可由 $\mathcal{B}_1$ 表示，多于 $n$ 个就必然相关）。因此 $m \leq n$，对称地 $n \leq m$，故 $m = n$。

```python
import numpy as np
from sympy import Matrix

# 示例：判断三个向量是否构成 R^3 的基
v1 = np.array([1, 0, 0])
v2 = np.array([1, 1, 0])
v3 = np.array([1, 1, 1])

A = np.column_stack([v1, v2, v3])
print(f"矩阵 A =\n{A}")
print(f"行列式 = {np.linalg.det(A):.4f}")  # 1.0 ≠ 0
print(f"rank = {np.linalg.matrix_rank(A)}")  # 3

# rank = 3 = 向量个数 → 线性无关
# rank = 3 = dim(R^3) → 张成整个 R^3
# 因此 {v1, v2, v3} 是 R^3 的一组基

# 反例：三个共线向量
w1 = np.array([1, 2, 3])
w2 = np.array([2, 4, 6])  # = 2*w1
w3 = np.array([-1, -2, -3])  # = -w1

W = np.column_stack([w1, w2, w3])
print(f"\n共线向量组 rank = {np.linalg.matrix_rank(W)}")  # 1，线性相关
print(f"张成的子空间维数 = 1（直线）")
```

### 交互演示：张成、线性无关与基

下面的演示让你直接操作向量，观察张成的子空间如何变化。4 个预设按钮覆盖四种典型情形：

1. **单向量**：1 个向量张成一条过原点的直线（rank=1）
2. **两不共线向量**：2 个向量张成一个过原点的平面（rank=2，线性无关）
3. **三不共面向量**：3 个向量张成整个 $\mathbb{R}^3$（rank=3，构成基）
4. **共线向量**：2 个共线向量仍只张成直线（rank=1，线性相关）

**关键观察**：

- 启用向量数 ≠ rank（共线时启用 2 个但 rank=1）
- rank = 启用数 → 线性无关；rank < 启用数 → 线性相关
- rank = 3 → 构成 $\mathbb{R}^3$ 的基；rank < 3 → 只是真子空间
- 张成子空间用半透明几何体显示：直线（绿）、平面（黄）、整个空间（青色线框）

<ClientOnly>
<SpanBasisDemo title="张成、线性无关与基 · 空间的骨架" />
</ClientOnly>

## 1.4.3 列空间 —— 变换的**靶向范围**

### 列空间的严格定义

矩阵 $A \in \mathbb{R}^{m \times n}$ 的**列空间**（Column Space）$C(A)$ 定义为 $A$ 的所有列向量的张成：

$$
C(A) = \text{span}\{\mathbf{a}_1, \mathbf{a}_2, \ldots, \mathbf{a}_n\} = \{A\mathbf{x} : \mathbf{x} \in \mathbb{R}^n\}
$$

其中 $\mathbf{a}_j$ 是 $A$ 的第 $j$ 列。第二个等式表明，列空间就是**所有可能的输出 $A\mathbf{x}$**——这正是矩阵所代表线性变换的**像空间**（Image / Range）。

### 列空间的几何本质

列空间回答了一个核心问题：**矩阵 $A$ 能把向量送到哪里？** 答案是：只能送到 $C(A)$ 中。无论输入什么 $\mathbf{x}$，输出 $A\mathbf{x}$ 始终落在 $C(A)$ 内——这是列空间的本质。

列空间是 $\mathbb{R}^m$ 的子空间（注意：$m$ 是行数，不是列数）。因为 $A\mathbf{x} \in \mathbb{R}^m$，所有可能的 $A\mathbf{x}$ 构成 $\mathbb{R}^m$ 的子集，且这个子集满足子空间三要素。

### 列空间维数定理

**列空间维数定理**：$\dim(C(A)) = \text{rank}(A)$

这一结论的直觉是：列空间的基就是 $A$ 的**主元列**——线性无关的列向量。主元列的个数正是 rank。因此列空间的维数等于秩。

### 列空间的基：主元列

如何找列空间的基？做法是：

1. 对 $A$ 做高斯消元，得到 RREF
2. 找出主元所在的列（主元列）
3. **回到原矩阵 $A$**，取出对应位置的列——这些列就是 $C(A)$ 的基

注意：基向量应从**原矩阵**中取出。RREF 的主元列只是位置标记，真正的基向量来自原矩阵。

### 列空间与满射的关系

线性映射 $A: \mathbb{R}^n \to \mathbb{R}^m$ 是**满射**（Surjective，**onto**）当且仅当 $C(A) = \mathbb{R}^m$，即 $\text{rank}(A) = m$（行满秩）。满射意味着**每个输出都被达到**——$\mathbb{R}^m$ 中的每个向量都是某个 $\mathbf{x}$ 的像。

### 列空间在 Ax = b 中的核心地位

**相容性定理**：方程组 $A\mathbf{x} = \mathbf{b}$ 有解（相容）当且仅当 $\mathbf{b} \in C(A)$。

这一结论自然：$A\mathbf{x} = \mathbf{b}$ 有解 $\Leftrightarrow$ 存在 $\mathbf{x}$ 使 $A\mathbf{x} = \mathbf{b}$ $\Leftrightarrow$ $\mathbf{b}$ 是某些列的线性组合 $\Leftrightarrow$ $\mathbf{b} \in C(A)$。

这就是 1.3 节**克罗内克-卡佩利定理**的几何本质——$\text{rank}(A) = \text{rank}([A | \mathbf{b}])$ 等价于 $\mathbf{b} \in C(A)$。

### 列空间的几何投影

在 3D 空间中可视化列空间：

- **满秩 rank=3**：$C(A)$ 是整个 $\mathbb{R}^3$（任何 $\mathbf{b}$ 都有解）
- **rank=2**：$C(A)$ 是过原点的平面（$\mathbf{b}$ 必须落在此平面内才有解）
- **rank=1**：$C(A)$ 是过原点的直线（$\mathbf{b}$ 必须落在此直线上才有解）

当 $\mathbf{b} \notin C(A)$ 时，方程组无解。但我们可以求 $\mathbf{b}$ 在 $C(A)$ 上的**投影** $\mathbf{b}_{\text{proj}}$，使 $A\mathbf{x} \approx \mathbf{b}_{\text{proj}}$ ——这就是**最小二乘法**的核心思想，将在 1.5 节展开。

```python
import numpy as np

# 示例：3x3 矩阵的列空间
A = np.array([[1, 0, 1],
              [0, 1, 1],
              [0, 0, 0]])  # 第三行全零，rank=2

# rank = 2，列空间是 z=0 平面（前两列张成）
print(f"rank(A) = {np.linalg.matrix_rank(A)}")  # 2
print(f"列空间维数 = 2（z=0 平面）")

# b1 在列空间内（z=0）
b1 = np.array([2, 3, 0])
print(f"\nb1 = {b1}, 在 C(A) 中? rank([A|b1]) = {np.linalg.matrix_rank(np.column_stack([A, b1]))}")  # 2 = rank(A)

# b2 不在列空间内（z=1）
b2 = np.array([2, 3, 1])
print(f"b2 = {b2}, 在 C(A) 中? rank([A|b2]) = {np.linalg.matrix_rank(np.column_stack([A, b2]))}")  # 3 > rank(A)

# b2 在列空间上的投影 = 去掉 z 分量
b2_proj = np.array([2, 3, 0])
print(f"b2 在 C(A) 上的投影 = {b2_proj}（最小二乘解的右端）")
```

### 交互演示：列空间与方程可解性

下面的演示展示列空间 $C(A)$ 的几何形态，以及 $\mathbf{b}$ 是否在 $C(A)$ 中如何决定 $A\mathbf{x}=\mathbf{b}$ 的可解性。3 个预设按钮覆盖三种 rank 情形：

1. **满秩 rank=3**：列空间是整个 $\mathbb{R}^3$（青色线框立方体），任何 $\mathbf{b}$ 都有解
2. **秩 2**：列空间是过原点平面（黄色半透明），$\mathbf{b}$ 必须在平面内才有解
3. **秩 1**：列空间是过原点直线（橙色），$\mathbf{b}$ 必须在直线上才有解

**关键交互**：

- 拖动 $\mathbf{b}$ 向量的 3 个滑块，观察 $\mathbf{b}$ 是否落在 $C(A)$ 中
- $\mathbf{b} \notin C(A)$ 时，显示 $\mathbf{b}$ 在 $C(A)$ 上的投影（金色虚线 + 投影点小球）
- 实时显示 $\text{rank}(A)$、$\text{rank}([A|\mathbf{b}])$、判定结果、解的情况

> **交互演示**：列空间与零空间的联合演示见 1.4.4 节末尾 `ColumnNullSpaceDemo` 组件，可同时观察 $C(A)$ 与 $N(A)$ 的对称结构。

## 1.4.4 零空间 —— 变换的**压缩内核**

### 零空间的严格定义

矩阵 $A \in \mathbb{R}^{m \times n}$ 的**零空间**（Null Space）$N(A)$ 定义为所有被 $A$ 映射到零向量的输入：

$$
N(A) = \{\mathbf{x} \in \mathbb{R}^n : A\mathbf{x} = \mathbf{0}\}
$$

零空间也叫**核**（Kernel），记作 $\ker(A)$。

### 零空间的几何本质

零空间回答了另一个核心问题：**哪些输入被 $A$ 压缩为零？** 这些向量在变换中**消失**了——它们携带的信息在变换后无法恢复。

零空间是 $\mathbb{R}^n$ 的子空间（注意：$n$ 是列数，不是行数）。子空间三要素验证：

- $\mathbf{0} \in N(A)$（因为 $A\mathbf{0} = \mathbf{0}$，平凡解总是存在）
- 若 $\mathbf{x} \in N(A)$，则 $c\mathbf{x} \in N(A)$（因为 $A(c\mathbf{x}) = c(A\mathbf{x}) = c\mathbf{0} = \mathbf{0}$）
- 若 $\mathbf{x}, \mathbf{y} \in N(A)$，则 $\mathbf{x}+\mathbf{y} \in N(A)$（因为 $A(\mathbf{x}+\mathbf{y}) = A\mathbf{x}+A\mathbf{y} = \mathbf{0}$）

### 零空间维数定理

**零空间维数定理**（秩-零度定理）：$\dim(N(A)) = n - \text{rank}(A)$

$\dim(N(A))$ 称为**零度**（Nullity）。这一定理的几何含义是：输入空间 $\mathbb{R}^n$ 的 $n$ 维被分成两部分——$\text{rank}$ 维被 $A$ **保留**为非零像（列空间维度），$n - \text{rank}$ 维被 $A$ **压扁**为零（零空间维度）。

### 零空间的基：基础解系

如何找零空间的基？做法是：

1. 化 $A$ 为 RREF
2. 主元列对应主变量，非主元列对应自由变量
3. 对每个自由变量，令它取 1、其余自由变量取 0，回代求出主变量
4. 得到一个基础解向量；自由变量个数 = 基础解系向量个数 = 零度

这些基础解向量就是 $N(A)$ 的基。

### 零空间与单射的关系

线性映射 $A: \mathbb{R}^n \to \mathbb{R}^m$ 是**单射**（Injective，**one-to-one**）当且仅当 $N(A) = \{\mathbf{0}\}$，即 $\text{rank}(A) = n$（满列秩）。单射意味着**不同输入对应不同输出**——没有任何两个不同的输入被映射到同一输出，这等价于**没有任何非零输入被映射到零**。

### 零空间的几何可视化

在 3D 空间中可视化零空间（$n=3$）：

- **rank=3**（满秩）：$N(A) = \{\mathbf{0}\}$，零空间仅原点（0 维点）
- **rank=2**：$\dim(N(A)) = 1$，零空间是过原点的直线
- **rank=1**：$\dim(N(A)) = 2$，零空间是过原点的平面
- **rank=0**（零矩阵）：$\dim(N(A)) = 3$，零空间是整个 $\mathbb{R}^3$

### 零空间的压缩效应

零空间越大，意味着被压成零的向量越多——变换的**信息损失**越大。极端情况 $A = O$（零矩阵），所有向量都被压成零，$N(A) = \mathbb{R}^n$，信息完全丢失。

零空间与列空间形成对称：列空间描述**输出去哪里**，零空间描述**哪些输入消失**。两者共同刻画了线性变换的**行为画像**。

::: note 零空间的对称之美
列空间是 $\mathbb{R}^m$ 的子空间（输出空间），零空间是 $\mathbb{R}^n$ 的子空间（输入空间）。它们处于不同空间，却通过秩-零度定理紧密联系：$\dim(C(A)) + \dim(N(A)) = \text{rank}(A) + (n - \text{rank}(A)) = n$。这一对称性将在 1.4.7 节扩展为四大子空间的完整结构。
:::

<ClientOnly>
<ColumnNullSpaceDemo title="列空间与零空间 · 双视角映射" />
</ClientOnly>

## 1.4.5 行空间 —— 被忽视的**行视角**

### 行空间的严格定义

矩阵 $A \in \mathbb{R}^{m \times n}$ 的**行空间**（Row Space）$C(A^T)$ 定义为 $A$ 的所有行向量的张成，等价于 $A^T$ 的列空间：

$$
C(A^T) = \text{span}\{\mathbf{r}_1, \mathbf{r}_2, \ldots, \mathbf{r}_m\}
$$

其中 $\mathbf{r}_i$ 是 $A$ 的第 $i$ 行（作为行向量）。

### 行空间的几何本质

行空间是 $\mathbb{R}^n$ 的子空间（与零空间处于同一空间！）。这一点很重要——行空间和零空间都在输入空间 $\mathbb{R}^n$ 中，它们将共同分割 $\mathbb{R}^n$（见 1.4.7 节）。

行视角回答的问题是：**矩阵 $A$ 的行向量在输入空间中铺成了什么样的子空间？** 这一视角虽然不如列视角直观，但有着深刻的几何意义。

### 核心定理：行秩等于列秩

**行秩等于列秩定理**：$\dim(C(A^T)) = \dim(C(A)) = \text{rank}(A)$

这是线性代数重要的定理之一。它表明：**无论从行视角还是列视角看，矩阵承载的独立信息量是相同的**。行向量和列向量的**有效方向数**相等——尽管它们处于不同的空间（$\mathbb{R}^n$ vs $\mathbb{R}^m$）。

这一定理的证明思路：初等行变换不改变行空间（行向量间的线性关系不变），且不改变列空间的维度（线性相关的列仍线性相关）。化 $A$ 为 RREF 后，主元的个数既是行空间的维数（非零行数），也是列空间的维数（主元列数）——因此两者相等。

### 行空间的基：非零行

如何找行空间的基？做法是：

1. 对 $A$ 做高斯消元，得到 RREF
2. RREF 中的**非零行**就是行空间的一组基

注意：行空间的基可以直接从 RREF 读取（不需要回到原矩阵），因为初等行变换不改变行空间。这与列空间的基求法（必须回到原矩阵）形成对比。

### 行空间与列空间的对称性

行空间和列空间在求解 $A\mathbf{x} = \mathbf{b}$ 中有对称地位：

- $\mathbf{b} \in C(A)$：方程组有解（输出空间的约束）
- $\mathbf{x}$ 的**行空间分量**决定唯一解：若 $\mathbf{x} = \mathbf{x}_r + \mathbf{x}_n$（行空间分量 + 零空间分量），则 $A\mathbf{x} = A\mathbf{x}_r$（因为 $A\mathbf{x}_n = \mathbf{0}$）。因此方程组的**特解**可以取在行空间中，这是**最小范数解**的来源。

```python
import numpy as np
from sympy import Matrix

A = np.array([[1, 2, 3],
              [2, 4, 6],   # = 2 × 第一行
              [1, 1, 1]])

# 行空间：消元后非零行
M = Matrix(A)
rref, pivots = M.rref()
print(f"RREF:\n{rref}")
print(f"主元列: {pivots}")  # (0, 2)
print(f"rank = {len(pivots)}")  # 2

# 行空间的基 = RREF 的非零行
print(f"\n行空间基（RREF 非零行）:")
for i in range(len(pivots)):
    print(f"  r{i+1} = {list(rref.row(i))}")

# 列空间的基 = 原矩阵的主元列
print(f"\n列空间基（原矩阵主元列）:")
for c in pivots:
    print(f"  a{c+1} = {A[:, c]}")
```

## 1.4.6 左零空间 —— 行视角的**压缩内核**

### 左零空间的严格定义

矩阵 $A \in \mathbb{R}^{m \times n}$ 的**左零空间**（Left Null Space）$N(A^T)$ 定义为：

$$
N(A^T) = \{\mathbf{y} \in \mathbb{R}^m : A^T \mathbf{y} = \mathbf{0}\}
$$

等价地，$N(A^T)$ 是满足 $\mathbf{y}^T A = \mathbf{0}^T$ 的所有 $\mathbf{y}$——**左乘 $A$ 得零**的行向量，因此称为**左**零空间。

### 左零空间的几何本质

左零空间是 $\mathbb{R}^m$ 的子空间（与列空间处于同一空间！）。它描述的是：哪些**输出空间的向量**与 $A$ 的所有行向量都正交——或者说，$A$ 的行向量的何种线性组合会得到零。

左零空间是 $A^T$ 的零空间，因此其维数由秩-零度定理给出：

$$
\dim(N(A^T)) = m - \text{rank}(A)
$$

### 左零空间的基求法

如何找左零空间的基？做法是：

1. 构造增广矩阵 $[A | I_m]$（$I_m$ 是 $m \times m$ 单位矩阵）
2. 对其做初等行变换，把 $A$ 化为 RREF
3. RREF 中**零行**对应的 $I_m$ 部分，就是左零空间的基

或者更简单地：对 $A^T$ 求零空间基础解系。

### 左零空间与列空间的正交互补

左零空间与列空间处于同一空间 $\mathbb{R}^m$，且满足**正交补**关系（详见 1.4.7 节）：

- $N(A^T) \perp C(A)$：左零空间中的向量与列空间中的向量正交
- $\dim(N(A^T)) + \dim(C(A)) = (m - r) + r = m$：两者维度之和恰为 $m$，填满整个 $\mathbb{R}^m$

这一关系是**四大子空间结构图**的核心之一。

### 左零空间与相容性检验

左零空间中的向量 $\mathbf{y}$ 满足 $\mathbf{y}^T A = \mathbf{0}^T$，等价于 $\mathbf{y}^T A \mathbf{x} = 0$ 对所有 $\mathbf{x}$ 成立。因此 $\mathbf{y}^T \mathbf{b} = 0$ 是 $A\mathbf{x} = \mathbf{b}$ 有解的**必要条件**——这就是**约束**或**守恒律**的代数形式。

在工程中，左零空间常对应系统的**守恒量**或**约束方程**。例如电路中的基尔霍夫电流定律、力学中的力平衡，本质上都是某个矩阵的左零空间条件。

::: tip 左零空间的工程意义
左零空间的维数 $m - r$ 给出了矩阵 $A$ 的行向量之间的**独立约束个数**。在数据拟合中，左零空间揭示了**数据中哪些方向无法被模型解释**——这些方向就是残差必须落入的子空间，是理解最小二乘残差分析的关键。
:::

<ClientOnly>
<RowLeftNullDemo title="行空间与左零空间 · 对称视角联动" />
</ClientOnly>

## 1.4.7 四大子空间的结构关系 —— 正交性与维度关系

### 维度方程组：四大维数的统一公式

设 $A \in \mathbb{R}^{m \times n}$，$\text{rank}(A) = r$。四大子空间的维数满足：

| 子空间 | 符号 | 所在空间 | 维数 |
|--------|------|----------|------|
| 列空间 | $C(A)$ | $\mathbb{R}^m$ | $r$ |
| 零空间 | $N(A)$ | $\mathbb{R}^n$ | $n - r$ |
| 行空间 | $C(A^T)$ | $\mathbb{R}^n$ | $r$ |
| 左零空间 | $N(A^T)$ | $\mathbb{R}^m$ | $m - r$ |

这四个维数完全由 $m, n, r$ 三个参数决定。注意两个关键观察：

- **行空间与零空间都在 $\mathbb{R}^n$ 中**，维数和为 $r + (n-r) = n$
- **列空间与左零空间都在 $\mathbb{R}^m$ 中**，维数和为 $r + (m-r) = m$

这两个**维数和等于空间维数**的事实，暗示着更深层的几何关系——**正交互补**。

### 正交补的定义

子空间 $V$ 的**正交补**（Orthogonal Complement）$V^\perp$ 定义为：

$$
V^\perp = \{\mathbf{u} : \mathbf{u} \cdot \mathbf{v} = 0 \text{ 对所有 } \mathbf{v} \in V\}
$$

即 $V^\perp$ 是所有与 $V$ 中每个向量都正交的向量集合。正交补满足：

- $V^\perp$ 也是子空间
- $\dim(V) + \dim(V^\perp) = \dim(\text{全空间})$
- $(V^\perp)^\perp = V$
- $V \cap V^\perp = \{\mathbf{0}\}$

### 核心正交关系 1：行空间 ⊥ 零空间

**定理**：在 $\mathbb{R}^n$ 中，行空间 $C(A^T)$ 与零空间 $N(A)$ 互为正交补。

**证明**：设 $\mathbf{x}_r \in C(A^T)$（行空间），$\mathbf{x}_n \in N(A)$（零空间）。则 $\mathbf{x}_r$ 是 $A$ 的行向量的线性组合，即 $\mathbf{x}_r = A^T \mathbf{y}$（某个 $\mathbf{y}$）。于是：

$$
\mathbf{x}_r \cdot \mathbf{x}_n = (A^T \mathbf{y})^T \mathbf{x}_n = \mathbf{y}^T A \mathbf{x}_n = \mathbf{y}^T \mathbf{0} = 0
$$

因此 $\mathbf{x}_r \perp \mathbf{x}_n$。维度验证：$r + (n-r) = n$，恰好填满 $\mathbb{R}^n$。

**几何意义**：输入空间 $\mathbb{R}^n$ 被正交分割为两部分——行空间（被 $A$ **保留**为非零像的部分）和零空间（被 $A$ **压扁**为零的部分）。任意 $\mathbf{x} \in \mathbb{R}^n$ 可唯一分解为：

$$
\mathbf{x} = \mathbf{x}_r + \mathbf{x}_n, \quad \mathbf{x}_r \in C(A^T), \quad \mathbf{x}_n \in N(A), \quad \mathbf{x}_r \perp \mathbf{x}_n
$$

### 核心正交关系 2：列空间 ⊥ 左零空间

**定理**：在 $\mathbb{R}^m$ 中，列空间 $C(A)$ 与左零空间 $N(A^T)$ 互为正交补。

**证明**：设 $\mathbf{b}_c \in C(A)$（列空间），$\mathbf{y}_l \in N(A^T)$（左零空间）。则 $\mathbf{b}_c = A\mathbf{x}$（某个 $\mathbf{x}$），且 $A^T \mathbf{y}_l = \mathbf{0}$。于是：

$$
\mathbf{b}_c \cdot \mathbf{y}_l = (A\mathbf{x})^T \mathbf{y}_l = \mathbf{x}^T A^T \mathbf{y}_l = \mathbf{x}^T \mathbf{0} = 0
$$

因此 $\mathbf{b}_c \perp \mathbf{y}_l$。维度验证：$r + (m-r) = m$，恰好填满 $\mathbb{R}^m$。

**几何意义**：输出空间 $\mathbb{R}^m$ 被正交分割为两部分——列空间（**可达**的输出）和左零空间（**不可达**的方向）。任意 $\mathbf{b} \in \mathbb{R}^m$ 可唯一分解为：

$$
\mathbf{b} = \mathbf{b}_c + \mathbf{y}_l, \quad \mathbf{b}_c \in C(A), \quad \mathbf{y}_l \in N(A^T), \quad \mathbf{b}_c \perp \mathbf{y}_l
$$

### 正交分解的唯一性

正交分解的唯一性来自一个关键事实：**正交补的交集只有零向量**。若 $\mathbf{x}$ 同时在 $V$ 和 $V^\perp$ 中，则 $\mathbf{x} \perp \mathbf{x}$，即 $\|\mathbf{x}\|^2 = 0$，故 $\mathbf{x} = \mathbf{0}$。

这意味着分解 $\mathbf{x} = \mathbf{x}_r + \mathbf{x}_n$ 是**唯一**的——不存在第二种分解方式。这是最小二乘法、傅里叶级数、PCA 等众多方法的基础。

### 四大子空间在 Ax = b 中的统一几何图景

把四大子空间与 $A\mathbf{x} = \mathbf{b}$ 结合，得到完整的几何图景：

1. **输入侧**（$\mathbb{R}^n$）：$\mathbf{x} = \mathbf{x}_r + \mathbf{x}_n$
   - $\mathbf{x}_r \in C(A^T)$：行空间分量，决定输出
   - $\mathbf{x}_n \in N(A)$：零空间分量，被 $A$ 压成零
   - $A\mathbf{x} = A\mathbf{x}_r + A\mathbf{x}_n = A\mathbf{x}_r$（零空间分量**消失**）

2. **输出侧**（$\mathbb{R}^m$）：$\mathbf{b} = \mathbf{b}_c + \mathbf{y}_l$
   - $\mathbf{b}_c \in C(A)$：列空间分量，可被 $A$ 达到
   - $\mathbf{y}_l \in N(A^T)$：左零空间分量，不可被 $A$ 达到

3. **可解性**：$A\mathbf{x} = \mathbf{b}$ 有解 $\Leftrightarrow \mathbf{b}_c = \mathbf{b}$（即 $\mathbf{y}_l = \mathbf{0}$，$\mathbf{b}$ 完全在列空间中）

4. **解的唯一性**：若 $\mathbf{x}_p$ 是特解，则通解 $\mathbf{x} = \mathbf{x}_p + \mathbf{x}_n$（$\mathbf{x}_n \in N(A)$）。当 $N(A) = \{\mathbf{0}\}$（满列秩）时解唯一。

### 行空间与列空间的同构关系

虽然行空间 $C(A^T) \subseteq \mathbb{R}^n$ 和列空间 $C(A) \subseteq \mathbb{R}^m$ 处于不同空间，但它们通过矩阵 $A$ 建立了**同构**（Isomorphism）：

$$
A|_{C(A^T)} : C(A^T) \to C(A), \quad \mathbf{x}_r \mapsto A\mathbf{x}_r
$$

这一映射是**双射**（一一对应）——行空间的每个向量唯一对应列空间的一个向量，反之亦然。同构保持线性结构，因此行空间与列空间**代数上相同**——它们维数相等（都为 $r$），这正是**行秩 = 列秩**的几何本质。

### 左零空间与相容性检验

左零空间中的向量 $\mathbf{y}_l$ 满足 $\mathbf{y}_l^T A = \mathbf{0}^T$，因此 $\mathbf{y}_l^T \mathbf{b} = 0$ 是 $A\mathbf{x} = \mathbf{b}$ 有解的**必要条件**。这给出了**相容性检验**的另一种形式：

**$A\mathbf{x} = \mathbf{b}$ 有解 $\Leftrightarrow$ 对所有 $\mathbf{y}_l \in N(A^T)$，$\mathbf{y}_l^T \mathbf{b} = 0$**

在工程中，左零空间的基向量给出了系统的**守恒律**——这些是任何解都必须满足的约束。例如：

- 电路中基尔霍夫电流定律：电流代数和为零
- 力学中力平衡：合力为零
- 流体力学中连续性方程：质量守恒

这些都是**矩阵的左零空间条件**的具体表现。

```python
import numpy as np
from sympy import Matrix

# 完整示例：四大子空间
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])  # 知名矩阵，rank=2

m, n = A.shape
r = np.linalg.matrix_rank(A)
print(f"A 是 {m}×{n} 矩阵，rank = {r}")
print(f"\n四大子空间维数：")
print(f"  列空间 C(A)   ⊂ R-{m}, 维数 = {r}")
print(f"  零空间 N(A)   ⊂ R-{n}, 维数 = {n - r}")
print(f"  行空间 C(A^T) ⊂ R-{n}, 维数 = {r}")
print(f"  左零空间 N(A^T) ⊂ R-{m}, 维数 = {m - r}")

# 验证正交关系
M = Matrix(A)
rref, pivots = M.rref()

# 行空间基 = RREF 非零行
row_basis = [list(rref.row(i)) for i in range(r)]
print(f"\n行空间基（RREF 非零行）: {row_basis}")

# 零空间基
null_basis = M.nullspace()
print(f"零空间基: {[list(v.T) for v in null_basis]}")

# 验证行空间 ⊥ 零空间
if null_basis:
    for i, rb in enumerate(row_basis):
        for j, nb in enumerate(null_basis):
            dot = sum(a*b for a, b in zip(rb, list(nb)))
            print(f"  行空间基{i} · 零空间基{j} = {float(dot):.6f}（应为 0）")

# 列空间基 = 原矩阵主元列
col_basis = [A[:, c].tolist() for c in pivots]
print(f"\n列空间基（原矩阵主元列）: {col_basis}")

# 左零空间基 = A^T 的零空间
left_null_basis = M.T.nullspace()
print(f"左零空间基: {[list(v.T) for v in left_null_basis]}")
```

### 交互演示：四大子空间终极展示

下面的演示把四大子空间的完整结构**同时可视化**——左侧 3D 场景是输入空间 $\mathbb{R}^n$（$n=3$），右侧 3D 场景是输出空间 $\mathbb{R}^m$（$m=3$），中间用矩阵 $A$ 的标签表示映射关系。

**3 个预设按钮**（点击观察维度变化）：

1. **满秩 r=3**：行空间=整个 $\mathbb{R}^3$，零空间=原点；列空间=整个 $\mathbb{R}^3$，左零空间=原点
2. **秩 r=2**：行空间=绿色平面，零空间=红色直线（左场景）；列空间=蓝色平面，左零空间=橙色直线（右场景）
3. **秩 r=1**：行空间=绿色直线，零空间=红色平面（左场景）；列空间=蓝色直线，左零空间=橙色平面（右场景）

**关键观察**：

- **左场景（$\mathbb{R}^n$）**：绿色行空间与红色零空间正交，且维数和 $= n = 3$（填满整个空间）
- **右场景（$\mathbb{R}^m$）**：蓝色列空间与橙色左零空间正交，且维数和 $= m = 3$（填满整个空间）
- 中间矩阵 $A$ 的标签提示：$\mathbf{x} \in \mathbb{R}^n \xrightarrow{A} A\mathbf{x} \in \mathbb{R}^m$
- 底部表格实时显示四大子空间的维数、所在空间、正交补关系
- 验证维度方程：$r + (n-r) = n$，$r + (m-r) = m$

<ClientOnly>
<FourSubspacesTheoremDemo title="四大子空间定理 · 正交分解与投影演示" />
</ClientOnly>

---

## 本章小结

本节完成了从**具体数表**到**抽象空间**的跃迁，建立了线性代数的核心结构图景：

1. **向量空间**用八条公理定义，涵盖 $\mathbb{R}^n$、多项式、矩阵、函数等不同对象
2. **子空间**必须过原点，三要素验证（含零、加法封闭、数乘封闭）
3. **基**是空间的**骨架**——线性无关且张成整个空间，基的个数即维数
4. **四大子空间**：
   - 列空间 $C(A) \subseteq \mathbb{R}^m$：变换的**靶向范围**，维数 $= r$
   - 零空间 $N(A) \subseteq \mathbb{R}^n$：变换的**压缩内核**，维数 $= n - r$
   - 行空间 $C(A^T) \subseteq \mathbb{R}^n$：行视角的张成，维数 $= r$
   - 左零空间 $N(A^T) \subseteq \mathbb{R}^m$：行视角的压缩核，维数 $= m - r$
5. **两大正交补关系**：
   - 行空间 $\perp$ 零空间（在 $\mathbb{R}^n$ 中）
   - 列空间 $\perp$ 左零空间（在 $\mathbb{R}^m$ 中）
6. **行秩 = 列秩**：行空间与列空间维数相等（$= r$），通过矩阵 $A$ 建立同构

这一结构图景是后续章节的基础：1.5 节将用正交投影求解最小二乘问题，1.6 节将用特征值刻画矩阵的**本质方向**，1.7 节的 SVD 是四大子空间的核心应用——它把任意矩阵分解为**在行空间找正交基 + 在列空间找正交基 + 中间用奇异值连接**的形式。
