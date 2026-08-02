---
title: 6.9 异常捕获结构
sidebar:
  order: 9
---
# 6.9 异常捕获结构（try-except-else-finally）

第 3 章已经从控制结构角度介绍了异常处理的基本用法。本章从文件操作场景出发，深入讲解 try-except-else-finally 完整结构的细节，包括异常类型的精确匹配、异常实例的获取、继承关系在捕获中的作用、else 和 finally 子句的执行时机，以及 except 中重新抛出异常的写法。文件操作是异常密集的场景，文件不存在、权限不足、编码错误等各种情况都需要妥善处理。掌握完整的异常捕获结构，才能写出既稳健又清晰的文件处理代码。本节以打开文件可能失败的场景为贯穿示例，演示各种异常处理模式。

## 6.9.1 try-except 基本结构

try-except 是异常处理的基本形式。try 块中放置可能抛出异常的代码，except 块中放置异常处理逻辑。try 块抛出异常后，解释器从异常抛出点跳到 except 子句寻找匹配的处理逻辑。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    print("任务文件不存在，使用空列表")
    content = ""
```

这段代码尝试读取任务文件，文件不存在时捕获 `FileNotFoundError`，给 content 赋空字符串，程序继续运行。如果没有 try-except，文件不存在会直接导致程序崩溃。

try 块内的代码一旦在某行抛出异常，该行之后的代码不再执行。因此应当把紧密相关的步骤放进同一个 try 块，同时考虑好半途失败时的状态。

## 6.9.2 指定异常类型

在 except 后面跟上具体的异常类名，就只捕获这一类异常。其他类型的异常会继续向外层抛出。精确捕获的好处是不会误伤其他错误，便于针对不同错误编写专门的处理逻辑。

```python
try:
    number = int(input("请输入任务优先级："))
except ValueError:
    print("输入的不是有效数字")
```

文件操作中常见的需要捕获的异常类型包括 `FileNotFoundError`（文件不存在）、`PermissionError`（权限不足）、`UnicodeDecodeError`（编码错误）等。根据可能出现的错误类型分别捕获，是写稳健代码的基本要求。

## 6.9.3 多个 except 子句

一个 try 块可以跟多个 except 子句，每个子句负责一种异常类型。异常抛出后，解释器按从上到下的顺序匹配 except 子句，找到第一个匹配的就执行其代码块，跳过其他 except。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
    number = int(content)
except FileNotFoundError:
    print("文件不存在")
except UnicodeDecodeError:
    print("文件编码错误")
except ValueError:
    print("文件内容不是有效数字")
```

书写多个 except 时要把更具体的异常类型放在前面，更通用的放在后面。因为异常匹配按继承关系，如果先写 `except OSError:` 再写 `except FileNotFoundError:`，后者永远不会执行，因为 `FileNotFoundError` 是 `OSError` 的子类，会先被前者捕获。Python 会对此给出语法警告。

## 6.9.4 元组捕获多种异常

当多种异常的处理逻辑相同时，可以把它们写进同一个 except 子句，用元组列出所有要捕获的异常类型。这样代码更紧凑，避免重复书写同一段处理逻辑。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except (FileNotFoundError, PermissionError) as e:
    print(f"无法读取文件：{e}")
    content = ""
```

元组里的异常类顺序不影响匹配结果，只要抛出的异常属于其中任何一个就会被捕获。这种写法在文件操作中很常用，因为文件不存在和权限不足的处理方式往往相同：返回空内容或默认值。

## 6.9.5 as 获取异常实例

使用 `as` 关键字可以把捕获到的异常对象绑定到一个变量，方便在处理逻辑里读取异常的详细信息。异常对象携带错误消息、参数和调用栈信息，对日志记录和调试很有价值。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except OSError as e:
    print(f"错误类型：{type(e).__name__}")
    print(f"错误消息：{e}")
    print(f"错误参数：{e.args}")
    content = ""
```

`type(e).__name__` 获取异常类名，`str(e)` 或直接 `e` 获取错误消息，`e.args` 获取原始参数元组。在文件操作中，`OSError` 的实例还携带 `errno` 属性（错误码）和 `strerror` 属性（错误描述），可以用于更精细的错误处理：

```python
import errno

try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except OSError as e:
    if e.errno == errno.ENOENT:
        print("文件不存在")
    elif e.errno == errno.EACCES:
        print("权限不足")
    else:
        print(f"其他错误：{e}")
```

异常变量在 except 块结束时会被自动删除，以避免循环引用导致的内存泄漏。这意味着 except 块之外无法访问到这个变量。

## 6.9.6 继承关系匹配

异常类型匹配遵循继承关系。`except` 子句指定的异常类型，能捕获该类型及其所有子类的异常。捕获父类相当于捕获整类异常。

```python
try:
    open("missing.txt", "r")
except OSError as e:
    # FileNotFoundError 是 OSError 的子类，这里能捕获
    print(f"操作系统错误：{type(e).__name__}")
```

利用继承关系，可以用一个 `except OSError:` 捕获所有文件操作相关的系统错误。这种写法简洁，但会同时捕获 `FileNotFoundError`、`PermissionError`、`IsADirectoryError` 等，无法对每种错误做不同处理。需要区分处理时，应当用多个 except 子句分别捕获子类。

```python
# 精确处理各种文件错误
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    content = ""  # 文件不存在，用空内容
    print("首次运行，创建新任务文件")
except PermissionError:
    content = ""  # 权限不足，用空内容
    print("无权限读取文件")
except IsADirectoryError:
    raise ValueError("配置错误：路径是目录而非文件")
```

## 6.9.7 else 子句

else 子句紧接在所有 except 之后，只有 try 块完整执行且未抛出任何异常时才会运行。else 块中通常放置那些依赖于 try 块成功执行的后续操作。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    content = ""
else:
    print(f"成功读取 {len(content)} 个字符")
    # 在这里处理读取到的内容
    tasks = [line.strip() for line in content.splitlines() if line.strip()]
```

把后续处理放到 else 里的好处在于，如果处理过程中出现意外异常（比如内容格式错误），不会被同一个 try 的 except 误伤，而是按正常流程向上传播。这让异常职责更加清晰：try 块只负责可能失败的 IO 操作，except 只处理 IO 错误，业务逻辑的异常由上层处理。

不用 else 时，后续代码写在 try 块内或 try 之后，前者会让业务异常被 except 捕获，后者无法区分 try 是否成功。else 子句解决了这个尴尬，是推荐使用的写法。

## 6.9.8 finally 子句

finally 子句无论 try 块是否抛出异常、抛出的异常是否被 except 捕获，都会被执行。即使 try 或 except 中使用了 return、break、continue，甚至发生了未捕获的异常，finally 也会在控制流离开 try 语句之前完成执行。

```python
def read_task_file(path):
    f = None
    try:
        f = open(path, "r", encoding="utf-8")
        return f.read()
    except FileNotFoundError:
        return ""
    finally:
        if f is not None:
            f.close()
```

这个例子中，无论读取成功还是文件不存在，finally 都会关闭文件。即使在 try 或 except 中 return，finally 也会在 return 真正生效之前执行。

::: warning finally 中避免 return
在 finally 中使用 return 会覆盖 try 或 except 中的 return 值，还会吞掉未捕获的异常。这是容易出错的写法，应当避免。finally 中只做清理操作，不要写控制流语句。
:::

使用 with 语句后，文件关闭由 with 自动处理，finally 中手动 close 的场景变少了。但 finally 仍然适用于那些不实现上下文管理协议的资源清理，比如需要释放外部系统资源的场景。

## 6.9.9 完整结构与执行顺序

完整的异常处理结构由 try、except、else、finally 四部分组成。try 块先执行，若抛出异常则按顺序匹配 except；若未抛异常则执行 else；最后无论怎样都执行 finally。

```python
def process_task_file(path):
    print("== 开始 ==")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        print("try 块完成")
    except FileNotFoundError:
        content = ""
        print("捕获 FileNotFoundError")
    except UnicodeDecodeError:
        content = ""
        print("捕获 UnicodeDecodeError")
    else:
        print("else 块执行，处理内容")
    finally:
        print("finally 块执行")
    print("== 结束 ==\n")
    return content
```

执行顺序如下。try 成功时：try 块全部执行，跳过所有 except，执行 else，执行 finally。try 抛出异常且被 except 捕获时：try 块执行到异常点中断，匹配到对应 except 执行，跳过 else，执行 finally。try 抛出异常但没有匹配的 except 时：try 块执行到异常点中断，跳过所有 except 和 else，执行 finally，异常继续向外传播。

```python
# 文件存在时
process_task_file("tasks.txt")
# == 开始 ==
# try 块完成
# else 块执行，处理内容
# finally 块执行
# == 结束 ==

# 文件不存在时
process_task_file("missing.txt")
# == 开始 ==
# 捕获 FileNotFoundError
# finally 块执行
# == 结束 ==
```

## 6.9.10 except 中重新 raise

在 except 块内部，使用不带任何参数的 `raise` 语句会把当前正在处理的异常原封不动地重新抛出。这种写法常用于在记录日志或做局部清理后，依然让异常继续向上传播，由更上层统一处理。

```python
import logging

def load_tasks(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f]
    except FileNotFoundError as e:
        logging.warning(f"任务文件不存在：{path}")
        raise  # 重新抛出，让调用方决定如何处理

# 调用方
try:
    tasks = load_tasks("missing.txt")
except FileNotFoundError:
    tasks = []
    print("使用空任务列表")
```

`load_tasks` 函数捕获 `FileNotFoundError` 后记录日志，然后用 `raise` 重新抛出。调用方再次捕获并降级处理。这种模式实现了关注点分离：底层函数负责记录诊断信息，上层负责业务决策。

不带参数的 `raise` 在 except 块之外使用会抛出 `RuntimeError`，提示没有正在处理的异常。所以在使用前要确认自己处于 except 块的上下文之中。

## 6.9.11 except 中抛出新异常

在 except 块中可以抛出新的异常，把底层异常转换为更有业务语义的异常。此时原异常的上下文会被自动保留，Python 会附带 `During handling of the above exception, another exception occurred` 的提示。

```python
class TaskLoadError(Exception):
    """任务加载失败"""

def load_tasks(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f]
    except FileNotFoundError as e:
        raise TaskLoadError(f"无法加载任务：{path} 不存在") from e

try:
    tasks = load_tasks("missing.txt")
except TaskLoadError as e:
    print(e)
    print(f"原因：{e.__cause__}")
```

`raise ... from e` 显式建立异常链，把原异常作为新异常的 `__cause__` 属性。这样上层捕获到 `TaskLoadError` 时，仍能通过 `__cause__` 查看底层的 `FileNotFoundError`，便于调试。第 10 章会详细讲解异常链和自定义异常。

## 6.9.12 嵌套 try 结构

try 语句可以嵌套使用。内层 try 捕获的异常如果重新抛出，会传播到外层 try 继续匹配。这种结构适用于需要在多个层次处理异常的场景。

```python
def safe_load(path):
    tasks = []
    try:
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    tasks.append(line.strip())
        except FileNotFoundError:
            print("文件不存在，返回空列表")
            tasks = []
    except OSError as e:
        print(f"其他系统错误：{e}")
        tasks = []
    return tasks
```

内层 try 捕获特定的 `FileNotFoundError` 做降级处理，外层 try 捕获更通用的 `OSError` 做兜底处理。嵌套 try 让异常处理分层进行，但也增加了代码复杂度，使用时要权衡可读性。

## 6.9.13 综合示例：任务文件加载的完整异常处理

结合前面所有知识点，实现一个完整的任务文件加载函数，处理文件不存在、权限不足、编码错误、内容格式错误等多种异常。

```python
import logging

def load_tasks_safely(path):
    """安全加载任务文件，处理各种异常情况"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        logging.info(f"任务文件不存在：{path}，返回空列表")
        return []
    except PermissionError as e:
        logging.error(f"无权限读取文件 {path}：{e}")
        return []
    except UnicodeDecodeError as e:
        logging.error(f"文件编码错误 {path}：{e}")
        return []
    else:
        # 文件读取成功，处理内容
        tasks = []
        for index, line in enumerate(lines, 1):
            task = line.strip()
            if not task:
                continue
            if task.startswith("#"):
                continue  # 跳过注释行
            tasks.append(task)
        logging.info(f"成功加载 {len(tasks)} 条任务")
        return tasks
    finally:
        logging.debug("load_tasks_safely 执行完毕")

# 使用示例
tasks = load_tasks_safely("tasks.txt")
print(f"共 {len(tasks)} 条任务")
```

这个函数展示了完整异常处理结构的应用。try 块只包含可能失败的文件打开和读取操作，多个 except 分别处理不同类型的文件错误，else 块处理成功读取后的内容解析，finally 块记录调试日志。这种结构让每个部分的职责清晰，便于维护和扩展。

## 练习题

1. 以下代码有什么问题？请改正，并说明 else 子句的作用。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    content = ""
tasks = content.splitlines()
```

::: details 参考答案
问题在于 `tasks = content.splitlines()` 写在 try-except 之后，无法区分是 try 成功后执行还是异常处理后的执行。虽然这段代码能运行，但如果 `splitlines()` 出现异常，不会被 except 捕获，且逻辑上 content 的来源不清晰。

更清晰的写法是把后续处理放到 else 子句：

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    content = ""
    tasks = []
else:
    tasks = content.splitlines()
```
else 子句只在 try 块成功执行且未抛异常时运行。把内容处理放到 else 中，可以让异常职责清晰：try 只负责 IO，except 只处理 IO 错误，else 处理业务逻辑。如果 splitlines 出现异常，不会被 FileNotFoundError 的 except 误伤，而是正常向上传播。
:::

2. 写一个函数 `safe_int(value, default=0)`，尝试把 value 转为整数，转换失败时返回 default。要求使用 try-except 结构，并捕获合适的异常类型。

::: details 参考答案
```python
def safe_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# 使用示例
print(safe_int("123"))       # 123
print(safe_int("abc"))       # 0
print(safe_int(None))        # 0
print(safe_int([1, 2]))      # 0
print(safe_int("abc", -1))   # -1
```
`int()` 对非数字字符串抛出 `ValueError`，对不支持的类型（如 None、list）抛出 `TypeError`，所以用元组同时捕获这两种异常。捕获后返回默认值，让调用方无需做类型检查就能安全转换。这种模式在解析用户输入或配置文件时非常常用。
:::

3. 以下代码的 finally 块中有一个 return 语句，会导致什么问题？解释原因。

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None
    finally:
        return "finally"
```

::: details 参考答案
调用 `divide(10, 2)` 返回 `"finally"` 而非 `5.0`，调用 `divide(10, 0)` 也返回 `"finally"` 而非 `None`。

原因是 finally 块中的 return 会覆盖 try 或 except 块中的 return 值。finally 块无论是否发生异常都会执行，如果在 finally 中 return，这个 return 会成为整个 try 语句的最终返回值，吞掉之前 try 或 except 中准备返回的值。

此外，如果 try 块中有未捕获的异常，finally 中的 return 还会吞掉这个异常，调用方完全感知不到错误。

因此应当避免在 finally 中使用 return，finally 块只做清理操作（如关闭资源、释放锁），不要写控制流语句。正确的做法是把 return 放在 try 或 except 中，finally 中只做清理。
:::

4. 写一个函数 `load_task_config(path)`，读取任务配置文件并返回配置字典。要求处理以下异常：文件不存在时返回空字典并打印提示；权限不足时抛出 `RuntimeError`（带原始异常链）；编码错误时跳过无法解码的行。配置文件格式为每行 `键=值`。

::: details 参考答案
```python
def load_task_config(path):
    config = {}
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                config[key.strip()] = value.strip()
    except FileNotFoundError:
        print(f"配置文件不存在：{path}，使用默认配置")
        return {}
    except PermissionError as e:
        raise RuntimeError(f"无权限读取配置文件：{path}") from e
    return config

# 使用示例
try:
    config = load_task_config("task_config.txt")
    print(config)
except RuntimeError as e:
    print(f"加载失败：{e}")
    print(f"原因：{e.__cause__}")
```
文件不存在时返回空字典并提示；权限不足时用 `raise ... from e` 抛出 `RuntimeError`，保留原始异常链；编码错误用 `errors="replace"` 容忍，跳过坏字符继续处理。配置解析时跳过空行和注释行，用 `split("=", 1)` 确保值中可以包含等号。
:::

## 常见错误

**错误 1 · `RuntimeError: No active exception to re-raise`**

原因:在 except 块之外使用不带参数的 `raise` 语句。裸 `raise` 只能在 except 块内部使用，用于重新抛出当前正在处理的异常。在 try、else、finally 或普通代码中使用时，Python 找不到正在处理的异常，抛出 `RuntimeError`。

解决:确认 `raise` 语句位于 except 块内部。需要在 except 之外抛出异常时，必须显式指定异常类型，如 `raise ValueError("错误信息")`。在 except 块中抛出新异常时用 `raise NewException() from e` 建立异常链。

**错误 2 · finally 块的 return 吞掉异常或覆盖返回值**

原因:finally 块中使用了 return 语句。finally 块无论是否发生异常都会执行，其中的 return 会成为整个 try 语句的最终返回值，覆盖 try 或 except 中的 return；如果 try 块有未捕获的异常，finally 的 return 还会吞掉这个异常，调用方完全感知不到错误。

解决:finally 块中只做资源清理操作（关闭文件、释放锁），不写 return、break、continue 等控制流语句。需要返回值时把 return 放在 try 或 except 块中，让 finally 仅负责清理。

**错误 3 · 裸 `except:` 捕获过宽导致隐藏 bug**

原因:使用不带异常类型的裸 `except:` 捕获所有异常，包括 `KeyboardInterrupt`、`SystemExit` 和本不该被吞掉的程序错误。这会掩盖真正的 bug，让程序在错误状态下继续运行，排查困难。

解决:用 `except Exception:` 代替裸 `except:` 作为兜底，避免捕获控制信号。尽量捕获具体的异常类型（如 `FileNotFoundError`、`ValueError`），只在确实需要兜底时用 `except Exception:`，并在 except 中记录日志或重新 raise。
