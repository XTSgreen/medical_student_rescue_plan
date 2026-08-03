---
title: 5.8 模块级特殊属性
sidebar:
  order: 8
---
# 5.8 模块级特殊属性


任务管理器的入口文件 `main.py` 里经常看到这样一段代码：`if __name__ == "__main__":`，下面放着启动程序的逻辑。这行代码的作用是什么？为什么要有这个判断？答案藏在模块的特殊属性 `__name__` 中。每个模块都自带一批以双下划线开头和结尾的特殊属性，它们记录了模块的名称、文件路径、文档等信息。本节讲解这些模块级特殊属性，重点是 `__name__` 和 `if __name__ == "__main__":` 这一常用的模式。

## 5.8.1 \_\_name\_\_ 模块属性

每个模块都有一个 `__name__` 属性，表示模块的名称。当一个模块被直接运行时，它的 `__name__` 值是 `"__main__"`。当一个模块被其他模块导入时，它的 `__name__` 值是模块名本身（文件名去掉 `.py`）。

```python
# task_manager.py
print(f"模块 __name__ 是: {__name__}")

def add_task(title):
    print(f"添加任务: {title}")
```

直接运行 `python task_manager.py`，输出是 `模块 __name__ 是: __main__`。如果在另一个文件中 `import task_manager`，输出是 `模块 __name__ 是: task_manager`。同一个文件，运行方式不同，`__name__` 的值就不同。这就是 `__name__` 属性的核心特性。

## 5.8.2 \_\_main\_\_ 的含义

`"__main__"` 是 Python 给直接运行的脚本起的名字。Python 解释器启动时，会运行用户指定的入口脚本，这个脚本的 `__name__` 被设为 `"__main__"`，表示它是主程序。而被导入的模块 `__name__` 是各自的模块名，不会是 `"__main__"`。

这个区分让模块能知道自己是被直接运行还是被导入，从而决定是否执行某些代码。直接运行时执行启动逻辑，被导入时只提供功能不启动，这就是 `if __name__ == "__main__":` 的基础。

## 5.8.3 if \_\_name\_\_ == "\_\_main\_\_": 的作用

`if __name__ == "__main__":` 是 Python 中最常见的惯用模式。它判断当前模块是否被直接运行，如果是，就执行块内的代码；如果是被导入，则跳过。这样可以让同一个文件既能作为脚本直接运行，又能作为模块被导入，两种用途互不干扰。

```python
# task_manager.py
tasks = []

def add_task(title, priority=3):
    tasks.append({"title": title, "priority": priority})
    return tasks[-1]

def show_tasks():
    for i, t in enumerate(tasks, start=1):
        print(f"{i}. [{t['priority']}] {t['title']}")

if __name__ == "__main__":
    # 只有直接运行时才执行
    add_task("写报告", 1)
    add_task("开会", 2)
    show_tasks()
```

直接运行 `python task_manager.py`，`__name__` 是 `"__main__"`，`if` 条件成立，执行块内的测试代码，添加两个任务并显示。如果在另一个文件 `import task_manager`，`__name__` 是 `"task_manager"`，`if` 条件不成立，块内代码不执行，模块只暴露函数和变量供外部使用。

如果没有这个判断，导入 `task_manager` 时测试代码就会执行，添加任务、打印输出，这通常不是导入者期望的副作用。`if __name__ == "__main__":` 把可直接执行的代码保护起来，是模块化编程的基本规范。

## 5.8.4 任务管理器入口文件示例

任务管理器的入口文件 `main.py` 把各模块组合起来，启动整个程序。把启动逻辑放在 `if __name__ == "__main__":` 中，让 `main.py` 既能直接运行，又能被其他代码导入使用其中的组装函数。

```python
# main.py
from task_manager import add_task, show_tasks
from ui import show_menu

def run():
    """启动任务管理器主循环。"""
    show_menu()
    add_task("初始化任务", 1)
    show_tasks()
    print("程序启动完成")

if __name__ == "__main__":
    run()
```

直接运行 `python main.py` 时，`run()` 被调用，程序启动。如果其他模块需要导入 `main` 中的 `run` 函数（比如测试时），`import main` 不会触发 `run()` 执行，因为 `__name__` 不是 `"__main__"`。这样 `run` 函数可以被单独调用或测试，而不会在导入时产生副作用。

## 5.8.5 \_\_file\_\_ 模块属性

`__file__` 属性存储模块的文件路径。对于普通模块，它是 `.py` 文件的路径。这个属性常用于定位模块所在目录，从而读取同目录下的数据文件。

```python
import task_manager
print(task_manager.__file__)
# 输出类似 /home/user/project/task_manager.py

# 在模块内部访问自身路径
print(__file__)
```

`__file__` 在需要根据模块位置查找资源文件时很有用。例如模块附带一个配置文件，可以用 `__file__` 推算出配置文件的路径。

```python
import os

# 获取当前模块所在目录
current_dir = os.path.dirname(__file__)
config_path = os.path.join(current_dir, "config.json")
print(config_path)
```

需要注意的是，某些特殊环境（如交互式解释器、冻结的可执行文件）中 `__file__` 可能不存在，使用前最好做判断。内置模块（如 `sys`）的 `__file__` 也不一定指向 `.py` 文件。

## 5.8.6 \_\_doc\_\_ 模块属性

模块的 `__doc__` 属性存储模块的文档字符串，即模块文件开头、所有代码之前的三引号字符串。模块文档字符串用于描述整个模块的功能和用法，与函数文档字符串的规则一致。

```python
# task_manager.py
"""任务管理模块。

提供任务的增删改查功能，以及任务列表的显示。
"""

tasks = []

def add_task(title):
    """添加一项任务。"""
    tasks.append({"title": title})
```

```python
import task_manager
print(task_manager.__doc__)
# 任务管理模块。
#
# 提供任务的增删改查功能，以及任务列表的显示。
```

模块文档字符串是模块级别的说明，被 `help(task_manager)` 读取显示。养成在模块开头写文档字符串的习惯，说明模块的职责、主要接口、使用示例，能显著提升代码的可维护性。文档字符串格式规范会在下一节详细讲解。

## 5.8.7 \_\_package\_\_ 模块属性

`__package__` 属性表示模块所属的包名。顶层模块（不属于任何包）的 `__package__` 是空字符串 `""` 或 `None`。包内模块的 `__package__` 是包的完整路径名。

```python
# task_project/models/task.py
print(__package__)  # task_project.models

# task_manager.py（顶层模块）
print(__package__)  # 空字符串
```

`__package__` 主要由导入系统内部使用，相对导入就是依据它确定当前模块所在的包。日常编程中很少直接使用这个属性，了解其含义有助于理解相对导入的工作原理。

## 5.8.8 \_\_cached\_\_ 模块属性

`__cached__` 属性存储模块字节码缓存文件的路径。Python 导入模块时会先编译源代码为字节码，缓存到 `__pycache__` 目录下的 `.pyc` 文件中，下次导入时直接加载缓存，跳过编译步骤，加快导入速度。

```python
import task_manager
print(task_manager.__cached__)
# 输出类似 __pycache__/task_manager.cpython-312.pyc
```

`__cached__` 指向的就是这个 `.pyc` 文件。这个属性几乎不需要手动操作，了解其存在即可。如果修改了源代码但发现运行结果没变，可能是缓存未更新，删除 `__pycache__` 目录即可强制重新编译。

## 5.8.9 特殊属性汇总

模块级特殊属性记录了模块的元信息，常用的几个总结如下。`__name__` 是模块名，直接运行时为 `"__main__"`，导入时为模块名。`__file__` 是模块文件路径。`__doc__` 是模块文档字符串。`__package__` 是所属包名。`__cached__` 是字节码缓存路径。

其中 `__name__` 是最常使用的，配合 `if __name__ == "__main__":` 实现模块的双用途。其余属性多用于调试、工具开发和元编程，日常业务代码中较少直接访问。

::: tip 为什么 if \_\_name\_\_ == "\_\_main\_\_": 如此重要
这个判断让每个 Python 文件既能作为可执行脚本运行，又能作为模块被导入。没有它，导入模块会触发模块内所有顶层代码执行，产生意想不到的副作用。养成把可执行代码放入 `if __name__ == "__main__":` 块的习惯，是编写可复用模块的基本要求。
:::

## 练习题

**练习 1** 以下文件 `greeting.py` 没有 `if __name__ == "__main__":` 保护。请说明直接运行和被导入时的行为差异，并加上保护使导入时不执行打印。

```python
# greeting.py
def greet(name):
    print(f"你好，{name}")

greet("张三")  # 顶层调用
```

::: details 参考答案
直接运行 `python greeting.py` 时，`greet("张三")` 执行，打印 `你好，张三`。被导入 `import greeting` 时，顶层代码也会执行，同样打印 `你好，张三`。导入者通常不希望触发这种打印，这就是没有保护的副作用。

加上保护后。

```python
# greeting.py
def greet(name):
    print(f"你好，{name}")

if __name__ == "__main__":
    greet("张三")
```

直接运行时 `__name__` 是 `"__main__"`，`greet("张三")` 执行。导入时 `__name__` 是 `"greeting"`，`if` 条件不成立，不执行打印，模块只提供 `greet` 函数供外部调用。
:::

**练习 2** 创建一个模块 `math_tools.py`，定义函数 `is_even(n)` 判断是否偶数。在 `if __name__ == "__main__":` 块中写几行测试代码，测试 `is_even` 在几个数字上的表现。然后写另一个文件导入该模块并调用 `is_even`，验证导入时测试代码不会执行。

::: details 参考答案
```python
# math_tools.py
def is_even(n):
    """判断一个整数是否为偶数。"""
    return n % 2 == 0

if __name__ == "__main__":
    # 测试代码，直接运行时才执行
    print("测试 is_even:")
    for num in [2, 3, 0, -4]:
        print(f"  is_even({num}) = {is_even(num)}")
```

```python
# main.py
import math_tools

# 导入时不打印测试信息
print("导入成功")
print(math_tools.is_even(10))  # True
```

直接运行 `python math_tools.py` 输出测试信息。

```
测试 is_even:
  is_even(2) = True
  is_even(3) = False
  is_even(0) = True
  is_even(-4) = True
```

运行 `python main.py` 只输出 `导入成功` 和 `True`，没有测试信息，因为导入时 `__name__` 是 `"math_tools"`，`if` 块不执行。这就是 `if __name__ == "__main__":` 的价值：模块自带的测试代码不影响被导入使用。
:::

**练习 3** 编写一个模块，在文件开头写文档字符串描述模块功能，定义一个函数并写函数文档字符串。然后用 `help()` 查看模块文档，用 `.__doc__` 分别访问模块和函数的文档。

::: details 参考答案
```python
# task_tools.py
"""任务工具模块。

提供任务列表的基本操作函数，包括添加和统计。
"""

def add_task(tasks, title):
    """向任务列表添加一项任务。

    参数:
        tasks: 任务列表
        title: 任务标题字符串
    """
    tasks.append(title)
    return tasks
```

```python
import task_tools

# 查看模块文档
print(task_tools.__doc__)
# 任务工具模块。
#
# 提供任务列表的基本操作函数，包括添加和统计。

# 查看函数文档
print(task_tools.add_task.__doc__)
# 向任务列表添加一项任务。
#
#     参数:
#         tasks: 任务列表
#         title: 任务标题字符串

# 用 help 查看完整信息
help(task_tools)
```

模块文档字符串放在文件开头第一条语句位置，函数文档字符串放在函数体第一条语句位置。两者都存入各自的 `__doc__` 属性，`help()` 会格式化显示。文档字符串是 Python 代码文档化的主要方式。
:::

**练习 4** 在一个包内的模块 `task_project/utils/date_util.py` 中，分别打印 `__name__`、`__package__`、`__file__` 的值。先直接运行该文件，再用 `python -m task_project.utils.date_util` 运行，对比两次输出的 `__name__` 和 `__package__` 有何不同。

::: details 参考答案
```python
# task_project/utils/date_util.py
print(f"__name__ = {__name__}")
print(f"__package__ = {__package__}")
print(f"__file__ = {__file__}")

def today_str():
    from datetime import date
    return date.today().isoformat()
```

直接运行 `python task_project/utils/date_util.py` 时输出类似。

```
__name__ = __main__
__package__ = 
__file__ = task_project/utils/date_util.py
```

用 `python -m task_project.utils.date_util` 运行时输出类似。

```
__name__ = __main__
__package__ = task_project.utils
__file__ = /完整路径/task_project/utils/date_util.py
```

两次运行 `__name__` 都是 `__main__`，因为无论哪种方式它都是入口脚本。区别在于 `__package__`：直接运行时为空字符串（当作顶层脚本），用 `-m` 运行时为 `task_project.utils`（知道它属于这个包）。这就是为什么用 `-m` 运行时相对导入能工作，而直接运行时相对导入报错。`__file__` 在两种方式下都指向同一文件，但路径形式可能不同。
:::

## 常见错误

**错误 1 · 导入模块时触发了顶层测试代码执行**

现象：`import greeting` 时控制台打印了 `你好，张三` 等测试输出，调用方并未主动调用任何函数。

原因：模块顶层写了可执行代码（如 `greet("张三")`），没有用 `if __name__ == "__main__":` 保护。导入时 Python 会从头到尾执行模块顶层代码，副作用随之触发。

解决：把可执行代码移入 `if __name__ == "__main__":` 块，模块顶层只保留定义、常量和导入语句。

**错误 2 · 误判 `__name__` 的值，把判断条件写错**

现象：`if __name__ == "__main__"` 块内的代码在被导入时也执行了。

原因：判断条件写成了 `if __name__ == "main"`（少了双下划线）、`if __name__ == '__main__'` 大小写错误，或把 `__name__` 误写成 `_name_` 等非标准形式，条件恒为真或恒为假。

解决：严格按 `if __name__ == "__main__":` 书写，注意 `__name__` 和 `"__main__"` 都是双下划线包围。可在交互环境中 `print(__name__)` 验证当前模块的实际取值。

**错误 3 · `AttributeError: module 'task_manager' has no attribute '__file__'`

原因：在交互式解释器、Jupyter Notebook 或某些冻结环境中创建的模块没有 `__file__` 属性。内置模块（如 `sys`）的 `__file__` 也可能不存在或指向非 `.py` 文件。

解决：访问 `__file__` 前用 `hasattr(module, "__file__")` 判断，或用 `try/except AttributeError` 包裹。需要定位模块所在目录时，优先用 `importlib.util.find_spec` 等更稳健的 API。

**错误 4 · 修改了 `__init__.py` 后行为未更新**

现象：编辑包的 `__init__.py` 添加导出后，外部 `from 包名 import 名称` 仍报 `ImportError`。

原因：包已被 `sys.modules` 缓存，再次 `import` 不会重新执行 `__init__.py`，新增的导出语句未生效。

解决：重启解释器进程让包重新加载，或开发时用 `importlib.reload` 配合包对象刷新。注意 `reload` 对已绑定的 `from 包名 import 名称` 形式不会自动更新。
