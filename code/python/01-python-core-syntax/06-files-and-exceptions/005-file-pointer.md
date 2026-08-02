---
title: 6.5 文件指针移动与文件信息
sidebar:
  order: 5
---
# 6.5 文件指针移动与文件信息

文件对象内部维护一个**文件指针**，标记当前读写位置。每次调用 `read()` 或 `write()`，数据从指针位置开始处理，处理完后指针自动向后移动。大多数顺序读写场景下无需关心指针位置，但在需要随机访问文件特定位置，或者需要回退重读、跳过部分内容时，控制文件指针就变得必要。本节将讲解 `tell()` 查询指针位置、`seek()` 移动指针、`truncate()` 截断文件，以及判断文件能力的 `readable()`、`writable()`、`seekable()` 等方法。任务管理器如果要在固定格式文件中更新某条任务，就需要用指针操作定位到对应位置。

## 6.5.1 tell() 方法查询当前指针位置

`tell()` 方法返回文件指针当前位置，返回值是一个整数。文本模式下表示从文件开头算起的字符数偏移（在某些编码下可能与字节数不一致），二进制模式下表示字节偏移。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    print(f.tell())  # 0，刚打开时在开头
    data = f.read(5)
    print(f.tell())  # 5，读了 5 个字符后指针移动
```

`tell()` 返回的位置可以作为后续 `seek()` 的参数，用于记录某个位置以便稍后返回。这在需要先扫描文件找到特定位置、再回头处理数据的场景下很有用。

需要注意文本模式下 `tell()` 返回的数值不一定是字符数，它是一个不透明的整数，主要用于传回 `seek()` 恢复位置。在不同编码下，这个数值的语义可能不同，不应假设它与字符数或字节数的简单关系。

## 6.5.2 seek() 方法移动文件指针

`seek(offset, whence=0)` 方法把文件指针移动到指定位置。`offset` 是偏移量，`whence` 是参照点，取值为 0、1、2 之一。

### whence=0 从文件开头计算

`whence=0` 表示从文件开头计算偏移，`offset` 必须是非负整数。这是默认值，也是最常用的参照点。`seek(0)` 表示回到文件开头。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    content1 = f.read()
    f.seek(0)  # 回到开头
    content2 = f.read()
    print(content1 == content2)  # True，两次读取内容相同
```

### whence=1 从当前位置计算

`whence=1` 表示从当前指针位置计算偏移，`offset` 可以为正或负。正值向前移动，负值向后移动。**仅在二进制模式下可用**，文本模式下使用会抛出 `io.UnsupportedOperation` 或 `OSError`。

```python
with open("data.bin", "rb") as f:
    f.read(10)         # 读 10 字节，指针在 10
    f.seek(-5, 1)      # 从当前位置后退 5 字节，指针在 5
    data = f.read(5)   # 重新读取第 5 到第 9 字节
```

### whence=2 从文件末尾计算

`whence=2` 表示从文件末尾计算偏移，`offset` 通常为负数（正数表示超出末尾的位置）。同样**仅在二进制模式下可靠使用**。`seek(0, 2)` 把指针移到文件末尾，常用于获取文件大小或追加数据前定位。

```python
with open("data.bin", "rb") as f:
    f.seek(0, 2)       # 移到末尾
    size = f.tell()    # 文件大小（字节数）
    print(f"文件大小：{size} 字节")
```

## 6.5.3 文本模式下的 seek 限制

文本模式下 `seek()` 受到编码的限制。由于一个字符可能对应多个字节（如 UTF-8 下中文占 3 字节），在文本中间移动到任意字节位置可能导致指针落在字符中间，产生解码错误。因此文本模式只允许以下两种 seek 操作：

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    f.seek(0)      # 合法：回到开头
    f.seek(0, 2)   # 合法：移到末尾
    # f.seek(5, 1) # 非法：相对当前位置偏移
    # f.seek(3)    # 可能非法：非零绝对偏移，取决于编码
```

文本模式下 `seek()` 的非零绝对偏移只有两种来源是安全的：一是 `tell()` 返回的值，二是 0。换句话说，可以 `tell()` 记录位置后 `seek()` 回去，也可以 `seek(0)` 回到开头，其他偏移量在多字节编码下可能出错。

如果需要随机访问文件的任意位置，应当使用二进制模式。二进制模式下 `seek()` 可以自由移动到任意字节位置，没有上述限制。

```python
# 二进制模式下自由 seek
with open("data.bin", "rb") as f:
    f.seek(100)       # 移到第 100 字节
    f.seek(-50, 1)    # 后退 50 字节
    f.seek(-10, 2)    # 从末尾后退 10 字节
```

## 6.5.4 seek(0) 回到文件开头

`seek(0)` 是最常见的指针操作，把文件指针移回开头，通常用于读取完文件后需要重新读取的场景。在 `'r+'` 读写模式下，先写后读或先读后写时经常需要 `seek(0)` 重置指针。

```python
with open("tasks.txt", "r+", encoding="utf-8") as f:
    f.write("新内容\n")
    f.seek(0)  # 回到开头读取
    content = f.read()
    print(content)
```

::: warning r+ 模式下读写切换需要 seek
在 `'r+'` 模式下，写操作之后直接读可能读到旧内容或空数据，因为指针位置可能不对。读写切换时应当显式调用 `seek()` 定位指针，避免依赖隐式行为。
:::

## 6.5.5 truncate() 方法截断文件

`truncate(size=None)` 方法把文件截断为指定大小。不传参数时截断到当前指针位置，传入 `size` 时截断到 size 字节。如果 size 大于当前文件大小，文件会被扩展，扩展部分用空字节填充。

```python
with open("tasks.txt", "r+", encoding="utf-8") as f:
    f.read(10)      # 读取前 10 个字符
    f.truncate()    # 截断到指针位置，保留前 10 个字符
```

`truncate()` 需要文件以写入模式打开，只读模式下调用会抛出 `io.UnsupportedOperation`。这个方法常用于原地修改文件内容后截断多余部分，比如删除文件末尾的若干行。

```python
# 删除文件最后一行
with open("tasks.txt", "r+", encoding="utf-8") as f:
    lines = f.readlines()
    f.seek(0)
    f.truncate()  # 清空文件
    for line in lines[:-1]:
        f.write(line)
```

## 6.5.6 fileno() 方法获取文件描述符

`fileno()` 方法返回文件对象对应的整数文件描述符。文件描述符是操作系统层面的资源标识，传递给底层系统调用使用。日常 Python 编程很少直接用到文件描述符，但在调用 `os.fsync()` 强制刷盘、`select` 多路复用等场景下需要。

```python
import os

with open("tasks.txt", "w", encoding="utf-8") as f:
    f.write("重要数据")
    f.flush()
    os.fsync(f.fileno())  # 强制写入物理磁盘
```

`os.fsync(fd)` 接受文件描述符，确保数据真正写入物理磁盘，而不仅仅是操作系统的缓冲区。这一操作性能开销大，只在数据完整性要求极高的场景使用，如数据库事务日志。

## 6.5.7 readable() writable() seekable() 判断文件能力

文件对象提供三个方法查询自身能力。`readable()` 返回是否可读，`writable()` 返回是否可写，`seekable()` 返回是否可定位。这些方法根据打开模式返回布尔值，便于在通用代码中做条件判断。

```python
with open("tasks.txt", "w", encoding="utf-8") as f:
    print(f.readable())  # False，写模式不可读
    print(f.writable())  # True
    print(f.seekable())  # True

with open("tasks.txt", "r", encoding="utf-8") as f:
    print(f.readable())  # True
    print(f.writable())  # False
    print(f.seekable())  # True
```

某些特殊文件如管道、套接字、标准输入输出，可能不可定位，`seekable()` 返回 `False`，此时调用 `seek()` 会抛出异常。在编写处理多种文件类型的通用函数时，先检查 `seekable()` 可以避免出错。

## 6.5.8 综合示例：随机访问固定长度记录

假设任务管理器用二进制文件存储任务，每条任务固定占 32 字节（前 4 字节存优先级整数，后 28 字节存任务名）。这种固定长度记录的格式可以用 `seek()` 直接定位到任意一条记录。

```python
import struct

RECORD_SIZE = 32  # 每条记录 32 字节

def write_task(path, index, priority, name):
    """在指定位置写入一条任务记录"""
    with open(path, "rb+") as f:
        f.seek(index * RECORD_SIZE)
        # 名名截断到 28 字节并填充
        name_bytes = name.encode("utf-8")[:24].ljust(24, b"\x00")
        f.write(struct.pack("I", priority))
        f.write(name_bytes)

def read_task(path, index):
    """读取指定位置的任务记录"""
    with open(path, "rb") as f:
        f.seek(index * RECORD_SIZE)
        data = f.read(RECORD_SIZE)
        if len(data) < RECORD_SIZE:
            return None
        priority = struct.unpack("I", data[:4])[0]
        name = data[4:].rstrip(b"\x00").decode("utf-8")
        return priority, name

# 使用示例
# 先创建文件
with open("tasks.db", "wb") as f:
    f.write(b"\x00" * (RECORD_SIZE * 10))  # 预留 10 条记录空间

write_task("tasks.db", 0, 1, "学习文件指针")
write_task("tasks.db", 2, 3, "完成练习")

print(read_task("tasks.db", 0))  # (1, '学习文件指针')
print(read_task("tasks.db", 1))  # None，未写入
print(read_task("tasks.db", 2))  # (3, '完成练习')
```

这个示例展示了二进制模式下 `seek()` 的核心价值：通过计算偏移量直接定位到任意记录，无需遍历整个文件。固定长度记录的随机访问是数据库、索引文件等底层存储的基础模式。

## 练习题

1. 以下代码试图读取文件两次，但第二次读到的是空内容。解释原因并改正。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    first = f.read()
    second = f.read()
    print(len(first), len(second))
```

::: details 参考答案
第一次 `read()` 把文件全部读完后，文件指针移动到了末尾。第二次 `read()` 从末尾开始读，没有内容可读，返回空字符串。

改正方法是在两次读取之间调用 `seek(0)` 把指针移回开头：

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    first = f.read()
    f.seek(0)
    second = f.read()
    print(len(first), len(second))
```
这样两次读取的内容相同。如果只是需要两份相同的数据，更简单的做法是 `second = first`，避免重复 IO。
:::

2. 写一个函数 `get_file_size(path)`，用二进制模式打开文件，通过 `seek()` 和 `tell()` 返回文件的字节大小。不要使用 `os.path.getsize()`。

::: details 参考答案
```python
def get_file_size(path):
    with open(path, "rb") as f:
        f.seek(0, 2)  # 移到文件末尾
        return f.tell()

# 使用示例
size = get_file_size("tasks.txt")
print(f"文件大小：{size} 字节")
```
用 `seek(0, 2)` 把指针移到文件末尾，此时 `tell()` 返回的就是文件末尾位置，即文件总字节数。二进制模式下 `tell()` 返回的是字节偏移，与文件大小一致。注意要在二进制模式下操作，文本模式下的 `tell()` 返回值可能与字节数不一致。
:::

3. 解释文本模式下 `seek()` 的限制，以及为什么二进制模式没有这种限制。如果需要在一个中文文本文件中随机跳转到第 100 个字符位置，应该怎么做？

::: details 参考答案
文本模式下文件内容按字符处理，但磁盘上按字节存储。UTF-8 编码下一个中文字符占 3 字节，ASCII 字符占 1 字节，字符与字节之间没有固定的对应关系。如果 `seek()` 跳到某个字节位置恰好落在字符中间，后续读取会因解码错误而失败。因此文本模式只允许 `seek(0)` 回到开头、`seek(0, 2)` 到末尾、或用 `tell()` 返回值恢复位置。

二进制模式按字节处理，`seek()` 跳到任意字节位置都是合法的，没有字符边界问题。

要在中文文本文件中跳到第 100 个字符，可以二进制模式打开并逐字符解码：

```python
with open("tasks.txt", "rb") as f:
    data = f.read()
    text = data.decode("utf-8")
    # 取第 100 个字符之后的 10 个字符
    chars = text[100:110]
    print(chars)
```
文本文件的随机字符访问通常需要先整体读入内存再切片，因为字符与字节的对应关系需要解码后才能确定。如果需要频繁随机访问，考虑用二进制固定长度格式存储。
:::

4. `truncate()` 方法在以下代码中起什么作用？如果删除 `f.truncate()` 这一行，结果会怎样？

```python
lines = ["第一行\n", "第二行\n", "第三行\n"]
with open("tasks.txt", "w", encoding="utf-8") as f:
    f.writelines(lines)

with open("tasks.txt", "r+", encoding="utf-8") as f:
    f.seek(0)
    f.write("新行\n")
    f.truncate()
```

::: details 参考答案
这段代码先用三行内容创建文件，然后在 `'r+'` 模式下打开，在开头写入一行 `"新行\n"`，再调用 `truncate()` 把文件截断到当前指针位置（即写入 `"新行\n"` 之后的位置，5 个字符）。

`truncate()` 的作用是删除截断点之后的旧内容。最终文件内容只有 `"新行\n"`，原来的 `"二行\n"`、`"第三行\n"` 等旧内容被删除。

如果删除 `f.truncate()` 这一行，写入 `"新行\n"` 只覆盖了原文件开头 5 个字符，后面的旧内容仍然保留。文件内容会变成 `"新行\n二行\n第三行\n"`，即新旧内容混杂，这通常不是期望的结果。`truncate()` 在原地修改文件、删除多余内容时很关键。
:::

## 常见错误

**错误 1 · `io.UnsupportedOperation: can't do nonzero cur-relative seeks`**

原因:文本模式下使用 `seek(offset, 1)` 或 `seek(offset, 2)` 进行非零的相对或末尾偏移。文本模式下由于字符与字节的对应关系不确定，Python 只允许 `seek(0)`、`seek(0, 2)` 或用 `tell()` 返回值恢复位置，其他相对偏移被禁止。

解决:需要任意位置定位时改用二进制模式（`'rb'`、`'rb+'`）。二进制模式下 `seek()` 的三种 whence 参数都可用，可以自由移动到任意字节位置。

**错误 2 · `UnicodeDecodeError` 或读到乱码**

原因:文本模式下用 `tell()` 记录的位置在写入或编码变化后不再有效，或文本模式下 `seek()` 跳到了多字节字符的中间字节位置，导致后续读取解码失败。UTF-8 编码下一个中文字符占 3 字节，跳到字符中间会破坏解码。

解决:文本模式下只用 `seek(0)` 回到开头、`seek(0, 2)` 到末尾，或用 `tell()` 返回值精确恢复之前记录的位置。需要随机访问中文字符位置时，改用二进制模式读取后整体解码，或用固定长度记录格式存储。

**错误 3 · `io.UnsupportedOperation: File not open for writing`**

原因:在只读模式（`'r'`）下调用 `truncate()` 方法。`truncate()` 需要文件以写入能力打开，只读文件对象不支持截断操作。

解决:截断文件时使用 `'r+'`、`'w'`、`'w+'` 等带写入能力的模式打开。原地修改文件内容常用 `'r+'` 模式，先读取再截断再写入。
