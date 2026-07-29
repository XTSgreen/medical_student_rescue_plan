---
title: 1.2 第一个Python程序与基本交互模式
sidebar:
  order: 2
---
# 1.2 第一个Python程序与基本交互模式

<span class="chapter-tag">Python核心语法基础</span>

安装好 Python 环境后，下一步就是真正动手写代码。Python 提供了两种最基本的代码执行方式：交互式环境和脚本文件。前者适合随手试验、快速验证想法，后者适合编写完整程序。本节将从这两种方式入手，介绍 print、input、注释、缩进等最基础的语法要素，帮助你迈出编程的第一步。

## 1.2.1 交互式环境 REPL

### 启动与退出

REPL 是 Read-Eval-Print Loop 的缩写，意思是"读取、求值、打印、循环"。打开命令行（Windows 的 cmd 或 PowerShell，macOS/Linux 的 Terminal），输入 `python` 或 `python3` 并回车，就会进入 REPL 环境：

```bash
$ python3
Python 3.11.5 (main, Sep 11 2023, 13:31:39)
[GCC 11.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

那三个大于号 `>>>` 就是 REPL 的提示符，等待你输入 Python 代码。退出 REPL 有三种方式：输入 `exit()` 或 `quit()` 并回车，或者按 `Ctrl+D`（macOS/Linux）/ `Ctrl+Z` 然后回车（Windows）。

### 逐行执行与即时反馈

REPL 的核心特征是**逐行执行**：你输入一行代码，按下回车，Python 立即执行并显示结果。这种即时反馈让 REPL 成为学习和试验的绝佳工具。

```python
>>> 2 + 3
5
>>> "Hello"
'Hello'
>>> name = "张三"
>>> print(name)
张三
```

注意第一个例子 `2 + 3`，你并没有调用 `print`，REPL 却显示了结果 `5`。这是因为 REPL 会自动打印表达式的返回值。但在脚本文件中，只有 `print()` 才会在屏幕上显示输出，这一点稍后会详细说明。

::: note REPL 的适用场景
REPL 适合验证一个函数的用法、测试一段逻辑、查看某个模块的属性。当代码需要反复运行或保存时，应该写成脚本文件。可以把 REPL 想象成草稿纸上的快速演算——方便快捷但不能替代正式程序。
:::

## 1.2.2 脚本文件的创建与执行

### 文件命名规则

Python 脚本文件以 `.py` 为扩展名。文件命名应遵循以下规则：只能使用字母、数字和下划线，不能以数字开头，区分大小写。按照 PEP 8 规范，文件名用小写字母加下划线分隔，例如 `data_analysis.py`、`data_clean.py`。

### 命令行执行脚本

用任意文本编辑器创建一个文件 `hello.py`，写入以下内容：

```python
print("Hello, World!")
print("欢迎学习 Python")
```

保存后在命令行中执行：

```bash
python hello.py
```

输出：

```text
Hello, World!
欢迎学习 Python
```

如果当前目录不在脚本所在目录，需要先 `cd` 切换到脚本目录，或者给出完整路径。

### 在 IDE 中运行脚本

在 PyCharm 中，打开脚本文件后点击工具栏的绿色运行按钮，或按 `Shift+F10` 即可运行。PyCharm 会在下方的 Run 窗口显示输出。

在 VS Code 中，打开脚本文件后按 `F5`（或点击运行按钮），选择 "Python File" 即可运行。输出显示在下方的 Terminal 面板。

### 在 Jupyter Notebook 中执行单元格

Jupyter Notebook 以单元格（cell）为执行单位。单元格分为两种类型：Code 单元格用于写代码，Markdown 单元格用于写文字。执行单元格的快捷键有两个：

`Shift+Enter` 执行当前单元格并自动跳到下一个单元格。`Ctrl+Enter` 执行当前单元格但停留在原地。在学习和数据分析过程中，你会频繁使用这两个快捷键。

## 1.2.3 输出与输入

### print() 函数

`print()` 是 Python 中最常用的输出函数。它的基本用法很简单：

```python
print("Hello, World!")
print(42)
print(3.14)
```

`print()` 可以一次输出多个对象，默认用空格分隔：

```python
print("用户名:", "张三", "年龄:", 25)
# 输出: 用户名: 张三 年龄: 25
```

通过 `sep` 参数可以自定义分隔符：

```python
print("2024", "01", "15", sep="-")
# 输出: 2024-01-15
```

通过 `end` 参数可以自定义结束符。默认 `end="\n"`（换行），如果不想换行，可以改为空字符串或其他字符：

```python
print("加载中", end="")
print("...", end="")
print("完成")
# 输出: 加载中...完成
```

### input() 函数

`input()` 用于从键盘读取用户输入。程序执行到 `input()` 时会暂停，等待用户输入一行文字并按下回车：

```python
name = input("请输入用户名：")
print("你好，" + name)
```

运行效果：

```text
请输入用户名：李四
你好，李四
```

需要特别注意：**`input()` 的返回值始终是字符串类型**，即使用户输入的是数字。如果需要数值，必须手动转换：

```python
age_str = input("请输入年龄：")
age = int(age_str)  # 将字符串转换为整数
print("明年你", age + 1, "岁")
```

如果忘记转换，直接做算术运算，会得到 `TypeError`：

```python
age = input("请输入年龄：")  # age 是字符串 "25"
print(age + 1)  # TypeError: can only concatenate str to str
```

这个错误在初学者中极为常见。记住 `input()` 返回字符串，需要 `int()` 或 `float()` 转换为数值。

## 1.2.4 注释

### 注释的写法

Python 的单行注释以 `#` 开头，从 `#` 到行末的内容都会被解释器忽略：

```python
# 这是单行注释
x = 10  # 这也是注释，在代码后面
```

Python 没有专门的多行注释语法。通常用三引号字符串来模拟多行注释：

```python
"""
这是多行注释。
三引号字符串如果不被赋值给变量，
解释器会忽略它（技术上它是一个字符串表达式语句）。
"""
```

### 注释的规范

好的注释解释**为什么**这样做，而不是**做了什么**。代码本身已经说明了做什么，注释应该补充代码无法表达的设计意图：

```python
# 好的注释：解释原因
# 使用中位数而非均值，因为数据存在极端异常值
center = sorted(data)[len(data) // 2]

# 坏的注释：重复代码内容
# 将 data 排序后取中间值
center = sorted(data)[len(data) // 2]
```

注释应该与代码同步更新。过时的注释比没有注释更危险，因为它会误导读者。

## 1.2.5 缩进与代码块

### 缩进规则

Python 与 C、Java、JavaScript 等语言最大的语法差异在于：**Python 用缩进表示代码块，而不是大括号 `{}`**。同一代码块中的语句必须有相同的缩进量：

```python
if True:
    print("这行在 if 块内")    # 4 个空格缩进
    print("这行也在 if 块内")  # 同样 4 个空格
print("这行在 if 块外")        # 无缩进，不属于 if 块
```

PEP 8 建议每级缩进使用 **4 个空格**，不用 Tab。混用空格和 Tab 会导致 `IndentationError`，这是初学者常犯的错误。

### 语句分隔与行续

Python 默认一行就是一条语句，不需要分号结尾。多条语句写在一行可以用分号 `;` 分隔，但这种写法不推荐，会降低可读性：

```python
x = 1; y = 2; z = 3  # 合法但不推荐
```

当一条语句太长需要换行时，有两种方式。第一种是反斜杠 `\` 显式行续：

```python
total = 1 + 2 + 3 + 4 + 5 + \
        6 + 7 + 8 + 9 + 10
```

第二种是括号内隐式换行，这种更推荐：

```python
total = (1 + 2 + 3 + 4 + 5 +
         6 + 7 + 8 + 9 + 10)
```

在括号 `()`、`[]`、`{}` 内部换行，Python 会自动识别，不需要反斜杠。

### 空语句 pass

`pass` 是一个什么都不做的语句，起到占位作用。当你定义一个函数或类但还没写具体逻辑时，用 `pass` 填充避免语法错误：

```python
def analyze_data(data):
    pass  # TODO: 待实现

class User:
    pass  # TODO: 待实现
```

可以把它理解成占位符：暂时没有具体逻辑，但位置先占住，后续再补充。

## 1.2.6 小结

本节涵盖了 Python 编程的两种基本执行方式（REPL 和脚本文件），输入输出函数 `print()` 和 `input()`，注释写法，以及 Python 独特的缩进语法。这些是后续所有章节的基础。下一节将正式进入编程核心概念，学习变量、数据类型和运算符。
