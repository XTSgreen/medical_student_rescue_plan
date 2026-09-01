---
title: 1.1 Pandas 概述与核心数据结构
sidebar:
  order: 1
---
# 1.1 Pandas 概述与核心数据结构

上一模块完成了 NumPy 的学习，数组能高效存储和计算数值数据。但真实世界的数据大多带标签：一行对应一条记录，一列对应一个字段，靠整数位置来引用并不方便。Pandas 正是为解决带标签数据的存储、清洗与分析而设计的库，它建立在 NumPy 之上，把数组扩展成带轴标签的表格结构，是数据科学工作流中最常用的数据处理工具。本节从 Pandas 的安装讲起，重点建立 Series、DataFrame、Index 三个核心数据结构的完整概念，为后续各章的数据操作打好基础。

## 1.1.1 Pandas 概述与安装

### Pandas 是什么

Pandas（Panel Data 的缩写）是 Python 生态中最流行的数据分析和处理库。它的核心价值在于两点：第一，提供带标签的表格数据结构，让每一行、每一列都有名字，数据操作不再依赖笨拙的位置编号；第二，提供一整套贴近日常数据分析需求的操作接口，筛选、清洗、分组、合并等高频操作都有一行代码的现成方法。pandas、NumPy、Matplotlib 三者构成 Python 数据分析的基础三件套，pandas 负责中间的数据组织与变换，NumPy 负责底层数值计算，Matplotlib 负责结果可视化。

Pandas 与 NumPy 的分工需要先明确：NumPy 处理的是同类型的纯数值数组，适合数值计算；Pandas 处理的是带标签的表格，允许每列类型不同，适合数据整理。实际分析中两者配合使用，Pandas 的数据结构底层就存放着 NumPy 数组，`df.values` 取出的就是底层数组。

### 安装 Pandas

Pandas 是第三方库，使用 pip 安装：

```bash
pip install pandas
```

使用 conda 管理环境时用：

```bash
conda install pandas
```

安装完成后验证版本：

```python
import pandas as pd
print(pd.__version__)   # 例如 2.1.0
```

导入时统一使用 `import pandas as pd` 的别名，这是社区惯例，后续所有代码都沿用这一写法。需要 NumPy 配合时再 `import numpy as np`。

## 1.1.2 核心数据结构概述

Pandas 有三大核心数据结构，理解它们的关系是使用 Pandas 的前提。

**Series** 是一维带标签数组。它由两个部分组成：一组数据（通常是 NumPy 数组）和一组索引标签。可以把它理解成增强版的 Python 列表或字典，既支持按整数位置取值，也支持按标签取值。

**DataFrame** 是二维带标签表格。每一列是一个 Series，所有列共享同一个行索引。可以把它理解成 Excel 表格或关系数据库中的一张表，是 Pandas 中最常用、最重要的结构。

**Index** 是轴标签索引对象。Series 和 DataFrame 的行索引、DataFrame 的列索引都是 Index 对象。Index 本身是一个不可变、支持快速查找的一维数组，它是 Pandas 实现对齐、选择、合并等功能的底层基础。

三者的关系可以这样概括：DataFrame 是若干 Series 的集合，Series 是带标签的一维数组，Index 负责给数据贴上标签。

## 1.1.3 Series 详解

### Series 的概念

Series 是 Pandas 的一维数据结构，由数据与索引组成。创建时如果不指定索引，Pandas 自动生成从 0 开始的整数索引：

```python
import pandas as pd

s = pd.Series([10, 20, 30, 40])
print(s)
# 0    10
# 1    20
# 2    30
# 3    40
# dtype: int64
```

可以指定索引标签，标签可以是字符串：

```python
s = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
print(s)
# a    10
# b    20
# c    30
# dtype: int64
```

### Series 的属性

Series 的常用属性如下：

```python
s = pd.Series([1.5, 2.5, 3.5], index=['a', 'b', 'c'], name='测量值')
print(s.values)    # [1.5 2.5 3.5]，底层 NumPy 数组
print(s.index)     # Index(['a', 'b', 'c'], dtype='object')
print(s.name)      # 测量值，Series 的名称
print(s.dtype)     # float64，数据类型
print(s.shape)     # (3,)，形状
print(s.size)      # 3，元素个数
print(s.nbytes)    # 24，底层数据占用的字节数
print(s.empty)     # False，是否为空
```

各属性含义：`.values` 返回底层 NumPy 数组，`.index` 返回索引对象，`.name` 是 Series 的名字，`.dtype` 是数据类型，`.shape` 是形状元组，`.size` 是元素总数，`.nbytes` 是数据占用的内存字节数，`.empty` 判断 Series 是否为空。

### 创建 Series

Series 可以从列表、字典、标量、NumPy 数组等不同来源创建。

从列表创建，索引自动生成或手动指定：

```python
s1 = pd.Series([1, 2, 3])                      # 自动索引
s2 = pd.Series([1, 2, 3], index=['x', 'y', 'z'])  # 手动索引
```

从字典创建，字典的键成为索引，值成为数据：

```python
s = pd.Series({'apple': 5, 'banana': 3, 'cherry': 8})
print(s)
# apple     5
# banana    3
# cherry    8
# dtype: int64
```

从标量创建，需要指定索引，标量会广播到每个位置：

```python
s = pd.Series(0, index=['a', 'b', 'c'])
print(s)
# a    0
# b    0
# c    0
# dtype: int64
```

从 NumPy 数组创建：

```python
import numpy as np
s = pd.Series(np.arange(3), index=['a', 'b', 'c'])
print(s)   # a 0 / b 1 / c 2
```

## 1.1.4 DataFrame 详解

### DataFrame 的概念

DataFrame 是二维带标签表格，由行索引（index）、列索引（columns）和数据组成。创建时若不指定索引，自动生成整数索引。

```python
df = pd.DataFrame({'姓名': ['张三', '李四', '王五'],
                   '年龄': [25, 30, 28],
                   '身高': [175.5, 168.0, 180.2]})
print(df)
#    姓名  年龄    身高
# 0  张三  25  175.5
# 1  李四  30  168.0
# 2  王五  28  180.2
```

每一列是一个 Series，各列可以有不同的数据类型，这是 DataFrame 与 NumPy 二维数组的根本区别。

### DataFrame 的属性

DataFrame 的常用属性如下：

```python
import numpy as np
import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3], 'B': [4.0, 5.0, 6.0]})
print(df.values)     # [[1. 4.] [2. 5.] [3. 6.]]，底层 NumPy 数组
print(df.index)      # RangeIndex(start=0, stop=3, step=1)
print(df.columns)    # Index(['A', 'B'], dtype='object')
print(df.dtypes)
# A      int64
# B    float64
# dtype: object
print(df.shape)      # (3, 2)，3 行 2 列
print(df.size)       # 6，总元素个数
print(df.ndim)       # 2，二维
print(df.empty)      # False
print(df.T)          # 转置，行与列互换
print(df.axes)       # [RangeIndex(...), Index(['A', 'B'], ...)]，所有轴
```

`.values` 返回底层数据（二维数组），`.index` 和 `.columns` 分别是行、列索引，`.dtypes` 返回每列的数据类型（注意是复数形式 dtypes），`.shape`、`.size`、`.ndim` 分别描述形状、元素总数和维度，`.empty` 判断是否为空，`.T` 返回转置，`.axes` 返回所有轴的索引列表。

### 创建 DataFrame

DataFrame 可以从字典、列表、NumPy 数组、Series 等来源创建。

从字典创建，键成为列名，值为列数据（值可以是列表、Series 或 NumPy 数组）：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
```

从列表的列表创建，默认生成 0,1,2... 的列名，需要手动指定：

```python
df = pd.DataFrame([[1, 2], [3, 4], [5, 6]],
                  columns=['X', 'Y'],
                  index=['r1', 'r2', 'r3'])
```

从 NumPy 数组创建：

```python
import numpy as np
arr = np.array([[1, 2], [3, 4]])
df = pd.DataFrame(arr, columns=['A', 'B'])
```

从 Series 的字典创建，不同 Series 长度不同时，缺失位置自动补 NaN：

```python
s1 = pd.Series([1, 2, 3], name='A')
s2 = pd.Series([10, 20], name='B')
df = pd.DataFrame({'A': s1, 'B': s2})
print(df)
#      A     B
# 0  1.0  10.0
# 1  2.0  20.0
# 2  3.0   NaN
```

从文件创建（如 CSV）在 I/O 一章详细展开，这里先了解接口：`pd.read_csv('data.csv')` 直接得到 DataFrame。

## 1.1.5 Index 详解

### 创建索引对象

`pd.Index()` 用于创建索引对象：

```python
idx = pd.Index([3, 1, 2])
print(idx)          # Index([3, 1, 2], dtype='int64')
print(idx.dtype)    # int64
```

Index 是不可变对象，不能直接修改其中的元素，只能通过方法生成新索引，这保证了索引在数据对齐时的稳定性。

### 索引类型

Pandas 根据索引的用途提供多种类型：

```python
import numpy as np
import pandas as pd

# RangeIndex：连续的整数范围，最节省内存
idx = pd.RangeIndex(0, 10, 2)     # 0 到 9，步长 2

# Int64Index / Float64Index：任意整数或浮点索引
idx_int = pd.Index([1, 3, 5])     # Int64Index
idx_float = pd.Index([1.5, 2.5])  # Float64Index

# DatetimeIndex：时间戳索引
idx_dt = pd.date_range('2024-01-01', periods=3)   # DatetimeIndex

# TimedeltaIndex：时间差索引
idx_td = pd.timedelta_range('1 day', periods=3)

# PeriodIndex：时间段索引
idx_p = pd.period_range('2024-01', periods=3, freq='M')

# CategoricalIndex：分类索引
idx_cat = pd.CategoricalIndex(['低', '中', '高'])

# MultiIndex：多层索引
idx_mi = pd.MultiIndex.from_tuples([('a', 1), ('a', 2), ('b', 1)])
```

各种索引类型的含义：RangeIndex 是连续整数范围的轻量表示；Int64Index 与 Float64Index 是任意整数、浮点标签；DatetimeIndex 存放时间戳；TimedeltaIndex 存放时间差；PeriodIndex 存放时间段；CategoricalIndex 是分类值索引；MultiIndex 是多层（层次化）索引，在第 12 章展开。

判断一个索引属于哪种类型，可以用 `isinstance` 或 `pd.api.types` 模块：

```python
idx = pd.date_range('2024-01-01', periods=2)
print(isinstance(idx, pd.DatetimeIndex))   # True
```

## 1.1.6 数据类型 dtype

Pandas 的 dtype 比 NumPy 更丰富，除了基础数值类型，还有若干专用于表格数据的类型。常见的 dtype 如下：

| dtype                     | 说明                                  | 示例         |
| ------------------------- | ------------------------------------- | ------------ |
| `int64` / `int32`     | 整数                                  | 年龄、计数   |
| `float64` / `float32` | 浮点数                                | 身高、温度   |
| `bool`                  | 布尔值                                | 是否通过     |
| `object`                | Python 对象（通常是混合类型或字符串） | 旧版字符串列 |
| `string`                | Pandas 专用字符串类型                 | 姓名、地址   |
| `category`              | 分类数据                              | 性别、等级   |
| `datetime64[ns]`        | 时间戳                                | 日期时间     |
| `timedelta64[ns]`       | 时间差                                | 持续时间     |
| `period`                | 时间段                                | 月份区间     |
| `Sparse[...]`           | 稀疏数据                              | 大量零值     |
| `interval`              | 区间数据                              | 年龄区间     |

查看列类型用 `.dtypes`，指定类型在创建或读取时用 `dtype` 参数：

```python
s = pd.Series(['a', 'b', 'c'], dtype='string')
print(s.dtype)   # string

s_cat = pd.Series(['低', '中', '高'], dtype='category')
print(s_cat.dtype)   # category
```

`object` 与 `string` 的差别在于：`object` 是 Python 对象数组，任何类型都能放进去，性能较低；`string` 是 Pandas 2.0 起推荐的专用字符串类型，提供更好的性能与缺失值支持。新代码应优先使用 `string`。

## 练习题

### 第1题 概念理解

写出下面代码中每个属性的输出含义，并说明 Series 与 DataFrame 的关系。

```python
import pandas as pd

s = pd.Series([1, 2, 3], name='分数')
df = pd.DataFrame({'语文': [90, 85], '数学': [88, 92]})
print(s.values, s.index, s.name, s.dtype, s.shape, s.size, s.empty)
print(df.values, df.index, df.columns, df.dtypes, df.shape, df.ndim, df.empty, df.T)
```

::: details 参考答案

`s.values` 是 `[1 2 3]`，`s.index` 是 `RangeIndex`，`s.name` 是 `'分数'`，`s.dtype` 是 `int64`，`s.shape` 是 `(3,)`，`s.size` 是 `3`，`s.empty` 是 `False`。`df.values` 是 `[[90 88] [85 92]]`，`df.index` 与 `df.columns` 分别是行、列索引，`df.dtypes` 是两列各自的 int64，`df.ndim` 是 `2`，`df.T` 转置后行列互换。

Series 是一维带标签数组，DataFrame 是若干 Series 按列组成的二维表格。
:::

### 第2题 代码编写

从字典 `{'姓名': ['赵六', '钱七'], '成绩': [76, 89]}` 创建 DataFrame，输出它的列名、数据类型和转置结果；再单独创建三个 Series，分别从列表、字典、标量创建。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'姓名': ['赵六', '钱七'], '成绩': [76, 89]})
print(df.columns)
print(df.dtypes)
print(df.T)

s1 = pd.Series([1, 2, 3])
s2 = pd.Series({'a': 1, 'b': 2})
s3 = pd.Series(0, index=['x', 'y'])
```

:::

### 第3题 进阶练习

创建一个 DataFrame，包含三列：整数列、浮点列、字符串列；用 `.dtypes` 查看各列类型；再用 `dtype` 参数创建一个 `category` 类型的 Series，并确认其类型。

::: details 参考答案

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({'A': [1, 2, 3], 'B': [1.5, 2.5, 3.5], 'C': ['x', 'y', 'z']})
print(df.dtypes)

s = pd.Series(['低', '中', '高'], dtype='category')
print(s.dtype)   # category
```

:::

## 常见错误

**错误 1 · `ValueError: If using all scalar values, you must pass an index`**

原因:用单个标量创建 Series 时没有指定 `index`,如 `pd.Series(5)`。标量无法自动推断长度。

解决:创建标量 Series 时必须显式传入 `index` 参数。

**错误 2 · 从字典创建 DataFrame 后列顺序与预期不符**

原因:旧版本 Python 的字典不保证插入顺序,或混用了不同来源的列。

解决:Python 3.7 起字典保持插入顺序,一般无需担心;需要固定列顺序时用 `df = df[['col2', 'col1']]` 手动重排。

**错误 3 · 用 `df[列名]` 得到的是 Series,不是 DataFrame**

原因:单列选择默认返回 Series,后续操作行为与 DataFrame 不同(如 `.shape` 结果不同)。

解决:需要保留二维结构时用 `df[['列名']]`(双层方括号)。

**错误 4 · 修改 Index 时直接赋值报 `TypeError: Index does not support mutable operations`**

原因:Index 是不可变对象,不支持 `idx[0] = 1` 这样的原地修改。

解决:用 `idx.rename()` 生成新索引,或先转成列表修改再重新创建。
