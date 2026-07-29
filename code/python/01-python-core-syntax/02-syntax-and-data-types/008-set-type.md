---
title: 2.8 集合类型
sidebar:
  order: 8
---
# 2.8 集合类型

<span class="chapter-tag">Python核心语法基础</span>

医学数据处理中经常遇到去重和判断属于两类问题：从一份检验报告里挑出所有异常项目、判断某位患者的主诉是否属于预设的症状清单、找出两组病人中共同服用的药物。这些场景的核心都是元素的唯一性与成员关系，Python 的集合（set）类型正是为此设计。集合是无序、可变、不可重复的容器，本节将从字面量、特性、方法、运算符到推导式逐一讲解，并介绍不可变版本 frozenset。

## 2.8.1 集合字面量与空集

集合的字面量写法是用花括号包裹若干元素，元素之间用逗号分隔：

```python
symptoms = {"发热", "咳嗽", "乏力"}
print(symptoms)         # {'发热', '咳嗽', '乏力'}
print(type(symptoms))   # <class 'set'>
```

注意空集合不能用 `{}` 表示，因为 `{}` 在 Python 中被解释为空字典。创建空集合必须用 `set()` 内置函数：

```python
empty_set = set()
print(type(empty_set))  # <class 'set'>

empty_dict = {}
print(type(empty_dict)) # <class 'dict'>
```

这是初学者常踩的坑。要记住一条规则：**字面量 `{}` 永远是字典，集合要么用 `{...}` 写非空内容，要么用 `set()` 写空集**。也可以用 `set(iterable)` 把任何可迭代对象转成集合，自动去重：

```python
diagnoses = ["J00", "J00", "J01", "J02", "J01"]
unique_dx = set(diagnoses)
print(unique_dx)  # {'J00', 'J01', 'J02'}
```

这种列表转集合的去重手法在处理重复录入的临床数据时极其常用。

## 2.8.2 无序、可变、不可重复

集合有三个核心特性。第一是**无序**，集合中的元素没有先后顺序，每次遍历顺序可能不同，也不支持按索引访问。第二是**可变**，可以增删元素。第三是**不可重复**，重复添加同一个元素只会保留一份。

```python
s = {"A", "B", "C"}
s.add("A")  # 已存在，无效果
print(s)    # {'A', 'B', 'C'}，顺序可能变化
print(s[0]) # TypeError: 'set' object is not subscriptable
```

无序意味着集合适合做是否属于和交集并集这类数学运算，不适合需要保留顺序的场景。如果既要去重又要保持原顺序，可以用 `dict.fromkeys()` 配合列表：

```python
data = ["J00", "J00", "J01", "J02", "J01"]
ordered_unique = list(dict.fromkeys(data))
print(ordered_unique)  # ['J00', 'J01', 'J02']
```

## 2.8.3 元素必须可哈希

集合内部用哈希表存储元素，因此元素必须可哈希，也就是必须是不可变类型。数字、字符串、元组可以加入集合，列表、字典、集合本身不可加入。

```python
ok = {1, "J00", (1, 2)}
print(ok)  # {1, 'J00', (1, 2)}
```

```python
bad = {[1, 2]}  # TypeError: unhashable type: 'list'
```

如果需要把一组元组存入集合做去重（比如一堆"（科室，床号）"组合），元组本身可哈希，可以直接用。如果要存更复杂的结构，可以先转成元组或字符串再存。这一限制与字典的键要求一致，背后原理相同。

## 2.8.4 集合长度

`len()` 返回集合中元素的数量：

```python
allergies = {"青霉素", "头孢", "磺胺"}
print(len(allergies))  # 3
```

判断集合是否为空可以用 `len(s) == 0`，更 Pythonic 的写法是 `if not s:`，因为空集合在布尔上下文中为 False。

## 2.8.5 成员检查 O(1)

`in` 和 `not in` 用于判断元素是否在集合中。集合的成员检查是 **O(1)** 时间复杂度，与集合大小无关，这是集合相对于列表的最大优势。列表的 `in` 是 O(n)，要逐个比较。

```python
known_genes = {"BRCA1", "BRCA2", "TP53", "EGFR"}

print("TP53" in known_genes)      # True
print("KRAS" not in known_genes)  # True
```

处理大规模基因列表或患者 ID 时，这一差异极其显著。在十万个基因中判断某个基因是否已知，用集合几乎瞬时完成，用列表则要慢上千倍。如果同一份数据要反复做成员检查，应该先把列表转成集合：

```python
gene_list = [...]  # 假设有 10 万个基因
gene_set = set(gene_list)  # 预处理一次

# 后续判断都是 O(1)
if target_gene in gene_set:
    print("已知基因")
```

这种空间换时间的思路在生信分析中随处可见。

## 2.8.6 集合方法

集合的方法可以分为增加、删除、集合运算、关系判断几类。

### 增加元素

`add(elem)` 向集合中添加单个元素，如果已存在则无操作。`update(iterable)` 把可迭代对象中的所有元素加入集合，相当于对每个元素调用 `add`，可以一次加入多个元素。

```python
meds = {"aspirin", "metformin"}
meds.add("atorvastatin")
print(meds)  # {'aspirin', 'metformin', 'atorvastatin'}

meds.update(["omeprazole", "aspirin"])  # aspirin 重复
print(meds)  # {'aspirin', 'metformin', 'atorvastatin', 'omeprazole'}
```

### 删除元素

`remove(elem)` 删除指定元素，元素不存在时抛 **KeyError**。`discard(elem)` 同样删除元素，但不存在时静默返回，不报错。`pop()` 随机移除并返回一个元素，空集合调用抛 KeyError。`clear()` 清空集合。

```python
allergies = {"青霉素", "头孢", "磺胺"}

allergies.discard("海鲜")  # 不存在也不报错
allergies.remove("头孢")   # 删除"头孢"
print(allergies)           # {'青霉素', '磺胺'}

removed = allergies.pop()  # 随机弹出一个
print(removed)

allergies.clear()
print(allergies)  # set()
```

实际编程中 `discard()` 比 `remove()` 更常用，因为后者要求元素必定存在，处理用户输入时这一假设往往不成立。

### 集合运算（返回新集合）

`union(other)` 返回并集，`intersection(other)` 返回交集，`difference(other)` 返回差集（在原集合中但不在 other 中），`symmetric_difference(other)` 返回对称差集（只出现在其中一个集合中的元素）。这些方法都不修改原集合，而是返回新集合。

```python
group_a = {"aspirin", "metformin", "atorvastatin"}
group_b = {"metformin", "omeprazole", "aspirin"}

print(group_a.union(group_b))                # 所有药物
print(group_a.intersection(group_b))         # {'aspirin', 'metformin'}，两组都在用的
print(group_a.difference(group_b))           # {'atorvastatin'}，只有 A 组用的
print(group_a.symmetric_difference(group_b)) # {'atorvastatin', 'omeprazole'}，只一组用的
```

临床药物相互作用分析、基因列表对比、患者群体重叠统计都离不开这几种运算。方法的参数可以是任意可迭代对象，不必是另一个集合：`group_a.intersection(["aspirin", "warfarin"])` 也合法。

### 关系判断

`issubset(other)` 判断当前集合是否是 other 的子集，`issuperset(other)` 判断是否是 other 的超集，`isdisjoint(other)` 判断两集合是否没有交集。

```python
core_vitals = {"hr", "spo2", "temp"}
full_vitals = {"hr", "spo2", "temp", "bp", "rr"}

print(core_vitals.issubset(full_vitals))   # True，核心体征是完整体征的子集
print(full_vitals.issuperset(core_vitals)) # True
print(core_vitals.isdisjoint({"lab"}))     # True，无交集
```

这类判断在做数据完整性校验时很有用，比如检查当前采集的生命体征是否覆盖了必需的核心项。

## 2.8.7 集合运算符

除了方法形式，集合运算也支持运算符写法，更简洁。`|` 是并集，`&` 是交集，`-` 是差集，`^` 是对称差集。

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)  # {1, 2, 3, 4, 5, 6}，并集
print(a & b)  # {3, 4}，交集
print(a - b)  # {1, 2}，差集
print(a ^ b)  # {1, 2, 5, 6}，对称差集
```

运算符与方法形式的区别在于：运算符要求两边都是集合，方法可以接受任意可迭代对象。比如 `a & [3, 4]` 会报错，但 `a.intersection([3, 4])` 可以。另外还有原地运算符 `|=`、`&=`、`-=`、`^=`，对应原地修改集合，等价于 `update`、`intersection_update` 等方法。

```python
a = {1, 2, 3}
a |= {3, 4, 5}
print(a)  # {1, 2, 3, 4, 5}
```

## 2.8.8 集合推导式

集合推导式用 `{expr for item in iterable if condition}` 的语法生成集合，自动去重。与列表推导式相比，区别在括号是花括号而非方括号，且结果无序。

```python
# 从病历文本中提取所有诊断编码并去重
records = ["J00 J01", "J01 J02", "J00 J02 J03"]
all_codes = {code for record in records for code in record.split()}
print(all_codes)  # {'J00', 'J01', 'J02', 'J03'}
```

集合推导式也支持 `if` 过滤，下面这条只保留以 J 开头的编码：

```python
j_codes = {code for record in records for code in record.split() if code.startswith("J")}
print(j_codes)  # {'J00', 'J01', 'J02', 'J03'}
```

注意区分集合推导式与字典推导式：`{x: x for x in [1, 2]}` 是字典推导式（有冒号），`{x for x in [1, 2]}` 是集合推导式（无冒号）。空花括号 `{}` 仍是字典，没有空集合推导式这种写法，要生成空集合只能用 `set()`。

## 2.8.9 冻结集合 frozenset

`frozenset` 是集合的不可变版本，一旦创建不能增删元素。因为不可变所以可哈希，可以作为字典的键或集合的元素。普通 set 不能作为字典键或集合元素，因为它自身可变。

```python
fs = frozenset({"BRCA1", "TP53", "EGFR"})
# fs.add("KRAS")  # AttributeError: 'frozenset' object has no attribute 'add'

# 可以作为字典键
gene_panels = {
    frozenset({"BRCA1", "BRCA2"}): "乳腺癌 panel",
    frozenset({"EGFR", "KRAS", "BRAF"}): "肺癌 panel"
}
query = frozenset({"BRCA1", "BRCA2"})
print(gene_panels[query])  # 乳腺癌 panel
```

frozenset 支持 `union`、`intersection` 等所有只读集合运算，结果仍是 frozenset。它适合表达基因 panel 的标准组合、必检项目清单这类一旦确定就不再变化的概念。把 frozenset 作为字典键，可以用整个集合快速查表，这在基因 panel 比对、症状组合识别等场景非常实用。

```python
panel_a = frozenset({"BRCA1", "BRCA2", "TP53"})
panel_b = frozenset({"TP53", "EGFR", "KRAS"})
common = panel_a & panel_b  # frozenset({'TP53'})
print(common)
```

::: note 集合与列表的选择
当任务只关心是否存在或重叠部分，集合几乎是唯一选择；当任务关心顺序、允许重复或需要按下标访问时，列表更合适。临床药物清单如果只用来查是否在用，用集合；如果按给药顺序展示，用列表。两类容器常配合使用，列表保序、集合快速查询。
:::
