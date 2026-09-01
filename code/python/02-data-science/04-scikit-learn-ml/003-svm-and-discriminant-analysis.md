---
title: 1.3 支持向量机与判别分析
sidebar:
  order: 3
---
# 1.3 支持向量机与判别分析

有些数据两类在直线上完全可分清，有些则混在一起。判别分析从概率分布出发寻找分类边界，支持向量机从几何间隔出发寻找最大间隔边界，两者视角不同却都擅长处理中等规模数据。本节先介绍判别分析，再系统讲解支持向量机的分类、回归与异常检测，最后说明核函数如何把低维线性不可分的问题搬到高维解决。

## 1.3.1 线性判别分析的思想

**线性判别分析(LDA)** 的核心思想是：找一个投影方向，让投影后不同类别的中心尽量分开、同类样本尽量聚拢。衡量这种效果的比值是：

$$
\max_w \frac{w^T \Sigma_b w}{w^T \Sigma_w w}
$$

其中 $w$ 是投影方向，$\Sigma_b$ 是**类间散布矩阵**（各类中心与全局中心的差异），$\Sigma_w$ 是**类内散布矩阵**（各类内部样本的分散程度）。这个式子表示：寻找一个方向，使类间差异相对类内差异最大。LDA 在分类的同时还能用于降维，把高维数据投影到少数几个判别方向。

## 1.3.2 LinearDiscriminantAnalysis

`LinearDiscriminantAnalysis` 基于高斯假设：各类数据服从协方差相同的多元高斯分布，由此导出线性决策边界。`n_components` 控制降维维数，`solver` 可选用 `svd`（默认，不依赖协方差求逆，数值稳定）、`lsqr`、`eigen`。

```python
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
lda = LinearDiscriminantAnalysis(n_components=2).fit(X, y)
print(lda.score(X, y))          # 分类准确率
print(lda.transform(X).shape)   # 降维后 (150, 2)
```

`transform` 输出判别投影后的坐标，`score` 输出分类准确率。LDA 在类别可分性强的数据上往往以极低成本拿到不错的效果，也常被用作有监督降维。

## 1.3.3 QuadraticDiscriminantAnalysis QDA

**二次判别分析(QDA)** 放宽 LDA 的假设，允许各类拥有不同的协方差矩阵。协方差不同使决策边界从直线变成**二次曲线**，表达能力更强，但需要估计的参数更多，小样本下容易过拟合。

```python
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis

qda = QuadraticDiscriminantAnalysis().fit(X, y)
print(qda.score(X, y))
```

选择建议：样本量充足且各类方差差异明显时用 QDA；样本量小或特征多时用 LDA 更稳。

## 1.3.4 核岭回归 KernelRidge

`sklearn.kernel_ridge` 中的 `KernelRidge` 把岭回归搬到核空间中，通过核函数隐式地把数据映射到高维特征空间，让线性回归能够拟合非线性关系，代价是计算量随样本数平方增长。它在中小规模非线性回归任务中效果出色，具体的对偶解形式与核函数细节在第 1.5 节展开。

```python
from sklearn.kernel_ridge import KernelRidge
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
kr = KernelRidge(kernel='rbf', alpha=1.0, gamma=0.5).fit(X, y)
print(kr.predict(X[:3]))
```

## 1.3.5 支持向量机与核技巧

**支持向量机(SVM)** 的出发点：在两类样本之间画一条间隔线，选择离所有样本都尽可能远的那条。**核技巧(kernel trick)** 的思路是：低维空间中线性不可分的数据，映射到足够高的维度后往往变得线性可分。核函数 $K(x, z)$ 直接给出两个样本在高维空间的内积，无需真正执行映射，计算成本因此大幅下降。

## 1.3.6 SVC 与软间隔

`SVC` 实现 **C-SVC** 支持向量分类。理想情况下要求所有样本都落在间隔之外，即 $y_i(w^Tx_i + b) \ge 1$；但真实数据总有噪声，于是引入**软间隔**，允许少量样本越界：

$$
\min_{w,b,\xi} \frac{1}{2}\|w\|^2 + C\sum_i \xi_i
$$

约束为 $y_i(w^Tx_i + b) \ge 1 - \xi_i$，其中 $\xi_i \ge 0$ 是松弛变量，衡量第 $i$ 个样本越界的程度，$C$ 是惩罚参数。$C$ 越大，对越界惩罚越重，边界越贴近训练数据，容易过拟合；$C$ 越小，容忍越界越多，边界越平滑。最大化间隔等价于最小化 $\frac{1}{2}\|w\|^2$，因此目标第一项控制间隔，第二项控制误差。SVM 的对偶问题只与样本间的内积（核函数）有关，这正是核技巧能够无缝嵌入的原因。

```python
from sklearn.svm import SVC

svc = SVC(kernel='rbf', C=1.0, gamma='scale').fit(X, y)
print(svc.score(X, y))
print(svc.support_vectors_.shape)   # 支持向量的数量
```

`support_vectors_` 是决定边界的关键样本（支持向量），其余样本对模型没有影响，这让 SVM 内存占用与支持向量数有关而非样本总数。

## 1.3.7 NuSVC

`NuSVC` 用参数 $\nu$ 替代 $C$，取值范围 0 到 1，$\nu$ 同时给出支持向量比例的下界与训练误差比例的上界，语义更直观：$\nu$ 小则模型更严格，$\nu$ 大则容忍更多误差。当需要显式控制支持向量比例时，`NuSVC` 更顺手。

```python
from sklearn.svm import NuSVC

nusvc = NuSVC(nu=0.3, kernel='rbf').fit(X, y)
print(nusvc.score(X, y))
```

## 1.3.8 LinearSVC 线性支持向量分类

`LinearSVC` 只支持线性核，但用线性求解器，训练速度远快于 `SVC(kernel='linear')`，可扩展到大规模稀疏数据。它支持 `penalty` 与 `loss` 参数，常用 `penalty='l2'`、`loss='squared_hinge'` 组合，用 `C` 控制正则强度。

```python
from sklearn.svm import LinearSVC

linsvc = LinearSVC(C=1.0).fit(X, y)
print(linsvc.score(X, y))
print(linsvc.coef_.shape)
```

## 1.3.9 支持向量回归 SVR

把 SVM 从分类搬到回归，就得到 **SVR**。分类找间隔，回归找一条**ε-管道**：让尽可能多的样本落在以预测线为中心、宽度为 $\epsilon$ 的带内，只有带外的样本才计入损失：

$$
|\xi|_\epsilon = \begin{cases} 0, & |\xi| \le \epsilon \\ |\xi| - \epsilon, & |\xi| > \epsilon \end{cases}
$$

其中 $\xi = y_i - \hat{y}_i$ 是预测残差。这个**ε-不敏感损失**意味着误差小于 $\epsilon$ 时完全不惩罚，大于 $\epsilon$ 的部分才线性惩罚，因此模型只受边界带外样本（支持向量）影响，对带内噪声不敏感。

```python
from sklearn.svm import SVR, NuSVR, LinearSVR

X1 = [[i] for i in range(20)]
y1 = [i ** 0.5 + 0.1 * ((i * 7) % 3) for i in range(20)]

svr = SVR(kernel='rbf', C=1.0, epsilon=0.1).fit(X1, y1)
print(svr.predict([[5.0]]))

nusvr = NuSVR(nu=0.5, C=1.0).fit(X1, y1)
print(nusvr.predict([[5.0]]))

linsvr = LinearSVR(C=1.0).fit(X1, y1)
print(linsvr.predict([[5.0]]))
```

`SVR` 支持任意核，`NuSVR` 用 $\nu$ 控制支持向量比例，`LinearSVR` 只支持线性核但训练快，适合大规模线性回归。

## 1.3.10 OneClassSVM 单类支持向量机

**OneClassSVM** 用于异常检测：把原点当作反例，学一个边界把大部分正常样本圈在里面，新样本落在边界外即视为异常。它通过参数 `nu` 控制正常样本中被判为异常的上界比例，`kernel` 与 `gamma` 决定边界的形状。

```python
from sklearn.svm import OneClassSVM
import numpy as np

normal = np.random.normal(0, 1, (100, 2))
model = OneClassSVM(kernel='rbf', nu=0.1).fit(normal)
test = np.array([[0.0, 0.0], [8.0, 8.0]])
print(model.predict(test))   # [ 1 -1]
```

预测返回 1 表示正常、-1 表示异常。与 `SGDOneClassSVM` 相比，基于核的版本能刻画更复杂的正常区域，但样本量大时训练开销高。

## 1.3.11 核函数

核函数 $K(x, z)$ 计算两个样本在高维空间的内积，不同核对应不同的映射方式。sklearn 常用核如下表。

| 核名称 | 公式 | 特点 |
|------|------|------|
| 线性核 | $K(x,z) = x^Tz$ | 等价于普通线性模型，计算最快 |
| 多项式核 | $K(x,z) = (\gamma x^Tz + r)^d$ | 通过度数 $d$ 控制复杂度 |
| RBF 核 | $K(x,z) = \exp(-\gamma\|x-z\|^2)$ | 最常用，映射到无穷维，需调 $\gamma$ |
| Sigmoid 核 | $K(x,z) = \tanh(\gamma x^Tz + r)$ | 类似神经网络的激活 |
| 自定义核 | callable 或 Gram 矩阵 | 根据领域知识定制 |

```python
from sklearn.svm import SVC
import numpy as np

# 自定义核：用一个函数接收 (X, Y) 返回核矩阵
def my_kernel(X, Y):
    return np.dot(X, Y.T)

X, y = load_iris(return_X_y=True)
svc_custom = SVC(kernel=my_kernel).fit(X[:30], y[:30])
print(svc_custom.score(X[:30], y[:30]))
```

`kernel` 参数可以是字符串，也可以是可调用对象（输入两个矩阵，输出核矩阵），还可以传入预计算的 **Gram 矩阵**（样本间的内积矩阵）。RBF 核的 $\gamma$ 控制单个样本的影响范围，$\gamma$ 小则边界平滑，$\gamma$ 大则边界紧贴样本、容易过拟合，通常用 `GridSearchCV` 与 $C$ 一起调优。

## 练习题

### 第1题 概念理解

说明 LDA 最大化哪个比值及其含义；说明 SVM 软间隔中 `C` 的作用；说明 ε-不敏感损失的取值规则；说明核技巧为什么能降低高维计算成本。

::: details 参考答案

LDA 最大化 $\frac{w^T\Sigma_b w}{w^T\Sigma_w w}$，让类间差异相对类内差异最大。软间隔中 `C` 惩罚越界样本，`C` 大则边界贴近数据、易过拟合，`C` 小则边界平滑。ε-不敏感损失中残差小于 ε 不计损失，大于 ε 才按超出部分惩罚。核函数直接给出高维内积，避免显式映射与高维计算。
:::

### 第2题 代码编写

用鸢尾花数据训练 `SVC(kernel='rbf')`，查看 `support_` 与 `support_vectors_`；用 `SVR` 拟合正弦函数数据并计算预测误差；用 `OneClassSVM` 检测人为加入的异常点。

::: details 参考答案

```python
from sklearn.datasets import load_iris
from sklearn.svm import SVC, SVR, OneClassSVM
import numpy as np

X, y = load_iris(return_X_y=True)
svc = SVC(kernel='rbf').fit(X, y)
print(svc.support_)
print(svc.support_vectors_.shape)

x = np.linspace(0, 6, 60).reshape(-1, 1)
y_sin = np.sin(x).ravel()
svr = SVR(kernel='rbf', C=10, epsilon=0.1).fit(x, y_sin)
print(np.mean((svr.predict(x) - y_sin) ** 2))

normal = np.random.normal(0, 1, (200, 2))
oc = OneClassSVM(nu=0.05).fit(normal)
out = np.array([[0.1, 0.1], [20.0, 20.0]])
print(oc.predict(out))
```

:::

### 第3题 进阶练习

对比 `SVC(kernel='linear')` 与 `LinearSVC` 在相同数据上的训练时间与准确率；用 `GridSearchCV` 搜索 `C` 与 `gamma`；用预计算 Gram 矩阵训练 `SVC(kernel='precomputed')`。

::: details 参考答案

```python
import time
from sklearn.svm import SVC, LinearSVC
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.datasets import make_classification
import numpy as np

X, y = make_classification(n_samples=300, n_features=8, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

t0 = time.time()
svc = SVC(kernel='linear').fit(Xtr, ytr)
t1 = time.time()
lsvc = LinearSVC().fit(Xtr, ytr)
t2 = time.time()
print(svc.score(Xte, yte), round(t1 - t0, 4))
print(lsvc.score(Xte, yte), round(t2 - t1, 4))

gs = GridSearchCV(SVC(kernel='rbf'), {'C': [0.1, 1, 10], 'gamma': [0.01, 0.1, 1]}, cv=3)
gs.fit(Xtr, ytr)
print(gs.best_params_)

gram = np.dot(Xtr, Xtr.T)
svc_gram = SVC(kernel='precomputed').fit(gram, ytr)
print(svc_gram.predict(np.dot(Xte, Xtr.T))[:5])
```

:::

## 常见错误

**错误 1 · SVC 在小数据上效果差或预测单一类别**

原因:`gamma` 或 `C` 设置不当，边界过紧或过松；数据未标准化时 RBF 核的尺度判断失真。

解决:先标准化特征，再用 `GridSearchCV` 调 `C` 与 `gamma`。

**错误 2 · 用 `SVC(kernel='linear')` 训练超大规模数据非常慢**

原因:基于对偶的 SVC 复杂度随样本数平方增长。

解决:改用 `LinearSVC`，或对稀疏数据用 `SGDClassifier(loss='hinge')`。

**错误 3 · OneClassSVM 把大量正常样本判为异常**

原因:`nu` 设置过大，或 `gamma` 不合适。

解决:调小 `nu`，用交叉验证观察正常样本上的误报率，调整 `gamma`。

**错误 4 · `SVC` 与 `LinearSVC` 的 `C` 语义混淆导致结果意外**

原因:两者对正则的解释方向相反，`LinearSVC` 中调大 `C` 通常使模型更复杂。

解决:使用前确认对应文档，同一套数据上对比时单独调参。

**错误 5 · 预计算 Gram 矩阵维度不匹配报 `ValueError`**

原因:`kernel='precomputed'` 要求训练矩阵是 $(n_{train}, n_{train})$，预测矩阵是 $(n_{test}, n_{train})$。

解决:核对矩阵维度，预测时用测试样本与训练样本的内积。
