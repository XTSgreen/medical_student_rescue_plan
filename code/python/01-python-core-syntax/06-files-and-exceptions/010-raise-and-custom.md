---
title: 6.10 异常抛出与自定义异常
sidebar:
  order: 10
---
# 6.10 异常抛出与自定义异常

除了让解释器自动抛出异常，开发者也可以主动抛出异常来表示程序中的错误条件。在参数校验、业务规则检查、状态验证等场景中，主动抛出语义明确的异常，让调用方有机会决定如何处理，比直接返回错误码或打印消息更加规范。当内置异常类型无法准确描述业务错误时，可以定义自定义异常类，建立项目专属的异常层次。本节将讲解 raise 语句的各种用法、异常链机制、自定义异常类的定义和层次设计，以及 warnings 模块的基本概念。任务管理器在任务优先级校验、任务状态转换等业务逻辑中，需要用自定义异常表达领域特定的错误。

## 6.10.1 raise 语句基本语法

`raise` 语句用于主动抛出异常。最简单的形式是 `raise 异常类型`，抛出指定类型的异常实例。如果只给类名，Python 会自动调用无参构造器创建实例。

```python
def set_priority(priority):
    if priority < 1 or priority > 5:
        raise ValueError
    print(f"优先级设置为 {priority}")

set_priority(3)   # 优先级设置为 3
set_priority(99)  # 抛出 ValueError
```

`raise` 抛出的必须是 `BaseException` 的子类实例，或者异常类本身（此时会自动实例化）。抛出其他类型的对象会抛出 `TypeError`。

## 6.10.2 raise 带异常实例和消息

更常见的用法是抛出带消息的异常实例，方便调用方通过 `str(e)` 获取具体的出错原因。消息应当言简意赅且包含必要的上下文信息。

```python
def set_priority(priority):
    if not isinstance(priority, int):
        raise TypeError(f"优先级必须是整数，收到 {type(priority).__name__}")
    if priority < 1 or priority > 5:
        raise ValueError(f"优先级必须在 1 到 5 之间，收到 {priority}")
    print(f"优先级设置为 {priority}")

try:
    set_priority(99)
except ValueError as e:
    print(e)  # 优先级必须在 1 到 5 之间，收到 99
```

错误消息是给开发者看的诊断信息，应当包含出错的具体值和约束条件。如果是给最终用户的提示，应当由调用方根据异常类型翻译为友好消息，而不是把原始异常消息直接展示。

`raise` 也可以先创建异常实例再抛出，效果与直接在 raise 中构造相同：

```python
error = ValueError("优先级超出范围")
raise error
```

## 6.10.3 raise 不带参数重新抛出

在 except 块内部，使用不带任何参数的 `raise` 会把当前正在处理的异常原封不动地重新抛出。这种写法常用于在记录日志或做局部清理后，依然让异常继续向上传播。

```python
import logging

def load_tasks(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f]
    except FileNotFoundError as e:
        logging.warning(f"任务文件不存在：{path}")
        raise  # 重新抛出当前的 FileNotFoundError

# 调用方捕获
try:
    tasks = load_tasks("missing.txt")
except FileNotFoundError:
    tasks = []
    print("使用空任务列表")
```

不带参数的 `raise` 保留了异常的原始调用栈信息，调用方看到的异常就像是从最初抛出点传播过来的，而不是从 raise 语句重新开始的。这对于调试很重要，因为调用栈指向了真正的错误源头。

在 except 块之外使用不带参数的 `raise` 会抛出 `RuntimeError: No active exception to re-raise`，提示没有正在处理的异常。

## 6.10.4 raise...from... 显式异常链

在 except 块中抛出新异常时，可以使用 `raise NewException(...) from original_exception` 语法，显式地把原异常作为新异常的**直接原因**（cause），形成清晰的异常链。

```python
class TaskLoadError(Exception):
    """任务加载失败"""

def load_tasks(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f]
    except FileNotFoundError as e:
        raise TaskLoadError(f"无法加载任务文件：{path}") from e

try:
    load_tasks("missing.txt")
except TaskLoadError as e:
    print(f"主异常：{e}")
    print(f"原因异常：{e.__cause__}")
# 主异常：无法加载任务文件：missing.txt
# 原因异常：[Errno 2] No such file or directory: 'missing.txt'
```

`from e` 把 `e` 赋值给新异常的 `__cause__` 属性，Python 在打印异常时会显示完整的因果链：先显示原异常，再显示新异常，中间标注 `The above exception was the direct cause of the following exception`。这种机制让调试者能追溯到最底层的错误。

## 6.10.5 raise...from None 抑制异常链

有时在把底层异常翻译为上层业务异常后，不希望调用方看到实现细节，可以用 `raise ... from None` 显式抑制异常链，丢弃原异常上下文。

```python
def get_task_count(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return len(f.readlines())
    except OSError:
        raise RuntimeError("获取任务数量失败") from None

try:
    get_task_count("missing.txt")
except RuntimeError as e:
    print(e)
    print(e.__cause__)  # None，原异常被抑制
```

`from None` 把 `__cause__` 设为 None，同时设置 `__suppress_context__` 为 True，这样 Python 不会显示原异常的上下文信息。这种写法适用于封装底层实现、对外只暴露业务异常的库接口。

## 6.10.6 隐式异常链

在 except 块中抛出新异常时，即使不使用 `from` 关键字，Python 也会自动保留原异常的上下文，把它赋值给新异常的 `__context__` 属性。这称为**隐式异常链**。

```python
try:
    try:
        open("missing.txt", "r")
    except FileNotFoundError:
        raise RuntimeError("处理失败")  # 没有 from
except RuntimeError as e:
    print(f"主异常：{e}")
    print(f"上下文异常：{e.__context__}")
    print(f"上下文是否抑制：{e.__suppress_context__}")
# 主异常：处理失败
# 上下文异常：[Errno 2] No such file or directory: 'missing.txt'
# 上下文是否抑制：False
```

隐式异常链与显式异常链的区别在于：隐式链通过 `__context__` 属性保存，Python 打印时标注 `During handling of the above exception, another exception occurred`；显式链通过 `__cause__` 属性保存，标注 `The above exception was the direct cause of the following exception`。使用 `from` 显式声明因果关系比隐式保留上下文更清晰，推荐在有意转换异常时使用 `from`。

## 6.10.7 自定义异常类的定义

当内置异常类型无法准确描述业务错误时，可以定义自定义异常类。自定义异常类应当继承 `Exception` 或其子类，而不是 `BaseException`，这样能被 `except Exception:` 捕获。

最简单的自定义异常只需要一个类体 `pass`：

```python
class TaskError(Exception):
    """任务相关的错误"""
    pass

class TaskNotFoundError(TaskError):
    """任务不存在"""
    pass

class TaskValidationError(TaskError):
    """任务数据验证失败"""
    pass
```

即使类体只有 `pass`，自定义异常也能正常工作。`raise TaskNotFoundError("任务 ID 100 不存在")` 会创建带消息的异常实例，调用方可以用 `except TaskNotFoundError:` 捕获。

为自定义异常添加文档字符串是好习惯，说明这个异常在什么情况下抛出，方便其他开发者正确使用。

## 6.10.8 自定义异常的层次设计

自定义异常应当按业务领域组织成层次结构，以一个领域基类统领，下面按错误类型分出子类。这样调用方可以按需要的粒度捕获：捕获基类处理所有领域错误，捕获子类处理特定错误。

```python
class TaskManagerError(Exception):
    """任务管理器所有异常的基类"""
    pass

class TaskNotFoundError(TaskManagerError):
    """任务不存在"""
    pass

class TaskValidationError(TaskManagerError):
    """任务数据验证失败"""
    pass

class TaskStatusError(TaskManagerError):
    """任务状态转换不合法"""
    pass
```

调用方可以这样使用：

```python
def delete_task(task_id):
    if task_id not in tasks:
        raise TaskNotFoundError(f"任务 {task_id} 不存在")
    # 删除逻辑...

try:
    delete_task(100)
except TaskNotFoundError as e:
    print(f"删除失败：{e}")
except TaskManagerError as e:
    # 兜底捕获所有任务管理器异常
    print(f"任务操作出错：{e}")
```

由于继承关系，`except TaskManagerError:` 能捕获 `TaskNotFoundError` 及其所有兄弟子类。这种层次设计让异常处理既灵活又精确。

## 6.10.9 自定义异常添加属性

自定义异常可以通过 `__init__` 方法添加业务属性，携带结构化的错误信息，比单纯的消息字符串更便于程序化处理。

```python
class TaskValidationError(Exception):
    """任务数据验证失败，携带字段和值信息"""
    def __init__(self, field, value, message=None):
        self.field = field
        self.value = value
        self.message = message or f"字段 {field} 的值 {value} 无效"
        super().__init__(self.message)

def validate_priority(priority):
    if not isinstance(priority, int):
        raise TaskValidationError("priority", priority, "优先级必须是整数")
    if priority < 1 or priority > 5:
        raise TaskValidationError("priority", priority, "优先级必须在 1-5 之间")
    return True

try:
    validate_priority(99)
except TaskValidationError as e:
    print(f"字段：{e.field}")
    print(f"值：{e.value}")
    print(f"消息：{e.message}")
# 字段：priority
# 值：99
# 消息：优先级必须在 1-5 之间
```

自定义 `__init__` 时必须调用 `super().__init__()`，把消息传给父类，确保 `args` 属性和 `str()` 行为正常。携带的属性让调用方可以精确地获取错误细节，用于生成用户友好的提示或记录结构化日志。

## 6.10.10 自定义异常的组织方式

当自定义异常较多时，应当把它们集中到一个专门的模块中，便于管理和导入。常见的做法是创建 `exceptions.py` 或 `errors.py` 文件，存放项目所有的自定义异常。

```python
# task_manager/exceptions.py
class TaskManagerError(Exception):
    """任务管理器所有异常的基类"""
    pass

class TaskNotFoundError(TaskManagerError):
    """任务不存在"""
    pass

class TaskValidationError(TaskManagerError):
    """任务数据验证失败"""
    pass

class TaskStatusError(TaskManagerError):
    """任务状态转换不合法"""
    pass
```

其他模块通过 `from task_manager.exceptions import TaskNotFoundError, TaskValidationError` 导入需要的异常类。这种组织方式让异常定义集中可见，避免分散在各业务模块中难以查找。模块化编程的相关内容在后续章节展开。

## 6.10.11 warnings 模块简介

有些问题不算严重错误，不需要中断程序流程，但应当提醒开发者注意。Python 的 `warnings` 模块提供了发出警告的机制，警告可以显示但不抛出异常，程序继续运行。

```python
import warnings

def load_tasks(path):
    if not path.endswith(".txt"):
        warnings.warn(f"文件 {path} 可能不是标准任务文件格式", UserWarning)
    # 继续加载...
    return []

load_tasks("tasks.csv")
# UserWarning: 文件 tasks.csv 可能不是标准任务文件格式
```

`warnings.warn(message, category)` 发出警告，`category` 默认是 `UserWarning`。常见的警告类别还有 `DeprecationWarning`（弃用警告）、`FutureWarning`（未来变更警告）、`RuntimeWarning`（运行时警告）。

警告与异常的区别在于：异常中断程序流程，必须被捕获或处理；警告只是提示，程序继续运行。调用方可以通过 `warnings.filterwarnings()` 控制警告的显示行为，比如把某些警告升级为异常、忽略某些警告等。本节仅介绍 warnings 模块的基本概念，详细配置在后续章节展开。

::: note 何时用异常何时用警告
异常用于必须中断流程的错误，调用方必须处理或让程序停止。警告用于不影响程序运行但值得注意的情况，如使用了已弃用的功能、数据格式不太标准等。任务管理器中，任务文件不存在用异常（因为无法继续加载），任务文件用了旧版格式用警告（可以兼容处理但提醒用户升级）。
:::

## 练习题

1. 写一个函数 `complete_task(tasks, task_id)`，从任务列表中标记指定任务为已完成。要求：任务不存在时抛出 `TaskNotFoundError`（自定义异常），任务已经是完成状态时抛出 `TaskStatusError`（自定义异常）。两个异常都继承自 `TaskManagerError` 基类。

::: details 参考答案
```python
class TaskManagerError(Exception):
    """任务管理器异常基类"""
    pass

class TaskNotFoundError(TaskManagerError):
    """任务不存在"""
    pass

class TaskStatusError(TaskManagerError):
    """任务状态转换不合法"""
    pass

def complete_task(tasks, task_id):
    if task_id not in tasks:
        raise TaskNotFoundError(f"任务 {task_id} 不存在")

    task = tasks[task_id]
    if task.get("status") == "done":
        raise TaskStatusError(f"任务 {task_id} 已经是完成状态")

    task["status"] = "done"
    print(f"任务 {task_id} 已标记为完成")

# 使用示例
tasks = {
    1: {"name": "学习 Python", "status": "pending"},
    2: {"name": "做练习", "status": "done"},
}

try:
    complete_task(tasks, 1)   # 成功
    complete_task(tasks, 2)   # 抛出 TaskStatusError
    complete_task(tasks, 99)  # 抛出 TaskNotFoundError
except TaskManagerError as e:
    print(f"操作失败：{type(e).__name__}: {e}")
```
自定义异常层次让调用方可以用 `except TaskManagerError` 统一捕获，也可以分别捕获子类做不同处理。基类继承 `Exception`，确保能被常规异常处理捕获。
:::

2. 以下代码在 except 块中抛出新异常，但没有使用 `from`。解释隐式异常链的行为，并改写为使用 `raise ... from e` 的显式异常链形式。

```python
try:
    value = int("abc")
except ValueError:
    raise RuntimeError("数据处理失败")
```

::: details 参考答案
没有 `from` 时，Python 自动把原异常（ValueError）赋值给新异常（RuntimeError）的 `__context__` 属性，形成隐式异常链。打印时显示 `During handling of the above exception, another exception occurred`，原异常作为上下文出现。

改写为显式异常链：

```python
try:
    value = int("abc")
except ValueError as e:
    raise RuntimeError("数据处理失败") from e
```
使用 `from e` 后，原异常赋值给新异常的 `__cause__` 属性，打印时显示 `The above exception was the direct cause of the following exception`。显式异常链比隐式更清晰地表达了因果关系，推荐在有意转换异常时使用 `from`。
:::

3. 解释 `raise ... from e` 和 `raise ... from None` 的区别，并说明各自适用的场景。

::: details 参考答案
`raise ... from e` 把原异常 `e` 作为新异常的 `__cause__`，建立显式的因果关系。打印时显示完整的异常链，调试者可以看到底层错误和新错误的完整信息。适用于需要保留底层错误原因的场景，比如把 `FileNotFoundError` 转换为业务异常 `TaskLoadError` 时，保留文件不存在的底层信息便于排查。

`raise ... from None` 显式抑制异常链，把 `__cause__` 设为 None，`__suppress_context__` 设为 True。打印时不显示原异常的任何信息。适用于封装底层实现、对外只暴露业务异常的场景，比如库内部捕获了多种底层异常，统一转换为一种业务异常抛出，不希望调用方看到实现细节。

选择原则是：如果底层原因对调试有帮助，用 `from e`；如果底层原因属于实现细节、暴露出来会干扰调用方，用 `from None`。不确定时优先用 `from e`，保留更多信息通常比丢失信息更安全。
:::

4. 写一个带自定义属性的自定义异常 `InvalidTaskError`，携带 `task_id` 和 `reason` 两个属性。然后写一个函数 `validate_task(task)`，检查任务字典是否包含 `id` 字段且为正整数，不满足时抛出 `InvalidTaskError`。

::: details 参考答案
```python
class InvalidTaskError(Exception):
    """无效的任务数据"""
    def __init__(self, task_id, reason):
        self.task_id = task_id
        self.reason = reason
        self.message = f"任务 {task_id} 无效：{reason}"
        super().__init__(self.message)

def validate_task(task):
    if not isinstance(task, dict):
        raise InvalidTaskError(None, "任务必须是字典")

    task_id = task.get("id")
    if task_id is None:
        raise InvalidTaskError(None, "缺少 id 字段")

    if not isinstance(task_id, int):
        raise InvalidTaskError(task_id, "id 必须是整数")

    if task_id <= 0:
        raise InvalidTaskError(task_id, "id 必须是正整数")

    return True

# 使用示例
try:
    validate_task({"id": -1, "name": "测试"})
except InvalidTaskError as e:
    print(f"任务 ID：{e.task_id}")
    print(f"原因：{e.reason}")
    print(f"消息：{e.message}")
# 任务 ID：-1
# 原因：id 必须是正整数
# 消息：任务 -1 无效：id 必须是正整数
```
自定义 `__init__` 接收 `task_id` 和 `reason` 参数，保存为实例属性，并构造消息字符串调用 `super().__init__()`。这样调用方既能通过 `str(e)` 获取消息，也能通过 `e.task_id` 和 `e.reason` 获取结构化信息，便于程序化处理和生成用户提示。
:::

## 常见错误

**错误 1 · `TypeError: exceptions must derive from BaseException`**

原因:`raise` 语句抛出了一个非异常对象，如字符串、整数或普通类的实例。`raise` 只能抛出 `BaseException` 的子类实例或类对象，抛出其他类型会抛出 `TypeError`。

解决:确保 `raise` 后面跟的是异常类或异常实例。自定义异常类必须继承 `Exception` 或其子类，不能继承普通类。需要抛出错误信息时用 `raise ValueError("错误信息")` 而非 `raise "错误信息"`。

**错误 2 · 自定义异常的 `str(e)` 或 `e.args` 行为异常**

原因:自定义异常类重写了 `__init__` 但没有调用 `super().__init__()`，导致父类的初始化逻辑被跳过，`args` 属性为空，`str(e)` 返回空字符串。这会让日志记录和错误打印丢失关键信息。

解决:自定义异常的 `__init__` 中必须调用 `super().__init__(message)`，把消息字符串传给父类，确保 `args`、`str()`、`repr()` 等行为与内置异常一致。即使不需要默认消息，也应调用 `super().__init__()` 保持协议完整。

**错误 3 · 自定义异常被 `except Exception:` 捕获不到**

原因:自定义异常类继承了 `BaseException` 而非 `Exception`。`BaseException` 的子类中，`SystemExit`、`KeyboardInterrupt` 等不继承 `Exception`，用 `except Exception:` 无法捕获。自定义异常如果直接继承 `BaseException`，也会被排除在常规捕获之外。

解决:自定义异常类应当继承 `Exception` 或其子类，而不是直接继承 `BaseException`。这样能被 `except Exception:` 兜底捕获，符合常规异常处理约定。只有特殊的控制流异常（如自定义的中断信号）才考虑继承 `BaseException`。
