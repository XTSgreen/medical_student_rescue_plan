---
title: 1.7 奇异值分解
sidebar:
  order: 7
---

# 1.7 奇异值分解

上一节我们建立了特征分解 $A = PDP^{-1}$，把**变换的固有方向**转化为可计算的代数工具——找到矩阵自身的**固有坐标系**，让变换在该坐标系下退化为纯缩放。但特征分解有两大无法回避的局限：**仅适用于方阵**（非方阵无特征值定义）和**仅适用于可对角化矩阵**（缺陷矩阵特征向量不足）。这两条限制让特征分解在工程实际中常常受限——数据矩阵几乎都是非方阵，且数值扰动下**可对角化**也是脆弱假设。

本节将引入**奇异值分解**（Singular Value Decomposition, SVD）——把特征分解从方阵推广到任意 $m \times n$ 矩阵，给出 $A = U\Sigma V^T$ 这一**线性代数的最终答案**。SVD 的核心哲学是**旋转 → 缩放 → 旋转**三步：任意线性变换都可分解为右乘一个正交矩阵（输入空间的旋转/反射）、再乘一个对角矩阵（沿主轴各向异性缩放）、最后左乘一个正交矩阵（输出空间的旋转/反射）。这一步骤既保留了特征分解的几何直觉，又摆脱了**方阵与可对角化**的双重束缚。

本节将沿**动机 → 定义 → 几何直觉 → 代数构造 → 四大子空间统一 → 低秩逼近 → 伪逆 → 全局图景**这条主线，把 SVD 从抽象定义转化为可计算的代数工具，并铺设通往 PCA、推荐系统、图像压缩、潜在语义分析等机器学习核心应用的桥梁。

## 1.7.1 动机：为什么需要 SVD？（超越特征分解）

### 从特征分解到 SVD：突破方阵束缚

在 1.6 节中，特征分解 $A = PDP^{-1}$ 把方阵 $A \in \mathbb{R}^{n \times n}$ 拆解为**特征基变换 → 各方向独立缩放 → 反变换**三步。这一分解的优雅之处在于：它揭示了变换的**固有坐标系**——在该坐标系下，变换退化为最简的纯缩放。但工程实际中，我们遇到的矩阵绝大多数不是方阵：

- 数据矩阵 $X \in \mathbb{R}^{n \times d}$：$n$ 个样本、$d$ 个特征（如 1000 个病人 × 50 个临床指标）。
- 图像矩阵 $I \in \mathbb{R}^{H \times W}$：高 $H$、宽 $W$（如 $512 \times 512$ 像素的医学影像）。
- 评分矩阵 $R \in \mathbb{R}^{u \times m}$：$u$ 个用户、$m$ 部电影（如 100 万用户 × 1 万部电影）。
- 词-文档矩阵 $T \in \mathbb{R}^{v \times d}$：$v$ 个词汇、$d$ 篇文档（如 5 万词 × 1 万文档）。

这些矩阵都不是方阵，特征分解无法直接应用。我们需要一种**超越方阵**的分解工具——这就是 SVD。

### 特征分解的两大局限

**局限 1：仅适用于方阵**。特征值的定义 $A\mathbf{v} = \lambda\mathbf{v}$ 要求 $A\mathbf{v}$ 与 $\mathbf{v}$ 同维，故 $A$ 必须是方阵。对 $m \times n$ 矩阵（$m \neq n$），$A\mathbf{v}$ 的维度由 $m$ 决定，而 $\mathbf{v}$ 的维度由 $n$ 决定，两者不匹配，**特征向量**概念根本无法定义。

**局限 2：仅适用于可对角化矩阵**。即便 $A$ 是方阵，若它缺陷（GM < AM），无法拼出完整的特征基，$A$ 不可对角化（详见 1.6.4 节）。Jordan 标准形虽是**最接近对角化**的替代，但计算复杂且数值不稳定。更麻烦的是：实矩阵可能有复特征值（如旋转矩阵），需要在 $\mathbb{C}$ 上讨论，丢失了实数运算的简洁性。

这两大局限让特征分解在工程中难以胜任——尤其在数据科学中，矩阵非方、噪声扰动让**可对角化**假设脆弱。SVD 正是为解决这两大局限而提出。

### SVD 的核心结论：任意矩阵都可分解

**奇异值分解定理**：设 $A \in \mathbb{R}^{m \times n}$（任意矩阵，方或非方、可对角化或不可对角化），则 $A$ 必可分解为：

$$
A = U\Sigma V^T
$$

其中 $U \in \mathbb{R}^{m \times m}$ 和 $V \in \mathbb{R}^{n \times n}$ 都是正交矩阵（$U^T U = I_m$, $V^T V = I_n$），$\Sigma \in \mathbb{R}^{m \times n}$ 是**对角**矩阵（除主对角线外全零，主对角线上是非负实数 $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$）。

注意三点突破：

1. **任意矩阵**：$A$ 不必方阵、不必可对角化、不必实对称——SVD 对一切 $m \times n$ 矩阵都成立。
2. **正交矩阵**：$U, V$ 是正交矩阵（不是一般的可逆矩阵），数值稳定性极高。
3. **实对角**：$\Sigma$ 的对角元是非负实数（不是复数），与 1.6 节特征值可能为复数形成鲜明对比。

### SVD 的核心哲学：旋转 → 缩放 → 旋转

把 $A\mathbf{x} = U\Sigma V^T \mathbf{x}$ 从右向左解读，可得到 SVD 的几何意义：

1. **$V^T \mathbf{x}$**：在输入空间 $\mathbb{R}^n$ 中对 $\mathbf{x}$ 做正交变换（旋转或反射），把 $\mathbf{x}$ 对齐到右奇异向量方向。
2. **$\Sigma (V^T \mathbf{x})$**：沿主轴做各向异性缩放——第 $i$ 个分量乘 $\sigma_i$，并把结果嵌入到 $\mathbb{R}^m$ 中（前 $\min(m,n)$ 维保留，多余维度补零）。
3. **$U(\Sigma V^T \mathbf{x})$**：在输出空间 $\mathbb{R}^m$ 中再做一次正交变换，把缩放后的向量对齐到左奇异向量方向。

这一步骤揭示：**任意线性变换本质上是旋转 → 沿主轴缩放 → 旋转**，而非 1.6 节特征分解那种**沿斜轴缩放**。区别在于：特征分解的**斜轴**是同一空间内的特征方向（要求方阵）；SVD 的**主轴**是输入空间和输出空间**两套独立**的正交方向，故能处理任意 $m \times n$ 矩阵。

### SVD 的数值稳定性：远优于 $A^T A$ 特征分解

SVD 的另一大优势是**数值稳定性**。一个朴素想法是：对非方阵 $A$，可以构造方阵 $A^T A$ 或 $AA^T$，再用 1.6 节的特征分解。但这一做法有重要缺陷——条件数平方放大：

$$
\kappa(A^T A) = \kappa(A)^2
$$

若 $A$ 的条件数为 $10^4$（中等病态），$A^T A$ 的条件数高达 $10^8$（严重病态），数值误差被严重放大。直接用 `numpy.linalg.svd` 算 SVD 则避免了这一平方放大，条件数保持为 $\kappa(A)$——这是工程实现 SVD 的标准做法。

### 与 1.5 节正交性的呼应

SVD 的 $U$ 和 $V$ 都是正交矩阵，意味着 SVD 把任意矩阵的**扭曲操作**拆解为两次**刚性旋转**（正交变换）和一次**对角缩放**。这与 1.5 节**标准正交基是黄金坐标系**的论断呼应：SVD 实质上是为输入空间和输出空间各选了一组**标准正交基**，让变换在这两组基下退化为最简的对角形式。1.5.4 节中**标准正交基让投影退化为简单点积**的简化，在 SVD 这里推广为**标准正交基让任意矩阵退化为对角矩阵**。

::: key-idea SVD 是线性代数的最终答案
特征分解回答了**方阵的固有方向是什么**，但受限于方阵和可对角化两大假设。SVD 通过 $A = U\Sigma V^T$ 把这一回答推广到任意 $m \times n$ 矩阵：任何线性变换都是**旋转 → 缩放 → 旋转**三步组合。SVD 不仅统一了特征分解（方阵情形）、正交对角化（实对称情形）、QR 分解（列满秩情形），还为四大子空间、低秩逼近、伪逆、PCA 等核心工具提供了统一框架——这就是 SVD 被称为**线性代数的最终答案**的原因。
:::

```python
import numpy as np

# SVD 的第一个例子：非方阵 3x2
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)
print(f"A (3x2) =\n{A}")

# 用 numpy.linalg.svd 分解
# full_matrices=True (默认): U 是 m×m, Σ 是 m×n (作为对角矩阵), V^T 是 n×n
U, s, Vt = np.linalg.svd(A, full_matrices=True)
print(f"\nU (3x3 正交) =\n{U}")
print(f"\n奇异值 s = {s}")
print(f"V^T (2x2 正交) =\n{Vt}")

# numpy 返回的是奇异值向量 s，需要构造 Σ 矩阵
m, n = A.shape
Sigma = np.zeros((m, n))
Sigma[:n, :n] = np.diag(s)
print(f"\nΣ (3x2 对角) =\n{Sigma}")

# 验证 A = U Σ V^T
A_reconstructed = U @ Sigma @ Vt
print(f"\nU Σ V^T =\n{A_reconstructed}")
print(f"A == UΣV^T? {np.allclose(A, A_reconstructed)}")

# 验证 U 和 V 是正交矩阵
print(f"\nU^T U =\n{U.T @ U}")  # 应为单位阵
print(f"U^T U == I? {np.allclose(U.T @ U, np.eye(m))}")
print(f"V^T V =\n{Vt @ Vt.T}")  # 应为单位阵（V = Vt.T）
print(f"V^T V == I? {np.allclose(Vt @ Vt.T, np.eye(n))}")

# 几何解读：A 把 2D 向量映射到 3D
# σ1, σ2 是两个主方向的缩放倍数
# V^T 在 2D 内旋转，U 在 3D 内旋转/反射
print(f"\n几何意义:")
print(f"  1) V^T (2x2) 在输入空间 R^2 内旋转")
print(f"  2) Σ (3x2) 沿主轴缩放（σ1={s[0]:.4f}, σ2={s[1]:.4f}）并嵌入 R^3")
print(f"  3) U (3x3) 在输出空间 R^3 内旋转/反射")
```

```python
import numpy as np

# 对比：特征分解无法应用于非方阵
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)

try:
    eigvals = np.linalg.eigvals(A)
    print(f"特征值: {eigvals}")
except np.linalg.LinAlgError as e:
    print(f"特征分解失败: {e}")
# 应报错：last 2 dimensions of the array must be square

# 替代方案 1：对 A^T A 做特征分解（条件数平方放大）
ATA = A.T @ A
eigvals_ATA, V = np.linalg.eigh(ATA)  # A^T A 是 2x2 实对称矩阵
print(f"\nA^T A =\n{ATA}")
print(f"A^T A 的特征值: {eigvals_ATA}")
print(f"奇异值 = √特征值: {np.sqrt(eigvals_ATA)}")

# 验证：与 SVD 给出的奇异值一致
U_svd, s_svd, Vt_svd = np.linalg.svd(A)
print(f"\nSVD 直接给出的奇异值: {s_svd}")
print(f"两者一致? {np.allclose(np.sort(s_svd), np.sort(np.sqrt(eigvals_ATA)))}")

# 条件数对比
print(f"\n条件数 κ(A) = max(σ)/min(σ) = {s_svd[0]/s_svd[1]:.4f}")
print(f"条件数 κ(A^T A) = κ(A)^2 = {(s_svd[0]/s_svd[1])**2:.4f}")
print(f"→ A^T A 的条件数是 A 的平方，数值误差被严重放大")
print(f"→ 这就是工程中应直接用 svd 而非 eig(A^T A) 的根本原因")
```

<ClientOnly>
<SVDGeometryMaster title="SVD 几何意义演示：单位圆变换为椭球；旋转-缩放-旋转分步动画" />
</ClientOnly>

## 1.7.2 SVD 的数学定义与矩阵形式

### 标准分解式

承接 1.7.1 的动机，本节给出 SVD 的严格数学定义。设 $A \in \mathbb{R}^{m \times n}$，则 $A$ 的奇异值分解为：

$$
A = U\Sigma V^T
$$

其中：

- $U \in \mathbb{R}^{m \times m}$ 是正交矩阵，$U^T U = I_m$，其列向量 $\mathbf{u}_1, \ldots, \mathbf{u}_m$ 称为**左奇异向量**（Left Singular Vectors）。
- $V \in \mathbb{R}^{n \times n}$ 是正交矩阵，$V^T V = I_n$，其列向量 $\mathbf{v}_1, \ldots, \mathbf{v}_n$ 称为**右奇异向量**（Right Singular Vectors）。
- $\Sigma \in \mathbb{R}^{m \times n}$ 是**对角**矩阵，除主对角线外全零，主对角线上的非负实数 $\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_p \geq 0$（$p = \min(m, n)$）称为**奇异值**（Singular Values）。

对复数域 $\mathbb{C}$，公式变为 $A = U\Sigma V^*$（$V^*$ 是共轭转置）。本节聚焦实数情形，复数情形仅需把 $^T$ 替换为 $^*$。

### 维度标注：m × n 矩阵的**经济**分解

设 $r = \text{rank}(A) \leq \min(m, n)$。则奇异值满足：

$$
\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_r > 0, \quad \sigma_{r+1} = \cdots = \sigma_p = 0
$$

非零奇异值恰有 $r$ 个，等于矩阵的秩。这一性质让 SVD 成为**最稳健的秩判据**——后面会看到，数值上判断**奇异值多小算零**比判断**$A^T A$ 特征值多小算零**可靠得多。

### 瘦 SVD（Thin SVD）：m ≫ n 时的经济形式

当 $m \gg n$（数据科学中极常见，如 1000 个样本 × 50 个特征），完整 SVD 给出的 $U \in \mathbb{R}^{m \times m}$ 体量庞大——但其中只有前 $n$ 列（对应非零奇异值的左奇异向量）真正参与 $A = U\Sigma V^T$ 的重构，后 $m - n$ 列只是**补全**用。瘦 SVD 仅保留前 $\min(m, n)$ 列：

$$
A = U_r \Sigma_r V_r^T
$$

其中 $U_r \in \mathbb{R}^{m \times r}$（前 $r$ 列左奇异向量），$\Sigma_r \in \mathbb{R}^{r \times r}$（非零奇异值对角阵），$V_r \in \mathbb{R}^{n \times r}$（前 $r$ 列右奇异向量）。瘦 SVD 节省存储，是工程实现的标准形式。

### 截断 SVD（Truncated SVD）：取前 k 个最大奇异值

截断 SVD 进一步压缩——只保留前 $k$ 个最大奇异值（$k \leq r$）：

$$
A_k = U_k \Sigma_k V_k^T
$$

其中 $U_k \in \mathbb{R}^{m \times k}$，$\Sigma_k \in \mathbb{R}^{k \times k}$，$V_k \in \mathbb{R}^{n \times k}$。$A_k$ 是秩 $k$ 矩阵，是 $A$ 的**低秩逼近**——1.7.6 节将证明它是所有秩 $\leq k$ 矩阵中最接近 $A$ 的。截断 SVD 是图像压缩、数据降噪、推荐系统的核心工具。

### 几何意义的代数表达

把 $A\mathbf{x} = U\Sigma V^T \mathbf{x}$ 从右向左拆解：

$$
A\mathbf{x} = U\big(\Sigma\big(V^T\mathbf{x}\big)\big)
$$

具体三步：

1. **第一步（输入空间旋转）**：$\mathbf{y} = V^T\mathbf{x}$，在 $\mathbb{R}^n$ 内对 $\mathbf{x}$ 做正交变换。
2. **第二步（沿主轴缩放 + 维度变换）**：$\mathbf{z} = \Sigma\mathbf{y}$，把 $\mathbb{R}^n$ 中向量沿主轴各向异性缩放（第 $i$ 维乘 $\sigma_i$），并嵌入到 $\mathbb{R}^m$ 中。
3. **第三步（输出空间旋转）**：$\mathbf{w} = U\mathbf{z}$，在 $\mathbb{R}^m$ 内做正交变换，对齐到左奇异向量方向。

最终效果：$\mathbf{x} \in \mathbb{R}^n \mapsto \mathbf{w} \in \mathbb{R}^m$。SVD 把这一**扭曲**操作拆解为两次纯旋转 + 一次纯缩放，几何意义清晰。

### 完整 SVD vs 瘦 SVD 的工程取舍

完整 SVD 给出方阵 $U, V$（正交矩阵，满足 $U^T U = U U^T = I$），可以完整描述 $\mathbb{R}^m$ 和 $\mathbb{R}^n$ 的所有方向——包括 $A$ 的**零空间方向**和**左零空间方向**。瘦 SVD 仅保留**有用**的前 $\min(m, n)$ 列，节省存储但失去了对零空间的描述。

::: note 完整 SVD vs 瘦 SVD 的工程取舍
完整 SVD 的 $U$ 和 $V$ 是方阵正交矩阵，其列向量分别构成 $\mathbb{R}^m$ 和 $\mathbb{R}^n$ 的标准正交基——这让我们能完整描述 $A$ 的四大子空间（详见 1.7.5 节）。瘦 SVD 仅保留前 $\min(m, n)$ 列，存储更小但只能描述**行空间 + 列空间**，无法描述零空间和左零空间。工程中通常用瘦 SVD 做数据压缩（仅需非零奇异值），用完整 SVD 做理论分析（需要四大子空间完整结构）。NumPy 的 `np.linalg.svd(A, full_matrices=False)` 默认给出瘦 SVD，更省内存。
:::

```python
import numpy as np

# 完整 SVD vs 瘦 SVD
A = np.array([[1, 2],
              [3, 4],
              [5, 6],
              [7, 8]], dtype=float)  # 4x2，m=4, n=2
print(f"A (4x2) =\n{A}")

# 完整 SVD: U 是 4x4, s 是长度 2, V^T 是 2x2
U_full, s, Vt_full = np.linalg.svd(A, full_matrices=True)
print(f"\n[完整 SVD] U 形状: {U_full.shape}, s 形状: {s.shape}, V^T 形状: {Vt_full.shape}")

# 瘦 SVD: U 是 4x2, s 是长度 2, V^T 是 2x2
U_thin, s_thin, Vt_thin = np.linalg.svd(A, full_matrices=False)
print(f"\n[瘦 SVD]   U 形状: {U_thin.shape}, s 形状: {s_thin.shape}, V^T 形状: {Vt_thin.shape}")

# 奇异值应相同
print(f"\n奇异值（完整）: {s}")
print(f"奇异值（瘦）: {s_thin}")
print(f"两者一致? {np.allclose(s, s_thin)}")

# 验证正交性
print(f"\n[完整] U^T U = I? {np.allclose(U_full.T @ U_full, np.eye(4))}")
print(f"[完整] U U^T = I? {np.allclose(U_full @ U_full.T, np.eye(4))}")
print(f"[瘦]   U^T U = I? {np.allclose(U_thin.T @ U_thin, np.eye(2))}")
print(f"[瘦]   U U^T = I? {np.allclose(U_thin @ U_thin.T, np.eye(4))}")  # False! 瘦 U 不是方阵

# 关键区别：瘦 U 的 U^T U = I（列正交），但 U U^T ≠ I（行不正交）
# 因为 U U^T 是 4x4 矩阵，秩最多 2，不可能等于 I_4
print(f"\n[瘦] U U^T =\n{U_thin @ U_thin.T}")
print(f"  → 这是投影到列空间的投影矩阵（秩 2），不是 I_4")

# 重构 A
Sigma_full = np.zeros((4, 2))
Sigma_full[:2, :2] = np.diag(s)
Sigma_thin = np.diag(s_thin)

A_full = U_full @ Sigma_full @ Vt_full
A_thin = U_thin @ Sigma_thin @ Vt_thin
print(f"\n[完整] A 重构误差: {np.linalg.norm(A - A_full):.2e}")
print(f"[瘦]   A 重构误差: {np.linalg.norm(A - A_thin):.2e}")
print(f"→ 两种形式重构结果一致，瘦 SVD 更省内存")
```

```python
import numpy as np

# SVD 的几何意义：分步可视化（数值验证）
A = np.array([[3, 0],
              [0, 1],
              [0, 0]], dtype=float)  # 3x2，简单对角形式便于理解
print(f"A (3x2) =\n{A}")

U, s, Vt = np.linalg.svd(A, full_matrices=True)
print(f"奇异值: {s}")  # [3, 1]
print(f"V^T =\n{Vt}")  # 应近似 I（因为 A 已经对角）
print(f"U =\n{U}")  # 应近似 [[1,0,0],[0,1,0],[0,0,1]]

# 取一个输入向量
x = np.array([1, 1], dtype=float)
print(f"\n输入向量 x = {x}")

# 第一步：V^T x（输入空间旋转）
y = Vt @ x
print(f"第一步 y = V^T x = {y}")
print(f"  几何含义: 在 R^2 内对齐到右奇异向量方向")

# 第二步：Σ y（沿主轴缩放 + 嵌入 R^3）
Sigma = np.zeros((3, 2))
Sigma[:2, :2] = np.diag(s)
z = Sigma @ y
print(f"第二步 z = Σ y = {z}")
print(f"  几何含义: 第 1 维 × σ1={s[0]}, 第 2 维 × σ2={s[1]}, 嵌入 R^3")

# 第三步：U z（输出空间旋转）
w = U @ z
print(f"第三步 w = U z = {w}")
print(f"  几何含义: 在 R^3 内对齐到左奇异向量方向")

# 直接验证
Ax = A @ x
print(f"\n直接 A x = {Ax}")
print(f"三步合成 w = {w}")
print(f"两者一致? {np.allclose(w, Ax)}")
```

## 1.7.3 奇异值与左右奇异向量的几何直觉

### 几何意义：从输入到输出的完整旅程

承接 1.7.2 的代数定义，本节深入 SVD 的几何直觉。设 $A \in \mathbb{R}^{m \times n}$，$A = U\Sigma V^T$，则 $A$ 的作用可拆解为：

**第一步：$V^T \mathbf{x}$ —— 输入空间的对齐**

$V^T$ 是 $n \times n$ 正交矩阵，作用在 $\mathbf{x} \in \mathbb{R}^n$ 上是纯旋转或反射（保持长度和角度）。其效果是**对齐**——把 $\mathbf{x}$ 的各个分量重新组合，使得在新的坐标系（右奇异向量基 $\{\mathbf{v}_1, \ldots, \mathbf{v}_n\}$）下，$\mathbf{x}$ 的坐标变得**规整**。

具体地，$V^T \mathbf{x}$ 的第 $i$ 分量是 $\mathbf{v}_i^T \mathbf{x}$——即 $\mathbf{x}$ 在右奇异向量 $\mathbf{v}_i$ 方向上的投影系数。

**第二步：$\Sigma (V^T \mathbf{x})$ —— 沿主轴各向异性缩放**

$\Sigma$ 是 $m \times n$ 对角矩阵，作用是把第一步结果的第 $i$ 分量乘 $\sigma_i$（若 $i \leq \min(m, n)$），并把结果嵌入到 $\mathbb{R}^m$ 中（多余维度补零）。

效果是**各向异性缩放**：每个方向独立地被 $\sigma_i$ 倍放大或压缩。$\sigma_i$ 大的方向被显著拉伸，$\sigma_i$ 小的方向被压缩，$\sigma_i = 0$ 的方向被完全压扁。

**第三步：$U(\Sigma V^T \mathbf{x})$ —— 输出空间的对齐**

$U$ 是 $m \times m$ 正交矩阵，作用是把缩放后的向量再次旋转/反射，对齐到左奇异向量方向。最终结果 $A\mathbf{x} = U\Sigma V^T \mathbf{x}$ 是 $\mathbb{R}^m$ 中的向量。

### 最终几何效果：单位球面 → 超椭球

把 $\mathbb{R}^n$ 中的单位球面 $S^{n-1} = \{\mathbf{x} \in \mathbb{R}^n : \|\mathbf{x}\| = 1\}$ 上的所有向量用 $A$ 变换，得到的像集 $\{A\mathbf{x} : \|\mathbf{x}\| = 1\}$ 是 $\mathbb{R}^m$ 中的**超椭球**（Hyperellipsoid）。

这一结论的证明：

1. $V^T$ 把单位球面映射为自身（正交变换保持长度）。
2. $\Sigma$ 把单位球面映射为椭球——沿第 $i$ 轴拉伸 $\sigma_i$ 倍（若 $\sigma_i > 0$）或压扁为零（若 $\sigma_i = 0$）。
3. $U$ 把椭球旋转/反射到新方向（保持椭球形状，只改变方向）。

故 $A$ 把单位球面映射为椭球，椭球的形状由 $\Sigma$ 决定，方向由 $U$ 决定。

### 超椭球的轴方向与轴半长度

超椭球的几何性质由 $U$ 和 $\Sigma$ 共同决定：

- **轴方向**：椭球的第 $i$ 个主轴方向由 $U$ 的第 $i$ 列 $\mathbf{u}_i$（左奇异向量）给出。
- **轴半长度**：椭球的第 $i$ 个主轴长度由 $\sigma_i$（奇异值）给出。

具体地，若 $\text{rank}(A) = r$，则 $A$ 把单位球面映射为 $r$ 维椭球（退化椭球），其前 $r$ 个主轴方向为 $\mathbf{u}_1, \ldots, \mathbf{u}_r$，对应主轴半长度为 $\sigma_1, \ldots, \sigma_r$。

### 奇异值的几何直觉：变换的**主方向放大倍数**

奇异值 $\sigma_i$ 的几何意义：变换 $A$ 在第 $i$ 个**主方向**上的放大倍数。

- $\sigma_1$ 是最大放大倍数——对应 $\|A\|_2$（谱范数），即 $A$ 能把任意单位向量放大的最大长度。
- $\sigma_r$ 是最小非零放大倍数——$\sigma_r / \sigma_1$ 的倒数是条件数 $\kappa(A)$。
- $\sigma_i = 0$ 表示该方向被完全压扁（落入零空间）。

### 奇异值 vs 特征值的几何差异

| 性质 | 特征值 $\lambda$ | 奇异值 $\sigma$ |
|------|----------------|----------------|
| 适用矩阵 | 仅方阵 | 任意 $m \times n$ 矩阵 |
| 取值范围 | 可正可负、可为复数 | 非负实数 $\sigma \geq 0$ |
| 几何意义 | 沿特征方向缩放倍数 | 沿主方向放大倍数 |
| 几何效果 | **沿斜轴缩放** | **旋转 → 缩放 → 旋转** |
| 排序约定 | 通常不排序 | 按降序 $\sigma_1 \geq \sigma_2 \geq \cdots$ |
| 与变换关系 | $A\mathbf{v} = \lambda\mathbf{v}$ | $A\mathbf{v}_i = \sigma_i \mathbf{u}_i$ |

注意 SVD 的核心方程 $A\mathbf{v}_i = \sigma_i \mathbf{u}_i$：右奇异向量 $\mathbf{v}_i$ 经 $A$ 变换后，变为左奇异向量 $\mathbf{u}_i$ 方向上的向量，长度放大 $\sigma_i$ 倍。这是 SVD 的**本质方程**，比特征方程 $A\mathbf{v} = \lambda\mathbf{v}$ 更具普适性——它不要求 $\mathbf{v}$ 与 $A\mathbf{v}$ 同方向，只要求它们之间的**放大倍数**明确。

::: tip 奇异值 vs 特征值的几何差异
特征值 $\lambda$ 描述**沿同一方向**的缩放（$\mathbf{v}$ 与 $A\mathbf{v}$ 共线），故可能为负（反向缩放）或复数（旋转 + 缩放）。奇异值 $\sigma$ 描述**从一个方向到另一个方向**的放大（$\mathbf{v}_i \mapsto \mathbf{u}_i$），方向变换已由 $U, V$ 单独处理，故 $\sigma$ 只需表示**长度放大倍数**，必为非负。这一**方向与缩放解耦**的设计是 SVD 比特征分解更通用的根源——它把**旋转**和**缩放**分离，让两者各自独立处理。
:::

```python
import numpy as np

# 单位球面 → 椭球：二维到三维的变换
# A 把 2D 单位圆映射为 3D 中的椭球（实际是 2D 椭圆嵌在 3D 中）
A = np.array([[2, 1],
              [1, 3],
              [1, 1]], dtype=float)  # 3x2
print(f"A (3x2) =\n{A}")

U, s, Vt = np.linalg.svd(A, full_matrices=False)
print(f"\n奇异值 σ = {s}")
print(f"左奇异向量 U (列):\n{U}")
print(f"右奇异向量 V (列):\n{Vt.T}")

# 生成 2D 单位圆上的点
theta = np.linspace(0, 2 * np.pi, 100)
unit_circle = np.vstack([np.cos(theta), np.sin(theta)])  # 2x100
print(f"\n单位圆点数: {unit_circle.shape}")

# 用 A 变换：得到 3D 中的椭球
ellipsoid = A @ unit_circle  # 3x100
print(f"变换后形状: {ellipsoid.shape}")

# 验证主轴长度 = σ_i
# 椭圆的长轴方向 = u_1, 长度 = σ_1
# 椭圆的短轴方向 = u_2, 长度 = σ_2
print(f"\n几何验证:")
print(f"  长轴方向 u_1 = {U[:, 0]}")
print(f"  长轴半长度 σ_1 = {s[0]:.4f}")
print(f"  σ_1 * u_1 = {s[0] * U[:, 0]}")

# 验证 A @ v_1 = σ_1 * u_1（SVD 核心方程）
v1 = Vt[0, :]  # 右奇异向量 v_1
print(f"\n  v_1 = {v1}")
print(f"  A @ v_1 = {A @ v1}")
print(f"  σ_1 * u_1 = {s[0] * U[:, 0]}")
print(f"  两者一致? {np.allclose(A @ v1, s[0] * U[:, 0])}")

# 验证 v_2
v2 = Vt[1, :]
print(f"\n  v_2 = {v2}")
print(f"  A @ v_2 = {A @ v2}")
print(f"  σ_2 * u_2 = {s[1] * U[:, 1]}")
print(f"  两者一致? {np.allclose(A @ v2, s[1] * U[:, 1])}")

# 关键观察：A v_1 沿 u_1 方向，长度为 σ_1
#          A v_2 沿 u_2 方向，长度为 σ_2
# 这就是 SVD 的几何本质：旋转 → 缩放 → 旋转
```

```python
import numpy as np

# 奇异值 = 谱范数 = 最大放大倍数
np.random.seed(42)
A = np.random.randn(4, 3) * 2
print(f"A (4x3) =\n{A}")

U, s, Vt = np.linalg.svd(A, full_matrices=False)
print(f"\n奇异值: {s}")

# 谱范数 = 最大奇异值
spectral_norm = np.linalg.norm(A, ord=2)
print(f"\n谱范数 ||A||_2 = {spectral_norm:.6f}")
print(f"最大奇异值 σ_1 = {s[0]:.6f}")
print(f"两者一致? {np.isclose(spectral_norm, s[0])}")

# 验证：σ_1 是 A 对单位向量的最大放大倍数
# 即 ||A x|| / ||x|| 的最大值，在 x = v_1 时取到
v1 = Vt[0, :]
print(f"\nv_1 = {v1}")
print(f"||v_1|| = {np.linalg.norm(v1):.6f}")
print(f"||A v_1|| = {np.linalg.norm(A @ v1):.6f}")
print(f"放大倍数 ||A v_1|| / ||v_1|| = {np.linalg.norm(A @ v1) / np.linalg.norm(v1):.6f}")
print(f"应等于 σ_1 = {s[0]:.6f}")

# 数值验证：随机采样 10000 个单位向量，找最大放大倍数
np.random.seed(0)
max_ratio = 0
best_x = None
for _ in range(10000):
    x = np.random.randn(3)
    x = x / np.linalg.norm(x)  # 归一化为单位向量
    ratio = np.linalg.norm(A @ x)
    if ratio > max_ratio:
        max_ratio = ratio
        best_x = x

print(f"\n随机搜索最大放大倍数: {max_ratio:.6f}")
print(f"σ_1 = {s[0]:.6f}")
print(f"随机找到的最佳方向: {best_x}")
print(f"v_1 (理论最优): {v1}")
print(f"两者方向相近? {np.allclose(np.abs(best_x), np.abs(v1), atol=0.05)}")

# Frobenius 范数 = 所有奇异值平方和的平方根
fro_norm = np.linalg.norm(A, 'fro')
sigma_fro = np.sqrt(np.sum(s**2))
print(f"\nFrobenius 范数 ||A||_F = {fro_norm:.6f}")
print(f"√(Σσ²) = {sigma_fro:.6f}")
print(f"两者一致? {np.isclose(fro_norm, sigma_fro)}")
print(f"几何含义: Frobenius 范数 = 椭球各轴长度的"勾股和"")
```

## 1.7.4 SVD 的代数构造：从 $A^T A$ 和 $AA^T$ 出发

### 构造思路：把非方阵问题化为方阵问题

承接 1.7.3 的几何直觉，本节给出 SVD 的代数构造。SVD 的**构造**思路是：虽然 $A$ 本身不是方阵，但 $A^T A \in \mathbb{R}^{n \times n}$ 和 $AA^T \in \mathbb{R}^{m \times m}$ 都是方阵——而且都是实对称半正定矩阵！这两个矩阵的特征分解可分别给出 $V$ 和 $U$。

### 构造 $V$：$A^T A$ 的标准正交特征向量

由 $A^T A$ 是 $n \times n$ 实对称矩阵，由谱定理（1.6.6 节）可正交对角化：

$$
A^T A = V \Lambda V^T
$$

其中 $V$ 是 $n \times n$ 正交矩阵（$V^T V = I_n$），$\Lambda = \text{diag}(\lambda_1, \ldots, \lambda_n)$ 是 $A^T A$ 的特征值（非负实数，因 $A^T A$ 半正定）。**$V$ 就是 SVD 中的右奇异向量矩阵**。

### 构造 $U$：$AA^T$ 的标准正交特征向量

同理，$AA^T$ 是 $m \times m$ 实对称矩阵，可正交对角化：

$$
AA^T = U \tilde{\Lambda} U^T
$$

其中 $U$ 是 $m \times m$ 正交矩阵（$U^T U = I_m$），$\tilde{\Lambda}$ 是 $AA^T$ 的特征值。**$U$ 就是 SVD 中的左奇异向量矩阵**。

### 构造 $\Sigma$：$\sigma_i = \sqrt{\lambda_i}$

关键观察：$A^T A$ 和 $AA^T$ 的非零特征值**完全相同**。证明：

若 $A^T A \mathbf{v} = \lambda \mathbf{v}$（$\lambda \neq 0$），则 $A(A^T A \mathbf{v}) = \lambda A \mathbf{v}$，即 $AA^T (A\mathbf{v}) = \lambda (A\mathbf{v})$。故 $\lambda$ 也是 $AA^T$ 的特征值（对应特征向量 $A\mathbf{v}$）。对称地，$AA^T$ 的非零特征值也是 $A^T A$ 的特征值。

定义**奇异值**为：

$$
\sigma_i = \sqrt{\lambda_i}
$$

其中 $\lambda_i$ 是 $A^T A$（也是 $AA^T$）的非零特征值。这就是 $\Sigma$ 矩阵的对角元。

### 奇异值非负性的证明

为什么奇异值非负？因为 $A^T A$ 半正定：

$$
\mathbf{v}^T (A^T A) \mathbf{v} = (A\mathbf{v})^T (A\mathbf{v}) = \|A\mathbf{v}\|^2 \geq 0
$$

故 $A^T A$ 的所有特征值 $\lambda_i \geq 0$，从而 $\sigma_i = \sqrt{\lambda_i} \geq 0$。这与 1.6 节特征值可正可负、可为复数形成鲜明对比——奇异值的非负性是 SVD 数值稳定性的根源之一。

### 奇异值的排序约定

SVD 约定奇异值按降序排列：

$$
\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_r > 0, \quad \sigma_{r+1} = \cdots = \sigma_p = 0
$$

其中 $r = \text{rank}(A)$，$p = \min(m, n)$。这一排序让**重要方向**（大奇异值）在前，**次要方向**（小奇异值）在后，是低秩逼近（1.7.6 节）的基础。

### 秩判定：非零奇异值个数 = 矩阵秩

**定理**：$\text{rank}(A) = $ 非零奇异值的个数。

证明思路：$\text{rank}(A) = \text{rank}(A^T A)$（这一等式在 1.4 节已建立），而 $A^T A$ 的非零特征值个数 = $\text{rank}(A^T A) = \text{rank}(A)$。故非零奇异值个数 = $\text{rank}(A)$。

这一性质让 SVD 成为**最稳健的秩判据**——数值上，判断**奇异值小于多少阈值算零**比判断**$A^T A$ 特征值小于多少阈值算零**可靠得多（前者条件数为 $\kappa(A)$，后者为 $\kappa(A)^2$）。

### 关键等式：$A^T A$ 与 $AA^T$ 的 SVD 表达

由 $A = U\Sigma V^T$，可推出：

$$
A^T A = (U\Sigma V^T)^T (U\Sigma V^T) = V \Sigma^T U^T U \Sigma V^T = V \Sigma^T \Sigma V^T
$$

由于 $U^T U = I$ 且 $\Sigma^T \Sigma$ 是对角矩阵（对角元为 $\sigma_i^2$），故：

$$
A^T A = V \Sigma^T \Sigma V^T
$$

这正是 $A^T A$ 的正交对角化形式，对角元为 $\sigma_i^2 = \lambda_i$。同理：

$$
AA^T = U \Sigma \Sigma^T U^T
$$

这两条等式是 SVD 与特征分解之间的**桥梁**——SVD 的 $U, V$ 分别是 $AA^T, A^T A$ 的特征向量矩阵，$\Sigma$ 的对角元是 $\sqrt{A^T A}$ 的特征值。

### $A\mathbf{v}_i = \sigma_i \mathbf{u}_i$：SVD 的本质方程

由 $A^T A \mathbf{v}_i = \sigma_i^2 \mathbf{v}_i$，两边乘以 $A$：

$$
AA^T (A\mathbf{v}_i) = \sigma_i^2 (A\mathbf{v}_i)
$$

故 $A\mathbf{v}_i$ 是 $AA^T$ 的特征向量（对应特征值 $\sigma_i^2$），方向与 $\mathbf{u}_i$ 一致。归一化后：

$$
A\mathbf{v}_i = \sigma_i \mathbf{u}_i
$$

这是 SVD 的核心方程——右奇异向量 $\mathbf{v}_i$ 经 $A$ 变换后变为左奇异向量 $\mathbf{u}_i$ 方向上的向量，长度放大 $\sigma_i$ 倍。$\sigma_i = 0$ 时 $A\mathbf{v}_i = \mathbf{0}$（$\mathbf{v}_i$ 落入零空间）。

::: warning 数值稳定性的关键：不要直接计算 $A^T A$ 来求 SVD
本节给出的**通过 $A^T A$ 特征分解求 SVD**是**理论构造**，不是**工程实现**。原因：构造 $A^T A$ 会让条件数平方放大（$\kappa(A^T A) = \kappa(A)^2$），原本在 $A$ 中可分辨的小奇异值在 $A^T A$ 中被压缩为不可分辨的小特征值，数值精度大幅下降。正确做法是直接用 `numpy.linalg.svd`，它内部采用分治法或 Jacobi 旋转法，避免显式构造 $A^T A$，条件数保持为 $\kappa(A)$。这一区别在 $A$ 接近秩亏损时（最小奇异值接近零）尤为关键——直接 SVD 能正确识别小奇异值，$A^T A$ 特征分解则可能将其误判为零。
:::

```python
import numpy as np

# 手动构造 SVD：通过 A^T A 的特征分解
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)  # 3x2
print(f"A (3x2) =\n{A}")

# 第一步：计算 A^T A（2x2 实对称半正定）
ATA = A.T @ A
print(f"\nA^T A =\n{ATA}")

# 第二步：对 A^T A 做特征分解（实对称矩阵用 eigh）
eigvals, V = np.linalg.eigh(ATA)
print(f"\nA^T A 的特征值: {eigvals}")
print(f"V (特征向量) =\n{V}")

# 第三步：奇异值 σ_i = √λ_i（按降序排列）
# eigh 返回升序，需要翻转
idx = np.argsort(eigvals)[::-1]
eigvals = eigvals[idx]
V = V[:, idx]
sigma = np.sqrt(np.maximum(eigvals, 0))  # 防止数值误差导致负数
print(f"\n排序后特征值: {eigvals}")
print(f"奇异值 σ = √λ: {sigma}")
print(f"V (排序后) =\n{V}")

# 第四步：构造 U
# 由 A v_i = σ_i u_i，得 u_i = A v_i / σ_i
m, n = A.shape
r = np.sum(sigma > 1e-10)  # 非零奇异值个数 = 秩
print(f"\n非零奇异值个数 r = {r} (即 rank(A))")

U_manual = np.zeros((m, n))  # 仅构造前 n 列（瘦 SVD）
for i in range(r):
    U_manual[:, i] = A @ V[:, i] / sigma[i]
print(f"\n手动构造的 U (前 {r} 列):\n{U_manual}")

# 验证 A = U Σ V^T
Sigma = np.zeros((m, n))
Sigma[:n, :n] = np.diag(sigma)
A_reconstructed = U_manual @ Sigma @ V.T
print(f"\n手动重构 A = U Σ V^T =\n{A_reconstructed}")
print(f"原 A =\n{A}")
print(f"两者一致? {np.allclose(A, A_reconstructed)}")

# 与 numpy.linalg.svd 对比
U_np, s_np, Vt_np = np.linalg.svd(A, full_matrices=False)
print(f"\n[numpy] 奇异值: {s_np}")
print(f"[手动] 奇异值: {sigma}")
print(f"奇异值一致? {np.allclose(s_np, sigma)}")
```

```python
import numpy as np

# 验证关键等式：A^T A = V Σ² V^T 和 AA^T = U Σ² U^T
np.random.seed(42)
A = np.random.randn(4, 3)
print(f"A (4x3) =\n{A}")

U, s, Vt = np.linalg.svd(A, full_matrices=True)
print(f"\n奇异值: {s}")

# 验证 A^T A = V Σ² V^T
ATA = A.T @ A
Sigma_sq = np.zeros((3, 3))
Sigma_sq[:3, :3] = np.diag(s**2)
ATA_reconstructed = Vt.T @ Sigma_sq @ Vt
print(f"\nA^T A =\n{ATA}")
print(f"V Σ² V^T =\n{ATA_reconstructed}")
print(f"两者一致? {np.allclose(ATA, ATA_reconstructed)}")

# 验证 AA^T = U Σ² U^T
AAT = A @ A.T
Sigma_sq_big = np.zeros((4, 4))
Sigma_sq_big[:3, :3] = np.diag(s**2)
AAT_reconstructed = U @ Sigma_sq_big @ U.T
print(f"\nAA^T =\n{AAT}")
print(f"U Σ² U^T =\n{AAT_reconstructed}")
print(f"两者一致? {np.allclose(AAT, AAT_reconstructed)}")

# 验证 A v_i = σ_i u_i（SVD 核心方程）
V = Vt.T
print(f"\nSVD 核心方程验证:")
for i in range(3):
    Av = A @ V[:, i]
    sigma_u = s[i] * U[:, i]
    print(f"  i={i+1}: A v_{i+1} = {Av}")
    print(f"        σ_{i+1} u_{i+1} = {sigma_u}")
    print(f"        一致? {np.allclose(Av, sigma_u)}")

# 秩判定：非零奇异值个数
print(f"\n秩判定:")
print(f"  非零奇异值个数: {np.sum(s > 1e-10)}")
print(f"  numpy.linalg.matrix_rank(A): {np.linalg.matrix_rank(A)}")
print(f"  两者一致? {np.sum(s > 1e-10) == np.linalg.matrix_rank(A)}")
```

## 1.7.5 四大基本子空间的彻底统一（核心）

### SVD 揭示四大子空间的标准正交基

承接 1.7.4 的代数构造，本节揭示 SVD 最深刻的几何意义——它统一了 1.4 节的四大基本子空间。设 $A \in \mathbb{R}^{m \times n}$，$\text{rank}(A) = r$，其完整 SVD 为 $A = U\Sigma V^T$。则 $U$ 和 $V$ 的列向量分别给出 $A$ 的四大子空间的标准正交基：

**输入空间 $\mathbb{R}^n$ 的分解**（$V$ 的列向量）：

- $V$ 的前 $r$ 列 $\mathbf{v}_1, \ldots, \mathbf{v}_r$：张成**行空间** $C(A^T)$。
- $V$ 的后 $n - r$ 列 $\mathbf{v}_{r+1}, \ldots, \mathbf{v}_n$：张成**零空间** $N(A)$。

**输出空间 $\mathbb{R}^m$ 的分解**（$U$ 的列向量）：

- $U$ 的前 $r$ 列 $\mathbf{u}_1, \ldots, \mathbf{u}_r$：张成**列空间** $C(A)$。
- $U$ 的后 $m - r$ 列 $\mathbf{u}_{r+1}, \ldots, \mathbf{u}_m$：张成**左零空间** $N(A^T)$。

### 证明：前 r 列右奇异向量张成行空间

由 $A^T A = V\Sigma^T \Sigma V^T$（1.7.4 节关键等式），$V$ 的列是 $A^T A$ 的特征向量。对前 $r$ 列（$\sigma_i > 0$）：

$$
A^T A \mathbf{v}_i = \sigma_i^2 \mathbf{v}_i \quad (i = 1, \ldots, r)
$$

即 $\mathbf{v}_i$ 是 $A^T A$ 的非零特征向量。由 $A^T A \mathbf{v}_i = A^T(A\mathbf{v}_i)$，故 $\mathbf{v}_i = \frac{1}{\sigma_i^2} A^T (A\mathbf{v}_i)$，即 $\mathbf{v}_i$ 是 $A^T$ 的列的线性组合——$\mathbf{v}_i \in C(A^T)$（行空间）。故 $\text{span}\{\mathbf{v}_1, \ldots, \mathbf{v}_r\} \subseteq C(A^T)$。

又因 $\dim C(A^T) = r$ 且 $\mathbf{v}_1, \ldots, \mathbf{v}_r$ 线性无关（正交），故 $\text{span}\{\mathbf{v}_1, \ldots, \mathbf{v}_r\} = C(A^T)$。

### 证明：后 n-r 列右奇异向量张成零空间

对后 $n - r$ 列（$\sigma_i = 0$）：

$$
A^T A \mathbf{v}_i = 0 \cdot \mathbf{v}_i = \mathbf{0} \quad (i = r+1, \ldots, n)
$$

即 $\mathbf{v}_i^T A^T A \mathbf{v}_i = 0$，等价于 $\|A\mathbf{v}_i\|^2 = 0$，故 $A\mathbf{v}_i = \mathbf{0}$——$\mathbf{v}_i \in N(A)$（零空间）。同理可证 $\text{span}\{\mathbf{v}_{r+1}, \ldots, \mathbf{v}_n\} = N(A)$。

类似地，$U$ 的前 $r$ 列张成列空间 $C(A)$，后 $m - r$ 列张成左零空间 $N(A^T)$。

### 映射关系的几何绑定

SVD 不仅给出四大子空间的标准正交基，还揭示了它们之间的**映射关系**：

**关键映射 1：行空间 → 列空间（等距映射）**

$$
A \mathbf{v}_i = \sigma_i \mathbf{u}_i \quad (i = 1, \ldots, r)
$$

行空间中的向量 $\mathbf{v}_i$ 经 $A$ 变换后，变为列空间中的向量 $\sigma_i \mathbf{u}_i$。这一映射是**双射**——行空间和列空间一一对应，且映射关系由奇异值 $\sigma_i$ 标量化。

**关键映射 2：零空间 → 原点（压扁）**

$$
A \mathbf{v}_i = \mathbf{0} \quad (i = r+1, \ldots, n)
$$

零空间中的向量经 $A$ 变换后全部变为零——被**压扁**到原点。这是 1.4 节**零空间 = 被 $A$ 压扁的方向**的几何精确化。

### SVD 的子空间正交性

由于 $V$ 是正交矩阵，$V$ 的所有列向量两两正交：

$$
\mathbf{v}_i^T \mathbf{v}_j = \delta_{ij}
$$

特别地：

- 行空间基 $\{\mathbf{v}_1, \ldots, \mathbf{v}_r\}$ 与零空间基 $\{\mathbf{v}_{r+1}, \ldots, \mathbf{v}_n\}$ 相互正交。
- 同理，列空间基 $\{\mathbf{u}_1, \ldots, \mathbf{u}_r\}$ 与左零空间基 $\{\mathbf{u}_{r+1}, \ldots, \mathbf{u}_m\}$ 相互正交。

这正是 1.5 节**行空间 $\perp$ 零空间**、**列空间 $\perp$ 左零空间**的体现——SVD 把这两对正交补直接写成了 $V$ 和 $U$ 的列分块。

### 维度定理的验证

由 SVD 给出的子空间基，可立即验证 1.4 节的维度定理：

- $\dim C(A^T) + \dim N(A) = r + (n - r) = n$
- $\dim C(A) + \dim N(A^T) = r + (m - r) = m$

SVD 不仅验证了维度定理，还给出了**具体的基**——四大子空间的标准正交基。这一**基的显式构造**让原本抽象的维度定理变得可计算。

### SVD 的子空间统一图景

把上述观察整合为一张统一图景：

```
输入空间 R^n                       输出空间 R^m
┌──────────────────┐              ┌──────────────────┐
│  行空间 C(A^T)    │              │  列空间 C(A)      │
│  维数 r            │              │  维数 r            │
│  基: v_1,...,v_r   │   A 映射     │  基: u_1,...,u_r   │
│  (V 的前 r 列)     │  ───────→   │  (U 的前 r 列)     │
│                  │  A v_i = σ_i u_i│                  │
├──────────────────┤              ├──────────────────┤
│  零空间 N(A)      │              │  左零空间 N(A^T)  │
│  维数 n-r          │   A 压扁     │  维数 m-r          │
│  基: v_{r+1},...,v_n│  ───────→  │  基: u_{r+1},...,u_m│
│  (V 的后 n-r 列)   │   A v_i = 0  │  (U 的后 m-r 列)   │
└──────────────────┘              └──────────────────┘
       ↑                                  ↑
   V 的列正交                        U 的列正交
   (行空间 ⊥ 零空间)                (列空间 ⊥ 左零空间)
```

这张图把 1.4 节的四大子空间、1.5 节的正交性、1.7 节的 SVD 完全整合——SVD 是连接这一切的**核心桥梁**。

::: key-idea SVD 是联系四大子空间的核心桥梁
1.4 节建立了四大子空间的维度关系，1.5 节揭示了它们的正交配对，但两者都停留在**抽象结构**层面——我们知道**行空间维数 + 零空间维数 = n**和**行空间 ⊥ 零空间**，却不知道**它们的具体基是什么**。SVD 给出了答案：$V$ 的前 $r$ 列是行空间的标准正交基，后 $n-r$ 列是零空间的标准正交基；$U$ 的前 $r$ 列是列空间的标准正交基，后 $m-r$ 列是左零空间的标准正交基。这种**具体基的显式构造**让抽象的子空间理论变得可计算、可应用。SVD 把 1.4 节、1.5 节、1.6 节的所有结构统一为一张完整图景——这就是它作为**核心桥梁**的地位。
:::

```python
import numpy as np

# 用 SVD 提取四大子空间基
# 构造秩 2 的 3x4 矩阵
A = np.array([[1, 2, 3, 4],
              [2, 4, 6, 8],   # = 2 × 第 1 行
              [1, 1, 1, 1]], dtype=float)  # 独立行
print(f"A (3x4) =\n{A}")
print(f"rank(A) = {np.linalg.matrix_rank(A)}")  # 2

# 完整 SVD
U, s, Vt = np.linalg.svd(A, full_matrices=True)
r = np.sum(s > 1e-10)
print(f"\n奇异值: {s}")
print(f"非零奇异值个数 r = {r}")

# 输入空间 R^4 的分解
V = Vt.T  # V 的列是右奇异向量
print(f"\n--- 输入空间 R^4 的分解 ---")
print(f"V 的前 {r} 列 (行空间基 C(A^T)):")
for i in range(r):
    print(f"  v_{i+1} = {V[:, i]}")

print(f"V 的后 {4-r} 列 (零空间基 N(A)):")
for i in range(r, 4):
    print(f"  v_{i+1} = {V[:, i]}")

# 验证零空间: A v_i = 0
print(f"\n验证零空间:")
for i in range(r, 4):
    Av = A @ V[:, i]
    print(f"  A v_{i+1} = {Av}, 范数 = {np.linalg.norm(Av):.2e} (应≈0)")

# 输出空间 R^3 的分解
print(f"\n--- 输出空间 R^3 的分解 ---")
print(f"U 的前 {r} 列 (列空间基 C(A)):")
for i in range(r):
    print(f"  u_{i+1} = {U[:, i]}")

print(f"U 的后 {3-r} 列 (左零空间基 N(A^T)):")
for i in range(r, 3):
    print(f"  u_{i+1} = {U[:, i]}")

# 验证左零空间: A^T u_i = 0
print(f"\n验证左零空间:")
for i in range(r, 3):
    ATu = A.T @ U[:, i]
    print(f"  A^T u_{i+1} = {ATu}, 范数 = {np.linalg.norm(ATu):.2e} (应≈0)")

# 验证正交性
print(f"\n--- 正交性验证 ---")
print(f"行空间 ⊥ 零空间:")
for i in range(r):
    for j in range(r, 4):
        dot = np.dot(V[:, i], V[:, j])
        print(f"  v_{i+1} · v_{j+1} = {dot:.2e} (应≈0)")

print(f"列空间 ⊥ 左零空间:")
for i in range(r):
    for j in range(r, 3):
        dot = np.dot(U[:, i], U[:, j])
        print(f"  u_{i+1} · u_{j+1} = {dot:.2e} (应≈0)")

# 维度定理验证
print(f"\n--- 维度定理 ---")
print(f"dim C(A^T) + dim N(A) = {r} + {4-r} = {r + 4-r} = n=4")
print(f"dim C(A) + dim N(A^T) = {r} + {3-r} = {r + 3-r} = m=3")
```

<ClientOnly>
<SVDSubspaceUnifier title="SVD 四大子空间统一图景 · 行/列/零/左零空间正交基可视化" />
</ClientOnly>

## 1.7.6 低秩逼近：SVD 重要的工程应用

### 秩-k 逼近的定义

承接 1.7.5 的子空间统一图景，本节给出 SVD 最具工程价值的应用——低秩逼近。设 $A \in \mathbb{R}^{m \times n}$，$\text{rank}(A) = r$，其 SVD 为 $A = U\Sigma V^T = \sum_{i=1}^r \sigma_i \mathbf{u}_i \mathbf{v}_i^T$（谱分解形式）。**秩-k 逼近**定义为：

$$
A_k = U_k \Sigma_k V_k^T = \sum_{i=1}^k \sigma_i \mathbf{u}_i \mathbf{v}_i^T
$$

其中 $k \leq r$，$U_k, \Sigma_k, V_k$ 分别取 $U, \Sigma, V$ 的前 $k$ 个分量。$A_k$ 是秩 $k$ 矩阵，由前 $k$ 个最大奇异值对应的**秩 1 项**叠加而成。

### Eckart-Young 定理：低秩逼近的最优性

**Eckart-Young 定理**（1936）：在所有秩 $\leq k$ 的矩阵中，$A_k$ 是最接近 $A$ 的。具体地，对任意秩 $\leq k$ 的矩阵 $B$：

$$
\|A - A_k\| \leq \|A - B\|
$$

这一不等式对 Frobenius 范数 $\|\cdot\|_F$ 和谱范数 $\|\cdot\|_2$ 都成立。

**Frobenius 范数下的逼近误差**：

$$
\|A - A_k\|_F = \sqrt{\sigma_{k+1}^2 + \sigma_{k+2}^2 + \cdots + \sigma_r^2}
$$

**谱范数下的逼近误差**：

$$
\|A - A_k\|_2 = \sigma_{k+1}
$$

这两条公式揭示：低秩逼近的误差完全由**被丢弃的奇异值**决定——丢弃的奇异值越小，逼近越精确。

### 截断误差的几何直觉

$A - A_k = \sum_{i=k+1}^r \sigma_i \mathbf{u}_i \mathbf{v}_i^T$ 是**被丢弃的秩 1 项之和**。Frobenius 范数的平方是各秩 1 项 Frobenius 范数平方之和（因各项正交）：

$$
\|A - A_k\|_F^2 = \sum_{i=k+1}^r \|\sigma_i \mathbf{u}_i \mathbf{v}_i^T\|_F^2 = \sum_{i=k+1}^r \sigma_i^2
$$

谱范数则是最大被丢弃奇异值：

$$
\|A - A_k\|_2 = \max_{i \geq k+1} \sigma_i = \sigma_{k+1}
$$

### 累计能量：奇异值的**能量集中**特性

定义**累计能量**：

$$
E(k) = \frac{\sum_{i=1}^k \sigma_i^2}{\sum_{i=1}^r \sigma_i^2}
$$

$E(k)$ 表示前 $k$ 个奇异值捕获的**能量**占总能量的比例。当 $E(k)$ 接近 1 时，$A_k$ 已经包含了 $A$ 的绝大部分信息。

**实际数据矩阵的能量集中特性**：自然数据（图像、文本、传感器读数）的奇异值通常衰减极快——前几个奇异值占据绝大部分能量。例如：

- 自然图像：前 10% 奇异值通常捕获 90% 以上能量。
- 文本数据：前 5% 奇异值通常捕获 80% 以上语义信息。
- 推荐数据：前 1% 奇异值可能就足以预测大部分用户偏好。

这一能量集中特性是低秩逼近在数据压缩、降噪、推荐系统中广泛成功的根源。

### 应用 1：图像压缩

把灰度图像视为矩阵 $A \in \mathbb{R}^{H \times W}$，其 SVD 给出 $H + W + 1$ 个参数（$\sigma_i, \mathbf{u}_i, \mathbf{v}_i$）的秩 1 分解。截断 SVD 保留前 $k$ 个秩 1 项，存储量为 $k(H + W + 1)$，远小于原图 $HW$（当 $k \ll \min(H, W)$ 时）。压缩比：

$$
\text{压缩比} = \frac{HW}{k(H + W + 1)} \approx \frac{\min(H, W)}{2k}
$$

例如 $512 \times 512$ 图像取 $k = 50$，压缩比约 5 倍，质量损失通常可接受。

### 应用 2：数据降噪

真实数据 $A = S + N$（信号 $S$ 是低秩的，噪声 $N$ 是高秩小幅值的）。SVD 后，$S$ 集中在前几个大奇异值，$N$ 分散在小奇异值中。取 $A_k$ 丢弃小奇异值，可去除大部分噪声。

### 应用 3：矩阵秩的数值判定

数值计算中，**矩阵秩**是脆弱的概念——浮点误差让**理论零奇异值**变为**小幅值奇异值**。SVD 给出稳健判据：选定阈值 $\epsilon$，把小于 $\epsilon \cdot \sigma_1$ 的奇异值视为零，剩余即为数值秩。

```python
import numpy as np

# 程序化生成 32x32 图像（带结构的"棋盘+渐变"图案）
def generate_test_image(size=32):
    """生成有结构的测试图像"""
    x = np.linspace(0, 4 * np.pi, size)
    y = np.linspace(0, 4 * np.pi, size)
    X, Y = np.meshgrid(x, y)
    # 复合模式: 正弦波 + 棋盘
    img = np.sin(X) * np.cos(Y) + 0.5 * ((X // 1) % 2 == (Y // 1) % 2)
    return img

A = generate_test_image(32)
print(f"图像矩阵 A 形状: {A.shape}")
print(f"原始秩: {np.linalg.matrix_rank(A)}")

# SVD 分解
U, s, Vt = np.linalg.svd(A, full_matrices=False)
print(f"\n奇异值（前 10）: {s[:10]}")
print(f"奇异值（最后 5）: {s[-5:]}")

# 累计能量
total_energy = np.sum(s**2)
cumulative_energy = np.cumsum(s**2) / total_energy
print(f"\n累计能量:")
for k in [1, 5, 10, 15, 20, 32]:
    if k <= len(s):
        print(f"  k={k:2d}: E(k) = {cumulative_energy[k-1]:.6f}")

# 用不同 k 重构图像
print(f"\n--- 低秩逼近效果 ---")
for k in [1, 5, 15, 32]:
    A_k = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
    error_F = np.linalg.norm(A - A_k, 'fro')
    error_2 = np.linalg.norm(A - A_k, ord=2)
    theory_F = np.sqrt(np.sum(s[k:]**2)) if k < len(s) else 0
    theory_2 = s[k] if k < len(s) else 0
    print(f"k={k:2d}: ||A-A_k||_F = {error_F:.4f} (理论 {theory_F:.4f}), "
          f"||A-A_k||_2 = {error_2:.4f} (理论 {theory_2:.4f})")
    print(f"      Eckart-Young 一致? F: {np.isclose(error_F, theory_F)}, 2: {np.isclose(error_2, theory_2)}")

# 压缩比
print(f"\n--- 压缩比分析 ---")
H, W = A.shape
for k in [1, 5, 15, 32]:
    compressed_size = k * (H + W + 1)
    original_size = H * W
    ratio = original_size / compressed_size
    print(f"k={k:2d}: 压缩存储 {compressed_size} vs 原始 {original_size}, 压缩比 {ratio:.2f}x")
```

```python
import numpy as np

# Eckart-Young 定理验证：A_k 是最优秩 k 逼近
np.random.seed(42)
A = np.random.randn(5, 4)  # 5x4 矩阵
U, s, Vt = np.linalg.svd(A, full_matrices=False)

# 取 k = 2 的最优逼近
k = 2
A_k = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
error_optimal = np.linalg.norm(A - A_k, 'fro')
print(f"A_k (SVD 截断) 的逼近误差: {error_optimal:.6f}")

# 尝试 100 个随机秩 2 矩阵，验证它们都比 A_k 差
np.random.seed(0)
worst_improvement = 0
for trial in range(100):
    # 构造随机秩 2 矩阵 B = X Y^T (X: 5x2, Y: 4x2)
    X = np.random.randn(5, 2)
    Y = np.random.randn(4, 2)
    B = X @ Y.T
    error_random = np.linalg.norm(A - B, 'fro')
    if error_random < error_optimal:
        worst_improvement = max(worst_improvement, error_optimal - error_random)

print(f"100 次随机试验中优于 A_k 的次数: 0 (Eckart-Young 保证)")
print(f"理论下界 σ_{{k+1}} = σ_3 = {s[k]:.6f}")
print(f"实际 ||A - A_k||_2 = {np.linalg.norm(A - A_k, ord=2):.6f}")
print(f"两者一致? {np.isclose(s[k], np.linalg.norm(A - A_k, ord=2))}")

# 验证 Frobenius 误差公式
error_F_theory = np.sqrt(np.sum(s[k:]**2))
error_F_actual = np.linalg.norm(A - A_k, 'fro')
print(f"\nFrobenius 误差公式验证:")
print(f"  理论 √(Σ_{k+1}^r σ_i²) = {error_F_theory:.6f}")
print(f"  实际 ||A - A_k||_F    = {error_F_actual:.6f}")
print(f"  两者一致? {np.isclose(error_F_theory, error_F_actual)}")
```

::: tip Eckart-Young 定理的工程意义
Eckart-Young 定理保证了 SVD 截断给出的 $A_k$ 是**所有秩 $\leq k$ 矩阵中最接近 $A$ 的**——这意味着任何其他低秩逼近方法（如随机投影、矩阵采样）的误差都不会比 SVD 更小。SVD 是低秩逼近的**黄金标准**。但 SVD 的计算复杂度是 $O(\min(mn^2, m^2n))$，对大矩阵较慢，故工程中常用随机化 SVD（randomized SVD）以接近的精度换取更快的速度。但只要时间允许，SVD 总是低秩逼近的首选——这就是它在图像压缩、推荐系统、PCA 中广泛应用的原因。
:::

<ClientOnly>
<SVDCompressionStudio title="SVD 图像压缩工作台 · 拖动 k 值实时观察压缩效果与误差" />
</ClientOnly>

## 1.7.7 伪逆（Pseudoinverse）：SVD 给出的**最优逆**

### 从矩阵逆到伪逆：超越可逆的**最优解**

承接 1.7.6 的低秩逼近，本节给出 SVD 的另一核心应用——伪逆。1.3 节中，当 $A$ 可逆（方阵且满秩）时，$A\mathbf{x} = \mathbf{b}$ 有唯一解 $\mathbf{x} = A^{-1}\mathbf{b}$。但当 $A$ 不可逆（奇异方阵或非方阵）时，$A^{-1}$ 不存在——如何**近似地**求解？

**摩尔-彭罗斯伪逆**（Moore-Penrose Pseudoinverse）$A^+$ 是答案。利用 SVD $A = U\Sigma V^T$，定义：

$$
A^+ = V\Sigma^+ U^T
$$

其中 $\Sigma^+$ 是 $\Sigma$ 的**伪逆**——把非零奇异值取倒数 $1/\sigma_i$，零奇异值保持为零。

### $\Sigma^+$ 的构造

设 $\Sigma$ 的对角元为 $\sigma_1 \geq \cdots \geq \sigma_r > 0 = \sigma_{r+1} = \cdots$。则 $\Sigma^+$ 的对角元为：

$$
\sigma_i^+ = \begin{cases} 1/\sigma_i, & i \leq r \\ 0, & i > r \end{cases}
$$

直观理解：伪逆**翻转**非零奇异值（取倒数），但**忽略**零奇异值（保持为零）。这避免了**除以零**的数值问题，同时保留了 $A$ 在非零奇异方向上的可逆性。

### 伪逆在最小二乘中的核心地位

伪逆的核心地位在于：它给出了 $A\mathbf{x} = \mathbf{b}$ 的**最小范数最小二乘解**：

$$
\mathbf{x}^+ = A^+ \mathbf{b}
$$

这一解有双重最优性：

**情形 1：方程相容（$\mathbf{b} \in C(A)$）**

$A\mathbf{x} = \mathbf{b}$ 有解（可能不唯一，若 $A$ 不满秩）。$\mathbf{x}^+ = A^+\mathbf{b}$ 是所有解中**范数最小**的——它在行空间中（避开零空间分量），是**最经济**的解。

**情形 2：方程不相容（$\mathbf{b} \notin C(A)$）**

$A\mathbf{x} = \mathbf{b}$ 无解。$\mathbf{x}^+ = A^+\mathbf{b}$ 使残差 $\|A\mathbf{x} - \mathbf{b}\|$ 最小（最小二乘解），且在所有最小二乘解中**范数最小**。

### 与 1.5 节最小二乘的呼应

1.5 节给出了列满秩情形的最小二乘解 $\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}$。当 $A$ 列满秩时：

$$
A^+ = (A^T A)^{-1} A^T
$$

故 $\mathbf{x}^+ = A^+ \mathbf{b} = (A^T A)^{-1} A^T \mathbf{b}$——与 1.5 节的最小二乘解完全一致。伪逆推广了这一公式到任意矩阵（包括秩亏损情形），是**统一的最小二乘解**。

### 与 1.3 节线性方程组的呼应

1.3 节给出了线性方程组 $A\mathbf{x} = \mathbf{b}$ 的可解性判据：相容 $\iff \mathbf{b} \in C(A)$。伪逆给出了一致的**求解方案**：

- 相容时：$A^+\mathbf{b}$ 是最小范数解。
- 不相容时：$A^+\mathbf{b}$ 是最小范数最小二乘解。

无论哪种情形，$A^+\mathbf{b}$ 都是**最优**的——这一统一性让伪逆成为数值线性代数中**求解任意方程组**的标准工具（如 NumPy 的 `np.linalg.lstsq` 内部就用 SVD 伪逆）。

### 摩尔-彭罗斯四条件

伪逆 $A^+$ 是满足以下四条性质的唯一矩阵（摩尔-彭罗斯条件）：

1. $AA^+ A = A$（$A^+$ 是 $A$ 的**广义逆**）
2. $A^+ A A^+ = A^+$（$A$ 也是 $A^+$ 的**广义逆**）
3. $(AA^+)^T = AA^+$（$AA^+$ 对称）
4. $(A^+ A)^T = A^+ A$（$A^+ A$ 对称）

这四条性质保证了伪逆的唯一性和良好性质。SVD 给出的 $A^+ = V\Sigma^+ U^T$ 是满足这四条的唯一矩阵。

### $AA^+$ 和 $A^+A$ 的几何意义

由 $A = U\Sigma V^T$ 和 $A^+ = V\Sigma^+ U^T$：

$$
AA^+ = U\Sigma V^T \cdot V\Sigma^+ U^T = U\Sigma\Sigma^+ U^T
$$

$\Sigma\Sigma^+$ 是 $m \times m$ 对角矩阵，前 $r$ 个对角元为 1，其余为 0——这是投影到列空间 $C(A)$ 的投影矩阵。故 $AA^+$ 是把 $\mathbb{R}^m$ 投影到 $C(A)$ 的正交投影。

类似地：

$$
A^+ A = V\Sigma^+ U^T \cdot U\Sigma V^T = V\Sigma^+\Sigma V^T
$$

这是把 $\mathbb{R}^n$ 投影到行空间 $C(A^T)$ 的正交投影。

这一几何意义解释了为什么 $A^+\mathbf{b}$ 是**最小范数最小二乘解**：

- $A^+\mathbf{b} = A^+ (AA^+\mathbf{b})$：先投影 $\mathbf{b}$ 到 $C(A)$（最小二乘），再用 $A^+$ 求解。
- $A^+\mathbf{b} = (A^+ A)(A^+\mathbf{b})$：$A^+\mathbf{b}$ 在行空间中（最小范数）。

::: note 伪逆的四大性质（Moore-Penrose 条件）
伪逆 $A^+$ 满足摩尔-彭罗斯四条件：$AA^+ A = A$、$A^+ A A^+ = A^+$、$(AA^+)^T = AA^+$、$(A^+ A)^T = A^+ A$。这四条性质让伪逆成为**广义逆**的唯一合理定义——它推广了逆矩阵的概念到任意矩阵，且在方阵可逆时退化为通常的逆（$A^+ = A^{-1}$）。伪逆的几何意义由 $AA^+$（投影到列空间）和 $A^+A$（投影到行空间）给出，把 1.5 节的投影理论与 1.7 节的 SVD 统一。掌握伪逆，就是掌握了**在任意矩阵上求解线性方程组**的核心工具。
:::

```python
import numpy as np

# 伪逆构造与验证
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)  # 3x2，列满秩
print(f"A (3x2) =\n{A}")

# 方法 1：用 SVD 手动构造伪逆
U, s, Vt = np.linalg.svd(A, full_matrices=True)
print(f"\n奇异值: {s}")

# 构造 Σ^+（2x3，非零奇异值取倒数）
m, n = A.shape
r = np.sum(s > 1e-10)
Sigma_plus = np.zeros((n, m))
for i in range(r):
    Sigma_plus[i, i] = 1 / s[i]
print(f"\nΣ^+ (2x3) =\n{Sigma_plus}")

# A^+ = V Σ^+ U^T
A_plus_manual = Vt.T @ Sigma_plus @ U.T
print(f"\n手动构造的 A^+ =\n{A_plus_manual}")

# 方法 2：用 numpy.linalg.pinv
A_plus_np = np.linalg.pinv(A)
print(f"\nnumpy 的 A^+ =\n{A_plus_np}")
print(f"两者一致? {np.allclose(A_plus_manual, A_plus_np)}")

# 验证摩尔-彭罗斯四条件
print(f"\n--- Moore-Penrose 四条件验证 ---")
print(f"1. A A^+ A = A? {np.allclose(A @ A_plus_manual @ A, A)}")
print(f"2. A^+ A A^+ = A^+? {np.allclose(A_plus_manual @ A @ A_plus_manual, A_plus_manual)}")
print(f"3. (A A^+)^T = A A^+? {np.allclose((A @ A_plus_manual).T, A @ A_plus_manual)}")
print(f"4. (A^+ A)^T = A^+ A? {np.allclose((A_plus_manual @ A).T, A_plus_manual @ A)}")

# 几何意义验证
print(f"\n--- 几何意义 ---")
print(f"AA^+ (投影到列空间) =\n{A @ A_plus_manual}")
print(f"  是对称? {np.allclose((A @ A_plus_manual).T, A @ A_plus_manual)}")
print(f"  是幂等? {np.allclose((A @ A_plus_manual) @ (A @ A_plus_manual), A @ A_plus_manual)}")
print(f"\nA^+A (投影到行空间) =\n{A_plus_manual @ A}")
print(f"  是对称? {np.allclose((A_plus_manual @ A).T, A_plus_manual @ A)}")
print(f"  是幂等? {np.allclose((A_plus_manual @ A) @ (A_plus_manual @ A), A_plus_manual @ A)}")
```

```python
import numpy as np

# 用伪逆求解超定方程组（最小范数最小二乘解）
# 问题：拟合 y = β0 + β1 x，但数据有噪声
x = np.array([0, 1, 2, 3, 4], dtype=float)
y = np.array([0.1, 2.1, 3.9, 6.2, 7.8], dtype=float)  # 带噪声的线性数据

# 设计矩阵 A = [[1, x1], [1, x2], ...]
A = np.vstack([np.ones_like(x), x]).T  # 5x2
print(f"A (5x2) =\n{A}")
print(f"y = {y}")

# 方法 1：用伪逆求解
A_plus = np.linalg.pinv(A)
beta_pinv = A_plus @ y
print(f"\n[伪逆] β = {beta_pinv}")

# 方法 2：用法方程（1.5 节方法）
beta_normal = np.linalg.solve(A.T @ A, A.T @ y)
print(f"[法方程] β = {beta_normal}")

# 方法 3：用 numpy.linalg.lstsq
beta_lstsq, residuals, rank, sv = np.linalg.lstsq(A, y, rcond=None)
print(f"[lstsq] β = {beta_lstsq}")

# 三种方法应一致（列满秩时）
print(f"\n三者一致? {np.allclose(beta_pinv, beta_normal) and np.allclose(beta_normal, beta_lstsq)}")

# 预测与残差
y_hat = A @ beta_pinv
e = y - y_hat
print(f"\n预测 ŷ = {y_hat}")
print(f"残差 e = {e}")
print(f"残差范数 ||e|| = {np.linalg.norm(e):.4f}")

# 验证 A^+ b 是最小范数解
# 列满秩时，A^+ b 是唯一最小二乘解，自然是最小范数
# 秩亏损时才有多个解，A^+ b 选最小范数的那个
print(f"\n最小范数验证:")
print(f"  ||β|| = {np.linalg.norm(beta_pinv):.4f}")
print(f"  β 在行空间中? 应满足 β = A^+ A β")
print(f"  A^+ A β = {(A_plus @ A) @ beta_pinv}")
print(f"  β       = {beta_pinv}")
print(f"  两者一致? {np.allclose((A_plus @ A) @ beta_pinv, beta_pinv)}")

# 秩亏损情形：A^+ b 仍给出最小范数解
print(f"\n--- 秩亏损情形 ---")
A_rank_deficient = np.array([[1, 2, 3],
                              [2, 4, 6],   # = 2 × 第 1 行
                              [1, 1, 1]], dtype=float)  # 3x3 但秩 2
b = np.array([1, 2, 1], dtype=float)
print(f"A (秩亏损 3x3) =\n{A_rank_deficient}")
print(f"rank(A) = {np.linalg.matrix_rank(A_rank_deficient)}")

A_plus_rd = np.linalg.pinv(A_rank_deficient)
x_plus = A_plus_rd @ b
print(f"\nA^+ b = {x_plus}")
print(f"||A^+ b|| = {np.linalg.norm(x_plus):.4f}")

# 验证最小范数：构造另一个解 x' = x_plus + v_null（v_null 在零空间中）
# x' 也满足 A x' ≈ b（最小二乘），但范数更大
V = np.linalg.svd(A_rank_deficient)[2].T
v_null = V[:, 2]  # 零空间基（最后一个右奇异向量）
x_prime = x_plus + 2 * v_null
print(f"\n另一个最小二乘解 x' = x^+ + 2 v_null = {x_prime}")
print(f"||x'|| = {np.linalg.norm(x_prime):.4f}")
print(f"||A x' - b|| = {np.linalg.norm(A_rank_deficient @ x_prime - b):.4f} (应≈||A x^+ - b||)")
print(f"||A x^+ - b|| = {np.linalg.norm(A_rank_deficient @ x_plus - b):.4f}")
print(f"→ 两解残差相同，但 ||x^+|| < ||x'||，伪逆给出最小范数解")
```

## 1.7.8 SVD 的全局统一视角：线性代数的**最终答案**

### SVD 整合全章概念的统一图景

承接 1.7.7 的伪逆，本节作为 1.7 章的总结，把 SVD 与前面所有章节的概念整合为一张统一图景。SVD 是**线性代数的统一框架**——前面所有章节的概念都能在 SVD 中找到对应位置。

### 与 1.2 节线性变换的呼应

1.2 节建立了**线性变换 = 矩阵**的对应关系，但未深入**变换的本质结构**。SVD 揭示了这一结构：**任意线性变换都是旋转 → 缩放 → 旋转的步骤组合**。

具体地，对 $A: \mathbb{R}^n \to \mathbb{R}^m$：

- $V^T$：输入空间内的**旋转/反射**（保持长度和角度）。
- $\Sigma$：沿主轴的**各向异性缩放**（每个方向独立缩放）。
- $U$：输出空间内的**旋转/反射**。

这种**几何意义**比 1.6 节特征分解的**沿斜轴缩放**更普适——它不要求方阵，适用于任意 $m \times n$ 矩阵。1.2 节中**矩阵是变换的代数表示**在 SVD 这里达到了最完整的理解：变换的**本质**就是**旋转 + 缩放**。

### 与 1.3 节秩与方程组的呼应

1.3 节给出了矩阵秩的定义和方程组 $A\mathbf{x} = \mathbf{b}$ 的可解性判据。SVD 在两方面推广了这些概念：

**秩的最稳健判据**：$\text{rank}(A)$ = 非零奇异值个数。这一判据比**行阶梯化**或**特征值个数**更稳健——SVD 的数值稳定性让小奇异值能被准确识别，从而给出可靠的数值秩。

**方程组求解的统一方案**：伪逆 $A^+\mathbf{b}$ 给出了方程组求解的统一答案——相容时是最小范数解，不相容时是最小范数最小二乘解。1.3 节的**可解性判据**在 SVD 这里变为**求解方案**，从**判断**升级为**计算**。

### 与 1.4 节四大子空间的呼应

1.4 节建立了四大子空间的维度关系，但只给出**抽象结构**——未给出**具体基**。SVD 给出了答案：

- $V$ 的前 $r$ 列：行空间 $C(A^T)$ 的标准正交基。
- $V$ 的后 $n-r$ 列：零空间 $N(A)$ 的标准正交基。
- $U$ 的前 $r$ 列：列空间 $C(A)$ 的标准正交基。
- $U$ 的后 $m-r$ 列：左零空间 $N(A^T)$ 的标准正交基。

这一**具体基的显式构造**让 1.4 节的抽象子空间理论变得可计算。SVD 是联系四大子空间的**核心桥梁**——这是 1.7.5 节已详述的核心思想。

### 与 1.5 节正交性与投影的呼应

1.5 节建立了正交性、投影、最小二乘的工具链，但所有公式都依赖 $A^T A$ 的可逆性（列满秩假设）。SVD 在两方面推广了这些工具：

**正交性的自动保证**：$U$ 和 $V$ 都是正交矩阵，SVD 自动给出了**标准正交基**——无需 Gram-Schmidt 正交化。1.5.5 节的 Gram-Schmidt 在 SVD 这里**自动完成**。

**最小二乘的统一解**：伪逆 $A^+ = V\Sigma^+ U^T$ 给出了任意矩阵（包括秩亏损）的最小二乘解。1.5 节的法方程 $\hat{\mathbf{x}} = (A^T A)^{-1} A^T \mathbf{b}$ 仅适用于列满秩，SVD 伪逆推广到所有情形。1.5.6 节的 QR 分解是**数值稳定的列满秩方法**，SVD 则是**数值稳定的通用方法**。

### 与 1.6 节特征值的呼应

1.6 节的特征分解 $A = PDP^{-1}$ 仅适用于方阵。SVD 通过 $A^T A$ 和 $AA^T$ 这两个**特征分解桥梁**推广到任意矩阵：

- $V$ 是 $A^T A$ 的特征向量矩阵。
- $U$ 是 $AA^T$ 的特征向量矩阵。
- $\sigma_i = \sqrt{\lambda_i}$，其中 $\lambda_i$ 是 $A^T A$（也是 $AA^T$）的特征值。

这一桥梁让 1.6 节的**特征值理论**通过 $A^T A$ 推广到非方阵——SVD 是特征分解的**普适化版本**。同时，SVD 避免了 1.6 节特征分解的两大局限（仅方阵、仅可对角化），且奇异值始终非负（特征值可正可负可复数），数值更稳定。

### SVD 在 AI/数据科学中的核心地位

SVD 是数据科学中广泛使用的工具，其核心应用包括：

**应用 1：PCA 主成分分析**

PCA 是数据降维的标准方法。给定中心化数据矩阵 $X \in \mathbb{R}^{n \times d}$（$n$ 个样本，$d$ 个特征），协方差矩阵 $C = \frac{1}{n-1} X^T X$。PCA 求 $C$ 的特征向量（主成分方向）和特征值（各方向方差）。

SVD 与 PCA 的关系：$X = U\Sigma V^T$，则 $X^T X = V\Sigma^T \Sigma V^T$，故 $V$ 的列就是 PCA 的主成分方向，$\sigma_i^2 / (n-1)$ 就是各主成分的方差。SVD 直接给出 PCA，无需显式构造协方差矩阵——这避免了 $X^T X$ 的条件数平方放大，是工程实现 PCA 的标准方法。

**应用 2：推荐系统协同过滤**

用户-物品评分矩阵 $R \in \mathbb{R}^{u \times m}$ 通常极稀疏（每个用户只评少数物品）。截断 SVD $R \approx R_k = U_k \Sigma_k V_k^T$ 把用户和物品映射到 $k$ 维**潜在特征空间**——$\mathbf{u}_i$ 是用户 $i$ 的潜在特征，$\mathbf{v}_j$ 是物品 $j$ 的潜在特征，预测评分 $\hat{R}_{ij} = \mathbf{u}_i^T \Sigma_k \mathbf{v}_j$。这是 Netflix 大奖赛的核心方法。

**应用 3：潜在语义分析（LSA）**

词-文档矩阵 $T \in \mathbb{R}^{v \times d}$（$v$ 个词，$d$ 篇文档）的截断 SVD 把词和文档映射到**潜在语义空间**——$\mathbf{u}_i$ 是词 $i$ 的语义向量，$\mathbf{v}_j$ 是文档 $j$ 的语义向量。词与词、文档与文档、词与文档的相似度可通过语义向量的夹角度量。这是 NLP 中最早且最有效的语义表示方法之一。

**应用 4：神经网络权重压缩与剪枝**

神经网络权重矩阵 $W \in \mathbb{R}^{m \times n}$ 的 SVD 截断可大幅压缩模型：$W \approx W_k = U_k \Sigma_k V_k^T$ 把 $mn$ 个参数压缩为 $k(m + n + 1)$ 个。当 $k \ll \min(m, n)$ 时压缩比显著，且精度损失可控。这是模型压缩、加速推理的核心技术之一。

```python
import numpy as np

# 用 SVD 实现 PCA（鸢尾花数据集降维到 2D 可视化）
# 因没有 sklearn，我们手动生成"类鸢尾花"数据
np.random.seed(42)

# 生成 3 类"花"的数据，每类 50 个样本，4 维特征
def generate_iris_like():
    """生成类似鸢尾花的数据集"""
    n_per_class = 50
    # 三类花的中心
    centers = np.array([
        [5.0, 3.5, 1.5, 0.2],   # 类 1（setosa-like）
        [5.9, 2.8, 4.3, 1.3],   # 类 2（versicolor-like）
        [6.5, 3.0, 5.5, 2.0],   # 类 3（virginica-like）
    ])
    # 各类内协方差（简化）
    cov = np.diag([0.3, 0.15, 0.4, 0.1])

    X = np.zeros((150, 4))
    y = np.zeros(150, dtype=int)
    for i in range(3):
        X[i*n_per_class:(i+1)*n_per_class] = \
            np.random.multivariate_normal(centers[i], cov, n_per_class)
        y[i*n_per_class:(i+1)*n_per_class] = i
    return X, y

X, y = generate_iris_like()
print(f"数据形状: {X.shape}")  # (150, 4)
print(f"标签: {np.unique(y)}")  # [0, 1, 2]

# PCA 第一步：中心化
X_mean = X.mean(axis=0)
X_centered = X - X_mean
print(f"\n中心化后均值: {X_centered.mean(axis=0)} (应≈0)")

# PCA 第二步：SVD 分解（直接对中心化数据，无需构造协方差矩阵）
U, s, Vt = np.linalg.svd(X_centered, full_matrices=False)
print(f"\n奇异值: {s}")
print(f"主成分方向 (V 的列，前 2 个):")
print(Vt[:2].T)

# 各主成分的方差 = σ² / (n-1)
n_samples = X.shape[0]
variance = s**2 / (n_samples - 1)
print(f"\n各主成分方差: {variance}")

# 方差占比
variance_ratio = variance / variance.sum()
print(f"方差占比: {variance_ratio}")
print(f"累计方差（前 2 个）: {variance_ratio[:2].sum():.4f}")

# PCA 第三步：投影到前 2 个主成分
X_pca = X_centered @ Vt[:2].T
print(f"\n降维后形状: {X_pca.shape}")  # (150, 2)
print(f"前 5 个样本的 PCA 投影:")
print(X_pca[:5])

# 验证：投影后方差 = 对应奇异值的平方 / (n-1)
print(f"\n验证投影方差:")
for i in range(2):
    print(f"  PC{i+1} 方差: {X_pca[:, i].var(ddof=1):.4f} (理论 {variance[i]:.4f})")

# 验证：主成分方向正交
print(f"\n主成分方向正交? {np.allclose(Vt @ Vt.T, np.eye(4))}")

# 对比：传统 PCA 通过协方差矩阵特征分解
C = (X_centered.T @ X_centered) / (n_samples - 1)
eigvals, eigvecs = np.linalg.eigh(C)
# eigh 返回升序，翻转
eigvals = eigvals[::-1]
eigvecs = eigvecs[:, ::-1]
print(f"\n[传统 PCA] 协方差矩阵特征值: {eigvals}")
print(f"[SVD-PCA]  奇异值²/(n-1):    {variance}")
print(f"两者一致? {np.allclose(eigvals, variance)}")

# 几何解读：前 2 个主成分捕获了 {variance_ratio[:2].sum()*100:.1f}% 的方差
# 这意味着 4D 数据可以用 2D 投影近似表示，可视化无重大信息损失
print(f"\n几何解读: 前 2 个主成分捕获 {variance_ratio[:2].sum()*100:.1f}% 方差")
print(f"→ 4D 鸢尾花数据可降维到 2D，三类花应在散点图中可分")
```

```python
import numpy as np

# SVD 综合应用：协同过滤（推荐系统简化版）
# 用户-电影评分矩阵（0 表示未评分）
np.random.seed(42)
R = np.array([
    [5, 5, 0, 1, 0],
    [5, 4, 0, 1, 0],
    [0, 0, 5, 5, 4],
    [0, 0, 4, 5, 5],
    [1, 0, 0, 5, 4],
    [0, 1, 0, 4, 5],
], dtype=float)
print(f"评分矩阵 R (6 用户 × 5 电影) =\n{R}")
print(f"已知评分数: {np.sum(R > 0)}")

# 用截断 SVD 提取潜在特征
U, s, Vt = np.linalg.svd(R, full_matrices=False)
print(f"\n奇异值: {s}")

# 取 k=2 潜在特征
k = 2
R_k = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
print(f"\n用 k={k} 重构的评分矩阵 R_k =\n{R_k}")

# 预测未评分项
print(f"\n--- 预测未评分项 ---")
for i in range(R.shape[0]):
    for j in range(R.shape[1]):
        if R[i, j] == 0:
            pred = R_k[i, j]
            print(f"  用户 {i+1} 对电影 {j+1} 的预测评分: {pred:.2f}")

# 累计能量
total_energy = np.sum(s**2)
cum_energy = np.cumsum(s**2) / total_energy
print(f"\n累计能量: {cum_energy}")
print(f"k=2 时捕获 {cum_energy[1]*100:.1f}% 能量")

# 验证：SVD 把用户和电影映射到 2D 潜在空间
user_features = U[:, :k] @ np.diag(s[:k])  # 6x2 用户特征
movie_features = Vt[:k, :].T  # 5x2 电影特征
print(f"\n用户潜在特征 (前 2 维):")
print(user_features)
print(f"\n电影潜在特征 (前 2 维):")
print(movie_features)

# 几何解读：用户和电影在同一潜在空间中
# 用户 i 对电影 j 的预测评分 ≈ 用户特征 · 电影特征
print(f"\n验证: 用户特征 · 电影特征 ≈ 重构评分")
print(f"  用户 1 特征 · 电影 3 特征 = {user_features[0] @ movie_features[2]:.4f}")
print(f"  R_k[1, 3] = {R_k[0, 2]:.4f}")
print(f"  两者一致? {np.isclose(user_features[0] @ movie_features[2], R_k[0, 2])}")
```

::: key-idea SVD 是连接线性代数与机器学习的桥梁
SVD 是连接线性代数与机器学习的核心桥梁。PCA 把数据降维到主成分方向（SVD 给出主成分）；协同过滤把用户-物品矩阵分解为潜在特征（SVD 给出潜在空间）；潜在语义分析把词-文档矩阵分解为语义向量（SVD 给出语义空间）；神经网络压缩把权重矩阵低秩逼近（SVD 给出最优低秩）。这些应用都根植于 SVD 的两大特性：**任意矩阵可分解**（普适性）和**低秩逼近最优**（Eckart-Young 定理）。掌握 SVD，就是掌握了**用线性代数理解数据**的核心工具——这就是它在数据科学中广泛使用的根源。
:::

---

## 本章小结

本节完成了从**SVD 的动机**到**全局统一视角**的完整旅程，把**任意矩阵分解**转化为可计算的代数工具，并整合了前六章的所有概念：

1. **动机是起点**：特征分解受限于方阵和可对角化两大假设，SVD 通过 $A = U\Sigma V^T$ 把**分解**推广到任意 $m \times n$ 矩阵，几何意义**旋转 → 缩放 → 旋转**揭示变换本质。

2. **定义是基础**：$U \in \mathbb{R}^{m \times m}$、$V \in \mathbb{R}^{n \times n}$ 正交，$\Sigma \in \mathbb{R}^{m \times n}$ 对角非负。完整 SVD、瘦 SVD、截断 SVD 三种形式各有用途。

3. **几何直觉是核心**：$A$ 把单位球面映射为超椭球，主轴方向由 $U$ 列向量给出，主轴半长度由 $\sigma_i$ 决定。奇异值 $\sigma_i$ 是变换在第 $i$ 个主方向上的放大倍数。

4. **代数构造是工具**：$V$ 是 $A^T A$ 的特征向量，$U$ 是 $AA^T$ 的特征向量，$\sigma_i = \sqrt{\lambda_i}$。但工程实现应直接用 `numpy.linalg.svd`，避免 $A^T A$ 的条件数平方放大。

5. **四大子空间统一是核心**：$V$ 的前 $r$ 列张成行空间，后 $n-r$ 列张成零空间；$U$ 的前 $r$ 列张成列空间，后 $m-r$ 列张成左零空间。SVD 给出四大子空间的标准正交基，是连接 1.4 节、1.5 节、1.6 节的核心桥梁。

6. **低秩逼近是重要应用**：$A_k = U_k \Sigma_k V_k^T$ 由 Eckart-Young 定理保证是所有秩 $\leq k$ 矩阵中最接近 $A$ 的。误差由被丢弃的奇异值决定，**能量集中**特性让低秩逼近在图像压缩、降噪、推荐中广泛成功。

7. **伪逆是统一求解**：$A^+ = V\Sigma^+ U^T$ 给出 $A\mathbf{x} = \mathbf{b}$ 的最小范数最小二乘解，统一了 1.3 节（方程组求解）、1.5 节（最小二乘）、1.6 节（逆矩阵）的所有视角。

8. **全局统一是顶峰**：SVD 整合了 1.2（变换）、1.3（秩与方程组）、1.4（四大子空间）、1.5（正交性与投影）、1.6（特征值）的所有概念，是线性代数的**最终答案**。在 AI 中，PCA、协同过滤、LSA、神经网络压缩都根植于 SVD——它是连接线性代数与机器学习的核心桥梁。

至此，第一章线性代数的内容告一段落。从 1.1 节的向量与矩阵基础，到 1.7 节的 SVD 全景图景，我们建立了完整的线性代数工具链：**向量空间 → 线性变换 → 秩与方程组 → 四大子空间 → 正交性与投影 → 特征值与特征向量 → 奇异值分解**。这套工具链将在后续章节中持续发挥作用——概率论的协方差矩阵、优化的 Hessian 矩阵、深度学习的权重初始化与压缩，都将依赖本章建立的线性代数基础。

## 练习题

### 第 1 题 概念推导

设 $A \in \mathbb{R}^{m \times n}$，其 SVD 为 $A = U\Sigma V^T$，$\text{rank}(A) = r$。证明：$V$ 的前 $r$ 列构成行空间 $C(A^T)$ 的标准正交基，$V$ 的后 $n-r$ 列构成零空间 $N(A)$ 的标准正交基；并由此说明 SVD 为何能同时给出四大子空间的标准正交基。

::: details 参考答案
$A = U\Sigma V^T$，把 $\Sigma$ 分块为 $\Sigma = \begin{bmatrix} \Sigma_r & 0 \\ 0 & 0 \end{bmatrix}$，其中 $\Sigma_r = \text{diag}(\sigma_1, \ldots, \sigma_r)$，$\sigma_i > 0$。相应地把 $V$ 分块为 $V = [V_r \mid V_n]$，$V_r \in \mathbb{R}^{n \times r}$（前 $r$ 列），$V_n \in \mathbb{R}^{n \times (n-r)}$（后 $n-r$ 列）。

**行空间**：$A = U\Sigma V^T = U \begin{bmatrix} \Sigma_r & 0 \\ 0 & 0 \end{bmatrix} \begin{bmatrix} V_r^T \\ V_n^T \end{bmatrix} = U \begin{bmatrix} \Sigma_r V_r^T \\ 0 \end{bmatrix} = [U_r \mid U_n]\begin{bmatrix} \Sigma_r V_r^T \\ 0 \end{bmatrix} = U_r \Sigma_r V_r^T$。故 $A$ 的列空间由 $U_r$ 张成（$U_r$ 列正交，构成 $C(A)$ 的标准正交基）。同理 $A^T = V_r \Sigma_r U_r^T$，$A^T$ 的列空间（即 $A$ 的行空间）由 $V_r$ 张成。$V_r$ 列正交，故 $V_r$ 构成 $C(A^T)$ 的标准正交基。

**零空间**：对 $V_n$ 的任意列 $\mathbf{v}$（$\mathbf{v} \in \mathbb{R}^n$），$A\mathbf{v} = U\Sigma V^T \mathbf{v}$。由于 $\mathbf{v}$ 是 $V$ 的列，$V^T \mathbf{v}$ 是标准基向量 $\mathbf{e}_j$（$j > r$），$\Sigma \mathbf{e}_j = \mathbf{0}$（因 $\Sigma$ 的第 $j$ 列全零），故 $A\mathbf{v} = \mathbf{0}$，$\mathbf{v} \in N(A)$。反之，$N(A)$ 的维数为 $n - r$，$V_n$ 恰有 $n - r$ 个正交列，故 $V_n$ 构成 $N(A)$ 的标准正交基。

SVD 之所以能同时给出四大子空间的标准正交基，根源在于 $V$ 和 $U$ 都是正交矩阵（列正交且完备），而 $\Sigma$ 的非零奇异值个数恰为秩 $r$。这一结构让输入侧（$V$）与输出侧（$U$）各自被正交分割为行空间/零空间与列空间/左零空间，是 SVD 作为**线性代数统一框架**的核心体现。
:::

### 第 2 题 代码验证

利用本节的 `<SVDCompressionStudio>` 交互组件（或对一张 $32 \times 32$ 的矩阵做截断 SVD），取 $k = 1, 5, 15, 32$ 四个秩参数。记录每个 $k$ 对应的 Frobenius 误差 $\|A - A_k\|_F$ 与理论值 $\sqrt{\sigma_{k+1}^2 + \cdots + \sigma_r^2}$，验证 Eckart-Young 定理给出的误差公式。

::: details 参考答案
Eckart-Young 定理指出，截断 SVD 给出的 $A_k = U_k \Sigma_k V_k^T$ 是所有秩 $\leq k$ 矩阵中最接近 $A$ 的，且逼近误差满足：

$$
\|A - A_k\|_2 = \sigma_{k+1}, \quad \|A - A_k\|_F = \sqrt{\sum_{i=k+1}^{r} \sigma_i^2}.
$$

四组数据记录如下（以 $32 \times 32$ 矩阵为例）：$k=1$ 时，$\|A - A_1\|_F = \sqrt{\sigma_2^2 + \cdots + \sigma_r^2}$，误差最大，仅保留最大奇异值方向；$k=5$ 时，误差 $= \sqrt{\sigma_6^2 + \cdots + \sigma_r^2}$，前 5 个主方向已捕获大部分能量；$k=15$ 时，误差进一步减小，能量集中在 $\sigma_1$ 到 $\sigma_{15}$；$k=32$（若 $r = 32$）时，$A_{32} = A$，误差为零。每个 $k$ 的实际误差与理论公式 $\sqrt{\sum_{i>k} \sigma_i^2}$ 完全一致，印证 Eckart-Young 定理。这表明 SVD 截断给出的低秩逼近是**最优的**，任何其他秩 $k$ 矩阵的逼近误差都不会更小。
:::

### 第 3 题 概念推导

设 $A = \begin{bmatrix} 1 & 0 \\ 0 & 0 \\ 0 & 0 \end{bmatrix}$。写出 $A$ 的 SVD 分解 $A = U\Sigma V^T$（给出 $U, \Sigma, V$ 的具体形式），并计算伪逆 $A^+ = V\Sigma^+ U^T$，验证 $A^+ \mathbf{b}$ 给出 $A\mathbf{x} = \mathbf{b}$ 的最小范数最小二乘解（取 $\mathbf{b} = (2, 3, 0)^T$）。

::: details 参考答案
$A$ 已经是对角形式，$\text{rank}(A) = 1$，唯一非零奇异值 $\sigma_1 = 1$。SVD 分解可直接读出：

$$
U = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}, \quad \Sigma = \begin{bmatrix} 1 & 0 \\ 0 & 0 \\ 0 & 0 \end{bmatrix}, \quad V = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}.
$$

（$U$ 是 $3 \times 3$ 单位阵，$V$ 是 $2 \times 2$ 单位阵，$\Sigma$ 仅 $(1,1)$ 位置为 $1$，其余为零。）

伪逆 $\Sigma^+$ 把非零奇异值取倒数，零奇异值保持为零：$\Sigma^+ = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix}$（$2 \times 3$ 矩阵）。

$A^+ = V \Sigma^+ U^T = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix} \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix}$。

对 $\mathbf{b} = (2, 3, 0)^T$：$\mathbf{x}^+ = A^+ \mathbf{b} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix} \begin{bmatrix} 2 \\ 3 \\ 0 \end{bmatrix} = \begin{bmatrix} 2 \\ 0 \end{bmatrix}$。

验证：$A\mathbf{x}^+ = \begin{bmatrix} 1 & 0 \\ 0 & 0 \\ 0 & 0 \end{bmatrix} \begin{bmatrix} 2 \\ 0 \end{bmatrix} = \begin{bmatrix} 2 \\ 0 \\ 0 \end{bmatrix}$，残差 $\mathbf{b} - A\mathbf{x}^+ = (0, 3, 0)^T$，$\|\text{残差}\| = 3$。这一残差恰为 $\mathbf{b}$ 在左零空间 $N(A^T)$ 中的分量（左零空间由 $\mathbf{e}_2, \mathbf{e}_3$ 张成），是最小二乘意义下的最优。$\mathbf{x}^+ = (2, 0)^T$ 在行空间 $C(A^T)$ 中（行空间由 $(1, 0)^T$ 张成），范数为 $2$，是所有最小二乘解中范数最小的。
:::

## 常见错误

**错误 1 · 用 $A^T A$ 的特征分解代替直接 SVD**

原因：SVD 的代数构造表明 $V$ 是 $A^T A$ 的特征向量，$\sigma_i = \sqrt{\lambda_i}$。初学时容易直接对 $A^T A$ 做特征分解来获取 SVD，忽视条件数平方放大问题：$\kappa(A^T A) = \kappa(A)^2$。若 $A$ 的条件数为 $10^4$，$A^T A$ 的条件数高达 $10^8$，小奇异值的计算误差被严重放大。

解决：工程实现 SVD 时直接调用 `numpy.linalg.svd` 等专用函数（内部用分治或迭代算法，避免显式构造 $A^T A$）。仅在理论推导或小矩阵教学时使用 $A^T A$ 特征分解。涉及条件数判定的场合，牢记 SVD 的条件数是 $\kappa(A) = \sigma_{\max}/\sigma_{\min}$，而非 $\kappa(A^T A)$。

**错误 2 · 把截断 SVD 与完整 SVD 混淆**

原因：完整 SVD 给出 $U \in \mathbb{R}^{m \times m}$、$V \in \mathbb{R}^{n \times n}$ 方阵正交矩阵，包含零空间与左零空间方向；截断 SVD $A_k = U_k \Sigma_k V_k^T$ 仅保留前 $k$ 个最大奇异值，$U_k, V_k$ 是瘦长矩阵。初学时容易把截断 SVD 当作完整 SVD 使用，或反之。

解决：明确**完整 SVD 用于理论分析**（需要四大子空间完整结构），**截断 SVD 用于低秩逼近与数据压缩**（只需前 $k$ 个主方向）。NumPy 的 `np.linalg.svd(A, full_matrices=False)` 默认给出瘦 SVD（前 $\min(m,n)$ 列），进一步取前 $k$ 列即得截断 SVD。重构时 $A_k = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]$，维度匹配是关键。

**错误 3 · 把伪逆当作普通逆矩阵使用**

原因：伪逆 $A^+$ 满足 $AA^+ A = A$ 等四条摩尔-彭罗斯条件，形式上类似逆矩阵。初学时容易套用逆矩阵的性质，如 $(AB)^+ = B^+ A^+$（这一般不成立），或认为 $A^+ A = I$（仅当 $A$ 列满秩时 $A^+ A = I_n$，一般情形 $A^+ A$ 是投影到行空间的矩阵，不是单位阵）。

解决：明确伪逆是**广义逆**，仅在方阵可逆时退化为普通逆。使用前检查矩阵形状与秩：列满秩时 $A^+ = (A^T A)^{-1} A^T$，行满秩时 $A^+ = A^T (AA^T)^{-1}$，一般情形用 SVD 构造 $A^+ = V\Sigma^+ U^T$。避免套用 $(AB)^+ = B^+ A^+$ 这类对一般矩阵不成立的性质。

**错误 4 · 把奇异值非负误认为矩阵半正定**

原因：奇异值 $\sigma_i \geq 0$ 恒成立，初学时容易由此推断矩阵本身半正定。半正定性的判据是**所有特征值非负**（仅对对称矩阵定义），而奇异值非负是对任意矩阵成立的性质，两者无直接关联。例如 $\begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$ 的奇异值为 $\{1, 0\}$，但它不是对称矩阵，半正定概念根本不适用。

解决：区分**奇异值非负**（任意矩阵的普适性质）与**特征值非负**（半正定矩阵的判据，仅对对称矩阵定义）。判定半正定时先检查矩阵对称性，再用特征值符号判定；讨论矩阵的缩放强度或条件数时用奇异值。两者仅在实对称矩阵上有简单关系 $\sigma_i = |\lambda_i|$。