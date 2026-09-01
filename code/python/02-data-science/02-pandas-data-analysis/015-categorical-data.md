---
title: 1.15 分类数据与有序分类
sidebar:
  order: 15
---
# 1.15 分类数据与有序分类

第 5 章和第 11 章都提到过 `category` 类型：它既能节省内存，又支持有序比较。分类数据在统计软件（如 R 的 factor）中很常见，适合表达性别、等级、地区这类取值有限的变量。本节完整讲解分类数据的创建、属性、操作方法，以及与分组聚合的配合，重点是**有序分类**带来的排序与比较能力。

## 1.15.1 创建分类数据

### pd.Categorical()

`pd.Categorical()` 直接创建分类对象：

```python
import pandas as pd

cat = pd.Categorical(['低', '中', '高', '中', '低'])
print(cat)
# ['低', '中', '高', '中', '低']
# Categories (3, object): ['中', '低', '高']
```

### dtype='category'

创建 Series 或 DataFrame 列时指定 `dtype='category'`：

```python
s = pd.Series(['低', '中', '高', '中'], dtype='category')
print(s.dtype)   # category
```

### 指定类别集合与顺序

`categories` 参数指定类别集合，`ordered=True` 声明有序：

```python
cat = pd.Categorical(['低', '高', '中'],
                     categories=['低', '中', '高'],
                     ordered=True)
print(cat.categories)   # Index(['低', '中', '高'], dtype='object')
print(cat.ordered)      # True
```

指定 `categories` 后，不在集合中的值会被置为 NaN。有序分类把类别定义为有明确大小关系的等级。

## 1.15.2 分类属性

`.cat` 访问器提供分类数据的属性：

```python
s = pd.Series(['低', '中', '高', '中'], dtype='category')
print(s.cat.categories)   # 类别集合
print(s.cat.ordered)      # 是否有序
print(s.cat.codes)        # 整数编码
# 0    0
# 1    1
# 2    2
# 3    1
```

`categories` 是全部可能的类别（去重排序），`ordered` 标明是否有序，`codes` 是每个元素在类别集合中的整数位置。`codes` 配合 `categories` 可以还原原始值。

## 1.15.3 分类方法

`.cat` 提供一组修改类别的方法，它们都返回新对象：

```python
s = pd.Series(['低', '中', '高'], dtype='category')

print(s.cat.add_categories(['极高']))             # 增加类别
print(s.cat.remove_categories(['高']))            # 移除类别（该值变 NaN）
print(s.cat.set_categories(['低', '中', '高', '极高']))  # 重设类别集合
print(s.cat.reorder_categories(['高', '中', '低']))      # 重排类别顺序
print(s.cat.as_ordered())                         # 转为有序
print(s.cat.as_unordered())                       # 转为无序
print(s.cat.rename_categories({'低': 'L', '中': 'M', '高': 'H'}))  # 重命名类别
```

各方法的作用：`add_categories` 追加新类别；`remove_categories` 删除类别，对应取值变为 NaN；`set_categories` 整体重设类别集合，不在新集合中的值变 NaN；`reorder_categories` 调整类别顺序（类别集合不变）；`as_ordered`/`as_unordered` 切换有序状态；`rename_categories` 用映射或列表重命名类别。

## 1.15.4 有序分类的比较与排序

有序分类支持大小比较，这是它相对于字符串的核心优势。无序分类只能判断相等，不能比较大小：

```python
s = pd.Series(['低', '中', '高'], dtype='category')
s_ordered = s.cat.reorder_categories(['低', '中', '高']).cat.as_ordered()

print(s_ordered > '低')
# 0    False
# 1     True
# 2     True
print(s_ordered < '高')
# 0     True
# 1     True
# 2    False

print(s_ordered.sort_values())
# 0    低
# 1    中
# 2    高
```

`sort_values()` 会按照类别顺序而非字典序排序。例如把等级从低到高排序时，分类顺序给出的结果符合业务直觉，而字符串排序会得到错误的字典序。

## 1.15.5 分类与分组

分类列与分组配合使用。按分类列分组时，即使某些类别没有数据，分组结果仍会保留全部类别：

```python
df = pd.DataFrame({'等级': pd.Categorical(['优', '良', '优'],
                                        categories=['优', '良', '中', '差']),
                   '分数': [90, 80, 95]})
print(df.groupby('等级', observed=False)['分数'].mean())
# 等级
# 优    92.5
# 良    80.0
# 中     NaN
# 差     NaN
```

`observed=False` 时保留所有声明的类别（含无数据的类别），`observed=True` 只保留实际出现的类别。有序分类分组后可以用 `sort_index()` 按业务顺序排列结果。

分类数据还常用于柱状图、箱线图的分组可视化，类别顺序决定图表中的展示顺序。

## 1.15.6 分类数据的运算

分类 Series 参与聚合时按类别处理，`value_counts` 默认只统计出现的类别，`dropna=False` 与 `observed=False` 组合可以统计全部类别：

```python
s = pd.Series(['优', '良', '优', '中'], dtype='category')
print(s.value_counts())
```

## 练习题

### 第1题 概念理解

说明有序分类与无序分类的区别；说明 `remove_categories` 移除类别后对应值变成什么。

::: details 参考答案

有序分类声明了类别间的大小关系，支持 `<`、`>` 比较与按类别顺序排序；无序分类只能判断相等。`remove_categories` 移除类别后，该类别对应的值变成 NaN。
:::

### 第2题 代码编写

创建一个有序分类 Series（低、中、高），比较其中元素是否高于"低"；用 `rename_categories` 重命名类别；用 `sort_values` 按类别顺序排序。

::: details 参考答案

```python
import pandas as pd

s = pd.Series(['低', '中', '高'], dtype='category')
s = s.cat.set_categories(['低', '中', '高']).cat.as_ordered()
print(s > '低')
print(s.cat.rename_categories({'低': 'L', '中': 'M', '高': 'H'}))
print(s.sort_values())
```

:::

### 第3题 进阶练习

创建含 `category` 列（含未出现的类别）的 DataFrame，用 `groupby(level='等级', observed=False)` 保留全部类别聚合；用 `add_categories` 与 `remove_categories` 观察值的变化。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'等级': pd.Categorical(['优', '良'], categories=['优', '良', '差']),
                   '分数': [90, 80]})
print(df.groupby('等级', observed=False)['分数'].mean())

s = pd.Series(['优', '良'], dtype='category')
print(s.cat.add_categories(['极差']))
print(s.cat.remove_categories(['良']))
```

:::

## 常见错误

**错误 1 · 无序分类做比较时报 `TypeError: Unordered Categoricals can only compare equality`**

原因:分类未声明有序,却用了 `<`、`>` 等大小比较。

解决:先 `.cat.as_ordered()` 或 `reorder_categories(...).cat.as_ordered()` 再比较。

**错误 2 · `remove_categories` 后数据神秘消失**

原因:移除类别时,该类别对应的取值全部变成 NaN,观察时以为数据丢了。

解决:移除前先确认受影响的范围,移除后按需 `fillna` 或重新归类。

**错误 3 · `set_categories` 后部分值变 NaN**

原因:重设的类别集合不包含某些原取值。

解决:确认新类别集合覆盖全部原取值,或接受并处理产生的缺失。

**错误 4 · 分组结果包含意料之外的 NaN 行**

原因:`observed=False` 保留了无数据的类别。

解决:用 `observed=True` 只保留实际出现的类别,或接受空类别用于对齐。
