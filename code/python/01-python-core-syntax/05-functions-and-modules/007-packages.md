---
title: 5.7 包与项目组织
sidebar:
  order: 7
---
# 5.7 包与项目组织


任务管理器从单文件发展到多模块后，文件数量继续增长，把所有 `.py` 文件平铺在一个目录里会再次变得混乱。数据模型、界面显示、工具函数混在一起，找代码都要费劲。Python 的包机制就是为了解决这个问题：把相关的模块放进一个目录，目录名作为包名，形成层级结构。这样任务管理器可以组织成包含 `models/`、`ui/`、`utils/` 子包的项目，结构清晰、职责分明。本节讲解包的概念、`__init__.py` 的作用、绝对导入与相对导入，以及包的合理拆分原则。

## 5.7.1 包的概念

包是一种特殊的模块，它是一个包含 `__init__.py` 文件的目录。目录名就是包名，目录内的 `.py` 文件是该包的子模块。包可以嵌套，形成多级层级结构，就像文件系统的目录树。包让大量模块可以按功能分组组织，避免名称冲突，提升代码的可维护性。

Python 3.3 之后，没有 `__init__.py` 的目录也能作为包使用，称为命名空间包。但常规项目仍建议使用带 `__init__.py` 的普通包，行为更明确、兼容性更好。本节讨论的都是普通包。

任务管理器组织成如下包结构。

```
task_project/
    __init__.py
    main.py
    models/
        __init__.py
        task.py
    ui/
        __init__.py
        display.py
        input.py
    utils/
        __init__.py
        date_util.py
        validator.py
```

`task_project` 是顶层包，`models`、`ui`、`utils` 是子包，每个子包内的 `.py` 文件是子模块。每个包含 `__init__.py` 的目录都是一个包。

## 5.7.2 \_\_init\_\_.py 的作用

`__init__.py` 文件标志一个目录是 Python 包。它的作用有几个方面：标识包的存在、在包被导入时执行初始化代码、控制 `from 包名 import *` 的行为、简化包的对外接口。

`__init__.py` 可以是空文件，只起到标识作用。也可以写入代码，这些代码在包被首次导入时执行。

```python
# task_project/models/__init__.py
from .task import Task

__all__ = ["Task"]
```

```python
# task_project/models/task.py
class Task:
    def __init__(self, title, priority=3):
        self.title = title
        self.priority = priority
```

当外部代码写 `from task_project.models import Task` 时，Python 先执行 `models/__init__.py`，其中 `from .task import Task` 把 `Task` 类导入到 `models` 包的命名空间。这样外部就能直接从 `models` 包导入 `Task`，而不必写更长的 `from task_project.models.task import Task`。`__init__.py` 起到了简化对外接口的作用。

## 5.7.3 包的层级结构与导入

包内的模块通过点号路径访问。导入子模块时，写出完整的包路径，如 `import task_project.models.task`。导入后用完整路径访问模块内容。

```python
import task_project.models.task

t = task_project.models.task.Task("写报告")
print(t.title)
```

完整路径写起来较长，通常用 `from...import` 直接导入需要的名称。

```python
from task_project.models.task import Task

t = Task("写报告")
```

`from task_project.models.task import Task` 直接把 `Task` 类导入当前命名空间，使用时无需前缀。包的层级结构让模块名不会冲突，即使两个子包都有 `task.py`，通过包路径也能区分。

## 5.7.4 绝对导入

绝对导入使用从项目根目录开始的完整包路径来导入模块。这是 Python 推荐的导入方式，路径清晰明确，能直观看出模块的位置。

```python
# task_project/ui/display.py
from task_project.models.task import Task
from task_project.utils.date_util import format_date

def show_task(task):
    print(f"[{task.priority}] {task.title} - {format_date()}")
```

`from task_project.models.task import Task` 是绝对导入，从顶层包 `task_project` 开始写出完整路径。绝对导入的好处是路径明确，无论当前模块在哪个位置，导入语句都一样。缺点是包层级很深时路径较长，且如果包被重命名，所有绝对导入都要修改。

## 5.7.5 相对导入

相对导入使用 `.` 和 `..` 前缀，相对于当前模块所在的包来导入。一个点 `.` 表示当前包，两个点 `..` 表示父包，三个点 `...` 表示祖父包。

```python
# task_project/ui/display.py
from . import input  # 导入同包下的 input 模块
from ..models.task import Task  # 导入上级包 models 下的 task 模块
from ..utils.date_util import format_date  # 导入上级包 utils 下的 date_util 模块
```

`from . import input` 中 `.` 表示当前包 `ui`，导入同级的 `input` 模块。`from ..models.task import Task` 中 `..` 表示父包 `task_project`，从中导入 `models.task`。相对导入让包内部的模块互相关联时不必写完整路径，包被重命名时导入语句也无需修改。

## 5.7.6 相对导入的限制

相对导入只能在包内部使用，不能用于顶层脚本（直接运行的 `.py` 文件）。顶层脚本的 `__package__` 为 `None`，相对导入会报错。这是相对导入最常见的使用障碍。

```python
# task_project/main.py 直接运行时
from .models.task import Task  # 报错：attempted relative import with no known parent package
```

如果直接用 `python main.py` 运行 `main.py`，其中的相对导入会失败。解决方法有两种：用 `python -m task_project.main` 以模块方式运行，让 Python 知道它属于 `task_project` 包；或者把可执行入口放在包外部，用绝对导入。

## 5.7.7 绝对导入与相对导入的选择

绝对导入和相对导入各有优劣。绝对导入路径清晰，IDE 跳转友好，是 Python 官方推荐的方式。相对导入在包内部使用时更简洁，包重命名时无需修改，但只限包内使用，且容易在层级深时点号过多导致难以理解。

一般建议优先使用绝对导入，特别是在包层级不深的项目中。包内部联系紧密的模块之间，如果包可能被重命名或移动，可以考虑相对导入。无论选择哪种，同一个项目内应保持一致，避免混用造成困惑。

## 5.7.8 \_\_init\_\_.py 控制包的接口

`__init__.py` 不仅能标识包，还能用来控制包的对外接口。通过在 `__init__.py` 中导入子模块的名称，可以让使用者直接从包名导入，而不必关心内部文件结构。

```python
# task_project/__init__.py
from .models.task import Task
from .ui.display import show_task

__all__ = ["Task", "show_task"]
```

有了这个 `__init__.py`，外部代码可以这样使用。

```python
from task_project import Task, show_task

t = Task("写报告")
show_task(t)
```

外部使用者只需 `from task_project import Task`，不必知道 `Task` 类定义在 `models/task.py` 中。包的内部结构可以自由调整，只要 `__init__.py` 的导出接口不变，外部代码就不受影响。这是封装实现细节的有效手段。

## 5.7.9 包的合理拆分

把项目拆分成包和子包时，应遵循高内聚低耦合的原则。高内聚指同一个包内的模块功能相关、互相协作密切。低耦合指不同包之间的依赖尽量少、接口尽量简单。

任务管理器按职责拆分：`models` 包放数据模型，`ui` 包放界面显示，`utils` 包放通用工具。这种拆分让每个包聚焦一个职责，包内模块互相依赖紧密，包间依赖较少且方向清晰。

```
task_project/
    models/          # 数据模型层，定义 Task 等数据结构
        __init__.py
        task.py
    ui/              # 界面层，负责显示和输入
        __init__.py
        display.py
        input.py
    utils/           # 工具层，提供通用辅助函数
        __init__.py
        date_util.py
        validator.py
    __init__.py
    main.py          # 程序入口
```

依赖方向应该是上层依赖下层：`ui` 依赖 `models` 和 `utils`，`models` 依赖 `utils`，`utils` 不依赖其他包。这种单向依赖避免了循环，让结构清晰。如果发现 `utils` 需要用到 `models` 的内容，说明职责划分有问题，应重新调整。

拆分粒度也要把握好。包太小（每个包只有一个模块）会增加目录层级和导入路径的复杂度，包太大（所有东西塞在一个包里）又失去了拆分的意义。通常按业务领域或功能层次来划分，每个包包含若干个紧密相关的模块。

::: tip 包设计的核心原则
高内聚低耦合是包设计的核心原则。让相关的代码聚在一起，让无关的代码分开。依赖方向保持单向，从高层到低层。包的对外接口通过 `__init__.py` 控制，隐藏内部实现细节。这些原则在项目规模增长时能显著降低维护成本。
:::

## 练习题

**练习 1** 假设有以下包结构，请写出在 `main.py` 中导入 `Task` 类的三种方式（绝对导入、相对导入、通过包的 `__init__.py`）。

```
task_project/
    __init__.py
    main.py
    models/
        __init__.py
        task.py      # 定义了 Task 类
```

::: details 参考答案
```python
# 方式一：绝对导入
from task_project.models.task import Task

# 方式二：相对导入（main.py 在 task_project 包内）
from .models.task import Task
# 注意：相对导入要求以模块方式运行 python -m task_project.main

# 方式三：通过 __init__.py 简化
# 先在 task_project/models/__init__.py 中写入：
#   from .task import Task
# 然后在 main.py 中：
from task_project.models import Task
```

方式一路径最明确，推荐使用。方式二适合包内部，但直接运行 `main.py` 会报错，需用 `python -m` 运行。方式三需要在 `models/__init__.py` 中先导出 `Task`，外部导入更简洁，是封装接口的常用做法。
:::

**练习 2** 以下代码在 `task_project/ui/display.py` 中使用了相对导入，但直接运行该文件时报错 `attempted relative import with no known parent package`。请说明原因并给出两种解决方法。

```python
# task_project/ui/display.py
from ..models.task import Task

def show(task):
    print(task.title)
```

::: details 参考答案
原因：直接运行 `python display.py` 时，Python 把 `display.py` 当作顶层脚本，其 `__package__` 为 `None`，相对导入无法确定父包，因此报错。相对导入只能用于包内部的模块，不能用于直接运行的脚本。

解决方法一：用模块方式运行，从项目根目录执行 `python -m task_project.ui.display`。这样 Python 知道 `display` 属于 `task_project.ui` 包，相对导入能正常工作。

解决方法二：改用绝对导入，相对导入改为 `from task_project.models.task import Task`。绝对导入不依赖 `__package__`，直接运行也能工作（前提是 `task_project` 在搜索路径中）。

实际项目中，通常不在子模块中放可执行代码，而是用一个独立的入口文件（如项目根目录的 `main.py`）来调用包内的功能，避免直接运行包内模块。
:::

**练习 3** 为 `task_project/utils` 包编写 `__init__.py`，使得外部可以直接 `from task_project.utils import format_date, validate_title` 导入这两个函数（假设它们分别定义在 `date_util.py` 和 `validator.py` 中）。

::: details 参考答案
```python
# task_project/utils/date_util.py
def format_date():
    from datetime import date
    return date.today().isoformat()
```

```python
# task_project/utils/validator.py
def validate_title(title):
    return bool(title and title.strip())
```

```python
# task_project/utils/__init__.py
from .date_util import format_date
from .validator import validate_title

__all__ = ["format_date", "validate_title"]
```

外部使用如下。

```python
from task_project.utils import format_date, validate_title

print(format_date())        # 2026-08-01（当前日期）
print(validate_title("写报告"))  # True
print(validate_title(""))       # False
```

`__init__.py` 中用相对导入把子模块的函数引入包命名空间，外部就能直接从 `utils` 包导入。`__all__` 进一步明确了公开接口。这样 `utils` 内部文件结构的调整不影响外部导入语句。
:::

**练习 4** 一个任务管理器项目有以下依赖关系：`ui` 模块需要用 `models` 的 `Task` 类和 `utils` 的格式化函数，`models` 需要用 `utils` 的校验函数，`utils` 不依赖其他模块。请画出依赖方向，并说明这种设计是否符合高内聚低耦合原则。

::: details 参考答案
依赖方向如下。

```
ui  -->  models  -->  utils
 \------------------^
```

`ui` 依赖 `models` 和 `utils`，`models` 依赖 `utils`，`utils` 不依赖任何其他包。箭头方向从高层指向低层，形成单向依赖，没有循环。

这种设计符合高内聚低耦合原则。高内聚体现在每个包职责单一：`models` 专注数据模型，`ui` 专注界面展示，`utils` 专注通用工具。低耦合体现在包间依赖方向单一，`utils` 作为最底层不依赖任何包，可以被任意上层使用；`models` 只依赖 `utils`；`ui` 依赖前两者。如果 `utils` 试图依赖 `models`，就形成了循环依赖，违背了原则。

对应的包结构如下。

```
task_project/
    models/
        task.py   # 依赖 utils.validator
    ui/
        display.py  # 依赖 models.Task 和 utils.format_date
    utils/
        validator.py
        date_util.py
```

这种分层结构在中小型项目中很常见，扩展时只需在对应层级添加模块，不会打乱整体依赖关系。
:::

## 常见错误

**错误 1 · `ImportError: attempted relative import with no known parent package`**

原因：直接用 `python task_project/ui/display.py` 运行包内模块，此时该模块的 `__package__` 为 `None`，相对导入无法确定父包。

解决：改用 `python -m task_project.ui.display` 从项目根目录以模块方式运行，让 Python 知道该模块所属的包；或把相对导入改为绝对导入。

**错误 2 · `ModuleNotFoundError: No module named 'task_project'`**

原因：包目录不在 `sys.path` 搜索路径中。常见于执行目录不是项目根目录，或包没有正确安装到 Python 环境中。

解决：从项目根目录运行程序，让顶层包在搜索路径中可见。或设置 `PYTHONPATH` 指向项目根目录。把包安装到 site-packages 中是更规范的做法。

**错误 3 · 包目录缺少 `__init__.py` 导致导入异常**

现象：包内模块的相对导入、`from 包名 import 名称` 等行为不符合预期，或包被识别为命名空间包而非普通包。

原因：目录下没有 `__init__.py` 文件。Python 3.3 之后虽然支持命名空间包，但行为与普通包有差异，`__init__.py` 中的初始化代码和接口导出也不会执行。

解决：在每个包目录下创建 `__init__.py`，可以是空文件，也可以写入初始化代码和 `__all__`、子模块导出等。

**错误 4 · 相对导入点号层级错误**

现象：`ImportError: attempted relative import beyond top-level package`。

原因：相对导入使用的 `..` 层数超过了顶层包。例如在 `task_project/ui/display.py` 中写 `...models.task`，三个点表示祖父包，但 `task_project` 已是顶层包，再往上就超出了范围。

解决：数清当前模块所在的包层级，相对导入的点号不超过顶层包。层级过深时改用绝对导入更清晰。
