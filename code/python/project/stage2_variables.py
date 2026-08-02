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
