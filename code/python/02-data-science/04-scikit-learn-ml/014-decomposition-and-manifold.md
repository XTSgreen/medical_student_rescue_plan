---
title: 1.14 矩阵分解与流形学习
sidebar:
  order: 14
---
# 1.14 矩阵分解与流形学习

高维数据让算法又慢又容易过拟合，而真实数据往往隐藏在低维结构中：几百个像素的图片其实由少数**成分**组合而成，海量文档由少数几个主题混合而成。矩阵分解就是把这些数据矩阵拆成几个有解释意义的小矩阵，从而压缩维度、提取成分。流形学习则假设高维点其实分布在一个低维弯曲的表面上，想办法把这种弯曲结构**摊平**到二维三维便于观察。本节覆盖 `sklearn.decomposition` 与 `sklearn.manifold` 两大模块。

## 1.14.1 降维的两条路线

降维目标一致：把 $d$ 维数据映射到更低的 $k$ 维，尽量保留结构。但出发点不同。**线性方法**假设低维结构是原始空间的线性子空间，用矩阵分解直接算出投影方向，PCA 是代表，计算快、可解释。**流形方法**假设低维结构是弯曲的，先构造局部邻域关系再做非线性映射，能保留更复杂结构，但计算慢、结果随参数波动大。先掌握线性方法，再理解流形方法。

## 1.14.2 PCA 主成分分析

PCA（主成分分析）的目标是**找方差最大的投影方向**。方差越大说明投影后数据越分散、信息保留越多，因此 PCA 依次找互相正交的方向，使数据在它们上面的方差依次最大，这些方向就是主成分。从数学上，PCA 对数据矩阵做奇异值分解：

$$X = U\,\Sigma\,V^T$$

其中 $X$ 是中心化后的数据矩阵（每行一个样本），$V$ 的列是主成分方向（载荷向量），$\Sigma$ 的对角元素是奇异值，其平方正比于各方向上的方差，$U$ 给出样本在新坐标下的得分。截取 $V$ 的前 $k$ 列，就把数据投影到了前 $k$ 个主成分张成的子空间。

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler

digits = load_digits()          # 64 维的像素特征
X = StandardScaler().fit_transform(digits.data)

pca = PCA(n_components=10)
X_pca = pca.fit_transform(X)    # 降到 10 维
print(X_pca.shape)
print(pca.explained_variance_ratio_)       # 每个主成分解释的方差占比
print(pca.explained_variance_ratio_.sum()) # 前 10 个主成分解释的总占比
```

`n_components` 指定保留的主成分个数，也可以传浮点数（如 0.95）表示保留累计解释方差达到 95% 的成分数；`explained_variance_ratio_` 给出每个主成分解释的方差占比，是判断**降多少维合适**的关键依据：通常取累计占比达到 80% 到 95% 的维数。

```python
# 用累计解释方差曲线决定保留维数
import matplotlib.pyplot as plt
import numpy as np
pca_full = PCA().fit(X)
cum = np.cumsum(pca_full.explained_variance_ratio_)
plt.plot(cum)
plt.axhline(0.9, color='r', ls='--')
plt.xlabel('主成分数')
plt.ylabel('累计解释方差')
plt.show()
```

## 1.14.3 PCA 的多种变体

**IncrementalPCA 增量 PCA** 分批次处理数据，不需要把全部数据载入内存，适合样本量巨大、内存受限的场景，`batch_size` 控制每批大小：

```python
from sklearn.decomposition import IncrementalPCA

ipca = IncrementalPCA(n_components=10, batch_size=100)
X_ipca = ipca.partial_fit(X[:100]).partial_fit(X[100:]).transform(X)
```

**SparsePCA 稀疏主成分** 在 PCA 的基础上要求载荷向量尽量稀疏（大部分元素为 0），让每个主成分只依赖少量原始特征，可解释性更强；`MiniBatchSparsePCA` 是其小批量加速版，适合大数据。

**KernelPCA 核 PCA** 用核技巧把数据先映射到高维特征空间再做 PCA，能捕捉非线性结构，配合 `kernel='rbf'` 可处理线性 PCA 无能为力的弯曲数据。

**TruncatedSVD 截断 SVD** 只计算前 $k$ 个奇异值对应的分解，不要求数据中心化，天然适合稀疏矩阵，因此常用于文本的潜在语义分析（LSA）：把文档-词频矩阵分解后，得到文档的低维主题表示：

```python
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

corpus = ['机器学习 教程 数据', '数据 分析 教程', '机器学习 深度学习']
tfidf = TfidfVectorizer().fit_transform(corpus)
svd = TruncatedSVD(n_components=2, random_state=0)
doc_topic = svd.fit_transform(tfidf)
print(doc_topic.shape)
```

**FactorAnalysis 因子分析** 假设观测变量由少数不可观测的**公共因子**加上各自的独有噪声线性生成，即 $x = \mu + \Lambda f + \varepsilon$，其中 $\Lambda$ 是因子载荷矩阵、$f$ 是公共因子、$\varepsilon$ 是独有误差。它与 PCA 都做降维，但 PCA 关注**保留总方差**，因子分析关注**解释变量间的相关性结构**。

**FastICA 独立成分分析** 目标是找出互相统计独立（而非只不相关）的成分，常用于盲源分离，比如从混合信号中分离出独立声源；`whiten` 控制是否先白化。

## 1.14.4 NMF 与字典学习

**NMF（非负矩阵分解）** 把非负数据矩阵拆成两个非负矩阵的乘积：

$$X \approx WH$$

其中 $X$ 是原始数据（如像素亮度、词频），$W$ 是成分矩阵（$W$ 的每列代表一个**基础成分**，如一个主题或一张基图），$H$ 是系数矩阵（每个样本用了多少各成分）。两个因子都要求非负，这让结果天然可加、可解释：整幅图像被解释为若干基图的非负叠加。非负约束只适合本身非负的数据，如灰度图像、词频矩阵：

```python
from sklearn.decomposition import NMF

X_face = digits.data / 16.0            # 灰度值归一化到 [0,1]
nmf = NMF(n_components=20, init='nndsvda', random_state=0)
W = nmf.fit_transform(X_face)          # 样本 × 成分
H = nmf.components_                    # 成分 × 特征，即基图
print(W.shape, H.shape)
```

`MiniBatchNMF` 是小批量加速版，适合大规模数据。**DictionaryLearning 字典学习** 与 NMF 类似，也是学习一组**基**（字典）并稀疏编码，但不要求非负，基的数量由 `n_components` 控制，适合信号重建与压缩。**SparseCoder** 不学习字典，它使用给定的一本字典，把新样本表示为字典原子的稀疏组合，`transform` 时使用。

```python
from sklearn.decomposition import DictionaryLearning, SparseCoder

dl = DictionaryLearning(n_components=20, random_state=0)
code = dl.fit_transform(X_face)        # 学习字典并稀疏编码
print((code != 0).mean())              # 编码的稀疏度

coder = SparseCoder(dictionary=dl.components_, transform_algorithm='lasso_lars')
new_code = coder.transform(X_face[:5]) # 用已有字典编码新样本
```

## 1.14.5 LDA 主题模型

`LatentDirichletAllocation`（LDA）是文档主题模型：假设每篇文档是若干主题的混合，每个主题是词的概率分布。它用概率图模型的思路，从文档-词频矩阵中推断出**文档-主题**与**主题-词**两组分布，是文本聚类的常用工具：

```python
from sklearn.decomposition import LatentDirichletAllocation

lda = LatentDirichletAllocation(n_components=3, random_state=0)
lda.fit(tfidf)
print(lda.components_)   # 主题-词分布
```

注意 LDA 与前面的线性方法不同：它基于词频的统计生成假设，输出的是概率分布而非坐标，常用于主题发现，也常作为文本特征抽取的上游步骤。

## 1.14.6 流形学习

流形学习把高维点在低维弯曲流形上的结构**摊平**到低维空间，擅长可视化。**MDS（多维缩放）** 的目标是让降维后样本间的两两距离尽量保持原空间的距离，用损失函数（如 Kruskal 的应力）衡量距离保持程度。**Isomap（等距映射）** 用测地距离代替欧氏距离：先在局部构造近邻图，再沿图计算两点间的最短路径距离，从而把弯曲流形上的真实**路程**保留下来：

```python
from sklearn.manifold import MDS, Isomap

mds = MDS(n_components=2, random_state=0)
X_mds = mds.fit_transform(X[:100])
iso = Isomap(n_components=2, n_neighbors=10)
X_iso = iso.fit_transform(X[:100])
```

**LocallyLinearEmbedding（局部线性嵌入，LLE）** 假设每个点可以由近邻点线性重构，先学重构权重，再在低维空间尽量保持这套重构关系，适合保留流形局部结构。它有几个变体：`modified` 改进版对边界和噪声更稳健；`hessian` 用 Hessian 正则化，理论保证更强；`ltsa`（局部切空间对齐）用局部切空间描述流形。通过 `method` 参数选择：

```python
from sklearn.manifold import LocallyLinearEmbedding

for method in ['standard', 'modified', 'hessian', 'ltsa']:
    lle = LocallyLinearEmbedding(n_components=2, n_neighbors=12, method=method)
    lle.fit(X[:100])
    print(method, lle.reconstruction_error_)
```

**TSNE（t-SNE）** 是最流行的可视化工具，把高维相似度（用高斯核定义的条件概率）与二维嵌入中的相似度（用 t 分布定义）尽量对齐，让相近的点靠拢、相远的点分开。`perplexity` 控制算法关注多少近邻：太小看重局部、太大看重全局，通常在 5 到 50 之间，对结果影响很大：

```python
from sklearn.manifold import TSNE

tsne = TSNE(n_components=2, perplexity=30, random_state=0)
X_tsne = tsne.fit_transform(X[:200])
print(X_tsne.shape)
```

**SpectralEmbedding 谱嵌入** 与谱聚类同源：把样本间相似度写成图的拉普拉斯矩阵，取其低维特征向量作为坐标，适合保留全局连接结构。流形方法都较慢，样本多时先抽样或先 PCA 降维再跑流形方法，是常见做法。

## 练习题

### 第1题 概念理解

说明 SVD 分解 $X=U\Sigma V^T$ 中 $U$、$\Sigma$、$V$ 的含义及 PCA 为何是**找方差最大的投影方向**；说明 `explained_variance_ratio_` 的用途；写出 NMF 的分解形式 $X\approx WH$ 并解释 $W$、$H$ 与**非负**约束的意义；说明 t-SNE 中 `perplexity` 的作用。

::: details 参考答案

$V$ 的列是主成分方向，$\Sigma$ 对角元素是奇异值（平方正比于方差），$U$ 给出样本在新空间的坐标；PCA 依次找正交方向使投影方差最大，方差大信息保留多。`explained_variance_ratio_` 表示各主成分解释的方差占比，用于选维数。NMF 中 $W$ 是成分（基）矩阵、$H$ 是系数矩阵，非负约束让结果可加可解释。`perplexity` 控制 t-SNE 关注近邻的多少，太小只看局部、太大偏向全局。
:::

### 第2题 代码编写

对 `load_digits` 数据做 PCA，绘制累计解释方差曲线并选出保留 90% 方差需要的维数；用 TSNE 把数据降到二维并画散点图按类别着色；用 NMF 对灰度像素数据分解，查看成分数量与重构效果。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA, NMF
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler

digits = load_digits()
X = StandardScaler().fit_transform(digits.data)

pca_full = PCA().fit(X)
cum = np.cumsum(pca_full.explained_variance_ratio_)
k = np.argmax(cum >= 0.9) + 1
print('保留 90% 方差需要', k, '维')

tsne = TSNE(n_components=2, perplexity=30, random_state=0)
X_tsne = tsne.fit_transform(X[:300])
plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=digits.target[:300], cmap='tab10', s=8)
plt.show()

X_face = digits.data / 16.0
nmf = NMF(n_components=20, random_state=0).fit(X_face)
recon = nmf.transform(X_face[:10]) @ nmf.components_
print('重构误差', np.mean((X_face[:10] - recon) ** 2))
```

:::

### 第3题 进阶练习

比较 PCA、Isomap、LLE（standard 与 modified）和 TSNE 在 `load_digits` 上降到 2 维后，用 K 近邻分类器在低维空间对测试集的准确率；对 `make_swiss_roll` 数据比较线性方法与流形方法谁能还原出展开的平面结构。

::: details 参考答案

```python
import numpy as np
from sklearn.datasets import load_digits, make_swiss_roll
from sklearn.decomposition import PCA
from sklearn.manifold import Isomap, LocallyLinearEmbedding, TSNE
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

digits = load_digits()
X_train, X_test, y_train, y_test = train_test_split(
    digits.data, digits.target, random_state=0)
methods = {'PCA': PCA(n_components=2),
           'Isomap': Isomap(n_components=2, n_neighbors=10),
           'LLE': LocallyLinearEmbedding(n_components=2, n_neighbors=10),
           't-SNE': TSNE(n_components=2, random_state=0)}
for name, m in methods.items():
    m.fit(X_train)
    Xtr = m.transform(X_train)
    Xte = m.transform(X_test)
    acc = KNeighborsClassifier(n_neighbors=5).fit(Xtr, y_train).score(Xte, y_test)
    print(name, round(acc, 3))

X_swiss, _ = make_swiss_roll(n_samples=500, noise=0.2, random_state=0)
pca2 = PCA(n_components=2).fit_transform(X_swiss)
iso2 = Isomap(n_components=2, n_neighbors=12).fit_transform(X_swiss)
print('PCA 坐标范围', pca2.std(axis=0).round(3))
print('Isomap 坐标范围', iso2.std(axis=0).round(3))
```

:::

## 常见错误

**错误 1 · 直接对量级差异大的特征做 PCA，结果被大数值特征主导**

现象：第一主成分几乎只反映某个数值特别大的特征。

原因：PCA 基于方差，量级大的特征方差也大，主导了主成分方向。

解决：先 `StandardScaler` 标准化，让各特征等权。

**错误 2 · 用 NMF 处理含负值的数据报错**

现象：报 `ValueError`，提示输入包含负值。

原因：NMF 要求非负输入，负值无法拆成两个非负矩阵。

解决：先确认数据非负（如灰度值、词频），或改用 PCA、DictionaryLearning。

**错误 3 · TSNE 在大样本上运行极慢**

现象：上万样本的 TSNE 跑了很久。

原因：t-SNE 计算所有点对相似度，复杂度约为 $O(n^2)$。

解决：先抽样或先用 PCA 降维再跑 t-SNE。

**错误 4 · 用 `TruncatedSVD` 处理需要中心化的数据**

现象：结果与 PCA 差异明显，方差解释不符合预期。

原因：`TruncatedSVD` 不中心化数据，直接对原矩阵做截断分解。

解决：文本等稀疏场景用 `TruncatedSVD`，需要标准化的场景改用 `PCA` 并先中心化。
