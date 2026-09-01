---
title: 1.5 子图与布局管理
sidebar:
  order: 5
---
# 1.5 子图与布局管理

前几节大多数示例只画单张图。实际分析中经常需要把多张图放在同一画布上对比，例如同一指标的分组子图、多个维度的联动视图。本节解决子图的创建与布局问题：从最简单的网格子图到非均匀网格、嵌套子图，再到间距与留白的自动化管理。合理的布局能显著提升多图并排时的可读性，也是论文配图与报告图表的基本功。本节覆盖 `plt.subplot()`、`plt.subplots()`、`subplot2grid()`、`GridSpec`、`tight_layout` 与 `constrained_layout` 等布局工具。

## 1.5.1 网格子图 plt.subplot()

`plt.subplot(nrows, ncols, index)` 在规则网格中按序号创建子图，序号从 1 开始，按行优先排列。它直接作用于 pyplot 当前 Figure：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 50)

plt.subplot(2, 2, 1)          # 2 行 2 列，第 1 格
plt.plot(x, np.sin(x))

plt.subplot(2, 2, 2)          # 第 2 格
plt.plot(x, np.cos(x))

plt.subplot(2, 2, 3)          # 第 3 格
plt.plot(x, x)

plt.subplot(2, 2, 4)          # 第 4 格
plt.plot(x, x ** 2)

plt.show()
```

`plt.subplot(221)` 是 `plt.subplot(2, 2, 1)` 的简写。调用 `plt.subplot` 会把当前子图切换为指定网格位置，之后的 `plt.plot()`、`plt.title()` 都作用在该子图上。`plt.subplot()` 每次调用时若该网格位置已存在子图，会直接复用并切换过去，不会重复创建。

## 1.5.2 批量创建 plt.subplots()

`plt.subplots(nrows, ncols)` 一次性创建整块网格，返回 `(fig, axs)`，`axs` 是子图对象的数组。`sharex`、`sharey` 参数可让子图共享坐标轴，`figsize` 控制画布尺寸：

```python
fig, axs = plt.subplots(2, 2, figsize=(8, 6), sharex=True, sharey=True)

axs[0, 0].plot(x, np.sin(x))
axs[0, 1].plot(x, np.cos(x))
axs[1, 0].plot(x, x)
axs[1, 1].plot(x, x ** 2)
```

`axs` 的形状与网格一致，用 `axs[行, 列]` 索引。只有单个子图时 `axs` 直接是 Axes 对象而非数组，用 `fig, ax = plt.subplots()` 接收。`sharex=True` 让所有子图共享 x 轴，放大任一子图其他子图同步缩放，并自动隐藏内部子图重复的 x 刻度标签。可以用 `fig.axes` 遍历全部子图：

```python
for ax in fig.axes:
    ax.grid(True)
```

`fig.axes` 是按创建顺序排列的全部 Axes 列表，适合批量设置统一属性。

## 1.5.3 非均匀网格 plt.subplot2grid()

`plt.subplot2grid((总行, 总列), (起点行, 起点列), rowspan=行跨数, colspan=列跨数)` 允许子图跨越多个网格单元，构造非均匀布局，如大图配侧栏的经典版面：

```python
fig = plt.figure()

# 左上角大图，占 2 行 2 列
ax_main = plt.subplot2grid((3, 3), (0, 0), rowspan=2, colspan=2)
# 右上角小图，占 1 行 1 列
ax_topright = plt.subplot2grid((3, 3), (0, 2))
# 左侧中栏，占 1 行 2 列
ax_mid = plt.subplot2grid((3, 3), (2, 0), colspan=2)
# 右下角小图
ax_bottomright = plt.subplot2grid((3, 3), (2, 2))

ax_main.plot(x, np.sin(x))
ax_topright.plot(x, np.cos(x))
ax_mid.plot(x, x)
ax_bottomright.plot(x, x ** 2)

fig.tight_layout()
fig.show()
```

`rowspan` 与 `colspan` 控制子图在行方向与列方向跨越的格子数。`subplot2grid` 适合快速做出不规则版面，但网格单元的合并关系隐含在坐标中，布局复杂时不如 `GridSpec` 直观。

## 1.5.4 GridSpec 网格对象

`GridSpec` 是更灵活的网格布局机制，把画布划分成网格后，用 `fig.add_subplot(gs[行, 列])` 或 `fig.add_subplot(gs[行区间, 列区间])` 精确放置子图，支持切片的行与列区间实现跨格：

```python
from matplotlib.gridspec import GridSpec

fig = plt.figure()
gs = GridSpec(3, 3, figure=fig, width_ratios=[1, 2, 1],
              height_ratios=[1, 2, 1])

ax1 = fig.add_subplot(gs[0, :])        # 第一行整行
ax2 = fig.add_subplot(gs[1:, 0])       # 左列下面两格
ax3 = fig.add_subplot(gs[1, 1:])       # 中间行右侧
ax4 = fig.add_subplot(gs[2, 2])        # 右下角单格
```

`GridSpec(nrows, ncols)` 的 `width_ratios` 与 `height_ratios` 控制各列、各行的宽度比例，`hspace` 与 `wspace` 控制子图间距。`gs[1:, 0]` 这种切片写法让子图跨越多行多列，比 `subplot2grid` 更直观。`fig.add_subplot(gs[切片])` 支持任意 `numpy` 风格的切片。

`fig.add_gridspec()` 是 Figure 级的方法，直接在 Figure 上创建 GridSpec，效果与 `GridSpec(..., figure=fig)` 相同：

```python
fig = plt.figure()
gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.4)

ax1 = fig.add_subplot(gs[0, 0])
ax2 = fig.add_subplot(gs[0, 1])
ax3 = fig.add_subplot(gs[1, :])   # 第二行合并成一个子图
```

`fig.add_gridspec()` 的优势是省去传 `figure=fig` 参数，并且与 Figure 生命周期绑定清晰。

## 1.5.5 嵌套子图 GridSpecFromSubplotSpec

`GridSpecFromSubplotSpec(subplot_spec, nrows, ncols)` 在一个已有的子图区域内部再划分网格，实现**子图中的子图**，适合在大图内部排布多个小图：

```python
from matplotlib.gridspec import GridSpec, GridSpecFromSubplotSpec

fig = plt.figure()
outer = GridSpec(2, 2, figure=fig)

# 左上角区域内部再划分 2x2 网格
ax_outer = fig.add_subplot(outer[0, 0])
inner = GridSpecFromSubplotSpec(2, 2, subplot_spec=outer[0, 0],
                                hspace=0.4, wspace=0.4)

inner_axs = [fig.add_subplot(inner[i, j]) for i in range(2) for j in range(2)]

# 其余三个大格
ax2 = fig.add_subplot(outer[0, 1])
ax3 = fig.add_subplot(outer[1, 0])
ax4 = fig.add_subplot(outer[1, 1])
```

`GridSpecFromSubplotSpec` 的第一个参数是要拆分的子图位置，返回的 `inner` 是新的 GridSpec，用 `fig.add_subplot(inner[行, 列])` 在内部创建子图。嵌套布局适合仪表盘式的复杂版面，例如在总览图内部放大局部区域。

## 1.5.6 交互式调整 plt.subplot_tool()

`plt.subplot_tool()` 打开一个交互式面板，可以拖动滑块实时调整子图的 `left`、`right`、`bottom`、`top`、`wspace`、`hspace` 六个布局参数。调整结果实时反映到当前 Figure，方便直观地找到合适的间距：

```python
fig, axs = plt.subplots(2, 2)
plt.subplot_tool()   # 打开布局调整面板
plt.show()
```

该工具适合交互式探索阶段，例如在 Jupyter 中反复微调间距。面板只影响当前 Figure，关闭面板后调整即固定。批量脚本或最终成品通常改用 `tight_layout` 或 `constrained_layout` 自动化布局，避免手工依赖。

## 1.5.7 紧凑布局 tight_layout 与手动间距 subplots_adjust

`plt.tight_layout()` 自动调整子图间距与画布边距，避免标题、标签、图例互相遮挡。`plt.subplots_adjust()` 手动指定间距。`fig.tight_layout()` 与 `fig.subplots_adjust()` 是等效的面向对象版本：

```python
fig, axs = plt.subplots(2, 2)
for i, ax in enumerate(fig.axes):
    ax.plot(x, i * x)
    ax.set_title(f'子图 {i + 1}')

fig.tight_layout()      # 自动紧凑布局
fig.show()
```

`tight_layout` 自动计算每个子图需要的空间，尽量压缩边距。若需要手工控制，用 `subplots_adjust` 指定六个参数：

```python
fig.subplots_adjust(left=0.1, right=0.9, bottom=0.1, top=0.9,
                    wspace=0.3, hspace=0.4)
```

`left`、`right`、`bottom`、`top` 是画布四边留白占 Figure 宽高的比例，取值 0 到 1；`wspace` 是子图之间的水平间距（按子图平均宽度比例），`hspace` 是垂直间距（按子图平均高度比例）。`plt.subplots_adjust(...)` 与 `fig.subplots_adjust(...)` 参数完全一致，前者作用于当前 Figure。六个参数的典型调整：标题被裁剪时增大 `top`，图例放不下时增大 `right`，子图挤在一起时增大 `wspace` 与 `hspace`。

## 1.5.8 约束布局 constrained_layout

`constrained_layout` 是另一种自动化布局机制，在绘制过程中持续约束各元素，让标题、刻度标签、colorbar 自动避让。开启方式是在 `plt.subplots()` 或 `plt.figure()` 中设置 `constrained_layout=True`：

```python
fig, axs = plt.subplots(2, 2, constrained_layout=True)

for i, ax in enumerate(fig.axes):
    ax.imshow(np.random.rand(10, 10))
    ax.set_title(f'子图 {i + 1}')

fig.colorbar(axs[0, 0].images[0], ax=axs, fraction=0.03)
fig.show()
```

`constrained_layout` 与 `tight_layout` 的目标一致，但机制不同：`tight_layout` 是在绘制完成后一次性计算布局，`constrained_layout` 在绘制过程中持续约束，对 colorbar、多次绘制的动态内容更友好。启用 `constrained_layout` 后通常不需要再调用 `tight_layout()`，两者同时使用反而可能冲突。`constrained_layout` 对复杂布局（如 `GridSpecFromSubplotSpec`）的适配也更好。

## 练习题

### 第1题 概念理解

说明 `plt.subplot()`、`plt.subplots()`、`plt.subplot2grid()` 三者的区别；说明 `GridSpec` 中 `gs[1:, 0]` 的含义；说明 `tight_layout` 与 `constrained_layout` 的机制差异；说明 `fig.subplots_adjust()` 六个参数各自控制什么。

::: details 参考答案

`plt.subplot()` 按网格序号逐个创建子图，`plt.subplots()` 一次创建整块网格并返回数组，`subplot2grid` 用行跨列跨构造非均匀布局。`gs[1:, 0]` 表示从第 1 行到最后一行、第 0 列的子图区域，即左侧列下方所有格合并。`tight_layout` 在绘制完成后一次性计算紧凑布局，`constrained_layout` 在绘制过程中持续约束，对 colorbar 等动态元素更友好。`left`、`right`、`bottom`、`top` 是画布四边留白比例，`wspace` 与 `hspace` 是子图之间的水平与垂直间距。
:::

### 第2题 代码编写

用 `plt.subplots(2, 3)` 创建 6 个子图并分别画六种基本图表（线图、散点图、柱状图、直方图、箱线图、饼图）；设置 `sharex` 与 `sharey`；最后调用 `fig.tight_layout()` 并保存。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(6)
x = np.linspace(0, 10, 50)

fig, axs = plt.subplots(2, 3, figsize=(12, 7),
                        sharex=False, sharey=False)

axs[0, 0].plot(x, np.sin(x))
axs[0, 0].set_title('线图')
axs[0, 1].scatter(rng.normal(0, 1, 50), rng.normal(0, 1, 50), s=10)
axs[0, 1].set_title('散点图')
axs[0, 2].bar(['A', 'B', 'C'], [3, 7, 5])
axs[0, 2].set_title('柱状图')
axs[1, 0].hist(rng.normal(0, 1, 300), bins=25)
axs[1, 0].set_title('直方图')
axs[1, 1].boxplot([rng.normal(0, 1, 100) for _ in range(3)])
axs[1, 1].set_title('箱线图')
axs[1, 2].pie([30, 25, 20, 15, 10], labels=['甲', '乙', '丙', '丁', '戊'])
axs[1, 2].set_title('饼图')

fig.tight_layout()
fig.savefig('six_charts.png', dpi=150)
```

:::

### 第3题 进阶练习

用 `fig.add_gridspec()` 创建一个 3 行 3 列的布局，让第一行整行合并、左下角 2x2 合并、其余为单格；在合并的大图内部用 `GridSpecFromSubplotSpec` 再嵌套 2 个小子图；最后开启 `constrained_layout` 并验证 colorbar 不遮挡子图。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.gridspec import GridSpecFromSubplotSpec

fig = plt.figure(constrained_layout=True)
gs = fig.add_gridspec(3, 3)

# 第一行整行
ax_top = fig.add_subplot(gs[0, :])
ax_top.plot([1, 2, 3], [1, 4, 9])
ax_top.set_title('整行大图')

# 左下角 2x2 合并，内部再嵌套 2 个子图
ax_large = fig.add_subplot(gs[1:, 0:2])
inner = GridSpecFromSubplotSpec(2, 2, subplot_spec=gs[1:, 0:2],
                                hspace=0.4, wspace=0.4)
inner_ax1 = fig.add_subplot(inner[0, 0])
inner_ax2 = fig.add_subplot(inner[0, 1])
inner_ax1.scatter(np.random.rand(20), np.random.rand(20))
inner_ax2.plot(np.random.rand(20))

# 右侧两个单格
ax_right1 = fig.add_subplot(gs[1, 2])
ax_right2 = fig.add_subplot(gs[2, 2])
im = ax_right1.imshow(np.random.rand(10, 10), cmap='viridis')
fig.colorbar(im, ax=ax_right2, fraction=0.1)
ax_right2.axis('off')

fig.show()
```

:::

## 常见错误

**错误 1 · `plt.subplots()` 返回的 `axs` 只有一个子图时无法用 `axs[0]` 索引**

原因:单个子图时 `axs` 返回的是 Axes 对象而非数组。

解决:用 `fig, ax = plt.subplots()` 接收单子图;或统一用 `fig.axes` 遍历。

**错误 2 · 多个子图的标题互相重叠或超出画布**

原因:子图间距与边距设置不当,标题与相邻子图或画布边缘冲突。

解决:调用 `fig.tight_layout()`,或开启 `constrained_layout=True`,或手动调大 `hspace`。

**错误 3 · `tight_layout` 与 `constrained_layout` 同时使用出现警告或布局异常**

原因:两种自动布局机制互相冲突。

解决:只启用其中一种,优先用 `constrained_layout` 处理含 colorbar 的复杂布局。

**错误 4 · 共享坐标轴后子图之间刻度标签堆叠冗余**

原因:`sharex=True` 时内部子图的 x 刻度标签默认保留。

解决:用 `ax.tick_params(labelbottom=False)` 隐藏非底部子图的标签,或让 Matplotlib 自动隐藏共享轴的重复标签。

**错误 5 · `subplot2grid` 或 `GridSpec` 布局中子图位置重叠**

原因:多个子图的 `rowspan`、`colspan` 或切片区域互相交叠。

解决:规划好每个区域的起止行列,先用 `gs` 打印或画出网格边界验证布局。

**错误 6 · `colorbar` 单独占用一个子图时显示为空**

原因:`fig.colorbar(im, ax=ax)` 中 `ax` 传的是被隐藏坐标轴的子图,或 `fraction` 过小。

解决:把 `ax` 设为 `im` 所在子图,如 `fig.colorbar(im, ax=ax1)`,并调整 `fraction` 控制 colorbar 宽度。
