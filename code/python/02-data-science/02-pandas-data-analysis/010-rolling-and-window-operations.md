---
title: 1.10 窗口与滚动操作
sidebar:
  order: 10
---
# 1.10 窗口与滚动操作

第 7 章末尾简单接触了 `.rolling()` 与 `.expanding()`，时间序列分析中窗口操作是计算移动平均、波动率、累积统计的核心手段。窗口操作的核心思想：对序列上滑动的子区间分别计算统计量，输出与原始序列等长的结果。本节完整讲解滚动窗口、扩展窗口、指数加权移动三种窗口对象，以及窗口的自定义聚合与相关性计算。

## 1.10.1 rolling 滚动窗口对象

`.rolling(window)` 生成滚动窗口对象，`window` 是窗口大小。窗口沿序列滑动，每个位置取当前位置及之前的 window-1 个值组成一个子区间：

```python
import pandas as pd

s = pd.Series([1, 2, 3, 4, 5, 6])
print(s.rolling(3).mean())
# 0    NaN
# 1    NaN
# 2    2.0
# 3    3.0
# 4    4.0
# 5    5.0
```

窗口大小为 3 时，第 0、1 个位置窗口未满，得到 NaN。窗口对象本身不计算，需要接聚合方法。

## 1.10.2 常用聚合

滚动窗口支持丰富的聚合函数，与分组聚合的函数名一致：

```python
s = pd.Series([1, 2, 3, 4, 5])
r = s.rolling(3)

print(r.sum())       # 窗口和
print(r.mean())      # 窗口均值
print(r.median())    # 窗口中位数
print(r.var())       # 窗口方差
print(r.std())       # 窗口标准差
print(r.min())       # 窗口最小值
print(r.max())       # 窗口最大值
print(r.count())     # 窗口内非空个数
print(r.skew())      # 窗口偏度
print(r.kurt())      # 窗口峰度
```

## 1.10.3 自定义聚合 .aggregate() 与 .apply()

`.aggregate()` 可以传多个函数或字典，`.apply()` 可以传自定义函数：

```python
s = pd.Series([1, 2, 3, 4, 5])
print(s.rolling(3).agg(['mean', 'max']))

def my_span(win):
    return win.max() - win.min()

print(s.rolling(3).apply(my_span))
```

自定义函数接收一个窗口的 Series，返回该窗口的聚合值。

## 1.10.4 加权滚动

`.apply()` 传入带权重的函数可以实现加权移动平均，例如越近的值权重越大：

```python
def weighted_mean(win):
    weights = [0.2, 0.3, 0.5]
    return (win * weights).sum() / sum(weights)

print(s.rolling(3).apply(weighted_mean))
```

## 1.10.5 expanding 扩展窗口

`.expanding()` 生成扩展窗口，窗口起点固定为序列开头，终点逐步扩展。它相当于累积计算：

```python
s = pd.Series([1, 2, 3, 4, 5])
print(s.expanding().sum())
# 0     1.0
# 1     3.0
# 2     6.0
# 3    10.0
# 4    15.0

print(s.expanding().mean())
print(s.expanding().max())
```

扩展窗口常用来计算"截至当前时刻"的累计统计量，比如累积收益、历史最大值。

## 1.10.6 ewm 指数加权移动

`.ewm()` 计算指数加权移动，近期的观测获得更高的权重，权重按指数衰减。它不需要固定窗口，每个位置都利用全部历史：

```python
s = pd.Series([1, 2, 3, 4, 5])
print(s.ewm(span=3).mean())
print(s.ewm(alpha=0.5).mean())
print(s.ewm(com=2).mean())
print(s.ewm(halflife=2).mean())
```

四个参数描述衰减速度，任选其一：

| 参数 | 含义 | 说明 |
| ---- | ---- | ---- |
| `span` | 跨度 | 与 `alpha` 关系为 `alpha = 2 / (span + 1)` |
| `alpha` | 平滑系数 | 直接指定衰减率，取值 0 到 1 |
| `com` | 中心质量 | `alpha = 1 / (com + 1)` |
| `halflife` | 半衰期 | 权重衰减到一半所需的期数 |

`adjust=False` 时使用指数平滑的递推形式，第一个值不再特殊处理。

## 1.10.7 窗口选项

滚动窗口有若干影响边界行为的选项：

```python
s = pd.Series([1, 2, 3, 4, 5])

# min_periods：窗口内最少需要的非空值个数，少于则输出 NaN
print(s.rolling(3, min_periods=2).mean())
# 0    NaN
# 1    1.5
# 2    2.0
# ...

# center：窗口中心对齐，结果位置居中而非靠右
print(s.rolling(3, center=True).mean())

# closed：窗口区间的端点包含方式
print(s.rolling(3, closed='both').mean())
```

`min_periods` 控制有效窗口的最小观测数，`center=True` 让输出对齐到窗口中心，`closed` 控制区间的左右端点是否包含（取值 `'right'`、`'left'`、`'both'`、`'neither'`）。

## 1.10.8 rolling 相关性

`.rolling().corr()` 与 `.rolling().cov()` 计算两个序列之间随时间滑动的相关性与协方差：

```python
s1 = pd.Series([1, 2, 3, 4, 5])
s2 = pd.Series([2, 4, 5, 8, 9])
print(s1.rolling(3).corr(s2))
print(s1.rolling(3).cov(s2))
```

两个 Series 的索引需对齐，`window` 表示参与计算的观测数。滚动相关性在金融、信号处理中用于观察两个变量的关系随时间如何变化。

## 练习题

### 第1题 概念理解

说明 `.rolling()`、`.expanding()`、`.ewm()` 三种窗口的差异；说明 `min_periods` 的作用。

::: details 参考答案

`.rolling()` 是固定大小的滑动窗口，`.expanding()` 是从开头到当前的扩展窗口，`.ewm()` 是全部历史但按指数衰减加权。`min_periods` 指定窗口内最少非空值个数，不足时输出 NaN。
:::

### 第2题 代码编写

对 Series `[1, 2, 3, 4, 5, 6]` 分别计算窗口为 3 的移动均值、扩展累计和、指数加权均值；再用 `.agg` 一次计算窗口的均值与最大值。

::: details 参考答案

```python
import pandas as pd

s = pd.Series([1, 2, 3, 4, 5, 6])
print(s.rolling(3).mean())
print(s.expanding().sum())
print(s.ewm(span=3).mean())
print(s.rolling(3).agg(['mean', 'max']))
```

:::

### 第3题 进阶练习

对两个对齐的 Series 用 `.rolling(3).corr()` 计算滚动相关系数；用 `.apply()` 计算窗口的自定义统计（如极差、去极值均值）；验证 `center=True` 对输出位置的影响。

::: details 参考答案

```python
import pandas as pd

s1 = pd.Series([1, 2, 3, 4, 5])
s2 = pd.Series([2, 4, 5, 8, 9])
print(s1.rolling(3).corr(s2))

def trimmed_mean(win):
    return win.quantile(0.5)
print(s1.rolling(3).apply(trimmed_mean))

print(s1.rolling(3, center=True).mean())
```

:::

## 常见错误

**错误 1 · 窗口操作的输出开头全是 NaN**

原因:窗口未满时没有足够的观测值,默认输出 NaN。

解决:用 `min_periods=1` 让至少有一个值就输出,或对开头单独处理。

**错误 2 · `.rolling().corr()` 报 `ValueError: Lengths must match`**

原因:两个 Series 长度或索引不一致。

解决:先确保两个序列索引对齐,必要时用 `.reindex()` 统一。

**错误 3 · `ewm` 的结果从第一个值开始就与直觉不符**

原因:默认 `adjust=True`,第一个观测单独处理,影响前几个值的平滑结果。

解决:需要标准指数平滑递推时设 `adjust=False`。

**错误 4 · 自定义 `.apply()` 函数报维度错误**

原因:函数内部用了标量操作,而传入的是窗口 Series,或返回值不是标量。

解决:确保自定义函数接收窗口 Series、返回单个标量值。
