---
title: 6.8 异常体系与内置异常类型
sidebar:
  order: 8
---
# 6.8 异常体系与内置异常类型

程序运行中难免遇到各种意外情况，Python 用异常来表示这些情况。异常是一个对象，携带错误类型和相关信息，沿调用栈向上传播，直到被某个 try-except 捕获或导致程序终止。理解异常的层次结构，才能写出精确的异常处理代码。捕获过于宽泛会掩盖真正的错误，捕获过于狭窄又会让本该处理的异常逃逸。本节将讲解 Python 异常体系的层次结构、常见的内置异常类型及其继承关系，以及异常对象的 `args` 属性。任务管理器在文件读写、数据解析等操作中会遇到多种异常，了解它们的分类有助于分别处理。

## 6.8.1 BaseException 异常层次结构的根

Python 所有异常的根类是 `BaseException`。它定义了异常对象的基本行为，包括 `args` 属性、`__str__` 方法和异常链相关属性。所有内置异常和用户自定义异常都直接或间接继承自 `BaseException`。

异常层次的最顶层分为三个直接子类：`Exception`、`SystemExit`、`KeyboardInterrupt`、`GeneratorExit`。这种划分把普通程序错误与系统级中断分开，避免用 `except Exception:` 捕获到不该捕获的中断。

```python
# 查看异常的继承链
print(BaseException.__subclasses__())
# [<class 'BaseExceptionGroup'>, <class 'Exception'>, <class 'KeyboardInterrupt'>,
#  <class 'GeneratorExit'>, <class 'SystemExit'>]
```

`SystemExit` 由 `sys.exit()` 引发，表示请求程序退出。`KeyboardInterrupt` 由用户按 Ctrl+C 引发，表示请求中断程序。`GeneratorExit` 在生成器关闭时引发。这三个异常都不继承 `Exception`，因此 `except Exception:` 不会捕获它们，这是有意的设计，保证用户中断和退出请求能正常传达。

## 6.8.2 Exception 基类

`Exception` 是所有**普通程序异常**的基类。绝大多数内置异常和所有自定义异常都继承自 `Exception`。捕获异常时应当使用 `except Exception:` 而不是裸 `except:`，这样既能捕获几乎所有程序错误，又不会吞掉 `KeyboardInterrupt` 和 `SystemExit`。

```python
# 推荐的兜底捕获
try:
    # 某些可能出错的操作
    result = 10 / 0
except Exception as e:
    print(f"捕获到异常：{type(e).__name__}: {e}")
# 捕获到异常：ZeroDivisionError: division by zero
```

`Exception` 的直接子类包括 `ArithmeticError`、`LookupError`、`ValueError`、`TypeError`、`OSError` 等，每个子类下面又有更具体的异常类型。这种层次结构让异常处理可以按需要的粒度进行：捕获父类处理整类异常，捕获子类处理特定异常。

## 6.8.3 数值与算术异常

### ArithmeticError 基类

`ArithmeticError` 是所有算术异常的基类，它的子类包括 `ZeroDivisionError`、`OverflowError`、`FloatingPointError`。

### ZeroDivisionError 除零错误

除法或取模运算的除数为零时引发：

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(e)  # division by zero
```

### OverflowError 数值溢出

数值运算结果超出当前类型的表示范围时引发。Python 的整数是任意精度的，不会溢出；浮点数运算可能溢出：

```python
import math
try:
    result = math.exp(1000)  # 超过浮点数范围
except OverflowError as e:
    print(e)  # math range error
```

`FloatingPointError` 在浮点操作失败时引发，实际很少触发，因为 Python 默认使用 IEEE 754 浮点标准，异常情况由特殊值（如 inf、nan）表示而非抛出异常。

## 6.8.4 查找异常

### LookupError 基类

`LookupError` 是所有查找失败的基类，子类包括 `IndexError` 和 `KeyError`。

### IndexError 索引越界

序列索引超出范围时引发：

```python
data = [1, 2, 3]
try:
    print(data[5])
except IndexError as e:
    print(e)  # list index out of range
```

### KeyError 键不存在

字典查找不存在的键时引发：

```python
config = {"mode": "auto"}
try:
    print(config["timeout"])
except KeyError as e:
    print(f"缺少配置项：{e}")  # 缺少配置项：'timeout'
```

`KeyError` 的异常消息就是缺失的键本身，不像其他异常那样是一段描述文字。任务管理器在解析配置文件时，如果某个必需字段缺失，会触发 `KeyError`。

## 6.8.5 类型与值异常

### TypeError 类型错误

操作或函数应用于不适当类型时引发。比如对字符串和数字做加法：

```python
try:
    result = "数量：" + 5
except TypeError as e:
    print(e)  # can only concatenate str (not "int") to str
```

`TypeError` 通常意味着代码逻辑有误，传入了错误类型的数据。修正方法是显式做类型转换：`"数量：" + str(5)`。

### ValueError 值错误

操作数类型正确但值不合适时引发。最常见的是 `int()` 转换非数字字符串：

```python
try:
    number = int("abc")
except ValueError as e:
    print(e)  # invalid literal for int() with base 10: 'abc'
```

`TypeError` 和 `ValueError` 的区别在于：`TypeError` 是类型不对，`ValueError` 是类型对但值不合法。`int("abc")` 中参数是字符串，类型正确，但字符串内容不是有效数字，所以是 `ValueError`。`int([1,2])` 中参数是列表，类型就不对，所以是 `TypeError`。

任务管理器在解析用户输入的任务优先级时，如果用户输入非数字，会触发 `ValueError`，这是需要处理的典型场景。

## 6.8.6 Unicode 异常

`UnicodeError` 是 `ValueError` 的子类，专门表示 Unicode 编码解码错误。它又有三个子类：`UnicodeEncodeError`（编码失败）、`UnicodeDecodeError`（解码失败）、`UnicodeTranslateError`（转换失败）。

```python
# 编码错误：把无法编码的字符写入 ASCII 文件
try:
    "你好".encode("ascii")
except UnicodeEncodeError as e:
    print(e)  # 'ascii' codec can't encode characters...

# 解码错误：用错误编码读取文件
try:
    b"\xff\xfe".decode("utf-8")
except UnicodeDecodeError as e:
    print(e)  # 'utf-8' codec can't decode byte 0xff...
```

文件操作中编码不匹配是触发 `UnicodeDecodeError` 的常见原因。第 12 章会详细讨论文件操作中的编码异常场景。

## 6.8.7 运行时异常

### RuntimeError 基类

`RuntimeError` 是一个比较通用的异常，表示运行时出现的、不属于其他类别的错误。它的子类包括 `RecursionError` 和 `NotImplementedError`。

### RecursionError 递归深度超限

递归调用超过 Python 的递归深度限制时引发：

```python
def infinite_recursion():
    return infinite_recursion()

try:
    infinite_recursion()
except RecursionError as e:
    print(e)  # maximum recursion depth exceeded
```

默认递归深度限制通常是 1000，可以通过 `sys.setrecursionlimit()` 调整，但不建议设置过大，可能导致解释器崩溃。

### NotImplementedError 未实现

抽象方法或占位函数被调用时引发，表示功能尚未实现：

```python
class TaskStorage:
    def save(self, tasks):
        raise NotImplementedError("子类必须实现 save 方法")

storage = TaskStorage()
try:
    storage.save([])
except NotImplementedError as e:
    print(e)  # 子类必须实现 save 方法
```

## 6.8.8 操作系统异常 OSError

`OSError` 是所有操作系统相关错误的基类，Python 3.3 起许多原来独立的异常类（如 `IOError`、`EnvironmentError`、`WindowsError`）都合并为 `OSError` 的别名或子类。文件操作中的绝大多数错误都属于 `OSError` 的子类。

### FileNotFoundError 文件不存在

以读取模式打开不存在的文件时引发：

```python
try:
    with open("missing.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError as e:
    print(e)  # [Errno 2] No such file or directory: 'missing.txt'
```

### PermissionError 权限不足

没有权限访问文件或目录时引发：

```python
try:
    with open("/etc/shadow", "r") as f:
        content = f.read()
except PermissionError as e:
    print(e)  # [Errno 13] Permission denied: '/etc/shadow'
```

### IsADirectoryError 和 NotADirectoryError

`IsADirectoryError` 在对目录执行文件操作时引发，`NotADirectoryError` 在对文件执行目录操作时引发：

```python
import os
try:
    with open("data", "r") as f:  # data 是目录
        content = f.read()
except IsADirectoryError as e:
    print(e)  # [Errno 21] Is a directory: 'data'
```

### FileExistsError 文件已存在

用独占创建模式 `'x'` 打开已存在的文件时引发：

```python
try:
    with open("tasks.txt", "x", encoding="utf-8") as f:
        f.write("新文件")
except FileExistsError as e:
    print(e)  # [Errno 17] File exists: 'tasks.txt'
```

这些 OSError 的子类构成了文件操作异常处理的核心。第 12 章会系统讲解文件操作中各种异常场景的处理策略。

## 6.8.9 其他常见异常类型

### AttributeError 属性错误

访问对象不存在的属性时引发：

```python
tasks = []
try:
    tasks.append_item("新任务")  # 方法名写错
except AttributeError as e:
    print(e)  # 'list' object has no attribute 'append_item'
```

### NameError 名称未定义

使用未定义的变量名时引发：

```python
try:
    print(undefined_var)
except NameError as e:
    print(e)  # name 'undefined_var' is not defined
```

### StopIteration 迭代结束

迭代器没有更多元素时引发，通常由 `next()` 或 for 循环内部处理，不需要手动捕获：

```python
it = iter([1])
next(it)  # 1
try:
    next(it)  # 没有更多元素
except StopIteration:
    print("迭代结束")
```

### AssertionError 断言失败

`assert` 语句条件为 False 时引发，第 11 章详细讲解。

### MemoryError 内存不足

程序请求的内存超过可用内存时引发。捕获 `MemoryError` 通常意义不大，因为此时程序可能已经无法正常工作。

### SyntaxError 语法错误

代码语法不正确时在编译阶段引发，不是运行时异常：

```python
try:
    eval("1 + ")  # 语法错误的表达式
except SyntaxError as e:
    print(e)  # unexpected EOF while parsing
```

## 6.8.10 异常的继承关系与匹配规则

异常捕获遵循**继承关系匹配**原则。`except` 子句指定的异常类型，能捕获该类型及其所有子类的异常。比如 `except OSError:` 能捕获 `FileNotFoundError`、`PermissionError` 等所有 OSError 的子类。

```python
try:
    open("missing.txt", "r")
except OSError as e:
    # FileNotFoundError 是 OSError 的子类，这里也能捕获
    print(f"操作系统错误：{type(e).__name__}: {e}")
# 操作系统错误：FileNotFoundError: [Errno 2] No such file or directory: 'missing.txt'
```

这一特性在异常处理中既有用又危险。有用在于可以用一个 except 处理一类异常，危险在于可能意外捕获到本该单独处理的子类异常。编写多个 except 子句时，应当把更具体的子类放在前面，更通用的父类放在后面，否则子类 except 永远不会执行。

```python
# 正确顺序：具体在前，通用在后
try:
    open("missing.txt", "r")
except FileNotFoundError:
    print("文件不存在")
except PermissionError:
    print("权限不足")
except OSError:
    print("其他操作系统错误")
```

## 6.8.11 异常对象的 args 属性

异常对象通过 `args` 属性保存创建时传入的参数。对于 `raise ValueError("消息")`，`args` 是 `('消息',)`。对于不传参数的异常，`args` 是空元组 `()`。

```python
try:
    raise ValueError("无效的优先级", 99)
except ValueError as e:
    print(e.args)      # ('无效的优先级', 99)
    print(e.args[0])   # 无效的优先级
    print(e.args[1])   # 99
    print(str(e))      # ('无效的优先级', 99)
```

`str(e)` 就是把 `args` 转成字符串。单个参数时显示参数本身，多个参数时显示元组形式。`args` 在日志记录和调试时很有用，可以访问异常的原始参数而不仅是字符串表示。

异常对象还有 `__cause__`、`__context__`、`__suppress_context__` 三个属性与异常链相关，第 10 章讲解 `raise ... from ...` 时会详细介绍。

## 6.8.12 异常类型的查询辅助

Python 提供了几种查询异常类型关系的方式。`issubclass(cls, parent)` 判断一个类是否是另一个类的子类，`type(e).__mro__` 查看异常的方法解析顺序（即继承链）。

```python
print(issubclass(FileNotFoundError, OSError))  # True
print(issubclass(FileNotFoundError, Exception))  # True
print(issubclass(FileNotFoundError, ValueError))  # False

# 查看继承链
print(FileNotFoundError.__mro__)
# (<class 'FileNotFoundError'>, <class 'OSError'>, <class 'Exception'>,
#  <class 'BaseException'>, <class 'object'>)
```

在不确定两个异常类的继承关系时，`issubclass()` 是可靠的查询方式。`__mro__` 展示完整的继承链，有助于理解异常在层次结构中的位置。

## 练习题

1. 解释为什么应当用 `except Exception:` 而不是裸 `except:` 作为兜底捕获。如果用裸 `except:` 捕获，会出现什么问题？

::: details 参考答案
裸 `except:` 会捕获所有继承自 `BaseException` 的异常，包括 `KeyboardInterrupt` 和 `SystemExit`。这两个异常分别表示用户按 Ctrl+C 中断程序和 `sys.exit()` 请求退出，它们属于控制信号，不代表程序错误。

如果用裸 `except:` 捕获，按 Ctrl+C 无法中断程序，`sys.exit()` 无法正常退出，程序会继续运行，这对用户和运维都是灾难性的。

`except Exception:` 只捕获 `Exception` 及其子类，而 `KeyboardInterrupt` 和 `SystemExit` 不继承 `Exception`，所以不会被捕获，能正常传达中断和退出请求。因此兜底捕获应当用 `except Exception:`。
:::

2. 以下操作分别会触发什么异常？写出异常类型名。

```python
int("abc")
[1, 2, 3][5]
{"a": 1}["b"]
"hello".append("!")
1 / 0
open("not_exist.txt", "r")
```

::: details 参考答案
```python
int("abc")              # ValueError，类型正确但值无效
[1, 2, 3][5]            # IndexError，序列索引越界
{"a": 1}["b"]           # KeyError，字典键不存在
"hello".append("!")     # AttributeError，字符串没有 append 方法
1 / 0                   # ZeroDivisionError，除以零
open("not_exist.txt", "r")  # FileNotFoundError，文件不存在
```
这些是最常见的内置异常类型。`ValueError` 和 `TypeError` 的区别在于参数类型是否正确：`int("abc")` 中参数是字符串，类型正确，但内容无法转换，所以是 `ValueError`。如果传 `int([1,2])`，参数类型不对，会是 `TypeError`。
:::

3. 以下 except 子句的顺序有什么问题？请改正并说明原因。

```python
try:
    open("tasks.txt", "r")
except OSError:
    print("操作系统错误")
except FileNotFoundError:
    print("文件不存在")
```

::: details 参考答案
问题在于 `FileNotFoundError` 是 `OSError` 的子类，按从上到下的顺序匹配，`except OSError:` 会先匹配到 `FileNotFoundError`，导致 `except FileNotFoundError:` 永远不会执行。Python 会给出语法警告。

改正方法是把更具体的子类放在前面，更通用的父类放在后面：

```python
try:
    open("tasks.txt", "r")
except FileNotFoundError:
    print("文件不存在")
except PermissionError:
    print("权限不足")
except OSError:
    print("其他操作系统错误")
```
这样 `FileNotFoundError` 会被第一个 except 捕获，其他 OSError 子类按顺序匹配，最后 `except OSError:` 兜底捕获未被前面覆盖的 OSError 子类。
:::

4. 给定以下代码，写出捕获异常后 `e.args` 的值。

```python
try:
    raise ValueError("优先级超出范围", 99, "max=10")
except ValueError as e:
    print(e.args)
```

::: details 参考答案
`e.args` 的值是 `('优先级超出范围', 99, 'max=10')`，一个包含三个元素的元组。

`args` 属性保存创建异常时传入的所有参数。`raise ValueError("优先级超出范围", 99, "max=10")` 传入了三个参数，它们被原样保存到 `args` 元组中。可以通过 `e.args[0]`、`e.args[1]`、`e.args[2]` 分别访问。`str(e)` 会把整个元组转为字符串显示为 `('优先级超出范围', 99, 'max=10')`。

在任务管理器中，可以用多个参数传递结构化的错误信息，比如错误码、字段名、允许范围等，方便调用方程序化处理，而不只是依赖字符串消息。
:::

## 常见错误

**错误 1 · `SyntaxWarning: catching a class that does not inherit from BaseException` 或子类 except 永不执行**

原因:多个 except 子句的顺序写反，把父类异常写在子类前面。由于 except 按从上到下匹配，父类会先匹配到子类异常，导致后面的子类 except 永远无法执行。Python 会对部分情况给出警告。

解决:把更具体的子类异常放在前面，更通用的父类异常放在后面。例如先 `except FileNotFoundError:`，再 `except OSError:`。不确定继承关系时用 `issubclass()` 查询。

**错误 2 · Ctrl+C 无法中断程序，`sys.exit()` 无法退出**

原因:使用了裸 `except:` 作为兜底捕获，它会捕获所有 `BaseException` 的子类，包括 `KeyboardInterrupt` 和 `SystemExit`。这两个异常是控制信号而非程序错误，被吞掉后用户无法中断程序，退出请求也被屏蔽。

解决:兜底捕获用 `except Exception:` 而非裸 `except:`。`Exception` 不包含 `KeyboardInterrupt` 和 `SystemExit`，二者能正常传达。确实需要捕获所有异常时，应分别显式处理 `KeyboardInterrupt` 和 `SystemExit`。

**错误 3 · `TypeError` 与 `ValueError` 混淆导致捕获错误**

原因:把类型不匹配的错误误判为值错误，或反之。`int("abc")` 是 `ValueError`（类型对但值无效），`int([1,2])` 是 `TypeError`（类型不对）。捕获了错误的异常类型会导致另一个异常逃逸。

解决:区分异常类型的依据是参数类型是否正确。类型正确但值不合法是 `ValueError`，类型本身不对是 `TypeError`。不确定时用 `except (TypeError, ValueError):` 同时捕获两种，或在 except 中用 `type(e).__name__` 打印实际异常类型。
