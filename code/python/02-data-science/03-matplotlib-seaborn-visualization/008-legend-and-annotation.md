---
title: 1.8 图例与注释
sidebar:
  order: 8
---
# 1.8 图例与注释

一张图包含多条曲线或不同分组时，读者需要依靠图例区分数据含义；关键数据点需要注释文字与箭头说明；标题、轴标签与图内文字共同构成完整的图面信息。Matplotlib 提供 `legend`、`annotate`、`text`、`title`、`xlabel`、`ylabel` 等一系列接口。本节讲解图例的创建与外观、注释与文本标签、数学表达式、标题与轴标签以及全局文本的完整用法。

## 1.8.1 图例的创建与位置

绘图时给每条曲线传入 `label` 参数，再调用 `ax.legend()` 即可生成图例。`plt.legend()` 操作当前坐标轴，`ax.legend()` 操作指定坐标轴，多子图时优先用 `ax.legend()`：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 200)
fig, ax = plt.subplots()
ax.plot(x, np.sin(x), label='正弦')
ax.plot(x, np.cos(x), label='余弦')
ax.legend()   # 根据 label 自动生成图例
plt.show()
```

`loc` 参数控制图例位置，常用取值：

| 取值 | 位置 |
| --- | --- |
| `'best'` | 自动选择不与数据重叠的位置（默认） |
| `'upper right'` | 右上角 |
| `'upper left'` | 左上角 |
| `'lower left'` | 左下角 |
| `'lower right'` | 右下角 |
| `'center'` | 中央 |
| `'upper center'` | 上方居中 |
| `'lower center'` | 下方居中 |
| `'center left'` / `'center right'` | 左中 / 右中 |

`loc` 也可以传入包含两个数的元组或列表，表示图例在图中的相对坐标（0 到 1）：

```python
ax.legend(loc='upper left')
ax.legend(loc=(0.05, 0.9))   # 横 0.05、纵 0.9 的相对位置
```

`bbox_to_anchor` 参数把图例定位到坐标轴之外，常与 `loc` 配合。`bbox_to_anchor=(1.05, 1)` 放在右上角外侧，`loc='upper left'` 表示图例的左上角对准锚点：

```python
ax.legend(loc='upper left', bbox_to_anchor=(1.02, 1))  # 图例移到绘图区右侧外部
```

`ax.legend()` 还支持 `ncols` 指定列数、`handlelength` 控制图例符号长度、`borderaxespad` 控制图例与坐标轴的距离等参数。

## 1.8.2 图例外框与外观

图例默认带一个矩形外框。`frameon` 控制是否显示外框，`framealpha` 控制外框透明度（0 到 1），`edgecolor` 控制边框颜色，`facecolor` 控制背景色，`shadow` 控制是否投影，`fancybox` 控制圆角外框：

```python
ax.legend(frameon=True, framealpha=0.8, edgecolor='gray',
          facecolor='white', shadow=True, fancybox=True)
```

各参数的作用：

| 参数 | 作用 |
| --- | --- |
| `frameon` | 是否显示图例外框，`False` 去掉外框 |
| `framealpha` | 外框透明度，0 全透明、1 不透明 |
| `edgecolor` | 外框边框颜色 |
| `facecolor` | 外框背景色 |
| `shadow` | 是否绘制投影，增强立体感 |
| `fancybox` | 是否使用圆角外框 |
| `title` | 图例标题 |
| `ncol` | 图例排列的列数，多条目时减少高度 |

`title` 参数给图例加标题，`ncol` 让多个图例条目按多列排布：

```python
ax.legend(title='分组', ncol=2, loc='upper center')
```

图例字号通过 `fontsize` 参数或 `prop` 控制，透明度较低时配合 `framealpha` 让图例不遮挡数据。

## 1.8.3 手动指定图例与代理对象

`ax.legend()` 可以直接接收 `handles` 与 `labels` 两个列表，手动指定图例内容。此时 `handles` 是线或绘图对象的列表，`labels` 是对应的名称：

```python
line1, = ax.plot(x, np.sin(x), color='tab:blue')
line2, = ax.plot(x, np.cos(x), color='tab:red', linestyle='--')
ax.legend([line1, line2], ['正弦曲线', '余弦曲线'])
```

`plot()` 返回一个列表，因此用逗号解包取出线对象。若某条线不想进图例，可以不设 `label` 或从 `handles` 中排除。

图例不仅限于线，散点、矩形块都可以作为图例符号。从 `matplotlib.lines` 导入 `Line2D` 创建线段代理，从 `matplotlib.patches` 导入 `Patch` 创建色块代理：

```python
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

handles = [
    Line2D([0], [0], color='tab:blue', linewidth=2, label='健康组'),
    Line2D([0], [0], color='tab:red', linestyle='--', label='疾病组'),
    Patch(facecolor='tab:green', edgecolor='black', label='用药范围'),
]
ax.legend(handles=handles, loc='upper right')
```

`Line2D` 的 `[0], [0]` 表示一条线段，只用于图例展示不参与绘图；`Patch` 生成矩形色块，适合表示区域或类别。代理对象的 `label` 可写，也可在调用 `ax.legend(handles, labels)` 时单独传 `labels`。

## 1.8.4 注释 annotate

`ax.annotate()` 在图中添加带箭头的注释。核心参数是 `xy`（注释指向的数据点）与 `xytext`（注释文字所在位置）：

```python
fig, ax = plt.subplots()
x = np.linspace(0, 10, 200)
y = np.sin(x)
ax.plot(x, y)

ax.annotate('波峰', xy=(np.pi / 2, 1), xytext=(np.pi / 2 + 1.5, 1.3),
            arrowprops=dict(arrowstyle='->', color='black'))
plt.show()
```

`arrowprops` 控制箭头外观，常用键：`arrowstyle` 选择箭头样式（`'->'`、`'fancy'`、`'->'`、`'-['` 等），`color` 箭头颜色，`lw` 线宽，`connectionstyle` 控制连线弯曲（如 `'arc3,rad=0.2'`）。

`bbox` 参数给注释文字加外框，接收字典配置 `boxstyle`、`facecolor`、`edgecolor`、`alpha` 等：

```python
ax.annotate('波峰', xy=(np.pi / 2, 1), xytext=(np.pi / 2 + 1.5, 1.3),
            arrowprops=dict(arrowstyle='->', color='black'),
            bbox=dict(boxstyle='round', facecolor='lightyellow',
                      edgecolor='gray', alpha=0.8))
```

`boxstyle` 常用取值有 `'round'`（圆角）、`'square'`（直角）、`'round4'`（大圆角）、`'circle'`（圆形）。`plt.annotate()` 作用于当前坐标轴，`ax.annotate()` 作用于指定坐标轴，多子图时用后者。

`arrowprops` 还可以用 `dict` 全量定制，例如指定 `connectionstyle` 让箭头弧线连接：

```python
ax.annotate('转折点', xy=(4, 0), xytext=(2, -1.4),
            arrowprops=dict(arrowstyle='->', color='red',
                            connectionstyle='arc3,rad=0.3'))
```

## 1.8.5 文本标签 text

`ax.text()` 在数据坐标位置放置一段文字，第一个参数是横坐标、第二个是纵坐标、第三个是文字内容。`plt.text()` 作用于当前坐标轴：

```python
fig, ax = plt.subplots()
ax.plot([0, 1, 2], [0, 1, 4])
ax.text(0.5, 3, '数据峰值', fontsize=12, color='red')
plt.show()
```

`ax.text()` 常用参数：`fontsize` 字号，`color` 颜色，`ha` 水平对齐（`'left'`、`'center'`、`'right'`），`va` 垂直对齐（`'top'`、`'center'`、`'bottom'`），`rotation` 旋转角度，`bbox` 加外框，`transform` 指定坐标系：

```python
ax.text(0.5, 3, '峰值', ha='center', va='bottom',
        fontsize=12, color='tab:red',
        bbox=dict(boxstyle='round', facecolor='lightyellow'))
```

`transform` 默认是数据坐标 `ax.transData`。想在图的相对位置放文字（不受数据范围影响），改用 `ax.transAxes`，坐标 0 到 1 表示绘图区相对位置：

```python
ax.text(0.02, 0.95, '注：数据来自门诊记录', transform=ax.transAxes,
        fontsize=9, color='gray')
```

`rotation` 旋转文字，适合纵排或倾斜标注。`ax.text` 与 `ax.annotate` 的差别：`text` 只放文字，`annotate` 可以带箭头指向数据点。

## 1.8.6 数学表达式

Matplotlib 内嵌 TeX 渲染器，字符串中以 `$...$` 包裹的内容按数学公式渲染。写法是在字符串前加 `r` 前缀避免反斜杠转义：

```python
ax.set_xlabel(r'时间 $t$（小时）')
ax.set_ylabel(r'浓度 $C(t)$')
ax.set_title(r'药物浓度衰减曲线 $C(t) = C_0 e^{-kt}$')
```

常用数学写法：

| 写法 | 效果 |
| --- | --- |
| `r'$\alpha$'` | 希腊字母 α |
| `r'$\beta$'`、`r'$\theta$'` | β、θ 等希腊字母 |
| `r'$\frac{1}{2}$'` | 分数 1/2 |
| `r'$\sqrt{x}$'` | 平方根 |
| `r'$x^2$'`、`r'$x_i$'` | 上标与下标 |
| `r'$\sum_{i=1}^{n}$'` | 求和符号 |
| `r'$\mu$'`、`r'$\sigma$'` | 均值与标准差符号 |
| `r'$\pm$'` | 正负号 |

`$...$` 内部是公式，外部是普通文字，两者可以混排。比如 `r'$p < 0.01$'` 在图中显示为 p < 0.01 的斜体公式：

```python
ax.text(0.6, 0.3, r'$p < 0.01$', fontsize=14)
```

带引号的数学字符串必须使用原始字符串 `r` 前缀，否则 `\a`、`\f` 等转义序列会被 Python 误解析。公式中的空格需要用 `\ ` 或 `\quad` 控制。

## 1.8.7 标题与轴标签

`ax.set_title()` 设置坐标轴标题，`plt.title()` 作用于当前坐标轴。`loc` 参数控制标题位置，取值 `'left'`、`'center'`、`'right'`：

```python
ax.set_title('图 1 体温变化', loc='center')
ax.set_title('A', loc='left', fontsize=14)   # 子图编号常用左上角
```

`set_title()` 常用参数：`fontsize` 字号，`color` 颜色，`fontweight` 字重（`'bold'`），`pad` 标题与坐标轴的间距，`loc` 对齐位置。

轴标签用 `ax.set_xlabel()`、`ax.set_ylabel()` 设置，`plt.xlabel()`、`plt.ylabel()` 作用于当前坐标轴。常用参数：`fontsize`、`labelpad`（标签与坐标轴间距）、`rotation`（旋转）、`color`：

```python
ax.set_xlabel('时间（小时）', fontsize=12, labelpad=10)
ax.set_ylabel('血压（mmHg）', fontsize=12)
```

`labelpad` 控制轴标签离刻度标签的距离，横轴标签旋转常用于长日期。所有标签设置也可以用 `ax.set(xlabel=..., ylabel=..., title=...)` 一次完成：

```python
ax.set(xlabel='时间（小时）', ylabel='浓度（mg/L）', title='浓度-时间曲线')
```

## 1.8.8 全局文本

`fig.suptitle()` 设置整个图（figure）的总标题，多子图时显示在最上方；`fig.text()` 在图中任意位置放置文字，坐标基于整张图的相对位置（0 到 1）：

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].plot(x, np.sin(x))
axes[1].plot(x, np.cos(x))

fig.suptitle('三角函数曲线对比', fontsize=16)   # 总标题
fig.text(0.5, 0.02, '数据来源：模拟生成', ha='center', fontsize=9)  # 底部脚注
plt.show()
```

`fig.suptitle()` 与 `ax.set_title()` 的区别：前者作用于整张图，位置在图顶；后者作用于单个子图。`fig.text()` 的坐标是图的相对坐标，`x=0.5` 为水平居中、`y=0.02` 靠近底部，适合放脚注、数据来源等全局信息。

`fig.text()` 也支持数学表达式与旋转，配合 `transform=fig.transFigure`（默认就是图坐标）可灵活排布整张图的说明文字。`fig.supxlabel()` 与 `fig.supylabel()` 提供横轴与纵轴的全局标签，多子图共享同一轴名时使用。

## 练习题

### 第1题 概念理解

说明 `ax.legend()` 自动生成图例需要满足什么条件；说明 `loc` 与 `bbox_to_anchor` 的配合方式；说明 `ax.text` 与 `ax.annotate` 的区别；说明 `fig.suptitle` 与 `ax.set_title` 的区别。

::: details 参考答案

自动生成图例要求每条绘图命令传了 `label` 参数。`loc` 指定图例对齐方式，`bbox_to_anchor` 指定锚点位置，两者配合可以把图例放到坐标轴外。`text` 只放文字，`annotate` 可用 `arrowprops` 画箭头指向 `xy` 数据点。`fig.suptitle` 是整张图的总标题，`ax.set_title` 是单个子图的标题。
:::

### 第2题 代码编写

绘制正弦与余弦两条曲线，分别标为 `正弦`、`余弦`；图例放在右上角并加标题、两列排布；在波峰处用 `annotate` 加注释与箭头；坐标轴标签分别写为 `时间 $t$（小时）` 与 `浓度 $C(t)$`。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 200)
fig, ax = plt.subplots()
ax.plot(x, np.sin(x), label='正弦')
ax.plot(x, np.cos(x), label='余弦')

ax.legend(loc='upper right', title='函数', ncol=2)
ax.annotate('波峰', xy=(np.pi / 2, 1), xytext=(np.pi / 2 + 1.5, 1.3),
            arrowprops=dict(arrowstyle='->', color='black'))
ax.set_xlabel(r'时间 $t$（小时）')
ax.set_ylabel(r'浓度 $C(t)$')
plt.show()
```

:::

### 第3题 进阶练习

绘制两组数据（健康组实线、疾病组虚线）并用手动 `handles`、`labels` 指定图例；添加一个矩形色块代理表示用药区间；在图中用 `ax.text` 加脚注说明数据来源；用 `fig.suptitle` 加总标题，`fig.text` 在底部加注释。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

x = np.linspace(0, 10, 200)
fig, ax = plt.subplots()
ax.plot(x, np.sin(x), color='tab:blue')
ax.plot(x, np.cos(x), color='tab:red', linestyle='--')

handles = [
    Line2D([0], [0], color='tab:blue', label='健康组'),
    Line2D([0], [0], color='tab:red', linestyle='--', label='疾病组'),
    Patch(facecolor='lightgreen', edgecolor='black', label='用药区间'),
]
ax.legend(handles=handles, loc='upper right')
ax.text(0.02, 0.95, '注：数据为模拟生成', transform=ax.transAxes, fontsize=9)
fig.suptitle('两组指标对比', fontsize=16)
fig.text(0.5, 0.02, '数据来源：门诊记录', ha='center', fontsize=9)
plt.show()
```

:::

## 常见错误

**错误 1 · 调用 `ax.legend()` 后图例为空或只有一条**

原因:绘图命令没有传 `label` 参数，Matplotlib 无内容可显示。

解决:给每条曲线加 `label='...'`，再用 `ax.legend()` 生成。

**错误 2 · 数学表达式显示为乱码或报错**

原因:含 `\` 的字符串未加 `r` 前缀，或 `$` 不配对。

解决:数学字符串统一用 `r'$...$'` 原始字符串，确保 `$` 成对出现。

**错误 3 · 图例遮挡数据曲线**

原因:默认 `loc='best'` 选择不理想，或图例太大。

解决:手动指定 `loc`，或 `bbox_to_anchor` 把图例移到绘图区外。

**错误 4 · `annotate` 的 `xytext` 与 `xy` 混淆导致箭头指向错误**

原因:两个参数的位置写反或数值不合理。

解决:`xy` 是数据点，`xytext` 是文字位置，先确认数据坐标范围再填数值。

**错误 5 · 多子图时 `plt.title()`、`plt.xlabel()` 只作用到最后一个子图**

原因:pyplot 接口操作当前活动坐标轴，多子图下指向最后创建的轴。

解决:改用 `ax.set_title()`、`ax.set_xlabel()` 等面向对象的接口逐轴设置。
