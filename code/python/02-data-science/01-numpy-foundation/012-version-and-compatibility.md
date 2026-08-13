---
title: 1.12 版本与兼容性
sidebar:
  order: 12
---
# 1.12 版本与兼容性

前十一节使用的所有函数都假设环境里已经装好了一个可用的 NumPy。实际项目中,不同机器上安装的 NumPy 版本可能不同,旧版本的行为差异、废弃接口和输出格式差异会让同一段代码在不同环境得到不同结果。本节解决版本相关的三个问题:如何查看和管理版本、版本升级会带来哪些行为变化、以及如何控制数组的打印输出与处理 C 扩展兼容。

## 1.12.1 查看 NumPy 版本

### np.__version__ 与 np.version

NumPy 通过两个途径暴露版本号:

```python
import numpy as np

print(np.__version__)   # 例如 2.0.0
print(np.version.version)   # 与 __version__ 相同
```

版本号遵循语义化版本规则 `主版本.次版本.修订号`。主版本号变化代表不兼容的重大改动,次版本号变化代表向后兼容的新功能,修订号变化代表 bug 修复。判断环境是否满足依赖条件时,常用 `np.__version__` 与目标版本比较。

### 依赖 Python 版本与 pip 安装

NumPy 的版本与 Python 版本绑定。同一份代码在不同 Python 版本下能安装的 NumPy 版本不同,安装时 pip 会自动选择匹配的版本:

```bash
pip install numpy          # 安装当前环境可用的最新版
pip install numpy==1.26.4  # 指定版本
pip install "numpy>=1.24"  # 指定最低版本
```

`pip show numpy` 可以查看已安装版本的详细信息,`pip index versions numpy` 列出所有可用版本。工程中通过 `requirements.txt` 或 `pyproject.toml` 固定依赖版本,避免不同机器版本漂移。

## 1.12.2 版本升级带来的行为变化

NumPy 保持向后兼容,但某些行为在新版本中发生变化,升级后可能报错或结果不同。

### 废弃接口与 DeprecationWarning

被废弃的接口在调用时会产生 `DeprecationWarning`,提示该功能将在未来版本移除:

```python
import numpy as np
import warnings

# 以下写法在新版本会产生 DeprecationWarning(具体函数随版本不同)
with warnings.catch_warnings():
    warnings.simplefilter("always")
    # 示例:某些旧式别名或参数在新版本已废弃
    np.array(1.0).item()  # 正常使用,仅为演示
```

产生警告时不立即报错,代码仍可运行。升级到新版本前应清除这些警告,方法是把废弃调用替换为新式写法,或查阅对应版本的迁移说明。

### 行为变更示例:数据类型推断

数组的默认整数与浮点类型随平台与版本可能不同。显式指定 dtype 可以消除版本差异:

```python
import numpy as np

a = np.array([1, 2, 3])
print(a.dtype)   # int64(64 位平台),部分 32 位平台为 int32

# 显式指定,消除平台与版本差异
b = np.array([1, 2, 3], dtype=np.int64)
```

依赖默认 dtype 的代码在不同环境可能得到不同结果,涉及文件读写、数据库存储时应显式指定。

### 结果差异:随机数算法

不同版本之间随机数生成算法可能更新,相同种子得到不同的序列。这不属于 bug,但会导致可复现实验的随机部分结果变化:

```python
import numpy as np

rng = np.random.default_rng(42)
print(rng.integers(0, 100, 5))   # 与另一个版本的结果可能不同
```

需要跨版本复现随机结果时,固定随机数生成器的种子仍能保证同一版本内可复现,跨版本则无法保证。

## 1.12.3 打印选项控制

数组打印格式由全局选项控制,`np.set_printoptions` 可以调整,方便查看大数组或特定精度数据:

```python
import numpy as np

# 默认打印
print(np.arange(12).reshape(3, 4))

# 控制显示精度(保留 3 位小数)
np.set_printoptions(precision=3)
print(np.array([1.23456, 2.71828]))

# 控制一行的最大宽度
np.set_printoptions(linewidth=200)

# 关闭科学计数法
np.set_printoptions(suppress=True)
print(np.array([1e10, 1e-10]))   # [10000000000.  0.]

# 元素数量超过阈值时用省略号表示
np.set_printoptions(threshold=6)
print(np.arange(10))   # [0 1 2 ... 7 8 9]
```

常用参数:`precision` 小数位、`threshold` 触发省略的阈值、`edgeitems` 省略时两端显示的数量、`linewidth` 换行宽度、`suppress` 是否抑制科学计数法。`np.get_printoptions()` 查看当前所有选项,`np.set_printoptions()` 不带参数恢复默认。

### printoptions 上下文管理器

`np.printoptions` 作为上下文管理器,只在代码块内生效,结束后恢复原有设置:

```python
import numpy as np

a = np.random.default_rng(0).random((3, 3))
with np.printoptions(precision=2, suppress=True):
    print(a)   # 此处按 2 位小数打印
print(a)       # 恢复默认格式
```

需要局部控制输出格式时用上下文管理器,避免全局设置污染后续代码。

## 1.12.4 数组显示控制

### 数组截断与省略

默认情况下,一维数组超过 1000 个元素、多维数组元素总数超过阈值时,中间部分用 `...` 省略:

```python
import numpy as np

a = np.arange(1001)
print(a)
# [   0    1    2 ...  998  999 1000]
```

`edgeitems` 控制省略时首尾各显示多少项:

```python
np.set_printoptions(threshold=10, edgeitems=2)
print(np.arange(20))
# [ 0  1 ... 18 19]
```

### 一维数组多行显示

一维数组元素过多且宽度不足时换行显示:

```python
import numpy as np

np.set_printoptions(linewidth=40)
print(np.arange(30))
```

`linewidth` 越小,一维数组越容易折行;调整 `linewidth` 可控制换行点。

## 1.12.5 使用字符串表示与输出

`np.array2string` 生成数组的字符串表示,不直接打印,可用于写文件或拼接文本:

```python
import numpy as np

a = np.array([1.5, 2.5, 3.5])
s = np.array2string(a, precision=2, separator=", ")
print(s)          # [1.5, 2.5, 3.5]
print(type(s))    # <class 'str'>

# 带前缀与后缀,适合嵌入 JSON 等文本结构
s2 = np.array2string(a, prefix="value=", suffix=";")
print(s2)
```

`np.set_string_function` 可以自定义数组的字符串表示,`np.array_repr`/`np.array_str` 生成不同风格的表示文本。

## 1.12.6 与 C 扩展的兼容(numpy.ctypeslib)

Python 调 C 或 C++ 扩展时,需要把 NumPy 数组转成 C 能理解的形式。`numpy.ctypeslib` 提供转换工具,`numpy.array` 本身也可以作为缓冲区传给 C:

```python
import numpy as np
from numpy.ctypeslib import as_ctypes

a = np.arange(6, dtype=np.float64)
c_arr = as_ctypes(a)          # 转成 ctypes 数组
print(c_arr)                  # <c_double_Array_6 object at ...>
```

C 扩展通过 NumPy C API 访问数组数据,头文件与编译方式随版本变化。C 扩展代码中应检查 `NPY_VERSION` 与 `NPY_FEATURE_VERSION` 宏来保证与当前 NumPy 头文件匹配。对多数数据分析任务,把数组转成 Python 的 `bytes` 或 `ctypes` 后传给 C 库已足够,不必直接使用 C API。

## 1.12.7 环境一致性与可复现

### 固定依赖版本

`requirements.txt` 固定所有依赖版本,保证部署环境一致:

```
numpy==1.26.4
scipy==1.12.0
pandas==2.2.0
```

### 记录环境信息

`np.show_config` 显示当前 NumPy 的编译与链接信息:

```python
import numpy as np

np.show_config()   # 输出编译工具、BLAS/LAPACK 库等信息
```

该输出可用于排查性能异常(例如没有链接 BLAS 时矩阵运算变慢)与版本兼容问题。

## 练习题

### 第1题 概念理解

为什么依赖默认 dtype 的代码在不同机器上可能得到不同结果?如何消除这种差异?

::: details 参考答案

默认整数类型在 64 位平台是 `int64`,在 32 位平台是 `int32`,默认浮点类型也可能不同。消除方法是创建数组时显式指定 `dtype=np.int64` 等具体类型,文件读写与数据库存储前统一类型。
:::

### 第2题 代码编写

有一个数组 `a = np.random.default_rng(0).random((4, 4))`。使用 `np.printoptions` 上下文管理器,让打印结果保留 2 位小数并抑制科学计数法。

::: details 参考答案

```python
import numpy as np

a = np.random.default_rng(0).random((4, 4))
with np.printoptions(precision=2, suppress=True):
    print(a)
```

上下文结束后的打印恢复原有格式。
:::

### 第3题 进阶练习

用 `np.array2string` 生成数组 `b = np.array([1.111, 2.222, 3.333])` 的字符串表示,精度为 1 位小数,元素用 `|` 分隔。

::: details 参考答案

```python
import numpy as np

b = np.array([1.111, 2.222, 3.333])
s = np.array2string(b, precision=1, separator="|")
print(s)   # [1.1|2.2|3.3]
```

:::

### 第4题 项目实践

命令行任务管理器需要把数值结果写入报告文件。已知 `scores = np.array([0.123456, 12.345678, 999.999999])`,要求用 `np.array2string` 生成精度 3 位、不显示科学计数法的字符串,写入文件供报告使用。

::: details 参考答案

```python
import numpy as np

scores = np.array([0.123456, 12.345678, 999.999999])
# 先全局关闭科学计数法,再生成字符串
np.set_printoptions(suppress=True)
s = np.array2string(scores, precision=3)
print(s)   # [  0.123  12.346 999.   ]

with open("report.txt", "w", encoding="utf-8") as f:
    f.write(s)
```

:::

## 常见错误

**错误 1 · 升级 NumPy 后旧代码报错或结果改变**

原因:新版本废弃了某些接口,或改变了数据类型推断、随机数生成等行为。

解决:升级前运行测试并检查 `DeprecationWarning`,用新式写法替换废弃接口;在 `requirements.txt` 中固定版本避免意外升级。

**错误 2 · 打印大数组内容被 `...` 省略,误以为数据丢失**

原因:`threshold` 阈值以内才完整显示,超过阈值中间部分用省略号表示。

解决:这是显示行为而非数据丢失。需要完整查看时用 `np.set_printoptions(threshold=np.inf)` 或 `np.array2string` 导出。

**错误 3 · 修改 `set_printoptions` 后影响了其他代码的输出**

原因:`set_printoptions` 是全局设置,修改后作用于整个进程后续所有打印。

解决:局部格式化用 `with np.printoptions(...):` 上下文管理器,结束自动恢复;全局修改后手动调用 `np.set_printoptions()` 恢复默认。

**错误 4 · 不同机器上相同种子的随机结果不一致**

原因:不同 NumPy 版本的随机数生成算法可能不同,种子只能保证同一版本内可复现。

解决:需要跨环境可复现时固定 NumPy 版本;比较随机结果时在相同版本环境内进行。
