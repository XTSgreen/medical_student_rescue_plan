---
title: 1.13 可视化集成
sidebar:
  order: 13
---
# 1.13 可视化集成

数据分析的最后一步是呈现结果，图表比表格更能直观传达分布与趋势。Pandas 内置基于 Matplotlib 的绘图接口 `.plot()`，可以直接从 DataFrame 或 Series 生成常见图表，无需显式操作 Matplotlib 对象。虽然底层是 Matplotlib，但调用方式属于 Pandas API。本节讲解 `.plot()` 的各种图表类型与常用参数，以及 `.hist()`、`.boxplot()` 等快捷方法。完整的绘图定制交给 Matplotlib/Seaborn 章节。

## 1.13.1 .plot() 方法基础

`.plot()` 是 Series 与 DataFrame 的绘图方法，`kind` 参数指定图表类型。首次使用前需要导入 matplotlib 并设置交互后端：

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({'月份': ['1月', '2月', '3月'],
                   '销量': [120, 150, 130]})
df.plot(x='月份', y='销量', kind='line')
plt.show()
```

在 Jupyter 中通常不需要 `plt.show()`，输出会自动内嵌。`x`、`y` 指定用作横轴和纵轴的列。

## 1.13.2 图表类型

### 线图 kind='line'

线图适合展示趋势与时间序列，是默认类型：

```python
s = pd.Series([1, 3, 2, 5, 4], index=pd.date_range('2024-01-01', periods=5))
s.plot(kind='line')
plt.show()
```

### 柱状图 kind='bar' / kind='barh'

柱状图适合比较离散类别的数值，`barh` 是水平柱状图：

```python
df = pd.DataFrame({'类别': ['A', 'B', 'C'], '数量': [10, 25, 15]})
df.plot(x='类别', y='数量', kind='bar')
df.plot(x='类别', y='数量', kind='barh')
plt.show()
```

### 直方图 kind='hist'

直方图展示数值分布：

```python
df = pd.DataFrame({'值': [1, 2, 2, 3, 3, 3, 4, 4, 5]})
df.plot(kind='hist', bins=5)
plt.show()
```

### 箱线图 kind='box'

箱线图展示分布的集中趋势与离群点：

```python
df.plot(kind='box')
plt.show()
```

### 密度图 kind='kde' / kind='density'

密度图是直方图的平滑版本，适合观察分布形状：

```python
df.plot(kind='kde')
plt.show()
```

### 面积图 kind='area'

面积图用填充区域展示累积量与占比：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]})
df.plot(kind='area', stacked=True)
plt.show()
```

### 散点图 kind='scatter'

散点图展示两个变量的关系，`x`、`y` 必填：

```python
df = pd.DataFrame({'x': [1, 2, 3, 4], 'y': [2, 4, 1, 5]})
df.plot(x='x', y='y', kind='scatter')
plt.show()
```

### 饼图 kind='pie'

饼图展示占比，`y` 指定数值列：

```python
df = pd.DataFrame({'类别': ['A', 'B', 'C'], '占比': [40, 35, 25]})
df.set_index('类别')['占比'].plot(kind='pie', autopct='%.1f%%')
plt.show()
```

### 六边形箱图 kind='hexbin'

`hexbin` 用六边形分箱展示二维密度，适合大量散点：

```python
df = pd.DataFrame({'x': [1, 2, 3, 4, 1, 2, 3], 'y': [2, 4, 1, 5, 3, 4, 2]})
df.plot(x='x', y='y', kind='hexbin', gridsize=5)
plt.show()
```

### 带回归的散点图 kind='reg'

`reg` 在散点基础上叠加回归线，需要 seaborn 支持：

```python
df.plot(x='x', y='y', kind='reg')
plt.show()
```

## 1.13.3 绘图选项

`.plot()` 提供大量参数控制图表外观：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [2, 4, 3]})

df.plot(kind='line',
        figsize=(8, 5),        # 图形尺寸
        title='销量趋势',       # 标题
        legend=True,            # 图例
        grid=True,              # 网格
        xlim=(0, 4),            # x 轴范围
        ylim=(0, 5),            # y 轴范围
        xticks=[0, 1, 2, 3],    # x 轴刻度
        yticks=[0, 2, 4],       # y 轴刻度
        colormap='viridis')     # 颜色映射
plt.show()
```

DataFrame 多列数据一次绘制多组：

```python
df.plot(kind='line', subplots=True, sharex=True, sharey=False)
plt.show()
```

`subplots=True` 把每列绘制到独立子图，`sharex`、`sharey` 控制各子图是否共享坐标轴。

## 1.13.4 快捷方法 .hist() 与 .boxplot()

`.hist()` 一键绘制所有数值列的直方图，`.boxplot()` 一键绘制箱线图：

```python
df = pd.DataFrame({'A': [1, 2, 3, 4], 'B': [2, 2, 3, 5]})
df.hist(bins=5, figsize=(8, 4))
plt.show()

df.boxplot()
plt.show()
```

`.hist()` 与 `.boxplot()` 是 `.plot(kind='hist')`、`.plot(kind='box')` 的快捷写法，适合快速生成整表的分布概览。

## 1.13.5 与 Matplotlib 的配合

Pandas 绘图返回 Matplotlib 的 Axes 对象，可以继续用 Matplotlib API 精细定制：

```python
ax = df.plot(kind='line', title='标题')
ax.set_xlabel('横轴名')
ax.set_ylabel('纵轴名')
ax.legend(['序列1'])
plt.show()
```

保存图表用 `plt.savefig('figure.png', dpi=150)`。

## 练习题

### 第1题 概念理解

说明 `.plot()` 的 `kind` 参数支持哪些常见类型，各适合什么数据；说明 `subplots=True` 的作用。

::: details 参考答案

`line` 适合趋势，`bar`/`barh` 适合类别比较，`hist` 适合分布，`box` 适合分布与离群点，`kde` 适合平滑密度，`area` 适合累积量，`scatter` 适合两变量关系，`pie` 适合占比，`hexbin` 适合二维密度，`reg` 适合带回归的散点。`subplots=True` 把每列绘制到独立子图。
:::

### 第2题 代码编写

创建包含两列数据（一列线性增长、一列随机波动）的 DataFrame，用 `.plot` 绘制线图并设置标题、图例、网格；再分别绘制柱状图与直方图。

::: details 参考答案

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

df = pd.DataFrame({'A': range(1, 11), 'B': np.random.randn(10)})
df.plot(kind='line', title='双序列', legend=True, grid=True)
plt.show()

df.plot(kind='bar')
plt.show()

df['A'].plot(kind='hist', bins=5)
plt.show()
```

:::

### 第3题 进阶练习

绘制一张包含 `subplots=True`、`sharey=True` 的多子图折线图；用 `.hist()` 查看多列的分布；用散点图绘制两变量的关系并用 `kind='reg'` 叠加回归线。

::: details 参考答案

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

df = pd.DataFrame({'X': np.arange(10), 'Y': np.random.randn(10) * 2})
df.plot(kind='line', subplots=True, sharey=True, figsize=(8, 6))
plt.show()

df.hist(bins=5)
plt.show()

df.plot(x='X', y='Y', kind='scatter')
plt.show()
```

:::

## 常见错误

**错误 1 · 绘图后窗口一闪而过或图表不显示**

原因:未调用 `plt.show()`,或在非交互环境下图表没有渲染。

解决:绘图后加 `plt.show()`;Jupyter 中需开启 `%matplotlib inline`。

**错误 2 · `kind='scatter'` 报缺 `x` 和 `y` 参数**

原因:散点图必须指定横纵轴列,不能像其他图那样自动使用所有列。

解决:传 `x='列名', y='列名'`。

**错误 3 · 中文标题或标签显示为方框**

原因:Matplotlib 默认字体不含中文字符。

解决:设置中文字体,如 `plt.rcParams['font.sans-serif'] = ['SimHei']`,并加 `plt.rcParams['axes.unicode_minus'] = False`。

**错误 4 · `.plot()` 后报缺少 matplotlib 库**

原因:Pandas 绘图依赖 Matplotlib,未安装时报 `ImportError`。

解决:`pip install matplotlib`。
