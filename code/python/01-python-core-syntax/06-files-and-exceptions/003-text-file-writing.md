---
title: 6.3 文本文件写入与追加
sidebar:
  order: 3
---
# 6.3 文本文件写入与追加

读取解决了数据进入程序的问题，写入则解决数据持久化的问题。程序处理完数据后，需要把结果保存到文件，下次运行时才能恢复状态。文本文件的写入涉及写入方法、模式选择、换行符处理和缓冲区管理等细节。选对模式可以避免覆盖重要数据，处理好换行符可以保证文件格式正确，理解缓冲区可以确保数据真正写入磁盘。本节将讲解 `write()`、`writelines()` 方法和 `print()` 的 file 参数，以及覆盖、追加、独占创建三种写入模式的区别，并以保存任务列表到文件为贯穿示例。

## 6.3.1 write() 方法写入字符串

`write(text)` 方法把字符串写入文件，返回写入的字符数（文本模式下）或字节数（二进制模式下）。`write()` **不会自动添加换行符**，需要换行时必须手动在字符串末尾加上 `\n`。这是初学者容易忽略的细节，忘记加换行符会导致所有内容连成一行。

```python
with open("tasks.txt", "w", encoding="utf-8") as f:
    n1 = f.write("学习 Python 基础\n")
    n2 = f.write("完成练习题\n")
    print(n1)  # 11（字符数，含换行符）
```

`write()` 接受的参数必须是字符串，传入其他类型会抛出 `TypeError`。需要写入数字、列表等数据时，先转换成字符串：

```python
tasks = ["学习基础", "做练习", "提交作业"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    for index, task in enumerate(tasks, 1):
        f.write(f"{index}. {task}\n")
```

文件内容为：

```
1. 学习基础
2. 做练习
3. 提交作业
```

## 6.3.2 writelines() 方法写入字符串列表

`writelines(lines)` 方法接受一个字符串可迭代对象，把每个字符串依次写入文件。需要注意的是，`writelines()` **不会在元素之间添加换行符**，名字虽然叫 lines，但行为只是连续写入，需要换行时要在每个字符串中自己包含 `\n`。

```python
tasks = ["学习基础\n", "做练习\n", "提交作业\n"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.writelines(tasks)
```

`writelines()` 适合已经准备好一个字符串列表、需要批量写入的场景。它比在循环中多次调用 `write()` 略快，因为减少了函数调用次数。如果原始数据没有换行符，可以用列表推导式补上：

```python
tasks = ["学习基础", "做练习", "提交作业"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.writelines(task + "\n" for task in tasks)
```

::: warning writelines 不加换行符
`writelines()` 的名字容易让人误以为它会自动按行写入。实际上它只是把多个字符串拼接后写入，换行符必须由调用方提供。如果传入 `["a", "b", "c"]`，写入的结果是 `"abc"` 而非三行。
:::

## 6.3.3 print() 函数的 file 参数

`print()` 函数除了输出到控制台，还可以通过 `file` 参数把内容输出到文件。`print()` 会在末尾自动加上换行符（由 `end` 参数控制，默认是 `\n`），还能用 `sep` 参数指定多个参数之间的分隔符，使用起来比 `write()` 更方便。

```python
with open("tasks.txt", "w", encoding="utf-8") as f:
    print("学习 Python 基础", file=f)
    print("完成练习题", file=f)
```

文件内容与使用 `write()` 加 `\n` 的效果相同。`print()` 的优势在于自动换行和灵活的分隔符：

```python
tasks = ["学习基础", "做练习", "提交作业"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    for index, task in enumerate(tasks, 1):
        print(index, task, sep=". ", file=f)
```

`file` 参数接受任何具有 `write()` 方法的对象，这种**鸭子类型**特性让 `print()` 可以输出到字符串缓冲区、网络流等自定义目标。`file` 参数的默认值是 `sys.stdout`，即标准输出，所以平时 `print()` 直接显示在控制台。

## 6.3.4 覆盖模式 'w'

`'w'` 模式打开文件时，如果文件已存在，**内容会被立即清空**，即使不写入任何数据，原文件也会变成空文件。文件不存在时创建新文件。这种模式适合完全替换文件内容的场景。

```python
# 覆盖模式：原文件内容被清空
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("新的任务列表\n")
```

任务管理器每次保存完整任务列表时，通常使用 `'w'` 模式，把内存中最新的任务列表整体写入文件，覆盖旧的版本。这种全量保存的方式简单可靠，不用担心数据不一致的问题。

需要特别注意的是，`'w'` 模式在 `open()` 调用时就清空文件，而不是在第一次 `write()` 时。如果 open 之后程序崩溃，文件已经被清空了。因此对重要数据，可以先写入临时文件，确认无误后再重命名替换原文件。

## 6.3.5 追加模式 'a'

`'a'` 模式打开文件时，文件存在则在末尾追加内容，文件不存在时创建新文件。追加模式不会清空原内容，文件指针位于文件末尾。这种模式适合日志记录、增量保存等需要保留历史数据的场景。

```python
# 追加模式：在文件末尾添加内容
with open("task_log.txt", "a", encoding="utf-8") as f:
    f.write("2026-08-01 新增任务：复习文件操作\n")
```

追加模式下即使调用 `seek()` 移动文件指针，后续写入仍然会追加到文件末尾，这是操作系统层面的保证。任务管理器记录操作日志时，使用追加模式可以保证每次记录都接在最后，不会覆盖历史日志。

## 6.3.6 独占创建模式 'x'

`'x'` 模式仅在文件不存在时才能创建并打开，文件已存在时抛出 `FileExistsError`。这种模式用于防止意外覆盖已有文件，适合创建新配置文件、初始化数据文件等场景。

```python
import datetime

try:
    with open("tasks.txt", "x", encoding="utf-8") as f:
        f.write(f"# 任务列表 创建于 {datetime.date.today()}\n")
        f.write("初始化任务\n")
    print("任务文件创建成功")
except FileExistsError:
    print("任务文件已存在，未覆盖")
```

任务管理器首次运行时，可以用 `'x'` 模式创建初始任务文件，避免覆盖用户已有的数据。如果文件已存在，提示用户并跳过创建，让用户自行决定如何处理。

## 6.3.7 写入时的换行符处理

文本模式下写入时，Python 默认把字符串中的 `\n` 转换为操作系统的换行符。Windows 上 `\n` 变成 `\r\n`，Linux 和 macOS 上保持 `\n`。这种转换由 `newline` 参数控制。

默认行为（`newline=None`）适合生成符合当前平台习惯的文件。如果希望生成跨平台一致的文件，或者写入特定格式的文件，可以设置 `newline=''` 来禁用转换，`\n` 原样写入：

```python
# 禁用换行符转换，\n 原样写入
with open("tasks.txt", "w", encoding="utf-8", newline="") as f:
    f.write("第一行\n第二行\n")
# Windows 上文件中也是 \n 而非 \r\n
```

写入字符串中如果包含 `\r\n`，在默认模式下会被转换为系统换行符，可能导致 `\r\n` 变成 `\r\r\n`。处理来自其他系统的文本时要注意这一点，必要时设置 `newline=''`。

## 6.3.8 编码参数

写入文本文件时同样需要指定 `encoding` 参数，决定字符串编码为字节时使用的方案。不指定时使用系统默认编码，跨平台可能出现问题。

```python
tasks = ["学习 Python", "完成练习"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    for task in tasks:
        f.write(task + "\n")
```

写入时指定的编码应当与读取时一致，否则会出现乱码。统一使用 UTF-8 是最安全的做法，它能表示所有 Unicode 字符，也是互联网上最通用的编码。

写入时遇到无法编码的字符，默认抛出 `UnicodeEncodeError`。可以通过 `errors` 参数控制处理方式，取值与读取时相同（`'strict'`、`'ignore'`、`'replace'` 等）：

```python
# 用替换字符代替无法编码的字符
with open("tasks.txt", "w", encoding="ascii", errors="replace") as f:
    f.write("hello 世界")  # 写入 "hello ??"
```

## 6.3.9 缓冲区与 flush() 方法

为了提高性能，Python 的文件写入是**缓冲**的。`write()` 调用后，数据先进入内存缓冲区，等缓冲区满了或文件关闭时才真正写入磁盘。这种机制减少了磁盘 IO 次数，但意味着 `write()` 返回后数据可能还在内存中。

`flush()` 方法强制把缓冲区中的数据写入磁盘，但不关闭文件。在需要确保数据已落盘的场景下使用，比如日志系统在每条记录写入后立即 flush，防止程序崩溃丢失日志。

```python
import time

with open("task_log.txt", "a", encoding="utf-8") as f:
    while True:
        log = get_log_entry()  # 假设的日志获取函数
        if log is None:
            break
        f.write(log + "\n")
        f.flush()  # 立即写入磁盘
        time.sleep(1)
```

`with` 语句在退出时调用 `close()`，close 内部会先 flush 再关闭，所以正常使用 with 时无需手动 flush。只有在长时间保持文件打开、需要中途保证数据落盘时，才需要调用 `flush()`。

操作系统的延迟写入机制会进一步在内核层面缓存数据，`flush()` 只保证数据交给了操作系统，真正写到物理磁盘可能还有延迟。需要绝对保证数据落盘时，可以调用 `os.fsync(f.fileno())`，但这一操作性能开销大，日常使用很少需要。

## 6.3.10 完整示例：保存任务列表到文件

结合前面的知识，实现一个完整的任务列表保存函数。任务以列表形式存储在内存中，保存时逐行写入文件，每行一个任务，使用 UTF-8 编码，用 with 语句保证文件关闭。

```python
def save_tasks(path, tasks):
    """把任务列表保存到文件，每行一个任务"""
    with open(path, "w", encoding="utf-8") as f:
        for task in tasks:
            f.write(task + "\n")

def append_task(path, task):
    """向任务文件追加单个任务"""
    with open(path, "a", encoding="utf-8") as f:
        f.write(task + "\n")

# 使用示例
tasks = ["学习文件写入", "完成练习题", "提交作业"]
save_tasks("tasks.txt", tasks)

# 后来新增一个任务
append_task("tasks.txt", "复习本节内容")
```

`save_tasks` 使用 `'w'` 模式全量保存，适合定期持久化整个任务列表。`append_task` 使用 `'a'` 模式增量追加，适合频繁的单条任务添加。两种方式各有适用场景，实际项目中可以根据数据量和写入频率选择。

如果任务带有结构化字段（如优先级、截止日期），可以用特定格式保存，比如用逗号或制表符分隔字段：

```python
def save_structured_tasks(path, tasks):
    """保存结构化任务，格式：优先级,任务名"""
    with open(path, "w", encoding="utf-8") as f:
        for priority, name in tasks:
            f.write(f"{priority},{name}\n")

tasks = [
    (1, "完成项目报告"),
    (2, "回复邮件"),
    (3, "整理桌面"),
]
save_structured_tasks("tasks.csv", tasks)
```

这种简单的格式后续可以用字符串分割解析。更复杂的数据结构建议使用 `json` 或 `csv` 模块，相关内容在后续模块化章节展开。

## 练习题

1. 以下代码执行后，`output.txt` 的内容是什么？解释原因。

```python
with open("output.txt", "w") as f:
    f.write("第一行")
    f.write("第二行")
```

::: details 参考答案
文件内容是 `第一行第二行`，两行内容连在一起，没有换行。

原因是 `write()` 方法不会自动添加换行符，需要换行时必须手动在字符串末尾加上 `\n`。正确的写法是：

```python
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")
```
或者使用 `print(file=f)`，它自动在末尾加换行符。
:::

2. 写一个函数 `append_log(path, message)`，向日志文件追加一条记录。每条记录格式为 `[时间] 消息`，时间使用 `datetime.datetime.now()` 获取。要求每条记录单独一行，并在写入后立即刷新缓冲区。

::: details 参考答案
```python
import datetime

def append_log(path, message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
        f.flush()

# 使用示例
append_log("task_manager.log", "程序启动")
append_log("task_manager.log", "加载任务列表")
```
使用 `'a'` 追加模式保留历史日志。`flush()` 在每条记录写入后立即把缓冲区数据刷到磁盘，防止程序崩溃丢失日志。时间格式化为可读字符串，便于事后查看。
:::

3. 解释 `'w'`、`'a'`、`'x'` 三种写入模式分别适合什么场景。如果任务管理器要实现"导出当前任务列表到新文件，文件名由用户指定，已存在则不覆盖"的功能，应该用哪种模式？

::: details 参考答案
`'w'` 适合全量覆盖保存，每次写入完整数据，覆盖旧文件；`'a'` 适合增量追加，保留原内容在末尾添加新数据；`'x'` 适合创建新文件且确保不覆盖已有文件，文件存在时报错。

导出功能应使用 `'x'` 模式。用户指定文件名后，用 `'x'` 模式打开，如果文件已存在会抛出 `FileExistsError`，捕获后提示用户文件已存在、请更换文件名。这样能确保不会意外覆盖用户已有的文件，符合"已存在则不覆盖"的要求。

```python
def export_tasks(path, tasks):
    try:
        with open(path, "x", encoding="utf-8") as f:
            for task in tasks:
                f.write(task + "\n")
        print(f"已导出到 {path}")
    except FileExistsError:
        print(f"文件 {path} 已存在，请更换文件名")
```
:::

4. 以下代码在 Windows 上运行后，用十六进制工具查看文件，会发现每行末尾是什么字节序列？如果希望文件中只有 `\n` 而没有 `\r`，应该如何修改？

```python
with open("data.txt", "w") as f:
    f.write("hello\nworld\n")
```

::: details 参考答案
在 Windows 上，默认 `newline=None` 会把 `\n` 转换为 `\r\n`，所以每行末尾的字节序列是 `0x0D 0x0A`（即 `\r\n`）。

希望文件中只有 `\n`，可以设置 `newline=''` 禁用换行符转换：

```python
with open("data.txt", "w", encoding="utf-8", newline="") as f:
    f.write("hello\nworld\n")
```
此时 `\n` 原样写入，十六进制查看每行末尾只有 `0x0A`（即 `\n`）。这在需要生成跨平台一致文件格式，或者给其他对换行符敏感的程序读取时很有用。
:::

## 常见错误

**错误 1 · `TypeError: write() argument must be str, not int`**

原因:`write()` 方法只接受字符串参数，直接传入数字、列表等类型会抛出异常。这是写入文件时最常见的类型错误，常发生在把数据直接写入文件而忘记转换时。

解决:写入前用 `str()` 或 f-string 把数据转换为字符串。写入列表等多条数据时，用循环遍历并逐个转换。

**错误 2 · `UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-1: ordinal not in range(128)`**

原因:用 ASCII 编码写入包含中文等非 ASCII 字符的字符串，ASCII 只能表示 0-127 的字符，超出范围就会报错。常见于服务器环境默认编码为 ASCII 时写入中文内容。

解决:写入文本文件时显式指定 `encoding='utf-8'`，UTF-8 能表示所有 Unicode 字符。必须用 ASCII 编码时设置 `errors='replace'` 用占位符代替无法编码的字符，但会丢失数据。

**错误 3 · `FileExistsError: [Errno 17] File exists: 'tasks.txt'`**

原因:以 `'x'` 独占创建模式打开一个已存在的文件，Python 拒绝覆盖从而抛出异常。这是 `'x'` 模式的保护机制，用于防止意外覆盖已有文件。

解决:用 try-except 捕获 `FileExistsError`，提示用户文件已存在。需要覆盖时改用 `'w'` 模式，需要追加时改用 `'a'` 模式。
