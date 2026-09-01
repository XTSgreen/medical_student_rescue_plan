---
title: 1.18 模型选择与交叉验证
sidebar:
  order: 18
---
# 1.18 模型选择与交叉验证

训练好一个模型之后，一个基本问题是：它在没见过的数据上表现如何？如果把全部数据都用来训练，再拿同一批数据评估，分数必然虚高，因为模型已经见过这些样本。交叉验证把数据分成多份，轮流用其中几份训练、剩下一份验证，让每个样本都被验证过一次，得到更诚实的性能估计。`sklearn.model_selection` 提供数据划分、交叉验证、超参数调优、学习曲线与模型持久化等一整套工具。

## 1.18.1 数据集划分 train_test_split

最常用的做法是把数据划分为训练集与测试集。`train_test_split` 按比例随机切分：

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=0)
print(X_train.shape, X_test.shape)   # (105, 4) (45, 4)

model = LogisticRegression(max_iter=200)
model.fit(X_train, y_train)
print(model.score(X_test, y_test))
```

参数说明：`test_size` 是测试集比例（0 到 1 之间）或绝对数量，默认 0.25；`random_state` 固定随机种子，保证结果可复现；`stratify=y` 做分层抽样，让训练集与测试集的类别比例与整体一致，类别不平衡时尤其重要：

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=0, stratify=y)
```

### StratifiedShuffleSplit 分层抽样

`StratifiedShuffleSplit` 是分层抽样的通用版本，可多次重复划分，每次保证训练集与测试集的类别比例与整体一致：

```python
from sklearn.model_selection import StratifiedShuffleSplit

sss = StratifiedShuffleSplit(n_splits=3, test_size=0.3, random_state=0)
for train_idx, test_idx in sss.split(X, y):
    print(train_idx.shape, test_idx.shape)
```

`n_splits` 指定划分次数，每次得到一组不同的训练/测试索引。`split(X, y)` 返回索引对的生成器，索引用于取数据：`X[train_idx]`。

## 1.18.2 交叉验证分割器

交叉验证把数据分成 K 份，轮流取 1 份当验证集、其余 K-1 份当训练集，共训练 K 次。`sklearn.model_selection` 提供多种分割器，它们都是迭代器：`split(X, y)` 每次产出训练索引与测试索引。

### KFold 与 StratifiedKFold

```python
from sklearn.model_selection import KFold, StratifiedKFold

kf = KFold(n_splits=5, shuffle=True, random_state=0)
for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
    print(f"折 {fold}: 训练 {len(train_idx)}, 验证 {len(val_idx)}")

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
for train_idx, val_idx in skf.split(X, y):
    pass   # 分层版本,每折类别比例一致
```

`n_splits` 是折数，`shuffle=True` 先打乱再划分，`random_state` 固定打乱顺序。`StratifiedKFold` 在每折中保持类别比例，分类任务优先使用。

### GroupKFold 分组交叉验证

当样本存在分组结构（同一病人的多次就诊、同一学生的多次测试）时，同一组的所有样本必须同进同出，否则会造成数据泄漏。`GroupKFold` 保证同一组的样本不会同时出现在训练集和验证集：

```python
from sklearn.model_selection import GroupKFold

# 假设 12 个样本分属 4 个组
X_g = [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11]]
y_g = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]
groups = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4]

gkf = GroupKFold(n_splits=3)
for train_idx, val_idx in gkf.split(X_g, y_g, groups):
    print(train_idx, val_idx)
```

`split(X, y, groups)` 多传一个 `groups` 参数，同一组的样本整体划分。

### RepeatedKFold 重复 K 折

`RepeatedKFold` 把 K 折交叉验证重复多次，每次用不同随机种子，得到更稳健的性能估计：

```python
from sklearn.model_selection import RepeatedKFold

rkf = RepeatedKFold(n_splits=5, n_repeats=3, random_state=0)
for train_idx, val_idx in rkf.split(X):
    pass   # 共 5*3=15 组划分
```

`n_repeats` 是重复次数。相应地也有 `RepeatedStratifiedKFold` 的分层版本。

### LeaveOneOut 与 LeavePOut 留出法

`LeaveOneOut`（留一法）每次只留 1 个样本当验证集，其余全部训练，样本数 N 就训练 N 次，几乎用完所有数据但计算量巨大：

```python
from sklearn.model_selection import LeaveOneOut

loo = LeaveOneOut()
print(loo.get_n_splits(X))   # 150,每个样本验证一次
```

`LeavePOut` 是留 P 个样本，划分次数为组合数 $C_N^P$，增长极快。两者只在样本量很小时使用。

### LeaveOneGroupOut 与 LeavePGroupsOut

按组做留出：`LeaveOneGroupOut` 每次留一组当验证集；`LeavePGroupsOut` 每次留 P 组：

```python
from sklearn.model_selection import LeaveOneGroupOut

logo = LeaveOneGroupOut()
for train_idx, val_idx in logo.split(X_g, y_g, groups):
    pass   # 每组轮流当验证集
```

### ShuffleSplit 与 StratifiedShuffleSplit

`ShuffleSplit` 每次独立随机打乱并切分，允许训练集与验证集有交集，适合对划分比例不敏感的场景。`StratifiedShuffleSplit` 是它的分层版本（见 1.18.1）。`GroupShuffleSplit` 则在分组约束下随机切分：

```python
from sklearn.model_selection import ShuffleSplit, GroupShuffleSplit

ss = ShuffleSplit(n_splits=5, test_size=0.3, random_state=0)
gss = GroupShuffleSplit(n_splits=3, test_size=0.3, random_state=0)
```

### TimeSeriesSplit 时间序列切分

时间序列数据不能随机打乱，否则未来数据泄漏到过去。`TimeSeriesSplit` 采用**前向扩张**策略：训练集始终是时间靠前的数据，验证集是紧接着的一段时间，并且训练窗口随折数逐步扩大：

```python
import numpy as np
from sklearn.model_selection import TimeSeriesSplit

X_ts = np.arange(24).reshape(12, 2)
tscv = TimeSeriesSplit(n_splits=3)
for i, (train_idx, val_idx) in enumerate(tscv.split(X_ts)):
    print(f"折 {i}: 训练 {train_idx}, 验证 {val_idx}")
```

输出示例（每次训练集都包含之前所有数据）：

```
折 0: 训练 [0 1 2 3 4 5], 验证 [6 7]
折 1: 训练 [0 1 2 3 4 5 6 7], 验证 [8 9]
折 2: 训练 [0 1 2 3 4 5 6 7 8 9], 验证 [10 11]
```

### PredefinedSplit 预定义划分

已经预先确定好哪些样本进训练集、哪些进验证集时（例如已划分的测试集），用 `PredefinedSplit` 手动指定。`test_fold` 中 0 表示训练，-1 表示不使用，非负整数表示验证集编号：

```python
from sklearn.model_selection import PredefinedSplit

test_fold = [0, 0, 0, 1, 1, 1]   # 前 3 个训练,后 3 个验证
ps = PredefinedSplit(test_fold)
for train_idx, val_idx in ps.split():
    print(train_idx, val_idx)
```

## 1.18.3 交叉验证函数

分割器只提供索引，真正的训练与评估由交叉验证函数完成。

### cross_val_score

`cross_val_score` 对每个折训练并评分，返回一组成绩：

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(scores)                          # 5 个折的成绩数组
print(scores.mean(), scores.std())     # 均值与标准差
```

`cv` 可以是整数（默认 KFold/StratifiedKFold）或分割器实例；`scoring` 指定评分指标，默认分类用准确率、回归用 $R^2$。常用取值有 `'accuracy'`、`'precision'`、`'recall'`、`'f1'`、`'neg_mean_squared_error'`、`'r2'` 等。回归类指标默认带 `neg_` 前缀（越大越好），因为交叉验证框架统一按最大化处理。

### cross_validate 多指标

`cross_validate` 是增强版，可同时计算多个指标，并可返回训练集成绩：

```python
from sklearn.model_selection import cross_validate

cv_results = cross_validate(
    model, X, y, cv=5,
    scoring=['accuracy', 'f1_macro'],
    return_train_score=True)
print(cv_results.keys())          # fit_time, test_accuracy, test_f1_macro 等
print(cv_results['test_accuracy'])
```

`scoring` 传列表可同时评估多个指标；`return_train_score=True` 同时返回每个折的训练集成绩，用于对比训练与验证差距（过拟合诊断）。

### cross_val_predict 交叉验证预测

`cross_val_predict` 返回每个样本的**交叉验证预测**，即每个样本在「它所在折训练出的模型」上的预测值。它常用于生成训练集的预测结果做后续分析（如堆叠）：

```python
from sklearn.model_selection import cross_val_predict

y_pred = cross_val_predict(model, X, y, cv=5)
print(y_pred.shape)    # (150,),与 y 同形状
```

注意这些预测来自不同折的模型，不能当作一个统一模型的输出使用。

## 1.18.4 超参数调优

超参数是模型在训练前设定的参数（如决策树深度、正则化强度），调优就是搜索好的超参数组合。

### GridSearchCV 网格搜索

`GridSearchCV` 枚举参数网格中的每种组合，逐一交叉验证，选出最优组合：

```python
from sklearn.model_selection import GridSearchCV
from sklearn.svm import SVC

param_grid = {'C': [0.1, 1, 10], 'kernel': ['linear', 'rbf']}
grid = GridSearchCV(SVC(), param_grid, cv=5, scoring='accuracy')
grid.fit(X, y)

print(grid.best_params_)       # {'C': 1, 'kernel': 'rbf'},最优参数
print(grid.best_score_)        # 最优参数下的交叉验证平均分
print(grid.best_estimator_)    # 用最优参数重训的完整估计器
print(grid.cv_results_)        # 所有组合的详细结果字典
```

参数说明：`param_grid` 是参数名到候选值列表的字典；`cv` 是交叉验证折数；`scoring` 是评分指标；`refit=True`（默认）在找到最优参数后，用全部数据重新训练一个模型，之后 `grid.predict(X)` 直接可用。

`best_params_`、`best_score_`、`best_estimator_`、`cv_results_` 是拟合后产生的关键属性：`cv_results_` 里包含每个参数组合的每折成绩与均值（`mean_test_score`、`std_test_score` 等），可用 Pandas DataFrame 查看：

```python
import pandas as pd
results = pd.DataFrame(grid.cv_results_)
print(results[['params', 'mean_test_score']])
```

### RandomizedSearchCV 随机搜索

参数空间很大时，网格搜索组合数爆炸。`RandomizedSearchCV` 从参数分布中随机采样固定次数，用更少的尝试覆盖更大空间：

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import uniform, randint

param_dist = {'C': uniform(0.1, 10), 'gamma': uniform(0.01, 1)}
rsearch = RandomizedSearchCV(SVC(), param_dist,
                             n_iter=30, cv=5, random_state=0)
rsearch.fit(X, y)
print(rsearch.best_params_)
```

`param_dist` 可传 `scipy.stats` 分布（`uniform`、`randint` 等）做连续/离散随机采样，`n_iter` 是采样组合数。

### HalvingGridSearchCV 与 HalvingRandomSearchCV 逐次减半

网格搜索对每个候选都跑满 K 折，开销大。逐次减半搜索先用**少量样本**快速淘汰表现差的候选，再逐步增加样本量，每轮只保留表现最好的一半（1/ factor）候选继续：

```python
from sklearn.model_selection import HalvingGridSearchCV

hgrid = HalvingGridSearchCV(SVC(), param_grid, factor=2, cv=5)
hgrid.fit(X, y)
print(hgrid.best_params_)
```

`factor` 是每轮保留比例的分母（factor=2 表示每轮淘汰一半候选），`HalvingRandomSearchCV` 对应随机采样版本。小数据集上可能收益不明显，大数据集上能显著省时。

### ParameterGrid 与 ParameterSampler

这两个类分别以可迭代方式产出参数组合，便于手动循环：

```python
from sklearn.model_selection import ParameterGrid, ParameterSampler
from scipy.stats import uniform

grid = ParameterGrid({'C': [0.1, 1], 'kernel': ['linear', 'rbf']})
print(len(grid))          # 4 种组合
for params in grid:
    print(params)

sampler = ParameterSampler({'C': uniform(0.1, 10)}, n_iter=5, random_state=0)
for params in sampler:
    print(params)
```

`ParameterGrid` 枚举笛卡尔积；`ParameterSampler` 按分布随机采样，参数与 `RandomizedSearchCV` 一致。

## 1.18.5 学习曲线与验证曲线

### learning_curve 学习曲线

学习曲线展示**训练样本数**对训练集与验证集性能的影响，用来判断模型是过拟合还是欠拟合：

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import learning_curve

train_sizes, train_scores, test_scores = learning_curve(
    SVC(), X, y, cv=5, train_sizes=np.linspace(0.1, 1.0, 5))

train_mean = train_scores.mean(axis=1)
test_mean = test_scores.mean(axis=1)
plt.plot(train_sizes, train_mean, label='训练')
plt.plot(train_sizes, test_mean, label='验证')
plt.legend()
plt.show()
```

`train_sizes` 是样本数比例序列。判读规则：训练分数远高于验证分数且两者差距不缩小，是过拟合，增加数据或降低复杂度；两者都低，是欠拟合，增加模型复杂度。

### validation_curve 验证曲线

验证曲线展示**某个超参数**变化时训练集与验证集性能的变化，用于找超参数的最优区间：

```python
from sklearn.model_selection import validation_curve
from sklearn.tree import DecisionTreeClassifier

param_range = np.arange(1, 21)
train_scores, test_scores = validation_curve(
    DecisionTreeClassifier(), X, y,
    param_name='max_depth', param_range=param_range, cv=5)
```

`param_name` 是待考察的参数名，`param_range` 是取值序列。验证分数先升后降的位置通常是好的超参数取值，训练分数持续上升而验证分数下降的位置对应过拟合区。

## 1.18.6 模型持久化 joblib

训练好的模型要保存到磁盘，下次直接加载使用。推荐用 `joblib` 库：

```python
import joblib

joblib.dump(grid.best_estimator_, 'model.pkl')
loaded = joblib.load('model.pkl')
print(loaded.predict(X[:3]))
```

`joblib.dump` 序列化模型到文件，`joblib.load` 反序列化。说明：早期 scikit-learn 通过 `sklearn.externals.joblib` 引入 joblib，**该接口已迁移**为独立的 `joblib` 包，现在直接 `import joblib`。对含大量 NumPy 数组的模型（SVM、树模型），joblib 比 pickle 更快更省空间。保存完整 pipeline（含预处理）比只保存模型更稳妥，加载后即可直接预测。

## 练习题

### 第1题 概念理解

说明交叉验证为什么比单次训练测试划分更可靠；说明 StratifiedKFold 与 GroupKFold 各自解决的问题；说明 GridSearchCV 中 `best_params_`、`best_score_`、`best_estimator_` 的含义。

::: details 参考答案

交叉验证让每个样本都被验证一次，多次训练取平均，方差更小、估计更诚实。StratifiedKFold 保持每折类别比例一致，解决类别不平衡；GroupKFold 保证同一组样本同进同出，解决分组相关导致的数据泄漏。`best_params_` 是最优参数组合，`best_score_` 是它在交叉验证上的平均分，`best_estimator_` 是用最优参数在全部数据上重训的模型。
:::

### 第2题 代码编写

用鸢尾花数据做 5 折 `cross_val_score`（准确率），打印每折成绩与均值标准差；再对 SVC 做 `GridSearchCV`，输出 `best_params_` 与 `best_score_`。

::: details 参考答案

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.svm import SVC

X, y = load_iris(return_X_y=True)

model = SVC()
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(scores)
print(scores.mean(), scores.std())

param_grid = {'C': [0.1, 1, 10], 'kernel': ['linear', 'rbf']}
grid = GridSearchCV(SVC(), param_grid, cv=5)
grid.fit(X, y)
print(grid.best_params_)
print(grid.best_score_)
```

:::

### 第3题 进阶练习

对决策树用 `validation_curve` 考察 `max_depth` 从 1 到 15 的表现，画出训练与验证曲线并找最优深度；用 `learning_curve` 观察样本数对性能的影响；最后用 joblib 保存并加载模型。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
import joblib
from sklearn.datasets import load_iris
from sklearn.model_selection import validation_curve, learning_curve
from sklearn.tree import DecisionTreeClassifier

X, y = load_iris(return_X_y=True)

param_range = np.arange(1, 16)
train_scores, test_scores = validation_curve(
    DecisionTreeClassifier(random_state=0), X, y,
    param_name='max_depth', param_range=param_range, cv=5)
plt.plot(param_range, train_scores.mean(axis=1), label='训练')
plt.plot(param_range, test_scores.mean(axis=1), label='验证')
plt.xlabel('max_depth')
plt.ylabel('score')
plt.legend()
plt.show()

train_sizes, train_scores, test_scores = learning_curve(
    DecisionTreeClassifier(max_depth=3, random_state=0), X, y, cv=5,
    train_sizes=np.linspace(0.1, 1.0, 5))
print(train_sizes, test_scores.mean(axis=1))

model = DecisionTreeClassifier(max_depth=3, random_state=0)
model.fit(X, y)
joblib.dump(model, 'iris_tree.pkl')
loaded = joblib.load('iris_tree.pkl')
print(loaded.predict(X[:5]))
```

:::

## 常见错误

**错误 1 · 用全部数据 `fit` 之后再交叉验证**

原因:模型已经见过所有样本,交叉验证分数虚高。

解决:交叉验证的 `split` 会自己划分,直接对原始 X、y 调用,不要先在全量上训练。

**错误 2 · 时间序列数据用 KFold 随机打乱**

原因:随机打乱会让未来样本泄漏到训练集。

解决:用 `TimeSeriesSplit` 保持时间顺序,前向扩张划分。

**错误 3 · 分组数据没传 `groups`,同组样本被分到训练和验证两边**

原因:同一对象的多次观测高度相关,导致数据泄漏、分数虚高。

解决:用 `GroupKFold` 或 `GroupShuffleSplit` 并传 `groups` 参数。

**错误 4 · 忘记固定 `random_state`,结果不可复现**

原因:每次随机切分不同,分数和最优参数都变化。

解决:在划分器与搜索器中都设置 `random_state`。

**错误 5 · 回归任务 scoring 写成 `'mean_squared_error'` 报错**

原因:交叉验证框架统一最大化,回归指标要用带 `neg_` 前缀的 `'neg_mean_squared_error'`。

解决:回归指标用 `neg_mean_squared_error`、`neg_mean_absolute_error`、`r2` 等。

**错误 6 · `sklearn.externals.joblib` 导入失败**

原因:旧接口已迁移为独立 joblib 包。

解决:直接 `import joblib`。
