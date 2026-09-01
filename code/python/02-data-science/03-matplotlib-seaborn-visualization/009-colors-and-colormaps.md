---
title: 1.9 颜色与色彩映射
sidebar:
  order: 9
---
# 1.9 颜色与色彩映射

颜色是图表信息传达的核心要素：分类数据用不同颜色区分，连续数值用颜色深浅表达大小，热图、散点密度图都要靠颜色映射（colormap）把数值区间映射到颜色。本节讲解颜色的指定方式、色彩映射表的分类、获取与注册、颜色条的配置、颜色序列循环以及自定义渐变色，掌握这些内容才能画出清晰且符合规范的医学图表。

## 1.9.1 颜色的指定方式

Matplotlib 中几乎所有接受颜色的参数都支持多种写法，常见的指定方式如下：

| 写法 | 示例 | 说明 |
| --- | --- | --- |
| 英文名称 | `'red'`、`'blue'` | 直接使用颜色单词，可查全部名称 |
| 单字母缩写 | `'r'`、`'g'`、`'b'` | 八种基础颜色缩写：r 红、g 绿、b 蓝、c 青、m 品红、y 黄、k 黑、w 白 |
| 十六进制 | `'#FF0000'` | `#RRGGBB` 或 `#RRGGBBAA` 格式，精确控制 |
| RGB/RGBA 元组 | `(1.0, 0.0, 0.0)` | 分量取值 0 到 1，四元组含透明度 |
| 灰度字符串 | `'0.5'` | 0 黑到 1 白之间的灰度 |
| 命名颜色简写 | `'tab:red'`、`'C0'` | 表格配色板颜色，`C0` 到 `C9` |

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
fig, ax = plt.subplots()
ax.plot(x, np.sin(x), color='red')                    # 英文名称
ax.plot(x, np.sin(x + 0.5), color='b')                # 单字母缩写
ax.plot(x, np.sin(x + 1.0), color='#00AA00')          # 十六进制
ax.plot(x, np.sin(x + 1.5), color=(0.5, 0.2, 0.8))    # RGB 元组
ax.plot(x, np.sin(x + 2.0), color='0.5')              # 灰度
plt.show()
```

`tab:` 前缀的颜色来自表格配色板 `tab10`，色彩区分度好且适合色觉缺陷人群，日常绘图优先使用 `'tab:blue'`、`'tab:red'` 这类颜色。RGBA 元组第四个分量是透明度，取值 0 到 1。

## 1.9.2 色彩映射表分类

色彩映射表（colormap）把数值映射到颜色，通过名称字符串引用。按用途分为五类：

| 类别 | 常见名称 | 适用场景 |
| --- | --- | --- |
| 顺序型（感知均匀） | `'viridis'`、`'plasma'`、`'inferno'`、`'magma'`、`'cividis'` | 连续数值，色盲友好，默认推荐 |
| 经典顺序型 | `'gray'`、`'hot'`、`'cool'`、`'terrain'`、`'ocean'`、`'rainbow'` | 传统风格，灰度与地形等特殊需求 |
| 发散型 | `'RdBu'`、`'RdYlBu'`、`'coolwarm'`、`'seismic'`、`'PiYG'` | 有正负分界、以 0 为中心的数据 |
| 定性型 | `'tab10'`、`'tab20'`、`'Set3'`、`'Paired'`、`'Pastel1'` | 离散类别，颜色互不混淆 |
| 循环型 | `'hsv'`、`'twilight'` | 首尾相接的数据，如相位角 |

顺序型适合从小到大连续变化的数值，`'viridis'` 是现代绘图的默认推荐；发散型适合有明确零点的数据（如差异、偏离度），中间颜色对应 0；定性型用于不同分组，每组一个固定颜色；循环型适合角度、相位这类首尾相接的数据：

```python
from matplotlib.colors import Normalize
import numpy as np

data = np.random.rand(10, 10)
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
axes[0].imshow(data, cmap='viridis')   # 顺序型
axes[1].imshow(data - 0.5, cmap='RdBu', norm=Normalize(-0.5, 0.5))  # 发散型
axes[2].imshow(np.random.randint(0, 5, (10, 10)), cmap='tab10')     # 定性型
plt.show()
```

`imshow` 用 `cmap` 参数指定色彩映射表，`norm` 指定数值到颜色的归一化范围。发散型必须设置 `norm` 让 0 落在中间颜色上，否则色彩含义会被扭曲。

## 1.9.3 获取与注册色彩映射表

`plt.get_cmap(name)` 通过名称获取色彩映射表对象，拿到对象后可以取具体颜色：

```python
cmap = plt.get_cmap('viridis')
color = cmap(0.5)      # 取 0.5 位置的颜色，返回 RGBA 元组
print(color)           # (0.219653, 0.530489, 0.429808, 1.0)
```

`cmap(值)` 接收 0 到 1 的数值返回对应 RGBA 元组；也可以传一个数组批量取值，用于给散点按数值着色：

```python
x = np.random.rand(100)
y = np.random.rand(100)
values = np.random.rand(100)
cmap = plt.get_cmap('viridis')
colors = cmap(values)   # 每个点一个颜色

fig, ax = plt.subplots()
ax.scatter(x, y, c=colors, s=30)
plt.show()
```

旧接口 `plt.cm.get_cmap()` 与 `plt.cm.<名称>`（如 `plt.cm.viridis`）在新版本已弃用，统一用 `plt.get_cmap()`。`plt.cm` 模块本身仍然存在，`plt.cm.viridis` 等价于 `plt.get_cmap('viridis')`，但推荐使用新接口。

`plt.cm.register_cmap()` 注册自定义色彩映射表，注册后可以用名称引用。新版本中推荐使用 `matplotlib.colormaps.register()`：

```python
from matplotlib.colors import LinearSegmentedColormap

my_cmap = LinearSegmentedColormap.from_list('my_cmap', ['blue', 'white', 'red'])
plt.cm.register_cmap('my_cmap', my_cmap)          # 旧接口
import matplotlib
matplotlib.colormaps.register(my_cmap)            # 新接口，推荐
```

注册后 `plt.get_cmap('my_cmap')` 即可获取。`LinearSegmentedColormap.from_list()` 从一组颜色构造渐变色，第一个参数是名称，第二个参数是颜色列表。

## 1.9.4 颜色条 colorbar

颜色条是色彩映射表的图例，显示数值与颜色的对应关系。`plt.colorbar()` 作用于当前图，`fig.colorbar()` 作用于指定图：

```python
fig, ax = plt.subplots()
data = np.random.rand(10, 10)
im = ax.imshow(data, cmap='viridis')
cbar = fig.colorbar(im)   # 为图像对象添加颜色条
plt.show()
```

`fig.colorbar()` 的第一个参数是绘图对象（`imshow`、`scatter`、`pcolormesh` 等返回的对象），颜色条与绘图对象共享色彩映射。常用参数：

| 参数 | 作用 |
| --- | --- |
| `orientation` | 方向，`'vertical'` 竖直（默认）或 `'horizontal'` 水平 |
| `shrink` | 颜色条长度缩放比例，0 到 1 |
| `aspect` | 颜色条宽高比，越大越细长 |
| `pad` | 颜色条与图的间距，相对坐标 |
| `extend` | 两端是否加三角形，表示超出范围，取 `'neither'`、`'both'`、`'min'`、`'max'` |

水平颜色条与长度控制：

```python
cbar = fig.colorbar(im, orientation='horizontal', shrink=0.8,
                    pad=0.05, aspect=20)
```

`extend='both'` 时颜色条两端出现三角形，提示数据超出色彩映射范围；`shrink` 缩短颜色条长度，`aspect` 控制宽高比，两者常配合调整颜色条外观。

颜色条对象有独立的刻度与标签接口：`cbar.set_ticks()` 设置刻度位置，`cbar.set_ticklabels()` 设置刻度文字，`cbar.set_label()` 设置颜色条标题：

```python
cbar = fig.colorbar(im, ax=ax)
cbar.set_ticks([0, 0.25, 0.5, 0.75, 1.0])
cbar.set_ticklabels(['0%', '25%', '50%', '75%', '100%'])
cbar.set_label('浓度（mg/L）', fontsize=12)
```

`cbar.set_label()` 常用参数：`label` 文字、`fontsize` 字号、`rotation` 旋转（竖直颜色条默认旋转 90 度）。`set_ticks` 与 `set_ticklabels` 的长度必须一致，否则标签错位。

`fig.colorbar(im, ax=ax)` 中的 `ax` 参数指定颜色条占用的坐标轴，多子图共享一个颜色条时，传入子图列表：

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
im1 = axes[0].imshow(data, cmap='viridis')
im2 = axes[1].imshow(data, cmap='viridis')
cbar = fig.colorbar(im1, ax=axes.tolist())   # 两个子图共享颜色条
```

## 1.9.5 颜色序列循环

`plot()` 不指定颜色时，会从颜色序列循环取色，保证多条曲线颜色不同。默认颜色序列由 `plt.rcParams['axes.prop_cycle']` 控制，默认是 `tab10` 配色板：

```python
print(plt.rcParams['axes.prop_cycle'])   # cycler(color='tab10')
```

`ax._get_lines.prop_cycler` 是坐标轴内部维护的颜色循环器，绘图时依次弹出下一个颜色：

```python
fig, ax = plt.subplots()
for i in range(5):
    ax.plot(x, np.sin(x + i), linewidth=2)   # 自动取不同颜色
```

修改 `plt.rcParams['axes.prop_cycle']` 可以换成其他配色板，格式是 `cycler` 对象：

```python
from cycler import cycler

plt.rcParams['axes.prop_cycle'] = cycler(color=['#1f77b4', '#ff7f0e',
                                                '#2ca02c', '#d62728'])
```

`cycler` 也可以同时循环多个属性（颜色与线型组合），让多条线既换色又换线型：

```python
plt.rcParams['axes.prop_cycle'] = cycler(color='tab10') * cycler(linestyle=['-', '--', ':'])
```

## 1.9.6 自定义渐变色

`LinearSegmentedColormap.from_list()` 从颜色列表构造线性渐变色彩映射表，适合定制符合论文风格或品牌配色的色带：

```python
from matplotlib.colors import LinearSegmentedColormap

cmap = LinearSegmentedColormap.from_list('white_red', ['white', 'lightcoral', 'red'])
```

第一个参数是名称，第二个参数是颜色列表，可以传颜色名称、十六进制或元组。构造的 `cmap` 直接用于 `imshow`、`scatter` 等，也可以注册后按名称引用。

从已存在的色彩映射表取若干颜色再重排，可以得到衍生色带。例如把 `'viridis'` 的前半段提取出来：

```python
base = plt.get_cmap('viridis')
new_cmap = LinearSegmentedColormap.from_list('half_viridis', [base(0), base(0.5)])
```

自定义渐变色常用于医学图像的伪彩、热图分级等需要特定配色的场景。构造后建议先用 `scatter` 或 `imshow` 快速预览颜色过渡是否平滑。

## 练习题

### 第1题 概念理解

说明颜色指定的六种写法并各举一例；说明顺序型、发散型、定性型、循环型色彩映射表的适用场景；说明 `extend` 参数的作用；说明颜色序列循环的原理。

::: details 参考答案

写法有英文名称（`red`）、单字母缩写（`r`）、十六进制（`#FF0000`）、RGB/RGBA 元组（`(1, 0, 0)`）、灰度字符串（`'0.5'`）、命名颜色简写（`tab:red`）。顺序型用于连续数值，发散型用于以 0 为中心的数据，定性型用于离散类别，循环型用于首尾相接的数据。`extend` 在颜色条两端加三角形表示数据超出范围。颜色序列循环由 `axes.prop_cycle` 定义的颜色循环器驱动，绘图时逐次取色。
:::

### 第2题 代码编写

生成一个 10×10 随机矩阵，用 `imshow` 以 `'viridis'` 绘制并添加竖直颜色条；颜色条刻度设为 0 到 1 的五个点，标签显示为百分比；给颜色条加标题 `浓度`。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

data = np.random.rand(10, 10)
fig, ax = plt.subplots()
im = ax.imshow(data, cmap='viridis')
cbar = fig.colorbar(im, ax=ax)
cbar.set_ticks([0, 0.25, 0.5, 0.75, 1.0])
cbar.set_ticklabels(['0%', '25%', '50%', '75%', '100%'])
cbar.set_label('浓度', fontsize=12)
plt.show()
```

:::

### 第3题 进阶练习

用 `LinearSegmentedColormap.from_list` 创建从蓝色到白色再到红色的渐变色，注册后按名称用于散点图；修改 `axes.prop_cycle` 让连续绘制的五条线使用指定颜色；绘制一个以 0 为中心的 `RdBu` 发散热图并正确设置 `norm`。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap, Normalize
from cycler import cycler

# 自定义渐变并注册
my_cmap = LinearSegmentedColormap.from_list('bwr2', ['blue', 'white', 'red'])
import matplotlib
matplotlib.colormaps.register(my_cmap)

# 修改颜色循环
plt.rcParams['axes.prop_cycle'] = cycler(color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])

x = np.linspace(0, 10, 200)
fig, ax = plt.subplots()
for i in range(5):
    ax.plot(x, np.sin(x + i))   # 自动取不同颜色
ax.scatter(np.random.rand(50), np.random.rand(50), c=np.random.rand(50),
           cmap='bwr2')         # 使用自定义渐变
plt.show()

# 发散热图
fig2, ax2 = plt.subplots()
data = np.random.rand(10, 10) - 0.5
im = ax2.imshow(data, cmap='RdBu', norm=Normalize(-0.5, 0.5))
fig2.colorbar(im, ax=ax2)
plt.show()
```

:::

## 常见错误

**错误 1 · `plt.cm.get_cmap` 报弃用警告或 `AttributeError`**

原因:旧接口在新版本中已移除。

解决:改用 `plt.get_cmap('viridis')`，或从 `matplotlib.colormaps` 获取。

**错误 2 · 颜色条刻度与标签数量不一致导致错位**

原因:`set_ticks` 与 `set_ticklabels` 长度不匹配。

解决:保证两个列表长度一致，或只设置一个、让另一个自动生成。

**错误 3 · 发散型色彩映射表的 0 不在中间颜色上**

原因:未设置 `norm`，默认归一化范围与数据不符。

解决:用 `Normalize(vmin, vmax)` 指定对称范围，让 0 落在中间。

**错误 4 · `plot()` 多条曲线颜色相同**

原因:手动给所有曲线传了同一个 `color`，或 `axes.prop_cycle` 未生效。

解决:不传 `color` 让颜色循环自动取色，或显式修改 `axes.prop_cycle`。

**错误 5 · 颜色条 `extend` 参数未生效或颜色条太长**

原因:参数拼写错误，或未给 `shrink`、`aspect` 传合理值。

解决:确认 `extend='both'` 等取值，用 `shrink` 与 `aspect` 调整颜色条尺寸。
