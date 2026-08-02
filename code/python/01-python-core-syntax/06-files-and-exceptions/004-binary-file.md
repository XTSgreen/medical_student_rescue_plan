---
title: 6.4 二进制文件操作
sidebar:
  order: 4
---
# 6.4 二进制文件操作

文本文件处理的是人类可读的字符，二进制文件处理的是计算机底层的字节。图片、音频、视频、压缩包、可执行文件，以及各种自定义格式的数据文件，都以二进制形式存储。二进制模式下读写的内容是 `bytes` 对象，不经过编码解码，按原始字节序列处理，因此既能保证数据完整性，又能避免编码问题。本节将讲解二进制模式下的读写操作、`bytes` 和 `bytearray` 类型的基础知识，以及二进制模式与文本模式的区别。任务管理器如果需要保存带图标的任务数据或备份整个任务库，就需要用到二进制文件操作。

## 6.4.1 二进制模式的打开方式

二进制模式通过在模式字符串中加上 `'b'` 字符来指定，与读写模式组合形成 `'rb'`、`'wb'`、`'ab'`、`'xb'` 等模式。二进制模式下的行为与对应的文本模式类似，但有几处关键区别：读写的内容是 `bytes` 而非字符串，不涉及编码解码，`newline` 参数无效，换行符不做转换。

```python
# 二进制只读
with open("data.bin", "rb") as f:
    data = f.read()
    print(type(data))  # <class 'bytes'>

# 二进制只写
with open("data.bin", "wb") as f:
    f.write(b"hello")
```

二进制模式下 `open()` 不能传 `encoding` 和 `errors` 参数，传了会抛出 `ValueError`。因为二进制模式不进行编码解码，这些参数没有意义。

## 6.4.2 bytes 类型基础

`bytes` 是不可变的字节序列，类似于字符串之于字符，`bytes` 之于字节。字面量用 `b` 前缀加字符串表示，其中每个字符的 ASCII 码成为一个字节：

```python
data = b"hello"
print(data)         # b'hello'
print(type(data))   # <class 'bytes'>
print(len(data))    # 5，字节数
```

`bytes` 中的每个元素是 0 到 255 的整数，可以用索引和切片访问：

```python
data = b"hello"
print(data[0])      # 104，字母 h 的 ASCII 码
print(data[1:3])    # b'el'，切片返回 bytes
```

包含非 ASCII 字节时，可以用十六进制转义或 `bytes()` 构造：

```python
# 十六进制转义
data = b"\x41\x42\x43"  # 等价于 b"ABC"
print(data)  # b'ABC'

# 从整数列表构造
data = bytes([72, 101, 108, 108, 111])
print(data)  # b'Hello'

# 从字符串编码构造
text = "你好"
data = text.encode("utf-8")
print(data)  # b'\xe4\xbd\xa0\xe5\xa5\xbd'
print(len(data))  # 6，UTF-8 下两个汉字占 6 个字节
```

`bytes` 与字符串之间通过 `encode()` 和 `decode()` 方法相互转换，这两个方法在第 4 章字符串类型中已经介绍过。二进制文件读写时，如果数据本身是文本，就需要手动进行编码解码。

## 6.4.3 bytearray 类型基础

`bytearray` 是可变的字节序列，类似列表之于元组的关系。`bytes` 不可变，创建后不能修改；`bytearray` 可变，可以原地修改、追加、删除字节。需要动态构建二进制数据时，`bytearray` 比 `bytes` 更方便。

```python
ba = bytearray(b"hello")
print(type(ba))  # <class 'bytearray'>

# 可变操作
ba[0] = 72  # 修改第一个字节
ba.append(33)  # 追加字节
print(ba)  # bytearray(b'Hello!')
```

`bytearray` 可以传给 `write()` 方法，效果与 `bytes` 相同。在需要逐步拼接二进制数据的场景下，先用 `bytearray` 累积数据，最后一次写入，比多次 `write` 调用更高效。

## 6.4.4 二进制模式下的 read() 方法

二进制模式下 `read(size)` 返回 `bytes` 对象，`size` 参数指定读取的**字节数**（注意与文本模式下的字符数区分）。不传 size 或传 `-1` 时读取全部内容。

```python
with open("data.bin", "rb") as f:
    chunk = f.read(4)  # 读取前 4 个字节
    print(chunk)
    print(len(chunk))  # 4（如果文件足够长）
```

读取到文件末尾时，`read()` 返回空的 `bytes` 对象 `b''`，这是与文本模式下空字符串 `''` 的区别。判断二进制文件是否读完，检查返回值是否等于 `b''` 即可。

二进制模式也支持 `readline()` 和 `readlines()`，它们以 `\n` 字节为分隔符返回行。返回的元素是 `bytes` 而非字符串。`readline()` 返回的行包含末尾的 `\n` 字节。

```python
with open("data.bin", "rb") as f:
    for line in f:
        print(line)  # 每行是 bytes 对象
```

## 6.4.5 二进制模式下的 write() 方法

二进制模式下 `write()` 接受 `bytes` 或 `bytearray` 对象，返回写入的字节数。传入字符串会抛出 `TypeError`，必须先编码为 `bytes`。

```python
# 正确：写入 bytes
with open("data.bin", "wb") as f:
    n = f.write(b"hello")
    print(n)  # 5

# 错误：写入字符串
# with open("data.bin", "wb") as f:
#     f.write("hello")  # TypeError
```

如果要在二进制文件中保存文本内容，需要手动编码：

```python
text = "学习 Python"
with open("data.bin", "wb") as f:
    f.write(text.encode("utf-8"))
```

读取时再手动解码：

```python
with open("data.bin", "rb") as f:
    data = f.read()
    text = data.decode("utf-8")
    print(text)  # 学习 Python
```

这种手动编解码的方式与文本模式下的自动编解码效果相同，区别在于二进制模式让你对编码过程有完全的控制。需要混合存储文本和二进制数据时，二进制模式配合手动编解码是常用方案。

## 6.4.6 二进制追加与读写模式

`'ab'` 模式以二进制方式追加写入，文件存在时在末尾追加 `bytes` 数据，文件不存在时创建新文件。`'rb+'`、`'wb+'`、`'ab+'` 等组合模式在二进制基础上增加读写能力。

```python
# 追加二进制数据
with open("log.bin", "ab") as f:
    f.write(b"\x00\x01\x02")

# 二进制读写
with open("data.bin", "rb+") as f:
    data = f.read(4)
    f.seek(0)
    f.write(b"NEW!")
```

二进制模式下 `seek()` 可以自由移动到任意位置，没有文本模式的限制。这使得二进制文件适合实现随机访问，比如在固定大小的记录文件中直接定位到某条记录。这一主题在第 5 章文件指针部分详细讲解。

## 6.4.7 二进制文件的分块读写

处理大二进制文件时，分块读写是标准做法。每次读取固定大小的块，处理完再读下一块，避免一次性占用过多内存。

```python
def copy_file(src, dst, chunk_size=4096):
    """分块复制二进制文件"""
    with open(src, "rb") as fin, open(dst, "wb") as fout:
        while True:
            chunk = fin.read(chunk_size)
            if not chunk:
                break
            fout.write(chunk)

# 使用示例
copy_file("source.bin", "backup.bin")
```

这种分块复制的方式无论文件多大，内存占用都恒定在 `chunk_size` 大小。`chunk_size` 通常选 4096 或 8192，与操作系统的页大小对齐，IO 效率较好。

任务管理器如果要实现数据备份功能，可以用这种方式复制任务数据文件。虽然 `shutil.copy()` 函数已经封装了这一过程，但理解分块读写的原理对处理自定义二进制格式很有帮助。

## 6.4.8 结构化二进制数据简介

二进制文件常用于存储结构紧凑的结构化数据。Python 标准库的 `struct` 模块可以把 Python 值打包为 `bytes`，或从 `bytes` 解包为 Python 值。虽然完整的 `struct` 用法在后续章节展开，这里先看一个简单示例，理解二进制数据的基本处理思路。

```python
import struct

# 打包：把一个整数和一个浮点数转为 bytes
packed = struct.pack("if", 42, 3.14)
print(packed)       # b'*\x00\x00\x00\xc3\xf5H@'
print(len(packed))  # 8，整数 4 字节 + 浮点数 4 字节

# 解包：把 bytes 转回 Python 值
number, value = struct.unpack("if", packed)
print(number)  # 42
print(value)   # 3.14
```

格式字符串 `"if"` 表示一个整数（i）加一个浮点数（f），每种格式对应固定的字节数。这种方式适合存储需要紧凑表示的数值数据，任务管理器如果要保存大量带优先级和截止时间的任务，用二进制格式比文本格式更省空间。

::: note 文本模式还是二进制模式
处理 `.txt`、`.csv`、`.json` 等文本格式时用文本模式，让 Python 处理编码和换行符；处理图片、音频、自定义二进制格式时用二进制模式，保证数据原样读写。不确定时优先用二进制模式读取前几个字节，根据内容判断文件类型。
:::

## 练习题

1. 以下代码会抛出什么异常？为什么？请改正。

```python
with open("data.bin", "wb") as f:
    f.write("hello")
```

::: details 参考答案
会抛出 `TypeError`，因为二进制模式下 `write()` 只接受 `bytes` 或 `bytearray`，传入字符串会报错。

改正方法有两种。一是给字符串加上 `b` 前缀（仅限 ASCII 字符）：

```python
with open("data.bin", "wb") as f:
    f.write(b"hello")
```

二是用 `encode()` 把字符串编码为 bytes：

```python
with open("data.bin", "wb") as f:
    f.write("hello".encode("utf-8"))
```

如果字符串包含非 ASCII 字符（如中文），只能用第二种方式指定编码。
:::

2. 写一个函数 `read_uint32(path)`，用二进制模式读取文件前 4 个字节，并用 `struct.unpack` 把这 4 个字节解释为一个无符号 32 位整数（格式字符 `'I'`）。如果文件不足 4 字节，返回 `None`。

::: details 参考答案
```python
import struct

def read_uint32(path):
    with open(path, "rb") as f:
        data = f.read(4)
        if len(data) < 4:
            return None
        return struct.unpack("I", data)[0]

# 使用示例
value = read_uint32("data.bin")
print(value)
```
用 `'rb'` 模式读取前 4 个字节，检查长度是否足够，再用 `struct.unpack("I", data)` 解包。`unpack` 返回元组，取第一个元素就是整数值。格式字符 `'I'` 表示无符号 32 位整数，占 4 个字节。
:::

3. 解释为什么二进制模式下不能传 `encoding` 参数。如果要在二进制文件中存储中文文本，应该怎么处理？

::: details 参考答案
二进制模式按原始字节读写，不进行编码解码，`encoding` 参数对它没有意义，传了会抛出 `ValueError`。编码参数只在文本模式下有效，因为文本模式需要把字符串与字节之间相互转换。

在二进制文件中存储中文文本，需要手动编码后写入：

```python
text = "学习 Python"
with open("data.bin", "wb") as f:
    f.write(text.encode("utf-8"))
```

读取时手动解码：

```python
with open("data.bin", "rb") as f:
    data = f.read()
    text = data.decode("utf-8")
```

手动编解码与文本模式的自动编解码效果相同，但二进制模式让你能精确控制何时编码、用何种编码，适合需要在同一文件中混合存储文本和二进制数据的场景。
:::

4. 写一个分块复制函数 `copy_file(src, dst, chunk_size=8192)`，用二进制模式把源文件内容复制到目标文件。要求无论文件多大，内存占用都保持恒定。

::: details 参考答案
```python
def copy_file(src, dst, chunk_size=8192):
    with open(src, "rb") as fin, open(dst, "wb") as fout:
        while True:
            chunk = fin.read(chunk_size)
            if not chunk:
                break
            fout.write(chunk)

# 使用示例
copy_file("tasks_backup.bin", "tasks_copy.bin")
```
用 `with` 同时管理两个文件，一个读一个写。每次读取 `chunk_size` 字节，读完就写入目标文件，循环直到源文件结束。`chunk` 为空 `bytes`（`b''`）表示读完。这种分块方式内存占用恒定在 `chunk_size`，适合复制大文件。
:::

## 常见错误

**错误 1 · `TypeError: a bytes-like object is required, not 'str'`**

原因:二进制模式下 `write()` 只接受 `bytes` 或 `bytearray` 对象，直接传入字符串会抛出异常。这是二进制写入最常见的错误，常发生在习惯文本模式写法的代码迁移到二进制模式时。

解决:写入前用 `b"..."` 前缀构造 ASCII 字节串，或用 `"字符串".encode("utf-8")` 把字符串编码为 bytes。包含非 ASCII 字符时必须用 `encode()` 方法并指定编码。

**错误 2 · `ValueError: binary mode doesn't take an encoding argument`**

原因:在二进制模式（`'rb'`、`'wb'` 等）下给 `open()` 传入了 `encoding` 或 `errors` 参数。二进制模式按原始字节读写，不进行编码解码，这些参数没有意义，Python 直接拒绝。

解决:二进制模式下移除 `encoding` 和 `errors` 参数。需要处理文本编码时改用文本模式（`'r'`、`'w'`），或在二进制模式下手动调用 `encode()` 和 `decode()` 方法。

**错误 3 · `struct.error: unpack requires a buffer of 4 bytes`**

原因:`struct.unpack()` 要求传入的 bytes 长度与格式字符串要求的字节数严格匹配，传入的 bytes 长度不足或超出时抛出异常。常见于读取文件末尾时数据不完整，却直接传给 `unpack` 解包。

解决:解包前先检查 bytes 长度是否与预期一致，长度不足时返回默认值或跳过。使用 `struct.calcsize(fmt)` 可以预先计算格式字符串需要的字节数，便于做长度校验。
