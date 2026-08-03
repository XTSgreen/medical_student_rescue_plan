---
title: 5.3 作用域与命名空间
sidebar:
  order: 3
---
# 5.3 作用域与命名空间


任务管理器里有这样一种现象：模块顶层定义了一个任务列表 `tasks`，某个函数内部也定义了同名变量 `tasks`，两者互不干扰。函数内部的 `tasks` 只在函数运行期间存在，函数结束后就消失，外部的 `tasks` 始终不变。这就是作用域在起作用。作用域决定了变量名在哪些范围内有效、何时创建、何时销毁。理解作用域规则，才能避免变量名冲突、意外修改全局状态等问题。本节讲解 Python 的 LEGB 查找规则、`global` 和 `nonlocal` 关键字、闭包基础，以及命名空间的生命周期。

## 5.3.1 什么是作用域

作用域是指变量名在程序中可见的范围。一个变量名并不是在任何地方都能访问的，它只在定义它的作用域内有效。Python 的作用域由函数定义和模块结构决定，函数内部定义的变量只能在函数内部访问，模块顶层定义的变量在整个模块内都能访问。作用域的存在让不同函数可以使用相同的变量名而互不冲突，这是组织大型程序的基础。

与作用域紧密相关的概念是命名空间。命名空间是名字到对象的映射，可以理解为一个字典，键是变量名，值是变量指向的对象。每个作用域都有自己的命名空间，作用域查找变量就是按规则查找对应的命名空间。

## 5.3.2 局部作用域

函数内部定义的变量属于局部作用域。这些变量在函数被调用时创建，函数返回后销毁，外部无法访问。函数的形参也是局部变量，作用域与函数体内定义的变量相同。

```python
def show_count():
    count = 10  # 局部变量
    print(count)

show_count()  # 10
print(count)  # 报错 NameError，count 在函数外不可见
```

`count` 在函数内部定义，是局部变量。函数调用结束后 `count` 被销毁，外部访问会报 `NameError`。每次调用函数都会创建一组新的局部变量，不同调用之间的局部变量互不影响。

## 5.3.3 全局作用域

模块顶层（函数和类之外）定义的变量属于全局作用域，在整个模块内都能访问。全局变量在模块加载时创建，模块卸载时销毁。函数内部可以读取全局变量，但如果要重新赋值就需要特殊声明。

```python
total_tasks = 0  # 全局变量

def add_one():
    print(total_tasks)  # 可以读取全局变量

add_one()  # 0
print(total_tasks)  # 0
```

函数内部直接引用 `total_tasks` 时，Python 先在局部作用域找，没找到，再到全局作用域找，找到了就使用。这种读取是允许的，但若要在函数内修改全局变量的绑定（重新赋值），情况会有所不同，后面会讲解。

## 5.3.4 内置作用域

Python 预定义了一批内置名称，如 `print`、`len`、`int`、`Exception` 等，它们属于内置作用域。内置作用域是最外层的作用域，任何地方都能访问。这些名称存放在 `builtins` 模块中。

```python
print(len([1, 2, 3]))  # 3，print 和 len 都是内置名称
print(int("42"))       # 42
```

`print`、`len`、`int` 都不需要导入就能使用，因为它们在内置作用域中。如果自定义了同名变量，会遮蔽内置名称，这是应避免的做法。

```python
len = 5  # 遮蔽了内置的 len
print(len([1, 2, 3]))  # 报错 TypeError，len 现在是整数不是函数
```

把 `len` 赋值为整数后，`len` 在全局作用域指向整数 5，查找时全局作用域优先于内置作用域，导致调用 `len(...)` 报错。命名变量时应避免与内置名称冲突。

## 5.3.5 LEGB 查找规则

Python 查找一个变量名时，按 LEGB 顺序依次搜索四个作用域：Local（局部）、Enclosing（外层嵌套函数）、Global（全局）、Built-in（内置）。在任一层找到就使用，找不到就到下一层，全部找不到则抛出 `NameError`。

Local 是当前函数内部的作用域。Enclosing 是嵌套函数中外层函数的作用域，只有函数嵌套时才存在。Global 是模块顶层作用域。Built-in 是内置名称所在的最外层作用域。

```python
x = "全局"  # Global

def outer():
    x = "外层"  # Enclosing
    def inner():
        x = "局部"  # Local
        print(x)
    inner()

outer()  # 局部
```

`inner` 内部查找 `x` 时，先在 Local 找到 `"局部"`，直接使用，不再往外找。如果把 `inner` 内部的 `x = "局部"` 删掉，`inner` 在 Local 找不到，就到 Enclosing 找到 `"外层"`。理解 LEGB 顺序能解释大多数变量查找行为。

## 5.3.6 读取全局变量

函数内部可以直接读取全局变量的值，无需任何声明。Python 在局部作用域找不到该名字时，会自动到全局作用域查找。

```python
task_count = 5

def report():
    print(f"当前任务数: {task_count}")

report()  # 当前任务数: 5
```

`report` 内部没有定义 `task_count`，Python 沿 LEGB 顺序在全局作用域找到它。这种读取是隐式的，有时候会让代码难以追踪某个变量的来源，在大型项目中应谨慎依赖全局变量。

## 5.3.7 global 关键字

在函数内部对全局变量重新赋值，需要先用 `global` 声明。否则 Python 会把该名字当作新的局部变量，导致在赋值前读取时报 `UnboundLocalError`。

```python
task_count = 0

def add_task_global():
    global task_count  # 声明使用全局变量
    task_count += 1

add_task_global()
print(task_count)  # 1
```

`global task_count` 告诉 Python，函数内的 `task_count` 指向全局变量，`task_count += 1` 修改的是全局变量本身。如果不写 `global`，Python 认为 `task_count` 是局部变量，而 `+=` 先读取再赋值，读取时局部变量尚未赋值，就会报错。

## 5.3.8 修改全局可变对象无需 global

需要区分的是，修改全局可变对象的内部内容不需要 `global`，因为这属于通过引用修改对象，而非重新赋值。`global` 只在重新绑定变量名时才需要。

```python
tasks = []  # 全局可变对象

def add_task(title):
    tasks.append(title)  # 修改对象内容，无需 global

add_task("写报告")
print(tasks)  # ['写报告']
```

`tasks.append(title)` 修改的是 `tasks` 引用的列表对象本身，没有重新绑定 `tasks` 这个名字，所以不需要 `global`。这与上一节参数传递机制中的可变对象行为一致。如果写成 `tasks = tasks + [title]` 这种重新赋值的形式，就需要 `global` 了。

## 5.3.9 nonlocal 关键字

在嵌套函数中，内层函数要修改外层函数（非全局）的变量，需要用 `nonlocal` 声明。`nonlocal` 只能用于外层函数作用域的变量，不能用于全局变量。

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count  # 声明 count 属于外层函数
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
print(counter())  # 3
```

`make_counter` 内部定义了 `count` 和 `increment`，返回 `increment` 函数。`increment` 用 `nonlocal count` 声明它要修改的是外层函数的 `count`，每次调用 `counter()` 都让这个 `count` 加 1。这就是闭包的核心机制：内层函数捕获了外层函数的变量，外层函数返回后变量依然存活。

## 5.3.10 闭包概念

闭包是指内层函数引用了外层函数的变量，并且外层函数把内层函数返回出去。即使外层函数已经执行完毕，被返回的内层函数仍然能访问那些被引用的变量，这些变量保存在内层函数的闭包中。

```python
def make_priority_filter(priority_level):
    def filter_func(tasks):
        return [t for t in tasks if t.get("priority") == priority_level]
    return filter_func

tasks = [
    {"title": "写报告", "priority": 1},
    {"title": "开会", "priority": 2},
    {"title": "回邮件", "priority": 1},
]

high = make_priority_filter(1)
print(high(tasks))  # [{'title': '写报告', 'priority': 1}, {'title': '回邮件', 'priority': 1}]
```

`make_priority_filter(1)` 执行时，`priority_level` 的值是 1，返回的 `filter_func` 捕获了这个值。`make_priority_filter` 执行结束后，`priority_level` 这个局部变量本应销毁，但由于 `filter_func` 的闭包引用了它，它得以保留。之后调用 `high(tasks)` 时，`filter_func` 仍能用到 `priority_level` 的值 1。

闭包常用于动态生成函数、实现装饰器、保存状态等场景。使用闭包时要注意一个循环变量陷阱，在循环中创建闭包时，闭包捕获的是变量本身而非当时的值，所有闭包共享最后一次循环的值。解决方法是用默认参数把当时的值固定下来。

## 5.3.11 闭包中的循环变量陷阱

在循环中创建多个闭包时，如果闭包引用了循环变量，所有闭包实际引用的是同一个变量，最终都拿到循环结束后的值。这是闭包最常见的陷阱。

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)

print([f() for f in funcs])  # [2, 2, 2]，不是 [0, 1, 2]
```

三个 lambda 都引用了同一个变量 `i`，循环结束后 `i` 的值是 2，所以调用结果都是 2。解决方法是用默认参数把每次循环的值固定下来。

```python
funcs = []
for i in range(3):
    funcs.append(lambda x=i: x)

print([f() for f in funcs])  # [0, 1, 2]
```

`lambda x=i: x` 把当时的 `i` 值作为默认参数绑定到 `x`，每个 lambda 都有自己的 `x`，互不影响。也可以用 `functools.partial` 解决，原理类似。

## 5.3.12 globals() 函数

内置函数 `globals()` 返回当前模块全局命名空间的字典，键是变量名，值是对应的对象。可以通过这个字典读取或修改全局变量。

```python
task_count = 10

def show_globals():
    g = globals()
    print(g["task_count"])  # 10，通过字典访问全局变量
    g["new_var"] = 99       # 等价于在全局定义 new_var = 99

show_globals()
print(new_var)  # 99
```

`globals()` 返回的是真实的字典对象，修改它会直接影响全局命名空间。日常编程中很少直接操作 `globals()`，它主要用于调试、元编程等特殊场景。理解它的存在有助于认识全局作用域的本质就是一个字典。

## 5.3.13 locals() 函数

`locals()` 返回当前局部命名空间的字典。在函数内部调用时，返回该函数的局部变量字典。与 `globals()` 不同，`locals()` 返回的字典通常是只读的副本，不应通过它修改局部变量。

```python
def show_locals(a, b):
    c = a + b
    print(locals())

show_locals(1, 2)
# {'a': 1, 'b': 2, 'c': 3}
```

`locals()` 返回的字典包含了当前函数所有的局部变量和形参。在调试时用它查看当前作用域内的所有变量很方便。不要依赖 `locals()` 修改局部变量，Python 不保证这种修改会生效。

## 5.3.14 命名空间的生命周期

命名空间有其生命周期。局部命名空间在函数被调用时创建，函数返回后销毁，每次调用产生独立的局部命名空间。全局命名空间在模块导入时创建，程序退出或模块卸载时销毁。内置命名空间在 Python 解释器启动时创建，一直存在到解释器退出。

```python
def create_task(title):
    task = {"title": title}  # task 在函数调用时创建
    return task
    # 函数返回后，task 的命名空间销毁
    # 但 task 指向的对象因为被返回，仍被外部引用，不会被回收

result = create_task("写报告")
print(result)  # {'title': '写报告'}
```

`task` 这个名字在函数返回后就不存在了，但它指向的字典对象被返回值引用，所以对象本身存活。命名空间的销毁只意味着名字消失了，对象的回收取决于引用计数和垃圾回收机制。理解命名空间生命周期与对象生命周期的区别，能帮助理清许多关于变量何时可访问、对象何时被释放的疑惑。

::: tip 谨慎使用 global
`global` 让函数能修改全局状态，这会增加代码的耦合度和调试难度。在大多数情况下，应该通过参数传入、返回值传出的方式传递数据，而不是依赖全局变量。只有在确实需要维护全局配置或计数器等场景，才考虑使用 `global`。
:::

## 练习题

**练习 1** 以下代码会输出什么？如果不报错请写出输出，如果报错请说明原因并修正。

```python
count = 0

def increment():
    count += 1
    return count

print(increment())
```

::: details 参考答案
代码会报错 `UnboundLocalError: local variable 'count' referenced before assignment`。

`count += 1` 包含赋值操作，Python 把 `count` 当作局部变量。执行 `+=` 时先读取 `count` 的值，但局部变量 `count` 尚未赋值，所以报错。

修正方式是用 `global` 声明。

```python
count = 0

def increment():
    global count
    count += 1
    return count

print(increment())  # 1
```
:::

**练习 2** 用闭包编写一个函数 `make_task_logger(task_name)`，返回一个函数。每次调用返回的函数，就打印一行 `[task_name] 第 N 次记录`，其中 N 是调用次数，从 1 开始递增。

::: details 参考答案
```python
def make_task_logger(task_name):
    count = 0
    def log():
        nonlocal count
        count += 1
        print(f"[{task_name}] 第 {count} 次记录")
    return log

logger = make_task_logger("写报告")
logger()  # [写报告] 第 1 次记录
logger()  # [写报告] 第 2 次记录
logger()  # [写报告] 第 3 次记录
```
闭包捕获了 `task_name` 和 `count`。`nonlocal count` 让内层函数能修改外层函数的 `count`，每次调用递增。`task_name` 只读取不修改，无需 `nonlocal`。即使 `make_task_logger` 已返回，`count` 和 `task_name` 仍保存在闭包中。
:::

**练习 3** 以下代码输出的结果是 `[2, 2, 2]` 而不是 `[0, 1, 2]`，请解释原因并修正，使输出变为 `[0, 1, 2]`。

```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])
```

::: details 参考答案
三个 lambda 都引用同一个循环变量 `i`，列表推导式结束后 `i` 的值是 2。调用每个 lambda 时都去读取 `i`，得到的都是 2。

修正方法是用默认参数固定每次循环的值。

```python
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```
`lambda i=i: i` 把每次循环时 `i` 的值作为默认参数绑定到形参 `i` 上，每个 lambda 都有自己独立的 `i`，互不影响。这是闭包循环变量陷阱的标准解法。
:::

**练习 4** 判断以下代码中各 `print` 语句的输出，并说明 `globals()` 和 `locals()` 在函数内分别返回什么。

```python
x = 100

def test(a):
    b = a + 1
    print("locals:", locals())
    print("globals x:", globals()["x"])

test(10)
```

::: details 参考答案
输出如下。

```
locals: {'a': 10, 'b': 11}
globals x: 100
```

`locals()` 在函数内部返回当前函数的局部命名空间字典，包含形参 `a` 和局部变量 `b`。`globals()` 返回模块的全局命名空间字典，`globals()["x"]` 取到全局变量 `x` 的值 100。

注意 `locals()` 返回的字典通常只是局部变量的快照副本，不应通过它修改局部变量。`globals()` 返回的是真实字典，修改它会改变全局命名空间。
:::

## 常见错误

**错误 1 · `UnboundLocalError: local variable 'count' referenced before assignment`**

原因：函数内部对全局变量执行了赋值操作（包括 `+=`、`-=`），Python 把该名字视为局部变量，但赋值语句在读取之后才执行，导致读取时局部变量尚未绑定。

解决：在函数内对该变量声明 `global count`，告诉 Python 使用全局名字而非新建局部名字。

**错误 2 · `NameError: name 'task_count' is not defined`**

原因：在函数外访问了只在函数内部定义的局部变量。局部变量在函数返回后销毁，外部无法访问。

解决：把需要在函数外使用的值用 `return` 返回，由调用方接收。若确需跨作用域共享，将其定义为模块级变量并通过参数传入函数。

**错误 3 · 闭包延迟绑定，所有回调拿到循环结束后的值**

现象：在循环中创建多个 lambda 或闭包，调用时全部返回循环变量的最终值，而非各自创建时的值。

原因：闭包捕获的是变量本身而非当时的值。所有闭包共享同一个循环变量，循环结束后该变量已是最终值。

解决：用默认参数把每次循环的值固定下来，写成 `lambda x=i: x`，或用 `functools.partial` 在创建时绑定值。

**错误 4 · 滥用 `global` 修改全局状态导致调试困难**

现象：多个函数通过 `global` 修改同一全局变量，调用顺序不同结果就不同，难以追踪值的变化来源。

原因：`global` 让函数间通过隐式共享状态耦合，破坏了函数的输入输出可预测性。

解决：尽量用参数传入、返回值传出的方式传递数据。只有全局配置或计数器等必要场景才使用 `global`，且应在文档中明确说明。
