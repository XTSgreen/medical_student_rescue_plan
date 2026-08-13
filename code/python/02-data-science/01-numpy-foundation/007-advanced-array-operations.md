---
title: 1.7 高级数组操作
sidebar:
  order: 7
---
# 1.7 高级数组操作

前面各章处理的都是元素类型单一的普通数组。实际数据往往更复杂:一行可能同时包含姓名、年龄、收入这些不同类型的数据;某些数据有缺失或无效需要掩蔽;大数据集内存放不下需要映射到磁盘;文本、日期、位运算也需要专门的数组类型。本节将讲解结构化数组、记录数组、掩码数组、内存映射数组、字符数组、日期时间数组和位运算函数这些高级工具。

## 1.7.1 结构化数组

### 用 dtype 定义字段

结构化数组让每个元素包含多个不同类型的字段,类似"一行多条信息"。通过带字段名的 `dtype` 创建:

```python
import numpy as np

# 定义一个含三个字段的结构化 dtype
dtype = np.dtype([("name", "U10"), ("age", np.int32), ("salary", np.float64)])
print(dtype)   # [('name', '<U10'), ('age', '<i4'), ('salary', '<f8')]

# 用结构化 dtype 创建数组
people = np.zeros(3, dtype=dtype)
people["name"] = ["Alice", "Bob", "Carol"]
people["age"] = [25, 32, 28]
people["salary"] = [5000.0, 8000.0, 6500.0]

print(people)
# [('Alice', 25, 5000.) ('Bob', 32, 8000.) ('Carol', 28, 6500.)]
```

### 按字段访问

结构化数组可以按字段名访问列,也可以按行访问元素:

```python
print(people["age"])        # [25 32 28]，整列
print(people[0])            # ('Alice', 25, 5000.)，整行
print(people["salary"].mean())  # 6500.0，字段聚合
```

按字段访问返回的是该字段组成的数组,可以直接参与计算。

### 从元组列表创建

也可以从元组列表直接创建结构化数组:

```python
import numpy as np

data = [("Alice", 25, 5000.0), ("Bob", 32, 8000.0)]
people = np.array(data, dtype=[("name", "U10"), ("age", "i4"), ("salary", "f8")])
print(people["name"])   # ['Alice' 'Bob']
```

结构化数组在读取表格数据、按记录组织异构数据时很有用,pandas 的 `DataFrame` 底层也借鉴了类似思想。

## 1.7.2 记录数组(np.recarray)

`np.recarray` 是结构化数组的变体,字段可以直接用属性名访问(`p.name` 而非 `p["name"]`):

```python
import numpy as np

data = np.array([("Alice", 25), ("Bob", 32)],
                dtype=[("name", "U10"), ("age", "i4")])
rec = data.view(np.recarray)

print(rec.name)    # ['Alice' 'Bob']，属性访问
print(rec.age)     # [25 32]
print(rec[0].name) # Alice
```

`recarray` 用 `data.view(np.recarray)` 从普通结构化数组转换。属性访问更直观,但比下标访问稍慢,字段名与内置属性(如 `shape`、`dtype`)冲突时要小心。

## 1.7.3 掩码数组(numpy.ma)

### MaskedArray 与掩码

掩码数组在普通数组之外附加一个掩码,标记哪些元素无效。被掩蔽的元素不参与计算,常见的 `np.ma` 模块为数据清洗中处理缺失/异常值提供了方便。

```python
import numpy.ma as ma

data = np.array([1.0, 2.0, -999.0, 4.0, -999.0])
mask = (data == -999.0)              # 把 -999 标记为无效
mdata = ma.masked_array(data, mask=mask)

print(mdata)   # [1.0 2.0 -- 4.0 --]，-- 表示被掩蔽
print(mdata.mean())   # 2.3333333333333335，被掩蔽元素被忽略
```

普通 `data.mean()` 会把 -999 也计入,结果被污染;掩码数组自动忽略无效值。

### 掩码操作

```python
import numpy.ma as ma

data = np.array([1.0, 2.0, 3.0, 4.0])

# 按条件生成掩码
mdata = ma.masked_where(data < 2, data)
print(mdata)   # [-- 2.0 3.0 4.0]

# 掩码数组转回普通数组
filled = mdata.filled(0)      # 用 0 填充被掩蔽位置
print(filled)   # [0. 2. 3. 4.]

# 压缩去除被掩蔽元素
compressed = mdata.compressed()
print(compressed)   # [2. 3. 4.]
```

`filled()` 用指定值填充,`compressed()` 丢弃被掩蔽元素。掩码数组常用于处理传感器异常读数、检测仪器缺失值等场景。

## 1.7.4 内存映射数组(np.memmap)

`np.memmap` 把磁盘上的二进制文件映射为数组,数据按需从磁盘读取,不一次性载入内存。适合处理超出内存容量的大文件:

```python
import numpy as np
import tempfile, os

# 创建一个二进制文件并写入数据
fname = os.path.join(tempfile.gettempdir(), "mmap.dat")
arr = np.arange(100, dtype=np.float64)
arr.tofile(fname)

# 以 memmap 方式映射该文件
m = np.memmap(fname, dtype=np.float64, mode="r", shape=(10, 10))
print(m.shape)     # (10, 10)
print(m[0, 0])     # 0.0，按需读取
print(m.sum())     # 4950.0，可正常参与计算
```

`memmap` 的 `mode` 参数:`'r'` 只读、`'r+'` 读写、`'w+'` 覆盖写。修改 memmap 数组会同步写回磁盘文件。它让代码能以处理普通数组的方式处理远大于内存的文件。

## 1.7.5 字符数组(np.char)

`np.char` 模块提供向量化的字符串操作,能对整个字符串数组逐元素处理,比 Python 循环快:

```python
import numpy as np

words = np.array(["Hello", "World", "NumPy"])
print(np.char.lower(words))       # ['hello' 'world' 'numpy']
print(np.char.upper(words))       # ['HELLO' 'WORLD' 'NUMPY']
print(np.char.add(words, "!"))    # ['Hello!' 'World!' 'NumPy!']
print(np.char.find(words, "o"))   # [ 4  1 -1]，找不到返回 -1
print(np.char.startswith(words, "N"))  # [False False  True]

# 连接
print(np.char.join("-", words))   # ['H-e-l-l-o' 'W-o-r-l-d' 'N-u-m-P-y']

# 替换
print(np.char.replace(words, "o", "0"))  # ['Hell0' 'W0rld' 'NumPy']
```

`np.char` 覆盖大小写转换、拼接、查找、替换、去空白等常见字符串操作,全部向量化执行。

## 1.7.6 日期时间数组(np.datetime64、np.timedelta64)

### 日期时间类型

`np.datetime64` 表示日期时间,`np.timedelta64` 表示时间差,两者组成日期时间运算体系:

```python
import numpy as np

dates = np.array(["2024-01-01", "2024-06-15", "2025-12-31"], dtype="datetime64[D]")
print(dates)
# ['2024-01-01' '2024-06-15' '2025-12-31']

# 生成日期范围
rng = np.arange("2024-01-01", "2024-01-05", dtype="datetime64[D]")
print(rng)   # ['2024-01-01' '2024-01-02' '2024-01-03' '2024-01-04']
```

`dtype` 中的单位控制精度:`Y` 年、`M` 月、`W` 周、`D` 天、`h` 小时、`m` 分钟、`s` 秒、`ms` 毫秒。

### 日期时间运算

```python
import numpy as np

a = np.datetime64("2024-01-10")
b = np.datetime64("2024-01-01")

# 时间差
diff = a - b
print(diff)         # 9 days
print(diff.astype("int64"))   # 9，转成整数天数

# timedelta64 运算
delta = np.timedelta64(5, "D")
print(a + delta)    # 2024-01-15
print(b + delta)    # 2024-01-06
```

### 日期时间的统计

```python
import numpy as np

dates = np.array(["2024-01-01", "2024-01-05", "2024-01-20"], dtype="datetime64[D]")
print(dates.max())   # 2024-01-20
print(dates.min())   # 2024-01-01
print(np.diff(dates))  # [4 15] days，相邻日期差
```

日期时间数组支持大小比较、最值、排序,是时间序列分析的基础。

## 1.7.7 位运算函数

`np.bitwise_and`、`np.bitwise_or`、`np.bitwise_xor`、`np.invert`、`np.left_shift`、`np.right_shift` 对整数数组做逐位运算:

```python
import numpy as np

a = np.array([12, 5], dtype=np.int8)   # 12=1100, 5=0101
b = np.array([10, 3], dtype=np.int8)   # 10=1010, 3=0011

print(np.bitwise_and(a, b))   # [8 1]，逐位与
print(np.bitwise_or(a, b))    # [14 7]，逐位或
print(np.bitwise_xor(a, b))   # [ 6 6]，逐位异或
print(np.invert(a))           # [-13 -6]，按位取反
print(np.left_shift(a, 1))    # [24 10]，左移一位,相当于乘 2
print(np.right_shift(a, 1))   # [ 6 2]，右移一位,相当于整除 2
```

位运算的 `& | ~ ^` 运算符与逻辑运算形式相同,但作用于整数位。位运算常用于权限标志、状态位编码、图像像素打包等场景。

## 练习题

### 第1题 概念理解

结构化数组的 `dtype` 定义了什么?写出用字段名访问列与用行号访问记录的代码,并说明 `recarray` 与普通结构化数组的区别。

::: details 参考答案

结构化 `dtype` 定义每个元素的字段名和字段类型。访问列用 `people["age"]`,访问记录用 `people[0]`。`recarray` 允许用属性名访问(`people.age`),普通结构化数组只能用下标 `people["age"]`。`recarray` 通过 `arr.view(np.recarray)` 转换。
:::

### 第2题 代码编写

有一个数组 `data = np.array([10.0, -1.0, 20.0, -1.0, 30.0])`,其中 -1.0 表示缺失值。用掩码数组屏蔽 -1.0,计算被掩蔽后的均值,再用 `filled` 把缺失值替换为 0。

::: details 参考答案

```python
import numpy.ma as ma
import numpy as np

data = np.array([10.0, -1.0, 20.0, -1.0, 30.0])
mask = (data == -1.0)
mdata = ma.masked_array(data, mask=mask)

print(mdata.mean())      # 20.0，忽略缺失值
filled = mdata.filled(0)
print(filled)            # [10.  0. 20.  0. 30.]
```

:::

### 第3题 进阶练习

生成从 2024-01-01 到 2024-01-10 的日期数组,计算第一个日期与最后一个日期的差值(天),并把日期数组中的周一至周日对应的工作日(周一~周五)筛选出来(提示:用 `dates.astype("int64")` 判断星期,2024-01-01 是周一)。

::: details 参考答案

```python
import numpy as np

dates = np.arange("2024-01-01", "2024-01-11", dtype="datetime64[D]")
print(dates)
# ['2024-01-01' ... '2024-01-10']

last = dates[-1] - dates[0]
print(last)   # 9 days

# 2024-01-01 是周一，weekday 索引 0 表示周一
# 用 epoch 偏移计算: 2024-01-01 的 int64 值对 7 取模为 0(周一)
offset = dates.astype("int64") % 7
weekdays = dates[(offset >= 0) & (offset <= 4)]
print(weekdays)   # 周一至周五的日期
```

`datetime64` 转 `int64` 后按 7 取模可得星期信息,用于筛选工作日。
:::

### 第4题 项目实践

命令行任务管理器要把任务记录组织成结构化数组,每条记录含任务名(字符串)、优先级(整数)、创建日期(日期)、是否完成(布尔)。创建含 3 条记录的结构化数组,并按优先级字段排序取前 2 个最高优先级任务。

::: details 参考答案

```python
import numpy as np

dtype = np.dtype([("task", "U20"), ("priority", "i4"),
                  ("created", "datetime64[D]"), ("done", "bool")])
tasks = np.array([
    ("写报告", 3, np.datetime64("2024-01-05"), False),
    ("整理数据", 1, np.datetime64("2024-01-08"), True),
    ("发邮件", 2, np.datetime64("2024-01-02"), False),
], dtype=dtype)

print(tasks["task"])       # 任务名列
sorted_tasks = np.sort(tasks, order="priority")[::-1]   # 按优先级降序
print(sorted_tasks["task"])   # 优先级最高的任务在前
print(sorted_tasks[:2]["task"])  # 前两个最高优先级任务
```

结构化数组可配合 `np.sort(order=...)` 按字段排序,后续章节会详细讲排序。
:::

## 常见错误

**错误 1 · `TypeError: Could not be cast from U12 to S... `**

原因:字符串长度超过结构化 dtype 定义的长度,或中文字符串宽度计算与预期不符。

解决:定义字段时给足长度(中文按字符数),例如 `"U20"` 表示最多 20 个字符,超长时用 `astype` 扩展。

**错误 2 · 掩码数组与普通数组混算导致掩码丢失**

原因:掩码数组与普通数组运算,或直接取普通数组的数值,掩码信息没有正确传递,无效值被当作有效值计算。

解决:全程使用掩码数组,或在需要普通数组时显式 `filled()`/`compressed()` 处理。

**错误 3 · 对 `recarray` 用与字段同名的属性**

原因:字段名与数组内置属性(如 `shape`、`dtype`)同名时,属性访问返回内置属性而非字段值。

解决:避免字段名与内置属性重名,字段访问优先用下标形式。

**错误 4 · 日期时间单位不匹配导致运算错误**

原因:两个日期时间的精度单位不同(如 `datetime64[D]` 与 `datetime64[h]`)直接运算,结果单位混乱。

解决:运算前统一 `dtype` 精度,或用 `.astype("datetime64[D]")` 归一后计算。
