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
