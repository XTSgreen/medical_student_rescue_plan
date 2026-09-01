---
title: 1.11 性能优化与内存管理
sidebar:
  order: 11
---
# 1.11 性能优化与内存管理

前几章完成了 Pandas 的功能性学习，但数据量变大后会出现两个问题：内存占用过高、运算速度变慢。Pandas 提供了多种优化手段，包括评估内存占用、向下转型、使用分类类型、表达式求值加速、分块读取。本节介绍这些技巧，帮助数据大到内存吃紧时保持程序可用。

## 1.11.1 内存使用评估

### .memory_usage()

`.memory_usage()` 返回每列占用的字节数，`deep=True` 计入 object 列内部对象的开销：

```python
import pandas as pd

df = pd.DataFrame({'A': range(10000), 'B': ['x'] * 10000})
print(df.memory_usage())
print(df.memory_usage(deep=True))
```

`deep=True` 对字符串列影响很大，浅层统计会严重低估。

### .info(memory_usage='deep')

`.info()` 加 `memory_usage='deep'` 输出包含深度的总内存统计：

```python
df.info(memory_usage='deep')
```

## 1.11.2 数据类型向下转型

数据的实际取值范围往往比默认类型小，向下转型可以显著节省内存。整数默认 int64，如果值都在 0-255 之间可以转成 uint8：

```python
df = pd.DataFrame({'年龄': [25, 30, 28, 31]})
df['年龄'] = df['年龄'].astype('int8')
print(df['年龄'].dtype)      # int8
```

浮点默认 float64，精度要求不高时可转 float32：

```python
df['身高'] = df['身高'].astype('float32')
```

`pd.to_numeric` 配合 `downcast` 参数自动选择最小可容纳的类型：

```python
import numpy as np
s = pd.Series([1, 2, 3])
print(pd.to_numeric(s, downcast='integer').dtype)   # int8
```

## 1.11.3 使用 category 类型

对取值重复度高的分类列，转成 `category` 可以大幅节省内存。category 只存储类别列表与整数编码，不重复存储每个字符串：

```python
df = pd.DataFrame({'城市': ['北京'] * 5000 + ['上海'] * 5000})
print(df.memory_usage(deep=True)['城市'])
df['城市'] = df['城市'].astype('category')
print(df.memory_usage(deep=True)['城市'])
```

类别数远小于行数时收益明显，类别接近行数时收益很小甚至变差。

## 1.11.4 pd.eval 与 pd.query 表达式求值

`pd.eval()` 用 numexpr 引擎求值表达式，避免创建中间 DataFrame，加速复合算术：

```python
df = pd.DataFrame({'A': range(1000000), 'B': range(1000000)})
result = pd.eval('A + B + A * B')
```

`pd.query()` 用同样的引擎加速条件筛选，前面已介绍。`numexpr` 引擎对大型浮点/整数运算的加速明显，需安装 numexpr 库：

```bash
pip install numexpr
```

`pd.eval` 在链式运算中能减少内存峰值，因为不会为每个中间步骤生成完整副本。

## 1.11.5 分块读取大文件

`pd.read_csv(..., chunksize=...)` 按块读取大型 CSV，每块是一个 DataFrame，配合迭代器逐块处理：

```python
chunks = pd.read_csv('big.csv', chunksize=10000)
total = 0
for chunk in chunks:
    total += chunk['值'].sum()
print(total)
```

`chunksize` 指定每块行数，返回的 TextFileReader 对象可迭代。对无法整块装入内存的大文件，这是标准处理方式。

## 1.11.6 inplace 参数与副本

`inplace=True` 直接在原对象上修改，避免创建副本。但多数操作返回新对象更安全，Pandas 文档建议谨慎使用 inplace：

```python
df = pd.DataFrame({'A': [1, 2, 3]})
df.drop('A', axis=1, inplace=True)   # 原地删除，不再返回新对象
```

Pandas 3.0 起 `inplace` 参数将被移除，建议用返回值链式赋值。

## 1.11.7 copy_on_write 模式

Pandas 2.0 引入 Copy-on-Write（写时复制）模式，`pd.set_option('mode.copy_on_write', True)` 启用。它延迟数据复制，只有在真正写入时才复制，避免修改视图时意外改动原数据，同时减少不必要的复制开销：

```python
pd.set_option('mode.copy_on_write', True)

df = pd.DataFrame({'A': [1, 2, 3]})
sub = df['A']
sub[0] = 99
print(df)   # A 列不受影响，视图修改不会回写到原对象
```

启用后 `.loc` 等操作返回的结果修改不再影响原 DataFrame，也消除了大量链式赋值的告警。

## 1.11.8 索引优化

有序索引能加速选择和切片。`sort_index()` 排序后，`.loc` 的范围选择可以使用二分查找而非线性扫描：

```python
df = pd.DataFrame({'值': range(1000000)}).sort_index()
print(df.loc[100:200])   # 有序索引下更快
```

`pd.RangeIndex` 是最高效的索引，能显式表达时优先用整数范围索引。

## 练习题

### 第1题 概念理解

说明 `category` 类型节省内存的原理；说明 `copy_on_write` 解决的问题。

::: details 参考答案

`category` 只存储类别表与整数编码，不重复存储字符串本身，重复度高的列收益大。`copy_on_write` 延迟复制，修改视图不再回写原对象，避免意外改数据和多余复制。
:::

### 第2题 代码编写

生成 10 万行的 DataFrame，比较转换 `category` 前后某列的内存占用；对数值列做向下转型并查看 dtype；用 `.info(memory_usage='deep')` 输出总内存。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'类别': ['A'] * 50000 + ['B'] * 50000,
                   '值': range(100000)})
print(df.memory_usage(deep=True)['类别'])
df['类别'] = df['类别'].astype('category')
print(df.memory_usage(deep=True)['类别'])
df['值'] = pd.to_numeric(df['值'], downcast='integer')
print(df['值'].dtype)
df.info(memory_usage='deep')
```

:::

### 第3题 进阶练习

用 `pd.eval` 计算一个大 DataFrame 的复合表达式并对比时间；用 `chunksize` 分块读取并汇总；开启 `copy_on_write` 后验证视图修改不再影响原对象。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'A': range(1000000), 'B': range(1000000)})
result = pd.eval('A + B')

with open('tmp.csv', 'w') as f:
    f.write('值\n1\n2\n3\n4\n5\n')

total = 0
for chunk in pd.read_csv('tmp.csv', chunksize=2):
    total += chunk['值'].sum()
print(total)

pd.set_option('mode.copy_on_write', True)
d = pd.DataFrame({'A': [1, 2, 3]})
sub = d['A']
sub[0] = 99
print(d)   # A 列仍为 [1, 2, 3]
```

:::

## 常见错误

**错误 1 · `memory_usage()` 统计的内存远小于任务管理器显示**

原因:默认 `deep=False`,object 列内部对象的开销未被计入。

解决:用 `deep=True`。

**错误 2 · 转 `category` 后内存反而变大**

原因:类别数与行数接近时,类别表加编码的开销超过直接存储。

解决:只在类别数远小于行数时使用 category。

**错误 3 · 分块读取时报内存错误**

原因:`chunksize` 没有真正分块处理,或每块内又做了整块复制。

解决:确认在循环里逐块消费数据,避免把全部块累计成一个大对象。

**错误 4 · 视图修改意外改变原 DataFrame**

原因:未启用 `copy_on_write` 时,部分选择结果与原对象共享数据。

解决:启用 `mode.copy_on_write`,或修改前显式 `.copy()`。
