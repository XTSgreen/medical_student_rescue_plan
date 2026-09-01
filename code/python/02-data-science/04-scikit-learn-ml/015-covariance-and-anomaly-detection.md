---
title: 1.15 协方差估计与异常检测
sidebar:
  order: 15
---
# 1.15 协方差估计与异常检测

协方差矩阵刻画了各特征之间如何协同变化，是马氏距离、多元高斯、PCA 等众多方法的地基。协方差估计得好不好，直接影响下游结果；样本少、含离群点时，朴素估计会严重失真。异常检测则是另一个方向的任务：从大量正常数据中揪出偏离常规的样本，比如银行卡盗刷、设备故障、网络攻击。本节先讲 `sklearn.covariance` 的多种协方差估计方法，再讲基于协方差的 `EllipticEnvelope` 及另外三种主流异常检测方法。

## 1.15.1 协方差估计的意义

给定 $n$ 个样本、$d$ 个特征，**经验协方差**直接按定义估计：

$$
\hat{\Sigma}=\frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar{x})(x_i-\bar{x})^T
$$

其中 $x_i$ 是第 $i$ 个样本向量，$\bar{x}$ 是样本均值，$\hat{\Sigma}$ 的第 $p$ 行 $q$ 列表示特征 $p$ 与 $q$ 的协方差。这个估计无偏且简单，但有两个问题：样本量 $n$ 小于特征数 $d$ 时矩阵奇异无法求逆；个别离群点会严重拉偏协方差。异常检测里常把**正常数据的分布**建模成以 $\hat{\Sigma}$ 为协方差的多元高斯，所以协方差估得准不准直接决定检测效果。

```python
import numpy as np
from sklearn.covariance import EmpiricalCovariance

rng = np.random.RandomState(0)
X = rng.multivariate_normal([0, 0], [[1.0, 0.8], [0.8, 1.0]], size=200)
cov = EmpiricalCovariance().fit(X)
print(cov.covariance_)     # 经验协方差矩阵
print(cov.location_)       # 估计的均值
```

## 1.15.2 收缩协方差估计

样本量不足时，经验协方差矩阵的特征值容易被高估或低估，直接求逆会放大噪声。**收缩**的思路是把经验协方差向一个结构简单的目标矩阵（通常是对角矩阵）按比例拉近，换取数值稳定性。收缩程度由一个系数 $\alpha\in[0,1]$ 控制，越大越接近目标矩阵、偏差越大，越小越接近经验值、方差越大，需要权衡：

$$
\hat{\Sigma}_{\text{shrink}}=(1-\alpha)\,\hat{\Sigma}_{\text{emp}}+\alpha\,T
$$

其中 $\hat{\Sigma}_{\text{emp}}$ 是经验协方差，$T$ 是目标矩阵（如对角矩阵），$\alpha$ 是收缩强度。关键是 $\alpha$ 取多少：

`ShrunkCovariance` 需要手动指定 `shrinkage`；`LedoitWolf` 用 Ledoit-Wolf 公式**从数据自动求最优收缩系数**，是理论上的最优收缩；`OAS`（Oracle 近似收缩）在观测误差已知假设下更精确，大样本时两者趋近，小样本时 OAS 略优：

```python
from sklearn.covariance import ShrunkCovariance, LedoitWolf, OAS

sc = ShrunkCovariance(shrinkage=0.3).fit(X)
lw = LedoitWolf().fit(X)
oas = OAS().fit(X)
print('LedoitWolf 收缩系数', round(lw.shrinkage_, 3))
print('OAS 收缩系数', round(oas.shrinkage_, 3))
```

## 1.15.3 稳健协方差 MinCovDet

经验协方差对离群点极敏感：一个离谱的样本就能把协方差矩阵拖偏。**MinCovDet（最小协方差行列式）** 从数据中选出一个**最紧凑**的子集（协方差矩阵行列式最小的 $h$ 个样本），只基于这些正常样本估计均值和协方差，得到**稳健估计**，能抵御离群点干扰。它要求特征数小于样本数，且数据最好大致服从椭圆对称分布：

```python
from sklearn.covariance import MinCovDet

# 混入 10% 离群点
X_cont = np.vstack([X, rng.uniform(-5, 5, size=(20, 2))])
mcd = MinCovDet(random_state=0).fit(X_cont)
print(mcd.covariance_)
```

对比 `EmpiricalCovariance` 与 `MinCovDet` 在含离群点数据上的协方差，会发现后者与干净数据的真实协方差更接近。

## 1.15.4 GraphicalLasso 稀疏逆协方差

协方差矩阵的逆 $\Sigma^{-1}$ 称为**精度矩阵**（precision matrix）。精度矩阵的元素有明确的统计含义：$\Sigma^{-1}_{ij}=0$ 当且仅当在给定其他所有变量的条件下，变量 $i$ 与 $j$ **条件独立**。因此精度矩阵非零的位置揭示了变量之间的直接依赖关系，是网络结构推断的关键。GraphicalLasso 在求最大似然逆协方差的同时加入 L1 惩罚，迫使精度矩阵稀疏化：

```python
from sklearn.covariance import GraphicalLasso

gl = GraphicalLasso(alpha=0.01).fit(X_cont)
print(gl.precision_)   # 稀疏精度矩阵
```

`alpha` 控制稀疏程度，越大精度矩阵越稀疏、结构越简单。`GraphicalLassoCV` 用交叉验证自动选择 `alpha`，`get_params()` 中 `alpha` 给出选定的值。GraphicalLasso 要求特征数远小于样本数，适合基因调控网络、金融变量关联分析等**找直接关系**的场景。

## 1.15.5 EllipticEnvelope 椭圆包络

`EllipticEnvelope` 是异常检测模块 `sklearn.covariance` 的接口：它用稳健协方差（默认 MinCovDet）估计正常数据的均值和协方差，把**正常区域**画成一个椭圆（二维）或椭球（高维），再按**马氏距离**判断新样本是否在正常范围内。马氏距离定义为：

$$
d_M(x)=\sqrt{(x-\mu)^T\,\Sigma^{-1}\,(x-\mu)}
$$

其中 $x$ 是待判断样本，$\mu$ 是估计的均值，$\Sigma$ 是协方差矩阵。马氏距离把坐标按协方差方向做了缩放，可以理解为**距离中心多远，且以标准差为计量单位**：它消除了各特征量级和相关的干扰，沿主成分方向远一点无所谓，垂直于主成分方向近一点就算异常。

```python
from sklearn.covariance import EllipticEnvelope

env = EllipticEnvelope(contamination=0.1, random_state=0)
env.fit(X_cont)
pred = env.predict(X_cont)          # 1 正常，-1 异常
print(np.unique(pred, return_counts=True))
```

`contamination` 是预期异常样本占比，决定判定阈值放在哪里；`support_fraction` 控制稳健估计使用的样本比例。`mahalanobis()` 方法可直接输出每个样本的马氏距离：

```python
print(env.mahalanobis(X_cont[:5]))   # 每个样本的马氏距离
```

## 1.15.6 四种异常检测方法对比

异常检测方法大致分两类。**novelty 检测**：只在干净数据上训练，再去判断**新样本是否前所未见**，适合线上监控、模型上线后实时打分。**异常检测（outlier detection）**：训练数据本身已混入异常，算法要在训练时把它们找出来，适合对已有数据做筛查。二者区别在于训练数据是否干净、异常是否参与拟合。

四种方法各有侧重，都支持用 `predict`（输出 1 或 -1）、`score_samples`（越大越正常）和 `decision_function`（越大越正常）：

`EllipticEnvelope` 假设正常数据近似服从椭圆高斯分布，用马氏距离判断，适合分布大致高斯的低维数据；`IsolationForest`（隔离森林）随机切分特征空间，异常点用很少几次切分就能被孤立出来，对高维、非高斯数据稳健，不依赖分布假设：

```python
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor

# 训练数据本身含离群点（outlier detection）
lof = LocalOutlierFactor(contamination=0.1, novelty=False)
pred_lof = lof.fit_predict(X_cont)

iso = IsolationForest(contamination=0.1, random_state=0)
pred_iso = iso.fit_predict(X_cont)

# 干净数据上训练，判断新样本（novelty detection）
X_clean = rng.multivariate_normal([0, 0], [[1.0, 0.8], [0.8, 1.0]], size=200)
ocsvm = OneClassSVM(gamma='scale', nu=0.1)
ocsvm.fit(X_clean)
print(ocsvm.predict(X_cont[:10]))   # 新样本是否异常
```

`OneClassSVM` 用一个半超球把多数正常样本包起来，适合小样本高维，但对 `gamma`、`nu` 敏感；`LocalOutlierFactor`（LOF）基于**局部密度**：比较每个点邻域的密度与邻居邻域的密度，密度明显低于邻居的点视为异常，适合密度不均的数据，`contamination` 给出预期异常比例。实践建议：分布近似高斯、维度低时用 `EllipticEnvelope`；不知道分布形态、维度高时用 `IsolationForest`；需要捕捉局部密度异常时用 LOF；小样本、需要在新样本上打分的 novelty 场景用 `OneClassSVM`。

## 练习题

### 第1题 概念理解

写出马氏距离公式 $d_M(x)=\sqrt{(x-\mu)^T\Sigma^{-1}(x-\mu)}$ 并解释 $\mu$、$\Sigma$ 与**标准差计量**的含义；说明收缩估计解决什么问题、LedoitWolf 与 OAS 的差别；说明精度矩阵 $\Sigma^{-1}$ 中元素为 0 的统计含义；说明 novelty 检测与 outlier detection 的区别。

::: details 参考答案

$\mu$ 是均值、$\Sigma$ 是协方差矩阵，马氏距离把坐标按协方差缩放，相当于以标准差为单位度量到中心的距离。收缩把经验协方差向对角目标矩阵拉近，缓解样本不足时的数值不稳，LedoitWolf 自动求理论最优收缩系数，OAS 在观测误差假设下更精确。精度矩阵第 $i$ 行 $j$ 列为 0 表示给定其他变量时变量 $i$、$j$ 条件独立。novelty 检测在干净数据上训练再判新样本，outlier detection 在含异常的训练数据里直接找异常。
:::

### 第2题 代码编写

生成一个已知协方差的二元高斯数据并混入 10% 离群点，比较 `EmpiricalCovariance`、`LedoitWolf`、`MinCovDet` 估计的协方差与真实协方差的误差；用 `EllipticEnvelope` 检测离群点，输出预测标签与马氏距离前几个异常值。

::: details 参考答案

```python
import numpy as np
from sklearn.covariance import (EmpiricalCovariance, LedoitWolf,
                                MinCovDet, EllipticEnvelope)

rng = np.random.RandomState(0)
true_cov = np.array([[1.0, 0.8], [0.8, 1.0]])
X = rng.multivariate_normal([0, 0], true_cov, size=200)
X_cont = np.vstack([X, rng.uniform(-5, 5, size=(22, 2))])

for name, m in [('Empirical', EmpiricalCovariance()),
                ('LedoitWolf', LedoitWolf()),
                ('MinCovDet', MinCovDet(random_state=0))]:
    m.fit(X_cont)
    err = np.mean((m.covariance_ - true_cov) ** 2)
    print(name, '误差', round(err, 4))

env = EllipticEnvelope(contamination=0.1, random_state=0).fit(X_cont)
pred = env.predict(X_cont)
print('异常数', (pred == -1).sum())
md = env.mahalanobis(X_cont)
print('马氏距离最大的 3 个:', np.argsort(md)[-3:])
```

:::

### 第3题 进阶练习

在含离群点的数据上比较 `EllipticEnvelope`、`IsolationForest`、`LocalOutlierFactor` 三种方法的检测准确率（把混入的离群点作为真实标签）；在干净数据上训练 `OneClassSVM`，对混入离群点的新数据预测，比较其与在含离群点数据上直接拟合的差异。

::: details 参考答案

```python
import numpy as np
from sklearn.covariance import EllipticEnvelope
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.metrics import accuracy_score

rng = np.random.RandomState(0)
n_clean = 200
X_clean = rng.multivariate_normal([0, 0], [[1.0, 0.8], [0.8, 1.0]], size=n_clean)
X_out = rng.uniform(-5, 5, size=(22, 2))
X_cont = np.vstack([X_clean, X_out])
y_true = np.array([1] * n_clean + [-1] * len(X_out))

models = {'椭圆包络': EllipticEnvelope(contamination=0.1, random_state=0),
          '隔离森林': IsolationForest(contamination=0.1, random_state=0)}
for name, m in models.items():
    pred = m.fit_predict(X_cont)
    print(name, '准确率', round(accuracy_score(y_true, pred), 3))

lof = LocalOutlierFactor(contamination=0.1)
print('LOF 准确率', round(accuracy_score(y_true, lof.fit_predict(X_cont)), 3))

ocsvm = OneClassSVM(gamma='scale', nu=0.1).fit(X_clean)
print('OneClassSVM(novelty)', round(accuracy_score(y_true, ocsvm.predict(X_cont)), 3))
```

:::

## 常见错误

**错误 1 · 样本数小于特征数时直接用经验协方差报错**

现象：求逆时报 `LinAlgError`，矩阵奇异。

原因：$n<d$ 时经验协方差不满秩，无法求逆。

解决：改用 `LedoitWolf`、`OAS` 等收缩估计，或用 PCA 先降维。

**错误 2 · 数据含离群点却用 EmpiricalCovariance 估计**

现象：协方差矩阵明显被少数极端样本拖偏，下游马氏距离失真。

原因：经验协方差对离群点不稳健。

解决：改用 `MinCovDet` 或收缩估计。

**错误 3 · 混淆 `fit` 与 `fit_predict` 在 LOF 上的用法**

现象：LOF 上调用 `predict` 报错，提示 novelty 未开启。

原因：`LocalOutlierFactor` 默认做 outlier detection，用 `fit_predict`；只有设 `novelty=True` 才能用 `predict` 判新样本。

解决：训练时直接 `fit_predict`；要判新样本就设 `novelty=True` 并先 `fit`。

**错误 4 · 数据不满足高斯分布却用 EllipticEnvelope**

现象：检测结果把大量正常样本误判为异常。

原因：椭圆包络假设正常数据近似椭圆高斯分布。

解决：分布未知或严重非高斯时改用 `IsolationForest` 或 `LocalOutlierFactor`。
