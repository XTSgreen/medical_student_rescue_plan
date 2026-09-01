---
title: 1.24 兼容性与版本
sidebar:
  order: 24
---
# 1.24 兼容性与版本

Pandas 版本迭代频繁,不同大版本之间的 API 与默认行为存在差异。运行环境中的 Pandas 版本决定哪些特性可用、哪些写法会触发弃用警告。本节讲解版本查看、旧版本迁移注意事项、`FutureWarning` 的处理,以及让代码在不同版本间稳定运行的方法。

## 1.24.1 查看版本 pd.__version__

`pd.__version__` 返回当前 Pandas 版本号,用于核对环境与文档、记录依赖:

```python
import pandas as pd

print(pd.__version__)    # 例如 2.2.3
```

版本号遵循语义化版本,形如 `主版本.次版本.修订号`。主版本升级通常伴随破坏性变更,次版本与修订号多为向后兼容的增强与修复。

## 1.24.2 版本差异概览

Pandas 主要版本之间的差异直接影响代码写法:

| 版本 | 关键变化 |
|------|----------|
| 1.x | 可空扩展类型（`Int64`、`boolean` 等）逐步完善;`Sparse` 结构统一切换为扩展 dtype |
| 2.0 | 引入写时复制（Copy-on-Write）;默认 `downcast` 行为调整;部分 API 弃用 |
| 2.1+ | `fillna(method=...)` 等旧写法被移除,改用 `ffill`/`bfill` |
| 3.0 | 写时复制成为默认行为;`copy` 参数语义统一 |

示例——`fillna` 的写法迁移:

```python
import pandas as pd

s = pd.Series([1, None, 3])

# 旧写法(2.1 之前)会触发 FutureWarning
# s.fillna(method='ffill')

# 新写法(2.1 之后)推荐
print(s.ffill())
```

旧写法在旧版本可用、在新版本报错或警告。编写教程与代码时,优先采用当前主流版本的推荐写法。

## 1.24.3 FutureWarning 处理

`FutureWarning` 提示当前写法将在未来版本改变或移除。它不会立刻报错,但会污染输出并隐藏真实问题。处理步骤:先复现警告,再按提示迁移到新 API。

### 触发与识别

```python
import warnings
import pandas as pd

s = pd.Series([1, None, 3])

with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter('always')
    s.fillna(method='ffill')
    for item in w:
        if issubclass(item.category, FutureWarning):
            print(item.message)
```

运行时会提示类似 `The 'method' keyword in Series.fillna is deprecated` 的信息,并按提示改用 `.ffill()`。

### 查看版本内所有弃用

`pd.show_versions()` 输出 Pandas 及其依赖（NumPy、Matplotlib 等）的版本信息,便于排查版本相关的不兼容:

```python
import pandas as pd

pd.show_versions()
```

在报告 bug 或排查环境问题时,`show_versions()` 的输出是标准化的诊断信息。

## 1.24.4 迁移注意事项

### 从旧版本迁移的关键点

- `fillna(method=...)` 改为 `.ffill()` / `.bfill()`
- `resample('M').apply(func)` 的部分用法调整,优先用 `agg`
- `Series.append` 已移除,改用 `pd.concat`
- `df.append` 已移除,改用 `pd.concat`
- `astype` 对含缺失的整数列,用可空类型 `'Int64'`（大写 I）而非 `'int64'`
- 索引的 `inplace` 参数逐步弃用,改用重新赋值

示例——整数列含缺失的转换:

```python
import pandas as pd

s = pd.Series([1, None, 3])

# 旧写法:直接 astype('int64') 会报错(无法处理 NaN)
# 新写法:使用可空整数类型 Int64
print(s.astype('Int64'))
```

### 让代码兼容多版本

同一份代码要运行在不同版本环境时,可先探测版本再分派写法:

```python
import pandas as pd

def fill_forward(s):
    if pd.__version__ >= '2.1.0':
        return s.ffill()
    return s.fillna(method='ffill')

s = pd.Series([1, None, 3])
print(fill_forward(s))
```

版本探测保持最小改动,避免在代码中堆叠大量分支。多数情况直接采用新版推荐写法,旧版本环境通过升级依赖解决。

### 写时复制 (Copy-on-Write)

Pandas 2.0 引入写时复制,3.0 起默认启用。它让切片返回视图而非副本,减少内存拷贝,但改变了对切片赋值的语义:

```python
import pandas as pd

pd.set_option('mode.copy_on_write', True)   # 2.x 手动启用;3.x 默认开启

df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
sub = df['A']
sub[0] = 99          # 写时复制下不会改到原 df,需用 df.loc 显式修改
print(df)
```

启用写时复制后,对切片子集的赋值不再影响原 DataFrame,`df.loc` 是唯一可靠的修改入口。

## 1.24.5 版本迁移清单

迁移 Pandas 代码时可对照以下清单逐项检查:

- 确认 `pd.__version__`,核对目标版本与文档一致
- 搜索 `FutureWarning` 输出,逐条迁移
- 用 `pd.show_versions()` 记录依赖版本
- 替换已移除的 API（`append`、`fillna(method=...)` 等）
- 含缺失的整数列改用 `'Int64'` 可空类型
- 评估写时复制对切片赋值语义的影响

## 练习题

### 第1题 概念理解

说明 `pd.__version__` 的用途;说明 `FutureWarning` 与 `DeprecationWarning` 在 Pandas 中的含义区别;说明写时复制对切片赋值的影响。

::: details 参考答案

`pd.__version__` 返回当前版本号。`FutureWarning` 提示当前写法未来会改变或移除,`DeprecationWarning` 提示功能已弃用。写时复制使切片返回视图,对切片的赋值不再影响原 DataFrame,需用 `df.loc` 显式修改。
:::

### 第2题 代码编写

用 `pd.__version__` 输出当前版本;构造含缺失的整数 Series 并用 `astype('Int64')` 转换;用 `.ffill()` 代替 `fillna(method='ffill')` 完成前向填充。

::: details 参考答案

```python
import pandas as pd

print(pd.__version__)

s = pd.Series([1, None, 3])
print(s.astype('Int64'))
print(s.ffill())
```

:::

### 第3题 进阶练习

编写一个按版本分派填充逻辑的函数,在 `pd.__version__ >= '2.1.0'` 时用 `ffill`,否则用 `fillna(method='ffill')`;用 `warnings.catch_warnings` 捕获一次 `FutureWarning`;调用 `pd.show_versions()` 查看依赖信息。

::: details 参考答案

```python
import warnings
import pandas as pd

def fill_forward(s):
    if pd.__version__ >= '2.1.0':
        return s.ffill()
    return s.fillna(method='ffill')

s = pd.Series([1, None, 3])
print(fill_forward(s))

with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter('always')
    s.fillna(method='ffill')
    print([str(x.message) for x in w if issubclass(x.category, FutureWarning)])

pd.show_versions()
```

:::

## 常见错误

**错误 1 · 文档写法与本地版本不匹配报错**

原因:教程或旧代码用了当前版本已移除的 API（如 `fillna(method=...)`、`append`）。
 
解决:核对 `pd.__version__`,改用新版推荐写法。

**错误 2 · 含缺失的整数列 `astype('int64')` 报错**

原因:原生 `int64` 不支持 NaN,转换失败。
 
解决:使用可空整数类型 `'Int64'`（大写 I）。

**错误 3 · 对切片赋值后原 DataFrame 未变化**

原因:写时复制启用后,切片返回视图,赋值不写回原对象。
 
解决:用 `df.loc` 显式修改,或关闭写时复制（不推荐）。

**错误 4 · 大量 FutureWarning 刷屏掩盖真实错误**

原因:旧写法触发警告,日志被污染。
 
解决:逐条迁移到新 API;排查阶段可用 `warnings.simplefilter('error', FutureWarning)` 让警告抛出以便定位。
