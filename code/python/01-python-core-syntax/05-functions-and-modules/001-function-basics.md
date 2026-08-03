---
title: 5.1 函数定义与调用基础
sidebar:
  order: 1
---
# 5.1 函数定义与调用基础

写命令行任务管理器时，把任务列表打印出来这段逻辑会在多个地方反复使用：启动时展示一次，新增任务后展示一次，完成任务后再展示一次。如果把打印代码原样复制三份，一旦显示格式要调整，就得改三处，很容易漏掉一处导致显示不一致。函数就是解决这种重复的利器。把一段逻辑封装成函数，取个名字，之后用名字就能调用，修改时只需改函数内部一处。本节讲解 Python 函数的定义语法、返回值机制、调用方式，以及函数本身就是对象这一核心特性。

## 5.1.1 def 语法

Python 用 `def` 关键字定义函数，后面跟函数名、一对圆括号包住参数列表、一个冒号，然后缩进的代码块就是函数体。函数名遵循与变量相同的命名规则，按 PEP 8 规范使用小写加下划线。函数体必须缩进，至少包含一条语句，如果暂时不写实现可以用 `pass` 占位。

下面是任务管理器中打印任务列表的函数。

```python
def show_tasks(tasks):
    if not tasks:
        print("暂无任务")
        return
    for index, task in enumerate(tasks, start=1):
        print(f"{index}. {task}")
```

`def show_tasks(tasks):` 这一行声明了一个名为 `show_tasks` 的函数，接受一个参数 `tasks`。函数体先判断列表是否为空，空则打印提示并返回；非空则用 `enumerate` 带序号遍历打印。定义函数只是把代码块绑定到一个名字上，此时函数体内的代码并不会执行，要等到调用时才运行。

## 5.1.2 return 语句

`return` 语句把一个值从函数内部送回给调用方，同时结束函数执行。`return` 后面可以跟一个表达式，表达式的值就是函数的返回值。调用函数时，可以用变量接收返回值，也可以直接把函数调用当作一个值参与运算。

```python
def add(a, b):
    return a + b

result = add(3, 5)
print(result)  # 8
print(add(2, 4) * 10)  # 60，函数调用直接参与运算
```

`add(3, 5)` 返回 8，赋值给 `result`。`add(2, 4)` 返回 6，直接乘以 10 得到 60。函数调用本身就是一个表达式，只要它能返回值，就可以出现在任何需要值的地方，比如赋值语句右边、`print` 的参数、条件判断中。

## 5.1.3 无 return 时返回 None

函数可以没有 `return` 语句，或者 `return` 后面不带任何表达式。这两种情况下函数都会返回 `None`。`None` 是 Python 表示空的特殊值，表示没有有意义的返回内容。

```python
def greet(name):
    print(f"你好，{name}")

result = greet("张三")
print(result)  # None
print(result is None)  # True
```

`greet` 函数只负责打印，没有 `return`，调用后 `result` 拿到的是 `None`。`show_tasks` 这类以副作用（打印、写文件、修改外部状态）为主要目的的函数，通常不需要返回值，调用方也不会去接收它的返回值。不过 Python 仍然会返回 `None`，这是统一的设计，让所有函数调用都是表达式。

`return` 后不带表达式也返回 `None`，常用于在函数中间提前退出。

```python
def find_task(tasks, keyword):
    for task in tasks:
        if keyword in task:
            return task
    return  # 没找到，返回 None
```

循环结束后没找到匹配项，`return` 单独一行，等价于 `return None`。这种写法明确表示函数到此结束，可读性比省略 `return` 更好。

## 5.1.4 函数调用

函数定义后，用函数名加圆括号调用，圆括号内填入实际参数。调用时执行函数体，遇到 `return` 或函数体结束就返回调用处继续往下执行。函数必须先定义再调用，Python 解释器从上到下执行，遇到调用语句时函数定义必须已经存在。

```python
tasks = ["写报告", "回复邮件", "开会"]

show_tasks(tasks)
```

输出如下。

```
1. 写报告
2. 回复邮件
3. 开会
```

调用 `show_tasks(tasks)` 时，实参 `tasks` 传给形参 `tasks`，函数体执行打印。函数体内 `return` 触发或代码走完后，控制权回到调用处。函数可以在任何能写语句的地方调用，包括其他函数内部、循环体、条件分支中。

## 5.1.5 函数调用作为表达式

函数调用产生一个值（可能是 `None`），可以作为表达式的一部分参与运算或判断。这一点让函数能灵活地嵌入到各种上下文中。

```python
def count_done(tasks):
    count = 0
    for task in tasks:
        if task.startswith("[完成]"):
            count += 1
    return count

tasks = ["[完成]写报告", "回复邮件", "[完成]开会"]

# 函数调用用在条件判断中
if count_done(tasks) > 0:
    print(f"已完成 {count_done(tasks)} 项任务")

# 函数调用用在 print 中
print(f"剩余 {len(tasks) - count_done(tasks)} 项未完成")
```

`count_done(tasks)` 返回已完成的任务数，这个返回值直接用在 `if` 条件和 `print` 中，无需先存到变量里。不过当同一个函数调用结果要多次使用时，像上例那样调用了三次 `count_done`，最好先存到一个变量里复用，避免重复计算。

## 5.1.6 函数是对象

Python 中函数是一等对象，与整数、字符串一样，可以被赋值给变量、作为参数传递、作为返回值返回。函数名是一个变量，指向内存中的函数对象。理解这一点是掌握后续高阶函数、装饰器等概念的基础。

把函数赋值给另一个变量，就创建了函数的别名。

```python
def show_tasks(tasks):
    for index, task in enumerate(tasks, start=1):
        print(f"{index}. {task}")

display = show_tasks  # display 现在也指向同一个函数对象
display(["任务一", "任务二"])
```

`display = show_tasks` 把 `show_tasks` 引用的函数对象赋值给 `display`，两者指向同一个函数。用 `display(...)` 调用和用 `show_tasks(...)` 调用效果完全一样。这种机制在给函数取更贴合上下文的别名时有用。

## 5.1.7 函数作为参数传递

既然函数是对象，就可以作为参数传给另一个函数。接收函数作为参数的函数称为高阶函数。这是函数式编程的基础，后续章节会展开讲解，这里先建立基本认识。

```python
def apply_to_tasks(tasks, action):
    for task in tasks:
        action(task)

def print_upper(task):
    print(task.upper())

tasks = ["写报告", "回复邮件"]
apply_to_tasks(tasks, print_upper)
```

`apply_to_tasks` 接受一个任务列表和一个函数 `action`，对每个任务调用 `action`。传入 `print_upper` 后，每个任务被转换成大写打印。`print_upper` 作为实参传递时只写函数名，不加圆括号，加圆括号就变成调用它了。

## 5.1.8 函数作为返回值

函数也可以作为另一个函数的返回值，这种用法常用于动态生成函数或形成闭包。闭包的完整机制会在作用域章节展开，这里只看基本形式。

```python
def make_greeting(prefix):
    def greet(name):
        print(f"{prefix}，{name}")
    return greet

morning_greet = make_greeting("早上好")
morning_greet("张三")  # 早上好，张三
```

`make_greeting` 内部定义了 `greet` 函数，并把 `greet` 作为返回值。外部拿到的 `morning_greet` 是内层函数对象，调用它时能用到外层函数的 `prefix` 变量，这就是闭包的雏形。

## 5.1.9 \_\_name\_\_ 和 \_\_doc\_\_ 属性

函数对象自带一些属性，常用的有 `__name__` 和 `__doc__`。`__name__` 存储函数定义时的名字，即使函数被赋值给其他变量，`__name__` 仍保持原定义名。`__doc__` 存储函数的文档字符串，即函数体第一行的三引号字符串。

```python
def show_tasks(tasks):
    """打印任务列表，每项带序号。"""
    for index, task in enumerate(tasks, start=1):
        print(f"{index}. {task}")

print(show_tasks.__name__)  # show_tasks
print(show_tasks.__doc__)   # 打印任务列表，每项带序号。

display = show_tasks
print(display.__name__)  # 依然是 show_tasks
```

`display` 虽然是新的变量名，但它指向的函数对象的 `__name__` 仍然是 `show_tasks`。这一特性在调试、日志记录时很有用，可以获取函数的真实名称。`__doc__` 文档字符串是 Python 函数文档的主要载体，养成写文档字符串的习惯能让代码更易维护。

## 5.1.10 help() 函数

内置函数 `help()` 会读取函数的文档字符串并格式化输出，是查看函数用法的便捷工具。在交互式环境中，`help(函数名)` 能立即看到该函数的说明。

```python
def add_task(tasks, title, priority=1):
    """向任务列表添加一项任务。

    参数:
        tasks: 任务列表
        title: 任务标题
        priority: 优先级，1 最高，5 最低
    """
    tasks.append({"title": title, "priority": priority})

help(add_task)
```

在交互式终端运行 `help(add_task)` 会打印出文档字符串的完整内容。Python 内置函数和标准库函数都配有文档字符串，遇到不熟悉的函数时，`help()` 是最快的查询方式，不必每次都去翻网页。多行文档字符串通常包含功能说明、参数说明、返回值说明，格式规范会在代码组织章节详细讲解。

::: tip 文档字符串的位置
文档字符串必须是函数体第一条语句，写在 `def` 行之后、其他逻辑之前。Python 解释器会自动把它存到函数对象的 `__doc__` 属性。如果放在其他位置，它就只是普通字符串，不会被识别为文档。
:::

## 练习题

**练习 1** 编写一个函数 `format_task(title, status)`，接收任务标题和状态字符串，返回格式化后的字符串 `[状态] 标题`。例如 `format_task("写报告", "进行中")` 返回 `"[进行中] 写报告"`。

::: details 参考答案
```python
def format_task(title, status):
    return f"[{status}] {title}"

print(format_task("写报告", "进行中"))  # [进行中] 写报告
```
函数用 f-string 拼接格式化字符串并 `return` 返回。注意这里函数有返回值，调用时用变量接收或直接打印返回结果。
:::

**练习 2** 以下函数没有 `return` 语句，调用 `result = print_summary(3)` 后 `result` 的值是什么？请说明原因。

```python
def print_summary(count):
    print(f"共 {count} 项任务")
```

::: details 参考答案
`result` 的值是 `None`。函数没有 `return` 语句时，Python 自动返回 `None`。可以用 `print(result is None)` 验证得到 `True`。以打印为主要目的的函数通常不需要返回值，但调用方仍会拿到 `None`。
:::

**练习 3** 将下面的打印逻辑封装成函数 `show_first_task(tasks)`，打印列表中第一个任务，列表为空时打印提示信息。并为函数编写文档字符串，然后用 `help()` 查看效果。

```python
tasks = ["写报告", "回复邮件"]
# 待封装的打印逻辑
if tasks:
    print(f"第一个任务: {tasks[0]}")
else:
    print("任务列表为空")
```

::: details 参考答案
```python
def show_first_task(tasks):
    """打印任务列表中的第一个任务，列表为空时给出提示。"""
    if tasks:
        print(f"第一个任务: {tasks[0]}")
    else:
        print("任务列表为空")

show_first_task(["写报告", "回复邮件"])  # 第一个任务: 写报告
show_first_task([])  # 任务列表为空
help(show_first_task)
```
文档字符串作为函数体第一条语句，会被 `help()` 读取并显示。函数内部用 `if tasks` 判断列表是否为空，空列表在布尔上下文中为假。
:::

**练习 4** 把函数赋值给另一个变量后，新变量的 `__name__` 属性值是什么？编写代码验证你的判断。

::: details 参考答案
新变量的 `__name__` 属性值是函数**定义时**的名字，不会因为赋值给新变量而改变。

```python
def delete_task(tasks, index):
    """删除指定索引的任务。"""
    tasks.pop(index)

remove = delete_task
print(remove.__name__)  # delete_task
```
`remove` 和 `delete_task` 指向同一个函数对象，该对象的 `__name__` 始终是 `delete_task`。这说明函数名只是指向函数对象的引用，赋值操作创建的是新引用，不改变函数对象本身的属性。
:::

## 常见错误

**错误 1 · `NameError: name 'show_tasks' is not defined`**

原因：调用函数的代码写在函数定义之前。Python 解释器从上到下执行，遇到调用语句时函数定义还未加载到命名空间。

解决：把函数定义放在调用之前，或把调用语句放入 `if __name__ == "__main__":` 块中，确保定义先于调用执行。

**错误 2 · `TypeError: show_tasks() missing 1 required positional argument: 'tasks'`**

原因：调用函数时实参数量少于必填形参。位置参数必须按数量和顺序匹配，缺一不可。

解决：补全缺失的实参，或为形参设置默认值使其变为可选。

**错误 3 · 函数调用结果为 `None`，后续操作报 `AttributeError: 'NoneType' object has no attribute ...`**

原因：函数没有 `return` 语句或 `return` 后未跟表达式，Python 自动返回 `None`。调用方把 `None` 当成有意义的返回值继续使用。

解决：检查函数是否需要返回值。若需要，补上 `return 表达式`；若只是副作用函数，调用方不应接收或操作其返回值。

**错误 4 · 引用函数对象时误加圆括号，导致函数被立即调用**

原因：把函数作为参数传递或赋值时写成 `func()` 而非 `func`。`func` 是函数对象本身，`func()` 是调用函数并取其返回值。

解决：传递函数引用时只写函数名，不带圆括号。需要调用时再加圆括号。
