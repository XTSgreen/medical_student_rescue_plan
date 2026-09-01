---
title: 1.18 缺失值表示与插值
sidebar:
  order: 18
---
# 1.18 缺失值表示与插值

第 5 章介绍了缺失值的基本处理，本节深入缺失值的表示体系与插值方法。Pandas 中缺失值有 `np.nan`、`None`、`pd.NA` 三种表示，理解它们的区别是正确清洗数据的前提。插值则是一类更精细的填充方式，用数学方法根据已有数据推算缺失位置的值。本节系统讲解缺失值标量、检测方法、填充规则，以及 `interpolate` 支持的各类插值算法。

## 1.18.1 缺失值标量

Pandas 中有三种缺失值表示，需要区分使用场景：

```python
import pandas as pd
import numpy as np

print(np.nan)      # 浮点 NaN，最常用
print(None)        # Python 的 None
print(pd.NA)       # Pandas 专用缺失标量，用于可空类型
```

**`np.nan`** 是 IEEE 754 浮点定义的 NaN，历史最久、兼容性最好，任何浮点运算遇到 NaN 都会传播。**`None`** 是 Python 内置的缺失对象，`None` 进入数值列时会被自动转换成 NaN。**`pd.NA`** 是 Pandas 2.0 起推出的通用缺失标量，专用于 `Int64`、`string`、`boolean` 等可空扩展类型，可以存放在整数列中而不把整数提升为浮点。

三者的选择原则：新版 Pandas 中处理可空整数、字符串、布尔列时优先用 `pd.NA`；与 NumPy 或外部库交互时用 `np.nan`；普通场景两者都可。

### 可空类型

`pd.NA` 让整数列可以存放缺失而不变成浮点：

```python
s = pd.Series([1, 2, None], dtype='Int64')   # 可空整数类型
print(s)
# 0       1
# 1       2
# 2    <NA>
# dtype: Int64

s2 = pd.Series([1, 2, None])                 # 默认 float64，None 转 NaN
print(s2.dtype)   # float64
```

`dtype='Int64'`（注意大写 I）是可空整数类型，`'string'`、`'boolean'` 同理支持 `pd.NA`。

## 1.18.2 缺失值判断

`.isna()`、`.isnull()`、`.notna()` 三个方法行为一致，`isnull` 是 `isna` 的别名。它们能统一识别 `np.nan`、`None`、`pd.NA`：

```python
s = pd.Series([1, np.nan, None, pd.NA])
print(s.isna())
# 0    False
# 1     True
# 2     True
# 3     True
```

注意用 `==` 判断 NaN 永远返回 False（`np.nan == np.nan` 是 False），判断缺失必须用 `.isna()`。

## 1.18.3 填充选项 fillna 的 method

`.fillna()` 的 `method` 参数控制填充方向。`'ffill'`（等价别名 `'pad'`）前向填充，用上方最近的非空值填充；`'bfill'`（等价别名 `'backfill'`）后向填充：

```python
s = pd.Series([1, None, None, 4, None])
print(s.fillna(method='ffill'))
# 0    1.0
# 1    1.0
# 2    1.0
# 3    4.0
# 4    4.0

print(s.fillna(method='bfill'))
# 0    1.0
# 1    4.0
# 2    4.0
# 3    4.0
# 4    NaN
```

`limit` 限制连续填充的最大个数：

```python
print(s.fillna(method='ffill', limit=1))
# 0    1.0
# 1    1.0
# 2    NaN
# 3    4.0
# 4    NaN
```

## 1.18.4 插值方法 .interpolate()

`.interpolate()` 根据已有数据推算缺失值，默认线性插值，把缺失位置按两侧值的线性比例补上：

```python
s = pd.Series([1, None, None, 4])
print(s.interpolate())
# 0    1.0
# 1    2.0
# 2    3.0
# 3    4.0
```

插值用 `method` 参数选择算法，常见取值：

| method | 说明 |
| ---- | ---- |
| `'linear'` | 线性插值（默认），相邻点连直线 |
| `'time'` | 按时间间隔加权插值 |
| `'quadratic'` | 二次多项式插值 |
| `'polynomial'` | 多项式插值，需配合 `order` 指定阶数 |
| `'spline'` | 样条插值，需 `order` |
| `'pad'` | 前向填充，等价 ffill |
| `'nearest'` | 用最近的非空值 |
| `'zero'`、`'slinear'`、`'cubic'` | scipy 提供的一阶、线性、三次插值 |
| `'barycentric'`、`'krogh'`、`'piecewise_polynomial'` | scipy 提供的多项式插值算法 |
| `'pchip'`、`'akima'` | 保持形状的插值算法 |
| `'from_derivatives'` | 基于导数的插值 |

```python
s = pd.Series([1, None, None, 4])
print(s.interpolate(method='quadratic'))
print(s.interpolate(method='polynomial', order=2))
print(s.interpolate(method='nearest'))
```

高阶方法（quadratic、polynomial、spline、cubic、pchip 等）依赖 SciPy，需要 `pip install scipy`。`polynomial` 与 `spline` 必须指定 `order` 参数（多项式阶数）。

### 按时间插值

`method='time'` 按时间索引的间隔比例插值，时间间隔不均匀时更合理：

```python
idx = pd.to_datetime(['2024-01-01', '2024-01-03', '2024-01-10'])
s = pd.Series([10, None, 40], index=idx)
print(s.interpolate(method='time'))
# 2024-01-01    10.0
# 2024-01-03    20.0
# 2024-01-10    40.0
```

## 1.18.5 插值选项 limit 与方向

`limit`、`limit_direction`、`limit_area` 控制插值的边界行为：

```python
s = pd.Series([None, 1, None, None, 4, None])

# limit：最多插值的连续缺失个数
print(s.interpolate(limit=1))
# limit_direction：插值方向，'forward'（默认）、'backward'、'both'
print(s.interpolate(limit_direction='backward'))
print(s.interpolate(limit_direction='both'))
# limit_area：限制插值区域，'inside' 只插中间的缺失，'outside' 只插两端的缺失
print(s.interpolate(limit_area='inside'))
print(s.interpolate(limit_area='outside'))
```

`limit` 限制每个连续缺失段的插值个数；`limit_direction` 决定从哪个方向推进插值；`limit_area` 限定只在数据内部还是首尾区域插值。

## 1.18.6 缺失值处理的完整流程

一个典型的数据清洗流程把检测、删除、填充、插值组合起来：

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({'A': [1, None, 3, None, 5],
                   'B': [10, 20, None, 40, 50]})

# 1. 检测缺失
print(df.isna().sum())

# 2. 按列用不同策略填充
df['A'] = df['A'].interpolate(method='linear')
df['B'] = df['B'].fillna(df['B'].mean())
print(df)
```

选择策略的原则：时间序列与有序数据优先插值；分类或标记性缺失用众数或占位值；无法合理推断的缺失直接删除或保留标记。

## 练习题

### 第1题 概念理解

说明 `np.nan`、`None`、`pd.NA` 三者的区别；说明为什么用 `==` 判断 NaN 不可靠；说明 `limit_area='inside'` 与 `'outside'` 的区别。

::: details 参考答案

`np.nan` 是浮点 NaN，`None` 是 Python 对象，`pd.NA` 是 Pandas 可空类型的通用缺失标量。`np.nan == np.nan` 为 False，所以判断缺失必须用 `.isna()`。`limit_area='inside'` 只插值数据两端的非空值之间的缺失，`'outside'` 只插值首尾两端的缺失。
:::

### 第2题 代码编写

创建一个含缺失的 Series，用 `ffill`、`bfill`、`limit=1` 三种方式填充并观察差异；用默认 `linear` 插值补全；用 `method='nearest'` 补全。

::: details 参考答案

```python
import pandas as pd

s = pd.Series([1, None, None, 4, None])
print(s.fillna(method='ffill'))
print(s.fillna(method='bfill'))
print(s.fillna(method='ffill', limit=1))
print(s.interpolate())
print(s.interpolate(method='nearest'))
```

:::

### 第3题 进阶练习

创建可空整数列 `dtype='Int64'` 并验证能存放缺失；对时间索引的 Series 用 `method='time'` 插值；用 `limit_direction='both'` 与 `limit_area='outside'` 插值首尾缺失。

::: details 参考答案

```python
import pandas as pd

s = pd.Series([1, None, 3], dtype='Int64')
print(s.isna())

idx = pd.to_datetime(['2024-01-01', '2024-01-03', '2024-01-10'])
s2 = pd.Series([10, None, 40], index=idx)
print(s2.interpolate(method='time'))

s3 = pd.Series([None, 1, None, None, 4, None])
print(s3.interpolate(limit_direction='both', limit_area='outside'))
```

:::

## 常见错误

**错误 1 · 用 `s[s == np.nan]` 筛选缺失值得到空结果**

原因:`np.nan == np.nan` 为 False，比较运算无法命中 NaN。

解决:用 `s[s.isna()]` 或 `s[s.notna()]`。

**错误 2 · 整数列混入缺失后变成浮点**

原因:默认整数类型不能存 NaN，缺失使整列提升为 float64。

解决:改用可空整数 `dtype='Int64'` 或 `pd.NA`。

**错误 3 · 高阶插值报 `ImportError: Missing optional dependency 'scipy'`**

原因:`quadratic`、`polynomial`、`spline`、`cubic` 等方法依赖 SciPy。

解决:`pip install scipy`，并确认 `polynomial`/`spline` 传了 `order`。

**错误 4 · `interpolate` 首尾的缺失没有被填充**

原因:默认 `limit_direction='forward'` 且 `limit_area=None`，开头的缺失没有前值可参考。

解决:用 `limit_direction='both'` 或 `limit_area='outside'` 处理首尾缺失。
