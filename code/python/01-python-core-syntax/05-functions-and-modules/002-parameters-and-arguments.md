---
title: 5.2 参数传递机制
sidebar:
  order: 2
---
# 5.2 参数传递机制

任务管理器里添加任务的函数 `add_task(tasks, title, priority=3)` 用到了三种参数：`tasks` 和 `title` 必须按顺序传入，`priority` 有默认值可以省略。这种混合用法在 Python 中非常普遍，掌握参数的各种传递方式，才能写出调用方便、不易出错的函数。本节从最基础的位置参数讲起，逐步覆盖关键字参数、默认参数、可变参数 `*args` 和 `**kwargs`、关键字专属参数、位置专属参数、实参解包，最后讨论对象引用传递这一容易被误解的机制。

## 5.2.1 位置参数

位置参数是最基本的参数形式。调用函数时，实参按顺序对应到形参，第一个实参给第一个形参，第二个实参给第二个形参，依此类推。参数的数量必须匹配，多了或少了都会报 `TypeError`。

```python
def add_task(tasks, title, priority):
    tasks.append({"title": title, "priority": priority})

tasks = []
add_task(tasks, "写报告", 2)
print(tasks)  # [{'title': '写报告', 'priority': 2}]
```

调用 `add_task(tasks, "写报告", 2)` 时，`tasks` 对应形参 `tasks`，`"写报告"` 对应 `title`，`2` 对应 `priority`，完全按位置匹配。位置参数的好处是简洁，缺点是调用方需要记住每个位置的含义，参数多了容易搞混顺序。

## 5.2.2 关键字参数

调用函数时可以用 `形参名=值` 的形式指定实参，这种实参称为关键字参数。使用关键字参数后，实参的顺序不再重要，只要名字对应即可。当函数参数较多时，关键字参数能显著提升代码可读性。

```python
add_task(tasks, title="回复邮件", priority=1)
add_task(tasks, priority=4, title="整理桌面")  # 顺序无关
print(tasks)
# [{'title': '写报告', 'priority': 2}, {'title': '回复邮件', 'priority': 1}, {'title': '整理桌面', 'priority': 4}]
```

两次调用都用了关键字参数，第二次故意把 `priority` 写在 `title` 前面，依然能正确匹配。关键字参数让调用意图一目了然，不必回去看函数定义就能知道每个值的含义。位置参数和关键字参数可以混用，但位置参数必须写在关键字参数前面。

```python
add_task(tasks, "开会", priority=3)  # 合法，位置参数在前
add_task(tasks, title="开会", 3)     # 报错，关键字参数后不能跟位置参数
```

## 5.2.3 默认参数

定义函数时可以给形参指定默认值，调用时若不传该参数，就使用默认值。默认值让函数在常见场景下调用更简洁，只传必要参数即可。带默认值的参数必须写在无默认值参数之后。

```python
def add_task(tasks, title, priority=3):
    tasks.append({"title": title, "priority": priority})

tasks = []
add_task(tasks, "写报告")        # priority 取默认值 3
add_task(tasks, "开会", priority=1)  # priority 显式传 1
print(tasks)
# [{'title': '写报告', 'priority': 3}, {'title': '开会', 'priority': 1}]
```

第一次调用省略了 `priority`，函数内部使用默认值 3。第二次调用显式传入 1，覆盖了默认值。默认参数的值在函数定义时计算一次，这一点会引出一个重要陷阱，稍后讲解。

## 5.2.4 可变默认参数陷阱

当默认值是列表、字典等可变对象时，会出现一个经典陷阱。由于默认值在函数定义时只计算一次，所有调用共享同一个默认对象，对它的修改会累积下来。

```python
def add_task(title, tasks=[]):  # 错误写法
    tasks.append(title)
    return tasks

print(add_task("写报告"))  # ['写报告']
print(add_task("开会"))    # ['写报告', '开会']，第一次的任务还在
```

第二次调用时没有传 `tasks`，使用的是默认值，而这个默认值正是第一次调用后被修改过的那个列表。`tasks=[]` 在定义时创建了一个空列表对象，后续所有省略 `tasks` 的调用都共享这一个对象。这几乎总是与预期不符。

## 5.2.5 用 None 解决可变默认参数陷阱

正确的做法是把默认值设为 `None`，在函数内部判断并创建新对象。这样每次调用不传参时，都会得到一个全新的空列表。

```python
def add_task(title, tasks=None):
    if tasks is None:
        tasks = []
    tasks.append(title)
    return tasks

print(add_task("写报告"))  # ['写报告']
print(add_task("开会"))    # ['开会']，互不影响
```

`tasks is None` 判断是否未传参，是则创建新列表。这是 Python 中处理可变默认参数的标准模式，适用于列表、字典、集合等所有可变对象。不可变对象（如整数、字符串、`None`）作为默认值不会有这个问题，因为它们无法被原地修改。

## 5.2.6 可变位置参数 *args

在形参名前加 `*`，该参数会收集多余的位置实参，组装成一个元组。这种参数常用于函数需要接受任意数量的位置参数的场景。

```python
def add_many_tasks(tasks, *titles):
    for title in titles:
        tasks.append({"title": title, "priority": 3})
    return tasks

tasks = []
add_many_tasks(tasks, "写报告", "开会", "回邮件")
print(tasks)
# [{'title': '写报告', 'priority': 3}, {'title': '开会', 'priority': 3}, {'title': '回邮件', 'priority': 3}]
```

`*titles` 收集了 `"写报告"`、`"开会"`、`"回邮件"` 三个实参，组成元组 `("写报告", "开会", "回邮件")`。函数内部用 `for` 遍历这个元组逐个处理。`tasks` 作为第一个位置参数正常匹配，`*titles` 只收集它之后的多余实参。

## 5.2.7 可变关键字参数 **kwargs

在形参名前加 `**`，该参数会收集多余的关键字实参，组装成一个字典。`kwargs` 是约定俗成的名字，意为 keyword arguments。它常与 `*args` 配合，构建灵活的函数接口。

```python
def add_task(title, **extra):
    task = {"title": title}
    task.update(extra)
    return task

print(add_task("写报告", priority=2, deadline="周五", tag="紧急"))
# {'title': '写报告', 'priority': 2, 'deadline': '周五', 'tag': '紧急'}
```

`priority=2`、`deadline="周五"`、`tag="紧急"` 这些关键字实参被 `**extra` 收集成字典 `{"priority": 2, "deadline": "周五", "tag": "紧急"}`，再用 `update` 合并到任务字典里。这种写法让函数能接受任意附加字段，扩展性很强。

## 5.2.8 参数顺序规则

当各种参数混合使用时，定义顺序必须遵循固定规则：普通位置参数、默认参数、`*args`、关键字专属参数、`**kwargs`。违反这个顺序会报语法错误。

```python
def func(a, b=1, *args, c, d=2, **kwargs):
    print(f"a={a}, b={b}, args={args}, c={c}, d={d}, kwargs={kwargs}")

func(10, 20, 30, 40, c=100, e=200, f=300)
# a=10, b=20, args=(30, 40), c=100, d=2, kwargs={'e': 200, 'f': 300}
```

`a` 是位置参数，`b` 有默认值，`*args` 收集多余位置实参 `(30, 40)`，`c` 和 `d` 是关键字专属参数（必须用关键字传入），`**kwargs` 收集剩余关键字实参。实际开发中很少同时用全所有类型，但理解顺序规则有助于读懂复杂函数签名。

## 5.2.9 关键字专属参数

在 `*` 之后定义的形参称为关键字专属参数，调用时必须用关键字传入，不能用位置。`*` 可以单独使用，也可以是 `*args`，二者之后的所有形参都成为关键字专属。

```python
def add_task(tasks, title, *, priority=3, tag=None):
    tasks.append({"title": title, "priority": priority, "tag": tag})

tasks = []
add_task(tasks, "写报告", priority=1, tag="紧急")  # 合法
add_task(tasks, "开会", 1, "紧急")  # 报错，priority 和 tag 必须用关键字
```

`*` 把 `priority` 和 `tag` 标记为关键字专属，调用时必须写 `priority=1` 这种形式。这种设计能避免参数顺序混淆，特别是当函数有多个有默认值的参数时，强制关键字能让调用更清晰、更不容易出错。

## 5.2.10 位置专属参数

Python 3.8 引入了位置专属参数，在 `/` 之前定义的形参只能按位置传入，不能用关键字。`/` 之前的位置专属参数和 `*` 之后的关键字专属参数，把参数严格分成了三类。

```python
def get_task(tasks, index, /):
    return tasks[index]

tasks = ["写报告", "开会"]
print(get_task(tasks, 0))       # 写报告，合法
print(get_task(tasks, index=0)) # 报错，index 是位置专属，不能用关键字
```

位置专属参数主要用于把参数名作为实现细节隐藏起来，允许将来改名而不影响调用方。标准库中一些内置函数大量使用了这一特性。日常开发中用得较少，了解其含义即可。

## 5.2.11 完整的参数混合形式

把位置专属参数、普通参数、`*args`、关键字专属参数、`**kwargs` 全部组合起来，就得到最完整的函数签名形式。

```python
def create_task(title, /, priority=3, *tags, urgent, **extra):
    print(f"title={title}, priority={priority}, tags={tags}, urgent={urgent}, extra={extra}")

create_task("写报告", 2, "工作", "本周", urgent=True, deadline="周五")
# title=写报告, priority=2, tags=('工作', '本周'), urgent=True, extra={'deadline': '周五'}
```

`title` 在 `/` 前是位置专属参数，`priority` 是带默认值的普通参数，`*tags` 收集多余位置实参，`urgent` 是关键字专属参数，`**extra` 收集剩余关键字实参。实际项目中这种完整签名很少见，多数函数只用其中两三种。

## 5.2.12 实参解包 *

调用函数时，可以在实参前加 `*`，把可迭代对象（列表、元组等）展开成多个位置实参。这称为实参解包，常用于把一个序列的元素分别传给函数的各个参数。

```python
def add_task(tasks, title, priority):
    tasks.append({"title": title, "priority": priority})

tasks = []
info = ["写报告", 2]
add_task(tasks, *info)  # 等价于 add_task(tasks, "写报告", 2)
print(tasks)  # [{'title': '写报告', 'priority': 2}]
```

`*info` 把列表 `["写报告", 2]` 展开成两个独立实参，分别对应 `title` 和 `priority`。当数据以列表或元组形式存在，又需要传给多个参数的函数时，解包写法比手动取索引更简洁。

## 5.2.13 实参解包 **

类似地，`**` 可以把字典展开成关键字实参。字典的键必须是字符串，与函数的形参名对应。

```python
def add_task(tasks, title, priority, tag):
    tasks.append({"title": title, "priority": priority, "tag": tag})

tasks = []
data = {"title": "写报告", "priority": 2, "tag": "工作"}
add_task(tasks, **data)  # 等价于 add_task(tasks, title="写报告", priority=2, tag="工作")
print(tasks)
```

`**data` 把字典展开成三个关键字实参。`*` 和 `**` 解包可以同时使用，前者展开序列到位置参数，后者展开字典到关键字参数。解包让函数调用与数据结构之间转换非常方便。

## 5.2.14 对象引用传递机制

Python 的参数传递机制常被描述为对象引用传递，更准确的说法是传共享。函数接收到的就是实参所引用对象的引用，形参和实参指向同一个对象，函数内部对形参的操作会影响到这个共享对象。

理解这一机制的关键在于区分两类操作。对变量重新赋值，是让变量指向一个新对象，不影响原对象和其他引用。对可变对象进行原地修改，是改变对象本身，所有引用该对象的变量都能看到变化。

## 5.2.15 不可变对象作为参数

不可变对象（整数、字符串、元组等）作为参数传入时，函数内部无法修改原对象，因为不可变对象不支持原地修改。函数内对形参重新赋值只是让形参指向新对象，外部变量不受影响。

```python
def try_double(value):
    value = value * 2
    return value

n = 5
result = try_double(n)
print(n)      # 5，外部 n 不变
print(result) # 10
```

`value = value * 2` 在函数内部创建了一个新整数 10，让形参 `value` 指向它，外部变量 `n` 仍指向原来的 5。整数是不可变对象，没有原地翻倍的操作，任何看似修改的赋值都产生新对象。字符串、元组同理。

## 5.2.16 可变对象作为参数

可变对象（列表、字典、集合等）作为参数传入时，函数内部可以原地修改对象，这种修改对调用方可见。这是函数产生副作用的主要来源，需要谨慎对待。

```python
def clear_tasks(tasks):
    tasks.clear()

tasks = ["写报告", "开会"]
clear_tasks(tasks)
print(tasks)  # []，原列表被清空
```

`tasks.clear()` 是原地操作，清空了形参 `tasks` 指向的列表对象，由于实参和形参指向同一对象，外部 `tasks` 也变空了。这有时是期望行为（如函数的职责就是修改传入对象），有时会引发意外。如果不想让函数修改外部对象，应在函数入口先做拷贝。

## 5.2.17 避免函数意外修改外部对象

当函数需要读取或处理可变参数但不应修改它时，可以在函数入口传入副本，或由调用方传入副本。传入副本后，函数内部的修改只作用于副本，原对象安全。

```python
def count_high_priority(tasks):
    tasks_copy = list(tasks)  # 防御性拷贝
    # 即使后续误改 tasks_copy，也不影响外部
    return sum(1 for t in tasks_copy if t.get("priority", 5) <= 2)

tasks = [{"title": "写报告", "priority": 1}, {"title": "开会", "priority": 4}]
print(count_high_priority(tasks))  # 1
```

调用方也可以主动传入副本：`count_high_priority(tasks.copy())`。在函数接口设计中，应明确约定函数是否会修改传入对象，约定不修改的函数应在内部做防御性拷贝或在文档中声明。这能减少共享状态带来的难以追踪的 bug。

::: warning 可变默认参数务必用 None
列表、字典、集合作为默认参数值是最常见的 Python 陷阱之一。记住一个原则：可变默认值一律用 `None` 占位，在函数体内创建新对象。这条规则能避免绝大多数相关 bug。
:::

## 练习题

**练习 1** 定义函数 `search_task(tasks, keyword, case_sensitive=False)`，在任务列表中搜索包含关键词的任务。`case_sensitive` 为 `True` 时区分大小写，为 `False` 时不区分。调用时分别省略和传入 `case_sensitive` 测试两种情况。

::: details 参考答案
```python
def search_task(tasks, keyword, case_sensitive=False):
    results = []
    for task in tasks:
        title = task if isinstance(task, str) else task.get("title", "")
        if case_sensitive:
            if keyword in title:
                results.append(task)
        else:
            if keyword.lower() in title.lower():
                results.append(task)
    return results

tasks = ["写报告", "回复邮件", "写周报"]
print(search_task(tasks, "写"))       # ['写报告', '写周报']，不区分大小写
print(search_task(tasks, "写", case_sensitive=True))  # ['写报告', '写周报']
print(search_task(tasks, "WRITE", case_sensitive=False))  # []，不区分时小写匹配
```
`case_sensitive` 有默认值 `False`，调用时省略它即使用默认值。函数内部根据该参数选择匹配方式。这里关键词为中文时大小写无区别，英文场景下区别明显。
:::

**练习 2** 以下函数有可变默认参数陷阱，请说明问题并修正。

```python
def append_note(note, notes=[]):
    notes.append(note)
    return notes
```

::: details 参考答案
默认值 `[]` 在函数定义时创建一次，所有省略 `notes` 的调用共享同一个列表，导致前一次调用追加的内容残留到后一次调用。

修正方式是把默认值改为 `None`，函数内部创建新列表。

```python
def append_note(note, notes=None):
    if notes is None:
        notes = []
    notes.append(note)
    return notes

print(append_note("第一条"))  # ['第一条']
print(append_note("第二条"))  # ['第二条']，互不影响
```
:::

**练习 3** 编写函数 `add_task(tasks, title, *, priority=3, tag=None)`，要求 `priority` 和 `tag` 必须用关键字传入。然后准备一个字典 `{"title": "开会", "priority": 1, "tag": "紧急"}`，用 `**` 解包方式调用该函数。

::: details 参考答案
```python
def add_task(tasks, title, *, priority=3, tag=None):
    tasks.append({"title": title, "priority": priority, "tag": tag})
    return tasks

tasks = []
data = {"title": "开会", "priority": 1, "tag": "紧急"}
add_task(tasks, **data)
print(tasks)  # [{'title': '开会', 'priority': 1, 'tag': '紧急'}]
```
`*` 让其后的 `priority` 和 `tag` 成为关键字专属参数。`**data` 把字典展开为关键字实参，分别传给对应形参。注意 `title` 在 `*` 之前，是位置参数，字典中的 `"title"` 键通过解包也能正确匹配。
:::

**练习 4** 以下代码运行后 `numbers` 的值是什么？请用对象引用传递机制解释原因。

```python
def modify(lst):
    lst.append(99)
    lst = [0, 0, 0]

numbers = [1, 2, 3]
modify(numbers)
```

::: details 参考答案
`numbers` 的值是 `[1, 2, 3, 99]`。

函数内 `lst.append(99)` 是原地修改，作用于实参和形参共同指向的列表对象，所以列表变成了 `[1, 2, 3, 99]`。随后 `lst = [0, 0, 0]` 是重新赋值，让形参 `lst` 指向一个全新的列表对象，这一操作只影响函数内部的局部变量 `lst`，不影响外部的 `numbers`。函数结束后局部变量 `lst` 销毁，`numbers` 仍指向被 `append` 修改过的那个列表。

这体现了区分两类操作的关键：原地修改影响外部，重新赋值不影响外部。
:::

## 常见错误

**错误 1 · `TypeError: add_task() got multiple values for argument 'tasks'`**

原因：调用函数时，同一个形参既被位置实参匹配，又被关键字实参指定，导致冲突。常见于 `*args` 解包后再用关键字传同名列。

解决：检查调用语句，确保每个形参只通过一种方式传值。位置实参对应的形参不要再用关键字重复传入。

**错误 2 · `SyntaxError: positional argument follows keyword argument`**

原因：调用函数时把位置参数写在了关键字参数之后。Python 语法要求位置参数必须在关键字参数之前。

解决：调整实参顺序，把所有位置参数放在前面，关键字参数放在后面。

**错误 3 · 可变默认参数导致多次调用共享状态**

现象：`def add_task(title, tasks=[])` 连续调用多次，`tasks` 列表中累积了之前调用追加的内容，而非每次都是空列表。

原因：默认值 `[]` 在函数定义时只创建一次，所有省略 `tasks` 的调用共享同一个列表对象，修改会累积。

解决：可变默认值一律用 `None` 占位，在函数体内判断 `if tasks is None: tasks = []` 创建新对象。

**错误 4 · `TypeError: add_task() got an unexpected keyword argument 'priorities'`**

原因：用 `**dict` 解包调用函数时，字典的键与形参名不匹配，或函数没有定义 `**kwargs` 来接收多余的关键字实参。

解决：检查字典键名是否与函数形参名完全一致，或在函数定义中加上 `**kwargs` 收集剩余关键字参数。
