---
title: 1.8 多图网格系统
sidebar:
  order: 25
---
# 1.8 多图网格系统

探索多维数据时，单个图表只能容纳有限的信息维度，而手动用循环逐个绘制子图又十分繁琐。Seaborn 提供三个**网格类**，把数据按照分类变量切分到多个子图中，用统一的坐标轴与颜色自动组织整幅图形。`FacetGrid`、`PairGrid`、`JointGrid` 分别解决分类分面、变量两两组合、联合分布三类需求。本节讲解这三个类的构造函数、常用方法，以及它们与 `relplot`、`catplot`、`pairplot`、`jointplot` 高层接口的关系。

## 1.8.1 FacetGrid 类

`FacetGrid` 按一个或多个分类变量把数据切分成网格，每个单元格绘制同一类图。构造函数接收 `data`、`row`、`col`、`hue` 四个数据参数，以及 `palette`、`height`、`aspect` 三个样式参数：

| 参数 | 含义 |
| --- | --- |
| `data` | 数据源 DataFrame |
| `row` | 按此分类变量分行 |
| `col` | 按此分类变量分列 |
| `hue` | 按此分类变量着色 |
| `palette` | `hue` 使用的调色板 |
| `height` | 每个子图的高度（英寸） |
| `aspect` | 每个子图的宽高比 |

构造 `FacetGrid` 只建立网格框架，不会绘制任何图形。网格内容通过 `map()` 等方法填充：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 建立按性别分列的网格
g = sns.FacetGrid(tips, col='sex', height=4, aspect=1)
```

### map() 绘制函数映射

`map()` 是核心方法，把指定绘图函数应用到每个子图。传入绘图函数名与对应的数据列名即可：

```python
# 每个子图绘制同一列的直方图
g = sns.FacetGrid(tips, col='sex')
g.map(plt.hist, 'total_bill')
plt.show()
```

`map` 的第一个参数可以是 `plt.hist` 等 Matplotlib 函数，也可以传入 `sns.histplot` 等 Seaborn 函数。数据列名作为后续位置参数传入：

```python
# 用 seaborn 函数绘制，带核密度估计
g = sns.FacetGrid(tips, col='sex')
g.map(sns.histplot, 'total_bill', kde=True)
plt.show()
```

### map_dataframe() 兼容 DataFrame 的映射

部分绘图函数要求数据以 DataFrame 形式传入，此时使用 `map_dataframe()`。它会把 `data` 作为第一个参数传给绘图函数，后续参数是列名：

```python
# 自定义函数接收 DataFrame 作为第一参数
def plot_avg(data, color, label):
    sns.pointplot(x='day', y='total_bill', data=data, color=color)

g = sns.FacetGrid(tips, col='time')
g.map_dataframe(plot_avg, 'day', 'total_bill')
plt.show()
```

`map_dataframe` 适合传入 `sns.pointplot`、`sns.barplot` 等依赖 `data` 参数的函数，这类函数内部需要访问整个 DataFrame。

### 图例与标签方法

`add_legend()` 为 `hue` 生成的分类图例；`set_axis_labels()` 统一设置坐标轴标签；`set_titles()` 设置每个子图的标题模板：

```python
g = sns.FacetGrid(tips, col='sex', hue='smoker')
g.map(sns.scatterplot, 'total_bill', 'tip')
g.add_legend()
g.set_axis_labels('消费金额', '小费金额')
g.set_titles(col_template='{col_name} 性别')
plt.show()
```

`set_titles` 的模板中 `{col_name}`、`{row_name}`、`{col_var}`、`{row_var}` 是占位符，分别替换为分类取值与分类变量名。

### reorder() 与 despine()

`reorder()` 调整子图的显示顺序，`despine()` 移除多余的坐标轴脊柱：

```python
g = sns.FacetGrid(tips, col='day')
g.map(sns.histplot, 'total_bill')
# 按指定顺序重排子图
g.reorder(['Fri', 'Sat', 'Sun', 'Thur'])
# 移除上、右脊柱
g.despine()
plt.show()
```

`reorder` 接受分类取值的列表，按列表顺序排列子图。`despine` 默认移除上、右脊柱，让图形更简洁。

## 1.8.2 PairGrid 类

`PairGrid` 为多个变量的两两组合建立子图网格：对角线位置通常是单变量分布，非对角线位置是两个变量的联合图。构造函数参数：

| 参数 | 含义 |
| --- | --- |
| `data` | 数据源 DataFrame，默认对所有数值列建网格 |
| `hue` | 按此变量给点着色 |
| `diag_sharey` | 对角子图是否共享纵轴 |
| `corner` | 是否只显示左下三角区域 |

构造后通过 `map_diag`、`map_offdiag`、`map_upper`、`map_lower` 分别填充不同区域：

```python
iris = sns.load_dataset('iris')

g = sns.PairGrid(iris.drop(columns='species'))
g.map_diag(sns.histplot)          # 对角线画直方图
g.map_offdiag(sns.scatterplot)    # 非对角线画散点图
plt.show()
```

`map_diag` 作用于对角线单元格，适合直方图、核密度图；`map_offdiag` 作用于全部非对角线单元格，适合散点图。

### map_upper 与 map_lower 分区映射

`map_upper` 与 `map_lower` 分别作用于上三角与下三角，可在同一个 `PairGrid` 中同时使用两种图，例如上三角用散点、下三角用密度图：

```python
g = sns.PairGrid(iris.drop(columns='species'), corner=True)
g.map_diag(sns.histplot, kde=True)
g.map_upper(sns.scatterplot)
g.map_lower(sns.kdeplot)
plt.show()
```

`corner=True` 只保留左下三角区域，避免重复绘制对称部分，适合变量较多时节省空间。

### hue 与 add_legend

`hue` 让网格中的点按类别着色，再用 `add_legend()` 添加图例：

```python
g = sns.PairGrid(iris, hue='species', diag_sharey=False)
g.map_diag(sns.histplot, kde=True)
g.map_offdiag(sns.scatterplot)
g.add_legend()
plt.show()
```

`diag_sharey=False` 让每个对角子图独立缩放纵轴，避免不同变量分布被压扁。

## 1.8.3 JointGrid 类

`JointGrid` 同时显示两个变量的联合分布与各自的边缘分布：主区域绘制散点或密度图，顶部与右侧绘制对应变量的单变量分布。构造函数参数：

| 参数 | 含义 |
| --- | --- |
| `x` | 横轴变量 |
| `y` | 纵轴变量 |
| `data` | 数据源 DataFrame |
| `height` | 图形总高度（英寸） |
| `ratio` | 主区域与边缘区域的高度比 |
| `space` | 主区域与边缘区域的间距 |

```python
g = sns.JointGrid(x='total_bill', y='tip', data=tips,
                  height=5, ratio=5, space=0.2)
```

### plot_joint() 与 plot_marginals()

`plot_joint()` 填充主区域，`plot_marginals()` 填充边缘分布：

```python
g = sns.JointGrid(x='total_bill', y='tip', data=tips)
g.plot_joint(sns.scatterplot)          # 主区域散点
g.plot_marginals(sns.histplot)         # 边缘分布直方图
plt.show()
```

`ratio` 控制主区域与边缘区域的高度比，`space` 控制两者间距。`height` 指定图形总高度，宽度由内部按比例计算。

### set_axis_labels()

`set_axis_labels()` 一次设置主区域两个坐标轴的标签：

```python
g = sns.JointGrid(x='total_bill', y='tip', data=tips)
g.plot_joint(sns.scatterplot)
g.plot_marginals(sns.histplot)
g.set_axis_labels('消费金额', '小费金额')
plt.show()
```

## 1.8.4 网格类与高层接口的关系

Seaborn 的高层绘图接口是网格类的封装。`relplot`、`catplot` 内部创建 `FacetGrid`，`pairplot` 内部创建 `PairGrid`，`jointplot` 内部创建 `JointGrid`，再调用对应的 `map` 方法完成绘制：

| 高层接口 | 封装网格类 | 默认绘制函数 | 典型场景 |
| --- | --- | --- | --- |
| `sns.relplot` | `FacetGrid` | `scatterplot` / `lineplot` | 带分面的关系图 |
| `sns.catplot` | `FacetGrid` | 分类图族 | 带分面的分类图 |
| `sns.pairplot` | `PairGrid` | 直方图与散点图 | 多变量两两关系 |
| `sns.jointplot` | `JointGrid` | 散点与直方图 | 双变量联合分布 |

高层接口用 `kind` 参数切换内部绘制的图形类型，例如 `sns.relplot(kind='line')`、`sns.catplot(kind='box')`：

```python
# relplot 等价于 FacetGrid + scatterplot
sns.relplot(x='total_bill', y='tip', data=tips, col='sex')
plt.show()

# catplot 等价于 FacetGrid + boxplot
sns.catplot(x='day', y='total_bill', data=tips, kind='box', col='time')
plt.show()
```

网格类与高层接口的选择原则：高层接口代码更短，适合标准用法；网格类适合自定义绘图函数、精细控制每个区域，或组合多种图形类型。高层接口返回的对象仍是对应的网格类实例，因此 `add_legend()`、`set_titles()`、`despine()` 等方法在两种方式下都可用。

## 练习题

### 第1题 概念理解

说明 `FacetGrid`、`PairGrid`、`JointGrid` 各自的适用场景；说明 `map` 与 `map_dataframe` 的区别；说明 `relplot`、`catplot`、`pairplot`、`jointplot` 分别封装了哪个网格类。

::: details 参考答案

`FacetGrid` 按分类变量分面子图，`PairGrid` 展示多变量两两组合，`JointGrid` 展示双变量联合与边缘分布。`map` 直接传入列名到绘图函数，`map_dataframe` 把整个 DataFrame 作为第一参数传给绘图函数。`relplot`、`catplot` 封装 `FacetGrid`，`pairplot` 封装 `PairGrid`，`jointplot` 封装 `JointGrid`。
:::

### 第2题 代码编写

加载 `tips` 数据集，用 `FacetGrid` 按 `day` 分列、按 `smoker` 着色，`map` 绘制 `total_bill` 与 `tip` 的散点图，调用 `add_legend()` 与 `set_axis_labels()` 完善图形。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

g = sns.FacetGrid(tips, col='day', hue='smoker')
g.map(sns.scatterplot, 'total_bill', 'tip')
g.add_legend()
g.set_axis_labels('消费金额', '小费金额')
plt.show()
```

:::

### 第3题 进阶练习

用 `PairGrid` 对 `iris` 数据集的数值列绘制对角线直方图、上三角散点图、下三角核密度图，设置 `hue='species'` 并添加图例；再用 `JointGrid` 绘制 `sepal_length` 与 `sepal_width` 的联合分布，主区域用散点、边缘用直方图。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

iris = sns.load_dataset('iris')

# PairGrid：分区映射
g = sns.PairGrid(iris, hue='species')
g.map_diag(sns.histplot, kde=True)
g.map_upper(sns.scatterplot)
g.map_lower(sns.kdeplot)
g.add_legend()
plt.show()

# JointGrid：联合与边缘分布
g2 = sns.JointGrid(x='sepal_length', y='sepal_width', data=iris)
g2.plot_joint(sns.scatterplot)
g2.plot_marginals(sns.histplot)
g2.set_axis_labels('花萼长度', '花萼宽度')
plt.show()
```

:::

## 常见错误

**错误 1 · 构造 `FacetGrid` 后没有调用 `map`，图形空白**

原因:网格类只建立框架，绘图内容必须通过 `map`、`map_dataframe` 等方法填充。

解决:构造后调用 `map(sns.scatterplot, 'x', 'y')` 等映射方法，再 `plt.show()`。

**错误 2 · `map_dataframe` 传列名给自定义函数报参数错误**

原因:自定义函数的第一参数需接收 DataFrame，其余参数才是列名。

解决:函数签名写成 `def plot(data, color, label):` 或 `def plot(x, y, data, **kwargs):`，与 `map_dataframe` 的传参约定一致。

**错误 3 · 忘记调用 `add_legend()`，`hue` 分类无图例**

原因:网格类的图例需要显式添加。

解决:调用 `g.add_legend()` 生成图例；图例位置可用 `g.add_legend(title='类别', loc='upper right')` 调整。

**错误 4 · `PairGrid` 变量过多导致图形巨大且重叠**

原因:每个变量对生成一个子图，变量数为 n 时网格大小为 n×n。

解决:先用 `corner=True` 只显示下三角，或用 `vars=[...]` 参数只选择少量变量。
