---
title: 1.2 调色板
sidebar:
  order: 19
---
# 1.2 调色板

图表中的颜色承载信息：分类变量用不同颜色区分组别，数值变量用颜色深浅表达大小。颜色选得不好，分类会混淆、数值梯度难分辨，色盲读者甚至无法读图。Seaborn 提供了一套完整的调色板体系，覆盖定性、顺序、发散、循环四类场景，并内置色盲友好方案。本节讲解 `sns.color_palette()` 的用法与六种定性调色板、顺序调色板、发散调色板、循环调色板、全局调色板设置与 `palplot()` 预览。

## 1.2.1 color_palette() 与六种定性调色板

`sns.color_palette()` 是 Seaborn 调色板的核心函数，返回一个颜色列表。不传参数时返回默认的十色 `deep` 调色板：

```python
import seaborn as sns

# 返回默认调色板的颜色列表
colors = sns.color_palette()
print(colors)
```

Seaborn 内置六种**定性调色板**，用于区分没有顺序关系的分类变量：

| 调色板名 | 特点 |
| --- | --- |
| `'deep'` | 默认调色板，饱和度适中，十色 |
| `'muted'` | 柔和低饱和，适合大量并排显示 |
| `'bright'` | 高亮鲜艳，适合深色背景 |
| `'pastel'` | 粉彩淡色，柔和轻快 |
| `'dark'` | 深色系，对比强烈 |
| `'colorblind'` | 色盲友好，八色可分辨 |

```python
import seaborn as sns

# 指定调色板名，n_colors 控制取多少个颜色
colors = sns.color_palette('colorblind', n_colors=8)
print(colors)
```

`n_colors` 指定需要多少个颜色。分类数少于调色板颜色数时取前几个，多于颜色数时循环取色。选择定性调色板看分类个数与展示环境：分类多、要放幻灯片用 `bright`，论文插图用 `muted` 或 `pastel`，面向色盲读者用 `colorblind`。

## 1.2.2 顺序调色板

**顺序调色板**表达从低到高的数值梯度，适合连续数值或有序分类。`sns.light_palette()` 从浅色渐变到指定色，`sns.dark_palette()` 从深色渐变到指定色：

```python
import seaborn as sns

# 从浅到深的蓝色顺序调色板
light = sns.light_palette('blue', n_colors=6)

# 从深到浅的绿色顺序调色板
dark = sns.dark_palette('green', n_colors=6)
```

两个函数的共同参数：`color` 指定基准色，`n_colors` 指定颜色数量，`reverse` 反转顺序，`input` 指定基准色的格式（`'rgb'`、`'hls'`、`'husl'` 等）。

```python
import seaborn as sns

# reverse=True 让浅色在末尾
light_rev = sns.light_palette('blue', n_colors=6, reverse=True)
```

顺序调色板适合表达温度、占比、得分等有大小关系的变量，浅色代表低值、深色代表高值，符合读者直觉。

## 1.2.3 发散调色板

**发散调色板**两端颜色相反、中间为中性色，适合表达偏离中心的数值，例如相关性从负到正、温度从冷到热。`sns.diverging_palette()` 从起始色相渐变到结束色相：

```python
import seaborn as sns

# 从蓝色发散到红色，中间白色，共 11 个颜色
div = sns.diverging_palette(220, 20, n=11, center='light')
```

常用参数：`h_neg` 与 `h_pos` 是两端的色相角（0 到 360），`n` 是颜色数量，`center` 是中间色（`'light'`、`'dark'` 或具体颜色），`s` 与 `l` 控制饱和度和亮度。发散调色板在相关性热图、差异图中最常见。

## 1.2.4 循环调色板

**循环调色板**用于首尾相接的周期性变量，例如相位、角度、月份循环。Seaborn 提供三种循环调色板：

```python
import seaborn as sns

# cubehelix 从单一色相螺旋渐变，明暗交替，适合打印
cube = sns.cubehelix_palette(n_colors=8)

# husl 在 HUSL 色彩空间均匀分布，视觉上等距
husl = sns.husl_palette(n_colors=8, h=0.01, s=0.9, l=0.65)

# hls 在 HLS 色彩空间均匀分布，等距但某些颜色偏亮
hls = sns.hls_palette(n_colors=8, h=0.01, l=0.6, s=0.65)
```

`cubehelix_palette()` 常用参数：`start` 控制起始色相，`rot` 控制旋转圈数，`dark` 与 `light` 控制两端亮度，`reverse` 反转。`husl_palette()` 与 `hls_palette()` 的参数 `h`（起始色相）、`s`（饱和度）、`l`（亮度）共同决定颜色分布。husl 在感知上更均匀，适合要求严格等距的场景；cubehelix 明暗交替，灰度打印后仍能区分。

## 1.2.5 全局调色板 sns.set_palette()

`sns.color_palette()` 只返回颜色列表，不改变当前环境。想让后续所有绘图自动使用某个调色板，用 `sns.set_palette()` 全局生效：

```python
import seaborn as sns

# 全局使用 colorblind 调色板，后续绘图自动生效
sns.set_palette('colorblind')
```

```python
import seaborn as sns
import matplotlib.pyplot as plt

# 用 set_theme 的 palette 参数一次性设置更常见
sns.set_theme(palette='muted')
```

`sns.set_palette()` 接受与 `color_palette()` 相同的参数，也可以直接用 `sns.set_theme(palette=...)` 设置。全局设置后，所有默认使用调色板的绘图函数都会按新调色板取色。

## 1.2.6 palplot() 预览调色板

`sns.palplot()` 把调色板的颜色序列画成色带，方便直观检查配色：

```python
import seaborn as sns
import matplotlib.pyplot as plt

# 画出色带预览
sns.palplot(sns.color_palette('pastel', 8))
plt.show()

# 预览发散调色板
sns.palplot(sns.diverging_palette(220, 20, n=11))
plt.show()
```

`palplot()` 接受一个颜色列表作为参数，把每个颜色画成并排的色块。配色前先用它检查颜色是否可区分、深浅过渡是否自然。

## 1.2.7 从色彩映射获取调色板

`sns.color_palette()` 可以接受 Matplotlib 的 colormap 名称，用 `as_cmap=True` 返回可直接传给 Matplotlib 的 colormap 对象：

```python
import seaborn as sns

# 从 viridis colormap 取 10 个离散颜色
colors = sns.color_palette('viridis', n_colors=10)

# 返回连续的 colormap 对象，供 Matplotlib 使用
cmap = sns.color_palette('viridis', as_cmap=True)
print(type(cmap))
```

```python
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# 把 cmap 传给 Matplotlib 的 imshow
data = np.random.rand(10, 10)
cmap = sns.color_palette('rocket', as_cmap=True)
plt.imshow(data, cmap=cmap)
plt.colorbar()
plt.show()
```

`as_cmap=True` 返回连续的 colormap，适合 `imshow`、`contourf` 等需要连续色标的函数；不带该参数时返回离散颜色列表，适合点图、条图按类别取色。常用连续 colormap 有 `'viridis'`、`'magma'`、`'rocket'`、`'flare'` 等。

## 1.2.8 色盲友好调色板

约百分之八的男性存在红绿色觉缺陷，红绿对比容易读不出图。Seaborn 内置 `'colorblind'` 调色板，八种颜色在常见色觉缺陷下仍可分辨：

```python
import seaborn as sns

# colorblind 调色板用于分类变量
colors = sns.color_palette('colorblind', 8)
sns.palplot(colors)
```

`colorblind` 避免使用纯红绿对比，改用蓝、橙、紫等区分度更高的颜色。面向公开读者或演示时优先选用它，配合点图、条图等依赖颜色区分的图形效果明显。

## 练习题

### 第1题 概念理解

说明定性、顺序、发散、循环四类调色板各自的适用场景；说明 `color_palette()` 与 `set_palette()` 的区别；说明 `as_cmap=True` 的作用。

::: details 参考答案

定性调色板区分无顺序的分类变量，顺序调色板表达数值从小到大，发散调色板表达偏离中心的数值，循环调色板表达周期性变量。`color_palette()` 只返回颜色列表，`set_palette()` 全局设置调色板。`as_cmap=True` 返回连续 colormap，供 Matplotlib 函数使用。
:::

### 第2题 代码编写

用 `color_palette()` 取出 `'deep'` 与 `'colorblind'` 各 8 色并预览；用 `light_palette` 与 `dark_palette` 生成顺序调色板；用 `diverging_palette` 生成发散调色板。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.palplot(sns.color_palette('deep', 8))
sns.palplot(sns.color_palette('colorblind', 8))

sns.palplot(sns.light_palette('blue', 6))
sns.palplot(sns.dark_palette('green', 6))
sns.palplot(sns.diverging_palette(220, 20, n=11))
plt.show()
```

:::

### 第3题 进阶练习

用 `set_theme(palette='muted')` 全局设置调色板，用 `tips` 数据集绘制散点图并让 `day` 列作为 hue 映射颜色；再把调色板切换为 `'colorblind'` 对比效果；用 `cubehelix_palette` 生成循环调色板并预览。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_theme(palette='muted')
tips = sns.load_dataset('tips')
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='day')
plt.show()

sns.set_theme(palette='colorblind')
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='day')
plt.show()

sns.palplot(sns.cubehelix_palette(n_colors=8))
plt.show()
```

:::

## 常见错误

**错误 1 · 把颜色列表传给需要 colormap 的函数报 `ValueError`**

原因:`color_palette()` 默认返回离散颜色列表,Matplotlib 函数要求连续的 colormap 对象。

解决:调用 `color_palette(..., as_cmap=True)` 得到 colormap 再传入。

**错误 2 · 分类数超过调色板颜色数后颜色重复难区分**

原因:定性调色板颜色数量有限,分类过多时自动循环取色。

解决:改用 `n_colors` 生成更多颜色,或减少分类数量,或选择相邻色相差异大的调色板。

**错误 3 · 设置了 `set_palette()` 但绘图没变化**

原因:`set_palette()` 只影响后续创建的新图形,且必须在绘图之前调用。

解决:把 `set_palette()` 放到绘图代码之前,或者直接用 `set_theme(palette=...)`。

**错误 4 · 红绿色对比的图读者看不清**

原因:使用了红绿对比配色,色觉缺陷读者无法分辨。

解决:改用 `'colorblind'` 调色板,或用色相差异更大的蓝橙组合。
