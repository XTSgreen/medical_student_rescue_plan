---
title: 1.2 数据查看与探索
sidebar:
  order: 2
---
# 1.2 数据查看与探索

第 1 章建立了 Series 与 DataFrame 的核心概念，数据已经能以表格形式装进内存。拿到一份新数据后，第一步动作不是急着清洗或建模，而是先摸清它的整体面貌：有多少行多少列、每列是什么类型、有没有缺失值、数值分布如何。Pandas 提供了一组专门用于快速查看与统计概览的方法，本节把这些方法系统讲清，它们是后续一切分析工作的起点。

## 1.2.1 头部与尾部查看

`df.head()` 默认查看前 5 行，`df.tail()` 默认查看后 5 行，都可以传参数指定行数。这两个方法用于快速浏览数据结构，不会加载或计算全部内容：

```python
import pandas as pd

df = pd.DataFrame({'A': range(100), 'B': range(100, 200)})
print(df.head())     # 前 5 行
print(df.head(10))   # 前 10 行
print(df.tail())     # 后 5 行
print(df.tail(3))    # 后 3 行
```

大型数据集中只靠 head/tail 无法看清全貌，但足够确认数据是否正常加载、列名是否正确。`df.sample(5)` 可以随机抽 5 行查看，与 head/tail 互补。

## 1.2.2 信息概览

### info()

`df.info()` 输出 DataFrame 的整体结构信息：行数、每列的非空值个数、每列数据类型、内存占用：

```python
df = pd.DataFrame({'A': [1, 2, None], 'B': [1.5, 2.5, 3.5], 'C': ['x', 'y', 'z']})
df.info()
# <class 'pandas.core.frame.DataFrame'>
# RangeIndex: 3 entries, 0 to 2
# Data columns (total 3 columns):
#  #   Column  Non-Null Count  Dtype
# ---  ------  --------------  -----
#  0   A       2 non-null      float64
#  1   B       3 non-null      float64
#  2   C       3 non-null      object
# dtypes: float64(2), object(1)
# memory usage: 248.0+ bytes
```

`Non-Null Count` 一列直接暴露缺失值：A 列只有 2 个非空值，说明有 1 个缺失。`info()` 是排查数据质量的第一道检查。

### describe()

`df.describe()` 对数值列输出常用统计摘要：计数、均值、标准差、最小值、四分位数、最大值：

```python
df = pd.DataFrame({'A': [1, 2, 3, 4, 5], 'B': [10, 20, 30, 40, 50]})
print(df.describe())
#               A          B
# count  5.000000   5.00000
# mean   3.000000  30.00000
# std    1.581139  15.81139
# min    1.000000  10.00000
# 25%    2.000000  20.00000
# 50%    3.000000  30.00000
# 75%    4.000000  40.00000
# max    5.000000  50.00000
```

`describe()` 只统计数值列。要包含其他类型列，加参数 `include='all'`，分类和字符串列会得到不同的统计量（unique、top、freq）。`percentiles` 参数可以自定义分位数，例如 `df.describe(percentiles=[0.1, 0.9])`。

### memory_usage()

`df.memory_usage()` 返回每列占用的内存字节数，默认不含索引，`deep=True` 时包含 object 列内部的 Python 对象占用：

```python
print(df.memory_usage())
# Index     136
# A          40
# B          40
print(df.memory_usage(deep=True))
```

`deep=True` 对字符串列的意义很大，因为 object 列内部每个字符串对象本身还占用额外内存，浅层统计会严重低估。

## 1.2.3 统计摘要

Pandas 提供一整套描述性统计方法，既可用于 DataFrame（逐列计算），也可用于 Series。常见统计量如下：

```python
import numpy as np
s = pd.Series([1, 2, 3, 4, 100])

print(s.mean())        # 22.0，均值
print(s.median())      # 3.0，中位数
print(s.min())         # 1，最小值
print(s.max())         # 100，最大值
print(s.std())         # 标准差（样本，分母 n-1）
print(s.var())         # 方差（样本）
print(s.quantile(0.75))  # 上四分位数
print(s.skew())        # 偏度，衡量分布不对称程度
print(s.kurtosis())    # 峰度，衡量分布尖峭程度
print(s.mode())        # 众数，出现次数最多的值（可能有多个）
```

各统计量的含义：`.mean()` 均值、`.median()` 中位数、`.min()` 最小值、`.max()` 最大值、`.std()` 与 `.var()` 分别是样本标准差与方差、`.quantile(q)` 计算第 q 分位数、`.skew()` 偏度（正值右偏、负值左偏）、`.kurtosis()` 峰度（衡量分布尾部厚度）、`.mode()` 众数（可能返回多个值）。

DataFrame 上调用这些方法默认按列计算，得到一行结果：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
print(df.mean())   # A 2.0 / B 5.0
```

按行计算时加 `axis=1`，例如 `df.mean(axis=1)` 计算每行的平均值。

缺失值默认被忽略。`skipna=False` 时遇到缺失值会返回 NaN，而不是跳过。

## 1.2.4 计数与唯一值

### count()

`.count()` 统计非缺失值的个数，按列计算：

```python
s = pd.Series([1, 2, None, 4])
print(s.count())        # 3，缺失值不计
```

### unique() 与 nunique()

`.unique()` 返回 Series 中的唯一值（去重），`.nunique()` 返回唯一值的个数：

```python
s = pd.Series(['apple', 'banana', 'apple', 'cherry'])
print(s.unique())     # ['apple' 'banana' 'cherry']
print(s.nunique())    # 3
```

`.nunique(dropna=False)` 时缺失值也计入唯一值。

### value_counts()

`.value_counts()` 统计每个值出现的次数，默认按次数降序排列，是探索分类列最常用的方法：

```python
s = pd.Series(['a', 'b', 'a', 'a', 'c', 'b'])
print(s.value_counts())
# a    3
# b    2
# c    1
# Name: count, dtype: int64
```

常用参数：`normalize=True` 输出占比而非次数，`sort=False` 保持原始顺序，`dropna=False` 把缺失值也纳入统计。

## 1.2.5 交叉表

`pd.crosstab()` 用于统计两个分类变量的组合频数，效果类似 Excel 的透视表：

```python
df = pd.DataFrame({'性别': ['男', '女', '男', '女', '男'],
                   '班级': ['甲', '甲', '乙', '乙', '乙']})
print(pd.crosstab(df['性别'], df['班级']))
# 班级  甲  乙
# 性别
# 女    1  1
# 男    1  2
```

行参数是被统计的第一个变量，列参数是第二个变量，交叉位置是组合出现的次数。`normalize='index'` 或 `normalize='columns'` 可以输出行比例或列比例，`margins=True` 添加合计行与合计列。

## 1.2.6 数据形状与列名

`.shape` 返回行数列数元组，`.columns` 返回列索引，`.index` 返回行索引，这三个属性在探索阶段常被用来确认数据的规模与命名：

```python
df = pd.DataFrame({'A': range(5), 'B': range(5, 10)})
print(df.shape)         # (5, 2)
print(df.columns)       # Index(['A', 'B'], dtype='object')
print(df.index)         # RangeIndex(start=0, stop=5, step=1)
print(list(df.columns)) # ['A', 'B']
```

## 练习题

### 第1题 概念理解

给定一个 DataFrame，解释 `df.info()`、`df.describe()`、`df.memory_usage(deep=True)` 分别回答关于数据的什么问题，输出内容有何差异。

::: details 参考答案

`df.info()` 回答整体结构问题：行数、每列非空个数与类型；`df.describe()` 回答数值分布问题：均值、标准差、四分位数；`df.memory_usage(deep=True)` 回答内存占用问题，`deep=True` 会把 object 列内部对象的开销也算进去。
:::

### 第2题 代码编写

创建包含两列（一列数值、一列分类）的 DataFrame，用 `value_counts` 统计分类列各值出现的次数；再用 `crosstab` 与另一列做交叉统计。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'类别': ['A', 'B', 'A', 'C', 'B', 'A'],
                   '等级': ['优', '良', '优', '优', '良', '良']})
print(df['类别'].value_counts())
print(pd.crosstab(df['类别'], df['等级']))
```

:::

### 第3题 进阶练习

生成一个含缺失值的 DataFrame（至少 10 行），用 `info()` 找出哪列有缺失；用 `describe()` 观察数值列的分布；用 `skew` 判断各数值列分布是否对称。

::: details 参考答案

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({'A': np.random.randn(10),
                   'B': [1.0] * 5 + [np.nan] * 5})
df.info()          # B 列只有 5 个非空值
print(df.describe())
print(df.skew())
```

:::

## 常见错误

**错误 1 · `describe()` 没有输出分类列的统计**

原因:`describe()` 默认只统计数值列,分类和字符串列被忽略。

解决:加 `include='all'` 参数,或先对目标列单独调用 `describe()`。

**错误 2 · `memory_usage()` 统计的内存比预期小很多**

原因:默认 `deep=False`,object 列内部 Python 对象占用的内存未被计入。

解决:改用 `df.memory_usage(deep=True)`。

**错误 3 · `value_counts()` 输出的顺序与直觉相反**

原因:`value_counts()` 默认按次数降序排列,不是按原始出现顺序。

解决:需要原始顺序时加 `sort=False`。

**错误 4 · `df.mean()` 的结果是 NaN**

原因:列中存在缺失值,且计算时 `skipna=False` 被设置,或所有值都是 NaN。

解决:默认 `skipna=True` 会忽略缺失值;确需丢弃缺失行时先用 `dropna()`。
