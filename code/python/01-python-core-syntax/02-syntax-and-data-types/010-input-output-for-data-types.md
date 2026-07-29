---
title: 2.10 输入输出与基本交互
sidebar:
  order: 10
---
# 2.10 输入输出与基本交互

<span class="chapter-tag">Python核心语法基础</span>

程序的价值在于与外部世界交互。输入从用户或文件流入程序，输出从程序流向屏幕或文件。Python 提供了简洁的 `print()` 和 `input()` 两个函数完成基本的控制台交互，足以支撑大多数医学数据处理脚本的原型开发。本节从这两个函数出发，覆盖多对象输出、格式化、字符串读取、类型转换、自定义对象打印、文件输出等场景，最后用一个完整的患者信息录入程序把所有知识点串起来。

## 2.10.1 print() 输出多个对象

`print()` 可以同时输出多个对象，默认用空格分隔，末尾自动换行。这两个行为可以通过 `sep` 和 `end` 参数自定义。

```python
# 默认用空格分隔
print("患者姓名:", "张三", "年龄:", 45)
# 输出：患者姓名: 张三 年龄: 45

# 用 sep 自定义分隔符
print("2024", "01", "15", sep="-")
# 输出：2024-01-15

# 用空字符串连成一片
print("心率", "120", "bpm", sep="")
# 输出：心率120bpm

# 多个值拼成 CSV 行
print("P001", "张三", "45", "男", sep=",")
# 输出：P001,张三,45,男
```

`sep` 参数对生成结构化文本特别有用。处理临床数据时，把字段用逗号或制表符分隔输出，就得到了 CSV 或 TSV 格式的雏形。

`end` 参数控制每次 `print()` 结束后追加什么字符，默认是换行符 `\n`。改成空字符串可以让多次 `print()` 在同一行输出，下一节会专门讨论换行控制。

## 2.10.2 print() 格式化输出

Python 有三种字符串格式化方式，推荐使用 **f-string**（Python 3.6+），它简洁直观。需要兼容旧版本时用 `str.format()`，`%` 格式化仅在阅读老代码时需要识别。

### f-string

f-string 在字符串前加 `f` 或 `F`，用 `{}` 包裹表达式，表达式会被求值并插入字符串：

```python
name = "张三"
age = 45
bmi = 24.7

# 基本用法
print(f"患者 {name}，年龄 {age} 岁")
# 输出：患者 张三，年龄 45 岁

# 表达式可以直接写在花括号里
print(f"BMI 指数：{bmi:.1f}")
# 输出：BMI 指数：24.7

# 对齐与宽度
print(f"{name:>10}")       # 右对齐，宽度 10
print(f"{name:<10}")       # 左对齐
print(f"{name:^10}")       # 居中
print(f"{age:0>3}")        # 用 0 填充到 3 位：045

# 数值格式化
print(f"体重指数 {bmi:.2f}")       # 保留 2 位小数：24.70
print(f"百分比 {0.875:.1%}")       # 百分比：87.5%
print(f"科学计数 {1234567:.2e}")   # 1.23e+06
```

格式说明符的语法是 `:填充对齐宽度.精度类型`，其中 `>` 右对齐、`<` 左对齐、`^` 居中。`.2f` 表示保留两位小数，`.1%` 表示转成百分比保留一位小数。

### str.format()

`str.format()` 用 `{}` 作占位符，参数按顺序填入：

```python
print("{0} 患者 {1} 岁，BMI {2:.1f}".format(name, age, bmi))
# 张三 患者 45 岁，BMI 24.7

# 也可以用关键字参数
print("{name} 的年龄是 {age}".format(name="李四", age=30))
```

f-string 在大多数场景下比 `format()` 更清晰，新代码应优先使用 f-string。

### 常用医学数值格式

```python
# 浓度保留 3 位有效数字
concentration = 0.001234
print(f"浓度 {concentration:.3e} mol/L")  # 1.234e-03 mol/L

# 体重保留 1 位小数
weight = 65.437
print(f"体重 {weight:.1f} kg")  # 65.4 kg

# p 值用科学计数法
p_value = 0.000034
print(f"p = {p_value:.2e}")  # p = 3.40e-05

# 大数字加千位分隔
population = 1400000000
print(f"人口 {population:,}")  # 1,400,000,000
```

## 2.10.3 input() 读取字符串

`input()` 从标准输入读取一行文本，返回的是**字符串**，无论用户输入的是什么。这是初学者最常踩的坑：用户输入 `45`，程序得到的是 `"45"` 这个字符串，不是整数 45。

```python
name = input("请输入患者姓名：")
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

由于 `input()` 总是返回字符串，处理数字输入时必须显式转换。最常见的两种用法是 `int(input())` 和 `float(input())`，前者用于整数输入如年龄、病房号，后者用于浮点输入如体温、血压、检验值。

```python
# 整数输入
age = int(input("年龄："))
ward_no = int(input("病房号："))

# 浮点输入
temperature = float(input("体温（℃）："))
weight = float(input("体重（kg）："))
systolic = float(input("收缩压（mmHg）："))

# 计算并输出
if temperature > 37.3:
    print(f"体温 {temperature}℃，提示发热")
```

### 一次读入多个值

如果一行输入多个值（用空格或逗号分隔），需要先 `split()` 再逐个转换：

```python
# 输入格式：身高 体重，例如 170 65
line = input("请输入身高(cm)和体重(kg)，空格分隔：")
parts = line.split()
height = float(parts[0])
weight = float(parts[1])
bmi = weight / (height / 100) ** 2
print(f"BMI = {bmi:.1f}")
```

`split()` 不带参数时按任意空白（包括多个空格、Tab）分割，并自动去除首尾空白，比按固定字符分割更宽容。如果用逗号分隔，写成 `line.split(",")`，但要注意用户可能输入 `"170, 65"` 带了空格，转换前应该 `strip()` 去掉空格。

```python
line = input("请输入姓名,年龄,性别（逗号分隔）：")
fields = [f.strip() for f in line.split(",")]
name, age, gender = fields
age = int(age)
print(f"录入：{name}, {age}岁, {gender}")
```

## 2.10.5 print() 对象的默认表示

`print()` 输出对象时，会调用对象的 `__str__` 方法获取字符串表示。如果对象没有定义 `__str__`，则回退到 `__repr__`，两者都没有时会显示类似 `<__main__.Patient object at 0x7f...>` 的默认表示，对调试毫无帮助。

```python
class Patient:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Patient("张三", 45)
print(p)  # <__main__.Patient object at 0x7f8a3b2c4d60>
```

这种输出对开发者不友好，对患者更不友好。**自定义类应该实现 `__str__` 方法**，让 `print()` 能输出有意义的字符串：

```python
class Patient:
    def __init__(self, name, age, diagnosis):
        self.name = name
        self.age = age
        self.diagnosis = diagnosis

    def __str__(self):
        return f"[患者] {self.name}（{self.age}岁） 诊断：{self.diagnosis}"

p = Patient("张三", 45, "2 型糖尿病")
print(p)  # [患者] 张三（45岁） 诊断：2 型糖尿病
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
with open("patient_log.txt", "w", encoding="utf-8") as f:
    print("患者日志", file=f)
    print("姓名: 张三", file=f)
    print("年龄: 45", file=f)
    print(f"BMI: {24.7:.1f}", file=f)

# 追加模式 "a" 不会清空原文件
with open("patient_log.txt", "a", encoding="utf-8") as f:
    print("---新记录---", file=f)
    print("姓名: 李四", file=f)
```

`with open(...) as f:` 是文件操作的标准写法，它会在代码块结束时自动关闭文件，即使中间发生异常也能保证资源释放。`encoding="utf-8"` 显式指定编码，避免 Windows 下默认用 GBK 编码导致中文乱码。处理含中文的医学数据时，这一参数几乎必加。

写入文件的另一种方式是直接调用文件对象的 `write()` 方法，但 `print()` 的好处是自带换行和分隔符，更接近控制台输出的习惯：

```python
with open("results.csv", "w", encoding="utf-8") as f:
    # 写入 CSV 表头
    print("patient_id,name,age,diagnosis", file=f)
    # 写入数据行
    print("P001,张三,45,糖尿病", file=f)
    print("P002,李四,30,高血压", file=f)
```

::: note 编码选择
处理中文文本时，文件编码是常见坑源。Python 3 默认用 UTF-8，但 Windows 默认系统编码是 GBK，Excel 在 Windows 下打开 UTF-8 编码的 CSV 可能显示乱码。如果遇到这种问题，写文件时可以尝试 `encoding="utf-8-sig"`，它会在文件开头写入 BOM 标记，让 Excel 正确识别编码。
:::

## 2.10.8 综合示例：患者信息录入程序

把前面所有知识点串起来，写一个简单的患者信息录入程序。程序通过 `input()` 读取患者基本信息，做必要的类型转换和校验，计算 BMI，最后用 `print()` 格式化输出，并把记录写入日志文件。

```python
import os


def input_patient():
    """录入一位患者的基本信息"""
    print("=" * 40)
    print("      患者信息录入系统")
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

    # 计算 BMI
    bmi = weight / (height / 100) ** 2

    # 构造患者字典
    patient = {
        "name": name,
        "gender": gender,
        "age": age,
        "height": height,
        "weight": weight,
        "bmi": bmi,
    }
    return patient


def show_patient(p):
    """格式化输出患者信息"""
    print()
    print("-" * 40)
    print("录入结果：")
    print(f"  姓名：{p['name']}")
    print(f"  性别：{p['gender']}")
    print(f"  年龄：{p['age']} 岁")
    print(f"  身高：{p['height']:.1f} cm")
    print(f"  体重：{p['weight']:.1f} kg")
    print(f"  BMI ：{p['bmi']:.1f}", end="")

    # 根据 BMI 给出简单分类
    if p["bmi"] < 18.5:
        print("（偏瘦）")
    elif p["bmi"] < 24:
        print("（正常）")
    elif p["bmi"] < 28:
        print("（超重）")
    else:
        print("（肥胖）")
    print("-" * 40)


def save_to_file(p, filename="patients.csv"):
    """把患者记录追加写入 CSV 文件"""
    # 文件不存在或为空时先写表头
    need_header = not os.path.exists(filename) or os.path.getsize(filename) == 0
    with open(filename, "a", encoding="utf-8") as f:
        if need_header:
            print("name,gender,age,height,weight,bmi", file=f)
        # 用 sep 参数拼接 CSV 行
        print(
            p["name"], p["gender"], p["age"],
            f"{p['height']:.1f}", f"{p['weight']:.1f}", f"{p['bmi']:.1f}",
            sep=",", file=f
        )
    print(f"已保存到 {filename}")


# 主流程
if __name__ == "__main__":
    patient = input_patient()
    if patient:
        show_patient(patient)
        save_to_file(patient)
```

运行这个程序时，控制台交互大致如下：

```text
========================================
      患者信息录入系统
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
  BMI ：24.2（超重）
----------------------------------------
已保存到 patients.csv
```

这个示例综合运用了 `input()` 读取、`int()` 和 `float()` 类型转换、`try/except` 异常处理、f-string 格式化输出、`print()` 的 `sep` 和 `file` 参数、文件追加写入等内容。它是一个完整的小型数据处理脚本骨架，后续学习函数、列表、字典、异常等章节后，可以在此基础上扩展更复杂的功能，比如批量录入、数据查询、统计汇总。

把这几个知识点想清楚，你就掌握了 Python 与人交互、与文件交互的基本能力。后续章节会展开更高级的话题，底层的输入输出逻辑始终是这一节奠定的。
