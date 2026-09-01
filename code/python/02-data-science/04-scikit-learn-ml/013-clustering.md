---
title: 1.13 聚类
sidebar:
  order: 13
---
# 1.13 聚类

分类问题需要预先知道每个样本的类别标签，而很多场景只有一堆特征、没有任何标签。聚类是无监督学习的主力：把相似的样本归到同一簇，让簇内紧密、簇间疏远。超市按用户消费行为分群、文档按主题分组、图像像素按颜色分区，都属于聚类任务。本节覆盖 `sklearn.cluster` 的划分法、层次法、密度法等主流方法，以及如何量化评价聚类结果的好坏。

## 1.13.1 聚类的目标与评价思路

聚类的目标可以概括为：**让同一簇内的样本尽可能相似，不同簇的样本尽可能不同**。不同算法对这个目标的建模方式完全不同：有的把问题写成优化目标（KMeans），有的不断合并最近的两簇（层次法），有的寻找密度相连的区域（DBSCAN）。

由于没有真实标签，聚类评价比分类复杂。评价分两类：如果手里有外部标签（比如数据集自带类别），可以用**有标签可比指标**衡量聚类与真实类别的吻合度；如果没有标签，只能用**无标签指标**衡量簇内紧密、簇间分离的程度。两类指标会在 1.13.7 展开。

## 1.13.2 KMeans 划分法

KMeans 是使用最广的划分法。它先把数据硬分成 $K$ 个簇，每个簇用一个中心 $\mu_k$ 代表，目标是最小化所有点到所属簇中心的平方距离之和：

$$
\min\sum_{k}\sum_{x\in C_k}\|x-\mu_k\|^2
$$

公式中 $C_k$ 是第 $k$ 个簇包含的样本集合，$\mu_k$ 是该簇的中心（簇内样本的均值），$\|x-\mu_k\|$ 是样本到中心的欧氏距离。整个式子的含义是：**每个点分配到最近的簇中心，让簇内平方距离和最小**。直观上就是让每个簇尽量**聚成一团**。

求解用迭代算法：先随机初始化 $K$ 个中心，然后交替执行**分配**（每个点归到最近的中心）和**更新**（重新计算每簇均值作为新中心），直到中心不再变化。

```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

X, _ = make_blobs(n_samples=300, centers=4, random_state=0)
km = KMeans(n_clusters=4, init='k-means++', n_init=10, random_state=0)
km.fit(X)
print(km.labels_[:10])        # 每个样本的簇编号
print(km.cluster_centers_)    # 4 个簇中心
```

常用参数：`n_clusters` 是簇的数量，需要事先指定；`init='k-means++'` 用智能方式选初始中心，让初始中心尽量分散，比随机初始化更稳定；`n_init` 是重复运行的次数，每次用不同初始中心，取结果最好的一次，越大越稳定但越慢。

`MiniBatchKMeans` 是 KMeans 的小批量版本，每次只用一小批样本更新中心，适合数据量大到无法整体装入内存的场景，速度远快于 KMeans，精度略有损失：

```python
from sklearn.cluster import MiniBatchKMeans

mbk = MiniBatchKMeans(n_clusters=4, batch_size=100, random_state=0)
mbk.fit(X)
print(mbk.inertia_)   # 簇内平方距离和，越小越好
```

## 1.13.3 选择 K 值：肘部法与轮廓系数

KMeans 需要指定 `n_clusters`，选错 K 会得到无意义的分簇。两种常用方法：

**肘部法** 看不同 K 下的簇内平方距离和（`inertia_`）。K 增大时 `inertia` 一定下降，但下降速度会变慢，下降由快转慢的拐点像**肘部**，那里的 K 就是推荐值。

**轮廓系数** 是样本级的指标，见 1.13.7 的公式，衡量每个样本在簇内是否紧凑、与最近邻簇是否疏远，取值在 $[-1,1]$，越接近 1 越好。可以画出不同 K 的轮廓系数均值来选 K。

```python
import matplotlib.pyplot as plt
from sklearn.metrics import silhouette_score

inertias, sil_scores = [], []
for k in range(2, 7):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    inertias.append(km.inertia_)
    sil_scores.append(silhouette_score(X, km.labels_))

plt.plot(range(2, 7), inertias, marker='o', label='inertia')
plt.title('肘部法')
plt.show()
```

## 1.13.4 AgglomerativeClustering 层次聚类

层次聚类采用**凝聚式**策略：先把每个样本当成一个独立的簇，然后反复合并距离最近的两个簇，直到达到目标簇数。合并过程可以用树状图（dendrogram）表示，展示数据的嵌套结构。`linkage` 决定**两个簇之间的距离**如何定义：

`ward` 合并后簇内方差增加量最小的两簇，得到的簇通常较紧凑，默认且常用；`complete` 取两簇间最远两点距离（最大距离），倾向生成紧致的小簇；`average` 取两簇间所有点对距离的平均；`single` 取两簇间最近两点距离（最小距离），能发现细长形状的簇，但对噪声和链状连接敏感。

```python
from sklearn.cluster import AgglomerativeClustering

agg = AgglomerativeClustering(n_clusters=4, linkage='ward')
agg.fit(X)
print(agg.labels_)
```

`FeatureAgglomeration` 把同样的层次合并思想用到**特征**上：把高度相关的特征合并成一组，压缩特征维度，作为降维工具配合 `n_clusters` 指定压缩后的特征数：

```python
from sklearn.cluster import FeatureAgglomeration

fa = FeatureAgglomeration(n_clusters=10)
X_reduced = fa.fit_transform(X)   # 把原特征聚成 10 个新特征
print(X_reduced.shape)
```

## 1.13.5 DBSCAN 密度聚类

DBSCAN 不预设簇的数量，按**密度**聚类：在半径为 $\text{eps}$ 的邻域内，样本数量超过 $\text{min\_samples}$ 的点是**核心点**；在核心点邻域内但自身不是核心点的叫**边界点**；两者都不满足的叫**噪声点**。从任意核心点出发，把密度相连的点连成一片，就是一个簇。

```python
from sklearn.cluster import DBSCAN
from sklearn.datasets import make_moons

X, _ = make_moons(n_samples=300, noise=0.06, random_state=0)
db = DBSCAN(eps=0.3, min_samples=5)
db.fit(X)
print(set(db.labels_))      # 噪声点标签为 -1
```

参数 `eps` 是邻域半径，决定**多近算近**，太小会把一个簇拆散，太大又会把多个簇连成一片；`min_samples` 是成为核心点所需的最少邻居数，越大越能抑制噪声。DBSCAN 的标签中 **-1 表示噪声点**。它最大的优点是不需要指定簇数，能识别任意形状的簇并自动标出离群点。

`OPTICS` 是 DBSCAN 的改进版，对 `eps` 不再敏感，能自动发现密度不均的簇结构，但更慢。`HDBSCAN` 在 DBSCAN 基础上引入层次结构（层次 DBSCAN），自动确定簇数与簇形状，效果更强，但**需要额外安装** `pip install hdbscan`，不属于 sklearn 内置：

```python
# pip install hdbscan
import hdbscan
clusterer = hdbscan.HDBSCAN(min_cluster_size=10)
clusterer.fit(X)
print(clusterer.labels_)
```

## 1.13.6 其他聚类方法

**MeanShift 均值漂移** 让每个点不断朝局部密度最高的方向**漂移**，直到所有点收敛到密度峰，每个峰就是一个簇。它不要求指定簇数，但带宽参数很关键，用 `estimate_bandwidth` 从数据估计：

```python
from sklearn.cluster import MeanShift, estimate_bandwidth

bandwidth = estimate_bandwidth(X, quantile=0.2)
ms = MeanShift(bandwidth=bandwidth).fit(X)
print(set(ms.labels_))
```

**SpectralClustering 谱聚类** 先把数据映射到相似度图的谱（特征向量）空间，再在新空间做 KMeans。它能处理非凸形状的簇，对 `make_circles` 这类同心圆数据效果好，但需要指定簇数、计算开销较大：

```python
from sklearn.cluster import SpectralClustering

sc = SpectralClustering(n_clusters=2, affinity='nearest_neighbors', random_state=0)
sc.fit(X)
print(sc.labels_)
```

**AffinityPropagation 亲和传播** 通过样本间**互相投票**自动确定簇的数量和代表点（exemplar），不需要指定簇数，但计算复杂度高，适合中小数据集：

```python
from sklearn.cluster import AffinityPropagation

ap = AffinityPropagation(random_state=0).fit(X)
print(ap.cluster_centers_indices_.shape)
```

**BIRCH** 用 CF 树（聚类特征树）先对数据做粗略压缩，再在压缩结果上聚类，内存占用小、速度快，适合大规模数据。它有一个全局簇数的 `n_clusters` 参数：

```python
from sklearn.cluster import Birch

brc = Birch(n_clusters=4).fit(X)
print(brc.labels_)
```

## 1.13.7 聚类评估指标

聚类指标分两类。**有标签可比指标**需要真实标签，衡量聚类结果与真实类别的吻合程度，这类指标不看簇的形状是否合理，只看**分得准不准**：`adjusted_rand_score`（ARI，把样本两两配对看是否同簇，再对随机结果校正）、`adjusted_mutual_info_score`（AMI，衡量两个划分共享的信息量，对随机结果校正）、`homogeneity_score`（同质性，每个簇是否只含单一类别）、`completeness_score`（完整性，每个类别是否完整落在一个簇）、`v_measure_score`（同质性与完整性的调和平均）、`fowlkes_mallows_score`（FM，基于两两配对的一致率）。这六个指标取值越接近 1 越好。

```python
from sklearn.metrics import (adjusted_rand_score, adjusted_mutual_info_score,
                             homogeneity_score, completeness_score,
                             v_measure_score, fowlkes_mallows_score)

y_true = make_blobs(n_samples=300, centers=4, random_state=0)[1]
km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(X)

print('ARI', round(adjusted_rand_score(y_true, km.labels_), 3))
print('AMI', round(adjusted_mutual_info_score(y_true, km.labels_), 3))
print('同质性', round(homogeneity_score(y_true, km.labels_), 3))
print('完整性', round(completeness_score(y_true, km.labels_), 3))
print('V 值', round(v_measure_score(y_true, km.labels_), 3))
print('FM', round(fowlkes_mallows_score(y_true, km.labels_), 3))
```

**无标签指标**不需要真实标签，直接从数据与分簇结果衡量**簇内紧凑、簇间分离**。最常用的是**轮廓系数**，对每个样本计算簇内平均距离 $a$（样本与同簇其他样本的平均距离）与最近邻簇平均距离 $b$：

$$
s=\frac{b-a}{\max(a,b)}
$$

$b$ 表示样本离最近邻簇有多远，$a$ 表示样本在簇内有多近。$s$ 接近 1 说明样本既离自己簇近又离别的簇远，接近 -1 说明分错了簇。`silhouette_score` 返回全体样本的平均值，`silhouette_samples` 返回每个样本的值。

```python
from sklearn.metrics import (silhouette_score, silhouette_samples,
                             davies_bouldin_score, calinski_harabasz_score)

print('轮廓系数', round(silhouette_score(X, km.labels_), 3))
print('每个样本轮廓值', silhouette_samples(X, km.labels_)[:5])
print('Davies-Bouldin', round(davies_bouldin_score(X, km.labels_), 3))
print('Calinski-Harabasz', round(calinski_harabasz_score(X, km.labels_), 3))
```

`davies_bouldin_score` 衡量簇间距离与簇内散度的比值，**越小越好**；`calinski_harabasz_score` 是簇间方差与簇内方差的比值，**越大越好**。聚类评估没有绝对标准，有标签时优先看 ARI、V 值等可比指标，无标签时看轮廓系数与 Calinski-Harabasz，并多结合业务含义判断。

## 练习题

### 第1题 概念理解

写出 KMeans 的目标函数并解释各符号含义；说明 `linkage` 的 ward、complete、average、single 四种方式的区别；说明 DBSCAN 中核心点、边界点、噪声点的定义；说明有标签可比指标与无标签指标的适用场景。

::: details 参考答案

$$
\min\sum_{k}\sum_{x\in C_k}\|x-\mu_k\|^2
$$

公式中 $C_k$ 是第 $k$ 个簇、$\mu_k$ 是簇中心，目标是让每个点分到最近的簇中心使簇内平方距离和最小。linkage 中 ward 合并簇内方差增量最小，complete 取最大距离，average 取平均距离，single 取最小距离。DBSCAN 中邻域内样本数不少于 min_samples 的是核心点，位于核心点邻域但自身不达标的是边界点，两者都不满足的是噪声点。有标签指标衡量与真实类别的吻合度，无标签指标衡量簇的紧密与分离程度。
:::

### 第2题 代码编写

用 `make_blobs` 生成 4 簇数据，比较 KMeans、AgglomerativeClustering（ward）、DBSCAN、SpectralClustering 四种方法的 ARI 与轮廓系数；用 `make_circles` 生成同心圆数据，观察哪种方法能把两个环正确分开。

::: details 参考答案

```python
import numpy as np
from sklearn.datasets import make_blobs, make_circles
from sklearn.cluster import (KMeans, AgglomerativeClustering, DBSCAN,
                             SpectralClustering)
from sklearn.metrics import adjusted_rand_score, silhouette_score

X, y = make_blobs(n_samples=300, centers=4, random_state=0)
models = {'KMeans': KMeans(n_clusters=4, n_init=10, random_state=0),
          '层次(ward)': AgglomerativeClustering(n_clusters=4),
          'DBSCAN': DBSCAN(eps=0.5, min_samples=5),
          '谱聚类': SpectralClustering(n_clusters=4, random_state=0)}
for name, m in models.items():
    m.fit(X)
    print(name, 'ARI', round(adjusted_rand_score(y, m.labels_), 3),
          '轮廓', round(silhouette_score(X, m.labels_), 3))

Xc, yc = make_circles(n_samples=300, noise=0.05, factor=0.5, random_state=0)
for name, m in {'KMeans': KMeans(n_clusters=2, n_init=10, random_state=0),
                'DBSCAN': DBSCAN(eps=0.15, min_samples=5),
                '谱聚类': SpectralClustering(n_clusters=2, random_state=0)}.items():
    m.fit(Xc)
    print(name, 'ARI', round(adjusted_rand_score(yc, m.labels_), 3))
```

:::

### 第3题 进阶练习

对 `make_blobs` 数据画出 K 取 2 到 8 时的肘部图与轮廓系数曲线，判断推荐 K；用 `MiniBatchKMeans` 与 KMeans 在较大数据集上比较运行时间与 `inertia_`；对 `FeatureAgglomeration` 压缩后的数据重新聚类，观察 ARI 的变化。

::: details 参考答案

```python
import time
import numpy as np
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans, MiniBatchKMeans, FeatureAgglomeration
from sklearn.metrics import adjusted_rand_score, silhouette_score
import matplotlib.pyplot as plt

X, y = make_blobs(n_samples=500, centers=4, random_state=0)

inertias, sils = [], []
for k in range(2, 9):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    inertias.append(km.inertia_)
    sils.append(silhouette_score(X, km.labels_))
plt.subplot(1, 2, 1); plt.plot(range(2, 9), inertias, marker='o')
plt.subplot(1, 2, 2); plt.plot(range(2, 9), sils, marker='o')
plt.show()

X_big, y_big = make_blobs(n_samples=20000, centers=5, random_state=0)
for name, m in [('KMeans', KMeans(n_clusters=5, n_init=10, random_state=0)),
                ('MiniBatch', MiniBatchKMeans(n_clusters=5, batch_size=500, random_state=0))]:
    t0 = time.time(); m.fit(X_big)
    print(name, '耗时', round(time.time() - t0, 3), 'inertia', round(m.inertia_, 1))

fa = FeatureAgglomeration(n_clusters=8).fit(X)
X_fa = fa.transform(X)
km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(X_fa)
print('压缩后 ARI', round(adjusted_rand_score(y, km.labels_), 3))
```

:::

## 常见错误

**错误 1 · 用 DBSCAN 的默认 eps 直接聚类得到大量噪声**

现象：聚类结果标签大多是 -1，几乎没有形成簇。

原因：默认 `eps=0.5` 与数据尺度不匹配，邻域内样本数不足。

解决：用 K 近邻距离图选择 `eps`，或改用 OPTICS、HDBSCAN 自动确定邻域尺度。

**错误 2 · 数据尺度差异大时 KMeans 结果被大数值特征主导**

现象：分簇结果看起来主要按数值大的特征划分。

原因：KMeans 用欧氏距离，量级大的特征贡献了绝大部分距离。

解决：聚类前用 `StandardScaler` 标准化，让各特征等权参与距离计算。

**错误 3 · 用 ARI 等有标签指标评估却没有真实标签**

现象：代码报错或结果无意义，因为传入的**标签**只是猜测。

原因：ARI、V 值等指标需要真实类别做参照，不能拿 `labels_` 自己比自己。

解决：无真实标签时改用轮廓系数、Davies-Bouldin、Calinski-Harabasz 等无标签指标。

**错误 4 · 混淆 `silhouette_score` 与 `silhouette_samples` 的返回值**

现象：想取单个样本的轮廓值，却调用 `silhouette_score` 拿到一个平均数。

原因：两个函数一个返回标量平均值、一个返回逐样本数组。

解决：全局评价用 `silhouette_score`，需要样本级值（如画轮廓图）用 `silhouette_samples`。
