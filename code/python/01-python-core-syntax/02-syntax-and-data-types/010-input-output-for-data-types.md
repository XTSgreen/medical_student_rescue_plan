---
title: 2.10 输入输出与基本交互
sidebar:
  order: 10
---
# 2.10 输入输出与基本交互

<span class="chapter-tag">Python核心语法基础</span>

程序的价值在于与外部世界交互。输入从用户或文件流入程序，输出从程序流向屏幕或文件。Python 提供了简洁的 `print()` 和 `input()` 两个函数完成基本的控制台交互，足以支撑大多数数据处理脚本的原型开发。本节从这两个函数出发，覆盖多对象输出、格式化、字符串读取、类型转换、自定义对象打印、文件输出等场景，最后用一个完整的用户信息录入程序把所有知识点串起来。

## 2.10.1 print() 输出多个对象

`print()` 可以同时输出多个对象，默认用空格分隔，末尾自动换行。这两个行为可以通过 `sep` 和 `end` 参数自定义。

```python
# 默认用空格分隔
print("用户名:", "张三", "年龄:", 45)
# 输出：用户名: 张三 年龄: 45

# 用 sep 自定义分隔符
print("2024", "01", "15", sep="-")
# 输出：2024-01-15

# 用空字符串连成一片
print("得分", "120", "分", sep="")
# 输出：得分120分

# 多个值拼成 CSV 行
print("U001", "张三", "45", "男", sep=",")
# 输出：U001,张三,45,男
```

`sep` 参数对生成结构化文本特别有用。处理结构化数据时，把字段用逗号或制表符分隔输出，就得到了 CSV 或 TSV 格式的雏形。

`end` 参数控制每次 `print()` 结束后追加什么字符，默认是换行符 `\n`。改成空字符串可以让多次 `print()` 在同一行输出，下一节会专门讨论换行控制。

## 2.10.2 print() 格式化输出

Python 有三种字符串格式化方式，推荐使用 **f-string**（Python 3.6+），它简洁直观。需要兼容旧版本时用 `str.format()`，`%` 格式化仅在阅读老代码时需要识别。

### f-string

f-string 在字符串前加 `f` 或 `F`，用 `{}` 包裹表达式，表达式会被求值并插入字符串：

```python
name = "张三"
age = 45
score = 24.7

# 基本用法
print(f"用户 {name}，年龄 {age} 岁")
# 输出：用户 张三，年龄 45 岁

# 表达式可以直接写在花括号里
print(f"评分：{score:.1f}")
# 输出：评分：24.7

# 对齐与宽度
print(f"{name:>10}")       # 右对齐，宽度 10
print(f"{name:<10}")       # 左对齐
print(f"{name:^10}")       # 居中
print(f"{age:0>3}")        # 用 0 填充到 3 位：045

# 数值格式化
print(f"评分 {score:.2f}")       # 保留 2 位小数：24.70
print(f"百分比 {0.875:.1%}")       # 百分比：87.5%
print(f"科学计数 {1234567:.2e}")   # 1.23e+06
```

格式说明符的语法是 `:填充对齐宽度.精度类型`，其中 `>` 右对齐、`<` 左对齐、`^` 居中。`.2f` 表示保留两位小数，`.1%` 表示转成百分比保留一位小数。

### str.format()

`str.format()` 用 `{}` 作占位符，参数按顺序填入：

```python
print("{0} 用户 {1} 岁，评分 {2:.1f}".format(name, age, score))
# 张三 用户 45 岁，评分 24.7

# 也可以用关键字参数
print("{name} 的年龄是 {age}".format(name="李四", age=30))
```

f-string 在大多数场景下比 `format()` 更清晰，新代码应优先使用 f-string。

### 常用数值格式

```python
# 极小数值保留 3 位有效数字
ratio = 0.001234
print(f"比率 {ratio:.3e}")  # 1.234e-03

# 重量保留 1 位小数
weight = 65.437
print(f"重量 {weight:.1f} kg")  # 65.4 kg

# 极小概率用科学计数法
prob = 0.000034
print(f"概率 {prob:.2e}")  # 3.40e-05

# 大数字加千位分隔
population = 1400000000
print(f"人口 {population:,}")  # 1,400,000,000
```

## 2.10.3 input() 读取字符串

`input()` 从标准输入读取一行文本，返回的是**字符串**，无论用户输入的是什么。这是初学者最常踩的坑：用户输入 `45`，程序得到的是 `"45"` 这个字符串，不是整数 45。

```python
name = input("请输入用户名：")
print(f"您好，{name}")

age_str = input("请输入年龄：")
print(type(age_str))  # <class 'str'>
```

`input()` 的参数是提示语，会显示在用户输入之前。如果省略参数，则无提示。函数返回值总是去掉末尾换行符后的字符串，所以不会出现 `\n` 残留。

### 处理空输入与异常

用户可能直接回车不输入任何内容，或者输入了非预期字符。健壮的代码应该处理这些情况：

```python
raw = input("请输入年龄：")
if raw == "":
    print("未输入年龄")
else:
    age = int(raw)
    print(f"年龄为 {age} 岁")
```

更安全的做法是用 `try/except` 包裹转换，因为 `int(raw)` 在 `raw` 不是合法数字时会抛出 `ValueError`。这部分异常处理会在后续章节详细讨论，本节先关注输入输出的基本流程。

## 2.10.4 类型转换在 input() 后的典型用法

由于 `input()` 总是返回字符串，处理数字输入时必须显式转换。最常见的两种用法是 `int(input())` 和 `float(input())`，前者用于整数输入如年龄、房间号，后者用于浮点输入如温度、重量、价格。

```python
# 整数输入
age = int(input("年龄："))
room_no = int(input("房间号："))

# 浮点输入
temperature = float(input("温度（℃）："))
weight = float(input("重量（kg）："))
price = float(input("价格（元）："))

# 计算并输出
if temperature > 30:
    print(f"温度 {temperature}℃，温度偏高")
```

### 一次读入多个值

如果一行输入多个值（用空格或逗号分隔），需要先 `split()` 再逐个转换：

```python
# 输入格式：长 宽，例如 10 5
line = input("请输入长(cm)和宽(cm)，空格分隔：")
parts = line.split()
length = float(parts[0])
width = float(parts[1])
area = length * width
print(f"面积 = {area:.1f}")
```

`split()` 不带参数时按任意空白（包括多个空格、Tab）分割，并自动去除首尾空白，比按固定字符分割更宽容。如果用逗号分隔，写成 `line.split(",")`，但要注意用户可能输入 `"10, 5"` 带了空格，转换前应该 `strip()` 去掉空格。

```python
line = input("请输入姓名,年龄,性别（逗号分隔）：")
fields = [f.strip() for f in line.split(",")]
name, age, gender = fields
age = int(age)
print(f"录入：{name}, {age}岁, {gender}")
```

## 2.10.5 print() 对象的默认表示

`print()` 输出对象时，会调用对象的 `__str__` 方法获取字符串表示。如果对象没有定义 `__str__`，则回退到 `__repr__`，两者都没有时会显示类似 `<__main__.User object at 0x7f...>` 的默认表示，对调试毫无帮助。

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

u = User("张三", 45)
print(u)  # <__main__.User object at 0x7f8a3b2c4d60>
```

这种输出对开发者不友好，对用户更不友好。**自定义类应该实现 `__str__` 方法**，让 `print()` 能输出有意义的字符串：

```python
class User:
    def __init__(self, name, age, role):
        self.name = name
        self.age = age
        self.role = role

    def __str__(self):
        return f"[用户] {self.name}（{self.age}岁） 角色：{self.role}"

u = User("张三", 45, "管理员")
print(u)  # [用户] 张三（45岁） 角色：管理员
```

习惯上 `__str__` 返回简洁的人类可读文本，`__repr__` 返回能重建对象的精确表示。如果只实现一个，优先实现 `__repr__`，因为 `str()` 在找不到 `__str__` 时会回退到 `__repr__`，反过来则不行。这个细节和上一节 2.9.2 中讨论的 `repr()` 与 `str()` 区别是同一回事。

## 2.10.6 多个 print() 的换行控制

默认情况下每次 `print()` 都会在末尾追加换行符 `\n`，所以多次调用会产生多行输出。通过 `end` 参数可以改变这个行为，实现同行输出、自定义分隔、进度条等效果。

```python
# 默认每次换行
print("第一行")
print("第二行")
# 输出两行

# 用 end="" 让多次 print 在同一行
print("加载中", end="")
print(".", end="")
print(".", end="")
print(".", end="")
print("完成")
# 输出：加载中...完成

# 用其他字符结尾
print("项目", end=" -> ")
print("检查", end=" -> ")
print("完成")
# 输出：项目 -> 检查 -> 完成

# 实现简单的进度条
import time
for i in range(5):
    print(f"\r进度 {'#' * (i + 1)}{'.' * (4 - i)} {i + 1}/5", end="")
    time.sleep(0.5)
print(" 完成")
```

`\r` 是回车符，让光标回到行首但不换行，配合 `end=""` 可以原地刷新输出，这是命令行进度条的经典实现。处理大批量数据时，这种技巧能让用户感知程序仍在运行，避免误以为卡死。

## 2.10.7 输出到文件

`print()` 的 `file` 参数指定输出目标，默认是 `sys.stdout`（标准输出，即屏幕）。传入一个打开的文件对象后，`print()` 的内容会写入文件而不是屏幕。这是初识文件操作的入口，更完整的文件读写会在后续章节展开。

```python
# 打开文件用于写入（"w" 模式会清空原文件）
with open("user_log.txt", "w", encoding="utf-8") as f:
    print("用户日志", file=f)
    print("姓名: 张三", file=f)
    print("年龄: 45", file=f)
    print(f"评分: {24.7:.1f}", file=f)

# 追加模式 "a" 不会清空原文件
with open("user_log.txt", "a", encoding="utf-8") as f:
    print("---新记录---", file=f)
    print("姓名: 李四", file=f)
```

`with open(...) as f:` 是文件操作的标准写法，它会在代码块结束时自动关闭文件，即使中间发生异常也能保证资源释放。`encoding="utf-8"` 显式指定编码，避免 Windows 下默认用 GBK 编码导致中文乱码。处理含中文的数据时，这一参数几乎必加。

写入文件的另一种方式是直接调用文件对象的 `write()` 方法，但 `print()` 的好处是自带换行和分隔符，更接近控制台输出的习惯：

```python
with open("results.csv", "w", encoding="utf-8") as f:
    # 写入 CSV 表头
    print("user_id,name,age,role", file=f)
    # 写入数据行
    print("U001,张三,45,管理员", file=f)
    print("U002,李四,30,编辑", file=f)
```

::: note 编码选择
处理中文文本时，文件编码是常见坑源。Python 3 默认用 UTF-8，但 Windows 默认系统编码是 GBK，Excel 在 Windows 下打开 UTF-8 编码的 CSV 可能显示乱码。如果遇到这种问题，写文件时可以尝试 `encoding="utf-8-sig"`，它会在文件开头写入 BOM 标记，让 Excel 正确识别编码。
:::

## 2.10.8 综合示例：用户信息录入程序

把前面所有知识点串起来，写一个简单的用户信息录入程序。程序通过 `input()` 读取用户基本信息，做必要的类型转换和校验，计算出生年份，最后用 `print()` 格式化输出，并把记录写入日志文件。

```python
import os


def input_user():
    """录入一位用户的基本信息"""
    print("=" * 40)
    print("      用户信息录入系统")
    print("=" * 40)

    # 读取字符串字段
    name = input("请输入姓名：").strip()
    if not name:
        print("姓名不能为空")
        return None

    gender = input("请输入性别（男/女）：").strip()

    # 读取并转换数值字段
    try:
        age = int(input("请输入年龄："))
        height = float(input("请输入身高（cm）："))
        weight = float(input("请输入体重（kg）："))
    except ValueError:
        print("输入格式错误，年龄、身高、体重必须是数字")
        return None

    # 简单的合理性校验
    if not (0 < age < 150):
        print(f"年龄 {age} 不在合理范围")
        return None
    if not (50 < height < 250):
        print(f"身高 {height} 不在合理范围")
        return None

    # 计算出生年份
    CURRENT_YEAR = 2026
    birth_year = CURRENT_YEAR - age

    # 构造用户字典
    user = {
        "name": name,
        "gender": gender,
        "age": age,
        "height": height,
        "weight": weight,
        "birth_year": birth_year,
    }
    return user


def show_user(u):
    """格式化输出用户信息"""
    print()
    print("-" * 40)
    print("录入结果：")
    print(f"  姓名：{u['name']}")
    print(f"  性别：{u['gender']}")
    print(f"  年龄：{u['age']} 岁")
    print(f"  身高：{u['height']:.1f} cm")
    print(f"  体重：{u['weight']:.1f} kg")
    print(f"  出生年份：{u['birth_year']} 年", end="")

    # 根据出生年份给出简单分组
    if u["birth_year"] >= 2000:
        print("（00 后）")
    elif u["birth_year"] >= 1990:
        print("（90 后）")
    elif u["birth_year"] >= 1980:
        print("（80 后）")
    else:
        print("（80 前）")
    print("-" * 40)


def save_to_file(u, filename="users.csv"):
    """把用户记录追加写入 CSV 文件"""
    # 文件不存在或为空时先写表头
    need_header = not os.path.exists(filename) or os.path.getsize(filename) == 0
    with open(filename, "a", encoding="utf-8") as f:
        if need_header:
            print("name,gender,age,height,weight,birth_year", file=f)
        # 用 sep 参数拼接 CSV 行
        print(
            u["name"], u["gender"], u["age"],
            f"{u['height']:.1f}", f"{u['weight']:.1f}", u["birth_year"],
            sep=",", file=f
        )
    print(f"已保存到 {filename}")


# 主流程
if __name__ == "__main__":
    user = input_user()
    if user:
        show_user(user)
        save_to_file(user)
```

运行这个程序时，控制台交互大致如下：

```text
========================================
      用户信息录入系统
========================================
请输入姓名：张三
请输入性别（男/女）：男
请输入年龄：45
请输入身高（cm）：170
请输入体重（kg）：70

----------------------------------------
录入结果：
  姓名：张三
  性别：男
  年龄：45 岁
  身高：170.0 cm
  体重：70.0 kg
  出生年份：1981 年（80 后）
----------------------------------------
已保存到 users.csv
```

这个示例综合运用了 `input()` 读取、`int()` 和 `float()` 类型转换、`try/except` 异常处理、f-string 格式化输出、`print()` 的 `sep` 和 `file` 参数、文件追加写入等内容。它是一个完整的小型数据处理脚本骨架，后续学习函数、列表、字典、异常等章节后，可以在此基础上扩展更复杂的功能，比如批量录入、数据查询、统计汇总。

把这几个知识点想清楚，你就掌握了 Python 与人交互、与文件交互的基本能力。后续章节会展开更高级的话题，底层的输入输出逻辑始终是这一节奠定的。
