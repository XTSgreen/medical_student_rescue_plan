---
title: 1.19 模型评估指标
sidebar:
  order: 19
---
# 1.19 模型评估指标

模型训练完，如何判断它好不好？准确率最直观，但类别不平衡时（比如 99% 是负类，模型全猜负类就有 99% 准确率）它很有欺骗性。`sklearn.metrics` 提供一整套分类、回归指标，以及距离度量和核函数。选对指标，才能正确判断模型是否真的解决了业务问题。

## 1.19.1 分类指标

### 准确率 accuracy_score

准确率是预测正确的样本占比：

$$
\text{accuracy} = \frac{\text{预测正确的样本数}}{\text{样本总数}}
$$

它最直观，但只在类别均衡时可靠：

```python
from sklearn.metrics import accuracy_score

y_true = [0, 1, 1, 0, 1]
y_pred = [0, 1, 0, 0, 1]
print(accuracy_score(y_true, y_pred))   # 0.8
```

### 混淆矩阵 confusion_matrix

混淆矩阵按真实类别与预测类别交叉计数，是理解其他指标的基础。二分类的四象限：

$$
\begin{array}{c|cc}
 & \text{预测正类} & \text{预测负类} \\
\hline
\text{真实正类} & TP & FN \\
\text{真实负类} & FP & TN \\
\end{array}
$$

TP 是真阳性（实际为正、预测为正），FP 是假阳性（实际为负、预测为正），TN 是真阴性（实际为负、预测为负），FN 是假阴性（实际为正、预测为负）。行是真实类别，列是预测类别：

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

y_true = [0, 1, 1, 0, 1, 0, 1, 1]
y_pred = [0, 1, 0, 0, 1, 0, 1, 0]
cm = confusion_matrix(y_true, y_pred)
print(cm)

ConfusionMatrixDisplay(cm).plot()
plt.show()
```

`ConfusionMatrixDisplay` 把混淆矩阵可视化为热力图，便于观察哪些类别容易被混淆。

### 精确率与召回率

精确率（precision）回答：**预测为正的里面，有多少真的为正**：

$$
P = \frac{TP}{TP+FP}
$$

召回率（recall）回答：**实际为正的里面，有多少被找出来了**：

$$
R = \frac{TP}{TP+FN}
$$

两者存在权衡：把阈值调高、预测更保守，精确率高但召回率低；放宽阈值把所有样本都判为正，召回率高但精确率低。垃圾邮件过滤更看重精确率（别把正常邮件误杀），癌症筛查更看重召回率（别漏掉病人）：

```python
from sklearn.metrics import precision_score, recall_score

print(precision_score(y_true, y_pred))   # P
print(recall_score(y_true, y_pred))      # R
```

### F1 分数与 Fbeta

F1 分数是精确率与召回率的调和平均，同时惩罚两者：

$$
F_1 = 2\frac{P \cdot R}{P + R}
$$

调和平均对低值更敏感，P 和 R 任何一个差，F1 都会被拉低：

```python
from sklearn.metrics import f1_score, fbeta_score

print(f1_score(y_true, y_pred))
print(fbeta_score(y_true, y_pred, beta=2))   # beta>1 更看重召回率
```

`fbeta_score` 用 $\beta$ 调节权重：$\beta>1$ 时更看重召回率，$\beta<1$ 时更看重精确率，$\beta=1$ 就是 F1。

### ROC 曲线与 AUC

分类模型通常输出概率，通过阈值决定正负类。**ROC 曲线**（Receiver Operating Characteristic）画出不同阈值下**真阳性率 TPR**（即召回率）与**假阳性率 FPR** 的关系：

$$
TPR = \frac{TP}{TP+FN}, \quad FPR = \frac{FP}{FP+TN}
$$

TPR 是找出来的正类比例，FPR 是被误判为正的负类比例。把阈值从高到低扫一遍，每个阈值得到一个 $(FPR, TPR)$ 点，连成曲线。曲线越靠近左上角，模型越好。**AUC** 是曲线下面积，等于「随机取一个正例和一个负例，正例得分排在负例前面的概率」。AUC 为 1 是完美，0.5 等于随机猜：

```python
from sklearn.metrics import roc_curve, roc_auc_score

y_scores = [0.1, 0.4, 0.6, 0.3, 0.9, 0.2, 0.8, 0.7]   # 模型输出的概率
fpr, tpr, thresholds = roc_curve(y_true, y_scores)
print(fpr, tpr)
print(roc_auc_score(y_true, y_scores))
```

`roc_curve(y_true, y_scores)` 返回 FPR、TPR、阈值三个数组，可直接画图；`roc_auc_score` 直接给出 AUC 数值。

### PR 曲线与平均精度

**PR 曲线**（Precision-Recall）画出不同阈值下精确率与召回率的关系。类别严重不平衡时，PR 曲线比 ROC 更敏感，因为 ROC 的 FPR 分母是庞大的负类样本数，会掩盖正类上的表现：

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

precision, recall, thresholds = precision_recall_curve(y_true, y_scores)
print(precision, recall)
print(average_precision_score(y_true, y_scores))
```

`average_precision_score` 是 PR 曲线下的面积，数值越大越好。

### classification_report 分类报告

`classification_report` 一次性输出每个类别的精确率、召回率、F1 和支持样本数，方便总览：

```python
from sklearn.metrics import classification_report

print(classification_report(y_true, y_pred,
                            target_names=['负类', '正类']))
```

输出每个类别一行，最后一行是加权平均。

### 其他分类损失

```python
from sklearn.metrics import log_loss, zero_one_loss, hinge_loss
from sklearn.metrics import matthews_corrcoef, cohen_kappa_score
from sklearn.metrics import hamming_loss, jaccard_score

y_prob = [[0.9, 0.1], [0.2, 0.8], [0.4, 0.6]]
print(log_loss([0, 1, 1], y_prob))       # 对数损失,基于预测概率
print(zero_one_loss([0, 1, 1], [0, 1, 0]))   # 0-1 损失,即错误率
print(hinge_loss([0, 1, 1], [1.2, -0.5, 0.8]))   # 铰链损失,SVM 用

print(matthews_corrcoef(y_true, y_pred))      # MCC,类别不平衡时稳健
print(cohen_kappa_score(y_true, y_pred))      # 科恩卡帕,衡量一致性
```

`log_loss` 需要预测概率，惩罚「自信的错判」；`hinge_loss` 接受原始决策分数，是 SVM 的目标函数；`matthews_corrcoef`（MCC）综合四象限信息，取值 -1 到 1，类别极不平衡时比准确率可靠；`cohen_kappa_score` 衡量预测与真实的偶然一致性；`hamming_loss` 与 `jaccard_score` 用于多标签。

## 1.19.2 回归指标

### 均方误差 MSE 与 RMSE

均方误差是预测值与真实值差的平方的平均：

$$
MSE = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2
$$

$y_i$ 是第 $i$ 个样本的真实值，$\hat{y}_i$ 是预测值。平方让误差都为正，且**大误差被放大**，因此 MSE 对离群点敏感。RMSE 取平方根，把单位还原回原始尺度：

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error

y_true_r = [3.0, -0.5, 2.0, 7.0]
y_pred_r = [2.5, 0.0, 2.0, 8.0]

mse = mean_squared_error(y_true_r, y_pred_r)
rmse = mean_squared_error(y_true_r, y_pred_r, squared=False)   # RMSE
print(mse, rmse)
```

`mean_squared_error` 的 `squared=False` 直接返回 RMSE（均方根误差）。RMSE 与原始目标同单位，更直观。

### 平均绝对误差 MAE

MAE 是误差绝对值的平均，对离群点不如 MSE 敏感：

$$
MAE = \frac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|
$$

```python
print(mean_absolute_error(y_true_r, y_pred_r))
```

`median_absolute_error` 是中位数绝对误差，对离群点最稳健。对比：MSE 惩罚大误差更狠，MAE 更均衡，选哪个取决于业务是否难以容忍个别大误差。

### 决定系数 R2

决定系数衡量模型解释了多少方差：

$$
R^2 = 1 - \frac{SS_{res}}{SS_{tot}} = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}
$$

$SS_{res}$ 是残差平方和（预测与真实的差距），$SS_{tot}$ 是总平方和（真实值与均值 $\bar{y}$ 的差距，即用均值当预测时的误差）。$R^2=1$ 表示完美拟合；$R^2=0$ 表示和「永远预测均值」效果一样；可为负数，表示比预测均值还差：

```python
from sklearn.metrics import r2_score, explained_variance_score

print(r2_score(y_true_r, y_pred_r))
print(explained_variance_score(y_true_r, y_pred_r))
```

`explained_variance_score` 是解释方差得分，衡量预测对目标方差的解释比例，与 $R^2$ 相近，区别在于它不除以总平方和而是直接对比方差。

### 广义线性模型偏差与其他

广义线性模型（泊松、伽马等）用**偏差**（deviance）评估，比 MSE 更适合非正态分布的目标：

```python
from sklearn.metrics import mean_poisson_deviance, mean_gamma_deviance
from sklearn.metrics import mean_tweedie_deviance, max_error

# 假设目标是计数或正实数
print(mean_poisson_deviance(y_true_r, y_pred_r))
print(mean_gamma_deviance(y_true_r, y_pred_r))
print(mean_tweedie_deviance(y_true_r, y_pred_r, power=1.5))
print(max_error(y_true_r, y_pred_r))   # 最大绝对误差
```

`mean_poisson_deviance` 适合计数目标，`mean_gamma_deviance` 适合正实值目标，`mean_tweedie_deviance` 通过 `power` 参数统一两者（power=0 接近 MSE，1 泊松，2 伽马）。Huber 损失介于 MSE 与 MAE 之间，对离群点稳健，通常在 `sklearn.linear_model.HuberRegressor` 中使用。`max_error` 返回最大的单个误差。

## 1.19.3 成对距离与核

### 距离度量

`sklearn.metrics.pairwise` 提供成对样本间距离的计算。欧氏距离、曼哈顿距离、切比雪夫距离是闵可夫斯基距离 $d(x,y) = \left(\sum_k |x_k - y_k|^p\right)^{1/p}$ 在 $p=2, 1, \infty$ 时的特例：

```python
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.metrics.pairwise import euclidean_distances, manhattan_distances
from sklearn.metrics.pairwise import cosine_distances, cosine_similarity
import numpy as np

X_a = np.array([[1, 2], [3, 4]])
X_b = np.array([[1, 0], [0, 1]])

print(euclidean_distances(X_a, X_b))       # 欧氏距离
print(manhattan_distances(X_a, X_b))       # 曼哈顿距离
print(cosine_distances(X_a, X_b))          # 余弦距离(1 - 余弦相似度)
print(cosine_similarity(X_a, X_b))         # 余弦相似度

print(pairwise_distances(X_a, X_b, metric='euclidean'))
```

`pairwise_distances` 是通用接口，`metric` 参数可选 `'euclidean'`（欧氏）、`'manhattan'`（曼哈顿）、`'chebyshev'`（切比雪夫）、`'minkowski'`（闵可夫斯基）、`'cosine'`（余弦）、`'correlation'`（相关）等。`pairwise_distances_argmin` 返回每个样本到另一组中最近样本的索引。

### 距离核函数

核函数把两个样本的相似度映射为某个数值，供 SVM、核岭回归等使用：

```python
from sklearn.metrics.pairwise import rbf_kernel, laplacian_kernel
from sklearn.metrics.pairwise import polynomial_kernel, sigmoid_kernel

print(rbf_kernel(X_a, X_b, gamma=0.5))         # 高斯核
print(laplacian_kernel(X_a, X_b, gamma=0.5))   # 拉普拉斯核
print(polynomial_kernel(X_a, X_b, degree=3))   # 多项式核
print(sigmoid_kernel(X_a, X_b, coef0=1))       # Sigmoid 核
```

RBF 核（高斯核）最常见，$k(x,y)=\exp(-\gamma\|x-y\|^2)$，$\gamma$ 控制影响半径；`laplacian_kernel` 用 L1 距离替代 L2，对离群点更稳健；`polynomial_kernel` 对应多项式特征空间；`sigmoid_kernel` 对应神经网络的激活函数形式。

## 练习题

### 第1题 概念理解

说明精确率与召回率的区别与权衡；说明 ROC 曲线的横纵轴含义和 AUC 的直观意义；说明 MSE 与 MAE 的差异及各自的适用场景。

::: details 参考答案

精确率是预测为正中真实为正的比例，召回率是真实正中被找出的比例。调高阈值提高精确率但降低召回率，反之亦然。ROC 横轴是假阳性率 FPR，纵轴是真阳性率 TPR，AUC 等于随机正例排在随机负例前面的概率。MSE 平方放大误差、对离群点敏感，MAE 更均衡稳健；不能容忍大误差时倾向 MSE，更在意整体误差时用 MAE。
:::

### 第2题 代码编写

训练一个逻辑回归模型，计算混淆矩阵、精确率、召回率、F1 与 classification_report；计算回归数据的 MSE、RMSE、MAE、$R^2$。

::: details 参考答案

```python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (confusion_matrix, precision_score, recall_score,
                             f1_score, classification_report,
                             mean_squared_error, mean_absolute_error, r2_score)
from sklearn.datasets import make_regression

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
model = LogisticRegression(max_iter=2000)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(confusion_matrix(y_test, y_pred))
print(precision_score(y_test, y_pred))
print(recall_score(y_test, y_pred))
print(f1_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

Xr, yr = make_regression(n_samples=200, noise=0.1, random_state=0)
Xr_train, Xr_test, yr_train, yr_test = train_test_split(Xr, yr, random_state=0)
from sklearn.linear_model import LinearRegression
reg = LinearRegression().fit(Xr_train, yr_train)
yr_pred = reg.predict(Xr_test)

print(mean_squared_error(yr_test, yr_pred))
print(mean_squared_error(yr_test, yr_pred, squared=False))
print(mean_absolute_error(yr_test, yr_pred))
print(r2_score(yr_test, yr_pred))
```

:::

### 第3题 进阶练习

输出模型的预测概率，画 ROC 曲线并计算 AUC；再用 `precision_recall_curve` 画 PR 曲线并计算 `average_precision_score`；最后用 `pairwise_distances` 计算两种度量并比较 `cosine_distances` 与 `cosine_similarity` 的关系。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (roc_curve, roc_auc_score,
                             precision_recall_curve, average_precision_score,
                             pairwise_distances, cosine_distances,
                             cosine_similarity)
import numpy as np

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
model = LogisticRegression(max_iter=2000)
model.fit(X_train, y_train)
y_scores = model.predict_proba(X_test)[:, 1]

fpr, tpr, _ = roc_curve(y_test, y_scores)
plt.plot(fpr, tpr)
plt.xlabel('FPR')
plt.ylabel('TPR')
plt.title(f'AUC={roc_auc_score(y_test, y_scores):.3f}')
plt.show()

precision, recall, _ = precision_recall_curve(y_test, y_scores)
plt.plot(recall, precision)
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title(f'AP={average_precision_score(y_test, y_scores):.3f}')
plt.show()

A = np.array([[1, 2], [3, 4]])
print(pairwise_distances(A, metric='euclidean'))
print(cosine_distances(A, A))
print(cosine_similarity(A, A))
```

:::

## 常见错误

**错误 1 · 类别不平衡时只用准确率评估**

原因:全猜多数类就有很高准确率,掩盖模型实际无效。

解决:改用精确率、召回率、F1、AUC 或 MCC。

**错误 2 · `roc_curve` 传入的是预测类别而不是预测概率**

原因:ROC 需要把样本按得分排序,类别标签丢失排序信息。

解决:传入 `predict_proba` 输出的正类概率,而非 `predict` 的类别。

**错误 3 · `mean_squared_error` 想拿 RMSE 却手动开方失败**

原因:旧版本要 `np.sqrt(mse)`,麻烦且易错。

解决:用 `mean_squared_error(..., squared=False)` 直接得 RMSE。

**错误 4 · 多分类时 `f1_score` 报错或默认值不符合预期**

原因:多分类需要指定平均方式,默认 `binary` 只适用于二分类。

解决:用 `average='macro'`（各类别等权平均）或 `'weighted'`（按样本数加权）。

**错误 5 · `r2_score` 得到负数以为是报错**

原因:$R^2$ 可以为负,表示模型比「永远预测均值」还差。

解决:负值说明模型拟合不佳,先检查数据与模型,而不是怀疑函数出错。

**错误 6 · `pairwise_distances` 的 metric 拼写错误**

原因:距离度量名必须是 scikit-learn 支持的字符串,写错直接报错。

解决:用 `'euclidean'`、`'manhattan'`、`'cosine'` 等标准名称。
