---
title: 1.7 脊柱与边框控制
sidebar:
  order: 7
---
# 1.7 脊柱与边框控制

默认绘图框四周各有一条边框，Matplotlib 称这些边框为脊柱（spines）。默认的上下左右四条脊柱围成一个封闭矩形，把绘图区框起来。期刊配图和教科书插图常需要打破这种默认样式：去掉顶部与右侧边框、让坐标轴穿过原点、把刻度线向外延伸。这些操作都围绕脊柱对象展开。本节讲解脊柱的定位、颜色、线宽、显隐以及经典十字坐标轴的绘制方法。

## 1.7.1 脊柱对象

每个坐标轴对象 `ax` 都有 `ax.spines` 属性，它是一个字典，键为 `'top'`、`'bottom'`、`'left'`、`'right'`，对应四条边框，值为对应的脊柱对象：

```python
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots()
print(ax.spines.keys())   # odict_keys(['left', 'bottom', 'right', 'top'])
```

`ax.spines['top']` 取到顶部脊柱，其他三条类似。脊柱对象本质上是一条线对象，因此可以调用 `set_color()`、`set_linewidth()`、`set_visible()`、`set_position()` 等方法。脊柱是绘图区的边界，与刻度线不同：刻度线位于脊柱上，`tick_params` 控制刻度，`spines` 控制边界本身。

四条脊柱的默认外观受 rcParams 控制，其中 `axes.spines.left`、`axes.spines.bottom`、`axes.spines.top`、`axes.spines.right` 分别控制四条脊柱是否可见，默认都是 `True`：

```python
print(plt.rcParams['axes.spines.top'])    # True
print(plt.rcParams['axes.spines.right'])  # True
```

通过 `ax.spines[...]` 可以访问任意一条脊柱并修改它的属性，这是逐条控制边框的基础。

## 1.7.2 脊柱的颜色与线宽

`spine.set_color()` 设置脊柱颜色，`spine.set_linewidth()` 设置线宽，参数与绘图线的颜色、线宽规则一致：

```python
fig, ax = plt.subplots()
ax.plot([0, 1, 2], [0, 1, 4])

# 底部脊柱加粗并改成深色
ax.spines['bottom'].set_color('black')
ax.spines['bottom'].set_linewidth(2)

# 左侧脊柱改成灰色细线
ax.spines['left'].set_color('gray')
ax.spines['left'].set_linewidth(1)

# 顶部与右侧脊柱隐藏
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
plt.show()
```

多条脊柱要批量修改时，可以循环遍历：

```python
for spine in ['top', 'right', 'bottom', 'left']:
    ax.spines[spine].set_linewidth(1.5)
```

颜色支持英文名称、十六进制、RGB 元组等所有 Matplotlib 颜色写法，`set_color(None)` 会把脊柱设为透明，等效于隐藏但保留占位。

## 1.7.3 脊柱位置

`spine.set_position(position)` 把脊柱移到指定位置。位置参数 `position` 有三种取值形式：

| 取值形式 | 含义 |
| --- | --- |
| `('outward', d)` | 脊柱向外偏移 d 个点，远离绘图区中心 |
| `('axes', frac)` | 脊柱放在绘图区内 frac 比例处，0 到 1 之间 |
| `('data', value)` | 脊柱放在数据坐标 value 处，与数据值对应 |

`('outward', d)` 是最常用的形式，把刻度线向外推出，让坐标轴离开数据区域，避免遮挡数据：

```python
fig, ax = plt.subplots()
ax.plot([0, 1, 2], [0, 1, 4])

# 底部与左侧脊柱向外偏移 10 个点
ax.spines['bottom'].set_position(('outward', 10))
ax.spines['left'].set_position(('outward', 10))
plt.show()
```

`('axes', frac)` 把脊柱放在绘图区内相对位置，`frac=0.5` 表示绘图区一半处，适合画参考线式的坐标轴。`('data', value)` 把脊柱固定在某个数据值上，`value=0` 表示脊柱穿过 0 这条数据线：

```python
ax.spines['left'].set_position(('data', 0))    # 左侧脊柱穿过数据 0
ax.spines['bottom'].set_position(('data', 0))  # 底部脊柱穿过数据 0
```

需要注意，`('data', value)` 与 `('axes', frac)` 的取值都要求脊柱对应的那条轴存在；把脊柱位置移到数据范围之外时，脊柱会显示在绘图区边缘。`ax.spines` 也可以整体批量设置位置，例如用 `ax.set_frame_on(False)` 关闭边框后手动重画。

## 1.7.4 脊柱显隐

`spine.set_visible(False)` 隐藏单条脊柱，`set_visible(True)` 恢复显示。隐藏全部四条脊柱用 `ax.set_frame_on(False)`：

```python
fig, ax = plt.subplots()
ax.plot([0, 1, 2], [0, 1, 4])

# 隐藏顶部与右侧脊柱，只保留左、下两条
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
plt.show()
```

隐藏脊柱后刻度仍保留。若同时希望去掉对应边的刻度线，用 `ax.tick_params(top=False, right=False)`。隐藏整组边框用 `ax.set_frame_on(False)`，此时四条脊柱全部消失：

```python
ax.set_frame_on(False)   # 关闭整个绘图框
ax.tick_params(top=False, right=False, bottom=False, left=False)  # 同时去掉刻度
```

隐藏全部脊柱与刻度后，再配合 `ax.grid(True)` 只保留网格线，可以做出极简的散点图。`ax.axis('off')` 也能隐藏所有轴元素，但它同时隐藏刻度标签，与单独控制脊柱不同。

## 1.7.5 经典绘图技巧：十字坐标轴

把两条脊柱移到数据 0 的位置，并隐藏另外两条，就得到穿过原点的十字坐标轴，这是中学数学坐标系的常见画法：

```python
fig, ax = plt.subplots()
x = np.linspace(-5, 5, 200)
y = np.sin(x)
ax.plot(x, y)

# 隐藏顶部与右侧脊柱
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

# 左、下两条脊柱穿过原点
ax.spines['left'].set_position(('data', 0))
ax.spines['bottom'].set_position(('data', 0))

# 刻度线移到原点一侧
ax.xaxis.set_ticks_position('bottom')
ax.yaxis.set_ticks_position('left')
plt.show()
```

`set_ticks_position('bottom')` 把刻度线固定在底部脊柱上，`'left'` 固定在左侧脊柱上，这样刻度线跟随坐标轴移动。用 `set_position(('zero', ...))` 的另一种写法：

```python
ax.spines['left'].set_position('zero')
ax.spines['bottom'].set_position('zero')
```

`set_position('zero')` 等效于 `('data', 0)`，把脊柱放在数据零值处。如果数据范围不含 0，脊柱会被推到绘图区边缘，此时可以先用 `ax.set_xlim`、`ax.set_ylim` 让坐标范围覆盖 0。

十字坐标轴常与向外的刻度线配合，让刻度不遮挡曲线：

```python
ax.spines['bottom'].set_position(('outward', 10))
ax.spines['left'].set_position(('outward', 10))
ax.tick_params(direction='out', length=4)
```

完整示例：绘制一条经过原点的十字坐标轴并添加网格：

```python
fig, ax = plt.subplots(figsize=(6, 4))
x = np.linspace(-2 * np.pi, 2 * np.pi, 400)
ax.plot(x, np.sin(x), color='tab:blue')

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_position(('data', 0))
ax.spines['bottom'].set_position(('data', 0))
ax.xaxis.set_ticks_position('bottom')
ax.yaxis.set_ticks_position('left')
ax.grid(True, linestyle='--', alpha=0.4)
plt.show()
```

通过组合 `set_visible`、`set_position`、`set_color` 与 `set_linewidth`，可以把默认的矩形框改造成任意需要的边框样式，这是控制绘图外观的基础技能。

## 练习题

### 第1题 概念理解

说明 `ax.spines` 包含哪些键、各键对应的边框；说明 `set_position` 三种取值形式的含义；说明 `set_visible(False)` 与 `tick_params(top=False, right=False)` 的分工。

::: details 参考答案

`ax.spines` 的键为 `top`、`bottom`、`left`、`right`，对应上下左右四条边框。`('outward', d)` 向外偏移 d 点，`('axes', frac)` 放在绘图区 frac 比例处，`('data', value)` 放在数据值 value 处。`set_visible(False)` 隐藏边框本身，`tick_params` 控制刻度线与刻度标签的显隐，两者配合才能同时去掉边框与刻度。
:::

### 第2题 代码编写

绘制一条 y = x^2 的曲线，隐藏顶部与右侧脊柱；把左侧脊柱设为红色、线宽 2；底部脊柱向外偏移 15 个点。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots()
x = np.linspace(-3, 3, 200)
ax.plot(x, x ** 2)

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('red')
ax.spines['left'].set_linewidth(2)
ax.spines['bottom'].set_position(('outward', 15))
plt.show()
```

:::

### 第3题 进阶练习

绘制 y = sin(x) 在 -2π 到 2π 的曲线，做出穿过原点的十字坐标轴：左、下脊柱移到数据 0 处，顶部与右侧脊柱隐藏，刻度线分别固定到左、下边，并添加半透明网格线。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(6, 4))
x = np.linspace(-2 * np.pi, 2 * np.pi, 400)
ax.plot(x, np.sin(x), color='tab:blue')

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_position(('data', 0))
ax.spines['bottom'].set_position(('data', 0))
ax.xaxis.set_ticks_position('bottom')
ax.yaxis.set_ticks_position('left')
ax.grid(True, linestyle='--', alpha=0.4)
plt.show()
```

:::

## 常见错误

**错误 1 · 脊柱穿过原点时坐标轴被顶到绘图区边缘**

原因:数据范围不含 0，`('data', 0)` 找不到零值位置。

解决:先用 `ax.set_xlim`、`ax.set_ylim` 让坐标范围包含 0，再设置脊柱位置。

**错误 2 · 隐藏脊柱后刻度线仍然残留**

原因:`set_visible(False)` 只隐藏边框，刻度线独立存在。

解决:同时用 `ax.tick_params(top=False, right=False)` 去掉对应边的刻度线。

**错误 3 · `set_position` 报 `ValueError` 或无效位置**

原因:位置参数格式写错，例如只传单个数值而没有元组。

解决:写成 `('outward', 10)`、`('axes', 0.5)`、`('data', 0)` 或 `'zero'` 的形式。

**错误 4 · 调用 `ax.set_frame_on(False)` 后标签和刻度全部消失**

原因:`set_frame_on(False)` 隐藏了脊柱，刻度与标签也一并受影响。

解决:若只需隐藏部分边框，用 `ax.spines['top'].set_visible(False)` 逐条控制；需要保留刻度时用 `tick_params` 单独调整。

**错误 5 · 修改脊柱颜色后图形没有变化**

原因:脊柱被隐藏或颜色设置了透明值。

解决:检查 `set_visible(False)` 是否误用，确认 `set_color` 传入的颜色值有效。
