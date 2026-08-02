---
title: 4.6 集合类型专题
sidebar:
  order: 6
---
# 4.6 集合类型（Set）专题


集合是 Python 中表达无序、唯一元素集合的容器，核心能力是去重和成员判断，以及并集、交集、差集等数学运算。本节对集合做系统梳理，从字面量与空集、元素约束、增删方法、集合运算、就地更新运算符、子集超集判断，一直讲到推导式、冻结集合 frozenset 和底层哈希机制。每个知识点都配以代码示例，帮助你在面对去重、交集对比、权限判断等任务时准确选用集合操作。

## 定义与基础特性

### 4.6.1 集合字面量定义

集合的字面量写法是用花括号包裹若干元素，元素之间用逗号分隔。集合中的元素可以是不同类型，只要满足可哈希要求即可。

```python
tags = {"vip", "new", "active"}
print(tags)         # {'vip', 'new', 'active'}
print(type(tags))   # <class 'set'>
```

需要特别注意，空花括号 `{}` 在 Python 中被解释为空字典而非空集合。这是初学者常踩的坑，要记住字面量 `{}` 永远是字典。

```python
empty = {}
print(type(empty))  # <class 'dict'>
```

也可以用 `set(iterable)` 把任何可迭代对象转成集合，过程中自动去重。

```python
codes = ["A001", "A001", "A002", "A003", "A002"]
unique = set(codes)
print(unique)  # {'A001', 'A002', 'A003'}
```

### 4.6.2 空集合必须使用 set()

因为 `{}` 被字典占用，创建空集合只能用 `set()` 内置函数无参数调用。这是集合与字典在字面量上的唯一冲突点。

```python
empty_set = set()
print(type(empty_set))  # <class 'set'>
print(empty_set)        # set()
```

判断一个集合是否为空可以用 `len(s) == 0`，更 Pythonic 的写法是 `if not s:`，因为空集合在布尔上下文中为 False。

```python
s = set()
if not s:
    print("集合为空")  # 集合为空
```

### 4.6.3 集合元素必须可哈希

集合内部用哈希表存储元素，因此元素必须可哈希，也就是必须是不可变类型。数字、字符串、元组可以加入集合，列表、字典、集合本身不可加入，强行使用会抛出 TypeError。

```python
ok = {1, "A001", (1, 2)}
print(ok)  # {1, 'A001', (1, 2)}
```

```python
bad = {[1, 2]}  # TypeError: unhashable type: 'list'
```

如果需要把一组元组存入集合做去重，元组本身可哈希可以直接用。如果要存更复杂的结构，可以先转成元组或字符串再存。这一限制与字典的键要求一致，背后原理相同。

### 4.6.4 集合元素唯一性

集合中的元素不可重复，重复添加同一个元素只会保留一份。这一特性让集合天然适合去重任务。

```python
s = {1, 2, 2, 3, 3, 3}
print(s)  # {1, 2, 3}

s.add(1)
print(s)  # {1, 2, 3}，已存在无效果
```

从列表去重是集合最常见的应用之一。一行 `set(data)` 就能拿到所有唯一元素。

```python
logs = ["INFO", "WARN", "INFO", "ERROR", "WARN", "INFO"]
levels = set(logs)
print(levels)  # {'INFO', 'WARN', 'ERROR'}
```

### 4.6.5 集合无序性

集合中的元素没有先后顺序，每次遍历顺序可能不同，也不支持按索引访问。尝试用下标访问会抛出 TypeError。

```python
s = {"a", "b", "c"}
print(s[0])  # TypeError: 'set' object is not subscriptable
```

无序意味着集合适合做是否存在和交集并集这类运算，不适合需要保留顺序的场景。如果既要去重又要保持原顺序，可以用 `dict.fromkeys()` 配合列表。

```python
data = ["A001", "A001", "A002", "A003", "A002"]
ordered_unique = list(dict.fromkeys(data))
print(ordered_unique)  # ['A001', 'A002', 'A003']
```

## 增删元素

### 4.6.6 集合添加元素 add

`add(element)` 向集合中添加单个元素，如果元素已存在则无任何效果。添加操作是 O(1) 平均时间复杂度。

```python
tags = {"vip", "new"}
tags.add("active")
print(tags)  # {'vip', 'new', 'active'}

tags.add("vip")  # 已存在，集合不变
print(tags)  # {'vip', 'new', 'active'}
```

`add` 接收单个元素，传入可迭代对象会被当作一个整体。比如 `add([1, 2])` 会因为列表不可哈希而报错，而不是把 1 和 2 分别加入。

### 4.6.7 集合批量添加 update

`update(iterable)` 把可迭代对象中的所有元素加入集合，相当于对每个元素调用 `add`，可以一次加入多个元素。参数可以是列表、元组、字符串、另一个集合等任意可迭代对象。

```python
tags = {"vip", "new"}
tags.update(["premium", "vip", "trial"])
print(tags)  # {'vip', 'new', 'premium', 'trial'}

tags.update("ab")  # 字符串按字符拆分
print(tags)  # {'vip', 'new', 'premium', 'trial', 'a', 'b'}
```

`update` 可以同时接收多个可迭代对象，全部合并进来。

```python
s = {1, 2}
s.update([3, 4], {5, 6})
print(s)  # {1, 2, 3, 4, 5, 6}
```

### 4.6.8 集合按值删除元素 remove

`remove(element)` 删除指定元素，元素不存在时抛出 KeyError。这一方法要求调用者确信元素存在。

```python
tags = {"vip", "new", "active"}
tags.remove("new")
print(tags)  # {'vip', 'active'}

tags.remove("premium")  # KeyError: 'premium'
```

处理用户输入或外部数据时，元素是否存在往往不可预知，这种情况下用下一小节的 `discard()` 更安全。

### 4.6.9 集合安全删除元素 discard

`discard(element)` 同样删除指定元素，但元素不存在时静默返回，不报错。这是集合删除中最稳妥的方法，不需要预先检查。

```python
tags = {"vip", "new", "active"}
tags.discard("new")
print(tags)  # {'vip', 'active'}

tags.discard("premium")  # 不存在也不报错
print(tags)  # {'vip', 'active'}
```

实际编程中 `discard()` 比 `remove()` 更常用，因为后者要求元素必定存在的假设在很多场景下不成立。选择标准很简单：确定元素存在用 `remove`，不确定就用 `discard`。

### 4.6.10 集合弹出任意元素 pop

`pop()` 随机移除并返回一个元素。由于集合无序，弹出的是哪个元素不可预知。空集合调用会抛出 KeyError。

```python
s = {10, 20, 30}
removed = s.pop()
print(removed)  # 可能是 10、20 或 30 中的任意一个
print(s)        # 剩余两个元素
```

`pop` 适合逐个消费集合元素直到清空的场景，但不能依赖弹出的具体值。如果需要按某种确定性顺序处理元素，应先对集合排序。

```python
s = {3, 1, 2}
ordered = sorted(s)
while ordered:
    print(ordered.pop(0))  # 1, 2, 3
```

### 4.6.11 集合清空 clear

`clear()` 删除集合中所有元素，使其变为空集合。这是原地操作，不返回值。

```python
tags = {"vip", "new", "active"}
tags.clear()
print(tags)  # set()
```

与 `pop` 逐个删除相比，`clear` 一次性释放，效率更高。如果有多个变量指向同一个集合，`clear` 会让所有引用都看到空集合。

## 集合运算（返回新集合）

### 4.6.12 集合并集

`union(other)` 返回当前集合与参数集合的并集，包含所有出现过的元素。这些方法不修改原集合，而是返回新集合。参数可以是任意可迭代对象，不必是另一个集合。

```python
group_a = {"vip", "new", "active"}
group_b = {"new", "premium", "trial"}

print(group_a.union(group_b))  # {'vip', 'new', 'active', 'premium', 'trial'}
print(group_a)  # {'vip', 'new', 'active'}，原集合不变
```

并集对应数学上的并集运算，合并多个来源的标签或 ID 时经常用到。`union` 可以接收多个参数一次性合并多个集合。

```python
print(group_a.union(group_b, {"beta", "test"}))
```

### 4.6.13 集合交集

`intersection(other)` 返回两个集合都包含的元素，即交集。参数同样可以是任意可迭代对象。

```python
group_a = {"vip", "new", "active"}
group_b = {"new", "premium", "vip"}

print(group_a.intersection(group_b))  # {'vip', 'new'}
```

交集运算在找出两个群体共同拥有的成员时非常直观。比如找出两个权限组的共有权限、两个用户列表的重叠用户。

### 4.6.14 集合差集

`difference(other)` 返回在当前集合中但不在参数集合中的元素，即差集。

```python
group_a = {"vip", "new", "active"}
group_b = {"new", "premium", "vip"}

print(group_a.difference(group_b))  # {'active'}，只有 A 组有的
print(group_b.difference(group_a))  # {'premium'}，只有 B 组有的
```

差集是单向的，`a.difference(b)` 和 `b.difference(a)` 结果不同。它常用于找出某一方独有的元素，比如当前在线用户中不在白名单内的用户。

### 4.6.15 集合对称差集

`symmetric_difference(other)` 返回只出现在其中一个集合中的元素，也就是两者并集减去交集，等价于去掉共有的部分。

```python
group_a = {"vip", "new", "active"}
group_b = {"new", "premium", "vip"}

print(group_a.symmetric_difference(group_b))  # {'active', 'premium'}，仅一组有的
```

对称差集回答的是哪些元素只属于其中一方的问题。比如比较两份配置的差异，找出哪些配置项只在一方出现。

## 就地更新运算

### 4.6.16 集合就地更新并集

`update(other)` 或 `|=` 运算符把参数集合的元素并入当前集合，原地修改，等价于并集的就地版本。

```python
s = {1, 2, 3}
s |= {3, 4, 5}
print(s)  # {1, 2, 3, 4, 5}

s.update({6, 7})
print(s)  # {1, 2, 3, 4, 5, 6, 7}
```

`update` 方法和 `|=` 运算符功能相同。区别在于 `update` 可以接收任意可迭代对象，而 `|=` 要求右侧也是集合。

### 4.6.17 集合就地更新交集

`intersection_update(other)` 或 `&=` 运算符把当前集合更新为与参数集合的交集，只保留两者共有的元素。

```python
s = {1, 2, 3, 4}
s &= {2, 4, 6}
print(s)  # {2, 4}

s.intersection_update([4, 8])  # 可以接收列表
print(s)  # {4}
```

这一操作适合逐步收紧筛选条件，每一步只保留与新增约束匹配的元素。

### 4.6.18 集合就地更新差集

`difference_update(other)` 或 `-=` 运算符从当前集合中移除参数集合包含的元素，原地修改。

```python
s = {1, 2, 3, 4, 5}
s -= {2, 4}
print(s)  # {1, 3, 5}

s.difference_update([1, 6])
print(s)  # {3, 5}
```

与 `difference` 返回新集合不同，`difference_update` 直接修改原集合，没有返回值。需要保留原集合时用前者，需要高效修改时用后者。

### 4.6.19 集合就地更新对称差集

`symmetric_difference_update(other)` 或 `^=` 运算符把当前集合更新为与参数集合的对称差集，只保留只出现在其中一方的元素。

```python
s = {1, 2, 3}
s ^= {2, 3, 4}
print(s)  # {1, 4}
```

这一操作适合在差异同步场景使用，比如把两份配置的差异部分提取出来。同样地，`^=` 要求右侧是集合，而方法形式可以接收任意可迭代对象。

## 关系判断

### 4.6.20 集合子集判断

`issubset(other)` 判断当前集合是否是参数集合的子集，即当前集合的所有元素是否都在参数集合中。也可以用 `<=` 运算符。

```python
core = {"read", "write"}
full = {"read", "write", "delete", "admin"}

print(core.issubset(full))  # True
print(core <= full)         # True
print(full.issubset(core))  # False
```

子集判断在做数据完整性校验时很有用，比如检查当前采集的字段是否覆盖了必需的核心项。

### 4.6.21 集合真子集判断

`<` 运算符判断当前集合是否是参数集合的真子集，即子集且两集合不相等。注意 `issubset` 没有对应的真子集方法名，只能用运算符。

```python
core = {"read", "write"}
full = {"read", "write", "delete"}

print(core < full)        # True，core 是 full 的真子集
print(core < {"read", "write"})  # False，相等不是真子集
```

真子集要求当前集合严格小于参数集合。区分子集和真子集在数学意义上很重要，实际开发中用得相对少。

### 4.6.22 集合超集判断

`issuperset(other)` 判断当前集合是否是参数集合的超集，即参数集合的所有元素是否都在当前集合中。也可以用 `>=` 运算符。

```python
full = {"read", "write", "delete", "admin"}
core = {"read", "write"}

print(full.issuperset(core))  # True
print(full >= core)           # True
```

超集是子集的反向判断。`a.issuperset(b)` 等价于 `b.issubset(a)`，选择哪个看哪个更符合阅读直觉。

### 4.6.23 集合真超集判断

`>` 运算符判断当前集合是否是参数集合的真超集，即超集且两集合不相等。

```python
full = {"read", "write", "delete"}
core = {"read", "write"}

print(full > core)                # True
print(full > {"read", "write", "delete"})  # False，相等不是真超集
```

真超集要求当前集合严格大于参数集合。与真子集一样，实际使用频率较低，但在严格的包含关系判断中需要用到。

### 4.6.24 集合无交集判断

`isdisjoint(other)` 判断两个集合是否没有交集，即是否不存在任何共同元素。这一方法没有对应的运算符。

```python
a = {"read", "write"}
b = {"delete", "admin"}

print(a.isdisjoint(b))  # True，没有共同元素

c = {"read", "admin"}
print(a.isdisjoint(c))  # False，都有 read
```

`isdisjoint` 在检查两类事物是否完全互斥时很方便，比如判断两个权限组是否有重叠、两个标签集合是否互斥。注意 `isdisjoint` 的参数可以是任意可迭代对象。

## 推导式与冻结集合

### 4.6.25 集合推导式

集合推导式用 `{expr for item in iterable if condition}` 的语法生成集合，自动去重。与列表推导式相比，区别在括号是花括号而非方括号，且结果无序。

```python
records = ["A001 A002", "A002 A003", "A001 A003 A004"]
all_codes = {code for record in records for code in record.split()}
print(all_codes)  # {'A001', 'A002', 'A003', 'A004'}
```

集合推导式也支持 `if` 过滤。下面只保留以 A 开头的编码。

```python
a_codes = {code for record in records for code in record.split() if code.startswith("A")}
print(a_codes)  # {'A001', 'A002', 'A003', 'A004'}
```

::: note 区分三种推导式
`[x for x in ...]` 是列表推导式（方括号），`{x for x in ...}` 是集合推导式（花括号无冒号），`{x: x for x in ...}` 是字典推导式（花括号有冒号）。空花括号 `{}` 仍是字典，没有空集合推导式这种写法，要生成空集合只能用 `set()`。
:::

### 4.6.26 冻结集合 frozenset

`frozenset` 是集合的不可变版本，一旦创建不能增删元素。因为不可变所以可哈希，可以作为字典的键或集合的元素。普通 set 不能作为字典键或集合元素，因为它自身可变。

```python
fs = frozenset({"K001", "K002", "K003"})
# fs.add("K009")  # AttributeError: 'frozenset' object has no attribute 'add'

print(hash(fs))  # 可哈希，能算出哈希值
```

frozenset 适合表达配置项的标准组合、必填字段清单这类一旦确定就不再变化的概念。把 frozenset 作为字典键，可以用整个集合快速查表，这在配置比对、标签组合识别等场景非常实用。

```python
panels = {
    frozenset({"K001", "K002"}): "basic",
    frozenset({"K003", "K004", "K005"}): "advanced"
}
query = frozenset({"K001", "K002"})
print(panels[query])  # basic
```

### 4.6.27 冻结集合定义 frozenset

`frozenset(iterable)` 从可迭代对象创建冻结集合，过程会自动去重。无参数调用 `frozenset()` 得到空的冻结集合。

```python
fs1 = frozenset([1, 2, 2, 3])
print(fs1)  # frozenset({1, 2, 3})

fs2 = frozenset({"a", "b"})
print(fs2)  # frozenset({'a', 'b'})

empty_fs = frozenset()
print(empty_fs)  # frozenset()
```

frozenset 与 set 的区别只在可变性上。两者都无序、都自动去重、都要求元素可哈希，区别在于 frozenset 创建后不可修改。

### 4.6.28 冻结集合支持集合运算

frozenset 支持 `union`、`intersection`、`difference`、`symmetric_difference` 等所有只读集合运算，运算结果仍然是 frozenset。

```python
set_a = frozenset({"K001", "K002", "K003"})
set_b = frozenset({"K003", "K004", "K005"})

common = set_a & set_b
print(common)       # frozenset({'K003'})
print(type(common)) # <class 'frozenset'>

union = set_a | set_b
print(union)  # frozenset({'K001', 'K002', 'K003', 'K004', 'K005'})
```

frozenset 与 set 混合运算时，结果类型取决于左侧操作数。frozenset 在左侧返回 frozenset，set 在左侧返回 set。

```python
mixed = frozenset({1, 2}) | {3, 4}
print(type(mixed))  # <class 'frozenset'>
```

### 4.6.29 冻结集合可作为字典键和集合元素

因为 frozenset 不可变且可哈希，它可以作为字典的键，也可以作为另一个集合的元素。这是 frozenset 相对普通 set 的核心优势。

```python
# 作为字典键
bundle = {
    frozenset({"read", "write"}): "basic",
    frozenset({"read", "write", "delete"}): "standard"
}
key = frozenset({"read", "write"})
print(bundle[key])  # basic

# 作为集合元素
groups = {frozenset({"a", "b"}), frozenset({"c", "d"})}
print(groups)  # {frozenset({'a', 'b'}), frozenset({'c', 'd'})}
```

普通 set 不能这样使用，因为它可变，哈希值会随内容改变而失效。这一特性让 frozenset 成为表达不可变集合概念的唯一选择。

## 底层机制

### 4.6.30 集合的哈希机制

集合内部用哈希表存储元素，元素的存取依赖其哈希值。计算元素的哈希值后映射到表中的某个槽位，发生冲突时采用开放寻址法寻找下一个空闲位置。这一机制决定了集合的核心特性：元素必须可哈希、成员检查是 O(1) 平均时间复杂度、元素无序。

集合的负载因子超过阈值时会自动扩容并重新分布所有元素，这一过程对开发者透明。扩容保证了哈希冲突率维持在较低水平，从而保证查找、插入、删除的平均时间复杂度为 O(1)。集合的最坏情况时间复杂度是 O(n)，发生在大量哈希冲突时，但正常使用中很少遇到。

::: note 集合与列表的选择
当任务只关心是否存在或重叠部分，集合几乎是唯一选择，其 O(1) 的成员检查远胜列表的 O(n)。当任务关心顺序、允许重复或需要按下标访问时，列表更合适。两类容器常配合使用，列表保序、集合快速查询。把列表预转成集合再做成员判断，是空间换时间的经典做法。
:::

## 练习题

### 第 1 题：写出下列集合操作的输出结果

阅读下面这段代码，在不运行的情况下写出它的输出。注意集合无序，结果中元素的排列顺序可能不同，写出包含哪些元素即可。

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a & b)
print(a | b)
print(a - b)
print(a ^ b)
print(len(a.intersection(b)))
```

::: details 参考答案
输出如下。`&` 是交集，`|` 是并集，`-` 是差集，`^` 是对称差集。集合无序，元素出现顺序不固定，但包含的元素是确定的。

```
{3, 4}
{1, 2, 3, 4, 5, 6}
{1, 2}
{1, 2, 5, 6}
2
```

`intersection` 方法与 `&` 运算符等价，返回两个集合共有的元素。`len` 返回交集的元素个数，这里 3 和 4 共两个。
:::

### 第 2 题：用集合对列表去重并保留原始顺序

给定一个日志级别列表 `logs = ["INFO", "WARN", "INFO", "ERROR", "WARN", "INFO", "DEBUG"]`，请用集合辅助去重，同时保留每个级别首次出现的顺序，最后打印去重后的列表。

::: details 参考答案
```python
logs = ["INFO", "WARN", "INFO", "ERROR", "WARN", "INFO", "DEBUG"]

seen = set()
result = []
for level in logs:
    if level not in seen:
        seen.add(level)
        result.append(level)

print(result)
```

输出 `['INFO', 'WARN', 'ERROR', 'DEBUG']`。

直接 `set(logs)` 去重会丢失顺序，因为集合本身无序。这里用一个辅助集合 `seen` 记录已经遇到过的元素，配合列表 `result` 保序追加。集合的 `in` 判断是 O(1)，所以整个去重过程是 O(n)。也可以用 `list(dict.fromkeys(logs))` 一行实现同样的效果。
:::

### 第 3 题：用集合运算比较两份配置的差异

有两份配置项集合 `old = {"host", "port", "debug", "timeout"}` 和 `new = {"host", "port", "retry", "timeout", "verbose"}`，请用集合运算找出：新增了哪些配置项、删除了哪些配置项、哪些配置项两份都有。

::: details 参考答案
```python
old = {"host", "port", "debug", "timeout"}
new = {"host", "port", "retry", "timeout", "verbose"}

added = new - old
removed = old - new
kept = old & new

print("新增:", added)
print("删除:", removed)
print("保留:", kept)
```

输出：

```
新增: {'retry', 'verbose'}
删除: {'debug'}
保留: {'host', 'port', 'timeout'}
```

差集 `new - old` 得到新配置中独有的项，即新增项；`old - new` 得到旧配置中独有的项，即删除项；交集 `old & new` 得到两份都保留的项。这是配置比对、版本差异分析的标准套路，比逐个遍历判断简洁得多。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器需要为每个任务打标签，并支持按标签筛选。给定任务列表（每个任务是包含 `name` 和 `tags` 的字典，`tags` 是字符串列表），请实现一个函数 `filter_by_tag(tasks, tag)`，返回所有包含指定标签的任务名列表。要求用集合判断标签是否匹配。

::: details 参考答案
```python
def filter_by_tag(tasks, tag):
    result = []
    for task in tasks:
        if tag in set(task["tags"]):
            result.append(task["name"])
    return result


tasks = [
    {"name": "写文档", "tags": ["writing", "urgent"]},
    {"name": "修复 Bug", "tags": ["coding", "urgent"]},
    {"name": "测试", "tags": ["coding", "review"]},
    {"name": "部署", "tags": ["ops"]},
]

print(filter_by_tag(tasks, "urgent"))
print(filter_by_tag(tasks, "coding"))
```

输出：

```
['写文档', '修复 Bug']
['修复 Bug', '测试']
```

把 `task["tags"]` 转成集合再做 `in` 判断，让标签匹配从列表的 O(n) 变成集合的 O(1)。任务管理器中标签筛选是高频操作，用集合能显著提升查询效率。如果标签集合需要作为字典键去重任务组合，可以进一步用 `frozenset` 把标签集合固化。
:::

## 常见错误

**错误 1 · `type({})` 返回 `<class 'dict'>` 而非 `<class 'set'>`**

原因:空花括号 `{}` 在 Python 中被解释为空字典，字面量层面没有空集合的写法。

解决:创建空集合必须用 `set()` 内置函数无参数调用。非空集合可以用花括号字面量 `{1, 2, 3}`。

**错误 2 · `TypeError: unhashable type: 'list'`**

原因:集合内部用哈希表存储元素，要求元素可哈希。列表、字典、集合等可变类型不可哈希，加入集合会抛出 TypeError。

解决:把可变元素转换为不可变类型后再加入集合，例如用 `tuple(lst)` 代替列表。需要把集合本身作为元素时，用 `frozenset` 代替普通 `set`。

**错误 3 · `KeyError: 'xxx'`（remove 场景）**

原因:`remove(element)` 删除指定元素时，元素不存在会抛出 KeyError。与字典的 `del d[key]` 类似，要求调用方确信元素存在。

解决:元素是否存在不可预知时改用 `discard(element)`，元素不存在时静默返回不报错。空集合调用 `pop()` 也会抛出 KeyError，调用前应判断集合是否为空。

**错误 4 · `TypeError: 'set' object is not subscriptable`**

原因:集合是无序容器，元素没有位置编号，不支持索引访问 `s[0]` 或切片 `s[1:3]`。

解决:需要按顺序访问时先转成列表 `sorted(s)` 或 `list(s)`。仅做成员判断用 `in` 运算符，无需索引。既要去重又需保留顺序，用 `list(dict.fromkeys(data))`。
