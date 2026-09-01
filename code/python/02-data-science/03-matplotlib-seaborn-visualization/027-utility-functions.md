---
title: 1.10 工具函数与辅助
sidebar:
  order: 27
---
# 1.10 工具函数与辅助

前面的章节围绕绘图函数展开，而 Seaborn 还提供一组**工具函数**，用于管理数据集、查询样式参数、调整坐标轴细节、设置全局主题。这些函数不直接产出图形，却决定绘图的运行环境与统一外观。掌握它们可以更快地获取示例数据、保持报告风格一致、减少重复设置。本节讲解数据集加载、样式与上下文参数、脊柱控制、图例移动、主题设置与简写颜色码等辅助功能。

## 1.10.1 加载内置数据集 load_dataset

`sns.load_dataset()` 加载 Seaborn 内置的示例数据集，返回 DataFrame。首次调用时从网络下载，之后使用本地缓存：

```python
import seaborn as sns

# 首次调用需要网络下载，之后从缓存读取
tips = sns.load_dataset('tips')
print(tips.head())
print(tips.shape)
```

常用内置数据集包括 `tips`（餐厅小费）、`iris`（鸢尾花）、`penguins`（企鹅测量）、`titanic`（泰坦尼克乘客）、`flights`（月度航班量）等。`load_dataset` 依赖网络下载，离线环境下无法使用，需要预先缓存或改用本地数据文件。

下载后的数据缓存在用户主目录的 `seaborn-data` 文件夹中，后续调用无需联网。

## 1.10.2 获取数据集名称 get_dataset_names

`sns.get_dataset_names()` 列出所有可用的内置数据集名称，便于确认可用数据与拼写：

```python
names = sns.get_dataset_names()
print(names)
```

返回一个列表，包含 `'anagrams'`、`'anscombe'`、`'attention'`、`'car_crashes'`、`'diamonds'`、`'flights'`、`'iris'`、`'penguins'`、`'tips'`、`'titanic'` 等名称。该函数同样需要联网获取最新列表，离线时可能报错。

## 1.10.3 样式与上下文参数 axes_style 与 plotting_context

`sns.axes_style()` 返回当前坐标轴样式的参数字典，可通过 `style` 参数查询不同风格：

```python
# 查看当前默认样式参数
style = sns.axes_style()
print(style['axes.facecolor'])
print(style['grid.color'])

# 查看指定风格的参数
style2 = sns.axes_style(style='whitegrid')
print(style2['axes.grid'])
```

`style` 可选 `'darkgrid'`、`'whitegrid'`、`'dark'`、`'white'`、`'ticks'`。`axes_style` 常用于检查某个参数当前值，或把局部样式字典传给绘图函数。

`sns.plotting_context()` 返回当前绘图上下文的参数字典，上下文控制字体大小、线条宽度、标记尺寸等显示细节：

```python
# 查看不同上下文的字号
ctx = sns.plotting_context(context='talk')
print(ctx['font.size'])
print(ctx['lines.linewidth'])
```

`context` 可选 `'paper'`、`'notebook'`、`'talk'`、`'poster'`，字号与线宽依次增大。`plotting_context` 便于在设计图形前确认不同上下文的显示参数。

## 1.10.4 移除坐标轴脊柱 despine

`sns.despine()` 移除坐标轴脊柱（边框线），让图形更简洁。默认移除上、右两侧的脊柱：

```python
import matplotlib.pyplot as plt

sns.scatterplot(x='total_bill', y='tip', data=tips)
sns.despine()
plt.show()
```

通过参数精确控制移除方向：

```python
sns.scatterplot(x='total_bill', y='tip', data=tips)
# 只保留左、下脊柱，其余全部移除
sns.despine(top=True, right=True, left=True)
plt.show()
```

`offset` 参数把保留下来的脊柱向外偏移一段距离，配合刻度显得更清爽：

```python
sns.scatterplot(x='total_bill', y='tip', data=tips)
sns.despine(offset=10)
plt.show()
```

`despine` 也接受 `ax` 参数作用于指定坐标轴。分面网格对象同样有 `despine()` 方法，可一次作用于所有子图。

## 1.10.5 移动图例位置 move_legend

`sns.move_legend()` 移动已存在图例的位置，参数与 Matplotlib 的 `legend` 保持一致，兼容其他库创建图例后的调整：

```python
ax = sns.scatterplot(x='total_bill', y='tip', data=tips, hue='sex')
# 把图例移到图形右上角外侧
sns.move_legend(ax, loc='upper left', bbox_to_anchor=(1, 1))
plt.show()
```

`move_legend` 第一参数是坐标轴对象，其余参数（`loc`、`bbox_to_anchor`、`title`、`ncol` 等）沿用 Matplotlib 图例语法。它返回被移动的图例对象，可继续设置样式：

```python
leg = sns.move_legend(ax, loc='upper left', title='性别')
print(leg.get_frame().get_edgecolor())
```

与 `ax.legend()` 相比，`move_legend` 在已存在图例的前提下原位调整，适合绘图函数已经生成图例的场景。

## 1.10.6 统一主题设置 set_theme

`sns.set_theme()` 一次设置样式、调色板、上下文、字体缩放等全局参数，是当前推荐的统一配置入口，替代旧版的 `sns.set()`：

```python
# 深色网格背景、poster 上下文、Set2 调色板
sns.set_theme(style='darkgrid', palette='Set2', context='poster')
```

各参数的设置规则：`style` 接受 `'darkgrid'`、`'whitegrid'`、`'dark'`、`'white'`、`'ticks'`；`palette` 接受调色板名或颜色列表；`context` 接受 `'paper'`、`'notebook'`、`'talk'`、`'poster'`；`font_scale` 是字号整体缩放系数。

`set_theme()` 使用默认参数调用时恢复到 Seaborn 默认主题：

```python
sns.set_theme()
```

旧版 `sns.set()` 仍可使用，但 `set_theme()` 覆盖的参数更全面，新代码优先使用它。

## 1.10.7 启用简写颜色码 set_color_codes

`sns.set_color_codes()` 让 Matplotlib 的单字母颜色码映射到 Seaborn 调色板颜色。启用后可用 `'b'`、`'g'`、`'r'`、`'c'`、`'m'`、`'y'`、`'k'`、`'w'` 表示颜色：

```python
sns.set_color_codes()
sns.scatterplot(x='total_bill', y='tip', data=tips, color='b')
plt.show()
```

启用前后单字母颜色码的取色不同。默认状态下 `'b'` 对应 Matplotlib 的蓝色，启用后 `'b'` 对应 Seaborn 调色板中的蓝色调，让简写颜色与当前主题更协调。

## 练习题

### 第1题 概念理解

说明 `load_dataset` 的数据来源与缓存机制；说明 `axes_style` 与 `plotting_context` 各返回什么；说明 `despine` 默认移除哪些脊柱；说明 `set_theme` 相对旧版 `set` 的优势。

::: details 参考答案

`load_dataset` 从网络下载内置数据集并缓存在用户主目录，离线时依赖缓存。`axes_style` 返回坐标轴样式参数字典，`plotting_context` 返回绘图上下文参数字典。`despine` 默认移除上、右脊柱。`set_theme` 能一次设置样式、调色板、上下文、字体缩放等全部全局参数，覆盖范围比旧版 `set` 更全面。
:::

### 第2题 代码编写

用 `get_dataset_names()` 列出数据集并加载 `penguins`；用 `axes_style(style='whitegrid')` 查看网格参数；用 `despine` 移除上、右脊柱并设置 `offset`。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

names = sns.get_dataset_names()
print(names)

penguins = sns.load_dataset('penguins')
print(penguins.head())

style = sns.axes_style(style='whitegrid')
print(style['axes.grid'])

sns.scatterplot(x='bill_length_mm', y='bill_depth_mm',
                data=penguins, hue='species')
sns.despine(offset=10)
plt.show()
```

:::

### 第3题 进阶练习

用 `set_theme(style='darkgrid', palette='Set2', context='talk')` 设置全局主题；用 `move_legend` 把 `hue` 图例移到图形外；用 `set_color_codes()` 后用简写颜色码绘制散点图，并对比 `axes_style` 与 `plotting_context` 的参数差异。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_theme(style='darkgrid', palette='Set2', context='talk')

tips = sns.load_dataset('tips')

ax = sns.scatterplot(x='total_bill', y='tip', data=tips, hue='sex')
sns.move_legend(ax, loc='upper left', bbox_to_anchor=(1, 1))
plt.show()

sns.set_color_codes()
sns.scatterplot(x='total_bill', y='tip', data=tips, color='b')
plt.show()

print(sns.axes_style()['grid.linestyle'])
print(sns.plotting_context()['font.size'])
```

:::

## 常见错误

**错误 1 · 离线环境下 `load_dataset` 报网络错误**

原因:首次调用需要从网络下载数据集，无网络或目标地址不可达时失败。

解决:预先在有网络的环境下载并缓存，或直接读取本地 CSV 数据文件代替内置数据集。

**错误 2 · 加载数据集名拼写错误报 `ValueError`**

原因:数据集名称必须与 `get_dataset_names()` 返回的名称完全一致。

解决:先用 `sns.get_dataset_names()` 查看准确名称，再传入 `load_dataset`。

**错误 3 · `set_theme` 中 `style` 传非法值无效果或报错**

原因:`style` 只接受 `'darkgrid'`、`'whitegrid'`、`'dark'`、`'white'`、`'ticks'` 五个标准名。

解决:改用标准风格名，或先用 `axes_style(style=...)` 验证可用取值。

**错误 4 · `despine` 之后刻度仍与外边框粘连**

原因:脊柱移除后刻度线位置未随脊柱调整。

解决:使用 `despine(offset=...)` 让脊柱与刻度整体偏移，或配合 `trim=True` 裁剪多余刻度。
