---
title: 1.20 合并连接详解
sidebar:
  order: 20
---
# 1.20 合并连接详解

第 6 章介绍了 `pd.merge`、`pd.join`、`pd.concat` 的基础用法，本节深入合并连接的完整参数与高级形式。数据库式合并、近似匹配合并、有序合并、按索引拼接等需求各有专门方法。掌握 `how`、`on`、`suffixes`、`indicator` 等参数，才能精确控制连接结果。

## 1.20.1 pd.merge 参数详解

`pd.merge(left, right, ...)` 的核心参数如下：

| 参数 | 作用 |
| ---- | ---- |
| `how` | 连接方式：`'inner'`、`'left'`、`'right'`、`'outer'`、`'cross'` |
| `on` | 两边同名的连接键列 |
| `left_on` / `right_on` | 两边不同名时分别指定连接键列 |
| `left_index` / `right_index` | 用索引作为连接键 |
| `suffixes` | 重名列的后缀，默认 `('_x', '_y')` |
| `indicator` | 添加来源标记列 |
| `validate` | 校验连接结果的行数关系 |

```python
import pandas as pd

left = pd.DataFrame({'key': ['a', 'b', 'c'], '值1': [1, 2, 3]})
right = pd.DataFrame({'key': ['b', 'c', 'd'], '值2': [20, 30, 40]})

print(pd.merge(left, right, on='key'))                    # 内连接
print(pd.merge(left, right, on='key', how='outer'))       # 外连接
print(pd.merge(left, right, on='key', how='left'))        # 左连接
print(pd.merge(left, right, on='key', how='right'))       # 右连接
print(pd.merge(left, right, how='cross'))                 # 笛卡尔积
```

### left_on 与 right_on

两边键列名不同时分别指定：

```python
left = pd.DataFrame({'学号': [1, 2], '姓名': ['张三', '李四']})
right = pd.DataFrame({'编号': [1, 2], '成绩': [90, 85]})
print(pd.merge(left, right, left_on='学号', right_on='编号'))
```

### left_index 与 right_index

用索引作为连接键：

```python
left = pd.DataFrame({'值': [1, 2]}, index=['x', 'y'])
right = pd.DataFrame({'值': [10, 20]}, index=['y', 'z'])
print(pd.merge(left, right, left_index=True, right_index=True, how='outer'))
```

### suffixes 重名列

两边有同名列时自动加后缀区分：

```python
left = pd.DataFrame({'key': ['a', 'b'], 'score': [90, 85]})
right = pd.DataFrame({'key': ['a', 'b'], 'score': [88, 92]})
print(pd.merge(left, right, on='key', suffixes=('_左', '_右')))
#   key  score_左  score_右
# 0   a       90       88
# 1   b       85       92
```

### indicator 来源标记

`indicator=True` 添加 `_merge` 列，标记每行来自哪张表：

```python
print(pd.merge(left, right, on='key', how='outer', indicator=True))
#   key  score_左  score_右      _merge
# 0   a     90.0     88.0        both
# 1   b     85.0     92.0        both
```

`indicator` 对排查连接是否产生意外行很有帮助，可以按 `_merge` 列筛选"只在一边"的行。

### validate 校验

`validate` 校验连接结果的行数关系，取值 `'one_to_one'`、`'one_to_many'`、`'many_to_one'`、`'many_to_many'`。违反规则时抛异常，用于在开发期发现数据问题：

```python
# 若左边键有重复，与 one_to_one 冲突会报 MergeError
try:
    pd.merge(left, right, on='key', validate='one_to_one')
except Exception as e:
    print(type(e).__name__)   # MergeError
```

## 1.20.2 pd.merge_asof 近似匹配连接

`pd.merge_asof()` 用于键值不等时的最近匹配，常用于时间序列对齐，把每个左侧记录匹配到右侧时间最近（且不超过）的记录：

```python
left = pd.DataFrame({'时间': pd.to_datetime(['2024-01-01 10:00', '2024-01-01 10:30']),
                     '事件': ['A', 'B']})
right = pd.DataFrame({'时间': pd.to_datetime(['2024-01-01 09:59', '2024-01-01 10:29']),
                      '价格': [100, 105]})
print(pd.merge_asof(left, right, on='时间', direction='backward'))
```

`direction` 取值 `'backward'`（匹配不超过左侧的最近值，默认）、`'forward'`（匹配不小于左侧的最近值）、`'nearest'`（最近即可）。`tolerance` 限定最大时间差。

## 1.20.3 pd.merge_ordered 有序合并

`pd.merge_ordered()` 按有序键合并，保留两边的全部键值并填充缺失，常用于把不同频率的时间序列组合：

```python
left = pd.DataFrame({'日期': pd.to_datetime(['2024-01-01', '2024-01-03']), 'A': [1, 3]})
right = pd.DataFrame({'日期': pd.to_datetime(['2024-01-02', '2024-01-03']), 'B': [20, 30]})
print(pd.merge_ordered(left, right, on='日期', fill_method='ffill'))
```

`fill_method='ffill'` 把前向填充也一并完成，适合时间序列外连接后的补值。

## 1.20.4 pd.concat 参数详解

`pd.concat` 的完整参数：

| 参数 | 作用 |
| ---- | ---- |
| `axis` | 拼接方向，0 按行、1 按列 |
| `join` | `'outer'`（默认，保留全部）或 `'inner'`（只保留公共部分） |
| `ignore_index` | 重置行索引 |
| `keys` | 给各输入加分组标签，生成 MultiIndex |
| `levels` / `names` | 配合 keys 设置层级与名称 |
| `verify_integrity` | 校验结果索引是否唯一 |
| `sort` | 拼接时是否对索引排序 |

```python
df1 = pd.DataFrame({'A': [1, 2]})
df2 = pd.DataFrame({'A': [3, 4], 'B': [5, 6]})

print(pd.concat([df1, df2], join='inner'))   # 只保留公共列 A
print(pd.concat([df1, df2], ignore_index=True))
print(pd.concat([df1, df2], keys=['一', '二']))   # 生成 MultiIndex
print(pd.concat([df1, df2], axis=1))         # 横向拼接
```

`verify_integrity=True` 时若索引重复会抛异常，用于确认拼接结果索引唯一。

## 1.20.5 combine_first 与 combine

`.combine_first()` 用另一个对象填充缺失值，前面已介绍：

```python
s1 = pd.Series([1, None, 3])
s2 = pd.Series([None, 2, None])
print(s1.combine_first(s2))
# 0    1.0
# 1    2.0
# 2    3.0
```

`.combine()` 用函数逐元素组合两个对象，函数接收两个标量返回一个标量：

```python
df1 = pd.DataFrame({'A': [1, 2]})
df2 = pd.DataFrame({'A': [10, 20]})
print(df1.combine(df2, lambda a, b: a if a > b else b))   # 逐元素取较大值
```

## 1.20.6 连接方式的选择

选择合适的连接工具：键列连接用 `pd.merge`；按索引对齐用 `pd.join` 或 `merge(left_index=True)`；纵向堆叠或横向拼接用 `pd.concat`；时间最近匹配用 `pd.merge_asof`；有序键合并用 `pd.merge_ordered`；填充缺失用 `combine_first`。

## 练习题

### 第1题 概念理解

说明 `how` 五种取值的行为；说明 `suffixes` 与 `indicator` 各自解决什么问题。

::: details 参考答案

`inner` 保留两边匹配，`left` 保留左表全部，`right` 保留右表全部，`outer` 保留全部，`cross` 是笛卡尔积。`suffixes` 区分两边重名的列，`indicator` 标记每行来源用于排查连接问题。
:::

### 第2题 代码编写

创建两张表做 `inner`、`outer` 连接；用 `suffixes` 区分重名列；用 `indicator=True` 查看每行来源；用 `left_on`/`right_on` 处理不同名键。

::: details 参考答案

```python
import pandas as pd

left = pd.DataFrame({'key': ['a', 'b'], 'score': [90, 85]})
right = pd.DataFrame({'key': ['b', 'c'], 'score': [88, 92]})
print(pd.merge(left, right, on='key', how='inner'))
print(pd.merge(left, right, on='key', how='outer', suffixes=('_左', '_右'), indicator=True))

l2 = pd.DataFrame({'学号': [1, 2]})
r2 = pd.DataFrame({'编号': [1, 3]})
print(pd.merge(l2, r2, left_on='学号', right_on='编号'))
```

:::

### 第3题 进阶练习

用 `merge_asof` 把事件时间戳匹配到最近的报价；用 `merge_ordered` 合并不同频率的时间序列并前向填充；用 `concat(keys=...)` 生成 MultiIndex 并验证。

::: details 参考答案

```python
import pandas as pd

left = pd.DataFrame({'t': pd.to_datetime(['2024-01-01 10:00', '2024-01-01 10:30'])})
right = pd.DataFrame({'t': pd.to_datetime(['2024-01-01 09:59', '2024-01-01 10:29']),
                      'price': [100, 105]})
print(pd.merge_asof(left, right, on='t'))

l = pd.DataFrame({'d': pd.to_datetime(['2024-01-01', '2024-01-03']), 'A': [1, 3]})
r = pd.DataFrame({'d': pd.to_datetime(['2024-01-02', '2024-01-03']), 'B': [20, 30]})
print(pd.merge_ordered(l, r, on='d', fill_method='ffill'))

df1 = pd.DataFrame({'A': [1]})
df2 = pd.DataFrame({'A': [2]})
print(pd.concat([df1, df2], keys=['一', '二']))
```

:::

## 常见错误

**错误 1 · `merge` 报 `MergeError: No common columns to perform merge on`**

原因:两边没有任何共同列，也没有指定连接键。

解决:用 `on` 指定共同键，或用 `left_on`/`right_on` 分别指定。

**错误 2 · 合并后出现重复行或行数翻倍**

原因:连接键在某张表中有重复，多对多连接产生笛卡尔积。

解决:用 `validate='one_to_many'` 等校验规则在开发期发现问题，或用 `drop_duplicates` 清洗。

**错误 3 · 重名列被自动改成 `_x`/`_y` 导致后续出错**

原因:默认 `suffixes=('_x', '_y')` 会自动改名。

解决:用 `suffixes` 指定有意义的后缀，如 `('_左', '_右')`。

**错误 4 · `concat` 拼接后出现 NaN 列**

原因:`join='outer'` 保留两边全部列，列名不一致的列留空。

解决:需要公共列用 `join='inner'`，或先统一列名。
