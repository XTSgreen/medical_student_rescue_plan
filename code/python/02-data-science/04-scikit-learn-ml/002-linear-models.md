---
title: 1.2 线性模型
sidebar:
  order: 2
---
# 1.2 线性模型

面对一份数据，最简单的建模思路是假设输出是输入的线性组合。线性模型参数少、训练快、结果可解释，是大多数机器学习任务的起点，也是理解正则化、稀疏性与梯度下降的载体。本节围绕 `sklearn.linear_model`，从最小二乘出发，逐步引入 L2 正则、L1 正则、贝叶斯方法与逻辑回归，最后介绍鲁棒回归与随机梯度下降。

## 1.2.1 普通最小二乘 LinearRegression

`LinearRegression` 用普通最小二乘(OLS)拟合线性关系，目标是找到系数向量 $w$，使所有样本的预测误差平方和最小：

$$
\min_w \|Xw - y\|_2^2
$$

其中 $X$ 是特征矩阵（每行一个样本，每列一个特征），$y$ 是真实标签，$Xw$ 是模型的线性预测。这个式子读作：让预测值与真实值之差的平方和最小。

```python
from sklearn.linear_model import LinearRegression

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
model = LinearRegression().fit(X, y)
print(model.coef_)       # [2. 3.]
print(model.intercept_)  # 1.0
```

OLS 有解析解，可以直接把系数算出来而无需迭代：

$$
\hat{w} = (X^TX)^{-1}X^Ty
$$

它来自对目标函数求导并令导数为零。$X^TX$ 是特征的自相关矩阵，要求它可逆；当特征之间存在高度共线性或特征数多于样本数时，$X^TX$ 不可逆，解析解失效。这正是后面正则化方法要解决的问题。

## 1.2.2 岭回归 Ridge 与 RidgeClassifier

**岭回归(Ridge)** 在 OLS 目标上加一项 L2 正则，惩罚系数向量的平方和：

$$
\min_w \|y - Xw\|_2^2 + \alpha\|w\|_2^2
$$

第一项仍是拟合误差，第二项 $\alpha\|w\|_2^2$ 把系数向量的长度平方乘上 $\alpha$ 加入损失。惩罚项的作用是让系数不要过大，数值上使 $X^TX + \alpha I$ 总是可逆，从而解决共线性和特征数多于样本数的问题。$\alpha$ 越大，系数被压得越小，模型越简单。

```python
from sklearn.linear_model import Ridge

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
model = Ridge(alpha=1.0).fit(X, y)
print(model.coef_)
```

`RidgeClassifier` 把分类问题转化为回归问题再套用岭回归：对二分类，把两类标签编码为 -1 和 1，用岭回归拟合后按符号判类。它适合类别数量多、特征维度高的场景，训练比逻辑回归更快。

## 1.2.3 Lasso 与 MultiTaskLasso

**Lasso** 用 L1 正则替换 L2 正则：

$$
\min_w \|y - Xw\|_2^2 + \alpha\|w\|_1
$$

其中 $\|w\|_1 = \sum_j |w_j|$ 是系数绝对值之和。L1 惩罚的几何特性会让部分系数被精确压到 0，产生**稀疏解**：模型自动挑选出少数重要特征，其余特征系数为 0。这在特征上千上万的高维问题中价值很大，等于内嵌了特征选择。

```python
from sklearn.linear_model import Lasso

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
model = Lasso(alpha=0.1).fit(X, y)
print(model.coef_)   # 部分系数可能为 0
```

`MultiTaskLasso` 处理多个输出同时共享同一组稀疏特征的场景，比如同时预测病人的多项指标，它对所有输出的系数整体施加 L1 正则，促使不同任务选择相同的特征子集。

## 1.2.4 ElasticNet 与 MultiTaskElasticNet

**弹性网络(ElasticNet)** 同时施加 L1 与 L2 正则：

$$
\min_w \frac{1}{2}\|y - Xw\|_2^2 + \alpha\rho\|w\|_1 + \frac{\alpha(1-\rho)}{2}\|w\|_2^2
$$

其中 $\rho$ 对应参数 `l1_ratio`，取值 0 到 1，控制 L1 与 L2 的权重比例。L1 部分保留稀疏性，L2 部分在特征强相关时保持稳定性并让系数均匀收缩。当特征之间高度相关时，单独用 Lasso 会随机丢弃其中某些特征，ElasticNet 则更稳定，是实践中的常用选择。

```python
from sklearn.linear_model import ElasticNet

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
model = ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X, y)
print(model.coef_)
```

`MultiTaskElasticNet` 与 `MultiTaskLasso` 思路一致，把多任务 L1 与 L2 正则结合，用于多输出共享稀疏结构的回归问题。

## 1.2.5 最小角回归 Lars 与 LassoLars

**最小角回归(LARS)** 是一种高效的稀疏系数求解算法，它逐步加入特征，每一步让当前残差与新加入特征的相关性走向最小。其计算复杂度与特征数同阶，在特征远多于样本时比直接求解更快。`LassoLars` 用 LARS 路径求解 Lasso 问题，两者都适合高维稀疏场景。

```python
from sklearn.linear_model import Lars, LassoLars

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
model_lars = Lars().fit(X, y)
model_lasso_lars = LassoLars(alpha=0.1).fit(X, y)
print(model_lars.coef_)
print(model_lasso_lars.coef_)
```

LARS 的主要特点是系数变化路径呈分段线性，因此可以一次性算出所有 $\alpha$ 下的解，方便通过交叉验证挑选惩罚强度。

## 1.2.6 正交匹配追踪 OrthogonalMatchingPursuit

**正交匹配追踪(OMP)** 是求解稀疏解的另一类贪心算法。它每次选出与当前残差相关性最强的特征，把该特征加入支撑集，再用最小二乘在支撑集上重新拟合，如此重复直到满足预设的稀疏度。与 Lasso 的凸优化不同，OMP 直接控制非零系数的个数。

```python
from sklearn.linear_model import OrthogonalMatchingPursuit

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
omp = OrthogonalMatchingPursuit(n_nonzero_coefs=2).fit(X, y)
print(omp.coef_)   # 至多 2 个非零系数
```

`n_nonzero_coefs` 指定最多保留的非零系数个数；不指定时也可用 `tol` 控制残差阈值。OMP 在信号压缩感知类问题（如从少量测量中重建信号）中很常用。

## 1.2.7 贝叶斯线性回归 BayesianRidge 与 ARDRegression

**贝叶斯视角**把系数当作随机变量，而不是固定未知值。`BayesianRidge` 假设系数服从以 0 为中心的先验分布，通过数据更新得到后验，自动估计噪声方差与正则强度，因此不需要手动调 $\alpha$。`ARDRegression`（自动相关性决定）为每个系数单独设定先验方差，能自动判断每个特征是否相关，产生类似稀疏的效果，适合需要特征重要性判断的场景。

```python
from sklearn.linear_model import BayesianRidge, ARDRegression

X = [[1, 1], [1, 2], [2, 2], [2, 3]]
y = [6, 8, 9, 11]
br = BayesianRidge().fit(X, y)
print(br.coef_)

ard = ARDRegression().fit(X, y)
print(ard.coef_)
```

两者都给出点估计（`coef_`）与不确定度估计（`sigma_`），适合样本量较小、需要不确定性信息的问题。

## 1.2.8 逻辑回归 LogisticRegression

**逻辑回归**名字含回归，实际是分类器。它先把线性组合 $x_i^Tw$ 送入 **sigmoid 函数** $\sigma(z)=1/(1+e^{-z})$，得到样本属于正类的概率，再用最大似然估计参数。其对数损失为：

$$
\ell(w) = \sum_i \log(1 + e^{-y_i x_i^T w})
$$

其中 $y_i$ 取 +1 或 -1。当模型对真实类别 $y_i$ 的线性得分 $y_i x_i^T w$ 越大（预测越正确），对应项 $\log(1+e^{-y_i x_i^T w})$ 越小，因此整个损失对正确预测惩罚轻、对错误预测惩罚重。

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
model = LogisticRegression(max_iter=500).fit(X, y)
print(model.predict(X[:3]))
print(model.classes_)
```

`multi_class` 参数控制多分类策略：`'ovr'` 用一对多训练多个二分类器，`'multinomial'` 直接做多项逻辑回归，后者在类别多、样本充足时通常更准确。`solver` 参数选择优化算法：`'lbfgs'` 适合中小数据且能处理 L2 正则，`'liblinear'` 适合小数据集，`'saga'` 支持 L1 正则和大数据。`LogisticRegressionCV` 用内置交叉验证自动挑选最优的 `C` 参数。

## 1.2.9 广义线性模型 GeneralizedLinearRegressor

**广义线性模型(GLM)** 把线性回归推广到输出服从指数族分布的场景，通过**链接函数(link function)**把线性预测 $Xw$ 与分布均值联系起来。sklearn 中的 `PoissonRegressor`、`GammaRegressor`、`TweedieRegressor` 分别对应泊松分布、伽马分布与 Tweedie 分布，适合计数数据、正数连续数据等。

```python
from sklearn.linear_model import PoissonRegressor, GammaRegressor, TweedieRegressor

Xp = [[1], [2], [3], [4], [5], [6]]
counts = [1, 2, 0, 3, 5, 1]
poisson = PoissonRegressor().fit(Xp, counts)
print(poisson.coef_)

gammas = [1.2, 2.1, 0.9, 3.0, 4.5, 1.8]
gamma = GammaRegressor().fit(Xp, gammas)
print(gamma.coef_)

tweedie = TweedieRegressor(power=1.5).fit(Xp, counts)
print(tweedie.coef_)
```

`power` 参数决定分布族：`power=0` 是高斯分布，退化为普通线性回归；`power=1` 是泊松；`power=2` 是伽马；`power=3` 是逆高斯。选对 `power` 与链接函数，能把线性模型用到非高斯输出上。

## 1.2.10 随机梯度下降 SGDRegressor 与 SGDClassifier

当数据量大到无法一次装入内存时，基于解析解或批量优化的方法会力不从心。**随机梯度下降(SGD)** 每次只用一个样本（或一小批）估计梯度并更新参数：

$$
w \leftarrow w - \eta \nabla L(w)
$$

其中 $\eta$ 是学习率，控制每次更新的步长，$\nabla L(w)$ 是损失函数对参数的梯度。公式表示：沿着损失下降最快的方向，以步长 $\eta$ 挪动参数。`SGDRegressor` 用于回归，`SGDClassifier` 用于分类。

```python
from sklearn.linear_model import SGDRegressor, SGDClassifier

Xs = [[1, 1], [1, 2], [2, 2], [2, 3]]
ys = [6, 8, 9, 11]
reg = SGDRegressor(max_iter=1000, random_state=0).fit(Xs, ys)
print(reg.coef_)

Xc = [[1, 1], [1, 2], [2, 2], [2, 3]]
yc = [0, 0, 1, 1]
clf = SGDClassifier(loss='log_loss', max_iter=1000, random_state=0).fit(Xc, yc)
print(clf.coef_)
```

`loss` 参数指定损失函数：`'squared_error'` 是平方损失（回归），`'log_loss'` 是逻辑损失，`'hinge'` 是合页损失（线性 SVM）。`penalty` 指定正则类型（`l2`、`l1`、`elasticnet`），`learning_rate` 选择学习率策略（`'constant'`、`'invscaling'`、`'adaptive'`）。SGD 的迭代特点决定了它对特征尺度敏感，使用前通常要把特征标准化。

## 1.2.11 Perceptron 与 PassiveAggressive

**感知机(Perceptron)** 是最简单的线性分类器，每次遇到分类错误就修正权重：

$$
w \leftarrow w + \eta \, y_i x_i
$$

当样本 $i$ 被分错时，把权重朝 $y_i x_i$ 的方向挪动一步，使该样本的得分向正确方向靠拢。它训练极快，但只能在数据线性可分时收敛。

```python
from sklearn.linear_model import Perceptron

Xc = [[1, 1], [1, 2], [2, 2], [2, 3]]
yc = [0, 0, 1, 1]
perc = Perceptron().fit(Xc, yc)
print(perc.predict(Xc[:3]))
```

**被动攻击算法(Passive-Aggressive)** 类似感知机，但更新量由损失大小决定：损失小则小步修正，损失大则大步修正，更新后保证当前样本分类正确（因此得名）。`PassiveAggressiveClassifier` 与 `PassiveAggressiveRegressor` 适合在线学习与流式数据场景。

## 1.2.12 鲁棒回归

普通最小二乘对**异常值**非常敏感：一个远离整体的点会显著拉动回归线。鲁棒回归通过调整损失函数削弱异常值的影响。

`RANSACRegressor`（随机抽样一致性）反复随机抽取少量样本拟合模型，统计能拟合多少内点，最终保留内点最多的模型。`TheilSenRegressor` 用所有样本对斜率的中位数估计回归，对异常值比例高时依然稳健。`HuberRegressor` 对小误差用平方损失、对大误差用线性损失，通过参数 `epsilon` 划定切换点。`QuantileRegressor` 估计条件分位数（如中位数、95% 分位），适合刻画分布而非均值。

```python
from sklearn.linear_model import RANSACRegressor, TheilSenRegressor, HuberRegressor, QuantileRegressor
import numpy as np

rng = np.random.RandomState(0)
Xr = rng.randn(40, 2)
yr = 1.5 * Xr[:, 0] - 0.5 * Xr[:, 1] + rng.randn(40)

ransac = RANSACRegressor().fit(Xr, yr)
print(ransac.estimator_.coef_)

huber = HuberRegressor(epsilon=1.35).fit(Xr, yr)
print(huber.coef_)

quantile = QuantileRegressor(quantile=0.5).fit(Xr, yr)
print(quantile.coef_)

theil = TheilSenRegressor().fit(Xr, yr)
print(theil.coef_)
```

选择依据：数据中异常值很少但个别离谱，用 RANSAC；异常值比例高，用 TheilSen；希望在稳健与效率之间取平衡，用 Huber；需要估计分位数边界，用 QuantileRegressor。

## 1.2.13 PolynomialFeatures 与线性模型

线性模型的假设是输出与特征线性相关。**多项式特征(PolynomialFeatures)** 把原始特征的幂与交叉项作为新特征，让线性模型也能拟合非线性关系。

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

X1 = [[1], [2], [3], [4]]
y1 = [1, 4, 9, 16]   # 二次关系

poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X1)
print(X_poly)   # 每行变为 [x, x^2]

model = LinearRegression().fit(X_poly, y1)
print(model.coef_)   # 逼近 [0, 1]，即 y = x^2
```

生成的新特征是 $[x, x^2, x_1x_2, \dots]$ 的组合，线性模型在这些特征上仍然是线性的，但整体上能表达曲线。要注意：特征膨胀会带来过拟合与共线性，通常与岭回归一起使用，并通过 `degree` 控制复杂度。

## 1.2.14 SGDOneClassSVM

`SGDOneClassSVM` 用随机梯度下降求解单类支持向量机，用于**异常检测**：只用一个类的正常样本训练，模型学习正常数据的边界，新样本如果偏离边界过远就被判定为异常。相比基于核的 `OneClassSVM`，它在大规模数据上更快，可扩展到几十万样本。

```python
from sklearn.linear_model import SGDOneClassSVM
import numpy as np

normal = np.random.normal(0, 1, (100, 2))
model = SGDOneClassSVM().fit(normal)
test = np.array([[0.0, 0.0], [10.0, 10.0]])
print(model.predict(test))   # [ 1 -1]，1 正常，-1 异常
```

预测返回 1 表示正常、-1 表示异常。该模型适合正常样本量大、异常样本少甚至缺失的监控场景。

## 练习题

### 第1题 概念理解

说明 OLS 的目标函数与解析解；说明岭回归与 Lasso 各自的正则形式及效果差异；说明逻辑回归如何把线性得分转成概率。

::: details 参考答案

OLS 最小化 $\min_w\|Xw - y\|_2^2$，解析解为 $\hat{w} = (X^TX)^{-1}X^Ty$。岭回归加 L2 惩罚 $\alpha\|w\|_2^2$，系数整体收缩且保证矩阵可逆；Lasso 加 L1 惩罚 $\alpha\|w\|_1$，部分系数被压成 0 产生稀疏解。逻辑回归把 $x^Tw$ 送入 sigmoid 得到概率，再用对数损失最大化似然。
:::

### 第2题 代码编写

用 `make_regression` 生成回归数据，分别用 `LinearRegression`、`Ridge`、`Lasso` 拟合并比较系数；对 `make_classification` 数据用 `LogisticRegression` 分类并查看 `coef_`。

::: details 参考答案

```python
from sklearn.datasets import make_regression, make_classification
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression

X, y = make_regression(n_samples=100, n_features=5, noise=0.1)
for name, model in [('OLS', LinearRegression()), ('Ridge', Ridge(alpha=1.0)),
                    ('Lasso', Lasso(alpha=0.1))]:
    model.fit(X, y)
    print(name, model.coef_)

Xc, yc = make_classification(n_samples=100, n_features=4, random_state=0)
clf = LogisticRegression(max_iter=500).fit(Xc, yc)
print(clf.coef_)
```

:::

### 第3题 进阶练习

用 `PolynomialFeatures` 配合岭回归拟合二次曲线数据，对比不同 `degree` 的预测误差；用 `SGDClassifier(loss='hinge')` 训练线性 SVM 并说明其与 `LinearSVC` 的关系。

::: details 参考答案

```python
import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge, SGDClassifier
from sklearn.datasets import make_classification

x = np.linspace(0, 1, 30).reshape(-1, 1)
y = x.ravel() ** 2 + 0.05 * np.random.randn(30)

for degree in [1, 2, 5]:
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    Xp = poly.fit_transform(x)
    model = Ridge(alpha=1.0).fit(Xp, y)
    err = np.mean((model.predict(Xp) - y) ** 2)
    print(degree, err)

Xc, yc = make_classification(n_samples=200, n_features=6, random_state=0)
sgd = SGDClassifier(loss='hinge', max_iter=2000).fit(Xc, yc)
print(sgd.score(Xc, yc))
```

:::

## 常见错误

**错误 1 · `LogisticRegression` 报 `ConvergenceWarning` 或准确率异常**

原因:默认 `max_iter` 偏小或数据未标准化,算法没收敛。

解决:调大 `max_iter`,对特征做 `StandardScaler` 标准化,必要时更换 `solver`。

**错误 2 · Lasso 把所有系数都压成 0**

原因:`alpha` 设得过大,惩罚过强。

解决:调小 `alpha`,或用 `LassoCV` 通过交叉验证自动选择。

**错误 3 · OLS 数值崩溃或结果奇异**

原因:特征共线或特征数多于样本数,自相关矩阵不可逆。

解决:改用 `Ridge`、`Lasso` 等带正则的方法,或先做特征选择。

**错误 4 · SGD 模型效果很差或发散**

原因:特征尺度差异大,SGD 对尺度敏感;学习率不合适。

解决:先 `StandardScaler` 标准化,调整 `learning_rate` 与 `eta0`。

**错误 5 · 用 `Ridge` 处理分类问题结果奇怪**

原因:岭回归是回归器,输出连续值,直接用于分类语义不符。

解决:分类用 `RidgeClassifier` 或 `LogisticRegression`,回归用 `Ridge`。
