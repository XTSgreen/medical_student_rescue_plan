---
title: 1.23 测试工具
sidebar:
  order: 23
---
# 1.23 测试工具

数据处理代码的正确性需要检验：转换后的结果是否等于期望值、两批数据是否一致、数据类型是否符合预期。Pandas 提供了一套内置测试工具，`pd.test()` 用于运行 Pandas 自身的测试套件，`pd.util.testing` 提供严格的相等性断言，`pd.api.types` 提供类型判断函数。本节讲解这三类工具的用法与适用场景。

## 1.23.1 运行测试套件 pd.test()

`pd.test()` 运行 Pandas 自带的单元测试，用于验证安装的 Pandas 是否工作正常。直接调用即可：

```python
import pandas as pd

pd.test()    # 运行 Pandas 测试套件
```

该调用会执行完整的测试集并输出测试摘要，通常耗时较长。日常开发中主要用它确认环境安装没有损坏，而非验证业务代码。

## 1.23.2 pd.util.testing 断言

`pd.util.testing` 提供 DataFrame、Series、Index 的严格相等断言。与 Python 内置的 `==` 不同，这些断言能给出精确的差异位置提示，并支持逐项比较 dtype、索引、NaN 位置：

| 函数 | 作用 |
|------|------|
| `assert_frame_equal(a, b)` | 断言两个 DataFrame 相等 |
| `assert_series_equal(a, b)` | 断言两个 Series 相等 |
| `assert_index_equal(a, b)` | 断言两个 Index 相等 |

```python
import pandas as pd
import numpy as np

from pandas.testing import assert_frame_equal, assert_series_equal, assert_index_equal

df1 = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
df2 = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
assert_frame_equal(df1, df2)      # 通过,无输出

s1 = pd.Series([1, np.nan, 3])
s2 = pd.Series([1, np.nan, 3])
assert_series_equal(s1, s2)       # 通过,NaN 位置一致

idx1 = pd.Index([1, 2, 3])
idx2 = pd.Index([1, 2, 3])
assert_index_equal(idx1, idx2)    # 通过
```

### 检查点参数

断言函数支持检查索引、dtype、数值容差等，控制比较的严格程度：

```python
import pandas as pd
import numpy as np

from pandas.testing import assert_frame_equal

df1 = pd.DataFrame({'A': [0.1, 0.2]})
df2 = pd.DataFrame({'A': [0.1000001, 0.2000001]})

# 默认精确比较会失败;设置 rtol 后按相对误差比较
assert_frame_equal(df1, df2, check_exact=False, rtol=1e-3)
```

`check_exact=False` 允许数值误差,配合 `rtol`/`atol` 设置相对与绝对容差;`check_names`、`check_dtype` 控制是否比较索引名与 dtype。浮点运算结果常因舍入略有偏差,用容差比较比精确比较更符合实际。

### 断言失败时的行为

断言不通过时抛出 `AssertionError` 并打印差异,不中断整个程序（可被 `try` 捕获）。在单元测试框架（pytest）中,断言失败即该测试用例失败。

## 1.23.3 pd.api.types 类型判断

`pd.api.types` 提供一组类型判断函数,用于检查 dtype 是否属于某类,常用于分支逻辑与数据校验:

| 函数 | 判断内容 |
|------|----------|
| `is_numeric_dtype(obj)` | 是否为数值类型（int、float 等） |
| `is_integer_dtype(obj)` | 是否为整数类型 |
| `is_float_dtype(obj)` | 是否为浮点类型 |
| `is_bool_dtype(obj)` | 是否为布尔类型 |
| `is_object_dtype(obj)` | 是否为 object 类型 |
| `is_string_dtype(obj)` | 是否为字符串类型 |
| `is_datetime64_dtype(obj)` | 是否为 datetime64 类型 |
| `is_timedelta64_dtype(obj)` | 是否为 timedelta64 类型 |
| `is_categorical_dtype(obj)` | 是否为分类类型 |
| `is_interval_dtype(obj)` | 是否为区间类型 |
| `is_sparse(obj)` | 是否为稀疏结构 |

```python
import pandas as pd
import numpy as np

from pandas.api.types import is_numeric_dtype, is_datetime64_dtype, is_categorical_dtype

print(is_numeric_dtype(pd.Series([1, 2, 3])))            # True
print(is_numeric_dtype(pd.Series(['a', 'b'])))           # False
print(is_datetime64_dtype(pd.to_datetime(['2024-01-01'])))  # True
print(is_categorical_dtype(pd.Series(['低', '中'], dtype='category')))  # True
```

这些函数接受 dtype、数组或 Series/DataFrame,返回布尔值。在数据清洗入口处用它们做类型校验,可避免下游因类型不符而报错。

### 结合断言做数据校验

类型判断与断言组合,可在数据管道入口做前置校验:

```python
import pandas as pd

from pandas.api.types import is_numeric_dtype

def validate_input(df):
    assert is_numeric_dtype(df['值']), '值列必须为数值类型'
    assert not df['值'].isna().any(), '值列存在缺失值'
    print('输入校验通过')

df = pd.DataFrame({'值': [1.0, 2.5, 3.0]})
validate_input(df)
```

## 1.23.4 在 pytest 中的使用

`pd.util.testing` 的断言可直接嵌入 pytest 测试用例,配合数据转换函数验证结果:

```python
import pandas as pd

import pytest

from pandas.testing import assert_frame_equal

def clean_data(df):
    return df.dropna().reset_index(drop=True)

def test_clean_data():
    src = pd.DataFrame({'A': [1, None, 3], 'B': [4, 5, 6]})
    expected = pd.DataFrame({'A': [1, 3], 'B': [4, 6]}, index=[0, 1])
    result = clean_data(src)
    assert_frame_equal(result, expected, check_dtype=False)
```

`reset_index(drop=True)` 后的索引从 0 重新编号,用 `check_dtype=False` 可忽略 dtype 差异,聚焦数值与结构是否一致。

## 练习题

### 第1题 概念理解

说明 `pd.test()` 与 `pd.util.testing` 断言在用途上的区别;说明 `assert_frame_equal` 的 `check_exact` 参数含义;说明 `is_numeric_dtype` 与 `== 'int64'` 判断的区别。

::: details 参考答案

`pd.test()` 验证 Pandas 自身安装是否正常,断言用于验证业务数据的相等性。`check_exact=False` 允许数值容差(配合 `rtol`/`atol`),适合浮点比较。`is_numeric_dtype` 覆盖 int、float 等多种数值 dtype,`== 'int64'` 只匹配单一类型。
:::

### 第2题 代码编写

构造两个结构相同的 DataFrame 并用 `assert_frame_equal` 验证相等;构造含 NaN 的 Series 与另一份相同 Series 用 `assert_series_equal` 验证;用 `pd.api.types` 判断一组数据的类型。

::: details 参考答案

```python
import pandas as pd
import numpy as np

from pandas.testing import assert_frame_equal, assert_series_equal
from pandas.api.types import is_numeric_dtype, is_datetime64_dtype

df1 = pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']})
df2 = pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']})
assert_frame_equal(df1, df2)

s1 = pd.Series([1, np.nan, 3])
s2 = pd.Series([1, np.nan, 3])
assert_series_equal(s1, s2)

print(is_numeric_dtype(df1['A']))
print(is_datetime64_dtype(pd.Series(pd.to_datetime(['2024-01-01']))))
```

:::

### 第3题 进阶练习

写一个 `validate` 函数,用断言与类型判断检查 DataFrame 的某列必须为数值类型且无缺失;把断言嵌入一个 pytest 风格的测试函数;用 `check_exact=False` 与容差比较两个浮点 DataFrame。

::: details 参考答案

```python
import pandas as pd
import numpy as np

from pandas.testing import assert_frame_equal
from pandas.api.types import is_numeric_dtype

def validate(df):
    assert is_numeric_dtype(df['值']), '值列必须为数值类型'
    assert not df['值'].isna().any(), '值列存在缺失值'

df = pd.DataFrame({'值': [1.0, 2.5, 3.0]})
validate(df)

a = pd.DataFrame({'x': [0.1, 0.2]})
b = pd.DataFrame({'x': [0.1000001, 0.2000001]})
assert_frame_equal(a, b, check_exact=False, rtol=1e-3)
```

:::

## 常见错误

**错误 1 · 用 `==` 判断两个 DataFrame 相等结果异常**

原因:`df1 == df2` 做的是逐元素比较,返回布尔 DataFrame,而非整体布尔值;含 NaN 的位置始终为 False。
 
解决:用 `assert_frame_equal` 或先对结果调用 `.all().all()`。

**错误 2 · 浮点比较失败**

原因:浮点运算的舍入误差使精确比较失败。
 
解决:设置 `check_exact=False` 并给出合理的 `rtol`/`atol`。

**错误 3 · 断言失败导致程序中断**

原因:断言抛出 `AssertionError`,未被捕获。
 
解决:在测试框架中让它按预期失败;在业务代码中改用 `try`/`except` 捕获并记录日志。

**错误 4 · `pd.util.testing` 导入路径写错**

原因:新版本推荐 `from pandas.testing import ...`,旧写法 `pd.util.testing.assert_frame_equal` 虽可用但导入路径易错。
 
解决:统一使用 `from pandas.testing import assert_frame_equal`。
