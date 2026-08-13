---
title: 1.9 随机数生成(numpy.random)
sidebar:
  order: 9
---
# 1.9 随机数生成(numpy.random)

随机数在数据科学中无处不在:初始化模型参数、生成模拟数据、随机打乱数据顺序、按概率抽样。`numpy.random` 模块提供从简单均匀分布到复杂分布的完整随机数生成能力。第 1 章已经接触过部分老接口,本节系统讲解随机数种子管理、各类分布的生成函数、排列洗牌与抽样,以及从 1.17 版本开始推荐的新 `Generator` 接口。

## 1.9.1 随机数种子管理

### np.random.seed()

随机数是伪随机,由内部状态决定。设置相同种子,生成序列完全一致:

```python
import numpy as np

np.random.seed(0)
print(np.random.rand(3))   # [0.5488135 0.71518937 0.60276338]

np.random.seed(0)
print(np.random.rand(3))   # 完全相同
```

固定种子保证实验可复现,在调参、对比实验、教学示例中都会用到。

### np.random.RandomState

`RandomState` 是旧版推荐的种子对象。每个实例有独立状态,互不影响:

```python
import numpy as np

rng1 = np.random.RandomState(42)
rng2 = np.random.RandomState(42)

print(rng1.rand(2))    # [0.37454012 0.95071431]
print(rng2.rand(2))    # [0.37454012 0.95071431]，同种子同结果

# 不同实例互不影响
print(rng1.rand(2))    # 继续 rng1 的序列
```

使用独立的 `RandomState` 实例,比全局 `np.random.seed` 更清晰,多个随机序列互不干扰。

### np.random.default_rng()(推荐)

从 NumPy 1.17 开始,官方推荐用 `default_rng()` 创建 `Generator` 对象,它使用更新的算法,统计性质更好,接口也统一:

```python
import numpy as np

rng = np.random.default_rng(42)   # 传入种子
print(rng.random(3))   # 生成 3 个 [0,1) 均匀随机数
print(rng.integers(0, 10, size=4))  # 4 个 0~9 的随机整数
```

`Generator` 与 `RandomState` 的方法名不同:`random`(原 `random_sample`)、`integers`(原 `randint`)、`normal`、`uniform` 等。本节后续分布部分同时给出新旧接口的写法。

## 1.9.2 随机整数

### randint()

旧接口 `np.random.randint(low, high, size)` 生成 `[low, high)` 区间的整数:

```python
import numpy as np

np.random.seed(1)
print(np.random.randint(0, 10, size=5))    # [5 8 9 5 0]
print(np.random.randint(5, size=3))        # [2 1 2]，low 默认 0
print(np.random.randint(0, 10, size=(2, 3)))# 二维随机整数矩阵
```

### random_integers()

`random_integers` 生成的是闭区间 `[low, high]`,与 `randint` 的 `[low, high)` 不同:

```python
import numpy as np

np.random.seed(1)
print(np.random.randint(1, 5, size=3))     # [2 4 3]，1~4，不含 5
print(np.random.random_integers(1, 5, size=3))  # 1~5，含 5
```

`random_integers` 在新 `Generator` 中已被弃用,统一用 `integers` 指定开闭。

### Generator 接口

```python
import numpy as np

rng = np.random.default_rng(1)
print(rng.integers(0, 10, size=5))      # 含 0 不含 10
print(rng.integers(0, 10, size=5, endpoint=True))  # 含 10
```

## 1.9.3 随机浮点

### 均匀分布

```python
import numpy as np

np.random.seed(1)
# random(): [0,1) 均匀分布
print(np.random.random(3))          # [0.417022 0.72032449 0.00011437]
print(np.random.random_sample(3))   # 与 random 相同

# rand(): [0,1) 均匀分布,形状由参数指定
print(np.random.rand(2, 2))         # 2x2 均匀随机数

# uniform(): [low, high) 均匀分布
print(np.random.uniform(0, 10, size=4))  # 0~10 均匀
```

### 正态分布

```python
import numpy as np

np.random.seed(1)
# randn(): 标准正态(均值 0,标准差 1)
print(np.random.randn(3))   # [-0.97727788 0.95008842 -0.15135721]

# normal(): 指定均值和标准差的正态
print(np.random.normal(0, 2, size=4))   # 均值 0,标准差 2
print(np.random.normal(loc=5, scale=1, size=(2, 2)))  # 均值 5,标准差 1
```

`randn` 是标准正态的便捷形式,`normal` 支持自定义均值和标准差。

### 其他连续分布

```python
import numpy as np

np.random.seed(1)
print(np.random.lognormal(0, 1, size=3))      # 对数正态
print(np.random.exponential(2.0, size=3))     # 指数分布,scale=2
print(np.random.beta(2, 5, size=3))           # Beta 分布
print(np.random.gamma(2.0, 1.0, size=3))      # Gamma 分布
print(np.random.chi-square(3, size=3))        # 卡方分布,df=3
print(np.random.standard_t(5, size=3))        # t 分布,df=5
print(np.random.f(2, 3, size=3))              # F 分布,df1=2,df2=3
```

这些分布函数都在数据建模、统计检验、模拟实验中用到。每个分布有对应的 `Generator` 方法:

```python
rng = np.random.default_rng(1)
print(rng.normal(0, 1, size=3))
print(rng.exponential(2.0, size=3))
print(rng.beta(2, 5, size=3))
```

## 1.9.4 排列与洗牌

### shuffle() 原地洗牌

`np.random.shuffle` 原地打乱数组元素顺序,修改原数组:

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
np.random.shuffle(a)
print(a)   # 顺序随机打乱,如 [3 1 5 2 4]
```

`shuffle` 不返回新数组,直接修改传入的数组。对二维数组,`shuffle` 只打乱第一个轴(行)的顺序。

### permutation() 返回新排列

`np.random.permutation` 返回打乱后的新数组,不改原数组:

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.random.permutation(a)
print(b)   # 新排列,如 [4 2 5 1 3]
print(a)   # [1 2 3 4 5]，原数组不变

# 传入整数时,生成 0~n-1 的随机排列
idx = np.random.permutation(5)
print(idx)   # 例如 [2 0 4 1 3]
```

### 打乱数据集

`permutation` 生成的索引常用于打乱数据集并保持行对应关系:

```python
import numpy as np

X = np.array([[1, 1], [2, 2], [3, 3], [4, 4]])   # 特征
y = np.array([0, 1, 0, 1])                        # 标签

idx = np.random.permutation(len(X))
print(idx)   # 例如 [3 0 2 1]

X_shuffled = X[idx]
y_shuffled = y[idx]
print(X_shuffled)   # 行顺序与 y_shuffled 保持一致
print(y_shuffled)
```

用同一组索引打乱 `X` 和 `y`,保证特征和标签的对应关系不被打乱。

## 1.9.5 随机抽样:choice()

`np.random.choice` 从数组中随机抽取,支持放回/不放回和概率权重:

```python
import numpy as np

np.random.seed(1)

# 从 0~9 中抽 3 个,不放回(replace=False)
print(np.random.choice(10, 3, replace=False))   # [1 4 0]

# 从数组中抽样,有放回
fruits = np.array(["apple", "banana", "orange"])
print(np.random.choice(fruits, 5, replace=True))  # 允许重复

# 带概率权重的抽样
p = np.array([0.7, 0.2, 0.1])
print(np.random.choice(3, 5, p=p))   # 按权重 0.7/0.2/0.1 抽取
```

`choice` 的常用参数:`size` 抽样数量、`replace` 是否放回、`p` 概率权重(默认均匀)。

## 1.9.6 分布函数:二项、泊松、几何等

离散分布用于模拟计数数据:

```python
import numpy as np

np.random.seed(1)

# 二项分布: n 次独立试验,每次成功概率 p
print(np.random.binomial(10, 0.5, size=5))   # 每次 10 次抛硬币,正面次数

# 泊松分布: 均值为 lambda 的计数
print(np.random.poisson(3, size=5))          # 均值 3 的计数

# 几何分布: 首次成功所需的试验次数
print(np.random.geometric(0.2, size=5))

# 均匀离散
print(np.random.randint(0, 2, size=5))       # 0/1 二值
```

`binomial(n, p)` 模拟 n 次独立试验的成功次数,`poisson(lam)` 模拟单位时间内事件发生次数,常用于模拟队列、点击量、发病率等计数数据。

## 1.9.7 新随机生成器(Generator)接口

### 新旧接口对照

NumPy 1.17+ 推荐的 `Generator`(通过 `default_rng()` 创建)与旧接口的主要区别:

| 旧接口(RandomState) | 新接口(Generator) | 说明 |
| -------------------- | ------------------ | ---- |
| `np.random.seed(n)` | `rng = default_rng(n)` | 创建生成器 |
| `rand()` | `rng.random(size)` | 均匀 [0,1) |
| `randint(a, b)` | `rng.integers(a, b)` | 整数 |
| `normal()` | `rng.normal()` | 正态 |
| `shuffle(a)` | `rng.shuffle(a)` | 洗牌 |
| `permutation(a)` | `rng.permutation(a)` | 排列 |
| `choice(a, n)` | `rng.choice(a, n)` | 抽样 |

### 为什么推荐新接口

新接口使用 PCG64 算法,随机序列的统计质量更好、状态空间更大,且支持 `seed` 传入任意可哈希对象:

```python
import numpy as np

# 推荐写法
rng = np.random.default_rng(2024)
print(rng.random(3))
print(rng.normal(0, 1, 5))
print(rng.integers(0, 100, 5))

# 仍兼容旧接口
np.random.seed(2024)
print(np.random.rand(3))
```

新接口代码推荐统一用 `rng` 变量,便于管理种子和复现。旧接口在现有代码中仍可用,但新项目应使用 `Generator`。

## 练习题

### 第1题 概念理解

说明 `np.random.seed`、`np.random.RandomState`、`np.random.default_rng` 三者的区别,以及为什么推荐使用 `default_rng` 创建 `Generator`。

::: details 参考答案

`np.random.seed` 设置全局种子,影响所有后续随机调用;`RandomState` 创建独立状态对象,互不影响;`default_rng` 创建基于 PCG64 算法的 `Generator`,统计质量更好、接口更统一。推荐 `default_rng`,因为随机序列质量更高,且通过 `rng` 变量管理种子更方便复现。
:::

### 第2题 代码编写

用 `np.random` 生成:(1) 一个 3x4 的 0~1 均匀分布随机矩阵;(2) 一个均值 0、标准差 1 的标准正态随机数组,长度 100;(3) 从 1~100 中不放回抽取 10 个整数。设置种子保证结果可复现。

::: details 参考答案

```python
import numpy as np

np.random.seed(42)
a = np.random.rand(3, 4)              # 3x4 均匀随机矩阵
b = np.random.randn(100)              # 100 个标准正态随机数
c = np.random.choice(np.arange(1, 101), 10, replace=False)  # 1~100 抽 10 个不重复

print(a.shape)   # (3, 4)
print(b.shape)   # (100,)
print(c.shape)   # (10,)
```

固定种子后,每次运行生成相同结果,便于复现。
:::

### 第3题 进阶练习

假设每名患者的就诊次数服从均值为 3 的泊松分布。用 `np.random.poisson` 模拟 100 名患者的就诊次数,统计:总就诊次数、平均就诊次数、就诊次数超过 5 的患者数量。

::: details 参考答案

```python
import numpy as np

np.random.seed(7)
visits = np.random.poisson(3, size=100)
print(visits.mean())                    # 平均就诊次数,接近 3
print(visits.sum())                     # 总就诊次数
print(np.sum(visits > 5))               # 就诊次数超过 5 的患者数
```

泊松分布的均值参数就是 lambda,模拟数据均值会围绕 3 波动。用布尔索引统计满足条件的数量。
:::

### 第4题 项目实践

命令行任务管理器要对任务进行随机抽样审查。有 20 个任务,用 `choice` 不放回抽取 5 个作为审查样本;再用 `permutation` 生成一个打乱的任务顺序用于随机轮转分配,说明如何保证多次抽取不重复。

::: details 参考答案

```python
import numpy as np

np.random.seed(10)
tasks = np.arange(20)

# 不放回抽 5 个审查样本
sample = np.random.choice(tasks, 5, replace=False)
print(sample)

# 打乱任务顺序
order = np.random.permutation(tasks)
print(order)

# 不放回抽样(replace=False)保证同一次抽取不重复
# 多次抽取需在每次后从剩余任务中再抽,或记录已抽取集合
```

`choice(..., replace=False)` 保证单次抽取不重复。多次抽取要在剩余集合中进行,避免同一任务被重复抽到。
:::

## 常见错误

**错误 1 · 随机结果每次运行都不同,实验无法复现**

原因:没有设置随机种子,每次运行使用不同的初始状态。

解决:在随机操作前调用 `np.random.seed(n)` 或 `rng = np.random.default_rng(n)`,固定种子。

**错误 2 · `ValueError: a must be 1-dimensional`**

原因:`np.random.choice` 的数组参数必须是 1 维,传入多维数组报错。

解决:先展平 `a.ravel()` 或 `a.flatten()` 后再抽样。

**错误 3 · `randint` 与 `random_integers` 的区间混淆**

原因:`randint(low, high)` 是 `[low, high)` 开区间,`random_integers(low, high)` 是闭区间,期望不同导致结果范围不符。

解决:确认函数语义,或统一使用新接口 `rng.integers(low, high)`(开区间,`endpoint=True` 变闭区间)。

**错误 4 · `shuffle` 返回 None 而非打乱后的数组**

原因:`shuffle` 原地修改原数组并返回 `None`,把它赋给变量得到 `None`。

解决:直接使用原数组查看打乱结果;需要新数组用 `permutation`。
