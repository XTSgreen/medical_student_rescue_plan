---
title: 1.6 朴素贝叶斯与交叉分解
sidebar:
  order: 6
---

# 1.6 朴素贝叶斯与交叉分解

垃圾邮件里常出现中奖、免费等词语，收到邮件时能否根据内容特征判断它是否垃圾，这是典型的文本分类问题。朴素贝叶斯用概率回答这个问题：已知一封邮件包含哪些词，计算它属于每个类别的概率，选概率最大的类别。另一方面，有时我们同时观测两组变量，例如顾客对商品的喜好评分和他们的消费金额，希望找出两组变量之间的对应关系，交叉分解（cross decomposition）负责这类任务。本节先讲朴素贝叶斯家族，再讲交叉分解。

## 1.6.1 贝叶斯定理与朴素假设

分类问题的目标是根据特征向量 x 判断样本属于哪个类别 C。贝叶斯定理给出后验概率的计算方法：

$$

P(C|x)=\frac{P(x|C)P(C)}{P(x)}

$$

逐符号解释：$P(C|x)$ 是后验概率，表示看到特征 x 之后样本属于类别 C 的概率，这正是分类想要的东西。$P(C)$ 是先验概率，表示不看任何特征时类别 C 原本占多大比例，可以从训练集各类别的占比估计。$P(x|C)$ 是似然，表示在类别 C 中样本出现特征 x 的可能性。$P(x)$ 是证据，对所有类别取值相同，分类时只需比较分子，可以省略。整句话就是：后验等于似然乘以先验再除以证据。

直接估计 $P(x|C)$ 需要用到所有特征的联合分布，特征多时数据量根本不够。朴素贝叶斯引入朴素假设：给定类别后，各特征条件独立。于是似然可以分解成各特征概率的乘积：

$$

P(x|C)=\prod_{i} P(x_i|C)

$$

$P(x_i|C)$ 是第 i 个特征在类别 C 下取该值的概率，每个特征单独统计，乘积得到整体似然。现实中特征通常并不独立，但这个假设把指数级的参数压缩成线性级，计算简单，多数场景下分类效果依然不错。最终决策规则是选后验概率最大的类别。

sklearn 的朴素贝叶斯模型根据特征的分布假设分为几个变体，分别应对连续特征、计数特征、二值特征和类别特征。

## 1.6.2 GaussianNB 高斯朴素贝叶斯

GaussianNB 假设每个类别下每个连续特征服从高斯分布，用训练数据估计每个特征在各类别下的均值与方差。预测时用高斯密度计算 $P(x_i|C)$。它适合特征为连续数值的数据。

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

model = GaussianNB()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(accuracy_score(y_test, y_pred))   # 分类准确率
```

两个常用参数：`class_prior` 手动指定各类别先验概率，不指定时按训练集各类别比例估计；`var_smoothing` 在估计方差上加一个小的平滑项，防止某类特征方差为 0 时概率出现 0，数值越大平滑越强。

## 1.6.3 MultinomialNB 多项式朴素贝叶斯

MultinomialNB 面向非负计数特征，典型场景是文本的词频或 TF-IDF。它把 $P(x_i|C)$ 建模成多项式分布。需要注意一个问题：如果某个词在训练时只在部分类别出现过，测试样本在其他类别中出现该词时概率为 0，整封邮件被判为该类别的概率变成 0。alpha 参数做拉普拉斯平滑，给每个特征一个伪计数，保证任何词在任何类别下概率都大于 0。

```python
import numpy as np
from sklearn.naive_bayes import MultinomialNB

# 词频矩阵：4 篇文档，词典包含 6 个词
X = np.array([
    [3, 0, 1, 0, 0, 2],   # 文档 1
    [0, 2, 0, 1, 1, 0],   # 文档 2
    [2, 1, 0, 0, 0, 1],   # 文档 3
    [0, 0, 0, 3, 2, 0],   # 文档 4
])
y = np.array([0, 1, 0, 1])

model = MultinomialNB(alpha=1.0)   # alpha 为平滑强度
model.fit(X, y)
print(model.predict(X[[0]]))       # 预测文档 1 的类别
```

`alpha=1.0` 是拉普拉斯平滑，`alpha` 小于 1 表示更弱的平滑，`alpha=0` 表示不平滑。

## 1.6.4 ComplementNB 补集朴素贝叶斯

类别不平衡时（垃圾邮件远少于正常邮件），普通 MultinomialNB 会过分相信样本量大的类别。ComplementNB 计算权重时使用补集的概念：对每个类别，用它之外所有类别的数据来估计参数。样本量大的类别不再占据优势，在不平衡文本分类上通常优于 MultinomialNB。

```python
from sklearn.naive_bayes import ComplementNB

model = ComplementNB(alpha=1.0)
model.fit(X, y)
print(model.predict(X[[2]]))
```

用法与 MultinomialNB 几乎一致，接口兼容，多数情况下可直接替换。

## 1.6.5 BernoulliNB 伯努利朴素贝叶斯

BernoulliNB 面向二值特征，特征取值只有 0 和 1，表示某个属性出现或不出现。短文本分类里常用它建模某个词是否出现，而不是出现几次。`binarize` 参数可以把连续或计数特征自动转成二值：大于阈值的记 1，否则记 0。

```python
from sklearn.naive_bayes import BernoulliNB

X_bin = np.array([
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 1, 0, 0],
])
y_bin = np.array([0, 1, 0])

model = BernoulliNB(binarize=0.0)   # 特征已为 0/1
model.fit(X_bin, y_bin)
print(model.predict(X_bin[[0]]))
```

## 1.6.6 CategoricalNB 类别特征

CategoricalNB 面向离散的类别型特征，例如颜色取红、绿、蓝，等级取高、中、低。sklearn 内部会对类别做平滑，避免测试集中出现训练集没见过的类别组合时概率为 0。使用前需要用 `OrdinalEncoder` 把字符串类别转成从 0 开始的整数。

```python
from sklearn.preprocessing import OrdinalEncoder
from sklearn.naive_bayes import CategoricalNB

X_cat = OrdinalEncoder().fit_transform([
    ['红', '高'],
    ['绿', '低'],
    ['蓝', '高'],
    ['绿', '中'],
])
y_cat = np.array([0, 1, 0, 1])

model = CategoricalNB()
model.fit(X_cat, y_cat)
print(model.predict(X_cat[:2]))
```

## 1.6.7 各模型适用场景对比

| 模型 | 特征类型 | 典型场景 | 关键参数 |
| --- | --- | --- | --- |
| GaussianNB | 连续数值 | 测量数据、正态分布假设 | class_prior、var_smoothing |
| MultinomialNB | 非负计数 | 词频、TF-IDF 文本分类 | alpha |
| ComplementNB | 非负计数 | 类别不平衡的文本分类 | alpha |
| BernoulliNB | 二值 0/1 | 词是否出现的短文本 | binarize、alpha |
| CategoricalNB | 离散类别 | 类别属性数据 | alpha、min_categories |

选择原则：特征连续用 GaussianNB，词频或计数用 MultinomialNB，类别不平衡用 ComplementNB，二值特征用 BernoulliNB，纯类别特征用 CategoricalNB。

## 1.6.8 交叉分解概述

交叉分解同时处理两组变量 X 与 Y，寻找能同时解释两组变量的潜在方向（潜变量），属于监督式的降维技术。偏最小二乘（PLS）与典型相关分析（CCA）的目标都是在 X 和 Y 之间找对应关系，区别在于最大化的是协方差还是相关系数。它们常用于两组变量需要对齐或联合建模的场景，例如把问卷评分和消费行为对齐。

## 1.6.9 PLSRegression 偏最小二乘回归

PLSRegression 既降维又回归。它在 X 中找潜变量 t，在 Y 中找潜变量 u，目标是让 t 与 u 的协方差最大，也就是让两组数据在各自投影方向上一起变化。求解目标写为：

$$

\max \ \mathrm{Cov}(t,u),\qquad t=w^\top X,\ u=c^\top Y

$$

$w$ 和 $c$ 是 X、Y 上的投影方向，$t$、$u$ 是投影后的潜变量；最大化协方差意味着找出的方向使两组数据的变化同步程度最高。这样既压缩了维度，又保留了与 Y 相关的信息。`n_components` 指定潜变量个数，需要小于等于特征数。

```python
from sklearn.cross_decomposition import PLSRegression
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

pls = PLSRegression(n_components=3)
pls.fit(X_train, y_train)
y_pred = pls.predict(X_test)
print(mean_squared_error(y_test, y_pred))
```

当 X 的特征数大于样本数，或者特征之间高度共线时，普通线性回归无法稳定求解，PLSRegression 是可靠替代。

## 1.6.10 PLSCanonical 与 PLSSVD

PLSCanonical 是规范形式的 PLS，目标函数更严格地同时要求 X 和 Y 的潜变量方差最大，支持多输出的 Y，适合需要解释潜变量的场景。PLSSVD 用奇异值分解直接分解 X 与 Y 的相关矩阵，是 PLS 的简化快速版本，通常用于快速分解或可视化，不提供完整的预测接口。

```python
from sklearn.cross_decomposition import PLSCanonical, PLSSVD

X2 = [[0., 0., 1.], [1., 0., 0.], [2., 2., 2.], [2., 5., 4.]]
Y2 = [[0.1, -0.2], [0.9, 1.1], [6.2, 5.9], [11.9, 12.3]]

pls_c = PLSCanonical(n_components=1)
pls_c.fit(X2, Y2)
print(pls_c.x_weights_)   # X 的投影方向

pls_svd = PLSSVD(n_components=1)
pls_svd.fit(X2, Y2)
print(pls_svd.x_weights_)
```

## 1.6.11 CCA 典型相关分析

CCA 与 PLS 的区别在于目标函数从协方差换成相关系数，即找方向让投影后的两组变量相关系数最大：

$$

\max \ \mathrm{Corr}(w^\top X,\ c^\top Y)

$$

协方差受量纲影响，相关系数对量纲不敏感，CCA 更关注两组变量形状上的相似程度。它常用于两个模态的特征对齐，例如把图像特征和文本特征投影到公共空间比较相似度。

```python
from sklearn.cross_decomposition import CCA

cca = CCA(n_components=1)
cca.fit(X2, Y2)
X_c, Y_c = cca.transform(X2, Y2)
print(X_c.shape, Y_c.shape)   # 各自降维到 1 维
```

X_c 和 Y_c 是两组变量在公共方向上的投影，维度一致后可以直接做关联分析。

## 练习题

### 第1题 概念理解

写出贝叶斯定理并解释后验、先验、似然、证据四项的含义；说明朴素假设的含义及其利弊。

::: details 参考答案

$P(C|x)=\frac{P(x|C)P(C)}{P(x)}$。后验是看到特征后的类别概率；先验是类别原本的占比；似然是该类别中特征出现的可能性；证据是特征整体出现的概率，各类相同可省略。朴素假设指给定类别后特征条件独立，让似然分解为各特征概率乘积，参数从指数级降到线性级，计算简单；代价是忽略特征间的相关性，特征强相关时估计有偏。

:::

### 第2题 代码编写

用 GaussianNB 在鸢尾花数据集上训练并评估准确率；构造一个词频矩阵用 MultinomialNB 分类。

::: details 参考答案

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.metrics import accuracy_score
import numpy as np

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)
gnb = GaussianNB().fit(X_train, y_train)
print(accuracy_score(y_test, gnb.predict(X_test)))

Xc = np.array([[3, 0, 1, 2], [0, 2, 1, 0], [1, 1, 0, 3], [0, 3, 2, 0]])
yc = np.array([0, 1, 0, 1])
mnb = MultinomialNB(alpha=1.0).fit(Xc, yc)
print(mnb.predict(Xc[:1]))
```

:::

### 第3题 进阶练习

构造类别不平衡的计数数据，比较 MultinomialNB 与 ComplementNB 的分类效果；用 PLSRegression 对糖尿病数据降维回归，与线性回归对比均方误差。

::: details 参考答案

```python
import numpy as np
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

rng = np.random.RandomState(0)
X = rng.randint(0, 5, size=(200, 10))
y = np.array([0] * 180 + [1] * 20)   # 不平衡数据
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)

for cls in (MultinomialNB(), ComplementNB()):
    cls.fit(X_train, y_train)
    print(type(cls).__name__, accuracy_score(y_test, cls.predict(X_test)))

from sklearn.cross_decomposition import PLSRegression
from sklearn.linear_model import LinearRegression
from sklearn.datasets import load_diabetes
from sklearn.metrics import mean_squared_error

Xd, yd = load_diabetes(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(Xd, yd, random_state=0)
print(mean_squared_error(yte, PLSRegression(n_components=5).fit(Xtr, ytr).predict(Xte)))
print(mean_squared_error(yte, LinearRegression().fit(Xtr, ytr).predict(Xte)))
```

:::

## 常见错误

**错误 1 · 用 MultinomialNB 处理带负值的特征报错**

原因:多项式朴素贝叶斯假设特征是非负计数，负值无法计算对数概率。

解决:对特征做 MinMaxScaler，或只使用非负计数特征；连续数值改用 GaussianNB。

**错误 2 · 直接把字符串文本传给朴素贝叶斯**

原因:sklearn 的朴素贝叶斯只接受数值矩阵，不接受原始文本。

解决:先用 CountVectorizer 或 TfidfVectorizer 把文本转成词频矩阵。

**错误 3 · 类别不平衡时 MultinomialNB 全预测为大类**

原因:普通多项式朴素贝叶斯受先验影响，倾向把样本判给占比大的类别。

解决:改用 ComplementNB，或在构造训练集时对大类降采样。

**错误 4 · PLS 的 n_components 设得过大**

原因:n_components 大于有效潜变量数时引入噪声，且不能超过特征数。

解决:用交叉验证选择潜变量个数，通常远小于特征数。

**错误 5 · 混淆 PLS 与 CCA 的使用场景**

原因:两者都做两组变量分析，但目标函数不同。

解决:需要回归预测用 PLSRegression，需要两组变量形状对齐用 CCA。
