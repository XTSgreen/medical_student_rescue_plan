---
title: 6.11 断言与调试辅助
sidebar:
  order: 11
---
# 6.11 断言与调试辅助

开发过程中，开发者经常需要确认程序内部状态是否符合预期，比如函数的参数满足某种约束、循环不变量成立、函数返回值类型正确。断言是表达这类内部检查的轻量级机制，条件不满足时立即抛出异常，帮助在开发阶段快速发现逻辑错误。断言与异常处理服务于不同目标：断言面向开发者的内部不变量检查，异常处理面向运行时的外部错误。本节将讲解 assert 语句的用法、断言的禁用机制、断言与异常处理的区别，以及 `sys.exc_info()` 和 `traceback` 模块等调试辅助工具。任务管理器在开发阶段可以用断言验证任务数据的内部一致性。

## 6.11.1 assert 语句语法

`assert` 语句用于断言某个条件必须为 True。基本语法是 `assert condition`，当 condition 为 False 时抛出 `AssertionError`。`assert` 是关键字，不是函数，后面的条件是一个表达式。

```python
def calculate_average(values):
    assert len(values) > 0
    return sum(values) / len(values)

print(calculate_average([1, 2, 3]))  # 2.0
print(calculate_average([]))         # 抛出 AssertionError
```

这段代码中断言列表非空，如果传入空列表，`sum(values) / len(values)` 会触发除零错误。断言在除零之前就抛出异常，提前暴露了调用方的问题。assert 表达的是这个条件必须成立，否则就是程序写错了，它面向开发者而非用户。

## 6.11.2 assert 带错误消息

`assert` 的完整语法是 `assert condition, message`，其中 message 是可选的。当 condition 为 False 时抛出 `AssertionError`，并把 message 作为异常参数；不写 message 时抛出的 `AssertionError` 不带任何参数。

```python
def process_task(task):
    assert isinstance(task, dict), "task 必须是字典"
    assert "id" in task, "task 必须包含 id 字段"
    assert isinstance(task["id"], int), "task 的 id 必须是整数"
    print(f"处理任务 {task['id']}")

process_task({"id": 1, "name": "测试"})  # 处理任务 1
process_task("不是字典")                  # AssertionError: task 必须是字典
process_task({})                         # AssertionError: task 必须包含 id 字段
```

可选的 message 帮助在断言失败时快速定位问题，建议所有 assert 都带上说明性消息。message 也可以是任意表达式，断言失败时会计算并展示该表达式的值：

```python
def divide(a, b):
    assert b != 0, f"除数不能为零，收到 b={b}"
    return a / b

try:
    divide(10, 0)
except AssertionError as e:
    print(e)  # 除数不能为零，收到 b=0
```

## 6.11.3 AssertionError 异常

`AssertionError` 继承自 `Exception`，是 assert 失败时抛出的异常类型。它和普通异常一样可以被 try-except 捕获，但通常不应当捕获。断言失败意味着程序内部逻辑有错误，应当让程序停止并修复代码，而不是捕获后继续运行。

```python
# 不推荐：捕获 AssertionError
try:
    assert False, "不应该执行到这里"
except AssertionError:
    print("断言失败了，但我们继续运行")  # 掩盖了逻辑错误
```

捕获 `AssertionError` 通常意味着把开发期检查当成了运行时错误处理，这是误用。如果某个检查在运行时也可能失败，应当用 `if` 加 `raise` 而不是 `assert`。

## 6.11.4 断言的禁用机制 -O 优化模式

Python 解释器在以 `-O` 优化模式启动时（命令行加 `python -O script.py`）会跳过所有 assert 语句的执行，相当于它们根本不存在。这一机制意味着 assert 不能用于任何依赖副作用的逻辑，更不能用于参数校验。

```python
# script.py
def divide(a, b):
    assert b != 0, "除数不能为零"
    return a / b

print(divide(10, 0))
```

```bash
# 正常模式：抛出 AssertionError: 除数不能为零
python script.py

# 优化模式：assert 被跳过，发生 ZeroDivisionError
python -O script.py
```

在正常模式下，`divide(10, 0)` 在断言处就抛出 `AssertionError`，提示除数不能为零。在优化模式下，assert 被完全跳过，程序继续执行到 `return a / b`，触发 `ZeroDivisionError`。两种模式下的行为完全不同，这是 assert 不能用于生产环境校验的原因。

::: warning 不要依赖 assert 做安全检查
凡是涉及外部输入、权限校验、业务规则约束的检查，都要写成普通的 if 加 raise，不要用 assert。一旦程序以优化模式运行，所有 assert 都会失效，可能导致严重的安全或数据问题。
:::

## 6.11.5 __debug__ 内置变量

`__debug__` 是 Python 的内置布尔变量，与 assert 机制紧密相关。正常模式下 `__debug__` 为 True，断言语句会执行；优化模式（`-O`）下 `__debug__` 为 False，断言语句被跳过。

```python
print(__debug__)  # True（正常模式）

if __debug__:
    # 这段代码在 -O 模式下会被跳过
    print("调试信息：程序启动")
```

`__debug__` 为 False 时，Python 在编译阶段就会移除 `if __debug__:` 块中的代码，效果与 assert 的禁用类似。可以用 `__debug__` 编写仅在调试模式下执行的诊断代码，避免对生产环境性能产生影响。

`__debug__` 是只读变量，尝试给它赋值会抛出 `SyntaxError`。这一设计保证了优化模式的确定性，开发者无法在运行时改变它的值。

## 6.11.6 断言与异常处理的区别

断言和异常处理虽然都涉及错误检测，但目标和使用场景不同。理解它们的区别是正确使用的前提。

**断言**用于验证程序内部的不变量，即开发者认为在正确代码中必须成立的条件。断言失败意味着代码有 bug，应当修复代码而非处理断言。断言面向开发者，在优化模式下被禁用，不应用于运行时检查。

**异常处理**用于应对运行时的外部错误，即程序正确但环境或输入导致的问题。异常面向用户和运行时，始终启用，应当被妥善捕获和处理。

```python
# 断言：验证内部不变量（开发期检查）
def add_task(tasks, task):
    assert isinstance(tasks, list), "tasks 必须是列表（内部约束）"
    tasks.append(task)

# 异常处理：验证外部输入（运行时检查）
def parse_priority(value):
    if not isinstance(value, int):
        raise TypeError("优先级必须是整数")  # 外部输入校验
    if value < 1 or value > 5:
        raise ValueError("优先级必须在 1-5 之间")
    return value
```

`add_task` 中的断言验证的是内部约定：tasks 参数应该是列表。如果断言失败，说明调用方代码有 bug。`parse_priority` 中的 raise 验证的是外部输入：用户提供的优先级值。即使代码正确，用户也可能输入无效值，所以用异常处理。

::: note 简单判断标准
问自己：这个条件失败是因为代码写错了，还是因为外部输入有问题？前者用 assert，后者用 if 加 raise。如果不确定，用 if 加 raise 更安全，因为它不会被优化模式禁用。
:::

## 6.11.7 断言的合理使用场景

断言适合以下场景。第一，函数的前置条件检查，验证参数满足函数正确执行所需的内部约定。第二，函数的后置条件检查，验证返回值符合预期。第三，循环不变量检查，验证循环过程中某个条件始终成立。第四，不可能到达的代码路径标记，用 `assert False` 表示这里不应该被执行到。

```python
def get_task_status(task):
    """根据任务状态码返回状态名"""
    status_code = task["status"]
    if status_code == 0:
        return "pending"
    elif status_code == 1:
        return "in_progress"
    elif status_code == 2:
        return "done"
    else:
        # 不应该到达这里
        assert False, f"未知的状态码：{status_code}"
```

这种用法把 `assert False` 作为穷尽分支后的兜底检查，如果未来新增了状态码但忘记更新这个函数，断言会立即暴露问题。需要注意的是，如果这个函数可能接收外部输入的状态码，应当用 raise 而非 assert。

## 6.11.8 sys.exc_info() 获取异常信息

`sys.exc_info()` 是 sys 模块提供的函数，返回当前正在处理的异常信息。它返回一个三元组 `(type, value, traceback)`，分别是异常类型、异常实例和调用栈对象。在 except 块之外调用时返回三个 None。

```python
import sys

try:
    1 / 0
except ZeroDivisionError:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    print(f"类型：{exc_type.__name__}")   # 类型：ZeroDivisionError
    print(f"实例：{exc_value}")            # 实例：division by zero
    print(f"调用栈：{exc_traceback}")      # 调用栈：<traceback object at ...>
```

`sys.exc_info()` 在早期 Python 中是获取异常信息的常见方式。从 Python 3 引入 `except ... as e:` 后，大多数场景可以直接用异常实例 `e` 替代前两个返回值。`exc_info` 仍有一些不可替代的用途，比如需要在 traceback 对象上做进一步分析，或者在无法使用 as 子句的旧代码中获取异常信息。

## 6.11.9 traceback 模块简介

`traceback` 模块提供了格式化和打印异常调用栈的工具。在日志记录中，把完整的异常调用栈写入日志文件，比只记录异常消息更有助于排查问题。本节简要介绍两个常用的函数。

### traceback.print_exc()

`traceback.print_exc()` 打印当前异常的完整调用栈到标准错误输出，格式与 Python 默认的未捕获异常输出相同。

```python
import traceback

try:
    result = 1 / 0
except ZeroDivisionError:
    traceback.print_exc()
    print("程序继续运行")
```

输出类似：

```
Traceback (most recent call last):
  File "script.py", line 3, in <module>
    result = 1 / 0
ZeroDivisionError: division by zero
程序继续运行
```

### traceback.format_exc()

`traceback.format_exc()` 返回异常调用栈的字符串形式，不直接打印。适合写入日志文件或通过网络发送错误报告。

```python
import traceback
import logging

try:
    process_tasks()
except Exception:
    error_msg = traceback.format_exc()
    logging.error(f"任务处理失败：\n{error_msg}")
```

把 `format_exc()` 的结果写入日志，保留了完整的调用栈信息，事后排查时能看到异常发生的确切位置和调用路径。这是生产环境异常日志的标准做法。

`traceback` 模块还提供了 `print_exception()`、`format_exception()` 等更底层的函数，可以精细控制输出格式。这些函数的详细用法在调试相关章节展开，本节仅介绍常用的两个便捷函数。

## 6.11.10 综合示例：任务管理器的调试辅助

结合断言和调试工具，实现一个带开发期检查和错误日志的任务处理函数。

```python
import traceback
import logging

logging.basicConfig(level=logging.DEBUG)

class TaskProcessor:
    def __init__(self, tasks):
        # 断言：验证内部数据结构的一致性
        assert isinstance(tasks, list), "tasks 必须是列表"
        self.tasks = tasks

    def process(self, task_id):
        # 断言：验证内部状态
        assert task_id > 0, f"task_id 必须为正数，收到 {task_id}"

        try:
            task = self._find_task(task_id)
            result = self._execute_task(task)
        except Exception:
            # 记录完整的异常调用栈到日志
            logging.error(f"处理任务 {task_id} 失败：\n{traceback.format_exc()}")
            raise  # 重新抛出让上层处理

    def _find_task(self, task_id):
        for task in self.tasks:
            if task.get("id") == task_id:
                return task
        raise ValueError(f"任务 {task_id} 不存在")

    def _execute_task(self, task):
        # 断言：验证后置条件
        result = f"已执行：{task['name']}"
        assert isinstance(result, str), "执行结果必须是字符串"
        return result

# 使用示例
processor = TaskProcessor([
    {"id": 1, "name": "学习断言"},
    {"id": 2, "name": "完成练习"},
])

processor.process(1)  # 正常
processor.process(99)  # 任务不存在，记录日志后抛出 ValueError
```

这个示例中，`__init__` 和 `process` 用断言验证内部约定，`process` 用 try-except 捕获运行时异常并用 `traceback.format_exc()` 记录完整调用栈。断言在优化模式下会被跳过，不影响生产环境性能；异常处理始终生效，保证运行时错误被记录和传播。

## 练习题

1. 以下代码用 assert 校验用户输入。解释为什么这种做法是危险的，并改写为正确的形式。

```python
def set_age(age):
    assert age >= 0 and age <= 150, "年龄必须在 0-150 之间"
    print(f"年龄设置为 {age}")

user_input = input("请输入年龄：")
set_age(int(user_input))
```

::: details 参考答案
危险之处在于 assert 在优化模式（`python -O`）下会被完全跳过。如果程序以优化模式运行，年龄校验形同虚设，传入任何值都不会报错，可能导致无效数据被保存。涉及外部输入的校验不应该用 assert。

正确做法是用 if 加 raise：

```python
def set_age(age):
    if age < 0 or age > 150:
        raise ValueError("年龄必须在 0-150 之间")
    print(f"年龄设置为 {age}")

user_input = input("请输入年龄：")
set_age(int(user_input))
```
用 `raise ValueError` 抛出异常，无论是否优化模式都会执行校验。简单判断标准：检查的是外部输入用 if 加 raise，检查的是内部不变量用 assert。
:::

2. 解释 `__debug__` 变量与 assert 的关系。以下代码在正常模式和优化模式下分别输出什么？

```python
def debug_log(message):
    if __debug__:
        print(f"[DEBUG] {message}")

debug_log("程序启动")
print("程序运行中")
```

::: details 参考答案
`__debug__` 是内置布尔变量，正常模式下为 True，优化模式（`-O`）下为 False。assert 语句的执行依赖 `__debug__`，当 `__debug__` 为 False 时，assert 被跳过。同样，`if __debug__:` 块在优化模式下也会被编译器移除。

正常模式输出：
```
[DEBUG] 程序启动
程序运行中
```

优化模式（`python -O script.py`）输出：
```
程序运行中
```
`if __debug__:` 块被完全移除，`debug_log("程序启动")` 调用虽然执行但函数体为空，不打印任何内容。这一机制让开发者可以用 `__debug__` 编写仅调试期运行的诊断代码，生产环境零开销。
:::

3. 写一个函数 `safe_divide(a, b)`，用 assert 验证 a 和 b 都是数字类型（内部约定），用 if 加 raise 验证 b 不为零（运行时检查）。然后写一段调用代码，用 `traceback.format_exc()` 记录异常。

::: details 参考答案
```python
import traceback
import logging

logging.basicConfig(level=logging.ERROR)

def safe_divide(a, b):
    # 断言：验证内部约定（参数应该是数字）
    assert isinstance(a, (int, float)), f"a 必须是数字，收到 {type(a).__name__}"
    assert isinstance(b, (int, float)), f"b 必须是数字，收到 {type(b).__name__}"

    # 运行时检查：除数不能为零
    if b == 0:
        raise ValueError("除数不能为零")

    return a / b

# 调用示例
test_cases = [(10, 2), (10, 0), ("10", 2)]
for a, b in test_cases:
    try:
        result = safe_divide(a, b)
        print(f"{a} / {b} = {result}")
    except Exception:
        error = traceback.format_exc()
        logging.error(f"计算 {a} / {b} 失败：\n{error}")
```
断言验证的是内部约定：调用方应当传入数字类型，传入非数字说明调用代码有 bug。if 加 raise 验证的是运行时情况：即使类型正确，除数仍可能为零，这是合法的运行时错误。`traceback.format_exc()` 捕获完整调用栈写入日志，便于排查。注意 `(10, 0)` 触发 ValueError（运行时检查），`("10", 2)` 触发 AssertionError（内部约定检查）。
:::

4. `sys.exc_info()` 和 `except ... as e` 都能获取异常信息，它们有什么区别？在什么场景下会优先使用 `sys.exc_info()`？

::: details 参考答案
`except ... as e:` 是 Python 3 推荐的方式，直接把异常实例绑定到变量 e，代码简洁可读。它只能获取异常实例，无法直接获取调用栈对象。

`sys.exc_info()` 返回三元组 `(type, value, traceback)`，除了异常类型和实例，还返回 traceback 对象。traceback 对象包含完整的调用栈信息，可以用于深度分析。

大多数场景下 `except ... as e:` 足够，用 `type(e)` 获取类型，`e` 获取实例，`traceback.format_exc()` 获取调用栈字符串。

优先使用 `sys.exc_info()` 的场景包括：需要在 traceback 对象上做程序化分析（如提取特定帧的信息）；在不方便使用 as 子句的旧代码或特殊控制流中获取异常；需要同时获取类型、实例和 traceback 三个对象的场合。日常编程中，`sys.exc_info()` 的使用频率远低于 `except ... as e:`。
:::

## 常见错误

**错误 1 · `python -O` 模式下 assert 校验失效导致安全问题**

原因:Python 以 `-O` 优化模式运行时，所有 assert 语句会被编译器完全移除。如果用 assert 做参数校验、权限检查、数据验证等运行时必须生效的检查，优化模式下这些检查全部失效，可能导致非法数据被处理或安全漏洞。

解决:涉及外部输入、权限校验、业务规则约束的检查，必须用 `if` 加 `raise` 实现，不能用 assert。assert 仅用于开发期的内部不变量检查，如函数前置条件、后置条件、循环不变量等代码本身正确性的验证。

**错误 2 · `assert (condition, message)` 永远为真不报错**

原因:`assert` 是关键字而非函数，`assert (condition, message)` 中的括号让 `condition` 和 `message` 组成了一个二元组。非空元组永远为真值，导致 assert 永远通过，校验形同虚设。这是从函数调用习惯迁移到 assert 时的常见错误。

解决:assert 语句的条件和消息之间用逗号分隔，不要加括号。正确写法是 `assert condition, message`。如果 condition 本身是复杂表达式，可以用括号包裹条件部分：`assert (a > 0 and b > 0), "a 和 b 必须为正"`。

**错误 3 · 捕获 `AssertionError` 掩盖逻辑错误**

原因:用 try-except 捕获 `AssertionError` 并继续运行，把开发期的断言失败当成了运行时错误处理。断言失败意味着代码逻辑有 bug，捕获后继续运行会让程序处于不一致状态，问题被掩盖而非修复。

解决:不捕获 `AssertionError`，让断言失败直接终止程序并暴露调用栈。运行时可能失败的检查用 `if` 加 `raise` 实现，用具体的异常类型（如 `ValueError`、`TypeError`）表达，这些异常才适合被捕获处理。
