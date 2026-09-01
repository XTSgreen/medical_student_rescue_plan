---
title: 1.12 填充与图形对象
sidebar:
  order: 12
---
# 1.12 填充与图形对象

前几节画的折线、散点、柱状图，数据都以点或线呈现。医学示意图里常见的还有另外一类元素：药物浓度曲线下的面积、肺功能图中的参考椭圆、流程图里的圆角方块。这些元素统称为**图形对象（Patch）**，本质是一个个独立的图形单元，可以单独设置颜色、边框、透明度，也能自由叠加。本节讲解填充多边形的用法，以及 `matplotlib.patches` 中常用图形对象的创建参数，并演示如何用 `ax.add_patch()` 把它们放到坐标轴上。

## 1.12.1 填充多边形 plt.fill() 与 ax.fill()

`plt.fill()` 按给定的坐标点依次连线并填充闭合区域，适合画多边形或填充两条曲线之间的区域：

```python
import matplotlib.pyplot as plt
import numpy as np

# 用三个顶点画一个三角形
plt.fill([1, 5, 3], [1, 1, 4], color='steelblue', alpha=0.6)
plt.xlim(0, 6)
plt.ylim(0, 5)
plt.show()
```

`fill(x, y)` 中 `x` 与 `y` 是闭合路径的顶点坐标，函数会自动把最后一个点与第一个点连起来。它接受 `color`、`alpha`、`edgecolor`、`facecolor` 等填充样式参数。

`fill_between` 常用于填充两条曲线之间的面积，在数据可视化中更常用：

```python
x = np.linspace(0, 10, 200)
y1 = np.sin(x)
y2 = np.cos(x)

plt.plot(x, y1, label='sin(x)')
plt.plot(x, y2, label='cos(x)')
# 填充两条曲线之间的区域
plt.fill_between(x, y1, y2, color='orange', alpha=0.3)
plt.legend()
plt.show()
```

`plt.fill_between(x, y1, y2)` 对每个 `x` 在 `y1` 与 `y2` 之间纵向填充，支持 `where` 参数按条件局部填充。它适合画置信带、误差区间、两组数据的差值区域。面向对象写法为 `ax.fill()` 与 `ax.fill_between()`，参数与 pyplot 版本完全一致。

## 1.12.2 matplotlib.patches 常用图形对象

`matplotlib.patches` 模块提供大量现成的图形类，每个类构造完成后是一个 Patch 对象，本身不立即显示，需要调用 `ax.add_patch()` 添加到坐标轴。常用类的创建参数如下表：

| 图形对象 | 关键参数 | 说明 |
| --- | --- | --- |
| `Rectangle(xy, width, height)` | `xy` 左下角坐标，`width`、`height` 宽高 | 矩形，可用 `angle` 旋转，`round=True` 画圆角 |
| `Circle(xy, radius)` | `xy` 圆心，`radius` 半径 | 圆形，单位是数据坐标 |
| `Ellipse(xy, width, height)` | `xy` 中心，`width`、`height` 直径 | 椭圆，支持 `angle` 倾斜 |
| `Polygon(verts)` | `verts` 顶点坐标列表 | 任意多边形 |
| `Arc(xy, width, height)` | 弧线的包围框 | 只画弧不封闭，用 `theta1`、`theta2` 控制起止角度 |
| `Wedge(center, r, theta1, theta2)` | `center` 圆心，`r` 半径，`theta1`、`theta2` 起止角度 | 扇形，圆形饼图的一部分 |
| `RegularPolygon(xy, numVertices, radius)` | 顶点数 `numVertices`，外接圆半径 `radius` | 正多边形，如正六边形 |

下面用一个示例同时创建七种图形对象：

```python
from matplotlib.patches import (Rectangle, Circle, Ellipse, Polygon,
                                Arc, Wedge, RegularPolygon)
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
ax.set_xlim(-5, 5)
ax.set_ylim(-5, 5)
ax.set_aspect('equal')      # 等比例，保证圆是正圆

ax.add_patch(Rectangle((-4.5, -4.5), 3, 2, facecolor='lightblue', edgecolor='blue'))
ax.add_patch(Circle((3, 3), 1.2, facecolor='orange', edgecolor='red'))
ax.add_patch(Ellipse((-2, 3), 2.4, 1.2, angle=30, facecolor='lightgreen'))
ax.add_patch(Polygon([(-1, -2), (1, -2), (0, 0)], facecolor='yellow', edgecolor='black'))
ax.add_patch(Arc((3, -3), 2, 2, theta1=0, theta2=180, color='purple', linewidth=2))
ax.add_patch(Wedge((-3, 2), 1.5, 30, 150, facecolor='pink'))
ax.add_patch(RegularPolygon((3, -1), 6, 1.0, facecolor='cyan'))

plt.show()
```

各参数的含义：`xy` 系列参数给出图形的定位基准，`width`、`height`、`radius` 决定尺寸，`theta1` 与 `theta2` 决定弧或扇形的角度范围（单位是度，从 0 度开始逆时针）。`facecolor` 控制填充色，`edgecolor` 控制边框色，`linewidth` 控制边框粗细，`alpha` 控制整体透明度。`Arc` 默认不填充，只画弧线，所以用 `color` 指定颜色。

## 1.12.3 Patch 添加到 Axes：ax.add_patch()

所有 Patch 对象创建后都挂在内存里，必须调用 `ax.add_patch(patch)` 才会显示在坐标轴上：

```python
from matplotlib.patches import Rectangle

fig, ax = plt.subplots()
rect = Rectangle((0.2, 0.2), 0.6, 0.3, facecolor='skyblue', edgecolor='navy')
ax.add_patch(rect)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
plt.show()
```

`add_patch` 接收一个 Patch 实例，返回值是该 Patch 对象（通常不使用）。坐标轴的 `xlim` 与 `ylim` 需要手动设置，因为图形对象默认不会自动扩展坐标范围。一次可以连续添加多个 Patch，它们按添加顺序叠放，后添加的在上层。`zorder` 参数可以显式控制层叠顺序，数值大的画在上层。

```python
from matplotlib.patches import Circle

fig, ax = plt.subplots(figsize=(4, 4))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.set_aspect('equal')

c1 = Circle((3, 3), 2, facecolor='red', zorder=1)
c2 = Circle((6, 6), 2, facecolor='blue', zorder=2)
ax.add_patch(c1)
ax.add_patch(c2)
plt.show()
```

## 1.12.4 阴影效果与 hatch 纹理

给 Patch 设置样式可以得到层次分明的效果。`set_facecolor()` 修改填充色，配合 `alpha` 实现半透明叠加，配合 `hatch` 参数填充纹理：

```python
from matplotlib.patches import Rectangle

fig, ax = plt.subplots(figsize=(6, 4))
ax.set_xlim(0, 4)
ax.set_ylim(0, 3)

# 三种纹理：斜线、正点、网格
r1 = Rectangle((0.2, 0.5), 1, 1, facecolor='lightblue', hatch='/')
r2 = Rectangle((1.5, 0.5), 1, 1, facecolor='lightblue', hatch='.')
r3 = Rectangle((2.8, 0.5), 1, 1, facecolor='lightblue', hatch='x')
ax.add_patch(r1)
ax.add_patch(r2)
ax.add_patch(r3)

# 创建后再修改填充色与透明度
r2.set_facecolor('orange')
r2.set_alpha(0.6)

plt.show()
```

`hatch` 的常用取值：`'/'` 斜线、`'\\'` 反斜线、`'-'` 横线、`'|'` 竖线、`'+'` 十字、`'x'` 交叉、`'.'` 圆点、`'o'` 空心圆，也可组合如 `'//'` 双斜线。Patch 创建后仍可用 `set_facecolor()`、`set_edgecolor()`、`set_alpha()`、`set_hatch()` 等 setter 方法修改样式，适合在循环中统一调整。

半透明叠加在医学示意图中很实用，例如把两个范围有重叠的分布用半透明椭圆表示，重叠区域自动呈现出两种颜色的混合：

```python
from matplotlib.patches import Ellipse

fig, ax = plt.subplots(figsize=(6, 4))
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.set_aspect('equal')

e1 = Ellipse((3, 3), 4, 3, facecolor='blue', alpha=0.4)
e2 = Ellipse((5.5, 3), 4, 3, facecolor='red', alpha=0.4)
ax.add_patch(e1)
ax.add_patch(e2)
plt.show()
```

## 练习题

### 第1题 概念理解

说明 `plt.fill()` 与 `plt.fill_between()` 的区别；说明为什么创建 Patch 对象后需要调用 `ax.add_patch()`；说明 `facecolor`、`edgecolor`、`alpha`、`hatch` 分别控制什么。

::: details 参考答案

`plt.fill(x, y)` 按顶点坐标画闭合填充多边形，`plt.fill_between(x, y1, y2)` 对每个 `x` 纵向填充两条曲线之间的区域。Patch 对象创建后只是内存中的图形描述，必须用 `ax.add_patch()` 把它挂到坐标轴上才会显示。`facecolor` 控制填充色，`edgecolor` 控制边框色，`alpha` 控制整体透明度，`hatch` 控制填充纹理。
:::

### 第2题 代码编写

在 0 到 10 的坐标范围内绘制：一个 `Circle`、一个旋转 45 度的 `Ellipse`、一个五边形 `RegularPolygon`、一个 `Wedge` 扇形，用 `add_patch` 添加并用不同颜色区分，设置等比例坐标轴。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Ellipse, RegularPolygon, Wedge

fig, ax = plt.subplots(figsize=(6, 6))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.set_aspect('equal')

ax.add_patch(Circle((2.5, 2.5), 1.5, facecolor='steelblue'))
ax.add_patch(Ellipse((7.5, 2.5), 3, 1.5, angle=45, facecolor='orange'))
ax.add_patch(RegularPolygon((2.5, 7.5), 5, 1.5, facecolor='green'))
ax.add_patch(Wedge((7.5, 7.5), 1.5, 30, 210, facecolor='purple'))

plt.show()
```

:::

### 第3题 进阶练习

绘制 `x ∈ [0, 10]` 上 `y1 = sin(x)` 与 `y2 = cos(x)` 的曲线，用 `fill_between` 填充两曲线之间区域并设置 `alpha`；另外创建 3 个带不同 `hatch` 纹理的 `Rectangle`，其中 1 个在创建后用 `set_facecolor` 与 `set_alpha` 修改样式，并说明 `zorder` 对叠放顺序的作用。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

x = np.linspace(0, 10, 200)
y1 = np.sin(x)
y2 = np.cos(x)

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y1, label='sin(x)')
ax.plot(x, y2, label='cos(x)')
ax.fill_between(x, y1, y2, color='orange', alpha=0.3)

ax.add_patch(Rectangle((0.2, -1.2), 2, 0.5, facecolor='lightblue', hatch='/', zorder=5))
r2 = Rectangle((3, -1.2), 2, 0.5, facecolor='lightblue', hatch='x', zorder=5)
ax.add_patch(r2)
r2.set_facecolor('orange')
r2.set_alpha(0.6)

ax.legend()
plt.show()
```

`zorder` 数值大的 Patch 画在数值小的上层，默认按添加顺序叠放。半透明区域与 `zorder` 结合可以精确控制填充、图形对象与数据曲线的遮挡关系。
:::

## 常见错误

**错误 1 · 调用 `plt.fill()` 或 `plt.plot()` 之后圆形的形状是扁的**

原因:坐标轴纵横比例不是 1，`Circle` 在拉伸的坐标轴里显示为椭圆。

解决:调用 `ax.set_aspect('equal')` 让两个方向刻度等比例，或 `ax.set_aspect('auto')` 恢复自动。

**错误 2 · 创建了 Patch 对象但图上什么都没有**

原因:只构造了对象，没有调用 `ax.add_patch()`，或者坐标范围没有覆盖图形所在区域。

解决:创建后调用 `ax.add_patch(patch)`，并用 `set_xlim`、`set_ylim` 把坐标范围扩到图形位置。

**错误 3 · 弧 `Arc` 画出来是封闭图形**

原因:误以为 `Arc` 会像 `Wedge` 一样填充闭合区域。

解决:`Arc` 只画弧线，需要填充的扇形用 `Wedge(center, r, theta1, theta2)`。

**错误 4 · `hatch` 纹理不显示**

原因:图形太小或线宽太细，纹理被压缩得看不清，或把 `hatch` 写在了 `color` 参数的位置。

解决:适当调大图形尺寸，`hatch` 作为关键字参数单独传入，必要时叠加多个字符如 `'//'` 加深纹理。
