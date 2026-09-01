---
title: 1.4 数据选择与过滤进阶
sidebar:
  order: 4
---
# 1.4 数据选择与过滤进阶

第 3 章掌握了 `.loc[]`、`.iloc[]` 和布尔索引，这些手段已经能解决大部分取数需求。但真实场景还有一些更精细的过滤诉求：按列名或索引名的模式过滤、按条件把不符合的值替换成别的值、判断某个值是否属于给定集合、检测缺失值的位置。Pandas 为这些场景提供了 `.filter()`、`.where()`、`.mask()`、`.isin()`、`.between()`、`.isna()` 等方法，本节逐一讲解。

## 1.4.1 .filter() 按轴标签过滤

`.filter()` 根据轴标签（列名或索引名）过滤，支持精确匹配、前缀后缀、正则表达式三种方式：

```python
import pandas as pd

df = pd.DataFrame({'A': [1, 2], 'B': [3, 4], 'A_1': [5, 6], 'B_1': [7, 8]})

print(df.filter(items=['A', 'B']))        # 精确指定列
print(df.filter(like='_1'))               # 列名包含 _1 的列
print(df.filter(regex='^A'))              # 正则，列名以 A 开头
print(df.filter(axis=0, items=[0]))       # 按行索引过滤
```

`.filter()` 与布尔索引的区别：布尔索引按数据内容过滤行，`.filter()` 按轴标签本身过滤。它适合快速挑选列子集，例如保留所有以某前缀开头的列。

## 1.4.2 .where() 与 .mask() 条件替换

`.where(cond)` 保留满足条件的值，不满足的位置替换为 NaN（或指定的 other 值）；`.mask(cond)` 正好相反，满足条件的位置被替换：

```python
s = pd.Series([1, 2, 3, 4])
print(s.where(s > 2))
# 0    NaN
# 1    NaN
# 2    3.0
# 3    4.0

print(s.where(s > 2, other=0))
# 0    0
# 1    0
# 2    3
# 3    4

print(s.mask(s > 2, other=0))
# 0    1
# 1    2
# 2    0
# 3    0
```

`.where()` 对应"不符合条件就换掉"，`.mask()` 对应"符合条件就换掉"。理解时以 `where` 为基准：条件是"保留"标准，`mask` 是它的逻辑取反。DataFrame 上同样适用，`other` 可以是标量、Series 或 DataFrame，按位置对齐填充。

## 1.4.3 .isin() 成员资格判断

`.isin(values)` 判断每个元素是否属于给定集合，返回同形状的布尔结构，常用于按"值在列表中"筛选：

```python
df = pd.DataFrame({'城市': ['北京', '上海', '广州', '深圳'],
                   '温度': [25, 27, 30, 29]})
mask = df['城市'].isin(['北京', '广州'])
print(mask)
# 0     True
# 1    False
# 2     True
# 3    False

print(df[mask])
#    城市  温度
# 0  北京  25
# 2  广州  30
```

`.isin()` 也可以直接作用于 DataFrame，判断每个单元格是否属于给定集合：

```python
print(df.isin(['北京', 30]))
```

## 1.4.4 .between() 区间筛选

`.between(left, right)` 判断值是否落在闭区间 `[left, right]` 内，是区间筛选的快捷方式：

```python
s = pd.Series([5, 15, 25, 35])
print(s.between(10, 30))
# 0    False
# 1     True
# 2     True
# 3    False

print(s[s.between(10, 30)])   # 筛选落在区间内的值
```

`inclusive` 参数可以控制端点是否包含：`'both'`（默认，两端包含）、`'left'`、`'right'`、`'neither'`。

## 1.4.5 .isna() 与 .notna() 缺失值标记

`.isna()` 判断是否为缺失值，返回布尔结构；`.notna()` 是它的取反：

```python
s = pd.Series([1, None, 3, float('nan')])
print(s.isna())
# 0    False
# 1     True
# 2    False
# 3     True

print(s.notna())
# 0     True
# 1    False
# 2     True
# 3    False

print(s[s.notna()])   # 筛选非缺失值
```

`.isnull()` 与 `.isna()` 完全等价，两个名字都存在是历史原因。缺失值检测是数据清洗的基础操作，第 5 章和第 18 章会深入展开。

## 1.4.6 .any() 与 .all() 沿轴条件判断

`.any()` 判断是否存在至少一个 True，`.all()` 判断是否全部为 True。默认沿列方向（axis=0）判断每列，`axis=1` 判断每行：

```python
df = pd.DataFrame({'A': [1, 2, 0], 'B': [0, 5, 0]})
print((df > 0).any())    # A True / B True，每列是否有大于 0 的值
print((df > 0).all())    # A False / B False，每列是否全部大于 0
print((df > 0).any(axis=1))   # 每行是否有大于 0 的值
print((df > 0).all(axis=1))   # 每行是否全部大于 0
```

`.any()` 与 `.all()` 常与布尔运算组合，用于快速判断某个条件下是否存在违规行、是否整列满足要求等。

## 练习题

### 第1题 概念理解

说明 `.filter()` 与布尔索引的适用场景差异；说明 `.where()` 与 `.mask()` 在"保留什么"上的区别。

::: details 参考答案

`.filter()` 按轴标签（列名、索引名）过滤，适合按名称挑选列；布尔索引按数据内容过滤行。`.where(cond)` 保留满足 cond 的值，不满足的替换；`.mask(cond)` 替换满足 cond 的值，不满足的保留。两者互为取反。
:::

### 第2题 代码编写

给定 `df`，用 `.isin()` 筛选出 `城市` 列在 `['北京', '深圳']` 中的行；用 `.between()` 筛选 `温度` 在 25 到 30 之间的行；用 `.where()` 把小于 20 的数值替换为 0。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'城市': ['北京', '上海', '广州', '深圳'],
                   '温度': [25, 18, 30, 29]})
print(df[df['城市'].isin(['北京', '深圳'])])
print(df[df['温度'].between(25, 30)])
print(df['温度'].where(df['温度'] >= 20, other=0))
```

:::

### 第3题 进阶练习

生成一个含缺失值的 DataFrame，用 `.isna()` 找出哪些行存在缺失；用 `.any(axis=1)` 判断每行是否有满足条件的值；再用 `.mask()` 把大于某阈值的值替换为阈值。

::: details 参考答案

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({'A': [1, np.nan, 3], 'B': [4, 5, np.nan]})
print(df.isna())
print(df.isna().any(axis=1))   # 每行是否有缺失

threshold = 3
print(df.mask(df > threshold, threshold))
```

:::

## 常见错误

**错误 1 · `.filter(items=[...])` 中写了不存在的列名，结果为空**

原因:`.filter()` 不会报错,只会返回与给定标签匹配的列,不存在的标签被静默忽略。

解决:先检查列名拼写与大小写,或用 `df.columns` 确认实际名称。

**错误 2 · `.where()` 的结果类型从 int 变成了 float**

原因:`.where()` 把不符合条件的值替换成 NaN,NaN 是浮点值,整数列被自动提升为 float64。

解决:不想引入 NaN 时指定 `other` 参数替换成具体值,或处理后用 `astype` 转回。

**错误 3 · 用 `.isin()` 判断 NaN**

原因:`.isin([np.nan])` 对 NaN 的判断行为特殊,NaN 不被普通 `isin` 识别。

解决:判断缺失用 `.isna()` 而不是 `.isin()`。

**错误 4 · `.any()` 与 `.all()` 的轴方向判断错误**

原因:默认 axis=0 是按列判断,与"每行是否满足"的直觉相反。

解决:需要逐行判断时显式写 `axis=1`。
