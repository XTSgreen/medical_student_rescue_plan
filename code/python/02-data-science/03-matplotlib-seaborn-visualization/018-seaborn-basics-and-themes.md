---
title: 1.1 Seaborn 基础与主题
sidebar:
  order: 18
---
# 1.1 Seaborn 基础与主题

上一章学习了 Matplotlib 的基础绘图。直接使用 Matplotlib 绘制统计图时，需要手动设置配色、坐标轴、图例、置信区间等细节，代码量较大且观感难以统一。Seaborn 在 Matplotlib 之上封装了统计绘图能力，一句调用即可得到带统计量的图表。动手画图之前，需要先了解 Seaborn 的定位、安装方式、依赖关系，以及决定整张图外观的主题与样式体系。本节讲解 Seaborn 概述、安装与依赖、主题设置、样式配置、上下文配置与脊柱控制。Seaborn 的完整统计绘图能力在后续小节展开。

## 1.1.1 Seaborn 概述与安装

Seaborn 是基于 Matplotlib 的**统计绘图库**，它的目标是用少量代码完成复杂统计图。Seaborn 自动处理颜色映射、图例、坐标轴范围与统计估计，内置丰富的调色板与主题。Seaborn 与 Pandas 深度集成，可以直接把 DataFrame 的列名传给绘图函数，由库内部完成数据整理。

安装 Seaborn 使用 pip：

```python
pip install seaborn
```

引入时约定使用别名 `sns`：

```python
import seaborn as sns
import matplotlib.pyplot as plt
```

绘图后仍需调用 `plt.show()` 显示图形，说明 Seaborn 的底层渲染仍然依赖 Matplotlib。Seaborn 提供 `sns.load_dataset('tips')` 等内置数据集方便教学演示，第一次使用会自动联网下载。

```python
import seaborn as sns

# 加载内置数据集 tips（小费数据）
tips = sns.load_dataset('tips')
print(tips.head())
```

## 1.1.2 依赖关系与版本兼容

Seaborn 依赖三个核心库：**pandas** 负责数据结构与数据整理，**numpy** 负责数值计算，**matplotlib** 负责底层绘图。安装 Seaborn 时，pip 会自动安装这些依赖；如果环境中已经有完整的数据科学工具栈，直接使用即可。

版本兼容上需要注意：Seaborn 2.0 起要求 pandas 与 numpy 保持较新版本，旧版 Seaborn 可能与新版 pandas 出现兼容问题。检查版本：

```python
import seaborn as sns
print(sns.__version__)
```

Seaborn 0.12 之前的旧版本大量使用 `sns.set()`，0.12 起推荐统一入口 `sns.set_theme()`。学习新代码时以 `set_theme()` 为准，遇到网上旧教程中的 `sns.set()` 也能正常运行，只是它会退化为 `set_theme()` 的一个快捷方式。

## 1.1.3 主题设置 sns.set_theme()

`set_theme()` 是 Seaborn 0.12 起的**统一配置入口**，一次调用同时设置样式、上下文、调色板与字体缩放：

```python
import seaborn as sns
import matplotlib.pyplot as plt

# 统一设置主题，一次生效
sns.set_theme()
tips = sns.load_dataset('tips')
sns.scatterplot(data=tips, x='total_bill', y='tip')
plt.show()
```

`set_theme()` 常用参数：`style` 控制样式，`context` 控制上下文（字号与线条粗细），`palette` 控制调色板，`font` 控制字体，`font_scale` 缩放字体，`rc` 直接传入 rcParams 字典。这些参数与下面各小节讲解的独立函数对应，`set_theme()` 的作用就是把这些设置合并成一次调用。

旧版本的 `sns.set()` 曾经是唯一入口，现在可以把它看作 `set_theme()` 的兼容别名。新代码推荐统一使用 `set_theme()`，参数含义完全一致。

## 1.1.4 样式配置 sns.set_style()

样式（style）决定图表的**背景与网格外观**。`sns.set_style()` 设置当前样式：

```python
sns.set_style('whitegrid')
```

Seaborn 内置五种样式：

| 样式名 | 外观特点 |
| --- | --- |
| `'white'` | 白色背景，无网格，适合论文投稿 |
| `'dark'` | 深灰背景，适合深色底图 |
| `'whitegrid'` | 白色背景加网格，适合查看数值 |
| `'darkgrid'` | 深灰背景加网格，Matplotlib 默认风格近似 |
| `'ticks'` | 白色背景，坐标轴带刻度短线 |

五种样式的效果差异集中在背景色与网格线的有无。`whitegrid` 与 `darkgrid` 带网格便于读数，`white` 与 `ticks` 更干净，`dark` 适合深色演示环境。

除了内置样式，还可以通过 `rc` 参数微调细节：

```python
sns.set_style('whitegrid', {'axes.edgecolor': '0.8'})
```

## 1.1.5 上下文配置 sns.set_context()

上下文（context）控制**字号、线条粗细与图幅比例**。`sns.set_context()` 设置上下文：

```python
sns.set_context('talk')
```

Seaborn 内置四种上下文：

| 上下文名 | 适用场景 |
| --- | --- |
| `'paper'` | 论文插图，字号最小、线条最细 |
| `'notebook'` | Jupyter 笔记本，默认值 |
| `'talk'` | 会议演示，字号中等 |
| `'poster'` | 海报，字号最大、线条最粗 |

上下文从 `'paper'` 到 `'poster'` 依次放大，适合不同展示媒介。展示数据时用大字号让后排观众看清，写论文时用小字号节省版面。

`set_context()` 支持两个重要参数：

```python
# font_scale 额外缩放字号
sns.set_context('paper', font_scale=1.5)

# rc 直接覆盖指定的 rcParams
sns.set_context('talk', rc={'lines.linewidth': 3})
```

`font_scale` 在所选上下文的基础上再缩放字体；`rc` 直接写入 rcParams 字典，覆盖上下文中的个别设置项。

## 1.1.6 重置设置

探索阶段改乱了主题，可以用重置函数恢复默认：

```python
import seaborn as sns

# 恢复 Seaborn 的默认主题设置
sns.reset_defaults()

# 完全恢复 Matplotlib 原始设置，抹掉 Seaborn 的所有修改
sns.reset_orig()
```

`sns.reset_defaults()` 恢复 Seaborn 定义的默认样式；`sns.reset_orig()` 把所有设置还原为 Matplotlib 的原始状态。两者都修改全局的 matplotlib rcParams，重置后再画图会回到未套用主题的外观。

## 1.1.7 移除脊柱 sns.despine()

Matplotlib 默认画四条边框线（脊柱）。统计图中上、右边框通常没有信息量，Seaborn 的 `sns.despine()` 可以移除多余脊柱：

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')
sns.scatterplot(data=tips, x='total_bill', y='tip')
sns.despine()
plt.show()
```

`despine()` 默认移除**上、右**两条脊柱，参数控制移除哪一侧：

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `top` | `True` | 是否移除上脊柱 |
| `right` | `True` | 是否移除右脊柱 |
| `left` | `False` | 是否移除左脊柱 |
| `bottom` | `False` | 是否移除下脊柱 |
| `offset` | 无 | 脊柱离坐标轴的偏移距离 |
| `trim` | `False` | 是否把脊柱截断到刻度范围 |

```python
import seaborn as sns

# 保留下、左脊柱，并让它们略微内缩
sns.despine(top=True, right=True, offset=10, trim=True)
```

`offset` 让脊柱向内缩进，图表更紧凑；`trim` 把脊柱截断在刻度线处，避免脊柱超出数据范围。四向全部保留时传 `False`。

## 练习题

### 第1题 概念理解

说明 Seaborn 与 Matplotlib 的关系；说明 `set_theme()` 与 `set_style()`、`set_context()` 的分工；说明五种内置样式与四种内置上下文的区别。

::: details 参考答案

Seaborn 基于 Matplotlib 做统计绘图封装，渲染仍依赖 Matplotlib。`set_theme()` 是统一入口，一次设置样式、上下文、调色板等；`set_style()` 只管背景与网格，`set_context()` 只管字号与线条粗细。五种样式区分背景与网格，四种上下文区分字号与线宽（paper 最小，poster 最大）。
:::

### 第2题 代码编写

安装并导入 seaborn，加载 `tips` 数据集；使用 `set_theme()` 设置 `whitegrid` 样式与 `talk` 上下文，绘制 total_bill 与 tip 的散点图，并用 `despine()` 移除上、右脊柱。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_theme(style='whitegrid', context='talk')
tips = sns.load_dataset('tips')
sns.scatterplot(data=tips, x='total_bill', y='tip')
sns.despine()
plt.show()
```

:::

### 第3题 进阶练习

分别用 `paper`、`notebook`、`talk`、`poster` 四种上下文绘制同一张图，观察字号与线条粗细的变化；用 `font_scale` 在 `paper` 基础上放大字体；最后用 `reset_orig()` 恢复原始设置。

::: details 参考答案

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset('tips')

# 四种上下文逐一对比
for ctx in ['paper', 'notebook', 'talk', 'poster']:
    sns.set_context(ctx)
    sns.scatterplot(data=tips, x='total_bill', y='tip')
    plt.title(ctx)
    plt.show()

# paper 基础上再放大字体
sns.set_context('paper', font_scale=1.5)
sns.scatterplot(data=tips, x='total_bill', y='tip')
plt.show()

# 恢复 Matplotlib 原始设置
sns.reset_orig()
```

:::

## 常见错误

**错误 1 · 调用 `sns.set()` 后风格没有按预期变化**

原因:`sns.set()` 是 `set_theme()` 的旧版兼容入口,新版默认行为有调整,部分旧教程参数写法不同。

解决:新代码统一改用 `sns.set_theme()` 并传入 `style`、`context`、`palette` 参数。

**错误 2 · 使用 `sns.load_dataset('tips')` 报网络错误**

原因:内置数据集首次使用需联网下载,离线环境或网络受限时会失败。

解决:预先下载数据文件放到本机路径,改用 `pd.read_csv()` 读取本地文件。

**错误 3 · 设置了主题但绘图仍然看不到效果**

原因:`set_theme()` 修改的是全局 rcParams,必须在创建图形之前调用。

解决:把 `set_theme()` 放在所有绘图代码之前执行。

**错误 4 · `despine()` 之后坐标轴刻度被截断**

原因:`trim=True` 会把脊柱截断到刻度范围,当刻度线延伸到数据之外时可能出现裁切。

解决:先设置合适的坐标轴范围,再决定是否启用 `trim`;不要对带延伸刻度的图使用 `trim`。

**错误 5 · 引入 seaborn 时报缺少依赖的 `ImportError`**

原因:环境中缺少 pandas、numpy 或 matplotlib,Seaborn 依赖它们才能运行。

解决:用 `pip install seaborn` 重装,让 pip 自动补齐依赖。
