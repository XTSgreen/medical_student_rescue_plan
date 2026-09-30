---
title: 0.3 知道错了以后模型怎么改
sidebar:
  order: 3
---
# 0.3 知道错了以后模型怎么改

0.2 给出了一个数：平均损失 $0.0964$。这个数说明模型当前配得不够好，但没有说明该怎么改。模型里有成千上万个参数，需要知道每一个往哪个方向动、动多少。

本节回答这个问题。起点是一个很朴素的问题：把某个参数改动一点，损失会变化多少。

## 0.3.1 导数就是敏感度

**导数**（derivative）回答的问题是：自变量改动一点，函数值跟着改变多少。把损失记作 $L(\theta)$，参数改动 $\Delta\theta$，若 $\Delta\theta$ 足够小，

$$
L(\theta + \Delta\theta) \approx L(\theta) + L'(\theta)\, \Delta\theta
$$

这一行的含义比它的形式重要。$L'(\theta)$ 是每单位改动带来的损失变化，也就是敏感度；$L'(\theta)$ 为正说明参数增大损失会增大，为负说明参数增大损失会减小。严格定义需要极限，见 [5.4 一元微分学与局部近似](/code/ai-math/ch5-analysis/ch5_4-differentiation)，本节只需要上面这一行近似。

## 0.3.2 从一元到多元

模型有 $n$ 个参数，把它们写成向量 $\boldsymbol{\theta} \in \R^n$。固定其余参数，只对其中一个求导，得到**偏导数**（partial derivative）。把全部偏导数按参数顺序排成一个向量，得到**梯度**（gradient），我们注意式子右上角那个T就是求模长，也就是每一项平方相加再开根号：

$$
\nabla L(\boldsymbol{\theta}) = \left[\frac{\partial L}{\partial \theta_1}, \frac{\partial L}{\partial \theta_2}, \ldots, \frac{\partial L}{\partial \theta_n}\right]^\top
$$

一元的近似式在多维情形下变成

$$
L(\boldsymbol{\theta} + \Delta\boldsymbol{\theta}) \approx L(\boldsymbol{\theta}) + \nabla L(\boldsymbol{\theta})^\top \Delta\boldsymbol{\theta}
$$

这一行同时回答了几个问题。梯度的形状与参数相同，因为每个参数对应一个偏导数。$\nabla L^\top \Delta\boldsymbol{\theta}$ 是内积，当 $\Delta\boldsymbol{\theta}$ 取 $-\eta \nabla L$ 时它等于 $-\eta\|\nabla L\|^2$，为负，所以沿负梯度方向走会让损失下降。$-\nabla L$ 给出方向，$\eta$ 控制走多远，$\eta$ 就是**学习率**（learning rate）。

## 0.3.3 梯度下降

沿着负梯度走一小步，再重新计算梯度：

$$
\boldsymbol{\theta}_{k+1} = \boldsymbol{\theta}_k - \eta \, \nabla L(\boldsymbol{\theta}_k)
$$

这是**梯度下降**（gradient descent）的全部结构。后续的 Adam 一类优化器都在此基础上调整步长与方向，核心仍然是这个式子。

## 0.3.4 链式法则与反向传播

ConVIRT 的损失是一长串复合运算。从参数出发的链条是：

$$
\boldsymbol{\theta} \;\to\; \mathbf{v} \;\to\; s \;\to\; s/\tau \;\to\; \mathbf{p} \;\to\; -\log p \;\to\; L
$$

其中 $\mathbf{v}$ 是编码器输出的向量，$s$ 是余弦相似度，$\mathbf{p}$ 是 softmax 之后的匹配分布。求 $L$ 对最底层参数的偏导，需要**链式法则**（chain rule）：

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{\mathrm{d}y}{\mathrm{d}h} \cdot \frac{\mathrm{d}h}{\mathrm{d}x}
$$

含义是：如果 $x$ 的影响先经过 $h$ 再传到 $y$，那么 $x$ 对 $y$ 的总影响是各环节局部影响相乘的结果。链条长的时候，沿着链条把每一级的局部导数逐级相乘即可。

反向传播做的就是把这件事自动化：从损失出发，沿计算图从右往左逐级应用链式法则，得到每个参数的梯度。PyTorch 的 `backward()` 在这一步上没有额外的数学原理，它就是沿计算图反复应用链式法则；实现层面还涉及计算图的构建、向量-雅可比积与梯度累积等工程机制。

## 0.3.5 ConVIRT 实际怎么训练

论文附录给出的设置如下：

- 优化器 Adam，初始学习率 $10^{-4}$，weight decay $10^{-6}$，批次大小固定为 $32$。
- 每 $5000$ 步计算一次验证损失，若连续 $5$ 次验证损失没有下降，把学习率乘 $0.5$。
- 评估 $200$ 次后停止，保留验证损失最低的检查点。
- 图像编码器以 ImageNet 预训练权重初始化，文本编码器以 ClinicalBERT 权重初始化。
- 使用混合精度训练，预训练数据为 MIMIC-CXR v2，约 $21.7$ 万对图文。

编码器的初始化容易被误解为随机起点。ConVIRT 的图像编码器以 ImageNet 权重初始化，文本编码器以 ClinicalBERT 权重初始化，文本编码器的前 6 层还被冻结。因此 0.1 里那个相似度矩阵已经带有一定的语义结构。

## 代码验证

先验证导数确实等于敏感度。以下沿用 0.1 的 $V$ 与 $U$，对 $U$ 的每一个元素做中心差分，得到全部 $32$ 个偏导。

```python
import numpy as np

np.set_printoptions(precision=3, suppress=True)

V = np.array([
    [0.886, 0.000, 0.000, 0.394, 0.000, 0.000, 0.000, 0.246],
    [0.000, 0.886, 0.000, 0.000, 0.394, 0.000, 0.000, 0.246],
    [0.000, 0.000, 0.886, 0.000, 0.000, 0.394, 0.000, 0.246],
    [0.000, 0.000, 0.886, 0.000, 0.000, 0.000, 0.394, 0.246],
])
U = np.array([
    [0.886, 0.000, 0.000, 0.394, 0.000, 0.000, 0.000, -0.246],
    [0.000, 0.886, 0.000, 0.000, 0.394, 0.000, 0.000, -0.246],
    [0.000, 0.000, 0.886, 0.000, 0.000, 0.394, 0.000, -0.246],
    [0.000, 0.000, 0.886, 0.000, 0.000, 0.000, 0.394, -0.246],
])


def normalize(a):
    return a / np.linalg.norm(a, axis=1, keepdims=True)


def loss_of(V, U, tau=0.1):
    S = normalize(V) @ normalize(U).T
    Z = S / tau - (S / tau).max(axis=1, keepdims=True)
    P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)
    return float(-np.log(np.diag(P)).mean())


h = 1e-4
gU = np.zeros_like(U)
for i in range(U.shape[0]):
    for j in range(U.shape[1]):
        Up, Um = U.copy(), U.copy()
        Up[i, j] += h
        Um[i, j] -= h
        gU[i, j] = (loss_of(V, Up) - loss_of(V, Um)) / (2 * h)

i, j, delta = 2, 2, 0.05
Up = U.copy()
Up[i, j] += delta
print(f"u[2][2] 的偏导 = {gU[i, j]:.4f}")
print(f"实际损失变化 = {loss_of(V, Up) - loss_of(V, U):.6f}")
print(f"梯度预测变化 = {gU[i, j] * delta:.6f}")
print("全部 32 个偏导里绝对值最大 =", round(float(np.abs(gU).max()), 4))
```

输出：

```
u[2][2] 的偏导 = 0.0600
实际损失变化 = 0.003179
梯度预测变化 = 0.003002
全部 32 个偏导里绝对值最大 = 0.1721
```

把 $u_{2,2}$ 增大 $0.05$ 之后，实际损失上升 $0.003179$，用偏导乘以该改动量预测的变化是 $0.003002$，两者吻合。这就是 0.3.1 那一行近似的直接检验。

再让梯度下降跑一遍。这里同时对 $V$ 与 $U$ 更新：

```python
V, U = V.copy(), U.copy()
eta, steps = 0.6, 300
for step in range(steps):
    gV, gU = np.zeros_like(V), np.zeros_like(U)
    for A, gA in ((V, gV), (U, gU)):
        for i in range(A.shape[0]):
            for j in range(A.shape[1]):
                Ap, Am = A.copy(), A.copy()
                Ap[i, j] += h
                Am[i, j] -= h
                if A is V:
                    gA[i, j] = (loss_of(Ap, U) - loss_of(Am, U)) / (2 * h)
                else:
                    gA[i, j] = (loss_of(V, Ap) - loss_of(V, Am)) / (2 * h)
    V, U = V - eta * gV, U - eta * gU
    if step in (0, 4, 24, 99, steps - 1):
        print(f"step {step + 1:4d}  loss = {loss_of(V, U):.4f}")

print("训练后 S =")
print(normalize(V) @ normalize(U).T)
```

输出：

```
step    1  loss = 0.0175
step    5  loss = 0.0044
step   25  loss = 0.0010
step  100  loss = 0.0003
step  300  loss = 0.0002
训练后 S =
[[ 0.9   -0.099 -0.096 -0.096]
 [-0.099  0.9   -0.096 -0.096]
 [-0.083 -0.083  0.932  0.029]
 [-0.083 -0.083  0.029  0.932]]
```

损失从 $0.096$ 降到 $0.0002$。对角线从 $0.879$ 升到 $0.900$ 与 $0.932$，非对角线大部分进一步降到 $-0.096$ 附近。第 3 行第 4 列从 $0.724$ 变成了 $0.029$，这一格发生了什么，留到 0.5 节。

## 练习题

1. 对 $L(\theta) = (\theta - 5)^2$，导数是 $2(\theta - 5)$。在 $\theta = 3$ 处，沿负梯度方向参数会变大还是变小？
2. 学习率过大会出现什么现象？把 $\eta$ 分别取 $0.1$、$0.5$、$0.9$、$1.1$，从 $\theta = -3$ 出发迭代五次，观察 $L(\theta) = (\theta-2)^2 + 1$。
3. ReLU 的输入为 $-2$ 时，它的导数是多少？

### 拷打 AI

1. 损失对哪个参数求导？梯度的形状与参数的形状是否一致？
   及格标准：每个参数对应一个偏导，梯度与参数张量形状相同。若声称梯度是标量，追问维度。
2. 梯度为 $0$ 是否意味着找到了最小值？
   及格标准：不意味着。梯度为 $0$ 只说明是驻点，可能是极大值或鞍点，在非凸问题上尤其如此。
3. 论文说用梯度下降训练，能否推出一定收敛？
   及格标准：不能。收敛还需要光滑性、合适的学习率以及问题本身的性质。
4. 反向传播经过了哪些中间量？
   及格标准：从损失往回依次经过负对数、softmax、温度缩放、余弦相似度、投影、编码器。

## 参考答案

1. 导数为 $-4$，梯度为负，沿负梯度方向即正方向移动，参数变大，趋向 $5$。
2. 学习率过小收敛缓慢；过大则越过最优点来回振荡，甚至发散。参考数值：$\eta = 0.1$ 五步后 $\theta = 0.3616$（损失 $3.6844$），$\eta = 0.5$ 五步后恰好落到 $2.0$（损失 $1.0$），$\eta = 0.9$ 五步后到 $3.6384$（损失 $3.6844$），$\eta = 1.1$ 发散到 $14.4416$（损失 $155.79$）。
3. 输入为负时 ReLU 输出恒为 $0$，导数为 $0$。这类单元在后续更新中难以恢复，通常称为不活跃或失活的 ReLU。

## 暂时不需要掌握

- 极限的 $\varepsilon$-$\delta$ 定义、一致收敛，见 [5.3 函数的极限、连续与初等函数](/code/ai-math/ch5-analysis/ch5_3-continuity-elementary)
- 中值定理与泰勒展开的完整理论，见 [5.4 一元微分学与局部近似](/code/ai-math/ch5-analysis/ch5_4-differentiation)
- 最优性条件、下降引理与收敛速率，见 [3.3 无约束优化的最优性条件与梯度法](/code/ai-math/ch3-optimization/ch3_3-unconstrained-descent)
- 动量、自适应步长与 Adam 的完整推导，见 [3.4 一阶方法的进展](/code/ai-math/ch3-optimization/ch3_4-first-order-methods)

## 常见错误

**错误 1 · 梯度为 0 就认为训练完成**

原因：在非凸问题上，梯度为 0 的位置可能是鞍点或局部极大值。
解决：结合损失值与多次随机初始化判断，不要只看梯度是否归零。

**错误 2 · 链式法则漏乘某一级**

原因：复合层数多时容易漏掉中间某一层的局部导数。
解决：用中心差分做数值梯度检验，与解析梯度对照。

**错误 3 · 用固定的 $10^{-4}$ 当数值梯度检验的通过线**

原因：差分近似的误差随函数尺度、步长 $h$ 与数值精度变化，没有通用的固定阈值。
解决：同时看绝对误差与相对误差，并取若干个 $h$（如 $10^{-3}$、$10^{-5}$、$10^{-7}$）观察是否在合理范围内一致。

**错误 4 · 把损失里出现 NaN 一律归因于学习率过大**

原因：NaN 的来源有多种。
解决：依次排查 $\log 0$、除零、指数溢出、输入数据中的 NaN、混合精度下的数值范围，学习率过大只是其中之一。
