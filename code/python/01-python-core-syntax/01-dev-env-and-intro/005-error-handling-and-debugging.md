---
title: 1.5 错误处理与调试入门
sidebar:
  order: 5
---
# 1.5 错误处理与调试入门

程序错误是编程的常态，就像工程实践中遇到问题是常态一样。初学者常把报错当作失败，实际上报错是 Python 在告诉你哪里出了问题，是定位问题的关键线索。本节将区分两类错误，介绍常见异常类型，讲解 try-except 异常处理结构，最后介绍调试工具的使用。掌握错误处理与调试，你才能写出健壮的程序，也能在出问题时快速找到原因。

## 1.5.1 语法错误（SyntaxError）的识别与修正

语法错误是代码不符合 Python 语法规则时产生的错误，在程序运行前就会被解释器发现。这类错误最常见的几种情形是括号不匹配、缩进错误和冒号遗漏。

括号不匹配发生在开括号和闭括号数量不一致时。

```python
# 括号不匹配，少了右括号
print("处理完成"
```

缩进错误发生在缩进层级不符合语法要求时。Python 用缩进表示代码块，多缩进或少缩进都会报错。

```python
# 缩进错误
def compute_area(length, width):
return length * width  # 这一行应该缩进
```

冒号遗漏发生在 `def`、`if`、`for`、`while` 等语句末尾忘了写冒号。

```python
# 冒号遗漏
if score > 80
    print("优秀")
```

IDE 通常会标红提示语法错误，PyCharm 和 VS Code 都能在你输入时实时检查语法。遇到 `SyntaxError` 时，错误信息会指出出错的行号和位置，对照提示检查括号、缩进和冒号一般就能解决。语法错误是最低级的错误，也是最容易修正的，养成看错误提示的习惯能省下大量时间。

## 1.5.2 运行时错误（异常）的常见类型

语法正确不代表运行时不出错。程序在执行过程中遇到的问题称为异常。下面介绍几种最常见的异常类型。

`NameError` 发生在使用了未定义的变量时。就像在代码里引用了一个不存在的文件名，系统找不到对应文件。

```python
print(user_name)  # NameError: name 'user_name' is not defined
```

`TypeError` 发生在对不兼容的类型执行操作时。例如把字符串和数字相加。

```python
age = 30
message = "用户年龄是" + age  # TypeError: can only concatenate str (not "int") to str
```

修正方法是显式转换类型。

```python
message = "用户年龄是" + str(age)  # 正确
```

`ValueError` 发生在值的类型正确但内容不合法时。例如把非数字字符串转成整数。

```python
number = int("3.14")  # ValueError: invalid literal for int()
```

`ZeroDivisionError` 发生在除数为零时。

```python
average = total / count  # 当 count 为 0 时触发 ZeroDivisionError
```

`FileNotFoundError` 发生在尝试打开不存在的文件时。

```python
with open("不存在的文件.txt") as f:  # FileNotFoundError
    content = f.read()
```

`IndexError` 发生在列表索引超出范围时。

```python
values = [10, 20, 30]
print(values[5])  # IndexError: list index out of range
```

`KeyError` 发生在访问字典中不存在的键时。

```python
user = {"name": "张三", "age": 45}
print(user["status"])  # KeyError: 'status'
```

这些异常都有明确的名字，错误信息会指出异常类型和具体原因。读懂异常类型是排查问题的第一步。

## 1.5.3 异常处理基本结构 try-except

异常一旦发生且未被处理，程序就会中断并打印错误栈。如果你希望程序在出错时能优雅地处理而不是直接崩溃，就要用 `try-except` 结构。

基本用法是把可能出错的代码放在 `try` 块中，把出错后的处理代码放在 `except` 块中。

```python
try:
    count = int(input("请输入数量："))
    average = total / count
    print(f"平均值：{average}")
except ZeroDivisionError:
    print("数量不能为零，请重新输入。")
```

当 `count` 为零时，`total / count` 触发 `ZeroDivisionError`，程序跳转到 `except` 块执行提示，而不是崩溃退出。如果 `try` 块中没有异常，`except` 块会被跳过。

可以针对不同异常类型写多个 `except` 块，分别处理。

```python
try:
    count = int(input("请输入数量："))
    average = total / count
except ValueError:
    print("输入的不是有效整数。")
except ZeroDivisionError:
    print("数量不能为零。")
```

这种结构类似于分级处理：不同的异常对应不同的处理方案。注意异常处理应针对具体类型，避免一上来就写 `except:` 捕获所有异常，那样会掩盖真正的问题，让你无从排查。

## 1.5.4 try-except-else-finally 的完整结构

`try` 语句还有两个可选子句：`else` 和 `finally`。`else` 块在 `try` 块没有发生任何异常时执行。`finally` 块无论是否发生异常都会执行，常用于释放资源，比如关闭文件。

完整结构如下。

```python
def safe_divide(total, count):
    try:
        result = total / count
    except ZeroDivisionError:
        print("错误：除数不能为零。")
    else:
        print(f"计算成功，结果为 {result}")
    finally:
        print("本次计算结束。")

safe_divide(100, 4)
# 输出：
# 计算成功，结果为 25.0
# 本次计算结束

safe_divide(100, 0)
# 输出：
# 错误：除数不能为零。
# 本次计算结束
```

执行顺序是这样的。先执行 `try` 块。如果发生异常，执行对应的 `except` 块，`else` 块不执行。如果没有异常，跳过所有 `except` 块，执行 `else` 块。无论上述哪种情况，最后都执行 `finally` 块。

`finally` 块适合放必须执行的清理代码。处理文件时，可以用它确保文件被关闭。更推荐的做法是使用 `with` 语句，它会在代码块结束时自动关闭文件，即使发生异常也不例外，相当于把 `try-finally` 简化成一个语法结构。

```python
# 用 with 语句自动管理文件关闭
with open("data.txt") as f:
    content = f.read()
# 离开 with 块后文件自动关闭
```

`finally` 的可靠性体现在即使 `try` 块里出现了你没有预料到的异常，`finally` 也会执行，然后再把异常向上抛出。这保证了关键清理逻辑总能运行，类似于无论任务执行如何，结束后都要释放资源的流程要求。

## 1.5.5 使用 raise 手动抛出异常

除了捕获异常，你还可以主动抛出异常。`raise` 语句用于在检测到不合法状态时手动触发异常，常用于函数参数校验。

```python
def set_score(value):
    if value < 0 or value > 100:
        raise ValueError(f"分数 {value} 不在合理范围（0-100）。")
    print(f"分数已记录：{value}")

set_score(75)   # 正常记录
set_score(-5)   # 抛出 ValueError
```

调用方可以用 `try-except` 捕获这个异常并处理。

```python
try:
    set_score(-5)
except ValueError as e:
    print(f"输入无效：{e}")
```

`as e` 把异常对象赋给变量 `e`，可以通过它获取错误信息。主动抛出异常的好处是把校验逻辑集中在函数内部，调用方只需要决定如何处理，不必重复写校验代码。这类似于仓库在收到不合格货物时直接拒收并报错，调用方收到拒收通知后再决定如何处理，而不必每个调用方都自己去判断货物是否合格。

## 1.5.6 断言 assert 的基本用法

`assert` 语句用于断言某个条件必须为真。条件为假时抛出 `AssertionError`，并附带一条可选的错误消息。

```python
def calculate_amount(price, quantity):
    assert quantity > 0, "数量必须为正数"
    return price * quantity

print(calculate_amount(70, 5))   # 输出 350
print(calculate_amount(70, -5))  # 抛出 AssertionError: 数量必须为正数
```

`assert` 和 `raise` 都能用来检查条件，区别在于使用场景。`assert` 用于调试阶段确认程序内部状态符合预期，是开发者给自己留的检查点。`raise` 用于处理外部输入或运行时可能出现的错误，是程序正常逻辑的一部分。

需要注意的是，Python 启用优化模式（命令行加 `-O` 参数）时，`assert` 语句会被跳过。因此不要用 `assert` 做数据校验或权限检查这类必须执行的逻辑，那些场景应该用 `raise`。

## 1.5.7 调试概念

调试是定位和修正程序错误的过程。现代 IDE 提供了调试器，让你能在程序运行时观察它的内部状态。理解三个核心概念能帮助你高效使用调试器。

**断点**是程序暂停执行的位置。你在某一行代码上设置断点，程序运行到这一行时会停下来，把控制权交给你。这类似于在关键步骤暂停一下，确认状态再继续。

**单步执行**是让程序逐行运行的方式。你可以一行一行地执行代码，观察每一行执行后的效果，找出问题出现在哪一步。

**监视变量**是在程序暂停时查看变量当前值的功能。你可以指定要关注的变量，每次程序暂停时都看到它们的最新值，追踪数据在程序中的流动。

这三个概念组合起来，构成了调试的基本工作流：在怀疑出错的位置前设置断点，运行程序到断点处，单步执行观察变量变化，定位问题所在。

## 1.5.8 PyCharm 调试器基本操作

PyCharm 内置了功能完善的调试器。使用调试器的前提是设置断点。

设置断点的方法是在编辑器左侧的行号旁点击，会出现一个红点标记。再次点击可以取消断点。

启动调试的方式是点击工具栏上的虫子按钮（Debug 按钮），或使用快捷键 `Shift+F9`。程序会以调试模式运行，遇到第一个断点时暂停。

暂停后，调试工具栏提供几个关键按钮控制执行流程。

`Step Over`（快捷键 `F8`）执行当前行，如果当前行调用了函数，它把整个函数当作一步执行完，不进入函数内部。这适合你想知道函数返回结果但不关心函数内部细节的场景。

`Step Into`（快捷键 `F7`）执行当前行，如果当前行调用了函数，它会进入函数内部，让你逐行查看函数执行过程。这适合你需要排查函数内部问题的时候。

`Step Out`（快捷键 `Shift+F8`）从当前函数中跳出，执行到函数返回后的下一行。当你不小心进入了某个不关心的函数，想快速离开时用它。

调试面板下方的变量区会显示当前所有局部变量的值，你也可以手动添加表达式监视特定变量。结合断点和单步执行，能精确定位逻辑错误。

## 1.5.9 VS Code 调试器基本操作

VS Code 的调试功能通过 Python 扩展提供。安装 Python 扩展后，调试器就可以使用。

设置断点的方式与 PyCharm 类似，在编辑器左侧行号旁点击出现红点。

VS Code 的调试通过左侧的调试面板启动。第一次使用时需要创建调试配置。点击调试面板的齿轮图标或运行面板的「创建 launch.json 文件」，选择 Python File，会生成一个 `launch.json` 配置文件。

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: 当前文件",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal"
        }
    ]
}
```

这个配置表示调试当前打开的 Python 文件。配置好后，按 `F5` 启动调试，或点击调试面板顶部的绿色播放按钮。

调试控制按钮出现在编辑器顶部。`Continue`（`F5`）继续执行到下一个断点。`Step Over`（`F10`）不进入函数。`Step Into`（`F11`）进入函数。`Step Out`（`Shift+F11`）跳出函数。这些按钮的功能与 PyCharm 一致，只是快捷键略有不同。

左侧面板在调试时会显示变量、监视表达式、调用堆栈和断点列表。监视表达式可以手动添加，方便追踪关键变量。

## 1.5.10 Jupyter Notebook 中的调试

Jupyter Notebook 的交互式特性决定了它的调试方式有所不同。当某个单元格的代码抛出异常时，可以使用 `%debug` 魔术命令进入事后调试模式。

```python
# 假设这个单元格执行后报错
result = 10 / 0
```

报错后在新单元格中执行：

```python
%debug
```

这会进入 Python 的交互式调试器 `pdb`，光标停在出错的那一行。此时你可以查看当时的变量值，单步执行代码，查看调用堆栈。常用命令包括 `p 变量名` 打印变量值，`n` 执行下一行，`s` 进入函数，`c` 继续执行，`q` 退出调试器。

也可以在代码中插入 `breakpoint()` 函数主动暂停执行，进入调试器。这在你想在某个位置仔细检查状态时很有用。

```python
def process(data):
    total = sum(data)
    breakpoint()  # 执行到这里会暂停，进入调试器
    average = total / len(data)
    return average
```

Notebook 的调试适合探索性数据分析，因为代码是分单元格执行的，出错时只影响当前单元格，便于快速修正重跑。

## 1.5.11 使用 print() 输出中间变量进行简单调试

最朴素的调试方法是使用 `print()` 输出中间变量的值。虽然看起来原始，但在很多场景下它是最快最有效的调试手段，尤其是简单脚本或临时排查时。

典型用法是在怀疑有问题的代码前后插入 `print`，观察变量的值和类型。

```python
def analyze(data):
    print(f"输入数据：{data}")           # 查看输入
    print(f"数据类型：{type(data)}")     # 查看类型
    total = sum(data)
    print(f"总和：{total}")             # 查看中间结果
    count = len(data)
    print(f"数量：{count}")
    average = total / count
    print(f"平均值：{average}")
    return average

analyze([85, 90, 78, 92])
```

输出变量的类型尤其重要。很多运行时错误源于类型不符合预期，比如你以为拿到的是列表，实际拿到的是字符串。`print(type(变量))` 能立刻暴露这类问题。

调试完成后记得删除多余的 `print` 语句，避免污染正式输出。如果需要更结构化的日志，可以使用 `logging` 模块，它支持分级输出和写入文件，适合稍大一点的项目。但在学习阶段，`print` 调试完全够用。

## 练习题

### 第1题 概念理解

判断下面四段代码各自会抛出什么异常，写出异常类型名称并简要说明原因。

```python
# 代码一
print(undefined_var)

# 代码二
result = 10 / 0

# 代码三
numbers = [1, 2, 3]
print(numbers[5])

# 代码四
value = int("abc")
```

::: details 参考答案
代码一抛出 `NameError`，使用了未定义的变量 `undefined_var`。代码二抛出 `ZeroDivisionError`，除数为零。代码三抛出 `IndexError`，列表索引 5 超出了长度为 3 的列表范围。代码四抛出 `ValueError`，字符串 `"abc"` 不是合法的整数字面量，无法被 `int()` 解析。

读懂异常类型是排查问题的第一步。异常名称通常能直接提示出错原因，遇到报错时应先看异常类型和错误信息，再定位到出错行。
:::

### 第2题 代码编写

编写一个函数 `safe_int_convert`，接收一个字符串参数，尝试将其转换为整数。转换成功返回整数，转换失败返回 `None` 并打印一条提示信息。要求用 `try-except` 结构处理 `ValueError`。

::: details 参考答案
```python
def safe_int_convert(text):
    """把字符串安全转换为整数，失败时返回 None。"""
    try:
        return int(text)
    except ValueError:
        print(f"无法将 '{text}' 转换为整数")
        return None

print(safe_int_convert("42"))    # 42
print(safe_int_convert("3.14"))  # 提示并返回 None
print(safe_int_convert("abc"))   # 提示并返回 None
```

`try` 块中放可能出错的转换操作，`except ValueError` 捕获转换失败的情况。返回 `None` 让调用方可以通过判断返回值决定后续处理。这种模式在处理用户输入或外部数据时很常用，避免一条坏数据导致整个程序崩溃。
:::

### 第3题 进阶练习

编写一个函数 `safe_divide` 接收两个参数 `a` 和 `b`，返回 `a / b` 的结果。要求处理两种异常：当 `b` 为零时捕获 `ZeroDivisionError` 并返回 `None`，当 `a` 或 `b` 不是数字时捕获 `TypeError` 并返回 `None`。使用 `try-except-else-finally` 完整结构，在 `finally` 块中打印本次计算结束的提示。

::: details 参考答案
```python
def safe_divide(a, b):
    """安全除法，处理除零和类型错误。"""
    try:
        result = a / b
    except ZeroDivisionError:
        print("错误：除数不能为零")
        return None
    except TypeError:
        print("错误：参数必须是数字")
        return None
    else:
        print(f"计算成功：{a} / {b} = {result}")
        return result
    finally:
        print("本次计算结束")

print(safe_divide(10, 4))    # 计算成功，返回 2.5
print(safe_divide(10, 0))    # 除零错误，返回 None
print(safe_divide("10", 4))  # 类型错误，返回 None
```

`try` 块执行可能出错的操作，两个 `except` 分别处理不同异常类型。`else` 块在没有异常时执行，打印成功结果。`finally` 块无论是否异常都会执行，用于打印结束提示。实际开发中 `finally` 更常用于关闭文件、释放资源等必须执行的清理操作。
:::

### 第4题 项目实践

命令行任务管理器需要从文件读取任务数据，文件可能不存在、内容格式可能错误。请思考读取任务文件时可能遇到哪些异常，应该如何用 `try-except` 结构处理，让程序在文件缺失或格式错误时仍能正常运行而不崩溃。

::: details 参考答案
读取任务文件可能遇到三类异常。文件不存在时抛出 `FileNotFoundError`，此时可以提示用户并返回空任务列表，让程序以全新状态启动。文件内容格式错误（如解析失败）抛出 `ValueError` 或其他解析异常，此时可以提示数据损坏并返回空列表。权限不足时抛出 `PermissionError`，提示用户检查文件权限。

```python
def load_tasks(filename):
    """从文件加载任务列表，出错时返回空列表。"""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()
        # 这里简化处理，实际解析逻辑后续章节展开
        return content
    except FileNotFoundError:
        print(f"任务文件 {filename} 不存在，将以空列表启动")
        return []
    except PermissionError:
        print(f"无权限读取 {filename}，请检查文件权限")
        return []
    except Exception as e:
        print(f"读取任务文件出错：{e}")
        return []
```

针对具体异常类型分别处理，比用一个空的 `except:` 捕获所有异常更安全。空的 `except:` 会掩盖真正的问题，让你无从排查。`with` 语句保证文件在任何情况下都会被正确关闭。
:::

## 常见错误

**错误 1 · `空 except 子句捕获所有异常导致问题被掩盖`**

原因:使用空的 `except:` 子句捕获所有异常，包括 `KeyboardInterrupt`、`SystemExit` 等不应被拦截的异常，导致程序出错时无任何提示或被静默吞掉。

解决:始终指定具体的异常类型，如 `except ValueError:`、`except (FileNotFoundError, PermissionError):`。需要捕获多种异常时用元组列出，需要打印异常信息时用 `except Exception as e:` 并在块内记录 `e`。

**错误 2 · `except 子句顺序写反导致特定异常永远捕获不到`**

原因:多个 `except` 子句时，父类异常（如 `Exception`）写在子类异常（如 `ValueError`）之前，Python 按顺序匹配，子类异常永远被父类捕获，后面的具体处理代码不会执行。

解决:把更具体的异常类型写在前面，更通用的异常写在后面。例如先写 `except ValueError:`，再写 `except Exception:`。

**错误 3 · `assert 在生产环境被跳过导致校验失效`**

原因:用 `assert` 做数据校验或权限检查，但生产环境用 `python -O` 启用优化模式后，`assert` 语句被跳过，校验逻辑失效。

解决:数据校验、权限检查等必须执行的逻辑用 `raise` 主动抛出异常。`assert` 仅用于调试阶段的内部状态确认，不要承担业务校验职责。

**错误 4 · `finally 块中的 return 吞掉了异常`**

原因:在 `finally` 块中使用 `return`，会覆盖 `try` 块中的返回值，并且吞掉 `try` 块中尚未处理的异常，导致问题难以排查。

解决:`finally` 块只放清理代码（如关闭文件、释放锁），不要在其中使用 `return`。需要返回值时让 `try` 或 `else` 块负责返回。
