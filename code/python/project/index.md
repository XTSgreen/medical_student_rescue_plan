a

---
title: 实战项目：命令行任务管理器
layout: doc
aside: false
---
# 实战项目：命令行任务管理器

本教程配备一个贯穿全部章节的渐进式项目：**命令行任务管理器（Task Manager）**。读者跟随每章知识点的学习，逐步把这个项目从最简单的打印脚本演变为支持增删改查、文件持久化和模块化结构的完整程序。每一阶段的代码都可独立运行，对应一个具体的语法知识点，帮助把抽象概念落地为可运行的代码。

项目演进路线与对应章节如下：

**第1章（开发环境）**：搭建环境，写出第一个 Python 脚本
**第2章（语法与数据类型）**：用变量和字符串存储单条任务信息
**第3章（控制结构）**：实现菜单交互、条件判断、循环操作
**第4章（组合数据类型）**：用列表存储多条任务，用字典存储任务详情
**第5章（函数与模块化）**：将代码拆分为函数和模块
**第6章（文件与异常处理）**：将任务保存到文件，处理各种异常

## Stage 1：最简单的开始

第一个版本只做一件事：用变量存储一条任务信息并打印出来。对应第 1 章和第 2 章的变量知识点。

```python
"""任务管理器 v1：最简单的开始"""
print("=== 任务管理器 ===")
print()

# 用变量存储一条任务
task_title = "学习 Python 基础语法"
task_done = False

print(f"当前任务：{task_title}")
print(f"完成状态：{'已完成' if task_done else '未完成'}")
```

运行后输出：

```
=== 任务管理器 ===

当前任务：学习 Python 基础语法
完成状态：未完成
```

## Stage 2：用数据类型存储任务信息

第二个版本引入多种数据类型：字符串存储标题、整数存储优先级、浮点数存储耗时、布尔值存储完成状态。对应第 2 章的数据类型知识点。

```python
"""任务管理器 v2：用变量和数据类型存储任务信息"""
print("=== 任务管理器 v2 ===")
print()

# 基本数据类型
task_title = "完成 Python 练习"        # 字符串
task_priority = 3                      # 整数（1-5，5最高）
task_time = 2.5                        # 浮点数（预计小时数）
task_done = False                      # 布尔值
task_tags = "python,练习,基础"         # 字符串

# 格式化输出
print(f"任务：{task_title}")
print(f"优先级：{'★' * task_priority}（{task_priority}/5）")
print(f"预计耗时：{task_time} 小时")
print(f"状态：{'✓ 已完成' if task_done else '○ 未完成'}")
print(f"标签：{task_tags.split(',')}")  # 用 split 分割字符串
```

## Stage 3：加入菜单和循环控制

第三个版本引入 while 循环和 if-elif 分支，实现菜单交互。用户可以查看、添加、删除任务。对应第 3 章的控制结构知识点。

```python
"""任务管理器 v3：加入菜单和循环控制"""
tasks = ["学习 Python", "写练习题", "复习笔记"]

while True:
    print("\n=== 任务管理器 v3 ===")
    print("1. 查看所有任务")
    print("2. 添加任务")
    print("3. 删除任务")
    print("0. 退出")

    choice = input("请选择操作：")

    if choice == "1":
        if not tasks:
            print("任务列表为空")
        else:
            for i, task in enumerate(tasks, 1):
                print(f"  {i}. {task}")
    elif choice == "2":
        task = input("输入新任务：")
        if task.strip():
            tasks.append(task.strip())
            print(f"已添加：{task.strip()}")
        else:
            print("任务不能为空")
    elif choice == "3":
        if not tasks:
            print("任务列表为空")
            continue
        for i, task in enumerate(tasks, 1):
            print(f"  {i}. {task}")
        try:
            idx = int(input("输入要删除的编号："))
            if 1 <= idx <= len(tasks):
                removed = tasks.pop(idx - 1)
                print(f"已删除：{removed}")
            else:
                print("编号超出范围")
        except ValueError:
            print("请输入有效数字")
    elif choice == "0":
        print("再见！")
        break
    else:
        print("无效选择，请重新输入")
```

## Stage 4：用字典和列表管理结构化任务

第四个版本把每条任务从简单字符串升级为字典，包含标题、优先级、完成状态和标签。用列表存储所有任务，用集合存储标签。对应第 4 章的组合数据类型知识点。

```python
"""任务管理器 v4：用字典和列表管理结构化任务"""
tasks = [
    {"title": "学习 Python", "priority": 5, "done": False, "tags": {"学习", "编程"}},
    {"title": "买牛奶", "priority": 2, "done": True, "tags": {"生活"}},
]


def show_tasks(tasks):
    if not tasks:
        print("  （空）")
        return
    for i, t in enumerate(tasks, 1):
        status = "✓" if t["done"] else "○"
        stars = "★" * t["priority"]
        tags_str = ", ".join(t["tags"]) if t["tags"] else ""
        print(f"  {i}. [{status}] {t['title']} ({stars}) #{tags_str}")


def add_task(tasks):
    title = input("任务标题：").strip()
    if not title:
        print("标题不能为空")
        return
    try:
        priority = int(input("优先级 (1-5)："))
        priority = max(1, min(5, priority))
    except ValueError:
        priority = 3
    tags_input = input("标签（逗号分隔）：").strip()
    tags = {t.strip() for t in tags_input.split(",") if t.strip()} if tags_input else set()
    tasks.append({"title": title, "priority": priority, "done": False, "tags": tags})
    print(f"已添加：{title}")


while True:
    print("\n=== 任务管理器 v4 ===")
    print("1. 查看任务  2. 添加  3. 完成  4. 按标签筛选  0. 退出")
    choice = input("请选择：")

    if choice == "1":
        show_tasks(tasks)
    elif choice == "2":
        add_task(tasks)
    elif choice == "3":
        show_tasks(tasks)
        try:
            idx = int(input("完成第几项：")) - 1
            if 0 <= idx < len(tasks):
                tasks[idx]["done"] = True
                print(f"已标记完成：{tasks[idx]['title']}")
        except (ValueError, IndexError):
            print("无效编号")
    elif choice == "4":
        tag = input("输入标签：").strip()
        filtered = [t for t in tasks if tag in t["tags"]]
        print(f"标签 '{tag}' 下的任务：")
        show_tasks(filtered)
    elif choice == "0":
        break
```

## Stage 5：函数化重构

第五个版本把菜单逻辑拆分到独立函数中，引入 `main()` 入口函数和 `if __name__ == "__main__":` 守卫。对应第 5 章的函数与模块化知识点。

```python
"""任务管理器 v5：函数化重构"""


def init_tasks():
    return [
        {"title": "学习 Python", "priority": 5, "done": False, "tags": {"学习", "编程"}},
        {"title": "买牛奶", "priority": 2, "done": True, "tags": {"生活"}},
    ]


def show_tasks(tasks):
    if not tasks:
        print("  （空）")
        return
    for i, t in enumerate(tasks, 1):
        status = "✓" if t["done"] else "○"
        stars = "★" * t["priority"]
        tags_str = ", ".join(t["tags"]) if t["tags"] else ""
        print(f"  {i}. [{status}] {t['title']} ({stars}) #{tags_str}")


def add_task(tasks):
    title = input("任务标题：").strip()
    if not title:
        print("标题不能为空")
        return
    try:
        priority = int(input("优先级 (1-5)："))
        priority = max(1, min(5, priority))
    except ValueError:
        priority = 3
    tags_input = input("标签（逗号分隔）：").strip()
    tags = {t.strip() for t in tags_input.split(",") if t.strip()} if tags_input else set()
    tasks.append({"title": title, "priority": priority, "done": False, "tags": tags})
    print(f"已添加：{title}")


def complete_task(tasks):
    show_tasks(tasks)
    try:
        idx = int(input("完成第几项：")) - 1
        if 0 <= idx < len(tasks):
            tasks[idx]["done"] = True
            print(f"已标记完成：{tasks[idx]['title']}")
        else:
            print("编号超出范围")
    except ValueError:
        print("请输入数字")


def filter_by_tag(tasks):
    tag = input("输入标签：").strip()
    filtered = [t for t in tasks if tag in t["tags"]]
    print(f"标签 '{tag}' 下的任务：")
    show_tasks(filtered)


def main():
    tasks = init_tasks()
    actions = {
        "1": lambda: show_tasks(tasks),
        "2": lambda: add_task(tasks),
        "3": lambda: complete_task(tasks),
        "4": lambda: filter_by_tag(tasks),
    }
    while True:
        print("\n=== 任务管理器 v5 ===")
        print("1.查看  2.添加  3.完成  4.标签筛选  0.退出")
        choice = input("请选择：")
        if choice == "0":
            print("再见！")
            break
        action = actions.get(choice)
        if action:
            action()
        else:
            print("无效选择")


if __name__ == "__main__":
    main()
```

## Stage 6：文件持久化与异常处理

第六个版本加入 JSON 文件读写，程序退出时自动保存任务，启动时自动加载。全程用 try-except 处理文件不存在、编码错误、JSON 解析失败等异常。对应第 6 章的文件与异常处理知识点。

```python
"""任务管理器 v6：文件持久化与异常处理"""
import json
import os

DATA_FILE = "tasks.json"


def load_tasks():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"警告：读取数据失败 ({e})，将使用空列表")
        return []


def save_tasks(tasks):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(tasks, f, ensure_ascii=False, indent=2)
        print(f"已保存 {len(tasks)} 条任务到 {DATA_FILE}")
    except OSError as e:
        print(f"保存失败：{e}")


def show_tasks(tasks):
    if not tasks:
        print("  （空）")
        return
    for i, t in enumerate(tasks, 1):
        status = "✓" if t["done"] else "○"
        stars = "★" * t["priority"]
        tags_str = ", ".join(t["tags"]) if t["tags"] else ""
        print(f"  {i}. [{status}] {t['title']} ({stars}) #{tags_str}")


def add_task(tasks):
    title = input("任务标题：").strip()
    if not title:
        print("标题不能为空")
        return
    try:
        priority = int(input("优先级 (1-5)："))
        priority = max(1, min(5, priority))
    except ValueError:
        priority = 3
    tags_input = input("标签（逗号分隔）：").strip()
    tags = {t.strip() for t in tags_input.split(",") if t.strip()} if tags_input else set()
    tasks.append({"title": title, "priority": priority, "done": False, "tags": list(tags)})
    print(f"已添加：{title}")


def complete_task(tasks):
    show_tasks(tasks)
    try:
        idx = int(input("完成第几项：")) - 1
        if 0 <= idx < len(tasks):
            tasks[idx]["done"] = True
            print(f"已标记完成：{tasks[idx]['title']}")
        else:
            print("编号超出范围")
    except ValueError:
        print("请输入数字")


def filter_by_tag(tasks):
    tag = input("输入标签：").strip()
    filtered = [t for t in tasks if tag in t.get("tags", [])]
    print(f"标签 '{tag}' 下的任务：")
    show_tasks(filtered)


def main():
    tasks = load_tasks()
    actions = {
        "1": lambda: show_tasks(tasks),
        "2": lambda: add_task(tasks),
        "3": lambda: complete_task(tasks),
        "4": lambda: filter_by_tag(tasks),
    }
    while True:
        print(f"\n=== 任务管理器 v6（{len(tasks)} 条任务）===")
        print("1.查看  2.添加  3.完成  4.标签筛选  5.保存  0.退出")
        choice = input("请选择：")
        if choice == "0":
            save_tasks(tasks)
            print("再见！")
            break
        action = actions.get(choice)
        if action:
            action()
        elif choice == "5":
            save_tasks(tasks)
        else:
            print("无效选择")


if __name__ == "__main__":
    main()
```
