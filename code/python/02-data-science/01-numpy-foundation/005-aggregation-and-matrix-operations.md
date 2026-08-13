---
title: 1.5 聚合统计与矩阵运算
sidebar:
  order: 5
---
# 1.5 聚合统计与矩阵运算

掌握了逐元素的运算后,还需要把整个数组"浓缩"成有意义的统计量:总和、均值、最值、标准差,以及按某个轴分别统计。这是数据分析的第一步。除此之外,NumPy 还提供完整的线性代数子模块 `numpy.linalg`,用于矩阵乘法、求逆、特征值、奇异值分解等运算。本节将系统讲解聚合函数、多轴归约、累积与差分,以及 `linalg` 子模块的常用功能。

## 1.5.1 归约运算(聚合函数)

### 基础聚合

聚合函数把整个数组归约为一个标量:

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])

print(np.sum(a))      # 21，所有元素求和
print(np.prod(a))     # 720，所有元素求积
print(np.mean(a))     # 3.5，均值
print(np.var(a))      # 2.9166666666666665，方差
print(np.std(a))      # 1.707825127659933，标准差
print(np.min(a))      # 1
print(np.max(a))      # 6
print(np.ptp(a))      # 5，极差 max - min
```

### argmin 与 argmax

`np.argmin`/`np.argmax` 返回最值所在位置的索引:

```python
a = np.array([3, 1, 4, 1, 5])
print(np.argmax(a))    # 4，最大值 5 的位置
print(np.argmin(a))    # 1，最小值 1 的第一个位置
```

### median、percentile、quantile

```python
import numpy as np

data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

print(np.median(data))        # 5.5，中位数
print(np.percentile(data, 25))# 3.25，第 25 百分位数
print(np.percentile(data, 75))# 7.75，第 75 百分位数
print(np.quantile(data, 0.5)) # 5.5，等价于中位数
```

百分位数把数据从小到大分成 100 份,`percentile(data, p)` 返回第 p 百分位的值。`quantile` 使用 0~1 的比例,与 `percentile` 本质相同。

### average 加权平均

`np.average` 支持权重参数,用于加权平均:

```python
import numpy as np

scores = np.array([80, 90, 70])
weights = np.array([0.2, 0.5, 0.3])

print(np.average(scores))              # 80.0，普通平均
print(np.average(scores, weights=weights))  # 82.0，加权平均
```

## 1.5.2 多轴归约(axis 参数)与 keepdims

### axis 参数

聚合函数的 `axis` 参数指定沿哪个轴归约。对二维数组:

- `axis=0` 沿行方向归约(逐列统计)
- `axis=1` 沿列方向归约(逐行统计)

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])

print(np.sum(a, axis=0))   # [5 7 9]，每列之和
print(np.sum(a, axis=1))   # [ 6 15]，每行之和
print(np.mean(a, axis=0))  # [2.5 3.5 4.5]
print(np.max(a, axis=1))   # [3 6]
print(np.argmax(a, axis=1))# [2 2]，每行最大值的位置
```

`axis` 是数据分析的核心参数,pandas 的分组聚合、数据透视都基于类似思想。

### 多轴归约

高维数组可以同时沿多个轴归约,传入轴元组:

```python
import numpy as np

a = np.arange(24).reshape(2, 3, 4)
print(a.sum(axis=(0, 1)))   # 沿轴 0、1 归约，剩轴 2
# [60 66 72 78]
print(a.sum(axis=0).shape)  # (3, 4)
```

### keepdims 保持维度

`keepdims=True` 让归约后保持原维度数(长度 1),方便与广播配合:

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])

print(a.sum(axis=1))               # [6 15]，一维
print(a.sum(axis=1, keepdims=True))# [[6] [15]]，仍是二维
```

`keepdims=True` 的结果形状是 `(2, 1)`,可以直接与 `a` 广播运算,实现"每行除以行和"这类操作。

## 1.5.3 累积运算

累积函数沿某个轴逐步累加/累乘,返回与输入等长的数组:

```python
import numpy as np

a = np.array([1, 2, 3, 4])
print(np.cumsum(a))      # [1 3 6 10]，逐步累加
print(np.cumprod(a))     # [1 2 6 24]，逐步累乘

b = np.array([[1, 2, 3], [4, 5, 6]])
print(np.cumsum(b, axis=0))   # 沿行累积
# [[1 2 3]
#  [5 7 9]]
print(np.cumsum(b, axis=1))   # 沿列累积
# [[ 1  3  6]
#  [ 4  9 15]]
```

### 忽略 NaN 的累积

`nancumsum`/`nancumprod` 忽略 NaN,NaN 位置的累计值保持前一个值:

```python
import numpy as np

a = np.array([1.0, np.nan, 3.0, 4.0])
print(np.nancumsum(a))   # [1. 1. 4. 8.]，NaN 被跳过
print(np.cumsum(a))      # [1. nan nan nan]，普通累积被 NaN 污染
```

## 1.5.4 差分与梯度

```python
import numpy as np

a = np.array([1, 3, 6, 10, 15])
print(np.diff(a))        # [2 3 4 5]，相邻元素之差
print(np.diff(a, n=2))   # [1 1 1]，二阶差分

x = np.array([0.0, 1.0, 2.0, 3.0])
y = np.array([0.0, 1.0, 4.0, 9.0])
print(np.gradient(y))    # [1. 2. 4. 6.]，数值梯度
```

`np.diff` 计算相邻差值,`n` 参数指定差分阶数。`np.gradient` 计算数值梯度(一阶导数),可用于求导、检测变化趋势。

## 1.5.5 线性代数子模块(numpy.linalg)

### 点积:dot、matmul、@

三种点积写法,行为在二维数组时一致:

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])

print(np.dot(a, b))
# [[19 22]
#  [43 50]]

print(np.matmul(a, b))
# [[19 22]
#  [43 50]]

print(a @ b)   # @ 运算符等价于 matmul
# [[19 22]
#  [43 50]]
```

`@` 是 Python 3.5+ 引入的矩阵乘法运算符,推荐日常使用。`dot` 对一维数组计算内积,`matmul` 对一维数组的行为与之不同,矩阵运算优先用 `@` 或 `matmul`。

### 内积/外积/叉积

```python
import numpy as np

u = np.array([1, 2, 3])
v = np.array([4, 5, 6])

print(np.inner(u, v))    # 32，内积 = 1*4 + 2*5 + 3*6
print(np.dot(u, v))      # 32，一维时与 inner 相同

print(np.outer(u, v))
# [[ 4  5  6]
#  [ 8 10 12]
#  [12 15 18]]

a = np.array([1, 0, 0])
b = np.array([0, 1, 0])
print(np.cross(a, b))    # [0 0 1]，叉积，结果垂直于两向量
```

### 矩阵转置共轭(.H)

`.T` 转置,`.conj()` 取共轭,`.H` 对复数矩阵做共轭转置:

```python
import numpy as np

c = np.array([[1 + 2j, 3 - 1j], [2j, 4 + 1j]])
print(c.T)        # 转置
print(c.conj())   # 共轭
print(c.conj().T) # 共轭转置，等于 c 的 Hermitian 伴随
```

NumPy 里 `.H` 属性可以通过对复数矩阵取共轭转置得到,等价于 `c.conj().T`。

### 矩阵逆与伪逆

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
print(np.linalg.inv(a))
# [[-2.   1. ]
#  [ 1.5 -0.5]]

# 验证 A @ A^-1 = I
print(np.round(a @ np.linalg.inv(a), 10))
# [[1. 0.]
#  [0. 1.]]

# 伪逆：对不可逆或非方阵也有效
b = np.array([[1, 2, 3], [4, 5, 6]])
print(np.linalg.pinv(b))
```

`inv` 只对可逆方阵有效,不可逆时抛 `LinAlgError`。`pinv` 计算 Moore-Penrose 伪逆,对任意形状矩阵可用,常用于最小二乘问题。

### 行列式与秩

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
print(np.linalg.det(a))            # -2.0000000000000004，行列式
print(np.linalg.matrix_rank(a))    # 2，秩

# 奇异矩阵行列式为 0，秩小于阶数
b = np.array([[1, 2], [2, 4]])
print(np.linalg.det(b))            # 0.0
print(np.linalg.matrix_rank(b))    # 1
```

行列式为 0 的矩阵不可逆;矩阵的秩表示线性无关的行或列的最大个数。

### 特征值与特征向量

```python
import numpy as np

a = np.array([[2, 0], [0, 3]])
eigvals = np.linalg.eigvals(a)     # 只求特征值
print(eigvals)                     # [2. 3.]

eigvals2, eigvecs = np.linalg.eig(a)   # 特征值和特征向量
print(eigvals2)   # [2. 3.]
print(eigvecs)    # 特征向量组成的矩阵
# [[1. 0.]
#  [0. 1.]]
```

`eig` 返回两个值:特征值数组和特征向量矩阵(每列是一个特征向量)。`eigvals` 只返回特征值。特征值与特征向量满足 `A @ v = λ * v`。

### 奇异值分解(SVD)

`np.linalg.svd` 把矩阵分解为 `A = U Σ V^T`:

```python
import numpy as np

a = np.array([[1, 2], [3, 4], [5, 6]])
u, s, vh = np.linalg.svd(a)
print(u.shape)   # (3, 3)，左奇异向量
print(s)         # 奇异值数组，按降序排列
print(vh.shape)  # (2, 2)，右奇异向量(转置)
```

SVD 是矩阵分解中最通用的方法,对任意矩阵都适用,是主成分分析、推荐系统、降维等算法的数学基础。

### QR 分解

`np.linalg.qr` 把矩阵分解为 `A = Q R`,Q 是正交矩阵,R 是上三角矩阵:

```python
import numpy as np

a = np.array([[1, 2], [3, 4], [5, 6]])
q, r = np.linalg.qr(a)
print(q.shape)   # (3, 2)
print(r.shape)   # (2, 2)
```

### Cholesky 分解

`np.linalg.cholesky` 把正定对称矩阵分解为 `A = L L^T`,L 是下三角矩阵:

```python
import numpy as np

a = np.array([[4, 2], [2, 3]])
l = np.linalg.cholesky(a)
print(l)
# [[1.41421356 0.        ]
#  [1.41421356 1.        ]]
```

Cholesky 分解要求矩阵对称正定,常用于多元正态分布抽样、协方差矩阵求逆。

### 解线性方程组:solve

`np.linalg.solve(A, b)` 求解 `Ax = b`:

```python
import numpy as np

# 2x + y = 5
#  x + 3y = 6
a = np.array([[2, 1], [1, 3]])
b = np.array([5, 6])
x = np.linalg.solve(a, b)
print(x)   # [1.8 1.4]，x=1.8, y=1.4

# 验证
print(a @ x)   # [5. 6.]
```

### 最小二乘解:lstsq

`np.linalg.lstsq` 求解最小二乘问题,在无解或多解时给出最优近似解:

```python
import numpy as np

# 用直线 y = a + b*x 拟合数据
x_data = np.array([0, 1, 2, 3])
y_data = np.array([1, 3, 5, 7])
A = np.vstack([np.ones_like(x_data), x_data]).T
print(A.shape)   # (4, 2)

coeff, residuals, rank, sv = np.linalg.lstsq(A, y_data, rcond=None)
print(coeff)   # [1. 2.]，截距 1，斜率 2
```

### 范数与条件数

```python
import numpy as np

v = np.array([3, 4])
print(np.linalg.norm(v))          # 5.0，默认 L2 范数
print(np.linalg.norm(v, ord=1))   # 7.0，L1 范数
print(np.linalg.norm(v, ord=np.inf))  # 4.0，无穷范数

a = np.array([[1, 2], [3, 4]])
print(np.linalg.cond(a))          # 条件数
```

`norm` 计算向量或矩阵的范数,`cond` 计算矩阵的条件数,衡量矩阵对误差的敏感程度。

## 1.5.6 张量操作

### np.tensordot

`np.tensordot` 在指定轴上做张量缩并,是通用化的矩阵乘法:

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])
print(np.tensordot(a, b, axes=1))
# [[19 22]
#  [43 50]]，等价于 a @ b

c = np.arange(6).reshape(2, 3)
d = np.arange(12).reshape(3, 4)
print(np.tensordot(c, d, axes=1).shape)   # (2, 4)
```

### np.einsum

`np.einsum` 用爱因斯坦求和记号描述张量运算,表达紧凑、功能强大:

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])

# 矩阵乘法: ij,jk -> ik
print(np.einsum("ij,jk->ik", a, b))
# [[19 22]
#  [43 50]]

# 对角线: ii -> i
print(np.einsum("ii->i", a))    # [1 4]

# 转置: ij -> ji
print(np.einsum("ij->ji", a))
# [[1 3]
#  [2 4]]

# 求迹: ii -> 
print(np.einsum("ii->", a))     # 5
```

`einsum` 的字符串中,逗号分隔各输入的下标,`->` 后是输出下标,重复下标表示求和。掌握 `einsum` 可以写出极其简洁的高维张量运算。

## 练习题

### 第1题 概念理解

写出下面代码的输出结果,并解释 `axis` 参数与 `keepdims` 的作用。

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
print(np.sum(a, axis=0))
print(np.sum(a, axis=1))
print(np.mean(a, axis=0, keepdims=True).shape)
```

::: details 参考答案

```python
[5 7 9]
[6 15]
(1, 3)
```

`axis=0` 逐列统计,`axis=1` 逐行统计。`keepdims=True` 保持维度数,结果形状从 (3,) 变成 (1, 3)。
:::

### 第2题 代码编写

给定成绩矩阵 `scores = np.array([[85, 90, 78], [60, 75, 80], [92, 88, 95]])`(每行是一个学生,每列是一门课)。计算每个学生的平均分、每门课的平均分,以及全班总分。

::: details 参考答案

```python
import numpy as np

scores = np.array([[85, 90, 78], [60, 75, 80], [92, 88, 95]])
print(scores.mean(axis=1))      # [84.33333333 71.66666667 91.66666667]，每学生平均
print(scores.mean(axis=0))      # [79. 84.33333333 84.33333333]，每科平均
print(scores.sum())             # 743，全班总分
```

:::

### 第3题 进阶练习

用 `numpy.linalg` 求解方程组:

```
3x + 2y = 12
 x -  y =  1
```

用 `solve` 求 x、y,并用 `eig` 求系数矩阵的特征值和特征向量,说明特征值含义。

::: details 参考答案

```python
import numpy as np

a = np.array([[3, 2], [1, -1]])
b = np.array([12, 1])
x = np.linalg.solve(a, b)
print(x)   # [2.8 1.8]，x=2.8, y=1.8

eigvals, eigvecs = np.linalg.eig(a)
print(eigvals)    # 特征值
print(eigvecs)    # 特征向量
```

特征值 λ 满足 `A v = λ v`,表示矩阵在该特征向量方向上只做伸缩,不改变方向。
:::

### 第4题 项目实践

命令行任务管理器要对任务的完成度数据做汇总统计。假设 10 个任务的完成度 `completion = np.array([0.2, 0.5, 0.9, 0.1, 0.6, 0.8, 0.3, 0.7, 0.4, 1.0])`。计算完成度的均值、中位数、标准差、最大值与最小值的差值,并找出完成度最高的任务位置。

::: details 参考答案

```python
import numpy as np

completion = np.array([0.2, 0.5, 0.9, 0.1, 0.6, 0.8, 0.3, 0.7, 0.4, 1.0])
print(np.mean(completion))        # 0.55
print(np.median(completion))      # 0.55
print(np.std(completion))         # 0.275681
print(np.ptp(completion))         # 0.9
print(np.argmax(completion))      # 9，完成度最高的位置
```

:::

## 常见错误

**错误 1 · 忘记 `axis` 导致整个数组聚合**

原因:聚合函数不传 `axis` 时对整个数组归约成一个标量,而期望的是按行或按列统计。

解决:需要分轴统计时明确传 `axis`;不确定结果维度时检查返回数组的 `shape`。

**错误 2 · `LinAlgError: Singular matrix`**

原因:对奇异矩阵(行列式为 0,不可逆)调用 `np.linalg.inv`。

解决:先检查 `np.linalg.det(a)` 是否为 0,或改用 `np.linalg.pinv` 计算伪逆。

**错误 3 · 用 `*` 做矩阵乘法**

原因:对矩阵使用 `a * b` 得到的是逐元素相乘,而非矩阵乘法,结果与预期不符。

解决:矩阵乘法用 `a @ b` 或 `np.matmul(a, b)`,`*` 只用于逐元素运算。

**错误 4 · NaN 污染聚合结果**

原因:数据含 NaN 时,`sum`/`mean`/`std` 等聚合结果变为 NaN。

解决:使用 `np.nansum`、`np.nanmean` 等忽略 NaN 的版本,或先用 `np.isnan` 清洗数据。
