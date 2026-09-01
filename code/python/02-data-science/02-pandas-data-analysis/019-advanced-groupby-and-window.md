---
title: 1.19 分组与窗口高级功能
sidebar:
  order: 19
---
# 1.19 分组与窗口高级功能

第 7 章和第 10 章分别介绍了分组与窗口的基础用法，本节深入它们的高级功能：一次聚合多个函数、命名聚合、组内排名、组内累积统计，以及 `describe`、`pipe`、`transform` 在分组中的进阶配合。这些技巧能大幅减少重复的分组计算，让分组代码更简洁。

## 1.19.1 分组后应用多个函数

`.agg()` 一次接收多个函数名或函数列表，输出多级列名：

```python
import pandas as pd

df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'],
                   '值': [1, 3, 10, 20]})
print(df.groupby('组')['值'].agg(['sum', 'mean', 'max']))
#       sum  mean  max
# 组
# 甲     4   2.0    3
# 乙    30  15.0   20
```

### 字典映射

用字典为不同列指定不同聚合函数：

```python
df = pd.DataFrame({'组': ['甲', '甲', '乙'],
                   '值1': [1, 3, 10],
                   '值2': [5, 7, 11]})
print(df.groupby('组').agg({'值1': ['sum', 'mean'], '值2': 'max'}))
```

字典的键是列名，值是一个函数或函数列表，每列可以有不同的聚合组合。

## 1.19.2 命名聚合 NamedAgg

命名聚合用 `新列名=(原列名, 聚合函数)` 的语法，结果列名清晰，避免多级列名：

```python
print(df.groupby('组').agg(总和=('值1', 'sum'),
                           均值=('值1', 'mean'),
                           最大值=('值2', 'max')))
```

等价写法使用 `pd.NamedAgg`：

```python
print(df.groupby('组').agg(
    总和=pd.NamedAgg(column='值1', aggfunc='sum')))
```

命名聚合是推荐的分组聚合写法，结果结构扁平、便于后续处理。

## 1.19.3 分组后自定义函数

`.agg()` 与 `.apply()` 都可以接自定义函数，处理无法用内置函数表达的逻辑：

```python
def my_range(s):
    return s.max() - s.min()

print(df.groupby('组').agg(极差=('值1', my_range)))

def top2_sum(s):
    return s.nlargest(2).sum()

print(df.groupby('组')['值1'].apply(top2_sum))
```

## 1.19.4 分组后 pipe

`.groupby().pipe()` 把 GroupBy 对象传给外部函数，适合把复杂的多步分组逻辑封装起来：

```python
def summary(grouped):
    return grouped['值1'].agg(['sum', 'mean', 'count']).reset_index()

print(df.groupby('组').pipe(summary))
```

## 1.19.5 分组后 describe

`.describe()` 可以直接在 GroupBy 对象上调用，输出每组的多维统计摘要：

```python
print(df.groupby('组')['值1'].describe())
#        count  mean   std  min  25%  50%  75%  max
# 组
# 甲      2.0   2.0  1.41  1.0  1.5  2.0  2.5  3.0
# 乙      1.0  10.0   NaN 10.0 10.0 10.0 10.0 10.0
```

## 1.19.6 transform 标量广播

`.transform()` 在分组后返回与原始行数相同的广播结果。当自定义函数返回标量时，该标量广播到组内每一行：

```python
df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'], '值': [1, 3, 10, 20]})
df['组内均值'] = df.groupby('组')['值'].transform(lambda x: x.mean())
print(df)
#    组  值  组内均值
# 0  甲  1    2.0
# 1  甲  3    2.0
# 2  乙 10   15.0
# 3  乙 20   15.0
```

`.transform()` 要求函数返回与输入等长的结果或可广播的标量，常用于生成"相对组内均值的偏离"这类特征。

## 1.19.7 组内排名 rank

`.groupby(...).rank()` 计算组内排名，配合 `method` 处理并列：

```python
df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'], '值': [1, 3, 10, 20]})
df['组内排名'] = df.groupby('组')['值'].rank()
print(df)
#    组  值  组内排名
# 0  甲  1    1.0
# 1  甲  3    2.0
# 2  乙 10    1.0
# 3  乙 20    2.0
```

`method='min'`、`method='first'` 等参数与普通 `.rank()` 相同。

## 1.19.8 组内累积统计

分组后可以直接调用累积方法，如 `cumsum`、`cumprod`、`cummax`、`cummin`，计算组内的累积值：

```python
df = pd.DataFrame({'组': ['甲', '甲', '甲', '乙', '乙'],
                   '值': [1, 2, 3, 10, 20]})
df['组内累计'] = df.groupby('组')['值'].cumsum()
df['组内累计最大值'] = df.groupby('组')['值'].cummax()
print(df)
```

`.cumcount()` 返回组内从 0 开始的序号：

```python
df['组内序号'] = df.groupby('组').cumcount()
print(df)
#    组  值  组内序号
# 0  甲  1    0
# 1  甲  2    1
# 2  甲  3    2
# 3  乙 10    0
# 4  乙 20    1
```

## 1.19.9 窗口与分组组合

分组与滚动窗口组合，先分组再按组做滚动计算：

```python
df = pd.DataFrame({'组': ['甲', '甲', '甲', '乙', '乙', '乙'],
                   '值': [1, 2, 3, 10, 20, 30]})
df['组内移动平均'] = df.groupby('组')['值'].rolling(2).mean().reset_index(level=0, drop=True)
print(df)
```

分组后接 `.rolling()` 每个组独立计算窗口统计，结果需要 `reset_index` 对齐回原行。

## 练习题

### 第1题 概念理解

说明命名聚合 `新列名=(列, 函数)` 相比多级列名聚合的优势；说明 `.transform()` 与 `.agg()` 返回形状的差异。

::: details 参考答案

命名聚合输出扁平的单层列名，结构清晰、便于后续处理；多级列名聚合会产生 MultiIndex 列。`.transform()` 返回与输入等长的广播结果，`.agg()` 每组一行。
:::

### 第2题 代码编写

创建分组数据，用命名聚合一次计算每组的 `sum`、`mean`、`count`；用 `.transform` 给每行加组内均值列；用 `.rank` 计算组内排名。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'], '值': [1, 3, 10, 20]})
print(df.groupby('组').agg(总和=('值', 'sum'),
                           均值=('值', 'mean'),
                           数量=('值', 'count')))
df['组内均值'] = df.groupby('组')['值'].transform('mean')
df['组内排名'] = df.groupby('组')['值'].rank()
print(df)
```

:::

### 第3题 进阶练习

用字典映射对不同列指定不同聚合函数；用 `.describe()` 查看每组分布；用 `cumsum`、`cummax`、`cumcount` 计算组内累积统计。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'组': ['甲', '甲', '乙'],
                   '值1': [1, 3, 10],
                   '值2': [5, 7, 11]})
print(df.groupby('组').agg({'值1': ['sum', 'mean'], '值2': 'max'}))
print(df.groupby('组')['值1'].describe())

df2 = pd.DataFrame({'组': ['甲', '甲', '甲', '乙'],
                    '值': [1, 2, 3, 10]})
df2['累计'] = df2.groupby('组')['值'].cumsum()
df2['累计最大'] = df2.groupby('组')['值'].cummax()
df2['序号'] = df2.groupby('组').cumcount()
print(df2)
```

:::

## 常见错误

**错误 1 · 多级列名聚合后 `reset_index` 列名混乱**

原因:`.agg(['sum','mean'])` 生成多级列，直接重置索引后列名带层级前缀。

解决:用命名聚合 `新列名=(列, 函数)` 生成扁平列，或对列名做 `.columns` 扁平化处理。

**错误 2 · `.transform()` 报 `ValueError: Length of values does not match`**

原因:传入的函数返回长度不等于组内行数。

解决:确认函数返回标量或与输入等长的结果；返回标量时会自动广播。

**错误 3 · 分组滚动后行顺序或索引错乱**

原因:`.groupby().rolling()` 的结果索引结构变化，直接赋值对不齐。

解决:用 `.reset_index(level=0, drop=True)` 丢弃组索引后赋值。

**错误 4 · 自定义函数在 `.agg` 与 `.apply` 中表现不同**

原因:`.agg` 对每列 Series 应用且要求返回标量，`.apply` 更灵活但结果结构不确定。

解决:能用 `.agg` 的场景优先 `.agg`；需要复杂返回值时用 `.apply` 并统一返回类型。
