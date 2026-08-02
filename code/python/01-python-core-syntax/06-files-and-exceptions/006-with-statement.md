---
title: 6.6 上下文管理语句
sidebar:
  order: 6
---
# 6.6 上下文管理语句（with）

第 3 章已经从控制结构角度介绍了 with 语句的角色。本章聚焦于文件操作场景，深入讲解 with 语句如何保证文件被正确关闭，以及上下文管理协议的工作原理。文件操作最容易出错的地方是忘记关闭文件或在异常时跳过关闭。with 语句把资源获取和释放封装成一对操作，无论代码块中发生什么，资源都能被正确释放。本节将讲解 with 的语法、`__enter__` 和 `__exit__` 协议、多管理器组合、异常处理机制，以及 contextlib 模块的常用工具。任务管理器在每次读写任务文件时都应使用 with 语句，这是保证数据安全的基线实践。

## 6.6.1 with 语句的语法

with 语句的基本形式是 `with 表达式 as 变量:` 后跟一个代码块。表达式必须返回一个实现了上下文管理协议的对象，`as` 子句把 `__enter__` 方法的返回值绑定到变量。代码块执行完毕后，无论是否抛出异常，`__exit__` 方法都会被调用。

```python
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("学习 with 语句\n")
# 离开 with 块后文件自动关闭
print(f.closed)  # True
```

这段代码中，`open()` 返回的文件对象实现了上下文管理协议。进入 with 块时调用 `__enter__`，返回文件对象本身，赋值给 `f`。代码块结束后调用 `__exit__`，内部执行 `f.close()`。即使 `write()` 过程中抛出异常，文件也会被正确关闭。

`as` 子句可以省略。当不需要使用 `__enter__` 的返回值时，省略 as 让代码更简洁。文件操作中通常需要文件对象来读写，所以 as 一般不能省略；但锁、计时器等只需要副作用的场景可以省略。

## 6.6.2 __enter__ 和 __exit__ 协议

任何类只要定义了 `__enter__` 和 `__exit__` 两个特殊方法，就可以作为上下文管理器。`__enter__(self)` 在进入 with 块时被调用，返回值通过 as 绑定给变量。`__exit__(self, exc_type, exc_val, exc_tb)` 在离开 with 块时被调用，三个参数分别是异常类型、异常实例和调用栈对象，没有异常时三个参数都为 None。

```python
class TaskFile:
    """封装任务文件操作的上下文管理器"""
    def __init__(self, path, mode="r"):
        self.path = path
        self.mode = mode

    def __enter__(self):
        self.f = open(self.path, self.mode, encoding="utf-8")
        print(f"打开文件：{self.path}")
        return self.f

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.f.close()
        print(f"关闭文件：{self.path}")
        return False  # 不抑制异常

with TaskFile("tasks.txt", "w") as f:
    f.write("测试自定义上下文管理器\n")
# 打开文件：tasks.txt
# 关闭文件：tasks.txt
```

`__enter__` 通常执行资源申请操作，如打开文件、获取锁、建立连接，然后返回资源对象或自身。`__exit__` 执行资源释放操作，如关闭文件、释放锁、归还连接。

`__exit__` 的返回值很关键。返回 `True`（或真值）表示异常已被处理，with 块中抛出的异常不会继续向外传播；返回 `False` 或 `None` 则异常继续传播。绝大多数上下文管理器只做清理工作，不处理异常，应当返回 `False` 或直接省略 return。

## 6.6.3 文件对象作为上下文管理器

文件对象天然实现了上下文管理协议，`__enter__` 返回文件对象自身，`__exit__` 调用 `close()`。这就是 `with open(...) as f:` 能自动关闭文件的原因。

```python
# 等价于手动 try-finally
f = open("tasks.txt", "r", encoding="utf-8")
try:
    content = f.read()
finally:
    f.close()

# with 写法更简洁
with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()
```

两种写法在功能上等价，with 语句是 `try-finally` 加 `close()` 的语法糖。区别在于 with 更简洁，且不会遗漏 close 调用。在异常处理方面，with 块中的异常会先传给 `__exit__`，`__exit__` 关闭文件后返回 False，异常继续传播到上层。

## 6.6.4 多个上下文管理器组合

当多个资源需要同时管理时，可以在一个 with 语句中写多个上下文管理器，用逗号分隔。它们按从左到右的顺序调用 `__enter__`，退出时按从右到左的顺序调用 `__exit__`，符合后进先出的栈式释放顺序。

```python
# 同时打开输入和输出文件
with open("input.txt", "r", encoding="utf-8") as fin, \
     open("output.txt", "w", encoding="utf-8") as fout:
    for line in fin:
        fout.write(line.upper())
# 两个文件都会被正确关闭
```

Python 3.10 起支持用括号把多个管理器换行书写，便于格式化长语句：

```python
with (
    open("input.txt", "r", encoding="utf-8") as fin,
    open("output.txt", "w", encoding="utf-8") as fout,
):
    fout.write(fin.read().upper())
```

多管理器写法比嵌套多个 with 更紧凑，也避免了缩进过深。任务管理器在备份任务文件时，需要同时读取源文件和写入目标文件，多管理器组合是自然的选择。

需要注意 `__enter__` 的调用顺序。如果第一个管理器的 `__enter__` 抛出异常，后续管理器不会被调用。如果第二个管理器的 `__enter__` 抛出异常，第一个管理器的 `__exit__` 会被调用以释放已获取的资源。这种栈式释放保证了部分获取的资源也能被正确清理。

## 6.6.5 __exit__ 的异常处理

with 块中的代码抛出异常时，`__exit__` 仍会被调用，并把异常信息作为三个参数传入。这一机制确保资源在任何情况下都能被清理。如果 `__exit__` 返回 False 或 None，异常继续向外传播；返回 True 则异常被吞掉，调用方看不到任何错误。

```python
class SafeFile:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.f = open(self.path, "w", encoding="utf-8")
        print("文件已打开")
        return self.f

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.f.close()
        print(f"文件已关闭，异常：{exc_type.__name__ if exc_type else '无'}")
        return False  # 异常继续传播

try:
    with SafeFile("test.txt") as f:
        f.write("部分内容")
        raise ValueError("模拟业务异常")
except ValueError as e:
    print(f"上层捕获：{e}")
# 文件已打开
# 文件已关闭，异常：ValueError
# 上层捕获：模拟业务异常
```

即使 with 块中途抛出异常，文件依然被关闭，上层也能正确捕获到原始异常。这种清理加透传的设计让 with 既能保证资源安全，又不会掩盖程序错误。

::: warning 谨慎使用 __exit__ 返回 True
让 `__exit__` 返回 True 抑制异常会让真正的错误消失在沉默中，通常是有害的。只有在极少数场景下才需要这种行为，比如上下文管理器本身就是为了把某些异常转换为正常控制流。日常使用中，`__exit__` 只做清理，返回 False 或不写 return。
:::

## 6.6.6 with 与 try-finally 的等价关系

with 语句在语义上等价于 `try-finally` 结构。以下两段代码的行为完全一致：

```python
# with 写法
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("数据")

# 等价的 try-finally 写法
f = open("tasks.txt", "w", encoding="utf-8")
try:
    f.write("数据")
finally:
    f.close()
```

with 语句的优势在于把 `close()` 调用固化到协议中，开发者无需每次都写 try-finally。更重要的是，with 不会因为忘记写 finally 而遗漏 close。当代码中有多个资源、多个 return 点时，手动写 try-finally 容易出错，with 语句从语言层面消除了这类错误。

理解这一等价关系有助于在阅读旧代码时把 try-finally 模式识别为上下文管理，也便于在需要自定义资源管理时选择合适的实现方式。

## 6.6.7 contextlib 模块简介

Python 标准库的 `contextlib` 模块提供了一系列上下文管理相关的辅助工具，避免每次都从头编写完整的类。本节简要介绍其中两个常用工具，详细用法在后续模块化章节展开。

### contextmanager 装饰器

`contextmanager` 是一个装饰器，把一个生成器函数转换成上下文管理器。生成器中 `yield` 之前的代码对应 `__enter__`，`yield` 之后的代码对应 `__exit__`，yield 出的值通过 as 绑定给变量。

```python
from contextlib import contextmanager

@contextmanager
def open_task_file(path, mode="r"):
    f = open(path, mode, encoding="utf-8")
    try:
        print(f"打开 {path}")
        yield f
    finally:
        f.close()
        print(f"关闭 {path}")

with open_task_file("tasks.txt", "w") as f:
    f.write("使用 contextmanager\n")
# 打开 tasks.txt
# 关闭 tasks.txt
```

`contextmanager` 让自定义上下文管理器变得简洁，适合简单的资源管理场景。需要注意的是，`yield` 之前的代码如果抛出异常，`__enter__` 失败，with 语句不会执行；`yield` 之后的代码在 `finally` 块中，保证无论是否异常都会执行。

### closing 上下文管理器

`closing` 是一个现成的上下文管理器，用于包装任意提供 `close()` 方法的对象，在 with 块结束时自动调用其 `close()`。closing 适合那些不直接实现 `__enter__` 和 `__exit__` 但有 close 方法的对象。

```python
from contextlib import closing
from urllib.request import urlopen

with closing(urlopen("http://example.com")) as response:
    html = response.read()
# 离开 with 块自动调用 response.close()
```

closing 内部实现非常简单，`__enter__` 返回原对象，`__exit__` 调用其 `close()`。在第三方库中遇到只有 close 方法的资源时，用 closing 包装是便捷的统一处理方式。

::: note ExitStack 简介
contextlib 还提供了 `ExitStack`，用于动态管理数量可变的上下文管理器。当需要管理的资源数量在运行时才能确定时，ExitStack 比固定写法的多管理器 with 更灵活。本节仅提及名称，详细用法在后续章节展开。
:::

## 6.6.8 文件操作中 with 的最佳实践

在文件操作中，with 语句的使用有几条实践原则。第一，凡是打开文件都应使用 with，无论读写、无论文件大小。第二，with 块内完成所有需要文件对象的操作，离开 with 块后不再使用文件对象。第三，需要同时操作多个文件时，用多管理器组合，而不是嵌套多个 with。第四，with 块尽量短小，只包含与文件操作直接相关的代码，业务逻辑放到 with 块之外。

```python
# 推荐：with 块只做文件操作，业务逻辑在外
def load_and_process(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    # 在 with 块外处理数据
    tasks = [line.strip() for line in lines]
    return tasks
```

把数据处理放到 with 块之外，可以让文件尽快关闭，减少资源占用时间。如果数据处理过程中发生错误，也不会因为还在 with 块内而延迟文件关闭。

## 练习题

1. 把以下手动关闭文件的代码改写为使用 with 语句的等价形式，并说明 with 写法的优势。

```python
f = open("tasks.txt", "r", encoding="utf-8")
try:
    content = f.read()
finally:
    f.close()
```

::: details 参考答案
```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()
```
两种写法功能等价，with 写法的优势在于：代码更简洁，无需手动写 try-finally；close 调用由协议保证，不会遗漏；即使 read 过程中抛出异常，文件也会被正确关闭；代码意图更清晰，一眼就能看出 f 是一个需要自动管理的资源。
:::

2. 实现一个自定义上下文管理器 `Timer`，进入 with 块时记录开始时间并打印"开始计时"，退出时计算耗时并打印。要求 `__enter__` 返回管理器对象本身，且异常不被抑制。

::: details 参考答案
```python
import time

class Timer:
    def __enter__(self):
        self.start = time.time()
        print("开始计时")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.time() - self.start
        print(f"耗时 {elapsed:.4f} 秒")
        return False  # 不抑制异常

# 使用示例
with Timer() as t:
    total = sum(range(1000000))
# 开始计时
# 耗时 0.0512 秒
```
`__enter__` 记录开始时间并返回 self，`__exit__` 计算耗时并打印，返回 False 保证异常正常传播。`return self` 让调用方可以在 with 块内通过 t 访问管理器对象，比如读取 `t.start`。
:::

3. 以下代码同时打开两个文件进行复制操作，但使用了嵌套的 with 语句。请改写为单层多管理器写法，并说明多管理器的进入和退出顺序。

```python
with open("src.txt", "r", encoding="utf-8") as fin:
    with open("dst.txt", "w", encoding="utf-8") as fout:
        fout.write(fin.read())
```

::: details 参考答案
```python
with open("src.txt", "r", encoding="utf-8") as fin, \
     open("dst.txt", "w", encoding="utf-8") as fout:
    fout.write(fin.read())
```
或 Python 3.10+ 的括号写法：
```python
with (
    open("src.txt", "r", encoding="utf-8") as fin,
    open("dst.txt", "w", encoding="utf-8") as fout,
):
    fout.write(fin.read())
```
多管理器的进入顺序是从左到右：先调用 `fin` 的 `__enter__`，再调用 `fout` 的 `__enter__`。退出顺序是从右到左：先调用 `fout` 的 `__exit__`（关闭目标文件），再调用 `fin` 的 `__exit__`（关闭源文件）。这种后进先出的栈式顺序保证了后获取的资源先释放，符合资源依赖关系。
:::

4. 解释 `__exit__` 方法返回 `True` 和返回 `False` 的区别。在什么情况下（如果有的话）返回 `True` 是合理的？

::: details 参考答案
`__exit__` 返回 `True` 表示异常已被处理，with 块中抛出的异常不会继续向外传播，调用方感知不到异常发生。返回 `False` 或 `None` 表示异常未被处理，异常继续向外传播，由上层 try-except 或解释器处理。

返回 `True` 在极少数场景下是合理的：上下文管理器的职责就是把某种异常转换为正常控制流。例如一个重试管理器，在 `__exit__` 中检查异常类型，如果是可重试的异常就返回 True 抑制它，并在内部重新执行操作；又如事务管理器，捕获特定的回滚异常后返回 True，让调用方看到正常结果。

绝大多数情况下应当返回 `False`，因为抑制异常会掩盖真正的程序错误，让问题难以排查。文件管理器、锁管理器等只做资源清理的管理器，永远不应该吞掉异常。
:::

## 常见错误

**错误 1 · `AttributeError: __enter__`**

原因:把一个未实现上下文管理协议的对象（没有 `__enter__` 和 `__exit__` 方法）用在 with 语句中。常见于把普通对象或函数返回值当作上下文管理器使用，或自定义类忘记实现这两个特殊方法。

解决:确认 with 语句中的表达式返回的对象实现了 `__enter__` 和 `__exit__` 方法。文件对象、锁对象等标准库资源都已实现协议。自定义类需要显式定义这两个方法，或用 `contextlib.contextmanager` 装饰器把生成器函数转为上下文管理器。

**错误 2 · `ValueError: I/O operation on closed file.`**

原因:在 with 块结束后仍然使用文件对象进行读写。with 块退出时 `__exit__` 已经调用 `close()` 关闭文件，之后再访问文件对象就会抛出异常。常见于把文件操作放在 with 块之外，或把文件对象赋值给外部变量后延迟使用。

解决:所有文件读写操作都放在 with 块内完成。需要在外部使用文件内容时，在 with 块内把数据读取到字符串或列表变量中，with 块外只使用这些数据变量而非文件对象本身。

**错误 3 · 程序异常被静默吞掉，无报错信息**

原因:自定义上下文管理器的 `__exit__` 方法返回了 `True`，导致 with 块中抛出的异常被抑制，调用方感知不到错误。这是上下文管理器设计上的常见错误，会让真正的 bug 隐藏在沉默中。

解决:`__exit__` 方法只做资源清理时返回 `False` 或省略 return 语句。只有在明确需要把异常转换为正常控制流的特殊场景下才返回 `True`，如重试管理器或事务回滚管理器。
