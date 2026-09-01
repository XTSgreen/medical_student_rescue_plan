---
title: 1.16 文本与字体管理
sidebar:
  order: 16
---
# 1.16 文本与字体管理

图里的文字决定了信息能否被准确传达：标题、坐标轴标签、图例、数据标注，以及公式形式的数学符号。默认设置下中文会显示成方块，负号也会变成乱码，数学公式需要专门的渲染方式。本节讲解 Matplotlib 的字体体系、中文支持、TeX 渲染与数学字体设置，最后给出一个完整的中文绘图示例。

## 1.16.1 fontdict 参数

`fontdict` 是一本字体属性字典，`set_title`、`set_xlabel`、`set_ylabel`、`text` 等文本相关方法都接受。字典的常用键：`family` 字体族、`size` 字号、`style` 字形（normal/italic）、`weight` 字重（normal/bold）、`color` 颜色：

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
font = {'family': 'serif', 'size': 14,
        'style': 'italic', 'weight': 'bold', 'color': 'navy'}
ax.set_title('图标题', fontdict=font)
ax.set_xlabel('横轴', fontdict=font)
ax.set_ylabel('纵轴', fontdict=font)
ax.text(0.5, 0.5, '居中文字', fontdict=font, ha='center')
plt.show()
```

`fontdict` 中的键全部可选，未给出的属性沿用默认值，适合批量统一一批文本的样式。与 `fontdict` 等价的写法是直接在方法上逐个传参，例如 `ax.set_title('标题', fontsize=14, fontweight='bold')`。

## 1.16.2 中文字体支持

Matplotlib 默认字体不含中文字形，直接写中文会显示为一排方块。解决办法是把支持中文的字体加入字体回退列表 `plt.rcParams['font.sans-serif']`：

```python
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']   # 黑体
plt.plot([1, 2, 3], [1, 4, 2])
plt.title('销量走势')
plt.show()
```

常用中文字体：`SimHei` 黑体，字形粗壮、清晰，是常见环境里的免费字体，教材和演示中大量使用；`Microsoft YaHei` 微软雅黑，Windows 自带，字形现代、屏幕阅读舒适。配置顺序就是字体回退顺序：Matplotlib 从列表第一个字体开始尝试，找不到再依次尝试后续字体。建议把常用字体放前面，并把英文字体也纳入列表，因为 `font.sans-serif` 同时影响英文与数字的渲染：

```python
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'DejaVu Sans']
```

这样 Windows 上优先用微软雅黑，缺失时回退黑体，最后兜底 Matplotlib 自带的 DejaVu Sans，中文英文都能正确显示。

## 1.16.3 字体回退与负号显示

字体回退指目标字体缺失某字形时，Matplotlib 沿候选字体列表依次查找可用字体。上一节的列表配置正是回退机制的运用：**列表顺序即回退优先级**。

中文正常后还会遇到负号显示成方块的问题。默认字体对负号（Unicode 减号 U+2212）字形支持不完整，设置 `axes.unicode_minus=False` 让负号改用 ASCII 减号，配合中文字体即可正常显示：

```python
plt.rcParams['axes.unicode_minus'] = False
plt.plot([-2, -1, 0, 1, 2], [4, 1, 0, 1, 4])
plt.show()   # 坐标轴上的负数正常显示
```

`font.sans-serif` 与 `axes.unicode_minus` 两条配置在中文字体切换后必须成对设置，漏掉第二条负号就会变成方块。

## 1.16.4 TeX 渲染模式

`plt.rcParams['text.usetex'] = True` 让 Matplotlib 调用本机 LaTeX 引擎渲染全部文本，支持 `\frac`、`\alpha`、`\sum` 等完整 LaTeX 语法，排版质量接近正式论文。前提是系统安装了 LaTeX 发行版（TeX Live、MiKTeX 等）以及 `dvipng`，未安装时运行会报 `RuntimeError: latex was not able to process the following string`：

```python
import matplotlib.pyplot as plt

plt.rcParams['text.usetex'] = True
plt.rcParams['font.family'] = 'serif'
fig, ax = plt.subplots()
ax.set_title(r'能量 $E = \frac{1}{2} m v^2$')
ax.set_xlabel(r'时间 $t$ (s)')
plt.show()
```

`usetex=True` 模式下所有文本都走 LaTeX 引擎，`$...$` 内的内容按数学模式排版，`$...$` 外按普通文本排版。原始字符串前缀 `r` 避免反斜杠被 Python 转义。需要注意 `usetex` 与中文字体不兼容：LaTeX 引擎默认不含中文字形，中文需额外配置 `xeCJK` 等宏包，日常中文绘图通常关闭 `usetex`，仅用下一节的数学字体设置处理公式。

## 1.16.5 math_fontfamily 参数

不启用 TeX 时，Matplotlib 用内置 mathtext 引擎渲染 `$...$` 内的数学表达式。`math_fontfamily` 参数指定数学文本使用的字体族，取值包括 `'cm'`（Computer Modern，LaTeX 默认风格）、`'dejavusans'`、`'dejavuserif'`、`'stix'`、`'stixsans'`：

```python
fig, ax = plt.subplots()
ax.set_xlabel(r'$x$ 与 $\alpha$', math_fontfamily='cm')
ax.set_title(r'$y = a x^2 + b$', math_fontfamily='stix')
plt.show()
```

`math_fontfamily` 是文本对象级参数，`set_title`、`set_xlabel`、`text` 等方法都能传。全局统一设置用 `plt.rcParams['mathtext.fontset'] = 'cm'`，对全部数学表达式生效。`math_fontfamily` 只在 `text.usetex=False`（默认）时可用，启用 TeX 后数学字体由 LaTeX 引擎接管。

## 1.16.6 中文绘图完整示例

把前面的配置组合起来，得到一份可直接复用的中文绘图模板：黑体显示中文、ASCII 减号显示负数、stix 数学字体渲染公式：

```python
import matplotlib.pyplot as plt

# 全局中文与负号配置，放在绘图代码之前
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

fig, ax = plt.subplots(figsize=(7, 4))
x = [-3, -2, -1, 0, 1, 2, 3]
y = [v ** 2 for v in x]

ax.plot(x, y, label='二次函数')
ax.set_title(r'函数 $y = x^2$ 的曲线')
ax.set_xlabel('自变量 $x$')
ax.set_ylabel('函数值 $y$')
ax.legend()
ax.grid(True, linestyle='--', alpha=0.6)
plt.show()
```

## 练习题

### 第1题 概念理解

说明 `fontdict` 的作用与常用键；说明 `font.sans-serif` 列表中字体顺序的含义；说明 `axes.unicode_minus` 解决什么问题。

::: details 参考答案

`fontdict` 是字体属性字典，统一设置标题、坐标轴标签、文本的 `family`、`size`、`style`、`weight`、`color`。`font.sans-serif` 列表的顺序就是字体回退顺序，先找列表前面的字体，缺失时依次尝试后面的。`axes.unicode_minus` 为 False 时负号改用 ASCII 减号，解决中文字体下负号显示成方块的问题。
:::

### 第2题 代码编写

配置黑体与负号显示，绘制一条带负数坐标的折线图，标题、坐标轴标签用 `fontdict` 统一设置字体大小与颜色，图例显示中文。

::: details 参考答案

```python
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

font = {'size': 14, 'color': 'darkblue'}
x = [-2, -1, 0, 1, 2]
y = [-3, 0, 1, 0, -3]

fig, ax = plt.subplots()
ax.plot(x, y, label='数据线')
ax.set_title('负坐标折线图', fontdict=font)
ax.set_xlabel('横轴', fontdict=font)
ax.set_ylabel('纵轴', fontdict=font)
ax.legend()
plt.show()
```

:::

### 第3题 进阶练习

对比 `text.usetex=True` 与 `math_fontfamily` 两种公式渲染方式的使用条件；用 `math_fontfamily='cm'` 绘制含 `\frac` 与 `\alpha` 的公式，并说明 usetex 模式与中文同时使用时的注意事项。

::: details 参考答案

`text.usetex=True` 调用本机 LaTeX 引擎渲染全部文本，需要安装 TeX Live 或 MiKTeX 与 dvipng，公式排版质量最高但默认不含中文字形；`math_fontfamily` 使用内置 mathtext 引擎，只需在 `usetex=False` 时指定 `'cm'`、`'stix'` 等字体族。usetex 与中文同时使用需要额外配置 `xeCJK` 等宏包，日常中文绘图关闭 usetex、用 `math_fontfamily` 处理公式更简单。

```python
import matplotlib.pyplot as plt

plt.rcParams['mathtext.fontset'] = 'cm'
fig, ax = plt.subplots()
ax.set_title(r'$y = \frac{\alpha}{2}$ 的图形')
ax.set_xlabel(r'$\alpha$ 变化曲线')
plt.show()
```

:::

## 常见错误

**错误 1 · 中文字符显示为一排方块**

原因:默认字体不含中文字形。

解决:设置 `plt.rcParams['font.sans-serif'] = ['SimHei']` 或微软雅黑，把中文字体加入候选列表。

**错误 2 · 中文正常但负号显示成方块**

原因:默认字体对 Unicode 负号字形支持不完整。

解决:增加 `plt.rcParams['axes.unicode_minus'] = False`，让负号使用 ASCII 减号。

**错误 3 · 设置字体后没有任何变化**

原因:字体配置写在绘图之后，或字体名称在当前系统不存在。

解决:把 rcParams 配置放在绘图代码之前，并确认字体名称正确，Windows 自带微软雅黑与黑体，跨环境推荐 `SimHei`。

**错误 4 · 开启 `text.usetex=True` 后报 `RuntimeError: latex was not able to process the following string`**

原因:本机没有安装 LaTeX 发行版或 dvipng，或者字符串含 LaTeX 无法识别的字符（如中文）。

解决:安装 TeX Live/MiKTeX；中文场景关闭 `usetex`，改用 `math_fontfamily` 渲染公式。

**错误 5 · `math_fontfamily` 设置了却没生效**

原因:当前开启了 `text.usetex=True`，数学字体由 LaTeX 接管，mathtext 参数被忽略。

解决:确认 `text.usetex` 为 False（默认），再使用 `math_fontfamily` 或 `mathtext.fontset`。
