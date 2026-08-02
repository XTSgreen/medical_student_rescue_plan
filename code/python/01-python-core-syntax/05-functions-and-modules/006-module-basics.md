---
title: 5.6 模块基础
sidebar:
  order: 6
---
# 5.6 模块基础


任务管理器的代码越写越多，所有函数都堆在一个文件里会变得难以维护。把任务数据的增删改查逻辑放在一个文件，把界面显示逻辑放在另一个文件，各司其职，这就是模块化的思路。Python 中一个 `.py` 文件就是一个模块，模块让代码可以按功能拆分、复用和组织。本节讲解模块的概念、`import` 的各种用法、模块搜索路径、导入时的执行机制、`__all__` 的作用，以及循环导入这一常见问题。

## 5.6.1 模块的概念

Python 中每个 `.py` 文件就是一个模块，文件名去掉 `.py` 后缀就是模块名。模块把相关的函数、类、变量组织在一起，通过 `import` 语句可以被其他模块使用。模块是 Python 代码复用和组织的基本单位，标准库本身就是大量模块的集合，如 `os`、`sys`、`json` 等。

把任务管理器拆成两个模块：`task_manager.py` 负责任务数据的管理，`ui.py` 负责界面显示。两个文件放在同一目录下，就可以互相导入使用。

```python
# task_manager.py
tasks = []

def add_task(title, priority=3):
    tasks.append({"title": title, "priority": priority})
    return tasks[-1]

def remove_task(index):
    if 0 <= index < len(tasks):
        return tasks.pop(index)
    return None
```

```python
# ui.py
import task_manager

def show_all():
    if not task_manager.tasks:
        print("暂无任务")
        return
    for i, t in enumerate(task_manager.tasks, start=1):
        print(f"{i}. [{t['priority']}] {t['title']}")

def add_and_show(title, priority=3):
    task_manager.add_task(title, priority)
    show_all()
```

`ui.py` 中 `import task_manager` 导入了 `task_manager` 模块，之后用 `task_manager.tasks` 访问模块内的列表，用 `task_manager.add_task(...)` 调用模块内的函数。模块名作为前缀，明确了每个名称来自哪里。

## 5.6.2 import 语句

`import 模块名` 是最基本的导入方式。导入后通过 `模块名.名称` 的形式访问模块内的变量、函数、类。这种写法保留了模块名前缀，能清楚区分名称的来源，避免命名冲突。

```python
import task_manager

task_manager.add_task("写报告")
print(task_manager.tasks)
```

`import task_manager` 把 `task_manager` 模块加载到内存，绑定到当前命名空间的 `task_manager` 这个名字上。之后所有对模块内容的访问都要带 `task_manager.` 前缀。这种方式最清晰，是推荐的导入方式。

## 5.6.3 from...import 语句

`from 模块名 import 名称` 直接把模块内的特定名称导入到当前命名空间，使用时不需要加模块名前缀。这种写法更简洁，但要注意可能造成命名冲突。

```python
from task_manager import add_task, tasks

add_task("写报告")
print(tasks)
```

`add_task` 和 `tasks` 直接进入当前命名空间，使用时无需前缀。如果当前模块也有同名变量，后导入的会覆盖先定义的，这是 `from...import` 潜在的风险。可以一次导入多个名称，用逗号分隔。

## 5.6.4 as 别名

`import` 和 `from...import` 都可以用 `as` 给模块或名称指定别名，避免命名冲突或简化过长的名称。

```python
import task_manager as tm

tm.add_task("写报告")
print(tm.tasks)

from task_manager import add_task as add

add("开会")
```

`import task_manager as tm` 把模块别名为 `tm`，之后用 `tm.` 前缀访问。`from task_manager import add_task as add` 把函数别名为 `add`。别名在模块名较长或与当前模块名称冲突时特别有用。标准库中也常用别名，如 `import numpy as np`、`import pandas as pd`，这些是社区约定俗成的写法。

## 5.6.5 模块的搜索路径

当执行 `import task_manager` 时，Python 需要找到 `task_manager.py` 文件。搜索顺序由 `sys.path` 列表决定，包含以下几类路径：当前脚本所在目录、环境变量 `PYTHONPATH` 指定的目录、Python 标准库的安装目录、第三方库的安装目录。Python 按顺序依次查找，找到第一个匹配的模块就停止。

```python
import sys

for path in sys.path:
    print(path)
```

输出会列出所有搜索路径。其中第一个通常是当前脚本所在目录，这就是为什么 `task_manager.py` 和 `ui.py` 放在同一目录下就能互相导入。如果模块不在搜索路径中，导入会失败并报 `ModuleNotFoundError`。可以通过修改 `sys.path` 或设置 `PYTHONPATH` 环境变量来添加自定义搜索路径，但更规范的做法是把模块安装到 Python 的包目录中。

## 5.6.6 导入时执行顶层代码

导入模块时，Python 会从头到尾执行该模块的所有顶层代码。函数定义、类定义、变量赋值都属于顶层代码，它们在导入时执行，把定义的名称绑定到模块的命名空间。这也是为什么函数定义要写在调用之前——导入时执行定义，之后才能调用。

```python
# config.py
print("config 模块正在被加载")
DEFAULT_PRIORITY = 3

def get_default():
    return DEFAULT_PRIORITY
```

```python
# main.py
import config  # 会打印 "config 模块正在被加载"
print(config.DEFAULT_PRIORITY)  # 3
```

`import config` 时，`config.py` 的顶层代码被执行，`print` 语句随之执行，`DEFAULT_PRIORITY` 被赋值，`get_default` 函数被定义。这一机制意味着模块导入可能有副作用，如打印日志、创建文件、发起网络请求。应该避免在模块顶层放置有副作用的代码，把可执行逻辑放入函数或 `if __name__ == "__main__":` 块中。

## 5.6.7 模块只导入一次

同一个模块无论被 `import` 多少次，其顶层代码只在第一次导入时执行。Python 在 `sys.modules` 字典中缓存已导入的模块，再次导入时直接返回缓存的对象，不会重新执行模块代码。

```python
# main.py
import config  # 打印 "config 模块正在被加载"
import config  # 不再打印，直接用缓存
import config  # 同上

print("导入完成")
```

输出中 `config 模块正在被加载` 只出现一次。这种缓存机制保证了模块级别的初始化代码只执行一次，避免重复加载的开销和副作用。如果确实需要重新加载模块（开发调试时常见），可以使用 `importlib.reload()` 函数，但日常编程中很少用到。

## 5.6.8 sys.modules 缓存

`sys.modules` 是一个字典，键是模块名，值是已加载的模块对象。每次导入模块前，Python 先检查 `sys.modules` 中是否已有该模块，有就直接用，没有才去搜索并加载。

```python
import sys
import task_manager

print("task_manager" in sys.modules)  # True
print(sys.modules["task_manager"])    # <module 'task_manager' from '...'>
```

理解 `sys.modules` 的存在有助于解释一些现象：为什么重复导入不会重新执行模块代码，为什么修改了模块文件后需要重启解释器或用 `reload` 才能生效。在调试导入问题时，查看 `sys.modules` 能帮助判断模块是否被正确加载。

## 5.6.9 \_\_all\_\_ 变量

模块可以定义 `__all__` 变量，它是一个字符串列表，指定当使用 `from 模块名 import *` 时会导入哪些名称。`__all__` 让模块作者能控制公开的接口，隐藏内部实现细节。

```python
# task_manager.py
__all__ = ["add_task", "remove_task", "tasks"]

def add_task(title, priority=3):
    tasks.append({"title": title, "priority": priority})

def remove_task(index):
    return tasks.pop(index) if 0 <= index < len(tasks) else None

def _internal_helper():
    """内部辅助函数，不希望被外部使用。"""
    pass

tasks = []
```

```python
# main.py
from task_manager import *

add_task("写报告")   # 可用，在 __all__ 中
remove_task(0)       # 可用，在 __all__ 中
_internal_helper()   # 报错 NameError，不在 __all__ 中，未被导入
```

`from task_manager import *` 只导入 `__all__` 列表中的名称，以下划线开头的 `_internal_helper` 默认就不会被 `import *` 导入，`__all__` 进一步明确了公开的接口。即使不使用 `import *`，定义 `__all__` 也能作为模块接口的文档，告诉使用者哪些是公开 API。

## 5.6.10 避免 from module import *

`from 模块名 import *` 会把模块中所有非下划线开头的名称（或 `__all__` 指定的名称）全部导入当前命名空间。这种写法看似方便，但会污染命名空间，覆盖已有名称，且无法从代码中看出某个名称来自哪个模块，应该避免使用。

```python
# 不推荐
from task_manager import *
from ui import *

add_task("写报告")  # 是 task_manager 的还是 ui 的？不清楚
```

如果两个模块有同名函数，后导入的会覆盖先导入的，且不会有任何提示，排查起来很困难。推荐的做法是使用 `import 模块名` 带前缀访问，或 `from 模块名 import 具体名称` 只导入需要的名称。

## 5.6.11 循环导入问题

当两个模块互相导入时，会产生循环导入。例如 `task_manager.py` 导入 `ui.py`，同时 `ui.py` 又导入 `task_manager.py`。循环导入可能导致其中一个模块在尚未完全加载时就被另一个模块引用，从而报 `ImportError` 或 `AttributeError`。

```python
# task_manager.py
import ui  # 导入 ui

def add_task(title):
    tasks.append({"title": title})
    ui.show_all()  # 添加后刷新显示

tasks = []
```

```python
# ui.py
import task_manager  # 导入 task_manager

def show_all():
    for t in task_manager.tasks:
        print(t)
```

执行 `import task_manager` 时，Python 开始加载 `task_manager.py`，遇到 `import ui` 就去加载 `ui.py`，`ui.py` 中又遇到 `import task_manager`，但此时 `task_manager` 还没加载完（`tasks` 还没定义），`sys.modules` 中只有一个不完整的 `task_manager` 模块对象。后续在 `show_all` 中访问 `task_manager.tasks` 时就可能报错。

## 5.6.12 循环导入的解决策略

解决循环导入的常用方法有几种。第一种是延迟导入，把 `import` 语句放到函数内部，需要时才导入，避免在模块加载阶段产生循环。

```python
# task_manager.py
def add_task(title):
    tasks.append({"title": title})
    import ui  # 延迟到函数内导入
    ui.show_all()

tasks = []
```

把 `import ui` 移到 `add_task` 函数内部，模块加载阶段不再互相依赖，循环导入问题消失。延迟导入的代价是每次调用函数都要执行导入语句（实际由于 `sys.modules` 缓存，只有第一次真正加载）。

第二种方法是重构代码，消除循环依赖。把两个模块共同依赖的部分提取到第三个模块中，让原本互相依赖的两个模块都依赖这个公共模块，而不是互相依赖。

```python
# data.py —— 公共数据模块
tasks = []
```

```python
# task_manager.py
from data import tasks

def add_task(title):
    tasks.append({"title": title})
```

```python
# ui.py
from data import tasks

def show_all():
    for t in tasks:
        print(t)
```

`task_manager` 和 `ui` 都依赖 `data`，但不再互相依赖，循环消除。重构是解决循环导入最彻底的方式，能让模块结构更清晰。设计模块时应尽量保持单向依赖，避免循环。

::: tip 模块导入的最佳实践
优先使用 `import 模块名` 带前缀访问，清晰且安全。需要简化时用 `from 模块名 import 具体名称`，避免 `import *`。模块顶层只放定义和常量，可执行代码放入函数或 `if __name__ == "__main__":`。设计模块时保持单向依赖，从源头避免循环导入。
:::

## 练习题

**练习 1** 创建一个模块 `math_utils.py`，其中定义函数 `square(n)` 返回平方值和 `cube(n)` 返回立方值，并定义 `__all__ = ["square", "cube"]`。然后在另一个文件中分别用 `import math_utils` 和 `from math_utils import square` 两种方式调用这两个函数。

::: details 参考答案
```python
# math_utils.py
__all__ = ["square", "cube"]

def square(n):
    return n ** 2

def cube(n):
    return n ** 3
```

```python
# main.py
# 方式一：import 模块名
import math_utils
print(math_utils.square(5))  # 25
print(math_utils.cube(3))    # 27

# 方式二：from...import
from math_utils import square
print(square(6))  # 36
```

方式一带模块名前缀，能清楚看出函数来自 `math_utils`。方式二直接导入函数名，调用时无需前缀，但如果当前文件也有 `square` 函数会被覆盖。`__all__` 控制了 `import *` 的行为，对显式的 `import` 和 `from...import` 无影响。
:::

**练习 2** 以下两个模块存在循环导入问题，请用延迟导入的方式修复，使程序能正常运行。

```python
# a.py
import b

def func_a():
    b.func_b()

def value():
    return 10
```

```python
# b.py
import a

def func_b():
    print(a.value())
```

::: details 参考答案
循环导入发生是因为 `a.py` 顶层 `import b` 触发加载 `b.py`，`b.py` 顶层 `import a` 又去加载未完成的 `a`。把其中一个导入改为延迟导入即可。

```python
# a.py
def func_a():
    import b  # 延迟到函数内导入
    b.func_b()

def value():
    return 10
```

```python
# b.py
import a  # a 模块此时只需在调用 func_b 时完整

def func_b():
    print(a.value())
```

把 `a.py` 中的 `import b` 移到 `func_a` 函数内部。加载 `a.py` 时不再触发加载 `b.py`，`a` 模块能完整加载。当调用 `func_a()` 时才导入 `b`，此时 `a` 已加载完毕，`b` 中 `import a` 能拿到完整的 `a` 模块。

测试代码如下。

```python
import a
a.func_a()  # 10
```
:::

**练习 3** 写一个模块 `counter.py`，包含一个全局变量 `count` 初始值为 0，和函数 `increment()` 让 `count` 加 1 并返回新值。在另一个文件中导入该模块，调用 `increment()` 三次，观察结果。然后再次 `import counter`，`count` 是否会重置？为什么？

::: details 参考答案
```python
# counter.py
count = 0

def increment():
    global count
    count += 1
    return count
```

```python
# main.py
import counter
print(counter.increment())  # 1
print(counter.increment())  # 2
print(counter.increment())  # 3

import counter  # 再次 import
print(counter.count)  # 3，不会重置
```

再次 `import counter` 不会重置 `count`，因为 Python 的 `sys.modules` 缓存了已加载的模块。重复 `import` 只是取出缓存中的同一个模块对象，不会重新执行模块代码。`count` 仍然是上次的值 3。如果确实需要重新加载，要用 `importlib.reload(counter)`，但这在日常编程中很少使用。

注意 `increment` 内部用了 `global count` 才能修改模块级变量，这与作用域章节讲的全局变量规则一致，只是这里的全局是模块级别。
:::

**练习 4** 以下代码使用了 `from task_manager import *`，运行后发现 `tasks` 列表被意外覆盖。请说明 `import *` 的风险，并改为更安全的导入方式。

```python
# 当前文件已有 tasks 变量
tasks = ["待办1", "待办2"]

from task_manager import *  # task_manager 中也有 tasks

print(tasks)  # 被 task_manager.tasks 覆盖了
```

::: details 参考答案
`from task_manager import *` 把 `task_manager` 模块中所有公开名称导入当前命名空间，其中包括 `tasks`。它覆盖了当前文件先定义的 `tasks = ["待办1", "待办2"]`，且没有任何警告，导致难以察觉的 bug。当多个模块都有同名名称时，`import *` 会让覆盖关系混乱。

更安全的导入方式有两种。

```python
# 方式一：import 模块名，带前缀访问
import task_manager

my_tasks = ["待办1", "待办2"]
print(my_tasks)            # ['待办1', '待办2']
print(task_manager.tasks)  # task_manager 的 tasks，两者互不干扰
```

```python
# 方式二：只导入需要的名称
from task_manager import add_task

my_tasks = ["待办1", "待办2"]
add_task("新任务")  # 只导入 add_task，不导入 tasks，避免冲突
```

两种方式都避免了命名空间污染。方式一最安全，所有访问都带模块前缀。方式二只导入需要的函数，减少冲突风险。
:::

## 常见错误

**错误 1 · `ModuleNotFoundError: No module named 'task_manager'`**

原因：Python 在 `sys.path` 列出的所有搜索路径中都找不到 `task_manager.py` 文件。常见于模块文件与执行脚本不在同一目录，或当前工作目录不是项目根目录。

解决：确认模块文件位置，把执行目录切换到项目根目录，或将模块所在路径加入 `PYTHONPATH` 环境变量。也可以在代码中临时 `sys.path.append("路径")`，但不推荐作为长期方案。

**错误 2 · `ImportError: cannot import name 'show_all' from partially initialized module 'ui'`**

原因：循环导入导致模块在尚未完全加载时被引用。A 模块顶层 `import B`，B 模块顶层 `import A`，A 还没执行完定义语句就被 B 拿去访问其中的名字。

解决：把其中一个导入改为函数内部的延迟导入，或把两个模块共同依赖的部分提取到第三个公共模块中，让依赖关系变为单向。

**错误 3 · `AttributeError: module 'task_manager' has no attribute 'add_task'`**

原因：导入的模块对象上找不到该名称。可能是模块文件中确实没定义该函数，也可能是循环导入导致模块加载不完整，定义语句尚未执行。

解决：先在模块文件中确认该名称存在且无拼写错误。若是循环导入引起，按上一条错误的解决方法处理。

**错误 4 · 修改模块源码后运行结果未变化**

现象：编辑 `.py` 文件保存后再次运行程序，行为与修改前一致。

原因：Python 在 `sys.modules` 中缓存已加载的模块，同一解释器进程内重复 `import` 不会重新执行模块代码，旧的函数定义仍在内存中。

解决：重启解释器进程让模块重新加载。开发调试时可用 `importlib.reload(module)` 强制重载，但需注意重载不会更新 `from module import name` 形式已绑定的名字。
