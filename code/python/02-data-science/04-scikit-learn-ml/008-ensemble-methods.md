---
title: 1.8 集成方法
sidebar:
  order: 8
---

# 1.8 集成方法

单个决策树容易过拟合，单个模型可能正好在某个样本上出错。如果训练一批有差异的模型，让它们一起投票或平均，个别模型的错误就会被抵消，整体预测更稳更准。集成学习就是把多个弱学习器组合成一个强学习器的技术，是实践中提升精度最有效的手段之一。本节按 Bagging、Boosting、Voting、Stacking 四条主线介绍 sklearn 的集成模型，最后讲 IsolationForest 异常检测。

## 1.8.1 集成学习思想

集成的有效性依赖两个条件：基学习器本身要有一定准确率（不能比随机乱猜还差），同时基学习器之间要有差异（错误发生在不同样本上）。两者结合，组合模型才能取长补短。sklearn 的集成方法分为两大类：并行式，各基学习器独立训练后平均或投票，代表是 Bagging 和随机森林；串行式，后一个模型专门纠正前一个模型的错误，代表是 AdaBoost 和梯度提升。

## 1.8.2 Bagging 自助聚合

Bagging（Bootstrap Aggregating）的关键是 bootstrap 自助采样：每次从原始训练集有放回地抽 n 个样本，形成一份新的训练集，每个基学习器用各自采样的数据集训练。有放回意味着某些样本被抽中多次，某些样本一次也没被抽中，各基学习器看到的数据略有差异，模型间的相关性下降。把多个模型的预测做平均或投票时，随机误差相互抵消，整体方差下降，系统性偏差保持不变。这就是为什么 Bagging 主要降低方差。

```python
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

bag = BaggingClassifier(
    estimator=DecisionTreeClassifier(max_depth=3),
    n_estimators=50,       # 基学习器个数
    max_samples=0.8,       # 每棵树采样 80% 的样本
    random_state=42,
)
bag.fit(X_train, y_train)
print(accuracy_score(y_test, bag.predict(X_test)))
```

`BaggingRegressor` 与 `BaggingClassifier` 用法一致，回归时对基学习器输出取平均。`max_features` 可以同时让每个基学习器只使用部分特征，进一步增加差异。

## 1.8.3 随机森林

随机森林在 Bagging 的基础上再加一层随机性：每次分裂时，只从随机挑选的特征子集中找最优分裂特征，而不是在所有特征里找。特征随机子集进一步降低树与树之间的相关性，平均后方差更低。随机森林引入袋外估计：每棵树训练时约 37% 的样本未被采样到，这些袋外样本（out-of-bag）可直接用来验证这棵树，全部树的袋外错误汇总即可估计模型泛化能力，无需单独划分验证集。

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    max_features='sqrt',   # 每次分裂用 sqrt(n) 个特征
    oob_score=True,        # 开启袋外估计
    random_state=42,
)
rf.fit(X_train, y_train)
print(rf.oob_score_)       # 袋外准确率
print(rf.feature_importances_)   # 特征重要性
```

`RandomForestRegressor` 用于回归任务。`feature_importances_` 汇总各特征在全部树中的贡献，可直接用于特征选择。

## 1.8.4 ExtraTreesClassifier 与 ExtraTreesRegressor

ExtraTrees 在随机森林基础上更进一步，分裂时不搜索最优阈值，直接随机选取阈值。省去阈值搜索让训练速度明显提升，但单棵树方差更大，通常需要更多的树才能达到同等精度。它适合特征多、数据大的场景，也是对比随机森林方差-偏差权衡的好例子。

```python
from sklearn.ensemble import ExtraTreesClassifier

et = ExtraTreesClassifier(n_estimators=100, max_depth=5, random_state=42)
et.fit(X_train, y_train)
print(accuracy_score(y_test, et.predict(X_test)))
```

## 1.8.5 AdaBoost 自适应提升

Boosting 走串行路线：先训练第一个模型，找出它分错的样本，提高这些样本的权重，让下一个模型更关注难样本，如此反复。AdaBoost 的权重更新规则是：

$$

w_i \leftarrow w_i \cdot \exp\big(\alpha_t \cdot \mathbb{1}[h_t(x_i)\ne y_i]\big)

$$

$w_i$ 是第 i 个样本的权重，$h_t$ 是第 t 轮训练的模型，$\mathbb{1}$ 是指示函数，样本分错时取 1、分对时取 0，$\alpha_t$ 是当前模型的可信度（准确率越高越大）。分错的样本权重被放大，下一轮被重点照顾；最终按各模型的可信度加权投票。

```python
from sklearn.ensemble import AdaBoostClassifier

ada = AdaBoostClassifier(
    n_estimators=50,
    learning_rate=1.0,
    random_state=42,
)
ada.fit(X_train, y_train)
print(accuracy_score(y_test, ada.predict(X_test)))
```

`AdaBoostRegressor` 用加权中位数或加权平均输出。`learning_rate` 控制每轮贡献的缩水程度，调小有助于抑制过拟合。

## 1.8.6 梯度提升

梯度提升（Gradient Boosting）是目前最常用的 Boosting 实现。它把最终模型写成加法模型：每一轮加一棵新树，新树拟合前面所有树尚未解释的部分，也就是负梯度方向，对回归问题来说就是残差。学习率缩放每棵树的贡献，防止一步迈得太大而过拟合：

$$

F_m(x)=F_{m-1}(x)+\eta\, h_m(x)

$$

$F_{m-1}$ 是前 m-1 棵树的累加模型，$h_m$ 是第 m 棵树，拟合残差方向，$\eta$ 是学习率，控制每棵树对最终预测的贡献比例。学习率越小，需要越多棵树，但每步走得稳，泛化通常更好。

```python
from sklearn.ensemble import GradientBoostingClassifier

gbc = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,   # 学习率，越小越稳
    max_depth=3,
    random_state=42,
)
gbc.fit(X_train, y_train)
print(accuracy_score(y_test, gbc.predict(X_test)))
```

`GradientBoostingRegressor` 用法相同。这两个模型的超参数多，训练较慢，大数据场景推荐下一节的直方图版本。

## 1.8.7 HistGradientBoosting 直方图梯度提升

HistGradientBoosting 对每个连续特征预先分箱成离散区间，用直方图统计快速寻找分裂点，训练速度比 GradientBoosting 快一个量级以上，且内存占用更低，适合大数据集。它原生支持缺失值和类别特征，无需提前填充缺失值或做独热编码。

```python
from sklearn.ensemble import HistGradientBoostingClassifier

hgbc = HistGradientBoostingClassifier(
    max_iter=100,          # 最大迭代（树）数
    learning_rate=0.1,
    max_leaf_nodes=31,     # 每棵树的叶节点上限
    random_state=42,
)
hgbc.fit(X_train, y_train)
print(accuracy_score(y_test, hgbc.predict(X_test)))
```

`max_leaf_nodes` 控制单棵树的复杂度，是直方图版本最主要的正则化参数。

## 1.8.8 Voting 投票

Voting 把多个已训练好的模型直接组合。硬投票让每个分类器投一个类别，按多数表决；软投票让每个分类器输出各类别概率，取概率平均后最大的类别。软投票需要基学习器支持 `predict_proba`，通常比硬投票更稳。

```python
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

voting = VotingClassifier(
    estimators=[
        ('lr', LogisticRegression(max_iter=1000)),
        ('svm', SVC(probability=True)),      # 软投票需要概率输出
        ('dt', DecisionTreeClassifier(max_depth=3)),
    ],
    voting='soft',          # 软投票
)
voting.fit(X_train, y_train)
print(accuracy_score(y_test, voting.predict(X_test)))
```

`VotingRegressor` 对回归器的预测取平均。

## 1.8.9 Stacking 堆叠

Voting 用固定规则组合模型，Stacking 则让一个模型学习如何组合。第一层是多个基学习器，各自输出预测；第二层是一个元学习器（meta learner），把第一层的预测作为输入特征重新训练，学习各基学习器预测的权重关系。相比 Voting，Stacking 能利用基学习器的预测模式，但训练成本更高。

```python
from sklearn.ensemble import StackingClassifier

stack = StackingClassifier(
    estimators=[
        ('lr', LogisticRegression(max_iter=1000)),
        ('dt', DecisionTreeClassifier(max_depth=3)),
    ],
    final_estimator=LogisticRegression(),   # 元学习器
    cv=5,                                   # 交叉验证生成元特征
)
stack.fit(X_train, y_train)
print(accuracy_score(y_test, stack.predict(X_test)))
```

`StackingRegressor` 用于回归，元学习器默认用 `RidgeCV`。

## 1.8.10 IsolationForest 隔离森林

IsolationForest 用于异常检测，思想与分类回归完全不同。它随机选择特征和阈值反复划分数据空间，正常样本密集，需要很多次划分才能隔离；异常样本少而与众不同，往往经过很少几次划分就被单独隔离出来。记录每个样本被隔离所需的划分次数（路径长度），路径短的更可能是异常。

```python
import numpy as np
from sklearn.ensemble import IsolationForest

rng = np.random.RandomState(42)
X = rng.normal(0, 1, (200, 2))
X[0] = [8, 8]              # 插入两个明显离群点
X[1] = [-8, 8]

iso = IsolationForest(contamination=0.05, random_state=42)
iso.fit(X)
print(iso.predict(X[:2]))  # -1 表示异常
```

`contamination` 指定数据中异常点的比例，`predict` 返回 1（正常）或 -1（异常）。

## 练习题

### 第1题 概念理解

说明 Bagging 与 Boosting 在训练方式和组合方式上的区别；说明 bootstrap 有放回采样为什么能降低方差；说明随机森林在 Bagging 之外还增加了什么随机性。

::: details 参考答案

Bagging 并行训练多个模型，最后平均或投票，主要降方差；Boosting 串行训练，后一个模型纠正前一个的错误，主要降偏差。bootstrap 有放回采样让各模型数据有差异，模型相关性降低，平均时随机误差相互抵消，方差下降。随机森林每次分裂只从随机特征子集中选最优特征，进一步降低树间相关性。

:::

### 第2题 代码编写

在鸢尾花数据上比较决策树、随机森林、AdaBoost、梯度提升的分类准确率；开启随机森林的 oob_score 查看袋外估计。

::: details 参考答案

```python
from sklearn.ensemble import (RandomForestClassifier, AdaBoostClassifier,
                              GradientBoostingClassifier)
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

models = {
    'tree': DecisionTreeClassifier(max_depth=3, random_state=42),
    'rf': RandomForestClassifier(n_estimators=50, max_depth=3, random_state=42),
    'ada': AdaBoostClassifier(n_estimators=50, random_state=42),
    'gb': GradientBoostingClassifier(n_estimators=50, random_state=42),
}
for name, model in models.items():
    model.fit(X_train, y_train)
    print(name, accuracy_score(y_test, model.predict(X_test)))

rf = RandomForestClassifier(n_estimators=100, oob_score=True, random_state=42)
rf.fit(X_train, y_train)
print(rf.oob_score_)
```

:::

### 第3题 进阶练习

用 VotingClassifier 组合三个不同模型并与单个模型比较；用 StackingClassifier 组合模型；用 IsolationForest 在二维数据中找出异常点。

::: details 参考答案

```python
from sklearn.ensemble import VotingClassifier, StackingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

voting = VotingClassifier(
    estimators=[('lr', LogisticRegression(max_iter=1000)),
                ('dt', DecisionTreeClassifier(max_depth=3))],
    voting='soft').fit(X_train, y_train)
print('voting', accuracy_score(y_test, voting.predict(X_test)))

stack = StackingClassifier(
    estimators=[('lr', LogisticRegression(max_iter=1000)),
                ('dt', DecisionTreeClassifier(max_depth=3))],
    final_estimator=LogisticRegression()).fit(X_train, y_train)
print('stack', accuracy_score(y_test, stack.predict(X_test)))

rng = np.random.RandomState(42)
Xd = rng.normal(0, 1, (200, 2))
Xd[0] = [8, 8]
iso = IsolationForest(contamination=0.05, random_state=42).fit(Xd)
print(iso.predict(Xd[:5]))
```

:::

## 常见错误

**错误 1 · 随机森林比单棵决策树还差**

原因:基学习器过强或数量太少，模型之间缺少差异，集成收益不明显。

解决:降低基学习器复杂度（如 max_depth=5）并增加 n_estimators，开启特征随机子集。

**错误 2 · 软投票报 AttributeError 没有 predict_proba**

原因:SVC 等模型默认不输出概率，软投票需要概率。

解决:给模型加 probability=True，或改用硬投票。

**错误 3 · 梯度提升训练很慢**

原因:GradientBoosting 逐树拟合且没有分箱加速，数据大时开销高。

解决:换用 HistGradientBoostingClassifier 或 HistGradientBoostingRegressor。

**错误 4 · IsolationForest 预测结果全是 1**

原因:contamination 设得过低，或数据本身没有明显离群点。

解决:根据数据实际异常比例调高 contamination，先可视化确认存在离群点。

**错误 5 · oob_score 与验证集得分差异很大**

原因:oob_score 基于袋外样本估计，与小验证集上的波动不同。

解决:把 oob_score 当作趋势参考，最终评估仍以独立测试集为准。
