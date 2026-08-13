---
title: 1.6 广播机制
sidebar:
  order: 6
---
# 1.6 广播机制

第 4 章提到,标量与数组运算时标量会扩展到每个元素。这个"扩展"背后有一套通用规则,叫做**广播**(broadcasting)。广播允许形状不同但兼容的数组参与同一运算,NumPy 会自动把较小的数组扩展成较大的形状,而不需要显式复制数据。理解广播,才能判断哪些形状能一起运算、运算结果是什么形状,避免写出报错或结果错误的代码。本节将讲解广播规则、形状推断方法,以及控制广播的实用技巧。

## 1.6.1 广播的基本概念

### 形状相同直接运算

形状完全相同的数组逐元素运算,不存在广播:

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([[10, 20, 30], [40, 50, 60]])
print(a + b)
# [[11 22 33]
#  [44 55 66]]
```

### 标量与数组

标量(形状 `()` )与任何数组都兼容,广播为与数组相同的形状:

```python
a = np.array([[1, 2, 3], [4, 5, 6]])
print(a * 2)
# [[ 2  4  6]
#  [ 8 10 12]]
```

### 行向量与二维数组

形状 `(1, 3)` 的行向量与 `(2, 3)` 的数组运算,行向量沿行方向复制:

```python
a = np.array([[1, 2, 3], [4, 5, 6]])
row = np.array([10, 20, 30])
print(a + row)
# [[11 22 33]
#  [24 35 46]]
```

这里 `row` 形状是 `(3,)`,被广播成 `(2, 3)` 后逐行相加。这是广播最常见的用途:对整个二维数组的每一行做相同的变换。

### 列向量与二维数组

形状 `(3, 1)` 的列向量与 `(3, 3)` 数组运算,列向量沿列方向复制:

```python
a = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
col = np.array([[10], [20], [30]])
print(a + col)
# [[11 12 13]
#  [24 25 26]
#  [37 38 39]]
```

## 1.6.2 广播规则(从后向前比对维度)

NumPy 广播的完整规则:从最后一个维度开始,向前逐个比较两个数组的维度大小,满足以下任一条件即可广播:

1. 两个维度大小相等
2. 其中一个维度大小为 1
3. 其中一个数组没有该维度(视为 1)

所有维度都满足条件时,结果形状取每个维度上的较大值;任一维度两个大小不相等且都不为 1,则广播失败,抛出 `ValueError`。

```python
import numpy as np

# 规则示例 1: (2, 3) 与 (3,)
# 从后往前: 3 == 3, 2 与缺省(视为 1) -> 2 或 1 取大值
a = np.zeros((2, 3))
b = np.array([1, 2, 3])
print((a + b).shape)   # (2, 3)

# 规则示例 2: (3, 1) 与 (1, 3)
# 从后往前: 1 与 3 -> 3; 3 与 1 -> 3
x = np.ones((3, 1))
y = np.arange(3)          # (3,)
print((x + y).shape)      # (3, 3)
print(x + y)
# [[0. 1. 2.]
#  [1. 2. 3.]
#  [2. 3. 4.]]

# 规则示例 3: (2, 1, 3) 与 (4, 3)
c = np.zeros((2, 1, 3))
d = np.ones((4, 3))
print((c + d).shape)      # (2, 4, 3)
```

### 常见广播组合速查

| 数组 A 形状 | 数组 B 形状 | 结果形状 |
| ----------- | ----------- | -------- |
| (2, 3) | (3,) | (2, 3) |
| (2, 3) | (2, 1) | (2, 3) |
| (3, 1) | (1, 3) | (3, 3) |
| (4, 1) | (3,) | (4, 3) |
| (2, 1, 3) | (4, 3) | (2, 4, 3) |
| (2, 3) | (4, 3) | 广播失败 |

### 广播失败的例子

```python
import numpy as np

a = np.ones((2, 3))
b = np.ones((2, 4))
# a + b 会报错: 从后往前比对, 3 与 4 不等, 且都不为 1
# ValueError: operands could not be broadcast together with shapes (2,3) (2,4)
```

## 1.6.3 广播后的形状推断

### 用 reshape/newaxis 显式广播

广播时常需要显式调整形状,常见手段是 `reshape` 和 `np.newaxis`:

```python
import numpy as np

# 对每一列做标准化(减去列均值)
data = np.array([[1.0, 100.0], [3.0, 200.0], [5.0, 300.0]])
col_mean = data.mean(axis=0)          # shape (2,)
print(col_mean)                        # [3. 200.]

centered = data - col_mean             # (3,2) 与 (2,) 广播
print(centered)
# [[-2. -100.]
#  [ 0.    0.]
#  [ 2.  100.]]
```

如果要对每行做操作,需要把向量先转成列向量:

```python
# 对每一行做归一化(除以行和)
row_sum = data.sum(axis=1)            # shape (3,)
print(row_sum)                         # [101. 203. 305.]

# 直接 data / row_sum 会广播失败吗? (3,2) 与 (3,): 2 与 3 冲突
# 需要把 row_sum 变成 (3,1)
row_sum_col = row_sum[:, np.newaxis]   # shape (3, 1)
normalized = data / row_sum_col
print(normalized)
# [[0.00990099 0.99009901]
#  [0.01477833 0.98522167]
#  [0.01639344 0.98360656]]
```

`[:, np.newaxis]` 把一维向量转成列向量,是广播中常用的手段。

### 用 reshape(-1, 1) 转换

另一种常见写法是用 `reshape(-1, 1)`:

```python
import numpy as np

v = np.array([1, 2, 3])
print(v.reshape(-1, 1).shape)   # (3, 1)
print(v[:, np.newaxis].shape)   # (3, 1)，等价
```

## 1.6.4 就地广播与内存视图

### 就地运算

`+=`、`*=` 等就地运算符执行原地修改,不创建新数组,更省内存。就地运算同样遵循广播规则:

```python
import numpy as np

a = np.arange(6).reshape(2, 3)
b = np.array([10, 20, 30])
a += b          # 就地广播加法
print(a)
# [[10 21 32]
#  [13 24 35]]
```

就地运算要求右侧广播后的形状与左侧一致,且类型兼容。

### 广播不真正复制数据

广播在概念上"复制"数组,但实际通过内存视图实现,不占用额外内存。用 `np.broadcast_to` 可以显式查看广播结果:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.broadcast_to(a, (4, 3))   # 把 (3,) 广播成 (4, 3)
print(b)
# [[1 2 3]
#  [1 2 3]
#  [1 2 3]
#  [1 2 3]]
print(b.shape)    # (4, 3)

# broadcast_to 返回只读视图,共享内存
print(np.shares_memory(a, b))    # True
```

`broadcast_to` 返回的是只读视图,尝试写入会报错。需要可写的广播结果时,应显式调用 `.copy()`。

## 1.6.5 禁止广播(显式维度匹配)

### 需要精确形状的场景

有些函数不参与广播,要求输入形状精确匹配。例如 `np.dot` 对一维数组要求长度相等,`np.linalg.solve` 要求矩阵与向量维度匹配。需要精确逐元素对应时,可以用 `np.broadcast_arrays` 强制生成形状一致的数组:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(np.broadcast_arrays(a, b))   # 两个 (3,) 数组

# 不同形状时强制广播成相同形状
c = np.array([1, 2, 3])
d = np.array([[1], [2]])
res = np.broadcast_arrays(c, d)
print(res[0].shape)   # (2, 3)
print(res[1].shape)   # (2, 3)
```

### 用 assert 检查形状

调试时用 `np.testing.assert_array_equal` 或直接断言形状,防止广播产生意外的结果:

```python
import numpy as np

a = np.zeros((3, 4))
b = np.ones((4,))
assert a.shape[1] == b.shape[0]   # 形状匹配检查
result = a + b
print(result.shape)   # (3, 4)
```

## 练习题

### 第1题 概念理解

写出下面代码的输出结果(形状和值),并解释广播规则。

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([10, 20, 30])
print(a + b)

x = np.arange(3).reshape(3, 1)
y = np.arange(3)
print((x + y).shape)
```

::: details 参考答案

```python
[[11 22 33]
 [14 25 36]]
(3, 3)
```

`(2,3)` 与 `(3,)` 广播:最后一个维度 3 匹配,第一个维度 2 与缺省(视为 1)取大值 2。`(3,1)` 与 `(3,)` 广播:1 与 3 兼容,结果 `(3,3)`。
:::

### 第2题 代码编写

给定矩阵 `data = np.array([[1, 2], [3, 4], [5, 6]])`。用广播计算每行的均值,然后让每行减去该行均值(行内中心化),要求利用 `[:, np.newaxis]` 把行均值转成列向量。

::: details 参考答案

```python
import numpy as np

data = np.array([[1, 2], [3, 4], [5, 6]])
row_mean = data.mean(axis=1)            # [1.5 3.5 5.5]
row_mean_col = row_mean[:, np.newaxis]  # (3,1)
centered = data - row_mean_col
print(centered)
# [[-0.5  0.5]
#  [-0.5  0.5]
#  [-0.5  0.5]]
```

不加 `[:, np.newaxis]` 时 `(3,2)` 与 `(3,)` 在第一个维度上 2 与 3 冲突,广播失败。
:::

### 第3题 进阶练习

判断以下运算能否广播,能广播的写出结果形状,不能的说明原因: (1) `(4, 1)` 与 `(3,)`; (2) `(2, 3)` 与 `(4, 3)`; (3) `(2, 1, 3)` 与 `(4, 3)`; (4) 标量 `5` 与 `(2, 3)`。

::: details 参考答案

(1) 能,结果 (4, 3):`(4,1)` 与 `(3,)` 从后往前,1 与 3 兼容,4 与缺省兼容。(2) 不能:最后一个维度 3 与 3 匹配,但第一个维度 2 与 4 不等且都不为 1。(3) 能,结果 (2, 4, 3):`(2,1,3)` 与 `(4,3)` 从后往前 3==3、1 与 4 兼容、2 与缺省兼容。(4) 能,结果 (2, 3):标量 `()` 与任何形状兼容。
:::

### 第4题 项目实践

命令行任务管理器要按优先级对各任务的工时做加权。假设工时矩阵 `hours = np.array([[2, 3], [4, 1], [3, 5]])`(每行一个任务,每列一种工作类型),权重向量 `weights = np.array([0.6, 0.4])`。用广播计算每个任务的加权总工时。

::: details 参考答案

```python
import numpy as np

hours = np.array([[2, 3], [4, 1], [3, 5]])
weights = np.array([0.6, 0.4])

weighted = hours * weights            # 广播,每行乘权重
print(weighted)
# [[1.2 1.2]
#  [2.4 0.4]
#  [1.8 2. ]]

total = weighted.sum(axis=1)          # [2.4 2.8 3.8]，加权总工时
print(total)
```

`(3,2)` 与 `(2,)` 广播,权重向量沿行方向扩展。
:::

## 常见错误

**错误 1 · `ValueError: operands could not be broadcast together with shapes (2,3) (2,4)`**

原因:两个数组的某个维度大小不相等且都不为 1,广播失败。

解决:检查两侧 `shape`,用 `reshape`/`newaxis` 调整形状使维度兼容。

**错误 2 · 逐列操作时忘记转成列向量**

原因:想对每行做操作,但一维向量默认沿最后一个轴(列方向)广播,结果与预期相反。

解决:对行操作时用 `v[:, np.newaxis]` 或 `v.reshape(-1, 1)` 转成列向量。

**错误 3 · 广播产生意外的维度扩展**

原因:两个形状不同但"碰巧兼容"的数组运算,结果形状与直觉不符,后续索引起错。

解决:运算前打印两个数组的 `shape`,确认结果形状符合预期。

**错误 4 · 对 `broadcast_to` 的结果赋值报错**

原因:`np.broadcast_to` 返回只读视图,尝试写入会抛 `ValueError: assignment destination is read-only`。

解决:需要可写数组时,对广播结果调用 `.copy()` 生成独立副本。
