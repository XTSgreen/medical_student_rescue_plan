---
title: 3.8 上下文管理控制结构
sidebar:
  order: 8
---
# 3.8 上下文管理控制结构

    
资源管理是程序设计中绕不开的话题。无论是文件、数据库连接还是线程锁，都需要遵循使用前申请、使用后释放的模式。如果在每次使用后忘记释放，资源会逐渐积累造成泄漏；如果在异常发生时跳过释放代码，问题会更加隐蔽。Python 通过 with 语句提供了一套结构化的资源管理机制，把进入和退出两个动作封装成协议，让资源释放不再依赖开发者的记忆，而是由语言机制保证。本节将介绍 with 语句的语法、协议原理、多管理器组合以及自动清理机制，并简要提及 contextlib 模块中的常用工具。

## 3.8.1 with 语句的基本语法（with 表达式 as 变量:）

with 语句的基本形式是 `with 表达式 as 变量:` 后跟一个代码块。表达式必须返回一个实现了上下文管理协议的对象，as 子句把该对象的 `__enter__` 方法返回值绑定到变量。代码块执行完毕后，无论是否抛出异常，对象的 `__exit__` 方法都会被调用。

```python
with open("data.txt", "w") as f:
    f.write("hello")
# 离开 with 块后文件自动关闭，无需手动 f.close()
```

上例中 `open()` 返回的文件对象实现了上下文管理协议，`__enter__` 返回文件对象本身，赋值给 f。代码块结束时 `__exit__` 被调用，内部执行 `f.close()`。即使 write 过程中抛出异常，文件也会被正确关闭。

## 3.8.2 with 语句的进入与退出协议（__enter__ 和 __exit__）

任何类只要定义了 `__enter__` 和 `__exit__` 两个特殊方法，就可以作为上下文管理器使用。`__enter__(self)` 在进入 with 块时被调用，返回值通过 as 绑定给变量。`__exit__(self, exc_type, exc_val, exc_tb)` 在离开 with 块时被调用，三个参数分别是异常类型、异常实例和调用栈对象，没有异常时三个参数都为 None。

```python
class Timer:
    def __enter__(self):
        import time
        self.start = time.time()
        print("开始计时")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.elapsed = time.time() - self.start
        print(f"耗时 {self.elapsed:.4f} 秒")
        # 返回 False 或 None 表示不抑制异常
        return False

with Timer() as t:
    total = sum(range(1000000))
# 开始计时
# 耗时 0.0512 秒
```

`__exit__` 的返回值很关键。返回 True（或真值）表示异常已被处理，with 块中抛出的异常不会继续向外传播；返回 False 或 None 则异常继续传播。绝大多数上下文管理器只做清理工作，不处理异常，应当返回 False 或直接省略 return。

## 3.8.3 with 语句中 as 子句的可选性（可省略）

as 子句是可选的。当 `__enter__` 的返回值不需要在 with 块中使用时，可以省略 as 子句。常见的场景是只需要管理器的副作用（如锁的获取与释放），不需要拿到管理器对象本身。

```python
import threading

lock = threading.Lock()

# 不需要使用 lock 的返回值（Lock 的 __enter__ 返回的是 True）
with lock:
    # 临界区代码
    shared_counter = 0
    shared_counter += 1
# 离开 with 块自动释放锁
```

对于文件这种需要拿到对象才能操作的场景，as 必须写；对于锁、计时器等只需要副作用的场景，as 可以省略。是否省略取决于业务逻辑是否需要使用 `__enter__` 的返回值。

## 3.8.4 多个上下文管理器在同一 with 语句中同时使用（with A() as a, B() as b:）

当多个资源需要同时管理时，可以在一个 with 语句中写多个上下文管理器，用逗号分隔。它们按从左到右的顺序调用 `__enter__`，退出时按从右到左的顺序调用 `__exit__`，符合后进先出的栈式释放顺序。

```python
with open("input.txt") as fin, open("output.txt", "w") as fout:
    content = fin.read()
    fout.write(content.upper())
# 两个文件都会被正确关闭
```

Python 3.10 起还支持用括号把多个管理器换行书写，便于格式化长语句：

```python
with (
    open("input.txt") as fin,
    open("output.txt", "w") as fout,
):
    fout.write(fin.read().upper())
```

多管理器写法比嵌套多个 with 更紧凑，也避免了缩进过深。当多个资源在逻辑上属于同一次操作时，把它们放在同一个 with 语句中表达更清晰。

## 3.8.5 with 语句自动释放资源（文件、锁、数据库连接等，仅概念）

with 语句的核心价值在于把资源释放从开发者必须记得调用 close/release 变成语言机制保证执行。常见的可管理资源包括文件、线程锁、数据库连接、网络套接字、临时文件等。它们的共同点是使用后必须显式释放，否则会造成文件描述符耗尽、死锁、连接数超限等系统级问题。

下面演示一个数据库连接的简化模型。Connection 类在 `__enter__` 中申请连接，在 `__exit__` 中归还连接，调用方只需要写业务逻辑，不必关心连接的归还。

```python
class Connection:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print(f"申请连接 {self.name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"归还连接 {self.name}")
        return False

    def query(self, sql):
        print(f"执行查询：{sql}")

with Connection("db1") as conn:
    conn.query("SELECT 1")
# 申请连接 db1
# 执行查询：SELECT 1
# 归还连接 db1
```

::: note 为什么要用 with 管理资源
直接调用 close 或 release 看起来也不复杂，但在异常分支较多、函数提前 return 或多人协作维护的代码中，遗漏释放是高频错误。with 把释放动作固化到协议中，是降低这类错误的有效手段。
:::

## 3.8.6 with 语句在异常时的清理机制（__exit__ 处理异常）

with 块中的代码抛出异常时，`__exit__` 仍会被调用，并把异常信息作为三个参数传入。这一机制确保资源在任何情况下都能被清理。如果 `__exit__` 返回 False 或 None，异常继续向外传播；返回 True 则异常被吞掉，调用方看不到任何错误。

```python
class SafeFile:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.f = open(self.path, "w")
        print("文件已打开")
        return self.f

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.f.close()
        print(f"文件已关闭，异常类型：{exc_type.__name__ if exc_type else '无'}")
        return False  # 不抑制异常，继续传播

try:
    with SafeFile("test.txt") as f:
        f.write("部分内容")
        raise ValueError("模拟业务异常")
except ValueError as e:
    print(f"上层捕获：{e}")
# 文件已打开
# 文件已关闭，异常类型：ValueError
# 上层捕获：模拟业务异常
```

可以看到，即使 with 块中途抛出异常，文件依然被关闭，上层也能正确捕获到原始异常。这种清理加透传的设计让 with 既能保证资源安全，又不会掩盖程序错误，是异常处理与资源管理的优雅结合。需要谨慎使用 `__exit__` 返回 True 抑制异常的写法，因为它会让真正的错误消失在沉默中。

## 3.8.7 contextlib 模块中的 contextmanager 装饰器（仅列名称）

contextlib 是 Python 标准库中专门为上下文管理提供辅助工具的模块。其中 `contextmanager` 是一个装饰器，把一个生成器函数转换成上下文管理器，避免每次都写完整的类。生成器中 `yield` 之前的代码对应 `__enter__`，`yield` 之后的代码对应 `__exit__`，yield 出的值通过 as 绑定给变量。本节仅列出该工具的名称，详细用法和示例在后续模块化章节展开。

```python
# 仅展示概念，详细用法见后续章节
from contextlib import contextmanager

@contextmanager
def demo():
    print("进入")
    yield "value"
    print("退出")

with demo() as v:
    print(f"使用 {v}")
# 进入
# 使用 value
# 退出
```

## 3.8.8 contextlib 模块中的 closing 上下文管理器（仅列名称）

contextlib 模块还提供了 `closing` 这一现成的上下文管理器，用于包装任意提供 `close()` 方法的对象，在 with 块结束时自动调用其 `close()`。closing 适合那些不直接实现 `__enter__` 和 `__exit__` 但有 close 方法的对象，比如 urllib 返回的响应对象。本节仅列出名称，详细用法在涉及具体资源处理的章节展开。

```python
# 仅展示概念，详细用法见后续章节
from contextlib import closing
from urllib.request import urlopen

with closing(urlopen("http://example.com")) as response:
    html = response.read()
# 离开 with 块自动调用 response.close()
```

closing 内部实现非常简单，本质上就是用 `__enter__` 返回原对象，在 `__exit__` 中调用其 `close()`。在第三方库中遇到只有 close 方法的资源时，用 closing 包装是便捷的统一处理方式。

## 练习题

### 第 1 题：解释 with 语句相对于手动 close 的优势

假设有一段代码先打开文件写入内容，再调用 `close()` 关闭。如果写入过程中抛出异常，文件可能不会被关闭。请说明用 `with` 语句如何避免这个问题。

::: details 参考答案
手动关闭的写法如下：

```python
f = open("data.txt", "w")
f.write("hello")
f.close()
```

如果 `write` 抛出异常，`close()` 不会被执行，文件描述符泄漏。

用 `with` 语句改写：

```python
with open("data.txt", "w") as f:
    f.write("hello")
```

`with` 语句保证无论 `write` 是否抛出异常，离开 `with` 块时 `__exit__` 都会被调用，文件自动关闭。资源释放从依赖开发者记忆变成由语言机制保证，这是 `with` 的核心价值。
:::

### 第 2 题：用 with 语句同时管理两个文件

请用一条 `with` 语句同时打开输入文件和输出文件，把输入文件的内容读取后转换为大写写入输出文件。可以用内存中的字符串模拟文件内容。

::: details 参考答案
```python
# 模拟输入文件内容
input_content = "hello world"

# 实际使用时替换为真实文件路径
# with open("input.txt", encoding="utf-8") as fin, \
#      open("output.txt", "w", encoding="utf-8") as fout:
#     fout.write(fin.read().upper())

# 这里用 io 模块模拟
import io
fin = io.StringIO(input_content)
fout = io.StringIO()

with fin, fout:
    fout.write(fin.read().upper())

print(fout.getvalue())
```

输出 `HELLO WORLD`。一条 `with` 语句管理多个资源，按从左到右的顺序进入，按从右到左的顺序退出，符合后进先出的栈式释放顺序。比嵌套两个 `with` 更紧凑，也避免了缩进过深。
:::

### 第 3 题：实现一个自定义上下文管理器

请实现一个 `Timer` 类作为上下文管理器，在进入 `with` 块时记录开始时间，在退出时计算并打印耗时。`__exit__` 应返回 `False` 让异常继续传播。

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
        print(f"耗时 {elapsed:.6f} 秒")
        return False


with Timer():
    total = sum(range(1000000))
    print("计算完成")
```

输出形如：

```
开始计时
计算完成
耗时 0.041234 秒
```

`__enter__` 返回 `self` 让调用方可以通过 `as` 拿到管理器对象。`__exit__` 返回 `False` 表示不抑制异常，即使 `with` 块中抛出异常也会继续向外传播，让计时器只负责计时而不掩盖错误。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器需要把任务列表保存到文件，保存完成后文件必须被正确关闭。请用 `with` 语句编写保存函数，即使写入过程出错也能保证文件关闭。

::: details 参考答案
```python
def save_tasks(tasks, path):
    with open(path, "w", encoding="utf-8") as f:
        for task in tasks:
            f.write(task + "\n")


tasks = ["写文档", "评审代码", "修复 Bug"]
save_tasks(tasks, "tasks.txt")
print("保存完成")
```

`with open(...)` 保证文件在任何情况下都会被关闭，即使 `write` 抛出异常。这是任务管理器持久化功能的基础写法，后续可以扩展为写入 JSON 或其他格式。把文件操作封装在函数中，让调用方只关心业务数据，资源管理细节由 `with` 语句处理。
:::

## 常见错误

**错误 1 · `AttributeError: __enter__`**

原因:`with` 语句的对象未实现上下文管理器协议（`__enter__` 和 `__exit__` 方法）。只有定义了这两个方法的对象才能用于 `with` 语句。

解决:检查对象的类型，确认它实现了 `__enter__` 和 `__exit__`。对于只有 `close()` 方法的对象，用 `contextlib.closing()` 包装。

**错误 2 · `__exit__ 返回 True 后异常被静默吞掉`**

原因:`__exit__` 方法返回真值时，with 块中抛出的异常会被抑制，不再向外传播。调用方看不到任何错误信号。

解决:`__exit__` 只做资源清理时返回 `False` 或省略 return 语句。仅在确需吞掉异常的特定场景才返回 `True`，并记录日志。

**错误 3 · `as 变量绑定到意外的值`**

原因:`as` 绑定的是 `__enter__` 方法的返回值，而非上下文管理器对象本身。如果 `__enter__` 返回的不是 `self`，`as` 变量与 `with` 表达式中的对象不同。

解决:阅读上下文管理器的文档，确认 `__enter__` 返回什么。自定义管理器时，通常 `__enter__` 返回 `self`，但如果需要返回内部资源对象则除外。
