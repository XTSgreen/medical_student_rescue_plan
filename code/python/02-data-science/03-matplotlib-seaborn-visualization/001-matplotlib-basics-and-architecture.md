---
title: 1.1 Matplotlib 基础架构
sidebar:
  order: 1
---
# 1.1 Matplotlib 基础架构

上一节的 Pandas 内置绘图接口 `.plot()` 能快速生成图表，但定制能力有限。当需要精确控制线条样式、坐标轴刻度、图例位置或多子图排版时，需要直接使用 Matplotlib。本节回答三个核心问题：Matplotlib 是什么、它的内部由哪几层构成、如何统一管理绘图外观。理解这三件事，后续所有图表定制才有清晰的落点。本节覆盖 Matplotlib 的安装、三层架构、后端概念、全局参数配置与样式管理。

## 1.1.1 Matplotlib 概述与安装

Matplotlib 是 Python 生态中最成熟的 2D 绘图库，支持线图、散点图、柱状图、直方图、等高线图、三维图等几乎所有常见图表类型。它是 Pandas、Seaborn 等上层可视化库的底层引擎，掌握 Matplotlib 之后再学 Seaborn 会轻松很多。

安装 Matplotlib 使用 pip，在命令行执行：

```bash
pip install matplotlib
```

在 Jupyter 环境中一般已经预装，可用下面的命令确认版本：

```python
import matplotlib
print(matplotlib.__version__)
```

导入惯例是 `import matplotlib.pyplot as plt`，`pyplot` 是 Matplotlib 最常用的交互式接口模块，后续所有示例默认已导入：

```python
import matplotlib.pyplot as plt
import numpy as np
```

`numpy` 通常与 Matplotlib 配合使用，因为绘图数据大多来自 NumPy 数组。在 Jupyter Notebook 中建议同时执行魔法命令 `%matplotlib inline`，让图表直接内嵌显示，省去手动调用 `plt.show()`。

## 1.1.2 Matplotlib 的三层架构

Matplotlib 从上到下分为三层：**Scripting 层（pyplot）**、**Artist 层**、**Backend 层**。理解这三层的关系，就能明白为什么同一张图既可以用 `plt.plot()` 画，也可以用 `fig.axes.plot()` 画。

### Scripting 层（pyplot）

pyplot 是面向普通用户的高层接口。它内部维护一个**当前图形（current figure）**与**当前坐标轴（current axes）**的状态机，调用 `plt.plot()`、`plt.title()` 时会自动作用在当前对象上。对多数日常绘图，直接使用 pyplot 足够：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 100)
plt.plot(x, np.sin(x))        # 画线，自动创建当前 Figure 与 Axes
plt.title('正弦函数')          # 设置标题，作用在当前 Axes
plt.show()
```

pyplot 适合快速出图，缺点是不适合复杂排版：状态机在多个子图、多个坐标轴同时存在时容易混淆。面向对象接口更精确。

### Artist 层

Artist 层是 Matplotlib 的对象模型层。图上的每一个元素（线条、文字、坐标轴、刻度、图例）都是一个 Artist 对象，继承自 `matplotlib.artist.Artist`。Figure、Axes、Axis、Line2D、Text 都属于 Artist。直接操作 Artist 对象可以精确控制每个元素的属性，这种用法称为**面向对象接口**：

```python
fig, ax = plt.subplots()
line, = ax.plot(x, np.sin(x))     # line 是 Line2D 对象
line.set_linewidth(2)             # 直接设置对象属性
line.set_color('red')
fig.show()
```

Artist 对象通过 `set_*` 与 `get_*` 方法读写属性，也支持统一的 `set()` 与 `get()`。这部分内容在下一节展开。

### Backend 层

Backend 层负责把 Artist 描述的图形渲染到具体目标上，目标可以是屏幕窗口、图片文件或矢量格式。用户写的绘图代码与 Backend 无关，切换渲染目标只需更换 Backend。例如同样一份绘图代码，在交互式 Backend 下弹出窗口，在 `Agg` 后端下直接保存为 PNG。

三层架构的关系可以这样概括：pyplot 把用户的简短调用翻译成 Artist 对象的创建与属性设置，Artist 对象描述图形的完整结构，Backend 把这份结构绘制到屏幕或文件。

## 1.1.3 后端（Backend）概念

Backend 决定图形输出到哪里。Matplotlib 把 Backend 分为两类：**交互式后端**与**非交互式后端**。

交互式后端在桌面环境弹出窗口，支持缩放、平移等交互操作，例如 `TkAgg`、`QtAgg`、`GTK4Agg`。非交互式后端不弹窗口，直接把图形渲染到文件，最常用的是 **Agg**（Anti-Grain Geometry），它是纯图像渲染引擎，支持 PNG、PDF、SVG、EPS 等格式，适合服务器、脚本与批量出图场景。

查看当前使用哪个后端：

```python
import matplotlib
print(matplotlib.get_backend())
```

在脚本开头用 `matplotlib.use()` 指定后端，必须放在导入 `pyplot` 之前才生效：

```python
import matplotlib
matplotlib.use('Agg')   # 非交互式后端，不弹窗口
import matplotlib.pyplot as plt

plt.plot([1, 2, 3], [4, 5, 6])
plt.savefig('output.png')   # 直接保存
```

选择后端的依据是运行环境。在无显示器（无 GUI 环境）的服务器上使用默认交互后端会报错，此时必须改用 `Agg`。在桌面脚本里想保留交互窗口，就用 `TkAgg` 或 `QtAgg`。`plt.show()` 在非交互式后端下是空操作，图片只能通过 `savefig` 落盘。

## 1.1.4 rcParams 全局参数配置

`matplotlib.rcParams` 是一个保存全部默认参数的字典，覆盖图形尺寸、字体、颜色、线宽、坐标轴样式等几乎所有可配置项。修改它相当于改变全库的默认行为，一次设置后续所有图表生效。

查看当前全部参数或某个参数：

```python
import matplotlib.pyplot as plt

print(plt.rcParams['figure.figsize'])    # 默认图形尺寸 [6.4, 4.8]
print(plt.rcParams['lines.linewidth'])   # 默认线宽 1.5
```

按需修改常用参数：

```python
plt.rcParams['figure.figsize'] = (8, 5)      # 默认图形尺寸
plt.rcParams['font.sans-serif'] = ['SimHei'] # 中文字体
plt.rcParams['axes.unicode_minus'] = False   # 正确显示负号
plt.rcParams['lines.linewidth'] = 2          # 默认线宽
plt.rcParams['axes.grid'] = True             # 默认显示网格
```

以上配置在交互式环境中生效。中文字体配置是中文图表最常见的需求：Matplotlib 默认字体不含中文字形，需要指定系统中文字体（如 `SimHei`、`Microsoft YaHei`、`SimSun`），并把 `axes.unicode_minus` 设为 `False`，否则负号会显示成方块。

`rcParams` 是全局共享的字典，修改会影响当前进程中的全部图表。若只想在部分图表生效，用下一节的 `style.context()` 或直接给绘图函数传参。

## 1.1.5 matplotlib.rc() 运行时参数修改

`matplotlib.rc()` 是 `rcParams` 的分组修改接口，按**参数组**批量设置，适合一次更新同一主题的多项参数。参数组名对应 `rcParams` 键名去掉前缀后的部分，例如 `lines.linewidth` 属于 `lines` 组，`font.family` 属于 `font` 组。

```python
import matplotlib

# 按组设置线条参数
matplotlib.rc('lines', linewidth=2, linestyle='--', color='g')

# 按组设置字体参数
matplotlib.rc('font', family='sans-serif', size=12)

# 按组设置坐标轴参数
matplotlib.rc('axes', titlesize=16, grid=True)
```

每个关键字参数会自动映射到 `rcParams['组.参数名']`。`matplotlib.rc('lines', linewidth=2)` 等价于 `plt.rcParams['lines.linewidth'] = 2`，只是写法更简洁。还有一个 `matplotlib.rc_context()` 函数，与 `style.context()` 类似，以上下文管理器方式临时生效，退出上下文后自动恢复：

```python
with matplotlib.rc_context({'lines.linewidth': 3, 'axes.grid': True}):
    plt.plot([1, 2, 3], [4, 5, 6])   # 临时生效的线宽与网格
    plt.show()

# 退出 with 后恢复默认线宽
```

`rc()` 适合集中修改一类参数，`rc_context()` 适合临时覆盖且不想影响后续图表。

## 1.1.6 matplotlib.style.context() 上下文样式管理

Matplotlib 提供预置的**样式表（style sheet）**，类似网页的 CSS 主题，一条语句即可整体切换外观。`plt.style.use()` 全局应用某套样式，`plt.style.context()` 以上下文管理器方式局部应用。

查看可用的预置样式：

```python
import matplotlib.pyplot as plt

print(plt.style.available)
```

输出中包含 `ggplot`、`seaborn-v0_8`、`classic`、`fast`、`Solarize_Light2`、`dark_background` 等。其中 `seaborn-v0_8-*` 系列是 Matplotlib 内置的 Seaborn 风格主题，`classic` 是 Matplotlib 老版本默认外观，`dark_background` 适合深色演示场景。

全局应用一套样式，对后续所有图表生效：

```python
plt.style.use('ggplot')
```

临时应用样式，只作用于当前上下文：

```python
with plt.style.context('dark_background'):
    fig, ax = plt.subplots()
    ax.plot([1, 2, 3], [4, 5, 6])
    fig.savefig('dark.png')
# 退出 with 后恢复之前的样式
```

`style.context()` 的最大价值是隔离性：把一组绘图代码放进 `with` 块，无论外层全局样式是什么，块内使用指定主题，退出后立即还原，适合在同一脚本里混排多种风格的图。

`plt.style.context()` 也支持传入样式名列表或 `rcParams` 字典，前者按顺序叠加多个样式，后者直接指定自定义参数。优先使用上下文管理而不是反复修改 `rcParams`，代码更清晰，也更不容易污染全局状态。

## 练习题

### 第1题 概念理解

说明 Matplotlib 三层架构各自的作用；说明交互式后端与非交互式后端的区别；说明在无 GUI 的服务器上绘图应该使用哪个后端以及为什么。

::: details 参考答案

Scripting 层（pyplot）提供高层状态机接口，自动作用于当前 Figure 与 Axes；Artist 层是对象模型层，每个图形元素都是 Artist 对象，可精确控制属性；Backend 层负责渲染到屏幕或文件。交互式后端（如 `TkAgg`）弹出可交互窗口，非交互式后端（如 `Agg`）只渲染到文件。无 GUI 服务器没有显示环境，交互后端无法创建窗口，应改用 `Agg` 并通过 `savefig` 保存图片。
:::

### 第2题 代码编写

完成以下任务：安装并导入 Matplotlib；把默认图形尺寸改为 `(10, 6)`、默认线宽改为 `2`；使用 `matplotlib.rc()` 按组设置 `lines` 参数；用 `plt.style.context('ggplot')` 画一张图并保存为 PNG。

::: details 参考答案

```python
import matplotlib
import matplotlib.pyplot as plt
import numpy as np

# 修改全局默认参数
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['lines.linewidth'] = 2

# 按组设置线条参数
matplotlib.rc('lines', linewidth=2, linestyle='--')

# 上下文样式管理
with plt.style.context('ggplot'):
    x = np.linspace(0, 2 * np.pi, 100)
    plt.plot(x, np.sin(x), label='sin')
    plt.plot(x, np.cos(x), label='cos')
    plt.legend()
    plt.savefig('ggplot_style.png')
```

:::

### 第3题 进阶练习

用 `plt.style.available` 查看可用样式；写一个脚本比较同一份数据在 `classic`、`ggplot`、`dark_background` 三种样式下的表现，分别保存为三张图；在服务器脚本中把后端切换为 `Agg`，验证 `plt.show()` 不弹窗且 `savefig` 正常产出图片。

::: details 参考答案

```python
import matplotlib
matplotlib.use('Agg')   # 必须在导入 pyplot 之前
import matplotlib.pyplot as plt
import numpy as np

print(plt.style.available)

x = np.linspace(0, 2 * np.pi, 100)
y = np.sin(x)

for style in ['classic', 'ggplot', 'dark_background']:
    with plt.style.context(style):
        fig, ax = plt.subplots()
        ax.plot(x, y)
        ax.set_title(f'样式：{style}')
        fig.savefig(f'{style}.png')

# 在 Agg 后端下 show() 是空操作，图片已通过 savefig 落盘
print('后端：', matplotlib.get_backend())
```

:::

## 常见错误

**错误 1 · 在服务器上绘图报错 "no display name and no $DISPLAY environment variable"**

原因:默认使用交互式后端,在无 GUI 环境无法创建窗口。

解决:在导入 pyplot 之前用 `matplotlib.use('Agg')` 切换到非交互式后端,并改用 `savefig` 保存。

**错误 2 · 设置 `matplotlib.use()` 后提示无效或报错**

原因:`use()` 必须在导入 `pyplot` 之前调用,导入后再设置会报 `ValueError`。

解决:把 `matplotlib.use('Agg')` 放在脚本最前面,先于任何 `import matplotlib.pyplot`。

**错误 3 · 中文标签显示为方块**

原因:Matplotlib 默认字体不包含中文字形。

解决:设置中文字体,例如 `plt.rcParams['font.sans-serif'] = ['SimHei']`,同时设置 `plt.rcParams['axes.unicode_minus'] = False` 修复负号显示。

**错误 4 · 修改 `rcParams` 后其他图表也被改变**

原因:`rcParams` 是全局字典,修改对当前进程全部图表生效。

解决:只想局部生效时使用 `plt.style.context()` 或 `matplotlib.rc_context()`,把绘图代码放进 `with` 块。
