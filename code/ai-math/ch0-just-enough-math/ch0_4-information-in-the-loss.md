---
title: 0.4 为什么这个 loss 和信息有关系
sidebar:
  order: 4
---
# 0.4 为什么这个 loss 和信息有关系

0.2 得到的损失是 $-\log p_{\text{correct}}$，一个随错误程度增大的罚分。它的形式简单，来源需要追问：为什么惩罚要用对数，而不用平方或者别的函数？

这一节把这一个负对数展开，接到信息论里的几个量上。做法是从损失本身往回追。

## 0.4.1 那个负对数就是交叉熵

回到胸片 C 那一行。候选是四份报告，正确答案是报告 C，如果把它写成一个概率分布，就是

$$
p = \begin{bmatrix} 0 & 0 & 1 & 0 \end{bmatrix}
$$

这个分布把全部权重放在正确位置上，称为 **one-hot** 分布。模型给出的归一化匹配分布来自 0.2 的计算：

$$
q = \begin{bmatrix} 0 & 0 & 0.825 & 0.175 \end{bmatrix}
$$

**交叉熵**（cross entropy）衡量用分布 $q$ 描述真实分布 $p$ 时平均付出的代价：

$$
H(p, q) = -\sum_i p_i \log q_i
$$

$p$ 只在第 3 位非零，求和之后只剩一项：$H(p, q) = -\log 0.825 = 0.1924$。这与 0.2 里胸片 C 那一行的损失是同一个数（0.2 显示为 $0.193$，差别来自把 $q$ 四舍五入到三位小数）。

于是那个负对数得到了解释：**它就是 one-hot 目标下的交叉熵**。这个罚分有明确的来源，就是交叉熵在配对位置上的取值。

## 0.4.2 熵

**熵**（entropy）衡量一个分布自身的不确定程度：

$$
H(p) = -\sum_i p_i \log p_i
$$

分布越接近均匀，取值越大；分布越集中，取值越小。one-hot 分布把全部权重放在一个位置上，取值 $H(p) = 0$，含义是这件事没有任何不确定性。

## 0.4.3 交叉熵等于熵加 KL

把交叉熵展开：

$$
H(p, q) = -\sum_i p_i \log q_i = -\sum_i p_i \log p_i + \sum_i p_i \log \frac{p_i}{q_i} = H(p) + D_{\mathrm{KL}}(p \,\|\, q)
$$

其中

$$
D_{\mathrm{KL}}(p \,\|\, q) = \sum_i p_i \log \frac{p_i}{q_i}
$$

是 **KL 散度**（Kullback-Leibler divergence），衡量两个分布的差异。交叉熵因此可以拆成两部分：真实分布自身的不确定性，加上模型分布与真实分布的偏离。

one-hot 目标的熵为零，此时交叉熵全部来自 KL 散度。0.4.1 里那个 $0.1924$ 既是交叉熵，也是 KL 散度。KL 散度不对称，$D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 数值和含义都不同。

## 0.4.4 互信息

**互信息**（mutual information）衡量两个变量共享的信息量：

$$
I(X; Y) = H(X) - H(X \mid Y)
$$

读法是：知道 $Y$ 之后，$X$ 的不确定性减少多少。在 ConVIRT 的语境里，$X$ 是胸片的内容，$Y$ 是报告的文本，互信息就是文字里关于图像的信息量，以及图像里关于文字的信息量。

## 0.4.5 InfoNCE 与互信息

ConVIRT 论文对这个损失的原话是：最小化它会使编码器最大程度保留配对样本之间的互信息。

这句话需要加一个条件才成立。在标准 InfoNCE 的采样假设下可以证明

$$
I(\mathbf{v}; \mathbf{u}) \;\ge\; \log N - L_{\text{InfoNCE}}
$$

这个损失给出互信息的一个下界，最小化损失等价于抬高这个下界。它不等于互信息本身，这个不等式只在标准采样假设下成立，依赖采样的构造方式。论文用相对宽松的表述概括了这一结果。

这是本章所说的**拷打论文**的一次示范：论文自己写下的句子，也不等于在数学上可以不加条件地照抄。读到“最大化互信息”这类表述时，应当追问成立条件。

## 代码验证

用 one-hot 目标与非 one-hot 目标各算一次，观察三项之间的关系：

```python
import numpy as np


def entropy(p):
    m = p > 0
    return float(-np.sum(p[m] * np.log(p[m])))


def cross_entropy(p, q):
    m = p > 0
    return float(-np.sum(p[m] * np.log(q[m])))


def kl(p, q):
    m = p > 0
    return float(np.sum(p[m] * np.log(p[m] / q[m])))


q = np.array([0.000, 0.000, 0.825, 0.175])
p_onehot = np.array([0.000, 0.000, 1.000, 0.000])
print("one-hot 目标：")
print("  H(p)      =", round(entropy(p_onehot), 4) + 0.0)
print("  CE(p, q)  =", round(cross_entropy(p_onehot, q), 4))
print("  KL(p || q)=", round(kl(p_onehot, q), 4))
print("  H(p) + KL =", round(entropy(p_onehot) + kl(p_onehot, q), 4))

print("非 one-hot 目标：")
p_soft = np.array([0.7, 0.2, 0.1])
q_soft = np.array([0.5, 0.3, 0.2])
print("  H(p)      =", round(entropy(p_soft), 4))
print("  CE(p, q)  =", round(cross_entropy(p_soft, q_soft), 4))
print("  KL(p || q)=", round(kl(p_soft, q_soft), 4))
print("  H(p) + KL =", round(entropy(p_soft) + kl(p_soft, q_soft), 4))
```

输出：

```
one-hot 目标：
  H(p)      = 0.0
  CE(p, q)  = 0.1924
  KL(p || q)= 0.1924
  H(p) + KL = 0.1924
非 one-hot 目标：
  H(p)      = 0.8018
  CE(p, q)  = 0.8869
  KL(p || q)= 0.0851
  H(p) + KL = 0.8869
```

one-hot 目标的熵为零，交叉熵与 KL 相等。非 one-hot 的目标熵为 $0.8018$，交叉熵 $0.8869 = 0.8018 + 0.0851$。两组数据都对应 $H(p,q) = H(p) + D_{\mathrm{KL}}(p\|q)$。

## 练习题

1. 若某个 one-hot 目标下模型给正确项的概率是 $0.5$，交叉熵是多少？
2. 熵为零的分布有什么特点？
3. $D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 相等吗？

### 拷打 AI

1. 作者说这个损失保留互信息，这句话是否准确？
   及格标准：论文原话如此；更严格的表述是在标准采样假设下给出互信息下界，损失本身不等于互信息。
2. 为什么分类任务用交叉熵而不用均方误差？
   及格标准：交叉熵对应最大似然，梯度在预测偏离时更强；均方误差配合 sigmoid 或 softmax 会出现梯度饱和。
3. 互信息高是否意味着因果关系？
   及格标准：不意味着。互信息只刻画统计依赖，因果关系需要额外假设或干预。

## 参考答案

1. $-\log 0.5 = 0.6931$。
2. 全部概率质量集中在一个位置上，其余位置为零，也就是 one-hot 分布。
3. 不相等。KL 散度不对称，两个方向对覆盖不足与过度自信的惩罚偏向不同。

## 暂时不需要掌握

- 典型集与渐近均分性质，见 [4.4 信源编码与率失真理论](/code/ai-math/ch4-information-theory/ch4_4-source-coding)
- 信道容量与编码定理，见 [4.5 信道容量与编码定理](/code/ai-math/ch4-information-theory/ch4_5-channel-capacity)
- 数据处理不等式与信息不等式，见 [4.2 散度、距离与信息不等式](/code/ai-math/ch4-information-theory/ch4_2-divergences)
- 互信息的估计方法与 KSG 估计器，见 [4.7 信息论与机器学习](/code/ai-math/ch4-information-theory/ch4_7-information-theory-in-ml)
- 算法信息论与柯尔莫哥洛夫复杂度，见 [4.8 算法信息论与前沿方向](/code/ai-math/ch4-information-theory/ch4_8-algorithmic-information-and-frontiers)

## 常见错误

**错误 1 · 交换 KL 的两个参数而不检查方向**

原因：KL 不对称，把 $D_{\mathrm{KL}}(p \| q)$ 写成 $D_{\mathrm{KL}}(q \| p)$ 会得到不同数值与相反的惩罚倾向。
解决：写清楚哪个是真实分布、哪个是近似分布。

**错误 2 · 把交叉熵与 KL 散度当成同一个量**

原因：one-hot 目标下两者数值相等，容易推广到一般情形。
解决：交叉熵等于熵加 KL，只有在真实分布的熵为零时两者才相等。

**错误 3 · 无条件地说 InfoNCE 就等于互信息**

原因：论文概述中的表述较宽松。
解决：加上采样假设，说它给出互信息的下界，并注意损失本身不等于互信息。
