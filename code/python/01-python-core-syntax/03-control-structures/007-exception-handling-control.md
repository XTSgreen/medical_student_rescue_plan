---
title: 3.7 异常处理控制结构
sidebar:
  order: 7
---
# 3.7 异常处理控制结构


程序运行过程中难免遇到意外情况，比如读取一个不存在的文件、用 0 作为除数、把字符串转成整数却遇到非数字字符。如果这些意外发生时没有任何处理，程序会直接崩溃并打印一大串错误信息。异常处理控制结构正是为应对这种情况而设计，它把可能出错的代码包裹起来，并在异常发生时按预定的方式继续运行。本节将系统讲解 try、except、else、finally 四种子句的协作方式，以及 raise 与 assert 这两种主动控制流跳转的写法，帮助你在面对不确定性输入时写出稳健的代码。

## 3.7.1 try 块定义受监控的代码段

try 关键字开启一段受监控的代码块，解释器会监视其中是否发生异常。如果 try 块中没有异常，程序正常运行到结束后跳过所有 except 子句继续往下执行；如果发生异常，则从异常抛出点跳到 except 子句寻找匹配的处理逻辑。try 块本身不处理任何异常，它只负责划定监控范围。

下面这段代码尝试把用户输入的字符串转成整数。当输入是合法数字时，try 块顺利完成；当输入无法转换时，异常会在 `int()` 调用处抛出，转交给 except 处理。

```python
user_input = "abc"
try:
    number = int(user_input)
    print(f"转换成功：{number}")
except:
    print("输入不是合法数字")
# 输入不是合法数字
```

需要注意 try 块内的代码一旦在中间某行抛出异常，该行之后的代码就不再执行。例如上面例子中如果 `int()` 抛出异常，`print(f"转换成功：{number}")` 就不会被执行。这要求把希望被监控的、彼此关联的步骤放进同一个 try 块，但每一步之间也要考虑好半途失败时的状态。

## 3.7.2 except 子句捕获异常（基本形式 except: 捕获所有异常）

except 关键字后不写任何异常类型，就形成一个**裸 except**，它会捕获所有继承自 BaseException 的异常。这种写法看似方便，实际上风险很大，因为它会同时吞掉 KeyboardInterrupt 和 SystemExit 这类应当让程序停止的特殊异常，导致按 Ctrl+C 都无法中断程序。

```python
try:
    value = 10 / 0
except:
    print("发生了某种异常")
# 发生了某种异常
```

裸 except 通常只用在脚本的最外层兜底，比如批量处理任务时为了不让一条失败记录中断整个流程而使用。即便如此，更推荐的做法是捕获 Exception，因为 Exception 是绝大多数普通异常的基类，而 KeyboardInterrupt 与 SystemExit 不会被它捕获，仍然能让用户正常中断程序。

## 3.7.3 except 子句指定异常类型（except ValueError:）

在 except 后面跟上具体的异常类名，就只捕获这一类异常。其他类型的异常会继续向外层抛出，由更上层的 try 或解释器处理。这种精确捕获的好处是不会误伤其他错误，便于针对不同错误编写专门的处理逻辑。

```python
try:
    number = int("abc")
except ValueError:
    print("无法转换为整数")
# 无法转换为整数
```

如果 try 块里抛出的是别的异常，比如除零错误，上面的 except ValueError 不会捕获，程序仍会崩溃。这种精确匹配机制让错误处理路径更加清晰，调试时也容易看出哪一类问题被哪一段代码接管。

## 3.7.4 多个 except 子句捕获不同异常类型

一个 try 块可以跟多个 except 子句，每个子句负责一种异常类型。异常抛出后，解释器按从上到下的顺序匹配 except 子句，找到第一个匹配的就执行其代码块，跳过其他 except。如果所有 except 都不匹配，异常继续向外层传播。

```python
try:
    data = [1, 2, 3]
    print(data[5])
    value = int("abc")
except IndexError:
    print("索引越界")
except ValueError:
    print("转换失败")
except ZeroDivisionError:
    print("除零错误")
# 索引越界
```

书写多个 except 时要把更具体的异常类型放在前面，更通用的放在后面。如果顺序反了，比如先写 `except Exception:` 再写 `except ValueError:`，由于 ValueError 是 Exception 的子类，所有 ValueError 都会被前者捕获，后者永远无法执行，Python 也会给出警告提示。

## 3.7.5 一个 except 子句捕获多种异常（except (TypeError, ValueError):）

当多种异常的处理逻辑相同时，可以把它们写进同一个 except 子句，用元组列出所有要捕获的异常类型。这样代码更加紧凑，避免重复书写同一段处理逻辑。

```python
try:
    result = int("abc")
except (TypeError, ValueError):
    print("类型或值不合法")
# 类型或值不合法
```

元组里的异常类顺序不影响匹配结果，只要抛出的异常属于其中任何一个就会被捕获。这种写法在处理参数校验时尤其常见，因为不同校验失败可能抛出不同异常，但都需要回到同一套提示逻辑。

## 3.7.6 except 子句获取异常实例（except ValueError as e:）

使用 `as` 关键字可以把捕获到的异常对象绑定到一个变量上，方便在处理逻辑里读取异常的详细信息，比如错误消息、错误码等。这个变量在 except 块结束时会被自动删除，以避免循环引用导致的内存泄漏。

```python
try:
    number = int("abc")
except ValueError as e:
    print(f"捕获到异常：{type(e).__name__}")
    print(f"异常消息：{e}")
# 捕获到异常：ValueError
# 异常消息：invalid literal for int() with base 10: 'abc'
```

异常对象除了 `str()` 形式的消息文本，还携带 `args` 属性保存原始参数元组。在调试日志里记录这些信息有助于事后定位问题。需要注意的是，不要把异常对象的字符串表示直接当作结构化数据使用，不同版本之间格式可能变化。

## 3.7.7 else 子句与 try 配合（未触发异常时执行 else 块）

else 子句紧接在所有 except 之后，只有 try 块完整执行且未抛出任何异常时才会运行。else 块中通常放置那些依赖于 try 块成功执行的后续操作，把这部分代码放到 else 中而不是 try 里，可以避免 else 中的异常被同一个 try 的 except 捕获，让异常职责更加清晰。

```python
try:
    number = int("123")
except ValueError:
    print("转换失败")
else:
    print(f"转换成功，开始计算平方：{number ** 2}")
# 转换成功，开始计算平方：15129
```

把后续计算放在 else 里的好处在于，如果计算过程中出现意外异常（例如溢出或类型错误），不会被 `except ValueError` 误伤，而是按正常流程向上传播，方便上层统一处理。

## 3.7.8 finally 子句（无论是否异常均执行）

finally 子句无论 try 块是否抛出异常、抛出的异常是否被 except 捕获，都会被执行。即使 try 或 except 中使用了 return、break、continue，甚至发生了未捕获的异常，finally 也会在控制流离开 try 语句之前完成执行。这一特性使它非常适合做资源清理工作。

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("不能除以零")
        return None
    finally:
        print("清理工作完成")

print(divide(10, 2))
# 清理工作完成
# 5.0

print(divide(10, 0))
# 不能除以零
# 清理工作完成
# None
```

可以看到，即使函数已经在 try 或 except 中 return，finally 也会在 return 真正生效之前执行。这一行为容易让人产生困惑，所以 finally 中应只做与清理相关的操作，避免再写复杂的逻辑分支或新的 return。

## 3.7.9 try-except-else-finally 完整结构及其执行顺序

完整的异常处理结构由 try、except、else、finally 四部分组成，写法如下。try 块先执行，若抛出异常则按顺序匹配 except；若未抛异常则执行 else；最后无论怎样都执行 finally。

```python
def process(value):
    print("== 开始 ==")
    try:
        number = int(value)
        print("try 块完成")
    except ValueError as e:
        print(f"捕获异常：{e}")
    else:
        print("else 块执行")
    finally:
        print("finally 块执行")
    print("== 结束 ==\n")

process("123")
# == 开始 ==
# try 块完成
# else 块执行
# finally 块执行
# == 结束 ==

process("abc")
# == 开始 ==
# 捕获异常：invalid literal for int() with base 10: 'abc'
# finally 块执行
# == 结束 ==
```

从输出可以看出执行顺序。try 成功则跑完 try 再跑 else，最后 finally。try 抛异常且被 except 捕获时，跳过 else，跑完 except 再跑 finally。若 try 抛出异常但没有匹配的 except，finally 仍会执行，之后异常继续向外传播。掌握这一顺序是写出可预测的清理逻辑的关键。

## 3.7.10 raise 语句手动抛出异常（控制流跳转）

除了解释器自动抛出异常，开发者也可以用 raise 语句主动抛出异常。这在参数校验、业务规则检查等场景中很常见，当输入或状态不符合预期时，主动抛出一个语义明确的异常，让调用方决定如何处理。raise 抛出异常后，当前函数的剩余代码不再执行，控制流跳到调用栈中最近的匹配 try 块。

```python
def set_age(age):
    if age < 0 or age > 150:
        raise ValueError("年龄必须在 0 到 150 之间")
    print(f"年龄已设置为 {age}")

set_age(30)   # 年龄已设置为 30
set_age(-1)   # 抛出 ValueError: 年龄必须在 0 到 150 之间
```

raise 抛出的必须是 BaseException 的子类实例，或者异常类本身（此时会自动实例化）。在自定义校验函数、库的对外接口中合理使用 raise，可以让错误以统一的方式向上传播，调用方用 try/except 处理即可。

## 3.7.11 raise 不带参数重新抛出当前异常

在 except 块内部，使用不带任何参数的 raise 语句会把当前正在处理的异常原封不动地重新抛出。这种写法常用于在记录日志或做局部清理后，依然让异常继续向上传播，由更上层统一处理。

```python
def read_config(path):
    try:
        with open(path) as f:
            return f.read()
    except OSError as e:
        print(f"记录日志：读取 {path} 失败 - {e}")
        raise  # 重新抛出当前 OSError

# 调用方
try:
    read_config("missing.txt")
except OSError:
    print("上层捕获到异常并降级处理")
# 记录日志：读取 missing.txt 失败 - [Errno 2] No such file or directory: 'missing.txt'
# 上层捕获到异常并降级处理
```

不带参数的 raise 在 except 块之外使用会抛出 RuntimeError，提示没有正在处理的异常。所以在使用前要确认自己处于 except 块的上下文之中。

## 3.7.12 raise 指定异常类型和消息（raise ValueError("消息")）

抛出异常时可以传入一个字符串作为错误消息，方便调用方通过 `str(e)` 或 `e.args` 获取具体的出错原因。消息应当言简意赅且包含必要的上下文信息，比如出错的字段名、不符合规则的具体数值。

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"余额不足：当前 {balance}，请求 {amount}")
    return balance - amount

try:
    withdraw(100, 200)
except ValueError as e:
    print(e)
# 余额不足：当前 100，请求 200
```

错误消息是给开发者看的，应当避免暴露过多内部实现细节。如果是给最终用户看，应该由调用方根据异常类型翻译为友好提示，而不是把原始异常消息直接展示出来。

## 3.7.13 raise 从 except 中抛出新异常（异常链）

在 except 块中抛出新的异常时，原异常的上下文会被自动保留，默认情况下 Python 会附带 `During handling of the above exception, another exception occurred` 这样的提示。如果希望显式表达因果关系，可以使用 `raise NewException(...) from original_exception` 语法，把原异常作为新异常的 `__cause__` 属性，形成清晰的异常链。

```python
def load_data(path):
    try:
        with open(path) as f:
            return int(f.read())
    except OSError as e:
        raise RuntimeError("数据加载失败") from e

try:
    load_data("missing.txt")
except RuntimeError as e:
    print(f"主异常：{e}")
    print(f"原因异常：{e.__cause__}")
# 主异常：数据加载失败
# 原因异常：[Errno 2] No such file or directory: 'missing.txt'
```

使用 `from e` 表达的是直接因果关系，使用 `from None` 则可以显式抑制异常链，丢弃原异常上下文。后者适用于将底层异常翻译为上层业务异常后，不想让调用方看到实现细节的情况。

## 3.7.14 assert 断言语句（条件为 False 时抛出 AssertionError）

assert 是一种轻量级的内部检查机制，用于在开发阶段验证程序内部状态是否符合预期。当 assert 后的条件为 False 时，会抛出 AssertionError。assert 主要用于开发期发现逻辑错误，不应用于生产环境的输入校验，因为它的行为受优化模式影响。

```python
def calculate_average(values):
    assert len(values) > 0, "列表不能为空"
    return sum(values) / len(values)

print(calculate_average([1, 2, 3]))  # 2.0
print(calculate_average([]))         # 抛出 AssertionError: 列表不能为空
```

::: note assert 与 if 的区别
assert 表达的是这个条件必须成立，否则就是程序写错了，它面向开发者。if 表达的是运行时根据情况选择不同分支，它面向用户。把外部输入校验写成 assert 在禁用断言后会失效，是常见的安全陷阱。
:::

## 3.7.15 断言语句的语法（assert 条件, "错误消息"）

assert 的完整语法是 `assert condition, message`，其中 message 是可选的。当 condition 为 False 时抛出 AssertionError，并把 message 作为异常参数；不写 message 时抛出的 AssertionError 不带任何参数。

```python
def process_order(order):
    assert isinstance(order, dict), "order 必须是字典"
    assert "id" in order, "order 必须包含 id 字段"
    print(f"处理订单 {order['id']}")

process_order({"id": 1001})        # 处理订单 1001
process_order("1001")              # AssertionError: order 必须是字典
process_order({})                  # AssertionError: order 必须包含 id 字段
```

可选的 message 帮助在断言失败时快速定位问题，建议所有 assert 都带上说明性消息。message 也可以是任意表达式，断言失败时会计算并展示该表达式的值。

## 3.7.16 断言的可禁用特性（-O 优化模式）

Python 解释器在以 `-O` 优化模式启动时（命令行加 `python -O script.py`）会跳过所有 assert 语句的执行，相当于它们根本不存在。这一机制意味着 assert 不能用于任何依赖副作用的逻辑，更不能用于参数校验。

下面这段脚本在不同模式下的行为差异明显：

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

::: note 不要依赖 assert 做安全检查
凡是涉及外部输入、权限校验、业务规则约束的检查，都要写成普通的 if 加 raise，不要用 assert。一旦程序以优化模式运行，所有 assert 都会失效，可能导致严重的安全或数据问题。
:::

## 3.7.17 异常处理中的 sys.exc_info() 获取异常信息（仅列名称）

`sys.exc_info()` 是 sys 模块提供的一个函数，用于获取当前正在处理的异常信息。它返回一个三元组 `(type, value, traceback)`，分别是异常类型、异常实例和调用栈对象。在 except 块之外调用时返回三个 None。

```python
import sys

try:
    1 / 0
except ZeroDivisionError:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    print(f"类型：{exc_type.__name__}")   # 类型：ZeroDivisionError
    print(f"实例：{exc_value}")            # 实例：division by zero
```

exc_info 在早期 Python 中是获取异常信息的常见方式，从 Python 3 引入 `except ... as e:` 后大多数场景可以直接用异常实例 `e` 替代。exc_info 仍有一些不可替代的用途，比如需要在 traceback 上做进一步分析时。相关的辅助工具还有 `traceback` 模块，用于格式化或打印调用栈。本节仅介绍函数名称，详细用法在调试相关章节展开。

## 练习题

### 第 1 题：写出下列 try-except 的输出结果

阅读下面这段异常处理代码，在不运行的情况下写出它的输出。

```python
try:
    value = int("abc")
    print("转换成功:", value)
except ValueError:
    print("转换失败")
finally:
    print("清理完成")
```

::: details 参考答案
输出如下。`int("abc")` 抛出 `ValueError`，`try` 块中后续的 `print` 不执行，控制权转到 `except ValueError` 打印"转换失败"，最后 `finally` 块无条件执行打印"清理完成"。

```
转换失败
清理完成
```
:::

### 第 2 题：编写除法函数处理除零异常

请编写一个函数 `safe_divide(a, b)`，在 `b` 为 0 时捕获 `ZeroDivisionError` 并返回 `None`，正常情况返回 `a / b`。调用该函数测试 `safe_divide(10, 0)` 和 `safe_divide(10, 2)`。

::: details 参考答案
```python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

print(safe_divide(10, 0))
print(safe_divide(10, 2))
```

输出：

```
None
5.0
```

`except ZeroDivisionError` 精确捕获除零异常，避免使用裸 `except` 吞掉其他不应被处理的异常。捕获后返回 `None` 让调用方可以通过判断返回值识别失败。
:::

### 第 3 题：用 raise 主动抛出参数校验异常

请编写一个函数 `set_age(age)`，当 `age` 小于 0 或大于 150 时，用 `raise` 抛出 `ValueError` 并附带错误消息。合法年龄打印设置成功。用 try-except 调用该函数测试非法输入。

::: details 参考答案
```python
def set_age(age):
    if age < 0 or age > 150:
        raise ValueError(f"年龄必须在 0 到 150 之间，收到: {age}")
    print(f"年龄已设置为 {age}")


try:
    set_age(-5)
except ValueError as e:
    print("捕获到异常:", e)
```

输出 `捕获到异常: 年龄必须在 0 到 150 之间，收到: -5`。`raise` 主动抛出异常后函数剩余代码不再执行，控制权跳到调用方最近的匹配 `try` 块。错误消息包含具体数值，便于调用方定位问题。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器接收用户输入的任务编号来标记完成。请编写代码，用 try-except 处理两种异常情况：输入不是数字时捕获 `ValueError`，编号超出任务列表范围时捕获 `IndexError`，两种情况都打印友好提示而不让程序崩溃。

::: details 参考答案
```python
tasks = ["写文档", "评审代码", "修复 Bug"]
user_input = "5"

try:
    idx = int(user_input)
    tasks[idx] = tasks[idx] + " [完成]"
    print("已标记:", tasks[idx])
except ValueError:
    print("请输入有效的数字编号")
except IndexError:
    print(f"编号超出范围，有效范围是 0 到 {len(tasks) - 1}")
```

输出 `编号超出范围，有效范围是 0 到 2`。多个 `except` 子句分别处理不同异常类型，让程序在面对错误输入时保持稳健。这是命令行工具处理用户输入的常见模式，把可能出错的代码包在 `try` 中，按异常类型分别给出友好提示。
:::

## 常见错误

**错误 1 · `bare except 吞掉 KeyboardInterrupt 导致 Ctrl+C 无法中断程序`**

原因:不指定异常类型的 `except:` 会捕获所有继承自 BaseException 的异常，包括 KeyboardInterrupt 和 SystemExit，导致程序无法被正常中断。

解决:捕获 `Exception` 而非裸 `except`，或指定具体的异常类型。`Exception` 不会捕获 KeyboardInterrupt 和 SystemExit。

**错误 2 · `except 子句顺序错误导致子类异常被父类拦截`**

原因:多个 except 子句按从上到下顺序匹配。如果 `except Exception` 写在 `except ValueError` 之前，由于 ValueError 是 Exception 的子类，所有 ValueError 都会被前者捕获，后者永远无法执行。

解决:更具体的异常类型放在前面，更通用的放在后面。Python 会对这种顺序错误给出警告。

**错误 3 · `python -O 模式下 assert 校验失效`**

原因:Python 解释器以 `-O` 优化模式启动时会跳过所有 assert 语句。用 assert 做参数校验，在优化模式下校验逻辑完全消失。

解决:涉及外部输入、权限校验、业务规则约束的检查，用 `if` 加 `raise` 实现，不要用 assert。

**错误 4 · `raise 不带参数在 except 块外使用抛出 RuntimeError`**

原因:不带参数的 `raise` 用于在 except 块中重新抛出当前异常。在 except 块之外使用时没有正在处理的异常，Python 抛出 `RuntimeError: No active exception to re-raise`。

解决:确认 `raise` 处于 except 块内部。在 except 块外抛出异常必须指定异常类型或实例。
