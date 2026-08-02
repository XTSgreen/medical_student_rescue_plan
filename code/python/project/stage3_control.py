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
