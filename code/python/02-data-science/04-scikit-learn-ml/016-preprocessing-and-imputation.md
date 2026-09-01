---
title: 1.16 数据转换与预处理
sidebar:
  order: 16
---
# 1.16 数据转换与预处理

真实数据很少能直接喂给模型。特征尺度差异巨大（比如年龄是个位数、月薪是五位数）会让基于距离和梯度的算法表现糟糕；缺失值、类别文本、非线性关系都会干扰学习。本节讲解 `sklearn.preprocessing` 提供的各种数据转换器，以及 `sklearn.impute` 提供的缺失值填补器。它们都属于**转换器（transformer）**：先 `fit` 学参数，再 `transform` 应用变换。

## 1.16.1 为什么要做数据预处理

不同特征的数值范围差异过大时，梯度下降类算法（逻辑回归、神经网络）收敛缓慢，距离类算法（KNN、SVM）会被大尺度特征主导。部分算法（决策树）对尺度不敏感，但绝大多数算法需要标准化处理。此外，类别变量、长尾分布、缺失值都需要专门的转换手段。

本章强调一条贯穿始终的原则：**在训练集上 `fit`，在测试集上只 `transform`**。转换器学到的参数（均值、标准差、最值等）只能来自训练集，若把测试集一起 `fit`，相当于偷看了测试数据，会造成**数据泄漏**，让评估结果虚高。

## 1.16.2 标准化 StandardScaler

标准化（z-score 标准化）把每个特征减去均值、除以标准差：

$$
z = \frac{x - \mu}{\sigma}
$$

$x$ 是原始值，$\mu$ 是该特征的均值，$\sigma$ 是该特征的标准差。减去均值除以标准差，让数据变成均值为 0、方差为 1 的分布。标准化不改变数据分布形状，适合特征本身近似正态的场景：

```python
from sklearn.preprocessing import StandardScaler
import numpy as np

X = np.array([[1., -1., 2.],
              [2., 0., 0.],
              [0., 1., -1.]])
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)   # fit 后 transform，一步完成
print(X_scaled)
print(scaler.mean_)                  # 每个特征的均值
print(scaler.scale_)                 # 每个特征的标准差
```

`with_mean` 与 `with_std` 两个参数控制行为：`with_mean=False` 时不减均值（只缩放到单位方差），适合稀疏矩阵，因为对稀疏矩阵减均值会破坏稀疏性；`with_std=False` 时不除以标准差（只做去均值中心化）。

注意 `fit_transform` 是 `fit` 加 `transform` 的便捷写法。测试集上必须只调用 `transform`，复用训练集学到的 $\mu$ 和 $\sigma$：

```python
X_test = np.array([[1., 2., 3.]])
X_test_scaled = scaler.transform(X_test)   # 只 transform，不再 fit
```

## 1.16.3 稳健标准化 RobustScaler

标准化对异常值敏感，因为均值和标准差都会被极端值拉偏。RobustScaler 改用**中位数**（median）和**四分位距**（IQR，第 75 百分位数减第 25 百分位数）：

$$
z = \frac{x - \text{median}}{Q_3 - Q_1}
$$

$\text{median}$ 是特征中位数，$Q_1$、$Q_3$ 分别是第 25、75 百分位数，分母 IQR 衡量中间 50% 数据的离散程度。中位数和 IQR 对异常值稳健，因此数据含离群点时用 RobustScaler 更合适：

```python
from sklearn.preprocessing import RobustScaler

X = np.array([[1., -2.], [2., 3.], [3., 1000.]])   # 第二列有离群点
rs = RobustScaler()
print(rs.fit_transform(X))
print(rs.center_)    # 每列的中位数
print(rs.scale_)     # 每列的 IQR
```

## 1.16.4 区间缩放 MinMaxScaler 与 MaxAbsScaler

MinMaxScaler 把数据缩放到固定区间（默认 $[0,1]$）：

$$
x' = \frac{x - \min}{\max - \min}
$$

$\min$、$\max$ 是特征的最小值与最大值。分子把最小值平移到 0，分母把跨度压缩到 1，结果落在 $[0,1]$。该方法对数据本身的分布没有假设，但**对离群点极敏感**，一个极端值会把其他值全部压到很小的范围。它适合神经网络输入、图像像素（天然在 0 到 255）等场景：

```python
from sklearn.preprocessing import MinMaxScaler

X = np.array([[1., -1., 2.],
              [2., 0., 0.],
              [0., 1., -1.]])
mms = MinMaxScaler(feature_range=(0, 1))
print(mms.fit_transform(X))
print(mms.data_min_, mms.data_max_)   # 每列最值
```

MaxAbsScaler 类似，但除以各特征的最大绝对值，把数据缩放到 $[-1,1]$，且**不改变稀疏性**，适合稀疏数据：

```python
from sklearn.preprocessing import MaxAbsScaler

mas = MaxAbsScaler()
print(mas.fit_transform(X))
```

## 1.16.5 逐样本归一化 Normalizer

前面几种转换都是**逐特征**（每列）处理。Normalizer 不同，它**逐样本**（每行）归一化，把每个样本缩放到单位范数：

$$
x' = \frac{x}{\|x\|_p}
$$

$\|x\|_p$ 是该样本的 $p$ 范数。$p=2$ 即欧氏长度 $\sqrt{\sum_i x_i^2}$，$p=1$ 即绝对值之和 $\sum_i |x_i|$。除以范数后每个样本长度为 1。它常用于文本向量、不需要保留样本间长度信息的场景（如余弦相似度比较）：

```python
from sklearn.preprocessing import Normalizer

X = np.array([[4., 1., 2.],
              [1., 3., 9.]])
norm = Normalizer(norm='l2')   # l1 或 l2
print(norm.fit_transform(X))
# 每行向量的欧氏长度都变为 1
print(np.linalg.norm(norm.fit_transform(X), axis=1))
```

## 1.16.6 二值化 Binarizer

Binarizer 按阈值把连续值转成 0/1：

$$
x' = \begin{cases} 1 & x > \text{threshold} \\ 0 & x \le \text{threshold} \end{cases}
$$

$x$ 是原始值，threshold 是阈值。大于阈值记为 1，否则记为 0。常用于把连续特征转成布尔标志，或为某些只接受 0/1 输入的模型准备数据：

```python
from sklearn.preprocessing import Binarizer

X = np.array([[1., -1., 2.],
              [2., 0., 0.],
              [0., 1., -1.]])
binarizer = Binarizer(threshold=0.5)   # 大于 0.5 记为 1
print(binarizer.fit_transform(X))
```

## 1.16.7 分类特征编码

多数模型只能吃数值，类别文本需要编码。按类别之间有无次序分成两种。

### OneHotEncoder 独热编码

把每个类别拆成一组 0/1 列，类别之间无顺序关系（如城市、颜色）时使用。每个样本在所属类别对应的列取 1，其余取 0：

```python
from sklearn.preprocessing import OneHotEncoder

X = [['male', 'US'],
     ['female', 'CN'],
     ['male', 'CN']]
enc = OneHotEncoder(sparse_output=False)   # 返回稠密数组
print(enc.fit_transform(X))
print(enc.categories_)                     # 每列自动发现的类别
```

参数说明：`sparse_output=False` 返回稠密 NumPy 数组，旧版本参数名为 `sparse=True/False`，新版本改名 `sparse_output`；默认返回稀疏矩阵以节省内存。训练时出现过的类别之外的新类别，会在 `transform` 时报错，可用 `handle_unknown='ignore'` 忽略未知类别。

### OrdinalEncoder 序数编码

类别之间有次序（如学历：小学、中学、大学）时，用整数 0、1、2 表示次序：

```python
from sklearn.preprocessing import OrdinalEncoder

X = [['中学'], ['小学'], ['大学']]
oe = OrdinalEncoder()
print(oe.fit_transform(X))
```

序数编码把有序关系编码进整数，但要小心：模型可能误把 2 当成 1 的两倍，因此无顺序关系的类别不要用 OrdinalEncoder。

### LabelEncoder 标签编码

LabelEncoder 专门编码**目标变量**（标签 y），而不是特征。它把类别标签映射为整数，并支持 `inverse_transform` 逆变换还原：

```python
from sklearn.preprocessing import LabelEncoder

y = ['猫', '狗', '猫', '鸟']
le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(y_encoded)                  # [0 1 0 2]
print(le.inverse_transform([0, 1, 2]))   # ['猫' '狗' '鸟']
```

注意 LabelEncoder 用于特征时会在类别间强加顺序，一般只用于标签。特征类别编码用 OneHotEncoder 或 OrdinalEncoder。

## 1.16.8 多项式特征与样条变换

### PolynomialFeatures 多项式特征

为捕捉非线性关系，可以把原始特征扩展成高次项和交叉项。例如两个特征 $x_1, x_2$ 的次数 2 多项式包括 $x_1^2, x_1x_2, x_2^2$：

```python
from sklearn.preprocessing import PolynomialFeatures
import numpy as np

X = np.array([[2, 3]])
poly = PolynomialFeatures(degree=2, include_bias=True)
print(poly.fit_transform(X))
# [[1. 2. 3. 4. 6. 9.]]
```

输出依次是偏置项 1、$x_1$、$x_2$、$x_1^2$、$x_1x_2$、$x_2^2$。`degree` 控制最高次数，次数越高特征爆炸式增长；`include_bias=True` 时首列是常数 1（相当于截距项），若估计器自带截距（如 LinearRegression 默认 fit_intercept=True）可设 `include_bias=False` 避免共线性。

### SplineTransformer 样条变换

样条把特征分成若干区间，每段用低次多项式拟合，整体平滑。它用于把连续特征扩展成一组基函数，配合线性模型即可拟合复杂曲线，替代手动多项式：

```python
from sklearn.preprocessing import SplineTransformer
import numpy as np

X = np.linspace(0, 1, 10).reshape(-1, 1)
spline = SplineTransformer(degree=3, n_knots=5)
print(spline.fit_transform(X).shape)   # (10, 7)
```

`n_knots` 是结点个数，`degree` 是每段多项式次数。输出列数由结点数与次数共同决定，每一列是一个基函数在该点的取值。

## 1.16.9 幂变换 PowerTransformer

数据严重偏斜时，标准化不解决问题，可以先用幂变换把分布拉向正态。PowerTransformer 提供两种方法，由 `method` 参数选择：

- `method='box-cox'`，Box-Cox 变换，要求数据全为正：
  $$
  y = \begin{cases} \frac{x^\lambda - 1}{\lambda} & \lambda \neq 0 \\ \ln x & \lambda = 0 \end{cases}
  $$
  $x$ 是原始值，$\lambda$ 由数据自动估计。$\lambda=1$ 时近似恒等，$\lambda=0$ 时退化为对数变换。
- `method='yeo-johnson'`，Yeo-Johnson 变换，允许数据含零或负数，适用面更广。

```python
from sklearn.preprocessing import PowerTransformer
import numpy as np

X = np.random.lognormal(size=(1000, 2))   # 对数正态，右偏
pt = PowerTransformer(method='yeo-johnson')
X_t = pt.fit_transform(X)
print(X_t.mean(axis=0), X_t.std(axis=0))   # 变换后接近 0 均值 1 标准差
```

`method` 指定变换方法，默认 `'yeo-johnson'`。`standardize=True`（默认）还会把结果进一步标准化。

### QuantileTransformer 分位数变换

QuantileTransformer 是非参数方法，不假设分布形状，它把每个特征映射到目标分布（默认均匀分布，可指定正态分布）。原理是把每个值替换为它在排序中的位置（分位数），适合分布极不规整的数据：

```python
from sklearn.preprocessing import QuantileTransformer

qt = QuantileTransformer(n_quantiles=1000, output_distribution='uniform')
print(qt.fit_transform(X))
```

`n_quantiles` 是分位数个数，越大越精细；`output_distribution` 可选 `'uniform'` 或 `'normal'`。它对离群点不敏感，因为离群值在排序中只占一个位置。缺点是破坏特征间原有的线性关系。

## 1.16.10 自定义函数变换 FunctionTransformer

内置转换器不满足需求时，用 FunctionTransformer 包装任意函数，让它拥有 `fit`/`transform` 接口，能放进 Pipeline：

```python
from sklearn.preprocessing import FunctionTransformer
import numpy as np

def log1p(X):
    return np.log1p(X)

ft = FunctionTransformer(log1p, validate=True)
X = np.array([[1, 10], [100, 1000]])
print(ft.transform(X))
```

`FunctionTransformer` 的 `func` 参数传入自定义函数，`inverse_func` 可传入逆函数用于还原。`validate=True` 时会把输入转成 NumPy 数组并校验维度。

## 1.16.11 缺失值填补 sklearn.impute

数据缺失时，直接删除行会损失信息。`sklearn.impute` 提供多种填补策略。

### SimpleImputer 简单填补

用单一统计量填补，由 `strategy` 参数决定：

```python
from sklearn.impute import SimpleImputer
import numpy as np

X = np.array([[1., 2., np.nan],
              [3., np.nan, 6.],
              [7., 8., 9.]])
imp = SimpleImputer(strategy='mean')   # 用每列均值填补
print(imp.fit_transform(X))
print(imp.statistics_)                 # 学到的每列均值
```

`strategy` 取值：`'mean'` 用均值、`'median'` 用中位数、`'most_frequent'` 用众数、`'constant'` 用固定值（配合 `fill_value` 参数）。均值受离群点影响，稳健选择是中位数。

### KNNImputer K 近邻填补

KNNImputer 找缺失样本的 K 个最近邻居，用邻居在该特征上的值（按距离加权）填补：

```python
from sklearn.impute import KNNImputer

X = np.array([[1., 2., np.nan],
              [3., 4., 3.],
              [np.nan, 6., 5.],
              [8., 8., 7.]])
knn = KNNImputer(n_neighbors=2, weights='distance')
print(knn.fit_transform(X))
```

`n_neighbors` 是邻居数；`weights='distance'` 表示距离越近的邻居贡献越大，`'uniform'` 则等权平均。KNNImputer 在特征间存在关联时效果好，但计算成本高，数据量大时慢。

### IterativeImputer 迭代填补

IterativeImputer 把每个含缺失的列当作目标变量，用其他完整列训练回归模型来预测缺失值，然后逐列迭代多轮直到收敛，近似多元填补：

```python
from sklearn.experimental import enable_iterative_imputer   # 需显式导入启用
from sklearn.impute import IterativeImputer

X = np.array([[1., 2., np.nan],
              [3., np.nan, 6.],
              [7., 8., 9.],
              [np.nan, 5., 4.]])
it = IterativeImputer(max_iter=10, random_state=0)
print(it.fit_transform(X))
```

注意两点：IterativeImputer 默认以实验性 API 发布，需要先显式导入 `enable_iterative_imputer`（老版本必做，新版本已默认可用，但保留导入无副作用）；`max_iter` 控制迭代轮数。它捕捉特征间复杂关系，效果通常最好，但计算量最大。

## 1.16.12 防止数据泄漏

所有转换器都遵循同一原则：**`fit` 只能发生在训练集上**。若先对整个数据集 `fit` 再划分训练测试集，测试集信息（均值、最值、缺失统计）已进入转换器，评估结果虚高。正确流程：

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import numpy as np

X, y = np.random.randn(200, 5), np.random.randint(0, 2, 200)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=0)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)   # 只在训练集 fit
X_test_s = scaler.transform(X_test)         # 测试集只 transform

model = LogisticRegression()
model.fit(X_train_s, y_train)
print(model.score(X_test_s, y_test))
```

后面的管道（Pipeline）章节会介绍如何把「fit 在训练集、transform 在测试集」的流程自动化，彻底杜绝手工顺序错误。

## 练习题

### 第1题 概念理解

说明 StandardScaler 与 MinMaxScaler 的区别；说明 RobustScaler 为什么对离群点稳健；说明为什么测试集上只能 `transform` 不能 `fit`。

::: details 参考答案

StandardScaler 减去均值除以标准差，得到均值 0 方差 1，对分布形状有假设；MinMaxScaler 缩放到 $[0,1]$，不假设分布但对离群点敏感。RobustScaler 用中位数与 IQR，中位数和四分位距不受极端值影响。测试集上 `fit` 会把测试集信息泄漏给转换器，导致评估结果虚高。
:::

### 第2题 代码编写

用 make 一个含两列、第二列带离群点的数组，分别用 StandardScaler、RobustScaler、MinMaxScaler 转换并对比结果；再对分类特征 ['红','蓝','绿'] 做 OneHotEncoder 编码。

::: details 参考答案

```python
import numpy as np
from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler, OneHotEncoder

X = np.array([[1., 2.], [2., 3.], [3., 4.], [4., 100.]])   # 第二列有离群点

print(StandardScaler().fit_transform(X))
print(RobustScaler().fit_transform(X))
print(MinMaxScaler().fit_transform(X))

X_cat = [['红'], ['蓝'], ['绿'], ['红']]
enc = OneHotEncoder(sparse_output=False)
print(enc.fit_transform(X_cat))
```

:::

### 第3题 进阶练习

创建含 NaN 的数组，分别用 SimpleImputer（mean、median）与 KNNImputer 填补并对比结果；用 PowerTransformer 对右偏数据做 Yeo-Johnson 变换并观察变换前后均值和方差。

::: details 参考答案

```python
import numpy as np
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import PowerTransformer

X = np.array([[1., 2., np.nan],
              [3., np.nan, 6.],
              [7., 8., 9.],
              [np.nan, 5., 4.]])

print(SimpleImputer(strategy='mean').fit_transform(X))
print(SimpleImputer(strategy='median').fit_transform(X))
print(KNNImputer(n_neighbors=2).fit_transform(X))

X_skew = np.random.lognormal(size=(1000, 1))
pt = PowerTransformer(method='yeo-johnson')
X_t = pt.fit_transform(X_skew)
print(X_skew.mean(), X_skew.std())   # 原始
print(X_t.mean(), X_t.std())         # 变换后接近 0 和 1
```

:::

## 常见错误

**错误 1 · 对全部数据一起 `fit` 后再划分训练测试集**

原因:转换器学到的均值、最值包含测试集信息,造成数据泄漏。

解决:先划分,再在训练集上 `fit_transform`、测试集上只 `transform`。

**错误 2 · OneHotEncoder 用旧参数 `sparse=True` 报错**

原因:新版本把参数改名 `sparse_output`。

解决:改用 `sparse_output=False` 获取稠密数组。

**错误 3 · LabelEncoder 用来编码特征列**

原因:LabelEncoder 会强加整数顺序,无次序的类别被错误编码。

解决:特征类别用 OneHotEncoder 或 OrdinalEncoder,LabelEncoder 只用于目标变量。

**错误 4 · `IterativeImputer` 导入时报错**

原因:它曾作为实验性 API,需要先导入 `enable_iterative_imputer`。

解决:代码顶部加 `from sklearn.experimental import enable_iterative_imputer`。

**错误 5 · 稀疏矩阵传给 StandardScaler 报内存错误或变稠密**

原因:默认 `with_mean=True` 减均值会破坏稀疏性,触发稠密化。

解决:对稀疏数据用 `with_mean=False` 或改用 MaxAbsScaler、Normalizer。
