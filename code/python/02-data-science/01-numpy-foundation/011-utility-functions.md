---
title: 1.11 实用辅助函数
sidebar:
  order: 11
---
# 1.11 实用辅助函数

前面的章节解决了数组的创建、运算、变形与 I/O,但日常数据分析中还有一批高频辅助函数:比较两个数组是否相同、判断 NaN/inf、数据清洗、排序查找、去重、集合运算,以及多项式、傅里叶变换、直方图、网格生成等专门工具。这些函数不改变数组的核心运算逻辑,却是实际工作中离不开的便利设施。本节将系统梳理这批实用函数,按用途分组讲解。

## 1.11.1 数组比较与测试

### all() 与 any()

`np.all` 判断是否所有元素为真,`np.any` 判断是否存在元素为真:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([1, 0, 3])

print(np.all(a > 0))    # True，所有元素大于 0
print(np.any(b == 0))   # True，存在等于 0 的元素

# 支持 axis
m = np.array([[1, 2], [3, 0]])
print(np.all(m > 0, axis=0))   # [ True False]，逐列判断
print(np.any(m == 0, axis=1))  # [False  True]，逐行判断
```

### allclose() 与 isclose()

浮点比较不能直接用 `==` 因为精度误差。`np.allclose` 判断两个数组是否"近似相等",默认允许相对误差 `rtol=1e-5` 和绝对误差 `atol=1e-8`:

```python
import numpy as np

a = np.array([0.1, 0.2, 0.3])
b = np.array([0.1, 0.2, 0.30000000000000004])   # 浮点误差

print(a == b)            # [ True  True False]
print(np.allclose(a, b)) # True，容差内视为相等

print(np.isclose(a, b))  # [ True  True  True]，逐元素
```

`np.allclose` 返回单个布尔值,`np.isclose` 返回逐元素的布尔数组。矩阵求逆后验证 `A @ A^-1 == I` 时,必须用 `allclose`。

### array_equal() 与 array_equiv()

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([1, 2, 3])
c = np.array([1, 2, 4])

print(np.array_equal(a, b))   # True，精确相等
print(np.array_equal(a, c))   # False
print(np.array_equiv(a, b))   # True，逐元素相等(广播语义更宽)
```

`array_equal` 要求形状和值都精确相等,`array_equiv` 在形状不同但能广播且结果逐元素相等时也返回 True。

## 1.11.2 条件判断

判断数组中的特殊浮点值:

```python
import numpy as np

a = np.array([1.0, np.nan, np.inf, -np.inf, 5.0])

print(np.isnan(a))       # [False  True False False False]，NaN
print(np.isinf(a))       # [False False  True  True False]，正负无穷
print(np.isfinite(a))    # [ True False False False  True]，有限值
print(np.isneginf(a))    # [False False False  True False]，负无穷
print(np.isposinf(a))    # [False False  True False False]，正无穷
```

这些函数常用于数据清洗:先找出 NaN/inf 再决定删除还是替换。

## 1.11.3 数据清洗

### nan_to_num()

`np.nan_to_num` 把 NaN 替换为 0,正无穷替换为大有限值,负无穷替换为小有限值:

```python
import numpy as np

a = np.array([1.0, np.nan, np.inf, -np.inf])
b = np.nan_to_num(a)
print(b)   # [1.e+000 0.e+000 1.79769313e+308 -1.79769313e+308]
```

可以指定 nan 和 inf 的替换值:

```python
b = np.nan_to_num(a, nan=-1.0, posinf=999.0, neginf=-999.0)
print(b)   # [1. -1. 999. -999.]
```

### 忽略 NaN 的统计函数

含 NaN 的数据用普通聚合函数结果也是 NaN,需要用 `nan` 前缀的版本:

```python
import numpy as np

a = np.array([1.0, np.nan, 3.0, 4.0, np.nan])

print(np.mean(a))      # nan，被污染
print(np.nanmean(a))   # 2.6666666666666665，忽略 NaN
print(np.nansum(a))    # 8.0
print(np.nanstd(a))    # 1.247219128924647，忽略 NaN 的标准差
print(np.nanvar(a))    # 1.5555555555555556
print(np.nanmin(a))    # 1.0
print(np.nanmax(a))    # 4.0
print(np.nanprod(a))   # 12.0
print(np.nanargmin(a)) # 0
print(np.nanargmax(a)) # 3
```

`nanmean`、`nanvar`、`nanstd`、`nanmin`、`nanmax`、`nansum`、`nanprod`、`nanargmin`、`nanargmax` 覆盖了主要聚合函数的 NaN 忽略版本,数据清洗中经常用到。

## 1.11.4 排序与查找

### 排序:sort()、argsort()、lexsort()

`np.sort` 返回排序后的新数组,`.sort()` 方法原地排序:

```python
import numpy as np

a = np.array([3, 1, 2, 5, 4])
print(np.sort(a))          # [1 2 3 4 5]，新数组
print(np.sort(a)[::-1])    # [5 4 3 2 1]，降序

a.sort()                   # 原地排序
print(a)                   # [1 2 3 4 5]

# 多维数组按轴排序
m = np.array([[3, 1], [2, 4]])
print(np.sort(m, axis=0))  # [[2 1] [3 4]]，逐列排序
print(np.sort(m, axis=1))  # [[1 3] [2 4]]，逐行排序
```

`np.argsort` 返回排序后的索引,不返回排序值,常用于保持多个数组的对齐:

```python
import numpy as np

scores = np.array([85, 70, 95, 60])
names = np.array(["Alice", "Bob", "Carol", "David"])

idx = np.argsort(scores)          # 升序索引
print(idx)                        # [3 1 0 2]
print(names[idx])                 # ['David' 'Bob' 'Alice' 'Carol']，按分数排序的名字
print(names[idx[::-1]])           # 降序 ['Carol' 'Alice' 'Bob' 'David']
```

`np.lexsort` 按多个键排序,最后一个键是主排序键:

```python
import numpy as np

names = np.array(["Alice", "Bob", "Carol", "David"])
ages = np.array([25, 25, 30, 25])
scores = np.array([85, 70, 95, 60])

# 先按年龄,同年龄再按分数(最后传的键优先级最高)
idx = np.lexsort((scores, ages))   # 主键 ages,次键 scores
print(idx)   # [1 3 0 2]
```

### 分区:partition()、argpartition()

`np.partition` 只保证第 k 个位置是正确顺序(前 k 个都比它小),其余无序,比全排序快:

```python
import numpy as np

a = np.array([3, 1, 4, 1, 5, 9, 2, 6])
print(np.partition(a, 3))     # 第 3 位置(索引 3)是第 4 小元素
# 前 3 个是最小的 3 个,位置 3 是第 4 小,后面更大

print(np.argpartition(a, 3))  # 对应索引
```

当只需要找第 k 大/小元素或前 k 个时,`partition` 比 `sort` 高效。

### 查找:where()、nonzero()、searchsorted()

`np.where(cond)` 返回满足条件的索引;`np.nonzero` 返回非零元素索引:

```python
import numpy as np

a = np.array([1, 0, 3, 0, 5])
print(np.where(a > 2))        # (array([2, 4]),)
print(np.nonzero(a))          # (array([0, 2, 4]),)，非零位置

m = np.array([[1, 0], [2, 3]])
print(np.nonzero(m))          # (array([0,1,1]), array([0,0,1]))，行、列索引
print(np.flatnonzero(a))      # [0 2 4]，展平后的非零索引
```

`np.searchsorted` 在有序数组中查找插入位置,是二分查找:

```python
import numpy as np

sorted_arr = np.array([1, 3, 5, 7, 9])
print(np.searchsorted(sorted_arr, 6))   # 3，6 应插在索引 3 处
print(np.searchsorted(sorted_arr, [2, 6]))  # [1 3]，批量
```

`np.extract` 按条件提取元素:

```python
import numpy as np

a = np.array([1, 5, 3, 8])
print(np.extract(a > 3, a))   # [5 8]
```

## 1.11.5 去重与集合操作

### np.unique()

`np.unique` 返回去重后的唯一值,可选返回索引、逆索引、计数:

```python
import numpy as np

a = np.array([3, 1, 2, 3, 2, 1, 4, 3])

print(np.unique(a))                    # [1 2 3 4]，去重排序
values, indices = np.unique(a, return_index=True)
print(values)      # [1 2 3 4]
print(indices)     # [1 2 0 6]，每个唯一值首次出现的位置

values, inverse = np.unique(a, return_inverse=True)
print(inverse)     # [2 0 1 2 1 0 3 2]，每个元素对应唯一值的索引

values, counts = np.unique(a, return_counts=True)
print(counts)      # [2 2 3 1]，每个唯一值出现次数
```

`return_counts` 是分组计数的常用手段,相当于"值 -> 出现次数"的统计。

### 集合操作

```python
import numpy as np

a = np.array([1, 2, 3, 4])
b = np.array([3, 4, 5, 6])

print(np.intersect1d(a, b))    # [3 4]，交集
print(np.union1d(a, b))        # [1 2 3 4 5 6]，并集
print(np.setdiff1d(a, b))      # [1 2]，在 a 不在 b
print(np.setxor1d(a, b))       # [1 2 5 6]，对称差(只在一边)
print(np.in1d(a, b))           # [False False  True  True]，a 的元素是否在 b
print(np.isin(a, b))           # [False False  True  True]，与 in1d 类似
```

`np.isin` 与 `np.in1d` 功能相同,`isin` 是新推荐写法,支持多维数组。

## 1.11.6 多项式运算(numpy.polynomial)

`numpy.polynomial` 模块提供多项式的创建、求值、积分、微分和拟合:

```python
import numpy as np
from numpy.polynomial import polynomial as P

# 多项式 p(x) = 1 + 2x + 3x^2，系数从低次到高次
coef = np.array([1.0, 2.0, 3.0])

# 求值
print(P.polyval(2, coef))    # 1 + 2*2 + 3*4 = 17.0

# 微分
print(P.polyder(coef))       # [2. 6.]，导数 2 + 6x

# 积分
print(P.polyint(coef))       # [0. 1. 1. 1.]，积分

# 多项式拟合: 用二次多项式拟合数据
x = np.array([0, 1, 2, 3])
y = np.array([1.0, 3.0, 7.0, 13.0])
fit = np.polynomial.polynomial.polyfit(x, y, 2)   # 二次拟合
print(fit)   # 接近 [1 2 3]，即 y = 1 + 2x + 3x^2
```

`polyfit` 做多项式最小二乘拟合,返回各次项系数,是拟合曲线的快捷工具。

## 1.11.7 傅里叶变换(numpy.fft)

`numpy.fft` 模块提供离散傅里叶变换:

```python
import numpy as np

# 构造一个含 50Hz 和 120Hz 正弦的信号
t = np.linspace(0, 1, 1000)
signal = np.sin(2 * np.pi * 50 * t) + np.sin(2 * np.pi * 120 * t)

# 一维 FFT 与逆变换
freq_domain = np.fft.fft(signal)
recovered = np.fft.ifft(freq_domain)
print(np.allclose(signal, recovered.real))   # True，逆变换还原

# 频率轴
freqs = np.fft.fftfreq(len(t), d=t[1] - t[0])
print(freqs.shape)   # (1000,)
```

`fft` 模块常用函数:`fft`/`ifft`(一维)、`fft2`/`ifft2`(二维)、`fftn`/`ifftn`(n 维)、`rfft`/`irfft`(实数信号专用,更省)、`fftfreq`(频率轴)。FFT 用于频谱分析、信号滤波、卷积加速等。

```python
import numpy as np

data = np.random.rand(128)
print(np.fft.rfft(data).shape)    # (65,)，实数 FFT 只保留一半
print(np.fft.fft(data).shape)     # (128,)
```

## 1.11.8 窗口函数

`numpy.window` 模块提供各种加窗函数,常用于信号处理和滤波:

```python
import numpy as np

print(np.window.bartlett(5))    # Bartlett 三角窗
print(np.window.blackman(5))    # Blackman 窗
print(np.window.hamming(5))     # Hamming 窗
print(np.window.hanning(5))     # Hanning 窗
print(np.window.kaiser(5, 14))  # Kaiser 窗，beta 参数控制形状
```

窗口函数返回指定长度的平滑权重序列,在 FFT 前对信号加窗可减少频谱泄漏。

## 1.11.9 计数与直方图

### histogram() 与 bincount()

```python
import numpy as np

data = np.array([1.2, 2.5, 3.7, 0.5, 4.1, 2.9])
hist, edges = np.histogram(data, bins=4)
print(hist)     # [1 2 2 1]，落在每个区间的数量
print(edges)    # 区间边界 [0.5 1.4 2.3 3.2 4.1]

# 二维直方图
x = np.random.rand(100)
y = np.random.rand(100)
h, xe, ye = np.histogram2d(x, y, bins=(5, 5))
print(h.shape)   # (5, 5)

# 三维直方图
z = np.random.rand(100)
h3, edges3 = np.histogramdd(np.stack([x, y, z], axis=1), bins=(3, 3, 3))
print(h3.shape)   # (3, 3, 3)
```

`histogram` 统计数据分布,`histogram2d`/`histogramdd` 扩展到多维度。

### digitize() 分箱

`np.digitize` 把数据分配到指定的箱子索引:

```python
import numpy as np

bins = np.array([10, 20, 30])
data = np.array([5, 15, 25, 35, 20])
print(np.digitize(data, bins))   # [0 1 2 3 2]，数据落在哪个箱
```

`digitize` 返回每个数据点所属的箱索引,用于连续值离散化。

## 1.11.10 网格生成

`np.meshgrid` 生成二维坐标网格,常用于画等高线、计算网格上的函数值:

```python
import numpy as np

x = np.array([1, 2, 3])
y = np.array([4, 5])
X, Y = np.meshgrid(x, y)
print(X)
# [[1 2 3]
#  [1 2 3]]
print(Y)
# [[4 4 4]
#  [5 5 5]]
```

`meshgrid` 生成 X 和 Y 两个同形状数组,对应每个网格点的坐标。`np.mgrid` 是切片语法形式,`np.ogrid` 生成广播形式:

```python
import numpy as np

print(np.mgrid[0:3, 0:2].shape)   # (2, 3, 2)
print(np.ogrid[0:3, 0:2][0].shape)  # (3, 1)，广播形式

# 用 meshgrid 计算网格函数
X, Y = np.meshgrid(np.linspace(-2, 2, 5), np.linspace(-2, 2, 5))
Z = X ** 2 + Y ** 2   # 抛物面
print(Z.shape)   # (5, 5)
```

## 1.11.11 常量

NumPy 内置一批常用数学常量:

```python
import numpy as np

print(np.pi)          # 3.141592653589793
print(np.e)           # 2.718281828459045
print(np.inf)         # inf，正无穷
print(np.nan)         # nan，非数
print(np.NZERO)       # -0.0，负零
print(np.PZERO)       # 0.0，正零
print(np.euler_gamma) # 0.5772156649015329，欧拉-马歇罗尼常数
```

这些常量在数学计算、初始化、边界判断中经常使用。

## 练习题

### 第1题 概念理解

`np.allclose` 与 `np.array_equal` 有什么区别?为什么浮点数比较通常应该用 `allclose` 而不是 `==`?

::: details 参考答案

`np.allclose` 在容差(默认 rtol=1e-5, atol=1e-8)内判断近似相等,`np.array_equal` 要求精确相等。浮点数有二进制表示误差(如 0.1+0.2 != 0.3),用 `==` 比较会得到 False,`allclose` 在容差范围内视为相等,更适合浮点计算结果的验证。
:::

### 第2题 代码编写

数组 `data = np.array([3, 1, 4, 1, 5, 9, 2, 6])`。用 `np.argsort` 得到排序索引,用 `np.unique(..., return_counts=True)` 统计每个唯一值出现次数,用 `np.partition` 找出前 3 小的元素。

::: details 参考答案

```python
import numpy as np

data = np.array([3, 1, 4, 1, 5, 9, 2, 6])
idx = np.argsort(data)
print(idx)                      # 排序索引
print(data[idx])                # [1 1 2 3 4 5 6 9]，排序结果

values, counts = np.unique(data, return_counts=True)
print(values)   # [1 2 3 4 5 6 9]
print(counts)   # [2 1 1 1 1 1 1]

part = np.partition(data, 2)
print(part[:3])   # 前 3 个是最小的 3 个元素
```

:::

### 第3题 进阶练习

给定含 NaN 的数据 `a = np.array([2.0, np.nan, 5.0, np.nan, 8.0, 3.0])`,用 `np.nanmean` 计算忽略 NaN 的均值,用 `np.nan_to_num` 把 NaN 替换为 0,再用 `np.isfinite` 找出有限值的索引。

::: details 参考答案

```python
import numpy as np

a = np.array([2.0, np.nan, 5.0, np.nan, 8.0, 3.0])
print(np.nanmean(a))          # 4.5
b = np.nan_to_num(a, nan=0.0)
print(b)                      # [2. 0. 5. 0. 8. 3.]
print(np.where(np.isfinite(a)))   # (array([0, 2, 4, 5]),)，有限值位置
```

:::

### 第4题 项目实践

命令行任务管理器要给任务优先级排序。有 6 个任务的优先级 `priorities = np.array([2, 5, 1, 3, 5, 4])`,任务名 `names = np.array(["写报告", "整理", "发邮件", "开会", "编码", "测试"])`。用 `argsort` 按优先级从高到低排列任务名,并用 `unique` 统计各优先级档位数量。

::: details 参考答案

```python
import numpy as np

priorities = np.array([2, 5, 1, 3, 5, 4])
names = np.array(["写报告", "整理", "发邮件", "开会", "编码", "测试"])

# 降序排列(优先级从高到低)
idx = np.argsort(priorities)[::-1]
print(names[idx])   # 优先级最高的任务在前

# 统计各优先级数量
levels, counts = np.unique(priorities, return_counts=True)
print(levels)    # [1 2 3 4 5]
print(counts)    # [1 1 1 1 2]
```

:::

## 常见错误

**错误 1 · 用 `==` 比较浮点数组导致结果错误**

原因:浮点数有二进制表示误差,`np.array([0.1, 0.2, 0.3]) == np.array([0.1, 0.2, 0.30000000000000004])` 逐元素比较最后一个为 False。

解决:浮点比较用 `np.allclose`/`np.isclose`,传入容差。

**错误 2 · 数据含 NaN 时聚合结果为 NaN**

原因:`np.mean` 等普通聚合函数遇到 NaN 返回 NaN,没有意识到数据里有缺失值。

解决:用 `np.nanmean` 等 nan 前缀版本,或先 `np.isnan` 定位并清洗。

**错误 3 · `np.unique` 忘记返回计数参数导致统计缺失**

原因:`np.unique(a)` 只返回去重值,不返回出现次数,分组统计结果缺失。

解决:需要计数时用 `np.unique(a, return_counts=True)`,结果解包为两个数组。

**错误 4 · `np.sort` 与 `.sort()` 混淆**

原因:`np.sort(a)` 返回新数组、原数组不变;`a.sort()` 原地修改并返回 None。把 `a.sort()` 赋值给变量得到 None。

解决:确认需要新数组还是原地排序,`sorted_arr = np.sort(a)` 或 `a.sort()` 后直接使用 `a`。
