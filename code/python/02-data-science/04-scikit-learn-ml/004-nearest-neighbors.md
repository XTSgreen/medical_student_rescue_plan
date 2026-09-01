---
title: 1.4 最近邻
sidebar:
  order: 4
---
# 1.4 最近邻

物以类聚，人以群分。最近邻方法把这句俗语变成了算法：新样本的类别由它距离最近的若干已知样本决定。最近邻几乎不做训练，只靠存储数据与计算距离，因此适合作为基线方法，也常用于需要快速查询相似样本的场景。本节从距离度量讲起，依次介绍分类、回归、半径查询、质心分类器，以及支撑最近邻的高效数据结构。

## 1.4.1 距离度量

最近邻的一切建立在**距离**之上。最常用的是**欧氏距离**，即两点间直线距离：

$$
\|x - z\|_2 = \sqrt{\sum_i (x_i - z_i)^2}
$$

它把所有维度上的差平方后求和再开方。更一般地，sklearn 用 Minkowski 距离统一表达，参数 `p=2` 时就是欧氏距离，`p=1` 时是曼哈顿距离（各维度差的绝对值之和），`p` 取无穷大时是所有维度差的最大值。

```python
from sklearn.metrics import DistanceMetric

metric = DistanceMetric.get_metric('minkowski', p=2)
print(metric.pairwise([[0, 0], [1, 1]]))
# [[0.         1.41421356]
#  [1.41421356 0.        ]]
```

距离的选择由问题决定：连续数值特征通常用欧氏距离，稀疏高维特征常用余弦距离，二值特征可用汉明距离。距离对特征尺度非常敏感，使用前通常要标准化。

## 1.4.2 KNeighborsClassifier

**K 近邻分类器**的做法：找出新样本的 $k$ 个最近邻居，按多数投票决定类别。`n_neighbors`（即 $k$）决定决策的局部程度，`weights` 控制投票权重，`p` 控制距离范数。

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
knn = KNeighborsClassifier(n_neighbors=5, weights='distance', p=2)
knn.fit(X, y)
print(knn.predict(X[:3]))
```

`weights='uniform'` 时所有邻居票数相同，`weights='distance'` 时距离越近的邻居权重越大，后者对噪声更稳健。$k$ 太小容易受单个噪声样本影响，$k$ 太大则边界过于平滑，一般通过交叉验证挑选。

## 1.4.3 KNeighborsRegressor

**K 近邻回归**把投票换成平均：新样本的预测值是它 $k$ 个最近邻居标签的平均。同样支持 `weights` 控制加权平均。

```python
from sklearn.neighbors import KNeighborsRegressor
import numpy as np

x = np.linspace(0, 6, 60).reshape(-1, 1)
y = np.sin(x).ravel()
knnr = KNeighborsRegressor(n_neighbors=3).fit(x, y)
print(knnr.predict([[1.5]]))
```

KNN 回归假设相近的样本输出也相近，适合关系局部、无全局线性结构的回归问题。它没有参数学习过程，`fit` 只保存数据，因此训练几乎零成本，预测时才计算距离。

## 1.4.4 RadiusNeighbors 分类与回归

`KNeighbors` 固定邻居个数，`RadiusNeighbors` 固定距离半径：把半径内所有邻居纳入考虑。当样本分布不均匀时，固定个数会在稀疏区域拉进过远的点，半径法更符合直觉，但需要选择合适的 `radius`。

```python
from sklearn.neighbors import RadiusNeighborsClassifier, RadiusNeighborsRegressor

Xr = [[0], [0.1], [1.0], [1.1]]
yr = [0, 0, 1, 1]
rnc = RadiusNeighborsClassifier(radius=0.5).fit(Xr, yr)
print(rnc.predict([[0.05]]))   # 半径内只有类别 0

rnr = RadiusNeighborsRegressor(radius=0.5).fit(Xr, yr)
print(rnr.predict([[1.05]]))
```

`RadiusNeighborsClassifier` 默认在半径内没有任何邻居时输出 -1 表示无法判定，可用 `outlier_label` 指定替代标签。半径法与 K 法互为补充，稀疏数据用 K 法，密度均匀的数据用半径法更自然。

## 1.4.5 NearestNeighbors 无监督查询

`NearestNeighbors` 不做预测，只做**最近邻查询**，是推荐系统、相似样本检索的底层工具。`kneighbors()` 返回每个查询点的近邻下标与距离。

```python
from sklearn.neighbors import NearestNeighbors
import numpy as np

Xq = np.array([[0, 0], [1, 1], [9, 9]])
nn = NearestNeighbors(n_neighbors=2).fit(Xq)
dist, ind = nn.kneighbors([[0.1, 0.1]])
print(dist)   # 到两个最近邻的距离
print(ind)    # 最近邻的下标
```

`kneighbors(X=None, n_neighbors=k)` 传入 `X=None` 时查询训练集自身。`radius_neighbors()` 对应半径查询，返回半径内所有邻居。这两个方法让最近邻能力可以嵌入到聚类、异常检测等任意流程。

## 1.4.6 NearestCentroid 最近质心分类器

**最近质心分类器**把每类样本求平均得到质心，新样本归属到距离最近的质心。它只有每类一个代表点，内存与预测都极快，适合类别中心能代表类别分布的场景。

```python
from sklearn.neighbors import NearestCentroid

X, y = load_iris(return_X_y=True)
nc = NearestCentroid().fit(X, y)
print(nc.score(X, y))
print(nc.centroids_.shape)   # (3, 4)，每类一个质心
```

`shrink_threshold` 参数开启特征收缩，把与全局均值差异过小的特征向全局均值收缩，帮助去除噪声特征，适合特征多、样本少的场景。

## 1.4.7 最近邻变换器

`KNeighborsTransformer` 与 `RadiusNeighborsTransformer` 把最近邻关系转成稀疏的相似度矩阵，作为管道中的一步供其他算法（如谱聚类）使用。`mode` 控制输出形式：`'distance'` 输出距离，`'connectivity'` 输出 0/1 连接关系。

```python
from sklearn.neighbors import KNeighborsTransformer

knt = KNeighborsTransformer(n_neighbors=3, mode='distance')
mat = knt.fit_transform(X[:10])
print(mat.shape)     # (10, 10) 的稀疏矩阵
```

这类变换器让最近邻图的构建进入 `Pipeline`，并且同样受益于 KD 树等加速结构。

## 1.4.8 NeighborhoodComponentsAnalysis 度量学习

`NeighborhoodComponentsAnalysis`（NCA）的目标是**学一个线性变换**，使变换后同类样本被拉近、异类样本被推开，从而提升下游 KNN 的准确率。它把度量学习嵌入 KNN：学习矩阵 $L$，把距离定义为 $\|L(x-z)\|_2$。

```python
from sklearn.neighbors import NeighborhoodComponentsAnalysis
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_iris(return_X_y=True)
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('nca', NeighborhoodComponentsAnalysis(n_components=2)),
    ('knn', KNeighborsClassifier(n_neighbors=5)),
])
pipe.fit(X, y)
print(pipe.score(X, y))
```

NCA 是有监督的降维与度量学习方法，学到的投影保留类别信息，通常放在标准化之后、KNN 之前，能明显提升高维数据的 KNN 效果。

## 1.4.9 最近邻算法与数据结构

朴素计算最近邻要遍历全部样本，复杂度 $O(Nd)$，数据量大时很慢。sklearn 提供三种搜索策略，由 `algorithm` 参数选择。

| 算法 | 原理 | 适用场景 |
|------|------|------|
| 暴力法 `brute` | 逐个计算所有距离 | 样本少，或维度高时唯一可行 |
| KD 树 `kd_tree` | 按坐标递归切分空间 | 低维（约 20 维以下）数据 |
| 球树 `ball_tree` | 用嵌套超球划分空间 | 高维、分布不均匀的数据 |

```python
from sklearn.neighbors import KNeighborsClassifier

X, y = load_iris(return_X_y=True)
knn = KNeighborsClassifier(n_neighbors=5, algorithm='kd_tree')
knn.fit(X, y)
print(knn.predict(X[:3]))
```

KD 树沿坐标轴切分，维度升高时切分效率急剧下降；球树用距离圆心构造的嵌套球划分，对高维更友好。维度过高（如几百维）时所有树结构都会退化，暴力法反而更可靠。`algorithm='auto'` 让 sklearn 根据数据自动选择，多数情况下不必手动指定。

## 练习题

### 第1题 概念理解

写出欧氏距离公式并说明 `p` 参数的作用；说明 K 近邻分类与回归的预测方式差异；说明 KD 树与球树的适用维度差异。

::: details 参考答案

欧氏距离 $\|x-z\|_2=\sqrt{\sum_i(x_i-z_i)^2}$ 是 Minkowski 距离 `p=2` 的特例，`p=1` 是曼哈顿距离。分类用多数投票，回归用邻居标签平均。KD 树沿坐标切分，适合低维；球树用超球嵌套划分，高维与分布不均匀时更好。
:::

### 第2题 代码编写

用 `make_classification` 生成数据，训练 `KNeighborsClassifier` 并对比不同 `n_neighbors` 与 `weights` 的准确率；用 `NearestNeighbors.kneighbors` 查询最近邻下标与距离。

::: details 参考答案

```python
from sklearn.datasets import make_classification
from sklearn.neighbors import KNeighborsClassifier, NearestNeighbors
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=300, n_features=6, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

for k in [1, 5, 15]:
    for w in ['uniform', 'distance']:
        model = KNeighborsClassifier(n_neighbors=k, weights=w).fit(Xtr, ytr)
        print(k, w, model.score(Xte, yte))

nn = NearestNeighbors(n_neighbors=3).fit(Xtr)
dist, ind = nn.kneighbors(Xte[:2])
print(dist)
print(ind)
```

:::

### 第3题 进阶练习

用 `Pipeline` 组合标准化、NCA 与 KNN，比较加入 NCA 前后的准确率；比较 `algorithm='brute'` 与 `'kd_tree'` 在低维数据上的耗时。

::: details 参考答案

```python
import time
from sklearn.datasets import make_classification
from sklearn.neighbors import KNeighborsClassifier, NeighborhoodComponentsAnalysis
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=500, n_features=20, n_informative=8, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

pipe1 = Pipeline([('scaler', StandardScaler()),
                  ('knn', KNeighborsClassifier(n_neighbors=5))])
pipe2 = Pipeline([('scaler', StandardScaler()),
                  ('nca', NeighborhoodComponentsAnalysis(n_components=10)),
                  ('knn', KNeighborsClassifier(n_neighbors=5))])
pipe1.fit(Xtr, ytr)
pipe2.fit(Xtr, ytr)
print('without NCA:', pipe1.score(Xte, yte))
print('with NCA:', pipe2.score(Xte, yte))

t0 = time.time()
KNeighborsClassifier(n_neighbors=5, algorithm='brute').fit(Xtr, ytr).score(Xte, yte)
t1 = time.time()
KNeighborsClassifier(n_neighbors=5, algorithm='kd_tree').fit(Xtr, ytr).score(Xte, yte)
t2 = time.time()
print('brute:', round(t1 - t0, 4), 'kd_tree:', round(t2 - t1, 4))
```

:::

## 常见错误

**错误 1 · KNN 效果差，准确率很低**

原因:特征尺度差异大，大尺度特征主导了距离；`n_neighbors` 选择不当。

解决:先 `StandardScaler` 标准化，再用交叉验证选 `k`。

**错误 2 · 高维数据 KNN 训练与预测都很慢**

原因:维度高时树结构退化，退化为近似暴力计算。

解决:先降维（PCA、NCA），或用 `algorithm='brute'` 配合分块计算。

**错误 3 · RadiusNeighbors 大量样本被判为 -1**

原因:`radius` 设得太小，稀疏区域半径内没有邻居。

解决:调大 `radius`，或设置 `outlier_label` 指定替代类别。

**错误 4 · 特征未标准化导致距离失真**

原因:欧氏距离对量纲敏感，数值大的特征掩盖其他特征。

解决:训练前用 `StandardScaler` 或 `MinMaxScaler` 缩放特征。

**错误 5 · 用 KNN 处理几十万以上样本内存不足**

原因:暴力存储全部样本，预测时也需加载整个训练集。

解决:考虑 `KDTree`/`BallTree` 索引，或用对存储更友好的其他模型。
