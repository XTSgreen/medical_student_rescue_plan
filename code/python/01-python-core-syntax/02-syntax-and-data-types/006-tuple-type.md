---
title: 2.6 元组类型
sidebar:
  order: 6
---
# 2.6 元组类型


元组是 Python 中另一种有序序列类型，外形与列表相似，但创建后不可修改。。本节将从字面量写法讲起，覆盖元组的索引、拆包、与列表的相互转换、不可变性细节以及命名元组，帮助你理解何时该用元组代替列表。

## 2.6.1 元组字面量

元组字面量用圆括号 `()` 包起来，元素之间用逗号分隔。Python 也允许省略圆括号，直接用逗号分隔的多个值就是一个元组，这种写法在函数返回多值时特别常见：

```python
readings = (72, 120, 36.5)
print(readings)             # (72, 120, 36.5)
print(type(readings))       # <class 'tuple'>

# 圆括号可省略
readings2 = 72, 120, 36.5
print(readings2)            # (72, 120, 36.5)
print(readings == readings2)  # True
```

省略圆括号的写法叫做**隐式元组**，常用于 `return a, b, c` 这样的多值返回，背后就是返回一个元组，调用方再用拆包接收。

## 2.6.2 单元素元组需加逗号

单元素元组必须写成 `(value,)`，结尾那个逗号不可省。`(value)` 只是带括号的表达式，Python 会把它当成普通值而非元组。这一规则源于括号在 Python 中有多重含义：分组、函数调用、元组字面量，单元素时只有逗号才能消歧：

```python
single = (42,)
print(type(single))         # <class 'tuple'>

not_tuple = (42)
print(type(not_tuple))      # <class 'int'>

# 即使没有括号，加逗号也是元组
also_tuple = 42,
print(type(also_tuple))     # <class 'tuple'>
```

::: note 末尾逗号的习惯
多元素元组的末尾逗号可有可无，`(1, 2, 3,)` 与 `(1, 2, 3)` 等价。许多项目约定多元素元组也保留末尾逗号，便于后续追加元素时少改一行，也避免版本控制产生多余的 diff 噪音。
:::

## 2.6.3 空元组 ()

空元组写成 `()` 或调用 `tuple()`，两者等价。空元组用处不多，主要出现在需要返回**无值**的函数中，或作为占位符：

```python
empty1 = ()
empty2 = tuple()
print(len(empty1))          # 0
print(empty1 == empty2)     # True
```

注意空元组 `()` 不需要逗号，这是单元素元组规则的一个例外。因为空元组的括号本身就是元组标识，没有歧义；而单元素时括号可能被当成表达式分组，必须用逗号区分。

## 2.6.4 元组是不可变的有序序列

元组的核心特征是**不可变**。一旦创建，元组的长度和每个位置的元素就固定下来，无法通过索引赋值修改，也无法 append、remove 或 sort。这种限制带来了几个实际优势：不可变意味着元组可以作为字典的键、可以作为集合的元素，而列表不行；不可变还意味着元组在多线程环境下天然安全，无需加锁：

```python
point = (3, 5)
# point[0] = 4              # TypeError: 'tuple' object does not support item assignment
```

实际开发中，元组适合表示一旦确定就不应改动的数据，例如用户 ID 与创建时间的组合 `(user_id, created_at)`，封装成元组能避免误改。元组的不可变性也向函数调用方传递一个明确信号：这个值不会被改动，可以放心传递。

## 2.6.5 元组索引和切片

元组的索引和切片语法与列表完全一致，只是返回的新序列也是元组：

```python
record = ("U001", "张三", 45, "active")
print(record[0])            # U001
print(record[-1])            # active
print(record[1:3])          # ('张三', 45)，切片仍是元组
print(record[::-1])         # ('active', 45, '张三', 'U001')，反转
```

索引越界同样抛 `IndexError`，切片越界自动截断。这些行为与列表一致，掌握列表的索引切片就掌握了元组的索引切片，唯一的差异是切片结果类型仍是元组。

## 2.6.6 元组拼接和重复

`+` 拼接两个元组返回新元组，`*` 重复若干次返回新元组。由于元组不可变，这些操作都不会修改原元组：

```python
day_team = ("张工", "李工")
night_team = ("王工",)
full = day_team + night_team
print(full)                 # ('张工', '李工', '王工')

alert = ("error",) * 3
print(alert)                # ('error', 'error', 'error')
```

注意单元素元组 `("王工",)` 必须加逗号，否则 `("王工")` 只是个字符串，与元组拼接会报 `TypeError`。

## 2.6.7 元组长度

`len()` 返回元组的元素个数，与列表用法相同：

```python
record = ("U001", "张三", 45)
print(len(record))          # 3
```

## 2.6.8 成员检查

`in` 和 `not in` 判断元素是否在元组中，用法与列表相同。元组的成员检查同样是线性扫描：

```python
tags = ("vip", "new")
print("vip" in tags)        # True
print("admin" not in tags)  # True
```

## 2.6.9 元组方法：count() 和 index()

元组只有两个公开方法：`count(value)` 统计某值出现的次数，`index(value)` 返回第一个匹配的位置。列表的 append、remove、sort 等修改类方法在元组上都不存在：

```python
t = (1, 2, 2, 3, 2)
print(t.count(2))           # 3
print(t.index(2))           # 1
```

`index()` 找不到值会抛 `ValueError`，调用前最好先 `in` 检查或用 try/except 捕获。方法数量少反映了元组的设计取向：作为只读容器，不需要修改类方法。

## 2.6.10 元组拆包

元组拆包是把元组的各个元素一次性赋给多个变量，语法直观，是 Python 中处理多值的核心技巧。变量数必须与元组长度一致，否则抛 `ValueError`：

```python
record = ("U001", "张三", 45)
uid, name, age = record
print(uid)                  # U001
print(name)                 # 张三
print(age)                  # 45
```

带星号 `*` 的变量会收集剩余元素为一个列表，这种用法在处理**前几个明确、剩余可变**的场景时很方便：

```python
record = ("U001", "张三", 45, "admin", "editor", "viewer")
uid, name, age, *roles = record
print(uid)                  # U001
print(roles)                # ['admin', 'editor', 'viewer']
print(type(roles))          # <class 'list'>
```

::: note 拆包与函数返回值
Python 函数返回多个值时，实际返回的是一个元组，调用方用拆包接收。例如 `status, msg = check_user(uid)` 看似返回了两个值，本质是返回一个二元组然后拆开。这种模式让 Python 函数接口非常灵活。
:::

## 2.6.11 元组与列表的相互转换

`tuple()` 把列表转为元组，`list()` 把元组转为列表。转换产生新对象，原对象不变。这种转换在需要可变与不可变特性切换时常用：

```python
t = (1, 2, 3)
lst = list(t)
lst.append(4)
print(lst)                  # [1, 2, 3, 4]
print(t)                    # (1, 2, 3)，原元组不变

new_t = tuple(lst)
print(new_t)                # (1, 2, 3, 4)
```

转换是 O(n) 操作，需要遍历整个序列。频繁互转通常意味着数据结构选择不当，应当一开始就根据是否需要修改来选定类型。

## 2.6.12 元组的不可变性细节

元组的不可变是指**元组本身的结构和元素引用**不可变，但如果元素本身是可变对象，那个对象的内部状态仍然可以修改。这一点经常让初学者困惑：

```python
t = (["张三", 45], ["李四", 60])
t[0].append("admin")
print(t)                    # (['张三', 45, 'admin'], ['李四', 60])
# t[0] = ["新用户"]         # TypeError，不能改元组本身
```

`t[0]` 始终指向同一个列表对象，元组的不可变性没有被破坏；但这个列表对象本身是可变的，可以 append、remove。这类似项目分组固定，但组内成员可以调整。

元组不可变带来的一个推论是：**只有当元组的所有元素都是不可变类型时，元组才能哈希**，才能作为字典的键或集合的元素。含列表的元组不可哈希：

```python
hash((1, 2, 3))             # 可哈希，返回一个整数
# hash((1, [2, 3]))         # TypeError: unhashable type: 'list'
```

## 2.6.13 命名元组

普通元组只能用索引访问元素，位置一多就容易记错含义，例如 `(72, 120, 36.5)` 不看上下文很难判断每个数字代表什么。`collections.namedtuple` 给元组的每个位置起个名字，既保留了元组的轻量与不可变，又获得了字段访问的可读性：

```python
from collections import namedtuple

# 定义一个名为 SensorReading 的命名元组，含三个字段
SensorReading = namedtuple("SensorReading", ["humidity", "pressure", "temperature"])

sr = SensorReading(humidity=72, pressure=120, temperature=36.5)
print(sr.humidity)          # 72，按字段名访问
print(sr[1])                # 120，仍可按索引访问
print(sr._fields)           # ('humidity', 'pressure', 'temperature')
```

命名元组本质仍是元组，与普通元组完全兼容，可以用 `isinstance(sr, tuple)` 验证。它比定义类更轻量，比普通元组更易读，是表示简单不可变数据结构的常用选择。Python 3.7 之后的 `dataclass` 提供了类似但更强大的功能，需要默认值、类型注解或方法时优先用 dataclass。

掌握元组后，你已经理解了 Python 中两种基本的序列类型。下一节我们将进入字符串与字典等更复杂的数据类型，进一步扩展处理实际数据的能力。

## 练习题

### 第1题 概念理解

阅读下面的代码，写出输出结果，并解释为什么 `(42)` 和 `(42,)` 的类型不同。

```python
a = (42)
b = (42,)
print(type(a))
print(type(b))

t = (["张三", 45], ["李四", 60])
t[0].append("admin")
print(t)
```

::: details 参考答案
```python
print(type(a))  # <class 'int'>
print(type(b))  # <class 'tuple'>

print(t)  # (['张三', 45, 'admin'], ['李四', 60])
```

`(42)` 只是带括号的表达式，括号起分组作用，Python 把它当作普通整数。`(42,)` 末尾的逗号才是元组的标识，单元素元组必须加逗号。元组本身不可变指的是元素引用不可变，但 `t[0]` 指向的列表是可变对象，调用 `append()` 修改的是列表内部内容，元组仍指向同一个列表对象，没有违反不可变性。
:::

### 第2题 代码编写
一个函数返回包含用户 ID、姓名、年龄和多个角色的元组 `("U001", "张三", 45, "admin", "editor", "viewer")`。用拆包语法把前三个值赋给 `uid`、`name`、`age`，剩余角色收集到 `roles` 列表，再格式化输出。

::: details 参考答案
```python
def get_user():
    return ("U001", "张三", 45, "admin", "editor", "viewer")

uid, name, age, *roles = get_user()
print(f"ID: {uid}")        # ID: U001
print(f"姓名: {name}")     # 姓名: 张三
print(f"年龄: {age}")      # 年龄: 45
print(f"角色: {roles}")    # 角色: ['admin', 'editor', 'viewer']
print(f"角色数: {len(roles)}")  # 角色数: 3
```

带星号的 `*roles` 会收集剩余所有元素为一个列表。这种拆包方式适合前几个值含义明确、剩余数量可变的场景。注意收集结果始终是列表类型，即使没有剩余元素也是空列表。
:::

### 第3题 进阶
使用 `collections.namedtuple` 定义一个 `Task` 命名元组，包含字段 `task_id`、`title`、`priority`。创建两个任务实例，分别用字段名和索引访问数据，再用拆包方式提取字段值。

::: details 参考答案
```python
from collections import namedtuple

Task = namedtuple("Task", ["task_id", "title", "priority"])

t1 = Task(task_id="T001", title="设计登录页面", priority=3)
t2 = Task("T002", "修复支付Bug", 5)

# 按字段名访问
print(t1.title)       # 设计登录页面
print(t1.priority)    # 3

# 按索引访问
print(t2[0])          # T002
print(t2[1])          # 修复支付Bug

# 拆包
task_id, title, priority = t2
print(f"{task_id}: {title}（优先级 {priority}）")
# T002: 修复支付Bug（优先级 5）

# 查看所有字段名
print(t1._fields)     # ('task_id', 'title', 'priority')
```

命名元组本质仍是元组，与普通元组完全兼容，可以用 `isinstance(t1, tuple)` 验证。它比普通元组更易读，比定义完整类更轻量，适合表示结构简单的不可变数据。需要默认值、类型注解或方法时，可以考虑使用 `dataclass`。
:::

### 第4题 项目实践
在一个任务管理程序中，任务的创建时间和优先级组合应该作为不可变标识。编写代码，用元组 `(task_id, priority)` 作为字典的键，对应值为任务标题。创建三条任务记录，验证元组键可以正常查询，再尝试用列表作为键观察报错。

::: details 参考答案
```python
# 元组作为字典键
tasks = {
    ("T001", 3): "设计登录页面",
    ("T002", 5): "修复支付Bug",
    ("T003", 2): "编写文档",
}

# 用元组键查询
key = ("T002", 5)
print(tasks[key])  # 修复支付Bug

# 遍历
for (tid, priority), title in tasks.items():
    print(f"{tid}（优先级 {priority}）: {title}")
# T001（优先级 3）: 设计登录页面
# T002（优先级 5）: 修复支付Bug
# T003（优先级 2）: 编写文档

# 尝试用列表作为键会报错
# list_key = ["T001", 3]
# tasks[list_key]  # TypeError: unhashable type: 'list'
```

元组是不可变类型所以可哈希，能作为字典的键。列表是可变类型不可哈希，强行用作键会抛出 `TypeError`。用 `(task_id, priority)` 这样的复合键可以唯一标识一条任务，查询时直接构造相同元组即可。这种用元组作复合键的技巧在数据关联时很常见。
:::

## 常见错误

**错误 1 · `(42)` 是整数，`(42,)` 才是单元素元组**

```python
a = (42)
b = (42,)
print(type(a))  # <class 'int'>
print(type(b))  # <class 'tuple'>
```

原因:括号在 Python 中有多重含义，包括表达式分组、函数调用、元组字面量。`(42)` 被当作带括号的表达式，结果是整数 42。单元素元组必须加末尾逗号 `(42,)`，逗号才是元组的标识。

解决:单元素元组始终加末尾逗号 `(value,)`。省略括号的写法 `42,` 也是元组，可以用于 `return value,` 这类场景。多元素元组的末尾逗号可有可无，但保留末尾逗号便于后续追加元素。

**错误 2 · `TypeError: 'tuple' object does not support item assignment`**

```python
t = ("U001", "张三", 45)
t[0] = "U002"  # TypeError
```

原因:元组是不可变序列，创建后不能通过索引赋值修改元素。这是元组与列表的核心差异。试图 `append`、`remove`、`sort` 等修改类方法也会失败，元组只有 `count` 和 `index` 两个只读方法。

解决:需要修改时先把元组转成列表 `lst = list(t)`，修改后再转回 `new_t = tuple(lst)`。如果数据需要频繁修改，一开始就用列表而非元组。元组适合表示一旦确定就不应改动的数据，例如用户 ID 与创建时间的组合。

**错误 3 · `TypeError: unhashable type: 'list'`**

```python
hash((1, [2, 3]))  # TypeError
d = {(1, [2, 3]): "value"}  # TypeError
s = {(1, [2, 3])}  # TypeError
```

原因:元组本身不可变，但其元素如果是可变对象（如列表、字典），元组就不可哈希。字典的键、集合的元素都要求可哈希，含可变元素的元组不能用作这些场景。

解决:把可变元素转成不可变类型，例如用元组替代列表 `(1, (2, 3))`。元组可哈希的前提是所有元素都可哈希，嵌套可变对象会破坏这一性质。需要存入字典键或集合的复合数据，确保每一层都是不可变类型。

**错误 4 · `ValueError: too many values to unpack`**

```python
record = ("U001", "张三", 45)
uid, name = record  # ValueError，变量数与元组长度不一致
```

原因:元组拆包要求左侧变量数与右侧元素数严格相等，否则抛 `ValueError`。常见于函数返回值数量变化、或数据结构长度不确定时。

解决:变量数与元组长度保持一致。前几个明确、剩余可变时用星号收集 `uid, name, *rest = record`，`rest` 是列表。不确定长度时用索引访问或先 `len()` 检查。函数返回多值时应在文档中说明返回元组的结构。
