---
title: 1.4 分类数据绘图
sidebar:
  order: 21
---
# 1.4 分类数据绘图

数据分析经常按分类比较数值：不同性别的账单均值谁更高，星期四和星期六的小费分布差多少，不同用餐人数对应的消费有什么规律。这类问题把数据按分类变量分组，再在每个组内展示数值分布或统计量。Seaborn 的分类绘图系列覆盖散点分布、箱线图、小提琴图、点图、条图、计数图等多种形态。本节讲解 `sns.catplot()` 顶层接口与九种 `kind` 的用法。`catplot()` 与上一节的 `relplot()` 结构一致，都基于 FacetGrid 支持分面。

## 1.4.1 catplot() 顶层接口

`sns.catplot()` 是分类绘图的**顶层接口**，`kind` 参数选择具体图形类型，`col`、`row` 参数分面：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# kind='box' 按 day 分组画箱线图
sns.catplot(data=tips, x='day', y='total_bill', kind='box')
plt.show()

# 按是否吸烟分列
sns.catplot(data=tips, x='day', y='total_bill', kind='box', col='smoker')
plt.show()
```

`catplot()` 的可选 `kind` 值：`'strip'`、`'swarm'`、`'box'`、`'violin'`、`'boxen'`、`'point'`、`'bar'`、`'count'`。每种 `kind` 对应一个底层绘图函数，`catplot()` 负责分面并把参数转发给底层函数。分类顺序用 `order` 与 `hue_order` 控制，见 1.4.10。

## 1.4.2 kind='strip' 散点分布

`kind='strip'` 把每个数据点沿分类轴排开，对应底层函数 `sns.stripplot()`：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.stripplot(data=tips, x='day', y='total_bill', jitter=True)
plt.show()
```

`jitter` 给点加上随机水平偏移，避免同一位置的点完全重叠；默认开启，传 `jitter=0.2` 可控制偏移幅度。配合 `hue` 区分第二个分类时用 `dodge`：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# dodge=True 让两个 hue 组在分类轴内左右分开
sns.stripplot(data=tips, x='day', y='total_bill', hue='smoker', dodge=True)
plt.show()
```

`dodge` 决定是否把 `hue` 分组错开排列，`True` 时各组并排不重叠。

## 1.4.3 kind='swarm' 蜂群图

`kind='swarm'` 对应 `sns.swarmplot()`，点不重叠且紧密排列，形状像蜂群：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# swarm 避免点重叠，每个点都可见
sns.swarmplot(data=tips, x='day', y='total_bill', hue='smoker')
plt.show()
```

`swarmplot()` 自动计算点的排列位置，让所有点不重叠又尽量紧凑，数据量适中时比 `stripplot()` 更清晰。`swarmplot()` 同样支持 `dodge` 与 `hue`。样本量很大时计算变慢，此时换用 `strip` 或后面介绍的 `boxen`。

## 1.4.4 kind='box' 箱线图

`kind='box'` 对应 `sns.boxplot()`，用四分位数概括分布：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.boxplot(data=tips, x='day', y='total_bill', hue='smoker')
plt.show()
```

箱体上下边是上下四分位数，中位线在箱内，须线延伸到非异常值范围，超出范围的点单独标出。关键参数：

| 参数 | 含义 |
| --- | --- |
| `whis` | 须线范围，默认 1.5 倍四分位距，传数组可自定义 |
| `fliersize` | 异常值点的大小 |
| `linewidth` | 箱体与须线的线宽 |
| `width` | 箱体的宽度比例 |
| `hue` | 第二个分类变量，并排分组 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# whis 指定须线延伸到 2 倍四分位距，fliersize 调小异常值点
sns.boxplot(data=tips, x='day', y='total_bill', whis=2.0, fliersize=3, linewidth=1.5)
plt.show()
```

箱线图只显示五个统计量，适合快速比较，但会掩盖双峰等分布细节。

## 1.4.5 kind='violin' 小提琴图

`kind='violin'` 对应 `sns.violinplot()`，结合箱线图与核密度估计，能展示完整分布形状：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.violinplot(data=tips, x='day', y='total_bill', hue='smoker', split=False)
plt.show()
```

关键参数：

| 参数 | 含义 |
| --- | --- |
| `bw` | 核密度带宽，控制平滑程度 |
| `cut` | 分布延伸到数据范围之外的距离，默认 2 |
| `inner` | 内部标记，可选 `'box'`、`'quartile'`、`'point'`、`'stick'`、`None` |
| `split` | 两个 hue 组左右对称共用半边，节省空间 |
| `scale` | 按计数、宽度或面积缩放小提琴 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# split=True 让两个 hue 组共用一个提琴，左右各半
sns.violinplot(data=tips, x='day', y='total_bill', hue='smoker',
               split=True, inner='quartile', cut=0)
plt.show()
```

`bw` 调大曲线更平滑、调小更贴合数据；`cut=0` 让曲线不超出数据范围；`inner='quartile'` 在提琴内部标出四分位数；`split=True` 适合两个组对比，节省横向空间。

## 1.4.6 kind='boxen' 增强箱线图

`kind='boxen'` 对应 `sns.boxenplot()`，展示比箱线图更多的分位数层次：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.boxenplot(data=tips, x='day', y='total_bill')
plt.show()
```

`boxenplot()`（旧名 `lvplot()`）用层层嵌套的矩形展示更细的分位数结构，能呈现分布尾部，**适合大数据量**。数据量大时箱线图的信息密度不足，boxen 图用更多层次保留细节。它同样支持 `hue`、`dodge`，并可用 `k_depth` 控制层次深度。

## 1.4.7 kind='point' 点图

`kind='point'` 对应 `sns.pointplot()`，用点与误差棒展示每个分类的均值估计：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.pointplot(data=tips, x='day', y='total_bill', hue='smoker')
plt.show()
```

点代表每个分组的统计量（默认均值），竖线是置信区间。关键参数：

| 参数 | 含义 |
| --- | --- |
| `markers` | 各组的点标记，传列表可逐个指定 |
| `linestyles` | 各组的连线样式 |
| `errwidth` | 误差棒的线宽 |
| `estimator` | 聚合函数，默认均值 |
| `ci` | 置信区间设置 |

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.pointplot(data=tips, x='day', y='total_bill', hue='smoker',
              markers=['o', 's'], linestyles=['-', '--'], errwidth=2)
plt.show()
```

`markers` 与 `linestyles` 分别控制每组点的符号与连线样式，`errwidth` 控制误差棒粗细。点图适合同时比较多个分组，把组间差异直观连成折线。

## 1.4.8 kind='bar' 条图

`kind='bar'` 对应 `sns.barplot()`，默认用条高表示每组均值，误差棒表示置信区间：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.barplot(data=tips, x='day', y='total_bill', hue='smoker')
plt.show()
```

关键参数：

| 参数 | 含义 |
| --- | --- |
| `estimator` | 聚合函数，默认均值，可用 `np.median` |
| `ci` | 置信区间设置，`None` 不画误差棒 |
| `errcolor` | 误差棒颜色 |
| `errwidth` | 误差棒线宽 |
| `capsize` | 误差棒端帽宽度 |

```python
import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 用中位数聚合，去掉置信区间，自定义误差棒颜色
sns.barplot(data=tips, x='day', y='total_bill',
            estimator=np.median, ci=None, errcolor='0.3')
plt.show()
```

`estimator` 决定条高代表哪个统计量，默认 `np.mean`；`ci` 控制是否画置信区间；`errcolor` 改变误差棒颜色。条图突出统计量对比，适合报告展示。

## 1.4.9 kind='count' 计数图

`kind='count'` 对应 `sns.countplot()`，统计每个分类的样本数量，不接收 `y` 数值列：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 统计每天的数据量
sns.countplot(data=tips, x='day', hue='smoker')
plt.show()

# x 与 y 互换，画横向计数条
sns.countplot(data=tips, y='day')
plt.show()
```

`countplot()` 只按 `x`（或 `y`）统计频数，横轴分类、纵轴条数，配合 `hue` 可以按第二分类细分计数。检查类别分布是否均衡时最常用。

## 1.4.10 分类顺序控制

`order` 控制分类轴上类别的排列顺序，`hue_order` 控制第二个分类变量的顺序。默认按数据中出现顺序排列：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# order 指定 x 轴类别顺序，hue_order 指定 hue 类别顺序
sns.boxplot(data=tips, x='day', y='total_bill',
            order=['Sun', 'Sat', 'Fri', 'Thu'], hue_order=['No', 'Yes'])
plt.show()
```

`order` 与 `hue_order` 接受类别名列表。传 `order` 可以按业务语义排序（例如星期顺序）或只显示部分类别；`hue_order` 控制图例顺序，让分组对比更清晰。该参数在 `catplot()` 与各底层函数中通用。

## 练习题

### 第1题 概念理解

说明 `catplot()` 与 `stripplot()`、`boxplot()` 等函数的关系；说明 `strip`、`swarm`、`box`、`violin`、`boxen` 五种 `kind` 各自的特点与适用场景；说明 `order` 与 `hue_order` 的作用。

::: details 参考答案

`catplot()` 是分类绘图的顶层接口，按 `kind` 分发到 `stripplot()`、`boxplot()` 等底层函数并支持分面。strip 是带随机抖动的散点分布，swarm 让点不重叠，box 用四分位数概括分布，violin 结合密度显示完整形状，boxen 用多层分位数适合大数据。`order` 控制分类轴顺序，`hue_order` 控制第二个分类变量的顺序。
:::

### 第2题 代码编写

用 `tips` 数据集分别绘制 `day` 与 `total_bill` 的箱线图和小提琴图；用 `barplot` 展示每天的平均消费；用 `countplot` 统计每天的样本数。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.boxplot(data=tips, x='day', y='total_bill')
plt.show()

sns.violinplot(data=tips, x='day', y='total_bill')
plt.show()

sns.barplot(data=tips, x='day', y='total_bill')
plt.show()

sns.countplot(data=tips, x='day')
plt.show()
```

:::

### 第3题 进阶练习

用 `catplot()` 把 `smoker` 与 `sex` 作为分面绘制小提琴图；在箱线图中用 `order` 指定星期顺序、用 `hue` 区分是否吸烟；用 `pointplot` 绘制各组均值并自定义 `markers` 与 `linestyles`。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

sns.catplot(data=tips, x='day', y='total_bill', kind='violin',
            col='smoker', row='sex')
plt.show()

sns.boxplot(data=tips, x='day', y='total_bill', hue='smoker',
            order=['Sun', 'Sat', 'Fri', 'Thu'])
plt.show()

sns.pointplot(data=tips, x='day', y='total_bill', hue='smoker',
              markers=['o', 's'], linestyles=['-', '--'])
plt.show()
```

:::

## 常见错误

**错误 1 · 大量数据用 `swarmplot` 卡顿或内存占用高**

原因:`swarmplot()` 需要对每个点计算不重叠位置,样本量增大后计算量暴涨。

解决:改用 `stripplot()` 加 `jitter`,或直接用 `boxenplot()` 展示大数据分布。

**错误 2 · 箱线图的 `whis` 传浮点数报错**

原因:`whis` 接受单个比例或长度为 2 的数组,浮点数语义在不同版本有差异。

解决:传比例标量如 `whis=1.5`,或传 `[low, high]` 数组自定义须线分位数。

**错误 3 · 用 `countplot` 传了 `y` 数值列报错或画出奇怪图形**

原因:`countplot()` 统计频数,不按数值列聚合,`y` 应传分类列。

解决:`countplot` 只传 `x` 或 `y` 中的分类列,不要传数值列。

**错误 4 · 分类顺序和预期不一致**

原因:默认按数据中出现顺序排列,不是字母序或自定义语义序。

解决:用 `order` 显式指定分类顺序,用 `hue_order` 指定第二个分类的顺序。

**错误 5 · `catplot()` 想指定单个子图的坐标轴报错**

原因:`catplot()` 创建自己的分面布局,不接受 `ax` 参数。

解决:单图改用对应的底层函数（`boxplot`、`stripplot` 等）,或先用 `catplot` 拿到 FacetGrid 再操作 `axes` 属性。
