---
title: 6.12 文件操作中的典型异常场景
sidebar:
  order: 12
---
# 6.12 文件操作中的典型异常场景

前面几节分别讲解了文件操作和异常处理的理论知识。实际编程中，文件操作是异常最密集的场景之一，几乎每一步都可能出错：文件不存在、权限不足、路径是目录而非文件、编码不匹配、磁盘空间不足、文件已关闭等。本章把这些知识整合起来，系统梳理文件操作中各种典型的异常场景，分析每种异常的触发条件和处理策略，并给出一个任务管理器文件读写的完整异常处理示例。掌握这些场景，才能写出在真实环境下稳健运行的文件处理代码。

## 6.12.1 FileNotFoundError 文件不存在

以读取模式 `'r'` 打开不存在的文件时，Python 抛出 `FileNotFoundError`。这是文件操作中最常见的异常，通常发生在首次运行程序或文件路径错误时。

```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    print("任务文件不存在，使用空任务列表")
    content = ""
    tasks = content.splitlines() if content else []
```

处理策略取决于业务需求。任务管理器首次运行时任务文件不存在是正常情况，应当返回空列表让程序继续运行。如果文件是必需的配置文件，不存在时可能需要提示用户创建或使用默认配置。

需要注意的是，`'w'`、`'a'`、`'x'` 等写入模式不会触发 `FileNotFoundError`，因为文件不存在时会自动创建。只有读取模式 `'r'` 和读写模式 `'r+'` 要求文件必须存在。

## 6.12.2 FileExistsError 文件已存在

用独占创建模式 `'x'` 打开已存在的文件时，Python 抛出 `FileExistsError`。这种异常用于防止意外覆盖已有文件。

```python
try:
    with open("tasks.txt", "x", encoding="utf-8") as f:
        f.write("初始任务列表\n")
    print("任务文件创建成功")
except FileExistsError:
    print("任务文件已存在，未覆盖")
    # 可以改为读取现有文件，或提示用户选择其他文件名
```

处理策略通常是提示用户文件已存在，让用户决定是覆盖、追加还是更换文件名。如果选择覆盖，可以改用 `'w'` 模式重新打开；如果选择追加，改用 `'a'` 模式。

## 6.12.3 PermissionError 权限不足

当程序没有权限访问文件或目录时，Python 抛出 `PermissionError`。常见情况包括：以写模式打开只读文件、访问其他用户的文件、在没有写权限的目录中创建文件。

```python
try:
    with open("/etc/passwd", "w") as f:
        f.write("test")
except PermissionError as e:
    print(f"权限不足：{e}")
    # 提示用户检查文件权限或以管理员身份运行
```

`PermissionError` 还可能在创建文件时触发，如果目标目录没有写权限：

```python
try:
    with open("/readonly_dir/tasks.txt", "w", encoding="utf-8") as f:
        f.write("test")
except PermissionError:
    print("无法在目标目录创建文件，请检查目录权限")
```

处理策略是提示用户检查权限设置，或者让程序降级到用户有权限的目录。在某些操作系统中，还可能遇到文件被其他进程锁定的情况，表现类似权限不足。

## 6.12.4 IsADirectoryError 路径是目录

当用文件模式打开一个目录路径时，Python 抛出 `IsADirectoryError`。这种错误通常发生在路径拼接错误或用户输入了目录路径而非文件路径时。

```python
import os

path = "data"  # 这是一个目录
try:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
except IsADirectoryError:
    print(f"路径 {path} 是目录而非文件")
    # 提示用户指定具体的文件路径
```

反向情况是 `NotADirectoryError`，在对文件路径执行目录操作时触发，比如 `os.listdir("tasks.txt")` 把文件当作目录遍历。

处理策略是检查路径类型并给出明确提示。在打开文件前用 `os.path.isfile()` 或 `Path.is_file()` 检查可以提前发现问题，但更推荐直接尝试打开并用异常处理，因为检查和打开之间存在时间窗口。

## 6.12.5 UnicodeDecodeError 编码不匹配

读取文本文件时，如果文件内容的字节序列无法按指定编码解码，Python 抛出 `UnicodeDecodeError`。这是跨平台文件操作中常见的异常，通常发生在文件编码与 `open()` 的 encoding 参数不一致时。

```python
# 文件实际是 GBK 编码，但用 UTF-8 读取
try:
    with open("old_tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except UnicodeDecodeError as e:
    print(f"编码错误：{e}")
    # 尝试用其他编码读取，或用 errors 参数容错
```

处理策略有几种。第一，确认文件实际编码后用正确的 encoding 参数重新打开。第二，用 `errors='replace'` 或 `errors='ignore'` 容错读取，但这会导致数据丢失或失真。第三，尝试多种编码依次读取，直到成功：

```python
def read_text_auto(path, encodings=("utf-8", "gbk", "latin-1")):
    """尝试多种编码读取文本文件"""
    for encoding in encodings:
        try:
            with open(path, "r", encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    # 所有编码都失败，用 replace 模式强制读取
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()

content = read_text_auto("unknown_encoding.txt")
```

`latin-1` 编码能映射任意字节到字符，不会抛出 `UnicodeDecodeError`，但读出的内容可能不是正确的文本。把它作为最后的兜底编码，可以保证读取不中断，但内容可能需要人工修正。

## 6.12.6 文件已关闭触发 ValueError

对已关闭的文件对象执行读写操作时，Python 抛出 `ValueError: I/O operation on closed file`。这种错误通常发生在文件对象的生命周期管理不当的场景，比如在 with 块之外使用文件对象。

```python
f = open("tasks.txt", "w", encoding="utf-8")
f.write("测试")
f.close()

try:
    f.write("更多内容")  # 文件已关闭
except ValueError as e:
    print(e)  # I/O operation on closed file.
```

使用 with 语句可以完全避免这类错误，因为 with 块结束后文件自动关闭，开发者不会在块外误用文件对象。如果确实需要在多个函数间传递文件对象，要确保在使用完毕前不关闭它。

## 6.12.7 磁盘空间不足触发 OSError

写入文件时如果磁盘空间不足，Python 抛出 `OSError`，错误消息通常包含 `No space left on device`。这种异常可能在 `write()` 或 `close()`（flush 时）触发。

```python
try:
    with open("large_data.txt", "w", encoding="utf-8") as f:
        for i in range(10 ** 9):
            f.write(f"行 {i}\n")
except OSError as e:
    if "No space left" in str(e):
        print("磁盘空间不足，写入失败")
        # 清理临时文件或提示用户
    else:
        raise  # 其他 OSError 重新抛出
```

磁盘空间不足是系统级错误，处理策略通常是提示用户清理磁盘或选择其他存储位置。需要注意的是，写入大文件时数据可能缓冲在内存中，磁盘满的异常可能延迟到 flush 或 close 时才触发。因此对于关键数据，写入后应当验证文件完整性。

## 6.12.8 文件路径过长触发 OSError

某些操作系统对文件路径长度有限制。Windows 上路径超过 260 字符（除非启用长路径支持），Linux 上通常限制在 4096 字符。路径过长时 Python 抛出 `OSError` 或 `FileNotFoundError`。

```python
try:
    with open("a" * 300 + ".txt", "w") as f:
        f.write("test")
except OSError as e:
    print(f"路径相关错误：{e}")
```

处理策略是检查路径长度，必要时缩短目录层级或文件名。在 Windows 上可以使用 `\\?\` 前缀启用长路径支持，但这需要代码层面的适配。

## 6.12.9 os 模块文件系统操作的异常

`os` 模块提供的文件系统操作同样可能抛出异常，了解这些异常有助于正确处理文件管理操作。

### os.remove() 删除文件

`os.remove(path)` 删除文件，文件不存在时抛出 `FileNotFoundError`，权限不足时抛出 `PermissionError`。

```python
import os

try:
    os.remove("temp_tasks.txt")
except FileNotFoundError:
    print("文件不存在，无需删除")
except PermissionError:
    print("无权限删除文件")
```

### os.rmdir() 删除空目录

`os.rmdir(path)` 删除空目录，目录非空时抛出 `OSError`，错误消息包含 `Directory not empty`。

```python
import os

try:
    os.rmdir("old_backup")
except FileNotFoundError:
    print("目录不存在")
except OSError as e:
    print(f"无法删除目录：{e}")
    # 可能目录非空，需要先清空或用 shutil.rmtree
```

### os.mkdir() 创建目录

`os.mkdir(path)` 创建单级目录，目录已存在时抛出 `FileExistsError`，父目录不存在时抛出 `FileNotFoundError`。

```python
import os

try:
    os.mkdir("data/tasks")
except FileExistsError:
    print("目录已存在")
except FileNotFoundError:
    print("父目录不存在，应使用 os.makedirs 创建多级目录")
```

创建多级目录应使用 `os.makedirs(path, exist_ok=True)`，`exist_ok=True` 参数让目录已存在时不报错：

```python
import os

os.makedirs("data/tasks/archive", exist_ok=True)  # 自动创建多级目录
```

## 6.12.10 文件操作异常的统一处理

文件操作涉及多种异常类型，逐一捕获会让代码冗长。由于 `FileNotFoundError`、`PermissionError`、`IsADirectoryError` 等都是 `OSError` 的子类，可以用 `except OSError` 统一捕获，再根据 `errno` 属性细分处理。

```python
import errno

def safe_open_read(path):
    """安全打开并读取文件，返回内容或 None"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"文件不存在：{path}")
    except PermissionError:
        print(f"权限不足：{path}")
    except IsADirectoryError:
        print(f"路径是目录：{path}")
    except UnicodeDecodeError:
        print(f"编码错误：{path}")
    except OSError as e:
        # 兜底捕获其他 OSError 子类
        print(f"系统错误：{e}")
    return None

content = safe_open_read("tasks.txt")
if content is not None:
    print(f"读取到 {len(content)} 个字符")
```

这种写法先用具体的子类 except 处理常见情况，再用 `except OSError` 兜底处理其他系统错误。`errno` 模块提供了错误码常量，可以用于更精确的错误判断：

```python
import errno

try:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
except OSError as e:
    if e.errno == errno.ENOENT:
        print("文件不存在")
    elif e.errno == errno.EACCES:
        print("权限不足")
    elif e.errno == errno.EISDIR:
        print("是目录")
    else:
        print(f"其他错误（errno={e.errno}）：{e}")
```

## 6.12.11 综合示例：任务管理器文件读写的完整异常处理

结合本章所有知识点，实现一个完整的任务管理器文件操作模块，包含任务列表的加载、保存、备份功能，每种操作都妥善处理可能出现的异常。

```python
import os
import shutil
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


class TaskFileManager:
    """任务文件管理器，处理任务的持久化"""

    def __init__(self, data_dir="data", filename="tasks.txt"):
        self.data_dir = Path(data_dir)
        self.file_path = self.data_dir / filename
        self.backup_path = self.data_dir / f"{filename}.bak"

    def ensure_data_dir(self):
        """确保数据目录存在"""
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logging.error(f"无权限创建目录：{self.data_dir}")
            raise

    def load_tasks(self):
        """加载任务列表，文件不存在时返回空列表"""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                tasks = []
                for line_num, line in enumerate(f, 1):
                    task = line.strip()
                    if not task or task.startswith("#"):
                        continue
                    tasks.append(task)
                logging.info(f"加载了 {len(tasks)} 条任务")
                return tasks
        except FileNotFoundError:
            logging.info("任务文件不存在，返回空列表")
            return []
        except PermissionError as e:
            logging.error(f"无权限读取文件：{e}")
            return []
        except UnicodeDecodeError as e:
            logging.error(f"文件编码错误，尝试用 GBK 读取：{e}")
            return self._load_with_fallback_encoding()
        except IsADirectoryError:
            logging.error(f"路径是目录而非文件：{self.file_path}")
            return []

    def _load_with_fallback_encoding(self):
        """用备用编码读取文件"""
        for encoding in ("gbk", "latin-1"):
            try:
                with open(self.file_path, "r", encoding=encoding) as f:
                    return [line.strip() for line in f if line.strip()]
            except UnicodeDecodeError:
                continue
        logging.warning("所有编码尝试失败，返回空列表")
        return []

    def save_tasks(self, tasks):
        """保存任务列表到文件"""
        self.ensure_data_dir()
        try:
            # 先写入临时文件，成功后替换原文件
            temp_path = self.file_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                for task in tasks:
                    f.write(task + "\n")
            # 临时文件写入成功，替换原文件
            shutil.move(str(temp_path), str(self.file_path))
            logging.info(f"保存了 {len(tasks)} 条任务")
        except PermissionError as e:
            logging.error(f"无权限写入文件：{e}")
            raise
        except OSError as e:
            logging.error(f"写入失败：{e}")
            # 清理临时文件
            temp_path = self.file_path.with_suffix(".tmp")
            if temp_path.exists():
                temp_path.unlink()
            raise

    def backup(self):
        """备份当前任务文件"""
        if not self.file_path.exists():
            logging.info("无需备份，任务文件不存在")
            return False
        try:
            shutil.copy2(str(self.file_path), str(self.backup_path))
            logging.info(f"已备份到 {self.backup_path}")
            return True
        except PermissionError as e:
            logging.error(f"备份失败，权限不足：{e}")
            return False
        except OSError as e:
            logging.error(f"备份失败：{e}")
            return False

    def get_file_info(self):
        """获取任务文件信息"""
        if not self.file_path.exists():
            return None
        stat = self.file_path.stat()
        return {
            "path": str(self.file_path.resolve()),
            "size": stat.st_size,
            "size_kb": round(stat.st_size / 1024, 2),
        }


# 使用示例
if __name__ == "__main__":
    manager = TaskFileManager("data", "tasks.txt")

    # 保存任务
    tasks = ["学习文件异常处理", "完成综合练习", "提交作业"]
    try:
        manager.save_tasks(tasks)
    except OSError:
        print("保存失败，请检查磁盘和权限")

    # 备份
    manager.backup()

    # 加载任务
    loaded = manager.load_tasks()
    print(f"加载的任务：{loaded}")

    # 查看文件信息
    info = manager.get_file_info()
    if info:
        print(f"文件大小：{info['size']} 字节")
```

这个综合示例展示了文件操作异常处理的完整实践。`load_tasks` 处理了文件不存在、权限不足、编码错误、路径是目录四种异常，编码错误时还有备用编码读取机制。`save_tasks` 采用先写临时文件再替换的策略，避免写入过程中出错导致原文件损坏，出错时还清理临时文件。`backup` 处理了源文件不存在和权限不足的情况。这种细致的异常处理让任务管理器在真实环境下能稳健运行，遇到问题时给出明确提示而非崩溃。

## 练习题

1. 以下代码试图读取任务文件并处理内容，但缺少异常处理。请添加合适的 try-except 结构，处理文件不存在、权限不足、编码错误三种异常，每种异常给出不同的处理方式。

```python
with open("tasks.txt", "r", encoding="utf-8") as f:
    content = f.read()
tasks = content.splitlines()
print(f"加载了 {len(tasks)} 条任务")
```

::: details 参考答案
```python
try:
    with open("tasks.txt", "r", encoding="utf-8") as f:
        content = f.read()
except FileNotFoundError:
    print("任务文件不存在，使用空列表")
    tasks = []
except PermissionError as e:
    print(f"权限不足，无法读取文件：{e}")
    tasks = []
except UnicodeDecodeError as e:
    print(f"文件编码错误：{e}")
    # 尝试用 GBK 编码读取
    try:
        with open("tasks.txt", "r", encoding="gbk") as f:
            content = f.read()
        tasks = content.splitlines()
    except UnicodeDecodeError:
        print("GBK 编码也失败，使用空列表")
        tasks = []
else:
    tasks = content.splitlines()

print(f"加载了 {len(tasks)} 条任务")
```
文件不存在时返回空列表，让程序继续运行；权限不足时提示并返回空列表；编码错误时先尝试 GBK 编码，再失败则返回空列表。成功读取时在 else 块中处理内容，让异常职责清晰。三种异常分别处理，避免了用 `except Exception` 一刀切掩盖具体问题。
:::

2. 写一个函数 `safe_copy(src, dst)`，安全地复制文件。要求处理以下异常：源文件不存在时打印提示并返回 False；权限不足时打印提示并返回 False；目标目录不存在时自动创建；其他 OSError 打印错误并返回 False。成功时返回 True。

::: details 参考答案
```python
import os
from pathlib import Path

def safe_copy(src, dst):
    try:
        src_path = Path(src)
        dst_path = Path(dst)

        # 确保目标目录存在
        dst_path.parent.mkdir(parents=True, exist_ok=True)

        # 分块复制，避免大文件内存问题
        with open(src_path, "rb") as fin, open(dst_path, "wb") as fout:
            while True:
                chunk = fin.read(8192)
                if not chunk:
                    break
                fout.write(chunk)
        return True

    except FileNotFoundError:
        print(f"源文件不存在：{src}")
        return False
    except PermissionError as e:
        print(f"权限不足：{e}")
        return False
    except OSError as e:
        print(f"复制失败：{e}")
        return False

# 使用示例
if safe_copy("tasks.txt", "backup/tasks.txt"):
    print("复制成功")
else:
    print("复制失败")
```
用 `mkdir(parents=True, exist_ok=True)` 自动创建目标目录。分块复制避免大文件内存问题。按异常类型分别处理：文件不存在、权限不足、其他系统错误。返回布尔值让调用方判断是否成功。注意 FileNotFoundError 会在源文件不存在或目标目录创建失败时触发，PermissionError 在读写权限不足时触发。
:::

3. `save_tasks` 函数采用"先写临时文件再替换"的策略。解释这种策略的好处，并说明如果不这样做可能出现什么问题。

::: details 参考答案
先写临时文件再替换（atomic write 模式）的好处是保证数据一致性。写入过程中如果发生异常（如磁盘满、程序崩溃、断电），临时文件可能不完整，但原文件不受影响，仍然是上次成功保存的完整版本。只有临时文件完整写入后，才用 `shutil.move` 原子性地替换原文件。

如果不这样做，直接用 `'w'` 模式打开原文件写入，`open()` 调用时文件就被清空了。如果写入过程中发生异常，原文件已经被清空，新数据又没写完，数据就丢失了。即使有备份，也可能丢失最近一次的修改。

直接写入的问题场景：假设任务列表有 100 条任务，写到第 50 条时磁盘满了，抛出 OSError。此时原文件已经被清空，只写了 50 条任务，数据处于不一致状态。先写临时文件则原文件保持完整，临时文件可以删除重试。

这种策略在数据库、配置文件等数据完整性要求高的场景中是标准做法。
:::

4. 以下代码试图删除一个目录及其内容，但可能抛出多种异常。请用 try-except 结构处理，对每种异常给出明确的错误提示。

```python
import os
os.rmdir("old_data")
```

::: details 参考答案
`os.rmdir` 只能删除空目录，目录非空时会抛出 OSError。还需要处理目录不存在和权限不足的情况。

```python
import os
import shutil

def remove_directory(path):
    try:
        os.rmdir(path)
        print(f"目录 {path} 已删除")
    except FileNotFoundError:
        print(f"目录不存在：{path}")
    except PermissionError:
        print(f"权限不足，无法删除目录：{path}")
    except OSError as e:
        # 目录非空或其他错误
        print(f"无法删除目录：{e}")
        # 如果是目录非空，可以询问用户是否强制删除
        choice = input("目录非空，是否强制删除所有内容？(y/n): ")
        if choice.lower() == "y":
            try:
                shutil.rmtree(path)
                print(f"目录 {path} 及其内容已删除")
            except PermissionError:
                print("权限不足，无法强制删除")
            except OSError as e:
                print(f"强制删除失败：{e}")

# 使用示例
remove_directory("old_data")
```
`os.rmdir` 处理空目录删除，遇到非空错误时询问用户是否用 `shutil.rmtree` 强制删除。`shutil.rmtree` 递归删除目录及其所有内容，是删除非空目录的标准方法。每种异常都给出明确提示，帮助用户理解失败原因。对于权限不足的情况，提示用户检查权限或以管理员身份运行。
:::

## 常见错误

**错误 1 · `OSError: [Errno 39] Directory not empty: 'old_data'`**

原因:用 `os.rmdir()` 删除一个非空目录。`os.rmdir()` 只能删除空目录，目录中有文件或子目录时抛出 `OSError`。这是删除目录时最常见的错误。

解决:确认目录为空后用 `os.rmdir()`，或直接用 `shutil.rmtree()` 递归删除目录及其所有内容。删除前应确认目录内容确实可以删除，避免误删重要数据。

**错误 2 · `'w'` 模式直接写入原文件导致数据丢失**

原因:用 `'w'` 模式打开原文件写入时，`open()` 调用立即清空文件内容。如果写入过程中发生异常（磁盘满、程序崩溃、断电），原文件已被清空，新数据又未写完，数据处于不一致状态甚至完全丢失。

解决:采用先写临时文件再替换的策略。先写入同目录下的临时文件，写入成功后用 `shutil.move()` 原子性替换原文件。写入过程中出错时原文件保持完整，临时文件可删除重试。这种原子写入模式是数据完整性要求高的场景的标准做法。

**错误 3 · `ValueError: I/O operation on closed file.`**

原因:文件对象在 with 块结束后或调用 `close()` 后被再次使用。常见于把文件对象赋值给外部变量，在 with 块外尝试读写；或在多个函数间传递文件对象时，某一处关闭后其他地方仍在使用。

解决:所有文件读写操作在 with 块内完成。需要在外部使用文件内容时，在 with 块内把数据读取到字符串或列表变量中，with 块外只使用这些数据变量。必须在多函数间共享文件对象时，明确生命周期管理责任，确保使用完毕前不关闭。

**错误 4 · `UnicodeDecodeError` 导致整个文件读取失败**

原因:文件中存在个别无法按指定编码解码的字节，默认的 `errors='strict'` 模式会立即抛出异常，整个文件读取中断。跨平台传输的文件、包含特殊字符的日志文件容易出现此问题。

解决:确认文件实际编码后用正确的 `encoding` 参数。无法确认编码时用 `errors='replace'` 容错读取，坏字符被替换为占位符，读取不中断。或编写多编码尝试函数，依次用 UTF-8、GBK、latin-1 等编码读取，直到成功。latin-1 能映射任意字节，可作为最后兜底。
