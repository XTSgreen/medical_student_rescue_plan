---
title: 1.10 特征选择
sidebar:
  order: 10
---

# 1.10 特征选择

数据集的列数可能成百上千，其中不少特征与目标无关或高度重复。特征过多会带来三个问题：模型过拟合噪声、训练变慢、可解释性变差。特征选择从原始特征中挑出最有用的子集，既能提升精度也能降低复杂度。sklearn.feature_selection 提供过滤法、包装法、嵌入法三类工具，本节逐一介绍并给出完整流水线。

## 1.10.1 过滤法：单变量选择

过滤法先对每个特征单独打分，再按得分挑选特征，计算快，不依赖具体模型。SelectKBest 选择得分最高的 K 个特征；SelectPercentile 按得分排名选取前百分之几的特征；SelectFpr、SelectFdr、SelectFwe 基于 p 值阈值控制多重检验的错误率，分别对应假阳性率、错误发现率、族错误率，适合特征数多、需要严格控制的场景；GenericUnivariateSelect 是通用版本，可自由组合评分函数与选择策略。

```python
from sklearn.datasets import load_digits
from sklearn.feature_selection import SelectKBest, SelectPercentile, chi2

X, y = load_digits(return_X_y=True)
print(X.shape)   # (1797, 64)，64 个像素特征

skb = SelectKBest(chi2, k=20)          # 选 20 个得分最高的特征
X_new = skb.fit_transform(X, y)
print(X_new.shape)                     # (1797, 20)
print(skb.get_support())               # 每个特征是否被选中

sp = SelectPercentile(chi2, percentile=30)
X_pct = sp.fit_transform(X, y)
print(X_pct.shape)
```

`fit_transform` 返回筛选后的特征矩阵，`get_support()` 返回布尔掩码，指明哪些原始特征被保留。

## 1.10.2 方差阈值 VarianceThreshold

方差阈值从数据的角度筛选特征：方差过低的特征取值近乎常数，几乎不携带区分信息。VarianceThreshold 移除方差低于阈值的特征。需要注意阈值受量纲影响，不同量纲的特征方差不可直接比较，使用前通常先做标准化。

```python
import numpy as np
from sklearn.feature_selection import VarianceThreshold

X = np.array([
    [0, 1, 2, 3],
    [0, 2, 2, 3],
    [0, 3, 2, 3],
    [0, 4, 2, 3],
])
sel = VarianceThreshold(threshold=0.1)   # 移除方差低于 0.1 的列
print(sel.fit_transform(X))
# 第二列取值为 1、2、3、4，方差大被保留，其余列近乎常数被移除
```

这里第二列取值为 1、2、3、4，方差大于 0.1 被保留，其余列取值几乎不变被移除。

## 1.10.3 评分函数

sklearn.feature_selection 提供三类常用评分函数。chi2 计算特征与类别标签的卡方统计量，衡量两者是否独立，统计量越大说明特征越依赖标签、越有用，只适用于非负特征：

$$

\chi^2=\sum \frac{(O-E)^2}{E}

$$

$O$ 是观测频数，$E$ 是按独立性假设推算的期望频数，对每个单元格计算后求和。特征与标签独立时 O 与 E 接近，统计量小；相关越强统计量越大。

互信息衡量特征 X 与目标 Y 的相关程度，能捕捉非线性关系：

$$

I(X;Y)=\sum_x \sum_y p(x,y)\log\frac{p(x,y)}{p(x)p(y)}

$$

$p(x,y)$ 是联合分布，$p(x)p(y)$ 是 X 与 Y 独立时的联合分布。如果 X 与 Y 独立，$p(x,y)=p(x)p(y)$，对数项为 0，互信息为 0；两者相关越强互信息越大。它的直观含义是知道 X 之后 Y 的不确定性减少了多少。`mutual_info_classif` 用于分类目标，`mutual_info_regression` 用于回归目标。

F 统计量适合特征与目标近似线性关系的场景。`f_classif` 对分类目标计算组间方差与组内方差之比，`f_regression` 对回归目标计算相关系数对应的 F 值。

| 评分函数 | 适合目标 | 关系假设 | 适用特征 |
| --- | --- | --- | --- |
| chi2 | 分类 | 线性、独立性 | 非负特征 |
| mutual_info_classif / regression | 分类 / 回归 | 任意（含非线性） | 任意数值 |
| f_classif / f_regression | 分类 / 回归 | 线性 | 任意数值 |

```python
from sklearn.feature_selection import (mutual_info_classif, f_classif,
                                       SelectKBest)

X, y = load_digits(return_X_y=True)

skb_mi = SelectKBest(mutual_info_classif, k=20)   # 互信息评分
skb_mi.fit(X, y)
print(skb_mi.get_support().sum())                 # 20 个特征被选中

skb_f = SelectKBest(f_classif, k=20)              # F 统计量评分
skb_f.fit(X, y)
print(skb_f.scores_[:5])                          # 前 5 个特征的得分
```

## 1.10.4 包装法：递归特征消除

包装法把模型当作黑盒，反复训练模型并淘汰最不重要的特征。RFE（递归特征消除）每次训练模型，按 `coef_` 或 `feature_importances_` 去掉最不重要的特征，再重新训练，直到剩下 K 个特征。RFECV 在 RFE 外层套交叉验证，自动决定保留多少个特征，不需要手动指定 K。

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split

X, y = load_digits(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

rfe = RFE(SVC(kernel='linear'), n_features_to_select=20)
rfe.fit(X_train, y_train)
print(rfe.ranking_)        # 每个特征的重要性排名，1 表示最优先

rfecv = RFECV(SVC(kernel='linear'), step=2, cv=5)
rfecv.fit(X_train, y_train)
print(rfecv.n_features_)   # 交叉验证选出的特征数
print(rfecv.support_)      # 是否被选中
```

`step` 是每轮移除的特征数，`rfecv.n_features_` 是交叉验证后自动确定的保留特征数。

## 1.10.5 嵌入法：SelectFromModel

嵌入法把特征选择内嵌进模型训练。SelectFromModel 接收带 `coef_`（线性模型）或 `feature_importances_`（树模型）的已训练模型，只保留重要性超过阈值的特征。阈值可用 mean、median 或 1.25 乘以 mean 这类表达式，用 `max_features` 限制最多保留数。

```python
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier

X, y = load_digits(return_X_y=True)

selector = SelectFromModel(
    RandomForestClassifier(n_estimators=50, random_state=42),
    threshold='mean',        # 保留重要性高于平均值的特征
)
X_selected = selector.fit_transform(X, y)
print(X_selected.shape)
print(selector.get_support())
```

树模型的重要性基于全部特征的综合贡献，SelectFromModel 因此能考虑特征之间的相互作用，比单变量过滤更全面。

## 1.10.6 完整特征选择流水线

实践中把特征选择嵌入 sklearn 的 Pipeline，配合 GridSearchCV 一起调参。关键原则是特征选择必须在交叉验证内部执行：先对整份数据做特征选择再划分训练集，会让验证集偷看到训练信息，造成数据泄漏，高估模型效果。把特征选择放进 Pipeline，每折交叉验证都会重新选择特征，避免这个问题。

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV

X, y = load_digits(return_X_y=True)

pipe = Pipeline([
    ('scale', StandardScaler()),                 # 1. 标准化
    ('select', SelectKBest(f_classif)),          # 2. 特征选择
    ('clf', LogisticRegression(max_iter=1000)),  # 3. 分类
])

param_grid = {
    'select__k': [10, 20, 30],        # 特征选择保留个数
    'clf__C': [0.1, 1.0, 10.0],       # 分类器正则强度
}
grid = GridSearchCV(pipe, param_grid, cv=5)
grid.fit(X, y)
print(grid.best_params_)
print(grid.best_score_)
```

Pipeline 里用双下划线连接步骤名与参数名，例如 `select__k` 表示 select 步骤的 k 参数。这样特征选择与模型调参在同一个交叉验证过程中完成，评估结果更可信。

## 练习题

### 第1题 概念理解

说明过滤法、包装法、嵌入法的区别；说明 chi2、互信息、F 统计量各自适合什么情况；说明为什么特征选择要放进交叉验证内部。

::: details 参考答案

过滤法按单变量得分选特征，不依赖模型，最快；包装法反复训练模型淘汰特征，最准但最慢；嵌入法在模型训练中完成选择，兼顾两者。chi2 适合非负特征的独立性检验，互信息能捕捉非线性关系，F 统计量适合线性关系。特征选择放进交叉验证内部可避免验证集泄漏信息导致的高估。

:::

### 第2题 代码编写

用手写数字数据分别用 SelectKBest+chi2、SelectFdr、VarianceThreshold 选择特征，输出各自的保留特征数；用 RFE 选择 20 个特征并查看排名。

::: details 参考答案

```python
from sklearn.datasets import load_digits
from sklearn.feature_selection import (SelectKBest, SelectFdr, chi2,
                                       VarianceThreshold, RFE)
from sklearn.svm import SVC

X, y = load_digits(return_X_y=True)

print(SelectKBest(chi2, k=20).fit_transform(X, y).shape)
print(SelectFdr(chi2, alpha=0.05).fit_transform(X, y).shape)
print(VarianceThreshold(threshold=10).fit_transform(X).shape)

rfe = RFE(SVC(kernel='linear'), n_features_to_select=20)
rfe.fit(X, y)
print(rfe.ranking_)
```

:::

### 第3题 进阶练习

用 SelectFromModel+随机森林选择特征并比较选择前后的分类准确率；构建包含标准化、SelectKBest、逻辑回归的 Pipeline，用 GridSearchCV 搜索最佳 k 与 C。

::: details 参考答案

```python
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_selection import SelectFromModel, SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

X, y = load_digits(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42)

selector = SelectFromModel(
    RandomForestClassifier(n_estimators=50, random_state=42),
    threshold='median')
X_sel = selector.fit_transform(X_train, y_train)
clf = LogisticRegression(max_iter=1000).fit(X_sel, y_train)
print(accuracy_score(y_test, clf.predict(selector.transform(X_test))))

pipe = Pipeline([
    ('scale', StandardScaler()),
    ('select', SelectKBest(f_classif)),
    ('clf', LogisticRegression(max_iter=1000)),
])
grid = GridSearchCV(pipe, {'select__k': [10, 20, 30], 'clf__C': [0.1, 1, 10]}, cv=5)
grid.fit(X_train, y_train)
print(grid.best_params_)
print(accuracy_score(y_test, grid.best_estimator_.predict(X_test)))
```

:::

## 常见错误

**错误 1 · 用 chi2 处理负值特征报错**

原因:卡方检验要求非负特征，负值无法计算期望频数。

解决:先对特征做 MinMaxScaler，或使用无符号的特征。

**错误 2 · VarianceThreshold 阈值设置不合理**

原因:阈值受量纲影响，不同尺度的特征方差不可比。

解决:先标准化再设阈值，或用相对策略（如按分位数挑选）。

**错误 3 · 特征选择在交叉验证外部执行造成数据泄漏**

原因:在整份数据上选择特征后再划分训练集，验证集信息被偷看。

解决:把特征选择放进 Pipeline，让每折交叉验证独立执行。

**错误 4 · RFE 在特征极多时训练很慢**

原因:每轮都要重新训练一次模型，特征多时开销大。

解决:改用 SelectFromModel 嵌入法，或先用过滤法粗筛再包装。

**错误 5 · SelectFromModel 之后没有用 transform 处理测试集**

原因:只对训练集 fit_transform，测试集仍保留全部特征，维度不一致。

解决:保存 selector，用 selector.transform(X_test) 得到相同维度的特征。
