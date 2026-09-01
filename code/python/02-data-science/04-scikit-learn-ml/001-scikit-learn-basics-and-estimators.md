---
title: 1.1 基础类与工具
sidebar:
  order: 1
---
# 1.1 基础类与工具

接触过 sklearn 的读者都会发现一个现象：无论用线性回归、支持向量机还是随机森林，代码骨架几乎完全相同，都是先创建模型对象，再调用 `fit` 训练，最后用 `predict` 或 `transform` 得到结果。这种整齐划一的体验来自一套统一的**估计器(estimator) API**。本节从 `sklearn.base` 出发，讲解估计器的基类、混入类、克隆机制、全局配置，以及贯穿全书 API 约定下的惯例。

## 1.1.1 估计器与统一 API

在 sklearn 中，几乎所有算法都实现为**估计器**：一个带有 `fit` 方法的 Python 类。`fit(X, y)` 读取特征矩阵 `X`（样本行、特征列的二维数组）与标签 `y`，在内部完成参数学习。数据形态不同的估计器通过 `fit` 的方式区分：监督学习传入 `(X, y)`，无监督学习只传 `X`。

```python
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression

X, y = load_iris(return_X_y=True)

model = LogisticRegression(max_iter=500)
model.fit(X, y)          # 训练，估计器内部保存学习到的参数
pred = model.predict(X)  # 对新样本（或训练样本）预测
print(pred[:5])
```

`fit` 之后的估计器可以用 `predict` 输出类别或数值。另一类估计器（如标准化、主成分分析）用 `transform` 把数据变换成新表示，它们通常还提供 `fit_transform`，一次调用完成拟合与变换。这套统一约定让交叉验证、网格搜索、管道等通用工具只需要面对一个接口，就能驱动所有算法。

## 1.1.2 BaseEstimator 基类

`sklearn.base.BaseEstimator` 是所有内置估计器的共同基类，它本身不实现任何算法，只提供两个贯穿全书的方法：`get_params()` 返回当前估计器的全部构造参数（超参数），`set_params()` 批量修改这些参数。

```python
from sklearn.linear_model import Ridge

model = Ridge(alpha=1.0, solver='auto')
print(model.get_params())
# {'alpha': 1.0, 'fit_intercept': True, ..., 'solver': 'auto'}

model.set_params(alpha=10.0)
print(model.get_params()['alpha'])   # 10.0
```

`get_params` 返回的参数全部来自 `__init__` 的形参，sklearn 要求子类在 `__init__` 中把每个超参数原样赋给同名属性，且不做任何运算。这条约定是 `clone`、网格搜索等工具能够自动读取参数的基础。自定义估计器只需继承 `BaseEstimator` 并实现 `fit`，即可免费获得 `get_params`、`set_params` 与对象展示功能。

## 1.1.3 混入类 Mixin

sklearn 用一组**混入类(Mixin)**为估计器补充约定俗成的便捷方法，它们按任务类型划分，如表所示。

| 混入类 | 适用任务 | 提供的便捷方法 |
|------|------|------|
| `ClassifierMixin` | 分类 | `score(X, y)` 返回准确率 |
| `RegressorMixin` | 回归 | `score(X, y)` 返回 R² 决定系数 |
| `ClusterMixin` | 聚类 | `fit_predict(X)` 一步完成拟合并返回簇标签 |
| `TransformerMixin` | 数据变换 | `fit_transform(X, y=None)` 一步完成拟合与变换 |
| `DensityMixin` | 密度估计 | `score(X, y=None)` 返回对数似然 |
| `BiclusterMixin` | 双聚类 | `get_indices`、`get_rows`、`get_columns` 等取行簇与列簇 |

```python
from sklearn.cluster import KMeans

km = KMeans(n_clusters=3, n_init=10)
labels = km.fit_predict([[0, 0], [1, 1], [9, 9]])  # ClusterMixin 提供
print(labels)
```

以 `ClassifierMixin.score` 为例，其内部实现就是计算准确率：`score = mean(y_true == predict(X))`。混入类把通用的评估逻辑提取出来，让每个分类器无需重复编写 `score`，只要实现了 `predict`，就自动获得完整的 `score` 行为。

## 1.1.4 clone() 构造估计器浅拷贝

`sklearn.base.clone` 构造一个估计器的**浅拷贝**：返回一个参数完全相同但尚未拟合的新对象。它用于复制模型的配置而不复制学习结果。

```python
from sklearn.base import clone
from sklearn.svm import SVC

model = SVC(C=1.0, kernel='rbf')
model.fit(X, y)

copy_model = clone(model)          # 参数相同，未拟合
print(copy_model.support_)         # AttributeError: 尚未拟合
```

clone 的实现原理：调用 `get_params()` 得到全部构造参数，再用这些参数新建一个对象。因为 `__init__` 只保存参数不执行计算，clone 不需要复制任何学习到的参数或数据，内存开销极小。网格搜索 `GridSearchCV` 内部正是用 clone 为每组参数组合生成独立的估计器，避免同一对象被反复 `fit` 污染。

## 1.1.5 全局配置 config_context

sklearn 提供一组全局配置，控制诸如 `assume_finite`（假设数据无 NaN 与 inf）、`working_memory`（分块计算内存上限）、`display`（对象展示方式）等行为。这些配置可通过 `get_config()` 查看、`set_config()` 修改，或用 `config_context()` 在上下文内临时生效。

```python
from sklearn import config_context, get_config, set_config

print(get_config()['assume_finite'])   # False

with config_context(assume_finite=True):
    print(get_config()['assume_finite'])   # True，退出上下文后恢复

print(get_config()['assume_finite'])   # False
```

`config_context` 是上下文管理器，进入 `with` 块时临时修改配置，退出时自动恢复原值，适合只在某段代码中开启有限性假设等选项，避免污染全局状态。`set_config` 直接修改全局配置，影响之后所有调用，需要手动恢复。

## 1.1.6 估计器的惯例与命名

sklearn 有一套严格的命名惯例，阅读源码与文档时会反复遇到。方法命名上，`fit` 训练、`predict` 预测、`transform` 变换、`score` 评估，组合方法有 `fit_predict` 与 `fit_transform`。学习到的属性一律以**下划线结尾**，如线性模型的 `coef_`、`intercept_`，SVM 的 `support_`、`support_vectors_`，分类器的 `classes_`。

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression().fit(X[:, :2], y)
print(model.coef_)       # 下划线结尾，表示由数据学习而来
print(model.intercept_)
```

访问下划线属性前必须先 `fit`，否则抛出 `NotFittedError`：

```python
from sklearn.exceptions import NotFittedError

model = LinearRegression()
try:
    print(model.coef_)
except NotFittedError as e:
    print('尚未拟合:', e)
```

超参数（用户指定的参数）不下划线结尾，学习到的参数（模型自己算出的）下划线结尾。这一区分让 sklearn 的 API 从第一眼就能看出哪些值是用户设置的、哪些是数据教给模型的。

## 练习题

### 第1题 概念理解

说明估计器统一 API 的含义；说明 `get_params` 与 `set_params` 的作用；说明下划线结尾属性代表什么；说明 `clone` 为什么内存开销小。

::: details 参考答案

估计器统一 API 指所有模型都实现 `fit` 训练、`predict`/`transform` 输出的接口。`get_params` 读取构造参数，`set_params` 修改参数。下划线结尾属性（如 `coef_`、`classes_`）是 `fit` 后由数据学习到的参数。`clone` 只依据 `get_params` 重新创建对象，不复制学习到的参数与数据，所以内存开销小。
:::

### 第2题 代码编写

导入鸢尾花数据，创建 `LogisticRegression` 并用 `get_params` 查看参数；用 `set_params` 修改 `C` 后重新训练；用 `clone` 复制一个未拟合模型并验证其没有 `coef_`。

::: details 参考答案

```python
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.base import clone

X, y = load_iris(return_X_y=True)

model = LogisticRegression(max_iter=500)
model.fit(X, y)
print(model.get_params()['C'])        # 1.0

model.set_params(C=0.5).fit(X, y)     # 修改后重新训练
print(model.coef_)

copy_model = clone(model)
try:
    print(copy_model.coef_)
except Exception as e:
    print('未拟合，无 coef_')
```

:::

### 第3题 进阶练习

自定义一个继承 `BaseEstimator` 的最小估计器（只需实现 `__init__` 与 `fit`），验证其自带 `get_params`；用 `config_context(assume_finite=True)` 临时修改配置并验证作用范围。

::: details 参考答案

```python
from sklearn.base import BaseEstimator
from sklearn import config_context, get_config

class MyModel(BaseEstimator):
    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, X, y=None):
        self.n_features_ = X.shape[1]
        return self

m = MyModel(alpha=2.0)
print(m.get_params())          # {'alpha': 2.0}
m.fit([[1, 2], [3, 4]])
print(m.n_features_)           # 2

print(get_config()['assume_finite'])
with config_context(assume_finite=True):
    print(get_config()['assume_finite'])   # True
print(get_config()['assume_finite'])       # False
```

:::

## 常见错误

**错误 1 · 未 fit 就访问 `coef_`、`classes_` 报 `NotFittedError`**

原因:下划线结尾属性是 `fit` 后才有的学习参数,未训练的对象不存在这些属性。

解决:先调用 `fit` 再访问;或用 `hasattr` 判断属性是否存在。

**错误 2 · 自定义估计器 `clone` 时报 `TypeError` 或参数丢失**

原因:sklearn 要求 `__init__` 把每个参数原样赋值且不改变参数类型,`clone` 依赖 `get_params` 重建对象。

解决:在 `__init__` 中直接写 `self.alpha = alpha`,不要在 `__init__` 里对参数做转换或衍生计算。

**错误 3 · `set_params` 传入不存在的参数报 `ValueError`**

原因:参数名必须与 `get_params` 返回的键一致。

解决:先打印 `model.get_params()` 核对参数名再修改。

**错误 4 · 忘记上下文恢复,全局配置被永久修改**

原因:`set_config` 直接修改全局状态,影响后续所有估计器。

解决:需要临时修改时用 `config_context` 上下文管理器,退出后自动恢复。

**错误 5 · 混入类方法不可用,例如聚类模型没有 `predict`**

原因:不同混入类提供的方法不同,`ClusterMixin` 只保证 `fit_predict`,不保证 `predict`。

解决:查阅具体估计器的文档,使用该类实际提供的方法(如 `fit_predict`)。
