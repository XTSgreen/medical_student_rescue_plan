---
title: 1.21 时间序列高级特性
sidebar:
  order: 21
---
# 1.21 时间序列高级特性

第 8 章已经覆盖时间序列的基础：日期范围、时间戳、时间差、重采样。实际业务中的时间序列还会遇到更复杂的需求：节假日对营业日的影响、月末季末的固定节奏、跨时区换算、升采样时的插值、以及滞后与差分的组合分析。本节把这些高级特性集中展开，包括日期偏移量（`pd.offsets`）、组合偏移量、时段（Period）与转换、移动窗口与滞后、差分与自相关、重采样的聚合规则与升采样填充、时间序列切片。

## 1.21.1 日期偏移量 pd.offsets

### 偏移量的概念

偏移量（offset）描述"从某个时间点往前或往后推多少"，是重采样、生成日期范围、移动数据的底层单位。`pd.offsets` 模块提供两类偏移量：**绝对时间偏移量**（如 `Hour`、`Minute`、`Second`，时长固定）和**日历偏移量**（如 `MonthEnd`、`BusinessDay`，随日历与节假日变化）。偏移量可以加在 `Timestamp` 上：

```python
import pandas as pd

ts = pd.Timestamp('2024-03-15 12:00:00')
print(ts + pd.offsets.Day(3))          # 2024-03-18 12:00:00
print(ts + pd.offsets.Hour(2))         # 2024-03-15 14:00:00
print(ts + pd.offsets.MonthEnd(0))     # 2024-03-31 00:00:00，本月最后一个工作日/月末
```

`MonthEnd(0)` 表示"推到当前所在月份的最后一天"，这是日历偏移量区别于固定时长偏移量的典型用法。

### 常用偏移量

`pd.offsets` 常用偏移量按单位与语义整理如下：

| 类别 | 偏移量 | 说明 |
|------|--------|------|
| 固定时长 | `Day(n)` | n 天 |
| 固定时长 | `Hour(n)`、`Minute(n)`、`Second(n)` | n 小时 / 分钟 / 秒 |
| 固定时长 | `Milli(n)`、`Micro(n)`、`Nano(n)` | n 毫秒 / 微秒 / 纳秒 |
| 工作日 | `BusinessDay(n)` | n 个工作日（跳过周末） |
| 自定义工作日 | `CustomBusinessDay(n, weekmask=...)` | 自定义哪些天算工作日 |
| 月末/月初 | `MonthEnd(n)`、`MonthBegin(n)` | 推到第 n 个月的月末 / 月初 |
| 季末/季初 | `QuarterEnd(n)`、`QuarterBegin(n)` | 季度末 / 季度初 |
| 年末/年初 | `YearEnd(n)`、`YearBegin(n)` | 年末 / 年初 |
| 周 | `Week(n, weekday=0)` | n 周，可指定落在一周中的星期几 |
| 半月 | `SemiMonthEnd(n)`、`SemiMonthBegin(n)` | 半月末 / 半月末（每月 15 日与月末） |
| 月内某周 | `WeekOfMonth(week=0, weekday=0)` | 每月第几个星期几 |

示例：

```python
import pandas as pd

ts = pd.Timestamp('2024-01-31')
print(ts + pd.offsets.BusinessDay(1))       # 2024-02-01（跳过 2 月 1 日前的周末边界）
print(ts + pd.offsets.QuarterEnd(0))        # 2024-03-31
print(ts + pd.offsets.WeekOfMonth(week=1, weekday=3))  # 2024 年 1 月第二个星期四
```

### 工作日与自定义工作日

`BusinessDay` 默认跳过周六周日。涉及法定节假日（如春节、国庆）时用 `CustomBusinessDay` 配合 `holidays` 参数：

```python
import pandas as pd

from pandas.tseries.offsets import CustomBusinessDay
import datetime

holidays = [datetime.date(2024, 10, 1), datetime.date(2024, 10, 2)]
cbd = CustomBusinessDay(holidays=holidays)

ts = pd.Timestamp('2024-09-30')
print(ts + cbd)   # 2024-10-08，跳过 10 月 1、2 日与周末
```

`CustomBusinessDay` 还可以用 `weekmask` 指定一周中哪些天算工作日，例如"周一至周六上班"：

```python
cbd = CustomBusinessDay(weekmask='Mon Tue Wed Thu Fri Sat')
```

### 组合偏移量

多个偏移量可以用 `+` 组合成一条规则。组合时按**日历偏移量优先、固定时长其次**的顺序推进，避免出现"加一个月再减一天"式的错位：

```python
import pandas as pd

ts = pd.Timestamp('2024-01-31')
combo = pd.offsets.MonthEnd(1) + pd.offsets.Day(1)
print(ts + combo)   # 先推到 2 月末，再加 1 天：2024-03-01
```

`MonthEnd(1)` 把 `2024-01-31` 推到 2 月末（`2024-02-29`），再加 1 天得到 `2024-03-01`。**组合顺序会影响结果**，应先处理日历偏移，再处理固定时长。

## 1.21.2 时段 Period 与转换

`pd.Period` 表示一段固定长度的时间区间，例如"2024 年 3 月"、"2024 年第 1 季度"。它有明确频率（freq），区间端点会自动对齐：

```python
import pandas as pd

p = pd.Period('2024-03', freq='M')
print(p)                # 2024-03
print(p + 1)            # 2024-04
print(p.start_time)     # 2024-03-01 00:00:00
print(p.end_time)       # 2024-03-31 23:59:59.999999999
```

### PeriodIndex 与 asfreq

多个 Period 组成 `PeriodIndex`，可用 `asfreq()` 在频率之间转换，例如把月数据转为季度：

```python
import pandas as pd

idx = pd.period_range('2024-01', '2024-06', freq='M')
print(idx)                    # PeriodIndex(['2024-01' ... '2024-06'], freq='M')
print(idx.asfreq('Q'))        # 转成季度
```

`asfreq('Q')` 把每个月映射到所在季度，`freq='Q'` 的边界取季末。转换策略由 `how` 参数决定（默认 'E' 取区间末端所属周期，'S' 取区间起点）。

### 时间戳与 Period 互转

时间戳（DatetimeIndex）与 Period 可以互相转换：

```python
import pandas as pd

ts = pd.to_datetime(['2024-01-15', '2024-02-20'])
print(ts.to_period('M'))      # 时间戳转月周期：['2024-01', '2024-02']

per = pd.PeriodIndex(['2024-01', '2024-02'], freq='M')
print(per.to_timestamp())     # 周期转时间戳（取每月第一天）
```

`to_timestamp()` 默认取每个周期的起始时刻，`how='end'` 可改为取周期末端。

## 1.21.3 移动窗口与滞后

### 滞后与超前 shift

`.shift()` 把数据沿时间轴平移。默认按行数平移；`freq` 参数可按时间频率平移，保持索引不变：

```python
import pandas as pd

idx = pd.date_range('2024-01-01', periods=4, freq='D')
s = pd.Series([1, 2, 3, 4], index=idx)
print(s.shift(1))          # 滞后 1 个位置，首个位置为 NaN
print(s.shift(-1))         # 超前 1 个位置
print(s.shift(freq='2D'))  # 索引整体后移 2 天，数值不变
```

`.shift(1)` 常用于构造滞后特征（用昨天的值预测今天），`shift(freq='2D')` 用于把索引整体搬移。

### 滚动窗口与扩展窗口

滚动窗口（`.rolling`）与扩展窗口（`.expanding`）是移动窗口分析的两种形式，在第 10 章已经介绍，这里补充在时间序列中的应用：

```python
import pandas as pd

s = pd.Series([10, 20, 30, 40, 50], index=pd.date_range('2024-01-01', periods=5, freq='D'))
print(s.rolling(3).mean())      # 3 日移动平均
print(s.rolling('2D').sum())    # 按时间窗口（2 天）聚合
```

`rolling(3)` 按窗口内观测数滑动，`rolling('2D')` 按时间长度滑动，后者不受缺失日期影响。

## 1.21.4 差分与自相关

### 差分 diff

`.diff()` 计算相邻观测的差值，是平稳化处理的基础操作：

```python
import pandas as pd

s = pd.Series([2, 5, 9, 14, 20])
print(s.diff())     # [NaN, 3, 4, 5, 6]
print(s.diff(2))    # 跨 2 期的差分
```

### 自相关

自相关衡量序列与其自身滞后版本的线性相关程度。Pandas 不直接提供 `autocorr` 之外的完整函数，常用 `Series.autocorr()` 计算单个滞后阶的自相关系数，或结合 `.rolling()` 做滚动自相关：

```python
import pandas as pd
import numpy as np

np.random.seed(0)
s = pd.Series(np.random.randn(100))
print(s.autocorr(lag=1))     # 滞后 1 阶自相关
print(s.autocorr(lag=2))     # 滞后 2 阶自相关
```

`autocorr` 返回 -1 到 1 之间的值，接近 0 表示该滞后阶无明显线性依赖。

## 1.21.5 重采样的聚合规则

`.resample()` 是时间序列按频率重采样的核心，其参数控制分组边界的对齐方式：

| 参数 | 作用 |
|------|------|
| `on` | 指定作为时间轴的列（数据不是以时间作索引时使用） |
| `level` | 对 MultiIndex 中的某一层作重采样 |
| `closed` | 每个分箱的闭合端：`'left'` 左闭右开，`'right'` 右闭左开 |
| `label` | 用哪个边界标记结果：`'left'` 或 `'right'` |
| `origin` | 对齐的基准点（'epoch'、'start'、'end' 或具体时间戳） |
| `offset` | 相对 `origin` 的偏移量 |
| `loffset` | 对结果索引整体平移（新版建议用 `offset`） |

示例：

```python
import pandas as pd

idx = pd.date_range('2024-01-01', periods=6, freq='H')
df = pd.DataFrame({'值': [1, 2, 3, 4, 5, 6]}, index=idx)

# 按 2 小时分箱，标签取右边界
print(df.resample('2H', closed='left', label='right').sum())
```

`closed` 与 `label` 组合决定箱体的端点归属，多数金融时间序列习惯 `closed='right', label='right'`（收盘价聚合）。

### 按列重采样与按层级重采样

数据列不在索引中时用 `on`；MultiIndex 数据用 `level`：

```python
import pandas as pd

df = pd.DataFrame({'日期': pd.date_range('2024-01-01', periods=6, freq='D'),
                   '值': [1, 2, 3, 4, 5, 6]})
print(df.resample('2D', on='日期').sum())
```

### origin 与 offset

`origin` 控制分箱从哪个时间点起算，`offset` 在起算点上做平移。默认 `origin='start_day'` 从每天的零点起算；要模拟交易日按 9:30 开盘分箱：

```python
import pandas as pd

idx = pd.date_range('2024-01-01 09:00', periods=6, freq='15min')
s = pd.Series(range(6), index=idx)
print(s.resample('30min', origin='start', offset='30min').sum())
```

## 1.21.6 升采样填充

从低频数据升到高频（如月度到每日）时，低频区间内没有观测，需要填充。常用 `ffill`（前向填充）、`bfill`（后向填充）、`interpolate`（插值）：

```python
import pandas as pd

idx = pd.date_range('2024-01-01', periods=3, freq='D')
s = pd.Series([10, 20, 30], index=idx)

# 升到每 8 小时，前向填充
print(s.resample('8H').ffill())
# 升到每 8 小时，线性插值
print(s.resample('8H').interpolate())
```

`resample('8H').ffill()` 把每个低频值向后传播；`interpolate()` 在缺失区间做线性插值，适合趋势平滑的场景。**重采样产生的是缺失值再填充**，`ffill`/`bfill` 直接作用于重采样结果。

## 1.21.7 时间序列切片

以时间索引的 Series/DataFrame 支持用字符串切片，起止两端都包含（与普通切片含头不含尾不同）：

```python
import pandas as pd

idx = pd.date_range('2020-01-01', '2020-06-30', freq='D')
df = pd.DataFrame({'值': range(len(idx))}, index=idx)

print(df['2020-01-01':'2020-03-31'])     # 前 3 个月，含两端
print(df['2020-01'])                     # 仅 2020 年 1 月
print(df['2020'])                        # 整个 2020 年
print(df.loc['2020-02-15':'2020-02-20']) # 用 loc 做区间切片
```

字符串切片按 **日历语义** 匹配：`df['2020-01']` 取整个 1 月，`df['2020']` 取全年，无需记忆具体边界日期。切片范围超出索引时自动截断，不会报错。

## 练习题

### 第1题 概念理解

说明绝对时间偏移量与日历偏移量的区别；说明组合偏移量时为什么应先处理日历偏移；说明 `closed`、`label` 在重采样中的作用。

::: details 参考答案

绝对时间偏移量（`Hour`、`Day` 等）时长固定，日历偏移量（`MonthEnd`、`BusinessDay` 等）随日历和节假日变化。组合时先处理日历偏移，可避免因闰月、月末导致"加一个月再减一天"产生错位。`closed` 决定分箱闭合端，`label` 决定用哪个边界标记结果。
:::

### 第2题 代码编写

创建 2024 年 1 月 1 日到 1 月 10 日的日频 Series，用 `shift(1)` 生成滞后特征；用 `rolling('2D')` 计算按时间窗口的均值；用 `diff()` 计算差分。

::: details 参考答案

```python
import pandas as pd

idx = pd.date_range('2024-01-01', periods=10, freq='D')
s = pd.Series([2, 5, 9, 14, 20, 15, 8, 3, 6, 11], index=idx)

print(s.shift(1))            # 滞后 1 期
print(s.rolling('2D').mean()) # 按 2 天时间窗口均值
print(s.diff())              # 一阶差分
```

:::

### 第3题 进阶练习

用 `CustomBusinessDay` 构造跳过 2024 年国庆假期的自定义工作日并验证；把月频数据重采样到季度并比较 `closed` 与 `label` 不同取值的结果；用 `resample` 升采样并分别用 `ffill` 与 `interpolate` 填充。

::: details 参考答案

```python
import pandas as pd
import datetime

from pandas.tseries.offsets import CustomBusinessDay

holidays = [datetime.date(2024, 10, 1), datetime.date(2024, 10, 2)]
cbd = CustomBusinessDay(holidays=holidays)
print(pd.Timestamp('2024-09-30') + cbd)   # 2024-10-08

idx = pd.date_range('2024-01-01', periods=90, freq='D')
s = pd.Series(range(90), index=idx)
print(s.resample('Q', closed='right', label='right').sum())

print(s.resample('4H').ffill())
print(s.resample('4H').interpolate())
```

:::

## 常见错误

**错误 1 · `MonthEnd(0)` 结果与预期不符**
 
原因:`MonthEnd(0)` 表示"推到当前月月末",对已经是月末的时间戳加 `MonthEnd(0)` 不变。
 
解决:先明确目标月份再选择偏移量;跨月用 `MonthEnd(1)` 并注意组合顺序。

**错误 2 · 组合偏移量得到错误日期**
 
原因:固定时长偏移先于日历偏移计算,导致跨月末时错位。
 
解决:把日历偏移写在前、固定时长写在后,如 `pd.offsets.MonthEnd(1) + pd.offsets.Day(1)`。

**错误 3 · 重采样时 `label` 与 `closed` 混淆**
 
原因:把两者混为一谈,导致分箱标记或数据归属不符合预期。
 
解决:`closed` 决定区间端点归属,`label` 决定结果索引取哪个边界,两者独立设置。

**错误 4 · 升采样结果全是 NaN**
 
原因:低频到高频后区间内无观测,直接聚合得到 NaN。
 
解决:对重采样结果追加 `ffill()`、`bfill()` 或 `interpolate()`。

**错误 5 · 字符串切片出现意外结果**
 
原因:误用普通切片的"含头不含尾"规则,或切片格式与索引频率不匹配。
 
解决:时间切片含两端;用 `df['2020-01']`、`df['2020']` 这类日历粒度字符串。
