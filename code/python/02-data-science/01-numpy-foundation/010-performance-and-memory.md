---
title: 1.10 性能与内存优化
sidebar:
  order: 10
---
# 1.10 性能与内存优化

NumPy 的高性能建立在底层内存布局和向量化运算之上。但同样的代码,内存布局不同、是否产生副本、是否用循环逐元素处理,性能差异可以达到数量级。数据规模增大后,内存占用本身也会成为瓶颈。本节将讲解数组的内存布局、视图与副本对性能的影响、用向量化替代循环的方法,以及 `bincount`、`nditer`、`einsum`、`as_strided` 等进阶工具,帮助写出又快又省内存的数组代码。

## 1.10.1 数组内存布局:C 顺序与 F 顺序

### 行优先与列优先

数组在内存中是连续的一维字节流。**C 顺序**(行优先)先排完一行再排下一行,是 NumPy 默认;**F 顺序**(列优先,又称 Fortran 顺序)先排完一列再排下一列:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)
print(a)
# [[0 1 2]
#  [3 4 5]]

# C 顺序:内存中依次是 0 1 2 3 4 5
print(a.flatten(order="C"))   # [0 1 2 3 4 5]

# F 顺序:内存中依次是 0 3 1 4 2 5
print(a.flatten(order="F"))   # [0 3 1 4 2 5]
```

### 用 order 参数创建

创建和 reshape 时可以指定内存顺序:

```python
import numpy as np

c = np.asfortranarray(np.arange(6).reshape(2, 3))   # 强制 F 顺序
print(c.flags["F_CONTIGUOUS"])   # True

f = np.arange(6, order="F")
print(f.shape)   # (6,)
```

### ndarray.flags 查看内存标志

`ndarray.flags` 描述数组的内存布局特征:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)
print(a.flags["C_CONTIGUOUS"])   # True，C 连续
print(a.flags["F_CONTIGUOUS"])   # False
print(a.flags["OWNDATA"])        # True，拥有自己的数据
print(a.flags["WRITEABLE"])      # True，可写

b = a.T                          # 转置后内存布局改变
print(b.flags["C_CONTIGUOUS"])   # False，转置通常不再 C 连续
print(b.flags["F_CONTIGUOUS"])   # True
```

内存布局影响运算效率:按内存连续方向遍历最快。对转置或切片产生的非连续数组,运算可能更慢,必要时用 `np.ascontiguousarray` 转回连续布局。

## 1.10.2 视图与副本对性能影响

### 视图避免复制开销

视图共享内存,创建几乎零开销,也不需要额外内存:

```python
import numpy as np

a = np.arange(1000000)
v = a[::2]        # 视图，隔一个取一个，不复制
print(v.base is a)   # True，共享底层数据

c = a[::2].copy() # 副本，独立内存
print(c.base is a)   # False
```

对大数据集,切片返回视图比复制省内存。但视图的非连续访问在运算时可能略慢,需要权衡。

### 就地运算避免中间数组

`+=`、`*=` 就地运算不创建中间数组,省内存也更快:

```python
import numpy as np

a = np.arange(1000000)
b = np.ones(1000000)

a += b          # 就地，不产生新数组
# a = a + b     # 创建新数组，旧数组等待回收
```

在循环中反复创建中间数组会产生大量临时对象,就地运算能明显降低内存峰值。

### np.shares_memory 排查意外共享

```python
import numpy as np

a = np.arange(10)
b = a.reshape(2, 5)
print(np.shares_memory(a, b))   # True，reshape 返回视图

c = a[np.array([0, 1, 2])]      # 花式索引返回副本
print(np.shares_memory(a, c))   # False
```

## 1.10.3 向量化替代循环

### 对比循环与向量化

用 Python 循环逐元素运算,每个元素都有解释器开销;向量化在 C 层一次性处理整个数组,速度可快百倍:

```python
import numpy as np
import time

data = np.random.rand(1000000)

# 方式 1: Python 循环
start = time.time()
total1 = 0.0
for x in data:
    total1 += x * 2 + 1
loop_time = time.time() - start

# 方式 2: 向量化
start = time.time()
total2 = np.sum(data * 2 + 1)
vec_time = time.time() - start

print(f"循环耗时: {loop_time:.4f}s")
print(f"向量化耗时: {vec_time:.4f}s")
```

### 用向量化重写循环的常见模式

条件处理用 `np.where` 替代 if-else 循环:

```python
import numpy as np

data = np.random.randn(1000)

# 循环版
result1 = np.empty_like(data)
for i, x in enumerate(data):
    if x > 0:
        result1[i] = x
    else:
        result1[i] = 0.0

# 向量化版
result2 = np.where(data > 0, data, 0.0)
```

聚合统计用 `np.sum`/`np.mean` 替代累计循环,查找用 `np.argmax` 替代手写比较,这些都是用内置向量化函数替代循环的典型模式。

## 1.10.4 np.bincount() 与权重统计

`np.bincount` 统计非负整数数组中每个值出现的次数,是分组计数的快速工具:

```python
import numpy as np

data = np.array([0, 1, 1, 2, 0, 2, 2, 3])
counts = np.bincount(data)
print(counts)   # [2 2 3 1]，0 出现 2 次、1 出现 2 次、2 出现 3 次、3 出现 1 次
```

`bincount` 还支持权重参数,实现分组求和:

```python
import numpy as np

categories = np.array([0, 1, 0, 1, 0])    # 类别
values = np.array([10, 20, 30, 40, 50])   # 对应数值

# 按类别分组求和
sums = np.bincount(categories, weights=values)
print(sums)   # [90. 60.]，类别 0 的和 10+30+50=90，类别 1 的和 20+40=60

# 按类别分组计数
counts = np.bincount(categories)
print(counts)   # [3 2]

# 分组均值 = 分组和 / 分组计数
means = sums / counts
print(means)   # [30. 30.]
```

`bincount` 只接受非负整数索引,这是它相对通用分组方案的限制,但在该场景下速度极快。

## 1.10.5 内存共享与写时复制

### 写时复制概念

NumPy 数组默认共享内存即同步修改。`np.copy` 显式复制是唯一安全的隔离方式。某些场景利用视图共享内存来省内存,但要注意写操作的副作用。

### np.may_share_memory

判断两个数组是否可能共享内存(比 `shares_memory` 更宽松):

```python
import numpy as np

a = np.arange(10)
b = a[:5]           # 切片视图
print(np.may_share_memory(a, b))   # True

c = a[np.arange(5)]  # 花式索引副本
print(np.may_share_memory(a, c))   # False
```

### 内存视图的写操作陷阱

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
row = a[0]          # 视图
row[0] = 100        # 修改视图
print(a)            # 原数组也被修改 [[100 2 3] [4 5 6]]
```

要避免这种意外修改,读取子数组后若会修改,先 `.copy()`。

## 1.10.6 使用 np.nditer() 迭代数组元素

`np.nditer` 提供高效的多维迭代,可以控制访问顺序、读写模式:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)

# 默认按 C 顺序迭代
for x in np.nditer(a):
    print(x, end=" ")   # 0 1 2 3 4 5
print()

# 按 F 顺序迭代
for x in np.nditer(a, order="F"):
    print(x, end=" ")   # 0 3 1 4 2 5
print()
```

`nditer` 支持同时迭代多个数组:

```python
a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
for x, y in np.nditer([a, b]):
    print(x * y, end=" ")   # 10 40 90
print()
```

### nditer 配合 readwrite 修改

用 `op_flags=['readwrite']` 让迭代可写:

```python
a = np.arange(6).reshape(2, 3)
for x in np.nditer(a, op_flags=["readwrite"]):
    x[...] = x * 2       # 每个元素乘 2
print(a)
# [[ 0  2  4]
#  [ 6  8 10]]
```

`nditer` 常用于需要逐元素访问且内置 ufunc 无法表达的逻辑,但能用向量化就别用 `nditer`,它仍是逐元素 Python 循环,性能低于 ufunc。

## 1.10.7 使用 np.einsum 高效张量收缩

`einsum` 用爱因斯坦求和记号描述运算,避免创建中间大数组,内存更省:

```python
import numpy as np

a = np.random.rand(100, 50)
b = np.random.rand(50, 200)

# 常规矩阵乘法
c1 = a @ b                    # (100, 200)

# einsum 等价写法
c2 = np.einsum("ij,jk->ik", a, b)
print(c1.shape, c2.shape)     # (100, 200) (100, 200)
print(np.allclose(c1, c2))    # True

# 批量矩阵乘法(避免用循环逐个相乘)
batched_a = np.random.rand(16, 100, 50)   # 16 个矩阵
batched_b = np.random.rand(16, 50, 200)
batch_result = np.einsum("bij,bjk->bik", batched_a, batched_b)
print(batch_result.shape)     # (16, 100, 200)
```

`einsum` 通过指定下标直接完成"求和 + 乘法"的组合,中间不产生大数组,是张量运算省内存的利器。

## 1.10.8 使用 as_strided 滑动窗口视图

`np.lib.stride_tricks.as_strided` 通过重新解释内存步长,创建滑动窗口等自定义视图。它能实现极高的"无复制"性能,但也极其危险,可能访问越界内存导致崩溃或未定义行为。

```python
import numpy as np
from numpy.lib.stride_tricks import as_strided

a = np.arange(10)

# 构造一个滑动窗口: 每个窗口长度为 3,滑动步长为 1
# as_strided(数组, 新形状, 步长)
# 新形状 (8, 3), 第一个轴步长为原步长 1,第二个轴步长为 1
strides = (a.strides[0], a.strides[0])
windows = as_strided(a, shape=(8, 3), strides=strides)
print(windows)
# [[0 1 2]
#  [1 2 3]
#  [2 3 4]
#  ...
#  [7 8 9]]
```

### as_strided 的风险

`as_strided` 不检查内存边界,形状或步长计算错误会访问到数组外的内存,读取垃圾数据甚至导致程序崩溃:

```python
# 危险: 形状 (10, 3) 超出数据范围,最后一个窗口访问到数组外内存
# windows = as_strided(a, shape=(10, 3), strides=(a.strides[0], a.strides[0]))
```

### 安全的滑动窗口替代

官方推荐的滑动窗口函数是 `np.lib.stride_tricks.sliding_window_view`,它内部做安全检查:

```python
import numpy as np

a = np.arange(10)
windows = np.lib.stride_tricks.sliding_window_view(a, window_shape=3)
print(windows.shape)   # (8, 3)
print(windows[0])      # [0 1 2]
print(windows[-1])     # [7 8 9]
```

滑动窗口在计算移动平均、卷积、时间序列特征提取中大量使用。能用 `sliding_window_view` 就不要手写 `as_strided`,后者留给确认内存安全的高级场景。

## 练习题

### 第1题 概念理解

什么是 C 顺序和 F 顺序?`a.flags["C_CONTIGUOUS"]` 与 `a.flags["F_CONTIGUOUS"]` 分别表示什么?为什么说内存布局影响性能?

::: details 参考答案

C 顺序(行优先)先排完一行再排下一行,是 NumPy 默认;F 顺序(列优先)先排完一列再排下一列。`C_CONTIGUOUS`/`F_CONTIGUOUS` 表示数组在内存中是否按 C/F 顺序连续存放。按内存连续方向遍历时 CPU 缓存命中率高,运算更快;转置等操作可能破坏连续性导致性能下降。
:::

### 第2题 代码编写

给定 `data = np.array([0, 1, 1, 2, 0, 1, 2, 2, 0, 3])`,用 `np.bincount` 统计每个值出现次数,并统计每个值对应的加权和(假设 `weights = np.arange(10, 20)`)。

::: details 参考答案

```python
import numpy as np

data = np.array([0, 1, 1, 2, 0, 1, 2, 2, 0, 3])
weights = np.arange(10, 20)

counts = np.bincount(data)
print(counts)   # [3 3 3 1]

sums = np.bincount(data, weights=weights)
print(sums)     # 每组加权和
```

:::

### 第3题 进阶练习

用 `sliding_window_view` 计算数组 `a = np.arange(12)` 的长度为 4 的滑动窗口,再对每个窗口求均值,得到长度为 9 的移动平均序列。

::: details 参考答案

```python
import numpy as np

a = np.arange(12)
windows = np.lib.stride_tricks.sliding_window_view(a, window_shape=4)
print(windows.shape)    # (9, 4)

moving_avg = windows.mean(axis=1)
print(moving_avg)       # [1.5 2.5 3.5 4.5 5.5 6.5 7.5 8.5 9.5]
```

`sliding_window_view` 生成每个长度 4 的窗口,沿 axis=1 求均值得到移动平均。
:::

### 第4题 项目实践

命令行任务管理器有 100 万个任务耗时数据(用 `np.random.rand` 模拟)。请比较"用 Python 循环求和"与"用 `np.sum` 向量化求和"的性能差异,并说明大数据场景下应优先向量化的原因。

::: details 参考答案

```python
import numpy as np
import time

data = np.random.rand(1000000)

start = time.time()
total1 = sum(x for x in data)   # Python 循环
loop_time = time.time() - start

start = time.time()
total2 = np.sum(data)           # 向量化
vec_time = time.time() - start

print(f"循环: {loop_time:.4f}s")
print(f"向量化: {vec_time:.4f}s")
```

向量化在 C 层一次性处理整个数组,避免逐元素 Python 解释器开销,大数据下差距可达数十到上百倍。应优先用内置聚合函数、ufunc、`einsum` 等向量化手段。
:::

## 常见错误

**错误 1 · 在大数据上写 Python 循环导致极慢**

原因:循环逐元素调用 Python 解释器,每个元素都有巨大开销,无法发挥 NumPy 的 C 层加速。

解决:用向量化 ufunc、聚合函数、`np.where`、`einsum` 替代循环。

**错误 2 · 大量中间数组导致内存峰值飙升**

原因:`a = a + b` 创建新数组,旧数组等待回收,循环中反复执行产生大量临时对象。

解决:用 `+=`、`*=` 就地运算,或 `out=` 参数指定输出数组,减少中间分配。

**错误 3 · `as_strided` 形状计算错误导致越界访问**

原因:`as_strided` 不做边界检查,错误的 shape/strides 会让数组访问到内存外部,结果未定义甚至崩溃。

解决:优先用 `sliding_window_view` 等安全接口;确需 `as_strided` 时仔细核对形状与步长。

**错误 4 · 修改切片视图导致原数组被意外修改**

原因:切片/reshape/transpose 返回视图,共享内存,写入会污染原数组。

解决:需要独立数据时 `.copy()`;对只读场景设置 `flags["WRITEABLE"] = False` 防止误写。
