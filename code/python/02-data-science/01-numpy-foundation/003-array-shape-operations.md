---
title: 1.3 数组形状操作
sidebar:
  order: 3
---
# 1.3 数组形状操作

创建数组后,经常需要调整它的结构:把一维数据排成矩阵、交换坐标轴、把多个数组合并、把一个数组拆成几块。这些操作不改变数据本身,只改变数据在维度上的组织方式。本节将系统讲解形状查询与改变、转置、拼接、拆分、维度增删、重复与平铺这些核心的形状操作,并说明哪些操作返回视图、哪些返回副本。

## 1.3.1 形状查询与改变

### shape 属性查询

数组的形状通过 `shape` 属性查看,它是描述各维度大小的元组:

```python
import numpy as np

a = np.arange(24)
print(a.shape)        # (24,)

b = a.reshape(4, 6)
print(b.shape)        # (4, 6)
```

### reshape() 改变形状

`reshape()` 返回一个新形状的数组,数据按行优先(最后一个轴变化最快)重新排列。总元素数必须保持不变:

```python
import numpy as np

a = np.arange(12)
b = a.reshape(3, 4)
print(b)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

c = a.reshape(2, 2, 3)
print(c.shape)    # (2, 2, 3)
```

某一维可以用 `-1` 表示"自动推断",让 NumPy 根据总元素数和其他维度算出该维大小:

```python
a = np.arange(12)
print(a.reshape(3, -1).shape)    # (3, 4)
print(a.reshape(-1, 4).shape)    # (3, 4)
print(a.reshape(-1).shape)       # (12,)，还原为一维
```

`reshape` 在能表示时返回视图(共享内存),否则返回副本。判断是否复制用 `np.shares_memory`:

```python
a = np.arange(12)
b = a.reshape(3, 4)
print(np.shares_memory(a, b))    # True，共享内存
```

### resize() 修改形状

`resize()` 与 `reshape` 的区别在于,它会**原地修改**数组并可能改变元素总数:

```python
a = np.arange(6)
a.resize(2, 3)     # 原地改成 2x3
print(a)
# [[0 1 2]
#  [3 4 5]]

b = np.arange(6)
b.resize(2, 4)     # 元素数从 6 变 8,多出的位置补 0
print(b)
# [[0 1 2 3]
#  [4 5 0 0]]
```

`resize()` 直接改原数组且返回 `None`。若元素数减少,尾部数据被丢弃;增多,新增位置填充 0。

### flatten() 与 ravel()

两者都把多维数组展平为一维。区别:`ravel()` 优先返回视图,`flatten()` 始终返回副本:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)
print(a.ravel())      # [0 1 2 3 4 5]
print(a.flatten())    # [0 1 2 3 4 5]

print(np.shares_memory(a, a.ravel()))    # True，视图
print(np.shares_memory(a, a.flatten()))  # False，副本
```

`ravel()` 只有在无法表示为视图时才复制,因此更省内存。两者都支持 `order` 参数控制展平顺序(`C` 行优先默认,`F` 列优先)。

## 1.3.2 转置:.T、transpose()、swapaxes()

### .T 属性转置

`.T` 返回转置数组,即交换两个轴。对二维数组就是行列互换:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)
print(a)
# [[0 1 2]
#  [3 4 5]]

print(a.T)
# [[0 3]
#  [1 4]
#  [2 5]]
```

`.T` 对一维数组无效(形状不变),对多维数组是交换最后两个轴,不适用于任意轴交换。

### transpose() 指定轴顺序

`transpose()` 接受轴顺序元组,可以按任意顺序重排维度:

```python
a = np.arange(24).reshape(2, 3, 4)
b = a.transpose(1, 0, 2)    # 交换前两个轴
print(a.shape)              # (2, 3, 4)
print(b.shape)              # (3, 2, 4)

c = a.transpose(2, 0, 1)    # 重排为 (4, 2, 3)
print(c.shape)              # (4, 2, 3)
```

`transpose` 返回视图,共享底层数据。

### swapaxes() 交换两个轴

`swapaxes(axis1, axis2)` 交换指定的两个轴,是高维数组常用的轴操作:

```python
a = np.arange(24).reshape(2, 3, 4)
b = a.swapaxes(0, 2)
print(a.shape)    # (2, 3, 4)
print(b.shape)    # (4, 3, 2)
```

`transpose` 可以一次重排任意个轴,`swapaxes` 只交换两个轴,`swapaxes(i, j)` 是 `transpose` 的特例。

## 1.3.3 数组拼接

拼接把多个数组合成一个,沿指定轴连接。参与拼接的数组在非拼接轴上的大小必须一致。

### np.concatenate()

`np.concatenate()` 按指定轴拼接多个数组,是最通用的拼接函数:

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])

# 沿轴 0(行方向)拼接
print(np.concatenate((a, b), axis=0))
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# 沿轴 1(列方向)拼接
print(np.concatenate((a, b), axis=1))
# [[1 2 5 6]
#  [3 4 7 8]]
```

### vstack()、hstack()、dstack()

这三个是沿固定轴的便捷函数,语义更直观:

- `np.vstack()` 沿轴 0(垂直方向)堆叠,即纵向拼行
- `np.hstack()` 沿轴 1(水平方向)堆叠,即横向拼列
- `np.dstack()` 沿轴 2(深度方向)堆叠,常用于构造三维数据

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(np.vstack((a, b)))    # 纵向堆叠成 2 行
# [[1 2 3]
#  [4 5 6]]

print(np.hstack((a, b)))    # 横向拼接成一维
# [1 2 3 4 5 6]

x = np.array([[[1], [2]]])
y = np.array([[[3], [4]]])
print(np.dstack((x, y)).shape)    # (1, 2, 2)
```

`vstack` 和 `hstack` 会自动把一维数组升维,使用上更省心。`vstack` 等价于 `concatenate(..., axis=0)`,`hstack` 等价于 `concatenate(..., axis=1)`。

### np.stack()

`np.stack()` 沿**新轴**堆叠,即增加一个维度把数排列起来,而不是在已有轴上拼接:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# 沿新轴 0 堆叠
c = np.stack((a, b), axis=0)
print(c.shape)    # (2, 3)
print(c)
# [[1 2 3]
#  [4 5 6]]

# 沿新轴 1 堆叠
d = np.stack((a, b), axis=1)
print(d.shape)    # (3, 2)
print(d)
# [[1 4]
#  [2 5]
#  [3 6]]
```

`stack` 与 `concatenate` 的关键区别:`stack` 增加一个维度,`concatenate` 在已有维度上连接。`stack` 要求各数组形状完全一致。

## 1.3.4 数组拆分

拆分与拼接相反,把数组沿某个轴切成若干段。

### np.split()

`np.split(ary, indices_or_sections, axis)` 按给定位置切分:

```python
import numpy as np

a = np.arange(9)

# 等分为 3 份
parts = np.split(a, 3)
print(parts)   # [array([0,1,2]), array([3,4,5]), array([6,7,8])]

# 按位置切分:在索引 2、5 处切
parts2 = np.split(a, [2, 5])
print(parts2)  # [array([0,1]), array([2,3,4]), array([5,6,7,8])]
```

### vsplit()、hsplit()、dsplit()

- `np.vsplit()` 沿轴 0 拆分(垂直切行)
- `np.hsplit()` 沿轴 1 拆分(水平切列)
- `np.dsplit()` 沿轴 2 拆分

```python
import numpy as np

a = np.arange(16).reshape(4, 4)
print(a)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]
#  [12 13 14 15]]

h = np.hsplit(a, 2)      # 水平切,每份 2 列
print(h[0])
# [[ 0  1]
#  [ 4  5]
#  [ 8  9]
#  [12 13]]

v = np.vsplit(a, 2)      # 垂直切,每份 2 行
print(v[1])
# [[ 8  9 10 11]
#  [12 13 14 15]]
```

拆分结果可以是一个数组构成的列表,通过下标访问每个部分。

## 1.3.5 添加/删除维度

### np.newaxis

`np.newaxis` 在指定位置插入一个长度为 1 的新轴,用于改变数组的维度:

```python
import numpy as np

a = np.array([1, 2, 3])
print(a.shape)                 # (3,)

row = a[np.newaxis, :]         # 变成行向量
print(row.shape)               # (1, 3)

col = a[:, np.newaxis]         # 变成列向量
print(col.shape)               # (3, 1)
print(col)
# [[1]
#  [2]
#  [3]]
```

`newaxis` 常与广播配合,把一个一维数组转换成列向量参与矩阵运算。

### np.expand_dims()

`expand_dims(a, axis)` 的功能与 `newaxis` 相同,但以函数形式按轴位置插入新轴:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.expand_dims(a, axis=0)
print(b.shape)    # (1, 3)

c = np.expand_dims(a, axis=1)
print(c.shape)    # (3, 1)

d = np.expand_dims(a, axis=-1)
print(d.shape)    # (3, 1)，-1 表示在末尾插入
```

### np.squeeze()

`np.squeeze()` 删除所有长度为 1 的轴,用于去掉多余的维度:

```python
import numpy as np

a = np.array([[[1], [2], [3]]])
print(a.shape)               # (1, 3, 1)

b = np.squeeze(a)
print(b.shape)               # (3,)

# 可以指定要删除的轴
c = np.squeeze(a, axis=0)
print(c.shape)               # (3, 1)
```

`squeeze` 只删除长度为 1 的轴,其他轴不受影响。数据经过拼接、reshape 后常出现单维度,用 `squeeze` 清理。

## 1.3.6 重复与平铺

### np.tile() 平铺整个数组

`np.tile(A, reps)` 把整个数组像铺瓷砖一样重复平铺,reps 指定每个轴的重复次数:

```python
import numpy as np

a = np.array([1, 2, 3])

# 一维平铺 2 次
print(np.tile(a, 2))    # [1 2 3 1 2 3]

# 平铺成 2 行 3 列
b = np.tile(a, (2, 3))
print(b)
# [[1 2 3 1 2 3]
#  [1 2 3 1 2 3]]
```

### np.repeat() 重复元素

`np.repeat()` 逐个重复数组的元素,而不是平铺整个数组:

```python
import numpy as np

a = np.array([1, 2, 3])

# 每个元素重复 2 次
print(np.repeat(a, 2))    # [1 1 2 2 3 3]

# 指定每个元素的重复次数
print(np.repeat(a, [1, 2, 3]))   # [1 2 2 3 3 3]

# 二维数组按轴重复
b = np.array([[1, 2], [3, 4]])
print(np.repeat(b, 2, axis=1))
# [[1 1 2 2]
#  [3 3 4 4]]
```

`tile` 和 `repeat` 的语义对比:

```python
a = np.array([1, 2])
print(np.tile(a, 3))       # [1 2 1 2 1 2]，整个数组重复
print(np.repeat(a, 3))     # [1 1 1 2 2 2]，逐个元素重复
```

## 练习题

### 第1题 概念理解

写出下面代码的输出结果,并解释 `reshape`、`ravel`、`flatten` 在返回视图还是副本上的区别。

```python
import numpy as np

a = np.arange(12).reshape(3, 4)
print(a.ravel())
print(a.flatten())
print(a.reshape(-1).shape)
print(np.shares_memory(a, a.ravel()))
```

::: details 参考答案

```python
[0 1 2 3 4 5 6 7 8 9 10 11]
[0 1 2 3 4 5 6 7 8 9 10 11]
(12,)
True
```

`ravel()` 优先返回视图(共享内存),`flatten()` 始终返回副本。`reshape(-1)` 还原为一维。判断共享用 `np.shares_memory`。
:::

### 第2题 代码编写

`a = np.array([[1, 2, 3], [4, 5, 6]])` 和 `b = np.array([[7, 8, 9], [10, 11, 12]])`。用三种方式把两个数组合并成一个 4x3 的数组,再拆分回原来的两个 2x3 数组。

::: details 参考答案

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([[7, 8, 9], [10, 11, 12]])

# 三种纵向拼接方式
c1 = np.concatenate((a, b), axis=0)
c2 = np.vstack((a, b))
c3 = np.stack((a, b), axis=0).reshape(4, 3)

# 拆回两个 2x3
parts = np.vsplit(c1, 2)
print(parts[0])
print(parts[1])
```

`concatenate`、`vstack` 沿轴 0 拼接;`stack` 沿新轴堆叠后 reshape。`vsplit` 按 2 份垂直切回。
:::

### 第3题 进阶练习

说明 `np.tile(np.array([1, 2]), 3)` 与 `np.repeat(np.array([1, 2]), 3)` 的输出差异,并给出把一维数组 `np.array([1, 2, 3])` 转成 3x1 列向量再平铺成 3x4 矩阵的代码。

::: details 参考答案

```python
import numpy as np

print(np.tile(np.array([1, 2]), 3))     # [1 2 1 2 1 2]，整体重复
print(np.repeat(np.array([1, 2]), 3))   # [1 1 1 2 2 2]，逐个重复

a = np.array([1, 2, 3])
col = a[:, np.newaxis]      # (3, 1) 列向量
print(col.shape)            # (3, 1)
b = np.tile(col, (1, 4))    # 平铺成 3x4
print(b.shape)              # (3, 4)
```

`tile` 重复整个数组,`repeat` 重复每个元素。列向量用 `[:, np.newaxis]` 得到,再用 `tile` 平铺。
:::

### 第4题 项目实践

命令行任务管理器有 6 条任务,每条的属性(标题长度、优先级、剩余天数)记录在数组 `task_matrix = np.arange(18).reshape(6, 3)` 中。请把任务按属性拆成 3 列分别处理,并把 6 条任务复制成 2 组(共 12 条)以便后续分组实验。

::: details 参考答案

```python
import numpy as np

task_matrix = np.arange(18).reshape(6, 3)
cols = np.hsplit(task_matrix, 3)   # 拆成 3 列
print(cols[0].shape)               # (6, 1) 标题长度
print(cols[1].shape)               # (6, 1) 优先级
print(cols[2].shape)               # (6, 1) 剩余天数

dup = np.tile(task_matrix, (2, 1)) # 复制成 2 组
print(dup.shape)                   # (12, 3)
```

:::

## 常见错误

**错误 1 · `ValueError: cannot reshape array of size 6 into shape (2,4)`**

原因:`reshape` 要求新旧元素总数一致。`arange(6)` 有 6 个元素,不能重排成 8 个元素的 (2,4)。

解决:确认总元素数不变,或某一维用 `-1` 让 NumPy 自动推断,如 `a.reshape(2, -1)`。

**错误 2 · `ValueError: all the input array dimensions except for the concatenation axis must match exactly`**

原因:拼接时非拼接轴的维度不一致。例如按列拼接两数组,但它们的行数不同。

解决:检查各数组 `shape`,确保拼接轴外的维度完全一致。用 `vstack`/`hstack` 时会自动处理一维升维,但维度仍必须匹配。

**错误 3 · 修改 `reshape` 或 `transpose` 的结果导致原数组变化**

原因:这些操作返回视图,共享底层数据。

解决:需要独立数据时调用 `.copy()`。判断是否共享用 `np.shares_memory(a, b)`。

**错误 4 · `resize()` 改变元素总数导致数据丢失或填充 0**

原因:`a.resize()` 原地修改,若新形状元素数少于原数会丢弃尾部,多于原数会补 0,结果可能不符合预期。

解决:需要改变元素总数时先明确新形状大小;`reshape` 不能改变元素总数,`resize` 才可以但需注意补 0 行为。
