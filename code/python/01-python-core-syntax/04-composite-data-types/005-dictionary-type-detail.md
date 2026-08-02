---
title: 4.5 字典类型专题
sidebar:
  order: 5
---
# 4.5 字典类型（Dictionary）专题


字典是 Python 中表达键值对映射的核心容器。本节在前文基础上对字典做一次系统梳理，从字面量定义、键值约束、访问与默认值、更新与合并、删除与复制、视图对象、迭代、推导式、嵌套结构一路讲到哈希冲突、负载因子、`__missing__` 钩子与比较规则等底层机制。每个知识点都配以代码示例，帮助你在面对真实数据组织任务时能够准确选用合适的字典操作。

## 创建与基础特性

### 4.5.1 字典字面量定义

字典字面量用一对花括号包裹若干键值对，键与值之间用冒号分隔，键值对之间用逗号分隔。一对不含任何内容的花括号 `{}` 表示空字典。下面创建一个以商品编号为键、价格为值的字典。

```python
prices = {"A001": 12.5, "A002": 8.0, "A003": 30.0}
print(prices)  # {'A001': 12.5, 'A002': 8.0, 'A003': 30.0}

empty = {}
print(type(empty))  # <class 'dict'>
```

键和值都可以是任意表达式，不必是字符串字面量。下面用整数作键、字符串作值。

```python
level = {0: "off", 1: "low", 2: "high"}
print(level[2])  # high
```

同一个字典中允许键值类型混合，这种灵活性在处理异构数据时很方便。

### 4.5.2 字典键的唯一性

字典中每个键只能出现一次。如果在字面量里对同一个键写了多次，后出现的值会覆盖先出现的值，最终字典只保留最后那个值，整个过程不会报错。

```python
d = {"A001": "first", "A001": "second", "A002": "third"}
print(d)  # {'A001': 'second', 'A002': 'third'}
```

这一特性在数据合并场景很有用。从多个数据源逐条写入字典时，后到的记录自然覆盖先到的，最终得到每个键的最新值。为了避免误覆盖，写入前最好用 `in` 检查键是否已存在。

### 4.5.3 字典键必须可哈希

字典的键必须可哈希，也就是必须是不可变类型。数字、字符串、元组可以作为键；列表、字典、集合这些可变类型不能作为键，强行使用会抛出 TypeError。

```python
legal = {1: "int", "name": "str", (1, 2): "tuple"}
print(legal[(1, 2)])  # tuple
```

```python
bad = {[1, 2]: "list"}  # TypeError: unhashable type: 'list'
```

字典内部用哈希表组织键，可哈希意味着对象的哈希值在其生命周期内不变。可变对象的哈希值会随内容改变而失效，所以被禁止。实际开发中常用字符串或元组作为复合键，这种组合既稳定又便于查询。

### 4.5.4 字典值可以是任意类型

字典的值没有任何类型限制，可以是数字、字符串、列表、元组、字典、集合，甚至函数对象。值也不要求类型一致，同一个字典里可以混合存放不同类型的值。

```python
config = {
    "host": "127.0.0.1",
    "port": 8080,
    "debug": True,
    "tags": ["api", "v2"],
    "params": {"timeout": 30, "retry": 3}
}
print(config["params"]["timeout"])  # 30
print(config["tags"])               # ['api', 'v2']
```

值是可变类型时需要注意，多个键如果指向同一个可变对象，修改一处会影响所有引用。下面两个键共享同一个列表。

```python
shared = []
d = {"a": shared, "b": shared}
d["a"].append(1)
print(d["b"])  # [1]，b 指向的也是同一个列表
```

### 4.5.5 字典的插入顺序保持

从 Python 3.7 起，语言规范保证字典按**插入顺序**遍历元素，先写入的键值对在迭代时先出现。在 CPython 3.6 中这已经作为实现细节存在，3.7 之后成为正式保证。

```python
d = {}
d["C"] = 3
d["A"] = 1
d["B"] = 2
print(list(d.keys()))  # ['C', 'A', 'B']，按插入顺序而非字母顺序
```

这一保证对打印输出和数据导出很重要。按时间顺序录入传感器读数时，遍历字典能保持录入顺序，便于按时间轴回看。删除某个键后重新插入，该键会排到末尾。

```python
del d["A"]
d["A"] = 10
print(list(d.keys()))  # ['C', 'B', 'A']，重新插入的 A 排到末尾
```

## 访问与默认值

### 4.5.6 字典元素访问

通过方括号语法 `d[key]` 访问与键对应的值。如果键不存在会抛出 **KeyError**，这一点与列表越界抛 IndexError 类似。

```python
metrics = {"score": 78, "count": 98, "ratio": 36.7}
print(metrics["score"])   # 78
print(metrics["price"])   # KeyError: 'price'
```

直接用方括号访问要求你对键的存在性有把握。当数据来源不可控时，比如解析外部接口返回的 JSON，这种写法很容易触发异常，下一小节的 `get()` 方法是更安全的替代。

### 4.5.7 字典元素安全访问 get

`get(key)` 在键存在时返回对应值，键不存在时返回 None 而不报错。可以传入第二个参数作为默认值，键缺失时返回该默认值。

```python
metrics = {"score": 78, "count": 98}
print(metrics.get("score"))            # 78
print(metrics.get("price"))            # None
print(metrics.get("price", "未设置"))   # 未设置
```

处理配置数据时常有缺项，某项参数未设置、某个字段未传值。用 `get()` 配合默认值，能让代码在缺数据时仍正常运转，给一个合理默认值继续执行，而不是直接崩溃。

### 4.5.8 字典元素获取并设置默认值 setdefault

`setdefault(key, default)` 在键不存在时插入该键值对并返回 default，键存在时直接返回原值不做任何修改。这一方法特别适合分组统计时初始化缺失键。

```python
counts = {}
for word in ["a", "b", "a", "c", "a", "b"]:
    counts.setdefault(word, 0)
    counts[word] += 1
print(counts)  # {'a': 3, 'b': 2, 'c': 1}
```

`setdefault` 与 `get` 的区别在于副作用：`get` 只读取不修改字典，`setdefault` 在键缺失时会写入默认值。如果只想读取就用 `get`，如果既要读取又要确保键存在就用 `setdefault`。

## 更新与合并

### 4.5.9 字典更新 update

`update(other)` 把另一个字典或键值对序列合并到当前字典，已存在的键会被覆盖，新键会被添加。`other` 可以是字典，也可以是产生键值对的可迭代对象，还可以用关键字参数形式 `update(key=value)` 传入。

```python
base = {"score": 78, "count": 98}
base.update({"ratio": 36.7, "score": 80})
print(base)  # {'score': 80, 'count': 98, 'ratio': 36.7}

base.update(name="test")
print(base)  # {'score': 80, 'count': 98, 'ratio': 36.7, 'name': 'test'}
```

`update` 是原地修改，不会返回新字典，返回值为 None。`update` 也可以接收由二元组组成的可迭代对象。

```python
d = {}
d.update([("x", 1), ("y", 2)])
print(d)  # {'x': 1, 'y': 2}
```

### 4.5.10 字典合并运算符 |

Python 3.9 引入了 `|` 运算符用于字典合并，左右两个字典合并后返回一个新字典，原字典不受影响。当两个字典有相同键时，右侧字典的值覆盖左侧。

```python
a = {"x": 1, "y": 2}
b = {"y": 3, "z": 4}
merged = a | b
print(merged)  # {'x': 1, 'y': 3, 'z': 4}
print(a)       # {'x': 1, 'y': 2}，原字典不变
```

`|` 与 `update` 的区别在于：`|` 产生新字典，`update` 原地修改。需要保留原始数据时用 `|`，需要高效合并大量数据时用 `update`。新字典的插入顺序是左侧字典的键在前，右侧字典新增的键在后。

### 4.5.11 字典就地合并运算符 |=

`|=` 是 `|` 的就地版本，把右侧字典合并到左侧字典，修改左侧字典本身。它等价于 `update`，但写法更简洁，尤其适合在循环中累加字典。

```python
a = {"x": 1, "y": 2}
a |= {"y": 3, "z": 4}
print(a)  # {'x': 1, 'y': 3, 'z': 4}
```

```python
total = {}
for chunk in [{"a": 1}, {"b": 2}, {"a": 9, "c": 3}]:
    total |= chunk
print(total)  # {'a': 9, 'b': 2, 'c': 3}
```

`|=` 和 `update` 行为一致，选择哪个主要看代码风格统一性。链式合并场景下 `|=` 表意更清晰。

## 删除与复制

### 4.5.12 字典键值对删除 pop

`pop(key)` 删除指定键并返回对应值。键不存在时如果提供了第二个参数 default，则返回 default 而不报错；如果没有提供 default，则抛出 KeyError。

```python
tasks = {"U001": "处理中", "U002": "待审核", "U003": "已完成"}

status = tasks.pop("U001")
print(status)  # 处理中
print(tasks)   # {'U002': '待审核', 'U003': '已完成'}

missing = tasks.pop("U999", "无此任务")
print(missing)  # 无此任务
```

`pop` 既能删除又能取回值，适合处理完一条就移除一条的消费式流程。数据来源不可靠时，记得带上 default 参数。

### 4.5.13 字典弹出最后插入的键值对 popitem

`popitem()` 删除并返回最后插入的键值对，以元组 `(key, value)` 形式返回。空字典调用会抛出 KeyError。得益于插入顺序保证，这里弹出的总是最近写入的键值对。

```python
d = {"a": 1, "b": 2, "c": 3}
last = d.popitem()
print(last)  # ('c', 3)
print(d)     # {'a': 1, 'b': 2}
```

`popitem` 适合实现后进先出的处理逻辑，或者从字典尾部逐条取出数据。在 Python 3.7 之前 `popitem` 弹出的是任意位置，从旧代码迁移时要注意这一行为变化。

### 4.5.14 字典清空 clear

`clear()` 删除字典中所有键值对，使其变为空字典。这是原地操作，不返回值。

```python
cache = {"k1": 1, "k2": 2, "k3": 3}
cache.clear()
print(cache)  # {}
```

`clear` 与重新赋值为空字典 `{}` 的区别在于引用关系。如果有多个变量指向同一个字典，`clear` 会让所有变量都看到空字典，而 `d = {}` 只改变当前变量名指向，其他引用仍指向原字典。

```python
d1 = {"a": 1}
d2 = d1
d1.clear()
print(d2)  # {}，d2 也被清空了
```

### 4.5.15 字典浅拷贝 copy

`copy()` 返回字典的浅拷贝，新字典的键值对与原字典相同，但嵌套的可变对象仍是引用，修改一处会影响另一处。

```python
original = {"nums": [1, 2, 3], "name": "test"}
shallow = original.copy()
shallow["name"] = "changed"
shallow["nums"].append(4)

print(original)  # {'nums': [1, 2, 3, 4], 'name': 'test'}
print(shallow)   # {'nums': [1, 2, 3, 4], 'name': 'changed'}
```

可以看到顶层键值对是独立的（`name` 改了原字典没变），但嵌套的列表是共享的（`nums` 被同时修改）。如果需要完全独立的副本，要使用 `copy` 模块的 `deepcopy()` 函数。

```python
import copy
original = {"nums": [1, 2, 3]}
deep = copy.deepcopy(original)
deep["nums"].append(4)
print(original)  # {'nums': [1, 2, 3]}，原字典完全不受影响
```

## 构造与视图

### 4.5.16 从键列表创建字典 fromkeys

`fromkeys(iterable, value)` 是 dict 的类方法，用可迭代对象中的每个元素作为键，统一填充同一个值，常用于初始化结构相同的字典。如果不传 value，默认填充 None。

```python
fields = ["score", "count", "ratio"]
baseline = dict.fromkeys(fields, 0)
print(baseline)  # {'score': 0, 'count': 0, 'ratio': 0}

empty_val = dict.fromkeys(["a", "b"])
print(empty_val)  # {'a': None, 'b': None}
```

::: note 可变默认值的陷阱
当 value 是可变对象（如列表、字典）时，所有键会共享同一个对象，修改一个会影响全部。需要每个键独立可变值时，应改用推导式。
:::

```python
bad = dict.fromkeys(["a", "b"], [])
bad["a"].append(1)
print(bad)  # {'a': [1], 'b': [1]}，b 也被改了

good = {k: [] for k in ["a", "b"]}
good["a"].append(1)
print(good)  # {'a': [1], 'b': []}，各自独立
```

### 4.5.17 字典视图对象 keys values items

字典提供三个方法返回**视图对象**：`keys()` 返回所有键，`values()` 返回所有值，`items()` 返回所有键值对元组。视图对象本身不存储数据，而是引用原字典的实时状态。

```python
metrics = {"score": 78, "count": 98, "ratio": 36.7}

print(list(metrics.keys()))    # ['score', 'count', 'ratio']
print(list(metrics.values()))  # [78, 98, 36.7]
print(list(metrics.items()))   # [('score', 78), ('count', 98), ('ratio', 36.7)]
```

视图对象支持迭代和成员检查，通常不需要转成列表就能直接使用。直接对字典迭代 `for k in d:` 等价于迭代 `d.keys()`。

### 4.5.18 字典视图对象的动态特性

视图对象是动态的，会随原字典变化实时反映。如果在遍历过程中修改了字典，视图会立刻体现新的内容。这也意味着在迭代字典时不能直接修改字典大小，否则会抛出 RuntimeError。

```python
d = {"a": 1, "b": 2}
keys = d.keys()
print(list(keys))  # ['a', 'b']

d["c"] = 3
print(list(keys))  # ['a', 'b', 'c']，视图自动更新
```

```python
d = {"a": 1, "b": 2, "c": 3}
# for key in d:
#     del d[key]  # RuntimeError: dictionary changed size during iteration
```

需要在迭代时修改字典，正确做法是先收集要操作的键，再统一处理。

```python
to_delete = [k for k in d if d[k] < 2]
for k in to_delete:
    del d[k]
```

### 4.5.19 字典视图对象支持集合运算

`keys()` 和 `items()` 返回的视图对象支持集合运算，如交集 `&`、并集 `|`、差集 `-`、对称差集 `^`。这是因为键本身唯一且可哈希，视图可以当作集合使用。`values()` 视图不支持集合运算，因为值可能重复且未必可哈希。

```python
a = {"x": 1, "y": 2, "z": 3}
b = {"y": 20, "z": 30, "w": 40}

print(a.keys() & b.keys())  # {'y', 'z'}，共有键
print(a.keys() - b.keys())  # {'x'}，a 有而 b 没有的键
print(a.items() & b.items())  # set()，没有完全相同的键值对
```

这一特性让字典之间的键比较变得很简洁，比如找出两个配置项集合的差集。

## 成员检查与迭代

### 4.5.20 字典键的成员检查

`in` 和 `not in` 用于检查某个键是否在字典中，注意它们检查的是键而不是值。字典的成员检查是 O(1) 时间复杂度，与字典大小无关。

```python
stock = {"A001": 6.5, "A002": 4.8, "A003": 138}
print("A001" in stock)      # True
print("A004" in stock)      # False
print(6.5 in stock)         # False，6.5 是值不是键
```

成员检查在写入前判断、读取前防御等场景非常常用。先用 `if key in d` 判断是否是已知键，再决定查询还是新增，能避免大量异常处理代码。

### 4.5.21 字典值的成员检查

要检查某个值是否在字典中，用 `value in d.values()`。值的成员检查是 O(n) 时间复杂度，需要逐个比较，因为字典只对键建立了哈希索引。

```python
stock = {"A001": 6.5, "A002": 4.8, "A003": 138}
print(6.5 in stock.values())   # True
print(100 in stock.values())   # False
```

如果需要频繁按值查找，应考虑建立反向字典，用值作键、键作值，把 O(n) 的查找变成 O(1)。

```python
reverse = {v: k for k, v in stock.items()}
print(reverse[6.5])  # A001
```

### 4.5.22 字典键迭代

直接对字典迭代 `for key in d:` 等价于迭代 `d.keys()`，每次拿到的是键。这是最常用的迭代方式。

```python
stock = {"A001": 6.5, "A002": 4.8, "A003": 138}
for key in stock:
    print(key)
# A001
# A002
# A003
```

迭代顺序遵循插入顺序。如果需要按键排序遍历，用 `for key in sorted(d):`。

### 4.5.23 字典值迭代

用 `for value in d.values():` 迭代字典的所有值，不关心键时使用。

```python
stock = {"A001": 6.5, "A002": 4.8, "A003": 138}
total = 0
for value in stock.values():
    total += value
print(total)  # 149.3
```

值的迭代顺序与键一致，因为值是按键的顺序取出的。

### 4.5.24 字典键值对迭代

用 `for key, value in d.items():` 同时拿到键和值，这是最完整的迭代方式，也是实际开发中最常用的写法。

```python
stock = {"A001": 6.5, "A002": 4.8, "A003": 138}
for code, price in stock.items():
    print(f"{code}: {price}")
# A001: 6.5
# A002: 4.8
# A003: 138
```

`items()` 每次返回一个元组，通过解包赋值给两个变量，写法简洁可读。需要索引时可以配合 `enumerate()` 使用。

## 推导式与嵌套

### 4.5.25 字典推导式

字典推导式用 `{key_expr: value_expr for item in iterable if condition}` 的语法从可迭代对象构造字典。下面把单词列表转为单词到长度的映射。

```python
words = ["apple", "bee", "cat"]
word_len = {w: len(w) for w in words}
print(word_len)  # {'apple': 5, 'bee': 3, 'cat': 3}
```

推导式可以加 `if` 条件做过滤，也可以从另一个字典变换。下面把价格字典中大于 10 的项保留，并打上折扣标记。

```python
prices = {"A001": 12.5, "A002": 8.0, "A003": 30.0}
discounted = {k: v * 0.9 for k, v in prices.items() if v > 10}
print(discounted)  # {'A001': 11.25, 'A003': 27.0}
```

推导式可以嵌套，但为了可读性，过复杂的逻辑应改用普通 for 循环逐步构建。

### 4.5.26 嵌套字典的访问与修改

字典的值可以是另一个字典，形成嵌套结构。多层访问用连续方括号 `dict[key1][key2]`，修改内层值也是通过这种方式定位再赋值。

```python
user = {
    "basic": {"name": "test", "age": 30},
    "stats": {"score": 78, "count": 98},
    "config": {"level": 6, "points": 138}
}

print(user["basic"]["name"])       # test
print(user["stats"]["score"])      # 78

user["config"]["level"] = 8
print(user["config"]["level"])      # 8
```

嵌套越深，访问链越长，某一层缺失就会让整条访问链抛 KeyError。安全做法是逐层 `get()`，配合空字典兜底。

```python
val = user.get("stats", {}).get("missing", "未设置")
print(val)  # 未设置
```

这种链式 `get()` 是处理结构不稳定的接口数据的常用技巧。需要注意 `get()` 返回 None 时再链式调用下一层会报错，所以中间层要传空字典作为默认值。

## 底层机制与比较

### 4.5.27 字典哈希冲突处理机制

字典底层用哈希表存储键值对。计算键的哈希值后映射到表中的某个槽位，当两个不同键的哈希值映射到同一个槽位时就会发生哈希冲突。Python 字典采用**开放寻址法**处理冲突，即冲突时按一定探测规则寻找下一个空闲槽位存放，查找时也按同样的探测序列定位。

这一机制对开发者透明，使用时不需要关心冲突细节。了解这一点有助于理解为什么键必须可哈希、为什么字典查找是 O(1) 平均时间复杂度。哈希冲突过多会降低性能，这也是字典在元素较多时会自动扩容的原因。

### 4.5.28 字典的 __missing__ 钩子方法

字典类型定义了 `__missing__(key)` 钩子方法。当使用 `d[key]` 访问且键不存在时，普通 dict 不会调用它，而是直接抛出 KeyError。但 dict 的子类可以重写 `__missing__`，在键缺失时执行自定义逻辑，比如返回默认值或动态生成值。标准库中的 `collections.defaultdict` 就是利用这一机制实现的。

```python
class DefaultDict(dict):
    def __missing__(self, key):
        return "默认值"

d = DefaultDict()
d["a"] = 1
print(d["a"])  # 1
print(d["b"])  # 默认值，触发 __missing__
```

日常使用中更推荐直接用 `collections.defaultdict` 或 `get()`，这里仅说明 `__missing__` 这一扩展点的存在。

### 4.5.29 字典的负载因子与自动扩容

哈希表的**负载因子**是已用槽位数与总槽位数的比值，反映表的拥挤程度。当负载因子超过阈值时，字典会自动扩容，分配更大的哈希表并重新分布所有键值对，这一过程称为 rehash。扩容保证了哈希冲突率维持在较低水平，从而保证查找、插入、删除的平均时间复杂度为 O(1)。

扩容是一次性开销较大的操作，会重新计算所有键的哈希位置。因此预先知道数据规模时，可以用 `dict.fromkeys()` 或一次性构造避免多次触发扩容。这一机制同样对开发者透明，了解它有助于理解字典在大量插入时偶发的性能波动。

### 4.5.30 字典比较规则

两个字典相等当且仅当长度相同且所有键值对完全匹配，键和值都要相等。比较时不考虑插入顺序，只要键值对集合相同就算相等。

```python
a = {"x": 1, "y": 2}
b = {"y": 2, "x": 1}
print(a == b)  # True，顺序不同但键值对相同

c = {"x": 1, "y": 3}
print(a == c)  # False，y 的值不同
```

字典的相等比较是 O(n) 操作，需要逐个比对键值对。键的比较基于哈希与相等性，值的比较调用值类型的 `__eq__` 方法。Python 3 中字典不再支持 `<`、`>` 等大小比较，尝试使用会抛出 TypeError。

::: note 字典操作速查
访问类用 `[]`、`get`、`setdefault`；更新类用 `update`、`|`、`|=`；删除类用 `pop`、`popitem`、`clear`、`del`；构造类用 `dict()`、`fromkeys`、推导式；视图类用 `keys`、`values`、`items`。把这五类方法分清，字典的日常操作就能覆盖绝大多数场景。
:::

## 练习题

### 第 1 题：写出下列字典操作的输出结果

阅读下面这段代码，在不运行的情况下写出它的输出。

```python
d = {"a": 1, "b": 2, "c": 3}
d["b"] = 20
d["d"] = 4
print(d.get("a"))
print(d.get("e"))
print(d.get("e", "未找到"))
print(len(d))
```

::: details 参考答案
输出如下。`d["b"] = 20` 修改已有键的值，`d["d"] = 4` 新增键值对。`get` 在键不存在时返回 `None` 或指定的默认值。`len` 返回键值对数量。

```
1
None
未找到
4
```

`get` 是访问字典的安全方式，键不存在时不会抛 `KeyError`，而是返回 `None` 或默认值，适合处理来源不可控的数据。
:::

### 第 2 题：用 setdefault 实现分组统计

给定一个单词列表 `words = ["apple", "banana", "apple", "cherry", "banana", "apple"]`，请用 `setdefault` 统计每个单词出现的次数，结果存入字典并打印。

::: details 参考答案
```python
words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counts = {}

for word in words:
    counts.setdefault(word, 0)
    counts[word] += 1

print(counts)
```

输出 `{'apple': 3, 'banana': 2, 'cherry': 1}`。

`setdefault(word, 0)` 在键不存在时插入并返回 0，键存在时直接返回原值。这样循环体里可以直接 `+= 1`，不必先判断键是否存在。这是分组统计的经典写法。
:::

### 第 3 题：用字典推导式翻转字典的键和值

给定字典 `stock = {"A001": 12.5, "A002": 8.0, "A003": 30.0}`，请用字典推导式生成一个反向字典，以价格为键、编号为值。

::: details 参考答案
```python
stock = {"A001": 12.5, "A002": 8.0, "A003": 30.0}
reverse = {v: k for k, v in stock.items()}

print(reverse)
print(reverse[8.0])
```

输出：

```
{12.5: 'A001', 8.0: 'A002', 30.0: 'A003'}
A002
```

字典推导式遍历 `items()` 拿到键值对，把值作为新键、键作为新值。反向字典把按值查找从 O(n) 变成 O(1)。注意如果原字典有重复值，翻转后只保留最后一个。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器需要按状态分组显示任务。给定任务列表（每个任务是包含 `name` 和 `status` 的字典），请用 `setdefault` 把任务按状态分组，每组是一个任务名列表，最后打印分组结果。

::: details 参考答案
```python
tasks = [
    {"name": "写文档", "status": "todo"},
    {"name": "评审代码", "status": "done"},
    {"name": "修复 Bug", "status": "todo"},
    {"name": "测试", "status": "done"},
    {"name": "部署", "status": "todo"},
]

groups = {}
for task in tasks:
    groups.setdefault(task["status"], []).append(task["name"])

for status, names in groups.items():
    print(f"[{status}] {names}")
```

输出：

```
[todo] ['写文档', '修复 Bug', '部署']
[done] ['评审代码', '测试']
```

`setdefault(task["status"], [])` 在状态键不存在时插入空列表，然后把任务名追加进去。这种"按字段分组"是任务管理器中常见的视图组织方式，让用户能按状态查看任务概览。
:::

## 常见错误

**错误 1 · `KeyError: 'xxx'`**

原因:用 `d[key]` 方括号语法访问字典中不存在的键。方括号访问不提供默认值，键缺失时直接抛出异常。

解决:数据来源不可控时改用 `d.get(key)` 或 `d.get(key, default)`，键缺失返回 `None` 或指定默认值。确认键一定存在时才用方括号语法。

**错误 2 · `RuntimeError: dictionary changed size during iteration`**

原因:在 `for key in d:` 遍历字典时直接 `del d[key]` 或新增键值对，改变了字典大小。字典视图是动态的，迭代期间原字典结构变化会触发运行时错误。

解决:先收集要操作的键到列表中，再遍历该列表执行删除或修改。例如 `for key in list(d.keys()):` 把视图快照成列表后再删除。

**错误 3 · `dict.fromkeys(keys, [])` 所有键共享同一个列表**

原因:`fromkeys` 用同一个可变对象作为所有键的值，各键的引用指向同一个列表。修改任一键对应的列表，所有键的值同步变化。

解决:改用字典推导式 `{k: [] for k in keys}`，每个键独立创建列表。不可变默认值（如数字、字符串、None）用 `fromkeys` 没有此问题。

**错误 4 · 把 `d.keys()` 当作列表使用，索引或排序后未同步更新**

原因:`keys()`、`values()`、`items()` 返回的是动态视图对象而非列表，不支持索引访问 `d.keys()[0]`，会抛出 `TypeError`。视图随原字典实时变化，不会冻结快照。

解决:需要索引访问或固定快照时用 `list(d.keys())` 转成列表。仅用于迭代或成员检查时直接用视图，无需转换。
