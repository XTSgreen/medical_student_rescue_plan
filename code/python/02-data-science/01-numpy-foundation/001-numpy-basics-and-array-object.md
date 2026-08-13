---
title: 1.1 NumPy 基础与数组对象
sidebar:
  order: 1
---
# 1.1 NumPy 基础与数组对象

上一模块完成了 Python 核心语法的学习，程序能处理字符串、列表、字典等内置数据结构。但处理真实数据时会遇到两个瓶颈：Python 列表存储数值数据占用内存大，对每个元素做运算要写循环、速度慢。NumPy 正是为解决这两个问题而生的数值计算库，它提供的 `ndarray` 数组对象把数据连续存放、运算整体执行，是后续 pandas、scikit-learn、深度学习框架的共同地基。本节将从 NumPy 的安装讲起，逐步覆盖 `ndarray` 的核心概念、数组属性、数据类型、创建方法，为整个数据科学章节打好基础。

## 1.1.1 NumPy 概述与安装

### NumPy 是什么

NumPy（Numerical Python 的缩写）是 Python 生态中最基础的数值计算库。它的核心是高性能的多维数组对象 `ndarray`，以及围绕数组的一整套数学函数。几乎所有 Python 科学计算库都建立在 NumPy 之上：pandas 的数据结构底层是 NumPy 数组，scikit-learn 的输入输出是 NumPy 数组，Matplotlib 绘图的数据也通常来自 NumPy。掌握 NumPy，等于拿到了进入整个 Python 数据科学生态的钥匙。

NumPy 与 Python 内置列表的核心差异在于两点。第一是内存布局：列表存储的是指向对象的指针，每个元素是一个独立对象，占用大量额外空间；`ndarray` 把数据连续存放在一块内存中，元素紧凑排列。第二是运算方式：对列表做加法是拼接，需要循环才能逐元素运算；对 `ndarray` 做加法是逐元素运算，且整个运算在 C 语言层面完成，速度快一个数量级以上。

### 安装 NumPy

NumPy 是第三方库，需要先安装再导入。使用 pip 安装：

```bash
pip install numpy
```

如果使用 conda 管理环境，可以用：

```bash
conda install numpy
```

安装完成后，在 Python 中验证：

```python
import numpy as np
print(np.__version__)   # 例如 1.26.0
```

导入时统一使用 `import numpy as np` 的别名，这是整个社区的惯例，后续所有代码都沿用这一写法。

## 1.1.2 ndarray 数组对象概念

### 从列表到数组

`ndarray`（N-dimensional array，多维数组）是 NumPy 的核心对象。最直接的创建方式是 `np.array()`，它接受 Python 列表或嵌套列表：

```python
import numpy as np

a = np.array([1, 2, 3, 4])           # 一维数组
b = np.array([[1, 2, 3], [4, 5, 6]]) # 二维数组，两行三列

print(a)   # [1 2 3 4]
print(b)
# [[1 2 3]
#  [4 5 6]]
```

数组的维度称为 **轴**（axis）。一维数组有一个轴，二维数组有两个轴：第一个轴是行方向（axis 0），第二个轴是列方向（axis 1）。数组的形状（shape）是一个描述每个轴上元素个数的元组。

```python
print(a.shape)   # (4,)，一维数组，4 个元素
print(b.shape)   # (2, 3)，两行三列
print(b.ndim)    # 2，两个维度
print(b.size)    # 6，总元素个数
```

### 数组与列表的区别

数组和列表表面相似，行为差异明显。列表支持异构元素，数组要求所有元素同一种类型。列表拼接用 `+`，数组 `+` 是逐元素加法：

```python
lst1 = [1, 2, 3]
lst2 = [4, 5, 6]
arr1 = np.array(lst1)
arr2 = np.array(lst2)

print(lst1 + lst2)   # [1, 2, 3, 4, 5, 6]，拼接
print(arr1 + arr2)   # [5 7 9]，逐元素相加
```

这一差异来自数组"元素类型统一 + 运算向量化"的设计。后续会看到，这种设计让数组的几乎所有运算都整体执行。

## 1.1.3 数组属性

`ndarray` 对象自带一组描述自身结构的属性，调试和编程时经常用到。

### shape、ndim、size

这三个属性描述数组的维度结构：

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])

print(a.shape)   # (2, 3)：2 行 3 列
print(a.ndim)    # 2：二维数组
print(a.size)    # 6：共 6 个元素
```

`shape` 是最常用的属性，它直接决定了数组参与广播、矩阵乘法等运算时的行为。`size` 等于 `shape` 各维度的乘积。一维数组的 `shape` 是只有一个元素的元组 `(n,)`，加逗号是为了与数字 `(n)` 区分。

### dtype、itemsize、nbytes

这三个属性描述数组的存储类型与占用空间：

```python
a = np.array([1, 2, 3])          # 默认整型
b = np.array([1.0, 2.0, 3.0])    # 浮点型
c = np.array([True, False, True])# 布尔型

print(a.dtype)    # int64
print(b.dtype)    # float64
print(c.dtype)    # bool

print(a.itemsize)  # 8，每个元素占 8 字节
print(a.nbytes)    # 24，8 * 3
```

`dtype` 是数组中每个元素的类型，`itemsize` 是单个元素占用的字节数，`nbytes` 是整个数组占用的总字节数，等于 `itemsize * size`。

## 1.1.4 数据类型对象（dtype）

### 内置数据类型一览

NumPy 提供比 Python 内置类型更精细的数值类型，每种类型都规定了元素占用固定字节数。常用类型如下：


| dtype        | 说明                   | 取值范围             |
| -------------- | ------------------------ | ---------------------- |
| `int8`       | 8 位有符号整型         | -128 ~ 127           |
| `int16`      | 16 位有符号整型        | -32768 ~ 32767       |
| `int32`      | 32 位有符号整型        | -2^31 ~ 2^31-1       |
| `int64`      | 64 位有符号整型        | -2^63 ~ 2^63-1       |
| `uint8`      | 8 位无符号整型         | 0 ~ 255              |
| `float16`    | 16 位浮点型            | 半精度               |
| `float32`    | 32 位浮点型            | 单精度               |
| `float64`    | 64 位浮点型            | 双精度，默认浮点类型 |
| `complex64`  | 复数，实部虚部各 32 位 | —                   |
| `complex128` | 复数，实部虚部各 64 位 | —                   |
| `bool`       | 布尔型                 | True / False         |
| `str` / `U`  | 字符串型               | 定长 Unicode 字符串  |
| `object`     | Python 对象型          | 任意 Python 对象     |

指定类型的方式是在创建数组时传 `dtype` 参数：

```python
import numpy as np

a = np.array([1, 2, 3], dtype=np.int16)
b = np.array([1, 2, 3], dtype=np.float32)
c = np.array([1, 2, 3], dtype=np.uint8)

print(a.dtype)   # int16
print(b.dtype)   # float32
print(c.dtype)   # uint8
```

也可以用字符串形式指定：

```python
d = np.array([1, 2, 3], dtype="int32")
print(d.dtype)   # int32
```

### 整数类型的溢出风险

定宽整型存在溢出问题。超出类型范围的值会发生回绕（wrap around），而不是报错：

```python
a = np.array([127], dtype=np.int8)
print(a)              # [127]
print(a + 1)          # [-128]，溢出回绕到最小值
```

`int8` 最大值是 127，加 1 后回绕到 -128。这个行为与 Python 原生整数不同，实际使用中要注意选择足够宽的整数类型。

### 无符号整型的陷阱

`uint8` 取值范围 0~255，不能表示负数。对无符号数组做减法，负数会回绕成大正数：

```python
a = np.array([0, 100, 200], dtype=np.uint8)
print(a - 1)   # [255 99 199]，0-1 回绕为 255
```

图像处理中像素值常用 `uint8` 存储（0~255），处理时容易踩到这一陷阱，需先转换成更大范围的类型再运算。

### 字符串类型

NumPy 字符串数组是定长的，创建时会根据最长元素自动确定每个字符串的最大长度：

```python
a = np.array(["hello", "hi", "goodbye"])
print(a.dtype)   # <U7，最多 7 个字符
```

定长特性意味着无法直接修改字符串长度，需要时转换 dtype 或改用 Python 列表。

## 1.1.5 数据类型转换：astype()

`astype()` 方法返回一个新数组，元素类型转换成指定 dtype。原数组不变。

```python
import numpy as np

a = np.array([1.7, 2.5, 3.2])
b = a.astype(np.int32)
print(b)       # [1 2 3]，浮点转整型会截断小数
print(b.dtype) # int32

c = a.astype(np.float16)
print(c.dtype) # float16

d = np.array([1, 2, 3]).astype(np.float64)
print(d.dtype) # float64
```

浮点转整型采用截断而不是四舍五入，`1.7` 转成 `1`，`2.5` 转成 `2`。这一行为与 `int()` 一致。

`astype()` 常用于两种情况：一是浮点运算后转回整型节省内存，二是解决无符号类型溢出问题。例如图像数据从 `uint8` 转 `int16` 后再做减法：

```python
img = np.array([200, 150, 100], dtype=np.uint8)
img_wide = img.astype(np.int16) - 150
print(img_wide)   # [50 0 -50]，负数可以正常表示
```

## 1.1.6 数组创建函数

### np.array() 与基础创建函数

`np.array()` 从已有列表创建数组，`np.zeros()`、`np.ones()`、`np.full()` 创建填充固定值的数组，`np.empty()` 创建未初始化数组：

```python
import numpy as np

a = np.array([1, 2, 3])                    # 从列表创建

z = np.zeros((2, 3))                        # 2x3 全 0
print(z)
# [[0. 0. 0.]
#  [0. 0. 0.]]

o = np.ones((2, 2))                         # 2x2 全 1
print(o)
# [[1. 1.]
#  [1. 1.]]

f = np.full((2, 3), 7)                      # 2x3 全部填充 7
print(f)
# [[7 7 7]
#  [7 7 7]]
```

`zeros`、`ones`、`full` 默认生成 `float64` 类型，可通过 `dtype` 参数指定。`np.full()` 的三个参数是形状、填充值和可选 dtype。

`np.empty()` 分配内存但不初始化，内容是未定义的随机垃圾值。它比 `zeros` 快，因为省去了填充步骤，但结果不可预测，通常只在马上要覆盖全部元素时使用：

```python
e = np.empty((2, 2))
print(e)   # 内容不确定，取决于内存中的残留数据
```

### arange() 与 linspace()

`np.arange()` 生成等差数列，类似 Python 的 `range` 但支持浮点数步长：

```python
import numpy as np

print(np.arange(5))        # [0 1 2 3 4]，默认从 0 开始
print(np.arange(2, 8))     # [2 3 4 5 6 7]
print(np.arange(0, 1, 0.2))# [0.  0.2 0.4 0.6 0.8]
```

`np.linspace()` 在闭区间内生成指定个数、均匀分布的点，第三个参数是点数而非步长：

```python
print(np.linspace(0, 1, 5))  # [0.   0.25 0.5  0.75 1.  ]
```

`np.logspace()` 生成对数刻度上的等比数列，起始和结束用 `10` 的幂指定：

```python
print(np.logspace(0, 2, 3))  # [  1.  10. 100.]
```

`linspace` 常用于绘图时生成横轴坐标，`logspace` 常用于生成跨数量级的样本点。

### eye() 与 identity()

`np.eye()` 生成单位矩阵（对角线上为 1，其余为 0），`np.identity()` 是生成方阵单位矩阵的特例：

```python
import numpy as np

print(np.eye(3))
# [[1. 0. 0.]
#  [0. 1. 0.]
#  [0. 0. 1.]]

print(np.eye(2, 3))   # 可以指定行列数
# [[1. 0. 0.]
#  [0. 1. 0.]]

print(np.identity(2))
# [[1. 0.]
#  [0. 1.]]
```

`np.eye()` 更通用，`np.identity(n)` 等价于 `np.eye(n)`。

## 1.1.7 np.random 模块中的随机数组生成

随机数组在初始化参数、生成模拟数据、划分数据集等场景中大量使用。老接口 `np.random.xxx()` 直观易用，新接口 `np.random.default_rng()` 是推荐方式，本节先介绍常用的函数形式。

```python
import numpy as np

# 0~1 之间的均匀分布随机数，形状由参数指定
r1 = np.random.rand(2, 3)
print(r1.shape)   # (2, 3)

# 标准正态分布（均值 0，标准差 1）随机数
r2 = np.random.randn(2, 3)
print(r2.shape)   # (2, 3)

# 指定范围内的随机整数 [low, high)
r3 = np.random.randint(0, 10, size=5)
print(r3)         # 例如 [4 7 1 9 3]

# 0~1 均匀分布，形状用元组传
r4 = np.random.random((2, 2))
print(r4.shape)   # (2, 2)

# 指定区间 [low, high) 的均匀分布
r5 = np.random.uniform(-1, 1, size=4)
print(r5.shape)   # (4,)

# 指定均值和标准差的正态分布
r6 = np.random.normal(0, 2, size=4)
print(r6.shape)   # (4,)
```

### 随机数种子：np.random.seed()

随机数是伪随机，由种子值决定序列。设置相同种子，多次生成的结果一致：

```python
np.random.seed(42)
print(np.random.rand(3))   # [0.37454012 0.95071431 0.73199394]

np.random.seed(42)
print(np.random.rand(3))   # 结果完全相同
```

固定种子让实验可复现，是科学计算的基本要求。同一个种子下每次生成的序列都相同。

## 1.1.8 fromfunction() 与 fromiter()

### np.fromfunction()

`np.fromfunction()` 根据坐标函数生成数组。函数接收坐标作为参数，返回对应位置的值：

```python
import numpy as np

# 生成一个函数 f(i, j) = i + j 的 3x3 数组
a = np.fromfunction(lambda i, j: i + j, (3, 3))
print(a)
# [[0. 1. 2.]
#  [1. 2. 3.]
#  [2. 3. 4.]]

# 生成 f(i, j) = i * j
b = np.fromfunction(lambda i, j: i * j, (3, 3))
print(b)
# [[0. 0. 0.]
#  [0. 1. 2.]
#  [0. 2. 4.]]
```

`fromfunction` 适合按坐标公式生成网格数据，例如生成二维高斯分布的采样矩阵。

### np.fromiter()

`np.fromiter()` 从迭代器构建数组，与 `np.array()` 的区别在于它直接指定 dtype，且逐项取数，适合从生成器或大迭代对象构建数组：

```python
import numpy as np

gen = (i * i for i in range(5))
a = np.fromiter(gen, dtype=np.float64)
print(a)   # [ 0.  1.  4.  9. 16.]
```

## 1.1.9 数组复制：np.copy()

### 复制与视图的区别

数组的赋值操作有两种结果：引用（共享内存）和复制（独立内存）。直接赋值 `b = a` 只是让 `b` 指向 `a` 的同一块数据，修改任意一个都会影响另一个：

```python
import numpy as np

a = np.array([1, 2, 3])
b = a          # 共享内存，没有复制
b[0] = 99
print(a)       # [99  2  3]，a 也被修改了
```

`np.copy()` 创建独立副本，修改互不影响：

```python
a = np.array([1, 2, 3])
c = np.copy(a)
c[0] = 99
print(a)       # [1 2 3]，a 不受影响
print(c)       # [99  2  3]
```

### 判断是否共享内存

用 `np.shares_memory()` 判断两个数组是否共享底层数据：

```python
a = np.array([1, 2, 3])
b = a
c = np.copy(a)

print(np.shares_memory(a, b))   # True，共享
print(np.shares_memory(a, c))   # False，独立
```

切片默认返回视图（共享内存），索引返回的是视图还是副本取决于操作类型，详细规则在第 2 章展开。

## 练习题

### 第1题 概念理解

写出下面代码的输出结果，并解释 `shape`、`ndim`、`size`、`dtype`、`itemsize`、`nbytes` 各属性的含义。

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.int16)
print(a.shape)
print(a.ndim)
print(a.size)
print(a.dtype)
print(a.itemsize)
print(a.nbytes)
```

::: details 参考答案

```python
(2, 3)
2
6
int16
2
12
```

`shape` 是 (2, 3)，表示 2 行 3 列；`ndim` 为 2，是二维数组；`size` 为 6，是总元素个数；`dtype` 为 int16；`itemsize` 为 2，每个元素占 2 字节；`nbytes` 为 12，等于 6 * 2。
:::

### 第2题 代码编写

用三种不同的方式创建 3x3 的数组：(1) 用 `np.full()` 填充数值 5；(2) 用 `np.eye()` 生成单位矩阵；(3) 用 `np.arange()` 生成 0 到 8 的序列后调用 `reshape()` 排成 3 行 3 列。

::: details 参考答案

```python
import numpy as np

a = np.full((3, 3), 5)
b = np.eye(3)
c = np.arange(9).reshape(3, 3)

print(a)
print(b)
print(c)
```

`np.full((3, 3), 5)` 生成全部为 5 的 3x3 数组；`np.eye(3)` 生成 3 阶单位矩阵；`np.arange(9)` 生成 0~8 的一维数组，`reshape(3, 3)` 重排为 3 行 3 列。
:::

### 第3题 进阶练习

一个 `uint8` 类型的数组 `np.array([200, 100, 50])`，对它执行减 150 的运算后打印结果。解释为什么会出现与直觉不符的输出，并写出正确的转换方法。

::: details 参考答案

```python
import numpy as np

a = np.array([200, 100, 50], dtype=np.uint8)
print(a - 150)   # [50 206 156]，100-150 回绕为 206，50-150 回绕为 156

# 正确做法：先转成能表示负数的类型
b = a.astype(np.int16) - 150
print(b)   # [50 -50 -100]
```

`uint8` 取值范围 0~255，无法表示负数，越界后回绕到最大值附近。对无符号数组做减法前应先转换为 `int16` 等有符号类型。
:::

### 第4题 项目实践

命令行任务管理器需要一个功能：统计任务描述中关键词出现的次数，并生成一个 0~100 之间的随机评分用于任务优先级排序。请用 `np.random` 模块编写生成评分的代码，并说明设置随机种子对结果可复现的意义。

::: details 参考答案

```python
import numpy as np

np.random.seed(42)
scores = np.random.randint(0, 101, size=10)   # 10 个任务，评分 0~100
print(scores)
```

设置随机种子后，每次运行生成相同的评分序列，便于调试和结果复现。不设种子时每次运行结果都不同，实验结果无法对照。
:::

## 常见错误

**错误 1 · `AttributeError: module 'numpy' has no attribute 'random'`**

原因:导入方式错误，例如 `import numpy` 后直接使用 `numpy.random` 理论上可用，但某些环境因旧版本 NumPy 或命名冲突导致属性缺失。

解决:统一使用 `import numpy as np`，访问时写 `np.random.randint(...)`。确认 NumPy 版本较新（`pip install -U numpy`）。

**错误 2 · 整数溢出导致结果异常**

原因:使用 `int8` 等窄类型时，运算结果超出取值范围，发生回绕而非报错。例如 `np.array([127], dtype=np.int8) + 1` 得到 -128。

解决:根据数据范围选择足够宽的整数类型，或先通过 `astype()` 转换到更宽类型再运算。

**错误 3 · 直接赋值导致原数组被修改**

原因:`b = a` 只是复制引用，两变量共享同一块内存，修改 `b` 会同步改变 `a`。

解决:需要独立副本时使用 `np.copy(a)` 或 `a.copy()`，并用 `np.shares_memory()` 验证是否真正独立。

**错误 4 · `numpy` 导入时报 `ModuleNotFoundError`**

原因:NumPy 未安装，或安装在另一个 Python 环境中。

解决:执行 `pip install numpy`。若在虚拟环境中运行，先激活对应环境再安装。
