---
title: 3.6 约束优化与对偶理论
sidebar:
  order: 6
---
# 3.6 约束优化与对偶理论

前五节的算法都假设变量可以取遍整个空间：最优性条件是梯度为零，迭代方向由模型的梯度或曲率决定。实际问题中变量几乎总带限制：概率单纯形上的权重和为 $1$，协方差矩阵必须半正定，模型中希望只有少数参数非零，系统中的物理量有取值范围。约束进入问题之后，梯度为零不再是必要条件（最优点可以在边界上，那里梯度不为零），算法也不能沿任意下降方向自由移动。

约束的处理有两条路线。第一条把约束吸收进目标函数：罚函数在违反约束时增加代价，对数障碍在接近边界时趋于无穷，增广拉格朗日把罚函数与乘子估计组合起来。转化之后可以用无约束方法求解，代价是引入的参数需要控制。第二条把约束保留在算法内部：单纯形沿多面体的棱移动，积极集方法在边界面之间切换，内点法在可行域内部沿中心路径逼近边界。

两条路线由**对偶理论**统一起来。约束的数量决定对偶问题中变量的个数，每个约束配一个**乘子**（multiplier），乘子度量约束对最优值的边际影响。对偶问题给出最优值的下界，这一下界既用于算法终止判据，也用于灵敏度分析；对偶问题的目标函数始终是凹的，即便原问题非凸。本节按这一顺序展开：先给出拉格朗日函数与 KKT 条件，再建立对偶理论，然后讨论三类把约束转化为无约束的方法，最后回到线性规划与锥规划这两个结构最清楚的问题类。

## 3.6.1 约束问题与拉格朗日函数

### 问题的写法

约束优化问题的标准形式为

$$
\begin{aligned}
\text{minimize} \quad & f(\mathbf{x}) \\
\text{subject to} \quad & g_i(\mathbf{x}) \leq 0, \quad i = 1, \dots, m \\
& h_j(\mathbf{x}) = 0, \quad j = 1, \dots, p
\end{aligned}
$$

可行域 $\mathcal{D} = \{\mathbf{x} : g_i(\mathbf{x}) \leq 0,\ h_j(\mathbf{x}) = 0\}$，最优值记为 $f^*$。不等式约束 $g_i \leq 0$ 与等式约束 $h_j = 0$ 分开写，因为两者在最优性条件中的乘子符号规则不同：不等式约束的乘子非负，等式约束的乘子可正可负。**积极约束**（active constraint）指在 $\mathbf{x}$ 处取等号的不等式约束（$g_i(\mathbf{x}) = 0$），其余称为非积极约束。

变量的取值限制可以写成显式约束，也可以在算法中隐式处理。概率单纯形 $\{\mathbf{x} : \mathbf{x} \geq \mathbf{0},\ \mathbf{1}^T\mathbf{x} = 1\}$ 适合第一种写法；神经网络的权重没有显式约束，但训练过程中通过正则化与参数化间接限制取值范围。

### 拉格朗日函数

把约束加权并入目标函数，得到**拉格朗日函数**（Lagrangian）：

$$
L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{i=1}^{m} \lambda_i g_i(\mathbf{x}) + \sum_{j=1}^{p} \nu_j h_j(\mathbf{x})
$$

其中 $\lambda_i$ 与 $\nu_j$ 是**拉格朗日乘子**。对可行点 $\mathbf{x}$ 与 $\boldsymbol{\lambda} \geq \mathbf{0}$，修正项满足 $\sum_i \lambda_i g_i(\mathbf{x}) \leq 0$ 与 $\sum_j \nu_j h_j(\mathbf{x}) = 0$，因此 $L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \leq f(\mathbf{x})$：拉格朗日函数在可行域上是原目标的下方估计。这一不等式是所有对偶结论的起点。

乘子的意义通过一个可以手算的例子显出。考虑

$$
\text{minimize} \quad x_1^2 + x_2^2 \qquad \text{subject to} \quad x_1 + 2x_2 = 1
$$

拉格朗日函数为 $L = x_1^2 + x_2^2 + \nu(x_1 + 2x_2 - 1)$。梯度为零给出 $2x_1 + \nu = 0$、$2x_2 + 2\nu = 0$，即 $x_1 = -\nu/2$、$x_2 = -\nu$。代入约束：

$$
-\frac{\nu}{2} - 2\nu = 1 \quad \Longrightarrow \quad \nu = -\frac{2}{5}
$$

于是 $\mathbf{x}^* = (1/5,\ 2/5)$，$f^* = 1/25 + 4/25 = 1/5$。乘子的含义可以从扰动读出：把约束右端从 $1$ 改为 $1 + \delta$，最优值的一阶变化为 $\nu\delta = -0.4\delta$。加到第一项上的约束（允许 $x_1 + 2x_2$ 更大）放松了条件，最优值下降；乘子的符号（这里为负）记录了这一方向。

### 对偶函数与对偶问题

固定乘子，对 $\mathbf{x}$ 取下确界，得到**对偶函数**（dual function）：

$$
q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})
$$

对偶函数给出的值是原问题最优值的下界，**对偶问题**是在乘子上取这个下界的最大值：

$$
\text{maximize} \quad q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \qquad \text{subject to} \quad \boldsymbol{\lambda} \geq \mathbf{0}
$$

在上面的例子中，把 $\mathbf{x}(\nu) = (-\nu/2,\ -\nu)$ 代回 $L$：

$$
q(\nu) = \frac{5\nu^2}{4} + \nu\left(-\frac{5\nu}{2} - 1\right) = -\frac{5\nu^2}{4} - \nu
$$

这是 $\nu$ 的凹二次函数，最大值在 $\nu = -2/5$ 处，$q^* = 1/5$，与原问题的最优值相等。对偶问题的规模由约束个数决定：原问题有 $n$ 个变量、$p$ 个等式约束，对偶问题只有 $p$ 个变量，且没有约束（$p = 1$ 的例子里对偶问题是一维无约束最大化）。

### 约束的几何意义

最优性条件可以用梯度表达。在最优解处，目标函数沿任何可行方向的导数非负（否则可以沿该方向下降）。可行方向构成一个锥：所有与活跃约束的梯度满足 $\nabla g_i^T\mathbf{d} \leq 0$、$\nabla h_j^T\mathbf{d} = 0$ 的方向 $\mathbf{d}$。由 3.2 节的 Farkas 引理（或分离定理），这一条件等价于 $-\nabla f(\mathbf{x}^*)$ 落在由活跃约束梯度生成的锥中：

$$
-\nabla f(\mathbf{x}^*) = \sum_{i \in \mathcal{A}(\mathbf{x}^*)} \lambda_i \nabla g_i(\mathbf{x}^*) + \sum_{j} \nu_j \nabla h_j(\mathbf{x}^*), \qquad \lambda_i \geq 0
$$

其中 $\mathcal{A}(\mathbf{x}^*)$ 是积极约束集合。几何读法：目标函数的下降方向被约束的法方向封堵，乘子 $\lambda_i$ 度量每个约束封堵的强度。无约束的情形（3.3 节）对应 $m = p = 0$，条件退化为 $\nabla f = \mathbf{0}$。

::: tip 投影是约束优化的特例
投影问题 $\min_{\mathbf{x} \in C} \|\mathbf{x} - \mathbf{a}\|^2$ 的最优性条件为 $\mathbf{x}^* = \Pi_C(\mathbf{a})$，等价的变分不等式是 $(\mathbf{a} - \mathbf{x}^*)^T(\mathbf{y} - \mathbf{x}^*) \leq 0$ 对一切 $\mathbf{y} \in C$ 成立。3.7 节的近端算子、投影梯度与算子分裂都建立在这条条件上。
:::

## 3.6.2 KKT 条件

### 一阶必要条件

把上节的几何条件写成代数形式，得到 Karush-Kuhn-Tucker 条件（KKT 条件）：

$$
\begin{aligned}
&\nabla f(\mathbf{x}^*) + \sum_{i=1}^{m} \lambda_i \nabla g_i(\mathbf{x}^*) + \sum_{j=1}^{p} \nu_j \nabla h_j(\mathbf{x}^*) = \mathbf{0} && \text{(平稳性)} \\
&g_i(\mathbf{x}^*) \leq 0, \qquad h_j(\mathbf{x}^*) = 0 && \text{(原始可行性)} \\
&\lambda_i \geq 0 && \text{(对偶可行性)} \\
&\lambda_i g_i(\mathbf{x}^*) = 0, \quad i = 1, \dots, m && \text{(互补松弛)}
\end{aligned}
$$

定理的表述：$f$、$g_i$、$h_j$ 连续可微，$\mathbf{x}^*$ 是局部最优解，且在该点满足某个约束规范（见下文），则存在乘子 $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 使以上四组条件成立。这是一阶必要条件：它筛选候选点，不保证候选点最优。

**互补松弛**（complementary slackness）把积极性与乘子绑定：$\lambda_i > 0$ 的约束必须在边界上（$g_i = 0$），严格不等式 $g_i < 0$ 的约束乘子必为零。由于 $L$ 中只有积极约束与等式约束的项会影响梯度，互补松弛的直接后果是：在最优解处只有活跃约束参与平稳性方程，非活跃约束的乘子不起作用。

### 约束规范

必要条件成立的前提是约束规范（constraint qualification）。常用的三个：

**Slater 条件**适用于凸问题：$f$ 与 $g_i$ 凸、$h_j$ 仿射，且存在严格可行点（$g_i(\tilde{\mathbf{x}}) < 0$、$h_j(\tilde{\mathbf{x}}) = 0$）。

**LICQ**（线性无关约束规范）：活跃约束与等式约束的梯度 $\{\nabla g_i(\mathbf{x}^*)\}_{i \in \mathcal{A}} \cup \{\nabla h_j(\mathbf{x}^*)\}$ 线性无关。

**MFCQ**：存在方向使所有活跃不等式约束的梯度严格减少（$\nabla g_i^T\mathbf{d} < 0$，$i \in \mathcal{A}$）且等式约束梯度保持零。LICQ 强于 MFCQ；MFCQ 允许多个约束的梯度线性相关（只要方向仍然存在）。

约束规范失效时 KKT 条件可能找不到乘子。典型例子是 $\min x$ subject to $x^2 \leq 0$：可行域只有一点 $x = 0$，该点显然最优，但 $\nabla g(0) = 0$，平稳性方程 $1 + \lambda \cdot 0 = 1 \neq 0$ 对任何 $\lambda$ 都不成立。问题的根源是约束函数的梯度在最优解处退化，即使简单的约束也可能违反 LICQ 与 Slater。

### 凸情形的充分性

对凸问题，KKT 条件从必要转为充分：$f$ 与 $g_i$ 凸、$h_j$ 仿射，若 $(\mathbf{x}^*, \boldsymbol{\lambda}, \boldsymbol{\nu})$ 满足 KKT，则 $\mathbf{x}^*$ 是全局最优解。证明只用三行：对任意可行 $\mathbf{x}$，凸性给出 $f(\mathbf{x}) \geq f(\mathbf{x}^*) + \nabla f(\mathbf{x}^*)^T(\mathbf{x} - \mathbf{x}^*)$，而平稳性给出 $\nabla f(\mathbf{x}^*) = -\sum_i \lambda_i \nabla g_i(\mathbf{x}^*) - \sum_j \nu_j \nabla h_j(\mathbf{x}^*)$；代入后，$g_i$ 的凸性给出 $\nabla g_i(\mathbf{x}^*)^T(\mathbf{x} - \mathbf{x}^*) \leq g_i(\mathbf{x}) - g_i(\mathbf{x}^*) \leq -g_i(\mathbf{x}^*)$，$h_j$ 的仿射性给出 $\nabla h_j^T(\mathbf{x} - \mathbf{x}^*) = 0$。整理得

$$
f(\mathbf{x}) \geq f(\mathbf{x}^*) - \sum_i \lambda_i\big(g_i(\mathbf{x}) - g_i(\mathbf{x}^*)\big) \geq f(\mathbf{x}^*) + \sum_i \lambda_i g_i(\mathbf{x}^*) = f(\mathbf{x}^*)
$$

最后一步用了 $g_i(\mathbf{x}) \leq 0$、$\lambda_i \geq 0$ 与互补松弛。凸性加 KKT 是理论上最常用的组合：**把寻找最优解转化为求解 KKT 系统**。

### 数值验证

下面的代码在二维问题上验证 KKT 条件，并实现积极集枚举。问题为

$$
\text{minimize} \quad (x_1 - 2)^2 + (x_2 - 2)^2 \qquad \text{subject to} \quad x_1 + x_2 \leq 2, \quad x_1 \leq 0.5
$$

两个约束写成 $g_1 = x_1 + x_2 - 2 \leq 0$、$g_2 = x_1 - 0.5 \leq 0$。无约束最优点 $(2, 2)$ 违反两个约束；可以猜到最优点在两个约束的边界交点上，即 $\mathbf{x}^* = (0.5,\ 1.5)$。该点的梯度为 $\nabla f = (-3, -1)$，两个约束的梯度为 $\nabla g_1 = (1, 1)$、$\nabla g_2 = (1, 0)$；解平稳性方程 $-3 + \lambda_1 + \lambda_2 = 0$、$-1 + \lambda_1 = 0$ 得 $\lambda_1 = 1$、$\lambda_2 = 2$，都非负。

```python
import numpy as np

# 问题：min (x1-2)^2 + (x2-2)^2  s.t. x1 + x2 <= 2, x1 <= 0.5

def f(x):
    return float((x[0] - 2) ** 2 + (x[1] - 2) ** 2)

def grad(x):
    return np.array([2 * (x[0] - 2), 2 * (x[1] - 2)])

def g(x):
    return np.array([x[0] + x[1] - 2, x[0] - 0.5])

# 在解析解 x* = (0.5, 1.5)、lambda* = (1, 2) 处检验 KKT 四组条件
x_star, lam = np.array([0.5, 1.5]), np.array([1.0, 2.0])
A = np.array([[1.0, 1.0], [1.0, 0.0]])          # 各约束的梯度
print("平稳性残差:", np.linalg.norm(grad(x_star) + A.T @ lam))
print("原始可行性 (max g):", g(x_star).max())
print("对偶可行性 (min lambda):", lam.min())
print("互补松弛 (max |lambda_i g_i|):", np.abs(lam * g(x_star)).max())

# 积极集枚举：对每个候选积极集解 KKT 系统，检查可行性
H, c = 2 * np.eye(2), np.array([-4.0, -4.0])
b_con = np.array([2.0, 0.5])
for S in [(), (0,), (1,), (0, 1)]:
    if len(S) == 0:
        x = -np.linalg.solve(H, c)
        print(f"积极集 {S}: x = ({x[0]:.4f}, {x[1]:.4f}), 可行 = {(g(x) <= 1e-12).all()}")
    else:
        As = A[list(S)]
        K = np.block([[H, As.T], [As, np.zeros((len(S), len(S)))]])
        sol = np.linalg.solve(K, np.concatenate([-c, b_con[list(S)]]))
        x, mu = sol[:2], sol[2:]
        mu_str = ", ".join(f"{v:.4f}" for v in mu)
        print(f"积极集 {S}: x = ({x[0]:.4f}, {x[1]:.4f}), 乘子 = ({mu_str}), "
              f"可行 = {(g(x) <= 1e-12).all()}, 乘子非负 = {(mu >= -1e-12).all()}")
```

输出：

```text
平稳性残差: 0.0
原始可行性 (max g): 0.0
对偶可行性 (min lambda): 1.0
互补松弛 (max |lambda_i g_i|): 0.0
积极集 (): x = (2.0000, 2.0000), 可行 = False
积极集 (0,): x = (1.0000, 1.0000), 乘子 = (2.0000), 可行 = False, 乘子非负 = True
积极集 (1,): x = (0.5000, 2.0000), 乘子 = (3.0000), 可行 = False, 乘子非负 = True
积极集 (0, 1): x = (0.5000, 1.5000), 乘子 = (1.0000, 2.0000), 可行 = True, 乘子非负 = True
```

四组 KKT 残差全为零，确认 $(0.5, 1.5)$ 满足 KKT。积极集枚举的输出展示了这类问题的结构：四个候选积极集分别对应无约束解、两个单约束解与双约束解，其中前三者的乘子虽然非负，但解落在可行域之外，只有双活跃候选同时满足可行性与乘子非负。枚举所有积极集在 $m$ 较大时不可行（$2^m$ 个组合），实际算法用迭代方式从一个积极集移动到相邻的积极集，每次只增删一个约束。这种移动方式与单纯形法的枢轴操作是同一机制。

注意积极集 $(0,)$ 与 $(1,)$ 的乘子都非负，说明单纯看乘子符号不能判断最优性，原始可行性同样是四组条件的一部分。反过来的情形也存在：乘子为负的候选点直接排除，这是枚举过程中最便宜的剪枝手段。

## 3.6.3 对偶理论

### 弱对偶

对偶函数在可行域上不超过原问题最优值：对任意可行 $\mathbf{x}$ 与任意 $\boldsymbol{\lambda} \geq \mathbf{0}$，

$$
q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}'} L(\mathbf{x}', \boldsymbol{\lambda}, \boldsymbol{\nu}) \leq L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_i \lambda_i g_i(\mathbf{x}) + \sum_j \nu_j h_j(\mathbf{x}) \leq f(\mathbf{x})
$$

第二个不等号用到 $g_i(\mathbf{x}) \leq 0$、$\lambda_i \geq 0$ 与 $h_j(\mathbf{x}) = 0$。对一切可行 $\mathbf{x}$ 取最小值得 $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \leq f^*$，这一结论称为**弱对偶**（weak duality），它不要求问题凸。两个直接后果：对偶问题的任何可行点给原问题最优值一个下界；原问题的任何可行点给对偶最优值一个上界。两者的差 $f(\mathbf{x}) - q(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 称为**对偶间隙**（duality gap），它是算法终止的实用判据：间隙小于容差时，当前的原点与乘子都已经是近似最优。

### 对偶函数的凹性与次梯度

无论原问题是否凸，$q$ 总是凹函数。理由：固定 $\mathbf{x}$ 时 $L(\mathbf{x}, \cdot, \cdot)$ 是乘子的仿射函数，$q$ 是一族仿射函数的逐点下确界，而逐点下确界保持凹性（3.2 节保凸运算的对称版本）。凹性带来一个重要推论：**对偶问题总是凸优化问题**，可以用 3.3 到 3.5 节的任何方法求解，与原问题的凸性无关。

$q$ 的次梯度有显式表达。设 $\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 使下确界达到，对任意乘子 $(\boldsymbol{\lambda}', \boldsymbol{\nu}')$：

$$
q(\boldsymbol{\lambda}', \boldsymbol{\nu}') \leq L(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu}), \boldsymbol{\lambda}', \boldsymbol{\nu}') = q(\boldsymbol{\lambda}, \boldsymbol{\nu}) + (\boldsymbol{\lambda}' - \boldsymbol{\lambda})^T \mathbf{g}(\mathbf{x}(\cdot)) + (\boldsymbol{\nu}' - \boldsymbol{\nu})^T \mathbf{h}(\mathbf{x}(\cdot))
$$

右端关于 $(\boldsymbol{\lambda}', \boldsymbol{\nu}')$ 的线性项系数为 $(\mathbf{g}, \mathbf{h})$，按次梯度定义 $\big(\mathbf{g}(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu})),\ \mathbf{h}(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu}))\big) \in \partial q$。若最小值点唯一，$q$ 在该点可微，梯度就是约束在最小值点处的取值。这一公式的含义：**对偶函数的梯度把约束的违反程度反馈给乘子**，违反的约束按违反量增大乘子，这正是罚参数自动调整的机制。

### 强对偶与 Slater 条件

**强对偶**（strong duality）指 $q^* = f^*$，对偶间隙为零。凸问题在满足 Slater 条件时成立强对偶，且对偶最优解集非空有界。要点有三：凸性保证分离定理可用，把原问题的最优值与对偶的最优值用同一张分离超平面联系起来；Slater 保证对偶问题的最优值能被某个乘子取到，而不只是在极限处被逼近；此时 KKT 条件给出的乘子就是最优对偶变量，KKT 的充分性（前节）与强对偶是同一件事的两种说法。

### 鞍点与极小极大

若 $(\mathbf{x}^*, \boldsymbol{\lambda}^*, \boldsymbol{\nu}^*)$ 满足

$$
L(\mathbf{x}^*, \boldsymbol{\lambda}, \boldsymbol{\nu}) \leq L(\mathbf{x}^*, \boldsymbol{\lambda}^*, \boldsymbol{\nu}^*) \leq L(\mathbf{x}, \boldsymbol{\lambda}^*, \boldsymbol{\nu}^*), \qquad \forall \mathbf{x},\ \boldsymbol{\lambda} \geq \mathbf{0}, \boldsymbol{\nu}
$$

则称该三元组是 $L$ 的**鞍点**（saddle point）：在 $\mathbf{x}$ 方向取极小，在乘子方向取极大。鞍点与强对偶等价，这一等价是许多算法的出发点。一般情形下交换次序只能减小最大值：

$$
\sup_{\boldsymbol{\lambda} \geq \mathbf{0}, \boldsymbol{\nu}} \inf_{\mathbf{x}} L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \ \leq \ \inf_{\mathbf{x}} \sup_{\boldsymbol{\lambda} \geq \mathbf{0}, \boldsymbol{\nu}} L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})
$$

左端就是 $q^*$，右端先用无穷惩罚排除不可行的 $\mathbf{x}$，再对剩下的点取极小，在凸情形下通过 Slater 条件达到等号。Sion 的极小极大定理给出更一般的交换条件：$\mathbf{x}$ 的集合凸且紧、乘子集合凸且紧、$L$ 对 $\mathbf{x}$ 凸（下半连续）对乘子凹（上半连续）时，极小与极大可以交换。有限博弈的 von Neumann 定理是它的特例：矩阵博弈的收益函数在混合策略单纯形上双线性，鞍点给出博弈值与双方的最优混合策略。对偶理论因此也覆盖了博弈与对抗训练中的极小极大问题。

### 灵敏度与影子价格

把约束右端视为参数，定义扰动问题的最优值

$$
p(\mathbf{u}, \mathbf{w}) = \min \{ f(\mathbf{x}) : g_i(\mathbf{x}) \leq u_i,\ h_j(\mathbf{x}) = w_j \}
$$

$p$ 是凸函数（其上方图是凸集，与 3.2 节的下水平集论证对偶）。由弱对偶，$p(\mathbf{u}, \mathbf{w}) \geq q(\boldsymbol{\lambda}, \boldsymbol{\nu}) - \boldsymbol{\lambda}^T\mathbf{u} - \boldsymbol{\nu}^T\mathbf{w}$ 对一切乘子成立；对取到最优值的 $(\boldsymbol{\lambda}^*, \boldsymbol{\nu}^*)$，这给出 $p(\mathbf{u}, \mathbf{w}) \geq p(\mathbf{0}, \mathbf{0}) - \boldsymbol{\lambda}^{*T}\mathbf{u} - \boldsymbol{\nu}^{*T}\mathbf{w}$，即 $-\boldsymbol{\lambda}^*$ 是 $p$ 在原点的次梯度：

$$
\lambda_i^* = -\frac{\partial p}{\partial u_i}\bigg|_{\mathbf{u} = \mathbf{0}} \quad \text{(当 } p \text{ 可微)}
$$

读法：把第 $i$ 个约束放松一单位（$u_i$ 增大），最优值下降 $\lambda_i^*$ 单位。$\lambda_i^*$ 因此是约束的**影子价格**（shadow price）：约束资源每单位的机会成本。$\nu_j^*$ 对等式约束右端的符号与大小同理，方向由 $h_j$ 的写法决定。灵敏度信息在工程与经济学问题中用于判断哪些约束值得投入资源放松，在算法中用于判断约束的取舍（例如稀疏优化中判断某个约束是否值得保留）。

### 对偶上升与数值实验

对偶问题的最直接解法是对偶函数的投影梯度上升。由于 $\partial q$ 已知（约束在当前最小值点处的取值），更新规则为

$$
\boldsymbol{\lambda}_{k+1} = \big[\boldsymbol{\lambda}_k + \alpha_k \mathbf{g}(\mathbf{x}(\boldsymbol{\lambda}_k))\big]_+, \qquad \boldsymbol{\nu}_{k+1} = \boldsymbol{\nu}_k + \alpha_k \mathbf{h}(\mathbf{x}(\boldsymbol{\lambda}_k))
$$

其中 $[\cdot]_+$ 是向非负象限的投影。步长满足 $0 < \alpha < 2/L_q$（$L_q$ 为 $q$ 的梯度 Lipschitz 常数）时收敛；$q$ 是凹的但不一定强凹，收敛通常是次线性的，这正是后面引入增广拉格朗日的原因。

```python
import numpy as np

# 沿用上例：min (x1-2)^2 + (x2-2)^2  s.t. x1 + x2 <= 2, x1 <= 0.5

H, c = 2 * np.eye(2), np.array([-4.0, -4.0])
A = np.array([[1.0, 1.0], [1.0, 0.0]])
b_con = np.array([2.0, 0.5])

def f(x):
    return float((x[0] - 2) ** 2 + (x[1] - 2) ** 2)

def g(x):
    return np.array([x[0] + x[1] - 2, x[0] - 0.5])

def dual_fun(lam):
    lam = np.asarray(lam, dtype=float)
    x = -np.linalg.solve(H, c + A.T @ lam)      # argmin_x L(x, lambda)
    return float(f(x) + lam @ g(x)), x

# 投影梯度上升：lambda <- [lambda + alpha * g(x(lambda))]_+
lam = np.zeros(2)
for k in range(201):
    val, x = dual_fun(lam)
    if k % 50 == 0:
        print(f"k = {k:>3}: lambda = ({lam[0]:.4f}, {lam[1]:.4f}), q = {val:.6f}, "
              f"f(x) = {f(x):.6f}, 与最优值的差 = {2.5 - val:.3e}")
    lam = np.maximum(0.0, lam + 0.5 * g(x))
print(f"最终: lambda = ({lam[0]:.8f}, {lam[1]:.8f}), q = {dual_fun(lam)[0]:.10f}")

# 对偶函数在网格上的取值（展示凹性与峰值位置）
print("对偶函数网格（行 lambda1，列 lambda2）：")
print("lambda1\\lambda2   " + "".join(f"{v:>10.4f}" for v in [0, 1, 2, 3]))
for l1 in [0.0, 0.5, 1.0, 1.5, 2.0, 3.0]:
    print(f"{l1:>13.1f}   " + "".join(f"{dual_fun((l1, l2))[0]:>10.4f}" for l2 in [0, 1, 2, 3]))

# 约束规范失效的例子：min x s.t. x^2 <= 0
print("min x s.t. x^2 <= 0：")
for lam_v in [1.0, 10.0, 100.0, 1e4, 1e8]:
    print(f"lambda = {lam_v:>8.1e}: q = {-1 / (4 * lam_v):.8f}, 与最优值的差 = {1 / (4 * lam_v):.2e}")
```

输出：

```text
k =   0: lambda = (0.0000, 0.0000), q = 0.000000, f(x) = 0.000000, 与最优值的差 = 2.500e+00
k =  50: lambda = (1.0041, 1.9934), q = 2.499994, f(x) = 2.498259, 与最优值的差 = 5.777e-06
k = 100: lambda = (1.0000, 2.0000), q = 2.500000, f(x) = 2.499988, 与最优值的差 = 2.529e-10
k = 150: lambda = (1.0000, 2.0000), q = 2.500000, f(x) = 2.500000, 与最优值的差 = 1.066e-14
k = 200: lambda = (1.0000, 2.0000), q = 2.500000, f(x) = 2.500000, 与最优值的差 = 0.000e+00
最终: lambda = (1.00000000, 2.00000000), q = 2.5000000000
对偶函数网格（行 lambda1，列 lambda2）：
lambda1\lambda2      0.0000    1.0000    2.0000    3.0000
          0.0      0.0000    1.2500    2.0000    2.2500
          0.5      0.8750    1.8750    2.3750    2.3750
          1.0      1.5000    2.2500    2.5000    2.2500
          1.5      1.8750    2.3750    2.3750    1.8750
          2.0      2.0000    2.2500    2.0000    1.2500
          3.0      1.5000    1.2500    0.5000   -0.7500
min x s.t. x^2 <= 0：
lambda =  1.0e+00: q = -0.25000000, 与最优值的差 = 2.50e-01
lambda =  1.0e+01: q = -0.02500000, 与最优值的差 = 2.50e-02
lambda =  1.0e+02: q = -0.00250000, 与最优值的差 = 2.50e-03
lambda =  1.0e+04: q = -0.00002500, 与最优值的差 = 2.50e-05
lambda =  1.0e+08: q = -0.00000000, 与最优值的差 = 2.50e-09
```

三段输出可以分别读出三件事。第一段是对偶上升的收敛过程：乘子从零出发，$100$ 步内收敛到 $\boldsymbol{\lambda}^* = (1, 2)$，与 3.6.2 节 KKT 系统给出的乘子一致，对偶值收敛到 $2.5 = f^*$。$q$ 的收敛是次线性的：从 $k = 50$ 到 $k = 100$ 误差从 $5.8 \times 10^{-6}$ 降到 $2.5 \times 10^{-10}$，收缩因子约 $4 \times 10^{-5}$，随后进入机器精度区间。注意 $f(\mathbf{x}(\boldsymbol{\lambda}))$ 与 $q$ 的差：$\mathbf{x}(\boldsymbol{\lambda})$ 是拉格朗日函数的最小值点，不必可行，$f$ 在它上面的取值可能低于 $f^*$（表中 $k = 50$ 处的 $2.498259 < 2.5$），因此对原问题而言 $f(\mathbf{x}(\boldsymbol{\lambda}_k))$ 不能用作目标值估计，可用的量是 $q(\boldsymbol{\lambda}_k)$。

第二段的网格展示了对偶函数的凹性：沿每一行、每一列，相邻差分单调递减，峰值在 $(1, 2)$ 处，值为 $2.5$。表中所有值都不超过 $2.5$，这是弱对偶的数值体现。峰值出现在网格的内部点而非边界，说明两个约束的最优乘子都严格为正，与两个约束在最优解处都活跃的事实一致。

第三段是约束规范失效的例子。$\min x$ subject to $x^2 \leq 0$ 的最优值为 $0$，而对偶函数 $q(\lambda) = -1/(4\lambda)$ 的上确界为 $0$，在有限 $\lambda$ 处达不到：$\lambda = 10^8$ 时对偶值仍差 $2.5 \times 10^{-9}$。同时该点没有乘子满足平稳性（$1 + 2\lambda x = 1$），KKT 条件无解。这个例子说明三件事的区别：强对偶在值上成立（$q^* = f^* = 0$），对偶最优解不存在，KKT 条件不成立。三者的关系由约束规范控制，Slater 条件在这里失效（不存在 $x$ 使 $x^2 < 0$）。

## 3.6.4 罚函数与增广拉格朗日

### 二次罚函数

最直接的转化方式是在目标函数中加上违反约束的代价。对等式约束，**二次罚函数**为

$$
P(\mathbf{x}; \mu) = f(\mathbf{x}) + \frac{\mu}{2}\sum_{j=1}^{p} h_j(\mathbf{x})^2
$$

不等式约束用 $\frac{\mu}{2}\sum_i \max(0, g_i(\mathbf{x}))^2$。惩罚是可微的，可以用 3.3 到 3.5 节的任何无约束方法求解。随着 $\mu$ 增大，罚问题的解收敛到原问题的解，但两个缺陷使它不适合单独使用：收敛要求 $\mu \to \infty$，且罚问题的 Hessian 条件数随 $\mu$ 线性增长，数值求解的精度被条件数限制。

代价有多大可以用本节的小例子量出。考虑

$$
\text{minimize} \quad x_1^2 + x_2^2 \qquad \text{subject to} \quad x_1 + x_2 = 2
$$

最优解 $\mathbf{x}^* = (1, 1)$，最优值 $2$。二次罚问题的解由对称性取 $x_1 = x_2 = t$，一阶条件 $2t + \mu(2t - 2) = 0$ 给出 $t = \mu/(\mu + 1)$，违反量为 $2t - 2 = -2/(\mu + 1)$，罚问题 Hessian $\begin{pmatrix} 2 + \mu & \mu \\ \mu & 2 + \mu \end{pmatrix}$ 的条件数为 $1 + \mu$。要得到 $10^{-8}$ 的违反量需要 $\mu \approx 2 \times 10^8$，条件数同量级；双精度浮点只能表示约 $10^{-16}$ 的相对精度，条件数超过 $10^{16}$ 时求解结果完全被舍入误差主导。这就是二次罚函数的实际精度上限。

### 精确罚函数

把二次惩罚换成不可微的绝对值惩罚，可以在有限罚参数下得到精确解：

$$
P_1(\mathbf{x}; \sigma) = f(\mathbf{x}) + \sigma\sum_j |h_j(\mathbf{x})| + \sigma\sum_i \max(0, g_i(\mathbf{x}))
$$

当 $\sigma$ 超过最优乘子的某个上界（对等式约束，$\sigma > \|\boldsymbol{\nu}^*\|_\infty$）时，$P_1$ 的极小点就是原问题的可行最优解，不需要让 $\sigma \to \infty$。在上面的例子里，$\sigma = 1$ 时解为 $(0.5, 0.5)$、违反量 $1$；$\sigma = 2$ 与 $\sigma = 3$ 时解精确落在 $(1, 1)$，因为最优乘子的绝对值为 $2$，阈值就是 $\sigma = 2$。代价是 $P_1$ 在 $h_j = 0$ 处不可微，需要次梯度或近端方法（3.7 节）处理。这一取舍在统计学习中反复出现：$L_1$ 正则化（Lasso）相对于 $L_2$ 正则化的差别正是**精确但非光滑**与**光滑但有偏**之间的取舍。

### 增广拉格朗日方法

**增广拉格朗日**（augmented Lagrangian，也称乘子法）在二次罚中加回乘子项：

$$
L_\mu(\mathbf{x}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_j \nu_j h_j(\mathbf{x}) + \frac{\mu}{2}\sum_j h_j(\mathbf{x})^2
$$

迭代分两步：固定 $\boldsymbol{\nu}_k$ 求解 $\mathbf{x}_{k+1} = \arg\min_{\mathbf{x}} L_\mu(\mathbf{x}, \boldsymbol{\nu}_k)$，然后按约束违反量更新乘子

$$
\nu_{k+1} = \nu_k + \mu\, h_j(\mathbf{x}_{k+1})
$$

与纯二次罚的差别在乘子项的修正作用：$\nu$ 收敛到最优乘子 $\boldsymbol{\nu}^*$ 后，$L_\mu$ 的梯度在 $\mathbf{x}^*$ 处为零，因此 $\mu$ 不需要趋向无穷，固定 $\mu$ 即可收敛到精确解。增广拉格朗日可以看作对偶上升作用在罚问题的对偶上：乘子更新就是 $q$ 的梯度上升，而罚项 $\frac{\mu}{2}\|h\|^2$ 使对偶函数变得强凹，收敛从次线性变成线性。3.6.3 节的次线性收敛问题在这里被修复。

在例子中，$\mu = 1$ 时由对称性 $x_1 = x_2 = t$ 与一阶条件 $2t + \nu + \mu(2t - 2) = 0$ 得 $t = (2\mu - \nu)/(2 + 2\mu)$，乘子更新把误差按因子 $1/(1 + \mu)$ 收缩：$\nu_{k+1} + 2 = (\nu_k + 2)/(1 + \mu)$。$\mu = 1$ 时每步减半，$40$ 步达到 $10^{-12}$ 的违反量。

```python
import numpy as np

# min x1^2 + x2^2  s.t. x1 + x2 = 2，最优解 (1, 1)，最优乘子 nu* = -2
print("二次罚函数：min x1^2 + x2^2 + mu/2 (x1+x2-2)^2")
for mu in [1.0, 10.0, 100.0, 1000.0, 10000.0]:
    t = mu / (mu + 1)                       # 由对称性与一阶条件得到
    Hp = np.array([[2 + mu, mu], [mu, 2 + mu]])
    print(f"mu = {mu:>8.0f}: x = ({t:.6f}, {t:.6f}), 违反量 = {abs(2 * t - 2):.3e}, "
          f"条件数 = {np.linalg.cond(Hp):.3e}")

print("L1 精确罚：min x1^2 + x2^2 + sigma |x1+x2-2|")
for sig in [1.0, 1.5, 2.0, 3.0]:
    t = min(1.0, sig / 2)                   # sigma <= 2 时解偏离可行域
    print(f"sigma = {sig:>4.1f}: x = ({t:.4f}, {t:.4f}), 违反量 = {abs(2 * t - 2):.3e}")

print("增广拉格朗日（mu = 1 固定）：")
mu, nu = 1.0, 0.0
for k in range(51):
    t = (2 * mu - nu) / (2 + 2 * mu)
    h_val = 2 * t - 2
    if k % 10 == 0 or k == 50:
        print(f"k = {k:>2}: nu = {nu:>+.6f}, x = ({t:.6f}, {t:.6f}), 违反量 = {h_val:+.3e}")
    nu = nu + mu * h_val
```

输出：

```text
二次罚函数：min x1^2 + x2^2 + mu/2 (x1+x2-2)^2
mu =        1: x = (0.500000, 0.500000), 违反量 = 1.000e+00, 条件数 = 2.000e+00
mu =       10: x = (0.909091, 0.909091), 违反量 = 1.818e-01, 条件数 = 1.100e+01
mu =      100: x = (0.990099, 0.990099), 违反量 = 1.980e-02, 条件数 = 1.010e+02
mu =     1000: x = (0.999001, 0.999001), 违反量 = 1.998e-03, 条件数 = 1.001e+03
mu =    10000: x = (0.999900, 0.999900), 违反量 = 2.000e-04, 条件数 = 1.000e+04
L1 精确罚：min x1^2 + x2^2 + sigma |x1+x2-2|
sigma =  1.0: x = (0.5000, 0.5000), 违反量 = 1.000e+00
sigma =  1.5: x = (0.7500, 0.7500), 违反量 = 5.000e-01
sigma =  2.0: x = (1.0000, 1.0000), 违反量 = 0.000e+00
sigma =  3.0: x = (1.0000, 1.0000), 违反量 = 0.000e+00
增广拉格朗日（mu = 1 固定）：
k =  0: nu = +0.000000, x = (0.500000, 0.500000), 违反量 = -1.000e+00
k = 10: nu = -1.998047, x = (0.999512, 0.999512), 违反量 = -9.766e-04
k = 20: nu = -1.999998, x = (1.000000, 1.000000), 违反量 = -9.537e-07
k = 30: nu = -2.000000, x = (1.000000, 1.000000), 违反量 = -9.313e-10
k = 40: nu = -2.000000, x = (1.000000, 1.000000), 违反量 = -9.095e-13
k = 50: nu = -2.000000, x = (1.000000, 1.000000), 违反量 = -8.882e-16
```

三组输出对应三种方法的特征。二次罚的违反量按 $2/(\mu + 1)$ 下降，条件数按 $\mu$ 上升：精度与条件数同阶，因而不可能同时得到两者。$L_1$ 精确罚在 $\sigma \geq 2$ 时给出精确解，阈值 $2$ 与最优乘子的绝对值一致。增广拉格朗日在 $\mu = 1$ 固定时以因子 $1/2$ 线性收敛，违反量从 $10^{-3}$ 降到 $10^{-15}$ 用了约 $40$ 步，乘子收敛到 $-2$。三者的对比结论很干净：想要高精度就对偶化（增广拉格朗日），想要有限罚参数下的精确性就用非光滑惩罚，只追求低精度可行解时二次罚最省事。

::: warning 罚参数的标度
三个例子的罚参数都在 $1$ 到 $3$ 的量级，这与问题本身的尺度有关。实际问题中违反量的单位与目标函数的单位不同，$\mu$ 的量纲是两者的比值；把 $\mu$ 设成 $10^6$ 之类的数值之前，先检查目标函数与约束的尺度是否可比，否则数值上等效的 $\mu$ 无法跨问题复用。
:::

## 3.6.5 内点法

### 对数障碍

罚函数与增广拉格朗日处理等式约束很自然，处理不等式约束要在边界处判别积极性。另一种思路是把不等式约束的边界做成一道排斥墙。**对数障碍**（logarithmic barrier）为

$$
\phi(\mathbf{x}) = -\sum_{i=1}^{m} \log\big(-g_i(\mathbf{x})\big)
$$

定义在严格可行域 $\{\mathbf{x} : g_i(\mathbf{x}) < 0\}$ 上，在边界附近趋于 $+\infty$。把障碍加入目标并乘以参数 $t > 0$，得到无约束的障碍问题

$$
\text{minimize} \quad t\,f(\mathbf{x}) + \phi(\mathbf{x})
$$

$t$ 的作用与罚参数相反：$t$ 越大，障碍的相对权重越小，障碍问题的解越接近原问题的最优解。每个 $t$ 对应一个中心点 $\mathbf{x}^*(t)$，$t$ 从 $0$ 增大到 $\infty$ 时这些点连成的曲线称为**中心路径**（central path）。中心路径在可行域内部，端点（极限）就是原问题的最优解。

### 中心路径与对偶界

中心点提供了对偶可行点与间隙的显式估计。障碍问题的一阶条件为

$$
t\nabla f(\mathbf{x}^*(t)) - \sum_i \frac{\nabla g_i(\mathbf{x}^*(t))}{-g_i(\mathbf{x}^*(t))} = \mathbf{0}
$$

与拉格朗日函数的平稳性条件对照，令 $\lambda_i(t) = \dfrac{1}{t\,(-g_i(\mathbf{x}^*(t)))}$ 就得到 $\nabla f + \sum_i \lambda_i \nabla g_i = \mathbf{0}$。$\lambda_i(t) > 0$ 自动成立，因此 $\boldsymbol{\lambda}(t)$ 是对偶可行点，$q(\boldsymbol{\lambda}(t))$ 是对偶值。把对偶值与 $f(\mathbf{x}^*(t))$ 相减，互补松弛项为

$$
f(\mathbf{x}^*(t)) - q(\boldsymbol{\lambda}(t)) = -\sum_i \lambda_i(t)\, g_i(\mathbf{x}^*(t)) = \sum_i \frac{1}{t} = \frac{m}{t}
$$

对一般的凸不等式约束，间隙被 $m/t$ 控制：$f(\mathbf{x}^*(t)) - f^* \leq m/t$。线性规划加上变量的非负约束之后，$m$ 换成不等式约束数与变量数之和。得到精度 $\epsilon$ 需要 $t$ 达到 $m/\epsilon$ 量级，而 $t$ 每增大 $10$ 倍，间隙缩小 $10$ 倍。

### 路径跟踪与复杂度

由于障碍函数是自协调的（3.2 节），障碍问题的牛顿法有可预测的行为：从上一个中心点出发，对新的 $t$ 做牛顿迭代，需要的步数是常数（实践中约 $5$ 到 $10$ 步），与问题规模无关。**路径跟踪**（path following）的循环结构因此非常简单：取 $t_{k+1} = \sigma t_k$（$\sigma$ 取 $10$ 或更小），用牛顿法把当前点拉回新 $t$ 对应的中心路径，重复直到 $m/t_k$ 小于容差。

复杂度由外层轮数乘以每轮牛顿步数给出。固定倍增因子时外层轮数为 $O(\log(m/(\epsilon t_0)))$，总牛顿步数是这一量的常数倍；更精细的路径跟踪分析取 $\sigma = 1 - \beta/\sqrt{m}$，给出 $O(\sqrt{m}\log(m/(\epsilon t_0)))$ 的牛顿步数上界。每次牛顿步的代价由 Hessian 的组装与求解决定，稠密问题为 $O(n^3)$。这一复杂度是内点法相对单纯形法的理论优势所在，也是线性规划多项式时间算法的现代形式。

::: note 与 3.2 节、3.5 节的联系
障碍函数是凸分析中自协调函数的主要例子，其自协调参数为 $m$（约束个数），3.2 节的结论给出牛顿法从任意初始点进入二次收敛阶段的步数上界。3.5 节提到的自协调性决定了内点法的复杂度，现在可以看清这条线索：障碍函数的自协调性把**牛顿法每步下降固定量**与**中心路径的邻域宽度**这两个结论联系在一起，路径跟踪正是在这个邻域内移动。
:::

### 数值实验

用一个三维线性规划演示中心路径。决策问题为

$$
\text{maximize} \quad \mathbf{c}^T\mathbf{x} = 5x_1 + 4x_2 + 3x_3 \qquad \text{subject to} \quad A\mathbf{x} \leq \mathbf{b},\ \mathbf{x} \geq \mathbf{0}
$$

其中 $A$ 的三行为 $(2,3,1)$、$(4,1,2)$、$(3,4,2)$，$\mathbf{b} = (5, 11, 8)$。写成最小化 $-\mathbf{c}^T\mathbf{x}$ 之后，障碍为 $-\sum_i \log(b_i - \mathbf{a}_i^T\mathbf{x}) - \sum_j \log x_j$，共 $m + n = 6$ 项。由前面对偶恢复公式，间隙恰为 $6/t$。

```python
import numpy as np

A = np.array([[2.0, 3.0, 1.0], [4.0, 1.0, 2.0], [3.0, 4.0, 2.0]])
b = np.array([5.0, 11.0, 8.0])
c = np.array([5.0, 4.0, 3.0])          # 最大化 c^T x

def barrier_center(x, t, tol=1e-16, maxit=200):
    x = x.copy()
    steps = 0
    for _ in range(maxit):
        s = b - A @ x
        gb = -t * c + A.T @ (1 / s) - 1 / x                      # 障碍问题梯度
        Hb = A.T @ np.diag(1 / s ** 2) @ A + np.diag(1 / x ** 2)  # 障碍问题 Hessian
        d = -np.linalg.solve(Hb, gb)
        dec = -gb @ d                                            # 牛顿减量
        if dec / 2 < tol:
            break
        step = 1.0
        while (b - A @ (x + step * d)).min() <= 0 or (x + step * d).min() <= 0:
            step *= 0.5                                          # 回退到严格可行域
        phi0 = -t * c @ x - np.log(b - A @ x).sum() - np.log(x).sum()
        while True:
            xn = x + step * d
            phi1 = -t * c @ xn - np.log(b - A @ xn).sum() - np.log(xn).sum()
            if phi1 <= phi0 + 1e-4 * step * gb @ d:
                break
            step *= 0.5
        x = x + step * d
        steps += 1
    return x, steps

x = np.array([0.5, 0.5, 0.5])             # 严格可行初始点
total = 0
for t in [1.0, 10.0, 100.0, 1000.0, 1e4, 1e5, 1e6]:
    x, st = barrier_center(x, t)
    total += st
    s = b - A @ x
    lam = 1 / (t * s)                      # 对偶恢复
    profit, bound = c @ x, b @ lam
    print(f"t = {t:>9.0f}: 利润 = {profit:.9f}, 对偶界 = {bound:.9f}, "
          f"间隙 = {bound - profit:.3e} (6/t = {6 / t:.1e}), 牛顿步 = {st}, 累计 = {total}")
    print(f"            lambda = ({lam[0]:.6f}, {lam[1]:.6f}, {lam[2]:.6f}), "
          f"x = ({x[0]:.6f}, {x[1]:.6f}, {x[2]:.6f})")
```

输出：

```text
t =         1: 利润 = 10.283360952, 对偶界 = 16.283360947, 间隙 = 6.000e+00 (6/t = 6.0e+00), 牛顿步 = 6, 累计 = 6
            lambda = (1.189729, 0.246352, 0.953106), x = (0.816872, 0.275637, 1.698818)
t =        10: 利润 = 12.662500412, 对偶界 = 13.262500412, 间隙 = 6.000e-01 (6/t = 6.0e-01), 牛顿步 = 8, 累计 = 14
            lambda = (0.739358, 0.068670, 1.101293), x = (1.746001, 0.037148, 1.261301)
t =       100: 利润 = 12.969579040, 对偶界 = 13.029579040, 间隙 = 6.000e-02 (6/t = 6.0e-02), 牛顿步 = 7, 累计 = 21
            lambda = (0.961257, 0.009636, 1.014662), x = (1.982274, 0.003387, 1.014886)
t =      1000: 利润 = 12.996995828, 对偶界 = 13.002995828, 间隙 = 6.000e-03 (6/t = 6.0e-03), 牛顿步 = 7, 累计 = 28
            lambda = (0.996012, 0.000996, 1.001497), x = (1.998323, 0.000334, 1.001349)
t =     10000: 利润 = 12.999699958, 对偶界 = 13.000299958, 间隙 = 6.000e-04 (6/t = 6.0e-04), 牛顿步 = 7, 累计 = 35
            lambda = (0.999600, 0.000100, 1.000150), x = (1.999833, 0.000033, 1.000133)
t =    100000: 利润 = 12.999970000, 对偶界 = 13.000029999, 间隙 = 6.000e-05 (6/t = 6.0e-05), 牛顿步 = 7, 累计 = 42
            lambda = (0.999960, 0.000010, 1.000015), x = (1.999983, 0.000003, 1.000013)
t =   1000000: 利润 = 12.999997000, 对偶界 = 13.000003002, 间隙 = 6.002e-06 (6/t = 6.0e-06), 牛顿步 = 7, 累计 = 49
            lambda = (0.999996, 0.000001, 1.000001), x = (1.999998, 0.000000, 1.000001)
```

数据验证了理论中的三条。间隙与 $6/t$ 逐位相符，说明对偶恢复公式 $\lambda_i = 1/(t\,s_i)$ 精确成立。每增大 $t$ 十倍，间隙缩小十倍，需要的牛顿步数几乎不变（$6$ 到 $8$ 步），累计步数从 $6$ 增到 $49$：从间隙 $6$ 到 $6 \times 10^{-6}$ 共六个数量级，代价是 $49$ 次牛顿迭代，平均每三个数量级约 $24$ 步。对偶变量随 $t$ 增大收敛到 $(1, 0, 1)$，其中第二个分量趋向 $0$，对应第二个约束在最优解处不活跃（该约束的松弛量为 $1$）。这一极限与下一节单纯形法读出的影子价格一致。

## 3.6.6 线性规划与锥规划

### 标准形与对偶

线性规划（LP）是目标与约束都为线性的问题，形式上可以有多种等价写法。常用的两种是

$$
\text{标准形：} \ \min \mathbf{c}^T\mathbf{x} \ \text{s.t.}\ A\mathbf{x} = \mathbf{b},\ \mathbf{x} \geq \mathbf{0}
\qquad
\text{不等式形：} \ \max \mathbf{c}^T\mathbf{x} \ \text{s.t.}\ A\mathbf{x} \leq \mathbf{b},\ \mathbf{x} \geq \mathbf{0}
$$

两者通过引入松弛变量互相转化：$A\mathbf{x} \leq \mathbf{b}$ 写成 $A\mathbf{x} + \mathbf{s} = \mathbf{b}$、$\mathbf{s} \geq \mathbf{0}$。不等式形的对偶形式特别整齐：对偶为 $\min \mathbf{b}^T\boldsymbol{\lambda}$ subject to $A^T\boldsymbol{\lambda} \geq \mathbf{c}$、$\boldsymbol{\lambda} \geq \mathbf{0}$。原问题与对偶问题的角色可以互换（对偶的对偶是原问题），这一对称性是 LP 理论的核心结构。互补松弛要求 $\lambda_i(b_i - \mathbf{a}_i^T\mathbf{x}) = 0$ 与 $x_j\big((A^T\boldsymbol{\lambda})_j - c_j\big) = 0$：约束松弛则价格为零，价格为正则约束必须收紧。

### 单纯形法

线性规划的可行域是多面体（3.2 节）。**单纯形法**（simplex method）沿多面体的棱从一个顶点移动到相邻顶点，每次移动使目标值改善，直到没有改善方向。实现上用表格形式跟踪一个基：把 $n$ 个变量与 $m$ 个松弛变量合计 $n + m$ 列，$m$ 个线性无关的列构成基，基变量的取值由方程组确定（非基变量取零），一张 $m$ 行的表格记录基的逆与目标行的价格系数。

每次迭代（枢轴）包含三步：选一个价格系数为负的列作为入基变量（使目标下降）；在该列的正元素中按最小比值法则选出基变量（保证新顶点可行）；做行变换把入基列变成单位列。比值平局与价格系数为零的退化情形可能引起循环，**Bland 规则**（入基取最小下标、出基取对应基变量下标最小者）可以保证终止。

表格的最后一行还免费给出对偶解。目标行在松弛变量下的元素是 $c_B^T B^{-1}$，即对偶变量 $\boldsymbol{\lambda}$；末列是最优值。软件里的对偶信息（影子价格、敏感性报告）就是从这张表读出的。

### 单纯形法的复杂度与对偶单纯形

单纯形法的最坏情形复杂度是指数的（Klee 与 Minty 在 1972 年构造了让所有枢轴规则走遍全部顶点的多面体），但实践中的平均性能很好，平滑分析解释了这一点：对数据加微小随机扰动后，期望枢轴次数是多项式量级的。**对偶单纯形法**在对偶可行（价格系数全非负）而原始不可行处出发，枢轴过程中保持对偶可行性，适用于增加约束或改变右端后的热启动，也是整数规划中割平面法与分支定界求解子问题的标准工具。

多项式时间算法的历史值得记住顺序：椭球法（Khachiyan，1979）首次证明 LP 存在多项式时间算法，但实际性能远不如单纯形法；Karmarkar 的投影尺度法（1984）给出 $O(n^{3.5}L)$ 的算法（$L$ 为输入位长），开启了内点法的研究方向；现代内点法的复杂度为 $O(\sqrt{m})$ 次牛顿步乘以每次 $O(n^3)$ 的求解代价（3.6.5 节的量级），大规模问题上的实际性能可与单纯形法竞争，稀疏结构可以利用。两者的取舍在实践中不按复杂度决定：中小规模问题单纯形法通常更快，给出精确的顶点解；大规模或病态问题内点法更稳；许多求解器默认两阶段策略（先用内点法求近似解，再用单纯形法做基的交叉与整定）。

### 锥规划

线性规划的对偶结构可以推广到一般的**锥规划**（conic programming）：

$$
\min \mathbf{c}^T\mathbf{x} \quad \text{s.t.} \quad A\mathbf{x} + \mathbf{b} \in K
$$

$K$ 是凸锥。$K$ 取非负象限时是线性规划；取二阶锥 $K = \{(\mathbf{y}, t) : \|\mathbf{y}\| \leq t\}$ 时是**二阶锥规划**（SOCP）；取半正定锥 $K = \mathbb{S}^n_+$ 时是**半定规划**（SDP）。对偶形式统一为 $\max -\mathbf{b}^T\mathbf{y}$ subject to $\mathbf{c} - A^T\mathbf{y} \in K^*$，$K^*$ 是对偶锥（3.2 节）。三者的复杂度依次上升：LP 的锥是多项式的直接推广，SOCP 的约束是范数不等式，SDP 的约束是矩阵不等式，可用内点法统一求解，代价是每次牛顿步的规模随矩阵维数上升。

SOCP 的实用性可以用一个例子说明。鲁棒最小二乘考虑数据矩阵 $A$ 有不确定性的情形：

$$
\min_{\mathbf{x}} \ \max_{\|\delta A\| \leq \rho} \ \|(A + \delta A)\mathbf{x} - \mathbf{b}\|
$$

用三角不等式与算子范数的界 $\|\delta A\,\mathbf{x}\| \leq \rho\|\mathbf{x}\|$，内层上界可以显式写出，问题等价于

$$
\min_{\mathbf{x}, t} \ t \quad \text{s.t.} \quad \|A\mathbf{x} - \mathbf{b}\| + \rho\|\mathbf{x}\| \leq t
$$

这条约束是两个范数之和的不等式，可以写成二阶锥形式（引入辅助变量 $s$，要求 $\|A\mathbf{x} - \mathbf{b}\| \leq s$ 与 $\rho\|\mathbf{x}\| \leq t - s$），因而是 SOCP。鲁棒优化的一次典型转化：最坏情形下的目标函数显式化之后，问题落在一个可解的锥规划类中。SDP 松弛是另一条路线，3.8 节用最大割问题展示它的近似比分析。

### 数值实验

下面用表格形式的单纯形法求解本节的 LP，并读出影子价格。

```python
import numpy as np

A = np.array([[2.0, 3.0, 1.0], [4.0, 1.0, 2.0], [3.0, 4.0, 2.0]])
b = np.array([5.0, 11.0, 8.0])
c = np.array([5.0, 4.0, 3.0])          # 最大化 c^T x

def simplex_tableau(A, b, c, maxit=200):
    m, n = A.shape
    T = np.zeros((m + 1, n + m + 1))
    T[:m, :n] = A
    T[:m, n:n + m] = np.eye(m)
    T[:m, -1] = b
    T[m, :n] = -c                      # 最大化问题：目标行初始化为 -c
    basis = list(range(n, n + m))
    hist = []
    for _ in range(maxit):
        cand = [j for j in range(n + m) if T[m, j] < -1e-10]
        if not cand:
            break
        e = min(cand)                  # Bland 规则：入基取最小下标
        col = T[:m, e]
        ratios = [(T[i, -1] / col[i], i) for i in range(m) if col[i] > 1e-10]
        if not ratios:
            return T, basis, hist, "unbounded"
        rmin = min(r for r, _ in ratios)
        tie = [i for r, i in ratios if abs(r - rmin) < 1e-12]
        lv = min(tie, key=lambda i: basis[i])
        T[lv] /= T[lv, e]
        for i in range(m + 1):
            if i != lv:
                T[i] -= T[i, e] * T[lv]
        hist.append((e, basis[lv], rmin, T[-1, -1]))
        basis[lv] = e
    return T, basis, hist, "optimal"

T_fin, basis, hist, status = simplex_tableau(A, b, c)
print("状态:", status, " 枢轴次数:", len(hist))
for k, (e, lv, ratio, z) in enumerate(hist, 1):
    print(f"枢轴 {k}: 入基 x{e + 1}, 出基 x{lv + 1}, 比值 = {ratio:.4f}, 目标 = {z:.4f}")
np.set_printoptions(precision=4, suppress=True, linewidth=120)
print("最终表格：")
print(T_fin)
x_s = np.zeros(6)
for i, j in enumerate(basis):
    x_s[j] = T_fin[i, -1]
print("最优解:", np.round(x_s[:3], 6), " 松变量:", np.round(x_s[3:], 6))
print("最优值（表格末列）:", T_fin[-1, -1], " 直接计算 c^T x =", c @ x_s[:3])
print("影子价格（松变量列）:", T_fin[-1, 3:6])
```

输出：

```text
状态: optimal  枢轴次数: 2
枢轴 1: 入基 x1, 出基 x4, 比值 = 2.5000, 目标 = 12.5000
枢轴 2: 入基 x3, 出基 x6, 比值 = 1.0000, 目标 = 13.0000
最终表格：
[[ 1.  2.  0.  2.  0. -1.  2.]
 [ 0. -5.  0. -2.  1.  0.  1.]
 [ 0. -1.  1. -3.  0.  2.  1.]
 [ 0.  3.  0.  1.  0.  1. 13.]]
最优解: [2. 0. 1.]  松变量: [0. 1. 0.]
最优值（表格末列）: 13.0  直接计算 c^T x = 13.0
影子价格（松变量列）: [1. 0. 1.]
```

两次枢轴之后目标行没有负元素，算法终止。最优解 $\mathbf{x}^* = (2, 0, 1)$，利润 $13$：第一个与第三个约束收紧（两个松弛变量为零），第二个约束松弛量为 $1$。影子价格 $(1, 0, 1)$ 与松弛状态互相印证：活跃的两个约束各有 $1$ 单位的影子价格，非活跃约束的价格为零。这一结果与 3.6.5 节障碍法在 $t \to \infty$ 时恢复的对偶变量 $(1, 0, 1)$ 完全一致，两个算法从完全不同的路径（沿棱的枢轴与内部曲线）到达同一个最优顶点与同一组乘子。

用灵敏度检验影子价格的读数：把第一个约束右端从 $5$ 增大到 $6$，重跑算法。最优解移到 $(2.667, 0, 0)$，利润 $13.333$，比原来只多 $1/3$，远小于影子价格预测的 $1$。原因是基发生了变化：在 $b_1$ 属于区间 $[5, 16/3]$ 时最优基保持为 $\{x_1, s_2, x_3\}$，利润以斜率 $1$ 增长；$b_1$ 超过 $16/3$ 之后 $x_3$ 降到零，第三个约束成为瓶颈，利润随 $b_1$ 的斜率变为 $0$。影子价格的有效范围由保持最优基的区间给出，报告影子价格时需要同时给出这个区间，否则在右端改动较大时会得到错误的估计。

## 3.6.7 本节小结

::: success 约束的三种处理方式
本节围绕约束的处理展开。KKT 条件给出可验证的最优性判据：平稳性、原始可行性、对偶可行性、互补松弛四组条件，在凸问题中是充要条件，在非凸问题中需要约束规范（Slater、LICQ、MFCQ）才能作为必要条件。对偶理论把每个约束转化为一个乘子变量：对偶函数是约束违反量的反馈通道，对偶问题始终凸，弱对偶无条件成立，强对偶在凸性与 Slater 条件下成立，鞍点、极小极大与灵敏度分析是它的三种表达。三类把约束转为无约束的方法各有取舍：二次罚简单但精度与条件数绑定（违反量 $2/(\mu+1)$、条件数 $\mu$），$L_1$ 精确罚在 $\mu$ 有限时给出精确解但引入非光滑性，增广拉格朗日在固定参数下线性收敛（例子中、$\mu = 1$、因子 $1/2$、$40$ 步到 $10^{-12}$）。内点法把边界做成对数障碍，中心路径上的对偶恢复给出精确间隙 $m/t$，例子中六个数量级精度用 $49$ 次牛顿迭代完成。线性规划把所有结构集中体现：两个算法（单纯形与内点法）在同一问题上给出相同的最优顶点与相同的乘子 $(1, 0, 1)$，影子价格与松弛状态互相印证，越界使用时基的变化会破坏一阶灵敏度结论。
:::

约束优化到此完成。下一节处理的问题在结构上与本节的罚函数直接衔接：非光滑的正则项与精确罚如何高效求解，答案是把惩罚的绝对值项交给近端算子，把约束交给算子分裂与 ADMM。3.6 节的增广拉格朗日在那里会以 ADMM 的形式再次出现，对偶上升与障碍法的位置则由近端梯度与分裂算法承担。

## 练习题

### 第 1 题 概念推导

证明对偶函数 $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$ 是凹函数；证明 $\big(\mathbf{g}(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu})),\ \mathbf{h}(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu}))\big)$ 是 $q$ 在 $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 处的次梯度（$\mathbf{x}(\cdot)$ 为使下确界达到的点）；证明弱对偶；并说明为什么对偶问题总是凸的、以及这一事实在处理非凸问题时的意义。

::: details 参考答案
**凹性**：固定 $\mathbf{x}$ 时，$L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \boldsymbol{\lambda}^T\mathbf{g}(\mathbf{x}) + \boldsymbol{\nu}^T\mathbf{h}(\mathbf{x})$ 是 $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 的仿射函数。凹函数族 $\{L(\mathbf{x}, \cdot, \cdot)\}_{\mathbf{x}}$ 的逐点下确界是凹函数（3.2 节保凹运算的对称结论：对每个固定点，下确界在一族仿射函数上取值，而仿射函数的下确界仍是凹函数）。

**次梯度**：设 $\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 达到下确界。对任意 $(\boldsymbol{\lambda}', \boldsymbol{\nu}')$，

$$
q(\boldsymbol{\lambda}', \boldsymbol{\nu}') \leq L\big(\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu}), \boldsymbol{\lambda}', \boldsymbol{\nu}'\big) = q(\boldsymbol{\lambda}, \boldsymbol{\nu}) + (\boldsymbol{\lambda}' - \boldsymbol{\lambda})^T\mathbf{g} + (\boldsymbol{\nu}' - \boldsymbol{\nu})^T\mathbf{h}
$$

按次梯度的定义（凹函数版本：$q(\boldsymbol{\lambda}') \leq q(\boldsymbol{\lambda}) + \mathbf{s}^T(\boldsymbol{\lambda}' - \boldsymbol{\lambda})$），$(\mathbf{g}, \mathbf{h})$ 在 $\mathbf{x}(\boldsymbol{\lambda}, \boldsymbol{\nu})$ 处取值即为次梯度。最小值点唯一时 $q$ 可微，梯度就是 $(\mathbf{g}, \mathbf{h})$。

**弱对偶**：对任意可行 $\mathbf{x}$（$g_i(\mathbf{x}) \leq 0$、$h_j(\mathbf{x}) = 0$）与 $\boldsymbol{\lambda} \geq \mathbf{0}$，$L(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_i \lambda_i g_i(\mathbf{x}) \leq f(\mathbf{x})$，对 $\mathbf{x}$ 取下确界得 $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \leq f(\mathbf{x})$；再对可行 $\mathbf{x}$ 取最小值得 $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \leq f^*$。

**凸性**：对偶问题的约束 $\boldsymbol{\lambda} \geq \mathbf{0}$ 是凸集，目标 $q$ 是凹函数，最大化凹函数等价于最小化凸函数 $-q$，所以对偶问题是无条件凸的。意义：原问题非凸时，对偶仍是凸问题，可以用一阶或二阶方法求到全局最优；得到的对偶最优值是 $f^*$ 的下界（可能有间隙）。这使**非凸问题的下界估计**成为可能，也是分支定界与松弛技术的基础（3.8 节）。
:::

### 第 2 题 计算推理

求解问题 $\min\ x_1^2 + x_2^2$ subject to $x_1 + x_2 \geq 1$、$x_1 \leq 0.2$。写出拉格朗日函数，判断积极约束集合，解出 KKT 乘子与最优值；并用乘子验证灵敏度：把右端 $0.2$ 改为 $0.2 + \epsilon$ 时最优值的一阶变化是多少。

::: details 参考答案
**写成标准形式**：$g_1 = 1 - x_1 - x_2 \leq 0$（乘子 $\lambda_1 \geq 0$），$g_2 = x_1 - 0.2 \leq 0$（乘子 $\lambda_2 \geq 0$）。

$$
L = x_1^2 + x_2^2 + \lambda_1(1 - x_1 - x_2) + \lambda_2(x_1 - 0.2)
$$

**积极集判断**：无约束最优 $(0,0)$ 违反 $g_1$（$g_1 = 1 > 0$）但满足 $g_2$。猜测只有 $g_1$ 活跃：$x_1 + x_2 = 1$ 与平稳性 $(2x_1, 2x_2) + \lambda_1(-1, -1) = \mathbf{0}$ 给出 $x_1 = x_2 = \lambda_1/2$，代入约束得 $\lambda_1 = 1$、$\mathbf{x} = (0.5, 0.5)$。该点违反 $g_2$（$x_1 = 0.5 > 0.2$），假设不成立。

两个约束都活跃：$x_1 = 0.2$、$x_2 = 1 - 0.2 = 0.8$。平稳性给出

$$
(0.4,\ 1.6) + \lambda_1(-1, -1) + \lambda_2(1, 0) = \mathbf{0}
$$

第一分量：$0.4 - \lambda_1 + \lambda_2 = 0$；第二分量：$1.6 - \lambda_1 = 0$。解得 $\lambda_1 = 1.6$、$\lambda_2 = 1.2$，都严格为正，与两个约束活跃一致。最优值 $f^* = 0.04 + 0.64 = 0.68$。

**灵敏度**：把 $g_2$ 的右端从 $0.2$ 改为 $0.2 + \epsilon$（放松约束），新解为 $x_1 = 0.2 + \epsilon$、$x_2 = 0.8 - \epsilon$（$g_1$ 仍活跃），目标值

$$
f(\epsilon) = (0.2 + \epsilon)^2 + (0.8 - \epsilon)^2, \qquad f'(0) = 2(0.2) - 2(0.8) = -1.2
$$

一阶变化为 $-1.2\epsilon$，与 $\lambda_2 = 1.2$ 相符（放松使最优值下降，下降速率等于乘子）。同理把 $g_1$ 的右端从 $1$ 减到 $1 - \epsilon$（放松）给出 $f$ 的下降速率 $1.6 = \lambda_1$。
:::

### 第 3 题 代码验证

用 3.6.4 与 3.6.5 节的代码做两组实验并解释：其一，把增广拉格朗日的 $\mu$ 取 $0.1$、$1$、$10$，记录达到违反量 $10^{-12}$ 所需的迭代次数，与理论速率 $1/(1 + \mu)$ 对照；其二，把障碍法的倍增因子从 $10$ 改为 $2$，比较达到同量级间隙所需的牛顿步总数，并说明倍增因子不能无限增大的原因。给出代码、输出与结论。

::: details 参考答案
```python
import numpy as np

# 实验一：增广拉格朗日的 mu 与迭代次数（违反量降到 1e-12）
for mu in [0.1, 1.0, 10.0]:
    nu = 0.0
    for k in range(5000):
        t = (2 * mu - nu) / (2 + 2 * mu)
        h_val = 2 * t - 2
        nu = nu + mu * h_val
        if abs(h_val) < 1e-12:
            break
    print(f"mu = {mu:>4}: {k} 步达到违反量 1e-12, nu = {nu:.10f}")

# 实验二：障碍法的倍增因子与牛顿步总数（3.6.5 节的 A、b、c）
A = np.array([[2.0, 3.0, 1.0], [4.0, 1.0, 2.0], [3.0, 4.0, 2.0]])
b = np.array([5.0, 11.0, 8.0])
c = np.array([5.0, 4.0, 3.0])

def barrier_center(x, t, tol=1e-16, maxit=200):
    x = x.copy()
    steps = 0
    for _ in range(maxit):
        s = b - A @ x
        gb = -t * c + A.T @ (1 / s) - 1 / x
        Hb = A.T @ np.diag(1 / s ** 2) @ A + np.diag(1 / x ** 2)
        d = -np.linalg.solve(Hb, gb)
        if -gb @ d / 2 < tol:
            break
        step = 1.0
        while (b - A @ (x + step * d)).min() <= 0 or (x + step * d).min() <= 0:
            step *= 0.5
        phi0 = -t * c @ x - np.log(b - A @ x).sum() - np.log(x).sum()
        while True:
            xn = x + step * d
            phi1 = -t * c @ xn - np.log(b - A @ xn).sum() - np.log(xn).sum()
            if phi1 <= phi0 + 1e-4 * step * gb @ d:
                break
            step *= 0.5
        x = x + step * d
        steps += 1
    return x, steps

def run_path(sigma):
    x = np.array([0.5, 0.5, 0.5])
    t, total = 1.0, 0
    while t < 1e6 * 0.5:
        x, st = barrier_center(x, t)
        total += st
        t *= sigma
    x, st = barrier_center(x, t)
    total += st
    s = b - A @ x
    gap = b @ (1 / (t * s)) - c @ x
    return t, gap, total

for sigma in [2.0, 10.0]:
    t_fin, gap, total = run_path(sigma)
    print(f"因子 {sigma}: 最终 t = {t_fin:.3e}, 间隙 = {gap:.3e}, 累计牛顿步 = {total}")
```

输出：

```text
mu =  0.1: 297 步达到违反量 1e-12, nu = -2.0000000000
mu =  1.0: 40 步达到违反量 1e-12, nu = -2.0000000000
mu = 10.0: 11 步达到违反量 1e-12, nu = -2.0000000000
因子 2.0: 最终 t = 5.243e+05, 间隙 = 1.144e-05, 累计牛顿步 = 70
因子 10.0: 最终 t = 1.000e+06, 间隙 = 6.002e-06, 累计牛顿步 = 49
```

**实验一**：理论递推为 $\nu_{k+1} + 2 = (\nu_k + 2)/(1 + \mu)$，违反量 $|h_k| = 2/(1 + \mu)^{k+1}$。$\mu = 0.1$ 时速率为 $0.909$，需要 $\ln(2 \times 10^{12})/\ln 1.1 \approx 297$ 步，与输出一致；$\mu = 1$ 时速率 $0.5$，需要 $41$ 步；$\mu = 10$ 时速率 $1/11$，需要 $12$ 步。三者的收敛点相同（$\nu \to -2$），差别只在速度：$\mu$ 增大使对偶函数更陡（强凹性更强），收敛更快。代价是罚问题的条件数与 $\mu$ 同阶，实际使用中 $\mu$ 取适中值并配合乘子更新，或在收敛缓慢时逐步增大（这一策略称为乘子法的自适应惩罚）。

**实验二**：倍增因子为 $2$ 时共 $70$ 次牛顿步，因子为 $10$ 时共 $49$ 次。因子越大，越过中心路径的步长越大，但每轮需要更多牛顿步才能回到中心路径附近；因子为 $100$ 时每轮牛顿步数明显上升（$t = 100$ 时 $12$ 步，$t = 10^4$ 时 $200$ 步仍未满足收敛判据），原因是新参数下的中心点距离上一点过远，超过了自协调性分析保证的邻域。实践中因子取 $10$ 到 $20$，或按 $\sigma = 1 - \beta/\sqrt{m}$ 设置（3.6.5 节的路径跟踪形式）。
:::

### 第 4 题 综合应用

软间隔支持向量机（SVM）的原始问题为

$$
\min_{\mathbf{w}, b, \xi} \ \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^{N}\xi_i \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i, \ \xi_i \geq 0
$$

推导其拉格朗日对偶问题，写出 KKT 条件，并说明三件事：对偶问题为什么适合核化；哪些样本在最优解处起决定作用；对偶问题适合在样本数与特征维数处于什么关系时使用。

::: details 参考答案
**拉格朗日函数**：引入乘子 $\alpha_i \geq 0$ 对应分类约束（写成 $g_i = 1 - \xi_i - y_i(\mathbf{w}^T\mathbf{x}_i + b) \leq 0$），乘子 $\beta_i \geq 0$ 对应 $\xi_i \geq 0$：

$$
L = \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_i \xi_i + \sum_i \alpha_i\big(1 - \xi_i - y_i(\mathbf{w}^T\mathbf{x}_i + b)\big) - \sum_i \beta_i\xi_i
$$

**平稳性条件**：对 $\mathbf{w}$ 求梯度得 $\mathbf{w} = \sum_i \alpha_i y_i \mathbf{x}_i$；对 $b$ 求偏导得 $\sum_i \alpha_i y_i = 0$；对 $\xi_i$ 求偏导得 $C - \alpha_i - \beta_i = 0$，即 $0 \leq \alpha_i \leq C$。

**对偶问题**：把 $\mathbf{w}$ 的表达式代回并利用 $\sum\alpha_i y_i = 0$ 消去 $b$ 项，得

$$
\max_{\boldsymbol{\alpha}} \ \sum_i \alpha_i - \frac{1}{2}\sum_{i,j} \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j \quad \text{s.t.} \quad 0 \leq \alpha_i \leq C, \ \sum_i \alpha_i y_i = 0
$$

**KKT 条件**：平稳性（上面三式）、原始可行性（约束成立）、对偶可行性（$\alpha_i, \beta_i \geq 0$）、互补松弛：$\alpha_i\big(1 - \xi_i - y_i(\mathbf{w}^T\mathbf{x}_i + b)\big) = 0$、$\beta_i\xi_i = 0$ 以及 $y_i(\mathbf{w}^T\mathbf{x}_i + b) = 1 - \xi_i$ 处的关系。

**核化**：对偶目标只通过内积 $\mathbf{x}_i^T\mathbf{x}_j$ 使用数据，替换为核函数 $K(\mathbf{x}_i, \mathbf{x}_j)$ 后问题形式不变，决策函数为 $\mathbf{w}^T\mathbf{x} + b = \sum_i \alpha_i y_i K(\mathbf{x}_i, \mathbf{x}) + b$。原始问题中 $\mathbf{w}$ 的维数等于特征维数，核化后升维到无穷维也不增加计算量。

**哪些样本起决定作用**：$\alpha_i = 0$ 的样本不进入 $\mathbf{w}$ 的表达式，对应严格位于间隔之外且分类正确的点；$\alpha_i > 0$ 的样本是支持向量，它们的分类约束在最优解处活跃（互补松弛）。$\alpha_i = C$ 的样本还满足 $\xi_i > 0$（因为 $\alpha_i < C$ 时 $\beta_i > 0$ 迫使 $\xi_i = 0$），即违反间隔的点。

**适用规模**：对偶变量数为样本数 $N$，原始变量数为特征维数 $d$。$N$ 中等而 $d$ 很大（或需要核化）时用对偶；$d$ 小、$N$ 极大时用原始形式（线性 SVM 的原始问题可以用随机梯度求解，代价与 $N$ 线性相关）。对偶问题是一个带等式约束与箱约束的二次规划，满足 Slater 条件（存在严格可行的 $\boldsymbol{\alpha}$），强对偶成立，KKT 条件充要。
:::

## 常见错误

**错误 1 · 混用两套不等号约定**

原因：约束可以写成 $g_i(\mathbf{x}) \leq 0$ 或 $g_i(\mathbf{x}) \geq 0$，两种写法下乘子的符号规则相反（前者乘子非负，后者乘子非正）。代码或文献中约定不一致时，平稳性方程与乘子判据都会反号，得到的结论表面上自洽，实际上与问题不匹配。另一个高频混淆点是拉格朗日函数中乘子项的符号：写成 $f - \lambda g$ 与写成 $f + \lambda g$ 时乘子的解读相反。

解决：在一个项目内固定一套约定并写进注释（本教程统一用 $g \leq 0$、$\lambda \geq 0$、$L = f + \sum\lambda_i g_i$），在每处使用乘子前用简单例子核对符号。核对方法：用手算一个单约束问题，检查乘子是否给出了正确的灵敏度方向（放松约束使最优值下降的量）。

**错误 2 · 把 KKT 条件当作普遍成立的必要或充分条件**

原因：两端的误用都常见。必要方向忽略了约束规范：梯度退化的约束（如 $x^2 \leq 0$ 中的 $x = 0$）下 KKT 可能无解，此时若按 KKT 无解即判定非最优，会漏掉真正的最优解。充分方向忽略了凸性要求：非凸问题中满足 KKT 的点可能是局部最优、鞍点或局部最差。

解决：先判断问题类别再使用 KKT。凸问题加 Slater 条件时 KKT 是充要条件，可以放心求解；非凸问题中把 KKT 解视为候选点，按目标值筛选，并检查约束规范是否成立。数值实现中检查 KKT 残差的量级（平稳性范数、违反量、乘子负部），而不是只看求解器返回的收敛标志。

**错误 3 · 认为二次罚函数只要增大罚参数就能得到精确解**

原因：二次罚的违反量按 $1/\mu$ 下降，条件数按 $\mu$ 上升（本节例子中违反量 $2/(\mu + 1)$、条件数 $1 + \mu$）。把 $\mu$ 设到 $10^{8}$ 以上的双重后果是：求解精度被条件数吞掉，迭代方法（梯度法、拟牛顿法）的收敛速度同时恶化，实际得到的违反量可能反而更大。

解决：需要精确可行解时改用增广拉格朗日（固定 $\mu$、更新乘子，线性收敛到精确解）或 $L_1$ 精确罚（$\sigma$ 超过乘子上界时精确，代价是引入非光滑性，需用近端方法求解）。只把二次罚用于**需要近可行解且精度要求不高**的场景，并同时监控违反量与条件数估计。

**错误 4 · 障碍法从边界点或不可行点出发**

原因：对数障碍在边界上取值为无穷、在可行域外无定义，牛顿方向的计算依赖当前点严格可行。从松弛量为零的点出发时，$1/s$ 或 $1/x$ 的分量发散，梯度与 Hessian 直接变成 NaN；从不严格可行的点出发时，回退到可行域内的步长可能接近零，迭代停滞在边界附近。另一个相邻问题是倍增因子取过大，使每轮牛顿步数失控（练习题中的因子 $100$）。

解决：初始点取严格可行点（松弛量与变量都严格正），构造方法是从零向量出发做一个可行性阶段，或用相一（phase I）问题；回退过程显式检查严格可行性，不满足就折半。外层倍增因子取 $10$ 到 $20$，并根据每轮实际牛顿步数动态调整：步数明显超出预期时把因子减半，步数很少时可以适度增大。