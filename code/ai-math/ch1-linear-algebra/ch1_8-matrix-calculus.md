---
title: 1.8 数值计算与稳定性
sidebar:
  order: 8
---
# 1.8 数值计算与稳定性

上一节我们建立了**奇异值分解** $A = U\Sigma V^T$，把**任意矩阵的分解**转化为可计算的代数工具——任何线性变换都可拆解为**旋转 → 缩放 → 旋转**的三步，四大子空间、低秩逼近、伪逆都在 SVD 的统一图景下找到位置。但 SVD 给出的是**静态**视角：它描述**矩阵本身的结构**，却未回答**矩阵如何随参数变化**——而当 AI 把矩阵视为可学习的**参数** $W$，需要最小化损失函数 $L(W)$ 时，我们必须追问一个全新的问题：**当 $W$ 发生微小变化时，$L$ 如何变化？** 这一问题把线性代数从**静态结构**推向**动态变化**，自然引出**矩阵微积分**。

更深层的挑战来自**计算机本身**。数学上**无穷小**的微分与**任意精度**的实数，在计算机中只能是**有限步迭代**和**有限位浮点数**。理论上正确的算法可能因浮点误差累积而失效；数学上简单的矩阵求逆可能因条件数过大而给出错误结果；理论上收敛的梯度下降可能因梯度消失或爆炸而无法训练。**数值稳定性**——算法在有限精度下仍能给出可靠结果的能力——是工程实现中不可回避的**误差哲学**。

本节将沿**矩阵微积分动机 → 求导法则 → 链式法则与反向传播 → 数值稳定性 → 矩阵分解算法 → 迭代方法 → AI 实战陷阱**这条主线，把**动态变化的矩阵**转化为可计算的代数工具，并铺设通往神经网络训练、自动微分、优化算法等 AI 核心技术的桥梁。本章也是第一章**线性代数**的最后一节——我们将在结尾回顾全章学习路径，把 1.1 至 1.8 节的概念整合为一张完整图景。

## 1.8.1 从静态矩阵到动态变化：微积分的引入

### 动机：为什么 AI 需要矩阵微积分？

承接 1.7 节 SVD 的静态视角，本节进入**动态变化**的世界。AI 中最核心的计算任务是**最小化损失函数**：给定训练数据 $\{(\mathbf{x}_i, y_i)\}_{i=1}^N$ 和模型 $f_\theta(\mathbf{x})$（参数 $\theta \in \mathbb{R}^d$），定义损失函数

$$
L(\theta) = \frac{1}{N} \sum_{i=1}^N \ell(f_\theta(\mathbf{x}_i), y_i)
$$

优化目标是最小化 $L(\theta)$。梯度下降法给出更新规则：

$$
\theta_{k+1} = \theta_k - \eta \cdot \nabla_\theta L
$$

其中 $\nabla_\theta L \in \mathbb{R}^d$ 是损失函数对参数的**梯度**。当参数以矩阵形式 $W \in \mathbb{R}^{m \times n}$ 出现时（如神经网络的权重矩阵），梯度 $\nabla_W L$ 也是一个 $m \times n$ 矩阵——这就是**矩阵微积分**的诞生动机：把**标量对矩阵的导数**转化为可计算的代数对象。

### 梯度的向量化定义

设 $f: \mathbb{R}^n \to \mathbb{R}$ 是 $n$ 元标量函数。$f$ 在点 $\mathbf{x}$ 处的**梯度**（Gradient）定义为：

$$
\nabla f(\mathbf{x}) = \left( \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \ldots, \frac{\partial f}{\partial x_n} \right)^T \in \mathbb{R}^n
$$

注意三点：

1. **梯度是列向量**：这是 AI 领域的**分母布局**约定（详见 1.8.2 节），让梯度与自变量 $\mathbf{x}$ 形状一致，便于更新 $\mathbf{x} \leftarrow \mathbf{x} - \eta \nabla f$。
2. **几何含义**：$\nabla f(\mathbf{x})$ 指向 $f$ 增长最快的方向，长度等于该方向的方向导数。
3. **梯度是局部的**：$\nabla f$ 依赖 $\mathbf{x}$，不同点的梯度不同——这是梯度下降**沿曲面滚动**的本质。

### 方向导数：梯度的投影

对单位向量 $\mathbf{u} \in \mathbb{R}^n$（$\|\mathbf{u}\| = 1$），$f$ 沿 $\mathbf{u}$ 方向的**方向导数**为：

$$
D_{\mathbf{u}} f(\mathbf{x}) = \nabla f(\mathbf{x})^T \mathbf{u}
$$

由 Cauchy-Schwarz 不等式，$|D_{\mathbf{u}} f| \leq \|\nabla f\| \cdot \|\mathbf{u}\| = \|\nabla f\|$，等号成立当且仅当 $\mathbf{u} = \nabla f / \|\nabla f\|$。这从数学上证明了**梯度方向是 $f$ 增长最快的方向**，而负梯度方向是 $f$ 下降最快的方向——这就是梯度下降的几何根源。

### 向量值函数的微分：雅可比矩阵

把 $f: \mathbb{R}^n \to \mathbb{R}$ 推广为 $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$（$m$ 个输出，$n$ 个输入），梯度概念升级为**雅可比矩阵**（Jacobian Matrix）：

$$
J_{\mathbf{f}}(\mathbf{x}) = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} = \begin{pmatrix} \frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\ \vdots & \ddots & \vdots \\ \frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n} \end{pmatrix} \in \mathbb{R}^{m \times n}
$$

雅可比矩阵的几何意义是**局部最佳线性逼近**（切映射）：在 $\mathbf{x}_0$ 附近，$\mathbf{f}(\mathbf{x}) \approx \mathbf{f}(\mathbf{x}_0) + J_{\mathbf{f}}(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$。这与 1.2 节**矩阵是线性变换**的视角呼应——雅可比矩阵把非线性变换 $\mathbf{f}$ 在局部线性化为矩阵 $J$，让我们能用线性代数工具分析非线性函数。

### 微分算子的线性性质

微分算子 $\nabla$ 是**线性算子**：

$$
\nabla(\alpha f + \beta g) = \alpha \nabla f + \beta \nabla g, \quad \alpha, \beta \in \mathbb{R}
$$

这一性质让梯度计算可分解为子项之和，是反向传播**逐节点求导**的代数基础。乘法法则（Leibniz 法则）和链式法则在多元情形下分别为：

$$
\nabla(f \cdot g) = g \cdot \nabla f + f \cdot \nabla g
$$

$$
\nabla_{\mathbf{x}}(f \circ g) = (J_g)^T \cdot \nabla_g f
$$

链式法则是 1.8.3 节反向传播的数学引擎，将在那里详细展开。

### 海森矩阵：二阶导数与曲率

设 $f: \mathbb{R}^n \to \mathbb{R}$ 二阶可微。$f$ 在 $\mathbf{x}$ 处的**海森矩阵**（Hessian Matrix）定义为：

$$
H_f(\mathbf{x}) = \nabla^2 f(\mathbf{x}) = \begin{pmatrix} \frac{\partial^2 f}{\partial x_1^2} & \frac{\partial^2 f}{\partial x_1 \partial x_2} & \cdots & \frac{\partial^2 f}{\partial x_1 \partial x_n} \\ \frac{\partial^2 f}{\partial x_2 \partial x_1} & \frac{\partial^2 f}{\partial x_2^2} & \cdots & \frac{\partial^2 f}{\partial x_2 \partial x_n} \\ \vdots & \vdots & \ddots & \vdots \\ \frac{\partial^2 f}{\partial x_n \partial x_1} & \frac{\partial^2 f}{\partial x_n \partial x_2} & \cdots & \frac{\partial^2 f}{\partial x_n^2} \end{pmatrix} \in \mathbb{R}^{n \times n}
$$

海森矩阵的两大性质：

1. **对称性**：当 $f$ 二阶连续可微时，$H_f$ 是对称矩阵（$H_{ij} = H_{ji}$），由 Schwarz 定理保证。这意味着 $H_f$ 可正交对角化（1.6.6 节谱定理），其特征值和特征向量揭示 $f$ 的局部曲率结构。
2. **几何意义**：$H_f$ 是 $f$ 在 $\mathbf{x}$ 处的**局部曲率张量**。$H_f$ 正定（所有特征值 $> 0$）意味着 $\mathbf{x}$ 是局部极小值点；负定对应极大值；不定（既有正也有负特征值）对应鞍点。

海森矩阵与 1.6 节的实对称矩阵理论对接：极小值判定 $\iff H_f \succ 0 \iff$ 所有特征值 $> 0$；曲率主轴方向 = $H_f$ 的特征向量；各方向曲率 = $H_f$ 的特征值。**优化中的曲率就是线性代数中的特征值**。

### 从一阶到二阶：牛顿法的几何动机

梯度下降只用一阶信息（梯度），收敛速度受限于曲率各向异性。**牛顿法**（Newton's Method）引入二阶信息（海森矩阵）：

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - H_f(\mathbf{x}_k)^{-1} \nabla f(\mathbf{x}_k)
$$

几何上，牛顿法是在当前点用二次函数 $f(\mathbf{x}) \approx f(\mathbf{x}_k) + \nabla f^T (\mathbf{x} - \mathbf{x}_k) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_k)^T H_f (\mathbf{x} - \mathbf{x}_k)$ 逼近 $f$，然后直接跳到这个二次函数的极小值点。由于二次函数的极小值为 $\mathbf{x}_{k+1} = \mathbf{x}_k - H_f^{-1} \nabla f$，这就是牛顿更新公式。

**优势**：在 $f$ 接近二次函数时（极小值附近），牛顿法**二阶收敛**——每步误差平方级减小，远快于梯度下降的线性收敛。

**劣势**：

1. **海森矩阵计算昂贵**：$n$ 维函数的 $H_f$ 有 $n(n+1)/2$ 个独立元素，计算和存储成本 $O(n^2)$。
2. **海森矩阵求逆 $O(n^3)$**：对深度网络（$n \sim 10^9$ 参数）完全不可行。
3. **非正定海森矩阵**：$H_f$ 不一定正定，牛顿方向可能是鞍点或极大值方向，需信赖域（Trust Region）或正则化 $H_f + \lambda I$ 修正。

实际工程中，纯牛顿法在深度学习中几乎不用，但其思想催生了**拟牛顿法**（BFGS、L-BFGS）——用梯度历史近似 $H_f^{-1}$，避免直接计算。L-BFGS 在传统机器学习（如逻辑回归、SVM）中是主流优化器，但在深度学习中仍嫌成本过高——主流仍是 Adam、SGD 等一阶方法配合自适应学习率。

### 海森矩阵的特征值几何

$H_f$ 是实对称矩阵，可正交对角化（1.6.6 节谱定理）$H_f = Q \Lambda Q^T$。在特征值基下，二阶逼近变为：

$$
f(\mathbf{x}) \approx f(\mathbf{x}_k) + \frac{1}{2} \sum_i \lambda_i y_i^2
$$

其中 $\mathbf{y} = Q^T (\mathbf{x} - \mathbf{x}_k)$。每个 $\lambda_i$ 是一个**主曲率方向**的曲率：

- $\lambda_i > 0$：该方向**上凸**（碗形），是上升方向。
- $\lambda_i < 0$：该方向**下凸**（倒碗形），是下降方向。
- $|\lambda_i|$ 大：曲率大，函数变化快，步长需小。
- $|\lambda_i|$ 小：曲率小，函数变化慢，可走大步。

**条件数 $\kappa(H_f) = \lambda_{\max} / \lambda_{\min}$ 决定梯度下降的收敛速度**：$\kappa$ 大则各方向曲率悬殊，梯度下降沿小曲率方向进展缓慢，沿大曲率方向易振荡——这就是 Rosenbrock 函数上梯度下降收敛缓慢的根源。

### Hessian-Vector 乘积：不显式构造海森矩阵

虽然显式构造 $H_f$ 需要 $O(n^2)$ 存储和 $O(n)$ 次梯度计算（对每个方向），但许多 AI 应用（如共轭梯度法、Krylov 子空间牛顿法、影响函数）只需要 $H_f \mathbf{v}$（海森矩阵乘以向量），而非 $H_f$ 本身。**Hessian-Vector Product**（HVP）通过**双重反向传播**在 $O(n)$ 时间内计算 $H_f \mathbf{v}$，无需显式构造 $H_f$：

$$
H_f \mathbf{v} = \nabla_\mathbf{x} \left( (\nabla_\mathbf{x} f)^T \mathbf{v} \right)
$$

即先对 $f$ 求梯度得 $\nabla f$，再对其与 $\mathbf{v}$ 的点积求梯度，得到 $H_f \mathbf{v}$。这一技术让**二阶方法**在深度学习中部分可行——如 K-FAC、Shampoo 等近似二阶优化器都依赖 HVP 的变种。

### Rosenbrock 函数：优化的经典测试案例

Rosenbrock 函数是优化算法的经典测试函数：

$$
f(x, y) = (1 - x)^2 + 100(y - x^2)^2
$$

其等高线呈**香蕉形**弯曲山谷，梯度下降沿山谷反复振荡，是检验优化算法的经典测试函数。在 $(0, 0)$ 处梯度为 $(-2, 0)^T$，看似简单，但海森矩阵特征值揭示出强各向异性——长轴和短轴方向曲率相差百倍，这是优化缓慢的根源。

::: key-idea 梯度是 AI 优化的核心
梯度 $\nabla f$ 把**函数变化率**这一无穷小概念转化为有限维向量，让**寻找极小值**从抽象的微积分问题变为可迭代的代数算法。梯度方向是函数增长最快的方向，负梯度方向是下降最快的方向——这就是梯度下降的几何根源。海森矩阵进一步刻画**曲率**，决定梯度下降的收敛速度：沿小曲率方向进展缓慢，沿大曲率方向易振荡。理解**梯度 + 海森**的几何意义，就是掌握了 AI 优化算法（梯度下降、牛顿法、共轭梯度）的数学基础。
:::

```python
import numpy as np

# 用 numpy 数值计算 Rosenbrock 函数的梯度和海森矩阵
def rosenbrock(x, y):
    return (1 - x)**2 + 100 * (y - x**2)**2

def rosenbrock_grad(x, y):
    # 解析梯度
    df_dx = -2 * (1 - x) - 400 * x * (y - x**2)
    df_dy = 200 * (y - x**2)
    return np.array([df_dx, df_dy])

def rosenbrock_hessian(x, y):
    # 解析海森矩阵
    d2f_dx2 = 2 - 400 * (y - x**2) + 800 * x**2
    d2f_dxdy = -400 * x
    d2f_dy2 = 200
    return np.array([[d2f_dx2, d2f_dxdy],
                     [d2f_dxdy, d2f_dy2]])

# 在 (0, 0) 处计算
x0, y0 = 0.0, 0.0
print(f"Rosenbrock 函数在 ({x0}, {y0}) 处:")
print(f"  f(x, y) = {rosenbrock(x0, y0)}")
print(f"  ∇f = {rosenbrock_grad(x0, y0)}")
print(f"  H_f =\n{rosenbrock_hessian(x0, y0)}")

# 海森矩阵的特征值揭示曲率
H = rosenbrock_hessian(x0, y0)
eigvals, eigvecs = np.linalg.eigh(H)
print(f"\n海森矩阵特征值: {eigvals}")
print(f"  特征向量 (主轴方向):\n{eigvecs}")
print(f"  → 曲率比 = {max(eigvals)/min(eigvals):.1f}（极强各向异性，优化困难）")

# 在最小值点 (1, 1) 处
x1, y1 = 1.0, 1.0
print(f"\nRosenbrock 函数在 ({x1}, {y1}) 处:")
print(f"  f(x, y) = {rosenbrock(x1, y1)}")
print(f"  ∇f = {rosenbrock_grad(x1, y1)} (应为零向量)")
H_min = rosenbrock_hessian(x1, y1)
eigvals_min, _ = np.linalg.eigh(H_min)
print(f"  H_f 特征值: {eigvals_min} (全正 → 局部极小值)")
print(f"  → 在最优点处曲率比 = {max(eigvals_min)/min(eigvals_min):.1f}")
```

```python
# 用 sympy 符号计算梯度和海森矩阵（机器精度，无数值误差）
import sympy as sp

x, y = sp.symbols('x y')
f = (1 - x)**2 + 100 * (y - x**2)**2

# 符号梯度
grad = sp.Matrix([sp.diff(f, x), sp.diff(f, y)])
print(f"f = {f}")
print(f"∇f = {grad.T}")

# 符号海森矩阵
H = sp.hessian(f, (x, y))
print(f"\nH_f =\n{H}")

# 验证海森矩阵对称
print(f"\nH_f 对称? {H == H.T}")

# 在 (0, 0) 处求值
subs = {x: 0, y: 0}
print(f"\n在 (0, 0) 处:")
print(f"  ∇f = {grad.subs(subs).T}")
print(f"  H_f = {H.subs(subs)}")
print(f"  特征值 = {H.subs(subs).eigenvals()}")

# 在 (1, 1) 处求值
subs_min = {x: 1, y: 1}
print(f"\n在 (1, 1) 处:")
print(f"  ∇f = {grad.subs(subs_min).T} (应为零)")
print(f"  H_f = {H.subs(subs_min)}")
print(f"  特征值 = {H.subs(subs_min).eigenvals()} (全正 → 极小值)")

# 几何意义：海森矩阵特征值 = 曲率
# 大特征值方向：曲率大，函数变化快，步长需小
# 小特征值方向：曲率小，函数变化慢，可走大步
# 这就是为什么梯度下降在 Rosenbrock 上振荡：曲率各向异性
```

```python
import numpy as np
import matplotlib.pyplot as plt

# 可视化 Rosenbrock 函数的等高线 + 梯度场
def rosenbrock(x, y):
    return (1 - x)**2 + 100 * (y - x**2)**2

def rosenbrock_grad(x, y):
    df_dx = -2 * (1 - x) - 400 * x * (y - x**2)
    df_dy = 200 * (y - x**2)
    return df_dx, df_dy

# 生成网格
x = np.linspace(-1.5, 1.5, 50)
y = np.linspace(-0.5, 2.0, 50)
X, Y = np.meshgrid(x, y)
Z = rosenbrock(X, Y)

# 梯度场（稀疏采样）
x_sparse = np.linspace(-1.5, 1.5, 15)
y_sparse = np.linspace(-0.5, 2.0, 15)
Xs, Ys = np.meshgrid(x_sparse, y_sparse)
Gx, Gy = rosenbrock_grad(Xs, Ys)
G_norm = np.sqrt(Gx**2 + Gy**2)
# 归一化箭头长度，便于可视化
Gx_norm = Gx / (G_norm + 1e-10)
Gy_norm = Gy / (G_norm + 1e-10)

fig, ax = plt.subplots(1, 1, figsize=(10, 7))

# 等高线（log 尺度显示香蕉形山谷）
contour = ax.contour(X, Y, Z, levels=np.logspace(-1, 3, 20),
                     cmap='viridis', alpha=0.8)
ax.clabel(contour, inline=True, fontsize=8, fmt='%.1f')

# 梯度场（红色箭头）
ax.quiver(Xs, Ys, Gx_norm, Gy_norm, color='red', alpha=0.6, scale=30)

# 标注最小值点
ax.plot(1, 1, 'r*', markersize=20, label='最小值 (1, 1)')

ax.set_xlabel('x')
ax.set_ylabel('y')
ax.set_title('Rosenbrock 函数：等高线 + 梯度场\n（红色箭头指向函数增长最快方向）')
ax.legend()
ax.set_aspect('equal')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('rosenbrock_gradient_field.png', dpi=100, bbox_inches='tight')
plt.show()
print("图像已保存为 rosenbrock_gradient_field.png")
print("几何解读:")
print("  - 等高线呈香蕉形弯曲山谷")
print("  - 梯度（红箭头）始终指向最陡上升方向")
print("  - 沿山谷方向（小曲率）梯度小，进展缓慢")
print("  - 垂直山谷方向（大曲率）梯度大，易振荡")
```

<ClientOnly>
<GradientFlowField title="梯度流场探索器 · Rosenbrock 等高线 + 梯度向量场 · 拖拽起点观察梯度下降轨迹" />
</ClientOnly>

## 1.8.2 核心求导法则：布局约定与典型公式

### 布局约定的两难：分子 vs 分母

承接 1.8.1 的梯度定义，本节系统化**矩阵微积分**的求导法则。当一个量对另一个量求导时，结果如何排列？这看似平凡的问题在矩阵微积分中是关键——排列方式不同，公式形式迥异。

考虑标量 $f$ 对向量 $\mathbf{x} \in \mathbb{R}^n$ 求导。$f$ 是 $1 \times 1$，$\mathbf{x}$ 是 $n \times 1$。两种布局：

- **分子布局（Numerator Layout）**：结果形状与分子 $f$ 一致扩展，即 $1 \times n$ 行向量。$\frac{\partial f}{\partial \mathbf{x}} = (\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n})$。
- **分母布局（Denominator Layout）**：结果形状与分母 $\mathbf{x}$ 一致，即 $n \times 1$ 列向量。$\frac{\partial f}{\partial \mathbf{x}} = (\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n})^T$。

### AI 领域的工程选择：分母布局

机器学习与深度学习领域几乎一致采用**分母布局**：

- 标量 $f$ 对向量 $\mathbf{x} \in \mathbb{R}^n$ 求导 → 列向量 $\nabla_\mathbf{x} f \in \mathbb{R}^n$
- 标量 $f$ 对矩阵 $X \in \mathbb{R}^{m \times n}$ 求导 → 矩阵 $\nabla_X f \in \mathbb{R}^{m \times n}$

**核心原则**：梯度的形状始终与自变量一致。这一约定让梯度下降的更新 $\theta \leftarrow \theta - \eta \nabla_\theta L$ 形状自洽——这是 1.8.3 节**形状法则**的基础。

但需注意：分母布局下，向量对向量求导得到的是**分母转置**的雅可比矩阵，即 $J \in \mathbb{R}^{n \times m}$（$\mathbf{f}: \mathbb{R}^m \to \mathbb{R}^n$）。这与 1.8.1 节给出的**分子布局雅可比**互为转置。本节及后续均采用分母布局，并相应调整公式。

::: warning 布局约定必须统一，否则公式混乱
矩阵微积分的**两种布局**是历史遗留：物理学传统偏好分子布局（与张量分析一致），机器学习传统偏好分母布局（与梯度下降形状自洽）。**致命错误**是在同一项目中混用两种布局——例如某论文的 $\nabla_x x^T A x$ 给出 $2Ax$（分母布局），另一论文给出 $2x^T A$（分子布局），若不区分会导致代码中形状对齐错误。工程实践：在项目 README 中明确声明**本节采用分母布局**，所有公式按此约定书写；阅读他人论文时，先翻到公式表确认布局再代入代码。
:::

### 标量对向量的核心公式

以下公式全部采用分母布局。设 $\mathbf{x} \in \mathbb{R}^n$，$\mathbf{a} \in \mathbb{R}^n$ 为常向量，$A \in \mathbb{R}^{n \times n}$ 为常矩阵。

**公式 1：线性函数**

$$
\nabla_\mathbf{x}(\mathbf{a}^T \mathbf{x}) = \mathbf{a}
$$

证明：$\mathbf{a}^T \mathbf{x} = \sum_i a_i x_i$，故 $\frac{\partial}{\partial x_i} = a_i$，梯度为 $\mathbf{a}$。

**公式 2：二次型**

$$
\nabla_\mathbf{x}(\mathbf{x}^T A \mathbf{x}) = (A + A^T) \mathbf{x}
$$

当 $A$ 对称时简化为 $2A\mathbf{x}$。这是 AI 中常见的公式之一：MSE 损失 $L = \mathbf{x}^T A \mathbf{x}$ 的梯度即为 $(A + A^T)\mathbf{x}$。

**公式 3：欧氏范数平方**

$$
\nabla_\mathbf{x} \|\mathbf{x}\|^2 = \nabla_\mathbf{x}(\mathbf{x}^T \mathbf{x}) = 2\mathbf{x}
$$

这是公式 2 中 $A = I$ 的特例。梯度裁剪（1.8.7 节）就是基于此公式。

**公式 4：向量范数**

$$
\nabla_\mathbf{x} \|\mathbf{x}\| = \frac{\mathbf{x}}{\|\mathbf{x}\|}
$$

（$\mathbf{x} \neq \mathbf{0}$）此公式在归一化、Adam 优化器中频繁出现。

### 向量对向量的雅可比

设 $\mathbf{f}(\mathbf{x}) = A\mathbf{x}$（$\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$，$A \in \mathbb{R}^{m \times n}$）。在分母布局下，雅可比为：

$$
\frac{\partial \mathbf{f}}{\partial \mathbf{x}} = A^T \in \mathbb{R}^{n \times m}
$$

注意分母布局下雅可比的形状是 $n \times m$（输入维度 × 输出维度）。这是神经网络反向传播的基石——全连接层的雅可比就是权重矩阵的转置。

### 标量对矩阵的核心公式

矩阵求导在神经网络中是核心——损失对权重矩阵 $W$ 的梯度就是此类公式。

**公式 5：迹的线性求导**

$$
\nabla_X \text{tr}(AX) = A^T
$$

（$X \in \mathbb{R}^{m \times n}$，$A \in \mathbb{R}^{n \times m}$）。迹 $\text{tr}(AX) = \sum_{i,j} A_{ij} X_{ji}$，故 $\frac{\partial}{\partial X_{ij}} = A_{ji}$，整理为矩阵形式即 $A^T$。

**公式 6：二次迹**

$$
\nabla_X \text{tr}(X^T A X) = (A + A^T) X
$$

当 $A$ 对称时简化为 $2AX$。这与公式 2 的向量情形完全平行。

**公式 7：对数行列式**

$$
\nabla_X \log \det(X) = X^{-T} = (X^{-1})^T
$$

（$X$ 可逆）。此公式在最大似然估计（MLE）中重要：多元高斯分布的对数似然含 $\log \det \Sigma$ 项，对其求导即得此公式。

**公式 8：逆矩阵的微分**

$$
d(X^{-1}) = -X^{-1} (dX) X^{-1}
$$

这是矩阵微分的**链式法则**基础——任何涉及 $X^{-1}$ 的复合函数求导都需要此公式。

### 公式之间的内在联系

上述公式构成一个连贯体系：

- 公式 3（$\nabla \|\mathbf{x}\|^2 = 2\mathbf{x}$）是公式 2（$A = I$）的特例。
- 公式 5（$\nabla \text{tr}(AX) = A^T$）是公式 6（$A$ 退化）的特例。
- 公式 4（$\nabla \|\mathbf{x}\| = \mathbf{x}/\|\mathbf{x}\|$）由公式 3 通过链式法则导出。

掌握这些公式的关键在于理解它们的共同结构：**求导是把矩阵运算转化为形状对齐的转置操作**。每一公式都可从**逐元素求导 + 重组为矩阵**的笨办法推得，但记熟典型公式可极大加速推导。

```python
import numpy as np

# 数值验证所有核心公式
np.random.seed(42)

# 公式 1: ∇(a^T x) = a
n = 4
a = np.random.randn(n)
x = np.random.randn(n)
f = a @ x
grad_numerical = np.zeros(n)
eps = 1e-6
for i in range(n):
    x_plus = x.copy(); x_plus[i] += eps
    x_minus = x.copy(); x_minus[i] -= eps
    grad_numerical[i] = (a @ x_plus - a @ x_minus) / (2 * eps)
grad_analytical = a
print(f"公式 1: ∇(a^T x) = a")
print(f"  解析: {grad_analytical}")
print(f"  数值: {grad_numerical}")
print(f"  一致? {np.allclose(grad_analytical, grad_numerical)}")

# 公式 2: ∇(x^T A x) = (A + A^T) x
A = np.random.randn(n, n)
f = x @ A @ x
grad_numerical = np.zeros(n)
for i in range(n):
    x_plus = x.copy(); x_plus[i] += eps
    x_minus = x.copy(); x_minus[i] -= eps
    grad_numerical[i] = (x_plus @ A @ x_plus - x_minus @ A @ x_minus) / (2 * eps)
grad_analytical = (A + A.T) @ x
print(f"\n公式 2: ∇(x^T A x) = (A + A^T) x")
print(f"  解析: {grad_analytical}")
print(f"  数值: {grad_numerical}")
print(f"  一致? {np.allclose(grad_analytical, grad_numerical)}")

# 对称 A 时简化为 2 A x
A_sym = A + A.T  # 对称化
grad_sym = 2 * A_sym @ x
print(f"  A 对称时: 2 A x = {grad_sym}")
print(f"  与 (A+A^T)x 一致? {np.allclose(grad_sym, (A_sym + A_sym.T) @ x)}")

# 公式 3: ∇||x||^2 = 2x
f = np.dot(x, x)
grad_numerical = np.zeros(n)
for i in range(n):
    x_plus = x.copy(); x_plus[i] += eps
    x_minus = x.copy(); x_minus[i] -= eps
    grad_numerical[i] = (np.dot(x_plus, x_plus) - np.dot(x_minus, x_minus)) / (2 * eps)
print(f"\n公式 3: ∇||x||^2 = 2x")
print(f"  解析: {2 * x}")
print(f"  数值: {grad_numerical}")
print(f"  一致? {np.allclose(2 * x, grad_numerical)}")
```

```python
import numpy as np

# 验证矩阵求导公式
np.random.seed(42)
m, n = 3, 4
X = np.random.randn(m, n)
A = np.random.randn(n, m)
eps = 1e-6

# 公式 5: ∇_X tr(A X) = A^T
f = np.trace(A @ X)
grad_numerical = np.zeros((m, n))
for i in range(m):
    for j in range(n):
        X_plus = X.copy(); X_plus[i, j] += eps
        X_minus = X.copy(); X_minus[i, j] -= eps
        grad_numerical[i, j] = (np.trace(A @ X_plus) - np.trace(A @ X_minus)) / (2 * eps)
grad_analytical = A.T
print(f"公式 5: ∇_X tr(A X) = A^T")
print(f"  解析:\n{grad_analytical}")
print(f"  数值:\n{grad_numerical}")
print(f"  一致? {np.allclose(grad_analytical, grad_numerical)}")

# 公式 6: ∇_X tr(X^T A X) = (A + A^T) X
# 这里 X 是 m×n, A 必须是 m×m
A_sq = np.random.randn(m, m)
f = np.trace(X.T @ A_sq @ X)
grad_numerical = np.zeros((m, n))
for i in range(m):
    for j in range(n):
        X_plus = X.copy(); X_plus[i, j] += eps
        X_minus = X.copy(); X_minus[i, j] -= eps
        grad_numerical[i, j] = (np.trace(X_plus.T @ A_sq @ X_plus) -
                                  np.trace(X_minus.T @ A_sq @ X_minus)) / (2 * eps)
grad_analytical = (A_sq + A_sq.T) @ X
print(f"\n公式 6: ∇_X tr(X^T A X) = (A + A^T) X")
print(f"  解析:\n{grad_analytical}")
print(f"  数值:\n{grad_numerical}")
print(f"  一致? {np.allclose(grad_analytical, grad_numerical)}")

# 公式 7: ∇_X log det(X) = X^-T
X_sq = np.random.randn(4, 4) + 2 * np.eye(4)  # 确保正定可逆
f = np.log(np.linalg.det(X_sq))
grad_numerical = np.zeros((4, 4))
for i in range(4):
    for j in range(4):
        X_plus = X_sq.copy(); X_plus[i, j] += eps
        X_minus = X_sq.copy(); X_minus[i, j] -= eps
        grad_numerical[i, j] = (np.log(np.linalg.det(X_plus)) -
                                  np.log(np.linalg.det(X_minus))) / (2 * eps)
grad_analytical = np.linalg.inv(X_sq).T
print(f"\n公式 7: ∇_X log det(X) = X^-T")
print(f"  解析:\n{grad_analytical}")
print(f"  数值:\n{grad_numerical}")
print(f"  一致? {np.allclose(grad_analytical, grad_numerical)}")

# 公式 8: d(X^-1) = -X^-1 (dX) X^-1
# 验证: 对 X^-1 求导的方向是 -X^-1 E_ij X^-1
X_inv = np.linalg.inv(X_sq)
dX = np.zeros((4, 4))
dX[1, 2] = 1.0  # 单位扰动
# 数值 d(X^-1)
X_perturbed = X_sq + eps * dX
d_inv_numerical = (np.linalg.inv(X_perturbed) - X_inv) / eps
# 解析 d(X^-1) = -X^-1 (dX) X^-1
d_inv_analytical = -X_inv @ dX @ X_inv
print(f"\n公式 8: d(X^-1) = -X^-1 (dX) X^-1")
print(f"  解析:\n{d_inv_analytical}")
print(f"  数值:\n{d_inv_numerical}")
print(f"  一致? {np.allclose(d_inv_analytical, d_inv_numerical)}")
```

<ClientOnly>
<GradientFlowField title="矩阵求导法则可视化 · 二次型曲面 + 梯度向量场 · 验证 ∇(x^T A x) = (A+A^T)x" />
</ClientOnly>

## 1.8.3 链式法则与反向传播：AI 的数学引擎

### 矩阵微积分中的链式法则

承接 1.8.2 的求导公式，本节给出 AI 训练的数学引擎——链式法则。设复合函数 $L = f(\mathbf{Y})$，$\mathbf{Y} = g(\mathbf{X})$，其中 $\mathbf{X} \in \mathbb{R}^n$，$\mathbf{Y} \in \mathbb{R}^m$，$L \in \mathbb{R}$。链式法则给出：

$$
\nabla_\mathbf{X} L = \left(\frac{\partial \mathbf{Y}}{\partial \mathbf{X}}\right)^T \nabla_\mathbf{Y} L
$$

其中 $\frac{\partial \mathbf{Y}}{\partial \mathbf{X}}$ 是雅可比矩阵（分母布局下为 $n \times m$）。这一公式把**对复合函数求导**分解为**局部雅可比 × 上游梯度**——每一步只关心自己节点的局部导数，无需了解全局结构。

### 反向传播的数学本质

**反向传播**（Backpropagation）就是链式法则在计算图上的系统化应用。考虑一个三层神经网络：

$$
\mathbf{h}_1 = \sigma(W_1 \mathbf{x}), \quad \mathbf{h}_2 = \sigma(W_2 \mathbf{h}_1), \quad \hat{y} = W_3 \mathbf{h}_2, \quad L = \ell(\hat{y}, y)
$$

要计算 $\nabla_{W_1} L$，需依次应用链式法则：

$$
\nabla_{W_1} L = \frac{\partial L}{\partial \hat{y}} \cdot \frac{\partial \hat{y}}{\partial \mathbf{h}_2} \cdot \frac{\partial \mathbf{h}_2}{\partial \mathbf{h}_1} \cdot \frac{\partial \mathbf{h}_1}{\partial W_1}
$$

每一项都是局部雅可比，逐项相乘得到完整梯度。**反向传播的关键洞察**：从输出端开始，**反向**逐层计算并缓存中间梯度 $\nabla_\mathbf{h} L$，避免重复计算。这一**动态规划**思想让复杂网络的梯度计算复杂度仅与节点数成正比，避免了指数增长。

### 计算图视角

**计算图**（Computational Graph）把复合函数拆解为原子操作的有向无环图（DAG）。每个节点执行一个简单运算（加、乘、矩阵乘、激活等），每条边传递梯度。反向传播算法分两阶段：

1. **前向传播**：从输入到输出依次计算每个节点的值，缓存中间结果。
2. **反向传播**：从输出到输入依次计算每个节点的局部梯度，与上游梯度相乘累加。

例如 $L = (a + b) \cdot c$，其中 $a = 2, b = 3, c = 4$：

- 前向：$u = a + b = 5$，$L = u \cdot c = 20$。
- 反向：$\frac{\partial L}{\partial u} = c = 4$，$\frac{\partial L}{\partial c} = u = 5$；进一步 $\frac{\partial L}{\partial a} = \frac{\partial L}{\partial u} \cdot 1 = 4$，$\frac{\partial L}{\partial b} = 4$。

计算图让**任意复杂函数的求导**变为**标准化的图遍历**——这是 PyTorch、TensorFlow 等框架的理论基础。

### 全连接层的反向传播

考虑全连接层 $\mathbf{Y} = W \mathbf{X}$（$W \in \mathbb{R}^{m \times n}$，$\mathbf{X} \in \mathbb{R}^n$，$\mathbf{Y} \in \mathbb{R}^m$），已知上游梯度 $\nabla_\mathbf{Y} L \in \mathbb{R}^m$。求 $\nabla_W L$ 和 $\nabla_\mathbf{X} L$。

**对 $W$ 求导**：$\mathbf{Y}_i = \sum_j W_{ij} X_j$，故 $\frac{\partial \mathbf{Y}_i}{\partial W_{ij}} = X_j$。结合链式法则：

$$
\frac{\partial L}{\partial W_{ij}} = \sum_k \frac{\partial L}{\partial \mathbf{Y}_k} \cdot \frac{\partial \mathbf{Y}_k}{\partial W_{ij}} = \frac{\partial L}{\partial \mathbf{Y}_i} \cdot X_j
$$

整理为矩阵形式：

$$
\nabla_W L = (\nabla_\mathbf{Y} L) \cdot \mathbf{X}^T
$$

**对 $\mathbf{X}$ 求导**：类似推导得：

$$
\nabla_\mathbf{X} L = W^T \cdot (\nabla_\mathbf{Y} L)
$$

这两条公式是神经网络反向传播的**原子操作**——每个全连接层的反向传播都是这两步。注意一个对称性：**前向用 $W$，反向用 $W^T$**——权重矩阵在两个方向上**互为转置**地使用，这是线性代数对称性的体现。

### 激活函数的雅可比

激活函数 $\sigma$ 逐元素作用：$\mathbf{h} = \sigma(\mathbf{z})$，$\mathbf{z} \in \mathbb{R}^n$。其雅可比是对角矩阵：

$$
\frac{\partial \mathbf{h}}{\partial \mathbf{z}} = \text{diag}(\sigma'(\mathbf{z}_1), \sigma'(\mathbf{z}_2), \ldots, \sigma'(\mathbf{z}_n))
$$

**ReLU 激活**：$\sigma(z) = \max(0, z)$，导数为 $\sigma'(z) = \begin{cases} 1, & z > 0 \\ 0, & z \leq 0 \end{cases}$。雅可比是对角阵，对角元为 1 或 0——这意味着 ReLU 反向传播**门控**梯度（仅正输入传递梯度，负输入阻断）。

**Sigmoid 激活**：$\sigma(z) = \frac{1}{1 + e^{-z}}$，导数为 $\sigma'(z) = \sigma(z)(1 - \sigma(z))$。当 $|z|$ 较大时 $\sigma(z)$ 饱和（接近 0 或 1），导数接近 0——这就是**梯度消失**的根源（详见 1.8.4 节）。

**Tanh 激活**：$\sigma(z) = \tanh(z)$，导数为 $1 - \tanh^2(z)$。比 Sigmoid 导数最大值更大（1 vs 0.25），梯度消失问题稍轻。

### 维度对齐的形状法则

反向传播的工程实现有一条基本准则：**梯度的形状必须与变量的形状一致**。这条**形状法则**是调试神经网络的第一工具：

- $W \in \mathbb{R}^{m \times n}$ → $\nabla_W L \in \mathbb{R}^{m \times n}$
- $\mathbf{b} \in \mathbb{R}^m$ → $\nabla_\mathbf{b} L \in \mathbb{R}^m$
- $X \in \mathbb{R}^{n \times d}$ → $\nabla_X L \in \mathbb{R}^{n \times d}$

若计算出的梯度形状不对，必然是某个矩阵乘法顺序、转置或求和出错。这一**形状一致性检查**可在代码中通过 `assert grad.shape == var.shape` 自动验证，是工程实践的必备防御。

### 形状法则速查表

常见神经网络运算的梯度形状速查（分母布局）：

| 前向运算                                 | 输入形状                                                           | 输出形状                        | $\nabla_\text{输入} L$ 公式                                           | 形状           |
| ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------- | -------------- |
| $\mathbf{y} = W\mathbf{x}$             | $W \in \mathbb{R}^{m \times n}$, $\mathbf{x} \in \mathbb{R}^n$ | $\mathbf{y} \in \mathbb{R}^m$ | $\nabla_W L = (\nabla_\mathbf{y} L) \mathbf{x}^T$                     | $m \times n$ |
| $\mathbf{y} = W\mathbf{x}$             | 同上                                                               | 同上                            | $\nabla_\mathbf{x} L = W^T (\nabla_\mathbf{y} L)$                     | $n$          |
| $\mathbf{y} = \mathbf{x} + \mathbf{b}$ | $\mathbf{b} \in \mathbb{R}^n$                                    | $\mathbf{y} \in \mathbb{R}^n$ | $\nabla_\mathbf{b} L = \nabla_\mathbf{y} L$                           | $n$          |
| $\mathbf{y} = \sigma(\mathbf{z})$      | $\mathbf{z} \in \mathbb{R}^n$                                    | $\mathbf{y} \in \mathbb{R}^n$ | $\nabla_\mathbf{z} L = \nabla_\mathbf{y} L \odot \sigma'(\mathbf{z})$ | $n$          |
| $\mathbf{y} = X\mathbf{w}$             | $X \in \mathbb{R}^{m \times n}$, $\mathbf{w} \in \mathbb{R}^n$ | $\mathbf{y} \in \mathbb{R}^m$ | $\nabla_X L = (\nabla_\mathbf{y} L) \mathbf{w}^T$                     | $m \times n$ |

其中 $\odot$ 表示按元素乘（Hadamard 积）。这张速查表是工程实现反向传播的参考依据——遇到新运算时，先推导其局部雅可比，再用**上游梯度 × 雅可比**得到下游梯度，最后用形状法则验证。

::: tip 形状法则是调试神经网络的第一工具
当反向传播代码出现 NaN 或训练不收敛时，**第一步永远是检查每个梯度的形状**——而不是怀疑算法本身。`assert grad_W.shape == W.shape` 这一行简单的断言可定位 90% 的反向传播 bug。进一步可检查梯度的数值范围（是否过大爆炸、过小消失）、权重更新方向（是否与梯度反向）。掌握**形状法则 + 数值范围检查**两大工具，就是掌握了神经网络调试的核心方法论。
:::

```python
import numpy as np

# 手动实现 2-3-1 神经网络的前向 + 反向传播
# 网络结构: 输入 2 → 隐藏 3 (sigmoid) → 输出 1 (线性)
# 损失: MSE

np.random.seed(42)

# 初始化权重
W1 = np.random.randn(3, 2) * 0.5  # 3x2
b1 = np.zeros((3, 1))             # 3x1
W2 = np.random.randn(1, 3) * 0.5  # 1x3
b2 = np.zeros((1, 1))             # 1x1

# 训练样本
X = np.array([[0.5, 0.3]]).T      # 2x1
y = np.array([[0.7]])             # 1x1

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def sigmoid_deriv(z):
    s = sigmoid(z)
    return s * (1 - s)

# 前向传播
z1 = W1 @ X + b1                  # 3x1
h1 = sigmoid(z1)                  # 3x1
z2 = W2 @ h1 + b2                 # 1x1
y_hat = z2                        # 1x1 (线性输出)

# 损失
L = 0.5 * (y_hat - y) ** 2
print(f"前向传播:")
print(f"  X = {X.flatten()}")
print(f"  z1 = {z1.flatten()}")
print(f"  h1 = {h1.flatten()}")
print(f"  y_hat = {y_hat.flatten()}")
print(f"  L = {L.flatten()}")

# 反向传播
# 1. 输出层梯度: dL/dy_hat = y_hat - y
dL_dy_hat = y_hat - y             # 1x1
print(f"\n反向传播:")
print(f"  dL/dy_hat = {dL_dy_hat.flatten()}")

# 2. 对 W2, b2 求导
# y_hat = W2 @ h1 + b2, 故 dL/dW2 = dL/dy_hat @ h1^T
dL_dW2 = dL_dy_hat @ h1.T         # 1x3
dL_db2 = dL_dy_hat                # 1x1
print(f"  dL/dW2 = {dL_dW2.flatten()} (形状 {dL_dW2.shape}, 应为 (1, 3))")
print(f"  dL/db2 = {dL_db2.flatten()}")

# 3. 对 h1 求导 (传给上游)
# y_hat = W2 @ h1, 故 dL/dh1 = W2^T @ dL/dy_hat
dL_dh1 = W2.T @ dL_dy_hat         # 3x1
print(f"  dL/dh1 = {dL_dh1.flatten()} (形状 {dL_dh1.shape}, 应为 (3, 1))")

# 4. 通过 sigmoid 反传
# h1 = sigmoid(z1), 故 dL/dz1 = dL/dh1 ⊙ sigmoid'(z1)
dL_dz1 = dL_dh1 * sigmoid_deriv(z1)  # 3x1
print(f"  dL/dz1 = {dL_dz1.flatten()}")

# 5. 对 W1, b1 求导
# z1 = W1 @ X + b1, 故 dL/dW1 = dL/dz1 @ X^T
dL_dW1 = dL_dz1 @ X.T             # 3x2
dL_db1 = dL_dz1                   # 3x1
print(f"  dL/dW1 =\n{dL_dW1} (形状 {dL_dW1.shape}, 应为 (3, 2))")
print(f"  dL/db1 = {dL_db1.flatten()}")

# 形状法则验证
assert dL_dW1.shape == W1.shape, "dL/dW1 形状错误"
assert dL_db1.shape == b1.shape, "dL/db1 形状错误"
assert dL_dW2.shape == W2.shape, "dL/dW2 形状错误"
assert dL_db2.shape == b2.shape, "dL/db2 形状错误"
print(f"\n形状法则验证: 所有梯度形状与对应变量一致")
```

```python
import numpy as np

# 用数值梯度验证手动反向传播的正确性
np.random.seed(42)

W1 = np.random.randn(3, 2) * 0.5
b1 = np.zeros((3, 1))
W2 = np.random.randn(1, 3) * 0.5
b2 = np.zeros((1, 1))

X = np.array([[0.5, 0.3]]).T
y = np.array([[0.7]])

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def forward_loss(W1, b1, W2, b2, X, y):
    z1 = W1 @ X + b1
    h1 = sigmoid(z1)
    z2 = W2 @ h1 + b2
    y_hat = z2
    L = 0.5 * (y_hat - y) ** 2
    return L.item()

# 数值梯度（中心差分）
def numerical_grad(f, param, eps=1e-6):
    grad = np.zeros_like(param)
    it = np.nditer(param, flags=['multi_index'])
    while not it.finished:
        idx = it.multi_index
        orig = param[idx]
        param[idx] = orig + eps
        f_plus = f(param)
        param[idx] = orig - eps
        f_minus = f(param)
        param[idx] = orig
        grad[idx] = (f_plus - f_minus) / (2 * eps)
        it.iternext()
    return grad

# 对 W1 的数值梯度
f_W1 = lambda W: forward_loss(W, b1, W2, b2, X, y)
grad_W1_num = numerical_grad(f_W1, W1)

# 对 W2 的数值梯度
f_W2 = lambda W: forward_loss(W1, b1, W, b2, X, y)
grad_W2_num = numerical_grad(f_W2, W2)

# 重新计算解析梯度（同上节代码）
z1 = W1 @ X + b1
h1 = sigmoid(z1)
z2 = W2 @ h1 + b2
y_hat = z2
dL_dy_hat = y_hat - y
dL_dW2 = dL_dy_hat @ h1.T
dL_dh1 = W2.T @ dL_dy_hat
def sigmoid_deriv(z):
    s = sigmoid(z); return s * (1 - s)
dL_dz1 = dL_dh1 * sigmoid_deriv(z1)
dL_dW1 = dL_dz1 @ X.T

# 对比
print(f"W1 梯度对比:")
print(f"  解析:\n{dL_dW1}")
print(f"  数值:\n{grad_W1_num}")
print(f"  误差范数: {np.linalg.norm(dL_dW1 - grad_W1_num):.2e}")
print(f"  一致? {np.allclose(dL_dW1, grad_W1_num, atol=1e-6)}")

print(f"\nW2 梯度对比:")
print(f"  解析: {dL_dW2.flatten()}")
print(f"  数值: {grad_W2_num.flatten()}")
print(f"  误差范数: {np.linalg.norm(dL_dW2 - grad_W2_num):.2e}")
print(f"  一致? {np.allclose(dL_dW2, grad_W2_num, atol=1e-6)}")

print(f"\n→ 解析反向传播与数值梯度一致，验证正确")
print(f"→ 这也是 PyTorch autograd 的验证方法（gradcheck）")
```

<ClientOnly>
<GradientFlowField title="链式法则与梯度回传可视化 · 多层网络梯度流 · 形状法则动画演示" />
</ClientOnly>

## 1.8.4 数值稳定性：计算机中的误差哲学

### 浮点数表示的局限

承接 1.8.3 的反向传播理论，本节直面**理论与代码的鸿沟**——计算机中的数值误差。IEEE 754 双精度浮点数用 64 位表示实数：1 位符号、11 位指数、52 位尾数。这一表示有两大局限：

1. **有限的精度**：尾数 52 位意味着相对精度约 $2^{-52} \approx 2.22 \times 10^{-16}$（机器精度 $\epsilon_{\text{mach}}$）。任何实数运算都被截断到这一精度。
2. **有限的范围**：指数 11 位覆盖约 $10^{-308}$ 到 $10^{308}$。超出范围则下溢（变为 0）或上溢（变为 $\pm \infty$）。

**舍入误差**（Round-off Error）来自有限精度：$1.0 + 10^{-17}$ 在双精度下等于 $1.0$（被舍入），而数学上应略大于 1。这一**微小误差**在百万次迭代后可能累积为灾难性偏差。

### 截断误差与算法精度

**截断误差**（Truncation Error）来自用有限步逼近无限过程。例如 $\sin(x) = x - x^3/6 + x^5/120 - \cdots$，截断到前三项就引入截断误差。数值微分 $(f(x+h) - f(x))/h$ 用差商逼近导数，包含两类误差：

- **截断误差**：$\sim h$（一阶差分）或 $\sim h^2$（中心差分），随 $h \to 0$ 减小。
- **舍入误差**：$\sim \epsilon_{\text{mach}} / h$，随 $h \to 0$ 增大。

两者构成**跷跷板**关系：$h$ 太大则截断误差主导，$h$ 太小则舍入误差主导。最优 $h \approx \sqrt{\epsilon_{\text{mach}}} \approx 10^{-8}$（一阶差分）。这就是为什么 1.8.3 节用数值梯度验证时选 $h = 10^{-6}$——这一选择平衡了两类误差。

### 前向误差与后向误差

数值线性代数用两类误差刻画算法精度。考虑求解 $A\mathbf{x} = \mathbf{b}$，数值解 $\hat{\mathbf{x}}$ 与精确解 $\mathbf{x}$ 之间的差异可从两个角度度量：

- **前向误差**（Forward Error）：$\|\hat{\mathbf{x}} - \mathbf{x}\|$，即**输出与真值之差**。
- **后向误差**（Backward Error）：$\|\Delta A\|$ 或 $\|\Delta \mathbf{b}\|$，使得 $(A + \Delta A)\hat{\mathbf{x}} = \mathbf{b} + \Delta \mathbf{b}$，即**输入扰动多少能解释这一输出**。

**后向稳定**（Backward Stable）算法：对任意输入，存在小扰动 $\|\Delta A\| = O(\epsilon_{\text{mach}} \|A\|)$ 使得算法的输出恰为扰动问题的精确解。后向稳定是数值算法的**金标准**——它把**算法精度**与**问题敏感度**分离，让分析变得清晰。

### 条件数：问题的敏感度

**条件数**（Condition Number）刻画问题本身对扰动的敏感度，与算法无关。对方阵 $A$：

$$
\kappa(A) = \|A\| \cdot \|A^{-1}\|
$$

（$A$ 可逆；奇异矩阵 $\kappa = \infty$）。条件数刻画**输入小扰动放大到输出的倍数**：

$$
\frac{\|\Delta \mathbf{x}\|}{\|\mathbf{x}\|} \leq \kappa(A) \cdot \frac{\|\Delta \mathbf{b}\|}{\|\mathbf{b}\|}
$$

即输出的相对误差最多是输入相对误差的 $\kappa(A)$ 倍。

### 奇异值视角：$\kappa(A) = \sigma_{\max} / \sigma_{\min}$

由 1.7 节 SVD，$A = U\Sigma V^T$，谱范数 $\|A\|_2 = \sigma_{\max}$（最大奇异值），$\|A^{-1}\|_2 = 1/\sigma_{\min}$（最小奇异值倒数）。故：

$$
\kappa_2(A) = \frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}
$$

这一公式与 1.7.4 节**SVD 给出条件数**的论断呼应。几何上，$\kappa_2(A)$ 是 $A$ 把单位球面映射为椭球的**长短轴之比**——椭球越扁，条件数越大，问题越病态。

### 病态 vs 良态的几何直觉

把 $A\mathbf{x} = \mathbf{b}$ 视为**在椭球上找点**，条件数刻画椭球的扁度：

- **良态**（$\kappa \sim 1$）：椭球接近球，输入小扰动引起输出小扰动。
- **病态**（$\kappa \gg 1$）：椭球极扁，输入沿短轴方向的小扰动引起输出沿长轴方向的大幅震荡。
- **奇异**（$\kappa = \infty$）：椭球退化为低维，方程无唯一解。

工程经验阈值：

| $\kappa(A)$                  | 状态     | 工程建议             |
| ------------------------------ | -------- | -------------------- |
| $\kappa \sim 1$              | 优秀     | 数值精度可达机器精度 |
| $1 < \kappa < 10^3$          | 良好     | 双精度下可靠         |
| $10^3 \leq \kappa < 10^6$    | 中度病态 | 注意精度损失         |
| $10^6 \leq \kappa < 10^{12}$ | 严重病态 | 结果可能不可信       |
| $\kappa \geq 10^{12}$        | 数值奇异 | 视为不可解           |

### 矩阵求逆的灾难性放大

矩阵求逆 $\mathbf{x} = A^{-1}\mathbf{b}$ 是经典病态问题。当 $\kappa(A) = 10^k$ 时，输入 $\mathbf{b}$ 的相对误差 $10^{-16}$（机器精度）会被放大到输出 $\mathbf{x}$ 的相对误差 $10^{k-16}$。当 $k \geq 16$ 时，输出完全被噪声主导——求逆结果毫无意义。

更微妙的是：即便 $\mathbf{b}$ 精确，$A$ 本身的浮点表示也含误差 $\Delta A \sim \epsilon_{\text{mach}} \|A\|$，求逆后误差放大 $\kappa(A)$ 倍。故**不要直接计算 $A^{-1}$ 来求解线性方程组**——应使用 LU 分解、QR 分解等数值稳定方法（详见 1.8.5 节）。

### AI 中的典型体现：梯度消失与梯度爆炸

深度神经网络的训练中，条件数以另一种形式出现——梯度消失与梯度爆炸。

**梯度消失**：反向传播中，梯度通过每一层的雅可比 $J = \text{diag}(\sigma'(\mathbf{z}))$ 相乘累积。若每层 $|\sigma'| < 1$（如 Sigmoid 在饱和区 $\sigma' \to 0$），$L$ 层后梯度衰减为 $\prod_l |\sigma'_l| \to 0$。从条件数视角看，整个网络的雅可比矩阵条件数极大，输入端梯度被压缩到几乎为零。

**梯度爆炸**：相反，若每层 $|\sigma'| > 1$（如不恰当的初始化使 ReLU 持续激活且权重范数大），梯度累积为 $\prod_l |\sigma'_l| \to \infty$。网络雅可比矩阵的最大奇异值远大于 1，输入端梯度被极度放大。

两种现象的本质都是**网络雅可比矩阵条件数过大**——长短轴（最大最小奇异值）之比悬殊，使梯度在不同方向上传播速度极度不均。这一观察催生了大量正则化技术（1.8.7 节）。

### 经典反例：Wilkinson 多项式的根

**Wilkinson 多项式**是数值稳定性的经典警示：

$$
W(x) = \prod_{i=1}^{20} (x - i) = (x-1)(x-2)\cdots(x-20)
$$

它的根是 $1, 2, \ldots, 20$，看似平凡。但 Wilkinson 发现：把 $x^{19}$ 的系数（理论值 $-210$）加上微小扰动 $-210 + 2^{-23} \approx -210 + 1.19 \times 10^{-7}$（约 $10^{-9}$ 相对扰动），新多项式的根发生剧烈变化——多个根变为复数，最大变化量达 10 的量级。

**几何解读**：Wilkinson 多项式的**根对系数的敏感度**极大——某些根的条件数高达 $10^{10}$ 以上。这意味着即使系数扰动 $10^{-9}$，根的扰动可达 $10$。这是**问题病态**的极端例子——即便用最稳定的算法，也无法挽回问题本身的敏感度。

**AI 工程启示**：训练深度网络时，损失函数对某些参数（如末层权重）的敏感度可能远大于对其他参数（如首层权重）的敏感度——这种**参数敏感度各向异性**是网络雅可比矩阵条件数过大的具体体现。学习率自适应方法（Adam、RMSProp）通过给每个参数独立学习率，部分缓解了这一问题。

### 反向稳定算法 vs 前向稳定算法

数值算法的稳定性分两类：

- **前向稳定**（Forward Stable）：算法输出 $\hat{\mathbf{x}}$ 与真值 $\mathbf{x}$ 之差 $\|\hat{\mathbf{x}} - \mathbf{x}\|$ 小。这是最强的稳定性，但许多问题难以达到。
- **后向稳定**（Backward Stable）：算法的输出 $\hat{\mathbf{x}}$ 等于某个扰动问题的精确解——即存在 $\Delta A$ 使得 $(A + \Delta A)\hat{\mathbf{x}} = \mathbf{b}$，且 $\|\Delta A\| = O(\epsilon_{\text{mach}} \|A\|)$。

后向稳定是工程算法的金标准。LU 分解（带列主元）、QR 分解、Cholesky 分解都是后向稳定的。但后向稳定不保证前向误差小——前向误差取决于问题的条件数：

$$
\text{前向误差} \leq \kappa(A) \cdot \text{后向误差}
$$

这一不等式把**算法精度**与**问题敏感度**分离——后向稳定算法保证**算法本身不引入额外误差**，剩余误差完全由问题条件数决定。这是数值线性代数的核心思想之一。

::: warning 永远检查条件数：$\kappa > 10^6$ 视为不可解
条件数是数值线性代数中衡量问题敏感度的核心指标——任何矩阵运算前都应先检查 $\kappa(A)$。若 $\kappa(A) > 10^6$，结果可能完全不可信；$\kappa > 10^{12}$ 时双精度下数值上等价于奇异矩阵。在 AI 中，权重矩阵条件数过大对应梯度消失/爆炸，需通过正则化（L2、BatchNorm）、残差连接（ResNet）等技术缓解。在数据拟合中，设计矩阵条件数过大需用岭回归 $A^T A + \lambda I$ 改善。永远把**检查条件数**作为数值计算的第一步——这一习惯可避免大多数数值问题。
:::

```python
import numpy as np

# 经典病态矩阵：Hilbert 矩阵
def hilbert(n):
    """构造 n×n Hilbert 矩阵，H_ij = 1/(i+j-1)"""
    H = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            H[i, j] = 1.0 / (i + j + 1)
    return H

# Hilbert 矩阵是经典病态矩阵，条件数随 n 指数增长
print(f"=== Hilbert 矩阵条件数 ===")
for n in [3, 5, 7, 10]:
    H = hilbert(n)
    kappa = np.linalg.cond(H)
    print(f"  n={n:2d}: κ(H) = {kappa:.2e}")

# 病态矩阵的灾难性演示
# 构造一个 2x2 病态矩阵
A = np.array([[1, 1],
              [1, 1.001]], dtype=float)
print(f"\n=== 病态矩阵 A = [[1, 1], [1, 1.001]] ===")
print(f"A =\n{A}")
print(f"det(A) = {np.linalg.det(A):.6f}")
print(f"κ(A) = {np.linalg.cond(A):.2e}")

# 求解 A x = b
b = np.array([1, 1], dtype=float)
x = np.linalg.solve(A, b)
print(f"\n求解 A x = b, b = {b}")
print(f"  解 x = {x}")

# 对 b 加小扰动
delta_b = np.array([0, 0.001], dtype=float)  # 0.1% 扰动
b_perturbed = b + delta_b
x_perturbed = np.linalg.solve(A, b_perturbed)
print(f"\n对 b 加 0.001 扰动: b' = {b_perturbed}")
print(f"  新解 x' = {x_perturbed}")
print(f"  解的变化 Δx = {x_perturbed - x}")
print(f"  相对误差 ||Δx||/||x|| = {np.linalg.norm(x_perturbed - x) / np.linalg.norm(x):.4f}")
print(f"  输入相对误差 ||Δb||/||b|| = {np.linalg.norm(delta_b) / np.linalg.norm(b):.4f}")
print(f"  放大倍数 = {(np.linalg.norm(x_perturbed - x) / np.linalg.norm(x)) / (np.linalg.norm(delta_b) / np.linalg.norm(b)):.2f}")
print(f"  κ(A) = {np.linalg.cond(A):.2f} (与放大倍数一致)")
```

```python
import numpy as np

# Wilkinson 多项式的数值不稳定性演示
# W(x) = (x-1)(x-2)...(x-20)，根为 1, 2, ..., 20
print(f"=== Wilkinson 多项式的数值灾难 ===\n")

# 构造 Wilkinson 多项式的系数（用 numpy.poly）
roots = np.arange(1, 21)
coeffs = np.poly(roots)  # 降序系数
print(f"Wilkinson 多项式次数: {len(coeffs) - 1}")
print(f"x^19 项系数（理论 -210）: {coeffs[1]:.6f}")

# 数值求根
roots_computed = np.roots(coeffs)
print(f"\n数值求根（应接近 1-20）:")
print(f"  真实根: {roots}")
print(f"  数值根: {np.sort(np.real(roots_computed))}")
print(f"  最大误差: {np.max(np.abs(np.sort(np.real(roots_computed)) - roots)):.2e}")

# 加微小扰动（Wilkinson 的经典实验）
coeffs_perturbed = coeffs.copy()
coeffs_perturbed[1] += 2**(-23)  # 给 x^19 系数加 2^-23 ≈ 1.19e-7
print(f"\n对 x^19 系数加扰动 2^-23 ≈ {2**(-23):.4e}:")
print(f"  扰动后系数 = {coeffs_perturbed[1]:.6f}")
print(f"  相对扰动 = {abs(2**(-23) / coeffs[1]):.2e}")

# 求扰动后的根
roots_perturbed = np.roots(coeffs_perturbed)
print(f"\n扰动后的根:")
real_parts = np.real(roots_perturbed)
imag_parts = np.imag(roots_perturbed)
for i, (r, im) in enumerate(sorted(zip(real_parts, imag_parts))):
    if abs(im) < 1e-10:
        print(f"  根 {i+1}: {r:.4f}")
    else:
        print(f"  根 {i+1}: {r:.4f} + {im:.4f}i (变为复数！)")

# 根的最大变化
print(f"\n根的最大变化: {np.max(np.abs(np.sort(real_parts) - roots)):.2f}")
print(f"→ 系数 10^-7 量级扰动导致根变化达 10 量级！")
print(f"→ 这是问题病态（条件数极大）的极端例子")
print(f"→ 即便用最稳定的算法，也无法挽回问题的本质敏感度")
```

```python
import numpy as np

# 奇异值视角看条件数
print(f"=== 奇异值视角：κ(A) = σ_max / σ_min ===\n")

# Hilbert 矩阵的奇异值衰减
for n in [5, 8, 10]:
    H = hilbert(n)
    U, s, Vt = np.linalg.svd(H)
    kappa = s[0] / s[-1]
    print(f"Hilbert {n}×{n}:")
    print(f"  奇异值（前 3 与后 3）: {s[:3]} ... {s[-3:]}")
    print(f"  σ_max = {s[0]:.4e}, σ_min = {s[-1]:.4e}")
    print(f"  κ = σ_max/σ_min = {kappa:.2e}")
    print(f"  → 椭球长短轴之比 = {kappa:.2e}，极度扁平\n")

# 病态矩阵的几何直觉：单位圆 → 极扁椭圆
import matplotlib.pyplot as plt
A_ill = np.array([[1, 1], [1, 1.001]])

theta = np.linspace(0, 2 * np.pi, 200)
unit_circle = np.vstack([np.cos(theta), np.sin(theta)])
ellipsoid = A_ill @ unit_circle

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].plot(unit_circle[0], unit_circle[1], 'b-', linewidth=2)
axes[0].set_title('单位圆（输入）')
axes[0].set_aspect('equal')
axes[0].grid(True, alpha=0.3)
axes[0].set_xlim(-2, 2)
axes[0].set_ylim(-2, 2)

axes[1].plot(ellipsoid[0], ellipsoid[1], 'r-', linewidth=2)
axes[1].set_title(f'病态矩阵变换后（κ={np.linalg.cond(A_ill):.0f}）')
axes[1].set_aspect('equal')
axes[1].grid(True, alpha=0.3)
axes[1].set_xlim(-2, 2)
axes[1].set_ylim(-2, 2)

plt.suptitle('病态矩阵的几何直觉：单位圆 → 极扁椭圆', fontsize=13)
plt.tight_layout()
plt.savefig('condition_number_ellipse.png', dpi=100, bbox_inches='tight')
plt.show()
print("→ 椭圆越扁，条件数越大，问题越病态")

# 梯度消失/爆炸的雅可比条件数演示
print(f"\n=== 梯度消失/爆炸的条件数视角 ===")
# 模拟 10 层 Sigmoid 网络的雅可比累积
def sigmoid_deriv(z):
    s = 1 / (1 + np.exp(-z))
    return s * (1 - s)

# 假设每层输入 z = 5（饱和区）
z_sat = 5.0
sigma_d = sigmoid_deriv(z_sat)
print(f"Sigmoid 在 z=5 处导数 = {sigma_d:.6f} (饱和区)")
J_per_layer = np.diag([sigma_d] * 10)  # 10 维雅可比
kappa_layer = np.linalg.cond(J_per_layer)
print(f"单层雅可比条件数 = {kappa_layer:.2f}")

# 10 层累积
J_total = np.eye(10)
for _ in range(10):
    J_total = J_per_layer @ J_total
print(f"10 层累积后雅可比范数 = {np.linalg.norm(J_total):.2e} (梯度消失！)")
print(f"→ Sigmoid 在饱和区的导数 < 1，多层累积导致梯度指数衰减")
```

<ClientOnly>
<ConditionNumberIllusion title="条件数幻象探索器 · 病态矩阵扰动放大演示 · 椭球扁度可视化" />
</ClientOnly>

## 1.8.5 矩阵分解的数值算法与复杂度

### 直接法 vs 迭代法

承接 1.8.4 的条件数理论，本节给出工程实现矩阵运算的核心算法。求解 $A\mathbf{x} = \mathbf{b}$ 的数值方法分两大类：

- **直接法**（Direct Method）：有限步运算给出**精确解**（在浮点精度内）。包括 LU、Cholesky、QR 分解。
- **迭代法**（Iterative Method）：通过迭代逐步逼近解，迭代次数取决于精度要求。包括幂法、共轭梯度、Krylov 子空间方法。

直接法适合中小规模矩阵（$n \leq 10^4$），复杂度 $O(n^3)$；迭代法适合大规模稀疏矩阵（$n \geq 10^6$），每步 $O(\text{nnz})$（非零元数）。本节聚焦直接法，1.8.6 节讨论迭代法。

### LU 分解：高斯消元的矩阵形式

**LU 分解**把 $A$ 分解为 $A = LU$，其中 $L$ 是下三角（单位对角元），$U$ 是上三角。求解 $A\mathbf{x} = \mathbf{b}$ 变为两步三角求解：

1. $L\mathbf{y} = \mathbf{b}$（前代，前向代入）
2. $U\mathbf{x} = \mathbf{y}$（回代，后向代入）

**复杂度**：分解 $(2/3)n^3 + O(n^2)$，求解 $O(n^2)$。

**列主元 LU 分解**（PLU）：为避免零主元和小主元导致的数值不稳定，引入行置换 $P$，分解为 $PA = LU$。列主元选择每列最大元素作为主元，把舍入误差放大控制在 $\kappa(A)$ 倍内——这是工程实现的标准形式。

### Cholesky 分解：正定对称的高效算法

当 $A$ 是实对称正定矩阵时（如协方差矩阵、Gram 矩阵 $A^T A$），可分解为 $A = LL^T$（$L$ 是下三角，对角元为正）。这就是 **Cholesky 分解**。

**复杂度**：$(1/3)n^3 + O(n^2)$，比 LU 快一倍。

**优势**：无需主元（正定性保证所有主元为正）、数值稳定（条件数不放大）、存储减半（仅 $L$）。

**应用**：协方差矩阵求逆、最小二乘法方程 $A^T A \mathbf{x} = A^T \mathbf{b}$、高斯过程、MCMC 采样等。

### QR 分解：最小二乘的稳定算法

**QR 分解**把 $A \in \mathbb{R}^{m \times n}$（$m \geq n$）分解为 $A = QR$，$Q$ 是 $m \times m$ 正交矩阵，$R$ 是 $m \times n$ 上三角。求解最小二乘 $\min \|A\mathbf{x} - \mathbf{b}\|$ 变为：

$$
R\mathbf{x} = Q^T \mathbf{b}
$$

（取前 $n$ 行）。由于正交变换保持范数，QR 方法比法方程 $(A^T A)\mathbf{x} = A^T \mathbf{b}$ 数值稳定得多——条件数不放大（法方程会平方放大 $\kappa(A^T A) = \kappa(A)^2$）。

**复杂度**：约 $(4/3)mn^2 - (2/3)n^3$（Householder）。

### Householder 反射 vs Givens 旋转

QR 分解的两大稳定实现：

- **Householder 反射**：通过一系列**镜面反射**把 $A$ 的列逐个化为上三角。每次反射 $H = I - 2\mathbf{v}\mathbf{v}^T/\|\mathbf{v}\|^2$ 把一个向量映射到 $\pm \|\mathbf{x}\|\mathbf{e}_1$ 方向。复杂度 $(4/3)mn^2$，是常用的 QR 算法。
- **Givens 旋转**：通过一系列**二维旋转**逐个消去下三角元素。每次旋转 $G_{ij}$ 在 $(i, j)$ 平面内旋转，消去一个元素。复杂度略高 $2mn^2$，但适合稀疏矩阵（只扰动两行）。

### SVD：最昂贵但最稳定

SVD $A = U\Sigma V^T$（1.7 节）是最稳定的分解，但计算最昂贵：

**复杂度**：约 $21n^3$（一般 $m = n$ 情形），远高于 LU、Cholesky、QR。但 SVD 给出条件数（$\sigma_{\max}/\sigma_{\min}$）、秩判定（非零奇异值个数）、伪逆等**核心信息**——这是其他分解无法替代的。

### 工程选择准则：选对算法

不同问题应选不同分解：

| 问题类型                                     | 推荐算法          | 理由                               |
| -------------------------------------------- | ----------------- | ---------------------------------- |
| $A\mathbf{x} = \mathbf{b}$（一般方阵）     | LU（列主元）      | $O((2/3)n^3)$，工程标准          |
| $A\mathbf{x} = \mathbf{b}$（对称正定）     | Cholesky          | $O((1/3)n^3)$，比 LU 快一倍      |
| 最小二乘$\min\|A\mathbf{x} - \mathbf{b}\|$ | QR 或 SVD         | 法方程$\kappa^2$ 放大，QR 不放大 |
| 特征值 / PCA                                 | SVD 或幂法        | SVD 给出主成分，幂法求最大特征值   |
| 秩判定                                       | SVD（奇异值阈值） | 高斯消元在数值上不可靠             |
| 病态问题求解                                 | SVD 伪逆          | 给出最小范数最小二乘解             |

### 算法复杂度与稳定性汇总

把本章涉及的主要算法按复杂度与稳定性两维度对比：

| 算法                   | 复杂度                                | 数值稳定性        | 适用场景                |
| ---------------------- | ------------------------------------- | ----------------- | ----------------------- |
| LU 分解（带列主元）    | $(2/3)n^3$                          | 后向稳定          | 一般方阵线性方程组      |
| Cholesky 分解          | $(1/3)n^3$                          | 后向稳定          | 对称正定矩阵            |
| QR 分解（Householder） | $(4/3)mn^2 - (2/3)n^3$              | 后向稳定          | 最小二乘、正交化        |
| QR 分解（Givens）      | $2mn^2$                             | 后向稳定          | 稀疏矩阵 QR             |
| SVD（分治法）          | $O(n^3)$（常数大）                  | 后向稳定 + 秩信息 | 任意矩阵分解、PCA、伪逆 |
| 幂法                   | $O(\text{nnz})$/步                  | 稳定              | 最大特征值              |
| QR 算法                | $O(n^3)$ 总                         | 后向稳定          | 全部特征值              |
| CG（共轭梯度）         | $O(\sqrt{\kappa} \cdot \text{nnz})$ | 稳定              | 大规模稀疏正定系统      |
| GMRES(m)               | $O(m \cdot \text{nnz})$             | 稳定              | 大规模稀疏非对称系统    |

这一表格是工程实践的算法选择依据——遇到具体问题时，先看问题类型（方阵/非方阵、稠密/稀疏、对称/非对称），再看条件数与规模，最后从表中选出最匹配的算法。

::: tip 工业界计算秩的标准：SVD 奇异值阈值法
数值上**矩阵秩**是脆弱概念——浮点误差让**理论零奇异值**变为**小幅值奇异值**。稳健判据：选阈值 $\tau$（典型 $10^{-8} \cdot \sigma_{\max}$），把 $\sigma_i < \tau$ 视为零，剩余奇异值个数即为**数值秩**。NumPy 的 `np.linalg.matrix_rank` 内部就用此方法。**不要用高斯消元判定秩**——消元过程中主元对扰动敏感，可能给出错误结论。SVD 奇异值阈值法是工业界的事实标准。
:::

```python
import numpy as np
import time

# 对比 LU、Cholesky、QR、SVD 在不同矩阵上的表现
np.random.seed(42)
n = 100

# 1. 一般方阵：LU 最快
A_general = np.random.randn(n, n)
b = np.random.randn(n)

print(f"=== 一般方阵求解 A x = b (n={n}) ===")
print(f"  κ(A) = {np.linalg.cond(A_general):.2e}")

# numpy.linalg.solve 内部用 LU
start = time.time()
x_lu = np.linalg.solve(A_general, b)
t_lu = time.time() - start
print(f"  [LU]   耗时 {t_lu*1000:.2f} ms, 残差 {np.linalg.norm(A_general @ x_lu - b):.2e}")

# SVD 伪逆求解
start = time.time()
x_svd = np.linalg.pinv(A_general) @ b
t_svd = time.time() - start
print(f"  [SVD]  耗时 {t_svd*1000:.2f} ms, 残差 {np.linalg.norm(A_general @ x_svd - b):.2e}")

# 2. 对称正定矩阵：Cholesky 最快
print(f"\n=== 对称正定矩阵求解 (n={n}) ===")
A_spd = A_general @ A_general.T + n * np.eye(n)  # 对称正定
print(f"  κ(A) = {np.linalg.cond(A_spd):.2e}")

# Cholesky
from scipy.linalg import cho_factor, cho_solve
start = time.time()
L, _ = cho_factor(A_spd, lower=True)
x_chol = cho_solve((L, True), b)
t_chol = time.time() - start
print(f"  [Cholesky] 耗时 {t_chol*1000:.2f} ms, 残差 {np.linalg.norm(A_spd @ x_chol - b):.2e}")

# 对比 LU
start = time.time()
x_lu_spd = np.linalg.solve(A_spd, b)
t_lu_spd = time.time() - start
print(f"  [LU]       耗时 {t_lu_spd*1000:.2f} ms, 残差 {np.linalg.norm(A_spd @ x_lu_spd - b):.2e}")

# 3. 最小二乘：QR vs 法方程
print(f"\n=== 最小二乘 (m=200, n=50) ===")
m_ls = 200
n_ls = 50
A_ls = np.random.randn(m_ls, n_ls)
b_ls = np.random.randn(m_ls)
print(f"  κ(A) = {np.linalg.cond(A_ls):.2e}")

# 法方程 (A^T A) x = A^T b（条件数平方放大）
ATA = A_ls.T @ A_ls
ATb = A_ls.T @ b_ls
print(f"  κ(A^T A) = {np.linalg.cond(ATA):.2e} (= κ(A)² = {np.linalg.cond(A_ls)**2:.2e})")
x_normal = np.linalg.solve(ATA, ATb)
print(f"  [法方程] 残差 ||Ax-b|| = {np.linalg.norm(A_ls @ x_normal - b_ls):.6e}")

# QR 分解
Q, R = np.linalg.qr(A_ls)
x_qr = np.linalg.solve(R[:n_ls], Q.T @ b_ls[:n_ls] if False else (Q.T @ b_ls)[:n_ls])
print(f"  [QR]    残差 ||Ax-b|| = {np.linalg.norm(A_ls @ x_qr - b_ls):.6e}")

# SVD 最小二乘
x_svd_ls, _, _, _ = np.linalg.lstsq(A_ls, b_ls, rcond=None)
print(f"  [SVD]   残差 ||Ax-b|| = {np.linalg.norm(A_ls @ x_svd_ls - b_ls):.6e}")

print(f"\n  → 三种方法残差接近，但法方程在病态时不稳定")
print(f"  → QR 与 SVD 数值更稳定，工程推荐")
```

```python
import numpy as np

# 病态矩阵上对比：LU vs QR vs SVD
print(f"=== 病态矩阵上各算法的稳定性对比 ===\n")

# 构造病态矩阵：Hilbert 10x10
def hilbert(n):
    H = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            H[i, j] = 1.0 / (i + j + 1)
    return H

n = 10
H = hilbert(n)
b = np.ones(n)
x_true = np.linalg.solve(H, b)  # "理论"解
print(f"Hilbert {n}×{n}, κ = {np.linalg.cond(H):.2e}")
print(f"理论解 x = {x_true}")

# 加微小扰动
np.random.seed(0)
delta_b = 1e-10 * np.random.randn(n)
b_perturbed = b + delta_b

# LU 求解（numpy.linalg.solve 内部用 PLU）
x_lu = np.linalg.solve(H, b_perturbed)

# QR 求解（虽然方阵，但用 QR 测试稳定性）
Q, R = np.linalg.qr(H)
x_qr = np.linalg.solve(R, Q.T @ b_perturbed)

# SVD 求解（伪逆）
x_svd = np.linalg.pinv(H) @ b_perturbed

print(f"\n输入扰动 ||Δb|| = {np.linalg.norm(delta_b):.2e}")
print(f"\n各方法解的相对误差:")
print(f"  [LU]  ||x_lu - x_true|| / ||x_true|| = {np.linalg.norm(x_lu - x_true) / np.linalg.norm(x_true):.4e}")
print(f"  [QR]  ||x_qr - x_true|| / ||x_true|| = {np.linalg.norm(x_qr - x_true) / np.linalg.norm(x_true):.4e}")
print(f"  [SVD] ||x_svd - x_true|| / ||x_true|| = {np.linalg.norm(x_svd - x_true) / np.linalg.norm(x_true):.4e}")

# 理论预测：误差放大 κ(A) 倍
predicted_error = np.linalg.cond(H) * np.linalg.norm(delta_b) / np.linalg.norm(b)
print(f"\n理论预测: κ(A) · ||Δb||/||b|| = {predicted_error:.4e}")
print(f"→ 实际误差应在量级上接近理论预测")
print(f"→ SVD 通常给出最小范数解，误差相对较小")

# 秩判定对比：高斯消元 vs SVD
print(f"\n=== 秩判定：高斯消元 vs SVD ===")
# 构造一个秩 3 的 5x5 矩阵
np.random.seed(42)
A_rank3 = np.random.randn(5, 3) @ np.random.randn(3, 5)  # 秩 3
# 加微小扰动
A_perturbed = A_rank3 + 1e-12 * np.random.randn(5, 5)
print(f"理论秩 = 3, 扰动后矩阵:")
print(f"  numpy.linalg.matrix_rank (SVD 法): {np.linalg.matrix_rank(A_perturbed)}")

# SVD 奇异值
U, s, Vt = np.linalg.svd(A_perturbed)
print(f"  奇异值: {s}")
print(f"  → 前 3 个远大于后 2 个，可清晰判定秩为 3")
```

<ClientOnly>
<MatrixFactorizationCost title="矩阵分解算法复杂度对比 · LU/Cholesky/QR/SVD 实时性能基准" />
</ClientOnly>

## 1.8.6 迭代方法与幂法：当直接求解不可行时

### 为什么需要迭代法？

承接 1.8.5 的直接法，本节讨论大规模矩阵的迭代求解。直接法（LU、Cholesky、QR）的 $O(n^3)$ 复杂度在 $n = 10^4$ 时已需约 $10^{12}$ 次运算（数小时），$n = 10^6$ 时完全不可行。然而现代应用中：

- Google PageRank：网页数 $n \approx 10^{10}$，转移矩阵极稀疏（每页平均几十个出链）。
- 社交网络：节点数 $n \approx 10^9$，邻接矩阵稀疏。
- 推荐系统：用户-物品矩阵 $n \approx 10^8$。

这些场景下直接法不可行，需用**迭代法**——每步仅做矩阵-向量乘法 $A\mathbf{x}$，对稀疏矩阵成本 $O(\text{nnz})$（非零元数），通过迭代逐步逼近解。

### 幂法：求最大特征值

**幂法**（Power Iteration）是简单的特征值迭代算法。给定 $A \in \mathbb{R}^{n \times n}$，从随机向量 $\mathbf{x}_0$ 出发，迭代：

$$
\mathbf{x}_{k+1} = \frac{A \mathbf{x}_k}{\|A \mathbf{x}_k\|}
$$

若 $A$ 有唯一最大模特征值 $\lambda_1$（$|\lambda_1| > |\lambda_2| \geq \cdots$），则 $\mathbf{x}_k \to \mathbf{v}_1$（对应特征向量），$\|A\mathbf{x}_k\| \to |\lambda_1|$。

**直觉**：把 $\mathbf{x}_0$ 展开为特征基 $\mathbf{x}_0 = c_1 \mathbf{v}_1 + \cdots + c_n \mathbf{v}_n$。则 $A^k \mathbf{x}_0 = c_1 \lambda_1^k \mathbf{v}_1 + \cdots + c_n \lambda_n^k \mathbf{v}_n$。当 $|\lambda_1| > |\lambda_2|$ 时，$\lambda_1^k$ 主导，$A^k \mathbf{x}_0$ 趋向 $\mathbf{v}_1$ 方向。归一化保证数值稳定。

**收敛速度**：取决于比值 $|\lambda_2 / \lambda_1|$——比值越小，收敛越快。若 $|\lambda_2 / \lambda_1| = 0.9$，每步仅放大 $1/0.9 \approx 1.11$ 倍，收敛极慢；若比值为 0.1，几步即收敛。

### QR 算法：现代特征值分解标准

**QR 算法**是现代特征值分解的标准迭代算法。流程：

1. 初始化 $A_0 = A$。
2. 迭代：$A_k = Q_k R_k$（QR 分解），$A_{k+1} = R_k Q_k$。
3. $A_k$ 收敛到上三角（或实 Schur 形），对角元即为特征值。

**直觉**：$A_{k+1} = R_k Q_k = Q_k^{-1} A_k Q_k$（因 $Q_k^T Q_k = I$），每步是相似变换，特征值不变。迭代让 $A_k$ 趋向上三角（Schur 形），对角元收敛到特征值。

**实用改进**：实际工程中 QR 算法配合 Householder 三对角化（对称情形）或 Hessenberg 化（一般情形）加速，复杂度 $O(n^3)$ 但常数因子小。`numpy.linalg.eig`、`numpy.linalg.eigh` 内部即用此算法。

### 共轭梯度法：正定对称的迭代求解器

**共轭梯度法**（Conjugate Gradient, CG）是求解正定对称线性方程组 $A\mathbf{x} = \mathbf{b}$ 的高效迭代法。其核心思想是在 Krylov 子空间中寻找最优解，每步只需一次矩阵-向量乘法。

**核心性质**：

- 至多 $n$ 步收敛（理论精确解）。
- 实际中远少于 $n$ 步即可达到精度，特别当 $A$ 的特征值聚集时。
- 复杂度 $O(\sqrt{\kappa(A)} \cdot \text{nnz})$，远优于直接法的 $O(n^3)$。

**适用场景**：大规模稀疏正定对称矩阵，如偏微分方程离散化、稀疏最小二乘、机器学习中的正则化损失优化。

### Krylov 子空间方法

**Krylov 子空间**定义为：

$$
\mathcal{K}_k(A, \mathbf{b}) = \text{span}\{\mathbf{b}, A\mathbf{b}, A^2\mathbf{b}, \ldots, A^{k-1}\mathbf{b}\}
$$

CG、GMRES、BiCGSTAB 等迭代法都是在 Krylov 子空间中寻找近似解——用低维子空间近似高维方程组。这一思想把**求解线性方程组**转化为**子空间投影**，是大规模矩阵计算的工程基石。

**GMRES**（Generalized Minimal Residual）是 CG 的非对称推广：在 Krylov 子空间中最小化残差 $\|A\mathbf{x} - \mathbf{b}\|$。对非对称矩阵，GMRES 是最稳定的选择，但每步需存储全部历史方向，内存开销 $O(kn)$。重启版 GMRES(m) 通过周期性重启缓解内存问题，是工业中求解非对称稀疏系统的标准工具。

### 预处理：让迭代法跑得更快

CG 的收敛速度取决于 $\sqrt{\kappa(A)}$，对病态矩阵（$\kappa \sim 10^{10}$）需要 $\sqrt{\kappa} \sim 10^5$ 步迭代——不可接受。**预处理**（Preconditioning）通过变换 $M^{-1} A \mathbf{x} = M^{-1} \mathbf{b}$（$M \approx A$ 但 $M^{-1}$ 易求），让新矩阵 $M^{-1}A$ 的条件数大幅降低：

$$
\kappa(M^{-1}A) \ll \kappa(A)
$$

理想预处理矩阵 $M$ 满足两条矛盾要求：(1) $M \approx A$（让 $\kappa(M^{-1}A)$ 小）；(2) $M^{-1}\mathbf{v}$ 易求（让每步成本低）。常见预处理策略：

- **Jacobi 预处理**：$M = \text{diag}(A)$，对角预处理，简单。
- **不完全 Cholesky**：$M = \tilde L \tilde L^T$，$\tilde L$ 是 Cholesky 因子但保留稀疏结构（强制某些零元保持为零）。
- **代数多网格**（AMG）：通过多层次粗化加速收敛，对椭圆型 PDE 离散化最优。

预处理后的 CG（PCG）是求解大规模稀疏正定系统的工业标准。在 AI 中，二阶优化器如 K-FAC、Shampoo 都可视为**近似预处理**——用结构化矩阵近似 $H_f$，加速梯度下降收敛。

### 迭代法的工程价值

迭代法的两大工程优势：

1. **稀疏友好**：每步 $A\mathbf{x}$ 对稀疏矩阵仅 $O(\text{nnz})$，远优于直接法 $O(n^3)$。
2. **可中断**：随时可停止并返回当前近似解，精度与时间预算可权衡。

但迭代法也有局限：收敛速度依赖问题结构（条件数、特征值分布），对极病态问题可能极慢。工程实践常结合预处理（Preconditioning）——把 $A\mathbf{x} = \mathbf{b}$ 转化为 $M^{-1} A \mathbf{x} = M^{-1} \mathbf{b}$（$M \approx A$ 但易求逆），让新矩阵条件数更小、迭代更快。

::: note 迭代法是大规模矩阵计算的工程基石
直接法（LU、Cholesky）适合中小规模稠密矩阵，复杂度 $O(n^3)$；迭代法（CG、GMRES、幂法）适合大规模稀疏矩阵，每步 $O(\text{nnz})$。现代科学计算与机器学习的核心数据规模（百万到十亿级）使得迭代法必要——PageRank、社交网络分析、推荐系统都依赖迭代法求解。掌握迭代法，就是掌握了**当问题规模超出直接法能力时**的工程工具。
:::

```python
import numpy as np

# 幂法求最大特征值
np.random.seed(42)
n = 5
A = np.random.randn(n, n)
# 让 A 有较大的特征值差距，便于幂法收敛
A = A @ A.T  # 对称正定，特征值为正
print(f"A (对称正定) =\n{A}")

# 用 numpy 求特征值作为参考
eigvals_true = np.linalg.eigvalsh(A)
print(f"\n真实特征值（降序）: {np.sort(eigvals_true)[::-1]}")

# 幂法迭代
def power_iteration(A, num_iter=100, tol=1e-10):
    n = A.shape[0]
    x = np.random.randn(n)
    x = x / np.linalg.norm(x)
    lambda_history = []

    for k in range(num_iter):
        y = A @ x
        lambda_k = np.dot(x, y)  # Rayleigh 商
        x_new = y / np.linalg.norm(y)

        # 收敛判定
        if k > 0 and abs(lambda_k - lambda_history[-1]) < tol:
            print(f"  幂法在 {k+1} 步收敛")
            break

        x = x_new
        lambda_history.append(lambda_k)

    return lambda_k, x, lambda_history

lambda_max, v_max, history = power_iteration(A, num_iter=200)
print(f"\n幂法结果:")
print(f"  最大特征值 λ_1 = {lambda_max:.6f}")
print(f"  真实值        = {max(eigvals_true):.6f}")
print(f"  误差          = {abs(lambda_max - max(eigvals_true)):.2e}")
print(f"  特征向量 v_1 = {v_max}")

# 验证 A v_1 = λ_1 v_1
print(f"  A v_1 = {A @ v_max}")
print(f"  λ_1 v_1 = {lambda_max * v_max}")
print(f"  一致? {np.allclose(A @ v_max, lambda_max * v_max, atol=1e-6)}")

# 收敛速度分析
lambda_sorted = np.sort(eigvals_true)[::-1]
ratio = lambda_sorted[1] / lambda_sorted[0]
print(f"\n收敛速度分析:")
print(f"  λ_2/λ_1 = {ratio:.4f}")
print(f"  → 比值越小，幂法收敛越快；接近 1 则收敛极慢")
print(f"  → 前 10 步 Rayleigh 商: {[f'{h:.4f}' for h in history[:10]]}")
```

```python
import numpy as np

# 共轭梯度法（CG）实现
def conjugate_gradient(A, b, x0=None, tol=1e-8, max_iter=None):
    """共轭梯度法求解 A x = b（A 对称正定）"""
    n = len(b)
    if x0 is None:
        x = np.zeros(n)
    else:
        x = x0.copy()
    if max_iter is None:
        max_iter = n

    r = b - A @ x  # 初始残差
    p = r.copy()    # 初始搜索方向
    rsold = r @ r

    for k in range(max_iter):
        Ap = A @ p
        alpha = rsold / (p @ Ap)
        x = x + alpha * p
        r = r - alpha * Ap
        rsnew = r @ r

        if np.sqrt(rsnew) < tol:
            print(f"  CG 在 {k+1} 步收敛")
            break

        beta = rsnew / rsold
        p = r + beta * p
        rsold = rsnew

    return x

# 测试 CG
np.random.seed(42)
n = 100
A_dense = np.random.randn(n, n)
A = A_dense @ A_dense.T + n * np.eye(n)  # 对称正定
b = np.random.randn(n)

print(f"=== 共轭梯度法 (n={n}) ===")
print(f"κ(A) = {np.linalg.cond(A):.2e}")

# 直接法参考
x_direct = np.linalg.solve(A, b)
print(f"直接法残差: {np.linalg.norm(A @ x_direct - b):.2e}")

# CG 求解
print(f"\nCG 迭代过程:")
x_cg = conjugate_gradient(A, b, tol=1e-10)
print(f"CG 残差: {np.linalg.norm(A @ x_cg - b):.2e}")
print(f"CG 与直接解的差距: {np.linalg.norm(x_cg - x_direct):.2e}")

# CG 收敛速度 vs 条件数
print(f"\n=== CG 收敛速度与条件数关系 ===")
print(f"理论上界: ||x_k - x*|| ≤ 2 ((√κ-1)/(√κ+1))^k ||x_0 - x*||")
print(f"  κ(A) = {np.linalg.cond(A):.2e}")
print(f"  √κ = {np.sqrt(np.linalg.cond(A)):.2e}")
print(f"  → CG 收敛速度取决于 √κ，远优于最速下降的 κ")

# 对比稀疏矩阵场景
from scipy.sparse import random as sparse_random
from scipy.sparse.linalg import cg as scipy_cg

print(f"\n=== 稀疏矩阵场景 (n=10000, 稀疏度 0.1%) ===")
n_sparse = 10000
A_sparse = sparse_random(n_sparse, n_sparse, density=0.001, random_state=42)
A_sparse = A_sparse @ A_sparse.T + 0.1 * n_sparse * 0.01  # 对称正定稀疏
b_sparse = np.random.randn(n_sparse)

import time
start = time.time()
x_scipy_cg, info = scipy_cg(A_sparse, b_sparse, tol=1e-8)
t_cg = time.time() - start
print(f"  [CG]   耗时 {t_cg*1000:.2f} ms, 收敛信息 {info}")
print(f"  残差 = {np.linalg.norm(A_sparse @ x_scipy_cg - b_sparse):.2e}")

# 直接法在稀疏矩阵上对比（耗时较长）
start = time.time()
x_direct_sparse = np.linalg.solve(A_sparse.toarray(), b_sparse)
t_direct = time.time() - start
print(f"  [直接] 耗时 {t_direct*1000:.2f} ms (转 dense 后求解)")
print(f"  → CG 对稀疏矩阵优势巨大")
```

<ClientOnly>
<MatrixFactorizationCost title="迭代法收敛过程可视化 · 幂法/CG 迭代轨迹 · 收敛速度对比" />
</ClientOnly>

## 1.8.7 AI 矩阵微积分的实战陷阱：理论与代码的鸿沟

### Softmax + 交叉熵的数值优化：Log-Sum-Exp 技巧

承接 1.8.6 的迭代法，本节作为本章总结，讨论 AI 实战中**理论公式**与**工程代码**的鸿沟。第一个鸿沟是 **Softmax 数值溢出**。

Softmax 函数把 logits $\mathbf{z} \in \mathbb{R}^n$ 转化为概率分布：

$$
\text{softmax}(\mathbf{z})_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

**问题**：当某个 $z_i$ 较大（如 $z_i = 1000$）时，$e^{z_i}$ 上溢为 $\infty$，整个 Softmax 失效。

**Log-Sum-Exp 技巧**：利用恒等式 $\text{softmax}(\mathbf{z})_i = \frac{e^{z_i - c}}{\sum_j e^{z_j - c}}$，其中 $c$ 是任意常数（典型取 $c = \max_i z_i$）。这一变换不改变数学结果，但让所有指数输入 $\leq 0$，避免上溢：

$$
\text{softmax}(\mathbf{z})_i = \frac{e^{z_i - \max(\mathbf{z})}}{\sum_j e^{z_j - \max(\mathbf{z})}}
$$

对应的对数形式 $\log \sum_j e^{z_j} = \max(\mathbf{z}) + \log \sum_j e^{z_j - \max(\mathbf{z})}$ 是数值稳定的 **Log-Sum-Exp** 函数。

**与交叉熵的协同**：交叉熵损失 $L = -\sum_i y_i \log \hat{p}_i$（$\hat{p} = \text{softmax}(\mathbf{z})$）。直接计算需先算 $\hat{p}$ 再取对数，可能损失精度。PyTorch 的 `F.cross_entropy` 内部把 Softmax 与交叉熵融合，直接用 logits 计算 $\log \text{softmax}$，避免中间精度损失——这是工程上的**数值融合**原则。

### 自动微分 vs 符号求导 vs 数值差分

求导有三大流派，各有优劣：

**1. 符号求导**（Symbolic Differentiation）：用代数规则把表达式转化为导数表达式。优点：精确（无截断误差）。缺点：表达式膨胀——简单函数的导数可能展开为巨长表达式（**表达式爆炸**），且对包含 `if`、循环的代码无能为力。代表：SymPy、Mathematica。

**2. 数值差分**（Numerical Differentiation）：用差商 $(f(x+h) - f(x))/h$ 逼近导数。优点：通用、易实现。缺点：截断误差与舍入误差的**跷跷板**（1.8.4 节），精度有限（最佳约 $10^{-8}$）；高维梯度需 $O(n)$ 次函数求值。仅用于验证，不适合训练。

**3. 自动微分**（Automatic Differentiation, AD）：把函数分解为计算图上的原子操作，每个原子操作有已知导数，通过链式法则累加。优点：机器精度、计算量与前向传播同阶、支持任意代码（含 `if`、循环）。缺点：需要构建计算图、内存占用大（需缓存前向值）。

**AD 的两种模式**：

- **前向模式**（Forward Mode）：沿计算图前向传播，同时计算值和导数。对 $f: \mathbb{R}^n \to \mathbb{R}$ 需 $n$ 次前向传播得到完整梯度。
- **反向模式**（Reverse Mode）：先做前向传播缓存中间值，再反向传播累加梯度。对 $f: \mathbb{R}^n \to \mathbb{R}$ 仅需一次前向 + 一次反向得到完整梯度。

神经网络训练中损失函数 $L: \mathbb{R}^n \to \mathbb{R}$（$n$ 是参数数，远大于输出维度 1），**反向模式 AD** 是最优选择——这就是 PyTorch `loss.backward()`、TensorFlow `GradientTape` 的数学本质。

### 梯度裁剪：应对梯度爆炸

**梯度裁剪**（Gradient Clipping）通过限制梯度范数应对爆炸：

$$
\mathbf{g} \leftarrow \begin{cases} \mathbf{g}, & \text{若 } \|\mathbf{g}\| \leq \tau \\ \frac{\tau}{\|\mathbf{g}\|} \mathbf{g}, & \text{若 } \|\mathbf{g}\| > \tau \end{cases}
$$

（$\tau$ 是预设阈值）。这一操作保持梯度方向不变，仅缩小过大范数——是对网络雅可比矩阵条件数过大问题的工程缓解。RNN、Transformer 训练中梯度裁剪是必备工具。

### 权重初始化与特征值：Xavier 初始化

权重初始化直接影响网络雅可比矩阵的特征值分布。**Xavier 初始化**（Glorot 初始化）让权重 $W_{ij} \sim \mathcal{N}(0, 1/n_{\text{in}})$，使前向传播方差稳定：

$$
\text{Var}(y_i) = \text{Var}(x_j) \quad \text{（每层方差不变）}
$$

从特征值视角看，Xavier 初始化让权重矩阵的谱半径 $\rho(W) \approx 1$，避免前向激活和反向梯度指数级放大或衰减。**He 初始化**（针对 ReLU）调整为 $\text{Var}(W) = 2/n_{\text{in}}$，补偿 ReLU 的**半激活**特性。这些初始化策略的本质都是**控制网络雅可比矩阵的特征值分布**——把 1.6 节的特征值理论与 1.8.4 节的条件数理论结合的工程实践。

### L2 正则化的矩阵视角：岭回归

L2 正则化把损失函数 $L = \|A\mathbf{x} - \mathbf{b}\|^2$ 改为 $L = \|A\mathbf{x} - \mathbf{b}\|^2 + \lambda \|\mathbf{x}\|^2$。最小化变为：

$$
(A^T A + \lambda I) \mathbf{x} = A^T \mathbf{b}
$$

这就是**岭回归**（Ridge Regression）。从矩阵视角看，L2 正则化把 $A^T A$ 改为 $A^T A + \lambda I$，**条件数显著改善**：

$$
\kappa(A^T A + \lambda I) = \frac{\sigma_{\max}^2 + \lambda}{\sigma_{\min}^2 + \lambda}
$$

当 $\lambda$ 适当大时，条件数大幅下降，数值稳定性提升。同时 $A^T A + \lambda I$ 始终正定可逆（即便 $A^T A$ 奇异），避免奇异问题。**正则化是用偏差换稳定性的数值策略**——这一视角让 L2 正则化从**防止过拟合**扩展为**改善数值条件**的通用工具。

### Batch Normalization 的数值稳健性

**Batch Normalization**（BN）通过强制每层激活值归一化为零均值单位方差，把激活值拉回 Sigmoid/Tanh 的非饱和区——这一操作间接控制了网络雅可比矩阵的奇异值：

1. **避免激活饱和**：Sigmoid 在 $|z| > 4$ 时导数接近 0，BN 把 $z$ 限制在 $[-3, 3]$ 附近，导数保持显著——缓解梯度消失。
2. **稳定特征值分布**：BN 让每层激活分布稳定，间接控制权重矩阵的特征值不漂移——长程训练更稳定。
3. **改善条件数**：通过归一化，网络雅可比矩阵的最大最小奇异值差距缩小——梯度传播更均衡。

BN 与残差连接（ResNet）的组合是训练超深网络（100+ 层）的关键技术——它们从数值稳定性的角度解决了网络加深导致雅可比条件数爆炸的根本问题。

### 残差连接的雅可比视角

**残差连接**（Residual Connection, ResNet）的核心公式 $\mathbf{y} = \mathbf{x} + F(\mathbf{x})$ 看似简单，却有重要的数值稳定性意义。其雅可比为：

$$
J = I + \frac{\partial F}{\partial \mathbf{x}}
$$

即使 $\frac{\partial F}{\partial \mathbf{x}}$ 在某些方向上很小（梯度消失），$J$ 在这些方向上仍接近 $I$（恒等映射），保证梯度至少以 $O(1)$ 速率传播。这把**梯度可能消失**的雅可比 $\partial F / \partial \mathbf{x}$ 变为**梯度有保底**的雅可比 $I + \partial F / \partial \mathbf{x}$——一个看似简单的加法，把网络的可训练深度从 30 层扩展到 1000+ 层。

从特征值视角看：若 $\partial F / \partial \mathbf{x}$ 的特征值都接近 0（梯度消失），则 $I + \partial F / \partial \mathbf{x}$ 的特征值都接近 1——这是**恒等映射 + 小扰动**的稳定结构。ResNet 的本质是**让网络雅可比矩阵的特征值聚集在 1 附近**，避免梯度消失/爆炸。

### Adam 优化器：自适应学习率的工程实践

Adam（Adaptive Moment Estimation）是深度学习常用的优化器，结合动量与自适应学习率：

$$
\mathbf{m}_k = \beta_1 \mathbf{m}_{k-1} + (1-\beta_1) \mathbf{g}_k \quad \text{（一阶矩估计）}
$$

$$
\mathbf{v}_k = \beta_2 \mathbf{v}_{k-1} + (1-\beta_2) \mathbf{g}_k^2 \quad \text{（二阶矩估计）}
$$

$$
\theta_{k+1} = \theta_k - \eta \cdot \frac{\hat{\mathbf{m}}_k}{\sqrt{\hat{\mathbf{v}}_k} + \epsilon}
$$

Adam 的本质是**逐参数自适应学习率**：$\sqrt{\hat{\mathbf{v}}_k}$ 是梯度方差的滑动平均，对大梯度参数减小学习率，对小梯度参数增大学习率。这一自适应机制可视为**对角预处理**——用梯度历史的对角矩阵近似海森矩阵的对角元，让各方向的有效曲率更均衡。

从矩阵视角看，Adam 等价于用对角矩阵 $D \approx \text{diag}(\sqrt{\hat{\mathbf{v}}})$ 预处理梯度下降——$D^{-1} \nabla f$ 让条件数 $\kappa(D^{-1} H_f)$ 比 $\kappa(H_f)$ 小，加速收敛。这是 1.8.6 节预处理思想在深度学习中的体现。

### 理论与代码的鸿沟：AI 工程师的素养

总结本节，AI 工程师面对的**理论与代码的鸿沟**体现在：

- **数值稳定**：理论上正确的公式（如直接 Softmax）可能数值失效，需用稳定等价形式（Log-Sum-Exp）。
- **精度平衡**：理论**精确导数**可能因浮点误差失真，需用 AD 替代数值差分。
- **条件控制**：理论**最优解**可能因条件数过大不可达，需用正则化、BN 等技术改善条件数。
- **形状对齐**：理论公式可能形状模糊，需用**形状法则**在代码中明确验证。

掌握这些**鸿沟跨越**技术，就是从**会写公式**到**能写出可运行、可训练、可扩展 AI 代码**的飞跃——这是本章最后一节希望传递的工程素养。

::: key-idea 自动微分是现代深度学习框架的数学基石
PyTorch、TensorFlow、JAX 等深度学习框架的核心是**自动微分**——把任意可微代码转化为梯度计算的通用工具。AD 的数学本质是链式法则在计算图上的系统化应用（1.8.3 节），工程本质是把**导数计算**从**人工推导**自动化为**框架执行**。这一自动化让 AI 研究者从繁琐的导数推导中解放，专注于模型设计；让数百层深度网络的训练成为可能；让**复杂模型 + 大数据**的深度学习时代得以到来。掌握 AD 原理，就是掌握了现代 AI 框架的数学基础——这是从**线性代数理论**通往**AI 工程实践**的最后一块基石。
:::

```python
import numpy as np

# Softmax 数值稳定性对比
def softmax_naive(z):
    """朴素 Softmax（数值不稳定）"""
    exp_z = np.exp(z)
    return exp_z / np.sum(exp_z)

def softmax_stable(z):
    """数值稳定 Softmax（Log-Sum-Exp 技巧）"""
    z_max = np.max(z)
    exp_z = np.exp(z - z_max)
    return exp_z / np.sum(exp_z)

# 测试大 logits
z_large = np.array([1000, 1001, 1002], dtype=float)
print(f"=== Softmax 数值稳定性 ===")
print(f"logits = {z_large}")

try:
    p_naive = softmax_naive(z_large)
    print(f"朴素 Softmax: {p_naive}")
except Warning as e:
    print(f"朴素 Softmax 溢出: {e}")

p_stable = softmax_stable(z_large)
print(f"稳定 Softmax: {p_stable}")
print(f"两者数学上等价（若朴素版未溢出）")

# 小 logits 测试
z_small = np.array([1.0, 2.0, 3.0])
p_naive = softmax_naive(z_small)
p_stable = softmax_stable(z_small)
print(f"\nlogits = {z_small}")
print(f"朴素 Softmax: {p_naive}")
print(f"稳定 Softmax: {p_stable}")
print(f"两者一致? {np.allclose(p_naive, p_stable)}")

# Log-Sum-Exp 函数
def log_sum_exp(z):
    """数值稳定的 log(sum(exp(z)))"""
    z_max = np.max(z)
    return z_max + np.log(np.sum(np.exp(z - z_max)))

print(f"\nLog-Sum-Exp({z_small}) = {log_sum_exp(z_small)}")
print(f"直接计算 log(sum(exp(z))) = {np.log(np.sum(np.exp(z_small)))}")
print(f"两者一致? {np.isclose(log_sum_exp(z_small), np.log(np.sum(np.exp(z_small))))}")

# 交叉熵损失的数值稳定实现
def cross_entropy_stable(logits, y_onehot):
    """数值稳定的交叉熵损失（直接用 logits）"""
    log_softmax = logits - log_sum_exp(logits)  # log(softmax(logits))
    return -np.sum(y_onehot * log_softmax)

# 对比
logits = np.array([2.0, 1.0, 0.5])
y_onehot = np.array([1, 0, 0])  # 类别 0

# 朴素：先 softmax 再 log（可能损失精度）
p = softmax_stable(logits)
ce_naive = -np.sum(y_onehot * np.log(p + 1e-12))

# 稳定：直接用 logits
ce_stable = cross_entropy_stable(logits, y_onehot)

print(f"\n=== 交叉熵损失 ===")
print(f"logits = {logits}, 真实类别 = 0")
print(f"朴素实现 (softmax → log): {ce_naive:.6f}")
print(f"稳定实现 (logits 直接): {ce_stable:.6f}")
print(f"两者一致? {np.isclose(ce_naive, ce_stable)}")
```

```python
import numpy as np

# 三种求导方法对比：有限差分 vs 符号 vs 自动微分
# 测试函数: f(x) = sin(x) * exp(-x^2/2)，求 f'(x) 在 x=1 处的值

def f(x):
    return np.sin(x) * np.exp(-x**2 / 2)

# 解析导数（参考真值）
def f_prime_analytical(x):
    return np.cos(x) * np.exp(-x**2 / 2) - x * np.sin(x) * np.exp(-x**2 / 2)

x0 = 1.0
true_grad = f_prime_analytical(x0)
print(f"=== 三种求导方法对比 ===")
print(f"f(x) = sin(x) · exp(-x²/2)")
print(f"f'(x={x0}) 解析真值 = {true_grad:.12f}\n")

# 方法 1: 有限差分（中心差分）
print(f"方法 1: 数值差分")
for h in [1e-4, 1e-6, 1e-8, 1e-10, 1e-12, 1e-14]:
    grad_fd = (f(x0 + h) - f(x0 - h)) / (2 * h)
    err = abs(grad_fd - true_grad)
    print(f"  h={h:.0e}:  f'(x) = {grad_fd:.12f},  误差 = {err:.2e}")

print(f"  → h 太大则截断误差主导，h 太小则舍入误差主导")
print(f"  → 最佳 h ≈ √ε_mach ≈ 1e-8")

# 方法 2: 符号求导（用 sympy）
import sympy as sp
x_sym = sp.Symbol('x')
f_sym = sp.sin(x_sym) * sp.exp(-x_sym**2 / 2)
f_prime_sym = sp.diff(f_sym, x_sym)
print(f"\n方法 2: 符号求导 (sympy)")
print(f"  f(x) = {f_sym}")
print(f"  f'(x) = {f_prime_sym}")
print(f"  f'(x={x0}) = {float(f_prime_sym.subs(x_sym, x0)):.12f}")
print(f"  误差 = {abs(float(f_prime_sym.subs(x_sym, x0)) - true_grad):.2e} (机器精度)")

# 方法 3: 自动微分（用 autograd 或 jax 思路手动实现）
# 这里用手动"前向 AD"演示（双数 / 对偶数）
class DualNumber:
    """前向自动微分的对偶数: a + b·ε, ε²=0"""
    def __init__(self, a, b):
        self.a = a  # 值
        self.b = b  # 导数

    def __add__(self, other):
        if isinstance(other, DualNumber):
            return DualNumber(self.a + other.a, self.b + other.b)
        return DualNumber(self.a + other, self.b)

    def __mul__(self, other):
        if isinstance(other, DualNumber):
            return DualNumber(self.a * other.a, self.a * other.b + self.b * other.a)
        return DualNumber(self.a * other, self.b * other)

    def __radd__(self, other): return self + other
    def __rmul__(self, other): return self * other

# 用对偶数实现 sin 和 exp
def sin_dual(d):
    return DualNumber(np.sin(d.a), np.cos(d.a) * d.b)

def exp_dual(d):
    return DualNumber(np.exp(d.a), np.exp(d.a) * d.b)

print(f"\n方法 3: 自动微分 (前向模式，对偶数)")
x_dual = DualNumber(x0, 1.0)  # x = 1 + 1·ε
# f(x) = sin(x) * exp(-x^2/2)
# 用对偶数运算
inner = DualNumber(-x0**2 / 2, -x0)  # -x²/2 的值与导数
exp_part = exp_dual(inner)
sin_part = sin_dual(x_dual)
result = sin_part * exp_part
print(f"  f'(x={x0}) = {result.b:.12f}")
print(f"  误差 = {abs(result.b - true_grad):.2e} (机器精度)")
print(f"  → AD 与符号求导同样精确，但 AD 适用于任意代码")
print(f"  → PyTorch/TensorFlow 用反向模式 AD，对深度网络梯度计算最优")
```

```python
import numpy as np

# 梯度裁剪实现
def clip_gradient(grad, max_norm):
    """按范数裁剪梯度"""
    grad_norm = np.linalg.norm(grad)
    if grad_norm > max_norm:
        grad = grad * (max_norm / grad_norm)
    return grad, grad_norm

# 模拟梯度爆炸场景
np.random.seed(42)
print(f"=== 梯度裁剪 ===")
# 假设一个 10 层网络的梯度（爆炸）
grad_exploding = np.random.randn(100) * 100  # 范数很大
grad_clipped, original_norm = clip_gradient(grad_exploding, max_norm=5.0)
print(f"原始梯度范数: {original_norm:.4f}")
print(f"裁剪后范数: {np.linalg.norm(grad_clipped):.4f}")
print(f"方向保持? {np.allclose(grad_clipped / np.linalg.norm(grad_clipped), grad_exploding / np.linalg.norm(grad_exploding))}")

# L2 正则化改善条件数
print(f"\n=== L2 正则化改善条件数 ===")
np.random.seed(0)
# 构造一个病态矩阵
n = 20
A = np.random.randn(n, n)
ATA = A.T @ A
kappa_ATA = np.linalg.cond(ATA)
print(f"原始 A^T A 条件数: {kappa_ATA:.2e}")

# 加 L2 正则化
for lam in [0.01, 0.1, 1.0, 10.0]:
    ATA_reg = ATA + lam * np.eye(n)
    kappa_reg = np.linalg.cond(ATA_reg)
    print(f"  λ={lam:6.2f}: κ(A^T A + λI) = {kappa_reg:.2e}")

# 求解对比
b = np.random.randn(n)
x_no_reg = np.linalg.solve(ATA, A.T @ b)
x_ridge = np.linalg.solve(ATA + 1.0 * np.eye(n), A.T @ b)
print(f"\n无正则化解范数: ||x|| = {np.linalg.norm(x_no_reg):.4f}")
print(f"岭回归解范数:   ||x|| = {np.linalg.norm(x_ridge):.4f}")
print(f"→ L2 正则化让解范数更小（更稳定），代价是有偏")

# Xavier 初始化的方差稳定性
print(f"\n=== Xavier 初始化 ===")
def xavier_init(fan_in, fan_out):
    """Xavier 初始化: Var(W) = 1/fan_in"""
    return np.random.randn(fan_in, fan_out) * np.sqrt(1.0 / fan_in)

def he_init(fan_in, fan_out):
    """He 初始化（ReLU 用）: Var(W) = 2/fan_in"""
    return np.random.randn(fan_in, fan_out) * np.sqrt(2.0 / fan_in)

# 模拟 10 层前向传播方差变化
np.random.seed(42)
fan_in, fan_out = 100, 100
x = np.random.randn(fan_in)  # 输入，方差 1
print(f"初始输入方差: {np.var(x):.4f}")

# 用 Xavier 初始化：方差应保持稳定
for layer in range(10):
    W = xavier_init(fan_in, fan_out)
    x = W.T @ x  # 前向传播
print(f"Xavier 初始化 10 层后方差: {np.var(x):.4f} (应稳定)")

# 用过大初始化：方差爆炸
x = np.random.randn(fan_in)
for layer in range(10):
    W = np.random.randn(fan_in, fan_out) * 1.0  # 方差 1，远大于 Xavier
    x = W.T @ x
print(f"过大初始化 10 层后方差: {np.var(x):.4f} (爆炸！)")

# 用过小初始化：方差消失
x = np.random.randn(fan_in)
for layer in range(10):
    W = np.random.randn(fan_in, fan_out) * 0.01  # 方差过小
    x = W.T @ x
print(f"过小初始化 10 层后方差: {np.var(x):.4f} (消失！)")

print(f"\n→ Xavier 初始化通过控制权重方差 = 1/fan_in，让前向方差稳定")
print(f"→ 这本质上是控制权重矩阵的谱半径，避免雅可比条件数爆炸")
```

```python
import numpy as np

# Adam 优化器实现与对比
def adam_optimizer(grad_fn, x0, learning_rate=0.01, beta1=0.9, beta2=0.999,
                   eps=1e-8, num_iter=200):
    """Adam 优化器实现"""
    x = x0.copy()
    m = np.zeros_like(x)  # 一阶矩
    v = np.zeros_like(x)  # 二阶矩

    for t in range(1, num_iter + 1):
        g = grad_fn(x)
        m = beta1 * m + (1 - beta1) * g
        v = beta2 * v + (1 - beta2) * (g ** 2)
        # 偏差修正
        m_hat = m / (1 - beta1 ** t)
        v_hat = v / (1 - beta2 ** t)
        # 更新
        x = x - learning_rate * m_hat / (np.sqrt(v_hat) + eps)

    return x

def sgd_optimizer(grad_fn, x0, learning_rate=0.01, num_iter=200):
    """纯 SGD（无动量）"""
    x = x0.copy()
    for _ in range(num_iter):
        g = grad_fn(x)
        x = x - learning_rate * g
    return x

# 在 Rosenbrock 函数上对比（病态曲率，各向异性）
def rosenbrock_grad(x):
    df_dx = -2 * (1 - x[0]) - 400 * x[0] * (x[1] - x[0]**2)
    df_dy = 200 * (x[1] - x[0]**2)
    return np.array([df_dx, df_dy])

def rosenbrock(x):
    return (1 - x[0])**2 + 100 * (x[1] - x[0]**2)**2

np.random.seed(42)
x0 = np.array([-1.0, 1.0])  # 远离最小值的起点
print(f"=== Adam vs SGD 在 Rosenbrock 函数上 ===")
print(f"起点: x0 = {x0}, f(x0) = {rosenbrock(x0)}")
print(f"理论最小值: (1, 1), f = 0\n")

# 对比不同学习率
for lr in [0.001, 0.01, 0.1]:
    x_sgd = sgd_optimizer(rosenbrock_grad, x0, learning_rate=lr, num_iter=500)
    x_adam = adam_optimizer(rosenbrock_grad, x0, learning_rate=lr, num_iter=500)
    print(f"学习率 η={lr}:")
    print(f"  SGD:  终点 = {x_sgd}, f = {rosenbrock(x_sgd):.6e}")
    print(f"  Adam: 终点 = {x_adam}, f = {rosenbrock(x_adam):.6e}")

print(f"\n→ Adam 的自适应学习率对各向异性曲率更鲁棒")
print(f"→ SGD 在小学习率下进展慢，大学习率下振荡")
print(f"→ Adam 通过逐参数缩放，让各方向有效学习率更均衡")

# 验证 Adam 的"对角预处理"视角
print(f"\n=== Adam 的对角预处理视角 ===")
# 在病态二次型 f(x) = 0.5 * (100*x1^2 + x2^2) 上对比
def ill_cond_grad(x):
    return np.array([100 * x[0], x[1]])

def ill_cond(x):
    return 0.5 * (100 * x[0]**2 + x[1]**2)

x0 = np.array([1.0, 1.0])
print(f"病态二次型: f(x) = 0.5 * (100*x1² + x2²)")
print(f"κ(H_f) = 100 (强各向异性)")
print(f"起点: x0 = {x0}, f(x0) = {ill_cond(x0)}\n")

for lr in [0.001, 0.01]:
    x_sgd = sgd_optimizer(ill_cond_grad, x0, learning_rate=lr, num_iter=300)
    x_adam = adam_optimizer(ill_cond_grad, x0, learning_rate=lr, num_iter=300)
    print(f"学习率 η={lr}:")
    print(f"  SGD:  终点 = {x_sgd}, f = {ill_cond(x_sgd):.6e}")
    print(f"  Adam: 终点 = {x_adam}, f = {ill_cond(x_adam):.6e}")

print(f"\n→ Adam 的自适应学习率近似抵消了海森矩阵的对角元 (100, 1)")
print(f"→ 让两个方向的有效曲率都接近 1，加速收敛")
print(f"→ 这就是 Adam 等价于'对角预处理'的实证")
```

```python
import numpy as np

# 残差连接的雅可比稳定性演示
print(f"=== 残差连接的雅可比稳定性 ===\n")

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_deriv(x):
    s = sigmoid(x)
    return s * (1 - s)

# 模拟 20 层网络（无残差连接 vs 有残差连接）
n_layers = 20
input_dim = 10
np.random.seed(42)

# 输入
x = np.random.randn(input_dim)

# 情形 1: 无残差连接，每层 f(x) = sigmoid(W x)
# 雅可比 J = diag(sigmoid'(W x)) · W
W_list = [np.random.randn(input_dim, input_dim) * 0.3 for _ in range(n_layers)]

# 前向 + 计算累积雅可比
J_no_res = np.eye(input_dim)
x_no_res = x.copy()
for layer in range(n_layers):
    z = W_list[layer] @ x_no_res
    x_no_res = sigmoid(z)
    # 累积雅可比（前向传播模式 AD）
    J_layer = np.diag(sigmoid_deriv(z)) @ W_list[layer]
    J_no_res = J_layer @ J_no_res

print(f"无残差连接，{n_layers} 层后:")
print(f"  最终输入范数: {np.linalg.norm(x_no_res):.6e}")
print(f"  累积雅可比范数: {np.linalg.norm(J_no_res):.6e}")
print(f"  累积雅可比奇异值范围: [{np.linalg.svd(J_no_res, compute_uv=False).min():.2e}, "
      f"{np.linalg.svd(J_no_res, compute_uv=False).max():.2e}]")

# 情形 2: 有残差连接，每层 f(x) = x + sigmoid(W x)
# 雅可比 J = I + diag(sigmoid'(W x)) · W
J_res = np.eye(input_dim)
x_res = x.copy()
for layer in range(n_layers):
    z = W_list[layer] @ x_res
    x_res = x_res + sigmoid(z)  # 残差连接
    # 累积雅可比
    J_layer = np.eye(input_dim) + np.diag(sigmoid_deriv(z)) @ W_list[layer]
    J_res = J_layer @ J_res

print(f"\n有残差连接，{n_layers} 层后:")
print(f"  最终输入范数: {np.linalg.norm(x_res):.6e}")
print(f"  累积雅可比范数: {np.linalg.norm(J_res):.6e}")
svd_res = np.linalg.svd(J_res, compute_uv=False)
print(f"  累积雅可比奇异值范围: [{svd_res.min():.2e}, {svd_res.max():.2e}]")

# 对比条件数
print(f"\n条件数对比:")
print(f"  无残差: κ(J) = {np.linalg.cond(J_no_res):.2e}")
print(f"  有残差: κ(J) = {np.linalg.cond(J_res):.2e}")
print(f"\n→ 残差连接让雅可比矩阵的特征值聚集在 1 附近")
print(f"→ 条件数显著降低，梯度传播更稳定")
print(f"→ 这就是 ResNet 能训练 1000+ 层的数学根源")
```

<ClientOnly>
<BackpropComputingGraph title="反向传播计算图探索器 · 前向/反向传播可视化 · 自动微分原理动画" />
</ClientOnly>

---

## 本章小结

本节完成了从**矩阵微积分动机**到**AI 实战陷阱**的完整旅程，把**动态变化的矩阵**转化为可计算的代数工具，并铺设了通往 AI 工程实践的桥梁：

1. **微积分是动态化的起点**：从静态的 SVD 矩阵分解进入动态的矩阵微积分，梯度 $\nabla f$ 是 AI 优化的核心，雅可比矩阵是局部线性逼近的工具，海森矩阵是局部曲率的特征值描述。Rosenbrock 函数揭示了曲率各向异性对优化的挑战。
2. **求导法则是工具**：分母布局统一了 AI 领域的梯度形状约定（梯度形状 = 变量形状）。核心公式 $\nabla(\mathbf{x}^T A \mathbf{x}) = (A + A^T)\mathbf{x}$、$\nabla \text{tr}(AX) = A^T$、$\nabla \log \det X = X^{-T}$ 是推导反向传播的代数基石。
3. **链式法则是引擎**：$\nabla_\mathbf{X} L = J^T \nabla_\mathbf{Y} L$ 把**对复合函数求导**分解为**局部雅可比 × 上游梯度**。反向传播 = 链式法则在计算图上的动态规划，让任意深度网络的梯度计算复杂度仅与节点数成正比。形状法则是调试神经网络的第一工具。
4. **数值稳定性是哲学**：浮点数的有限精度让**理论上正确**的算法可能数值失效。条件数 $\kappa(A) = \|A\| \cdot \|A^{-1}\| = \sigma_{\max}/\sigma_{\min}$ 是问题的核心指标，$\kappa > 10^6$ 视为不可解。梯度消失/爆炸的本质是网络雅可比矩阵条件数过大。
5. **矩阵分解是算法库**：LU（一般方阵，$(2/3)n^3$）、Cholesky（正定对称，$(1/3)n^3$）、QR（最小二乘，$(4/3)n^3$）、SVD（最稳定但 $21n^3$）各有适用场景。不要用高斯消元判定秩——SVD 奇异值阈值法是工业标准。
6. **迭代法是大规模工具**：幂法、QR 算法、共轭梯度、Krylov 子空间方法让百万级稀疏矩阵的求解成为可能。CG 复杂度 $O(\sqrt{\kappa} \cdot \text{nnz})$，远优于直接法的 $O(n^3)$。
7. **实战陷阱是工程素养**：Softmax 用 Log-Sum-Exp 防溢出，自动微分替代数值差分，梯度裁剪应对爆炸，Xavier 初始化控制特征值，L2 正则化改善条件数，BatchNorm 稳定雅可比——这些技术把**理论公式**转化为**可运行代码**。

### 全章回顾：从向量到 AI 的完整旅程

至此，第一章**线性代数**的内容告一段落。从 1.1 节的向量与矩阵基础，到 1.8 节的数值计算与稳定性，我们建立了完整的线性代数工具链：

- **1.1 向量与基本运算**：向量是 AI 数据的基本单元，点积衡量相似度，范数度量大小。
- **1.2 矩阵与线性变换**：矩阵是**变换的代数表示**，把**几何变换**转化为可计算的代数对象。
- **1.3 线性方程组与秩**：秩是矩阵**独立信息量**的度量，方程组可解性由秩判定。
- **1.4 向量空间与四大子空间**：列空间、零空间、行空间、左零空间构成矩阵的**几何全景**。
- **1.5 正交性与投影**：正交基是理想的坐标系，最小二乘是**最优近似**，QR 分解是数值稳定的正交化。
- **1.6 特征值与特征向量**：特征分解揭示变换的**固有方向**，谱定理保证实对称矩阵的**对角化**。
- **1.7 奇异值分解**：SVD 是线性代数的核心分解工具，任意矩阵都可分解为**旋转-缩放-旋转**三步，四大子空间、低秩逼近、伪逆在 SVD 下统一。
- **1.8 数值计算与稳定性**：矩阵微积分把线性代数从**静态**推向**动态**，数值稳定性把**理论**转化为**工程**，自动微分是连接线性代数与 AI 框架的数学基石。

这套工具链将在后续章节中持续应用——**概率论的协方差矩阵**（特征值 = 主成分方差）、**优化的 Hessian 矩阵**（特征值 = 曲率）、**深度学习的权重初始化与压缩**（SVD 低秩逼近）、**反向传播的自动微分**（链式法则 + 计算图）——所有这些 AI 核心技术都根植于本章建立的线性代数基础。掌握这八章内容，就是掌握了**用线性代数理解 AI**的核心工具。

## 练习题

### 第 1 题 概念推导

设 $A \in \mathbb{R}^{n \times n}$，$\mathbf{x} \in \mathbb{R}^n$。采用分母布局，从分量展开出发证明二次型求导公式 $\nabla_\mathbf{x}(\mathbf{x}^T A \mathbf{x}) = (A + A^T)\mathbf{x}$；并说明当 $A$ 对称时为何简化为 $2A\mathbf{x}$。

::: details 参考答案
把二次型展开为分量形式：

$$
\mathbf{x}^T A \mathbf{x} = \sum_{i=1}^n \sum_{j=1}^n x_i A_{ij} x_j.
$$

对 $x_k$ 求偏导时，需同时处理 $x_i = x_k$（$i$ 求和项）与 $x_j = x_k$（$j$ 求和项）两类贡献：

$$
\frac{\partial}{\partial x_k}(\mathbf{x}^T A \mathbf{x}) = \sum_{j=1}^n A_{kj} x_j + \sum_{i=1}^n x_i A_{ik} = (A\mathbf{x})_k + (A^T \mathbf{x})_k.
$$

把所有分量按列排开，得到 $\nabla_\mathbf{x}(\mathbf{x}^T A \mathbf{x}) = A\mathbf{x} + A^T \mathbf{x} = (A + A^T)\mathbf{x}$。

当 $A$ 对称时 $A = A^T$，故 $(A + A^T)\mathbf{x} = 2A\mathbf{x}$。对称矩阵的二次型中交叉项 $A_{ij} x_i x_j$ 与 $A_{ji} x_j x_i$ 系数相等，求导时各贡献一份，总和恰为 $2A_{ij}$，与直接对 $2\sum_{i \leq j} A_{ij} x_i x_j$ 求导的结果一致。MSE 损失 $L = \mathbf{x}^T A \mathbf{x}$（$A$ 对称正定）的梯度为 $2A\mathbf{x}$ 即源于此。
:::

### 第 2 题 代码验证

利用本节的 `<ConditionNumberIllusion>` 交互组件（或用 Python 构造 Hilbert 矩阵 $H_n$，$n = 5, 10, 15$），计算 $\kappa_2(H_n) = \sigma_{\max}/\sigma_{\min}$，并求解 $H_n \mathbf{x} = \mathbf{b}$（取 $\mathbf{b} = H_n \mathbf{1}$，真解为全 1 向量）。记录相对误差 $\|\hat{\mathbf{x}} - \mathbf{x}\|/\|\mathbf{x}\|$，验证其量级与 $\kappa(H_n) \cdot \epsilon_{\text{mach}}$ 一致。

::: details 参考答案
Hilbert 矩阵 $H_{ij} = 1/(i+j-1)$ 是经典的病态矩阵，条件数随 $n$ 指数增长。Python 验证代码如下：

```python
import numpy as np

def hilbert(n):
    i = np.arange(1, n + 1).reshape(-1, 1)
    j = np.arange(1, n + 1).reshape(1, -1)
    return 1.0 / (i + j - 1)

eps_mach = np.finfo(float).eps  # ≈ 2.22e-16
for n in [5, 10, 15]:
    H = hilbert(n)
    x_true = np.ones(n)
    b = H @ x_true
    x_hat = np.linalg.solve(H, b)
    rel_err = np.linalg.norm(x_hat - x_true) / np.linalg.norm(x_true)
    kappa = np.linalg.cond(H)  # 默认 2-范数条件数
    print(f"n={n:2d}: κ(H)={kappa:.2e}, 相对误差={rel_err:.2e}, κ·ε={kappa*eps_mach:.2e}")
```

典型结果：$n=5$ 时 $\kappa \approx 4.8 \times 10^5$，相对误差 $\approx 10^{-11}$，与 $\kappa \cdot \epsilon_{\text{mach}} \approx 10^{-10}$ 同量级；$n=10$ 时 $\kappa \approx 1.6 \times 10^{13}$，相对误差 $\approx 10^{-4}$；$n=15$ 时 $\kappa \approx 6.9 \times 10^{17}$，相对误差 $\approx 10^{-2}$，解已严重失真。

这一实验印证了 1.8.4 节的结论：输出的相对误差上界为 $\kappa(A) \cdot \epsilon_{\text{mach}}$，条件数越大，数值解越不可靠。当 $\kappa > 10^{16}$ 时（$n=15$ 的 Hilbert 矩阵），误差已与 1 同量级，解毫无意义。
:::

### 第 3 题 概念推导

证明 Log-Sum-Exp 技巧给出的 $\text{softmax}(\mathbf{z})_i = \dfrac{e^{z_i - c}}{\sum_j e^{z_j - c}}$（$c = \max_k z_k$）与原始定义 $\text{softmax}(\mathbf{z})_i = \dfrac{e^{z_i}}{\sum_j e^{z_j}}$ 数学上完全等价，并说明为何这一变形能同时避免上溢与下溢。

::: details 参考答案
**等价性证明**：取 $c = \max_k z_k$，分子分母同乘 $e^{-c}$：

$$
\frac{e^{z_i - c}}{\sum_j e^{z_j - c}} = \frac{e^{z_i} \cdot e^{-c}}{\sum_j e^{z_j} \cdot e^{-c}} = \frac{e^{z_i} \cdot e^{-c}}{e^{-c} \cdot \sum_j e^{z_j}} = \frac{e^{z_i}}{\sum_j e^{z_j}}.
$$

$e^{-c}$ 是非零常数，分子分母约去后恒等于原始定义，故数学上完全等价。

**避免上溢**：$c = \max_k z_k$ 保证所有指数输入 $z_j - c \leq 0$，故 $e^{z_j - c} \leq 1$，不会出现 $e^{1000} = \infty$ 的上溢。

**避免下溢**：分母 $\sum_j e^{z_j - c} \geq e^{z_k - c} = e^0 = 1$（$k$ 是最大值下标），故分母恒不小于 1，不会因分母下溢为零而导致除零。分子 $e^{z_i - c}$ 在 $z_i \ll c$ 时可能下溢为零，但这对应概率确实接近零的情形，是正确的数值行为，不会引发 NaN。

对数形式 $\log \sum_j e^{z_j} = c + \log \sum_j e^{z_j - c}$ 同样稳定：内部 $\sum_j e^{z_j - c} \in [1, n]$，$\log$ 取值有界。PyTorch 的 `F.log_softmax` 与 `F.cross_entropy` 内部是用这一变形实现数值稳定。
:::

## 常见错误

**错误 1 · 混用分子布局与分母布局导致梯度形状错误**

原因：矩阵微积分存在分子布局与分母布局两种约定，前者把标量对向量的梯度排成行向量，后者排成列向量。若在同一项目中混用两种约定，公式形式会相互矛盾——例如 $\nabla_\mathbf{x}(\mathbf{x}^T A \mathbf{x})$ 在分母布局下为 $(A + A^T)\mathbf{x}$（列向量），在分子布局下为 $\mathbf{x}^T(A + A^T)$（行向量），代入代码时形状不匹配，梯度下降更新 $\theta \leftarrow \theta - \eta \nabla_\theta L$ 无法执行。

解决：在项目 README 或代码注释中明确声明采用的布局约定（AI 领域通用分母布局，即梯度形状与自变量一致）。阅读他人论文或代码时，先查看公式表或由梯度形状推断布局。PyTorch、TensorFlow 等框架内部统一采用分母布局，自定义层求导时务必与框架保持一致。

**错误 2 · 直接计算 Softmax 导致数值溢出**

原因：Softmax 的原始定义 $\text{softmax}(\mathbf{z})_i = e^{z_i}/\sum_j e^{z_j}$ 中，当某个 $z_i$ 较大（如 $z_i = 1000$）时，$e^{z_i}$ 上溢为 $\infty$，分子分母同为 $\infty$ 得到 NaN。深度学习中 logits 经过若干层线性变换后量级可能很大，直接计算 Softmax 在训练初期或学习率过大时频繁失效。

解决：始终使用 Log-Sum-Exp 技巧，取 $c = \max_k z_k$，计算 $\text{softmax}(\mathbf{z})_i = e^{z_i - c}/\sum_j e^{z_j - c}$。所有指数输入 $\leq 0$，避免上溢；分母 $\geq 1$，避免除零。涉及交叉熵损失时，直接用 logits 计算 $\log \text{softmax}$（如 PyTorch 的 `F.cross_entropy`），避免先算概率再取对数的精度损失。

**错误 3 · 用数值差分替代自动微分进行梯度计算**

原因：数值差分 $(f(x+h) - f(x))/h$ 实现简单，但存在截断误差与舍入误差的跷跷板——$h$ 太大则截断误差主导，$h$ 太小则舍入误差主导，最佳精度约 $10^{-8}$，远低于机器精度。更严重的是，对 $n$ 维参数的梯度需要 $n$ 次前向求值，深度学习参数量动辄百万，数值差分的计算量不可接受。

解决：训练神经网络时使用自动微分（反向模式 AD），它具有机器精度、计算量与前向传播同阶的优势。PyTorch 的 `loss.backward()`、TensorFlow 的 `GradientTape` 内部即反向模式 AD。数值差分仅用于验证自动微分的正确性（梯度检查），且应选用中心差分 $(f(x+h) - f(x-h))/(2h)$ 与合适步长 $h \approx 10^{-6}$。

**错误 4 · 用行列式接近零判断矩阵病态**

原因：行列式 $\det(A)$ 衡量矩阵对体积的绝对缩放率，受矩阵规模与元素量级影响很大。$0.01 I_{100}$ 的行列式为 $0.01^{100} \approx 10^{-200}$（极小），但条件数为 1（完全良态）；反之 $10^{10} I_{2}$ 的行列式为 $10^{20}$（极大），条件数也为 1。把行列式接近零等同于矩阵病态，会导致大量误判。

解决：判定矩阵病态的唯一可靠指标是条件数 $\kappa(A) = \sigma_{\max}/\sigma_{\min}$（或 $\|A\| \cdot \|A^{-1}\|$），它与矩阵规模和元素量级无关，直接刻画问题的数值敏感度。工程上 $\kappa > 10^6$ 视为病态，$\kappa > 10^{16}$ 在双精度下不可解。NumPy 的 `np.linalg.cond(A)` 直接给出 2-范数条件数，判定时使用这一函数而非 `np.linalg.det`。