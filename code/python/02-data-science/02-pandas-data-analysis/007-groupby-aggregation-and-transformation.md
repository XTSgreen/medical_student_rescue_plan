---
title: 1.7 分组聚合与转换
sidebar:
  order: 7
---
# 1.7 分组聚合与转换

第 6 章解决了数据形状的问题，但分析中还有一类高频需求：按某个类别把数据分成若干组，对每组分别计算统计量。例如按班级算平均分、按产品汇总销量、按月份统计总额。这正是分组（groupby）操作的用武之地。Pandas 的分组体系包含分组、聚合、转换、过滤、应用五个环节，本节系统讲解 `.groupby()` 及配套方法，这是 Pandas 分析能力的核心。

## 1.7.1 groupby 分组操作

### 按一列或多列分组

`.groupby()` 按指定列分组，返回 GroupBy 对象。GroupBy 对象本身不计算结果，需要配合聚合、变换等方法使用：

```python
import pandas as pd

df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '姓名': ['张三', '李四', '王五', '赵六'],
                   '成绩': [90, 85, 78, 92]})

grouped = df.groupby('班级')
print(grouped.mean())   # 每班的平均成绩
#       成绩
# 班级
# 甲   87.5
# 乙   85.0
```

按多列分组：

```python
df2 = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                    '性别': ['男', '女', '男', '女'],
                    '成绩': [90, 85, 78, 92]})
print(df2.groupby(['班级', '性别']).mean())
```

### 按索引级别分组

`level` 参数按索引层级分组，适用于 MultiIndex 数据：

```python
df3 = df2.set_index(['班级', '性别'])
print(df3.groupby(level='班级').mean())
```

### 按函数分组

`key` 可以是函数，作用于索引后按结果分组：

```python
s = pd.Series([1, 2, 3, 4, 5], index=['a1', 'a2', 'b1', 'b2', 'c1'])
print(s.groupby(lambda x: x[0]).mean())
# a    1.5
# b    3.5
# c    5.0
```

### 迭代分组

GroupBy 对象可迭代，每次得到 `(组名, 子组DataFrame)`：

```python
for name, group in df.groupby('班级'):
    print(name)
    print(group)
```

## 1.7.2 聚合方法

### .agg() / .aggregate()

`.agg()` 是聚合的统一入口，可以一次指定多个聚合函数：

```python
df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '成绩': [90, 85, 78, 92]})

print(df.groupby('班级').agg(['mean', 'max', 'min']))
print(df.groupby('班级').agg({'成绩': ['sum', 'count']}))   # 按列指定函数
```

### 内置聚合函数

聚合常用内置函数及其含义：

| 函数 | 含义 | 函数 | 含义 |
| ---- | ---- | ---- | ---- |
| `sum` | 求和 | `first` | 第一个值 |
| `mean` | 均值 | `last` | 最后一个值 |
| `median` | 中位数 | `nunique` | 唯一值个数 |
| `count` | 非空个数 | `any` | 是否存在 True |
| `size` | 组内行数（含缺失） | `all` | 是否全为 True |
| `min` | 最小值 | `std` | 标准差 |
| `max` | 最大值 | `var` | 方差 |
| `prod` | 乘积 | `sem` | 均值标准误 |
| `skew` | 偏度 | `kurt` | 峰度 |

```python
df.groupby('班级').size()      # 各组行数
df.groupby('班级').count()     # 各组非空值个数
df.groupby('班级').nunique()   # 各组唯一值个数
df.groupby('班级').first()     # 各组第一个值
```

### 自定义聚合函数

`.agg()` 可以接收自定义函数，函数接受一列 Series 并返回标量：

```python
def my_range(s):
    return s.max() - s.min()

print(df.groupby('班级').agg({'成绩': my_range}))
print(df.groupby('班级')['成绩'].agg(my_range))
```

## 1.7.3 .transform() 转换

`.transform()` 对每组计算结果并**广播**回原始形状，结果与输入行数相同，适合生成与原始行一一对应的新列：

```python
df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '成绩': [90, 85, 78, 92]})
df['班级均值'] = df.groupby('班级')['成绩'].transform('mean')
print(df)
#   班级  成绩  班级均值
# 0  甲  90    87.5
# 1  甲  85    87.5
# 2  乙  78    85.0
# 3  乙  92    85.0
```

`.transform()` 与 `.agg()` 的区别：聚合返回每组一行，变换返回与输入等长的结果。常用于生成"相对均值的偏离"这类逐行特征。

## 1.7.4 .filter() 按组筛选

GroupBy 的 `.filter()` 按整组的条件筛选，参数是返回布尔值的函数，决定该组是否保留：

```python
df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '成绩': [90, 60, 78, 92]})
# 只保留平均成绩大于 80 的组
print(df.groupby('班级').filter(lambda g: g['成绩'].mean() > 80))
```

`.filter()` 返回原始行，与数据选择中的 `.filter()` 不同，这里针对的是分组对象。

## 1.7.5 .apply() 任意函数

`.apply()` 对每组应用任意函数，函数可以返回标量、Series 或 DataFrame，自由度最高：

```python
print(df.groupby('班级').apply(lambda g: g['成绩'].mean()))
```

`.apply()` 是分组操作的万能接口，但灵活性也带来不确定性，能用聚合或变换表达的优先用聚合或变换。

## 1.7.6 .pipe() 管道

`.pipe()` 把分组对象传给外部函数，便于把复杂的分组逻辑抽成独立函数：

```python
def top_scores(grouped):
    return grouped.apply(lambda g: g.sort_values('成绩', ascending=False).head(1))

print(df.groupby('班级').pipe(top_scores))
```

## 1.7.7 分组选项

### as_index 参数

`.groupby(..., as_index=False)` 让分组键保留为普通列而不是成为索引：

```python
print(df.groupby('班级', as_index=False)['成绩'].mean())
#    班级    成绩
# 0  甲  75.0
# 1  乙  85.0
```

### 分组后排序

分组结果默认按组键排序，`sort=False` 保持原始出现顺序：

```python
df.groupby('班级', sort=False).mean()
```

### 分组后重采样

时间序列分组可以配合 `.resample()` 按时间段聚合，在第 8 章展开。

## 1.7.8 滚动窗口与扩展窗口

### .rolling()

`.rolling(window)` 生成滚动窗口对象，窗口沿时间或行滑动，逐窗口计算统计量。这是时间序列中计算移动平均的标准方式：

```python
s = pd.Series([1, 2, 3, 4, 5])
print(s.rolling(3).mean())
# 0    NaN
# 1    NaN
# 2    2.0
# 3    3.0
# 4    4.0
```

窗口为 3 时，前两个位置窗口未满得到 NaN。`.rolling()` 支持 `sum`、`mean`、`std`、`min`、`max` 等统计量。

### .expanding()

`.expanding()` 生成扩展窗口，窗口从开头一直扩展到当前位置，计算累积统计量：

```python
print(s.expanding().sum())
# 0     1.0
# 1     3.0
# 2     6.0
# 3    10.0
# 4    15.0
```

### .ewm()

`.ewm()` 指数加权移动，越近的数据权重越大：

```python
print(s.ewm(span=3).mean())
```

`.ewm()` 的参数 `span`、`alpha`、`com`、`halflife` 以不同方式描述衰减速度，第 10 章详细展开。

## 练习题

### 第1题 概念理解

说明 `.agg()`、`.transform()`、`.apply()` 三者返回形状的差异；说明聚合与变换各自适合什么场景。

::: details 参考答案

`.agg()` 返回每组一行，`.transform()` 返回与原始行数相同的广播结果，`.apply()` 返回取决于函数。聚合适合汇总统计，变换适合生成逐行特征，应用适合无法用前两者表达的任意逻辑。
:::

### 第2题 代码编写

创建包含班级、科目、成绩三列的数据，按班级和科目分组求平均分；用 `.agg()` 一次计算每组的总分、最大分、人数；用 `.transform()` 给每行加上班级平均分列。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '科目': ['语文', '数学', '语文', '数学'],
                   '成绩': [90, 85, 78, 92]})
print(df.groupby(['班级', '科目']).mean())
print(df.groupby('班级')['成绩'].agg(['sum', 'max', 'count']))
df['班级均分'] = df.groupby('班级')['成绩'].transform('mean')
print(df)
```

:::

### 第3题 进阶练习

用 `.filter()` 只保留平均成绩大于 80 的班级；用 `.apply()` 取每组成绩最高的一行；对时间序列 Series 用 `.rolling(3).mean()` 计算移动平均。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'班级': ['甲', '甲', '乙', '乙'],
                   '成绩': [90, 60, 78, 92]})
print(df.groupby('班级').filter(lambda g: g['成绩'].mean() > 80))
print(df.groupby('班级').apply(lambda g: g.nlargest(1, '成绩')))

s = pd.Series([1, 2, 3, 4, 5])
print(s.rolling(3).mean())
```

:::

## 常见错误

**错误 1 · 分组后调用 `.mean()` 结果里多了非预期列**

原因:`.groupby()` 默认对所有数值列计算聚合,非目标列也参与计算。

解决:先选列再聚合,如 `df.groupby('班级')['成绩'].mean()`。

**错误 2 · `.transform()` 报 `ValueError: Length of values does not match length of index`**

原因:把返回每组一行的 `.agg()` 函数误用在 `.transform()` 上,或自定义函数返回值长度不对。

解决:`.transform()` 中函数必须返回与输入等长的结果或标量。

**错误 3 · `.apply()` 结果结构不可预测**

原因:`.apply()` 允许函数返回任意结构,不同的返回类型会得到不同的结果形状。

解决:尽量用 `.agg()` 或 `.transform()`;确需 `.apply()` 时确保函数返回类型统一。

**错误 4 · `as_index=True` 时分组键进索引导致后续操作不便**

原因:默认分组键成为索引,后续 `reset_index` 或与其他列操作时容易出错。

解决:加 `as_index=False` 让分组键保留为普通列。
