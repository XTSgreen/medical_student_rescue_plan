---
title: 0.3 那个 loss 在做什么
sidebar:
  order: 3
---
# 0.3 那个 loss 在做什么

0.1 得到了向量与相似度，0.2 得到了梯度与更新规则，还缺一环：模型怎么知道自己变好了。判断依据必须写成一个数，训练的目标是让这个数下降。这个数就是**损失函数**（loss function），论文里也叫目标函数。

本节把 ConVIRT 的损失逐层拆开，说明它的每一部分对应什么含义，以及它来自哪个数学分支。

## 0.3.1 把科研目标翻译成一个数

不同的目标对应不同的损失。预测误差用均方误差，分类错误用交叉熵，参数不要过大用正则项，两个分布要接近用 KL 散度或 JS 散度。这一步没有通用公式，做法是把希望模型做到的事翻译成一个可以变小或变大的数。损失函数因此记录了作者对任务的判断。

ConVIRT 的目标是让配对的图像与报告在向量空间里靠近，不配对的远离。这个目标在下一小节被写成 InfoNCE 损失。

## 0.3.2 softmax：把相似度变成概率

给定一个批次的 $N$ 对图文，把第 $i$ 张胸片的向量与全部 $N$ 份报告的向量做余弦相似度，得到 $N$ 个数。**softmax** 把这 $N$ 个数变成一组概率：

$$
\mathrm{softmax}(z_i) = \frac{\exp(z_i)}{\sum_{k=1}^{N} \exp(z_k)}
$$

指数把任意实数变成正数，求和归一化后各项之和为 $1$。这一组概率可以读成：在 $N$ 份报告里，模型认为第 $k$ 份属于这张胸片的可能性。相似度越高，对应概率越大。

## 0.3.3 InfoNCE：ConVIRT 的损失

把相似度除以温度 $\tau$，做 softmax，再对正确答案取负对数，得到图像到文本方向的损失：

$$
\ell_i^{(v \to u)} = -\log \frac{\exp\!\left(\langle \mathbf{v}_i, \mathbf{u}_i \rangle / \tau\right)}{\sum_{k=1}^{N} \exp\!\left(\langle \mathbf{v}_i, \mathbf{u}_k \rangle / \tau\right)}
$$

其中 $\langle \mathbf{v}, \mathbf{u} \rangle = \mathbf{v}^\top \mathbf{u} / (\|\mathbf{v}\| \|\mathbf{u}\|)$ 是 0.1 节定义的余弦相似度。对称地，用文本去找图像得到 $\ell_i^{(u \to v)}$。两个方向按权重 $\lambda$ 合并：

$$
L = \frac{1}{N} \sum_{i=1}^{N} \left[ \lambda \, \ell_i^{(v \to u)} + (1-\lambda) \, \ell_i^{(u \to v)} \right]
$$

ConVIRT 取 $\lambda = 0.75$，$d = 512$，$\tau = 0.1$。

论文对这个损失给了两种读法。一种读法是 $N$ 分类问题：给定一张胸片，在 $N$ 份报告里选出正确的那一份，损失就是选错时付出的代价。另一种读法关于信息：论文的原话是最小化它会使编码器最大程度保留配对样本之间的互信息。更严格的说法是，InfoNCE 常被解释为互信息的一个下界（van den Oord et al., 2018），而不是互信息本身。

$- \log (1/N) = \log N$ 提供了一个参照。模型对 $N$ 个候选完全无偏好时，损失等于 $\log N$；损失低于它，说明模型学到了一些配对关系。

## 0.3.4 温度

$\tau$ 控制 softmax 的尖锐程度。$\tau$ 越小，相似度的差异被放大得越多，模型对自己的判断越自信：判断正确时损失很小，判断错误时损失急剧增大。$\tau$ 越大，输出越接近均匀分布，损失趋近 $\log N$。

ConVIRT 在论文的表 4 中报告，$\tau = 0.01$ 与 $\tau = 1$ 都会使检索性能变差，最终取 $\tau = 0.1$。论文没有给出温度影响的理论分析，这一结论来自实验比较。

## 0.3.5 熵、交叉熵与 KL

**熵**（entropy）衡量一个分布的不确定程度：

$$
H(p) = -\sum_i p_i \log p_i
$$

取值越大，分布越接近均匀，不确定性越高。**交叉熵**（cross entropy）衡量用分布 $q$ 去描述真实分布 $p$ 时平均付出的代价：

$$
H(p, q) = -\sum_i p_i \log q_i
$$

**KL 散度**（Kullback-Leibler divergence）衡量两个分布的差异：

$$
D_{\mathrm{KL}}(p \,\|\, q) = \sum_i p_i \log \frac{p_i}{q_i}
$$

三者满足

$$
H(p, q) = H(p) + D_{\mathrm{KL}}(p \,\|\, q)
$$

交叉熵可以拆成真实分布自身的不确定性加上模型与真实分布的差距。分类任务用交叉熵做损失，是因为最小化它与最大化正确答案的预测概率等价。KL 散度不对称，$D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 数值和含义都不同。

## 0.3.6 ConVIRT 实际怎么训练

论文的附录给出了预训练的具体设置，这些数字可以用来说明超参数在真实论文里的角色：

- 优化器 Adam，初始学习率 $10^{-4}$，weight decay $10^{-6}$，批次大小固定为 $32$。
- 每 $5000$ 步计算一次验证损失，若连续 $5$ 次验证损失没有下降，把学习率乘 $0.5$。
- 评估 $200$ 次后停止，保留验证损失最低的检查点。
- 预训练数据为 MIMIC-CXR v2，约 $21.7$ 万对图文。

论文同时说明了这些取值怎么来的：投影维度、温度与损失权重通过比较 RSNA 图像分类任务上的线性评估验证分数确定；图像变换的参数通过初步实验得到，没有做系统搜索。

## 代码验证

先验证交叉熵等于熵加 KL：

```python
import numpy as np

p = np.array([0.7, 0.2, 0.1])
q = np.array([0.5, 0.3, 0.2])
Hp = float(-(p * np.log(p)).sum())
CE = float(-(p * np.log(q)).sum())
KL = float((p * np.log(p / q)).sum())
print("H(p)          =", round(Hp, 4))
print("CE(p, q)      =", round(CE, 4))
print("KL(p || q)    =", round(KL, 4))
print("H(p) + KL     =", round(Hp + KL, 4))
```

输出：

```
H(p)          = 0.8018
CE(p, q)      = 0.8869
KL(p || q)    = 0.0851
H(p) + KL     = 0.8869
```

再实现 InfoNCE，观察损失在初始化与训练后的取值：

```python
import numpy as np

np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(0)
N = 4
emb_v = rng.normal(size=(N, 8))


def normalize(a):
    return a / np.linalg.norm(a, axis=1, keepdims=True)


def info_nce(S, tau, row=True):
    Z = (S if row else S.T) / tau
    Z = Z - Z.max(axis=1, keepdims=True)
    logp = Z - np.log(np.exp(Z).sum(axis=1, keepdims=True))
    return float(-np.diag(logp).mean())


tau, lam = 0.1, 0.75
V = normalize(emb_v)
S_init = V @ normalize(rng.normal(size=(N, 8))).T
S_trained = V @ normalize(0.85 * V + 0.15 * normalize(rng.normal(size=(N, 8)))).T
print("log(N) 参照 =", round(float(np.log(N)), 4))
print("初始化：相似度矩阵 S =")
print(S_init)
print("初始化：L(v->u) =", round(info_nce(S_init, tau), 4))
print("训练后：相似度矩阵 S =")
print(S_trained)
print("训练后：对角线 =", np.diag(S_trained))
Lv = info_nce(S_trained, tau)
Lu = info_nce(S_trained, tau, row=False)
print("训练后：L(v->u) =", round(Lv, 4), " L(u->v) =", round(Lu, 4))
print("lambda =", lam, " 总损失 L =", round(lam * Lv + (1 - lam) * Lu, 4))
```

输出：

```
log(N) 参照 = 1.3863
初始化：相似度矩阵 S =
[[ 0.471   0.4738  0.1758 -0.3702]
 [ 0.6634  0.189  -0.3983 -0.5206]
 [ 0.1186 -0.2837  0.7441  0.6006]
 [-0.5697 -0.4579 -0.0125  0.0885]]
初始化：L(v->u) = 1.504
训练后：相似度矩阵 S =
[[ 0.9941  0.2346  0.072  -0.6346]
 [ 0.2994  0.9879 -0.4021 -0.3945]
 [ 0.1674 -0.3543  0.9894 -0.3053]
 [-0.6171 -0.3166 -0.2672  0.9924]]
训练后：对角线 = [0.9941 0.9879 0.9894 0.9924]
训练后：L(v->u) = 0.0005  L(u->v) = 0.0005
lambda = 0.75  总损失 L = 0.0005
```

初始化时对角线并不总是全行最高，损失 $1.504$ 略高于 $\log 4 = 1.3863$。把配对样本构造成接近理想的状态后，对角线升到 $0.99$ 附近，损失降到 $0.0005$。这里的训练后状态是直接构造出来的，用来显示损失可以达到的量级；真实数据上配对关系带噪声，损失不会降到这个水平。

温度的作用在初始化矩阵上更清楚：

```python
for t in [0.01, 0.1, 1.0]:
    print(f"tau = {t:5}  L(v->u) = {info_nce(S_init, t):7.4f}")
```

输出：

```
tau =  0.01  L(v->u) = 12.0722
tau =   0.1  L(v->u) =  1.5040
tau =   1.0  L(v->u) =  1.1415
```

模型判断不准时，$\tau = 0.01$ 把错误放大成 $12.07$ 的损失，$\tau = 1.0$ 因为过度压平而给出更低的 $1.14$。ConVIRT 选择 $0.1$ 是在这两者之间取的折中。

## 练习题

1. 一个批次有 $N = 32$ 对图文，$-\log(1/N)$ 是多少？模型完全没有学到东西时，InfoNCE 损失大约是多少？
2. 若 $\lambda = 1$，损失只保留哪一个方向？
3. 均方误差与交叉熵分别适合什么任务？

### 拷打 AI

1. 作者到底在优化什么？把目标函数的每一项写出来。
   及格标准：$L = \frac{1}{N}\sum_i [\lambda \ell_i^{(v\to u)} + (1-\lambda)\ell_i^{(u\to v)}]$，两个方向是按权重合并的。
2. $\lambda$ 和 $\tau$ 各取多少？是怎么定下来的？
   及格标准：$\lambda = 0.75$，$\tau = 0.1$，通过 RSNA 分类任务上的线性评估验证分数比较确定。
3. 论文说这个损失保留互信息，这句话是否准确？
   及格标准：论文的原话如此；更严格的表述是 InfoNCE 给出互信息的下界，不等于互信息。
4. $D_{\mathrm{KL}}(p \| q)$ 与 $D_{\mathrm{KL}}(q \| p)$ 能否交换？
   及格标准：不能。KL 散度不对称，两个方向数值和含义都不同。
5. 互信息高是否意味着因果关系？
   及格标准：不意味。互信息只刻画统计依赖，因果关系需要额外的假设或干预。

## 参考答案

1. $-\log(1/32) = \log 32 \approx 3.466$。模型没有学到东西时，损失在 $3.47$ 附近。
2. $\lambda = 1$ 时只剩图像到文本方向 $\ell^{(v \to u)}$，文本到图像方向被丢弃。
3. 均方误差适合回归，目标是连续值；交叉熵适合分类，目标是离散类别上的概率分布。

## 暂时不需要掌握

- 典型集与渐近均分性质，见 [4.4 信源编码与率失真理论](/code/ai-math/ch4-information-theory/ch4_4-source-coding)
- 信源编码定理与信道容量定理，见 [4.5 信道容量与编码定理](/code/ai-math/ch4-information-theory/ch4_5-channel-capacity)
- 算法信息论与柯尔莫哥洛夫复杂度，见 [4.8 算法信息论与前沿方向](/code/ai-math/ch4-information-theory/ch4_8-algorithmic-information-and-frontiers)
- 凸性、收敛速率与最优性条件的完整理论，见 [3.2 凸集与凸函数](/code/ai-math/ch3-optimization/ch3_2-convexity) 与 [3.4 一阶方法的进展](/code/ai-math/ch3-optimization/ch3_4-first-order-methods)

## 常见错误

**错误 1 · 在标签平滑或软标签下仍用普通交叉熵**

原因：$-y \log \hat{y}$ 要求 $y$ 是 one-hot，遇到软标签需要按分布求和。
解决：软标签的交叉熵是 $-\sum_i y_i \log \hat{y}_i$，逐类求和而非只取真实类。

**错误 2 · 交换 KL 的两个参数而不检查方向**

原因：KL 不对称，把 $D_{\mathrm{KL}}(p \| q)$ 写成 $D_{\mathrm{KL}}(q \| p)$ 会得到不同数值和相反的惩罚倾向。
解决：写清楚哪个是真实分布、哪个是近似分布，前向 KL 惩罚覆盖不足，反向 KL 惩罚过度自信。

**错误 3 · 把训练损失下降当成模型变好**

原因：损失下降说明优化在起作用，不说明泛化能力提高。
解决：同时看验证集与测试集上的指标，训练损失与验证损失出现明显背离时提前停止或加正则化。

**错误 4 · 在公式里漏掉温度**

原因：把 $\exp(\langle \mathbf{v}, \mathbf{u} \rangle)$ 直接代入 softmax，忽略了每一项都要除以 $\tau$。
解决：检查分子分母是否都带 $1/\tau$，ConVIRT 用的是 $\tau = 0.1$。
