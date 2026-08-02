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
