---
title: 1.6 数据转换与变形
sidebar:
  order: 6
---
# 1.6 数据转换与变形

第 5 章完成了数据清洗，数据质量合格后，往往还需要把数据改成适合分析的形状：重命名标签、增删列、调整行序、把宽表变长表、把长表变宽表、把多张表合并成一张。Pandas 的变形与合并操作非常丰富，掌握它们才能自由组织数据结构。本节按操作类型分组讲解轴标签操作、列增删、排序排名、数据展开、透视与重塑、合并与连接。

## 1.6.1 轴标签操作

### 重命名 .rename()

`.rename()` 重命名行索引或列名，前面章节已接触，这里补充映射用法：

```python
import pandas as pd

df = pd.DataFrame({'old1': [1, 2], 'old2': [3, 4]}, index=['a', 'b'])
df2 = df.rename(columns={'old1': 'new1', 'old2': 'new2'}, index={'a': 'A'})
```

### 重置索引 .reset_index()

`.reset_index()` 把索引变成普通列：

```python
df = pd.DataFrame({'A': [10, 20]}, index=['x', 'y'])
print(df.reset_index())
#   index   A
# 0     x  10
# 1     y  20
```

`drop=True` 时丢弃原索引不保留为列。

### 设置新索引 .set_index()

`.set_index()` 把指定列设为索引，可以一次设置多列（形成 MultiIndex）：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4], 'C': [5, 6]})
print(df.set_index(['A', 'B']))
```

## 1.6.2 列添加与修改

### 直接赋值

直接给新列名赋值就添加列，赋值的对象可以是标量、列表或 Series：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
df['C'] = 0                  # 标量，广播到每行
df['D'] = df['A'] + df['B']  # 由已有列计算
```

### .assign() 链式添加

`.assign()` 返回新对象并添加列，适合链式操作，不影响原 DataFrame：

```python
df2 = df.assign(E=df['A'] * 10, F=lambda x: x['A'] + x['B'])
```

`.assign()` 支持用 lambda 引用刚生成的对象，实现一步计算多列。

## 1.6.3 删除列与行

### .drop()

`.drop()` 按标签删除行或列：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4], 'C': [5, 6]})
print(df.drop('B', axis=1))        # 删除列
print(df.drop(0, axis=0))          # 删除行
print(df.drop(['A', 'B'], axis=1)) # 删除多列
```

`axis=0` 删行、`axis=1` 删列，`errors='ignore'` 时忽略不存在的标签。

### .pop()

`.pop()` 删除指定列并返回该列内容：

```python
col = df.pop('C')
print(col)    # 0 5 / 1 6
print(df)     # C 列已被移除
```

### .insert()

`.insert()` 在指定位置插入新列：

```python
df.insert(1, 'X', [10, 20])   # 在第 1 个位置插入 X 列
```

## 1.6.4 列顺序与索引调整

### .reindex()

`.reindex()` 按给定标签顺序重新排列行或列，缺失的标签位置生成 NaN：

```python
df = pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])
print(df.reindex(['c', 'a', 'b']))
print(df.reindex(['a', 'x', 'b']))
# a    1.0
# x    NaN
# b    2.0
```

`.reindex_like()` 按照另一个 DataFrame 的索引和列重排：

```python
df2 = df.reindex_like(pd.DataFrame(index=['c', 'b', 'a']))
```

## 1.6.5 转置、排序与排名

### 转置 .T

`.T` 交换行列，前面已介绍：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
print(df.T)
#    0  1
# A  1  2
# B  3  4
```

### 排序 .sort_values()

`.sort_values()` 按一列或多列的值排序：

```python
df = pd.DataFrame({'A': [3, 1, 2], 'B': [30, 10, 20]})
print(df.sort_values('A'))                    # 按 A 升序
print(df.sort_values('A', ascending=False))   # 按 A 降序
print(df.sort_values(['A', 'B']))             # 先 A 后 B
```

### 排名 .rank()

`.rank()` 计算每个值的排名，`method` 控制并列处理方式：

```python
s = pd.Series([10, 20, 20, 40])
print(s.rank())
# 0    1.0
# 1    2.5
# 2    2.5
# 3    4.0
```

`method='min'` 并列取最小排名，`method='average'`（默认）取平均，`method='first'` 按先后顺序。

## 1.6.6 数据展开 .explode()

`.explode()` 把一列中的列表元素拆成多行，其余列自动重复：

```python
df = pd.DataFrame({'组': ['A', 'B'], '成员': [['张三', '李四'], ['王五']]})
print(df.explode('成员'))
#   组   成员
# 0  A   张三
# 0  A   李四
# 1  B   王五
```

`.explode()` 常用于把 JSON 数组、标签列表展开成行级数据。

## 1.6.7 数据透视与重塑

### pivot 与 pivot_table

`.pivot()` 把长表转成宽表，用一列的值作新列名、一列的值作索引、一列的值填单元格。数据无重复时用 `.pivot()`：

```python
df = pd.DataFrame({'日期': ['周一', '周一', '周二'],
                   '产品': ['甲', '乙', '甲'],
                   '销量': [10, 20, 15]})
print(df.pivot(index='日期', columns='产品', values='销量'))
# 产品   甲    乙
# 日期
# 周一  10.0  20.0
# 周二  15.0   NaN
```

数据有重复时 `.pivot()` 会报错，改用 `.pivot_table()` 并指定聚合函数：

```python
df2 = pd.DataFrame({'日期': ['周一', '周一', '周一'],
                    '产品': ['甲', '甲', '乙'],
                    '销量': [10, 5, 20]})
print(df2.pivot_table(index='日期', columns='产品', values='销量', aggfunc='sum'))
```

`.pivot_table()` 是透视表的完整实现，`aggfunc` 指定聚合方式（默认 mean），`fill_value` 填充 NaN，`margins=True` 添加合计。

### melt 与 wide_to_long

`.melt()` 把宽表转成长表，是多列合并成一列的标准方式：

```python
df = pd.DataFrame({'姓名': ['张三', '李四'],
                   '语文': [90, 85], '数学': [88, 92]})
print(df.melt(id_vars='姓名', value_vars=['语文', '数学'], var_name='科目', value_name='分数'))
#    姓名  科目  分数
# 0  张三  语文  90
# 1  李四  语文  85
# 2  张三  数学  88
# 3  李四  数学  92
```

`id_vars` 是保持不变的标识列，`value_vars` 是要堆叠的列，`var_name`、`value_name` 命名新列。`.wide_to_long()` 处理列名带前后缀的宽表，例如 `分数_语文`、`分数_数学` 这样的命名。

### stack 与 unstack

`.stack()` 把最内层列索引转成行索引（列转行），`.unstack()` 把行索引转成列索引（行转列），是 MultiIndex 数据转形的核心工具：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]}, index=['x', 'y'])
print(df.stack())
# x  A    1
#    B    3
# y  A    2
#    B    4
print(df.stack().unstack())
#     A  B
# x   1  3
# y   2  4
```

### crosstab

`pd.crosstab()` 交叉表已在第 2 章介绍，用于统计两分类变量的组合频数。

## 1.6.8 合并与连接

### pd.merge()

`pd.merge()` 按公共列或索引连接两张表，是数据库式连接。`how` 指定连接类型，`on` 指定连接键：

```python
left = pd.DataFrame({'id': [1, 2, 3], '姓名': ['张三', '李四', '王五']})
right = pd.DataFrame({'id': [1, 2, 4], '成绩': [90, 85, 70]})

print(pd.merge(left, right, on='id'))                     # 内连接，只保留匹配的行
print(pd.merge(left, right, on='id', how='left'))         # 左连接
print(pd.merge(left, right, on='id', how='right'))        # 右连接
print(pd.merge(left, right, on='id', how='outer'))        # 外连接
```

`how` 四种取值：`'inner'` 内连接只保留两边都匹配的行，`'left'` 保留左表所有行、右表缺失填 NaN，`'right'` 保留右表所有行，`'outer'` 保留两表所有行。键列名不同时用 `left_on`、`right_on` 分别指定。

### pd.join()

`pd.join()` 基于索引连接，是把两张表按行索引对齐的便捷方式：

```python
left = pd.DataFrame({'A': [1, 2]}, index=['x', 'y'])
right = pd.DataFrame({'B': [3, 4]}, index=['x', 'z'])
print(left.join(right))
#    A    B
# x  1  3.0
# y  2  NaN
# z  NaN 4.0
```

### pd.concat()

`pd.concat()` 沿轴拼接多个 DataFrame，默认按行拼接（axis=0）：

```python
df1 = pd.DataFrame({'A': [1, 2]})
df2 = pd.DataFrame({'A': [3, 4]})
print(pd.concat([df1, df2]))            # 纵向拼接
print(pd.concat([df1, df2], axis=1))    # 横向拼接
```

`ignore_index=True` 重置行索引，`keys` 参数给拼接结果添加分组标签，`join='inner'` 只保留公共列。

### combine 与 combine_first

`.combine_first()` 用另一个对象填充缺失值：

```python
s1 = pd.Series([1, None, 3])
s2 = pd.Series([None, 2, None])
print(s1.combine_first(s2))
# 0    1.0
# 1    2.0
# 2    3.0
```

`.combine()` 用函数逐元素组合两个对象，`.update()` 用另一个对象的值覆盖当前位置（原地修改）：

```python
df1 = pd.DataFrame({'A': [1, 2]})
df2 = pd.DataFrame({'A': [10, 20]})
df1.update(df2)   # 原地更新，df1 的 A 列变为 [10, 20]
```

## 练习题

### 第1题 概念理解

说明 `.pivot()` 与 `.melt()` 各自把数据从什么形状转成什么形状；说明 `pd.merge` 与 `pd.concat` 的区别。

::: details 参考答案

`.pivot()` 把长表转宽表（列转行值展开），`.melt()` 把宽表转长表（多列堆叠）。`pd.merge` 按连接键做数据库式连接，`pd.concat` 沿轴拼接，前者重在关联两张表，后者重在堆叠两张表。
:::

### 第2题 代码编写

创建两张表，用 `pd.merge` 做左连接和外连接；把一张宽表用 `.melt()` 转成长表；再用 `.pivot_table()` 聚合有重复数据的长表。

::: details 参考答案

```python
import pandas as pd

left = pd.DataFrame({'id': [1, 2], 'name': ['a', 'b']})
right = pd.DataFrame({'id': [1, 3], 'score': [90, 70]})
print(pd.merge(left, right, on='id', how='left'))
print(pd.merge(left, right, on='id', how='outer'))

wide = pd.DataFrame({'name': ['x'], 'math': [88], 'english': [92]})
print(wide.melt(id_vars='name', var_name='subject', value_name='score'))
```

:::

### 第3题 进阶练习

用 `.explode()` 展开列表列；用 `.stack()`/`.unstack()` 完成一次行列转换并验证还原；用 `.concat` 拼接两张表并重置索引。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'g': ['A', 'B'], 'm': [['a', 'b'], ['c']]})
print(df.explode('m'))

df2 = pd.DataFrame({'X': [1, 2], 'Y': [3, 4]}, index=['p', 'q'])
print(df2.stack().unstack())

a = pd.DataFrame({'v': [1]})
b = pd.DataFrame({'v': [2]})
print(pd.concat([a, b], ignore_index=True))
```

:::

## 常见错误

**错误 1 · `.pivot()` 报 `ValueError: Index contains duplicate entries`**

原因:透视后单元格对应多行数据,`pivot` 无法决定取哪个值。

解决:改用 `.pivot_table()` 并指定 `aggfunc` 聚合重复值。

**错误 2 · `.drop()` 默认删行而不是删列**

原因:`.drop('A')` 默认 `axis=0` 按行索引删除。

解决:删列时显式写 `axis=1`。

**错误 3 · `pd.merge` 后出现大量 NaN**

原因:连接键不匹配或连接类型选错(内连接会把不匹配的行丢弃,外连接会产生 NaN)。

解决:检查两表的键列取值是否一致;不确定时先用 `how='outer'` 查看全貌。

**错误 4 · `.concat` 拼接结果出现 NaN 列**

原因:两张表列名不完全一致,`concat` 默认 `join='outer'` 会保留所有列。

解决:只保留公共列用 `join='inner'`,或先统一列名。
