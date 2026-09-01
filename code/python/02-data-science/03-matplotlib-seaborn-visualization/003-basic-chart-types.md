---
title: 1.3 基本图表类型
sidebar:
  order: 3
---
# 1.3 基本图表类型

上一节建立了 Figure、Axes、Axis 的对象体系，本节把这些对象用到实际绘图上。数据分析中最常遇到的图表类型大约十几种，选对图表是数据可视化的第一步：趋势用线图，分布用直方图或箱线图，类别比较用柱状图，构成占比用饼图。本节逐个介绍 13 种基本图表，每种都给出关键参数说明与代码示例，并说明适用场景。每种图表既有 pyplot 全局函数形式（`plt.xxx()`），也有面向对象的 Axes 方法形式（`ax.xxx()`），两者参数一致，本节以 Axes 方法为主演示。

## 1.3.1 线图 plot()

线图用折线连接数据点，适合展示随时间或连续变量变化的趋势，是默认图表类型。关键参数有 `linestyle`（线型）、`linewidth`（线宽）、`marker`（数据点标记）、`color`（颜色）、`label`（图例标签）：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 100)
fig, ax = plt.subplots()

ax.plot(x, np.sin(x), color='blue', linestyle='-', linewidth=2,
        marker='', label='sin')
ax.plot(x, np.cos(x), color='red', linestyle='--', linewidth=1.5,
        marker='o', markersize=3, label='cos')
ax.legend()
fig.show()
```

`linestyle` 常见取值有 `'-'`（实线）、`'--'`（虚线）、`'-.'`（点划线）、`':'`（点线），也可写 `'None'` 只画标记。`marker` 取值如 `'o'`（圆点）、`'s'`（方块）、`'^'`（三角）、`'*'`（星号）。多个数据集依次调用 `ax.plot()` 即可叠加在同一坐标轴上。`plt.plot()` 支持 `plt.plot(x1, y1, 'b-', x2, y2, 'r--')` 的简写格式，格式字符串把颜色、线型、标记合并书写。

## 1.3.2 散点图 scatter()

散点图用点的位置展示两个变量的关系，适合观察相关性、聚类与异常点。关键参数有 `s`（点大小）、`c`（颜色，可映射到数值）、`alpha`（透明度）、`cmap`（颜色映射）：

```python
rng = np.random.default_rng(42)
x = rng.normal(0, 1, 200)
y = rng.normal(0, 1, 200)
z = x ** 2 + y ** 2

fig, ax = plt.subplots()
sc = ax.scatter(x, y, s=30, c=z, cmap='viridis', alpha=0.7)
cb = fig.colorbar(sc)          # 颜色条，展示 c 数值与颜色的对应
cb.set_label('数值大小')
ax.set_xlabel('x')
ax.set_ylabel('y')
fig.show()
```

`s` 可以是标量（统一大小）或与数据等长的数组（逐点大小），`c` 可以是单个颜色名、颜色列表或数值数组，数值数组配合 `cmap` 自动着色并可用 `fig.colorbar()` 添加颜色条。常用 `cmap` 有 `'viridis'`、`'plasma'`、`'coolwarm'`。散点图的点较多时可调低 `alpha` 观察密度重叠区。

## 1.3.3 柱状图 bar() 与 barh()

柱状图用矩形高度比较离散类别的数值。`ax.bar()` 画垂直柱状图，`ax.barh()` 画水平柱状图，水平版本适合类别名较长的场景。关键参数有 `width`（柱宽）、`bottom`（起点）、`color`、`edgecolor`、`label`：

```python
categories = ['A', 'B', 'C', 'D']
values = [23, 45, 12, 37]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

ax1.bar(categories, values, width=0.6, color='skyblue',
        edgecolor='black', label='销量')
ax1.set_title('垂直柱状图')
ax1.legend()

ax2.barh(categories, values, height=0.6, color='orange')
ax2.set_title('水平柱状图')
fig.tight_layout()
fig.show()
```

`width`（垂直时）与 `height`（水平时）控制柱的粗细，`bottom` 或 `left` 设置柱的起始基线。多组柱状图通过调整位置并排：给每组 `x` 加上偏移量并设较窄的 `width`：

```python
x = np.arange(4)
width = 0.35

fig, ax = plt.subplots()
ax.bar(x - width / 2, [20, 35, 30, 25], width, label='组1')
ax.bar(x + width / 2, [25, 30, 35, 20], width, label='组2')
ax.set_xticks(x)
ax.set_xticklabels(['A', 'B', 'C', 'D'])
ax.legend()
fig.show()
```

## 1.3.4 直方图 hist()

直方图统计数据在若干区间内的频数，展示数值型数据的分布形态。关键参数有 `bins`（区间数或区间边界）、`density`（归一化为概率密度）、`cumulative`（累积分布）、`histtype`（直方图样式）、`alpha`：

```python
data = np.random.default_rng(7).normal(0, 1, 1000)

fig, ax = plt.subplots()
ax.hist(data, bins=30, density=True, histtype='stepfilled',
        alpha=0.7, color='steelblue', label='密度直方图')
ax.set_xlabel('取值')
ax.set_ylabel('概率密度')
ax.legend()
fig.show()
```

`bins` 接受整数（等宽区间个数）或数组（自定义区间边界），区间过少丢失细节、过多噪声明显。`density=True` 时纵轴为概率密度，便于与理论分布曲线叠加比较；`cumulative=True` 画出累积分布。`histtype` 可选 `'bar'`、`'step'`（轮廓线）、`'stepfilled'`（填充轮廓）。`ax.hist()` 的返回值包括 `(n, bins, patches)`，其中 `n` 是各区间计数，可继续用于计算。

## 1.3.5 饼图 pie()

饼图用扇形面积展示各部分占整体的比例，适合类别不多（建议 6 个以内）的构成分析。关键参数有 `labels`（标签）、`explode`（扇区分离）、`autopct`（百分比格式）、`shadow`（阴影）、`startangle`（起始角度）：

```python
sizes = [35, 25, 20, 15, 5]
labels = ['甲', '乙', '丙', '丁', '其他']
explode = [0, 0.05, 0, 0, 0]   # 第二块扇区突出

fig, ax = plt.subplots()
ax.pie(sizes, labels=labels, explode=explode,
       autopct='%1.1f%%', shadow=False, startangle=90)
ax.set_title('构成占比')
fig.show()
```

`explode` 是与数据等长的数组，数值表示该扇区向外偏移的距离；`autopct` 用格式串显示百分比；`startangle` 设定第一块扇区的起始角度，常用 `90` 让扇形从正上方开始。饼图各扇区默认从逆时针排列。类别过多或比例悬殊时饼图可读性差，优先考虑柱状图。

## 1.3.6 箱线图 boxplot()

箱线图用一个箱子概括数据的分布：箱体上下边界是四分位数（Q1 与 Q3），箱中横线是中位数，触须延伸到非异常范围，超出触须的点单独标出。适合比较多组数据的分布。关键参数有 `notch`（缺口）、`vert`（方向）、`patch_artist`（填充箱体）、`labels`：

```python
rng = np.random.default_rng(3)
groups = [rng.normal(0, 1, 100) for _ in range(4)]

fig, ax = plt.subplots()
bp = ax.boxplot(groups, labels=['组1', '组2', '组3', '组4'],
                patch_artist=True, notch=True)
for patch in bp['boxes']:
    patch.set_facecolor('lightblue')
ax.set_ylabel('数值')
fig.show()
```

`patch_artist=True` 允许用 `bp['boxes']` 中的 Patch 对象给箱体上色，`notch=True` 在箱体上开缺口标识中位数置信区间。`ax.boxplot()` 的返回值是字典，键包括 `'boxes'`、`'medians'`、`'whiskers'`、`'caps'`、`'fliers'`（异常点），可用于精细定制。箱线图能快速看出中位数、离散度与异常点，但会掩盖分布内部的多峰形态。

## 1.3.7 小提琴图 violinplot()

小提琴图是箱线图与核密度估计的结合：左右对称的轮廓是数据的核密度曲线，轮廓越宽表示该取值处概率越高，内部常叠加箱线图信息。适合比较多组数据的分布形态。关键参数有 `showmedians`、`showextrema`、`widths`：

```python
rng = np.random.default_rng(5)
data = [rng.normal(i, 1, 200) for i in range(4)]

fig, ax = plt.subplots()
vp = ax.violinplot(data, showmedians=True, showextrema=True,
                   widths=0.8)
ax.set_xticks(range(1, 5))
ax.set_xticklabels(['组1', '组2', '组3', '组4'])
ax.set_ylabel('数值')
fig.show()
```

`showmedians=True` 显示中位数线，`showextrema=True` 显示最大值与最小值范围线，`widths` 控制小提琴宽度。与小提琴图相比，箱线图更简洁，小提琴图能暴露多峰、偏态等细节，但轮廓较宽时类别一多容易重叠。

## 1.3.8 面积图 fill_between() 与 fill_betweenx()

`ax.fill_between()` 填充两条曲线之间的区域，常用于凸显区间、置信带或累积区域；`ax.fill_betweenx()` 是横向版本，按 y 方向填充。关键参数有 `where`（填充条件）、`alpha`、`interpolate`：

```python
x = np.linspace(0, 10, 200)
y = np.sin(x) * x / 3

fig, ax = plt.subplots()
ax.plot(x, y, 'b-', label='信号')
ax.fill_between(x, y, where=(y > 0), color='blue', alpha=0.3,
                label='正值区间')
ax.fill_between(x, y, where=(y < 0), color='red', alpha=0.3,
                label='负值区间')
ax.legend()
fig.show()
```

`where` 接收布尔数组，只填充满足条件的区域，常与 `interpolate=True` 搭配让填充边界平滑过渡。不带 `where` 时填充曲线与 x 轴之间（或两条曲线之间）的全部区域：

```python
x = np.linspace(0, 10, 100)
y1 = np.sin(x) + 2
y2 = np.cos(x) + 2
ax.fill_between(x, y1, y2, alpha=0.3, color='green')   # 两条曲线之间
```

`fill_betweenx(y, x1, x2)` 参数顺序与 `fill_between` 相反，第一参数是 y 轴数据，适合横向填充。

## 1.3.9 堆叠图 stackplot()

`ax.stackplot()` 绘制堆叠面积图，把多个序列从上到下堆叠，总面积反映总和，适合展示随时间变化的构成。关键参数有 `baseline`（基线方式）、`labels`、`colors`：

```python
x = np.arange(10)
series = [
    np.array([3, 4, 5, 4, 6, 7, 8, 9, 9, 10]),
    np.array([1, 2, 2, 3, 3, 3, 4, 4, 5, 5]),
    np.array([5, 4, 4, 5, 4, 3, 3, 2, 2, 1]),
]

fig, ax = plt.subplots()
ax.stackplot(x, series, labels=['甲', '乙', '丙'],
             colors=['#4C72B0', '#55A868', '#C44E52'], alpha=0.8)
ax.legend(loc='upper left')
ax.set_xlabel('时间')
ax.set_ylabel('总量')
fig.show()
```

`series` 可以是列表的列表，每个子列表是一个堆叠层。`baseline='zero'` 从零堆叠，`baseline='wiggle'` 为溪流图（streamgraph）样式，`baseline='sym'` 以中线对称。堆叠图强调总和与构成变化，但各层内部趋势会相互掩盖，需要对比单层时改用多线图。

## 1.3.10 阶梯图 step()

`ax.step()` 绘制阶梯状折线，数据在相邻点之间保持水平直到下一个点，适合离散时序数据（如开关状态、按阶段计费）。关键参数有 `where`（台阶对齐方式）：

```python
x = np.arange(6)
y = np.array([2, 5, 3, 6, 4, 7])

fig, ax = plt.subplots()
ax.step(x, y, where='post', label='post 对齐')
ax.step(x, y + 1, where='mid', label='mid 对齐')
ax.step(x, y + 2, where='pre', label='pre 对齐')
ax.legend()
fig.show()
```

`where` 参数控制台阶对齐：`'pre'` 表示数据值在到达该点之前保持，`'post'` 表示在到达该点之后保持，`'mid'` 表示在两个点中间切换。阶梯图与折线图的区别在于不直接连接相邻点，而是水平跳变，适合表达状态保持类数据。

## 1.3.11 茎叶图 stem()

`ax.stem()` 把每个数据点画成一条从基线（默认 y=0）出发的竖线与顶端标记，适合展示离散序列的取值。关键参数有 `linefmt`（竖线格式）、`markerfmt`（标记格式）、`basefmt`（基线格式）、`bottom`（基线位置）：

```python
x = np.linspace(0, 2 * np.pi, 20)
y = np.sin(x)

fig, ax = plt.subplots()
markerline, stemlines, baseline = ax.stem(
    x, y, linefmt='-b', markerfmt='o', basefmt='-k', bottom=0)
ax.set_ylabel('sin 值')
fig.show()
```

`ax.stem()` 返回三元组 `(markerline, stemlines, baseline)`，分别对应标记、竖线与基线的 Artist 对象，可继续单独设置属性。`linefmt`、`markerfmt`、`basefmt` 使用与 `plot()` 相同的颜色线型格式字符串。茎叶图适合展示每个离散位置的取值强度。

## 1.3.12 误差棒图 errorbar()

`ax.errorbar()` 在数据点上绘制误差棒，表达测量的不确定度，常用于实验数据展示。关键参数有 `xerr`、`yerr`、`fmt`、`capsize`、`ecolor`：

```python
x = np.arange(5)
y = np.array([12, 15, 13, 18, 16])
yerr = np.array([1.5, 2.0, 1.0, 2.5, 1.8])

fig, ax = plt.subplots()
ax.errorbar(x, y, yerr=yerr, fmt='o-', capsize=4,
            ecolor='red', elinewidth=1.5, label='均值 ± 标准差')
ax.set_xticks(x)
ax.set_xticklabels(['样本1', '样本2', '样本3', '样本4', '样本5'])
ax.legend()
fig.show()
```

`yerr` 与 `xerr` 指定误差范围，可以是标量（全部点统一）、数组（逐点）或 `(2, N)` 形状的数组（上下不对称）。`fmt` 是数据点与连线格式，`capsize` 控制误差棒端帽大小，`ecolor` 设置误差棒颜色。误差棒数据常来自多次重复测量的标准差或标准误。

## 1.3.13 事件线图 eventplot()

`ax.eventplot()` 用一组短竖线表示离散事件的发生位置，适合展示时间线上的事件分布、多条记录的并发关系。关键参数有 `lineoffsets`（各事件行的偏移）、`linelengths`（线长度）、`colors`：

```python
rng = np.random.default_rng(11)
events = [rng.uniform(0, 100, 20) for _ in range(3)]   # 三行事件

fig, ax = plt.subplots()
ax.eventplot(events, lineoffsets=[1, 2, 3], linelengths=0.6,
             colors=['C0', 'C1', 'C2'])
ax.set_ylim(0.4, 3.6)
ax.set_yticks([1, 2, 3])
ax.set_yticklabels(['通道A', '通道B', '通道C'])
ax.set_xlabel('时间')
fig.show()
```

`events` 是列表的列表，每个子列表是一行事件的时间位置；`lineoffsets` 指定每行在 y 方向的位置；`linelengths` 控制线的长度；`colors` 逐行着色。事件线图适合神经元放电、日志记录、日程冲突等离散事件可视化，比散点图更适合密集时间点的展示。

## 练习题

### 第1题 概念理解

分别说明线图、散点图、柱状图、直方图、箱线图的适用场景；说明 `ax.hist()` 中 `bins` 与 `density` 参数的作用；说明 `ax.errorbar()` 中 `xerr`、`yerr` 与 `capsize` 的含义。

::: details 参考答案

线图展示趋势，散点图展示两变量关系，柱状图比较离散类别数值，直方图展示数值分布，箱线图概括分布并识别异常点。`bins` 指定直方图区间数或边界，`density=True` 把纵轴归一化为概率密度。`xerr`、`yerr` 分别是 x、y 方向的误差范围，`capsize` 是误差棒端帽的大小。
:::

### 第2题 代码编写

生成 500 个标准正态随机数，在同一个 Figure 中并排画直方图、箱线图与小提琴图对比三种可视化对同一分布的呈现；给直方图添加概率密度归一化并叠加一条理论正态密度曲线。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(12)
data = rng.normal(0, 1, 500)

fig, axs = plt.subplots(1, 3, figsize=(12, 4))

axs[0].hist(data, bins=30, density=True, alpha=0.7, color='steelblue')
x = np.linspace(-4, 4, 200)
axs[0].plot(x, 1 / np.sqrt(2 * np.pi) * np.exp(-x ** 2 / 2),
            'r-', label='理论正态')
axs[0].set_title('直方图 + 密度曲线')
axs[0].legend()

axs[1].boxplot(data)
axs[1].set_title('箱线图')

axs[2].violinplot(data, showmedians=True)
axs[2].set_title('小提琴图')

fig.tight_layout()
fig.show()
```

:::

### 第3题 进阶练习

用 `bar()` 绘制两组数据的并排柱状图并设置图例；用 `stackplot()` 展示三个序列随时间的构成变化；用 `eventplot()` 绘制三行随机事件并分别着色；用 `fill_between()` 给一条正弦曲线标注正负区间。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(8)
fig = plt.figure(figsize=(12, 8))

# 并排柱状图
ax1 = fig.add_subplot(2, 2, 1)
x = np.arange(4)
width = 0.35
ax1.bar(x - width / 2, [20, 35, 30, 25], width, label='组1')
ax1.bar(x + width / 2, [25, 30, 35, 20], width, label='组2')
ax1.set_xticks(x)
ax1.set_xticklabels(['A', 'B', 'C', 'D'])
ax1.legend()
ax1.set_title('并排柱状图')

# 堆叠图
ax2 = fig.add_subplot(2, 2, 2)
xx = np.arange(10)
series = [rng.integers(1, 10, 10) for _ in range(3)]
ax2.stackplot(xx, series, labels=['甲', '乙', '丙'], alpha=0.8)
ax2.legend(loc='upper left')
ax2.set_title('堆叠图')

# 事件线图
ax3 = fig.add_subplot(2, 2, 3)
events = [rng.uniform(0, 100, 20) for _ in range(3)]
ax3.eventplot(events, lineoffsets=[1, 2, 3], linelengths=0.6,
              colors=['C0', 'C1', 'C2'])
ax3.set_yticks([1, 2, 3])
ax3.set_title('事件线图')

# 面积图
ax4 = fig.add_subplot(2, 2, 4)
x = np.linspace(0, 2 * np.pi, 200)
y = np.sin(x)
ax4.plot(x, y, 'k-')
ax4.fill_between(x, y, where=(y > 0), color='blue', alpha=0.3)
ax4.fill_between(x, y, where=(y < 0), color='red', alpha=0.3)
ax4.set_title('面积图标注区间')

fig.tight_layout()
fig.show()
```

:::

## 常见错误

**错误 1 · 直方图 `bins` 传字符串如 `'auto'` 报类型错误**

原因:旧版本 `bins` 只接受整数或序列,新版本虽支持字符串但某些环境仍不识别。

解决:传整数或自定义边界数组,如 `bins=30` 或 `bins=np.arange(-4, 4, 0.5)`。

**错误 2 · 饼图各扇区比例之和不为 1 或显示异常**

原因:传入的数值本身不成比例,或 `autopct` 格式串写错。

解决:确认数据非负且总数有意义;`autopct='%1.1f%%'` 中末尾的两个 `%%` 是转义后的百分号。

**错误 3 · 箱线图返回的 `bp` 无法直接上色**

原因:`boxplot()` 默认不填充箱体,返回字典里的 `boxes` 是 Line2D 而非可填充的 Patch。

解决:设置 `patch_artist=True`,再用 `bp['boxes']` 的 `set_facecolor()` 填充。

**错误 4 · `fill_between` 填充区域超出预期**

原因:`where` 条件与 x 数组长度不一致,或未设置 `interpolate=True` 导致边界锯齿。

解决:确保 `where` 与 x 等长;需要平滑边界时加 `interpolate=True`。

**错误 5 · `stem()` 返回值被当成单个对象使用**

原因:`ax.stem()` 返回的是 `(markerline, stemlines, baseline)` 三元组,直接访问属性会报错。

解决:用 `markerline, stemlines, baseline = ax.stem(...)` 解包后再操作。

**错误 6 · `errorbar` 的误差棒看不见或太短**

原因:误差范围相对数据量级过小,或 `capsize` 默认值为 0。

解决:检查 `xerr`/`yerr` 量级是否合理,设置 `capsize=4` 让端帽可见。
