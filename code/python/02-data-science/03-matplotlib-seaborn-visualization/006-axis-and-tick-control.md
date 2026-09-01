---
title: 1.6 坐标轴与刻度控制
sidebar:
  order: 6
---
# 1.6 坐标轴与刻度控制

默认的坐标轴范围由数据自动推算，刻度位置与刻度标签也由 Matplotlib 自动安排。自动结果在多数场景够用，但医学报告、论文配图往往需要精确控制坐标轴范围、对数缩放、刻度密度与刻度标签格式，例如把横坐标固定在 0 到 100、把纵坐标改成对数刻度、把刻度值显示为百分比。本节讲解坐标轴范围、缩放、刻度定位器、刻度格式化器、刻度显隐、次要刻度与双轴共享的完整控制方法。

## 1.6.1 坐标轴范围控制

坐标轴范围决定图形展示的数据区间。`ax.set_xlim()` 设置横轴范围，`ax.set_ylim()` 设置纵轴范围，两者都接收包含两个数值的元组或列表：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 200)
y = np.sin(x)

fig, ax = plt.subplots()
ax.plot(x, y)
ax.set_xlim(0, 8)      # 横轴范围固定为 0 到 8
ax.set_ylim(-1.5, 1.5) # 纵轴范围固定为 -1.5 到 1.5
plt.show()
```

`set_xlim()` 还可以接收关键字参数：`left` 与 `right` 指定横轴两个端点，`bottom` 与 `top` 指定纵轴两个端点，`auto=True` 表示允许自动调整范围。反向坐标轴（例如医学影像中从上到下的坐标方向）通过传入较大的左端点、较小的右端点实现：

```python
ax.set_xlim(8, 0)   # 反向横轴
ax.set_ylim(1.5, -1.5)  # 反向纵轴
```

`ax.axis()` 是同时控制横轴与纵轴的快捷方式。传入包含四个数值的列表或元组，格式为 `[xmin, xmax, ymin, ymax]`：

```python
ax.axis([0, 6, -2, 2])   # 同时设置横轴 0 到 6、纵轴 -2 到 2
```

`ax.axis()` 传入字符串可以切换常用模式：`'on'` 显示坐标轴，`'off'` 完全隐藏坐标轴，`'equal'` 让横纵轴单位长度相等，`'scaled'` 按数据比例缩放，`'tight'` 让坐标范围紧贴数据，`'auto'` 恢复自动范围，`'image'` 用于图像显示。其中 `'tight'` 在需要去掉多余空白时很常用：

```python
ax.axis('tight')   # 坐标范围紧贴数据最小外接框
ax.axis('off')     # 隐藏整组坐标轴
```

`ax.autoscale()` 恢复自动计算坐标范围，参数 `enable=True` 开启自动缩放，`axis='both'` 指定作用于哪个方向（`'x'`、`'y'`、`'both'`）。每次 `plot()` 绘图后自动缩放会依据新数据重新生效，因此手动设置范围后再调用 `autoscale()` 会覆盖手动值：

```python
ax.autoscale()          # 开启横纵轴自动缩放
ax.autoscale(enable=True, axis='x')   # 只对横轴开启
```

设置坐标范围后若数据点落在范围之外，Matplotlib 不会报错，只显示范围内的部分。需要同时查看边界外的数据时，配合 `ax.margins()` 或 `ax.autoscale_view()` 调整留白。

## 1.6.2 坐标轴缩放与对数刻度

`ax.set_xscale()` 与 `ax.set_yscale()` 设置坐标轴的缩放类型，常见取值有 `'linear'`、`'log'`、`'symlog'`、`'logit'`。默认是 `'linear'` 线性缩放：

```python
x = np.linspace(0.1, 10, 100)
y = x ** 2

fig, ax = plt.subplots()
ax.plot(x, y)
ax.set_yscale('log')   # 纵轴改为对数刻度，压缩大数值差异
plt.show()
```

各取值的作用：

| 取值 | 作用 |
| --- | --- |
| `'linear'` | 线性刻度，刻度间距相等，是默认模式 |
| `'log'` | 对数刻度，刻度按数量级排列，适合跨度很大的正数数据 |
| `'symlog'` | 对称对数刻度，0 附近仍线性、远离 0 用对数，可含负值 |
| `'logit'` | logit 刻度，用于 0 到 1 之间、两端密集的概率数据 |

对数刻度下数据的数量级差异被压缩，例如数值从 1 到 10000 跨越四个数量级时，线性坐标几乎看不出小值，对数坐标则能同时看清全部变化：

```python
x = np.linspace(0.01, 100, 1000)
y = np.exp(x * 0.05)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.plot(x, y)          # 线性刻度，小值区域被压扁
ax2.plot(x, y)
ax2.set_yscale('log')   # 对数刻度，整体趋势清晰
plt.show()
```

`'symlog'` 需要处理数据中包含 0 或负值的情况。默认阈值参数 `linthresh=2` 表示绝对值小于 2 的区间用线性刻度，超出部分用对数刻度：

```python
y = np.linspace(-1000, 1000, 500)
ax.set_yscale('symlog', linthresh=2)   # 0 附近线性，两侧对数
```

对数坐标下 `set_ylim()` 的端点按对数尺度理解，例如范围从 10 到 10000 时端点仍是 10 和 10000，不必写对数结果。另外，对数刻度会自动使用幂次刻度标签（如 10^0、10^1、10^2）。

## 1.6.3 刻度定位器 Locator

刻度定位器决定刻度线画在哪些位置。每个坐标轴对象都有主刻度轴 `ax.xaxis` 与 `ax.yaxis`，通过 `set_major_locator()` 设置主刻度定位器、`set_minor_locator()` 设置次要刻度定位器：

```python
from matplotlib.ticker import MultipleLocator, MaxNLocator, LinearLocator

ax.xaxis.set_major_locator(MultipleLocator(2))   # 每 2 个单位一个主刻度
ax.xaxis.set_minor_locator(MultipleLocator(0.5)) # 每 0.5 个单位一个次刻度
```

常用定位器及适用场景：

| 定位器 | 作用与适用场景 |
| --- | --- |
| `MultipleLocator(step)` | 每隔固定间隔 step 放一个刻度，刻度位置规则，用于固定步长的数据 |
| `MaxNLocator(n)` | 自动挑选最多 n 个美观刻度，刻度数可控，用于常规数据 |
| `LinearLocator(n)` | 在坐标范围内均匀放置 n 个刻度（含端点），用于等分区间 |
| `LogLocator(base=10)` | 按数量级放置对数刻度，用于对数坐标轴 |
| `AutoLocator` | 默认自动定位器，根据数据范围挑选美观刻度 |
| `DateLocator` | 按日期间隔放置刻度，用于时间序列 |
| `HourLocator` / `MinuteLocator` | 按小时、分钟间隔放置刻度，用于高频时间数据 |
| `MonthLocator` / `YearLocator` | 按月份、年份放置刻度，用于长期时间数据 |
| `IndexLocator(base, offset)` | 按索引间隔放置刻度，用于横轴为序号的数据 |
| `FixedLocator(ticks)` | 把刻度固定在一组指定的位置，用于自定义刻度集合 |
| `NullLocator` | 不生成任何刻度，用于隐藏刻度线 |

`MultipleLocator` 与 `MaxNLocator` 是最常用的两个。前者保证刻度严格等距，适合病理分级、评分等整数值数据；后者自动权衡刻度数量与美观性，适合数据范围未知的情况：

```python
fig, ax = plt.subplots()
ax.plot(x, y)
ax.xaxis.set_major_locator(MultipleLocator(1))   # 每个整数一个刻度
ax.yaxis.set_major_locator(MaxNLocator(6))       # 纵轴最多 6 个刻度
```

`LinearLocator` 在需要把坐标范围等分成固定份数时使用，例如分成 5 段：

```python
ax.xaxis.set_major_locator(LinearLocator(6))   # 在范围内放 6 个等距刻度
```

时间刻度定位器需要配合 datetime 数据使用。`DateLocator` 自动选择合理的日期间隔，`MonthLocator(interval=3)` 每 3 个月一个刻度，`YearLocator(base=5)` 每 5 年一个刻度：

```python
import datetime
from matplotlib.dates import DateFormatter, MonthLocator, YearLocator

dates = [datetime.date(2020, 1, 1) + datetime.timedelta(days=i * 30) for i in range(60)]
values = np.cumsum(np.random.randn(60))

fig, ax = plt.subplots()
ax.plot(dates, values)
ax.xaxis.set_major_locator(YearLocator(base=1))      # 每年一个主刻度
ax.xaxis.set_minor_locator(MonthLocator(interval=3)) # 每 3 个月一个次刻度
ax.xaxis.set_major_formatter(DateFormatter('%Y-%m-%d'))  # 刻度标签格式
plt.show()
```

`IndexLocator` 适合横轴为数据索引的情况。`FixedLocator` 把刻度固定在指定数值，`NullLocator` 隐藏某方向刻度：

```python
from matplotlib.ticker import FixedLocator, NullLocator

ax.xaxis.set_major_locator(FixedLocator([0, 2, 5, 8]))  # 只在这几个位置画刻度
ax.yaxis.set_major_locator(NullLocator())               # 隐藏纵轴刻度线
```

## 1.6.4 刻度格式化器 Formatter

刻度格式化器决定刻度线旁的标签显示成什么文字。通过 `set_major_formatter()` 设置主刻度格式化器、`set_minor_formatter()` 设置次要刻度格式化器：

```python
from matplotlib.ticker import StrMethodFormatter, ScalarFormatter, FuncFormatter

ax.xaxis.set_major_formatter(StrMethodFormatter('{x:.1f}'))
```

常用格式化器及作用：

| 格式化器 | 作用与适用场景 |
| --- | --- |
| `StrMethodFormatter` | 用格式化字符串控制标签，写法灵活，最常用 |
| `FuncFormatter` | 用自定义函数生成标签，适合任意格式 |
| `FormatStrFormatter` | 用 `%` 风格字符串格式化标签，旧接口 |
| `ScalarFormatter` | 默认科学计数法格式化器，控制小数位 |
| `PercentFormatter` | 把数值显示为百分比，适合占比数据 |
| `EngFormatter` | 工程计数法，自动加 k、M、G 等单位前缀 |
| `DateFormatter` | 格式化日期刻度标签，配合时间定位器 |
| `LogFormatter` | 对数坐标的默认格式化器，显示幂次 |
| `LogFormatterSciNotation` | 对数坐标用科学计数法显示幂次 |
| `NullFormatter` | 不显示任何刻度标签 |

`StrMethodFormatter('{x:.2f}')` 中的 `{x}` 代表刻度值，`:...` 部分使用 Python 格式化语法。`FuncFormatter` 接收一个函数，函数入参是刻度值与位置，返回字符串：

```python
from matplotlib.ticker import FuncFormatter

def fmt(x, pos):
    return f'{x * 100:.0f}%'

ax.yaxis.set_major_formatter(FuncFormatter(fmt))   # 显示为百分比
```

`PercentFormatter(xmax=1.0)` 适合数据本身是 0 到 1 的小数：`xmax=1.0` 表示 0.5 显示为 50%，`xmax=100` 表示 50 显示为 50%：

```python
from matplotlib.ticker import PercentFormatter

ax.yaxis.set_major_formatter(PercentFormatter(xmax=1.0))  # 0.5 -> 50%
```

`EngFormatter` 把 1000 显示为 1k、1000000 显示为 1M，适合工程量级的数据；`DateFormatter` 与时间定位器配合，格式串与 `strftime` 一致，`%Y` 年、`%m` 月、`%d` 日、`%H` 时、`%M` 分：

```python
from matplotlib.ticker import EngFormatter

ax.yaxis.set_major_formatter(EngFormatter())   # 1200 -> 1.2k
```

`ScalarFormatter` 通过 `set_scientific(False)` 关闭科学计数法，通过 `set_useOffset(False)` 去掉偏移量（offset 是坐标轴右上角的加数）。大数值默认会启用科学计数法，医学数据中常需关闭：

```python
ax.xaxis.set_major_formatter(ScalarFormatter(useOffset=False))
ax.xaxis.get_major_formatter().set_scientific(False)   # 不显示科学计数法
```

`NullFormatter` 隐藏某方向的刻度标签，常用于只保留纵轴标签的对比图。

## 1.6.5 刻度显隐与旋转

`ax.tick_params()` 统一控制刻度线的显示与标签样式。其关键字以 `top`、`bottom`、`left`、`right` 指定坐标轴四个边，`label*` 控制对应边的标签：

| 参数 | 作用 |
| --- | --- |
| `top` / `bottom` / `left` / `right` | 是否显示对应边的刻度线 |
| `labeltop` / `labelbottom` / `labelleft` / `labelright` | 是否显示对应边的刻度标签 |
| `labelsize` | 刻度标签字号 |
| `labelcolor` | 刻度标签颜色 |
| `length` | 刻度线长度 |
| `width` | 刻度线粗细 |
| `colors` | 刻度线与标签的颜色 |
| `direction` | 刻度线朝向，`'in'` 向内、`'out'` 向外、`'inout'` 双向 |

典型用法是隐藏顶部与右侧刻度线：

```python
ax.tick_params(top=False, right=False)        # 去掉顶部与右侧刻度线
ax.tick_params(labelleft=False)               # 隐藏左侧刻度标签
ax.tick_params(labelsize=10, length=4, width=1)  # 调整字号与刻度线样式
ax.tick_params(axis='x', rotation=45)         # 横轴标签旋转 45 度
```

`axis` 参数指定作用于哪条轴，取值 `'x'`、`'y'`、`'both'`。刻度标签旋转也可以用 `plt.xticks(rotation=...)` 与 `ax.set_xticklabels(rotation=...)` 实现：

```python
plt.xticks(rotation=45)          # 旋转横轴刻度标签
plt.yticks(rotation=0)           # 纵轴不旋转
```

```python
ax.set_xticks([0, 1, 2, 3, 4])
ax.set_xticklabels(['零', '一', '二', '三', '四'], rotation=30)  # 自定义标签并旋转
```

`plt.xticks()` 与 `ax.set_xticks()` 的区别在于：`plt.xticks()` 操作当前活动坐标轴，返回当前刻度位置与标签对象；`ax.set_xticks()` 只操作指定坐标轴，多子图时更安全。`ax.set_xticklabels()` 必须与 `ax.set_xticks()` 配合，且参数长度要与刻度数量一致，否则报错。

## 1.6.6 次要刻度与双轴

次要刻度（minor ticks）是主刻度之间更细的刻度线，标签通常不显示，用于增强刻度密度。`ax.minorticks_on()` 开启、`ax.minorticks_off()` 关闭：

```python
fig, ax = plt.subplots()
ax.plot(x, y)
ax.minorticks_on()     # 开启次要刻度
ax.tick_params(which='minor', length=2, color='gray')   # 次要刻度线样式
ax.minorticks_off()    # 关闭次要刻度
```

`tick_params(which=...)` 的 `which` 参数取 `'major'`（主刻度）、`'minor'`（次要刻度）或 `'both'`。对数坐标下次要刻度自动出现在各数量级之间，开启即可看到密集的细分刻度。

双轴共享指同一图形上叠加两个不同量纲的数据，左侧纵轴与右侧纵轴各用一套刻度。`ax.secondary_yaxis()` 在右侧生成第二个纵轴，`ax.secondary_xaxis()` 在顶部生成第二个横轴：

```python
fig, ax = plt.subplots()

# 主纵轴画体温
x = np.linspace(0, 24, 100)
temp = 36.5 + 0.8 * np.sin(x / 24 * 2 * np.pi)
ax.plot(x, temp, color='red', label='体温')
ax.set_xlabel('时间（小时）')
ax.set_ylabel('体温（℃）')

# 副纵轴画心率，把温度映射到心率区间
ax2 = ax.secondary_yaxis('right')
heart = 70 + 15 * np.sin(x / 24 * 2 * np.pi + 0.5)
ax2.plot(x, heart, color='blue', label='心率')
ax2.set_ylabel('心率（次/分）')
plt.show()
```

`secondary_xaxis(location)` 的参数 `location` 指定副轴位置，可以是 `'top'`、`'bottom'` 或数据值。更常见的双轴做法是直接 `twinx()` 创建共享横轴的第二个坐标轴：

```python
ax2 = ax.twinx()          # 共享横轴、独立纵轴的第二个坐标轴
ax2.plot(x, heart, color='blue')
ax2.set_ylabel('心率（次/分）')
```

`secondary_yaxis` 与 `twinx` 的差别：`secondary_yaxis` 生成的副轴与主坐标轴共享刻度变换，常用于单位换算（如摄氏与华氏）；`twinx` 生成完全独立的坐标轴，两轴各自自动缩放，用于量纲不同的两组数据。单位换算场景用 `secondary_yaxis` 并传入 `functions` 参数进行线性变换：

```python
ax2 = ax.secondary_yaxis('right',
                         functions=(lambda c: c * 9 / 5 + 32,   # 摄氏转华氏
                                    lambda f: (f - 32) * 5 / 9))  # 华氏转摄氏
ax2.set_ylabel('华氏度（°F）')
```

`functions` 参数接收两个函数，第一个把主坐标值映射到副坐标，第二个反向映射，一一对应才能正确换算。

## 练习题

### 第1题 概念理解

说明 `set_xlim` 与 `autoscale` 的关系；说明 `MultipleLocator`、`MaxNLocator`、`FixedLocator` 各自的适用场景；说明 `'linear'`、`'log'`、`'symlog'` 三种刻度的区别。

::: details 参考答案

`set_xlim` 手动固定范围，`autoscale` 按数据自动推算，手动设置后调用 `autoscale` 会覆盖手动值。`MultipleLocator` 用于固定步长、刻度等距；`MaxNLocator` 用于自动挑选美观刻度；`FixedLocator` 用于把刻度固定在指定位置。`'linear'` 线性刻度间距相等；`'log'` 对数刻度按数量级排列、只接受正数；`'symlog'` 在 0 附近线性、远离 0 用对数，可含负值。
:::

### 第2题 代码编写

绘制 y = x^2 曲线，把横轴范围设为 0 到 10、纵轴范围设为 0 到 100；横轴主刻度每 1 个单位一个，纵轴主刻度最多 6 个；纵轴刻度标签显示为整数；隐藏顶部与右侧刻度线。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import MultipleLocator, MaxNLocator, ScalarFormatter

x = np.linspace(0, 10, 200)
y = x ** 2

fig, ax = plt.subplots()
ax.plot(x, y)
ax.set_xlim(0, 10)
ax.set_ylim(0, 100)
ax.xaxis.set_major_locator(MultipleLocator(1))
ax.yaxis.set_major_locator(MaxNLocator(6))
ax.xaxis.set_major_formatter(ScalarFormatter(useOffset=False))
ax.yaxis.get_major_formatter().set_scientific(False)
ax.tick_params(top=False, right=False)
plt.show()
```

:::

### 第3题 进阶练习

生成一段随时间增长的模拟数据，横轴使用日期刻度：主刻度每年一个、次刻度每季度一个，标签格式为 `%Y-%m-%d` 并旋转 45 度；再在右侧添加第二个纵轴，把同样的数据以百分比形式显示（使用 `PercentFormatter`）。

::: details 参考答案

```python
import datetime
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.dates import YearLocator, MonthLocator, DateFormatter
from matplotlib.ticker import PercentFormatter

dates = [datetime.date(2020, 1, 1) + datetime.timedelta(days=i * 30) for i in range(60)]
values = np.cumsum(np.random.randn(60)) + 100

fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(dates, values)
ax.xaxis.set_major_locator(YearLocator(base=1))
ax.xaxis.set_minor_locator(MonthLocator(interval=3))
ax.xaxis.set_major_formatter(DateFormatter('%Y-%m-%d'))
plt.xticks(rotation=45)

ax2 = ax.secondary_yaxis('right', functions=(lambda v: v / 200 * 100,
                                             lambda p: p / 100 * 200))
ax2.set_ylabel('百分比')
ax2.yaxis.set_major_formatter(PercentFormatter())
plt.show()
```

:::

## 常见错误

**错误 1 · 设置对数刻度后数据含 0 或负值，坐标轴空白或报 `ValueError`**

原因:`'log'` 刻度要求数据全部为正，0 与负数无法取对数。

解决:改用 `'symlog'` 刻度处理含 0 或负值的数据，或先过滤非正数据。

**错误 2 · `set_xticklabels` 与 `set_xticks` 数量不一致报错**

原因:`set_xticklabels` 要求标签数量与刻度数量一致。

解决:先 `ax.set_xticks()` 指定刻度位置，再传入等长的标签列表。

**错误 3 · 自定义刻度标签后图形轴范围变化或标签位置错乱**

原因:`set_xticklabels` 只改文字，若未先 `set_xticks` 指定位置，Matplotlib 会沿用当前刻度，改动标签数量导致错位。

解决:先 `ax.set_xticks()` 固定刻度位置，再 `ax.set_xticklabels()` 指定等长标签。

**错误 4 · 设置范围后图仍有大片空白或数据被裁切**

原因:手动 `set_xlim` 后自动缩放被关闭，范围与数据不匹配。

解决:改用 `ax.margins()` 控制留白，或调用 `ax.autoscale()` 重新按数据推算。

**错误 5 · 日期坐标轴刻度挤成一团、标签重叠**

原因:日期范围跨度大而刻度过密，或未指定格式化器。

解决:用 `YearLocator`、`MonthLocator` 等时间定位器控制密度，用 `DateFormatter` 控制格式，必要时 `plt.xticks(rotation=45)` 旋转标签。
