---
title: 1.11 网格与辅助线
sidebar:
  order: 11
---
# 1.11 网格与辅助线

读图时最常问的问题是数据点大致落在什么数值附近。坐标轴刻度给出了参照，但视线要在刻度与数据之间来回移动，既不精确也费眼。给绘图区域加上网格线，让坐标范围一目了然，是提高可读性最经济的办法。医学研究里常用的均值线、参考阈值线、置信区间带，则是另一种辅助元素：它们强调某个数值位置或某个取值范围，帮助读者快速判断数据落在哪里。本节讲解网格线与参考线的设置方法，并给出标注均值线与置信区间的完整示例。

## 1.11.1 网格线 plt.grid()

`plt.grid()` 是 pyplot 风格的网格开关。它的关键参数有两个：`visible` 控制是否显示，`which` 控制显示哪种刻度位置的网格：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.grid(visible=True)          # 打开默认网格
plt.show()
```

`visible=True` 打开网格，`visible=False` 关闭网格。只写 `plt.grid()` 等同于 `plt.grid(True)`。

`which` 决定网格画在哪种刻度上，取值有三种：`'major'` 只画主刻度网格，是默认值；`'minor'` 只画次刻度网格，此时必须先启用次刻度，否则看不到效果；`'both'` 同时画两种。启用次刻度需要设置 `locator`：

```python
from matplotlib.ticker import MultipleLocator

plt.plot(x, y)
# 先设置次刻度位置，间隔 0.25
plt.gca().xaxis.set_minor_locator(MultipleLocator(0.25))
plt.gca().yaxis.set_minor_locator(MultipleLocator(0.1))
# 主网格实线，次网格细虚线
plt.grid(True, which='major', linestyle='-', alpha=0.6)
plt.grid(True, which='minor', linestyle=':', alpha=0.3)
plt.show()
```

主网格和次网格分开调用，用不同线型与透明度区分层级，主网格醒目、次网格弱化，既看清细节又不干扰主体。

## 1.11.2 面向对象的 ax.grid()

使用面向对象接口时，调用坐标轴的 `ax.grid()`，效果与 `plt.grid()` 完全一致。参数 `axis` 控制网格作用于哪个方向，取值有 `'both'`（默认，两个方向都画）、`'x'`（只画竖直网格线）、`'y'`（只画水平网格线）：

```python
fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(x, y)

# 只画横向网格，虚线，低透明度
ax.grid(True, axis='y', linestyle='--', color='gray', alpha=0.5)
plt.show()
```

`ax.grid()` 的常用样式参数还有 `linestyle`（线型，如 `'-'`、`'--'`、`':'`）、`color`（颜色）、`alpha`（透明度，0 到 1）。透明度与浅色线配合，能让网格线退到数据后面，避免喧宾夺主。

## 1.11.3 参考线 ax.axhline() 与 ax.axvline()

网格线给出整套刻度参照，而参考线只在特定数值位置画一条线，适合标注阈值或关键值。`ax.axhline()` 画水平线，`ax.axvline()` 画竖直线：

```python
fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(x, y)

# 在 y=0 处画水平参考线，红色虚线
ax.axhline(y=0, color='red', linestyle='--', linewidth=1.2)
# 在 x=5 处画竖直参考线
ax.axvline(x=5, color='green', linestyle=':', linewidth=1.2)
plt.show()
```

`axhline` 只要求给出 `y` 值，线自动横向贯穿整个绘图区域，无需指定起止坐标。它支持所有通用线样式参数：`color`、`linestyle`、`linewidth`、`alpha`、`label`（用于图例）。给参考线加上 `label` 后调用 `ax.legend()`，参考线会出现在图例中：

```python
fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(x, y, label='正弦曲线')
ax.axhline(y=0, color='red', linestyle='--', label='零基线')
ax.legend()
plt.show()
```

## 1.11.4 参考矩形 ax.axhspan() 与 ax.axvspan()

参考线只能标注单个数值，标注一个取值范围则需要参考矩形。`ax.axhspan(ymin, ymax)` 画水平方向的半透明色带，`ax.axvspan(xmin, xmax)` 画竖直方向的色带。色带在**最底层**绘制，不会遮挡数据：

```python
fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(x, y)

# 标注 y 在 -0.5 到 0.5 之间的区域
ax.axhspan(ymin=-0.5, ymax=0.5, color='gray', alpha=0.2)
# 标注 x 在 2 到 4 之间的区域
ax.axvspan(xmin=2, xmax=4, color='blue', alpha=0.15)
plt.show()
```

`axhspan` 与 `axvspan` 常用于标记参考区间、感兴趣的时间段、异常值范围。它们支持 `color`、`alpha`、`facecolor`、`edgecolor` 等面片样式参数。因为色带先于数据绘制，透明度稍低即可在保留参照作用的同时不盖住曲线。

## 1.11.5 实例：标注均值线与置信区间

把参考元素组合起来，可以在图上同时呈现均值位置与置信区间，这是医学统计图中常见的标注方式。下面以一组模拟的舒张压测量值为例：

```python
import numpy as np
import matplotlib.pyplot as plt

# 模拟 30 名受试者的舒张压数据（mmHg）
rng = np.random.default_rng(42)
data = rng.normal(loc=78, scale=6, size=30)

mean = data.mean()                       # 样本均值
sem = data.std(ddof=1) / np.sqrt(len(data))   # 标准误
ci_low, ci_high = mean - 1.96 * sem, mean + 1.96 * sem   # 95% 置信区间

fig, ax = plt.subplots(figsize=(8, 5))
# 散点展示每个受试者
ax.scatter(range(len(data)), data, s=30, alpha=0.6, label='测量值')

# 均值参考线
ax.axhline(mean, color='red', linestyle='--', linewidth=1.5, label=f'均值 {mean:.1f}')
# 置信区间色带
ax.axhspan(ci_low, ci_high, color='red', alpha=0.15, label='95% 置信区间')

ax.set_xlabel('受试者编号')
ax.set_ylabel('舒张压（mmHg）')
ax.legend()
ax.grid(True, axis='y', linestyle=':', alpha=0.4)
plt.show()
```

示例先用正态分布模拟 30 个舒张压值，再用 `mean()` 求均值、用标准误乘 1.96 得到 95% 置信区间。均值用红色虚线标注，置信区间用半透明色带标注，读者一眼就能看出测量值主体落在哪个范围。医学论文中常把参考阈值（如高血压 90 mmHg）画成 `axhline`，把正常范围画成 `axhspan`，本节方法可直接套用。

## 练习题

### 第1题 概念理解

说明 `plt.grid()` 中 `which` 与 `axis` 两个参数各自控制什么；说明 `axhline` 与 `axhspan` 的区别；说明为什么参考色带通常设置较低的 `alpha`。

::: details 参考答案

`which` 控制网格画在主刻度（`'major'`）、次刻度（`'minor'`）还是两者（`'both'`）；`axis` 控制网格方向，`'x'` 画竖直网格，`'y'` 画水平网格，`'both'` 两个方向都画。`axhline` 在单个 `y` 值画一条水平线，`axhspan` 在 `ymin` 到 `ymax` 之间画一个水平色带。参考色带设置在数据底层，低透明度可以在保留参照作用的同时不遮挡曲线。
:::

### 第2题 代码编写

用 `np.random.default_rng(7).normal(70, 5, 40)` 生成 40 个收缩压数据并绘制散点图，标注均值虚线、上下 5 个百分点位点线、以及均值的 95% 置信区间色带，开启横向网格。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(7)
data = rng.normal(70, 5, 40)
mean = data.mean()
sem = data.std(ddof=1) / np.sqrt(len(data))
ci_low, ci_high = mean - 1.96 * sem, mean + 1.96 * sem

fig, ax = plt.subplots(figsize=(8, 5))
ax.scatter(range(len(data)), data, alpha=0.6, label='测量值')
ax.axhline(mean, color='red', linestyle='--', label=f'均值 {mean:.1f}')
ax.axhspan(ci_low, ci_high, color='red', alpha=0.15, label='95% 置信区间')
ax.set_xlabel('受试者编号')
ax.set_ylabel('收缩压（mmHg）')
ax.legend()
ax.grid(True, axis='y', linestyle=':', alpha=0.4)
plt.show()
```

:::

### 第3题 进阶练习

绘制 `y = exp(-x/3) * cos(2x)` 在 `x ∈ [0, 10]` 的曲线，开启次刻度网格（主网格实线、次网格虚线），标注 `y=0` 参考线与 `x ∈ [3, 6]` 的竖直色带，并为参考线配置图例。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

x = np.linspace(0, 10, 300)
y = np.exp(-x / 3) * np.cos(2 * x)

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y, label='y = exp(-x/3)·cos(2x)')

# 开启主、次刻度
ax.xaxis.set_minor_locator(MultipleLocator(0.25))
ax.yaxis.set_minor_locator(MultipleLocator(0.1))
ax.grid(True, which='major', linestyle='-', alpha=0.5)
ax.grid(True, which='minor', linestyle=':', alpha=0.25)

ax.axhline(0, color='red', linestyle='--', label='y = 0')
ax.axvspan(3, 6, color='blue', alpha=0.15, label='关注区间')
ax.legend()
plt.show()
```

:::

## 常见错误

**错误 1 · 调用了 `plt.grid(True, which='minor')` 却看不到次网格**

原因:没有设置次刻度位置，坐标轴默认只有主刻度，次刻度网格没有可依附的位置。

解决:先用 `ax.xaxis.set_minor_locator(MultipleLocator(...))` 之类的定位器开启次刻度，再画次网格。

**错误 2 · 网格线盖住曲线，图很杂乱**

原因:网格用默认实线、默认透明度，视觉权重与数据线相当。

解决:用 `axis='y'` 减少方向，用 `linestyle='--'` 或 `':'` 与 `alpha=0.3` 降低视觉权重。

**错误 3 · 参考色带完全遮住后面的曲线**

原因:`axhspan` 的 `alpha` 设成接近 1，色带不透明。

解决:把 `alpha` 降到 0.1 到 0.25 之间，保留参照作用的同时透出数据。

**错误 4 · 参考线没有出现在图例中**

原因:调用 `axhline` 时没有传 `label` 参数，或忘记调用 `ax.legend()`。

解决:给参考线加 `label='...'`，画完全部元素后调用一次 `ax.legend()`。
