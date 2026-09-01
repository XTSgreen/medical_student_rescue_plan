---
title: 1.3 统计关系绘图
sidebar:
  order: 20
---
# 1.3 统计关系绘图

数据分析中大量问题关注两个或多个变量之间的关系：账单金额与小费是否正相关，星期几与小费多少有没有关系，用餐人数如何影响账单。Seaborn 的关系绘图系列把这种多变量观察集成在一张图里，用颜色、大小、形状同时编码多个变量。本节讲解 `sns.relplot()` 顶层接口、散点图、线图与底层函数的对应关系。`relplot()` 以 FacetGrid 为基础，能按行、列分面，是关系绘图的统一入口。

## 1.3.1 relplot() 顶层接口

`sns.relplot()` 是关系绘图的**顶层接口**，用一个函数统一散点图与线图，并支持按行、列分面（facet）。`kind` 参数选择图形类型：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# kind='scatter' 绘制散点图
sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter')
plt.show()

# kind='line' 绘制线图
sns.relplot(data=tips, x='total_bill', y='tip', kind='line')
plt.show()
```

`relplot()` 基于 FacetGrid 实现，因此支持分面参数 `col` 与 `row`：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 按是否吸烟分列，一行两图
sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter', col='smoker')
plt.show()

# 按吸烟与性别同时分面，行、列各一个维度
sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter',
            col='smoker', row='sex')
plt.show()
```

`col` 按某列取值把数据拆成多列并排的子图，`row` 拆成多行。分面让不同分组的对比一目了然，`col_wrap` 还可以限制每行子图数量。

## 1.3.2 kind='scatter' 散点图

散点图把每个数据点画在二维平面上，直观展示两个数值变量的相关关系。`relplot()` 的 `kind='scatter'` 支持把多个变量同时映射到图形属性上：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# x、y 映射数值列，hue 按分类着色，size 按数值改变大小，style 按分类改变形状
sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter',
            hue='smoker', size='size', style='time')
plt.show()
```

主要参数及其含义：

| 参数 | 含义 |
| --- | --- |
| `x`、`y` | 映射到横轴与纵轴的列名 |
| `hue` | 按某列取值改变颜色，分类变量着色，数值变量渐变 |
| `size` | 按某列取值改变点的大小 |
| `style` | 按分类变量改变点的形状 |
| `data` | DataFrame 数据源 |
| `palette` | 指定调色板 |
| `alpha` | 点的透明度，数据重叠多时用 |

一张图里最多可以同时编码四个变量：`x`、`y` 决定位置，`hue` 决定颜色，`size` 决定大小，`style` 决定形状。`hue` 传数值列时自动用连续色带表达大小。点数量多、重叠严重时调低 `alpha`。

## 1.3.3 kind='line' 线图

线图适合观察变量随另一变量变化的趋势。`relplot()` 的 `kind='line'` 默认对每个 `x` 位置的多个 `y` 值做聚合，并绘制**置信区间**：

```python
import seaborn as sns
import matplotlib.pyplot as plt

fmri = sns.load_dataset('fmri')

# 默认聚合 y 的均值并画置信区间
sns.relplot(data=fmri, x='timepoint', y='signal', kind='line')
plt.show()
```

`fmri` 数据集中同一时间点有多个被试的测量值，`relplot` 默认对每个 `x` 计算均值，用阴影带表示置信区间。线图的关键参数：

| 参数 | 含义 |
| --- | --- |
| `marker` | 在数据点位置画标记符号 |
| `dashes` | 是否按 `style` 使用不同虚线样式 |
| `estimator` | 聚合函数，传 `None` 时对每个 `x` 画一条线 |
| `err_style` | 置信区间样式，`'band'` 阴影带或 `'bars'` 误差棒 |
| `ci` | 置信区间宽度，传整数为置信百分比，传 `'sd'` 为标准差，传 `None` 不画 |
| `sort` | 是否按 `x` 排序后再连线 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

fmri = sns.load_dataset('fmri')

# 按区域分色，按时间分虚线，画数据点标记
sns.relplot(data=fmri, x='timepoint', y='signal', kind='line',
            hue='region', style='event', marker='o', dashes=True)
plt.show()

# estimator=None 时每个 x 单独成线，ci=None 关闭置信区间
sns.relplot(data=fmri, x='timepoint', y='signal', kind='line',
            estimator=None, ci=None)
plt.show()
```

`sort=False` 时按数据出现的原始顺序连线，适合数据本身有序的场景。`ci='sd'` 用标准差代替置信区间，`err_style='bars'` 把阴影带换成误差棒。

## 1.3.4 直接绘制 scatterplot() 与 lineplot()

`relplot()` 是顶层接口，`sns.scatterplot()` 与 `sns.lineplot()` 是它内部的**底层函数**，直接在当前坐标轴上绘图，不创建新图形、不支持分面。参数与 `relplot()` 完全一致：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')
fmri = sns.load_dataset('fmri')

# 直接在当前坐标轴上画散点图
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='smoker')
plt.show()

# 直接画线图
sns.lineplot(data=fmri, x='timepoint', y='signal', hue='region')
plt.show()
```

两者的关系可以这样理解：`relplot()` 是高层入口，负责创建分面与处理分面参数，把参数转发给 `scatterplot()` 或 `lineplot()`；`scatterplot()` 与 `lineplot()` 是单图函数，适合在已有坐标轴上叠加绘图，或者配合 `plt.subplots()` 自定义布局。

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 在已有坐标轴上叠加两组散点
ax = plt.subplot()
sns.scatterplot(data=tips[tips['smoker'] == 'Yes'],
                x='total_bill', y='tip', color='red', label='吸烟')
sns.scatterplot(data=tips[tips['smoker'] == 'No'],
                x='total_bill', y='tip', color='blue', label='不吸烟')
plt.legend()
plt.show()
```

需要分面时用 `relplot()`，需要在单个坐标轴上精细控制或叠加图层时用底层函数。选择哪一个取决于是否依赖分面能力。

## 1.3.5 hue、size、style 的组合使用

三个映射参数可以自由组合，数量越多编码的信息越丰富，但可读性也随之下降。组合时遵循两个原则：**分类变量**用 `hue` 或 `style`（颜色、形状），**数值变量**用 `hue`（连续色带）或 `size`（大小）；信息量优先，但组合过多时要权衡可读性。

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# hue 按是否吸烟，size 按用餐人数，style 按用餐时段
sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter',
            hue='smoker', size='size', style='time', alpha=0.6)
plt.show()
```

三个维度同时使用可以在一张图里表达五个变量：`x`、`y` 两个位置变量，`hue` 一个分类或数值变量，`size` 一个数值变量，`style` 一个分类变量。图例会自动生成，帮助读者对应颜色、大小、形状的含义。

## 练习题

### 第1题 概念理解

说明 `relplot()` 与 `scatterplot()`、`lineplot()` 的关系；说明 `hue`、`size`、`style` 三个参数各自适合编码哪种类型的变量；说明线图中置信区间的来源。

::: details 参考答案

`relplot()` 是顶层接口，基于 FacetGrid 支持分面，内部调用 `scatterplot()` 或 `lineplot()` 绘图；底层函数在单个坐标轴上绘图，不支持分面。`hue` 适合编码分类变量（离散着色）与数值变量（连续色带），`size` 适合编码数值变量，`style` 适合编码分类变量。线图对每个 x 位置的多个 y 值做聚合（默认均值），置信区间来自聚合值的统计估计。
:::

### 第2题 代码编写

用 `tips` 数据集绘制 total_bill 与 tip 的散点图，用 `hue` 区分是否吸烟、`size` 区分用餐人数；再用 `relplot()` 按 `day` 分列绘制线图观察趋势。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter',
            hue='smoker', size='size', alpha=0.6)
plt.show()

sns.relplot(data=tips, x='size', y='total_bill', kind='line', col='day')
plt.show()
```

:::

### 第3题 进阶练习

用 `fmri` 数据集绘制 `signal` 随 `timepoint` 变化的线图，`hue` 区分区域、`style` 区分事件；调整 `ci='sd'` 与 `err_style='bars'` 对比置信区间样式；再用 `relplot(row=..., col=...)` 同时按两个变量分面。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

fmri = sns.load_dataset('fmri')

sns.relplot(data=fmri, x='timepoint', y='signal', kind='line',
            hue='region', style='event', marker='o')
plt.show()

sns.relplot(data=fmri, x='timepoint', y='signal', kind='line',
            hue='region', ci='sd', err_style='bars')
plt.show()

sns.relplot(data=fmri, x='timepoint', y='signal', kind='line',
            row='region', col='event')
plt.show()
```

:::

## 常见错误

**错误 1 · `relplot()` 里传了 `subplots` 参数报 `TypeError`**

原因:`relplot()` 不支持 `subplots` 或 `ax` 参数,分面布局由 `col`、`row` 控制。

解决:需要指定单个坐标轴时改用 `scatterplot()` 或 `lineplot()`,需要分面时用 `col`、`row`。

**错误 2 · 线图出现大量杂乱的线而不是一条趋势线**

原因:没有对每个 x 聚合,`estimator=None` 时每个数据点单独成线。

解决:保留默认的 `estimator` 聚合,或先对数据做分组均值再传入。

**错误 3 · 置信区间报 `FutureWarning` 关于 `ci` 参数**

原因:新版 Seaborn 中 `ci` 参数逐步废弃,推荐使用 `errorbar`。

解决:使用新版语法 `errorbar='sd'` 或 `errorbar=('ci', 95)`,旧代码用 `ci` 仍可运行但会告警。

**错误 4 · 数据点大量重叠看不清分布**

原因:数据量小时点不重叠没问题,样本量增大后点叠成一片。

解决:调低 `alpha` 透明度,或改用六边形分箱、密度类图形。

**错误 5 · 分面子图太多导致图太大**

原因:`col` 或 `row` 的分类取值很多,子图数量暴增。

解决:用 `col_wrap` 限制每行数量,或先用 `hue` 合并分类再决定分面。
