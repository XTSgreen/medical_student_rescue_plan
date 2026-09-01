---
title: 1.9 绘图美学与参数细化
sidebar:
  order: 26
---
# 1.9 绘图美学与参数细化

默认绘图能快速呈现数据，但报告或演示中的图形需要精确控制尺寸、图例、颜色、误差条等细节，才能满足排版与表达要求。Seaborn 的大部分美学参数在绘图函数签名中直接暴露，无需回头逐项修改 Matplotlib 对象。本节讲解坐标轴标签自动生成、图形大小控制、图例控制、颜色映射、误差条与透明度等**参数细化**手段，让图形从可用升级为规范。

## 1.9.1 坐标轴标签与标题自动生成

Seaborn 绘图时若传入 DataFrame 列名，坐标轴标签会自动取列名，标题也会从网格维度推断，省去手动设置的步骤：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 标签自动显示为 total_bill 与 tip
sns.scatterplot(x='total_bill', y='tip', data=tips)
plt.show()
```

自动标签来源于 Pandas 列名，因此给列起有意义的名称，图形即可直接使用。需要定制标签时，用 Matplotlib 的 `plt.xlabel`、`plt.ylabel` 覆盖：

```python
sns.scatterplot(x='total_bill', y='tip', data=tips)
plt.xlabel('消费金额（美元）')
plt.ylabel('小费金额（美元）')
plt.show()
```

分面网格的标题由 `set_titles()` 自动生成，`hue` 图例标题默认取分类变量名。自动生成与手动覆盖结合，是控制标签的标准做法。

## 1.9.2 图表大小控制 height 与 aspect

`FacetGrid` 系列（`lmplot`、`relplot`、`catplot` 等）用 `height` 与 `aspect` 两个参数控制图形大小。`height` 是每个子图的高度（英寸），`aspect` 是子图的宽高比，两者相乘得到子图宽度：

```python
# 每个子图高 4 英寸、宽高比 1.2，宽度为 4.8 英寸
sns.lmplot(x='total_bill', y='tip', data=tips,
           col='sex', height=4, aspect=1.2)
plt.show()
```

`height` 决定整体缩放，`aspect` 决定子图是宽扁还是窄长。网格行列数多时增大 `height`，避免子图过小；子图数量多时适当减小 `height`，让整幅图形保持协调。

## 1.9.3 单独图形大小 figsize

对于单轴绘图（`scatterplot`、`histplot`、`heatmap` 等），Seaborn 沿用 Matplotlib 的画布机制，用 `plt.subplots()` 创建带 `figsize` 的画布，再把坐标轴传入绘图函数：

```python
fig, ax = plt.subplots(figsize=(8, 5))
sns.scatterplot(x='total_bill', y='tip', data=tips, ax=ax)
plt.show()
```

`figsize` 传 `(宽, 高)` 元组。也可以先调用 `plt.figure(figsize=(8, 5))` 再绘图。单轴绘图的尺寸设置与分面绘图的 `height`、`aspect` 属于两套体系，按绘图函数类型选择即可。

## 1.9.4 图例控制

分类变量着色后默认生成图例。分面绘图的图例通过 `add_legend()` 控制位置与样式，`legend_out` 参数决定图例放在图形外侧还是内侧：

```python
# legend_out=True 时图例放在网格右侧外部
g = sns.lmplot(x='total_bill', y='tip', data=tips,
               hue='sex', legend_out=True)
g.add_legend(title='性别', loc='center left', bbox_to_anchor=(1, 0.5))
plt.show()
```

`add_legend` 的 `loc` 与 `bbox_to_anchor` 沿用 Matplotlib 图例语法：`loc` 指定基准位置，`bbox_to_anchor` 用元组微调偏移。`legend_out=False` 把图例放回图形内部，例如 `loc='upper left'`：

```python
g = sns.lmplot(x='total_bill', y='tip', data=tips,
               hue='sex', legend_out=False)
g.add_legend(title='性别', loc='upper left')
plt.show()
```

`legend_out` 只在 `hue` 维度使用；同时存在 `col`、`row` 时图例默认保持在外部。

## 1.9.5 颜色映射 palette

`palette` 参数统一控制分类变量的配色方案。Seaborn 内置多组调色板，常用类别如下：

| 调色板名 | 风格 |
| --- | --- |
| `'deep'`、`'muted'`、`'bright'` | 饱和度递增的常规调色板 |
| `'pastel'`、`'dark'` | 浅淡与深沉的变体 |
| `'colorblind'` | 面向色觉障碍的配色 |
| `'Set2'`、`'tab10'` 等 | 来自色彩方案的命名调色板 |

`palette` 可用字符串名、颜色列表或字典：

```python
# 字符串调色板
sns.catplot(x='day', y='total_bill', data=tips,
            kind='box', palette='Set2')
plt.show()

# 字典映射，按类别指定颜色
palette = {'Male': 'steelblue', 'Female': 'coral'}
sns.scatterplot(x='total_bill', y='tip', data=tips,
                hue='sex', palette=palette)
plt.show()
```

同一报告中的多张图共用同一个 `palette`，可保持视觉风格一致。数值型变量的颜色用 `cmap` 而不是 `palette` 控制。

## 1.9.6 误差条显示

带聚合的绘图函数（`barplot`、`pointplot`、`lineplot`）通过 `ci` 与 `err_style` 两个参数控制误差条：

| 参数 | 取值 | 效果 |
| --- | --- | --- |
| `ci` | 数值（如 95） | 显示对应置信水平区间 |
| `ci` | `'sd'` | 显示标准差 |
| `ci` | `None` | 不显示误差 |
| `err_style` | `'band'` | 用带状区域表示误差 |
| `err_style` | `'bars'` | 用柱状线段表示误差 |

`lineplot` 默认用带状误差，`barplot` 默认用柱状误差：

```python
# 置信区间 95%，带状误差
sns.lineplot(x='day', y='total_bill', data=tips, ci=95,
             err_style='band')
plt.show()

# 标准差误差，柱状样式
sns.barplot(x='day', y='total_bill', data=tips,
            ci='sd', err_style='bars')
plt.show()
```

`ci=None` 或 `err_style=None` 完全隐藏误差信息。误差条的选择取决于展示目的：标准差强调离散程度，置信区间强调估计精度。

## 1.9.7 透明度控制 alpha

`alpha` 参数控制绘图元素的透明度，取值 0 到 1，数值越小越透明。数据点密集重叠时降低透明度，可以看清点的分布密度：

```python
sns.scatterplot(x='total_bill', y='tip', data=tips, alpha=0.5)
plt.show()
```

散点图用 `alpha` 缓解重叠遮挡，面积大或数量多的元素用更小的 `alpha`。`alpha` 在多数绘图函数中直接可用，也可通过 `scatter_kws={'alpha': 0.4}` 等样式字典传递。

## 练习题

### 第1题 概念理解

说明坐标轴标签如何自动生成以及如何覆盖；说明 `height` 与 `aspect` 的作用及两者关系；说明 `ci` 的三种取值含义；说明 `legend_out` 参数的作用。

::: details 参考答案

坐标轴标签自动取 DataFrame 列名，用 `plt.xlabel`、`plt.ylabel` 可覆盖。`height` 是子图高度，`aspect` 是宽高比，宽度等于两者乘积。`ci` 取数值显示置信区间、取 `'sd'` 显示标准差、取 `None` 隐藏误差。`legend_out=True` 把图例放在图形右侧外部，`legend_out=False` 放回内部。
:::

### 第2题 代码编写

加载 `tips` 数据集，用 `plt.subplots(figsize=(8, 5))` 创建画布，绘制 `total_bill` 与 `tip` 的散点图并设置 `alpha=0.5`；用 `palette='Set2'` 按 `sex` 着色，用 `plt.xlabel`、`plt.ylabel` 设置中文标签。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

fig, ax = plt.subplots(figsize=(8, 5))
sns.scatterplot(x='total_bill', y='tip', data=tips,
                hue='sex', palette='Set2', alpha=0.5, ax=ax)
plt.xlabel('消费金额（美元）')
plt.ylabel('小费金额（美元）')
plt.show()
```

:::

### 第3题 进阶练习

用 `lmplot` 按 `hue='smoker'` 绘制回归图，设置 `height=4`、`aspect=1.5`，`legend_out=True` 并把图例放到右侧外部；用 `barplot` 对比不同 `day` 的 `total_bill` 均值，分别用 `ci='sd'`、`err_style='bars'` 与 `ci=None` 绘制两幅图对比误差条效果。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# lmplot 尺寸与外部图例
g = sns.lmplot(x='total_bill', y='tip', data=tips,
               hue='smoker', height=4, aspect=1.5,
               legend_out=True)
g.add_legend(title='是否吸烟', loc='center left', bbox_to_anchor=(1, 0.5))
plt.show()

# 误差条对比
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.barplot(x='day', y='total_bill', data=tips,
            ci='sd', err_style='bars', ax=axes[0])
sns.barplot(x='day', y='total_bill', data=tips,
            ci=None, ax=axes[1])
plt.show()
```

:::

## 常见错误

**错误 1 · `sns.scatterplot` 设置 `figsize` 无效**

原因:单轴绘图函数没有 `figsize` 参数，画布尺寸由 `plt.subplots()` 决定。

解决:用 `fig, ax = plt.subplots(figsize=(8, 5))` 创建画布并把 `ax` 传入绘图函数。

**错误 2 · `ci='sd'` 与 `err_style` 组合后报 `ValueError`**

原因:部分聚合函数对误差样式有默认约定，手动指定不兼容组合会报错。

解决:确认函数类型后选择对应样式，`lineplot` 用 `'band'`，`barplot`、`pointplot` 用 `'bars'`。

**错误 3 · 调色板名写错导致报 `ValueError` 或颜色怪异**

原因:调色板名必须与 Seaborn 内置名称完全一致。

解决:使用 `'deep'`、`'muted'`、`'pastel'`、`'bright'`、`'dark'`、`'colorblind'` 等标准名，或用 `sns.color_palette()` 先验证可用名称。

**错误 4 · `add_legend` 后图例与标题重叠或超出画面**

原因:图例默认位置与图形内容冲突。

解决:结合 `loc` 与 `bbox_to_anchor` 调整位置，或设 `legend_out=True` 把图例移到图形外。
