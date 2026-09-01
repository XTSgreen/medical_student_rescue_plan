---
title: 1.11 半监督学习与概率校准
sidebar:
  order: 11
---
# 1.11 半监督学习与概率校准

标注数据很贵：给每个样本打标签需要人工成本，而大量无标签数据却唾手可得。半监督学习试图用少量有标签数据加上大量无标签数据一起训练，把无标签数据里的结构信息利用起来。另一类问题同样常见：分类器输出的 0.7 这个概率，真实情况下真的意味着 70% 的命中率吗？大多数分类器输出的是**排序分**，未必是**真实概率**。概率校准就是把输出概率修正为真实概率。本节前半讲 `sklearn.semi_supervised` 的半监督方法，后半讲 `sklearn.calibration` 的概率校准。

## 1.11.1 半监督学习的基本思路

有标签数据少、无标签数据多时，直接用有标签数据训练会过拟合、浪费无标签数据里的分布信息。半监督学习的核心直觉是：**无标签数据的分布结构能约束决策边界**。例如两个簇各有大量无标签点，只有少数有标签点，那么决策边界应尽量避开簇内的稠密区域。

sklearn 把无标签样本的标签统一记为 **-1**，用 `fit` 时传入带 `-1` 标签的数组即可。半监督方法都共享这一约定：

```python
import numpy as np
from sklearn.datasets import make_blobs

# 生成 3 个簇
X, y = make_blobs(n_samples=300, centers=3, random_state=0)
y_true = y.copy()

# 随机挑一部分样本当作无标签样本，标签记为 -1
rng = np.random.RandomState(0)
mask = rng.rand(len(y)) < 0.7
y[mask] = -1
print(np.unique(y))   # [-1  0  1  2]
```

## 1.11.2 SelfTrainingClassifier 自训练

**自训练（self-training）** 是最直观的半监督方法，流程是一个循环：

1. 先用有标签数据训练一个基分类器。
2. 用它对无标签样本预测，选出预测概率高于阈值 $\text{threshold}$ 的高置信样本。
3. 把这些样本连同**伪标签**加入训练集，重新训练。
4. 重复直到没有新样本被选入或达到最大迭代次数。

$$\text{可信样本}=\{x \mid \max_k P(y=k\mid x)>\text{threshold}\}$$

公式中的 $P(y=k\mid x)$ 是基分类器给出的后验概率，$\text{threshold}$ 是置信度门槛。只挑高置信样本是为了防止错误伪标签在迭代中被不断放大。

`SelfTrainingClassifier` 把任意带 `predict_proba` 的分类器包装成半监督模型：

```python
from sklearn.semi_supervised import SelfTrainingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = make_blobs(n_samples=300, centers=3, random_state=0)
y_true = y.copy()
rng = np.random.RandomState(0)
y[rng.rand(len(y)) < 0.8] = -1    # 只有 20% 样本有标签

X_train, X_test, y_train, y_test = train_test_split(X, y_true, random_state=0)
y_train_unlabeled = y[train_test_split(np.arange(len(y)), random_state=0)[0]]

base = LogisticRegression(max_iter=1000)
model = SelfTrainingClassifier(base, threshold=0.75, criterion='threshold', max_iter=10)
model.fit(X_train, y_train_unlabeled)
print(accuracy_score(y_test, model.predict(X_test)))
```

常用参数：`threshold` 是置信度阈值；`criterion='threshold'` 表示选取概率超过阈值的全部样本，`criterion='k_best'` 表示每轮只挑置信度最高的 `k_best` 个；`max_iter` 限制最大迭代轮数。自训练简单有效，但**伪标签一旦错误会累积**，因此阈值不宜过低。

## 1.11.3 LabelPropagation 与 LabelSpreading 标签传播

标签传播把数据看成一张图：每个样本是一个节点，两节点越相似，边上的权重越大。有标签节点固定，无标签节点的标签由邻居沿边**投票**决定。用相似度矩阵 $W$（$W_{ij}$ 表示样本 $i$ 与 $j$ 的相似度），每一步更新：

$$f_i^{(t+1)}=\frac{\sum_{j} W_{ij}\, f_j^{(t)}}{\sum_{j} W_{ij}}$$

公式中 $f_i^{(t)}$ 是第 $t$ 轮样本 $i$ 的标签分布，分子是对邻居标签按相似度加权求和，分母把权重归一化。直觉是：**每个点反复把自己邻居的标签按相似度平均，标签沿高相似度边逐渐扩散**，直到收敛。

`LabelPropagation` 用最原始的方式实现上面的传播；`LabelSpreading` 加入了正则项（相当于每一步都把结果向初始标签拉回一点），对噪声更稳健，收敛也更快。两者使用方式相同：

```python
from sklearn.semi_supervised import LabelSpreading

X, y = make_blobs(n_samples=300, centers=3, random_state=0)
rng = np.random.RandomState(0)
y_unlabeled = y.copy()
y_unlabeled[rng.rand(len(y)) < 0.8] = -1

model = LabelSpreading(kernel='knn', n_neighbors=7, alpha=0.2)
model.fit(X, y_unlabeled)
print(accuracy_score(y, model.predict(X)))
```

`kernel='knn'` 表示用 K 近邻构造图（每点只连最近的 `n_neighbors` 个邻居），`kernel='rbf'` 用高斯核把距离转成相似度；`alpha` 是保持初始标签的比例，介于 0 和 1 之间。标签传播对簇结构明显的数据效果好，适合**大量无标签 + 少量有标签**的场景。

## 1.11.4 概率校准的必要性

分类器输出的 `predict_proba` 常常偏离真实概率。比如逻辑回归的损失函数只追求预测正确，把正样本的分数压得尽可能高、负样本压得尽可能低，于是输出概率会**过度自信**：真实命中率只有 60% 的样本，模型可能给出 0.85。概率不准的危害在排序阈值、风险决策、概率求和等场景尤其明显。

判断概率是否校准，可以看**校准曲线**：把预测概率分成若干桶，统计每个桶内的真实正样本比例。若概率完美校准，曲线应贴近对角线 $y=x$。

## 1.11.5 CalibratedClassifierCV 概率校准

`CalibratedClassifierCV` 把任意分类器包装起来，在训练后用另一层模型把原始分数映射成校准概率。常用两种映射方法：

**Platt 缩放（sigmoid 法）** 假设校准概率是原始分数 $z$ 的 sigmoid 函数：

$$P(y=1\mid x)=\frac{1}{1+\exp(az+b)}$$

其中 $z$ 是基分类器输出的原始分数，参数 $a$、$b$ 用极大似然在验证集上拟合。Platt 缩放只有一个自由度，适合曲线形状已经接近单调 sigmoid 的分类器。

**等渗回归（isotonic 法）** 拟合一个分段常数、单调不减的映射，不需要任何参数形式假设，能适应任意单调畸变，但容易过拟合，适合样本量大时使用。

用法上通过 `method` 选择映射方式，`cv` 决定用哪份数据拟合映射参数：

```python
from sklearn.calibration import CalibratedClassifierCV

base = LogisticRegression(max_iter=1000)
calibrated = CalibratedClassifierCV(base, method='isotonic', cv=5)
calibrated.fit(X_train, y_train)

# 校准前与校准后的概率分布
prob_raw = base.fit(X_train, y_train).predict_proba(X_test)[:, 1]
prob_cal = calibrated.predict_proba(X_test)[:, 1]
print(prob_raw[:5])
print(prob_cal[:5])
```

注意 `cv` 采用交叉验证：基分类器在不同折上训练，映射参数在折外数据上拟合，从而避免映射参数与基分类器在同一批数据上拟合带来的偏差。

## 1.11.6 calibration_curve 校准曲线

`calibration_curve` 直接返回校准曲线上的横纵坐标：横轴是预测概率分桶后的均值，纵轴是该桶内的真实正样本比例。

```python
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve

fraction_of_positives, mean_predicted_value = calibration_curve(
    y_test, prob_cal, n_bins=10, strategy='uniform')

plt.plot(mean_predicted_value, fraction_of_positives, marker='o', label='校准后')
plt.plot([0, 1], [0, 1], 'k--', label='完美校准')
plt.xlabel('预测概率')
plt.ylabel('实际正样本比例')
plt.legend()
plt.show()
```

`n_bins` 控制分桶数量；`strategy='uniform'` 按概率区间均匀分桶，`strategy='quantile'` 让每桶样本数大致相等。曲线明显偏离对角线时说明概率未校准，可用上一节的 `CalibratedClassifierCV` 修正。

## 练习题

### 第1题 概念理解

说明自训练的基本流程；说明标签传播中相似度矩阵 $W$ 与迭代公式 $\frac{\sum_j W_{ij}f_j}{\sum_j W_{ij}}$ 各符号的含义；说明 Platt 缩放与等渗回归两种校准方法的区别。

::: details 参考答案

自训练先用有标签数据训练基分类器，再给高置信无标签样本打伪标签并迭代重训。标签传播中 $W_{ij}$ 是样本 $i$、$j$ 的相似度，$f_j$ 是邻居标签，分子按相似度加权求和、分母归一化，直观上是沿高相似度边扩散标签。Platt 缩放用 sigmoid 函数拟合一两个参数，等渗回归拟合任意单调分段常数映射，更灵活但更易过拟合。
:::

### 第2题 代码编写

用 `make_moons` 生成数据，把 80% 样本的标签改成 -1，分别用 `SelfTrainingClassifier`、`LabelPropagation` 与 `LabelSpreading` 训练，并与只用有标签样本训练的逻辑回归比较测试集准确率。

::: details 参考答案

```python
import numpy as np
from sklearn.datasets import make_moons
from sklearn.semi_supervised import SelfTrainingClassifier, LabelPropagation, LabelSpreading
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = make_moons(n_samples=300, noise=0.15, random_state=0)
y_true = y.copy()
rng = np.random.RandomState(0)
y_unlabeled = y.copy()
y_unlabeled[rng.rand(len(y)) < 0.8] = -1

X_train, X_test, y_train, y_test = train_test_split(X, y_true, random_state=0)
idx_train, _ = train_test_split(np.arange(len(y)), random_state=0)

base = LogisticRegression(max_iter=1000)
base.fit(X_train, y_train)
print('仅用有标签:', accuracy_score(y_test, base.predict(X_test)))

st = SelfTrainingClassifier(LogisticRegression(max_iter=1000), threshold=0.7)
st.fit(X_train, y_unlabeled[idx_train])
print('自训练:', accuracy_score(y_test, st.predict(X_test)))

for name, m in [('LabelPropagation', LabelPropagation(kernel='knn', n_neighbors=5)),
                ('LabelSpreading', LabelSpreading(kernel='knn', n_neighbors=5))]:
    m.fit(X_train, y_unlabeled[idx_train])
    print(name, accuracy_score(y_test, m.predict(X_test)))
```

:::

### 第3题 进阶练习

训练一个 `RandomForestClassifier`，用 `calibration_curve` 绘制校准前与 `CalibratedClassifierCV`（分别用 Platt 缩放和等渗回归）校准后的三条校准曲线，观察哪条最贴近对角线。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=2000, n_features=10, n_informative=6,
                           n_redundant=2, random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)

rfc = RandomForestClassifier(n_estimators=100, random_state=0)
rfc.fit(X_train, y_train)

methods = {'原始': rfc,
           'sigmoid': CalibratedClassifierCV(rfc, method='sigmoid', cv=5),
           'isotonic': CalibratedClassifierCV(rfc, method='isotonic', cv=5)}
for name, m in methods.items():
    if name != '原始':
        m.fit(X_train, y_train)
    prob = m.predict_proba(X_test)[:, 1]
    fop, mpv = calibration_curve(y_test, prob, n_bins=10)
    plt.plot(mpv, fop, marker='o', label=name)
plt.plot([0, 1], [0, 1], 'k--')
plt.xlabel('预测概率')
plt.ylabel('实际比例')
plt.legend()
plt.show()
```

:::

## 常见错误

**错误 1 · 半监督训练时忘了把无标签样本标签写成 -1**

现象：传入的标签数组没有 -1，模型把所有样本都当作有标签，行为与普通分类器无异。

原因：sklearn 用 -1 表示无标签样本，其余整数标签都视为有标签。

解决：把要隐藏的标签统一改成 -1，再传入 `fit`。

**错误 2 · SelfTrainingClassifier 的基分类器没有 predict_proba**

现象：运行报 `AttributeError`，提示分类器缺少 `predict_proba`。

原因：自训练靠预测概率判断置信度，基分类器必须能输出概率。

解决：改用支持 `predict_proba` 的模型（如逻辑回归、随机森林），或用 `probability=True` 的 SVM。

**错误 3 · 校准概率后曲线仍明显偏离对角线**

现象：`calibration_curve` 显示校准后曲线依旧不平。

原因：校准映射假设基分类器分数与被校准概率之间存在单调关系；若样本量太少或基分类器分数区分度太低，映射拟合不充分。

解决：增大样本量、减少 `n_bins` 降低噪声，或换用更灵活的等渗回归方法。

**错误 4 · 混淆了 novelty 检测与异常检测的无标签概念**

现象：在半监督章节把全无标签的异常检测任务错误套用自训练。

原因：自训练需要至少部分有标签样本，全无标签时无法启动。

解决：全无标签的离群点发现属于异常检测章节，使用 IsolationForest 等方法，不要把标签全写成 -1 传给半监督模型。
