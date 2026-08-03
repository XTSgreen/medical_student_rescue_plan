---
title: 2.8 集合类型
sidebar:
  order: 8
---
# 2.8 集合类型

数据处理中经常遇到去重和判断属于两类问题：从一份日志里挑出所有异常项目、判断某位用户的操作是否属于预设的权限清单、找出两组用户中共同所属的分组。这些场景的核心都是元素的唯一性与成员关系，Python 的集合（set）类型是为此设计。集合是无序、可变、不可重复的容器，本节将从字面量、特性、方法、运算符到推导式逐一讲解，并介绍不可变版本 frozenset。

## 2.8.1 集合字面量与空集

集合的字面量写法是用花括号包裹若干元素，元素之间用逗号分隔：

```python
tags = {"vip", "new", "active"}
print(tags)         # {'vip', 'new', 'active'}
print(type(tags))   # <class 'set'>
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
codes = ["A001", "A001", "A002", "A003", "A002"]
unique_codes = set(codes)
print(unique_codes)  # {'A001', 'A002', 'A003'}
```

这种列表转集合的去重手法在处理重复录入的数据时极其常用。

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
data = ["A001", "A001", "A002", "A003", "A002"]
ordered_unique = list(dict.fromkeys(data))
print(ordered_unique)  # ['A001', 'A002', 'A003']
```

## 2.8.3 元素必须可哈希

集合内部用哈希表存储元素，因此元素必须可哈希，也就是必须是不可变类型。数字、字符串、元组可以加入集合，列表、字典、集合本身不可加入。

```python
ok = {1, "A001", (1, 2)}
print(ok)  # {1, 'A001', (1, 2)}
```

```python
bad = {[1, 2]}  # TypeError: unhashable type: 'list'
```

如果需要把一组元组存入集合做去重（比如一堆"（模块，编号）"组合），元组本身可哈希，可以直接用。如果要存更复杂的结构，可以先转成元组或字符串再存。这一限制与字典的键要求一致，背后原理相同。

## 2.8.4 集合长度

`len()` 返回集合中元素的数量：

```python
tags = {"vip", "new", "active"}
print(len(tags))  # 3
```

判断集合是否为空可以用 `len(s) == 0`，更 Pythonic 的写法是 `if not s:`，因为空集合在布尔上下文中为 False。

## 2.8.5 成员检查 O(1)

`in` 和 `not in` 用于判断元素是否在集合中。集合的成员检查是 **O(1)** 时间复杂度，与集合大小无关，这是集合相对于列表的主要优势。列表的 `in` 是 O(n)，要逐个比较。

```python
known_users = {"U001", "U002", "U003", "U004"}

print("U003" in known_users)      # True
print("U009" not in known_users)  # True
```

处理大规模 ID 列表或用户 ID 时，这一差异极其显著。在十万个 ID 中判断某个 ID 是否存在，用集合几乎瞬时完成，用列表则要慢上千倍。如果同一份数据要反复做成员检查，应该先把列表转成集合：

```python
id_list = [...]  # 假设有 10 万个 ID
id_set = set(id_list)  # 预处理一次

# 后续判断都是 O(1)
if target_id in id_set:
    print("ID 已存在")
```

这种空间换时间的思路在实际开发中随处可见。

## 2.8.6 集合方法

集合的方法可以分为增加、删除、集合运算、关系判断几类。

### 增加元素

`add(elem)` 向集合中添加单个元素，如果已存在则无操作。`update(iterable)` 把可迭代对象中的所有元素加入集合，相当于对每个元素调用 `add`，可以一次加入多个元素。

```python
tags = {"vip", "new"}
tags.add("active")
print(tags)  # {'vip', 'new', 'active'}

tags.update(["premium", "vip"])  # vip 重复
print(tags)  # {'vip', 'new', 'active', 'premium'}
```

### 删除元素

`remove(elem)` 删除指定元素，元素不存在时抛 **KeyError**。`discard(elem)` 同样删除元素，但不存在时静默返回，不报错。`pop()` 随机移除并返回一个元素，空集合调用抛 KeyError。`clear()` 清空集合。

```python
tags = {"vip", "new", "active"}

tags.discard("premium")  # 不存在也不报错
tags.remove("new")   # 删除"new"
print(tags)           # {'vip', 'active'}

removed = tags.pop()  # 随机弹出一个
print(removed)

tags.clear()
print(tags)  # set()
```

实际编程中 `discard()` 比 `remove()` 更常用，因为后者要求元素必定存在，处理用户输入时这一假设往往不成立。

### 集合运算（返回新集合）

`union(other)` 返回并集，`intersection(other)` 返回交集，`difference(other)` 返回差集（在原集合中但不在 other 中），`symmetric_difference(other)` 返回对称差集（只出现在其中一个集合中的元素）。这些方法都不修改原集合，而是返回新集合。

```python
group_a = {"vip", "new", "active"}
group_b = {"new", "premium", "vip"}

print(group_a.union(group_b))                # 所有标签
print(group_a.intersection(group_b))         # {'vip', 'new'}，两组都有的
print(group_a.difference(group_b))           # {'active'}，只有 A 组有的
print(group_a.symmetric_difference(group_b)) # {'active', 'premium'}，只一组有的
```

标签交集分析、ID 列表对比、用户群体重叠统计都离不开这几种运算。方法的参数可以是任意可迭代对象，不必是另一个集合：`group_a.intersection(["vip", "premium"])` 也合法。

### 关系判断

`issubset(other)` 判断当前集合是否是 other 的子集，`issuperset(other)` 判断是否是 other 的超集，`isdisjoint(other)` 判断两集合是否没有交集。

```python
core_fields = {"name", "age", "email"}
full_fields = {"name", "age", "email", "phone", "address"}

print(core_fields.issubset(full_fields))   # True，核心字段是完整字段的子集
print(full_fields.issuperset(core_fields)) # True
print(core_fields.isdisjoint({"salary"}))     # True，无交集
```

这类判断在做数据完整性校验时很有用，比如检查当前采集的字段是否覆盖了必需的核心项。

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
# 从日志文本中提取所有编码并去重
records = ["A001 A002", "A002 A003", "A001 A003 A004"]
all_codes = {code for record in records for code in record.split()}
print(all_codes)  # {'A001', 'A002', 'A003', 'A004'}
```

集合推导式也支持 `if` 过滤，下面这条只保留以 A 开头的编码：

```python
a_codes = {code for record in records for code in record.split() if code.startswith("A")}
print(a_codes)  # {'A001', 'A002', 'A003', 'A004'}
```

注意区分集合推导式与字典推导式：`{x: x for x in [1, 2]}` 是字典推导式（有冒号），`{x for x in [1, 2]}` 是集合推导式（无冒号）。空花括号 `{}` 仍是字典，没有空集合推导式这种写法，要生成空集合只能用 `set()`。

## 2.8.9 冻结集合 frozenset

`frozenset` 是集合的不可变版本，一旦创建不能增删元素。因为不可变所以可哈希，可以作为字典的键或集合的元素。普通 set 不能作为字典键或集合元素，因为它自身可变。

```python
fs = frozenset({"K001", "K003", "K004"})
# fs.add("K009")  # AttributeError: 'frozenset' object has no attribute 'add'

# 可以作为字典键
panels = {
    frozenset({"K001", "K002"}): "基础套餐",
    frozenset({"K004", "K009", "K010"}): "高级套餐"
}
query = frozenset({"K001", "K002"})
print(panels[query])  # 基础套餐
```

frozenset 支持 `union`、`intersection` 等所有只读集合运算，结果仍是 frozenset。它适合表达配置项的标准组合、必填字段清单这类一旦确定就不再变化的概念。把 frozenset 作为字典键，可以用整个集合快速查表，这在配置比对、标签组合识别等场景非常实用。

```python
set_a = frozenset({"K001", "K002", "K003"})
set_b = frozenset({"K003", "K004", "K005"})
common = set_a & set_b  # frozenset({'K003'})
print(common)
```

::: note 集合与列表的选择
当任务只关心是否存在或重叠部分，集合几乎是唯一选择；当任务关心顺序、允许重复或需要按下标访问时，列表更合适。购物清单如果只用来查是否在购物车，用集合；如果按加入顺序展示，用列表。两类容器常配合使用，列表保序、集合快速查询。
:::

## 练习题

### 第1题 概念理解

阅读下面的代码，写出输出结果，并解释为什么空集合不能用 `{}` 表示。

```python
a = {}
b = set()
print(type(a))
print(type(b))

codes = ["A001", "A001", "A002", "A003", "A002"]
unique = set(codes)
print(unique)
print("A001" in unique)
```

::: details 参考答案
```python
print(type(a))  # <class 'dict'>
print(type(b))  # <class 'set'>
print(unique)   # {'A001', 'A002', 'A003'}，顺序可能不同
print("A001" in unique)  # True
```

`{}` 在 Python 中被解释为空字典，不是空集合。创建空集合必须用 `set()` 内置函数。非空集合可以用 `{...}` 写法，元素之间用逗号分隔。`set()` 还可以把任何可迭代对象转成集合，自动去重，所以 `set(codes)` 把含重复项的列表变成了唯一编码集合。集合的成员检查是 O(1) 操作，比列表快得多。
:::

### 第2题 代码编写
有两组用户的权限标签，A 组为 `{"read", "write", "delete"}`，B 组为 `{"read", "share", "comment"}`。用集合运算求出两组共有的权限、A 组独有的权限、两组所有的权限，以及只在一组中出现的权限。

::: details 参考答案
```python
group_a = {"read", "write", "delete"}
group_b = {"read", "share", "comment"}

# 交集：两组共有的权限
common = group_a & group_b
print(f"共有权限: {common}")  # {'read'}

# 差集：A 组独有的权限
only_a = group_a - group_b
print(f"A 组独有: {only_a}")  # {'write', 'delete'}

# 并集：所有权限
all_perms = group_a | group_b
print(f"所有权限: {all_perms}")  # {'read', 'write', 'delete', 'share', 'comment'}

# 对称差集：只在一组中出现的权限
exclusive = group_a ^ group_b
print(f"独占权限: {exclusive}")  # {'write', 'delete', 'share', 'comment'}
```

集合运算符 `&` 交集、`-` 差集、`|` 并集、`^` 对称差集，比调用方法形式更简洁。运算符要求两边都是集合，方法形式可以接受任意可迭代对象。这些运算在标签分析、权限对比、用户群体重叠统计等场景中非常常用。
:::

### 第3题 进阶
从一份日志文本中提取所有不重复的项目编码。日志内容为 `["A001 A002", "A002 A003", "A001 A003 A004"]`，用集合推导式提取所有编码并去重，再判断编码 `A005` 是否在结果中。

::: details 参考答案
```python
logs = ["A001 A002", "A002 A003", "A001 A003 A004"]

# 集合推导式提取并去重
all_codes = {code for log in logs for code in log.split()}
print(all_codes)  # {'A001', 'A002', 'A003', 'A004'}

# 判断编码是否存在
print("A003" in all_codes)  # True
print("A005" in all_codes)  # False

# 统计不重复编码数量
print(f"不重复编码数: {len(all_codes)}")  # 4
```

集合推导式 `{code for log in logs for code in log.split()}` 用了两层循环，外层遍历每条日志，内层用 `split()` 把日志拆成单词。花括号语法自动去重，无需额外处理。注意区分集合推导式和字典推导式：有冒号是字典，无冒号是集合。
:::

### 第4题 项目实践
在一个任务管理程序中，用 `frozenset` 表示固定的任务权限组合，并作为字典的键来查找对应的角色模板。定义两个权限组合 `{"create", "edit"}` 和 `{"create", "edit", "delete", "assign"}`，分别对应 `编辑者` 和 `管理员`。编写代码通过构造 `frozenset` 查询角色。

::: details 参考答案
```python
# 用 frozenset 作为字典键
role_templates = {
    frozenset({"create", "edit"}): "编辑者",
    frozenset({"create", "edit", "delete", "assign"}): "管理员",
}

# 查询角色
query1 = frozenset({"edit", "create"})  # 顺序无关
print(role_templates.get(query1, "未知角色"))  # 编辑者

query2 = frozenset({"create", "edit", "delete", "assign"})
print(role_templates.get(query2, "未知角色"))  # 管理员

query3 = frozenset({"read"})
print(role_templates.get(query3, "未知角色"))  # 未知角色
```

普通 `set` 是可变类型，不可哈希，不能作为字典的键。`frozenset` 是集合的不可变版本，一旦创建不能增删元素，因此可哈希，可以作为字典键或集合元素。用 `frozenset` 作键的好处是查询时与元素顺序无关，只要权限组合相同就能匹配。这适合配置比对、标签组合识别等场景。
:::

## 常见错误

**错误 1 · `{}` 创建的是空字典，不是空集合**

```python
empty = {}
print(type(empty))  # <class 'dict'>
```

原因:`{}` 在 Python 中被解释为空字典，因为字典比集合更早出现且使用更频繁。用 `{}` 期望得到空集合是初学者常踩的坑，代码不会报错但行为完全错误，后续调用集合方法时会抛 `AttributeError`。

解决:创建空集合用 `set()` 内置函数。非空集合可以用 `{1, 2, 3}` 字面量写法。判断变量是否为空集合用 `if not s:`，与空字典、空列表的判断方式一致。

**错误 2 · `TypeError: unhashable type: 'list'`**

```python
s = {[1, 2], [3, 4]}  # TypeError
d = {frozenset({1, 2}): "a"}  # 正确
```

原因:集合的元素必须可哈希，列表、字典、集合本身都是可变类型，不可哈希，强行加入会抛 `TypeError`。集合内部用哈希表存储元素，要求元素哈希值在生命周期内不变。

解决:存入集合前把可变对象转成不可变类型，例如用元组替代列表 `{(1, 2), (3, 4)}`，用 `frozenset` 替代 `set`。元组可哈希的前提是其所有元素都可哈希，含可变元素的元组同样不可哈希。

**错误 3 · `KeyError` from `set.remove()`**

```python
s = {"a", "b", "c"}
s.remove("d")  # KeyError: 'd'
```

原因:`remove(elem)` 删除不存在的元素会抛 `KeyError`，与字典访问不存在的键行为类似。这与 `discard()` 不同，`discard()` 删除不存在元素时静默返回。

解决:元素可能不存在时用 `discard(elem)`，它不会报错。明确知道元素存在时才用 `remove()`，让异常暴露逻辑错误。或先 `if elem in s:` 判断再 `remove()`，但 `discard()` 更简洁。

**错误 4 · `TypeError: unsupported operand type(s) for &: 'set' and 'list'`**

```python
a = {1, 2, 3}
b = [2, 3, 4]
print(a & b)  # TypeError
print(a.intersection(b))  # 正确，返回 {2, 3}
```

原因:集合运算符 `&`、`|`、`-`、`^` 要求两边都是集合，传列表、元组等可迭代对象会抛 `TypeError`。方法形式 `intersection()`、`union()` 等可以接受任意可迭代对象，内部会自动转换。

解决:用运算符时确保两边都是集合，先把可迭代对象 `set(b)` 转成集合。需要与列表、元组等做集合运算时用方法形式 `a.intersection(b)`、`a.union(b)`，更灵活。
