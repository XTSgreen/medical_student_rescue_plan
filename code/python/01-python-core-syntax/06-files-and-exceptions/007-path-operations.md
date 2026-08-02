---
title: 6.7 文件系统路径操作
sidebar:
  order: 7
---
# 6.7 文件系统路径操作

文件操作不仅涉及读写文件内容，还涉及在文件系统中查找、判断、拼接路径。程序需要知道任务数据文件是否存在、放在哪个目录、文件大小是多少，这些信息通过路径操作获取。Python 提供了两套路径处理工具：传统的 `os.path` 模块以字符串形式处理路径，现代的 `pathlib` 模块以面向对象方式封装路径操作。本节将讲解 `os` 模块的工作目录操作、`os.path` 系列函数和 `pathlib.Path` 的基础用法，并以查找任务数据文件为贯穿示例。任务管理器在加载任务文件前需要确认文件存在、获取文件大小、定位数据目录，这些都依赖路径操作。

## 6.7.1 os 模块的工作目录操作

`os` 模块提供了与操作系统交互的接口，本节只涉及工作目录相关的两个函数，其他系统操作在后续章节展开。

### os.getcwd() 获取当前工作目录

`os.getcwd()` 返回当前工作目录的字符串路径。相对路径的解析以工作目录为基准，了解当前工作目录有助于理解相对路径指向的实际位置。

```python
import os

print(os.getcwd())
# Windows: 'D:\\projects\\task_manager'
# Linux:   '/home/user/task_manager'
```

工作目录是进程级别的属性，启动 Python 解释器时的目录就是初始工作目录，可以在 IDE 或命令行中设置。程序中所有相对路径都基于这个目录解析。

### os.chdir(path) 改变工作目录

`os.chdir(path)` 改变当前工作目录到指定路径。改变后，后续的相对路径以新目录为基准。

```python
import os

os.chdir("D:/projects/task_manager/data")
print(os.getcwd())  # D:/projects/task_manager/data

with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()
# 此时 tasks.txt 指向 data 目录下的文件
```

频繁改变工作目录会让路径解析变得难以追踪，**推荐的做法是使用绝对路径或 Path 对象，而不是依赖工作目录**。`os.chdir()` 主要用于脚本初始化时切换到项目根目录，或者在交互式环境中临时切换。

## 6.7.2 os.path 模块的路径判断函数

`os.path` 模块以字符串形式处理路径，提供判断、拼接、分割等功能。虽然 `pathlib` 是更现代的选择，但 `os.path` 在大量现有代码中广泛使用，理解其用法仍然必要。

### os.path.exists() 判断路径是否存在

`os.path.exists(path)` 返回路径是否存在，对文件和目录都有效。

```python
import os

if os.path.exists("tasks.txt"):
    print("任务文件存在")
else:
    print("任务文件不存在，将创建新文件")
```

### os.path.isfile() 和 os.path.isdir()

`os.path.isfile(path)` 判断路径是否为文件，`os.path.isdir(path)` 判断是否为目录。这两个函数比 `exists()` 更精确，因为它们区分文件和目录。

```python
import os

path = "tasks.txt"
if os.path.isfile(path):
    print("是一个文件")
elif os.path.isdir(path):
    print("是一个目录")
else:
    print("路径不存在")
```

在打开文件前用 `isfile()` 检查，可以避免对目录执行文件操作导致的 `IsADirectoryError`。不过更推荐的做法是直接尝试打开并用异常处理，因为检查和打开之间存在时间窗口，文件可能被其他进程删除或创建。

### os.path.isabs() 判断绝对路径

`os.path.isabs(path)` 判断路径是否为绝对路径。Windows 下以盘符开头（如 `C:\`）的是绝对路径，Linux 下以 `/` 开头的是绝对路径。

```python
import os

print(os.path.isabs("tasks.txt"))          # False
print(os.path.isabs("D:/data/tasks.txt"))  # True（Windows）
print(os.path.isabs("/home/user/data"))    # True（Linux）
```

## 6.7.3 os.path 的路径拼接与分割

路径拼接和分割是路径操作的核心功能，正确使用可以避免平台相关的路径分隔符问题。

### os.path.join() 拼接路径

`os.path.join(*paths)` 用操作系统正确的分隔符拼接多个路径段。Windows 下用 `\`，Linux 下用 `/`。这是拼接路径的推荐方式，避免手动用字符串拼接导致分隔符错误。

```python
import os

# 跨平台安全的路径拼接
data_dir = "data"
filename = "tasks.txt"
full_path = os.path.join(data_dir, filename)
print(full_path)
# Windows: data\tasks.txt
# Linux:   data/tasks.txt
```

手动用 `+` 拼接路径容易出错，比如 `data_dir + "/" + filename` 在 Windows 上虽然多数情况能用，但不规范。`os.path.join()` 还能正确处理路径段中的结尾分隔符和绝对路径段。

```python
import os

# 绝对路径段会重置路径
print(os.path.join("/home", "user", "data"))   # /home/user/data
print(os.path.join("/home", "/user", "data"))  # /user/data（/user 是绝对路径）
```

### os.path.split() 分割目录和文件名

`os.path.split(path)` 返回一个元组 `(dir, name)`，把路径最后一个分隔符之前的部分作为目录，之后的部分作为文件名。

```python
import os

path = "D:/projects/task_manager/data/tasks.txt"
dir_part, name_part = os.path.split(path)
print(dir_part)   # D:/projects/task_manager/data
print(name_part)  # tasks.txt
```

### os.path.splitext() 分割文件名和扩展名

`os.path.splitext(path)` 返回元组 `(root, ext)`，把扩展名（含点）分离出来。

```python
import os

path = "tasks.txt"
root, ext = os.path.splitext(path)
print(root)  # tasks
print(ext)   # .txt

# 处理多个点的文件名
path = "backup.2026.08.tar.gz"
root, ext = os.path.splitext(path)
print(root)  # backup.2026.08.tar
print(ext)   # .gz（只分离最后一个扩展名）
```

### os.path.basename() 和 os.path.dirname()

`os.path.basename(path)` 返回路径的文件名部分，`os.path.dirname(path)` 返回目录部分。它们等价于 `os.path.split()` 的两个返回值。

```python
import os

path = "D:/projects/task_manager/data/tasks.txt"
print(os.path.basename(path))  # tasks.txt
print(os.path.dirname(path))   # D:/projects/task_manager/data
```

### os.path.abspath() 和 os.path.realpath()

`os.path.abspath(path)` 返回路径的绝对路径形式，基于当前工作目录解析相对路径。`os.path.realpath(path)` 在此基础上解析符号链接，返回真实路径。

```python
import os

print(os.path.abspath("tasks.txt"))
# D:\projects\task_manager\tasks.txt（基于当前工作目录）

# realpath 解析符号链接
# print(os.path.realpath("/usr/bin/python3"))
# 可能返回 /usr/bin/python3.11
```

### os.path.getsize() 获取文件大小

`os.path.getsize(path)` 返回文件的字节大小。文件不存在时抛出 `FileNotFoundError`。

```python
import os

size = os.path.getsize("tasks.txt")
print(f"任务文件大小：{size} 字节")
```

## 6.7.4 pathlib.Path 基础

`pathlib` 是 Python 3.4 引入的现代路径处理模块，以面向对象方式封装路径操作。`Path` 对象比字符串路径更直观，方法调用链式书写，是新建项目的推荐选择。

### 构造 Path 对象

`Path(*pathsegments)` 接受一个或多个路径段，构造一个 Path 对象。正斜杠 `/` 被 Path 重载为路径拼接运算符，写法非常直观。

```python
from pathlib import Path

# 多种构造方式
p1 = Path("data", "tasks.txt")
p2 = Path("data/tasks.txt")
p3 = Path("data") / "tasks.txt"  # 用 / 运算符拼接

print(p1)  # data\tasks.txt（Windows）或 data/tasks.txt（Linux）
print(p1 == p2 == p3)  # True
```

`/` 运算符的写法让路径拼接看起来像数学表达式，可读性比 `os.path.join()` 更好，尤其是多级拼接时：

```python
from pathlib import Path

base = Path("D:/projects/task_manager")
data_file = base / "data" / "tasks.txt"
backup_file = base / "backup" / "tasks.bak"
```

### Path.cwd() 和 Path.home()

`Path.cwd()` 返回当前工作目录的 Path 对象，`Path.home()` 返回用户主目录的 Path 对象。

```python
from pathlib import Path

print(Path.cwd())  # 当前工作目录
print(Path.home())  # 用户主目录
```

### Path.resolve() 解析绝对路径

`Path.resolve()` 返回路径的绝对路径形式，解析符号链接和相对路径。等价于 `os.path.realpath()`。

```python
from pathlib import Path

p = Path("data/tasks.txt")
abs_path = p.resolve()
print(abs_path)  # D:\projects\task_manager\data\tasks.txt
```

## 6.7.5 Path 对象的属性

Path 对象提供一系列属性访问路径的各个组成部分，比 `os.path` 的函数调用更直观。

```python
from pathlib import Path

p = Path("D:/projects/task_manager/data/tasks.txt")

print(p.name)      # tasks.txt，文件名
print(p.stem)      # tasks，不含扩展名的文件名
print(p.suffix)    # .txt，扩展名（含点）
print(p.parent)    # D:/projects/task_manager/data，父目录
print(p.anchor)    # D:/，路径锚点（盘符或根目录）

# 多级扩展名
p2 = Path("archive.tar.gz")
print(p2.suffix)   # .gz（只取最后一个）
print(p2.suffixes) # ['.tar', '.gz']（所有扩展名列表）
```

`with_name()` 和 `with_suffix()` 可以创建修改了文件名或扩展名的新 Path 对象，不修改原对象：

```python
from pathlib import Path

p = Path("data/tasks.txt")
print(p.with_name("done.txt"))    # data/done.txt
print(p.with_suffix(".bak"))      # data/tasks.bak
```

这在生成备份文件路径时非常方便，比如把 `tasks.txt` 改为 `tasks.bak`。

## 6.7.6 Path 对象的判断与信息方法

Path 对象的判断和信息方法与 `os.path` 对应，但以方法形式调用。

```python
from pathlib import Path

p = Path("tasks.txt")

print(p.exists())     # 是否存在
print(p.is_file())    # 是否为文件
print(p.is_dir())     # 是否为目录

if p.exists():
    print(p.stat().st_size)  # 文件大小（字节）
    print(p.stat().st_mtime)  # 修改时间（时间戳）
```

`stat()` 方法返回一个包含文件信息的对象，比 `os.path.getsize()` 提供更全面的信息，包括大小、修改时间、创建时间、权限等。

## 6.7.7 Path 对象的文件读写

Path 对象直接提供 `read_text()`、`write_text()`、`read_bytes()`、`write_bytes()` 方法，把打开、读写、关闭三步合一，适合简单的一次性读写。

```python
from pathlib import Path

p = Path("tasks.txt")

# 一次性读取文本
content = p.read_text(encoding="utf-8")

# 一次性写入文本（覆盖）
p.write_text("新任务列表\n", encoding="utf-8")

# 一次性读取二进制
data = p.read_bytes()
```

这些方法内部使用 with 语句，保证文件正确关闭。但它们会一次性读取或写入全部内容，不适合大文件。需要逐行处理或分块读写时，仍然要用 `open()` 配合 with 语句。

```python
from pathlib import Path

p = Path("tasks.txt")

# 大文件仍用 open
with p.open("r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

`Path.open()` 方法等价于内置 `open()`，但以 Path 对象作为路径，调用更自然。

## 6.7.8 综合示例：查找任务数据文件

任务管理器需要在指定目录下查找任务数据文件，确认文件存在并获取基本信息。以下示例展示如何用 pathlib 实现这一流程。

```python
from pathlib import Path

def find_task_file(data_dir, filename="tasks.txt"):
    """在指定目录下查找任务文件，返回文件信息"""
    path = Path(data_dir) / filename

    if not path.exists():
        print(f"文件不存在：{path}")
        return None

    if not path.is_file():
        print(f"路径不是文件：{path}")
        return None

    stat = path.stat()
    return {
        "path": str(path.resolve()),
        "name": path.name,
        "size": stat.st_size,
        "size_kb": round(stat.st_size / 1024, 2),
    }

# 使用示例
info = find_task_file("data", "tasks.txt")
if info:
    print(f"找到文件：{info['name']}")
    print(f"完整路径：{info['path']}")
    print(f"大小：{info['size']} 字节（{info['size_kb']} KB）")
```

这个函数先用 Path 拼接路径，再用 `exists()` 和 `is_file()` 检查，最后用 `stat()` 获取文件信息。整个过程不需要 `os` 模块，代码简洁直观。

如果需要遍历目录查找所有任务文件，可以用 `Path.iterdir()` 或 `Path.glob()`：

```python
from pathlib import Path

data_dir = Path("data")

# 列出目录下所有文件
for item in data_dir.iterdir():
    if item.is_file() and item.suffix == ".txt":
        print(f"找到任务文件：{item.name}")

# 用 glob 模式匹配
for txt_file in data_dir.glob("*.txt"):
    print(txt_file)

# 递归查找所有子目录
for txt_file in data_dir.rglob("*.txt"):
    print(txt_file)
```

`glob()` 和 `rglob()` 提供了灵活的文件匹配能力，`rglob()` 递归遍历所有子目录。这些方法在需要批量处理文件时非常有用。

## 练习题

1. 用 `os.path.join()` 和 `pathlib.Path` 两种方式拼接路径 `data` 目录下的 `tasks.txt` 文件，并比较两种写法的优劣。

::: details 参考答案
```python
import os
from pathlib import Path

# os.path 方式
path1 = os.path.join("data", "tasks.txt")

# pathlib 方式
path2 = Path("data") / "tasks.txt"
# 或
path3 = Path("data/tasks.txt")

print(path1)  # data\tasks.txt（Windows）
print(path2)  # data\tasks.txt
```
两种方式都能正确跨平台拼接路径。`os.path.join()` 是函数调用，需要 import os，适合在传统代码中使用。`pathlib` 的 `/` 运算符写法更直观，链式拼接多级路径时可读性更好，且 Path 对象后续还能调用 `.exists()`、`.read_text()` 等方法，功能更丰富。新建项目推荐 pathlib。
:::

2. 写一个函数 `get_file_info(path)`，返回文件的名称、扩展名、父目录、字节大小。文件不存在时返回 None。要求使用 pathlib 实现。

::: details 参考答案
```python
from pathlib import Path

def get_file_info(path):
    p = Path(path)
    if not p.is_file():
        return None
    return {
        "name": p.name,
        "stem": p.stem,
        "suffix": p.suffix,
        "parent": str(p.parent),
        "size": p.stat().st_size,
    }

# 使用示例
info = get_file_info("data/tasks.txt")
if info:
    print(f"文件名：{info['name']}")
    print(f"无扩展名：{info['stem']}")
    print(f"扩展名：{info['suffix']}")
    print(f"父目录：{info['parent']}")
    print(f"大小：{info['size']} 字节")
```
用 `is_file()` 判断是否为存在的文件，避免对目录或不存在的路径获取信息。`stat().st_size` 获取字节大小。所有属性通过 Path 对象的方法和属性获取，代码简洁。
:::

3. 以下代码试图获取文件扩展名，但结果不符合预期。解释原因并改正。

```python
filename = "backup.2026.08.tar.gz"
parts = filename.split(".")
ext = parts[-1]
print(ext)  # 期望得到 .tar.gz
```

::: details 参考答案
`split(".")` 按点分割后取最后一个元素得到 `gz`，没有点号，也不是完整的 `.tar.gz`。Python 的路径函数默认只识别最后一个扩展名。

如果只需要最后一个扩展名，用 `os.path.splitext()` 或 `Path.suffix`：

```python
from pathlib import Path
import os

filename = "backup.2026.08.tar.gz"

# 方法一：os.path
root, ext = os.path.splitext(filename)
print(ext)  # .gz

# 方法二：pathlib
p = Path(filename)
print(p.suffix)    # .gz
print(p.suffixes)  # ['.tar', '.gz']，所有扩展名
```

如果确实需要得到 `.tar.gz` 这样的复合扩展名，可以用 `Path.suffixes` 拼接：

```python
from pathlib import Path

p = Path("backup.2026.08.tar.gz")
compound_ext = "".join(p.suffixes)
print(compound_ext)  # .tar.gz
```
:::

4. 任务管理器的数据目录下可能有多个 `.txt` 任务文件，写一段代码用 pathlib 递归查找该目录及子目录下所有 `.txt` 文件，并打印每个文件的路径和大小。

::: details 参考答案
```python
from pathlib import Path

data_dir = Path("data")

for txt_file in data_dir.rglob("*.txt"):
    size = txt_file.stat().st_size
    print(f"{txt_file}  ({size} 字节)")
```
`rglob("*.txt")` 递归遍历所有子目录，匹配扩展名为 `.txt` 的文件。对每个匹配到的 Path 对象，`stat().st_size` 获取文件大小。如果目录不存在，`rglob` 返回空迭代器，不会报错。

如果只想查找当前目录不递归，用 `glob("*.txt")` 代替 `rglob`。
:::

## 常见错误

**错误 1 · `FileNotFoundError: [WinError 3] 系统找不到指定的路径。` 或 `[Errno 2] No such file or directory`**

原因:对不存在的路径调用 `os.path.getsize()`、`os.listdir()`、`Path.stat()` 等需要路径真实存在的函数。路径拼写错误、目录未创建、相对路径基准目录不对都会引发此错误。

解决:调用需要路径存在的函数前先用 `os.path.exists()` 或 `Path.exists()` 检查，或用 try-except 捕获 `FileNotFoundError`。涉及多级目录时，先用 `Path.mkdir(parents=True, exist_ok=True)` 确保目录存在。

**错误 2 · `IsADirectoryError: [Errno 21] Is a directory: 'data'`**

原因:把一个目录路径当作文件来打开或读取。`open("data", "r")` 中 `data` 是目录而非文件时抛出异常，常见于路径拼接遗漏了文件名，或遍历目录时把子目录当文件处理。

解决:打开文件前用 `os.path.isfile()` 或 `Path.is_file()` 确认路径指向的是文件而非目录。遍历目录时用 `is_file()` 过滤掉子目录，只处理文件项。

**错误 3 · 路径拼接结果错误或跨平台失效**

原因:用字符串 `+` 拼接路径，如 `"data" + "/" + "tasks.txt"`，在 Windows 上可能因分隔符不一致导致路径混乱；遗漏分隔符时拼出 `datatasks.txt` 这样的非法路径；手动拼接还容易忽略路径段末尾是否已有分隔符。

解决:路径拼接一律使用 `os.path.join()` 或 `pathlib.Path` 的 `/` 运算符，由 Python 根据当前操作系统选择正确的分隔符。这两个工具还能正确处理路径段中的多余分隔符和绝对路径段，避免人为拼接错误。
