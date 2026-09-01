---
title: 1.7 决策树
sidebar:
  order: 7
---

# 1.7 决策树

医生诊断时通常按发烧吗、咳嗽吗、胸痛吗这样的顺序一步步追问，最后给出结论。决策树把这种判断过程整理成一棵可以自动执行的树：每个节点询问一个特征，每个分支对应一个答案，叶节点给出预测。决策树无需对特征做缩放，训练结果可以直接读成规则，可解释性强，也是随机森林、梯度提升等集成方法的基础学习器。本节讲决策树的结构、分裂准则、sklearn 实现与可视化。

## 1.7.1 决策树的结构

一棵树由三类节点组成。根节点在最上方，包含全部训练样本，是第一次分裂的位置。内部节点位于中间，根据某个特征把样本划分到不同分支。叶节点在底部，不再分裂，直接给出预测结果（分类给出类别，回归给出数值）。从根到叶的每条路径都对应一条 if-else 规则，例如年龄大于 30 且血压偏高则判为高风险。

```python
# 树的结构示意（文字表示）
#            [根节点: 血压是否偏高]
#           /                      \
#   [内部节点: 年龄>30?]        [叶节点: 低风险]
#        /        \
#  [叶节点: 中风险] [叶节点: 高风险]
```

训练一棵决策树的过程，就是在每个节点挑选一个特征和一个阈值，把节点里的样本划分成更纯的两个子集，然后对子节点递归重复。

## 1.7.2 树算法的演进

决策树算法经历了几个代表版本。ID3 使用信息增益选择分裂特征，只处理离散特征。C4.5 改用信息增益比修正信息增益偏向取值多的特征的缺陷，支持连续特征和缺失值。C5.0 是 C4.5 的商业改进，运行更快、内存更省，支持 boosting。CART 用基尼系数（分类）或均方误差（回归）做分裂准则，生成二叉树，是 sklearn 采用的实现。现代工程实践基本围绕 CART，但 ID3 的信息增益思想至今仍是理解分裂准则的起点。

## 1.7.3 分裂准则

分裂准则量化节点的纯度，帮助挑选最佳特征。sklearn 分类树默认使用基尼系数，也支持熵和对数损失；回归树使用均方误差或平均绝对误差。

基尼系数衡量节点不纯度：

$$

G=1-\sum_{k} p_k^2

$$

$p_k$ 是节点中第 k 类样本的比例，对所有类别求和。如果节点里全是同一类，某个 $p_k=1$，其余为 0，此时 $G=0$，节点最纯；各类均匀分布时 G 最大，节点最乱。基尼系数越小，说明该特征能把样本分得越开。

熵衡量节点的信息量：

$$

H=-\sum_{k} p_k \log p_k

$$

$p_k$ 同上，对数以 2 为底时熵的单位是比特。节点越乱，熵越大；节点越纯，熵越小。熵与基尼系数走势一致，sklearn 默认选基尼系数是因为它不含对数运算，计算更快。

信息增益衡量分裂前后不确定性的减少量：

$$

IG=H(\text{父})-\sum_{j} \frac{n_j}{n} H(\text{子}_j)

$$

$H(\text{父})$ 是分裂前父节点的熵；对每个子节点 j，$n_j$ 是子节点样本数，$n$ 是父节点总样本数，$\frac{n_j}{n}$ 是子节点的样本占比，用它给子节点熵加权。信息增益越大，说明按该特征分裂后不确定性减少越多，特征越能区分类别。ID3 就按信息增益取最大的特征分裂。

对数损失（log_loss）是分类树的另一种准则，对叶节点各类概率做交叉熵惩罚，等于负的对数似然，与逻辑回归的损失一致。

回归树不能使用上述分类准则，改用均方误差或平均绝对误差。均方误差是叶节点内样本与均值之差的平方和，绝对误差是样本与中位数之差的绝对值之和，越小说明叶子内的数值越集中，预测越准。sklearn 回归树默认用均方误差。

## 1.7.4 DecisionTreeClassifier

DecisionTreeClassifier 是分类树实现，默认使用 CART 算法与基尼系数。关键参数：`criterion` 选择分裂准则（gini、entropy、log_loss）；`max_depth` 限制最大深度；`min_samples_split` 是继续分裂所需的最少样本数；`min_samples_leaf` 是叶节点最少样本数；`max_features` 是每次分裂考虑的特征数上限。

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

clf = DecisionTreeClassifier(
    criterion='gini',
    max_depth=3,            # 限制深度，防止过拟合
    min_samples_split=5,    # 少于 5 个样本不再分裂
    min_samples_leaf=2,     # 叶节点至少 2 个样本
    random_state=42,
)
clf.fit(X_train, y_train)
print(accuracy_score(y_test, clf.predict(X_test)))
```

`max_depth` 是最直观的过拟合控制开关，深度越大，树对训练数据的记忆越细，越容易过拟合。

## 1.7.5 DecisionTreeRegressor

DecisionTreeRegressor 是回归树实现，默认用均方误差。叶节点输出该叶子内样本的目标均值。回归树可以拟合非线性关系，但单棵树同样容易过拟合，需要限制深度。

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

rng = np.random.RandomState(42)
X = rng.uniform(-3, 3, size=300).reshape(-1, 1)
y = np.sin(X).ravel() + rng.normal(0, 0.1, size=300)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)
reg = DecisionTreeRegressor(max_depth=4, random_state=42)
reg.fit(X_train, y_train)
print(mean_squared_error(y_test, reg.predict(X_test)))
```

这里用带噪声的正弦波拟合演示回归树对非线性关系的建模能力。

## 1.7.6 ExtraTreeClassifier 与 ExtraTreeRegressor

ExtraTree 是极度随机树。普通决策树每次分裂都搜索所有阈值找最优分裂点，ExtraTree 直接随机选一个阈值，省去搜索过程，训练快得多，但单棵树方差更大。它很少单独使用，通常作为随机森林或集成模型的基学习器，配合随机采样进一步降低整体方差。

```python
from sklearn.tree import ExtraTreeClassifier

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)
et = ExtraTreeClassifier(max_depth=3, random_state=42)
et.fit(X_train, y_train)
print(accuracy_score(y_test, et.predict(X_test)))
```

## 1.7.7 导出与可视化

sklearn 提供三种查看树的方法。`export_text()` 输出纯文本的树结构，不依赖任何外部软件。`export_graphviz()` 导出 Graphviz 的 dot 格式，可用 graphviz 库渲染成图片。`plot_tree()` 直接用 matplotlib 绘制。

```python
from sklearn.tree import export_text, export_graphviz, plot_tree
import matplotlib.pyplot as plt

print(export_text(clf, feature_names=load_iris().feature_names))
# 纯文本树，直接阅读

plt.figure(figsize=(12, 8))
plot_tree(clf, filled=True, feature_names=load_iris().feature_names)
plt.show()
```

`export_graphviz` 需要系统安装 graphviz 软件，`plot_tree` 只需要 matplotlib，日常调试用 `plot_tree` 最方便。

## 1.7.8 剪枝思想与过拟合控制

决策树最容易犯的问题是过拟合：不加限制的树会把训练样本记得分毫不差，包括噪声，泛化能力反而下降。剪枝是抑制这种行为的核心思想，分两类。预剪枝在训练过程中提前停止分裂，例如设置 `max_depth`、`min_samples_split`、`min_samples_leaf`，训练快但可能欠拟合。后剪枝先完整建树再自底向上裁掉不重要的分支，效果好但成本高。

sklearn 通过 `ccp_alpha` 参数实现代价复杂度剪枝（CCP），这是后剪枝的一种形式。ccp_alpha 越大，剪掉的节点越多，可以用验证集配合选择合适取值：

```python
from sklearn.tree import DecisionTreeClassifier

clf_full = DecisionTreeClassifier(random_state=42)
path = clf_full.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas   # 一系列候选剪枝强度

clf_pruned = DecisionTreeClassifier(ccp_alpha=0.01, random_state=42)
clf_pruned.fit(X_train, y_train)
print(accuracy_score(y_test, clf_pruned.predict(X_test)))
```

实际工程中，优先通过 `max_depth` 与 `min_samples_leaf` 做预剪枝，需要更精细的剪枝时再用 `ccp_alpha`。

## 练习题

### 第1题 概念理解

说明根节点、内部节点、叶节点的作用；写出基尼系数与熵的公式并说明它们衡量什么；说明信息增益越大代表什么。

::: details 参考答案

根节点包含全部样本，是第一次分裂处；内部节点按特征继续划分样本；叶节点给出最终预测。基尼系数 $G=1-\sum_k p_k^2$ 与熵 $H=-\sum_k p_k\log p_k$ 都衡量节点纯度，越纯取值越小。信息增益是分裂前后熵的差值，越大说明该特征分裂后不确定性减少越多，特征区分能力越强。

:::

### 第2题 代码编写

用 DecisionTreeClassifier 在鸢尾花上训练并评估；用 export_text 和 plot_tree 查看树结构；调整 max_depth 观察准确率变化。

::: details 参考答案

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text, plot_tree
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

for depth in (1, 3, 10, None):
    clf = DecisionTreeClassifier(max_depth=depth, random_state=42)
    clf.fit(X_train, y_train)
    print(depth, accuracy_score(y_test, clf.predict(X_test)))

clf = DecisionTreeClassifier(max_depth=3, random_state=42).fit(X_train, y_train)
print(export_text(clf, feature_names=load_iris().feature_names))
plt.figure(figsize=(12, 8))
plot_tree(clf, filled=True)
plt.show()
```

:::

### 第3题 进阶练习

用 DecisionTreeRegressor 拟合带噪声的正弦波，对比不同 max_depth 的均方误差；用 cost_complexity_pruning_path 尝试 ccp_alpha 剪枝。

::: details 参考答案

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.datasets import load_iris

rng = np.random.RandomState(42)
X = rng.uniform(-3, 3, 300).reshape(-1, 1)
y = np.sin(X).ravel() + rng.normal(0, 0.1, 300)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)

for depth in (2, 5, 20):
    reg = DecisionTreeRegressor(max_depth=depth, random_state=42).fit(X_train, y_train)
    print(depth, mean_squared_error(y_test, reg.predict(X_test)))

# ccp_alpha 剪枝
Xi, yi = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(Xi, yi, random_state=42)
clf = DecisionTreeClassifier(random_state=42)
path = clf.cost_complexity_pruning_path(Xtr, ytr)
clf2 = DecisionTreeClassifier(ccp_alpha=path.ccp_alphas[-2], random_state=42)
clf2.fit(Xtr, ytr)
print(clf2.tree_.max_depth)
```

:::

## 常见错误

**错误 1 · 不设任何限制，决策树训练集准确率 100% 而测试集很差**

原因:树深度不受限时把训练样本包括噪声全部记住，严重过拟合。

解决:设置 max_depth、min_samples_split、min_samples_leaf，或使用 ccp_alpha 剪枝。

**错误 2 · 把字符串类别特征直接传入决策树**

原因:sklearn 决策树只接受数值特征。

解决:用 OrdinalEncoder 或 OneHotEncoder 把类别特征转成数值。

**错误 3 · 混淆 criterion 的取值**

原因:分类树与回归树的可用准则不同。

解决:分类树用 gini、entropy、log_loss，回归树用 squared_error、absolute_error。

**错误 4 · export_graphviz 报找不到 dot 命令**

原因:sklearn 只负责生成 dot 文本，渲染需要单独安装 graphviz。

解决:安装 graphviz 软件并把可执行文件加入 PATH，或改用 plot_tree 直接绘图。

**错误 5 · 认为决策树需要标准化特征**

原因:决策树按阈值比较特征，对尺度不敏感。

解决:可以不做标准化，直接使用原始数值特征。
