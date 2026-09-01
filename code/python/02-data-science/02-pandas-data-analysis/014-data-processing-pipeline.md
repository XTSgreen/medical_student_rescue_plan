---
title: 1.14 数据处理管道
sidebar:
  order: 14
---
# 1.14 数据处理管道

前面各章的操作大多是单步完成的，但真实的数据处理流程由多个步骤组成：读取、清洗、转换、聚合、筛选。把这些步骤串起来有几种写法：反复赋值给中间变量、链式调用方法、用管道组织自定义函数。本节讲解 Pandas 的管道式编程，重点包括 `.pipe()` 方法链、`.assign()` 链式加列，以及 `.apply()`、`.applymap()`、`.map()`、`.agg()`、`.transform()` 等函数应用方式的区分与组合。

## 1.14.1 链式操作与中间变量

没有管道时，多步处理通常写成多个中间变量：

```python
import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3, 4], 'B': [5, 6, 7, 8]})
df1 = df.dropna()
df2 = df1[df1['A'] > 2]
df3 = df2.assign(C=df2['A'] + df2['B'])
print(df3)
```

链式写法把中间变量省掉，一个表达式完成：

```python
result = (df.dropna()
            .query('A > 2')
            .assign(C=lambda x: x['A'] + x['B']))
print(result)
```

链式写法的优势是代码紧凑、流程清晰，每步结果直接传给下一步。

## 1.14.2 .pipe() 方法链调用自定义函数

`.pipe()` 把整个链式对象作为参数传给自定义函数，适合把可复用的处理逻辑抽成函数。`.pipe()` 的语法：`df.pipe(func, 参数...)`，等价于 `func(df, 参数...)`：

```python
def 标准化(df, cols):
    out = df.copy()
    for c in cols:
        out[c] = (out[c] - out[c].mean()) / out[c].std()
    return out

df = pd.DataFrame({'A': [1, 2, 3], 'B': [10, 20, 30]})
result = df.pipe(标准化, cols=['A', 'B'])
print(result)
```

`.pipe()` 可以把不便于写成方法链的自定义逻辑嵌入管道。它返回函数处理后的对象，因此可以继续链式调用：

```python
result = (df
          .pipe(标准化, cols=['A'])
          .assign(C=1)
          .query('C == 1'))
```

`.pipe()` 与直接调用函数的区别在于它保持链式结构的统一，函数名作为管道中的一个环节，代码阅读顺序与处理顺序一致。

## 1.14.3 .assign() 链式添加列

`.assign()` 在前面已介绍，这里强调它在管道中的用法。`.assign()` 每次返回新对象，多个参数可以一次加多列；用 lambda 引用管道中的中间结果：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
result = (df
          .assign(和=lambda x: x['A'] + x['B'],
                  积=lambda x: x['A'] * x['B']))
print(result)
```

lambda 的 `x` 是 `.assign()` 调用时的 DataFrame，可以用它引用已经计算出的新列（按参数顺序）。

## 1.14.4 函数应用 .apply()

`.apply()` 沿指定轴应用函数。DataFrame 默认 `axis=0` 按列应用（函数接收每列 Series），`axis=1` 按行应用（函数接收每行 Series）：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
print(df.apply(lambda col: col.max(), axis=0))   # 每列最大值
print(df.apply(lambda row: row['A'] + row['B'], axis=1))  # 每行求和
```

Series 的 `.apply()` 对每个元素应用函数：

```python
s = pd.Series([1, 2, 3])
print(s.apply(lambda x: x * 10))
```

## 1.14.5 元素级函数 .applymap() 与 .map()

`.applymap()` 对 DataFrame 的每个元素应用函数（Pandas 2.1 起推荐 `.map()` 代替 `.applymap()`）：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
print(df.applymap(lambda x: x + 100))
print(df.map(lambda x: x * 2))     # Pandas 2.1+ 的推荐写法
```

`.map()` 对 Series 的每个元素应用函数或映射字典，是替换、变换单列的标准方式：

```python
s = pd.Series(['a', 'b', 'a'])
print(s.map({'a': '甲', 'b': '乙'}))   # 字典映射
print(s.map(lambda x: x.upper()))      # 函数变换
```

`.map()` 与 `.replace()` 的区别：`.map()` 只作用于 Series 且遇到未映射的值得到 NaN，`.replace()` 可以处理 DataFrame 且不匹配的值保持不变。

## 1.14.6 .agg() 与 .transform() 组合

`.agg()` 与 `.transform()` 也可以参与管道。`.agg()` 一次计算多个聚合，`.transform()` 返回与输入等长的广播结果：

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
print(df.agg(['sum', 'mean']))
print(df.transform(lambda x: x - x.mean()))
```

在管道中把 `.groupby()`、`.agg()`、`.transform()` 组合使用，可以完成"先分组统计，再广播回原表"的典型流程：

```python
df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'], '值': [1, 3, 10, 20]})
result = (df
          .assign(组均值=lambda x: x.groupby('组')['值'].transform('mean'),
                  偏离=lambda x: x['值'] - x['组均值']))
print(result)
```

## 1.14.7 完整管道示例

把本节的方法组合成一个完整的处理流程：读取数据、标准化数值列、按组聚合、筛选、加列：

```python
import pandas as pd

df = pd.DataFrame({'组': ['甲', '甲', '乙', '乙'],
                   '值1': [1, 2, 10, 20],
                   '值2': [3, 4, 30, 40]})

def 标准化(df, cols):
    out = df.copy()
    for c in cols:
        out[c] = (out[c] - out[c].mean()) / out[c].std()
    return out

result = (df
          .pipe(标准化, cols=['值1', '值2'])
          .groupby('组')
          .agg(均值=('值1', 'mean'), 总和=('值2', 'sum'))
          .reset_index()
          .query('均值 > 0'))
print(result)
```

## 练习题

### 第1题 概念理解

说明 `.apply()`、`.applymap()`、`.map()` 三者作用范围的差异；说明 `.pipe()` 与直接调用自定义函数的区别。

::: details 参考答案

`.apply()` 沿轴应用（按列或按行，函数接收 Series），`.applymap()` 对 DataFrame 每个元素应用，`.map()` 对 Series 每个元素应用。`.pipe()` 把链式对象传给自定义函数并保持链式结构，直接调用则打断管道。
:::

### 第2题 代码编写

创建 DataFrame，用链式写法完成：筛选值大于 0 的行、用 `.assign` 添加计算列、用 `.apply(axis=1)` 计算每行两列之和。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'A': [1, -2, 3], 'B': [4, 5, -6]})
result = (df
          .query('A > 0')
          .assign(C=lambda x: x['A'] + x['B'])
          .apply(lambda row: row['C'] * 2, axis=1))
print(result)
```

:::

### 第3题 进阶练习

把"标准化 + 分组聚合 + 筛选"封装成管道，用 `.pipe()` 接入自定义函数；用 `.map()` 通过字典把分类值映射成中文标签；用 `.agg` 一次计算总和与均值。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'组': ['a', 'a', 'b'], '值': [1, 3, 10]})

def 标准化(df, cols):
    out = df.copy()
    for c in cols:
        out[c] = (out[c] - out[c].mean()) / out[c].std()
    return out

print(df.pipe(标准化, cols=['值']))

print(df['组'].map({'a': '甲', 'b': '乙'}))
print(df['值'].agg(['sum', 'mean']))
```

:::

## 常见错误

**错误 1 · 链式调用后结果不是期望的 DataFrame**

原因:链中某一步返回了 Series（如单列选择）或聚合结果，后续方法不再适用。

解决:确认每一步的返回类型，用 `df[['列']]` 保持二维，或在该步后 `reset_index()`。

**错误 2 · `.apply()` 报 `ValueError: No axis named 1 for object type Series`**

原因:对 Series 调用了 `axis=1`，Series 只有一个轴。

解决:Series 的 `.apply()` 不加 `axis` 参数；`axis=1` 只用于 DataFrame。

**错误 3 · `.map()` 遇到未映射的值变成 NaN**

原因:字典映射时未覆盖的值默认得到 NaN。

解决:确认字典覆盖所有取值，或用 `na_action`/`.replace()` 处理。

**错误 4 · `.assign()` 中用已定义变量而非 lambda 时报错或结果错误**

原因:`.assign(C=df['A'] + df['B'])` 引用的是管道外的原 df，而非链式中间结果。

解决:使用 lambda 引用管道中的当前对象，如 `.assign(C=lambda x: x['A'] + x['B'])`。
