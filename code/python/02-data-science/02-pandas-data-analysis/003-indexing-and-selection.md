---
title: 1.3 索引与选择
sidebar:
  order: 3
---
# 1.3 索引与选择

第 2 章学会了从整体上查看数据，但实际分析经常需要精准取出某几行、某几列或满足条件的子集。Pandas 的数据选择有一套完整的语法体系：`[]` 运算符负责最直接的列选择与行切片，`.loc[]` 按标签选择，`.iloc[]` 按整数位置选择，布尔索引按条件筛选。此外还有索引的设置、重置、排序与对齐。本节把这些选择手段系统讲清，这是 Pandas 使用频率最高的操作。

## 1.3.1 基本选择

### 列选择

用 `df['列名']` 选择一列，返回 Series；用 `df[['列1', '列2']]` 选择多列，返回 DataFrame：

```python
import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
print(df['A'])           # Series
print(df[['A', 'B']])    # DataFrame，双层方括号
```

### 行切片

`[]` 运算符里放切片语法时，按行索引标签切片，末尾包含：

```python
print(df[0:2])   # 前两行（此时标签与位置一致，结果与前两行相同）
```

`[]` 里的行切片规则与 Python 列表切片一致，`stop` 不包含。但需要注意，`[]` 内如果放标签切片（字符串索引），行为由标签决定，规则稍后说明。

## 1.3.2 .loc[] 按标签索引

`.loc[]` 根据索引标签选择数据，`stop` 包含在内。这是 Pandas 推荐的主要选择方式，因为它明确表达"按标签"的意图：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]},
                  index=['r1', 'r2', 'r3'])
print(df.loc['r1'])        # 取标签为 r1 的行
print(df.loc['r1':'r2'])   # 标签切片，包含两端
print(df.loc[['r1', 'r3']])  # 取多行
print(df.loc[:, 'A'])      # 所有行、A 列
print(df.loc['r1', 'A'])   # 单个标量
```

`.loc[]` 的切片包含末尾标签，这与 Python 切片 `stop` 不包含的惯例不同。`df.loc['r1':'r2']` 会包含 r2 行。

## 1.3.3 .iloc[] 按整数位置索引

`.iloc[]` 根据整数位置选择，`stop` 不包含，规则与 Python 列表一致：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]},
                  index=['r1', 'r2', 'r3'])
print(df.iloc[0])          # 第 0 行
print(df.iloc[0:2])        # 第 0、1 行
print(df.iloc[:, 1])       # 第 1 列
print(df.iloc[0, 1])       # 第 0 行第 1 列
print(df.iloc[[0, 2]])     # 第 0、2 行
```

`.loc[]` 与 `.iloc[]` 的分工：需要按业务标签（如行名、日期）定位时用 `.loc[]`，需要按位置批量取时用 `.iloc[]`。

## 1.3.4 .at[] 与 .iat[] 快速标量访问

`.at[]` 按标签、`.iat[]` 按位置，以最快速度取单个标量。它们比 `.loc[]`/`.iloc[]` 更快，但不支持切片与多元素选择，只用于取单值：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]},
                  index=['r1', 'r2', 'r3'])
print(df.at['r2', 'A'])   # 2
print(df.iat[1, 1])       # 5
```

## 1.3.5 布尔索引

用布尔数组作为选择条件，只保留条件为 True 的行。这是按业务规则筛选数据的标准手段：

```python
df = pd.DataFrame({'A': [1, 2, 3, 4], 'B': [10, 20, 30, 40]})
print(df[df['A'] > 2])          # A 列大于 2 的行
print(df[(df['A'] > 1) & (df['B'] < 40)])   # 多条件与
print(df[(df['A'] == 1) | (df['B'] == 40)]) # 多条件或
```

多个条件用 `&`（与）、`|`（或）、`~`（非）组合，每个条件必须加括号。布尔索引选择的结果是行的子集，列保持不变。

## 1.3.6 查询方法 .query()

`.query()` 用字符串表达式描述筛选条件，代码更简洁，尤其在条件较长时：

```python
df = pd.DataFrame({'A': [1, 2, 3, 4], 'B': [10, 20, 30, 40]})
print(df.query('A > 2'))
print(df.query('A > 1 and B < 40'))
print(df.query('A > 2 or B > 35'))
```

`.query()` 里可以直接写列名和比较运算，支持 `and`/`or`/`not` 关键词。条件中引用外部变量时，变量名前面加 `@`：

```python
threshold = 2
print(df.query('A > @threshold'))
```

## 1.3.7 索引设置与重置

### set_index()

`.set_index()` 把指定列设为行索引，原列从数据区移入索引：

```python
df = pd.DataFrame({'姓名': ['张三', '李四'], '成绩': [90, 85]})
df2 = df.set_index('姓名')
print(df2)
#      成绩
# 姓名
# 张三   90
# 李四   85
```

### reset_index()

`.reset_index()` 是 `set_index()` 的逆操作，把索引变回普通列，同时恢复默认整数索引：

```python
print(df2.reset_index())
#   姓名  成绩
# 0  张三  90
# 1  李四  85
```

### rename_axis() 与 rename()

`.rename_axis()` 给索引轴起名字，`.rename()` 重命名索引或列标签：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]},
                  index=['x', 'y'])
df2 = df.rename_axis('行名')          # 给行索引命名
df3 = df.rename(columns={'A': '甲'})  # 重命名列
df4 = df.rename(index={'x': 'X'})     # 重命名索引
```

`.rename()` 返回新对象，默认不修改原数据；加 `inplace=True` 可以原地修改，但链式场景下建议用返回值。

## 1.3.8 索引排序 .sort_index()

`.sort_index()` 按索引值排序，默认升序，`ascending=False` 降序：

```python
s = pd.Series([10, 20, 30], index=['c', 'a', 'b'])
print(s.sort_index())   # a 20 / b 30 / c 10
```

`axis=1` 时按列名排序。对 MultiIndex 可以指定 `level` 只排序某一层。

## 1.3.9 索引对齐

Pandas 在做运算或合并时，会自动按索引标签对齐数据。两个 Series 相加时，标签相同的值相加，某侧缺失的标签得到 NaN：

```python
s1 = pd.Series([1, 2, 3], index=['a', 'b', 'c'])
s2 = pd.Series([10, 20, 30], index=['b', 'c', 'd'])
print(s1 + s2)
# a     NaN
# b    22.0
# c    33.0
# d     NaN
# dtype: float64
```

索引对齐是 Pandas 与 NumPy 的重要差异：NumPy 按位置对齐，Pandas 按标签对齐。理解这一点才能解释很多"意外的 NaN"。

## 1.3.10 重复标签

索引允许重复。用 `.index.is_unique` 判断是否有重复，用 `.index.duplicated()` 找出重复标签：

```python
s = pd.Series([1, 2, 3], index=['a', 'a', 'b'])
print(s.index.is_unique)      # False
print(s.index.duplicated())   # [False  True False]
```

`duplicated()` 返回布尔数组，默认标记重复项中除第一个以外的位置。`keep='last'` 时保留最后一个，`keep=False` 时所有重复项都标记为 True。重复标签会让 `.loc['a']` 返回多行，处理时要小心。

## 练习题

### 第1题 概念理解

说明 `.loc[]` 与 `.iloc[]` 的区别，以及 `.loc[]` 切片与 Python 切片在 `stop` 端是否包含上的差异。

::: details 参考答案

`.loc[]` 按标签选择，`.iloc[]` 按整数位置选择。`.loc[]` 的切片包含末尾标签（`df.loc['r1':'r2']` 包含 r2），`.iloc[]` 与 Python 切片一致，`stop` 不包含。
:::

### 第2题 代码编写

给定 `df`，用 `.loc[]` 取出"行标签 r2 到 r4、列 A 和 C"的子集；用 `.iloc[]` 取出第 2 到第 4 行、第 1 到第 3 列；用布尔索引筛选 A 列大于 5 且 B 列小于 20 的行。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'A': [1, 5, 8, 12], 'B': [10, 25, 30, 15],
                   'C': [7, 9, 2, 4]}, index=['r1', 'r2', 'r3', 'r4'])
print(df.loc['r2':'r4', ['A', 'C']])
print(df.iloc[1:4, 0:3])
print(df[(df['A'] > 5) & (df['B'] < 20)])
```

:::

### 第3题 进阶练习

把 `'姓名'` 列设为索引后用 `.query()` 筛选成绩大于 80 的行；解释 `set_index` 与 `reset_index` 的逆关系；创建一个带重复索引的 Series，用 `duplicated` 找出重复位置。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'姓名': ['张三', '李四', '王五'], '成绩': [90, 75, 88]})
df2 = df.set_index('姓名')
print(df2.query('成绩 > 80'))
print(df2.reset_index())     # 恢复 姓名 列

s = pd.Series([1, 2, 3], index=['a', 'a', 'b'])
print(s.index.duplicated())  # [False  True False]
```

:::

## 常见错误

**错误 1 · `KeyError: 'r1'`**

原因:`.loc['r1']` 中 r1 不在索引里,或写成了 `.loc[0]` 想取第 0 行但索引不是整数。

解决:按标签选择前确认索引值存在,可用 `df.index` 查看;需要按位置取时改用 `.iloc[0]`。

**错误 2 · `.loc[]` 切片结果比预期多一行**

原因:`.loc[]` 切片包含末尾标签,与 Python 切片惯例不同。

解决:记住规则 `.loc['a':'b']` 包含 b;不想包含末尾时用 `.iloc[]` 或重新构造条件。

**错误 3 · 布尔索引时报 `ValueError: The truth value of a DataFrame is ambiguous`**

原因:写了 `df[df['A'] > 2 and df['B'] < 40]`,用 `and` 连接两个布尔 Series。

解决:改用 `&` 连接,并且每个条件加括号:`(df['A'] > 2) & (df['B'] < 40)`。

**错误 4 · 运算结果出现大量 NaN**

原因:索引对齐导致两侧标签不匹配的部分变成 NaN,常发生在 Series 相加或 DataFrame 合并时。

解决:检查两侧索引是否一致;必要时用 `.reindex()` 或 `fillna()` 处理对齐产生的缺失。
