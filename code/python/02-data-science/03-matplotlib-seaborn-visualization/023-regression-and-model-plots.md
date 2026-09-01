---
title: 1.6 回归与模型绘图
sidebar:
  order: 23
---
# 1.6 回归与模型绘图

数据探索中常见的问题是两个数值变量之间是否存在线性趋势，例如小费金额随消费金额的增大如何变化、体重与身高是否正相关。手动绘制散点图后难以判断趋势强度，而单独拟合回归模型又需要额外的统计代码。Seaborn 提供一组**回归绘图函数**，把散点图、回归拟合、置信区间三者合并到一次调用中，用一张图同时呈现数据分布与统计结论。本节讲解 `sns.regplot()`、`sns.lmplot()` 与 `sns.residplot()` 三个核心函数及其参数。

## 1.6.1 regplot 散点与回归线

`sns.regplot()` 在散点图基础上叠加回归线，是最基础的回归绘图函数。它接受 `x`、`y` 与 `data` 三个核心参数，`x` 和 `y` 可以是 DataFrame 列名（配合 `data`），也可以是两个一维数组：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 以列名方式传入 x、y
sns.regplot(x='total_bill', y='tip', data=tips)
plt.show()
```

`regplot` 默认用最小二乘法拟合线性回归，回归线穿过散点的中心区域，并附带 95% 置信区间（默认 `ci=95`）。由于回归线由数据自动计算，图中同时保留原始散点，便于观察离群点对拟合的影响。

`x` 和 `y` 也可以直接传入数组，此时不需要 `data`：

```python
import numpy as np

rng = np.random.default_rng(0)
x = rng.normal(size=50)
y = 2 * x + rng.normal(size=50)
sns.regplot(x=x, y=y)
plt.show()
```

## 1.6.2 regplot 的关键参数

`regplot` 的主要参数用于控制回归方式与图形细节，下表列出常用参数及其含义：

| 参数 | 含义 |
| --- | --- |
| `x`、`y` | 横轴与纵轴数据，可为列名或数组 |
| `data` | 提供 `x`、`y` 的 DataFrame |
| `ci` | 置信区间宽度，`None` 表示不绘制，数值表示置信水平 |
| `order` | 多项式拟合阶数，`order=2` 表示二次回归 |
| `logx` | 对 `x` 取对数后拟合，适合指数型关系 |
| `robust` | 是否使用稳健回归，降低离群点影响 |
| `lowess` | 是否使用局部加权回归，拟合非线性曲线 |
| `x_bins` | 把 `x` 分成若干区间，绘制区间统计量 |
| `scatter_kws` | 散点样式字典 |
| `line_kws` | 回归线样式字典 |

### ci 置信区间

`ci` 控制置信区间的绘制方式。默认 `ci=95` 表示 95% 置信区间，`ci=None` 完全隐藏置信带，只保留回归线：

```python
# 只画回归线，不画置信区间
sns.regplot(x='total_bill', y='tip', data=tips, ci=None)
plt.show()
```

置信带的宽度反映估计的不确定性：样本量小或数据分散时，置信带更宽。

### order 多项式阶数

`order` 把回归线扩展为多项式拟合。数据呈明显弯曲时，一阶直线无法描述趋势，设置 `order=2` 或更高阶数即可拟合曲线：

```python
# 对 x 构造非线性数据
x = np.linspace(0, 10, 100)
y = x**2 + rng.normal(scale=5, size=100)

# 二次多项式拟合
sns.regplot(x=x, y=y, order=2)
plt.show()
```

`order` 取 1 时即普通线性回归，取 2 及以上时拟合抛物线及更高阶曲线。阶数越高曲线越灵活，也越容易过拟合，实际使用建议从 `order=2` 起步。

### logx 对数变换

`logx=True` 对 `x` 做对数变换后再拟合。数据呈现幂律或指数增长（如商品价格与销量）时，对数轴上的线性关系更直观：

```python
x = np.linspace(1, 100, 80)
y = 5 * x**0.5 + rng.normal(scale=3, size=80)

sns.regplot(x=x, y=y, logx=True)
plt.show()
```

`logx` 只对横轴变换，纵轴保持不变。

### robust 稳健回归

`robust=True` 使用稳健回归（基于 Huber 损失），对离群点的敏感度更低。普通最小二乘法会被极端值强烈拉拽，稳健回归对残差大的点赋予更小权重：

```python
# 人为加入几个极端离群点
x = np.linspace(0, 10, 50)
y = 2 * x + rng.normal(scale=2, size=50)
y[10] = 40
y[20] = -30

# 左侧为普通回归，右侧为稳健回归
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.regplot(x=x, y=y, ax=axes[0])
sns.regplot(x=x, y=y, ax=axes[1], robust=True)
plt.show()
```

对比两图可以看出，普通回归线被离群点明显拉偏，稳健回归线更接近数据主体。

### lowess 局部加权回归

`lowess=True` 使用局部加权回归拟合平滑曲线，能跟随数据局部的弯曲变化，适合结构复杂的关系。由于 LOWESS 没有显式公式，`ci` 此时显示的是自助法重采样得到的置信带：

```python
# 明显的波浪形数据
x = np.linspace(0, 4 * np.pi, 120)
y = np.sin(x) + rng.normal(scale=0.3, size=120)

sns.regplot(x=x, y=y, lowess=True)
plt.show()
```

`lowess` 与 `order` 相比更灵活，但无法给出多项式系数，只能得到逐点平滑估计。

### x_bins 分组统计

`x_bins` 把横轴切成若干区间，在每个区间内绘制数据点的均值（柱状误差棒）并叠加整体回归线，适合数据密集、散点重叠严重的情况：

```python
# 横轴分成 10 个区间，绘制区间均值
sns.regplot(x='total_bill', y='tip', data=tips, x_bins=10)
plt.show()
```

每个区间显示均值点及其置信区间，回归线仍然基于全部数据拟合。

### scatter_kws 与 line_kws

散点和回归线的样式分别由 `scatter_kws` 与 `line_kws` 控制，传入字典即可：

```python
sns.regplot(x='total_bill', y='tip', data=tips,
            scatter_kws={'s': 20, 'alpha': 0.6, 'color': 'steelblue'},
            line_kws={'linewidth': 2, 'color': 'red', 'linestyle': '--'})
plt.show()
```

`scatter_kws` 的键与 `plt.scatter` 的参数一致，`line_kws` 的键与 `plt.plot` 的参数一致。

## 1.6.3 lmplot 线性回归网格图

`sns.lmplot()` 是更高级的回归绘图接口，它基于 `FacetGrid` 构建，可以在分面网格中同时绘制多组回归。与 `regplot` 相比，`lmplot` 新增 `hue`、`col`、`row` 三个分类维度参数，一条调用就能对比不同类别的回归线：

```python
# 按性别着色，分别拟合回归线
sns.lmplot(x='total_bill', y='tip', data=tips, hue='sex')
plt.show()
```

`hue` 按分类变量的取值给散点和回归线着色，同时自动绘制图例。`col` 和 `row` 把图形切分为子图网格，每个子图对应一个分类取值：

```python
# 按性别分列、按时段分行
sns.lmplot(x='total_bill', y='tip', data=tips,
           col='sex', row='time')
plt.show()
```

`col='sex'` 生成两列子图，`row='time'` 生成两行子图，行列交叉处是性别的取值。

`palette` 参数控制 `hue` 使用的颜色序列，可以用 Seaborn 内置调色板名或颜色列表：

```python
sns.lmplot(x='total_bill', y='tip', data=tips,
           hue='day', palette='Set2')
plt.show()
```

`scatter_kws` 与 `line_kws` 在 `lmplot` 中同样可用，作用于所有子图的散点与回归线：

```python
sns.lmplot(x='total_bill', y='tip', data=tips, hue='sex',
           scatter_kws={'alpha': 0.5, 's': 30},
           line_kws={'linewidth': 2})
plt.show()
```

`lmplot` 还继承 `regplot` 的全部回归参数（`ci`、`order`、`logx`、`robust`、`lowess`、`x_bins`），用法与 `regplot` 完全一致：

```python
# 每个子图都做二次多项式拟合
sns.lmplot(x='total_bill', y='tip', data=tips,
           col='time', order=2)
plt.show()
```

## 1.6.4 residplot 残差图

`residplot` 用于检查回归拟合的残差分布。残差是真实值减去拟合值，良好的拟合应该让残差随机分布在零附近。`residplot` 以散点形式绘制残差，并绘制一条水平参考线：

```python
sns.residplot(x='total_bill', y='tip', data=tips)
plt.show()
```

残差图中所有点应围绕 `y=0` 均匀分布。如果残差呈现明显喇叭形或弯曲形，说明原数据不满足线性假设。

`lowess` 参数在残差图上叠加一条局部加权平滑线，帮助判断残差是否存在系统性偏移：

```python
sns.residplot(x='total_bill', y='tip', data=tips, lowess=True)
plt.show()
```

平滑线贴近水平线说明残差没有明显趋势，偏离明显则提示模型欠拟合。

`x_partial` 与 `y_partial` 参数接受控制变量，绘制时先对 `x`、`y` 分别对这些控制变量做回归，再对残差作图，实现**偏回归残差图**，用于剔除第三变量影响后检查两变量的关系：

```python
# 剔除 total_bill 的影响后，检查 size 与 tip 的关系
sns.residplot(x='size', y='tip', data=tips,
              x_partial='total_bill')
plt.show()
```

`x_partial` 从 `x` 中剔除给定变量的影响，`y_partial` 从 `y` 中剔除。两者都用于净化原始信号，让图中的残差更纯粹地反映目标关系。

## 1.6.5 regplot 与 lmplot 的关系与区别

`regplot` 与 `lmplot` 使用相同的数据拟合逻辑，差异集中在绘图组织方式上，两者的关系可以概括为以下几点：

| 维度 | `regplot` | `lmplot` |
| --- | --- | --- |
| 底层结构 | 单个坐标轴 | 基于 `FacetGrid` 的网格 |
| 分类变量 | 仅 `hue` 着色 | `hue`、`col`、`row` 三维分类 |
| 返回对象 | `Axes` 对象 | `FacetGrid` 对象 |
| 分面功能 | 无 | 支持 `col`、`row` 网格 |
| 回归参数 | `ci`、`order`、`logx` 等 | 与 `regplot` 完全一致 |

`regplot` 适合快速查看一组数据的趋势，或者嵌入 `plt.subplots()` 创建的多子图布局中；`lmplot` 适合需要按分类变量对比多组回归线的场景。`lmplot` 内部对每个子图调用 `regplot` 完成绘制，因此 `lmplot` 接受的回归参数与 `regplot` 一一对应。

## 练习题

### 第1题 概念理解

说明 `regplot` 与 `lmplot` 的底层结构与返回对象的区别；说明 `ci`、`order`、`lowess` 三个参数分别控制什么；说明 `residplot` 中 `x_partial` 与 `y_partial` 的作用。

::: details 参考答案

`regplot` 在单个坐标轴上绘图，返回 `Axes` 对象；`lmplot` 基于 `FacetGrid`，返回 `FacetGrid` 对象，可拆分为多子图。`ci` 控制置信区间宽度，`order` 设置多项式拟合阶数，`lowess` 启用局部加权回归。`x_partial`、`y_partial` 先对控制变量回归再对残差作图，用于剔除第三变量影响。
:::

### 第2题 代码编写

加载 `tips` 数据集，用 `regplot` 绘制 `total_bill` 与 `tip` 的回归图；把 `ci` 设为 `None`；分别用 `scatter_kws` 与 `line_kws` 调整散点大小和回归线样式。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.regplot(x='total_bill', y='tip', data=tips, ci=None,
            scatter_kws={'s': 25, 'alpha': 0.6},
            line_kws={'linewidth': 2, 'color': 'red'})
plt.show()
```

:::

### 第3题 进阶练习

用 `lmplot` 按 `hue='smoker'` 绘制两组回归线；再按 `col` 和 `row` 建立分面网格；用 `residplot` 检查残差，并尝试 `lowess=True` 观察残差趋势。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 按是否吸烟着色
sns.lmplot(x='total_bill', y='tip', data=tips, hue='smoker')
plt.show()

# 分面网格：行列分别对应性别与时段
sns.lmplot(x='total_bill', y='tip', data=tips,
           col='sex', row='time')
plt.show()

# 残差图与 LOWESS 平滑
sns.residplot(x='total_bill', y='tip', data=tips, lowess=True)
plt.show()
```

:::

## 常见错误

**错误 1 · `lmplot` 返回的不是坐标轴，无法调用 `set_title` 等方法报错**

原因:`lmplot` 返回 `FacetGrid` 对象，其子图存放在 `.axes` 属性中。

解决:对网格整体用 `FacetGrid` 的方法（如 `set_titles`），需要操作单个子图时通过 `g.axes` 或 `g.axes.flat` 获取。

**错误 2 · `order` 设置过大导致回归线剧烈震荡**

原因:高阶多项式在数据边缘外推时数值不稳定，产生过拟合。

解决:从 `order=2` 起步，结合领域知识选择阶数；数据呈现复杂弯曲时改用 `lowess=True`。

**错误 3 · `x_bins` 与 `lowess` 同时使用报 `TypeError`**

原因:两者都依赖局部估计，`x_bins` 与 `lowess` 在 `regplot` 中互斥。

解决:二选一使用，需要区间统计时用 `x_bins`，需要平滑曲线时用 `lowess`。

**错误 4 · 传数组给 `lmplot` 的 `x`、`y` 但未提供 `data` 报错**

原因:`lmplot` 依赖 DataFrame 接口，要求通过 `data` 提供列名。

解决:把数组放入 DataFrame，再用列名调用 `lmplot`；单图回归改用 `regplot`。
