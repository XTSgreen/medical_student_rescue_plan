---
title: 1.21 模型检查、实用工具与配置
sidebar:
  order: 21
---
# 1.21 模型检查、实用工具与配置

模型训练完，我们还想知道它为什么这样预测、哪个特征更重要、边界长什么样。`sklearn.inspection` 提供置换重要性、部分依赖图、决策边界等模型检查工具；`sklearn.utils` 提供数据校验、并行、测试等底层实用工具；`sklearn.computing` 与全局配置则解决大数据量下的性能与行为控制。本节把这些散落的工具串起来。

## 1.21.1 置换重要性 permutation_importance

特征重要性的一种稳健估计。思路：把某个特征的取值**随机打乱**，破坏它与目标的关联，再评估性能。打乱后性能下降越多，说明该特征越重要。它不依赖模型内部结构，适用于任何估计器：

$$
\text{importance}_j = \text{score}_{\text{原数据}} - \text{score}_{\text{打乱特征 } j \text{ 后}}
$$

分数下降越多，重要性越高。下降为 0 或负数，说明该特征打乱后性能没变差，重要度低：

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

X, y = load_iris(return_X_y=True)
model = RandomForestClassifier(random_state=0).fit(X, y)

result = permutation_importance(model, X, y, n_repeats=10, random_state=0)
print(result.importances_mean)   # 每个特征的平均重要性
print(result.importances_std)    # 重复打乱的标准差
```

`n_repeats` 是每个特征重复打乱的次数，多次取平均更稳定。`permutation_importance` 对每一折或整个数据分别计算，也支持传入 `scoring` 指定评估指标。

## 1.21.2 部分依赖图 PartialDependenceDisplay

部分依赖图展示**某个（或两个）特征变化时，模型预测的平均变化**，回答「把面积从 50 增到 100，预测房价平均涨多少」。它把其他特征固定（取平均值或边缘化），只让目标特征变化：

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import PartialDependenceDisplay

# 用较小数据集演示
rng = np.random.RandomState(0)
X = rng.rand(300, 4)
y = 2 * X[:, 0] - 3 * X[:, 1] ** 2 + rng.randn(300) * 0.1
model = RandomForestRegressor(random_state=0).fit(X, y)

display = PartialDependenceDisplay.from_estimator(
    model, X, features=[0, 1], grid_resolution=20)
plt.show()
```

`from_estimator` 的 `features` 指定要考察的特征索引或名称，`grid_resolution` 控制网格细度。部分依赖图可以帮助发现非线性关系，也是检查模型行为是否符合领域知识的手段。

## 1.21.3 决策边界 DecisionBoundaryDisplay

决策边界可视化把一个平面上的网格样本喂给模型，预测类别后用等高线绘制分界。它适合二维数据，直观展示模型的分界形状：

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons
from sklearn.svm import SVC
from sklearn.inspection import DecisionBoundaryDisplay

X, y = make_moons(n_samples=200, noise=0.1, random_state=0)
model = SVC().fit(X, y)

DecisionBoundaryDisplay.from_estimator(
    model, X, response_method='predict',
    cmap='coolwarm', alpha=0.6)
plt.scatter(X[:, 0], X[:, 1], c=y, edgecolors='k')
plt.show()
```

`response_method` 可选 `'predict'`（类别区域）或 `'predict_proba'`（概率色块）。对比不同模型的决策边界，能直观看出线性与非线性模型的差别，也常用于诊断过拟合（边界过于曲折）。

## 1.21.4 sklearn.utils 实用工具

### 数据校验

`check_array` 校验输入是否为合法的二维数组并转换成 NumPy；`check_X_y` 同时校验特征与标签；`check_consistent_length` 校验多个输入长度一致：

```python
from sklearn.utils import check_array, check_X_y, check_consistent_length
import numpy as np

X = [[1, 2], [3, 4], [5, 6]]
X_arr = check_array(X)                       # 转成 NumPy 数组并校验
print(type(X_arr))

X_ok, y_ok = check_X_y(X, [0, 1, 0])         # 同时校验 X 与 y
print(X_ok.shape, y_ok.shape)

check_consistent_length(X, [0, 1, 0])        # 长度不一致会抛异常
```

这些函数在编写自定义估计器时用于保证输入合法，传入非法数据会给出明确的报错信息。

### 随机数种子

`check_random_state` 把任意形式的种子统一成 `numpy.random.RandomState` 实例，保证随机过程可复现：

```python
from sklearn.utils import check_random_state

rng = check_random_state(0)          # 整数 -> RandomState(0)
rng2 = check_random_state(rng)       # RandomState 原样返回
print(rng.uniform(size=3))
```

### 标签与目标检查

`multiclass` 判断分类问题的类型（二分类、多分类、多标签），`type_of_target` 判断目标变量类型，`unique_labels` 返回去重后的类别标签：

```python
from sklearn.utils import multiclass, type_of_target, unique_labels

print(type_of_target([0, 1, 0, 1]))        # 'binary'
print(type_of_target([0, 1, 2, 1]))        # 'multiclass'
print(unique_labels([0, 1], [1, 2]))       # [0 1 2]
```

`unique_labels` 可以传入多组标签自动合并去重，常用于多模型对比时统一标签顺序。

### 并行工具

`parallel_backend` 上下文管理器控制并行后端，`effective_n_jobs` 计算实际生效的并行核数：

```python
from sklearn.utils import parallel_backend, effective_n_jobs

print(effective_n_jobs(-1))   # -1 表示用所有核,这里返回实际核数
with parallel_backend('threading', n_jobs=2):
    pass   # 在此上下文内的并行操作使用指定后端
```

`n_jobs=-1` 使用全部 CPU 核，`n_jobs=2` 使用 2 个核。大网格搜索或大模型训练时合理设置能显著提速。

### 校验与转换工具

`assert_all_finite` 检查数组是否含 NaN 或无穷，`as_float_array` 把输入转成 float 类型数组：

```python
from sklearn.utils import assert_all_finite, as_float_array
import numpy as np

a = np.array([[1.0, 2.0]])
print(as_float_array(a).dtype)   # float64

# assert_all_finite(np.array([1.0, np.nan]))   # 含 NaN 会抛异常
```

### 其他工具

`safe_mask` 对稀疏矩阵安全的布尔索引掩码，`indexable` 把输入统一转成可索引结构（数组或稀疏矩阵）：

```python
from sklearn.utils import safe_mask, indexable

X = np.arange(12).reshape(4, 3)
mask = safe_mask(X, [True, False, True, False])   # 稀疏矩阵也安全
print(X[mask])

X_i, y_i = indexable(X, [0, 1, 0, 1])   # 统一成可索引形式
print(X_i.shape)
```

### Memory 内存缓存

`sklearn.utils.Memory` 基于 joblib 提供函数级缓存：把耗时的转换结果缓存到磁盘目录，第二次调用参数相同时直接读缓存，跳过计算：

```python
from sklearn.utils import Memory

mem = Memory(location='./cachedir', verbose=0)

@mem.cache
def heavy_compute(X):
    return X @ X.T   # 模拟耗时计算

X = np.random.randn(100, 50)
result1 = heavy_compute(X)   # 第一次真正计算
result2 = heavy_compute(X)   # 第二次命中缓存
```

`location` 指定缓存目录，`Memory` 常用于缓存数据预处理与特征提取等重复执行的重活。

### 元数据路由

新版本引入元数据路由，`MetadataRouter` 与 `MetadataRequest` 用于声明估计器如何传递 `sample_weight` 等元数据，例如让 `fit` 的样本权重自动传给管道内的各步：

```python
from sklearn.utils.metadata_routing import MetadataRequest, MetadataRouter
```

一般用户不需要手动配置，默认路由由 `enable_metadata_routing` 配置项控制。只有开发自定义复合估计器、需要透传样本权重时才需要深入了解。

## 1.21.5 sklearn.computing 计算与性能

大数据场景下，scikit-learn 提供几类应对手段。

### 并行计算 n_jobs

大部分估计器与交叉验证都支持 `n_jobs` 参数，设置 `n_jobs=-1` 用满所有核：

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

model = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=0)
scores = cross_val_score(model, X, y, cv=5, n_jobs=-1)   # 各折并行
```

`n_jobs=-1` 用全部核心，也支持正整数指定核数。随机森林、梯度提升等可并行训练的模型收益明显。

### 稀疏矩阵支持

大量估计器支持 SciPy 稀疏矩阵输入，配合 `scipy.sparse` 可处理高维稀疏数据（如词频矩阵）。文本处理的 CountVectorizer/TfidfVectorizer 默认就产出稀疏矩阵：

```python
import scipy.sparse as sp

X_sp = sp.csr_matrix(X)   # 转为 CSR 稀疏格式
```

注意部分预处理步骤（如带 `with_mean=True` 的 StandardScaler）会破坏稀疏性，稀疏场景下要选择不稠密化的转换器（见 1.16 章）。

### 增量学习 partial_fit

数据太大装不进内存，或数据在线不断到来时，用 `partial_fit` 分块增量训练。部分估计器（SGDClassifier、SGDRegressor、MultinomialNB、增量式 PCA 等）支持：

```python
from sklearn.linear_model import SGDClassifier
import numpy as np

clf = SGDClassifier(random_state=0)

for chunk in range(5):                 # 模拟 5 个数据块
    X_b = np.random.randn(100, 4)      # 每块 100 个样本
    y_b = (X_b[:, 0] + X_b[:, 1] > 0).astype(int)
    clf.partial_fit(X_b, y_b, classes=[0, 1])   # 增量更新,首块需传 classes

print(clf.score(np.random.randn(200, 4),
                (np.random.randn(200, 4)[:, 0] > 0).astype(int)))
```

`partial_fit` 每次用一批样本更新模型参数，第一批必须传 `classes` 告知全部类别。它让模型可以在**在线学习**（数据实时到达）和**大样本**场景下工作。

### 外核学习 out-of-core

外核学习把数据分块从磁盘读取，逐块 `partial_fit`，配合流式读取实现「内存只装一小块，模型看到全部数据」：

```python
import numpy as np
from sklearn.linear_model import SGDRegressor

reg = SGDRegressor(random_state=0)

for start in range(0, 10000, 1000):        # 每块 1000 行
    X_b = np.random.randn(1000, 5)
    y_b = X_b[:, 0] * 2 + np.random.randn(1000) * 0.1
    reg.partial_fit(X_b, y_b)              # 逐块更新

print(reg.coef_[:3])
```

这是处理「数据总量远超内存」的经典方案：用生成器逐块读取文件（如 `pd.read_csv(..., chunksize=1000)`），每块喂给 `partial_fit`。

## 1.21.6 配置与全局设置

全局配置控制 scikit-learn 的运行时行为，常用三项：`print_changed_only`（打印估计器时是否只显示改动的参数）、`display`（HTML 显示）、`assume_finite`（是否跳过有限性检查以提速）。

`config_context()` 作为上下文管理器临时修改配置，退出后自动还原；`get_config()` 查看当前配置，`set_config()` 全局设置：

```python
from sklearn import config_context, get_config, set_config

print(get_config())                      # 查看当前配置字典

with config_context(print_changed_only=False):
    # 上下文内临时生效,退出后还原
    pass

set_config(print_changed_only=True)      # 全局修改
```

`show_versions()` 打印 scikit-learn、NumPy、SciPy、joblib 等依赖的版本号，排查版本兼容问题时很有用：

```python
import sklearn
sklearn.show_versions()
```

## 练习题

### 第1题 概念理解

说明置换重要性的原理；说明部分依赖图回答什么问题；说明 `partial_fit` 与 `fit` 的区别及适用场景。

::: details 参考答案

置换重要性把某特征打乱后看性能下降多少，下降越多特征越重要。部分依赖图展示单个特征变化时预测的平均变化，用于理解特征与预测的关系。`partial_fit` 用一批样本增量更新模型，适合在线学习与大样本外核学习，首块需传 `classes`；`fit` 用全部数据一次性训练。
:::

### 第2题 代码编写

训练随机森林并计算 `permutation_importance`，打印每个特征的平均重要性；用 `make_moons` 数据绘制 SVC 的决策边界。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris, make_moons
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.inspection import permutation_importance, DecisionBoundaryDisplay

X, y = load_iris(return_X_y=True)
model = RandomForestClassifier(random_state=0).fit(X, y)
result = permutation_importance(model, X, y, n_repeats=10, random_state=0)
print(result.importances_mean)

Xm, ym = make_moons(n_samples=200, noise=0.1, random_state=0)
svc = SVC().fit(Xm, ym)
DecisionBoundaryDisplay.from_estimator(svc, Xm, response_method='predict',
                                       cmap='coolwarm', alpha=0.6)
plt.scatter(Xm[:, 0], Xm[:, 1], c=ym, edgecolors='k')
plt.show()
```

:::

### 第3题 进阶练习

用 `partial_fit` 对 SGDClassifier 分 5 块增量训练并评估；用 `check_X_y` 与 `type_of_target` 校验一组输入；用 `show_versions()` 查看版本信息。

::: details 参考答案

```python
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.utils import check_X_y, type_of_target

clf = SGDClassifier(random_state=0)
rng = np.random.RandomState(0)
for i in range(5):
    X_b = rng.randn(100, 4)
    y_b = (X_b[:, 0] > 0).astype(int)
    clf.partial_fit(X_b, y_b, classes=[0, 1])

X_t, y_t = check_X_y(rng.randn(200, 4), (rng.randn(200, 4)[:, 0] > 0).astype(int))
print(type_of_target(y_t))
print(clf.score(X_t, y_t))

import sklearn
sklearn.show_versions()
```

:::

## 常见错误

**错误 1 · `permutation_importance` 对含 NaN 的数据直接报错**

原因:打乱后仍需要完整的数值,NaN 会破坏计算。

解决:先填补缺失值再做置换重要性。

**错误 2 · `partial_fit` 首块没传 `classes` 报错**

原因:增量训练第一次不知道有哪些类别。

解决:第一次调用传 `classes=[...]` 列出全部类别,之后可不传。

**错误 3 · 稀疏矩阵经过会稠密化的转换后内存暴涨**

原因:部分转换器（如 StandardScaler 的 `with_mean=True`）把稀疏矩阵转成稠密。

解决:稀疏场景用 `with_mean=False`、MaxAbsScaler 等保持稀疏性的转换器。

**错误 4 · `show_versions()` 想在子进程或受限环境跑**

原因:它只打印信息,不依赖网络,但要求 import 成功。

解决:直接运行即可,若缺少依赖则先安装。

**错误 5 · 元数据路由相关报错但没开启配置**

原因:新版本默认关闭元数据路由,自定义估计器透传 `sample_weight` 等会提示。

解决:用 `set_config(enable_metadata_routing=True)` 开启,或简化传参方式。

**错误 6 · `Memory` 缓存目录被删除或不可写导致缓存失效**

原因:缓存依赖 `location` 目录的读写权限。

解决:确认目录存在且可写;更换 `location` 到有权限的路径即可重新缓存。
