---
title: 1.9 多类多标签分类
sidebar:
  order: 9
---

# 1.9 多类多标签分类

手写数字识别把一张图分到 0 到 9 中的一个数字，每个样本恰好属于一个类别，这是多类分类。一篇文章可以同时打上体育、八卦、推荐等多个标签，每个标签独立决定是否成立，这是多标签分类。两类问题都不能直接用单个二分类器解决，需要把二分类器组合起来。本节先区分多类与多标签，再介绍 sklearn 的包装类与多输出模型。

## 1.9.1 多类与多标签概念区分

多类分类中类别互斥，样本必须且只能属于一个类别，输出是一个类别标签。多标签分类中标签不互斥，样本可以同时属于任意多个标签，输出是一个标签集合。多输出问题则指输出本身是多个变量，例如同时预测房价和面积，各输出相互独立。

| 问题类型 | 类别关系 | 输出形式 | 典型工具 |
| --- | --- | --- | --- |
| 二分类 | 两个类别 | 单个标签 | 普通分类器 |
| 多类分类 | 类别互斥 | 单个标签 | OneVsRest、OneVsOne |
| 多标签分类 | 标签可共存 | 标签集合 | OneVsRest、ClassifierChain |
| 多输出 | 输出多个变量 | 向量 | MultiOutput* |

多类分类关注属于哪一类，多标签分类关注同时属于哪些标签。

## 1.9.2 OneVsRestClassifier 一对多

一对多策略对每个类别训练一个二分类器：把该类别的样本当正例，其余所有类别的样本当负例。对 K 个类别共训练 K 个分类器，数量随类别数线性增长：

$$
N_{\text{OVR}} = K
$$

预测时让每个分类器输出概率，取概率最大的类别。sklearn 中许多分类器（如逻辑回归、线性 SVM）本身就用一对多处理多类，OneVsRestClassifier 的作用是显式包装并统一接口。

```python
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

ovr = OneVsRestClassifier(LogisticRegression(max_iter=1000))
ovr.fit(X_train, y_train)
print(accuracy_score(y_test, ovr.predict(X_test)))
print(ovr.predict_proba(X_test[:2]))   # 每个类别的概率
```

`predict_proba` 返回每个样本属于各类别的概率矩阵，取每行最大值的下标就是预测类别。

## 1.9.3 OneVsOneClassifier 一对一

一对一策略对每一对类别训练一个分类器，K 个类别需要的分类器数量是类别两两组合的数目：

$$
N_{\text{OVO}} = \frac{K(K-1)}{2}
$$

预测时所有分类器投票，得票最多的类别胜出。分类器数量随类别数平方增长，类别多时训练开销大，但每个分类器只面对两个类别，问题更简单，在类别多、样本充足的场景有时比一对多更准。

```python
from sklearn.multiclass import OneVsOneClassifier
from sklearn.svm import SVC

ovo = OneVsOneClassifier(SVC())
ovo.fit(X_train, y_train)
print(accuracy_score(y_test, ovo.predict(X_test)))
```

SVM 对多类问题默认使用一对一策略，OneVsOneClassifier 用于显式控制这种组合方式。

## 1.9.4 OutputCodeClassifier 纠错输出码

纠错输出码（ECOC）给每个类别分配一个二进制码，例如三个类别分别编码为 001、010、100，每个码位对应训练一个二分类器。预测时先得到输出码，再与各类的编码比较，取汉明距离最近的类别。码的长度可以大于类别数，多出的位是冗余，个别分类器出错时仍可能被纠回正确类别，这是纠错二字的由来。

```python
from sklearn.multiclass import OutputCodeClassifier

ecoc = OutputCodeClassifier(
    LogisticRegression(max_iter=1000),
    code_size=2.0,        # 码长 = code_size × 类别数
)
ecoc.fit(X_train, y_train)
print(accuracy_score(y_test, ecoc.predict(X_test)))
```

`code_size` 控制码的冗余程度，大于 1 时码长超过类别数，纠错能力强但训练的分类器更多。

## 1.9.5 MultiOutputRegressor 与 MultiOutputClassifier

多输出问题中每个输出独立建模即可，MultiOutputRegressor 把回归器包装成多个独立的单输出模型，MultiOutputClassifier 对分类器做同样的事。每个输出训练一个模型，输出之间互不关联，适合输出之间没有依赖关系的场景。

```python
import numpy as np
from sklearn.multioutput import MultiOutputRegressor
from sklearn.linear_model import LinearRegression

# 两个输出：输出房价与面积
X = np.random.RandomState(42).rand(100, 5)
Y = np.column_stack([X[:, 0] * 3 + 1, X[:, 1] * 5 - 2])

mor = MultiOutputRegressor(LinearRegression())
mor.fit(X, Y)
print(mor.predict(X[:2]))
```

`MultiOutputClassifier` 用法相同，适合每个输出是类别标签的多输出分类。

## 1.9.6 ClassifierChain 分类器链

多标签分类的标签之间常有依赖，例如文章是体育类时更可能是赛事资讯。ClassifierChain 把标签串成一条链，链上每个标签训练一个分类器，并把链上前一个标签的预测结果作为当前分类器的额外特征，让后一个标签利用前面标签的信息。链的顺序会影响效果，可以尝试不同顺序或随机顺序。

```python
from sklearn.multioutput import ClassifierChain
from sklearn.linear_model import LogisticRegression

# 多标签数据：每行一个样本，每个标签 0/1
X = np.random.RandomState(42).rand(100, 5)
Y = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 0]] * 33 + [[0, 0, 0]])

chain = ClassifierChain(LogisticRegression(max_iter=1000), order=[0, 1, 2])
chain.fit(X, Y)
print(chain.predict(X[:2]))
```

`order` 指定标签链的顺序，`predict` 返回每个样本的标签集合。

## 1.9.7 原生支持多输出的模型

树模型天然支持多输出。决策树、随机森林等模型的叶子可以直接输出一个向量，因此能把多标签 Y 直接传给 fit，无需包装。线性模型只能输出单个标量，必须靠 OneVsRest、MultiOutput 等包装。选择包装方式还是原生支持，取决于模型类型和标签之间的关系。

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=50, random_state=42)
rf.fit(X, Y)                     # Y 是 (100, 3) 的多标签矩阵
print(rf.predict(X[:2]))
```

随机森林对多标签数据的每个叶子输出各类别占比向量，直接支持多输出，代码比包装更简洁。

## 练习题

### 第1题 概念理解

说明多类分类与多标签分类的区别；说明 OneVsRest 与 OneVsOne 各自训练多少个分类器；说明 ClassifierChain 如何利用标签依赖。

::: details 参考答案

多类分类类别互斥，每个样本属于一个类别；多标签分类标签可共存，每个样本属于一个标签集合。K 个类别时 OneVsRest 训练 K 个分类器，OneVsOne 训练 K(K-1)/2 个。ClassifierChain 把标签串成链，前一个标签的预测作为后一个分类器的特征，让标签之间共享信息。

:::

### 第2题 代码编写

在鸢尾花数据上用 OneVsRestClassifier 和 OneVsOneClassifier 分别训练并比较准确率；用 MultiOutputRegressor 拟合两个输出的线性数据。

::: details 参考答案

```python
from sklearn.multiclass import OneVsRestClassifier, OneVsOneClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.multioutput import MultiOutputRegressor
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

for name, cls in (('ovr', OneVsRestClassifier(LogisticRegression(max_iter=1000))),
                  ('ovo', OneVsOneClassifier(LogisticRegression(max_iter=1000)))):
    cls.fit(X_train, y_train)
    print(name, accuracy_score(y_test, cls.predict(X_test)))

Xm = np.random.RandomState(42).rand(100, 5)
Ym = np.column_stack([Xm[:, 0] * 3 + 1, Xm[:, 1] * 5 - 2])
mor = MultiOutputRegressor(LinearRegression()).fit(Xm, Ym)
print(mor.predict(Xm[:2]))
```

:::

### 第3题 进阶练习

构造多标签数据，比较 RandomForestClassifier 直接训练与 OneVsRestClassifier 包装的效果；用 ClassifierChain 训练并改变 order 观察差异。

::: details 参考答案

```python
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.multioutput import ClassifierChain
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import hamming_loss

rng = np.random.RandomState(42)
X = rng.rand(200, 5)
Y = (X[:, :3] > 0.5).astype(int)   # 三个相关标签
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, random_state=42)

rf = RandomForestClassifier(n_estimators=50, random_state=42).fit(X_train, Y_train)
ovr = OneVsRestClassifier(LogisticRegression(max_iter=1000)).fit(X_train, Y_train)
print('rf  ', hamming_loss(Y_test, rf.predict(X_test)))
print('ovr  ', hamming_loss(Y_test, ovr.predict(X_test)))

chain = ClassifierChain(LogisticRegression(max_iter=1000), order=[0, 1, 2])
chain.fit(X_train, Y_train)
print('chain', hamming_loss(Y_test, chain.predict(X_test)))
```

:::

## 常见错误

**错误 1 · 多标签任务误用单标签准确率评估**

原因:多标签预测是集合匹配，accuracy_score 要求完全一致才计对，过于苛刻。

解决:用 hamming_loss、精确率、召回率或 F1 等针对多标签的指标评估。

**错误 2 · OneVsOne 在类别很多时训练特别慢**

原因:分类器数量随类别数平方增长。

解决:类别多时优先用 OneVsRest 或原生多类模型。

**错误 3 · 把多标签 Y 直接传给线性模型报维度错误**

原因:线性模型只能输出单个标量，无法直接输出标签向量。

解决:用 MultiOutputClassifier、OneVsRestClassifier 包装，或用树模型原生支持。

**错误 4 · ClassifierChain 的 order 随意设置导致效果波动**

原因:链顺序影响误差传播路径，不同顺序结果不同。

解决:用交叉验证尝试多种 order，或用随机顺序取平均。

**错误 5 · 混淆 MultiOutput 与多标签的差别**

原因:两者都输出多列，但语义不同。

解决:输出是独立数值用 MultiOutputRegressor，输出是标签集合用 OneVsRest 或 ClassifierChain。
