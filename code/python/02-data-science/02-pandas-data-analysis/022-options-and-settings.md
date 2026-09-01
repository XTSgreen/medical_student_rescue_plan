---
title: 1.22 选项与设置
sidebar:
  order: 22
---
# 1.22 选项与设置

Pandas 的显示、运算、兼容行为由一组**全局选项**控制。默认配置适合大多数场景，但在展示大数据、控制浮点精度、处理链式赋值警告时，需要临时或永久调整选项。本节讲解选项的查询与修改（`get_option`、`set_option`、`reset_option`、`describe_option`）、常用选项清单、上下文管理器 `option_context`，以及选项在 Jupyter 与脚本中的典型用法。

## 1.22.1 选项的查询与修改

### 读取选项 get_option

`pd.get_option('选项名')` 读取当前值：

```python
import pandas as pd

print(pd.get_option('display.max_rows'))        # 显示的最大行数
print(pd.get_option('display.max_columns'))     # 显示的最大列数
print(pd.get_option('display.precision'))       # 浮点显示精度
```

### 设置选项 set_option

`pd.set_option('选项名', 值)` 修改选项，立刻对后续所有输出生效：

```python
import pandas as pd

pd.set_option('display.max_rows', 100)      # 最多显示 100 行
pd.set_option('display.max_columns', 20)    # 最多显示 20 列
pd.set_option('display.precision', 4)       # 浮点保留 4 位小数
```

### 重置选项 reset_option

`pd.reset_option('选项名')` 把选项恢复为默认值，支持通配符批量重置：

```python
pd.reset_option('display.max_rows')    # 恢复默认
pd.reset_option('display')             # 重置 display 组全部选项
```

### 查看选项描述 describe_option

`pd.describe_option('选项名')` 显示选项的默认值、合法取值与说明：

```python
pd.describe_option('display.max_rows')
```

## 1.22.2 常用选项

按功能把常用选项分类如下：

### 显示相关（display）

| 选项 | 作用 |
|------|------|
| `display.max_rows` | 显示的最大行数，超出部分用省略号折叠 |
| `display.max_columns` | 显示的最大列数 |
| `display.width` | 控制台输出总宽度（字符数） |
| `display.precision` | 浮点数的显示精度（小数点后位数） |
| `display.float_format` | 浮点数显示格式，可传函数（如 `'{:.2f}'.format`） |
| `display.chop_threshold` | 绝对值小于该值的数字显示为 0 |
| `display.colheader_justify` | 列标题对齐方式（'left'/'right'） |
| `display.date_dayfirst` | 日期显示时是否日在前 |
| `display.date_yearfirst` | 日期显示时是否年在先 |
| `display.max_colwidth` | 单元格内容最大显示宽度 |

示例：

```python
import pandas as pd

pd.set_option('display.float_format', '{:.2f}'.format)
pd.set_option('display.chop_threshold', 1e-6)
pd.set_option('display.colheader_justify', 'left')
```

`float_format` 传入一个格式化函数，`chop_threshold` 把接近 0 的小数折叠为 0，两者常用于输出整洁的报告。

### 运算与行为相关

| 选项 | 作用 |
|------|------|
| `mode.chained_assignment` | 链式赋值警告策略：'warn'（默认，警告）/'raise'（报错）/'None'（关闭） |
| `mode.use_inf_as_na` | 是否把 inf 当作缺失值参与运算 |
| `mode.copy_on_write` | 是否启用写时复制（Pandas 2.0+，减少不必要的副本） |
| `compute.use_numba` | 是否允许部分运算使用 Numba 加速 |

链式赋值是常见的隐性问题来源。`df['A'][df['B'] > 0] = 1` 这类写法可能不生效，`mode.chained_assignment` 可调整警告级别：

```python
pd.set_option('mode.chained_assignment', 'raise')   # 链式赋值直接报错
```

## 1.22.3 上下文管理器 option_context

`pd.option_context()` 在 `with` 块内临时修改选项，退出后自动恢复原值，不影响全局状态：

```python
import pandas as pd
import numpy as np

df = pd.DataFrame(np.random.randn(30, 5))

with pd.option_context('display.max_rows', 10, 'display.precision', 2):
    print(df)    # 此处生效：最多显示 10 行，2 位小数

print(df)        # 退出后恢复全局默认
```

`option_context` 接受任意多个"选项名=值"对，是脚本与 Jupyter 中做局部定制最安全的方式，避免遗留全局副作用。

## 1.22.4 选项在展示中的实际效果

默认情况下大 DataFrame 会被截断，控制行数、列数与精度后输出更适合阅读：

```python
import pandas as pd
import numpy as np

df = pd.DataFrame(np.random.randn(200, 8), columns=[f'col_{i}' for i in range(8)])

with pd.option_context('display.max_rows', 15,
                       'display.max_columns', 4,
                       'display.width', 80,
                       'display.precision', 3):
    print(df)
```

组合使用 `max_rows`、`max_columns`、`width`、`precision`，可把宽表压制成指定尺寸的概览。注意 `width` 与 `max_columns` 相互影响，过小的宽度会强制折叠列。

## 1.22.5 选项的持久化

`set_option` 设置的选项只在当前进程内有效。需要每次启动都生效的选项，写入启动脚本或项目配置文件；在 Jupyter 中，可在 `~/.ipython/profile_default/startup/` 下放置启动脚本统一设置：

```python
# startup 脚本示例
import pandas as pd

pd.set_option('display.max_rows', 100)
pd.set_option('display.precision', 3)
```

配置文件的写法依运行环境而异，核心是把 `set_option` 调用放到解释器启动时执行的位置。

## 练习题

### 第1题 概念理解

说明 `get_option`、`set_option`、`reset_option`、`describe_option` 各自的用途；说明 `option_context` 与 `set_option` 在使用范围上的区别；说明 `mode.chained_assignment` 的三个取值。

::: details 参考答案

`get_option` 读取当前值，`set_option` 修改，`reset_option` 恢复默认，`describe_option` 查看说明。`option_context` 在 `with` 块内临时生效并自动恢复，`set_option` 全局永久修改当前进程。`mode.chained_assignment` 取 'warn' 时警告、'raise' 时报错、'None' 时关闭。
:::

### 第2题 代码编写

用 `option_context` 临时把 `max_rows` 设为 10、`precision` 设为 2 打印一个 30 行 DataFrame，并验证退出上下文后全局选项未改变。

::: details 参考答案

```python
import pandas as pd
import numpy as np

df = pd.DataFrame(np.random.randn(30, 4))
print(pd.get_option('display.max_rows'))

with pd.option_context('display.max_rows', 10, 'display.precision', 2):
    print(df)
    print(pd.get_option('display.max_rows'))   # 10

print(pd.get_option('display.max_rows'))        # 恢复原值
```

:::

### 第3题 进阶练习

把 `display.float_format` 设为 `'{:.3f}'.format` 并观察浮点输出；用 `describe_option('display.max_columns')` 查看该选项的默认值与说明；把 `mode.chained_assignment` 设为 'raise' 并触发一次链式赋值观察报错。

::: details 参考答案

```python
import pandas as pd
import numpy as np

pd.set_option('display.float_format', '{:.3f}'.format)
print(pd.DataFrame({'x': [1.23456, 2.34567]}))

pd.describe_option('display.max_columns')

pd.set_option('mode.chained_assignment', 'raise')
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
try:
    df['A'][0] = 99    # 触发 ChainedAssignmentError
except Exception as e:
    print(type(e).__name__)
pd.reset_option('mode.chained_assignment')
```

:::

## 常见错误

**错误 1 · 设置了选项但输出没变化**

原因:选项名拼写错误,或设置被 `option_context` 之外的代码覆盖;`max_columns` 受 `width` 限制。
 
解决:用 `describe_option` 核对选项名与默认值,检查 `width` 是否过小。

**错误 2 · 在 `with` 块外仍然受上下文影响**

原因:误以为 `option_context` 会持久生效,实际它在块结束后恢复原值。
 
解决:需要永久修改用 `set_option`,需要临时修改用 `option_context`。

**错误 3 · 链式赋值不生效也不报警告**

原因:`mode.chained_assignment` 被设为 'None',或索引方式本身不产生副本。
 
解决:改用 `df.loc` 显式赋值;确认警告级别,必要时设回 'warn'。

**错误 4 · 浮点显示精度与运算精度混淆**

原因:`display.precision` 只影响显示,不影响存储与计算。
 
解决:需要真正改变数值精度时用 `round()` 或 `astype`,显示精度用 `display.precision`。
