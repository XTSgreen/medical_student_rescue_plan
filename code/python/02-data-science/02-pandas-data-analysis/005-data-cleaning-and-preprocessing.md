---
title: 1.5 数据清洗与预处理
sidebar:
  order: 5
---
# 1.5 数据清洗与预处理

前几章学会了查看与选择数据，但真实数据很少是干净的：存在缺失值、重复记录、错误类型、混杂格式的字符串。数据分析中清洗环节通常占用大量时间，Pandas 为此提供了完整的预处理工具链。本节系统覆盖五个主题：缺失值处理、重复值处理、数据类型转换、字符串列处理、分类数据与日期时间处理，这是后续一切分析的基础工序。

## 1.5.1 缺失值处理

### 检测缺失值

`.isna()`、`.isnull()`、`.notna()` 用于检测缺失值，三者行为已在前一章介绍。`df.isna().sum()` 按列统计缺失个数是常用的一步操作：

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({'A': [1, None, 3], 'B': [4, 5, None]})
print(df.isna())
print(df.isna().sum())
# A    1
# B    1
```

### 删除缺失值 .dropna()

`.dropna()` 删除包含缺失值的行或列。默认删除任何含缺失值的行，`axis=1` 删除含缺失值的列：

```python
df = pd.DataFrame({'A': [1, None, 3], 'B': [4, 5, None]})
print(df.dropna())            # 删除含缺失值的行
print(df.dropna(axis=1))      # 删除含缺失值的列
```

常用参数：`how='all'` 只删全部为缺失的行，`thresh=n` 保留至少有 n 个非空值的行，`subset=['A']` 只在指定列上判断缺失。

### 填充缺失值 .fillna()

`.fillna()` 用指定值或规则填充缺失。支持标量、字典（按列给不同值）、前向/后向填充、插值：

```python
df = pd.DataFrame({'A': [1, None, 3, None], 'B': [4, 5, None, 7]})

print(df.fillna(0))                       # 全部填 0
print(df.fillna({'A': 0, 'B': -1}))       # 按列填不同值
print(df.fillna(method='ffill'))          # 前向填充，用前一行的值
print(df.fillna(method='bfill'))          # 后向填充
```

`method='ffill'`（前向填充）用上方最近的非空值填充，`method='bfill'`（后向填充）用下方最近的非空值填充。`limit` 参数限制填充连续缺失的最大个数。`method` 参数在新版本中可写作 `fillna(method=...)`，也有 `pad`/`backfill` 别名。

### 替换值 .replace()

`.replace()` 把指定值替换成新值，适合处理脏数据中的占位符：

```python
s = pd.Series(['未知', '男', '女', '未知'])
print(s.replace('未知', '缺失'))
print(s.replace({'未知': '缺失', '男': 'M', '女': 'F'}))
```

### 插值 .interpolate()

`.interpolate()` 用插值方法填补缺失，默认线性插值，把缺失位置按两侧数值比例推算：

```python
s = pd.Series([1, None, None, 4])
print(s.interpolate())
# 0    1.0
# 1    2.0
# 2    3.0
# 3    4.0
```

`method` 参数支持 `'linear'`、`'time'`、`'quadratic'`、`'polynomial'`、`'spline'` 等多种算法，第 18 章详细展开。

## 1.5.2 重复值处理

### 检测重复 .duplicated()

`.duplicated()` 判断每行是否与前面的行重复，默认保留第一个：

```python
df = pd.DataFrame({'A': [1, 2, 1, 2, 3], 'B': [5, 6, 5, 6, 7]})
print(df.duplicated())
# 0    False
# 1    False
# 2     True
# 3     True
# 4    False
```

### 删除重复 .drop_duplicates()

`.drop_duplicates()` 删除重复行，保留第一个（或最后一个）：

```python
print(df.drop_duplicates())
print(df.drop_duplicates(keep='last'))
print(df.drop_duplicates(subset=['A']))   # 只按 A 列判断重复
```

`subset` 参数指定判断重复的列集合，`keep='first'` 保留第一个、`keep='last'` 保留最后一个、`keep=False` 全部删除。

## 1.5.3 数据类型转换

### .astype()

`.astype()` 显式转换数据类型：

```python
s = pd.Series(['1', '2', '3'])
print(s.astype(int))          # 转整数
print(s.astype(float))        # 转浮点
```

DataFrame 可以按列转换，用字典指定每列的目标类型：

```python
df = pd.DataFrame({'A': ['1', '2'], 'B': ['1.5', '2.5']})
df2 = df.astype({'A': int, 'B': float})
```

### 数值转换 pd.to_numeric()

`pd.to_numeric()` 把字符串转数值，遇到无法转换的值默认报错，`errors='coerce'` 时把非法值变成 NaN：

```python
s = pd.Series(['1', '2', 'abc', '4'])
print(pd.to_numeric(s, errors='coerce'))
# 0    1.0
# 1    2.0
# 2    NaN
# 3    4.0
```

### 日期转换 pd.to_datetime()

`pd.to_datetime()` 把字符串转成时间戳类型，`errors='coerce'` 同理处理非法日期：

```python
s = pd.Series(['2024-01-01', '2024/02/15', 'invalid'])
print(pd.to_datetime(s, errors='coerce'))
# 0   2024-01-01
# 1   2024-02-15
# 2          NaT
# dtype: datetime64[ns]
```

### 时间差转换 pd.to_timedelta()

`pd.to_timedelta()` 把字符串转成时间差：

```python
s = pd.Series(['1 day', '2 hours', '30 minutes'])
print(pd.to_timedelta(s))
```

### 时段转换 pd.to_period()

`.to_period()` 把时间戳转成时间段，`freq` 指定粒度（月、季、年等）：

```python
s = pd.to_datetime(['2024-01-15', '2024-03-20'])
print(s.to_period('M'))
# PeriodIndex(['2024-01', '2024-03'], dtype='period[M]')
```

### 分类转换 pd.Categorical()

`pd.Categorical()` 或 `dtype='category'` 创建分类数据，分类类型既能节省内存又支持有序比较：

```python
cat = pd.Categorical(['低', '高', '中', '低'], categories=['低', '中', '高'], ordered=True)
print(cat)
print(cat > '低')
# [False  True  True False]
```

## 1.5.4 字符串列处理 .str 访问器

字符串列（object 或 string 类型）通过 `.str` 访问器调用字符串方法，向量化作用于每个元素。基本操作包括长度、大小写、去空白、拆分、替换、拼接：

```python
s = pd.Series(['  Hello  ', 'World', None, 'pandas'])

print(s.str.len())            # 长度，None 得到 NaN
print(s.str.upper())          # 转大写
print(s.str.lower())          # 转小写
print(s.str.strip())          # 去首尾空白
print(s.str.split(' '))       # 拆分，返回列表
print(s.str.replace('a', '@'))  # 替换
```

`.str.cat()` 拼接字符串，可以拼接 Series 内部元素或与其他 Series 逐元素拼接：

```python
s1 = pd.Series(['a', 'b'])
s2 = pd.Series(['x', 'y'])
print(s1.str.cat(sep=','))        # 'a,b'
print(s1.str.cat(s2, sep='-'))    # ['a-x', 'b-y']
```

### 提取与查找

`.str.extract()` 用正则提取第一个匹配分组，`.str.extractall()` 提取所有匹配，`.str.findall()` 返回所有匹配的列表：

```python
s = pd.Series(['abc-123', 'def-456', 'xyz'])
print(s.str.extract(r'(\d+)'))
#      0
# 0  123
# 1  456
# 2  NaN

print(s.str.findall(r'\d+'))
# 0    [123]
# 1    [456]
# 2       []
```

### 判断类方法

`.str.isalpha()`、`.str.isdigit()`、`.str.isalnum()` 分别判断是否全是字母、全是数字、字母数字混合；`.str.contains()` 判断是否包含子串；`.str.startswith()`、`.str.endswith()` 判断前缀后缀：

```python
s = pd.Series(['abc', '123', 'a1b', 'hello world'])
print(s.str.isalpha())       # [True False False False]
print(s.str.isdigit())       # [False True False False]
print(s.str.isalnum())       # [True True True False]
print(s.str.contains('o'))   # 是否包含字母 o
print(s.str.startswith('h')) # 是否以 h 开头
print(s.str.endswith('d'))   # 是否以 d 结尾
```

### 填充与切片

`.str.pad()` 填充到指定宽度，`.str.wrap()` 按宽度换行，`.str.zfill()` 左侧补零，`.str.slice()` 按位置切片：

```python
s = pd.Series(['7', '42', '128'])
print(s.str.zfill(3))      # ['007', '042', '128']
print(s.str.pad(5, side='left', fillchar='*'))   # 左侧填充到 5 位
print(s.str.slice(0, 2))   # 取每个字符串的前两个字符
```

## 1.5.5 分类数据 .cat 访问器

分类列通过 `.cat` 访问器操作。创建分类：

```python
s = pd.Series(['低', '中', '高', '中'], dtype='category')
```

`.cat` 的属性与方法：

```python
print(s.cat.categories)                 # Index(['低', '中', '高'])，全部类别
print(s.cat.ordered)                    # False，是否有序
print(s.cat.codes)                      # 每个值对应的整数编码

s2 = s.cat.add_categories(['极高'])     # 增加类别
s3 = s.cat.remove_categories(['低'])    # 移除类别（该值变 NaN）
s4 = s.cat.set_categories(['低', '中', '高', '极高'])  # 重设类别集合
s5 = s.cat.reorder_categories(['高', '中', '低'])      # 重排类别顺序
s6 = s.cat.as_ordered()                 # 转为有序分类
s7 = s.cat.as_unordered()               # 转为无序分类
```

`add_categories` 增加新类别，`remove_categories` 移除类别（该类别对应的值变为缺失），`set_categories` 整体重设类别集合，`reorder_categories` 调整类别顺序，`as_ordered`/`as_unordered` 切换是否有序。

## 1.5.6 日期时间处理 .dt 访问器

时间戳列通过 `.dt` 访问器提取日期时间的各个组成部分：

```python
s = pd.to_datetime(['2024-03-15 08:30:45', '2024-07-01 12:00:00'])

print(s.dt.year)          # 年
print(s.dt.month)         # 月
print(s.dt.day)           # 日
print(s.dt.hour)          # 时
print(s.dt.minute)        # 分
print(s.dt.second)        # 秒
print(s.dt.microsecond)   # 微秒
print(s.dt.quarter)       # 季度
print(s.dt.weekday)       # 星期（0 周一）
print(s.dt.dayofweek)     # 与 weekday 相同
print(s.dt.dayofyear)     # 一年中的第几天
print(s.dt.weekofyear)    # 一年中的第几周
print(s.dt.isocalendar()) # 返回 ISO 年、周、日
```

`.dt` 的方法：

```python
print(s.dt.date)            # 只取日期部分
print(s.dt.time)            # 只取时间部分
print(s.dt.strftime('%Y-%m-%d'))   # 按格式转字符串
print(s.dt.round('h'))      # 按小时取整
print(s.dt.floor('D'))      # 向下取整到天
print(s.dt.ceil('h'))       # 向上取整到小时
```

时区处理用 `.dt.tz_localize()` 设定时区、`.dt.tz_convert()` 转换时区：

```python
s_utc = s.dt.tz_localize('UTC')
print(s_utc.dt.tz_convert('Asia/Shanghai'))
```

`.dt.total_seconds()` 用于时间差列，把 Timedelta 转成秒数。

## 1.5.7 时间差与区间

时间差用 `pd.to_timedelta()` 创建，通过 `.dt` 也能访问其属性。区间（Interval）表示一段连续范围，用 `pd.Interval` 创建：

```python
iv = pd.Interval(0, 10, closed='right')
print(iv.left)      # 0
print(iv.right)     # 10
print(3 in iv)      # True，判断是否落在区间内
```

`pd.IntervalIndex` 是区间的索引集合，常用于年龄分段、价格分档：

```python
ii = pd.IntervalIndex.from_breaks([0, 18, 60, 100])
print(ii)
print(ii.contains(30))
```

## 练习题

### 第1题 概念理解

说明 `.dropna()` 与 `.fillna()` 各自的适用场景；说明 `.str` 访问器解决什么问题。

::: details 参考答案

`.dropna()` 适合缺失值占比小、可以直接删掉的场景；`.fillna()` 适合缺失值有价值需要补全的场景。`.str` 访问器把字符串方法向量化应用到 Series 的每个元素上，避免手写循环。
:::

### 第2题 代码编写

创建一个含缺失值和重复行的 DataFrame，依次完成：检测缺失、用均值填充数值列、删除重复行、把某列从字符串转成数值。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'A': ['1', '2', None, '2'],
                   'B': [10, 20, 30, 20]})
print(df.isna().sum())
df['A'] = pd.to_numeric(df['A'], errors='coerce')
df['A'] = df['A'].fillna(df['A'].mean())
df = df.drop_duplicates()
print(df)
```

:::

### 第3题 进阶练习

创建时间戳 Series，用 `.dt` 提取年、月、星期；把字符串日期转成 datetime 并转成月份周期；把一组字符串用 `.str.extract` 提取其中的数字。

::: details 参考答案

```python
import pandas as pd

s = pd.to_datetime(['2024-01-05', '2024-03-18'])
print(s.dt.year, s.dt.month, s.dt.weekday)
print(s.to_period('M'))

s2 = pd.Series(['item-42', 'item-7'])
print(s2.str.extract(r'(\d+)'))
```

:::

## 常见错误

**错误 1 · 字符串列调用普通字符串方法报 `AttributeError: 'Series' object has no attribute 'upper'`**

原因:字符串方法是 `.str.upper()` 不是 `.upper()`,直接对 Series 调用 Python 内置方法会报错。

解决:所有逐元素的字符串操作都要经过 `.str` 访问器。

**错误 2 · `pd.to_numeric` 遇到非法值报 `ValueError`**

原因:默认 `errors='raise'`,遇到无法解析的值直接抛异常。

解决:加 `errors='coerce'` 把非法值转成 NaN,之后再统一处理缺失。

**错误 3 · `.dropna()` 删掉的行比预期多**

原因:默认 `how='any'`,只要某行存在任意一个缺失值就删除整行。

解决:用 `subset` 限定只在关键列判断,或用 `thresh` 保留有足够有效值的行。

**错误 4 · 字符串列操作后类型从 `string` 变成 `object` 或相反**

原因:不同版本对字符串类型的行为有差异,`.str` 操作可能改变 dtype。

解决:操作后用 `astype('string')` 显式固定类型,或统一在创建时指定 dtype。
