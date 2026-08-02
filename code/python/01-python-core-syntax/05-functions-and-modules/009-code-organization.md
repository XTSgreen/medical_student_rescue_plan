---
title: 5.9 代码组织与最佳实践
sidebar:
  order: 9
---
# 5.9 代码组织与最佳实践


学完函数和模块的各种语法后，面临的问题是怎么把它们用得好。同样实现一个任务管理器，有人写的代码清晰易改，有人写的代码牵一发而动全身。差别往往不在语法，而在组织方式。函数该写多长，参数该有几个，模块怎么拆分，文档怎么写，这些决策决定了代码的质量。本节把前面几节的内容串联起来，讨论函数和模块层面的最佳实践，并以任务管理器的最终版重构作为综合示例。

## 5.9.1 函数单一职责

一个函数应该只做一件事，做好这件事，别的不做。这就是单一职责原则。判断一个函数是否单一职责，一个简单的方法是看它能否用一句话描述功能。如果描述时出现并且，说明它可能做了不止一件事。

```python
# 不符合单一职责：又添加任务又显示又保存
def add_task_and_show_and_save(tasks, title, filename):
    tasks.append({"title": title})
    for i, t in enumerate(tasks, start=1):
        print(f"{i}. {t['title']}")
    with open(filename, "w") as f:
        for t in tasks:
            f.write(t["title"] + "\n")
```

这个函数同时做了添加任务、显示列表、保存文件三件事。如果只想添加不想显示，或者只想保存不想添加，都无法复用这个函数。正确的做法是拆成三个各司其职的函数。

```python
def add_task(tasks, title):
    """向任务列表添加一项任务。"""
    tasks.append({"title": title})
    return tasks[-1]

def show_tasks(tasks):
    """打印任务列表。"""
    for i, t in enumerate(tasks, start=1):
        print(f"{i}. {t['title']}")

def save_tasks(tasks, filename):
    """把任务列表保存到文件。"""
    with open(filename, "w") as f:
        for t in tasks:
            f.write(t["title"] + "\n")
```

拆分后每个函数只负责一件事，可以单独调用、单独测试、单独修改。需要组合使用时，在调用处把它们串起来即可。单一职责让函数更易理解、更易复用、更易测试。

## 5.9.2 函数长度控制

函数不宜过长。一个函数如果超过四五十行，通常说明它承担了太多逻辑，应该考虑拆分。短函数更容易理解，因为读者一次只需关注少量代码。短函数也更容易命名，因为功能单一能准确概括。

这并不是绝对的行数限制。有些函数逻辑天然集中，拆分反而增加跳转成本。判断标准是函数是否只做一件事、是否有清晰的层次。如果函数内有多个用空行分隔的逻辑块，每个块有不同目的，那就是拆分的信号。

```python
# 过长：一个函数处理输入、校验、添加、日志
def handle_user_input(tasks):
    user_input = input("请输入任务标题：")
    if not user_input.strip():
        print("标题不能为空")
        return
    if len(user_input) > 50:
        print("标题过长")
        return
    task = {"title": user_input, "priority": 3}
    tasks.append(task)
    print(f"已添加: {user_input}")
    with open("log.txt", "a") as f:
        f.write(f"添加任务: {user_input}\n")
```

可以拆分为输入获取、输入校验、添加任务、记录日志几个小函数，主函数只负责编排流程。每个小函数都很短，主函数读起来像步骤说明，整体清晰度大幅提升。

## 5.9.3 参数数量控制

函数参数不宜过多。参数越多，调用时越容易出错，可读性也越差。一般建议参数不超过三四个，超过时应考虑重构。常见的重构方式是把多个相关参数封装成一个数据结构（字典或对象），或把函数拆分为多个小函数。

```python
# 参数过多
def create_task(title, priority, deadline, tag, category, status, assignee):
    task = {
        "title": title,
        "priority": priority,
        "deadline": deadline,
        "tag": tag,
        "category": category,
        "status": status,
        "assignee": assignee,
    }
    return task
```

七个参数调用起来很容易搞混顺序。如果大多数参数是可选的，可以用 `**kwargs` 或数据类来组织。

```python
def create_task(title, priority=3, **extra):
    """创建任务，title 必填，其余字段通过关键字参数传入。"""
    task = {"title": title, "priority": priority}
    task.update(extra)
    return task

task = create_task("写报告", priority=1, deadline="周五", tag="紧急")
```

把可选字段放进 `**extra`，调用时用关键字参数传入，既减少了必填参数数量，又保持了灵活性。

## 5.9.4 命名规范

好的命名让代码自解释，减少对注释的依赖。函数名应该用动词开头，描述它做什么，如 `add_task`、`show_tasks`、`save_tasks`。变量名应该描述它存什么，如 `tasks`、`task_count`、`urgent_tasks`。遵循 PEP 8 规范，函数和变量用小写加下划线，类名用驼峰式。

```python
# 好的命名
def find_urgent_tasks(tasks):
    high_priority = [t for t in tasks if t["priority"] <= 2]
    return high_priority

# 差的命名
def func(data):
    result = [x for x in data if x["p"] <= 2]
    return result
```

命名要有意义且一致。同一个概念在项目中应使用同一个词，比如任务列表统一叫 `tasks`，不要有的地方叫 `tasks` 有的地方叫 `items` 有的地方叫 `list`。命名是代码可读性的基础，值得花时间斟酌。

## 5.9.5 模块高内聚低耦合

模块层面同样遵循高内聚低耦合原则。高内聚指模块内所有代码围绕同一个主题，功能相关。低耦合指模块之间依赖少、接口简单。一个模块不应什么都做，也不应与太多其他模块纠缠。

任务管理器按职责划分模块：`task_manager` 模块专注任务数据操作，`ui` 模块专注界面显示，`storage` 模块专注文件读写。每个模块内聚于自己的职责，模块间通过明确的函数接口交互。`ui` 调用 `task_manager` 的函数获取数据再显示，`task_manager` 不知道 `ui` 的存在，这样修改界面不会影响数据逻辑。

衡量耦合度的一个方法是看修改一个模块时需要同时改动多少其他模块。如果改一个模块的内部实现会导致多个模块跟着改，说明耦合过高，应该重新设计接口。

## 5.9.6 将可执行代码放入 if \_\_name\_\_ == "\_\_main\_\_":

模块顶层的可执行代码（不只是定义）应该放入 `if __name__ == "__main__":` 块中保护起来。模块顶层只保留定义（函数、类、常量）和必要的导入，确保导入模块时不会有副作用。

```python
# task_manager.py

# 顶层常量
DEFAULT_PRIORITY = 3

# 顶层定义
def add_task(tasks, title, priority=DEFAULT_PRIORITY):
    tasks.append({"title": title, "priority": priority})

# 受保护的可执行代码
if __name__ == "__main__":
    tasks = []
    add_task(tasks, "测试任务")
    print(tasks)
```

直接运行时执行测试代码，被导入时只暴露 `DEFAULT_PRIORITY` 和 `add_task`。这一习惯让模块可以安全地被其他代码导入，是 Python 项目的通用规范。

## 5.9.7 docstring 格式

文档字符串是 Python 代码文档化的主要方式。函数的文档字符串放在函数体第一行，用三引号包裹。一个完整的文档字符串通常包含功能简述、参数说明、返回值说明，复杂函数还可以加上异常说明和示例。

```python
def search_tasks(tasks, keyword, priority=None):
    """在任务列表中搜索包含关键词的任务。

    参数:
        tasks: 任务列表，每个任务是字典。
        keyword: 搜索关键词，匹配任务的 title 字段。
        priority: 可选，按优先级过滤，为 None 时不限制。

    返回:
        匹配的任务列表。

    示例:
        >>> search_tasks([{"title": "写报告"}], "写")
        [{'title': '写报告'}]
    """
    results = []
    for task in tasks:
        if keyword in task.get("title", ""):
            if priority is None or task.get("priority") == priority:
                results.append(task)
    return results
```

文档字符串的格式有几种常见约定，如 Sphinx 风格、Google 风格、NumPy 风格，区别主要在参数和返回值的标注方式。项目内应统一一种风格。关键是把函数的行为、参数含义、返回值说清楚，让使用者不必读实现就能正确调用。

模块也应写文档字符串，放在文件开头，说明模块的整体职责和主要接口。

```python
"""任务管理模块。

提供任务的增删改查和过滤功能。
主要接口：add_task、remove_task、search_tasks。
"""
```

## 5.9.8 避免 from module import *

前面已经讲过 `from module import *` 的危害：污染命名空间、覆盖已有名称、无法追踪名称来源。在正式项目中应完全避免这种写法，改用 `import 模块名` 或 `from 模块名 import 具体名称`。

```python
# 禁止
from task_manager import *

# 推荐
import task_manager

# 也可接受
from task_manager import add_task, remove_task
```

如果需要在模块中明确公开接口，使用 `__all__` 变量，而不是依赖 `import *`。`__all__` 既是接口文档，也能配合静态检查工具使用。

## 5.9.9 测试模块命名规范

测试文件应遵循统一的命名规范，便于测试工具自动发现。Python 社区约定测试文件以 `test_` 开头，如 `test_task_manager.py`，测试函数也以 `test_` 开头，如 `test_add_task`。这样 `pytest` 等测试框架能自动找到并执行它们。

```python
# test_task_manager.py
from task_manager import add_task

def test_add_task():
    tasks = []
    add_task(tasks, "写报告", priority=1)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "写报告"
    assert tasks[0]["priority"] == 1

def test_add_task_default_priority():
    tasks = []
    add_task(tasks, "开会")
    assert tasks[0]["priority"] == 3
```

测试文件与被测模块放在同一目录或单独的 `tests` 目录中。命名规范让测试代码井然有序，也方便持续集成工具自动运行测试。

## 5.9.10 任务管理器最终版重构

把前面的原则综合运用，对任务管理器进行重构。重构后的结构如下。

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
    storage/
        __init__.py
        file_storage.py
    tests/
        test_task.py
```

每个模块职责单一、接口清晰。

```python
# models/task.py
"""任务数据模型。"""

DEFAULT_PRIORITY = 3

def create_task(title, priority=DEFAULT_PRIORITY):
    """创建一个任务字典。

    参数:
        title: 任务标题。
        priority: 优先级，数字越小越紧急，默认 3。

    返回:
        任务字典。
    """
    return {"title": title, "priority": priority, "done": False}

def mark_done(task):
    """将任务标记为已完成。"""
    task["done"] = True
    return task
```

```python
# storage/file_storage.py
"""文件存储模块。"""

def save_tasks(tasks, filename):
    """把任务列表保存到文件。

    参数:
        tasks: 任务列表。
        filename: 目标文件路径。
    """
    with open(filename, "w", encoding="utf-8") as f:
        for task in tasks:
            f.write(f"{task['title']},{task['priority']},{task['done']}\n")

def load_tasks(filename):
    """从文件加载任务列表。

    参数:
        filename: 源文件路径。

    返回:
        任务列表。
    """
    tasks = []
    try:
        with open(filename, "r", encoding="utf-8") as f:
            for line in f:
                title, priority, done = line.strip().split(",")
                tasks.append({
                    "title": title,
                    "priority": int(priority),
                    "done": done == "True",
                })
    except FileNotFoundError:
        return []
    return tasks
```

```python
# ui/display.py
"""界面显示模块。"""

from task_project.models.task import create_task

def show_tasks(tasks):
    """打印任务列表，标注完成状态。"""
    if not tasks:
        print("暂无任务")
        return
    for i, task in enumerate(tasks, start=1):
        status = "完成" if task["done"] else "待办"
        print(f"{i}. [{status}] (优先级{task['priority']}) {task['title']}")

def show_menu():
    """打印操作菜单。"""
    print("1. 查看任务")
    print("2. 添加任务")
    print("3. 标记完成")
    print("4. 保存")
    print("5. 退出")
```

```python
# main.py
"""任务管理器入口。"""

from task_project.models.task import create_task, mark_done
from task_project.ui.display import show_tasks, show_menu
from task_project.storage.file_storage import save_tasks, load_tasks

def run():
    """启动任务管理器主循环。"""
    tasks = load_tasks("tasks.csv")
    while True:
        show_menu()
        choice = input("请选择操作: ")
        if choice == "1":
            show_tasks(tasks)
        elif choice == "2":
            title = input("任务标题: ")
            tasks.append(create_task(title))
            show_tasks(tasks)
        elif choice == "3":
            show_tasks(tasks)
            index = int(input("要标记的任务编号: ")) - 1
            if 0 <= index < len(tasks):
                mark_done(tasks[index])
        elif choice == "4":
            save_tasks(tasks, "tasks.csv")
            print("已保存")
        elif choice == "5":
            print("再见")
            break

if __name__ == "__main__":
    run()
```

```python
# tests/test_task.py
"""任务模型测试。"""

from task_project.models.task import create_task, mark_done, DEFAULT_PRIORITY

def test_create_task():
    task = create_task("写报告", priority=1)
    assert task["title"] == "写报告"
    assert task["priority"] == 1
    assert task["done"] is False

def test_create_task_default():
    task = create_task("开会")
    assert task["priority"] == DEFAULT_PRIORITY

def test_mark_done():
    task = create_task("回邮件")
    mark_done(task)
    assert task["done"] is True
```

这个重构版本体现了本节讨论的各项实践。函数单一职责，每个函数只做一件事。函数都不长，参数也不多。命名清晰一致，动词开头的函数名描述行为。模块高内聚低耦合，`models` 不依赖 `ui`，`storage` 不依赖 `ui`，依赖方向单向。可执行代码放入 `if __name__ == "__main__":`，模块可以安全导入。每个函数和模块都有文档字符串。导入用绝对路径，没有 `import *`。测试文件以 `test_` 开头，测试函数也以 `test_` 开头，便于测试框架发现。

这些实践属于经验总结，而非教条。在小项目中可能觉得多余，但随着代码量增长，遵循这些原则的项目维护成本会显著低于随意编写的项目。把它们养成习惯，是成长为合格 Python 开发者的必经之路。

## 练习题

**练习 1** 以下函数违反了单一职责原则，它同时做了输入获取、校验、添加、显示四件事。请将其拆分为四个单一职责的函数，并写一个主函数负责编排。

```python
def add_and_display(tasks):
    title = input("请输入标题: ")
    if not title.strip():
        print("标题不能为空")
        return
    tasks.append({"title": title})
    for i, t in enumerate(tasks, start=1):
        print(f"{i}. {t['title']}")
```

::: details 参考答案
```python
def get_input(prompt):
    """获取用户输入。"""
    return input(prompt)

def validate_title(title):
    """校验任务标题，返回是否有效。"""
    return bool(title and title.strip())

def add_task(tasks, title):
    """添加任务到列表。"""
    tasks.append({"title": title})

def show_tasks(tasks):
    """显示任务列表。"""
    for i, t in enumerate(tasks, start=1):
        print(f"{i}. {t['title']}")

def add_and_display(tasks):
    """主流程：获取输入、校验、添加、显示。"""
    title = get_input("请输入标题: ")
    if not validate_title(title):
        print("标题不能为空")
        return
    add_task(tasks, title)
    show_tasks(tasks)
```

拆分后每个小函数只做一件事，可以单独测试和复用。主函数 `add_and_display` 负责编排流程，读起来像步骤说明。如果以后要修改校验规则，只需改 `validate_title`，不影响其他函数。
:::

**练习 2** 为以下函数编写符合规范的文档字符串，包含功能描述、参数说明、返回值说明。

```python
def filter_tasks(tasks, max_priority):
    result = []
    for task in tasks:
        if task["priority"] <= max_priority:
            result.append(task)
    return result
```

::: details 参考答案
```python
def filter_tasks(tasks, max_priority):
    """筛选优先级不超过指定值的任务。

    参数:
        tasks: 任务列表，每个任务是包含 priority 字段的字典。
        max_priority: 优先级上限，只保留 priority 小于等于此值的任务。

    返回:
        符合条件的任务列表，按原顺序排列。

    示例:
        >>> tasks = [{"title": "A", "priority": 1}, {"title": "B", "priority": 3}]
        >>> filter_tasks(tasks, 2)
        [{'title': 'A', 'priority': 1}]
    """
    result = []
    for task in tasks:
        if task["priority"] <= max_priority:
            result.append(task)
    return result
```

文档字符串包含功能简述、参数说明（每个参数的含义和类型）、返回值说明、使用示例。示例用 `>>>` 标注，与 `doctest` 兼容，既能作为文档又能作为可执行测试。保持项目内文档字符串风格一致，是提升代码可维护性的重要细节。
:::

**练习 3** 指出以下代码中不符合最佳实践的地方，并说明如何改进。

```python
# task.py
from storage import *
from ui import *

def process(tasks, t, p, d):
    s = input("输入: ")
    if s:
        tasks.append({"title": s, "p": p, "d": d})
    save(tasks)
    display(tasks)

run()
```

::: details 参考答案
存在以下问题。

第一，使用了 `from storage import *` 和 `from ui import *`，污染命名空间，无法追踪 `save` 和 `display` 来自哪里。应改为 `import storage` 或 `from storage import save`。

第二，函数名 `process` 过于笼统，不能反映功能。参数名 `t`、`p`、`d` 是单字母，无法看出含义。应改为有意义的名字，如 `add_and_show`、`title`、`priority`、`deadline`。

第三，`tasks.append` 中用 `"p"` 和 `"d"` 作为键，与代码其他地方可能不一致。应统一用 `"priority"`、`"deadline"` 等完整词。

第四，顶层直接调用了 `run()`，没有 `if __name__ == "__main__":` 保护。导入该模块时会执行 `run()`，产生副作用。

第五，函数同时做了输入、添加、保存、显示多件事，违反单一职责。

改进后的代码。

```python
# task.py
"""任务处理模块。"""

from storage import save_tasks
from ui import display_tasks

def add_task(tasks, title, priority, deadline):
    """添加任务并保存。"""
    tasks.append({
        "title": title,
        "priority": priority,
        "deadline": deadline,
    })
    save_tasks(tasks)
    display_tasks(tasks)

def run():
    """主流程。"""
    tasks = []
    title = input("请输入标题: ")
    if title:
        add_task(tasks, title, priority=3, deadline=None)

if __name__ == "__main__":
    run()
```
:::

**练习 4** 为 `create_task` 函数编写测试文件 `test_task.py`，包含至少两个测试函数，分别测试默认优先级和自定义优先级的情况。测试函数命名以 `test_` 开头，使用 `assert` 断言。

```python
def create_task(title, priority=3):
    return {"title": title, "priority": priority, "done": False}
```

::: details 参考答案
```python
# test_task.py
"""create_task 函数的测试。"""

from task import create_task

def test_create_task_default_priority():
    """测试使用默认优先级创建任务。"""
    task = create_task("写报告")
    assert task["title"] == "写报告"
    assert task["priority"] == 3
    assert task["done"] is False

def test_create_task_custom_priority():
    """测试使用自定义优先级创建任务。"""
    task = create_task("开会", priority=1)
    assert task["title"] == "开会"
    assert task["priority"] == 1
    assert task["done"] is False

def test_create_task_priority_zero():
    """测试优先级为 0 的边界情况。"""
    task = create_task("紧急", priority=0)
    assert task["priority"] == 0
```

测试文件以 `test_` 开头，测试函数也以 `test_` 开头，符合 `pytest` 的命名约定，能被自动发现。每个测试函数用 `assert` 断言期望结果，断言失败时测试框架会报告具体哪个断言出错。测试覆盖了默认值、自定义值、边界值三种情况，保证函数在各种输入下行为正确。

运行测试只需在项目目录执行 `pytest test_task.py`，测试框架会自动找到所有 `test_` 开头的函数并执行。
:::

## 常见错误

**错误 1 · 函数参数过多导致调用顺序混淆**

现象：调用 `create_task(title, priority, deadline, tag, status, assignee)` 时传错位置，把 `deadline` 传给了 `priority`。

原因：参数超过三四个后，位置参数的语义难以一眼分辨，调用方需要频繁回查函数定义。

解决：把可选字段用 `**kwargs` 或数据类封装，必填参数保持少数几个。调用时一律用关键字参数 `create_task("写报告", priority=1, deadline="周五")`，避免依赖位置顺序。

**错误 2 · `from module import *` 导致名称被静默覆盖**

现象：当前模块定义的 `tasks` 列表被导入语句覆盖，运行时数据异常且无报错。

原因：`from module import *` 把目标模块所有公开名称导入当前命名空间，同名的本地变量被覆盖且无任何提示。

解决：完全避免 `import *`，改用 `import module` 带前缀访问，或 `from module import name` 只导入需要的名称。需要公开接口时用 `__all__` 显式声明。

**错误 3 · 模块顶层直接调用函数，导入时产生副作用**

现象：`import task_manager` 时自动执行了 `input()`、文件写入或网络请求，调用方未主动调用任何函数。

原因：模块顶层写了可执行代码（如 `run()`），没有用 `if __name__ == "__main__":` 保护。

解决：把可执行代码移入 `if __name__ == "__main__":` 块或封装到入口函数中。模块顶层只保留定义、常量和导入语句。

**错误 4 · 函数职责过多导致难以测试和复用**

现象：一个函数同时做输入、校验、业务处理、保存、显示，测试时无法只跑业务逻辑而不触发输入和文件写入。

原因：违反单一职责原则，多个不相关的逻辑耦合在一个函数内。

解决：按职责拆分为多个小函数，每个只做一件事。主函数负责编排流程，把各步骤串起来。拆分后每个小函数可单独测试和复用。
