---
title: 1.16 稀疏数据
sidebar:
  order: 16
---
# 1.16 稀疏数据

某些数据集中绝大多数值都是同一个值（通常是 0），例如用户行为矩阵、词频矩阵、基因表达矩阵。如果按普通格式存储，会浪费大量内存。稀疏数据结构只存储非填充值，用**稀疏表示**大幅降低内存占用。本节讲解 Pandas 稀疏数据的创建、属性与运算。稀疏数据的完整高级用法（矩阵运算、压缩存储）在 SciPy 的稀疏矩阵章节展开。

## 1.16.1 稀疏数据的概念

稀疏数据指大部分位置取同一个填充值（fill value，通常为 0）的数据。普通存储为每个元素分配内存，稀疏存储只记录非填充值及其位置，内存开销与有效数据量成正比：

```python
import pandas as pd
import numpy as np

# 100 行 1 列，只有 3 个非零值
data = np.zeros(100)
data[[10, 50, 90]] = [1, 2, 3]
s = pd.Series(data, dtype='Sparse[int64]')
print(s)
```

`dtype='Sparse[...]'` 让 Series 以稀疏方式存储，底层只保存非填充值。

## 1.16.2 创建稀疏数据结构

### pd.arrays.SparseArray

`pd.arrays.SparseArray` 是稀疏数据的底层数组，可以从稠密数据创建：

```python
arr = pd.arrays.SparseArray([0, 0, 5, 0, 0, 7])
print(arr)
# [0, 0, 5, 0, 0, 7]
# Fill: 0
# Int64Index([2, 5], dtype='int64')
```

### dtype='Sparse' 创建稀疏列

在 Series 或 DataFrame 中指定 `dtype='Sparse[...]'` 创建稀疏列：

```python
s = pd.Series([0, 0, 1, 0, 0, 2], dtype='Sparse[int64]')
print(s.dtype)   # Sparse[int64, 0]
```

DataFrame 的列也可以转成稀疏类型：

```python
df = pd.DataFrame({'A': [0, 0, 1, 0], 'B': [0, 2, 0, 0]})
df['A'] = df['A'].astype('Sparse[int64]')
print(df.dtypes)
```

### SparseSeries 与 SparseDataFrame

旧版本提供 `pd.SparseSeries` 与 `pd.SparseDataFrame`，**已弃用**。新版本直接使用 `pd.Series(dtype='Sparse[...]')` 或 `pd.DataFrame(..., dtype='Sparse[...]')`，用统一的稀疏 dtype 表达稀疏结构，代码更简洁。

## 1.16.3 稀疏属性 .sparse

稀疏 Series 通过 `.sparse` 访问器查看稀疏相关属性：

```python
s = pd.Series([0, 0, 1, 0, 0, 2], dtype='Sparse[int64]')
print(s.sparse.density)       # 有效密度，非填充值占比
print(s.sparse.fill_value)    # 填充值
print(s.sparse.to_dense())    # 转成稠密 Series
```

各属性的含义：`.sparse.density` 是有效数据占比（非填充值个数除以总长度）；`.sparse.fill_value` 是填充值（默认 0，创建时可指定）；`.sparse.to_dense()` 把稀疏结构还原为普通稠密 Series，用于与不感知稀疏的库交互。

### 指定填充值

创建时可以指定非零的填充值，适合"大部分值为 99"这类数据：

```python
s = pd.Series([99, 1, 99, 99, 2], dtype=pd.SparseDtype('int64', fill_value=99))
print(s.sparse.fill_value)   # 99
print(s.sparse.density)      # 0.4
```

## 1.16.4 稀疏运算

稀疏 Series 支持与普通 Series 相同的运算，大部分运算会返回稀疏结果：

```python
s1 = pd.Series([0, 0, 1, 0, 2], dtype='Sparse[int64]')
s2 = pd.Series([0, 1, 0, 0, 2], dtype='Sparse[int64]')

print(s1 + s2)        # 逐元素加法
print(s1 * s2)        # 逐元素乘法
print(s1.sum())       # 聚合
print(s1.to_numpy())  # 转成 numpy 数组
```

聚合（`sum`、`mean`、`min`、`max`）通常只扫描有效值，比稠密计算更快。转成 NumPy 数组时结果仍是稠密数组。

稀疏列参与分组、索引选择等操作时行为与普通列一致，用户在绝大多数场景下无需区分：

```python
df = pd.DataFrame({'组': ['甲', '甲', '乙'], '值': pd.Series([0, 1, 0], dtype='Sparse[int64]')})
print(df.groupby('组')['值'].sum())
```

## 1.16.5 稀疏数据的适用场景

稀疏数据结构在以下场景收益明显：数据以 0 为主、需要把多个稀疏矩阵拼接成 DataFrame、中间结果内存吃紧。它的开销在于每个值额外记录位置，因此有效值占比过高时（密度接近 1），稀疏存储反而更慢更占内存。判断是否适合用稀疏数据，先看密度：**密度越低收益越大**。

用 `density` 评估存储效率：

```python
import numpy as np
data = np.random.choice([0, 0, 0, 0, 1], size=1000)
s = pd.Series(data, dtype='Sparse[int64]')
print(s.sparse.density)   # 远小于 1
```

## 练习题

### 第1题 概念理解

说明稀疏数据节省内存的原理；说明 `density`、`fill_value` 的含义；说明为什么密度过高时不适合用稀疏存储。

::: details 参考答案

稀疏数据只存储非填充值及其位置，内存与有效值数量成正比。`density` 是有效值占比，`fill_value` 是填充值（通常 0）。密度接近 1 时记录位置的开销超过省下的内存，反而更浪费。
:::

### 第2题 代码编写

创建含大量 0 的 Series 并转成 `Sparse[int64]`，查看 `density` 与 `fill_value`；用 `to_dense()` 还原；对两个稀疏 Series 做加法和乘法。

::: details 参考答案

```python
import pandas as pd
import numpy as np

data = np.zeros(50)
data[[3, 20, 45]] = [1, 2, 3]
s = pd.Series(data, dtype='Sparse[int64]')
print(s.sparse.density)
print(s.sparse.fill_value)
print(s.sparse.to_dense())

s2 = pd.Series([0, 0, 1, 0, 2], dtype='Sparse[int64]')
s3 = pd.Series([0, 1, 0, 0, 2], dtype='Sparse[int64]')
print(s2 + s3)
print(s2 * s3)
```

:::

### 第3题 进阶练习

创建指定 `fill_value=99` 的稀疏 Series 并验证属性；把 DataFrame 的列转成稀疏类型并查看 `dtypes`；用稀疏列参与分组聚合。

::: details 参考答案

```python
import pandas as pd

s = pd.Series([99, 1, 99, 2], dtype=pd.SparseDtype('int64', fill_value=99))
print(s.sparse.fill_value, s.sparse.density)

df = pd.DataFrame({'A': [0, 0, 1], 'B': [1, 2, 3]})
df['A'] = df['A'].astype('Sparse[int64]')
print(df.dtypes)

df2 = pd.DataFrame({'组': ['x', 'x', 'y'],
                    '值': pd.Series([0, 1, 0], dtype='Sparse[int64]')})
print(df2.groupby('组')['值'].sum())
```

:::

## 常见错误

**错误 1 · 想用 `pd.SparseSeries` / `pd.SparseDataFrame` 报弃用警告或错误**

原因:这两个类已弃用,新版移除了旧接口。

解决:改用 `pd.Series(..., dtype='Sparse[...]')` 或 `df.astype('Sparse[...]')`。

**错误 2 · 稀疏数据转 NumPy 后仍占大量内存**

原因:`to_numpy()` 返回的是稠密数组,稀疏结构被展开。

解决:确认下游确实需要稠密数据,否则保持稀疏结构做运算。

**错误 3 · 密度接近 1 的数据用稀疏存储后更慢**

原因:记录每个值的位置带来额外开销,有效值多时得不偿失。

解决:先评估 `density`,密度高时用普通存储。

**错误 4 · 创建稀疏列时 dtype 写错报 `ValueError`**

原因:`dtype` 需要写成 `'Sparse[int64]'` 或 `'Sparse[float64]'` 的完整形式,写 `'Sparse'` 不合法。

解决:使用 `pd.SparseDtype('int64', fill_value=0)` 或完整字符串 `'Sparse[int64]'`。
