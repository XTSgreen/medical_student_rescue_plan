---
title: 1.10 样式与主题
sidebar:
  order: 10
---
# 1.10 样式与主题

同一份数据换一种样式，图表的观感完全不同。默认样式的白底黑框适合快速探索，论文投稿需要无框、紧凑的样式，报告演示需要更大字号与更粗线条。Matplotlib 把一组统一的视觉设置打包成样式表（style），一键切换，也可以把设置写入自定义样式文件与 rcParams。本节讲解内置样式表、样式切换、临时样式、自定义样式文件与常用 rcParams 配置项。

## 1.10.1 内置样式表

`plt.style.available` 列出所有内置样式表名称：

```python
import matplotlib.pyplot as plt

print(plt.style.available)
```

常见的内置样式：

| 样式名 | 风格特点 |
| --- | --- |
| `'default'` | Matplotlib 默认样式 |
| `'classic'` | 经典样式，接近旧版本观感 |
| `'ggplot'` | 仿 R 语言 ggplot2，灰底白网格 |
| `'seaborn-v0_8'` | 仿 Seaborn 风格，浅灰网格 |
| `'bmh'` | 仿 Bayesian Methods for Hackers 配色 |
| `'fivethirtyeight'` | 仿数据新闻网站风格，粗网格 |
| `'dark_background'` | 深色背景，适合夜间或演示 |
| `'grayscale'` | 全部转灰度，适合黑白打印 |
| `'tableau-colorblind10'` | 色盲友好的颜色序列 |

样式表按前缀分组：以 `seaborn-` 开头的都是仿 Seaborn 的变体，以 `_mpl-gallery` 开头的用于官方画廊示例。列出名称后可以直接使用：

```python
plt.style.available[:10]   # 查看前 10 个样式名
```

样式名与配色板的区别：样式表控制整套视觉设置（背景色、字体、线宽、刻度密度、坐标轴颜色），配色板只控制颜色循环。样式切换后颜色循环也随样式变化。

## 1.10.2 样式切换与临时样式

`plt.style.use()` 全局切换样式，之后所有图都使用新样式。可以传入单个样式名，也可以传列表按顺序叠加（后面的优先级更高）：

```python
plt.style.use('ggplot')              # 切换到 ggplot 样式
plt.style.use(['seaborn-v0_8', 'dark_background'])  # 叠加多个样式
```

切换后立即影响后续绘图，包括颜色循环、坐标轴颜色与网格。恢复默认样式：

```python
plt.style.use('default')   # 回到默认样式
```

`plt.style.context()` 把样式限定在上下文内，离开 `with` 块后自动恢复之前的样式，适合临时换风格：

```python
with plt.style.context('dark_background'):
    fig, ax = plt.subplots()
    ax.plot([0, 1, 2], [0, 1, 4])   # 这段代码内使用深色背景

# 离开 with 后恢复默认样式
fig2, ax2 = plt.subplots()
ax2.plot([0, 1, 2], [0, 1, 4])      # 默认样式
```

`plt.style.context()` 与 `plt.style.use()` 的差别：`use` 是全局永久生效，`context` 只在代码块内生效，适合单张图特制样式而不影响其他图。`context` 也支持样式名列表。

`'classic'` 是经典样式，保留旧版本 Matplotlib 的行为（例如关闭自动间距调整、颜色序列为旧配色），需要复刻老文献配图时使用：

```python
with plt.style.context('classic'):
    fig, ax = plt.subplots()
    ax.plot([0, 1, 2], [0, 1, 4])
```

## 1.10.3 自定义样式文件

样式可以写进 `.mplstyle` 文本文件，文件里每行一条 `rcParams` 设置，格式为 `键: 值`，注释以 `#` 开头：

```
# 自定义样式文件 my_style.mplstyle
figure.figsize: 8, 5
figure.dpi: 120
font.size: 12
font.family: sans-serif
lines.linewidth: 2
lines.markersize: 8
axes.titlesize: 14
axes.labelsize: 12
xtick.labelsize: 10
ytick.labelsize: 10
legend.fontsize: 10
axes.grid: True
grid.linestyle: --
savefig.dpi: 300
```

`.mplstyle` 文件的取值规则：数值之间用逗号分隔（如 `figure.figsize: 8, 5`），布尔值写 `True`、`False`，颜色写颜色名或十六进制。文件保存后用路径加载：

```python
plt.style.use('my_style.mplstyle')          # 用文件名（需在可搜索路径）
plt.style.use('D:/styles/my_style.mplstyle')  # 用完整路径
```

样式文件放在脚本同目录时直接写文件名即可；写完整路径最稳妥。加载后同样可以用 `plt.style.use('default')` 恢复。自定义样式可以与其他样式叠加，`use(['base', 'my_style.mplstyle'])` 让后者覆盖前者相同键的设置。

## 1.10.4 rcParams 常用配置项

`plt.rcParams` 是全局参数字典，存放所有视觉设置的当前值，样式表本质就是批量修改 `rcParams`。直接改 `plt.rcParams` 等效于自定义样式：

```python
plt.rcParams['figure.figsize'] = (8, 5)
plt.rcParams['font.size'] = 12
```

`plt.rcParams` 是全局生效，局部修改用 `plt.rc()` 函数一次性设置多个键：

```python
plt.rc('font', size=12, family='sans-serif')
plt.rc('axes', titlesize=14, labelsize=12)
plt.rc('xtick', labelsize=10)
```

常用的 `rcParams` 键：

| 键 | 作用 | 常用取值 |
| --- | --- | --- |
| `figure.figsize` | 图尺寸（英寸，宽, 高） | `(8, 5)` |
| `figure.dpi` | 图分辨率 | `100` |
| `font.size` | 全局字号基准 | `12` |
| `font.family` | 字体族 | `'sans-serif'`、`'serif'`、`'SimHei'` |
| `lines.linewidth` | 线宽 | `1.5` |
| `lines.markersize` | 点标记大小 | `6` |
| `axes.titlesize` | 坐标轴标题字号 | `14` |
| `axes.labelsize` | 轴标签字号 | `12` |
| `xtick.labelsize` | 横轴刻度字号 | `10` |
| `ytick.labelsize` | 纵轴刻度字号 | `10` |
| `legend.fontsize` | 图例字号 | `10` |
| `savefig.dpi` | 保存图片的分辨率 | `300` |
| `savefig.bbox` | 保存时边框处理，`'tight'` 去掉空白 | `'tight'` |

字号配置中 `font.size` 是基准，`axes.titlesize`、`axes.labelsize`、`xtick.labelsize`、`ytick.labelsize`、`legend.fontsize` 可以分别覆盖对应元素，也可以写成相对基准的字符串如 `'large'`、`'medium'`。

`figure.dpi` 与 `savefig.dpi` 的区别：前者控制屏幕显示分辨率，后者控制保存文件的分辨率。论文图片常用 `savefig.dpi=300` 保证印刷清晰，`savefig.bbox='tight'` 自动裁剪空白边距：

```python
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['savefig.bbox'] = 'tight'

fig, ax = plt.subplots()
ax.plot([0, 1, 2], [0, 1, 4])
fig.savefig('output.png', bbox_inches='tight')   # 单次保存也可指定
```

中文字体在默认样式下显示为方块，设置 `font.family` 为系统中文字体名称解决：

```python
plt.rcParams['font.family'] = 'SimHei'   # Windows 黑体
plt.rcParams['axes.unicode_minus'] = False   # 负号正常显示
```

`axes.unicode_minus=False` 让负号使用普通连字符，避免中文字体下负号显示异常。字体名因系统而异，Windows 常用 `SimHei`、`Microsoft YaHei`，macOS 常用 `PingFang SC`。

## 练习题

### 第1题 概念理解

说明 `plt.style.use()` 与 `plt.style.context()` 的区别；说明 `.mplstyle` 文件的格式；说明 `figure.dpi` 与 `savefig.dpi` 的区别；说明 `rcParams` 与样式表的关系。

::: details 参考答案

`use` 全局永久生效，`context` 只在该代码块内生效。`.mplstyle` 是文本文件，每行一条 `键: 值` 设置，`#` 开头是注释。`figure.dpi` 控制屏幕显示，`savefig.dpi` 控制保存分辨率。样式表是批量修改 `rcParams` 的集合，`rcParams` 是全局参数的实际存储位置。
:::

### 第2题 代码编写

创建一个自定义样式文件 `my_style.mplstyle`，设置图尺寸 8×5、分辨率 120、字号 12、线宽 2、网格开启，保存分辨率 300；加载该样式并绘制一条曲线验证效果。

::: details 参考答案

```python
# 先创建 my_style.mplstyle 文件，内容：
# figure.figsize: 8, 5
# figure.dpi: 120
# font.size: 12
# lines.linewidth: 2
# axes.grid: True
# savefig.dpi: 300

import matplotlib.pyplot as plt
import numpy as np

plt.style.use('my_style.mplstyle')
fig, ax = plt.subplots()
ax.plot(np.linspace(0, 10, 100), np.sin(np.linspace(0, 10, 100)))
fig.savefig('output.png')
```

:::

### 第3题 进阶练习

用 `plt.rcParams` 一次性设置中文字体、字号、轴标签字号与刻度字号；用 `plt.style.context('seaborn-v0_8')` 绘制一张带网格的对比图，离开上下文后验证样式已恢复；设置 `savefig.dpi` 为 300 并保存图片。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.family'] = 'SimHei'
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['savefig.dpi'] = 300

x = np.linspace(0, 10, 100)
with plt.style.context('seaborn-v0_8'):
    fig, ax = plt.subplots()
    ax.plot(x, np.sin(x), label='正弦')
    ax.plot(x, np.cos(x), label='余弦')
    ax.set_title('正弦与余弦曲线')
    ax.legend()
    fig.savefig('seaborn_style.png', bbox_inches='tight')

# 离开 with 后样式恢复
fig2, ax2 = plt.subplots()
ax2.plot(x, np.sin(x))
plt.show()
```

:::

## 常见错误

**错误 1 · `plt.style.use('seaborn')` 报 `ValueError: 'seaborn' is not a valid style`**

原因:新版 Matplotlib 中样式改名，旧名已移除。

解决:改用 `'seaborn-v0_8'`，或查看 `plt.style.available` 中实际存在的名称。

**错误 2 · 中文字体显示为方块**

原因:默认字体不含中文字形。

解决:设置 `plt.rcParams['font.family']` 为中文字体（如 `'SimHei'`），并设 `axes.unicode_minus=False`。

**错误 3 · 自定义样式文件加载后不生效**

原因:文件路径错误或键名拼写错误。

解决:使用完整路径加载，对照 `plt.rcParams` 确认键名，加载后打印 `plt.rcParams` 检查。

**错误 4 · `with plt.style.context(...)` 外样式仍受影响**

原因:代码在 `with` 块外也调用了样式切换，或 `use` 与 `context` 混用顺序错误。

解决:把样式切换全部放进 `with` 块，确认 `context` 只包裹需要特殊样式的代码。

**错误 5 · 保存的图片模糊或空白过多**

原因:`savefig.dpi` 过低，或未使用 `bbox_inches='tight'`。

解决:设 `savefig.dpi=300`，保存时加 `bbox_inches='tight'` 裁剪空白。
