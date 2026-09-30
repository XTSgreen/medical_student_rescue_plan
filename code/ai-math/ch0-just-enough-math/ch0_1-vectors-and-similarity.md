---
title: 0.1 把胸片和报告变成向量
sidebar:
  order: 1
---
# 0.1 把胸片和报告变成向量

ConVIRT 要解决的任务可以先用一句话描述：给一张胸片，从一批报告中找出真正属于它的那一份。人靠读图与读文字完成这件事，机器要先让图和文字变成可以互相比较的对象。这一节处理的就是这一步，用的工具是**向量**（vector）与它的比较方式。

## 0.1.1 两种模态，同一种载体

ConVIRT 的处理流程是两条平行的通路。胸片经过图像编码器得到图像表示，报告经过文本编码器得到文本表示，两者再各自经过一个投影函数，落进同一个 $d$ 维空间：

$$
\mathbf{v} = g_v(f_v(\tilde{x}_v)), \qquad \mathbf{u} = g_u(f_u(\tilde{x}_u))
$$

其中 $f_v$ 是图像编码器，$f_u$ 是文本编码器，$g_v$ 与 $g_u$ 是两个投影函数，$\mathbf{v}$ 与 $\mathbf{u}$ 都是 $\R^d$ 中的向量。论文用的图像编码器是 ResNet50，文本编码器是 BERT 并在 ClinicalBERT 权重上初始化，投影后的维度 $d = 512$。

这一步的意义在于：图像和文字本身无法直接相减或比较，但两个同维向量可以。一旦两者都变成 $\R^{512}$ 中的点，谁离谁近就有了可计算的答案。

有一处认知需要提前纠正。在物理与几何里，向量常被描述为带方向的箭头，这个形象在机器学习里会失效。一个病历向量 $[\text{年龄}, \text{BMI}, \text{HbA1c}, \text{CRP}, \text{LDL}]$ 是 $5$ 个有序实数的组合，它没有物理意义上的朝向。在 AI 数学里，向量就是 $\R^d$ 中的一个坐标，箭头只是 $d \le 3$ 时的可视化。

## 0.1.2 维度与形状

维度是第一个要建立的习惯。一张胸片编码后是 $\R^{512}$ 中的一个向量，形状记作 $(512,)$；一批 $B$ 张胸片编码后是 $B$ 行、每行 $512$ 个数的矩阵，形状 $(B, 512)$。表达式 $y = Wx + b$ 是否成立，先看形状是否相容：$(m, n)$ 的矩阵可以左乘 $(n,)$ 的向量，得到 $(m,)$ 的结果；内维不相等时会直接报错。

::: key-idea 拷打 AI 第一原则
每看到一个公式，先问每个量的维度是多少。大量 AI 生成的错误推导，做一次维度检查就会暴露。
:::

## 0.1.3 内积、范数与余弦相似度

两个同维向量 $\mathbf{v}, \mathbf{u} \in \R^d$ 的**内积**（inner product）定义为

$$
\mathbf{v}^\top \mathbf{u} = \sum_{i=1}^{d} v_i u_i
$$

**范数**（norm）$\|\mathbf{v}\| = \sqrt{\mathbf{v}^\top \mathbf{v}}$ 衡量向量的长度。把内积除以两者长度，得到只反映方向关系的量：

$$
\langle \mathbf{v}, \mathbf{u} \rangle = \frac{\mathbf{v}^\top \mathbf{u}}{\|\mathbf{v}\| \, \|\mathbf{u}\|}
$$

这就是 **余弦相似度**（cosine similarity），取值在 $[-1, 1]$ 之间：接近 $1$ 表示两个向量指向相近，接近 $0$ 表示几乎正交，负值表示方向相反。ConVIRT 用它度量图像向量与文本向量的接近程度，就是这一节后面损失函数里的 $\langle \mathbf{v}, \mathbf{u} \rangle$。

## 0.1.4 线性层与投影

**线性层**（linear layer）写成

$$
\mathbf{y} = W\mathbf{x} + \mathbf{b}
$$

其中 $W$ 是权重矩阵，$\mathbf{b}$ 是偏置。参数量是 $W$ 与 $\mathbf{b}$ 的元素总数，因此输入输出维度越大，参数量增长得越快。

ConVIRT 的投影函数是一个单隐藏层网络：

$$
g_v(\cdot) = W^{(2)} \sigma\!\left(W^{(1)} (\cdot)\right)
$$

其中 $\sigma$ 是 ReLU 非线性，$g_u$ 形式相同。隐藏层与 ReLU 的组合说明一件事：神经网络最基本的操作就是矩阵乘法堆叠，中间用非线性函数隔开。去掉非线性，多层线性层会退化成一个线性层。

## 代码验证

先看余弦相似度是否能区分配对与不配对：

```python
import numpy as np

np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(0)

d = 4
v = rng.normal(size=d)
u_pos = v + 0.3 * rng.normal(size=d)
u_neg = rng.normal(size=d)


def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))


print("v     =", v)
print("u_pos =", u_pos)
print("u_neg =", u_neg)
print("cos(v, u_pos) =", round(cosine(v, u_pos), 4))
print("cos(v, u_neg) =", round(cosine(v, u_neg), 4))
```

输出：

```
v     = [ 0.1257 -0.1321  0.6404  0.1049]
u_pos = [-0.035  -0.0236  1.0316  0.389 ]
u_neg = [-0.7037 -1.2654 -0.6233  0.0413]
cos(v, u_pos) = 0.9414
cos(v, u_neg) = -0.2974
```

配对的报告相似度是 $0.9414$，无关的报告是 $-0.2974$。这一节的目的就是把这件事变成可计算的两个数。

再看形状与参数量：

```python
B, d_in, d_out = 32, 2048, 512
H = rng.normal(size=(B, d_in))
W1 = rng.normal(size=(d_out, d_in))
b1 = np.zeros(d_out)
A = np.maximum(0, H @ W1.T + b1)
W2 = rng.normal(size=(d_out, d_out))
v_batch = A @ W2.T
print("H", H.shape, "-> A", A.shape, "-> v", v_batch.shape)
print("W1 参数量 =", W1.size)
try:
    _ = H @ W1
except ValueError as err:
    print("维度不匹配：", err)
```

输出：

```
H (32, 2048) -> A (32, 512) -> v (32, 512)
W1 参数量 = 1048576
维度不匹配： matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size 512 is different from 2048)
```

批维度 $32$ 在整条链上保持不变，最后一行的报错来自刻意把 $W_1$ 放错位置。报错信息里的 (n?,k),(k,m?) 就是矩阵乘法的形状规则。

## 练习题

1. 一张胸片编码为 $512$ 维向量，一批 $64$ 张，编码矩阵的形状是多少？经过 $g_v(\cdot) = W^{(2)}\sigma(W^{(1)}(\cdot))$ 时，若 $W^{(1)}$ 的形状是 $(512, 512)$，输出形状是多少？
2. 两个非零向量的余弦相似度为 $1$，说明它们满足什么关系？为 $0$ 呢？
3. 如果两个向量 $\mathbf{v}$ 与 $\mathbf{u}$ 长度分别为 $3$ 与 $4$，内积为 $12$，余弦相似度是多少？

### 拷打 AI

把 ConVIRT 论文里的公式 $\mathbf{v} = g_v(f_v(\tilde{x}_v))$ 交给 AI，改问可验证的问题，而不要问“请解释这个公式”。下面每题后附及格标准。

1. $\mathbf{v}$、$\mathbf{u}$ 的维度分别是多少？
   及格标准：两者都是 $512$ 维，落在同一空间；能指出这是投影函数 $g$ 的作用。
2. 一个批次有 $B$ 对图文，把这一批的 $\mathbf{v}$ 堆成矩阵，形状是多少？
   及格标准：$(B, 512)$。若回答 $(512, B)$，追问转置在哪里发生。
3. 图像与文本编码器是否共享权重？
   及格标准：不共享。图像用 ResNet50，文本用 BERT。共享权重是 CLIP 系列的另一种设计选择，此处不是。

## 参考答案

1. 编码矩阵形状 $(64, 512)$。经过 $W^{(1)}$ 后仍是 $(64, 512)$（形状 $(512, 512)$ 乘以 $(64, 512)^\top$ 的输出），ReLU 不改变形状，再经 $W^{(2)}$ 仍是 $(64, 512)$。
2. 相似度为 $1$ 说明两向量方向相同，即 $\mathbf{u} = c\mathbf{v}$ 且 $c > 0$；为 $0$ 说明两向量正交。
3. $\cos = 12 / (3 \times 4) = 1$，两向量方向相同。

## 暂时不需要掌握

以下内容留给完整章节，暂时不影响阅读应用论文。

- 向量空间的公理化定义、基与维数的一般理论、四大子空间，见 [1.4 向量空间与四大子空间](/code/ai-math/ch1-linear-algebra/ch1_4-vector-spaces)
- 内积的抽象定义与范数的等价性，见 [1.5 正交性与投影](/code/ai-math/ch1-linear-algebra/ch1_5-orthogonality)
- 矩阵分解与低秩近似，包括 SVD 与 PCA，见 [1.7 奇异值分解](/code/ai-math/ch1-linear-algebra/ch1_7-svd)

## 常见错误

**错误 1 · 把向量理解成物理箭头**

原因：中学与大学物理里向量总带方向，到了高维特征空间不再成立。
解决：记住向量是 $\R^d$ 中的坐标，方向只在低维可视化时才有直观意义。

**错误 2 · 更换内积两侧顺序时不出错，但换错了却不自知**

原因：内积是对称的，$\mathbf{v}^\top\mathbf{u} = \mathbf{u}^\top\mathbf{v}$，但与之配套的范数写错了才真正出错。
解决：余弦相似度的分母是两个向量的长度之积，写成 $\|\mathbf{v}\| \cdot \|\mathbf{u}\|$，不要漏掉其中一项。

**错误 3 · 混淆参数量与特征维度**

原因：把 $d = 512$ 当成参数量。$512$ 是输出维度，$W^{(1)}$ 的参数量是 $512 \times 512 = 262144$。
解决：参数量按权重矩阵的元素总数计算，输入维乘输出维，偏置另计。
