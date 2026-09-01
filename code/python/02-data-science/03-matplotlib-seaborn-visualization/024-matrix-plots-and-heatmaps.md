---
title: 1.7 矩阵图与热图
sidebar:
  order: 24
---
# 1.7 矩阵图与热图

数据分析经常遇到二维表格数据，例如各变量之间的相关系数矩阵、基因在不同样本中的表达量、混淆矩阵。把数值直接写成数字表格难以快速发现高值与低值的分布规律，而折线图、柱状图等一维图表又无法表达二维结构。Seaborn 提供**矩阵绘图函数**，用颜色编码数值大小，让整张矩阵的模式一目了然。本节讲解 `sns.heatmap()` 热力图与 `sns.clustermap()` 聚类热图，并给出结合 `df.corr()` 的实际示例。

## 1.7.1 热力图的基本绘制

`sns.heatmap()` 接受二维数组或 DataFrame，把每个单元格的数值映射为一种颜色，数值越大颜色越深：

```python
import seaborn as sns
import matplotlib.pyplot as plt

# 准备一个 5x5 的随机矩阵
import numpy as np
rng = np.random.default_rng(1)
data = rng.random((5, 5))

sns.heatmap(data)
plt.show()
```

传入 DataFrame 时，行索引与列名自动作为坐标轴标签显示：

```python
import pandas as pd

# 构造带行列标签的 DataFrame
df = pd.DataFrame(data,
                  index=['甲', '乙', '丙', '丁', '戊'],
                  columns=['A', 'B', 'C', 'D', 'E'])
sns.heatmap(df)
plt.show()
```

热力图的核心价值在于**颜色梯度**：相邻单元格的颜色差异直接对应数值差异，无需逐个读数字即可定位高值簇与低值簇。

## 1.7.2 热力图的核心参数

`heatmap` 的参数覆盖颜色映射、标注、边框、掩码等多个方面，常用参数如下表：

| 参数 | 含义 |
| --- | --- |
| `data` | 二维数组或 DataFrame |
| `annot` | 是否在单元格内显示数值 |
| `fmt` | 标注数值的格式字符串 |
| `cmap` | 颜色映射 |
| `center` | 颜色映射的对称中心值 |
| `robust` | 基于百分位数做颜色缩放，抗离群点 |
| `square` | 单元格是否为正方形 |
| `cbar` | 是否显示颜色条 |
| `cbar_kws` | 颜色条的样式参数 |
| `linewidths` | 单元格边框线宽 |
| `linecolor` | 单元格边框颜色 |
| `mask` | 与 `data` 同形状的布尔数组，True 处隐藏 |
| `xticklabels`、`yticklabels` | 刻度标签控制 |

### annot 与 fmt 显示数值

`annot=True` 在单元格内绘制数值，`fmt` 控制数值格式：

```python
sns.heatmap(df, annot=True, fmt='.2f')
plt.show()
```

`fmt='.2f'` 保留两位小数；整数数据可用 `fmt='d'`，百分比可用 `fmt='.0%'`。

### cmap 与 center 颜色映射

`cmap` 选择颜色映射方案，常用 `'viridis'`、`'coolwarm'`、`'YlGnBu'`、`'RdBu_r'` 等。`center` 指定颜色中心值，让两侧颜色对称，适合正负值共存的数据：

```python
# 相关系数取值范围为 [-1, 1]，center=0 让正负值颜色对称
sns.heatmap(df, cmap='coolwarm', center=0)
plt.show()
```

`center=0` 保证零值落在颜色条中央，正数偏向一端、负数偏向另一端。

### robust 鲁棒缩放

`robust=True` 让颜色映射基于数据的百分位数（默认 2% 到 98%）而非最大值最小值，个别极端值不会把颜色范围拉伸得过宽：

```python
# 矩阵中混入一个极大值，robust 可避免颜色分布失衡
data2 = rng.random((5, 5))
data2[0, 0] = 100

sns.heatmap(data2, robust=True)
plt.show()
```

普通模式下极大值把其余单元格压成同一种低值颜色，`robust` 模式让正常范围的差异仍然可辨。

### square 与边框

`square=True` 强制单元格为正方形，`linewidths` 与 `linecolor` 控制单元格之间的分隔线：

```python
sns.heatmap(df, square=True,
            linewidths=0.5, linecolor='white')
plt.show()
```

白色细线分隔单元格，使矩阵结构更清晰。

### cbar 与 cbar_kws 颜色条

`cbar=False` 隐藏颜色条，`cbar_kws` 把参数传递给颜色条对象：

```python
sns.heatmap(df, annot=True,
            cbar_kws={'shrink': 0.6, 'label': '数值'})
plt.show()
```

`shrink` 控制颜色条高度，`label` 设置颜色条标题。

### mask 掩码隐藏

`mask` 接受与 `data` 形状相同的布尔数组，为 True 的位置不绘制颜色。典型用途是隐藏相关矩阵的上三角区域，避免重复信息：

```python
# 生成相关矩阵并构建上三角掩码
import pandas as pd
iris = sns.load_dataset('iris')
corr = iris.corr(numeric_only=True)

mask = np.triu(np.ones_like(corr, dtype=bool))

sns.heatmap(corr, mask=mask, annot=True, cmap='coolwarm', center=0)
plt.show()
```

`np.triu` 生成上三角为 True 的矩阵，掩码隐藏上三角后只显示下三角，矩阵信息更紧凑。

### xticklabels 与 yticklabels

刻度标签默认与数据行列一致，也可通过参数控制显示方式：

```python
# 每 2 个刻度显示一个标签
sns.heatmap(df, xticklabels=2, yticklabels=2)
plt.show()
```

传入整数表示每隔多少个显示一个；传入 `False` 隐藏全部标签；传入列表可自定义标签内容。

## 1.7.3 相关性矩阵热力图示例

热力图最常见的应用是可视化相关系数矩阵。`df.corr()` 计算各数值列之间的皮尔逊相关系数，返回一个方阵，再用热力图呈现：

```python
# 计算 iris 数据集的相关系数矩阵
corr = iris.corr(numeric_only=True)
print(corr)

# 绘制相关矩阵热力图
sns.heatmap(corr, annot=True, cmap='coolwarm',
            center=0, square=True)
plt.show()
```

相关系数取值为 -1 到 1。对角线上全是 1，表示变量与自身完全相关；远离对角线的深色单元格提示强相关关系，例如花瓣长度与花瓣宽度通常高度正相关。

配合 `mask` 隐藏上三角，并把对角线也隐藏，可以避免信息冗余：

```python
mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
sns.heatmap(corr, mask=mask, annot=True,
            cmap='coolwarm', center=0,
            linewidths=0.5)
plt.show()
```

`k=1` 让对角线本身也参与显示，只有严格上三角被掩码，画面更简洁。

## 1.7.4 clustermap 聚类热图

`sns.clustermap()` 在热力图基础上对行列进行层次聚类，相似的样本与变量在图中靠在一起，帮助发现数据中的分组结构：

```python
# 对行和列同时做层次聚类
g = sns.clustermap(corr, cmap='coolwarm', center=0)
plt.show()
```

聚类后相似的行列相邻，热图中会形成明显的高相关块状区域，结构比原始顺序更清晰。

`method` 与 `metric` 分别控制聚类算法与距离度量：

| 参数 | 含义 | 常用取值 |
| --- | --- | --- |
| `method` | 层次聚类算法 | `'single'`、`'complete'`、`'average'`、`'ward'` |
| `metric` | 距离度量 | `'euclidean'`、`'correlation'`、`'manhattan'` |
| `standard_scale` | 按行或列做标准化 | `0` 表示行、`1` 表示列 |
| `z_score` | 按行或列做 z 分数标准化 | `0` 表示行、`1` 表示列 |
| `col_cluster`、`row_cluster` | 是否对列或行聚类 | 布尔值 |
| `row_colors`、`col_colors` | 行或列的颜色条 | 列表或 Series |
| `figsize` | 图形大小 | 元组 `(宽, 高)` |
| `dendrogram_ratio` | 树状图占用的比例 | 元组 `(行, 列)` |
| `colors_ratio` | 颜色条占用的比例 | 元组 `(行, 列)` |

### standard_scale 与 z_score 标准化

当不同行量纲差异大时，直接聚类会被量纲主导。`standard_scale=0` 对每一行做标准化（每行内部减均值除标准差），`z_score=0` 用 z 分数标准化，两者都消除行间量纲差异：

```python
# 对行做 z 分数标准化后再聚类
g = sns.clustermap(df, z_score=0, cmap='coolwarm', center=0)
plt.show()
```

`standard_scale` 与 `z_score` 互斥，同一数据只能选择一种方式。

### col_cluster 与 row_cluster

默认行列都聚类，可以单独关闭某一维度的聚类以保留原始顺序：

```python
# 只聚类行，列保持原顺序
g = sns.clustermap(df, col_cluster=False)
plt.show()
```

`col_cluster=False` 保留列顺序，适合时间序列等顺序本身有意义的场景。

### row_colors 与 col_colors 颜色条

`row_colors` 与 `col_colors` 在聚类热图边缘绘制颜色条，标注样本或变量的分组信息。传入与行数相同的颜色序列，或传入 `pd.Series`（按索引对齐），也可传入 DataFrame 绘制多条颜色带：

```python
# 构造样本类别颜色条
species = iris['species']
color_map = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
row_colors = species.map(color_map)

g = sns.clustermap(iris.drop(columns='species'), z_score=0,
                   cmap='coolwarm', row_colors=row_colors)
plt.show()
```

行颜色条帮助确认聚类结果是否与已知类别对应：若同一颜色的样本聚在相邻块，说明该特征组合能区分类别。

### figsize、dendrogram_ratio 与 colors_ratio

`figsize` 设置整个图形大小，`dendrogram_ratio` 与 `colors_ratio` 分别控制树状图与颜色条在图形中占用的比例：

```python
g = sns.clustermap(df, figsize=(8, 6),
                   dendrogram_ratio=(0.15, 0.2),
                   colors_ratio=0.03)
plt.show()
```

`dendrogram_ratio` 传元组 `(行侧比例, 列侧比例)`，`colors_ratio` 传单个值或元组。数据行多时调小行侧树状图比例，给热图主体留出更多空间。

## 练习题

### 第1题 概念理解

说明 `heatmap` 中 `annot`、`fmt`、`center`、`robust` 各参数的作用；说明 `mask` 的原理；说明 `clustermap` 中 `standard_scale`、`z_score`、`row_colors` 的含义。

::: details 参考答案

`annot` 决定是否显示单元格数值，`fmt` 设置数值格式，`center` 指定颜色映射中心值使正负对称，`robust` 基于百分位数缩放颜色范围。`mask` 用布尔数组隐藏对应单元格。`standard_scale` 按行或列标准化，`z_score` 按行或列做 z 分数标准化，`row_colors` 在行边缘绘制类别颜色条。
:::

### 第2题 代码编写

加载 `iris` 数据集，用 `df.corr(numeric_only=True)` 计算相关系数矩阵，用 `heatmap` 绘制热力图，设置 `annot=True`、`fmt='.2f'`、`cmap='coolwarm'`、`center=0`，并用 `mask` 隐藏上三角。

::: details 参考答案

```python
import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt

iris = sns.load_dataset('iris')
corr = iris.corr(numeric_only=True)

mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, fmt='.2f',
            cmap='coolwarm', center=0, square=True)
plt.show()
```

:::

### 第3题 进阶练习

用 `clustermap` 对 `iris` 数据集的数值列做聚类，对行做 z 分数标准化；用 `row_colors` 按 `species` 着色；关闭列聚类保留列顺序；调整 `figsize` 与 `dendrogram_ratio`。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

iris = sns.load_dataset('iris')

# 构造物种颜色条
color_map = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
row_colors = iris['species'].map(color_map)

g = sns.clustermap(iris.drop(columns='species'),
                   z_score=0, cmap='coolwarm',
                   row_colors=row_colors,
                   col_cluster=False,
                   figsize=(8, 6),
                   dendrogram_ratio=(0.15, 0.2))
plt.show()
```

:::

## 常见错误

**错误 1 · 热力图没有颜色条或图太小看不清**

原因:`cbar` 默认为 True，但图形过小或坐标轴被挤占时颜色条显示不完整。

解决:使用 `plt.figure(figsize=(宽, 高))` 或 `figsize` 参数放大画布，必要时用 `cbar_kws={'shrink': 0.7}` 调整颜色条尺寸。

**错误 2 · `mask` 与 `data` 形状不一致报 `ValueError`**

原因:掩码数组必须与 `data` 的行列数完全一致。

解决:用 `np.ones_like(data, dtype=bool)` 生成掩码，再结合 `np.triu`、`np.tril` 等构造所需区域。

**错误 3 · `annot=True` 时数值过多拥挤重叠**

原因:矩阵行数多或列名长，单元格内放不下标注。

解决:设置 `annot_kws={'size': 8}` 缩小字号，或 `fmt` 精简格式，或对 `xticklabels`、`yticklabels` 做隔行显示。

**错误 4 · `clustermap` 中同时设置 `standard_scale` 与 `z_score` 报错**

原因:两种标准化方式互斥，只能二选一。

解决:根据需求只设置其中一个；需要去除行间量纲差异用 `z_score=0`，需要把数据缩放到统一范围时用 `standard_scale=0`。
