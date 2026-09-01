---
title: 1.12 神经网络与保序回归
sidebar:
  order: 12
---
# 1.12 神经网络与保序回归

很多问题没有现成的公式：给定一堆特征，到底用什么函数关系把它们映射成结果？神经网络给出一个通用答案——用大量**加权求和加激活**的小单元堆叠出任意复杂函数，再靠数据把参数调出来。本节讲 `sklearn.neural_network` 的多层感知机（MLP）。而另一类问题要求结果必须单调：价格越高销量越低、年龄越大风险越高。`sklearn.isotonic` 的保序回归专门拟合这样的单调函数。一节讲万能拟合，一节讲受限拟合。

## 1.12.1 多层感知机的结构

多层感知机（MLP）由若干层神经元组成：**输入层**接收特征向量，**隐藏层**逐层加工，**输出层**给出预测。每一层的每个神经元把上一层的输出加权求和，再加一个偏置，最后过激活函数：

$$
a = \sigma(Wx + b)
$$

其中 $x$ 是本层输入向量，$W$ 是权重矩阵（$W$ 的第 $i$ 行 $j$ 列表示第 $j$ 个输入对第 $i$ 个神经元的贡献），$b$ 是偏置向量（相当于神经元的基础兴奋度），$\sigma$ 是激活函数，$a$ 是本层输出。权重和偏置就是整个网络要学的参数。

```python
from sklearn.neural_network import MLPClassifier

# 两个隐藏层，每层 10 个神经元
model = MLPClassifier(hidden_layer_sizes=(10, 10), activation='relu',
                      max_iter=1000, random_state=0)
```

`hidden_layer_sizes=(10, 10)` 表示两个隐藏层、每层 10 个神经元。层数越深、每层神经元越多，模型表达能力越强，但越容易过拟合，需要更多数据支撑。

## 1.12.2 激活函数

激活函数给加权求和的结果引入**非线性**。如果没有激活函数，多层线性变换可以合并成一次线性变换，网络再深也只是一条直线，无法拟合复杂数据。sklearn 支持三种激活函数：

**ReLU**（修正线性单元）是默认选项，简单且训练快：

$$
\text{ReLU}(z)=\max(0,z)
$$

$z$ 是加权求和的结果。正数原样保留、负数截成 0，计算极快，还能缓解梯度消失，是深度学习的主流选择。

**tanh**（双曲正切）把输出压缩到 $(-1,1)$：

$$
\tanh(z)=\frac{e^z-e^{-z}}{e^z+e^{-z}}
$$

$z$ 越大输出越接近 1，越小越接近 -1。输出有正有负，收敛通常比 logistic 快，但对大 $z$ 两端梯度趋近 0，容易饱和。

**logistic**（sigmoid）把输出压缩到 $(0,1)$：

$$
\sigma(z)=\frac{1}{1+e^{-z}}
$$

$z$ 越大输出越接近 1，越小越接近 0，适合输出层表达概率。缺点是输出恒为正、存在饱和区。

```python
for name in ['relu', 'tanh', 'logistic']:
    model = MLPClassifier(hidden_layer_sizes=(10,), activation=name,
                          max_iter=1000, random_state=0)
    model.fit(X_train, y_train)
    print(name, model.score(X_test, y_test))
```

## 1.12.3 求解器与训练过程

训练的本质是**梯度下降**：定义一个损失函数衡量预测与真实的差距，例如回归用均方误差

$$
L=\frac{1}{n}\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
$$

其中 $y_i$ 是真实值，$\hat{y}_i$ 是模型预测值。然后沿着损失下降最快的方向反复调整权重：

$$
W \leftarrow W - \eta\,\nabla_W L
$$

$\eta$ 是学习率，控制每步走多大；$\nabla_W L$ 是损失对权重的梯度。**反向传播**是用链式法则从输出层向输入层高效地算出一层一层的梯度，有了梯度才能更新参数。

sklearn 提供三种求解器：

**SGD** 是标准随机梯度下降，每次用一小批样本算梯度更新一次，实现简单、省内存，但需要自己调学习率等超参数，收敛较慢。

**Adam** 是自适应矩估计，自动为每个参数调整学习率，收敛快、对超参数不敏感，实践中通常首选。

**LBFGS** 是拟牛顿法，利用损失函数的二阶曲率信息，小数据集上收敛快且结果稳定，但不适合样本量很大的情况。

```python
from sklearn.neural_network import MLPRegressor

mlp = MLPRegressor(hidden_layer_sizes=(50,), solver='adam',
                   alpha=0.01, batch_size=32, max_iter=500, random_state=0)
mlp.fit(X_train, y_train)
print(mlp.score(X_test, y_test))
```

## 1.12.4 MLPClassifier 与 MLPRegressor 的常用参数

`MLPClassifier` 处理分类（输出层用 softmax 输出各类概率），`MLPRegressor` 处理回归（输出层是线性单元，输出连续值）。两者共享一组关键参数：

`hidden_layer_sizes` 决定网络结构；`alpha` 是 L2 正则化系数，惩罚过大的权重以抑制过拟合；`batch_size` 是每次更新所用的样本数，`'auto'` 时等价于 200；`max_iter` 是最大迭代次数，训练不足会提前停止并报警告；`learning_rate_init` 是初始学习率；`early_stopping` 开启后会在验证集不再变好时提前终止。

```python
# 正则化对比：alpha 越大权重被压得越小，越不容易过拟合
for a in [0.0001, 0.01, 1.0]:
    model = MLPClassifier(hidden_layer_sizes=(50,), alpha=a,
                          max_iter=1000, random_state=0)
    model.fit(X_train, y_train)
    print(f'alpha={a}', '训练集', round(model.score(X_train, y_train), 3),
          '测试集', round(model.score(X_test, y_test), 3))
```

注意神经网络对数据尺度敏感：特征量级相差悬殊时梯度会被大数值特征主导，训练前应做标准化（见预处理章节的 `StandardScaler`）。

## 1.12.5 IsotonicRegression 保序回归

保序回归拟合一条**单调不减**（或单调不增）的曲线，适合**越…越…**型关系。它的目标是在保证 $\hat{y}_1\le\hat{y}_2\le\cdots\le\hat{y}_n$ 的前提下让拟合值尽量贴近观测值：

$$
\min_{\hat{y}_1\le\hat{y}_2\le\cdots\le\hat{y}_n}\ \sum_{i=1}^{n}(y_i-\hat{y}_i)^2
$$

约束要求预测序列单调不减，目标是最小化平方误差。直觉是：如果相邻两点破坏了单调性，就把它们合并成一段，用段内均值代替，反复合并直到整体单调。拟合结果是**分段常数**的阶梯函数，非参数、不假设任何具体函数形式。

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.isotonic import IsotonicRegression

rng = np.random.RandomState(0)
x = np.linspace(0, 5, 200)
y = np.exp(x) + 0.5 * rng.randn(200)     # 带噪声的指数关系，本身单调

iso = IsotonicRegression(increasing=True, out_of_bounds='clip')
y_pred = iso.fit_transform(x, y)

plt.scatter(x, y, s=8, alpha=0.5, label='观测')
plt.plot(x, y_pred, 'r-', label='保序回归')
plt.legend()
plt.show()
```

`increasing=True` 要求单调不减，`False` 则单调不增；`out_of_bounds='clip'` 表示对新数据超出训练范围时夹在边界值上。保序回归常用于概率校准、风险评分等需要输出单调可靠的任务。

## 练习题

### 第1题 概念理解

说明神经元公式 $a=\sigma(Wx+b)$ 中各符号的含义；说明为什么没有激活函数的深层网络等价于线性模型；说明 ReLU、tanh、logistic 三种激活函数的特点；说明反向传播在训练中的作用。

::: details 参考答案

$x$ 是输入，$W$ 是权重矩阵，$b$ 是偏置，$\sigma$ 是激活函数，$a$ 是输出。没有激活函数时多层线性变换可合并为一次线性变换，无法表达非线性关系。ReLU 快、缓解梯度消失；tanh 输出在 $(-1,1)$、有正有负；logistic 输出在 $(0,1)$、适合表达概率，两者在大 $z$ 处饱和。反向传播用链式法则从输出层向输入层高效计算各层梯度，供梯度下降更新权重。
:::

### 第2题 代码编写

用 `make_regression` 生成回归数据，用 `MLPRegressor` 拟合，比较 `solver` 取 `adam` 与 `lbfgs` 时的测试集 $R^2$；再构造一段带噪声的单调数据用 `IsotonicRegression` 拟合，打印拟合序列是否单调不减。

::: details 参考答案

```python
import numpy as np
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.isotonic import IsotonicRegression

X, y = make_regression(n_samples=500, n_features=5, noise=10, random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
scaler = StandardScaler().fit(X_train)
X_tr, X_te = scaler.transform(X_train), scaler.transform(X_test)

for solver in ['adam', 'lbfgs']:
    m = MLPRegressor(hidden_layer_sizes=(30,), solver=solver,
                     max_iter=2000, random_state=0)
    m.fit(X_tr, y_train)
    print(solver, round(m.score(X_te, y_test), 3))

rng = np.random.RandomState(0)
x = np.linspace(0, 5, 100)
y = np.exp(x) + 0.5 * rng.randn(100)
iso = IsotonicRegression(increasing=True).fit(x, y)
pred = iso.predict(x)
print('单调不减:', np.all(np.diff(pred) >= 0))
```

:::

### 第3题 进阶练习

在 `make_classification` 上比较 MLP 在标准化前与标准化后的测试集准确率；并尝试用网格搜索 `hidden_layer_sizes` 与 `alpha`，观察不同组合的过拟合程度（训练集与测试集分数的差距）。

::: details 参考答案

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

X, y = make_classification(n_samples=1000, n_features=20, n_informative=12,
                           random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)

m_raw = MLPClassifier(max_iter=1000, random_state=0).fit(X_train, y_train)
print('未标准化:', round(m_raw.score(X_test, y_test), 3))

scaler = StandardScaler().fit(X_train)
X_tr, X_te = scaler.transform(X_train), scaler.transform(X_test)

param_grid = {'hidden_layer_sizes': [(10,), (30,), (30, 10)],
              'alpha': [0.0001, 0.01]}
gs = GridSearchCV(MLPClassifier(max_iter=2000, random_state=0),
                  param_grid, cv=3, scoring='accuracy')
gs.fit(X_tr, y_train)
print('最优参数:', gs.best_params_)
print('测试集:', round(gs.score(X_te, y_test), 3))
```

:::

## 常见错误

**错误 1 · 训练报警告 ConvergenceWarning 或准确率异常低**

现象：`fit` 时出现 `ConvergenceWarning`，或模型分数很低。

原因：默认 `max_iter=200` 常常不够，网络还没收敛就停下来了。

解决：调大 `max_iter`，或开启 `early_stopping` 配合足够大的 `max_iter` 让训练自行判断何时停止。

**错误 2 · 特征量级差异大时训练效果差**

现象：同一份数据，加了 `StandardScaler` 后分数明显更高。

原因：MLP 对输入尺度敏感，大量级特征会主导梯度，收敛变慢甚至失败。

解决：训练前先标准化特征，再喂给网络。

**错误 3 · 隐藏层过大导致严重过拟合**

现象：训练集分数接近 1，测试集分数很低。

原因：模型容量远超数据信息量，把噪声也背了下来。

解决：减小 `hidden_layer_sizes`、增大 `alpha` 正则化，或增加数据量。

**错误 4 · 用 IsotonicRegression 拟合本就不单调的数据**

现象：拟合曲线强行变成阶梯状，与真实趋势明显不符。

原因：保序回归的单调约束与数据本身矛盾，约束会**硬掰**曲线。

解决：先画散点图确认单调性；数据明显非单调时应改用普通回归模型。
