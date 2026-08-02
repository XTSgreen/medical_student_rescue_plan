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
