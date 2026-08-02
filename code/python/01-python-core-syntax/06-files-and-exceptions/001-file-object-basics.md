---
title: 6.1 文件对象基础与打开模式
sidebar:
  order: 1
---
# 6.1 文件对象基础与打开模式

程序运行时的数据都停留在内存中，一旦进程结束就会消失。要把数据长期保存，或者在不同程序之间传递，就需要借助文件。文件是操作系统提供的外存抽象，程序通过文件对象与磁盘上的数据进行交互。Python 用内置的 `open()` 函数打开文件，返回一个文件对象，后续的读写操作都通过这个对象完成。本节将系统讲解 `open()` 函数的用法、各种打开模式的含义、组合模式的规则，以及文件对象的常用属性和关闭方法，为后续的读写操作打下基础。命令行任务管理器需要把任务列表持久化到文件中，掌握文件对象的基本用法是实现这一功能的第一步。

## 6.1.1 open() 函数的基本用法

`open()` 是 Python 内置函数，用于打开文件并返回一个文件对象。它最常用的形式是 `open(file, mode='r')`，其中 `file` 是文件路径字符串，`mode` 是打开模式。不指定 mode 时默认为 `'r'`，即只读文本模式。

```python
# 以默认的只读模式打开当前目录下的文件
f = open("tasks.txt")
print(type(f))  # <class '_io.TextIOWrapper'>
f.close()
```

`open()` 返回的对象类型取决于打开模式。文本模式下返回 `TextIOWrapper`，二进制模式下返回 `BufferedReader` 或 `BufferedWriter`。日常编程中无需关心这些具体类型，把它们都当作文件对象使用即可。

`open()` 的完整签名是 `open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)`。本节重点关注 `file` 和 `mode` 两个参数，其余参数在后续章节的对应主题中展开。

### file 参数

`file` 参数接受一个表示路径的字符串，可以是相对路径也可以是绝对路径。相对路径以当前工作目录为基准，绝对路径从根目录开始。Windows 下路径分隔符可以用正斜杠 `/` 也可以用反斜杠 `\\`，推荐使用正斜杠以避免转义问题。

```python
# 相对路径
f1 = open("data/tasks.txt")

# 绝对路径（Windows）
f2 = open("D:/projects/task_manager/tasks.txt")

# 绝对路径（Linux/macOS）
# f3 = open("/home/user/projects/tasks.txt")
```

### mode 参数

`mode` 参数是一个字符串，由若干模式字符组合而成，决定了文件的打开方式，包括读还是写、文本还是二进制、覆盖还是追加等。mode 的默认值是 `'r'`，表示以文本模式只读打开。

## 6.1.2 基本打开模式

Python 提供六种基本模式字符，每种字符代表一个维度的选择。理解每个字符的含义是组合模式的基础。

### 只读模式 'r'

`'r'` 表示只读打开，文件必须已经存在，否则抛出 `FileNotFoundError`。这是最安全的模式，不会修改文件内容，适合读取已有数据。在任务管理器中读取已保存的任务列表时使用此模式。

```python
f = open("tasks.txt", "r")
content = f.read()
f.close()
```

### 只写模式 'w'

`'w'` 表示只写打开。如果文件存在，**内容会被清空**；如果文件不存在，会创建新文件。这种模式具有破坏性，使用前要确认是否真的需要覆盖原文件。写入新任务列表覆盖旧数据时常用此模式。

```python
f = open("tasks.txt", "w")
f.write("学习 Python 基础\n")
f.close()
# 如果 tasks.txt 原本有内容，现在已经被清空并写入新内容
```

### 独占创建模式 'x'

`'x'` 表示独占创建，仅在文件不存在时才能打开。如果文件已存在，抛出 `FileExistsError`。这种模式用于确保不会意外覆盖已有文件，适合创建新配置文件、新数据文件等场景。

```python
try:
    f = open("new_tasks.txt", "x")
    f.write("首次创建\n")
    f.close()
except FileExistsError:
    print("文件已存在，未覆盖")
```

### 追加模式 'a'

`'a'` 表示追加写入。文件存在时在末尾追加内容，文件不存在时创建新文件。追加模式不会清空原文件，适合日志记录、增量保存等场景。任务管理器中追加新任务到日志文件时可以使用此模式。

```python
f = open("task_log.txt", "a")
f.write("2026-08-01 新增任务：复习文件操作\n")
f.close()
# 内容追加到文件末尾，原内容保留
```

### 文本模式 't'

`'t'` 表示文本模式，是默认模式，通常省略不写。文本模式下读写的内容是字符串，会涉及编码解码过程，换行符也会被自动转换。文本模式适合处理 `.txt`、`.csv`、`.md` 等文本文件。

### 二进制模式 'b'

`'b'` 表示二进制模式。二进制模式下读写的内容是 `bytes` 对象，不经过编码解码，按原始字节处理。二进制模式适合处理图片、音频、视频、压缩包等非文本文件。`'b'` 必须与 `'r'`、`'w'`、`'a'`、`'x'` 之一组合使用，不能单独使用。

```python
# 二进制读取图片
f = open("logo.png", "rb")
data = f.read()
f.close()
print(type(data))  # <class 'bytes'>
```

### 读写更新模式 '+'

`'+'` 表示在原有模式基础上增加写或读能力。`'r+'` 表示读写，文件必须存在；`'w+'` 表示写读，文件存在则清空；`'a+'` 表示追加读写。`'+'` 也不能单独使用，必须与前述基本模式组合。读写模式适合需要先读后写或先写后读的场景，但对文件指针位置有要求，使用时要格外小心。

## 6.1.3 组合模式

实际使用中，模式字符可以组合使用，形成更精确的打开方式。组合规则是把读写模式字符（r/w/x/a）与类型字符（b/t）和更新字符（+）拼接在一起。下表列出常用的组合模式。

| 组合模式 | 含义 | 文件不存在时 | 文件存在时 |
|----------|------|--------------|------------|
| `'r'` | 文本只读（默认） | 报错 | 从开头读 |
| `'w'` | 文本只写 | 创建 | 清空后写 |
| `'a'` | 文本追加 | 创建 | 末尾追加 |
| `'x'` | 文本独占创建 | 创建 | 报错 |
| `'rb'` | 二进制只读 | 报错 | 从开头读 |
| `'wb'` | 二进制只写 | 创建 | 清空后写 |
| `'ab'` | 二进制追加 | 创建 | 末尾追加 |
| `'r+'` | 文本读写 | 报错 | 从开头读写 |
| `'w+'` | 文本写读 | 创建 | 清空后读写 |
| `'a+'` | 文本追加读写 | 创建 | 末尾追加可读 |

```python
# 组合模式示例
f = open("tasks.txt", "r+")  # 读写模式，文件必须存在
f = open("tasks.txt", "w+b") # 二进制写读，清空原文件
f = open("tasks.txt", "a+")  # 追加读写模式
```

模式字符的书写顺序不影响结果，`'rb'` 和 `'br'` 等价，但习惯上把读写字符写在前面、类型字符写在后面。模式字符串中不能有重复或矛盾的字符，比如 `'rw'` 是非法的。

::: warning r+ 模式不会清空文件
`'r+'` 和 `'w+'` 都能读写，区别在于 `'r+'` 不会清空已有内容，文件指针在开头；`'w+'` 会先清空文件。需要修改文件中部分内容时用 `'r+'`，需要完全重写时用 `'w+'`。
:::

## 6.1.4 文件对象的常用属性

文件对象提供若干只读属性，可以查询文件的当前状态。这些属性在调试和日志记录时很有用。

### closed 属性

`closed` 是一个布尔值，表示文件是否已关闭。文件关闭后不能再进行读写操作，否则抛出 `ValueError`。

```python
f = open("tasks.txt", "w")
print(f.closed)  # False
f.close()
print(f.closed)  # True
```

### mode 属性

`mode` 属性返回打开时使用的模式字符串，方便在程序中确认文件的打开方式。

```python
f = open("tasks.txt", "w+")
print(f.mode)  # w+
f.close()
```

### name 属性

`name` 属性返回传入 `open()` 的文件名或路径字符串，便于在错误处理时定位是哪个文件出了问题。

```python
f = open("tasks.txt", "r")
print(f.name)  # tasks.txt
f.close()
```

### encoding 属性

`encoding` 属性仅在文本模式下有意义，返回文件使用的编码名称。未指定 encoding 时，默认值取自 `locale.getpreferredencoding()`，在中文 Windows 上通常是 `'cp936'`，在 Linux 和 macOS 上通常是 `'utf-8'`。读写文本文件时**强烈建议显式指定 encoding**，避免跨平台出现编码问题。

```python
f = open("tasks.txt", "r", encoding="utf-8")
print(f.encoding)  # utf-8
f.close()
```

## 6.1.5 文件关闭方法 file.close()

文件对象占用操作系统资源，包括文件描述符和缓冲区。操作系统对每个进程能打开的文件数量有限制（Linux 下默认通常是 1024 个），不及时关闭会耗尽资源。`close()` 方法用于显式关闭文件，释放底层资源，并把缓冲区中尚未写入磁盘的数据刷盘。

```python
f = open("tasks.txt", "w")
f.write("重要数据")
# 如果此时程序崩溃，缓冲区的内容可能还没写入磁盘
f.close()  # close 时会自动 flush 缓冲区
```

调用 `close()` 后，文件对象进入关闭状态，再次调用读写方法会抛出 `ValueError: I/O operation on closed file`。重复调用 `close()` 不会报错，是安全的。

文件关闭后，相关属性如 `closed` 变为 `True`，但 `name`、`mode`、`encoding` 等属性仍然可以访问，便于事后排查。

## 6.1.6 with 语句自动关闭文件

手动调用 `close()` 容易遗漏，尤其是在异常发生时，close 调用可能被跳过。Python 的 `with` 语句能在代码块结束时自动关闭文件，即使在块内抛出异常也会保证关闭。这是处理文件的推荐做法，第 6 章会详细讲解 with 的原理，这里先掌握用法。

```python
# 推荐写法：使用 with 自动关闭
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("学习文件操作\n")
    f.write("完成练习题\n")
# 离开 with 块后文件自动关闭

print(f.closed)  # True
```

`with open(...) as f:` 把 `open()` 返回的文件对象绑定到变量 `f`，代码块执行完毕后自动调用 `f.close()`。这种写法等价于 `try-finally` 加 `close()`，但更加简洁安全。第 3 章已经介绍了 with 语句在控制结构层面的角色，本章后续会从文件操作角度进一步展开。

::: tip 始终用 with 处理文件
养成使用 `with open(...) as f:` 的习惯，可以避免绝大多数文件泄漏问题。只有在需要长期保持文件打开（如交互式调试）的特殊场景下，才考虑手动 close。
:::

## 练习题

1. 简述 `'r'`、`'w'`、`'a'`、`'x'` 四种基本模式在文件已存在和不存在时的行为差异。如果任务管理器要在程序启动时加载已有任务列表，文件不存在时返回空列表，应该用哪种模式？为什么？

::: details 参考答案
`'r'` 模式下文件不存在会抛出 `FileNotFoundError`，文件存在时从开头只读；`'w'` 模式下文件不存在会创建新文件，文件存在时清空内容；`'a'` 模式下文件不存在会创建新文件，文件存在时在末尾追加；`'x'` 模式下文件不存在会创建新文件，文件存在时抛出 `FileExistsError`。

加载任务列表应使用 `'r'` 模式，并用 try-except 捕获 `FileNotFoundError`，捕获到异常时返回空列表。这样既能正确读取已有数据，又能在首次运行时优雅处理文件缺失的情况。不应使用 `'w'` 或 `'a'`，因为它们会创建空文件或修改文件，加载阶段只需要读取。
:::

2. 写一段代码，使用组合模式以二进制方式读取一个图片文件 `logo.png`，打印出读取到的字节数据的类型和长度，并确保文件被正确关闭。

::: details 参考答案
```python
with open("logo.png", "rb") as f:
    data = f.read()
print(type(data))   # <class 'bytes'>
print(len(data))    # 图片的字节数
```
使用 `'rb'` 模式以二进制方式打开，read 返回 bytes 对象。用 with 语句保证文件自动关闭，避免资源泄漏。`len(data)` 返回字节总数。
:::

3. 解释为什么读写文本文件时应当显式指定 `encoding='utf-8'` 参数。如果不指定，在不同操作系统上可能出现什么问题？

::: details 参考答案
不指定 encoding 时，Python 使用 `locale.getpreferredencoding()` 返回的默认编码，这个值因操作系统和区域设置而异。中文 Windows 上通常是 `cp936`（即 GBK），Linux 和 macOS 上通常是 `utf-8`。

如果在 Windows 上用默认编码写了一个文件，再到 Linux 上读取，由于默认编码不同，会出现 `UnicodeDecodeError` 或者读出乱码。显式指定 `encoding='utf-8'` 可以保证跨平台行为一致，UTF-8 也是当今文本文件的事实标准编码。任务管理器的数据文件可能在不同环境间传递，统一使用 UTF-8 是最稳妥的选择。
:::

4. 下列代码有什么问题？请指出并改正。

```python
f = open("tasks.txt", "w")
f.write("任务一")
# 此处发生异常
result = 10 / 0
f.write("任务二")
f.close()
```

::: details 参考答案
问题有两个。第一，`10 / 0` 会抛出 `ZeroDivisionError`，导致 `f.close()` 永远不会执行，文件不会被关闭，造成资源泄漏，而且缓冲区中已写入的"任务一"可能还没刷盘。第二，即使没有异常，手动 close 的写法也不够稳健。

改用 with 语句：

```python
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("任务一")
    result = 10 / 0  # 异常发生时 with 仍会关闭文件
    f.write("任务二")
```

这样无论是否发生异常，文件都会被正确关闭。同时建议显式指定 encoding 以保证跨平台一致性。
:::

## 常见错误

**错误 1 · `FileNotFoundError: [Errno 2] No such file or directory: 'tasks.txt'`**

原因:以 `'r'` 或 `'r+'` 模式打开一个不存在的文件，Python 不会自动创建，直接抛出异常。这是文件读取中最常见的错误，常发生在首次运行程序或路径写错时。

解决:读取前用 `os.path.exists()` 判断文件是否存在，或用 try-except 捕获 `FileNotFoundError` 后返回默认值。需要创建文件时改用 `'w'`、`'a'` 或 `'x'` 模式。

**错误 2 · `ValueError: I/O operation on closed file.`**

原因:调用 `f.close()` 关闭文件后，又对 `f` 调用了 `read()`、`write()` 等方法。文件关闭后底层资源已释放，不再支持读写操作。

解决:检查代码逻辑，确保所有读写操作都在 `close()` 之前完成，或使用 `with` 语句让文件在块内保持打开状态。读写前可用 `f.closed` 属性判断文件状态。

**错误 3 · `UnicodeDecodeError: 'gbk' codec can't decode byte ... in position ...`**

原因:在中文 Windows 上以默认编码（cp936/GBK）读取一个 UTF-8 编码的文件，遇到 GBK 无法解码的字节序列时抛出异常。`open()` 未显式指定 encoding 时使用系统默认编码，跨平台传输文件时极易出现此问题。

解决:打开文本文件时显式指定 `encoding='utf-8'`，与文件实际保存编码保持一致。不确定编码时可用 `errors='replace'` 容错读取，再排查原始编码。
