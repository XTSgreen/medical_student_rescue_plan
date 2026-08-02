---
title: 5.5 匿名函数与高阶函数基础
sidebar:
  order: 5
---
# 5.5 匿名函数与高阶函数基础


任务管理器中需要把任务按优先级排序，优先级数字越小越紧急。排序时要告诉 `sorted` 函数按什么标准比较，这个标准就是一个函数：取出每个任务的 `priority` 字段。为这一个取值操作专门定义一个 `def` 函数显得啰嗦，于是 Python 提供了 lambda 表达式，用一行就能写出一个临时小函数。lambda 与 `map`、`filter`、`sorted` 等高阶函数配合，能简洁地处理数据变换和过滤。本节讲解 lambda 语法和常用高阶函数的使用方法。

## 5.5.1 高阶函数的概念

高阶函数是指接受函数作为参数，或返回函数作为结果的函数。上一章已经见过把函数作为参数传递的例子。高阶函数的核心思想是把操作抽象出来作为参数传递，让同一个高阶函数能配合不同的操作完成不同任务。Python 内置了几个常用的高阶函数，如 `map`、`filter`，`sorted`、`min`、`max` 也接受函数作为 `key` 参数，本质上也是高阶函数。

## 5.5.2 lambda 表达式语法

lambda 表达式用于创建匿名函数，也就是不需要用 `def` 命名的函数。语法是 `lambda 参数列表: 表达式`，冒号前是参数，冒号后是返回值的表达式。lambda 只能包含单个表达式，不能包含语句（如赋值、`if` 语句块、`for` 循环），表达式的计算结果就是返回值。

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

`lambda a, b: a + b` 创建了一个接受两个参数、返回它们之和的函数对象，赋值给 `add`。调用 `add(3, 5)` 返回 8。这与用 `def` 定义的函数效果相同，只是写法更紧凑。

lambda 的参数支持与普通函数相同的特性，包括默认参数、`*args`、`**kwargs`。但 lambda 通常只用于非常简单的逻辑，复杂逻辑仍应使用 `def`，因为 `def` 支持语句和文档字符串，可读性更好。

```python
# 带默认参数的 lambda
greet = lambda name, greeting="你好": f"{greeting}，{name}"
print(greet("张三"))         # 你好，张三
print(greet("李四", "早上好"))  # 早上好，李四
```

## 5.5.3 lambda 返回函数对象

lambda 表达式的值是一个函数对象，可以赋值给变量、作为参数传递、作为返回值返回，与 `def` 定义的函数完全一样。lambda 和 `def` 创建的函数对象在运行时没有本质区别，区别只在于语法形式和能否包含多条语句。

```python
double = lambda x: x * 2
print(double.__name__)  # <lambda>，lambda 函数的名字固定为 <lambda>
```

lambda 创建的函数 `__name__` 属性是 `<lambda>`，这是它与 `def` 函数的一个区别。在调试和日志中看到 `<lambda>` 就知道这是一个匿名函数。因此需要复用或需要可读名称的函数，应使用 `def` 定义。

## 5.5.4 lambda 的常见使用场景

lambda 最常见的用途是作为高阶函数的参数，在调用处临时定义一个小函数，用完即弃。这样不需要为一次性的简单操作单独定义命名函数，代码更紧凑。典型场景包括 `map`、`filter`、`sorted` 的 `key` 参数、`min`/`max` 的 `key` 参数等。

```python
tasks = [
    {"title": "写报告", "priority": 2},
    {"title": "开会", "priority": 1},
    {"title": "回邮件", "priority": 3},
]

# 用 lambda 作为 sorted 的 key
sorted_tasks = sorted(tasks, key=lambda t: t["priority"])
for t in sorted_tasks:
    print(t["title"], t["priority"])
```

输出如下。

```
开会 1
写报告 2
回邮件 3
```

`lambda t: t["priority"]` 接受一个任务字典，返回它的 `priority` 值。`sorted` 用这个函数对每个任务提取比较键，按优先级从小到大排序。如果这里用 `def` 定义一个函数只为这一处服务，反而显得繁琐。

## 5.5.5 map() 函数

`map()` 把一个函数依次应用到可迭代对象的每个元素上，返回一个包含所有结果的迭代器。`map(函数, 可迭代对象)` 的第一个参数是转换函数，第二个是要处理的数据。

```python
tasks = ["写报告", "开会", "回邮件"]
upper_tasks = list(map(str.upper, tasks))
print(upper_tasks)  # ['写报告', '开会', '回邮件']

numbers = [1, 2, 3, 4]
squares = list(map(lambda x: x ** 2, numbers))
print(squares)  # [1, 4, 9, 16]
```

`map(str.upper, tasks)` 把 `str.upper` 函数应用到每个任务字符串上。中文没有大小写之分所以结果不变，但如果是英文任务名就会全部变大写。`map(lambda x: x ** 2, numbers)` 用 lambda 计算每个数的平方。`map` 返回的是迭代器，需要用 `list()` 转换成列表才能看到结果。

`map` 也可以接受多个可迭代对象，函数会同时接收各可迭代对象的对应元素。

```python
titles = ["写报告", "开会"]
priorities = [2, 1]
pairs = list(map(lambda t, p: {"title": t, "priority": p}, titles, priorities))
print(pairs)  # [{'title': '写报告', 'priority': 2}, {'title': '开会', 'priority': 1}]
```

在大多数 Python 代码中，`map` 的功能可以用列表推导式更清晰地实现，如 `[x ** 2 for x in numbers]`。`map` 在函数式编程风格中更常见，了解其用法有助于阅读他人代码。

## 5.5.6 filter() 函数

`filter()` 用一个函数过滤可迭代对象，保留函数返回值为真的元素。`filter(函数, 可迭代对象)` 返回一个迭代器，包含所有使函数返回 `True` 的元素。

```python
tasks = [
    {"title": "写报告", "priority": 1},
    {"title": "开会", "priority": 3},
    {"title": "回邮件", "priority": 1},
    {"title": "整理桌面", "priority": 5},
]

# 筛选高优先级任务（priority <= 2）
urgent = list(filter(lambda t: t["priority"] <= 2, tasks))
for t in urgent:
    print(t["title"])
```

输出如下。

```
写报告
回邮件
```

`lambda t: t["priority"] <= 2` 对每个任务判断优先级是否小于等于 2，返回布尔值。`filter` 保留返回 `True` 的任务，即 `写报告` 和 `回邮件`。与 `map` 类似，`filter` 返回迭代器，需要 `list()` 转换。`filter` 的功能同样可以用列表推导式替代：`[t for t in tasks if t["priority"] <= 2]`，后者在 Python 中更常见。

## 5.5.7 sorted() 的 key 参数

`sorted()` 函数接受一个 `key` 参数，指定一个函数用于提取比较键。`sorted` 不会改变原序列，而是返回一个新列表。`key` 函数对每个元素调用一次，返回的值用于排序比较，但最终列表中保留的是原始元素。

```python
tasks = [
    {"title": "写报告", "priority": 2},
    {"title": "开会", "priority": 1},
    {"title": "回邮件", "priority": 3},
    {"title": "整理桌面", "priority": 1},
]

# 按优先级升序
by_priority = sorted(tasks, key=lambda t: t["priority"])
# 按优先级降序
by_priority_desc = sorted(tasks, key=lambda t: t["priority"], reverse=True)
# 优先级相同按标题排序
by_both = sorted(tasks, key=lambda t: (t["priority"], t["title"]))

for t in by_priority:
    print(t["title"], t["priority"])
```

按优先级升序输出如下。

```
开会 1
整理桌面 1
写报告 2
回邮件 3
```

`key=lambda t: t["priority"]` 让 `sorted` 按每个任务的 `priority` 字段排序。`reverse=True` 表示降序。`key` 函数返回元组 `(t["priority"], t["title"])` 时，`sorted` 先按第一个元素比较，相同再按第二个元素比较，实现多级排序。优先级同为 1 的 `开会` 和 `整理桌面`，会按标题的字典序排列。

`key` 函数应返回可比较的值。对于复杂对象的排序，灵活运用 `key` 参数比实现自定义比较函数更简洁。

## 5.5.8 列表的原地排序 sort()

列表对象有 `sort()` 方法，功能与 `sorted()` 相同，区别在于 `sort()` 是原地排序，直接修改列表本身，返回 `None`，而 `sorted()` 返回新列表不修改原数据。`sort()` 也接受 `key` 和 `reverse` 参数。

```python
tasks = [
    {"title": "写报告", "priority": 2},
    {"title": "开会", "priority": 1},
]

tasks.sort(key=lambda t: t["priority"])  # 原地排序
print(tasks)  # [{'title': '开会', 'priority': 1}, {'title': '写报告', 'priority': 2}]
```

如果不需要保留原顺序，用 `sort()` 更节省内存。如果需要保留原数据，用 `sorted()`。

## 5.5.9 min() 和 max() 的 key 参数

`min()` 和 `max()` 也接受 `key` 参数，用于指定比较依据，返回使 `key` 函数值最小或最大的那个原始元素。

```python
tasks = [
    {"title": "写报告", "priority": 2},
    {"title": "开会", "priority": 1},
    {"title": "回邮件", "priority": 3},
]

most_urgent = min(tasks, key=lambda t: t["priority"])
least_urgent = max(tasks, key=lambda t: t["priority"])

print(most_urgent["title"])   # 开会，priority 最小
print(least_urgent["title"])  # 回邮件，priority 最大
```

`min` 返回 `priority` 最小的任务 `开会`，`max` 返回 `priority` 最大的任务 `回邮件`。`key` 参数让 `min`/`max` 不必关心元素本身如何比较，只比较 `key` 函数的返回值，但最终返回的是原始元素而非 `key` 值。这与 `sorted` 的 `key` 行为一致。

## 5.5.10 reduce() 简介

`reduce()` 位于 `functools` 模块中，它把一个二元函数（接受两个参数的函数）累计地应用到序列的所有元素上，最终归约为一个值。`reduce` 在 Python 3 中不再内置，需要从 `functools` 导入。

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5]
total = reduce(lambda x, y: x + y, numbers)
print(total)  # 15

tasks = [
    {"title": "写报告", "time": 2},
    {"title": "开会", "time": 1},
    {"title": "回邮件", "time": 3},
]
total_time = reduce(lambda acc, t: acc + t["time"], tasks, 0)
print(total_time)  # 6
```

`reduce(lambda x, y: x + y, numbers)` 的计算过程是：先取 1 和 2 相加得 3，再用 3 加 3 得 6，再用 6 加 4 得 10，最后 10 加 5 得 15。第二个例子中第三个参数 `0` 是初始值，`reduce` 从初始值 0 开始累加所有任务的 `time`。

`reduce` 的可读性不如普通的 `for` 循环或 `sum()`，多数情况下用内置函数和循环更清晰。`reduce` 主要在函数式编程风格中使用，了解其原理即可，实际项目中应优先选择更直观的写法。

## 5.5.11 functools.partial 简介

`functools.partial` 用于固定函数的部分参数，生成一个新函数。新函数调用时只需传入剩余参数，已固定的参数自动填入。这在需要多次调用同一函数且某些参数相同时很方便。

```python
from functools import partial

def add_task(tasks, title, priority):
    tasks.append({"title": title, "priority": priority})

tasks = []
# 固定 tasks 和 priority，只留 title 可变
add_urgent = partial(add_task, tasks, priority=1)

add_urgent("写报告")
add_urgent("开会")
print(tasks)
# [{'title': '写报告', 'priority': 1}, {'title': '开会', 'priority': 1}]
```

`partial(add_task, tasks, priority=1)` 创建了一个新函数 `add_urgent`，它调用时相当于 `add_task(tasks, title=?, priority=1)`，只需传入 `title`。`partial` 常用于把通用函数适配为特定场景的专用函数，也是解决闭包循环变量陷阱的一种手段。

## 5.5.12 lambda 与 def 的选择

lambda 适合简单的一行表达式，特别是作为高阶函数的临时参数。当逻辑超过一行、需要写文档、需要复用时，应使用 `def`。过度使用 lambda 会降低代码可读性，让人难以理解函数在做什么。

```python
# 简单逻辑用 lambda 合适
sorted_tasks = sorted(tasks, key=lambda t: t["priority"])

# 复杂逻辑用 def 更清晰
def task_sort_key(t):
    """任务排序键：优先级为主，创建时间为辅。"""
    return (t["priority"], t.get("created_at", ""))

sorted_tasks = sorted(tasks, key=task_sort_key)
```

判断标准是：如果 lambda 的表达式一眼能看懂，用它没问题；如果需要仔细分析才能理解，就改成 `def` 并起个有意义的名字。

::: tip 优先使用推导式
对于 `map` 和 `filter` 的常见用途，Python 社区更推荐使用列表推导式。`[x**2 for x in numbers]` 比 `list(map(lambda x: x**2, numbers))` 更易读，`[t for t in tasks if t["priority"] <= 2]` 比 `list(filter(lambda t: t["priority"] <= 2, tasks))` 更清晰。`sorted` 的 `key` 参数则是 lambda 的合理使用场景，因为推导式无法替代它。
:::

## 练习题

**练习 1** 给定任务列表，用 `sorted` 和 lambda 按 `priority` 升序排序，优先级相同的按 `title` 字典序降序排列。

```python
tasks = [
    {"title": "写报告", "priority": 1},
    {"title": "回邮件", "priority": 1},
    {"title": "开会", "priority": 2},
]
```

::: details 参考答案
```python
tasks = [
    {"title": "写报告", "priority": 1},
    {"title": "回邮件", "priority": 1},
    {"title": "开会", "priority": 2},
]

result = sorted(tasks, key=lambda t: (t["priority"], -ord(t["title"][0])))
# 字典序降序需要单独处理，简单做法是用反向键
```

由于中文字符串字典序降序不能直接用负号，更通用的做法是对优先级升序、标题降序分别处理。利用 `sorted` 是稳定排序的特性，可以分两次排序。

```python
# 先按标题降序
tasks_sorted = sorted(tasks, key=lambda t: t["title"], reverse=True)
# 再按优先级升序（稳定排序保持相同优先级的原有相对顺序）
tasks_sorted = sorted(tasks_sorted, key=lambda t: t["priority"])

for t in tasks_sorted:
    print(t["title"], t["priority"])
```

输出如下。

```
写报告 1
回邮件 1
开会 2
```

利用稳定排序：先排次要键（标题降序），再排主键（优先级升序）。相同优先级的任务保持上一步的相对顺序，即标题降序。这种方法在多条件排序中很实用。
:::

**练习 2** 用 `map` 和 lambda 把以下任务标题列表全部转换为大写（假设为英文标题），再用 `filter` 筛选出长度大于 5 的标题。

```python
titles = ["write report", "meet", "reply email", "read"]
```

::: details 参考答案
```python
titles = ["write report", "meet", "reply email", "read"]

upper_titles = list(map(str.upper, titles))
print(upper_titles)  # ['WRITE REPORT', 'MEET', 'REPLY EMAIL', 'READ']

long_titles = list(filter(lambda s: len(s) > 5, upper_titles))
print(long_titles)  # ['WRITE REPORT', 'REPLY EMAIL']
```

先用 `map(str.upper, titles)` 把每个标题转大写，再用 `filter` 筛选长度大于 5 的。也可以用列表推导式实现同样的功能。

```python
long_titles = [s.upper() for s in titles if len(s) > 5]
print(long_titles)  # ['WRITE REPORT', 'REPLY EMAIL']
```

列表推导式在一次遍历中同时完成转换和过滤，更简洁。
:::

**练习 3** 用 `min` 和 `max` 配合 `key` 参数，找出以下任务列表中耗时最长和最短的任务标题。

```python
tasks = [
    {"title": "写报告", "time": 4},
    {"title": "开会", "time": 1},
    {"title": "回邮件", "time": 2},
]
```

::: details 参考答案
```python
tasks = [
    {"title": "写报告", "time": 4},
    {"title": "开会", "time": 1},
    {"title": "回邮件", "time": 2},
]

longest = max(tasks, key=lambda t: t["time"])
shortest = min(tasks, key=lambda t: t["time"])

print(f"最长: {longest['title']}，耗时 {longest['time']}")  # 最长: 写报告，耗时 4
print(f"最短: {shortest['title']}，耗时 {shortest['time']}")  # 最短: 开会，耗时 1
```

`key=lambda t: t["time"]` 让 `max` 和 `min` 按任务的 `time` 字段比较，返回的是原始任务字典，再用 `["title"]` 取出标题。注意返回的是整个元素而非 key 值。
:::

**练习 4** 用 `functools.reduce` 计算以下嵌套任务列表的所有任务标题拼接后的总长度。请说明 `reduce` 的执行过程。

```python
tasks = ["写报告", "开会", "回邮件", "整理"]
```

::: details 参考答案
```python
from functools import reduce

tasks = ["写报告", "开会", "回邮件", "整理"]
total_length = reduce(lambda acc, t: acc + len(t), tasks, 0)
print(total_length)  # 11
```

`reduce` 的第三个参数 `0` 是初始值。执行过程如下：

第一步，`acc` 为初始值 0，`t` 为 `"写报告"`，`0 + len("写报告")` 得 3。
第二步，`acc` 为 3，`t` 为 `"开会"`，`3 + 2` 得 5。
第三步，`acc` 为 5，`t` 为 `"回邮件"`，`5 + 3` 得 8。
第四步，`acc` 为 8，`t` 为 `"整理"`，`8 + 2` 得 10。

最终结果 10。注意中文字符串的 `len` 返回字符数，`"写报告"` 是 3 个字符。

如果不传初始值，`reduce` 会用序列第一个元素作为初始值，但此时 `acc` 是字符串、`t` 也是字符串，`acc + len(t)` 会因类型不匹配而报错。因此这里必须传初始值 0。
:::

## 常见错误

**错误 1 · `TypeError: 'map' object is not subscriptable` 或 `filter` 结果为空**

原因：Python 3 中 `map` 和 `filter` 返回迭代器而非列表，无法直接用索引访问，且只能遍历一次。遍历后再访问就为空。

解决：用 `list(map(...))` 或 `list(filter(...))` 把迭代器转换为列表后再使用。

**错误 2 · `TypeError: '<' not supported between instances of 'dict' and 'dict'`**

原因：调用 `sorted` 或 `min`/`max` 时未传 `key` 参数，Python 尝试直接比较字典对象本身，字典不支持大小比较。

解决：传入 `key=lambda t: t["priority"]` 之类的函数，让排序或比较基于字典的某个字段进行。

**错误 3 · lambda 中写多行语句报 `SyntaxError`**

原因：lambda 只能包含单个表达式，不能包含赋值、`if` 语句块、`for` 循环、`while` 等语句。试图用 `;` 分隔多语句或写赋值会触发语法错误。

解决：复杂逻辑改用 `def` 定义命名函数。lambda 仅用于一行能表达清楚的简单逻辑。

**错误 4 · `reduce` 不传初始值导致类型不匹配**

现象：`reduce(lambda acc, x: acc + len(x), strings)` 报 `TypeError: unsupported operand type(s) for +: 'str' and 'int'`。

原因：未传第三个初始值参数时，`reduce` 用序列第一个元素作为初始 `acc`。此时 `acc` 是字符串，`acc + len(x)` 把字符串与整数相加，类型不匹配。

解决：传入与累加操作匹配的初始值，如 `reduce(lambda acc, x: acc + len(x), strings, 0)`，让 `acc` 始终是整数。
