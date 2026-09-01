---
title: 1.5 分布绘图
sidebar:
  order: 22
---
# 1.5 分布绘图

描述数据的第一步常常是看分布：单变量集中在哪个区间、是否对称、有没有长尾，两个变量是否相关、联合分布长什么样。Seaborn 的分布绘图系列提供直方图、核密度估计、经验累积分布、地毯图等单变量工具，以及联合分布图与配对分布图等多变量工具。本节先讲单变量分布，再讲双变量分布，最后讲 `jointplot()` 与 `pairplot()`。Seaborn 0.11 之后 `distplot()` 被拆分为 `histplot()` 与 `kdeplot()`，新代码统一使用拆分后的函数。

## 1.5.1 直方图 sns.histplot()

`histplot()` 把数据按区间分箱，统计每个箱内的数量并画成条：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 绘制 flipper_length_mm 的直方图
sns.histplot(data=penguins, x='flipper_length_mm')
plt.show()
```

常用参数：

| 参数 | 含义 |
| --- | --- |
| `bins` | 箱的数量，传整数或区间边界数组 |
| `binwidth` | 每个箱的宽度，指定后自动确定箱数 |
| `binrange` | 分箱范围 `(min, max)`，只统计区间内数据 |
| `stat` | 纵轴统计量：`'count'` 数量、`'density'` 密度、`'probability'` 概率、`'percent'` 百分比 |
| `kde` | 是否叠加核密度曲线 |
| `element` | 条的形状：`'bars'` 矩形、`'step'` 阶梯、`'poly'` 多边形 |
| `fill` | 是否填充颜色 |
| `multiple` | 多组叠加方式：`'layer'` 层叠、`'dodge'` 并排、`'stack'` 堆叠、`'fill'` 归一化堆叠 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 自定义箱数与统计量，叠加核密度曲线
sns.histplot(data=penguins, x='flipper_length_mm', bins=30,
             stat='density', kde=True, element='step', fill=False)
plt.show()

# 按物种用 hue 区分，multiple='stack' 堆叠显示
sns.histplot(data=penguins, x='flipper_length_mm', hue='species',
             multiple='stack')
plt.show()
```

`stat='density'` 让纵轴变为概率密度，直方图总面积等于 1，便于与核密度曲线对比；`multiple` 控制 `hue` 多组的叠加方式，`'stack'` 堆叠便于比较总数，`'fill'` 归一化便于比较比例。

## 1.5.2 核密度估计图 sns.kdeplot()

`kdeplot()` 用平滑曲线估计概率密度，不依赖分箱，适合观察分布的连续形状：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

sns.kdeplot(data=penguins, x='flipper_length_mm', fill=True)
plt.show()
```

常用参数：

| 参数 | 含义 |
| --- | --- |
| `bw_method` | 带宽计算方法，如 `'scott'`、`'silverman'` 或数值 |
| `bw_adjust` | 带宽缩放因子，大于 1 更平滑，小于 1 更贴合数据 |
| `cut` | 曲线延伸到数据范围外的距离 |
| `cumulative` | 是否画累积分布曲线 |
| `shade` | 旧参数，是否填充曲线下方，新版用 `fill` |
| `fill` | 是否填充曲线下方区域 |
| `multiple` | 多组叠加方式，与直方图一致 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# bw_adjust 调小更贴合数据；cumulative=True 画累积分布
sns.kdeplot(data=penguins, x='flipper_length_mm', hue='species',
            bw_adjust=0.5, cumulative=True)
plt.show()
```

`bw_adjust` 控制平滑程度，调小会出现更多细节、调大更平滑；`cumulative=True` 把曲线变为累积分布函数；`fill=True` 填充曲线与横轴之间的区域，读图更直观。

## 1.5.3 经验累积分布图 sns.ecdfplot()

`ecdfplot()` 画经验累积分布函数，横轴是数值，纵轴是小于等于该值的样本比例：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

sns.ecdfplot(data=penguins, x='flipper_length_mm')
plt.show()
```

常用参数：

| 参数 | 含义 |
| --- | --- |
| `stat` | 纵轴统计量：`'count'` 累积数量、`'proportion'` 累积比例、`'percent'` 累积百分比 |
| `complementary` | 是否画互补累积分布（大于该值的比例） |

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 画互补累积分布，观察右侧尾部分布
sns.ecdfplot(data=penguins, x='flipper_length_mm',
             stat='percent', complementary=True)
plt.show()
```

`ecdfplot()` 无任何平滑参数，忠实反映每个数据点，适合大数据量下快速判断分位数与分布形状；`complementary=True` 反映超过某一阈值的比例。

## 1.5.4 地毯图 sns.rugplot()

`rugplot()` 在坐标轴上画细短线（地毯须），标记每个数据点的位置：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

sns.rugplot(data=penguins, x='flipper_length_mm', height=0.1)
plt.show()
```

常用参数：

| 参数 | 含义 |
| --- | --- |
| `height` | 地毯须的高度比例 |
| `expand_margins` | 是否扩大坐标轴边距以容纳地毯须 |
| `hue` | 按分类给地毯须着色 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 地毯图叠加直方图，展示每个点的精确位置
sns.histplot(data=penguins, x='flipper_length_mm')
sns.rugplot(data=penguins, x='flipper_length_mm')
plt.show()
```

`height` 控制须线长度，`expand_margins=False` 时取消多余的边距。地毯图单独使用信息量有限，常叠加在直方图或核密度图上补充原始数据的位置信息。

## 1.5.5 双变量直方图与核密度图

两个数值变量同时传入 `x` 与 `y` 时，`histplot()` 与 `kdeplot()` 自动绘制二维分布：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 二维直方图，颜色深浅代表箱内计数
sns.histplot(data=penguins, x='bill_length_mm', y='bill_depth_mm')
plt.show()

# 二维核密度图，等高线表示密度层次
sns.kdeplot(data=penguins, x='bill_length_mm', y='bill_depth_mm',
            fill=True, levels=8)
plt.show()
```

二维 `histplot()` 把二维平面分成网格箱，颜色深浅表示箱内计数；二维 `kdeplot()` 估计联合密度，`fill=True` 填充等高线之间的区域，`levels` 控制等高线的层数。两者的 `hue`、`multiple` 等参数在二维场景下的行为有差异，常用场景是观察两个数值变量的联合分布与相关结构。

## 1.5.6 联合分布图 sns.jointplot()

`jointplot()` 把**双变量分布**画成一张复合图：中央是二维图，上、右侧各画一个变量的单变量分布（默认直方图）：

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

sns.jointplot(data=penguins, x='bill_length_mm', y='bill_depth_mm')
plt.show()
```

`kind` 控制中央图形的类型：

| kind | 中央图形 |
| --- | --- |
| `'scatter'` | 散点图（默认） |
| `'hist'` | 二维直方图 |
| `'kde'` | 二维核密度图 |
| `'hex'` | 六边形分箱图，适合大数据量 |
| `'reg'` | 散点图加回归线 |
| `'resid'` | 回归残差图 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

# 六边形分箱适合大数据量；kde 显示联合密度
sns.jointplot(data=penguins, x='bill_length_mm', y='bill_depth_mm', kind='hex')
plt.show()

sns.jointplot(data=penguins, x='bill_length_mm', y='bill_depth_mm',
              kind='kde', fill=True)
plt.show()
```

常用参数：`marginal_kws` 传给边缘子图的参数字典（如直方图的 `bins`），`joint_kws` 传给中央子图的参数字典，`dropna` 决定是否丢弃含缺失值的行。`jointplot()` 只展示两个变量的联合关系，想同时看更多变量用下一节的 `pairplot()`。

## 1.5.7 配对分布图 sns.pairplot()

`pairplot()` 把数据集中所有数值列两两组合画成矩阵：对角线是每个变量的单变量分布，非对角线是两两的散点图：

```python
import seaborn as sns
import matplotlib.pyplot as plt

iris = sns.load_dataset('iris')

sns.pairplot(data=iris, hue='species')
plt.show()
```

`hue` 传入分类列后，矩阵中每个子图按分类着色，对角线分布也按分类叠加，整体观察不同组在各维度上的分离程度。常用参数：

| 参数 | 含义 |
| --- | --- |
| `diag_kind` | 对角线图形：`'auto'`、`'hist'`、`'kde'`、`None` |
| `kind` | 非对角线图形：`'scatter'`、`'kde'`、`'hist'`、`'reg'` |
| `corner` | `True` 只画矩阵下三角，减少子图数量 |
| `plot_kws` | 传给非对角线子图的参数字典 |
| `diag_kws` | 传给对角线子图的参数字典 |
| `vars` | 指定参与绘图的列子集 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

iris = sns.load_dataset('iris')

# corner=True 只画下三角；diag_kind='kde' 对角线用密度曲线
sns.pairplot(data=iris, hue='species', corner=True,
             diag_kind='kde', kind='scatter')
plt.show()
```

`diag_kind` 控制对角线用什么单变量图，`None` 表示不画对角线；`kind` 控制非对角线两两图，`'reg'` 会在散点图加回归线；`corner=True` 只保留下三角，变量多时显著减少子图数量。变量过多时用 `vars` 挑选关键列，避免矩阵过大。

## 练习题

### 第1题 概念理解

说明 `histplot()` 与 `kdeplot()` 的区别；说明 `stat` 参数各取值（`count`、`density`、`probability`、`percent`）的含义；说明 `jointplot()` 与 `pairplot()` 各自适合什么场景。

::: details 参考答案

`histplot()` 按分箱统计数量，`kdeplot()` 用平滑曲线估计密度。`stat` 控制纵轴含义：`count` 是箱内数量，`density` 是概率密度（总面积 1），`probability` 是概率，`percent` 是百分比。`jointplot()` 聚焦两个变量的联合分布，`pairplot()` 同时展示多个变量的两两关系矩阵。
:::

### 第2题 代码编写

用 `penguins` 数据集分别绘制 `flipper_length_mm` 的直方图（叠加核密度）、核密度图、经验累积分布图和地毯图；再用 `jointplot` 绘制 `bill_length_mm` 与 `bill_depth_mm` 的散点联合分布。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')

sns.histplot(data=penguins, x='flipper_length_mm', kde=True)
plt.show()

sns.kdeplot(data=penguins, x='flipper_length_mm', fill=True)
plt.show()

sns.ecdfplot(data=penguins, x='flipper_length_mm')
plt.show()

sns.histplot(data=penguins, x='flipper_length_mm')
sns.rugplot(data=penguins, x='flipper_length_mm')
plt.show()

sns.jointplot(data=penguins, x='bill_length_mm', y='bill_depth_mm')
plt.show()
```

:::

### 第3题 进阶练习

用 `penguins` 数据集按 `species` 分组，绘制 `hue` 区分的堆叠直方图与核密度图；用 `jointplot` 的 `kind='kde'` 展示联合密度；用 `pairplot` 对 `iris` 数据集按物种着色，并尝试 `corner=True` 与 `diag_kind='kde'` 的配置。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

penguins = sns.load_dataset('penguins')
iris = sns.load_dataset('iris')

sns.histplot(data=penguins, x='flipper_length_mm', hue='species',
             multiple='stack')
plt.show()

sns.kdeplot(data=penguins, x='flipper_length_mm', hue='species', fill=True)
plt.show()

sns.jointplot(data=penguins, x='bill_length_mm', y='bill_depth_mm',
              kind='kde', fill=True)
plt.show()

sns.pairplot(data=iris, hue='species', corner=True, diag_kind='kde')
plt.show()
```

:::

## 常见错误

**错误 1 · 调用 `sns.distplot()` 报 `AttributeError`**

原因:Seaborn 0.11 起 `distplot()` 被移除,拆分成了 `histplot()` 与 `kdeplot()`。

解决:改用 `histplot()`（带 `kde=True` 可叠加核密度）或 `kdeplot()`。

**错误 2 · 直方图与核密度曲线高度对不上**

原因:纵轴 `stat` 不同,直方图默认 `count` 而核密度是概率密度,量纲不一致。

解决:把直方图设为 `stat='density'`,让两者同处概率密度量纲再叠加。

**错误 3 · `jointplot()` 想传 `bins` 给中央直方图没生效**

原因:`bins` 等参数属于中央子图,`jointplot()` 不直接透传。

解决:用 `joint_kws={'bins': 30}` 传入中央子图,用 `marginal_kws` 配置边缘子图。

**错误 4 · `pairplot()` 画出的矩阵太大看不清**

原因:变量列数多时两两组合暴增,子图数量平方级增长。

解决:用 `corner=True` 只画下三角,或先用 `vars` 挑选关键列。

**错误 5 · 数据含缺失值时分布图出现缺口或报错**

原因:缺失值不参与分箱与密度估计,二维绘图时还可能导致位置错位。

解决:先 `dropna()` 清洗,或给绘图函数传 `dropna=True` 参数。
