---
title: 1.8 时间序列处理
sidebar:
  order: 8
---
# 1.8 时间序列处理

第 5 章接触过日期时间列的 `.dt` 访问器，但真实的时间序列分析还要解决更多问题：如何生成连续的日期序列、如何把字符串高效转成时间戳、如何按时间段聚合数据、如何处理时区。Pandas 对时间序列有完整支持，包含 Timestamp、Period、Timedelta 三类时间对象以及一整套频率、偏移、重采样工具。本节系统讲解时间序列的核心内容。

## 1.8.1 日期范围生成

### pd.date_range()

`pd.date_range()` 生成连续的 DatetimeIndex，指定起止或长度：

```python
import pandas as pd

print(pd.date_range('2024-01-01', periods=5))
print(pd.date_range('2024-01-01', '2024-01-05'))
print(pd.date_range('2024-01-01', periods=5, freq='D'))
print(pd.date_range('2024-01-01', periods=3, freq='M'))   # 按月
```

`freq` 参数控制间隔，常用取值 `'D'`（天）、`'H'`（小时）、`'M'`（月末）、`'Y'`（年末）、`'W'`（周）。

### pd.bdate_range()

`pd.bdate_range()` 生成工作日（周一至周五）日期范围，跳过周末：

```python
print(pd.bdate_range('2024-01-01', periods=5))
```

### pd.period_range()

`pd.period_range()` 生成 PeriodIndex（时间段）：

```python
print(pd.period_range('2024-01', periods=3, freq='M'))
# PeriodIndex(['2024-01', '2024-02', '2024-03'], dtype='period[M]')
```

### pd.timedelta_range()

`pd.timedelta_range()` 生成 TimedeltaIndex（时间差范围）：

```python
print(pd.timedelta_range('1 day', periods=3, freq='D'))
# TimedeltaIndex(['1 days', '2 days', '3 days'])
```

## 1.8.2 时间戳

### pd.Timestamp

`pd.Timestamp` 表示单个时间点：

```python
ts = pd.Timestamp('2024-01-15 08:30:00')
print(ts)
print(ts.year, ts.month, ts.day)   # 2024 1 15
print(ts + pd.Timedelta(days=1))   # 时间运算
```

### pd.to_datetime()

`pd.to_datetime()` 把多种形式转成时间戳，前面已接触，这里补充参数：

```python
s = pd.Series(['2024-01-01', '2024/02/15', '20240103'])
print(pd.to_datetime(s))
print(pd.to_datetime(s, format='%Y%m%d', errors='coerce'))
```

`format` 指定解析格式可加速并避免歧义，`errors='coerce'` 把非法日期转成 NaT。

## 1.8.3 时间周期

### pd.Period 与 pd.PeriodIndex

`pd.Period` 表示一段固定长度的时间段：

```python
p = pd.Period('2024-03', freq='M')
print(p)            # 2024-03
print(p + 1)        # 2024-04
```

`pd.PeriodIndex` 是周期索引，`.to_period()` 把时间戳转成周期：

```python
ts = pd.to_datetime(['2024-01-15', '2024-03-20'])
print(ts.to_period('M'))
# PeriodIndex(['2024-01', '2024-03'], dtype='period[M]')
```

周期与时间戳的区别：时间戳是时刻，周期是区间。月度周期 `2024-03` 代表整个三月。

## 1.8.4 时间差

### pd.Timedelta 与 pd.to_timedelta()

`pd.Timedelta` 表示时间差，`pd.to_timedelta()` 把字符串转成时间差：

```python
td = pd.Timedelta('2 days 3 hours')
print(td)                 # 2 days 03:00:00
print(td.total_seconds()) # 秒数

s = pd.Series(['1 day', '2 hours'])
print(pd.to_timedelta(s))
```

时间戳相减得到 Timedelta，时间差参与日期运算：

```python
t1 = pd.Timestamp('2024-01-10')
t2 = pd.Timestamp('2024-01-15')
print(t2 - t1)   # 5 days
```

## 1.8.5 时间序列索引

DatetimeIndex、PeriodIndex、TimedeltaIndex 可以作为 DataFrame 的行索引，启用时间序列的整套能力：

```python
idx = pd.date_range('2024-01-01', periods=4, freq='D')
df = pd.DataFrame({'值': [10, 20, 15, 25]}, index=idx)
print(df)
print(df.index)   # DatetimeIndex
```

以时间索引后，可以按时间段切片、重采样、移位。

## 1.8.6 频率与偏移量

`freq` 描述时间序列的步长，底层由 `pd.offsets` 模块的偏移对象实现。常用偏移量：

```python
from pandas.tseries.offsets import (Day, Hour, Minute, Second,
                                    MonthEnd, MonthBegin, QuarterEnd,
                                    YearEnd, BusinessDay)

print(pd.Timestamp('2024-01-15') + Day(2))       # 加 2 天
print(pd.Timestamp('2024-01-15') + MonthEnd(1))  # 加到下一个月底
print(pd.Timestamp('2024-01-15') + BusinessDay(1))  # 加 1 个工作日
```

偏移量可以直接相加、组合，也可以作为 `freq` 参数传入 `date_range` 和 `resample`。`MonthEnd`、`QuarterEnd`、`YearEnd` 这类锚定偏移会跳到最近的周期末尾，第 21 章详细展开。

## 1.8.7 时间序列移位 .shift()

`.shift()` 把数据沿时间轴整体平移，`periods` 控制移动的步数：

```python
s = pd.Series([10, 20, 30], index=pd.date_range('2024-01-01', periods=3))
print(s.shift(1))     # 向后移 1 步，开头变 NaN
print(s.shift(-1))    # 向前移 1 步，末尾变 NaN
print(s.shift(1, freq='D'))   # 同时移动时间索引
```

`freq` 参数会同时移动索引时间，这在把数据对齐到新时间点时很有用。

## 1.8.8 时区处理

`.dt.tz_localize()` 设定时区，`.dt.tz_convert()` 转换时区：

```python
s = pd.to_datetime(['2024-01-01 08:00:00'])
s_utc = s.dt.tz_localize('UTC')
print(s_utc)
print(s_utc.dt.tz_convert('Asia/Shanghai'))
# 2024-01-01 16:00:00+08:00
```

`tz_localize` 给无时区的数据标注时区，`tz_convert` 在不同时区之间转换时刻（绝对时间不变）。整个索引的时区处理用 `df.index.tz_localize()`。

## 1.8.9 重采样 .resample()

`.resample()` 按频率聚合时间序列。降采样（高频转低频）时聚合，升采样（低频转高频）时填充：

```python
idx = pd.date_range('2024-01-01', periods=90, freq='D')
df = pd.DataFrame({'值': range(90)}, index=idx)

# 降采样：按周求均值
print(df.resample('W').mean())
# 降采样：按月求和
print(df.resample('M').sum())
# 降采样：按季度取最大值
print(df.resample('Q').max())
```

`on` 参数指定按某列重采样（该列需是时间类型），`level` 指定按索引层级重采样：

```python
df2 = pd.DataFrame({'日期': pd.date_range('2024-01-01', periods=30), '值': range(30)})
print(df2.resample('M', on='日期').sum())
```

升采样（如按天采样到按小时）会产生缺失，需要填充：

```python
daily = df.resample('D').sum()
hourly = daily.resample('h').ffill()   # 升采样后前向填充
```

## 1.8.10 移动平均与差分

### 移动平均

滚动窗口计算移动平均是时间序列平滑的常用手段：

```python
df['移动平均'] = df['值'].rolling(7).mean()
```

### 差分 .diff()

`.diff()` 计算相邻时间点的差值，用于去除趋势：

```python
print(df['值'].diff())
print(df['值'].diff(2))   # 相隔 2 个时间点的差值
```

## 1.8.11 时间序列对齐

时间序列之间运算时按时间索引自动对齐，两侧时间标签不匹配的部分得到 NaN：

```python
s1 = pd.Series([1, 2], index=pd.to_datetime(['2024-01-01', '2024-01-02']))
s2 = pd.Series([10, 20], index=pd.to_datetime(['2024-01-02', '2024-01-03']))
print(s1 + s2)
# 2024-01-01     NaN
# 2024-01-02    22.0
# 2024-01-03     NaN
```

## 练习题

### 第1题 概念理解

说明 `pd.Timestamp`、`pd.Period`、`pd.Timedelta` 三者的区别；说明降采样与升采样的区别。

::: details 参考答案

`pd.Timestamp` 是时刻，`pd.Period` 是一段时间区间，`pd.Timedelta` 是时间差。降采样从高频聚合到低频（按周、月、季汇总），升采样从低频扩展到高频（需要填充缺失）。
:::

### 第2题 代码编写

用 `pd.date_range` 生成 2024 年每天的时间索引；构造 DataFrame 后用 `.resample('M')` 按月求和；用 `.shift(1)` 生成滞后一列；用 `.diff()` 计算逐日差值。

::: details 参考答案

```python
import pandas as pd

idx = pd.date_range('2024-01-01', '2024-12-31', freq='D')
df = pd.DataFrame({'值': range(1, 367)}, index=idx)
print(df.resample('M').sum())
df['滞后'] = df['值'].shift(1)
df['差分'] = df['值'].diff()
print(df.head())
```

:::

### 第3题 进阶练习

把字符串日期列转成 datetime 并设为索引；用 `.to_period('M')` 生成月份周期；用 `pd.bdate_range` 生成工作日序列并与完整日期序列对比长度；对时间序列用 `.rolling(7).mean()` 计算周移动平均。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'日期': ['2024-01-01', '2024-01-08'], '值': [5, 10]})
df['日期'] = pd.to_datetime(df['日期'])
df = df.set_index('日期')
print(df.index.to_period('M'))

bdays = pd.bdate_range('2024-01-01', '2024-01-31')
print(len(bdays))   # 少于 31

s = pd.Series(range(30), index=pd.date_range('2024-01-01', periods=30))
print(s.rolling(7).mean())
```

:::

## 常见错误

**错误 1 · 时间列还是字符串时直接重采样报 `TypeError`**

原因:`.resample()` 要求索引或 `on` 指定的列是时间类型,字符串列无法重采样。

解决:先用 `pd.to_datetime()` 转类型,并确认索引是 DatetimeIndex。

**错误 2 · 重采样结果的时间标签与预期不符**

原因:`resample` 默认标签对齐方式与 `closed`/`label` 参数有关,例如 `'M'` 落在月末。

解决:用 `label='left'`/`label='right'` 调整标签位置,用 `closed` 调整区间端点。

**错误 3 · 升采样后全是 NaN**

原因:低频数据升采样到高频,中间位置没有值,默认产生 NaN。

解决:接上 `.ffill()`、`.bfill()` 或 `.interpolate()` 填充。

**错误 4 · `.shift()` 后第一行出现 NaN**

原因:移位后开头没有可用的前值,自然产生缺失。

解决:这是正常行为,后续用 `fillna` 处理,或设置 `fill_value` 参数。
