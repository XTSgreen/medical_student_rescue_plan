---
title: 1.2 图形容器与面向对象接口
sidebar:
  order: 2
---
# 1.2 图形容器与面向对象接口

上一节介绍了 pyplot 的状态机接口，它能快速出图。但同一张图里放多个坐标轴、把坐标轴放进指定位置、复用图例并共享刻度时，状态机接口会变得难以驾驭。Matplotlib 的面向对象接口围绕三个容器对象组织：**Figure**、**Axes**、**Axis**。本节逐个拆解这三个对象及其层级关系，覆盖 Figure 的创建与保存、Axes 的绘图与设置方法、Axis 的刻度控制，以及 Artist 基类的通用属性访问。掌握这套对象体系后，复杂图表也能有条不紊地构造。

## 1.2.1 Figure 顶层容器

Figure 是整张图最顶层的容器，相当于一张画布，容纳全部坐标轴、标题、图例、文字等元素。用 `plt.figure()` 创建，`plt.gcf()` 获取当前 Figure：

```python
import matplotlib.pyplot as plt

fig = plt.figure()                    # 创建空 Figure
fig2 = plt.figure(figsize=(8, 6))     # 指定宽高（英寸）
fig3, ax = plt.subplots()             # 一步创建 Figure 与单个 Axes
```

`figsize` 控制画布宽高，单位是英寸，结合 dpi 决定最终像素尺寸。Figure 的重要属性包括 `figsize`、`dpi`（每英寸像素数）、`facecolor`（画布背景色）。查看当前 Figure 列表可用 `plt.get_fignums()`。

Figure 本身也是 Artist，可整体设置属性：

```python
fig = plt.figure()
fig.suptitle('整张图的标题')        # 覆盖所有子图的全局标题
fig.set_facecolor('white')
fig.set_dpi(100)
```

`fig.suptitle()` 与 `ax.set_title()` 的区别在于作用范围：前者作用于整个 Figure 顶部，后者只作用于单个 Axes 内部。

## 1.2.2 在 Figure 上创建 Axes

Axes 是绘图区域，真正画线、画点都发生在 Axes 上。一个 Figure 可以包含多个 Axes。创建 Axes 有三种主要方式。

### fig.add_axes()

`fig.add_axes([left, bottom, width, height])` 用一个四元组指定 Axes 在 Figure 中的位置与大小，数值是相对 Figure 宽高的比例（0 到 1），适合精确摆放：

```python
fig = plt.figure()
ax1 = fig.add_axes([0.1, 0.1, 0.8, 0.6])   # 左侧大图
ax2 = fig.add_axes([0.15, 0.75, 0.3, 0.2])  # 右上角小图
```

### fig.add_subplot()

`fig.add_subplot(nrows, ncols, index)` 在规则的网格中按序号创建 Axes，序号从 1 开始从左到右、从上到下计数：

```python
fig = plt.figure()
ax1 = fig.add_subplot(2, 2, 1)   # 2 行 2 列网格的第 1 格
ax2 = fig.add_subplot(2, 2, 2)   # 第 2 格
ax3 = fig.add_subplot(2, 2, 3)   # 第 3 格
```

`add_subplot` 的常用写法是合并参数 `fig.add_subplot(221)`，等价于 `add_subplot(2, 2, 1)`。若多次调用 `add_subplot` 且参数相同，会返回同一个已有 Axes。

### fig.subplots()

`fig.subplots(nrows, ncols)` 一次性创建整块网格并返回 Axes 的二维数组：

```python
fig, axs = plt.subplots(2, 2)     # 2x2 网格
axs[0, 0].plot([1, 2, 3], [1, 4, 9])
axs[1, 1].scatter([1, 2, 3], [4, 5, 6])
```

`axs` 是 `numpy.ndarray`，用索引访问；当只有一个子图时返回单个 Axes 对象，用 `fig, ax = plt.subplots()` 接收。

## 1.2.3 Figure 的清理、关闭与保存

`fig.clear()` 清空 Figure 上的全部内容（保留画布本身），`plt.clf()` 是清空当前 Figure 的 pyplot 快捷方式。`fig.close()` 关闭 Figure 并释放内存，`plt.close('all')` 关闭所有 Figure：

```python
fig = plt.figure()
ax = fig.add_subplot(1, 1, 1)
ax.plot([1, 2, 3])

fig.clear()          # 清空内容，Figure 仍在
plt.close(fig)        # 关闭该 Figure
plt.close('all')      # 关闭全部 Figure
```

内存管理建议：在循环里反复创建 Figure 时，用完后调用 `plt.close(fig)`，避免大量不用的图形对象堆积占用内存。

### fig.savefig() 保存图片

`fig.savefig()` 把 Figure 保存为文件，格式由扩展名自动推断，支持 PNG、PDF、SVG、EPS、TIFF 等。核心参数有 `dpi`、`bbox_inches`、`facecolor`、`transparent`：

```python
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])

fig.savefig('figure.png')                     # 默认 dpi
fig.savefig('figure_hi.png', dpi=300)         # 高分辨率
fig.savefig('figure_pdf.pdf')                 # 矢量格式
fig.savefig('figure_tight.png', bbox_inches='tight')  # 裁剪留白
fig.savefig('figure_tr.png', transparent=True)        # 透明背景
```

`dpi=300` 用于论文插图，`bbox_inches='tight'` 自动裁剪四周空白，`transparent=True` 生成透明背景方便叠加到其他材料上。

## 1.2.4 Axes 绘图方法与设置方法

Axes 是承载图表内容的核心对象，绘图方法直接作用在它上面。常用绘图方法包括 `ax.plot()`（线图）、`ax.scatter()`（散点图）、`ax.bar()`（柱状图）、`ax.hist()`（直方图）、`ax.pie()`（饼图）等，功能与 pyplot 同名函数一一对应：

```python
import numpy as np

fig, ax = plt.subplots()
x = np.linspace(0, 10, 50)
ax.plot(x, np.sin(x), label='sin')          # 线图
ax.scatter(x, np.cos(x), s=20, label='cos') # 散点图，s 控制点大小
ax.set_title('Axes 绘图示例')
ax.set_xlabel('x 轴')
ax.set_ylabel('y 轴')
fig.show()
```

设置方法以 `set_` 开头，用于配置 Axes 的标题、坐标轴标签、范围、刻度等。常用的设置方法有 `ax.set_title()`（标题）、`ax.set_xlabel()`（x 轴标签）、`ax.set_ylabel()`（y 轴标签）、`ax.set_xlim()`（x 轴范围）、`ax.set_ylim()`（y 轴范围）、`ax.set_xscale()`（x 轴刻度类型，如对数）、`ax.set_yscale()`（y 轴刻度类型）。它们都可以合并成一次 `ax.set()` 调用：

```python
ax.set(xlim=(0, 5), ylim=(-1, 1),
       title='合并设置', xlabel='x', ylabel='y')
```

`ax.set()` 接受任意 `set_*` 方法的参数名，把多个设置写在一处，代码更整洁。

## 1.2.5 图例、网格与坐标轴范围

`ax.legend()` 添加图例，显示各条曲线的标签。`ax.grid()` 控制网格线。`ax.set_xlim()` 与 `ax.set_ylim()` 设置坐标轴显示范围，`ax.axis()` 可以一次设置两者：

```python
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9], label='曲线')
ax.legend(loc='upper left')      # 图例位置
ax.grid(True, linestyle='--', alpha=0.6)   # 开启虚线网格

ax.set_xlim(0, 4)                # x 轴范围
ax.set_ylim(0, 10)               # y 轴范围
ax.axis('equal')                 # 或者用 axis 统一控制
```

`loc` 参数控制图例位置，可选 `'upper left'`、`'lower right'`、`'center'` 等，也可传数字代码（如 `1` 表示右上角）。`ax.axis('equal')` 让 x、y 轴单位长度相等，适合圆形、正方形等需要等比例显示的场景；`ax.axis('off')` 隐藏坐标轴。`ax.axis('tight')` 自动缩放至刚好容纳数据。

`ax.set_aspect()` 可单独控制纵横比，`ax.set_aspect('equal')` 与 `ax.axis('equal')` 效果类似。

## 1.2.6 双轴与共享坐标轴

### ax.twinx() 与 ax.twiny() 双轴

`ax.twinx()` 创建共享 x 轴、独立 y 轴的**孪生 Axes**，用于在同一张图上叠加量纲不同的两条曲线（如温度与降水量）。`ax.twiny()` 创建共享 y 轴、独立 x 轴的孪生 Axes：

```python
fig, ax1 = plt.subplots()
x = np.arange(0, 10, 0.5)

ax1.plot(x, x ** 2, 'b-', label='数值 A')
ax1.set_ylabel('数值 A', color='b')

ax2 = ax1.twinx()                       # 共享 x 轴
ax2.plot(x, x * 100, 'r--', label='数值 B')
ax2.set_ylabel('数值 B', color='r')

ax1.legend(loc='upper left')
ax2.legend(loc='upper right')
```

双轴常用于两个变量单位不同但趋势相关的情形。使用双轴后图例要分别挂在两个 Axes 上，且注意颜色与坐标轴对应清晰，避免读者混淆。

### ax.sharex() 与 ax.sharey() 共享坐标轴

`ax.sharex(other)` 让当前 Axes 与 `other` 共享 x 轴，`ax.sharey(other)` 共享 y 轴。共享后两个 Axes 的坐标轴范围联动，放大一个另一个同步变化，方便对齐比较：

```python
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True)   # 创建时共享
ax1.plot([1, 2, 3], [3, 1, 2])
ax2.plot([1, 2, 3], [5, 8, 6])
```

`plt.subplots(sharex=True, sharey=True)` 在创建时统一共享。共享 x 轴后通常隐藏上方的 x 刻度标签，节省垂直空间。`sharex='all'` 表示该 Figure 内全部 Axes 共享，`sharex='none'` 表示全部不共享。

## 1.2.7 Axis 坐标轴对象与刻度控制

Axis 是 Axes 内部的坐标轴对象，管理刻度位置与刻度标签。`ax.xaxis` 与 `ax.yaxis` 分别对应 x、y 轴。坐标轴上的每个刻度位置由 **Locator（定位器）** 决定，刻度标签的格式由 **Formatter（格式化器）** 决定。

获取主刻度与次刻度对象列表：

```python
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])

major_ticks = ax.xaxis.get_major_ticks()   # 主刻度 Tick 列表
minor_ticks = ax.xaxis.get_minor_ticks()   # 次刻度 Tick 列表
print(len(major_ticks))
```

`get_major_ticks()` 与 `get_minor_ticks()` 返回该轴上主、次刻度的 Tick 对象列表，每个 Tick 含刻度线与刻度标签。

设置主刻度定位器，控制刻度出现的位置：

```python
from matplotlib.ticker import MultipleLocator, MaxNLocator

ax.xaxis.set_major_locator(MultipleLocator(2))   # 主刻度每隔 2 一个
ax.xaxis.set_minor_locator(MultipleLocator(0.5)) # 次刻度每隔 0.5 一个
```

常用定位器有 `MultipleLocator(step)`（固定间隔）、`MaxNLocator(n)`（最多 n 个刻度）、`FixedLocator(ticks)`（指定位置）、`LogLocator`（对数刻度）。

设置刻度标签的格式：

```python
from matplotlib.ticker import FormatStrFormatter, FuncFormatter

ax.xaxis.set_major_formatter(FormatStrFormatter('%.1f'))   # 保留一位小数
ax.yaxis.set_minor_formatter(FormatStrFormatter('%.2f'))   # 次刻度格式

# 用函数自定义格式
def fmt(x, pos):
    return f'{x:.2f}'

ax.xaxis.set_major_formatter(FuncFormatter(fmt))
```

`set_major_formatter()` 设置主刻度标签格式，`set_minor_formatter()` 设置次刻度标签格式。常用格式化器有 `FormatStrFormatter`（printf 风格格式串）、`FuncFormatter`（自定义函数）、`PercentFormatter`（百分比）、`ScalarFormatter`（默认科学计数法）。启用次刻度标签前通常需要先开启次刻度并配合 `ax.minorticks_on()`：

```python
ax.minorticks_on()   # 显示次刻度
ax.xaxis.set_minor_locator(MultipleLocator(0.5))
ax.xaxis.set_minor_formatter(FormatStrFormatter('%.2f'))
```

`ax.minorticks_on()` 开启次刻度显示，`ax.minorticks_off()` 关闭。

## 1.2.8 Tick 刻度线对象

Tick 是坐标轴上单个刻度的对象，包含刻度线（tick line）与刻度标签（tick label）。`get_major_ticks()` 返回的每个 Tick 都能单独设置颜色、长度、标签：

```python
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])

ticks = ax.xaxis.get_major_ticks()
ticks[0].tick1line.set_color('red')      # 第一条主刻度线染红
ticks[0].label1.set_fontsize(14)         # 第一条主刻度标签字号
```

Tick 对象的常见属性有 `tick1line`（下方刻度线）、`tick2line`（上方刻度线，双轴时用）、`label1`（下方标签）、`label2`（上方标签）。整轴统一设置刻度属性时，用 Axes 的 `ax.tick_params()` 更方便：

```python
ax.tick_params(axis='x', colors='red', labelsize=10, direction='in')
ax.tick_params(axis='y', which='minor', length=2, color='green')
```

`ax.tick_params()` 的 `axis` 参数指定 `'x'`、`'y'` 或 `'both'`，`which` 参数指定 `'major'`、`'minor'` 或 `'both'`，配合 `colors`、`length`、`labelsize`、`direction`（刻度线朝内 `'in'` 或朝外 `'out'`）统一控制整轴刻度外观。

## 1.2.9 Artist 基类与 add_artist、add_patch、add_line

Artist 是所有图形元素的基类。Figure、Axes、Line2D、Text、Patch、Tick 都继承自 Artist。Artist 提供统一的属性读写接口：`set()` 批量设置属性，`get()` 或 `get_<属性名>()` 读取属性：

```python
fig, ax = plt.subplots()
line, = ax.plot([1, 2, 3], [1, 4, 9])

line.set(color='green', linewidth=3, linestyle='--')  # 批量设置
print(line.get_color())      # green
print(line.get_linewidth())  # 3.0
print(line.get_xdata())      # 数据点 x 坐标
```

`set()` 接受任意关键字参数，等价于调用对应的 `set_<属性名>()`；`get_<属性名>()` 读取单个属性。这套统一接口让用户不需要记住每个类特有的方法名。

除了绘图方法自动创建的 Artist，还可以手动创建元素并添加到 Axes 上。`ax.add_artist()` 添加任意 Artist，`ax.add_patch()` 添加 Patch（填充区域，如矩形、圆形、多边形），`ax.add_line()` 添加 Line2D：

```python
from matplotlib.patches import Rectangle, Circle

fig, ax = plt.subplots()
ax.plot([0, 1], [0, 1])

rect = Rectangle((0.2, 0.2), 0.3, 0.3, facecolor='orange', alpha=0.5)
ax.add_patch(rect)                       # 添加矩形

circle = Circle((0.8, 0.8), 0.1, facecolor='blue')
ax.add_artist(circle)                    # 添加圆形

from matplotlib.lines import Line2D
new_line = Line2D([0, 1], [0.5, 0.5], color='red', linestyle=':')
ax.add_line(new_line)                    # 添加自定义线

ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
```

`Rectangle`、`Circle` 等图形类位于 `matplotlib.patches` 模块，创建时传入位置与尺寸参数，再通过 `add_patch` 挂到 Axes 上。手动添加 Artist 适合画示意图、标注框、特殊几何形状等绘图方法无法直接覆盖的场景。要注意 `add_artist` 添加的 Artist 不会自动纳入数据范围计算，必要时手动设置 `ax.set_xlim()` 与 `ax.set_ylim()`。

## 练习题

### 第1题 概念理解

说明 Figure、Axes、Axis、Tick 四个对象的层级关系；说明 `fig.add_axes([l, b, w, h])` 中四个数值的含义；说明 `set_major_locator()` 与 `set_major_formatter()` 分别控制什么。

::: details 参考答案

层级从大到小为 Figure（画布）包含 Axes（绘图区域），每个 Axes 有 x 轴与 y 轴两个 Axis 对象，每个 Axis 上分布若干 Tick（刻度）。`add_axes` 的四元组分别是相对 Figure 宽高的 left（左边距）、bottom（下边距）、width（宽度）、height（高度），取值 0 到 1。`set_major_locator()` 控制主刻度出现的位置，`set_major_formatter()` 控制主刻度标签的显示格式。
:::

### 第2题 代码编写

创建一个 2 行 2 列的子图网格，分别在四个子图中画线图、散点图、柱状图、直方图；给每个子图设置标题与坐标轴标签；为第一幅图添加图例与网格；保存为 `subplots.png`。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

fig, axs = plt.subplots(2, 2, figsize=(8, 6))
x = np.linspace(0, 10, 50)

axs[0, 0].plot(x, np.sin(x), label='sin')
axs[0, 0].set_title('线图')
axs[0, 0].legend()
axs[0, 0].grid(True)

axs[0, 1].scatter(x, np.cos(x), s=10)
axs[0, 1].set_title('散点图')

axs[1, 0].bar(['A', 'B', 'C'], [3, 7, 5])
axs[1, 0].set_title('柱状图')

axs[1, 1].hist(np.random.randn(500), bins=20)
axs[1, 1].set_title('直方图')

fig.suptitle('2x2 子图网格')
fig.savefig('subplots.png', dpi=150)
```

:::

### 第3题 进阶练习

用 `twinx()` 在同一张图上绘制单位不同的两组数据并分别着色；用 `MultipleLocator` 与 `FormatStrFormatter` 设置主刻度间隔为 1、标签保留两位小数；再用 `add_patch` 在图上添加一个矩形标注区域。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import MultipleLocator, FormatStrFormatter
from matplotlib.patches import Rectangle

fig, ax1 = plt.subplots()
x = np.arange(0, 10)

ax1.plot(x, x ** 2, 'b-', label='平方值')
ax1.set_ylabel('平方值', color='b')
ax1.xaxis.set_major_locator(MultipleLocator(1))
ax1.xaxis.set_major_formatter(FormatStrFormatter('%.2f'))

ax2 = ax1.twinx()
ax2.plot(x, np.exp(x / 3), 'r--', label='指数值')
ax2.set_ylabel('指数值', color='r')

rect = Rectangle((4, 0), 2, 60, facecolor='gray', alpha=0.3)
ax1.add_patch(rect)

ax1.legend(loc='upper left')
ax2.legend(loc='upper right')
fig.show()
```

:::

## 常见错误

**错误 1 · 用 `plt.plot()` 连续画两张图但内容叠加在一起**

原因:pyplot 状态机始终作用于当前 Figure 与 Axes,未创建新图时内容叠在同一张图。

解决:每次画新图前用 `plt.figure()` 或 `plt.subplots()` 创建新画布,或明确持有 `fig`、`ax` 对象使用面向对象接口。

**错误 2 · `fig.add_axes([...])` 画出的小图位置或大小不对**

原因:四元组数值是相对 Figure 的比例,超出 0 到 1 范围或 left+width 超过 1 会越界。

解决:确保 left 与 width 之和不超过 1,bottom 与 height 之和不超过 1。

**错误 3 · 保存图片四周留白过多**

原因:默认 `savefig` 按 Figure 原始尺寸输出,四周有默认边距。

解决:使用 `fig.savefig(path, bbox_inches='tight')` 自动裁剪留白。

**错误 4 · 循环画图后内存占用不断上涨**

原因:循环内创建的 Figure 未关闭,对象被持续保留。

解决:每次循环结束调用 `plt.close(fig)`,或绘制完成后用 `plt.close('all')` 统一释放。

**错误 5 · 设置 `set_major_formatter` 后刻度标签没有变化**

原因:可能设置了错误的轴对象,或主刻度位置过密导致格式看不出来,也可能格式串语法有误。

解决:确认操作的是 `ax.xaxis` 或 `ax.yaxis` 对应的轴;先用 `set_major_locator` 控制刻度数量,再验证格式串(如 `'%.1f'`)。

**错误 6 · `add_patch` 添加的矩形没有出现在图中**

原因:手动添加的 Artist 不参与坐标轴范围自动计算,图形落在数据范围之外。

解决:手动调用 `ax.set_xlim()` 与 `ax.set_ylim()` 覆盖到添加元素的坐标区域。
