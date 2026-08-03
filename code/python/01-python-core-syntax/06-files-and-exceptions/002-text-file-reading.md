---
title: 6.2 文本文件读取
sidebar:
  order: 2
---
# 6.2 文本文件读取

打开文件之后，下一步就是读取内容。文本文件的读取看似简单，实际涉及多种读取方式、编码处理和换行符转换等细节。选择合适的读取方法，既能简化代码，又能避免内存浪费。本节将讲解 `read()`、`readline()`、`readlines()` 三种基础读取方法，以及把文件对象作为可迭代对象逐行读取的用法，并讨论编码参数、错误处理参数和大文件读取策略。命令行任务管理器需要从文件中加载任务列表，这些读取方法是实现加载功能的核心工具。

## 6.2.1 read() 方法读取全部或指定字符数

`read(size)` 方法从当前文件指针位置读取内容。不传参数或传 `-1` 时读取文件全部内容，返回一个字符串。传入正整数 `size` 时，最多读取 size 个字符（注意文本模式下是字符数，不是字节数），返回包含这些字符的字符串。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(content)
```

假设 `tasks.txt` 的内容是三行任务，`read()` 不带参数会把整个文件作为一个字符串返回，字符串中包含换行符 `\n`。这种写法适合文件体积不大、需要一次性处理的场景。

指定 size 参数时，每次调用读取一部分，文件指针会随之移动。连续调用 `read()` 可以分段读取整个文件。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    chunk1 = f.read(5)   # 读取前 5 个字符
    chunk2 = f.read(5)   # 读取接下来 5 个字符
    rest = f.read()      # 读取剩余全部
    print(repr(chunk1))
    print(repr(chunk2))
    print(repr(rest))
```

当文件指针到达末尾后，继续调用 `read()` 返回空字符串 `''`，这是判断读取结束的依据。

## 6.2.2 readline() 方法读取单行

`readline(size)` 方法每次读取一行，返回的字符串**包含行尾的换行符**。读到文件末尾时返回空字符串 `''`，这是与读到空行的区别，空行返回的是 `'\n'` 而非空字符串。可选的 size 参数限制本次读取的最大字符数，但遇到换行符就停止。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    line1 = f.readline()
    line2 = f.readline()
    print(repr(line1))  # '学习 Python 基础\n'
    print(repr(line2))  # '完成练习题\n'
```

`readline()` 适合按行处理且需要精确控制读取进度的场景。比如任务管理器读取任务文件时，可以逐行解析每条任务的字段。注意返回值末尾带有换行符，使用前通常需要调用 `strip()` 去除。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    while True:
        line = f.readline()
        if not line:  # 空字符串表示文件结束
            break
        task = line.strip()
        print(f"加载任务：{task}")
```

## 6.2.3 readlines() 方法读取所有行

`readlines(hint)` 方法一次性读取文件所有行，返回一个字符串列表，每个元素是一行内容（包含换行符）。这种写法适合需要随机访问某一行，或者一次性把所有行加载到内存的场景。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print(lines)
    # ['学习 Python 基础\n', '完成练习题\n', '提交作业\n']
    print(lines[0])  # 学习 Python 基础\n
```

`readlines()` 会把整个文件读入内存，对于大文件来说可能造成内存压力。可选的 `hint` 参数是一个字节数提示，当已读取的字节数超过 hint 时停止读取，但实际使用频率较低。

需要去除每行换行符时，常用列表推导式处理：

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    tasks = [line.strip() for line in f.readlines()]
print(tasks)  # ['学习 Python 基础', '完成练习题', '提交作业']
```

## 6.2.4 文件对象作为可迭代对象逐行读取

文件对象本身是可迭代的，直接用 `for line in file:` 就能逐行遍历整个文件。这种写法最 Pythonic，也是最推荐的逐行读取方式。它的优势在于内存效率高，每次只在内存中保留当前行，适合处理大文件。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    for line in f:
        task = line.strip()
        print(f"处理：{task}")
```

这种写法与 `readlines()` 配合 for 循环的区别在于内存占用。`readlines()` 先把所有行加载到列表，再遍历列表；直接遍历文件对象则是边读边遍历，内存中只保留一行。对于任务管理器这种文件规模不大的场景，两种写法都可以；对于日志文件这种可能几百 MB 的场景，应当使用直接遍历。

::: tip for line in file 是首选
在不确定文件大小时，优先使用 `for line in f:` 的写法。它既简洁又节省内存，是 Python 处理文本文件的标准模式。
:::

## 6.2.5 换行符处理与 newline 参数

不同操作系统使用不同的换行符。Windows 使用 `\r\n`，Linux 和 macOS 使用 `\n`。Python 文本模式默认会做换行符转换，把读取到的各种换行符统一转换为 `\n`，写入时再把 `\n` 转换为系统默认换行符。这种**通用换行符**机制让代码在不同平台间移植时无需关心换行符差异。

`open()` 的 `newline` 参数可以控制这一行为。默认值 `None` 启用通用换行符转换，读取时 `\r\n`、`\r`、`\n` 都被转换为 `\n`。设为 `''` 时仍然识别各种换行符但不做转换，原样保留。设为 `'\n'`、`'\r'`、`'\r\n'` 之一时，只识别指定的换行符。

```python
# 默认行为：换行符统一为 \n
with open("tasks.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(repr(line))  # 行尾是 \n

# 不转换：保留原始换行符
with open("tasks.txt", "r", encoding="utf-8", newline="") as f:
    for line in f:
        print(repr(line))  # 行尾可能是 \r\n 或 \n
```

处理 CSV 文件等对换行符敏感的格式时，通常设置 `newline=''` 来禁用转换，由专门的解析器处理换行符。日常读取普通文本文件保持默认即可。

## 6.2.6 encoding 参数指定文件编码

文本文件的内容在磁盘上以字节形式存储，读取时需要按某种编码把字节解码为字符串。`encoding` 参数指定解码使用的编码名称。常见的编码有 `'utf-8'`、`'gbk'`、`'ascii'`、`'latin-1'` 等。

```python
# 以 UTF-8 编码读取（推荐）
with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()

# 以 GBK 编码读取（中文 Windows 旧文件）
with open("old_tasks.txt", "r", encoding="gbk") as f:
    content = f.read()
```

编码选择必须与文件实际保存的编码一致，否则会出现 `UnicodeDecodeError` 或者读出乱码。如果不确定文件编码，可以尝试用 `chardet` 等第三方库检测，但检测不是百分之百准确。UTF-8 是目前最通用的编码，新建文件时统一使用 UTF-8 可以避免大部分编码问题。

## 6.2.7 errors 参数处理编码错误

当文件中存在无法按指定编码解码的字节时，Python 默认抛出 `UnicodeDecodeError`。`errors` 参数可以改变这一行为，提供更灵活的错误处理策略。

| errors 值 | 行为 |
|-----------|------|
| `'strict'` | 抛出 UnicodeDecodeError（默认） |
| `'ignore'` | 忽略无法解码的字节 |
| `'replace'` | 用替换字符 `�` 代替 |
| `'backslashreplace'` | 用反斜杠转义序列代替 |
| `'surrogateescape'` | 用代理字符保留原始字节 |

```python
# 忽略无法解码的字节
with open("tasks.txt", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# 替换为占位符
with open("tasks.txt", "r", encoding="utf-8", errors="replace") as f:
    content = f.read()
```

`'ignore'` 和 `'replace'` 会让数据丢失或失真，只适合容错读取的场景，比如分析日志时跳过个别坏字符。正式处理数据时应当先修正编码，而不是用 errors 参数掩盖问题。

## 6.2.8 大文件读取策略

当文件体积很大，无法一次性装入内存时，需要采用流式读取策略。核心原则是分块处理，每次只读取一部分数据，处理完再读取下一部分。

逐行读取是常用的大文件处理方式，因为文本文件天然以行为单位组织：

```python
def count_lines(path):
    count = 0
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            count += 1
    return count
```

如果单行非常长，可以使用 `read(size)` 分块读取，按固定字符数处理：

```python
def process_large_file(path, chunk_size=4096):
    with open(path, "r", encoding="utf-8") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            # 处理这一块数据
            process_chunk(chunk)
```

任务管理器的任务文件通常不会很大，但日志文件可能随时间增长。理解大文件读取策略，有助于在项目扩展时避免内存问题。

## 6.2.9 读取空文件和文件末尾的行为

读取空文件时，各种方法都返回空值。`read()` 返回空字符串 `''`，`readline()` 返回空字符串 `''`，`readlines()` 返回空列表 `[]`，`for line in f:` 一次都不迭代。这意味着处理空文件不需要特殊逻辑，正常的读取流程会自动得到空结果。

```python
# 空文件的读取结果
with open("empty.txt", "w"):
    pass  # 创建空文件

with open("empty.txt", "r", encoding="utf-8") as f:
    print(f.read())       # 空字符串
    print(f.readlines())  # []
```

文件指针到达末尾后再调用 `read()` 或 `readline()` 也返回空字符串。如果需要重新读取文件，可以调用 `f.seek(0)` 把指针移回开头，这一操作在第 5 章详细讲解。

## 练习题

1. 假设 `tasks.txt` 文件内容如下，分别写出用 `read()`、`readline()`、`readlines()` 和 `for line in f` 四种方式读取后的返回值（用 `repr()` 表示）。

```
学习 Python
完成练习
```

::: details 参考答案
```python
# read()
# '学习 Python\n完成练习\n' （包含所有换行符的一个字符串）

# readline() 连续调用两次
# 第一次：'学习 Python\n'
# 第二次：'完成练习\n'

# readlines()
# ['学习 Python\n', '完成练习\n'] （每行一个元素的列表）

# for line in f
# 第一次迭代 line 为 '学习 Python\n'
# 第二次迭代 line 为 '完成练习\n'
```
四种方法返回的内容中都包含换行符 `\n`，使用时通常需要 `strip()` 去除。`read()` 返回整个字符串，`readline()` 每次返回一行，`readlines()` 返回行的列表，`for line in f` 是逐行迭代的内存友好方式。
:::

2. 写一个函数 `load_tasks(path)`，从指定路径加载任务列表。文件中每行一个任务，函数应返回去掉换行符后的任务列表。如果文件不存在，返回空列表。要求使用 UTF-8 编码，并确保文件被正确关闭。

::: details 参考答案
```python
def load_tasks(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f]
    except FileNotFoundError:
        return []

# 使用示例
tasks = load_tasks("tasks.txt")
print(tasks)
```
使用 `for line in f` 逐行读取并用列表推导式去除换行符，内存效率好。用 try-except 捕获文件不存在的异常，返回空列表，这样调用方无需额外判断。with 语句保证文件自动关闭。
:::

3. 现有一个 2GB 的日志文件 `access.log`，需要统计其中包含 `"ERROR"` 的行数。以下代码有什么问题？请改正。

```python
with open("access.log", "r") as f:
    lines = f.readlines()
    count = sum(1 for line in lines if "ERROR" in line)
print(count)
```

::: details 参考答案
问题在于 `f.readlines()` 会把整个 2GB 文件一次性读入内存，可能导致内存不足甚至程序崩溃。

改正方法是用 `for line in f` 逐行读取，每次只在内存中保留一行：

```python
with open("access.log", "r", encoding="utf-8", errors="replace") as f:
    count = sum(1 for line in f if "ERROR" in line)
print(count)
```
直接遍历文件对象是流式读取，内存占用恒定。同时建议显式指定 encoding，并用 `errors="replace"` 容忍日志中可能存在的编码问题，避免个别坏字符导致整个读取失败。
:::

4. 解释 `newline=''` 参数的作用，并说明在什么场景下需要使用它。

::: details 参考答案
`newline=''` 表示在读取时仍然识别各种换行符（`\r\n`、`\r`、`\n`）作为行分隔符，但不做转换，保留原始换行符。默认的 `newline=None` 会把所有换行符统一转换为 `\n`。

需要使用 `newline=''` 的场景包括：使用 `csv` 模块读写 CSV 文件时，因为 csv 模块自己处理换行符，如果 Python 也做转换会导致 `\r\n` 被重复处理出现空行；需要精确保留文件原始换行符的场合，比如比对文件内容或分析不同平台生成的文件。

读取普通文本文件时保持默认的 `newline=None` 即可，让 Python 统一换行符能简化后续处理。
:::

## 常见错误

**错误 1 · `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xc4 in position 0: invalid start byte`**

原因:用 UTF-8 编码读取一个 GBK 编码的文件，遇到 UTF-8 无法识别的字节序列时抛出异常。文件实际编码与 `encoding` 参数指定编码不一致是根本原因，常见于直接读取 Windows 记事本默认保存的中文文件。

解决:确认文件实际编码后指定正确的 `encoding` 参数。中文 Windows 旧文件多用 GBK，可用 `encoding='gbk'` 读取。不确定编码时用 `errors='replace'` 容错读取，再用 `chardet` 等库检测真实编码后重新读取。

**错误 2 · `MemoryError` 或程序卡死**

原因:用 `f.read()` 或 `f.readlines()` 一次性读取几个 GB 的大文件，整个文件内容被加载到内存，超出可用内存导致程序崩溃或长时间无响应。这是处理日志文件、数据文件时常见的陷阱。

解决:大文件改用 `for line in f:` 逐行读取，每次只在内存中保留一行，内存占用恒定。需要按字符块处理时用 `f.read(chunk_size)` 分块读取，循环处理直到返回空字符串。

**错误 3 · 程序把空行误判为文件结束**

原因:`readline()` 读到空行时返回 `'\n'`，读到文件末尾时返回空字符串 `''`。用 `if line == '\n'` 或 `if not line.strip()` 判断结束会把空行误认为文件末尾，导致后续内容被截断。

解决:判断文件末尾只应使用 `if not line:`（即 `line == ''`），不要用 strip 后的结果判断结束。空行处理后仍需继续读取，直到 `readline()` 返回真正的空字符串。
