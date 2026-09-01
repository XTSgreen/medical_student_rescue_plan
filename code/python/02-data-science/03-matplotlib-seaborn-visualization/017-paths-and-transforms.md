---
title: 1.17 路径与变换
sidebar:
  order: 17
---
# 1.17 路径与变换

给图加标注时经常遇到这类需求：在图右上角固定位置放一行说明文字，数据范围怎么变它都停在右上角；给峰值点做箭头注释，箭头起点跟着数据点走、文字却想固定在图上某个位置。这类需求背后是同一个问题：文字和图形放在哪个坐标系里定位。Matplotlib 用变换（transform）对象把坐标系彼此换算，本节讲解三种常用坐标系、transform 参数的用法与混合变换。

## 1.17.1 坐标系变换概念

Matplotlib 中任何位置都由坐标系加上坐标值确定。三个最常用的变换对象：

| 变换对象 | 坐标系 | 含义 |
| --- | --- | --- |
| `ax.transData` | 数据坐标 | 与轴的数据范围绑定，如点 (1, 2) |
| `ax.transAxes` | 轴坐标 | 以轴区域左下角为原点、宽度高度归一化到 0~1 |
| `fig.transFigure` | 图形坐标 | 以整个画布左下角为原点、宽高归一化到 0~1 |

数据坐标随轴范围变化，适合标注数据点本身的位置；轴坐标与图形坐标都是 0 到 1 的归一化坐标，不随数据范围变化，适合放与数据无关的固定说明。三者可以互相换算，最常用的是 `ax.transData.transform((x, y))` 把数据坐标换算成屏幕像素坐标，以及 `ax.transData.inverted().transform(...)` 反方向换算。

## 1.17.2 transform 参数应用

`ax.text()`、`ax.annotate()` 等文本方法都接受 `transform` 参数指定坐标所在坐标系，默认是 `ax.transData`。

### 轴坐标固定文字

`ax.text(..., transform=ax.transAxes)` 用轴坐标定位，位置不随数据范围变化。例如把图例式说明固定放在右上角：

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [1, 4, 2, 5])
ax.text(0.95, 0.95, '右上角说明', transform=ax.transAxes,
        ha='right', va='top')
plt.show()
```

`ha='right'`、`va='top'` 让文字右下对齐于坐标点，这样 `(0.95, 0.95)` 恰好是文字的右上角，文字不会溢出轴外。

### annotate 中的 transform 组合

`ax.annotate()` 有两个独立位置：箭头起点 `xy` 与文字位置 `xytext`。`xy` 用数据坐标指定数据点，`xytext` 用 `textcoords` 指定坐标系，可以形成箭头指数据点、文字固定在图上的组合：

```python
fig, ax = plt.subplots()
x = [1, 2, 3, 4, 5]
y = [1, 3, 7, 4, 2]
ax.plot(x, y, marker='o')
ax.annotate('最高点', xy=(3, 7), xytext=(0.7, 0.9),
            textcoords='axes fraction',
            arrowprops=dict(arrowstyle='->'))
plt.show()
```

`xy` 默认使用数据坐标（`ax.transData`）；`textcoords='axes fraction'` 表示 `xytext` 使用轴坐标。`arrowprops` 里的 `arrowstyle='->'` 指定箭头样式。这样数据点移动到哪，箭头都跟随，而文字始终停在图的右上区域。

## 1.17.3 混合变换 blended_transform_factory

有些标注希望一个坐标用数据坐标、另一个坐标用轴坐标。例如 x 跟随数据、y 固定在图顶部 95% 处。`matplotlib.transforms.blended_transform_factory(x_transform, y_transform)` 把两个变换合成一个新变换，第一个参数用于 x 方向，第二个用于 y 方向：

```python
from matplotlib.transforms import blended_transform_factory

fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [2, 5, 3, 6])

transform = blended_transform_factory(ax.transData, ax.transAxes)
ax.text(2.5, 0.95, 'x 取数据坐标、y 取轴坐标',
        transform=transform, ha='center', va='top')
plt.show()
```

`ax.text(2.5, 0.95, transform=...)` 中，x 值 2.5 按数据坐标解析，y 值 0.95 按轴坐标解析。混合变换在给整条曲线顶部加一行注释这类场景里非常实用：曲线数据范围怎么变，注释都贴在图顶部。

## 1.17.4 综合示例：数据坐标与轴坐标混合定位

在同一张图里混合使用三种坐标系：数据坐标标注具体数据点、轴坐标放固定说明、混合变换放顶部注释。下面用一个完整的例子串联本节内容：

```python
import matplotlib.pyplot as plt
from matplotlib.transforms import blended_transform_factory

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

fig, ax = plt.subplots(figsize=(7, 4))
x = [1, 2, 3, 4, 5, 6]
y = [3, 5, 8, 7, 9, 6]
ax.plot(x, y, marker='o')

# 数据坐标：标注具体数据点
ax.annotate('峰值', xy=(5, 9), xytext=(5, 9),
            arrowprops=dict(arrowstyle='->'))

# 轴坐标：固定放在左上角，不随数据范围变化
ax.text(0.02, 0.95, '固定说明', transform=ax.transAxes,
        ha='left', va='top', bbox=dict(boxstyle='round', fc='lightyellow'))

# 混合变换：x 跟随数据、y 固定在图顶部
transform = blended_transform_factory(ax.transData, ax.transAxes)
ax.text(3.5, 0.05, 'x 数据坐标 / y 轴坐标', transform=transform,
        ha='center', va='bottom', color='gray')

ax.set_xlabel('序号')
ax.set_ylabel('数值')
plt.show()
```

运行后观察：放大或改变轴范围，数据坐标标注跟着数据点移动，轴坐标说明与混合变换注释保持固定，直观展示三种坐标系的分工。

## 练习题

### 第1题 概念理解

说明 `ax.transData`、`ax.transAxes`、`fig.transFigure` 三种坐标系各自的含义；说明 `textcoords='axes fraction'` 在 `annotate` 中的作用。

::: details 参考答案

`ax.transData` 使用数据坐标，位置随轴范围变化；`ax.transAxes` 使用轴坐标，轴区域归一化到 0~1，不随数据变化；`fig.transFigure` 使用图形坐标，整个画布归一化到 0~1。`textcoords='axes fraction'` 指定 `xytext`（文字位置）使用轴坐标，让文字位置与数据范围解耦。
:::

### 第2题 代码编写

绘制一条折线图，用 `ax.transAxes` 在右上角固定位置放一行说明文字；用 `ax.annotate` 给数据最大值做箭头标注，箭头起点用数据坐标、文字用轴坐标。

::: details 参考答案

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
x = [1, 2, 3, 4, 5]
y = [2, 5, 3, 8, 4]
ax.plot(x, y, marker='o')

ax.text(0.95, 0.95, '固定说明', transform=ax.transAxes,
        ha='right', va='top')

max_i = y.index(max(y))
ax.annotate('最大值', xy=(x[max_i], y[max_i]), xytext=(0.7, 0.8),
            textcoords='axes fraction',
            arrowprops=dict(arrowstyle='->'))
plt.show()
```

:::

### 第3题 进阶练习

用 `blended_transform_factory(ax.transData, ax.transAxes)` 实现 x 用数据坐标、y 固定在图顶部的注释，并在同一张图中验证：改变轴范围后，数据坐标标注随之移动、混合变换注释保持固定。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from matplotlib.transforms import blended_transform_factory

fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [2, 4, 1, 5], marker='o')

# 数据坐标标注
ax.text(2, 4, '数据坐标点', ha='left', va='bottom')

# 混合变换：x 数据坐标、y 轴坐标
transform = blended_transform_factory(ax.transData, ax.transAxes)
ax.text(2, 0.95, '顶部注释', transform=transform, ha='center', va='top')

ax.set_xlim(0, 5)
ax.set_ylim(0, 6)
plt.show()
```

把 `set_xlim`、`set_ylim` 的取值改大或改小后重新运行，观察数据坐标点跟着数据走、顶部注释始终贴在图顶部，即验证了两类坐标系的行为差异。
:::

## 常见错误

**错误 1 · 用轴坐标写文字却没传 `transform`，文字跑到奇怪位置或消失**

原因:没指定 `transform` 时默认使用数据坐标，0~1 的小数值落在数据范围外。

解决:显式传 `transform=ax.transAxes` 或 `transform=fig.transFigure`。

**错误 2 · `annotate` 文字位置与预期不符**

原因:只给 `xytext` 传了坐标，没有用 `textcoords` 指定坐标系，默认按数据坐标解析。

解决:文字想用轴坐标时加 `textcoords='axes fraction'`，并在 `xytext` 中填 0~1 的值。

**错误 3 · 文字溢出轴区域外被裁剪或显示不全**

原因:文字按中心对齐时，`(1, 1)` 处文字中心超出轴外。

解决:结合 `ha`、`va` 对齐参数（如 `ha='right', va='top'`），让文字整体留在轴内。

**错误 4 · 混合变换的两个变换写反**

原因:`blended_transform_factory` 第一个参数控制 x 方向、第二个控制 y 方向，写反后位置错乱。

解决:按 `(x 变换, y 变换)` 的顺序传参，x 用 `ax.transData`、y 用 `ax.transAxes` 时注意顺序。
