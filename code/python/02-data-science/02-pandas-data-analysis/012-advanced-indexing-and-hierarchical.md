---
title: 1.12 高级索引与层次化
sidebar:
  order: 12
---
# 1.12 高级索引与层次化

第 3 章掌握了单层索引的选择，但真实数据经常需要多级维度：按"年份+月份"、按"班级+科目"组织数据。Pandas 用 MultiIndex（层次化索引）表达这种多层结构，它把多个层级的标签组合成一个索引。MultiIndex 支持多层选择、层级交换、层级聚合、堆叠与展开。本节系统讲解 MultiIndex 的创建、属性、选择与操作。

## 1.12.1 MultiIndex 的概念

MultiIndex 是多层级的索引对象。一个带两层的 MultiIndex 可以这样理解：外层是第一个维度，内层是第二个维度，每个数据点由两个标签共同定位：

```python
import pandas as pd

idx = pd.MultiIndex.from_tuples([('甲', '语文'), ('甲', '数学'),
                                 ('乙', '语文'), ('乙', '数学')])
df = pd.DataFrame({'成绩': [90, 85, 78, 92]}, index=idx)
print(df)
#        成绩
# 甲 语文  90
#   数学  85
# 乙 语文  78
#   数学  92
```

## 1.12.2 创建 MultiIndex

### from_arrays()

`pd.MultiIndex.from_arrays()` 从多个数组创建，数组对应各层级的标签：

```python
idx = pd.MultiIndex.from_arrays([['甲', '甲', '乙', '乙'],
                                 ['语文', '数学', '语文', '数学']])
```

### from_tuples()

`pd.MultiIndex.from_tuples()` 从元组列表创建，每个元组是各层级的一个组合：

```python
idx = pd.MultiIndex.from_tuples([('甲', '语文'), ('甲', '数学'),
                                 ('乙', '语文'), ('乙', '数学')])
```

### from_product()

`pd.MultiIndex.from_product()` 从多个列表的笛卡尔积创建，生成所有组合：

```python
idx = pd.MultiIndex.from_product([['甲', '乙'], ['语文', '数学']])
```

### from_frame()

`pd.MultiIndex.from_frame()` 从 DataFrame 的列创建：

```python
frame = pd.DataFrame({'班级': ['甲', '甲', '乙'], '科目': ['语文', '数学', '语文']})
idx = pd.MultiIndex.from_frame(frame)
```

## 1.12.3 MultiIndex 的属性

`.levels`、`.codes`、`.names` 是 MultiIndex 的三个核心属性：

```python
idx = pd.MultiIndex.from_product([['甲', '乙'], ['语文', '数学']], names=['班级', '科目'])
print(idx.levels)
# FrozenList([['甲', '乙'], ['语文', '数学']])
print(idx.codes)
# FrozenList([[0, 0, 1, 1], [0, 1, 0, 1]])
print(idx.names)
# FrozenList(['班级', '科目'])
```

`levels` 是每层去重后的标签列表，`codes` 是每个位置在对应层中的整数编码，`names` 是各层级的名称。实际使用时 `.nlevels` 查看层级数，`.get_level_values('班级')` 取出某一层的值。

## 1.12.4 .loc[] 多层选择

MultiIndex 的 `.loc[]` 支持按层级的元组或部分层级选择。按完整元组选一行：

```python
df = pd.DataFrame({'成绩': [90, 85, 78, 92]},
                  index=pd.MultiIndex.from_product([['甲', '乙'], ['语文', '数学']],
                                                  names=['班级', '科目']))
print(df.loc[('甲', '语文')])   # 完整元组
print(df.loc['甲'])            # 只选外层
print(df.loc['甲', '数学'])    # 元组简写
```

部分层级选择返回仍带剩余层级的子 DataFrame。用冒号表示某一层全部：

```python
print(df.loc['甲', :])
print(df.loc[:, '语文'])
```

## 1.12.5 pd.IndexSlice 切片

多层索引的切片需要同时指定各层范围，`pd.IndexSlice` 让多层切片更清晰：

```python
idx = pd.IndexSlice
print(df.loc[idx['甲':'乙', '语文':'数学'], :])
```

`IndexSlice` 可以配合冒号与列表构造复杂切片，是多层数据切片的标准工具。

## 1.12.6 交换层级 .swaplevel()

`.swaplevel()` 交换两个层级的顺序：

```python
df2 = df.swaplevel('班级', '科目')
print(df2)
#        成绩
# 科目 班级
# 语文 甲    90
# 数学 甲    85
# 语文 乙    78
# 数学 乙    92
```

交换层级后通常配合 `.sort_index()` 重新排序，让相邻标签相邻。

## 1.12.7 排序 .sort_index()

`.sort_index(level=...)` 可以只排序某一层：

```python
print(df.sort_index())                       # 按所有层级排序
print(df.sort_index(level='科目'))           # 只按科目层排序
```

`ascending` 可以传入列表对各层分别指定升序降序。

## 1.12.8 按层级分组 groupby(level=...)

`.groupby(level=...)` 按指定层级分组聚合：

```python
print(df.groupby(level='班级').mean())
#       成绩
# 班级
# 甲   87.5
# 乙   85.0

print(df.groupby(level='科目').sum())
```

也可以按多层分组：`df.groupby(level=['班级', '科目']).sum()`。

## 1.12.9 多列层次化

`set_index(['列1', '列2'])` 可以创建基于多列的 MultiIndex，`reset_index()` 反向恢复：

```python
df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '科目': ['语文', '数学', '语文', '数学'],
                   '成绩': [90, 85, 78, 92]})
df2 = df.set_index(['班级', '科目'])
print(df2)
print(df2.reset_index())
```

## 1.12.10 堆叠与展开 stack / unstack

`.stack()` 把最内层列索引转成行索引（宽表变长表），`.unstack()` 把行索引的最内层转成列索引（长表变宽表），是 MultiIndex 转形的核心工具：

```python
df = pd.DataFrame({'成绩': [90, 85, 78, 92]},
                  index=pd.MultiIndex.from_product([['甲', '乙'], ['语文', '数学']],
                                                  names=['班级', '科目']))

print(df.unstack())   # 科目层转到列
#       成绩
# 科目  语文  数学
# 班级
# 甲    90    85
# 乙    78    92

print(df.unstack().stack())   # 还原
```

`.unstack(level=...)` 指定展开哪一层，`.stack(level=...)` 同理。`fill_value` 参数在展开出现缺失时填充。

## 练习题

### 第1题 概念理解

说明 `from_arrays`、`from_tuples`、`from_product` 三种创建 MultiIndex 方式的差异；说明 `levels` 与 `codes` 的含义。

::: details 参考答案

`from_arrays` 从各层的数组创建，`from_tuples` 从元组列表创建（逐条指定组合），`from_product` 从多列表的笛卡尔积创建（所有组合）。`levels` 是各层去重标签，`codes` 是每个位置在各层的整数编码。
:::

### 第2题 代码编写

用 `from_product` 创建"班级 x 科目"的 MultiIndex 并构建 DataFrame；用 `.loc` 取出某班所有科目；用 `groupby(level='班级')` 求平均成绩。

::: details 参考答案

```python
import pandas as pd

idx = pd.MultiIndex.from_product([['甲', '乙'], ['语文', '数学']], names=['班级', '科目'])
df = pd.DataFrame({'成绩': [90, 85, 78, 92]}, index=idx)
print(df.loc['甲'])
print(df.groupby(level='班级').mean())
```

:::

### 第3题 进阶练习

把包含班级、科目、成绩的普通 DataFrame 用 `set_index` 转成 MultiIndex，再用 `unstack` 把科目转成列，观察缺失位置；用 `swaplevel` 交换层级并排序；用 `IndexSlice` 做多层切片。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'班级': ['甲', '甲', '乙'],
                   '科目': ['语文', '数学', '语文'],
                   '成绩': [90, 85, 78]})
df2 = df.set_index(['班级', '科目'])
print(df2.unstack())
print(df2.swaplevel().sort_index())

idx = pd.IndexSlice
print(df2.loc[idx['甲':'乙', '语文':'数学'], :])
```

:::

## 常见错误

**错误 1 · `.loc['甲']` 报 `KeyError`**

原因:多层索引下用单层标签选择,但外层没有该标签,或写成 `df.loc['甲', :]` 时第二层写错。

解决:确认标签值存在于对应层级,可用 `df.index.get_level_values(0)` 查看。

**错误 2 · 多层切片报 `UnsortedIndexError`**

原因:`.loc` 做多层范围切片要求索引已排序。

解决:先 `sort_index()` 再切片,或改用 `pd.IndexSlice`。

**错误 3 · `unstack` 后出现 NaN**

原因:某些层级组合在数据中不存在,转成列后对应位置为空。

解决:用 `fill_value=0` 参数填充,或按需 `dropna()`。

**错误 4 · `groupby(level=...)` 报层级不存在**

原因:索引不是 MultiIndex,或层级名写错。

解决:用 `df.index.names` 查看层级名,或用整数层级 `groupby(level=0)`。
